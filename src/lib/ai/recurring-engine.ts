import { prisma } from "../prisma";

export class RecurringEngine {
  /**
   * Spawns the next occurrence of a recurring mission based on its rule.
   * Calculates the next date from the *original* mission's date.
   * Copies all relevant fields but strips schedule times/blocks.
   */
  static async spawnNextOccurrence(missionId: string) {
    const originalMission = await prisma.mission.findUnique({
      where: { id: missionId },
      include: { subMissions: true }
    });

    if (!originalMission || !originalMission.recurringRule || originalMission.recurringRule === "One-time") {
      return null;
    }

    if (!originalMission.date) {
      console.warn(`[RecurringEngine] Mission ${missionId} has a recurring rule but no date. Cannot spawn next occurrence.`);
      return null;
    }

    // Calculate next date
    const nextDate = new Date(originalMission.date);
    const rule = originalMission.recurringRule;

    if (rule === "Daily") {
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (rule === "Weekly") {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (rule === "Monthly") {
      const expectedMonth = (nextDate.getMonth() + 1) % 12;
      nextDate.setMonth(nextDate.getMonth() + 1);
      // Handle month overflow (e.g., Jan 31 -> Mar 3 because Feb 31 doesn't exist)
      // If it overflowed past the expected next month, snap it back to the last day of the expected month
      if (nextDate.getMonth() !== expectedMonth) {
        nextDate.setDate(0); 
      }
    }

    // Create the new mission
    const newMission = await prisma.mission.create({
      data: {
        title: originalMission.title,
        description: originalMission.description,
        date: nextDate,
        estimatedMinutes: originalMission.estimatedMinutes,
        priority: originalMission.priority,
        category: originalMission.category,
        type: originalMission.type,
        energyRequired: originalMission.energyRequired,
        color: originalMission.color,
        tags: originalMission.tags,
        recurringRule: originalMission.recurringRule,
        context: originalMission.context,
        preferredTime: originalMission.preferredTime,
        notes: originalMission.notes,
        missionScore: originalMission.missionScore,
        // Reset execution state
        status: "Pending",
        isAIScheduled: false,
        startTime: null,
        endTime: null,
        userId: originalMission.userId
      }
    });

    // Copy subtasks if any existed
    if (originalMission.subMissions && originalMission.subMissions.length > 0) {
      for (const sub of originalMission.subMissions) {
        await prisma.subMission.create({
          data: {
            missionId: newMission.id,
            title: sub.title,
            description: sub.description,
            estimatedMinutes: sub.estimatedMinutes,
            order: sub.order,
            priority: sub.priority,
            energyLevel: sub.energyLevel,
            difficulty: sub.difficulty,
            status: "Pending", // Reset status
          }
        });
      }
    }

    console.log(`[RecurringEngine] Spawned next occurrence for ${originalMission.title}: ${nextDate.toISOString().split('T')[0]}`);
    return newMission;
  }
}
