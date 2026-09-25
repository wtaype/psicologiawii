// src/feature/personal/modulos/sunat/sunat.js
// 🎯 Controlador Frontend Autónomo del Módulo SUNAT: Registro Fácil (Solgas Surquillo)
// wiSelect + wiSugerencias de @widev + Cálculos IGV 18% + Vista Previa Ticket + WhatsApp en 1 Clic
// 100% JS Nativo · Integrado con @widev

import { Notificacion, wiSpin, wiConfirmar, wiSelect, wiSugerencias } from '@widev';
import {
  obtenerComprobantes,
  guardarComprobante,
  anularComprobante,
  eliminarComprobante,
  obtenerSiguienteCorrelativo,
  calcularTotales,
  obtenerClientesDesdeSmiles,
  generarMensajeWhatsApp,
  formatearFecha
} from './dataSunat.js';

export function inicializarModuloSunat() {
  const panel = document.getElementById('panel-sunat');
  if (!panel || panel.dataset.sunatInit === 'true') return;
  panel.dataset.sunatInit = 'true';

  let tipoDocActual = 'boleta';
  let clientesCargados = [];
  let filtroHistorial = 'todos';
  let busquedaHistorial = '';

  // Instancias de @widev
  let instDocTipo = null;
  let instMetodoPago = null;
  let instEstado = null;
  let instSugerencias = null;

  // Ítems iniciales por defecto en el redactor (1x Balón 10kg)
  let itemsActuales = [
    {
      id: 'balon-10kg',
      descripcion: 'Balón SOLGAS Premium 10 kg',
      cantidad: 1,
      precioUnitario: 65.00,
      subtotal: 65.00
    }
  ];

  // ── Elementos del Header Superior ──
  const btnTopBoleta = document.getElementById('btnSunatNuevaBoleta');
  const btnTopFactura = document.getElementById('btnSunatNuevaFactura');
  const btnRegistrar = document.getElementById('btnRegistrarComprobante');

  // ── Elementos de KPIs ──
  const kpiTotalMes = document.getElementById('snKpiTotalMes');
  const kpiBoletas = document.getElementById('snKpiBoletas');
  const kpiFacturas = document.getElementById('snKpiFacturas');
  const kpiIgv = document.getElementById('snKpiIgv');

  // ── Formulario y Selector de Tipo ──
  const formComprobante = document.getElementById('formSunatComprobante');
  const hiddenTipo = document.getElementById('snTipoDoc');
  const tabBoleta = document.getElementById('snTabBoleta');
  const tabFactura = document.getElementById('snTabFactura');
  const inSerie = document.getElementById('snInpSerie');
  const inNumero = document.getElementById('snInpNumero');
  const inFecha = document.getElementById('snInpFecha');

  // ── Campos de Cliente y Autocompletado ──
  const inClienteBuscar = document.getElementById('snInpClienteBuscar');
  const inDocTipo = document.getElementById('snInpDocTipo');
  const inDocNumero = document.getElementById('snInpDocNumero');
  const inClienteCelular = document.getElementById('snInpClienteCelular');
  const inClienteNombre = document.getElementById('snInpClienteNombre');
  const inClienteDireccion = document.getElementById('snInpClienteDireccion');

  // ── Tabla de Ítems y Botones Rápidos ──
  const quickButtonsWrap = document.getElementById('snQuickButtonsWrap');
  const itemsTableBody = document.getElementById('snItemsTableBody');
  const txtOpGravada = document.getElementById('snTxtOpGravada');
  const txtIgv = document.getElementById('snTxtIgv');
  const txtTotal = document.getElementById('snTxtTotal');

  // ── Forma de Pago y Observación ──
  const selectMetodoPago = document.getElementById('snSelectMetodoPago');
  const selectEstado = document.getElementById('snSelectEstado');
  const inObservacion = document.getElementById('snInpObservacion');

  // ── Vista Previa de Ticket ──
  const ticketTipoBadge = document.getElementById('snTicketTipoBadge');
  const ticketSerieNumero = document.getElementById('snTicketSerieNumero');
  const ticketFecha = document.getElementById('snTicketFecha');
  const ticketCliente = document.getElementById('snTicketCliente');
  const ticketDocLabel = document.getElementById('snTicketDocLabel');
  const ticketDoc = document.getElementById('snTicketDoc');
  const ticketDireccion = document.getElementById('snTicketDireccion');
  const ticketItemsBody = document.getElementById('snTicketItemsBody');
  const ticketOpGravada = document.getElementById('snTicketOpGravada');
  const ticketIgv = document.getElementById('snTicketIgv');
  const ticketTotal = document.getElementById('snTicketTotal');
  const ticketPago = document.getElementById('snTicketPago');
  const btnTicketWhatsApp = document.getElementById('btnTicketWhatsApp');
  const btnTicketImprimir = document.getElementById('btnTicketImprimir');

  // ── Historial de Comprobantes ──
  const filterPillsWrap = document.getElementById('snFilterPillsWrap');
  const searchInput = document.getElementById('snHistorySearchInput');
  const historyTableBody = document.getElementById('snHistoryTableBody');
  const historyTotalCount = document.getElementById('snHistoryTotalCount');

  // ════════════════════════════════════════════════════════════
  // 1. INICIALIZACIÓN DE WISELECT Y WISUGERENCIAS (@widev)
  // ════════════════════════════════════════════════════════════
  function inicializarWiSelects() {
    // 1. Selector de Tipo de Documento con wiSelect
    if (inDocTipo && !inDocTipo.dataset.wiselect) {
      instDocTipo = wiSelect(inDocTipo, {
        placeholder: 'Tipo de documento...',
        searchPlaceholder: 'Buscar tipo...',
        onChange: (val) => {
          if (val === 'RUC' && tipoDocActual !== 'factura') {
            cambiarTipoDoc('factura');
          } else if (val === 'DNI' && tipoDocActual !== 'boleta') {
            cambiarTipoDoc('boleta');
          }
          actualizarTicketPreview();
        }
      });
    }

    // 2. Selector de Método de Pago con wiSelect
    if (selectMetodoPago && !selectMetodoPago.dataset.wiselect) {
      instMetodoPago = wiSelect(selectMetodoPago, {
        placeholder: 'Selecciona forma de pago...',
        searchPlaceholder: 'Buscar método...',
        onChange: () => {
          actualizarTicketPreview();
        }
      });
    }

    // 3. Selector de Estado de Pago con wiSelect
    if (selectEstado && !selectEstado.dataset.wiselect) {
      instEstado = wiSelect(selectEstado, {
        placeholder: 'Selecciona estado de pago...'
      });
    }

    // 4. Autocompletado de Clientes con wiSugerencias
    if (inClienteBuscar && !inClienteBuscar.dataset.wisugerencias) {
      instSugerencias = wiSugerencias(inClienteBuscar, {
        sugerencias: () => clientesCargados.map(c => `${c.nombre} · ${c.documentoTipo || 'DOC'}: ${c.documento || ''}`),
        maxResultados: 6,
        onSelect: (val) => {
          const docMatch = val.match(/:?\s*(\d{8,11})/);
          const docNum = docMatch ? docMatch[1] : '';
          const cliente = clientesCargados.find(c => (docNum && c.documento === docNum) || val.includes(c.nombre));
          if (cliente) seleccionarCliente(cliente);
        }
      });
    }
  }

  // ════════════════════════════════════════════════════════════
  // 2. CARGA DE CLIENTES DESDE SMILES (ROL: CLIENTE)
  // ════════════════════════════════════════════════════════════
  async function cargarClientesSmiles() {
    clientesCargados = await obtenerClientesDesdeSmiles();
    if (instSugerencias) {
      instSugerencias.updateSugerencias(
        clientesCargados.map(c => `${c.nombre} · ${c.documentoTipo || 'DOC'}: ${c.documento || ''}`)
      );
    }
  }

  function seleccionarCliente(c) {
    if (inClienteNombre) inClienteNombre.value = c.nombre || '';
    if (inDocNumero) inDocNumero.value = c.documento || '';
    if (inClienteCelular) inClienteCelular.value = c.celular || '';
    if (inClienteDireccion) inClienteDireccion.value = c.direccion || '';
    if (inClienteBuscar) inClienteBuscar.value = c.nombre || '';

    const tipoDoc = c.documentoTipo || (c.documento && c.documento.length === 11 ? 'RUC' : 'DNI');
    if (instDocTipo) instDocTipo.setValue(tipoDoc);
    else if (inDocTipo) inDocTipo.value = tipoDoc;

    // Auto switch a Factura si el documento es RUC (11 dígitos)
    if (c.documento && c.documento.length === 11 && c.documento.startsWith('20')) {
      cambiarTipoDoc('factura');
    }

    actualizarTicketPreview();
    Notificacion(`Cliente ${c.nombre} cargado desde smiles.`, 'info');
  }

  // ════════════════════════════════════════════════════════════
  // 3. CONMUTADOR DE TIPO (BOLETA B001 / FACTURA F001)
  // ════════════════════════════════════════════════════════════
  function cambiarTipoDoc(tipo = 'boleta') {
    tipoDocActual = tipo;
    if (hiddenTipo) hiddenTipo.value = tipo;

    const correlativo = obtenerSiguienteCorrelativo(tipo);
    if (inSerie) inSerie.value = correlativo.serie;
    if (inNumero) inNumero.value = correlativo.numero;

    tabBoleta?.classList.toggle('active', tipo === 'boleta');
    tabFactura?.classList.toggle('active', tipo === 'factura');

    const defaultDocTipo = tipo === 'factura' ? 'RUC' : 'DNI';
    if (instDocTipo) instDocTipo.setValue(defaultDocTipo);
    else if (inDocTipo) inDocTipo.value = defaultDocTipo;

    if (inDocNumero) {
      inDocNumero.placeholder = tipo === 'factura' ? '20554897123' : '71779978';
    }

    if (inClienteNombre) {
      inClienteNombre.placeholder = tipo === 'factura' 
        ? 'Razón Social de la Empresa' 
        : 'Nombre Completo del Cliente';
    }

    actualizarTicketPreview();
  }

  tabBoleta?.addEventListener('click', () => cambiarTipoDoc('boleta'));
  tabFactura?.addEventListener('click', () => cambiarTipoDoc('factura'));
  btnTopBoleta?.addEventListener('click', () => {
    cambiarTipoDoc('boleta');
    window.scrollTo({ top: panel.offsetTop - 30, behavior: 'smooth' });
    inClienteBuscar?.focus();
  });
  btnTopFactura?.addEventListener('click', () => {
    cambiarTipoDoc('factura');
    window.scrollTo({ top: panel.offsetTop - 30, behavior: 'smooth' });
    inClienteBuscar?.focus();
  });

  // ════════════════════════════════════════════════════════════
  // 4. GESTIÓN DE ÍTEMS Y CÁLCULOS TRIBUTARIOS (18% IGV)
  // ════════════════════════════════════════════════════════════
  function agregarOIncrementarProducto(prod) {
    const idx = itemsActuales.findIndex(i => i.id === prod.id || i.descripcion === prod.descripcion);
    if (idx >= 0) {
      itemsActuales[idx].cantidad += 1;
      itemsActuales[idx].subtotal = itemsActuales[idx].cantidad * itemsActuales[idx].precioUnitario;
    } else {
      itemsActuales.push({
        id: prod.id || `prod_${Date.now()}`,
        descripcion: prod.descripcion,
        cantidad: 1,
        precioUnitario: parseFloat(prod.precioUnitario),
        subtotal: parseFloat(prod.precioUnitario)
      });
    }
    renderizarTablaItems();
    actualizarTicketPreview();
  }

  function eliminarItem(index) {
    itemsActuales.splice(index, 1);
    if (itemsActuales.length === 0) {
      // Dejar mínimo 1 item vacío
      itemsActuales.push({
        id: 'balon-10kg',
        descripcion: 'Balón SOLGAS Premium 10 kg',
        cantidad: 1,
        precioUnitario: 65.00,
        subtotal: 65.00
      });
    }
    renderizarTablaItems();
    actualizarTicketPreview();
  }

  function renderizarTablaItems() {
    if (!itemsTableBody) return;

    itemsTableBody.innerHTML = itemsActuales.map((item, idx) => `
      <tr>
        <td>
          <input 
            type="text" 
            class="sn-input sn-item-desc sn-item-desc-input" 
            data-index="${idx}" 
            value="${item.descripcion}" 
          />
        </td>
        <td class="sn-text-center">
          <input 
            type="number" 
            min="1" 
            class="sn-table-input sn-item-qty" 
            data-index="${idx}" 
            value="${item.cantidad}" 
          />
        </td>
        <td class="sn-text-right">
          <input 
            type="number" 
            step="0.5" 
            min="0" 
            class="sn-table-input sn-item-price sn-item-price-input" 
            data-index="${idx}" 
            value="${item.precioUnitario.toFixed(2)}" 
          />
        </td>
        <td class="sn-item-subtotal-cell">
          S/ ${item.subtotal.toFixed(2)}
        </td>
        <td class="sn-text-center">
          <button type="button" class="sn-table-btn-del" data-del-index="${idx}" title="Quitar ítem">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `).join('');

    // Listeners de inputs de la tabla
    itemsTableBody.querySelectorAll('.sn-item-desc').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const i = parseInt(inp.getAttribute('data-index'), 10);
        itemsActuales[i].descripcion = e.target.value;
        actualizarTicketPreview();
      });
    });

    itemsTableBody.querySelectorAll('.sn-item-qty').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const i = parseInt(inp.getAttribute('data-index'), 10);
        const qty = Math.max(1, parseInt(e.target.value, 10) || 1);
        itemsActuales[i].cantidad = qty;
        itemsActuales[i].subtotal = qty * itemsActuales[i].precioUnitario;
        renderizarTablaItems();
        actualizarTicketPreview();
      });
    });

    itemsTableBody.querySelectorAll('.sn-item-price').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const i = parseInt(inp.getAttribute('data-index'), 10);
        const price = Math.max(0, parseFloat(e.target.value) || 0);
        itemsActuales[i].precioUnitario = price;
        itemsActuales[i].subtotal = itemsActuales[i].cantidad * price;
        renderizarTablaItems();
        actualizarTicketPreview();
      });
    });

    itemsTableBody.querySelectorAll('.sn-table-btn-del').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.getAttribute('data-del-index'), 10);
        eliminarItem(i);
      });
    });

    // Actualizar resumen de totales
    const totales = calcularTotales(itemsActuales);
    if (txtOpGravada) txtOpGravada.textContent = `S/ ${totales.opGravada}`;
    if (txtIgv) txtIgv.textContent = `S/ ${totales.igv}`;
    if (txtTotal) txtTotal.textContent = `S/ ${totales.total}`;
  }

  // Listeners para botones rápidos de balones
  quickButtonsWrap?.querySelectorAll('.sn-quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-prod-id');
      const descripcion = btn.getAttribute('data-prod-desc');
      const precioUnitario = parseFloat(btn.getAttribute('data-prod-price'));
      agregarOIncrementarProducto({ id, descripcion, precioUnitario });
      Notificacion(`+1 ${descripcion} agregado.`, 'info', 1500);
    });
  });

  // ════════════════════════════════════════════════════════════
  // 5. VISTA PREVIA DEL TICKET TÉRMICO EN VIVO
  // ════════════════════════════════════════════════════════════
  function actualizarTicketPreview() {
    const correlativo = obtenerSiguienteCorrelativo(tipoDocActual);
    const totales = calcularTotales(itemsActuales);
    const cliNombre = inClienteNombre?.value?.trim() || 'Cliente Mostrador';
    const cliDocTipo = inDocTipo?.value || (tipoDocActual === 'factura' ? 'RUC' : 'DNI');
    const cliDocNum = inDocNumero?.value?.trim() || (tipoDocActual === 'factura' ? '20554897123' : '71779978');
    const cliDireccion = inClienteDireccion?.value?.trim() || 'Surquillo, Lima';
    const pagoMetodo = selectMetodoPago?.value || 'Efectivo';

    if (ticketTipoBadge) {
      ticketTipoBadge.textContent = tipoDocActual === 'factura'
        ? 'FACTURA ELECTRÓNICA'
        : 'BOLETA DE VENTA ELECTRÓNICA';
    }

    if (ticketSerieNumero) ticketSerieNumero.textContent = correlativo.serieNumero;
    if (ticketFecha) ticketFecha.textContent = formatearFecha(new Date());
    if (ticketCliente) ticketCliente.textContent = cliNombre;
    if (ticketDocLabel) ticketDocLabel.textContent = cliDocTipo;
    if (ticketDoc) ticketDoc.textContent = cliDocNum;
    if (ticketDireccion) ticketDireccion.textContent = cliDireccion;
    if (ticketPago) ticketPago.textContent = pagoMetodo;

    if (ticketItemsBody) {
      ticketItemsBody.innerHTML = itemsActuales.map(it => `
        <tr>
          <td>${it.descripcion}</td>
          <td class="sn-text-center">${it.cantidad}</td>
          <td class="sn-text-right">S/ ${it.subtotal.toFixed(2)}</td>
        </tr>
      `).join('');
    }

    if (ticketOpGravada) ticketOpGravada.textContent = `S/ ${totales.opGravada}`;
    if (ticketIgv) ticketIgv.textContent = `S/ ${totales.igv}`;
    if (ticketTotal) ticketTotal.textContent = `S/ ${totales.total}`;
  }

  // Listeners de actualización en tiempo real para todos los campos
  [inDocNumero, inClienteNombre, inClienteDireccion].forEach(el => {
    el?.addEventListener('input', actualizarTicketPreview);
    el?.addEventListener('change', actualizarTicketPreview);
  });

  // ════════════════════════════════════════════════════════════
  // 6. REGISTRAR COMPROBANTE EN SUNAT Y FIRESTORE
  // ════════════════════════════════════════════════════════════
  btnRegistrar?.addEventListener('click', async (e) => {
    e.preventDefault();
    const docNum = inDocNumero?.value?.trim();
    const nombre = inClienteNombre?.value?.trim();

    if (!docNum || !nombre) {
      Notificacion('Debes completar el N° de Documento y Nombre del cliente.', 'warning');
      if (!docNum) inDocNumero?.focus();
      else inClienteNombre?.focus();
      return;
    }

    if (tipoDocActual === 'factura' && docNum.length !== 11) {
      Notificacion('Para Factura (F001), el RUC debe tener 11 dígitos.', 'warning');
      inDocNumero?.focus();
      return;
    }

    if (itemsActuales.length === 0) {
      Notificacion('Debes agregar al menos 1 producto al comprobante.', 'warning');
      return;
    }

    const totales = calcularTotales(itemsActuales);
    wiSpin(btnRegistrar, true, 'Registrando...');

    try {
      const nuevoComprobante = guardarComprobante({
        tipo: tipoDocActual,
        cliente: {
          nombre: nombre,
          documentoTipo: inDocTipo?.value || (tipoDocActual === 'factura' ? 'RUC' : 'DNI'),
          documento: docNum,
          celular: inClienteCelular?.value?.trim() || '',
          direccion: inClienteDireccion?.value?.trim() || 'Surquillo, Lima',
          email: ''
        },
        items: [...itemsActuales],
        opGravada: totales.opGravada,
        igv: totales.igv,
        total: totales.total,
        metodoPago: selectMetodoPago?.value || 'Efectivo contra entrega',
        estado: selectEstado?.value || 'pagado',
        observacion: inObservacion?.value?.trim() || ''
      });

      Notificacion(`¡${tipoDocActual === 'factura' ? 'Factura' : 'Boleta'} ${nuevoComprobante.serieNumero} registrada con éxito!`, 'success');

      // Actualizar tabla e indicadores
      actualizarKpis();
      renderizarHistorial();

      // Limpiar formulario y avanzar correlativo
      if (inClienteBuscar) inClienteBuscar.value = '';
      if (inDocNumero) inDocNumero.value = '';
      if (inClienteNombre) inClienteNombre.value = '';
      if (inClienteCelular) inClienteCelular.value = '';
      if (inClienteDireccion) inClienteDireccion.value = '';
      if (inObservacion) inObservacion.value = '';

      // Resetear a balón 10kg estándar
      itemsActuales = [
        {
          id: 'balon-10kg',
          descripcion: 'Balón SOLGAS Premium 10 kg',
          cantidad: 1,
          precioUnitario: 65.00,
          subtotal: 65.00
        }
      ];
      renderizarTablaItems();
      cambiarTipoDoc(tipoDocActual);

    } catch (err) {
      console.error(err);
      Notificacion('Error al registrar comprobante.', 'error');
    } finally {
      wiSpin(btnRegistrar, false);
    }
  });

  // ════════════════════════════════════════════════════════════
  // 7. ACCIONES DEL TICKET (WHATSAPP E IMPRESIÓN)
  // ════════════════════════════════════════════════════════════
  btnTicketWhatsApp?.addEventListener('click', () => {
    const correlativo = obtenerSiguienteCorrelativo(tipoDocActual);
    const totales = calcularTotales(itemsActuales);
    const cel = inClienteCelular?.value?.replace(/\D/g, '') || '';

    const compMock = {
      tipo: tipoDocActual,
      serieNumero: correlativo.serieNumero,
      fechaEmision: formatearFecha(new Date()),
      cliente: {
        nombre: inClienteNombre?.value?.trim() || 'Estimado/a cliente',
        documentoTipo: inDocTipo?.value || 'DNI',
        documento: inDocNumero?.value?.trim() || ''
      },
      items: itemsActuales,
      opGravada: totales.opGravada,
      igv: totales.igv,
      total: totales.total,
      metodoPago: selectMetodoPago?.value || 'Efectivo'
    };

    const texto = generarMensajeWhatsApp(compMock);
    const url = cel 
      ? `https://wa.me/51${cel}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`;

    window.open(url, '_blank');
  });

  btnTicketImprimir?.addEventListener('click', () => {
    window.print();
  });

  // ════════════════════════════════════════════════════════════
  // 8. HISTORIAL Y KPIS
  // ════════════════════════════════════════════════════════════
  function actualizarKpis() {
    const lista = obtenerComprobantes();
    const boletas = lista.filter(c => c.serie === 'B001');
    const facturas = lista.filter(c => c.serie === 'F001');

    const totalFacturado = lista
      .filter(c => c.estado !== 'anulado')
      .reduce((acc, c) => acc + (parseFloat(c.total) || 0), 0);

    const totalIgv = lista
      .filter(c => c.estado !== 'anulado')
      .reduce((acc, c) => acc + (parseFloat(c.igv) || 0), 0);

    if (kpiTotalMes) kpiTotalMes.textContent = `S/ ${totalFacturado.toFixed(2)}`;
    if (kpiBoletas) kpiBoletas.textContent = String(boletas.length);
    if (kpiFacturas) kpiFacturas.textContent = String(facturas.length);
    if (kpiIgv) kpiIgv.textContent = `S/ ${totalIgv.toFixed(2)}`;
  }

  function renderizarHistorial() {
    if (!historyTableBody) return;
    const lista = obtenerComprobantes();

    let filtrados = lista.filter(c => {
      if (filtroHistorial === 'boleta') return c.serie === 'B001';
      if (filtroHistorial === 'factura') return c.serie === 'F001';
      if (filtroHistorial === 'pagado') return c.estado === 'pagado';
      if (filtroHistorial === 'pendiente') return c.estado === 'pendiente';
      return true;
    });

    if (busquedaHistorial.trim()) {
      const q = busquedaHistorial.toLowerCase().trim();
      filtrados = filtrados.filter(c =>
        c.serieNumero.toLowerCase().includes(q) ||
        (c.cliente?.nombre && c.cliente.nombre.toLowerCase().includes(q)) ||
        (c.cliente?.documento && c.cliente.documento.includes(q))
      );
    }

    if (historyTotalCount) {
      historyTotalCount.textContent = `${filtrados.length} ${filtrados.length === 1 ? 'comprobante' : 'comprobantes'}`;
    }

    if (filtrados.length === 0) {
      historyTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="sn-empty-history-cell">
            <i class="fa-solid fa-receipt sn-empty-history-icon"></i>
            No se encontraron comprobantes con el criterio seleccionado.
          </td>
        </tr>
      `;
      return;
    }

    historyTableBody.innerHTML = filtrados.map(c => {
      const isBoleta = c.serie === 'B001';
      const badgeClase = isBoleta ? 'boleta' : 'factura';
      const estadoClase = c.estado || 'pagado';

      return `
        <tr>
          <td>
            <span class="sn-doc-badge ${badgeClase}">${c.serieNumero}</span>
          </td>
          <td class="sn-history-date-cell">${c.fechaEmision || ''}</td>
          <td>
            <div class="sn-history-client-name">${c.cliente?.nombre || 'Cliente'}</div>
            <div class="sn-history-client-doc">${c.cliente?.documentoTipo || 'DOC'}: ${c.cliente?.documento || ''}</div>
          </td>
          <td class="sn-history-total-cell">
            S/ ${parseFloat(c.total).toFixed(2)}
          </td>
          <td class="sn-history-pago-cell">${c.metodoPago || 'Efectivo'}</td>
          <td>
            <span class="sn-status-badge ${estadoClase}">
              <i class="fa-solid ${estadoClase === 'pagado' ? 'fa-check' : estadoClase === 'pendiente' ? 'fa-clock' : 'fa-ban'}"></i>
              ${estadoClase.toUpperCase()}
            </span>
          </td>
          <td class="sn-history-actions-cell">
            <button type="button" class="sn-action-icon-btn sn-btn-row-ws" data-id="${c.id}" title="Enviar por WhatsApp">
              <i class="fa-brands fa-whatsapp sn-icon-ws"></i>
            </button>
            <button type="button" class="sn-action-icon-btn sn-btn-row-view" data-id="${c.id}" title="Cargar en visor de ticket">
              <i class="fa-solid fa-eye"></i>
            </button>
            <button type="button" class="sn-action-icon-btn sn-btn-row-anular" data-id="${c.id}" title="Anular comprobante">
              <i class="fa-solid fa-ban sn-icon-anular"></i>
            </button>
            <button type="button" class="sn-action-icon-btn btn-del sn-btn-row-del" data-id="${c.id}" title="Eliminar registro">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Listeners de acciones de tabla
    historyTableBody.querySelectorAll('.sn-btn-row-ws').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const c = filtrados.find(x => x.id === id);
        if (c) {
          const texto = generarMensajeWhatsApp(c);
          const cel = c.cliente?.celular?.replace(/\D/g, '') || '';
          const url = cel 
            ? `https://wa.me/51${cel}?text=${encodeURIComponent(texto)}`
            : `https://wa.me/?text=${encodeURIComponent(texto)}`;
          window.open(url, '_blank');
        }
      });
    });

    historyTableBody.querySelectorAll('.sn-btn-row-view').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const c = filtrados.find(x => x.id === id);
        if (c) {
          // Cargar en el ticket derecho
          if (ticketTipoBadge) ticketTipoBadge.textContent = c.serie === 'F001' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA';
          if (ticketSerieNumero) ticketSerieNumero.textContent = c.serieNumero;
          if (ticketFecha) ticketFecha.textContent = c.fechaEmision;
          if (ticketCliente) ticketCliente.textContent = c.cliente?.nombre || 'Cliente';
          if (ticketDocLabel) ticketDocLabel.textContent = c.cliente?.documentoTipo || 'DOC';
          if (ticketDoc) ticketDoc.textContent = c.cliente?.documento || '';
          if (ticketDireccion) ticketDireccion.textContent = c.cliente?.direccion || 'Surquillo';
          if (ticketPago) ticketPago.textContent = c.metodoPago || 'Efectivo';

          if (ticketItemsBody) {
            ticketItemsBody.innerHTML = c.items.map(it => `
              <tr>
                <td>${it.descripcion}</td>
                <td class="sn-text-center">${it.cantidad}</td>
                <td class="sn-text-right">S/ ${Number(it.subtotal).toFixed(2)}</td>
              </tr>
            `).join('');
          }

          if (ticketOpGravada) ticketOpGravada.textContent = `S/ ${c.opGravada}`;
          if (ticketIgv) ticketIgv.textContent = `S/ ${c.igv}`;
          if (ticketTotal) ticketTotal.textContent = `S/ ${c.total}`;

          window.scrollTo({ top: panel.offsetTop + 180, behavior: 'smooth' });
          Notificacion(`Visualizando comprobante ${c.serieNumero}.`, 'info');
        }
      });
    });

    historyTableBody.querySelectorAll('.sn-btn-row-anular').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const c = filtrados.find(x => x.id === id);
        if (!c) return;

        const conf = await wiConfirmar(`¿Deseas marcar como ANULADO el comprobante ${c.serieNumero}?`, {
          titulo: 'Anular Comprobante',
          tipo: 'alerta',
          siTexto: 'Sí, Anular'
        });

        if (conf) {
          anularComprobante(id);
          actualizarKpis();
          renderizarHistorial();
          Notificacion(`Comprobante ${c.serieNumero} anulado.`, 'warning');
        }
      });
    });

    historyTableBody.querySelectorAll('.sn-btn-row-del').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const c = filtrados.find(x => x.id === id);
        if (!c) return;

        const conf = await wiConfirmar(`¿Eliminar definitivamente el comprobante ${c.serieNumero}?`, {
          titulo: 'Eliminar Comprobante',
          tipo: 'danger',
          siTexto: 'Sí, Eliminar'
        });

        if (conf) {
          eliminarComprobante(id);
          actualizarKpis();
          renderizarHistorial();
          Notificacion(`Comprobante ${c.serieNumero} eliminado.`, 'info');
        }
      });
    });
  }

  // Filtros de Historial
  filterPillsWrap?.querySelectorAll('.sn-filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      filterPillsWrap.querySelectorAll('.sn-filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filtroHistorial = btn.getAttribute('data-filter') || 'todos';
      renderizarHistorial();
    });
  });

  searchInput?.addEventListener('input', (e) => {
    busquedaHistorial = e.target.value;
    renderizarHistorial();
  });

  // ════════════════════════════════════════════════════════════
  // 9. INICIALIZACIÓN
  // ════════════════════════════════════════════════════════════
  if (inFecha) inFecha.value = formatearFecha(new Date());
  inicializarWiSelects();
  cambiarTipoDoc('boleta');
  renderizarTablaItems();
  actualizarTicketPreview();
  actualizarKpis();
  renderizarHistorial();
  cargarClientesSmiles();
}
