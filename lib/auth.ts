import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTwoFactorToken } from "@/lib/two-factor";

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
        totpCode: { label: "Two-factor code", type: "text" },
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

        if (user.suspended) {
          throw new Error("This account has been suspended. Contact support for help.");
        }

        if (user.twoFactorEnabled && user.twoFactorSecret) {
          if (!credentials.totpCode) {
            throw new Error("2FA_REQUIRED");
          }
          const codeValid = await verifyTwoFactorToken(user.twoFactorSecret, credentials.totpCode);
          if (!codeValid) {
            throw new Error("Invalid two-factor code");
          }
        }

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
        if (dbUser.suspended) {
          throw new Error("This account has been suspended. Contact support for help.");
        }
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
