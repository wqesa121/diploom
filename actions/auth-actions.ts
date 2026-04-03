"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/auth";
import { loginSchema } from "@/lib/validations";

export type AuthActionState = {
  success: boolean;
  error?: string;
};

export async function loginAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Проверьте введенные данные.",
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false,
        error: "Неверный email или пароль.",
      };
    }

    throw error;
  }

  return { success: true };
}
