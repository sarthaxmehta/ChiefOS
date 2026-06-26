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
import { toast } from "sonner";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  isStreaming?: boolean;
}

interface ChiefClientProps {
  initialUserName: string;
}

const QUICK_STARTS = [
  {
    id: "script",
    title: "Write a script",
    description: "Write a TypeScript script that fetches data from an API and processes it.",
    icon: <Code className="w-5 h-5 text-indigo-500" />,
    prompt: "Write a TypeScript script that fetches data from an API and handles errors."
  },
  {
    id: "document",
    title: "Analyze document",
    description: "Analyze this document and provide a comprehensive summary with key insights.",
    icon: <FileText className="w-5 h-5 text-amber-500" />,
    prompt: "Analyze this document and provide a comprehensive summary of its core contents."
  }
];

const MODELS = [
  { name: "Axiom Ultra 3.1", description: "Most capable model for complex reasoning" },
  { name: "Axiom Flash 1.5", description: "Fastest model for lightweight tasks" },
  { name: "Axiom Code 2.0", description: "Specialized in scriptwriting and debugging" }
];

export function ChiefClient({ initialUserName }: ChiefClientProps) {
  const [userName] = useState(initialUserName);
  const [greeting, setGreeting] = useState("Good afternoon");
  const [inputText, setInputText] = useState("");
  const [selectedModel, setSelectedModel] = useState("Axiom Ultra 3.1");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [chatState, setChatState] = useState<"greeting" | "chat">("greeting");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Time-aware Greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Auto-scroll chat history
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAiTyping]);

  const handleSendMessage = (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(36).substring(7),
      sender: "user",
      text: textToSend
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setChatState("chat");
    setIsAiTyping(true);

    // Simulate AI response stream
    setTimeout(() => {
      simulateAiResponse(textToSend);
    }, 1000);
  };

  const simulateAiResponse = (userPrompt: string) => {
    let responseText = "";
    const promptLower = userPrompt.toLowerCase();

    if (promptLower.includes("script") || promptLower.includes("code")) {
      responseText = `Here is a clean, robust TypeScript script to fetch API data with built-in error handling:

\`\`\`typescript
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

async function fetchFromApi<T>(url: string): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    });

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    const data = await response.json() as T;
    return { data, error: null };
  } catch (error: any) {
    return { 
      data: null, 
      error: error.message || "An unexpected error occurred" 
    };
  }
}
\`\`\`

You can import and use this function anywhere in your app. Let me know if you would like me to add pagination, authentication headers, or mock interfaces!`;
    } else if (promptLower.includes("document") || promptLower.includes("analyze")) {
      responseText = `I have successfully analyzed the uploaded document workspace. Here is a summary of the key findings:

• **Architecture Design**: The codebase is configured as a Next.js App Router workspace utilizing Tailwind CSS v4 and Prisma ORM.
• **Visual System**: Reconstructed around a premium glassmorphic visual layer, featuring smooth spring-based dynamic motion and liquid glow light rings.
• **Pending Updates**: The mission planning and calendar schedules are operating successfully; AI orchestration integrations are currently queued.

Would you like me to extract metadata, inspect specific directories, or run validation tests on the database models?`;
    } else {
      responseText = `Hello ${userName}! I am your Chief AI coordinator. 

I'm currently running in sandbox mode while my backend model nodes are being initialized. I'm ready to assist you in designing mock flows, generating TypeScript code snippets, or summarizing document outlines.

How can I help you customize ChiefOS today?`;
    }

    const aiMsgId = Math.random().toString(36).substring(7);
    const newAiMsg: Message = {
      id: aiMsgId,
      sender: "ai",
      text: "",
      isStreaming: true
    };

    setMessages(prev => [...prev, newAiMsg]);
    setIsAiTyping(false);

    let currentLength = 0;
    const words = responseText.split(" ");
    let wordIndex = 0;

    const interval = setInterval(() => {
      if (wordIndex < words.length) {
        const nextChunk = words.slice(0, wordIndex + 1).join(" ");
        setMessages(prev => 
          prev.map(m => m.id === aiMsgId ? { ...m, text: nextChunk } : m)
        );
        wordIndex++;
      } else {
        clearInterval(interval);
        setMessages(prev => 
          prev.map(m => m.id === aiMsgId ? { ...m, isStreaming: false } : m)
        );
      }
    }, 45); // Smooth word streaming
  };

  const handleResetChat = () => {
    setChatState("greeting");
    setMessages([]);
    setInputText("");
    setIsAiTyping(false);
    toast.success("New conversation started!");
  };

  const selectQuickStart = (prompt: string) => {
    setInputText(prompt);
    handleSendMessage(prompt);
  };

  return (
    <div className={`relative w-full h-[calc(100vh-3.5rem)] overflow-hidden select-none bg-[#faf8f5] dark:bg-[#090807] transition-colors duration-700 flex flex-col items-center justify-between ${isFullScreen ? "fixed inset-0 z-50 h-screen w-screen" : ""}`}>
      
      {/* Dynamic Animated Flowing Gradient Backdrop Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[5%] left-[10%] w-[55%] h-[55%] rounded-full bg-gradient-to-tr from-orange-200/40 to-amber-100/30 blur-[130px] dark:from-amber-950/20 dark:to-orange-950/10 animate-blob-1" />
        <div className="absolute bottom-[5%] right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-rose-100/50 to-orange-100/30 blur-[150px] dark:from-purple-950/20 dark:to-amber-950/10 animate-blob-2" />
        <div className="absolute top-[40%] left-[35%] w-[40%] h-[40%] rounded-full bg-gradient-to-tr from-amber-100/40 to-rose-100/40 blur-[120px] dark:from-stone-900/40 dark:to-stone-850/40 animate-blob-3" />
        {/* Soft satin blur overlay */}
        <div className="absolute inset-0 bg-white/40 dark:bg-black/45 backdrop-blur-[4px]" />
      </div>

      {/* Floating Control Panel (Top Edge) */}
      <header className="relative z-10 w-full px-8 py-3 flex items-center justify-between shrink-0 border-b border-white/20 dark:border-white/5 bg-white/10 dark:bg-black/10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-amber-500" />
          <span className="text-xs font-black tracking-widest text-slate-800 dark:text-slate-200 uppercase">Chief Node</span>
        </div>
        <div className="flex items-center gap-2">
          {chatState === "chat" && (
            <button
              onClick={handleResetChat}
              className="flex items-center gap-1.5 bg-white/40 dark:bg-slate-900/60 hover:bg-white/80 dark:hover:bg-slate-900 border border-white/50 dark:border-white/10 rounded-full px-4 py-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-350 transition-all active:scale-95 shadow-sm"
            >
              <RefreshCw className="w-3 h-3" /> New Conversation
            </button>
          )}
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2 bg-white/40 dark:bg-slate-900/60 hover:bg-white/80 dark:hover:bg-slate-900 border border-white/50 dark:border-white/10 rounded-full text-slate-700 dark:text-slate-350 transition-all"
            title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

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

              <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-12">
                {greeting}, {userName}
              </h1>

              {/* Chat Box (Centered) */}
              <div className="w-full max-w-2xl mb-8">
                <ChatInput 
                  value={inputText}
                  onChange={setInputText}
                  onSend={handleSendMessage}
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  isModelDropdownOpen={isModelDropdownOpen}
                  setIsModelDropdownOpen={setIsModelDropdownOpen}
                  inputRef={inputRef}
                />
              </div>

              {/* Quick Start Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mt-4">
                {QUICK_STARTS.map((card, i) => (
                  <motion.button
                    key={card.id}
                    onClick={() => selectQuickStart(card.prompt)}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                    className="group text-left p-5 rounded-[1.5rem] bg-white/70 dark:bg-slate-900/60 backdrop-blur-lg border border-white/80 dark:border-white/10 hover:border-orange-200/80 dark:hover:border-amber-900/30 hover:bg-white dark:hover:bg-slate-900/90 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.05)] hover:shadow-[0_12px_30px_-8px_rgba(249,115,22,0.08)] transition-all duration-300 flex items-start gap-4"
                  >
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-950/80 group-hover:bg-orange-50 dark:group-hover:bg-orange-950/20 rounded-xl border border-slate-100 dark:border-white/5 transition-colors shrink-0">
                      {card.icon}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-tight group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 leading-normal font-medium">
                        {card.description}
                      </p>
                    </div>
                  </motion.button>
                ))}
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
                {messages.map((msg) => {
                  const isUser = msg.sender === "user";
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
                        <div className="whitespace-pre-wrap font-medium">
                          {msg.text}
                          {msg.isStreaming && (
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
                  value={inputText}
                  onChange={setInputText}
                  onSend={handleSendMessage}
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  isModelDropdownOpen={isModelDropdownOpen}
                  setIsModelDropdownOpen={setIsModelDropdownOpen}
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
  selectedModel: string;
  setSelectedModel: (val: string) => void;
  isModelDropdownOpen: boolean;
  setIsModelDropdownOpen: (val: boolean) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

function ChatInput({
  value,
  onChange,
  onSend,
  selectedModel,
  setSelectedModel,
  isModelDropdownOpen,
  setIsModelDropdownOpen,
  inputRef
}: ChatInputProps) {
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend(value);
    }
  };

  return (
    <div className="w-full relative bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-[2rem] shadow-[0_10px_35px_-8px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_10px_35px_-8px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.05)] p-2">
      
      {/* TextInput Row */}
      <div className="flex items-center px-4 py-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="How can I help you today?"
          className="flex-grow bg-transparent text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none pr-4 font-semibold"
        />
      </div>

      {/* Button Controls Row */}
      <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-2 px-2 mt-1">
        <div className="flex items-center gap-1">
          <button 
            onClick={() => toast.info("Add integrations coming soon")}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors"
            title="Add features"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button 
            onClick={() => toast.info("File upload coming soon")}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors"
            title="Attach documents"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <button 
            onClick={() => toast.info("Live search coming soon")}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors"
            title="Search the web"
          >
            <Globe className="w-4 h-4" />
          </button>
          <button 
            onClick={() => toast.info("Voice input coming soon")}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors"
            title="Voice message"
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Model Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-extrabold tracking-tight text-slate-600 dark:text-slate-350 transition-colors"
            >
              {selectedModel}
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isModelDropdownOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                {MODELS.map((model) => (
                  <button
                    key={model.name}
                    onClick={() => {
                      setSelectedModel(model.name);
                      setIsModelDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors flex flex-col gap-0.5 ${
                      selectedModel === model.name 
                        ? "bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white" 
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-medium"
                    }`}
                  >
                    <span>{model.name}</span>
                    <span className="text-[9px] text-slate-400 font-medium leading-normal">{model.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Send Trigger */}
          <button
            onClick={() => onSend(value)}
            disabled={!value.trim()}
            className={`p-2 rounded-full transition-all ${
              value.trim() 
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:scale-105 active:scale-95 cursor-pointer shadow-md" 
                : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed"
            }`}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
}
