import { Metadata } from 'next';
import { Mail, Phone, MapPin, Instagram } from 'lucide-react';
import { mockSucursales } from '@/lib/mockData';
import ContactForm from '@/components/contact/ContactForm';

export const metadata: Metadata = {
  title: 'Contacto - Paso a Paso Shoes | Calzado Femenino Mendoza',
  description: 'Contactanos por WhatsApp, email o visitanos en nuestras sucursales en Mendoza. Estamos para ayudarte con tu compra de calzado femenino.',
  keywords: [
    'contacto paso a paso shoes',
    'zapatos mendoza contacto',
    'whatsapp calzado femenino',
    'tienda calzado mendoza',
  ],
  openGraph: {
    title: 'Contacto - Paso a Paso Shoes',
    description: 'Comunicate con nosotros por WhatsApp, email o visitanos en nuestras sucursales en Mendoza.',
    type: 'website',
    locale: 'es_AR',
  },
  alternates: {
    canonical: '/contacto',
  },
};

const mediosDeContacto = [
  {
    icon: Phone,
    title: 'WhatsApp',
    description: 'La forma más rápida de comunicarte con nosotros.',
    value: '+54 9 261 254-6976',
    href: 'https://wa.me/5492612546976',
    cta: 'Escribinos por WhatsApp',
  },
  {
    icon: Mail,
    title: 'Email',
    description: 'Para consultas que requieran mayor detalle.',
    value: 'info@pasoapasoshoes.com',
    href: 'mailto:info@pasoapasoshoes.com',
    cta: 'Envianos un email',
  },
  {
    icon: Instagram,
    title: 'Instagram',
    description: 'Seguinos y envianos un mensaje directo.',
    value: '@shoes.pasoapaso',
    href: 'https://www.instagram.com/shoes.pasoapaso/',
    cta: 'Ver Instagram',
  },
];

export default function ContactoPage() {
  return (
    <main className="w-full">
      {/* Hero Section */}
      <header className="bg-primary py-20">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Contacto
          </h1>
          <p className="text-white text-lg max-w-2xl mx-auto leading-relaxed">
            Estamos para ayudarte. Elegí el medio que más te convenga y te respondemos
            a la brevedad.
          </p>
        </div>
      </header>

      {/* Medios de contacto */}
      <section className="container-custom py-16">
        <h2 className="text-3xl font-bold text-dark text-center mb-12 mt-8">
          ¿Cómo podés contactarnos?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {mediosDeContacto.map((medio) => {
            const Icon = medio.icon;
            return (
              <div key={medio.title} className="card p-8 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon size={32} className="text-primary" />
                </div>
                <h3 className="text-xl font-bold text-dark">{medio.title}</h3>
                <p className="text-gray text-sm leading-relaxed">{medio.description}</p>
                <p className="text-dark font-medium">{medio.value}</p>
                <a
                  href={medio.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary mt-auto w-full text-center"
                >
                  {medio.cta}
                </a>
              </div>
            );
          })}
        </div>
      </section>

      {/* Sucursales */}
      <section className="bg-gray-light py-16 mt-16">
        <div className="container-custom">
          <div className="flex items-center justify-center gap-3 mb-8">
            <MapPin className="text-primary" size={32} />
            <h2 className="text-3xl font-bold text-dark">¿Dónde nos podés encontrar?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {mockSucursales.map((sucursal) => (
              <div key={sucursal.id} className="card p-6">
                <h3 className="text-xl font-bold text-dark mb-2">{sucursal.nombre}</h3>
                <p className="text-gray mb-2">
                  {sucursal.direccion.calle} {sucursal.direccion.numero}, {sucursal.direccion.ciudad}
                </p>
                <p className="text-sm text-gray mb-4">{sucursal.horarios}</p>
                <div className="w-full h-64 bg-gray-300 rounded-lg overflow-hidden">
                  <iframe
                    src={`https://maps.google.com/maps?q=${sucursal.coordenadas.lat},${sucursal.coordenadas.lng}&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    title={`Mapa de ubicación de ${sucursal.nombre}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formulario de contacto */}
      <section className="container-custom py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 mt-20">
              <Mail size={32} className="text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-dark mb-3">Envianos un mensaje</h2>
            <p className="text-gray leading-relaxed">
              Completá el formulario y te responderemos dentro de las próximas 24 hs hábiles.
              No necesitás tener una cuenta para escribirnos.
            </p>
          </div>
          <div className="card p-8 md:p-10">
            <ContactForm />
          </div>
        </div>
      </section>
    </main>
  );
}
