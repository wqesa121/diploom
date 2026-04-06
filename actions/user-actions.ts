"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { logActivity } from "@/lib/activity";
import { connectToDatabase } from "@/lib/db";
import { DEFAULT_ROLE, getDefaultAdminPath, hasPermission } from "@/lib/permissions";
import { createUserSchema, updateUserRoleSchema } from "@/lib/validations";
import { User } from "@/models/User";

const USERS_PAGE_PATH = "/admin/users";

function buildUsersRedirect(searchParams: Record<string, string>) {
  const params = new URLSearchParams(searchParams);
  return `${USERS_PAGE_PATH}?${params.toString()}`;
}

async function requireAdminAccess() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const role = session.user.role ?? DEFAULT_ROLE;

  if (!hasPermission(role, "users:manage")) {
    redirect(getDefaultAdminPath(role));
  }

  return session;
}

export async function createUserAction(formData: FormData) {
  const session = await requireAdminAccess();
  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    redirect(buildUsersRedirect({ error: parsed.error.issues[0]?.message || "Не удалось создать пользователя." }));
  }

  await connectToDatabase();
  const normalizedEmail = parsed.data.email.toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail }).lean();

  if (existing) {
    redirect(buildUsersRedirect({ error: "Пользователь с таким email уже существует." }));
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await User.create({
    name: parsed.data.name,
    email: normalizedEmail,
    passwordHash,
    role: parsed.data.role,
  });

  await logActivity({
    actorId: session.user.id,
    actorName: session.user.name,
    actorEmail: session.user.email,
    entityType: "user",
    entityId: String(user._id),
    entityTitle: normalizedEmail,
    action: "created",
    details: `Created ${parsed.data.role} account ${normalizedEmail}.`,
  });

  redirect(buildUsersRedirect({ success: `Пользователь ${normalizedEmail} создан.` }));
}

export async function updateUserRoleAction(userId: string, formData: FormData) {
  const session = await requireAdminAccess();
  const parsed = updateUserRoleSchema.safeParse({
    role: formData.get("role"),
  });

  if (!parsed.success) {
    redirect(buildUsersRedirect({ error: parsed.error.issues[0]?.message || "Не удалось обновить роль." }));
  }

  await connectToDatabase();
  const user = await User.findById(userId).select("email role name");

  if (!user) {
    redirect(buildUsersRedirect({ error: "Пользователь не найден." }));
  }

  if (user.role === "admin" && parsed.data.role !== "admin") {
    const adminCount = await User.countDocuments({ role: "admin" });

    if (adminCount <= 1) {
      redirect(buildUsersRedirect({ error: "Нельзя убрать роль у последнего администратора." }));
    }
  }

  user.role = parsed.data.role;
  await user.save();

  await logActivity({
    actorId: session.user.id,
    actorName: session.user.name,
    actorEmail: session.user.email,
    entityType: "user",
    entityId: String(user._id),
    entityTitle: user.email,
    action: "updated",
    details: `Changed role to ${parsed.data.role}.`,
  });

  redirect(buildUsersRedirect({ success: `Роль для ${user.email} обновлена.` }));
}