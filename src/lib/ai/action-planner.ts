import { ParsedIntent } from "./intent-engine";
import { SchedulingEngine } from "./scheduling-engine";
import { TaskDecompositionEngine } from "./task-decomposition";
import { prisma } from "../prisma";

export class ActionPlanner {
  /**
   * Translates the structured Intent into a deterministic execution plan
   * and executes the required engines.
   * 
   * The AI extraction feeds directly into the prisma Mission model.
   * Any field the AI didn't extract gets a sensible default.
   */
  static async executeIntent(intentData: ParsedIntent, referenceDateIso?: string, userMessage?: string) {
    const { intent, extractedData } = intentData;

    switch (intent) {
      case 'create_task':
        return await this.handleCreateTask(extractedData, referenceDateIso, userMessage);
      
      case 'task_decomposition':
        return await this.handleTaskDecomposition(extractedData);

      case 'get_schedule':
        return await this.handleGetSchedule(extractedData, referenceDateIso);

      case 'reschedule_tasks':
        return await this.handleRescheduleTasks(extractedData, referenceDateIso);

      case 'report_status':
        return await this.handleReportStatus();
        
      case 'conversational':
        return { 
          type: 'conversational', 
          reply: intentData.conversationalReply || "I'm here to help." 
        };

      case 'unknown':
      default:
        return { type: 'unknown', reply: "I didn't quite catch that. Could you clarify?" };
    }
  }

  // ─── Helpers for inferring schema fields ──────────────────────────────────

  /** Infer recurring rule from raw text if AI missed it */
  private static inferRecurringRule(data: any, userMessage?: string): string | null {
    if (data?.recurringRule) return data.recurringRule;
    const searchStr = `${data?.title || ""} ${userMessage || ""}`.toLowerCase();
    if (searchStr.includes("weekly") || searchStr.includes("every week")) return "Weekly";
    if (searchStr.includes("daily") || searchStr.includes("every day") || searchStr.includes("everyday")) return "Daily";
    if (searchStr.includes("monthly") || searchStr.includes("every month")) return "Monthly";
    return null;
  }

  /** Infer category from title/description context */
  private static inferCategory(data: any): string {
    if (data?.category) return data.category;
    const text = `${data?.title || ""} ${data?.description || ""}`.toLowerCase();
    if (/\b(gym|workout|exercise|yoga|run|walk|health|meditat|stretch)\b/.test(text)) return "Health";
    if (/\b(bill|payment|invoice|tax|budget|financ|bank|money)\b/.test(text)) return "Finance";
    if (/\b(study|learn|course|exam|homework|class|lecture|assignment|research)\b/.test(text)) return "Study";
    if (/\b(meet|call|sync|standup|interview|dinner|lunch|party)\b/.test(text)) return "Social";
    if (/\b(code|deploy|review|debug|test|build|design|develop|feature|bug|pr |pull request)\b/.test(text)) return "Work";
    if (/\b(clean|laundry|groceries|cook|shop|errand|pick up|drop off)\b/.test(text)) return "Personal";
    if (/\b(email|report|document|file|organize|admin)\b/.test(text)) return "Admin";
    return "General";
  }

  /** Infer task type from title/description context */
  private static inferType(data: any): string {
    if (data?.type) return data.type;
    const text = `${data?.title || ""} ${data?.description || ""}`.toLowerCase();
    if (/\b(meet|call|sync|standup|interview|check-in|checkin)\b/.test(text)) return "Meeting";
    if (/\b(gym|workout|break|lunch|walk|nap|rest|stretch)\b/.test(text)) return "Break";
    if (/\b(email|invoice|file|organize|admin|clean|errand)\b/.test(text)) return "Admin";
    if (/\b(shop|groceries|personal|cook|laundry)\b/.test(text)) return "Personal";
    return "Focus";
  }

  /** Infer energy level from task type and context */
  private static inferEnergy(data: any): string {
    if (data?.energyRequired) return data.energyRequired;
    const text = `${data?.title || ""} ${data?.description || ""}`.toLowerCase();
    if (/\b(code|write|design|research|study|debug|develop|deep work|brainstorm)\b/.test(text)) return "High";
    if (/\b(email|admin|clean|organize|file|errand|grocery|shop)\b/.test(text)) return "Low";
    return "Medium";
  }

  /** Infer color from category/priority */
  private static inferColor(data: any, category: string, priority: string): string {
    if (data?.color) return data.color;
    if (priority === "High") return "Red";
    const colorMap: Record<string, string> = {
      Work: "Blue", Finance: "Yellow", Health: "Green", Study: "Purple",
      Social: "Orange", Personal: "Green", Admin: "Blue", General: "Red"
    };
    return colorMap[category] || "Red";
  }

  // ─── Create Task Handler ──────────────────────────────────────────────────

