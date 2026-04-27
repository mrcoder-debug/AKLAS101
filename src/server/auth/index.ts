// Auth.js v5 instance. Import `auth`, `signIn`, `signOut` from here.
// This module is Node.js only — it adds the Prisma tokenVersion revocation
// check to the session callback. Never import this from middleware.ts.
import NextAuth from "next-auth";
import { authConfig } from "./config";
import { getSessionUserIfCurrent } from "@/services/auth.service";

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, token }) {
      const live = await getSessionUserIfCurrent(
        token.id as string,
        token.tokenVersion as number,
      );
      if (!live) throw new Error("SESSION_REVOKED");
      session.user = {
        id: live.id,
        email: live.email,
        name: live.name,
        role: live.role,
        isActive: live.isActive,
        tokenVersion: live.tokenVersion,
        emailVerified: null,
      };
      return session;
    },
  },
});
