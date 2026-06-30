"use client";

import { useState, useEffect } from "react";
import { Inbox, CheckCircle2, Layers, ChevronRight } from "lucide-react";
import { FilterMode } from "@/app/dashboard/page";
import { getFilteredMissions } from "@/app/dashboard/actions";

export function PlannerFilters({ 
  filterMode, 
  onFilterChange 
}: { 
  filterMode: FilterMode;
  onFilterChange: (mode: FilterMode) => void;
}) {
  const [unplannedCount, setUnplannedCount] = useState<number>(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const missions = await getFilteredMissions("unplanned");
        setUnplannedCount(missions.length);
      } catch (err) {
        console.error("Failed to fetch unplanned count", err);
      }
    };

    fetchCount();

    window.addEventListener("task-updated", fetchCount);
    return () => window.removeEventListener("task-updated", fetchCount);
  }, []);

  return (
    <div className="bg-white/40 dark:bg-black/20 backdrop-blur-2xl rounded-2xl p-1.5 flex gap-1 border border-white/40 dark:border-white/10 shadow-sm shadow-black/5">
      <button 
        onClick={() => onFilterChange("unplanned")}
        className={`flex-1 flex items-center justify-center py-2 rounded-xl transition-all ${
          filterMode === "unplanned" 
            ? "bg-white/80 dark:bg-slate-800 shadow-sm border border-white/60 dark:border-white/10" 
            : "hover:bg-white/50 dark:hover:bg-white/5 border border-transparent"
        }`}
      >
        <div className="flex items-center gap-2">
          <Inbox className={`w-4 h-4 ${filterMode === "unplanned" ? "text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`} />
          <span className={`font-semibold text-[11px] uppercase tracking-wider ${filterMode === "unplanned" ? "text-slate-800 dark:text-slate-100" : "text-slate-600 dark:text-slate-400"}`}>Unplanned</span>
          <span className="bg-slate-200/50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-1.5 rounded-md">{unplannedCount}</span>
        </div>
      </button>

      <button 
        onClick={() => onFilterChange("all")}
        className={`flex-1 flex items-center justify-center py-2 rounded-xl transition-all ${
          filterMode === "all" 
            ? "bg-white/80 dark:bg-slate-800 shadow-sm border border-white/60 dark:border-white/10" 
            : "hover:bg-white/50 dark:hover:bg-white/5 border border-transparent"
        }`}
      >
        <div className="flex items-center gap-2">
          <Layers className={`w-4 h-4 ${filterMode === "all" ? "text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`} />
          <span className={`font-semibold text-[11px] uppercase tracking-wider ${filterMode === "all" ? "text-slate-800 dark:text-slate-100" : "text-slate-600 dark:text-slate-400"}`}>All</span>
        </div>
      </button>
    </div>
  );
}

