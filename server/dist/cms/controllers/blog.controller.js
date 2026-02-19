import { prisma } from '../../prisma.js';
// Generar slug único a partir del título
const generateSlug = (titulo) => {
    return titulo
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
        .replace(/[^a-z0-9\s-]/g, '') // Eliminar caracteres especiales
        .replace(/\s+/g, '-') // Reemplazar espacios por guiones
        .replace(/-+/g, '-') // Reemplazar múltiples guiones por uno
        .trim();
};
// Obtener todos los artículos (CMS)
export const getBlogPosts = async (req, res) => {
    try {
        const { estado } = req.query;
        const where = {};
        if (estado)
            where.estado = estado;
        const posts = await prisma.cMSBlogPost.findMany({
            where,
            orderBy: [
                { publicadoEn: 'desc' },
                { createdAt: 'desc' }
            ]
        });
        res.json(posts);
    }
    catch (error) {
        console.error('Error al obtener artículos:', error);
        res.status(500).json({ error: 'Error al obtener artículos' });
    }
};
// Obtener artículos publicados para el frontend
export const getPublishedPosts = async (req, res) => {
    try {
        const posts = await prisma.cMSBlogPost.findMany({
            where: {
                estado: 'PUBLICADO'
            },
            orderBy: { publicadoEn: 'desc' },
            select: {
                id: true,
                titulo: true,
                slug: true,
                descripcion: true,
                autor: true,
                miniatura: true,
                publicadoEn: true,
                vistas: true,
                palabrasClave: true
            }
        });
        res.json(posts);
    }
    catch (error) {
        console.error('Error al obtener artículos publicados:', error);
        res.status(500).json({ error: 'Error al obtener artículos' });
    }
};
// Obtener un artículo por slug (público)
export const getBlogPostBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const post = await prisma.cMSBlogPost.findFirst({
            where: {
                slug,
                estado: 'PUBLICADO'
            }
        });
        if (!post) {
            return res.status(404).json({ error: 'Artículo no encontrado' });
        }
        // Incrementar vistas
        await prisma.cMSBlogPost.update({
            where: { id: post.id },
            data: { vistas: { increment: 1 } }
        });
        res.json(post);
    }
    catch (error) {
        console.error('Error al obtener artículo:', error);
        res.status(500).json({ error: 'Error al obtener artículo' });
    }
};
// Obtener artículos relacionados
export const getRelatedPosts = async (req, res) => {
    try {
        const { slug } = req.params;
        const limit = parseInt(req.query.limit) || 5;
        // Obtener el artículo actual
        const currentPost = await prisma.cMSBlogPost.findUnique({
            where: { slug },
            select: { id: true, palabrasClave: true }
        });
        if (!currentPost) {
            return res.status(404).json({ error: 'Artículo no encontrado' });
        }
        // Buscar artículos con palabras clave similares
        const relatedPosts = await prisma.cMSBlogPost.findMany({
            where: {
                id: { not: currentPost.id },
                estado: 'PUBLICADO',
                OR: currentPost.palabrasClave.map(keyword => ({
                    palabrasClave: { has: keyword }
                }))
            },
            take: limit,
            orderBy: { publicadoEn: 'desc' },
            select: {
                id: true,
                titulo: true,
                slug: true,
                descripcion: true,
                miniatura: true,
                publicadoEn: true
            }
        });
        res.json(relatedPosts);
    }
    catch (error) {
        console.error('Error al obtener artículos relacionados:', error);
        res.status(500).json({ error: 'Error al obtener artículos relacionados' });
    }
};
// Obtener un artículo por ID (CMS)
export const getBlogPostById = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await prisma.cMSBlogPost.findUnique({
            where: { id: parseInt(id) }
        });
        if (!post) {
            return res.status(404).json({ error: 'Artículo no encontrado' });
        }
        res.json(post);
    }
    catch (error) {
        console.error('Error al obtener artículo:', error);
        res.status(500).json({ error: 'Error al obtener artículo' });
    }
};
// Crear un nuevo artículo
/**
 * @deprecated The programadoPara field is deprecated and will be ignored.
 * Scheduling functionality has been removed from the CMS.
 * The field remains in the schema for backwards compatibility but is no longer used.
 */
