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
  static async executeIntent(intentData: ParsedIntent, referenceDateIso?: string, userMessage?: string, userId?: string, tzOffset: number = 0) {
    const { intent, extractedData } = intentData;

    switch (intent) {
      case 'create_task':
        return await this.handleCreateTask(extractedData, referenceDateIso, userMessage, userId, tzOffset);

      case 'add_subtasks':
        return await this.handleAddSubtasks(extractedData, userMessage, userId);

      case 'update_subtask':
        return await this.handleUpdateSubtask(extractedData, userId);

      case 'delete_subtask':
        return await this.handleDeleteSubtask(extractedData, userId);

      case 'delete_task':
        return await this.handleDeleteTask(extractedData, userId);

      case 'task_decomposition':
        return await this.handleTaskDecomposition(extractedData);

      case 'get_schedule':
        return await this.handleGetSchedule(extractedData, referenceDateIso, userId);

      case 'reschedule_tasks':
        return await this.handleRescheduleTasks(extractedData, referenceDateIso, userId, tzOffset);

      case 'complete_task':
        return await this.handleCompleteTask(extractedData, userMessage, userId);

      case 'update_task':
        return await this.handleUpdateTask(extractedData, userMessage, userId, tzOffset);

      case 'list_tasks':
        return await this.handleListTasks(extractedData, referenceDateIso, userId);

      case 'clear_schedule':
        return await this.handleClearSchedule(extractedData, referenceDateIso, userId);

      case 'report_status':
        return await this.handleReportStatus(userId);

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

  // ─── Inference Helpers ──────────────────────────────────────────────────────

  /** Infer recurring rule from raw text if AI missed it */
  private static inferRecurringRule(data: any, userMessage?: string): string | null {
    if (data?.recurringRule) return data.recurringRule;
    const searchStr = `${data?.title || ""} ${userMessage || ""}`.toLowerCase();
    if (/\b(every week|weekly|each week)\b/.test(searchStr)) return "Weekly";
    if (/\b(every day|daily|each day|everyday|each morning|each evening)\b/.test(searchStr)) return "Daily";
    if (/\b(every month|monthly|each month)\b/.test(searchStr)) return "Monthly";
    return null;
  }

  /** Infer category from title/description/context */
  private static inferCategory(data: any): string {
    if (data?.category) return data.category;
    const text = `${data?.title || ""} ${data?.description || ""} ${data?.context || ""}`.toLowerCase();
    if (/\b(gym|workout|exercise|yoga|run|walk|health|meditat|stretch|fitness|swim)\b/.test(text)) return "Health";
    if (/\b(bill|payment|invoice|tax|budget|financ|bank|money|salary|expense)\b/.test(text)) return "Finance";
    if (/\b(study|learn|course|exam|homework|class|lecture|assignment|research|read|book|dsa|leet)\b/.test(text)) return "Study";
    if (/\b(meet|call|sync|standup|interview|dinner|lunch|party|coffee|catch up)\b/.test(text)) return "Social";
    if (/\b(code|deploy|review|debug|test|build|design|develop|feature|bug|pr |pull request|api|backend|frontend)\b/.test(text)) return "Work";
    if (/\b(clean|laundry|groceries|cook|shop|errand|pick up|drop off|house)\b/.test(text)) return "Personal";
    if (/\b(email|report|document|file|organize|admin|submit|fill|form)\b/.test(text)) return "Admin";
    if (/\b(shop|buy|order|purchase|amazon|mall)\b/.test(text)) return "Shopping";
    return "General";
  }

  /** Infer task type from title/description/context */
  private static inferType(data: any): string {
    if (data?.type) return data.type;
    const text = `${data?.title || ""} ${data?.description || ""}`.toLowerCase();
    if (/\b(meet|call|sync|standup|interview|check-in|checkin|catch up|zoom|teams|hangout)\b/.test(text)) return "Meeting";
    if (/\b(gym|workout|break|lunch|walk|nap|rest|stretch|run|yoga|swim|exercise)\b/.test(text)) return "Break";
    if (/\b(email|invoice|file|organize|admin|clean|errand|form|submit|fill)\b/.test(text)) return "Admin";
    if (/\b(shop|groceries|personal|cook|laundry|pick up|buy)\b/.test(text)) return "Personal";
    return "Focus";
  }

  /** Infer energy level from task type and context */
  private static inferEnergy(data: any): string {
    if (data?.energyRequired) return data.energyRequired;
    const text = `${data?.title || ""} ${data?.description || ""}`.toLowerCase();
    if (/\b(code|write|design|research|study|debug|develop|deep work|brainstorm|build|architect|dsa|leet)\b/.test(text)) return "High";
    if (/\b(gym|workout|run|exercise|swim)\b/.test(text)) return "High";
    if (/\b(meet|call|sync|interview|plan|review)\b/.test(text)) return "Medium";
    if (/\b(email|admin|clean|organize|file|errand|grocery|shop|lunch|nap|walk)\b/.test(text)) return "Low";
    return "Medium";
  }

  /** Infer color from category/priority */
  private static inferColor(data: any, category: string, priority: string): string {
    if (data?.color) return data.color;
    if (priority === "High") return "Red";
    const colorMap: Record<string, string> = {
      Work: "Blue", Finance: "Yellow", Health: "Green", Study: "Purple",
      Social: "Orange", Personal: "Green", Admin: "Blue", Shopping: "Orange", General: "Red"
    };
    return colorMap[category] || "Red";
  }

  /**
   * Compute a mission score (0–100) from priority, energy, and type.
   * Higher score = more strategically important mission.
   */
  private static computeMissionScore(priority: string, energyRequired: string, type: string): number {
    const priorityScore = priority === "High" ? 40 : priority === "Medium" ? 25 : 10;
    const energyScore = energyRequired === "High" ? 30 : energyRequired === "Medium" ? 20 : 10;
    const typeScore = type === "Focus" ? 20 : type === "Meeting" ? 15 : type === "Admin" ? 10 : 5;
    return Math.min(100, priorityScore + energyScore + typeScore);
  }

  private static applyLocalTime(date: Date, hours: number, minutes: number, tzOffsetMins: number) {
    date.setUTCHours(hours, minutes + tzOffsetMins, 0, 0);
  }

  // ─── Create Task Handler ────────────────────────────────────────────────────

  private static async handleCreateTask(data: any, referenceDateIso?: string, userMessage?: string, userId?: string, tzOffset: number = 0) {
    if (!data || !data.title) {
      return { type: 'error', message: "I need a task title to create a task." };
    }

    const targetDate = data.targetDateIso
      ? new Date(data.targetDateIso)
      : (referenceDateIso ? new Date(referenceDateIso) : new Date());

    const recurringRule = this.inferRecurringRule(data, userMessage);
    const category = this.inferCategory(data);
    const type = this.inferType(data);
    const energyRequired = this.inferEnergy(data);
    const priority = data.priority || "Medium";
    const color = this.inferColor(data, category, priority);
    const duration = data.durationMinutes || 60;
    const missionScore = this.computeMissionScore(priority, energyRequired, type);

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
        context: data.context || null,
        preferredTime: data.preferredTime || null,
        notes: data.notes || null,
        color,
        tags: data.tags || null,
        recurringRule,
        missionScore,
        isAIScheduled: false,
        userId: userId || null
      }
    });

    if (type === "Meeting" || data.attendees || data.location) {
      if (data.startTimeString) {
        const evStart = new Date(targetDate);
        const [h, m] = data.startTimeString.split(':').map(Number);
        this.applyLocalTime(evStart, h, m, tzOffset);
        const evEnd = data.endTimeString
          ? (() => { const d = new Date(targetDate); const [eh, em] = data.endTimeString.split(':').map(Number); this.applyLocalTime(d, eh, em, tzOffset); return d; })()
          : new Date(evStart.getTime() + duration * 60000);

        await prisma.calendarEvent.create({
          data: {
            title: data.title,
            description: data.description || null,
            location: data.location || null,
            startTime: evStart,
            endTime: evEnd,
            recurringRule: recurringRule || null,
            attendees: data.attendees || null,
          }
        });
      }
    }

    let schedulingOptions: any[] = [];
    let scheduledBlock = null;
    const userSpecifiedTime = !!data.startTimeString;

    if (data.startTimeString) {
      const startTime = new Date(targetDate);
      const [hours, minutes] = data.startTimeString.split(':').map(Number);
      this.applyLocalTime(startTime, hours, minutes, tzOffset);

      let endTime: Date;
      if (data.endTimeString) {
        endTime = new Date(targetDate);
        const [eH, eM] = data.endTimeString.split(':').map(Number);
        this.applyLocalTime(endTime, eH, eM, tzOffset);
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

      await prisma.mission.update({
        where: { id: mission.id },
        data: { startTime, endTime, isAIScheduled: true }
      });

    } else if (!recurringRule || recurringRule === "One-time") {
      schedulingOptions = await SchedulingEngine.findAvailableSlots(
        duration, targetDate, userId || "default", data.preferredTime
      );
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

  // ─── Add Subtasks to Existing Task ─────────────────────────────────────────

  private static async handleAddSubtasks(data: any, userMessage?: string, userId?: string) {
    if (!data?.title) {
      return { type: 'error', message: "I need the task name to add subtasks to." };
    }
    if (!data?.subtasks || data.subtasks.length === 0) {
      return { type: 'error', message: "I need the subtask names to add." };
    }

    const mission = await prisma.mission.findFirst({
      where: { title: { contains: data.title }, userId: userId || null },
      include: { subMissions: true }
    });

    if (!mission) {
      return {
        type: 'error',
        message: `I couldn't find a task matching "${data.title}". Please check the task name and try again.`
      };
    }

    const created = [];
    const startOrder = mission.subMissions.length;
    const totalSubs = data.subtasks.length;
    const perSubMinutes = mission.estimatedMinutes
      ? Math.round(mission.estimatedMinutes / totalSubs)
      : 30;

    for (let i = 0; i < totalSubs; i++) {
      const subTitle = data.subtasks[i];
      const subText = subTitle.toLowerCase();

      let difficulty = "Medium";
      let energyLevel = "Medium";
      if (/\b(research|write|code|design|build|implement|architect|debug)\b/.test(subText)) {
        difficulty = "Hard";
        energyLevel = "High";
      } else if (/\b(review|check|read|organize|email|admin|setup|config)\b/.test(subText)) {
        difficulty = "Easy";
        energyLevel = "Low";
      }

      const sub = await prisma.subMission.create({
        data: {
          missionId: mission.id,
          title: subTitle,
          description: null,
          estimatedMinutes: perSubMinutes,
          order: startOrder + i,
          priority: i === 0 ? 'High' : 'Medium',
          energyLevel,
          difficulty,
        }
      });
      created.push(sub);
    }

    return {
      type: 'subtasks_added',
      mission: { id: mission.id, title: mission.title },
      subtasksAdded: created,
      totalSubtasks: startOrder + created.length,
    };
  }

  // ─── Update Subtask ─────────────────────────────────────────────────────────

  private static async handleUpdateSubtask(data: any, userId?: string) {
    if (!data?.title || !data?.subtaskTitle) {
      return { type: 'error', message: "I need both the main task name and the subtask name to update it." };
    }

    const mission = await prisma.mission.findFirst({
      where: { title: { contains: data.title }, userId: userId || null },
      include: { subMissions: true }
    });

    if (!mission || mission.subMissions.length === 0) {
      return { type: 'error', message: `I couldn't find any subtasks under "${data.title}".` };
    }

    let targetSub = mission.subMissions.find(s => s.title.toLowerCase().includes(data.subtaskTitle.toLowerCase()));
    
    if (!targetSub) {
      const match = data.subtaskTitle.match(/\d+/);
      if (match) {
        const index = parseInt(match[0], 10) - 1;
        const sorted = [...mission.subMissions].sort((a, b) => a.order - b.order);
        if (sorted[index]) targetSub = sorted[index];
      }
    }

    if (!targetSub) {
      return { type: 'error', message: `I couldn't find a subtask matching "${data.subtaskTitle}".` };
    }

    const updatePayload: any = {};
    if (data.newSubtaskStatus) updatePayload.status = data.newSubtaskStatus;
    if (data.newSubtaskTitle) updatePayload.title = data.newSubtaskTitle;

    if (Object.keys(updatePayload).length === 0) {
      return { type: 'error', message: "I'm not sure what you want to update on this subtask." };
    }

    const updated = await prisma.subMission.update({
      where: { id: targetSub.id },
      data: updatePayload
    });

    return {
      type: 'subtask_updated',
      missionTitle: mission.title,
      subtask: updated
    };
  }

  // ─── Delete Subtask ─────────────────────────────────────────────────────────

  private static async handleDeleteSubtask(data: any, userId?: string) {
    if (!data?.title || !data?.subtaskTitle) {
      return { type: 'error', message: "I need both the main task name and the subtask name to delete it." };
    }

    const mission = await prisma.mission.findFirst({
      where: { title: { contains: data.title }, userId: userId || null },
      include: { subMissions: true }
    });

    if (!mission || mission.subMissions.length === 0) {
      return { type: 'error', message: `I couldn't find any subtasks under "${data.title}".` };
    }

    let targetSub = mission.subMissions.find(s => s.title.toLowerCase().includes(data.subtaskTitle.toLowerCase()));
    if (!targetSub) {
      const match = data.subtaskTitle.match(/\d+/);
      if (match) {
        const index = parseInt(match[0], 10) - 1;
        const sorted = [...mission.subMissions].sort((a, b) => a.order - b.order);
        if (sorted[index]) targetSub = sorted[index];
      }
    }

    if (!targetSub) {
      return { type: 'error', message: `I couldn't find a subtask matching "${data.subtaskTitle}".` };
    }

    await prisma.subMission.delete({ where: { id: targetSub.id } });

    return {
      type: 'subtask_deleted',
      missionTitle: mission.title,
      subtaskTitle: targetSub.title
    };
  }

  // ─── Delete Task Handler ────────────────────────────────────────────────────

  private static async handleDeleteTask(data: any, userId?: string) {
    if (!data?.title) {
      return { type: 'error', message: "I need the task name to delete." };
    }

    const missions = await prisma.mission.findMany({
      where: { title: { contains: data.title }, userId: userId || null }
    });

    if (missions.length === 0) {
      return {
        type: 'error',
        message: `I couldn't find any task matching "${data.title}".`
      };
    }

    const deleted = [];
    for (const mission of missions) {
      await prisma.scheduledBlock.deleteMany({ where: { missionId: mission.id } });
      await prisma.subMission.deleteMany({ where: { missionId: mission.id } });
      await prisma.missionActivity.deleteMany({ where: { missionId: mission.id } });
      await prisma.workSession.deleteMany({ where: { missionId: mission.id } });
      await prisma.scheduleSuggestion.deleteMany({ where: { missionId: mission.id } });
      await prisma.missionInsight.deleteMany({ where: { missionId: mission.id } });
      await prisma.mission.delete({ where: { id: mission.id } });
      deleted.push({ id: mission.id, title: mission.title });
    }

    return {
      type: 'task_deleted',
      deletedCount: deleted.length,
      deletedTasks: deleted,
    };
  }

  // ─── Complete Task Handler ──────────────────────────────────────────────────

  private static async handleCompleteTask(data: any, userMessage?: string, userId?: string) {
    if (!data?.title) {
      return { type: 'error', message: "I need the task name to mark as complete." };
    }

    const mission = await prisma.mission.findFirst({
      where: { title: { contains: data.title }, userId: userId || null }
    });

    if (!mission) {
      return {
        type: 'error',
        message: `I couldn't find a task matching "${data.title}".`
      };
    }

    const updated = await prisma.mission.update({
      where: { id: mission.id },
      data: {
        status: "Completed",
      }
    });

    const { RecurringEngine } = await import("./recurring-engine");
    await RecurringEngine.spawnNextOccurrence(mission.id);

    await prisma.missionActivity.create({
      data: {
        missionId: mission.id,
        action: "Marked as Completed via AI"
      }
    });

    return {
      type: 'task_completed',
      mission: updated,
    };
  }

  // ─── Update Task Handler ────────────────────────────────────────────────────

  private static async handleUpdateTask(data: any, userMessage?: string, userId?: string, tzOffset: number = 0) {
    if (!data?.title) {
      return { type: 'error', message: "I need the task name to update." };
    }

    const mission = await prisma.mission.findFirst({
      where: { title: { contains: data.title }, userId: userId || null }
    });

    if (!mission) {
      return {
        type: 'error',
        message: `I couldn't find a task matching "${data.title}".`
      };
    }

    const updatePayload: Record<string, any> = {};
    
    if (data.newTitle)           updatePayload.title = data.newTitle;
    if (data.newStatus)          updatePayload.status = data.newStatus;
    if (data.newPriority)        updatePayload.priority = data.newPriority;
    if (data.newCategory)        updatePayload.category = data.newCategory;
    if (data.newType)            updatePayload.type = data.newType;
    if (data.newEnergyRequired)  updatePayload.energyRequired = data.newEnergyRequired;
    if (data.newColor)           updatePayload.color = data.newColor;
    if (data.newNotes)           updatePayload.notes = data.newNotes;
    if (data.description)        updatePayload.description = data.description;
    if (data.context)            updatePayload.context = data.context;
    
    const duration = data.newDurationMinutes || mission.estimatedMinutes || 60;
    if (data.newDurationMinutes) updatePayload.estimatedMinutes = data.newDurationMinutes;
    if (data.newDateIso)         updatePayload.date = new Date(data.newDateIso);

    if (data.newPriority || data.newEnergyRequired || data.newType) {
      const p = data.newPriority || mission.priority || "Medium";
      const e = data.newEnergyRequired || mission.energyRequired || "Medium";
      const t = data.newType || mission.type || "Focus";
      updatePayload.missionScore = this.computeMissionScore(p, e, t);
    }

    if (Object.keys(updatePayload).length === 0 && !data.newStartTime && !data.newEndTime) {
      return { type: 'error', message: "I couldn't determine what to update. Please specify the field to change." };
    }

    const targetDate = updatePayload.date || mission.date || new Date();
    let newStart = mission.startTime;
    let newEnd = mission.endTime;
    let timeChanged = false;

    if (data.newStartTime) {
      newStart = new Date(targetDate);
      const [h, m] = data.newStartTime.split(':').map(Number);
      this.applyLocalTime(newStart, h, m, tzOffset);
      
      if (data.newEndTime) {
        newEnd = new Date(targetDate);
        const [eh, em] = data.newEndTime.split(':').map(Number);
        this.applyLocalTime(newEnd, eh, em, tzOffset);
      } else {
        newEnd = new Date(newStart.getTime() + duration * 60000);
      }
      timeChanged = true;
    } else if (data.newDurationMinutes && newStart) {
      newEnd = new Date(newStart.getTime() + duration * 60000);
      timeChanged = true;
    } else if (data.newDateIso && newStart) {
      newStart = new Date(targetDate);
      newStart.setHours(mission.startTime!.getHours(), mission.startTime!.getMinutes(), 0, 0); // Keep UTC exact hours? Or is mission.startTime already UTC? It is UTC! So getUTCHours!
      newStart.setUTCHours(mission.startTime!.getUTCHours(), mission.startTime!.getUTCMinutes(), 0, 0);
      newEnd = new Date(targetDate);
      newEnd.setUTCHours(mission.endTime!.getUTCHours(), mission.endTime!.getUTCMinutes(), 0, 0);
      timeChanged = true;
    }

    if (timeChanged) {
      updatePayload.startTime = newStart;
      updatePayload.endTime = newEnd;
      updatePayload.isAIScheduled = true;
      
      await prisma.scheduledBlock.deleteMany({ where: { missionId: mission.id } });
      await prisma.scheduledBlock.create({
        data: {
          title: updatePayload.title || mission.title,
          startTime: newStart!,
          endTime: newEnd!,
          source: "AI",
          type: updatePayload.type || mission.type || "Focus",
          missionId: mission.id
        }
      });
    }

    const updated = await prisma.mission.update({
      where: { id: mission.id },
      data: updatePayload,
    });

    const changedFields = Object.keys(updatePayload).join(", ");
    await prisma.missionActivity.create({
      data: {
        missionId: mission.id,
        action: `Updated fields via AI: ${changedFields}`
      }
    });

    return {
      type: 'task_updated',
      mission: updated,
      updatedFields: Object.keys(updatePayload),
      timeChanged
    };
  }

  // ─── List Tasks Handler ─────────────────────────────────────────────────────

  private static async handleListTasks(data: any, referenceDateIso?: string, userId?: string) {
    const where: Record<string, any> = { userId: userId || null };

    if (data?.filterStatus)   where.status   = data.filterStatus;
    if (data?.filterPriority) where.priority  = data.filterPriority;
    if (data?.filterCategory) where.category = { contains: data.filterCategory };

    if (data?.targetDateIso) {
      const [y, m, d] = data.targetDateIso.split("T")[0].split("-").map(Number);
      const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
      const end = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
      where.date = { gte: start, lte: end };
    }

    const missions = await prisma.mission.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { date: 'asc' }, { createdAt: 'asc' }],
      take: 25,
    });

    return {
      type: 'tasks_listed',
      count: missions.length,
      filters: {
        status: data?.filterStatus || null,
        priority: data?.filterPriority || null,
        category: data?.filterCategory || null,
        date: data?.targetDateIso || null,
      },
      missions,
    };
  }

  // ─── Clear Schedule Handler ──────────────────────────────────────────────────

  private static async handleClearSchedule(data: any, referenceDateIso?: string, userId?: string) {
    const targetDate = data?.targetDateIso
      ? new Date(data.targetDateIso)
      : (referenceDateIso ? new Date(referenceDateIso) : new Date());

    const [y, m, d] = targetDate.toISOString().split('T')[0].split('-').map(Number);
    const startOfTarget = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
    const endOfTarget   = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));

    const blocks = await prisma.scheduledBlock.findMany({
      where: {
        startTime: { gte: startOfTarget, lte: endOfTarget },
        mission: { userId: userId || null }
      }
    });

    const blockIds = blocks.map(b => b.id);
    const { count } = await prisma.scheduledBlock.deleteMany({
      where: {
        id: { in: blockIds }
      }
    });

    const missionIds = [...new Set(blocks.map(b => b.missionId).filter(Boolean))] as string[];
    if (missionIds.length > 0) {
      await prisma.mission.updateMany({
        where: { id: { in: missionIds } },
        data: { startTime: null, endTime: null, isAIScheduled: false }
      });
    }

    return {
      type: 'schedule_cleared',
      targetDate: targetDate.toISOString().split('T')[0],
      blocksRemoved: count,
      missionsUnscheduled: missionIds.length,
    };
  }

  // ─── Task Decomposition Handler ─────────────────────────────────────────────

  private static async handleTaskDecomposition(data: any) {
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

  // ─── Get Schedule Handler ───────────────────────────────────────────────────

  private static async handleGetSchedule(data: any, referenceDateIso?: string, userId?: string) {
    const targetDate = data?.targetDateIso
      ? new Date(data.targetDateIso)
      : (referenceDateIso ? new Date(referenceDateIso) : new Date());

    const [y, m, d] = targetDate.toISOString().split('T')[0].split('-').map(Number);
    const startOfTarget = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
    const endOfTarget   = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));

    const missions = await prisma.mission.findMany({
      where: {
        userId: userId || null,
        date: { gte: startOfTarget, lte: endOfTarget }
      },
      orderBy: { startTime: 'asc' }
    });

    const blocks = await prisma.scheduledBlock.findMany({
      where: {
        startTime: { gte: startOfTarget, lte: endOfTarget },
        mission: { userId: userId || null }
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

  // ─── Reschedule Tasks Handler ───────────────────────────────────────────────

  private static async handleRescheduleTasks(data: any, referenceDateIso?: string, userId?: string, tzOffset: number = 0) {
    if (!data || !data.title) {
      return { type: 'error', message: "I need a task title to reschedule." };
    }

    const targetDate = data.targetDateIso
      ? new Date(data.targetDateIso)
      : (referenceDateIso ? new Date(referenceDateIso) : new Date());

    const mission = await prisma.mission.findFirst({
      where: { title: { contains: data.title }, userId: userId || null }
    });

    if (!mission) {
      return { type: 'error', message: `Could not find a task matching "${data.title}" to reschedule.` };
    }

    const duration = mission.estimatedMinutes || 60;

    if (data.startTimeString) {
      const newStart = new Date(targetDate);
      const [hours, minutes] = data.startTimeString.split(':').map(Number);
      this.applyLocalTime(newStart, hours, minutes, tzOffset);

      let newEnd: Date;
      if (data.endTimeString) {
        newEnd = new Date(targetDate);
        const [eH, eM] = data.endTimeString.split(':').map(Number);
        this.applyLocalTime(newEnd, eH, eM, tzOffset);
      } else {
        newEnd = new Date(newStart.getTime() + duration * 60000);
      }

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
        newSlot: { start: newStart, end: newEnd }
      };
    }

    const slots = await SchedulingEngine.findAvailableSlots(
      duration, targetDate, userId || "default", mission.preferredTime || undefined
    );

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

  // ─── Report Status Handler ──────────────────────────────────────────────────

  private static async handleReportStatus(userId?: string) {
    const now = new Date();
    const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
    const endOfToday   = new Date(now); endOfToday.setHours(23, 59, 59, 999);

    const pendingMissions = await prisma.mission.findMany({
      where: { status: "Pending", userId: userId || null }
    });

    const inProgressMissions = await prisma.mission.findMany({
      where: { status: "In Progress", userId: userId || null }
    });

    const completedMissions = await prisma.mission.findMany({
      where: { status: "Completed", userId: userId || null }
    });

    const todaysMissions = await prisma.mission.findMany({
      where: { date: { gte: startOfToday, lte: endOfToday }, userId: userId || null }
    });

    const totalEstimatedMinutes = pendingMissions.reduce((acc, m) => acc + (m.estimatedMinutes || 60), 0);

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
      inProgressCount: inProgressMissions.length,
      completedCount: completedMissions.length,
      todaysTaskCount: todaysMissions.length,
      totalEstimatedHours: Math.round(totalEstimatedMinutes / 60 * 10) / 10,
      byPriority,
      byCategory,
      pendingTasks: pendingMissions.slice(0, 10).map(m => ({
        title: m.title,
        priority: m.priority,
        category: m.category,
        dueDate: m.date ? m.date.toISOString().split('T')[0] : null
      })),
      inProgressTasks: inProgressMissions.slice(0, 5).map(m => ({
        title: m.title,
        priority: m.priority,
        category: m.category,
      })),
      recentCompletedMissions: completedMissions.slice(0, 5).map(m => ({
        title: m.title,
        category: m.category
      }))
    };
  }
}
