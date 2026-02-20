import { Pool } from "pg";
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import argon2 from "argon2";
import { sendEmail } from "../external/email.service";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  plugins: [organization()],
  advanced: { database: { generateId: false } },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "Reset your password",
        content: `
        <h1>Reset your password</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${url}">${url}</a>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't request this, you can ignore this email.</p>
      `,
      });
    },
    password: {
      hash: async (password) => {
        return argon2.hash(password);
      },
      verify: async ({ hash, password }) => {
        return argon2.verify(hash, password);
      },
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "Verify your email address",
        content: `
        <h1>Verify your email</h1>
        <p>Click the link below to verify your email address:</p>
        <a href="${url}">${url}</a>
        <p>This link will expire in 24 hours.</p>
      `,
      });
    },
  },
});
