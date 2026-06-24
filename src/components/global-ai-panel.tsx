"use client";

import { BrainCircuit, AlertTriangle, Check, X, Edit2 } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";

export function GlobalAIPanel() {
  return (
    <aside className="w-80 border-l border-border bg-muted/20 flex flex-col h-screen overflow-y-auto hidden lg:flex">
      <div className="p-4 border-b border-border bg-background/50 sticky top-0 z-10 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary">Chief Engine</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Active</span>
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1">
        
        {/* Actionable Recommendations List */}
        
        <Card className="border-accent/20 bg-background shadow-sm">
          <div className="h-1 w-full bg-accent rounded-t-xl" />
          <CardContent className="p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-foreground flex items-center gap-1">
               Schedule Conflict
            </h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              "Client Sync" overlaps with your scheduled deep work block for "Backend API". Move Deep Work to 3:00 PM?
            </p>
            <div className="flex flex-col gap-2">
              <Button size="sm" className="w-full bg-accent hover:bg-accent/90 text-white text-xs h-8">
                <Check className="w-3 h-3 mr-1" /> Accept Reschedule
              </Button>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="w-full text-xs h-8 text-muted-foreground">
                  <Edit2 className="w-3 h-3 mr-1" /> Modify
                </Button>
                <Button size="sm" variant="ghost" className="w-full text-xs h-8 text-muted-foreground">
                  <X className="w-3 h-3 mr-1" /> Reject
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning/30 bg-background shadow-sm">
          <div className="h-1 w-full bg-warning rounded-t-xl" />
          <CardContent className="p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-foreground flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-warning" /> Energy Overload
            </h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              You have scheduled 4 consecutive high-energy tasks. This drastically reduces completion probability. Inject a 30m recovery block at 1:00 PM?
            </p>
            <div className="flex flex-col gap-2">
              <Button size="sm" variant="outline" className="w-full text-xs h-8 border-warning/50 text-warning-foreground hover:bg-warning/10">
                <Check className="w-3 h-3 mr-1" /> Add Recovery Block
              </Button>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="w-full text-xs h-8 text-muted-foreground">
                  <X className="w-3 h-3 mr-1" /> Reject
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </aside>
  );
}
