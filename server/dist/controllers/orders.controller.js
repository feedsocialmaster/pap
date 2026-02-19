import { prisma } from '../prisma.js';
export async function listOrders(req, res) {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    const estado = req.query.estado;
    const where = estado ? { estado } : {};
    const [total, data] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { fecha: 'desc' },
            include: { items: true, payment: true, usuario: { select: { id: true, email: true, nombre: true, apellido: true, telefono: true } } },
        }),
    ]);
    res.json({ success: true, data, total, page, totalPages: Math.ceil(total / pageSize) });
}
export async function getOrder(req, res) {
    const { id } = req.params;
    const order = await prisma.order.findUnique({ where: { id }, include: { items: { include: { product: { include: { imagenes: true } } } }, payment: true, usuario: { select: { id: true, email: true, nombre: true, apellido: true, telefono: true } } } });
    if (!order)
        return res.status(404).json({ success: false, error: 'Orden no encontrada' });
    res.json({ success: true, data: order });
}
export async function listMyOrders(req, res) {
    const userId = req.user.id;
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    const where = { usuarioId: userId };
    const [total, orders] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { fecha: 'desc' },
            include: { items: { include: { product: { include: { imagenes: true } } } }, payment: true },
        }),
    ]);
    // Devolver facturaUrl siempre que exista (subida desde CMS)
    const data = orders.map(order => ({
        ...order,
        facturaUrl: order.facturaUrl ?? null,
    }));
    res.json({ success: true, data, total, page, totalPages: Math.ceil(total / pageSize) });
}
export async function getMyOrder(req, res) {
    const userId = req.user.id;
    const { id } = req.params;
    const order = await prisma.order.findFirst({
        where: { id, usuarioId: userId },
        include: { items: { include: { product: { include: { imagenes: true } } } }, payment: true },
    });
    if (!order)
        return res.status(404).json({ success: false, error: 'Orden no encontrada' });
    res.json({ success: true, data: order });
}
