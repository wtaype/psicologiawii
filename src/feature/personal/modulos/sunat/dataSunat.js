// src/feature/personal/modulos/sunat/dataSunat.js
// 🎯 Capa de Datos Local-First de Comprobantes SUNAT
// Emisión ágil de Boletas (B001) y Facturas (F001) para servicios y asesorías
// 100% JS Nativo · Integrado con @widev y Firebase SDK

import { savels, getls } from '@widev';
import { db } from '@core/servicios/firebase.js';
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { obtenerDatosNegocio } from '../negocio/dataNegocio.js';
import comprobantesSemilla from '../../../../semillas/comprobantes.json';
import smilesSemilla from '../../../../semillas/smiles.json';

import productosSemilla from '../../../../semillas/productos.json';

export const STORAGE_KEY_COMPROBANTES = 'wi_sunat_comprobantes';
export const STORAGE_KEY_CLIENTES_CACHE = 'wi_crm_clientes';
export const COLECCION_COMPROBANTES = 'comprobantes';

// Catálogo de Ítems Predeterminados para 1 Clic (Derivado de productos.json)
export const SERVICIOS_SUNAT_RAPIDOS = Array.isArray(productosSemilla) && productosSemilla.length > 0
  ? productosSemilla.slice(0, 5).map(p => ({
      id: p.id,
      descripcion: typeof p.nombre === 'object' ? (p.nombre?.es || '') : (p.nombre || ''),
      precioUnitario: Number(p.precioPEN ?? p.precio ?? 0),
      categoria: p.tipoCategoria || p.tipo || 'general'
    }))
  : [];

let _memoriaComprobantes = null;

/**
 * Obtiene los comprobantes almacenados en local (o semilla inicial)
 */
export function obtenerComprobantesLocal() {
  if (_memoriaComprobantes && Array.isArray(_memoriaComprobantes) && _memoriaComprobantes.length > 0) {
    return _memoriaComprobantes;
  }

  try {
    const local = getls(STORAGE_KEY_COMPROBANTES);
    if (Array.isArray(local) && local.length > 0) {
      _memoriaComprobantes = local;
      return _memoriaComprobantes;
    }
  } catch (e) {}

  const iniciales = Array.isArray(comprobantesSemilla) && comprobantesSemilla.length > 0
    ? comprobantesSemilla
    : [];
  
  _memoriaComprobantes = iniciales;
  try {
    savels(STORAGE_KEY_COMPROBANTES, iniciales);
  } catch (e) {}

  return _memoriaComprobantes;
}

/**
 * Guarda la lista completa en local
 */
export function guardarComprobantesLocal(lista) {
  _memoriaComprobantes = lista;
  savels(STORAGE_KEY_COMPROBANTES, lista);
  return lista;
}

/**
 * Genera el siguiente correlativo para B001 o F001
 */
export function generarSiguienteCorrelativo(tipo = 'boleta') {
  const comprobantes = obtenerComprobantesLocal();
  const serie = tipo === 'factura' ? 'F001' : 'B001';
  const filtrados = comprobantes.filter(c => c.serie === serie);

  if (filtrados.length === 0) {
    return {
      serie,
      numero: '000101',
      serieNumero: `${serie}-000101`
    };
  }

  const numeros = filtrados.map(c => parseInt(c.numero || '0', 10)).filter(n => !isNaN(n));
  const max = Math.max(...numeros, 0);
  const nuevoNum = String(max + 1).padStart(6, '0');

  return {
    serie,
    numero: nuevoNum,
    serieNumero: `${serie}-${nuevoNum}`
  };
}

/**
 * Guarda un comprobante en local y Firestore
 */
export async function emitirYGuardarComprobante(comprobanteData) {
  const lista = obtenerComprobantesLocal();
  const correlativo = generarSiguienteCorrelativo(comprobanteData.tipo);

  const total = Number(comprobanteData.total || 0);
  const opGravada = Number((total / 1.18).toFixed(2));
  const igv = Number((total - opGravada).toFixed(2));

  const fechaActual = new Date();
  const opcionesFecha = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
  const fechaStr = fechaActual.toLocaleDateString('es-PE', opcionesFecha);

  const nuevo = {
    id: `comp_${Date.now()}`,
    tipo: comprobanteData.tipo || 'boleta',
    serie: correlativo.serie,
    numero: correlativo.numero,
    serieNumero: correlativo.serieNumero,
    fechaEmision: fechaStr,
    fechaISO: fechaActual.toISOString(),
    cliente: {
      nombre: comprobanteData.cliente?.nombre || 'Cliente General',
      documentoTipo: comprobanteData.cliente?.documentoTipo || (comprobanteData.tipo === 'factura' ? 'RUC' : 'DNI'),
      documento: comprobanteData.cliente?.documento || '',
      celular: comprobanteData.cliente?.celular || '',
      direccion: comprobanteData.cliente?.direccion || '',
      email: comprobanteData.cliente?.email || ''
    },
    items: Array.isArray(comprobanteData.items) && comprobanteData.items.length > 0 ? comprobanteData.items : [
      {
        id: SERVICIOS_SUNAT_RAPIDOS[0]?.id || 'item-general',
        descripcion: SERVICIOS_SUNAT_RAPIDOS[0]?.descripcion || 'Consumo / Suministro General',
        cantidad: 1,
        precioUnitario: total,
        subtotal: total
      }
    ],
    moneda: 'PEN',
    opGravada,
    igv,
    total,
    metodoPago: comprobanteData.metodoPago || 'Transferencia BCP',
    estado: 'pagado',
    observacion: comprobanteData.observacion || 'Comprobante emitido conforme a las normas de SUNAT.'
  };

  // 1. Guardar de inmediato en local (Local-First)
  lista.unshift(nuevo);
  guardarComprobantesLocal(lista);

  // 2. Persistir en Firestore en segundo plano
  try {
    if (db) {
      await setDoc(doc(db, COLECCION_COMPROBANTES, nuevo.id), {
        ...nuevo,
        actualizado: serverTimestamp()
      }, { merge: true });
    }
  } catch (err) {
    console.warn('[dataSunat] Error al guardar comprobante en Firestore:', err?.message || err);
  }

  return nuevo;
}

