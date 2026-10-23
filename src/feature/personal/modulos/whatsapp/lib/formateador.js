// src/feature/personal/modulos/whatsapp/lib/formateador.js
// Funciones puras de formateo, interpolación y limpieza de mensajes WhatsApp
// Cero dependencias externas · 100% JS Nativo

/**
 * Retorna el saludo natural de acuerdo a la hora del día en Perú
 */
export function obtenerSaludoHora() {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 12) return 'Buenos días';
  if (hora >= 12 && hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/**
 * Sanitiza y limpia el espaciado de un mensaje para evitar mensajes inflados:
 * - Convierte saltos triples o más en máximo doble salto.
 * - Limpia espacios en blanco iniciales o finales en cada línea.
 */
export function sanitizarEspaciado(texto = '') {
  if (typeof texto !== 'string') return '';
  return texto
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Sustituye variables {clave} en una plantilla con los valores provistos
 * @param {string} plantilla - Texto con formato {variable}
 * @param {Object} valores - Diccionario con los datos reales
 */
export function interpolarTexto(plantilla = '', valores = {}) {
  if (typeof plantilla !== 'string') return '';
  let resultado = plantilla;

  for (const [clave, valor] of Object.entries(valores)) {
    if (valor !== undefined && valor !== null) {
      const regex = new RegExp(`\\{${clave}\\}`, 'g');
      resultado = resultado.replace(regex, String(valor));
    }
  }

  // Limpiar cualquier etiqueta residual no provista para no dejar {tag} visibles
  resultado = resultado.replace(/\{[a-zA-Z0-9_-]+\}/g, '');
  return sanitizarEspaciado(resultado);
}

/**
 * Renderiza el formato de WhatsApp a HTML para simulación visual fidedigna:
 * - *negrita* -> <strong>negrita</strong> (font-weight: 700 sin asteriscos literales)
 * - _cursiva_ -> <em>cursiva</em>
 * - ~tachado~ -> <del>tachado</del>
 * - \n -> <br>
 */
export function renderizarWhatsappHtml(texto = '') {
  if (typeof texto !== 'string' || !texto) return '';

  // Escapar HTML primero para total seguridad
  let safe = texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Formato WhatsApp: *negrita* (soporta acentos y caracteres especiales)
  safe = safe.replace(/\*([^*\n\r]+)\*/g, '<strong class="wa-bold-text">$1</strong>');

  // Formato WhatsApp: _cursiva_
  safe = safe.replace(/_([^_\n\r]+)_/g, '<em>$1</em>');

  // Formato WhatsApp: ~tachado~
  safe = safe.replace(/~([^~\n\r]+)~/g, '<del>$1</del>');

  // Saltos de línea
  safe = safe.replace(/\n/g, '<br>');

  return safe;
}

/**
 * Construye la URL oficial wa.me codificada
 * @param {string} texto - Mensaje final a enviar
 * @param {string|number} telefono - Teléfono con o sin prefijo 51
 */
export function construirUrlWhatsapp(texto = '', telefono = '51936369384') {
  const raw = String(telefono || '').replace(/\D/g, '');
  let numFinal = raw;
  if (raw.length === 9) {
    numFinal = `51${raw}`;
  } else if (!raw) {
    numFinal = '51936369384';
  }
  return `https://wa.me/${numFinal}?text=${encodeURIComponent(texto)}`;
}
