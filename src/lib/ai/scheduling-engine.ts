import { prisma } from "../prisma";
import { addMinutes, isBefore, isAfter, setHours, setMinutes, startOfDay, endOfDay, format } from "date-fns";

export class SchedulingEngine {
  /**
   * Deterministically calculates available time slots for a task.
   * NO GEMINI ALLOWED in this engine.
   * @param durationMinutes The requested length of the task
   * @param targetDate The day to schedule on (defaults to today)
   * @param userId The user ID (to fetch preferences)
   */
  static async findAvailableSlots(
    durationMinutes: number, 
    targetDate: Date = new Date(),
    userId: string = "default" // assuming single-user local for now, but built for scale
  ): Promise<{ start: Date; end: Date }[]> {
    
    // 1. Fetch Constraints
    // For single user local MVP, grab the first user
    const user = await prisma.user.findFirst({
      include: { preferences: true }
    });
    
    const workStartHour = user?.preferences?.workDayStart ?? 9;
    const workEndHour = user?.preferences?.workDayEnd ?? 18;

    // 2. Fetch Existing Scheduled Blocks for the target date
    const startOfTarget = startOfDay(targetDate);
    const endOfTarget = endOfDay(targetDate);

    const blocks = await prisma.scheduledBlock.findMany({
      where: {
        startTime: { gte: startOfTarget },
        endTime: { lte: endOfTarget }
      },
      orderBy: { startTime: 'asc' }
    });

    // 3. Calculate Available Slots
    const availableSlots: { start: Date; end: Date }[] = [];
    
    let currentPointer = setHours(setMinutes(targetDate, 0), workStartHour);
    const endBoundary = setHours(setMinutes(targetDate, 0), workEndHour);

    // If current time is after workStartHour and we're looking at today, move pointer up
    const now = new Date();
    if (startOfTarget.getTime() === startOfDay(now).getTime() && isAfter(now, currentPointer)) {
      // Round to next 30 min block
      const remainder = 30 - (now.getMinutes() % 30);
      currentPointer = addMinutes(now, remainder);
    }

    for (const block of blocks) {
      // If there's a gap between pointer and this block large enough for the task
      while (addMinutes(currentPointer, durationMinutes).getTime() <= block.startTime.getTime()) {
        const potentialEnd = addMinutes(currentPointer, durationMinutes);
        if (potentialEnd.getTime() <= endBoundary.getTime()) {
          availableSlots.push({ start: new Date(currentPointer), end: potentialEnd });
        }
        // Advance pointer by 30 mins to find next possible slot
        currentPointer = addMinutes(currentPointer, 30);
      }
      // Move pointer past the current block
      if (isBefore(currentPointer, block.endTime)) {
        currentPointer = new Date(block.endTime);
      }
    }

    // Check gap after the last block
    while (addMinutes(currentPointer, durationMinutes).getTime() <= endBoundary.getTime()) {
      const potentialEnd = addMinutes(currentPointer, durationMinutes);
      availableSlots.push({ start: new Date(currentPointer), end: potentialEnd });
      currentPointer = addMinutes(currentPointer, 30);
    }

    // Return max 3 slots to avoid overwhelming the user
    return availableSlots.slice(0, 3);
  }
}
