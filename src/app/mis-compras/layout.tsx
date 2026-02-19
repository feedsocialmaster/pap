import { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
  title: 'Mis Compras - Paso a Paso Shoes',
};

export default function MisComprasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
