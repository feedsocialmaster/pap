import {
  PaymentGatewayAdapter,
  GatewayConfig,
  CreatePaymentData,
  CreatePaymentResult,
  PaymentQueryResult,
} from './adapter.interface.js';

/**
 * Adaptador genérico para tarjetas de crédito/débito
 * Este es un placeholder - en producción se debe integrar con un procesador real
 */
export class TarjetaAdapter implements PaymentGatewayAdapter {
  async testConnection(config: GatewayConfig): Promise<{ success: boolean; message: string }> {
    // Validar que tenga las credenciales mínimas
    if (config.apiKey || config.publicKey) {
      return { success: true, message: 'Configuración de tarjeta válida' };
    }
    return { success: false, message: 'Faltan credenciales de API' };
  }

  async createPayment(config: GatewayConfig, data: CreatePaymentData): Promise<CreatePaymentResult> {
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
    } catch (error: any) {
      return {
        success: false,
        errorMessage: `Error en procesamiento de tarjeta: ${error.message}`,
      };
    }
  }

  async queryPayment(config: GatewayConfig, externalId: string): Promise<PaymentQueryResult> {
    // En producción, consultar estado real del procesador
    return {
      success: true,
      status: 'PENDING',
      metadata: {
        message: 'Consulta de estado requiere implementación del procesador',
      },
    };
  }

  async processWebhook(
    config: GatewayConfig,
    payload: any
  ): Promise<{ success: boolean; externalId?: string; status?: string }> {
    // Implementar según el procesador específico
    return { success: false };
  }
}
