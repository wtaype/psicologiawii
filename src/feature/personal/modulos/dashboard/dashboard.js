// src/feature/personal/modulos/dashboard/dashboard.js
// Controlador Frontend Autónomo del Dashboard (Solgas Surquillo)
// 100% JS Nativo · Integrado con dataNotepad.js y @widev

import { obtenerNotas, guardarNotaData, toggleListoNotaData } from '../notepad/dataNotepad.js';
import { Notificacion } from '@widev';

export function inicializarDashboard() {
  const panel = document.getElementById('panel-dashboard');
  if (!panel) return;

  const formQuick = document.getElementById('formDashQuickNote');
  const inputTitle = document.getElementById('inputDashQuickTitle');
  const inputText = document.getElementById('inputDashQuickText');
  const listWrap = document.getElementById('dashNotesList');
  const countBadge = document.getElementById('dashNotesCount');

  function renderQuickNotes() {
    const notes = obtenerNotas();
    if (countBadge) countBadge.textContent = `${notes.length} ${notes.length === 1 ? 'Nota' : 'Notas'}`;
    if (!listWrap) return;

    if (notes.length === 0) {
      listWrap.innerHTML = '<p style="text-align:center; color:var(--muted); font-size:var(--fz_s3); padding:16px 8px; margin:0;">Sin notas guardadas.</p>';
      return;
    }

    listWrap.innerHTML = notes.slice(0, 3).map(n => {
      const isListo = Boolean(n.listo || n.done);
      return `
        <div class="db-note-item">
          <div class="db-note-info">
            <div class="db-note-title" style="${isListo ? 'text-decoration:line-through; opacity:0.6;' : ''}">
              ${n.pin ? '<i class="fa-solid fa-thumbtack" style="color:var(--brand-orange); font-size:10px; margin-right:4px;"></i>' : ''}
              ${n.titulo || 'Nota sin título'}
            </div>
            <div class="db-note-snippet">${n.resumen10 || (n.contenido || '').substring(0, 45)}…</div>
          </div>
          <button type="button" class="db-btn-toggle-note btn-dash-toggle" data-id="${n.id}" title="${isListo ? 'Marcar pendiente' : 'Marcar listo'}" style="color: ${isListo ? 'var(--green)' : 'var(--muted)'};">
            <i class="fa-${isListo ? 'solid fa-circle-check' : 'regular fa-circle'}"></i>
          </button>
        </div>
      `;
    }).join('');
  }

  // Delegación de eventos para toggle listo
  listWrap?.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-dash-toggle');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    if (id) {
      toggleListoNotaData(id);
      renderQuickNotes();
    }
  });

  formQuick?.addEventListener('submit', (e) => {
    e.preventDefault();
    const titulo = inputTitle?.value?.trim();
    const texto = inputText?.value?.trim();
    if (!titulo && !texto) return;

    guardarNotaData({
      titulo: titulo || 'Apunte rápido',
      contenido: texto || '',
      tag: 'Nota'
    });

    renderQuickNotes();
    formQuick.reset();
    Notificacion('Apunte registrado en Notepad', 'success', 2500);
  });

  renderQuickNotes();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarDashboard);
} else {
  inicializarDashboard();
}
