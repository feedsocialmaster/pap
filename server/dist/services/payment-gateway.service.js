import { prisma } from '../prisma.js';
import { getEncryptionService } from './encryption.service.js';
import { PaymentGatewayFactory } from './payment-gateway/index.js';
import { getWebSocketService } from './websocket.service.js';
/**
 * Servicio para gestión de pasarelas de pago
 */
export class PaymentGatewayService {
    constructor() {
        this.encryptionService = getEncryptionService();
    }
    emitWebSocketEvent(callback) {
        try {
            const wsService = getWebSocketService();
            callback();
        }
        catch (error) {
            // WebSocket no inicializado o error, no bloquear la operación
            console.warn('WebSocket event not emitted:', error);
        }
    }
    /**
     * Obtiene todas las pasarelas de pago
     */
    async getAllGateways(activeOnly = false) {
        const where = activeOnly ? { active: true } : {};
        const gateways = await prisma.paymentGateway.findMany({
            where,
            include: {
                rules: {
                    where: { active: true },
                    orderBy: { priority: 'desc' },
                },
                _count: {
                    select: {
                        payments: true,
                        logs: true,
                    },
                },
            },
            orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        });
        // Omitir configEncrypted en la respuesta
        return gateways.map(({ configEncrypted, ...gateway }) => gateway);
    }
    /**
     * Obtiene una pasarela por ID
     */
    async getGatewayById(id, includeConfig = false) {
        const gateway = await prisma.paymentGateway.findUnique({
            where: { id },
            include: {
                rules: {
                    where: { active: true },
                    orderBy: { priority: 'desc' },
                },
            },
        });
        if (!gateway) {
            throw new Error('Gateway not found');
        }
        if (!includeConfig) {
            const { configEncrypted, ...rest } = gateway;
            return rest;
        }
        // Desencriptar config si se solicita
        const config = this.encryptionService.decrypt(gateway.configEncrypted);
        return {
            ...gateway,
            config,
            configEncrypted: undefined,
        };
    }
    /**
     * Crea una nueva pasarela de pago
     */
    async createGateway(data) {
        // Encriptar configuración
        const configEncrypted = this.encryptionService.encrypt(data.config);
        const gateway = await prisma.paymentGateway.create({
            data: {
                name: data.name,
                provider: data.provider,
                mode: data.mode,
                configEncrypted,
                webhookUrl: data.webhookUrl,
                feesFixed: data.feesFixed || 0,
                feesPercent: data.feesPercent || 0,
                active: data.active ?? true,
                priority: data.priority || 0,
                createdBy: data.createdBy,
                rules: data.rules
                    ? {
                        create: data.rules,
                    }
                    : undefined,
            },
            include: {
                rules: true,
            },
        });
        // Log de auditoría
        await this.createLog({
            gatewayId: gateway.id,
            action: 'CREATE_GATEWAY',
            success: true,
            executedBy: data.createdBy,
        });
        // Emitir evento WebSocket
        this.emitWebSocketEvent(() => {
            const wsService = getWebSocketService();
            wsService.emitGatewayCreated(gateway);
        });
        const { configEncrypted: _, ...result } = gateway;
        return result;
    }
    /**
     * Actualiza una pasarela de pago
     */
    async updateGateway(id, data, updatedBy) {
        const updateData = { ...data };
        // Si se proporciona config, encriptarla
        if (data.config) {
            updateData.configEncrypted = this.encryptionService.encrypt(data.config);
            delete updateData.config;
        }
        const gateway = await prisma.paymentGateway.update({
            where: { id },
            data: updateData,
            include: {
                rules: true,
            },
        });
        // Log de auditoría
        await this.createLog({
            gatewayId: id,
            action: 'UPDATE_GATEWAY',
            request: data,
            success: true,
            executedBy: updatedBy,
        });
        // Emitir evento WebSocket
        this.emitWebSocketEvent(() => {
            const wsService = getWebSocketService();
            wsService.emitGatewayUpdated(id, data);
        });
        const { configEncrypted: _, ...result } = gateway;
        return result;
    }
    /**
     * Elimina una pasarela de pago
     */
    async deleteGateway(id, deletedBy) {
        // Log de auditoría
        await this.createLog({
            gatewayId: id,
            action: 'DELETE_GATEWAY',
            success: true,
            executedBy: deletedBy,
        });
        await prisma.paymentGateway.delete({
            where: { id },
        });
        // Emitir evento WebSocket
        this.emitWebSocketEvent(() => {
            const wsService = getWebSocketService();
            wsService.emitGatewayDeleted(id);
        });
    }
    /**
     * Prueba la conexión con una pasarela
     */
    async testConnection(id, executedBy) {
        const gateway = await this.getGatewayById(id, true);
        const adapter = PaymentGatewayFactory.getAdapter(gateway.provider);
        try {
            const result = await adapter.testConnection(gateway.config);
            await this.createLog({
                gatewayId: id,
                action: 'TEST_CONNECTION',
                response: result,
                success: result.success,
                errorMessage: result.success ? undefined : result.message,
                executedBy,
            });
            return result;
        }
        catch (error) {
            await this.createLog({
                gatewayId: id,
                action: 'TEST_CONNECTION',
                success: false,
                errorMessage: error.message,
                executedBy,
            });
            throw error;
        }
    }
    /**
     * Crea una regla de precio
     */
    async createRule(data) {
        return await prisma.gatewayRule.create({
            data,
        });
    }
    /**
     * Actualiza una regla de precio
     */
    async updateRule(id, data) {
        return await prisma.gatewayRule.update({
            where: { id },
            data,
        });
    }
    /**
     * Elimina una regla de precio
     */
    async deleteRule(id) {
        await prisma.gatewayRule.delete({
            where: { id },
        });
    }
    /**
     * Calcula el precio final aplicando reglas
     */
    async calculateFinalPrice(params) {
        const gateway = await prisma.paymentGateway.findUnique({
            where: { id: params.gatewayId },
            include: {
                rules: {
                    where: { active: true },
                    orderBy: { priority: 'desc' },
                },
            },
        });
        if (!gateway) {
            throw new Error('Gateway not found');
        }
        let currentPrice = params.basePrice;
        const appliedRules = [];
        // Aplicar reglas en orden de prioridad: PRODUCT > CATEGORY > GLOBAL
        const rulesToApply = gateway.rules.filter((rule) => {
            if (rule.scopeType === 'PRODUCT' && rule.scopeId === params.productId)
                return true;
            if (rule.scopeType === 'CATEGORY' && rule.scopeId === params.categoryId)
                return true;
            if (rule.scopeType === 'GLOBAL' && !rule.scopeId)
                return true;
            return false;
        });
        for (const rule of rulesToApply) {
            let ruleAmount = 0;
            if (rule.amount) {
                ruleAmount = rule.amount;
            }
            else if (rule.percent) {
                ruleAmount = Math.round((currentPrice * rule.percent) / 100);
            }
            if (rule.action === 'DISCOUNT') {
                currentPrice -= ruleAmount;
                appliedRules.push({
                    id: rule.id,
                    description: rule.description || `Descuento: ${rule.percent}%`,
                    action: rule.action,
                    amount: -ruleAmount,
                });
            }
            else if (rule.action === 'CHARGE') {
                currentPrice += ruleAmount;
                appliedRules.push({
                    id: rule.id,
                    description: rule.description || `Cargo: ${rule.percent}%`,
                    action: rule.action,
                    amount: ruleAmount,
                });
            }
        }
        // Aplicar fees de la pasarela
        const feesFixed = gateway.feesFixed;
        const feesPercentAmount = Math.round((currentPrice * gateway.feesPercent) / 100);
        const totalFees = feesFixed + feesPercentAmount;
        currentPrice += totalFees;
        // No permitir precios negativos
        currentPrice = Math.max(0, currentPrice);
        return {
            basePrice: params.basePrice,
            finalPrice: currentPrice,
            appliedRules,
            gatewayFees: {
                fixed: feesFixed,
                percent: gateway.feesPercent,
                total: totalFees,
            },
        };
    }
    /**
     * Crea un pago usando la pasarela
     */
    async createPayment(params) {
        const gateway = await this.getGatewayById(params.gatewayId, true);
        const adapter = PaymentGatewayFactory.getAdapter(gateway.provider);
        try {
            const paymentData = {
                amount: params.amount,
                currency: params.currency || 'ARS',
                description: params.description,
                orderId: params.orderId,
                orderNumber: params.orderNumber,
                customerEmail: params.customerEmail,
                customerName: params.customerName,
                items: params.items,
                metadata: params.metadata,
            };
            const result = await adapter.createPayment(gateway.config, paymentData);
            // Crear registro en DB
            const payment = await prisma.gatewayPayment.create({
                data: {
                    orderId: params.orderId,
                    gatewayId: params.gatewayId,
                    externalId: result.externalId,
                    externalReference: result.externalReference,
                    amount: params.amount,
                    currency: params.currency || 'ARS',
                    status: result.success ? 'PENDING' : 'FAILED',
                    metadata: result.metadata,
                    errorMessage: result.errorMessage,
                    checkoutUrl: result.checkoutUrl,
                },
            });
            // Log
            await this.createLog({
                gatewayId: params.gatewayId,
                action: 'CREATE_PAYMENT',
                request: paymentData,
                response: result,
                success: result.success,
                errorMessage: result.errorMessage,
            });
            return {
                ...payment,
                success: result.success,
            };
        }
        catch (error) {
            await this.createLog({
                gatewayId: params.gatewayId,
                action: 'CREATE_PAYMENT',
                request: params,
                success: false,
                errorMessage: error.message,
            });
            throw error;
        }
    }
    /**
     * Actualiza el estado de un pago
     */
    async updatePaymentStatus(paymentId, status, metadata) {
        const existingPayment = metadata
            ? await prisma.gatewayPayment.findUnique({ where: { id: paymentId } })
            : null;
        return await prisma.gatewayPayment.update({
            where: { id: paymentId },
            data: {
                status,
                metadata: metadata && existingPayment
                    ? {
                        ...(existingPayment.metadata || {}),
                        ...metadata,
                    }
                    : metadata,
            },
        });
    }
    /**
     * Obtiene logs de una pasarela
     */
    async getLogs(gatewayId, limit = 50) {
        return await prisma.gatewayLog.findMany({
            where: { gatewayId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    /**
     * Crea un log de auditoría
     */
    async createLog(data) {
        return await prisma.gatewayLog.create({
            data,
        });
    }
}
export const paymentGatewayService = new PaymentGatewayService();
