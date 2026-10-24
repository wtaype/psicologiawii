// src/feature/personal/modulos/personal/personalMod.js
// Controlador Frontend Autónomo del Módulo Personal (Equipo Profesional del Estudio)
// 100% JS Nativo · Integrado con @widev (wicopy, mis10, wiSugerencias) y Local-First

import { Notificacion, wiSpin, wiConfirmar, getls, wicopy, mis10, wiSugerencias } from '@widev';
import {
  obtenerPersonal,
  guardarMiembroPersonal,
  eliminarMiembroPersonal,
  sincronizarPersonalDesdeFirestore
} from './dataPersonal.js';

export function inicializarModuloPersonal() {
  const panel = document.getElementById('panel-personal');
  if (!panel || panel.dataset.personalInit === 'true') return;
  panel.dataset.personalInit = 'true';

  // ── Elementos de KPIs ──
  const kpiTotal = document.getElementById('peKpiTotal');
  const kpiColegiados = document.getElementById('peKpiColegiados');
  const kpiAsistentes = document.getElementById('peKpiAsistentes');
  const kpiTrayectoria = document.getElementById('peKpiTrayectoria');

  // ── Grid y Acciones ──
  const driversGrid = document.getElementById('peDriversGrid');
  const btnNuevoPersonal = document.getElementById('btnNuevoPersonal');

  // ── Modal Registro ──
  const modalOverlay = document.getElementById('peModalOverlay');
  const btnModalClose = document.getElementById('btnPeModalClose');
  const formModal = document.getElementById('formPePersonal');
  const btnModalGuardar = document.getElementById('btnPeModalGuardar');
  const peModalNombre = document.getElementById('peModalNombre');
  const peModalApellidos = document.getElementById('peModalApellidos');
  const peModalCargo = document.getElementById('peModalCargo');
  const peModalDni = document.getElementById('peModalDni');
  const peModalRol = document.getElementById('peModalRol');
  const peModalCelular = document.getElementById('peModalCelular');
  const peModalEmail = document.getElementById('peModalEmail');
  const peModalCumpleanos = document.getElementById('peModalCumpleanos');
  const peModalFechaIngreso = document.getElementById('peModalFechaIngreso');

  // ── Modal Editar Colaborador ──
  const modalEditarOverlay = document.getElementById('peModalEditarOverlay');
  const btnEditClose = document.getElementById('btnPeEditClose');
  const btnEditCancelar = document.getElementById('btnPeEditCancelar');
  const formEditar = document.getElementById('formPeEditar');
  const btnEditGuardar = document.getElementById('btnPeEditGuardar');

  const peEditId = document.getElementById('peEditId');
  const peEditActivo = document.getElementById('peEditActivo');
  const btnEstadoHabilitar = document.getElementById('btnEstadoHabilitar');
  const btnEstadoInhabilitar = document.getElementById('btnEstadoInhabilitar');
  const peEditAvatarImg = document.getElementById('peEditAvatarImg');
  const peEditNombreTitle = document.getElementById('peEditNombreTitle');
  const peEditUsuarioTag = document.getElementById('peEditUsuarioTag');
  const peEditNombre = document.getElementById('peEditNombre');
  const peEditApellidos = document.getElementById('peEditApellidos');
  const peEditCargo = document.getElementById('peEditCargo');
  const peEditRol = document.getElementById('peEditRol');
  const peEditDni = document.getElementById('peEditDni');
  const peEditCelular = document.getElementById('peEditCelular');
  const peEditEmail = document.getElementById('peEditEmail');
  const peEditCumpleanos = document.getElementById('peEditCumpleanos');
  const peEditFechaIngreso = document.getElementById('peEditFechaIngreso');
  const peEditAntiguedadBadge = document.getElementById('peEditAntiguedadBadge');

  // ── Sugerencias Inteligentes con @widev (wiSugerencias) ──
  const CARGOS_SUGERIDOS = [
    'Administrador General',
    'Técnico Despachador',
    'Conductor Express',
    'Supervisor de Operaciones',
    'Atención al Cliente y Ventas',
    'Soporte Técnico y Logística'
  ];

  if (peModalCargo) {
    wiSugerencias(peModalCargo, { sugerencias: CARGOS_SUGERIDOS });
  }
  if (peEditCargo) {
    wiSugerencias(peEditCargo, { sugerencias: CARGOS_SUGERIDOS });
  }

  // ════════════════════════════════════════════════════════════
  // 1. UTILIDADES: CÁLCULO DE ANTIGÜEDAD Y FORMATO CUMPLEAÑOS
  // ════════════════════════════════════════════════════════════
  function calcularAntiguedad(fechaIngreso) {
    if (!fechaIngreso) return 'Reciente';
    const inicio = new Date(fechaIngreso);
    if (isNaN(inicio.getTime())) return String(fechaIngreso);

    const hoy = new Date();
    let anos = hoy.getFullYear() - inicio.getFullYear();
    let meses = hoy.getMonth() - inicio.getMonth();

    if (meses < 0 || (meses === 0 && hoy.getDate() < inicio.getDate())) {
      anos--;
      meses += 12;
    }

    if (anos <= 0) {
      const m = Math.max(1, meses);
      return `${m} ${m === 1 ? 'mes' : 'meses'}`;
    }
    return `${anos} ${anos === 1 ? 'año' : 'años'}${meses > 0 ? ` y ${meses}m` : ''}`;
  }

  function formatearCumpleanos(fechaStr) {
    if (!fechaStr) return 'No registrado';
    const partes = String(fechaStr).split('-');
    if (partes.length === 3) {
      const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const dia = parseInt(partes[2], 10);
      const mes = meses[parseInt(partes[1], 10) - 1] || partes[1];
      return `${dia} de ${mes}`;
    }
    return fechaStr;
  }

  // ════════════════════════════════════════════════════════════
  // 2. KPIS Y ESTADÍSTICAS DEL EQUIPO (CALCULADOS DINÁMICAMENTE)
  // ════════════════════════════════════════════════════════════
  function actualizarKpis() {
    const lista = obtenerPersonal();
    const activos = lista.filter(p => p.activo !== false).length;
    const asistentes = lista.filter(p => {
      const c = (p.cargo || '').toLowerCase();
      return c.includes('despach') || c.includes('operacion') || c.includes('técnico') || c.includes('tecnico') || c.includes('conductor');
    }).length;

    // Cálculo dinámico de experiencia combinada a partir de fechaIngreso
    const listaConFecha = lista.filter(p => p.fechaIngreso && !isNaN(new Date(p.fechaIngreso).getTime()));
    let anosCombinados = 0;
    if (listaConFecha.length > 0) {
      const hoy = new Date();
      anosCombinados = listaConFecha.reduce((acc, p) => {
        const diffAnos = (hoy - new Date(p.fechaIngreso)) / (1000 * 60 * 60 * 24 * 365.25);
        return acc + Math.max(0, diffAnos);
      }, 0);
    }
    const anosFinal = Math.round(anosCombinados);

    if (kpiTotal) kpiTotal.textContent = String(lista.length);
    if (kpiColegiados) kpiColegiados.textContent = String(activos);
    if (kpiAsistentes) kpiAsistentes.textContent = String(asistentes);
    if (kpiTrayectoria) kpiTrayectoria.textContent = anosFinal > 0 ? `${anosFinal}+ años` : '5+ años';
  }

  // ════════════════════════════════════════════════════════════
  // 3. MODAL EDITAR: CONTROL DE ESTADO, FECHA INGRESO Y GUARDADO
  // ════════════════════════════════════════════════════════════
  function actualizarBotonesEstado(estaActivo) {
    if (peEditActivo) peEditActivo.value = String(estaActivo);
    if (estaActivo) {
      btnEstadoHabilitar?.classList.add('active-btn');
      btnEstadoInhabilitar?.classList.remove('inactive-btn');
    } else {
      btnEstadoHabilitar?.classList.remove('active-btn');
      btnEstadoInhabilitar?.classList.add('inactive-btn');
    }
  }

  btnEstadoHabilitar?.addEventListener('click', () => actualizarBotonesEstado(true));
  btnEstadoInhabilitar?.addEventListener('click', () => actualizarBotonesEstado(false));

  peEditFechaIngreso?.addEventListener('input', (e) => {
    const val = e.target.value;
    if (peEditAntiguedadBadge) {
      peEditAntiguedadBadge.textContent = val ? calcularAntiguedad(val) : 'Indica fecha';
    }
  });

  function abrirModalEditar(p) {
    if (!p || !modalEditarOverlay) return;
    const nombreCompleto = p.nombreCompleto || `${p.nombre || ''} ${p.apellidos || ''}`.trim() || 'Colaborador';
    const estaActivo = p.activo !== false;

    if (peEditId) peEditId.value = p.id;
    if (peEditAvatarImg) peEditAvatarImg.src = p.avatar || '/smile.avif';
    if (peEditNombreTitle) peEditNombreTitle.textContent = nombreCompleto;
    if (peEditUsuarioTag) peEditUsuarioTag.textContent = `@${p.usuario || (p.nombre ? p.nombre.toLowerCase().replace(/\s+/g, '') : 'personal')}`;

    if (peEditNombre) peEditNombre.value = p.nombre || '';
    if (peEditApellidos) peEditApellidos.value = p.apellidos || '';
    if (peEditCargo) peEditCargo.value = p.cargo || (p.rol === 'gestor' ? 'Gestor de Operaciones' : 'Técnico Despachador');
    if (peEditRol) peEditRol.value = p.rol || 'personal';
    if (peEditDni) peEditDni.value = p.dni || '';
    if (peEditCelular) peEditCelular.value = p.celular || '';
    if (peEditEmail) peEditEmail.value = p.email || '';

    if (peEditCumpleanos) {
      const cVal = p.cumpleanos ? (p.cumpleanos.includes('T') ? p.cumpleanos.split('T')[0] : p.cumpleanos) : '';
      peEditCumpleanos.value = cVal;
    }

    if (peEditFechaIngreso) {
      const fechaLimpia = p.fechaIngreso ? (p.fechaIngreso.includes('T') ? p.fechaIngreso.split('T')[0] : p.fechaIngreso) : '';
      peEditFechaIngreso.value = fechaLimpia;
      if (peEditAntiguedadBadge) {
        peEditAntiguedadBadge.textContent = fechaLimpia ? calcularAntiguedad(fechaLimpia) : (p.experiencia || 'Indica fecha');
      }
    }

    actualizarBotonesEstado(estaActivo);

    modalEditarOverlay.classList.add('active');
    modalEditarOverlay.classList.add('open');
  }

  function cerrarModalEditar() {
    modalEditarOverlay?.classList.remove('active');
    modalEditarOverlay?.classList.remove('open');
  }

  btnEditClose?.addEventListener('click', cerrarModalEditar);
  btnEditCancelar?.addEventListener('click', cerrarModalEditar);
  modalEditarOverlay?.addEventListener('click', (e) => {
    if (e.target === modalEditarOverlay) cerrarModalEditar();
  });

  formEditar?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = peEditId?.value;
    if (!id) return;

    const nombre = peEditNombre?.value?.trim() || '';
    const apellidos = peEditApellidos?.value?.trim() || '';
    if (!nombre) {
      Notificacion('El nombre no puede estar vacío.', 'warning', 2500);
      return;
    }
    const nombreCompleto = `${nombre} ${apellidos}`.trim() || nombre;

    const estaActivo = peEditActivo?.value === 'true';
    const miembroExistente = obtenerPersonal().find(x => x.id === id) || {};
    const fechaIngreso = peEditFechaIngreso?.value?.trim() || '';
    const experiencia = fechaIngreso ? calcularAntiguedad(fechaIngreso) : (miembroExistente.experiencia || 'Reciente');
    const cumpleanos = peEditCumpleanos?.value || '';
    const rolSeleccionado = peEditRol?.value || miembroExistente.rol || 'personal';

    const spin = wiSpin ? wiSpin(btnEditGuardar) : null;
    if (btnEditGuardar) btnEditGuardar.disabled = true;

    try {
      await guardarMiembroPersonal({
        ...miembroExistente,
        id,
        uid: id,
        nombre,
        apellidos,
        nombreCompleto,
        dni: peEditDni?.value?.trim() || '',
        celular: peEditCelular?.value?.trim() || '',
        email: peEditEmail?.value?.trim() || '',
        cumpleanos,
        cargo: peEditCargo?.value?.trim() || (rolSeleccionado === 'gestor' ? 'Gestor de Operaciones' : 'Técnico Despachador'),
        fechaIngreso,
        experiencia,
        rol: rolSeleccionado,
        avatar: miembroExistente.avatar || '/smile.avif',
        colegiatura: estaActivo ? 'Habilitado/a' : 'Inactivo/a',
        activo: estaActivo
      });

      cerrarModalEditar();
      actualizarKpis();
      renderizarGrid();
      Notificacion(`¡Colaborador ${nombreCompleto} actualizado con éxito!`, 'success', 2500);
    } catch (err) {
      console.error(err);
      Notificacion('Error al actualizar colaborador: ' + (err?.message || err), 'danger', 3000);
    } finally {
      if (spin) spin.stop();
      if (btnEditGuardar) btnEditGuardar.disabled = false;
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cerrarModalEditar();
      modalOverlay?.classList.remove('active');
      modalOverlay?.classList.remove('open');
    }
  });

  // ════════════════════════════════════════════════════════════
  // 4. RENDERIZADO DEL GRID DE COLABORADORES
  // ════════════════════════════════════════════════════════════
  function renderizarGrid() {
    if (!driversGrid) return;
    const lista = obtenerPersonal();

    if (lista.length === 0) {
      driversGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; color: var(--tx2); background: var(--surface-card, rgba(255,255,255,0.02)); border: 1px dashed var(--border-card, rgba(255,255,255,0.1)); border-radius: 14px;">
          <i class="fa-solid fa-users" style="font-size: 28px; opacity: 0.5; margin-bottom: 12px; display: block; color: var(--mco, var(--brand-sky, #38bdf8));"></i>
          <p style="font-size: 15px; font-weight: 700; color: var(--tx, #f3f6fc); margin: 0 0 6px 0;">No hay colaboradores registrados en el equipo</p>
          <span style="font-size: 13px; color: var(--tx2, #94a3b8);">Haz clic en "Registrar Colaborador" para añadir al primer miembro del equipo.</span>
        </div>
      `;
      return;
    }

    driversGrid.innerHTML = lista.map(p => {
      const nombre = p.nombreCompleto || `${p.nombre || ''} ${p.apellidos || ''}`.trim() || 'Colaborador';
      const avatar = p.avatar || '/smile.avif';
      const cargo = p.cargo || (p.rol === 'gestor' ? 'Gestor de Operaciones' : 'Técnico Despachador');
      const estaActivo = p.activo !== false;
      const statusBadge = estaActivo
        ? `<span class="pe-status-pill disponible"><i class="fa-solid fa-circle-check" style="font-size: 9px;"></i> Habilitado/a</span>`
        : `<span class="pe-status-pill" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;"><i class="fa-solid fa-circle-xmark" style="font-size: 9px;"></i> Inactivo/a</span>`;

      // Correo truncado a 10 letras (usando mis10 de @widev) + botón con wicopy
      let correoHtml = '<span class="pe-detail-val" style="color: var(--tx2); font-weight: 500;">Sin correo</span>';
      if (p.email) {
        const emailTrim = String(p.email).trim();
        const emailCorto = mis10(emailTrim);
        correoHtml = `
          <div class="pe-email-copy-wrap" title="${emailTrim}">
            <span class="pe-email-text">${emailCorto}</span>
            <button type="button" class="pe-btn-copy-email" data-email="${emailTrim}" title="Copiar correo: ${emailTrim}">
              <i class="fa-regular fa-copy"></i>
            </button>
          </div>
        `;
      }

      const antiguedadTexto = p.fechaIngreso ? calcularAntiguedad(p.fechaIngreso) : (p.experiencia || 'Personal Activo');

      return `
        <div class="pe-driver-card" data-id="${p.id}">
          <div class="pe-driver-head">
            <img src="${avatar}" alt="${nombre}" class="pe-driver-avatar" onerror="this.src='/smile.avif'" />
            <div class="pe-driver-meta">
              <span class="pe-driver-name">${nombre}</span>
              <span class="pe-driver-cargo" style="${p.rol === 'gestor' ? 'color: var(--mco, var(--brand-primary, #104356)); font-weight: 700;' : ''}">${cargo}</span>
              ${statusBadge}
            </div>
          </div>

          <div class="pe-driver-details">
            <div class="pe-detail-row">
              <span class="pe-detail-lbl"><i class="fa-solid fa-phone" style="font-size: 11px;"></i> Celular:</span>
              <span style="color: var(--brand-primary, var(--mco, #104356)); font-weight: 700;">${p.celular || 'Sin número'}</span>
            </div>
            <div class="pe-detail-row">
              <span class="pe-detail-lbl"><i class="fa-regular fa-envelope" style="font-size: 11px;"></i> Correo:</span>
              ${correoHtml}
            </div>
            <div class="pe-detail-row">
              <span class="pe-detail-lbl"><i class="fa-solid fa-cake-candles" style="font-size: 11px;"></i> Cumpleaños:</span>
              <span class="pe-detail-val">${formatearCumpleanos(p.cumpleanos)}</span>
            </div>
            <div class="pe-detail-row">
              <span class="pe-detail-lbl"><i class="fa-solid fa-calendar-check" style="font-size: 11px;"></i> Antigüedad:</span>
              <span class="pe-detail-val">${antiguedadTexto}</span>
            </div>
          </div>

          <div class="pe-driver-actions">
            <button type="button" class="pe-btn-driver ws pe-btn-ws" data-cel="${p.celular}" data-nombre="${nombre}">
              <i class="fa-brands fa-whatsapp"></i> Contactar
            </button>
            <button type="button" class="pe-btn-driver toggle pe-btn-edit" data-id="${p.id}">
              <i class="fa-solid fa-pen-to-square"></i> Editar
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Listeners: WhatsApp
    driversGrid.querySelectorAll('.pe-btn-ws').forEach(btn => {
      btn.addEventListener('click', () => {
        const cel = btn.getAttribute('data-cel')?.replace(/\D/g, '') || '';
        const nom = btn.getAttribute('data-nombre') || 'Colaborador';
        const neg = getls('wi_negocio') || getls('minegocio') || {};
        const nombreEstudio = neg.identidad?.nombre || neg.identidad?.nombreCorto || 'nuestro equipo';
        const url = `https://wa.me/51${cel}?text=${encodeURIComponent(`Hola ${nom}, te saludo desde el portal de ${nombreEstudio}.`)}`;
        window.open(url, '_blank');
      });
    });

    // Listeners: Copiar Correo usando wicopy de @widev
    driversGrid.querySelectorAll('.pe-btn-copy-email').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const email = btn.getAttribute('data-email');
        if (!email) return;

        wicopy(email, btn);

        const icon = btn.querySelector('i');
        if (icon) {
          icon.className = 'fa-solid fa-check';
          btn.classList.add('copied');
          setTimeout(() => {
            icon.className = 'fa-regular fa-copy';
            btn.classList.remove('copied');
          }, 1500);
        }
      });
    });

    // Listeners: Abrir Modal Editar
    driversGrid.querySelectorAll('.pe-btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const p = obtenerPersonal().find(x => x.id === id);
        if (p) abrirModalEditar(p);
      });
    });
  }

  // ════════════════════════════════════════════════════════════
  // 5. MODAL REGISTRO DE NUEVO PERSONAL
  // ════════════════════════════════════════════════════════════
  btnNuevoPersonal?.addEventListener('click', () => {
    modalOverlay?.classList.add('active');
  });

  btnModalClose?.addEventListener('click', () => {
    modalOverlay?.classList.remove('active');
  });

  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove('active');
  });

  formModal?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = peModalNombre?.value?.trim() || '';
    const apellidos = peModalApellidos?.value?.trim() || '';
    if (!nombre) {
      Notificacion('Indica los nombres del colaborador.', 'warning', 2500);
      return;
    }
    const nombreCompleto = `${nombre} ${apellidos}`.trim() || nombre;
    const cargo = peModalCargo?.value?.trim() || 'Técnico Despachador';
    const dni = peModalDni?.value?.trim() || '';
    const cel = peModalCelular?.value?.trim() || '';
    const email = peModalEmail?.value?.trim() || '';
    const cumpleanos = peModalCumpleanos?.value || '';
    const fechaIngreso = peModalFechaIngreso?.value?.trim() || '';
    const experiencia = fechaIngreso ? calcularAntiguedad(fechaIngreso) : 'Reciente';
    const rol = peModalRol?.value || 'personal';

    const spin = wiSpin ? wiSpin(btnModalGuardar) : null;
    if (btnModalGuardar) btnModalGuardar.disabled = true;

    try {
      await guardarMiembroPersonal({
        nombre,
        apellidos,
        nombreCompleto,
        cargo: cargo || (rol === 'gestor' ? 'Gestor de Operaciones' : 'Técnico Despachador'),
        dni,
        colegiatura: 'Habilitado/a',
        celular: cel,
        email,
        cumpleanos,
        fechaIngreso,
        experiencia,
        avatar: '/smile.avif',
        rol: rol,
        activo: true
      });

      modalOverlay?.classList.remove('active');
      formModal.reset();
      actualizarKpis();
      renderizarGrid();
      Notificacion(`¡${nombreCompleto} añadido al equipo!`, 'success', 3000);
    } catch (err) {
      console.error(err);
      Notificacion('Error al guardar colaborador: ' + (err?.message || err), 'danger', 3000);
    } finally {
      if (spin) spin.stop();
      if (btnModalGuardar) btnModalGuardar.disabled = false;
    }
  });

  // ════════════════════════════════════════════════════════════
  // 6. INICIALIZACIÓN
  // ════════════════════════════════════════════════════════════
  actualizarKpis();
  renderizarGrid();

  sincronizarPersonalDesdeFirestore().then(() => {
    actualizarKpis();
    renderizarGrid();
  });
}
