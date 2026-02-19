'use client';

import { MapPin, Clock, Phone, Mail } from 'lucide-react';

const sucursales = [
  {
    nombre: 'Sucursal Centro',
    direccion: 'Av. Rivadavia 1234, Buenos Aires',
    telefono: '+5492612546976',
    email: 'centro@pasoazapatos.com',
    horario: 'Lun a Vie: 9:00 - 20:00 | Sáb: 10:00 - 18:00',
    mapa: 'https://maps.google.com/maps?q=-32.8875996,-68.8384136&t=&z=15&ie=UTF8&iwloc=&output=embed',
  },
  {
    nombre: 'Sucursal Shopping',
    direccion: 'Shopping Alto Palermo Local 45, Buenos Aires',
    telefono: '+5492612546976',
    email: 'shopping@pasoazapatos.com',
    horario: 'Todos los días: 10:00 - 22:00',
    mapa: 'https://maps.google.com/maps?q=-32.8857452,-68.8422727&t=&z=15&ie=UTF8&iwloc=&output=embed',
  },
];

export default function SucursalesSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-dark mb-4">
            Nuestras Sucursales
          </h2>
          <p className="text-gray-600 text-lg">
            Visitanos en cualquiera de nuestras tiendas
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {sucursales.map((sucursal, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              {/* Mapa */}
              <div className="h-48 bg-gray-200 relative overflow-hidden">
                <iframe
                  src={sucursal.mapa}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0"
                  title={`Mapa de ubicación de ${sucursal.nombre}`}
                />
              </div>

              {/* Información */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-dark mb-4">
                  {sucursal.nombre}
                </h3>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <p className="text-gray-600 text-sm">{sucursal.direccion}</p>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <p className="text-gray-600 text-sm">{sucursal.horario}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                    <a
                      href={`tel:${sucursal.telefono}`}
                      className="text-gray-600 text-sm hover:text-primary transition-colors"
                    >
                      {sucursal.telefono}
                    </a>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                    <a
                      href={`mailto:${sucursal.email}`}
                      className="text-gray-600 text-sm hover:text-primary transition-colors"
                    >
                      {sucursal.email}
                    </a>
                  </div>
                </div>

                <button className="mt-6 w-full btn-outline py-2 text-sm">
                  Ver en Google Maps
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            ¿Tenés alguna consulta? Contactanos por WhatsApp
          </p>
          <a
            href="https://wa.me/5492612546976"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200"
          >
            <Phone className="w-5 h-5" />
            Chatear por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
