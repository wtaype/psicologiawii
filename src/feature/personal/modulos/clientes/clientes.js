// src/feature/personal/modulos/clientes/clientes.js
// Controlador Frontend Autónomo para el Módulo Clientes CRM (Solgas Surquillo)
// 100% JS Nativo · Integrado con @widev y Local-First
import { Notificacion, wiSpin, wiConfirmar, wiSugerencias, wiSelect } from '@widev';
import {
  obtenerClientes,
  guardarCliente,
  eliminarCliente,
  calcularMetricasClientes
} from './dataClientes.js';

export function inicializarModuloClientes() {
  const panel = document.getElementById('panel-clientes');
  if (!panel || panel.dataset.clientesInit === 'true') return;
  panel.dataset.clientesInit = 'true';

  let filtroActual = 'todos';
  let busquedaActual = '';
  let clienteSeleccionadoId = null;
  let instSugerencias = null;
  let instModalSelect = null;

  // ── Elementos de KPIs ──
  const kpiTotal = document.getElementById('clKpiTotal');
  const kpiVip = document.getElementById('clKpiVip');
  const kpiNuevos = document.getElementById('clKpiNuevos');
  const kpiConsumo = document.getElementById('clKpiConsumo');

  // ── Toolbar y Filtros ──
  const filtersWrap = document.getElementById('clFiltersWrap');
  const searchInput = document.getElementById('clSearchInput');
  const btnNuevoCliente = document.getElementById('btnNuevoCliente');
  const tableBody = document.getElementById('clTableBody');

  // ── Ficha CRM Derecha ──
  const crmAvatar = document.getElementById('clCrmAvatar');
  const crmNombre = document.getElementById('clCrmNombre');
  const crmDoc = document.getElementById('clCrmDoc');
  const crmTotalPedidos = document.getElementById('clCrmTotalPedidos');
  const crmMontoConsumido = document.getElementById('clCrmMontoConsumido');
  const crmBalonHabitual = document.getElementById('clCrmBalonHabitual');
  const crmPagoHabitual = document.getElementById('clCrmPagoHabitual');
  const crmUltimoPedido = document.getElementById('clCrmUltimoPedido');
  const crmAddressWrap = document.getElementById('clCrmAddressWrap');
  const btnCrmWs = document.getElementById('btnCrmWs');
  const btnCrmCall = document.getElementById('btnCrmCall');
  const btnCrmSunat = document.getElementById('btnCrmSunat');

  // ── Modal Nuevo Cliente ──
  const modalOverlay = document.getElementById('clModalOverlay');
  const btnModalClose = document.getElementById('btnModalClose');
  const formModalCliente = document.getElementById('formModalCliente');
  const selectModalDocTipo = document.getElementById('clModalDocTipo');
  const btnModalGuardar = document.getElementById('btnModalGuardar');

  // ════════════════════════════════════════════════════════════
  // 1. INICIALIZAR KPIS Y REGLAS DE FILTRADO
  // ════════════════════════════════════════════════════════════
  function actualizarKpis() {
    const clientes = obtenerClientes();
    const metricas = calcularMetricasClientes(clientes);
    if (kpiTotal) kpiTotal.textContent = String(metricas.total);
    if (kpiVip) kpiVip.textContent = String(metricas.vip);
    if (kpiNuevos) kpiNuevos.textContent = String(metricas.nuevos);
    if (kpiConsumo) kpiConsumo.textContent = `S/ ${metricas.consumoTotal}`;
  }

  function getClientesFiltrados() {
    const lista = obtenerClientes();
    let res = lista;

    if (filtroActual === 'vip') {
      res = res.filter(c => c.plan === 'vip' || c.totalPedidos >= 5);
    } else if (filtroActual === 'frecuente') {
      res = res.filter(c => c.plan === 'frecuente' || (c.totalPedidos >= 2 && c.totalPedidos < 5));
    } else if (filtroActual === 'nuevo') {
      res = res.filter(c => c.plan === 'nuevo' || c.totalPedidos <= 1);
    }

    if (busquedaActual.trim()) {
      const q = busquedaActual.toLowerCase().trim();
      res = res.filter(c =>
        c.nombre.toLowerCase().includes(q) ||
        (c.apellidos && c.apellidos.toLowerCase().includes(q)) ||
        (c.documento && c.documento.includes(q)) ||
        (c.celular && c.celular.includes(q)) ||
        (c.direcciones && c.direcciones.some(d => d.calle.toLowerCase().includes(q) || d.distrito.toLowerCase().includes(q)))
      );
    }

    return res;
  }

  // ════════════════════════════════════════════════════════════
  // 2. RENDERIZADO DE TABLA Y SELECCIÓN DE CLIENTE
  // ════════════════════════════════════════════════════════════
  function renderizarTabla() {
    if (!tableBody) return;
    const filtrados = getClientesFiltrados();

    if (filtrados.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="sn-empty-history-cell">
            <i class="fa-solid fa-users-slash sn-empty-history-icon"></i>
            No se encontraron clientes con el criterio seleccionado.
          </td>
        </tr>
      `;
      return;
    }

    // Si el cliente seleccionado no está en la lista filtrada, seleccionar el primero
    if (!clienteSeleccionadoId || !filtrados.some(c => c.id === clienteSeleccionadoId)) {
      clienteSeleccionadoId = filtrados[0].id;
    }

    tableBody.innerHTML = filtrados.map(c => {
      const isSelected = c.id === clienteSeleccionadoId;
      const dirPrincipal = (c.direcciones && c.direcciones[0]) ? c.direcciones[0].calle : 'Surquillo';
      const planBadge = c.plan || 'frecuente';

      return `
        <tr class="cl-row ${isSelected ? 'selected' : ''}" data-id="${c.id}">
          <td>
            <div class="cl-user-cell">
              <img src="${c.avatar || 'https://imgwii.web.app/smile.avif'}" alt="${c.nombre}" class="cl-user-avatar" />
              <div class="cl-user-meta">
                <span class="cl-user-name">${c.nombre} ${c.apellidos || ''}</span>
                <span class="cl-user-doc">${c.documentoTipo || 'DNI'}: ${c.documento || ''}</span>
              </div>
            </div>
          </td>
          <td>
            <a href="tel:${c.celular}" class="cl-user-doc" style="color:var(--brand-orange); text-decoration:none; font-weight:600;">
              ${c.celular || 'S/N'}
            </a>
          </td>
          <td style="font-size: 11.5px; color: var(--tx2); max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${dirPrincipal}
          </td>
          <td style="text-align: center; font-weight: 700; color: var(--tx);">
            ${c.totalPedidos || 1}
          </td>
          <td>
            <span class="cl-plan-badge ${planBadge}">${planBadge}</span>
          </td>
          <td>
            <div class="cl-row-actions">
              <button type="button" class="cl-action-btn ws cl-btn-row-ws" data-id="${c.id}" title="WhatsApp">
                <i class="fa-brands fa-whatsapp"></i>
              </button>
              <button type="button" class="cl-action-btn cl-btn-row-del" data-id="${c.id}" title="Eliminar">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Actualizar ficha CRM con el seleccionado
    const seleccionado = filtrados.find(c => c.id === clienteSeleccionadoId) || filtrados[0];
    if (seleccionado) {
      renderizarFichaCrm(seleccionado);
    }

    // Listeners en filas
    tableBody.querySelectorAll('.cl-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.cl-action-btn')) return;
        const id = row.getAttribute('data-id');
        clienteSeleccionadoId = id;
        tableBody.querySelectorAll('.cl-row').forEach(r => r.classList.remove('selected'));
        row.classList.add('selected');
        const c = obtenerClientes().find(x => x.id === id);
        if (c) renderizarFichaCrm(c);
      });
    });

    tableBody.querySelectorAll('.cl-btn-row-ws').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const c = obtenerClientes().find(x => x.id === id);
        if (c) abrirWhatsAppCliente(c);
      });
    });

    tableBody.querySelectorAll('.cl-btn-row-del').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const c = obtenerClientes().find(x => x.id === id);
        if (!c) return;

        const conf = await wiConfirmar(`¿Deseas eliminar del directorio al cliente ${c.nombre}?`, {
          titulo: 'Eliminar Cliente CRM',
          tipo: 'danger',
          siTexto: 'Sí, Eliminar'
        });

        if (conf) {
          eliminarCliente(id);
          actualizarKpis();
          renderizarTabla();
          Notificacion(`Cliente ${c.nombre} eliminado.`, 'info');
        }
      });
    });
  }

  // ════════════════════════════════════════════════════════════
  // 3. FICHA CRM INTERACTIVA (COLUMNA DERECHA)
  // ════════════════════════════════════════════════════════════
  function renderizarFichaCrm(c) {
    if (!c) return;
    if (crmAvatar) crmAvatar.src = c.avatar || 'https://imgwii.web.app/smile.avif';
    if (crmNombre) crmNombre.textContent = `${c.nombre} ${c.apellidos || ''}`;
    if (crmDoc) crmDoc.textContent = `${c.documentoTipo || 'DNI'}: ${c.documento || 'No registrado'} · ${c.email || 'Sin correo'}`;
    if (crmTotalPedidos) crmTotalPedidos.textContent = `${c.totalPedidos || 1} pedidos`;
    if (crmMontoConsumido) crmMontoConsumido.textContent = `S/ ${(parseFloat(c.montoTotalConsumido) || 65.00).toFixed(2)}`;
    if (crmBalonHabitual) crmBalonHabitual.textContent = c.balonHabitual || 'Balón 10 kg';
    if (crmPagoHabitual) crmPagoHabitual.textContent = c.metodoPagoHabitual || 'Efectivo';
    if (crmUltimoPedido) crmUltimoPedido.textContent = c.ultimoPedidoFecha || 'Reciente';

    if (crmAddressWrap) {
      const dirs = c.direcciones || [];
      if (dirs.length === 0) {
        crmAddressWrap.innerHTML = `<div class="cl-crm-address-sub">Sin dirección registrada</div>`;
      } else {
        crmAddressWrap.innerHTML = dirs.map(d => `
          <div class="cl-crm-address-box">
            <div class="cl-crm-address-title">
              <span>📍 ${d.calle}</span>
              <span style="font-size: 10px; color: var(--brand-orange);">${d.eta || '12 min'}</span>
            </div>
            <div class="cl-crm-address-sub">${d.dpto ? `${d.dpto} · ` : ''}${d.distrito || 'Surquillo'}</div>
            ${d.referencia ? `<div class="cl-crm-address-sub" style="font-style: italic;">Ref: ${d.referencia}</div>` : ''}
          </div>
        `).join('');
      }
    }
  }

  function abrirWhatsAppCliente(c) {
    const cel = c.celular?.replace(/\D/g, '') || '';
    const texto = `¡Hola ${c.nombre}! Te saludamos de Solgas Surquillo (Sede Dante 260). ¿Deseas solicitar tu recarga habitual de ${c.balonHabitual || 'Balón de 10 kg'} a domicilio hoy con entrega en 15 minutos?`;
    const url = cel 
      ? `https://wa.me/51${cel}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  }

  btnCrmWs?.addEventListener('click', () => {
    const c = obtenerClientes().find(x => x.id === clienteSeleccionadoId);
    if (c) abrirWhatsAppCliente(c);
  });

  btnCrmCall?.addEventListener('click', () => {
    const c = obtenerClientes().find(x => x.id === clienteSeleccionadoId);
    if (c && c.celular) {
      window.location.href = `tel:${c.celular}`;
    } else {
      Notificacion('El cliente no tiene teléfono celular registrado.', 'warning');
    }
  });

  btnCrmSunat?.addEventListener('click', () => {
    const c = obtenerClientes().find(x => x.id === clienteSeleccionadoId);
    if (!c) return;
    // Navegar al módulo de SUNAT
    const sunatTab = document.querySelector('[data-panel-target="sunat"]');
    if (sunatTab) {
      sunatTab.click();
      setTimeout(() => {
        const inpBuscar = document.getElementById('snInpClienteBuscar');
        if (inpBuscar) {
          inpBuscar.value = c.nombre;
          inpBuscar.dispatchEvent(new Event('input'));
        }
      }, 300);
    }
  });

  // ════════════════════════════════════════════════════════════
  // 4. FILTROS Y BÚSQUEDA CON WISUGERENCIAS
  // ════════════════════════════════════════════════════════════
  filtersWrap?.querySelectorAll('.cl-filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      filtersWrap.querySelectorAll('.cl-filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filtroActual = btn.getAttribute('data-filter') || 'todos';
      renderizarTabla();
    });
  });

  searchInput?.addEventListener('input', (e) => {
    busquedaActual = e.target.value;
    renderizarTabla();
  });

  if (searchInput && !searchInput.dataset.wisugerencias) {
    instSugerencias = wiSugerencias(searchInput, {
      sugerencias: () => obtenerClientes().map(c => `${c.nombre} · ${c.documento || c.celular}`),
      maxResultados: 5,
      onSelect: (val) => {
        busquedaActual = val.split('·')[0].trim();
        renderizarTabla();
      }
    });
  }

  // ════════════════════════════════════════════════════════════
  // 5. MODAL NUEVO CLIENTE
  // ════════════════════════════════════════════════════════════
  if (selectModalDocTipo && !selectModalDocTipo.dataset.wiselect) {
    instModalSelect = wiSelect(selectModalDocTipo, {
      placeholder: 'Selecciona tipo...'
    });
  }

  btnNuevoCliente?.addEventListener('click', () => {
    modalOverlay?.classList.add('open');
    document.getElementById('clModalNombre')?.focus();
  });

  btnModalClose?.addEventListener('click', () => {
    modalOverlay?.classList.remove('open');
  });

  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove('open');
  });

  formModalCliente?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = document.getElementById('clModalNombre')?.value?.trim();
    const doc = document.getElementById('clModalDoc')?.value?.trim();
    const cel = document.getElementById('clModalCelular')?.value?.trim();
    const dir = document.getElementById('clModalDireccion')?.value?.trim();
    const balon = document.getElementById('clModalBalon')?.value || 'Balón SOLGAS Premium 10 kg';

    if (!nombre || !doc) {
      Notificacion('Completa al menos el nombre y documento del cliente.', 'warning');
      return;
    }

    wiSpin(btnModalGuardar, true, 'Guardando...');

    setTimeout(() => {
      const nuevo = guardarCliente({
        nombre,
        documentoTipo: selectModalDocTipo?.value || 'DNI',
        documento: doc,
        celular: cel,
        direccion: dir,
        balonHabitual: balon
      });

      wiSpin(btnModalGuardar, false);
      modalOverlay?.classList.remove('open');
      formModalCliente.reset();
      clienteSeleccionadoId = nuevo.id;
      actualizarKpis();
      renderizarTabla();
      Notificacion(`¡Cliente ${nombre} registrado exitosamente!`, 'success');
    }, 400);
  });

  // ════════════════════════════════════════════════════════════
  // 6. INICIALIZACIÓN
  // ════════════════════════════════════════════════════════════
  actualizarKpis();
  renderizarTabla();
}
