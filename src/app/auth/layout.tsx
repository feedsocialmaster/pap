import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Autenticación - Paso a Paso Shoes',
  description: 'Inicia sesión o regístrate en Paso a Paso Shoes',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
