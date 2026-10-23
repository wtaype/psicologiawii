import { envoltorioBase } from './base.js';
import { mdToEmailHtml } from './parser.js';
import { datosNegocio } from '@/negocio.js';
import productosSemilla from '@semillas/productos.json';

export function generarPlantillaCotizacion({
  cliente = 'Contacto Comercial',
  empresa = 'Empresa Solicitante',
  cotizacionId = 'COT-1001',
  validez = '15 días calendario',
  mensajeMarkdown = '',
  negocio = {}
} = {}) {
  const neg = { ...datosNegocio, ...negocio };
  const nombreEmpresa = neg?.nombreCorto || neg?.nombre || 'nuestra empresa';
  const colorMarca = neg?.colorPrimario || '#ff6600';

  const primerProd = Array.isArray(productosSemilla) && productosSemilla[0] ? productosSemilla[0] : null;
  const nombreProd = typeof primerProd?.nombre === 'object' ? (primerProd?.nombre?.es || '') : (primerProd?.nombre || 'Propuesta Comercial');
  const precioProd = Number(primerProd?.precioPEN ?? primerProd?.precio ?? 0).toFixed(2);

  const contenidoMarkdownDefecto = `
| Propuesta Comercial | Detalle / Cantidad | Tarifa Unitaria (S/) |
| :--- | :---: | :---: |
| ${nombreProd} | 1 servicio / unidad | S/ ${precioProd} |
| Soporte y Acompañamiento Oficial | Incluido | S/ 0.00 |

### Beneficios de la Propuesta:
- Atención directa y despacho / coordinación prioritaria de ${nombreEmpresa}.
- Comprobante electrónico oficial conforme a las normas de SUNAT.
- Garantía oficial y seguimiento personalizado de cada requerimiento.
  `.trim();

  const tablaHtml = mdToEmailHtml(mensajeMarkdown || contenidoMarkdownDefecto);
  const tituloCotiz = esServicios ? '📋 Propuesta de Servicios Contables' : '📋 Cotización de Suministro GLP Comercial';
  const bajadaCotiz = esServicios 
    ? 'Presentamos nuestra propuesta formal de servicios contables, tributarios y de planillas con respaldo profesional especializado:' 
    : 'Presentamos nuestra propuesta comercial formal para el abastecimiento continuo de gas GLP para su negocio con garantía de peso exacto:';
  const asuntoTag = esServicios ? 'Propuesta Contable' : 'Cotización Comercial';

  const contenidoHtml = `
    <h2 style="color: ${colorMarca}; margin-top: 0; font-size: 21px; font-weight: 700;">${tituloCotiz}</h2>
    <p style="font-size: 15px;">Estimados señores de <strong>${empresa}</strong> (${cliente}),</p>
    <p style="color: #475569; font-size: 14px;">${bajadaCotiz}</p>

    <div style="background:#fdfbf7;border:1px solid #ebdcc5;border-radius:8px;padding:10px 16px;margin:14px 0;display:flex;justify-content:space-between;font-size:13px;">
      <span>Cotización: <strong>#${cotizacionId}</strong></span>
      <span>Validez: <strong>${validez}</strong></span>
    </div>

    <!-- Contenido y Tablas en Markdown -->
    ${tablaHtml}

    <div style="text-align: center; margin-top: 25px;">
      <a href="https://wa.me/${(negocio.contacto?.whatsappLimpio || negocio.contacto?.whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent('Hola, deseo coordinar la propuesta #' + cotizacionId + ' para ' + empresa)}" class="btn-ws">
        🤝 Coordinar Inicio de Suministro por WhatsApp
      </a>
    </div>
  `;

  const asunto = `📋 ${asuntoTag} #${cotizacionId} · ${empresa} · ${nombreEmpresa}`;
  const vistaPreviaTexto = `Propuesta comercial #${cotizacionId} para ${empresa}.`;
  return { asunto, html: envoltorioBase({ contenidoHtml, asunto, vistaPreviaTexto, negocio }), resumen: vistaPreviaTexto };
}
