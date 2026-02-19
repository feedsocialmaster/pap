/**
 * Utilidades para exportar pedidos a CSV y PDF
 */

import { Order } from '@/store/realtimeStore';
import { formatPrice } from '@/utils/format';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Exporta un pedido individual a CSV
 */
export function exportOrderToCSV(order: Order): void {
  const headers = [
    'Número Pedido',
    'Fecha',
    'Cliente',
    'Email',
    'Teléfono Celular',
    'Producto',
    'Product ID',
    'Talle',
    'Color',
    'Cantidad',
    'Precio Original',
    'Precio Unitario',
    'Descuento',
    'Promoción Aplicada',
    'Subtotal',
    'Total Pedido',
    'Estado',
    'Tipo Entrega',
    'Dirección Calle',
    'Ciudad',
    'Provincia',
    'Código Postal',
    'Número Seguimiento',
    'Courier',
    'Método Pago',
    'Cuotas'
  ];

  const rows = order.items.map(item => {
    const paymentInfo = order.gatewayPayments?.[0] || order.payment;
    const paymentMethod = (paymentInfo as any)?.metadata?.payment_method_id || order.paymentMethodDetail || 'desconocido';
    const installments = (order as any).installments || (paymentInfo as any)?.metadata?.installments || 1;
    const direccion = order.direccionEnvio;
    const precioOriginal = item.precioOriginal || item.precioUnitario;
    const descuento = item.descuentoMonto || 0;

    return [
      order.numeroOrden,
      format(new Date(order.fecha), 'dd/MM/yyyy HH:mm', { locale: es }),
      `${order.usuario.nombre} ${order.usuario.apellido}`,
      order.usuario.email,
      order.usuario.telefono || '-',
      item.product.nombre,
      item.productId,
      item.talle.toString(),
      item.color || '-',
      item.cantidad.toString(),
      (precioOriginal / 100).toFixed(2),
      (item.precioUnitario / 100).toFixed(2),
      (descuento / 100).toFixed(2),
      item.promocionNombre || '-',
      ((item.precioUnitario * item.cantidad) / 100).toFixed(2),
      (order.total / 100).toFixed(2),
      order.cmsStatus,
      order.fulfillmentType === 'pickup' ? 'Retiro en Local' : 'Envío a Domicilio',
      direccion?.calle || '-',
      direccion?.ciudad || '-',
      direccion?.provincia || '-',
      direccion?.codigoPostal || '-',
      order.trackingNumber || '-',
      order.courierName || '-',
      paymentMethod,
      installments.toString()
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  downloadFile(
    csvContent,
    `pedido_${order.numeroOrden}_${Date.now()}.csv`,
    'text/csv;charset=utf-8;'
  );
}

/**
 * Exporta múltiples pedidos a CSV
 */
export function exportOrdersToCSV(orders: Order[], filename?: string): void {
  const headers = [
    'Número Pedido',
    'Fecha',
    'Cliente',
    'Email',
    'Teléfono Celular',
    'Producto',
    'Product ID',
    'Talle',
    'Color',
    'Cantidad',
    'Precio Original',
    'Precio Unitario',
    'Descuento',
    'Promoción Aplicada',
    'Subtotal',
    'Total Pedido',
    'Estado',
    'Tipo Entrega',
    'Dirección Calle',
    'Ciudad',
    'Provincia',
    'Código Postal',
    'Número Seguimiento',
    'Courier',
    'Método Pago',
    'Cuotas'
  ];

  const rows: string[][] = [];

  orders.forEach(order => {
    order.items.forEach(item => {
      const paymentInfo = order.gatewayPayments?.[0] || order.payment;
      const paymentMethod = (paymentInfo as any)?.metadata?.payment_method_id || order.paymentMethodDetail || 'desconocido';
      const installments = (order as any).installments || (paymentInfo as any)?.metadata?.installments || 1;
      const direccion = order.direccionEnvio;
      const precioOriginal = item.precioOriginal || item.precioUnitario;
      const descuento = item.descuentoMonto || 0;

      rows.push([
        order.numeroOrden,
        format(new Date(order.fecha), 'dd/MM/yyyy HH:mm', { locale: es }),
        `${order.usuario.nombre} ${order.usuario.apellido}`,
        order.usuario.email,
        order.usuario.telefono || '-',
        item.product.nombre,
        item.productId,
        item.talle.toString(),
        item.color || '-',
        item.cantidad.toString(),
        (precioOriginal / 100).toFixed(2),
        (item.precioUnitario / 100).toFixed(2),
        (descuento / 100).toFixed(2),
        item.promocionNombre || '-',
        ((item.precioUnitario * item.cantidad) / 100).toFixed(2),
        (order.total / 100).toFixed(2),
        order.cmsStatus,
        order.fulfillmentType === 'pickup' ? 'Retiro en Local' : 'Envío a Domicilio',
        direccion?.calle || '-',
        direccion?.ciudad || '-',
        direccion?.provincia || '-',
        direccion?.codigoPostal || '-',
        order.trackingNumber || '-',
        order.courierName || '-',
        paymentMethod,
        installments.toString()
      ]);
    });
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  downloadFile(
    csvContent,
    filename || `pedidos_export_${Date.now()}.csv`,
    'text/csv;charset=utf-8;'
  );
}

/**
 * Genera PDF de un pedido individual (versión simple con HTML)
 */
export function exportOrderToPDF(order: Order): void {
  const paymentInfo = order.gatewayPayments?.[0] || order.payment;
  const paymentMethod = (paymentInfo as any)?.metadata?.payment_method_id || order.paymentMethodDetail || 'desconocido';
  const installments = (order as any).installments || (paymentInfo as any)?.metadata?.installments || 1;
  const isCreditCard = paymentMethod.includes('credit') || paymentMethod.includes('tarjeta') || order.paymentMethodDetail === 'tarjeta';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Pedido #${order.numeroOrden}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #6B46C1;
      padding-bottom: 20px;
    }
    .header h1 {
      color: #6B46C1;
      margin: 0;
    }
    .section {
      margin-bottom: 25px;
    }
    .section h2 {
      color: #6B46C1;
      border-bottom: 1px solid #E5E7EB;
      padding-bottom: 8px;
      font-size: 18px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #E5E7EB;
    }
    th {
      background-color: #F3F4F6;
      font-weight: 600;
    }
    .total {
      text-align: right;
      font-size: 24px;
      font-weight: bold;
      color: #6B46C1;
      margin-top: 20px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 150px 1fr;
      gap: 10px;
    }
    .info-label {
      font-weight: 600;
      color: #6B46C1;
    }
    .footer {
      margin-top: 50px;
      text-align: center;
      color: #9CA3AF;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Paso a Paso Shoes</h1>
    <p>Detalle de Pedido</p>
  </div>

  <div class="section">
    <h2>Pedido #${order.numeroOrden}</h2>
    <div class="info-grid">
      <div class="info-label">Fecha:</div>
      <div>${format(new Date(order.fecha), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}</div>
      
      <div class="info-label">Estado:</div>
      <div>${order.cmsStatus}</div>
      
      <div class="info-label">ID:</div>
      <div>${order.id}</div>
    </div>
  </div>

  <div class="section">
    <h2>Cliente</h2>
    <div class="info-grid">
      <div class="info-label">Nombre:</div>
      <div>${order.usuario.nombre} ${order.usuario.apellido}</div>
      
      <div class="info-label">Email:</div>
      <div>${order.usuario.email}</div>
      
      <div class="info-label">Teléfono Celular:</div>
      <div>${order.usuario.telefono || 'No registrado'}</div>
    </div>
  </div>

  <div class="section">
    <h2>Productos</h2>
    <table>
      <thead>
        <tr>
          <th>Producto</th>
          <th>Talle</th>
          <th>Color</th>
          <th>Cantidad</th>
          <th>Precio Original</th>
          <th>Precio Unit.</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${order.items.map(item => {
          const precioOriginal = item.precioOriginal || item.precioUnitario;
          const tieneDescuento = item.descuentoMonto && item.descuentoMonto > 0;
          return `
          <tr>
            <td>${item.product.nombre}${item.promocionNombre ? ` <span style="color: #059669; font-size: 11px;">(${item.promocionNombre})</span>` : ''}</td>
            <td>${item.talle}</td>
            <td>${item.color || '-'}</td>
            <td>${item.cantidad}</td>
            <td>${tieneDescuento ? `<span style="text-decoration: line-through; color: #999;">${formatPrice(precioOriginal)}</span>` : formatPrice(precioOriginal)}</td>
            <td style="${tieneDescuento ? 'color: #059669; font-weight: bold;' : ''}">${formatPrice(item.precioUnitario)}</td>
            <td style="${tieneDescuento ? 'color: #059669; font-weight: bold;' : ''}">${formatPrice(item.precioUnitario * item.cantidad)}</td>
          </tr>
        `}).join('')}
      </tbody>
    </table>
  </div>

  ${order.items.some(item => item.promocionNombre) ? `
  <div class="section" style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 15px; border-radius: 8px; border: 1px solid #a7f3d0;">
    <h2 style="color: #047857; border-bottom: 1px solid #a7f3d0;">🏷️ Descuentos por Promociones</h2>
    <table style="margin-top: 10px;">
      <thead>
        <tr style="background-color: #d1fae5;">
          <th style="color: #047857;">Promoción</th>
          <th style="color: #047857;">Producto</th>
          <th style="color: #047857;">Descuento</th>
        </tr>
      </thead>
      <tbody>
        ${order.items.filter(item => item.promocionNombre).map(item => `
          <tr>
            <td style="color: #047857; font-weight: 500;">${item.promocionNombre}</td>
            <td>${item.product.nombre}</td>
            <td style="color: #047857; font-weight: bold;">-${formatPrice((item.descuentoMonto || 0) * item.cantidad)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="border-top: 2px solid #a7f3d0;">
          <td colspan="2" style="font-weight: bold; color: #047857;">Total Descuentos</td>
          <td style="font-weight: bold; color: #047857;">-${formatPrice(order.items.reduce((acc, item) => acc + ((item.descuentoMonto || 0) * item.cantidad), 0))}</td>
        </tr>
      </tfoot>
    </table>
  </div>
  ` : ''}

  <div class="section">
    <h2>Información de Pago</h2>
    <div class="info-grid">
      <div class="info-label">Método:</div>
      <div>${isCreditCard ? 'Tarjeta de Crédito' : paymentMethod === 'transferencia' ? 'Transferencia' : paymentMethod === 'efectivo' ? 'Efectivo' : paymentMethod}</div>
      
      ${isCreditCard && installments > 1 ? `
        <div class="info-label">Cuotas:</div>
        <div>${installments} cuotas</div>
      ` : ''}
    </div>
  </div>

  <div class="section">
    <h2>Información de Entrega</h2>
    <div class="info-grid">
      <div class="info-label">Tipo:</div>
      <div>${order.fulfillmentType === 'pickup' ? 'Retiro en Local' : 'Envío a Domicilio'}</div>
      
      ${order.fulfillmentType !== 'pickup' && order.direccionEnvio ? `
        <div class="info-label">Dirección:</div>
        <div>${order.direccionEnvio.calle || '-'}</div>
        
        <div class="info-label">Ciudad:</div>
        <div>${order.direccionEnvio.ciudad || '-'}</div>
        
        <div class="info-label">Provincia:</div>
        <div>${order.direccionEnvio.provincia || '-'}</div>
        
        <div class="info-label">Código Postal:</div>
        <div>${order.direccionEnvio.codigoPostal || '-'}</div>
      ` : ''}
      
      ${order.trackingNumber ? `
        <div class="info-label">Nº Seguimiento:</div>
        <div>${order.trackingNumber}</div>
      ` : ''}
      
      ${order.courierName ? `
        <div class="info-label">Courier:</div>
        <div>${order.courierName}</div>
      ` : ''}
    </div>
  </div>

  <div class="total">
    Total: ${formatPrice(order.total)}
  </div>

  <div class="footer">
    <p>Documento generado el ${format(new Date(), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}</p>
    <p>Paso a Paso Shoes - Sistema de Gestión CMS</p>
  </div>
</body>
</html>
  `;

  // Crear ventana de impresión
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      // Opcional: cerrar después de imprimir
      // printWindow.close();
    };
  }
}

/**
 * Descarga un archivo
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Genera resumen de exportación para múltiples pedidos
 */
export function generateExportSummary(orders: Order[]): string {
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const totalItems = orders.reduce((sum, order) => 
    sum + order.items.reduce((itemSum, item) => itemSum + item.cantidad, 0), 0
  );

  return `
Resumen de Exportación
======================
Total de pedidos: ${totalOrders}
Total de productos: ${totalItems}
Ingresos totales: ${formatPrice(totalRevenue)}
Fecha de exportación: ${format(new Date(), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
  `.trim();
}
