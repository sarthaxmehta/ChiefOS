"use client";

import { usePathname } from "next/navigation";
import { NavigationSidebar } from "@/components/navigation-sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden mesh-bg">
      <NavigationSidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Page Content */}
        <div className="flex-1 overflow-y-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
