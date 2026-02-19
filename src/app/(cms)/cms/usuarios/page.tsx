'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Save,
  X,
  Eye,
  EyeOff,
  Info,
  AlertTriangle,
  Ban,
} from 'lucide-react';
import axios from '@/lib/axios';
import { logApiError, shouldSilenceError } from '@/lib/api';
import { CMSLayout } from '@/components/cms/CMSLayout';
import { withCMSProtection } from '@/components/cms/withCMSProtection';
import { cn } from '@/utils/format';
import { UsuarioDetalleModal } from './_components/UsuarioDetalleModal';
import { useAuthStore } from '@/store/authStore';
import {
  calculateUserActionPermissions,
  getAllowedRolesForCreation,
  getUserPermissionErrorMessage,
  ROLE_VENDEDOR,
} from '@/utils/user-permissions';

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  telefono: string | null;
  whatsapp: string | null;
  direccion: any;
  role: string;
  fechaRegistro: string;
  activo: boolean;
  suspendido: boolean;
  motivoSuspension: string | null;
  fechaSuspension: string | null;
  codigoCliente?: string;
}

const roles = [
  { value: 'CLIENTA', label: 'Cliente' },
  { value: 'VENDEDOR', label: 'Vendedor' },
  { value: 'ADMIN_CMS', label: 'Administrador' },
  { value: 'SUPER_SU', label: 'Super Usuario' },
];

