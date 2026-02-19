import { Request, Response, NextFunction } from 'express';
import { orderManagementService } from '../services/order-management.service.js';
import { CMSOrderStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import path from 'path';
import fs from 'fs';

/**
 * Schema de validación para actualización de estado de orden
 */
const updateOrderStatusSchema = z.object({
  newStatus: z.enum([
    'PENDING',
    'PAYMENT_REJECTED', 
    'PAYMENT_APPROVED',
    'PREPARING',
    'READY_FOR_SHIPPING',
    'READY_FOR_PICKUP',
    'IN_TRANSIT',
    'DELIVERED',
    'NOT_DELIVERED',
    'CANCELLED'
  ]),
  deliveryReason: z.string().optional(),
  cancellationReason: z.string().optional(),
  trackingNumber: z.string().optional(),
  courierName: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Obtiene ventas realizadas con filtros
 * GET /api/cms/ventas/realizadas
 */
export async function getVentasRealizadas(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to, status, limit, offset } = req.query;

    const params: any = {
      limit: limit ? parseInt(limit as string, 10) : 50,
      offset: offset ? parseInt(offset as string, 10) : 0,
    };

    if (from) {
      params.from = new Date(from as string);
    }

    if (to) {
      params.to = new Date(to as string);
    }

    if (status) {
      const statusArray = Array.isArray(status) ? status : [status];
      params.status = statusArray as CMSOrderStatus[];
    }

    const result = await orderManagementService.getSales(params);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}


/**
 * Obtiene pedidos realizados
 * GET /api/cms/pedidos/realizados
 */
export async function getPedidosRealizados(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to, limit, offset } = req.query;

    const params: any = {
      status: ['DELIVERED'],
      limit: limit ? parseInt(limit as string, 10) : 50,
      offset: offset ? parseInt(offset as string, 10) : 0,
    };

    if (from) {
      params.from = new Date(from as string);
    }

    if (to) {
      params.to = new Date(to as string);
    }

    const result = await orderManagementService.getSales(params);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtiene pedidos pendientes
 * GET /api/cms/pedidos/pendientes
 */
export async function getPedidosPendientes(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to, limit, offset } = req.query;

    const params: any = {
      status: ['PENDING'],
      limit: limit ? parseInt(limit as string, 10) : 100,
      offset: offset ? parseInt(offset as string, 10) : 0,
    };

    if (from) {
      params.from = new Date(from as string);
    }

    if (to) {
      params.to = new Date(to as string);
    }

    const result = await orderManagementService.getSales(params);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Actualiza el estado de un pedido
 * PATCH /api/cms/pedidos/:id
 */
export async function updatePedidoStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    
    // Validar datos de entrada
    const validation = updateOrderStatusSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: validation.error.errors,
      });
    }

    const { newStatus, deliveryReason, cancellationReason, trackingNumber, courierName, notes } = validation.data;

    // Verificar que el usuario tenga permisos (CMS admin, manager o vendedor)
    const user = (req as any).user;
    if (!user || !['ADMIN_CMS', 'DUENA', 'SUPER_SU', 'VENDEDOR', 'GERENTE_COMERCIAL'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para realizar esta acción',
      });
    }

    const result = await orderManagementService.updateOrderStatus({
      orderId: id,
      newStatus: newStatus as CMSOrderStatus,
      deliveryReason,
      cancellationReason,
      trackingNumber,
      courierName,
      changedBy: user.id,
      changedByEmail: user.email,
      notes,
    });

    res.json(result);
  } catch (error: any) {
    if (error.message.includes('Conflicto de concurrencia')) {
      return res.status(409).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message.includes('No se puede modificar') || error.message.includes('Transición no permitida') || error.message.includes('obligatorio')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message.includes('Orden no encontrada')) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    next(error);
  }
}

/**
 * Obtiene un pedido específico con su auditoría y transiciones disponibles
 * GET /api/cms/pedidos/:id
 */
export async function getPedidoById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const [order, audit, transitions] = await Promise.all([
      orderManagementService.getOrderById(id),
      orderManagementService.getOrderAudit(id),
      orderManagementService.getAvailableTransitionsForOrder(id).catch(() => null),
    ]);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Pedido no encontrado',
      });
    }

    res.json({
      success: true,
      data: {
        order,
        audit,
        transitions,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtiene estadísticas del dashboard
 * GET /api/cms/dashboard/stats
 */
export async function getDashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await orderManagementService.getDashboardStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}


/**
 * Aprueba un pedido (cambia estado a PAYMENT_APPROVED)
 * POST /api/cms/pedidos/:id/approve
 */
export async function approveOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    // Verificar que el usuario tenga permisos
    const user = (req as any).user;
    if (!user || !['ADMIN_CMS', 'DUENA', 'SUPER_SU'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para realizar esta acción',
      });
    }

    const result = await orderManagementService.updateOrderStatus({
      orderId: id,
      newStatus: 'PAYMENT_APPROVED',
      changedBy: user.id,
      changedByEmail: user.email,
      notes,
    });

    res.json(result);
  } catch (error: any) {
    if (error.message.includes('Conflicto de concurrencia')) {
      return res.status(409).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message.includes('No se puede modificar')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    next(error);
  }
}

