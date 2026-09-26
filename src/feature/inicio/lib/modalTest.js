// src/feature/inicio/lib/modalTest.js
// 🎯 Test de Orientación Psicológica On-Demand (0 KiB en carga inicial)
// Desarrollado con arquitectura ligera y empática para Consultorio Psicológico América

import { datosNegocio } from '../../../negocio.js';

let modalEl = null;

const PREGUNTAS = [
  {
    id: 'motivo',
    titulo: '1. ¿Qué motivo o desafío te gustaría atender?',
    subtitulo: 'Selecciona la opción con la que más te identifiques en este momento:',
    opciones: [
      { id: 'ansiedad', texto: 'Ansiedad, estrés constante, sobrepensamiento o ataques de pánico', icono: 'fa-solid fa-wind', terapia: 'Psicoterapia Individual Cognitivo Conductual' },
      { id: 'pareja', texto: 'Problemas de comunicación, infidelidad o crisis de pareja', icono: 'fa-solid fa-heart-crack', terapia: 'Terapia de Pareja y Sistema Familiar' },
      { id: 'infantil', texto: 'Conducta, berrinches, adaptación escolar o emociones de mi hijo', icono: 'fa-solid fa-child-reaching', terapia: 'Terapia Infantil y del Aprendizaje' },
      { id: 'descarte', texto: 'Sospecha o necesidad de descarte formal de TDAH o TEA', icono: 'fa-solid fa-brain', terapia: 'Descarte Diagnóstico TDAH & TEA' },
      { id: 'emocional', texto: 'Tristeza profunda, duelo, baja autoestima o sensación de vacío', icono: 'fa-solid fa-sun', terapia: 'Psicoterapia Individual y Reestructuración Emocional' }
    ]
  },
  {
    id: 'paciente',
    titulo: '2. ¿Para quién sería la atención terapéutica?',
    subtitulo: 'Nos ayuda a adaptar el enfoque a la etapa de vida adecuada:',
    opciones: [
      { id: 'adulto', texto: 'Para mí (Adulto o Joven)', icono: 'fa-solid fa-user' },
      { id: 'pareja_ambos', texto: 'Para mi pareja y para mí (ambos participando)', icono: 'fa-solid fa-user-group' },
      { id: 'hijo', texto: 'Para mi hijo/a (Niño de 3 a 12 años)', icono: 'fa-solid fa-child' },
      { id: 'adolescente', texto: 'Para un/a adolescente (13 a 17 años)', icono: 'fa-solid fa-graduation-cap' }
    ]
  },
  {
    id: 'modalidad',
    titulo: '3. ¿Qué modalidad de atención prefieres?',
    subtitulo: 'Ambas cuentan con la misma validez clínica y efectividad:',
    opciones: [
      { id: 'miraflores', texto: 'Presencial en Miraflores (Av. Benavides 620, Edificio Zafiro)', icono: 'fa-solid fa-location-dot' },
      { id: 'ves', texto: 'Presencial en Lima Sur (Villa El Salvador)', icono: 'fa-solid fa-building-user' },
      { id: 'online', texto: '100% Online (Google Meet / Zoom desde tu hogar)', icono: 'fa-solid fa-laptop' }
    ]
  }
];

let estadoTest = {
  pasoActual: 0,
  respuestas: {
    motivo: null,
    motivoTexto: '',
    terapiaRecomendada: '',
    paciente: null,
    pacienteTexto: '',
    modalidad: null,
    modalidadTexto: ''
  }
};

