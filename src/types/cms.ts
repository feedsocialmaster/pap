// CMS Types
export interface CMSEvento {
  id: string;
  titulo: string;
  descripcion: string;
  imagen?: string;
  fechaInicio: Date;
  fechaFin: Date;
  ubicacion?: string;
  activo: boolean;
  destacado: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CMSRecursoUtil {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: 'GUIA' | 'TUTORIAL' | 'DOCUMENTO' | 'VIDEO' | 'ENLACE';
  contenido: string;
  archivo?: string;
  icono?: string;
  orden: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CMSNotificacion {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: 'INFO' | 'PROMOCION' | 'ALERTA' | 'SISTEMA';
  prioridad: 'BAJA' | 'NORMAL' | 'ALTA' | 'URGENTE';
  destinatarios: string[];
  programada?: Date;
  enviada: boolean;
  fechaEnvio?: Date;
  createdAt: Date;
}

export interface CMSPromoBancaria {
  id: string;
  banco: string;
  logoUrl: string;
  beneficio: string;
  descripcion: string;
  fechaInicio: Date;
  fechaFin: Date;
  activo: boolean;
  orden: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CMSSucursal {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  email: string;
  horarios: Record<string, string>;
  horariosEspeciales?: Record<string, string>;
  mapsUrl?: string;
  coordenadas?: { lat: number; lng: number };
  activo: boolean;
  orden: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CMSTestimonio {
  id: string;
  nombre: string;
  fotoUrl?: string;
  texto: string;
  calificacion: number;
  ubicacion?: string;
  destacado: boolean;
  activo: boolean;
  orden: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CMSContenidoPagina {
  id: string;
  slug: string;
  titulo: string;
  contenido: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  activo: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CMSAuditLog {
  id: string;
  usuarioId: string;
  accion: 'CREATE' | 'UPDATE' | 'DELETE';
  entidad: string;
  entidadId: string;
  cambios?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface DashboardStats {
  ventasHoy: number;
  ingresosHoy: number;
  ordenesPendientes: number;
  productosFaltantes: number;
  productosSinStock: number;
}

export interface SalesChart {
  fecha: Date;
  cantidad: number;
  total: number;
}

export interface TopProduct {
  id: string;
  nombre: string;
  imagen: string | null;
  cantidadVendida: number;
}

// ============================================
// Tipos para la página "Quiénes Somos / Nosotros"
// ============================================

export interface AboutUsHeroSection {
  title: string;
  subtitle: string;
  imageUrl?: string;
}

export interface AboutUsHistoriaSection {
  title: string;
  paragraphs: string[];
  imageUrl?: string;
}

export interface AboutUsValor {
  id: string;
  icon: string; // Nombre del icono de lucide-react
  iconColor?: string; // Color del icono (opcional)
  title: string;
  description: string; // Máx 200 caracteres
  imageUrl?: string;
  orden: number;
}

export interface AboutUsValoresSection {
  title: string;
  valores: AboutUsValor[];
}

export interface AboutUsMisionVisionItem {
  title: string;
  content: string;
  icon?: string;
  imageUrl?: string;
}

export interface AboutUsMisionVisionSection {
  mision: AboutUsMisionVisionItem;
  vision: AboutUsMisionVisionItem;
}

export interface AboutUsCounter {
  id: string;
  value: string; // ej: "10+", "50K+", "98%"
  label: string;
  visible: boolean;
  orden: number;
}

export interface AboutUsNumerosSection {
  title: string;
  visible: boolean;
  counters: AboutUsCounter[];
}

export interface AboutUsContent {
  hero: AboutUsHeroSection;
  historia: AboutUsHistoriaSection;
  valores: AboutUsValoresSection;
  misionVision: AboutUsMisionVisionSection;
  numeros: AboutUsNumerosSection;
}
