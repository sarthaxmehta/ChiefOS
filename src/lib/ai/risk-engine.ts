import { prisma } from "../prisma";

export class RiskEngine {
  /**
   * Deterministically evaluates the user's workload to identify risks (no Gemini).
   */
  static async evaluateWorkloadRisk(userId: string = "default") {
    // 1. Find all pending missions
    const pendingMissions = await prisma.mission.findMany({
      where: { status: "Pending", userId }
    });

    const totalEstimatedMinutes = pendingMissions.reduce((acc, m) => acc + (m.estimatedMinutes || 60), 0);
    
    // 2. Simple risk heuristic for V1: if pending work is > 20 hours
    let riskLevel = "Low";
    if (totalEstimatedMinutes > 1200) {
      riskLevel = "High";
    } else if (totalEstimatedMinutes > 600) {
      riskLevel = "Medium";
    }

    return {
      riskLevel,
      totalPendingTasks: pendingMissions.length,
      totalEstimatedHours: Math.round(totalEstimatedMinutes / 60),
      message: riskLevel === "High" ? "Warning: High workload risk detected. Consider postponing non-essential tasks." : "Workload is manageable."
    };
  }
}
