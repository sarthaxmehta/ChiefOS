import { generateObject, generateText } from 'ai';
import { withFallback } from './model-provider';
import { z } from 'zod';

// ─── Structured Intent Schema ─────────────────────────────────────────────────
// Maps directly to the Mission model in prisma/schema.prisma.
// The AI must extract as many of these fields as possible from natural language.

export const IntentSchema = z.object({
  intent: z.enum([
    'create_task',
    'reschedule_tasks',
    'task_decomposition',
    'get_schedule',
    'report_status',
    'conversational',
    'unknown'
  ]).describe("The classified intent of the user's message."),

  extractedData: z.object({
    // ─── Core Mission Fields (from prisma schema) ───
    title: z.string().optional()
      .describe("The task/mission title. Extract the core activity name, cleaned up."),
    description: z.string().optional()
      .describe("Any additional details, notes, or context about the task."),
    
    // ─── Time Fields ───
    targetDateIso: z.string().optional()
      .describe("The target date in YYYY-MM-DD format, resolved from relative terms like 'today', 'tomorrow', 'next Monday', '30th of every month' (use next occurrence)."),
    startTimeString: z.string().optional()
      .describe("Start time in HH:MM 24-hour format. E.g. 'from 4 to 5' → '16:00', 'at 9 AM' → '09:00', 'at 5 PM' → '17:00'. Only set if user specifies a time."),
    endTimeString: z.string().optional()
      .describe("End time in HH:MM 24-hour format. E.g. 'from 4 to 5' → '17:00'. Only set if user specifies an end time."),
    durationMinutes: z.number().optional()
      .describe("Duration in minutes. Calculate from start/end if both given. Default to 30 for quick tasks, 60 for standard tasks."),
    
    // ─── Classification Fields (from prisma schema) ───
    priority: z.enum(['Low', 'Medium', 'High']).optional()
      .describe("Priority level. 'urgent'/'important'/'critical' → High, 'normal' → Medium, 'low'/'whenever' → Low. Default to Medium if unclear."),
    category: z.string().optional()
      .describe("Category: 'Work', 'Personal', 'Health', 'Finance', 'Study', 'Social', 'Shopping', 'Admin', 'General'. Infer from context."),
    type: z.enum(['Focus', 'Meeting', 'Break', 'Admin', 'Personal']).optional()
      .describe("Task type. 'meeting'/'call'/'sync' → Meeting, 'gym'/'walk'/'lunch' → Break, 'email'/'invoice'/'filing' → Admin, 'study'/'code'/'write'/'design' → Focus. Default to Focus."),
    energyRequired: z.enum(['Low', 'Medium', 'High']).optional()
      .describe("Energy level needed. Deep work/coding/writing → High, meetings/calls → Medium, email/admin/errands → Low."),
    color: z.string().optional()
      .describe("Color tag: 'Red' (urgent/important), 'Blue' (work), 'Green' (personal/health), 'Yellow' (finance), 'Purple' (study), 'Orange' (social). Infer from context."),
    
    // ─── Recurrence (from prisma schema) ───
    recurringRule: z.string().optional()
      .describe("Recurrence: 'Daily', 'Weekly', 'Monthly', 'One-time'. Detect from keywords: 'every day'/'daily' → Daily, 'every week'/'weekly' → Weekly, 'every month'/'monthly' → Monthly."),
    
    // ─── Tags & Extras ───
    tags: z.string().optional()
      .describe("Comma-separated tags extracted from context, e.g. 'coding,frontend' or 'health,gym'."),
    topic: z.string().optional()
      .describe("For task_decomposition: the topic to break down."),
  }).optional(),

  conversationalReply: z.string().optional()
    .describe("If intent is 'conversational', provide a warm, helpful reply here."),
});

export type ParsedIntent = z.infer<typeof IntentSchema>;

