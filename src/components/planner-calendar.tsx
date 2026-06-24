"use client";

import { useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function PlannerCalendar({ 
  selectedDate, 
  onSelectDate 
}: { 
  selectedDate: Date, 
  onSelectDate: (date: Date) => void 
}) {
  const [currentMonthDate, setCurrentMonthDate] = useState(selectedDate);

  const monthStart = startOfMonth(currentMonthDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "d";
  const days = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <h2 className="text-[15px] font-bold text-slate-600 dark:text-slate-300">
          {format(currentMonthDate, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentMonthDate(subMonths(currentMonthDate, 1))}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-slate-500"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setCurrentMonthDate(addMonths(currentMonthDate, 1))}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-slate-500"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Card */}
      <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2rem] p-6 border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)]">
        {/* Days Header */}
        <div className="grid grid-cols-7 mb-4">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-y-2">
          {days.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isTodayDate = isToday(day);
            const isSelected = isSameDay(day, selectedDate);

            return (
              <div key={day.toString()} className="flex justify-center">
                <button 
                  onClick={() => onSelectDate(day)}
                  className={`w-8 h-8 flex items-center justify-center rounded-xl text-sm font-medium transition-all cursor-pointer
                    ${isSelected ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-black shadow-md scale-110" : ""}
                    ${!isSelected && isTodayDate ? "border border-slate-400 dark:border-slate-500 text-slate-800 dark:text-slate-200" : ""}
                    ${!isSelected && !isTodayDate && isCurrentMonth ? "text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10" : ""}
                    ${!isCurrentMonth ? "text-slate-300 dark:text-slate-600" : ""}
                  `}
                >
                  {format(day, dateFormat)}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
