// src/feature/personal/modulos/correo/plantillas/cotizacion.js
// Plantilla de Cotización Comercial de Balones y GLP (Negocios e Industrias)

import { envoltorioBase } from './base.js';
import { mdToEmailHtml } from './parser.js';

export function generarPlantillaCotizacion({
  cliente = 'Contacto Comercial',
  empresa = 'Empresa Solicitante',
  cotizacionId = 'COT-2026-08',
  validez = '15 días calendario',
  mensajeMarkdown = '',
  negocio = {}
} = {}) {
  const nombreEmpresa = negocio?.nombre || 'Solgas Surquillo';

  const contenidoMarkdownFinal = mensajeMarkdown || `
| Balón Solgas | Cantidad | Precio Unit. | Subtotal |
| :--- | :---: | :---: | :---: |
| Balón 45 kg Industrial | 2 | S/ 220.00 | S/ 440.00 |
| Balón 10 kg Comercial | 5 | S/ 65.00 | S/ 325.00 |

### Beneficios del Suministro Directo:
- Despacho continuo y prioritario con programación semanal.
- Factura electrónica con RUC para crédito fiscal.
- Sello de seguridad y peso exacto garantizado de planta.
  `.trim();

  const tablaHtml = mdToEmailHtml(contenidoMarkdownFinal);

  const contenidoHtml = `
    <h2 style="color: #ff6a00; margin-top: 0; font-size: 22px; font-weight: 800;">📋 Cotización Comercial de GLP</h2>
    <p style="font-size: 15px;">Estimados señores de <strong>${empresa}</strong> (${cliente}),</p>
    <p style="color: #475569; font-size: 14px;">Presentamos nuestra propuesta formal de abastecimiento de gas GLP de alta pureza respaldado por ${nombreEmpresa}:</p>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 16px;margin:14px 0;display:flex;justify-content:space-between;font-size:13px;">
      <span>Cotización: <strong>#${cotizacionId}</strong></span>
      <span>Validez: <strong>${validez}</strong></span>
    </div>

    <!-- Contenido y Tablas en Markdown -->
    ${tablaHtml}

    <div style="text-align: center; margin-top: 25px;">
      <a href="https://wa.me/${negocio.contacto?.whatsappLimpio || negocio.contacto?.whatsapp || '51936369384'}?text=${encodeURIComponent('Hola, deseo aprobar la cotización #' + cotizacionId + ' para ' + empresa)}" class="btn-ws">
        🤝 Coordinar Entrega por WhatsApp
      </a>
    </div>
  `;

  const asunto = `📋 Cotización Comercial #${cotizacionId} · ${empresa}`;
  const vistaPreviaTexto = `Cotización formal de GLP #${cotizacionId} para ${empresa}.`;
  return { asunto, html: envoltorioBase({ contenidoHtml, asunto, vistaPreviaTexto, negocio }), resumen: vistaPreviaTexto };
}
