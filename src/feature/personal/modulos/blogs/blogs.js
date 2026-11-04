// src/feature/personal/modulos/blogs/blogs.js
// 🎯 Controlador Cliente del Módulo Blogs en Personal Backoffice
// Local-First (0ms) + postId Editable con Validación en Vivo + langId Cluster UID + Anti-Fuga de Memoria
import { consultarJsonGemini } from '../../../../core/servicios/gemini.js';
import { Notificacion as showNotificacion, wiSelect, wiTip } from '@widev';
import { wiInit } from '../../../../core/widev/wiinit.js';
import { datosNegocio } from '../../../../negocio.js';
import { 
  obtenerBlogs, 
  guardarBlog, 
  eliminarBlog, 
  togglePinBlog, 
  toggleActivoBlog, 
  obtenerPostsOpuestos,
  sincronizarConSemilla,
  generarSiguientePostId,
  validarDisponibilidadPostId,
  generarClusterUid,
  vincularPostsCluster,
  desvincularPostCluster,
  resolverUrlCompleta
} from './dataBlogs.js';
import { mdToHtml, wiSanihtml, slugify, countWords } from '../../../blog/lib/procesarmd.js';

// Previene notificaciones duplicadas en ráfaga (por doble clic o reconexión de eventos)
let ultimaNotifTexto = '';
let ultimaNotifTs = 0;
function Notificacion(mensaje, tipo = 'info') {
  const ahora = Date.now();
  if (mensaje === ultimaNotifTexto && (ahora - ultimaNotifTs) < 1500) {
    return;
  }
  ultimaNotifTexto = mensaje;
  ultimaNotifTs = ahora;
  showNotificacion(mensaje, tipo);
}

// Trunca textos a un número exacto de caracteres (por defecto 30 caracteres + '...')
function truncarTexto(texto = '', max = 30) {
  if (!texto) return '';
  const limpio = texto.trim();
  if (limpio.length <= max) return limpio;
  return limpio.slice(0, max).trimEnd() + '...';
}

// Obtiene el autor dinámico desde datosNegocio o fallback genérico (100% agnóstico)
function getAutorPorDefecto() {
  return datosNegocio?.especialista || datosNegocio?.nombre || 'Autor';
}

