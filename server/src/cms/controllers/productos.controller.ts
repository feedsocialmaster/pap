import { Response } from 'express';
import { AuthedRequest } from '../../middleware/auth.js';
import { prisma } from '../../prisma.js';
import slugify from 'slugify';
import { validateAndNormalizeColors } from '../../utils/color-utils.js';
import { 
  validateProduct, 
  generateSlug, 
  validateSlug,
  ProductValidationError 
} from '../../utils/product-validation.js';
import { createAuditLog, createAuditLogInTransaction } from '../../utils/audit-helper.js';

// Obtener todos los productos con filtros y búsqueda
export const getProductos = async (req: AuthedRequest, res: Response) => {
  try {
    const { 
      pagina = '1', 
      limite = '20',
      busqueda = '',
      tipoCalzado,
      enLiquidacion,
      esFiesta,
      impermeable,
      antideslizante,
      ordenarPor = 'fechaCreacion',
      orden = 'desc'
    } = req.query;

    const skip = (parseInt(pagina as string) - 1) * parseInt(limite as string);
    const take = parseInt(limite as string);

    // Construir filtros dinámicos
    const where: any = {};

    if (busqueda) {
      where.OR = [
        { nombre: { contains: busqueda as string, mode: 'insensitive' } },
        { descripcion: { contains: busqueda as string, mode: 'insensitive' } },
        { slug: { contains: busqueda as string, mode: 'insensitive' } },
      ];
    }

    if (tipoCalzado) {
      where.tipoCalzado = tipoCalzado;
    }

    if (enLiquidacion !== undefined) {
      where.enLiquidacion = enLiquidacion === 'true';
    }

    if (esFiesta !== undefined) {
      where.esFiesta = esFiesta === 'true';
    }

    if (impermeable !== undefined) {
      where.impermeable = impermeable === 'true';
    }

    if (antideslizante !== undefined) {
      where.antideslizante = antideslizante === 'true';
    }

    // Construir ordenamiento
    const orderBy: any = {};
    orderBy[ordenarPor as string] = orden === 'asc' ? 'asc' : 'desc';

    const [productos, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          imagenes: {
            orderBy: { orden: 'asc' }
          },
          variants: {
            orderBy: { createdAt: 'asc' }
          }
        },
        skip,
        take,
        orderBy,
      }),
      prisma.product.count({ where }),
    ]);

    const totalPaginas = Math.ceil(total / take);

    res.json({
      productos,
      paginacion: {
        pagina: parseInt(pagina as string),
        limite: take,
        total,
        totalPaginas,
      },
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// Obtener un producto por ID
export const getProductoPorId = async (req: AuthedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const producto = await prisma.product.findUnique({
      where: { id },
      include: {
        imagenes: {
          orderBy: { orden: 'asc' }
        },
        variants: {
          orderBy: { createdAt: 'asc' }
        }
      },
    });

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(producto);
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
};

// Crear nuevo producto
export const crearProducto = async (req: AuthedRequest, res: Response) => {
  try {
    const {
      nombre,
      descripcion,
      precio,
      tipoCalzado,
      imagenes,
      talles,
      colores,
      variants, // NEW: Array de variantes con stock por color
      stock,
      enLiquidacion,
      porcentajeDescuento,
      esFiesta,
      impermeable,
      antideslizante,
      caracteristicas,
      categoryId,
      slug: customSlug,
      metodosPago,
      retiroEnLocal,
      envioNacional,
      envioLocal,
      productoEnLanzamiento,
    } = req.body;

    // Validaciones básicas
    if (!nombre || !descripcion || !precio || !tipoCalzado) {
      return res.status(400).json({ 
        error: 'Nombre, descripción, precio y tipo de calzado son obligatorios' 
      });
    }

    // Construir datos del producto para validación
    const productData = {
      nombre,
      precio: parseFloat(precio),
      enLiquidacion: enLiquidacion || false,
      porcentajeDescuento: porcentajeDescuento || null,
      categoryId: categoryId || null,
      slug: customSlug,
    };

    // Validar reglas de negocio
    const validationErrors = validateProduct(productData, false);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: validationErrors[0].message,
        errors: validationErrors,
        code: validationErrors[0].code
      });
    }

    // Validar y normalizar colores
    let coloresNormalizados = null;
    if (colores && Array.isArray(colores) && colores.length > 0) {
      coloresNormalizados = validateAndNormalizeColors(colores);
      if (!coloresNormalizados) {
        return res.status(400).json({ 
          error: 'Los colores deben ser códigos hex válidos (formato: #RRGGBB o #RGB)' 
        });
      }
    }

    // Validar variantes si se proporcionan
    const hasVariants = variants && Array.isArray(variants) && variants.length > 0;
    if (hasVariants) {
      // Validar cada variante
      for (const variant of variants) {
        if (!variant.colorCode || !variant.colorName) {
          return res.status(400).json({ 
            error: 'Cada variante debe tener colorCode y colorName' 
          });
        }
        if (!variant.size || typeof variant.size !== 'number') {
          return res.status(400).json({ 
            error: 'Cada variante debe tener un talle (size) válido' 
          });
        }
        if (typeof variant.stock !== 'number' || variant.stock < 0) {
          return res.status(400).json({ 
            error: 'El stock de cada variante debe ser un número no negativo' 
          });
        }
      }

      // Validar que haya talles si se proporcionan variantes
      if (!talles || !Array.isArray(talles) || talles.length === 0) {
        return res.status(400).json({ 
          error: 'Debes proporcionar al menos un talle cuando configuras variantes de color' 
        });
      }
    }

    // Generar o validar slug
    let slug: string;
    if (customSlug) {
      // Validar slug personalizado
      if (!validateSlug(customSlug)) {
        return res.status(400).json({ 
          error: 'El slug debe contener solo letras minúsculas, números y guiones. No puede comenzar ni terminar con guión.',
          code: 'SLUG_INVALIDO'
        });
      }
      slug = customSlug;
    } else {
      // Generar slug automáticamente
      slug = generateSlug(nombre);
    }

    // Verificar unicidad del slug
    const existeSlug = await prisma.product.findUnique({ where: { slug } });
    if (existeSlug) {
      return res.status(422).json({ 
        error: 'Slug ya existe. Proporcione uno diferente.',
        code: 'SLUG_DUPLICADO',
        suggestedSlug: `${slug}-${Date.now()}`
      });
    }

    // Validar que la categoría existe si se proporciona
    if (categoryId) {
      const categoryExists = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!categoryExists) {
        return res.status(400).json({ 
          error: 'La categoría especificada no existe',
          code: 'CATEGORIA_NO_EXISTE'
        });
      }
    }

    // Calcular stock total si hay variantes
    const stockTotal = hasVariants 
      ? variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0)
      : (stock || 0);

    // Generar código de producto único
    const ultimoProducto = await prisma.product.findFirst({
      orderBy: { fechaCreacion: 'desc' },
      select: { codigoProducto: true }
    });
    
    let numeroProducto = 1;
    if (ultimoProducto?.codigoProducto) {
      const numero = parseInt(ultimoProducto.codigoProducto.split('-')[0], 10);
      numeroProducto = numero + 1;
    }
    const codigoProducto = `${numeroProducto.toString().padStart(6, '0')}-PROD`;

    // === VALIDACIÓN Y CONVERSIÓN DE PRECIOS ===
    // ARQUITECTURA: Frontend envía precios en PESOS (ej: 95000), backend convierte a CENTAVOS para DB (ej: 9500000)
    // Esta es la ÚNICA conversión - evita doble multiplicación
    const precioNumerico = parseFloat(precio);
    if (isNaN(precioNumerico) || precioNumerico <= 0) {
      return res.status(400).json({ error: 'Precio debe ser un número válido mayor a 0' });
    }
    const precioCentavos = Math.round(precioNumerico * 100);

    // Log para debugging (útil para detectar inconsistencias)
    console.log('[CREATE PRODUCT] Conversión precio:', {
      precioRecibido: precio,
      precioNumerico,
      precioCentavos
    });

    // Crear producto con imágenes y variantes
    const producto = await prisma.product.create({
      data: {
        nombre,
        slug,
        descripcion,
        precio: precioCentavos,
        tipoCalzado,
        talles: talles || [],
        colores: coloresNormalizados,
        stock: stockTotal,
        stockTotal: stockTotal,
        enLiquidacion: enLiquidacion || false,
        porcentajeDescuento: enLiquidacion ? porcentajeDescuento : null,
        esFiesta: esFiesta || false,
        impermeable: impermeable || false,
        antideslizante: antideslizante || false,
        caracteristicas: caracteristicas || [],
        retiroEnLocal: retiroEnLocal || false,
        envioNacional: envioNacional || false,
        envioLocal: envioLocal || false,
        productoEnLanzamiento: productoEnLanzamiento || false,
        codigoProducto,
        categoryId: categoryId || null,
        metodosPago: metodosPago || null,
        imagenes: {
          create: (imagenes || []).map((img: any, index: number) => ({
            url: img.url,
            alt: img.alt || nombre,
            orden: index,
          })),
        },
        ...(hasVariants && {
          variants: {
            create: variants.map((v: any) => ({
              colorName: v.colorName,
              colorCode: v.colorCode,
              size: v.size,
              stock: v.stock || 0,
              sku: v.sku || null,
            })),
          },
        }),
      },
      include: {
        imagenes: {
          orderBy: { orden: 'asc' }
        },
        variants: {
          orderBy: { createdAt: 'asc' }
        },
        category: true,
      },
    });

    // Registrar en auditoría
    if (req.user?.id) {
      await createAuditLog({
        usuarioId: req.user.id,
        accion: 'CREAR_PRODUCTO',
        entidad: 'Product',
        entidadId: producto.id,
        cambios: { nombre: producto.nombre, precio: producto.precio, enLiquidacion: producto.enLiquidacion },
      }, 'CREATE_PRODUCTO');
    }

    res.status(201).json(producto);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

