/**
 * Middleware de Permisos para Usuarios del CMS
 *
 * Implementa la política de seguridad para acciones sobre usuarios:
 *
 * REGLAS PRINCIPALES:
 * 1. Un superuser no puede ejecutar acciones (Ver/Editar/Eliminar) sobre su propia cuenta
 * 2. Nadie puede eliminar una cuenta con rol SUPER_SU (HTTP 403)
 * 3. ADMIN_CMS no puede modificar otros ADMIN_CMS ni SUPER_SU
 * 4. VENDEDOR no puede crear usuarios con ningún rol
 * 5. ADMIN_CMS no puede crear usuarios con rol SUPER_SU
 * 6. Solo SUPER_SU puede crear otros SUPER_SU
 *
 * AUDITORÍA:
 * - Todos los intentos de eliminación de SUPER_SU se registran
 * - Se registra: actorId, targetId, timestamp, IP, motivo
 */
import { prisma } from '../../prisma.js';
// Constantes de roles
const ROLE_SUPER_SU = 'SUPER_SU';
const ROLE_ADMIN_CMS = 'ADMIN_CMS';
const ROLE_VENDEDOR = 'VENDEDOR';
// Token de mantenimiento para operaciones especiales (debe estar en variable de entorno)
const ROOT_MAINTENANCE_TOKEN = process.env.ROOT_MAINTENANCE_TOKEN;
/**
 * Registra un intento de acción sobre usuario en auditoría
 */
async function logUserActionAudit(data) {
    try {
        await prisma.cMSAuditLog.create({
            data: {
                usuarioId: data.actorId,
                accion: `USER_ACTION_${data.action.toUpperCase()}`,
                entidad: 'User',
                entidadId: data.targetId,
                ipAddress: data.ip,
                userAgent: data.userAgent,
                cambios: {
                    actorRole: data.actorRole,
                    targetRole: data.targetRole,
                    endpoint: data.endpoint,
                    outcome: data.outcome,
                    reason: data.reason,
                    attemptedRole: data.attemptedRole,
                    targetData: data.targetData,
                    timestamp: new Date().toISOString(),
                },
            },
        });
    }
    catch (error) {
        console.error('[UserPermissions] Error registrando auditoría:', error);
    }
}
/**
 * Obtiene la IP del cliente desde la request
 */
function getClientIP(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
    }
    if (Array.isArray(forwarded)) {
        return forwarded[0];
    }
    return req.socket?.remoteAddress || 'unknown';
}
/**
 * Middleware para validar permisos antes de ELIMINAR un usuario
 *
 * Reglas:
 * - NADIE puede eliminar un SUPER_SU (siempre 403)
 * - Un usuario no puede eliminarse a sí mismo
 * - ADMIN_CMS no puede eliminar otros ADMIN_CMS
 * - VENDEDOR no puede eliminar usuarios
 */
