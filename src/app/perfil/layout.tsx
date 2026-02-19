import { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
  title: 'Mi Perfil - Paso a Paso Shoes',
};

export default function PerfilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