export function inicializarBlogs() {
  const root = document.getElementById('panel-blogs');
  if (!root) return;

  // Activar tooltips globales de Widev
  wiTip();

  // 1. Guard contra inicializaciones duplicadas / fuga de memoria
  if (root.dataset.blInitialized === 'true') {
    const tableBody = document.getElementById('blTablePublicacionesBody');
    if (tableBody) {
      // Solo refrescar la tabla sin duplicar event listeners
      actualizarListaPublicaciones();
    }
    return;
  }
  root.dataset.blInitialized = 'true';

  // 2. Elementos de Pestañas Principales (Solo 2 pestañas)
  const btnTabRedactor = document.getElementById('blBtnTabRedactor');
  const btnTabPublicaciones = document.getElementById('blBtnTabPublicaciones');
  const viewRedactor = document.getElementById('blViewRedactor');
  const viewPublicaciones = document.getElementById('blViewPublicaciones');

  // 3. Elementos del Redactor
  const formEditor = document.getElementById('blFormEditor');
  const inId = document.getElementById('blInputId');
  const inPostId = document.getElementById('blInputPostId');
  const idStatusIndicator = document.getElementById('blIdStatusIndicator');

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

  // Botones de Acción Superior del Editor
  const btnSubmitPost = document.getElementById('blBtnSubmitPost');
  const btnSubmitText = document.getElementById('blBtnSubmitText');
  const btnSubmitIcon = document.getElementById('blBtnSubmitIcon');
  const btnNuevoPost = document.getElementById('blBtnNuevoPost');

  // Módulo de Idioma y Vinculación
  const btnSoloVincular = document.getElementById('blBtnSoloVincular');
  const btnTraducirIA = document.getElementById('blBtnTraducirIA');
  const langStatusBadge = document.getElementById('blLangStatusBadge');

  // Instancias de wiSelect
  let instSelectLang = null;
  let instSelectLangId = null;

  // Previsualización y Copia de Imágenes
  const previewThumb = document.getElementById('blPreviewThumb');
  const previewThumbTop = document.getElementById('blPreviewThumbTop');
  const linkVerImagen = document.getElementById('blLinkVerImagen');
  const linkVerImagenTop = document.getElementById('blLinkVerImagenTop');
  const btnCopyImgThumb = document.getElementById('blBtnCopyImgThumb');
  const btnCopyImgTop = document.getElementById('blBtnCopyImgTop');

  // Contadores en tiempo real
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

  // Elementos de Publicaciones (Tabla)
  const inSearch = document.getElementById('blSearchInput');
  const pillsLang = document.querySelectorAll('.bl-pill-btn[data-filter-lang]');
  const selectCat = document.getElementById('blSelectCategoriaFilter');
  const tableBody = document.getElementById('blTablePublicacionesBody');
  const tableTotalBadge = document.getElementById('blTableTotalBadge');
  const btnSyncSemillas = document.getElementById('blBtnSyncSemillas');
  const btnExportarJson = document.getElementById('blBtnExportarJson');

  let currentTags = [];
  let isEditing = false;
  let activeLangFilter = 'todos';
  let currentEditingPostId = '';
  let currentClusterUid = '';
  let isIdValid = true;

  // ════════════════════════════════════════════════════════════
  // 0. SINCRONIZADOR DE URL (?id=... &tab=...)
  // ════════════════════════════════════════════════════════════
  function syncUrlParams(postId = '', tab = 'redactor') {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (tab) {
      url.searchParams.set('tab', tab);
    } else {
      url.searchParams.delete('tab');
    }
    if (postId) {
      url.searchParams.set('id', postId);
    } else {
      url.searchParams.delete('id');
    }
    window.history.replaceState({}, '', url.toString());
  }

  // ════════════════════════════════════════════════════════════
  // 1. CONTROL DE PESTAÑAS (REDACTOR POR DEFECTO / PUBLICACIONES)
  // ════════════════════════════════════════════════════════════
  function activarTab(tab = 'redactor', updateUrl = true) {
    if (tab === 'redactor') {
      btnTabRedactor?.classList.add('active');
      btnTabPublicaciones?.classList.remove('active');
      if (viewRedactor) viewRedactor.style.display = 'block';
      if (viewPublicaciones) viewPublicaciones.style.display = 'none';
      if (updateUrl) syncUrlParams(inId?.value || inPostId?.value || '', 'redactor');
    } else {
      btnTabPublicaciones?.classList.add('active');
      btnTabRedactor?.classList.remove('active');
      if (viewPublicaciones) viewPublicaciones.style.display = 'block';
      if (viewRedactor) viewRedactor.style.display = 'none';
      renderizarPublicaciones();
      if (updateUrl) syncUrlParams('', 'publicaciones');
    }
    wiTip();
  }

  btnTabRedactor?.addEventListener('click', () => activarTab('redactor', true));
  btnTabPublicaciones?.addEventListener('click', () => activarTab('publicaciones', true));

  // ════════════════════════════════════════════════════════════
  // 2. VALIDACIÓN EN TIEMPO REAL DEL postId (8 DÍGITOS)
  // ════════════════════════════════════════════════════════════
  function validarIdEnTiempoReal() {
    if (!inPostId) return true;
    const rawVal = inPostId.value.replace(/\D/g, '');
    inPostId.value = rawVal;

    const res = validarDisponibilidadPostId(rawVal, currentEditingPostId);
    isIdValid = res.disponible;

    if (inId) inId.value = res.idNormalizado || rawVal;

    if (idStatusIndicator) {
      if (res.disponible) {
        idStatusIndicator.innerHTML = '<i class="fa-solid fa-circle-check bl-id-icon is-available"></i>';
        idStatusIndicator.setAttribute('data-witip', 'ID disponible');
      } else {
        idStatusIndicator.innerHTML = '<i class="fa-solid fa-circle-xmark bl-id-icon is-taken"></i>';
        idStatusIndicator.setAttribute('data-witip', res.mensaje);
      }
    }

    wiTip();
    return res.disponible;
  }

  inPostId?.addEventListener('input', validarIdEnTiempoReal);
  inPostId?.addEventListener('blur', () => {
    if (inPostId.value.trim()) {
      inPostId.value = inPostId.value.trim().padStart(8, '0');
      validarIdEnTiempoReal();
    }
  });

  // ════════════════════════════════════════════════════════════
  // 3. ACTUALIZACIÓN VISUAL DEL ESTADO DE VINCULACIÓN & CLUSTER UID
  // ════════════════════════════════════════════════════════════
  function actualizarEstadoVinculacion(post) {
    if (!post || !post.id) {
      // Modo Nuevo Borrador
      if (btnTraducirIA) {
        btnTraducirIA.disabled = true;
        btnTraducirIA.classList.remove('is-ready');
        btnTraducirIA.setAttribute('data-witip', 'Publica primero el artículo para poder traducirlo y vincularlo con IA');
      }
      if (langStatusBadge) {
        langStatusBadge.style.display = 'none';
        langStatusBadge.innerHTML = '';
      }
      return;
    }

    if (btnTraducirIA) {
      btnTraducirIA.disabled = false;
      btnTraducirIA.classList.add('is-ready');
    }

    const blogs = obtenerBlogs();
    currentClusterUid = post?.langId || '';

    // Buscar hermanos en otros idiomas pertenecientes al mismo Cluster UID
    const partners = currentClusterUid
      ? blogs.filter(b => b.langId === currentClusterUid && b.id !== post.id)
      : [];
    const hermano = partners[0] || null;
    const langActual = post.lang || 'es';
    const targetLang = langActual === 'es' ? 'en' : 'es';

    if (hermano) {
      if (btnTraducirIA) {
        btnTraducirIA.setAttribute('data-witip', `Actualizar traducción existente con Gemini IA (ID: ${hermano.postId || hermano.id})`);
      }
      if (langStatusBadge) {
        langStatusBadge.style.display = 'flex';
        langStatusBadge.className = 'bl-lang-status-wrap is-linked';
        langStatusBadge.innerHTML = `
          <i class="fa-solid fa-circle-check"></i> 
          <span>Vinculado con versión [${(hermano.lang || 'en').toUpperCase()}] ID: <strong>${hermano.postId || hermano.id}</strong></span>
        `;
      }
    } else {
      if (btnTraducirIA) {
        btnTraducirIA.setAttribute('data-witip', `Traducir al ${targetLang === 'en' ? 'inglés' : 'español'} y vincular automáticamente con IA`);
      }
      if (langStatusBadge) {
        langStatusBadge.style.display = 'flex';
        langStatusBadge.className = 'bl-lang-status-wrap is-unlinked';
        langStatusBadge.innerHTML = `
          <i class="fa-solid fa-circle-exclamation"></i> 
          <span>Sin versión en ${targetLang === 'en' ? 'inglés' : 'español'}. Puedes usar "Traducir" o seleccionar una existente.</span>
        `;
      }
    }

    wiTip();
  }

  // ════════════════════════════════════════════════════════════
  // 4. SELECTORES DE IDIOMA Y VÍNCULO (wiSelect ACCESIBLE)
  // ════════════════════════════════════════════════════════════
  function actualizarCardIdiomaHeader() {
    const elCardIdiomaTitle = document.getElementById('blCardIdiomaTitle');
    if (!elCardIdiomaTitle) return;
    elCardIdiomaTitle.textContent = 'Idioma & Identificador';
  }

  function actualizarSelectorLangId(selectedLang = 'es', currentClusterUid = '') {
    if (!inLangId) return;
    if (instSelectLangId) {
      instSelectLangId.destroy();
      instSelectLangId = null;
    }
    const opuestos = obtenerPostsOpuestos(selectedLang);
    inLangId.innerHTML = `<option value="">-- Sin vincular (Base original) --</option>`;

    let preselectedPartnerId = '';
    opuestos.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      const isSameCluster = currentClusterUid && p.langId === currentClusterUid;
      if (isSameCluster) {
        opt.selected = true;
        preselectedPartnerId = p.id;
      }
      opt.textContent = `${p.postId || p.id} - [${(p.lang || 'en').toUpperCase()}] ${p.titulo}${isSameCluster ? ' (Vinculado)' : ''}`;
      inLangId.appendChild(opt);
    });

    if (wiSelect) {
      instSelectLangId = wiSelect(inLangId, {
        placeholder: '-- Sin vincular (Base original) --',
        searchPlaceholder: 'Buscar por ID (ej: 00000002) o título...'
      });
      if (preselectedPartnerId && instSelectLangId) {
        instSelectLangId.setValue(preselectedPartnerId);
      }
    }
  }

  if (inLang && wiSelect) {
    instSelectLang = wiSelect(inLang, {
      placeholder: 'Selecciona idioma...',
      searchPlaceholder: 'Buscar idioma...',
      onChange: (val) => {
        const clusterUid = currentClusterUid || '';
        actualizarSelectorLangId(val, clusterUid);
        if (btnSubtabPreview?.classList.contains('active')) {
          switchSubtab('preview');
        }
      }
    });
  }

  // ════════════════════════════════════════════════════════════
  // 5. ACCIÓN: VINCULAR ARTÍCULO MANUALMENTE POR CLUSTER UID
  // ════════════════════════════════════════════════════════════
  btnSoloVincular?.addEventListener('click', () => {
    const currentId = inId?.value || inPostId?.value;
    if (!currentId) {
      Notificacion('Publica primero el artículo antes de vincular.', 'warning');
      return;
    }

    const partnerId = inLangId?.value;
    if (!partnerId) {
      desvincularPostCluster(currentId);
      const postActualizado = obtenerBlogs().find(b => b.id === currentId);
      actualizarEstadoVinculacion(postActualizado);
      actualizarSelectorLangId(postActualizado?.lang || 'es', postActualizado?.langId || '');
      Notificacion('Vínculo desasociado.', 'info');
      return;
    }

    const blogs = obtenerBlogs();
    const partnerPost = blogs.find(b => b.id === partnerId || b.postId === partnerId);
    if (!partnerPost) {
      Notificacion('No se encontró el artículo seleccionado para vincular.', 'error');
      return;
    }

    const clusterUid = vincularPostsCluster(currentId, partnerId);
    const postActualizado = blogs.find(b => b.id === currentId);

    actualizarEstadoVinculacion(postActualizado);
    actualizarSelectorLangId(postActualizado?.lang || 'es', clusterUid);
    renderizarPublicaciones();

    Notificacion(`¡Artículo vinculado con éxito con "${partnerPost.titulo}"!`, 'success');
  });

  // ════════════════════════════════════════════════════════════
  // 6. ACCIÓN: TRADUCIR CON IA (HEREDA EL MISMO CLUSTER langId)
  // ════════════════════════════════════════════════════════════
  async function traducirArticuloConIA() {
    const currentId = inId?.value || inPostId?.value;
    if (!currentId) {
      Notificacion('Debes publicar o guardar el artículo antes de traducir.', 'warning');
      return;
    }

    const blogs = obtenerBlogs();
    const currentPost = blogs.find(b => b.id === currentId || b.postId === currentId);
    if (!currentPost) {
      Notificacion('No se encontró el artículo en el sistema.', 'error');
      return;
    }

    const curLang = currentPost.lang || 'es';
    const targetLang = curLang === 'es' ? 'en' : 'es';
    const targetLangName = targetLang === 'en' ? 'Inglés' : 'Español';

    if (btnTraducirIA) {
      btnTraducirIA.disabled = true;
      btnTraducirIA.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Traduciendo...</span>`;
    }

    Notificacion(`Traduciendo artículo al ${targetLangName} con Gemini IA...`, 'info');

    const promptTraduccion = `
Eres un traductor y psicólogo clínico profesional bilingüe (español e inglés).
Traduce el siguiente artículo del idioma actual (${curLang.toUpperCase()}) al idioma destino (${targetLang.toUpperCase()}).
Mantén estrictamente el formato Markdown, los encabezados, citas, listas, llamadas (> [!NOTE]) y el tono clínico empático.
Adapta el título y genera un slug SEO amigable en ${targetLangName}.

TÍTULO ORIGINAL:
${currentPost.titulo}

DESCRIPCIÓN / RESUMEN:
${currentPost.descripcion}

PALABRAS CLAVE:
${Array.isArray(currentPost.keywords) ? currentPost.keywords.join(', ') : (currentPost.keywords || '')}

CATEGORÍA:
${currentPost.categoria}

CONTENIDO MARKDOWN COMPLETO:
${currentPost.contenidoMD || currentPost.contenido}

Devuelve EXCLUSIVAMENTE un objeto JSON válido con esta estructura:
{
  "titulo": "Título traducido en máx 60 caracteres",
  "slug": "slug-traducido",
  "resumen": "Resumen traducido de 100 a 200 caracteres",
  "keywords": "keywords en el idioma destino separadas por comas",
  "categoria": "Categoría clínica en el idioma destino",
  "tags": ["tag1", "tag2", "tag3"],
  "contenido": "Contenido completo en Markdown traducido"
}
`;

    try {
      const data = await consultarJsonGemini(promptTraduccion);
      if (!data || !data.titulo) {
        throw new Error('La respuesta de Gemini no contiene los campos requeridos');
      }

      // Buscar si ya existe una versión en targetLang dentro del mismo cluster
      const clusterUid = currentPost.langId || generarClusterUid();
      currentPost.langId = clusterUid;

      let counterpartPost = blogs.find(b => b.langId === clusterUid && b.lang === targetLang && b.id !== currentPost.id);

      if (counterpartPost) {
        // Actualizar el counterpart existente en el cluster
        counterpartPost.titulo = data.titulo;
        counterpartPost.slug = data.slug || slugify(data.titulo);
        counterpartPost.descripcion = data.resumen || '';
        counterpartPost.keywords = typeof data.keywords === 'string' ? data.keywords.split(',').map(s=>s.trim()) : data.keywords;
        counterpartPost.metaSEO = {
          keywords: typeof data.keywords === 'string' ? data.keywords : (data.keywords || []).join(', '),
          alt: data.titulo
        };
        counterpartPost.categoria = data.categoria || currentPost.categoria;
        counterpartPost.tags = Array.isArray(data.tags) ? data.tags : currentPost.tags;
        counterpartPost.contenido = data.contenido || '';
        counterpartPost.contenidoMD = data.contenido || '';
        counterpartPost.imagen = currentPost.imagen;
        counterpartPost.imagenTop = currentPost.imagenTop;
        counterpartPost.lang = targetLang;
        counterpartPost.langId = clusterUid;
        counterpartPost = await guardarBlog(counterpartPost, { forzarWrite: true });
      } else {
        // Crear nuevo post en el idioma opuesto heredando exactamente el mismo langId (Cluster UID)
        const nuevoPostId = generarSiguientePostId(blogs);
        const nuevoPost = {
          id: nuevoPostId,
          postId: nuevoPostId,
          slug: data.slug || slugify(data.titulo),
          lang: targetLang,
          langId: clusterUid,
          estado: 'borrador',
          activo: false, // Inicia como Borrador para revisión clínica previa a publicación
          pin: Boolean(currentPost.pin),
          userId: 'admin',
          autor: currentPost.autor || getAutorPorDefecto(),
          titulo: data.titulo,
          descripcion: data.resumen || '',
          categoria: data.categoria || currentPost.categoria,
          imagen: currentPost.imagen,
          imagenTop: currentPost.imagenTop,
          tags: Array.isArray(data.tags) ? data.tags : currentPost.tags,
          keywords: typeof data.keywords === 'string' ? data.keywords.split(',').map(s=>s.trim()) : data.keywords,
          metaSEO: {
            keywords: typeof data.keywords === 'string' ? data.keywords : (data.keywords || []).join(', '),
            alt: data.titulo
          },
          contenido: data.contenido || '',
          contenidoMD: data.contenido || ''
        };
        counterpartPost = await guardarBlog(nuevoPost, { forzarWrite: true });
        await guardarBlog(currentPost, { forzarWrite: true });
      }

      // Cargar el artículo traducido para que el usuario pueda revisarlo
      cargarParaEditar(counterpartPost.id, { silent: false });

      Notificacion(
        `✨ ¡Artículo traducido en Borrador (ID: ${counterpartPost.id})! Revisa el contenido y pulsa Publicar cuando esté listo.`,
        'success'
      );
    } catch (err) {
      console.error('[blogs.js] Error al traducir con Gemini:', err);
      Notificacion('Error al traducir: ' + (err.message || 'Consulta fallida'), 'error');
    } finally {
      if (btnTraducirIA) {
        btnTraducirIA.disabled = false;
        btnTraducirIA.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> <span>Traducir</span>';
      }
      wiTip();
    }
  }

  btnTraducirIA?.addEventListener('click', traducirArticuloConIA);

  // ════════════════════════════════════════════════════════════
  // 7. CONTADORES EN TIEMPO REAL Y SLUG AUTOMÁTICO
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
      if (liveLectura) liveLectura.textContent = `${min} min de lectura`;
    }
  }

  // Slug automático sincronizado con el título
  inTitulo?.addEventListener('input', () => {
    if (inSlug && inSlug.dataset.manualEdited !== 'true') {
      inSlug.value = slugify(inTitulo.value);
    }
    actualizarContadores();
  });

  inSlug?.addEventListener('input', () => {
    if (inSlug) inSlug.dataset.manualEdited = 'true';
  });

  inResumen?.addEventListener('input', actualizarContadores);
  inKeywords?.addEventListener('input', actualizarContadores);
  inContenido?.addEventListener('input', actualizarContadores);

  // ════════════════════════════════════════════════════════════
  // 8. SUBTABS EDITOR / VISTA PREVIA EN VIVO
  // ════════════════════════════════════════════════════════════
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

  // ════════════════════════════════════════════════════════════
  // 9. BARRA DE HERRAMIENTAS MARKDOWN
  // ════════════════════════════════════════════════════════════
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
        case 'h2': ins = `\n## ${sel || 'Título de Sección'}\n`; break;
        case 'h3': ins = `\n### ${sel || 'Subtítulo Clínico'}\n`; break;
        case 'link': ins = `[${sel || 'texto del enlace'}](https://)`; break;
        case 'quote': ins = `\n> ${sel || 'Cita clínica o reflexión'}\n`; break;
        case 'code': ins = `\`${sel || 'código'}\``; break;
        case 'table': ins = `\n| Concepto | Detalle Clínico |\n| --- | --- |\n| Aspecto A | Explicación |\n| Aspecto B | Explicación |\n`; break;
        case 'img': ins = `\n![Descripción de la imagen](/imgwii/servicios/psicoterapia-pareja.webp)\n`; break;
        case 'note': ins = `\n> [!NOTE]\n> **Nota Clínica:** ${sel || 'Escribe aquí la recomendación o apunte clínico.'}\n`; break;
        case 'tip': ins = `\n> [!TIP]\n> **Consejo Práctico:** ${sel || 'Pauta para aplicar en el día a día.'}\n`; break;
        case 'warning': ins = `\n> [!WARNING]\n> **Advertencia:** ${sel || 'Pauta de cuidado o alerta clínica.'}\n`; break;
      }

      inContenido.setRangeText(ins, start, end, 'end');
      inContenido.focus();
      actualizarContadores();
    });
  });

  // ════════════════════════════════════════════════════════════
  // 10. GESTOR DE CHIPS DE ETIQUETAS (TAGS)
  // ════════════════════════════════════════════════════════════
  function renderTags() {
    if (!boxTags) return;
    if (currentTags.length === 0) {
      boxTags.innerHTML = `<span class="bl-tags-empty"><i class="fa-solid fa-tags"></i> Sin etiquetas asignadas</span>`;
      return;
    }
    boxTags.innerHTML = currentTags.map((tag, idx) => `
      <span class="bl-tag-chip">
        <span class="bl-tag-hash">#</span><span class="bl-tag-text">${tag}</span>
        <button type="button" class="bl-tag-del" data-tag-idx="${idx}" title="Eliminar #${tag}">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </span>
    `).join('');

    boxTags.querySelectorAll('.bl-tag-del').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.getAttribute('data-tag-idx'), 10);
        if (!isNaN(i)) {
          currentTags.splice(i, 1);
          renderTags();
        }
      });
    });
  }

  inTagsInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = inTagsInput.value.replace(/#/g, '').trim().toLowerCase();
      if (val && !currentTags.includes(val)) {
        currentTags.push(val);
        renderTags();
      }
      inTagsInput.value = '';
    }
  });

  // ════════════════════════════════════════════════════════════
  // 11. PREVISUALIZACIÓN Y COPIA DE IMÁGENES
  // ════════════════════════════════════════════════════════════
  function actualizarPrevisualizacionImagenes() {
    const urlMin = inImagen?.value.trim() || '/smile.avif';
    const urlTop = inImagenTop?.value.trim() || inImagen?.value.trim() || '/smile.avif';

    if (previewThumb) previewThumb.src = urlMin;
    if (previewThumbTop) previewThumbTop.src = urlTop;

    const fullUrlMin = resolverUrlCompleta(urlMin);
    const fullUrlTop = resolverUrlCompleta(urlTop);

    if (linkVerImagen) linkVerImagen.href = fullUrlMin;
    if (linkVerImagenTop) linkVerImagenTop.href = fullUrlTop;
  }

  inImagen?.addEventListener('input', actualizarPrevisualizacionImagenes);
  inImagenTop?.addEventListener('input', actualizarPrevisualizacionImagenes);

  inActivo?.addEventListener('change', () => {
    if (inActivo.checked) {
      if (btnSubmitText) btnSubmitText.textContent = isEditing ? 'Actualizar' : 'Publicar';
      if (btnSubmitIcon) btnSubmitIcon.className = isEditing ? 'fa-solid fa-floppy-disk' : 'fa-solid fa-paper-plane';
      btnSubmitPost?.setAttribute('data-witip', isEditing ? 'Guardar cambios del artículo' : 'Publicar artículo');
    } else {
      if (btnSubmitText) btnSubmitText.textContent = 'Publicar';
      if (btnSubmitIcon) btnSubmitIcon.className = 'fa-solid fa-paper-plane';
      btnSubmitPost?.setAttribute('data-witip', 'Publicar artículo en vivo y en Firebase');
    }
  });

  btnCopyImgThumb?.addEventListener('click', async () => {
    const url = resolverUrlCompleta(inImagen?.value.trim() || '/smile.avif');
    try {
      await navigator.clipboard.writeText(url);
      Notificacion('URL de miniatura copiada: ' + url, 'success');
    } catch (e) {
      Notificacion('No se pudo copiar automáticamente: ' + url, 'warning');
    }
  });

  btnCopyImgTop?.addEventListener('click', async () => {
    const url = resolverUrlCompleta(inImagenTop?.value.trim() || inImagen?.value.trim() || '/smile.avif');
    try {
      await navigator.clipboard.writeText(url);
      Notificacion('URL de cabecera copiada: ' + url, 'success');
    } catch (e) {
      Notificacion('No se pudo copiar automáticamente: ' + url, 'warning');
    }
  });

  // ════════════════════════════════════════════════════════════
  // 12. BOTÓN "NUEVO": AUTO-ID Y AUTO-SLUG
  // ════════════════════════════════════════════════════════════
  btnNuevoPost?.addEventListener('click', () => {
    const hayCambios = (inTitulo?.value.trim() !== '') || (inContenido?.value.trim() !== '');
    if (hayCambios) {
      const seguro = confirm('¿Deseas descartar los cambios actuales e iniciar una nueva publicación en blanco?');
      if (!seguro) return;
    }
    limpiarFormulario();
    Notificacion('Nuevo borrador listo para redactar.', 'info');
  });

  function limpiarFormulario() {
    isEditing = false;
    currentEditingPostId = '';

    // Auto-generación del siguiente postId disponible (ej. si hay 5, genera 00000006)
    const blogs = obtenerBlogs();
    const nextPostId = generarSiguientePostId(blogs);
    const newClusterUid = generarClusterUid();

    if (inPostId) inPostId.value = nextPostId;
    if (inId) inId.value = nextPostId;

    currentClusterUid = newClusterUid;

    validarIdEnTiempoReal();

    if (inTitulo) inTitulo.value = '';
    if (inSlug) {
      inSlug.value = '';
      inSlug.dataset.manualEdited = 'false';
    }
    if (inResumen) inResumen.value = '';
    if (inKeywords) inKeywords.value = '';
    if (inContenido) inContenido.value = '';
    if (inCategoria) inCategoria.value = 'General';
    if (inAutor) inAutor.value = getAutorPorDefecto();
    if (inImagen) inImagen.value = resolverUrlCompleta('/smile.avif');
    if (inImagenTop) inImagenTop.value = resolverUrlCompleta('/smile.avif');
    if (inActivo) inActivo.checked = false;
    if (inPin) inPin.checked = false;

    // Cambiar botón a Publicar
    if (btnSubmitText) btnSubmitText.textContent = 'Publicar';
    if (btnSubmitIcon) btnSubmitIcon.className = 'fa-solid fa-paper-plane';
    btnSubmitPost?.setAttribute('data-witip', 'Publicar artículo en vivo y en Firebase');

    if (instSelectLang) {
      instSelectLang.setValue('es');
    } else if (inLang) {
      inLang.value = 'es';
    }

    currentTags = [];
    renderTags();
    actualizarPrevisualizacionImagenes();
    actualizarSelectorLangId('es', newClusterUid);
    actualizarContadores();
    actualizarEstadoVinculacion(null);
    actualizarCardIdiomaHeader('');
  }

  // ════════════════════════════════════════════════════════════
  // 13. GUARDAR / ACTUALIZAR PUBLICACIÓN (CON VALIDACIÓN DE ID)
  // ════════════════════════════════════════════════════════════
  formEditor?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validar ID disponible
    const idValido = validarIdEnTiempoReal();
    if (!idValido) {
      Notificacion('El ID ingresado ya está en uso o no es válido. Ingresa un ID disponible.', 'error');
      inPostId?.focus();
      return;
    }

    const tituloVal = inTitulo?.value.trim();
    const slugVal = slugify(inSlug?.value.trim() || inTitulo?.value.trim());
    const contenidoVal = inContenido?.value.trim();

    if (!tituloVal || !contenidoVal) {
      Notificacion('Debes completar el título y el contenido del artículo.', 'warning');
      return;
    }

    const candidatePostId = (inPostId?.value || inId?.value || '').trim().padStart(8, '0');
    const clusterUid = currentClusterUid || generarClusterUid();

    // Si el botón muestra 'Publicar' o el usuario pulsó publicar en un borrador, se activa canónicamente
    const esAccionPublicar = btnSubmitText?.textContent === 'Publicar';
    const activoFinal = esAccionPublicar ? true : (inActivo ? inActivo.checked : true);
    const estadoFinal = activoFinal ? 'publicado' : 'borrador';

    if (inActivo) inActivo.checked = activoFinal;

    const payload = {
      id: candidatePostId,
      postId: candidatePostId,
      slug: slugVal,
      lang: inLang?.value || 'es',
      langId: clusterUid,
      estado: estadoFinal,
      activo: activoFinal,
      pin: inPin ? inPin.checked : false,
      userId: 'admin',
      autor: inAutor?.value.trim() || getAutorPorDefecto(),
      titulo: tituloVal,
      descripcion: inResumen?.value.trim() || '',
      categoria: inCategoria?.value.trim() || 'General',
      imagen: inImagen?.value.trim() || '/smile.avif',
      imagenTop: inImagenTop?.value.trim() || inImagen?.value.trim() || '/smile.avif',
      tags: currentTags,
      keywords: inKeywords?.value.trim() ? inKeywords.value.split(',').map(s=>s.trim()).filter(Boolean) : currentTags,
      metaSEO: {
        keywords: inKeywords?.value.trim() || currentTags.join(', '),
        alt: tituloVal
      },
      contenido: contenidoVal,
      contenidoMD: contenidoVal
    };

    const guardado = await guardarBlog(payload, { forzarWrite: true });
    isEditing = true;
    currentEditingPostId = guardado.id;

    if (inId) inId.value = guardado.id;
    if (inPostId) inPostId.value = guardado.postId || guardado.id;

    // Si se seleccionó vincular con un artículo hermano existente
    const selectedPartnerId = inLangId?.value;
    if (selectedPartnerId) {
      vincularPostsCluster(guardado.id, selectedPartnerId);
    }

    validarIdEnTiempoReal();

    // Conmutar botón a Actualizar una vez publicado
    if (btnSubmitText) btnSubmitText.textContent = 'Actualizar';
    if (btnSubmitIcon) btnSubmitIcon.className = 'fa-solid fa-floppy-disk';
    btnSubmitPost?.setAttribute('data-witip', 'Guardar cambios del artículo publicado');

    syncUrlParams(guardado.id, 'redactor');
    actualizarEstadoVinculacion(guardado);
    actualizarSelectorLangId(guardado.lang, guardado.langId);
    actualizarCardIdiomaHeader(guardado.id);
    renderizarPublicaciones();
  });

  // ════════════════════════════════════════════════════════════
  // 14. CARGAR PARA EDITAR (CON MODO SILENCIOSO ANTI-DUPLICADOS)
  // ════════════════════════════════════════════════════════════
  function cargarParaEditar(id, { silent = false } = {}) {
    const blogs = obtenerBlogs();
    const idStr = String(id).padStart(8, '0');
    const post = blogs.find(b => b.id === id || b.id === idStr || b.postId === id || b.postId === idStr);
    if (!post) return;

    isEditing = true;
    currentEditingPostId = post.id;
    activarTab('redactor', false);

    if (inId) inId.value = post.id;
    if (inPostId) inPostId.value = post.postId || post.id;
    validarIdEnTiempoReal();

    if (inTitulo) inTitulo.value = post.titulo;
    if (inSlug) {
      inSlug.value = post.slug;
      inSlug.dataset.manualEdited = 'true';
    }
    if (inResumen) inResumen.value = post.descripcion || '';
    if (inKeywords) inKeywords.value = Array.isArray(post.keywords) ? post.keywords.join(', ') : (post.metaSEO?.keywords || '');
    if (inContenido) inContenido.value = post.contenidoMD || post.contenido || '';
    if (inCategoria) inCategoria.value = post.categoria || 'General';
    if (inAutor) inAutor.value = post.autor || getAutorPorDefecto();
    if (inImagen) inImagen.value = resolverUrlCompleta(post.imagen || '/smile.avif');
    if (inImagenTop) inImagenTop.value = resolverUrlCompleta(post.imagenTop || post.imagen || '/smile.avif');
    
    const esBorrador = post.activo === false || post.estado === 'borrador';
    if (inActivo) inActivo.checked = !esBorrador;
    if (inPin) inPin.checked = Boolean(post.pin);

    // Contextualizar botón: Borrador -> 'Publicar' (avión), Publicado -> 'Actualizar' (disquete)
    if (esBorrador) {
      if (btnSubmitText) btnSubmitText.textContent = 'Publicar';
      if (btnSubmitIcon) btnSubmitIcon.className = 'fa-solid fa-paper-plane';
      btnSubmitPost?.setAttribute('data-witip', 'Publicar este borrador en vivo y en Firebase');
    } else {
      if (btnSubmitText) btnSubmitText.textContent = 'Actualizar';
      if (btnSubmitIcon) btnSubmitIcon.className = 'fa-solid fa-floppy-disk';
      btnSubmitPost?.setAttribute('data-witip', 'Guardar cambios del artículo publicado');
    }

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
    actualizarEstadoVinculacion(post);
    actualizarCardIdiomaHeader(post.id);
    syncUrlParams(post.id, 'redactor');
    switchSubtab('write');

    if (!silent) {
      Notificacion(`Editando: "${post.titulo}" (ID: ${post.id})`, 'info');
    }
  }

  // ════════════════════════════════════════════════════════════
  // 15. TABLA DE PUBLICACIONES (CON VÍNCULOS POR CLUSTER UID)
  // ════════════════════════════════════════════════════════════
  function actualizarListaPublicaciones() {
    renderizarPublicaciones();
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
        (b.id && b.id.includes(query)) ||
        (b.postId && b.postId.includes(query)) ||
        b.titulo.toLowerCase().includes(query) || 
        b.slug.toLowerCase().includes(query) ||
        b.descripcion.toLowerCase().includes(query);
      return matchLang && matchCat && matchQuery;
    });

    if (tableTotalBadge) {
      tableTotalBadge.textContent = `${filtrados.length} ${filtrados.length === 1 ? 'publicación' : 'publicaciones'}`;
    }

    if (!tableBody) return;

    if (filtrados.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 48px 20px;">
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
        activarTab('redactor', true);
      });
      return;
    }

    tableBody.innerHTML = filtrados.map(b => {
      const publicUrl = (b.lang && b.lang !== 'es') ? `/${b.lang}/${b.slug}` : `/${b.slug}`;

      // Título truncado a 30 caracteres
      const tituloTruncado = truncarTexto(b.titulo, 30);

      // Slug truncado a 28 caracteres
      const slugTruncado = truncarTexto(publicUrl, 28);

      // Formateo de Fecha y Hora con segundos (HH:mm:ss)
      const ts = b.actualizado || b.creado || (b.publicado ? new Date(b.publicado).getTime() : Date.now());
      const d = new Date(ts);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      const fechaFmt = b.publicado || `${yyyy}/${mm}/${dd}`;
      const horaFmt = `${hh}:${min}:${ss}`;

      // Verificar si tiene versión vinculada en el Cluster UID
      const partner = b.langId ? blogs.find(x => x.langId === b.langId && x.id !== b.id) : null;
      const partnerUrl = partner ? ((partner.lang && partner.lang !== 'es') ? `/${partner.lang}/${partner.slug}` : `/${partner.slug}`) : '';

      const partnerInfo = partner 
        ? `<div class="bl-partner-pill-group">
             <button type="button" class="bl-badge-linked-btn bl-btn-edit-partner" data-edit-partner-id="${partner.id}" data-witip="Editar versión vinculada [${(partner.lang || 'en').toUpperCase()}]: ${partner.titulo}" data-wtipo="top">
               <span class="bl-partner-tag">${(partner.lang || 'en').toUpperCase()}</span>
               <span class="bl-partner-id-text">#${partner.postId || partner.id}</span>
               <i class="fa-solid fa-pen-to-square bl-partner-edit-icon"></i>
             </button>
             <a href="${partnerUrl}" target="_blank" rel="noopener noreferrer" class="bl-link-partner-web" data-witip="Abrir versión [${(partner.lang || 'en').toUpperCase()}] en nueva pestaña" data-wtipo="top">
               <i class="fa-solid fa-arrow-up-right-from-square"></i>
             </a>
           </div>`
        : `<button type="button" class="bl-badge-action-vincular" data-vincular-id="${b.id}" data-witip="Haz clic para vincular o redactar versión en otro idioma" data-wtipo="top">
             <i class="fa-solid fa-link-slash"></i>
             <span>Sin versión</span>
             <span class="bl-vincular-cta">+ Vincular</span>
           </button>`;

      return `
        <tr data-post-id="${b.id}">
          <td>
            <div class="bl-table-post-cell">
              <a href="${publicUrl}" target="_blank" rel="noopener noreferrer" class="bl-table-thumb-link" data-witip="Abrir artículo en nueva pestaña" data-wtipo="top">
                <img src="${b.imagen || '/smile.avif'}" alt="${b.titulo}" class="bl-table-thumb" loading="lazy" />
              </a>
              <div class="bl-table-info">
                <a href="${publicUrl}" target="_blank" rel="noopener noreferrer" class="bl-table-title-link" title="${b.titulo}" data-witip="${b.titulo}" data-wtipo="top">
                  <strong class="bl-table-title">${tituloTruncado}</strong>
                </a>
                <a href="${publicUrl}" target="_blank" rel="noopener noreferrer" class="bl-table-slug-link" title="${publicUrl}" data-witip="Abrir: ${publicUrl}" data-wtipo="top">
                  <span class="bl-table-id-badge">ID: ${b.postId || b.id}</span>
                  <span class="bl-table-slug-text">· ${slugTruncado}</span>
                  <i class="fa-solid fa-arrow-up-right-from-square bl-slug-open-icon"></i>
                </a>
              </div>
            </div>
          </td>
          <td>
            <div class="bl-table-lang-stack">
              <span class="bl-badge-primary-lang ${b.lang === 'en' ? 'is-en' : 'is-es'}">
                <i class="fa-solid fa-globe"></i>
                <span>${b.lang === 'en' ? 'English (EN)' : 'Español (ES)'}</span>
              </span>
              ${partnerInfo}
            </div>
          </td>
          <td>
            <div class="bl-table-date-col">
              <span class="bl-table-date-text" title="Fecha de publicación">
                <i class="fa-regular fa-calendar"></i>${fechaFmt}
              </span>
              <span class="bl-table-time-text" title="Hora exacta de actualización">
                <i class="fa-regular fa-clock"></i>${horaFmt}
              </span>
            </div>
          </td>
          <td>
            <span class="bl-metric-single views" title="${(b.vistas || 0).toLocaleString()} vistas">
              <i class="fa-regular fa-eye"></i> <span>${(b.vistas || 0).toLocaleString()}</span>
            </span>
          </td>
          <td>
            <span class="bl-metric-single likes" title="${(b.likes || 0).toLocaleString()} me gusta">
              <i class="fa-solid fa-heart"></i> <span>${(b.likes || 0).toLocaleString()}</span>
            </span>
          </td>
          <td>
            <div style="display:flex; align-items:center;">
              <span class="bl-badge-status ${(b.activo && b.estado !== 'borrador') ? 'bl-badge-active' : 'bl-badge-draft'}">
                ${(b.activo && b.estado !== 'borrador') ? 'Publicado' : 'Borrador'}
              </span>
              ${b.pin ? '<span class="bl-badge-pin" data-witip="Fijado en portada" data-wtipo="top"><i class="fa-solid fa-thumbtack"></i></span>' : ''}
            </div>
          </td>
          <td style="text-align:right;">
            <div class="bl-table-actions">
              <button type="button" class="bl-action-btn bl-btn-edit" data-edit-id="${b.id}" data-witip="Editar artículo en el redactor" data-wtipo="top">
                <i class="fa-solid fa-pen-to-square"></i> Editar
              </button>
              <button type="button" class="bl-action-btn bl-btn-pin" data-pin-id="${b.id}" data-witip="${b.pin ? 'Quitar Pin de portada' : 'Fijar en Portada'}" data-wtipo="top">
                <i class="fa-solid fa-thumbtack" style="${b.pin ? 'color:var(--brand-primary, #104356);' : ''}"></i>
              </button>
              <button type="button" class="bl-action-btn btn-del bl-btn-del" data-del-id="${b.id}" data-witip="Eliminar publicación" data-wtipo="top">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Listeners interactivos de vinculación de idioma
    tableBody.querySelectorAll('.bl-badge-action-vincular').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-vincular-id');
        if (!id) return;
        cargarParaEditar(id, { silent: false });
        activarTab('redactor', true);
        setTimeout(() => {
          const cardVincular = document.getElementById('blSelectLangId')?.closest('.bl-card');
          if (cardVincular) {
            cardVincular.scrollIntoView({ behavior: 'smooth', block: 'center' });
            cardVincular.classList.add('bl-highlight-pulse');
            setTimeout(() => cardVincular.classList.remove('bl-highlight-pulse'), 2500);
          }
          Notificacion('Selecciona un artículo en "Vincular Artículo" o pulsa "Traducir" para crear su par bilingüe.', 'info');
        }, 150);
      });
    });

    tableBody.querySelectorAll('.bl-btn-edit-partner').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const partnerId = btn.getAttribute('data-edit-partner-id');
        if (partnerId) {
          cargarParaEditar(partnerId, { silent: false });
          activarTab('redactor', true);
        }
      });
    });

    // Listeners de la tabla
    tableBody.querySelectorAll('.bl-btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-edit-id');
        if (id) cargarParaEditar(id, { silent: false });
      });
    });

    tableBody.querySelectorAll('.bl-btn-pin').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-pin-id');
        if (id) {
          const isPinned = togglePinBlog(id);
          Notificacion(isPinned ? 'Artículo fijado en portada.' : 'Artículo desanclado de portada.', 'info');
          renderizarPublicaciones();
        }
      });
    });

    tableBody.querySelectorAll('.bl-btn-del').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-del-id');
        if (id && confirm(`¿Estás seguro de eliminar permanentemente esta publicación (ID: ${id})?`)) {
          eliminarBlog(id);
          Notificacion('Publicación eliminada con éxito.', 'warning');
          renderizarPublicaciones();
        }
      });
    });

    wiTip();
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

  btnSyncSemillas?.addEventListener('click', () => {
    sincronizarConSemilla();
    renderizarPublicaciones();
    Notificacion('¡Artículos sincronizados exitosamente desde blogs.json!', 'success');
  });

  btnExportarJson?.addEventListener('click', () => {
    const blogs = obtenerBlogs();
    const mapObj = {};
    blogs.forEach(b => {
      mapObj[b.id] = b;
    });
    const blob = new Blob([JSON.stringify(mapObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blogs.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    Notificacion('¡Archivo blogs.json descargado en formato Map/Object!', 'success');
  });

  // ════════════════════════════════════════════════════════════
  // 16. INICIALIZAR ESTADO SEGÚN URL (?id=... &tab=...)
  // ════════════════════════════════════════════════════════════
  const params = new URLSearchParams(window.location.search);
  const idParam = params.get('id');
  const tabParam = params.get('tab');

  if (idParam) {
    cargarParaEditar(idParam, { silent: true });
  } else if (tabParam === 'publicaciones') {
    activarTab('publicaciones', false);
  } else {
    limpiarFormulario();
    activarTab('redactor', false);
  }
}

// Inicialización idempotente gestionada vía wiInit
wiInit(inicializarBlogs);
