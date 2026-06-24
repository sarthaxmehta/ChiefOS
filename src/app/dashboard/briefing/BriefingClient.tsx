"use client";

import { useState } from "react";
import { generateBriefingAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Loader2 } from "lucide-react";

export function BriefingClient() {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const res = await generateBriefingAction();
    if (res.success) {
      setBriefing(res.briefing!);
    }
    setLoading(false);
  };

  if (!briefing && !loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-card border border-border rounded-xl">
        <BrainCircuit className="w-12 h-12 text-primary mb-4" />
        <h3 className="text-lg font-bold mb-2">Ready for your Briefing?</h3>
        <p className="text-muted-foreground text-sm mb-6 text-center max-w-md">
          ChiefOS will analyze your current schedule, active missions, and energy capacity to determine your optimal focus for today.
        </p>
        <Button onClick={handleGenerate} className="bg-primary hover:bg-primary/90 text-white rounded-xl">
          Generate Daily Briefing
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
      <h3 className="flex items-center gap-2 text-lg font-bold text-primary mb-4">
        <BrainCircuit className="w-5 h-5" /> Executive Summary
      </h3>
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Analyzing your capacity and risks...
        </div>
      ) : (
        <p className="text-lg leading-relaxed text-foreground">
          {briefing}
        </p>
      )}
    </div>
  );
}
