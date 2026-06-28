import { generateObject, generateText } from 'ai';
import { withFallback } from './model-provider';
import { z } from 'zod';

// ─── Structured Intent Schema ─────────────────────────────────────────────────
// Maps directly to the Mission model in prisma/schema.prisma.
// The AI must extract as many of these fields as possible from natural language.

export const IntentSchema = z.object({
  intent: z.enum([
    'create_task',
    'add_subtasks',       // Add subtasks to an EXISTING task (never creates a new one)
    'delete_task',        // Delete/remove an existing task by title
    'reschedule_tasks',   // Move an existing task to a new time/date
    'complete_task',      // Mark an existing task as done / completed
    'update_task',        // Partial update: priority, notes, category, description, color, etc.
    'list_tasks',         // Show/list tasks — optionally filtered by status, priority, category, date
    'clear_schedule',     // Delete all scheduled blocks for a given day (unschedule, not delete missions)
    'task_decomposition', // Break a topic into subtasks (informational, may or may not save)
    'get_schedule',       // Show the calendar/timeline for a specific day
    'report_status',      // High-level workload summary
    'conversational',
    'unknown'
  ]).describe("The classified intent of the user's message."),

  extractedData: z.object({

    // ─── Core Mission Fields (from prisma schema) ───────────────────────────
    title: z.string().optional()
      .describe("The task/mission title. For add_subtasks/delete_task/reschedule_tasks/complete_task/update_task this is the EXISTING task to find. For create_task this is the new task name."),
    description: z.string().optional()
      .describe("Any additional details, notes, or context about the task."),

    // ─── Newly supported Mission columns ────────────────────────────────────
    context: z.string().optional()
      .describe("Business or personal context for the task. E.g. 'for the Q3 product launch', 'client is TechCorp', 'exam on Friday'. Capture the WHY or situation behind the task."),
    preferredTime: z.enum(['Morning', 'Afternoon', 'Evening', 'Night']).optional()
      .describe("Preferred time of day. 'morning'/'early' → Morning, 'afternoon'/'midday' → Afternoon, 'evening'/'after work' → Evening, 'night'/'late' → Night. Only set if user indicates a time-of-day preference."),
    notes: z.string().optional()
      .describe("Free-form notes the user wants attached to the task. E.g. 'bring laptop', 'call John first', 'review doc before attending'."),

    // ─── Time Fields ────────────────────────────────────────────────────────
    targetDateIso: z.string().optional()
      .describe("The target date in YYYY-MM-DD format. Resolve relative terms: 'today', 'tomorrow', 'next Monday', 'this Friday', 'end of the week' (Friday), 'in 3 days', 'next week'. Always output YYYY-MM-DD."),
    startTimeString: z.string().optional()
      .describe("Start time in HH:MM 24-hour format. 'from 4 to 5' → '16:00', 'at 9 AM' → '09:00', 'at 5 PM' → '17:00', '2 o\'clock' → '14:00'. Only set if user specifies a time."),
    endTimeString: z.string().optional()
      .describe("End time in HH:MM 24-hour format. 'from 4 to 5' → '17:00'. Only set if user specifies an end time."),
    durationMinutes: z.number().optional()
      .describe("Duration in MINUTES. Parse all formats: '30 min'/'half an hour' → 30, '1 hour'/'60 min' → 60, '2 hours' → 120, '1.5 hours'/'90 min' → 90, '3 hour meeting' → 180. Calculate from start/end if both given. Default to 30 for quick tasks, 60 for standard tasks, 90 for deep work."),

    // ─── Classification Fields (from prisma schema) ──────────────────────────
    priority: z.enum(['Low', 'Medium', 'High']).optional()
      .describe("Priority level. 'urgent'/'important'/'critical'/'asap'/'high priority' → High, 'normal' → Medium, 'low'/'whenever'/'someday' → Low. Default to Medium if unclear."),
    category: z.string().optional()
      .describe("Category: 'Work', 'Personal', 'Health', 'Finance', 'Study', 'Social', 'Shopping', 'Admin', 'General'. Infer from context."),
    type: z.enum(['Focus', 'Meeting', 'Break', 'Admin', 'Personal']).optional()
      .describe("Task type. 'meeting'/'call'/'sync'/'interview'/'catch up' → Meeting, 'gym'/'walk'/'lunch'/'nap'/'rest'/'workout' → Break, 'email'/'invoice'/'filing'/'paperwork' → Admin, 'study'/'code'/'write'/'design'/'deep work'/'research' → Focus. Default to Focus."),
    energyRequired: z.enum(['Low', 'Medium', 'High']).optional()
      .describe("Energy level needed. Deep work/coding/writing/research → High, meetings/calls/planning → Medium, email/admin/errands/grocery → Low."),
    color: z.string().optional()
      .describe("Color tag: 'Red' (urgent/critical), 'Blue' (work/coding), 'Green' (personal/health/gym), 'Yellow' (finance/money), 'Purple' (study/learning), 'Orange' (social/meetings). Infer from category and priority."),

    // ─── Recurrence (from prisma schema) ────────────────────────────────────
    recurringRule: z.string().optional()
      .describe("Recurrence: 'Daily', 'Weekly', 'Monthly', 'One-time'. Detect from: 'every day'/'daily'/'each morning' → Daily, 'every week'/'weekly'/'every Monday' → Weekly, 'every month'/'monthly'/'30th of every month' → Monthly."),

    // ─── Tags & Extras ───────────────────────────────────────────────────────
    tags: z.string().optional()
      .describe("Comma-separated tags extracted from context, e.g. 'coding,frontend,react' or 'health,gym,strength'."),
    topic: z.string().optional()
      .describe("For task_decomposition: the topic or project name to break down."),

    // ─── Subtasks (for add_subtasks intent) ─────────────────────────────────
    subtasks: z.array(z.string()).optional()
      .describe("For add_subtasks intent: list of subtask titles to add to the existing task. Extract these from the user's message."),

    // ─── Update Fields (for update_task intent) ──────────────────────────────
    newStatus: z.enum(['Pending', 'In Progress', 'Completed', 'Cancelled', 'On Hold']).optional()
      .describe("For complete_task/update_task: the new status to set. 'done'/'finished'/'completed'/'mark complete' → Completed, 'start'/'working on' → In Progress, 'cancel'/'abort' → Cancelled, 'hold'/'pause' → On Hold."),
    newPriority: z.enum(['Low', 'Medium', 'High']).optional()
      .describe("For update_task: the NEW priority to set on an existing task. 'bump to high'/'urgent now'/'raise priority' → High."),
    newCategory: z.string().optional()
      .describe("For update_task: the NEW category to set on an existing task."),
    newNotes: z.string().optional()
      .describe("For update_task: notes to add/replace on an existing task. Triggered by 'add a note to X', 'note: Y'."),
    newColor: z.string().optional()
      .describe("For update_task: the NEW color tag to set."),

    // ─── List Filters (for list_tasks intent) ───────────────────────────────
    filterStatus: z.enum(['Pending', 'In Progress', 'Completed', 'Cancelled', 'On Hold']).optional()
      .describe("For list_tasks: filter by status. 'pending tasks'/'outstanding' → Pending, 'completed' → Completed."),
    filterPriority: z.enum(['Low', 'Medium', 'High']).optional()
      .describe("For list_tasks: filter by priority. 'high priority tasks' → High."),
    filterCategory: z.string().optional()
      .describe("For list_tasks: filter by category. 'show all work tasks' → Work."),

    // ─── Location & Attendees (for calendar events / meetings) ───────────────
    location: z.string().optional()
      .describe("Physical or virtual meeting location. 'in the boardroom', 'Zoom', 'Google Meet', 'at the gym', 'conference room B'."),
    attendees: z.string().optional()
      .describe("Comma-separated list of attendees or people involved. 'with John and Sarah' → 'John,Sarah', 'with the design team' → 'Design Team'."),

  }).optional(),

  conversationalReply: z.string().optional()
    .describe("If intent is 'conversational', provide a warm, helpful, executive-assistant-style reply here."),
});

