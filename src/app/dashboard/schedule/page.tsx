import { prisma } from "@/lib/prisma";
import { ScheduleClient } from "./client";

export default async function SchedulePage() {
  const blocks = await prisma.scheduledBlock.findMany({
    include: { mission: true }
  });

  const events = await prisma.calendarEvent.findMany();

  const unscheduledMissions = await prisma.mission.findMany({
    where: {
      status: { not: "Completed" },
      scheduledBlocks: { none: {} }
    }
  });

  const formattedBlocks = blocks.map(b => ({
    id: b.id,
    title: b.title,
    start: b.startTime,
    end: b.endTime,
    type: b.type,
    missionId: b.missionId,
    source: b.source,
    isBlock: true
  }));

  const formattedEvents = events.map(e => ({
    id: e.id,
    title: e.title,
    start: e.startTime,
    end: e.endTime,
    location: e.location,
    type: "Meeting",
    isEvent: true
  }));

  return (
    <ScheduleClient
      initialEvents={[...formattedBlocks, ...formattedEvents]}
      unscheduledMissions={unscheduledMissions}
    />
  );
}