// ─── Shared System Prompt ───────────────────────────────────────────────────
function buildSystemPrompt(refDate: Date, schemaBlock: string = ''): string {
  return `You are the Intent Engine for ChiefOS, an AI-powered productivity system.
Your job is to classify the user's message into an executable intent and extract ALL relevant data to populate a task/mission record.

CURRENT DATE AND TIME: ${refDate.toString()} (ISO: ${refDate.toISOString()})
Use this to resolve relative dates: "today" → ${refDate.toISOString().split('T')[0]}, "tomorrow" → next day, etc.

INTENT CLASSIFICATION RULES:
- "create_task": User wants to create, add, schedule, or remember a task/reminder/event.
- "reschedule_tasks": User wants to move, postpone, or reschedule an existing task. Must mention an existing task by name.
- "task_decomposition": User wants to break down or decompose a complex task into subtasks. Keywords: "decompose", "break down", "split into steps".
- "get_schedule": User wants to SEE their schedule/tasks for a specific day. Keywords: "what's on my schedule", "show my tasks", "what do I have today/tomorrow".
- "report_status": User wants a SUMMARY of their overall workload/productivity/progress. Keywords: "how busy am I", "status update", "how am I doing", "workload summary", "progress report".
- "conversational": Greetings, general questions, confirmations ("yes", "ok", "lock it in", "sure", "confirm"), or casual chat.
- "unknown": Cannot determine intent.

CRITICAL DISTINCTIONS:
- "what's my schedule today?" → get_schedule (asking to LIST tasks for a day)
- "how busy am I?" → report_status (asking for WORKLOAD ASSESSMENT)
- "how am I doing?" → report_status (asking for PROGRESS SUMMARY)
- "show my tasks for tomorrow" → get_schedule (asking to SEE tasks)

DATA EXTRACTION RULES:
1. Extract as many fields as possible from context. Infer category, priority, color, type, energyRequired when not explicitly stated.
2. For times without AM/PM: numbers 1-6 default to PM (13:00-18:00), 7-12 default to AM (07:00-12:00) unless context suggests otherwise.
3. If user says "from X to Y", set both startTimeString and endTimeString, and calculate durationMinutes.
4. If user only says "at X", set startTimeString only; durationMinutes defaults based on task type.
5. For recurring tasks (weekly, daily, monthly), set recurringRule. Use the next occurrence for targetDateIso.
6. For confirmations ("yes", "sure", "ok", "lock it in"), use intent="conversational" — do NOT create a new task.
7. For task decomposition, put the topic/task name in BOTH "title" and "topic" fields.

${schemaBlock}

Return ONLY the valid JSON object. No markdown, no backticks, no explanation.`;
}

export class IntentEngine {
  /**
   * Converts natural language into a structured intent.
   * Uses Groq (14,400 RPD) as primary, falls back through model chain.
   */
  static async parseIntent(userMessage: string, history: any[] = [], referenceDateIso?: string): Promise<ParsedIntent> {
    try {
      const result = await withFallback('intent_parsing', async (model) => {
        const refDate = referenceDateIso ? new Date(referenceDateIso) : new Date();

        const isGroq = model.modelId && (model.modelId.includes('llama') || model.modelId.includes('mixtral') || model.modelId.includes('groq'));
        if (isGroq) {
          const schemaInstructions = `
You must return a valid JSON object with this structure:
{
  "intent": "create_task" | "reschedule_tasks" | "task_decomposition" | "get_schedule" | "report_status" | "conversational" | "unknown",
  "extractedData": {
    "title": string (optional),
    "description": string (optional),
    "targetDateIso": "YYYY-MM-DD" (optional),
    "startTimeString": "HH:MM" (optional, 24-hour),
    "endTimeString": "HH:MM" (optional, 24-hour),
    "durationMinutes": number (optional),
    "priority": "Low" | "Medium" | "High" (optional),
    "category": string (optional),
    "type": "Focus" | "Meeting" | "Break" | "Admin" | "Personal" (optional),
    "energyRequired": "Low" | "Medium" | "High" (optional),
    "color": string (optional),
    "recurringRule": "Daily" | "Weekly" | "Monthly" | "One-time" (optional),
    "tags": string (optional, comma-separated),
    "topic": string (optional, for decomposition)
  },
  "conversationalReply": string (optional)
}`;
          const systemPrompt = buildSystemPrompt(refDate, schemaInstructions);

          const { text } = await (generateText as any)({
            model,
            system: systemPrompt,
            messages: [
              ...history,
              { role: 'user', content: userMessage }
            ],
            responseFormat: { type: 'json' }
          });

          let cleaned = text.trim();
          if (cleaned.startsWith("```json")) {
            cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
          } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
          }

          return JSON.parse(cleaned) as ParsedIntent;
        } else {
          const systemPrompt = buildSystemPrompt(refDate);
          const { object } = await generateObject({
            model,
            schema: IntentSchema,
            system: systemPrompt,
            messages: [
              ...history,
              { role: 'user' as const, content: userMessage }
            ]
          });
          return object;
        }
      });

      return result;
    } catch (error) {
      console.error("[IntentEngine] All models failed:", error);
      return { intent: 'unknown' };
    }
  }
}
