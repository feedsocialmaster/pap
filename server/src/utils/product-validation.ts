/**
 * Validaciones de reglas de negocio para productos
 * 
 * Reglas implementadas:
 * 1. Productos en liquidación deben tener porcentaje de descuento
 * 2. No se pueden aplicar cupones a productos en liquidación
 * 3. Slugs deben ser únicos y URL-safe
 */

export interface ProductValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ProductData {
  id?: string;
  enLiquidacion?: boolean;
  porcentajeDescuento?: number | null;
  precio?: number;
  slug?: string;
  nombre?: string;
  categoryId?: string | null;
}

/**
 * Valida que un producto no tenga combinaciones inválidas
 */
export function validateProductBusinessRules(data: ProductData): ProductValidationError[] {
  const errors: ProductValidationError[] = [];

  // Validar productos en liquidación
  if (data.enLiquidacion === true) {
    // Validar porcentaje de descuento
    if (data.porcentajeDescuento !== undefined && data.porcentajeDescuento !== null) {
      if (data.porcentajeDescuento < 1 || data.porcentajeDescuento > 100) {
        errors.push({
          field: 'porcentajeDescuento',
          message: 'El porcentaje de descuento debe estar entre 1 y 100.',
          code: 'DESCUENTO_INVALIDO'
        });
      }
    } else {
      errors.push({
        field: 'porcentajeDescuento',
        message: 'Productos en liquidación deben tener un porcentaje de descuento definido.',
        code: 'DESCUENTO_REQUERIDO'
      });
    }
  }

  // Validación de precio
  if (data.precio !== undefined && data.precio < 0) {
    errors.push({
      field: 'precio',
      message: 'El precio debe ser un valor positivo.',
      code: 'PRECIO_INVALIDO'
    });
  }

  return errors;
}

/**
 * Valida que un slug sea URL-safe
 */
export function validateSlug(slug: string): boolean {
  // Solo permite letras minúsculas, números y guiones
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

/**
 * Genera un slug a partir de un nombre
 */
export function generateSlug(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD') // Normalizar caracteres Unicode
    .replace(/[\u0300-\u036f]/g, '') // Eliminar diacríticos
    .replace(/[^a-z0-9\s-]/g, '') // Eliminar caracteres especiales
    .trim()
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/-+/g, '-') // Reemplazar múltiples guiones con uno solo
    .substring(0, 100); // Limitar longitud
}

/**
 * Valida si un producto puede aceptar cupones o códigos promocionales
 */
export function canApplyCoupon(product: ProductData): { allowed: boolean; reason?: string } {
  // Productos en liquidación no aceptan cupones
  if (product.enLiquidacion === true) {
    return {
      allowed: false,
      reason: 'Los productos en liquidación no admiten cupones ni códigos promocionales.'
    };
  }
  
  return { allowed: true };
}

/**
 * Valida los datos mínimos requeridos para crear un producto
 */
export function validateRequiredFields(data: ProductData): ProductValidationError[] {
  const errors: ProductValidationError[] = [];

  if (!data.nombre || data.nombre.trim().length === 0) {
    errors.push({
      field: 'nombre',
      message: 'El nombre del producto es obligatorio.',
      code: 'NOMBRE_REQUERIDO'
    });
  }

  if (data.precio === undefined || data.precio === null) {
    errors.push({
      field: 'precio',
      message: 'El precio del producto es obligatorio.',
      code: 'PRECIO_REQUERIDO'
    });
  }

  return errors;
}

/**
 * Valida todo el producto (campos requeridos + reglas de negocio)
 */
export function validateProduct(data: ProductData, isUpdate: boolean = false): ProductValidationError[] {
  const errors: ProductValidationError[] = [];

  // Si es creación, validar campos requeridos
  if (!isUpdate) {
    errors.push(...validateRequiredFields(data));
  }

  // Validar reglas de negocio
  errors.push(...validateProductBusinessRules(data));

  // Validar slug si está presente
  if (data.slug && !validateSlug(data.slug)) {
    errors.push({
      field: 'slug',
      message: 'El slug debe contener solo letras minúsculas, números y guiones. No puede comenzar ni terminar con guión.',
      code: 'SLUG_INVALIDO'
    });
  }

  return errors;
}
