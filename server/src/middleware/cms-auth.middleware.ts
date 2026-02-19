import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Role } from './auth.js';

export interface CMSUser {
  id: string;
  role: Role;
  email: string;
  nombre?: string;
  apellido?: string;
}

export interface CMSRequest extends Request {
  user?: CMSUser;
}

/**
 * Middleware para verificar autenticación CMS
 * Acepta token desde cookie 'cms_jwt' o header 'Authorization: Bearer <token>'
 */
export function verifyCMSAuth(req: CMSRequest, res: Response, next: NextFunction) {
  // Intentar obtener token desde cookie o header
  const cookieToken = req.cookies?.cms_jwt;
  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  const token = cookieToken || headerToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No autorizado. Token no proporcionado.',
    });
  }

  try {
    // Verificar token
    const payload = jwt.verify(token, env.JWT_SECRET) as CMSUser;

    // Verificar que sea un usuario CMS
    const allowedRoles: Role[] = ['ADMIN_CMS', 'SUPER_SU', 'GERENTE_COMERCIAL'];
    
    if (!allowedRoles.includes(payload.role)) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado. Solo usuarios CMS pueden acceder.',
      });
    }

    // Asignar usuario a la request
    req.user = payload;
    return next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token inválido',
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Error de autenticación',
    });
  }
}

/**
 * Middleware para requerir roles específicos de CMS
 */
export function requireCMSRole(...roles: Role[]) {
  return (req: CMSRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Acceso denegado. Se requiere uno de los siguientes roles: ${roles.join(', ')}`,
      });
    }

    return next();
  };
}
