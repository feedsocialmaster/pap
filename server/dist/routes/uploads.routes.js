import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth, requireRole } from '../middleware/auth.js';
const router = Router();
const uploadDir = path.join(process.cwd(), 'src', 'uploads');
if (!fs.existsSync(uploadDir))
    fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext).replace(/[^a-z0-9\-]/gi, '_');
        cb(null, `${Date.now()}_${base}${ext}`);
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.mimetype))
            return cb(new Error('Formato no soportado'));
        cb(null, true);
    },
});
// Subir una sola imagen
router.post('/', requireAuth, requireRole('ADMIN_CMS', 'SUPER_SU'), upload.single('image'), (req, res) => {
    const file = req.file;
    const publicUrl = `/uploads/${file.filename}`;
    res.status(201).json({ success: true, data: { url: publicUrl } });
});
// Subir múltiples imágenes para productos (máximo 8)
router.post('/productos', requireAuth, requireRole('ADMIN_CMS', 'SUPER_SU'), upload.array('images', 8), (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No se recibieron imágenes' });
        }
        if (files.length > 8) {
            // Eliminar los archivos subidos si hay más de 8
            files.forEach(file => {
                fs.unlinkSync(file.path);
            });
            return res.status(400).json({ error: 'Máximo 8 imágenes permitidas' });
        }
        const urls = files.map(file => ({
            url: `/uploads/${file.filename}`,
            filename: file.filename
        }));
        res.status(201).json({
            success: true,
            data: {
                urls,
                count: files.length
            }
        });
    }
    catch (error) {
        console.error('Error al subir imágenes:', error);
        res.status(500).json({ error: 'Error al subir las imágenes' });
    }
});
// Subir imagen para blog
router.post('/blog', requireAuth, requireRole('ADMIN_CMS', 'SUPER_SU'), upload.single('image'), (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No se recibió ninguna imagen' });
        }
        const publicUrl = `/uploads/${file.filename}`;
        res.status(201).json({
            success: true,
            data: { url: publicUrl }
        });
    }
    catch (error) {
        console.error('Error al subir imagen de blog:', error);
        res.status(500).json({ error: 'Error al subir la imagen' });
    }
});
// Configuración específica para banners del carrusel
const bannerUpload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB máximo
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/jpg', 'image/webp'];
        if (!allowed.includes(file.mimetype)) {
            return cb(new Error('Solo se permiten formatos JPEG, JPG y WEBP'));
        }
        cb(null, true);
    },
});
// Subir imagen para banners del carrusel
router.post('/banners', requireAuth, requireRole('ADMIN_CMS', 'SUPER_SU'), bannerUpload.single('image'), (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No se recibió ninguna imagen' });
        }
        const publicUrl = `/uploads/${file.filename}`;
        res.status(201).json({
            success: true,
            data: {
                url: publicUrl,
                filename: file.filename,
                size: file.size,
                mimetype: file.mimetype
            }
        });
    }
    catch (error) {
        console.error('Error al subir imagen de banner:', error);
        res.status(500).json({ error: 'Error al subir la imagen del banner' });
    }
});
// Configuración de multer para videos
const videoStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext).replace(/[^a-z0-9\-]/gi, '_');
        cb(null, `video_${Date.now()}_${base}${ext}`);
    },
});
const uploadVideo = multer({
    storage: videoStorage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (_req, file, cb) => {
        const allowed = ['video/mp4', 'video/webm', 'video/ogg'];
        if (!allowed.includes(file.mimetype))
            return cb(new Error('Formato de video no soportado'));
        cb(null, true);
    },
});
// Subir video para blog
router.post('/blog-video', requireAuth, requireRole('ADMIN_CMS', 'SUPER_SU'), uploadVideo.single('video'), (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No se recibió ningún video' });
        }
        const publicUrl = `/uploads/${file.filename}`;
        res.status(201).json({
            success: true,
            data: { url: publicUrl }
        });
    }
    catch (error) {
        console.error('Error al subir video de blog:', error);
        res.status(500).json({ error: 'Error al subir el video' });
    }
});
// Subir imagen para promociones
router.post('/promociones', requireAuth, requireRole('ADMIN_CMS', 'SUPER_SU'), upload.single('image'), (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No se recibió ninguna imagen' });
        }
        const publicUrl = `/uploads/${file.filename}`;
        res.status(201).json({
            success: true,
            data: {
                url: publicUrl,
                filename: file.filename,
                size: file.size,
                mimetype: file.mimetype
            }
        });
    }
    catch (error) {
        console.error('Error al subir imagen de promoción:', error);
        res.status(500).json({ error: 'Error al subir la imagen de promoción' });
    }
});
// ============================================================================
// FACTURAS (PDF)
// ============================================================================
// Configuración de multer para facturas PDF
const facturaStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext).replace(/[^a-z0-9\-]/gi, '_');
        cb(null, `factura_${Date.now()}_${base}${ext}`);
    },
});
const uploadFactura = multer({
    storage: facturaStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo para PDFs
    fileFilter: (_req, file, cb) => {
        const allowed = ['application/pdf'];
        if (!allowed.includes(file.mimetype)) {
            return cb(new Error('Solo se permiten archivos PDF'));
        }
        cb(null, true);
    },
});
// Subir factura PDF para una orden
router.post('/facturas', requireAuth, requireRole('ADMIN_CMS', 'SUPER_SU'), uploadFactura.single('factura'), (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No se recibió ningún archivo PDF' });
        }
        const publicUrl = `/uploads/${file.filename}`;
        res.status(201).json({
            success: true,
            data: {
                url: publicUrl,
                filename: file.filename,
                size: file.size,
                mimetype: file.mimetype
            }
        });
    }
    catch (error) {
        console.error('Error al subir factura PDF:', error);
        res.status(500).json({ error: 'Error al subir la factura PDF' });
    }
});
// Eliminar archivo de factura
router.delete('/facturas/:filename', requireAuth, requireRole('ADMIN_CMS', 'SUPER_SU'), (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(uploadDir, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ success: true, message: 'Factura eliminada correctamente' });
        }
        else {
            res.status(404).json({ error: 'Archivo no encontrado' });
        }
    }
    catch (error) {
        console.error('Error al eliminar factura:', error);
        res.status(500).json({ error: 'Error al eliminar la factura' });
    }
});
export default router;
