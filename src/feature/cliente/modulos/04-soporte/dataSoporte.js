// src/feature/cliente/modulos/04-soporte/dataSoporte.js
// Capa de Datos Local-First de Soporte y Mesa de Ayuda · Solgas Surquillo
// Gestión de tickets, Smart Cache con wiSoporte y wiCorreo, Firestore y Cloudflare Worker

import { getls, savels } from '@widev';

const CLOUDFLARE_CORREO_ENDPOINT = 'https://gaswii-correo.lourdesinformatica10.workers.dev/enviar';

/**
 * Obtiene la lista de tickets del cliente desde la caché local wiSoporte (0ms)
 */
export function obtenerTicketsLocal() {
  const lista = getls('wiSoporte');
  if (Array.isArray(lista)) return lista;
  return [];
}

/**
 * Guarda la lista de tickets en caché wiSoporte (TTL 144 horas)
 */
export function guardarTicketsLocal(tickets) {
  savels('wiSoporte', tickets, 144);
}

/**
 * Genera un código de ticket amigable para el cliente (ej: GW-TK-1082)
 */
function generarCodigoTicket() {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `GW-TK-${rand}`;
}

/**
 * Despacha el correo de notificación y acuse a través del Cloudflare Worker (gaswii-correo + Resend)
 */
async function despacharCorreoWorker(ticket) {
  try {
    const payload = {
      tipo: 'soporte',
      para: ticket.email || 'wtaypeee@gmail.com',
      nombre: ticket.nombre || 'Vecino Solgas',
      asunto: `🔥 Solicitud Recibida #${ticket.ticketId} · Solgas Surquillo`,
      resumen: `Tu solicitud de ${ticket.tipo.toUpperCase()} #${ticket.ticketId} ha sido registrada con éxito.`,
      html: `
        <div style="font-family:'Segoe UI',sans-serif; max-width:580px; margin:0 auto; padding:20px; border:1px solid #e2e8f0; border-radius:12px; background:#ffffff;">
          <div style="background:#ff6600; padding:14px 20px; border-radius:8px 8px 0 0; color:#ffffff; font-weight:800; font-size:1.1rem;">
            SOLGAS SURQUILLO · MESA DE AYUDA
          </div>
          <div style="padding:20px;">
            <h3 style="color:#0f172a; margin-top:0;">Hemos recibido tu solicitud</h3>
            <p style="color:#475569; font-size:0.9rem;">
              Hola <strong>${ticket.nombre}</strong>, tu ticket <strong>#${ticket.ticketId}</strong> ha sido ingresado en nuestro sistema.
            </p>
            <div style="background:#f8fafc; border-left:4px solid #ff6600; padding:12px; margin:16px 0; border-radius:4px;">
              <p style="margin:0; font-size:0.85rem; color:#334155;"><strong>Trámite:</strong> ${ticket.tipo.toUpperCase()}</p>
              <p style="margin:4px 0 0; font-size:0.85rem; color:#334155;"><strong>Prioridad:</strong> ${ticket.urgencia.toUpperCase()}</p>
              ${ticket.pedidoRef ? `<p style="margin:4px 0 0; font-size:0.85rem; color:#334155;"><strong>Pedido Referencia:</strong> ${ticket.pedidoRef}</p>` : ''}
              <p style="margin:6px 0 0; font-size:0.85rem; color:#64748b;"><strong>Detalle:</strong> ${ticket.detalle}</p>
            </div>
            <p style="font-size:0.82rem; color:#64748b;">
              Un operador de Solgas Surquillo atenderá tu requerimiento en breve. También puedes coordinar directamente por WhatsApp al 961 229 280.
            </p>
          </div>
        </div>
      `,
      userId: ticket.userId
    };

    const res = await fetch(CLOUDFLARE_CORREO_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const hist = getls('wiCorreo') || [];
      hist.unshift({
        ticketId: ticket.ticketId,
        fecha: new Date().toISOString(),
        estado: 'enviado',
        resendId: data?.id || 'ok'
      });
      savels('wiCorreo', hist.slice(0, 20), 144);
      console.log('[Gaswii Soporte] ✅ Notificación enviada por Cloudflare Worker');
    }
  } catch (err) {
    console.debug('[Gaswii Soporte] Despacho por correo omitido o en segundo plano:', err.message);
  }
}

/**
 * Crea una nueva solicitud / ticket en Local-First (0ms), Firestore soporte/{ticket_id} y Cloudflare Worker
 */
