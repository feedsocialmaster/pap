# README_DEPLOY.md — Paso a Paso Shoes
## Guía de Despliegue en VPS KVM 2 (Hostinger)

---

## Arquitectura

```
Internet → Nginx (80/443) → Next.js :3000 (frontend)
                          → Express API :3001 (backend, /api/*)
                          → PostgreSQL :5432 (base de datos)
```

---

## Requisitos previos del VPS

| Componente   | Versión mínima |
|-------------|----------------|
| Ubuntu/Debian | 22.04 LTS     |
| Node.js      | 20.x LTS       |
| PostgreSQL   | 15+            |
| PM2          | última         |
| Nginx        | 1.24+          |
| Certbot      | última         |

---

## Pasos de despliegue

### 1. Conectar al VPS

```bash
ssh root@IP_DEL_VPS
# (o usuario sudo)
```

### 2. Instalar Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version   # debe mostrar v20.x
```

### 3. Instalar PostgreSQL

```bash
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl enable postgresql --now

# Crear usuario y base de datos
sudo -u postgres psql -c "CREATE USER pasoapaso WITH PASSWORD 'TU_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE pasoapaso OWNER pasoapaso;"
```

### 4. Instalar PM2

```bash
sudo npm install -g pm2
```

### 5. Subir el paquete y extraer

```bash
# Desde tu máquina local:
scp deploy.zip root@IP_DEL_VPS:/var/www/

# En el VPS:
cd /var/www
unzip deploy.zip -d pasoapaso
cd pasoapaso
```

### 6. Configurar variables de entorno

```bash
# Lee ENV_NOTICE.txt y crea los dos archivos:
nano .env.local          # frontend Next.js
nano server/.env         # backend Express

chmod 600 .env.local server/.env
```

### 7. Ejecutar script de deploy

```bash
chmod +x prepare-deploy.sh
./prepare-deploy.sh
```

O hacerlo manualmente paso a paso:

```bash
# Frontend
npm ci --omit=dev
npm run build

# Backend
cd server
npm ci --omit=dev
npm run build
npx prisma generate
npx prisma migrate deploy
cd ..

# Iniciar con PM2
pm2 start ecosystem.config.cjs
pm2 start npm --name "pasoapaso-web" -- start
pm2 save
pm2 startup
```

### 8. Configurar Nginx (reverse proxy)

```bash
sudo nano /etc/nginx/sites-available/pasoapaso
```

Contenido del vhost Nginx:

```nginx
server {
    listen 80;
    server_name TU_DOMINIO www.TU_DOMINIO;

    # Redirige /api/* al backend Express
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Redirige todo lo demás al frontend Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # Subidas de imágenes / archivos estáticos del backend
    location /uploads/ {
        alias /var/www/pasoapaso/server/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    client_max_body_size 20M;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/pasoapaso /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 9. SSL con Certbot (Let's Encrypt)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d TU_DOMINIO -d www.TU_DOMINIO
# Certbot modifica nginx automáticamente para HTTPS
sudo systemctl reload nginx
```

### 10. Verificar estado

```bash
pm2 status
pm2 logs --lines 50

# Probar endpoints
curl http://localhost:3001/health         # backend
curl http://localhost:3000                # frontend
curl https://TU_DOMINIO                   # nginx + SSL
```

---

## Comprobaciones de salud (Health Checks)

| Check | Comando |
|-------|---------|
| PM2 procesos activos | `pm2 status` |
| Puertos escuchando | `ss -tlnp \| grep -E '3000\|3001\|80\|443'` |
| Nginx OK | `sudo nginx -t` |
| PostgreSQL activo | `sudo systemctl status postgresql` |
| SSL válido | `curl -I https://TU_DOMINIO` |
| Logs de error | `pm2 logs pasoapaso-api --err --lines 100` |
| Espacio en disco | `df -h /var/www` |

---

## Rollback

```bash
# Detener procesos
pm2 stop all

# Restaurar versión anterior (si tienes backup)
cd /var/www
mv pasoapaso pasoapaso_broken
mv pasoapaso_backup pasoapaso

# Reiniciar
cd /var/www/pasoapaso
pm2 start ecosystem.config.cjs
pm2 start npm --name "pasoapaso-web" -- start
```

---

## Mantenimiento

```bash
# Ver logs en tiempo real
pm2 logs

# Reiniciar app sin downtime
pm2 reload pasoapaso-api
pm2 reload pasoapaso-web

# Actualizar con nuevo deploy
./prepare-deploy.sh
```

---

*Generado: 2026-02-18 | App: paso-a-paso-shoes v0.1.0*
