import { prisma } from "@/lib/prisma";
import { MissionsClient } from "./MissionsClient";
import { cleanupPastMissions } from "../actions";

import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function MissionsPage() {
  await cleanupPastMissions();

  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User not found");

  const missions = await prisma.mission.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" }
  });

  return (
    <MissionsClient initialMissions={missions} />
  );
}
