// ============================================
// TIPOS Y INTERFACES - PASO A PASO SHOES
// ============================================

// Usuario
export interface User {
  id: string;
  codigoCliente?: string; /// Código amigable visible: 000001-PAP, 000002-PAP
  nombre: string;
  apellido: string;
  fechaNacimiento: Date;
  direccion: Direccion;
  email: string;
  telefono?: string;
  whatsapp?: string;
  fechaRegistro: Date;
  activo?: boolean;
  role?: 'CLIENTA' | 'VENDEDOR' | 'ADMIN_CMS' | 'GERENTE_COMERCIAL' | 'DESARROLLADOR' | 'DUENA' | 'SUPER_SU';
}

export interface Direccion {
  calle: string;
  numero: string;
  ciudad: string;
  provincia: string;
  codigoPostal: string;
}

// Producto
export interface Producto {
  id: string;
  codigoProducto?: string; /// Código amigable visible: 000001-PROD, 000002-PROD
  slug: string;
  nombre: string;
  descripcion: string;
  precio: number;
  tipoCalzado: TipoCalzado;
  imagenes: Array<string | { url: string }>;
  talles: number[];
  colores?: Array<string | Color>;
  stock: number;
  enLiquidacion: boolean;
  porcentajeDescuento?: number;
  esFiesta: boolean;
  impermeable: boolean;
  antideslizante: boolean;
  caracteristicas: string[];
  retiroEnLocal?: boolean;
  envioNacional?: boolean;
  envioLocal?: boolean;
  productoEnLanzamiento?: boolean;
  metodosPago?: {
    tarjetas?: string[];
    transferenciaBancaria?: boolean;
    mercadoPago?: boolean;
    otros?: string[];
  };
  aplicaPromocion?: boolean;
  tipoPromocionAplica?: string;
  promocionActiva?: {
    id: string;
    titulo: string;
    descripcion: string;
    tipoDescuento: string;
    valorDescuento: number;
    leyendaPersonalizada?: string;
  } | null;
  fechaCreacion: Date;
}

export type TipoCalzado = 
  | 'Zapatillas'
  | 'Sandalias'
  | 'Botas'
  | 'Stilettos'
  | 'Chatitas'
  | 'Plataformas';

export interface Color {
  nombre: string;
  hex: string;
}

// Variante de Producto (por color y talle)
export interface ProductVariant {
  id: string;
  productId: string;
  colorName: string;
  colorCode: string;
  size: number;  // Talle
  stock: number;
  sku?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Producto
export interface Producto {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  precio: number;
  tipoCalzado: TipoCalzado;
  imagenes: Array<string | { url: string }>;
  talles: number[];
  colores?: Array<string | Color>;
  stock: number;
  stockTotal?: number; // Stock total calculado desde variantes
  variants?: ProductVariant[]; // Variantes por color con stock individual
  enLiquidacion: boolean;
  porcentajeDescuento?: number;
  esFiesta: boolean;
  impermeable: boolean;
  antideslizante: boolean;
  caracteristicas: string[];
  retiroEnLocal?: boolean;
  envioNacional?: boolean;
  envioLocal?: boolean;
  productoEnLanzamiento?: boolean;
  metodosPago?: {
    tarjetas?: string[];
    transferenciaBancaria?: boolean;
    mercadoPago?: boolean;
    otros?: string[];
  };
  aplicaPromocion?: boolean;
  tipoPromocionAplica?: string;
  promocionActiva?: {
    id: string;
    titulo: string;
    descripcion: string;
    tipoDescuento: string;
    valorDescuento: number;
    leyendaPersonalizada?: string;
  } | null;
  fechaCreacion: Date;
}
export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  talle: number;
  color?: string;
  precioUnitario: number;
}

export interface Carrito {
  items: ItemCarrito[];
  subtotal: number;
  descuentoPuntos: number;
  total: number;
}

// Compra / Orden
export interface Orden {
  id: string;
  numeroOrden: string;
  fecha: Date;
  usuario: User;
  productos: ItemCarrito[];
  subtotal: number;
  descuentoPuntos: number;
  total: number;
  estado: EstadoOrden;
  puntosGanados: number;
  metodoPago: MetodoPago;
  direccionEnvio?: Direccion | null;
}

export type EstadoOrden = 'En proceso' | 'Entregado' | 'Cancelado';

export interface MetodoPago {
  tipo: 'credito' | 'debito' | 'transferencia';
  ultimos4Digitos?: string;
  cuotas?: number;
}

// Filtros de Tienda
export interface FiltrosTienda {
  talle?: number[];
  tipoCalzado?: TipoCalzado[];
  rangoPrecio: {
    min: number;
    max: number;
  };
  // Nuevos filtros
  search?: string;
  stockRange?: {
    min: number;
    max: number;
  };
  sort?: 'price_asc' | 'price_desc' | 'newest';
  descuentoPuntos: boolean;
  codigoPromocional: boolean;
  enLiquidacion: boolean;
}

// Comentario / Testimonio
export interface Testimonio {
  id: string;
  usuario: {
    nombre: string;
    apellido: string;
  };
  comentario: string;
  rating: number;
  fecha: Date;
  aprobado: boolean;
}

// Banner / Promoción
export interface Banner {
  id: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  imagenMobile?: string;
  enlace?: string;
  activo: boolean;
  orden: number;
}

// Banco / Promoción Bancaria
export interface PromocionBancaria {
  id: string;
  banco: string;
  logo: string;
  beneficio: string;
  descripcion: string;
  fechaVigencia: Date;
  activo: boolean;
}

// Sucursal
export interface Sucursal {
  id: string;
  nombre: string;
  direccion: Direccion;
  telefono: string;
  email: string;
  horarios: string;
  coordenadas: {
    lat: number;
    lng: number;
  };
  imagenes: string[];
}

// Formularios
export interface FormularioRegistro {
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  direccion: Direccion;
  email: string;
  password: string;
  confirmarPassword: string;
}

export interface FormularioLogin {
  email: string;
  password: string;
  recordarme: boolean;
}

export interface FormularioContacto {
  nombre: string;
  email: string;
  tipoConsulta: string;
  mensaje: string;
}

export interface FormularioCambioPassword {
  passwordActual: string;
  passwordNuevo: string;
  confirmarPasswordNuevo: string;
}

// API Responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}
