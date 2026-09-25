// src/feature/personal/modulos/paginas/paginas.js
// Controlador Frontend Autónomo del Módulo Páginas (Editor Institucional & SERP)
// 100% JS Nativo · Integrado con @widev

import { Notificacion, wiSpin } from '@widev';
import { obtenerPaginas, guardarPagina } from './dataPaginas.js';

export function inicializarModuloPaginas() {
  const panel = document.getElementById('panel-paginas');
  if (!panel || panel.dataset.paginasInit === 'true') return;
  panel.dataset.paginasInit = 'true';

  let paginaSeleccionadaId = 'pg_home';

  // ── Elementos del DOM ──
  const navList = document.getElementById('pgNavList');
  const routeBadge = document.getElementById('pgRouteBadge');
  const inH1 = document.getElementById('pgInpH1');
  const inSubtitulo = document.getElementById('pgInpSubtitulo');
  const inTelefono = document.getElementById('pgInpTelefono');
  const inHorario = document.getElementById('pgInpHorario');
  const inMetaTitle = document.getElementById('pgInpMetaTitle');
  const inMetaDesc = document.getElementById('pgInpMetaDesc');
  const btnGuardar = document.getElementById('btnPgGuardar');

  // ── Elementos del Simulador SERP Google ──
  const serpUrlPath = document.getElementById('pgSerpUrlPath');
  const serpHeadline = document.getElementById('pgSerpHeadline');
  const serpDesc = document.getElementById('pgSerpDesc');
  const titleCharCount = document.getElementById('pgTitleCharCount');
  const descCharCount = document.getElementById('pgDescCharCount');

  // ════════════════════════════════════════════════════════════
  // 1. RENDERIZADO DEL SELECTOR DE PÁGINAS
  // ════════════════════════════════════════════════════════════
  function renderizarSelector() {
    if (!navList) return;
    const paginas = obtenerPaginas();

    navList.innerHTML = paginas.map(p => {
      const isActive = p.id === paginaSeleccionadaId;
      return `
        <button type="button" class="pg-nav-btn ${isActive ? 'active' : ''}" data-id="${p.id}">
          <i class="${p.icono}"></i>
          <span>${p.nombre}</span>
        </button>
      `;
    }).join('');

    navList.querySelectorAll('.pg-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        paginaSeleccionadaId = id;
        navList.querySelectorAll('.pg-nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const p = paginas.find(x => x.id === id);
        if (p) cargarPaginaEnFormulario(p);
      });
    });
  }

  // ════════════════════════════════════════════════════════════
  // 2. CARGA DE PÁGINA EN FORMULARIO Y SERP SIMULATOR
  // ════════════════════════════════════════════════════════════
  function cargarPaginaEnFormulario(p) {
    if (!p) return;
    if (routeBadge) routeBadge.textContent = p.ruta;
    if (inH1) inH1.value = p.h1 || '';
    if (inSubtitulo) inSubtitulo.value = p.subtitulo || '';
    if (inTelefono) inTelefono.value = p.telefono || '';
    if (inHorario) inHorario.value = p.horario || '';
    if (inMetaTitle) inMetaTitle.value = p.metaTitle || '';
    if (inMetaDesc) inMetaDesc.value = p.metaDesc || '';

    actualizarSerpPreview(p.ruta);
  }

  function actualizarSerpPreview(rutaOverride) {
    const p = obtenerPaginas().find(x => x.id === paginaSeleccionadaId);
    const ruta = rutaOverride || p?.ruta || '/';
    const title = inMetaTitle?.value || 'Solgas Surquillo';
    const desc = inMetaDesc?.value || 'Distribuidor oficial de balones de gas GLP en Surquillo.';

    if (serpUrlPath) {
      serpUrlPath.textContent = ruta === '/' ? '' : `› ${ruta.replace('/', '')}`;
    }

    if (serpHeadline) {
      serpHeadline.textContent = title;
    }

    if (serpDesc) {
      serpDesc.textContent = desc;
    }

    if (titleCharCount) {
      const len = title.length;
      titleCharCount.textContent = `${len}/60 caracteres ${len > 60 ? '⚠️ (Excede)' : '✅'}`;
    }

    if (descCharCount) {
      const len = desc.length;
      descCharCount.textContent = `${len}/160 caracteres ${len > 160 ? '⚠️ (Excede)' : '✅'}`;
    }
  }

  // Listeners de actualización en tiempo real
  [inMetaTitle, inMetaDesc].forEach(el => {
    el?.addEventListener('input', () => actualizarSerpPreview());
  });

  // ════════════════════════════════════════════════════════════
  // 3. GUARDADO DE PÁGINA
  // ════════════════════════════════════════════════════════════
  btnGuardar?.addEventListener('click', () => {
    const p = obtenerPaginas().find(x => x.id === paginaSeleccionadaId);
    if (!p) return;

    wiSpin(btnGuardar, true, 'Guardando...');

    setTimeout(() => {
      guardarPagina({
        ...p,
        h1: inH1?.value?.trim() || '',
        subtitulo: inSubtitulo?.value?.trim() || '',
        telefono: inTelefono?.value?.trim() || '',
        horario: inHorario?.value?.trim() || '',
        metaTitle: inMetaTitle?.value?.trim() || '',
        metaDesc: inMetaDesc?.value?.trim() || ''
      });

      wiSpin(btnGuardar, false);
      Notificacion(`¡Página "${p.nombre}" guardada con éxito!`, 'success');
    }, 400);
  });

  // ════════════════════════════════════════════════════════════
  // 4. INICIALIZACIÓN
  // ════════════════════════════════════════════════════════════
  renderizarSelector();
  const inicial = obtenerPaginas().find(x => x.id === paginaSeleccionadaId);
  if (inicial) cargarPaginaEnFormulario(inicial);
}
