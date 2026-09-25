// src/feature/acercas/secciones/05-libro-reclamaciones/libroReclamacionesLogic.js
// Lógica de Persistencia y Despacho Legal para el Libro de Reclamaciones
import { datosNegocio } from '../../../../negocio.js';

const CLOUDFLARE_CORREO_ENDPOINT = 'https://gaswii-correo.lourdesinformatica10.workers.dev/enviar';
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/gaswii/databases/(default)/documents';

/**
 * Guarda la reclamación en Firestore (colección 'reclamaciones') y en caché local
 */
export async function guardarReclamoFirestore(reclamo) {
  // 1. Guardar en LocalStorage para consulta del cliente (Local-First)
  try {
    const listRaw = localStorage.getItem('wiReclamaciones');
    const lista = listRaw ? JSON.parse(listRaw) : [];
    lista.unshift(reclamo);
    localStorage.setItem('wiReclamaciones', JSON.stringify(lista.slice(0, 10)));
  } catch (e) {}

  // 2. Guardar en Firestore REST API
  try {
    const docId = reclamo.codigoHR.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fields = {
      codigoHR: { stringValue: reclamo.codigoHR },
      fecha: { stringValue: reclamo.fecha },
      fechaTexto: { stringValue: reclamo.fechaTexto },
      nombre: { stringValue: reclamo.nombre || '' },
      tipoDoc: { stringValue: reclamo.tipoDoc || 'DNI' },
      numDoc: { stringValue: reclamo.numDoc || '' },
      telefono: { stringValue: reclamo.telefono || '' },
      email: { stringValue: reclamo.email || '' },
      direccion: { stringValue: reclamo.direccion || '' },
      apoderado: { stringValue: reclamo.apoderado || '' },
      tipoBien: { stringValue: reclamo.tipoBien || 'Producto' },
      monto: { stringValue: String(reclamo.monto || '0.00') },
      descBien: { stringValue: reclamo.descBien || '' },
      tipoReclamacion: { stringValue: reclamo.tipoReclamacion || 'Reclamo' },
      detalle: { stringValue: reclamo.detalle || '' },
      pedido: { stringValue: reclamo.pedido || '' },
      estado: { stringValue: 'pendiente' },
      proveedorRuc: { stringValue: datosNegocio.ruc },
      proveedorRazon: { stringValue: datosNegocio.razonSocial }
    };

    const res = await fetch(`${FIRESTORE_BASE}/reclamaciones?documentId=${docId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });

    return res.ok;
  } catch (err) {
    console.warn('[LibroReclamaciones] Firestore write fallback:', err);
    return false;
  }
}

/**
 * Despacha confirmación por correo electrónico al cliente (conforme a ley INDECOPI)
 */
export async function enviarConfirmacionCorreo(reclamo) {
  if (!reclamo.email) return;

  try {
    const asunto = `📋 Hoja de Reclamación ${reclamo.codigoHR} · ${datosNegocio.nombre}`;
    const html = `
      <div style="font-family:'Segoe UI',sans-serif; max-width:620px; margin:0 auto; padding:24px; border:1px solid #e2e8f0; border-radius:12px; background:#ffffff;">
        <div style="background:#ea580c; padding:16px 20px; border-radius:8px 8px 0 0; color:#ffffff;">
          <h2 style="margin:0; font-size:1.3rem;">LIBRO DE RECLAMACIONES VIRTUAL</h2>
          <p style="margin:4px 0 0; font-size:0.85rem; opacity:0.9;">${datosNegocio.razonSocial} · RUC ${datosNegocio.ruc}</p>
        </div>
        <div style="padding:20px; color:#334155; font-size:0.95rem; line-height:1.6;">
          <p>Estimado(a) <strong>${reclamo.nombre}</strong>,</p>
          <p>Le confirmamos que su <strong>${reclamo.tipoReclamacion.toUpperCase()}</strong> ha sido ingresado(a) con éxito en nuestro sistema conforme a las disposiciones del Código de Protección y Defensa del Consumidor de INDECOPI.</p>
          
          <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:16px; margin:20px 0;">
            <p style="margin:0; font-size:1.1rem; font-weight:bold; color:#ea580c;">Código: ${reclamo.codigoHR}</p>
            <p style="margin:6px 0 0; font-size:0.85rem; color:#64748b;">Fecha de Registro: ${reclamo.fechaTexto}</p>
            <hr style="border:none; border-top:1px solid #e2e8f0; margin:12px 0;" />
            <p style="margin:0; font-size:0.9rem;"><strong>Tipo:</strong> ${reclamo.tipoReclamacion}</p>
            <p style="margin:4px 0 0; font-size:0.9rem;"><strong>Bien Afectado:</strong> ${reclamo.tipoBien} (${reclamo.descBien})</p>
            <p style="margin:6px 0 0; font-size:0.88rem; color:#475569;"><strong>Detalle:</strong> ${reclamo.detalle}</p>
            <p style="margin:6px 0 0; font-size:0.88rem; color:#0f172a;"><strong>Pedido Solicitado:</strong> ${reclamo.pedido}</p>
          </div>

          <p style="font-size:0.88rem; color:#059669; font-weight:600;">
            ⚖️ Conforme a la Ley N° 31435, le brindaremos respuesta motivada en un plazo máximo e improrrogable de 15 días hábiles.
          </p>
          
          <p style="font-size:0.85rem; color:#64748b; margin-top:20px;">
            Atentamente,<br />
            <strong>${datosNegocio.nombre}</strong><br />
            ${datosNegocio.direccionSede}<br />
            Central: ${datosNegocio.telefonoMostrado}
          </p>
        </div>
      </div>
    `;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    await fetch(CLOUDFLARE_CORREO_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        tipo: 'reclamo',
        para: reclamo.email,
        nombre: reclamo.nombre,
        asunto,
        resumen: `Hoja de Reclamación ${reclamo.codigoHR} registrada en Solgas Surquillo.`,
        html
      })
    });
    clearTimeout(timeout);
  } catch (err) {
    console.warn('[LibroReclamaciones] Despacho email worker:', err);
  }
}
