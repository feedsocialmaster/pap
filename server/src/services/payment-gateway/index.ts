import { GatewayProvider } from '@prisma/client';
import { PaymentGatewayFactory } from './adapter.interface.js';
import { MercadoPagoAdapter } from './mercadopago.adapter.js';
import { TransferenciaAdapter } from './transferencia.adapter.js';
import { TarjetaAdapter } from './tarjeta.adapter.js';

/**
 * Inicializa y registra todos los adaptadores de pasarelas de pago
 */
export function initializePaymentAdapters(): void {
  // Registrar MercadoPago
  PaymentGatewayFactory.register(GatewayProvider.MERCADOPAGO, new MercadoPagoAdapter());

  // Registrar Transferencia
  PaymentGatewayFactory.register(GatewayProvider.TRANSFERENCIA, new TransferenciaAdapter());

  // Registrar Tarjetas (crédito y débito usan el mismo adaptador por ahora)
  const tarjetaAdapter = new TarjetaAdapter();
  PaymentGatewayFactory.register(GatewayProvider.TARJETA_CREDITO, tarjetaAdapter);
  PaymentGatewayFactory.register(GatewayProvider.TARJETA_DEBITO, tarjetaAdapter);

  // Los demás proveedores (PAYPAL, STRIPE, OTRO) pueden agregarse aquí
  // PaymentGatewayFactory.register(GatewayProvider.PAYPAL, new PayPalAdapter());
  // PaymentGatewayFactory.register(GatewayProvider.STRIPE, new StripeAdapter());
}

export { PaymentGatewayFactory };
export * from './adapter.interface.js';