function UsuariosPage() {
  // Obtener usuario autenticado
  const { user: currentUser } = useAuthStore();
  
  // Calcular roles permitidos para creación/edición
  const allowedRoles = useMemo(() => {
    if (!currentUser?.role) return [];
    return getAllowedRolesForCreation(currentUser.role);
  }, [currentUser?.role]);

  // Verificar si el usuario puede crear usuarios
  const canCreateUsers = useMemo(() => {
    if (!currentUser?.role) return false;
    return currentUser.role !== ROLE_VENDEDOR;
  }, [currentUser?.role]);
  
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('TODOS');
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Estados del formulario
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [guardando, setGuardando] = useState(false);
  
  // Modal de detalles
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [usuarioDetalle, setUsuarioDetalle] = useState<Usuario | null>(null);
  
  // Campos del formulario
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    fechaNacimiento: '',
    telefono: '',
    role: 'CLIENTA',
    direccion: {
      calle: '',
      numero: '',
      ciudad: '',
      provincia: '',
      codigoPostal: '',
    },
  });

  const [mostrarPassword, setMostrarPassword] = useState(false);

  useEffect(() => {
    cargarUsuarios();
  }, [busqueda, filtroRol, paginaActual]);

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      const response = await axios.get('/cms/usuarios', {
        params: {
          pagina: paginaActual,
          limite: 20,
          busqueda,
          rol: filtroRol,
        },
      });

      setUsuarios(response.data.usuarios);
      setTotalPaginas(response.data.paginacion.totalPaginas);
      setTotal(response.data.paginacion.total);
    } catch (error: any) {
      logApiError(error, 'cargarUsuarios');
      if (!shouldSilenceError(error)) {
        alert(error.response?.data?.error || 'Error al cargar usuarios');
      }
    } finally {
      setCargando(false);
    }
  };

  const abrirFormularioCrear = () => {
    setFormData({
      email: '',
      password: '',
      nombre: '',
      apellido: '',
      fechaNacimiento: '',
      telefono: '',
      role: 'CLIENTA',
      direccion: {
        calle: '',
        numero: '',
        ciudad: '',
        provincia: '',
        codigoPostal: '',
      },
    });
    setEditando(false);
    setUsuarioSeleccionado(null);
    setMostrarFormulario(true);
  };

  const abrirFormularioEditar = async (usuario: Usuario) => {
    try {
      const response = await axios.get(`/cms/usuarios/${usuario.id}`);
      const usuarioCompleto = response.data;
      
      setFormData({
        email: usuarioCompleto.email,
        password: '',
        nombre: usuarioCompleto.nombre,
        apellido: usuarioCompleto.apellido,
        fechaNacimiento: usuarioCompleto.fechaNacimiento.split('T')[0],
        telefono: usuarioCompleto.telefono || '',
        role: usuarioCompleto.role,
        direccion: usuarioCompleto.direccion || {
          calle: '',
          numero: '',
          ciudad: '',
          provincia: '',
          codigoPostal: '',
        },
      });
      
      setEditando(true);
      setUsuarioSeleccionado(usuario);
      setMostrarFormulario(true);
    } catch (error: any) {
      console.error('Error al cargar usuario:', error);
      alert(error.response?.data?.error || 'Error al cargar usuario');
    }
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setEditando(false);
    setUsuarioSeleccionado(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.nombre || !formData.apellido || !formData.fechaNacimiento) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    if (!editando && !formData.password) {
      alert('La contraseña es obligatoria para crear un nuevo usuario');
      return;
    }

    try {
      setGuardando(true);

      if (editando && usuarioSeleccionado) {
        // Actualizar usuario
        await axios.put(`/cms/usuarios/${usuarioSeleccionado.id}`, formData);
        alert('✅ Usuario actualizado correctamente');
      } else {
        // Crear usuario
        await axios.post('/cms/usuarios', formData);
        alert('✅ Usuario creado correctamente');
      }

      cerrarFormulario();
      cargarUsuarios();
    } catch (error: any) {
      console.error('Error al guardar usuario:', error);
      alert(error.response?.data?.error || 'Error al guardar usuario');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarUsuario = async (usuario: Usuario) => {
    // Verificar permisos en el cliente antes de intentar
    if (!currentUser) return;
    
    const permisos = calculateUserActionPermissions(
      currentUser.role || '',
      currentUser.id,
      usuario.role,
      usuario.id
    );
    
    if (!permisos.canDelete) {
      alert(`❌ ${permisos.deleteTooltip || 'No tiene permisos para eliminar este usuario'}`);
      return;
    }
    
    if (!confirm(`¿Estás seguro de eliminar al usuario ${usuario.nombre} ${usuario.apellido}?`)) {
      return;
    }

    try {
      await axios.delete(`/cms/usuarios/${usuario.id}`);
      alert('✅ Usuario eliminado correctamente');
      cargarUsuarios();
    } catch (error: any) {
      console.error('❌ Error al eliminar usuario:', error);
      
      // Usar mensaje de error amigable basado en el código de error
      const mensajeAmigable = getUserPermissionErrorMessage(error);
      alert(`❌ ${mensajeAmigable}`);
    }
  };



  const getRolLabel = (role: string) => {
    return roles.find(r => r.value === role)?.label || role;
  };

  const getRolColor = (role: string) => {
    switch (role) {
      case 'SUPER_SU':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'ADMIN_CMS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'VENDEDOR':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getEstadoLabel = (usuario: Usuario) => {
    if (usuario.suspendido) {
      return 'Suspendido';
    } else if (!usuario.activo) {
      return 'Inactivo';
    } else {
      return 'Activo';
    }
  };

  const getEstadoColor = (usuario: Usuario) => {
    if (usuario.suspendido) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    } else if (!usuario.activo) {
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    } else {
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    }
  };

  return (
    <CMSLayout>
      <div className="p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 md:gap-3">
              <Users className="w-6 h-6 md:w-8 md:h-8" />
              Gestión de Usuarios
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-2">
              Administra usuarios del CMS y de la tienda web
            </p>
          </div>
          {canCreateUsers ? (
            <button
              onClick={abrirFormularioCrear}
              className="flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm md:text-base whitespace-nowrap"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
              Nuevo Usuario
            </button>
          ) : (
            <button
              disabled
              className="flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed text-sm md:text-base whitespace-nowrap"
              title="No tiene permisos para crear usuarios"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
              Nuevo Usuario
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6 mb-4 md:mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPaginaActual(1);
                }}
                placeholder="Buscar por nombre o email..."
                className="w-full pl-9 md:pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white text-sm md:text-base"
              />
            </div>

            <select
              value={filtroRol}
              onChange={(e) => {
                setFiltroRol(e.target.value);
                setPaginaActual(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white text-sm md:text-base"
            >
              <option value="TODOS">Todos los roles</option>
              {roles.map((rol) => (
                <option key={rol.value} value={rol.value}>
                  {rol.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 text-xs md:text-sm text-gray-600 dark:text-gray-400">
            Total de usuarios: <span className="font-semibold">{total}</span>
          </div>
        </div>

        {/* Tabla de usuarios */}
        {cargando ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 md:p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-sm md:text-base text-gray-600 dark:text-gray-400">Cargando usuarios...</p>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 md:p-12 text-center">
            <Users className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">No se encontraron usuarios</p>
          </div>
        ) : (
          <>
            {/* Vista de tabla para desktop */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Fecha Registro
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {usuarios.map((usuario) => (
                      <tr key={usuario.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {usuario.nombre} {usuario.apellido}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {usuario.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded w-fit">
                            {usuario.codigoCliente || '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                            'px-2 py-1 text-xs font-semibold rounded-full',
                            getRolColor(usuario.role)
                          )}>
                            {getRolLabel(usuario.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                            'px-2 py-1 text-xs font-semibold rounded-full',
                            getEstadoColor(usuario)
                          )}>
                            {getEstadoLabel(usuario)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(usuario.fechaRegistro).toLocaleDateString('es-AR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {(() => {
                            // Calcular permisos para este usuario
                            const permisos = currentUser
                              ? calculateUserActionPermissions(
                                  currentUser.role || '',
                                  currentUser.id,
                                  usuario.role,
                                  usuario.id
                                )
                              : { canView: false, canEdit: false, canDelete: false, viewTooltip: 'Sin permisos', editTooltip: 'Sin permisos', deleteTooltip: 'Sin permisos', isTargetSuperuser: false };
                            
                            return (
                              <div className="flex items-center justify-end gap-2">
                                {/* Botón Ver Detalles */}
                                <button
                                  onClick={() => {
                                    if (!permisos.canView) {
                                      alert(permisos.viewTooltip || 'No tiene permisos para ver este usuario');
                                      return;
                                    }
                                    setUsuarioDetalle(usuario);
                                    setMostrarDetalles(true);
                                  }}
                                  disabled={!permisos.canView}
                                  className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    permisos.canView
                                      ? "text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                                      : "text-gray-400 cursor-not-allowed opacity-50"
                                  )}
                                  title={permisos.viewTooltip || "Ver detalles"}
                                >
                                  <Info className="w-4 h-4" />
                                </button>
                                
                                {/* Botón Editar */}
                                <button
                                  onClick={() => {
                                    if (!permisos.canEdit) {
                                      alert(permisos.editTooltip || 'No tiene permisos para editar este usuario');
                                      return;
                                    }
                                    abrirFormularioEditar(usuario);
                                  }}
                                  disabled={!permisos.canEdit}
                                  className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    permisos.canEdit
                                      ? "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                      : "text-gray-400 cursor-not-allowed opacity-50"
                                  )}
                                  title={permisos.editTooltip || "Editar usuario"}
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                
                                {/* Botón Eliminar */}
                                <button
                                  onClick={() => {
                                    if (!permisos.canDelete) {
                                      alert(permisos.deleteTooltip || 'No tiene permisos para eliminar este usuario');
                                      return;
                                    }
                                    eliminarUsuario(usuario);
                                  }}
                                  disabled={!permisos.canDelete}
                                  className={cn(
                                    "p-2 rounded-lg transition-colors relative group",
                                    permisos.canDelete
                                      ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                                      : "text-gray-400 cursor-not-allowed opacity-50"
                                  )}
                                  title={permisos.deleteTooltip || "Eliminar usuario"}
                                >
                                  {permisos.isTargetSuperuser && !permisos.canDelete ? (
                                    <Ban className="w-4 h-4" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                  {/* Tooltip para superuser */}
                                  {permisos.isTargetSuperuser && permisos.deleteTooltip && (
                                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                      {permisos.deleteTooltip}
                                    </span>
                                  )}
                                </button>
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vista de tarjetas para móvil */}
            <div className="md:hidden space-y-4">
              {usuarios.map((usuario) => (
                <div key={usuario.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        {usuario.nombre} {usuario.apellido}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{usuario.email}</p>
                      {usuario.codigoCliente && (
                        <p className="text-xs font-mono font-semibold text-purple-600 dark:text-purple-400 mt-1 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded w-fit">
                          {usuario.codigoCliente}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={cn(
                        'px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap',
                        getRolColor(usuario.role)
                      )}>
                        {getRolLabel(usuario.role)}
                      </span>
                      <span className={cn(
                        'px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap',
                        getEstadoColor(usuario)
                      )}>
                        {getEstadoLabel(usuario)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div className="col-span-2">
                      <span className="text-gray-500 dark:text-gray-400">Registro:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{new Date(usuario.fechaRegistro).toLocaleDateString('es-AR')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    {(() => {
                      // Calcular permisos para este usuario (vista móvil)
                      const permisos = currentUser
                        ? calculateUserActionPermissions(
                            currentUser.role || '',
                            currentUser.id,
                            usuario.role,
                            usuario.id
                          )
                        : { canView: false, canEdit: false, canDelete: false, viewTooltip: 'Sin permisos', editTooltip: 'Sin permisos', deleteTooltip: 'Sin permisos', isTargetSuperuser: false };
                      
                      return (
                        <>
                          {/* Botón Ver Detalles */}
                          <button
                            onClick={() => {
                              if (!permisos.canView) {
                                alert(permisos.viewTooltip || 'No tiene permisos para ver este usuario');
                                return;
                              }
                              setUsuarioDetalle(usuario);
                              setMostrarDetalles(true);
                            }}
                            disabled={!permisos.canView}
                            className={cn(
                              "flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs rounded-lg transition-colors",
                              permisos.canView
                                ? "text-purple-600 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50"
                                : "text-gray-400 bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-50"
                            )}
                            title={permisos.viewTooltip || "Ver detalles"}
                          >
                            <Info className="w-3.5 h-3.5" />
                            <span>Detalles</span>
                          </button>
                          
                          {/* Botón Editar */}
                          <button
                            onClick={() => {
                              if (!permisos.canEdit) {
                                alert(permisos.editTooltip || 'No tiene permisos para editar este usuario');
                                return;
                              }
                              abrirFormularioEditar(usuario);
                            }}
                            disabled={!permisos.canEdit}
                            className={cn(
                              "p-2 rounded-lg transition-colors",
                              permisos.canEdit
                                ? "text-blue-600 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                                : "text-gray-400 bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-50"
                            )}
                            title={permisos.editTooltip || "Editar usuario"}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          
                          {/* Botón Eliminar */}
                          <button
                            onClick={() => {
                              if (!permisos.canDelete) {
                                alert(permisos.deleteTooltip || 'No tiene permisos para eliminar este usuario');
                                return;
                              }
                              eliminarUsuario(usuario);
                            }}
                            disabled={!permisos.canDelete}
                            className={cn(
                              "p-2 rounded-lg transition-colors",
                              permisos.canDelete
                                ? "text-red-600 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50"
                                : "text-gray-400 bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-50"
                            )}
                            title={permisos.deleteTooltip || "Eliminar usuario"}
                          >
                            {permisos.isTargetSuperuser && !permisos.canDelete ? (
                              <Ban className="w-3.5 h-3.5" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 md:mt-6">
                <button
                  onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                  disabled={paginaActual === 1}
                  className="px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="px-3 md:px-4 py-2 text-sm md:text-base text-gray-700 dark:text-gray-300">
                  Página {paginaActual} de {totalPaginas}
                </span>
                <button
                  onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}

        {/* Modal de detalles */}
        {mostrarDetalles && (
          <UsuarioDetalleModal
            usuario={usuarioDetalle}
            onClose={() => {
              setMostrarDetalles(false);
              setUsuarioDetalle(null);
            }}
            onActualizar={() => {
              cargarUsuarios();
            }}
          />
        )}

        {/* Modal de formulario */}
        {mostrarFormulario && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full my-8">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {editando ? 'Editar Usuario' : 'Nuevo Usuario'}
                  </h2>
                  <button
                    onClick={cerrarFormulario}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* Información Básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.apellido}
                      onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fecha de Nacimiento *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.fechaNacimiento}
                      onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contraseña {editando ? '(dejar vacío para no cambiar)' : '*'}
                    </label>
                    <div className="relative">
                      <input
                        type={mostrarPassword ? 'text' : 'password'}
                        required={!editando}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarPassword(!mostrarPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {mostrarPassword ? (
                          <EyeOff className="w-5 h-5 text-gray-400" />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rol *
                    </label>
                    <select
                      required
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                    >
                      {roles
                        .filter((rol) => allowedRoles.includes(rol.value))
                        .map((rol) => (
                          <option key={rol.value} value={rol.value}>
                            {rol.label}
                          </option>
                        ))}
                    </select>
                    {!allowedRoles.includes('SUPER_SU') && currentUser?.role !== 'SUPER_SU' && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Solo los Superusers pueden crear cuentas con rol Superuser.
                      </p>
                    )}
                  </div>
                </div>

                {/* Dirección */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Dirección
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Calle
                      </label>
                      <input
                        type="text"
                        value={formData.direccion.calle}
                        onChange={(e) => setFormData({
                          ...formData,
                          direccion: { ...formData.direccion, calle: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Número
                      </label>
                      <input
                        type="text"
                        value={formData.direccion.numero}
                        onChange={(e) => setFormData({
                          ...formData,
                          direccion: { ...formData.direccion, numero: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ciudad
                      </label>
                      <input
                        type="text"
                        value={formData.direccion.ciudad}
                        onChange={(e) => setFormData({
                          ...formData,
                          direccion: { ...formData.direccion, ciudad: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Provincia
                      </label>
                      <input
                        type="text"
                        value={formData.direccion.provincia}
                        onChange={(e) => setFormData({
                          ...formData,
                          direccion: { ...formData.direccion, provincia: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Código Postal
                      </label>
                      <input
                        type="text"
                        value={formData.direccion.codigoPostal}
                        onChange={(e) => setFormData({
                          ...formData,
                          direccion: { ...formData.direccion, codigoPostal: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={cerrarFormulario}
                    className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    {guardando ? 'Guardando...' : editando ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </CMSLayout>
  );
}

export default withCMSProtection(UsuariosPage);
