// src/feature/inicio/lib/modales/test/test.js
// 🎯 Hijo 2: Controlador del Test de Orientación Empático en 2 Columnas
// Columna 1: Formulario por etapas (desahogo libre + datos)
// Columna 2: Preview en vivo fijo/sticky con animación "Escribiendo..." (ChatWii AI / Plantillas)

import { resolverTextos, obtenerIdiomaActivo } from '../idioma/idioma.js';
import { crearEstadoTest } from './preguntas.js';
import { solicitarDevolucionChatWii, construirUrlWhatsApp } from './chatwii.js';
import { wiSelect } from '../../../../../core/widev/wiselect.js';
import { wiTip } from '../../../../../core/widev/witip.js';
import testCss from './test.css?inline';
import es from './idioma/es.json';
import en from './idioma/en.json';

let modalEl = null;
let estadoTest = null;
let wiSelectEmocionInst = null;
let wiSelectModalidadInst = null;
let previewDebounceTimer = null;
let currentPreviewRequestId = 0;
let typewriterTimer = null;

/**
 * Escribe el texto en el elemento en dos párrafos palabra por palabra con ritmo pausado y empático
 * @param {HTMLElement} elemento
 * @param {string} texto
 * @param {number} [velocidadMs=65]
 * @param {Function} [alFinalizar]
 */
function escribirPalabraPorPalabra(elemento, texto, velocidadMs = 65, alFinalizar = null) {
  if (!elemento) return;

  if (typewriterTimer) {
    clearInterval(typewriterTimer);
    typewriterTimer = null;
  }

  // Separar los párrafos usando salto doble
  const parrafosRaw = (texto || '').trim().split(/\n\s*\n/);
  const parrafos = parrafosRaw.filter(p => p.trim().length > 0);

  elemento.innerHTML = '';
  elemento.style.opacity = '1';

  if (parrafos.length === 0) return;

  // Creamos los elementos <p> estilizados dentro del contenedor
  const pElements = parrafos.map(() => {
    const p = document.createElement('p');
    p.className = 'modal-test-preview-p';
    elemento.appendChild(p);
    return p;
  });

  // Lista plana de tareas: { pIdx, word }
  const tareas = [];
  parrafos.forEach((parr, pIdx) => {
    const palabras = parr.trim().split(/\s+/).filter(Boolean);
    palabras.forEach(word => {
      tareas.push({ pIdx, word });
    });
  });

  let tIdx = 0;
  typewriterTimer = setInterval(() => {
    if (tIdx < tareas.length) {
      const { pIdx, word } = tareas[tIdx];
      const targetP = pElements[pIdx];
      targetP.textContent += (targetP.textContent ? ' ' : '') + word;
      tIdx++;
    } else {
      clearInterval(typewriterTimer);
      typewriterTimer = null;
      if (typeof alFinalizar === 'function') {
        alFinalizar();
      }
    }
  }, velocidadMs);
}

function obtenerTextos() {
  return resolverTextos({ es, en });
}

