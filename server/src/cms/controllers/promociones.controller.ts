import { Response } from 'express';
import { AuthedRequest } from '../../middleware/auth.js';
import { prisma } from '../../prisma.js';
import { slugify } from '../../util/slugify.js';

// Obtener todas las promociones con filtros
export const getPromociones = async (req: AuthedRequest, res: Response) => {
  try {
    const { 
      activo,
      destacado,
      vigente,
      pagina = '1',
      limite = '20'
    } = req.query;

    const skip = (parseInt(pagina as string) - 1) * parseInt(limite as string);
    const take = parseInt(limite as string);

    const where: any = {};

    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    if (destacado !== undefined) {
      where.destacado = destacado === 'true';
    }

    // Filtrar solo promociones vigentes
    if (vigente === 'true') {
      const ahora = new Date();
      where.fechaInicio = { lte: ahora };
      where.fechaFin = { gte: ahora };
      where.activo = true;
    }

    const [promociones, total] = await Promise.all([
      prisma.cMSPromocion.findMany({
        where,
        skip,
        take,
        orderBy: [
          { destacado: 'desc' },
          { orden: 'asc' },
          { fechaInicio: 'desc' }
        ],
      }),
      prisma.cMSPromocion.count({ where }),
    ]);

    const totalPaginas = Math.ceil(total / take);

    res.json({
      promociones,
      paginacion: {
        pagina: parseInt(pagina as string),
        limite: take,
        total,
        totalPaginas,
      },
    });
  } catch (error) {
    console.error('Error al obtener promociones:', error);
    res.status(500).json({ error: 'Error al obtener promociones' });
  }
};

// Obtener promoción por ID
export const getPromocionPorId = async (req: AuthedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const promocion = await prisma.cMSPromocion.findUnique({
      where: { id },
    });

    if (!promocion) {
      return res.status(404).json({ error: 'Promoción no encontrada' });
    }

    res.json(promocion);
  } catch (error) {
    console.error('Error al obtener promoción:', error);
    res.status(500).json({ error: 'Error al obtener promoción' });
  }
};

