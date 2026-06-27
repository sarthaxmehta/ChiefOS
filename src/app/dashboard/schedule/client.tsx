"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { 
  format, 
  addDays, 
  subDays, 
  addWeeks, 
  subWeeks, 
  addMonths, 
  subMonths, 
  startOfWeek, 
  startOfMonth, 
  isSameDay, 
  isToday,
  isSameMonth
} from "date-fns";
import { ChevronLeft, ChevronRight, ChevronDown, MapPin, Link as LinkIcon, Video, Check, HelpCircle, Circle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { updateTaskStatus } from "@/app/dashboard/actions";

interface EventItem {
  id: string;
  title: string;
  start: string; // ISO String
  end: string;   // ISO String
  type: string;
  missionId?: string | null;
  source?: string;
  color?: string;
  category?: string;
  location?: string | null;
  isBlock?: boolean;
  isEvent?: boolean;
}

interface UnplannedTaskItem {
  id: string;
  title: string;
  date: string; // ISO String
  category: string;
  color: string;
  status: string;
}

interface ScheduleClientProps {
  initialEvents: EventItem[];
  initialUnplannedTasks?: UnplannedTaskItem[];
}

const COLOR_MAP: Record<string, { border: string, bg: string, text: string, indicator: string }> = {
  Red:    { border: "border-l-red-500",    bg: "bg-red-500/10 dark:bg-red-500/15",    text: "text-red-700 dark:text-red-300",    indicator: "bg-red-500" },
  Blue:   { border: "border-l-blue-500",   bg: "bg-blue-500/10 dark:bg-blue-500/15",  text: "text-blue-700 dark:text-blue-300",  indicator: "bg-blue-500" },
  Green:  { border: "border-l-emerald-500",bg: "bg-emerald-500/10 dark:bg-emerald-500/15", text: "text-emerald-700 dark:text-emerald-300", indicator: "bg-emerald-500" },
  Purple: { border: "border-l-purple-500", bg: "bg-purple-500/10 dark:bg-purple-500/15",text: "text-purple-700 dark:text-purple-300",indicator: "bg-purple-500" },
  Yellow: { border: "border-l-amber-500",  bg: "bg-amber-500/10 dark:bg-amber-500/15",  text: "text-amber-700 dark:text-amber-300",  indicator: "bg-amber-500" },
  Orange: { border: "border-l-orange-500", bg: "bg-orange-500/10 dark:bg-orange-500/15",text: "text-orange-700 dark:text-orange-300",indicator: "bg-orange-500" }
};

const getCustomColorStyles = (color: string) => {
  if (color && color.startsWith("#")) {
    return {
      borderClass: "",
      bgClass: "",
      textClass: "",
      indicatorClass: "",
      borderStyle: { borderLeftColor: color },
      bgStyle: { backgroundColor: `${color}1A` }, // 10% opacity
      textStyle: { color: color },
      indicatorStyle: { backgroundColor: color }
    };
  }
  const c = COLOR_MAP[color || "Red"] || COLOR_MAP.Red;
  return {
    borderClass: c.border,
    bgClass: c.bg,
    textClass: c.text,
    indicatorClass: c.indicator,
    borderStyle: {},
    bgStyle: {},
    textStyle: {},
    indicatorStyle: {}
  };
};

const getAvatarsForEvent = (eventId: string, count: number) => {
  const seeds = ["Sarthak", "Jane", "Alex", "John", "Sarah", "Emily", "Bob", "Alice"];
  // Deterministic seed based on string hash
  let hash = 0;
  for (let i = 0; i < eventId.length; i++) {
    hash = eventId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const result = [];
  for (let i = 0; i < count; i++) {
    const seedIndex = Math.abs((hash + i) % seeds.length);
    result.push(`https://api.dicebear.com/7.x/notionists/svg?seed=${seeds[seedIndex]}`);
  }
  return result;
};

export function ScheduleClient({ initialEvents, initialUnplannedTasks = [] }: ScheduleClientProps) {
  const [unplannedTasks, setUnplannedTasks] = useState<UnplannedTaskItem[]>(initialUnplannedTasks);
  
  useEffect(() => {
    setUnplannedTasks(initialUnplannedTasks);
  }, [initialUnplannedTasks]);

  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  const [cDate, setCDate] = useState<Date>(new Date());
  const [now, setNow] = useState<Date>(new Date());
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date>(cDate);

  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync picker date with calendar date when it changes
  useEffect(() => {
    setPickerDate(cDate);
  }, [cDate]);

  const pickerDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(pickerDate), { weekStartsOn: 1 });
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [pickerDate]);

  const handleSelectPickerDay = (day: Date) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setCDate(day);
    setViewMode("day");
    setShowMiniCalendar(false);
  };

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setShowMiniCalendar(true);
  };

  const handleMouseLeave = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setShowMiniCalendar(false);
    }, 2000);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const hourRowHeight = 100; // px
  const startHourGrid = 0;
  const endHourGrid = 24;
  const totalHours = endHourGrid - startHourGrid;

  // Sync current time indicator
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handlePrev = () => {
    if (viewMode === "day") setCDate(subDays(cDate, 1));
    else if (viewMode === "week") setCDate(subWeeks(cDate, 7)); // Moves by exactly one week
    else if (viewMode === "month") setCDate(subMonths(cDate, 1));
  };

  const handleNext = () => {
    if (viewMode === "day") setCDate(addDays(cDate, 1));
    else if (viewMode === "week") setCDate(addWeeks(cDate, 1)); // Moves by exactly one week
    else if (viewMode === "month") setCDate(addMonths(cDate, 1));
  };

  const handleToday = () => {
    setCDate(new Date());
  };

  const activeHeaderMonthText = useMemo(() => {
    return format(cDate, "MMMM yyyy");
  }, [cDate]);

  const startOfWeekDate = useMemo(() => {
    return startOfWeek(cDate, { weekStartsOn: 1 }); // Start on Monday
  }, [cDate]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(startOfWeekDate, i));
  }, [startOfWeekDate]);

  const isTodayInCurrentWeek = useMemo(() => {
    const start = startOfWeekDate;
    const end = addDays(start, 6);
    return now >= start && now <= end;
  }, [startOfWeekDate, now]);

  const todayIndex = useMemo(() => {
    return (now.getDay() + 6) % 7; // Convert to Mon=0... Sun=6
  }, [now]);

  const timeIndicatorTop = useMemo(() => {
    const nowHour = now.getHours();
    const nowMin = now.getMinutes();
    if (nowHour >= startHourGrid && nowHour < endHourGrid) {
      const currentMinutesFromStart = (nowHour - startHourGrid) * 60 + nowMin;
      return (currentMinutesFromStart / 60) * hourRowHeight;
    }
    return -1;
  }, [now]);

  // Pre-process overlapping day events for rendering
  const getPositionedEvents = (day: Date) => {
    const dayEvents = initialEvents.filter(e => isSameDay(new Date(e.start), day));
    if (dayEvents.length === 0) return [];

    // Sort by start time
    const sorted = [...dayEvents].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    // Resolve overlapping layout positioning
    const positions: Record<string, string> = {};
    for (let i = 0; i < sorted.length; i++) {
      const ev = sorted[i];
      const s = new Date(ev.start).getTime();
      const e = new Date(ev.end).getTime();
      
      let overlapCount = 0;
      for (let j = 0; j < i; j++) {
        const prev = sorted[j];
        const ps = new Date(prev.start).getTime();
        const pe = new Date(prev.end).getTime();
        if (s < pe && e > ps) {
          overlapCount++;
        }
      }

      if (overlapCount === 0) {
        positions[ev.id] = "w-[92%] left-[4%]";
      } else if (overlapCount === 1) {
        positions[ev.id] = "w-[44%] left-[50%] z-10 shadow-md";
      } else {
        positions[ev.id] = "w-[40%] left-[56%] z-20 shadow-lg border border-border/80";
      }
    }

    return sorted.map(event => {
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      const startHour = startDate.getHours();
      const startMin = startDate.getMinutes();

      // Clamp values to visible hour grid
      const clampedStartHour = Math.max(startHourGrid, Math.min(endHourGrid, startHour));
      const startMinutesFromGrid = (clampedStartHour - startHourGrid) * 60 + (startHour >= startHourGrid ? startMin : 0);
      const durationMinutes = (endDate.getTime() - startDate.getTime()) / 60000;

      const top = (startMinutesFromGrid / 60) * hourRowHeight;
      const height = Math.max(45, (durationMinutes / 60) * hourRowHeight); // Ensure minimum height of 45px for legibility

      return {
        ...event,
        top,
        height,
        widthClass: positions[event.id] || "w-[92%] left-[4%]",
        startTimeStr: format(startDate, "HH:mm"),
        endTimeStr: format(endDate, "HH:mm")
      };
    });
  };

  // Month View helper
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(cDate), { weekStartsOn: 1 });
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [cDate]);

  return (
    <div className="px-8 py-4 w-full h-full flex flex-col max-w-none relative overflow-hidden">
      {/* Backdrop for closing Mini Calendar picker */}
      {showMiniCalendar && (
        <div 
          className="fixed inset-0 z-40 cursor-default bg-transparent"
          onClick={() => {
            if (closeTimeoutRef.current) {
              clearTimeout(closeTimeoutRef.current);
              closeTimeoutRef.current = null;
            }
            setShowMiniCalendar(false);
          }}
        />
      )}

      {/* Main Container that defines relative positioning for card and overlays */}
      <div 
        className="flex flex-col flex-1 relative h-full w-full"
        style={{
          filter: "drop-shadow(0 25px 15px rgba(0, 0, 0, 0.08)) drop-shadow(0 10px 10px rgba(0, 0, 0, 0.06))",
        }}
      >
        {/* Floating Card Wrapper */}
        <div 
          style={{
            maskImage: 'radial-gradient(circle at 106px 16px, black 15.5px, transparent 16px), radial-gradient(circle at 16px 106px, black 15.5px, transparent 16px), radial-gradient(circle at 44px 44px, transparent 51.5px, black 52px)',
            WebkitMaskImage: 'radial-gradient(circle at 106px 16px, black 15.5px, transparent 16px), radial-gradient(circle at 16px 106px, black 15.5px, transparent 16px), radial-gradient(circle at 44px 44px, transparent 51.5px, black 52px)',
          }}
          className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/60 dark:border-white/10 rounded-[2rem] flex flex-col flex-1 overflow-hidden relative"
        >
          
          {/* Floating Card Header */}
          <div className="flex items-center justify-between pt-8 pb-6 px-8 pr-12 border-b border-slate-100 dark:border-white/5 shrink-0 select-none">
            
            {/* Left Navigation Controls */}
            <div className="flex items-center gap-4 ml-28 min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white capitalize truncate">
                {activeHeaderMonthText}
              </h1>
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200/50 dark:border-white/5 shadow-sm shrink-0">
                <button 
                  onClick={handlePrev}
                  className="p-1.5 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-lg text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleToday}
                  className="px-3 py-1 text-xs font-bold hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-lg text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                >
                  Today
                </button>
                <button 
                  onClick={handleNext}
                  className="p-1.5 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-lg text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right View Mode Selector */}
            <div className="relative shrink-0">
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as any)}
                className="appearance-none bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/50 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-white/5 rounded-xl pl-4 pr-10 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer shadow-sm transition-all"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

        {/* Floating Card Body Grid (Scrollable) */}
        <div className="flex-1 overflow-y-auto mt-6 pr-1 custom-scrollbar min-h-0">
          
          {/* Day & Week View Layout */}
          {(viewMode === "day" || viewMode === "week") && (
            <div className="flex flex-col h-full min-w-[750px] md:min-w-0">
              
              {/* Day Columns Header */}
              <div className="flex select-none border-b border-slate-100 dark:border-white/5 pb-3">
                {/* Hours placeholder margin */}
                <div className="w-16 md:w-20 shrink-0" />
                
                {/* Headers */}
                <div className="flex-grow flex">
                  {viewMode === "week" ? (
                    weekDays.map((day, idx) => {
                      const active = isToday(day);
                      return (
                        <div key={idx} className="flex-grow flex-1 flex flex-col items-center border-r border-slate-200 dark:border-white/10 last:border-r-0">
                          <span className={`text-[10px] font-extrabold uppercase tracking-widest ${active ? "text-primary" : "text-slate-400 dark:text-slate-600"}`}>
                            {format(day, "EEEE")}
                          </span>
                          <span className={`text-2xl font-black mt-0.5 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            active 
                              ? "bg-primary text-white shadow-lg shadow-primary/30" 
                              : "text-slate-800 dark:text-slate-200"
                          }`}>
                            {format(day, "d")}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex-grow flex flex-col items-center">
                      <span className="text-xs font-extrabold uppercase tracking-widest text-primary">
                        {format(cDate, "EEEE")}
                      </span>
                      <span className="text-3xl font-black mt-0.5 bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                        {format(cDate, "d")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Unscheduled Date-Specific Tasks Row (All-Day / Planned without Time) */}
              <div className="flex select-none border-b border-slate-200 dark:border-white/10 py-3 bg-slate-50/30 dark:bg-slate-900/10 shrink-0">
                {/* Hours placeholder margin */}
                <div className="w-16 md:w-20 shrink-0" />
                
                {/* Task Columns */}
                <div className="flex-grow flex">
                  {viewMode === "week" ? (
                    weekDays.map((day, idx) => {
                      const tasksForDay = unplannedTasks.filter(t => isSameDay(new Date(t.date), day));
                      return (
                        <div key={idx} className="flex-grow flex-1 flex flex-col gap-1.5 px-3 border-r border-slate-200 dark:border-white/10 last:border-r-0 min-h-[40px] justify-center">
                          {tasksForDay.length > 0 ? (
                            tasksForDay.map(task => (
                              <UnplannedTaskPill key={task.id} task={task} />
                            ))
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex-grow flex flex-col gap-1.5 px-4 min-h-[40px] justify-center">
                      {unplannedTasks.filter(t => isSameDay(new Date(t.date), cDate)).length > 0 ? (
                        unplannedTasks.filter(t => isSameDay(new Date(t.date), cDate)).map(task => (
                          <UnplannedTaskPill key={task.id} task={task} />
                        ))
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              {/* Scrollable Hours Grid */}
              <div 
                className="relative flex" 
                style={{ height: `${totalHours * hourRowHeight}px` }}
              >
                
                {/* Left Hours Labels column */}
                <div className="w-16 md:w-20 shrink-0 border-r border-slate-100 dark:border-white/5 relative h-full select-none text-[11px] font-bold text-slate-400 dark:text-slate-600">
                  {Array.from({ length: totalHours }).map((_, idx) => (
                    <div 
                      key={idx} 
                      className="absolute right-3 -translate-y-1/2"
                      style={{ top: `${idx * hourRowHeight}px` }}
                    >
                      {format(new Date().setHours(startHourGrid + idx, 0), "HH:mm")}
                    </div>
                  ))}
                </div>

                {/* Grid Columns Area */}
                <div className="flex-grow flex relative h-full">
                  
                  {/* Background grid horizontal divider lines */}
                  <div className="absolute inset-0 flex flex-col pointer-events-none">
                    {Array.from({ length: totalHours }).map((_, idx) => (
                      <div 
                        key={idx} 
                        className="w-full flex flex-col"
                        style={{ height: `${hourRowHeight}px` }}
                      >
                        {/* 30-minute dashed subdivision line */}
                        <div className="h-1/2 border-b border-dashed border-slate-200/50 dark:border-white/5" />
                        {/* Hour solid divider line */}
                        <div className="h-1/2 border-b border-slate-200 dark:border-white/10" />
                      </div>
                    ))}
                  </div>

                  {/* Red Live Current Time Indicator Line */}
                  {timeIndicatorTop !== -1 && (
                    (viewMode === "week" && isTodayInCurrentWeek) || 
                    (viewMode === "day" && isToday(cDate))
                  ) && (
                    <div 
                      className="absolute left-0 right-0 z-30 pointer-events-none flex items-center" 
                      style={{ top: `${timeIndicatorTop}px` }}
                    >
                      {/* Left Arrow pointer */}
                      <div 
                        className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-red-500 shrink-0"
                        style={{
                          marginLeft: viewMode === "week" ? `calc(${todayIndex * 14.28}% - 4px)` : "-4px"
                        }}
                      />
                      {/* Line */}
                      <div 
                        className="bg-red-500 h-[1.5px]"
                        style={{
                          width: viewMode === "week" ? "14.28%" : "100%",
                        }}
                      />
                    </div>
                  )}

                  {/* Event Blocks columns render */}
                  {viewMode === "week" ? (
                    weekDays.map((day, dayIdx) => {
                      const eventsForDay = getPositionedEvents(day);
                      return (
                        <div key={dayIdx} className="flex-grow flex-1 relative h-full border-r border-slate-200 dark:border-white/10 last:border-r-0">
                          {eventsForDay.map(e => {
                            const colorInfo = getCustomColorStyles(e.color || "Red");
                            const avatars = getAvatarsForEvent(e.id, 3);

                            return (
                              <div
                                key={e.id}
                                className={`absolute rounded-2xl border-l-4 p-3 flex flex-col justify-between transition-all group overflow-hidden ${colorInfo.borderClass} ${colorInfo.bgClass} ${colorInfo.textClass} ${e.widthClass} cursor-pointer hover:shadow-lg hover:scale-[1.01]`}
                                style={{ 
                                  top: `${e.top}px`, 
                                  height: `${e.height}px`,
                                  ...colorInfo.borderStyle,
                                  ...colorInfo.bgStyle,
                                  ...colorInfo.textStyle
                                }}
                              >
                                <div>
                                  <div className="flex items-center gap-1 opacity-80 text-[10px] font-bold tracking-tight">
                                    <span>{e.startTimeStr}</span>
                                    <span>-</span>
                                    <span>{e.endTimeStr}</span>
                                  </div>
                                  <h4 className="font-extrabold text-xs tracking-tight text-slate-800 dark:text-white mt-0.5 truncate leading-snug">
                                    {e.title}
                                  </h4>
                                </div>

                                <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/20">
                                  {/* Subtitle / Icon location */}
                                  <div className="flex items-center gap-1 text-[10px] opacity-75 truncate max-w-[65%]">
                                    <MapPin className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{e.location || e.category || "Workspace"}</span>
                                  </div>

                                  {/* Avatars */}
                                  <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                                    {avatars.map((url, avIdx) => (
                                      <img 
                                        key={avIdx}
                                        className="inline-block h-4.5 w-4.5 rounded-full ring-1 ring-white dark:ring-slate-900 shrink-0" 
                                        src={url} 
                                        alt="" 
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex-grow relative h-full">
                      {getPositionedEvents(cDate).map(e => {
                        const colorInfo = getCustomColorStyles(e.color || "Red");
                        const avatars = getAvatarsForEvent(e.id, 4);

                        return (
                          <div
                            key={e.id}
                            className={`absolute rounded-2xl border-l-4 p-4 flex flex-col justify-between transition-all group overflow-hidden ${colorInfo.borderClass} ${colorInfo.bgClass} ${colorInfo.textClass} ${e.widthClass} cursor-pointer hover:shadow-xl hover:scale-[1.01]`}
                            style={{ 
                              top: `${e.top}px`, 
                              height: `${e.height}px`,
                              ...colorInfo.borderStyle,
                              ...colorInfo.bgStyle,
                              ...colorInfo.textStyle
                            }}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 opacity-80 text-xs font-bold">
                                <span>{e.startTimeStr}</span>
                                <span>-</span>
                                <span>{e.endTimeStr}</span>
                              </div>
                              <h4 className="font-black text-sm tracking-tight text-slate-800 dark:text-white mt-1 leading-snug">
                                {e.title}
                              </h4>
                            </div>

                            <div className="flex items-center justify-between mt-4 pt-2 border-t border-slate-200/20">
                              <div className="flex items-center gap-1.5 text-xs opacity-75 truncate max-w-[70%]">
                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{e.location || e.category || "Workspace"}</span>
                              </div>
                              <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                                {avatars.map((url, avIdx) => (
                                  <img 
                                    key={avIdx}
                                    className="inline-block h-5 w-5 rounded-full ring-1.5 ring-white dark:ring-slate-900 shrink-0" 
                                    src={url} 
                                    alt="" 
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>

              </div>

            </div>
          )}

          {/* Month View Layout Grid */}
          {viewMode === "month" && (
            <div className="flex flex-col gap-4 select-none">
              
              {/* Day Headers (Mon - Sun) */}
              <div className="grid grid-cols-7 text-center">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayName, idx) => (
                  <span 
                    key={idx} 
                    className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-600 pb-2"
                  >
                    {dayName}
                  </span>
                ))}
              </div>

              {/* Grid of Day Cells */}
              <div className="grid grid-cols-7 border-t border-l border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden bg-slate-50/30 dark:bg-black/10">
                {monthDays.map((day, idx) => {
                  const active = isToday(day);
                  const isCurrentMonth = day.getMonth() === cDate.getMonth();
                  const dayEvents = initialEvents.filter(e => isSameDay(new Date(e.start), day));
                  const dayUnplanned = unplannedTasks.filter(t => isSameDay(new Date(t.date), day));
                  const combinedItems = [
                    ...dayEvents.map(e => ({ id: e.id, title: e.title, color: e.color || "Red", isCompleted: false })),
                    ...dayUnplanned.map(t => ({ id: t.id, title: t.title, color: t.color || "Red", isCompleted: t.status === "Completed" }))
                  ];

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setCDate(day);
                        setViewMode("day");
                      }}
                      className="min-h-[105px] md:min-h-[125px] flex flex-col p-2 border-r border-b border-slate-200 dark:border-white/10 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer relative"
                    >
                      {/* Day Number Label */}
                      <div className="flex justify-between items-start mb-1.5">
                        <span className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center ${
                          active 
                            ? "bg-primary text-white shadow-md shadow-primary/20" 
                            : isCurrentMonth 
                              ? "text-slate-800 dark:text-slate-200" 
                              : "text-slate-400 dark:text-slate-700"
                        }`}>
                          {format(day, "d")}
                        </span>
                        
                        {combinedItems.length > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </div>

                      {/* Day Events Badges list */}
                      <div className="flex-1 space-y-1 overflow-hidden flex flex-col justify-end">
                        {combinedItems.slice(0, 3).map(item => {
                          const colorInfo = getCustomColorStyles(item.color || "Red");
                          return (
                            <div 
                              key={item.id} 
                              className={`text-[9px] font-extrabold truncate rounded-md px-1.5 py-0.5 border-l-2 leading-tight ${colorInfo.borderClass} ${colorInfo.bgClass} ${colorInfo.textClass} ${item.isCompleted ? "line-through opacity-50" : ""}`}
                              style={{
                                ...colorInfo.borderStyle,
                                ...colorInfo.bgStyle,
                                ...colorInfo.textStyle
                              }}
                            >
                              {item.title}
                            </div>
                          );
                        })}
                        {combinedItems.length > 3 && (
                          <div className="text-[8px] font-extrabold text-slate-400 dark:text-slate-600 pl-1">
                            +{combinedItems.length - 3} more
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Cutout Border Overlay */}
      <svg 
        className="absolute top-0 left-0 w-[120px] h-[120px] pointer-events-none z-30 text-slate-200/80 dark:text-white/10"
        viewBox="0 0 120 120"
        fill="none"
      >
        <path 
          d="M 106 0 A 16 16 0 0 0 91.4 22.6 A 52 52 0 0 1 22.6 91.4 A 16 16 0 0 0 0 106" 
          stroke="currentColor" 
          strokeWidth="1" 
        />
      </svg>

      {/* Circular Date Selector Card (floats in the cutout) */}
      <div 
        className="absolute z-50 pointer-events-auto"
        style={{
          top: "16px",
          left: "16px",
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          onClick={() => {
            if (showMiniCalendar) {
              if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
                closeTimeoutRef.current = null;
              }
              setShowMiniCalendar(false);
            } else {
              setShowMiniCalendar(true);
            }
          }}
          className="w-14 h-14 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 hover:shadow-lg active:scale-95 text-slate-850 dark:text-slate-100 font-sans"
        >
          <span className="text-[9px] font-black uppercase text-primary tracking-wider leading-none mb-0.5 select-none">
            {format(cDate, "MMM")}
          </span>
          <span className="text-xl font-extrabold leading-none select-none">
            {format(cDate, "d")}
          </span>
        </button>
      </div>

      {/* Animated Mini Calendar Dropdown Popover */}
      <AnimatePresence>
        {showMiniCalendar && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 top-[80px] left-[16px] bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 w-80 backdrop-blur-xl pointer-events-auto select-none"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 dark:text-white text-base">
                {format(pickerDate, "MMMM yyyy")}
              </h3>
              <div className="flex gap-1 bg-slate-50 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/50 dark:border-white/5">
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPickerDate(subMonths(pickerDate, 1));
                  }}
                  className="p-1 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded transition-all cursor-pointer text-slate-600 dark:text-slate-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPickerDate(addMonths(pickerDate, 1));
                  }}
                  className="p-1 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded transition-all cursor-pointer text-slate-600 dark:text-slate-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Day Labels */}
            <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[11px] font-bold text-slate-400 dark:text-slate-500">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((lbl) => (
                <div key={lbl} className="w-8 h-8 flex items-center justify-center">
                  {lbl}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold">
              {pickerDays.map((day, idx) => {
                const isCurMonth = isSameMonth(day, pickerDate);
                const isSelDay = isSameDay(day, cDate);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPickerDay(day)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                      isSelDay 
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-md shadow-slate-900/10" 
                        : isCurMonth
                          ? "text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                          : "text-slate-300 dark:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                    }`}
                  >
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
  );
}

// Unplanned date-specific checkbox tasks pill
function UnplannedTaskPill({ task }: { task: UnplannedTaskItem }) {
  const [completed, setCompleted] = useState(task.status === "Completed");
  
  useEffect(() => {
    setCompleted(task.status === "Completed");
  }, [task.status]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = completed ? "Pending" : "Completed";
    setCompleted(!completed);
    try {
      await updateTaskStatus(task.id, newStatus);
    } catch (err) {
      console.error("Failed to toggle status:", err);
      // Rollback on failure
      setCompleted(completed);
    }
  };

  const colorInfo = getCustomColorStyles(task.color || "Red");

  return (
    <div 
      onClick={handleToggle}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[10px] font-extrabold cursor-pointer transition-all hover:scale-[1.02] shadow-sm select-none truncate ${
        completed 
          ? "bg-slate-100/50 dark:bg-slate-800/40 border-slate-200/60 dark:border-white/5 text-slate-400 dark:text-slate-500 line-through" 
          : `${colorInfo.bgClass} ${colorInfo.borderClass} ${colorInfo.textClass}`
      }`}
      style={completed ? {} : {
        ...colorInfo.bgStyle,
        ...colorInfo.borderStyle,
        ...colorInfo.textStyle
      }}
    >
      <div className="shrink-0 flex items-center justify-center">
        {completed ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 fill-current" />
        ) : (
          <Circle 
            className="w-3.5 h-3.5 opacity-60" 
            style={task.color.startsWith("#") ? { color: task.color } : {}}
          />
        )}
      </div>
      <span className="truncate">{task.title}</span>
    </div>
  );
}
