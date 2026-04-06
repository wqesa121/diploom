import { redirect } from "next/navigation";
import { ShieldCheck, UserPlus, Users } from "lucide-react";

import { auth } from "@/auth";
import { createUserAction, updateUserRoleAction } from "@/actions/user-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { connectToDatabase } from "@/lib/db";
import { DEFAULT_ROLE, getDefaultAdminPath, getRoleLabel, hasPermission } from "@/lib/permissions";
import { User } from "@/models/User";

type UsersPageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

type UserListItem = {
  _id: unknown;
  name: string;
  email: string;
  role: "admin" | "editor" | "reviewer";
  createdAt: Date | string;
};

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const session = await auth();
  const role = session?.user?.role ?? DEFAULT_ROLE;
  const params = await searchParams;

  if (!hasPermission(role, "users:view")) {
    redirect(getDefaultAdminPath(role));
  }

  await connectToDatabase();
  const users = await User.find().sort({ createdAt: 1 }).lean<UserListItem[]>();
  const adminCount = users.filter((user) => user.role === "admin").length;
  const editorCount = users.filter((user) => user.role === "editor").length;
  const reviewerCount = users.filter((user) => user.role === "reviewer").length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              <Users className="h-3.5 w-3.5" />
              Team access
            </div>
            <CardTitle className="mt-4">Управление пользователями</CardTitle>
            <CardDescription>Создавайте аккаунты редакторов и reviewers, меняйте роли и держите доступы внутри админки, а не через Mongo shell.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Всего: {users.length}</Badge>
            <Badge variant="outline">Admins: {adminCount}</Badge>
            <Badge variant="outline">Editors: {editorCount}</Badge>
            <Badge variant="outline">Reviewers: {reviewerCount}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {params.success ? <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{params.success}</div> : null}
          {params.error ? <div className="rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{params.error}</div> : null}

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <Card className="border-white/70 bg-white/90">
              <CardHeader>
                <CardTitle>Current team</CardTitle>
                <CardDescription>Только admin может менять роли. Защита от удаления роли у последнего администратора включена на server action уровне.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {users.map((user) => {
                  const isCurrentUser = String(user._id) === session?.user?.id;

                  return (
                    <div key={String(user._id)} className="rounded-[1.25rem] border bg-white p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-slate-950">{user.name}</p>
                            <Badge variant={user.role === "admin" ? "default" : "secondary"}>{getRoleLabel(user.role)}</Badge>
                            {isCurrentUser ? <Badge variant="outline">you</Badge> : null}
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <p className="text-xs text-muted-foreground">Создан: {new Date(user.createdAt).toLocaleString("ru-RU")}</p>
                        </div>

                        {hasPermission(role, "users:manage") ? (
                          <form action={updateUserRoleAction.bind(null, String(user._id))} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <select
                              name="role"
                              defaultValue={user.role}
                              className="flex h-11 min-w-[180px] rounded-2xl border bg-white px-4 py-2 text-sm shadow-sm outline-none transition-colors focus:border-primary"
                            >
                              <option value="admin">Administrator</option>
                              <option value="editor">Editor</option>
                              <option value="reviewer">Reviewer</option>
                            </select>
                            <Button type="submit" variant="outline">Update role</Button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/90">
              <CardHeader>
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  <UserPlus className="h-3.5 w-3.5" />
                  New account
                </div>
                <CardTitle className="mt-3">Создать пользователя</CardTitle>
                <CardDescription>Создание новых editor и reviewer аккаунтов без CLI. Пароль задаётся сразу и потом может быть изменён самим пользователем.</CardDescription>
              </CardHeader>
              <CardContent>
                {hasPermission(role, "users:manage") ? (
                  <form action={createUserAction} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium text-slate-700">Имя</label>
                      <input id="name" name="name" required className="flex h-11 w-full rounded-2xl border bg-white px-4 py-2 text-sm shadow-sm outline-none transition-colors focus:border-primary" placeholder="Например, Maria Petrova" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-slate-700">Email</label>
                      <input id="email" name="email" type="email" required className="flex h-11 w-full rounded-2xl border bg-white px-4 py-2 text-sm shadow-sm outline-none transition-colors focus:border-primary" placeholder="editor@example.com" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-medium text-slate-700">Временный пароль</label>
                      <input id="password" name="password" type="password" required minLength={8} className="flex h-11 w-full rounded-2xl border bg-white px-4 py-2 text-sm shadow-sm outline-none transition-colors focus:border-primary" placeholder="Минимум 8 символов" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="role" className="text-sm font-medium text-slate-700">Роль</label>
                      <select id="role" name="role" defaultValue="editor" className="flex h-11 w-full rounded-2xl border bg-white px-4 py-2 text-sm shadow-sm outline-none transition-colors focus:border-primary">
                        <option value="admin">Administrator</option>
                        <option value="editor">Editor</option>
                        <option value="reviewer">Reviewer</option>
                      </select>
                    </div>
                    <Button type="submit" className="w-full">
                      <ShieldCheck className="h-4 w-4" />
                      Create account
                    </Button>
                  </form>
                ) : (
                  <div className="rounded-[1.25rem] border border-dashed bg-secondary/20 p-4 text-sm text-muted-foreground">
                    Создание пользователей доступно только администраторам.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}