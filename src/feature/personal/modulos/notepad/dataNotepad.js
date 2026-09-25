// src/feature/personal/modulos/notepad/dataNotepad.js
// Capa de Datos Local-First con Sincronización en Segundo Plano con Firestore
// Colección: 'notepad' · 100% JS Nativo · Integrado con @widev y @core

import { savels, getls, formatearFechaHora } from '@widev';
import { db } from '@core/servicios/firebase.js';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export const STORAGE_KEY = 'gaswii_owner_notes';
export const COLECCION_NOTEPAD = 'notepad';

export function getUsuarioActivo() {
  const u = getls('wiSmile') || {};
  return {
    userId: u.uid || u.id || '',
    email: u.email || '',
    autor: u.nombre || u.usuario || ''
  };
}

export function recortar10Palabras(txt = '') {
  const limpio = txt.replace(/[*_#>`~]/g, '').trim();
  const words = limpio.split(/\s+/).filter(Boolean);
  return words.length <= 10 ? words.join(' ') : words.slice(0, 10).join(' ') + '...';
}

function ordenarNotas(arr = []) {
  return [...arr].sort((a, b) => {
    if (a.pin !== b.pin) return a.pin ? -1 : 1;
    return (b.id || '').localeCompare(a.id || '');
  });
}

export function obtenerNotas() {
  const guardadas = getls(STORAGE_KEY);
  return Array.isArray(guardadas) ? ordenarNotas(guardadas) : [];
}

export function guardarNotasLocal(arr) {
  savels(STORAGE_KEY, ordenarNotas(arr));
}

export function guardarNotaData(input = {}) {
  const todas = obtenerNotas();
  const usuario = getUsuarioActivo();
  const fecha = formatearFechaHora(Date.now());
  const id = input.id || `n_${Date.now()}`;
  const idx = todas.findIndex(n => n.id === id);
  const esNueva = idx < 0;
  const existente = esNueva ? {} : todas[idx];

  const esListo = typeof input.listo === 'boolean'
    ? input.listo
    : (typeof input.done === 'boolean' ? input.done : (existente.listo || false));

  const nota = {
    ...existente,
    id,
    titulo: input.titulo || 'Nota sin título',
    contenido: input.contenido || '',
    tag: input.tag || existente.tag || 'Nota',
    pin: typeof input.pin === 'boolean' ? input.pin : Boolean(existente.pin),
    listo: esListo,
    links: Array.isArray(input.links) ? input.links : (existente.links || []),
    imagenes: Array.isArray(input.imagenes) ? input.imagenes : (existente.imagenes || []),
    userId: usuario.userId || existente.userId || '',
    email: usuario.email || existente.email || '',
    autor: usuario.autor || existente.autor || '',
    creado: esNueva ? fecha : (existente.creado || fecha),
    actualizado: fecha,
    resumen10: recortar10Palabras(input.contenido || input.titulo)
  };

  if (esNueva) todas.unshift(nota);
  else todas[idx] = nota;

  guardarNotasLocal(todas);
  sincronizarFirestore(nota, esNueva);
  return nota;
}

export function eliminarNotaData(id) {
  const todas = obtenerNotas().filter(n => n.id !== id);
  guardarNotasLocal(todas);
  eliminarFirestore(id);
  return todas;
}

export function togglePinNotaData(id) {
  return actualizarPropiedadNota(id, n => ({ pin: !n.pin }));
}

export function toggleListoNotaData(id) {
  return actualizarPropiedadNota(id, n => ({ listo: !n.listo }));
}

export const toggleDoneNotaData = toggleListoNotaData;

function actualizarPropiedadNota(id, updater) {
  const todas = obtenerNotas();
  const nota = todas.find(n => n.id === id);
  if (nota) {
    Object.assign(nota, updater(nota));
    guardarNotasLocal(todas);
    sincronizarFirestore(nota, false);
  }
  return obtenerNotas();
}

async function sincronizarFirestore(nota, esNueva = false) {
  if (!nota?.id || !db) return;
  try {
    const payload = {
      id: nota.id,
      titulo: nota.titulo,
      contenido: nota.contenido,
      tag: nota.tag,
      pin: Boolean(nota.pin),
      listo: Boolean(nota.listo),
      links: Array.isArray(nota.links) ? nota.links : [],
      imagenes: Array.isArray(nota.imagenes) ? nota.imagenes : [],
      userId: nota.userId,
      email: nota.email,
      autor: nota.autor,
      resumen10: nota.resumen10,
      actualizado: serverTimestamp()
    };
    if (esNueva) payload.creado = serverTimestamp();
    await setDoc(doc(db, COLECCION_NOTEPAD, nota.id), payload, { merge: true });
  } catch (err) {
    console.warn('[dataNotepad] Sync diferido Firestore:', err?.message || err);
  }
}

async function eliminarFirestore(id) {
  if (!id || !db) return;
  try {
    await deleteDoc(doc(db, COLECCION_NOTEPAD, id));
  } catch (err) {
    console.warn('[dataNotepad] Delete diferido Firestore:', err?.message || err);
  }
}
