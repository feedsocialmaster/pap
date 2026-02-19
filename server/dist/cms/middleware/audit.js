import { prisma } from '../../prisma.js';
export const createAuditLog = async (userId, data, req) => {
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
    }
    catch (error) {
        console.error('Error creando registro de auditoría:', error);
        // No lanzamos el error para no interrumpir la operación principal
    }
};
// Middleware para auditar automáticamente
export const auditMiddleware = (entidad) => {
    return async (req, res, next) => {
        // Guardamos la función original de res.json
        const originalJson = res.json.bind(res);
        // Sobrescribimos res.json para capturar la respuesta
        res.json = function (body) {
            // Solo auditamos si la operación fue exitosa (2xx)
            if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
                let accion = null;
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
                    createAuditLog(req.user.id, {
                        accion,
                        entidad,
                        entidadId,
                        cambios: req.method !== 'DELETE' ? req.body : null,
                    }, req);
                }
            }
            return originalJson(body);
        };
        next();
    };
};
