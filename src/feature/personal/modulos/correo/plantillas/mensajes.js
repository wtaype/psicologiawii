// src/feature/personal/modulos/correo/plantillas/mensajes.js
// Plantilla para Mensajes Libres, Comunicados Tributarios y Orientación

import { envoltorioBase } from './base.js';
import { mdToEmailHtml } from './parser.js';

export function generarPlantillaLibre({
  cliente = 'Estimado/a cliente',
  asunto = '',
  mensajeMarkdown = '',
  negocio = {}
} = {}) {
  const esServicios = negocio?.modeloNegocio === 'servicios_y_asesorias';
  const asuntoDefecto = esServicios ? 'Comunicado Tributario Oficial' : 'Comunicado Oficial';
  const asuntoFinal = asunto || asuntoDefecto;

  const contenidoMarkdownFinal = mensajeMarkdown || (esServicios ? `
Estimado cliente, te compartimos información importante de nuestro estudio:

- **Monitoreo de Buzón SOL:** Mantenemos vigilancia activa de las notificaciones que emite la SUNAT para tu RUC.
- **Canal Directo de Asesoría:** Consultas directas vía WhatsApp institucional y correo oficial.
- **Cumplimiento Puntual:** Presentación de declaraciones con anticipación para evitar contingencias.
  `.trim() : `
Estimado cliente, te compartimos información y novedades importantes sobre nuestro servicio:

- **Pesaje Exacto Comprobado:** Verificación con balanza digital calibrada al momento de la entrega en tu puerta.
- **Garantía y Seguridad GLP:** Balones con precinto de seguridad termoencogible intacto y revisión técnica gratuita.
- **Canal Directo de Atención:** Despacho express y consultas vía WhatsApp y teléfono oficial.
  `.trim());

  const contenidoHtml = `
    <h2 style="color: #0f172a; margin-top: 0; font-size: 21px; font-weight: 700;">${asuntoFinal}</h2>
    <p style="font-size: 15px;">Hola <strong>${cliente}</strong>,</p>
    <div style="margin: 18px 0;">
      ${mdToEmailHtml(contenidoMarkdownFinal)}
    </div>
  `;

  const vistaPreviaTexto = asuntoFinal;
  return { asunto: asuntoFinal, html: envoltorioBase({ contenidoHtml, asunto: asuntoFinal, vistaPreviaTexto, negocio }), resumen: vistaPreviaTexto };
}
