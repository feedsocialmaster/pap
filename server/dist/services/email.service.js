/**
 * Email Service
 * Handles sending emails to users using Nodemailer
 */
import nodemailer from 'nodemailer';
// Configuración del transporter
const createTransporter = () => {
    const host = process.env.EMAIL_HOST;
    const port = parseInt(process.env.EMAIL_PORT || '587');
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    // Si no hay configuración de email, retorna null
    if (!host || !user || !pass) {
        return null;
    }
    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true para puerto 465 (SSL)
        auth: {
            user,
            pass,
        },
    });
};
/**
 * Send an email
 * En desarrollo, solo loguea. En producción, envía email real si está configurado.
 */
export async function sendEmail(options) {
    const transporter = createTransporter();
    const isDevelopment = process.env.NODE_ENV !== 'production';
    // En desarrollo o si no hay transporter configurado, solo loguear
    if (isDevelopment || !transporter) {
        console.log('📧 [EMAIL SERVICE] Email (modo desarrollo/sin configurar):');
        console.log('   To:', options.to);
        console.log('   Subject:', options.subject);
        console.log('   Text:', options.text);
        if (options.replyTo) {
            console.log('   Reply-To:', options.replyTo);
        }
        if (options.html) {
            console.log('   HTML: [contenido HTML]');
        }
        if (!transporter && !isDevelopment) {
            console.warn('⚠️  [EMAIL SERVICE] Transporter no configurado. Configura EMAIL_HOST, EMAIL_USER y EMAIL_PASS.');
        }
        return true; // Simula éxito en desarrollo
    }
    // En producción, enviar email real
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'Paso a Paso Shoes <noreply@pasoapaso.com>',
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
            replyTo: options.replyTo,
        });
        console.log('✅ [EMAIL SERVICE] Email enviado exitosamente a:', options.to);
        return true;
    }
    catch (error) {
        console.error('❌ [EMAIL SERVICE] Error enviando email:', error);
        return false;
    }
}
/**
 * Send password change confirmation email
 */
