import { Metadata } from 'next';
import { Shield, Lock, Eye, Database, UserCheck, Bell } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Política de Privacidad - Paso a Paso Shoes | Protección de Datos',
  description: 'Política de privacidad de Paso a Paso Shoes. Conocé cómo recopilamos, usamos y protegemos tus datos personales. Cumplimiento con Ley 25.326 de Protección de Datos Personales de Argentina. Última actualización: 2 de Noviembre de 2025.',
  keywords: [
    'política de privacidad paso a paso shoes',
    'protección de datos personales',
    'ley 25.326',
    'privacidad tienda online',
    'seguridad datos argentina',
    'derechos datos personales',
    'cookies política',
    'GDPR argentina',
  ],
  openGraph: {
    title: 'Política de Privacidad - Paso a Paso Shoes',
    description: 'Conocé cómo protegemos tus datos personales. Política de privacidad conforme a la Ley 25.326 de Argentina.',
    type: 'website',
    locale: 'es_AR',
  },
  twitter: {
    card: 'summary',
    title: 'Política de Privacidad - Paso a Paso Shoes',
    description: 'Conocé cómo protegemos tus datos personales.',
  },
  alternates: {
    canonical: '/privacidad',
  },
};

export default function PrivacidadPage() {
  return (
    <main className="w-full">
      {/* Hero Section */}
      <header className="bg-primary py-16">
        <div className="container-custom text-center">
          <Shield className="mx-auto text-white mb-4" size={64} aria-hidden="true" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Política de Privacidad
          </h1>
          <p className="text-white max-w-2xl mx-auto">
            Tu privacidad es importante para nosotros. Conocé cómo protegemos tus datos.
          </p>
          <p className="text-sm text-white mt-2">
            Última actualización: 2 de Noviembre de 2025
          </p>
        </div>
      </header>

      {/* Contenido */}
      <article className="container-custom py-16">
        <div className="max-w-4xl mx-auto">
          {/* Introducción */}
          <section className="card p-8 mb-8 mt-8">
            <p className="text-gray leading-relaxed">
              En <strong>Paso a Paso Shoes</strong>, respetamos tu privacidad y nos comprometemos a proteger 
              tus datos personales. Esta Política de Privacidad describe qué información recopilamos, 
              cómo la usamos, y tus derechos respecto a ella, en cumplimiento con la 
              Ley 25.326 de Protección de Datos Personales de Argentina.
            </p>
          </section>

          {/* 1. Información que Recopilamos */}
          <section className="card p-8 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <Database className="text-primary" size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-dark mb-4">
                  1. Información que Recopilamos
                </h2>
              </div>
            </div>
            
            <div className="space-y-4 text-gray">
              <div>
                <h3 className="font-bold text-dark mb-2">Información que nos proporcionás:</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Datos de registro:</strong> Nombre, apellido, email, teléfono, fecha de nacimiento</li>
                  <li><strong>Dirección de envío:</strong> Calle, número, ciudad, provincia, código postal</li>
                  <li><strong>Información de pago:</strong> Los datos de tarjeta son procesados por pasarelas seguras (no los almacenamos)</li>
                  <li><strong>Historial de compras:</strong> Productos adquiridos, fechas, montos</li>
                  <li><strong>Preferencias:</strong> Talle habitual, marcas favoritas, intereses</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-dark mb-2">Información recopilada automáticamente:</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Datos de navegación:</strong> Dirección IP, tipo de navegador, páginas visitadas</li>
                  <li><strong>Cookies:</strong> Información sobre tu experiencia en el sitio</li>
                  <li><strong>Dispositivo:</strong> Tipo de dispositivo, sistema operativo, resolución</li>
                  <li><strong>Comportamiento:</strong> Productos vistos, búsquedas realizadas, tiempo en el sitio</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 2. Cómo Usamos tu Información */}
          <section className="card p-8 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <Eye className="text-secondary" size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-dark mb-4">
                  2. Cómo Usamos tu Información
                </h2>
              </div>
            </div>
            
            <div className="space-y-3 text-gray">
              <p>Usamos tus datos personales para:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>Procesar tus pedidos:</strong> Gestionar compras, pagos y envíos</li>
                <li><strong>Comunicarnos contigo:</strong> Confirmaciones de pedido, actualizaciones de envío, respuestas a consultas</li>
                <li><strong>Personalizar tu experiencia:</strong> Recomendaciones de productos, ofertas relevantes</li>
                <li><strong>Marketing:</strong> Enviar newsletters, promociones (solo con tu consentimiento)</li>
                <li><strong>Mejorar nuestros servicios:</strong> Análisis de uso, optimización del sitio</li>
                <li><strong>Seguridad:</strong> Prevenir fraudes, proteger nuestros sistemas</li>
                <li><strong>Cumplir obligaciones legales:</strong> Facturación, impuestos, regulaciones comerciales</li>
              </ul>
            </div>
          </section>

          {/* 3. Compartir Información */}
          <section className="card p-8 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <UserCheck className="text-accent" size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-dark mb-4">
                  3. Compartir tu Información
                </h2>
              </div>
            </div>
            
            <div className="space-y-3 text-gray">
              <p>Podemos compartir tu información con:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>
                  <strong>Proveedores de servicios:</strong> Empresas de logística (para envíos), 
                  procesadores de pago, servicios de email marketing
                </li>
                <li>
                  <strong>Socios comerciales:</strong> Solo si has dado tu consentimiento explícito
                </li>
                <li>
                  <strong>Autoridades:</strong> Cuando sea requerido por ley o para proteger nuestros derechos legales
                </li>
              </ul>
              <p className="mt-4">
                <strong>Nunca vendemos tu información personal a terceros.</strong>
              </p>
            </div>
          </section>

          {/* 4. Cookies */}
          <section className="card p-8 mb-6">
            <h2 className="text-2xl font-bold text-dark mb-4">4. Uso de Cookies</h2>
            <div className="space-y-3 text-gray">
              <p>
                Utilizamos cookies y tecnologías similares para mejorar tu experiencia. Las cookies son 
                pequeños archivos que se almacenan en tu dispositivo.
              </p>
              
              <div className="bg-gray-light p-4 rounded-lg">
                <h3 className="font-bold text-dark mb-2">Tipos de cookies que usamos:</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Esenciales:</strong> Necesarias para el funcionamiento del sitio (carrito, login)</li>
                  <li><strong>Funcionales:</strong> Recordar tus preferencias (idioma, talle)</li>
                  <li><strong>Analíticas:</strong> Entender cómo usás el sitio (Google Analytics)</li>
                  <li><strong>Marketing:</strong> Mostrarte publicidad relevante</li>
                </ul>
              </div>

              <p>
                Podés configurar tu navegador para rechazar cookies, pero esto puede afectar la funcionalidad del sitio.
              </p>
            </div>
          </section>

          {/* 5. Seguridad */}
          <section className="card p-8 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <Lock className="text-success" size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-dark mb-4">
                  5. Seguridad de tus Datos
                </h2>
              </div>
            </div>
            
            <div className="space-y-3 text-gray">
              <p>
                Implementamos medidas técnicas y organizativas para proteger tus datos:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Encriptación SSL/TLS para todas las transmisiones</li>
                <li>Servidores seguros con firewalls</li>
                <li>Acceso restringido a datos personales</li>
                <li>Auditorías de seguridad regulares</li>
                <li>Políticas estrictas de contraseñas</li>
              </ul>
              <p className="mt-4">
                Sin embargo, ningún sistema es 100% seguro. Te recomendamos mantener tu contraseña segura 
                y no compartirla con nadie.
              </p>
            </div>
          </section>

          {/* 6. Tus Derechos */}
          <section className="card p-8 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <Shield className="text-primary" size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-dark mb-4">
                  6. Tus Derechos sobre tus Datos
                </h2>
              </div>
            </div>
            
            <div className="space-y-3 text-gray">
              <p>Conforme a la Ley 25.326, tenés derecho a:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>
                  <strong>Acceso:</strong> Solicitar una copia de los datos que tenemos sobre vos
                </li>
                <li>
                  <strong>Rectificación:</strong> Corregir información inexacta o incompleta
                </li>
                <li>
                  <strong>Supresión:</strong> Solicitar la eliminación de tus datos (sujeto a obligaciones legales)
                </li>
                <li>
                  <strong>Oposición:</strong> Oponerte al procesamiento de tus datos para marketing
                </li>
                <li>
                  <strong>Portabilidad:</strong> Recibir tus datos en formato estructurado
                </li>
                <li>
                  <strong>Revocar consentimiento:</strong> Retirar tu consentimiento en cualquier momento
                </li>
              </ul>
              <p className="mt-4">
                Para ejercer estos derechos, contactanos a: <strong>privacidad@pasoashoes.com</strong>
              </p>
            </div>
          </section>

          {/* 7. Retención de Datos */}
          <section className="card p-8 mb-6">
            <h2 className="text-2xl font-bold text-dark mb-4">7. Retención de Datos</h2>
            <div className="space-y-3 text-gray">
              <p>
                Conservamos tus datos personales mientras:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Mantengas una cuenta activa con nosotros</li>
                <li>Sea necesario para proporcionarte nuestros servicios</li>
                <li>Lo requiera la ley (facturas, registros contables: 10 años)</li>
                <li>Existan reclamaciones o disputas pendientes</li>
              </ul>
              <p className="mt-4">
                Una vez que ya no necesitemos tus datos, los eliminaremos de forma segura.
              </p>
            </div>
          </section>

          {/* 8. Marketing */}
          <section className="card p-8 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <Bell className="text-secondary" size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-dark mb-4">
                  8. Comunicaciones de Marketing
                </h2>
              </div>
            </div>
            
            <div className="space-y-3 text-gray">
              <p>
                Con tu consentimiento, podemos enviarte:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Newsletters con novedades y ofertas</li>
                <li>Promociones exclusivas</li>
                <li>Recomendaciones personalizadas</li>
              </ul>
              <p className="mt-4">
                Podés darte de baja en cualquier momento haciendo clic en "Cancelar suscripción" en 
                cualquier email, o desde la configuración de tu perfil.
              </p>
            </div>
          </section>

          {/* 9. Menores */}
          <section className="card p-8 mb-6">
            <h2 className="text-2xl font-bold text-dark mb-4">9. Privacidad de Menores</h2>
            <div className="space-y-3 text-gray">
              <p>
                Nuestros servicios están dirigidos a personas mayores de 18 años. No recopilamos 
                intencionalmente información de menores de edad.
              </p>
              <p>
                Si sos padre/madre y creés que tu hijo/a nos ha proporcionado información, 
                contactanos inmediatamente para eliminarla.
              </p>
            </div>
          </section>

          {/* 10. Enlaces a Terceros */}
          <section className="card p-8 mb-6">
            <h2 className="text-2xl font-bold text-dark mb-4">10. Enlaces a Sitios de Terceros</h2>
            <div className="space-y-3 text-gray">
              <p>
                Nuestro sitio puede contener enlaces a sitios web de terceros (redes sociales, pasarelas de pago). 
                No somos responsables de las prácticas de privacidad de estos sitios.
              </p>
              <p>
                Te recomendamos leer las políticas de privacidad de cualquier sitio que visites.
              </p>
            </div>
          </section>

          {/* 11. Cambios */}
          <section className="card p-8 mb-6">
            <h2 className="text-2xl font-bold text-dark mb-4">11. Cambios a esta Política</h2>
            <div className="space-y-3 text-gray">
              <p>
                Podemos actualizar esta Política de Privacidad periódicamente. Te notificaremos sobre 
                cambios importantes por email o mediante un aviso destacado en el sitio.
              </p>
              <p>
                La fecha de "Última actualización" al inicio de esta política indica cuándo fue modificada por última vez.
              </p>
            </div>
          </section>

          {/* Contacto */}
          <aside className="card p-8 bg-primary/10">
            <h2 className="text-2xl font-bold text-dark mb-4">Contacto</h2>
            <p className="text-gray mb-4">
              Si tenés preguntas sobre esta Política de Privacidad o querés ejercer tus derechos, contactanos:
            </p>
            <div className="space-y-2 text-gray">
              <p><strong>Responsable de Datos:</strong> Paso a Paso Shoes S.R.L.</p>
              <p><strong>Email:</strong> privacidad@pasoashoes.com</p>
              <p><strong>Teléfono:</strong> +5492612546976</p>
              <p><strong>Dirección:</strong> Av. Corrientes 1234, CABA, Argentina</p>
            </div>
            <p className="text-gray mt-4">
              También podés presentar una reclamación ante la Agencia de Acceso a la Información Pública: 
              <a href="https://www.argentina.gob.ar/aaip" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                www.argentina.gob.ar/aaip
              </a>
            </p>
          </aside>
        </div>
      </article>
    </main>
  );
}
