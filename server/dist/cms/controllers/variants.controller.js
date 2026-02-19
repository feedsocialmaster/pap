import { prisma } from '../../prisma.js';
import { normalizeHexColor } from '../../utils/color-utils.js';
/**
 * Calcula y actualiza el stock_total de un producto
 * basado en la suma de stock de todas sus variantes
 */
async function recalculateStockTotal(productId) {
    const variants = await prisma.productVariant.findMany({
        where: { productId },
        select: { stock: true },
    });
    const stockTotal = variants.reduce((sum, v) => sum + v.stock, 0);
    await prisma.product.update({
        where: { id: productId },
        data: {
            stockTotal,
            stock: stockTotal, // Mantener sincronizado por backward compatibility
        },
    });
    return stockTotal;
}
/**
 * GET /api/cms/productos/:productId/variants
 * Obtiene todas las variantes de un producto
 */
export const getVariants = async (req, res) => {
    try {
        const { productId } = req.params;
        // Verificar que el producto existe
        const product = await prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        const variants = await prisma.productVariant.findMany({
            where: { productId },
            orderBy: { createdAt: 'asc' },
        });
        res.json({
            variants,
            stockTotal: product.stockTotal,
        });
    }
    catch (error) {
        console.error('Error al obtener variantes:', error);
        res.status(500).json({ error: 'Error al obtener variantes del producto' });
    }
};
/**
 * POST /api/cms/productos/:productId/variants
 * Crea una nueva variante de color y talle para un producto
 */
export const createVariant = async (req, res) => {
    try {
        const { productId } = req.params;
        const { colorName, colorCode, size, stock = 0, sku } = req.body;
        // Validaciones
        if (!colorName || !colorCode || size === undefined) {
            return res.status(400).json({
                error: 'colorName, colorCode y size son requeridos'
            });
        }
        const normalizedColorCode = normalizeHexColor(colorCode);
        if (!normalizedColorCode) {
            return res.status(400).json({
                error: 'colorCode debe ser un código hexadecimal válido (#RRGGBB)'
            });
        }
        if (typeof size !== 'number' || size <= 0) {
            return res.status(400).json({
                error: 'size debe ser un número positivo'
            });
        }
        if (typeof stock !== 'number' || stock < 0) {
            return res.status(400).json({
                error: 'stock debe ser un número no negativo'
            });
        }
        // Verificar que el producto existe
        const product = await prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        // Verificar que no exista ya una variante con ese color y talle
        const existingVariant = await prisma.productVariant.findUnique({
            where: {
                productId_colorCode_size: {
                    productId,
                    colorCode: normalizedColorCode,
                    size,
                },
            },
        });
        if (existingVariant) {
            return res.status(409).json({
                error: 'Ya existe una variante con este color y talle'
            });
        }
        // Crear variante
        const variant = await prisma.productVariant.create({
            data: {
                productId,
                colorName,
                colorCode: normalizedColorCode,
                size,
                stock,
                sku,
            },
        });
        // Recalcular stock total
        const stockTotal = await recalculateStockTotal(productId);
        res.status(201).json({
            variant,
            stockTotal,
        });
    }
    catch (error) {
        console.error('Error al crear variante:', error);
        res.status(500).json({ error: 'Error al crear variante' });
    }
};
/**
 * PUT /api/cms/productos/:productId/variants/:variantId
 * Actualiza una variante existente
 */
export const updateVariant = async (req, res) => {
    try {
        const { productId, variantId } = req.params;
        const { colorName, colorCode, size, stock, sku } = req.body;
        // Verificar que la variante existe y pertenece al producto
        const existingVariant = await prisma.productVariant.findUnique({
            where: { id: variantId },
        });
        if (!existingVariant) {
            return res.status(404).json({ error: 'Variante no encontrada' });
        }
        if (existingVariant.productId !== productId) {
            return res.status(403).json({
                error: 'La variante no pertenece a este producto'
            });
        }
        // Validar datos a actualizar
        const updateData = {};
        if (colorName !== undefined) {
            if (!colorName.trim()) {
                return res.status(400).json({ error: 'colorName no puede estar vacío' });
            }
            updateData.colorName = colorName;
        }
        if (colorCode !== undefined) {
            const normalizedColorCode = normalizeHexColor(colorCode);
            if (!normalizedColorCode) {
                return res.status(400).json({
                    error: 'colorCode debe ser un código hexadecimal válido (#RRGGBB)'
                });
            }
            updateData.colorCode = normalizedColorCode;
        }
        if (size !== undefined) {
            if (typeof size !== 'number' || size <= 0) {
                return res.status(400).json({
                    error: 'size debe ser un número positivo'
                });
            }
            updateData.size = size;
        }
        // Verificar que no exista otra variante con la misma combinación color+size
        if (colorCode !== undefined || size !== undefined) {
            const newColorCode = updateData.colorCode || existingVariant.colorCode;
            const newSize = updateData.size !== undefined ? updateData.size : existingVariant.size;
            // Solo verificar duplicados si cambió el color o el talle
            if (newColorCode !== existingVariant.colorCode || newSize !== existingVariant.size) {
                const duplicate = await prisma.productVariant.findUnique({
                    where: {
                        productId_colorCode_size: {
                            productId,
                            colorCode: newColorCode,
                            size: newSize,
                        },
                    },
                });
                if (duplicate && duplicate.id !== variantId) {
                    return res.status(409).json({
                        error: 'Ya existe una variante con esta combinación de color y talle'
                    });
                }
            }
        }
        if (stock !== undefined) {
            if (typeof stock !== 'number' || stock < 0) {
                return res.status(400).json({
                    error: 'stock debe ser un número no negativo'
                });
            }
            updateData.stock = stock;
        }
        if (sku !== undefined) {
            updateData.sku = sku || null;
        }
        // Actualizar variante
        const variant = await prisma.productVariant.update({
            where: { id: variantId },
            data: updateData,
        });
        // Recalcular stock total si se modificó el stock
        let stockTotal = null;
        if (stock !== undefined) {
            stockTotal = await recalculateStockTotal(productId);
        }
        res.json({
            variant,
            ...(stockTotal !== null && { stockTotal }),
        });
    }
    catch (error) {
        console.error('Error al actualizar variante:', error);
        res.status(500).json({ error: 'Error al actualizar variante' });
    }
};
/**
 * DELETE /api/cms/productos/:productId/variants/:variantId
 * Elimina una variante
 */