// Actualizar producto
export const actualizarProducto = async (req: AuthedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      descripcion,
      precio,
      tipoCalzado,
      imagenes,
      talles,
      colores,
      stock,
      enLiquidacion,
      porcentajeDescuento,
      esFiesta,
      impermeable,
      antideslizante,
      caracteristicas,
      categoryId,
      slug: customSlug,
      variants, // NEW: Array de variantes con stock por color
      metodosPago,
      retiroEnLocal,
      envioNacional,
      envioLocal,
      productoEnLanzamiento,
      aplicaPromocion,
      tipoPromocionAplica,
    } = req.body;

    // Verificar que existe
    const productoExistente = await prisma.product.findUnique({ 
      where: { id },
      include: { imagenes: true }
    });

    if (!productoExistente) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Construir datos del producto para validación
    const productData = {
      id,
      nombre: nombre !== undefined ? nombre : productoExistente.nombre,
      precio: precio !== undefined ? parseFloat(precio) : productoExistente.precio / 100,
      enLiquidacion: enLiquidacion !== undefined ? enLiquidacion : productoExistente.enLiquidacion,
      porcentajeDescuento: porcentajeDescuento !== undefined ? porcentajeDescuento : productoExistente.porcentajeDescuento,
      categoryId: categoryId !== undefined ? categoryId : productoExistente.categoryId,
      slug: customSlug,
    };

    // Validar reglas de negocio
    const validationErrors = validateProduct(productData, true);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: validationErrors[0].message,
        errors: validationErrors,
        code: validationErrors[0].code
      });
    }

    // Validar y normalizar colores si se proporcionan
    let coloresNormalizados = colores;
    if (colores !== undefined && colores !== null) {
      if (Array.isArray(colores) && colores.length > 0) {
        coloresNormalizados = validateAndNormalizeColors(colores);
        if (!coloresNormalizados) {
          return res.status(400).json({ 
            error: 'Los colores deben ser códigos hex válidos (formato: #RRGGBB o #RGB)' 
          });
        }
      }
    }

    // Manejar slug
    let slug = productoExistente.slug;
    if (customSlug !== undefined) {
      // Se proporcionó un slug personalizado
      if (customSlug !== productoExistente.slug) {
        // Validar formato
        if (!validateSlug(customSlug)) {
          return res.status(400).json({ 
            error: 'El slug debe contener solo letras minúsculas, números y guiones. No puede comenzar ni terminar con guión.',
            code: 'SLUG_INVALIDO'
          });
        }
        
        // Verificar unicidad
        const existeSlug = await prisma.product.findFirst({ 
          where: { slug: customSlug, id: { not: id } } 
        });
        
        if (existeSlug) {
          return res.status(422).json({ 
            error: 'Slug ya existe. Proporcione uno diferente.',
            code: 'SLUG_DUPLICADO'
          });
        }
        
        slug = customSlug;
      }
    } else if (nombre && nombre !== productoExistente.nombre) {
      // Generar nuevo slug si cambió el nombre y no se proporcionó slug personalizado
      slug = generateSlug(nombre);
      const existeSlug = await prisma.product.findFirst({ 
        where: { slug, id: { not: id } } 
      });
      
      if (existeSlug) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    // Validar que la categoría existe si se proporciona
    if (categoryId !== undefined && categoryId !== null) {
      const categoryExists = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!categoryExists) {
        return res.status(400).json({ 
          error: 'La categoría especificada no existe',
          code: 'CATEGORIA_NO_EXISTE'
        });
      }
    }

    // Preparar datos de actualización
    const updateData: any = {
      nombre,
      slug,
      descripcion,
      tipoCalzado,
      talles,
      colores: coloresNormalizados,
      stock,
      enLiquidacion,
      porcentajeDescuento: enLiquidacion ? porcentajeDescuento : null,
      esFiesta,
      impermeable,
      antideslizante,
      caracteristicas,
      metodosPago,
      retiroEnLocal,
      envioNacional,
      envioLocal,
      productoEnLanzamiento,
      aplicaPromocion: aplicaPromocion ?? false,
      tipoPromocionAplica: aplicaPromocion ? tipoPromocionAplica : null,
    };

    // === VALIDACIÓN Y CONVERSIÓN DE PRECIOS ===
    // ARQUITECTURA: Frontend envía precios en PESOS, backend convierte a CENTAVOS para DB
    // Esta es la ÚNICA conversión - evita doble multiplicación
    
    if (precio !== undefined) {
      const precioNumerico = parseFloat(precio);
      if (isNaN(precioNumerico) || precioNumerico <= 0) {
        return res.status(400).json({ error: 'Precio debe ser un número válido mayor a 0' });
      }
      updateData.precio = Math.round(precioNumerico * 100);
      console.log('[UPDATE PRODUCT] Conversión precio:', { precioRecibido: precio, precioCentavos: updateData.precio });
    }

    // Manejar categoryId
    if (categoryId !== undefined) {
      updateData.categoryId = categoryId;
    }

    // Limpiar valores undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Actualizar imágenes si se proporcionan
    if (imagenes) {
      // Eliminar imágenes existentes
      await prisma.productImage.deleteMany({ where: { productId: id } });
      
      // Crear nuevas imágenes
      updateData.imagenes = {
        create: imagenes.map((img: any, index: number) => ({
          url: img.url,
          alt: img.alt || nombre || productoExistente.nombre,
          orden: index,
        })),
      };
    }

    // Actualizar variantes si se proporcionan
    const hasVariants = variants && Array.isArray(variants) && variants.length > 0;
    if (hasVariants) {
      // Validar variantes
      for (const variant of variants) {
        if (!variant.colorCode || !variant.colorName) {
          return res.status(400).json({ 
            error: 'Cada variante debe tener colorCode y colorName' 
          });
        }
        if (!variant.size || typeof variant.size !== 'number') {
          return res.status(400).json({ 
            error: 'Cada variante debe tener un talle (size) válido' 
          });
        }
        if (variant.stock === undefined || variant.stock < 0) {
          return res.status(400).json({ 
            error: 'Cada variante debe tener un stock válido mayor o igual a 0' 
          });
        }
      }

      // Validar que haya talles si se proporcionan variantes
      const tallesActuales = talles !== undefined ? talles : productoExistente.talles;
      if (!tallesActuales || tallesActuales.length === 0) {
        return res.status(400).json({ 
          error: 'Debes proporcionar al menos un talle cuando configuras variantes de color'
        });
      }

      // Eliminar variantes existentes
      await prisma.productVariant.deleteMany({ where: { productId: id } });

      // Calcular stock total de variantes
      const stockTotalVariantes = variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
      updateData.stock = stockTotalVariantes;

      // Crear nuevas variantes directamente desde el frontend
      // El frontend ya envía cada combinación color+talle con su stock individual
      updateData.variants = {
        create: variants.map((variant: any) => ({
          colorCode: variant.colorCode,
          colorName: variant.colorName,
          size: variant.size,
          stock: variant.stock || 0,
          sku: variant.sku || `${customSlug || productoExistente.slug}-${variant.colorCode}-${variant.size}`
        }))
      };
    } else if (stock !== undefined) {
      // Si no hay variantes pero se proporciona stock, usarlo directamente
      updateData.stock = stock;
    }

    const producto = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        imagenes: {
          orderBy: { orden: 'asc' }
        },
        category: true,
        variants: true,
      },
    });

    // Registrar en auditoría
    if (req.user?.id) {
      await createAuditLog({
        usuarioId: req.user.id,
        accion: 'ACTUALIZAR_PRODUCTO',
        entidad: 'Product',
        entidadId: producto.id,
        cambios: { cambios: updateData },
      }, 'UPDATE_PRODUCTO');
    }

    res.json(producto);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

