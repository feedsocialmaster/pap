import { Router } from 'express';
import { validarCodigo } from '../cms/controllers/codigos-promocionales.controller.js';
const router = Router();
// Ruta pública para validar códigos promocionales en el carrito
router.post('/validar', validarCodigo);
export default router;
