import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

// Define the structured intent schema
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
    dateReference: z.string().optional(), // e.g. "tomorrow", "next week"
    category: z.string().optional(),
    topic: z.string().optional(),
  }).optional(),
  conversationalReply: z.string().optional().describe("If the user is just saying hello or asking a general question, the AI can provide a quick reply here."),
});

export type ParsedIntent = z.infer<typeof IntentSchema>;

export class IntentEngine {
  /**
   * Converts natural language into a structured intent.
   * @param userMessage The latest message from the user
   * @param history The conversational context
   */
  static async parseIntent(userMessage: string, history: any[] = []): Promise<ParsedIntent> {
    try {
      const { object } = await generateObject({
        model: google('gemini-2.0-flash'),
        schema: IntentSchema,
        system: `You are the Intent Engine for ChiefOS, a deterministic productivity system.
          Your ONLY job is to classify the user's message into an executable intent.
          Extract any relevant data (durations, titles, dates).
          If the user is making casual conversation, use intent="conversational" and provide a conversationalReply.`,
        messages: [
          ...history,
          { role: 'user', content: userMessage }
        ]
      });

      return object;
    } catch (error) {
      console.error("IntentEngine Parse Error:", error);
      return { intent: 'unknown' };
    }
  }
}
