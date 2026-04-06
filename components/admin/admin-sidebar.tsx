"use client";

import Link from "next/link";
import { BarChart3, FileText, Home, KeyRound, ShieldCheck, Sparkles, Users } from "lucide-react";
import { usePathname } from "next/navigation";

import { hasPermission, type AdminPermission, type UserRole } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/admin", label: "Dashboard", icon: Home, permission: "dashboard:view" },
  { href: "/admin/users", label: "Team", icon: Users, permission: "users:view" },
  { href: "/admin/articles", label: "Articles", icon: FileText, permission: "articles:view" },
  { href: "/admin/review", label: "Review Queue", icon: ShieldCheck, permission: "review:view" },
  { href: "/admin/articles/new", label: "Generate + Create", icon: Sparkles, permission: "articles:create" },
  { href: "/admin/account", label: "Account Security", icon: KeyRound, permission: "account:view" },
] satisfies Array<{ href: string; label: string; icon: React.ComponentType<{ className?: string }>; permission: AdminPermission }>;

type AdminSidebarProps = {
  role: UserRole;
};

export function AdminSidebar({ role }: AdminSidebarProps) {
  const pathname = usePathname();
  const filteredNavigation = navigation.filter((item) => hasPermission(role, item.permission));

  return (
    <aside className="flex h-full flex-col justify-between rounded-[2rem] border border-sidebar-border bg-sidebar/90 p-5 shadow-sm backdrop-blur">
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold">NeuraCMS</p>
              <p className="text-sm text-sidebar-muted">AI-first headless publishing</p>
            </div>
          </div>
          <p className="text-sm leading-6 text-sidebar-muted">
            Современная headless система управления контентом, использующая встроенный ИИ для генерации SEO-оптимизированных текстов, тегов и изображений.
          </p>
        </div>
        <nav className="space-y-2">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                  isActive ? "bg-sidebar-accent text-primary" : "text-sidebar-foreground hover:bg-secondary",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="rounded-[1.5rem] border border-primary/10 bg-primary/5 p-4 text-sm text-sidebar-foreground">
        Контент, мета-данные и headless API управляются из одного интерфейса без внешней SaaS CMS.
      </div>
    </aside>
  );
}
