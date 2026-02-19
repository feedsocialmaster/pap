import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../prisma.js';
import { env } from '../config/env.js';
import type { Role } from '../middleware/auth.js';
import { sendPasswordResetEmail, sendUsernameRecoveryEmail } from './email.service.js';

const isProd = process.env.NODE_ENV === 'production';

export async function registerUser(params: {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  username?: string;
  fechaNacimiento: Date;
  telefono?: string;
  whatsapp?: string;
  direccion?: any;
  role?: Role;
}) {
  const existing = await prisma.user.findUnique({ where: { email: params.email } });
  if (existing) throw new Error('Email ya registrado');

  const passwordHash = await bcrypt.hash(params.password, 10);
  
  const user = await prisma.user.create({
    data: {
      email: params.email,
      username: params.username ?? null,
      passwordHash,
      nombre: params.nombre,
      apellido: params.apellido,
      fechaNacimiento: params.fechaNacimiento,
      telefono: params.telefono || null,
      whatsapp: params.whatsapp || null,
      direccion: params.direccion ?? null,
      role: params.role ?? 'CLIENTA',
    },
  });
  
  return user;
}

export async function loginUser(emailOrUsername: string, password: string) {
  if (!isProd) console.log('🔍 Buscando usuario por:', emailOrUsername);
  
  // Buscar usuario por email o username
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: emailOrUsername },
        { username: emailOrUsername }
      ]
    }
  });
  
  if (!user) {
    if (!isProd) console.log('❌ Usuario no encontrado');
    throw new Error('Credenciales inválidas');
  }
  
  if (!isProd) console.log('✅ Usuario encontrado:', { id: user.id, role: user.role });
  
  const ok = await bcrypt.compare(password, user.passwordHash);
  
  if (!ok) {
    throw new Error('Credenciales inválidas');
  }
  
  const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, env.JWT_SECRET, { expiresIn: '7d' });
  if (!isProd) console.log('🎟️ Token JWT generado');
  
  return { user, token };
}

/**
 * Solicitar recuperación de contraseña
 * Genera un token y envía email con enlace para resetear
 */
export async function requestPasswordReset(emailOrUsername: string): Promise<{ success: boolean; message: string }> {
  // Buscar usuario por email o username
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: emailOrUsername },
        { username: emailOrUsername }
      ]
    }
  });
  
  // Por seguridad, siempre mostramos el mismo mensaje
  // aunque el usuario no exista
  if (!user) {
    console.log('⚠️ [PASSWORD RESET] Usuario no encontrado:', emailOrUsername);
    return { 
      success: true, 
      message: 'Si el email/usuario existe, recibirás un correo con instrucciones.' 
    };
  }

  // Generar token de reset
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  // Guardar token en la base de datos
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    }
  });

  // Enviar email
  const emailSent = await sendPasswordResetEmail(
    user.email,
    user.nombre,
    resetToken
  );

  if (!emailSent) {
    console.error('❌ [PASSWORD RESET] Error enviando email a:', user.email);
  } else {
    console.log('✅ [PASSWORD RESET] Email enviado a:', user.email);
  }

  return { 
    success: true, 
    message: 'Si el email/usuario existe, recibirás un correo con instrucciones.' 
  };
}

/**
 * Resetear contraseña con token
 */
export async function resetPasswordWithToken(
  token: string, 
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  // Buscar usuario con token válido
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: {
        gt: new Date()
      }
    }
  });

  if (!user) {
    return { 
      success: false, 
      message: 'El enlace ha expirado o es inválido. Por favor, solicitá uno nuevo.' 
    };
  }

  // Hash de la nueva contraseña
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Actualizar contraseña y limpiar token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
      lastPasswordChange: new Date(),
    }
  });

  console.log('✅ [PASSWORD RESET] Contraseña actualizada para:', user.email);

  return { 
    success: true, 
    message: 'Tu contraseña ha sido actualizada exitosamente.' 
  };
}

/**
 * Verificar si un token de reset es válido
 */
export async function verifyResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: {
        gt: new Date()
      }
    },
    select: {
      email: true
    }
  });

  if (!user) {
    return { valid: false };
  }

  return { valid: true, email: user.email };
}

/**
 * Solicitar recuperación de nombre de usuario
 * Envía email con el username asociado al correo
 */
export async function requestUsernameRecovery(email: string): Promise<{ success: boolean; message: string }> {
  // Buscar usuario por email
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  // Por seguridad, siempre mostramos el mismo mensaje
  if (!user) {
    console.log('⚠️ [USERNAME RECOVERY] Email no encontrado:', email);
    return { 
      success: true, 
      message: 'Si el email está registrado, recibirás un correo con tu nombre de usuario.' 
    };
  }

  // Si el usuario no tiene username, usar el email
  const usernameToSend = user.username || user.email;

  // Enviar email
  const emailSent = await sendUsernameRecoveryEmail(
    user.email,
    user.nombre,
    usernameToSend
  );

  if (!emailSent) {
    console.error('❌ [USERNAME RECOVERY] Error enviando email a:', user.email);
  } else {
    console.log('✅ [USERNAME RECOVERY] Email enviado a:', user.email);
  }

  return { 
    success: true, 
    message: 'Si el email está registrado, recibirás un correo con tu nombre de usuario.' 
  };
}
