import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface TourStep {
  id: number;
  title: string;
  description: string;
  route: string;
  highlight?: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    title: 'Gestión de Productos',
    description: 'Administra productos regulares y en liquidación. Agrega, edita, elimina productos con control de inventario, stock, precios, imágenes múltiples, marcas, géneros, categorías y talles.',
    route: '/cms/tienda/productos',
    highlight: 'Controla todo tu inventario desde aquí.'
  },
  {
    id: 2,
    title: 'Gestión de Pedidos',
    description: 'Visualiza y gestiona pedidos de clientes en 3 estados: Pendientes (nuevos), Realizados (completados) y Rechazados. Actualiza estados y mantén informados a los compradores.',
    route: '/cms/pedidos',
    highlight: 'Administra todos los pedidos de tus clientes.'
  },
  {
    id: 3,
    title: 'Promociones y Cupones',
    description: 'Crea ofertas con descuentos (porcentaje, monto fijo o 2x1). Define vigencia, condiciones, restricciones como compra mínima. Genera códigos de cupón para que clientes los usen en el carrito.',
    route: '/cms/tienda/promociones',
    highlight: 'Crea ofertas irresistibles para aumentar tus ventas.'
  },
  {
    id: 4,
    title: 'Blog y Contenido Editorial',
    description: 'Publica artículos y contenido para tus clientes. Comparte consejos, tendencias, novedades y noticias. Gestiona borradores, publicados y archivados con imágenes destacadas.',
    route: '/cms/tienda/blog',
    highlight: 'Crea contenido de valor para tu audiencia.'
  },
  {
    id: 5,
    title: 'Imágenes y Banners',
    description: 'Administra banners del carrusel principal con imágenes desktop y mobile. Define título, descripción, enlace y orden de aparición. Control de banners activos/inactivos.',
    route: '/cms/tienda/imagenes',
    highlight: 'Personaliza la apariencia de tu tienda online.'
  },
  {
    id: 6,
    title: 'Usuarios del CMS',
    description: 'Administra usuarios con acceso al CMS. Define roles (ADMINISTRADORES, VENDEDORES, Y CLIENTES) con permisos específicos para cada usuario y área del sistema.',
    route: '/cms/usuarios',
    highlight: 'Gestiona quién tiene acceso al sistema y sus permisos.'
  }
];

export function useTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const router = useRouter();
  
  // Referencias para almacenar los IDs de los timeouts
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Limpiar timeouts al desmontar o cuando cambie el estado
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, []);

  const startTour = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
    // Navegar a la primera ruta del tour
    router.push(TOUR_STEPS[0].route);
  }, [router]);

  const nextStep = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      // Limpiar timeouts previos
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
      
      setIsTransitioning(true);
      
      transitionTimeoutRef.current = setTimeout(() => {
        const nextStepIndex = currentStep + 1;
        setCurrentStep(nextStepIndex);
        router.push(TOUR_STEPS[nextStepIndex].route);
        
        fadeTimeoutRef.current = setTimeout(() => {
          setIsTransitioning(false);
        }, 300);
      }, 300);
    }
  }, [currentStep, router]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      // Limpiar timeouts previos
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
      
      setIsTransitioning(true);
      
      transitionTimeoutRef.current = setTimeout(() => {
        const prevStepIndex = currentStep - 1;
        setCurrentStep(prevStepIndex);
        router.push(TOUR_STEPS[prevStepIndex].route);
        
        fadeTimeoutRef.current = setTimeout(() => {
          setIsTransitioning(false);
        }, 300);
      }, 300);
    }
  }, [currentStep, router]);

  const endTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
  }, []);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < TOUR_STEPS.length) {
      // Limpiar timeouts previos
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
      
      setIsTransitioning(true);
      
      transitionTimeoutRef.current = setTimeout(() => {
        setCurrentStep(stepIndex);
        router.push(TOUR_STEPS[stepIndex].route);
        
        fadeTimeoutRef.current = setTimeout(() => {
          setIsTransitioning(false);
        }, 300);
      }, 300);
    }
  }, [router]);

  return {
    isActive,
    currentStep,
    currentStepData: TOUR_STEPS[currentStep],
    totalSteps: TOUR_STEPS.length,
    isTransitioning,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === TOUR_STEPS.length - 1,
    startTour,
    nextStep,
    previousStep,
    endTour,
    goToStep,
  };
}
