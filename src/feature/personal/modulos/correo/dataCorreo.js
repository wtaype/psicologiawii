// src/feature/personal/modulos/correo/dataCorreo.js
// 🎯 Capa de Datos Local-First de Envíos de Correo con Sincronización Firestore y Resend API
// Colección: 'correos' · Documento: 'correo_{timestamp}' · 100% JS Nativo · Integrado con @widev

import { savels, getls } from '@widev';
import { db } from '@core/servicios/firebase.js';
import { collection, doc, setDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { getUsuarioActivo } from '../negocio/dataNegocio.js';

export const STORAGE_KEY = 'gaswii_correos_historial';
export const STORAGE_KEY_AJUSTES = 'gaswii_correo_ajustes';
export const STORAGE_KEY_RECIBIDOS = 'gaswii_correos_recibidos';
export const STORAGE_KEY_BORRADORES = 'gaswii_correos_borradores';
export const COLECCION_CORREOS = 'correos';

// Memoria volátil en sesión
let _memoriaCorreos = null;

/**
 * Obtiene los ajustes predeterminados de correo
 */
export function obtenerAjustesCorreo() {
  const guardado = getls(STORAGE_KEY_AJUSTES);
  return {
    remitenteNombre: guardado?.remitenteNombre || 'Solgas Surquillo',
    remitenteEmail: guardado?.remitenteEmail || 'pedidos@solgassurquillo.com',
    responderA: guardado?.responderA || 'pedidos@solgassurquillo.com',
    dominio: 'solgassurquillo.com'
  };
}

/**
 * Guarda los ajustes predeterminados de correo
 */
export function guardarAjustesCorreo(nuevos = {}) {
  const actual = obtenerAjustesCorreo();
  const actualizado = { ...actual, ...nuevos };
  savels(STORAGE_KEY_AJUSTES, actualizado);
  return actualizado;
}

/**
 * Obtiene la API Key de Resend (desde variables de entorno)
 */
function getResendApiKey() {
  return (
    import.meta.env.PUBLIC_RESEND_API_KEY ||
    import.meta.env.RESEND_API_KEY ||
    ''
  ).trim();
}

/**
 * Formatea una fecha a formato amigable en español: "21 Sep 2026, 12:38 pm"
 */
function formatearFechaLegible(dateObj = new Date()) {
  const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(d);
}

/**
 * Limpia y extrae una dirección de correo válida evitando símbolos extra o envoltorios erróneos
 */
export function limpiarEmail(str = '') {
  if (!str || typeof str !== 'string') return '';
  const match = str.match(/<([^>]+)>/);
  const email = (match ? match[1] : str).trim();
  return email.replace(/[<>\s]/g, '').trim();
}

/**
 * Formatea el remitente estrictamente bajo el estándar requerido por Resend:
 * "Nombre Remitente <email@dominio.com>"
 */
export function formatearRemitente(nombre = '', email = '') {
  const emailPuro = limpiarEmail(email) || 'pedidos@solgassurquillo.com';
  const nombrePuro = (nombre || 'Solgas Surquillo').replace(/[<>]/g, '').trim();

  // Asegurar que el dominio de salida coincida con el dominio autenticado
  const dominioValido = 'solgassurquillo.com';
  const emailFinal = emailPuro.toLowerCase().endsWith(`@${dominioValido}`)
    ? emailPuro
    : 'pedidos@solgassurquillo.com';

  return `${nombrePuro} <${emailFinal}>`;
}

/**
 * Obtiene el historial de correos enviados (Caché local primero, luego memoria)
 */
export function obtenerCorreos() {
  if (_memoriaCorreos) return _memoriaCorreos;

  try {
    const local = getls(STORAGE_KEY);
    if (Array.isArray(local)) {
      _memoriaCorreos = local;
      return _memoriaCorreos;
    }
  } catch (e) {}

  _memoriaCorreos = [];
  return _memoriaCorreos;
}

/**
 * Guarda un correo en la caché local
 */
export function guardarCorreoLocal(correo) {
  const actual = obtenerCorreos();
  // Evitar duplicados por ID
  const filtrados = actual.filter(c => c.id !== correo.id);
  const nuevoHistorial = [correo, ...filtrados];
  _memoriaCorreos = nuevoHistorial;
  savels(STORAGE_KEY, nuevoHistorial);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gaswii:correo-enviado', { detail: correo }));
  }
}

