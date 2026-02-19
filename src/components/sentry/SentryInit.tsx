"use client";
import { useEffect } from 'react';
import * as Sentry from '@sentry/browser';

export default function SentryInit() {
  useEffect(() => {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) return;
    if ((window as any).__SENTRY_INITIALIZED) return;
    Sentry.init({ dsn, environment: process.env.NODE_ENV });
    (window as any).__SENTRY_INITIALIZED = true;
  }, []);
  return null;
}
