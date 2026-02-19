import { Response } from 'express';
import { AuthedRequest } from '../../middleware/auth.js';
import { prisma } from '../../prisma.js';

// Función auxiliar para verificar si hay promociones o liquidaciones que bloqueen códigos
// REGLA CRÍTICA: CUALQUIER producto con promoción vigente O en liquidación bloquea el uso de códigos promocionales
async function verificarPromocionesExclusivas(productIds: string[]): Promise<{
  bloqueado: boolean;
  razon?: string;
  promocionBloqueante?: { titulo: string; tipoDescuento: string };
  liquidacionBloqueante?: { productosEnLiquidacion: string[] };
}> {
  if (!productIds || productIds.length === 0) {
    return { bloqueado: false };
  }

  // PASO 1: Verificar productos en liquidación (prioridad máxima)
  const productosEnLiquidacion = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      enLiquidacion: true,
      porcentajeDescuento: { not: null, gt: 0 }
    },
    select: {
      id: true,
      nombre: true,
      porcentajeDescuento: true
    }
  });

  if (productosEnLiquidacion.length > 0) {
    const nombresProductos = productosEnLiquidacion.map(p => p.nombre);
    return {
      bloqueado: true,
      razon: `Tu carrito contiene ${productosEnLiquidacion.length} producto(s) en liquidación. Los códigos promocionales NO pueden combinarse con productos en liquidación.`,
      liquidacionBloqueante: { productosEnLiquidacion: nombresProductos }
    };
  }

  // PASO 2: Buscar productos que tengan promoción activa
  const productosConPromocion = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      aplicaPromocion: true,
      tipoPromocionAplica: { not: null }
    },
    select: {
      id: true,
      nombre: true,
      tipoPromocionAplica: true
    }
  });

  if (productosConPromocion.length === 0) {
    return { bloqueado: false };
  }

  // Obtener IDs de promociones únicas
  const promocionIds = [...new Set(productosConPromocion.map(p => p.tipoPromocionAplica).filter(Boolean))] as string[];

  // REGLA ESTRICTA: Buscar CUALQUIER promoción activa y vigente
  // NO es necesario que sea exclusiva - TODAS las promociones bloquean códigos
  const now = new Date();
  const promocionesActivas = await prisma.cMSPromocion.findMany({
    where: {
      id: { in: promocionIds },
      activo: true,
      fechaInicio: { lte: now },
      fechaFin: { gte: now }
    },
    select: {
      id: true,
      titulo: true,
      tipoDescuento: true
    }
  });

  if (promocionesActivas.length > 0) {
    const promo = promocionesActivas[0];
    return {
      bloqueado: true,
      razon: `Tu carrito contiene productos con promociones activas. Los códigos promocionales NO pueden combinarse con promociones especiales bajo ninguna circunstancia.`,
      promocionBloqueante: {
        titulo: promo.titulo,
        tipoDescuento: promo.tipoDescuento
      }
    };
  }

  return { bloqueado: false };
}

// Obtener todos los cupones
export const getCupones = async (req: AuthedRequest, res: Response) => {
  try {
    const { activo } = req.query;
    
    const where: any = {};
    if (activo !== undefined) where.activo = activo === 'true';

    const cupones = await prisma.cMSCodigoPromocional.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json(cupones);
  } catch (error) {
    console.error('Error al obtener cupones:', error);
    res.status(500).json({ error: 'Error al obtener cupones' });
  }
};

// Obtener un cupón por ID
export const getCuponById = async (req: AuthedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const cupon = await prisma.cMSCodigoPromocional.findUnique({
      where: { id }
    });

    if (!cupon) {
      return res.status(404).json({ error: 'Cupón no encontrado' });
    }

    res.json(cupon);
  } catch (error) {
    console.error('Error al obtener cupón:', error);
    res.status(500).json({ error: 'Error al obtener cupón' });
  }
};

