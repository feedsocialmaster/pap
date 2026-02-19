import { Router } from 'express';
import pkg from '../../package.json' with { type: 'json' };
import { prisma } from '../prisma.js';

const router = Router();

router.get('/', async (_req, res) => {
  const startedAt = process.uptime();
  const now = new Date().toISOString();
  let db = 'down' as 'up' | 'down';
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = 'up';
  } catch (_e) {
    db = 'down';
  }

  res.json({
    ok: true,
    service: 'paso-a-paso-api',
    version: (pkg as any).version || '0.1.0',
    db,
    uptimeSeconds: Math.floor(startedAt),
    timestamp: now,
  });
});

export default router;
