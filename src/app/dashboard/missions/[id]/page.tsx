import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MissionWorkspace } from "./MissionWorkspace";

export default async function MissionWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const mission = await prisma.mission.findUnique({
    where: { id },
    include: {
      subMissions: { orderBy: { order: "asc" } },
      activities: { orderBy: { createdAt: "desc" } }
    }
  });

  if (!mission) notFound();

  return <MissionWorkspace mission={mission} />;
}
