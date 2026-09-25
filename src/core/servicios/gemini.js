// src/core/servicios/gemini.js
// Cliente general de Inteligencia Artificial con Google Gemini 2.5 Flash

const GEMINI_KEY = import.meta.env.PUBLIC_GEMINI_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

/**
 * Consulta general a Gemini 2.5 Flash
 * @param {Object} options
 * @param {string} options.prompt - Prompt principal
 * @param {string} [options.systemInstruction] - Instrucción de sistema opcional
 * @param {string} [options.responseMimeType] - 'application/json' o 'text/plain'
 * @returns {Promise<string>} Texto devuelto por Gemini
 */
export async function consultarGemini({ prompt, systemInstruction = '', responseMimeType = 'text/plain' }) {
  if (!GEMINI_KEY) {
    throw new Error('No se encontró la variable PUBLIC_GEMINI_KEY en el entorno (.env)');
  }

  const payload = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: responseMimeType
    }
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const mensaje = errorData?.error?.message || response.statusText;
    throw new Error(`Error en API Gemini (${response.status}): ${mensaje}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Gemini no devolvió ninguna respuesta válida');
  }

  return rawText.trim();
}

/**
 * Consulta a Gemini forzando y parseando respuesta en formato JSON estructurado
 * @param {Object} options
 * @param {string} options.prompt - Prompt con requerimientos
 * @param {string} [options.systemInstruction] - Reglas estrictas
 * @returns {Promise<any>} Objeto JSON parseado
 */
export async function consultarJsonGemini({ prompt, systemInstruction = '' }) {
  const rawJsonText = await consultarGemini({
    prompt,
    systemInstruction,
    responseMimeType: 'application/json'
  });

  try {
    return JSON.parse(rawJsonText);
  } catch (err) {
    // Limpieza por si contiene bloques markdown ```json ... ```
    const cleaned = rawJsonText.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  }
}
