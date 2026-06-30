"use server";

import { prisma } from "@/lib/prisma";
import { startOfDay } from "date-fns";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { RecurringEngine } from "@/lib/ai/recurring-engine";

// Helper to query user preferences / verify identity
async function getUserId() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });
  if (!user) throw new Error("User not found");
  return user.id;
}

// Timezone-independent Date boundaries utility
function parseDateRangeUTC(dateString: string) {
  const [y, m, d] = dateString.split("T")[0].split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  const end = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
  return { start, end };
}

export async function getExecutionData(dateString: string) {
  const userId = await getUserId();
  await cleanupPastMissions();
  const { start, end } = parseDateRangeUTC(dateString);

  const blocks = await prisma.scheduledBlock.findMany({
    where: {
      startTime: { gte: start, lt: end },
      mission: { userId }
    },
    include: { mission: true },
    orderBy: { startTime: "asc" }
  });

  const unscheduledMissionsCount = await prisma.mission.count({
    where: {
      userId,
      status: { not: "Completed" },
      scheduledBlocks: { none: {} }
    }
  });

  return { blocks, unscheduledMissionsCount };
}

export async function markMissionDone(missionId: string) {
  const userId = await getUserId();
  const mission = await prisma.mission.findFirst({
    where: { id: missionId, userId }
  });
  if (!mission) throw new Error("Mission not found or unauthorized");

  await prisma.mission.update({
    where: { id: missionId },
    data: { status: "Completed" }
  });
  
  await RecurringEngine.spawnNextOccurrence(missionId);
  revalidatePath("/dashboard");
}

export async function startMissionEarly(blockId: string, newStartTime: Date) {
  const userId = await getUserId();
  const block = await prisma.scheduledBlock.findFirst({
    where: { id: blockId, mission: { userId } }
  });
  if (!block) throw new Error("Block not found or unauthorized");

  await prisma.scheduledBlock.update({
    where: { id: blockId },
    data: { startTime: newStartTime }
  });
  revalidatePath("/dashboard");
}

export async function getFilteredMissions(mode: "unplanned" | "planned" | "all") {
  const userId = await getUserId();
  if (mode === "unplanned") {
    return prisma.mission.findMany({
      where: { userId, scheduledBlocks: { none: {} }, status: { not: "Completed" } },
      include: { subMissions: true },
      orderBy: { createdAt: "desc" }
    });
  }
  
  if (mode === "planned") {
    return prisma.mission.findMany({
      where: { userId, scheduledBlocks: { some: {} } },
      include: { scheduledBlocks: true, subMissions: true },
      orderBy: { createdAt: "desc" }
    });
  }

  return prisma.mission.findMany({
    where: { userId },
    include: { scheduledBlocks: true, subMissions: true },
    orderBy: { createdAt: "desc" }
  });
}

export async function getTasksForDate(dateString: string) {
  const userId = await getUserId();
  await cleanupPastMissions();
  const { start, end } = parseDateRangeUTC(dateString);

  const blocks = await prisma.scheduledBlock.findMany({
    where: {
      startTime: { gte: start, lt: end },
      mission: { userId }
    },
    include: { mission: { include: { subMissions: true } } },
    orderBy: { startTime: "asc" }
  });

  const unplannedMissions = await prisma.mission.findMany({
    where: {
      userId,
      date: { gte: start, lt: end },
      startTime: null,
      endTime: null
    },
    include: { subMissions: true }
  });

  const formattedBlocks = blocks.map(b => ({
    id: b.id,
    title: b.title,
    startTime: b.startTime as Date | null,
    endTime: b.endTime as Date | null,
    missionId: b.missionId,
    mission: b.mission,
    isUnplanned: false
  }));

  const formattedUnplanned = unplannedMissions.map(m => ({
    id: m.id,
    title: m.title,
    startTime: null as Date | null,
    endTime: null as Date | null,
    missionId: m.id,
    mission: m,
    isUnplanned: true
  }));
  
  return [...formattedBlocks, ...formattedUnplanned];
}