export type ParsedIntent = z.infer<typeof IntentSchema>;

// ─── Shared System Prompt ──────────────────────────────────────────────────────
function buildSystemPrompt(refDate: Date, schemaBlock: string = ''): string {
  const todayStr = refDate.toISOString().split('T')[0];
  const tomorrow = new Date(refDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const dayOfWeek = refDate.toLocaleDateString('en-US', { weekday: 'long' });

  return `You are the Intent Engine for ChiefOS, an AI-powered executive productivity system.
Your job is to classify the user's message into an executable intent and extract ALL available data fields.

CURRENT DATE AND TIME: ${refDate.toString()}
ISO: ${refDate.toISOString()}
Today is ${dayOfWeek}, ${todayStr}. Tomorrow is ${tomorrowStr}.

DATE RESOLUTION RULES (CRITICAL — always resolve to YYYY-MM-DD):
- "today" → ${todayStr}
- "tomorrow" → ${tomorrowStr}
- "this [weekday]" / "next [weekday]" → calculate the upcoming occurrence
- "end of the week" / "this Friday" → calculate upcoming Friday
- "in N days" → add N days to today
- "next week" → Monday of next week
- If no date given → use ${todayStr}

DURATION PARSING (CRITICAL — output as MINUTES):
- "30 min" / "half an hour" → 30
- "1 hour" / "an hour" → 60
- "1.5 hours" / "90 min" / "an hour and a half" → 90
- "2 hours" → 120
- "3 hour meeting" → 180
- If start & end time given → calculate end - start in minutes

TIME PARSING RULES:
- Numbers 1–6 without AM/PM → PM (4 → 16:00, 2 → 14:00, 5 → 17:00)
- Numbers 7–12 without AM/PM → AM (9 → 09:00, 10 → 10:00)
- "noon" → 12:00, "midnight" → 00:00
- "from X to Y" → set startTimeString and endTimeString, calculate durationMinutes

INTENT CLASSIFICATION RULES:

- "create_task": User wants to CREATE a NEW task/event/meeting.
  Examples: "schedule a meeting", "add a gym session tomorrow at 6 AM", "create a task to study DSA for 2 hours", "remind me to pay electricity bill monthly", "book a 3 hour deep work session on Friday".

- "add_subtasks": User wants to ADD SUBTASKS to an EXISTING task. NEVER create a new task.
  Examples: "add subtasks to ChiefOS project", "break down my meeting with Mike into: intro, demo, Q&A", "add steps to the DSA task".
  → title = existing task name, subtasks = list of step titles.

- "delete_task": User wants to DELETE or REMOVE an existing task.
  Examples: "delete the gym session", "remove tomorrow's standup", "cancel my meeting with Sarah", "delete all tasks with Mike".
  → title = task name fragment to match.

- "reschedule_tasks": User wants to MOVE an existing task to a new time/date.
  Examples: "move gym to 7 AM", "reschedule my standup to Thursday", "push the meeting to next week", "shift code review to 3 PM tomorrow".

- "complete_task": User wants to MARK an existing task as DONE.
  Examples: "I finished the gym session", "mark ChiefOS task as done", "complete the DSA study", "done with meeting", "check off electricity bill".
  → title = task, newStatus = "Completed".

- "update_task": User wants to UPDATE a specific FIELD on an existing task (not reschedule, not complete).
  Examples: "bump DSA study to high priority", "change gym category to Health", "add a note to my meeting: bring laptop", "make the standup blue", "set ChiefOS to in progress".
  → Extract which field changes. Set the appropriate new* field.

- "list_tasks": User wants to SEE / LIST tasks, optionally filtered.
  Examples: "show all my tasks", "list pending tasks", "what are my high priority tasks?", "show all work tasks", "list completed missions", "what tasks do I have this week?".
  → Set filter fields if specific filters are mentioned.

- "clear_schedule": User wants to UNSCHEDULE all time blocks for a given day (keeps missions, removes time slots).
  Examples: "clear my schedule for today", "free up tomorrow", "unschedule everything on Friday", "wipe Monday's calendar".

- "task_decomposition": User wants to conceptually BREAK DOWN a topic into steps.
  Examples: "decompose building a REST API", "break down writing a research paper into steps", "how do I approach learning machine learning?".

- "get_schedule": User wants to see their CALENDAR / TIMELINE for a specific day.
  Examples: "what's on my schedule today?", "show my calendar for tomorrow", "what do I have on Friday?".

- "report_status": User wants a WORKLOAD SUMMARY.
  Examples: "how busy am I?", "status update", "give me a briefing", "how am I doing this week?".

- "conversational": Greetings, acknowledgements, general questions not about tasks.
  Examples: "hi", "thanks", "yes", "ok", "sounds good", "that's perfect".

- "unknown": Cannot determine intent.

CRITICAL DISAMBIGUATION RULES:
1. "I finished X" / "mark X as done" / "completed X" → complete_task (NOT update_task)
2. "bump priority" / "change category" / "add a note" / "set to in progress" → update_task
3. "show all tasks" / "list tasks" → list_tasks (NOT get_schedule)
4. "what's on my schedule today" / "show my calendar" → get_schedule (shows timeline)
5. "clear schedule" / "free up today" → clear_schedule (unschedule, do NOT delete)
6. "add subtasks to [task]" → add_subtasks (NEVER create_task)
7. Confirmations ("yes", "ok", "sure", "lock it in") → conversational
8. Meeting/event with people → extract attendees. With location → extract location.

PREFERRED TIME DETECTION:
- "morning" / "early" / "first thing" → Morning
- "afternoon" / "midday" / "after lunch" → Afternoon
- "evening" / "after work" / "after 5" → Evening
- "night" / "late" / "before bed" → Night

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
You must return a valid JSON object with this EXACT structure (all fields optional unless noted):
{
  "intent": "create_task" | "add_subtasks" | "delete_task" | "reschedule_tasks" | "complete_task" | "update_task" | "list_tasks" | "clear_schedule" | "task_decomposition" | "get_schedule" | "report_status" | "conversational" | "unknown",
  "extractedData": {
    // ── Core ──
    "title": string,              // task name (existing or new)
    "description": string,        // detailed description or context
    "context": string,            // WHY or situation: "for the product launch", "client: TechCorp"
    "preferredTime": "Morning" | "Afternoon" | "Evening" | "Night",
    "notes": string,              // free-form notes to attach: "bring laptop", "call John first"

    // ── Time ──
    "targetDateIso": "YYYY-MM-DD",
    "startTimeString": "HH:MM",  // 24-hour
    "endTimeString": "HH:MM",    // 24-hour
    "durationMinutes": number,    // in MINUTES (convert hours: 1h=60, 1.5h=90, 2h=120, 3h=180)

    // ── Classification ──
    "priority": "Low" | "Medium" | "High",
    "category": string,           // Work, Personal, Health, Finance, Study, Social, Shopping, Admin, General
    "type": "Focus" | "Meeting" | "Break" | "Admin" | "Personal",
    "energyRequired": "Low" | "Medium" | "High",
    "color": string,              // Red, Blue, Green, Yellow, Purple, Orange
    "recurringRule": "Daily" | "Weekly" | "Monthly" | "One-time",
    "tags": string,               // comma-separated
    "topic": string,              // for task_decomposition only

    // ── Subtasks ──
    "subtasks": ["subtask 1", "subtask 2", ...],  // for add_subtasks intent

    // ── Update fields (for update_task/complete_task) ──
    "newStatus": "Pending" | "In Progress" | "Completed" | "Cancelled" | "On Hold",
    "newPriority": "Low" | "Medium" | "High",
    "newCategory": string,
    "newNotes": string,
    "newColor": string,

    // ── List filters (for list_tasks) ──
    "filterStatus": "Pending" | "In Progress" | "Completed" | "Cancelled" | "On Hold",
    "filterPriority": "Low" | "Medium" | "High",
    "filterCategory": string,

    // ── Event/Meeting fields ──
    "location": string,           // "Zoom", "boardroom", "gym", "conference room B"
    "attendees": string           // comma-separated: "John,Sarah,Mike"
  },
  "conversationalReply": string   // only for conversational intent
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
