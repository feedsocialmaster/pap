// ============================================
// DATOS MOCK - PASO A PASO SHOES
// ============================================

import { Producto, Banner, PromocionBancaria, Sucursal, Testimonio, FiltrosTienda } from '@/types';

// PRODUCTOS
// Array vacío - Los productos se cargarán desde el CMS
export const mockProductos: Producto[] = [];

// BANNERS
export const mockBanners: Banner[] = [
  {
    id: '1',
    titulo: '¡Nueva Colección Primavera-Verano!',
    descripcion: 'Descubrí los nuevos modelos de la temporada',
    imagen: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1920',
    imagenMobile: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=768',
    enlace: '/tienda',
    activo: true,
    orden: 1,
  },
  {
    id: '2',
    titulo: 'Liquidación hasta 50% OFF',
    descripcion: 'Aprovechá los descuentos en productos seleccionados',
    imagen: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=1920',
    imagenMobile: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=768',
    enlace: '/tienda?liquidacion=true',
    activo: true,
    orden: 2,
  },
];

// PROMOCIONES BANCARIAS
export const mockPromocionesBancarias: PromocionBancaria[] = [
  {
    id: '1',
    banco: 'Banco Nación',
    logo: '/images/bancos/nacion.png',
    beneficio: '12 cuotas sin interés',
    descripcion: 'Con todas las tarjetas de crédito Visa y Mastercard',
    fechaVigencia: new Date('2024-12-31'),
    activo: true,
  },
  {
    id: '2',
    banco: 'Banco Galicia',
    logo: '/images/bancos/galicia.png',
    beneficio: '20% de descuento',
    descripcion: 'Los días martes con Galicia Eminent',
    fechaVigencia: new Date('2024-12-31'),
    activo: true,
  },
  {
    id: '3',
    banco: 'Banco Santander',
    logo: '/images/bancos/santander.png',
    beneficio: '6 cuotas sin interés',
    descripcion: 'Con tarjetas de crédito Santander',
    fechaVigencia: new Date('2024-12-31'),
    activo: true,
  },
];

// SUCURSALES
export const mockSucursales: Sucursal[] = [
  {
    id: '1',
    nombre: 'Sucursal Principal',
    direccion: {
      calle: 'Av. San Martín',
      numero: '1385',
      ciudad: 'Ciudad de Mendoza',
      provincia: 'Mendoza',
      codigoPostal: '5500',
    },
    telefono: '+5492612546976',
    email: 'centro@pasoapasoshoes.com',
    horarios: 'Lunes a Viernes: 09:30 a 21:00 | Sábados: 09:00 - 21:00 hs',
    coordenadas: {
      lat: -32.887611,
      lng: -68.838444,
    },
    imagenes: ['/images/sucursales/centro.jpg'],
  },
  {
    id: '2',
    nombre: 'Sucursal Outlet',
    direccion: {
      calle: 'Av. Las Heras',
      numero: '300',
      ciudad: 'Ciudad de Mendoza',
      provincia: 'Mendoza',
      codigoPostal: '5500',
    },
    telefono: '+5492612546976',
    email: 'outlet@pasoapasoshoes.com',
    horarios: 'Lunes a Viernes: 09:30 a 21:00 | Sábados: 09:00 - 21:00 hs',
    coordenadas: {
      lat: -32.8857095,
      lng: -68.8423772,
    },
    imagenes: ['/images/sucursales/shopping.jpg'],
  },
];

// TESTIMONIOS
export const mockTestimonios: Testimonio[] = [
  {
    id: '1',
    usuario: {
      nombre: 'María',
      apellido: 'González',
    },
    comentario: 'Excelente calidad de productos y atención. Mis zapatillas son súper cómodas!',
    rating: 5,
    fecha: new Date('2024-10-20'),
    aprobado: true,
  },
  {
    id: '2',
    usuario: {
      nombre: 'Laura',
      apellido: 'Fernández',
    },
    comentario: 'Me encantó el sistema de puntos. Pude comprar unas botas hermosas con descuento!',
    rating: 5,
    fecha: new Date('2024-10-18'),
    aprobado: true,
  },
  {
    id: '3',
    usuario: {
      nombre: 'Sofía',
      apellido: 'Martínez',
    },
    comentario: 'Gran variedad de modelos y talles. Siempre encuentro lo que busco.',
    rating: 4,
    fecha: new Date('2024-10-15'),
    aprobado: true,
  },
];

// HELPER: Obtener productos filtrados
export const getFilteredProducts = (filters: Partial<FiltrosTienda>) => {
  let filtered = [...mockProductos];

  if (filters.talle && filters.talle.length > 0) {
    filtered = filtered.filter(p => 
      filters.talle!.some((t: number) => p.talles.includes(t))
    );
  }

  if (filters.tipoCalzado && filters.tipoCalzado.length > 0) {
    filtered = filtered.filter(p => 
      filters.tipoCalzado!.includes(p.tipoCalzado)
    );
  }

  if (filters.rangoPrecio) {
    filtered = filtered.filter(p => 
      p.precio >= filters.rangoPrecio!.min && p.precio <= filters.rangoPrecio!.max
    );
  }

  if (filters.enLiquidacion) {
    filtered = filtered.filter(p => p.enLiquidacion);
  }

  return filtered;
};

// HELPER: Obtener producto por ID
export const getProductById = (id: string): Producto | undefined => {
  return mockProductos.find(p => p.id === id);
};

// HELPER: Obtener productos recientes
export const getRecentProducts = (limit: number = 8): Producto[] => {
  return mockProductos
    .sort((a, b) => b.fechaCreacion.getTime() - a.fechaCreacion.getTime())
    .slice(0, limit);
};

// HELPER: Obtener productos en liquidación
export const getLiquidacionProducts = (): Producto[] => {
  return mockProductos.filter(p => p.enLiquidacion);
};
