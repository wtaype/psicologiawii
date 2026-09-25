// src/feature/personal/modulos/correo/plantillas/pedidos.js
// Plantilla de Confirmación de Pedido de Gas a Domicilio

import { envoltorioBase } from './base.js';
import { mdToEmailHtml } from './parser.js';

export function generarPlantillaPedido({
  cliente = 'Estimado/a cliente',
  pedidoId = 'GW-1029',
  producto = 'Balón SOLGAS Premium 10 kg',
  cantidad = 1,
  precio = '65.00',
  direccion = 'Surquillo, Lima',
  metodoPago = 'Efectivo / Yape / Plin',
  tiempoEstimado = '15 - 20 minutos',
  mensajeMarkdown = '',
  negocio = {}
} = {}) {
  const contenidoExtraHtml = mensajeMarkdown ? mdToEmailHtml(mensajeMarkdown) : '';
  const nombreEmpresa = negocio?.nombre || 'Solgas Surquillo';

  const contenidoHtml = `
    <h2 style="color: #ff6a00; margin-top: 0; font-size: 22px; font-weight: 800;">🔥 ¡Tu pedido está confirmado!</h2>
    <p style="font-size: 15px;">Hola <strong>${cliente}</strong>,</p>
    <p style="color: #475569; font-size: 14px; margin-bottom: 20px;">Hemos recibido tu pedido con éxito y nuestra unidad de despacho express ya se encuentra en camino.</p>

    <!-- Ficha de Datos del Pedido Real -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 18px 0;">
      <table style="width: 100%; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #64748b;">N° de Pedido:</td>
          <td style="padding: 6px 0; font-weight: 800; text-align: right; color: #ff6a00;">#${pedidoId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Producto solicitado:</td>
          <td style="padding: 6px 0; font-weight: 700; text-align: right; color: #0f172a;">${cantidad}x ${producto}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Dirección de Entrega:</td>
          <td style="padding: 6px 0; font-weight: 500; text-align: right; color: #334155;">${direccion}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Forma de Pago:</td>
          <td style="padding: 6px 0; font-weight: 500; text-align: right; color: #334155;">${metodoPago}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Tiempo estimado:</td>
          <td style="padding: 6px 0; font-weight: 700; text-align: right; color: #16a34a;">${tiempoEstimado}</td>
        </tr>
        <tr style="border-top: 2px dashed #e2e8f0;">
          <td style="padding: 12px 0 4px; font-size: 15px; font-weight: 800; color: #0f172a;">Total a Cobrar:</td>
          <td style="padding: 12px 0 4px; font-size: 20px; font-weight: 900; text-align: right; color: #ff6a00;">S/ ${precio}</td>
        </tr>
      </table>
    </div>

    ${contenidoExtraHtml}

    <!-- Garantía Oficial de Empresa (Sin balanza ni hermeticidad) -->
    <div style="background: #fff9f5; border-left: 4px solid #ff6a00; padding: 14px 18px; border-radius: 6px; margin: 18px 0;">
      <p style="margin: 0; color: #9a3412; font-size: 13px; line-height: 1.6;">
        🛡️ <strong>Garantía Oficial Solgas:</strong> Balón 100% sellado de fábrica con peso exacto garantizado de planta y válvula de seguridad certificada.
      </p>
    </div>

    <div style="text-align: center; margin-top: 22px;">
      <a href="https://wa.me/${negocio.contacto?.whatsappLimpio || negocio.contacto?.whatsapp || '51936369384'}?text=${encodeURIComponent('Hola ' + nombreEmpresa + ', deseo consultar el estado de mi pedido #' + pedidoId)}" class="btn-ws">
        📲 Consultar Estado por WhatsApp
      </a>
    </div>
  `;

  const asunto = `🔥 Confirmación de Pedido #${pedidoId} · ${nombreEmpresa}`;
  const vistaPreviaTexto = `Tu pedido #${pedidoId} por S/ ${precio} está en camino a ${direccion}.`;
  return { asunto, html: envoltorioBase({ contenidoHtml, asunto, vistaPreviaTexto, negocio }), resumen: vistaPreviaTexto };
}
