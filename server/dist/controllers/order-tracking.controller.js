import { EstadoEntrega } from '@prisma/client';
import { actualizarEstadoEntrega, confirmarRecepcion, obtenerTracking, } from '../services/order-tracking.service.js';
export const actualizarEstadoEntregaHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const { estadoEntrega, notas, motivoNoEntrega } = req.body;
        if (!Object.values(EstadoEntrega).includes(estadoEntrega)) {
            return res.status(400).json({ error: 'Estado de entrega inválido' });
        }
        const orden = await actualizarEstadoEntrega({
            orderId: id,
            nuevoEstado: estadoEntrega,
            cambiadoPor: req.user.id,
            notas,
            motivoNoEntrega,
        });
        res.json({ success: true, data: orden });
    }
    catch (error) {
        console.error('Error al actualizar estado de entrega:', error);
        res.status(400).json({ error: error.message || 'Error al actualizar estado de entrega' });
    }
};
export const confirmarRecepcionHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.user.id;
        const orden = await confirmarRecepcion({
            orderId: id,
            usuarioId,
        });
        res.json({ success: true, data: orden });
    }
    catch (error) {
        console.error('Error al confirmar recepción:', error);
        res.status(400).json({ error: error.message || 'Error al confirmar recepción' });
    }
};
export const obtenerTrackingHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.user.id;
        const orden = await obtenerTracking(id, usuarioId);
        res.json({ success: true, data: orden });
    }
    catch (error) {
        console.error('Error al obtener tracking:', error);
        res.status(404).json({ error: error.message || 'Orden no encontrada' });
    }
};
