import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

export const TaskDecompositionSchema = z.object({
  subtasks: z.array(z.object({
    title: z.string(),
    durationMinutes: z.number().describe("Estimated duration in minutes"),
    priority: z.enum(['High', 'Medium', 'Low']),
    energyLevel: z.enum(['High', 'Medium', 'Low']),
    dependencies: z.string().optional().describe("Any predecessor topics"),
  }))
});

export type DecomposedTask = z.infer<typeof TaskDecompositionSchema>;

export class TaskDecompositionEngine {
  /**
   * Breaks a complex mission/topic down into actionable subtasks.
   * @param topic The complex topic to break down
   */
  static async breakDownTask(topic: string): Promise<DecomposedTask> {
    try {
      const { object } = await generateObject({
        model: google('gemini-2.0-flash'),
        schema: TaskDecompositionSchema,
        system: `You are the Task Decomposition Engine for ChiefOS.
          Your ONLY job is to break a complex topic down into 3-5 concrete, actionable subtasks.
          Return strict JSON. Do not return plain text.`,
        prompt: `Topic to decompose: ${topic}`
      });

      return object;
    } catch (error) {
      console.error("TaskDecompositionEngine Error:", error);
      return { subtasks: [] };
    }
  }
}
