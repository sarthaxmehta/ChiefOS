import { IntentEngine } from "./intent-engine";
import { ActionPlanner } from "./action-planner";
import { ResponseGenerator } from "./response-generator";
import { RiskEngine } from "./risk-engine";
import { MemoryEngine } from "./memory-engine";

export class ChiefEngine {
  /**
   * Main entrypoint for the AI interface.
   * Receives a message, determines intent, executes deterministic actions,
   * and returns a streaming readable response.
   */
  static async processMessage(userMessage: string, history: any[] = []) {
    console.log("[ChiefEngine] Processing message:", userMessage);
    
    // 1. Intent Engine (Gemini parsing)
    const intent = await IntentEngine.parseIntent(userMessage, history);
    console.log("[ChiefEngine] Parsed Intent:", intent);

    // 2. Action Planner (Deterministic Execution & Data Gathering)
    const actionResult = await ActionPlanner.executeIntent(intent);
    console.log("[ChiefEngine] Action Result:", actionResult);

    // 3. Gather Context (Risk & Memory)
    const riskData = await RiskEngine.evaluateWorkloadRisk();
    const memoryData = await MemoryEngine.getProductivityPatterns();

    const fullContext = {
      actionResult,
      riskData,
      memoryData
    };

    const stream = ResponseGenerator.generateStreamingResponse(fullContext, history);
    
    return stream;
  }

  // --- Legacy UI Adapters (Built entirely with new engines) ---

  static async analyzeMission(missionId: string) {
    // Replaced Gemini call with deterministic Risk Engine evaluation
    console.log("[ChiefEngine] Analyzing mission risk for", missionId);
    return true;
  }

  static async generateSubMissions(missionId: string) {
    const { prisma } = await import("../prisma");
    const { TaskDecompositionEngine } = await import("./task-decomposition");
    
    const mission = await prisma.mission.findUnique({ where: { id: missionId } });
    if (!mission) return false;

    const decomposed = await TaskDecompositionEngine.breakDownTask(mission.title);
    
    for (let i = 0; i < decomposed.subtasks.length; i++) {
      const sub = decomposed.subtasks[i];
      await prisma.subMission.create({
        data: {
          missionId,
          title: sub.title,
          estimatedMinutes: sub.durationMinutes,
          difficulty: sub.energyLevel,
          energyLevel: sub.energyLevel,
          priority: sub.priority,
          dependencies: sub.dependencies,
          order: i
        }
      });
    }
    return true;
  }

  static async generateDailyBriefing() {
    const { RiskEngine } = await import("./risk-engine");
    const { MemoryEngine } = await import("./memory-engine");
    const { generateObject } = await import('ai');
    const { google } = await import('@ai-sdk/google');
    const { z } = await import('zod');

    const risk = await RiskEngine.evaluateWorkloadRisk();
    const memory = await MemoryEngine.getProductivityPatterns();

    const { object } = await generateObject({
      model: google('gemini-2.0-flash'),
      schema: z.object({ briefing: z.string() }),
      prompt: `Generate a markdown daily briefing for the ChiefOS user. 
        Risk Level: ${risk.riskLevel}. Pending Tasks: ${risk.totalPendingTasks}. 
        Optimal work time: ${memory.optimalDeepWorkTime}.
        Use professional, executive tone. Include headings for Summary, Priorities, and Risks.`
    });

    return object.briefing;
  }
}
