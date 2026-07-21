import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret-for-dev-only",
  trustedOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    process.env.BETTER_AUTH_URL || "",
    process.env.NEXTAUTH_URL || "",
    process.env.NEXT_PUBLIC_APP_URL || ""
  ].filter(Boolean) as string[],
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password) => await bcrypt.hash(password, 10),
      verify: async ({ hash, password }) => await bcrypt.compare(password, hash),
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "CASHIER",
      },
      isActive: {
        type: "boolean",
        required: true,
        defaultValue: true,
      },
    },
  },
});