// Crear nueva promoción
export const crearPromocion = async (req: AuthedRequest, res: Response) => {
  try {
    const {
      titulo,
      descripcion,
      imagenUrl,
      tipoDescuento,
      valorDescuento,
      leyendaPersonalizada,
      fechaInicio,
      fechaFin,
      activo,
      compraMinima,
      productosAplicables,
      tiposCalzadoAplicables,
      usosMaximos,
      usosPorUsuario,
      destacado,
      orden,
      colorFondo,
      colorTexto,
      exclusivaConCodigos,
    } = req.body;

    // Validaciones
    if (!titulo || !descripcion || !tipoDescuento || valorDescuento === undefined || !fechaInicio || !fechaFin) {
      return res.status(400).json({ 
        error: 'Título, descripción, tipo de descuento, valor, fecha inicio y fecha fin son obligatorios' 
      });
    }

    if (!['PORCENTAJE', 'MONTO_FIJO', 'DOS_POR_UNO'].includes(tipoDescuento)) {
      return res.status(400).json({ error: 'Tipo de descuento inválido' });
    }

    if (tipoDescuento === 'PORCENTAJE' && (valorDescuento < 1 || valorDescuento > 100)) {
      return res.status(400).json({ error: 'El porcentaje debe estar entre 1 y 100' });
    }

    if (tipoDescuento === 'MONTO_FIJO' && valorDescuento < 0) {
      return res.status(400).json({ error: 'El monto fijo debe ser positivo' });
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (fin <= inicio) {
      return res.status(400).json({ error: 'La fecha de fin debe ser posterior a la fecha de inicio' });
    }

    // Generar slug único
    let slug = slugify(titulo);
    const existeSlug = await prisma.cMSPromocion.findUnique({ where: { slug } });
    
    if (existeSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const promocion = await prisma.cMSPromocion.create({
      data: {
        titulo,
        slug,
        descripcion,
        imagenUrl,
        tipoDescuento,
        valorDescuento: tipoDescuento === 'MONTO_FIJO' ? Math.round(valorDescuento * 100) : valorDescuento,
        leyendaPersonalizada: leyendaPersonalizada || null,
        fechaInicio: inicio,
        fechaFin: fin,
        activo: activo !== undefined ? activo : true,
        compraMinima: compraMinima ? Math.round(compraMinima * 100) : null,
        productosAplicables: productosAplicables || [],
        tiposCalzadoAplicables: tiposCalzadoAplicables || [],
        usosMaximos,
        usosPorUsuario,
        destacado: destacado || false,
        exclusivaConCodigos: exclusivaConCodigos || false,
        orden: orden || 0,
        colorFondo,
        colorTexto,
        createdBy: req.user?.id,
      },
    });

    // Registrar en auditoría
    if (req.user?.id) {
      await prisma.cMSAuditLog.create({
        data: {
          usuarioId: req.user.id,
          accion: 'CREAR_PROMOCION',
          entidad: 'CMSPromocion',
          entidadId: promocion.id,
          cambios: { titulo: promocion.titulo },
        },
      });
    }

    // Emitir evento WebSocket para refrescar promociones
    const { getWebSocketService } = await import('../../services/websocket.service.js');
    const wsService = getWebSocketService();
    if (wsService) {
      wsService.emitPromocionesRefresh();
    }

    res.status(201).json(promocion);
  } catch (error) {
    console.error('Error al crear promoción:', error);
    res.status(500).json({ error: 'Error al crear promoción' });
  }
};

// Actualizar promoción
export const actualizarPromocion = async (req: AuthedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      descripcion,
      imagenUrl,
      tipoDescuento,
      valorDescuento,
      leyendaPersonalizada,
      fechaInicio,
      fechaFin,
      activo,
      compraMinima,
      productosAplicables,
      tiposCalzadoAplicables,
      usosMaximos,
      usosPorUsuario,
      destacado,
      orden,
      colorFondo,
      colorTexto,
      exclusivaConCodigos,
    } = req.body;

    const promocionExistente = await prisma.cMSPromocion.findUnique({ where: { id } });

    if (!promocionExistente) {
      return res.status(404).json({ error: 'Promoción no encontrada' });
    }

    // Validaciones
    if (tipoDescuento && !['PORCENTAJE', 'MONTO_FIJO', 'DOS_POR_UNO'].includes(tipoDescuento)) {
      return res.status(400).json({ error: 'Tipo de descuento inválido' });
    }

    if (tipoDescuento === 'PORCENTAJE' && valorDescuento !== undefined && (valorDescuento < 1 || valorDescuento > 100)) {
      return res.status(400).json({ error: 'El porcentaje debe estar entre 1 y 100' });
    }

    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);

      if (fin <= inicio) {
        return res.status(400).json({ error: 'La fecha de fin debe ser posterior a la fecha de inicio' });
      }
    }

    // Generar nuevo slug si cambió el título
    let slug = promocionExistente.slug;
    if (titulo && titulo !== promocionExistente.titulo) {
      slug = slugify(titulo);
      const existeSlug = await prisma.cMSPromocion.findFirst({ 
        where: { slug, id: { not: id } } 
      });
      
      if (existeSlug) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    const updateData: any = {
      titulo,
      slug,
      descripcion,
      imagenUrl,
      tipoDescuento,
      leyendaPersonalizada,
      activo,
      compraMinima: compraMinima !== undefined ? (compraMinima ? Math.round(compraMinima * 100) : null) : undefined,
      productosAplicables,
      tiposCalzadoAplicables,
      usosMaximos,
      usosPorUsuario,
      destacado,
      exclusivaConCodigos,
      orden,
      colorFondo,
      colorTexto,
    };

    if (fechaInicio) updateData.fechaInicio = new Date(fechaInicio);
    if (fechaFin) updateData.fechaFin = new Date(fechaFin);

    if (valorDescuento !== undefined) {
      const tipoActual = tipoDescuento || promocionExistente.tipoDescuento;
      updateData.valorDescuento = tipoActual === 'MONTO_FIJO' ? Math.round(valorDescuento * 100) : valorDescuento;
    }

    // Limpiar valores undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const promocion = await prisma.cMSPromocion.update({
      where: { id },
      data: updateData,
    });

    // Registrar en auditoría
    if (req.user?.id) {
      await prisma.cMSAuditLog.create({
        data: {
          usuarioId: req.user.id,
          accion: 'ACTUALIZAR_PROMOCION',
          entidad: 'CMSPromocion',
          entidadId: promocion.id,
          cambios: updateData,
        },
      });
    }

    // Emitir evento WebSocket para refrescar promociones
    const { getWebSocketService } = await import('../../services/websocket.service.js');
    const wsService = getWebSocketService();
    if (wsService) {
      wsService.emitPromocionesRefresh();
    }

    res.json(promocion);
  } catch (error) {
    console.error('Error al actualizar promoción:', error);
    res.status(500).json({ error: 'Error al actualizar promoción' });
  }
};

