"use server";

import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import { revalidatePath } from "next/cache";

export async function getExecutionData(dateString: string) {
  const date = new Date(dateString);
  const start = startOfDay(date);
  const end = endOfDay(date);

  const blocks = await prisma.scheduledBlock.findMany({
    where: {
      startTime: { gte: start, lt: end }
    },
    include: { mission: true },
    orderBy: { startTime: "asc" }
  });

  const unscheduledMissionsCount = await prisma.mission.count({
    where: {
      status: { not: "Completed" },
      scheduledBlocks: { none: {} } // Has no scheduled blocks at all
    }
  });

  return { blocks, unscheduledMissionsCount };
}

export async function markMissionDone(missionId: string) {
  await prisma.mission.update({
    where: { id: missionId },
    data: { status: "Completed" }
  });
  revalidatePath("/dashboard");
}

export async function startMissionEarly(blockId: string, newStartTime: Date) {
  await prisma.scheduledBlock.update({
    where: { id: blockId },
    data: { startTime: newStartTime }
  });
  revalidatePath("/dashboard");
}

export async function getFilteredMissions(mode: "unplanned" | "planned" | "all") {
  if (mode === "unplanned") {
    return prisma.mission.findMany({
      where: { scheduledBlocks: { none: {} }, status: { not: "Completed" } },
      orderBy: { createdAt: "desc" }
    });
  }
  
  if (mode === "planned") {
    return prisma.mission.findMany({
      where: { scheduledBlocks: { some: {} } },
      include: { scheduledBlocks: true },
      orderBy: { createdAt: "desc" }
    });
  }

  return prisma.mission.findMany({
    include: { scheduledBlocks: true },
    orderBy: { createdAt: "desc" }
  });
}

export async function getTasksForDate(dateString: string) {
  const date = new Date(dateString);
  const start = startOfDay(date);
  const end = endOfDay(date);

  const blocks = await prisma.scheduledBlock.findMany({
    where: {
      startTime: { gte: start, lt: end },
    },
    include: { mission: true },
    orderBy: { startTime: "asc" }
  });
  
  return blocks;
}

export async function deleteScheduledTask(blockId: string) {
  await prisma.scheduledBlock.delete({
    where: { id: blockId }
  });
  revalidatePath("/dashboard");
}

export async function updateTaskStatus(missionId: string, status: string) {
  await prisma.mission.update({
    where: { id: missionId },
    data: { status }
  });
  revalidatePath("/dashboard");
}

export async function createMission(data: any) {
  try {
    const mission = await prisma.mission.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type || "Focus",
        priority: data.priority || "Medium",
        recurringRule: data.recurringRule,
        category: data.category,
        notes: data.notes,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        status: "Pending",
      }
    });

    // Handle Scheduling
    if (data.scheduledDate && data.startTime && data.endTime) {
      const sDate = new Date(data.scheduledDate);
      const startParts = data.startTime.split(":");
      const endParts = data.endTime.split(":");
      
      const startTime = new Date(sDate);
      startTime.setHours(parseInt(startParts[0], 10), parseInt(startParts[1], 10), 0, 0);
      
      const endTime = new Date(sDate);
      endTime.setHours(parseInt(endParts[0], 10), parseInt(endParts[1], 10), 0, 0);

      await prisma.scheduledBlock.create({
        data: {
          title: data.title,
          startTime,
          endTime,
          missionId: mission.id,
          source: "USER"
        }
      });
    }

    // Handle Subtasks
    if (data.subtasks && Array.isArray(data.subtasks) && data.subtasks.length > 0) {
      await Promise.all(
        data.subtasks.map((stTitle: string, idx: number) => 
          prisma.subMission.create({
            data: {
              title: stTitle,
              missionId: mission.id,
              order: idx
            }
          })
        )
      );
    }

    revalidatePath("/dashboard");
    return mission;
  } catch (error: any) {
    console.error("Failed to create mission:", error);
    throw new Error(error.message || "Database error creating mission");
  }
}
