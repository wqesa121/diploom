import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/admin");
  }

  return (
    <main className="container flex min-h-screen items-center justify-center py-16">
      <LoginForm />
    </main>
  );
}
