// src/feature/inicio/lib/modales/modalHero.js
// 🎯 Padre Orquestador de Modales Interactivos del Hero (Agendar y Test)
// Coordina el estado compartido del motivo activo, transiciones fluidas y eventos globales.

import { obtenerIdiomaActivo } from './idioma/idioma.js';

let motivoActivo = '';

/**
 * Guarda o recupera el motivo seleccionado por el paciente en el Hero o navegación.
 * @param {string} [nuevoMotivo] - Nuevo motivo a registrar
 * @returns {string} Motivo activo
 */
export function syncMotivoHero(nuevoMotivo = null) {
  if (nuevoMotivo !== null) {
    motivoActivo = nuevoMotivo;
    try {
      localStorage.setItem('psicologia_motivo_activo', nuevoMotivo);
    } catch (e) {}
  } else if (!motivoActivo) {
    try {
      motivoActivo = localStorage.getItem('psicologia_motivo_activo') || '';
    } catch (e) {}
  }
  return motivoActivo;
}

/**
 * Abre el modal de agendamiento bajo demanda
 * @param {string|null} [motivo=null]
 */
export async function abrirModalAgendar(motivo = null) {
  const finalMotivo = motivo || syncMotivoHero();
  const { abrirModalAgendar: abrir } = await import('./agendar/agendar.js');
  abrir(finalMotivo);
}

/**
 * Cierra el modal de agendamiento
 */
export async function cerrarModalAgendar() {
  const { cerrarModalAgendar: cerrar } = await import('./agendar/agendar.js');
  cerrar();
}

/**
 * Abre el modal de test de orientación empático bajo demanda
 * @param {string|null} [motivo=null]
 */
export async function abrirModalTest(motivo = null) {
  const finalMotivo = motivo || syncMotivoHero();
  const { abrirModalTest: abrir } = await import('./test/test.js');
  abrir(finalMotivo);
}

/**
 * Cierra el modal de test
 */
export async function cerrarModalTest() {
  const { cerrarModalTest: cerrar } = await import('./test/test.js');
  cerrar();
}

/**
 * Conecta el resultado de un test finalizado con el modal de agendamiento
 * @param {Object} datosTest - Datos y diagnóstico generados por el test
 */
export async function transferirTestAAgendar(datosTest = {}) {
  await cerrarModalTest();
  const { prellenarYAgendar } = await import('./agendar/agendar.js');
  if (typeof prellenarYAgendar === 'function') {
    prellenarYAgendar(datosTest);
  } else {
    abrirModalAgendar(datosTest.motivoId || null);
  }
}

// Registro global
if (typeof window !== 'undefined') {
  window.abrirModalAgendar = abrirModalAgendar;
  window.cerrarModalAgendar = cerrarModalAgendar;
  window.abrirModalTest = abrirModalTest;
  window.cerrarModalTest = cerrarModalTest;
  window.modalHero = {
    syncMotivoHero,
    abrirModalAgendar,
    cerrarModalAgendar,
    abrirModalTest,
    cerrarModalTest,
    transferirTestAAgendar,
    obtenerIdiomaActivo
  };
}

export default {
  syncMotivoHero,
  abrirModalAgendar,
  cerrarModalAgendar,
  abrirModalTest,
  cerrarModalTest,
  transferirTestAAgendar
};
