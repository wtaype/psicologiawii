// src/feature/personal/modulos/sunat/dataSunat.js
// 🎯 Capa de Datos Local-First de Comprobantes SUNAT (Solgas Surquillo)
// Emisión ágil de Boletas (B001) y Facturas (F001) + Integración con smiles (rol: cliente) y Firestore
// 100% JS Nativo · Integrado con @widev y Firebase SDK

import { savels, getls } from '@widev';
import { db } from '@core/servicios/firebase.js';
import { collection, getDocs, doc, setDoc, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { obtenerDatosNegocio } from '../negocio/dataNegocio.js';

export const STORAGE_KEY_COMPROBANTES = 'gaswii_sunat_comprobantes';
export const STORAGE_KEY_CLIENTES_CACHE = 'gaswii_clientes_sunat_cache';
export const COLECCION_COMPROBANTES = 'comprobantes';

// Datos semilla realistas iniciales para primera carga
const COMPROBANTES_INICIALES = [
  {
    id: 'comp_179032001',
    tipo: 'boleta',
    serie: 'B001',
    numero: '000481',
    serieNumero: 'B001-000481',
    fechaEmision: '24 Sep 2026, 07:15 pm',
    fechaISO: '2026-09-24T19:15:00',
    cliente: {
      nombre: 'Valeria Mendoza Castro',
      documentoTipo: 'DNI',
      documento: '47891234',
      celular: '987654321',
      direccion: 'Av. Angamos Este 1420, Dpto 402, Surquillo',
      email: 'valeria.mendoza@gmail.com'
    },
    items: [
      {
        id: 'prod_balon_10kg',
        descripcion: 'Balón SOLGAS Premium 10 kg',
        cantidad: 1,
        precioUnitario: 65.00,
        subtotal: 65.00
      }
    ],
    moneda: 'PEN',
    opGravada: 55.08,
    igv: 9.92,
    total: 65.00,
    metodoPago: 'Yape / Plin',
    estado: 'pagado',
    observacion: 'Entrega express con balanza y precinto verificado'
  },
  {
    id: 'comp_179032002',
    tipo: 'factura',
    serie: 'F001',
    numero: '000120',
    serieNumero: 'F001-000120',
    fechaEmision: '24 Sep 2026, 04:30 pm',
    fechaISO: '2026-09-24T16:30:00',
    cliente: {
      nombre: 'Inversiones Gastronómicas El Rincón Criollo S.A.C.',
      documentoTipo: 'RUC',
      documento: '20554897123',
      celular: '961229280',
      direccion: 'Av. Angamos Este 1240, Surquillo',
      email: 'administracion@rinconcriollo.pe'
    },
    items: [
      {
        id: 'prod_balon_45kg',
        descripcion: 'Balón SOLGAS Industrial 45 kg',
        cantidad: 2,
        precioUnitario: 220.00,
        subtotal: 440.00
      }
    ],
    moneda: 'PEN',
    opGravada: 372.88,
    igv: 67.12,
    total: 440.00,
    metodoPago: 'Transferencia BCP',
    estado: 'pagado',
    observacion: 'Abastecimiento de cocina comercial'
  },
  {
    id: 'comp_179032003',
    tipo: 'boleta',
    serie: 'B001',
    numero: '000482',
    serieNumero: 'B001-000482',
    fechaEmision: '25 Sep 2026, 02:40 am',
    fechaISO: '2026-09-25T02:40:00',
    cliente: {
      nombre: 'Carlos Ramos Peña',
      documentoTipo: 'DNI',
      documento: '71779978',
      celular: '936369384',
      direccion: 'Jr. Dante 345, Surquillo',
      email: 'carlos.ramos@gmail.com'
    },
    items: [
      {
        id: 'prod_balon_10kg',
        descripcion: 'Balón SOLGAS Premium 10 kg',
        cantidad: 1,
        precioUnitario: 65.00,
        subtotal: 65.00
      },
      {
        id: 'prod_regulador_clickon',
        descripcion: 'Regulador Premium Click-On',
        cantidad: 1,
        precioUnitario: 45.00,
        subtotal: 45.00
      }
    ],
    moneda: 'PEN',
    opGravada: 93.22,
    igv: 16.78,
    total: 110.00,
    metodoPago: 'Efectivo contra entrega',
    estado: 'pagado',
    observacion: 'Instalación gratuita incluida'
  }
];

// Clientes base para offline / primera carga
const CLIENTES_DEMO = [
  {
    uid: 'cli_01',
    nombre: 'Valeria Mendoza Castro',
    documentoTipo: 'DNI',
    documento: '47891234',
    celular: '987654321',
    direccion: 'Av. Angamos Este 1420, Dpto 402, Surquillo',
    email: 'valeria.mendoza@gmail.com'
  },
  {
    uid: 'cli_02',
    nombre: 'Inversiones Gastronómicas El Rincón Criollo S.A.C.',
    documentoTipo: 'RUC',
    documento: '20554897123',
    celular: '961229280',
    direccion: 'Av. Angamos Este 1240, Surquillo',
    email: 'administracion@rinconcriollo.pe'
  },
  {
    uid: 'cli_03',
    nombre: 'Carlos Ramos Peña',
    documentoTipo: 'DNI',
    documento: '71779978',
    celular: '936369384',
    direccion: 'Jr. Dante 345, Surquillo',
    email: 'carlos.ramos@gmail.com'
  }
];

/**
 * Formatea fecha legible en español
 */
export function formatearFecha(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
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
 * Obtiene la lista de comprobantes registrados (Local-First)
 */
export function obtenerComprobantes() {
  try {
    const local = getls(STORAGE_KEY_COMPROBANTES);
    if (Array.isArray(local) && local.length > 0) {
      return local;
    }
  } catch (e) {}

  savels(STORAGE_KEY_COMPROBANTES, COMPROBANTES_INICIALES);
  return COMPROBANTES_INICIALES;
}

/**
 * Calcula los totales tributarios conforme a SUNAT (IGV 18% incluido)
 */
export function calcularTotales(items = []) {
  const total = items.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);
  const totalRedondeado = Math.round(total * 100) / 100;
  const opGravada = Math.round((totalRedondeado / 1.18) * 100) / 100;
  const igv = Math.round((totalRedondeado - opGravada) * 100) / 100;

  return {
    opGravada: opGravada.toFixed(2),
    igv: igv.toFixed(2),
    total: totalRedondeado.toFixed(2)
  };
}

/**
 * Calcula el siguiente correlativo para Boleta o Factura
 */
export function obtenerSiguienteCorrelativo(tipo = 'boleta') {
  const lista = obtenerComprobantes();
  const serie = tipo === 'factura' ? 'F001' : 'B001';
  const filtrados = lista.filter(c => c.serie === serie);

  let maxNum = 0;
  filtrados.forEach(c => {
    const n = parseInt(c.numero, 10);
    if (!isNaN(n) && n > maxNum) maxNum = n;
  });

  const siguiente = maxNum + 1;
  const numeroStr = String(siguiente).padStart(6, '0');
  return {
    serie,
    numero: numeroStr,
    serieNumero: `${serie}-${numeroStr}`
  };
}

/**
 * Guarda un nuevo comprobante en local y sincroniza en segundo plano
 */
export function guardarComprobante(datos) {
  const lista = obtenerComprobantes();
  const id = datos.id || `comp_${Date.now()}`;
  const correlativo = obtenerSiguienteCorrelativo(datos.tipo);

  const nuevo = {
    ...datos,
    id,
    serie: correlativo.serie,
    numero: correlativo.numero,
    serieNumero: correlativo.serieNumero,
    fechaEmision: formatearFecha(new Date()),
    fechaISO: new Date().toISOString(),
    moneda: 'PEN',
    estado: datos.estado || 'pagado'
  };

  const actualizada = [nuevo, ...lista];
  savels(STORAGE_KEY_COMPROBANTES, actualizada);

  // Sincronización silenciosa con Firestore si hay conexión
  sincronizarComprobanteFirestore(nuevo).catch(() => {});

  return nuevo;
}

/**
 * Cambia el estado de un comprobante (ej: Anular)
 */
export function anularComprobante(id) {
  const lista = obtenerComprobantes();
  const actualizada = lista.map(c => c.id === id ? { ...c, estado: 'anulado' } : c);
  savels(STORAGE_KEY_COMPROBANTES, actualizada);
  return actualizada;
}

/**
 * Elimina un comprobante
 */
export function eliminarComprobante(id) {
  const lista = obtenerComprobantes();
  const filtrada = lista.filter(c => c.id !== id);
  savels(STORAGE_KEY_COMPROBANTES, filtrada);
  return filtrada;
}

/**
 * Obtiene la lista de clientes desde la colección smiles (filtrando estrictamente rol === 'cliente')
 */
export async function obtenerClientesDesdeSmiles() {
  try {
    // 1. Revisar caché local primero para velocidad instantánea
    const cache = getls(STORAGE_KEY_CLIENTES_CACHE);
    if (Array.isArray(cache) && cache.length > 0) {
      // Sincronizar en segundo plano sin bloquear
      fetchSmilesRemoto().catch(() => {});
      return cache;
    }

    // 2. Traer desde Firestore
    const remotos = await fetchSmilesRemoto();
    if (remotos && remotos.length > 0) {
      return remotos;
    }
  } catch (err) {
    console.warn('[dataSunat] Error al cargar smiles:', err);
  }

  // Fallback a clientes demo
  savels(STORAGE_KEY_CLIENTES_CACHE, CLIENTES_DEMO);
  return CLIENTES_DEMO;
}

/**
 * Petición a Firestore collection('smiles') filtrando únicamente rol: 'cliente'
 */
async function fetchSmilesRemoto() {
  if (!db) return null;
  try {
    const q = query(collection(db, 'smiles'), where('rol', '==', 'cliente'));
    const snap = await getDocs(q);
    const clientes = [];

    snap.forEach(docSnap => {
      const data = docSnap.data();
      const dirPrincipal = Array.isArray(data.direcciones) && data.direcciones.length > 0
        ? data.direcciones.find(d => d.esPrincipal) || data.direcciones[0]
        : null;

      clientes.push({
        uid: docSnap.id,
        nombre: (data.nombre ? `${data.nombre} ${data.apellidos || ''}` : data.razonSocial || data.usuario || 'Cliente').trim(),
        documentoTipo: data.documentoTipo || (data.documento && data.documento.length === 11 ? 'RUC' : 'DNI'),
        documento: data.documento || '',
        celular: data.celular || '',
        email: data.email || '',
        direccion: dirPrincipal ? `${dirPrincipal.calle || dirPrincipal.direccion || ''}, ${dirPrincipal.distrito || 'Surquillo'}`.trim() : (data.direccionFiscal || 'Surquillo, Lima')
      });
    });

    if (clientes.length > 0) {
      savels(STORAGE_KEY_CLIENTES_CACHE, clientes);
      return clientes;
    }
  } catch (err) {
    console.warn('[dataSunat] Firestore smiles query fallback:', err);
  }
  return null;
}

/**
 * Sincroniza un comprobante emitido en la colección Firestore 'comprobantes'
 */
async function sincronizarComprobanteFirestore(comp) {
  if (!db) return;
  try {
    const docRef = doc(db, COLECCION_COMPROBANTES, comp.id);
    await setDoc(docRef, {
      ...comp,
      creado: serverTimestamp(),
      actualizado: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.warn('[dataSunat] Sincronización Firestore en cola local:', e);
  }
}

/**
 * Genera el mensaje oficial para WhatsApp en 1 Clic
 */
export function generarMensajeWhatsApp(comp) {
  const negocio = obtenerDatosNegocio();
  const nombreEmpresa = negocio.nombre || 'Solgas Surquillo';
  const tipoNombre = comp.tipo === 'factura' ? 'Factura Electrónica' : 'Boleta de Venta Electrónica';

  let itemsTexto = comp.items.map(it => `• ${it.cantidad}x ${it.descripcion} (S/ ${Number(it.precioUnitario).toFixed(2)})`).join('\n');

  return `¡Hola ${comp.cliente?.nombre || 'Cliente'}! 👋
Te saludamos de *${nombreEmpresa}* (Jr. Dante 260).

Adjuntamos los datos de tu comprobante electrónico oficial:
📄 *${tipoNombre} N° ${comp.serieNumero}*
📅 Fecha: ${comp.fechaEmision}
👤 Cliente: ${comp.cliente?.nombre}
💳 Doc: ${comp.cliente?.documentoTipo || 'DNI'} ${comp.cliente?.documento || ''}

📦 *Detalle del Pedido:*
${itemsTexto}

💰 *Op. Gravada:* S/ ${comp.opGravada}
📊 *IGV (18%):* S/ ${comp.igv}
💵 *TOTAL PAGADO:* S/ ${comp.total} (${comp.metodoPago || 'Efectivo'})

Garantía oficial de planta con sello de seguridad. ¡Muchas gracias por tu preferencia! 🔥`.trim();
}
