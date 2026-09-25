// src/feature/personal/modulos/personal/personalMod.js
// Controlador Frontend Autónomo del Módulo Personal (Equipo Operativo & Flota)
// 100% JS Nativo · Integrado con @widev

import { Notificacion, wiSpin, wiConfirmar, wiSelect } from '@widev';
import {
  obtenerPersonal,
  guardarMiembroPersonal,
  cambiarEstadoTurno,
  eliminarMiembroPersonal
} from './dataPersonal.js';

export function inicializarModuloPersonal() {
  const panel = document.getElementById('panel-personal');
  if (!panel || panel.dataset.personalInit === 'true') return;
  panel.dataset.personalInit = 'true';

  // ── Elementos de KPIs ──
  const kpiTotal = document.getElementById('peKpiTotal');
  const kpiEnRuta = document.getElementById('peKpiEnRuta');
  const kpiDisponibles = document.getElementById('peKpiDisponibles');
  const kpiEntregas = document.getElementById('peKpiEntregas');

  // ── Grid y Acciones ──
  const driversGrid = document.getElementById('peDriversGrid');
  const btnNuevoPersonal = document.getElementById('btnNuevoPersonal');

  // ── Modal ──
  const modalOverlay = document.getElementById('peModalOverlay');
  const btnModalClose = document.getElementById('btnPeModalClose');
  const formModal = document.getElementById('formPePersonal');
  const selectModalCargo = document.getElementById('peModalCargo');
  const selectModalVehiculo = document.getElementById('peModalVehiculo');
  const btnModalGuardar = document.getElementById('btnPeModalGuardar');

  if (selectModalCargo && !selectModalCargo.dataset.wiselect) {
    wiSelect(selectModalCargo, { placeholder: 'Cargo...' });
  }

  if (selectModalVehiculo && !selectModalVehiculo.dataset.wiselect) {
    wiSelect(selectModalVehiculo, { placeholder: 'Vehículo...' });
  }

  // ════════════════════════════════════════════════════════════
  // 1. KPIS Y ESTADÍSTICAS DEL EQUIPO
  // ════════════════════════════════════════════════════════════
  function actualizarKpis() {
    const lista = obtenerPersonal();
    const enRuta = lista.filter(p => p.estadoTurno === 'en_ruta').length;
    const disp = lista.filter(p => p.estadoTurno === 'disponible').length;
    const totalEntregas = lista.reduce((acc, p) => acc + (p.entregasHoy || 0), 0);

    if (kpiTotal) kpiTotal.textContent = String(lista.length);
    if (kpiEnRuta) kpiEnRuta.textContent = String(enRuta);
    if (kpiDisponibles) kpiDisponibles.textContent = String(disp);
    if (kpiEntregas) kpiEntregas.textContent = String(totalEntregas);
  }

  // ════════════════════════════════════════════════════════════
  // 2. RENDERIZADO DEL GRID DE CHOFERES
  // ════════════════════════════════════════════════════════════
  function renderizarGrid() {
    if (!driversGrid) return;
    const lista = obtenerPersonal();

    if (lista.length === 0) {
      driversGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--tx2);">
          No hay conductores registrados en el equipo.
        </div>
      `;
      return;
    }

    driversGrid.innerHTML = lista.map(p => {
      const estado = p.estadoTurno || 'disponible';
      const estadoEtiqueta = estado === 'en_ruta' 
        ? 'En Ruta de Entrega' 
        : estado === 'disponible' 
          ? 'Disponible en Base' 
          : 'Descanso';

      return `
        <div class="pe-driver-card" data-id="${p.id}">
          <div class="pe-driver-head">
            <img src="${p.avatar || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80'}" alt="${p.nombre}" class="pe-driver-avatar" />
            <div class="pe-driver-meta">
              <span class="pe-driver-name">${p.nombre} ${p.apellidos || ''}</span>
              <span class="pe-driver-cargo">${p.cargo}</span>
              <span class="pe-status-pill ${estado}">
                <i class="fa-solid fa-circle" style="font-size: 8px;"></i>
                ${estadoEtiqueta}
              </span>
            </div>
          </div>

          <div class="pe-driver-details">
            <div class="pe-detail-row">
              <span class="pe-detail-lbl">Vehículo:</span>
              <span><strong>${p.vehiculoTipo}</strong> (${p.placa})</span>
            </div>
            <div class="pe-detail-row">
              <span class="pe-detail-lbl">Capacidad:</span>
              <span>${p.capacidadBalones} balones GLP</span>
            </div>
            <div class="pe-detail-row">
              <span class="pe-detail-lbl">Cuadrante:</span>
              <span>${p.cuadrante}</span>
            </div>
            <div class="pe-detail-row">
              <span class="pe-detail-lbl">Entregas de Hoy:</span>
              <span style="color: var(--brand-orange); font-weight: 700;">${p.entregasHoy || 0} pedidos</span>
            </div>
          </div>

          <div class="pe-driver-actions">
            <button type="button" class="pe-btn-driver ws pe-btn-ws" data-cel="${p.celular}" data-nombre="${p.nombre}">
              <i class="fa-brands fa-whatsapp"></i> Contactar
            </button>
            <button type="button" class="pe-btn-driver toggle pe-btn-toggle-shift" data-id="${p.id}" data-estado="${estado}">
              <i class="fa-solid fa-arrows-rotate"></i> Cambiar Turno
            </button>
            <button type="button" class="cl-action-btn pe-btn-del" data-id="${p.id}" title="Eliminar conductor">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Listeners
    driversGrid.querySelectorAll('.pe-btn-ws').forEach(btn => {
      btn.addEventListener('click', () => {
        const cel = btn.getAttribute('data-cel')?.replace(/\D/g, '') || '';
        const nom = btn.getAttribute('data-nombre') || 'Repartidor';
        const url = `https://wa.me/51${cel}?text=${encodeURIComponent(`Hola ${nom}, te escribimos desde la central de Solgas Surquillo para coordinar un pedido.`)}`;
        window.open(url, '_blank');
      });
    });

    driversGrid.querySelectorAll('.pe-btn-toggle-shift').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const est = btn.getAttribute('data-estado');
        const nuevoEstado = est === 'disponible' ? 'en_ruta' : est === 'en_ruta' ? 'descanso' : 'disponible';
        cambiarEstadoTurno(id, nuevoEstado);
        actualizarKpis();
        renderizarGrid();
        Notificacion(`Estado de turno actualizado.`, 'info', 1500);
      });
    });

    driversGrid.querySelectorAll('.pe-btn-del').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const conf = await wiConfirmar('¿Deseas dar de baja a este repartidor del equipo?', {
          titulo: 'Eliminar Personal',
          tipo: 'danger',
          siTexto: 'Sí, Eliminar'
        });
        if (conf) {
          eliminarMiembroPersonal(id);
          actualizarKpis();
          renderizarGrid();
          Notificacion('Personal retirado del equipo.', 'info');
        }
      });
    });
  }

  // ════════════════════════════════════════════════════════════
  // 3. MODAL REGISTRO DE PERSONAL
  // ════════════════════════════════════════════════════════════
  btnNuevoPersonal?.addEventListener('click', () => {
    modalOverlay?.classList.add('open');
  });

  btnModalClose?.addEventListener('click', () => {
    modalOverlay?.classList.remove('open');
  });

  formModal?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = document.getElementById('peModalNombre')?.value?.trim();
    const cel = document.getElementById('peModalCelular')?.value?.trim();
    const doc = document.getElementById('peModalDoc')?.value?.trim();
    const placa = document.getElementById('peModalPlaca')?.value?.trim();
    const cuadrante = document.getElementById('peModalCuadrante')?.value?.trim();

    if (!nombre) {
      Notificacion('Indica el nombre del personal.', 'warning');
      return;
    }

    wiSpin(btnModalGuardar, true, 'Guardando...');

    setTimeout(() => {
      guardarMiembroPersonal({
        nombre,
        celular: cel,
        documento: doc,
        cargo: selectModalCargo?.value || 'Repartidor Motorizado',
        vehiculoTipo: selectModalVehiculo?.value || 'Moto de Carga GLP',
        placa: placa || '6741-4B',
        cuadrante: cuadrante || 'Surquillo Centro'
      });

      wiSpin(btnModalGuardar, false);
      modalOverlay?.classList.remove('open');
      formModal.reset();
      actualizarKpis();
      renderizarGrid();
      Notificacion(`¡${nombre} añadido al equipo operativo!`, 'success');
    }, 400);
  });

  // ════════════════════════════════════════════════════════════
  // 4. INICIALIZACIÓN
  // ════════════════════════════════════════════════════════════
  actualizarKpis();
  renderizarGrid();
}