/**
 * Envía un correo electrónico a través de la API de Resend y lo registra en Firestore 'correos'
 */
export async function enviarCorreo({
  para,
  nombre = '',
  cc = [],
  asunto,
  tipo = 'general',
  mensaje = '',
  html = '',
  pedidoId = '',
  clienteId = '',
  desde = '',
  responderA = ''
} = {}) {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    throw new Error('Falta la clave RESEND_API_KEY en las variables de entorno.');
  }

  if (!para) {
    throw new Error('Debes indicar al menos un correo de destinatario.');
  }

  if (!asunto) {
    throw new Error('El asunto del correo no puede estar vacío.');
  }

  const ajustes = obtenerAjustesCorreo();
  const remitenteFinal = desde 
    ? (desde.includes('<') ? desde : `${ajustes.remitenteNombre} <${limpiarEmail(desde)}>`)
    : formatearRemitente(ajustes.remitenteNombre, ajustes.remitenteEmail);

  const responderAFinal = responderA 
    ? limpiarEmail(responderA) 
    : (limpiarEmail(ajustes.responderA) || 'pedidos@solgassurquillo.com');

  // Limpiar y asegurar formato de los destinatarios
  const rawDestinatarios = Array.isArray(para)
    ? para
    : [para];

  const destinatariosArray = rawDestinatarios
    .map(p => {
      const emailLimpio = limpiarEmail(p);
      return emailLimpio;
    })
    .filter(Boolean);

  if (destinatariosArray.length === 0) {
    throw new Error('El correo del destinatario no tiene un formato válido.');
  }

  // Limpiar y asegurar formato de las copias (CC)
  const rawCc = Array.isArray(cc)
    ? cc
    : (typeof cc === 'string' && cc ? cc.split(',') : []);

  const ccArray = rawCc
    .map(c => limpiarEmail(c))
    .filter(Boolean);

  // 1. Enviar a través de la API REST oficial de Resend
  const payloadResend = {
    from: remitenteFinal,
    to: destinatariosArray,
    subject: asunto,
    html: html || `<p>${mensaje.replace(/\n/g, '<br/>')}</p>`
  };

  if (ccArray.length > 0) {
    payloadResend.cc = ccArray;
  }
  if (responderAFinal) {
    payloadResend.reply_to = responderAFinal;
  }

  let respuestaResend = null;
  try {
    // Conexión directa al Microservicio Autónomo de Cloudflare Worker
    // Maneja CORS, llamadas seguras a Resend y es reutilizable para cualquier negocio
    const endpoint = 'https://gaswii-correo.lourdesinformatica10.workers.dev/enviar';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payloadResend)
    });

    respuestaResend = await res.json();

    if (!res.ok) {
      let errorMsg = respuestaResend?.message || `Error en Resend HTTP ${res.status}`;
      if (errorMsg.includes('Invalid `from` field') || errorMsg.includes('Invalid `to` field')) {
        errorMsg = 'Formato de remitente o destinatario no válido. Se espera un correo limpio.';
      } else if (errorMsg.includes('not verified')) {
        errorMsg = 'El dominio de envío debe ser solgassurquillo.com (verificado en Resend).';
      }
      throw new Error(errorMsg);
    }
  } catch (err) {
    console.error('[dataCorreo] Error al enviar con Resend:', err);
    throw err;
  }

  // 2. Preparar documento oficial para Firestore con campos raíz limpios
  const ahora = new Date();
  const timestamp = ahora.getTime();
  const docId = `correo_${timestamp}`;
  const usuario = getUsuarioActivo();

  const registroCorreo = {
    id: docId,
    resendId: respuestaResend?.id || '',
    estado: 'enviado',
    destinatario: {
      para: destinatariosArray.join(', '),
      nombre: nombre || '',
      cc: ccArray
    },
    remitente: {
      desde,
      responderA
    },
    mensaje: {
      asunto,
      tipo,
      resumen: mensaje ? mensaje.substring(0, 90) : asunto,
      html: html || ''
    },
    relacion: {
      pedidoId: pedidoId || '',
      clienteId: clienteId || ''
    },
    autor: usuario.autor || 'Personal Solgas',
    userId: usuario.userId || '',
    email: usuario.email || '',
    fecha: formatearFechaLegible(ahora),
    creado: serverTimestamp()
  };

  // 3. Guardar en caché local inmediatamente (0ms UI feedback)
  guardarCorreoLocal({
    ...registroCorreo,
    creado: timestamp
  });

  // 4. Guardar en Firestore en segundo plano (asíncrono)
  if (db) {
    setDoc(doc(db, COLECCION_CORREOS, docId), registroCorreo).catch(err => {
      console.warn('[dataCorreo] Error al sincronizar con Firestore:', err?.message || err);
    });
  }

  return registroCorreo;
}

