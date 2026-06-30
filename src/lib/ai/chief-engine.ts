import { IntentEngine } from "./intent-engine";
import { ActionPlanner } from "./action-planner";
import { ResponseGenerator } from "./response-generator";
import { RiskEngine } from "./risk-engine";
import { MemoryEngine } from "./memory-engine";
import { withFallback } from "./model-provider";
import { auth } from "@/auth";
import { prisma } from "../prisma";

export class ChiefEngine {
  /**
   * Main entrypoint for the AI interface.
   * Returns both the streaming response AND the action type
   * so the API route knows whether to revalidate dashboard data.
   * 
   * Flow:
   *   1. Fast-path simple greetings (no AI call)
   *   2. Intent Engine → classify intent (Groq, 14,400 RPD)
   *   3. Action Planner → deterministic DB operations (no AI)
   *   4. Context Gathering → Risk + Memory engines (no AI)
   *   5. Response Generator → streaming response (Groq, 14,400 RPD)
   */
  static async processMessage(userMessage: string, history: any[] = [], selectedDateIso?: string): Promise<{ stream: any; actionType: string }> {
    console.log("[ChiefEngine] Processing message:", userMessage, "Selected Date Context:", selectedDateIso);
    
    const normalized = userMessage.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"");
    const simpleGreetings = ["hi", "hello", "hey", "yo", "sup", "gday", "howdy", "how are you", "how is it going", "hows it going", "whats up", "what up"];
    
    let actionResult;

    // Resolve user preferences
    const session = await auth();
    let userPreferencesText = "";
    let userId: string | undefined;
    if (session?.user?.email) {
      const userWithPref = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { preferences: true }
      });
      if (userWithPref) {
        userId = userWithPref.id;
        if (userWithPref.preferences) {
          const pref = userWithPref.preferences;
          userPreferencesText = `User Working Hours: ${pref.workDayStart}:00 to ${pref.workDayEnd}:00. Preferred Focus Window: ${pref.preferredFocusWindow}.`;
        }
      }
    }

    if (simpleGreetings.includes(normalized) || normalized === "") {
      actionResult = {
        type: 'conversational',
        reply: "Hello! I'm here to help."
      };
      console.log("[ChiefEngine] Fast-pathed simple greeting, bypassing IntentEngine.");
    } else {
      // 1. Intent Engine (Groq → Gemini Flash Lite fallback)
      const intent = await IntentEngine.parseIntent(userMessage, history, selectedDateIso, userPreferencesText);
      console.log("[ChiefEngine] Parsed Intent:", JSON.stringify(intent, null, 2));

      // 2. Action Planner (Deterministic Execution & Data Gathering)
      actionResult = await ActionPlanner.executeIntent(intent, selectedDateIso, userMessage, userId);
    }
    console.log("[ChiefEngine] Action Result Type:", actionResult.type);

    // 3. Gather Context (Risk & Memory — both deterministic, no AI)
    const riskData = await RiskEngine.evaluateWorkloadRisk();
    const memoryData = await MemoryEngine.getProductivityPatterns();

    const fullContext = {
      actionResult,
      riskData,
      memoryData,
      userPreferencesText
    };

    // 4. Generate streaming response (Groq primary, fallback on error)
    const actionType = actionResult.type || 'unknown';
    
    try {
      const stream = ResponseGenerator.generateStreamingResponse(userMessage, fullContext, history, 0);
      return { stream, actionType };
    } catch (primaryError) {
      console.warn("[ChiefEngine] Primary response model failed, trying fallback...", primaryError);
      try {
        const fallbackStream = ResponseGenerator.generateStreamingResponse(userMessage, fullContext, history, 1);
        return { stream: fallbackStream, actionType };
      } catch (fallbackError) {
        console.error("[ChiefEngine] All response models failed:", fallbackError);
        throw new Error("AI response generation failed. Please try again in a moment.");
      }
    }
  }

  // ─── Legacy UI Adapters ──────────────────────────────────────────────────

  static async analyzeMission(missionId: string) {
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
    const { prisma } = await import("../prisma");
    const { generateText } = await import('ai');

    const risk = await RiskEngine.evaluateWorkloadRisk();
    const memory = await MemoryEngine.getProductivityPatterns();

    const pendingMissions = await prisma.mission.findMany({
      where: { status: "Pending" },
      select: { title: true, priority: true, category: true }
    });
    const taskList = pendingMissions.map(m => `${m.title} (${m.priority}, ${m.category || 'General'})`).join(", ");

    const result = await withFallback('daily_briefing', async (model) => {
      const { text } = await generateText({
        model,
        prompt: `Generate a markdown daily briefing for the ChiefOS user. 
          Risk Level: ${risk.riskLevel}. 
          Total Pending Tasks Count: ${risk.totalPendingTasks}.
          List of Pending Tasks (with priority and category): ${taskList || 'None'}.
          Optimal work time: ${memory.optimalDeepWorkTime}.
          Use professional, executive tone. Include headings for Summary, Priorities (referencing the real pending tasks listed above), and Risks.
          Keep it concise — no more than 300 words. Do not use generic placeholders like "[Insert Task 1]" or similar.`
      });
      return text;
    });

    return result;
  }
}
