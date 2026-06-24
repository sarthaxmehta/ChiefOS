"use client";

import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, Calendar, Brain, Activity, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const container: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const item: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-accent via-indigo-500 to-purple-600 blur-[100px] rounded-full mix-blend-screen" />
      </div>

      <header className="w-full flex items-center justify-between px-8 py-6 z-10 relative">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight">ChiefOS</span>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</Link>
          <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How it Works</Link>
          <Link href="/dashboard" className={buttonVariants({ variant: "secondary", className: "rounded-full" })}>
            Log in
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 z-10 relative mt-20 mb-32">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-4xl w-full text-center space-y-8"
        >
          <motion.div variants={item} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 text-sm font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Introducing the Executive Operating System
          </motion.div>
          
          <motion.h1 variants={item} className="text-6xl md:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
            Your AI Chief <br/> of Staff.
          </motion.h1>
          
          <motion.p variants={item} className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Stop remembering deadlines. <br className="hidden md:block" />
            Start finishing them.
          </motion.p>
          
          <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link 
              href="/dashboard" 
              className={buttonVariants({ size: "lg", className: "rounded-full h-14 px-8 text-base group bg-foreground text-background hover:bg-foreground/90" })}
            >
              Start Planning
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="#demo"
              className={buttonVariants({ size: "lg", variant: "outline", className: "rounded-full h-14 px-8 text-base bg-background/50 backdrop-blur-sm border-border hover:bg-accent/5" })}
            >
              Watch Demo
            </Link>
          </motion.div>
        </motion.div>

        {/* Feature Cards Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, type: "spring" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-32"
        >
          <FeatureCard 
            icon={<Calendar className="w-6 h-6 text-accent" />}
            title="Smart Scheduler"
            description="Automatically builds and recalculates your daily plan based on deadlines and effort."
          />
          <FeatureCard 
            icon={<Activity className="w-6 h-6 text-warning" />}
            title="Active Execution"
            description="Continuously monitors progress. Warns you before you fail, suggests reprioritization."
          />
          <FeatureCard 
            icon={<ShieldCheck className="w-6 h-6 text-success" />}
            title="Risk Engine"
            description="Calculates success probabilities and risk scores for every mission in real-time."
          />
        </motion.div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-card/40 backdrop-blur-md border border-white/10 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:-translate-y-1 transition-transform duration-300">
      <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center mb-4 shadow-sm border border-border">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
