// src/feature/cliente/modulos/01-pedidos/pedidos.js
// Controlador reactivo de las 3 Boletas de Agendamiento, Paginación de 5 en 5 y Sincronización en Tiempo Real

import { getls } from '@widev';
import { datosNegocio, configurarSistema } from '../../../../negocio.js';

export function inicializarPedidos() {
  const modulo = document.getElementById('moduloPedidos');
  if (!modulo) return;
  if (modulo.dataset.pedidosInit === 'true') {
    return;
  }
  modulo.dataset.pedidosInit = 'true';

  const rolClienteNombre = configurarSistema?.terminologia?.rolClienteNombre || 'Paciente';
  const user = getls('wiSmile') || (typeof window !== 'undefined' ? window.__WI_USER__ : null);
  const nombrePaciente = user?.nombre || user?.usuario || rolClienteNombre;
  const celPaciente = user?.celular || user?.telefono || '';

  // Estado centralizado
  let state = {
    servicioId: 'psicoterapia-individual',
    servicioNombre: 'Psicoterapia Individual (TCC & Contextual)',
    servicioCorto: 'Psicoterapia Individual',
    precio: 85.0,
    modalidad: 'Presencial en Consultorio Sede América',
    modalidadCorta: 'Presencial',
    turno: 'Turno Tarde / Noche (3:00 PM - 8:00 PM)',
    turnocorto: 'Turno Tarde',
    formaPago: 'Yape',
    motivo: '',
    nombre: nombrePaciente,
    celular: celPaciente
  };

  // ========================================================
  // 1. SISTEMA DE LAS 3 BOLETAS (TABS)
  // ========================================================
  const boletaButtons = modulo.querySelectorAll('.ag-boleta-card');
  const boletaPanels = modulo.querySelectorAll('.ag-boleta-panel');

  function activarBoleta(tabNum) {
    boletaButtons.forEach(btn => {
      const isTarget = btn.dataset.tab === String(tabNum);
      btn.classList.toggle('active', isTarget);
      btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
    });

    boletaPanels.forEach(panel => {
      const isTarget = panel.id === `panelBoleta${tabNum}`;
      panel.classList.toggle('active', isTarget);
    });
  }

  boletaButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (tab) activarBoleta(tab);
    });
  });

  // Botones de salto [data-goto]
  modulo.querySelectorAll('[data-goto]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.goto;
      if (targetTab) {
        activarBoleta(targetTab);
        window.scrollTo({ top: 120, behavior: 'smooth' });
      }
    });
  });

  // ========================================================
  // 2. CATEGORÍAS Y PAGINACIÓN DE 5 EN 5 (PANEL BOLETA 1)
  // ========================================================
  const catButtons = modulo.querySelectorAll('.ag-cat-btn');
  const allCards = Array.from(modulo.querySelectorAll('#listaEspecialidadesAgendar .ag-service-card'));
  const paginationBar = document.getElementById('paginationBar');
  const btnPrev = document.getElementById('btnPagePrev');
  const btnNext = document.getElementById('btnPageNext');
  const pageNumbersContainer = document.getElementById('pageNumbersContainer');

  const ITEMS_PER_PAGE = 5;
  let activeCategory = 'mas_pedidos';
  let currentPage = 1;

  function getFilteredCards() {
    return allCards.filter(card => {
      if (activeCategory === 'todos') return true;
      if (activeCategory === 'mas_pedidos') {
        return card.dataset.maspedido === 'true';
      }
      return card.dataset.cat === activeCategory;
    });
  }

  function renderPagination() {
    const filtered = getFilteredCards();
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIdx = startIdx + ITEMS_PER_PAGE;

    allCards.forEach(card => {
      card.style.display = 'none';
    });

    filtered.forEach((card, idx) => {
      if (idx >= startIdx && idx < endIdx) {
        card.style.display = 'flex';
      }
    });

    if (btnPrev) btnPrev.disabled = currentPage === 1;
    if (btnNext) btnNext.disabled = currentPage === totalPages;

    if (pageNumbersContainer) {
      pageNumbersContainer.innerHTML = '';
      for (let i = 1; i <= totalPages; i++) {
        const numBtn = document.createElement('button');
        numBtn.type = 'button';
        numBtn.className = `ag-page-num ${i === currentPage ? 'active' : ''}`;
        numBtn.textContent = String(i);
        numBtn.addEventListener('click', () => {
          currentPage = i;
          renderPagination();
        });
        pageNumbersContainer.appendChild(numBtn);
      }
    }

    if (paginationBar) {
      paginationBar.style.display = totalPages > 1 ? 'flex' : 'none';
    }
  }

  catButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      catButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.cat || 'todos';
      currentPage = 1;
      renderPagination();
    });
  });

  btnPrev?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderPagination();
    }
  });

  btnNext?.addEventListener('click', () => {
    const totalPages = Math.ceil(getFilteredCards().length / ITEMS_PER_PAGE);
    if (currentPage < totalPages) {
      currentPage++;
      renderPagination();
    }
  });

  // Render inicial de tarjetas de Boleta 1
  renderPagination();

  // ========================================================
  // 3. SELECCIÓN DE ESPECIALIDADES (RADIO CARDS)
  // ========================================================
  allCards.forEach(card => {
    if (card.classList.contains('selected')) {
      state.servicioId = card.dataset.id;
      state.servicioNombre = card.dataset.nombre;
      state.servicioCorto = card.dataset.nombrecorto || card.dataset.nombre;
      state.precio = parseFloat(card.dataset.precio) || 85.0;
    }

    card.addEventListener('click', () => {
      allCards.forEach(c => {
        c.classList.remove('selected');
        c.setAttribute('aria-checked', 'false');
      });
      card.classList.add('selected');
      card.setAttribute('aria-checked', 'true');

      state.servicioId = card.dataset.id;
      state.servicioNombre = card.dataset.nombre;
      state.servicioCorto = card.dataset.nombrecorto || card.dataset.nombre;
      state.precio = parseFloat(card.dataset.precio) || 85.0;
      updateUI();
    });
  });

  // ========================================================
  // 4. SELECTOR DE MODALIDAD (BOLETA 2)
  // ========================================================
  const modButtons = modulo.querySelectorAll('#selectorModalidad .ag-mod-opt');
  modButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mod = btn.dataset.mod;
      if (mod === 'virtual') {
        state.modalidad = 'Online vía Google Meet (Enlace Privado)';
        state.modalidadCorta = 'Virtual Meet';
      } else {
        state.modalidad = 'Presencial en Consultorio Sede América';
        state.modalidadCorta = 'Presencial Sede América';
      }
      updateUI();
    });
  });

  // ========================================================
  // 5. SELECTOR DE TURNO (BOLETA 2)
  // ========================================================
  const turnButtons = modulo.querySelectorAll('#selectorTurno .ag-turn-opt');
  turnButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      turnButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const turno = btn.dataset.turno;
      if (turno === 'manana') {
        state.turno = 'Turno Mañana (8:00 AM - 1:00 PM)';
        state.turnocorto = 'Turno Mañana';
      } else {
        state.turno = 'Turno Tarde / Noche (3:00 PM - 8:00 PM)';
        state.turnocorto = 'Turno Tarde';
      }
      updateUI();
    });
  });

  // ========================================================
  // 6. MEDIOS DE PAGO (BOLETA 3)
  // ========================================================
  const payButtons = modulo.querySelectorAll('#payMethodsGrid .ag-pay-chip');
  payButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      payButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.formaPago = btn.dataset.method || 'Yape';
      updateUI();
    });
  });

  // ========================================================
  // 7. MOTIVO DE CONSULTA
  // ========================================================
  const inNotas = document.getElementById('inNotasPedido');
  inNotas?.addEventListener('input', () => {
    state.motivo = inNotas.value.trim();
    updateUI();
  });

  // Referencias DOM
  const bTitle1 = document.getElementById('boletaTitle1');
  const bSub1 = document.getElementById('boletaSub1');
  const bTitle2 = document.getElementById('boletaTitle2');
  const bSub2 = document.getElementById('boletaSub2');
  const bTitle3 = document.getElementById('boletaTitle3');
  const bSub3 = document.getElementById('boletaSub3');

  const lblService = document.getElementById('agSelectedServiceName');
  const lblModalidad = document.getElementById('agSelectedModalidad');
  const lblTurno = document.getElementById('agSelectedTurno');
  const lblFormaPago = document.getElementById('agSelectedFormaPago');
  const lblPrecio = document.getElementById('sumPriceTotal');
  const bubble = document.getElementById('bubbleWaPedido');
  const btnWa = document.getElementById('btnWaOrder');
  const lblBtnWa = document.getElementById('lblBtnWaOrder');
  const btnWaStep = document.getElementById('btnWaOrderStep');
  const lblBtnWaStep = document.getElementById('lblBtnWaOrderStep');
  const mName = document.getElementById('mAgServiceName');
  const mTotal = document.getElementById('mCartTotal');
  const mBtnWa = document.getElementById('mBtnWaOrder');

  function getNombreClinicaSeguro() {
    const raw = datosNegocio.nombreCorto || datosNegocio.nombre || 'Consultorio Psicológico América';
    if (typeof raw === 'object' && raw !== null) {
      return raw.es || raw.nombre || 'Consultorio Psicológico América';
    }
    return String(raw);
  }

  function buildMessage() {
    const nombreClinica = getNombreClinicaSeguro();
    const celTexto = state.celular ? `\n📱 WhatsApp: ${state.celular}` : '';

    let msg = `¡Hola ${nombreClinica}! Deseo agendar la siguiente atención psicológica:\n\n` +
      `👤 Paciente: ${state.nombre}${celTexto}\n` +
      `📋 Especialidad: ${state.servicioNombre}\n` +
      `📍 Modalidad: ${state.modalidad}\n` +
      `⏰ Turno de preferencia: ${state.turno}\n` +
      `💰 Inversión estimada: S/ ${state.precio.toFixed(2)}\n` +
      `💳 Medio de Pago: ${state.formaPago}`;

    if (state.motivo) {
      msg += `\n📝 Motivo de consulta: ${state.motivo}`;
    }

    msg += `\n\n💬 ¿Podrían confirmarme la disponibilidad de horario para la sesión? ¡Muchas gracias!`;
    return msg;
  }

  function updateUI() {
    // 1. Textos y badges de las 3 Boletas Superiores
    if (bTitle1) bTitle1.textContent = state.servicioCorto || state.servicioNombre;
    if (bSub1) bSub1.textContent = `S/ ${state.precio.toFixed(2)} · Seleccionado`;

    if (bTitle2) bTitle2.textContent = state.modalidadCorta;
    if (bSub2) bSub2.textContent = state.turnocorto;

    if (bTitle3) bTitle3.textContent = state.formaPago;
    if (bSub3) bSub3.textContent = state.motivo ? 'Motivo redactado' : 'Listo para coordinar';

    // 2. Columna lateral de confirmación
    if (lblService) lblService.textContent = state.servicioNombre;
    if (lblModalidad) lblModalidad.textContent = state.modalidad;
    if (lblTurno) lblTurno.textContent = state.turno;
    if (lblFormaPago) lblFormaPago.textContent = state.formaPago;
    if (lblPrecio) lblPrecio.textContent = `S/ ${state.precio.toFixed(2)}`;

    // 3. Botones de WhatsApp
    if (lblBtnWa) lblBtnWa.textContent = `Confirmar Cita (S/ ${state.precio.toFixed(2)})`;
    if (lblBtnWaStep) lblBtnWaStep.textContent = `Confirmar y Agendar por WhatsApp (S/ ${state.precio.toFixed(2)})`;

    if (mName) mName.textContent = state.servicioNombre;
    if (mTotal) mTotal.textContent = `S/ ${state.precio.toFixed(2)}`;

    const message = buildMessage();
    const encoded = encodeURIComponent(message);
    const numWa = String(datosNegocio.whatsappLimpio || '51960332958').replace(/\D/g, '');
    const waUrl = `https://wa.me/${numWa}?text=${encoded}`;

    if (btnWa) btnWa.href = waUrl;
    if (btnWaStep) btnWaStep.href = waUrl;
    if (mBtnWa) mBtnWa.href = waUrl;

    if (bubble) {
      const now = new Date();
      const hrs = now.getHours();
      const mins = String(now.getMinutes()).padStart(2, '0');
      const ampm = hrs >= 12 ? 'p. m.' : 'a. m.';
      const horaStr = `${hrs % 12 || 12}:${mins} ${ampm}`;

      bubble.innerHTML = message.replace(/\n/g, '<br>') +
        `<div class="ag-wa-time"><span>${horaStr}</span> <i class="fa-solid fa-check-double" style="color:#53bdeb;"></i></div>`;
    }
  }

  // Ejecución inicial
  updateUI();
}
