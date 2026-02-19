import { Router } from 'express';
import { login, register, recuperarPassword, recuperarUsername, resetPassword, verifyResetTokenController } from '../controllers/auth.controller.js';
import { loginLimiter } from '../middleware/rate-limit.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';
const router = Router();
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    nombre: z.string().min(1),
    apellido: z.string().min(1),
    username: z.string().min(3).optional(),
    fechaNacimiento: z.string(), // se transforma en el controller
    telefono: z.string().optional(),
    direccion: z.any().optional(),
    suscribirBoletin: z.boolean().optional(),
});
const loginSchema = z.object({
    emailOrUsername: z.string().min(1, 'Email o nombre de usuario requerido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});
const recuperarPasswordSchema = z.object({
    emailOrUsername: z.string().min(1, 'Email o nombre de usuario requerido'),
});
const recuperarUsernameSchema = z.object({
    email: z.string().email('Email inválido'),
});
const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token requerido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});
const verifyTokenSchema = z.object({
    token: z.string().min(1, 'Token requerido'),
});
router.post('/register', validate({ body: registerSchema }), register);
router.post('/login', loginLimiter, validate({ body: loginSchema }), login);
router.post('/recuperar-password', validate({ body: recuperarPasswordSchema }), recuperarPassword);
router.post('/recuperar-username', validate({ body: recuperarUsernameSchema }), recuperarUsername);
router.post('/reset-password', validate({ body: resetPasswordSchema }), resetPassword);
router.post('/verify-reset-token', validate({ body: verifyTokenSchema }), verifyResetTokenController);
export default router;
