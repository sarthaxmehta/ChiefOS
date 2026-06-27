import { ParsedIntent } from "./intent-engine";
import { SchedulingEngine } from "./scheduling-engine";
import { TaskDecompositionEngine } from "./task-decomposition";
import { prisma } from "../prisma";

export class ActionPlanner {
  /**
   * Translates the structured Intent into a deterministic execution plan
   * and executes the required engines.
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

  private static async handleCreateTask(data: any, referenceDateIso?: string, userMessage?: string) {
    if (!data || !data.title) {
      return { type: 'error', message: "I need a task title to create a task." };
    }

    // Resolve date: use extracted target date, selected calendar date, or today
    const targetDate = data.targetDateIso 
      ? new Date(data.targetDateIso) 
      : (referenceDateIso ? new Date(referenceDateIso) : new Date());

    // Deterministic backup: infer recurring rule from either the title or raw request if the AI parser missed it
    let recurringRule = data.recurringRule || null;
    if (!recurringRule) {
      const searchStr = `${data.title || ""} ${userMessage || ""}`.toLowerCase();
      if (searchStr.includes("weekly") || searchStr.includes("every week")) {
        recurringRule = "Weekly";
      } else if (searchStr.includes("daily") || searchStr.includes("every day")) {
        recurringRule = "Daily";
      } else if (searchStr.includes("monthly") || searchStr.includes("every month")) {
        recurringRule = "Monthly";
      }
    }

    // 1. Create the Mission in the DB
    const mission = await prisma.mission.create({
      data: {
        title: data.title,
        description: data.description || null,
        date: targetDate,
        estimatedMinutes: data.durationMinutes || 60,
        category: data.category || "General",
        priority: data.priority || "Medium",
        recurringRule: recurringRule
      }
    });

    // 2. Schedule the block: exact time (if provided) or find available slots
    let schedulingOptions: any[] = [];
    let scheduledBlock = null;

    const duration = data.durationMinutes || 60;

    if (data.startTimeString) {
      // Parse the exact requested start time
      const startTime = new Date(targetDate);
      const [hours, minutes] = data.startTimeString.split(':').map(Number);
      startTime.setHours(hours, minutes, 0, 0);
      const endTime = new Date(startTime.getTime() + duration * 60000);

      scheduledBlock = await prisma.scheduledBlock.create({
        data: {
          title: data.title,
          startTime: startTime,
          endTime: endTime,
          source: "AI",
          type: "Focus",
          missionId: mission.id
        }
      });
      schedulingOptions = [{ start: startTime, end: endTime }];

      // Sync times back to Mission record
      await prisma.mission.update({
        where: { id: mission.id },
        data: { startTime, endTime }
      });
    } else {
      // Auto-schedule in the first available slot
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
            type: "Focus",
            missionId: mission.id
          }
        });

        // Sync times back to Mission record
        await prisma.mission.update({
          where: { id: mission.id },
          data: { startTime: slotStart, endTime: slotEnd }
        });
      }
    }

    return {
      type: 'task_created',
      mission,
      schedulingOptions,
      scheduledBlock,
      targetDate: targetDate.toISOString().split('T')[0]
    };
  }

  private static async handleTaskDecomposition(data: any) {
    if (!data || !data.topic) {
      return { type: 'error', message: "I need a topic to break down." };
    }

    const decomposed = await TaskDecompositionEngine.breakDownTask(data.topic);
    
    return {
      type: 'task_decomposed',
      topic: data.topic,
      subtasks: decomposed.subtasks
    };
  }

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

  private static async handleRescheduleTasks(data: any, referenceDateIso?: string) {
    if (!data || !data.title) {
      return { type: 'error', message: "I need a task title to reschedule." };
    }

    const targetDate = data.targetDateIso 
      ? new Date(data.targetDateIso) 
      : (referenceDateIso ? new Date(referenceDateIso) : new Date());

    // Find the mission first using partial title matching
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

    const updatedMission = await prisma.mission.update({
      where: { id: mission.id },
      data: {
        date: targetDate
      }
    });

    // Update associated scheduled blocks
    await prisma.scheduledBlock.updateMany({
      where: { missionId: mission.id },
      data: {
        startTime: targetDate,
        endTime: new Date(targetDate.getTime() + (mission.estimatedMinutes || 60) * 60 * 1000)
      }
    });

    return {
      type: 'task_rescheduled',
      mission: updatedMission,
      targetDate: targetDate.toISOString().split('T')[0]
    };
  }

  private static async handleReportStatus() {
    const pendingMissions = await prisma.mission.findMany({
      where: { status: "Pending" }
    });

    const completedMissions = await prisma.mission.findMany({
      where: { status: "Completed" }
    });

    const totalEstimatedMinutes = pendingMissions.reduce((acc, m) => acc + (m.estimatedMinutes || 60), 0);

    return {
      type: 'status_report',
      pendingCount: pendingMissions.length,
      completedCount: completedMissions.length,
      totalEstimatedHours: Math.round(totalEstimatedMinutes / 60),
      recentCompletedMissions: completedMissions.slice(0, 5)
    };
  }
}
