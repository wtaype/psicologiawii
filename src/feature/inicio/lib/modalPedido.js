// src/feature/inicio/lib/modalPedido.js
// 🎯 Modal de Pedido Express Autónomo y On-Demand (0 KiB en carga inicial)
// Se inyecta e inicializa exclusivamente cuando el usuario hace clic en "Pedir Balón"

import { datosNegocio } from '../../../negocio.js';
import { crearEnlaceWhatsApp } from './whatsapp.js';

let modalEl = null;

function obtenerProductosDisponibles() {
  try {
    const raw = localStorage.getItem('gaswii_productos');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(p => p.estado !== 'pausado' && p.estado !== 'inactivo');
      }
    }
  } catch (e) {}
  return datosNegocio.productos || [];
}

function obtenerDistritosDisponibles() {
  try {
    const raw = localStorage.getItem('minegocio');
    if (raw) {
      const cfg = JSON.parse(raw);
      if (Array.isArray(cfg.zonas) && cfg.zonas.length > 0) {
        const activas = cfg.zonas.filter(z => z.activo !== false).map(z => ({
          nombre: z.distrito || '',
          tiempo: `${z.tiempoMin || 8} - ${z.tiempoMax || 18} ${z.unidad || 'min'}`
        }));
        if (activas.length > 0) return activas;
      }
    }
  } catch (e) {}

  const dists = datosNegocio.distritos;
  if (Array.isArray(dists) && dists.length > 0) {
    return dists;
  }

  return [
    { nombre: 'Surquillo', tiempo: '8 - 18 min' },
    { nombre: 'Miraflores', tiempo: '12 - 22 min' },
    { nombre: 'San Borja', tiempo: '15 - 25 min' },
    { nombre: 'San Isidro', tiempo: '15 - 25 min' }
  ];
}

