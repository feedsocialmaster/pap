# Configuración del Servicio de Email

## Estado Actual

El servicio de email está **completamente implementado** con Nodemailer. 

- En **desarrollo**: los emails se registran en la consola
- En **producción**: los emails se envían al servidor SMTP configurado

## Funcionalidades Implementadas

### 1. Formulario de Contacto
- **Endpoint:** `POST /api/contact`
- **Funciones:** 
  - `sendContactFormEmail()` - Envía el mensaje al email del negocio
  - `sendContactConfirmationEmail()` - Envía confirmación al usuario
- **Características:**
  - Funciona para usuarios logueados y no logueados
  - Si el usuario está logueado, incluye información del usuario
  - El email tiene formato HTML profesional
  - Soporta reply-to para responder directamente al cliente

### 2. Cambio de Contraseña
- **Función:** `sendPasswordChangeEmail()`
- **Cuándo se envía:** Cuando un usuario cambia su contraseña desde el perfil
- **Contenido:** Confirmación del cambio con fecha/hora y advertencia de seguridad

### 3. Recuperación de Contraseña
- **Endpoint:** `POST /api/auth/recuperar-password`
- **Función:** `sendPasswordResetEmail()`
- **Cuándo se envía:** Cuando un usuario solicita restablecer su contraseña olvidada
- **Contenido:** Enlace con token para restablecer la contraseña (expira en 1 hora)
- **Página de reset:** `/reset-password?token=<token>`

### 4. Recuperación de Nombre de Usuario
- **Endpoint:** `POST /api/auth/recuperar-username`
- **Función:** `sendUsernameRecoveryEmail()`
- **Cuándo se envía:** Cuando un usuario solicita recordar su nombre de usuario
- **Contenido:** El nombre de usuario asociado al email + enlace a login

## Configuración para Producción

### 1. Variables de Entorno

Agrega las siguientes variables a tu archivo `.env` en el servidor:

```env
# Configuración SMTP
EMAIL_HOST=smtp.tuproveedor.com
EMAIL_PORT=587
EMAIL_USER=tu-email@tudominio.com
EMAIL_PASS=tu-password-o-api-key
EMAIL_FROM=Paso a Paso Shoes <noreply@pasoapaso.com>

# Email donde se reciben los mensajes de contacto
CONTACT_EMAIL=contacto@pasoapaso.com
```

### 2. Opciones de Proveedores SMTP

#### Gmail
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-password-de-aplicacion
```
⚠️ Gmail requiere [contraseña de aplicación](https://support.google.com/accounts/answer/185833)

#### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=tu-email@outlook.com
EMAIL_PASS=tu-password
```

#### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=SG.tu-api-key-de-sendgrid
```

#### Hosting cPanel (Recomendado para hosting compartido)
```env
EMAIL_HOST=mail.tudominio.com
EMAIL_PORT=465
EMAIL_USER=contacto@tudominio.com
EMAIL_PASS=tu-password
```

#### Amazon SES
```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=tu-access-key-id
EMAIL_PASS=tu-secret-access-key
```

### 3. Verificar la Configuración

Crea un script de prueba en `server/scripts/test-email.ts`:

```typescript
import 'dotenv/config';
import { sendEmail } from '../src/services/email.service.js';

const testEmail = async () => {
  console.log('🔧 Configuración actual:');
  console.log('   EMAIL_HOST:', process.env.EMAIL_HOST || '(no configurado)');
  console.log('   EMAIL_PORT:', process.env.EMAIL_PORT || '(no configurado)');
  console.log('   EMAIL_USER:', process.env.EMAIL_USER || '(no configurado)');
  console.log('   CONTACT_EMAIL:', process.env.CONTACT_EMAIL || '(no configurado)');
  console.log('');

  const result = await sendEmail({
    to: process.env.CONTACT_EMAIL || 'test@example.com',
    subject: '🧪 Test de Email - Paso a Paso Shoes',
    text: 'Este es un email de prueba para verificar la configuración SMTP.',
    html: '<h1>Test de Email</h1><p>Si ves este mensaje, la configuración funciona correctamente.</p>',
  });

  if (result) {
    console.log('✅ Email de prueba enviado exitosamente');
  } else {
    console.log('❌ Error al enviar email de prueba');
  }
};

testEmail();
```

Ejecutar:
```bash
cd server
npx tsx scripts/test-email.ts
```

## Estructura del Sistema

```
server/src/
├── services/
│   └── email.service.ts    # Servicio principal de email
├── routes/
│   └── contact.routes.ts   # Endpoint de contacto
└── config/
    └── env.ts              # Variables de entorno
```

## Flujo del Formulario de Contacto

1. Usuario completa el formulario en `/contacto`
2. Frontend envía POST a `/api/contact` con los datos
3. Si el usuario está logueado, se incluye el token JWT
4. El servidor valida los datos con Zod
5. Se envía email al CONTACT_EMAIL con los datos del formulario
6. Se envía confirmación al email del usuario (no bloqueante)
7. Se retorna respuesta de éxito/error

## Mejoras Futuras

- [ ] Email de bienvenida al registrarse
- [x] Email de recuperación de contraseña ✅
- [x] Email de recuperación de nombre de usuario ✅
- [ ] Notificaciones de pedidos (confirmación, envío, entrega)
- [ ] Newsletter/promociones con suscripción
- [ ] Cola de emails con Bull/BullMQ para mejor rendimiento
- [ ] Logs de emails enviados en base de datos
