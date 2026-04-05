import "dotenv/config";
import bcrypt from "bcryptjs";

import { connectToDatabase } from "@/lib/db";
import type { UserRole } from "@/lib/permissions";
import { User } from "@/models/User";

async function main() {
  const argv = process.argv.slice(2);
  const args = new Map<string, string>(
    argv.map((entry: string, index: number, list: string[]) => {
      if (!entry.startsWith("--")) {
        return ["", ""];
      }

      return [entry.replace(/^--/, ""), list[index + 1] ?? ""];
    }),
  );

  const email = args.get("email") ?? "";
  const password = args.get("password") ?? "";
  const name = args.get("name") ?? "Admin";
  const role = (args.get("role") ?? "admin") as UserRole;

  if (!email || !password) {
    throw new Error("Usage: npm run seed:admin -- --email admin@example.com --password StrongPass123! --name Admin --role admin");
  }

  if (!["admin", "editor", "reviewer"].includes(role)) {
    throw new Error("Role must be one of: admin, editor, reviewer.");
  }

  await connectToDatabase();

  const existing = await User.findOne({ email: email.toLowerCase() }).lean();
  if (existing) {
    throw new Error("Admin with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role,
  });

  console.log(`Created ${role} ${email}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
