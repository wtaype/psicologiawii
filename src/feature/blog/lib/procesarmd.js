// src/feature/blog/lib/procesarmd.js
// ⚡ Motor de Procesamiento Markdown y Generador de TOC para Feature Blog
// Soporte de Alertas GitHub, Tablas Responsivas, Checklists y Sanitización

export const wiSanihtml = (html) => {
  if (!html) return '';
  let str = html.toString();
  str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  str = str.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  str = str.replace(/(\bon[a-z]+\s*=\s*"[^"]*")/gi, '');
  str = str.replace(/(\bon[a-z]+\s*=\s*'[^']*')/gi, '');
  str = str.replace(/(\bon[a-z]+\s*=\s*[^\s>]+)/gi, '');
  str = str.replace(/<\/?(iframe|embed|object|applet)\b[^>]*>/gi, '');
  str = str.replace(/href\s*=\s*(['"]?)\s*javascript:[^>]*\1/gi, 'href="#"');
  return str;
};

export const countWords = (text) => {
  if (!text) return { words: 0, min: 1 };
  const clean = text.replace(/<[^>]*>/g, ' ').replace(/[#*_~`>[\]()]/g, ' ').split(/\s+/).filter(Boolean);
  const words = clean.length;
  const min = Math.max(1, Math.ceil(words / 200));
  return { words, min };
};

export const slugify = (text = '') => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

/**
 * Convierte Markdown a HTML enriquecido para la visualización de artículos.
 * @param {string} md Texto en formato Markdown
 * @param {string} lang Idioma para los títulos de alerta
 */
export const mdToHtml = (md = '', lang = 'es') => {
  if (!md) return '';

  let headingCount = 0;

  // 1. Extraer bloques de código multilínea para protegerlos de split/wrap
  const codeBlocks = [];
  let processed = md.replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/gim, (match, codeLang, code) => {
    const idx = codeBlocks.length;
    const cleanCode = code.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
    codeBlocks.push(`<pre class="po_pre"><code class="po_code_block">${cleanCode}</code></pre>`);
    return `__CODE_BLOCK_${idx}__`;
  });

  let html = processed
    .replace(/^## (.*?)(?:\s*\{\#([a-zA-Z0-9_-]+)\})?\s*$/gim, (match, title, id) => {
      const cleanTitle = title.trim();
      const finalId = id || `po_h_${headingCount++}_${slugify(cleanTitle)}`;
      return `<h2 id="${finalId}">${cleanTitle}</h2>`;
    })
    .replace(/^### (.*?)(?:\s*\{\#([a-zA-Z0-9_-]+)\})?\s*$/gim, (match, title, id) => {
      const cleanTitle = title.trim();
      const finalId = id || `po_h_${headingCount++}_${slugify(cleanTitle)}`;
      return `<h3 id="${finalId}">${cleanTitle}</h3>`;
    })
    .replace(/^#### (.*?)(?:\s*\{\#([a-zA-Z0-9_-]+)\})?\s*$/gim, (match, title, id) => {
      const cleanTitle = title.trim();
      const finalId = id || `po_h_${headingCount++}_${slugify(cleanTitle)}`;
      return `<h4 id="${finalId}">${cleanTitle}</h4>`;
    })
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/~~(.*?)~~/gim, '<del>$1</del>')
    .replace(/`([^`\n]+)`/gim, '<code>$1</code>')
    .replace(/!\[(.*?)\]\((.*?)\)/gim, '<figure class="po_figure"><img alt="$1" src="$2" loading="lazy" class="wi_img_clickable" /><figcaption class="po_figcaption">$1</figcaption></figure>')
    .replace(/\[(.*?)\]\((.*?)\)/gim, (match, text, url) => {
      if (url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)/i)) {
        return `<a href="${url}" class="po_yt_link"><i class="fa-brands fa-youtube"></i> ${text}</a>`;
      }
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    })
    .replace(/^---/gim, '<hr class="po_hr"/>');

  const lines = html.split('\n');
  const result = [];
  let inList = false;
  let inTable = false;
  let inQuote = false;
  let quoteLines = [];

  const flushQuote = () => {
    if (quoteLines.length === 0) return;
    const firstLine = quoteLines[0].trim();
    const alertMatch = firstLine.match(/^\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]$/i);

    if (alertMatch) {
      const type = alertMatch[1].toUpperCase();
      let icon = 'fa-solid fa-circle-info';
      let title = 'Nota';
      if (type === 'TIP') { icon = 'fa-solid fa-lightbulb'; title = 'Consejo'; }
      else if (type === 'WARNING') { icon = 'fa-solid fa-triangle-exclamation'; title = 'Advertencia'; }
      else if (type === 'IMPORTANT') { icon = 'fa-solid fa-circle-exclamation'; title = 'Importante'; }
      else if (type === 'CAUTION') { icon = 'fa-solid fa-ban'; title = 'Precaución'; }

      if (lang === 'en') {
        if (type === 'NOTE') title = 'Note';
        else if (type === 'TIP') title = 'Tip';
        else if (type === 'WARNING') title = 'Warning';
        else if (type === 'IMPORTANT') title = 'Important';
        else if (type === 'CAUTION') title = 'Caution';
      }

      const content = quoteLines.slice(1).join('<br/>');
      result.push(`<div class="po_alert po_alert_${type.toLowerCase()}"><div class="po_alert_title"><i class="${icon}"></i> ${title}</div><p>${content}</p></div>`);
    } else {
      result.push(`<blockquote>${quoteLines.join('<br/>')}</blockquote>`);
    }
    quoteLines = [];
  };

  lines.forEach(line => {
    const trimLine = line.trim();

    // Bloques de código placeholders no van dentro de párrafos
    if (trimLine.startsWith('__CODE_BLOCK_') && trimLine.endsWith('__')) {
      if (inList) { result.push('</ul>'); inList = false; }
      if (inTable) { result.push('</table></div>'); inTable = false; }
      if (inQuote) { flushQuote(); inQuote = false; }
      result.push(trimLine);
      return;
    }

    // Blockquote y Alertas
    const quoteMatch = line.match(/^>\s*(.*)$/);
    if (quoteMatch) {
      if (inList) { result.push('</ul>'); inList = false; }
      if (inTable) { result.push('</table></div>'); inTable = false; }
      inQuote = true;
      quoteLines.push(quoteMatch[1]);
      return;
    } else if (inQuote) {
      flushQuote();
      inQuote = false;
    }

    // Tablas Markdown
    if (trimLine.startsWith('|') && trimLine.endsWith('|')) {
      if (!inTable) {
        result.push('<div class="po_table_wrap"><table>');
        inTable = true;
      }
      if (trimLine.match(/^\|?[\s\-\|:]+\|?$/)) return;

      const cells = trimLine.split('|').filter((c, i, a) => (i > 0 && i < a.length - 1));
      const isHeader = inTable && result[result.length - 1].includes('<table>');
      const tag = isHeader ? 'th' : 'td';
      result.push('<tr>' + cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>');
      return;
    } else if (inTable) {
      result.push('</table></div>');
      inTable = false;
    }

    // Listas y Checklists
    const listMatch = line.match(/^[\-\*]\s+(.*)$/);
    if (listMatch) {
      if (!inList) { result.push('<ul>'); inList = true; }
      let text = listMatch[1];
      if (text.startsWith('[ ] ')) {
        text = '<input type="checkbox" class="po_todo_check" disabled /> ' + text.slice(4);
      } else if (text.startsWith('[x] ')) {
        text = '<input type="checkbox" class="po_todo_check" checked disabled /> ' + text.slice(4);
      }
      result.push(`<li>${text}</li>`);
    } else {
      if (inList) { result.push('</ul>'); inList = false; }
      if (trimLine === '') return;
      if (!line.match(/^<(h[1-6]|ul|ol|li|blockquote|img|hr|div|table|tr|th|td|figure|figcaption|pre|code)/)) {
        result.push(`<p>${line}</p>`);
      } else {
        result.push(line);
      }
    }
  });

  if (inTable) result.push('</table></div>');
  if (inList) result.push('</ul>');
  if (inQuote) flushQuote();

  const finalHtml = result.join('\n').replace(/__CODE_BLOCK_(\d+)__/g, (m, i) => codeBlocks[Number(i)] || '');
  return finalHtml;
};

/**
 * Extrae encabezados H2 y H3 para la Tabla de Contenidos (TOC) en servidor.
 * @param {string} html O contenido Markdown
 */
export const extraerHeadings = (content = '') => {
  const headings = [];
  if (!content) return headings;

  // Si es Markdown plano, buscamos ## y ###
  const mdMatches = content.matchAll(/^(##|###)\s+(.*?)(?:\s*\{\#([a-zA-Z0-9_-]+)\})?\s*$/gim);
  let idx = 0;
  for (const m of mdMatches) {
    const depth = m[1].length;
    const cleanText = m[2].trim().replace(/[*_~`]/g, '');
    const id = m[3] || `po_h_${idx++}_${slugify(cleanText)}`;
    headings.push({ text: cleanText, id, depth });
  }

  // Si ya contiene etiquetas HTML <h2> o <h3>
  if (headings.length === 0) {
    const htmlMatches = content.matchAll(/<(h2|h3)[^>]*?id=(['"])(.*?)\2[^>]*?>(.*?)<\/\1>/gi);
    for (const m of htmlMatches) {
      const depth = m[1].toLowerCase() === 'h3' ? 3 : 2;
      const id = m[3];
      const cleanText = m[4].replace(/<[^>]*>/g, '').trim();
      headings.push({ text: cleanText, id, depth });
    }
  }

  return headings;
};
