// Auth.js v5 configuration.
// Credentials provider + JWT strategy + tokenVersion revocation.
// This file must NOT import anything that breaks in the Edge runtime (no Prisma,
// no bcrypt native). Those calls happen in the authorize() callback which runs
// only in the Node runtime.

import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "@/schemas/auth.schema";
import { verifyCredentials } from "@/services/auth.service";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: "ADMIN" | "INSTRUCTOR" | "STUDENT";
      isActive: boolean;
      tokenVersion: number;
      emailVerified?: Date | null;
    };
  }
  interface JWT {
    id: string;
    role: "ADMIN" | "INSTRUCTOR" | "STUDENT";
    isActive: boolean;
    tokenVersion: number;
  }
}

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        try {
          const user = await verifyCredentials(parsed.data.email, parsed.data.password);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
            tokenVersion: user.tokenVersion,
            // Required by AdapterUser; we don't use email verification.
            emailVerified: null,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On first sign-in, `user` is set; embed claims into the JWT.
      if (user) {
        token.id = user.id;
        token.role = (user as { role: "ADMIN" | "INSTRUCTOR" | "STUDENT" }).role;
        token.isActive = (user as { isActive: boolean }).isActive;
        token.tokenVersion = (user as { tokenVersion: number }).tokenVersion;
      }
      return token;
    },
    async session({ session, token }) {
      // Edge-safe: populate session from JWT claims only — no Prisma call here.
      // The tokenVersion DB revocation check is done in index.ts (Node.js only)
      // and in requireUserOrRedirect() for server components.
      session.user = {
        id: token.id as string,
        email: token.email ?? session.user.email,
        name: token.name ?? session.user.name,
        role: token.role as "ADMIN" | "INSTRUCTOR" | "STUDENT",
        isActive: token.isActive as boolean,
        tokenVersion: token.tokenVersion as number,
        emailVerified: null,
      };
      return session;
    },
  },
};
