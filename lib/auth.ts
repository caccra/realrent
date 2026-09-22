import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";
import { checkRateLimit } from "@/lib/rate-limit";

export const authOptions: AuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Phone",
      credentials: {
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) return null;

        const normalized = normalizePhone(credentials.phone);
        if (!normalized) return null;

        const allowed = await checkRateLimit(`login:${normalized}`, 10, 15);
        if (!allowed) {
          throw new Error("Too many login attempts. Try again in a few minutes.");
        }

        const user = await prisma.user.findUnique({
          where: { phone: normalized },
        });
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      if (account?.provider === "google" && user?.email) {
        const dbUser = await prisma.user.upsert({
          where: { email: user.email },
          update: {},
          create: {
            name: user.name ?? "New user",
            email: user.email,
          },
        });
        token.id = dbUser.id;
        token.role = dbUser.role;
        token.phone = dbUser.phone;
        return token;
      }

      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
      }

      if (trigger === "update" && token.id) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.id } });
        if (dbUser) {
          token.role = dbUser.role;
          token.phone = dbUser.phone;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.phone = token.phone;
      }
      return session;
    },
  },
};