// Validar y obtener cupón por código (para el carrito)
export const validarCupon = async (req: AuthedRequest, res: Response) => {
  try {
    const { codigo } = req.params;
    const usuarioId = req.user?.id;
    // productIds se puede pasar como query param: ?productIds=id1,id2,id3
    const productIdsParam = req.query.productIds as string | undefined;
    const productIds = productIdsParam ? productIdsParam.split(',') : [];

    // YA NO BLOQUEAMOS: El cupón solo aplicará a productos sin promoción
    // Solo informamos si hay productos con promoción
    let infoPromociones = null;
    if (productIds.length > 0) {
      const verificacion = await verificarPromocionesExclusivas(productIds);
      if (verificacion.bloqueado) {
        // Guardar la información pero NO bloquear
        infoPromociones = {
          mensaje: 'El cupón solo aplicará a productos sin promoción vigente',
          promocionBloqueante: verificacion.promocionBloqueante,
          liquidacionBloqueante: verificacion.liquidacionBloqueante
        };
      }
    }

    const cupon = await prisma.cMSCodigoPromocional.findUnique({
      where: { codigo: codigo.toUpperCase() }
    });

    if (!cupon) {
      return res.status(404).json({ error: 'Cupón no encontrado' });
    }

    if (!cupon.activo) {
      return res.status(400).json({ error: 'Este cupón no está activo' });
    }

    // Verificar fechas de validez
    const now = new Date();
    if (cupon.fechaInicio && now < cupon.fechaInicio) {
      return res.status(400).json({ error: 'Este cupón aún no está disponible' });
    }

    if (cupon.fechaFin && now > cupon.fechaFin) {
      return res.status(400).json({ error: 'Este cupón ha expirado' });
    }

    // Verificar usos máximos
    if (cupon.usosMaximos && cupon.usosActuales >= cupon.usosMaximos) {
      return res.status(400).json({ error: 'Este cupón ha alcanzado su límite de usos' });
    }

    // Verificar si el usuario tiene permiso para usar este cupón
    if (cupon.usuariosPermitidos.length > 0 && usuarioId) {
      if (!cupon.usuariosPermitidos.includes(usuarioId)) {
        return res.status(403).json({ error: 'No tienes permiso para usar este cupón' });
      }
    }

    // Los cupones SIEMPRE se pueden aplicar, solo afectan a productos sin promoción
    // Ya no bloqueamos cupones por productos con promoción
    
    res.json({
      codigo: cupon.codigo,
      descuento: cupon.descuento,
      tipoDescuento: cupon.tipoDescuento,
      tipoBundle: cupon.tipoBundle,
      combinable: cupon.combinable,
      descripcion: cupon.descripcion,
      promo_code_available: true,
      promo_code_valid: true,
      infoPromociones: infoPromociones // Información sobre productos con promoción
    });
  } catch (error) {
    console.error('Error al validar cupón:', error);
    res.status(500).json({ error: 'Error al validar cupón' });
  }
};

