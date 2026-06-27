"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Target, 
  CheckSquare, 
  BrainCircuit
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChiefLogo } from "@/components/ui/logo";

const NAV_ITEMS = [
  { name: "Today", href: "/dashboard", icon: LayoutDashboard },
  { name: "Calendar", href: "/dashboard/schedule", icon: CalendarIcon },
  { name: "Tasks", href: "/dashboard/missions", icon: Target },
  { name: "Chief", href: "/dashboard/chief", icon: BrainCircuit },
  { name: "Briefing", href: "/dashboard/briefing", icon: CheckSquare },
];

export function NavigationSidebar() {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 4000);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsHovered(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        ref={sidebarRef}
        initial={false}
        animate={{ 
          width: isHovered ? 240 : 72 
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative h-screen z-50 shrink-0 bg-white/70 dark:bg-slate-950/70 backdrop-blur-3xl border-r border-white/60 dark:border-white/20 shadow-[8px_0_32px_0_rgba(0,0,0,0.08)] flex flex-col justify-between py-6 overflow-hidden"
      >
        <div className="flex flex-col gap-8 w-full">
          {/* Logo */}
          <div className="px-5 flex items-center h-8 shrink-0">
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <ChiefLogo className="w-8 h-8 text-slate-900 dark:text-white" />
            </div>
            <AnimatePresence>
              {isHovered && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                  className="ml-3 font-bold tracking-tight text-lg whitespace-nowrap"
                >
                  ChiefOS
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Main Navigation */}
          <nav className="flex flex-col gap-1 px-2">
            {NAV_ITEMS.map((item) => (
              <NavItem 
                key={item.href} 
                item={item} 
                isActive={pathname === item.href} 
                isExpanded={isHovered} 
              />
            ))}
          </nav>
        </div>

        {/* Bottom Navigation (Unified Settings & Profile) */}
        <div className="px-2 flex flex-col gap-2">
          <div className="border-t border-slate-200/50 dark:border-white/10 mt-2 pt-3 w-full">
            <Link
              href="/dashboard/settings"
              className={`relative flex items-center h-[52px] rounded-2xl group transition-all duration-200 outline-none overflow-hidden w-full
                ${pathname !== "/dashboard/settings" ? "hover:bg-black/5 dark:hover:bg-white/10" : ""}
              `}
            >
              {/* Sliding Active Pill Background */}
              {pathname === "/dashboard/settings" && (
                <motion.div
                  layoutId="active-nav-pill"
                  className="absolute inset-0 bg-slate-900 dark:bg-slate-100 rounded-2xl shadow-md"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              {/* Collapsed state (Avatar + pulse badge + tooltip) */}
              {!isHovered ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-[56px] flex justify-center shrink-0 z-10 relative cursor-pointer">
                      <Image
                        src="https://api.dicebear.com/7.x/notionists/svg?seed=Sarthak"
                        alt="Avatar"
                        width={28}
                        height={28}
                        unoptimized
                        className={`rounded-full border transition-colors ${
                          pathname === "/dashboard/settings" ? "border-slate-800 dark:border-slate-200 bg-slate-900" : "border-border bg-slate-100 dark:bg-slate-800"
                        }`}
                      />
                      <span className="absolute bottom-0 right-3 w-2 h-2 rounded-full bg-green-500 border border-white dark:border-slate-950 animate-pulse" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10} className="font-semibold text-xs bg-popover/95 backdrop-blur-sm border-border">
                    Settings · Sarthak (AI Active)
                  </TooltipContent>
                </Tooltip>
              ) : (
                /* Expanded state (Avatar card) */
                <div className="flex items-center w-full px-2.5 z-10 relative cursor-pointer">
                  <div className="relative shrink-0 flex items-center">
                    <Image
                      src="https://api.dicebear.com/7.x/notionists/svg?seed=Sarthak"
                      alt="Avatar"
                      width={32}
                      height={32}
                      unoptimized
                      className="rounded-full border border-border bg-slate-100 dark:bg-slate-800"
                    />
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border border-white dark:border-slate-950 animate-pulse" />
                  </div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-3 flex flex-col min-w-0"
                  >
                    <span className={`font-bold text-[13px] leading-tight truncate transition-colors duration-200 ${
                      pathname === "/dashboard/settings" ? "text-white dark:text-black" : "text-slate-850 dark:text-slate-200"
                    }`}>
                      Sarthak
                    </span>
                    <span className={`text-[8px] font-black tracking-wider uppercase flex items-center gap-1 mt-0.5 transition-colors duration-200 ${
                      pathname === "/dashboard/settings" ? "text-green-300 dark:text-green-700" : "text-green-600 dark:text-green-400"
                    }`}>
                      <span className={`w-1 h-1 rounded-full animate-pulse ${
                        pathname === "/dashboard/settings" ? "bg-green-300 dark:bg-green-700" : "bg-green-500"
                      }`} />
                      AI Active
                    </span>
                  </motion.div>
                </div>
              )}
            </Link>
          </div>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}

function NavItem({ 
  item, 
  isActive, 
  isExpanded 
}: { 
  item: typeof NAV_ITEMS[0]; 
  isActive: boolean; 
  isExpanded: boolean;
}) {
  const Icon = item.icon;

  const content = (
    <Link
      href={item.href}
      className={`relative flex items-center h-[52px] rounded-2xl group transition-all duration-200 outline-none overflow-hidden w-full
        ${!isActive ? "hover:bg-black/5 dark:hover:bg-white/10" : ""}
      `}
    >
      {/* Sliding Active Pill Background */}
      {isActive && (
        <motion.div
          layoutId="active-nav-pill"
          className="absolute inset-0 bg-slate-900 dark:bg-slate-100 rounded-2xl shadow-md"
          initial={false}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}

      {/* Icon */}
      <div className="w-[56px] flex justify-center shrink-0 z-10 relative">
        <Icon className={`w-[22px] h-[22px] transition-colors ${isActive ? "text-white dark:text-black" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100"}`} />
      </div>

      {/* Label */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`font-semibold text-[15px] whitespace-nowrap z-10 relative ${isActive ? "text-white dark:text-black" : "text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100"}`}
          >
            {item.name}
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  );

  if (!isExpanded) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={10} className="font-medium text-xs bg-popover/95 backdrop-blur-sm border-border">
          {item.name}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
