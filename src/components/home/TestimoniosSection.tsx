'use client';

import { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const testimonios = [
  {
    id: 1,
    nombre: 'María González',
    ubicacion: 'Buenos Aires',
    rating: 5,
    comentario: 'Excelente calidad de productos y atención personalizada. Compré unas botas y son súper cómodas. ¡Totalmente recomendado!',
    imagen: '/images/testimonios/avatar-1.jpg',
    fecha: 'Hace 2 semanas',
  },
  {
    id: 2,
    nombre: 'Juan Pérez',
    ubicacion: 'Córdoba',
    rating: 5,
    comentario: 'Muy buena experiencia de compra online. El envío llegó antes de lo esperado y el producto es tal cual se describe en la página.',
    imagen: '/images/testimonios/avatar-2.jpg',
    fecha: 'Hace 1 mes',
  },
  {
    id: 3,
    nombre: 'Sofía Martínez',
    ubicacion: 'Rosario',
    rating: 4,
    comentario: 'Me encantaron las zapatillas que compré. Son muy lindas y cómodas. La atención por WhatsApp fue excelente.',
    imagen: '/images/testimonios/avatar-3.jpg',
    fecha: 'Hace 3 semanas',
  },
  {
    id: 4,
    nombre: 'Lucas Fernández',
    ubicacion: 'Mendoza',
    rating: 5,
    comentario: 'Primera vez que compro acá y quedé muy conforme. Buenos precios y excelente calidad. Ya hice mi segunda compra.',
    imagen: '/images/testimonios/avatar-4.jpg',
    fecha: 'Hace 1 semana',
  },
  {
    id: 5,
    nombre: 'Valentina Ruiz',
    ubicacion: 'La Plata',
    rating: 5,
    comentario: 'Compré varias veces y siempre todo perfecto. Las promociones son geniales y los productos de muy buena calidad.',
    imagen: '/images/testimonios/avatar-5.jpg',
    fecha: 'Hace 4 días',
  },
  {
    id: 6,
    nombre: 'Diego Castro',
    ubicacion: 'Tucumán',
    rating: 4,
    comentario: 'Muy buen servicio. Tuve que cambiar un producto y me lo solucionaron rápido. Recomiendo 100%.',
    imagen: '/images/testimonios/avatar-6.jpg',
    fecha: 'Hace 2 meses',
  },
];

export default function TestimoniosSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const testimoniPerPage = 3;

  const handlePrev = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? testimonios.length - testimoniPerPage : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) => 
      prev >= testimonios.length - testimoniPerPage ? 0 : prev + 1
    );
  };

  const visibleTestimonios = testimonios.slice(
    currentIndex,
    currentIndex + testimoniPerPage
  );

  // Rellenar si no hay suficientes testimonios
  while (visibleTestimonios.length < testimoniPerPage && testimonios.length > 0) {
    visibleTestimonios.push(testimonios[visibleTestimonios.length % testimonios.length]);
  }

  const promedioRating = (
    testimonios.reduce((acc, t) => acc + t.rating, 0) / testimonios.length
  ).toFixed(1);

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-dark mb-4">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            Más de 10.000 clientes satisfechos en todo el país
          </p>
          
          {/* Rating promedio */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${
                    star <= Math.round(parseFloat(promedioRating))
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-2xl font-bold text-dark">{promedioRating}</span>
          </div>
          <p className="text-gray-500 text-sm">
            Basado en {testimonios.length} reseñas verificadas
          </p>
        </div>

        {/* Carrusel de testimonios */}
        <div className="relative">
          {/* Botones de navegación */}
          <button
            onClick={handlePrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
            aria-label="Testimonio anterior"
          >
            <ChevronLeft className="w-6 h-6 text-primary" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
            aria-label="Siguiente testimonio"
          >
            <ChevronRight className="w-6 h-6 text-primary" />
          </button>

          {/* Grid de testimonios */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleTestimonios.map((testimonio, index) => (
              <div
                key={`${testimonio.id}-${index}`}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 relative overflow-hidden"
              >
                <Quote className="absolute top-4 right-4 w-12 h-12 text-primary opacity-10" />
                
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white font-bold text-xl">
                    {testimonio.nombre.charAt(0)}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-bold text-dark">{testimonio.nombre}</h4>
                    <p className="text-sm text-gray-500">{testimonio.ubicacion}</p>
                    <p className="text-xs text-gray-400 mt-1">{testimonio.fecha}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= testimonio.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>

                <p className="text-gray-600 text-sm leading-relaxed">
                  "{testimonio.comentario}"
                </p>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-xs text-green-600 font-medium">
                    ✓ Compra verificada
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Indicadores */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {Array.from({ length: Math.ceil(testimonios.length / testimoniPerPage) }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index * testimoniPerPage)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  Math.floor(currentIndex / testimoniPerPage) === index
                    ? 'w-8 bg-primary'
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Ir a la página ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            ¿Ya compraste con nosotros? ¡Dejanos tu opinión!
          </p>
          <button className="btn-primary">
            Escribir una reseña
          </button>
        </div>
      </div>
    </section>
  );
}
