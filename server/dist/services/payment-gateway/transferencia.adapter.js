/**
 * Adaptador para pagos por transferencia bancaria
 * No requiere integración externa, solo genera instrucciones
 */
export class TransferenciaAdapter {
    async testConnection(config) {
        // Transferencia no requiere conexión externa
        if (config.cuentaBancaria && config.cbu && config.alias) {
            return { success: true, message: 'Configuración de transferencia válida' };
        }
        return { success: false, message: 'Faltan datos de cuenta bancaria' };
    }
    async createPayment(config, data) {
        try {
            // Generar instrucciones de transferencia
            const instructions = {
                banco: config.banco || 'Banco no especificado',
                titular: config.titular || 'Paso a Paso Shoes',
                cbu: config.cbu,
                alias: config.alias,
                cuit: config.cuit,
                monto: data.amount,
                moneda: data.currency,
                referencia: data.orderNumber,
            };
            return {
                success: true,
                externalReference: data.orderNumber,
                metadata: {
                    instructions,
                    message: 'Pago pendiente - Esperando confirmación de transferencia',
                },
            };
        }
        catch (error) {
            return {
                success: false,
                errorMessage: `Error generando instrucciones: ${error.message}`,
            };
        }
    }
    async queryPayment(config, externalId) {
        // Para transferencias, el estado debe actualizarse manualmente en el CMS
        return {
            success: true,
            status: 'PENDING',
            metadata: {
                message: 'El estado de transferencia debe verificarse manualmente',
            },
        };
    }
    async processWebhook(config, payload) {
        // Transferencia no tiene webhooks automáticos
        return { success: false };
    }
}