export const createBlogPost = async (req, res) => {
    try {
        const { titulo, tituloSeo, descripcion, descripcionSeo, palabrasClave, autor, miniatura, cuerpo, estado, programadoPara // @deprecated - kept for backwards compatibility but ignored
         } = req.body;
        // Validaciones
        if (!titulo || !descripcion || !autor || !cuerpo) {
            return res.status(400).json({
                error: 'Título, descripción, autor y cuerpo son requeridos'
            });
        }
        // Validar palabras clave (máximo 10)
        if (palabrasClave && palabrasClave.length > 10) {
            return res.status(400).json({
                error: 'Máximo 10 palabras clave permitidas'
            });
        }
        // Generar slug único
        let slug = generateSlug(titulo);
        let slugCount = 0;
        let slugUnico = slug;
        // Verificar si el slug ya existe
        while (await prisma.cMSBlogPost.findUnique({ where: { slug: slugUnico } })) {
            slugCount++;
            slugUnico = `${slug}-${slugCount}`;
        }
        const post = await prisma.cMSBlogPost.create({
            data: {
                titulo,
                tituloSeo: tituloSeo || titulo,
                slug: slugUnico,
                slugSeo: slugUnico,
                descripcion,
                descripcionSeo: descripcionSeo || descripcion,
                palabrasClave: palabrasClave || [],
                autor,
                miniatura,
                cuerpo,
                estado: estado || 'BORRADOR',
                // @deprecated programadoPara - scheduling removed, field set to null
                programadoPara: null,
                publicadoEn: estado === 'PUBLICADO' ? new Date() : null
            }
        });
        res.status(201).json(post);
    }
    catch (error) {
        console.error('Error al crear artículo:', error);
        res.status(500).json({ error: 'Error al crear artículo' });
    }
};
// Actualizar un artículo
/**
 * @deprecated The programadoPara field is deprecated and will be ignored.
 * Scheduling functionality has been removed from the CMS.
 */
export const updateBlogPost = async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, tituloSeo, descripcion, descripcionSeo, palabrasClave, autor, miniatura, cuerpo, estado, programadoPara // @deprecated - kept for backwards compatibility but ignored
         } = req.body;
        // Validar palabras clave
        if (palabrasClave && palabrasClave.length > 10) {
            return res.status(400).json({
                error: 'Máximo 10 palabras clave permitidas'
            });
        }
        const currentPost = await prisma.cMSBlogPost.findUnique({ where: { id: parseInt(id) } });
        if (!currentPost) {
            return res.status(404).json({ error: 'Artículo no encontrado' });
        }
        // Determinar si se debe actualizar publicadoEn
        let publicadoEn = currentPost.publicadoEn;
        if (estado === 'PUBLICADO' && currentPost.estado !== 'PUBLICADO') {
            publicadoEn = new Date();
        }
        const post = await prisma.cMSBlogPost.update({
            where: { id: parseInt(id) },
            data: {
                ...(titulo && { titulo }),
                ...(tituloSeo && { tituloSeo }),
                ...(descripcion && { descripcion }),
                ...(descripcionSeo && { descripcionSeo }),
                ...(palabrasClave !== undefined && { palabrasClave }),
                ...(autor && { autor }),
                ...(miniatura !== undefined && { miniatura }),
                ...(cuerpo && { cuerpo }),
                ...(estado && { estado }),
                // @deprecated programadoPara - scheduling removed, field not updated
                ...(publicadoEn && { publicadoEn })
            }
        });
        res.json(post);
    }
    catch (error) {
        console.error('Error al actualizar artículo:', error);
        res.status(500).json({ error: 'Error al actualizar artículo' });
    }
};
// Eliminar un artículo
export const deleteBlogPost = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.cMSBlogPost.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Artículo eliminado exitosamente' });
    }
    catch (error) {
        console.error('Error al eliminar artículo:', error);
        res.status(500).json({ error: 'Error al eliminar artículo' });
    }
};
// Archivar un artículo
export const archiveBlogPost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await prisma.cMSBlogPost.update({
            where: { id: parseInt(id) },
            data: { estado: 'ARCHIVADO' }
        });
        res.json(post);
    }
    catch (error) {
        console.error('Error al archivar artículo:', error);
        res.status(500).json({ error: 'Error al archivar artículo' });
    }
};
