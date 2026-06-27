"use client";

import { useState } from "react";
import { generateSubMissionsAction } from "@/app/actions";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function GenerateSubMissionsButton({ missionId }: { missionId: string }) {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    toast.info("AI is analyzing the mission and generating sub-tasks...");
    const res = await generateSubMissionsAction(missionId);
    if (res.success) {
      toast.success("Sub-missions successfully generated!");
    } else {
      toast.error("Failed to generate sub-missions. Please try again.");
    }
    setLoading(false);
  };

  return (
    <button 
      onClick={handleGenerate} 
      disabled={loading}
      className={buttonVariants({ variant: "outline", className: "mt-4" })}
    >
      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
      {loading ? "Generating..." : "Generate Sub-missions with AI"}
    </button>
  );
}