export async function authorizeUserDelete(req, res, next) {
    const actor = req.user;
    const targetId = req.params.id;
    if (!actor) {
        return res.status(401).json({ error: 'No autenticado' });
    }
    // Verificar si hay token de mantenimiento root (bypass para operaciones especiales)
    const rootToken = req.headers['x-root-maintenance-token'];
    if (rootToken && ROOT_MAINTENANCE_TOKEN && rootToken === ROOT_MAINTENANCE_TOKEN) {
        console.log(`[UserPermissions] ⚠️ Operación con token de mantenimiento root por: ${actor.email}`);
        await logUserActionAudit({
            actorId: actor.id,
            actorRole: actor.role || 'unknown',
            targetId,
            action: 'DELETE_WITH_ROOT_TOKEN',
            endpoint: req.originalUrl,
            ip: getClientIP(req),
            userAgent: req.headers['user-agent'],
            outcome: 'success',
            reason: 'Root maintenance token used',
        });
        return next();
    }
    try {
        // Obtener el usuario objetivo
        const target = await prisma.user.findUnique({
            where: { id: targetId },
            select: { id: true, role: true, email: true, nombre: true, apellido: true },
        });
        if (!target) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        // REGLA 1: Nadie puede eliminar un SUPER_SU
        if (target.role === ROLE_SUPER_SU) {
            await logUserActionAudit({
                actorId: actor.id,
                actorRole: actor.role || 'unknown',
                targetId,
                targetRole: target.role,
                action: 'DELETE_ATTEMPT',
                endpoint: req.originalUrl,
                ip: getClientIP(req),
                userAgent: req.headers['user-agent'],
                outcome: 'forbidden',
                reason: 'Eliminación de superuser no permitida',
            });
            return res.status(403).json({
                error: 'Prohibido: eliminación de superuser',
                codigo: 'SUPERUSER_DELETE_FORBIDDEN',
                mensaje: 'La eliminación de cuentas Superuser no está permitida desde este panel. Contacte al administrador del sistema.',
            });
        }
        // REGLA 2: Un usuario no puede eliminarse a sí mismo
        if (actor.id === targetId) {
            await logUserActionAudit({
                actorId: actor.id,
                actorRole: actor.role || 'unknown',
                targetId,
                targetRole: target.role,
                action: 'DELETE_ATTEMPT',
                endpoint: req.originalUrl,
                ip: getClientIP(req),
                userAgent: req.headers['user-agent'],
                outcome: 'forbidden',
                reason: 'No puede eliminar su propia cuenta',
            });
            return res.status(403).json({
                error: 'Prohibido: no puede eliminar su propia cuenta',
                codigo: 'SELF_DELETE_FORBIDDEN',
            });
        }
        // REGLA 3: VENDEDOR no puede eliminar usuarios
        if (actor.role === ROLE_VENDEDOR) {
            await logUserActionAudit({
                actorId: actor.id,
                actorRole: actor.role,
                targetId,
                targetRole: target.role,
                action: 'DELETE_ATTEMPT',
                endpoint: req.originalUrl,
                ip: getClientIP(req),
                userAgent: req.headers['user-agent'],
                outcome: 'forbidden',
                reason: 'Vendedor no tiene permisos para eliminar usuarios',
            });
            return res.status(403).json({
                error: 'Prohibido: no tiene permisos para eliminar usuarios',
                codigo: 'VENDEDOR_DELETE_FORBIDDEN',
            });
        }
        // REGLA 4: ADMIN_CMS no puede eliminar otros ADMIN_CMS
        if (actor.role === ROLE_ADMIN_CMS && target.role === ROLE_ADMIN_CMS) {
            await logUserActionAudit({
                actorId: actor.id,
                actorRole: actor.role,
                targetId,
                targetRole: target.role,
                action: 'DELETE_ATTEMPT',
                endpoint: req.originalUrl,
                ip: getClientIP(req),
                userAgent: req.headers['user-agent'],
                outcome: 'forbidden',
                reason: 'Admin no puede eliminar otros admins',
            });
            return res.status(403).json({
                error: 'No tienes permisos para eliminar otros administradores',
                codigo: 'ADMIN_DELETE_ADMIN_FORBIDDEN',
            });
        }
        // Todo bien, continuar
        next();
    }
    catch (error) {
        console.error('[UserPermissions] Error en authorizeUserDelete:', error);
        return res.status(500).json({ error: 'Error al verificar permisos' });
    }
}
/**
 * Middleware para validar permisos antes de EDITAR un usuario
 *
 * Reglas:
 * - SUPER_SU no puede editar su propia cuenta desde el CMS
 * - ADMIN_CMS no puede editar SUPER_SU
 * - ADMIN_CMS no puede editar otros ADMIN_CMS (solo a sí mismo)
 * - VENDEDOR no puede editar usuarios
 */
