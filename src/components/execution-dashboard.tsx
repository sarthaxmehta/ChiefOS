"use client";

import { useEffect, useState } from "react";
import { format, differenceInSeconds, addHours } from "date-fns";
import { Play, CheckCircle2, CalendarClock, ListTodo } from "lucide-react";
import { getExecutionData, markMissionDone, startMissionEarly } from "@/app/dashboard/actions";
import { toast } from "sonner";
import Link from "next/link";

type ExecutionData = Awaited<ReturnType<typeof getExecutionData>>;
type ScheduledBlock = ExecutionData["blocks"][0];

export function ExecutionDashboard({ selectedDate }: { selectedDate: Date }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [data, setData] = useState<ExecutionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchExecutionData = () => {
      setLoading(true);
      getExecutionData(selectedDate.toISOString()).then((res) => {
        if (mounted) {
          setData(res);
          setLoading(false);
        }
      });
    };

    fetchExecutionData();

    window.addEventListener("task-updated", fetchExecutionData);
    return () => { 
      mounted = false; 
      window.removeEventListener("task-updated", fetchExecutionData);
    };
  }, [selectedDate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading || !data) {
    return <div className="h-[240px] rounded-[2rem] bg-white/20 dark:bg-slate-900/20 backdrop-blur-3xl animate-pulse" />;
  }

  const { blocks, unscheduledMissionsCount } = data;

  const pendingBlocks = blocks.filter(b => b.mission?.status !== "Completed");
  const nowBlock = pendingBlocks.find(b => new Date(b.startTime) <= currentTime && new Date(b.endTime) > currentTime);
  const nextBlock = pendingBlocks.find(b => new Date(b.startTime) > currentTime);

  const handleMarkDone = async (missionId: string) => {
    try {
      await markMissionDone(missionId);
      toast.success("Mission marked as completed!");
      // Optimistic or re-fetch here if needed
      const updated = await getExecutionData(selectedDate.toISOString());
      setData(updated);
    } catch (e) {
      toast.error("Failed to complete mission");
    }
  };

  const handleStartEarly = async (blockId: string) => {
    try {
      await startMissionEarly(blockId, currentTime);
      toast.success("Started early!");
      const updated = await getExecutionData(selectedDate.toISOString());
      setData(updated);
    } catch (e) {
      toast.error("Failed to start early");
    }
  };

  // EMPTY STATES
  if (pendingBlocks.length === 0) {
    if (unscheduledMissionsCount > 0) {
      return (
        <div className="bg-white/40 dark:bg-black/20 backdrop-blur-2xl rounded-[2rem] p-8 border border-white/40 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] text-center flex flex-col items-center justify-center h-[calc(100%-8px)] mx-1 mb-2 mt-1">
          <ListTodo className="w-10 h-10 text-slate-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">You have {unscheduledMissionsCount} unscheduled tasks.</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">Take a moment to plan your day.</p>
          <Link href="/dashboard/missions" className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black font-semibold rounded-xl text-sm shadow-md hover:scale-105 transition-transform">
            View Tasks
          </Link>
        </div>
      );
    }

    return (
      <div className="bg-white/40 dark:bg-black/20 backdrop-blur-2xl rounded-[2rem] p-8 border border-white/40 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] text-center flex flex-col items-center justify-center h-[calc(100%-8px)] mx-1 mb-2 mt-1">
        <CalendarClock className="w-10 h-10 text-green-500/50 mb-4" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Nothing scheduled.</h3>
        <p className="text-sm text-slate-500 mt-1">Enjoy the free time!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* NOW CARD */}
      <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2rem] p-6 border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800">
          {nowBlock && (
            <div 
              className="h-full bg-primary transition-all duration-1000 ease-linear"
              style={{
                width: `${Math.min(100, Math.max(0, (differenceInSeconds(currentTime, new Date(nowBlock.startTime)) / differenceInSeconds(new Date(nowBlock.endTime), new Date(nowBlock.startTime))) * 100))}%`
              }}
            />
          )}
        </div>

        <div className="flex items-center justify-between mb-4 mt-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Now</span>
          </div>
          {nowBlock && (
            <span className="text-xs font-semibold text-slate-400 bg-white dark:bg-black/20 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800">
              {format(new Date(nowBlock.startTime), "h:mm a")} - {format(new Date(nowBlock.endTime), "h:mm a")}
            </span>
          )}
        </div>

        {nowBlock ? (
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{nowBlock.title}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase rounded-md">
                In Progress
              </span>
            </div>
            <div className="flex items-center gap-3 mt-6">
              {nowBlock.missionId && (
                <button 
                  onClick={() => handleMarkDone(nowBlock.missionId!)}
                  className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-black py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Mark Done
                </button>
              )}
              <button className="flex-1 bg-white/50 dark:bg-white/5 text-slate-700 dark:text-slate-300 py-2.5 rounded-xl text-sm font-semibold hover:bg-white border border-slate-200 dark:border-slate-800 transition-colors">
                Reschedule
              </button>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-sm font-medium text-slate-500">No scheduled task right now.</p>
          </div>
        )}
      </div>

      {/* UP NEXT CARD */}
      {nextBlock ? (
        <div className="bg-white/40 dark:bg-black/20 backdrop-blur-2xl rounded-3xl p-5 border border-white/40 dark:border-white/10 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Up Next</span>
            <span className="text-[11px] font-semibold text-slate-500">
              Starts in {Math.floor(differenceInSeconds(new Date(nextBlock.startTime), currentTime) / 60)}m
            </span>
          </div>
          
          <div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 line-clamp-1">{nextBlock.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {format(new Date(nextBlock.startTime), "h:mm a")} - {format(new Date(nextBlock.endTime), "h:mm a")}
            </p>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <button 
              onClick={() => handleStartEarly(nextBlock.id)}
              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-300 transition-colors flex items-center gap-1"
            >
              <Play className="w-3 h-3" /> Start Early
            </button>
            <button className="px-3 py-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs font-medium transition-colors">
              Reschedule
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white/20 dark:bg-black/10 backdrop-blur-xl rounded-3xl p-5 border border-white/20 dark:border-white/5 flex flex-col items-center justify-center text-center opacity-60 flex-1 min-h-[100px]">
           <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">No further tasks scheduled</span>
        </div>
      )}
    </div>
  );
}
