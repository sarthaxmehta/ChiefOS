"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Send, BotMessageSquare, User, Trash2 } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { format } from "date-fns";

export function DashboardAIPanel({ selectedDate, userEmail, onClose }: { selectedDate: Date; userEmail: string; onClose: () => void }) {
  const [input, setInput] = useState("");
  const dateKey = format(selectedDate, "yyyy-MM-dd");

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/chief/chat?selectedDate=${format(selectedDate, "yyyy-MM-dd")}&tzOffset=${new Date().getTimezoneOffset()}`
    }),
    messages: []
  });

  // Load chat history on mount
  useEffect(() => {
    const saved = localStorage.getItem(`chief_chat_history_${userEmail}_${dateKey}`);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading chat history:", e);
      }
    } else {
      setMessages([]);
    }
  }, [dateKey, userEmail, setMessages]);

  // Save chat history on changes
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chief_chat_history_${userEmail}_${dateKey}`, JSON.stringify(messages));
    }
  }, [messages, dateKey, userEmail]);

  const isLoading = status === "submitted" || status === "streaming";

  // Notify dashboard to refresh when AI finishes responding
  useEffect(() => {
    if (status === "ready" && messages.length > 0 && messages[messages.length - 1].role === "assistant") {
      window.dispatchEvent(new Event("task-updated"));
    }
  }, [status, messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const textToSend = input;
    setInput("");
    sendMessage({ text: textToSend });
  };
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
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button 
                  onClick={() => {
                    setMessages([]);
                    localStorage.removeItem(`chief_chat_history_${userEmail}_${dateKey}`);
                  }} 
                  className="p-2 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20 rounded-full transition-colors cursor-pointer"
                  title="Clear conversation"
                >
                  <Trash2 className="w-4 h-4 text-slate-500 hover:text-red-500" />
                </button>
              )}
              <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          </div>
        </div>

        {/* AI Card content */}
        <div className="flex-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border border-white/60 dark:border-white/10 rounded-[2rem] flex flex-col shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 mt-2">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.15, 1],
                      opacity: [0.6, 0.8, 0.6]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute w-28 h-28 rounded-full bg-[#FF8C42]/50 blur-2xl"
                  />
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.05, 1],
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="relative w-20 h-20 rounded-full shadow-lg"
                    style={{ background: "linear-gradient(to top right, #F5D061 0%, #FF6B6B 100%)" }}
                  />
                </div>
                <h3 className="text-[15px] font-medium text-slate-800 dark:text-slate-200 leading-relaxed max-w-[280px]">
                  Chief OS AI is ready to optimize your dashboard and coordinate your schedule.
                </h3>
              </div>
            ) : (
              messages.map((m) => {
                const messageText = m.parts && m.parts.length > 0
                  ? m.parts
                      .filter((part) => part.type === "text")
                      .map((part: any) => part.text)
                      .join("")
                  : (m as any).content || "";

                return (
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
                      <p className="whitespace-pre-wrap leading-relaxed">{messageText}</p>
                    </div>
                  </div>
                );
              })
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

            {error && (
              <div className="self-start flex items-center gap-2 max-w-[85%] mt-auto">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <BotMessageSquare className="w-3.5 h-3.5 text-red-500" />
                </div>
                <div className="bg-red-50/90 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-2xl rounded-tl-sm p-3 text-xs border border-red-200 dark:border-red-900/30 shadow-sm leading-relaxed">
                  <p className="font-semibold mb-0.5 text-red-800 dark:text-red-300">Google AI Studio Limit Reached</p>
                  <p className="opacity-90">Daily Free-tier quota exceeded. Please wait a few minutes, or upgrade to a pay-as-you-go plan on Google AI Studio to increase your limits.</p>
                </div>
              </div>
            )}
          </div>

        <div className="p-4 shrink-0 pb-6">
          <form onSubmit={handleSubmit} className="relative bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-white/10 rounded-2xl flex items-center p-2">
            <input 
              type="text" 
              value={input}
              onChange={handleInputChange}
              placeholder="" 
              className="flex-1 h-10 bg-transparent text-sm focus:outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 px-3 min-w-0"
            />
            <button type="submit" disabled={isLoading || !input?.trim()} className="ml-2 w-10 h-10 flex items-center justify-center bg-[#8b8b93] text-white rounded-full hover:bg-slate-700 transition-colors disabled:opacity-50 shrink-0">
              <Send className="w-4 h-4 -ml-0.5" />
            </button>
          </form>
        </div>
        </div>
      </div>
    </motion.div>
  );
}
