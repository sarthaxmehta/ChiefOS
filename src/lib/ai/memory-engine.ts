import { prisma } from "../prisma";
import { subDays } from "date-fns";

export class MemoryEngine {
  /**
   * Dynamically analyzes user workload, work sessions, and completions
   * from the database to inform future scheduling and risk decisions.
   */
  static async getProductivityPatterns(userId: string = "default") {
    try {
      // 1. Compute Optimal Deep Work Time by looking at completed focus sessions or work sessions
      const sessions = await prisma.workSession.findMany({
        take: 50,
        orderBy: { startTime: 'desc' }
      });

      let optimalDeepWorkTime = "Morning"; // sensible default

      if (sessions.length > 0) {
        let morningCount = 0;
        let afternoonCount = 0;
        let eveningCount = 0;

        for (const session of sessions) {
          const hour = new Date(session.startTime).getHours();
          if (hour >= 5 && hour < 12) morningCount++;
          else if (hour >= 12 && hour < 17) afternoonCount++;
          else eveningCount++;
        }

        const maxCount = Math.max(morningCount, afternoonCount, eveningCount);
        if (maxCount === morningCount) optimalDeepWorkTime = "Morning";
        else if (maxCount === afternoonCount) optimalDeepWorkTime = "Afternoon";
        else optimalDeepWorkTime = "Evening";
      }

      // 2. Identify Frequently Postponed categories
      // Find missions that are still Pending or have been postponed
      const pendingMissions = await prisma.mission.findMany({
        where: { status: "Pending" },
        select: { category: true }
      });

      let frequentlyPostponed = "Admin"; // sensible default
      if (pendingMissions.length > 0) {
        const categoryCounts: Record<string, number> = {};
        for (const m of pendingMissions) {
          if (m.category) {
            categoryCounts[m.category] = (categoryCounts[m.category] || 0) + 1;
          }
        }
        
        let maxCount = 0;
        for (const [cat, count] of Object.entries(categoryCounts)) {
          if (count > maxCount) {
            maxCount = count;
            frequentlyPostponed = cat;
          }
        }
      }

      // 3. Compute Average Daily Capacity Minutes (active work sessions in last 7 days)
      const oneWeekAgo = subDays(new Date(), 7);
      const recentSessions = await prisma.workSession.findMany({
        where: {
          startTime: { gte: oneWeekAgo }
        },
        select: { durationMinutes: true }
      });

      let averageDailyCapacityMinutes = 240; // Default capacity of 4 hours
      if (recentSessions.length > 0) {
        const totalMinutes = recentSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
        // Average per day over 7 days
        averageDailyCapacityMinutes = Math.max(60, Math.round(totalMinutes / 7));
      }

      return {
        optimalDeepWorkTime,
        frequentlyPostponed,
        averageDailyCapacityMinutes
      };

    } catch (error) {
      console.error("[MemoryEngine] Failed to compute productivity patterns, using defaults:", error);
      return {
        optimalDeepWorkTime: "Morning",
        frequentlyPostponed: "Admin",
        averageDailyCapacityMinutes: 240
      };
    }
  }
}
