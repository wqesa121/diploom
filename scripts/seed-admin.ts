import bcrypt from "bcryptjs";

import { connectToDatabase } from "@/lib/db";
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

  if (!email || !password) {
    throw new Error("Usage: npm run seed:admin -- --email admin@example.com --password StrongPass123! --name Admin");
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
    role: "admin",
  });

  console.log(`Created admin ${email}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
