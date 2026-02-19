# INVENTORY_DEPLOY.md — Paso a Paso Shoes
## Inventario de archivos incluidos en deploy/
**Generado:** 2026-02-18 (rev. 2) | **Total de archivos:** 505

---

## Estructura y propósito de cada grupo

### Archivos raíz del proyecto

| Archivo | Propósito |
|---------|-----------|
| `package.json` | Dependencias y scripts del frontend Next.js |
| `package-lock.json` | Lockfile de npm para instalación determinista |
| `next.config.ts` | Configuración de Next.js (rewrites, headers, etc.) |
| `tsconfig.json` | Configuración TypeScript del frontend |
| `postcss.config.mjs` | Configuración de PostCSS para Tailwind CSS |
| `tailwind.config.ts` | Configuración de Tailwind CSS (colores, fuentes, etc.) |
| `middleware.ts` | Middleware de Next.js (auth guards, redirects) |
| `ecosystem.config.cjs` | Configuración de PM2 para gestionar procesos en producción |
| `next-env.d.ts` | Tipos de entorno auto-generados por Next.js |

### Archivos generados por este deploy

| Archivo | Propósito |
|---------|-----------|
| `ENV_NOTICE.txt` | Instrucciones para crear `.env.local` y `server/.env` en el VPS |
| `prepare-deploy.sh` | Script ejecutable para instalar deps, compilar y arrancar con PM2 |
| `README_DEPLOY.md` | Guía completa de despliegue, nginx, SSL y mantenimiento |
| `INVENTORY_DEPLOY.md` | Este archivo — inventario del deploy |

---

### `public/` — Assets públicos estáticos (8 archivos)

| Ruta | Propósito |
|------|-----------|
| `public/manifest.json` | Web App Manifest para PWA |
| `public/icon-192x192.png` | Icono PWA 192px |
| `public/icon-512x512.png` | Icono PWA 512px |
| `public/file.svg` | Icono SVG genérico |
| `public/globe.svg` | Icono SVG globo |
| `public/next.svg` | Logo Next.js |
| `public/vercel.svg` | Logo Vercel |
| `public/window.svg` | Icono SVG ventana |
| `public/clear-cart.html` | Página utilitaria para limpiar carrito (debug) |

---

### `src/` — Código fuente del frontend Next.js

| Subdirectorio | Propósito |
|--------------|-----------|
| `src/app/` | App Router de Next.js: páginas, layouts, rutas de API internas |
| `src/components/` | Componentes React reutilizables (UI, formularios, etc.) |
| `src/hooks/` | Custom hooks de React (useCart, useAuth, etc.) |
| `src/lib/` | Librerías internas (clientes HTTP, utilidades de auth) |
| `src/store/` | Estado global con Zustand (carrito, usuario, etc.) |
| `src/types/` | Definiciones TypeScript compartidas |
| `src/utils/` | Funciones utilitarias (formateo, validación, etc.) |

---

### `server/` — Backend Express + CMS

| Subdirectorio / Archivo | Propósito |
|------------------------|-----------|
| `server/package.json` | Dependencias del backend Express |
| `server/package-lock.json` | Lockfile npm del backend para instalación determinista |
| `server/tsconfig.json` | Configuración TypeScript del backend |
| `server/.env.example` | Plantilla de variables de entorno del backend (sin credenciales) |
| `server/dist/` | **Backend compilado** — 86 archivos JS listos para ejecutar con PM2 |
| `server/src/` | Código fuente TypeScript del backend (para recompilar si es necesario) |
| `server/src/server.ts` | Punto de entrada del servidor Express |
| `server/src/routes/` | Definición de rutas de la API REST |
| `server/src/controllers/` | Lógica de negocio por recurso |
| `server/src/services/` | Servicios (pagos, email, etc.) |
| `server/src/middleware/` | Middlewares (auth, error handling) |
| `server/src/cms/` | Módulo CMS (gestión de contenido) |
| `server/src/lib/` | Clientes externos (Prisma, MercadoPago) |
| `server/src/config/` | Configuración del servidor |
| `server/src/types/` | Tipos TypeScript del backend |
| `server/src/utils/` | Utilidades del backend |

#### Prisma (ORM + Migraciones)

| Ruta | Propósito |
|------|-----------|
| `server/prisma/schema.prisma` | Schema de la base de datos (modelos, relaciones) |
| `server/prisma/migrations/` | 22 migraciones SQL aplicadas en orden por `prisma migrate deploy` |
| `server/prisma/seed.ts` | Seed inicial de datos (superusuario, categorías base) |

#### Scripts de producción

| Ruta | Propósito |
|------|-----------|
| `server/scripts/asignar-promocion-producto.ts` | Asignar promociones a productos |
| `server/scripts/assign-default-category.ts` | Asignar categoría por defecto a productos sin categoría |
| `server/scripts/create-custom-user.ts` | Crear usuarios custom desde CLI |

#### SQL de base de datos

| Ruta | Propósito |
|------|-----------|
| `server/sql/setup-db.sql` | Script de configuración inicial de la base de datos |
| `server/sql/add-codigo-compra.sql` | Migración manual: campo código de compra |
| `server/sql/update-passwords.sql` | Utilidad para actualizar hashes de contraseñas |
| `server/sql/verify-cms-users.sql` | Verificación de usuarios CMS en la DB |

---

## Archivos EXCLUIDOS del deploy

| Patrón / Archivo | Motivo de exclusión |
|-----------------|---------------------|
| `.git/` | Metadatos del repositorio — nunca en producción |
| `.vscode/` | Configuración del editor |
| `node_modules/` (raíz y server) | Instaladas en VPS con `npm ci` |
| `.next/` | Build artifacts — se regeneran con `npm run build` |
| `server/dist/` | Incluido en deploy — 86 archivos JS compilados listos para PM2 |
| `cypress/` | Tests E2E — no necesarios en producción |
| `docs/` | Documentación interna |
| `scripts/` (raíz) | Scripts de diagnóstico y setup local |
| `Instrucciones para Deploy*/` | Documentación del proceso |
| `.env.local` | ⚠️ CREDENCIALES REALES del frontend |
| `server/.env` | ⚠️ CREDENCIALES REALES del backend |
| `*.log` | Logs locales |
| `*.ps1` en raíz | Scripts PowerShell de diagnóstico |
| `test-*.js`, `check-*.js` | Scripts de testing/diagnóstico |
| `INFORME-*.json`, `removal-report.json` | Informes de desarrollo |
| `server/vitest.config.ts` | Configuración de tests |
| Seeds demo (`seed-*-demo.ts`, `delete-*.ts`) | Datos de demo — no para producción |

---

## Advertencias de seguridad

> ⚠️ **ARCHIVOS CON POSIBLES SECRETOS DETECTADOS Y EXCLUIDOS:**
>
> - `.env.local` — contiene `NEXT_PUBLIC_API_URL` y posibles tokens
> - `server/.env` — contiene `DATABASE_URL`, `JWT_SECRET`, `MP_ACCESS_TOKEN`, credenciales SMTP
>
> **Ninguno de estos archivos está incluido en deploy/.**
> Consulta `ENV_NOTICE.txt` para la plantilla de variables de entorno.

---

## Comandos post-deploy obligatorios

```bash
# En el VPS, dentro de /var/www/pasoapaso:
cd server
npx prisma generate          # regenerar cliente Prisma
npx prisma migrate deploy    # aplicar 22 migraciones
cd ..
npm run build                # compilar frontend
pm2 start ecosystem.config.cjs
pm2 start npm --name "pasoapaso-web" -- start
pm2 save
```
