/**
 * Adaptador genérico para tarjetas de crédito/débito
 * Este es un placeholder - en producción se debe integrar con un procesador real
 */
export class TarjetaAdapter {
    async testConnection(config) {
        // Validar que tenga las credenciales mínimas
        if (config.apiKey || config.publicKey) {
            return { success: true, message: 'Configuración de tarjeta válida' };
        }
        return { success: false, message: 'Faltan credenciales de API' };
    }
    async createPayment(config, data) {
        try {
            // En producción, aquí se integraría con el procesador real (ej: Stripe, Authorize.net)
            // Por ahora retornamos un placeholder
            return {
                success: true,
                checkoutUrl: `${process.env.APP_URL}/checkout/card-payment/${data.orderId}`,
                externalReference: data.orderNumber,
                metadata: {
                    message: 'Procesador de tarjeta - Requiere implementación específica',
                    amount: data.amount,
                    currency: data.currency,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                errorMessage: `Error en procesamiento de tarjeta: ${error.message}`,
            };
        }
    }
    async queryPayment(config, externalId) {
        // En producción, consultar estado real del procesador
        return {
            success: true,
            status: 'PENDING',
            metadata: {
                message: 'Consulta de estado requiere implementación del procesador',
            },
        };
    }
    async processWebhook(config, payload) {
        // Implementar según el procesador específico
        return { success: false };
    }
}