// Eliminar promoción
export const eliminarPromocion = async (req: AuthedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const promocion = await prisma.cMSPromocion.findUnique({ where: { id } });

    if (!promocion) {
      return res.status(404).json({ error: 'Promoción no encontrada' });
    }

    // Verificar si tiene usos registrados
    const usos = await prisma.cMSUsoPromocion.count({
      where: { promocionId: id }
    });

    if (usos > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar la promoción porque tiene usos registrados. Puedes desactivarla en su lugar.' 
      });
    }

    await prisma.cMSPromocion.delete({ where: { id } });

    // Registrar en auditoría
    if (req.user?.id) {
      await prisma.cMSAuditLog.create({
        data: {
          usuarioId: req.user.id,
          accion: 'ELIMINAR_PROMOCION',
          entidad: 'CMSPromocion',
          entidadId: id,
          cambios: { titulo: promocion.titulo },
        },
      });
    }

    // Emitir evento WebSocket para refrescar promociones
    const { getWebSocketService } = await import('../../services/websocket.service.js');
    const wsService = getWebSocketService();
    if (wsService) {
      wsService.emitPromocionesRefresh();
    }

    res.json({ mensaje: 'Promoción eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar promoción:', error);
    res.status(500).json({ error: 'Error al eliminar promoción' });
  }
};

// Alternar estado activo
export const toggleActivo = async (req: AuthedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const promocion = await prisma.cMSPromocion.findUnique({ where: { id } });

    if (!promocion) {
      return res.status(404).json({ error: 'Promoción no encontrada' });
    }

    const actualizada = await prisma.cMSPromocion.update({
      where: { id },
      data: { activo: !promocion.activo },
    });

    // Registrar en auditoría
    if (req.user?.id) {
      await prisma.cMSAuditLog.create({
        data: {
          usuarioId: req.user.id,
          accion: 'TOGGLE_PROMOCION',
          entidad: 'CMSPromocion',
          entidadId: id,
          cambios: { activo: actualizada.activo },
        },
      });
    }

    // Emitir evento WebSocket para refrescar promociones
    const { getWebSocketService } = await import('../../services/websocket.service.js');
    const wsService = getWebSocketService();
    if (wsService) {
      wsService.emitPromocionesRefresh();
    }

    res.json(actualizada);
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
};

// Obtener estadísticas
export const getEstadisticas = async (req: AuthedRequest, res: Response) => {
  try {
    const ahora = new Date();

    const [
      totalPromociones,
      promocionesActivas,
      promocionesVigentes,
      promocionesDestacadas,
      totalUsos,
    ] = await Promise.all([
      prisma.cMSPromocion.count(),
      prisma.cMSPromocion.count({ where: { activo: true } }),
      prisma.cMSPromocion.count({
        where: {
          activo: true,
          fechaInicio: { lte: ahora },
          fechaFin: { gte: ahora },
        }
      }),
      prisma.cMSPromocion.count({ where: { destacado: true } }),
      prisma.cMSUsoPromocion.count(),
    ]);

    res.json({
      totalPromociones,
      promocionesActivas,
      promocionesVigentes,
      promocionesDestacadas,
      totalUsos,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};
