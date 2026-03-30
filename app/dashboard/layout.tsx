import { Sidebar } from "@/components/sidebar";
import { UserProvider } from "@/lib/user-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        {/* Offset main content by sidebar width */}
        <main className="flex-1 ml-[230px] min-h-screen flex flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </UserProvider>
  );
}
