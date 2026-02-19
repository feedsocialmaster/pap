import { Router } from 'express';
import { getVentasRealizadas, getPedidosRealizados, getPedidosPendientes, getPedidosEnProceso, updatePedidoStatus, getPedidoById, getDashboardStats, approveOrder, rejectOrder, getOrderTransitions, uploadInvoice, deleteInvoice, } from '../controllers/cms-orders.controller.js';
import { verifyCMSAuth } from '../middleware/cms-auth.middleware.js';
const router = Router();
// Todas las rutas requieren autenticación CMS
router.use(verifyCMSAuth);
// Rutas de ventas
router.get('/ventas/realizadas', getVentasRealizadas);
// Rutas de pedidos
router.get('/pedidos/pendientes', getPedidosPendientes);
router.get('/pedidos/realizados', getPedidosRealizados);
router.get('/pedidos/en-proceso', getPedidosEnProceso);
router.get('/pedidos/:id', getPedidoById);
router.get('/pedidos/:id/transitions', getOrderTransitions);
router.patch('/pedidos/:id', updatePedidoStatus);
// Nuevas rutas para aprobar/rechazar
router.post('/pedidos/:id/approve', approveOrder);
router.post('/pedidos/:id/reject', rejectOrder);
// Rutas de factura
router.post('/pedidos/:id/factura', uploadInvoice);
router.delete('/pedidos/:id/factura', deleteInvoice);
// Rutas de dashboard
router.get('/dashboard/stats', getDashboardStats);
export default router;
