'use client';

import { TourProvider } from '@/components/cms/TourProvider';

export default function CMSRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TourProvider>
      {children}
    </TourProvider>
  );
}
