-- Migración: Expandir Estados de Pedidos para Seguimiento Extendido
-- Fecha: 2026-02-07
-- Descripción: Agrega nuevos estados intermedios a CMSOrderStatus y campos de tracking

-- ============================================================================
-- PARTE 1: EXPANDIR ENUM CMSOrderStatus
-- ============================================================================

-- Agregar nuevos valores al enum CMSOrderStatus
-- Nota: En PostgreSQL no se pueden agregar en una sola sentencia con versiones < 12
-- Se agregan uno por uno para compatibilidad

DO $$ 
BEGIN
  -- Agregar PAYMENT_REJECTED si no existe
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PAYMENT_REJECTED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'CMSOrderStatus')) THEN
    ALTER TYPE "CMSOrderStatus" ADD VALUE 'PAYMENT_REJECTED';
  END IF;

  -- Agregar PAYMENT_APPROVED si no existe
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PAYMENT_APPROVED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'CMSOrderStatus')) THEN
    ALTER TYPE "CMSOrderStatus" ADD VALUE 'PAYMENT_APPROVED';
  END IF;

  -- Agregar PREPARING si no existe
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PREPARING' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'CMSOrderStatus')) THEN
    ALTER TYPE "CMSOrderStatus" ADD VALUE 'PREPARING';
  END IF;

  -- Agregar READY_FOR_SHIPPING si no existe
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'READY_FOR_SHIPPING' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'CMSOrderStatus')) THEN
    ALTER TYPE "CMSOrderStatus" ADD VALUE 'READY_FOR_SHIPPING';
  END IF;

  -- Agregar READY_FOR_PICKUP si no existe
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'READY_FOR_PICKUP' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'CMSOrderStatus')) THEN
    ALTER TYPE "CMSOrderStatus" ADD VALUE 'READY_FOR_PICKUP';
  END IF;

  -- Agregar IN_TRANSIT si no existe
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'IN_TRANSIT' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'CMSOrderStatus')) THEN
    ALTER TYPE "CMSOrderStatus" ADD VALUE 'IN_TRANSIT';
  END IF;

  -- Agregar CANCELLED si no existe
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'CANCELLED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'CMSOrderStatus')) THEN
    ALTER TYPE "CMSOrderStatus" ADD VALUE 'CANCELLED';
  END IF;
END $$;

-- ============================================================================
-- PARTE 2: AGREGAR CAMPOS DE TIMESTAMPS
-- ============================================================================

-- Agregar campos de timestamps para tracking detallado
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "payment_approved_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "preparing_started_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "ready_for_shipping_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "ready_for_pickup_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "shipped_at" TIMESTAMPTZ;

-- ============================================================================
-- PARTE 3: AGREGAR CAMPOS DE INFORMACIÓN DE COURIER
-- ============================================================================

-- Campos para información de courier/tracking
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "tracking_number" TEXT,
  ADD COLUMN IF NOT EXISTS "courier_name" TEXT;

-- ============================================================================
-- PARTE 4: AGREGAR CAMPO DE RAZÓN DE CANCELACIÓN
-- ============================================================================

-- Campo para motivo de cancelación
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "cancellation_reason" TEXT;

-- ============================================================================
-- PARTE 5: CREAR ÍNDICES ADICIONALES
-- ============================================================================

-- Índice compuesto para filtrar por estado y tipo de entrega
CREATE INDEX IF NOT EXISTS "Order_cmsStatus_fulfillmentType_idx" 
ON "Order"("cmsStatus", "fulfillment_type");

-- Índices para optimizar búsquedas por timestamps
CREATE INDEX IF NOT EXISTS "Order_paymentApprovedAt_idx" 
ON "Order"("payment_approved_at");

CREATE INDEX IF NOT EXISTS "Order_shippedAt_idx" 
ON "Order"("shipped_at");

CREATE INDEX IF NOT EXISTS "Order_deliveredAt_idx" 
ON "Order"("deliveredAt");

-- Índice para búsquedas por número de tracking
CREATE INDEX IF NOT EXISTS "Order_trackingNumber_idx" 
ON "Order"("tracking_number") 
WHERE "tracking_number" IS NOT NULL;

-- ============================================================================
-- PARTE 6: MIGRACIÓN DE DATOS EXISTENTES
-- ============================================================================

-- Migrar pedidos con estado 'ACCEPTED' a 'PAYMENT_APPROVED'
-- Esto se hace para mantener compatibilidad con el nuevo flujo
DO $$
DECLARE
  record_count INTEGER;
