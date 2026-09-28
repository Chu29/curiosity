import { z } from 'zod';

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  POSTGRES_PORT: z.coerce.number().default(5434),
  REDIS_PORT: z.coerce.number().default(6379),

  DATABASE_URL: z.string({ required_error: 'DATABASE_URL is required' }).min(1, 'DATABASE_URL cannot be empty'),
  REDIS_URL: z.string({ required_error: 'REDIS_URL is required' }).min(1, 'REDIS_URL cannot be empty'),

  JWT_ACCESS_SECRET: z
    .string({ required_error: 'JWT_ACCESS_SECRET is required' })
    .min(16, 'JWT_ACCESS_SECRET must be at least 16 characters long'),
  JWT_REFRESH_SECRET: z
    .string({ required_error: 'JWT_REFRESH_SECRET is required' })
    .min(16, 'JWT_REFRESH_SECRET must be at least 16 characters long'),

  LLM_PROVIDER: z.enum(['gemini', 'openai', 'mock']).default('gemini'),
  LLM_API_KEY: z.string({ required_error: 'LLM_API_KEY is required' }).min(1, 'LLM_API_KEY cannot be empty'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),

  EMBEDDING_API_KEY: z.string({ required_error: 'EMBEDDING_API_KEY is required' }).min(1, 'EMBEDDING_API_KEY cannot be empty'),
  TRANSCRIPTION_API_KEY: z.string({ required_error: 'TRANSCRIPTION_API_KEY is required' }).min(1, 'TRANSCRIPTION_API_KEY cannot be empty'),

  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_BUCKET: z.string({ required_error: 'STORAGE_BUCKET is required' }).min(1, 'STORAGE_BUCKET cannot be empty'),
  STORAGE_ACCESS_KEY: z.string({ required_error: 'STORAGE_ACCESS_KEY is required' }).min(1, 'STORAGE_ACCESS_KEY cannot be empty'),
  STORAGE_SECRET_KEY: z.string({ required_error: 'STORAGE_SECRET_KEY is required' }).min(1, 'STORAGE_SECRET_KEY cannot be empty'),
});

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(rawEnv: Record<string, unknown> = process.env): Env {
  const result = EnvSchema.safeParse(rawEnv);

  if (!result.success) {
    const errorDetails = result.error.errors
      .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');

    const errorMessage = `[Config Error] Invalid or missing required environment variables:\n${errorDetails}\nHalting application startup.`;
    throw new Error(errorMessage);
  }

  return result.data;
}