// Eliminar producto
export const eliminarProducto = async (req: AuthedRequest, res: Response) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ [DELETE] Intentando eliminar producto: ${id}`);

    // Verificar que existe y obtener todos los datos relacionados
    const producto = await prisma.product.findUnique({ 
      where: { id },
      include: {
        variants: true,
        imagenes: true,
        orderItems: {
          include: {
            order: {
              select: {
                id: true,
                numeroOrden: true,
                estado: true
              }
            }
          }
        },
        _count: {
          select: {
            orderItems: true
          }
        }
      }
    });

    if (!producto) {
      console.log(`❌ [DELETE] Producto no encontrado: ${id}`);
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    console.log(`📊 [DELETE] Producto encontrado: "${producto.nombre}"`);
    console.log(`📊 [DELETE] Variantes: ${producto.variants.length}`);
    console.log(`📊 [DELETE] Imágenes: ${producto.imagenes.length}`);
    console.log(`📊 [DELETE] OrderItems: ${producto._count.orderItems}`);

    // Verificar que no tenga órdenes asociadas
    const cantidadOrderItems = producto._count?.orderItems || 0;
    
    if (cantidadOrderItems > 0) {
      console.log(`⚠️ [DELETE] Producto tiene ${cantidadOrderItems} OrderItems`);
      // Obtener detalles de las órdenes
      const ordenesUnicas = new Set(producto.orderItems.map(item => item.order.numeroOrden));
      const ordenesActivas = producto.orderItems.filter(
        item => item.order.estado !== 'CANCELADO'
      ).length;

      console.log(`⚠️ [DELETE] Órdenes únicas: ${ordenesUnicas.size}, Activas: ${ordenesActivas}`);

      return res.status(400).json({ 
        error: `No se puede eliminar el producto porque tiene ${cantidadOrderItems} ítem(s) en ${ordenesUnicas.size} orden(es).`,
        detalles: {
          totalItems: cantidadOrderItems,
          totalOrdenes: ordenesUnicas.size,
          ordenesActivas: ordenesActivas,
          mensaje: 'Los productos con historial de ventas no pueden eliminarse para mantener la integridad de los registros.'
        }
      });
    }

    console.log(`✅ [DELETE] Sin OrderItems, procediendo con eliminación...`);

    // Ejecutar eliminación en una transacción para garantizar atomicidad
    await prisma.$transaction(async (tx) => {
      // Primero verificar si hay referencias directas en la BD
      const checkOrderItems = await tx.orderItem.count({
        where: { productId: id }
      });

      if (checkOrderItems > 0) {
        console.log(`⚠️ [DELETE] ENCONTRADOS ${checkOrderItems} OrderItems en verificación directa!`);
        throw new Error(`Producto tiene ${checkOrderItems} OrderItems asociados`);
      }

      console.log(`✅ [DELETE] Verificación de OrderItems en transacción: 0`);

      // Eliminar producto (las imágenes y variantes se eliminan en cascada por onDelete: Cascade)
      console.log(`🗑️ [DELETE] Ejecutando DELETE en BD...`);
      await tx.product.delete({ where: { id } });
      console.log(`✅ [DELETE] DELETE ejecutado exitosamente`);

      // Registrar en auditoría dentro de la transacción
      if (req.user?.id) {
        await createAuditLogInTransaction(tx, {
          usuarioId: req.user.id,
          accion: 'ELIMINAR_PRODUCTO',
          entidad: 'Product',
          entidadId: id,
          cambios: { 
            nombre: producto.nombre,
            variantesEliminadas: producto.variants.length,
            imagenesEliminadas: producto.imagenes.length
          },
        }, 'DELETE_PRODUCTO');
      }
    });

    console.log(`🎉 [DELETE] Producto eliminado exitosamente: "${producto.nombre}"`);

    res.json({ 
      mensaje: 'Producto eliminado correctamente',
      detalles: {
        variantesEliminadas: producto.variants.length,
        imagenesEliminadas: producto.imagenes.length
      }
    });
  } catch (error) {
    console.error('❌ [DELETE] Error al eliminar producto:', error);
    
    // Capturar errores de restricción de FK con más detalle
    if (error instanceof Error) {
      console.error('❌ [DELETE] Error message:', error.message);
      console.error('❌ [DELETE] Error stack:', error.stack);

      if (error.message.includes('Foreign key constraint') || 
          error.message.includes('foreign key') ||
          error.message.includes('violates foreign key') ||
          error.message.includes('OrderItems asociados')) {
        return res.status(400).json({ 
          error: 'No se puede eliminar el producto porque tiene datos relacionados en el sistema.',
          errorTecnico: error.message,
          solucion: 'Este producto está siendo referenciado por órdenes u otros registros. Por favor, verifique el historial de ventas.'
        });
      }
    }
    
    res.status(500).json({ 
      error: 'Error al eliminar producto',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Obtener estadísticas de productos
export const getEstadisticas = async (req: AuthedRequest, res: Response) => {
  try {
    const [
      totalProductos,
      productosEnLiquidacion,
      productosSinStock,
      productosStockBajo,
      totalStock,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { enLiquidacion: true } }),
      prisma.product.count({ where: { stock: 0 } }),
      prisma.product.count({ where: { stock: { lt: 5, gt: 0 } } }),
      prisma.product.aggregate({ _sum: { stock: true } }),
    ]);

    res.json({
      totalProductos,
      productosEnLiquidacion,
      productosSinStock,
      productosStockBajo,
      totalStock: totalStock._sum.stock || 0,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

// Validar slug único
export const validarSlug = async (req: AuthedRequest, res: Response) => {
  try {
    const { slug } = req.params;
    const { excludeId } = req.query;

    // Validar formato
    if (!validateSlug(slug)) {
      return res.json({
        available: false,
        valid: false,
        message: 'El slug debe contener solo letras minúsculas, números y guiones. No puede comenzar ni terminar con guión.'
      });
    }

    // Verificar unicidad
    const whereClause: any = { slug };
    if (excludeId) {
      whereClause.id = { not: excludeId as string };
    }

    const existeSlug = await prisma.product.findFirst({ where: whereClause });

    res.json({
      available: !existeSlug,
      valid: true,
      message: existeSlug ? 'Este slug ya está en uso' : 'Slug disponible'
    });
  } catch (error) {
    console.error('Error al validar slug:', error);
    res.status(500).json({ error: 'Error al validar slug' });
  }
};

// Generar slug a partir de nombre
export const generarSlug = async (req: AuthedRequest, res: Response) => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const slug = generateSlug(nombre);
    
    // Verificar si está disponible
    const existeSlug = await prisma.product.findUnique({ where: { slug } });

    res.json({
      slug,
      available: !existeSlug,
      suggestedSlug: existeSlug ? `${slug}-${Date.now()}` : slug
    });
  } catch (error) {
    console.error('Error al generar slug:', error);
    res.status(500).json({ error: 'Error al generar slug' });
  }
};

// Obtener estadísticas detalladas de productos con compras y disponibilidad
export const getProductosConEstadisticas = async (req: AuthedRequest, res: Response) => {
  try {
    // Obtener todos los productos con sus variantes e imágenes
    const productos = await prisma.product.findMany({
      include: {
        imagenes: {
          orderBy: { orden: 'asc' },
          take: 1
        },
        variants: {
          orderBy: { colorName: 'asc' }
        },
        orderItems: {
          select: {
            cantidad: true,
            color: true,
            talle: true,
            precioUnitario: true
          }
        }
      },
      orderBy: { fechaCreacion: 'desc' }
    });

    // Calcular estadísticas para cada producto
    const productosConEstadisticas = productos.map(producto => {
      // Calcular total de unidades vendidas
      const totalVendido = producto.orderItems.reduce((sum, item) => sum + item.cantidad, 0);
      
      // Calcular total de ventas en dinero
      const totalVentas = producto.orderItems.reduce(
        (sum, item) => sum + (item.cantidad * item.precioUnitario), 
        0
      );

      // Calcular disponibilidad por color con desglose por talle
      const coloresMap = new Map<string, {
        colorName: string;
        colorCode: string;
        talles: Array<{
          talle: number;
          stockActual: number;
          vendidos: number;
        }>;
      }>();

      // Agrupar variantes por color
      producto.variants.forEach(variant => {
        if (!coloresMap.has(variant.colorCode)) {
          coloresMap.set(variant.colorCode, {
            colorName: variant.colorName,
            colorCode: variant.colorCode,
            talles: []
          });
        }

        // Contar cuántas unidades de esta combinación color+talle se vendieron
        const vendidosPorTalle = producto.orderItems
          .filter(item => item.color === variant.colorCode && item.talle === variant.size)
          .reduce((sum, item) => sum + item.cantidad, 0);

        coloresMap.get(variant.colorCode)!.talles.push({
          talle: variant.size,
          stockActual: variant.stock,
          vendidos: vendidosPorTalle
        });
      });

      // Ordenar talles dentro de cada color
      const disponibilidadPorColor = Array.from(coloresMap.values()).map(color => ({
        ...color,
        talles: color.talles.sort((a, b) => a.talle - b.talle)
      }));

      // Stock total de variantes
      const stockVariantes = producto.variants.reduce((sum, v) => sum + v.stock, 0);

      return {
        id: producto.id,
        codigoProducto: producto.codigoProducto,
        nombre: producto.nombre,
        slug: producto.slug,
        precio: producto.precio,
        enLiquidacion: producto.enLiquidacion,
        porcentajeDescuento: producto.porcentajeDescuento,
        tipoCalzado: producto.tipoCalzado,
        imagen: producto.imagenes[0]?.url || null,
        stockTotal: stockVariantes,
        stockLegacy: producto.stock, // Stock legacy del producto
        totalVendido,
        totalVentas,
        cantidadVariantes: producto.variants.length,
        disponibilidadPorColor
      };
    });

    res.json({
      productos: productosConEstadisticas,
      resumen: {
        totalProductos: productos.length,
        totalVariantes: productos.reduce((sum, p) => sum + p.variants.length, 0),
        stockTotalGeneral: productos.reduce(
          (sum, p) => sum + p.variants.reduce((s, v) => s + v.stock, 0), 
          0
        ),
        unidadesVendidasTotal: productosConEstadisticas.reduce(
          (sum, p) => sum + p.totalVendido, 
          0
        ),
        ventasTotal: productosConEstadisticas.reduce(
          (sum, p) => sum + p.totalVentas, 
          0
        )
      }
    });
  } catch (error) {
    console.error('Error al obtener productos con estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener productos con estadísticas' });
  }
};

// Borrado forzoso de producto (solo admin - elimina órdenes relacionadas)
export const forceDeleteProducto = async (req: AuthedRequest, res: Response) => {
  const correlationId = `FD-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    console.log(`🚨 [FORCE-DELETE][${correlationId}] Iniciando borrado forzoso del producto: ${id}`);
    console.log(`🔐 [FORCE-DELETE][${correlationId}] Usuario: ${req.user?.email} | Rol: ${userRole}`);

    // Verificar permisos (solo SUPER_SU y DESARROLLADOR pueden forzar borrado)
    const rolesPermitidos = ['SUPER_SU', 'DESARROLLADOR'];
    if (!userRole || !rolesPermitidos.includes(userRole)) {
      console.log(`🚫 [FORCE-DELETE][${correlationId}] Permiso denegado para rol: ${userRole}`);
      return res.status(403).json({ 
        error: 'No tienes permisos para realizar borrado forzoso',
        code: 'FORBIDDEN',
        correlationId 
      });
    }

    // Iniciar transacción atómica con lock
    const result = await prisma.$transaction(async (tx) => {
      // Obtener producto con lock (FOR UPDATE mediante el contexto de transacción)
      const producto = await tx.product.findUnique({
        where: { id },
        include: {
          imagenes: true,
          variants: true,
          orderItems: {
            include: {
              order: {
                select: {
                  id: true,
                  numeroOrden: true,
                  estado: true,
                  cmsStatus: true
                }
              }
            }
          }
        }
      });

      if (!producto) {
        console.log(`❌ [FORCE-DELETE][${correlationId}] Producto no encontrado: ${id}`);
        throw { status: 404, message: 'Producto no encontrado o ya eliminado', code: 'NOT_FOUND' };
      }

      console.log(`📊 [FORCE-DELETE][${correlationId}] Producto encontrado: "${producto.nombre}"`);
      console.log(`📊 [FORCE-DELETE][${correlationId}] Imágenes: ${producto.imagenes.length}`);
      console.log(`📊 [FORCE-DELETE][${correlationId}] Variantes: ${producto.variants.length}`);
      console.log(`📊 [FORCE-DELETE][${correlationId}] OrderItems: ${producto.orderItems.length}`);

      // Recopilar órdenes a eliminar (estados no finales)
      // Estados finales: ENTREGADO, CANCELADO (legacy) / DELIVERED, CANCELLED (CMS)
      const estadosNoFinales = ['EN_PROCESO']; // EstadoOrden no finales
      const cmsStatusNoFinales = ['PENDING', 'PAYMENT_REJECTED', 'PAYMENT_APPROVED', 'PREPARING', 'READY_FOR_SHIPPING', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'NOT_DELIVERED'];
      
      const ordenesAEliminar = new Set<string>();
      const ordenesProtegidas = new Set<string>();
      
      for (const item of producto.orderItems) {
        const order = item.order;
        const esEstadoFinal = order.estado === 'ENTREGADO' || order.estado === 'CANCELADO';
        const esCmsStatusFinal = order.cmsStatus === 'DELIVERED' || order.cmsStatus === 'CANCELLED';
        
        if (!esEstadoFinal || !esCmsStatusFinal) {
          ordenesAEliminar.add(order.id);
        } else {
          ordenesProtegidas.add(order.id);
        }
      }

      console.log(`📋 [FORCE-DELETE][${correlationId}] Órdenes a eliminar: ${ordenesAEliminar.size}`);
      console.log(`📋 [FORCE-DELETE][${correlationId}] Órdenes protegidas (finales): ${ordenesProtegidas.size}`);

      // Si hay órdenes en estado final (ENTREGADO/CANCELADO), no podemos eliminar
      // el producto sin afectar el historial - esto es una decisión de diseño
      // En este caso, continuamos pero desvinculamos los OrderItems

      // Eliminar órdenes no finales relacionadas y sus dependencias
      const ordenesEliminadas: string[] = [];
      
      for (const orderId of ordenesAEliminar) {
        console.log(`🗑️ [FORCE-DELETE][${correlationId}] Eliminando orden: ${orderId}`);
        
        // Eliminar historial de estados
        await tx.orderStatusHistory.deleteMany({ where: { orderId } });
        
        // Eliminar pagos
        await tx.payment.deleteMany({ where: { orderId } });
        
        // Eliminar gateway payments
        await tx.gatewayPayment.deleteMany({ where: { orderId } });
        
        // Eliminar OrderItems de esta orden
        await tx.orderItem.deleteMany({ where: { orderId } });
        
        // Eliminar la orden
        await tx.order.delete({ where: { id: orderId } });
        
        ordenesEliminadas.push(orderId);
      }

      // Eliminar OrderItems de órdenes protegidas (para desvincular el producto)
      // NOTA: Esto puede afectar la integridad del historial de órdenes completadas
      // pero es requerido para el borrado forzoso
      for (const orderId of ordenesProtegidas) {
        await tx.orderItem.deleteMany({ 
          where: { 
            orderId, 
            productId: id 
          } 
        });
      }

      // Recopilar paths de imágenes para borrado posterior
      const imagePaths = producto.imagenes.map(img => img.url);

      // Eliminar imágenes de la BD
      await tx.productImage.deleteMany({ where: { productId: id } });

      // Eliminar variantes
      await tx.productVariant.deleteMany({ where: { productId: id } });

      // Eliminar producto
      await tx.product.delete({ where: { id } });

      // Registrar auditoría
      if (userId) {
        await tx.cMSAuditLog.create({
          data: {
            usuarioId: userId,
            accion: 'FORCE_DELETE_PRODUCTO',
            entidad: 'Product',
            entidadId: id,
            cambios: {
              productName: producto.nombre,
              productSlug: producto.slug,
              productCode: producto.codigoProducto,
              deletedOrders: ordenesEliminadas.length,
              deletedImages: imagePaths.length,
              deletedVariants: producto.variants.length,
              protectedOrders: ordenesProtegidas.size,
              reason: 'force-delete-cms',
              correlationId
            }
          }
        });
      }

      return {
        productName: producto.nombre,
        productSlug: producto.slug,
        deletedOrders: ordenesEliminadas.length,
        deletedImages: imagePaths.length,
        deletedVariants: producto.variants.length,
        imagePaths
      };
    }, {
      maxWait: 10000, // Esperar máximo 10 segundos para obtener lock
      timeout: 30000  // Timeout total de 30 segundos
    });

    console.log(`✅ [FORCE-DELETE][${correlationId}] Transacción completada exitosamente`);

    // Borrar imágenes del storage (fuera de la transacción)
    const imageDeleteResults = await deleteImagesFromStorage(result.imagePaths, correlationId);

    // Invalidar cache (revalidar rutas públicas)
    try {
      // Aquí se podría llamar a revalidatePath si estuviéramos en Next.js server
      // Como estamos en Express, emitimos un evento para que el frontend lo maneje
      console.log(`🔄 [FORCE-DELETE][${correlationId}] Cache invalidation triggered for product slug: ${result.productSlug}`);
    } catch (cacheError) {
      console.warn(`⚠️ [FORCE-DELETE][${correlationId}] Error invalidando cache:`, cacheError);
    }

    console.log(`🎉 [FORCE-DELETE][${correlationId}] Borrado forzoso completado`);
    console.log(`   - Producto: ${result.productName}`);
    console.log(`   - Órdenes eliminadas: ${result.deletedOrders}`);
    console.log(`   - Imágenes eliminadas: ${result.deletedImages}`);
    console.log(`   - Variantes eliminadas: ${result.deletedVariants}`);

    res.json({
      success: true,
      message: 'Producto eliminado forzosamente',
      data: {
        productName: result.productName,
        deletedOrders: result.deletedOrders,
        deletedImages: result.deletedImages,
        deletedVariants: result.deletedVariants,
        imageDeleteResults
      },
      correlationId
    });

  } catch (error: any) {
    console.error(`❌ [FORCE-DELETE][${correlationId}] Error:`, error);

    // Manejar errores conocidos
    if (error.status) {
      return res.status(error.status).json({
        error: error.message,
        code: error.code,
        correlationId
      });
    }

    // Error de lock/concurrencia
    if (error.code === 'P2028' || error.message?.includes('lock')) {
      return res.status(409).json({
        error: 'El producto está siendo modificado por otro proceso. Intente nuevamente.',
        code: 'CONFLICT',
        correlationId
      });
    }

    // Error interno
    res.status(500).json({
      error: 'Error interno al eliminar producto',
      code: 'INTERNAL_ERROR',
      correlationId,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper para eliminar imágenes del storage
async function deleteImagesFromStorage(imagePaths: string[], correlationId: string): Promise<{ success: number; failed: number; errors: string[] }> {
  const fs = await import('fs').then(m => m.promises);
  const path = await import('path');
  
  const results = { success: 0, failed: 0, errors: [] as string[] };
  
  for (const imagePath of imagePaths) {
    try {
      // Las imágenes están en /uploads/... - convertir a path absoluto
      if (imagePath.startsWith('/uploads/')) {
        const filename = imagePath.replace('/uploads/', '');
        const absolutePath = path.join(process.cwd(), 'src', 'uploads', filename);
        
        try {
          await fs.access(absolutePath);
          await fs.unlink(absolutePath);
          console.log(`🗑️ [FORCE-DELETE][${correlationId}] Imagen eliminada: ${filename}`);
          results.success++;
        } catch (fileError: any) {
          if (fileError.code === 'ENOENT') {
            console.log(`⚠️ [FORCE-DELETE][${correlationId}] Imagen no encontrada (ya eliminada?): ${filename}`);
            results.success++; // La imagen ya no existe, consideramos éxito
          } else {
            throw fileError;
          }
        }
      } else {
        console.log(`⚠️ [FORCE-DELETE][${correlationId}] Path de imagen no reconocido: ${imagePath}`);
        results.errors.push(`Path no reconocido: ${imagePath}`);
        results.failed++;
      }
    } catch (error: any) {
      console.error(`❌ [FORCE-DELETE][${correlationId}] Error eliminando imagen ${imagePath}:`, error.message);
      results.errors.push(`${imagePath}: ${error.message}`);
      results.failed++;
    }
  }
  
  return results;
}
