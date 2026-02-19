import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignDefaultCategory() {
  const result = await prisma.product.updateMany({
    where: { categoryId: null },
    data: { categoryId: 'default-category' }
  });
  
  console.log(`✅ ${result.count} productos actualizados con categoría por defecto`);
  await prisma.$disconnect();
}

assignDefaultCategory();
