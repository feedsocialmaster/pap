import {
  PaymentGatewayAdapter,
  GatewayConfig,
  CreatePaymentData,
  CreatePaymentResult,
  PaymentQueryResult,
} from './adapter.interface.js';

/**
 * Adaptador para pagos por transferencia bancaria
 * No requiere integración externa, solo genera instrucciones
 */
export class TransferenciaAdapter implements PaymentGatewayAdapter {
  async testConnection(config: GatewayConfig): Promise<{ success: boolean; message: string }> {
    // Transferencia no requiere conexión externa
    if (config.cuentaBancaria && config.cbu && config.alias) {
      return { success: true, message: 'Configuración de transferencia válida' };
    }
    return { success: false, message: 'Faltan datos de cuenta bancaria' };
  }

  async createPayment(config: GatewayConfig, data: CreatePaymentData): Promise<CreatePaymentResult> {
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
    } catch (error: any) {
      return {
        success: false,
        errorMessage: `Error generando instrucciones: ${error.message}`,
      };
    }
  }

  async queryPayment(config: GatewayConfig, externalId: string): Promise<PaymentQueryResult> {
    // Para transferencias, el estado debe actualizarse manualmente en el CMS
    return {
      success: true,
      status: 'PENDING',
      metadata: {
        message: 'El estado de transferencia debe verificarse manualmente',
      },
    };
  }

  async processWebhook(
    config: GatewayConfig,
    payload: any
  ): Promise<{ success: boolean; externalId?: string; status?: string }> {
    // Transferencia no tiene webhooks automáticos
    return { success: false };
  }
}
