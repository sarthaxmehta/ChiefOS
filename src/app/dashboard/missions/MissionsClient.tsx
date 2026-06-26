"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  format, 
  isToday, 
  isAfter, 
  startOfDay 
} from "date-fns";
import { 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Calendar, 
  Clock, 
  Plus, 
  Sparkles, 
  Tag, 
  DollarSign, 
  Briefcase, 
  BookOpen, 
  Heart, 
  User, 
  Coins, 
  HelpCircle,
  CalendarDays
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { updateTaskStatus, deleteMission, rescheduleMission } from "@/app/dashboard/actions";
import { TaskCreationDrawer } from "@/components/task-creation-drawer";

interface Mission {
  id: string;
  title: string;
  description: string | null;
  date: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  priority: string;
  status: string;
  category: string | null;
  color: string;
  notes: string | null;
}

interface MissionsClientProps {
  initialMissions: Mission[];
}

const COLOR_MAP: Record<string, string> = {
  Red: "border-l-red-500 dark:border-l-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.04)] hover:shadow-[0_0_20px_rgba(239,68,68,0.08)]",
  Blue: "border-l-blue-500 dark:border-l-blue-500/80 shadow-[0_0_15px_rgba(59,130,246,0.04)] hover:shadow-[0_0_20px_rgba(59,130,246,0.08)]",
  Green: "border-l-emerald-500 dark:border-l-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.04)] hover:shadow-[0_0_20px_rgba(16,185,129,0.08)]",
  Purple: "border-l-purple-500 dark:border-l-purple-500/80 shadow-[0_0_15px_rgba(168,85,247,0.04)] hover:shadow-[0_0_20px_rgba(168,85,247,0.08)]",
  Yellow: "border-l-amber-500 dark:border-l-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.04)] hover:shadow-[0_0_20px_rgba(245,158,11,0.08)]",
  Orange: "border-l-orange-500 dark:border-l-orange-500/80 shadow-[0_0_15px_rgba(249,115,22,0.04)] hover:shadow-[0_0_20px_rgba(249,115,22,0.08)]",
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Work: <Briefcase className="w-3 h-3" />,
  Study: <BookOpen className="w-3 h-3" />,
  Health: <Heart className="w-3 h-3" />,
  Personal: <User className="w-3 h-3" />,
  Finance: <Coins className="w-3 h-3" />,
  Payment: <DollarSign className="w-3.5 h-3.5 text-amber-500" />,
  Custom: <Tag className="w-3 h-3" />
};

export function MissionsClient({ initialMissions }: MissionsClientProps) {
  const [missions, setMissions] = useState<Mission[]>(initialMissions);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("All");

  useEffect(() => {
    setMissions(initialMissions);
  }, [initialMissions]);

  useEffect(() => {
    const handleUpdate = () => {
      window.location.reload();
    };
    window.addEventListener("task-updated", handleUpdate);
    return () => window.removeEventListener("task-updated", handleUpdate);
  }, []);

  const categoriesList = useMemo(() => {
    const cats = new Set<string>();
    missions.forEach(m => {
      if (m.category) cats.add(m.category);
    });
    return ["All", ...Array.from(cats)];
  }, [missions]);

  const filteredMissions = useMemo(() => {
    if (filterCategory === "All") return missions;
    return missions.filter(m => m.category === filterCategory);
  }, [missions, filterCategory]);

  const columns = useMemo(() => {
    const todayStart = startOfDay(new Date());
    
    const todayTasks: Mission[] = [];
    const futureTasks: Mission[] = [];
    const unplannedTasks: Mission[] = [];
    const completedTasks: Mission[] = [];

    filteredMissions.forEach((m) => {
      if (m.status === "Completed") {
        completedTasks.push(m);
      } else if (!m.date && !m.startTime) {
        unplannedTasks.push(m);
      } else {
        const targetDate = m.date ? new Date(m.date) : (m.startTime ? new Date(m.startTime) : null);
        if (targetDate) {
          if (isToday(targetDate)) {
            todayTasks.push(m);
          } else if (isAfter(targetDate, todayStart)) {
            futureTasks.push(m);
          } else {
            todayTasks.push(m);
          }
        } else {
          unplannedTasks.push(m);
        }
      }
    });

    return {
      today: todayTasks,
      future: futureTasks,
      unplanned: unplannedTasks,
      completed: completedTasks,
    };
  }, [filteredMissions]);

  const handleToggleStatus = async (missionId: string, currentStatus: string) => {
    const newStatus = currentStatus === "Completed" ? "Pending" : "Completed";
    setMissions(prev => prev.map(m => m.id === missionId ? { ...m, status: newStatus } : m));
    
    try {
      await updateTaskStatus(missionId, newStatus);
      toast.success(newStatus === "Completed" ? "Task completed!" : "Task marked pending");
      window.dispatchEvent(new Event("task-updated"));
    } catch (e) {
      toast.error("Failed to update status");
      setMissions(initialMissions);
    }
  };

  const handleDeleteTask = async (missionId: string) => {
    setMissions(prev => prev.filter(m => m.id !== missionId));
    
    try {
      await deleteMission(missionId);
      toast.success("Task deleted successfully");
      window.dispatchEvent(new Event("task-updated"));
    } catch (e) {
      toast.error("Failed to delete task");
      setMissions(initialMissions);
    }
  };

  const handleReschedule = async (missionId: string, newDateString: string) => {
    const finalDateStr = newDateString || null;
    try {
      await rescheduleMission(missionId, finalDateStr);
      toast.success(finalDateStr ? "Task scheduled!" : "Task unscheduled!");
      window.dispatchEvent(new Event("task-updated"));
    } catch (e) {
      toast.error("Failed to schedule task");
    }
  };

  return (
    <div className="px-8 py-6 w-full h-[calc(100vh-3.5rem)] flex flex-col max-w-none relative overflow-hidden select-none bg-slate-50/20 dark:bg-[#05060f] transition-colors duration-500">
      {/* Liquid Glass Background Light Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-cyan-500/10 to-blue-500/15 blur-[140px] pointer-events-none z-0" />
      <div className="absolute top-[25%] left-[30%] w-[35%] h-[35%] rounded-full bg-gradient-to-tr from-pink-500/5 to-rose-500/5 blur-[120px] pointer-events-none z-0" />

      {/* Main Content Floating Over Orbs */}
      <div className="relative z-10 flex flex-col flex-1 min-h-0">
        
        {/* Board Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 shrink-0">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
              <span className="p-2 bg-primary/10 rounded-xl text-primary"><Sparkles className="w-6 h-6" /></span>
              Task Space
            </h1>
            <p className="text-sm text-slate-500 mt-1">Manage and orchestrate your daily execution columns.</p>
          </div>

          {/* Category Filters & New Task Trigger */}
          <div className="flex items-center gap-3">
            {/* Dropdown Category Filter */}
            <div className="relative">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="appearance-none bg-white/40 dark:bg-slate-950/40 border border-white/50 dark:border-white/10 rounded-full pl-5 pr-10 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_2px_10px_rgba(0,0,0,0.02)] backdrop-blur-md transition-all"
              >
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>{cat} Tasks</option>
                ))}
              </select>
              <Tag className="w-3.5 h-3.5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center gap-2 bg-primary text-white text-xs font-bold px-5 py-2.5 rounded-full hover:opacity-95 active:scale-95 transition-all shadow-lg shadow-primary/30 hover:shadow-primary/45 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> New Task
            </button>
          </div>
        </div>

        {/* Kanban Board columns layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1 min-h-0 overflow-x-auto pb-4">
          {/* Column 1: Today's Plan */}
          <BoardColumn
            title="Today's Plan"
            tasks={columns.today}
            badgeColor="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200/30 dark:border-purple-800/20"
            onToggleStatus={handleToggleStatus}
            onDelete={handleDeleteTask}
            onReschedule={handleReschedule}
          />

          {/* Column 2: Future Plan */}
          <BoardColumn
            title="Future Plan"
            tasks={columns.future}
            badgeColor="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200/30 dark:border-blue-800/20"
            onToggleStatus={handleToggleStatus}
            onDelete={handleDeleteTask}
            onReschedule={handleReschedule}
          />

          {/* Column 3: Unplanned Tasks */}
          <BoardColumn
            title="Unplanned Tasks"
            tasks={columns.unplanned}
            badgeColor="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200/30 dark:border-amber-800/20"
            onToggleStatus={handleToggleStatus}
            onDelete={handleDeleteTask}
            onReschedule={handleReschedule}
          />

          {/* Column 4: Completed Tasks */}
          <BoardColumn
            title="Completed"
            tasks={columns.completed}
            badgeColor="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200/30 dark:border-emerald-800/20"
            onToggleStatus={handleToggleStatus}
            onDelete={handleDeleteTask}
            onReschedule={handleReschedule}
          />
        </div>

      </div>

      {/* Task Creation Drawer */}
      <TaskCreationDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </div>
  );
}