  private static async handleCreateTask(data: any, referenceDateIso?: string, userMessage?: string) {
    if (!data || !data.title) {
      return { type: 'error', message: "I need a task title to create a task." };
    }

    // Resolve date
    const targetDate = data.targetDateIso 
      ? new Date(data.targetDateIso) 
      : (referenceDateIso ? new Date(referenceDateIso) : new Date());

    // Infer all schema fields
    const recurringRule = this.inferRecurringRule(data, userMessage);
    const category = this.inferCategory(data);
    const type = this.inferType(data);
    const energyRequired = this.inferEnergy(data);
    const priority = data.priority || "Medium";
    const color = this.inferColor(data, category, priority);
    const duration = data.durationMinutes || 60;

    // Create the Mission with ALL schema fields populated
    const mission = await prisma.mission.create({
      data: {
        title: data.title,
        description: data.description || null,
        date: targetDate,
        estimatedMinutes: duration,
        energyRequired,
        type,
        priority,
        category,
        color,
        tags: data.tags || null,
        recurringRule,
        isAIScheduled: false, // will be set to true if we auto-schedule
      }
    });

    // ─── Scheduling Logic ───
    let schedulingOptions: any[] = [];
    let scheduledBlock = null;
    const userSpecifiedTime = !!data.startTimeString;

    if (data.startTimeString) {
      // User specified an exact time — schedule at that time
      const startTime = new Date(targetDate);
      const [hours, minutes] = data.startTimeString.split(':').map(Number);
      startTime.setHours(hours, minutes, 0, 0);

      let endTime: Date;
      if (data.endTimeString) {
        endTime = new Date(targetDate);
        const [eH, eM] = data.endTimeString.split(':').map(Number);
        endTime.setHours(eH, eM, 0, 0);
      } else {
        endTime = new Date(startTime.getTime() + duration * 60000);
      }

      scheduledBlock = await prisma.scheduledBlock.create({
        data: {
          title: data.title,
          startTime,
          endTime,
          source: "AI",
          type,
          missionId: mission.id
        }
      });
      schedulingOptions = [{ start: startTime, end: endTime }];

      // Sync times to Mission record
      await prisma.mission.update({
        where: { id: mission.id },
        data: { startTime, endTime, isAIScheduled: true }
      });

    } else if (!recurringRule || recurringRule === "One-time") {
      // No specific time, not recurring → auto-schedule in first available slot
      schedulingOptions = await SchedulingEngine.findAvailableSlots(duration, targetDate);
      if (schedulingOptions.length > 0) {
        const slotStart = schedulingOptions[0].start;
        const slotEnd = schedulingOptions[0].end;

        scheduledBlock = await prisma.scheduledBlock.create({
          data: {
            title: data.title,
            startTime: slotStart,
            endTime: slotEnd,
            source: "AI",
            type,
            missionId: mission.id
          }
        });

        await prisma.mission.update({
          where: { id: mission.id },
          data: { startTime: slotStart, endTime: slotEnd, isAIScheduled: true }
        });
      }
    }
    // For recurring tasks without specific time: DON'T auto-schedule.
    // Just create the mission with the recurrence rule — user can schedule later.

    return {
      type: 'task_created',
      mission,
      schedulingOptions,
      scheduledBlock,
      targetDate: targetDate.toISOString().split('T')[0],
      userSpecifiedTime,
      isRecurring: !!recurringRule && recurringRule !== "One-time",
      isAutoScheduled: !!scheduledBlock && !userSpecifiedTime,
    };
  }

  // ─── Task Decomposition Handler ───────────────────────────────────────────

  private static async handleTaskDecomposition(data: any) {
    // Support both 'topic' and 'title' fields — LLMs sometimes put the topic in title
    const topic = data?.topic || data?.title;
    if (!topic) {
      return { type: 'error', message: "I need a topic or task name to break down." };
    }

    const decomposed = await TaskDecompositionEngine.breakDownTask(topic);
    
    return {
      type: 'task_decomposed',
      topic,
      subtasks: decomposed.subtasks
    };
  }

  // ─── Get Schedule Handler ─────────────────────────────────────────────────

  private static async handleGetSchedule(data: any, referenceDateIso?: string) {
    const targetDate = data?.targetDateIso 
      ? new Date(data.targetDateIso) 
      : (referenceDateIso ? new Date(referenceDateIso) : new Date());

    const startOfTarget = new Date(targetDate);
    startOfTarget.setHours(0, 0, 0, 0);
    const endOfTarget = new Date(targetDate);
    endOfTarget.setHours(23, 59, 59, 999);

    const missions = await prisma.mission.findMany({
      where: {
        date: {
          gte: startOfTarget,
          lte: endOfTarget
        }
      }
    });

    const blocks = await prisma.scheduledBlock.findMany({
      where: {
        startTime: {
          gte: startOfTarget,
          lte: endOfTarget
        }
      },
      orderBy: { startTime: 'asc' }
    });

    return {
      type: 'schedule_retrieved',
      targetDate: targetDate.toISOString().split('T')[0],
      missions,
      blocks
    };
  }

