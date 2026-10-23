// src/feature/personal/modulos/correo/dataCorreo.js
// 🎯 Capa de Datos Local-First de Envíos de Correo con Sincronización Firestore y Resend API
// Colección: 'correos' · Documento: 'correo_{timestamp}' · 100% JS Nativo · Integrado con @widev

import { savels, getls } from '@widev';
import { db } from '@core/servicios/firebase.js';
import { collection, doc, setDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { getUsuarioActivo } from '../negocio/dataNegocio.js';
import { datosNegocio } from '../../../../negocio.js';
import correosSemilla from '@/semillas/correos.json';

export const STORAGE_KEY = 'wi_correos_historial';
export const STORAGE_KEY_AJUSTES = 'wi_correo_ajustes';
export const STORAGE_KEY_RECIBIDOS = 'wi_correos_recibidos';
export const STORAGE_KEY_BORRADORES = 'wi_correos_borradores';
export const COLECCION_CORREOS = 'correos';

// Memoria volátil en sesión
let _memoriaCorreos = null;

/**
 * Obtiene los ajustes predeterminados de correo
 */
export function obtenerAjustesCorreo() {
  const guardado = getls(STORAGE_KEY_AJUSTES) || getls('minegocio_correo_ajustes');
  const negEmail = datosNegocio.email || '';
  const negDominio = negEmail.includes('@') ? negEmail.split('@')[1] : '';

  const emailGuardado = guardado?.remitenteEmail;
  const remitenteValido = emailGuardado || negEmail;

  const responderAGuardado = guardado?.responderA;
  const responderAValido = responderAGuardado || negEmail;

  return {
    remitenteNombre: guardado?.remitenteNombre || datosNegocio.nombreCorto || datosNegocio.nombre || '',
    remitenteEmail: remitenteValido,
    responderA: responderAValido,
    dominio: negDominio,
    workerUrl: guardado?.workerUrl || import.meta.env.PUBLIC_CORREO_WORKER || ''
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
  let emailPuro = limpiarEmail(email);
  if (!emailPuro) {
    emailPuro = datosNegocio.contacto?.email || datosNegocio.email || '';
  }
  const nombreFallback = datosNegocio.nombreCorto || datosNegocio.nombre || '';
  const nombrePuro = (nombre || nombreFallback).replace(/[<>]/g, '').trim();

  return `${nombrePuro} <${emailPuro}>`.trim();
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
    window.dispatchEvent(new CustomEvent('wi:correo-enviado', { detail: correo }));
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
  const ajustes = obtenerAjustesCorreo();
  const endpoint = ajustes.workerUrl || import.meta.env.PUBLIC_CORREO_WORKER || '';

  if (!apiKey && !endpoint) {
    throw new Error('Falta configurar RESEND_API_KEY o PUBLIC_CORREO_WORKER en las variables de entorno.');
  }

  if (!para) {
    throw new Error('Debes indicar al menos un correo de destinatario.');
  }

  if (!asunto) {
    throw new Error('El asunto del correo no puede estar vacío.');
  }

  const remitenteFinal = desde 
    ? (desde.includes('<') ? desde : `${ajustes.remitenteNombre} <${limpiarEmail(desde)}>`)
    : formatearRemitente(ajustes.remitenteNombre, ajustes.remitenteEmail);

  const responderAFinal = responderA 
    ? limpiarEmail(responderA) 
    : (limpiarEmail(ajustes.responderA) || datosNegocio.email || '');

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
    const endpoint = ajustes.workerUrl || import.meta.env.PUBLIC_CORREO_WORKER || '';
    if (!endpoint) {
      throw new Error('Falta configurar la variable PUBLIC_CORREO_WORKER en las variables de entorno (.env).');
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payloadResend)
    });

    respuestaResend = await res.json();

    if (!res.ok) {
      let errorMsg = respuestaResend?.message || `Error en Resend HTTP ${res.status}`;
      if (errorMsg.includes('Invalid `from` field') || errorMsg.includes('Invalid `to` field')) {
        errorMsg = 'Formato de remitente o destinatario no válido. Se espera un correo limpio.';
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
    autor: usuario.autor || datosNegocio.identidad?.especialista || datosNegocio.identidad?.nombre || 'Administrador',
    userId: usuario.userId || '',
    email: usuario.email || '',
    fecha: formatearFechaLegible(ahora),
    creado: serverTimestamp()
  };

  // 3. Guardar en caché local inmediatamente
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
    if (!err?.message?.includes('permission') && !err?.code?.includes('permission')) {
      console.warn('[dataCorreo] Error al leer historial de Firestore:', err?.message || err);
    }
  }

  return obtenerCorreos();
}

const RECIBIDOS_DEMO = Array.isArray(correosSemilla?.recibidos) && correosSemilla.recibidos.length > 0
  ? correosSemilla.recibidos
  : [];

/**
 * Obtiene las plantillas configuradas para el negocio
 */
export function obtenerPlantillasDisponibles() {
  return Array.isArray(correosSemilla?.plantillas) ? correosSemilla.plantillas : [];
}

/**
 * Obtiene el encabezado y subtítulo del módulo de correos
 */
export function obtenerMetadatosCorreo() {
  return {
    titulo: correosSemilla?.titulo || 'Centro de Correo & Notificaciones',
    subtitulo: correosSemilla?.subtitulo || 'Gestor oficial institucional de notificaciones, comprobantes y plantillas.'
  };
}

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
