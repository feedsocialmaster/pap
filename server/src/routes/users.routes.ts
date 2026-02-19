/**
 * User Management Controller
 * Handles user activation, deactivation, and email verification
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, requireCMSAuth } from '../middleware/auth.js';
import {
  verifyEmailToken,
  resendVerificationEmail,
  generateVerificationToken,
} from '../services/email-verification.service.js';
import { sendPasswordChangeEmail } from '../services/email.service.js';
import bcrypt from 'bcryptjs';
import type { AuthedRequest } from '../middleware/auth.js';

const router = Router();

/**
 * Verify email with token (public endpoint)
 * GET /api/users/verify-email?token=...
 */
router.get('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token de verificación requerido' });
    }

    const result = await verifyEmailToken(token);

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    return res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error verifying email:', error);
    return res.status(500).json({ error: 'Error al verificar email' });
  }
});

/**
 * Resend verification email
 * POST /api/users/resend-verification
 */
router.post('/resend-verification', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const token = await resendVerificationEmail(userId);

    // TODO: Send email with verification link
    const verificationLink = `${process.env.FRONTEND_URL}/verificar-email?token=${token}`;
    console.log('Verification link:', verificationLink);

    return res.json({
      success: true,
      message: 'Email de verificación enviado exitosamente',
      // In development, return the link
      ...(process.env.NODE_ENV === 'development' && { verificationLink }),
    });
  } catch (error: any) {
    console.error('Error resending verification:', error);
    return res.status(400).json({ error: error.message });
  }
});

/**
 * Update user address
 * PUT /api/users/:id/address
 */
router.put('/:id/address', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Users can only update their own address (unless CMS admin)
    if (id !== userId && req.user!.role !== 'ADMIN_CMS' && req.user!.role !== 'SUPER_SU') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { direccion } = req.body;

    if (!direccion) {
      return res.status(400).json({ error: 'Dirección requerida' });
    }

    // Validate address structure
    if (!direccion.calle || !direccion.ciudad || !direccion.provincia) {
      return res.status(400).json({
        error: 'La dirección debe incluir calle, ciudad y provincia',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        direccion: direccion,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        direccion: true,
        telefono: true,
      },
    });

    return res.json(updatedUser);
  } catch (error: any) {
    console.error('Error updating address:', error);
    return res.status(500).json({ error: 'Error al actualizar dirección' });
  }
});

/**
 * Update user WhatsApp
 * PATCH /api/users/:id/whatsapp
 */
router.patch('/:id/whatsapp', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Users can only update their own WhatsApp (unless CMS admin)
    if (id !== userId && req.user!.role !== 'ADMIN_CMS' && req.user!.role !== 'SUPER_SU') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { whatsapp } = req.body;

    // Validate WhatsApp (optional field, can be empty string to clear it)
    const whatsappValue = whatsapp && whatsapp.trim() !== '' ? whatsapp.trim() : null;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        whatsapp: whatsappValue,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        fechaNacimiento: true,
        telefono: true,
        whatsapp: true,
        direccion: true,
        role: true,
        activo: true,
        emailVerified: true,
        fechaRegistro: true,
      },
    });

    return res.json(updatedUser);
  } catch (error: any) {
    console.error('Error updating WhatsApp:', error);
    return res.status(500).json({ error: 'Error al actualizar WhatsApp' });
  }
});

/**
 * Update user Telefono
 * PATCH /api/users/:id/telefono
 */
router.patch('/:id/telefono', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Users can only update their own phone (unless CMS admin)
    if (id !== userId && req.user!.role !== 'ADMIN_CMS' && req.user!.role !== 'SUPER_SU') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { telefono } = req.body;

    // Validate telefono (optional field, can be empty string to clear it)
    const telefonoValue = telefono && telefono.trim() !== '' ? telefono.trim() : null;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        telefono: telefonoValue,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        fechaNacimiento: true,
        telefono: true,
        whatsapp: true,
        direccion: true,
        role: true,
        activo: true,
        emailVerified: true,
        fechaRegistro: true,
      },
    });

    return res.json(updatedUser);
  } catch (error: any) {
    console.error('Error updating telefono:', error);
    return res.status(500).json({ error: 'Error al actualizar teléfono' });
  }
});

/**
 * Toggle user activation (CMS only)
 * PATCH /api/users/:id/toggle-active
 */
