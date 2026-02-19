import { Router } from 'express';
import {
  getBlogPosts,
  getPublishedPosts,
  getBlogPostBySlug,
  getRelatedPosts,
  getBlogPostById,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  archiveBlogPost
} from '../controllers/blog.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireCMSAccess } from '../middleware/cms-auth.js';

const router = Router();

// Rutas públicas
router.get('/publicados', getPublishedPosts);
router.get('/slug/:slug', getBlogPostBySlug);
router.get('/slug/:slug/relacionados', getRelatedPosts);

// Rutas protegidas para el CMS
const cmsAuth = [requireAuth, requireCMSAccess()];
router.get('/', cmsAuth, getBlogPosts);
router.get('/:id', cmsAuth, getBlogPostById);
router.post('/', cmsAuth, createBlogPost);
router.put('/:id', cmsAuth, updateBlogPost);
router.delete('/:id', cmsAuth, deleteBlogPost);
router.patch('/:id/archivar', cmsAuth, archiveBlogPost);

export default router;
