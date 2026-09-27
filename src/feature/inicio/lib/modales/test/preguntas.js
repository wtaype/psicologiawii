// src/feature/inicio/lib/modales/test/preguntas.js
// 🎯 Motor de las 7 Preguntas Ramificadas del Test de Orientación Psicológica

export const TOTAL_PASOS = 7;

export function crearEstadoTest() {
  return {
    pasoActual: 1,
    respuestas: {
      motivoId: 'ansiedad',
      motivoTexto: '',
      motivoEmpathy: '',
      sintomaId: '',
      sintomaTexto: '',
      sintomaEmpathy: '',
      tiempoId: '',
      tiempoTexto: '',
      tiempoEmpathy: '',
      impactoId: '',
      impactoTexto: '',
      impactoEmpathy: '',
      experienciaId: '',
      experienciaTexto: '',
      experienciaEmpathy: '',
      modalidadId: '',
      modalidadTexto: '',
      modalidadEmpathy: '',
      turnoId: 'tarde',
      turnoTexto: '',
      nombrePaciente: ''
    }
  };
}

/**
 * Obtiene los datos de la pregunta actual según el idioma y la ramificación
 * @param {Object} textos - Diccionario resuelto (es/en)
 * @param {Object} estado - Estado actual del test
 * @returns {Object} Configuración del paso
 */
export function resolverPasoActual(textos, estado) {
  const { pasoActual, respuestas } = estado;
  const motivoRama = respuestas.motivoId || 'ansiedad';

  switch (pasoActual) {
    case 1:
      return {
        paso: 1,
        claveRespuesta: 'motivo',
        titulo: textos.p1.titulo,
        sub: textos.p1.sub,
        opciones: textos.p1.opciones,
        valorActual: respuestas.motivoId
      };

    case 2: {
      const rama = textos.p2[motivoRama] || textos.p2.ansiedad;
      return {
        paso: 2,
        claveRespuesta: 'sintoma',
        titulo: rama.titulo,
        sub: rama.sub,
        opciones: rama.opciones,
        valorActual: respuestas.sintomaId
      };
    }

    case 3:
      return {
        paso: 3,
        claveRespuesta: 'tiempo',
        titulo: textos.p3.titulo,
        sub: textos.p3.sub,
        opciones: textos.p3.opciones,
        valorActual: respuestas.tiempoId
      };

    case 4:
      return {
        paso: 4,
        claveRespuesta: 'impacto',
        titulo: textos.p4.titulo,
        sub: textos.p4.sub,
        opciones: textos.p4.opciones,
        valorActual: respuestas.impactoId
      };

    case 5:
      return {
        paso: 5,
        claveRespuesta: 'experiencia',
        titulo: textos.p5.titulo,
        sub: textos.p5.sub,
        opciones: textos.p5.opciones,
        valorActual: respuestas.experienciaId
      };

    case 6:
      return {
        paso: 6,
        claveRespuesta: 'modalidad',
        titulo: textos.p6.titulo,
        sub: textos.p6.sub,
        opciones: textos.p6.opciones,
        valorActual: respuestas.modalidadId
      };

    case 7:
      return {
        paso: 7,
        tipo: 'formulario_final',
        titulo: textos.p7.titulo,
        sub: textos.p7.sub,
        lblNombre: textos.p7.lblNombre,
        placeholderNombre: textos.p7.placeholderNombre,
        lblTurno: textos.p7.lblTurno,
        turnos: textos.p7.turnos,
        empathy: textos.p7.empathy,
        nombreActual: respuestas.nombrePaciente,
        turnoActual: respuestas.turnoId
      };

    default:
      return null;
  }
}

/**
 * Valida si el paciente ha seleccionado una opción para avanzar
 * @param {Object} estado
 * @returns {boolean}
 */
export function puedeAvanzar(estado) {
  const { pasoActual, respuestas } = estado;
  switch (pasoActual) {
    case 1: return Boolean(respuestas.motivoId);
    case 2: return Boolean(respuestas.sintomaId);
    case 3: return Boolean(respuestas.tiempoId);
    case 4: return Boolean(respuestas.impactoId);
    case 5: return Boolean(respuestas.experienciaId);
    case 6: return Boolean(respuestas.modalidadId);
    case 7: return Boolean(respuestas.turnoId);
    default: return false;
  }
}

/**
 * Compila un resumen claro y estructurado de las 7 respuestas
 * @param {Object} estado
 * @returns {string} Resumen para prompt y para WhatsApp
 */
export function compilarResumenClinico(estado) {
  const r = estado.respuestas;
  return (
    `1. Motivo: ${r.motivoTexto || r.motivoId}\n` +
    `2. Síntomas / Enfoque: ${r.sintomaTexto || r.sintomaId}\n` +
    `3. Tiempo de evolución: ${r.tiempoTexto || r.tiempoId}\n` +
    `4. Área más afectada: ${r.impactoTexto || r.impactoId}\n` +
    `5. Experiencia previa: ${r.experienciaTexto || r.experienciaId}\n` +
    `6. Modalidad deseada: ${r.modalidadTexto || r.modalidadId}\n` +
    `7. Horario preferido: ${r.turnoTexto || r.turnoId}\n` +
    `Paciente: ${r.nombrePaciente || 'Por coordinar'}`
  );
}

export default {
  TOTAL_PASOS,
  crearEstadoTest,
  resolverPasoActual,
  puedeAvanzar,
  compilarResumenClinico
};