/**
 * Carga los correos más recientes desde Firestore y actualiza la caché local
 */
export async function sincronizarCorreosDesdeFirestore() {
  if (!db) return obtenerCorreos();

  try {
    const q = query(
      collection(db, COLECCION_CORREOS),
      orderBy('creado', 'desc'),
      limit(50)
    );

    const snap = await getDocs(q);
    if (!snap.empty) {
      const remotos = snap.docs.map(d => {
        const data = d.data();
        let fechaFormateada = data.fecha;
        if (!fechaFormateada && data.creado?.seconds) {
          fechaFormateada = formatearFechaLegible(new Date(data.creado.seconds * 1000));
        }
        return {
          ...data,
          id: d.id,
          fecha: fechaFormateada || 'Reciente'
        };
      });

      _memoriaCorreos = remotos;
      savels(STORAGE_KEY, remotos);
      return remotos;
    }
  } catch (err) {
    console.warn('[dataCorreo] Error al leer historial de Firestore:', err?.message || err);
  }

  return obtenerCorreos();
}

const RECIBIDOS_DEMO = [
  {
    id: 'rec_101',
    carpeta: 'recibidos',
    estado: 'recibido',
    leido: false,
    destinatario: { para: 'pedidos@solgassurquillo.com', nombre: 'Solgas Surquillo' },
    remitente: { desde: 'Valeria Mendoza <valeria.mendoza@gmail.com>', responderA: 'valeria.mendoza@gmail.com' },
    mensaje: {
      asunto: '🔥 Consulta: Balón de 10kg con válvula click-on para Surquillo',
      tipo: 'pedido',
      resumen: 'Buenas tardes, quisiera saber si tienen disponible el balón de 10kg con válvula click-on para entrega en Jr. Dante hoy...',
      html: '<div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #1e293b;"><h2 style="color: #ff6a00; margin-top: 0;">Consulta de Balón 10kg - Surquillo</h2><p>Buenas tardes Solgas Surquillo,</p><p>He visto en su página web que ofrecen entrega en 15-20 minutos con verificación de balanza digital.</p><p>Quisiera confirmar si tienen stock del <strong>Balón SOLGAS Premium 10 kg con válvula Click-On (S/ 65.00)</strong> para despachar hoy a las 5:00 p.m. a <strong>Jr. Dante 260, Dpto 301, Surquillo</strong>.</p><p>Pagaría con Yape contra entrega. Quedo atenta a su confirmación.</p><p>Saludos cordiales,<br/><strong>Valeria Mendoza</strong><br/>📱 987 654 321</p></div>'
    },
    fecha: 'Hoy, 02:45 p. m.'
  },
  {
    id: 'rec_102',
    carpeta: 'recibidos',
    estado: 'recibido',
    leido: false,
    destinatario: { para: 'pedidos@solgassurquillo.com', nombre: 'Solgas Surquillo' },
    remitente: { desde: 'Restaurante El Rincón Criollo <administracion@rinconcriollo.pe>', responderA: 'administracion@rinconcriollo.pe' },
    mensaje: {
      asunto: '📄 Solicitud de Factura Electrónica por 2x Balones 45kg',
      tipo: 'comprobante',
      resumen: 'Estimados, adjuntamos datos de nuestra empresa para la emisión de la factura de los 2 balones industriales de 45kg...',
      html: '<div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #1e293b;"><h2 style="color: #ff6a00; margin-top: 0;">Solicitud de Factura Comercial</h2><p>Estimados amigos de Solgas Surquillo,</p><p>Por favor emitir la factura correspondiente al suministro de gas de esta semana:</p><ul><li><strong>Razón Social:</strong> Inversiones Gastronómicas El Rincón Criollo S.A.C.</li><li><strong>RUC:</strong> 20554897123</li><li><strong>Dirección:</strong> Av. Angamos Este 1240, Surquillo</li><li><strong>Pedido:</strong> 2x Balones Solgas 45 kg (Total S/ 460.00)</li></ul><p>Enviar el PDF y XML a este correo para el área contable. Muchas gracias.</p><p>Atentamente,<br/><strong>Gerencia de Operaciones</strong></p></div>'
    },
    fecha: 'Ayer, 06:10 p. m.'
  },
  {
    id: 'rec_103',
    carpeta: 'recibidos',
    estado: 'recibido',
    leido: true,
    destinatario: { para: 'pedidos@solgassurquillo.com', nombre: 'Solgas Surquillo' },
    remitente: { desde: 'OSINERGMIN Notificaciones <notificaciones@osinergmin.gob.pe>', responderA: 'notificaciones@osinergmin.gob.pe' },
    mensaje: {
      asunto: '🛡️ Certificación de Distribuidor Autorizado Reg. 208492 Conforme',
      tipo: 'general',
      resumen: 'Notificación oficial de cumplimiento de estándares de seguridad y balanza calibrada para el local de Jr. Dante 260...',
      html: '<div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #1e293b;"><h2 style="color: #0284c7; margin-top: 0;">Notificación Oficial OSINERGMIN</h2><p>Estimado Distribuidor Autorizado Solgas (Reg. 208492),</p><p>Se deja constancia del registro conforme de la inspección técnica realizada en el local de <strong>Jr. Dante 260, Surquillo</strong>.</p><p>Se verificó el cumplimiento de las condiciones de seguridad en cilindros de GLP, precintos termocontraíbles inviolables y control de pesaje digital.</p><p>Atentamente,<br/><strong>Organismo Supervisor de la Inversión en Energía y Minería (OSINERGMIN)</strong></p></div>'
    },
    fecha: '23 Sep, 11:20 a. m.'
  }
];