router.patch('/:id/toggle-active', requireCMSAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    if (typeof activo !== 'boolean') {
      return res.status(400).json({ error: 'Campo "activo" debe ser booleano' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { activo: true, role: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Prevent deactivating admins or owner
    if (!activo && (user.role === 'ADMIN_CMS' || user.role === 'SUPER_SU')) {
      return res.status(403).json({
        error: 'No se puede desactivar usuarios administradores',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { activo },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        activo: true,
        role: true,
      },
    });

    // Create audit log
    await prisma.cMSAuditLog.create({
      data: {
        usuarioId: req.user!.id,
        accion: `USER_${activo ? 'ACTIVATED' : 'DEACTIVATED'}`,
        entidad: 'USER',
        entidadId: id,
        cambios: {
          previousStatus: user.activo,
          newStatus: activo,
        },
      },
    });

    return res.json(updatedUser);
  } catch (error: any) {
    console.error('Error toggling user activation:', error);
    return res.status(500).json({ error: 'Error al actualizar estado del usuario' });
  }
});

/**
 * Get user profile (authenticated)
 * GET /api/users/me
 */
router.get('/me', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        fechaNacimiento: true,
        telefono: true,
        whatsapp: true,
        direccion: true,
        role: true,
        activo: true,
        emailVerified: true,
        fechaRegistro: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json(user);
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

/**
 * Change user password
 * POST /api/users/:id/change-password
 */
router.post('/:id/change-password', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    console.log('🔐 [CHANGE PASSWORD] Iniciando cambio de contraseña');
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;
    console.log('🔐 [CHANGE PASSWORD] User ID from params:', id);
    console.log('🔐 [CHANGE PASSWORD] User ID from token:', userId);
    console.log('🔐 [CHANGE PASSWORD] User role from token:', userRole);

    // Check if it's an admin/superuser changing another user's password
    const isAdminChangingUserPassword = (id !== userId) && (userRole === 'ADMIN_CMS' || userRole === 'SUPER_SU');
    
    // Users can only change their own password (unless CMS admin)
    if (id !== userId && !isAdminChangingUserPassword) {
      console.log('🔐 [CHANGE PASSWORD] No autorizado');
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { currentPassword, newPassword } = req.body;
    console.log('🔐 [CHANGE PASSWORD] Request body received');

    // For admin changing another user's password, currentPassword is not required
    if (!isAdminChangingUserPassword && !currentPassword) {
      console.log('🔐 [CHANGE PASSWORD] Contraseña actual faltante');
      return res.status(400).json({ error: 'Contraseña actual es requerida' });
    }

    if (!newPassword) {
      console.log('🔐 [CHANGE PASSWORD] Nueva contraseña faltante');
      return res.status(400).json({ error: 'Nueva contraseña es requerida' });
    }

    if (newPassword.length < 6) {
      console.log('🔐 [CHANGE PASSWORD] Nueva contraseña muy corta');
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    console.log('🔐 [CHANGE PASSWORD] Buscando usuario en BD');
    // Get user with password and lastPasswordChange
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        passwordHash: true,
        lastPasswordChange: true,
        role: true,
      },
    });

    if (!user) {
      console.log('🔐 [CHANGE PASSWORD] Usuario no encontrado');
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    console.log('🔐 [CHANGE PASSWORD] Usuario encontrado:', user.email);

    // Check if client user can change password (once per month restriction)
    // This restriction applies only to clients changing their own password
    if (!isAdminChangingUserPassword && user.role === 'CLIENTA' && user.lastPasswordChange) {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      if (user.lastPasswordChange > oneMonthAgo) {
        const nextChangeDate = new Date(user.lastPasswordChange);
        nextChangeDate.setMonth(nextChangeDate.getMonth() + 1);
        const diasRestantes = Math.ceil((nextChangeDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        console.log('🔐 [CHANGE PASSWORD] Restricción de 1 mes activa. Próximo cambio:', nextChangeDate);
        return res.status(400).json({ 
          error: `Por razones de seguridad, solo puedes cambiar tu contraseña una vez al mes. Podrás cambiarla nuevamente en ${diasRestantes} día(s). Si necesitas cambiarla antes, contactanos y te la enviaremos por correo electrónico a tu casilla de correo registrada en la tienda web.`,
          nextChangeDate: nextChangeDate.toISOString(),
          diasRestantes
        });
      }
    }

    // Verify current password (only if user is changing their own password)
    if (!isAdminChangingUserPassword) {
      console.log('🔐 [CHANGE PASSWORD] Verificando contraseña actual');
      const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        console.log('🔐 [CHANGE PASSWORD] Contraseña actual incorrecta');
        return res.status(400).json({ error: 'Contraseña actual incorrecta' });
      }
    }

    console.log('🔐 [CHANGE PASSWORD] Hasheando nueva contraseña');
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    console.log('🔐 [CHANGE PASSWORD] Actualizando contraseña en BD');
    // Update password and lastPasswordChange
    await prisma.user.update({
      where: { id },
      data: {
        passwordHash: hashedPassword,
        lastPasswordChange: new Date(),
      },
    });

    console.log('🔐 [CHANGE PASSWORD] Contraseña actualizada, enviando email');
    // Send email notification (don't fail if email fails)
    try {
      await sendPasswordChangeEmail(user.email, `${user.nombre} ${user.apellido}`);
      console.log('🔐 [CHANGE PASSWORD] Email enviado exitosamente');
    } catch (emailError) {
      console.error('🔐 [CHANGE PASSWORD] Error enviando email (no crítico):', emailError);
    }

    console.log('🔐 [CHANGE PASSWORD] Proceso completado exitosamente');
    return res.json({
      success: true,
      message: 'Contraseña actualizada correctamente. Se ha enviado un email de confirmación.',
    });
  } catch (error: any) {
    console.error('🔐 [CHANGE PASSWORD] ❌ Error crítico:', error);
    console.error('🔐 [CHANGE PASSWORD] ❌ Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Error al cambiar contraseña',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
