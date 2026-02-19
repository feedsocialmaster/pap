import { Metadata } from 'next';
import { HelpCircle, ChevronDown } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Preguntas Frecuentes - Paso a Paso Shoes',
  description: 'Encontrá respuestas a las preguntas más frecuentes sobre compras, envíos, talles y devoluciones en Paso a Paso Shoes.',
  keywords: [
    'preguntas frecuentes paso a paso shoes',
    'FAQ calzado femenino',
    'dudas compra zapatos online',
    'ayuda tienda calzado',
  ],
  openGraph: {
    title: 'Preguntas Frecuentes - Paso a Paso Shoes',
    description: 'Respondemos tus dudas sobre envíos, talles, pagos y devoluciones.',
    type: 'website',
    locale: 'es_AR',
  },
  alternates: {
    canonical: '/preguntas-frecuentes',
  },
};

const faqs = [
  {
    categoria: 'Compras y Pagos',
    items: [
      {
        pregunta: '¿Cómo realizo una compra?',
        respuesta:
          'Seleccioná el producto que te gusta, elegí el talle, agregalo al carrito y seguí los pasos del checkout. Podés pagar con tarjeta de crédito/débito (vía MercadoPago), transferencia bancaria o efectivo al retirar en sucursal.',
      },
      {
        pregunta: '¿Mis datos de pago están seguros?',
        respuesta:
          'Sí. Los pagos con tarjeta son procesados de forma segura por MercadoPago. Paso a Paso Shoes no almacena ningún dato de tarjeta. La plataforma cumple con los más altos estándares de seguridad (PCI DSS).',
      },
      {
        pregunta: '¿Puedo comprar sin registrarme?',
        respuesta:
          'Para completar una compra necesitás crear una cuenta. El registro es gratuito y te permite hacer seguimiento de tus pedidos y gestionar devoluciones con mayor facilidad.',
      },
      {
        pregunta: '¿Puedo cancelar mi pedido?',
        respuesta:
          'Podés cancelar tu pedido dentro de las 2 horas posteriores a la compra contactándonos por WhatsApp. Una vez que el pedido fue preparado para envío, ya no es posible cancelarlo.',
      },
    ],
  },
  {
    categoria: 'Envíos y Entregas',
    items: [
      {
        pregunta: '¿Cuánto tarda el envío?',
        respuesta:
          'Los envíos a domicilio demoran entre 3 y 7 días hábiles según la localidad. El retiro en sucursal está disponible desde el día siguiente a la confirmación del pedido.',
      },
      {
        pregunta: '¿Puedo retirar en sucursal?',
        respuesta:
          'Sí. Tenemos sucursales en Mendoza. Al momento del checkout seleccioná la opción "Retiro en sucursal" y elegí la tienda más conveniente para vos. El retiro es sin costo.',
      },
      {
        pregunta: '¿Cómo hago el seguimiento de mi pedido?',
        respuesta:
          'Una vez despachado tu pedido, te enviaremos un email con el número de seguimiento para que puedas rastrear tu envío en tiempo real.',
      },
      {
        pregunta: '¿Envían a todo el país?',
        respuesta:
          'Sí, realizamos envíos a todo Argentina. El costo de envío se calcula automáticamente al ingresar tu dirección en el checkout.',
      },
    ],
  },
  {
    categoria: 'Talles y Productos',
    items: [
      {
        pregunta: '¿Cómo sé qué talle elegir?',
        respuesta:
          'En cada producto encontrarás una guía de talles con medidas en centímetros. Si tenés dudas, escribinos por WhatsApp y te asesoramos según el modelo.',
      },
      {
        pregunta: '¿Los colores de los productos son exactos?',
        respuesta:
          'Hacemos lo posible para que las fotos representen fielmente los productos. Sin embargo, los colores pueden variar levemente según la calibración de tu pantalla.',
      },
      {
        pregunta: '¿El producto que quiero está disponible en mi talle?',
        respuesta:
          'Los talles disponibles se muestran en la página de cada producto. Si el talle que buscás aparece como agotado, podés suscribirte para recibir una notificación cuando vuelva a estar disponible.',
      },
    ],
  },
  {
    categoria: 'Cuenta y Beneficios',
    items: [
      {
        pregunta: '¿Cómo recupero mi contraseña?',
        respuesta:
          'En la pantalla de inicio de sesión, hacé clic en "¿Olvidaste tu contraseña?" e ingresá tu email. Te enviaremos un link para restablecerla.',
      },
      {
        pregunta: '¿Cómo puedo usar un código de descuento?',
        respuesta:
          'En el paso de pago del checkout encontrarás un campo para ingresar tu código promocional. El descuento se aplica automáticamente antes de confirmar la compra.',
      },
    ],
  },
];

export default function PreguntasFrecuentesPage() {
  return (
    <main className="w-full">
      {/* Hero Section */}
      <header className="bg-primary py-16">
        <div className="container-custom text-center">
          <HelpCircle className="mx-auto text-white mb-4" size={64} aria-hidden="true" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Preguntas Frecuentes
          </h1>
          <p className="text-white max-w-2xl mx-auto">
            Encontrá rápidamente las respuestas a tus dudas sobre nuestra tienda.
          </p>
        </div>
      </header>

      {/* Contenido */}
      <article className="container-custom py-16 mt-12">
        <div className="max-w-4xl mx-auto">

          {faqs.map((categoria, index) => (
            <section key={categoria.categoria} className={`mb-12 ${index === 0 ? 'mt-16' : ''}`}>
              <h2 className="text-2xl font-bold text-dark mb-6 flex items-center gap-3">
                <span className="w-8 h-1 bg-primary rounded-full inline-block" aria-hidden="true"></span>
                {categoria.categoria}
              </h2>
              <div className="space-y-4">
                {categoria.items.map((faq) => (
                  <details key={faq.pregunta} className="card p-6 group">
                    <summary className="flex items-center justify-between cursor-pointer list-none">
                      <span className="font-semibold text-dark pr-4">{faq.pregunta}</span>
                      <ChevronDown
                        size={20}
                        className="text-primary flex-shrink-0 transition-transform group-open:rotate-180"
                        aria-hidden="true"
                      />
                    </summary>
                    <p className="mt-4 text-gray leading-relaxed">{faq.respuesta}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}

          {/* ¿No encontraste tu respuesta? */}
          <section className="bg-primary/5 border border-primary/20 rounded-xl p-8 mt-8">
            <h2 className="text-xl font-bold text-dark mb-3">¿No encontraste lo que buscabas?</h2>
            <p className="text-gray mb-4">
              Nuestro equipo está disponible para ayudarte con cualquier consulta.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://wa.me/5492612546976"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-center"
              >
                Escribinos por WhatsApp
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
