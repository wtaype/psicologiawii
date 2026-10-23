// src/feature/personal/modulos/galeria/galeria.js
// Controlador Frontend Autónomo del Módulo Galería
// 100% JS Nativo · Integrado con @widev

import { Notificacion, wiSpin, wiConfirmar } from '@widev';
import {
  obtenerImagenesGaleria,
  obtenerCategoriasDisponibles,
  sincronizarGaleriaConFirestore,
  procesarSubidaImagen,
  actualizarImagenCompleta,
  eliminarImagenGaleria
} from './dataGaleria.js';

export function inicializarModuloGaleria() {
  const panel = document.getElementById('panel-galeria');
  if (!panel || panel.dataset.galeriaInit === 'true') return;
  panel.dataset.galeriaInit = 'true';

  let categoriaActual = 'todas';

  // ── Elementos del DOM ──
  const gridContainer = document.getElementById('glGridContainer');
  const filtersWrap = document.getElementById('glFiltersWrap');
  const statsBadge = document.getElementById('glStatsBadge');
  const btnSubirTrigger = document.getElementById('btnGlSubirTrigger');
  const btnSync = document.getElementById('btnGlSync');

  // ── Modal de Subida Split 90vw x 90vh ──
  const modalSubida = document.getElementById('glModalSubida');
  const btnModalClose = document.getElementById('btnGlModalClose');
  const btnCancelSubida = document.getElementById('btnGlCancelSubida');
  const dropzone = document.getElementById('glDropzone');
  const btnBrowseFile = document.getElementById('btnGlBrowseFile');
  const fileInput = document.getElementById('glFileInput');
  const uploadEmptyState = document.getElementById('glUploadEmptyState');
  const uploadPreviewState = document.getElementById('glUploadPreviewState');
  const uploadPreviewImg = document.getElementById('glUploadPreviewImg');
  const btnChangeFile = document.getElementById('btnGlChangeFile');
  const uploadPeso = document.getElementById('glUploadPeso');
  const uploadDimensiones = document.getElementById('glUploadDimensiones');
  const uploadStorageBadge = document.getElementById('glUploadStorageBadge');
  const selectCategoria = document.getElementById('glSelectCategoria');
  const inTitulo = document.getElementById('glInpTitulo');
  const inAlt = document.getElementById('glInpAlt');
  const inPinSubida = document.getElementById('glInpPinSubida');
  const formSubida = document.getElementById('formGlSubida');
  const btnSubmitSubida = document.getElementById('btnGlSubmitSubida');
  let previewObjectURL = null;

  // ── Modal de Edición Split 90vw x 90vh ──
  const modalEditar = document.getElementById('glModalEditar');
  const btnModalEditClose = document.getElementById('btnGlModalEditClose');
  const btnCancelEdit = document.getElementById('btnGlCancelEdit');
  const formEditar = document.getElementById('formGlEditar');
  const editInpId = document.getElementById('glEditInpId');
  const editPreviewImg = document.getElementById('glEditPreviewImg');
  const editStageBadges = document.getElementById('glEditStageBadges');
  const editStorageBadge = document.getElementById('glEditStorageBadge');
  const editPeso = document.getElementById('glEditPeso');
  const editDimensiones = document.getElementById('glEditDimensiones');
  const editFecha = document.getElementById('glEditFecha');
  const editActualizado = document.getElementById('glEditActualizado');
  const editUsuario = document.getElementById('glEditUsuario');
  const editSelectCategoria = document.getElementById('glEditSelectCategoria');
  const editInpTitulo = document.getElementById('glEditInpTitulo');
  const editInpAlt = document.getElementById('glEditInpAlt');
  const editInpPin = document.getElementById('glEditInpPin');
  const btnSubmitEdit = document.getElementById('btnGlSubmitEdit');

  // ── Lightbox ──
  const lightbox = document.getElementById('glLightbox');
  const lightboxImg = document.getElementById('glLightboxImg');
  const lightboxMeta = document.getElementById('glLightboxMeta');
  const btnLightboxClose = document.getElementById('btnGlLightboxClose');

  // ════════════════════════════════════════════════════════════
  // 1. SINCRONIZACIÓN DINÁMICA DE CATEGORÍAS (EN CASCADA)
  // ════════════════════════════════════════════════════════════
  function sincronizarControlesCategorias() {
    const cats = obtenerCategoriasDisponibles();

    // 1.1 Renderizar Pills de Filtros en Cascada
    if (filtersWrap) {
      const pillsHtml = [
        `<button type="button" class="gl-filter-pill ${categoriaActual === 'todas' ? 'active' : ''}" data-cat="todas">Todas</button>`,
        ...cats.map(cat => `
          <button type="button" class="gl-filter-pill ${categoriaActual === cat ? 'active' : ''}" data-cat="${cat}">
            ${cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        `)
      ].join('');

      filtersWrap.innerHTML = pillsHtml;

      filtersWrap.querySelectorAll('.gl-filter-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          filtersWrap.querySelectorAll('.gl-filter-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          categoriaActual = btn.getAttribute('data-cat') || 'todas';
          renderizarGrid();
        });
      });
    }

    // 1.2 Opciones para selects de subida y edición
    const opcionesHtml = cats.map(cat => 
      `<option value="${cat}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</option>`
    ).join('');

    if (selectCategoria && selectCategoria.children.length !== cats.length) {
      const prevVal = selectCategoria.value;
      selectCategoria.innerHTML = opcionesHtml;
      if (cats.includes(prevVal)) selectCategoria.value = prevVal;
    }

    if (editSelectCategoria) {
      const prevVal = editSelectCategoria.value;
      editSelectCategoria.innerHTML = opcionesHtml;
      if (cats.includes(prevVal)) editSelectCategoria.value = prevVal;
    }
  }

  // ════════════════════════════════════════════════════════════
  // 2. RENDERIZADO DEL GRID DE IMÁGENES
  // ════════════════════════════════════════════════════════════
  function renderizarGrid() {
    if (!gridContainer) return;
    const todas = obtenerImagenesGaleria();
    const filtradas = categoriaActual === 'todas'
      ? todas
      : todas.filter(img => img.categoria === categoriaActual);

    if (statsBadge) {
      statsBadge.textContent = `${filtradas.length} archivos multimedia`;
    }

    if (filtradas.length === 0) {
      gridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--tx2);">
          <i class="fa-regular fa-image" style="font-size: 32px; opacity: 0.4; margin-bottom: 8px; display: block;"></i>
          No hay fotografías en esta categoría.
        </div>
      `;
      return;
    }

    gridContainer.innerHTML = filtradas.map(img => {
      const esNube = Boolean(img.url && (img.url.startsWith('http://') || img.url.startsWith('https://') || img.url.includes('.r2.dev') || img.url.includes('cloudflarestorage')));

      return `
        <div class="gl-card ${img.pin ? 'pinned' : ''}" data-id="${img.id}">
          <div class="gl-thumb-wrap" data-img-id="${img.id}">
            <img src="${img.url}" alt="${img.alt}" class="gl-thumb" loading="lazy" />
            <span class="gl-category-tag">${img.categoria}</span>
            ${img.pin ? `
              <div class="gl-thumb-badges">
                <span class="gl-pin-badge" title="Fijado al inicio"><i class="fa-solid fa-thumbtack"></i></span>
              </div>
            ` : ''}
            <span class="gl-size-tag">${img.pesoKb} KB</span>
          </div>
          <div class="gl-body">
            <h4 class="gl-title" title="${img.titulo}">${img.titulo}</h4>
            <div class="gl-footer">
              <button type="button" class="gl-btn-copy-url" data-url="${img.url}">
                <i class="fa-solid fa-copy"></i> Copiar URL
              </button>
              <div class="gl-footer-actions">
                <button type="button" class="gl-btn-edit" data-id="${img.id}" title="Editar imagen y pin">
                  <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button type="button" class="gl-btn-delete" data-id="${img.id}" title="Eliminar imagen">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Listeners en thumbnails para abrir Lightbox
    gridContainer.querySelectorAll('.gl-thumb-wrap').forEach(wrap => {
      wrap.addEventListener('click', (e) => {
        if (e.target.closest('.gl-thumb-badges')) return;
        const id = wrap.getAttribute('data-img-id');
        const img = todas.find(x => x.id === id);
        if (img) abrirLightbox(img);
      });
    });

    // Listeners para copiar URL absoluta y completa usando window.location.origin
    gridContainer.querySelectorAll('.gl-btn-copy-url').forEach(btn => {
      btn.addEventListener('click', async () => {
        const url = btn.getAttribute('data-url') || '';
        const urlCompleta = url.startsWith('http://') || url.startsWith('https://')
          ? url
          : `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;

        try {
          await navigator.clipboard.writeText(urlCompleta);
          Notificacion('¡URL completa copiada al portapapeles!', 'success', 2000);
        } catch (e) {
          Notificacion('No se pudo copiar automáticamente.', 'info', 2000);
        }
      });
    });

    // Listeners para abrir modal de edición
    gridContainer.querySelectorAll('.gl-btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const img = todas.find(x => x.id === id);
        if (img) abrirModalEditar(img);
      });
    });

    // Listeners para eliminar (soft-delete seguro)
    gridContainer.querySelectorAll('.gl-btn-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const img = todas.find(x => x.id === id);
        if (!img) return;

        const conf = await wiConfirmar(`¿Eliminar la imagen "${img.titulo}" de la galería?`, {
          titulo: 'Eliminar Imagen',
          tipo: 'danger',
          siTexto: 'Sí, Eliminar'
        });

        if (conf) {
          await eliminarImagenGaleria(id);
          sincronizarControlesCategorias();
          renderizarGrid();
          Notificacion('Imagen retirada de la galería.', 'info', 2000);
        }
      });
    });
  }

  // ════════════════════════════════════════════════════════════
  // 3. MODAL DE EDICIÓN DE IMAGEN (SPLIT 90vw x 90vh)
  // ════════════════════════════════════════════════════════════
  function abrirModalEditar(img) {
    if (!modalEditar) return;
    const esNube = Boolean(img.url && (img.url.startsWith('http://') || img.url.startsWith('https://') || img.url.includes('.r2.dev') || img.url.includes('cloudflarestorage')));

    sincronizarControlesCategorias();

    if (editInpId) editInpId.value = img.id;
    if (editPreviewImg) editPreviewImg.src = img.url;
    if (editInpTitulo) editInpTitulo.value = img.titulo || '';
    if (editSelectCategoria) editSelectCategoria.value = img.categoria || 'otros';
    if (editInpAlt) editInpAlt.value = img.alt || '';
    if (editInpPin) editInpPin.checked = Boolean(img.pin);

    // Badges flotantes en la imagen del modal
    if (editStageBadges) {
      editStageBadges.innerHTML = img.pin
        ? '<span class="gl-pin-badge" title="Fijado al inicio"><i class="fa-solid fa-thumbtack"></i></span>'
        : '';
    }

    if (editStorageBadge) {
      editStorageBadge.innerHTML = esNube
        ? '<i class="fa-solid fa-cloud"></i> Cloudflare R2 & Firestore'
        : '<i class="fa-solid fa-hard-drive"></i> Recurso Local (Semilla)';
      editStorageBadge.className = `gl-edit-storage-badge ${esNube ? 'is-cloud' : 'is-local'}`;
    }
    if (editPeso) editPeso.textContent = `${img.pesoKb || 38} KB · WebP`;
    if (editDimensiones) editDimensiones.textContent = img.dimensiones || 'Optimizado WebP';
    if (editFecha) editFecha.textContent = img.fechaSubida || '2026-10-11';
    if (editActualizado) {
      editActualizado.textContent = img.actualizado ? img.actualizado.slice(0, 10) : (img.fechaSubida || '2026-10-11');
    }
    if (editUsuario) {
      editUsuario.textContent = img.userId ? `ID: ${img.userId.slice(0, 8)}...` : 'Oficial (Semilla)';
    }

    modalEditar.classList.add('open');
  }

  function cerrarModalEditar() {
    modalEditar?.classList.remove('open');
  }

  btnModalEditClose?.addEventListener('click', cerrarModalEditar);
  btnCancelEdit?.addEventListener('click', cerrarModalEditar);
  modalEditar?.addEventListener('click', (e) => {
    if (e.target === modalEditar) cerrarModalEditar();
  });

  formEditar?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = editInpId?.value;
    if (!id) return;

    const titulo = editInpTitulo?.value.trim() || '';
    const categoria = editSelectCategoria?.value || 'otros';
    const alt = editInpAlt?.value.trim() || titulo;
    const pin = Boolean(editInpPin?.checked);

    const spin = wiSpin ? wiSpin(btnSubmitEdit) : null;
    if (btnSubmitEdit) btnSubmitEdit.disabled = true;

    try {
      await actualizarImagenCompleta(id, { titulo, categoria, alt, pin });
      Notificacion('¡Detalles de la imagen actualizados!', 'success', 2500);
      cerrarModalEditar();
      sincronizarControlesCategorias();
      renderizarGrid();
    } catch (err) {
      console.error(err);
      Notificacion('Error al guardar cambios.', 'danger', 3000);
    } finally {
      if (spin) spin.stop();
      if (btnSubmitEdit) btnSubmitEdit.disabled = false;
    }
  });

  // ════════════════════════════════════════════════════════════
  // 4. LIGHTBOX VIEWER
  // ════════════════════════════════════════════════════════════
  function abrirLightbox(img) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = img.url;
    if (lightboxMeta) {
      lightboxMeta.innerHTML = `<strong>${img.titulo}</strong> · ${img.dimensiones} (${img.pesoKb} KB)<br><small>${img.alt}</small>`;
    }
    lightbox.classList.add('open');
  }

  btnLightboxClose?.addEventListener('click', () => {
    lightbox?.classList.remove('open');
  });

  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) lightbox.classList.remove('open');
  });

  // ════════════════════════════════════════════════════════════
  // ════════════════════════════════════════════════════════════
  // 5. SUBIDA DE ARCHIVOS CON PREVIEW SPLIT (90vw x 90vh)
  // ════════════════════════════════════════════════════════════
  function limpiarModalSubida() {
    formSubida?.reset();
    if (previewObjectURL) {
      URL.revokeObjectURL(previewObjectURL);
      previewObjectURL = null;
    }
    if (uploadPreviewImg) uploadPreviewImg.src = '';
    if (uploadPeso) uploadPeso.textContent = '-- KB · Original';
    if (uploadDimensiones) uploadDimensiones.textContent = '-- x -- px';
    if (uploadEmptyState) uploadEmptyState.style.display = 'flex';
    if (uploadPreviewState) uploadPreviewState.style.display = 'none';
    modalSubida?.classList.remove('open');
  }

  function mostrarPrevisualizacionSubida(file) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      Notificacion('El archivo seleccionado debe ser una imagen (WebP, PNG, JPG, JPEG).', 'warning', 3000);
      return;
    }

    if (previewObjectURL) {
      URL.revokeObjectURL(previewObjectURL);
    }

    previewObjectURL = URL.createObjectURL(file);
    if (uploadPreviewImg) uploadPreviewImg.src = previewObjectURL;

    // Calcular peso y formato
    const kb = Math.round(file.size / 1024);
    const formato = (file.type ? file.type.replace('image/', '') : 'IMG').toUpperCase();
    if (uploadPeso) uploadPeso.textContent = `${kb} KB · ${formato}`;

    // Obtener dimensiones naturales reales
    const tempImg = new Image();
    tempImg.onload = () => {
      if (uploadDimensiones) {
        uploadDimensiones.textContent = `${tempImg.naturalWidth}x${tempImg.naturalHeight} px`;
      }
    };
    tempImg.src = previewObjectURL;

    // Sugerir Título y ALT si están vacíos
    if (inTitulo && (!inTitulo.value || inTitulo.value.trim() === '')) {
      const nombreLimpio = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      inTitulo.value = nombreLimpio.charAt(0).toUpperCase() + nombreLimpio.slice(1);
    }
    if (inAlt && (!inAlt.value || inAlt.value.trim() === '') && inTitulo?.value) {
      inAlt.value = `Fotografía oficial de ${inTitulo.value}`;
    }

    // Alternar visibilidad de las columnas
    if (uploadEmptyState) uploadEmptyState.style.display = 'none';
    if (uploadPreviewState) uploadPreviewState.style.display = 'flex';

    Notificacion(`Imagen "${file.name}" cargada para revisión.`, 'info', 2000);
  }

  btnSubirTrigger?.addEventListener('click', () => {
    sincronizarControlesCategorias();
    modalSubida?.classList.add('open');
  });

  btnModalClose?.addEventListener('click', limpiarModalSubida);
  btnCancelSubida?.addEventListener('click', limpiarModalSubida);

  modalSubida?.addEventListener('click', (e) => {
    if (e.target === modalSubida) limpiarModalSubida();
  });

  // Acciones para seleccionar o cambiar archivo
  dropzone?.addEventListener('click', () => fileInput?.click());
  btnBrowseFile?.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput?.click();
  });
  btnChangeFile?.addEventListener('click', () => fileInput?.click());

  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone?.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer?.files?.length > 0) {
      if (fileInput) fileInput.files = e.dataTransfer.files;
      mostrarPrevisualizacionSubida(e.dataTransfer.files[0]);
    }
  });

  fileInput?.addEventListener('change', () => {
    if (fileInput.files?.length > 0) {
      mostrarPrevisualizacionSubida(fileInput.files[0]);
    }
  });

  formSubida?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!fileInput?.files || fileInput.files.length === 0) {
      Notificacion('Selecciona o arrastra una imagen antes de subir.', 'warning', 2500);
      return;
    }

    const file = fileInput.files[0];
    const cat = selectCategoria?.value || 'otros';
    const titulo = inTitulo?.value?.trim() || file.name;
    const alt = inAlt?.value?.trim() || titulo;
    const pin = Boolean(inPinSubida?.checked);

    const spin = wiSpin ? wiSpin(btnSubmitSubida) : null;
    if (btnSubmitSubida) btnSubmitSubida.disabled = true;

    try {
      await procesarSubidaImagen(file, cat, titulo, alt, pin);
      Notificacion('¡Fotografía añadida a la galería con éxito!', 'success', 3000);
      limpiarModalSubida();
      sincronizarControlesCategorias();
      renderizarGrid();
    } catch (err) {
      console.error(err);
      Notificacion('Error al procesar la subida de imagen.', 'danger', 3000);
    } finally {
      if (spin) spin.stop();
      if (btnSubmitSubida) btnSubmitSubida.disabled = false;
    }
  });

  // ════════════════════════════════════════════════════════════
  // 6. SINCRONIZACIÓN Y CACHE
  // ════════════════════════════════════════════════════════════
  btnSync?.addEventListener('click', async () => {
    const icon = btnSync.querySelector('i');
    if (icon) icon.classList.add('fa-spin');
    btnSync.disabled = true;
    try {
      await sincronizarGaleriaConFirestore(true);
      sincronizarControlesCategorias();
      renderizarGrid();
      Notificacion('Galería sincronizada con la nube (Cloudflare R2 & Firestore).', 'success', 2500);
    } catch (e) {
      Notificacion('Error al sincronizar con la nube.', 'warning', 2500);
    } finally {
      if (icon) icon.classList.remove('fa-spin');
      btnSync.disabled = false;
    }
  });

  window.addEventListener('wi:galeria:actualizada', () => {
    sincronizarControlesCategorias();
    renderizarGrid();
  });

  // ════════════════════════════════════════════════════════════
  // 7. INICIALIZACIÓN
  // ════════════════════════════════════════════════════════════
  sincronizarControlesCategorias();
  renderizarGrid();
}
