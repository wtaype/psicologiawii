// src/feature/personal/modulos/correo/correo.js
// 🎯 Controlador Frontend Autónomo del Módulo Correo
// Experiencia Hotmail / Outlook: 3 Paneles (Carpetas, Lista de Mensajes, Visor/Redactor)
// Markdown Live Editor + Previsualización en Tiempo Real + Sincronización Firestore y Resend

import { Notificacion, wiSpin } from '@widev';
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
import { datosNegocio, configSemilla } from '../../../../negocio.js';
import {
  generarPlantillaLiquidacion,
  generarPlantillaCronograma,
  generarPlantillaComprobante,
  generarPlantillaCotizacion,
  generarPlantillaLibre,
  generarPlantillaPedido
} from './plantillas.js';
import { obtenerDatosNegocio } from '../negocio/dataNegocio.js';

export function inicializarModuloCorreo() {
  const panel = document.getElementById('panel-correo');
  if (!panel || panel.dataset.correoInit === 'true') return;
  panel.dataset.correoInit = 'true';

  let carpetaActiva = 'recibidos';
  let mensajeActivo = null;
  const esServicios = configSemilla?.modeloNegocio === 'servicios_y_asesorias';
  let plantillaSeleccionada = document.getElementById('crSelectTipo')?.value || (esServicios ? 'liquidacion' : 'pedido');
  let isSending = false;
  let liveDebounceTimer = null;

  // ── Shell y Controles de Full Vista ──
  const shell = document.querySelector('.cr-outlook-shell');
  const btnToggleFullReading = document.getElementById('btnToggleFullReading');
  const btnToggleFullComposer = document.getElementById('btnToggleFullComposer');
  const btnBackToInbox = document.getElementById('btnBackToInbox');

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
  const btnComposerDraftBottom = document.getElementById('btnComposerDraftBottom');
  const btnComposerSendBottom = document.getElementById('btnComposerSendBottom');
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
  const boxLiquidacion = document.getElementById('crFieldsLiquidacion');
  const boxCronograma = document.getElementById('crFieldsCronograma');
  const boxComprobante = document.getElementById('crFieldsComprobante');
  const boxCotizacion = document.getElementById('crFieldsCotizacion');

  // Inputs dinámicos: Pedido GLP
  const inPedNumero = document.getElementById('crPedNumero');
  const inPedProducto = document.getElementById('crPedProducto');
  const inPedCantidad = document.getElementById('crPedCantidad');
  const inPedTotal = document.getElementById('crPedTotal');
  const inPedDireccion = document.getElementById('crPedDireccion');
  const inPedTiempo = document.getElementById('crPedTiempo');

  // Inputs dinámicos: Liquidación
  const inLiqPeriodo = document.getElementById('crLiqPeriodo');
  const inLiqRegimen = document.getElementById('crLiqRegimen');
  const inLiqRuc = document.getElementById('crLiqRuc');
  const inLiqTotal = document.getElementById('crLiqTotal');
  const inLiqNps = document.getElementById('crLiqNps');
  const inLiqFecha = document.getElementById('crLiqFecha');

  // Inputs dinámicos: Cronograma
  const inCroRuc = document.getElementById('crCroRuc');
  const inCroDigito = document.getElementById('crCroDigito');
  const inCroPeriodo = document.getElementById('crCroPeriodo');
  const inCroFecha = document.getElementById('crCroFecha');

  // Inputs dinámicos: Comprobante
  const inCompTipo = document.getElementById('crCompTipo');
  const inCompSerie = document.getElementById('crCompSerie');
  const inCompMonto = document.getElementById('crCompMonto');
  const inCompDoc = document.getElementById('crCompDoc');
  const inCompServicio = document.getElementById('crCompServicio');

  // Inputs dinámicos: Propuesta / Cotización
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
    const nomDef = datosNegocio.nombreCorto || datosNegocio.nombre || '';
    const emDef = datosNegocio.email || datosNegocio.contacto?.email || '';
    if (inputAjusteNombre) inputAjusteNombre.value = aj.remitenteNombre || nomDef;
    if (inputAjusteEmail) inputAjusteEmail.value = aj.remitenteEmail || emDef;
    if (inputAjusteReplyTo) inputAjusteReplyTo.value = aj.responderA || aj.remitenteEmail || emDef;
    if (badgeRemitente) badgeRemitente.textContent = aj.remitenteEmail || emDef || 'Sin configurar';
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

  btnTopRedactar?.addEventListener('click', () => {
    shell?.classList.remove('two-pane');
    abrirRedactor();
  });
  btnSidebarRedactar?.addEventListener('click', () => {
    shell?.classList.remove('two-pane');
    abrirRedactor();
  });

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

      const inicial = emisor.charAt(0).toUpperCase() || 'E';
      const tipo = m.mensaje?.tipo || 'liquidacion';
      const tagClase = `tag-${tipo}`;
      const asunto = m.mensaje?.asunto || 'Sin asunto';
      const resumen = m.mensaje?.resumen || '';
      const fecha = m.fecha || 'Reciente';

      let avatarClase = 'cr-msg-avatar';
      if (tipo === 'comprobante') avatarClase += ' green';
      else if (tipo === 'cronograma' || tipo === 'cotizacion') avatarClase += ' blue';
      else if (tipo === 'consulta' || tipo === 'general') avatarClase += ' purple';

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
        Notificacion('Correo eliminado de la carpeta.', 'info', 2000);
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

    messageList?.querySelectorAll('.cr-msg-item').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-msg-id') === msg.id);
      if (el.getAttribute('data-msg-id') === msg.id) el.classList.remove('unread');
    });

    if (readSubject) readSubject.textContent = msg.mensaje?.asunto || 'Sin Asunto';
    const senderFallback = `${datosNegocio.nombreCorto || datosNegocio.nombre || 'Emisor'} <${datosNegocio.contacto?.email || datosNegocio.email || ''}>`;
    if (readFrom) readFrom.textContent = msg.remitente?.desde || senderFallback;
    if (readTo) readTo.textContent = `Para: ${msg.destinatario?.para || 'Cliente'}`;
    if (readDate) readDate.textContent = msg.fecha || 'Reciente';

    const emisorNombre = (msg.remitente?.desde || 'E').charAt(0).toUpperCase();
    if (readAvatar) readAvatar.textContent = emisorNombre;

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
    Notificacion('Correo eliminado.', 'info', 2000);
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

  // ── Controles de Vista Completa ──
  function toggleFullView() {
    if (!shell) return;
    shell.classList.toggle('full-view');
    const isFull = shell.classList.contains('full-view');
    const iconHtml = isFull
      ? '<i class="fa-solid fa-compress"></i> <span class="cr-btn-txt">Restaurar</span>'
      : '<i class="fa-solid fa-expand"></i> <span class="cr-btn-txt">Vista Completa</span>';

    if (btnToggleFullReading) btnToggleFullReading.innerHTML = iconHtml;
    if (btnToggleFullComposer) btnToggleFullComposer.innerHTML = iconHtml;
  }

  btnToggleFullReading?.addEventListener('click', toggleFullView);
  btnToggleFullComposer?.addEventListener('click', toggleFullView);

  btnBackToInbox?.addEventListener('click', () => {
    if (shell?.classList.contains('full-view')) {
      toggleFullView();
    }
  });

  btnComposerDraftBottom?.addEventListener('click', () => {
    btnSaveDraft?.click();
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
      shell?.classList.add('two-pane');
      if (titleFolder) titleFolder.innerHTML = `<i class="fa-solid fa-sliders"></i> Ajustes`;
      mostrarVista('settings');
      return;
    }

    if (folder === 'plantillas') {
      shell?.classList.add('two-pane');
      if (titleFolder) titleFolder.innerHTML = `<i class="fa-solid fa-tags"></i> Plantillas`;
      abrirRedactor();
      return;
    }

    // Para carpetas normales con correos (recibidos, enviados, borradores)
    shell?.classList.remove('two-pane');

    let titulo = 'Principal';
    let icono = 'fa-inbox';
    if (folder === 'enviados') {
      titulo = 'Enviados';
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
  // 6. REDACTOR Y PLANTILLAS CONTABLES
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
    if (boxLiquidacion) boxLiquidacion.style.display = tipo === 'liquidacion' ? 'block' : 'none';
    if (boxCronograma) boxCronograma.style.display = tipo === 'cronograma' ? 'block' : 'none';
    if (boxComprobante) boxComprobante.style.display = tipo === 'comprobante' ? 'block' : 'none';
    if (boxCotizacion) boxCotizacion.style.display = tipo === 'cotizacion' ? 'block' : 'none';

    if (sobrescribirTextos) {
      const sufijoMarca = datosNegocio.nombreCorto || datosNegocio.nombre || 'Oficial';
      if (tipo === 'pedido') {
        const pedId = inPedNumero?.value || 'PED-1029';
        if (inputSubject) inputSubject.value = `📦 ¡Tu pedido #${pedId} está confirmado! · ${sufijoMarca}`;
        if (textMarkdown) textMarkdown.value = 'Hemos recibido tu pedido con éxito y nuestra unidad de reparto se encuentra preparando tu despacho con balanza digital calibrada.';
      } else if (tipo === 'comprobante') {
        const compNum = inCompSerie?.value || 'B001-000482';
        if (inputSubject) inputSubject.value = `🧾 Tu Comprobante Electrónico ${compNum} · ${sufijoMarca}`;
        if (textMarkdown) textMarkdown.value = 'Adjuntamos la representación impresa de su comprobante electrónico con validez oficial ante SUNAT.';
      } else if (tipo === 'cotizacion') {
        const cotId = inCotNumero?.value || 'COT-2026-15';
        if (inputSubject) inputSubject.value = `📋 Propuesta Comercial #${cotId} · ${sufijoMarca}`;
        if (textMarkdown) textMarkdown.value = 'Presentamos nuestra propuesta formal de suministro con tarifas competitivas por volumen y garantía de peso exacto.';
      } else if (tipo === 'seguridad') {
        if (inputSubject) inputSubject.value = `🛡️ Recomendaciones de Seguridad e Instalación · ${sufijoMarca}`;
        if (textMarkdown) textMarkdown.value = 'Compartimos las pautas clínicas de acompañamiento y recomendaciones para el bienestar emocional y la continuidad de sus sesiones.';
      } else if (tipo === 'liquidacion') {
        if (inputSubject) inputSubject.value = `📊 Estado de Cuenta y Consumos · ${sufijoMarca}`;
        if (textMarkdown) textMarkdown.value = 'Adjuntamos el detalle del consumo para su revisión y conformidad.';
      } else if (tipo === 'cronograma') {
        if (inputSubject) inputSubject.value = `⏰ Recordatorio de Atención y Despacho · ${sufijoMarca}`;
        if (textMarkdown) textMarkdown.value = 'Recordamos a nuestros clientes los horarios y canales de despacho express.';
      } else {
        if (inputSubject) inputSubject.value = `Comunicado Oficial · ${sufijoMarca}`;
        const dir = datosNegocio.ubicacion?.distrito ? ` (${datosNegocio.ubicacion.distrito}, ${datosNegocio.ubicacion?.ciudad || 'Lima'})` : '';
        if (textMarkdown) textMarkdown.value = `Estimado cliente,\nNos comunicamos desde **${datosNegocio.nombre}**${dir}.`;
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
        replacement = '\n| Detalle | Cantidad | Subtotal |\n|---|:---:|---:|\n| Producto o Servicio | 1 | S/ 0.00 |\n';
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
        pedidoId: inPedNumero?.value || 'PED-001',
        producto: inPedProducto?.value || negocio.productoPrincipal || 'Producto o Servicio',
        cantidad: inPedCantidad?.value || 1,
        precio: inPedTotal?.value || '0.00',
        direccion: inPedDireccion?.value || negocio.direccionSede || '',
        metodoPago: 'Efectivo / Yape / Plin',
        tiempoEstimado: inPedTiempo?.value || 'Atención Inmediata',
        mensajeMarkdown: mdExtra,
        negocio
      });
    } else if (plantillaSeleccionada === 'liquidacion') {
      res = generarPlantillaLiquidacion({
        cliente: clienteNombre || 'Estimado/a cliente',
        periodo: inLiqPeriodo?.value || 'Agosto 2026',
        regimen: inLiqRegimen?.value || 'Régimen MYPE Tributario',
        ruc: inLiqRuc?.value || '20554897123',
        totalPagar: inLiqTotal?.value || '185.00',
        npsCodigo: inLiqNps?.value || '9827364510',
        fechaLimite: inLiqFecha?.value || '18 de Septiembre de 2026',
        mensajeMarkdown: mdExtra,
        negocio
      });
    } else if (plantillaSeleccionada === 'cronograma') {
      res = generarPlantillaCronograma({
        cliente: clienteNombre || 'Estimado/a cliente',
        ruc: inCroRuc?.value || '20554897123',
        ultimoDigito: inCroDigito?.value || '3',
        periodo: inCroPeriodo?.value || 'Agosto 2026',
        fechaVencimiento: inCroFecha?.value || '18 de Septiembre de 2026',
        mensajeMarkdown: mdExtra,
        negocio
      });
    } else if (plantillaSeleccionada === 'comprobante') {
      res = generarPlantillaComprobante({
        cliente: clienteNombre || 'Estimado cliente',
        tipoComprobante: inCompTipo?.value || 'Factura Electrónica',
        serieNumero: inCompSerie?.value || 'F001-000104',
        monto: inCompMonto?.value || '65.00',
        docIdentidad: inCompDoc?.value || '20554897123',
        servicio: inCompServicio?.value || '',
        mensajeMarkdown: mdExtra,
        negocio
      });
    } else if (plantillaSeleccionada === 'cotizacion') {
      res = generarPlantillaCotizacion({
        cliente: clienteNombre || 'Contacto Comercial',
        empresa: inCotEmpresa?.value || 'Inversiones Gastronómicas S.A.C.',
        cotizacionId: inCotNumero?.value || 'COT-2026-15',
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
    Notificacion('Plantilla restablecida a valores por defecto.', 'info', 2000);
  });

  // Guardar en Borradores
  btnSaveDraft?.addEventListener('click', () => {
    const draft = {
      destinatario: { para: inputTo?.value || '', nombre: inputNombre?.value || '' },
      remitente: { desde: inputAjusteEmail?.value || datosNegocio.email || '' },
      mensaje: {
        asunto: inputSubject?.value || 'Borrador sin asunto',
        tipo: plantillaSeleccionada,
        resumen: textMarkdown?.value ? textMarkdown.value.substring(0, 80) : 'Borrador',
        html: generarHtmlActual()
      }
    };
    guardarBorrador(draft);
    actualizarBadges();
    Notificacion('Borrador guardado exitosamente.', 'success', 2000);
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
      Notificacion('Debes completar destinatario y asunto.', 'warning', 2500);
      return;
    }

    isSending = true;
    const spin = wiSpin ? wiSpin(btnEnviar) : null;
    if (btnEnviar) btnEnviar.disabled = true;

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

      Notificacion('¡Correo institucional enviado con éxito!', 'success', 3000);
      actualizarBadges();
      cambiarCarpeta('enviados');
      if (resultado) abrirLecturaCorreo(resultado);
    } catch (err) {
      console.error(err);
      Notificacion(err?.message || 'Error al despachar correo con Resend', 'danger', 4000);
    } finally {
      isSending = false;
      if (spin) spin.stop();
      if (btnEnviar) btnEnviar.disabled = false;
    }
  });

  // Guardar Ajustes de Emisor
  formAjustes?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nom = inputAjusteNombre?.value?.trim() || datosNegocio.nombreCorto || datosNegocio.nombre || '';
    const email = inputAjusteEmail?.value?.trim() || datosNegocio.email || '';
    const rep = inputAjusteReplyTo?.value?.trim() || email;

    guardarAjustesCorreo({
      remitenteNombre: nom,
      remitenteEmail: email,
      responderA: rep
    });

    if (badgeRemitente) badgeRemitente.textContent = email;
    Notificacion('Ajustes de emisor guardados correctamente.', 'success', 2500);
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
