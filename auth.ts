import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";

import clientPromise from "@/lib/mongodb-client";
import { connectToDatabase } from "@/lib/db";
import { getAuthEnv } from "@/lib/env";
import { loginSchema } from "@/lib/validations";
import { User } from "@/models/User";

const env = getAuthEnv();

type AuthUserRecord = {
  _id: unknown;
  name: string;
  email: string;
  passwordHash: string;
  role: "admin" | "editor";
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise) as Adapter,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  secret: env.AUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        await connectToDatabase();
        const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).lean<AuthUserRecord | null>();

        if (!user) {
          return null;
        }

        const matches = await bcrypt.compare(parsed.data.password, user.passwordHash);

        if (!matches) {
          return null;
        }

        return {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    authorized({ auth: session, request: { nextUrl } }) {
      if (nextUrl.pathname.startsWith("/admin")) {
        return !!session?.user;
      }

      return true;
    },
    jwt({ token, user }) {
      if (user && "role" in user) {
        token.role = user.role as "admin" | "editor";
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as "admin" | "editor" | undefined) ?? "editor";
      }

      return session;
    },
  },
});