function asegurarModalEnDOM() {
  if (document.getElementById('wi_modal_test')) {
    return document.getElementById('wi_modal_test');
  }

  const modal = document.createElement('div');
  modal.id = 'wi_modal_test';
  modal.className = 'wiModal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'modalTestTitle');

  modal.innerHTML = `
    <div class="wiModal-content" style="max-width: 580px; width: 92%; padding: 2.2vh 2.2vw; border-radius: 1.4vh; background: var(--bg-card, #ffffff); border: 1px solid var(--border-card, #e1e9ec); box-shadow: 0 20px 50px rgba(16, 67, 86, 0.25);">
      
      <!-- Encabezado del Test -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.8vh; border-bottom: 1px solid var(--border-card, #e1e9ec); padding-bottom: 1.2vh;">
        <div>
          <span style="font-size: 0.76rem; font-weight: 700; padding: 0.3vh 0.8vw; border-radius: 999px; background: var(--brand-soft, #e5f4fa); color: var(--brand-primary, #104356); display: inline-flex; align-items: center; gap: 0.4rem; margin-bottom: 0.4vh;">
            <i class="fa-solid fa-clipboard-question"></i> Orientación Confidencial · Lic. Sofía Reynaga
          </span>
          <h3 id="modalTestTitle" style="font-size: clamp(1.15rem, 1.3vw, 1.4rem); font-weight: 800; margin: 0; color: var(--text-bright, #071923); font-family: 'Outfit', sans-serif;">
            Test de Orientación Psicológica
          </h3>
        </div>
        <button id="btnCerrarModalTest" type="button" aria-label="Cerrar test" style="background: none; border: none; font-size: 1.4rem; color: var(--text-muted, #486576); cursor: pointer; padding: 0.4rem; line-height: 1; border-radius: 0.6vh; transition: color 0.2s;">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Barra de Progreso -->
      <div id="testProgressContainer" style="margin-bottom: 2vh;">
        <div style="display: flex; justify-content: space-between; font-size: 0.78rem; font-weight: 600; color: var(--text-muted, #486576); margin-bottom: 0.5vh;">
          <span id="testStepIndicator">Paso 1 de 3</span>
          <span id="testStepPercent">33%</span>
        </div>
        <div style="width: 100%; height: 6px; background: var(--bg-surface-elevated, #eaf3f8); border-radius: 999px; overflow: hidden;">
          <div id="testProgressBar" style="width: 33%; height: 100%; background: linear-gradient(90deg, #104356, #38bdf8); transition: width 0.35s ease; border-radius: 999px;"></div>
        </div>
      </div>

      <!-- Contenedor Dinámico de Preguntas y Resultados -->
      <div id="testBodyContainer">
        <!-- Renderizado dinámicamente -->
      </div>

    </div>
  `;

  document.body.appendChild(modal);

  // Cerrar al hacer clic en fondo o botón X
  modal.addEventListener('click', (e) => {
    if (e.target === modal) cerrarModalTest();
  });

  const btnCerrar = modal.querySelector('#btnCerrarModalTest');
  if (btnCerrar) {
    btnCerrar.addEventListener('click', cerrarModalTest);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      cerrarModalTest();
    }
  });

  return modal;
}

