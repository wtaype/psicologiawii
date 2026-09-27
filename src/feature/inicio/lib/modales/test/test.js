// src/feature/inicio/lib/modales/test/test.js
// 🎯 Hijo 2: Controlador del Test de Orientación Psicológica Empático (ChatWii AI)
// Modal de 820px, 7 pasos ramificados, micro-feedback emocional, bilingüe y 0 KiB de impacto inicial.

import { resolverTextos, obtenerIdiomaActivo } from '../idioma/idioma.js';
import {
  TOTAL_PASOS,
  crearEstadoTest,
  resolverPasoActual,
  puedeAvanzar
} from './preguntas.js';
import { generarOrientacionChatWii } from './chatwii.js';
import testCss from './test.css?inline';
import es from './idioma/es.json';
import en from './idioma/en.json';

let modalEl = null;
let estadoTest = null;

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
              <i class="fa-solid fa-clipboard-question"></i> ${t.badge}
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

        <!-- Barra de Progreso -->
        <div id="testProgressWrap" class="modal-test-progress-wrap">
          <div class="modal-test-progress-meta">
            <span id="testStepLabel">${t.paso} 1 ${t.de} ${TOTAL_PASOS}</span>
            <span id="testPercentLabel">14%</span>
          </div>
          <div class="modal-test-progress-bar-bg">
            <div id="testProgressBarFill" class="modal-test-progress-bar-fill"></div>
          </div>
        </div>

        <!-- Contenedor Dinámico de Preguntas y Respuestas -->
        <div id="testDynamicBody">
          <!-- Inyectado por renderizarPaso() -->
        </div>

        <!-- Navegación Inferior -->
        <div id="testNavWrap" class="modal-test-nav">
          <button type="button" id="btnTestAtras" class="modal-test-btn-back" style="display: none;">
            <i class="fa-solid fa-arrow-left"></i> <span>${t.btnAtras}</span>
          </button>
          <div style="flex: 1;"></div>
          <button type="button" id="btnTestContinuar" class="modal-test-btn-next">
            <span>${t.btnContinuar}</span> <i class="fa-solid fa-arrow-right"></i>
          </button>
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

  // Listeners de Navegación
  document.getElementById('btnTestAtras')?.addEventListener('click', retrocederPaso);
  document.getElementById('btnTestContinuar')?.addEventListener('click', avanzarPaso);

  return modalEl;
}

/**
 * Renderiza el paso actual dentro de #testDynamicBody
 */
