"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

import { auth, signIn } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import { changePasswordSchema, loginSchema } from "@/lib/validations";
import { User } from "@/models/User";

export type AuthActionState = {
  success: boolean;
  error?: string;
  message?: string;
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

export async function changePasswordAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const session = await auth();

  if (!session?.user?.email) {
    return {
      success: false,
      error: "Сессия недействительна. Войдите снова.",
    };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Проверьте введенные данные.",
    };
  }

  await connectToDatabase();
  const user = await User.findOne({ email: session.user.email.toLowerCase() }).select("passwordHash");

  if (!user) {
    return {
      success: false,
      error: "Пользователь не найден.",
    };
  }

  const matches = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);

  if (!matches) {
    return {
      success: false,
      error: "Текущий пароль указан неверно.",
    };
  }

  user.passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await user.save();

  return {
    success: true,
    message: "Пароль обновлён.",
  };
}
