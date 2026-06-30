import { prisma } from "@/lib/prisma";
import { ScheduleClient } from "./client";
import { cleanupPastMissions } from "../actions";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  await cleanupPastMissions();

  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("User not found");
  const userId = user.id;

  const blocks = await prisma.scheduledBlock.findMany({
    where: { mission: { userId } },
    include: { mission: true }
  });

  const events = await prisma.calendarEvent.findMany({
    where: { userId }
  });

  const unplannedMissions = await prisma.mission.findMany({
    where: {
      userId,
      date: { not: null },
      startTime: null,
      endTime: null
    }
  });

  const formattedBlocks = blocks.map(b => ({
    id: b.id,
    title: b.title,
    start: b.startTime.toISOString(),
    end: b.endTime.toISOString(),
    type: b.type,
    missionId: b.missionId,
    source: b.source,
    color: b.mission?.color || "Red",
    category: b.mission?.category || "General",
    isBlock: true
  }));

  const formattedEvents = events.map(e => ({
    id: e.id,
    title: e.title,
    start: e.startTime.toISOString(),
    end: e.endTime.toISOString(),
    location: e.location,
    type: "Meeting",
    color: "Blue",
    isEvent: true
  }));

  const formattedUnplanned = unplannedMissions.map(m => ({
    id: m.id,
    title: m.title,
    date: m.date!.toISOString(),
    category: m.category || "General",
    color: m.color || "Red",
    status: m.status
  }));

  return (
    <ScheduleClient
      initialEvents={[...formattedBlocks, ...formattedEvents]}
      initialUnplannedTasks={formattedUnplanned}
    />
  );
}
