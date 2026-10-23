// src/feature/personal/modulos/clientes/clientes.js
// Controlador Frontend Autónomo para el Módulo Clientes CRM Contable
// 100% JS Nativo · Integrado con @widev y Local-First
import { Notificacion, wiSpin, wiConfirmar } from '@widev';
import { configSemilla } from '../../../../negocio.js';
import {
  obtenerClientes,
  guardarCliente,
  eliminarCliente,
  calcularMetricasClientes,
  sincronizarClientesDesdeFirestore
} from './dataClientes.js';

export function inicializarModuloClientes() {
  const panel = document.getElementById('panel-clientes');
  if (!panel || panel.dataset.clientesInit === 'true') return;
  panel.dataset.clientesInit = 'true';

  let filtroActual = 'todos';
  let busquedaActual = '';
  let clienteSeleccionadoId = null;

  // ── Elementos de KPIs ──
  const kpiTotal = document.getElementById('clKpiTotal');
  const kpiMype = document.getElementById('clKpiMype');
  const kpiIndependientes = document.getElementById('clKpiIndependientes');
  const kpiFacturacion = document.getElementById('clKpiFacturacion');

  // ── Toolbar y Filtros ──
  const filtersWrap = document.getElementById('clFiltersWrap');
  const searchInput = document.getElementById('clSearchInput');
  const btnNuevoCliente = document.getElementById('btnNuevoCliente');
  const tableBody = document.getElementById('clTableBody');

  // ── Ficha CRM Derecha ──
  const crmAvatarBox = document.getElementById('clCrmAvatarBox');
  const crmAvatarImg = document.getElementById('clCrmAvatarImg');
  const crmAvatarLetter = document.getElementById('clCrmAvatarLetter');
  const crmNombre = document.getElementById('clCrmNombre');
  const crmDoc = document.getElementById('clCrmDoc');
  const crmRegimen = document.getElementById('clCrmRegimen');
  const crmHonorario = document.getElementById('clCrmHonorario');
  const crmServicio = document.getElementById('clCrmServicio');
  const crmDigitoRuc = document.getElementById('clCrmDigitoRuc');
  const crmEstadoFiscal = document.getElementById('clCrmEstadoFiscal');
  const crmFechaInicio = document.getElementById('clCrmFechaInicio');
  const crmDireccion = document.getElementById('clCrmDireccion');
  const crmContacto = document.getElementById('clCrmContacto');
  const crmObservaciones = document.getElementById('clCrmObservaciones');
  const btnCrmWs = document.getElementById('btnCrmWs');
  const btnCrmCall = document.getElementById('btnCrmCall');
  const btnCrmSunat = document.getElementById('btnCrmSunat');

  // ── Modal Nuevo Cliente ──
  const modalOverlay = document.getElementById('clModalOverlay');
  const btnModalClose = document.getElementById('btnModalClose');
  const formModalCliente = document.getElementById('formModalCliente');
  const selectModalDocTipo = document.getElementById('clModalDocTipo');
  const inputModalDoc = document.getElementById('clModalDoc');
  const inputModalNombre = document.getElementById('clModalNombre');
  const selectModalRegimen = document.getElementById('clModalRegimen');
  const inputModalHonorario = document.getElementById('clModalHonorario');
  const inputModalCelular = document.getElementById('clModalCelular');
  const inputModalEmail = document.getElementById('clModalEmail');
  const inputModalDireccion = document.getElementById('clModalDireccion');
  const btnModalGuardar = document.getElementById('btnModalGuardar');

  // ════════════════════════════════════════════════════════════
  // 1. INICIALIZAR KPIS Y REGLAS DE FILTRADO
  // ════════════════════════════════════════════════════════════
  function actualizarKpis() {
    const clientes = obtenerClientes();
    const metricas = calcularMetricasClientes(clientes);
    if (kpiTotal) kpiTotal.textContent = String(metricas.total);
    if (kpiMype) kpiMype.textContent = String(metricas.mype);
    if (kpiIndependientes) kpiIndependientes.textContent = String(metricas.independientes);
    if (kpiFacturacion) kpiFacturacion.textContent = `S/ ${metricas.facturacionMensual}`;

    // Sincronizar badge dinámico en el sidebar de clientes
    const badgeSidebar = document.getElementById('navBadge_clientes') || document.querySelector('[data-badge-target="clientes"]');
    if (badgeSidebar) {
      badgeSidebar.textContent = String(metricas.total);
    }
  }

  function getClientesFiltrados() {
    const lista = obtenerClientes();
    let res = lista;

    if (filtroActual === 'mype') {
      res = res.filter(c => (c.regimenTributario || '').toLowerCase().includes('mype') || (c.regimenTributario || '').toLowerCase().includes('general') || (c.regimenTributario || '').toLowerCase().includes('comercial') || c.documentoTipo === 'RUC');
    } else if (filtroActual === 'independiente') {
      res = res.filter(c => (c.regimenTributario || '').toLowerCase().includes('4ta') || (c.regimenTributario || '').toLowerCase().includes('residencial') || (c.regimenTributario || '').toLowerCase().includes('hogar') || c.documentoTipo === 'DNI');
    } else if (filtroActual === 'rer') {
      res = res.filter(c => (c.regimenTributario || '').toLowerCase().includes('especial') || (c.regimenTributario || '').toLowerCase().includes('rer'));
    }

    if (busquedaActual.trim()) {
      const q = busquedaActual.toLowerCase().trim();
      res = res.filter(c =>
        c.nombre.toLowerCase().includes(q) ||
        (c.contacto && c.contacto.toLowerCase().includes(q)) ||
        (c.documento && c.documento.includes(q)) ||
        (c.celular && c.celular.includes(q)) ||
        (c.direccion && c.direccion.toLowerCase().includes(q))
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
          <td colspan="6" class="sn-empty-history-cell" style="text-align:center; padding:32px 16px; color:var(--muted);">
            <i class="fa-solid fa-users-slash" style="font-size:24px; margin-bottom:8px; display:block;"></i>
            No se encontraron clientes tributarios con el criterio seleccionado.
          </td>
        </tr>
      `;
      return;
    }

    if (!clienteSeleccionadoId || !filtrados.some(c => c.id === clienteSeleccionadoId)) {
      clienteSeleccionadoId = filtrados[0].id;
    }

    tableBody.innerHTML = filtrados.map(c => {
      const isSelected = c.id === clienteSeleccionadoId;
      const ruc = c.documento || 'Sin doc';
      const digito = c.ultimoDigitoRuc ?? (ruc.length >= 1 ? ruc.slice(-1) : 0);
      const honorario = (parseFloat(c.honorarioPEN) || 0).toFixed(2);
      const regimen = c.regimenTributario || 'MYPE';

        const avatarHtml = c.avatar 
          ? `<img src="${c.avatar}" alt="${c.nombre}" class="cl-user-avatar" onerror="this.src='/smile.avif'" />`
          : `<div class="cl-user-avatar-tag">${c.nombre.charAt(0).toUpperCase()}</div>`;

        return `
        <tr class="cl-row ${isSelected ? 'selected' : ''}" data-id="${c.id}">
          <td>
            <div class="cl-user-cell">
              ${avatarHtml}
              <div class="cl-user-meta">
                <span class="cl-user-name">${c.nombre}</span>
                <span class="cl-user-doc">${c.documentoTipo || 'RUC'}: ${ruc}</span>
              </div>
            </div>
          </td>
          <td>
            <a href="tel:${c.celular}" class="cl-user-doc" style="color:var(--mco, var(--brand-primary, #ff6600)); text-decoration:none; font-weight:600;">
              ${c.celular || 'S/N'}
            </a>
          </td>
          <td style="font-size: 12px; color: var(--tx);">
            ${regimen}
          </td>
          <td style="text-align: center; font-weight: 800; color: var(--mco, var(--brand-primary, #ff6600)); font-size:14px;">
            ${digito}
          </td>
          <td style="text-align: right; font-weight: 700; color: var(--tx);">
            S/ ${honorario}
          </td>
          <td>
            <div class="cl-row-actions">
              <button type="button" class="cl-action-btn ws cl-btn-row-ws" data-id="${c.id}" title="Recordar Vencimiento por WhatsApp">
                <i class="fa-brands fa-whatsapp"></i>
              </button>
              <button type="button" class="cl-action-btn cl-btn-row-del" data-id="${c.id}" title="Eliminar Cliente">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

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

        const conf = await wiConfirmar(`¿Deseas retirar a ${c.nombre} del directorio de clientes?`, {
          titulo: 'Eliminar Cliente',
          tipo: 'danger',
          siTexto: 'Sí, Retirar'
        });

        if (conf) {
          await eliminarCliente(id);
          actualizarKpis();
          renderizarTabla();
          Notificacion(`Cliente ${c.nombre} retirado del directorio.`, 'info', 2500);
        }
      });
    });
  }

  // ════════════════════════════════════════════════════════════
  // 3. FICHA CRM INTERACTIVA (COLUMNA DERECHA)
  // ════════════════════════════════════════════════════════════
  function renderizarFichaCrm(c) {
    if (!c) return;

    if (c.avatar) {
      if (crmAvatarImg) {
        crmAvatarImg.src = c.avatar;
        crmAvatarImg.style.display = 'block';
        crmAvatarImg.onerror = () => {
          crmAvatarImg.src = '/smile.avif';
        };
      }
      if (crmAvatarLetter) crmAvatarLetter.style.display = 'none';
    } else {
      if (crmAvatarImg) crmAvatarImg.style.display = 'none';
      if (crmAvatarLetter) {
        crmAvatarLetter.style.display = 'flex';
        crmAvatarLetter.textContent = (c.nombre || 'E').charAt(0).toUpperCase();
      }
    }

    if (crmNombre) crmNombre.textContent = c.nombre;
    if (crmDoc) crmDoc.textContent = `${c.documentoTipo || 'DOC'}: ${c.documento || 'No registrado'} · ${c.email || 'Sin correo'}`;
    if (crmRegimen) crmRegimen.textContent = c.regimenTributario || (c.documentoTipo === 'RUC' ? 'Comercial' : 'Residencial');
    if (crmHonorario) crmHonorario.textContent = `S/ ${(parseFloat(c.honorarioPEN) || 65.00).toFixed(2)}`;
    if (crmServicio) crmServicio.textContent = c.servicioContratado || (c.valvulaPreferida ? `Balón con Válvula ${c.valvulaPreferida}` : 'Despacho Express');
    
    const ruc = c.documento || '';
    const dig = c.ultimoDigitoRuc ?? (ruc.length >= 1 ? ruc.slice(-1) : 0);
    if (crmDigitoRuc) crmDigitoRuc.textContent = `${dig}`;
    
    if (crmEstadoFiscal) {
      crmEstadoFiscal.textContent = c.estadoTributario === 'al_dia' ? 'Al Día / Activo' : 'Pendiente';
      crmEstadoFiscal.className = `cl-status-tag ${c.estadoTributario || 'al_dia'}`;
    }
    if (crmFechaInicio) crmFechaInicio.textContent = c.fechaInicio || 'Ene 2026';
    if (crmDireccion) crmDireccion.textContent = c.direccion || '-';
    if (crmContacto) crmContacto.textContent = `Contacto: ${c.contacto || c.nombre}`;
    if (crmObservaciones) crmObservaciones.textContent = c.observaciones || 'Sin observaciones registradas.';
  }

  function abrirWhatsAppCliente(c) {
    const cel = c.celular?.replace(/\D/g, '') || '';
    const ruc = c.documento || '';
    const emisor = window.Wii?.negocio?.nombreCorto || window.Wii?.negocio?.nombre || 'la administración';
    const esGlp = !window.Wii?.negocio?.identidad?.especialista?.toLowerCase().includes('contab');
    const texto = esGlp
      ? `¡Hola ${c.contacto || c.nombre}! Te saluda ${emisor}. Nos comunicamos para coordinar tu próximo pedido o consultar si requieres recarga de gas GLP con balanza comprobada. ¡Estamos a tu servicio!`
      : `¡Hola ${c.contacto || c.nombre}! Te saluda ${emisor}. Te recordamos que la declaración mensual SUNAT de tu RUC (${ruc}) se aproxima a su fecha de vencimiento. Agradecemos remitir tus comprobantes para procesar tu declaración a tiempo.`;
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
      Notificacion('El cliente no tiene celular registrado.', 'warning', 2500);
    }
  });

  btnCrmSunat?.addEventListener('click', () => {
    const c = obtenerClientes().find(x => x.id === clienteSeleccionadoId);
    if (!c) return;
    // Navegar a módulo SUNAT y prellenar datos
    const btnNavSunat = document.querySelector('[data-seccion="sunat"]');
    if (btnNavSunat) {
      btnNavSunat.click();
      setTimeout(() => {
        const inpRuc = document.getElementById('snInputDoc');
        const inpRazon = document.getElementById('snInputNombre');
        if (inpRuc) inpRuc.value = c.documento || '';
        if (inpRazon) inpRazon.value = c.nombre || '';
      }, 300);
    }
  });

  // ════════════════════════════════════════════════════════════
  // 4. FILTROS Y BÚSQUEDA
  // ════════════════════════════════════════════════════════════
  filtersWrap?.querySelectorAll('.cl-filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      filtersWrap.querySelectorAll('.cl-filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      filtroActual = pill.getAttribute('data-filter') || 'todos';
      renderizarTabla();
    });
  });

  searchInput?.addEventListener('input', (e) => {
    busquedaActual = (e.target).value;
    renderizarTabla();
  });

  // ════════════════════════════════════════════════════════════
  // 5. MODAL NUEVO CLIENTE
  // ════════════════════════════════════════════════════════════
  btnNuevoCliente?.addEventListener('click', () => {
    if (formModalCliente) formModalCliente.reset();
    if (modalOverlay) modalOverlay.classList.add('active');
  });

  btnModalClose?.addEventListener('click', () => {
    if (modalOverlay) modalOverlay.classList.remove('active');
  });

  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove('active');
    }
  });

  formModalCliente?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const docTipo = selectModalDocTipo?.value || 'RUC';
    const doc = inputModalDoc?.value?.trim();
    const nombre = inputModalNombre?.value?.trim();
    const regimen = selectModalRegimen?.value || 'Régimen MYPE Tributario (RMT)';
    const honorario = parseFloat(inputModalHonorario?.value) || 150.00;
    const celular = inputModalCelular?.value?.trim();
    const email = inputModalEmail?.value?.trim();
    const direccion = inputModalDireccion?.value?.trim() || '';

    if (!doc || !nombre || !celular) {
      Notificacion('Completa los campos obligatorios (*).', 'warning', 2500);
      return;
    }

    const spin = wiSpin ? wiSpin(btnModalGuardar) : null;
    if (btnModalGuardar) btnModalGuardar.disabled = true;

    try {
      const nuevo = await guardarCliente({
        nombre,
        contacto: nombre,
        documentoTipo: docTipo,
        documento: doc,
        regimenTributario: regimen,
        honorarioPEN: honorario,
        celular,
        email,
        direccion,
        servicioContratado: configSemilla?.modeloNegocio === 'servicios_y_asesorias'
          ? (regimen.includes('4ta') ? 'Asesoría y Consultoría Especializada' : 'Servicio Profesional Mensual')
          : (configSemilla?.terminologia?.comprobanteConceptoDefault || 'Suministro y Recarga de Balón GLP'),
        estadoTributario: 'al_dia',
        fechaInicio: 'Hoy'
      });

      clienteSeleccionadoId = nuevo.id;
      actualizarKpis();
      renderizarTabla();
      if (modalOverlay) modalOverlay.classList.remove('active');
      Notificacion(`Cliente ${nombre} registrado con éxito.`, 'success', 3000);
    } catch (err) {
      console.error(err);
      Notificacion('Error al guardar cliente: ' + (err?.message || err), 'danger', 3000);
    } finally {
      if (spin) spin.stop();
      if (btnModalGuardar) btnModalGuardar.disabled = false;
    }
  });

  // ════════════════════════════════════════════════════════════
  // 6. INICIALIZACIÓN
  // ════════════════════════════════════════════════════════════
  actualizarKpis();
  renderizarTabla();

  // Sincronización en segundo plano desde Firestore
  sincronizarClientesDesdeFirestore().then(() => {
    actualizarKpis();
    renderizarTabla();
  });
}
