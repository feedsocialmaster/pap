import { prisma } from '../../prisma.js';
import { startOfDay, endOfDay } from 'date-fns';
export const getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        const startToday = startOfDay(today);
        const endToday = endOfDay(today);
        // Ventas de hoy
        const ventasHoy = await prisma.order.count({
            where: {
                fecha: {
                    gte: startToday,
                    lte: endToday,
                },
                estado: { not: 'CANCELADO' },
            },
        });
        // Ingresos de hoy
        const ingresosHoy = await prisma.order.aggregate({
            where: {
                fecha: {
                    gte: startToday,
                    lte: endToday,
                },
                estado: { not: 'CANCELADO' },
            },
            _sum: {
                total: true,
            },
        });
        // Órdenes pendientes
        const ordenesPendientes = await prisma.order.count({
            where: {
                estado: 'EN_PROCESO',
            },
        });
        // Productos con stock bajo (menos de 5)
        const productosFaltantes = await prisma.product.count({
            where: {
                stock: {
                    lt: 5,
                    gt: 0,
                },
            },
        });
        // Productos sin stock
        const productosSinStock = await prisma.product.count({
            where: {
                stock: 0,
            },
        });
        // Actividad reciente
        const actividadReciente = await prisma.cMSAuditLog.findMany({
            take: 10,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                usuario: {
                    select: {
                        nombre: true,
                        apellido: true,
                        email: true,
                    },
                },
            },
        });
        res.json({
            stats: {
                ventasHoy,
                ingresosHoy: ingresosHoy._sum.total || 0,
                ordenesPendientes,
                productosFaltantes,
                productosSinStock,
            },
            actividadReciente: actividadReciente.map((log) => ({
                id: log.id,
                usuario: `${log.usuario.nombre} ${log.usuario.apellido}`,
                accion: log.accion,
                entidad: log.entidad,
                fecha: log.createdAt,
            })),
        });
    }
    catch (error) {
        console.error('Error obteniendo estadísticas del dashboard:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas del dashboard' });
    }
};
export const getServerTime = async (req, res) => {
    try {
        // GMT-3 (Argentina timezone)
        const serverTime = new Date();
        res.json({
            serverTime: serverTime.toISOString(),
            timezone: 'GMT-3',
            formatted: serverTime.toLocaleString('es-AR', {
                timeZone: 'America/Argentina/Buenos_Aires',
            }),
        });
    }
    catch (error) {
        console.error('Error obteniendo hora del servidor:', error);
        res.status(500).json({ error: 'Error al obtener hora del servidor' });
    }
};
