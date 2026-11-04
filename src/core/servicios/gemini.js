// src/core/servicios/gemini.js
// Cliente general de Inteligencia Artificial con Google Gemini 2.5 Flash

const GEMINI_KEY = import.meta.env.PUBLIC_GEMINI_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

/**
 * Consulta general a Gemini 2.5 Flash
 * Soporta tanto objeto ({ prompt, systemInstruction }) como string directo (prompt)
 */
export async function consultarGemini(arg) {
  if (!GEMINI_KEY) {
    throw new Error('No se encontró la variable PUBLIC_GEMINI_KEY en el entorno (.env)');
  }

  const options = typeof arg === 'string' ? { prompt: arg } : (arg || {});
  const { prompt = '', systemInstruction = '', responseMimeType = 'text/plain' } = options;

  const textoPrompt = String(prompt || '').trim();
  if (!textoPrompt) {
    throw new Error('El prompt enviado a Gemini no puede estar vacío');
  }

  const payload = {
    contents: [
      {
        parts: [{ text: textoPrompt }]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: responseMimeType
    }
  };

  if (systemInstruction && String(systemInstruction).trim()) {
    payload.systemInstruction = {
      parts: [{ text: String(systemInstruction).trim() }]
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
 * Soporta tanto objeto ({ prompt, systemInstruction }) como string directo (prompt)
 */
export async function consultarJsonGemini(arg) {
  const options = typeof arg === 'string' ? { prompt: arg } : (arg || {});
  const { prompt = '', systemInstruction = '' } = options;

  const rawJsonText = await consultarGemini({
    prompt,
    systemInstruction,
    responseMimeType: 'application/json'
  });

  try {
    return JSON.parse(rawJsonText);
  } catch (err) {
    // Limpieza por si contiene bloques markdown ```json ... ```
    const cleaned = rawJsonText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    return JSON.parse(cleaned);
  }
}
