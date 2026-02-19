/**
 * Contact Routes
 * Maneja el envío de formularios de contacto
 */
import { Router } from 'express';
import { z } from 'zod';
import { sendContactFormEmail, sendContactConfirmationEmail } from '../services/email.service.js';
import { optionalAuth } from '../middleware/auth.js';
const router = Router();
// Schema de validación para el formulario de contacto
const contactSchema = z.object({
    nombre: z.string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres'),
    email: z.string()
        .email('Ingresá un email válido'),
    telefono: z.string()
        .min(10, 'Ingresá un teléfono válido')
        .max(20, 'El teléfono no puede exceder 20 caracteres'),
    asunto: z.string()
        .min(5, 'El asunto debe tener al menos 5 caracteres')
        .max(150, 'El asunto no puede exceder 150 caracteres'),
    mensaje: z.string()
        .min(20, 'El mensaje debe tener al menos 20 caracteres')
        .max(5000, 'El mensaje no puede exceder 5000 caracteres'),
});
/**
 * POST /api/contact
 * Envía un formulario de contacto
 * - Usuarios logueados: se incluye información del usuario
 * - Usuarios no logueados: se envía como visitante
 */
router.post('/', optionalAuth, async (req, res) => {
    try {
        // Validar datos del formulario
        const validationResult = contactSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                success: false,
                message: 'Datos de formulario inválidos',
                errors: validationResult.error.errors.map(e => ({
                    field: e.path.join('.'),
                    message: e.message,
                })),
            });
            return;
        }
        const formData = validationResult.data;
        // Obtener información del usuario si está logueado
        const user = req.user;
        const contactData = {
            ...formData,
            userId: user?.id || null,
            userName: user?.nombre || user?.username || null,
        };
        console.log(`📧 [CONTACT] Procesando mensaje de contacto de: ${formData.email}`);
        console.log(`   Usuario logueado: ${user ? 'Sí' : 'No'}`);
        // Enviar email al negocio
        const emailSent = await sendContactFormEmail(contactData);
        if (!emailSent) {
            console.error('❌ [CONTACT] Error al enviar email de contacto');
            res.status(500).json({
                success: false,
                message: 'Error al enviar el mensaje. Por favor, intenta nuevamente.',
            });
            return;
        }
        // Enviar confirmación al usuario (opcional, no bloqueante)
        sendContactConfirmationEmail(contactData).catch(err => {
            console.warn('⚠️ [CONTACT] No se pudo enviar email de confirmación:', err);
        });
        console.log('✅ [CONTACT] Mensaje de contacto enviado exitosamente');
        res.status(200).json({
            success: true,
            message: '¡Mensaje enviado con éxito! Te responderemos pronto.',
        });
    }
    catch (error) {
        console.error('❌ [CONTACT] Error procesando formulario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor. Por favor, intenta nuevamente.',
        });
    }
});
export default router;
