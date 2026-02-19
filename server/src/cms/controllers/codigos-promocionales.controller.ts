import { Response } from 'express';
import { AuthedRequest } from '../../middleware/auth.js';
import { prisma } from '../../prisma.js';

// Obtener todos los códigos promocionales
export const getCodigosPromocionales = async (req: AuthedRequest, res: Response) => {
  try {
    const codigos = await prisma.cMSCodigoPromocional.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ codigos });
  } catch (error) {
    console.error('Error al obtener códigos:', error);
    res.status(500).json({ error: 'Error al obtener códigos promocionales' });
  }
};

// Crear nuevo código promocional
export const crearCodigoPromocional = async (req: AuthedRequest, res: Response) => {
  try {
    const { 
      codigo, 
      descuento, 
      tipoDescuento,
      tipoBundle,
      combinable,
      exclusivoConPromociones,
      activo 
    } = req.body;

    // Validación: requerir código
    if (!codigo) {
      return res.status(400).json({ error: 'El código es requerido' });
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

    if (tieneDescuento && (descuento < 1 || descuento > 100)) {
      return res.status(400).json({ error: 'El descuento debe estar entre 1 y 100%' });
    }

    // Verificar si el código ya existe
    const codigoExistente = await prisma.cMSCodigoPromocional.findUnique({
      where: { codigo: codigo.toUpperCase() },
    });

    if (codigoExistente) {
      return res.status(400).json({ error: 'Este código ya existe' });
    }

    // Crear código
    const nuevoCodigo = await prisma.cMSCodigoPromocional.create({
      data: {
        codigo: codigo.toUpperCase(),
        descuento: tieneDescuento ? parseInt(descuento) : null,
        tipoDescuento: tipoDescuento || 'PORCENTAJE',
        tipoBundle: tieneBundle ? tipoBundle : null,
        combinable: combinable || false,
        exclusivoConPromociones: exclusivoConPromociones || false,
        activo: esActivo,
      },
    });

    // Emitir evento WebSocket para refrescar promociones
    const { getWebSocketService } = await import('../../services/websocket.service.js');
    const wsService = getWebSocketService();
    if (wsService) {
      wsService.emitPromocionesRefresh();
    }

    res.status(201).json(nuevoCodigo);
  } catch (error) {
    console.error('Error al crear código:', error);
    res.status(500).json({ error: 'Error al crear código promocional' });
  }
};

// Eliminar código promocional
export const eliminarCodigoPromocional = async (req: AuthedRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.cMSCodigoPromocional.delete({
      where: { id },
    });

    // Emitir evento WebSocket para refrescar promociones
    const { getWebSocketService } = await import('../../services/websocket.service.js');
    const wsService = getWebSocketService();
    if (wsService) {
      wsService.emitPromocionesRefresh();
    }

    res.json({ message: 'Código eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar código:', error);
    res.status(500).json({ error: 'Error al eliminar código' });
  }
};

// Toggle activo/inactivo
export const toggleActivo = async (req: AuthedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const codigo = await prisma.cMSCodigoPromocional.findUnique({
      where: { id },
    });

    if (!codigo) {
      return res.status(404).json({ error: 'Código no encontrado' });
    }

    const codigoActualizado = await prisma.cMSCodigoPromocional.update({
      where: { id },
      data: { activo: !codigo.activo },
    });

    // Emitir evento WebSocket para refrescar promociones
    const { getWebSocketService } = await import('../../services/websocket.service.js');
    const wsService = getWebSocketService();
    if (wsService) {
      wsService.emitPromocionesRefresh();
    }

    res.json(codigoActualizado);
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
};

// Validar código promocional (ruta pública para el carrito)
export const validarCodigo = async (req: AuthedRequest, res: Response) => {
  try {
    const { codigo } = req.body;

    if (!codigo) {
      return res.status(400).json({ error: 'Código requerido' });
    }

    const codigoPromocional = await prisma.cMSCodigoPromocional.findUnique({
      where: {
        codigo: codigo.toUpperCase(),
      },
    });

    if (!codigoPromocional || !codigoPromocional.activo) {
      return res.status(404).json({ error: 'Código no válido' });
    }

    res.json({
      valido: true,
      descuento: codigoPromocional.descuento,
    });
  } catch (error) {
    console.error('Error al validar código:', error);
    res.status(500).json({ error: 'Error al validar código' });
  }
};