  // ─── Reschedule Tasks Handler ─────────────────────────────────────────────

  private static async handleRescheduleTasks(data: any, referenceDateIso?: string) {
    if (!data || !data.title) {
      return { type: 'error', message: "I need a task title to reschedule." };
    }

    const targetDate = data.targetDateIso 
      ? new Date(data.targetDateIso) 
      : (referenceDateIso ? new Date(referenceDateIso) : new Date());

    // Find the mission using partial title matching (case-insensitive)
    const mission = await prisma.mission.findFirst({
      where: {
        title: {
          contains: data.title
        }
      }
    });

    if (!mission) {
      return { type: 'error', message: `Could not find a task matching "${data.title}" to reschedule.` };
    }

    const duration = mission.estimatedMinutes || 60;

    // If user specified a new time, use it directly
    if (data.startTimeString) {
      const newStart = new Date(targetDate);
      const [hours, minutes] = data.startTimeString.split(':').map(Number);
      newStart.setHours(hours, minutes, 0, 0);

      let newEnd: Date;
      if (data.endTimeString) {
        newEnd = new Date(targetDate);
        const [eH, eM] = data.endTimeString.split(':').map(Number);
        newEnd.setHours(eH, eM, 0, 0);
      } else {
        newEnd = new Date(newStart.getTime() + duration * 60000);
      }

      await prisma.mission.update({
        where: { id: mission.id },
        data: { date: targetDate, startTime: newStart, endTime: newEnd }
      });

      // Update or create scheduled block
      await prisma.scheduledBlock.deleteMany({ where: { missionId: mission.id } });
      await prisma.scheduledBlock.create({
        data: {
          title: mission.title,
          startTime: newStart,
          endTime: newEnd,
          source: "AI",
          type: mission.type || "Focus",
          missionId: mission.id
        }
      });

      const updatedMission = await prisma.mission.findUnique({ where: { id: mission.id } });

      return {
        type: 'task_rescheduled',
        mission: updatedMission,
        targetDate: targetDate.toISOString().split('T')[0],
        newSlot: { start: newStart, end: newEnd }
      };
    }

    // No specific time → find available slot on the new date
    const slots = await SchedulingEngine.findAvailableSlots(duration, targetDate);
    
    if (slots.length > 0) {
      const newStart = slots[0].start;
      const newEnd = slots[0].end;

      await prisma.mission.update({
        where: { id: mission.id },
        data: { date: targetDate, startTime: newStart, endTime: newEnd }
      });

      await prisma.scheduledBlock.deleteMany({ where: { missionId: mission.id } });
      await prisma.scheduledBlock.create({
        data: {
          title: mission.title,
          startTime: newStart,
          endTime: newEnd,
          source: "AI",
          type: mission.type || "Focus",
          missionId: mission.id
        }
      });

      const updatedMission = await prisma.mission.findUnique({ where: { id: mission.id } });

      return {
        type: 'task_rescheduled',
        mission: updatedMission,
        targetDate: targetDate.toISOString().split('T')[0],
        newSlot: { start: newStart, end: newEnd },
        availableSlots: slots
      };
    }

    // No slots available
    await prisma.mission.update({
      where: { id: mission.id },
      data: { date: targetDate, startTime: null, endTime: null }
    });

    return {
      type: 'task_rescheduled',
      mission: { ...mission, date: targetDate },
      targetDate: targetDate.toISOString().split('T')[0],
      newSlot: null,
      message: `Moved "${mission.title}" to ${targetDate.toISOString().split('T')[0]} but no available time slots were found. It's marked as unscheduled for that day.`
    };
  }

  // ─── Report Status Handler ────────────────────────────────────────────────

  private static async handleReportStatus() {
    const pendingMissions = await prisma.mission.findMany({
      where: { status: "Pending" }
    });

    const completedMissions = await prisma.mission.findMany({
      where: { status: "Completed" }
    });

    const totalEstimatedMinutes = pendingMissions.reduce((acc, m) => acc + (m.estimatedMinutes || 60), 0);

    // Categorize pending work
    const byPriority = { High: 0, Medium: 0, Low: 0 };
    const byCategory: Record<string, number> = {};
    for (const m of pendingMissions) {
      const p = m.priority as keyof typeof byPriority;
      if (byPriority[p] !== undefined) byPriority[p]++;
      const cat = m.category || "General";
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    }

    return {
      type: 'status_report',
      pendingCount: pendingMissions.length,
      completedCount: completedMissions.length,
      totalEstimatedHours: Math.round(totalEstimatedMinutes / 60),
      byPriority,
      byCategory,
      pendingTasks: pendingMissions.slice(0, 10).map(m => ({
        title: m.title,
        priority: m.priority,
        category: m.category,
        dueDate: m.date ? m.date.toISOString().split('T')[0] : null
      })),
      recentCompletedMissions: completedMissions.slice(0, 5).map(m => ({
        title: m.title,
        category: m.category
      }))
    };
  }
}