function obtenerUsuarioActivo() {
  try {
    const raw = localStorage.getItem('wiSmile');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function asegurarModalEnDOM() {
  if (document.getElementById('wi_modal_pedido')) {
    return document.getElementById('wi_modal_pedido');
  }

  const prods = obtenerProductosDisponibles();
  const dists = obtenerDistritosDisponibles();
  const user = obtenerUsuarioActivo() || {};

  const primerProd = prods[0] || { id: 'balon-10kg', nombre: 'Balón SOLGAS Premium 10 kg', precioPEN: 65 };
  const precioUnitario = primerProd.precioPEN || primerProd.precio || 65;

  const html = `
    <div id="wi_modal_pedido" class="wiModal" role="dialog" aria-modal="true" aria-labelledby="modalPedTitle">
      <div class="wiModal-content" style="max-width: 520px; padding: 2.5vh 2.5vw;">
        <!-- Header del Modal -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.8vh; border-bottom: 1px solid var(--brd, rgba(255,255,255,0.1)); padding-bottom: 1.2vh;">
          <div>
            <span class="badge-fire" style="font-size: 0.75rem; padding: 0.2vh 0.6vw; border-radius: 999px; margin-bottom: 0.5vh; display: inline-flex; align-items: center; gap: 0.4vw;">
              <i class="fa-solid fa-bolt"></i> Despacho Express en 15-20 min
            </span>
            <h3 id="modalPedTitle" style="font-size: 1.25rem; font-weight: 700; margin: 0; color: var(--tx1);">
              Hacer Pedido de Gas a Domicilio
            </h3>
          </div>
          <button id="btnCerrarModalPed" class="modalX" type="button" aria-label="Cerrar modal" style="cursor: pointer; font-size: 1.3rem; color: var(--muted); padding: 0.4vh 0.6vw; line-height: 1;">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form id="formModalPedido" onsubmit="event.preventDefault(); window.__enviarPedidoModal();">
          <!-- 1. Producto y Cantidad -->
          <div style="display: grid; grid-template-columns: 1fr auto; gap: 1vw; margin-bottom: 1.4vh;">
            <div>
              <label for="pedSelectProd" style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--muted); margin-bottom: 0.4vh;">
                <i class="fa-solid fa-fire" style="color: var(--primary);"></i> Balón de Gas / Producto
              </label>
              <select id="pedSelectProd" style="width: 100%; padding: 1vh 0.8vw; border-radius: 0.8vh; border: 1px solid var(--brd, #ccc); background: var(--bg1); color: var(--tx1); font-size: 0.9rem; font-weight: 600;">
                ${prods.map(p => {
                  const pr = Number(p.precioPEN || p.precio || 0).toFixed(2);
                  const nom = typeof p.nombre === 'object' ? (p.nombre.es || '') : (p.nombre || '');
                  return `<option value="${p.id}" data-precio="${pr}" data-nombre="${nom}">${nom} — S/ ${pr}</option>`;
                }).join('')}
              </select>
            </div>

            <div>
              <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--muted); margin-bottom: 0.4vh;">Cantidad</label>
              <div style="display: flex; align-items: center; border: 1px solid var(--brd, #ccc); border-radius: 0.8vh; background: var(--bg1); overflow: hidden;">
                <button type="button" id="pedBtnMenos" style="padding: 1vh 0.8vw; border: 0; background: transparent; cursor: pointer; color: var(--tx1); font-weight: bold;">-</button>
                <span id="pedQtyDisplay" style="min-width: 32px; text-align: center; font-weight: 700; color: var(--tx1);">1</span>
                <button type="button" id="pedBtnMas" style="padding: 1vh 0.8vw; border: 0; background: transparent; cursor: pointer; color: var(--tx1); font-weight: bold;">+</button>
              </div>
            </div>
          </div>

          <!-- 2. Distrito y Dirección -->
          <div style="margin-bottom: 1.4vh;">
            <label for="pedSelectDistrito" style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--muted); margin-bottom: 0.4vh;">
              <i class="fa-solid fa-location-dot" style="color: #10b981;"></i> Distrito de Cobertura
            </label>
            <select id="pedSelectDistrito" style="width: 100%; padding: 10px 12px; border-radius: 0.8vh; border: 1px solid var(--brd, #ccc); background: var(--bg1); color: var(--tx1); font-size: 0.95rem; margin-bottom: 0.8vh;">
              ${dists.map(d => `<option value="${d.nombre}" ${d.nombre.toLowerCase().includes('surquillo') ? 'selected' : ''}>${d.nombre} (${d.tiempo})</option>`).join('')}
            </select>

            <input 
              type="text" 
              id="pedInputDireccion" 
              placeholder="Dirección exacta (Calle, N° y Dpto/Int)" 
              value="${user.direccionFiscal || (user.direcciones?.[0]?.calle || '')}" 
              required
              style="width: 100%; padding: 10px 12px; border-radius: 0.8vh; border: 1px solid var(--brd, #ccc); background: var(--bg1); color: var(--tx1); font-size: 0.95rem; box-sizing: border-box;"
            />
          </div>

          <!-- 3. Contacto: Nombre y Celular -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1vw; margin-bottom: 1.4vh;">
            <div>
              <label for="pedInputNombre" style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--muted); margin-bottom: 0.4vh;">Tu Nombre</label>
              <input 
                type="text" 
                id="pedInputNombre" 
                placeholder="Nombre o Familia" 
                value="${user.nombre || user.usuario || ''}"
                required
                style="width: 100%; padding: 10px 12px; border-radius: 0.8vh; border: 1px solid var(--brd, #ccc); background: var(--bg1); color: var(--tx1); font-size: 0.95rem; box-sizing: border-box;"
              />
            </div>
            <div>
              <label for="pedInputCelular" style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--muted); margin-bottom: 0.4vh;">Teléfono / Celular</label>
              <input 
                type="tel" 
                id="pedInputCelular" 
                placeholder="9 dígitos" 
                value="${user.celular || ''}"
                style="width: 100%; padding: 10px 12px; border-radius: 0.8vh; border: 1px solid var(--brd, #ccc); background: var(--bg1); color: var(--tx1); font-size: 0.95rem; box-sizing: border-box;"
              />
            </div>
          </div>

          <!-- 4. Medio de Pago -->
          <div style="margin-bottom: 1.8vh;">
            <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--muted); margin-bottom: 0.4vh;">
              <i class="fa-solid fa-credit-card" style="color: var(--brand-blue, #0284c7);"></i> Forma de Pago al Recibir
            </label>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5vw;" id="pedMetodosPagoGroup">
              <button type="button" class="btn-ped-pago active" data-pago="Efectivo contra entrega" style="padding: 0.8vh 0.2vw; font-size: 0.78rem; border-radius: 0.6vh; border: 1px solid var(--primary); background: rgba(255,106,0,0.1); color: var(--tx1); font-weight: bold; cursor: pointer; text-align: center;">💵 Efectivo</button>
              <button type="button" class="btn-ped-pago" data-pago="Yape" style="padding: 0.8vh 0.2vw; font-size: 0.78rem; border-radius: 0.6vh; border: 1px solid var(--brd); background: var(--bg1); color: var(--muted); font-weight: bold; cursor: pointer; text-align: center;">📱 Yape</button>
              <button type="button" class="btn-ped-pago" data-pago="Plin" style="padding: 0.8vh 0.2vw; font-size: 0.78rem; border-radius: 0.6vh; border: 1px solid var(--brd); background: var(--bg1); color: var(--muted); font-weight: bold; cursor: pointer; text-align: center;">💳 Plin</button>
              <button type="button" class="btn-ped-pago" data-pago="Transferencia" style="padding: 0.8vh 0.2vw; font-size: 0.78rem; border-radius: 0.6vh; border: 1px solid var(--brd); background: var(--bg1); color: var(--muted); font-weight: bold; cursor: pointer; text-align: center;">🏦 Transf.</button>
            </div>
          </div>

          <!-- Total Estimado y Botón CTA WhatsApp -->
          <div style="background: rgba(255,106,0,0.06); border: 1px solid rgba(255,106,0,0.2); border-radius: 1vh; padding: 1.2vh 1.2vw; margin-bottom: 1.5vh; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span style="font-size: 0.8rem; color: var(--muted); display: block;">Total a pagar en puerta:</span>
              <strong id="pedTotalDisplay" style="font-size: 1.4rem; color: var(--primary); font-family: Outfit, sans-serif;">S/ ${precioUnitario.toFixed(2)}</strong>
            </div>
            <span style="font-size: 0.78rem; color: #10b981; font-weight: bold; display: flex; align-items: center; gap: 0.3vw;">
              <i class="fa-solid fa-circle-check"></i> Delivery Gratis
            </span>
          </div>

          <!-- Botón de Envío -->
          <button 
            type="submit" 
            id="pedBtnSubmitWa" 
            class="btn-whatsapp" 
            style="width: 100%; justify-content: center; padding: 1.4vh 1.4vw; font-size: 1rem; font-weight: 700; border-radius: 1vh; cursor: pointer;"
          >
            <i class="fa-brands fa-whatsapp text-xl"></i> 
            <span>Pedir por WhatsApp Ahora</span>
          </button>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);
  modalEl = document.getElementById('wi_modal_pedido');

  // Event Listeners del Modal
  document.getElementById('btnCerrarModalPed')?.addEventListener('click', cerrarModalPedido);
  modalEl?.addEventListener('click', (e) => {
    if (e.target === modalEl) cerrarModalPedido();
  });

  // Selector de cantidad (+ / -)
  let qty = 1;
  const qtyDisplay = document.getElementById('pedQtyDisplay');
  const selProd = document.getElementById('pedSelectProd');
  const totalDisplay = document.getElementById('pedTotalDisplay');

  function actualizarTotal() {
    const selOpt = selProd?.selectedOptions[0];
    const precio = parseFloat(selOpt?.getAttribute('data-precio') || '65');
    const total = precio * qty;
    if (totalDisplay) totalDisplay.textContent = `S/ ${total.toFixed(2)}`;
    if (qtyDisplay) qtyDisplay.textContent = String(qty);
  }

  document.getElementById('pedBtnMas')?.addEventListener('click', () => {
    qty++;
    actualizarTotal();
  });

  document.getElementById('pedBtnMenos')?.addEventListener('click', () => {
    if (qty > 1) {
      qty--;
      actualizarTotal();
    }
  });

  selProd?.addEventListener('change', actualizarTotal);

  // Selector de Medio de Pago
  let metodoPago = 'Efectivo contra entrega';
  const btnsPago = document.querySelectorAll('#pedMetodosPagoGroup .btn-ped-pago');
  btnsPago.forEach(btn => {
    btn.addEventListener('click', () => {
      btnsPago.forEach(b => {
        b.style.borderColor = 'var(--brd)';
        b.style.background = 'var(--bg1)';
        b.style.color = 'var(--muted)';
      });
      btn.style.borderColor = 'var(--primary)';
      btn.style.background = 'rgba(255,106,0,0.1)';
      btn.style.color = 'var(--tx1)';
      metodoPago = btn.getAttribute('data-pago') || 'Efectivo contra entrega';
    });
  });

  // Despacho a WhatsApp simple, natural y directo
  window.__enviarPedidoModal = () => {
    const selOpt = selProd?.selectedOptions[0];
    const nomProd = selOpt?.getAttribute('data-nombre') || 'Balón de Gas';
    const precio = parseFloat(selOpt?.getAttribute('data-precio') || '65');
    const total = precio * qty;
    const distrito = document.getElementById('pedSelectDistrito')?.value || 'Surquillo';
    const direccion = document.getElementById('pedInputDireccion')?.value?.trim() || '';
    const rawNombre = document.getElementById('pedInputNombre')?.value?.trim() || '';
    const nombreCliente = rawNombre === 'Cliente' ? '' : rawNombre;
    const celularCliente = document.getElementById('pedInputCelular')?.value?.trim() || '';

    const url = crearEnlaceWhatsApp({
      cliente: nombreCliente,
      celular: celularCliente,
      producto: nomProd,
      precio: total,
      cantidad: qty,
      distrito: distrito,
      direccion: direccion,
      metodoPago: metodoPago
    });

    window.open(url, '_blank');
    cerrarModalPedido();
  };

  return modalEl;
}

export function abrirModalPedido(productoId = '') {
  const modal = asegurarModalEnDOM();
  if (!modal) return;

  if (productoId) {
    const sel = document.getElementById('pedSelectProd');
    if (sel) {
      for (let i = 0; i < sel.options.length; i++) {
        const optText = sel.options[i].text.toLowerCase();
        const optVal = sel.options[i].value.toLowerCase();
        const search = productoId.toLowerCase();
        if (optText.includes(search) || optVal.includes(search)) {
          sel.selectedIndex = i;
          sel.dispatchEvent(new Event('change'));
          break;
        }
      }
    }
  }

  modal.classList.add('active');
  document.body.classList.add('modal-open');
}

export function cerrarModalPedido() {
  const modal = document.getElementById('wi_modal_pedido');
  if (modal) {
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
  }
}

export default {
  abrirModalPedido,
  cerrarModalPedido
};