export async function sendPasswordChangeEmail(userEmail, userName) {
    const subject = 'Confirmación de Cambio de Contraseña - Paso a Paso Shoes';
    const text = `
Hola ${userName},

Tu contraseña ha sido cambiada exitosamente.

Si no realizaste este cambio, por favor contacta inmediatamente a nuestro equipo de soporte.

Detalles del cambio:
- Fecha y hora: ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}
- Email de la cuenta: ${userEmail}

Para tu seguridad, tu sesión ha sido cerrada automáticamente. Por favor, inicia sesión nuevamente con tu nueva contraseña.

Saludos,
Equipo Paso a Paso Shoes
  `.trim();
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #7c2d12; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9f9f9; padding: 20px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #7c2d12; }
    .warning { background-color: #fef3c7; padding: 15px; margin: 15px 0; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Paso a Paso Shoes</h1>
    </div>
    <div class="content">
      <h2>Confirmación de Cambio de Contraseña</h2>
      <p>Hola <strong>${userName}</strong>,</p>
      <p>Tu contraseña ha sido <strong>cambiada exitosamente</strong>.</p>
      
      <div class="details">
        <h3>Detalles del cambio:</h3>
        <ul>
          <li><strong>Fecha y hora:</strong> ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</li>
          <li><strong>Email de la cuenta:</strong> ${userEmail}</li>
        </ul>
      </div>

      <div class="warning">
        <p><strong>⚠️ Importante:</strong></p>
        <p>Si no realizaste este cambio, por favor contacta inmediatamente a nuestro equipo de soporte.</p>
      </div>

      <p>Para tu seguridad, tu sesión ha sido cerrada automáticamente. Por favor, inicia sesión nuevamente con tu nueva contraseña.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Paso a Paso Shoes. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
    return sendEmail({
        to: userEmail,
        subject,
        text,
        html,
    });
}
/**
 * Send contact form email
 * Envía el formulario de contacto al email del negocio
 */
export async function sendContactFormEmail(data) {
    const contactEmail = process.env.CONTACT_EMAIL || process.env.EMAIL_USER;
    if (!contactEmail) {
        console.error('❌ [EMAIL SERVICE] CONTACT_EMAIL o EMAIL_USER no configurado');
        return false;
    }
    const isLoggedIn = data.userId ? 'Sí' : 'No';
    const userInfo = data.userId
        ? `Usuario registrado (ID: ${data.userId}, Nombre: ${data.userName || 'N/A'})`
        : 'Usuario no registrado';
    const subject = `[Contacto Web] ${data.asunto}`;
    const text = `
Nuevo mensaje de contacto desde el sitio web

======================================
INFORMACIÓN DEL CONTACTO
======================================

Nombre: ${data.nombre}
Email: ${data.email}
Teléfono: ${data.telefono}
Asunto: ${data.asunto}

Usuario logueado: ${isLoggedIn}
${data.userId ? `Info del usuario: ${userInfo}` : ''}

======================================
MENSAJE
======================================

${data.mensaje}

======================================

Fecha y hora: ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}
  `.trim();
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #7c2d12; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-top: 10px; }
    .badge-registered { background-color: #059669; color: white; }
    .badge-guest { background-color: #6b7280; color: white; }
    .content { background-color: white; padding: 25px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 14px; color: #7c2d12; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; font-weight: bold; border-bottom: 2px solid #7c2d12; padding-bottom: 5px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .info-item { background-color: #f9f9f9; padding: 10px; border-radius: 5px; }
    .info-label { font-size: 12px; color: #666; margin-bottom: 2px; }
    .info-value { font-weight: 500; color: #333; }
    .message-box { background-color: #fef3c7; padding: 20px; border-radius: 8px; margin-top: 15px; border-left: 4px solid #f59e0b; }
    .message-text { white-space: pre-wrap; line-height: 1.8; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    .timestamp { background-color: #e5e7eb; padding: 8px 15px; border-radius: 5px; display: inline-block; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📬 Nuevo Mensaje de Contacto</h1>
      <span class="badge ${data.userId ? 'badge-registered' : 'badge-guest'}">
        ${data.userId ? '✓ Usuario Registrado' : '○ Visitante'}
      </span>
    </div>
    <div class="content">
      <div class="section">
        <div class="section-title">👤 Información del Contacto</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Nombre</div>
            <div class="info-value">${data.nombre}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Teléfono</div>
            <div class="info-value">${data.telefono}</div>
          </div>
          <div class="info-item" style="grid-column: span 2;">
            <div class="info-label">Email</div>
            <div class="info-value"><a href="mailto:${data.email}" style="color: #7c2d12;">${data.email}</a></div>
          </div>
        </div>
        ${data.userId ? `
        <div class="info-item" style="margin-top: 10px;">
          <div class="info-label">Info de Usuario</div>
          <div class="info-value">${userInfo}</div>
        </div>
        ` : ''}
      </div>

      <div class="section">
        <div class="section-title">📋 Asunto</div>
        <p style="font-size: 18px; font-weight: 500; margin: 0;">${data.asunto}</p>
      </div>

      <div class="section">
        <div class="section-title">💬 Mensaje</div>
        <div class="message-box">
          <div class="message-text">${data.mensaje.replace(/\n/g, '<br>')}</div>
        </div>
      </div>

      <div style="text-align: center; margin-top: 20px;">
        <span class="timestamp">📅 ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</span>
      </div>
    </div>
    <div class="footer">
      <p>Este mensaje fue enviado desde el formulario de contacto de <strong>Paso a Paso Shoes</strong></p>
      <p>Podés responder directamente a este email para contactar al cliente.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
    return sendEmail({
        to: contactEmail,
        subject,
        text,
        html,
        replyTo: data.email, // Permite responder directamente al cliente
    });
}
/**
 * Send contact confirmation email to the user
 * Envía confirmación de recepción al usuario
 */
export async function sendContactConfirmationEmail(data) {
    const subject = 'Recibimos tu mensaje - Paso a Paso Shoes';
    const text = `
Hola ${data.nombre},

¡Gracias por contactarnos!

Hemos recibido tu mensaje y te responderemos a la brevedad.

Resumen de tu consulta:
- Asunto: ${data.asunto}
- Fecha: ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}

Si tu consulta es urgente, podés contactarnos directamente por WhatsApp.

Saludos,
Equipo Paso a Paso Shoes
  `.trim();
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #7c2d12; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .success-icon { font-size: 48px; margin-bottom: 15px; }
    .summary { background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    .cta { display: inline-block; background-color: #7c2d12; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="success-icon">✉️</div>
      <h1>¡Mensaje Recibido!</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${data.nombre}</strong>,</p>
      <p>¡Gracias por contactarnos! Hemos recibido tu mensaje y te responderemos a la brevedad.</p>
      
      <div class="summary">
        <h3 style="margin-top: 0; color: #059669;">📋 Resumen de tu consulta</h3>
        <p><strong>Asunto:</strong> ${data.asunto}</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</p>
      </div>

      <p>Si tu consulta es urgente, podés contactarnos directamente por WhatsApp:</p>
      <div style="text-align: center;">
        <a href="https://wa.me/5491100000000" class="cta">📱 Contactar por WhatsApp</a>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Paso a Paso Shoes. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
    return sendEmail({
        to: data.email,
        subject,
        text,
        html,
    });
}
/**
 * Send password reset email
 * Envía un enlace para restablecer la contraseña
 */
export async function sendPasswordResetEmail(userEmail, userName, resetToken) {
    const frontendUrl = process.env.APP_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    const subject = 'Recuperar Contraseña - Paso a Paso Shoes';
    const text = `
Hola ${userName},

Recibimos una solicitud para restablecer la contraseña de tu cuenta.

Hacé clic en el siguiente enlace para crear una nueva contraseña:
${resetUrl}

Este enlace expirará en 1 hora.

Si no solicitaste este cambio, podés ignorar este email. Tu contraseña actual permanecerá sin cambios.

Saludos,
Equipo Paso a Paso Shoes
  `.trim();
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #7c2d12; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .icon { font-size: 48px; margin-bottom: 15px; }
    .cta { display: inline-block; background-color: #7c2d12; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .cta:hover { background-color: #991b1b; }
    .warning { background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    .link-text { background-color: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px; color: #666; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">🔐</div>
      <h1>Recuperar Contraseña</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${userName}</strong>,</p>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="cta">Restablecer Contraseña</a>
      </div>

      <div class="warning">
        <p><strong>⏰ Este enlace expirará en 1 hora.</strong></p>
        <p style="margin-bottom: 0;">Si no solicitaste este cambio, podés ignorar este email. Tu contraseña actual permanecerá sin cambios.</p>
      </div>

      <p style="font-size: 14px; color: #666;">Si el botón no funciona, copiá y pegá el siguiente enlace en tu navegador:</p>
      <div class="link-text">${resetUrl}</div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Paso a Paso Shoes. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
    return sendEmail({
        to: userEmail,
        subject,
        text,
        html,
    });
}
/**
 * Send username recovery email
 * Envía el nombre de usuario al correo del usuario
 */
export async function sendUsernameRecoveryEmail(userEmail, userName, username) {
    const frontendUrl = process.env.APP_URL || 'http://localhost:3000';
    const loginUrl = `${frontendUrl}/login`;
    const subject = 'Tu Nombre de Usuario - Paso a Paso Shoes';
    const text = `
Hola ${userName},

Recibimos una solicitud para recuperar tu nombre de usuario.

Tu nombre de usuario es: ${username}

Podés iniciar sesión en: ${loginUrl}

Si no solicitaste esta información, podés ignorar este email.

Saludos,
Equipo Paso a Paso Shoes
  `.trim();
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #7c2d12; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .icon { font-size: 48px; margin-bottom: 15px; }
    .username-box { background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; text-align: center; }
    .username { font-size: 24px; font-weight: bold; color: #059669; }
    .cta { display: inline-block; background-color: #7c2d12; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">👤</div>
      <h1>Tu Nombre de Usuario</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${userName}</strong>,</p>
      <p>Recibimos una solicitud para recuperar tu nombre de usuario.</p>
      
      <div class="username-box">
        <p style="margin: 0 0 10px 0; color: #666;">Tu nombre de usuario es:</p>
        <div class="username">${username}</div>
      </div>

      <div style="text-align: center;">
        <a href="${loginUrl}" class="cta">Iniciar Sesión</a>
      </div>

      <p style="font-size: 14px; color: #666; text-align: center;">
        Si no solicitaste esta información, podés ignorar este email.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Paso a Paso Shoes. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
    return sendEmail({
        to: userEmail,
        subject,
        text,
        html,
    });
}
