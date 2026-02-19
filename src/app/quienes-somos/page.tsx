import { Metadata } from 'next';
import { Heart, Star, Users, Award, Instagram } from 'lucide-react';

export const metadata: Metadata = {
  title: '¿Quiénes Somos? - Paso a Paso Shoes | Calzado Femenino Mendoza',
  description: 'Conocé la historia de Paso a Paso Shoes, nuestra misión y los valores que nos guían. Calzado femenino de calidad en Mendoza, Argentina.',
  keywords: [
    'quiénes somos paso a paso shoes',
    'historia tienda calzado mendoza',
    'nuestra marca zapatos femeninos',
    'sobre nosotros paso a paso',
  ],
  openGraph: {
    title: '¿Quiénes Somos? - Paso a Paso Shoes',
    description: 'Conocé nuestra historia, misión y valores. Calzado femenino de calidad en Mendoza.',
    type: 'website',
    locale: 'es_AR',
  },
  alternates: {
    canonical: '/quienes-somos',
  },
};

const valores = [
  {
    icon: Heart,
    title: 'Pasión',
    description: 'Amamos lo que hacemos. Cada par de zapatos es elegido con cuidado pensando en vos.',
  },
  {
    icon: Star,
    title: 'Calidad',
    description: 'Trabajamos con proveedores seleccionados para garantizar calzado duradero y confortable.',
  },
  {
    icon: Users,
    title: 'Comunidad',
    description: 'Somos parte de Mendoza. Nuestras clientas son nuestra comunidad y nuestra motivación.',
  },
  {
    icon: Award,
    title: 'Compromiso',
    description: 'Tu satisfacción es nuestra prioridad. Estamos para vos en cada paso del camino.',
  },
];

export default function QuienesSomosPage() {
  return (
    <main className="w-full">
      {/* Hero Section */}
      <header className="bg-primary py-20">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            ¿Quiénes Somos?
          </h1>
          <p className="text-white text-lg max-w-2xl mx-auto leading-relaxed">
            Somos una tienda de calzado femenino nacida en Mendoza con el sueño de acercar moda, 
            calidad y comodidad a cada mujer.
          </p>
        </div>
      </header>

      {/* Contenido */}
      <article className="container-custom py-16">
        <div className="max-w-4xl mx-auto">

          {/* Nuestra historia */}
          <section className="card p-8 mb-8 mt-8">
            <h2 className="text-3xl font-bold text-dark mb-6">Nuestra historia</h2>
            <div className="space-y-4 text-gray leading-relaxed">
              <p>
                <strong className="text-dark">Paso a Paso Shoes</strong> nació en Mendoza con una idea simple: 
                que toda mujer pueda encontrar el calzado ideal sin tener que resignar calidad, estilo ni comodidad.
              </p>
              <p>
                Lo que empezó como un pequeño local en el corazón de la ciudad fue creciendo de la mano de 
                nuestra comunidad. Hoy contamos con sucursales en Mendoza y una tienda online que nos permite 
                llevar nuestro calzado a toda Argentina.
              </p>
              <p>
                Cada par que elegimos para nuestra colección pasa por un proceso de selección que prioriza 
                la calidad de los materiales, el confort y las tendencias de la temporada. Porque creemos que 
                los zapatos no son solo un accesorio: son la base de cada look, de cada día.
              </p>
            </div>
          </section>

          {/* Misión y Visión */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <section className="card p-8">
              <h2 className="text-2xl font-bold text-dark mb-4">Nuestra misión</h2>
              <p className="text-gray leading-relaxed">
                Brindar a cada mujer la posibilidad de elegir calzado de calidad con la comodidad 
                de comprar desde donde esté, con asesoramiento cercano y precios accesibles.
              </p>
            </section>
            <section className="card p-8">
              <h2 className="text-2xl font-bold text-dark mb-4">Nuestra visión</h2>
              <p className="text-gray leading-relaxed">
                Ser la tienda de calzado femenino de referencia en Mendoza y Argentina, reconocida 
                por la calidad de sus productos y la calidez de su atención.
              </p>
            </section>
          </div>

          {/* Valores */}
          <section className="mb-10">
            <h2 className="text-3xl font-bold text-dark mb-8 text-center">Nuestros valores</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {valores.map(({ icon: Icon, title, description }) => (
                <div key={title} className="card p-6 text-center">
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                    <Icon className="text-primary" size={28} />
                  </div>
                  <h3 className="font-bold text-dark mb-2">{title}</h3>
                  <p className="text-sm text-gray leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ¿Por qué elegirnos? */}
          <section className="card p-8 mb-8">
            <h2 className="text-2xl font-bold text-dark mb-6">¿Por qué elegirnos?</h2>
            <ul className="space-y-4">
              {[
                'Colecciones actualizadas con las últimas tendencias de temporada.',
                'Amplia variedad de talles para que todas encuentren su calzado ideal.',
                'Atención personalizada en local y vía WhatsApp.',
                'Compra online segura con múltiples medios de pago.',
                'Retiro en sucursal sin costo o envío a todo el país.',
                'Política de cambios simple y sin complicaciones.',
              ].map((motivo) => (
                <li key={motivo} className="flex items-start gap-3 text-gray">
                  <span className="text-primary font-bold mt-0.5 flex-shrink-0">✓</span>
                  {motivo}
                </li>
              ))}
            </ul>
          </section>

          {/* CTA */}
          <section className="bg-primary/5 border border-primary/20 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-dark mb-3">¡Seguinos en Instagram!</h2>
            <p className="text-gray mb-6 max-w-md mx-auto">
              Descubrí las últimas novedades, promociones exclusivas y tips de moda en nuestro perfil.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://www.instagram.com/shoes.pasoapaso/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                <Instagram size={18} aria-hidden="true" />
                @shoes.pasoapaso
              </a>
              <a
                href="/tienda"
                className="btn-secondary text-center"
              >
                Ver la tienda
              </a>
            </div>
          </section>

        </div>
      </article>
    </main>
  );
}
