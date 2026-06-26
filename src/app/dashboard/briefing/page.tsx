import { ChiefEngine } from "@/lib/ai/chief-engine";
import { RiskEngine } from "@/lib/ai/risk-engine";
import { MemoryEngine } from "@/lib/ai/memory-engine";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import { BriefingClient } from "./BriefingClient";

export default async function DailyBriefingPage() {
  // Generate daily briefing text
  const briefingText = await ChiefEngine.generateDailyBriefing();

  // Retrieve metrics from Engines
  const risk = await RiskEngine.evaluateWorkloadRisk();
  const memory = await MemoryEngine.getProductivityPatterns();

  // Query counts for today's remaining tasks
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const todayTasksCount = await prisma.mission.count({
    where: {
      status: { not: "Completed" },
      OR: [
        {
          date: {
            gte: todayStart,
            lte: todayEnd,
          }
        },
        {
          startTime: {
            gte: todayStart,
            lte: todayEnd,
          }
        }
      ]
    }
  });

  return (
    <BriefingClient
      briefingText={briefingText}
      riskLevel={risk.riskLevel}
      pendingCount={risk.totalPendingTasks}
      optimalWorkTime={memory.optimalDeepWorkTime}
      todayTasksCount={todayTasksCount}
    />
  );
}
