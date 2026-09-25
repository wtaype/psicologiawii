// src/feature/personal/modulos/correo/plantillas/mensajes.js
// Plantilla para Mensajes Libres, Comunicados Oficiales y Promociones

import { envoltorioBase } from './base.js';
import { mdToEmailHtml } from './parser.js';

export function generarPlantillaLibre({
  cliente = 'Estimado/a cliente',
  asunto = 'Comunicado Oficial',
  mensajeMarkdown = '',
  negocio = {}
} = {}) {
  const contenidoMarkdownFinal = mensajeMarkdown || `
Estimado cliente, te compartimos información importante de nuestro servicio oficial.

- **Atención ininterrumpida:** 365 días al año.
- **Canal express:** Pedidos al instante vía web y WhatsApp.
- **Sello de planta:** Calidad y peso exacto garantizados.
  `.trim();

  const contenidoHtml = `
    <h2 style="color: #0f172a; margin-top: 0; font-size: 21px; font-weight: 800;">${asunto}</h2>
    <p style="font-size: 15px;">Hola <strong>${cliente}</strong>,</p>
    <div style="margin: 18px 0;">
      ${mdToEmailHtml(contenidoMarkdownFinal)}
    </div>
  `;

  const vistaPreviaTexto = asunto;
  return { asunto, html: envoltorioBase({ contenidoHtml, asunto, vistaPreviaTexto, negocio }), resumen: vistaPreviaTexto };
}
