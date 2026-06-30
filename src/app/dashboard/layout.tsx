import { auth } from "@/auth"
import { NavigationSidebar } from "@/components/navigation-sidebar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex h-screen overflow-hidden mesh-bg">
      <NavigationSidebar session={session} />

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
