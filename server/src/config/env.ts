import 'dotenv/config';

function requireEnv(name: string, def?: string) {
  const v = process.env[name] ?? def;
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

const isProd = process.env.NODE_ENV === 'production';

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 3001),
  DATABASE_URL: requireEnv('DATABASE_URL', ''),
  JWT_SECRET: requireEnv('JWT_SECRET', isProd ? undefined : 'dev-only-secret-not-for-production'),
  APP_URL: requireEnv('APP_URL', 'http://localhost:3000'),
  API_URL: requireEnv('API_URL', 'http://localhost:3001'),
  MP_ACCESS_TOKEN: requireEnv('MP_ACCESS_TOKEN', ''),
  MP_WEBHOOK_SECRET: process.env.MP_WEBHOOK_SECRET ?? '',
  SENTRY_DSN: process.env.SENTRY_DSN ?? '',
  
  // Email configuration (opcional en desarrollo)
  EMAIL_HOST: process.env.EMAIL_HOST ?? '',
  EMAIL_PORT: Number(process.env.EMAIL_PORT ?? 587),
  EMAIL_USER: process.env.EMAIL_USER ?? '',
  EMAIL_PASS: process.env.EMAIL_PASS ?? '',
  EMAIL_FROM: process.env.EMAIL_FROM ?? 'Paso a Paso Shoes <noreply@pasoapaso.com>',
  CONTACT_EMAIL: process.env.CONTACT_EMAIL ?? process.env.EMAIL_USER ?? '',
};
