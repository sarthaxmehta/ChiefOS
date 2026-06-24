"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

export function PlannerClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) {
    return (
      <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2rem] p-6 border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] flex items-center gap-8 h-[140px] animate-pulse" />
    );
  }

  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours();

  const secondDegrees = seconds * 6;
  const minuteDegrees = minutes * 6 + seconds * 0.1;
  const hourDegrees = (hours % 12) * 30 + minutes * 0.5;

  return (
    <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2rem] p-6 border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] flex items-center gap-8">
      {/* Analog Clock */}
      <div className="relative w-24 h-24 shrink-0 rounded-full bg-white/40 dark:bg-black/20 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] border border-white/50 dark:border-white/5 flex items-center justify-center">
        {/* Tick marks */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-full h-full p-1"
            style={{ transform: `rotate(${i * 30}deg)` }}
          >
            <div className={`mx-auto w-0.5 rounded-full bg-slate-300 dark:bg-slate-600 ${i % 3 === 0 ? 'h-2' : 'h-1'}`} />
          </div>
        ))}
        
        {/* Hour Hand */}
        <div 
          className="absolute w-1 h-6 bg-slate-800 dark:bg-slate-200 rounded-full origin-bottom"
          style={{ transform: `translateY(-50%) rotate(${hourDegrees}deg)` }}
        />
        
        {/* Minute Hand */}
        <div 
          className="absolute w-0.5 h-8 bg-slate-800 dark:bg-slate-200 rounded-full origin-bottom"
          style={{ transform: `translateY(-50%) rotate(${minuteDegrees}deg)` }}
        />
        
        {/* Second Hand */}
        <div 
          className="absolute w-[1px] h-9 bg-primary dark:bg-primary rounded-full origin-bottom"
          style={{ transform: `translateY(-50%) rotate(${secondDegrees}deg)` }}
        />
        
        {/* Center Dot */}
        <div className="absolute w-1.5 h-1.5 bg-slate-800 dark:bg-slate-200 rounded-full" />
      </div>

      {/* Digital Time */}
      <div className="flex flex-col">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
          {format(time, "h:mm a").toLowerCase()}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
          {format(time, "EEE, do MMMM")}
        </p>
      </div>
    </div>
  );
}
