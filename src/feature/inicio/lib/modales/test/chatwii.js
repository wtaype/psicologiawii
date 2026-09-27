// src/feature/inicio/lib/modales/test/chatwii.js
// 🎯 ChatWii: Asistente Clínico Inteligente con Gemini 2.5 Flash y Fallback Empático Inmediato

import { consultarGemini } from '../../../../../core/servicios/gemini.js';
import { generarDevolucionEmpatica, obtenerPlantillaDerivacion } from './plantillas.js';
import { datosNegocio } from '../../../../../negocio.js';

/**
 * Genera la respuesta empática en vivo (Preview) cuando el paciente elige una emoción o escribe en el textarea
 * @param {Object} datos - { emocionId, emocionTexto, desahogo, tiempo }
 * @param {string} [lang='es'] - Idioma ('es' o 'en')
 * @returns {Promise<string>} Mensaje empático
 */
export async function solicitarDevolucionChatWii(datos = {}, lang = 'es') {
  const esEn = lang === 'en';
  const fallback = generarDevolucionEmpatica(datos, lang);

  // Si no hay desahogo escrito y solo hay emoción, el fallback es instantáneo y perfecto
  if (!datos.desahogo || datos.desahogo.trim().length < 5) {
    return fallback;
  }

  // Intentar consultar a Gemini Flash con timeout estricto de 2.2 segundos para no demorar la UI
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout ChatWii')), 2200)
    );

    const promptIa = `El paciente está completando el test de orientación psicológica y comparte lo siguiente:
- Estado actual: ${datos.emocionTexto || datos.emocionId}
- Desahogo libre: "${datos.desahogo.trim()}"
- Tiempo de evolución: ${datos.tiempo || 'Reciente'}
Idioma requerido: ${esEn ? 'English' : 'Spanish'}.

REGLAS OBLIGATORIAS DE ESTRUCTURA EN DOS PÁRRAFOS:
1. PÁRRAFO 1 (Comprensión + Concepto):
   - Inicia con una apertura empática, natural y variada (evita fórmulas clichés repetitivas como "Te entiendo y te comprendo"). Usa frases diversas y profundas como: "Abrazo tu dolor...", "Sé lo abrumador que resulta...", "Valoro que te permitas expresar esto...", "Comprendo el cansancio silencioso de...", "Reconozco el peso de...", "Acompaño tu sentir con profundo respeto..." (en inglés: "I hold what you are experiencing with deep compassion...", "I recognize how heavy...", "I honor your courage...").
   - Cita directamente el motivo exacto que seleccionó (${datos.emocionTexto || datos.emocionId}) y lo que expresó en su desahogo. Explica con cercanía y tacto humano qué le ocurre internamente y por qué duele, desgasta o genera tanta angustia ese problema específico.
2. PÁRRAFO 2 (Esperanza y Acompañamiento):
   - Vuelve a hacer referencia directa a esa vivencia específica (ej. "esta pérdida tan significativa", "este desánimo", "este agotamiento mental", "este sobrepensamiento").
   - Transmite un mensaje sincero de esperanza: no tiene que apresurarse ni resolverlo a solas; con la psicoterapia y la Lic. Sofía Reynaga irá sanando y recuperando la calma y la claridad paso a paso.
Separa ambos párrafos con un salto doble de línea exacto (\\n\\n).`;

    const systemInstruction = `Eres ChatWii, el asistente clínico y orientador empático de la Lic. Sofía Reynaga (Psicóloga Colegiada C.Ps.P. 49425). Tu tono es cálido, humano, compasivo y esperanzador, sin fórmulas trilladas ni frases repetitivas.`;

    const aiPromise = consultarGemini({
      prompt: promptIa,
      systemInstruction,
      responseMimeType: 'text/plain'
    });

    const resultadoTexto = await Promise.race([aiPromise, timeoutPromise]);
    if (resultadoTexto && resultadoTexto.length > 20) {
      return resultadoTexto.trim();
    }
  } catch (err) {
    // Falla silenciosa hacia el análisis heurístico de plantillas.js
  }

  return fallback;
}

/**
 * Construye el mensaje estructurado de WhatsApp para derivar el caso a la Lic. Sofía Reynaga
 * @param {Object} datos - Datos completos de Etapa 1 y Etapa 2
 * @param {Object} t - Diccionario de textos
 * @returns {string} URL de WhatsApp con texto prellenado
 */
export function construirUrlWhatsApp(datos = {}, t = {}) {
  const nombre = datos.nombre?.trim() || 'Paciente';
  const celular = datos.celular?.trim() || '';
  const correo = datos.correo?.trim() || '';
  const estado = datos.emocionTexto || datos.emocionId || 'Consulta';
  const desahogo = datos.desahogo?.trim() ? `"${datos.desahogo.trim()}"` : 'Prefirió coordinarlo en sesión';
  const tiempo = datos.tiempo || 'Por coordinar';
  const modalidad = datos.modalidad || '💻 Online';
  const fecha = datos.fecha || 'Por coordinar';
  const hora = datos.hora || 'Por coordinar';
  const orientacion = datos.devolucionEmpatica || 'Orientación Terapéutica Personalizada';

  const mensaje = `${t.waSaludo}\n\n` +
    `${t.waPaciente} ${nombre}\n` +
    (celular ? `${t.waCelular} ${celular}\n` : '') +
    (correo ? `${t.waCorreo} ${correo}\n` : '') +
    `${t.waEstado} ${estado}\n` +
    `${t.waDesahogo} ${desahogo}\n` +
    `${t.waTiempo} ${tiempo}\n` +
    `${t.waModalidad} ${modalidad}\n` +
    `${t.waFecha} ${fecha}\n` +
    `${t.waHora} ${hora}\n\n` +
    `• ${t.resumenEspecialista || 'Orientación preliminar:'}\n"${orientacion.slice(0, 160)}..."\n\n` +
    `${t.waPregunta}\n` +
    `${t.waAtribucion}\n` +
    `${t.waDespedida}`;

  return `https://wa.me/${datosNegocio.whatsappLimpio}?text=${encodeURIComponent(mensaje)}`;
}

export default {
  solicitarDevolucionChatWii,
  construirUrlWhatsApp
};
