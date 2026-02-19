#!/usr/bin/env ts-node
/**
 * Asignar promoción a un producto específico (Sandalias Chunky)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function asignarPromocion() {
  console.log('🔧 ASIGNANDO PROMOCIÓN AL PRODUCTO\n');
  console.log('='.repeat(80));
  
  // Buscar el producto "Sandalias Chunky"
  const producto = await prisma.product.findFirst({
    where: {
      OR: [
        { nombre: { contains: 'Chunky', mode: 'insensitive' } },
        { nombre: { contains: 'Sandalia', mode: 'insensitive' } },
      ]
    },
    select: {
      id: true,
      nombre: true,
      precio: true,
      aplicaPromocion: true,
      tipoPromocionAplica: true,
    }
  });
  
  if (!producto) {
    console.log('❌ No se encontró el producto "Sandalias Chunky"');
    console.log('\nBuscando todos los productos...\n');
    
    const todosProductos = await prisma.product.findMany({
      select: { id: true, nombre: true },
      take: 10
    });
    
    console.log('Productos disponibles:');
    todosProductos.forEach((p, idx) => {
      console.log(`${idx + 1}. ${p.nombre} (${p.id})`);
    });
    
    return;
  }
  
  console.log('\n📦 Producto encontrado:');
  console.log(`   Nombre: ${producto.nombre}`);
  console.log(`   ID: ${producto.id}`);
  console.log(`   Precio: $${producto.precio / 100}`);
  console.log(`   aplicaPromocion: ${producto.aplicaPromocion}`);
  console.log(`   tipoPromocionAplica: ${producto.tipoPromocionAplica || 'No configurado'}`);
  
  // Buscar una promoción vigente
  const ahora = new Date();
  const inicioDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0);
  const finDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999);
  
  const promocion = await prisma.cMSPromocion.findFirst({
    where: {
      activo: true,
      fechaInicio: { lte: finDia },
      fechaFin: { gte: inicioDia },
    },
    orderBy: {
      fechaInicio: 'desc'
    }
  });
  
  if (!promocion) {
    console.log('\n❌ No hay promociones vigentes para asignar');
    return;
  }
  
  console.log('\n✅ Promoción vigente encontrada:');
  console.log(`   Título: ${promocion.titulo}`);
  console.log(`   ID: ${promocion.id}`);
  console.log(`   Tipo: ${promocion.tipoDescuento} - ${promocion.valorDescuento}%`);
  
  // Preguntar si desea asignar
  console.log('\n🔧 Asignando promoción al producto...');
  
  const actualizado = await prisma.product.update({
    where: { id: producto.id },
    data: {
      aplicaPromocion: true,
      tipoPromocionAplica: promocion.id,
    },
    select: {
      id: true,
      nombre: true,
      precio: true,
      aplicaPromocion: true,
      tipoPromocionAplica: true,
    }
  });
  
  console.log('\n✅ Producto actualizado exitosamente:');
  console.log(`   Nombre: ${actualizado.nombre}`);
  console.log(`   aplicaPromocion: ${actualizado.aplicaPromocion}`);
  console.log(`   tipoPromocionAplica: ${actualizado.tipoPromocionAplica}`);
  
  // Calcular precio con descuento
  const precioOriginal = actualizado.precio / 100;
  let precioConDescuento = precioOriginal;
  
  if (promocion.tipoDescuento === 'PORCENTAJE') {
    precioConDescuento = precioOriginal * (1 - promocion.valorDescuento / 100);
  }
  
  console.log('\n💰 PRECIOS:');
  console.log(`   Original: $${precioOriginal.toFixed(2)}`);
  console.log(`   Con descuento: $${precioConDescuento.toFixed(2)}`);
  console.log(`   Ahorro: $${(precioOriginal - precioConDescuento).toFixed(2)} (${promocion.valorDescuento}%)`);
  
  console.log('\n' + '='.repeat(80));
  console.log('\n✅ ¡Listo! Ahora el producto tiene la promoción asignada.');
  console.log('Puedes verificarlo en:');
  console.log('  - Frontend: Agrégalo al carrito y ve al checkout');
  console.log('  - CMS: http://localhost:3000/cms/tienda/productos');
  console.log('\n' + '='.repeat(80) + '\n');
}

asignarPromocion()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
