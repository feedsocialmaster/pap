import { Metadata } from 'next';
import { FileText, ShoppingBag, CreditCard, Package, AlertCircle, Scale } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Términos y Condiciones - Paso a Paso Shoes',
  description: 'Términos y Condiciones de uso de Paso a Paso Shoes. Conocé las normas que rigen la compra de calzado femenino en nuestra tienda online.',
  keywords: [
    'términos y condiciones paso a paso shoes',
    'condiciones de compra calzado',
    'política de venta zapatos',
    'términos tienda online argentina',
  ],
  openGraph: {
    title: 'Términos y Condiciones - Paso a Paso Shoes',
    description: 'Conocé los términos y condiciones de compra en Paso a Paso Shoes.',
    type: 'website',
    locale: 'es_AR',
  },
  alternates: {
    canonical: '/terminos',
  },
};

export default function TerminosPage() {
  return (
    <main className="w-full">
      {/* Hero Section */}
      <header className="bg-primary py-16">
        <div className="container-custom text-center">
          <FileText className="mx-auto text-white mb-4" size={64} aria-hidden="true" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Términos y Condiciones
          </h1>
          <p className="text-white max-w-2xl mx-auto">
            Al realizar una compra en nuestra tienda estás aceptando los siguientes términos.
          </p>
          <p className="text-sm text-white mt-2">
            Última actualización: 1 de Febrero de 2026
          </p>
        </div>
      </header>

      {/* Contenido */}
      <article className="container-custom py-16">
        <div className="max-w-4xl mx-auto">

          {/* Introducción */}
          <section className="card p-8 mb-8 mt-8">
            <p className="text-gray leading-relaxed">
              Bienvenido/a a <strong>Paso a Paso Shoes</strong>. Al acceder y utilizar nuestro sitio web,
              así como al realizar compras, aceptás los presentes Términos y Condiciones. Te recomendamos
              leerlos detenidamente antes de efectuar cualquier compra.
            </p>
          </section>

          {/* 1. Uso del Sitio */}
          <section className="card p-8 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <Scale className="text-primary" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-dark mt-2">1. Uso del Sitio</h2>
            </div>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray">
              <li>El sitio está destinado a mayores de 18 años o menores con supervisión de un adulto.</li>
              <li>Queda prohibido utilizar el sitio con fines ilegales, fraudulentos o que perjudiquen a terceros.</li>
              <li>Nos reservamos el derecho de suspender cuentas que infrinjan estos términos sin previo aviso.</li>
              <li>El contenido del sitio (imágenes, textos, logos) es propiedad de Paso a Paso Shoes y no puede ser reproducido sin autorización.</li>
            </ul>
          </section>

          {/* 2. Proceso de Compra */}
          <section className="card p-8 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <ShoppingBag className="text-primary" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-dark mt-2">2. Proceso de Compra</h2>
            </div>
            <div className="space-y-3 text-gray">
              <p>Al confirmar un pedido, declarás que la información brindada (nombre, dirección, datos de contacto) es veraz y completa.</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>Disponibilidad:</strong> Los productos están sujetos a stock disponible. En caso de quiebre, te notificaremos a la brevedad.</li>
                <li><strong>Precios:</strong> Los precios publicados incluyen IVA y están expresados en pesos argentinos (ARS). Pueden modificarse sin previo aviso.</li>
                <li><strong>Confirmación:</strong> Recibirás un email de confirmación con el resumen de tu pedido una vez procesado el pago.</li>
                <li><strong>Cancelación:</strong> Podés cancelar tu pedido dentro de las 2 horas posteriores a la compra escribiéndonos por WhatsApp.</li>
              </ul>
            </div>
          </section>

          {/* 3. Pagos */}
          <section className="card p-8 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <CreditCard className="text-primary" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-dark mt-2">3. Medios de Pago</h2>
            </div>
            <div className="space-y-3 text-gray">
              <p>Aceptamos los siguientes medios de pago:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Tarjetas de crédito y débito (Visa, Mastercard, American Express) a través de MercadoPago.</li>
                <li>Transferencia bancaria / CVU.</li>
                <li>Efectivo (solo para retiro en sucursal).</li>
              </ul>
              <p className="mt-2">
                Los datos de tu tarjeta son procesados de forma segura por MercadoPago. 
                <strong> Paso a Paso Shoes no almacena información de medios de pago.</strong>
              </p>
            </div>
          </section>

          {/* 4. Envíos */}
          <section className="card p-8 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <Package className="text-primary" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-dark mt-2">4. Envíos y Entrega</h2>
            </div>
            <div className="space-y-3 text-gray">
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>Tiempo estimado:</strong> Entre 3 y 7 días hábiles dependiendo de la zona.</li>
                <li><strong>Costo de envío:</strong> Se calcula al momento del checkout según destino y peso.</li>
                <li><strong>Retiro en sucursal:</strong> Sin costo adicional. Disponible en nuestras sucursales de Mendoza.</li>
                <li><strong>Seguimiento:</strong> Te enviaremos el número de seguimiento una vez despachado tu pedido.</li>
                <li><strong>Daños en tránsito:</strong> En caso de recibir el paquete dañado, fotografialo antes de abrirlo y comunicate con nosotros de inmediato.</li>
              </ul>
            </div>
          </section>

          {/* 5. Limitación de Responsabilidad */}
          <section className="card p-8 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <AlertCircle className="text-primary" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-dark mt-2">5. Limitación de Responsabilidad</h2>
            </div>
            <div className="space-y-3 text-gray">
              <p>
                Paso a Paso Shoes no se hace responsable por interrupciones del servicio por causas ajenas a nuestra voluntad 
                (fallas de terceros, cortes de luz, problemas de conexión, etc.).
              </p>
              <p>
                Los colores de los productos pueden variar levemente respecto a las fotos publicadas debido a la calibración 
                de distintos monitores.
              </p>
            </div>
          </section>

          {/* 6. Modificaciones */}
          <section className="card p-8 mb-6">
            <h2 className="text-2xl font-bold text-dark mb-4">6. Modificaciones a los Términos</h2>
            <p className="text-gray leading-relaxed">
              Nos reservamos el derecho de modificar estos Términos y Condiciones en cualquier momento. 
              Los cambios serán publicados en esta página con la fecha de actualización correspondiente. 
              El uso continuado del sitio implica la aceptación de los términos vigentes.
            </p>
          </section>

          {/* Contacto */}
          <section className="bg-primary/5 border border-primary/20 rounded-xl p-8">
            <h2 className="text-xl font-bold text-dark mb-3">¿Tenés dudas?</h2>
            <p className="text-gray mb-4">
              Si tenés preguntas sobre nuestros términos, no dudes en contactarnos.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="mailto:info@pasoapasoshoes.com"
                className="btn-primary text-center"
              >
                Enviarnos un email
              </a>
              <a
                href="https://wa.me/5492612546976"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-center"
              >
                WhatsApp
              </a>
            </div>
          </section>

        </div>
      </article>
    </main>
  );
}
