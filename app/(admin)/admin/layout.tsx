import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { MobileSidebar } from "@/components/admin/mobile-sidebar";
import { SignOutButton } from "@/components/admin/sign-out-button";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container grid min-h-screen gap-6 py-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="hidden lg:block">
          <AdminSidebar />
        </div>
        <div className="space-y-6">
          <header className="flex items-center justify-between rounded-[2rem] border bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
            <div className="flex items-center gap-3">
              <MobileSidebar />
              <div>
                <p className="text-sm text-muted-foreground">Signed in as</p>
                <p className="font-semibold">{session.user.email}</p>
              </div>
            </div>
            <SignOutButton />
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
