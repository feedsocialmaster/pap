import { GatewayProvider } from '@prisma/client';

/**
 * Configuración base de una pasarela de pago
 */
export interface GatewayConfig {
  clientId?: string;
  clientSecret?: string;
  apiKey?: string;
  publicKey?: string;
  webhookSecret?: string;
  [key: string]: any;
}

/**
 * Resultado de creación de pago
 */
export interface CreatePaymentResult {
  success: boolean;
  checkoutUrl?: string;
  externalId?: string;
  externalReference?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Resultado de consulta de pago
 */
export interface PaymentQueryResult {
  success: boolean;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  externalId?: string;
  amount?: number;
  metadata?: Record<string, any>;
  errorMessage?: string;
}

/**
 * Datos para crear un pago
 */
export interface CreatePaymentData {
  amount: number;
  currency: string;
  description: string;
  orderId: string;
  orderNumber: string;
  customerEmail?: string;
  customerName?: string;
  items?: Array<{
    id: string;
    title: string;
    quantity: number;
    unitPrice: number;
  }>;
  metadata?: Record<string, any>;
}

/**
 * Interfaz base para adaptadores de pasarelas de pago
 */
export interface PaymentGatewayAdapter {
  /**
   * Prueba la conexión con la pasarela
   */
  testConnection(config: GatewayConfig): Promise<{ success: boolean; message: string }>;

  /**
   * Crea una nueva preferencia/checkout de pago
   */
  createPayment(config: GatewayConfig, data: CreatePaymentData): Promise<CreatePaymentResult>;

  /**
   * Consulta el estado de un pago
   */
  queryPayment(config: GatewayConfig, externalId: string): Promise<PaymentQueryResult>;

  /**
   * Procesa webhook de notificación
   */
  processWebhook(config: GatewayConfig, payload: any): Promise<{
    success: boolean;
    externalId?: string;
    status?: string;
    metadata?: Record<string, any>;
  }>;
}

/**
 * Factory para crear adaptadores según el proveedor
 */
export class PaymentGatewayFactory {
  private static adapters: Map<GatewayProvider, PaymentGatewayAdapter> = new Map();

  static register(provider: GatewayProvider, adapter: PaymentGatewayAdapter): void {
    this.adapters.set(provider, adapter);
  }

  static getAdapter(provider: GatewayProvider): PaymentGatewayAdapter {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new Error(`No adapter registered for provider: ${provider}`);
    }
    return adapter;
  }

  static hasAdapter(provider: GatewayProvider): boolean {
    return this.adapters.has(provider);
  }
}
