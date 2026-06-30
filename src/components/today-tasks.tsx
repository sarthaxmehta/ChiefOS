"use client";

import { useEffect, useState, useCallback } from "react";
import { format, isToday } from "date-fns";
import { 
  Trash2, CalendarClock, Edit2, CheckCircle2, Circle, ChevronDown, ChevronUp, 
  Tag, Clock, Layers, Briefcase, BookOpen, Heart, User, Coins, DollarSign, HelpCircle, CalendarDays, Check 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  getTasksForDate, deleteScheduledTask, updateTaskStatus, getFilteredMissions, 
  deleteMission, rescheduleMission, toggleSubTaskStatus 
} from "@/app/dashboard/actions";
import { toast } from "sonner";
import { FilterMode } from "@/app/dashboard/page";

type ScheduledTaskData = Awaited<ReturnType<typeof getTasksForDate>>[0];
type MissionData = Awaited<ReturnType<typeof getFilteredMissions>>[0];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Work: <Briefcase className="w-3.5 h-3.5 text-blue-500" />,
  Study: <BookOpen className="w-3.5 h-3.5 text-indigo-500" />,
  Health: <Heart className="w-3.5 h-3.5 text-red-500" />,
  Personal: <User className="w-3.5 h-3.5 text-slate-600" />,
  Finance: <Coins className="w-3.5 h-3.5 text-emerald-500" />,
  Payment: <DollarSign className="w-3.5 h-3.5 text-amber-500" />,
  Custom: <Tag className="w-3.5 h-3.5 text-slate-500" />
};

const getCategoryIcon = (category: string | null) => {
  if (!category) return <Tag className="w-3.5 h-3.5 text-slate-500" />;
  return CATEGORY_ICONS[category] || <Tag className="w-3.5 h-3.5 text-slate-500" />;
};

const PRESET_BORDERS: Record<string, string> = {
  Red: "border-l-red-500",
  Blue: "border-l-blue-500",
  Green: "border-l-emerald-500",
  Purple: "border-l-slate-800",
  Yellow: "border-l-amber-500",
  Orange: "border-l-orange-500"
};

const getBorderClass = (color: string) => {
  if (!color || color.startsWith("#")) return "";
  return PRESET_BORDERS[color] || "border-l-primary";
};