function renderizarPaso() {
  const container = document.getElementById('testDynamicBody');
  if (!container || !estadoTest) return;

  const t = obtenerTextos();
  const pasoConfig = resolverPasoActual(t, estadoTest);
  if (!pasoConfig) return;

  const paso = estadoTest.pasoActual;
  const pct = Math.round((paso / TOTAL_PASOS) * 100);

  // Actualizar barra de progreso
  const stepLabel = document.getElementById('testStepLabel');
  const pctLabel = document.getElementById('testPercentLabel');
  const barFill = document.getElementById('testProgressBarFill');
  if (stepLabel) stepLabel.textContent = `${t.paso} ${paso} ${t.de} ${TOTAL_PASOS}`;
  if (pctLabel) pctLabel.textContent = `${pct}%`;
  if (barFill) barFill.style.width = `${pct}%`;

  // Control de visibilidad del botón Atrás
  const btnAtras = document.getElementById('btnTestAtras');
  if (btnAtras) {
    btnAtras.style.display = paso > 1 ? 'inline-flex' : 'none';
  }

  // Texto del botón Continuar / Finalizar
  const btnContinuar = document.getElementById('btnTestContinuar');
  if (btnContinuar) {
    btnContinuar.innerHTML = paso === TOTAL_PASOS
      ? `<span>${t.btnFinalizar}</span> <i class="fa-solid fa-sparkles"></i>`
      : `<span>${t.btnContinuar}</span> <i class="fa-solid fa-arrow-right"></i>`;
  }

  // Si es el paso 7 (Nombre y Turno)
  if (pasoConfig.tipo === 'formulario_final') {
    container.innerHTML = `
      <div class="modal-test-question-box">
        <h4 class="modal-test-question-title">${pasoConfig.titulo}</h4>
        <p class="modal-test-question-sub">${pasoConfig.sub}</p>
      </div>

      <div class="modal-test-empathy-pill">
        <i class="fa-solid fa-heart-circle-check modal-test-empathy-icon"></i>
        <span class="modal-test-empathy-text">${pasoConfig.empathy}</span>
      </div>

      <div style="margin-bottom: 1.2rem;">
        <label for="testInputNombre" class="modal-agendar-label" style="margin-bottom: 0.45rem;">
          <i class="fa-regular fa-user"></i> ${pasoConfig.lblNombre}
        </label>
        <input 
          type="text" 
          id="testInputNombre" 
          class="modal-test-input" 
          placeholder="${pasoConfig.placeholderNombre}" 
          value="${pasoConfig.nombreActual || ''}"
        />
      </div>

      <div style="margin-bottom: 1.2rem;">
        <label class="modal-agendar-label" style="margin-bottom: 0.5rem;">
          <i class="fa-regular fa-clock"></i> ${pasoConfig.lblTurno}
        </label>
        <div class="modal-test-options-grid">
          ${pasoConfig.turnos.map(turno => {
            const isActive = estadoTest.respuestas.turnoId === turno.id;
            return `
              <button type="button" class="modal-test-option-btn ${isActive ? 'active' : ''}" data-turno-id="${turno.id}" data-turno-nombre="${turno.nombre}">
                <i class="fa-regular fa-circle-check modal-test-option-icon"></i>
                <div>
                  <span class="modal-test-option-title">${turno.nombre}</span>
                </div>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Listeners del paso 7
    const inputNombre = document.getElementById('testInputNombre');
    inputNombre?.addEventListener('input', (e) => {
      estadoTest.respuestas.nombrePaciente = e.target.value.trim();
    });

    container.querySelectorAll('[data-turno-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('[data-turno-id]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        estadoTest.respuestas.turnoId = btn.dataset.turnoId;
        estadoTest.respuestas.turnoTexto = btn.dataset.turnoNombre;
      });
    });

    return;
  }

  // Pasos 1 a 6 (Selección con Micro-Feedback Empático)
  let microEmpathyHtml = '';
  const respuestaPrevia = estadoTest.respuestas[`${pasoConfig.claveRespuesta}Empathy`];
  if (respuestaPrevia) {
    microEmpathyHtml = `
      <div class="modal-test-empathy-pill" id="testEmpathyBox">
        <i class="fa-solid fa-heart-circle-check modal-test-empathy-icon"></i>
        <span class="modal-test-empathy-text">${respuestaPrevia}</span>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="modal-test-question-box">
      <h4 class="modal-test-question-title">${pasoConfig.titulo}</h4>
      <p class="modal-test-question-sub">${pasoConfig.sub}</p>
    </div>

    <div id="testEmpathyContainer">
      ${microEmpathyHtml}
    </div>

    <div class="modal-test-options-grid">
      ${pasoConfig.opciones.map(opt => {
        const isActive = estadoTest.respuestas[`${pasoConfig.claveRespuesta}Id`] === opt.id;
        return `
          <button type="button" class="modal-test-option-btn ${isActive ? 'active' : ''}" 
                  data-opt-id="${opt.id}" 
                  data-opt-titulo="${opt.titulo}"
                  data-opt-empathy="${opt.empathy || ''}">
            <i class="${opt.icono || 'fa-solid fa-circle-check'} modal-test-option-icon"></i>
            <div>
              <span class="modal-test-option-title">${opt.titulo}</span>
              ${opt.desc ? `<span class="modal-test-option-desc">${opt.desc}</span>` : ''}
            </div>
          </button>
        `;
      }).join('')}
    </div>
  `;

  // Listeners de Opciones (Al hacer clic, muestra el micro-feedback empático y marca activo)
  container.querySelectorAll('[data-opt-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('[data-opt-id]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const optId = btn.dataset.optId;
      const optTitulo = btn.dataset.optTitulo;
      const empathy = btn.dataset.optEmpathy;

      // Registrar respuesta
      estadoTest.respuestas[`${pasoConfig.claveRespuesta}Id`] = optId;
      estadoTest.respuestas[`${pasoConfig.claveRespuesta}Texto`] = optTitulo;
      estadoTest.respuestas[`${pasoConfig.claveRespuesta}Empathy`] = empathy;

      // Desplegar micro-feedback empático
      const empathyContainer = document.getElementById('testEmpathyContainer');
      if (empathyContainer && empathy) {
        empathyContainer.innerHTML = `
          <div class="modal-test-empathy-pill">
            <i class="fa-solid fa-heart-circle-check modal-test-empathy-icon"></i>
            <span class="modal-test-empathy-text">${empathy}</span>
          </div>
        `;
      }
    });
  });
}

/**
 * Avanza al siguiente paso o finaliza el test
 */
async function avanzarPaso() {
  if (!estadoTest) return;

  if (estadoTest.pasoActual < TOTAL_PASOS) {
    if (!puedeAvanzar(estadoTest)) {
      // Si no ha elegido nada, seleccionar la primera opción por defecto
      const container = document.getElementById('testDynamicBody');
      const firstBtn = container?.querySelector('[data-opt-id]');
      if (firstBtn) firstBtn.click();
    }
    estadoTest.pasoActual++;
    renderizarPaso();
    document.querySelector('.modal-test-dialog')?.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    // Finalizar: Ejecutar análisis de ChatWii (Gemini AI / Fallback)
    await ejecutarFinalizacion();
  }
}

/**
 * Retrocede al paso anterior
 */
