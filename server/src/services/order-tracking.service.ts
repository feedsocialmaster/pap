import { EstadoEntrega } from '@prisma/client';
import { prisma } from '../prisma.js';

export async function actualizarEstadoEntrega(params: {
  orderId: string;
  nuevoEstado: EstadoEntrega;
  cambiadoPor: string;
  notas?: string;
  motivoNoEntrega?: string;
}) {
  const { orderId, nuevoEstado, cambiadoPor, notas, motivoNoEntrega } = params;

  // Obtener orden actual
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      estadoEntrega: true,
      intentosEntrega: true,
      confirmoRecepcion: true,
    },
  });

  if (!order) {
    throw new Error('Orden no encontrada');
  }

  // Validaciones
  if (order.confirmoRecepcion && nuevoEstado !== EstadoEntrega.ENTREGADO) {
    throw new Error('El cliente ya confirmó la recepción del pedido');
  }

  if (order.intentosEntrega >= 2 && nuevoEstado === EstadoEntrega.VISITADO_NO_ENTREGADO) {
    // Si ya hay 2 intentos, marcar como retiro en local
    return actualizarEstadoEntrega({
      orderId,
      nuevoEstado: EstadoEntrega.RETIRO_EN_LOCAL,
      cambiadoPor,
      notas: 'Máximo de intentos de entrega alcanzado. El cliente debe retirar en local.',
    });
  }

  // Preparar datos de actualización
  const updateData: any = {
    estadoEntrega: nuevoEstado,
  };

  // Si es visitado pero no entregado, incrementar intentos
  if (nuevoEstado === EstadoEntrega.VISITADO_NO_ENTREGADO) {
    updateData.intentosEntrega = order.intentosEntrega + 1;
    updateData.fechaUltimoIntento = new Date();
    if (motivoNoEntrega) {
      updateData.motivoNoEntrega = motivoNoEntrega;
    }
  }

  // Si es entregado, marcar como completado
  if (nuevoEstado === EstadoEntrega.ENTREGADO) {
    updateData.estado = 'ENTREGADO';
  }

  // Actualizar orden y crear historial
  const [ordenActualizada] = await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: {
          include: {
            product: {
              include: {
                imagenes: true,
              },
            },
          },
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        historialEstados: {
          orderBy: { createdAt: 'desc' },
        },
      },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId,
        estadoAnterior: order.estadoEntrega,
        estadoNuevo: nuevoEstado,
        cambiadoPor,
        notas,
      },
    }),
  ]);

  return ordenActualizada;
}

export async function confirmarRecepcion(params: {
  orderId: string;
  usuarioId: string;
}) {
  const { orderId, usuarioId } = params;

  // Verificar que la orden pertenece al usuario
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      usuarioId,
    },
  });

  if (!order) {
    throw new Error('Orden no encontrada');
  }

  if (order.confirmoRecepcion) {
    throw new Error('Ya confirmaste la recepción de este pedido');
  }

  if (order.estadoEntrega === EstadoEntrega.CANCELADO) {
    throw new Error('No puedes confirmar una orden cancelada');
  }

  // Si hay 2 intentos fallidos, cambiar a retiro en local
  if (order.intentosEntrega >= 2 && order.estadoEntrega === EstadoEntrega.VISITADO_NO_ENTREGADO) {
    return prisma.order.update({
      where: { id: orderId },
      data: {
        estadoEntrega: EstadoEntrega.RETIRO_EN_LOCAL,
        confirmoRecepcion: true,
        fechaConfirmacion: new Date(),
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                imagenes: true,
              },
            },
          },
        },
        historialEstados: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  // Confirmar recepción normal
  const ordenActualizada = await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        confirmoRecepcion: true,
        fechaConfirmacion: new Date(),
        estadoEntrega: EstadoEntrega.ENTREGADO,
        estado: 'ENTREGADO',
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                imagenes: true,
              },
            },
          },
        },
        historialEstados: {
          orderBy: { createdAt: 'desc' },
        },
      },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId,
        estadoAnterior: order.estadoEntrega,
        estadoNuevo: EstadoEntrega.ENTREGADO,
        cambiadoPor: usuarioId,
        notas: 'Cliente confirmó recepción del pedido',
      },
    }),
  ]);

  return ordenActualizada[0];
}

export async function obtenerTracking(orderId: string, usuarioId?: string) {
  const where: any = { id: orderId };
  if (usuarioId) {
    where.usuarioId = usuarioId;
  }

  const order = await prisma.order.findFirst({
    where,
    include: {
      items: {
        include: {
          product: {
            include: {
              imagenes: true,
            },
          },
        },
      },
      usuario: {
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
        },
      },
      historialEstados: {
        orderBy: { createdAt: 'desc' },
      },
      payment: true,
    },
  });

  if (!order) {
    throw new Error('Orden no encontrada');
  }

  // Enrich with CMS status timeline data
  return {
    ...order,
    // New expanded tracking fields
    cmsStatus: order.cmsStatus,
    fulfillmentType: (order as any).fulfillmentType,
    trackingNumber: (order as any).trackingNumber,
    courierName: (order as any).courierName,
    shippingNotes: (order as any).shippingNotes,
    paymentApprovedAt: (order as any).paymentApprovedAt,
    preparingStartedAt: (order as any).preparingStartedAt,
    readyForShippingAt: (order as any).readyForShippingAt,
    readyForPickupAt: (order as any).readyForPickupAt,
    shippedAt: (order as any).shippedAt,
    deliveredAt: (order as any).deliveredAt,
    cancellationReason: (order as any).cancellationReason,
    // Factura PDF - solo disponible si el cliente confirmó recepción
    facturaUrl: order.confirmoRecepcion ? (order as any).facturaUrl : null,
  };
}
