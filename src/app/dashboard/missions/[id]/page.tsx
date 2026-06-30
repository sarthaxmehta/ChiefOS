import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MissionWorkspace } from "./MissionWorkspace";

import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function MissionWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User not found");

  const mission = await prisma.mission.findFirst({
    where: { id, userId: user.id },
    include: {
      subMissions: { orderBy: { order: "asc" } },
      activities: { orderBy: { createdAt: "desc" } }
    }
  });

  if (!mission) notFound();

  return <MissionWorkspace mission={mission} />;
}
