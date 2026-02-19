import { createServer } from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { initSentry } from './sentry.js';
import { initializePaymentAdapters } from './services/payment-gateway/index.js';
import { initializeWebSocket } from './services/websocket.service.js';

const port = env.PORT;

initSentry();

// Inicializar adaptadores de pasarelas de pago
initializePaymentAdapters();
console.log('✅ Payment gateway adapters initialized');

const server = createServer(app);

// Inicializar WebSocket
initializeWebSocket(server);
console.log('✅ WebSocket initialized');

// Manejadores de errores globales para evitar que el servidor se cierre inesperadamente
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // En producción, podrías querer registrar esto en un servicio de logging
  // pero NO cerrar el servidor inmediatamente
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  // En producción, podrías querer registrar esto en un servicio de logging
});

// Manejo de señales de terminación para shutdown graceful
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\\n⚠️ SIGINT recibido (Ctrl+C), cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`API listening on http://localhost:${port}/api`);
  console.log(`Accesible desde red local en http://192.168.100.80:${port}/api`);
});
