import { generateObject } from 'ai';
import { getAIModel } from './model-provider';
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
   * @param userMessage The latest message from the user
   * @param history The conversational context
   */
  static async parseIntent(userMessage: string, history: any[] = []): Promise<ParsedIntent> {
    try {
      const { object } = await generateObject({
        model: getAIModel(),
        schema: IntentSchema,
        system: `You are the Intent Engine for ChiefOS, a deterministic productivity system.
          Your ONLY job is to classify the user's message into an executable intent.
          Extract any relevant data (durations, titles, dates).
          
          CURRENT DATE AND TIME: ${new Date().toString()} (ISO: ${new Date().toISOString()})
          Use this to resolve relative date terms like "today", "tomorrow", "yesterday", "next Monday", etc.
          
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
