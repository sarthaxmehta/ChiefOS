import { generateObject } from 'ai';
import { withFallback } from './model-provider';
import { z } from 'zod';

// ─── Decomposition Output Schema ─────────────────────────────────────────────

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
   * Uses Gemma 4 (1,500 RPD, unlimited TPM) as primary — called occasionally.
   * Falls back through the model chain automatically on failure.
   */
  static async breakDownTask(topic: string): Promise<DecomposedTask> {
    try {
      const result = await withFallback('task_decomposition', async (model) => {
        const { object } = await generateObject({
          model,
          schema: TaskDecompositionSchema,
          system: `You are the Task Decomposition Engine for ChiefOS.
            Your ONLY job is to break a complex topic down into 3-5 concrete, actionable subtasks.
            Each subtask should be specific enough to execute in one sitting.
            Return strict JSON matching the schema. Do not return plain text.`,
          prompt: `Topic to decompose: ${topic}`
        });
        return object;
      });

      return result;
    } catch (error) {
      console.error("[TaskDecompositionEngine] All models failed:", error);
      // Deterministic fallback: return a generic 3-subtask template
      return {
        subtasks: [
          { title: `Research: ${topic}`, durationMinutes: 30, priority: 'High', energyLevel: 'High' },
          { title: `Execute: ${topic}`, durationMinutes: 60, priority: 'High', energyLevel: 'Medium' },
          { title: `Review: ${topic}`, durationMinutes: 20, priority: 'Medium', energyLevel: 'Low' },
        ]
      };
    }
  }
}
