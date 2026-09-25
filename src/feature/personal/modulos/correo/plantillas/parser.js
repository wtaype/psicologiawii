// src/feature/personal/modulos/correo/plantillas/parser.js
// Conversor especializado de Markdown a HTML con estilos inline para clientes de correo

/**
 * Convierte Markdown enriquecido a HTML seguro con estilos inline para correos
 * Soporta negritas, cursivas, listas, checklists, encabezados H2/H3, tablas con bordes y citas
 */
export function mdToEmailHtml(md = '') {
  if (!md || typeof md !== 'string') return '';

  let html = md
    .replace(/\r\n/g, '\n')
    .replace(/^### (.*$)/gim, '<h3 style="color:#1e293b;margin:16px 0 8px;font-size:16px;font-weight:700;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="color:#0f172a;margin:20px 0 10px;font-size:18px;font-weight:800;border-bottom:1px solid #e2e8f0;padding-bottom:6px;">$1</h2>')
    .replace(/^\> (.*$)/gim, '<blockquote style="margin:14px 0;padding:10px 16px;background:#f8fafc;border-left:4px solid #ff6a00;color:#475569;border-radius:0 8px 8px 0;font-style:italic;">$1</blockquote>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong style="color:#0f172a;font-weight:700;">$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em style="color:#334155;">$1</em>')
    .replace(/~~(.*?)~~/gim, '<del style="color:#94a3b8;">$1</del>')
    .replace(/`([^`]+)`/gim, '<code style="background:#f1f5f9;color:#0f172a;padding:2px 6px;border-radius:4px;font-size:12px;font-family:monospace;">$1</code>')
    .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img alt="$1" src="$2" style="max-width:100%;border-radius:8px;margin:12px 0;display:block;" />')
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#ff6a00;font-weight:600;text-decoration:underline;">$1</a>')
    .replace(/^---/gim, '<hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />');

  // Procesamiento línea a línea para listas y tablas
  const lines = html.split('\n');
  const result = [];
  let inList = false;
  let inTable = false;

  lines.forEach(line => {
    const trimLine = line.trim();

    // Detección y formato de tablas Markdown
    if (trimLine.startsWith('|') && trimLine.endsWith('|')) {
      if (!inTable) {
        result.push('<div style="overflow-x:auto;margin:16px 0;"><table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;font-size:13px;border-radius:6px;overflow:hidden;">');
        inTable = true;
      }
      // Omitir separadores Markdown tipo |---|---|
      if (trimLine.match(/^\|?[\s\-\|:]+\|?$/)) return;

      const cells = trimLine.split('|').filter((_, i, a) => i > 0 && i < a.length - 1);
      const isHeader = inTable && result[result.length - 1].includes('<table');
      const tag = isHeader ? 'th' : 'td';
      const cellStyle = isHeader
        ? 'background:#f8fafc;color:#0f172a;font-weight:700;padding:10px 14px;border:1px solid #e2e8f0;text-align:left;'
        : 'padding:9px 14px;border:1px solid #e2e8f0;color:#334155;';

      result.push('<tr>' + cells.map(c => `<${tag} style="${cellStyle}">${c.trim()}</${tag}>`).join('') + '</tr>');
      return;
    } else if (inTable) {
      result.push('</table></div>');
      inTable = false;
    }

    // Listas con viñetas o checkboxes
    const listMatch = line.match(/^[\-\*]\s+(.*)$/);
    if (listMatch) {
      if (!inList) {
        result.push('<ul style="margin:10px 0;padding-left:22px;color:#334155;line-height:1.7;">');
        inList = true;
      }
      let text = listMatch[1];
      if (text.startsWith('[ ] ')) {
        text = '⬜ ' + text.slice(4);
      } else if (text.startsWith('[x] ')) {
        text = '✅ ' + text.slice(4);
      }
      result.push(`<li style="margin-bottom:4px;">${text}</li>`);
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      if (trimLine === '') return;
      if (!line.match(/^<(h2|h3|ul|ol|li|blockquote|img|hr|div|table|tr|th|td)/i)) {
        result.push(`<p style="margin:0 0 12px;line-height:1.6;color:#334155;font-size:14px;">${line}</p>`);
      } else {
        result.push(line);
      }
    }
  });

  if (inTable) result.push('</table></div>');
  if (inList) result.push('</ul>');

  return result.join('\n');
}
