// src/feature/personal/modulos/correo/plantillas/liquidacion.js
// Plantilla de Liquidación Mensual de Impuestos (IGV - Renta SUNAT)

import { envoltorioBase } from './base.js';
import { mdToEmailHtml } from './parser.js';

export function generarPlantillaLiquidacion({
  cliente = 'Estimado/a cliente',
  periodo = 'Agosto 2026',
  regimen = 'Régimen MYPE Tributario',
  ruc = '20554897123',
  igvPagar = '120.00',
  rentaPagar = '65.00',
  totalPagar = '185.00',
  npsCodigo = '9827364510',
  fechaLimite = '18 de Septiembre de 2026',
  mensajeMarkdown = '',
  negocio = {}
} = {}) {
  const contenidoExtraHtml = mensajeMarkdown ? mdToEmailHtml(mensajeMarkdown) : '';
  const nombreEmpresa = negocio?.nombre || '';
  const colorMarca = negocio?.colorPrimario || '#ff6600';

  const contenidoHtml = `
    <h2 style="color: ${colorMarca}; margin-top: 0; font-size: 21px; font-weight: 700;">📊 Liquidación Mensual de Impuestos</h2>
    <p style="font-size: 15px;">Estimado/a <strong>${cliente}</strong> (RUC: <strong>${ruc}</strong>),</p>
    <p style="color: #475569; font-size: 14px; margin-bottom: 20px;">
      Hemos procesado tus comprobantes de compras y ventas correspondientes al período <strong>${periodo}</strong> bajo el <strong>${regimen}</strong>. A continuación, el resumen de tu declaración tributaria:
    </p>

    <!-- Ficha de Liquidación Tributaria -->
    <div style="background: #fdfbf7; border: 1px solid #ebdcc5; border-radius: 10px; padding: 20px; margin: 18px 0;">
      <table style="width: 100%; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Período Tributario:</td>
          <td style="padding: 6px 0; font-weight: 700; text-align: right; color: #0f172a;">${periodo}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Régimen Fiscal:</td>
          <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #334155;">${regimen}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">IGV por Pagar (18%):</td>
          <td style="padding: 6px 0; font-weight: 700; text-align: right; color: #0f172a;">S/ ${igvPagar}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Pago a Cuenta Impuesto a la Renta:</td>
          <td style="padding: 6px 0; font-weight: 700; text-align: right; color: #0f172a;">S/ ${rentaPagar}</td>
        </tr>
        <tr style="border-top: 2px dashed #ebdcc5;">
          <td style="padding: 12px 0 4px; font-size: 15px; font-weight: 800; color: #0f172a;">Total Tributo a Pagar:</td>
          <td style="padding: 12px 0 4px; font-size: 20px; font-weight: 800; text-align: right; color: ${colorMarca};">S/ ${totalPagar}</td>
        </tr>
      </table>
    </div>

    <!-- Bloque de Pago NPS -->
    <div style="background: #f1f5f9; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
      <div style="font-size: 13px; color: #334155; margin-bottom: 4px;">
        💳 <strong>Código de Pago SUNAT (NPS):</strong> <span style="font-family: monospace; font-size: 16px; font-weight: 700; color: #0f172a;">${npsCodigo}</span>
      </div>
      <div style="font-size: 12px; color: #dc2626; font-weight: 600;">
        ⏰ Fecha límite de vencimiento SUNAT: ${fechaLimite}
      </div>
      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
        Puedes pagar este importe desde la banca por internet de tu banco (BCP, BBVA, Interbank, Scotiabank) en la opción "Pago de Servicios > SUNAT > Pago con NPS".
      </div>
    </div>

    ${contenidoExtraHtml}

    <div style="text-align: center; margin-top: 22px;">
      <a href="https://wa.me/${(negocio.contacto?.whatsappLimpio || negocio.contacto?.whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent('Hola, tengo una consulta sobre mi liquidación del período ' + periodo)}" class="btn-ws">
        📲 Coordinar con el Estudio por WhatsApp
      </a>
    </div>
  `;

  const asunto = `📊 Liquidación de Impuestos ${periodo} · RUC ${ruc} · ${nombreEmpresa}`;
  const vistaPreviaTexto = `Liquidación del período ${periodo}: Total a pagar S/ ${totalPagar} (NPS: ${npsCodigo}). Vence: ${fechaLimite}.`;
  return { asunto, html: envoltorioBase({ contenidoHtml, asunto, vistaPreviaTexto, negocio }), resumen: vistaPreviaTexto };
}
