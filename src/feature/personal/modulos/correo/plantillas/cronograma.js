// src/feature/personal/modulos/correo/plantillas/cronograma.js
// Plantilla de Recordatorio de Vencimiento de Declaración SUNAT

import { envoltorioBase } from './base.js';
import { mdToEmailHtml } from './parser.js';

export function generarPlantillaCronograma({
  cliente = 'Estimado/a cliente',
  ruc = '20554897123',
  ultimoDigito = '3',
  periodo = 'Agosto 2026',
  fechaVencimiento = '18 de Septiembre de 2026',
  mensajeMarkdown = '',
  negocio = {}
} = {}) {
  const contenidoExtraHtml = mensajeMarkdown ? mdToEmailHtml(mensajeMarkdown) : '';
  const nombreEmpresa = negocio?.nombre || '';
  const colorMarca = negocio?.colorPrimario || '#ff6600';

  const contenidoHtml = `
    <h2 style="color: ${colorMarca}; margin-top: 0; font-size: 21px; font-weight: 700;">⏰ Recordatorio de Vencimiento SUNAT</h2>
    <p style="font-size: 15px;">Hola <strong>${cliente}</strong>,</p>
    <p style="color: #475569; font-size: 14px; margin-bottom: 20px;">
      Te recordamos las fechas clave para la presentación de tus declaraciones mensuales correspondientes al período <strong>${periodo}</strong>.
    </p>

    <!-- Caja de Vencimiento -->
    <div style="background: #fdfbf7; border: 1px solid #ebdcc5; border-radius: 10px; padding: 20px; margin: 18px 0; text-align: center;">
      <span style="font-size: 11px; color: ${colorMarca}; text-transform: uppercase; font-weight: 700; letter-spacing: 0.08em; background: #fff4e5; padding: 4px 10px; border-radius: 4px;">
        CRONOGRAMA OFICIAL SUNAT
      </span>
      <div style="font-size: 14px; color: #64748b; margin-top: 10px;">RUC: <strong>${ruc}</strong> (Último dígito: <span style="font-size: 18px; font-weight: 800; color: ${colorMarca};">${ultimoDigito}</span>)</div>
      <div style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 12px 0 6px;">
        Vence el: <span style="color: #dc2626;">${fechaVencimiento}</span>
      </div>
      <p style="font-size: 13px; color: #64748b; margin: 0;">Evita multas e infracciones tributarias presentando tu información a tiempo.</p>
    </div>

    <!-- Check-list de Documentos Requeridos -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <h3 style="margin-top: 0; font-size: 14px; color: #0f172a;">📋 Documentación Requerida para el Cierre Contable:</h3>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.8;">
        <li>Comprobantes de compras del mes (facturas y notas de crédito en XML/PDF).</li>
        <li>Estado de cuenta bancario para conciliación.</li>
        <li>Novedades de personal / altas o bajas de trabajadores para la PLAME.</li>
        <li>Recibos por honorarios emitidos y recibidos.</li>
      </ul>
    </div>

    ${contenidoExtraHtml}

    <div style="text-align: center; margin-top: 22px;">
      <a href="https://wa.me/${(negocio.contacto?.whatsappLimpio || negocio.contacto?.whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent('Hola, envío mis comprobantes para la declaración del período ' + periodo)}" class="btn-ws">
        📲 Enviar Documentos por WhatsApp
      </a>
    </div>
  `;

  const asunto = `⏰ Vencimiento SUNAT: Declaración Mensual ${periodo} · RUC ${ruc} · ${nombreEmpresa}`;
  const vistaPreviaTexto = `Recordatorio de vencimiento SUNAT (${periodo}) para tu RUC terminado en ${ultimoDigito}. Fecha límite: ${fechaVencimiento}.`;
  return { asunto, html: envoltorioBase({ contenidoHtml, asunto, vistaPreviaTexto, negocio }), resumen: vistaPreviaTexto };
}
