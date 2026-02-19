'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCMSStore } from '@/store/cmsStore';
import { useAuthStore } from '@/store/authStore';
import {
  Store,
  TrendingUp,
  FileText,
  Package,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Calendar,
  FileStack,
  Crown,
  Image as ImageIcon,
  Megaphone,
  ShoppingCart,
  PackageMinus,
  PackagePlus,
  CheckCircle,
  XCircle,
  BookOpen,
  Lightbulb,
  MessageCircle,
  Sparkles,
  Map,
  Users,
  Globe,
  Home,
} from 'lucide-react';
import { cn } from '@/utils/format';
import { canAccessUserManagement } from '@/utils/user-permissions';

interface SidebarItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  children?: SidebarItem[];
  /** Si es true, requiere permiso de gestión de usuarios */
  requiresUserManagement?: boolean;
}

const sidebarItems: SidebarItem[] = [
  {
    label: 'Tienda Web',
    icon: <Store className="w-5 h-5" />,
    children: [
      {
        label: 'Blog',
        icon: <FileStack className="w-4 h-4" />,
        href: '/cms/tienda/blog',
      },
      {
        label: 'Productos',
        icon: <Package className="w-4 h-4" />,
        href: '/cms/tienda/productos',
      },
      {
        label: 'Imágenes de la Tienda Web',
        icon: <ImageIcon className="w-4 h-4" />,
        href: '/cms/tienda/imagenes',
      },
      {
        label: 'Promociones',
        icon: <Megaphone className="w-4 h-4" />,
        href: '/cms/tienda/promociones',
      },
    ],
  },
  {
    label: 'Contenido del Sitio',
    icon: <Globe className="w-5 h-5" />,
    children: [
      {
        label: 'Medios de Pago y Promociones',
        icon: <Home className="w-4 h-4" />,
        href: '/cms/contenido/home',
      },
    ],
  },
  {
    label: 'Gestión de Usuarios',
    icon: <Users className="w-5 h-5" />,
    href: '/cms/usuarios',
    requiresUserManagement: true, // Oculto para vendedores
  },
  {
    label: 'Pedidos de Clientes',
    icon: <FileText className="w-5 h-5" />,
    children: [
      {
        label: 'Pendientes',
        icon: <ShoppingCart className="w-4 h-4" />,
        href: '/cms/pedidos/pendientes',
      },
      {
        label: 'Realizados',
        icon: <CheckCircle className="w-4 h-4" />,
        href: '/cms/pedidos/realizados',
      },
      {
        label: 'Rechazados',
        icon: <XCircle className="w-4 h-4" />,
        href: '/cms/pedidos/rechazados',
      },
    ],
  },
  {
    label: 'Ayuda',
    icon: <HelpCircle className="w-5 h-5" />,
    children: [
      {
        label: 'Sobre el CMS',
        icon: <BookOpen className="w-4 h-4" />,
        href: '/cms/ayuda/sobre',
      },
      {
        label: 'Funciones Útiles del CMS',
        icon: <Lightbulb className="w-4 h-4" />,
        href: '/cms/ayuda/funciones',
      },
      {
        label: 'Preguntas y Respuestas',
        icon: <MessageCircle className="w-4 h-4" />,
        href: '/cms/ayuda/preguntas',
      },
      {
        label: 'Características de las funciones del CMS',
        icon: <Sparkles className="w-4 h-4" />,
        href: '/cms/ayuda/caracteristicas',
      },
      {
        label: 'Realizar Tour por el CMS',
        icon: <Map className="w-4 h-4" />,
        href: '/cms/ayuda/tour',
      },
    ],
  },
];

interface CMSSidebarProps {
  className?: string;
}

export function CMSSidebar({ className }: CMSSidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed } = useCMSStore();
  const { user } = useAuthStore();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  // Filtrar items del sidebar según permisos del usuario
  const filteredSidebarItems = useMemo(() => {
    const userRole = user?.role || '';
    const canManageUsers = canAccessUserManagement(userRole);
    
    return sidebarItems.filter((item) => {
      // Si el item requiere permiso de gestión de usuarios y el usuario no lo tiene, ocultarlo
      if (item.requiresUserManagement && !canManageUsers) {
        return false;
      }
      return true;
    });
  }, [user?.role]);

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const renderItem = (item: SidebarItem, level = 0) => {
    const isExpanded = expandedItems.includes(item.label);
    const isActive = item.href && pathname === item.href;
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
      return (
        <div key={item.label} className="mb-1">
          <button
            onClick={() => toggleExpanded(item.label)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2.5 rounded-lg',
              'text-sm font-medium transition-colors',
              'text-purple-700 dark:text-white',
              'hover:bg-purple-100 dark:hover:bg-gray-800',
              level > 0 && 'pl-8'
            )}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              {!sidebarCollapsed && <span>{item.label}</span>}
            </div>
            {!sidebarCollapsed && (
              isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )
            )}
          </button>
          {isExpanded && !sidebarCollapsed && item.children && (
            <div className="mt-1 ml-4 space-y-1">
              {item.children.map((child) => renderItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.label}
        href={item.href || '#'}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg',
          'text-sm font-medium transition-colors',
          'hover:bg-purple-100 dark:hover:bg-gray-800',
          level > 0 && 'pl-8',
          isActive && 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
          !isActive && 'text-purple-700 dark:text-white'
        )}
      >
        {item.icon}
        {!sidebarCollapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <>
      {/* Overlay para móvil */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => useCMSStore.getState().toggleSidebar()}
        />
      )}
      
      <aside
        className={cn(
          'bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800',
          'transition-all duration-300 overflow-y-auto',
          'fixed lg:relative z-50 h-full',
          sidebarCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0 w-72',
          className
        )}
      >
        <div className="p-4 space-y-2">
          {filteredSidebarItems.map((item) => renderItem(item))}
        </div>
      </aside>
    </>
  );
}
