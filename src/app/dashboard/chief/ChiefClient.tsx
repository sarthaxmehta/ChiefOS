"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { 
  Paperclip, 
  Globe, 
  Mic, 
  Plus, 
  ArrowUp, 
  Code, 
  FileText, 
  Sparkles, 
  ChevronDown, 
  RefreshCw,
  CornerDownLeft,
  User,
  BrainCircuit,
  Maximize2,
  Minimize2,
  Trash2,
  Calendar,
  CalendarDays,
  History,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import { DefaultChatTransport } from "ai";
import { toast } from "sonner";
import { format, isToday, isYesterday, parseISO } from "date-fns";

interface ChiefClientProps {
  initialUserName: string;
}

export function ChiefClient({ initialUserName }: ChiefClientProps) {
  const [userName] = useState(initialUserName);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [historyKeys, setHistoryKeys] = useState<string[]>([]);

  const dateKey = format(selectedDate, "yyyy-MM-dd");

  // Load list of dates with active chat history from localStorage
  const loadHistoryKeys = () => {
    if (typeof window === "undefined") return;
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("chief_chat_history_")) {
        const dateStr = key.replace("chief_chat_history_", "");
        keys.push(dateStr);
      }
    }
    // Sort descending by date
    keys.sort((a, b) => b.localeCompare(a));
    setHistoryKeys(keys);
  };

  useEffect(() => {
    loadHistoryKeys();
  }, [selectedDate]);

  const handleDeleteHistory = (e: React.MouseEvent, targetDateKey: string) => {
    e.stopPropagation();
    if (typeof window === "undefined") return;
    localStorage.removeItem(`chief_chat_history_${targetDateKey}`);
    toast.success(`Chat history for ${targetDateKey} cleared.`);
    loadHistoryKeys();
    
    // If we just deleted the active date's history, re-mount it by updating state
    if (targetDateKey === dateKey) {
      setSelectedDate(new Date(selectedDate)); // force trigger
    }
  };

  // Helper to format date labels in sidebar
  const formatDateLabel = (dStr: string) => {
    try {
      const date = parseISO(dStr);
      if (isToday(date)) return "Today";
      if (isYesterday(date)) return "Yesterday";
      return format(date, "EEEE, MMM d");
    } catch {
      return dStr;
    }
  };

  return (
    <div className={`relative w-full h-full overflow-hidden select-none bg-transparent flex ${isFullScreen ? "fixed inset-0 z-50 h-screen w-screen" : ""}`}>
      
      {/* Dynamic Animated Flowing Gradient Backdrop Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[5%] left-[10%] w-[55%] h-[55%] rounded-full bg-gradient-to-tr from-orange-200/40 to-amber-100/30 blur-[130px] dark:from-amber-950/20 dark:to-orange-950/10 animate-blob-1" />
        <div className="absolute bottom-[5%] right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-rose-100/50 to-orange-100/30 blur-[150px] dark:from-orange-950/20 dark:to-amber-950/10 animate-blob-2" />
        <div className="absolute top-[40%] left-[35%] w-[40%] h-[40%] rounded-full bg-gradient-to-tr from-amber-100/40 to-rose-100/40 blur-[120px] dark:from-stone-900/40 dark:to-stone-850/40 animate-blob-3" />
        <div className="absolute inset-0 bg-white/40 dark:bg-black/45 backdrop-blur-[4px]" />
      </div>

      {/* Floating Control Panel (Top Right) */}
      <div className="absolute top-4 right-6 z-25 flex items-center gap-2">
        <button
          onClick={() => setShowHistorySidebar(!showHistorySidebar)}
          className={`p-2 border border-slate-200/50 dark:border-white/10 rounded-full transition-all shadow-sm backdrop-blur-md cursor-pointer ${
            showHistorySidebar 
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950" 
              : "bg-white/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-350 hover:bg-white dark:hover:bg-slate-900"
          }`}
          title="Chat History"
        >
          <History className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setIsFullScreen(!isFullScreen)}
          className="p-2 bg-white/70 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-900 border border-slate-200/50 dark:border-white/10 rounded-full text-slate-700 dark:text-slate-350 transition-all shadow-sm backdrop-blur-md cursor-pointer"
          title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Left Chat Area (Dynamic per Date via unique React Key) */}
      <div className="flex-1 flex flex-col justify-between min-h-0 relative z-10">
        <ChiefChatArea 
          key={dateKey}
          selectedDate={selectedDate}
          userName={userName}
          onHistoryRefresh={loadHistoryKeys}
        />
      </div>

      {/* Collapsible Right Chat History Sidebar */}
      <AnimatePresence>
        {showHistorySidebar && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-full bg-white/80 dark:bg-slate-950/85 backdrop-blur-2xl border-l border-slate-200/50 dark:border-white/5 flex flex-col relative z-20 overflow-hidden shadow-2xl shrink-0"
          >
            <div className="p-6 flex flex-col h-full space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  <h2 className="font-extrabold text-sm text-slate-800 dark:text-white tracking-tight">Chat Logs</h2>
                </div>
                <button 
                  onClick={() => setShowHistorySidebar(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-colors cursor-pointer text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Dynamic Date Picker (Start chat on any custom date) */}
              <div className="flex flex-col gap-2 shrink-0">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  Select Chat Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateKey}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedDate(new Date(e.target.value));
                      }
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/10 rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all cursor-pointer"
                  />
                </div>
              </div>

              {/* History Entries List */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar min-h-0">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 select-none">
                  Recent Conversations
                </span>
                
                {historyKeys.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center select-none opacity-40">
                    <span className="text-[10px] italic font-semibold text-slate-400">No chat history found</span>
                  </div>
                ) : (
                  historyKeys.map((k) => {
                    const isActive = k === dateKey;
                    return (
                      <div
                        key={k}
                        onClick={() => setSelectedDate(new Date(k))}
                        className={`group flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                          isActive 
                            ? "bg-primary/10 border-primary text-primary shadow-sm"
                            : "bg-white/50 border-slate-200/50 hover:bg-white text-slate-700 dark:bg-slate-900/40 dark:border-white/5 dark:text-slate-350 dark:hover:bg-slate-900/60"
                        }`}
                      >
                        <span className="text-xs font-bold truncate">
                          {formatDateLabel(k)}
                        </span>
                        
                        <button
                          onClick={(e) => handleDeleteHistory(e, k)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20 rounded-lg text-slate-500 dark:text-slate-400 transition-all cursor-pointer"
                          title="Delete Chat Log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Inner Chat Area that contains the isolated useChat hook for dates
interface ChiefChatAreaProps {
  selectedDate: Date;
  userName: string;
  onHistoryRefresh: () => void;
}

function ChiefChatArea({ selectedDate, userName, onHistoryRefresh }: ChiefChatAreaProps) {
  const [greeting, setGreeting] = useState("Good afternoon");
  const [displayedGreeting, setDisplayedGreeting] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [chatState, setChatState] = useState<"greeting" | "chat">("greeting");
  const [input, setInput] = useState("");
  const [resetKey, setResetKey] = useState(0);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const dateKey = format(selectedDate, "yyyy-MM-dd");

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/chief/chat?selectedDate=${encodeURIComponent(selectedDate.toISOString())}`
    }),
    messages: []
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Load chat log from localStorage for the active date on mount
  useEffect(() => {
    const saved = localStorage.getItem(`chief_chat_history_${dateKey}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed);
        if (parsed.length > 0) {
          setChatState("chat");
        }
      } catch (e) {
        console.error("Error loading chat history:", e);
      }
    } else {
      setMessages([]);
      setChatState("greeting");
    }
  }, [dateKey, setMessages]);

  // Save chat log to localStorage whenever messages mutate
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chief_chat_history_${dateKey}`, JSON.stringify(messages));
      onHistoryRefresh();
    }
  }, [messages, dateKey, onHistoryRefresh]);

  // Time-aware Greeting Typing effect
  useEffect(() => {
    const hour = new Date().getHours();
    let currentGreeting = "Good afternoon";
    if (hour < 12) currentGreeting = "Good morning";
    else if (hour < 17) currentGreeting = "Good afternoon";
    else currentGreeting = "Good evening";
    
    setGreeting(currentGreeting);

    const fullText = `${currentGreeting}, ${userName}`;
    let index = 0;
    setDisplayedGreeting("");
    setShowCursor(true);
    
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setDisplayedGreeting(fullText.substring(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        const timeout = setTimeout(() => setShowCursor(false), 2000);
        return () => clearTimeout(timeout);
      }
    }, 45);

    return () => clearInterval(interval);
  }, [userName, resetKey]);

  // Auto-scroll messages thread
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Trigger page updates on dashboard mutations
  useEffect(() => {
    if (status === "ready" && messages.length > 0 && messages[messages.length - 1].role === "assistant") {
      window.dispatchEvent(new Event("task-updated"));
    }
  }, [status, messages]);

  const handleSendMessage = (textToSend: string) => {
    if (!textToSend.trim()) return;

    setChatState("chat");
    setInput("");
    sendMessage({ text: textToSend });
  };

  const handleResetChat = () => {
    setChatState("greeting");
    setMessages([]);
    setInput("");
    localStorage.removeItem(`chief_chat_history_${dateKey}`);
    onHistoryRefresh();
    setResetKey(prev => prev + 1);
    toast.success("Active date conversation reset!");
  };

  const isAiTyping = isLoading && messages.length > 0 && messages[messages.length - 1].role === "user";

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col justify-center px-6 min-h-0 relative select-none">
      
      {/* Dynamic Header Reset Switch */}
      {chatState === "chat" && (
        <div className="absolute top-4 left-6 z-20">
          <button
            onClick={handleResetChat}
            className="flex items-center gap-1.5 bg-white/70 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-900 border border-slate-200/50 dark:border-white/10 rounded-full px-4 py-2 text-[10px] font-extrabold text-slate-700 dark:text-slate-350 transition-all active:scale-95 shadow-sm backdrop-blur-md cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Reset Date Chat
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        
        {/* Greeting State */}
        {chatState === "greeting" && (
          <motion.div
            key="greeting-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center justify-center text-center w-full py-10"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="mb-8"
            >
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-100/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-900/30">
                <Sparkles className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-700 dark:text-orange-350">
                  Daily Briefing &middot; {format(selectedDate, "MMM d, yyyy")}
                </span>
              </div>
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-slate-900 dark:text-white mb-12 text-center leading-tight">
              {displayedGreeting}
              {showCursor && (
                <span className="inline-block w-1.5 h-8 lg:h-10 ml-2 bg-orange-500 animate-pulse align-middle" />
              )}
            </h1>

            <div className="w-full max-w-2xl">
              <ChatInput 
                value={input}
                onChange={setInput}
                onSend={handleSendMessage}
                inputRef={inputRef}
              />
            </div>
          </motion.div>
        )}

        {/* Active Chat Conversation State */}
        {chatState === "chat" && (
          <motion.div
            key="chat-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow flex flex-col justify-between min-h-0 py-6"
          >
            {/* Chat Message Thread */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar min-h-0 py-4 mb-4 mt-8">
              {messages.map((msg, idx) => {
                const isUser = msg.role === "user";
                const isStreaming = isLoading && idx === messages.length - 1 && msg.role === "assistant";
                const messageText = msg.parts && msg.parts.length > 0
                  ? msg.parts
                      .filter((part) => part.type === "text")
                      .map((part: any) => part.text)
                      .join("")
                  : (msg as any).content || "";

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex items-start gap-4 w-full ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {/* Avatar for AI */}
                    {!isUser && (
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-sm">
                        <BrainCircuit className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                    )}

                    {/* Bubble */}
                    <div className={`max-w-[85%] rounded-[1.5rem] p-5 border text-xs leading-relaxed transition-all shadow-sm ${
                      isUser 
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 border-slate-950 dark:border-white font-medium" 
                        : "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/80 dark:border-white/5 text-slate-800 dark:text-slate-200"
                    }`}>
                      <div className="font-medium">
                        {isUser ? (
                          <div className="whitespace-pre-wrap">{messageText}</div>
                        ) : (
                          <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200">
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => <p className="mb-2 last:mb-0 leading-normal">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                                li: ({ children }) => <li className="leading-normal">{children}</li>,
                                strong: ({ children }) => <strong className="font-bold text-amber-600 dark:text-amber-400">{children}</strong>,
                                code: ({ children }) => <code className="bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5 font-mono text-[11px] text-orange-650 dark:text-orange-400">{children}</code>,
                                pre: ({ children }) => <pre className="bg-slate-100 dark:bg-slate-850 rounded-xl p-3 my-2 overflow-x-auto font-mono text-[11px] border border-slate-200/40 dark:border-white/5">{children}</pre>,
                              }}
                            >
                              {messageText}
                            </ReactMarkdown>
                          </div>
                        )}
                        {isStreaming && (
                          <span className="inline-block w-1.5 h-3.5 ml-1 bg-amber-500 animate-pulse align-middle" />
                        )}
                      </div>
                    </div>

                    {/* Avatar for User */}
                    {isUser && (
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm">
                        <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {/* AI Loading Bubble */}
              {isAiTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-4 w-full justify-start"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <BrainCircuit className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="rounded-[1.5rem] px-5 py-4 bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-white/5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </motion.div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input (Bottom) */}
            <div className="w-full shrink-0 pt-2 border-t border-slate-200/20 dark:border-white/5">
              <ChatInput 
                value={input}
                onChange={setInput}
                onSend={handleSendMessage}
                inputRef={inputRef}
              />
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Screen Footer Notes */}
      <footer className="relative z-10 w-full py-4 text-center shrink-0">
        <p className="text-[10px] text-slate-400 dark:text-slate-600 font-bold tracking-wider">
          CHIEF OS &middot; CONCURRENT DATE SYNC ACTIVE
        </p>
      </footer>
    </div>
  );
}

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: (val: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

function ChatInput({
  value,
  onChange,
  onSend,
  inputRef
}: ChatInputProps) {
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend(value);
    }
  };

  return (
    <div className="w-full relative bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-[2rem] shadow-[0_10px_35px_-8px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_10px_35px_-8px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.05)] p-2 flex items-center pr-3">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="How can I help you today?"
        className="flex-grow bg-transparent text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none pl-4 pr-3 py-2.5 font-semibold"
      />
      <button
        onClick={() => onSend(value)}
        disabled={!value.trim()}
        className={`p-2 rounded-full transition-all shrink-0 ${
          value.trim() 
            ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:scale-105 active:scale-95 cursor-pointer shadow-md" 
            : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed"
        }`}
      >
        <ArrowUp className="w-4 h-4" />
      </button>
    </div>
  );
}
