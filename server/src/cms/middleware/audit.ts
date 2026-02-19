import { Response, NextFunction } from 'express';
import { prisma } from '../../prisma.js';
import { AuthedRequest } from '../../middleware/auth.js';

interface AuditLogData {
  accion: 'CREATE' | 'UPDATE' | 'DELETE';
  entidad: string;
  entidadId: string;
  cambios?: any;
}

export const createAuditLog = async (
  userId: string,
  data: AuditLogData,
  req: AuthedRequest
) => {
  try {
    await prisma.cMSAuditLog.create({
      data: {
        usuarioId: userId,
        accion: data.accion,
        entidad: data.entidad,
        entidadId: data.entidadId,
        cambios: data.cambios || {},
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get('user-agent') || null,
      },
    });
  } catch (error) {
    console.error('Error creando registro de auditoría:', error);
    // No lanzamos el error para no interrumpir la operación principal
  }
};

// Middleware para auditar automáticamente
export const auditMiddleware = (entidad: string) => {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    // Guardamos la función original de res.json
    const originalJson = res.json.bind(res);

    // Sobrescribimos res.json para capturar la respuesta
    res.json = function (body: any) {
      // Solo auditamos si la operación fue exitosa (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        let accion: 'CREATE' | 'UPDATE' | 'DELETE' | null = null;
        
        switch (req.method) {
          case 'POST':
            accion = 'CREATE';
            break;
          case 'PUT':
          case 'PATCH':
            accion = 'UPDATE';
            break;
          case 'DELETE':
            accion = 'DELETE';
            break;
        }

        if (accion) {
          const entidadId = req.params.id || body?.id || 'unknown';
          
          createAuditLog(
            req.user.id,
            {
              accion,
              entidad,
              entidadId,
              cambios: req.method !== 'DELETE' ? req.body : null,
            },
            req
          );
        }
      }

      return originalJson(body);
    };

    next();
  };
};
