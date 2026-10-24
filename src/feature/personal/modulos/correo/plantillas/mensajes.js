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

  const contenidoMarkdownFinal = mensajeMarkdown || `
Estimado/a consultante, te compartimos información importante de nuestro consultorio:

- **Espacio Seguro y Confidencial:** Atención ética y personalizada basada en evidencia científica (C.Ps.P. 49425).
- **Canal Directo de Acompañamiento:** Consultas y reprogramaciones vía WhatsApp oficial y correo institucional.
- **Continuidad Terapéutica:** Pautas claras y ejercicios prácticos para aplicar entre sesiones.
  `.trim();

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
