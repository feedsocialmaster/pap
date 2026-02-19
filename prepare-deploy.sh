#!/usr/bin/env bash
# =============================================================================
# prepare-deploy.sh — Paso a Paso Shoes
# Script de despliegue para VPS KVM 2 (Hostinger / Debian/Ubuntu)
# Uso: chmod +x prepare-deploy.sh && sudo ./prepare-deploy.sh
# =============================================================================
set -euo pipefail

APP_DIR="/var/www/pasoapaso"
APP_NAME="pasoapaso-web"
API_NAME="pasoapaso-api"
NODE_VERSION="20"

echo "============================================================"
echo "  PASO A PASO SHOES — Deploy Script"
echo "  Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================================"

# ── 1. PREREQUISITOS ────────────────────────────────────────────────────────
echo ""
echo "[ 1/8 ] Verificando prerequisitos..."

if ! command -v node &> /dev/null; then
    echo "  Node.js no encontrado. Instalando Node.js ${NODE_VERSION}..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "  Node.js $(node --version) encontrado."
fi

if ! command -v pm2 &> /dev/null; then
    echo "  PM2 no encontrado. Instalando pm2..."
    sudo npm install -g pm2
else
    echo "  PM2 $(pm2 --version) encontrado."
fi

if ! command -v psql &> /dev/null; then
    echo "  ADVERTENCIA: psql no encontrado. Asegúrate de tener PostgreSQL instalado."
fi

# ── 2. CREAR DIRECTORIO DE APP ───────────────────────────────────────────────
echo ""
echo "[ 2/8 ] Preparando directorio en ${APP_DIR}..."
sudo mkdir -p "${APP_DIR}"
sudo chown -R "$USER":"$USER" "${APP_DIR}"

echo "  Copiando archivos al directorio de producción..."
rsync -av --exclude='.git' --exclude='node_modules' --exclude='server/node_modules' \
    --exclude='.next' --exclude='deploy.zip' \
    "$(dirname "$0")/" "${APP_DIR}/"

# ── 3. ARCHIVOS DE ENTORNO ───────────────────────────────────────────────────
echo ""
echo "[ 3/8 ] Verificando archivos de entorno..."

if [ ! -f "${APP_DIR}/.env.local" ]; then
    echo "  ⚠  ATENCIÓN: ${APP_DIR}/.env.local NO existe."
    echo "     Consulta ENV_NOTICE.txt y crea el archivo antes de continuar."
    echo "     Presiona ENTER cuando esté listo, o Ctrl+C para cancelar."
    read -r
fi

if [ ! -f "${APP_DIR}/server/.env" ]; then
    echo "  ⚠  ATENCIÓN: ${APP_DIR}/server/.env NO existe."
    echo "     Consulta ENV_NOTICE.txt y crea el archivo antes de continuar."
    echo "     Presiona ENTER cuando esté listo, o Ctrl+C para cancelar."
    read -r
fi

echo "  Archivos de entorno OK."

# ── 4. DEPENDENCIAS FRONTEND (Next.js) ──────────────────────────────────────
echo ""
echo "[ 4/8 ] Instalando dependencias del frontend..."
cd "${APP_DIR}"
npm ci --omit=dev
echo "  Frontend deps OK."

# ── 5. BUILD FRONTEND ────────────────────────────────────────────────────────
echo ""
echo "[ 5/8 ] Construyendo frontend Next.js..."
npm run build
echo "  Build del frontend OK."

# ── 6. DEPENDENCIAS + BUILD BACKEND ─────────────────────────────────────────
echo ""
echo "[ 6/8 ] Instalando dependencias y compilando backend..."
cd "${APP_DIR}/server"
npm ci --omit=dev
npm run build
echo "  Backend build OK."

# ── 7. PRISMA: GENERAR CLIENTE + MIGRACIONES ────────────────────────────────
echo ""
echo "[ 7/8 ] Ejecutando migraciones Prisma..."
cd "${APP_DIR}/server"
npx prisma generate
npx prisma migrate deploy
echo "  Migraciones aplicadas."

# Optional: seed inicial (comentado por seguridad — descomentar solo en primera instalación)
# npx tsx prisma/seed.ts

# ── 8. PM2: INICIAR / RECARGAR PROCESOS ────────────────────────────────────
echo ""
echo "[ 8/8 ] Iniciando procesos con PM2..."
cd "${APP_DIR}"

# Si ya existen los procesos, hacer reload; si no, iniciar desde ecosystem
if pm2 describe "${API_NAME}" > /dev/null 2>&1; then
    pm2 reload "${API_NAME}"
else
    pm2 start ecosystem.config.cjs
fi

if pm2 describe "${APP_NAME}" > /dev/null 2>&1; then
    pm2 reload "${APP_NAME}"
else
    pm2 start npm --name "${APP_NAME}" -- start
fi

# Guardar configuración de PM2 para autostart
pm2 save
sudo pm2 startup systemd -u "$USER" --hp "$HOME" 2>/dev/null || true

echo ""
echo "============================================================"
echo "  ✓ Deploy completado con éxito."
echo "  Frontend : http://localhost:3000"
echo "  Backend  : http://localhost:3001"
echo ""
echo "  Próximos pasos:"
echo "  1. Configura Nginx como reverse proxy (ver README_DEPLOY.md)"
echo "  2. Instala certificado SSL con certbot"
echo "  3. Verifica pm2 status && pm2 logs"
echo "============================================================"
