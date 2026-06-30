"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { updateUserPreferences } from "@/app/dashboard/actions";
import Image from "next/image";
import { toast } from "sonner";
import { 
  User, 
  Mail, 
  Clock, 
  Brain, 
  LogOut, 
  Save, 
  Sparkles, 
  ShieldCheck 
} from "lucide-react";

interface SettingsClientProps {
  initialData: {
    name: string;
    email: string;
    image: string;
    workDayStart: number;
    workDayEnd: number;
    preferredFocusWindow: string;
  };
}

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const period = i >= 12 ? "PM" : "AM";
  const displayHour = i % 12 === 0 ? 12 : i % 12;
  return { value: i, label: `${displayHour}:00 ${period}` };
});

const FOCUS_WINDOWS = ["Morning", "Afternoon", "Evening", "Night"];

export default function SettingsClient({ initialData }: SettingsClientProps) {
  const [name, setName] = useState(initialData.name);
  const [workDayStart, setWorkDayStart] = useState(initialData.workDayStart);
  const [workDayEnd, setWorkDayEnd] = useState(initialData.workDayEnd);
  const [preferredFocusWindow, setPreferredFocusWindow] = useState(initialData.preferredFocusWindow);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    if (workDayStart >= workDayEnd) {
      toast.error("Work day start must be before work day end");
      return;
    }

    setIsSaving(true);
    try {
      await updateUserPreferences({
        name,
        workDayStart,
        workDayEnd,
        preferredFocusWindow
      });
      toast.success("Preferences updated successfully");
    } catch (error) {
      toast.error("Failed to update preferences");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      toast.error("Failed to sign out");
      console.error(error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-6 space-y-8 select-none">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-neutral-900">Account Settings</h1>
        <p className="text-sm text-neutral-500 font-medium">Manage your ChiefOS profile and scheduling parameters.</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white/60 border border-neutral-200/50 backdrop-blur-md p-8 rounded-3xl shadow-xl shadow-neutral-200/5 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-primary/5 blur-[50px] rounded-full pointer-events-none" />
        <div className="relative shrink-0 flex items-center">
          <Image
            src={initialData.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${name}`}
            alt="Avatar"
            width={80}
            height={80}
            unoptimized
            className="rounded-full border-2 border-neutral-200/80 bg-neutral-100"
          />
          <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white animate-pulse" />
        </div>
        
        <div className="flex-1 text-center sm:text-left space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">{name || "Executive"}</h2>
          <p className="text-sm text-neutral-500">{initialData.email}</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-green-150/10 text-green-700 text-[10px] font-bold uppercase tracking-wider border border-green-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              AI Sync Active
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/20">
              <Sparkles className="w-3.5 h-3.5" />
              Pro License
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Account Details Card */}
        <div className="bg-white/60 border border-neutral-200/50 backdrop-blur-md p-8 rounded-3xl shadow-xl shadow-neutral-200/5 space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-neutral-100">
            <User className="w-5 h-5 text-neutral-500" />
            <h3 className="text-base font-bold text-neutral-950">Profile Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Full Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-white border border-neutral-200/60 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Email Address</label>
              <div className="w-full bg-neutral-100/50 border border-neutral-200/40 rounded-2xl px-4 py-3 text-sm text-neutral-500 flex items-center gap-2 select-none">
                <Mail className="w-4 h-4 text-neutral-400" />
                {initialData.email}
              </div>
            </div>
          </div>
        </div>

        {/* AI & Scheduling Preferences Card */}
        <div className="bg-white/60 border border-neutral-200/50 backdrop-blur-md p-8 rounded-3xl shadow-xl shadow-neutral-200/5 space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-neutral-100">
            <Clock className="w-5 h-5 text-neutral-500" />
            <h3 className="text-base font-bold text-neutral-950">Daily Preferences</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Work Day Starts</label>
              <select
                value={workDayStart}
                onChange={(e) => setWorkDayStart(parseInt(e.target.value))}
                className="w-full bg-white border border-neutral-200/60 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all appearance-none"
              >
                {HOURS.map((hr) => (
                  <option key={hr.value} value={hr.value}>{hr.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Work Day Ends</label>
              <select
                value={workDayEnd}
                onChange={(e) => setWorkDayEnd(parseInt(e.target.value))}
                className="w-full bg-white border border-neutral-200/60 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all appearance-none"
              >
                {HOURS.map((hr) => (
                  <option key={hr.value} value={hr.value}>{hr.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1">
                <Brain className="w-3.5 h-3.5 text-primary" />
                Preferred Focus Window
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {FOCUS_WINDOWS.map((window) => (
                  <button
                    key={window}
                    type="button"
                    onClick={() => setPreferredFocusWindow(window)}
                    className={`px-4 py-3 text-sm font-semibold rounded-2xl border transition-all cursor-pointer ${
                      preferredFocusWindow === window
                        ? "bg-primary/10 border-primary text-primary shadow-sm"
                        : "bg-white border-neutral-200/50 hover:bg-neutral-50 text-neutral-700"
                    }`}
                  >
                    {window}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-neutral-500 pt-1 font-medium">ChiefOS prioritizes heavy focus blocks and complex missions during this window.</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut || isSaving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 border border-red-200/60 hover:bg-red-50/50 rounded-full font-bold text-sm text-red-600 cursor-pointer disabled:opacity-50 transition-all select-none"
          >
            <LogOut className="w-4 h-4" />
            {isLoggingOut ? "Signing out..." : "Sign Out"}
          </button>

          <button
            type="submit"
            disabled={isSaving || isLoggingOut}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-neutral-950 hover:bg-neutral-850 disabled:bg-neutral-800 rounded-full font-bold text-sm text-white shadow-md shadow-neutral-950/10 active:scale-[0.98] transition-all cursor-pointer select-none"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving changes..." : "Save Preferences"}
          </button>
        </div>
      </form>
    </div>
  );
}
