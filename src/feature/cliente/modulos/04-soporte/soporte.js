// src/feature/cliente/modulos/04-soporte/soporte.js
// Controlador Humano y Smart del Módulo 04: Soporte y Consultas
// wiSelect, autocompletado en 0ms desde wiSmile, WhatsApp tributario, wiSpin y Notificacion

import { wiSelect, wiSpin, Notificacion, getls } from '@widev';
import { datosNegocio, configSemilla } from '../../../../negocio.js';
import {
  obtenerTicketsLocal,
  crearTicket,
  sincronizarTicketsDesdeFirestore
} from './dataSoporte.js';

const esServicios = configSemilla?.modeloNegocio === 'servicios_y_asesorias';
const tipoDefectoGlobal = esServicios ? 'declaracion' : 'pedido';

let inicializado = false;
let instSelectTipo = null;
let instSelectTipoComp = null;
let instSelectTipoNegocio = null;
let instSelectRegimen = null;

/**
 * Actualiza el enlace directo de WhatsApp con mensajes humanos y cálidos con atribución tributaria
 */
function actualizarEnlaceWhatsApp(tipo) {
  const btnWa = document.getElementById('spBtnWhatsApp');
  if (!btnWa) return;

  const neg = getls('wi_negocio') || getls('minegocio') || {};
  const numWa = String(neg.contacto?.whatsappLimpio || neg.contacto?.whatsapp || datosNegocio.whatsappLimpio || '').replace(/\D/g, '');
  const nombreNegocio = neg.identidad?.nombreCorto || neg.identidad?.nombre || datosNegocio.nombreCorto || datosNegocio.nombre || '';
  const especialista = neg.identidad?.especialista || datosNegocio.identidad?.especialista || '';

  const user = getls('wiSmile') || (typeof window !== 'undefined' ? window.__WI_USER__ : null);
  const clienteNombre = user?.nombre ? ` de ${user.nombre}` : '';
  const rucInfo = user?.documento ? `\n📌 RUC: ${user.documento}` : '';

  let motivo = 'Tengo una consulta general sobre sus productos y servicios.';
  let tipoLabel = 'Consulta General';

  if (tipo === 'pedido' || tipo === 'cita') {
    motivo = 'Deseo consultar sobre el agendamiento y confirmación de mi próxima sesión psicológica.';
    tipoLabel = 'Agendamiento de Cita';
  } else if (tipo === 'modalidad') {
    motivo = 'Requiero información sobre la atención presencial en Sede América o virtual por Google Meet.';
    tipoLabel = 'Modalidades de Atención';
  } else if (tipo === 'honorarios' || tipo === 'comprobante') {
    motivo = 'Deseo coordinar la emisión de mi Recibo por Honorarios Electrónico (RHE) o Boleta de Atención.';
    tipoLabel = 'Recibo por Honorarios / Facturación';
  } else if (tipo === 'talleres') {
    motivo = 'Deseo solicitar información e inscripciones para los Talleres Vivenciales de Desarrollo Emocional.';
    tipoLabel = 'Talleres Vivenciales';
  } else if (tipo === 'cotizacion') {
    motivo = 'Deseo consultar paquetes de psicoterapia para instituciones o programas grupales.';
    tipoLabel = 'Programas Psicológicos / Convenios';
  }

  const espTxt = especialista ? ` de ${especialista}` : '';
  const rolLabel = user?.documento?.length === 11 ? 'Empresa / RUC' : 'Cliente';
  const mensaje = `¡Hola ${nombreNegocio}! 👋
He visto en su portal web y solicito atención${espTxt}:

🏷️ Origen: [Portal Cliente - Consultas / ${tipoLabel}]${clienteNombre ? `\n👤 ${rolLabel}:${clienteNombre}` : ''}${rucInfo}
💬 Asunto: ${motivo}

¿Podrían orientarme por favor? ¡Muchas gracias!`;

  btnWa.href = `https://wa.me/${numWa}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * Conmuta los campos contextuales de forma humana y fluida
 */
function alternarCamposContextuales(tipo) {
  const boxComp = document.getElementById('spCamposComprobante');
  const boxCotiz = document.getElementById('spCamposCotizacion');
  const txtDetalle = document.getElementById('spTextareaDetalle');

  if (boxComp) boxComp.style.display = tipo === 'comprobante' ? 'grid' : 'none';
  if (boxCotiz) boxCotiz.style.display = tipo === 'cotizacion' ? 'grid' : 'none';

  if (tipo === 'comprobante') {
    actualizarCamposComprobante();
    if (txtDetalle) {
      txtDetalle.placeholder = 'Indícanos tus datos de contacto (DNI / RUC), fecha de la sesión y correo para remitir el Recibo por Honorarios Electrónico (RHE)...';
    }
  } else if (tipo === 'pedido' || tipo === 'cita') {
    if (txtDetalle) txtDetalle.placeholder = 'Indícanos el motivo de tu consulta, especialidad deseada y disponibilidad horaria...';
  } else if (tipo === 'modalidad') {
    if (txtDetalle) txtDetalle.placeholder = 'Cuéntanos si prefieres atención presencial en Sede América (Villa El Salvador) o virtual HD por Google Meet...';
  } else if (tipo === 'talleres') {
    if (txtDetalle) txtDetalle.placeholder = 'Indícanos qué taller vivencial te interesa (Amor Propio, Inteligencia Emocional, Habilidades Sociales)...';
  } else if (tipo === 'cotizacion') {
    if (txtDetalle) {
      txtDetalle.placeholder = 'Cuéntanos sobre tu institución o colectivo, número aproximado de participantes y temática de interés...';
    }
  } else {
    if (txtDetalle) {
      txtDetalle.placeholder = 'Describe tu consulta o requerimiento con total confianza y confidencialidad...';
    }
  }
}

/**
 * Autocompletado inteligente para comprobantes desde wiSmile
 */
function actualizarCamposComprobante() {
  const tipoComp = instSelectTipoComp ? instSelectTipoComp.getValue() : (document.getElementById('spSelectTipoComp')?.value || 'factura');
  const boxRazon = document.getElementById('spGrupoRazonSocial');
  const inpDoc = document.getElementById('spInputDocComp');
  const inpRazon = document.getElementById('spInputRazonComp');
  const user = getls('wiSmile') || (typeof window !== 'undefined' ? window.__WI_USER__ : null);

  if (tipoComp === 'factura') {
    if (boxRazon) boxRazon.style.display = 'flex';
    if (inpDoc && !inpDoc.value && user?.documento) {
      inpDoc.value = user.documento;
    }
    if (inpRazon && !inpRazon.value && user?.razonSocial) {
      inpRazon.value = user.razonSocial;
    }
  } else {
    if (boxRazon) boxRazon.style.display = 'none';
    if (inpDoc && !inpDoc.value && user?.documento) {
      inpDoc.value = user.documento;
    }
  }
}

/**
 * Inicializa los selectores con el componente wiSelect de @widev
 */
function inicializarWiSelects() {
  // 1. Selector Principal: Motivo de consulta
  const elTipo = document.getElementById('spSelectTipo');
  if (elTipo && !elTipo.dataset.wiselect) {
    instSelectTipo = wiSelect(elTipo, {
      placeholder: 'Selecciona motivo de consulta...',
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
      placeholder: 'Rubro comercial...',
      searchPlaceholder: 'Buscar rubro...'
    });
  }

  // 4. Selector de Régimen Estimado para Cotizaciones
  const elRegimen = document.getElementById('spSelectRegimenCotiz');
  if (elRegimen && !elRegimen.dataset.wiselect) {
    instSelectRegimen = wiSelect(elRegimen, {
      placeholder: 'Régimen tributario...',
      searchPlaceholder: 'Buscar régimen...'
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
        <span>Aún no has enviado consultas. Cuando nos envíes un requerimiento o trámite, aparecerá aquí con su estado de atención.</span>
      </div>
    `;
    return;
  }

  const neg = getls('wi_negocio') || getls('minegocio') || {};
  const nombreEstudio = neg.identidad?.nombreCorto || neg.identidad?.nombre || datosNegocio.nombreCorto || datosNegocio.nombre || (esServicios ? 'Atención Contable' : 'Central de Atención');

  const html = tickets.map(t => {
    const estadoClass = t.estado || 'pendiente';
    const estadoLabel = estadoClass === 'atendido' ? 'Atendido' : (estadoClass === 'en_proceso' ? 'En Proceso' : 'Pendiente');
    
    let tipoAmigable = esServicios ? 'CONSULTA TRIBUTARIA' : 'CONSULTA GENERAL';
    if (t.tipo === 'pedido') tipoAmigable = 'ESTADO DE PEDIDO';
    else if (t.tipo === 'instalacion') tipoAmigable = 'SOPORTE INSTALACIÓN';
    else if (t.tipo === 'declaracion') tipoAmigable = 'DECLARACIÓN MENSUAL';
    else if (t.tipo === 'esquela') tipoAmigable = 'ESQUELA SUNAT';
    else if (t.tipo === 'honorarios') tipoAmigable = '4TA CATEGORÍA / RECIBO';
    else if (t.tipo === 'comprobante') tipoAmigable = 'COMPROBANTE';
    else if (t.tipo === 'cotizacion') tipoAmigable = esServicios ? 'PRESUPUESTO MYPE' : 'COTIZACIÓN POR MAYOR';

    return `
      <div class="sp-ticket-item" data-ticket-id="${t.id}">
        <div class="sp-ticket-top">
          <span class="sp-ticket-id">
            <i class="fa-solid fa-file-invoice" style="color:var(--brand-primary, #9e7b4f); font-size:0.85rem; margin-right:4px;"></i>
            ${t.ticketId || t.id}
          </span>
          <span class="sp-ticket-badge ${estadoClass}">${estadoLabel}</span>
        </div>
        <div class="sp-ticket-detalle">
          <strong>[${tipoAmigable}]</strong> ${t.detalle || t.asunto}
        </div>
        <div class="sp-ticket-meta">
          <span><i class="fa-regular fa-clock" style="margin-right:4px;"></i>${t.fechaTexto || 'Reciente'}</span>
          <span>${nombreEstudio}</span>
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
    wiSpin(btn, true, 'Enviando consulta...');

    try {
      const tipo = instSelectTipo ? instSelectTipo.getValue() : (document.getElementById('spSelectTipo')?.value || tipoDefectoGlobal);
      const detalle = document.getElementById('spTextareaDetalle')?.value || '';

      if (!detalle.trim()) {
        Notificacion('Por favor cuéntanos el detalle de tu consulta.', 'warning');
        wiSpin(btn, false);
        return;
      }

      let datosFiscales = null;
      if (tipo === 'comprobante') {
        const tipoComp = instSelectTipoComp ? instSelectTipoComp.getValue() : (document.getElementById('spSelectTipoComp')?.value || 'factura');
        const doc = document.getElementById('spInputDocComp')?.value || '';
        const razon = document.getElementById('spInputRazonComp')?.value || '';
        datosFiscales = { tipoComp, documento: doc, razonSocial: razon };
      }

      const nuevo = await crearTicket({
        tipo,
        detalle,
        datosFiscales,
        asunto: `${esServicios ? 'Consulta Contable' : 'Consulta Cliente'}: ${tipo.toUpperCase()}`
      });

      // Actualizar interfaz instantáneamente (0ms)
      renderizarTicketsUI();
      form.reset();

      // Restablecer formulario a estado inicial
      if (instSelectTipo) instSelectTipo.setValue(tipoDefectoGlobal);
      if (instSelectTipoComp) instSelectTipoComp.setValue('factura');
      alternarCamposContextuales(tipoDefectoGlobal);

      const neg = getls('wi_negocio') || getls('minegocio') || {};
      const esp = esServicios 
        ? (neg.identidad?.especialista || datosNegocio.identidad?.especialista || '') 
        : (neg.identidad?.nombreCorto || datosNegocio.nombreCorto || '');
      const destTxt = esp ? ` ${esp}` : ' Nuestro equipo';
      Notificacion(`¡Consulta #${nuevo.ticketId} registrada con éxito!${destTxt} la revisará a la brevedad.`, 'success', 5000);
    } catch (err) {
      console.error('[Soporte] Error al enviar consulta:', err);
      Notificacion(err.message || 'Error al enviar la consulta.', 'error');
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
 * Inicializador principal del Módulo 04: Soporte y Consultas SUNAT
 */
export function inicializarSoporte() {
  const contenedor = document.getElementById('moduloSoporte');
  if (!contenedor) return;

  // 1. Inicializar selects premium
  inicializarWiSelects();

  // 2. Establecer campos iniciales y autocompletar
  alternarCamposContextuales(tipoDefectoGlobal);
  actualizarEnlaceWhatsApp(tipoDefectoGlobal);

  // 3. Cargar tickets desde smart cache wiSoporte (0ms)
  renderizarTicketsUI();

  // 4. Configurar listener de envío
  if (!inicializado) {
    configurarFormularioSoporte();
    inicializado = true;
  }

  // 5. Sincronización remota pasiva
  sincronizarTicketsDesdeFirestore();
}