export const deleteVariant = async (req, res) => {
    try {
        const { productId, variantId } = req.params;
        // Verificar que la variante existe y pertenece al producto
        const existingVariant = await prisma.productVariant.findUnique({
            where: { id: variantId },
        });
        if (!existingVariant) {
            return res.status(404).json({ error: 'Variante no encontrada' });
        }
        if (existingVariant.productId !== productId) {
            return res.status(403).json({
                error: 'La variante no pertenece a este producto'
            });
        }
        // Verificar que no es la única variante (mantener al menos una)
        const variantCount = await prisma.productVariant.count({
            where: { productId },
        });
        if (variantCount <= 1) {
            return res.status(400).json({
                error: 'No se puede eliminar la única variante del producto. Debe tener al menos una variante.'
            });
        }
        // Eliminar variante
        await prisma.productVariant.delete({
            where: { id: variantId },
        });
        // Recalcular stock total
        const stockTotal = await recalculateStockTotal(productId);
        res.json({
            message: 'Variante eliminada correctamente',
            stockTotal,
        });
    }
    catch (error) {
        console.error('Error al eliminar variante:', error);
        res.status(500).json({ error: 'Error al eliminar variante' });
    }
};
/**
 * POST /api/cms/productos/:productId/variants/bulk
 * Actualiza múltiples variantes al mismo tiempo (útil para sincronización de colores y talles)
 */
export const bulkUpdateVariants = async (req, res) => {
    try {
        const { productId } = req.params;
        const { variants } = req.body;
        if (!Array.isArray(variants)) {
            return res.status(400).json({ error: 'Se requiere un array de variantes' });
        }
        // Verificar que el producto existe
        const product = await prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        // Obtener variantes existentes
        const existingVariants = await prisma.productVariant.findMany({
            where: { productId },
        });
        const existingKeys = new Set(existingVariants.map(v => `${v.colorCode}-${v.size}`));
        const newVariants = [];
        const updateVariants = [];
        const errors = [];
        // Procesar cada variante
        for (const v of variants) {
            const normalizedColorCode = normalizeHexColor(v.colorCode);
            if (!normalizedColorCode) {
                errors.push(`Color inválido: ${v.colorCode}`);
                continue;
            }
            if (!v.size || typeof v.size !== 'number' || v.size <= 0) {
                errors.push(`Talle inválido para color ${normalizedColorCode}: ${v.size}`);
                continue;
            }
            const key = `${normalizedColorCode}-${v.size}`;
            if (!existingKeys.has(key)) {
                // Nueva variante
                newVariants.push({
                    productId,
                    colorName: v.colorName || `Color ${normalizedColorCode}`,
                    colorCode: normalizedColorCode,
                    size: v.size,
                    stock: v.stock || 0,
                    sku: v.sku || null,
                });
            }
            else if (v.id) {
                // Actualizar variante existente
                updateVariants.push({
                    id: v.id,
                    data: {
                        colorName: v.colorName,
                        stock: v.stock,
                        sku: v.sku || null,
                    }
                });
            }
        }
        // Crear nuevas variantes
        if (newVariants.length > 0) {
            await prisma.productVariant.createMany({
                data: newVariants,
                skipDuplicates: true,
            });
        }
        // Actualizar variantes existentes
        for (const variant of updateVariants) {
            await prisma.productVariant.update({
                where: { id: variant.id },
                data: variant.data,
            });
        }
        // Recalcular stock total
        const stockTotal = await recalculateStockTotal(productId);
        // Obtener todas las variantes actualizadas
        const updatedVariants = await prisma.productVariant.findMany({
            where: { productId },
            orderBy: [
                { colorCode: 'asc' },
                { size: 'asc' },
            ],
        });
        res.json({
            variants: updatedVariants,
            stockTotal,
            created: newVariants.length,
            updated: updateVariants.length,
            errors: errors.length > 0 ? errors : undefined,
        });
    }
    catch (error) {
        console.error('Error en actualización masiva de variantes:', error);
        res.status(500).json({ error: 'Error al actualizar variantes' });
    }
};
