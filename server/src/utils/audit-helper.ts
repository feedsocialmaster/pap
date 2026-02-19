/**
 * Helper para manejar registros de auditoría de forma segura
 * Evita que errores en auditoría bloqueen operaciones principales
 */

import { prisma } from '../prisma.js';

interface AuditLogData {
  usuarioId: string;
  accion: string;
  entidad: string;
  entidadId: string;
  cambios?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Crea un registro de auditoría de forma segura
 * Si el usuario no existe o hay un error, registra en consola pero NO falla
 * 
 * @param data - Datos del log de auditoría
 * @param context - Contexto para logging (ej: 'CREATE_PRODUCTO', 'DELETE_ORDEN')
 */
export async function createAuditLog(
  data: AuditLogData, 
  context: string = 'AUDIT'
): Promise<void> {
  if (!data.usuarioId) {
    console.warn(`⚠️ [${context}] No se proporcionó usuarioId para auditoría`);
    return;
  }

  try {
    // Verificar que el usuario existe antes de crear el log de auditoría
    const usuarioExiste = await prisma.user.findUnique({
      where: { id: data.usuarioId },
      select: { id: true }
    });

    if (!usuarioExiste) {
      console.warn(`⚠️ [${context}] Usuario ${data.usuarioId} no existe en BD, omitiendo auditoría`);
      return;
    }

    // Crear log de auditoría
    await prisma.cMSAuditLog.create({
      data: {
        usuarioId: data.usuarioId,
        accion: data.accion,
        entidad: data.entidad,
        entidadId: data.entidadId,
        cambios: data.cambios || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      }
    });

    console.log(`✅ [${context}] Auditoría registrada: ${data.accion} en ${data.entidad}/${data.entidadId}`);
  } catch (error) {
    // Si falla la auditoría, solo registrar el error pero NO lanzar excepción
    console.error(`⚠️ [${context}] Error al crear auditoría (no crítico):`, error);
  }
}

/**
 * Crea un registro de auditoría dentro de una transacción Prisma
 * Útil cuando necesitas auditar dentro de una transacción compleja
 * 
 * IMPORTANTE: En transacciones, si falla la auditoría, fallará toda la transacción
 * Solo usar dentro de transacciones cuando la auditoría es crítica
 * 
 * @param tx - Cliente de transacción Prisma
 * @param data - Datos del log de auditoría
 * @param context - Contexto para logging
 */
export async function createAuditLogInTransaction(
  tx: any,
  data: AuditLogData,
  context: string = 'AUDIT_TX'
): Promise<void> {
  if (!data.usuarioId) {
    console.warn(`⚠️ [${context}] No se proporcionó usuarioId para auditoría en transacción`);
    return;
  }

  try {
    // Verificar que el usuario existe
    const usuarioExiste = await tx.user.findUnique({
      where: { id: data.usuarioId },
      select: { id: true }
    });

    if (!usuarioExiste) {
      console.warn(`⚠️ [${context}] Usuario ${data.usuarioId} no existe, omitiendo auditoría`);
      return;
    }

    // Crear log de auditoría
    await tx.cMSAuditLog.create({
      data: {
        usuarioId: data.usuarioId,
        accion: data.accion,
        entidad: data.entidad,
        entidadId: data.entidadId,
        cambios: data.cambios || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      }
    });

    console.log(`✅ [${context}] Auditoría registrada en TX: ${data.accion} en ${data.entidad}/${data.entidadId}`);
  } catch (error) {
    console.error(`⚠️ [${context}] Error al crear auditoría en transacción:`, error);
    throw error; // En transacciones, propagar el error para rollback
  }
}

/**
 * Extrae IP y User-Agent de un Request de Express
 * 
 * @param req - Request de Express
 * @returns Objeto con ipAddress y userAgent
 */
export function extractRequestInfo(req: any): { ipAddress?: string; userAgent?: string } {
  return {
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('user-agent')
  };
}
