'use client';

import React from 'react';
import Link from 'next/link';
import { Instagram, Mail, Phone } from 'lucide-react';

const Footer: React.FC = () => {

  return (
    <footer className="bg-dark text-white mt-20 w-full">
      <div className="w-full px-4 md:px-8 lg:px-16 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Columna 1: Sobre nosotros */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <div className="flex flex-col">
                <p className="text-xl font-bold text-white leading-tight">Paso a Paso</p>
                <p className="text-sm text-gray-300 leading-tight">Shoes</p>
              </div>
            </div>
            <p className="text-sm text-gray-300 mb-4 leading-relaxed">
              Calzado femenino de calidad al mejor precio. Tu comodidad es nuestra prioridad.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/shoes.pasoapaso/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-700 hover:bg-primary rounded-lg flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Columna 2: Navegación */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Navegación</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="footer-link text-sm text-gray-300">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/tienda" className="footer-link text-sm text-gray-300">
                  Tienda Web
                </Link>
              </li>
              <li>
                <Link href="/blog" className="footer-link text-sm text-gray-300">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/quienes-somos" className="footer-link text-sm text-gray-300">
                  ¿Quiénes Somos?
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="footer-link text-sm text-gray-300">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Contacto */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contacto</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-gray-300">
                <Mail size={16} className="flex-shrink-0" />
                <a href="mailto:info@pasoapasoshoes.com" className="footer-link">
                  info@pasoapasoshoes.com
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-300">
                <Phone size={16} className="flex-shrink-0" />
                <a href="https://wa.me/5492612546976" target="_blank" rel="noopener noreferrer" className="footer-link">
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 4: Información Legal */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Información Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacidad" className="footer-link text-sm text-gray-300">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="footer-link text-sm text-gray-300">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/preguntas-frecuentes" className="footer-link text-sm text-gray-300">
                  Preguntas Frecuentes
                </Link>
              </li>
              <li>
                <Link href="/cambios-devoluciones" className="footer-link text-sm text-gray-300">
                  Cambios y Devoluciones
                </Link>
              </li>
            </ul>
          </div>
        </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="border-t border-gray-700 w-full">
        <div className="w-full px-4 md:px-8 lg:px-16 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <p className="text-sm text-gray-300 order-2 md:order-1">
              &copy; {new Date().getFullYear()} Paso a Paso Shoes. Todos los derechos reservados.
            </p>
            <div className="flex items-center justify-center order-1 md:order-2">
              <span className="text-sm text-gray-300 whitespace-nowrap">
                Tienda Web desarrollada por{' '}
                <a 
                  href="https://touralia.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-white transition-colors"
                >
                  Touralia
                </a>
              </span>
            </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