/**
 * Obtiene lista de clientes para autocompletado inteligente
 */
export function obtenerClientesSugerencias() {
  try {
    const guardados = getls(STORAGE_KEY_CLIENTES_CACHE);
    if (Array.isArray(guardados) && guardados.length > 0) return guardados;
  } catch (e) {}

  const lista = Array.isArray(smilesSemilla) ? smilesSemilla : [];
  return lista
    .filter(u => u.rol === 'cliente')
    .map(u => ({
      id: u.uid || u.id,
      nombre: u.razonSocial || `${u.nombre || ''} ${u.apellidos || ''}`.trim(),
      contacto: `${u.nombre || ''} ${u.apellidos || ''}`.trim(),
      documentoTipo: u.documentoTipo || 'RUC',
      documento: u.documento || '',
      celular: u.celular || '',
      email: u.email || '',
      direccion: u.direccion || (Array.isArray(u.direcciones) && u.direcciones[0] ? `${u.direcciones[0].calle}, ${u.direcciones[0].distrito}` : ''),
      regimenTributario: u.regimenTributario || '',
      servicioContratado: u.servicioContratado || '',
      honorarioPEN: u.honorarioPEN || 0,
      ultimoDigitoRuc: u.ultimoDigitoRuc ?? 0,
      estadoTributario: u.estadoTributario || 'al_dia',
      observaciones: u.observaciones || '',
      rol: 'cliente'
    }));
}

/**
 * Sincroniza comprobantes desde Firestore
 */
export async function sincronizarComprobantesFirestore() {
  try {
    if (!db) {
      return { ok: true, origen: 'local', datos: obtenerComprobantesLocal() };
    }

    const colRef = collection(db, COLECCION_COMPROBANTES);
    const snap = await getDocs(colRef);

    if (snap.empty) {
      const locales = obtenerComprobantesLocal();
      if (locales.length > 0) {
        for (const item of locales) {
          try {
            await setDoc(doc(db, COLECCION_COMPROBANTES, item.id), {
              ...item,
              actualizado: serverTimestamp()
            }, { merge: true });
          } catch (e) {}
        }
      }
      return { ok: true, origen: 'semilla_sembrada', datos: locales };
    }

    const remotos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    remotos.sort((a, b) => new Date(b.fechaISO || 0).getTime() - new Date(a.fechaISO || 0).getTime());
    guardarComprobantesLocal(remotos);
    return { ok: true, origen: 'firestore', datos: remotos };
  } catch (err) {
    console.warn('[dataSunat] Error al sincronizar comprobantes:', err?.message || err);
    return { ok: false, error: err?.message, datos: obtenerComprobantesLocal() };
  }
}

/**
 * Obtiene los datos del emisor
 */
export function obtenerDatosEmisor() {
  const negocio = obtenerDatosNegocio() || {};
  return {
    razonSocial: negocio.identidad?.nombre || '',
    nombreComercial: negocio.identidad?.nombreCorto || '',
    ruc: negocio.identidad?.ruc || '',
    direccion: negocio.ubicacion?.direccion || '',
    atencion: 'Atención Online y Presencial previa cita',
    telefono: negocio.contacto?.telefono || '',
    email: negocio.contacto?.email || ''
  };
}

export default {
  STORAGE_KEY_COMPROBANTES,
  COLECCION_COMPROBANTES,
  SERVICIOS_SUNAT_RAPIDOS,
  obtenerComprobantesLocal,
  guardarComprobantesLocal,
  emitirYGuardarComprobante,
  generarSiguienteCorrelativo,
  obtenerClientesSugerencias,
  sincronizarComprobantesFirestore,
  obtenerDatosEmisor
};
