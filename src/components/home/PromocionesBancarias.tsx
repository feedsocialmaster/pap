'use client';

import { CreditCard, Percent, Calendar } from 'lucide-react';

const bancos = [
  {
    nombre: 'Banco Nación',
    descuento: '20%',
    cuotas: '6 cuotas sin interés',
    logo: '/images/logos/banco-nacion.svg',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    nombre: 'Banco Provincia',
    descuento: '15%',
    cuotas: '12 cuotas sin interés',
    logo: '/images/logos/banco-provincia.svg',
    color: 'bg-green-100 text-green-700',
  },
  {
    nombre: 'Banco Galicia',
    descuento: '10%',
    cuotas: '3 cuotas sin interés',
    logo: '/images/logos/banco-galicia.svg',
    color: 'bg-orange-100 text-orange-700',
  },
  {
    nombre: 'Banco Santander',
    descuento: '25%',
    cuotas: '6 cuotas sin interés',
    logo: '/images/logos/banco-santander.svg',
    color: 'bg-red-100 text-red-700',
  },
];

export default function PromocionesBancarias() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-dark mb-4">
            Promociones Bancarias
          </h2>
          <p className="text-gray-600 text-lg">
            Aprovechá las mejores promos con tu tarjeta favorita
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {bancos.map((banco, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 hover:scale-105"
            >
              <div className={`${banco.color} w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto`}>
                <CreditCard className="w-8 h-8" />
              </div>
              
              <h3 className="text-xl font-bold text-center text-dark mb-3">
                {banco.nombre}
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Percent className="w-5 h-5" />
                  <span className="text-2xl font-bold">{banco.descuento}</span>
                </div>
                
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">{banco.cuotas}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  * Válido para compras superiores a $50.000
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-xl shadow-md p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold text-dark mb-2">
                ¿Querés más beneficios?
              </h3>
              <p className="text-gray-600">
                Registrate en nuestro programa de fidelidad y accedé a descuentos exclusivos
              </p>
            </div>
            <button className="btn-primary whitespace-nowrap">
              Registrarme ahora
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
