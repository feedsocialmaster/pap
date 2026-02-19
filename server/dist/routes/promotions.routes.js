import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
const router = Router();
router.get('/', async (_req, res) => {
    const promos = await prisma.promotion.findMany({ orderBy: { orden: 'asc' } });
    res.json({ success: true, data: promos });
});
router.post('/', requireAuth, requireRole('ADMIN_CMS', 'SUPER_SU'), async (req, res) => {
    console.log('📝 Creando nuevo banner con datos:', req.body);
    const promo = await prisma.promotion.create({ data: req.body });
    console.log('✅ Banner creado exitosamente:', promo);
    res.status(201).json({ success: true, data: promo });
});
router.put('/:id', requireAuth, requireRole('ADMIN_CMS', 'SUPER_SU'), async (req, res) => {
    const { id } = req.params;
    console.log(`🔄 Actualizando banner ID: ${id} con datos:`, req.body);
    const promo = await prisma.promotion.update({ where: { id }, data: req.body });
    console.log('✅ Banner actualizado exitosamente:', promo);
    res.json({ success: true, data: promo });
});
router.delete('/:id', requireAuth, requireRole('ADMIN_CMS', 'SUPER_SU'), async (req, res) => {
    const { id } = req.params;
    await prisma.promotion.delete({ where: { id } });
    res.json({ success: true });
});
export default router;
