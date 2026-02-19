import { Request, Response } from 'express';
import { z } from 'zod';
import { 
  loginUser, 
  registerUser, 
  requestPasswordReset, 
  requestUsernameRecovery,
  resetPasswordWithToken,
  verifyResetToken
} from '../services/auth.service.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  username: z.string().min(3).optional(),
  fechaNacimiento: z.string().transform((s) => new Date(s)),
  telefono: z.string().transform(val => val || undefined).optional(),
  whatsapp: z.string().transform(val => val || undefined).optional(),
  direccion: z.any().optional(),
  suscribirBoletin: z.boolean().optional(),
});

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email o nombre de usuario requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export async function register(req: Request, res: Response) {
  try {
    const body = registerSchema.parse(req.body);
    
    const user = await registerUser(body);
    return res.status(201).json({ success: true, data: { id: user.id, email: user.email } });
  } catch (e: any) {
    console.error('Error en registro:', e);
    return res.status(400).json({ success: false, error: e.message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { emailOrUsername, password } = loginSchema.parse(req.body);
    console.log('Login attempt:', { emailOrUsername, passwordLength: password.length });
    const { user, token } = await loginUser(emailOrUsername, password);
    return res.json({ success: true, data: { token, user: {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      fechaNacimiento: user.fechaNacimiento,
      direccion: user.direccion,
      email: user.email,
      telefono: user.telefono ?? undefined,
      whatsapp: user.whatsapp ?? undefined,
      fechaRegistro: user.fechaRegistro,
      activo: user.activo,
      role: user.role,
    }}});
  } catch (e: any) {
    console.error('Login error:', e.message);
    return res.status(400).json({ success: false, error: e.message });
  }
}

export async function recuperarPassword(req: Request, res: Response) {
  try {
    const { emailOrUsername } = req.body;
    const result = await requestPasswordReset(emailOrUsername);
    return res.json({ success: result.success, message: result.message });
  } catch (e: any) {
    console.error('Error en recuperación de contraseña:', e);
    return res.status(500).json({ 
      success: false, 
      error: 'Error al procesar la solicitud. Por favor, intentá nuevamente.' 
    });
  }
}

export async function recuperarUsername(req: Request, res: Response) {
  try {
    const { email } = req.body;
    const result = await requestUsernameRecovery(email);
    return res.json({ success: result.success, message: result.message });
  } catch (e: any) {
    console.error('Error en recuperación de username:', e);
    return res.status(500).json({ 
      success: false, 
      error: 'Error al procesar la solicitud. Por favor, intentá nuevamente.' 
    });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, password } = req.body;
    const result = await resetPasswordWithToken(token, password);
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.message });
    }
    
    return res.json({ success: true, message: result.message });
  } catch (e: any) {
    console.error('Error al resetear contraseña:', e);
    return res.status(500).json({ 
      success: false, 
      error: 'Error al procesar la solicitud. Por favor, intentá nuevamente.' 
    });
  }
}

export async function verifyResetTokenController(req: Request, res: Response) {
  try {
    const { token } = req.body;
    const result = await verifyResetToken(token);
    return res.json({ success: true, data: result });
  } catch (e: any) {
    console.error('Error al verificar token:', e);
    return res.status(500).json({ 
      success: false, 
      error: 'Error al verificar el token.' 
    });
  }
}
