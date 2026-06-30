import { ChiefEngine } from "@/lib/ai/chief-engine";
import { RiskEngine } from "@/lib/ai/risk-engine";
import { MemoryEngine } from "@/lib/ai/memory-engine";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import { BriefingClient } from "./BriefingClient";

import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function DailyBriefingPage() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User not found");
  const userId = user.id;

  // Generate daily briefing text
  const briefingText = await ChiefEngine.generateDailyBriefing(userId);

  // Retrieve metrics from Engines
  const risk = await RiskEngine.evaluateWorkloadRisk(userId);
  const memory = await MemoryEngine.getProductivityPatterns(userId);

  // Query counts for today's remaining tasks
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const todayTasksCount = await prisma.mission.count({
    where: {
      userId,
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
