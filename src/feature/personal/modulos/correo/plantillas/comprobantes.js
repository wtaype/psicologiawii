// src/feature/personal/modulos/correo/plantillas/comprobantes.js
// Plantilla de Envío de Comprobantes de Pago Electrónico

import { envoltorioBase } from './base.js';
import { mdToEmailHtml } from './parser.js';
import { configurarSistema } from '@semillas/configurar.js';
import { datosNegocio } from '@/negocio.js';

export function generarPlantillaComprobante({
  cliente = 'Estimado cliente',
  tipoComprobante = 'Comprobante Electrónico',
  serieNumero = 'B001-000101',
  docIdentidad = '',
  monto = '0.00',
  fecha = '',
  servicio = '',
  mensajeMarkdown = '',
  urlDescarga = '',
  negocio = {}
} = {}) {
  const neg = { ...datosNegocio, ...negocio };
  const contenidoExtraHtml = mensajeMarkdown ? mdToEmailHtml(mensajeMarkdown) : '';
  const docTexto = docIdentidad ? `<div style="font-size: 13px; color: #64748b; margin-top: 2px;">RUC / DNI: <strong>${docIdentidad}</strong></div>` : '';
  const nombreEmpresa = neg?.nombreCorto || neg?.nombre || '';
  const esServicios = neg?.modeloNegocio === 'servicios_y_asesorias';
  const colorMarca = neg?.colorPrimario || '#104356';
  const conceptoDefault = esServicios ? 'Servicio Profesional y Asesoría' : (configurarSistema.terminologia?.comprobanteConceptoDefault || 'Servicios y Productos');
  const conceptoFinal = servicio || conceptoDefault;
  const descripcionIntro = `Te hacemos llegar el comprobante electrónico oficial emitido por ${nombreEmpresa || 'nuestra empresa'} conforme a las disposiciones vigentes de SUNAT.`;

  const contenidoHtml = `
    <h2 style="color: #0f172a; margin-top: 0; font-size: 21px; font-weight: 700;">📄 Tu ${tipoComprobante}</h2>
    <p style="font-size: 15px;">Hola <strong>${cliente}</strong>,</p>
    <p style="color: #475569; font-size: 14px;">${descripcionIntro}</p>

    <!-- Tarjeta Destacada del Comprobante -->
    <div style="background: #fdfbf7; border: 1px solid #ebdcc5; border-radius: 12px; padding: 22px; margin: 20px 0; text-align: center;">
      <span style="font-size: 11px; color: ${colorMarca}; text-transform: uppercase; font-weight: 700; letter-spacing: 0.08em; background: #fff4e5; padding: 4px 10px; border-radius: 4px;">
        COMPROBANTE ELECTRÓNICO OFICIAL
      </span>
      <div style="font-size: 24px; font-weight: 800; color: ${colorMarca}; margin: 10px 0 4px;">${serieNumero}</div>
      ${docTexto}
      <div style="font-size: 14px; color: #334155; margin: 8px 0; font-weight: 600;">
        Concepto: ${conceptoFinal}
      </div>
      <div style="font-size: 18px; color: #0f172a; margin: 10px 0 6px; font-weight: 800;">
        Monto Total: <span style="color: ${colorMarca};">S/ ${monto}</span> (Inc. IGV)
      </div>
      <div style="font-size: 13px; color: #64748b;">Fecha de emisión: ${fecha}</div>
    </div>

    ${contenidoExtraHtml}

    <p style="font-size: 13px; color: #64748b; text-align: center; margin-top: 15px;">
      Puedes consultar el estado de tus comprobantes en cualquier momento en el portal con tu RUC o DNI.
    </p>

    <div style="text-align: center; margin-top: 20px;">
      <a href="${urlDescarga || '#'}" class="btn-action">
        📥 Descargar Comprobante en Portal
      </a>
    </div>
  `;

  const asunto = `📄 Tu ${tipoComprobante} ${serieNumero} · ${nombreEmpresa}`;
  const vistaPreviaTexto = `Comprobante electrónico ${serieNumero} emitido por S/ ${monto}.`;
  return { asunto, html: envoltorioBase({ contenidoHtml, asunto, vistaPreviaTexto, negocio }), resumen: vistaPreviaTexto };
}
