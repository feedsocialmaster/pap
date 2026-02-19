import { Metadata } from 'next';
import { RefreshCw, CheckCircle, XCircle, Clock, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cambios y Devoluciones - Paso a Paso Shoes',
  description: 'Política de cambios y devoluciones de Paso a Paso Shoes. Conocé nuestros plazos, condiciones y cómo gestionar tu cambio o devolución fácilmente.',
  keywords: [
    'cambios y devoluciones paso a paso shoes',
    'política devolución calzado',
    'cambio de talle zapatos',
    'garantía compra online calzado argentina',
  ],
  openGraph: {
    title: 'Cambios y Devoluciones - Paso a Paso Shoes',
    description: 'Comodidad total: conocé cómo gestionar cambios y devoluciones en Paso a Paso Shoes.',
    type: 'website',
    locale: 'es_AR',
  },
  alternates: {
    canonical: '/cambios-devoluciones',
  },
};

export default function CambiosDevolucionesPage() {
  return (
    <main className="w-full">
      {/* Hero Section */}
      <header className="bg-primary py-16">
        <div className="container-custom text-center">
          <RefreshCw className="mx-auto text-white mb-4" size={64} aria-hidden="true" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Cambios y Devoluciones
          </h1>
          <p className="text-white max-w-2xl mx-auto">
            Tu satisfacción es nuestra prioridad. Hacemos los cambios simples y sin complicaciones.
          </p>
        </div>
      </header>

      {/* Contenido */}
      <article className="container-custom py-16">
        <div className="max-w-4xl mx-auto">

          {/* Resumen rápido */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 mt-8">
            <div className="card p-6 text-center">
              <Clock className="mx-auto text-primary mb-3" size={36} aria-hidden="true" />
              <h3 className="font-bold text-dark mb-1">30 días</h3>
              <p className="text-sm text-gray">Plazo para solicitar cambio o devolución</p>
            </div>
            <div className="card p-6 text-center">
              <CheckCircle className="mx-auto text-success mb-3" size={36} aria-hidden="true" />
              <h3 className="font-bold text-dark mb-1">Sin costo</h3>
              <p className="text-sm text-gray">Cambio de talle en primer cambio</p>
            </div>
            <div className="card p-6 text-center">
              <MessageCircle className="mx-auto text-primary mb-3" size={36} aria-hidden="true" />
              <h3 className="font-bold text-dark mb-1">Fácil gestión</h3>
              <p className="text-sm text-gray">Iniciá el proceso por WhatsApp o email</p>
            </div>
          </section>

          {/* ¿Cuándo aplica? */}
          <section className="card p-8 mb-6">
            <h2 className="text-2xl font-bold text-dark mb-6">¿Cuándo podés realizar un cambio o devolución?</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-dark mb-3 flex items-center gap-2">
                  <CheckCircle size={20} className="text-success" aria-hidden="true" />
                  Motivos aceptados
                </h3>
                <ul className="space-y-2 text-gray text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-1">✓</span>
                    Talle incorrecto (el producto no te queda)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-1">✓</span>
                    Producto con defecto de fabricación
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-1">✓</span>
                    Producto distinto al que compraste
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-1">✓</span>
                    Producto dañado durante el envío
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-dark mb-3 flex items-center gap-2">
                  <XCircle size={20} className="text-error" aria-hidden="true" />
                  No aplica cambio ni devolución
                </h3>
                <ul className="space-y-2 text-gray text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-error mt-1">✗</span>
                    Productos con uso evidente (sucios, rayados, deformados)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-error mt-1">✗</span>
                    Sin la caja o etiquetas originales
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-error mt-1">✗</span>
                    Pasados los 30 días desde la recepción
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-error mt-1">✗</span>
                    Productos en liquidación o con descuento especial (salvo defecto)
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Pasos para solicitar */}
          <section className="card p-8 mb-6">
            <h2 className="text-2xl font-bold text-dark mb-6">¿Cómo solicitar un cambio o devolución?</h2>
            <ol className="space-y-6">
              <li className="flex gap-4">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold" aria-hidden="true">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-dark">Contactanos</h3>
                  <p className="text-gray text-sm mt-1">
                    Escribinos por WhatsApp al{' '}
                    <a href="https://wa.me/5492612546976" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      +54 9 261 254-6976
                    </a>{' '}
                    o por email a{' '}
                    <a href="mailto:info@pasoapasoshoes.com" className="text-primary underline">
                      info@pasoapasoshoes.com
                    </a>{' '}
                    indicando tu número de pedido y el motivo del cambio/devolución.
                  </p>
                </div>
              </li>

              <li className="flex gap-4">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold" aria-hidden="true">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-dark">Enviá o acercate con el producto</h3>
                  <p className="text-gray text-sm mt-1">
                    Una vez aprobado el cambio, te indicaremos si podés presentarlo en sucursal o si debés enviarlo. 
                    El producto debe estar en perfectas condiciones, con su caja original y etiquetas.
                  </p>
                </div>
              </li>

              <li className="flex gap-4">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold" aria-hidden="true">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-dark">Recibí tu cambio o reintegro</h3>
                  <p className="text-gray text-sm mt-1">
                    Una vez verificado el estado del producto, procesamos el cambio por el nuevo talle o modelo, 
                    o bien el reintegro del dinero (según corresponda) dentro de los 5 a 10 días hábiles.
                  </p>
                </div>
              </li>
            </ol>
          </section>

          {/* Costos de envío */}
          <section className="card p-8 mb-6">
            <h2 className="text-2xl font-bold text-dark mb-4">Costos del proceso</h2>
            <div className="space-y-3 text-gray">
              <p>
                <strong className="text-dark">Defecto de fabricación o error nuestro:</strong>{' '}
                Paso a Paso Shoes cubre el costo del envío de vuelta.
              </p>
              <p>
                <strong className="text-dark">Cambio de talle (primera vez):</strong>{' '}
                Sin costo si retirás en sucursal. Si optás por envío, el costo de reenvío corre por tu cuenta.
              </p>
              <p>
                <strong className="text-dark">Cambios posteriores al primero:</strong>{' '}
                El costo de envío en ambas direcciones corre por cuenta del cliente.
              </p>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-primary/5 border border-primary/20 rounded-xl p-8">
            <h2 className="text-xl font-bold text-dark mb-3">¿Necesitás hacer un cambio?</h2>
            <p className="text-gray mb-4">
              Contactanos y te guiamos por el proceso paso a paso.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://wa.me/5492612546976"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-center"
              >
                Iniciar por WhatsApp
              </a>
              <a
                href="mailto:info@pasoapasoshoes.com"
                className="btn-secondary text-center"
              >
                Enviar email
              </a>
            </div>
          </section>

        </div>
      </article>
    </main>
  );
}
