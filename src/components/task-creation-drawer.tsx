"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, Circle, Search, Clock, Calendar as CalendarIcon, Tag, Zap, Activity, Layers, Play, Check } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { createMission, updateMission } from "@/app/dashboard/actions";
import { useHotkeys } from "react-hotkeys-hook";

const COLORS = [
  { name: "Red", value: "Red", class: "bg-red-500 hover:bg-red-600 ring-red-500" },
  { name: "Blue", value: "Blue", class: "bg-blue-500 hover:bg-blue-600 ring-blue-500" },
  { name: "Green", value: "Green", class: "bg-green-500 hover:bg-green-600 ring-green-500" },
  { name: "Purple", value: "Purple", class: "bg-purple-500 hover:bg-purple-600 ring-purple-500" },
  { name: "Yellow", value: "Yellow", class: "bg-yellow-500 hover:bg-yellow-600 ring-yellow-500" },
  { name: "Orange", value: "Orange", class: "bg-orange-500 hover:bg-orange-600 ring-orange-500" }
];

import { useEffect } from "react";

interface TaskCreationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
  taskToEdit?: any;
}

export function TaskCreationDrawer({ isOpen, onClose, initialDate, taskToEdit }: TaskCreationDrawerProps) {
  // Section 1: Basic Info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Section 2: Type
  const [type, setType] = useState("One Time");
  
  // Section 3: Priority
  const [priority, setPriority] = useState("Low");

  // Section 3.5: Color Label
  const [color, setColor] = useState("Red");
  const [customColor, setCustomColor] = useState("#ea580c");

  // Section 4: Frequency (Only for Recurring/Habit)
  const [recurringRule, setRecurringRule] = useState("Daily");
  const [customRepeatValue, setCustomRepeatValue] = useState(1);
  const [customRepeatUnit, setCustomRepeatUnit] = useState("weeks");

  // Section 5: Scheduling
  const [schedulingMode, setSchedulingMode] = useState("Unplanned");
  const [scheduledDate, setScheduledDate] = useState<string>(""); // YYYY-MM-DD
  const [startTime, setStartTime] = useState(""); // HH:mm
  const [endTime, setEndTime] = useState(""); // HH:mm

  // Section 6: Category
  const [category, setCategory] = useState("Work");
  const [customCategory, setCustomCategory] = useState("");

  // Section 8: Subtasks
  const [subtasks, setSubtasks] = useState<{ id: string | number, title: string }[]>([]);
  const [subtaskInput, setSubtaskInput] = useState("");

  // Section 9: Tags
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Section 10: Notes
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setTitle(taskToEdit.title || "");
        setDescription(taskToEdit.description || "");
        setType(taskToEdit.type || "One Time");
        setPriority(taskToEdit.priority || "Low");
        
        // Custom Category logic
        const presetCategories = ["Study", "Work", "Health", "Personal", "Finance", "Payment"];
        if (taskToEdit.category && !presetCategories.includes(taskToEdit.category)) {
          setCategory("Custom");
          setCustomCategory(taskToEdit.category);
        } else {
          setCategory(taskToEdit.category || "Work");
          setCustomCategory("");
        }
        
        // Color
        if (taskToEdit.color && taskToEdit.color.startsWith("#")) {
          setColor(taskToEdit.color);
          setCustomColor(taskToEdit.color);
        } else {
          setColor(taskToEdit.color || "Red");
          setCustomColor("#ea580c");
        }
        
        // Recurring rule logic
        const presetRules = ["Daily", "Weekly", "Monthly"];
        if (taskToEdit.recurringRule) {
          if (!presetRules.includes(taskToEdit.recurringRule)) {
            setRecurringRule("Custom");
            const match = taskToEdit.recurringRule.match(/Repeat every (\d+) (\w+)/);
            if (match) {
              setCustomRepeatValue(parseInt(match[1], 10));
              setCustomRepeatUnit(match[2]);
            } else {
              setCustomRepeatValue(1);
              setCustomRepeatUnit("weeks");
            }
          } else {
            setRecurringRule(taskToEdit.recurringRule);
          }
        } else {
          setRecurringRule("Daily");
        }

        // Date and time scheduling
        if (taskToEdit.date || taskToEdit.startTime) {
          setSchedulingMode("Schedule Now");
          setScheduledDate(taskToEdit.date ? format(new Date(taskToEdit.date), "yyyy-MM-dd") : "");
          setStartTime(taskToEdit.startTime ? format(new Date(taskToEdit.startTime), "HH:mm") : "");
          setEndTime(taskToEdit.endTime ? format(new Date(taskToEdit.endTime), "HH:mm") : "");
        } else {
          setSchedulingMode("Unplanned");
          setScheduledDate(initialDate ? format(initialDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
          setStartTime("");
          setEndTime("");
        }

        // Subtasks
        if (taskToEdit.subMissions) {
          setSubtasks(taskToEdit.subMissions.map((sm: any) => ({ id: sm.id, title: sm.title })));
        } else {
          setSubtasks([]);
        }

        // Tags
        if (taskToEdit.tags) {
          try {
            setTags(JSON.parse(taskToEdit.tags));
          } catch (e) {
            setTags(taskToEdit.tags.split(",").map((t: string) => t.trim()));
          }
        } else {
          setTags([]);
        }

        // Notes
        setNotes(taskToEdit.notes || "");
      } else {
        // Reset/New Task Mode
        setTitle("");
        setDescription("");
        setType("One Time");
        setPriority("Low");
        setCategory("Work");
        setCustomCategory("");
        setColor("Red");
        setCustomColor("#ea580c");
        setRecurringRule("Daily");
        setCustomRepeatValue(1);
        setCustomRepeatUnit("weeks");
        
        const dateToUse = initialDate || new Date();
        setScheduledDate(format(dateToUse, "yyyy-MM-dd"));
        setSchedulingMode(initialDate ? "Schedule Now" : "Unplanned");
        setStartTime("");
        setEndTime("");
        
        setSubtasks([]);
        setTags([]);
        setNotes("");
      }
    }
  }, [isOpen, taskToEdit, initialDate]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleAddSubtask = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && subtaskInput.trim()) {
      e.preventDefault();
      setSubtasks([...subtasks, { id: Date.now(), title: subtaskInput.trim() }]);
      setSubtaskInput("");
    }
  };

  const handleRemoveSubtask = (idToRemove: string | number) => {
    setSubtasks(subtasks.filter(s => s.id !== idToRemove));
  };

  const handleSave = async (scheduleNow: boolean) => {
    if (!title.trim()) {
      toast.error("Task Name is required");
      return;
    }

    if (scheduleNow && !scheduledDate) {
      toast.error("Please provide a Date to schedule.");
      return;
    }

    if (scheduleNow && ((startTime && !endTime) || (!startTime && endTime))) {
      toast.error("Please provide both Start and End times, or leave both blank for a planned task without time.");
      return;
    }

    const finalCategory = category === "Custom" ? (customCategory.trim() || "Custom") : category;
    
    let finalRecurringRule = null;
    if (type === "Recurring" || type === "Habit") {
      if (recurringRule === "Custom") {
        finalRecurringRule = `Repeat every ${customRepeatValue} ${customRepeatUnit}`;
      } else {
        finalRecurringRule = recurringRule;
      }
    }

    const taskData = {
      title,
      description,
      type,
      priority,
      recurringRule: finalRecurringRule,
      scheduledDate: (scheduleNow || schedulingMode === "Schedule Now") && scheduledDate ? scheduledDate : null,
      startTime: (scheduleNow || schedulingMode === "Schedule Now") && startTime ? startTime : null,
      endTime: (scheduleNow || schedulingMode === "Schedule Now") && endTime ? endTime : null,
      category: finalCategory,
      color,
      subtasks: subtasks.map(s => s.title),
      tags,
      notes
    };

    try {
      if (taskToEdit) {
        await updateMission(taskToEdit.id, taskData);
        toast.success("Task updated successfully!");
      } else {
        await createMission(taskData);
        toast.success(scheduleNow ? "Task created and scheduled!" : "Task created successfully!");
      }
      window.dispatchEvent(new Event("task-updated"));
      onClose();
      // Reset form
      setTitle("");
      setDescription("");
      setSubtasks([]);
      setTags([]);
      setNotes("");
      setColor("Red");
      setCustomColor("#ea580c");
    } catch (error: any) {
      toast.error(error.message || "Failed to save task");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex justify-end">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Drawer */}
        <motion.div 
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-[80%] max-w-5xl h-full bg-white dark:bg-[#0A0A0A] shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="h-16 border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-8 shrink-0">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="bg-primary/20 text-primary p-1.5 rounded-md"><Play className="w-4 h-4" /></span>
              {taskToEdit ? "Edit Task" : "New Task"}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Split Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Left Form Pane */}
            <div className="flex-1 overflow-y-auto p-8 space-y-12">
              
              {/* Sec 1: Basic Info */}
              <section className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Task Name" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-4xl font-bold bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-white/10 focus:border-primary focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700 transition-colors pb-2"
                  autoFocus
                />
                <textarea 
                  placeholder="Description..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-lg bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-white/10 focus:border-primary focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700 transition-colors pb-2 min-h-[60px] resize-none"
                />
              </section>

              {/* Sec 2: Task Type */}
              <section className="space-y-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Layers className="w-4 h-4" /> Task Type</h3>
                <div className="flex flex-wrap gap-2">
                  {["One Time", "Recurring", "Project", "Habit"].map((t) => (
                    <button 
                      key={t}
                      onClick={() => setType(t)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${type === t ? "bg-slate-900 dark:bg-white text-white dark:text-black border-transparent shadow-md" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-400"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </section>

              {/* Sec 3: Priority */}
              <section className="space-y-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Activity className="w-4 h-4" /> Priority</h3>
                <div className="flex flex-wrap gap-2">
                  {["Critical", "High", "Medium", "Low"].map((p) => {
                    const colors: any = { Critical: "text-red-500", High: "text-orange-500", Medium: "text-blue-500", Low: "text-slate-500" };
                    return (
                      <button 
                        key={p}
                        onClick={() => setPriority(p)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${priority === p ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-inner" : "bg-transparent border-slate-200 dark:border-white/10 hover:border-slate-300"} ${priority === p ? colors[p] : "text-slate-600 dark:text-slate-400"}`}
                      >
                        {p}
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* Sec 4: Frequency (If Recurring/Habit) */}
              <AnimatePresence>
                {(type === "Recurring" || type === "Habit") && (
                  <motion.section 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: "auto" }} 
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Layers className="w-4 h-4" /> Frequency</h3>
                    <div className="flex flex-wrap gap-2 pt-1 pb-2">
                      {["Daily", "Weekly", "Monthly", "Custom"].map((f) => (
                        <button 
                          key={f}
                          onClick={() => setRecurringRule(f)}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${recurringRule === f ? "bg-primary/10 border-primary text-primary" : "bg-transparent border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300"}`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>

                    {recurringRule === "Custom" && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-4 items-end bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-200 dark:border-white/5 w-fit"
                      >
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500">Repeat every</label>
                          <input 
                            type="number" 
                            min="1" 
                            value={customRepeatValue} 
                            onChange={e => setCustomRepeatValue(Math.max(1, parseInt(e.target.value) || 1))} 
                            className="w-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-center"
                          />
                        </div>
                        <div className="space-y-1">
                          <select 
                            value={customRepeatUnit} 
                            onChange={e => setCustomRepeatUnit(e.target.value)} 
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                          >
                            <option value="days">days</option>
                            <option value="weeks">weeks</option>
                            <option value="months">months</option>
                          </select>
                        </div>
                      </motion.div>
                    )}
                  </motion.section>
                )}
              </AnimatePresence>

              {/* Sec 5: Scheduling */}
              <section className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><CalendarIcon className="w-4 h-4" /> Scheduling</h3>
                <div className="flex gap-2 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl w-fit">
                  <button onClick={() => setSchedulingMode("Unplanned")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${schedulingMode === "Unplanned" ? "bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700"}`}>
                    Unplanned
                  </button>
                  <button onClick={() => setSchedulingMode("Schedule Now")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${schedulingMode === "Schedule Now" ? "bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700"}`}>
                    Schedule Now
                  </button>
                </div>

                {schedulingMode === "Schedule Now" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex gap-4 items-end bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Date</label>
                      <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Start Time</label>
                      <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">End Time</label>
                      <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                    </div>
                  </motion.div>
                )}
              </section>

              {/* Sec 6: Category */}
              <section className="space-y-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Category</h3>
                <div className="flex flex-wrap gap-2">
                  {["Study", "Work", "Health", "Personal", "Finance", "Payment", "Custom"].map((c) => (
                    <button key={c} onClick={() => setCategory(c)} className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${category === c ? "bg-slate-900 dark:bg-white text-white dark:text-black border-transparent" : "bg-transparent text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-400"}`}>
                      {c}
                    </button>
                  ))}
                </div>

                {category === "Custom" && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-2"
                  >
                    <input 
                      type="text" 
                      placeholder="Enter custom category..." 
                      value={customCategory} 
                      onChange={e => setCustomCategory(e.target.value)} 
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary w-full max-w-md"
                    />
                  </motion.div>
                )}
              </section>

              {/* Sec 6.5: Label Color */}
              <section className="space-y-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Label Color</h3>
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
                  
                  {/* Custom color picker */}
                  <div className="relative">
                    <input 
                      type="color" 
                      value={customColor} 
                      onChange={(e) => {
                        setCustomColor(e.target.value);
                        setColor(e.target.value);
                      }} 
                      className="absolute inset-0 opacity-0 w-8 h-8 cursor-pointer rounded-full"
                    />
                    <div 
                      className={`w-8 h-8 rounded-full border border-slate-200/80 dark:border-white/10 flex items-center justify-center bg-gradient-to-tr from-red-500 via-green-500 to-blue-500 transition-all cursor-pointer ${
                        color.startsWith("#") ? "ring-2 ring-offset-2 ring-offset-background scale-110" : "opacity-75 hover:opacity-100"
                      }`}
                      style={color.startsWith("#") ? { backgroundColor: color, backgroundImage: "none" } : {}}
                      title="Custom Color"
                    >
                      {color.startsWith("#") && <Check className="w-4 h-4 text-white mix-blend-difference" />}
                    </div>
                  </div>
                </div>
              </section>

              {/* Sec 7: Subtasks */}
              <section className="space-y-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Subtasks</h3>
                
                <div className="space-y-2 mb-2">
                  {subtasks.map((st) => (
                    <div key={st.id} className="flex items-center justify-between group bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Circle className="w-4 h-4 text-slate-300" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{st.title}</span>
                      </div>
                      <button onClick={() => handleRemoveSubtask(st.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-1">
                  <span className="text-slate-400"><Circle className="w-4 h-4" /></span>
                  <input 
                    type="text" 
                    placeholder="Add subtask + Enter" 
                    value={subtaskInput} 
                    onChange={e => setSubtaskInput(e.target.value)} 
                    onKeyDown={handleAddSubtask} 
                    className="w-full bg-transparent focus:outline-none text-sm placeholder:text-slate-400" 
                  />
                </div>
              </section>

              {/* Sec 8: Tags & 9: Notes */}
              <div className="grid grid-cols-2 gap-8">
                <section className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Tag className="w-4 h-4" /> Tags</h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map(t => (
                      <span key={t} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1 group cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors" onClick={() => handleRemoveTag(t)}>
                        #{t} <X className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    ))}
                  </div>
                  <input type="text" placeholder="Add tag + Enter" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleAddTag} className="w-full bg-transparent border-b border-slate-200 dark:border-white/10 focus:border-primary focus:outline-none pb-2 text-sm" />
                </section>

                <section className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Notes</h3>
                  <textarea placeholder="Freeform notes..." value={notes} onChange={e => setNotes(e.target.value)} className="w-full h-24 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-primary resize-none" />
                </section>
              </div>

            </div>

            {/* Right Preview Pane */}
            <div className="w-[380px] bg-slate-50 dark:bg-slate-900/20 border-l border-slate-200 dark:border-white/10 p-8 flex flex-col items-center">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8 w-full text-center">Live Preview</h3>
              
              <div 
                className={`w-full bg-white dark:bg-[#111] rounded-2xl shadow-xl shadow-black/5 border border-slate-200 dark:border-white/10 p-6 flex flex-col gap-4 sticky top-8 hover:scale-[1.02] transition-transform border-l-4 ${
                  color === "Red" ? "border-l-red-500" :
                  color === "Blue" ? "border-l-blue-500" :
                  color === "Green" ? "border-l-green-500" :
                  color === "Purple" ? "border-l-purple-500" :
                  color === "Yellow" ? "border-l-yellow-500" :
                  color === "Orange" ? "border-l-orange-500" : "border-l-primary"
                }`}
                style={color.startsWith("#") ? { borderLeftColor: color } : {}}
              >
                <div className="flex justify-between items-start gap-4">
                  <h4 className="font-bold text-xl text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
                    {title || "Untitled Task"}
                  </h4>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md shrink-0 uppercase tracking-wider ${priority === "Critical" ? "bg-red-100 text-red-600" : priority === "High" ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                    {priority}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md flex items-center gap-1">
                    <Layers className="w-3 h-3 text-primary" /> {type}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md flex items-center gap-1">
                    <Tag className="w-3 h-3 text-emerald-500" /> {category === "Custom" ? (customCategory || "Custom") : category}
                  </span>
                  {(type === "Recurring" || type === "Habit") && (
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-500" /> {recurringRule === "Custom" ? `Every ${customRepeatValue} ${customRepeatUnit}` : recurringRule}
                    </span>
                  )}
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" /> {(schedulingMode === "Schedule Now" || (taskToEdit && schedulingMode === "Schedule Now")) && scheduledDate ? format(new Date(scheduledDate), "MMM do") : "Unscheduled"}
                  </span>
                </div>

                {subtasks.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10 space-y-2">
                    <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Subtasks ({subtasks.length})</h5>
                    {subtasks.slice(0, 3).map(st => (
                      <div key={st.id} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Circle className="w-3 h-3 shrink-0 opacity-50" />
                        <span className="truncate">{st.title}</span>
                      </div>
                    ))}
                    {subtasks.length > 3 && (
                      <div className="text-xs text-slate-400 italic">+{subtasks.length - 3} more...</div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Action Bar */}
          <div className="h-20 border-t border-slate-200 dark:border-white/10 flex items-center justify-between px-8 bg-white dark:bg-[#0A0A0A] shrink-0">
            <button onClick={onClose} className="px-6 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
              Cancel
            </button>
            <div className="flex items-center gap-3">
              {taskToEdit ? (
                <button 
                  onClick={() => handleSave(false)} 
                  className="px-6 py-2.5 text-sm font-semibold bg-primary text-white rounded-xl hover:opacity-90 transition-opacity shadow-md shadow-primary/20"
                >
                  Update Task
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => handleSave(false)} 
                    className="px-6 py-2.5 text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Save Task
                  </button>
                  <button 
                    onClick={() => handleSave(true)}
                    className="px-6 py-2.5 text-sm font-semibold bg-primary text-white rounded-xl hover:opacity-90 transition-opacity shadow-md shadow-primary/20"
                  >
                    Save & Schedule
                  </button>
                </>
              )}
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