function retrocederPaso() {
  if (!estadoTest || estadoTest.pasoActual <= 1) return;
  estadoTest.pasoActual--;
  renderizarPaso();
  document.querySelector('.modal-test-dialog')?.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Pantalla de carga y resolución con ChatWii
 */
async function ejecutarFinalizacion() {
  const container = document.getElementById('testDynamicBody');
  const progressWrap = document.getElementById('testProgressWrap');
  const navWrap = document.getElementById('testNavWrap');
  if (!container) return;

  const t = obtenerTextos();
  const lang = obtenerIdiomaActivo();

  // Ocultar barra de progreso y navegación durante el análisis
  if (progressWrap) progressWrap.style.display = 'none';
  if (navWrap) navWrap.style.display = 'none';

  // Mostrar pantalla de carga empática
  container.innerHTML = `
    <div class="modal-test-loading">
      <div class="modal-test-loading-spinner"></div>
      <h4 class="modal-test-loading-title">${t.cargandoTitulo}</h4>
      <p class="modal-test-loading-sub">${t.cargandoSub}</p>
    </div>
  `;

  // Llamada a ChatWii con fallback transparente garantizado
  const orientacion = await generarOrientacionChatWii(estadoTest, lang);

  // Renderizar Ficha Final de Orientación Terapéutica
  container.innerHTML = `
    <div class="modal-test-result">
      
      <div class="modal-test-result-card">
        <span class="modal-test-result-badge">
          <i class="fa-solid fa-certificate"></i> ${t.resultadoBadge}
        </span>
        
        <h4 class="modal-test-result-profile">${orientacion.tituloPerfil}</h4>
        
        <p class="modal-test-result-desc">${orientacion.resumenEmpatico}</p>
        
        <div style="margin-bottom: 0.85rem; font-size: 0.8rem; font-weight: 750; color: var(--mco, #0284c7); text-transform: uppercase;">
          <i class="fa-solid fa-stethoscope"></i> ${orientacion.enfoqueRecomendado}
        </div>

        <ul class="modal-test-result-points">
          ${orientacion.puntosClave.map(p => `
            <li class="modal-test-result-point">
              <i class="fa-solid fa-circle-check"></i>
              <span>${p}</span>
            </li>
          `).join('')}
        </ul>

        <div style="font-size: 0.82rem; color: var(--tx2, #64748b); font-style: italic; border-top: 1px solid rgba(2, 132, 199, 0.2); padding-top: 0.75rem;">
          ${orientacion.mensajeEspecialista}
        </div>
      </div>

      <div class="modal-test-result-actions">
        <a href="${orientacion.waUrl}" target="_blank" rel="noopener noreferrer" class="modal-test-btn-whatsapp" id="btnTestEnviarWhatsApp">
          <i class="fa-brands fa-whatsapp" style="font-size: 1.35rem;"></i>
          <span>${t.btnWhatsApp}</span>
        </a>

        <button type="button" id="btnTestAbrirFormulario" class="modal-test-btn-form">
          <i class="fa-regular fa-calendar-check"></i>
          <span>${t.btnFormulario}</span>
        </button>

        <button type="button" id="btnTestReiniciar" style="background: none; border: none; font-size: 0.78rem; color: var(--tx2, #64748b); cursor: pointer; text-decoration: underline; margin-top: 0.4rem;">
          ${t.btnReiniciar}
        </button>
      </div>

    </div>
  `;

  // Listeners de la Ficha Final
  document.getElementById('btnTestEnviarWhatsApp')?.addEventListener('click', () => {
    cerrarModalTest();
  });

  document.getElementById('btnTestAbrirFormulario')?.addEventListener('click', async () => {
    const { transferirTestAAgendar } = await import('../modalHero.js');
    transferirTestAAgendar({
      motivoId: estadoTest.respuestas.motivoId,
      nombre: estadoTest.respuestas.nombrePaciente
    });
  });

  document.getElementById('btnTestReiniciar')?.addEventListener('click', () => {
    iniciarTest();
  });
}

/**
 * Reinicia e inicializa el test con el motivo opcional
 */
function iniciarTest(motivoOId = null) {
  estadoTest = crearEstadoTest();

  // Si viene con un motivo preseleccionado desde el Hero
  if (motivoOId) {
    const term = motivoOId.toLowerCase();
    if (term.includes('ansiedad') || term.includes('estres')) {
      estadoTest.respuestas.motivoId = 'ansiedad';
    } else if (term.includes('pareja') || term.includes('familiar')) {
      estadoTest.respuestas.motivoId = 'pareja';
    } else if (term.includes('apoyo') || term.includes('triste') || term.includes('desahogo')) {
      estadoTest.respuestas.motivoId = 'apoyo';
    } else if (term.includes('general') || term.includes('otro')) {
      estadoTest.respuestas.motivoId = 'general';
    }
  }

  // Restaurar visibilidad de navegación y progreso
  const progressWrap = document.getElementById('testProgressWrap');
  const navWrap = document.getElementById('testNavWrap');
  if (progressWrap) progressWrap.style.display = 'block';
  if (navWrap) navWrap.style.display = 'flex';

  renderizarPaso();
}

/**
 * Abre el modal del test
 * @param {string|null} motivoOId
 */
export function abrirModalTest(motivoOId = null) {
  const modal = asegurarModalEnDOM();
  if (!modal) return;

  const motivoGuardado = motivoOId || (typeof localStorage !== 'undefined' ? localStorage.getItem('psicologia_motivo_activo') : '');
  iniciarTest(motivoGuardado);

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
