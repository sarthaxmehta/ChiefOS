"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Brain, Loader2, Sparkles } from "lucide-react";
import { captureMission } from "@/app/actions";
import { motion, AnimatePresence } from "framer-motion";

export function MissionCaptureDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsProcessing(true);
    const result = await captureMission(input);
    setIsProcessing(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setOpen(false);
        setInput("");
      }, 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Use render prop (Base UI pattern) instead of asChild */}
      <DialogTrigger render={<span />} onClick={() => setOpen(true)}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-card/80 backdrop-blur-xl border-border/50">
        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Brain className="w-6 h-6 text-accent" />
              Capture Mission
            </DialogTitle>
          </DialogHeader>
          
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-success/20 text-success flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Mission Captured</h3>
                <p className="text-muted-foreground">AI has successfully processed and scheduled your mission.</p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div className="relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="E.g., I have an interview next Friday at 2pm."
                    className="w-full min-h-[150px] p-4 rounded-xl bg-background border border-border resize-none focus:outline-none focus:ring-2 focus:ring-accent/50 text-lg"
                    autoFocus
                  />
                  
                  {isProcessing && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-xl">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-accent" />
                        <span className="text-sm font-medium animate-pulse">AI is parsing mission parameters...</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    Natural language supported
                  </p>
                  <button
                    type="submit"
                    disabled={isProcessing || !input.trim()}
                    className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  >
                    {isProcessing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                    ) : "Deploy Mission"}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
