"use client";

import { useState } from "react";
import { ArrowLeft, Clock, Calendar, CheckSquare, Activity, Settings2, Trash2, Files, MoreHorizontal, BrainCircuit, ChevronDown } from "lucide-react";
import Link from "next/link";
import { GenerateSubMissionsButton } from "./ClientActions";

// This page requires client-side state for tabs and dropdown
// Mission data is passed as props from the server wrapper

interface SubMission {
  id: string;
  title: string;
  description: string | null;
  estimatedMinutes: number | null;
  priority: string;
  status: string;
}

interface MissionActivity {
  id: string;
  action: string;
  createdAt: Date;
}

interface Mission {
  id: string;
  title: string;
  description: string | null;
  context: string | null;
  deadline: Date | null;
  estimatedMinutes: number | null;
  energyRequired: string;
  priority: string;
  status: string;
  missionScore: number;
  subMissions: SubMission[];
  activities: MissionActivity[];
}

const TABS = ["Subtasks", "Timeline", "Notes", "Activity", "AI Analysis"] as const;
type Tab = typeof TABS[number];

export function MissionWorkspace({ mission }: { mission: Mission }) {
  const [activeTab, setActiveTab] = useState<Tab>("Subtasks");
  const [menuOpen, setMenuOpen] = useState(false);

  const formatDate = (d: Date | null) => {
    if (!d) return "No deadline";
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(d));
  };

  const formatTime = (d: Date) => {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(d));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 pb-24">
      {/* Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/missions" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Missions
        </Link>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-xl shadow-lg z-50 py-1 overflow-hidden">
              <button onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors text-left">
                <Settings2 className="w-4 h-4" /> Edit Mission
              </button>
              <button onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors text-left">
                <Files className="w-4 h-4" /> Duplicate
              </button>
              <div className="h-px bg-border my-1" />
              <button onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-destructive/10 text-destructive transition-colors text-left">
                <Trash2 className="w-4 h-4" /> Delete Mission
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mission Header */}
      <div className="space-y-3 pb-6 border-b border-border">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
            mission.priority === "High" ? "bg-red-50 text-red-600" :
            mission.priority === "Medium" ? "bg-yellow-50 text-yellow-700" :
            "bg-secondary text-muted-foreground"
          }`}>{mission.priority}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
            mission.status === "InProgress" ? "bg-blue-50 text-blue-700" :
            mission.status === "Completed" ? "bg-green-50 text-green-700" :
            "bg-muted text-muted-foreground"
          }`}>{mission.status}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{mission.title}</h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-3xl">
          {mission.description || mission.context || "No description provided."}
        </p>
        <div className="flex flex-wrap gap-5 text-sm text-muted-foreground pt-1">
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatDate(mission.deadline)}</span>
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {mission.estimatedMinutes ?? 60}m estimated</span>
          <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> {mission.energyRequired} energy</span>
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex items-center gap-0.5 border-b border-border mb-6">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              } ${tab === "AI Analysis" ? "flex items-center gap-1.5" : ""}`}
            >
              {tab === "AI Analysis" && <BrainCircuit className="w-3.5 h-3.5" />}
              {tab}
            </button>
          ))}
        </div>

        {/* Subtasks Tab */}
        {activeTab === "Subtasks" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {mission.subMissions.length} Action Items
              </h2>
              <div className="flex gap-2">
                <GenerateSubMissionsButton missionId={mission.id} />
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
              {mission.subMissions.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">No subtasks yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Use "Generate with AI" or add manually.</p>
                </div>
              ) : (
                mission.subMissions.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                      defaultChecked={sub.status === "Completed"}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${sub.status === "Completed" ? "line-through text-muted-foreground" : ""}`}>
                        {sub.title}
                      </p>
                      {sub.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{sub.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs shrink-0">
                      {sub.estimatedMinutes && (
                        <span className="text-muted-foreground">{sub.estimatedMinutes}m</span>
                      )}
                      <span className={`font-bold px-1.5 py-0.5 rounded uppercase text-[10px] ${
                        sub.priority === "High" ? "bg-red-50 text-red-600" :
                        sub.priority === "Medium" ? "bg-yellow-50 text-yellow-700" :
                        "bg-secondary text-muted-foreground"
                      }`}>{sub.priority}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === "Timeline" && (
          <div className="border border-dashed border-border rounded-xl p-10 text-center text-muted-foreground text-sm">
            Visual timeline based on scheduled blocks will appear here.
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === "Notes" && (
          <div className="bg-card border border-border rounded-xl p-4 min-h-[300px]">
            <textarea
              className="w-full h-full min-h-[260px] bg-transparent border-none resize-none focus:outline-none text-sm placeholder:text-muted-foreground"
              placeholder="Add mission notes, research links, or scratchpad thoughts..."
            />
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === "Activity" && (
          <div className="space-y-3">
            {mission.activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity recorded.</p>
            ) : (
              mission.activities.map(act => (
                <div key={act.id} className="flex items-start gap-3">
                  <Activity className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{act.action}</p>
                    <p className="text-xs text-muted-foreground">{formatTime(act.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* AI Analysis Tab */}
        {activeTab === "AI Analysis" && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
            <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2 uppercase tracking-wider">
              <BrainCircuit className="w-4 h-4" /> Chief Engine Analysis
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground mb-4">
              This mission has a score of <strong className="text-foreground">{mission.missionScore}/100</strong>.
              Based on the estimated effort and energy level, schedule this during your peak focus hours for best results.
            </p>
            <Link href="/dashboard/schedule">
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
                <Calendar className="w-4 h-4" /> Schedule on Calendar
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
