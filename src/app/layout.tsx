import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ConditionalLayout } from "@/components/layout/ConditionalLayout";
import { AuthProvider } from "@/components/auth/AuthProvider";
import ToastContainer from "@/components/ui/Toast";
import SentryInit from '@/components/sentry/SentryInit';

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://pasoapasoshoes.com'),
  title: {
    default: 'Paso a Paso Shoes - Calzado Femenino | Zapatillas, Botas, Sandalias',
    template: '%s | Paso a Paso Shoes'
  },
  description: 'Tienda online de calzado femenino. Zapatillas, botas, sandalias y más. Envíos a todo el país.',
  keywords: ['calzado femenino', 'zapatos mujer', 'zapatillas', 'botas', 'sandalias', 'argentina', 'paso a paso', 'tienda online', 'calzado online'],
  authors: [{ name: 'Paso a Paso Shoes' }],
  creator: 'Paso a Paso Shoes',
  publisher: 'Paso a Paso Shoes',
  applicationName: 'Paso a Paso Shoes',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Paso a Paso Shoes',
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: 'https://pasoapasoshoes.com',
    siteName: 'Paso a Paso Shoes',
    title: 'Paso a Paso Shoes - Calzado Femenino de Calidad',
    description: 'Tienda online de calzado femenino con envíos a todo el país.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Paso a Paso Shoes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Paso a Paso Shoes - Calzado Femenino',
    description: 'Tienda online de calzado femenino con envíos a todo el país.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLdOrganization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Paso a Paso Shoes",
    "url": "https://pasoapasoshoes.com",
    "logo": "https://pasoapasoshoes.com/og-image.jpg",
    "description": "Tienda online de calzado femenino. Zapatillas, botas, sandalias y más. Envíos a todo el país.",
    "sameAs": [
      "https://www.instagram.com/shoes.pasoapaso/"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+5492612546976",
      "contactType": "customer service",
      "availableLanguage": "Spanish"
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Av. San Martín 1385",
      "addressLocality": "Ciudad de Mendoza",
      "addressRegion": "Mendoza",
      "postalCode": "5500",
      "addressCountry": "AR"
    }
  };

  return (
    <html lang="es">
      <body className={`${poppins.variable} font-poppins antialiased`}>
        {/* JSON-LD Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
        />
        <AuthProvider>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
          <SentryInit />
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  );
}