BEGIN
  -- Contar registros que serán migrados
  SELECT COUNT(*) INTO record_count
  FROM "Order"
  WHERE "cmsStatus" = 'ACCEPTED';
  
  IF record_count > 0 THEN
    RAISE NOTICE 'Migrando % pedidos de ACCEPTED a PAYMENT_APPROVED', record_count;
    
    -- Actualizar estado
    UPDATE "Order"
    SET 
      "cmsStatus" = 'PAYMENT_APPROVED',
      "payment_approved_at" = COALESCE("deliveredAt", "fecha"), -- Usar deliveredAt o fecha de creación
      "version" = "version" + 1
    WHERE "cmsStatus" = 'ACCEPTED';
    
    -- Crear registros de auditoría para esta migración
    INSERT INTO "OrderAudit" (
      "id",
      "orderId",
      "changedBy",
      "changedByEmail",
      "action",
      "previousStatus",
      "newStatus",
      "notes",
      "metadata",
      "createdAt" 
    )
    SELECT 
      gen_random_uuid()::TEXT,
      "id",
      'SYSTEM',
      'migration@pasoapaso.com',
      'STATUS_MIGRATION',
      'ACCEPTED',
      'PAYMENT_APPROVED',
      'Migración automática de estados: ACCEPTED → PAYMENT_APPROVED',
      jsonb_build_object(
        'migration_date', NOW(),
        'migration_script', '20260207_expand_order_statuses'
      ),
      NOW()
    FROM "Order"
    WHERE "cmsStatus" = 'PAYMENT_APPROVED'; -- Los que acabamos de actualizar
    
    RAISE NOTICE 'Migración completada.';
  ELSE
    RAISE NOTICE 'No hay pedidos con estado ACCEPTED para migrar.';
  END IF;
END $$;

-- ============================================================================
-- PARTE 7: COMENTARIOS EN COLUMNAS
-- ============================================================================

-- Agregar comentarios descriptivos a las nuevas columnas
COMMENT ON COLUMN "Order"."payment_approved_at" IS 'Timestamp cuando el pago fue aprobado por admin';
COMMENT ON COLUMN "Order"."preparing_started_at" IS 'Timestamp cuando comenzó la preparación del pedido';
COMMENT ON COLUMN "Order"."ready_for_shipping_at" IS 'Timestamp cuando el pedido estuvo listo para envío';
COMMENT ON COLUMN "Order"."ready_for_pickup_at" IS 'Timestamp cuando el pedido estuvo listo para retiro';
COMMENT ON COLUMN "Order"."shipped_at" IS 'Timestamp cuando el pedido fue despachado (IN_TRANSIT)';
COMMENT ON COLUMN "Order"."tracking_number" IS 'Código de seguimiento del courier';
COMMENT ON COLUMN "Order"."courier_name" IS 'Nombre del servicio de courier/mensajería';
COMMENT ON COLUMN "Order"."cancellation_reason" IS 'Motivo de cancelación del pedido';

-- ============================================================================
-- PARTE 8: VALIDACIONES Y VERIFICACIÓN
-- ============================================================================

-- Verificar que todos los nuevos valores del enum fueron agregados
DO $$
DECLARE
  missing_values TEXT[];
BEGIN
  SELECT array_agg(v) INTO missing_values
  FROM unnest(ARRAY[
    'PAYMENT_REJECTED',
    'PAYMENT_APPROVED',
    'PREPARING',
    'READY_FOR_SHIPPING',
    'READY_FOR_PICKUP',
    'IN_TRANSIT',
    'CANCELLED'
  ]) v
  WHERE NOT EXISTS (
    SELECT 1 
    FROM pg_enum 
    WHERE enumlabel = v 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'CMSOrderStatus')
  );
  
  IF array_length(missing_values, 1) > 0 THEN
    RAISE EXCEPTION 'Faltan valores en el enum CMSOrderStatus: %', array_to_string(missing_values, ', ');
  ELSE
    RAISE NOTICE '✅ Todos los nuevos valores del enum CMSOrderStatus fueron agregados correctamente';
  END IF;
END $$;

-- Verificar que todas las columnas fueron creadas
DO $$
DECLARE
  missing_columns TEXT[];
BEGIN
  SELECT array_agg(c) INTO missing_columns
  FROM unnest(ARRAY[
    'payment_approved_at',
    'preparing_started_at',
    'ready_for_shipping_at',
    'ready_for_pickup_at',
    'shipped_at',
    'tracking_number',
    'courier_name',
    'cancellation_reason'
  ]) c
  WHERE NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'Order' 
    AND column_name = c
  );
  
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION 'Faltan columnas en la tabla Order: %', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE '✅ Todas las nuevas columnas fueron creadas correctamente';
  END IF;
END $$;

-- Mostrar resumen de la migración
DO $$
DECLARE
  total_orders INTEGER;
  pending_orders INTEGER;
  approved_orders INTEGER;
  delivered_orders INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_orders FROM "Order";
  SELECT COUNT(*) INTO pending_orders FROM "Order" WHERE "cmsStatus" = 'PENDING';
  SELECT COUNT(*) INTO approved_orders FROM "Order" WHERE "cmsStatus" = 'PAYMENT_APPROVED';
  SELECT COUNT(*) INTO delivered_orders FROM "Order" WHERE "cmsStatus" = 'DELIVERED';
  
  RAISE NOTICE '
  ============================================
  RESUMEN DE MIGRACIÓN
  ============================================
  Total de pedidos:           %
  - PENDING:                  %
  - PAYMENT_APPROVED:         %
  - DELIVERED:                %
  ============================================
  ', total_orders, pending_orders, approved_orders, delivered_orders;
END $$;

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
