// src/feature/personal/modulos/correo/plantillas/comprobantes.js
// Plantilla de Envío de Comprobantes de Pago Electrónico (SUNAT)

import { envoltorioBase } from './base.js';
import { mdToEmailHtml } from './parser.js';

export function generarPlantillaComprobante({
  cliente = 'Estimado cliente',
  tipoComprobante = 'Boleta de Venta Electrónica',
  serieNumero = 'B001-000482',
  docIdentidad = '',
  monto = '65.00',
  fecha = '22 Sep 2026',
  mensajeMarkdown = '',
  urlDescarga = 'https://gaswii.com/cliente',
  negocio = {}
} = {}) {
  const contenidoExtraHtml = mensajeMarkdown ? mdToEmailHtml(mensajeMarkdown) : '';
  const docTexto = docIdentidad ? `<div style="font-size: 13px; color: #64748b; margin-top: 2px;">DNI / RUC: <strong>${docIdentidad}</strong></div>` : '';
  const nombreEmpresa = negocio?.nombre || 'Solgas Surquillo';

  const contenidoHtml = `
    <h2 style="color: #0f172a; margin-top: 0; font-size: 21px; font-weight: 800;">📄 Tu ${tipoComprobante}</h2>
    <p style="font-size: 15px;">Hola <strong>${cliente}</strong>,</p>
    <p style="color: #475569; font-size: 14px;">Te hacemos llegar el comprobante electrónico oficial emitido conforme a las normativas de la SUNAT.</p>

    <!-- Tarjeta Destacada del Comprobante -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 22px; margin: 20px 0; text-align: center;">
      <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 800; letter-spacing: 0.08em; background: #e2e8f0; padding: 4px 10px; border-radius: 4px;">
        COMPROBANTE ELECTRÓNICO OFICIAL
      </span>
      <div style="font-size: 26px; font-weight: 900; color: #ff6a00; margin: 10px 0 4px;">${serieNumero}</div>
      ${docTexto}
      <div style="font-size: 18px; color: #0f172a; margin: 10px 0 6px; font-weight: 800;">
        Monto Total: <span style="color: #ff6a00;">S/ ${monto}</span>
      </div>
      <div style="font-size: 13px; color: #64748b;">Fecha de emisión: ${fecha}</div>
    </div>

    ${contenidoExtraHtml}

    <p style="font-size: 13px; color: #64748b; text-align: center; margin-top: 15px;">
      Puedes consultar el estado de tus comprobantes en cualquier momento ingresando al portal con tu DNI o RUC.
    </p>

    <div style="text-align: center; margin-top: 20px;">
      <a href="${urlDescarga}" class="btn-action">
        📥 Descargar Comprobante en Portal
      </a>
    </div>
  `;

  const asunto = `📄 Tu ${tipoComprobante} ${serieNumero} · ${nombreEmpresa}`;
  const vistaPreviaTexto = `Comprobante electrónico ${serieNumero} emitido por S/ ${monto}.`;
  return { asunto, html: envoltorioBase({ contenidoHtml, asunto, vistaPreviaTexto, negocio }), resumen: vistaPreviaTexto };
}
