import { prisma } from '../prisma.js';
import { GatewayProvider, GatewayMode, RuleScope, RuleAction, GatewayPaymentStatus } from '@prisma/client';
import { getEncryptionService } from './encryption.service.js';
import { PaymentGatewayFactory, CreatePaymentData } from './payment-gateway/index.js';
import { getWebSocketService } from './websocket.service.js';

/**
 * Servicio para gestión de pasarelas de pago
 */
export class PaymentGatewayService {
  private encryptionService = getEncryptionService();

  private emitWebSocketEvent(callback: () => void) {
    try {
      const wsService = getWebSocketService();
      callback();
    } catch (error) {
      // WebSocket no inicializado o error, no bloquear la operación
      console.warn('WebSocket event not emitted:', error);
    }
  }

  /**
   * Obtiene todas las pasarelas de pago
   */
  async getAllGateways(activeOnly: boolean = false) {
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
  async getGatewayById(id: string, includeConfig: boolean = false) {
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
  async createGateway(data: {
    name: string;
    provider: GatewayProvider;
    mode: GatewayMode;
    config: Record<string, any>;
    webhookUrl?: string;
    feesFixed?: number;
    feesPercent?: number;
    active?: boolean;
    priority?: number;
    createdBy: string;
    rules?: Array<{
      scopeType: RuleScope;
      scopeId?: string;
      action: RuleAction;
      amount?: number;
      percent?: number;
      priority?: number;
      description?: string;
    }>;
  }) {
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
  async updateGateway(
    id: string,
    data: {
      name?: string;
      mode?: GatewayMode;
      config?: Record<string, any>;
      webhookUrl?: string;
      feesFixed?: number;
      feesPercent?: number;
      active?: boolean;
      priority?: number;
    },
    updatedBy: string
  ) {
    const updateData: any = { ...data };

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
  async deleteGateway(id: string, deletedBy: string) {
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
  async testConnection(id: string, executedBy: string) {
    const gateway = await this.getGatewayById(id, true);
    const adapter = PaymentGatewayFactory.getAdapter(gateway.provider);

    try {
      const result = await adapter.testConnection((gateway as any).config);

      await this.createLog({
        gatewayId: id,
        action: 'TEST_CONNECTION',
        response: result,
        success: result.success,
        errorMessage: result.success ? undefined : result.message,
        executedBy,
      });

      return result;
    } catch (error: any) {
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
  async createRule(data: {
    gatewayId: string;
    scopeType: RuleScope;
    scopeId?: string;
    action: RuleAction;
    amount?: number;
    percent?: number;
    priority?: number;
    description?: string;
  }) {
    return await prisma.gatewayRule.create({
      data,
    });
  }

  /**
   * Actualiza una regla de precio
   */
  async updateRule(id: string, data: Partial<{
    scopeType: RuleScope;
    scopeId: string;
    action: RuleAction;
    amount: number;
    percent: number;
    priority: number;
    active: boolean;
    description: string;
  }>) {
    return await prisma.gatewayRule.update({
      where: { id },
      data,
    });
  }

  /**
   * Elimina una regla de precio
   */
  async deleteRule(id: string) {
    await prisma.gatewayRule.delete({
      where: { id },
    });
  }

  /**
   * Calcula el precio final aplicando reglas
   */
  async calculateFinalPrice(params: {
    basePrice: number;
    productId?: string;
    categoryId?: string;
    gatewayId: string;
  }): Promise<{
    basePrice: number;
    finalPrice: number;
    appliedRules: Array<{
      id: string;
      description: string;
      action: RuleAction;
      amount: number;
    }>;
    gatewayFees: {
      fixed: number;
      percent: number;
      total: number;
    };
  }> {
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
    const appliedRules: Array<{ id: string; description: string; action: RuleAction; amount: number }> = [];

    // Aplicar reglas en orden de prioridad: PRODUCT > CATEGORY > GLOBAL
    const rulesToApply = gateway.rules.filter((rule) => {
      if (rule.scopeType === 'PRODUCT' && rule.scopeId === params.productId) return true;
      if (rule.scopeType === 'CATEGORY' && rule.scopeId === params.categoryId) return true;
      if (rule.scopeType === 'GLOBAL' && !rule.scopeId) return true;
      return false;
    });

    for (const rule of rulesToApply) {
      let ruleAmount = 0;

      if (rule.amount) {
        ruleAmount = rule.amount;
      } else if (rule.percent) {
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
      } else if (rule.action === 'CHARGE') {
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
  async createPayment(params: {
    gatewayId: string;
    orderId: string;
    orderNumber: string;
    amount: number;
    currency?: string;
    description: string;
    customerEmail?: string;
    customerName?: string;
    items?: Array<{
      id: string;
      title: string;
      quantity: number;
      unitPrice: number;
    }>;
    metadata?: Record<string, any>;
  }) {
    const gateway = await this.getGatewayById(params.gatewayId, true);
    const adapter = PaymentGatewayFactory.getAdapter(gateway.provider);

    try {
      const paymentData: CreatePaymentData = {
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

      const result = await adapter.createPayment((gateway as any).config, paymentData);

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
    } catch (error: any) {
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
  async updatePaymentStatus(
    paymentId: string,
    status: GatewayPaymentStatus,
    metadata?: Record<string, any>
  ) {
    const existingPayment = metadata 
      ? await prisma.gatewayPayment.findUnique({ where: { id: paymentId } })
      : null;

    return await prisma.gatewayPayment.update({
      where: { id: paymentId },
      data: {
        status,
        metadata: metadata && existingPayment
          ? {
              ...(existingPayment.metadata as object || {}),
              ...metadata,
            }
          : metadata,
      },
    });
  }

  /**
   * Obtiene logs de una pasarela
   */
  async getLogs(gatewayId: string, limit: number = 50) {
    return await prisma.gatewayLog.findMany({
      where: { gatewayId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Crea un log de auditoría
   */
  private async createLog(data: {
    gatewayId: string;
    action: string;
    request?: any;
    response?: any;
    statusCode?: number;
    success: boolean;
    errorMessage?: string;
    executedBy?: string;
  }) {
    return await prisma.gatewayLog.create({
      data,
    });
  }
}

export const paymentGatewayService = new PaymentGatewayService();
