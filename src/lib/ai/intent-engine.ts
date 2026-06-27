import { generateObject, generateText } from 'ai';
import { withFallback } from './model-provider';
import { z } from 'zod';

// ─── Structured Intent Schema ─────────────────────────────────────────────────
// Defines the exact shape of what the AI must return.
// The ActionPlanner only operates on this schema — never raw text.

export const IntentSchema = z.object({
  intent: z.enum([
    'create_task',
    'reschedule_tasks',
    'task_decomposition',
    'get_schedule',
    'report_status',
    'conversational',
    'unknown'
  ]),
  extractedData: z.object({
    title: z.string().optional(),
    description: z.string().optional().describe("Any additional details, notes, or descriptions of the task."),
    durationMinutes: z.number().optional(),
    targetDateIso: z.string().optional().describe("The target date in ISO format (YYYY-MM-DD), resolved from relative terms like 'today' or 'tomorrow' using the current date."),
    startTimeString: z.string().optional().describe("Specific start time of the task in 24-hour format (e.g., '14:00', '16:00', '09:30', '18:00'), extracted from relative times like 'from 4 to 5' (16:00), 'at 4' (16:00), 'from 2 to 3' (14:00), or 'at 5 PM' (17:00)."),
    category: z.string().optional().describe("Task category (e.g., 'Work', 'Personal', 'Health', 'General', 'Study')."),
    priority: z.enum(['Low', 'Medium', 'High']).optional().describe("Task priority level."),
    recurringRule: z.string().optional().describe("Recurrence rule (e.g. 'Daily', 'Weekly', 'Monthly', 'One-time') if the user asks for a recurring task (e.g. 'weekly bill payment' -> 'Weekly', 'daily checkin' -> 'Daily')."),
    topic: z.string().optional(),
  }).optional(),
  conversationalReply: z.string().optional().describe("If the user is just saying hello, asking a general question, or confirming a previous action (like 'yes', 'sure', 'lock it in'), the AI can provide a quick reply here."),
});

export type ParsedIntent = z.infer<typeof IntentSchema>;

export class IntentEngine {
  /**
   * Converts natural language into a structured intent.
   * Uses Groq (14,400 RPD) as primary — this is called on every message.
   * Falls back through the model chain automatically on failure.
   */
  static async parseIntent(userMessage: string, history: any[] = [], referenceDateIso?: string): Promise<ParsedIntent> {
    try {
      const result = await withFallback('intent_parsing', async (model) => {
        const refDate = referenceDateIso ? new Date(referenceDateIso) : new Date();

        const isGroq = model.modelId && (model.modelId.includes('llama') || model.modelId.includes('mixtral') || model.modelId.includes('groq'));
        if (isGroq) {
          const schemaInstructions = `
You must return a valid JSON object matching the following structure:
{
  "intent": "create_task" | "task_decomposition" | "get_schedule" | "reschedule_tasks" | "report_status" | "conversational" | "unknown",
  "extractedData": {
    "title": string (optional),
    "description": string (optional),
    "durationMinutes": number (optional),
    "targetDateIso": string (optional, YYYY-MM-DD format),
    "startTimeString": string (optional, HH:MM 24-hour format),
    "category": string (optional),
    "priority": "Low" | "Medium" | "High" (optional),
    "recurringRule": "Daily" | "Weekly" | "Monthly" | "One-time" (optional),
    "topic": string (optional)
  },
  "conversationalReply": string (optional)
}
`;
          const systemPrompt = `You are the Intent Engine for ChiefOS, a deterministic productivity system.
            Your ONLY job is to classify the user's message into an executable intent.
            Extract any relevant data (durations, titles, dates, specific start times, description, priority, recurrence).
            
            REFERENCE DATE AND TIME context for this request: ${refDate.toString()} (ISO: ${refDate.toISOString()})
            Use this reference date to resolve relative date terms like "today", "tomorrow", "yesterday", "next Monday", etc.
            
            CRITICAL RULES:
            1. If the user is responding with a confirmation (like "yes", "sure", "ok", "lock it in", "confirm") to a previous message, classify the intent as "conversational" and output a warm confirmation reply in conversationalReply. Do NOT classify it as "create_task" or "reschedule_tasks" because those tasks have already been processed in the history.
            2. If the user specifies a particular time window or hour (e.g., "from 4 to 5 today", "at 4", "4-5", "between 2 and 3"), extract the start hour as startTimeString (e.g., "16:00", "14:00") and calculate the durationMinutes accordingly (e.g., "from 4 to 5" is 60 minutes).
            3. If time numbers are specified without AM/PM (e.g., "from 4 to 5", "at 4"), assume PM hours (afternoon/evening, i.e., 4 -> "16:00", 2 -> "14:00") by default unless "AM" or "morning" is explicitly specified.
            4. If the user specifies that a task is recurring (e.g. "weekly bill payment", "daily gym session", "every Monday reading"), extract recurringRule as "Daily", "Weekly", "Monthly", or "Custom" depending on the frequency.
            5. If the user is making casual conversation, use intent="conversational" and provide a conversationalReply.
            
            ${schemaInstructions}
            
            Return ONLY the valid JSON object. No other text, no markdown backticks.`;

          const { text } = await generateText({
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
          const { object } = await generateObject({
            model,
            schema: IntentSchema,
            system: `You are the Intent Engine for ChiefOS, a deterministic productivity system.
            Your ONLY job is to classify the user's message into an executable intent.
            Extract any relevant data (durations, titles, dates, specific start times).
            
            REFERENCE DATE AND TIME context for this request: ${refDate.toString()} (ISO: ${refDate.toISOString()})
            Use this reference date to resolve relative date terms like "today", "tomorrow", "yesterday", "next Monday", etc.
            
            CRITICAL RULES:
            1. If the user is responding with a confirmation (like "yes", "sure", "ok", "lock it in", "confirm") to a previous message, classify the intent as "conversational" and output a warm confirmation reply in conversationalReply. Do NOT classify it as "create_task" or "reschedule_tasks" because those tasks have already been processed in the history.
            2. If the user specifies a particular time window or hour (e.g., "from 4 to 5 today", "at 4", "4-5", "between 2 and 3"), extract the start hour as startTimeString (e.g., "16:00", "14:00") and calculate the durationMinutes accordingly (e.g., "from 4 to 5" is 60 minutes).
            3. If time numbers are specified without AM/PM (e.g., "from 4 to 5", "at 4"), assume PM hours (afternoon/evening, i.e., 4 -> "16:00", 2 -> "14:00") by default unless "AM" or "morning" is explicitly specified.
            4. If the user specifies that a task is recurring (e.g. "weekly bill payment", "daily gym session", "every Monday reading"), extract recurringRule as "Daily", "Weekly", "Monthly", or "Custom" depending on the frequency.
            5. If the user is making casual conversation, use intent="conversational" and provide a conversationalReply.`,
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
      // Deterministic fallback: return a safe unknown intent
      return { intent: 'unknown' };
    }
  }
}
