import { prisma } from '../prisma.js';
import { Prisma } from '@prisma/client';
import { slugify } from '../util/slugify.js';
async function ensureUniqueSlug(base, excludeId) {
    let candidate = base;
    let i = 2;
    // Loop until a unique slug is found (excluding the product being updated)
    // In practice this will be fast given low collision probability
    while (true) {
        const exists = await prisma.product.findFirst({
            where: { slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
            select: { id: true },
        });
        if (!exists)
            return candidate;
        candidate = `${base}-${i++}`;
    }
}
export async function listProducts(params = {}) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const f = params.filters ?? {};
    const sort = params.sort ?? 'newest';
    const where = {};
    if (f.tipoCalzado && f.tipoCalzado.length > 0) {
        where.tipoCalzado = { in: f.tipoCalzado };
    }
    if (f.talle && f.talle.length > 0) {
        where.talles = { hasSome: f.talle };
    }
    if (typeof f.stockMin === 'number' || typeof f.stockMax === 'number') {
        const gte = typeof f.stockMin === 'number' ? f.stockMin : undefined;
        const lte = typeof f.stockMax === 'number' ? f.stockMax : undefined;
        where.stock = { ...(gte != null ? { gte } : {}), ...(lte != null ? { lte } : {}) };
    }
    if (typeof f.enLiquidacion === 'boolean') {
        where.enLiquidacion = f.enLiquidacion;
    }
    if (typeof f.minPrice === 'number' || typeof f.maxPrice === 'number') {
        const gte = typeof f.minPrice === 'number' ? Math.round(f.minPrice * 100) : undefined;
        const lte = typeof f.maxPrice === 'number' ? Math.round(f.maxPrice * 100) : undefined;
        where.precio = { ...(gte != null ? { gte } : {}), ...(lte != null ? { lte } : {}) };
    }
    if (f.search && f.search.trim().length > 0) {
        where.nombre = { contains: f.search.trim(), mode: 'insensitive' };
    }
    const orderBy = sort === 'price_asc' ? { precio: 'asc' } : sort === 'price_desc' ? { precio: 'desc' } : { fechaCreacion: 'desc' };
    const [total, data] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy,
            include: {
                imagenes: true,
                variants: {
                    orderBy: { createdAt: 'asc' }
                }
            },
        }),
    ]);
    return { data, total, page, totalPages: Math.ceil(total / pageSize) };
}
export async function getProduct(idOrSlug) {
    return prisma.product.findFirst({
        where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
        include: {
            imagenes: true,
            variants: {
                orderBy: { createdAt: 'asc' }
            }
        }
    });
}
export async function createProduct(input) {
    const slug = await ensureUniqueSlug(slugify(input.nombre));
    return prisma.product.create({
        data: {
            nombre: input.nombre,
            slug,
            descripcion: input.descripcion,
            precio: input.precio,
            tipoCalzado: input.tipoCalzado,
            talles: input.talles,
            colores: input.colores ?? null,
            stock: input.stock,
            enLiquidacion: input.enLiquidacion ?? false,
            porcentajeDescuento: input.porcentajeDescuento ?? null,
            esFiesta: input.esFiesta ?? false,
            impermeable: input.impermeable ?? false,
            antideslizante: input.antideslizante ?? false,
            caracteristicas: input.caracteristicas ?? [],
            metodosPago: input.metodosPago ? input.metodosPago : Prisma.JsonNull,
            imagenes: input.imagenes ? { create: input.imagenes.map((i) => ({ url: i.url, alt: i.alt ?? null, orden: i.orden ?? 0 })) } : undefined,
        },
        include: { imagenes: true },
    });
}
export async function updateProduct(id, input) {
    // If name is changing, recompute slug and ensure uniqueness
    let slugUpdate = {};
    if (input.nombre) {
        const base = slugify(input.nombre);
        const unique = await ensureUniqueSlug(base, id);
        slugUpdate.slug = unique;
    }
    return prisma.product.update({
        where: { id },
        data: {
            ...('nombre' in input ? { nombre: input.nombre } : {}),
            ...slugUpdate,
            ...('descripcion' in input ? { descripcion: input.descripcion } : {}),
            ...('precio' in input ? { precio: input.precio } : {}),
            ...('tipoCalzado' in input ? { tipoCalzado: input.tipoCalzado } : {}),
            ...('talles' in input ? { talles: input.talles } : {}),
            ...('colores' in input ? { colores: input.colores ?? null } : {}),
            ...('stock' in input ? { stock: input.stock } : {}),
            ...('enLiquidacion' in input ? { enLiquidacion: input.enLiquidacion } : {}),
            ...('porcentajeDescuento' in input ? { porcentajeDescuento: input.porcentajeDescuento ?? null } : {}),
            ...('esFiesta' in input ? { esFiesta: input.esFiesta } : {}),
            ...('impermeable' in input ? { impermeable: input.impermeable } : {}),
            ...('antideslizante' in input ? { antideslizante: input.antideslizante } : {}),
            ...('caracteristicas' in input ? { caracteristicas: input.caracteristicas } : {}),
            ...('metodosPago' in input ? { metodosPago: input.metodosPago ? input.metodosPago : Prisma.JsonNull } : {}),
        },
        include: { imagenes: true },
    });
}
export async function deleteProduct(id) {
    return prisma.product.delete({ where: { id } });
}
