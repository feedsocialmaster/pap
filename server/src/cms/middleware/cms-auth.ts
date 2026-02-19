import { Request, Response, NextFunction } from 'express';
import { AuthedRequest } from '../../middleware/auth.js';

type CMSRole = 'DUENA' | 'DESARROLLADOR' | 'GERENTE_COMERCIAL' | 'ADMIN_CMS' | 'SUPER_SU' | 'VENDEDOR';

// Middleware básico que solo permite acceso a usuarios con roles de CMS
export const cmsAuth = (req: AuthedRequest, res: Response, next: NextFunction) => {
  console.log(`🔐 [CMS Auth] Verificando acceso para endpoint: ${req.method} ${req.path}`);
  
  if (!req.user) {
    console.log(`❌ [CMS Auth] Usuario no autenticado para ${req.path}`);
    return res.status(401).json({ error: 'No autenticado' });
  }

  console.log(`👤 [CMS Auth] Usuario: ${req.user.email} | Rol: ${req.user.role}`);

  const cmsRoles: CMSRole[] = ['DUENA', 'DESARROLLADOR', 'GERENTE_COMERCIAL', 'ADMIN_CMS', 'SUPER_SU', 'VENDEDOR'];
  
  // Si el usuario no tiene un rol de CMS, denegar acceso
  if (!cmsRoles.includes(req.user.role as CMSRole)) {
    console.log(`🚫 [CMS Auth] Rol ${req.user.role} no permitido para CMS`);
    return res.status(403).json({ 
      error: 'No tienes permisos para acceder al CMS' 
    });
  }

  console.log(`✅ [CMS Auth] Acceso autorizado para ${req.user.role}`);
  next();
};

export const requireCMSAccess = (allowedRoles?: CMSRole[]) => {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    console.log(`🔐 [RequireCMSAccess] Verificando roles para: ${req.method} ${req.path}`);
    
    if (!req.user) {
      console.log(`❌ [RequireCMSAccess] Usuario no autenticado`);
      return res.status(401).json({ error: 'No autenticado' });
    }

    console.log(`👤 [RequireCMSAccess] Usuario: ${req.user.email} | Rol: ${req.user.role}`);

    const cmsRoles: CMSRole[] = ['DUENA', 'DESARROLLADOR', 'GERENTE_COMERCIAL', 'ADMIN_CMS', 'SUPER_SU', 'VENDEDOR'];
    
    // Si el usuario no tiene un rol de CMS, denegar acceso
    if (!cmsRoles.includes(req.user.role as CMSRole)) {
      console.log(`🚫 [RequireCMSAccess] Rol ${req.user.role} no es rol CMS`);
      return res.status(403).json({ 
        error: 'No tienes permisos para acceder al CMS' 
      });
    }

    // Si se especificaron roles permitidos, validar
    if (allowedRoles && allowedRoles.length > 0) {
      console.log(`🔍 [RequireCMSAccess] Verificando roles específicos: ${allowedRoles.join(', ')}`);
      if (!allowedRoles.includes(req.user.role as CMSRole)) {
        console.log(`🚫 [RequireCMSAccess] Rol ${req.user.role} no está en roles permitidos`);
        return res.status(403).json({ 
          error: 'No tienes permisos para realizar esta acción' 
        });
      }
    }

    console.log(`✅ [RequireCMSAccess] Acceso autorizado`);
    next();
  };
};

