// src/feature/cliente/modulos/04-soporte/soporte.js
// Controlador Humano y Smart del Módulo 04: Soporte y Atención · Solgas Surquillo
// wiSelect, autocompletado en 0ms desde wiSmile, WhatsApp inteligente, wiSpin y Notificacion

import { wiSelect, wiSpin, Notificacion, getls } from '@widev';
import {
  obtenerTicketsLocal,
  crearTicket,
  sincronizarTicketsDesdeFirestore
} from './dataSoporte.js';

let inicializado = false;
let instSelectTipo = null;
let instSelectTipoComp = null;
let instSelectTipoNegocio = null;
let instSelectBalonCotiz = null;
let instSelectTipoValvula = null;

/**
 * Actualiza el enlace directo de WhatsApp con mensajes humanos y cálidos con atribución
 */
function actualizarEnlaceWhatsApp(tipo) {
  const btnWa = document.getElementById('spBtnWhatsApp');
  if (!btnWa) return;

  const neg = getls('minegocio') || {};
  const numWa = neg.contacto?.whatsappLimpio || neg.contacto?.whatsapp || '51936369384';
  const nombreNegocio = neg.identidad?.nombre || 'Solgas Surquillo';

  const user = getls('wiSmile') || (typeof window !== 'undefined' ? window.__GASWII_USER__ : null);
  const clienteNombre = user?.nombre ? ` de ${user.nombre}` : '';

  let motivo = 'Tengo una consulta general sobre mi cuenta y pedidos.';
  let tipoLabel = 'Consulta General';

  if (tipo === 'comprobante') {
    motivo = 'Necesito apoyo con la emisión o copia de mi comprobante de pago (boleta/factura).';
    tipoLabel = 'Comprobante';
  } else if (tipo === 'pedido') {
    motivo = 'Quisiera consultar sobre el estado de entrega de mi pedido de gas.';
    tipoLabel = 'Estado de Pedido';
  } else if (tipo === 'cotizacion') {
    motivo = 'Deseo solicitar una cotización de gas para mi negocio / empresa.';
    tipoLabel = 'Cotización Comercial';
  } else if (tipo === 'valvula') {
    motivo = 'Requiero asistencia técnica con mi balón, válvula o verificación con balanza digital.';
    tipoLabel = 'Asistencia Técnica';
  }

  const mensaje = `¡Hola ${nombreNegocio}! 👋
He visto en su portal web y solicito atención de soporte:

🏷️ Origen: [Portal Cliente - Soporte / ${tipoLabel}]${clienteNombre ? `\n👤 Cliente:${clienteNombre}` : ''}
💬 Asunto: ${motivo}

¿Podrían asistirme por favor? ¡Muchas gracias!`;

  btnWa.href = `https://wa.me/${numWa}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * Conmuta los campos contextuales de forma humana y fluida
 */
function alternarCamposContextuales(tipo) {
  const boxComp = document.getElementById('spCamposComprobante');
  const boxCotiz = document.getElementById('spCamposCotizacion');
  const boxValv = document.getElementById('spCamposValvula');
  const txtDetalle = document.getElementById('spTextareaDetalle');

  if (boxComp) boxComp.style.display = tipo === 'comprobante' ? 'grid' : 'none';
  if (boxCotiz) boxCotiz.style.display = tipo === 'cotizacion' ? 'grid' : 'none';
  if (boxValv) boxValv.style.display = tipo === 'valvula' ? 'flex' : 'none';

  // Si es comprobante, sincronizar el tipo y autocompletar
  if (tipo === 'comprobante') {
    actualizarCamposComprobante();
    if (txtDetalle) txtDetalle.placeholder = 'Indícanos la fecha aproximada de tu compra o el correo al que deseas recibir el comprobante...';
  } else if (tipo === 'pedido') {
    if (txtDetalle) txtDetalle.placeholder = 'Indícanos tu dirección o tu teléfono de contacto para ubicar en tiempo real a tu repartidor...';
  } else if (tipo === 'cotizacion') {
    if (txtDetalle) txtDetalle.placeholder = 'Cuéntanos sobre tu negocio, ubicación en Surquillo o distritos vecinos y frecuencia estimada de compra...';
  } else if (tipo === 'valvula') {
    if (txtDetalle) txtDetalle.placeholder = 'Cuéntanos qué dificultad tienes con tu válvula, o si deseas que el repartidor compruebe el peso exacto en tu puerta...';
  } else {
    if (txtDetalle) txtDetalle.placeholder = 'Escribe aquí tu consulta o sugerencia con total confianza...';
  }
}

/**
 * Autocompletado inteligente para boletas y facturas desde wiSmile
 */
function actualizarCamposComprobante() {
  const tipoComp = instSelectTipoComp ? instSelectTipoComp.getValue() : (document.getElementById('spSelectTipoComp')?.value || 'boleta');
  const boxRazon = document.getElementById('spGrupoRazonSocial');
  const inpDoc = document.getElementById('spInputDocComp');
  const inpRazon = document.getElementById('spInputRazonComp');
  const user = getls('wiSmile') || (typeof window !== 'undefined' ? window.__GASWII_USER__ : null);

  if (tipoComp === 'factura') {
    if (boxRazon) boxRazon.style.display = 'flex';
    if (inpDoc && !inpDoc.value && user?.documentoTipo === 'RUC' && user?.documento) {
      inpDoc.value = user.documento;
    }
    if (inpRazon && !inpRazon.value && user?.razonSocial) {
      inpRazon.value = user.razonSocial;
    }
  } else {
    if (boxRazon) boxRazon.style.display = 'none';
    if (inpDoc && !inpDoc.value && user?.documentoTipo === 'DNI' && user?.documento) {
      inpDoc.value = user.documento;
    }
  }
}

/**
 * Inicializa los selectores con el componente wiSelect de @widev
 */
function inicializarWiSelects() {
  // 1. Selector Principal: ¿En qué te ayudamos hoy?
  const elTipo = document.getElementById('spSelectTipo');
  if (elTipo && !elTipo.dataset.wiselect) {
    instSelectTipo = wiSelect(elTipo, {
      placeholder: 'Selecciona cómo podemos ayudarte...',
      searchPlaceholder: 'Buscar tema...',
      onChange: (val) => {
        alternarCamposContextuales(val);
        actualizarEnlaceWhatsApp(val);
      }
    });
  }

  // 2. Selector de Tipo de Comprobante
  const elTipoComp = document.getElementById('spSelectTipoComp');
  if (elTipoComp && !elTipoComp.dataset.wiselect) {
    instSelectTipoComp = wiSelect(elTipoComp, {
      placeholder: 'Tipo de comprobante...',
      searchPlaceholder: 'Buscar comprobante...',
      onChange: () => {
        actualizarCamposComprobante();
      }
    });
  }

  // 3. Selector de Rubro de Negocio para Cotizaciones
  const elNegocio = document.getElementById('spSelectTipoNegocio');
  if (elNegocio && !elNegocio.dataset.wiselect) {
    instSelectTipoNegocio = wiSelect(elNegocio, {
      placeholder: 'Rubro de negocio...',
      searchPlaceholder: 'Buscar rubro...'
    });
  }

  // 4. Selector de Balón para Cotizaciones
  const elBalon = document.getElementById('spSelectBalonCotiz');
  if (elBalon && !elBalon.dataset.wiselect) {
    instSelectBalonCotiz = wiSelect(elBalon, {
      placeholder: 'Tipo de balón...',
      searchPlaceholder: 'Buscar capacidad...'
    });
  }

  // 5. Selector de Asistencia de Válvula / Balón
  const elValvula = document.getElementById('spSelectTipoValvula');
  if (elValvula && !elValvula.dataset.wiselect) {
    instSelectTipoValvula = wiSelect(elValvula, {
      placeholder: 'Tipo de válvula o tema...',
      searchPlaceholder: 'Buscar tema...'
    });
  }
}

/**
 * Renderiza la lista reactiva de solicitudes recientes desde wiSoporte
 */
export function renderizarTicketsUI() {
  const listaContenedor = document.getElementById('listaTicketsRecientes');
  const badgeCount = document.getElementById('spBadgeTicketsCount');
  if (!listaContenedor) return;

  const tickets = obtenerTicketsLocal();
  if (badgeCount) badgeCount.textContent = String(tickets.length);

  if (tickets.length === 0) {
    listaContenedor.innerHTML = `
      <div class="sp-empty-tickets" id="spEmptyTickets">
        <i class="fa-solid fa-folder-open"></i>
        <span>Aún no has enviado mensajes. Cuando nos envíes una consulta o trámite, aparecerá aquí con su estado de atención.</span>
      </div>
    `;
    return;
  }

  const html = tickets.map(t => {
    const estadoClass = t.estado || 'pendiente';
    const estadoLabel = estadoClass === 'atendido' ? 'Atendido' : (estadoClass === 'en_proceso' ? 'En Proceso' : 'Pendiente');
    
    let tipoAmigable = 'CONSULTA';
    if (t.tipo === 'comprobante') tipoAmigable = 'COMPROBANTE';
    else if (t.tipo === 'pedido') tipoAmigable = 'DELIVERY / PEDIDO';
    else if (t.tipo === 'cotizacion') tipoAmigable = 'COTIZACIÓN';
    else if (t.tipo === 'valvula') tipoAmigable = 'ASISTENCIA TÉCNICA';

    return `
      <div class="sp-ticket-item" data-ticket-id="${t.id}">
        <div class="sp-ticket-top">
          <span class="sp-ticket-id">
            <i class="fa-solid fa-comment-dots" style="color:var(--cl-orange); font-size:0.85rem; margin-right:4px;"></i>
            ${t.ticketId || t.id}
          </span>
          <span class="sp-ticket-badge ${estadoClass}">${estadoLabel}</span>
        </div>
        <div class="sp-ticket-detalle">
          <strong>[${tipoAmigable}]</strong> ${t.detalle || t.asunto}
        </div>
        <div class="sp-ticket-meta">
          <span><i class="fa-regular fa-clock" style="margin-right:4px;"></i>${t.fechaTexto || 'Reciente'}</span>
          <span>Sede Surquillo</span>
        </div>
      </div>
    `;
  }).join('');

  listaContenedor.innerHTML = html;
}

/**
 * Configura los eventos del formulario
 */
function configurarFormularioSoporte() {
  const form = document.getElementById('formSoporteTicket');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnEnviarTicket');
    wiSpin(btn, true, 'Enviando mensaje...');

    try {
      const tipo = instSelectTipo ? instSelectTipo.getValue() : (document.getElementById('spSelectTipo')?.value || 'comprobante');
      const detalle = document.getElementById('spTextareaDetalle')?.value || '';

      if (!detalle.trim()) {
        Notificacion('Por favor cuéntanos el detalle de tu consulta.', 'warning');
        wiSpin(btn, false);
        return;
      }

      let datosFiscales = null;
      if (tipo === 'comprobante') {
        const tipoComp = instSelectTipoComp ? instSelectTipoComp.getValue() : (document.getElementById('spSelectTipoComp')?.value || 'boleta');
        const doc = document.getElementById('spInputDocComp')?.value || '';
        const razon = document.getElementById('spInputRazonComp')?.value || '';
        datosFiscales = { tipoComp, documento: doc, razonSocial: razon };
      }

      const nuevo = await crearTicket({
        tipo,
        detalle,
        datosFiscales,
        asunto: `Mensaje de cliente: ${tipo.toUpperCase()}`
      });

      // Actualizar interfaz instantáneamente (0ms)
      renderizarTicketsUI();
      form.reset();

      // Restablecer formulario a estado inicial
      if (instSelectTipo) instSelectTipo.setValue('comprobante');
      if (instSelectTipoComp) instSelectTipoComp.setValue('boleta');
      alternarCamposContextuales('comprobante');

      Notificacion(`¡Mensaje #${nuevo.ticketId} recibido! El equipo Solgas te responderá a la brevedad.`, 'success', 5000);
    } catch (err) {
      console.error('[Soporte] Error al enviar ticket:', err);
      Notificacion(err.message || 'Error al enviar el mensaje.', 'error');
    } finally {
      wiSpin(btn, false);
    }
  });

  // Escuchar sincronización de tickets
  document.addEventListener('ticketsActualizados', () => {
    renderizarTicketsUI();
  });
}

/**
 * Inicializador principal del Módulo 04: Soporte
 */
export function inicializarSoporte() {
  const contenedor = document.getElementById('moduloSoporte');
  if (!contenedor) return;

  // 1. Inicializar selects premium
  inicializarWiSelects();

  // 2. Establecer campos iniciales y autocompletar
  alternarCamposContextuales('comprobante');
  actualizarEnlaceWhatsApp('comprobante');

  // 3. Cargar tickets desde smart cache wiSoporte (0ms)
  renderizarTicketsUI();

  // 4. Configurar listeners una sola vez
  if (!inicializado) {
    configurarFormularioSoporte();
    inicializado = true;
  }

  // 5. Sincronización pasiva en segundo plano
  sincronizarTicketsDesdeFirestore();
}
