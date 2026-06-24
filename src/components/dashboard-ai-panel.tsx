"use client";

import { motion } from "framer-motion";
import { X, Send, BotMessageSquare } from "lucide-react";

export function DashboardAIPanel({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, width: 0, y: 150, scale: 0.8 }}
      animate={{ opacity: 1, width: 380, y: 0, scale: 1 }}
      exit={{ opacity: 0, width: 0, y: 150, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      style={{ originX: 1, originY: 1 }}
      className="h-full shrink-0 flex flex-col"
    >
      <div className="w-[380px] h-full flex flex-col">
        {/* Header outside the box */}
        <div className="h-[90px] mb-5 shrink-0 flex flex-col justify-center px-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BotMessageSquare className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">Chief OS</h1>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* AI Card content */}
        <div className="flex-1 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl border border-white/60 dark:border-white/10 rounded-[2rem] flex flex-col shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 mt-2">
          <div className="bg-white/80 dark:bg-slate-800 rounded-2xl rounded-tl-sm p-4 text-sm text-slate-700 dark:text-slate-200 self-start max-w-[85%] border border-white/60 dark:border-white/5 shadow-sm">
            Hello Chief. How can I help you optimize your schedule today?
          </div>
        </div>

        <div className="p-4 bg-white/40 dark:bg-black/20 border-t border-white/40 dark:border-white/10 shrink-0">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Ask Chief OS..." 
              className="w-full h-11 bg-white/80 dark:bg-slate-800 rounded-xl pl-4 pr-12 text-sm border border-white/80 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            />
            <button className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-lg hover:scale-105 transition-transform">
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
      </div>
    </motion.div>
  );
}
