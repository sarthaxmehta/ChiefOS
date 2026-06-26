"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createManualMissionAction } from "@/app/actions";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, Calendar, Clock, AlignLeft, Tag, Flag, Palette, Repeat, Check } from "lucide-react";

const COLORS = [
  { name: "Red", value: "Red", class: "bg-red-500 hover:bg-red-600 ring-red-500" },
  { name: "Blue", value: "Blue", class: "bg-blue-500 hover:bg-blue-600 ring-blue-500" },
  { name: "Green", value: "Green", class: "bg-green-500 hover:bg-green-600 ring-green-500" },
  { name: "Purple", value: "Purple", class: "bg-purple-500 hover:bg-purple-600 ring-purple-500" },
  { name: "Yellow", value: "Yellow", class: "bg-yellow-500 hover:bg-yellow-600 ring-yellow-500" },
  { name: "Orange", value: "Orange", class: "bg-orange-500 hover:bg-orange-600 ring-orange-500" }
];

export function MissionCaptureDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [priority, setPriority] = useState("Low");
  const [category, setCategory] = useState("Work");
  const [recurringRule, setRecurringRule] = useState("One-time");
  const [color, setColor] = useState("Red");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setPriority("Low");
    setCategory("Work");
    setRecurringRule("One-time");
    setColor("Red");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsProcessing(true);
    
    // Convert time strings to ISO dates if a date is selected
    let startIso = null;
    let endIso = null;
    let dateIso = null;

    if (date) {
      dateIso = new Date(date).toISOString();
      if (startTime) {
        const d = new Date(date);
        const [hours, minutes] = startTime.split(":");
        d.setHours(parseInt(hours), parseInt(minutes));
        startIso = d.toISOString();
      }
      if (endTime) {
        const d = new Date(date);
        const [hours, minutes] = endTime.split(":");
        d.setHours(parseInt(hours), parseInt(minutes));
        endIso = d.toISOString();
      }
    }

    const result = await createManualMissionAction({
      title,
      description,
      priority,
      date: dateIso,
      startTime: startIso,
      endTime: endIso,
      category,
      color,
      notes,
      recurringRule
    });
    
    setIsProcessing(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setOpen(false);
        resetForm();
      }, 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if(!val) resetForm(); }}>
      <DialogTrigger render={<span />} onClick={() => setOpen(true)}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-card border-border/50 shadow-2xl">
        <div className="p-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
          <DialogHeader className="mb-6">
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              Create Task
            </DialogTitle>
          </DialogHeader>
          
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-24 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mb-6">
                  <Check className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-bold mb-2">Task Created</h3>
                <p className="text-muted-foreground">Your task has been successfully added to your database.</p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* Task Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <AlignLeft className="w-4 h-4 text-muted-foreground" /> Task Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g., Complete quarterly financial report"
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-base"
                    autoFocus
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Description (Optional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add details about this task..."
                    className="w-full min-h-[80px] p-4 rounded-xl bg-background border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Date & Time */}
                  <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Scheduling (Optional)
                    </h4>
                    
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Target Date</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">Start Time</label>
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">End Time</label>
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Classification */}
                  <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Tag className="w-4 h-4" /> Classification
                    </h4>
                    
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Flag className="w-3 h-3" /> Priority
                      </label>
                      <select 
                        value={priority} 
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Tag className="w-3 h-3" /> Category
                      </label>
                      <select 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      >
                        <option value="Work">Work</option>
                        <option value="Personal">Personal</option>
                        <option value="Health">Health</option>
                        <option value="Learning">Learning</option>
                        <option value="Payment">Payment</option>
                        <option value="General">General</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Task Type / Recurring */}
                  <div className="space-y-3 p-4 rounded-xl border border-border">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Repeat className="w-4 h-4 text-muted-foreground" /> Task Frequency
                    </label>
                    <div className="flex gap-2">
                      {["One-time", "Recurring", "Habit"].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setRecurringRule(type)}
                          className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                            recurringRule === type 
                              ? "bg-primary text-primary-foreground border-primary" 
                              : "bg-background text-muted-foreground border-border hover:bg-muted"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="space-y-3 p-4 rounded-xl border border-border">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Palette className="w-4 h-4 text-muted-foreground" /> Label Color
                    </label>
                    <div className="flex items-center gap-3 flex-wrap">
                      {COLORS.map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setColor(c.name)}
                          title={c.name}
                          className={`w-8 h-8 rounded-full transition-all ${c.class} ${
                            color === c.name 
                              ? "ring-2 ring-offset-2 ring-offset-background scale-110" 
                              : "opacity-70 hover:opacity-100"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Extra Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any extra context or links..."
                    className="w-full min-h-[60px] p-3 rounded-xl bg-background border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                </div>

                {/* Submit Area */}
                <div className="flex justify-end pt-4 border-t border-border mt-6">
                  <button
                    type="submit"
                    disabled={isProcessing || !title.trim()}
                    className="inline-flex items-center justify-center min-w-[140px] gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:bg-primary/90 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none transition-all"
                  >
                    {isProcessing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                    ) : "Create Task"}
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