// Crear un nuevo cupón
export const createCupon = async (req: AuthedRequest, res: Response) => {
  try {
    const {
      codigo,
      descuento,
      tipoDescuento,
      tipoBundle,
      combinable,
      exclusivoConPromociones,
      activo,
      fechaInicio,
      fechaFin,
      usosMaximos,
      usuariosPermitidos,
      descripcion
    } = req.body;

    // Validación: requerir código
    if (!codigo) {
      return res.status(400).json({ 
        error: 'El código es requerido' 
      });
    }

    // Validación: para códigos activos, requerir al menos descuento o tipoBundle
    const esActivo = activo !== undefined ? activo : true;
    const tieneDescuento = descuento !== undefined && descuento !== null && descuento > 0;
    const tieneBundle = tipoBundle !== undefined && tipoBundle !== null && tipoBundle !== '';

    if (esActivo && !tieneDescuento && !tieneBundle) {
      return res.status(400).json({ 
        error: 'Un código activo debe tener al menos un descuento porcentual o un tipo de bundle',
        promo_code_valid: false,
        reason: 'missing_discount_or_bundle'
      });
    }

    // Verificar que el código no exista
    const existeCodigo = await prisma.cMSCodigoPromocional.findUnique({
      where: { codigo: codigo.toUpperCase() }
    });

    if (existeCodigo) {
      return res.status(400).json({ 
        error: 'Ya existe un cupón con este código' 
      });
    }

    const cupon = await prisma.cMSCodigoPromocional.create({
      data: {
        codigo: codigo.toUpperCase(),
        descuento: tieneDescuento ? descuento : null,
        tipoDescuento: tipoDescuento || 'PORCENTAJE',
        tipoBundle: tieneBundle ? tipoBundle : null,
        combinable: combinable || false,
        exclusivoConPromociones: exclusivoConPromociones || false,
        activo: esActivo,
        fechaInicio: fechaInicio ? new Date(fechaInicio) : null,
        fechaFin: fechaFin ? new Date(fechaFin) : null,
        usosMaximos: usosMaximos || null,
        usuariosPermitidos: usuariosPermitidos || [],
        descripcion: descripcion || null
      }
    });

    // Crear log de auditoría
    await prisma.cMSAuditLog.create({
      data: {
        usuarioId: req.user!.id,
        accion: 'CREATE',
        entidad: 'CMSCodigoPromocional',
        entidadId: cupon.id,
        cambios: { codigo: cupon.codigo, descuento: cupon.descuento },
      },
    });

    res.status(201).json(cupon);
  } catch (error) {
    console.error('Error al crear cupón:', error);
    res.status(500).json({ error: 'Error al crear cupón' });
  }
};

// Actualizar un cupón
export const updateCupon = async (req: AuthedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      codigo,
      descuento,
      tipoDescuento,
      tipoBundle,
      combinable,
      exclusivoConPromociones,
      activo,
      fechaInicio,
      fechaFin,
      usosMaximos,
      usuariosPermitidos,
      descripcion
    } = req.body;

    // Si se está cambiando el código, verificar que no exista
    if (codigo) {
      const existeCodigo = await prisma.cMSCodigoPromocional.findFirst({
        where: { 
          codigo: codigo.toUpperCase(),
          NOT: { id }
        }
      });

      if (existeCodigo) {
        return res.status(400).json({ 
          error: 'Ya existe un cupón con este código' 
        });
      }
    }

    // Si se está activando el cupón, validar que tenga al menos descuento o tipoBundle
    if (activo === true) {
      // Obtener el cupón actual para verificar valores existentes
      const cuponActual = await prisma.cMSCodigoPromocional.findUnique({
        where: { id }
      });

      if (!cuponActual) {
        return res.status(404).json({ error: 'Cupón no encontrado' });
      }

      const descuentoFinal = descuento !== undefined ? descuento : cuponActual.descuento;
      const tipoBundleFinal = tipoBundle !== undefined ? tipoBundle : cuponActual.tipoBundle;

      const tieneDescuento = descuentoFinal !== null && descuentoFinal > 0;
      const tieneBundle = tipoBundleFinal !== null && tipoBundleFinal !== '';

      if (!tieneDescuento && !tieneBundle) {
        return res.status(400).json({ 
          error: 'Un código activo debe tener al menos un descuento porcentual o un tipo de bundle',
          promo_code_valid: false,
          reason: 'missing_discount_or_bundle'
        });
      }
    }

    const cupon = await prisma.cMSCodigoPromocional.update({
      where: { id },
      data: {
        ...(codigo && { codigo: codigo.toUpperCase() }),
        ...(descuento !== undefined && { descuento: descuento || null }),
        ...(tipoDescuento && { tipoDescuento }),
        ...(tipoBundle !== undefined && { tipoBundle: tipoBundle || null }),
        ...(combinable !== undefined && { combinable }),
        ...(exclusivoConPromociones !== undefined && { exclusivoConPromociones }),
        ...(activo !== undefined && { activo }),
        ...(fechaInicio !== undefined && { 
          fechaInicio: fechaInicio ? new Date(fechaInicio) : null 
        }),
        ...(fechaFin !== undefined && { 
          fechaFin: fechaFin ? new Date(fechaFin) : null 
        }),
        ...(usosMaximos !== undefined && { usosMaximos }),
        ...(usuariosPermitidos !== undefined && { usuariosPermitidos }),
        ...(descripcion !== undefined && { descripcion })
      }
    });

    // Crear log de auditoría
    await prisma.cMSAuditLog.create({
      data: {
        usuarioId: req.user!.id,
        accion: 'UPDATE',
        entidad: 'CMSCodigoPromocional',
        entidadId: cupon.id,
        cambios: req.body,
      },
    });

    res.json(cupon);
  } catch (error) {
    console.error('Error al actualizar cupón:', error);
    res.status(500).json({ error: 'Error al actualizar cupón' });
  }
};

