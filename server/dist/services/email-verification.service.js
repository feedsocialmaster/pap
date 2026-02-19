/**
 * Email Verification Service
 * Handles user email verification tokens and activation
 */
import { prisma } from '../prisma.js';
import crypto from 'crypto';
const TOKEN_EXPIRY_HOURS = 24;
/**
 * Generate a verification token for a user
 */
export async function generateVerificationToken(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + TOKEN_EXPIRY_HOURS);
    await prisma.user.update({
        where: { id: userId },
        data: {
            verificationToken: token,
            verificationTokenExpires: expires,
        },
    });
    return token;
}
/**
 * Verify email with token and activate user
 */
export async function verifyEmailToken(token) {
    const user = await prisma.user.findFirst({
        where: {
            verificationToken: token,
        },
    });
    if (!user) {
        return {
            success: false,
            message: 'Token de verificación inválido',
        };
    }
    // Check if token is expired
    if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
        return {
            success: false,
            message: 'El token de verificación ha expirado. Por favor solicita uno nuevo.',
        };
    }
    // Activate user and clear verification token
    await prisma.user.update({
        where: { id: user.id },
        data: {
            emailVerified: true,
            activo: true,
            verificationToken: null,
            verificationTokenExpires: null,
        },
    });
    return {
        success: true,
        message: 'Email verificado exitosamente. Tu cuenta ha sido activada.',
        userId: user.id,
    };
}
/**
 * Resend verification email
 */
export async function resendVerificationEmail(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new Error('Usuario no encontrado');
    }
    if (user.emailVerified) {
        throw new Error('El email ya está verificado');
    }
    return await generateVerificationToken(userId);
}
/**
 * Check if user account is active and verified
 */
export async function checkUserCanPurchase(userId) {
    console.log('[checkUserCanPurchase] Buscando usuario con ID:', userId);
    console.log('[checkUserCanPurchase] Tipo de ID:', typeof userId);
    console.log('[checkUserCanPurchase] Valor raw del ID:', JSON.stringify(userId));
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            activo: true,
            suspendido: true,
            emailVerified: true,
        },
    });
    console.log('[checkUserCanPurchase] Usuario encontrado:', user ? `${user.email} (activo: ${user.activo}, suspendido: ${user.suspendido})` : 'NO ENCONTRADO');
    if (!user) {
        // Log para ver todos los usuarios existentes (solo en desarrollo)
        if (process.env.NODE_ENV === 'development') {
            const allUsers = await prisma.user.findMany({
                select: { id: true, email: true, nombre: true, apellido: true },
                take: 10,
            });
            console.log('[checkUserCanPurchase] Usuarios existentes en BD:', allUsers);
        }
        return { canPurchase: false, reason: `Usuario no encontrado en la base de datos. ID buscado: ${userId}` };
    }
    if (user.suspendido) {
        return {
            canPurchase: false,
            reason: 'Tu cuenta ha sido suspendida. Contacta a soporte.',
        };
    }
    if (!user.activo) {
        return {
            canPurchase: false,
            reason: 'Tu cuenta está inactiva. Por favor verifica tu email o contacta a soporte.',
        };
    }
    // Allow purchases even if email is not verified (soft check)
    // Uncomment below to enforce email verification
    // if (!user.emailVerified) {
    //   return {
    //     canPurchase: false,
    //     reason: 'Por favor verifica tu email antes de realizar compras.',
    //   };
    // }
    return { canPurchase: true };
}
