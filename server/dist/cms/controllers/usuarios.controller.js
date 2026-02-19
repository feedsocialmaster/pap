import { prisma } from '../../prisma.js';
import bcrypt from 'bcryptjs';
// Obtener todos los usuarios (CMS y tienda web)
export const getUsuarios = async (req, res) => {
    try {
        const { pagina = '1', limite = '20', busqueda = '', rol, ordenarPor = 'fechaRegistro', orden = 'desc' } = req.query;
        const skip = (parseInt(pagina) - 1) * parseInt(limite);
        const take = parseInt(limite);
        // Si es ADMIN_CMS, no mostrar usuarios SUPER_SU
        const where = {};
        if (req.user?.role === 'ADMIN_CMS') {
            where.role = { not: 'SUPER_SU' };
        }
        if (busqueda) {
            where.OR = [
                { nombre: { contains: busqueda, mode: 'insensitive' } },
                { apellido: { contains: busqueda, mode: 'insensitive' } },
                { email: { contains: busqueda, mode: 'insensitive' } },
            ];
        }
        if (rol && rol !== 'TODOS') {
            where.role = rol;
        }
        // Construir ordenamiento
        const orderBy = {};
        orderBy[ordenarPor] = orden === 'asc' ? 'asc' : 'desc';
        const [usuarios, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    nombre: true,
                    apellido: true,
                    fechaNacimiento: true,
                    telefono: true,
                    whatsapp: true,
                    direccion: true,
                    role: true,
                    fechaRegistro: true,
                    activo: true,
                    suspendido: true,
                    motivoSuspension: true,
                    fechaSuspension: true,
                },
                skip,
                take,
                orderBy,
            }),
            prisma.user.count({ where }),
        ]);
        const totalPaginas = Math.ceil(total / take);
        res.json({
            usuarios,
            paginacion: {
                pagina: parseInt(pagina),
                limite: take,
                total,
                totalPaginas,
            },
        });
    }
    catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
};
// Obtener un usuario por ID
export const getUsuarioPorId = async (req, res) => {
    try {
        const { id } = req.params;
        // Si es ADMIN_CMS, no permitir ver usuarios SUPER_SU
        const where = { id };
        if (req.user?.role === 'ADMIN_CMS') {
            where.role = { not: 'SUPER_SU' };
        }
        const usuario = await prisma.user.findFirst({
            where,
            select: {
                id: true,
                email: true,
                nombre: true,
                apellido: true,
                fechaNacimiento: true,
                telefono: true,
                whatsapp: true,
                direccion: true,
                role: true,
                fechaRegistro: true,
                activo: true,
                suspendido: true,
                motivoSuspension: true,
                fechaSuspension: true,
            },
        });
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(usuario);
    }
    catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ error: 'Error al obtener usuario' });
    }
};
// Crear nuevo usuario
export const crearUsuario = async (req, res) => {
    try {
        const { email, password, nombre, apellido, dni, fechaNacimiento, telefono, direccion, role, } = req.body;
        // Validaciones
        if (!email || !password || !nombre || !apellido || !fechaNacimiento) {
            return res.status(400).json({
                error: 'Email, contraseña, nombre, apellido y fecha de nacimiento son obligatorios'
            });
        }
        // Si es ADMIN_CMS, no puede crear usuarios SUPER_SU
        if (req.user?.role === 'ADMIN_CMS' && role === 'SUPER_SU') {
            return res.status(403).json({
                error: 'No tienes permisos para crear usuarios Super SU'
            });
        }
        // Verificar si el email ya existe
        const existeEmail = await prisma.user.findUnique({ where: { email } });
        if (existeEmail) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }
        // Hashear contraseña
        const passwordHash = await bcrypt.hash(password, 10);
        // Crear usuario
        const usuario = await prisma.user.create({
            data: {
                email,
                passwordHash,
                nombre,
                apellido,
                fechaNacimiento: new Date(fechaNacimiento),
                telefono: telefono || null,
                direccion: direccion || {
                    calle: '',
                    numero: '',
                    ciudad: '',
                    provincia: '',
                    codigoPostal: '',
                },
                role: role || 'CLIENTA',
            },
            select: {
                id: true,
                email: true,
                nombre: true,
                apellido: true,
                fechaNacimiento: true,
                telefono: true,
                direccion: true,
                role: true,
                fechaRegistro: true,
            },
        });
        // Crear log de auditoría
        await prisma.cMSAuditLog.create({
            data: {
                usuarioId: req.user.id,
                accion: 'CREATE',
                entidad: 'User',
                entidadId: usuario.id,
                cambios: {
                    usuarioCreado: usuario.id,
                    email: usuario.email,
                    role: usuario.role,
                },
            },
        });
        res.status(201).json(usuario);
    }
    catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ error: 'Error al crear usuario' });
    }
};
// Actualizar usuario
export const actualizarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, password, nombre, apellido, fechaNacimiento, telefono, direccion, role, } = req.body;
        // Verificar que el usuario existe
        const usuarioExistente = await prisma.user.findUnique({ where: { id } });
        if (!usuarioExistente) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        // Si es ADMIN_CMS, no puede modificar usuarios SUPER_SU
        if (req.user?.role === 'ADMIN_CMS' && usuarioExistente.role === 'SUPER_SU') {
            return res.status(403).json({
                error: 'No tienes permisos para modificar usuarios Super SU'
            });
        }
        // Si es ADMIN_CMS, no puede cambiar el rol a SUPER_SU
        if (req.user?.role === 'ADMIN_CMS' && role === 'SUPER_SU') {
            return res.status(403).json({
                error: 'No tienes permisos para asignar el rol Super SU'
            });
        }
        // Si es ADMIN_CMS, no puede modificar otros ADMIN_CMS (solo puede modificar a sí mismo)
        if (req.user?.role === 'ADMIN_CMS' &&
            usuarioExistente.role === 'ADMIN_CMS' &&
            usuarioExistente.id !== req.user.id) {
            return res.status(403).json({
                error: 'No tienes permisos para modificar otros administradores'
            });
        }
        // Verificar si el email ya existe (si se está cambiando)
        if (email && email !== usuarioExistente.email) {
            const existeEmail = await prisma.user.findUnique({ where: { email } });
            if (existeEmail) {
                return res.status(400).json({ error: 'El email ya está registrado' });
            }
        }
        // Preparar datos para actualizar
        const dataToUpdate = {};
        if (email)
            dataToUpdate.email = email;
        if (nombre)
            dataToUpdate.nombre = nombre;
        if (apellido)
            dataToUpdate.apellido = apellido;
        if (fechaNacimiento)
            dataToUpdate.fechaNacimiento = new Date(fechaNacimiento);
        if (telefono !== undefined)
            dataToUpdate.telefono = telefono;
        if (direccion)
            dataToUpdate.direccion = direccion;
        if (role)
            dataToUpdate.role = role;
        // Si se proporciona nueva contraseña, hashearla
        if (password) {
            dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
        }
        // Actualizar usuario
        const usuarioActualizado = await prisma.user.update({
            where: { id },
            data: dataToUpdate,
            select: {
                id: true,
                email: true,
                nombre: true,
                apellido: true,
                fechaNacimiento: true,
                telefono: true,
                direccion: true,
                role: true,
                fechaRegistro: true,
            },
        });
        // Crear log de auditoría
        await prisma.cMSAuditLog.create({
            data: {
                usuarioId: req.user.id,
                accion: 'UPDATE',
                entidad: 'User',
                entidadId: id,
                cambios: dataToUpdate,
            },
        });
        res.json(usuarioActualizado);
    }
    catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
};
// Eliminar usuario
export const eliminarUsuario = async (req, res) => {
    const { id } = req.params;
    try {
        console.log(`\n========================================`);
        console.log(`🗑️ SOLICITUD DE ELIMINACIÓN DE USUARIO`);
        console.log(`========================================`);
        console.log(`Usuario solicitante: ${req.user?.email} (${req.user?.role})`);
        console.log(`Usuario a eliminar: ${id}`);
        console.log(`Fecha: ${new Date().toISOString()}`);
        console.log(`========================================\n`);
        // Verificar que el usuario existe
        const usuarioExistente = await prisma.user.findUnique({ where: { id } });
        if (!usuarioExistente) {
            console.log(`❌ Usuario no encontrado: ${id}`);
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        console.log(`✅ Usuario encontrado: ${usuarioExistente.email} (${usuarioExistente.role})`);
        // Nadie puede eliminar usuarios SUPER_SU
        if (usuarioExistente.role === 'SUPER_SU') {
            console.log(`🚫 Intento de eliminar usuario SUPER_SU bloqueado`);
            return res.status(403).json({
                error: 'No se puede eliminar usuarios Super SU'
            });
        }
        // Si es ADMIN_CMS, no puede eliminar otros ADMIN_CMS
        if (req.user?.role === 'ADMIN_CMS' && usuarioExistente.role === 'ADMIN_CMS') {
            return res.status(403).json({
                error: 'No tienes permisos para eliminar otros administradores'
            });
        }
        // Verificar si el usuario tiene pedidos
        console.log(`🔍 Verificando pedidos del usuario...`);
        const pedidosCount = await prisma.order.count({
            where: { usuarioId: id }
        });
        if (pedidosCount > 0) {
            console.log(`❌ Usuario tiene ${pedidosCount} pedidos asociados`);
            return res.status(400).json({
                error: `No se puede eliminar el usuario porque tiene ${pedidosCount} pedido(s) asociado(s). Considera suspenderlo en su lugar.`
            });
        }
        console.log(`✅ Usuario no tiene pedidos`);
        // Eliminar relaciones en el orden correcto (sin transacción para permitir cascadas)
        // 1. Eliminar usos de promociones del usuario (tabla sin relación explícita)
        console.log(`🗑️ Eliminando usos de promociones...`);
        const usosPromocionResult = await prisma.cMSUsoPromocion.deleteMany({
            where: { usuarioId: id }
        });
        console.log(`✅ Eliminados ${usosPromocionResult.count} usos de promociones`);
        // 2. Eliminar logs de auditoría relacionados con el usuario (TODOS)
        console.log(`🗑️ Eliminando logs de auditoría relacionados con el usuario...`);
        try {
            const auditResult = await prisma.cMSAuditLog.deleteMany({
                where: {
                    OR: [
                        { usuarioId: id },
                        { entidadId: id }
                    ]
                }
            });
            console.log(`✅ Eliminados ${auditResult.count} logs de auditoría`);
        }
        catch (auditError) {
            console.error(`❌ Error eliminando audit logs:`, auditError);
            throw auditError;
        }
        // 3. Eliminar el usuario
        console.log(`🗑️ Eliminando usuario...`);
        try {
            await prisma.user.delete({ where: { id } });
            console.log(`✅ Usuario eliminado exitosamente`);
        }
        catch (deleteError) {
            console.error(`❌ Error eliminando usuario:`, deleteError);
            console.error(`❌ Error code:`, deleteError.code);
            console.error(`❌ Error meta:`, deleteError.meta);
            throw deleteError;
        }
        // 4. Crear log de auditoría de la eliminación
        console.log(`📝 Creando log de auditoría de la eliminación...`);
        try {
            await prisma.cMSAuditLog.create({
                data: {
                    usuarioId: req.user.id,
                    accion: 'DELETE',
                    entidad: 'User',
                    entidadId: id,
                    cambios: {
                        email: usuarioExistente.email,
                        role: usuarioExistente.role,
                        nombre: usuarioExistente.nombre,
                        apellido: usuarioExistente.apellido,
                    },
                },
            });
        }
        catch (createAuditError) {
            console.error(`❌ Error creando audit log de eliminación:`, createAuditError);
            // No lanzar el error aquí porque el usuario ya fue eliminado
        }
        console.log(`🎉 Eliminación completada exitosamente`);
        res.json({ message: 'Usuario eliminado correctamente' });
    }
    catch (error) {
        console.error('❌ ERROR al eliminar usuario:', error);
        console.error('❌ Stack trace:', error.stack);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error meta:', error.meta);
        console.error('❌ Error message:', error.message);
        // Mensajes de error más específicos
        if (error.code === 'P2003') {
            const detallesError = {
                error: 'No se puede eliminar el usuario porque tiene datos relacionados en el sistema',
                codigo: error.code,
                detalles: error.meta,
                mensaje: error.message
            };
            console.error('❌ Error P2003 - Foreign key constraint:', detallesError);
            return res.status(400).json(detallesError);
        }
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        const errorResponse = {
            error: 'Error al eliminar usuario',
            mensaje: error.message,
            codigo: error.code,
            meta: error.meta
        };
        console.error('❌ Error response:', errorResponse);
        res.status(500).json(errorResponse);
    }
};
// Suspender/inhabilitar usuario
export const cambiarEstadoUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { accion, motivo } = req.body; // accion: 'suspender', 'activar', 'inhabilitar'
        if (!accion || !['suspender', 'activar', 'inhabilitar'].includes(accion)) {
            return res.status(400).json({ error: 'Acción inválida' });
        }
        // Verificar que el usuario existe
        const usuarioExistente = await prisma.user.findUnique({ where: { id } });
        if (!usuarioExistente) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        // Nadie puede suspender/inhabilitar usuarios SUPER_SU
        if (usuarioExistente.role === 'SUPER_SU') {
            return res.status(403).json({
                error: 'No se puede modificar el estado de usuarios Super SU'
            });
        }
        // Si es ADMIN_CMS, no puede modificar otros ADMIN_CMS
        if (req.user?.role === 'ADMIN_CMS' && usuarioExistente.role === 'ADMIN_CMS') {
            return res.status(403).json({
                error: 'No tienes permisos para modificar otros administradores'
            });
        }
        let updateData = {};
        switch (accion) {
            case 'suspender':
                if (!motivo) {
                    return res.status(400).json({ error: 'El motivo de suspensión es requerido' });
                }
                updateData = {
                    suspendido: true,
                    motivoSuspension: motivo,
                    fechaSuspension: new Date(),
                    activo: false
                };
                break;
            case 'activar':
                updateData = {
                    suspendido: false,
                    motivoSuspension: null,
                    fechaSuspension: null,
                    activo: true
                };
                break;
            case 'inhabilitar':
                if (!motivo) {
                    return res.status(400).json({ error: 'El motivo de inhabilitación es requerido' });
                }
                updateData = {
                    activo: false,
                    suspendido: false,
                    motivoSuspension: motivo,
                    fechaSuspension: new Date()
                };
                break;
        }
        // Actualizar usuario
        const usuarioActualizado = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
                activo: true,
                suspendido: true,
                motivoSuspension: true,
                fechaSuspension: true,
            },
        });
        // TODO: Crear log de auditoría (deshabilitado temporalmente por foreign key constraint)
        // await prisma.cMSAuditLog.create({
        //   data: {
        //     usuarioId: req.user!.id,
        //     accion: 'UPDATE',
        //     entidad: 'User',
        //     entidadId: id,
        //     cambios: {
        //       accion,
        //       motivo,
        //       estadoAnterior: {
        //         activo: usuarioExistente.activo,
        //         suspendido: usuarioExistente.suspendido
        //       },
        //       estadoNuevo: updateData
        //     },
        //   },
        // });
        console.log(`✅ [cambiarEstadoUsuario] Estado actualizado exitosamente para usuario ${id}`);
        res.json(usuarioActualizado);
    }
    catch (error) {
        console.error('Error al cambiar estado de usuario:', error);
        res.status(500).json({ error: 'Error al cambiar estado de usuario' });
    }
};
// Obtener historial de compras de un usuario
export const getHistorialCompras = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🔍 [getHistorialCompras] Iniciando para usuario ID: ${id}`);
        // Verificar que el usuario existe
        console.log('📝 [getHistorialCompras] Verificando usuario...');
        const usuario = await prisma.user.findUnique({ where: { id } });
        if (!usuario) {
            console.log(`❌ [getHistorialCompras] Usuario no encontrado: ${id}`);
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        console.log(`✅ [getHistorialCompras] Usuario encontrado: ${usuario.email}`);
        // Si es ADMIN_CMS, no puede ver historial de SUPER_SU
        if (req.user?.role === 'ADMIN_CMS' && usuario.role === 'SUPER_SU') {
            console.log(`🚫 [getHistorialCompras] Acceso denegado - ADMIN_CMS intentando ver SUPER_SU`);
            return res.status(403).json({
                error: 'No tienes permisos para ver el historial de usuarios Super SU'
            });
        }
        // Obtener órdenes del usuario
        console.log('📦 [getHistorialCompras] Obteniendo órdenes...');
        const ordenes = await prisma.order.findMany({
            where: { usuarioId: id },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                nombre: true,
                                slug: true,
                                precio: true,
                                imagenes: {
                                    select: {
                                        id: true,
                                        url: true,
                                        alt: true,
                                        orden: true
                                    },
                                    orderBy: {
                                        orden: 'asc'
                                    },
                                    take: 1
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { fecha: 'desc' }
        });
        console.log(`✅ [getHistorialCompras] Órdenes obtenidas: ${ordenes.length}`);
        // Calcular estadísticas
        console.log('📊 [getHistorialCompras] Calculando estadísticas...');
        const totalGastado = ordenes.reduce((sum, orden) => sum + orden.total, 0);
        const ordenPromedio = ordenes.length > 0 ? totalGastado / ordenes.length : 0;
        const respuesta = {
            ordenes,
            estadisticas: {
                totalOrdenes: ordenes.length,
                totalGastado,
                ordenPromedio
            }
        };
        console.log(`✅ [getHistorialCompras] Respuesta completada exitosamente para usuario ${id}`);
        res.json(respuesta);
    }
    catch (error) {
        console.error('❌ [getHistorialCompras] Error al obtener historial de compras:', error);
        if (error instanceof Error) {
            console.error('❌ [getHistorialCompras] Stack trace:', error.stack);
        }
        res.status(500).json({ error: 'Error al obtener historial de compras' });
    }
};
