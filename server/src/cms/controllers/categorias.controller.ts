import { Response } from 'express';
import { AuthedRequest } from '../../middleware/auth.js';
import { prisma } from '../../prisma.js';
import { generateSlug, validateSlug } from '../../utils/product-validation.js';

// Obtener todas las categorías con filtros y búsqueda
export const getCategorias = async (req: AuthedRequest, res: Response) => {
  try {
    const { 
      pagina = '1', 
      limite = '50',
      busqueda = '',
      activo,
      parentId,
      includeProducts = 'false'
    } = req.query;

    const skip = (parseInt(pagina as string) - 1) * parseInt(limite as string);
    const take = parseInt(limite as string);

    // Construir filtros dinámicos
    const where: any = {};

    if (busqueda) {
      where.OR = [
        { name: { contains: busqueda as string, mode: 'insensitive' } },
        { slug: { contains: busqueda as string, mode: 'insensitive' } },
        { description: { contains: busqueda as string, mode: 'insensitive' } },
      ];
    }

    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    if (parentId !== undefined) {
      where.parentId = parentId === 'null' ? null : parentId;
    }

    const include: any = {
      parent: true,
      children: true,
    };

    if (includeProducts === 'true') {
      include.products = {
        select: {
          id: true,
          nombre: true,
          precio: true,
          stock: true,
        }
      };
      include._count = {
        select: { products: true }
      };
    }

    const [categorias, total] = await Promise.all([
      prisma.category.findMany({
        where,
        include,
        skip,
        take,
        orderBy: { orden: 'asc' },
      }),
      prisma.category.count({ where }),
    ]);

    const totalPaginas = Math.ceil(total / take);

    res.json({
      categorias,
      paginacion: {
        pagina: parseInt(pagina as string),
        limite: take,
        total,
        totalPaginas,
      },
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

// Obtener una categoría por ID
export const getCategoriaPorId = async (req: AuthedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const categoria = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        products: {
          select: {
            id: true,
            nombre: true,
            precio: true,
            stock: true,
            enLiquidacion: true,
          }
        },
        _count: {
          select: { products: true }
        }
      },
    });

    if (!categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    res.json(categoria);
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    res.status(500).json({ error: 'Error al obtener categoría' });
  }
};

// Crear nueva categoría
export const crearCategoria = async (req: AuthedRequest, res: Response) => {
  try {
    const {
      name,
      slug: customSlug,
      description,
      parentId,
      orden,
      activo,
    } = req.body;

    // Validaciones
    if (!name) {
      return res.status(400).json({ 
        error: 'El nombre de la categoría es obligatorio' 
      });
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
      slug = generateSlug(name);
    }

    // Verificar unicidad del slug
    const existeSlug = await prisma.category.findUnique({ where: { slug } });
    if (existeSlug) {
      return res.status(422).json({ 
        error: 'Slug ya existe. Proporcione uno diferente.',
        code: 'SLUG_DUPLICADO',
        suggestedSlug: `${slug}-${Date.now()}`
      });
    }

    // Validar que el parent existe si se proporciona
    if (parentId) {
      const parentExists = await prisma.category.findUnique({ where: { id: parentId } });
      if (!parentExists) {
        return res.status(400).json({ 
          error: 'La categoría padre especificada no existe',
          code: 'PARENT_NO_EXISTE'
        });
      }

      // Evitar ciclos: el parent no puede ser la misma categoría
      // (más validaciones se pueden agregar para evitar ciclos profundos)
    }

    // Crear categoría
    const categoria = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
        parentId: parentId || null,
        orden: orden !== undefined ? orden : 0,
        activo: activo !== undefined ? activo : true,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    // Registrar en auditoría
    if (req.user?.id) {
      await prisma.cMSAuditLog.create({
        data: {
          usuarioId: req.user.id,
          accion: 'CREAR_CATEGORIA',
          entidad: 'Category',
          entidadId: categoria.id,
          cambios: { name: categoria.name, slug: categoria.slug },
        },
      });
    }

    res.status(201).json(categoria);
  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({ error: 'Error al crear categoría' });
  }
};

// Actualizar categoría
export const actualizarCategoria = async (req: AuthedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug: customSlug,
      description,
      parentId,
      orden,
      activo,
    } = req.body;

    // Verificar que existe
    const categoriaExistente = await prisma.category.findUnique({ where: { id } });

    if (!categoriaExistente) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    // Manejar slug
    let slug = categoriaExistente.slug;
    if (customSlug !== undefined) {
      // Se proporcionó un slug personalizado
      if (customSlug !== categoriaExistente.slug) {
        // Validar formato
        if (!validateSlug(customSlug)) {
          return res.status(400).json({ 
            error: 'El slug debe contener solo letras minúsculas, números y guiones. No puede comenzar ni terminar con guión.',
            code: 'SLUG_INVALIDO'
          });
        }
        
        // Verificar unicidad
        const existeSlug = await prisma.category.findFirst({ 
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
    } else if (name && name !== categoriaExistente.name) {
      // Generar nuevo slug si cambió el nombre y no se proporcionó slug personalizado
      slug = generateSlug(name);
      const existeSlug = await prisma.category.findFirst({ 
        where: { slug, id: { not: id } } 
      });
      
      if (existeSlug) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    // Validar parent
    if (parentId !== undefined) {
      if (parentId === id) {
        return res.status(400).json({ 
          error: 'Una categoría no puede ser su propio padre',
          code: 'PARENT_CIRCULAR'
        });
      }

      if (parentId !== null) {
        const parentExists = await prisma.category.findUnique({ where: { id: parentId } });
        if (!parentExists) {
          return res.status(400).json({ 
            error: 'La categoría padre especificada no existe',
            code: 'PARENT_NO_EXISTE'
          });
        }

        // Validar que no se cree un ciclo (el parent no puede ser un hijo de esta categoría)
        // Esta validación requeriría recorrer el árbol
      }
    }

    // Preparar datos de actualización
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (slug !== categoriaExistente.slug) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (parentId !== undefined) updateData.parentId = parentId;
    if (orden !== undefined) updateData.orden = orden;
    if (activo !== undefined) updateData.activo = activo;

    const categoria = await prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        parent: true,
        children: true,
      },
    });

    // Registrar en auditoría
    if (req.user?.id) {
      await prisma.cMSAuditLog.create({
        data: {
          usuarioId: req.user.id,
          accion: 'ACTUALIZAR_CATEGORIA',
          entidad: 'Category',
          entidadId: categoria.id,
          cambios: { cambios: updateData },
        },
      });
    }

    res.json(categoria);
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
};

// Eliminar categoría
export const eliminarCategoria = async (req: AuthedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar que existe
    const categoria = await prisma.category.findUnique({ 
      where: { id },
      include: {
        _count: {
          select: { products: true, children: true }
        }
      }
    });

    if (!categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    // Verificar que no tenga productos asociados
    if (categoria._count.products > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar la categoría porque tiene ${categoria._count.products} producto(s) asociado(s)`,
        code: 'CATEGORIA_CON_PRODUCTOS'
      });
    }

    // Verificar que no tenga subcategorías
    if (categoria._count.children > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar la categoría porque tiene ${categoria._count.children} subcategoría(s)`,
        code: 'CATEGORIA_CON_HIJOS'
      });
    }

    // Eliminar categoría
    await prisma.category.delete({ where: { id } });

    // Registrar en auditoría
    if (req.user?.id) {
      await prisma.cMSAuditLog.create({
        data: {
          usuarioId: req.user.id,
          accion: 'ELIMINAR_CATEGORIA',
          entidad: 'Category',
          entidadId: id,
          cambios: { name: categoria.name },
        },
      });
    }

    res.json({ mensaje: 'Categoría eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
};

// Obtener estadísticas de categorías
export const getEstadisticas = async (req: AuthedRequest, res: Response) => {
  try {
    const [
      totalCategorias,
      categoriasActivas,
      categoriasConProductos,
    ] = await Promise.all([
      prisma.category.count(),
      prisma.category.count({ where: { activo: true } }),
      prisma.category.count({ 
        where: { 
          products: { 
            some: {} 
          } 
        } 
      }),
    ]);

    res.json({
      totalCategorias,
      categoriasActivas,
      categoriasConProductos,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

// Asignar productos a una categoría (masivo)
export const asignarProductos = async (req: AuthedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { productIds, asPrimary = false } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ 
        error: 'Se debe proporcionar un array de IDs de productos' 
      });
    }

    // Verificar que la categoría existe
    const categoria = await prisma.category.findUnique({ where: { id } });
    if (!categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    // Actualizar productos
    const updateData: any = { categoryId: id };
    if (asPrimary) {
      updateData.primaryCategoryId = id;
    }

    const result = await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: updateData,
    });

    // Registrar en auditoría
    if (req.user?.id) {
      await prisma.cMSAuditLog.create({
        data: {
          usuarioId: req.user.id,
          accion: 'ASIGNAR_PRODUCTOS_CATEGORIA',
          entidad: 'Category',
          entidadId: id,
          cambios: { productIds, count: result.count, asPrimary },
        },
      });
    }

    res.json({ 
      mensaje: `${result.count} producto(s) asignado(s) a la categoría`,
      count: result.count 
    });
  } catch (error) {
    console.error('Error al asignar productos:', error);
    res.status(500).json({ error: 'Error al asignar productos' });
  }
};
