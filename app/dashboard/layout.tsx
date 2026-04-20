import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { UserProvider, type UserProfile, type UserRole, type IconUserId } from "@/lib/user-context";
import { NotificationsProvider } from "@/lib/notifications-context";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user?.email) {
    redirect("/login");
  }

  const userEmail = authData.user.email;
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, full_name, avatar_icon, role, email, is_active")
    .eq("email", userEmail)
    .single();

  if (profileError || !profile) {
    console.error("Unable to load dashboard profile:", profileError);
    redirect("/login");
  }

  // Check if user account is still active
  if (!profile.is_active) {
    // Sign out the user
    await supabase.auth.signOut();
    redirect("/login");
  }

  const initialUser: UserProfile = {
    id: Number(profile.id),
    authId: authData.user.id,
    name: profile.full_name ?? profile.email,
    email: profile.email,
    role: (profile.role as UserRole) ?? "user",
    iconId: (profile.avatar_icon as IconUserId) || "Users",
    isActive: profile.is_active,
    deletedAt: null,
  };

  return (
    <UserProvider initialUser={initialUser}>
      <NotificationsProvider>
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <main className="hidden md:flex flex-1 ml-[230px] min-h-screen flex-col overflow-hidden">
            {children}
          </main>
          <main className="md:hidden flex-1 min-h-screen flex flex-col overflow-hidden">
            {children}
          </main>
        </div>
      </NotificationsProvider>
    </UserProvider>
  );
}