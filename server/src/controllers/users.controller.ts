import { Response } from 'express';
import { AuthedRequest } from '../middleware/auth.js';
import { prisma } from '../prisma.js';

/**
 * Obtener beneficios exclusivos del usuario
 * Retorna cupones y productos premium disponibles
 */
export const getBeneficiosExclusivos = async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Obtener cupones exclusivos del usuario
    const cupones = await prisma.cMSCodigoPromocional.findMany({
      where: {
        activo: true,
        OR: [
          { usuariosPermitidos: { has: userId } },
          { usuariosPermitidos: { isEmpty: true } }
        ]
      },
      select: {
        id: true,
        codigo: true,
        descripcion: true,
        descuento: true,
        tipoDescuento: true,
        fechaInicio: true,
        fechaFin: true,
        usosMaximos: true,
        usosActuales: true,
        activo: true
      }
    });

    // Filtrar cupones válidos por fecha y usos
    const now = new Date();
    const cuponesValidos = cupones.filter(cupon => {
      const fechaValida = (!cupon.fechaInicio || cupon.fechaInicio <= now) &&
                         (!cupon.fechaFin || cupon.fechaFin >= now);
      const usosDisponibles = !cupon.usosMaximos || cupon.usosActuales < cupon.usosMaximos;
      return fechaValida && usosDisponibles;
    });

    // Productos premium: funcionalidad removida
    const productosPremium: any[] = [];

    res.json({
      cupones: cuponesValidos,
      productosPremium,
      totalCupones: cuponesValidos.length,
      totalProductosPremium: productosPremium.length
    });
  } catch (error) {
    console.error('Error al obtener beneficios exclusivos:', error);
    res.status(500).json({ error: 'Error al obtener beneficios exclusivos' });
  }
};
