"use client";

import { motion } from "framer-motion";
import { X, Send, BotMessageSquare, User } from "lucide-react";
import { useChat } from "@ai-sdk/react";

export function DashboardAIPanel({ onClose }: { onClose: () => void }) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chief/chat",
    initialMessages: []
  });
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
        <div className="flex-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border border-white/60 dark:border-white/10 rounded-[2rem] flex flex-col shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 mt-2">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <div className="relative w-28 h-28 mb-8">
                  {/* Glowing Orb */}
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.05, 1],
                      opacity: [0.8, 1, 0.8]
                    }}
                    transition={{ 
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-300 via-orange-500 to-rose-500 blur-xl opacity-80"
                  />
                  <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-yellow-200 via-orange-400 to-rose-500 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.1)] overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-white/40 blur-2xl rounded-full" />
                  </div>
                </div>
                <h3 className="text-[15px] font-medium text-slate-800 dark:text-slate-200 leading-relaxed max-w-[280px]">
                  Chief OS AI is ready to optimize your dashboard and coordinate your schedule.
                </h3>
              </div>
            ) : (
              messages.map((m) => (
                <div 
                  key={m.id} 
                  className={`flex items-start gap-2 max-w-[85%] ${m.role === "user" ? "self-end flex-row-reverse" : "self-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <BotMessageSquare className="w-3.5 h-3.5 text-primary" />
                    </div>
                  )}
                  <div 
                    className={`rounded-2xl p-3 text-sm border shadow-sm ${
                      m.role === "user" 
                        ? "bg-primary text-primary-foreground border-primary rounded-tr-sm" 
                        : "bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-white/60 dark:border-white/5 rounded-tl-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
               <div className="self-start flex items-center gap-2 max-w-[85%] mt-auto">
                 <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <BotMessageSquare className="w-3.5 h-3.5 text-primary" />
                  </div>
                 <div className="bg-white/80 dark:bg-slate-800 rounded-2xl rounded-tl-sm p-4 text-sm border border-white/60 dark:border-white/5 shadow-sm">
                   <div className="flex gap-1.5 items-center">
                     <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                     <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                     <span className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: "300ms" }} />
                   </div>
                 </div>
               </div>
            )}
          </div>

        <div className="p-4 shrink-0 pb-6">
          <form onSubmit={handleSubmit} className="relative bg-white dark:bg-slate-800 shadow-[0_2px_20px_rgba(0,0,0,0.06)] border border-slate-100 dark:border-white/10 rounded-2xl flex items-center p-1.5 px-3">
            <input 
              type="text" 
              value={input}
              onChange={handleInputChange}
              placeholder="Ask Chief OS..." 
              className="flex-1 h-10 bg-transparent text-sm focus:outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 min-w-0"
            />
            <button type="submit" disabled={isLoading || !input?.trim()} className="ml-2 w-8 h-8 flex items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-black rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 shrink-0">
              <Send className="w-3.5 h-3.5 -ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
