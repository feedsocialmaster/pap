'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PromocionTicker from '@/components/PromocionTicker';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCMSRoute = pathname?.startsWith('/cms');

  if (isCMSRoute) {
    // Para rutas CMS, solo mostrar el contenido sin header/footer
    return <>{children}</>;
  }

  // Para rutas normales, mostrar header/footer
  return (
    <>
      <Header />
      <PromocionTicker />
      <main className="min-h-screen pt-32">
        {children}
      </main>
      <Footer />
    </>
  );
}
