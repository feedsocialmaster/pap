import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireCMSAccess } from '../middleware/cms-auth.js';
import { getVariants, createVariant, updateVariant, deleteVariant, bulkUpdateVariants, } from '../controllers/variants.controller.js';
const router = Router({ mergeParams: true }); // mergeParams para acceder a :productId
// Todas las rutas requieren autenticación CMS
router.use(requireAuth, requireCMSAccess());
// CRUD de variantes de producto
router.get('/', getVariants);
router.post('/', createVariant);
router.post('/bulk', bulkUpdateVariants);
router.put('/:variantId', updateVariant);
router.delete('/:variantId', deleteVariant);
export default router;
