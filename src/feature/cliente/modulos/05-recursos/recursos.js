// src/feature/cliente/modulos/05-recursos/recursos.js
// Controlador interactivo de Mis Recursos y Herramientas Terapéuticas · Consultorio Psicológico América
// Conectado con utilidades nativas de @widev: Notificacion, wicopy, savels, getls

import { Notificacion, wicopy, savels, getls } from '@widev';

export function inicializarRecursos() {
  const modulo = document.getElementById('moduloRecursos');
  if (!modulo) return;

  if (modulo.dataset.recursosInit === 'true') return;
  modulo.dataset.recursosInit = 'true';

  // ========================================================
  // 1. FILTRADO POR CATEGORÍAS
  // ========================================================
  const chips = modulo.querySelectorAll('.rc-filter-chip');
  const cards = modulo.querySelectorAll('.rc-grid-cards .rc-card');

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const filter = chip.dataset.filter;
      cards.forEach(card => {
        if (filter === 'todos' || card.dataset.category === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // ========================================================
  // 2. SISTEMA UNIVERSAL DE APERTURA / CIERRE DE MODALES
  // ========================================================
  function abrirModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) {
      m.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  }

  function cerrarModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) {
      m.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  // Apertura desde botones con [data-open-modal]
  modulo.querySelectorAll('[data-open-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetModal = btn.dataset.openModal;
      if (targetModal) abrirModal(targetModal);
    });
  });

  // Cierre desde botones o backdrops con [data-close-modal]
  modulo.querySelectorAll('[data-close-modal]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const targetModal = el.dataset.closeModal;
      if (targetModal) {
        if (targetModal === 'modalRespiracion') detenerCicloRespiracion();
        cerrarModal(targetModal);
      }
    });
  });

  // Acciones secundarias (descargas PDF)
  modulo.querySelectorAll('[data-action="descargarPdf"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      Notificacion('Descargando guía clínica oficial en formato PDF...', 'exito');
    });
  });

  modulo.querySelectorAll('[data-action="imprimir"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.print();
    });
  });

  // ========================================================
  // 3. MODAL 1: RESPIRACIÓN DIAFRAGMÁTICA (4-7-8)
  // ========================================================
  const circle = document.getElementById('circleBreath');
  const cue = document.getElementById('cueBreath');
  const timer = document.getElementById('timerBreath');
  const btnStart = document.getElementById('btnStartBreath');
  const btnStop = document.getElementById('btnStopBreath');

  let breathInterval = null;
  let isRunning = false;

  function detenerCicloRespiracion() {
    isRunning = false;
    if (breathInterval) clearInterval(breathInterval);
    if (circle) {
      circle.className = 'rc-breath-circle';
      circle.style.transition = 'none';
    }
    if (cue) cue.textContent = 'Listo';
    if (timer) timer.textContent = '4s';
    if (btnStart) btnStart.style.display = 'inline-block';
    if (btnStop) btnStop.style.display = 'none';
  }

  function iniciarCicloRespiracion() {
    if (isRunning) return;
    isRunning = true;
    if (btnStart) btnStart.style.display = 'none';
    if (btnStop) btnStop.style.display = 'inline-block';

    const fases = [
      { nombre: 'Inhala', seg: 4, clase: 'inhale' },
      { nombre: 'Retén', seg: 7, clase: 'hold' },
      { nombre: 'Exhala', seg: 8, clase: 'exhale' }
    ];

    let faseIdx = 0;
    let restante = fases[0].seg;

    function aplicarFase() {
      const f = fases[faseIdx];
      if (cue) cue.textContent = f.nombre;
      if (timer) timer.textContent = `${restante}s`;
      if (circle) {
        circle.className = `rc-breath-circle ${f.clase}`;
        circle.style.transition = `transform ${f.seg}s cubic-bezier(0.4, 0, 0.2, 1)`;
      }
    }

    aplicarFase();

    breathInterval = setInterval(() => {
      restante--;
      if (restante <= 0) {
        faseIdx = (faseIdx + 1) % fases.length;
        restante = fases[faseIdx].seg;
        aplicarFase();
      } else {
        if (timer) timer.textContent = `${restante}s`;
      }
    }, 1000);
  }

  btnStart?.addEventListener('click', iniciarCicloRespiracion);
  btnStop?.addEventListener('click', () => {
    detenerCicloRespiracion();
    Notificacion('Ejercicio de respiración pausado.', 'info');
  });

  // ========================================================
  // 4. MODAL 2: REGISTRO COGNITIVO TCC (4 COLUMNAS)
  // ========================================================
  const inSituacion = document.getElementById('tccSituacion');
  const inEmocion = document.getElementById('tccEmocion');
  const inPensamiento = document.getElementById('tccPensamiento');
  const inAlternativa = document.getElementById('tccAlternativa');
  const btnCopiarTcc = document.getElementById('btnCopiarTcc');
  const btnGuardarTcc = document.getElementById('btnGuardarTcc');

  btnCopiarTcc?.addEventListener('click', async () => {
    const sit = inSituacion?.value.trim() || '(No especificado)';
    const emo = inEmocion?.value.trim() || '(No especificado)';
    const pen = inPensamiento?.value.trim() || '(No especificado)';
    const alt = inAlternativa?.value.trim() || '(No especificado)';

    const textoFormateado = 
      `📝 *Registro de Pensamientos Automáticos (TCC)*\n` +
      `📅 Fecha: ${new Date().toLocaleDateString('es-PE')}\n\n` +
      `1️⃣ *Situación*: ${sit}\n` +
      `2️⃣ *Emoción*: ${emo}\n` +
      `3️⃣ *Pensamiento Automático*: ${pen}\n` +
      `4️⃣ *Alternativa Racional*: ${alt}\n\n` +
      `_Consultorio Psicológico América · Lic. Sofía Reynaga (C.Ps.P. 49425)_`;

    try {
      if (typeof wicopy === 'function') {
        await wicopy(textoFormateado);
      } else {
        await navigator.clipboard.writeText(textoFormateado);
      }
      Notificacion('¡Plantilla TCC copiada al portapapeles! Lista para compartir.', 'exito');
    } catch {
      Notificacion('Contenido preparado para compartir.', 'info');
    }
  });

  btnGuardarTcc?.addEventListener('click', () => {
    const record = {
      situacion: inSituacion?.value.trim(),
      emocion: inEmocion?.value.trim(),
      pensamiento: inPensamiento?.value.trim(),
      alternativa: inAlternativa?.value.trim(),
      fecha: new Date().toISOString()
    };
    savels('wi_tcc_ultimo_registro', record);
    Notificacion('¡Ejercicio TCC guardado exitosamente en tu bitácora!', 'exito');
    cerrarModal('modalTcc');
  });

  // ========================================================
  // 5. MODAL 3: GROUNDING SENSORIAL (5-4-3-2-1)
  // ========================================================
  const pasosGrounding = [
    {
      num: 5,
      icono: 'fa-eye',
      titulo: 'Vista',
      texto: 'Mira a tu alrededor y nombra <strong>5 cosas que puedas ver</strong> en este momento (un cuadro, la luz, un objeto azul, una planta...).'
    },
    {
      num: 4,
      icono: 'fa-hand',
      titulo: 'Tacto',
      texto: 'Toca <strong>4 cosas con tus manos</strong> y siente su textura (la tela de tu ropa, la mesa fría, tu cabello, el suelo...).'
    },
    {
      num: 3,
      icono: 'fa-ear-listen',
      titulo: 'Oído',
      texto: 'Presta atención y escucha <strong>3 sonidos diferentes</strong> en tu entorno (el tráfico lejano, un reloj, tu respiración...).'
    },
    {
      num: 2,
      icono: 'fa-wind',
      titulo: 'Olfato',
      texto: 'Identifica <strong>2 aromas que puedas percibir</strong> (tu perfume, el café, el aire fresco, un libro...).'
    },
    {
      num: 1,
      icono: 'fa-heart',
      titulo: 'Autoafirmación',
      texto: 'Dite a ti mismo con amabilidad <strong>1 verdad positiva</strong>: <em>"Estoy a salvo aquí y ahora. Puedo atravesar este momento con calma."</em>'
    }
  ];

  let currentGroundingIdx = 0;
  const gFill = document.getElementById('groundingProgressFill');
  const gStepLabel = document.getElementById('groundingStepLabel');
  const gIcon = document.getElementById('groundingIcon');
  const gNum = document.getElementById('groundingNum');
  const gText = document.getElementById('groundingText');
  const btnNextGrounding = document.getElementById('btnNextGroundingStep');

  function renderGroundingStep() {
    const step = pasosGrounding[currentGroundingIdx];
    const pct = ((currentGroundingIdx + 1) / pasosGrounding.length) * 100;

    if (gFill) gFill.style.width = `${pct}%`;
    if (gStepLabel) gStepLabel.textContent = `Paso ${currentGroundingIdx + 1} de 5 · ${step.titulo}`;
    if (gIcon) gIcon.innerHTML = `<i class="fa-solid ${step.icono}"></i>`;
    if (gNum) gNum.textContent = String(step.num);
    if (gText) gText.innerHTML = step.texto;

    if (btnNextGrounding) {
      if (currentGroundingIdx === pasosGrounding.length - 1) {
        btnNextGrounding.innerHTML = `<span>Finalizar Ejercicio</span> <i class="fa-solid fa-check"></i>`;
      } else {
        btnNextGrounding.innerHTML = `<span>Siguiente Sentido</span> <i class="fa-solid fa-arrow-right"></i>`;
      }
    }
  }

  btnNextGrounding?.addEventListener('click', () => {
    if (currentGroundingIdx < pasosGrounding.length - 1) {
      currentGroundingIdx++;
      renderGroundingStep();
    } else {
      currentGroundingIdx = 0;
      renderGroundingStep();
      cerrarModal('modalGrounding');
      Notificacion('¡Excelente trabajo! Has reconectado tu mente y cuerpo con el presente.', 'exito');
    }
  });

  // ========================================================
  // 6. MODAL 4: CHECKLIST DE HÁBITOS DE AUTOCUIDADO
  // ========================================================
  const habitInputs = modulo.querySelectorAll('#habitsChecklistContainer input[type="checkbox"]');
  const meterText = document.getElementById('habitsProgressText');
  const meterFill = document.getElementById('habitsMeterFill');
  const btnGuardarHabitos = document.getElementById('btnGuardarHabitos');

  function cargarHabitosGuardados() {
    const guardados = getls('wi_habitos_paciente') || {};
    habitInputs.forEach(input => {
      const key = input.dataset.habit;
      if (key && guardados[key]) {
        input.checked = true;
      }
    });
    actualizarProgresoHabitos();
  }

  function actualizarProgresoHabitos() {
    let cumplidos = 0;
    habitInputs.forEach(input => {
      if (input.checked) cumplidos++;
    });

    const total = habitInputs.length || 4;
    const pct = Math.round((cumplidos / total) * 100);

    if (meterText) meterText.textContent = `Progreso de hoy: ${cumplidos} de ${total} cumplidas (${pct}%)`;
    if (meterFill) meterFill.style.width = `${pct}%`;
  }

  habitInputs.forEach(input => {
    input.addEventListener('change', actualizarProgresoHabitos);
  });

  btnGuardarHabitos?.addEventListener('click', () => {
    const estado = {};
    habitInputs.forEach(input => {
      const key = input.dataset.habit;
      if (key) estado[key] = input.checked;
    });
    savels('wi_habitos_paciente', estado);
    Notificacion('¡Metas de autocuidado guardadas para el día de hoy!', 'exito');
    cerrarModal('modalAutocuidado');
  });

  // Inicialización de hábitos guardados
  cargarHabitosGuardados();
  renderGroundingStep();
}
