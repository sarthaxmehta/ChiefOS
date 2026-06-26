import { prisma } from "@/lib/prisma";
import { MissionsClient } from "./MissionsClient";

export default async function MissionsPage() {
  const missions = await prisma.mission.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <MissionsClient initialMissions={missions} />
  );
}
