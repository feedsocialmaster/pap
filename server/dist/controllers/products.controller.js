import { z } from 'zod';
import { listProducts, getProduct, createProduct, updateProduct, deleteProduct } from '../services/product.service.js';
const productSchema = z.object({
    nombre: z.string().min(1),
    descripcion: z.string().min(1),
    precio: z.number().int().nonnegative(),
    tipoCalzado: z.string().min(1),
    imagenes: z.union([
        z.array(z.string().url()),
        z.array(z.object({ url: z.string().url(), alt: z.string().optional(), orden: z.number().int().optional() }))
    ]).optional(),
    talles: z.array(z.number().int()),
    colores: z.any().optional(),
    stock: z.number().int().nonnegative(),
    enLiquidacion: z.boolean().optional(),
    porcentajeDescuento: z.number().int().min(0).max(100).optional(),
    esFiesta: z.boolean().optional(),
    impermeable: z.boolean().optional(),
    antideslizante: z.boolean().optional(),
    caracteristicas: z.array(z.string()).optional(),
    metodosPago: z.object({
        tarjetas: z.array(z.string()).optional(),
        transferenciaBancaria: z.boolean().optional(),
        mercadoPago: z.boolean().optional(),
        otros: z.array(z.string()).optional(),
    }).optional(),
});
export async function list(req, res) {
    // Validar y normalizar query params con zod
    const listQuerySchema = z.object({
        page: z.coerce.number().int().min(1).optional(),
        pageSize: z.coerce.number().int().min(1).max(100).optional(),
        sort: z.enum(['price_asc', 'price_desc', 'newest']).optional(),
        minPrice: z.coerce.number().nonnegative().optional(),
        maxPrice: z.coerce.number().nonnegative().optional(),
        stockMin: z.coerce.number().int().min(0).optional(),
        stockMax: z.coerce.number().int().min(0).optional(),
        enLiquidacion: z.string().optional(),
        search: z.string().trim().max(100).optional(),
        tipoCalzado: z.string().optional(),
        talle: z.string().optional(),
    });
    const parsed = listQuerySchema.parse(req.query);
    const page = parsed.page ?? 1;
    const pageSize = parsed.pageSize ?? 20;
    // filters from query params
    const tipoCalzadoParam = parsed.tipoCalzado?.trim();
    const talleParam = parsed.talle?.trim();
    const minPrice = parsed.minPrice;
    const maxPrice = parsed.maxPrice;
    const stockMin = parsed.stockMin;
    const stockMax = parsed.stockMax;
    const enLiquidacion = parsed.enLiquidacion != null ? ['1', 'true', 'yes'].includes(String(parsed.enLiquidacion).toLowerCase()) : undefined;
    const search = parsed.search?.trim();
    const tipoCalzado = tipoCalzadoParam ? tipoCalzadoParam.split(',').filter(Boolean) : undefined;
    const talle = talleParam ? talleParam.split(',').map((n) => Number(n)).filter((n) => !Number.isNaN(n)) : undefined;
    const sort = parsed.sort;
    const data = await listProducts({ page, pageSize, filters: { tipoCalzado, talle, minPrice, maxPrice, stockMin, stockMax, search, enLiquidacion }, sort });
    const mapped = data.data.map((p) => ({
        ...p,
        imagenes: p.imagenes
            ? p.imagenes.sort((a, b) => (a.orden || 0) - (b.orden || 0))
            : [],
        precio: p.precio,
    }));
    res.json({ success: true, data: mapped, total: data.total, page: data.page, totalPages: data.totalPages });
}
export async function getOne(req, res) {
    const id = req.params.id;
    const product = await getProduct(id);
    if (!product)
        return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    // Mapear imagenes ordenadas
    const imagenes = product.imagenes
        ? product.imagenes
            .sort((a, b) => (a.orden || 0) - (b.orden || 0))
        : [];
    // Obtener información de la promoción si el producto aplica
    let promocionActiva = null;
    if (product.aplicaPromocion && product.tipoPromocionAplica) {
        const { prisma } = await import('../prisma.js');
        const ahora = new Date();
        // Normalizar a inicio del día para la fecha actual (comparación sin horas)
        const inicioDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0);
        const finDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999);
        console.log(`🔍 [Products] Buscando promoción para producto ${product.id}`);
        console.log(`🔍 [Products] tipoPromocionAplica: ${product.tipoPromocionAplica}`);
        console.log(`🔍 [Products] Fecha actual: ${ahora.toISOString()}`);
        const promo = await prisma.cMSPromocion.findFirst({
            where: {
                id: product.tipoPromocionAplica,
                activo: true,
                fechaInicio: { lte: finDia }, // La promoción debe haber iniciado antes del fin del día actual
                fechaFin: { gte: inicioDia }, // La promoción debe terminar después del inicio del día actual
            },
        });
        if (promo) {
            console.log(`✅ [Products] Promoción encontrada: ${promo.titulo} (${promo.tipoDescuento}: ${promo.valorDescuento})`);
            promocionActiva = {
                id: promo.id,
                titulo: promo.titulo,
                descripcion: promo.descripcion,
                tipoDescuento: promo.tipoDescuento,
                valorDescuento: promo.valorDescuento,
                leyendaPersonalizada: promo.leyendaPersonalizada,
            };
        }
        else {
            console.log(`❌ [Products] No se encontró promoción vigente para el producto`);
        }
    }
    res.json({ success: true, data: {
            ...product,
            imagenes,
            precio: product.precio,
            promocionActiva,
        } });
}
export async function create(req, res) {
    try {
        const body = productSchema.parse(req.body);
        // Convertir precios a centavos para almacenamiento
        const toStore = {
            ...body,
            precio: Math.round(body.precio * 100),
            ...(Array.isArray(body.imagenes) && typeof body.imagenes[0] === 'string'
                ? { imagenes: body.imagenes.map((u) => ({ url: u })) }
                : {}),
        };
        const product = await createProduct(toStore);
        res.status(201).json({ success: true, data: product });
    }
    catch (e) {
        res.status(400).json({ success: false, error: e.message });
    }
}
export async function update(req, res) {
    try {
        const id = req.params.id;
        const body = productSchema.partial().parse(req.body);
        const toStore = { ...body };
        if (body.precio != null)
            toStore.precio = Math.round(body.precio * 100);
        if (Array.isArray(body.imagenes) && typeof body.imagenes[0] === 'string') {
            toStore.imagenes = body.imagenes.map((u) => ({ url: u }));
        }
        const product = await updateProduct(id, toStore);
        res.json({ success: true, data: product });
    }
    catch (e) {
        res.status(400).json({ success: false, error: e.message });
    }
}
export async function remove(req, res) {
    const id = req.params.id;
    await deleteProduct(id);
    res.json({ success: true });
}
