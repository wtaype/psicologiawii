// src/feature/personal/modulos/correo/correo.js
// 🎯 Controlador Frontend Autónomo del Módulo Correo (Solgas Surquillo)
// Experiencia Hotmail / Outlook: 3 Paneles (Carpetas, Lista de Mensajes, Visor/Redactor)
// Markdown Live Editor + Previsualización en Tiempo Real + Sincronización Firestore y Resend

import { Notificacion, wiSpin, adrm } from '@widev';
import {
  enviarCorreo,
  obtenerCorreos,
  sincronizarCorreosDesdeFirestore,
  obtenerAjustesCorreo,
  guardarAjustesCorreo,
  obtenerRecibidos,
  marcarCorreoLeido,
  obtenerBorradores,
  guardarBorrador,
  eliminarBorrador,
  eliminarCorreoPorCarpeta,
  limpiarEmail
} from './dataCorreo.js';
import {
  generarPlantillaPedido,
  generarPlantillaComprobante,
  generarPlantillaCotizacion,
  generarPlantillaLibre
} from './plantillas.js';
import { obtenerDatosNegocio } from '../negocio/dataNegocio.js';

export function inicializarModuloCorreo() {
  const panel = document.getElementById('panel-correo');
  if (!panel || panel.dataset.correoInit === 'true') return;
  panel.dataset.correoInit = 'true';

  let carpetaActiva = 'recibidos';
  let mensajeActivo = null;
  let plantillaSeleccionada = 'pedido';
  let isSending = false;
  let liveDebounceTimer = null;

  // ── Elementos del Sidebar y Navegación de Carpetas ──
  const folderNav = document.getElementById('crFolderNav');
  const btnTopRedactar = document.getElementById('btnTopRedactar');
  const btnSidebarRedactar = document.getElementById('btnSidebarRedactar');
  const badgeRecibidos = document.getElementById('badgeRecibidosCount');
  const badgeEnviados = document.getElementById('badgeEnviadosCount');
  const badgeBorradores = document.getElementById('badgeBorradoresCount');
  const badgeRemitente = document.getElementById('crBadgeRemitenteActivo');

  // ── Elementos de Lista de Correos (Pane 2) ──
  const titleFolder = document.getElementById('crCurrentFolderTitle');
  const countFolder = document.getElementById('crFolderTotalCount');
  const searchInput = document.getElementById('crSearchInput');
  const messageList = document.getElementById('crMessageList');

  // ── Paneles de la Vista Principal (Pane 3) ──
  const viewReading = document.getElementById('crViewReading');
  const viewComposer = document.getElementById('crViewComposer');
  const viewSettings = document.getElementById('crViewSettings');

  // ── Elementos de Lectura ──
  const readSubject = document.getElementById('crReadSubject');
  const readFrom = document.getElementById('crReadFrom');
  const readTo = document.getElementById('crReadTo');
  const readDate = document.getElementById('crReadDate');
  const readAvatar = document.getElementById('crReadAvatar');
  const readFrame = document.getElementById('crReadFrame');
  const btnReply = document.getElementById('btnReplyMsg');
  const btnForward = document.getElementById('btnForwardMsg');
  const btnDelete = document.getElementById('btnDeleteMsg');
  const btnOpenWindow = document.getElementById('btnOpenWindowMsg');

  // ── Elementos de Redacción (Composer) ──
  const formComposer = document.getElementById('formEnviarCorreo');
  const hiddenTipo = document.getElementById('crSelectTipo');
  const inputTo = document.getElementById('crInputTo');
  const inputNombre = document.getElementById('crInputNombre');
  const inputCc = document.getElementById('crInputCc');
  const wrapCc = document.getElementById('crWrapCc');
  const btnToggleCc = document.getElementById('btnToggleCc');
  const inputSubject = document.getElementById('crInputSubject');
  const textMarkdown = document.getElementById('crTextMarkdown');
  const btnResetPlantilla = document.getElementById('btnResetPlantilla');
  const btnSaveDraft = document.getElementById('btnGuardarBorrador');
  const btnEnviar = document.getElementById('btnEnviarCorreo');
  const btnTabEditor = document.getElementById('btnTabEditor');
  const btnTabPreview = document.getElementById('btnTabPreview');
  const composerFormWrap = document.getElementById('crComposerFormWrap');
  const composerPreviewWrap = document.getElementById('crComposerPreviewWrap');
  const pillsWrap = document.getElementById('crPillsCategorias');
  const wordsCounter = document.getElementById('crLiveWordsCount');

  // Cajas dinámicas por categoría
  const boxPedido = document.getElementById('crFieldsPedido');
  const boxComprobante = document.getElementById('crFieldsComprobante');
  const boxCotizacion = document.getElementById('crFieldsCotizacion');

  const inPedNumero = document.getElementById('crPedNumero');
  const inPedPrecio = document.getElementById('crPedPrecio');
  const inPedProducto = document.getElementById('crPedProducto');
  const inPedPago = document.getElementById('crPedPago');
  const inPedDireccion = document.getElementById('crPedDireccion');

  const inCompTipo = document.getElementById('crCompTipo');
  const inCompSerie = document.getElementById('crCompSerie');
  const inCompMonto = document.getElementById('crCompMonto');
  const inCompDoc = document.getElementById('crCompDoc');

  const inCotNumero = document.getElementById('crCotNumero');
  const inCotEmpresa = document.getElementById('crCotEmpresa');
  const inCotValidez = document.getElementById('crCotValidez');

  // Live Preview Elements
  const liveFrame = document.getElementById('crLiveFrame');
  const frameWrap = document.getElementById('crFrameWrap');
  const deviceButtons = document.querySelectorAll('.cr-device-btn');

  // Ajustes de Emisor
  const formAjustes = document.getElementById('formAjustesCorreo');
  const inputAjusteNombre = document.getElementById('crAjusteNombre');
  const inputAjusteEmail = document.getElementById('crAjusteEmail');
  const inputAjusteReplyTo = document.getElementById('crAjusteReplyTo');

  // ════════════════════════════════════════════════════════════
  // 1. CARGA DE AJUSTES Y BADGES
  // ════════════════════════════════════════════════════════════
  function cargarAjustes() {
    const aj = obtenerAjustesCorreo();
    if (inputAjusteNombre) inputAjusteNombre.value = aj.remitenteNombre || 'Solgas Surquillo';
    if (inputAjusteEmail) inputAjusteEmail.value = aj.remitenteEmail || 'pedidos@solgassurquillo.com';
    if (inputAjusteReplyTo) inputAjusteReplyTo.value = aj.responderA || aj.remitenteEmail || 'pedidos@solgassurquillo.com';
    if (badgeRemitente) badgeRemitente.textContent = aj.remitenteEmail || 'pedidos@solgassurquillo.com';
  }

  function actualizarBadges() {
    const recs = obtenerRecibidos();
    const envs = obtenerCorreos();
    const bors = obtenerBorradores();

    const noLeidos = recs.filter(r => !r.leido).length;
    if (badgeRecibidos) {
      badgeRecibidos.textContent = String(recs.length);
      badgeRecibidos.className = noLeidos > 0 ? 'cr-folder-badge highlight' : 'cr-folder-badge';
    }
    if (badgeEnviados) badgeEnviados.textContent = String(envs.length);
    if (badgeBorradores) badgeBorradores.textContent = String(bors.length);
  }

  // ════════════════════════════════════════════════════════════
  // 2. NAVEGACIÓN Y CAMBIO DE VISTAS (PANE 3)
  // ════════════════════════════════════════════════════════════
  function mostrarVista(vista) {
    if (viewReading) viewReading.style.display = vista === 'reading' ? 'flex' : 'none';
    if (viewComposer) viewComposer.style.display = vista === 'composer' ? 'flex' : 'none';
    if (viewSettings) viewSettings.style.display = vista === 'settings' ? 'flex' : 'none';
  }

  function switchComposerTab(tab = 'editor') {
    btnTabEditor?.classList.toggle('active', tab === 'editor');
    btnTabPreview?.classList.toggle('active', tab === 'preview');
    if (composerFormWrap) composerFormWrap.style.display = tab === 'editor' ? 'block' : 'none';
    if (composerPreviewWrap) composerPreviewWrap.style.display = tab === 'preview' ? 'block' : 'none';
    if (tab === 'preview') {
      renderizarLivePreview();
    }
  }

  btnTabEditor?.addEventListener('click', () => switchComposerTab('editor'));
  btnTabPreview?.addEventListener('click', () => switchComposerTab('preview'));

  function abrirRedactor(datosPrecargados = null) {
    mostrarVista('composer');
    switchComposerTab('editor');

    if (datosPrecargados) {
      if (inputTo) inputTo.value = datosPrecargados.para || '';
      if (inputNombre) inputNombre.value = datosPrecargados.nombre || '';
      if (inputSubject) inputSubject.value = datosPrecargados.asunto || '';
      if (textMarkdown) textMarkdown.value = datosPrecargados.markdown || '';
      if (datosPrecargados.plantilla) {
        seleccionarPlantilla(datosPrecargados.plantilla, false);
      }
    }

    renderizarLivePreview();
  }

  btnTopRedactar?.addEventListener('click', () => abrirRedactor());
  btnSidebarRedactar?.addEventListener('click', () => abrirRedactor());

  // ════════════════════════════════════════════════════════════
  // 3. RENDERIZADO DE MENSAJES EN PANE 2
  // ════════════════════════════════════════════════════════════
  function obtenerMensajesDeCarpeta(folder) {
    if (folder === 'recibidos') return obtenerRecibidos();
    if (folder === 'enviados') return obtenerCorreos();
    if (folder === 'borradores') return obtenerBorradores();
    return [];
  }

  function renderizarListaMensajes(filtroBusqueda = '') {
    if (!messageList) return;

    let items = obtenerMensajesDeCarpeta(carpetaActiva);

    if (filtroBusqueda.trim()) {
      const q = filtroBusqueda.toLowerCase().trim();
      items = items.filter(m => {
        const dest = m.destinatario?.para || m.destinatario?.nombre || '';
        const rem = m.remitente?.desde || '';
        const asu = m.mensaje?.asunto || '';
        const res = m.mensaje?.resumen || '';
        return dest.toLowerCase().includes(q) || rem.toLowerCase().includes(q) || asu.toLowerCase().includes(q) || res.toLowerCase().includes(q);
      });
    }

    if (countFolder) {
      countFolder.textContent = `${items.length} ${items.length === 1 ? 'correo' : 'correos'}`;
    }

    if (items.length === 0) {
      messageList.innerHTML = `
        <div class="cr-empty-box">
          <i class="fa-solid fa-folder-open cr-empty-icon"></i>
          <p style="margin:0; font-size:13px; font-weight:600;">No hay correos en esta carpeta</p>
          <span style="font-size:11.5px;">Los mensajes aparecerán aquí automáticamente.</span>
        </div>
      `;
      return;
    }

    messageList.innerHTML = items.map((m) => {
      const isUnread = carpetaActiva === 'recibidos' && !m.leido;
      const isActive = mensajeActivo && mensajeActivo.id === m.id;
      const emisor = carpetaActiva === 'recibidos'
        ? (m.remitente?.desde || 'Remitente').split('<')[0].trim()
        : (m.destinatario?.nombre || m.destinatario?.para || 'Cliente');

      const inicial = emisor.charAt(0).toUpperCase() || 'S';
      const tipo = m.mensaje?.tipo || 'pedido';
      const tagClase = `tag-${tipo}`;
      const asunto = m.mensaje?.asunto || 'Sin asunto';
      const resumen = m.mensaje?.resumen || '';
      const fecha = m.fecha || 'Reciente';

      let avatarClase = 'cr-msg-avatar';
      if (tipo === 'comprobante') avatarClase += ' green';
      else if (tipo === 'cotizacion') avatarClase += ' blue';
      else if (tipo === 'general') avatarClase += ' purple';

      return `
        <div class="cr-msg-item ${isUnread ? 'unread' : ''} ${isActive ? 'active' : ''}" data-msg-id="${m.id}">
          <div class="cr-msg-top-row">
            <div class="cr-msg-from-wrap">
              <div class="${avatarClase}">${inicial}</div>
              <span class="cr-msg-from">${emisor}</span>
            </div>
            <span class="cr-msg-date">${fecha}</span>
          </div>

          <div class="cr-msg-subject">${asunto}</div>
          <div class="cr-msg-snippet">${resumen}</div>

          <div class="cr-msg-footer">
            <span class="cr-msg-tag ${tagClase}">${tipo.toUpperCase()}</span>
            <button type="button" class="cr-msg-btn-del" data-del-id="${m.id}" title="Eliminar correo">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Listeners para selección de correo
    messageList.querySelectorAll('.cr-msg-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if ((e.target).closest('.cr-msg-btn-del')) return;
        const id = el.getAttribute('data-msg-id');
        const msg = items.find(x => x.id === id);
        if (msg) abrirLecturaCorreo(msg);
      });
    });

    // Listeners para eliminar correo
    messageList.querySelectorAll('.cr-msg-btn-del').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-del-id');
        eliminarCorreoPorCarpeta(id, carpetaActiva);
        actualizarBadges();
        renderizarListaMensajes(searchInput?.value || '');
        if (mensajeActivo && mensajeActivo.id === id) {
          mostrarVista('composer');
          mensajeActivo = null;
        }
        Notificacion({ msg: 'Correo eliminado de la carpeta.', tipo: 'info' });
      });
    });
  }

  // ════════════════════════════════════════════════════════════
  // 4. LECTURA DE UN CORREO (PANE 3)
  // ════════════════════════════════════════════════════════════
  function abrirLecturaCorreo(msg) {
    mensajeActivo = msg;

    if (carpetaActiva === 'recibidos' && !msg.leido) {
      marcarCorreoLeido(msg.id);
      actualizarBadges();
    }

    // Actualizar clase activa en la lista
    messageList?.querySelectorAll('.cr-msg-item').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-msg-id') === msg.id);
      if (el.getAttribute('data-msg-id') === msg.id) el.classList.remove('unread');
    });

    if (readSubject) readSubject.textContent = msg.mensaje?.asunto || 'Sin Asunto';
    if (readFrom) readFrom.textContent = msg.remitente?.desde || 'Solgas Surquillo <pedidos@solgassurquillo.com>';
    if (readTo) readTo.textContent = `Para: ${msg.destinatario?.para || 'Cliente'}`;
    if (readDate) readDate.textContent = msg.fecha || 'Reciente';

    const emisorNombre = (msg.remitente?.desde || 'S').charAt(0).toUpperCase();
    if (readAvatar) readAvatar.textContent = emisorNombre;

    // Inyectar HTML en iframe de lectura
    if (readFrame && readFrame.contentWindow) {
      const doc = readFrame.contentWindow.document;
      doc.open();
      doc.write(msg.mensaje?.html || `<p style="font-family:sans-serif; padding:20px;">${msg.mensaje?.resumen || ''}</p>`);
      doc.close();
    }

    mostrarVista('reading');
  }

  // Botón Responder
  btnReply?.addEventListener('click', () => {
    if (!mensajeActivo) return;
    const destino = mensajeActivo.remitente?.responderA || mensajeActivo.remitente?.desde || '';
    const asunto = mensajeActivo.mensaje?.asunto ? `Re: ${mensajeActivo.mensaje.asunto.replace(/^Re:\s*/i, '')}` : '';
    abrirRedactor({
      para: limpiarEmail(destino),
      asunto: asunto,
      plantilla: 'libre',
      markdown: `\n\n--- \n*En respuesta a:* ${mensajeActivo.remitente?.desde || ''}\n*Fecha:* ${mensajeActivo.fecha || ''}`
    });
  });

  // Botón Reenviar
  btnForward?.addEventListener('click', () => {
    if (!mensajeActivo) return;
    const asunto = mensajeActivo.mensaje?.asunto ? `Fwd: ${mensajeActivo.mensaje.asunto.replace(/^Fwd:\s*/i, '')}` : '';
    abrirRedactor({
      asunto: asunto,
      plantilla: 'libre',
      markdown: `\n\n--- Mensaje reenviado ---\n**De:** ${mensajeActivo.remitente?.desde || ''}\n**Fecha:** ${mensajeActivo.fecha || ''}\n**Asunto:** ${mensajeActivo.mensaje?.asunto || ''}`
    });
  });

  // Botón Eliminar en lectura
  btnDelete?.addEventListener('click', () => {
    if (!mensajeActivo) return;
    eliminarCorreoPorCarpeta(mensajeActivo.id, carpetaActiva);
    actualizarBadges();
    renderizarListaMensajes(searchInput?.value || '');
    mostrarVista('composer');
    mensajeActivo = null;
    Notificacion({ msg: 'Correo eliminado.', tipo: 'info' });
  });

  // Botón Abrir en ventana nueva
  btnOpenWindow?.addEventListener('click', () => {
    if (!mensajeActivo) return;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(mensajeActivo.mensaje?.html || '');
      win.document.close();
    }
  });

  // ════════════════════════════════════════════════════════════
  // 5. CONTROL DE CARPETAS Y SIDEBAR
  // ════════════════════════════════════════════════════════════
  function cambiarCarpeta(folder) {
    carpetaActiva = folder;
    mensajeActivo = null;

    folderNav?.querySelectorAll('.cr-folder-item').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-folder') === folder);
    });

    if (folder === 'ajustes') {
      if (titleFolder) titleFolder.innerHTML = `<i class="fa-solid fa-sliders"></i> Ajustes de Emisor`;
      mostrarVista('settings');
      if (messageList) {
        messageList.innerHTML = `
          <div class="cr-empty-box">
            <i class="fa-solid fa-gear cr-empty-icon"></i>
            <p style="margin:0; font-size:13px; font-weight:600;">Configuración de Correo</p>
            <span style="font-size:11.5px;">Parámetros de salida de pedidos@solgassurquillo.com</span>
          </div>
        `;
      }
      return;
    }

    if (folder === 'plantillas') {
      if (titleFolder) titleFolder.innerHTML = `<i class="fa-solid fa-tags"></i> Plantillas Oficiales`;
      abrirRedactor();
      return;
    }

    let titulo = 'Bandeja de entrada';
    let icono = 'fa-inbox';
    if (folder === 'enviados') {
      titulo = 'Elementos enviados';
      icono = 'fa-paper-plane';
    } else if (folder === 'borradores') {
      titulo = 'Borradores';
      icono = 'fa-file-lines';
    }

    if (titleFolder) titleFolder.innerHTML = `<i class="fa-solid ${icono}"></i> ${titulo}`;
    renderizarListaMensajes(searchInput?.value || '');

    const msgs = obtenerMensajesDeCarpeta(folder);
    if (msgs.length > 0) {
      abrirLecturaCorreo(msgs[0]);
    } else {
      mostrarVista('composer');
    }
  }

  folderNav?.querySelectorAll('.cr-folder-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const f = btn.getAttribute('data-folder');
      if (f) cambiarCarpeta(f);
    });
  });

  searchInput?.addEventListener('input', (e) => {
    renderizarListaMensajes((e.target).value);
  });

  // ════════════════════════════════════════════════════════════
  // 6. REDACTOR Y PLANTILLAS
  // ════════════════════════════════════════════════════════════
  btnToggleCc?.addEventListener('click', () => {
    if (!wrapCc) return;
    const isHidden = wrapCc.style.display === 'none';
    wrapCc.style.display = isHidden ? 'block' : 'none';
    if (btnToggleCc) {
      btnToggleCc.innerHTML = isHidden 
        ? '<i class="fa-solid fa-minus"></i> Quitar copia CC' 
        : '<i class="fa-solid fa-plus"></i> Añadir copia CC';
    }
  });

  function seleccionarPlantilla(tipo, sobrescribirTextos = true) {
    plantillaSeleccionada = tipo;
    if (hiddenTipo) hiddenTipo.value = tipo;

    pillsWrap?.querySelectorAll('.cr-pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-template') === tipo);
    });

    if (boxPedido) boxPedido.style.display = tipo === 'pedido' ? 'block' : 'none';
    if (boxComprobante) boxComprobante.style.display = tipo === 'comprobante' ? 'block' : 'none';
    if (boxCotizacion) boxCotizacion.style.display = tipo === 'cotizacion' ? 'block' : 'none';

    if (sobrescribirTextos) {
      if (tipo === 'pedido') {
        if (inputSubject) inputSubject.value = '🔥 ¡Tu pedido de gas está confirmado! · Solgas Surquillo';
        if (textMarkdown) textMarkdown.value = 'Gracias por confiar en **Solgas Surquillo**.\nTu balón cuenta con precinto de seguridad intacto y garantía oficial de peso exacto en balanza digital.';
      } else if (tipo === 'comprobante') {
        if (inputSubject) inputSubject.value = '📄 Comprobante de Pago Electrónico · Solgas Surquillo';
        if (textMarkdown) textMarkdown.value = 'Adjuntamos la representación impresa de tu comprobante electrónico emitido con validez tributaria ante SUNAT.\nGracias por tu preferencia.';
      } else if (tipo === 'cotizacion') {
        if (inputSubject) inputSubject.value = '📋 Cotización de Balones de Gas GLP · Solgas Surquillo';
        if (textMarkdown) textMarkdown.value = 'Estimados clientes,\nPresentamos nuestra propuesta comercial para el abastecimiento continuo de GLP con precios preferenciales para su negocio.';
      } else {
        if (inputSubject) inputSubject.value = 'Notificación Oficial · Solgas Surquillo';
        if (textMarkdown) textMarkdown.value = 'Estimado cliente,\nNos comunicamos desde la sede central de **Solgas Surquillo** en Jr. Dante 260.';
      }
    }

    renderizarLivePreview();
  }

  pillsWrap?.querySelectorAll('.cr-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.getAttribute('data-template');
      if (t) seleccionarPlantilla(t, true);
    });
  });

  // Barra de herramientas Markdown
  document.querySelectorAll('.cr-md-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.getAttribute('data-tag');
      if (!tag || !textMarkdown) return;

      const start = textMarkdown.selectionStart;
      const end = textMarkdown.selectionEnd;
      const selected = textMarkdown.value.substring(start, end);

      let replacement = '';
      if (tag === 'table') {
        replacement = '\n| Producto | Cantidad | Precio |\n|---|:---:|---:|\n| Balón 10kg | 1 | S/ 65.00 |\n';
      } else if (tag.includes('texto')) {
        replacement = tag.replace('texto', selected || 'texto');
      } else {
        replacement = tag;
      }

      textMarkdown.setRangeText(replacement, start, end, 'end');
      textMarkdown.focus();
      renderizarLivePreview();
    });
  });

  // Switcher Desktop / Móvil en Live Preview
  deviceButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      deviceButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const dev = btn.getAttribute('data-device');
      if (frameWrap) {
        frameWrap.classList.toggle('mobile-view', dev === 'mobile');
      }
    });
  });

  // Live Preview Debounced
  function generarHtmlActual() {
    const negocio = obtenerDatosNegocio();
    const clienteNombre = inputNombre?.value?.trim() || '';
    const mdExtra = textMarkdown?.value || '';

    let res = null;

    if (plantillaSeleccionada === 'pedido') {
      res = generarPlantillaPedido({
        cliente: clienteNombre || 'Estimado/a cliente',
        pedidoId: inPedNumero?.value || 'GW-1029',
        precio: inPedPrecio?.value || '65.00',
        producto: inPedProducto?.value || 'Balón SOLGAS Premium 10 kg',
        metodoPago: inPedPago?.value || 'Yape / Plin / Efectivo',
        direccion: inPedDireccion?.value || 'Surquillo, Lima',
        mensajeMarkdown: mdExtra,
        negocio
      });
    } else if (plantillaSeleccionada === 'comprobante') {
      res = generarPlantillaComprobante({
        cliente: clienteNombre || 'Estimado cliente',
        tipoComprobante: inCompTipo?.value || 'Boleta de Venta Electrónica',
        serieNumero: inCompSerie?.value || 'B001-000482',
        monto: inCompMonto?.value || '65.00',
        docIdentidad: inCompDoc?.value || '',
        mensajeMarkdown: mdExtra,
        negocio
      });
    } else if (plantillaSeleccionada === 'cotizacion') {
      res = generarPlantillaCotizacion({
        cliente: clienteNombre || 'Contacto Comercial',
        empresa: inCotEmpresa?.value || 'Restaurante / Negocio',
        cotizacionId: inCotNumero?.value || 'COT-2026-08',
        validez: inCotValidez?.value || '15 días calendario',
        mensajeMarkdown: mdExtra,
        negocio
      });
    } else {
      res = generarPlantillaLibre({
        cliente: clienteNombre || 'Estimado/a cliente',
        asunto: inputSubject?.value || 'Comunicado Oficial',
        mensajeMarkdown: mdExtra,
        negocio
      });
    }

    if (res && typeof res === 'object' && res.html) {
      return res.html;
    }
    return typeof res === 'string' ? res : '';
  }

  function renderizarLivePreview() {
    clearTimeout(liveDebounceTimer);
    liveDebounceTimer = setTimeout(() => {
      const html = generarHtmlActual();
      if (liveFrame && liveFrame.contentWindow) {
        const doc = liveFrame.contentWindow.document;
        doc.open();
        doc.write(html);
        doc.close();
      }

      if (wordsCounter && textMarkdown) {
        const words = textMarkdown.value.trim().split(/\s+/).filter(Boolean).length;
        wordsCounter.textContent = `${words} ${words === 1 ? 'palabra' : 'palabras'}`;
      }
    }, 120);
  }

  document.querySelectorAll('.cr-live-input').forEach(inp => {
    inp.addEventListener('input', renderizarLivePreview);
    inp.addEventListener('change', renderizarLivePreview);
  });

  btnResetPlantilla?.addEventListener('click', () => {
    seleccionarPlantilla(plantillaSeleccionada, true);
    Notificacion({ msg: 'Plantilla restablecida a valores por defecto.', tipo: 'info' });
  });

  // Guardar en Borradores
  btnSaveDraft?.addEventListener('click', () => {
    const draft = {
      destinatario: { para: inputTo?.value || '', nombre: inputNombre?.value || '' },
      remitente: { desde: inputAjusteEmail?.value || 'pedidos@solgassurquillo.com' },
      mensaje: {
        asunto: inputSubject?.value || 'Borrador sin asunto',
        tipo: plantillaSeleccionada,
        resumen: textMarkdown?.value ? textMarkdown.value.substring(0, 80) : 'Borrador',
        html: generarHtmlActual()
      }
    };
    guardarBorrador(draft);
    actualizarBadges();
    Notificacion({ msg: 'Borrador guardado exitosamente.', tipo: 'exito' });
  });

  // Disparador del botón superior "Enviar Correo Ahora"
  btnEnviar?.addEventListener('click', (e) => {
    e.preventDefault();
    if (viewComposer && viewComposer.style.display === 'none') {
      abrirRedactor();
      if (inputTo) inputTo.focus();
      return;
    }
    if (formComposer) {
      if (typeof formComposer.requestSubmit === 'function') {
        formComposer.requestSubmit();
      } else {
        formComposer.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }
  });

  // Enviar Correo
  formComposer?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSending) return;

    const to = inputTo?.value?.trim();
    const subject = inputSubject?.value?.trim();
    if (!to || !subject) {
      Notificacion({ msg: 'Debes completar destinatario y asunto.', tipo: 'alerta' });
      return;
    }

    isSending = true;
    if (btnEnviar) wiSpin(btnEnviar, true, 'Enviando correo...');

    try {
      const htmlFinal = generarHtmlActual();
      const resultado = await enviarCorreo({
        para: to,
        nombre: inputNombre?.value?.trim(),
        cc: inputCc?.value ? inputCc.value.split(',').map(s => s.trim()) : [],
        asunto: subject,
        tipo: plantillaSeleccionada,
        mensaje: textMarkdown?.value || '',
        html: htmlFinal
      });

      Notificacion({ msg: '¡Correo oficial enviado con éxito!', tipo: 'exito' });
      actualizarBadges();
      cambiarCarpeta('enviados');
      if (resultado) abrirLecturaCorreo(resultado);
    } catch (err) {
      console.error(err);
      Notificacion({ msg: err?.message || 'Error al despachar correo con Resend', tipo: 'error' });
    } finally {
      isSending = false;
      if (btnEnviar) wiSpin(btnEnviar, false);
    }
  });

  // Guardar Ajustes de Emisor
  formAjustes?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nom = inputAjusteNombre?.value?.trim() || 'Solgas Surquillo';
    const email = inputAjusteEmail?.value?.trim() || 'pedidos@solgassurquillo.com';
    const rep = inputAjusteReplyTo?.value?.trim() || email;

    guardarAjustesCorreo({
      remitenteNombre: nom,
      remitenteEmail: email,
      responderA: rep
    });

    if (badgeRemitente) badgeRemitente.textContent = email;
    Notificacion({ msg: 'Ajustes de emisor guardados correctamente.', tipo: 'exito' });
  });

  // ════════════════════════════════════════════════════════════
  // 7. INICIALIZACIÓN
  // ════════════════════════════════════════════════════════════
  cargarAjustes();
  actualizarBadges();
  cambiarCarpeta('recibidos');
  renderizarLivePreview();

  // Sincronización en segundo plano con Firestore
  sincronizarCorreosDesdeFirestore().then(() => {
    actualizarBadges();
    if (carpetaActiva === 'enviados') renderizarListaMensajes(searchInput?.value || '');
  });
}
