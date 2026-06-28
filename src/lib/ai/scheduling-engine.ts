import { prisma } from "../prisma";
import { addMinutes, isBefore, isAfter, setHours, setMinutes, startOfDay, endOfDay } from "date-fns";

// ─── Preferred time-of-day windows (24-hour hour boundaries) ─────────────────
const PREFERRED_TIME_WINDOWS: Record<string, { start: number; end: number }> = {
  Morning:   { start: 6,  end: 12 },
  Afternoon: { start: 12, end: 17 },
  Evening:   { start: 17, end: 21 },
  Night:     { start: 21, end: 24 },
};

export class SchedulingEngine {
  /**
   * Deterministically calculates available time slots for a task.
   * NO LLM ALLOWED in this engine.
   *
   * @param durationMinutes  The requested length of the task in minutes
   * @param targetDate       The day to schedule on (defaults to today)
   * @param userId           The user ID (built for scale; single-user for now)
   * @param preferredTime    Optional time-of-day preference: 'Morning' | 'Afternoon' | 'Evening' | 'Night'
   */
  static async findAvailableSlots(
    durationMinutes: number,
    targetDate: Date = new Date(),
    userId: string = "default",
    preferredTime?: string
  ): Promise<{ start: Date; end: Date }[]> {

    // 1. Fetch user work-day preferences
    const user = await prisma.user.findFirst({
      include: { preferences: true }
    });

    const workStartHour = user?.preferences?.workDayStart ?? 9;
    const workEndHour   = user?.preferences?.workDayEnd   ?? 18;

    // 2. Determine the effective search window
    //    If a preferredTime is given, narrow the window. If it falls outside the
    //    user's work day, use the intersection (or fall back to full work day).
    let searchStartHour = workStartHour;
    let searchEndHour   = workEndHour;

    if (preferredTime && PREFERRED_TIME_WINDOWS[preferredTime]) {
      const pref = PREFERRED_TIME_WINDOWS[preferredTime];
      // Intersect with work day
      searchStartHour = Math.max(workStartHour, pref.start);
      searchEndHour   = Math.min(workEndHour,   pref.end);

      // If the intersection is too narrow for even one task, fall back to full work day
      if (searchEndHour - searchStartHour < Math.ceil(durationMinutes / 60)) {
        searchStartHour = workStartHour;
        searchEndHour   = workEndHour;
      }
    }

    // 3. Fetch existing scheduled blocks for the target date
    const startOfTarget = startOfDay(targetDate);
    const endOfTarget   = endOfDay(targetDate);

    const blocks = await prisma.scheduledBlock.findMany({
      where: {
        startTime: { gte: startOfTarget },
        endTime:   { lte: endOfTarget }
      },
      orderBy: { startTime: 'asc' }
    });

    // 4. Calculate available slots within the search window
    const availableSlots: { start: Date; end: Date }[] = [];

    let currentPointer = setHours(setMinutes(new Date(targetDate), 0), searchStartHour);
    const endBoundary  = setHours(setMinutes(new Date(targetDate), 0), searchEndHour);

    // If looking at today and the current time is already past the search start, advance pointer
    const now = new Date();
    if (startOfTarget.getTime() === startOfDay(now).getTime() && isAfter(now, currentPointer)) {
      // Round up to the next 30-minute boundary
      const remainder = 30 - (now.getMinutes() % 30);
      currentPointer = addMinutes(now, remainder === 30 ? 0 : remainder);
    }

    // Walk through existing blocks and find gaps
    for (const block of blocks) {
      // Skip blocks that start before our search window
      if (block.startTime < currentPointer) {
        if (isBefore(currentPointer, block.endTime)) {
          currentPointer = new Date(block.endTime);
        }
        continue;
      }

      // Find all fitting slots in the gap before this block
      while (
        addMinutes(currentPointer, durationMinutes).getTime() <= block.startTime.getTime() &&
        addMinutes(currentPointer, durationMinutes).getTime() <= endBoundary.getTime()
      ) {
        availableSlots.push({
          start: new Date(currentPointer),
          end:   addMinutes(currentPointer, durationMinutes)
        });
        // Advance pointer by 30 mins to find the next possible slot
        currentPointer = addMinutes(currentPointer, 30);
      }

      // Jump pointer past the current block
      if (isBefore(currentPointer, block.endTime)) {
        currentPointer = new Date(block.endTime);
      }
    }

    // Find slots after the last block, still within the search window
    while (addMinutes(currentPointer, durationMinutes).getTime() <= endBoundary.getTime()) {
      availableSlots.push({
        start: new Date(currentPointer),
        end:   addMinutes(currentPointer, durationMinutes)
      });
      currentPointer = addMinutes(currentPointer, 30);
    }

    // If preferredTime was set but we found no slots in that window,
    // fall back to the full work day and retry (one recursive call max).
    if (availableSlots.length === 0 && preferredTime && PREFERRED_TIME_WINDOWS[preferredTime]) {
      return this.findAvailableSlots(durationMinutes, targetDate, userId);
    }

    // Return at most 3 slots to avoid overwhelming the user
    return availableSlots.slice(0, 3);
  }
}
