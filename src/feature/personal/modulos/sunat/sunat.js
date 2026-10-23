// src/feature/personal/modulos/sunat/sunat.js
// 🎯 Controlador Frontend Autónomo del Módulo SUNAT
// Emisión ágil de Boletas (B001) y Facturas (F001) + Cálculo de IGV 18% + Ticket en Vivo + WhatsApp
// 100% JS Nativo · Integrado con @widev

import { Notificacion, wiSpin, wiConfirmar } from '@widev';
import {
  obtenerComprobantesLocal,
  emitirYGuardarComprobante,
  generarSiguienteCorrelativo,
  obtenerClientesSugerencias,
  sincronizarComprobantesFirestore,
  obtenerDatosEmisor,
  SERVICIOS_SUNAT_RAPIDOS
} from './dataSunat.js';

export function inicializarModuloSunat() {
  const panel = document.getElementById('panel-sunat');
  if (!panel || panel.dataset.sunatInit === 'true') return;
  panel.dataset.sunatInit = 'true';

  let tipoDocActual = 'boleta';
  let correlativoActual = generarSiguienteCorrelativo('boleta');

  // Ítem inicial por defecto: dinámico desde la semilla
  const primerItem = Array.isArray(SERVICIOS_SUNAT_RAPIDOS) && SERVICIOS_SUNAT_RAPIDOS[0];
  let itemsActuales = primerItem ? [
    {
      id: primerItem.id,
      descripcion: primerItem.descripcion,
      cantidad: 1,
      precioUnitario: primerItem.precioUnitario,
      subtotal: primerItem.precioUnitario
    }
  ] : [];

  // Elementos de la interfaz
  const selectTipoDoc = document.getElementById('snSelectTipoDoc');
  const inpSerieNumero = document.getElementById('snInpSerieNumero');
  const inpFechaEmision = document.getElementById('snInpFechaEmision');
  const btnTopBoleta = document.getElementById('btnSunatNuevaBoleta');
  const btnTopFactura = document.getElementById('btnSunatNuevaFactura');
  const btnRegistrar = document.getElementById('btnRegistrarComprobante');

  // Cliente
  const inpClienteBuscar = document.getElementById('snInpClienteBuscar');
  const selectDocTipo = document.getElementById('snSelectDocTipo');
  const inpDocNumero = document.getElementById('snInpDocNumero');
  const inpClienteCelular = document.getElementById('snInpClienteCelular');
  const inpClienteDireccion = document.getElementById('snClienteDireccion') || document.getElementById('snInpClienteDireccion');
  const dropdownClientes = document.getElementById('snDropdownClientes');

  // Ítems y Totales
  const quickButtonsWrap = document.getElementById('snQuickButtonsWrap');
  const itemsTableBody = document.getElementById('snItemsTableBody');
  const txtOpGravada = document.getElementById('snTxtOpGravada');
  const txtIgv = document.getElementById('snTxtIgv');
  const txtTotal = document.getElementById('snTxtTotal');
  const selectMetodoPago = document.getElementById('snSelectMetodoPago');
  const selectEstado = document.getElementById('snSelectEstado');
  const inpObservacion = document.getElementById('snInpObservacion');

  // Ticket Térmico en Vivo
  const ticketTipoBadge = document.getElementById('snTicketTipoBadge');
  const ticketSerieNumero = document.getElementById('snTicketSerieNumero');
  const ticketFecha = document.getElementById('snTicketFecha');
  const ticketCliente = document.getElementById('snTicketCliente');
  const ticketDocLbl = document.getElementById('snTicketDocLbl');
  const ticketDocVal = document.getElementById('snTicketDocVal');
  const ticketDir = document.getElementById('snTicketDir');
  const ticketItemsList = document.getElementById('snTicketItemsList');
  const ticketOpGravada = document.getElementById('snTicketOpGravada');
  const ticketIgv = document.getElementById('snTicketIgv');
  const ticketTotal = document.getElementById('snTicketTotal');
  const ticketObs = document.getElementById('snTicketObs');
  const btnImprimirTicket = document.getElementById('btnImprimirTicket');
  const btnEnviarWhatsAppTicket = document.getElementById('btnEnviarWhatsAppTicket');

  // KPIs
  const kpiTotalMes = document.getElementById('snKpiTotalMes');
  const kpiBoletas = document.getElementById('snKpiBoletas');
  const kpiFacturas = document.getElementById('snKpiFacturas');
  const kpiClientes = document.getElementById('snKpiClientes');
  const tableHistorialBody = document.getElementById('snTableHistorialBody');
  const btnExportarCsv = document.getElementById('btnExportarCsvSunat');

  // 1. CÁLCULO DE TOTALES
  function calcularTotales() {
    let total = 0;
    itemsActuales.forEach(item => {
      total += (Number(item.cantidad) || 0) * (Number(item.precioUnitario) || 0);
    });
    total = Math.round(total * 100) / 100;
    const opGravada = Math.round((total / 1.18) * 100) / 100;
    const igv = Math.round((total - opGravada) * 100) / 100;

    return { total, opGravada, igv };
  }

  // 2. ACTUALIZACIÓN DEL TICKET EN VIVO
  function actualizarTicket() {
    const { total, opGravada, igv } = calcularTotales();
    const esFactura = tipoDocActual === 'factura';

    if (ticketTipoBadge) ticketTipoBadge.textContent = esFactura ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA';
    if (ticketSerieNumero) ticketSerieNumero.textContent = correlativoActual.serieNumero;
    if (ticketFecha) ticketFecha.textContent = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
    if (ticketCliente) ticketCliente.textContent = inpClienteBuscar?.value.trim() || 'Cliente General';
    if (ticketDocLbl) ticketDocLbl.textContent = (selectDocTipo?.value || (esFactura ? 'RUC' : 'DNI')) + ':';
    if (ticketDocVal) ticketDocVal.textContent = inpDocNumero?.value.trim() || '--------';
    if (ticketDir) ticketDir.textContent = inpClienteDireccion?.value.trim() || '-';

    if (ticketItemsList) {
      ticketItemsList.innerHTML = itemsActuales.map(item => `
        <div class="sn-ti-item-row">
          <div class="sn-tii-desc">${item.cantidad}x ${item.descripcion}</div>
          <div class="sn-tii-sub">S/ ${(item.cantidad * item.precioUnitario).toFixed(2)}</div>
        </div>
      `).join('');
    }

    if (txtOpGravada) txtOpGravada.textContent = `S/ ${opGravada.toFixed(2)}`;
    if (txtIgv) txtIgv.textContent = `S/ ${igv.toFixed(2)}`;
    if (txtTotal) txtTotal.textContent = `S/ ${total.toFixed(2)}`;

    if (ticketOpGravada) ticketOpGravada.textContent = `S/ ${opGravada.toFixed(2)}`;
    if (ticketIgv) ticketIgv.textContent = `S/ ${igv.toFixed(2)}`;
    if (ticketTotal) ticketTotal.textContent = `S/ ${total.toFixed(2)}`;
    if (ticketObs) ticketObs.textContent = inpObservacion?.value.trim() || 'Comprobante emitido conforme a las normas de SUNAT.';
  }

  // 3. RENDERIZADOR DE LA TABLA DE ÍTEMS EN EL FORMULARIO
  function renderizarTablaItems() {
    if (!itemsTableBody) return;
    itemsTableBody.innerHTML = itemsActuales.map((item, idx) => `
      <tr data-index="${idx}">
        <td class="sn-col-desc">
          <input type="text" class="sn-table-inp sn-inp-item-desc" value="${item.descripcion}" data-idx="${idx}" />
        </td>
        <td class="sn-col-qty">
          <input type="number" min="1" class="sn-table-inp sn-inp-item-qty" value="${item.cantidad}" data-idx="${idx}" style="width: 60px;" />
        </td>
        <td class="sn-col-price">
          <input type="number" step="1" min="0" class="sn-table-inp sn-inp-item-price" value="${item.precioUnitario}" data-idx="${idx}" style="width: 80px;" />
        </td>
        <td class="sn-col-total">
          <strong>S/ ${(item.cantidad * item.precioUnitario).toFixed(2)}</strong>
        </td>
        <td class="sn-col-action">
          <button type="button" class="sn-btn-remove-item" data-idx="${idx}" title="Quitar ítem">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');

    actualizarTicket();
  }

  // 4. CAMBIO DE TIPO DE COMPROBANTE (BOLETA / FACTURA)
  function cambiarTipo(tipo) {
    tipoDocActual = tipo;
    correlativoActual = generarSiguienteCorrelativo(tipo);
    if (selectTipoDoc) selectTipoDoc.value = tipo;
    if (inpSerieNumero) inpSerieNumero.value = correlativoActual.serieNumero;
    if (selectDocTipo) selectDocTipo.value = tipo === 'factura' ? 'RUC' : 'DNI';
    actualizarTicket();
  }

  if (selectTipoDoc) {
    selectTipoDoc.addEventListener('change', (e) => cambiarTipo(e.target.value));
  }
  if (btnTopBoleta) btnTopBoleta.addEventListener('click', () => cambiarTipo('boleta'));
  if (btnTopFactura) btnTopFactura.addEventListener('click', () => cambiarTipo('factura'));

  // 5. BOTONES RÁPIDOS DE SERVICIOS CONTABLES (1 CLIC)
  if (quickButtonsWrap) {
    quickButtonsWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('.sn-quick-btn');
      if (!btn) return;
      const id = btn.getAttribute('data-prod-id');
      const desc = btn.getAttribute('data-prod-desc');
      const price = parseFloat(btn.getAttribute('data-prod-price') || 0);

      // Si ya existe el ítem, aumentamos cantidad
      const existente = itemsActuales.find(i => i.id === id);
      if (existente) {
        existente.cantidad += 1;
        existente.subtotal = existente.cantidad * existente.precioUnitario;
      } else {
        itemsActuales.push({
          id,
          descripcion: desc,
          cantidad: 1,
          precioUnitario: price,
          subtotal: price
        });
      }
      renderizarTablaItems();
      Notificacion(`Añadido: ${desc}`, 'info', 1500);
    });
  }

  // 6. EVENTOS DENTRO DE LA TABLA DE ÍTEMS
  if (itemsTableBody) {
    itemsTableBody.addEventListener('input', (e) => {
      const idx = parseInt(e.target.getAttribute('data-idx'), 10);
      if (isNaN(idx) || !itemsActuales[idx]) return;

      if (e.target.classList.contains('sn-inp-item-desc')) {
        itemsActuales[idx].descripcion = e.target.value;
      } else if (e.target.classList.contains('sn-inp-item-qty')) {
        itemsActuales[idx].cantidad = Math.max(1, parseInt(e.target.value || 1, 10));
      } else if (e.target.classList.contains('sn-inp-item-price')) {
        itemsActuales[idx].precioUnitario = Math.max(0, parseFloat(e.target.value || 0));
      }
      itemsActuales[idx].subtotal = itemsActuales[idx].cantidad * itemsActuales[idx].precioUnitario;
      actualizarTicket();
    });

    itemsTableBody.addEventListener('click', (e) => {
      const btnRemove = e.target.closest('.sn-btn-remove-item');
      if (!btnRemove) return;
      const idx = parseInt(btnRemove.getAttribute('data-idx'), 10);
      if (itemsActuales.length <= 1) {
        Notificacion('El comprobante debe tener al menos un ítem.', 'warning', 2500);
        return;
      }
      itemsActuales.splice(idx, 1);
      renderizarTablaItems();
    });
  }

  // 7. AUTOCOMPLETADO DE CLIENTES CONTABLES
  if (inpClienteBuscar && dropdownClientes) {
    const listaSugerencias = obtenerClientesSugerencias();

    inpClienteBuscar.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      actualizarTicket();
      if (!q) {
        dropdownClientes.style.display = 'none';
        return;
      }

      const coincidencias = listaSugerencias.filter(c =>
        (c.nombre || '').toLowerCase().includes(q) ||
        (c.documento || '').includes(q)
      );

      if (coincidencias.length === 0) {
        dropdownClientes.style.display = 'none';
        return;
      }

      dropdownClientes.innerHTML = coincidencias.map(c => `
        <div class="sn-dropdown-item" data-id="${c.id}">
          <div class="sn-di-name">${c.nombre}</div>
          <div class="sn-di-sub">${c.documentoTipo || 'RUC'}: ${c.documento}${c.regimenTributario ? ' · ' + c.regimenTributario : ''}</div>
        </div>
      `).join('');
      dropdownClientes.style.display = 'block';
    });

    dropdownClientes.addEventListener('click', (e) => {
      const item = e.target.closest('.sn-dropdown-item');
      if (!item) return;
      const id = item.getAttribute('data-id');
      const c = listaSugerencias.find(cli => cli.id === id);
      if (c) {
        inpClienteBuscar.value = c.nombre;
        if (selectDocTipo) selectDocTipo.value = c.documentoTipo || 'RUC';
        if (inpDocNumero) inpDocNumero.value = c.documento || '';
        if (inpClienteCelular) inpClienteCelular.value = c.celular || '';
        if (inpClienteDireccion) inpClienteDireccion.value = c.direccion || '';

        // Si es RUC de 11 dígitos y empieza con 20 o 10, cambiar automáticamente a Factura si el usuario lo prefiere
        if ((c.documento || '').length === 11 && (c.documento.startsWith('20') || c.documentoTipo === 'RUC')) {
          cambiarTipo('factura');
        }
      }
      dropdownClientes.style.display = 'none';
      actualizarTicket();
    });

    document.addEventListener('click', (e) => {
      if (!inpClienteBuscar.contains(e.target) && !dropdownClientes.contains(e.target)) {
        dropdownClientes.style.display = 'none';
      }
    });
  }

  // Sincronizar inputs en vivo al ticket
  [inpDocNumero, selectDocTipo, inpClienteDireccion, inpObservacion].forEach(el => {
    if (el) el.addEventListener('input', actualizarTicket);
  });

  // 8. RENDERIZADOR DEL HISTORIAL Y KPIS
  function renderizarHistorial() {
    const lista = obtenerComprobantesLocal();
    let totalMes = 0;
    let bCount = 0;
    let fCount = 0;
    const clientesUnicos = new Set();

    lista.forEach(c => {
      totalMes += Number(c.total || 0);
      if (c.serie?.startsWith('B')) bCount++;
      if (c.serie?.startsWith('F')) fCount++;
      if (c.cliente?.documento) clientesUnicos.add(c.cliente.documento);
    });

    if (kpiTotalMes) kpiTotalMes.textContent = `S/ ${totalMes.toFixed(2)}`;
    if (kpiBoletas) kpiBoletas.textContent = bCount;
    if (kpiFacturas) kpiFacturas.textContent = fCount;
    if (kpiClientes) kpiClientes.textContent = clientesUnicos.size || lista.length;

    if (!tableHistorialBody) return;
    if (lista.length === 0) {
      tableHistorialBody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 30px; color: var(--tx2);">No hay comprobantes emitidos aún.</td></tr>`;
      return;
    }

    tableHistorialBody.innerHTML = lista.map(c => `
      <tr>
        <td><strong>${c.serieNumero || `${c.serie}-${c.numero}`}</strong></td>
        <td><span class="sn-badge-tipo ${c.tipo}">${c.tipo.toUpperCase()}</span></td>
        <td>${c.fechaEmision || ''}</td>
        <td>${c.cliente?.nombre || 'Cliente General'}</td>
        <td>${c.cliente?.documento || '-'}</td>
        <td><strong>S/ ${Number(c.total || 0).toFixed(2)}</strong></td>
        <td>${c.metodoPago || 'Transferencia'}</td>
        <td><span class="sn-badge-status ${c.estado || 'pagado'}">${(c.estado || 'pagado').toUpperCase()}</span></td>
        <td>
          <button type="button" class="sn-btn-row-action btn-row-wa" data-id="${c.id}" title="Enviar por WhatsApp">
            <i class="fa-brands fa-whatsapp"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  // 9. EMISIÓN DEL COMPROBANTE
  if (btnRegistrar) {
    btnRegistrar.addEventListener('click', async (e) => {
      e.preventDefault();

      const clienteNombre = inpClienteBuscar?.value.trim();
      const docNumero = inpDocNumero?.value.trim();

      if (!clienteNombre) {
        Notificacion('Ingresa el nombre o razón social del cliente.', 'warning', 3000);
        inpClienteBuscar?.focus();
        return;
      }
      if (!docNumero) {
        Notificacion('Ingresa el número de DNI o RUC del cliente.', 'warning', 3000);
        inpDocNumero?.focus();
        return;
      }

      const { total } = calcularTotales();
      if (total <= 0) {
        Notificacion('El total del comprobante debe ser mayor a 0.', 'warning', 3000);
        return;
      }

      btnRegistrar.disabled = true;
      wiSpin(btnRegistrar, true);

      try {
        const payload = {
          tipo: tipoDocActual,
          cliente: {
            nombre: clienteNombre,
            documentoTipo: selectDocTipo?.value || (tipoDocActual === 'factura' ? 'RUC' : 'DNI'),
            documento: docNumero,
            celular: inpClienteCelular?.value.trim() || '',
            direccion: inpClienteDireccion?.value.trim() || ''
          },
          items: itemsActuales,
          total,
          metodoPago: selectMetodoPago?.value || 'Transferencia BCP',
          observacion: inpObservacion?.value.trim() || ''
        };

        const nuevo = await emitirYGuardarComprobante(payload);
        renderizarHistorial();
        Notificacion(`Comprobante ${nuevo.serieNumero} emitido y registrado con éxito.`, 'success', 3500);

        // Actualizar siguiente correlativo
        cambiarTipo(tipoDocActual);
      } catch (err) {
        Notificacion('Error al emitir el comprobante.', 'error', 3500);
      } finally {
        wiSpin(btnRegistrar, false);
        btnRegistrar.disabled = false;
      }
    });
  }

  // 10. BOTONES DE ACCIÓN DEL TICKET (IMPRIMIR Y WHATSAPP)
  if (btnImprimirTicket) {
    btnImprimirTicket.addEventListener('click', () => {
      window.print();
    });
  }

  if (btnEnviarWhatsAppTicket) {
    btnEnviarWhatsAppTicket.addEventListener('click', () => {
      const cel = (inpClienteCelular?.value || '').replace(/\D/g, '');
      const cliente = inpClienteBuscar?.value.trim() || 'Estimado/a cliente';
      const { total } = calcularTotales();
      const emisor = obtenerDatosEmisor();

      const itemsTxt = itemsActuales.map(i => `• ${i.cantidad}x ${i.descripcion} (S/ ${(i.cantidad * i.precioUnitario).toFixed(2)})`).join('\n');
      const nombreMarca = emisor.nombreComercial || emisor.razonSocial || 'nuestro equipo';
      const subEsp = emisor.razonSocial && emisor.nombreComercial ? ` (${emisor.razonSocial})` : '';
      const mensaje = `Hola *${cliente}*, te saludamos de *${nombreMarca}*${subEsp}.\n\nAdjuntamos la constancia de tu *${tipoDocActual === 'factura' ? 'Factura' : 'Boleta'} Electrónica ${correlativoActual.serieNumero}*:\n\n${itemsTxt}\n\n*Total Pagado:* S/ ${total.toFixed(2)}\n\n¡Muchas gracias por su preferencia!`;

      const numDestino = cel.length >= 9 ? (cel.startsWith('51') ? cel : `51${cel}`) : '';
      const url = numDestino
        ? `https://wa.me/${numDestino}?text=${encodeURIComponent(mensaje)}`
        : `https://wa.me/?text=${encodeURIComponent(mensaje)}`;

      window.open(url, '_blank');
    });
  }

  // Inicializar vistas
  renderizarTablaItems();
  renderizarHistorial();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarModuloSunat);
  } else {
    inicializarModuloSunat();
  }
}

export default { inicializarModuloSunat };