// Eliminar un cupón
export const deleteCupon = async (req: AuthedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const cupon = await prisma.cMSCodigoPromocional.delete({
      where: { id }
    });

    // Crear log de auditoría
    await prisma.cMSAuditLog.create({
      data: {
        usuarioId: req.user!.id,
        accion: 'DELETE',
        entidad: 'CMSCodigoPromocional',
        entidadId: cupon.id,
        cambios: { codigo: cupon.codigo },
      },
    });

    res.json({ message: 'Cupón eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar cupón:', error);
    res.status(500).json({ error: 'Error al eliminar cupón' });
  }
};

// Aplicar cupón en un pedido
export const aplicarCupon = async (req: AuthedRequest, res: Response) => {
  try {
    const { codigo, productIds } = req.body;

    // Verificar si hay promociones que bloqueen códigos
    if (productIds && productIds.length > 0) {
      const verificacion = await verificarPromocionesExclusivas(productIds);
      if (verificacion.bloqueado) {
        return res.status(403).json({
          error: verificacion.razon,
          promo_code_available: false,
          blocked_by_promotion: verificacion.promocionBloqueante
        });
      }
    }

    const cupon = await prisma.cMSCodigoPromocional.findUnique({
      where: { codigo: codigo.toUpperCase() }
    });

    if (!cupon || !cupon.activo) {
      return res.status(400).json({ error: 'Cupón inválido o inactivo' });
    }

    // Incrementar contador de usos
    await prisma.cMSCodigoPromocional.update({
      where: { id: cupon.id },
      data: { usosActuales: cupon.usosActuales + 1 }
    });

    res.json({ 
      descuento: cupon.descuento,
      tipoDescuento: cupon.tipoDescuento,
      tipoBundle: cupon.tipoBundle
    });
  } catch (error) {
    console.error('Error al aplicar cupón:', error);
    res.status(500).json({ error: 'Error al aplicar cupón' });
  }
};

// Verificar disponibilidad de códigos promocionales basándose en productos del carrito
export const verificarDisponibilidadCodigos = async (req: AuthedRequest, res: Response) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({ 
        error: 'Se requiere un array de IDs de productos',
        promo_code_available: true 
      });
    }

    if (productIds.length === 0) {
      return res.json({
        promo_code_available: true,
        reason: 'Carrito vacío'
      });
    }

    const verificacion = await verificarPromocionesExclusivas(productIds);

    res.json({
      promo_code_available: !verificacion.bloqueado,
      reason: verificacion.razon || 'Los códigos promocionales están disponibles para este carrito.',
      blocked_by_promotion: verificacion.promocionBloqueante || null,
      blocked_by_liquidacion: verificacion.liquidacionBloqueante || null
    });
  } catch (error) {
    console.error('Error al verificar disponibilidad de códigos:', error);
    res.status(500).json({ 
      error: 'Error al verificar disponibilidad',
      promo_code_available: true // En caso de error, no bloquear
    });
  }
};
