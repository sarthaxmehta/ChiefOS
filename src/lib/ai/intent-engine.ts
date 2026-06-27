import { generateObject } from 'ai';
import { getModelForTask, withFallback } from './model-provider';
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
    durationMinutes: z.number().optional(),
    targetDateIso: z.string().optional().describe("The target date in ISO format (YYYY-MM-DD), resolved from relative terms like 'today' or 'tomorrow' using the current date."),
    category: z.string().optional(),
    topic: z.string().optional(),
  }).optional(),
  conversationalReply: z.string().optional().describe("If the user is just saying hello or asking a general question, the AI can provide a quick reply here."),
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
        const { object } = await generateObject({
          model,
          schema: IntentSchema,
          system: `You are the Intent Engine for ChiefOS, a deterministic productivity system.
            Your ONLY job is to classify the user's message into an executable intent.
            Extract any relevant data (durations, titles, dates).
            
            REFERENCE DATE AND TIME context for this request: ${refDate.toString()} (ISO: ${refDate.toISOString()})
            Use this reference date to resolve relative date terms like "today", "tomorrow", "yesterday", "next Monday", etc.
            
            If the user is making casual conversation, use intent="conversational" and provide a conversationalReply.`,
          messages: [
            ...history,
            { role: 'user' as const, content: userMessage }
          ]
        });
        return object;
      });

      return result;
    } catch (error) {
      console.error("[IntentEngine] All models failed:", error);
      // Deterministic fallback: return a safe unknown intent
      return { intent: 'unknown' };
    }
  }
}