export const requireRole = (roles: CMSRole[]) => {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    console.log(`🔐 [RequireRole] Verificando roles específicos: ${roles.join(', ')}`);
    
    if (!req.user) {
      console.log(`❌ [RequireRole] Usuario no autenticado`);
      return res.status(401).json({ error: 'No autenticado' });
    }

    console.log(`👤 [RequireRole] Usuario: ${req.user.email} | Rol: ${req.user.role}`);

    if (!roles.includes(req.user.role as CMSRole)) {
      console.log(`🚫 [RequireRole] Rol ${req.user.role} no está en roles requeridos`);
      return res.status(403).json({ 
        error: `Se requiere uno de los siguientes roles: ${roles.join(', ')}` 
      });
    }

    console.log(`✅ [RequireRole] Acceso autorizado`);
    next();
  };
};
export const CMSPermissions = {
  // Dashboard - Todos los roles CMS
  viewDashboard: ['DUENA', 'DESARROLLADOR', 'GERENTE_COMERCIAL', 'ADMIN_CMS', 'SUPER_SU', 'VENDEDOR'],
  
  // Mensajes - Todos los roles CMS
  viewMessages: ['DUENA', 'DESARROLLADOR', 'GERENTE_COMERCIAL', 'ADMIN_CMS', 'SUPER_SU', 'VENDEDOR'],
  sendMessages: ['DUENA', 'DESARROLLADOR', 'GERENTE_COMERCIAL', 'ADMIN_CMS', 'SUPER_SU', 'VENDEDOR'],
  
  // Contenido Web - DUENA, DESARROLLADOR, ADMIN_CMS, SUPER_SU
  manageEvents: ['DUENA', 'DESARROLLADOR', 'ADMIN_CMS', 'SUPER_SU'],
  manageResources: ['DUENA', 'DESARROLLADOR', 'ADMIN_CMS', 'SUPER_SU'],
  managePromotions: ['DUENA', 'DESARROLLADOR', 'ADMIN_CMS', 'SUPER_SU'],
  manageNotifications: ['DUENA', 'DESARROLLADOR', 'ADMIN_CMS', 'SUPER_SU'],
  manageImages: ['DUENA', 'DESARROLLADOR', 'ADMIN_CMS', 'SUPER_SU'],
  manageContent: ['DUENA', 'DESARROLLADOR', 'ADMIN_CMS', 'SUPER_SU'],
  
  // Productos - DUENA, DESARROLLADOR, SUPER_SU
  manageProducts: ['DUENA', 'DESARROLLADOR', 'SUPER_SU'],
  deleteProducts: ['DESARROLLADOR', 'SUPER_SU'], // DESARROLLADOR y SUPER_SU pueden eliminar
  
  // Ventas - Todos pueden ver, solo DUENA, DESARROLLADOR y SUPER_SU pueden modificar
  viewSales: ['DUENA', 'DESARROLLADOR', 'GERENTE_COMERCIAL', 'ADMIN_CMS', 'SUPER_SU', 'VENDEDOR'],
  manageSales: ['DUENA', 'DESARROLLADOR', 'SUPER_SU'],
  
  // Pedidos - Todos pueden ver, DUENA, DESARROLLADOR y SUPER_SU pueden gestionar
  viewOrders: ['DUENA', 'DESARROLLADOR', 'GERENTE_COMERCIAL', 'ADMIN_CMS', 'SUPER_SU', 'VENDEDOR'],
  manageOrders: ['DUENA', 'DESARROLLADOR', 'SUPER_SU'],
  
  // Comprobantes - Todos pueden ver
  viewReceipts: ['DUENA', 'DESARROLLADOR', 'GERENTE_COMERCIAL', 'ADMIN_CMS', 'SUPER_SU', 'VENDEDOR'],
  
  // Configuración del CMS - Solo DESARROLLADOR y SUPER_SU
  manageSettings: ['DESARROLLADOR', 'SUPER_SU'],
  viewAuditLog: ['DUENA', 'DESARROLLADOR', 'SUPER_SU'],
} as const;

export const hasPermission = (permission: keyof typeof CMSPermissions) => {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const allowedRoles = CMSPermissions[permission];
    if (!allowedRoles.includes(req.user.role as any)) {
      return res.status(403).json({ 
        error: 'No tienes permisos para realizar esta acción' 
      });
    }

    next();
  };
};
