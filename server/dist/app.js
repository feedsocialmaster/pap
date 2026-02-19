import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';
import Sentry from './sentry.js';
import { raw } from 'express';
import { env } from './config/env.js';
import errorHandler from './middleware/error.js';
const app = express();
const isProd = process.env.NODE_ENV === 'production';
const transport = isProd
    ? pino.transport({
        targets: [
            {
                target: 'pino/file',
                options: { destination: './logs/app.log', mkdir: true },
                level: 'info',
            },
        ],
    })
    : pino.transport({ targets: [{ target: 'pino-pretty', options: { colorize: true }, level: 'debug' }] });
const logger = pino({
    level: isProd ? 'info' : 'debug',
    redact: {
        paths: [
            'req.headers.authorization',
            'req.body.password',
            'req.body.email',
            'response.headers["set-cookie"]',
        ],
        remove: true,
    },
}, transport);
app.use(helmet());
// CORS: abierto en desarrollo, restringido en producción a APP_URL
const allowedOrigins = new Set(env.APP_URL.split(',').map(url => url.trim()));
const allowedPatterns = [/\.netlify\.app$/, /\.railway\.app$/];
app.use(cors({
    origin: (origin, callback) => {
        if (!isProd)
            return callback(null, true);
        // Permitir llamadas server-to-server o curl (sin origin)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.has(origin))
            return callback(null, true);
        // Permitir subdominios dinámicos de Netlify y Railway
        if (allowedPatterns.some(pattern => pattern.test(origin)))
            return callback(null, true);
        // permitir subrutas del mismo host
        for (const o of allowedOrigins) {
            if (origin === o || origin.startsWith(o.replace(/\/$/, '')))
                return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));
// Webhook de MP debe recibir RAW body antes de json/urlencoded
app.use('/api/payments/webhook', raw({ type: '*/*' }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
const pinoMw = pinoHttp({
    logger,
    genReqId: (req) => {
        // simple request id, non-crypto
        return req.headers['x-request-id'] || Math.random().toString(36).slice(2);
    },
});
app.use(pinoMw);
// Basic rate limiting - Desactivado en desarrollo, configurado generosamente en producción
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: isProd ? 500 : 10000, // 500 en producción, 10000 en desarrollo
    skip: (req) => {
        // Saltar rate limiting en desarrollo para endpoints de CMS
        if (!isProd && req.path.startsWith('/api/cms')) {
            return true;
        }
        return false;
    },
    message: { success: false, error: 'Demasiadas peticiones, por favor intenta más tarde.' }
});
app.use(limiter);
// serve uploaded images (local disk)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
}, express.static(path.join(__dirname, 'uploads')));
app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'paso-a-paso-api' });
});
// Attach Sentry request handler if configured
if (Sentry?.getCurrentHub) {
    try {
        // @ts-ignore
        app.use(Sentry.Handlers.requestHandler());
    }
    catch (e) {
        // ignore
    }
}
app.use('/api', routes);
// Sentry error handler (last middleware)
if (Sentry?.getCurrentHub) {
    try {
        // @ts-ignore
        app.use(Sentry.Handlers.errorHandler());
    }
    catch (e) {
        // ignore
    }
}
// Global error handler (after Sentry)
app.use(errorHandler);
export default app;
