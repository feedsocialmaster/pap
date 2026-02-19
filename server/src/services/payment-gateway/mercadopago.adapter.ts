import axios from 'axios';
import {
  PaymentGatewayAdapter,
  GatewayConfig,
  CreatePaymentData,
  CreatePaymentResult,
  PaymentQueryResult,
} from './adapter.interface.js';

/**
 * Adaptador para MercadoPago
 */
export class MercadoPagoAdapter implements PaymentGatewayAdapter {
  private readonly sandboxUrl = 'https://api.mercadopago.com';
  private readonly productionUrl = 'https://api.mercadopago.com';

  private getBaseUrl(mode: 'SANDBOX' | 'PRODUCTION'): string {
    return mode === 'PRODUCTION' ? this.productionUrl : this.sandboxUrl;
  }

  async testConnection(config: GatewayConfig): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.get(`${this.sandboxUrl}/v1/payment_methods`, {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
        timeout: 10000,
      });

      if (response.status === 200) {
        return { success: true, message: 'Conexión exitosa con MercadoPago' };
      }
      return { success: false, message: 'Respuesta inesperada de MercadoPago' };
    } catch (error: any) {
      return {
        success: false,
        message: `Error de conexión: ${error.response?.data?.message || error.message}`,
      };
    }
  }

  async createPayment(config: GatewayConfig, data: CreatePaymentData): Promise<CreatePaymentResult> {
    try {
      const preference = {
        items: data.items || [
          {
            title: data.description,
            quantity: 1,
            unit_price: data.amount,
            currency_id: data.currency,
          },
        ],
        payer: {
          email: data.customerEmail,
          name: data.customerName,
        },
        back_urls: {
          success: `${process.env.APP_URL}/checkout/success`,
          failure: `${process.env.APP_URL}/checkout/failure`,
          pending: `${process.env.APP_URL}/checkout/pending`,
        },
        auto_return: 'approved',
        external_reference: data.orderNumber,
        notification_url: `${process.env.API_URL}/api/webhooks/mercadopago`,
        metadata: {
          ...data.metadata,
          order_id: data.orderId,
        },
      };

      const response = await axios.post(
        `${this.getBaseUrl('SANDBOX')}/checkout/preferences`,
        preference,
        {
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      return {
        success: true,
        checkoutUrl: response.data.init_point,
        externalId: response.data.id,
        externalReference: data.orderNumber,
        metadata: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        errorMessage: `Error creando pago en MercadoPago: ${
          error.response?.data?.message || error.message
        }`,
      };
    }
  }

  async queryPayment(config: GatewayConfig, externalId: string): Promise<PaymentQueryResult> {
    try {
      const response = await axios.get(`${this.sandboxUrl}/v1/payments/${externalId}`, {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
        timeout: 10000,
      });

      const statusMap: Record<string, PaymentQueryResult['status']> = {
        pending: 'PENDING',
        approved: 'SUCCESS',
        authorized: 'SUCCESS',
        in_process: 'PROCESSING',
        in_mediation: 'PROCESSING',
        rejected: 'FAILED',
        cancelled: 'CANCELLED',
        refunded: 'REFUNDED',
        charged_back: 'REFUNDED',
      };

      return {
        success: true,
        status: statusMap[response.data.status] || 'PENDING',
        externalId: response.data.id,
        amount: response.data.transaction_amount,
        metadata: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        status: 'FAILED',
        errorMessage: `Error consultando pago: ${error.response?.data?.message || error.message}`,
      };
    }
  }

  async processWebhook(
    config: GatewayConfig,
    payload: any
  ): Promise<{ success: boolean; externalId?: string; status?: string; metadata?: Record<string, any> }> {
    try {
      // MercadoPago envía notificaciones en formato específico
      if (payload.type === 'payment') {
        const paymentId = payload.data?.id;
        if (!paymentId) {
          return { success: false };
        }

        // Consultar el pago para obtener detalles actualizados
        const paymentData = await this.queryPayment(config, paymentId);

        return {
          success: true,
          externalId: paymentId,
          status: paymentData.status,
          metadata: paymentData.metadata,
        };
      }

      return { success: false };
    } catch (error) {
      return { success: false };
    }
  }
}
