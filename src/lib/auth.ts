import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { findUserByEmail } from "@/repositories/auth";
import { findUserByPhone } from "@/repositories/auth/users";
import { recordLoginAttempt, writeActivityLog } from "@/repositories/enterprise/activity";
import { verifyOtp } from "./auth/otp";
import { verifyPassword } from "./auth/password";
import type { AppRole } from "@/types/auth";

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL ?? "bizflow@admin.io";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" },
        channel: { label: "Channel", type: "text" },
        phone: { label: "Phone", type: "text" },
      },
      async authorize(credentials) {
        const otp = credentials?.otp?.toString().trim();
        const channel = credentials?.channel?.toString() === "sms" ? "sms" : "email";
        const email = credentials?.email?.toString().toLowerCase().trim();
        const phone = credentials?.phone?.toString().replace(/\s/g, "");
        const password = credentials?.password?.toString();

        if (otp) {
          const identifier = channel === "sms" ? phone : email;
          if (!identifier) return null;

          const verified = await verifyOtp(channel, identifier, "login", otp);
          if (!verified.ok) return null;

          const user = channel === "sms" ? await findUserByPhone(identifier) : await findUserByEmail(identifier);
          if (!user || user.status !== "ACTIVE") return null;

          await recordLoginAttempt({ userId: user.id, tenantId: user.tenantId, success: true });
          await writeActivityLog({
            tenantId: user.tenantId,
            userId: user.id,
            module: "auth",
            action: "login_otp",
            entityType: "user",
            entityId: user.id,
          });

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: (user.roleName ?? "USER") as AppRole,
            tenantId: user.tenantId,
            tenantName: user.tenantName,
            businessType: user.businessType,
          };
        }

        if (!email || !password) return null;

        const user = await findUserByEmail(email);
        if (!user?.passwordHash || user.status !== "ACTIVE") {
          if (user) {
            await recordLoginAttempt({ userId: user.id, tenantId: user.tenantId, success: false, failureReason: "inactive_or_no_password" });
          }
          return null;
        }

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
          await recordLoginAttempt({ userId: user.id, tenantId: user.tenantId, success: false, failureReason: "invalid_password" });
          return null;
        }

        await recordLoginAttempt({ userId: user.id, tenantId: user.tenantId, success: true });
        await writeActivityLog({
          tenantId: user.tenantId,
          userId: user.id,
          module: "auth",
          action: "login",
          entityType: "user",
          entityId: user.id,
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: (user.roleName ?? "USER") as AppRole,
          tenantId: user.tenantId,
          tenantName: user.tenantName,
          businessType: user.businessType,
        };
      },
    }),
  ],
});

export { SUPER_ADMIN_EMAIL };
