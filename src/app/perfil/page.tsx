'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Lock, Edit2, Check, X, Phone, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { withClientAuth } from '@/components/auth/withClientAuth';
import { formatPrice, formatDateTime } from '@/utils/format';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import axios from '@/lib/axios';

function PerfilContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, updateUser, logout, syncUserProfile } = useAuthStore();
  
  const [tabActiva, setTabActiva] = useState(searchParams.get('tab') || 'perfil');
  const [editandoTelefono, setEditandoTelefono] = useState(false);
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [guardandoTelefono, setGuardandoTelefono] = useState(false);
  const [cambiarPassword, setCambiarPassword] = useState({
    actual: '',
    nueva: '',
    confirmar: '',
  });
  const [mostrarPassword, setMostrarPassword] = useState({
    actual: false,
    nueva: false,
    confirmar: false,
  });

  // Sincronizar datos del perfil al cargar la página
  useEffect(() => {
    if (isAuthenticated) {
      syncUserProfile();
    }
  }, [isAuthenticated, syncUserProfile]);

  if (!user) {
    return null;
  }

  const tabs = [
    { id: 'perfil', label: 'Mi Perfil', icon: User },
    { id: 'seguridad', label: 'Seguridad', icon: Lock },
  ];

  const handleEditarTelefono = () => {
    setNuevoTelefono(user.telefono || '');
    setEditandoTelefono(true);
  };

  const handleGuardarTelefono = async () => {
    setGuardandoTelefono(true);
    try {
      const response = await axios.patch(`/users/${user.id}/telefono`, {
        telefono: nuevoTelefono,
      });

      if (response.data) {
        updateUser({ telefono: response.data.telefono });
        setEditandoTelefono(false);
        alert('Teléfono actualizado correctamente');
      }
    } catch (error: any) {
      console.error('Error al actualizar teléfono:', error);
      alert(error.response?.data?.error || 'Error al actualizar teléfono');
    } finally {
      setGuardandoTelefono(false);
    }
  };

  const handleCancelarTelefono = () => {
    setNuevoTelefono('');
    setEditandoTelefono(false);
  };

  const handleCambiarPassword = async () => {
    if (!cambiarPassword.actual) {
      alert('Por favor ingresa tu contraseña actual');
      return;
    }

    if (!cambiarPassword.nueva) {
      alert('Por favor ingresa tu nueva contraseña');
      return;
    }

    if (cambiarPassword.nueva.length < 6) {
      alert('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    if (cambiarPassword.nueva !== cambiarPassword.confirmar) {
      alert('Las contraseñas no coinciden');
      return;
    }

    try {
      const response = await axios.post(`/users/${user.id}/change-password`, {
        currentPassword: cambiarPassword.actual,
        newPassword: cambiarPassword.nueva,
      });

      if (response.data.success) {
        alert('Contraseña actualizada correctamente. Se ha enviado un email de confirmación.');
        
        // Limpiar campos
        setCambiarPassword({ actual: '', nueva: '', confirmar: '' });
        
        // No cerrar sesión - el usuario continúa navegando con su sesión activa
      }
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);
      alert(error.response?.data?.error || 'Error al cambiar contraseña');
    }
  };

  const handleLogout = () => {
    logout();
    // Redirigir a homepage con refresh
    window.location.href = '/';
  };

  return (
    <div className="container-custom pt-32 pb-8">
      {/* Header */}
      <div className="mb-8 mt-16">
        <h1 className="text-3xl font-bold text-dark mb-2">Mi Cuenta</h1>
        <p className="text-gray">
          Bienvenida, {user.nombre} {user.apellido}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: Navegación de Tabs */}
        <aside className="lg:col-span-1">
          <div className="card p-4 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTabActiva(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    tabActiva === tab.id
                      ? 'bg-primary text-white'
                      : 'hover:bg-gray-light text-gray'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}

            <hr className="my-4" />

            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 text-error hover:bg-error/10 rounded-lg transition-colors font-medium text-left"
            >
              Cerrar Sesión
            </button>
          </div>
        </aside>

        {/* Contenido Principal */}
        <main className="lg:col-span-3">
          {/* TAB: MI PERFIL */}
          {tabActiva === 'perfil' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="text-xl font-bold text-dark mb-6">Información Personal</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray mb-1">Nombre</label>
                    <p className="text-dark font-medium">{user.nombre}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray mb-1">Apellido</label>
                    <p className="text-dark font-medium">{user.apellido}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray mb-1">Fecha de Nacimiento</label>
                    <p className="text-dark font-medium">
                      {new Date(user.fechaNacimiento).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray">Teléfono Celular</label>
                      {!editandoTelefono && (
                        <button
                          onClick={handleEditarTelefono}
                          className="text-primary hover:text-primary-dark flex items-center gap-1 text-sm"
                        >
                          <Edit2 size={14} />
                          Editar
                        </button>
                      )}
                    </div>
                    {editandoTelefono ? (
                      <div className="space-y-2">
                        <Input
                          type="tel"
                          value={nuevoTelefono}
                          onChange={(e) => setNuevoTelefono(e.target.value)}
                          placeholder="+54 9 11 1234-5678"
                          icon={<Phone size={20} />}
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleGuardarTelefono}
                            disabled={guardandoTelefono}
                            size="sm"
                          >
                            <Check size={16} />
                            {guardandoTelefono ? 'Guardando...' : 'Guardar'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleCancelarTelefono}
                            disabled={guardandoTelefono}
                            size="sm"
                          >
                            <X size={16} />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-dark font-medium">
                        {user.telefono || 'No registrado'}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray mb-1">Email</label>
                    <p className="text-dark font-medium">{user.email}</p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-light rounded-lg">
                  <p className="text-sm text-gray">
                    <strong>Nota:</strong> Los datos personales no pueden ser modificados. Podés editar tu Teléfono Celular usando el botón de editar.
                  </p>
                </div>
              </div>
            </div>
          )}



          {/* TAB: SEGURIDAD */}
          {tabActiva === 'seguridad' && (
            <div className="card p-6">
              <h2 className="text-xl font-bold text-dark mb-6">Cambiar Contraseña</h2>
              
              <div className="space-y-4 max-w-md">
                <div className="relative">
                  <Input
                    label="Contraseña Actual"
                    type={mostrarPassword.actual ? "text" : "password"}
                    value={cambiarPassword.actual}
                    onChange={(e) => setCambiarPassword({ ...cambiarPassword, actual: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword({ ...mostrarPassword, actual: !mostrarPassword.actual })}
                    className="absolute right-3 top-[2.875rem] text-gray hover:text-dark transition-colors"
                    aria-label={mostrarPassword.actual ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {mostrarPassword.actual ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                
                <div className="relative">
                  <Input
                    label="Nueva Contraseña"
                    type={mostrarPassword.nueva ? "text" : "password"}
                    value={cambiarPassword.nueva}
                    onChange={(e) => setCambiarPassword({ ...cambiarPassword, nueva: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword({ ...mostrarPassword, nueva: !mostrarPassword.nueva })}
                    className="absolute right-3 top-[2.875rem] text-gray hover:text-dark transition-colors"
                    aria-label={mostrarPassword.nueva ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {mostrarPassword.nueva ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                
                <div className="relative">
                  <Input
                    label="Confirmar Nueva Contraseña"
                    type={mostrarPassword.confirmar ? "text" : "password"}
                    value={cambiarPassword.confirmar}
                    onChange={(e) => setCambiarPassword({ ...cambiarPassword, confirmar: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword({ ...mostrarPassword, confirmar: !mostrarPassword.confirmar })}
                    className="absolute right-3 top-[2.875rem] text-gray hover:text-dark transition-colors"
                    aria-label={mostrarPassword.confirmar ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {mostrarPassword.confirmar ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <Button onClick={handleCambiarPassword}>
                  Cambiar Contraseña
                </Button>

                <div className="bg-primary/10 p-4 rounded-lg text-sm">
                  <p className="text-dark">
                    <strong>Nota:</strong> Por razones de seguridad, solo puedes cambiar tu contraseña una vez al mes. Recibirás un email de confirmación con los detalles del cambio de contraseña. Si necesitas cambiarla antes del plazo, contactanos y te la enviaremos por correo electrónico a tu casilla de correo registrada en la tienda web.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default withClientAuth(function PerfilPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando perfil...</div>}>
      <PerfilContent />
    </Suspense>
  );
});
