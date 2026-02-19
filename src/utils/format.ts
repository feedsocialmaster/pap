// ============================================
// UTILIDADES DE FORMATO - PASO A PASO SHOES
// ============================================

/**
 * Utility function to merge class names
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}

/**
 * Formatea un número con separadores de miles (sin símbolo de moneda)
 * Usa formato consistente para evitar errores de hidratación
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

/**
 * Formatea un número a precio en pesos argentinos
 * Los precios en la base de datos se almacenan en centavos (Int)
 * Por ejemplo: 8999000 centavos = $89.990,00
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price / 100); // Convertir de centavos a pesos
};

/**
 * Formatea una fecha a formato DD/MM/AAAA
 */
export const formatDate = (date: Date | string): string => {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    // Verificar si la fecha es válida
    if (isNaN(d.getTime())) {
      return 'Fecha inválida';
    }
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch (error) {
    console.error('Error al formatear fecha:', date, error);
    return 'Fecha inválida';
  }
};

/**
 * Formatea una fecha con hora DD/MM/AAAA HH:mm
 */
export const formatDateTime = (date: Date | string): string => {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    // Verificar si la fecha es válida
    if (isNaN(d.getTime())) {
      return 'Fecha inválida';
    }
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch (error) {
    console.error('Error al formatear fecha y hora:', date, error);
    return 'Fecha inválida';
  }
};

/**
 * Calcula la edad basada en fecha de nacimiento
 */
export const calculateAge = (birthDate: Date | string): number => {
  const today = new Date();
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Valida si la edad está en el rango permitido (18-55)
 */
export const isValidAge = (birthDate: Date | string): boolean => {
  const age = calculateAge(birthDate);
  return age >= 18 && age <= 55;
};

/**
 * Calcula el porcentaje de descuento
 */
export const calculateDiscount = (originalPrice: number, discountedPrice: number): number => {
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
};

/**
 * Trunca un texto a un número máximo de caracteres
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Genera un número de orden único
 */
export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `PAS-${timestamp}${random}`.toUpperCase();
};

/**
 * Valida formato de email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida fortaleza de contraseña
 */
export const isStrongPassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Debe tener al menos 8 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una mayúscula');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una minúscula');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Debe contener al menos un número');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Debe contener al menos un símbolo especial');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Calcula puntos ganados basado en monto de compra
 */
export const calculatePointsEarned = (amount: number): number => {
  if (amount < 5000) return 50;
  if (amount < 10000) return 100;
  if (amount < 20000) return 250;
  if (amount < 50000) return 500;
  return 1000;
};

/**
 * Calcula descuento en pesos basado en puntos
 */
export const calculatePointsDiscount = (points: number): number => {
  if (points < 100) return 0;
  if (points < 500) return 500;
  if (points < 1000) return 3000;
  if (points < 2500) return 7000;
  return 20000;
};

/**
 * Convierte slug a título
 */
export const slugToTitle = (slug: string): string => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Convierte título a slug
 */
export const titleToSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

/**
 * Normaliza la URL de una imagen, agregando el dominio del backend si es necesario
 */
export const normalizeImageUrl = (url: string): string => {
  // Si ya es una URL completa, devolverla sin cambios
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Para URLs relativas, Next.js las manejará con rewrites
  // No necesitamos agregar el dominio del backend aquí
  return url.startsWith('/') ? url : '/' + url;
};

/**
 * Normaliza un array de imágenes desde la API
 */
export const normalizeProductImages = (imagenes: Array<string | { url: string }>): string[] => {
  if (!Array.isArray(imagenes)) return [];
  
  return imagenes.map((img) => {
    const url = typeof img === 'string' ? img : img.url;
    return normalizeImageUrl(url);
  });
};

/**
 * Convierte un tipo de calzado a formato slug para URLs
 */
export const tipoCalzadoToSlug = (tipoCalzado: string): string => {
  const mapping: Record<string, string> = {
    'Zapatillas': 'zapatillas',
    'Sandalias': 'sandalias',
    'Botas': 'botas',
    'Stilettos': 'stilettos',
    'Chatitas': 'chatitas',
    'Plataformas': 'plataformas',
  };
  
  return mapping[tipoCalzado] || tipoCalzado.toLowerCase();
};

/**
 * Convierte un slug de tipo de calzado a formato display
 */
export const slugToTipoCalzado = (slug: string): string => {
  const mapping: Record<string, string> = {
    'zapatillas': 'Zapatillas',
    'sandalias': 'Sandalias',
    'botas': 'Botas',
    'stilettos': 'Stilettos',
    'chatitas': 'Chatitas',
    'plataformas': 'Plataformas',
  };
  
  return mapping[slug] || slug;
};

/**
 * Genera la URL de un producto basada en su tipo de calzado y slug
 */
export const getProductUrl = (producto: { tipoCalzado: string; slug: string }): string => {
  const tipoSlug = tipoCalzadoToSlug(producto.tipoCalzado);
  return `/${tipoSlug}/${producto.slug}`;
};