/**
 * Rechaza un pedido
 * POST /api/cms/pedidos/:id/reject
 */
export async function rejectOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body;

    // Verificar que el usuario tenga permisos
    const user = (req as any).user;
    if (!user || !['ADMIN_CMS', 'DUENA', 'SUPER_SU'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para realizar esta acción',
      });
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'El motivo de rechazo es obligatorio',
      });
    }

    const result = await orderManagementService.rejectOrder({
      orderId: id,
      reason: reason.trim(),
      changedBy: user.id,
      changedByEmail: user.email,
      notes,
    });

    res.json(result);
  } catch (error: any) {
    if (error.message.includes('Conflicto de concurrencia')) {
      return res.status(409).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message.includes('No se puede modificar') || error.message.includes('No se puede rechazar')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    next(error);
  }
}

/**
 * Obtiene las transiciones disponibles para un pedido
 * GET /api/cms/pedidos/:id/transitions
 */
export async function getOrderTransitions(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const transitions = await orderManagementService.getAvailableTransitionsForOrder(id);

    res.json({
      success: true,
      data: transitions,
    });
  } catch (error: any) {
    if (error.message.includes('Orden no encontrada')) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
}

/**
 * Obtiene pedidos en proceso (todos los estados intermedios)
 * GET /api/cms/pedidos/en-proceso
 */
export async function getPedidosEnProceso(req: Request, res: Response, next: NextFunction) {
  try {
    const { limit, offset } = req.query;

    const params: any = {
      status: [
        'PAYMENT_APPROVED',
        'PREPARING',
        'READY_FOR_SHIPPING',
        'READY_FOR_PICKUP',
        'IN_TRANSIT',
      ] as CMSOrderStatus[],
      limit: limit ? parseInt(limit as string, 10) : 100,
      offset: offset ? parseInt(offset as string, 10) : 0,
    };

    const result = await orderManagementService.getSales(params);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Sube una factura PDF a un pedido
 * POST /api/cms/pedidos/:id/factura
 * Requiere que el pedido esté en estado DELIVERED
 */
export async function uploadInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { facturaUrl } = req.body;

    if (!facturaUrl) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere la URL de la factura',
      });
    }

    // Verificar que el pedido existe y está en estado DELIVERED
    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, cmsStatus: true, facturaUrl: true },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Pedido no encontrado',
      });
    }

    if (order.cmsStatus !== 'DELIVERED') {
      return res.status(400).json({
        success: false,
        error: 'Solo se puede subir factura a pedidos con estado ENTREGADO',
      });
    }

    // Actualizar el pedido con la URL de la factura
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { facturaUrl },
      select: {
        id: true,
        numeroOrden: true,
        facturaUrl: true,
        cmsStatus: true,
      },
    });

    res.json({
      success: true,
      data: updatedOrder,
      message: 'Factura subida correctamente',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Elimina la factura PDF de un pedido
 * DELETE /api/cms/pedidos/:id/factura
 */
export async function deleteInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    // Obtener el pedido con la factura actual
    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, facturaUrl: true },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Pedido no encontrado',
      });
    }

    if (!order.facturaUrl) {
      return res.status(400).json({
        success: false,
        error: 'Este pedido no tiene factura asignada',
      });
    }

    // Intentar eliminar el archivo físico
    try {
      const filename = order.facturaUrl.replace('/uploads/', '');
      const uploadDir = path.join(process.cwd(), 'src', 'uploads');
      const filePath = path.join(uploadDir, filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      console.warn('No se pudo eliminar el archivo físico:', fileError);
      // Continuamos aunque no se pueda eliminar el archivo
    }

    // Actualizar el pedido removiendo la URL de la factura
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { facturaUrl: null },
      select: {
        id: true,
        numeroOrden: true,
        facturaUrl: true,
        cmsStatus: true,
      },
    });

    res.json({
      success: true,
      data: updatedOrder,
      message: 'Factura eliminada correctamente',
    });
  } catch (error) {
    next(error);
  }
}