export async function deleteScheduledTask(blockId: string) {
  const userId = await getUserId();
  const block = await prisma.scheduledBlock.findFirst({
    where: { id: blockId, mission: { userId } }
  });
  if (block) {
    await prisma.scheduledBlock.delete({
      where: { id: blockId }
    });
  } else {
    const mission = await prisma.mission.findFirst({
      where: { id: blockId, userId }
    });
    if (mission) {
      await prisma.mission.update({
        where: { id: blockId },
        data: { date: null }
      });
    }
  }
  revalidatePath("/dashboard");
}

export async function updateTaskStatus(missionId: string, status: string) {
  const userId = await getUserId();
  const mission = await prisma.mission.findFirst({
    where: { id: missionId, userId }
  });
  if (!mission) throw new Error("Mission not found or unauthorized");

  await prisma.mission.update({
    where: { id: missionId },
    data: { status }
  });
  revalidatePath("/dashboard");
}

export async function createMission(data: any) {
  const userId = await getUserId();
  try {
    let startTime: Date | null = null;
    let endTime: Date | null = null;
    let dateVal: Date | null = null;

    if (data.scheduledDate) {
      dateVal = new Date(data.scheduledDate);
      if (data.startTime) {
        const startParts = data.startTime.split(":");
        startTime = new Date(dateVal);
        startTime.setHours(parseInt(startParts[0], 10), parseInt(startParts[1], 10), 0, 0);
      }
      if (data.endTime) {
        const endParts = data.endTime.split(":");
        endTime = new Date(dateVal);
        endTime.setHours(parseInt(endParts[0], 10), parseInt(endParts[1], 10), 0, 0);
      }
    }

    const mission = await prisma.mission.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type || "Focus",
        priority: data.priority || "Low",
        recurringRule: data.recurringRule,
        category: data.category,
        notes: data.notes,
        color: data.color || "Red",
        date: dateVal,
        startTime: startTime,
        endTime: endTime,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        status: "Pending",
        userId,
      }
    });

    if (startTime && endTime) {
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

export async function deleteMission(missionId: string) {
  const userId = await getUserId();
  const mission = await prisma.mission.findFirst({
    where: { id: missionId, userId }
  });
  if (!mission) throw new Error("Mission not found or unauthorized");

  try {
    await prisma.scheduledBlock.deleteMany({ where: { missionId } });
    await prisma.subMission.deleteMany({ where: { missionId } });
    await prisma.missionActivity.deleteMany({ where: { missionId } });
    await prisma.workSession.deleteMany({ where: { missionId } });
    await prisma.scheduleSuggestion.deleteMany({ where: { missionId } });
    await prisma.missionInsight.deleteMany({ where: { missionId } });
    
    await prisma.mission.delete({
      where: { id: missionId }
    });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/missions");
  } catch (error: any) {
    console.error("Failed to delete mission:", error);
    throw new Error(error.message || "Database error deleting mission");
  }
}

export async function rescheduleMission(missionId: string, dateString: string | null) {
  const userId = await getUserId();
  const mission = await prisma.mission.findFirst({
    where: { id: missionId, userId }
  });
  if (!mission) throw new Error("Mission not found or unauthorized");

  try {
    const dateVal = dateString ? new Date(dateString) : null;
    if (!dateVal) {
      await prisma.scheduledBlock.deleteMany({
        where: { missionId }
      });
    }
    await prisma.mission.update({
      where: { id: missionId },
      data: {
        date: dateVal,
        startTime: null,
        endTime: null
      }
    });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/missions");
  } catch (error: any) {
    console.error("Failed to reschedule mission:", error);
    throw new Error(error.message || "Database error rescheduling mission");
  }
}

export async function updateMission(missionId: string, data: any) {
  const userId = await getUserId();
  const originalMission = await prisma.mission.findFirst({
    where: { id: missionId, userId }
  });
  if (!originalMission) throw new Error("Mission not found or unauthorized");

  try {
    let startTime: Date | null = null;
    let endTime: Date | null = null;
    let dateVal: Date | null = null;

    if (data.scheduledDate) {
      dateVal = new Date(data.scheduledDate);
      if (data.startTime) {
        const startParts = data.startTime.split(":");
        startTime = new Date(dateVal);
        startTime.setHours(parseInt(startParts[0], 10), parseInt(startParts[1], 10), 0, 0);
      }
      if (data.endTime) {
        const endParts = data.endTime.split(":");
        endTime = new Date(dateVal);
        endTime.setHours(parseInt(endParts[0], 10), parseInt(endParts[1], 10), 0, 0);
      }
    }

    const mission = await prisma.mission.update({
      where: { id: missionId },
      data: {
        title: data.title,
        description: data.description,
        type: data.type || "Focus",
        priority: data.priority || "Low",
        recurringRule: data.recurringRule,
        category: data.category,
        notes: data.notes,
        color: data.color || "Red",
        date: dateVal,
        startTime: startTime,
        endTime: endTime,
        tags: data.tags ? JSON.stringify(data.tags) : null,
      }
    });

    await prisma.scheduledBlock.deleteMany({
      where: { missionId: mission.id }
    });

    if (startTime && endTime) {
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

    await prisma.subMission.deleteMany({
      where: { missionId: mission.id }
    });

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
    revalidatePath("/dashboard/missions");
    return mission;
  } catch (error: any) {
    console.error("Failed to update mission:", error);
    throw new Error(error.message || "Database error updating mission");
  }
}

export async function toggleSubTaskStatus(subTaskId: string, newStatus: string) {
  const userId = await getUserId();
  const subTask = await prisma.subMission.findFirst({
    where: { id: subTaskId, mission: { userId } }
  });
  if (!subTask) throw new Error("Subtask not found or unauthorized");

  try {
    const sub = await prisma.subMission.update({
      where: { id: subTaskId },
      data: { status: newStatus }
    });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/missions");
    return sub;
  } catch (error: any) {
    console.error("Failed to toggle subtask status:", error);
    throw new Error(error.message || "Database error toggling subtask status");
  }
}

export async function getUserPreferences() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const email = session.user.email;

  let user = await prisma.user.findUnique({
    where: { email },
    include: { preferences: true }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: session.user.name,
        image: session.user.image,
      },
      include: { preferences: true }
    });
  }

  let preferences = user.preferences;
  if (!preferences) {
    preferences = await prisma.userPreferences.create({
      data: {
        userId: user.id,
        workDayStart: 9,
        workDayEnd: 18,
        preferredFocusWindow: "Morning"
      }
    });
  }

  return {
    name: user.name || "",
    email: user.email || "",
    image: user.image || "",
    workDayStart: preferences.workDayStart,
    workDayEnd: preferences.workDayEnd,
    preferredFocusWindow: preferences.preferredFocusWindow,
  };
}

