"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { 
  Play, 
  Pause, 
  Clock, 
  Activity, 
  AlertTriangle, 
  Sparkles, 
  Volume2, 
  ShieldCheck, 
  Gauge, 
  Compass, 
  Flame 
} from "lucide-react";
import { toast } from "sonner";

interface BriefingClientProps {
  briefingText: string;
  riskLevel: string;
  pendingCount: number;
  optimalWorkTime: string;
  todayTasksCount: number;
}

export function BriefingClient({
  briefingText,
  riskLevel,
  pendingCount,
  optimalWorkTime,
  todayTasksCount
}: BriefingClientProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const barCount = 22;
  const waves = Array.from({ length: barCount });

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      toast.success("Playing daily briefing audio summary...", {
        icon: <Volume2 className="w-4 h-4 text-orange-500" />
      });
    }
  };

  // Stress Level Color Configuration
  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "high":
        return {
          bg: "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400",
          glow: "shadow-[0_0_12px_rgba(239,68,68,0.2)]",
          icon: <Flame className="w-5 h-5 text-red-500" />
        };
      case "medium":
        return {
          bg: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
          glow: "shadow-[0_0_12px_rgba(245,158,11,0.2)]",
          icon: <AlertTriangle className="w-5 h-5 text-amber-500" />
        };
      default:
        return {
          bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
          glow: "shadow-[0_0_12px_rgba(16,185,129,0.2)]",
          icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />
        };
    }
  };

  const riskStyle = getRiskColor(riskLevel);

  return (
    <div className="px-8 py-6 w-full h-full flex flex-col max-w-none relative overflow-y-auto select-none bg-transparent transition-colors duration-500 pb-24">
      <div className="relative z-10 flex flex-col w-full max-w-5xl mx-auto flex-1 gap-8">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
              <span className="p-2 bg-amber-500/10 rounded-xl text-amber-600"><Compass className="w-6 h-6 animate-spin-hover" /></span>
              Daily Briefing
            </h1>
            <p className="text-sm text-slate-500 mt-1">AI-synthesized morning report for your daily focus allocation.</p>
          </div>
        </div>

        {/* 1. Voice Waveform Audio Briefing Panel */}
        <div className="w-full bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlayback}
              className={`p-4 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer shadow-md ${
                isPlaying 
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 scale-95" 
                  : "bg-orange-500 text-white hover:bg-orange-600 hover:scale-105 active:scale-95"
              }`}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 tracking-tight">Audio Synthesis</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold uppercase tracking-wider">
                {isPlaying ? "Reading briefing context..." : "Listen to dynamic AI audio summary"}
              </p>
            </div>
          </div>

          {/* Interactive Flowing Waveform visualizer */}
          <div className="flex items-center justify-center bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 rounded-2xl h-14 px-6 max-w-full overflow-hidden">
            <div className="flex items-center gap-1 h-10 shrink-0">
              {waves.map((_, i) => (
                <motion.div
                  key={i}
                  animate={isPlaying ? {
                    height: [8, Math.random() * 24 + 10, 8]
                  } : {
                    height: 8
                  }}
                  transition={isPlaying ? {
                    duration: 0.7 + Math.random() * 0.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.04
                  } : {
                    duration: 0.2
                  }}
                  className={`w-1 rounded-full ${
                    isPlaying 
                      ? "bg-gradient-to-t from-orange-500 to-amber-400 dark:from-orange-600 dark:to-amber-500" 
                      : "bg-slate-300 dark:bg-slate-700"
                  } transition-colors duration-300`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 2. Structured Metrics Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Widget 1: Focus Window */}
          <div className="group bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-[1.5rem] p-5 shadow-[0_8px_20px_-4px_rgba(15,23,42,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.05)] hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_12px_25px_-5px_rgba(249,115,22,0.06)] transition-all duration-300 flex items-start gap-4">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0 shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black uppercase text-indigo-500 dark:text-indigo-400 tracking-wider">Optimal Focus</span>
              <h4 className="text-lg font-black text-slate-800 dark:text-white mt-1 tracking-tight">{optimalWorkTime}</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-1 font-medium leading-normal">Your high productivity and deep work window.</p>
            </div>
          </div>

          {/* Widget 2: Tasks Volume */}
          <div className="group bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-[1.5rem] p-5 shadow-[0_8px_20px_-4px_rgba(15,23,42,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.05)] hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_12px_25px_-5px_rgba(249,115,22,0.06)] transition-all duration-300 flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl shrink-0 shadow-sm">
              <Gauge className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black uppercase text-amber-500 dark:text-amber-400 tracking-wider">Today's Load</span>
              <h4 className="text-lg font-black text-slate-800 dark:text-white mt-1 tracking-tight">{todayTasksCount} Tasks Remaining</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-455 mt-1 font-medium leading-normal">{pendingCount} total unfinished missions on your desk.</p>
            </div>
          </div>

          {/* Widget 3: Execution Risk */}
          <div className="group bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-[1.5rem] p-5 shadow-[0_8px_20px_-4px_rgba(15,23,42,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.05)] hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_12px_25px_-5px_rgba(249,115,22,0.06)] transition-all duration-300 flex items-start gap-4">
            <div className={`p-3 rounded-2xl shrink-0 shadow-sm border ${riskStyle.bg} ${riskStyle.glow}`}>
              {riskStyle.icon}
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Workload Stress</span>
              <h4 className="text-lg font-black text-slate-800 dark:text-white mt-1 tracking-tight capitalize">{riskLevel} Risk</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-460 mt-1 font-medium leading-normal">Schedule collision and backlog threat levels.</p>
            </div>
          </div>

        </div>

        {/* 3. Executive AI Summary Panel */}
        <div className="w-full bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-[2rem] p-8 shadow-[0_10px_35px_-8px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_10px_35px_-8px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-200/50 dark:border-white/10 pb-4">
            <Sparkles className="w-5 h-5 text-orange-500" />
            <h2 className="text-base font-extrabold text-slate-850 dark:text-slate-100 tracking-tight">AI Executive Intelligence Summary</h2>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none text-xs font-semibold leading-relaxed text-slate-700 dark:text-slate-350 space-y-4">
            <ReactMarkdown 
              components={{
                h2: ({node, ...props}) => <h2 className="text-sm font-extrabold tracking-tight text-slate-850 dark:text-white mt-6 mb-3 uppercase" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-xs font-black tracking-tight text-slate-800 dark:text-slate-250 mt-4 mb-2" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-2 text-slate-650 dark:text-slate-400" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-2 text-slate-650 dark:text-slate-400" {...props} />,
                li: ({node, ...props}) => <li className="pl-1" {...props} />,
                p: ({node, ...props}) => <p className="leading-relaxed mb-4 text-[13px] font-medium" {...props} />,
                strong: ({node, ...props}) => <strong className="font-extrabold text-slate-900 dark:text-white" {...props} />
              }}
            >
              {briefingText}
            </ReactMarkdown>
          </div>
        </div>

      </div>
    </div>
  );
}
