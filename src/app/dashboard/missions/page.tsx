import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { Clock, Target, AlertTriangle, Plus, ArrowRight } from "lucide-react";

export default async function MissionsPage() {
  const missions = await prisma.mission.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Missions</h1>
          <p className="text-sm text-muted-foreground mt-1">{missions.length} active missions</p>
        </div>
      </div>

      <div className="space-y-2">
        {missions.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-12 text-center">
            <Target className="w-10 h-10 text-muted-foreground mb-3 mx-auto opacity-50" />
            <h3 className="text-base font-semibold mb-1">No missions yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Use the "New Mission" button in the sidebar to capture your first goal.
            </p>
          </div>
        ) : (
          missions.map((mission) => (
            <Link
              key={mission.id}
              href={`/dashboard/missions/${mission.id}`}
              className="group flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-sm transition-all"
            >
              {/* Priority indicator */}
              <div className={`w-1 h-10 rounded-full shrink-0 ${
                mission.priority === "High" ? "bg-red-500" :
                mission.priority === "Medium" ? "bg-yellow-400" :
                "bg-green-400"
              }`} />

              {/* Main content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="font-semibold text-sm truncate">{mission.title}</h2>
                </div>
                <p className="text-xs text-muted-foreground truncate max-w-lg">
                  {mission.description || mission.context || "No description"}
                </p>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right hidden md:block">
                  {mission.deadline && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <AlertTriangle className="w-3 h-3 text-yellow-500" />
                      Due {format(new Date(mission.deadline), "MMM d")}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Clock className="w-3 h-3" />
                    {mission.estimatedMinutes ?? 60}m
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  mission.status === "InProgress" ? "bg-blue-50 text-blue-700" :
                  mission.status === "Completed" ? "bg-green-50 text-green-700" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {mission.status}
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
