import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed users (one supersu, one client)
  const owner = await prisma.user.upsert({
    where: { email: 'supersu@pasoapaso.com' },
    update: {},
    create: {
      email: 'supersu@pasoapaso.com',
      passwordHash: '$2a$10$7zyxgi85qGhkPGkBBeqKmuzsyJNn4Qe2oso3o13a05fqKmtjNi9Se', // "pass1234" bcrypt (demo only)
      nombre: 'Super Usuario',
      apellido: 'Sistema',
      fechaNacimiento: new Date('1990-01-01'),
      telefono: '011-1234-5678',
      direccion: { calle: 'Av. Siempre Viva', numero: '742', ciudad: 'CABA', provincia: 'Buenos Aires', codigoPostal: '1000' },
      role: 'SUPER_SU' as any,
    },
  });

  const clienta = await prisma.user.upsert({
    where: { email: 'clienta@example.com' },
    update: {},
    create: {
      email: 'clienta@example.com',
      passwordHash: '$2a$10$7zyxgi85qGhkPGkBBeqKmuzsyJNn4Qe2oso3o13a05fqKmtjNi9Se', // "pass1234"
      nombre: 'Ana',
      apellido: 'García',
      fechaNacimiento: new Date('1995-05-10'),
      direccion: { calle: 'Calle Falsa', numero: '123', ciudad: 'CABA', provincia: 'Buenos Aires', codigoPostal: '1000' },
      role: 'CLIENTA' as any,
    },
  });

  // Usuaria Demo 1: María López (Nivel ORO)
  const maria = await prisma.user.upsert({
    where: { email: 'maria.lopez@demo.com' },
    update: {},
    create: {
      email: 'maria.lopez@demo.com',
      passwordHash: '$2a$10$7zyxgi85qGhkPGkBBeqKmuzsyJNn4Qe2oso3o13a05fqKmtjNi9Se', // "pass1234"
      nombre: 'María',
      apellido: 'López',
      fechaNacimiento: new Date('1992-03-15'),
      telefono: '011-5555-1234',
      direccion: { 
        calle: 'Av. Corrientes', 
        numero: '2500', 
        ciudad: 'CABA', 
        provincia: 'Buenos Aires', 
        codigoPostal: '1046' 
      },
      role: 'CLIENTA' as any,
    },
  });

  // Usuaria Demo 2: Laura Martínez (Nivel BRONCE)
  const laura = await prisma.user.upsert({
    where: { email: 'laura.martinez@demo.com' },
    update: {},
    create: {
      email: 'laura.martinez@demo.com',
      passwordHash: '$2a$10$7zyxgi85qGhkPGkBBeqKmuzsyJNn4Qe2oso3o13a05fqKmtjNi9Se', // "pass1234"
      nombre: 'Laura',
      apellido: 'Martínez',
      fechaNacimiento: new Date('1998-08-20'),
      telefono: '011-4444-5678',
      direccion: { 
        calle: 'Av. Santa Fe', 
        numero: '1850', 
        ciudad: 'CABA', 
        provincia: 'Buenos Aires', 
        codigoPostal: '1123' 
      },
      role: 'CLIENTA' as any,
    },
  });

  // Seed products - ELIMINADO
  // Los productos ahora se crean únicamente desde el CMS
  // No se crean productos de prueba automáticamente para evitar confusión
  
  console.log('✅ No se crearon productos de seed - deben crearse desde el CMS');

  console.log('Seed completed.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
