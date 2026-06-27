"use client";

import { useState, useEffect, useRef } from "react";
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
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import { DefaultChatTransport } from "ai";
import { toast } from "sonner";

interface ChiefClientProps {
  initialUserName: string;
}

export function ChiefClient({ initialUserName }: ChiefClientProps) {
  const [userName] = useState(initialUserName);
  const [greeting, setGreeting] = useState("Good afternoon");
  const [displayedGreeting, setDisplayedGreeting] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const [chatState, setChatState] = useState<"greeting" | "chat">("greeting");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [input, setInput] = useState("");
  
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Vercel AI SDK useChat integration connected to our modular backend engine
  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/chief/chat?selectedDate=${encodeURIComponent(new Date().toISOString())}`
    }),
    messages: []
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Time-aware Greeting & Character writing effect
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

  // Auto-scroll chat history
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Notify dashboard to refresh when AI finishes responding
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
    setResetKey(prev => prev + 1);
    toast.success("New conversation started!");
  };

  // Determine helper status flags
  const isAiTyping = isLoading && messages.length > 0 && messages[messages.length - 1].role === "user";

  return (
    <div className={`relative w-full h-full overflow-hidden select-none bg-transparent transition-colors duration-700 flex flex-col items-center justify-between ${isFullScreen ? "fixed inset-0 z-50 h-screen w-screen" : ""}`}>
      
      {/* Dynamic Animated Flowing Gradient Backdrop Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[5%] left-[10%] w-[55%] h-[55%] rounded-full bg-gradient-to-tr from-orange-200/40 to-amber-100/30 blur-[130px] dark:from-amber-950/20 dark:to-orange-950/10 animate-blob-1" />
        <div className="absolute bottom-[5%] right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-rose-100/50 to-orange-100/30 blur-[150px] dark:from-orange-950/20 dark:to-amber-950/10 animate-blob-2" />
        <div className="absolute top-[40%] left-[35%] w-[40%] h-[40%] rounded-full bg-gradient-to-tr from-amber-100/40 to-rose-100/40 blur-[120px] dark:from-stone-900/40 dark:to-stone-850/40 animate-blob-3" />
        {/* Soft satin blur overlay */}
        <div className="absolute inset-0 bg-white/40 dark:bg-black/45 backdrop-blur-[4px]" />
      </div>

      {/* Floating Control Panel (Top Right - Borderless) */}
      <div className="absolute top-4 right-6 z-20 flex items-center gap-2">
        {chatState === "chat" && (
          <button
            onClick={handleResetChat}
            className="flex items-center gap-1.5 bg-white/70 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-900 border border-slate-200/50 dark:border-white/10 rounded-full px-4 py-2 text-[10px] font-extrabold text-slate-700 dark:text-slate-350 transition-all active:scale-95 shadow-sm backdrop-blur-md"
          >
            <RefreshCw className="w-3 h-3" /> New Chat
          </button>
        )}
        <button
          onClick={() => setIsFullScreen(!isFullScreen)}
          className="p-2 bg-white/70 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-900 border border-slate-200/50 dark:border-white/10 rounded-full text-slate-700 dark:text-slate-350 transition-all shadow-sm backdrop-blur-md"
          title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Main Adaptive Layout Workspace */}
      <div className="relative z-10 flex-1 w-full max-w-4xl mx-auto flex flex-col justify-center px-6 min-h-0">
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
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-900/30">
                  <Sparkles className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-700 dark:text-orange-350">Dynamic AI Core</span>
                </div>
              </motion.div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-slate-900 dark:text-white mb-12 text-center leading-tight">
                {displayedGreeting}
                {showCursor && (
                  <span className="inline-block w-1.5 h-8 lg:h-10 ml-2 bg-orange-500 animate-pulse align-middle" />
                )}
              </h1>

              {/* Chat Box (Centered) */}
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
              className="flex-1 flex flex-col justify-between min-h-0 py-6"
            >
              {/* Chat Message Thread */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar min-h-0 py-4 mb-4">
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
      </div>

      {/* Screen Footer Notes */}
      <footer className="relative z-10 w-full py-4 text-center shrink-0">
        <p className="text-[10px] text-slate-400 dark:text-slate-600 font-bold tracking-wider">
          CHIEF OS · DESIGNED FOR SEAMLESS ORCHESTRATION
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
    <div className="w-full relative bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-[2rem] shadow-[0_10px_35px_-8px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_10px_35px_-8px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.05)] p-2 flex items-center pr-3">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="How can I help you today?"
        className="flex-grow bg-transparent text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none pl-4 pr-3 py-2.5 font-semibold"
      />
      {/* Send Trigger */}
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
