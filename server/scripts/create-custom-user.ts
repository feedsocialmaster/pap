import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createUser() {
  console.log('\n🔧 Creador de Usuario Personalizado\n');
  console.log('Este script creará un usuario con los datos que especifiques.\n');
  
  // CONFIGURA AQUÍ TU USUARIO
  const userData = {
    email: 'tu-email@ejemplo.com',        // ⬅️ CAMBIA ESTO
    password: 'tu-contraseña',             // ⬅️ CAMBIA ESTO
    nombre: 'Tu Nombre',                   // ⬅️ CAMBIA ESTO
    apellido: 'Tu Apellido',               // ⬅️ CAMBIA ESTO
    fechaNacimiento: new Date('2000-01-01'), // ⬅️ CAMBIA ESTO
    telefono: '011-1234-5678',             // ⬅️ OPCIONAL
    role: 'CLIENTA',                       // CLIENTA, DUENA, ADMIN_CMS, etc.
    direccion: {
      calle: 'Tu Calle',
      numero: '123',
      ciudad: 'Tu Ciudad',
      provincia: 'Tu Provincia',
      codigoPostal: '1000',
    }, // ⬅️ OPCIONAL
  };

  try {
    // Verificar si el usuario ya existe
    const existing = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existing) {
      console.log(`⚠️  Ya existe un usuario con el email: ${userData.email}`);
      console.log(`   ID: ${existing.id}`);
      console.log(`   Nombre: ${existing.nombre} ${existing.apellido}`);
      console.log('\n💡 Puedes cambiar el email en el script o eliminar el usuario existente primero.');
      return;
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(userData.password, 10);

    // Crear el usuario
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        passwordHash,
        nombre: userData.nombre,
        apellido: userData.apellido,
        fechaNacimiento: userData.fechaNacimiento,
        telefono: userData.telefono,
        role: userData.role as any,
        direccion: userData.direccion,
        activo: true,
        emailVerified: true, // Auto-verificado para desarrollo
      },
    });

    console.log('✅ Usuario creado exitosamente!\n');
    console.log(`📧 Email: ${user.email}`);
    console.log(`👤 Nombre: ${user.nombre} ${user.apellido}`);
    console.log(`🆔 ID: ${user.id}`);
    console.log(`🎭 Rol: ${user.role}`);
    console.log(`\n🔑 Puedes iniciar sesión con:`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Contraseña: ${userData.password}`);
  } catch (error) {
    console.error('❌ Error al crear usuario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
