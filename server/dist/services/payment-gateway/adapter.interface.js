/**
 * Factory para crear adaptadores según el proveedor
 */
export class PaymentGatewayFactory {
    static register(provider, adapter) {
        this.adapters.set(provider, adapter);
    }
    static getAdapter(provider) {
        const adapter = this.adapters.get(provider);
        if (!adapter) {
            throw new Error(`No adapter registered for provider: ${provider}`);
        }
        return adapter;
    }
    static hasAdapter(provider) {
        return this.adapters.has(provider);
    }
}
PaymentGatewayFactory.adapters = new Map();
