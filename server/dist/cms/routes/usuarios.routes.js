import { Router } from 'express';
import { cmsAuth } from '../middleware/cms-auth.js';
import { requireAuth } from '../../middleware/auth.js';
import { getUsuarios, getUsuarioPorId, crearUsuario, actualizarUsuario, eliminarUsuario, cambiarEstadoUsuario, getHistorialCompras, } from '../controllers/usuarios.controller.js';
import { authorizeUserDelete, authorizeUserEdit, authorizeUserCreate, authorizeUserView, } from '../middleware/user-permissions.middleware.js';
const router = Router();
// Todas las rutas requieren autenticación JWT y luego verificación de rol CMS
router.use(requireAuth);
router.use(cmsAuth);
// Obtener todos los usuarios con filtros
router.get('/', getUsuarios);
// Obtener usuario por ID (con validación de permisos de visualización)
router.get('/:id', authorizeUserView, getUsuarioPorId);
// Crear nuevo usuario (con validación de permisos de creación)
router.post('/', authorizeUserCreate, crearUsuario);
// Actualizar usuario (con validación de permisos de edición)
router.put('/:id', authorizeUserEdit, actualizarUsuario);
// Eliminar usuario (con validación de permisos de eliminación)
router.delete('/:id', authorizeUserDelete, eliminarUsuario);
// Cambiar estado de usuario (suspender, activar, inhabilitar) - usa mismas reglas que edición
router.patch('/:id/estado', authorizeUserEdit, cambiarEstadoUsuario);
// Obtener historial de compras (con validación de permisos de visualización)
router.get('/:id/historial', authorizeUserView, getHistorialCompras);
export default router;
