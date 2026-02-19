import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export type Role = 'CLIENTA' | 'VENDEDOR' | 'ADMIN_CMS' | 'GERENTE_COMERCIAL' | 'SUPER_SU' | 'DUENA' | 'DESARROLLADOR';

export interface JwtUser {
  id: string;
  role: Role;
  email: string;
  nombre?: string;
  apellido?: string;
}

export interface AuthedRequest extends Request {
  user?: JwtUser;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  console.log(`🔐 [Auth] Verificando autenticación para: ${req.method} ${req.path}`);
  
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    console.log(`❌ [Auth] No se encontró token Bearer en headers`);
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  const token = auth.substring(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtUser;
    req.user = payload;
    console.log(`✅ [Auth] Token válido para usuario: ${payload.email} | Rol: ${payload.role}`);
    return next();
  } catch (e) {
    console.log(`❌ [Auth] Token inválido:`, e instanceof Error ? e.message : e);
    return res.status(401).json({ error: 'Token inválido' });
  }
}

/**
 * Middleware de autenticación opcional
 * Si hay un token válido, añade el usuario a req.user
 * Si no hay token o es inválido, continúa sin usuario
 */
export function optionalAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  
  if (!auth?.startsWith('Bearer ')) {
    // Sin token - continuar como visitante
    return next();
  }
  
  const token = auth.substring(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtUser;
    req.user = payload;
    console.log(`✅ [Auth Optional] Usuario logueado: ${payload.email}`);
  } catch (e) {
    // Token inválido - continuar como visitante
    console.log(`ℹ️ [Auth Optional] Token inválido, continuando como visitante`);
  }
  
  return next();
}

export function requireRole(...roles: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Acceso denegado' });
    return next();
  };
}

/**
 * Middleware that requires authentication and CMS role access
 * Allows: DUENA, DESARROLLADOR, ADMIN_CMS, GERENTE_COMERCIAL, SUPER_SU, VENDEDOR
 */
export function requireCMSAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  console.log(`🔐 [CMS Auth Basic] Verificando autenticación CMS para: ${req.method} ${req.path}`);
  
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    console.log(`❌ [CMS Auth Basic] No se encontró token Bearer`);
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  const token = auth.substring(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtUser;
    req.user = payload;
    
    // Verify CMS role
    const cmsRoles: Role[] = ['DUENA', 'DESARROLLADOR', 'ADMIN_CMS', 'GERENTE_COMERCIAL', 'SUPER_SU', 'VENDEDOR'];
    if (!cmsRoles.includes(payload.role)) {
      console.log(`🚫 [CMS Auth Basic] Rol ${payload.role} no permitido para CMS`);
      return res.status(403).json({ error: 'Acceso denegado - Se requiere rol CMS' });
    }
    
    console.log(`✅ [CMS Auth Basic] Acceso autorizado para: ${payload.email} | Rol: ${payload.role}`);
    return next();
  } catch (e) {
    console.log(`❌ [CMS Auth Basic] Token inválido:`, e instanceof Error ? e.message : e);
    return res.status(401).json({ error: 'Token inválido' });
  }
}
