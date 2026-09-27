// src/feature/inicio/lib/modales/test/chatwii.js
// 🎯 ChatWii: Integración con Google Gemini 2.5 Flash para Orientación Psicológica Empática
// Respaldo garantizado: si Gemini excede 2.8s o no hay red, conmuta a plantillas.js sin trabas.

import { consultarJsonGemini } from '../../../../../core/servicios/gemini.js';
import { obtenerPlantillaClinica } from './plantillas.js';
import { compilarResumenClinico } from './preguntas.js';
import { datosNegocio } from '../../../../../negocio.js';

/**
 * Genera la orientación terapéutica empática utilizando Gemini 2.5 Flash con fallback automático.
 * @param {Object} estado - Estado con las 7 respuestas del paciente
 * @param {string} [lang='es'] - Idioma ('es' o 'en')
 * @returns {Promise<Object>} Orientación clínica estructurada
 */
export async function generarOrientacionChatWii(estado, lang = 'es') {
  const esEn = lang === 'en';
  const r = estado.respuestas;
  const nombre = r.nombrePaciente?.trim() || (esEn ? 'Patient' : 'Paciente');
  const resumenRespuestas = compilarResumenClinico(estado);

  const fallback = obtenerPlantillaClinica(estado, lang);

  // Intentar consulta a Gemini con límite de tiempo de 2800ms
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout ChatWii')), 2800)
    );

    const promptIa = `Analiza las siguientes 7 respuestas de una persona que busca orientación psicológica:\n\n${resumenRespuestas}\n\nIdioma requerido: ${esEn ? 'English' : 'Spanish'}.\nNombre del paciente: ${nombre}.`;

    const systemInstruction = `Eres ChatWii, el asistente clínico y orientador empático de la Lic. Sofía Reynaga (Psicóloga Colegiada C.Ps.P. 49425, especialista en Psicoterapia Cognitivo Conductual y Terapia Sistémica Familiar en Consultorio Psicológico América).
Tu objetivo es devolver una orientación psicológica cálida, empática, validante y no juzgadora. No emitas diagnósticos psiquiátricos cerrados; en su lugar, valida sus emociones, explica el enfoque psicoterapéutico idóneo y cómo la Lic. Sofía le ayudará en su primera sesión.

Debes responder ÚNICAMENTE un objeto JSON válido con este esquema exacto:
{
  "tituloPerfil": "Título claro del perfil de orientación (ej: Perfil: Manejo de Ansiedad y Rumiación)",
  "enfoqueRecomendado": "Nombre del enfoque terapéutico idóneo",
  "resumenEmpatico": "Párrafo de 3 a 4 oraciones hablando directamente a ${nombre} con calidez, validando su esfuerzo y transmitiendo esperanza.",
  "puntosClave": [
    "Punto clínico clave 1 que se abordará en consulta",
    "Punto clínico clave 2 con herramientas prácticas",
    "Punto clínico clave 3 para recuperar el bienestar"
  ],
  "mensajeEspecialista": "Frase de cierre cálida mencionando cómo la Lic. Sofía Reynaga le acompañará."
}`;

    const aiPromise = consultarJsonGemini({
      prompt: promptIa,
      systemInstruction
    });

    const resultadoAi = await Promise.race([aiPromise, timeoutPromise]);

    if (resultadoAi && resultadoAi.tituloPerfil && resultadoAi.resumenEmpatico) {
      return armarRespuestaFinal(resultadoAi, estado, lang);
    }
  } catch (err) {
    // Falla silenciosa y controlada hacia plantillas clínicas profesionales
    console.info('ChatWii usando plantilla clínica validada (fallback transparente)');
  }

  return armarRespuestaFinal(fallback, estado, lang);
}

/**
 * Estructura el objeto final incluyendo el mensaje directo para WhatsApp
 */
function armarRespuestaFinal(datosOrientacion, estado, lang) {
  const esEn = lang === 'en';
  const r = estado.respuestas;
  const nombre = r.nombrePaciente?.trim() || (esEn ? 'Patient' : 'Paciente');
  const motivo = r.motivoTexto || r.motivoId || 'Consulta';
  const modalidad = r.modalidadTexto || r.modalidadId || 'Online';
  const turno = r.turnoTexto || r.turnoId || 'Horario a coordinar';

  const mensajeWhatsApp = esEn
    ? `Hello Lic. Sofía Reynaga, I just completed the Psychological Orientation Screening on your official website:\n\n` +
      `• Patient: ${nombre}\n` +
      `• Primary Challenge: ${motivo}\n` +
      `• Specific Sensation: ${r.sintomaTexto || r.sintomaId}\n` +
      `• Duration: ${r.tiempoTexto || r.tiempoId}\n` +
      `• Main Impact: ${r.impactoTexto || r.impactoId}\n` +
      `• Preferred Modality: ${modalidad}\n` +
      `• Preferred Time Slot: ${turno}\n` +
      `• Screening Result: ${datosOrientacion.tituloPerfil}\n\n` +
      `I would like to book an appointment with you based on this orientation profile.\n` +
      `*(Completed directly on your official website)*\n` +
      `Thank you very much.`
    : `Hola Lic. Sofía Reynaga, acabo de completar el Test de Orientación Psicológica en su página web oficial:\n\n` +
      `• Paciente: ${nombre}\n` +
      `• Motivo Principal: ${motivo}\n` +
      `• Síntoma / Situación: ${r.sintomaTexto || r.sintomaId}\n` +
      `• Tiempo de evolución: ${r.tiempoTexto || r.tiempoId}\n` +
      `• Área de mayor impacto: ${r.impactoTexto || r.impactoId}\n` +
      `• Modalidad de interés: ${modalidad}\n` +
      `• Horario preferido: ${turno}\n` +
      `• Perfil Orientativo: ${datosOrientacion.tituloPerfil}\n\n` +
      `Deseo agendar una sesión de consulta psicológica basada en este perfil.\n` +
      `*(Completé el test directamente en su página web oficial)*\n` +
      `Muchas gracias.`;

  const waUrl = `https://wa.me/${datosNegocio.whatsappLimpio}?text=${encodeURIComponent(mensajeWhatsApp)}`;

  return {
    ...datosOrientacion,
    mensajeWhatsApp,
    waUrl
  };
}

export default {
  generarOrientacionChatWii
};
