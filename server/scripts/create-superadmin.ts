import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  const email = 'alejandrocausi@gmail.com';
  const password = 'Admin2026@PaP';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Si existe, actualiza el rol a SUPER_SU
    const updated = await prisma.user.update({
      where: { email },
      data: { role: 'SUPER_SU', activo: true, emailVerified: true },
    });
    console.log(`✅ Usuario actualizado a SUPER_SU: ${updated.email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      nombre: 'Alejandro',
      apellido: 'Causi',
      fechaNacimiento: new Date('1990-01-01'),
      role: 'SUPER_SU',
      activo: true,
      emailVerified: true,
    },
  });

  console.log(`✅ Superadmin creado: ${user.email}`);
  console.log(`   Contraseña: ${password}`);
}

createSuperAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