export async function authorizeUserEdit(req, res, next) {
    const actor = req.user;
    const targetId = req.params.id;
    if (!actor) {
        return res.status(401).json({ error: 'No autenticado' });
    }
    try {
        // Obtener el usuario objetivo
        const target = await prisma.user.findUnique({
            where: { id: targetId },
            select: { id: true, role: true, email: true },
        });
        if (!target) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        // REGLA 1: SUPER_SU no puede editar su propia cuenta desde el CMS
        if (actor.id === targetId && actor.role === ROLE_SUPER_SU) {
            await logUserActionAudit({
                actorId: actor.id,
                actorRole: actor.role,
                targetId,
                targetRole: target.role,
                action: 'EDIT_ATTEMPT',
                endpoint: req.originalUrl,
                ip: getClientIP(req),
                userAgent: req.headers['user-agent'],
                outcome: 'forbidden',
                reason: 'Superuser no puede editar su propia cuenta desde el CMS',
            });
            return res.status(403).json({
                error: 'Prohibido: acción sobre la propia cuenta superuser',
                codigo: 'SUPERUSER_SELF_EDIT_FORBIDDEN',
                mensaje: 'Un Superuser no puede modificar su propia cuenta desde el CMS.',
            });
        }
        // REGLA 2: VENDEDOR no puede editar usuarios
        if (actor.role === ROLE_VENDEDOR) {
            await logUserActionAudit({
                actorId: actor.id,
                actorRole: actor.role,
                targetId,
                targetRole: target.role,
                action: 'EDIT_ATTEMPT',
                endpoint: req.originalUrl,
                ip: getClientIP(req),
                userAgent: req.headers['user-agent'],
                outcome: 'forbidden',
                reason: 'Vendedor no tiene permisos para editar usuarios',
            });
            return res.status(403).json({
                error: 'Prohibido: no tiene permisos para editar usuarios',
                codigo: 'VENDEDOR_EDIT_FORBIDDEN',
            });
        }
        // REGLA 3: ADMIN_CMS no puede editar SUPER_SU
        if (actor.role === ROLE_ADMIN_CMS && target.role === ROLE_SUPER_SU) {
            await logUserActionAudit({
                actorId: actor.id,
                actorRole: actor.role,
                targetId,
                targetRole: target.role,
                action: 'EDIT_ATTEMPT',
                endpoint: req.originalUrl,
                ip: getClientIP(req),
                userAgent: req.headers['user-agent'],
                outcome: 'forbidden',
                reason: 'Admin no puede editar superuser',
            });
            return res.status(403).json({
                error: 'No tienes permisos para modificar usuarios Super SU',
                codigo: 'ADMIN_EDIT_SUPERUSER_FORBIDDEN',
            });
        }
        // REGLA 4: ADMIN_CMS no puede editar otros ADMIN_CMS (solo a sí mismo)
        if (actor.role === ROLE_ADMIN_CMS && target.role === ROLE_ADMIN_CMS && actor.id !== targetId) {
            await logUserActionAudit({
                actorId: actor.id,
                actorRole: actor.role,
                targetId,
                targetRole: target.role,
                action: 'EDIT_ATTEMPT',
                endpoint: req.originalUrl,
                ip: getClientIP(req),
                userAgent: req.headers['user-agent'],
                outcome: 'forbidden',
                reason: 'Admin no puede editar otros admins',
            });
            return res.status(403).json({
                error: 'No tienes permisos para modificar otros administradores',
                codigo: 'ADMIN_EDIT_ADMIN_FORBIDDEN',
            });
        }
        // Validar que no se intente cambiar el rol a SUPER_SU si el actor no es SUPER_SU
        const { role: newRole } = req.body;
        if (newRole === ROLE_SUPER_SU && actor.role !== ROLE_SUPER_SU) {
            await logUserActionAudit({
                actorId: actor.id,
                actorRole: actor.role || 'unknown',
                targetId,
                targetRole: target.role,
                action: 'ROLE_CHANGE_ATTEMPT',
                endpoint: req.originalUrl,
                ip: getClientIP(req),
                userAgent: req.headers['user-agent'],
                outcome: 'forbidden',
                reason: 'Solo superuser puede asignar rol superuser',
                attemptedRole: newRole,
            });
            return res.status(403).json({
                error: 'Prohibido: creación de superuser',
                codigo: 'SUPERUSER_ROLE_ASSIGN_FORBIDDEN',
                mensaje: 'Solo un Superuser puede asignar el rol Superuser a otros usuarios.',
            });
        }
        // Todo bien, continuar
        next();
    }
    catch (error) {
        console.error('[UserPermissions] Error en authorizeUserEdit:', error);
        return res.status(500).json({ error: 'Error al verificar permisos' });
    }
}
/**
 * Middleware para validar permisos antes de CREAR un usuario
 *
 * Reglas:
 * - VENDEDOR no puede crear usuarios
 * - ADMIN_CMS no puede crear SUPER_SU
 * - Solo SUPER_SU puede crear otros SUPER_SU
 */
export async function authorizeUserCreate(req, res, next) {
    const actor = req.user;
    if (!actor) {
        return res.status(401).json({ error: 'No autenticado' });
    }
    const { role: newRole, email } = req.body;
    // REGLA 1: VENDEDOR no puede crear usuarios
    if (actor.role === ROLE_VENDEDOR) {
        await logUserActionAudit({
            actorId: actor.id,
            actorRole: actor.role,
            targetId: 'new_user',
            action: 'CREATE_ATTEMPT',
            endpoint: req.originalUrl,
            ip: getClientIP(req),
            userAgent: req.headers['user-agent'],
            outcome: 'forbidden',
            reason: 'Vendedor no tiene permisos para crear usuarios',
            attemptedRole: newRole,
            targetData: { email, role: newRole },
        });
        return res.status(403).json({
            error: 'Prohibido: no tiene permisos para crear usuarios',
            codigo: 'VENDEDOR_CREATE_FORBIDDEN',
        });
    }
    // REGLA 2: Solo SUPER_SU puede crear otros SUPER_SU
    if (newRole === ROLE_SUPER_SU && actor.role !== ROLE_SUPER_SU) {
        await logUserActionAudit({
            actorId: actor.id,
            actorRole: actor.role || 'unknown',
            targetId: 'new_user',
            action: 'CREATE_ATTEMPT',
            endpoint: req.originalUrl,
            ip: getClientIP(req),
            userAgent: req.headers['user-agent'],
            outcome: 'forbidden',
            reason: 'Solo superuser puede crear otros superuser',
            attemptedRole: newRole,
            targetData: { email, role: newRole },
        });
        return res.status(403).json({
            error: 'Prohibido: creación de superuser',
            codigo: 'SUPERUSER_CREATE_FORBIDDEN',
            mensaje: 'Solo un Superuser puede crear cuentas con rol Superuser.',
        });
    }
    // Todo bien, continuar
    next();
}
/**
 * Middleware para validar permisos antes de VER detalles de un usuario
 *
 * Reglas:
 * - SUPER_SU puede ver su propia cuenta (pero las acciones estarán deshabilitadas en UI)
 * - ADMIN_CMS no puede ver detalles de SUPER_SU
 * - VENDEDOR puede ver pero no modificar
 */
