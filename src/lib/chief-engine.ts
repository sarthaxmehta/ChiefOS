import { genAI } from "./gemini";
import { prisma } from "./prisma";

export class ChiefEngine {
  
  static async analyzeMission(missionId: string) {
    const mission = await prisma.mission.findUnique({ where: { id: missionId } });
    if (!mission) throw new Error("Mission not found");

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
      You are the ChiefOS AI Engine. Analyze this mission:
      Title: ${mission.title}
      Priority: ${mission.priority}
      Context: ${mission.context}
      
      Return STRICT JSON:
      {
        "missionScore": 85, // 0-100 impact score
        "keyRisks": "Brief risk description",
        "recommendations": "Actionable recommendation"
      }
    `;

    try {
      const res = await model.generateContent(prompt);
      const data = JSON.parse(res.response.text().replace(/```json/g, "").replace(/```/g, ""));
      
      // Update Mission Score
      await prisma.mission.update({
        where: { id: missionId },
        data: { missionScore: data.missionScore }
      });

      // Update or Create Insight
      await prisma.missionInsight.upsert({
        where: { missionId },
        update: { keyRisks: data.keyRisks, recommendations: data.recommendations },
        create: { missionId, keyRisks: data.keyRisks, recommendations: data.recommendations }
      });

      return data;
    } catch (e) {
      console.error("ChiefEngine.analyzeMission Error:", e);
      return null;
    }
  }

  static async generateSubMissions(missionId: string) {
    const mission = await prisma.mission.findUnique({ where: { id: missionId } });
    if (!mission) throw new Error("Mission not found");

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
      Break down this mission into 3-5 subtasks:
      Title: ${mission.title}
      Context: ${mission.context}
      
      Return STRICT JSON format:
      {
        "subMissions": [
          {
            "title": "String",
            "description": "String",
            "duration": 45, // Minutes
            "priority": "High|Medium|Low",
            "energyLevel": "High|Medium|Low",
            "dependencies": "String or None"
          }
        ]
      }
    `;

    try {
      const res = await model.generateContent(prompt);
      const data = JSON.parse(res.response.text().replace(/```json/g, "").replace(/```/g, ""));
      
      for (let i = 0; i < data.subMissions.length; i++) {
        const sub = data.subMissions[i];
        await prisma.subMission.create({
          data: {
            missionId,
            title: sub.title,
            description: sub.description,
            estimatedMinutes: sub.duration,
            difficulty: sub.energyLevel, // mapping energy to difficulty for now
            energyLevel: sub.energyLevel,
            priority: sub.priority,
            dependencies: sub.dependencies,
            order: i
          }
        });
      }
      return true;
    } catch (e) {
      console.error("ChiefEngine.generateSubMissions Error:", e);
      return false;
    }
  }

  private static briefingCache: { date: string, content: string } | null = null;

  static async generateDailyBriefing() {
    const today = new Date().toISOString().split('T')[0];
    if (this.briefingCache && this.briefingCache.date === today) {
      return this.briefingCache.content;
    }

    const missions = await prisma.mission.findMany({
      where: { status: { not: "Completed" } },
      include: { insight: true }
    });

    const contextText = missions.map(m => `- ${m.title} (Priority: ${m.priority}, Score: ${m.missionScore})`).join("\n");
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
      You are the ChiefOS AI Engine. Generate a daily briefing for the user based on these missions:
      ${contextText}
      
      Format your response exactly like this:
      # Executive Summary
      [1 paragraph overview of the day]
      
      # Today's Priorities
      - [Priority 1]
      - [Priority 2]
      
      # Today's Risks
      - [Risk 1]
      
      # Schedule Conflicts
      - [Conflict if any, or "None detected"]
      
      # Recommended Actions
      - [Action 1]
      
      # Recovery Plan
      - [Recovery strategy if overloaded]
    `;

    try {
      const res = await model.generateContent(prompt);
      const text = res.response.text();
      this.briefingCache = { date: today, content: text };
      return text;
    } catch (e) {
      console.error("ChiefEngine.generateDailyBriefing Error:", e);
      return "Failed to generate briefing.";
    }
  }

  static async optimizeSchedule() {
    // Advanced logic to convert Unscheduled Missions into ScheduledBlocks
    // This will be built out fully in Step 4.
    return true;
  }
}
