"use client";

import { useActionState } from "react";
import { Loader2, LogIn } from "lucide-react";

import { loginAction, type AuthActionState } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {
  success: false,
};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <Card className="w-full max-w-md border-white/70 bg-white/90 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.25)]">
      <CardHeader className="space-y-3">
        <div className="inline-flex w-fit items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          NeuraCMS Admin
        </div>
        <CardTitle className="text-3xl">Вход в админ-панель</CardTitle>
        <CardDescription>
          Авторизация через Auth.js с MongoDB Adapter. Используйте email и пароль администратора.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="admin@example.com" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input id="password" name="password" type="password" placeholder="••••••••" autoComplete="current-password" required />
          </div>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Войти
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
