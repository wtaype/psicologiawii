// src/feature/personal/modulos/notepad/notepad.js
// Controlador Frontend Autónomo de Notepad (70% Canvas / 30% Lista Resumida)
// Cero TypeScript · 100% JS Nativo · Local-First · Integración widev.js

import { Notificacion, wiSpin, wiEditor, wiAtajo, wiConfirmar, adrm, savels, getls, removels } from '@widev';
import {
  obtenerNotas,
  guardarNotaData,
  eliminarNotaData,
  togglePinNotaData,
  toggleListoNotaData,
  recortar10Palabras
} from './dataNotepad.js';

export function inicializarNotepad() {
  const panelNotepad = document.getElementById('panel-notepad');
  if (!panelNotepad || panelNotepad.dataset.notepadInit === 'true') return;
  panelNotepad.dataset.notepadInit = 'true';

  const notepadCompactList = document.getElementById('notepadCompactList');
  const notepadBadgeCount = document.getElementById('notepadBadgeCount');
  const notepadTitle = document.getElementById('notepadTitle');
  const notepadContent = document.getElementById('notepadContent');
  const notepadCurrentId = document.getElementById('notepadCurrentId');
  const noteEditorStatus = document.getElementById('noteEditorStatus');
  const noteCharCount = document.getElementById('noteCharCount');
  const noteWordCount = document.getElementById('noteWordCount');
  const tagPillGroup = document.getElementById('tagPillGroup');
  const btnSaveNotepadFull = document.getElementById('btnSaveNotepadFull');
  const btnClearNote = document.getElementById('btnClearNote');
  const btnNewNoteCanvas = document.getElementById('btnNewNoteCanvas');
  const btnPinCanvas = document.getElementById('btnPinCanvas');

  let currentActiveTag = 'Nota';
  let currentIsPinned = false;
  let isSaving = false;
  let draftTimer = null;
  const DRAFT_KEY = 'notepad_borrador_timestamp';

  // 1. Editor Markdown enriquecido (wiEditor con tabs de Enlaces, Galería y Preview)
  if (notepadContent && typeof wiEditor === 'function') {
    try { wiEditor(notepadContent); } catch (e) {}
  }

  // 2. Contadores reactivos
  function updateCounts() {
    const val = notepadContent?.value || '';
    if (noteCharCount) noteCharCount.textContent = `${val.length} caracteres`;
    if (noteWordCount) {
      const words = val.trim() ? val.trim().split(/\s+/).filter(Boolean).length : 0;
      noteWordCount.textContent = `${words} palabras`;
    }
  }

  notepadContent?.addEventListener('input', updateCounts);

  // 3. Auto-Guardado de Borrador (Debounce 500ms con savels/removels)
  function autoGuardarBorrador() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
      const titulo = notepadTitle?.value?.trim() || '';
      const contenido = notepadContent?.value?.trim() || '';
      const existingId = notepadCurrentId?.value || '';
      const links = notepadContent.getLinks ? notepadContent.getLinks() : (notepadContent._links || []);
      const imagenes = notepadContent.getImagenes ? notepadContent.getImagenes() : (notepadContent._imagenes || []);

      if (titulo || contenido || links.length > 0 || imagenes.length > 0) {
        savels(DRAFT_KEY, {
          id: existingId,
          titulo,
          contenido,
          tag: currentActiveTag,
          pin: currentIsPinned,
          links,
          imagenes,
          timestamp: Date.now()
        });
        if (noteEditorStatus && !existingId) {
          const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          noteEditorStatus.textContent = `Borrador guardado (${hora})`;
        }
      } else {
        removels(DRAFT_KEY);
      }
    }, 500);
  }

  notepadTitle?.addEventListener('input', autoGuardarBorrador);
  notepadContent?.addEventListener('input', autoGuardarBorrador);

  // 4. Selección de Tags con adrm() de widev
  tagPillGroup?.addEventListener('click', (e) => {
    const pill = e.target.closest('.ps-tag-pill');
    if (!pill) return;
    adrm(pill, 'active');
    currentActiveTag = pill.getAttribute('data-tag') || 'Nota';
    autoGuardarBorrador();
  });

  function setTagPill(tag = 'Nota') {
    currentActiveTag = tag;
    const pill = tagPillGroup?.querySelector(`.ps-tag-pill[data-tag="${tag}"]`);
    if (pill) adrm(pill, 'active');
  }

  function setPinState(pinned) {
    currentIsPinned = Boolean(pinned);
    if (btnPinCanvas) {
      btnPinCanvas.classList.toggle('active', currentIsPinned);
      btnPinCanvas.innerHTML = currentIsPinned
        ? '<i class="fa-solid fa-thumbtack"></i> Fijada'
        : '<i class="fa-regular fa-thumbtack"></i> Fijar';
    }
  }

  btnPinCanvas?.addEventListener('click', () => setPinState(!currentIsPinned));

  // 5. Renderizado de la Lista Resumida
  function renderNotes() {
    const notas = obtenerNotas();
    if (notepadBadgeCount) {
      notepadBadgeCount.textContent = `${notas.length} ${notas.length === 1 ? 'nota' : 'notas'}`;
    }
    if (!notepadCompactList) return;

    if (notas.length === 0) {
      notepadCompactList.innerHTML = `
        <div class="np-empty-state">
          <i class="fa-regular fa-note-sticky np-empty-icon"></i>
          <p class="np-empty-title">Sin apuntes aún</p>
          <p class="np-empty-sub">Comienza a redactar en el editor y presiona <strong>Guardar Nota</strong>.</p>
        </div>
      `;
      return;
    }

    notepadCompactList.innerHTML = notas.map(n => {
      const resumen = recortar10Palabras(n.contenido || n.titulo);
      const isActive = notepadCurrentId?.value === n.id;
      const isPinned = Boolean(n.pin);
      const isListo = Boolean(n.listo || n.done);
      const imgCount = Array.isArray(n.imagenes) ? n.imagenes.length : 0;
      const linkCount = Array.isArray(n.links) ? n.links.length : 0;

      return `
        <div class="np-summary-card ${isActive ? 'active' : ''} ${isPinned ? 'pinned' : ''} ${isListo ? 'listo done' : ''}" data-note-id="${n.id}">
          <div class="np-card-top">
            <span class="np-card-title">
              ${isPinned ? '<i class="fa-solid fa-thumbtack" style="color:var(--brand-orange); margin-right:4px; font-size:10px;"></i>' : ''}
              ${n.titulo || 'Sin título'}
            </span>
            <span class="ps-badge ps-badge-blue" style="font-size:10px; padding:1px 5px;">${n.tag || 'Nota'}</span>
          </div>
          <p class="np-card-snippet">${resumen}</p>
          <div class="np-card-meta">
            <div style="display:flex; align-items:center; gap:6px;">
              <span>${n.actualizado || n.creado || ''}</span>
              ${imgCount > 0 ? `<span style="font-size:10px; color:var(--muted);"><i class="fa-solid fa-image"></i> ${imgCount}</span>` : ''}
              ${linkCount > 0 ? `<span style="font-size:10px; color:var(--muted);"><i class="fa-solid fa-link"></i> ${linkCount}</span>` : ''}
            </div>
            <div style="display:flex; gap:6px;">
              <button type="button" class="np-btn-icon-action btn-pin-note ${isPinned ? 'active' : ''}" title="${isPinned ? 'Desfijar' : 'Fijar'}" style="color:${isPinned ? 'var(--brand-orange)' : 'var(--muted)'};">
                <i class="fa-solid fa-thumbtack"></i>
              </button>
              <button type="button" class="np-btn-icon-action btn-toggle-done" title="${isListo ? 'Marcar pendiente' : 'Marcar listo'}" style="color:${isListo ? 'var(--green)' : 'var(--muted)'};">
                <i class="fa-${isListo ? 'solid fa-circle-check' : 'regular fa-circle'}"></i>
              </button>
              <button type="button" class="np-btn-icon-action btn-delete-note" title="Eliminar nota" style="color:var(--muted);">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // 6. Delegación Central de Eventos en Lista (0 loops, 0 memory leaks)
  notepadCompactList?.addEventListener('click', async (e) => {
    const card = e.target.closest('.np-summary-card');
    if (!card) return;
    const id = card.getAttribute('data-note-id');
    if (!id) return;

    if (e.target.closest('.btn-pin-note')) {
      e.stopPropagation();
      togglePinNotaData(id);
      if (notepadCurrentId?.value === id) setPinState(!currentIsPinned);
      renderNotes();
      return;
    }

    if (e.target.closest('.btn-toggle-done')) {
      e.stopPropagation();
      toggleListoNotaData(id);
      renderNotes();
      return;
    }

    if (e.target.closest('.btn-delete-note')) {
      e.stopPropagation();
      const confirmado = await wiConfirmar('¿Deseas eliminar este apunte de tu Notepad?', {
        titulo: 'Eliminar Nota',
        tipo: 'danger',
        siTexto: 'Sí, Eliminar'
      });
      if (confirmado) {
        eliminarNotaData(id);
        if (notepadCurrentId?.value === id) clearEditor();
        else renderNotes();
        Notificacion('Nota eliminada del Notepad', 'warning', 2000);
      }
      return;
    }

    const targetNote = obtenerNotas().find(n => n.id === id);
    if (targetNote) loadNoteIntoEditor(targetNote);
  });

  // 7. Cargar nota en Canvas (con Enlaces y Galería)
  function loadNoteIntoEditor(note) {
    if (!notepadTitle || !notepadContent) return;
    notepadCurrentId.value = note.id;
    notepadTitle.value = note.titulo || '';
    notepadContent.value = note.contenido || '';
    setTagPill(note.tag || 'Nota');
    setPinState(Boolean(note.pin));

    if (notepadContent.setLinks) notepadContent.setLinks(note.links || []);
    if (notepadContent.setImagenes) notepadContent.setImagenes(note.imagenes || []);

    if (noteEditorStatus) {
      noteEditorStatus.textContent = `Editando (${note.actualizado || note.creado || 'Guardado'})`;
    }
    updateCounts();
    renderNotes();
  }

  // 8. Limpiar Canvas
  function clearEditor() {
    if (!notepadTitle || !notepadContent) return;
    notepadCurrentId.value = '';
    notepadTitle.value = '';
    setTagPill('Nota');
    setPinState(false);

    if (notepadContent.limpiarEditor) {
      notepadContent.limpiarEditor();
    } else {
      notepadContent.value = '';
      notepadContent._links = [];
      notepadContent._imagenes = [];
    }

    removels(DRAFT_KEY);
    if (noteEditorStatus) noteEditorStatus.textContent = 'Nueva nota';
    updateCounts();
    renderNotes();
  }

  btnClearNote?.addEventListener('click', clearEditor);
  btnNewNoteCanvas?.addEventListener('click', () => {
    clearEditor();
    notepadTitle?.focus();
  });

  // 9. Navegación con tecla Tab de Título a Contenido
  notepadTitle?.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      notepadContent?.focus();
    }
  });

  // 10. Guardado Principal con wiSpin y Notificacion (guarda Texto, Links e Imágenes)
  function guardarNotaActual() {
    if (isSaving) return;
    const titulo = notepadTitle?.value?.trim();
    const contenido = notepadContent?.value?.trim();
    const links = notepadContent.getLinks ? notepadContent.getLinks() : (notepadContent._links || []);
    const imagenes = notepadContent.getImagenes ? notepadContent.getImagenes() : (notepadContent._imagenes || []);

    if (!contenido && !titulo && links.length === 0 && imagenes.length === 0) {
      Notificacion('Escribe un título, contenido, o adjunta enlaces/imágenes', 'warning', 2500);
      return;
    }

    isSaving = true;
    if (btnSaveNotepadFull) wiSpin(btnSaveNotepadFull, true, 'Guardando...');

    const nota = guardarNotaData({
      id: notepadCurrentId?.value || undefined,
      titulo: titulo || 'Nota sin título',
      contenido,
      links,
      imagenes,
      tag: currentActiveTag || 'Nota',
      pin: currentIsPinned,
      listo: false
    });

    removels(DRAFT_KEY);
    if (notepadCurrentId) notepadCurrentId.value = nota.id;
    if (noteEditorStatus) noteEditorStatus.textContent = `Guardado (${nota.actualizado})`;

    setTimeout(() => {
      if (btnSaveNotepadFull) wiSpin(btnSaveNotepadFull, false);
      renderNotes();
      Notificacion('Nota guardada con éxito!', 'success', 2500);
      isSaving = false;
    }, 300);
  }

  btnSaveNotepadFull?.addEventListener('click', guardarNotaActual);

  // 11. Atajo Ctrl + S centralizado
  panelNotepad?.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      e.stopPropagation();
      guardarNotaActual();
    }
  });

  wiAtajo('ctrl+s', () => {
    if (panelNotepad?.classList.contains('active')) guardarNotaActual();
  });

  // 12. Inicialización y Recuperación de Borrador
  renderNotes();
  const borrador = getls(DRAFT_KEY);
  const notas = obtenerNotas();

  if (borrador && (borrador.titulo || borrador.contenido || borrador.links?.length > 0 || borrador.imagenes?.length > 0)) {
    notepadCurrentId.value = borrador.id || '';
    notepadTitle.value = borrador.titulo || '';
    notepadContent.value = borrador.contenido || '';
    if (borrador.tag) setTagPill(borrador.tag);
    if (typeof borrador.pin === 'boolean') setPinState(borrador.pin);
    if (notepadContent.setLinks) notepadContent.setLinks(borrador.links || []);
    if (notepadContent.setImagenes) notepadContent.setImagenes(borrador.imagenes || []);
    if (noteEditorStatus) {
      const hora = new Date(borrador.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      noteEditorStatus.textContent = `Borrador recuperado (${hora})`;
    }
    updateCounts();
  } else if (notas.length > 0) {
    loadNoteIntoEditor(notas[0]);
  } else {
    clearEditor();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarNotepad);
} else {
  inicializarNotepad();
}
