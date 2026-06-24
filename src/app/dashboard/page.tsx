"use client";

import { useState } from "react";
import { PlannerFilters } from "@/components/planner-filters";
import { PlannerCalendar } from "@/components/planner-calendar";
import { CurrentTime } from "@/components/current-time";
import { ExecutionDashboard } from "@/components/execution-dashboard";
import { TodayTasks } from "@/components/today-tasks";
import { DashboardAIPanel } from "@/components/dashboard-ai-panel";
import { TaskCreationDrawer } from "@/components/task-creation-drawer";
import { format, isToday } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { BotMessageSquare } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";

export type FilterMode = "date" | "unplanned" | "planned" | "all";

export default function TodayView() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterMode, setFilterMode] = useState<FilterMode>("date");
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showTaskDrawer, setShowTaskDrawer] = useState(false);

  useHotkeys('meta+n, ctrl+n', (e) => {
    e.preventDefault();
    setShowTaskDrawer(true);
  }, { enableOnFormTags: false });

  // When date is selected on calendar, reset filter to 'date'
  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setFilterMode("date");
  };

  return (
    <div className="pt-0 pl-6 pr-4 pb-4 w-full h-full overflow-hidden relative">
      <div className="flex gap-8 h-full">
        
        {/* Left Column: Planner */}
        <div className="flex flex-col h-[calc(100vh-4rem)] w-[380px] shrink-0">
          <div className="flex items-center gap-4 px-2 mb-5 shrink-0 h-[90px]">
            <div className="relative overflow-hidden h-[90px] flex items-center">
              <AnimatePresence mode="popLayout">
                <motion.h1 
                  key={selectedDate.getTime()}
                  initial={{ y: 40, opacity: 0, scale: 0.9 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -40, opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="text-7xl font-bold tracking-tighter text-slate-800 dark:text-slate-100"
                >
                  {format(selectedDate, "dd")}
                </motion.h1>
              </AnimatePresence>
            </div>
            <div className="flex flex-col justify-center">
              <div className="relative overflow-hidden h-[30px] flex items-center mb-1.5">
                <AnimatePresence mode="popLayout">
                  <motion.span 
                    key={selectedDate.getTime()}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.05 }}
                    className="text-2xl font-semibold text-slate-700 dark:text-slate-200 leading-none tracking-tight"
                  >
                    {format(selectedDate, "EEEE")}
                  </motion.span>
                </AnimatePresence>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-slate-500 uppercase tracking-widest">
                  {format(selectedDate, "MMMM yyyy")}
                </span>
                {isToday(selectedDate) && (
                  <div className="flex items-center gap-2 border-l border-slate-300 dark:border-slate-700 pl-2 ml-1">
                    <span className="px-2 py-[3px] rounded-md bg-slate-800 dark:bg-white text-white dark:text-black text-[9px] font-bold uppercase tracking-widest">
                      Today
                    </span>
                    <span className="text-[13px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">
                      <CurrentTime />
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col flex-1 gap-6 min-h-0">
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1 pb-4">
              <ExecutionDashboard selectedDate={selectedDate} />
            </div>
            <div className="shrink-0">
              <PlannerFilters filterMode={filterMode} onFilterChange={setFilterMode} />
            </div>
            <div className="shrink-0 pb-2">
              <PlannerCalendar 
                selectedDate={selectedDate} 
                onSelectDate={handleSelectDate} 
              />
            </div>
          </div>
        </div>

        {/* Right Column: Todo's */}
        <motion.div 
          layout
          className="flex-1 h-[calc(100vh-4rem)] relative min-w-0"
        >
          <TodayTasks 
            selectedDate={selectedDate} 
            filterMode={filterMode} 
            onOpenDrawer={() => setShowTaskDrawer(true)} 
          />
        </motion.div>

        {/* AI Panel Slide-In */}
        <AnimatePresence>
          {showAIPanel && (
            <DashboardAIPanel onClose={() => setShowAIPanel(false)} />
          )}
        </AnimatePresence>
        
        {/* FAB Button if AI Panel is closed */}
        <AnimatePresence>
          {!showAIPanel && (
            <motion.button
              initial={{ y: 100, x: 100, opacity: 0 }}
              animate={{ y: 0, x: 0, opacity: 1 }}
              exit={{ y: 100, x: 100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={() => setShowAIPanel(true)}
              className="absolute bottom-6 right-6 px-5 py-3.5 bg-slate-900 dark:bg-white rounded-full shadow-2xl shadow-black/20 flex items-center gap-2.5 text-white dark:text-black hover:scale-[1.02] transition-transform z-[100]"
            >
              <BotMessageSquare className="w-5 h-5" />
              <span className="font-bold text-sm">Chief OS</span>
            </motion.button>
          )}
        </AnimatePresence>

        <TaskCreationDrawer 
          isOpen={showTaskDrawer} 
          onClose={() => setShowTaskDrawer(false)} 
        />

      </div>
    </div>
  );
}
