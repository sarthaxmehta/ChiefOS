"use client";

import { motion, useScroll } from "framer-motion";
import { ArrowRight, Brain, Calendar, Activity, ShieldCheck, Sparkles, CheckCircle, Flame, LogIn } from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";

interface LandingClientProps {
  session: any;
}

export default function LandingClient({ session }: LandingClientProps) {
  const isLoggedIn = !!session?.user;
  const { scrollYProgress } = useScroll();

  const handleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring" as const, stiffness: 100, damping: 20 } 
    }
  };

  const textScrollVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    show: { 
      opacity: 1, 
      scale: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: "easeOut" as const } 
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-neutral-900 relative overflow-hidden flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      {/* Scroll Progress Bar for Hackathon Wow Factor */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-success z-[100] origin-left" 
        style={{ scaleX: scrollYProgress }} 
      />

      {/* Mesh background and morphing blobs */}
      <div className="absolute inset-0 mesh-bg z-0 opacity-80 pointer-events-none" />
      
      {/* Ambient background glows - subtle pastel in light mode */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80%] h-[600px] bg-primary/10 blur-[130px] rounded-full animate-blob-1 z-0 pointer-events-none" />
      <div className="absolute top-[30%] left-[10%] w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full animate-blob-2 z-0 pointer-events-none" />
      <div className="absolute top-[50%] right-[10%] w-[600px] h-[600px] bg-success/5 blur-[150px] rounded-full animate-blob-3 z-0 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-1/4 w-[70%] h-[500px] bg-primary/5 blur-[140px] rounded-full animate-blob-1 z-0 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 w-full bg-[#faf8f5]/60 backdrop-blur-xl border-b border-neutral-200/40 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-md shadow-primary/20">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-neutral-950 to-neutral-700">
              ChiefOS
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="#features" className="text-sm font-semibold text-neutral-600 hover:text-neutral-950 transition-colors hidden sm:block">
              Features
            </Link>
            <Link href="#insights" className="text-sm font-semibold text-neutral-600 hover:text-neutral-950 transition-colors hidden sm:block">
              Analytics
            </Link>
            {isLoggedIn ? (
              <Link 
                href="/dashboard" 
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-neutral-800 bg-white hover:bg-neutral-50 border border-neutral-200/50 rounded-full transition-all duration-300 shadow-sm"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <button 
                onClick={handleSignIn}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-neutral-950 hover:bg-neutral-850 rounded-full transition-all duration-300 shadow-md shadow-neutral-950/10"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center z-10 relative">
        
        {/* 1. Hero Section */}
        <section className="min-h-[85vh] flex flex-col items-center justify-center text-center px-6 max-w-5xl w-full pt-12 pb-24">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
            <motion.div 
              variants={itemVariants} 
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary tracking-wide uppercase shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              The AI Executive Operating System
            </motion.div>
            
            <motion.h1 
              variants={itemVariants} 
              className="text-5xl md:text-8xl font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-b from-neutral-950 via-neutral-800 to-neutral-600"
            >
              Focus, <br className="sm:hidden" /> engineered.
            </motion.h1>
            
            <motion.p 
              variants={itemVariants} 
              className="text-lg md:text-2xl text-neutral-600 max-w-2xl mx-auto leading-relaxed font-light"
            >
              Meet ChiefOS. A premium productivity engine that orchestrates your day based on cognitive energy, not just calendar slots.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              {isLoggedIn ? (
                <Link 
                  href="/dashboard" 
                  className="w-full sm:w-auto h-14 px-8 inline-flex items-center justify-center gap-2 font-semibold text-white bg-neutral-950 hover:bg-neutral-850 rounded-full text-base transition-all duration-300 shadow-lg shadow-neutral-950/20"
                >
                  Enter Command Center
                  <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <button 
                  onClick={handleSignIn}
                  className="w-full sm:w-auto h-14 px-8 inline-flex items-center justify-center gap-3 font-semibold text-white bg-neutral-950 hover:bg-neutral-850 rounded-full text-base transition-all duration-300 shadow-lg shadow-neutral-950/20"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                    <g transform="matrix(1, 0, 0, 1, 0, 0)">
                      <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.48C21.68,11.75 21.56,11.4 21.35,11.1z" fill="#4285F4" />
                      <path d="M12,20.88c2.4,0 4.41,-0.8 5.88,-2.16l-3.3,-2.58c-0.91,0.61 -2.08,0.98 -3.3,0.98 -2.33,0 -4.3,-1.57 -5.01,-3.69H2.88v2.66C4.36,18.89 7.94,20.88 12,20.88z" fill="#34A853" />
                      <path d="M6.99,13.43c-0.18,-0.54 -0.28,-1.11 -0.28,-1.7c0,-0.59 0.1,-1.17 0.28,-1.7V7.37H2.88C2.27,8.6 1.92,9.97 1.92,11.73c0,1.76 0.35,3.13 0.96,4.36L6.99,13.43z" fill="#FBBC05" />
                      <path d="M12,5.26c1.3,0 2.48,0.45 3.4,1.33l2.55,-2.55C16.4,2.63 14.39,1.72 12,1.72 7.94,1.72 4.36,3.71 2.88,6.82l4.11,3.2C7.7,7.9 9.67,5.26 12,5.26z" fill="#EA4335" />
                    </g>
                  </svg>
                  Get Started with Google
                </button>
              )}
              <Link 
                href="#features"
                className="w-full sm:w-auto h-14 px-8 inline-flex items-center justify-center font-semibold text-neutral-800 bg-white hover:bg-neutral-50 rounded-full text-base transition-all duration-300 border border-neutral-200/50 shadow-sm"
              >
                Explore Features
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* 2. Scroll-Triggered Storytelling Hook */}
        <section className="py-32 w-full max-w-4xl px-6 flex flex-col items-center justify-center gap-12 text-center">
          <motion.div
            variants={textScrollVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="space-y-4"
          >
            <p className="text-sm font-semibold tracking-widest text-primary uppercase">The Reality</p>
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-neutral-800 via-neutral-950 to-neutral-800">
              Time management is fundamentally broken.
            </h2>
          </motion.div>

          <motion.div
            variants={textScrollVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="text-xl md:text-3xl font-light text-neutral-600 max-w-2xl leading-relaxed"
          >
            Squeezing tasks into arbitrary blocks only breeds fatigue. You don't need another complex planner. You need cognitive orchestration.
          </motion.div>
        </section>

        {/* 3. Bento Box Feature Grid */}
        <section id="features" className="py-24 px-6 max-w-6xl w-full">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">Built for executive clarity.</h2>
            <p className="text-lg text-neutral-600 font-light max-w-xl mx-auto">
              Every detail is engineered to minimize distraction and maximize focus efficiency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Box 1: Smart Scheduler (Large, spanning 2 cols on desktop) */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="md:col-span-2 p-8 rounded-3xl bg-white/60 border border-neutral-200/50 backdrop-blur-md relative overflow-hidden flex flex-col justify-between group hover:border-primary/20 hover:bg-white/80 transition-all duration-500 shadow-xl shadow-neutral-200/10 min-h-[450px]"
            >
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors duration-500" />
              
              <div className="space-y-4 max-w-md z-10">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight">AI-Powered Energy Scheduler</h3>
                <p className="text-neutral-600 leading-relaxed font-light">
                  Your day automatically aligns to your body clock. ChiefOS maps high-effort missions to your peak cognitive windows and drops lightweight admin tasks during low-energy dips.
                </p>
              </div>

              {/* Mock Timeline UI */}
              <div className="mt-8 bg-white border border-neutral-200/50 rounded-2xl p-4 space-y-3 shadow-md z-10 select-none group-hover:translate-y-[-5px] transition-transform duration-500">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
                    <span className="w-2 h-2 rounded-full bg-success animate-ping" />
                    Cognitive Peak (Morning)
                  </div>
                  <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-bold">Recommended Slot</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#faf8f5]/80 rounded-xl border border-neutral-100 hover:border-neutral-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-10 rounded-full bg-primary" />
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">Mission: Refactor Core API</p>
                      <p className="text-[11px] text-neutral-500">Focus State • Est: 120 mins</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-primary/10 text-primary font-semibold px-2 py-1 rounded-md">High Energy</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#faf8f5]/50 rounded-xl border border-neutral-100 opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-10 rounded-full bg-accent" />
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">Check Emails & Slacks</p>
                      <p className="text-[11px] text-neutral-500">Admin State • Est: 30 mins</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-accent/10 text-accent font-semibold px-2 py-1 rounded-md">Low Energy</span>
                </div>
              </div>
            </motion.div>

            {/* Box 2: Work Sessions (Medium) */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="p-8 rounded-3xl bg-white/60 border border-neutral-200/50 backdrop-blur-md relative overflow-hidden flex flex-col justify-between group hover:border-accent/20 hover:bg-white/80 transition-all duration-500 shadow-xl shadow-neutral-200/10 min-h-[450px]"
            >
              <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-accent/5 blur-[60px] rounded-full pointer-events-none group-hover:bg-accent/10 transition-colors duration-500" />

              <div className="space-y-4 z-10">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-inner border border-accent/20">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight">Focus Metrics</h3>
                <p className="text-neutral-600 leading-relaxed font-light text-sm">
                  Deep work sessions track your real-time speed, distractions, and task execution flow to calculate highly accurate performance data.
                </p>
              </div>

              {/* Dial Progress Animation */}
              <div className="flex items-center justify-center py-6 z-10 select-none group-hover:scale-[1.05] transition-transform duration-500">
                <div className="relative flex items-center justify-center">
                  <svg className="w-36 h-36 transform -rotate-90">
                    <circle cx="72" cy="72" r="60" stroke="currentColor" className="text-neutral-200/40" strokeWidth="8" fill="transparent" />
                    <motion.circle 
                      cx="72" cy="72" r="60" stroke="currentColor" className="text-accent" strokeWidth="8" fill="transparent"
                      strokeDasharray={376.8}
                      initial={{ strokeDashoffset: 376.8 }}
                      whileInView={{ strokeDashoffset: 37.6 }} // 90% filled
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-neutral-900">90%</span>
                    <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">Focus Limit</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Box 3: Mission Insights (Medium) */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="p-8 rounded-3xl bg-white/60 border border-neutral-200/50 backdrop-blur-md relative overflow-hidden flex flex-col justify-between group hover:border-success/20 hover:bg-white/80 transition-all duration-500 shadow-xl shadow-neutral-200/10 min-h-[450px]"
            >
              <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-success/5 blur-[60px] rounded-full pointer-events-none group-hover:bg-success/10 transition-colors duration-500" />

              <div className="space-y-4 z-10">
                <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center text-success shadow-inner border border-success/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight">Mission Intelligence</h3>
                <p className="text-neutral-600 leading-relaxed font-light text-sm">
                  Active risk calculation. Get notified before scheduling conflicts occur, or when your current workload threatens critical deadlines.
                </p>
              </div>

              {/* Stacked notification UI */}
              <div className="mt-8 space-y-3 z-10 select-none">
                <div className="p-3 bg-white border border-neutral-200/60 rounded-xl flex gap-3 shadow-md transform group-hover:translate-y-[-4px] transition-transform duration-500">
                  <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900">Scheduling Optimized</h4>
                    <p className="text-[10px] text-neutral-500">Conflict resolved automatically by shifting low energy tasks.</p>
                  </div>
                </div>
                <div className="p-3 bg-white/50 border border-neutral-200/30 rounded-xl flex gap-3 opacity-60">
                  <Flame className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-neutral-800">Fatigue Alert</h4>
                    <p className="text-[10px] text-neutral-500">High workload detected. Consider a 15 min rest block.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Box 4: Active Analytics (Large, spanning 2 cols on desktop) */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              id="insights"
              className="md:col-span-2 p-8 rounded-3xl bg-white/60 border border-neutral-200/50 backdrop-blur-md relative overflow-hidden flex flex-col justify-between group hover:border-primary/20 hover:bg-white/80 transition-all duration-500 shadow-xl shadow-neutral-200/10 min-h-[450px]"
            >
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors duration-500" />

              <div className="space-y-4 max-w-md z-10">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight">Active Analytics</h3>
                <p className="text-neutral-600 leading-relaxed font-light">
                  Measure cognitive acceleration. Chart your weekly velocity trends, target completion rates, and average focus durations to dynamically calibrate your daily capacity.
                </p>
              </div>

              {/* Custom SVG Line Chart */}
              <div className="mt-8 w-full h-[180px] bg-white border border-neutral-200/50 rounded-2xl p-4 flex flex-col justify-between z-10 group-hover:translate-y-[-5px] transition-all duration-500 shadow-sm">
                <div className="flex items-center justify-between text-xs text-neutral-500 pb-2">
                  <span className="font-semibold">Mission Score Trend</span>
                  <span className="text-success font-bold">+18.4% This Week</span>
                </div>
                
                <div className="flex-1 w-full relative">
                  <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Fill */}
                    <motion.path 
                      d="M 0 30 L 0 20 Q 20 5, 40 18 T 80 8 L 100 2 L 100 30 Z" 
                      fill="url(#chartGradient)"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5, duration: 1 }}
                    />
                    {/* Line */}
                    <motion.path 
                      d="M 0 20 Q 20 5, 40 18 T 80 8 L 100 2" 
                      fill="transparent" 
                      stroke="var(--primary)" 
                      strokeWidth="1.5"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                    {/* Pulsing end point */}
                    <circle cx="100" cy="2" r="2" fill="var(--primary)" className="animate-pulse" />
                  </svg>
                </div>
                
                <div className="flex justify-between text-[9px] text-neutral-400 pt-2 border-t border-neutral-100 font-semibold">
                  <span>MON</span>
                  <span>TUE</span>
                  <span>WED</span>
                  <span>THU</span>
                  <span>FRI</span>
                  <span>SAT</span>
                  <span>SUN</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 4. Large Analytics Showcase Quote */}
        <section className="py-32 px-6 text-center max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <h3 className="text-4xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-success py-2">
              Optimize cognitive flow.
            </h3>
            <p className="text-xl md:text-2xl text-neutral-600 font-light max-w-2xl mx-auto leading-relaxed">
              Unlock a level of output you didn't know was possible. By aligning execution directly to mental capacity, burnout becomes obsolete.
            </p>
          </motion.div>
        </section>

        {/* 5. Footer / Final CTA */}
        <section className="w-full bg-white/40 border-t border-neutral-200/50 py-24 px-6 text-center flex flex-col items-center justify-center">
          <div className="max-w-2xl space-y-8">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-neutral-900">
              Ready to orchestrate your day?
            </h2>
            <p className="text-base md:text-lg text-neutral-600 font-light max-w-md mx-auto">
              Join ChiefOS today and experience performance engineered for absolute clarity.
            </p>
            <div className="flex justify-center pt-4">
              {isLoggedIn ? (
                <Link 
                  href="/dashboard" 
                  className="h-14 px-8 inline-flex items-center gap-2 font-semibold text-white bg-neutral-950 hover:bg-neutral-850 rounded-full text-base transition-all duration-300 shadow-lg shadow-neutral-950/20"
                >
                  Enter Command Center
                  <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <button 
                  onClick={handleSignIn}
                  className="h-14 px-8 inline-flex items-center gap-3 font-semibold text-white bg-neutral-950 hover:bg-neutral-850 rounded-full text-base transition-all duration-300 shadow-lg shadow-neutral-950/20"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                    <g transform="matrix(1, 0, 0, 1, 0, 0)">
                      <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.48C21.68,11.75 21.56,11.4 21.35,11.1z" fill="#4285F4" />
                      <path d="M12,20.88c2.4,0 4.41,-0.8 5.88,-2.16l-3.3,-2.58c-0.91,0.61 -2.08,0.98 -3.3,0.98 -2.33,0 -4.3,-1.57 -5.01,-3.69H2.88v2.66C4.36,18.89 7.94,20.88 12,20.88z" fill="#34A853" />
                      <path d="M6.99,13.43c-0.18,-0.54 -0.28,-1.11 -0.28,-1.7c0,-0.59 0.1,-1.17 0.28,-1.7V7.37H2.88C2.27,8.6 1.92,9.97 1.92,11.73c0,1.76 0.35,3.13 0.96,4.36L6.99,13.43z" fill="#FBBC05" />
                      <path d="M12,5.26c1.3,0 2.48,0.45 3.4,1.33l2.55,-2.55C16.4,2.63 14.39,1.72 12,1.72 7.94,1.72 4.36,3.71 2.88,6.82l4.11,3.2C7.7,7.9 9.67,5.26 12,5.26z" fill="#EA4335" />
                    </g>
                  </svg>
                  Get Started with Google
                </button>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full bg-[#faf8f5]/80 border-t border-neutral-200/40 py-10 px-6 z-10 relative text-center text-xs text-neutral-500 font-semibold">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} ChiefOS. Built for the future of focused work.</p>
          <div className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            AI Systems Online
          </div>
        </div>
      </footer>
    </div>
  );
}