interface BoardColumnProps {
  title: string;
  tasks: Mission[];
  badgeColor: string;
  onToggleStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onReschedule: (id: string, date: string) => void;
}

function BoardColumn({
  title,
  tasks,
  badgeColor,
  onToggleStatus,
  onDelete,
  onReschedule
}: BoardColumnProps) {
  return (
    <div className="bg-white/10 dark:bg-slate-900/15 backdrop-blur-xl border border-white/30 dark:border-white/5 rounded-[2.5rem] p-5 flex flex-col h-full min-w-[280px] shadow-[0_8px_32px_0_rgba(31,38,135,0.02)]">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-200/20 dark:border-white/5 shrink-0">
        <h2 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 tracking-tight">{title}</h2>
        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full shrink-0 shadow-sm ${badgeColor}`}>
          {tasks.length}
        </span>
      </div>

      {/* Column Scroll Container */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 custom-scrollbar min-h-0 pb-12">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => {
            const isCompleted = task.status === "Completed";
            const borderAccent = COLOR_MAP[task.color || "Red"] || COLOR_MAP.Red;
            
            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 15, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 380, damping: 26 }}
                className={`group border-l-4 p-4.5 rounded-[1.25rem] border border-white/60 dark:border-white/10 bg-white/45 hover:bg-white/60 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] backdrop-blur-2xl transition-all duration-300 flex flex-col gap-3.5 relative overflow-hidden hover:-translate-y-1 hover:scale-[1.01] ${borderAccent} shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.55),0_12px_40px_rgba(0,0,0,0.05)]`}
              >
                {/* Header title/checkbox */}
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onToggleStatus(task.id, task.status)}
                    className="shrink-0 mt-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-primary fill-primary/10 shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-400/80 hover:text-primary transition-all duration-200" />
                    )}
                  </button>
                  <div className="flex-grow min-w-0">
                    <h3 className={`text-xs font-extrabold leading-snug tracking-tight truncate ${isCompleted ? "text-slate-400 dark:text-slate-600 line-through font-medium" : "text-slate-800 dark:text-slate-100"}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className={`text-[10px] mt-1.5 leading-relaxed line-clamp-2 ${isCompleted ? "text-slate-450 dark:text-slate-600" : "text-slate-500"}`}>
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer metadata & category badge */}
                <div className="flex items-center justify-between border-t border-slate-200/10 pt-2.5 mt-0.5 shrink-0 gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    {/* Category Capsule Badge */}
                    {task.category && (
                      <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                        task.category === "Payment"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          : "bg-white/40 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-white/50 dark:border-white/5 shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.3)] backdrop-blur-md"
                      }`}>
                        {CATEGORY_ICONS[task.category] || <HelpCircle className="w-3 h-3" />}
                        {task.category}
                      </span>
                    )}

                    {/* Date Capsule Badge */}
                    {task.date && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase text-slate-500 dark:text-slate-400 bg-white/30 dark:bg-white/5 border border-white/30 dark:border-white/5 px-2 py-0.5 rounded-full shrink-0">
                        <Calendar className="w-2.5 h-2.5 opacity-70" />
                        {format(new Date(task.date), "MMM d")}
                      </span>
                    )}
                  </div>

                  {/* Reschedule Picker & Delete Buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {/* Inline Reschedule Input */}
                    <div className="relative p-1 hover:bg-white/60 dark:hover:bg-white/10 rounded-lg cursor-pointer text-slate-500 dark:text-slate-400">
                      <input
                        type="date"
                        value={task.date ? format(new Date(task.date), "yyyy-MM-dd") : ""}
                        onChange={(e) => onReschedule(task.id, e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        title="Reschedule task"
                      />
                      <CalendarDays className="w-3.5 h-3.5" />
                    </div>

                    <button
                      onClick={() => onDelete(task.id)}
                      className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center select-none opacity-40">
            <span className="text-[10px] italic font-semibold text-slate-400">No tasks in this lane</span>
          </div>
        )}
      </div>
    </div>
  );
}