export async function crearTicket(datos = {}) {
  const user = getls('wiSmile') || (typeof window !== 'undefined' ? window.__GASWII_USER__ : null);
  const uid = user?.uid || user?.userId || 'anonimo';
  const now = Date.now();
  const ticketDocId = `ticket_${now}_${uid.slice(0, 4)}`;
  const ticketCodigo = generarCodigoTicket();

  const nuevoTicket = {
    id: ticketDocId,
    ticketId: ticketCodigo,
    userId: uid, // En colecciones satélite SÍ va userId haciendo referencia al cliente
    usuario: user?.usuario || 'usuario',
    email: user?.email || datos.email || '',
    nombre: user?.nombre || datos.nombre || 'Vecino Solgas',
    celular: user?.celular || datos.celular || '',
    tipo: datos.tipo || 'boleta',
    urgencia: datos.urgencia || 'normal',
    asunto: datos.asunto || `Solicitud de ${datos.tipo || 'Soporte'}`,
    detalle: (datos.detalle || '').trim(),
    pedidoRef: (datos.pedidoRef || '').trim(),
    datosFiscales: datos.datosFiscales || null,
    estado: 'pendiente',
    fechaTexto: new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
    creadoLocal: now
  };

  // 1. Guardar de inmediato en Smart Cache wiSoporte (0ms)
  const ticketsActuales = obtenerTicketsLocal();
  const actualizada = [nuevoTicket, ...ticketsActuales.filter(t => t.id !== ticketDocId)];
  guardarTicketsLocal(actualizada);

  // 2. Persistir en Firestore en segundo plano (Non-blocking)
  (async () => {
    try {
      const { db } = await import('@core/servicios/firebase.js');
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');

      await setDoc(doc(db, 'soporte', ticketDocId), {
        id: ticketDocId,
        ticketId: ticketCodigo,
        userId: uid,
        usuario: nuevoTicket.usuario,
        email: nuevoTicket.email,
        nombre: nuevoTicket.nombre,
        celular: nuevoTicket.celular,
        tipo: nuevoTicket.tipo,
        urgencia: nuevoTicket.urgencia,
        asunto: nuevoTicket.asunto,
        detalle: nuevoTicket.detalle,
        pedidoRef: nuevoTicket.pedidoRef,
        datosFiscales: nuevoTicket.datosFiscales,
        estado: 'pendiente',
        origen: 'web_cliente',
        creado: serverTimestamp(),
        actualizado: serverTimestamp()
      });

      console.log(`[Gaswii Soporte] ✅ Ticket registrado en soporte/${ticketDocId}`);
    } catch (err) {
      console.error('[Gaswii Soporte] ❌ Error al registrar ticket en Firestore:', err);
    }
  })();

  // 3. Despachar correo mediante Cloudflare Worker en segundo plano
  despacharCorreoWorker(nuevoTicket);

  return nuevoTicket;
}

/**
 * Sincronización pasiva en segundo plano con Firestore para actualizar estados de tickets
 */
export async function sincronizarTicketsDesdeFirestore() {
  const user = getls('wiSmile') || (typeof window !== 'undefined' ? window.__GASWII_USER__ : null);
  const uid = user?.uid || user?.userId;
  if (!uid) return;

  try {
    const { db } = await import('@core/servicios/firebase.js');
    const { collection, query, where, getDocs, limit, orderBy } = await import('firebase/firestore');

    const q = query(
      collection(db, 'soporte'),
      where('userId', '==', uid),
      limit(10)
    );

    const snap = await getDocs(q);
    if (!snap.empty) {
      const ticketsRemotos = [];
      snap.forEach(docSnap => {
        const d = docSnap.data();
        ticketsRemotos.push({
          id: docSnap.id,
          ticketId: d.ticketId || docSnap.id,
          userId: d.userId,
          tipo: d.tipo || 'boleta',
          urgencia: d.urgencia || 'normal',
          asunto: d.asunto || '',
          detalle: d.detalle || '',
          estado: d.estado || 'pendiente',
          fechaTexto: d.creado?.toDate ? d.creado.toDate().toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) : 'Reciente',
          pedidoRef: d.pedidoRef || ''
        });
      });

      if (ticketsRemotos.length > 0) {
        guardarTicketsLocal(ticketsRemotos);
        if (typeof document !== 'undefined') {
          document.dispatchEvent(new CustomEvent('ticketsActualizados', { detail: ticketsRemotos }));
        }
      }
    }
  } catch (err) {
    console.debug('[Gaswii Soporte] Sincronización remota omitida:', err.message);
  }
}
