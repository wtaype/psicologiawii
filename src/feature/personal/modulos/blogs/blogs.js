// src/feature/personal/modulos/blogs/blogs.js
// Controlador Cliente del Módulo Blogs en Personal Backoffice
import { Notificacion, Mensaje, wiSelect } from '@widev';
import { 
  obtenerBlogs, 
  guardarBlog, 
  eliminarBlog, 
  togglePinBlog, 
  toggleActivoBlog, 
  obtenerPostsOpuestos,
  sincronizarConSemilla,
  descargarSemillaBlogs 
} from './dataBlogs.js';
import { mdToHtml, wiSanihtml, slugify, countWords } from '../../../blog/lib/procesarmd.js';
import { datosNegocio } from '@/negocio.js';

export function inicializarBlogs() {
  const root = document.getElementById('panel-blogs');
  if (!root) return;

  // Elementos de Pestañas Principales
  const btnTabRedactor = document.getElementById('blBtnTabRedactor');
  const btnTabPublicaciones = document.getElementById('blBtnTabPublicaciones');
  const viewRedactor = document.getElementById('blViewRedactor');
  const viewPublicaciones = document.getElementById('blViewPublicaciones');
  const tabsActions = document.getElementById('blTabsActions');

  // Elementos del Redactor
  const formEditor = document.getElementById('blFormEditor');
  const inId = document.getElementById('blInputId');
  const inTitulo = document.getElementById('blInputTitulo');
  const inSlug = document.getElementById('blInputSlug');
  const inResumen = document.getElementById('blInputResumen');
  const inKeywords = document.getElementById('blInputKeywords');
  const inContenido = document.getElementById('blInputContenido');
  const inCategoria = document.getElementById('blInputCategoria');
  const inAutor = document.getElementById('blInputAutor');
  const inTagsInput = document.getElementById('blInputTagsText');
  const boxTags = document.getElementById('blBoxTagsChips');
  const inImagen = document.getElementById('blInputImagen');
  const inImagenTop = document.getElementById('blInputImagenTop');
  const inLang = document.getElementById('blSelectLang');
  const inLangId = document.getElementById('blSelectLangId');
  const inActivo = document.getElementById('blCheckActivo');
  const inPin = document.getElementById('blCheckPin');
  const btnSubmitPost = document.getElementById('blBtnSubmitPost');

  // Acciones Rápidas: Cargar Markdown y Nuevo
  const btnCargarMd = document.getElementById('blBtnCargarMd');
  const btnNuevoPost = document.getElementById('blBtnNuevoPost');
  const inputFileMd = document.getElementById('blInputFileMd');

  // Instancias wiSelect
  let instSelectLang = null;
  let instSelectLangId = null;

  // Elementos de Previsualización y Enlace de Imágenes
  const previewThumb = document.getElementById('blPreviewThumb');
  const previewThumbTop = document.getElementById('blPreviewThumbTop');
  const linkVerImagen = document.getElementById('blLinkVerImagen');
  const linkVerImagenOverlay = document.getElementById('blLinkVerImagenOverlay');
  const linkVerImagenTop = document.getElementById('blLinkVerImagenTop');
  const linkVerImagenTopOverlay = document.getElementById('blLinkVerImagenTopOverlay');

  const cntTitulo = document.getElementById('blCntTitulo');
  const cntResumen = document.getElementById('blCntResumen');
  const cntKeywords = document.getElementById('blCntKeywords');
  const livePalabras = document.getElementById('blLivePalabras');
  const liveLectura = document.getElementById('blLiveLectura');

  // Subtabs Editor / Preview
  const btnSubtabWrite = document.getElementById('blSubtabWrite');
  const btnSubtabPreview = document.getElementById('blSubtabPreview');
  const panelWrite = document.getElementById('blPanelWrite');
  const panelPreview = document.getElementById('blPanelPreview');
  const previewBody = document.getElementById('blPreviewBody');

  const btnResetForm = document.getElementById('blBtnResetForm');

  // Elementos de Publicaciones (Tabla)
  const inSearch = document.getElementById('blSearchInput');
  const pillsLang = document.querySelectorAll('.bl-pill-btn[data-filter-lang]');
  const selectCat = document.getElementById('blSelectCategoriaFilter');
  const tableBody = document.getElementById('blTablePublicacionesBody');
  const tableTotalBadge = document.getElementById('blTableTotalBadge');

  let currentTags = [];
  let isEditing = false;
  let activeLangFilter = 'todos';

  // ════════════════════════════════════════════════════════════
  // 1. CONTROL DE PESTAÑAS (REDACTOR POR DEFECTO)
  // ════════════════════════════════════════════════════════════
  function activarTab(tab = 'redactor') {
    if (tab === 'redactor') {
      btnTabRedactor?.classList.add('active');
      btnTabPublicaciones?.classList.remove('active');
      if (viewRedactor) viewRedactor.style.display = 'block';
      if (viewPublicaciones) viewPublicaciones.style.display = 'none';
      if (tabsActions) tabsActions.style.display = 'flex';
    } else {
      btnTabPublicaciones?.classList.add('active');
      btnTabRedactor?.classList.remove('active');
      if (viewPublicaciones) viewPublicaciones.style.display = 'block';
      if (viewRedactor) viewRedactor.style.display = 'none';
      if (tabsActions) tabsActions.style.display = 'none';
      renderizarPublicaciones();
    }
  }

  btnTabRedactor?.addEventListener('click', () => activarTab('redactor'));
  btnTabPublicaciones?.addEventListener('click', () => activarTab('publicaciones'));

  // ════════════════════════════════════════════════════════════
  // 2. LOGICA DEL REDACTOR DE CONTENIDO (ESTILO NUEVO.ASTRO)
  // ════════════════════════════════════════════════════════════
  function actualizarContadores() {
    if (inTitulo && cntTitulo) {
      cntTitulo.textContent = `${inTitulo.value.length}/60`;
    }
    if (inResumen && cntResumen) {
      cntResumen.textContent = `${inResumen.value.length}/200`;
    }
    if (inKeywords && cntKeywords) {
      cntKeywords.textContent = `${inKeywords.value.length}/160`;
    }
    if (inContenido) {
      const { words, min } = countWords(inContenido.value);
      if (livePalabras) livePalabras.textContent = `${words} palabras`;
      if (liveLectura) liveLectura.textContent = `${min} min`;
    }
  }

  inTitulo?.addEventListener('input', () => {
    if (!isEditing && inSlug) {
      inSlug.value = slugify(inTitulo.value);
    }
    actualizarContadores();
  });

  inResumen?.addEventListener('input', actualizarContadores);
  inKeywords?.addEventListener('input', actualizarContadores);
  inContenido?.addEventListener('input', actualizarContadores);

  // Subtabs Editor / Live Preview
  function switchSubtab(sub = 'write') {
    btnSubtabWrite?.classList.toggle('active', sub === 'write');
    btnSubtabPreview?.classList.toggle('active', sub === 'preview');
    if (panelWrite) panelWrite.style.display = sub === 'write' ? 'block' : 'none';
    if (panelPreview) panelPreview.style.display = sub === 'preview' ? 'block' : 'none';

    if (sub === 'preview' && previewBody && inContenido) {
      const curLang = inLang?.value || 'es';
      previewBody.innerHTML = wiSanihtml(mdToHtml(inContenido.value, curLang));
    }
  }

  btnSubtabWrite?.addEventListener('click', () => switchSubtab('write'));
  btnSubtabPreview?.addEventListener('click', () => switchSubtab('preview'));

  // Barra de herramientas Markdown
  document.querySelectorAll('.bl-tool[data-cmd]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.getAttribute('data-cmd');
      if (!cmd || !inContenido) return;

      const start = inContenido.selectionStart;
      const end = inContenido.selectionEnd;
      const sel = inContenido.value.substring(start, end);
      let ins = '';

      switch (cmd) {
        case 'bold': ins = `**${sel || 'texto en negrita'}**`; break;
        case 'italic': ins = `*${sel || 'texto en cursiva'}*`; break;
        case 'h2': ins = `\n## ${sel || 'Título H2'}\n`; break;
        case 'h3': ins = `\n### ${sel || 'Subtítulo H3'}\n`; break;
        case 'link': ins = `[${sel || 'Enlace'}](https://ejemplo.com)`; break;
        case 'quote': ins = `\n> ${sel || 'Cita destacada...'}\n`; break;
        case 'code': ins = `\`${sel || 'código'}\``; break;
        case 'table':
          ins = `\n| Detalle | Especificación | Nota |\n|---|:---:|---:|\n| Item Principal | Estándar | Conforme |\n`;
          break;
        case 'image':
          ins = `\n![Descripción de la imagen](/smile.avif)\n`;
          break;
        case 'note':
          ins = `\n> [!NOTE]\n> ${sel || 'Nota informativa sobre el tema...'}\n`;
          break;
        case 'tip':
          ins = `\n> [!TIP]\n> ${sel || 'Consejo útil para optimizar tu experiencia...'}\n`;
          break;
        case 'warning':
          ins = `\n> [!WARNING]\n> ${sel || 'Advertencia importante...'}\n`;
          break;
        default: ins = sel; break;
      }

      inContenido.setRangeText(ins, start, end, 'end');
      inContenido.focus();
      actualizarContadores();
    });
  });

  // Manejo de Tags con Chips
  function renderTags() {
    if (!boxTags) return;
    boxTags.innerHTML = currentTags.map((t, idx) => `
      <span class="bl-tag-chip">
        #${t} <i class="fa-solid fa-xmark bl-tag-rm" data-tag-idx="${idx}"></i>
      </span>
    `).join('');

    boxTags.querySelectorAll('.bl-tag-rm').forEach(rm => {
      rm.addEventListener('click', (e) => {
        const i = parseInt(rm.getAttribute('data-tag-idx') || '0', 10);
        currentTags.splice(i, 1);
        renderTags();
      });
    });
  }

  inTagsInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = inTagsInput.value.trim().replace(/^#/, '');
      if (val && !currentTags.includes(val)) {
        currentTags.push(val);
        inTagsInput.value = '';
        renderTags();
      }
    }
  });

  // Previsualización y Enlaces de Imágenes en tiempo real
  function actualizarPrevisualizacionImagenes() {
    const valImg = inImagen?.value.trim() || '/smile.avif';
    const valImgTop = inImagenTop?.value.trim() || valImg;

    if (previewThumb) previewThumb.src = valImg;
    if (linkVerImagen) linkVerImagen.href = valImg;
    if (linkVerImagenOverlay) linkVerImagenOverlay.href = valImg;

    if (previewThumbTop) previewThumbTop.src = valImgTop;
    if (linkVerImagenTop) linkVerImagenTop.href = valImgTop;
    if (linkVerImagenTopOverlay) linkVerImagenTopOverlay.href = valImgTop;
  }

  inImagen?.addEventListener('input', actualizarPrevisualizacionImagenes);
  inImagenTop?.addEventListener('input', actualizarPrevisualizacionImagenes);

  // Carga de opciones para Post Hermano (langId) con wiSelect
  function actualizarSelectorLangId(selectedLang = 'es', preselectedId = '') {
    if (!inLangId) return;
    if (instSelectLangId) {
      instSelectLangId.destroy();
      instSelectLangId = null;
    }
    const opuestos = obtenerPostsOpuestos(selectedLang);
    inLangId.innerHTML = `<option value="">-- Ninguno (Post Base Original) --</option>`;
    opuestos.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `[${p.lang.toUpperCase()}] ${p.titulo}`;
      if (p.id === preselectedId) opt.selected = true;
      inLangId.appendChild(opt);
    });

    if (wiSelect) {
      instSelectLangId = wiSelect(inLangId, {
        placeholder: '-- Ninguno (Post Base Original) --',
        searchPlaceholder: 'Buscar post hermano...'
      });
      if (preselectedId && instSelectLangId) {
        instSelectLangId.setValue(preselectedId);
      }
    }
  }

  // Inicializar wiSelect en el selector de Idioma
  if (inLang && wiSelect) {
    instSelectLang = wiSelect(inLang, {
      placeholder: 'Selecciona idioma...',
      searchPlaceholder: 'Buscar idioma...',
      onChange: (val) => {
        actualizarSelectorLangId(val);
        if (btnSubtabPreview?.classList.contains('active')) {
          switchSubtab('preview');
        }
      }
    });
  }

  // Cargar Contenido desde Archivo Markdown (.md)
  function cargarContenidoDesdeMarkdown(rawText, fileName = '') {
    if (!rawText) return;

    let content = rawText;
    let frontTitle = '';
    let frontDesc = '';
    let frontCategory = '';
    let frontTags = [];
    let frontAuthor = '';
    let frontLang = '';

    // Detectar Frontmatter YAML (entre --- y ---)
    const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (fmMatch) {
      const yaml = fmMatch[1];
      content = content.replace(fmMatch[0], '').trim();

      yaml.split('\n').forEach(line => {
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) return;
        const key = line.slice(0, colonIdx).trim().toLowerCase();
        let val = line.slice(colonIdx + 1).trim();
        val = val.replace(/^["'](.*)["']$/, '$1');

        if (key === 'title' || key === 'titulo') frontTitle = val;
        else if (key === 'description' || key === 'descripcion' || key === 'resumen') frontDesc = val;
        else if (key === 'category' || key === 'categoria') frontCategory = val;
        else if (key === 'author' || key === 'autor') frontAuthor = val;
        else if (key === 'lang' || key === 'idioma') frontLang = val;
        else if (key === 'tags' || key === 'etiquetas') {
          frontTags = val.replace(/[\[\]]/g, '').split(',').map(t => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
        }
      });
    }

    // Si no vino título en frontmatter, buscar el primer H1 (# Título)
    if (!frontTitle) {
      const h1Match = content.match(/^#\s+(.+)$/m);
      if (h1Match) {
        frontTitle = h1Match[1].trim();
        content = content.replace(h1Match[0], '').trim();
      } else {
        frontTitle = fileName.replace(/\.(md|markdown|txt)$/i, '').replace(/[-_]/g, ' ');
        frontTitle = frontTitle.charAt(0).toUpperCase() + frontTitle.slice(1);
      }
    }

    // Asignar valores en el formulario
    if (inTitulo) inTitulo.value = frontTitle;
    if (inSlug) inSlug.value = slugify(frontTitle);
    if (frontDesc && inResumen) inResumen.value = frontDesc;
    if (frontCategory && inCategoria) inCategoria.value = frontCategory;
    if (frontAuthor && inAutor) inAutor.value = frontAuthor;
    if (frontTags.length > 0) {
      currentTags = frontTags;
      renderTags();
    }
    if (frontLang && (frontLang === 'es' || frontLang === 'en')) {
      if (instSelectLang) instSelectLang.setValue(frontLang);
      else if (inLang) inLang.value = frontLang;
      actualizarSelectorLangId(frontLang);
    }

    if (inContenido) inContenido.value = content;

    actualizarContadores();
    if (btnSubtabPreview?.classList.contains('active')) {
      switchSubtab('preview');
    }
    Notificacion(`Archivo "${fileName || 'Markdown'}" cargado con éxito.`, 'success');
  }

  btnCargarMd?.addEventListener('click', () => {
    inputFileMd?.click();
  });

  inputFileMd?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      cargarContenidoDesdeMarkdown(ev.target?.result || '', file.name);
      inputFileMd.value = '';
    };
    reader.readAsText(file);
  });

  btnNuevoPost?.addEventListener('click', () => {
    limpiarFormulario();
    Notificacion('Nuevo borrador listo para redactar.', 'info');
  });

  // Limpiar / Resetear Formulario
  function limpiarFormulario() {
    isEditing = false;
    if (inId) inId.value = '';
    if (inTitulo) inTitulo.value = '';
    if (inSlug) inSlug.value = '';
    if (inResumen) inResumen.value = '';
    if (inKeywords) inKeywords.value = '';
    if (inCategoria) inCategoria.value = 'General';
    if (inAutor) inAutor.value = datosNegocio.identidad?.nombreCorto || datosNegocio.nombre || 'Redacción';
    if (inImagen) inImagen.value = datosNegocio.hero?.imagen || '/smile.avif';
    if (inImagenTop) inImagenTop.value = datosNegocio.hero?.imagen || '/smile.avif';
    if (inActivo) inActivo.checked = true;
    if (inPin) inPin.checked = false;
    if (btnSubmitPost) btnSubmitPost.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Publicar';

    if (instSelectLang) {
      instSelectLang.setValue('es');
    } else if (inLang) {
      inLang.value = 'es';
    }

    currentTags = [];
    renderTags();
    actualizarPrevisualizacionImagenes();
    actualizarSelectorLangId('es');
    actualizarContadores();
    switchSubtab('write');
  }

  btnResetForm?.addEventListener('click', () => {
    limpiarFormulario();
    Notificacion('Formulario restablecido a nuevo borrador.', 'info');
  });

  // Guardar / Publicar Artículo
  formEditor?.addEventListener('submit', (e) => {
    e.preventDefault();

    const tituloVal = inTitulo?.value.trim();
    const slugVal = slugify(inSlug?.value.trim() || inTitulo?.value.trim());
    const contenidoVal = inContenido?.value.trim();

    if (!tituloVal || !contenidoVal) {
      Notificacion('Debes completar el título y el contenido del artículo.', 'warning');
      return;
    }

    const payload = {
      id: inId?.value || undefined,
      slug: slugVal,
      lang: inLang?.value || 'es',
      langId: inLangId?.value || null,
      activo: inActivo ? inActivo.checked : true,
      pin: inPin ? inPin.checked : false,
      userId: 'admin',
      autor: inAutor?.value.trim() || datosNegocio.nombreCorto || datosNegocio.nombre || 'Redacción',
      titulo: tituloVal,
      descripcion: inResumen?.value.trim() || '',
      categoria: inCategoria?.value.trim() || 'General',
      imagen: inImagen?.value.trim() || datosNegocio.hero?.imagen || '/smile.avif',
      imagenTop: inImagenTop?.value.trim() || inImagen?.value.trim() || datosNegocio.hero?.imagen || '/smile.avif',
      tags: currentTags,
      metaSEO: {
        keywords: inKeywords?.value.trim() || currentTags.join(', '),
        alt: tituloVal
      },
      contenido: contenidoVal,
      contenidoMD: contenidoVal
    };

    const guardado = guardarBlog(payload);
    Notificacion(`¡Artículo "${guardado.titulo}" guardado exitosamente!`, 'success');
    
    // Cambiar a la pestaña de Publicaciones para ver la tabla
    limpiarFormulario();
    activarTab('publicaciones');
  });

  // ════════════════════════════════════════════════════════════
  // 3. LOGICA DE LA TABLA DE PUBLICACIONES (TAB 2)
  // ════════════════════════════════════════════════════════════
  function cargarParaEditar(id) {
    const blogs = obtenerBlogs();
    const post = blogs.find(b => b.id === id);
    if (!post) return;

    isEditing = true;
    activarTab('redactor');

    if (inId) inId.value = post.id;
    if (inTitulo) inTitulo.value = post.titulo;
    if (inSlug) inSlug.value = post.slug;
    if (inResumen) inResumen.value = post.descripcion || '';
    if (inKeywords) inKeywords.value = post.metaSEO?.keywords || '';
    if (inContenido) inContenido.value = post.contenidoMD || post.contenido || '';
    if (inCategoria) inCategoria.value = post.categoria || 'General';
    if (inAutor) inAutor.value = post.autor || datosNegocio.identidad?.nombreCorto || datosNegocio.nombre || 'Redacción';
    if (inImagen) inImagen.value = post.imagen || '';
    if (inImagenTop) inImagenTop.value = post.imagenTop || post.imagen || '';
    if (inActivo) inActivo.checked = post.activo !== false;
    if (inPin) inPin.checked = Boolean(post.pin);
    if (btnSubmitPost) btnSubmitPost.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Actualizar';

    if (instSelectLang) {
      instSelectLang.setValue(post.lang || 'es');
    } else if (inLang) {
      inLang.value = post.lang || 'es';
    }

    currentTags = Array.isArray(post.tags) ? [...post.tags] : [];
    renderTags();
    actualizarPrevisualizacionImagenes();
    actualizarSelectorLangId(post.lang || 'es', post.langId || '');
    actualizarContadores();
    switchSubtab('write');

    Notificacion(`Editando: "${post.titulo}"`, 'info');
  }

  function renderizarPublicaciones() {
    const blogs = obtenerBlogs();
    const query = (inSearch?.value || '').toLowerCase().trim();
    const cat = selectCat?.value || 'todas';

    // Filtrar lista
    let filtrados = blogs.filter(b => {
      const matchLang = activeLangFilter === 'todos' || b.lang === activeLangFilter;
      const matchCat = cat === 'todas' || b.categoria === cat;
      const matchQuery = !query || 
        b.titulo.toLowerCase().includes(query) || 
        b.slug.toLowerCase().includes(query) ||
        b.descripcion.toLowerCase().includes(query) ||
        (Array.isArray(b.tags) && b.tags.some(t => t.toLowerCase().includes(query)));
      return matchLang && matchCat && matchQuery;
    });

    if (tableTotalBadge) {
      tableTotalBadge.textContent = `${filtrados.length} ${filtrados.length === 1 ? 'publicación' : 'publicaciones'}`;
    }

    if (!tableBody) return;

    if (filtrados.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 48px 20px;">
            <i class="fa-solid fa-folder-open" style="font-size: 2.2rem; color: var(--muted); margin-bottom: 10px; display:block;"></i>
            <strong style="color: var(--ink); font-size: 14.5px;">No se encontraron publicaciones</strong>
            <p style="color: var(--muted); font-size: 12.5px; margin: 4px 0 14px 0;">Intenta con otro término de búsqueda o crea una nueva publicación.</p>
            <button type="button" class="bl-btn-sec" id="blBtnIrACrearVacio">
              <i class="fa-solid fa-plus"></i> Redactar Nueva Publicación
            </button>
          </td>
        </tr>
      `;
      document.getElementById('blBtnIrACrearVacio')?.addEventListener('click', () => {
        limpiarFormulario();
        activarTab('redactor');
      });
      return;
    }

    tableBody.innerHTML = filtrados.map(b => {
      const publicUrl = b.lang === 'en' ? `/en/${b.slug}` : `/${b.slug}`;
      const langBadgeClass = b.lang === 'en' ? 'bl-badge-lang-en' : 'bl-badge-lang-es';
      const langLabel = b.lang === 'en' ? 'English (EN)' : 'Español (ES)';

      // Verificar si tiene post hermano
      const hermano = b.langId ? blogs.find(x => x.id === b.langId) : null;
      const hermanoInfo = hermano 
        ? `<span class="bl-badge-linked" title="Vinculado a: ${hermano.titulo}"><i class="fa-solid fa-link"></i> [${hermano.lang.toUpperCase()}] ${hermano.slug}</span>`
        : `<span class="bl-badge-unlinked" title="Sin enlace hermano"><i class="fa-solid fa-link-slash"></i> Base original</span>`;

      return `
        <tr data-post-id="${b.id}">
          <td>
            <div class="bl-col-post">
              <img src="${b.imagen || '/smile.avif'}" alt="${b.titulo}" class="bl-table-thumb" loading="lazy" />
              <div class="bl-table-info">
                <strong class="bl-table-title" title="${b.titulo}">${b.titulo}</strong>
                <a href="${publicUrl}" target="_blank" rel="noopener noreferrer" class="bl-table-slug" title="Abrir en enlace">
                  <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:9.5px; margin-right:3px;"></i>${publicUrl}
                </a>
              </div>
            </div>
          </td>
          <td>
            <div style="display:flex; flex-direction:column; gap:4px;">
              <span class="bl-badge-lang ${langBadgeClass}">
                <i class="fa-solid fa-language"></i> ${langLabel}
              </span>
              ${hermanoInfo}
            </div>
          </td>
          <td>
            <span class="bl-table-cat">${b.categoria || 'General'}</span>
            ${Array.isArray(b.tags) && b.tags.length ? `
              <div class="bl-table-tags">
                ${b.tags.slice(0, 3).map(t => `<span class="bl-table-tag">#${t}</span>`).join('')}
                ${b.tags.length > 3 ? `<span class="bl-table-tag">+${b.tags.length - 3}</span>` : ''}
              </div>
            ` : ''}
          </td>
          <td>
            <span style="font-size:12px; color:var(--muted); white-space:nowrap;">
              <i class="fa-regular fa-calendar" style="margin-right:4px;"></i>${b.publicado || '2026-10-15'}
            </span>
          </td>
          <td>
            <div style="display:flex; align-items:center;">
              <span class="bl-badge-status ${b.activo !== false ? 'bl-badge-active' : 'bl-badge-draft'}">
                ${b.activo !== false ? 'Publicado' : 'Borrador'}
              </span>
              ${b.pin ? '<span class="bl-badge-pin" title="Fijado en portada"><i class="fa-solid fa-thumbtack"></i></span>' : ''}
            </div>
          </td>
          <td style="text-align:right;">
            <div class="bl-table-actions">
              <button type="button" class="bl-action-btn bl-btn-edit" data-edit-id="${b.id}" title="Editar artículo">
                <i class="fa-solid fa-pen-to-square"></i> Editar
              </button>
              <a href="${publicUrl}" target="_blank" rel="noopener noreferrer" class="bl-action-btn" title="Ver en la web pública">
                <i class="fa-solid fa-arrow-up-right-from-square"></i>
              </a>
              <button type="button" class="bl-action-btn bl-btn-pin" data-pin-id="${b.id}" title="${b.pin ? 'Quitar Pin' : 'Fijar en Portada'}">
                <i class="fa-solid fa-thumbtack" style="${b.pin ? 'color:var(--brand-primary, #104356);' : ''}"></i>
              </button>
              <button type="button" class="bl-action-btn btn-del bl-btn-del" data-del-id="${b.id}" title="Eliminar artículo">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Listeners de la tabla
    tableBody.querySelectorAll('.bl-btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-edit-id');
        if (id) cargarParaEditar(id);
      });
    });

    tableBody.querySelectorAll('.bl-btn-pin').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-pin-id');
        if (id) {
          const isPinned = togglePinBlog(id);
          Notificacion(isPinned ? 'Artículo fijado en portada.' : 'Artículo desanclado.', 'info');
          renderizarPublicaciones();
        }
      });
    });

    tableBody.querySelectorAll('.bl-btn-del').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-del-id');
        if (id && confirm('¿Estás seguro de eliminar esta publicación?')) {
          eliminarBlog(id);
          Notificacion('Publicación eliminada.', 'warning');
          renderizarPublicaciones();
        }
      });
    });
  }

  inSearch?.addEventListener('input', renderizarPublicaciones);
  selectCat?.addEventListener('change', renderizarPublicaciones);

  pillsLang.forEach(pill => {
    pill.addEventListener('click', () => {
      pillsLang.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeLangFilter = pill.getAttribute('data-filter-lang') || 'todos';
      renderizarPublicaciones();
    });
  });

  const btnSyncSemillas = document.getElementById('blBtnSyncSemillas');
  btnSyncSemillas?.addEventListener('click', () => {
    sincronizarConSemilla();
    renderizarPublicaciones();
    Notificacion('¡Artículos sincronizados exitosamente desde blogs.json!', 'success');
  });

  const btnDescargarSemilla = document.getElementById('blBtnDescargarSemilla');
  btnDescargarSemilla?.addEventListener('click', () => {
    descargarSemillaBlogs();
    Notificacion('Descargando archivo blogs.json actualizado...', 'info');
  });

  // Inicializar estado por defecto
  limpiarFormulario();
  activarTab('redactor');
}

// Ejecutar al cargar la página
if (typeof document !== 'undefined') {
  document.addEventListener('astro:page-load', inicializarBlogs);
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    inicializarBlogs();
  }
}
