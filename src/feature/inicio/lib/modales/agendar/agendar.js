// src/feature/inicio/lib/modales/agendar/agendar.js
// 🎯 Hijo 1: Modal Interactivo de Agendamiento por WhatsApp - Consultorio Psicológico América
// Con wiSelect, selector interactivo de horas con slots, validación wiTip y soporte i18n federado.

import { datosNegocio } from '../../../../../negocio.js';
import { wiSelect } from '../../../../../core/widev/wiselect.js';
import { wiTip } from '../../../../../core/widev/witip.js';
import { resolverTextos } from '../idioma/idioma.js';
import agendarCss from './agendar.css?inline';
import es from './idioma/es.json';
import en from './idioma/en.json';

let modalEl = null;
let wiSelectMotivoInst = null;
let wiSelectModalidadInst = null;

function obtenerTextos() {
  return resolverTextos({ es, en });
}

function obtenerUsuarioActivo() {
  try {
    const raw = localStorage.getItem('wiSmile');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function formatearFechaEspanol(fechaStr) {
  if (!fechaStr) return 'Por coordinar';
  try {
    const [year, month, day] = fechaStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${dias[date.getDay()]} ${day} de ${meses[month - 1]} de ${year}`;
  } catch (e) {
    return fechaStr;
  }
}

function obtenerFechaPorDefecto() {
  const hoy = new Date();
  hoy.setDate(hoy.getDate() + 1);
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function obtenerFechaMinima() {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function asegurarEstilosEnDOM() {
  if (document.getElementById('wi_modal_agendar_styles')) return;
  const style = document.createElement('style');
  style.id = 'wi_modal_agendar_styles';
  style.innerHTML = agendarCss;
  document.head.appendChild(style);
}

function asegurarModalEnDOM() {
  asegurarEstilosEnDOM();

  if (document.getElementById('wi_modal_agendar')) {
    return document.getElementById('wi_modal_agendar');
  }

  const t = obtenerTextos();
  const user = obtenerUsuarioActivo() || {};
  const fechaDefault = obtenerFechaPorDefecto();
  const fechaMin = obtenerFechaMinima();

  const html = `
    <div id="wi_modal_agendar" class="wiModal" role="dialog" aria-modal="true" aria-labelledby="modalAgendarTitle" style="display: none;">
      <div class="modal-agendar-dialog">
        
        <!-- Header -->
        <div class="modal-agendar-header">
          <div>
            <span class="modal-agendar-badge">
              <i class="fa-solid fa-stethoscope"></i> ${t.badge}
            </span>
            <h3 id="modalAgendarTitle" class="modal-agendar-title">
              ${t.titulo}
            </h3>
            <p class="modal-agendar-subtitle">
              ${t.subtitulo}
            </p>
          </div>
          <button id="btnCerrarModalAgendar" class="modal-agendar-close" type="button" aria-label="${t.cerrar}">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form id="formModalAgendar" onsubmit="event.preventDefault(); window.__enviarAgendamientoModal();">
          
          <!-- Contenido en 2 Columnas Limpias -->
          <div class="modal-agendar-columns">
            
            <!-- COLUMNA 1: Tema, Modalidad y Ciudad -->
            <div class="modal-agendar-col">
              
              <!-- 1. Tema de Consulta (Sin precios) -->
              <div class="modal-agendar-field">
                <label for="agendarSelectMotivo" class="modal-agendar-label">
                  <i class="fa-solid fa-brain"></i> ${t.lblTema}
                </label>
                <select id="agendarSelectMotivo" class="modal-agendar-input">
                  ${t.temas.map(s => {
                    return `<option value="${s.id}" data-nombre="${s.nombre}">${s.nombre}</option>`;
                  }).join('')}
                </select>
              </div>

              <!-- 2. Modalidad: 1. Online, 2. Llamadas y 3. Presencial -->
              <div class="modal-agendar-field">
                <label for="agendarSelectModalidad" class="modal-agendar-label">
                  <i class="fa-solid fa-globe"></i> ${t.lblModalidad}
                </label>
                <select id="agendarSelectModalidad" class="modal-agendar-input">
                  ${t.modalidades.map((m, idx) => {
                    return `<option value="${m.nombre}" ${idx === 0 ? 'selected' : ''}>${m.nombre}</option>`;
                  }).join('')}
                </select>
              </div>

              <!-- 3. Ciudad o País -->
              <div class="modal-agendar-field">
                <label for="agendarInputCiudad" class="modal-agendar-label">
                  <i class="fa-solid fa-location-dot"></i> ${t.lblCiudad}
                </label>
                <input 
                  type="text" 
                  id="agendarInputCiudad" 
                  class="modal-agendar-input"
                  placeholder="${t.placeholderCiudad}" 
                  value="${t.defaultCiudad}"
                />
              </div>

            </div>

            <!-- COLUMNA 2: Paciente, Contacto, Fecha y Hora -->
            <div class="modal-agendar-col">
              
              <!-- 4. Tu Nombre -->
              <div class="modal-agendar-field">
                <label for="agendarInputNombre" class="modal-agendar-label">
                  <i class="fa-regular fa-user"></i> ${t.lblNombre}
                </label>
                <input 
                  type="text" 
                  id="agendarInputNombre" 
                  class="modal-agendar-input"
                  placeholder="${t.placeholderNombre}" 
                  value="${user.nombre || user.usuario || ''}"
                />
              </div>

              <!-- 5. Celular o WhatsApp -->
              <div class="modal-agendar-field">
                <label for="agendarInputCelular" class="modal-agendar-label">
                  <i class="fa-brands fa-whatsapp"></i> ${t.lblCelular}
                </label>
                <input 
                  type="tel" 
                  id="agendarInputCelular" 
                  class="modal-agendar-input"
                  placeholder="${t.placeholderCelular}" 
                  value="${user.celular || ''}"
                />
              </div>

              <!-- 6. Fecha y Selector Especializado de Horarios -->
              <div class="modal-agendar-field">
                <div class="modal-agendar-grid-2">
                  <div>
                    <label for="agendarInputFecha" class="modal-agendar-label">
                      <i class="fa-regular fa-calendar-days"></i> ${t.lblFecha}
                    </label>
                    <input 
                      type="date" 
                      id="agendarInputFecha" 
                      class="modal-agendar-input"
                      value="${fechaDefault}"
                      min="${fechaMin}"
                    />
                  </div>
                  
                  <div class="modal-agendar-hora-col">
                    <label class="modal-agendar-label">
                      <i class="fa-regular fa-clock"></i> ${t.lblHora}
                    </label>
                    <div id="agendarSelectHoraTrigger" class="modal-agendar-hora-trigger" tabindex="0" role="button" aria-haspopup="true" aria-expanded="false">
                      <span id="agendarHoraValDisplay" class="modal-agendar-hora-val">
                        <i class="fa-regular fa-clock"></i> 04:30 PM
                      </span>
                      <i class="fa-solid fa-chevron-up hora-arrow"></i>
                    </div>
                    <input type="hidden" id="agendarSelectHora" value="04:30 PM" />

                    <!-- Popover de Horarios con Slots / Pills Elegantes -->
                    <div id="agendarHoraPopover" class="modal-agendar-hora-popover">
                      <div class="hora-popover-header">
                        <span>${t.tituloHorarios}</span>
                        <i class="fa-solid fa-business-time" style="color: var(--mco);"></i>
                      </div>

                      <div class="hora-popover-section">
                        <div class="hora-popover-tag"><i class="fa-solid fa-sun"></i> ${t.turnoManana}</div>
                        <div class="hora-popover-grid">
                          <button type="button" class="hora-pill" data-hora="09:00 AM">09:00 AM</button>
                          <button type="button" class="hora-pill" data-hora="10:30 AM">10:30 AM</button>
                          <button type="button" class="hora-pill" data-hora="12:00 PM">12:00 PM</button>
                        </div>
                      </div>

                      <div class="hora-popover-section">
                        <div class="hora-popover-tag"><i class="fa-solid fa-cloud-sun"></i> ${t.turnoTarde}</div>
                        <div class="hora-popover-grid">
                          <button type="button" class="hora-pill" data-hora="03:00 PM">03:00 PM</button>
                          <button type="button" class="hora-pill hora-pill-active" data-hora="04:30 PM">04:30 PM</button>
                          <button type="button" class="hora-pill" data-hora="06:00 PM">06:00 PM</button>
                        </div>
                        <div class="hora-popover-grid" style="margin-top: 0.45rem;">
                          <button type="button" class="hora-pill" data-hora="07:30 PM">07:30 PM</button>
                          <button type="button" class="hora-pill hora-pill-wide" style="grid-column: span 2;" data-hora="${t.horaACoordinar}">
                            <i class="fa-solid fa-handshake"></i> ${t.horaACoordinar}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>

          <!-- Footer: Confidencialidad y Botón de Envío -->
          <div class="modal-agendar-footer">
            <div class="modal-agendar-summary">
              <div class="modal-agendar-info-text">
                <i class="fa-solid fa-calendar-check"></i>
                <span>${t.infoDirecta}</span>
              </div>
              <span class="modal-agendar-badge-confidencial">
                <i class="fa-solid fa-shield-halved"></i> ${t.confidencial}
              </span>
            </div>

            <button type="submit" id="agendarBtnSubmitWa" class="modal-agendar-submit">
              <i class="fa-brands fa-whatsapp" style="font-size: 1.35rem;"></i> 
              <span>${t.btnSubmit}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);
  modalEl = document.getElementById('wi_modal_agendar');

  // Inicializar wiSelect en temas y modalidades
  try {
    wiSelectMotivoInst = wiSelect('#agendarSelectMotivo', {
      placeholder: t.placeholderTema,
      searchPlaceholder: t.buscarTema
    });

    wiSelectModalidadInst = wiSelect('#agendarSelectModalidad', {
      placeholder: t.placeholderModalidad,
      searchPlaceholder: t.buscarModalidad
    });
  } catch (err) {
    console.warn('wiSelect notice:', err);
  }

  // Controlador Interactivo del Selector de Horarios (Popover con Slots)
  const horaTrigger = document.getElementById('agendarSelectHoraTrigger');
  const horaPopover = document.getElementById('agendarHoraPopover');
  const horaHiddenInput = document.getElementById('agendarSelectHora');
  const horaDisplay = document.getElementById('agendarHoraValDisplay');

  function abrirHoraPopover() {
    horaPopover?.classList.add('hora-popover-open');
    horaTrigger?.classList.add('hora-trigger-open');
    horaTrigger?.setAttribute('aria-expanded', 'true');
  }

  function cerrarHoraPopover() {
    horaPopover?.classList.remove('hora-popover-open');
    horaTrigger?.classList.remove('hora-trigger-open');
    horaTrigger?.setAttribute('aria-expanded', 'false');
  }

  horaTrigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (horaPopover?.classList.contains('hora-popover-open')) {
      cerrarHoraPopover();
    } else {
      abrirHoraPopover();
    }
  });

  horaTrigger?.addEventListener('keydown', (e) => {
    if (['Enter', ' '].includes(e.key)) {
      e.preventDefault();
      horaTrigger.click();
    } else if (e.key === 'Escape') {
      cerrarHoraPopover();
    }
  });

  horaPopover?.addEventListener('click', (e) => {
    e.stopPropagation();
    const btn = e.target.closest('.hora-pill');
    if (!btn) return;
    const horaVal = btn.getAttribute('data-hora') || '04:30 PM';
    if (horaHiddenInput) horaHiddenInput.value = horaVal;
    if (horaDisplay) {
      horaDisplay.innerHTML = `<i class="fa-regular fa-clock"></i> ${horaVal}`;
    }
    horaPopover.querySelectorAll('.hora-pill').forEach(p => p.classList.remove('hora-pill-active'));
    btn.classList.add('hora-pill-active');
    cerrarHoraPopover();
  });

  document.addEventListener('click', (e) => {
    if (!horaPopover?.contains(e.target) && !horaTrigger?.contains(e.target)) {
      cerrarHoraPopover();
    }
  });

  // Listeners de Cierre
  document.getElementById('btnCerrarModalAgendar')?.addEventListener('click', cerrarModalAgendar);
  modalEl?.addEventListener('click', (e) => {
    if (e.target === modalEl) cerrarModalAgendar();
  });

  const selMotivo = document.getElementById('agendarSelectMotivo');

  // Envío a WhatsApp con Validación de wiTip y Atribución Web
  window.__enviarAgendamientoModal = function() {
    const inputNombre = document.getElementById('agendarInputNombre');
    const inputCiudad = document.getElementById('agendarInputCiudad');
    const inputCelular = document.getElementById('agendarInputCelular');
    const inputFecha = document.getElementById('agendarInputFecha');

    const nombre = inputNombre?.value?.trim();
    if (!nombre) {
      wiTip(inputNombre, t.valNombre, 'error', 2800);
      inputNombre?.focus();
      return;
    }

    const celular = inputCelular?.value?.trim();
    if (!celular) {
      wiTip(inputCelular, t.valCelular, 'error', 2800);
      inputCelular?.focus();
      return;
    }

    const ciudad = inputCiudad?.value?.trim();
    if (!ciudad) {
      wiTip(inputCiudad, t.valCiudad, 'error', 2800);
      inputCiudad?.focus();
      return;
    }

    const fechaRaw = inputFecha?.value;
    if (!fechaRaw) {
      wiTip(inputFecha, t.valFecha, 'error', 2800);
      inputFecha?.focus();
      return;
    }

    const valMotivo = selMotivo?.value;
    const serv = t.temas.find(s => s.id === valMotivo) || t.temas[0];
    const nomServicio = serv.nombre;

    const modalidad = document.getElementById('agendarSelectModalidad')?.value || t.modalidades[0]?.nombre;
    const fechaTexto = formatearFechaEspanol(fechaRaw);
    const hora = document.getElementById('agendarSelectHora')?.value || '04:30 PM';

    // Mensaje estructurado con atribución explícita a la página web
    const mensaje = `${t.waSaludo}\n\n` +
      `${t.waTema} ${nomServicio}\n` +
      `${t.waModalidad} ${modalidad}\n` +
      `${t.waCiudad} ${ciudad}\n` +
      `${t.waPaciente} ${nombre}\n` +
      `${t.waCelular} ${celular}\n` +
      `${t.waFecha} ${fechaTexto}\n` +
      `${t.waHora} ${hora}\n\n` +
      `${t.waPregunta}\n` +
      `${t.waAtribucion}\n` +
      `${t.waDespedida}`;

    const url = `https://wa.me/${datosNegocio.whatsappLimpio}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    cerrarModalAgendar();
  };

  return modalEl;
}

/**
 * Abre el modal interactivo de agendamiento
 * @param {string|null} motivoOId - Tema del hero ('ansiedad', 'pareja', 'apoyo') o ID de servicio
 */
export function abrirModalAgendar(motivoOId = null) {
  const modal = asegurarModalEnDOM();
  if (!modal) return;

  const motivoGuardado = motivoOId || (typeof localStorage !== 'undefined' ? localStorage.getItem('psicologia_motivo_activo') : '');
  const selMotivo = document.getElementById('agendarSelectMotivo');

  if (selMotivo && motivoGuardado) {
    const term = motivoGuardado.toLowerCase();
    let targetId = null;

    if (term.includes('ansiedad') || term.includes('estres')) {
      targetId = 'ansiedad-tcc';
    } else if (term.includes('pareja') || term.includes('familiar')) {
      targetId = 'pareja-familiar';
    } else if (term.includes('apoyo') || term.includes('triste') || term.includes('desahogo') || term.includes('emocion')) {
      targetId = 'apoyo-emocional';
    } else if (term.includes('otro') || term.includes('general')) {
      targetId = 'otro-motivo';
    }

    if (targetId) {
      if (wiSelectMotivoInst && typeof wiSelectMotivoInst.setValue === 'function') {
        wiSelectMotivoInst.setValue(targetId);
      } else {
        selMotivo.value = targetId;
        selMotivo.dispatchEvent(new Event('change'));
      }
    }
  }

  modal.style.display = 'flex';
  modal.classList.add('active', 'open');
  document.body.classList.add('modal-open');
}

/**
 * Cierra el modal de agendamiento y restablece el scroll
 */
export function cerrarModalAgendar() {
  const modal = document.getElementById('wi_modal_agendar');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active', 'open');
  }
  document.body.classList.remove('modal-open');
}

/**
 * Pre-llena datos provenientes del Test Empático y abre el modal
 * @param {Object} datos
 */
export function prellenarYAgendar(datos = {}) {
  abrirModalAgendar(datos.motivoId || null);
  if (datos.nombre) {
    const inputNombre = document.getElementById('agendarInputNombre');
    if (inputNombre) inputNombre.value = datos.nombre;
  }
}

// Registro global
if (typeof window !== 'undefined') {
  window.abrirModalAgendar = abrirModalAgendar;
  window.cerrarModalAgendar = cerrarModalAgendar;
  window.abrirModalPedido = abrirModalAgendar;
  window.cerrarModalPedido = cerrarModalAgendar;
}

export default {
  abrirModalAgendar,
  cerrarModalAgendar,
  prellenarYAgendar
};
