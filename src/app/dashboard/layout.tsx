"use client";

import { Brain, LayoutDashboard, Calendar as CalendarIcon, CheckSquare, Target, Settings, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { NavigationSidebar } from "@/components/navigation-sidebar";
import { format } from "date-fns";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const now = new Date();

  return (
    <div className="flex h-screen overflow-hidden mesh-bg">
      <NavigationSidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="h-14 border-b border-white/20 dark:border-white/10 flex items-center justify-between px-6 bg-white/20 dark:bg-black/20 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-medium">
              {format(now, "EEEE, MMMM do")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground">AI Active</span>
            </div>
            <Image
              src="https://api.dicebear.com/7.x/notionists/svg?seed=Sarthak"
              alt="Avatar"
              width={32}
              height={32}
              unoptimized
              className="rounded-full border border-border"
            />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto h-[calc(100vh-3.5rem)]">
          {children}
        </div>
      </main>
    </div>
  );
}
