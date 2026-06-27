import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';

// ─── Provider Instances ───────────────────────────────────────────────────────

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || "",
});

// ─── Task-Based Routing ──────────────────────────────────────────────────────
//
// Each AI task type maps to a prioritized chain of models.
// The Chief Engine never knows which model runs — it only declares what task
// it needs done. This makes the AI layer fully replaceable.
//
// Budget Philosophy:
//   Groq Llama 3.3 70B  → 14,400 RPD  → use for high-frequency tasks
//   Gemma 4 27B (Google) → 1,500 RPD   → use for structured / occasional tasks  
//   Gemini 3.5 Flash     → 20 RPD      → reserve for premium-only moments
//   Gemini 3.1 Flash Lite→ 500 RPD     → lightweight fallback
// ─────────────────────────────────────────────────────────────────────────────

export type AITask =
  | 'intent_parsing'       // Every message: classify intent → structured JSON
  | 'response_streaming'   // Every message: generate user-facing response
  | 'task_decomposition'   // Occasional: break task into subtasks → structured JSON
  | 'daily_briefing'       // Once/day: generate markdown briefing
  | 'mission_parsing';     // Occasional: parse natural language into mission fields

interface ModelConfig {
  provider: 'google' | 'groq';
  modelId: string;
  label: string;
}

// Ordered by priority: index 0 = primary, index 1 = fallback 1, etc.
const MODEL_CHAINS: Record<AITask, ModelConfig[]> = {
  intent_parsing: [
    { provider: 'groq',   modelId: 'llama-3.3-70b-versatile',  label: 'Groq Llama 3.3 70B' },
    { provider: 'google', modelId: 'gemini-2.5-flash-lite',     label: 'Gemini 2.5 Flash Lite' },
    { provider: 'google', modelId: 'gemini-2.5-flash',          label: 'Gemini 2.5 Flash' },
  ],
  response_streaming: [
    { provider: 'groq',   modelId: 'llama-3.3-70b-versatile',  label: 'Groq Llama 3.3 70B' },
    { provider: 'google', modelId: 'gemini-2.5-flash',          label: 'Gemini 2.5 Flash' },
  ],
  task_decomposition: [
    { provider: 'google', modelId: 'gemma-4-26b-a4b-it',       label: 'Gemma 4 26B' },
    { provider: 'groq',   modelId: 'llama-3.3-70b-versatile',  label: 'Groq Llama 3.3 70B' },
  ],
  daily_briefing: [
    { provider: 'google', modelId: 'gemma-4-26b-a4b-it',       label: 'Gemma 4 26B' },
    { provider: 'groq',   modelId: 'llama-3.3-70b-versatile',  label: 'Groq Llama 3.3 70B' },
  ],
  mission_parsing: [
    { provider: 'groq',   modelId: 'llama-3.3-70b-versatile',  label: 'Groq Llama 3.3 70B' },
    { provider: 'google', modelId: 'gemini-2.5-flash-lite',     label: 'Gemini 2.5 Flash Lite' },
  ],
};

/**
 * Returns the AI SDK model instance for a given task.
 * This is the ONLY function the rest of the codebase should call.
 * 
 * @param task - The type of AI task being performed
 * @param fallbackIndex - Which model in the chain to use (0 = primary, 1 = fallback, etc.)
 */
export function getModelForTask(task: AITask, fallbackIndex: number = 0) {
  const chain = MODEL_CHAINS[task];
  const config = chain[Math.min(fallbackIndex, chain.length - 1)];

  console.log(`[ModelProvider] Task: ${task} → ${config.label} (${config.provider}/${config.modelId})`);

  if (config.provider === 'groq') {
    return groq(config.modelId);
  } else {
    return google(config.modelId);
  }
}

/**
 * Executes an async AI operation with automatic fallback through the model chain.
 * If the primary model fails (rate limit, network error, etc.), it tries the next model.
 * 
 * @param task - The AI task type
 * @param operation - Async function that receives a model and performs the AI call
 * @returns The result of the first successful model call
 */
export async function withFallback<T>(
  task: AITask,
  operation: (model: ReturnType<typeof getModelForTask>) => Promise<T>
): Promise<T> {
  const chain = MODEL_CHAINS[task];

  for (let i = 0; i < chain.length; i++) {
    try {
      const model = getModelForTask(task, i);
      return await operation(model);
    } catch (error: any) {
      const config = chain[i];
      const isLastModel = i === chain.length - 1;
      
      console.warn(
        `[ModelProvider] ${config.label} failed for task "${task}": ${error.message || error}`
      );

      if (isLastModel) {
        console.error(`[ModelProvider] All models exhausted for task "${task}". Throwing.`);
        throw error;
      }

      console.log(`[ModelProvider] Falling back to next model in chain...`);
    }
  }

  // TypeScript safety — unreachable due to throw above
  throw new Error(`[ModelProvider] No models available for task "${task}"`);
}

// ─── Legacy Compatibility ────────────────────────────────────────────────────
// Kept temporarily for any code that hasn't migrated yet.
// TODO: Remove once all engines use getModelForTask() directly.

/** @deprecated Use getModelForTask() instead */
export function getAIModel() {
  console.warn('[ModelProvider] ⚠ getAIModel() is deprecated. Use getModelForTask() instead.');
  return getModelForTask('response_streaming');
}