/**
 * Obtiene la lista de correos recibidos (inbox)
 */
export function obtenerRecibidos() {
  try {
    const local = getls(STORAGE_KEY_RECIBIDOS);
    if (Array.isArray(local) && local.length > 0) {
      return local;
    }
  } catch (e) {}

  savels(STORAGE_KEY_RECIBIDOS, RECIBIDOS_DEMO);
  return RECIBIDOS_DEMO;
}

/**
 * Marca un correo como leído
 */
export function marcarCorreoLeido(id) {
  const recibidos = obtenerRecibidos();
  const actualizados = recibidos.map(r => r.id === id ? { ...r, leido: true } : r);
  savels(STORAGE_KEY_RECIBIDOS, actualizados);
  return actualizados;
}

/**
 * Obtiene la lista de borradores
 */
export function obtenerBorradores() {
  try {
    const local = getls(STORAGE_KEY_BORRADORES);
    if (Array.isArray(local)) return local;
  } catch (e) {}
  return [];
}

/**
 * Guarda o actualiza un borrador
 */
export function guardarBorrador(borrador) {
  const actuales = obtenerBorradores();
  const id = borrador.id || `draft_${Date.now()}`;
  const filtrados = actuales.filter(b => b.id !== id);
  const nuevo = {
    ...borrador,
    id,
    carpeta: 'borradores',
    fecha: 'Borrador guardado: ' + formatearFechaLegible(new Date())
  };
  const list = [nuevo, ...filtrados];
  savels(STORAGE_KEY_BORRADORES, list);
  return nuevo;
}

/**
 * Elimina un borrador
 */
export function eliminarBorrador(id) {
  const actuales = obtenerBorradores();
  const filtrados = actuales.filter(b => b.id !== id);
  savels(STORAGE_KEY_BORRADORES, filtrados);
  return filtrados;
}

/**
 * Elimina un correo de cualquier carpeta
 */
export function eliminarCorreoPorCarpeta(id, carpeta = 'enviados') {
  if (carpeta === 'borradores') {
    return eliminarBorrador(id);
  }
  if (carpeta === 'recibidos') {
    const actuales = obtenerRecibidos();
    const filtrados = actuales.filter(c => c.id !== id);
    savels(STORAGE_KEY_RECIBIDOS, filtrados);
    return filtrados;
  }
  // Enviados
  const actuales = obtenerCorreos();
  const filtrados = actuales.filter(c => c.id !== id);
  _memoriaCorreos = filtrados;
  savels(STORAGE_KEY, filtrados);
  return filtrados;
}