function asegurarEstilosEnDOM() {
  if (document.getElementById('wi_modal_test_styles')) return;
  const style = document.createElement('style');
  style.id = 'wi_modal_test_styles';
  style.innerHTML = testCss;
  document.head.appendChild(style);
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

function asegurarModalEnDOM() {
  asegurarEstilosEnDOM();

  if (document.getElementById('wi_modal_test')) {
    return document.getElementById('wi_modal_test');
  }

  const t = obtenerTextos();

  const html = `
    <div id="wi_modal_test" class="wiModal" role="dialog" aria-modal="true" aria-labelledby="modalTestTitle" style="display: none;">
      <div class="modal-test-dialog">
        
        <!-- Header -->
        <div class="modal-test-header">
          <div>
            <span class="modal-test-badge">
              <i class="fa-solid fa-stethoscope"></i> ${t.badge}
            </span>
            <h3 id="modalTestTitle" class="modal-test-title">
              ${t.titulo}
            </h3>
            <p class="modal-test-subtitle">
              ${t.subtitulo}
            </p>
          </div>
          <button id="btnCerrarModalTest" class="modal-test-close" type="button" aria-label="${t.cerrar}">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Layout en 2 Columnas -->
        <div class="modal-test-grid">
          
          <!-- COLUMNA 1: Formulario por Etapas -->
          <div id="testColForm" class="modal-test-col-form">
            <!-- Renderizado dinámicamente por renderizarEtapa() -->
          </div>

          <!-- COLUMNA 2 (Fija / Sticky): Preview Empático en Vivo -->
          <div class="modal-test-col-preview">
            
            <!-- Barra de Progreso Superior -->
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.76rem; font-weight: 700; color: var(--tx2, #64748b); margin-bottom: 0.35rem;">
                <span id="testProgressMetaLabel">${t.etapa1Progreso}</span>
                <span id="testProgressPercentLabel">50%</span>
              </div>
              <div class="modal-test-progress-bar-bg">
                <div id="testProgressBarFill" class="modal-test-progress-bar-fill"></div>
              </div>
            </div>

            <!-- Card del Resultado en Vivo -->
            <div class="modal-test-card-preview">
              <div class="modal-test-preview-header">
                <span class="modal-test-preview-title" id="testPreviewTitle">
                  <i class="fa-solid fa-chart-line"></i> ${t.previewTitulo}
                </span>
              </div>

              <!-- Texto Empático en Vivo (Dos Párrafos) -->
              <div id="testPreviewBody" class="modal-test-preview-body">
                ${(t.previewInicial || '').split('\n\n').map(p => `<p class="modal-test-preview-p">${p.trim()}</p>`).join('')}
              </div>

              <div id="testPreviewBadge" class="modal-test-preview-profile-badge" style="display: none;">
                <i class="fa-solid fa-shield-heart"></i>
                <span id="testPreviewBadgeText">Escucha Activa</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);
  modalEl = document.getElementById('wi_modal_test');

  // Listeners de Cierre
  document.getElementById('btnCerrarModalTest')?.addEventListener('click', cerrarModalTest);
  modalEl?.addEventListener('click', (e) => {
    if (e.target === modalEl) cerrarModalTest();
  });

  return modalEl;
}

/**
 * Renderiza la Etapa 1 o Etapa 2 dentro de la Columna 1
 */
function renderizarEtapa() {
  const colForm = document.getElementById('testColForm');
  if (!colForm || !estadoTest) return;

  const t = obtenerTextos();
  const progressBarFill = document.getElementById('testProgressBarFill');
  const progressMeta = document.getElementById('testProgressMetaLabel');
  const progressPercent = document.getElementById('testProgressPercentLabel');
  const previewBadge = document.getElementById('testPreviewBadge');

  if (estadoTest.etapa === 1) {
    // ── ETAPA 1: Tu Vivencia Emocional y Desahogo ────────────────
    if (progressBarFill) progressBarFill.style.width = '50%';
    if (progressMeta) progressMeta.textContent = t.etapa1Progreso;
    if (progressPercent) progressPercent.textContent = '50%';
    if (previewBadge) previewBadge.style.display = 'none';

    colForm.innerHTML = `
      <!-- 1. ¿Cómo te sientes hoy? (wiSelect 4 opciones) -->
      <div class="modal-test-field">
        <label for="testSelectEmocion" class="modal-test-label">
          <i class="fa-solid fa-heart-pulse"></i> ${t.lblEmocion}
        </label>
        <select id="testSelectEmocion" class="modal-test-input">
          <option value="" disabled ${!estadoTest.emocionId ? 'selected' : ''}>${t.placeholderEmocion}</option>
          ${(t.opcionesEmocion || []).map(opt => {
            const isSel = estadoTest.emocionId === opt.id;
            return `<option value="${opt.id}" ${isSel ? 'selected' : ''}>${opt.texto}</option>`;
          }).join('')}
        </select>
      </div>

      <!-- 2. Textarea de Desahogo Libre -->
      <div class="modal-test-field">
        <label for="testInputDesahogo" class="modal-test-label">
          <i class="fa-solid fa-feather-pointed"></i> ${t.lblDesahogo}
        </label>
        <p style="font-size: 0.78rem; color: var(--tx2, #64748b); margin: 0 0 0.4rem 0;">
          ${t.subDesahogo}
        </p>
        <textarea 
          id="testInputDesahogo" 
          class="modal-test-textarea" 
          placeholder="${t.placeholderDesahogo}"
        >${estadoTest.desahogo || ''}</textarea>
      </div>

      <!-- 3. ¿Desde cuándo sientes esto? (Selector Popover Especializado organizado como Agendar) -->
      <div class="modal-test-field">
        <label for="testTiempoTrigger" class="modal-test-label">
          <i class="fa-regular fa-clock"></i> ${t.lblTiempo}
        </label>
        <div class="modal-test-tiempo-col" id="testTiempoCol">
          <button type="button" id="testTiempoTrigger" class="modal-test-tiempo-trigger" aria-haspopup="dialog" aria-expanded="false">
            <span class="modal-test-tiempo-val">
              <i class="fa-regular fa-clock"></i>
              <span id="testTiempoValLabel">${estadoTest.tiempo || t.tiempos[0]}</span>
            </span>
            <i class="fa-solid fa-chevron-down tiempo-arrow"></i>
          </button>

          <div id="testTiempoPopover" class="modal-test-tiempo-popover" role="dialog" aria-label="${t.tituloTiempos}">
            <div class="tiempo-popover-header">
              <span><i class="fa-regular fa-clock"></i> ${t.tituloTiempos}</span>
              <span style="font-size: 0.72rem; opacity: 0.75;">${t.tiempos.length} opciones</span>
            </div>

            <!-- Sección 1: Reciente / Pocos días -->
            <div class="tiempo-popover-section">
              <div class="tiempo-popover-tag">
                <i class="fa-solid fa-bolt"></i> ${t.tiempoReciente}
              </div>
              <div class="tiempo-popover-list">
                ${(t.tiempos || []).slice(0, 2).map((tmp, idx) => {
                  const isSel = (estadoTest.tiempo === tmp) || (!estadoTest.tiempo && idx === 0);
                  return `
                    <button type="button" class="tiempo-pill ${isSel ? 'tiempo-pill-active' : ''}" data-tiempo="${tmp}">
                      ${tmp}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Sección 2: Prolongado / Continuo -->
            <div class="tiempo-popover-section">
              <div class="tiempo-popover-tag">
                <i class="fa-regular fa-calendar-check"></i> ${t.tiempoProlongado}
              </div>
              <div class="tiempo-popover-list">
                ${(t.tiempos || []).slice(2).map(tmp => {
                  const isSel = (estadoTest.tiempo === tmp);
                  return `
                    <button type="button" class="tiempo-pill ${isSel ? 'tiempo-pill-active' : ''}" data-tiempo="${tmp}">
                      ${tmp}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Botón Continuar -->
      <button type="button" id="btnTestContinuarEtapa2" class="modal-test-btn-next">
        <span>${t.btnSiguienteEtapa}</span> <i class="fa-solid fa-arrow-right"></i>
      </button>
    `;

    // Destruir instancia previa de wiSelect si existía
    if (wiSelectEmocionInst) {
      try { wiSelectEmocionInst.destroy(); } catch (e) {}
      wiSelectEmocionInst = null;
    }

    // Inicializar wiSelect en el selector de emoción con debounce de 500ms
    try {
      wiSelectEmocionInst = wiSelect('#testSelectEmocion', {
        placeholder: t.placeholderEmocion,
        searchPlaceholder: 'Buscar cómo te sientes...',
        onChange: (val) => {
          estadoTest.emocionId = val;
          const found = (t.opcionesEmocion || []).find(o => o.id === val);
          estadoTest.emocionTexto = found ? found.texto : val;
          programarActualizacionPreview(500);
        }
      });
    } catch (e) {}

    // Establecer tiempo inicial por defecto si aún no está asignado
    if (!estadoTest.tiempo && t.tiempos && t.tiempos.length > 0) {
      estadoTest.tiempo = t.tiempos[0];
    }

    // Control del Popover Especializado de Tiempo
    const tiempoTrigger = document.getElementById('testTiempoTrigger');
    const tiempoPopover = document.getElementById('testTiempoPopover');
    const tiempoValLabel = document.getElementById('testTiempoValLabel');
    const tiempoCol = document.getElementById('testTiempoCol');

    const toggleTiempoPopover = (forzarEstado) => {
      const abrir = forzarEstado !== undefined ? forzarEstado : !tiempoPopover?.classList.contains('tiempo-popover-open');
      tiempoPopover?.classList.toggle('tiempo-popover-open', abrir);
      tiempoTrigger?.classList.toggle('tiempo-trigger-open', abrir);
      tiempoTrigger?.setAttribute('aria-expanded', String(abrir));
    };

    tiempoTrigger?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTiempoPopover();
    });

    const onDocClickTiempo = (e) => {
      if (tiempoCol && !tiempoCol.contains(e.target)) {
        toggleTiempoPopover(false);
      }
    };
    document.addEventListener('click', onDocClickTiempo);

    // Selección de pills de duración con debounce y preview reactivo
    tiempoPopover?.querySelectorAll('.tiempo-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        const nuevoTiempo = pill.getAttribute('data-tiempo');
        if (nuevoTiempo) {
          estadoTest.tiempo = nuevoTiempo;
          if (tiempoValLabel) tiempoValLabel.textContent = nuevoTiempo;

          tiempoPopover.querySelectorAll('.tiempo-pill').forEach(p => p.classList.remove('tiempo-pill-active'));
          pill.classList.add('tiempo-pill-active');

          toggleTiempoPopover(false);
          programarActualizacionPreview(500);
        }
      });
    });

    // Listeners del Textarea con Debounce de 500ms tras dejar de escribir (input, keyup, blur)
    const textarea = document.getElementById('testInputDesahogo');
    const onDesahogoActivity = (e) => {
      estadoTest.desahogo = e.target.value;
      programarActualizacionPreview(500);
    };

    textarea?.addEventListener('input', onDesahogoActivity);
    textarea?.addEventListener('keyup', onDesahogoActivity);
    textarea?.addEventListener('blur', onDesahogoActivity);

    // Listener del Botón Continuar a Etapa 2
    document.getElementById('btnTestContinuarEtapa2')?.addEventListener('click', () => {
      if (!estadoTest.emocionId) {
        const triggerEl = document.querySelector('#testSelectEmocion + .wi-select-trigger') || document.getElementById('testSelectEmocion');
        wiTip(triggerEl, t.valEmocion, 'error', 2600);
        return;
      }
      estadoTest.etapa = 2;
      renderizarEtapa();
    });

  } else {
    // ── ETAPA 2: Coordinación de Cita y Datos de Contacto ────────
    if (progressBarFill) progressBarFill.style.width = '100%';
    if (progressMeta) progressMeta.textContent = t.etapa2Progreso;
    if (progressPercent) progressPercent.textContent = '100%';

    const fechaDefault = estadoTest.fecha || obtenerFechaPorDefecto();
    const fechaMin = obtenerFechaMinima();

    colForm.innerHTML = `
      <!-- Fila 1: 4. Tu Nombre Completo + 5. Correo Electrónico -->
      <div class="modal-test-grid-2">
        <div class="modal-test-field">
          <label for="testInputNombre" class="modal-test-label">
            <i class="fa-regular fa-user"></i> ${t.lblNombre}
          </label>
          <input 
            type="text" 
            id="testInputNombre" 
            class="modal-test-input" 
            placeholder="${t.placeholderNombre}" 
            value="${estadoTest.nombre || ''}"
          />
        </div>

        <div class="modal-test-field">
          <label for="testInputCorreo" class="modal-test-label">
            <i class="fa-regular fa-envelope"></i> ${t.lblCorreo}
          </label>
          <input 
            type="email" 
            id="testInputCorreo" 
            class="modal-test-input" 
            placeholder="${t.placeholderCorreo}" 
            value="${estadoTest.correo || ''}"
          />
        </div>
      </div>

      <!-- Fila 2: 6. Celular o WhatsApp + 7. Modalidad de Atención -->
      <div class="modal-test-grid-2">
        <div class="modal-test-field">
          <label for="testInputCelular" class="modal-test-label">
            <i class="fa-brands fa-whatsapp"></i> ${t.lblCelular}
          </label>
          <input 
            type="tel" 
            id="testInputCelular" 
            class="modal-test-input" 
            placeholder="${t.placeholderCelular}" 
            value="${estadoTest.celular || ''}"
          />
        </div>

        <div class="modal-test-field">
          <label for="testSelectModalidad" class="modal-test-label">
            <i class="fa-solid fa-globe"></i> ${t.lblModalidad}
          </label>
          <select id="testSelectModalidad" class="modal-test-input modal-test-clean-select">
            ${t.modalidades.map((m, idx) => {
              const isSel = (estadoTest.modalidad === m) || (idx === 0 && !estadoTest.modalidad);
              return `<option value="${m}" ${isSel ? 'selected' : ''}>${m}</option>`;
            }).join('')}
          </select>
        </div>
      </div>

      <!-- Fila 3: 8. Fecha y Selector Especializado de Horarios -->
      <div class="modal-test-grid-2">
        <div class="modal-test-field">
          <label for="testInputFecha" class="modal-test-label">
            <i class="fa-regular fa-calendar-days"></i> ${t.lblFecha}
          </label>
          <input 
            type="date" 
            id="testInputFecha" 
            class="modal-test-input" 
            value="${fechaDefault}" 
            min="${fechaMin}" 
          />
        </div>

        <!-- Selector Especializado de Horarios con Slots / Pills idéntico a Modal Agendar -->
        <div class="modal-test-hora-col" id="testHoraCol">
          <label class="modal-test-label">
            <i class="fa-regular fa-clock"></i> ${t.lblHora}
          </label>
          <div id="testSelectHoraTrigger" class="modal-test-hora-trigger" tabindex="0" role="button" aria-haspopup="true" aria-expanded="false">
            <span id="testHoraValDisplay" class="modal-test-hora-val">
              <i class="fa-regular fa-clock"></i> ${estadoTest.hora || '04:30 PM'}
            </span>
            <i class="fa-solid fa-chevron-up hora-arrow"></i>
          </div>
          <input type="hidden" id="testSelectHora" value="${estadoTest.hora || '04:30 PM'}" />

          <!-- Popover de Horarios con Slots / Pills que abre hacia ARRIBA -->
          <div id="testHoraPopover" class="modal-test-hora-popover">
            <div class="hora-popover-header">
              <span>${t.tituloHorarios || 'Horarios Disponibles'}</span>
              <i class="fa-solid fa-business-time" style="color: var(--mco, #0284c7);"></i>
            </div>

            <div class="hora-popover-section">
              <div class="hora-popover-tag"><i class="fa-solid fa-sun"></i> ${t.turnoManana || 'Mañana'}</div>
              <div class="hora-popover-grid">
                <button type="button" class="hora-pill ${(estadoTest.hora === '09:00 AM') ? 'hora-pill-active' : ''}" data-hora="09:00 AM">09:00 AM</button>
                <button type="button" class="hora-pill ${(estadoTest.hora === '10:30 AM') ? 'hora-pill-active' : ''}" data-hora="10:30 AM">10:30 AM</button>
                <button type="button" class="hora-pill ${(estadoTest.hora === '12:00 PM') ? 'hora-pill-active' : ''}" data-hora="12:00 PM">12:00 PM</button>
              </div>
            </div>

            <div class="hora-popover-section">
              <div class="hora-popover-tag"><i class="fa-solid fa-cloud-sun"></i> ${t.turnoTarde || 'Tarde / Noche'}</div>
              <div class="hora-popover-grid">
                <button type="button" class="hora-pill ${(estadoTest.hora === '03:00 PM') ? 'hora-pill-active' : ''}" data-hora="03:00 PM">03:00 PM</button>
                <button type="button" class="hora-pill ${(estadoTest.hora === '04:30 PM' || !estadoTest.hora) ? 'hora-pill-active' : ''}" data-hora="04:30 PM">04:30 PM</button>
                <button type="button" class="hora-pill ${(estadoTest.hora === '06:00 PM') ? 'hora-pill-active' : ''}" data-hora="06:00 PM">06:00 PM</button>
              </div>
              <div class="hora-popover-grid" style="margin-top: 0.45rem;">
                <button type="button" class="hora-pill ${(estadoTest.hora === '07:30 PM') ? 'hora-pill-active' : ''}" data-hora="07:30 PM">07:30 PM</button>
                <button type="button" class="hora-pill hora-pill-wide ${(estadoTest.hora === (t.horaACoordinar || 'A coordinar')) ? 'hora-pill-active' : ''}" style="grid-column: span 2;" data-hora="${t.horaACoordinar || 'A coordinar'}">
                  <i class="fa-solid fa-handshake"></i> ${t.horaACoordinar || 'A coordinar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Acciones de Etapa 2 -->
      <button type="button" id="btnTestSubmitWa" class="modal-test-btn-submit-wa">
        <i class="fa-brands fa-whatsapp" style="font-size: 1.3rem;"></i>
        <span>${t.btnConfirmarWa}</span>
      </button>

      <button type="button" id="btnTestVolverEtapa1" class="modal-test-btn-back">
        ${t.btnVolverEtapa1}
      </button>
    `;

    // Inicializar wiSelect en modalidad limpia (sin buscador)
    if (wiSelectModalidadInst) {
      try { wiSelectModalidadInst.destroy(); } catch (e) {}
      wiSelectModalidadInst = null;
    }
    try {
      wiSelectModalidadInst = wiSelect('#testSelectModalidad', {
        placeholder: t.placeholderModalidad,
        searchPlaceholder: '',
        onChange: (val) => {
          estadoTest.modalidad = val;
        }
      });
      if (!estadoTest.modalidad && t.modalidades.length > 0) {
        estadoTest.modalidad = t.modalidades[0];
      }
    } catch (e) {}

    // Control del Popover Especializado de Horarios (Etapa 2)
    const horaTrigger = document.getElementById('testSelectHoraTrigger');
    const horaPopover = document.getElementById('testHoraPopover');
    const horaDisplay = document.getElementById('testHoraValDisplay');
    const horaHiddenInput = document.getElementById('testSelectHora');
    const horaCol = document.getElementById('testHoraCol');

    const cerrarHoraPopover = () => {
      horaPopover?.classList.remove('hora-popover-open');
      horaTrigger?.classList.remove('hora-trigger-open');
      horaTrigger?.setAttribute('aria-expanded', 'false');
    };

    const abrirHoraPopover = () => {
      horaPopover?.classList.add('hora-popover-open');
      horaTrigger?.classList.add('hora-trigger-open');
      horaTrigger?.setAttribute('aria-expanded', 'true');
    };

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
      estadoTest.hora = horaVal;
      if (horaHiddenInput) horaHiddenInput.value = horaVal;
      if (horaDisplay) {
        horaDisplay.innerHTML = `<i class="fa-regular fa-clock"></i> ${horaVal}`;
      }
      horaPopover.querySelectorAll('.hora-pill').forEach(p => p.classList.remove('hora-pill-active'));
      btn.classList.add('hora-pill-active');
      cerrarHoraPopover();
    });

    document.addEventListener('click', (e) => {
      if (horaCol && !horaCol.contains(e.target)) {
        cerrarHoraPopover();
      }
    });

    // Inputs de Etapa 2
    document.getElementById('testInputNombre')?.addEventListener('input', (e) => {
      estadoTest.nombre = e.target.value;
    });
    document.getElementById('testInputCorreo')?.addEventListener('input', (e) => {
      estadoTest.correo = e.target.value;
    });
    document.getElementById('testInputCelular')?.addEventListener('input', (e) => {
      estadoTest.celular = e.target.value;
    });
    document.getElementById('testInputFecha')?.addEventListener('change', (e) => {
      estadoTest.fecha = e.target.value;
    });
    document.getElementById('testSelectHora')?.addEventListener('change', (e) => {
      estadoTest.hora = e.target.value;
    });

    // Botón Volver a Etapa 1
    document.getElementById('btnTestVolverEtapa1')?.addEventListener('click', () => {
      estadoTest.etapa = 1;
      renderizarEtapa();
    });

    // Envío a WhatsApp con Validación
    document.getElementById('btnTestSubmitWa')?.addEventListener('click', () => {
      const inputNombre = document.getElementById('testInputNombre');
      const inputCelular = document.getElementById('testInputCelular');
      const inputFecha = document.getElementById('testInputFecha');

      const nombre = inputNombre?.value?.trim();
      if (!nombre) {
        wiTip(inputNombre, t.valNombre, 'error', 2600);
        inputNombre?.focus();
        return;
      }

      const celular = inputCelular?.value?.trim();
      if (!celular) {
        wiTip(inputCelular, t.valCelular, 'error', 2600);
        inputCelular?.focus();
        return;
      }

      const fecha = inputFecha?.value;
      if (!fecha) {
        wiTip(inputFecha, t.valFecha, 'error', 2600);
        inputFecha?.focus();
        return;
      }

      estadoTest.nombre = nombre;
      estadoTest.celular = celular;
      estadoTest.fecha = fecha;
      estadoTest.modalidad = document.getElementById('testSelectModalidad')?.value || t.modalidades[0];
      estadoTest.hora = document.getElementById('testSelectHora')?.value || '04:30 PM';

      const urlWa = construirUrlWhatsApp(estadoTest, t);
      window.open(urlWa, '_blank', 'noopener,noreferrer');
      cerrarModalTest();
    });
  }
}

/**
 * Programa la actualización del preview con debounce de 500ms y control de concurrencia
 * para evitar colisiones ante selecciones rápidas o escritura continua en el textarea.
 * @param {number} [delayMs=500]
 */
function programarActualizacionPreview(delayMs = 500) {
  // Cancelar temporizador de debounce previo si existía
  if (previewDebounceTimer) {
    clearTimeout(previewDebounceTimer);
    previewDebounceTimer = null;
  }

  // Cancelar animación de escritura previa
  if (typewriterTimer) {
    clearInterval(typewriterTimer);
    typewriterTimer = null;
  }

  // Generar ID único de petición para anular respuestas desfasadas
  const requestId = ++currentPreviewRequestId;

  previewDebounceTimer = setTimeout(async () => {
    const previewBody = document.getElementById('testPreviewBody');
    const previewBadge = document.getElementById('testPreviewBadge');
    const previewBadgeText = document.getElementById('testPreviewBadgeText');
    const lang = obtenerIdiomaActivo();

    // Feedback visual sutil durante el procesamiento en segundo plano
    if (previewBody) previewBody.style.opacity = '0.55';

    try {
      const devolucion = await solicitarDevolucionChatWii(estadoTest, lang);

      // Si el usuario realizó otra acción mientras la respuesta estaba en vuelo, descartarla
      if (requestId !== currentPreviewRequestId) {
        return;
      }

      estadoTest.devolucionEmpatica = devolucion;

      if (previewBody) {
        escribirPalabraPorPalabra(previewBody, devolucion, 65, () => {
          if (requestId !== currentPreviewRequestId) return;
          if (previewBadge && previewBadgeText) {
            previewBadge.style.display = 'inline-flex';
            previewBadgeText.textContent = estadoTest.emocionTexto || 'Escucha Activa';
          }
        });
      }

      if (previewBadge && previewBadgeText) {
        previewBadge.style.display = 'inline-flex';
        previewBadgeText.textContent = estadoTest.emocionTexto || 'Escucha Activa';
      }
    } catch (e) {
      if (previewBody) previewBody.style.opacity = '1';
    }
  }, delayMs);
}

/**
 * Abre el modal del test
 * @param {string|null} motivoOId
 */
export function abrirModalTest(motivoOId = null) {
  const modal = asegurarModalEnDOM();
  if (!modal) return;

  estadoTest = crearEstadoTest();

  // Si viene con un motivo preseleccionado desde el Hero
  const motivoGuardado = motivoOId || (typeof localStorage !== 'undefined' ? localStorage.getItem('psicologia_motivo_activo') : '');
  if (motivoGuardado) {
    const t = obtenerTextos();
    const term = motivoGuardado.toLowerCase();
    const match = (t.opcionesEmocion || []).find(c => {
      const cId = c.id.toLowerCase();
      const cTxt = c.texto.toLowerCase();
      return cId.includes(term) || cTxt.includes(term) || (term.includes('triste') && cId === 'triste') || (term.includes('ansiedad') && cId === 'sobrepensar') || (term.includes('agotad') && cId === 'agotado');
    });
    if (match) {
      estadoTest.emocionId = match.id;
      estadoTest.emocionTexto = match.texto;
    }
  }

  renderizarEtapa();

  // Si había una emoción inicial, generar preview inmediato (sin delay)
  if (estadoTest.emocionId) {
    programarActualizacionPreview(0);
  }

  modal.style.display = 'flex';
  modal.classList.add('active', 'open');
  document.body.classList.add('modal-open');
}

/**
 * Cierra el modal del test
 */
export function cerrarModalTest() {
  const modal = document.getElementById('wi_modal_test');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active', 'open');
  }
  if (previewDebounceTimer) {
    clearTimeout(previewDebounceTimer);
    previewDebounceTimer = null;
  }
  if (typewriterTimer) {
    clearInterval(typewriterTimer);
    typewriterTimer = null;
  }
  if (wiSelectEmocionInst) {
    try { wiSelectEmocionInst.destroy(); } catch (e) {}
    wiSelectEmocionInst = null;
  }
  if (wiSelectModalidadInst) {
    try { wiSelectModalidadInst.destroy(); } catch (e) {}
    wiSelectModalidadInst = null;
  }
  document.body.classList.remove('modal-open');
}

// Registro global
if (typeof window !== 'undefined') {
  window.abrirModalTest = abrirModalTest;
  window.cerrarModalTest = cerrarModalTest;
}

export default {
  abrirModalTest,
  cerrarModalTest
};
