// src/feature/cliente/modulos/01-pedidos/pedidos.js
// Controlador reactivo de servicios y asesorías conectado a Firestore con sincronización Local-First
// Sincronización inteligente sin setInterval (cuida cuota gratuita Firebase Spark)
// Validación estricta y formato profesional tributario

import { Saludar, Notificacion, getls, savels } from '@widev';
import { datosNegocio, configurarSistema } from '../../../../negocio.js';
import { firebaseConfig } from '../../../../core/servicios/firebase.js';
import { normalizarDireccionesMap, sincronizarDireccionesDesdeFirestore } from '../02-direccion/dataDireccion.js';

const PRODUCTOS_CACHE_KEY = 'wi_productos';
const PRODUCTOS_TS_KEY = 'wi_productos_ts';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos TTL para cuidar lecturas

export function inicializarPedidos() {
  const modulo = document.getElementById('moduloPedidos');
  if (!modulo) return;

  const rolClienteNombre = configurarSistema?.terminologia?.rolClienteNombre || 'Cliente';

  // Estado del usuario activo desde wiSmile (Sesión real obligatoria)
  const user = getls('wiSmile');
  if (!user || (!user.uid && !user.usuario && !user.nombre)) {
    return;
  }

  // Saludo dinámico según la hora del día
  const saluteElem = document.getElementById('clWelcomeSalute');
  if (saluteElem) {
    const primerNombre = (user.nombre || user.usuario || rolClienteNombre).trim().split(/\s+/)[0];
    saluteElem.textContent = `¡${Saludar(primerNombre, 'es')}!`;
  }

  // Estado del Carrito Multi-servicio
  const cart = {};
  const cardElements = document.querySelectorAll('#listaProductosCards .cl-h-card');
  cardElements.forEach(card => {
    const id = card.dataset.id;
    const nombre = card.dataset.nombre;
    const corto = card.dataset.nombrecorto || nombre;
    const precio = parseFloat(card.dataset.precio) || 0;
    const qtySpan = document.getElementById(`qty-${id}`);
    const qty = parseInt(qtySpan?.textContent || '0', 10);
    cart[id] = { nombre, corto, precio, qty };
  });

  // Referencias DOM del Módulo
  const selDir = document.getElementById('selDireccionPedido');
  const inCel = document.getElementById('inCelularPedido');
  const bubble = document.getElementById('bubbleWaPedido');
  const sumItems = document.getElementById('sumItemsCount');
  const sumDir = document.getElementById('sumDirSelected');
  const sumPr = document.getElementById('sumPriceTotal');
  const btnWa = document.getElementById('btnWaOrder');
  const lblBtn = document.getElementById('lblBtnWaOrder');
  const inNotas = document.getElementById('inNotasPedido');
  const mCartCount = document.getElementById('mCartCount');
  const mCartTotal = document.getElementById('mCartTotal');
  const mBtnWa = document.getElementById('mBtnWaOrder');

  // Estado reactivo de la solicitud
  let state = {
    nombre: user.nombre || user.usuario || rolClienteNombre,
    celular: inCel?.value?.trim() || user.celular || '',
    calle: '',
    distrito: '',
    formaPago: 'Transferencia BCP / Yape',
    notas: ''
  };

  function calculateTotals() {
    let total = 0;
    let count = 0;
    const itemsList = [];

    for (const id in cart) {
      const item = cart[id];
      if (item.qty > 0) {
        const subtotal = item.qty * item.precio;
        total += subtotal;
        count += item.qty;
        itemsList.push(`• ${item.qty}x ${item.nombre} (S/ ${subtotal.toFixed(2)})`);
      }
    }

    if (count === 0) {
      itemsList.push('• (Selecciona al menos 1 ítem del catálogo)');
    }

    return { total, count, itemsList };
  }

  const term = configurarSistema?.terminologia || {};
  const itemSingular = term.itemSingular || 'consulta';
  const itemsPlural = term.itemsPlural || 'consultas';
  const modalidadDefecto = term.modalidadDefecto || 'Presencial en Consultorio Sede América';

  function buildMessage() {
    const { total, itemsList } = calculateTotals();
    const neg = getls('wi_negocio') || getls('minegocio') || {};
    const nombreNegocio = neg.identidad?.nombreComercial || neg.identidad?.nombre || datosNegocio.nombre || 'Consultorio Psicológico América';
    const direccionTexto = state.calle 
      ? `${state.calle}${state.distrito ? ', ' + state.distrito : ''}` 
      : modalidadDefecto;

    const celTexto = state.celular ? `\n📱 Celular / WhatsApp: ${state.celular}` : '';

    let msg = `¡Hola ${nombreNegocio}! Deseo agendar la siguiente atención psicológica:

👤 ${rolClienteNombre}: ${state.nombre}${celTexto}
📋 Detalle de la cita / servicio:
${itemsList.join('\n')}
💰 Inversión estimada: S/ ${total.toFixed(2)}
💳 Medio de Pago: ${state.formaPago}
📍 Modalidad / Sede: ${direccionTexto}`;

    if (state.notas.trim()) {
      msg += `\n📝 Motivo de consulta / Horario de preferencia: ${state.notas.trim()}`;
    }

    msg += `\n\n💬 ¿Podrían confirmarme la disponibilidad de horario para la sesión? ¡Muchas gracias!`;

    return msg;
  }

  function update() {
    const { total, count } = calculateTotals();
    const finalMessage = buildMessage();
    const encoded = encodeURIComponent(finalMessage);
    const neg = getls('wi_negocio') || getls('minegocio') || {};
    const numWa = String(neg.contacto?.whatsappLimpio || neg.contacto?.whatsapp || datosNegocio.whatsappLimpio || '').replace(/\D/g, '');
    const waBase = `https://wa.me/${numWa}`;

    // 1. Burbuja de WhatsApp en vivo
    if (bubble) {
      const now = new Date();
      const hrs = now.getHours();
      const mins = String(now.getMinutes()).padStart(2, '0');
      const ampm = hrs >= 12 ? 'p. m.' : 'a. m.';
      const horaStr = `${hrs % 12 || 12}:${mins} ${ampm}`;

      bubble.innerHTML = finalMessage.replace(/\n/g, '<br>') + 
        `<div class="cl-wa-time"><span>${horaStr}</span> <i class="fa-solid fa-check-double" style="color:#53bdeb;"></i></div>`;
    }

    // 2. Resumen Desktop
    if (sumItems) sumItems.textContent = `${count} ${count === 1 ? itemSingular : itemsPlural} seleccionada${count === 1 ? '' : 's'}`;
    if (sumDir) {
      const celTag = state.celular ? ` · 📞 ${state.celular}` : '';
      sumDir.textContent = state.calle 
        ? `${state.calle}, ${state.distrito}${celTag}` 
        : modalidadDefecto;
    }
    if (sumPr) sumPr.textContent = `S/ ${total.toFixed(2)}`;
    if (lblBtn) lblBtn.textContent = `Agendar por WhatsApp (S/ ${total.toFixed(2)})`;
    if (btnWa) btnWa.href = `${waBase}?text=${encoded}`;

    // 3. Barra Resumen Móvil Flotante
    if (mCartCount) mCartCount.textContent = `${count} ${count === 1 ? itemSingular : itemsPlural}`;
    if (mCartTotal) mCartTotal.textContent = `S/ ${total.toFixed(2)}`;
    if (mBtnWa) mBtnWa.href = `${waBase}?text=${encoded}`;
  }

  // Sincronizar dirección seleccionada
  function syncDireccionDesdeSelect() {
    if (!selDir) return;
    const opt = selDir.options[selDir.selectedIndex];
    if (opt && opt.value) {
      state.calle = opt.dataset.calle || '';
      state.distrito = opt.dataset.distrito || (datosNegocio.distritoSede || '');
      if (opt.dataset.celular && !inCel.value.trim()) {
        inCel.value = opt.dataset.celular;
        state.celular = opt.dataset.celular;
      }
    } else {
      state.calle = '';
      state.distrito = datosNegocio.distritoSede || '';
    }
  }

  syncDireccionDesdeSelect();
  selDir?.addEventListener('change', () => {
    syncDireccionDesdeSelect();
    update();
  });

  // Salto rápido al módulo de direcciones
  document.getElementById('btnAddDirJump')?.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('cambiarModuloCliente', { detail: { modulo: 'direccion' } }));
  });

  // Salto rápido a la ficha fiscal
  document.getElementById('btnGestionarFicha')?.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('cambiarModuloCliente', { detail: { modulo: 'cuenta' } }));
  });

  // Sincronizar input de celular
  inCel?.addEventListener('input', () => {
    state.celular = inCel.value.trim();
    update();
  });

  // Sincronizar notas
  inNotas?.addEventListener('input', () => {
    state.notas = inNotas.value;
    update();
  });

  // Validar al pulsar botón WhatsApp
  function validarYPedir(e) {
    const { count } = calculateTotals();
    if (count === 0) {
      e.preventDefault();
      Notificacion(`Por favor selecciona al menos 1 ${itemSingular} del catálogo.`, 'warning');
      return false;
    }
    return true;
  }

  btnWa?.addEventListener('click', validarYPedir);
  mBtnWa?.addEventListener('click', validarYPedir);

  // Steppers (+ / -)
  modulo.querySelectorAll('.btn-plus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      if (!cart[id]) return;
      cart[id].qty++;
      const qtyElem = document.getElementById(`qty-${id}`);
      if (qtyElem) qtyElem.textContent = cart[id].qty;
      const card = btn.closest('.cl-h-card');
      if (cart[id].qty > 0 && card) card.classList.add('has-items');
      update();
    });
  });

  modulo.querySelectorAll('.btn-minus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      if (!cart[id] || cart[id].qty <= 0) return;
      cart[id].qty--;
      const qtyElem = document.getElementById(`qty-${id}`);
      if (qtyElem) qtyElem.textContent = cart[id].qty;
      const card = btn.closest('.cl-h-card');
      if (cart[id].qty === 0 && card) card.classList.remove('has-items');
      update();
    });
  });

  // Métodos de Pago
  modulo.querySelectorAll('#payMethodsGrid .cl-pay-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      modulo.querySelectorAll('#payMethodsGrid .cl-pay-opt').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      state.formaPago = opt.dataset.method;
      update();
    });
  });

  // Sincronizar precios frescos de Firestore
  function sincronizarCatalogoFrescoFirestore() {
    const ahora = Date.now();
    const lastFetch = parseInt(localStorage.getItem(PRODUCTOS_TS_KEY) || '0', 10);

    if (ahora - lastFetch < CACHE_TTL_MS && localStorage.getItem(PRODUCTOS_CACHE_KEY)) {
      return;
    }

    const projectId = firebaseConfig?.projectId || 'psicologiawii';
    const coleccion = 'productos';
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);

    fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${coleccion}`, {
      signal: ctrl.signal
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        clearTimeout(timer);
        if (!data || !Array.isArray(data.documents)) return;

        localStorage.setItem(PRODUCTOS_TS_KEY, ahora.toString());

        const nuevosProds = {};
        data.documents.forEach(docRaw => {
          const fields = docRaw.fields || {};
          const id = fields.id?.stringValue || (docRaw.name ? docRaw.name.split('/').pop() : '');
          const precio = Number(fields.precioPEN?.doubleValue ?? fields.precioPEN?.integerValue ?? fields.precio?.doubleValue ?? fields.precio?.integerValue ?? 0);
          const estado = fields.estado?.stringValue || 'activo';
          nuevosProds[id] = { precio, estado };
        });

        let huboCambios = false;
        for (const [id, prodInfo] of Object.entries(nuevosProds)) {
          if (cart[id] && prodInfo.precio && cart[id].precio !== prodInfo.precio) {
            cart[id].precio = prodInfo.precio;
            const priceElem = document.getElementById(`priceDisplay-${id}`);
            if (priceElem) priceElem.textContent = `S/ ${prodInfo.precio.toFixed(2)}`;
            const card = document.querySelector(`.cl-h-card[data-id="${id}"]`);
            if (card) card.dataset.precio = prodInfo.precio;
            huboCambios = true;
          }
        }

        if (huboCambios) {
          update();
        }
      })
      .catch(() => {
        clearTimeout(timer);
      });
  }

  // Inicializar UI
  update();
  sincronizarCatalogoFrescoFirestore();
  sincronizarDireccionesDesdeFirestore();
}
