'use client';

import { withCMSProtection } from '@/components/cms/withCMSProtection';
import { CMSLayout } from '@/components/cms/CMSLayout';
import PaymentPromotionsEditor from '@/components/cms/PaymentPromotionsEditor';

function ContenidoHomePage() {
  return (
    <CMSLayout>
      <PaymentPromotionsEditor
        contentKey="home_payment_promotions"
        title="Medios de Pago y Promociones"
        publicUrl="/"
      />
    </CMSLayout>
  );
}

export default withCMSProtection(ContenidoHomePage);