export function TodayTasks({ 
  selectedDate, 
  filterMode,
  onOpenDrawer,
  onEdit
}: { 
  selectedDate: Date;
  filterMode: FilterMode;
  onOpenDrawer: () => void;
  onEdit: (task: any) => void;
}) {
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTaskData[]>([]);
  const [missions, setMissions] = useState<MissionData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    if (filterMode === "date") {
      const tzOffset = new Date().getTimezoneOffset();
      const tasks = await getTasksForDate(format(selectedDate, "yyyy-MM-dd"), tzOffset);
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

  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const toggleExpand = (taskId: string) => {
    const newSet = new Set(expandedTasks);
    if (newSet.has(taskId)) {
      newSet.delete(taskId);
    } else {
      newSet.add(taskId);
    }
    setExpandedTasks(newSet);
  };

  const handleToggleSubtask = async (subTaskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "Completed" ? "Pending" : "Completed";
      
      // Optimistic update
      setScheduledTasks(prev => prev.map(t => {
        if (t.mission && t.mission.subMissions) {
          return {
            ...t,
            mission: {
              ...t.mission,
              subMissions: t.mission.subMissions.map((sm: any) => sm.id === subTaskId ? { ...sm, status: newStatus } : sm)
            }
          };
        }
        return t;
      }));

      setMissions(prev => prev.map(m => {
        if (m.subMissions) {
          return {
            ...m,
            subMissions: m.subMissions.map((sm: any) => sm.id === subTaskId ? { ...sm, status: newStatus } : sm)
          };
        }
        return m;
      }));

      await toggleSubTaskStatus(subTaskId, newStatus);
      toast.success("Subtask status updated!");
    } catch (e) {
      toast.error("Failed to update subtask");
      fetchTasks();
    }
  };

  const handleReschedule = async (missionId: string, newDateString: string) => {
    try {
      await rescheduleMission(missionId, newDateString || null);
      toast.success(newDateString ? "Task scheduled!" : "Task unscheduled!");
      fetchTasks();
      window.dispatchEvent(new Event("task-updated"));
    } catch (e) {
      toast.error("Failed to schedule task");
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    const handleUpdate = () => {
      fetchTasks();
    };
    window.addEventListener("task-updated", handleUpdate);
    return () => window.removeEventListener("task-updated", handleUpdate);
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

  const handleDeleteTask = async (missionId: string, blockId?: string) => {
    try {
      if (filterMode === "date" && blockId) {
        setScheduledTasks(scheduledTasks.filter(t => t.id !== blockId));
        await deleteScheduledTask(blockId);
        toast.success("Task removed from schedule");
      } else {
        setMissions(missions.filter(m => m.id !== missionId));
        setScheduledTasks(scheduledTasks.filter(t => t.missionId !== missionId));
        await deleteMission(missionId);
        toast.success("Task deleted successfully");
      }
      window.dispatchEvent(new Event("task-updated"));
    } catch (e) {
      toast.error("Failed to delete task");
      fetchTasks();
    }
  };

  const renderTaskCard = (m: any, blockId?: string) => {
    if (!m) return null;
    const isDone = m.status === "Completed";
    const borderClass = getBorderClass(m.color);
    const hasCustomColor = m.color && m.color.startsWith("#");
    const borderLeftStyle = hasCustomColor ? { borderLeftColor: m.color } : {};
    
    // Subtask counts
    const subMissions = m.subMissions || [];
    const completedSubCount = subMissions.filter((s: any) => s.status === "Completed").length;
    const totalSubCount = subMissions.length;
    const isExpanded = expandedTasks.has(m.id);

    // Tags list
    let parsedTags: string[] = [];
    if (m.tags) {
      try {
        parsedTags = JSON.parse(m.tags);
      } catch (e) {
        parsedTags = m.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
      }
    }

    return (
      <motion.div 
        layout
        initial={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        key={blockId || m.id} 
        className={`group bg-white/60 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-800 backdrop-blur-md rounded-2xl p-5 border border-white/80 dark:border-white/10 shadow-sm flex flex-col gap-3.5 transition-all border-l-4 ${borderClass}`}
        style={borderLeftStyle}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Status toggle checkbox */}
            <button 
              onClick={() => handleToggleStatus(m.id, m.status)}
              className="shrink-0 mt-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              {isDone ? (
                <CheckCircle2 className="w-5.5 h-5.5 text-primary fill-primary/10" />
              ) : (
                <Circle className="w-5.5 h-5.5" />
              )}
            </button>
            
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-bold block truncate leading-tight tracking-tight ${isDone ? "text-slate-400 dark:text-slate-600 line-through font-medium" : "text-slate-800 dark:text-slate-100"}`}>
                {m.title}
              </span>
              
              {/* Scheduled Time info */}
              <span className="text-[11px] font-medium text-slate-500 mt-1 block">
                {filterMode === "date" && blockId ? (
                  m.startTime && m.endTime 
                    ? `${format(new Date(m.startTime), "h:mm a")} - ${format(new Date(m.endTime), "h:mm a")}`
                    : "Planned (All Day)"
                ) : (
                  m.date ? `Scheduled: ${format(new Date(m.date), "MMM d")}` : "Unplanned"
                )}
              </span>

              {/* Description */}
              {m.description && (
                <p className={`text-xs mt-2 leading-relaxed line-clamp-2 ${isDone ? "text-slate-400 dark:text-slate-600" : "text-slate-600 dark:text-slate-400"}`}>
                  {m.description}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons (Edit, Reschedule, Delete) */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button 
              onClick={() => onEdit(m)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer" 
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            {/* Reschedule Input Overlay */}
            <div className="relative p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors" title="Reschedule">
              <input
                type="date"
                value={m.date ? format(new Date(m.date), "yyyy-MM-dd") : ""}
                onChange={(e) => handleReschedule(m.id, e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <CalendarClock className="w-4 h-4" />
            </div>

            <button 
              onClick={() => handleDeleteTask(m.id, blockId)}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer" 
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Badges / Meta row (Category, Priority, Recurring Rule, Tags) */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-200/40 dark:border-white/5 pt-2.5 mt-0.5 shrink-0">
          {/* Category */}
          {m.category && (
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
              m.category === "Payment"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.3)]"
            }`}>
              {getCategoryIcon(m.category)}
              {m.category}
            </span>
          )}

          {/* Priority */}
          {m.priority && (
            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
              m.priority === "Critical" ? "bg-red-500/10 text-red-600 border-red-500/20" :
              m.priority === "High" ? "bg-orange-500/10 text-orange-600 border-orange-500/20" :
              m.priority === "Medium" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
              "bg-slate-100 dark:bg-slate-800 text-slate-500 border-transparent"
            }`}>
              {m.priority}
            </span>
          )}

          {/* Recurring rule / Frequency */}
          {m.recurringRule && (
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase text-indigo-500 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
              <Clock className="w-3 h-3" />
              {m.recurringRule}
            </span>
          )}

          {/* Tags */}
          {parsedTags.map(tag => (
            <span key={tag} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md border border-slate-200/50 dark:border-white/5">
              #{tag}
            </span>
          ))}

          {/* Subtask count / progress badge */}
          {totalSubCount > 0 && (
            <button 
              onClick={() => toggleExpand(m.id)}
              className="ml-auto inline-flex items-center gap-1 text-[10px] font-extrabold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full hover:bg-primary/20 transition-all cursor-pointer"
            >
              <span>Subtasks {completedSubCount}/{totalSubCount}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Subtask checklist details */}
        {totalSubCount > 0 && isExpanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-100 dark:border-white/5 pt-3 mt-1.5 space-y-2 overflow-hidden"
          >
            {subMissions.map((sub: any) => {
              const isSubDone = sub.status === "Completed";
              return (
                <div 
                  key={sub.id} 
                  className="flex items-center gap-2.5 text-xs text-slate-650 dark:text-slate-350 bg-slate-50/50 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-205/50 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-colors"
                >
                  <button 
                    onClick={() => handleToggleSubtask(sub.id, sub.status)}
                    className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {isSubDone ? (
                      <CheckCircle2 className="w-4 h-4 text-primary fill-primary/10" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>
                  <span className={`truncate ${isSubDone ? "line-through text-slate-400 dark:text-slate-600 font-medium" : "font-semibold"}`}>
                    {sub.title}
                  </span>
                </div>
              );
            })}
          </motion.div>
        )}
      </motion.div>
    );
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
          className="h-12 w-full bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 rounded-xl border border-white/60 dark:border-white/10 flex items-center px-4 text-sm text-slate-500 dark:text-slate-400 shrink-0 transition-colors cursor-pointer"
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
              {scheduledTasks.map((task) => renderTaskCard(task.mission, task.id))}
            </AnimatePresence>
          ) : (
            <AnimatePresence mode="popLayout">
              {missions.map((mission) => renderTaskCard(mission))}
            </AnimatePresence>
          )}
        </div>

      </div>
    </div>
  );
}