export async function updateUserPreferences(data: {
  name: string;
  workDayStart: number;
  workDayEnd: number;
  preferredFocusWindow: string;
}) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const email = session.user.email;

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) throw new Error("User not found");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: data.name,
      preferences: {
        upsert: {
          create: {
            workDayStart: data.workDayStart,
            workDayEnd: data.workDayEnd,
            preferredFocusWindow: data.preferredFocusWindow
          },
          update: {
            workDayStart: data.workDayStart,
            workDayEnd: data.workDayEnd,
            preferredFocusWindow: data.preferredFocusWindow
          }
        }
      }
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
}

export async function cleanupPastMissions() {
  const userId = await getUserId().catch(() => null);
  if (!userId) return;
  const todayStart = startOfDay(new Date());

  const pastIncompleteMissions = await prisma.mission.findMany({
    where: {
      userId,
      date: { lt: todayStart },
      status: { not: "Completed" }
    }
  });

  if (pastIncompleteMissions.length > 0) {
    const ids = pastIncompleteMissions.map(m => m.id);

    await prisma.scheduledBlock.deleteMany({
      where: { missionId: { in: ids } }
    });

    await prisma.mission.updateMany({
      where: { id: { in: ids } },
      data: {
        date: null,
        startTime: null,
        endTime: null
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/schedule");
    revalidatePath("/dashboard/missions");
  }
}
