// src/feature/cliente/modulos/01-pedidos/pedidos.js
// Controlador reactivo de pedidos conectado a Firestore con sincronización Local-First
// Sincronización inteligente sin setInterval (cuida cuota gratuita Firebase Spark)
// Validación estricta de direcciones y cero datos mock/ficticios

import { Saludar, Notificacion, getls, savels } from '@widev';
import { normalizarDireccionesMap, sincronizarDireccionesDesdeFirestore } from '../02-direccion/dataDireccion.js';

const PRODUCTOS_CACHE_KEY = 'gaswii_productos';
const PRODUCTOS_TS_KEY = 'gaswii_productos_ts';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos TTL para cuidar lecturas

export function inicializarPedidos() {
  const modulo = document.getElementById('moduloPedidos');
  if (!modulo) return;

  // Estado del usuario activo desde wiSmile (Sesión real obligatoria)
  const user = getls('wiSmile') || window.__GASWII_USER__;
  if (!user || (!user.uid && !user.usuario && !user.nombre)) {
    return;
  }

  // Saludo dinámico según la hora del día
  const saluteElem = document.getElementById('clWelcomeSalute');
  if (saluteElem) {
    const primerNombre = (user.nombre || user.usuario || 'Vecino').trim().split(/\s+/)[0];
    saluteElem.textContent = `¡${Saludar(primerNombre, 'es')}!`;
  }

  // Estado del Carrito Multi-producto
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

  // Estado reactivo del pedido
  let state = {
    nombre: user.nombre || user.usuario || 'Cliente Solgas',
    celular: inCel?.value?.trim() || user.celular || '',
    calle: '',
    distrito: 'Surquillo',
    formaPago: 'Efectivo contra entrega',
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
      itemsList.push('• (Selecciona al menos 1 producto)');
    }

    return { total, count, itemsList };
  }

  function buildMessage() {
    const { total, itemsList } = calculateTotals();
    const neg = getls('minegocio') || {};
    const nombreNegocio = neg.identidad?.nombre || 'Solgas Surquillo';
    const direccionTexto = state.calle 
      ? `${state.calle}, ${state.distrito}` 
      : `⚠️ (Sin dirección registrada - Por favor indicar al confirmar)`;

    const celTexto = state.celular ? `\n📱 Contacto: ${state.celular}` : '';

    let msg = `¡Hola ${nombreNegocio}! Quiero realizar un pedido:

👤 Soy: ${state.nombre}${celTexto}
📦 Pedido:
${itemsList.join('\n')}
💰 Total a pagar: S/ ${total.toFixed(2)}
💳 Pago: ${state.formaPago}
📍 Dirección: ${direccionTexto}`;

    if (state.notas.trim()) {
      msg += `\n📝 Notas: ${state.notas.trim()}`;
    }

    msg += `\n\n🙏 Por favor, ¿me confirman la recepción de mi pedido? ¡Muchas gracias!`;

    return msg;
  }

  function update() {
    const { total, count } = calculateTotals();
    const finalMessage = buildMessage();
    const encoded = encodeURIComponent(finalMessage);
    const neg = getls('minegocio') || {};
    const numWa = neg.contacto?.whatsappLimpio || neg.contacto?.whatsapp || '51936369384';
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
    if (sumItems) sumItems.textContent = `${count} ${count === 1 ? 'producto seleccionado' : 'productos seleccionados'}`;
    if (sumDir) {
      const celTag = state.celular ? ` · 📞 ${state.celular}` : '';
      sumDir.textContent = state.calle 
        ? `${state.calle}, ${state.distrito}${celTag}` 
        : '⚠️ Sin dirección seleccionada';
    }
    if (sumPr) sumPr.textContent = `S/ ${total.toFixed(2)}`;
    if (lblBtn) lblBtn.textContent = `Pedir por WhatsApp (S/ ${total.toFixed(2)})`;
    if (btnWa) btnWa.href = `${waBase}?text=${encoded}`;

    // 3. Barra Resumen Móvil Flotante
    if (mCartCount) mCartCount.textContent = `${count} ${count === 1 ? 'producto' : 'productos'}`;
    if (mCartTotal) mCartTotal.textContent = `S/ ${total.toFixed(2)}`;
    if (mBtnWa) mBtnWa.href = `${waBase}?text=${encoded}`;
  }

  // Selector y resolución de direcciones reales del usuario
  function refrescarSelectorDirecciones(direccionesList) {
    if (!selDir) return;
    const dirs = direccionesList || (user.direcciones ? normalizarDireccionesMap(user.direcciones) : []);
    let selectedCalle = '';
    let selectedDistrito = 'Surquillo';
    let selectedCelular = user.celular || '';

    if (dirs.length > 0) {
      selDir.innerHTML = dirs.map(d => `
        <option value="${d.id}" data-calle="${d.calle}" data-distrito="${d.distrito}" data-celular="${d.celular || user.celular || ''}" data-ref="${d.referencia || ''}" ${d.esPrincipal ? 'selected' : ''}>
          ${d.alias} — ${d.calle}, ${d.distrito}
        </option>
      `).join('');
      const optPrincipal = dirs.find(d => d.esPrincipal) || dirs[0];
      selectedCalle = optPrincipal.calle;
      selectedDistrito = optPrincipal.distrito || 'Surquillo';
      selectedCelular = optPrincipal.celular || user.celular || '';
    } else {
      selDir.innerHTML = `
        <option value="" disabled selected data-calle="" data-distrito="" data-celular="">
          ⚠️ Sin dirección registrada — Haz clic en [+ Agregar]
        </option>
      `;
    }

    if (inCel && !inCel.value && selectedCelular) {
      inCel.value = selectedCelular;
    }

    state.calle = selectedCalle;
    state.distrito = selectedDistrito;
    state.celular = inCel?.value?.trim() || selectedCelular;
    update();
  }

  // Carga inicial segura después de que todas las variables DOM están inicializadas
  refrescarSelectorDirecciones();

  // Validación estricta antes de abrir WhatsApp si no hay dirección o productos
  function validarYPedir(e) {
    const { count } = calculateTotals();
    if (count === 0) {
      e.preventDefault();
      Notificacion('Por favor selecciona al menos 1 producto antes de pedir.', 'warning');
      return false;
    }
    if (!state.calle) {
      e.preventDefault();
      Notificacion('Por favor agrega o selecciona una dirección de entrega antes de pedir.', 'warning');
      document.dispatchEvent(new CustomEvent('cambiarModuloCliente', { detail: { modulo: 'direccion' } }));
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

  // Textarea de Notas
  inNotas?.addEventListener('input', () => {
    state.notas = inNotas.value;
    update();
  });

  // Selector de Dirección
  selDir?.addEventListener('change', () => {
    const opt = selDir.options[selDir.selectedIndex];
    state.calle = opt ? (opt.dataset.calle || '') : '';
    state.distrito = opt ? (opt.dataset.distrito || 'Surquillo') : 'Surquillo';
    const celFromDir = opt ? (opt.dataset.celular || '') : '';
    if (celFromDir) {
      state.celular = celFromDir;
      if (inCel) inCel.value = celFromDir;
    }
    update();
  });

  // Input manual de Celular / Contacto de entrega
  inCel?.addEventListener('input', () => {
    state.celular = inCel.value.trim();
    update();
  });

  // Botón Agregar Dirección -> Salto al módulo de direcciones
  const btnAddDir = document.getElementById('btnAddDirJump');
  btnAddDir?.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('cambiarModuloCliente', { detail: { modulo: 'direccion' } }));
  });

  // Escuchar evento reactivo global cuando se agregan/editan/eliminan direcciones
  document.addEventListener('direccionesActualizadas', (e) => {
    refrescarSelectorDirecciones(e.detail?.direcciones);
  });

  // Botón Gestionar Ficha -> Salto al módulo cuenta
  const btnFicha = document.getElementById('btnGestionarFicha');
  btnFicha?.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('cambiarModuloCliente', { detail: { modulo: 'cuenta' } }));
  });

  // =========================================================================
  // ⚡ Sincronización Inteligente Híbrida sin Intervals (Cero impacto en Firebase)
  // =========================================================================
  function sincronizarCatalogoFrescoFirestore() {
    const ahora = Date.now();
    const lastFetch = parseInt(localStorage.getItem(PRODUCTOS_TS_KEY) || '0', 10);

    // Si pasaron menos de 10 minutos y ya tenemos datos, no gastar llamadas
    if (ahora - lastFetch < CACHE_TTL_MS && localStorage.getItem(PRODUCTOS_CACHE_KEY)) {
      return;
    }

    // 1 sola llamada REST en background (sin bloquear UI ni usar setInterval)
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);

    fetch('https://firestore.googleapis.com/v1/projects/gaswii/databases/(default)/documents/productos', {
      signal: ctrl.signal
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        clearTimeout(timer);
        if (!data || !Array.isArray(data.documents)) return;

        localStorage.setItem(PRODUCTOS_TS_KEY, ahora.toString());

        // Parsear documentos de Firestore REST
        const nuevosProds = {};
        data.documents.forEach(docRaw => {
          const fields = docRaw.fields || {};
          const id = fields.id?.stringValue || (docRaw.name ? docRaw.name.split('/').pop() : '');
          const precio = Number(fields.precio?.integerValue ?? fields.price?.integerValue ?? 0);
          const estado = fields.estado?.stringValue || 'activo';
          nuevosProds[id] = { precio, estado };
        });

        // Actualizar precios en vivo en el DOM si el dueño de edad cambió algún precio
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

  // Inicializar UI y sincronizar en background si hace falta
  update();
  sincronizarCatalogoFrescoFirestore();
  sincronizarDireccionesDesdeFirestore();
}
