# Migration: Order Fulfillment & User Activation Fixes

**Date**: 2026-02-06  
**Priority**: High  
**Rollback**: Available (see rollback.sql)

## Changes

### 1. Order Fulfillment Enhancements
- ✅ `fulfillment_type` - Distinguishes between shipping and pickup orders
- ✅ `pickup_location_id` - References pickup point when applicable
- ✅ `is_collected` - Tracks if pickup order was collected
- ✅ `collected_at` - Timestamp of collection
- ✅ `payment_method_detail` - Stores specific payment method used

### 2. User Email Verification
- ✅ `email_verified` - Tracks email verification status
- ✅ `verification_token` - Token for email confirmation
- ✅ `verification_token_expires` - Expiration for verification tokens

### 3. Infrastructure
- ✅ Added indexes for performance
- ✅ Created `PickupLocation` table for future expansion

## Deployment Steps

1. **Backup Database**
   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Run Migration**
   ```bash
   cd server
   npx prisma migrate deploy
   ```

3. **Verify Schema**
   ```bash
   npx prisma db pull
   npx prisma generate
   ```

4. **Test Queries**
   ```sql
   -- Verify new columns exist
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'Order' 
   AND column_name IN ('fulfillment_type', 'is_collected', 'payment_method_detail');
   ```

## Rollback Plan

If issues occur, run:
```bash
psql $DATABASE_URL < migrations/20260206_add_order_fulfillment_and_fixes/rollback.sql
```

## Impact Assessment

- **Breaking Changes**: None (all columns nullable or have defaults)
- **Data Migration**: Not required (new columns)
- **Application Changes**: Backend services need updates to populate new fields
- **CMS Changes**: UI updates to display fulfillment type and payment method

## Testing Checklist

- [ ] Create order with `fulfillment_type: 'shipping'`
- [ ] Create order with `fulfillment_type: 'pickup'`
- [ ] Mark pickup order as collected
- [ ] Verify payment method is stored correctly
- [ ] Test user email verification flow
- [ ] Verify all indexes are being used (EXPLAIN ANALYZE)

## Dependencies

- **Backend**: payment.service.ts, order-management.service.ts
- **Frontend**: checkout page, order confirmation
- **CMS**: Order detail view, user management panel
