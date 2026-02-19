import * as Sentry from '@sentry/node';
import { env } from './config/env.js';

export function initSentry() {
  if (!env.SENTRY_DSN) return;
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: 0.0, // keep 0 by default; increase for performance tracing in staging
  });
}

export default Sentry;
