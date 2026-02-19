"use client";
import React, { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import { apiBaseUrl } from '@/lib/api';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';

export default function DevPanel() {
  const { isAuthenticated, user } = useAuthStore();
  const [users, setUsers] = useState<Array<{id:string; email:string; role:string}>>([]);
  const [apiHealth, setApiHealth] = useState<string | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  type StatusVM = { ok: boolean; version?: string; db?: 'up'|'down'; error?: string } | null;
  const [statusInfo, setStatusInfo] = useState<StatusVM>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    async function load() {
      if (!isAuthenticated) return;
      const res = await axios.get('/users');
      setUsers(res.data.data || []);
    }
    load();
  }, [isAuthenticated]);

  const checkHealth = async () => {
    try {
      setCheckingHealth(true);
      setApiHealth(null);
      const res = await axios.get('/health');
      setApiHealth(`OK: ${JSON.stringify(res.data)}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Fallo al conectar';
      setApiHealth(`ERROR: ${msg}`);
    } finally {
      setCheckingHealth(false);
    }
  };

  const checkStatus = async () => {
    try {
      setCheckingStatus(true);
      setStatusInfo(null);
      const res = await axios.get('/status');
      setStatusInfo(res.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Fallo al conectar';
      setStatusInfo({ ok: false, error: msg });
    } finally {
      setCheckingStatus(false);
    }
  };

  if (!isAuthenticated || user?.role !== 'DESARROLLADOR') {
    return (
      <div className="container-custom py-16 text-center">
        <h1 className="text-2xl font-bold text-dark mb-4">Acceso restringido</h1>
        <p className="text-gray">Este panel es exclusivo para el desarrollador.</p>
      </div>
    );
  }

  return (
    <div className="container-custom py-10">
      <h1 className="text-3xl font-bold mb-6">Panel del Desarrollador</h1>

      {/* Herramientas rápidas */}
      <section className="bg-gray-light p-5 rounded-xl mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Herramientas rápidas</h2>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <Button onClick={checkHealth} disabled={checkingHealth}>
            {checkingHealth ? 'Verificando API…' : 'Probar /health'}
          </Button>
          {apiHealth && (
            <span className={`text-sm ${apiHealth.startsWith('OK') ? 'text-green-600' : 'text-red-600'}`}>{apiHealth}</span>
          )}
          <Button onClick={checkStatus} variant="secondary" disabled={checkingStatus}>
            {checkingStatus ? 'Consultando /status…' : 'Probar /status'}
          </Button>
          {statusInfo && (
            <span className={`text-sm ${statusInfo.ok ? 'text-green-600' : 'text-red-600'}`}>
              {statusInfo.ok ? `v${statusInfo.version} · DB: ${statusInfo.db}` : `ERROR: ${statusInfo.error}`}
            </span>
          )}
        </div>
      </section>

      {/* Variables públicas seguras */}
      <section className="bg-gray-light p-5 rounded-xl mb-8 space-y-2">
        <h2 className="text-xl font-semibold">Entorno (seguro)</h2>
        <p className="text-sm text-gray">Sólo se muestran variables públicas (NEXT_PUBLIC_*).</p>
        <ul className="list-disc pl-6 text-sm">
          <li>NODE_ENV: {process.env.NODE_ENV}</li>
          <li>NEXT_PUBLIC_API_URL: {process.env.NEXT_PUBLIC_API_URL || apiBaseUrl}</li>
        </ul>
      </section>

      <section className="bg-gray-light p-5 rounded-xl mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Usuarios</h2>
        </div>
        <ul className="divide-y">
          {users.map((u) => (
            <li key={u.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{u.email}</p>
                <p className="text-sm text-gray">Rol: {u.role}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => alert('Cambiar rol de ' + u.email)}>Cambiar rol</Button>
                <Button variant="outline" onClick={() => alert('Eliminar ' + u.email)}>Eliminar</Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-gray-light p-5 rounded-xl">
        <h2 className="text-xl font-semibold mb-4">Métricas y Logs</h2>
        <p className="text-gray">Próximamente: ver errores, logs y métricas básicas.</p>
      </section>
    </div>
  );
}
