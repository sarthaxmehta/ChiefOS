"use client";

import { useEffect, useState, useCallback } from "react";
import { format, isToday } from "date-fns";
import { Trash2, CalendarClock, Edit2, CheckCircle2, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getTasksForDate, deleteScheduledTask, updateTaskStatus, getFilteredMissions } from "@/app/dashboard/actions";
import { toast } from "sonner";
import { FilterMode } from "@/app/dashboard/page";

type ScheduledTaskData = Awaited<ReturnType<typeof getTasksForDate>>[0];
type MissionData = Awaited<ReturnType<typeof getFilteredMissions>>[0];

export function TodayTasks({ 
  selectedDate, 
  filterMode,
  onOpenDrawer
}: { 
  selectedDate: Date;
  filterMode: FilterMode;
  onOpenDrawer: () => void;
}) {
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTaskData[]>([]);
  const [missions, setMissions] = useState<MissionData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    if (filterMode === "date") {
      const tasks = await getTasksForDate(selectedDate.toISOString());
      const sortedTasks = [...tasks].sort((a, b) => {
        const aDone = a.mission?.status === "Completed";
        const bDone = b.mission?.status === "Completed";
        if (aDone === bDone) return 0;
        return aDone ? 1 : -1;
      });
      setScheduledTasks(sortedTasks);
      setMissions([]);
    } else {
      const missionsData = await getFilteredMissions(filterMode);
      const sortedMissions = [...missionsData].sort((a, b) => {
        const aDone = a.status === "Completed";
        const bDone = b.status === "Completed";
        if (aDone === bDone) return 0;
        return aDone ? 1 : -1;
      });
      setMissions(sortedMissions);
      setScheduledTasks([]);
    }
    setLoading(false);
  }, [selectedDate, filterMode]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleToggleStatus = async (missionId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "Completed" ? "Pending" : "Completed";
      
      // Optimistic update
      const updatedTasks = scheduledTasks.map(t => t.missionId === missionId && t.mission ? { ...t, mission: { ...t.mission, status: newStatus } } : t);
      const sortedOptimistic = [...updatedTasks].sort((a, b) => {
        const aDone = a.mission?.status === "Completed";
        const bDone = b.mission?.status === "Completed";
        if (aDone === bDone) return 0;
        return aDone ? 1 : -1;
      });
      setScheduledTasks(sortedOptimistic);
      
      const updatedMissions = missions.map(m => m.id === missionId ? { ...m, status: newStatus } : m);
      const sortedOptimisticMissions = [...updatedMissions].sort((a, b) => {
        const aDone = a.status === "Completed";
        const bDone = b.status === "Completed";
        if (aDone === bDone) return 0;
        return aDone ? 1 : -1;
      });
      setMissions(sortedOptimisticMissions);
      
      await updateTaskStatus(missionId, newStatus);
      window.dispatchEvent(new Event("task-updated"));
      if (newStatus === "Completed") toast.success("Task completed!");
    } catch (e) {
      toast.error("Failed to update task");
      fetchTasks(); // revert
    }
  };

  const handleDelete = async (blockId: string) => {
    if (filterMode !== "date") return; // Only block deletions supported here
    try {
      setScheduledTasks(scheduledTasks.filter(t => t.id !== blockId));
      await deleteScheduledTask(blockId);
      window.dispatchEvent(new Event("task-updated"));
      toast.success("Task removed from schedule");
    } catch (e) {
      toast.error("Failed to remove task");
      fetchTasks();
    }
  };

  let title = "Tasks";
  if (filterMode === "date") {
    title = isToday(selectedDate) ? "Tasks for Today" : `Tasks for ${format(selectedDate, "MMM do")}`;
  } else if (filterMode === "unplanned") {
    title = "Unplanned Tasks";
  } else if (filterMode === "planned") {
    title = "Planned Tasks";
  } else if (filterMode === "all") {
    title = "All Tasks";
  }

  return (
    <div className="flex flex-col h-full relative z-10 w-full">
      <div className="px-2 mb-5 h-[90px] shrink-0 flex flex-col justify-center">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 tracking-tighter">
          {title}
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          {filterMode === "date" && scheduledTasks.length > 0 ? `You have ${scheduledTasks.length} ${scheduledTasks.length === 1 ? 'task' : 'tasks'} scheduled.` : "Manage your execution plan."}
        </p>
      </div>

      <div className="bg-white/40 dark:bg-black/20 backdrop-blur-2xl rounded-[2rem] p-6 border border-white/40 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.04)] flex flex-col gap-4 flex-1 overflow-hidden">
        
        {/* Add Task Input */}
        <button 
          onClick={onOpenDrawer}
          className="h-12 w-full bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 rounded-xl border border-white/60 dark:border-white/10 flex items-center px-4 text-sm text-slate-500 dark:text-slate-400 shrink-0 transition-colors"
        >
          + Add task {filterMode === "date" ? `for ${format(selectedDate, "MMM do")}` : ""} <span className="ml-auto text-xs opacity-50 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">⌘N</span>
        </button>
         
        {/* Task List */}
        <div className="space-y-3 mt-4 overflow-y-auto pr-2 flex-1 pb-10">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-white/40 dark:bg-slate-800/40 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filterMode === "date" && scheduledTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <CalendarClock className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-sm font-medium text-slate-500">No tasks scheduled for this date.</p>
            </div>
          ) : filterMode !== "date" && missions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <CalendarClock className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-sm font-medium text-slate-500">No tasks found in this category.</p>
            </div>
          ) : filterMode === "date" ? (
            <AnimatePresence mode="popLayout">
              {scheduledTasks.map((task) => {
                const isDone = task.mission?.status === "Completed";
                
                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    key={task.id} 
                    className="group bg-white/60 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-800 backdrop-blur-md rounded-2xl p-4 border border-white/80 dark:border-white/10 shadow-sm flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => task.missionId && handleToggleStatus(task.missionId, task.mission!.status)}
                        disabled={!task.missionId}
                        className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
                      >
                        {isDone ? <CheckCircle2 className="w-6 h-6 text-primary" /> : <Circle className="w-6 h-6" />}
                      </button>
                      
                      <div className="flex flex-col">
                        <span className={`text-sm font-semibold transition-all ${isDone ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-200"}`}>
                          {task.title}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 mt-0.5">
                          {task.startTime && task.endTime 
                            ? `${format(new Date(task.startTime), "h:mm a")} - ${format(new Date(task.endTime), "h:mm a")}`
                            : "Planned (All Day)"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Reschedule">
                        <CalendarClock className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(task.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" 
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          ) : (
            <AnimatePresence mode="popLayout">
              {missions.map((mission) => {
                const isDone = mission.status === "Completed";
                const blockDates = "scheduledBlocks" in mission && Array.isArray((mission as any).scheduledBlocks) 
                  ? (mission as any).scheduledBlocks.map((b: any) => format(new Date(b.startTime), "MMM do")).join(", ")
                  : null;
                
                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    key={mission.id} 
                    className="group bg-white/60 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-800 backdrop-blur-md rounded-2xl p-4 border border-white/80 dark:border-white/10 shadow-sm flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleToggleStatus(mission.id, mission.status)}
                        className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      >
                        {isDone ? <CheckCircle2 className="w-6 h-6 text-primary" /> : <Circle className="w-6 h-6" />}
                      </button>
                      
                      <div className="flex flex-col">
                        <span className={`text-sm font-semibold transition-all ${isDone ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-200"}`}>
                          {mission.title}
                        </span>
                        {blockDates && blockDates.length > 0 && (
                          <span className="text-[11px] font-medium text-slate-500 mt-0.5">
                            Scheduled for: {blockDates}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Reschedule">
                        <CalendarClock className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" 
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

      </div>
    </div>
  );
}
