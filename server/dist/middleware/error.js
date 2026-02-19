// Estructura estándar de error para respuestas JSON
export function errorHandler(err, req, res, _next) {
    // Log detallado del error
    console.error('❌ Error handler activado:', {
        name: err?.name,
        message: err?.message,
        issues: err?.issues,
        status: err?.status,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });
    // Log del stack trace completo en desarrollo
    if (process.env.NODE_ENV !== 'production' && err?.stack) {
        console.error('Stack trace:', err.stack);
    }
    const status = typeof err?.status === 'number' ? err.status : 500;
    const code = typeof err?.code === 'string' ? err.code : undefined;
    let message;
    if (err?.name === 'ZodError') {
        // Para errores Zod, incluir el primer error detallado
        const firstIssue = err?.issues?.[0];
        message = firstIssue
            ? `${firstIssue.path.join('.')}: ${firstIssue.message}`
            : 'Datos inválidos';
    }
    else if (err?.code === 'ECONNREFUSED') {
        message = 'Error de conexión con la base de datos';
    }
    else if (err?.code === 'P2002') {
        // Error de Prisma: unique constraint
        message = 'El valor ya existe en la base de datos';
    }
    else if (err?.code === 'P2025') {
        // Error de Prisma: record not found
        message = 'Registro no encontrado';
    }
    else {
        message = typeof err?.message === 'string' ? err.message : 'Error interno del servidor';
    }
    // No filtrar internals en prod más allá del mensaje
    const payload = { success: false, error: message };
    if (code)
        payload.code = code;
    if (process.env.NODE_ENV !== 'production') {
        payload.details = err?.issues ?? err?.stack ?? undefined;
    }
    res.status(status).json(payload);
}
// Helper para crear errores HTTP con status y código opcional
export class HttpError extends Error {
    constructor(status, message, code) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
export default errorHandler;
