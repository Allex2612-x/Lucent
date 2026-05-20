import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  PORT: z.string().default('4000'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Comma-separated list of allowed origins for CORS. Required in
  // production so the deployed frontend can call this API. Example:
  // FRONTEND_URL="https://faro.up.railway.app,https://app.faro.ro"
  FRONTEND_URL: z.string().optional(),
  // Optional OAuth credentials (the /auth/providers endpoint reports
  // whether they're configured at runtime so the login page hides
  // buttons for missing providers).
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),
  FACEBOOK_CALLBACK_URL: z.string().optional(),
  // Required for the receipt OCR endpoint. Without it, /scan-receipt
  // returns a 500 — the endpoint surfaces the error.
  GEMINI_API_KEY: z.string().optional(),
  // Required to actually send the password-reset email. Without it,
  // the link is only logged to the server console.
  RESEND_API_KEY: z.string().optional(),
  // Sender address for transactional email. Default `onboarding@resend.dev`
  // works without DNS setup but emails come from that domain.
  RESEND_FROM: z.string().optional(),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error("❌ Invalid environment variables:", parseResult.error.format());
  process.exit(1);
}

export const env = parseResult.data;

export const isProduction = env.NODE_ENV === 'production';
