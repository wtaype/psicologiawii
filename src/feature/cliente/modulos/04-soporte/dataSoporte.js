// src/feature/cliente/modulos/04-soporte/dataSoporte.js
// Capa de Datos Local-First de Consultas y Mesa de Ayuda
// Gestión de tickets, Smart Cache con wiSoporte y wiCorreo, Firestore y Cloudflare Worker

import { getls, savels } from '@widev';

import { datosNegocio } from '../../../../negocio.js';

const CLOUDFLARE_CORREO_ENDPOINT = import.meta.env.PUBLIC_CORREO_WORKER_ENDPOINT || '';

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
 * Genera un código de ticket amigable para el cliente (ej: TK-1082)
 */
function generarCodigoTicket() {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TK-${rand}`;
}

/**
 * Despacha el correo de notificación y acuse a través del Cloudflare Worker
 */
async function despacharCorreoWorker(ticket) {
  if (!CLOUDFLARE_CORREO_ENDPOINT) {
    console.info('[Soporte Wii] Worker de correo no configurado (PUBLIC_CORREO_WORKER_ENDPOINT); omitiendo despacho.');
    return;
  }
  try {
    const nombreEmpresa = datosNegocio.nombreCorto || datosNegocio.nombre || 'Atención al Cliente';
    const colorMarca = datosNegocio.colorPrimario || '#104356';
    const payload = {
      tipo: 'soporte',
      para: ticket.email || datosNegocio.email || '',
      nombre: ticket.nombre || 'Cliente',
      asunto: `🏛️ Consulta Recibida #${ticket.ticketId} · ${nombreEmpresa}`,
      resumen: `Tu consulta sobre ${ticket.tipo.toUpperCase()} #${ticket.ticketId} ha sido registrada con éxito.`,
      html: `
        <div style="font-family:'Segoe UI',sans-serif; max-width:580px; margin:0 auto; padding:20px; border:1px solid #e2e8f0; border-radius:12px; background:#ffffff;">
          <div style="background:${colorMarca}; padding:14px 20px; border-radius:8px 8px 0 0; color:#ffffff; font-weight:800; font-size:1.1rem; letter-spacing:0.5px;">
            ${nombreEmpresa.toUpperCase()} · MESA DE CONSULTAS
          </div>
          <div style="padding:20px;">
            <h3 style="color:#0f172a; margin-top:0;">Hemos recibido tu consulta</h3>
            <p style="color:#475569; font-size:0.9rem;">
              Estimado(a) <strong>${ticket.nombre}</strong>, tu ticket de atención <strong>#${ticket.ticketId}</strong> ha sido ingresado en nuestro sistema.
            </p>
            <div style="background:#f8fafc; border-left:4px solid ${colorMarca}; padding:12px; margin:16px 0; border-radius:4px;">
              <p style="margin:0; font-size:0.85rem; color:#334155;"><strong>Materia / Trámite:</strong> ${ticket.tipo.toUpperCase()}</p>
              <p style="margin:4px 0 0; font-size:0.85rem; color:#334155;"><strong>Prioridad:</strong> ${ticket.urgencia.toUpperCase()}</p>
              ${ticket.pedidoRef ? `<p style="margin:4px 0 0; font-size:0.85rem; color:#334155;"><strong>Referencia:</strong> ${ticket.pedidoRef}</p>` : ''}
              <p style="margin:6px 0 0; font-size:0.85rem; color:#64748b;"><strong>Detalle:</strong> ${ticket.detalle}</p>
            </div>
            <p style="font-size:0.82rem; color:#64748b;">
              Un especialista del equipo revisará tu caso a la brevedad. Para urgencias, puedes escribir directo a WhatsApp al ${datosNegocio.telefonoMostrado || datosNegocio.whatsapp || ''}.
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
      console.log('[Soporte Wii] ✅ Notificación enviada por Cloudflare Worker');
    }
  } catch (err) {
    console.debug('[Soporte Wii] Despacho por correo en segundo plano:', err.message);
  }
}

/**
 * Crea una nueva solicitud / ticket en Local-First (0ms), Firestore soporte/{ticket_id} y Cloudflare Worker
 */
export async function crearTicket(datos = {}) {
  const user = getls('wiSmile') || (typeof window !== 'undefined' ? window.__WI_USER__ : null);
  const uid = user?.uid || user?.userId || 'anonimo';
  const now = Date.now();
  const ticketDocId = `ticket_${now}_${uid.slice(0, 4)}`;
  const ticketCodigo = generarCodigoTicket();

  const nuevoTicket = {
    id: ticketDocId,
    ticketId: ticketCodigo,
    userId: uid,
    usuario: user?.usuario || 'cliente',
    email: user?.email || datos.email || '',
    nombre: user?.nombre || datos.nombre || 'Cliente',
    celular: user?.celular || datos.celular || '',
    tipo: datos.tipo || (datosNegocio.modeloNegocio === 'servicios_y_asesorias' ? 'declaracion' : 'pedido'),
    urgencia: datos.urgencia || 'normal',
    asunto: datos.asunto || `Consulta de ${datos.tipo || 'Soporte'}`,
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

      console.log(`[Soporte Wii] ✅ Ticket registrado en soporte/${ticketDocId}`);
    } catch (err) {
      console.error('[Soporte Wii] ❌ Error al registrar ticket en Firestore:', err);
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
  const user = getls('wiSmile') || (typeof window !== 'undefined' ? window.__WI_USER__ : null);
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
          tipo: d.tipo || (datosNegocio.modeloNegocio === 'servicios_y_asesorias' ? 'declaracion' : 'pedido'),
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
    console.debug('[Soporte Wii] Sincronización remota omitida:', err.message);
  }
}
