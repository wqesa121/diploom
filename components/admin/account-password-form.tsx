"use client";

import { useActionState, useEffect, useRef } from "react";
import { CheckCircle2, KeyRound, Loader2, ShieldCheck } from "lucide-react";

import { changePasswordAction, type AuthActionState } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {
  success: false,
};

export function AccountPasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <Card className="border-white/70 bg-white/90 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.2)]">
      <CardHeader className="space-y-3">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          <ShieldCheck className="h-3.5 w-3.5" />
          Account Security
        </div>
        <CardTitle className="text-3xl">Сменить пароль</CardTitle>
        <CardDescription>
          Обновите пароль администратора прямо из панели управления. Старый пароль обязателен для подтверждения.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Текущий пароль</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              placeholder="Введите текущий пароль"
              autoComplete="current-password"
              required
            />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Новый пароль</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="Минимум 8 символов"
                autoComplete="new-password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Подтверждение</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Повторите новый пароль"
                autoComplete="new-password"
                required
              />
            </div>
          </div>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          {state.message ? (
            <p className="inline-flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {state.message}
            </p>
          ) : null}
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Обновить пароль
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}