function renderizarPaso() {
  const container = document.getElementById('testBodyContainer');
  const progressCont = document.getElementById('testProgressContainer');
  const stepIndicator = document.getElementById('testStepIndicator');
  const stepPercent = document.getElementById('testStepPercent');
  const progressBar = document.getElementById('testProgressBar');

  if (!container) return;

  const paso = estadoTest.pasoActual;

  if (paso < PREGUNTAS.length) {
    // Renderizar Pregunta
    const p = PREGUNTAS[paso];
    const pct = Math.round(((paso + 1) / PREGUNTAS.length) * 100);

    if (progressCont) progressCont.style.display = 'block';
    if (stepIndicator) stepIndicator.textContent = `Paso ${paso + 1} de ${PREGUNTAS.length}`;
    if (stepPercent) stepPercent.textContent = `${pct}%`;
    if (progressBar) progressBar.style.width = `${pct}%`;

    let html = `
      <div style="animation: fadeIn 0.25s ease;">
        <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-bright, #071923); margin-bottom: 0.4vh; font-family: 'Outfit', sans-serif;">
          ${p.titulo}
        </h4>
        <p style="font-size: 0.86rem; color: var(--text-muted, #486576); margin-bottom: 1.8vh; line-height: 1.4;">
          ${p.subtitulo}
        </p>

        <div style="display: flex; flex-direction: column; gap: 0.9vh; margin-bottom: 2vh;">
          ${p.opciones.map((opc, idx) => `
            <button 
              type="button" 
              class="test-opc-btn" 
              data-idx="${idx}"
              style="display: flex; align-items: center; gap: 1rem; text-align: left; padding: 1.1vh 1.2vw; border-radius: 1vh; border: 1.5px solid var(--border-card, #dceaf2); background: var(--bg-surface, #ffffff); color: var(--text-main, #0f2735); font-family: 'Poppins', sans-serif; font-size: 0.88rem; font-weight: 500; cursor: pointer; transition: all 0.2s ease;"
              onmouseover="this.style.borderColor='var(--brand-primary, #104356)'; this.style.background='var(--brand-soft, #e5f4fa)';"
              onmouseout="this.style.borderColor='var(--border-card, #dceaf2)'; this.style.background='var(--bg-surface, #ffffff)';"
            >
              <span style="width: 38px; height: 38px; border-radius: 50%; background: var(--brand-soft, #e5f4fa); color: var(--brand-primary, #104356); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 1rem;">
                <i class="${opc.icono}"></i>
              </span>
              <span style="flex: 1; line-height: 1.35;">${opc.texto}</span>
              <i class="fa-solid fa-chevron-right" style="color: var(--text-muted, #486576); font-size: 0.8rem; opacity: 0.6;"></i>
            </button>
          `).join('')}
        </div>

        ${paso > 0 ? `
          <button type="button" id="btnTestAtras" style="background: none; border: none; color: var(--text-muted, #486576); font-size: 0.82rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0;">
            <i class="fa-solid fa-arrow-left"></i> Volver a la pregunta anterior
          </button>
        ` : ''}
      </div>
    `;

    container.innerHTML = html;

    // Listeners de opciones
    const btns = container.querySelectorAll('.test-opc-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx') || '0', 10);
        const sel = p.opciones[idx];

        if (p.id === 'motivo') {
          estadoTest.respuestas.motivo = sel.id;
          estadoTest.respuestas.motivoTexto = sel.texto;
          estadoTest.respuestas.terapiaRecomendada = sel.terapia;
        } else if (p.id === 'paciente') {
          estadoTest.respuestas.paciente = sel.id;
          estadoTest.respuestas.pacienteTexto = sel.texto;
        } else if (p.id === 'modalidad') {
          estadoTest.respuestas.modalidad = sel.id;
          estadoTest.respuestas.modalidadTexto = sel.texto;
        }

        estadoTest.pasoActual++;
        renderizarPaso();
      });
    });

    const btnAtras = container.querySelector('#btnTestAtras');
    if (btnAtras) {
      btnAtras.addEventListener('click', () => {
        if (estadoTest.pasoActual > 0) {
          estadoTest.pasoActual--;
          renderizarPaso();
        }
      });
    }

  } else {
    // Renderizar Resultado Final
    if (progressCont) progressCont.style.display = 'none';

    const r = estadoTest.respuestas;
    const terapia = r.terapiaRecomendada || 'Consulta Psicológica Integral';

    const mensajeWsp = `Hola Lic. Sofía Reynaga, realicé el Test de Orientación en su sitio web:\n\n• Motivo principal: ${r.motivoTexto}\n• Para: ${r.pacienteTexto}\n• Modalidad preferida: ${r.modalidadTexto}\n• Terapia sugerida: ${terapia}\n\nMe gustaría recibir información para agendar mi primera sesión. Gracias.`;
    const enlaceWsp = `https://wa.me/${datosNegocio.whatsappLimpio}?text=${encodeURIComponent(mensajeWsp)}`;

    let html = `
      <div style="text-align: center; padding: 1vh 0; animation: fadeIn 0.3s ease;">
        <div style="width: 58px; height: 58px; border-radius: 50%; background: linear-gradient(135deg, #104356, #38bdf8); color: #ffffff; display: inline-flex; align-items: center; justify-content: center; font-size: 1.6rem; margin-bottom: 1.5vh; box-shadow: 0 10px 25px rgba(56, 189, 248, 0.35);">
          <i class="fa-solid fa-heart-pulse"></i>
        </div>

        <h4 style="font-size: clamp(1.2rem, 1.4vw, 1.5rem); font-weight: 800; color: var(--text-bright, #071923); margin-bottom: 0.6vh; font-family: 'Outfit', sans-serif;">
          Resultado de tu Orientación
        </h4>

        <p style="font-size: 0.88rem; color: var(--text-muted, #486576); max-width: 440px; margin: 0 auto 2vh auto; line-height: 1.45;">
          De acuerdo con tus respuestas, el enfoque clínico más indicado para brindarte acompañamiento seguro es:
        </p>

        <!-- Tarjeta de Recomendación -->
        <div style="background: linear-gradient(135deg, rgba(16, 67, 86, 0.05) 0%, rgba(56, 189, 248, 0.1) 100%); border: 1.5px solid rgba(16, 67, 86, 0.2); border-radius: 1.2vh; padding: 1.8vh 1.5vw; margin-bottom: 2.2vh; text-align: left;">
          <div style="font-size: 0.74rem; font-weight: 700; text-transform: uppercase; color: var(--brand-blue, #1e5e75); letter-spacing: 0.05em; margin-bottom: 0.3vh;">
            Especialidad Sugerida:
          </div>
          <div style="font-size: 1.15rem; font-weight: 800; color: var(--brand-primary, #104356); font-family: 'Outfit', sans-serif; margin-bottom: 0.8vh;">
            ${terapia}
          </div>
          <div style="font-size: 0.82rem; color: var(--text-muted, #486576); line-height: 1.45;">
            <i class="fa-solid fa-check-circle" style="color: #10b981;"></i> Incluye evaluación inicial, diseño de plan terapéutico a medida y estricta confidencialidad médica (C.Ps.P. 34892).
          </div>
        </div>

        <!-- Botones de Acción -->
        <div style="display: flex; flex-direction: column; gap: 1vh;">
          <a 
            href="${enlaceWsp}" 
            target="_blank" 
            rel="noopener noreferrer"
            class="btn-whatsapp"
            style="width: 100%; justify-content: center; padding: 1.1vh 1.5vw; font-size: 0.96rem; text-decoration: none;"
          >
            <i class="fa-brands fa-whatsapp" style="font-size: 1.3rem;"></i>
            <span>Conversar con la Lic. Sofía por WhatsApp</span>
          </a>

          <button 
            type="button" 
            id="btnReiniciarTest" 
            style="background: transparent; border: none; color: var(--text-muted, #486576); font-size: 0.84rem; font-weight: 600; cursor: pointer; padding: 0.5rem; text-decoration: underline;"
          >
            Reiniciar test de orientación
          </button>
        </div>
      </div>
    `;

    container.innerHTML = html;

    const btnReinicio = container.querySelector('#btnReiniciarTest');
    if (btnReinicio) {
      btnReinicio.addEventListener('click', () => {
        reiniciarTest();
        renderizarPaso();
      });
    }
  }
}

function reiniciarTest() {
  estadoTest = {
    pasoActual: 0,
    respuestas: {
      motivo: null,
      motivoTexto: '',
      terapiaRecomendada: '',
      paciente: null,
      pacienteTexto: '',
      modalidad: null,
      modalidadTexto: ''
    }
  };
}

export function abrirModalTest() {
  modalEl = asegurarModalEnDOM();
  reiniciarTest();
  renderizarPaso();
  modalEl.classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function cerrarModalTest() {
  if (modalEl) {
    modalEl.classList.remove('active');
  }
  document.body.style.overflow = '';
}

// Inyección en window para acceso global
if (typeof window !== 'undefined') {
  window.abrirModalTest = abrirModalTest;
  window.cerrarModalTest = cerrarModalTest;
}
