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

const COLOR_MAP: Record<string, { border: string, bg: string, text: string, badge: string }> = {
  Red:    { border: "border-l-red-500",    bg: "bg-red-500/[0.02] dark:bg-red-500/[0.03] hover:bg-red-500/[0.04]",    text: "text-red-700 dark:text-red-300",    badge: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20" },
  Blue:   { border: "border-l-blue-500",   bg: "bg-blue-500/[0.02] dark:bg-blue-500/[0.03] hover:bg-blue-500/[0.04]",  text: "text-blue-700 dark:text-blue-300",  badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20" },
  Green:  { border: "border-l-emerald-500",bg: "bg-emerald-500/[0.02] dark:bg-emerald-500/[0.03] hover:bg-emerald-500/[0.04]", text: "text-emerald-700 dark:text-emerald-300", badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20" },
  Purple: { border: "border-l-purple-500", bg: "bg-purple-500/[0.02] dark:bg-purple-500/[0.03] hover:bg-purple-500/[0.04]",text: "text-purple-700 dark:text-purple-300",badge: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20" },
  Yellow: { border: "border-l-amber-500",  bg: "bg-amber-500/[0.02] dark:bg-amber-500/[0.03] hover:bg-amber-500/[0.04]",  text: "text-amber-700 dark:text-amber-300",  badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20" },
  Orange: { border: "border-l-orange-500", bg: "bg-orange-500/[0.02] dark:bg-orange-500/[0.03] hover:bg-orange-500/[0.04]",text: "text-orange-700 dark:text-orange-300",badge: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20" }
};

const getCustomColorStyles = (color: string) => {
  if (color && color.startsWith("#")) {
    return {
      borderClass: "",
      bgClass: "bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-100/80",
      textClass: "text-neutral-700 dark:text-neutral-300",
      badgeClass: "bg-neutral-100 text-neutral-700 border-neutral-250/20",
      borderStyle: { borderLeftColor: color },
      bgStyle: { backgroundColor: `${color}0D` }, // ~5% opacity
      textStyle: { color: color },
      badgeStyle: { backgroundColor: `${color}1A`, color: color, borderColor: `${color}33` }
    };
  }
  const c = COLOR_MAP[color || "Red"] || COLOR_MAP.Red;
  return {
    borderClass: c.border,
    bgClass: c.bg,
    textClass: c.text,
    badgeClass: c.badge,
    borderStyle: {},
    bgStyle: {},
    textStyle: {},
    badgeStyle: {}
  };
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
    <div className="px-8 py-6 w-full h-full flex flex-col max-w-none relative overflow-hidden select-none bg-transparent transition-colors duration-500">
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
    <div className="bg-slate-100/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-[2.5rem] p-5 flex flex-col h-full min-w-[280px] shadow-[inset_0_2px_8px_0_rgba(15,23,42,0.04)] dark:shadow-[inset_0_2px_8px_0_rgba(0,0,0,0.4)]">
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
            const colorStyles = getCustomColorStyles(task.color || "Red");
            
            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 15, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 380, damping: 26 }}
                className={`group border-l-4 p-5 rounded-[1.25rem] border border-neutral-200 dark:border-neutral-800/80 backdrop-blur-md shadow-md shadow-neutral-200/5 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col gap-3.5 relative overflow-hidden ${colorStyles.borderClass} ${colorStyles.bgClass} ${colorStyles.textClass}`}
                style={{
                  ...colorStyles.borderStyle,
                  ...colorStyles.bgStyle,
                  ...colorStyles.textStyle
                }}
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
                      <p className={`text-[10px] mt-1.5 leading-relaxed line-clamp-2 ${isCompleted ? "text-slate-400 dark:text-slate-500" : "text-slate-500"}`}>
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer metadata & category badge */}
                <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-white/10 pt-2.5 mt-0.5 shrink-0 gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    {/* Category Capsule Badge */}
                    {task.category && (
                      <span 
                        className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border shrink-0 ${colorStyles.badgeClass}`}
                        style={colorStyles.badgeStyle}
                      >
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