export async function authorizeUserView(req, res, next) {
    const actor = req.user;
    const targetId = req.params.id;
    if (!actor) {
        return res.status(401).json({ error: 'No autenticado' });
    }
    try {
        // Obtener el usuario objetivo
        const target = await prisma.user.findUnique({
            where: { id: targetId },
            select: { id: true, role: true },
        });
        if (!target) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        // REGLA: ADMIN_CMS no puede ver detalles de SUPER_SU
        if (actor.role === ROLE_ADMIN_CMS && target.role === ROLE_SUPER_SU) {
            return res.status(403).json({
                error: 'No tienes permisos para ver usuarios Super SU',
                codigo: 'ADMIN_VIEW_SUPERUSER_FORBIDDEN',
            });
        }
        // Todo bien, continuar
        next();
    }
    catch (error) {
        console.error('[UserPermissions] Error en authorizeUserView:', error);
        return res.status(500).json({ error: 'Error al verificar permisos' });
    }
}
/**
 * Calcula los permisos de acciones sobre un usuario
 * Usado por la UI para determinar qué botones mostrar/habilitar
 */
export function calculateUserActionPermissions(actorRole, actorId, targetRole, targetId) {
    const isSameAccount = actorId === targetId;
    const isTargetSuperuser = targetRole === ROLE_SUPER_SU;
    const isActorSuperuser = actorRole === ROLE_SUPER_SU;
    const isActorAdmin = actorRole === ROLE_ADMIN_CMS;
    const isActorVendedor = actorRole === ROLE_VENDEDOR;
    const isTargetAdmin = targetRole === ROLE_ADMIN_CMS;
    let canView = true;
    let canEdit = true;
    let canDelete = true;
    let deleteTooltip;
    let editTooltip;
    let viewTooltip;
    // REGLA 1: SUPER_SU no puede actuar sobre su propia cuenta
    if (isSameAccount && isActorSuperuser) {
        canView = true; // Puede ver su perfil
        canEdit = false;
        canDelete = false;
        editTooltip = 'No puede editar su propia cuenta desde el CMS';
        deleteTooltip = 'No puede eliminar su propia cuenta';
    }
    // REGLA 2: Nadie puede eliminar SUPER_SU
    if (isTargetSuperuser) {
        canDelete = false;
        deleteTooltip = 'No es posible eliminar cuentas con rol Superuser desde este panel';
    }
    // REGLA 3: ADMIN_CMS no puede ver/editar SUPER_SU
    if (isActorAdmin && isTargetSuperuser) {
        canView = false;
        canEdit = false;
        viewTooltip = 'No tiene permisos para ver usuarios Superuser';
        editTooltip = 'No tiene permisos para editar usuarios Superuser';
    }
    // REGLA 4: ADMIN_CMS no puede editar/eliminar otros ADMIN_CMS
    if (isActorAdmin && isTargetAdmin && !isSameAccount) {
        canEdit = false;
        canDelete = false;
        editTooltip = 'No tiene permisos para editar otros administradores';
        deleteTooltip = 'No tiene permisos para eliminar otros administradores';
    }
    // REGLA 5: VENDEDOR no puede editar ni eliminar
    if (isActorVendedor) {
        canEdit = false;
        canDelete = false;
        editTooltip = 'No tiene permisos para editar usuarios';
        deleteTooltip = 'No tiene permisos para eliminar usuarios';
    }
    return {
        canView,
        canEdit,
        canDelete,
        deleteTooltip,
        editTooltip,
        viewTooltip,
        isSameAccount,
        isTargetSuperuser,
    };
}
