import { prisma } from "@/lib/prisma";
import { MissionsClient } from "./MissionsClient";
import { cleanupPastMissions } from "../actions";

export default async function MissionsPage() {
  await cleanupPastMissions();
  const missions = await prisma.mission.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <MissionsClient initialMissions={missions} />
  );
}
