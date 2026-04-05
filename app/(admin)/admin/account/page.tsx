import { ShieldCheck } from "lucide-react";

import { auth } from "@/auth";
import { AccountPasswordForm } from "@/components/admin/account-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminAccountPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border bg-white/85 p-6 shadow-sm backdrop-blur md:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          <ShieldCheck className="h-3.5 w-3.5" />
          Security settings
        </div>
        <div className="mt-4 space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Безопасность аккаунта</h1>
          <p className="max-w-2xl text-muted-foreground">
            Здесь можно сменить пароль для текущего пользователя и убрать временные или слабые credentials после первичного seed.
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <AccountPasswordForm />
        <Card className="border-white/70 bg-white/90">
          <CardHeader>
            <CardTitle>Текущая сессия</CardTitle>
            <CardDescription>Краткая информация о пользователе, который меняет пароль.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Email: {session?.user?.email ?? "Unknown"}</p>
            <p>Role: {session?.user?.role ?? "editor"}</p>
            <p>Рекомендуется использовать уникальный пароль длиной от 12 символов.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}