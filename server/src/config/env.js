import { z } from 'zod';

const bool = z
  .enum(['true', 'false'])
  .default('false')
  .transform((v) => v === 'true');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z
    .string()
    .regex(/^\d+$/, 'must be a number')
    .default('5050')
    .transform(Number)
    .pipe(z.number().int().min(1).max(65535)),
  MONGODB_URI: z
    .string({ error: 'is required' })
    .regex(/^mongodb(\+srv)?:\/\/.+/, 'must be a mongodb:// or mongodb+srv:// URL'),
  MONGODB_URI_TEST: z.string().optional(),
  JWT_SECRET: z
    .string({ error: 'is required' })
    .min(32, 'must be at least 32 characters (generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))")'),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]?$/, 'must look like 7d, 12h, 30m or a number of seconds')
    .default('7d'),
  COOKIE_SECURE: bool,
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  SEED_ADMIN_EMAIL: z.string().optional(),
  SEED_ADMIN_PASSWORD: z.string().optional(),
  SEED_ADMIN_NAME: z.string().default('Store Admin'),
  SEED_ADMIN_RESET: bool,
  WOO_API_URL: z.string().default('https://goldstarshoes.com/wp-json/wc/store/v1/products'),
});

const UNIT_MS = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };

/** "7d" -> 604800000. A bare number means seconds (same as jsonwebtoken). */
export function durationToMs(value) {
  const m = /^(\d+)([smhd]?)$/.exec(value);
  return Number(m[1]) * UNIT_MS[m[2] || 's'];
}

/** Pure parser (throws ZodError). Used by tests and by loadEnv. */
export function parseEnv(source) {
  const parsed = schema.parse(source);
  return {
    ...parsed,
    CLIENT_ORIGINS: parsed.CLIENT_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean),
    COOKIE_MAX_AGE_MS: durationToMs(parsed.JWT_EXPIRES_IN),
    isProd: parsed.NODE_ENV === 'production',
    isDev: parsed.NODE_ENV === 'development',
    isTest: parsed.NODE_ENV === 'test',
  };
}

export function formatEnvError(err) {
  const lines = err.issues.map((i) => `  - ${i.path.join('.') || '(env)'}: ${i.message}`);
  return `Invalid environment configuration. Fix server/.env (see server/.env.example):\n${lines.join('\n')}`;
}

/** The seed needs an admin account on top of the base config. */
export function requireSeedEnv(env) {
  const problems = [];
  if (!env.SEED_ADMIN_EMAIL || !z.email().safeParse(env.SEED_ADMIN_EMAIL).success) {
    problems.push('SEED_ADMIN_EMAIL must be set to a valid email address');
  }
  if (!env.SEED_ADMIN_PASSWORD || env.SEED_ADMIN_PASSWORD.length < 12) {
    problems.push('SEED_ADMIN_PASSWORD must be set to at least 12 characters');
  }
  if (problems.length) {
    throw new Error(`Seed configuration problem. Fix server/.env:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
  }
}

function loadEnv() {
  try {
    return parseEnv(process.env);
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error(formatEnvError(err));
      process.exit(1);
    }
    throw err;
  }
}

export const env = loadEnv();
