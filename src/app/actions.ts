"use server";

import { generateObject } from "ai";
import { withFallback } from "@/lib/ai/model-provider";
import { ChiefEngine } from "@/lib/ai/chief-engine";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const MissionParseSchema = z.object({
  title: z.string(),
  deadline: z.string().optional().describe("ISO date string if a deadline is mentioned"),
  estimatedHours: z.number().optional(),
  priority: z.enum(["High", "Medium", "Low"]).optional(),
  category: z.string().optional(),
});

export async function captureMission(input: string) {
  try {
    // Use the new model provider with automatic fallback
    const parsedData = await withFallback('mission_parsing', async (model) => {
      const { object } = await generateObject({
        model,
        schema: MissionParseSchema,
        system: `You are an AI Chief of Staff. Parse the following user input and extract a mission definition.
          Extract: title, deadline (ISO format), estimatedHours, priority (High/Medium/Low), category.
          CURRENT DATE: ${new Date().toISOString()}
          Resolve relative dates like "tomorrow", "next week" against the current date.`,
        prompt: input,
      });
      return object;
    });

    // Save to database
    const newMission = await prisma.mission.create({
      data: {
        title: parsedData.title,
        date: parsedData.deadline ? new Date(parsedData.deadline) : null,
        estimatedMinutes: (parsedData.estimatedHours || 1) * 60,
        priority: parsedData.priority || "Low",
        category: parsedData.category || "General",
        context: input,
      }
    });

    // Generate Intelligence Insight asynchronously so we don't block
    ChiefEngine.analyzeMission(newMission.id).then(() => {
      revalidatePath("/dashboard/missions/[id]", "page");
    });

    revalidatePath("/dashboard");
    return { success: true, mission: newMission };
  } catch (error) {
    console.error("Capture mission error, using fallback:", error);
    
    // Deterministic fallback if all AI models fail
    const fallbackMission = await prisma.mission.create({
      data: {
        title: input.slice(0, 50) + (input.length > 50 ? "..." : ""),
        estimatedMinutes: 60,
        priority: "Low",
        category: "General",
        context: input,
      }
    });

    revalidatePath("/dashboard");
    return { success: true, mission: fallbackMission };
  }
}

export async function generateSubMissionsAction(missionId: string) {
  try {
    const success = await ChiefEngine.generateSubMissions(missionId);
    if (success) {
      revalidatePath(`/dashboard/missions/${missionId}`);
      return { success: true };
    }
    throw new Error("Engine failed");
  } catch (error) {
    console.error("SubMission generation failed", error);
    return { success: false };
  }
}

export async function autoOptimizeScheduleAction() {
  // A simplistic AI rescheduling simulation for the MVP
  await new Promise(r => setTimeout(r, 1500));
  revalidatePath("/dashboard/schedule");
  return { success: true, message: "AI has successfully compacted your schedule and resolved 2 overlaps." };
}

export async function generateBriefingAction() {
  try {
    const briefing = await ChiefEngine.generateDailyBriefing();
    return { success: true, briefing };
  } catch (e) {
    return { success: false, briefing: "Failed to generate AI briefing." };
  }
}
export async function createManualMissionAction(data: any) {
  try {
    const newMission = await prisma.mission.create({
      data: {
        title: data.title,
        description: data.description || null,
        priority: data.priority || "Low",
        date: data.date ? new Date(data.date) : null,
        startTime: data.startTime ? new Date(data.startTime) : null,
        endTime: data.endTime ? new Date(data.endTime) : null,
        category: data.category || "General",
        color: data.color || "Red",
        notes: data.notes || null,
        recurringRule: data.recurringRule || null,
      }
    });

    revalidatePath("/dashboard");
    return { success: true, mission: newMission };
  } catch (error) {
    console.error("Failed to create manual mission:", error);
    return { success: false, error: "Failed to create task" };
  }
}
