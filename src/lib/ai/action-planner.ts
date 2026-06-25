import { ParsedIntent } from "./intent-engine";
import { SchedulingEngine } from "./scheduling-engine";
import { TaskDecompositionEngine } from "./task-decomposition";
import { prisma } from "../prisma";

export class ActionPlanner {
  /**
   * Translates the structured Intent into a deterministic execution plan
   * and executes the required engines.
   */
  static async executeIntent(intentData: ParsedIntent) {
    const { intent, extractedData } = intentData;

    switch (intent) {
      case 'create_task':
        return await this.handleCreateTask(extractedData);
      
      case 'task_decomposition':
        return await this.handleTaskDecomposition(extractedData);
        
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

  private static async handleCreateTask(data: any) {
    if (!data || !data.title) {
      return { type: 'error', message: "I need a task title to create a task." };
    }

    // 1. Create the Mission in the DB
    const mission = await prisma.mission.create({
      data: {
        title: data.title,
        estimatedMinutes: data.durationMinutes || 60,
        category: data.category || "General"
      }
    });

    // 2. If duration is provided, find schedule options
    let schedulingOptions = [];
    if (data.durationMinutes) {
      schedulingOptions = await SchedulingEngine.findAvailableSlots(data.durationMinutes);
    }

    return {
      type: 'task_created',
      mission,
      schedulingOptions
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
}
