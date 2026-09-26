// src/feature/inicio/lib/modalPedido.js
// 🎯 Modal de Agendamiento Psicológico Autónomo y On-Demand (0 KiB en carga inicial)
// Se inyecta e inicializa cuando el usuario hace clic en "Agendar Cita"

import { datosNegocio } from '../../../negocio.js';

let modalEl = null;

function obtenerServiciosDisponibles() {
  return datosNegocio.servicios || [];
}

function obtenerSedesDisponibles() {
  return datosNegocio.sedes || [];
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

  const servs = obtenerServiciosDisponibles();
  const sedes = obtenerSedesDisponibles();
  const user = obtenerUsuarioActivo() || {};

  const primerServ = servs[0] || { id: 'terapia-individual', nombre: 'Psicoterapia Individual para Adultos', precioPEN: 85 };
  const precioUnitario = primerServ.precioPEN || 85;

  const html = `
    <div id="wi_modal_pedido" class="wiModal" role="dialog" aria-modal="true" aria-labelledby="modalPedTitle">
      <div class="wiModal-content" style="max-width: 540px; padding: 2.5vh 2.5vw; border-radius: 1.4vh; background: var(--bg-card, #ffffff); border: 1px solid var(--border-card, #e1e9ec); box-shadow: 0 20px 50px rgba(16, 67, 86, 0.25);">
        
        <!-- Header del Modal -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.8vh; border-bottom: 1px solid var(--border-card, #e1e9ec); padding-bottom: 1.2vh;">
          <div>
            <span style="font-size: 0.76rem; font-weight: 700; padding: 0.3vh 0.8vw; border-radius: 999px; background: var(--brand-soft, #e5f4fa); color: var(--brand-primary, #104356); display: inline-flex; align-items: center; gap: 0.4rem; margin-bottom: 0.4vh;">
              <i class="fa-solid fa-calendar-check"></i> Cita Psicológica · Lic. Sofía Reynaga
            </span>
            <h3 id="modalPedTitle" style="font-size: clamp(1.15rem, 1.3vw, 1.4rem); font-weight: 800; margin: 0; color: var(--text-bright, #071923); font-family: 'Outfit', sans-serif;">
              Agendar Sesión de Consulta
            </h3>
          </div>
          <button id="btnCerrarModalPed" class="modalX" type="button" aria-label="Cerrar modal" style="background: none; border: none; font-size: 1.4rem; color: var(--text-muted, #486576); cursor: pointer; padding: 0.4rem; line-height: 1; border-radius: 0.6vh;">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form id="formModalPedido" onsubmit="event.preventDefault(); window.__enviarPedidoModal();">
          
          <!-- 1. Especialidad Terapéutica -->
          <div style="margin-bottom: 1.4vh;">
            <label for="pedSelectProd" style="display: block; font-size: 0.82rem; font-weight: 600; color: var(--text-muted, #486576); margin-bottom: 0.4vh;">
              <i class="fa-solid fa-stethoscope" style="color: var(--brand-primary, #104356);"></i> Especialidad o Servicio
            </label>
            <select id="pedSelectProd" style="width: 100%; padding: 1.1vh 1vw; border-radius: 0.8vh; border: 1.5px solid var(--border-card, #dceaf2); background: var(--bg-surface, #ffffff); color: var(--text-main, #0f2735); font-size: 0.9rem; font-weight: 600;">
              ${servs.map(s => {
                const pr = Number(s.precioPEN || s.precio || 85).toFixed(2);
                const nom = typeof s.nombre === 'object' ? (s.nombre.es || '') : (s.nombre || '');
                return `<option value="${s.id}" data-precio="${pr}" data-nombre="${nom}">${nom} — S/ ${pr}</option>`;
              }).join('')}
            </select>
          </div>

          <!-- 2. Sede o Modalidad -->
          <div style="margin-bottom: 1.4vh;">
            <label for="pedSelectSede" style="display: block; font-size: 0.82rem; font-weight: 600; color: var(--text-muted, #486576); margin-bottom: 0.4vh;">
              <i class="fa-solid fa-location-dot" style="color: var(--brand-blue, #1e5e75);"></i> Modalidad / Sede
            </label>
            <select id="pedSelectSede" style="width: 100%; padding: 1.1vh 1vw; border-radius: 0.8vh; border: 1.5px solid var(--border-card, #dceaf2); background: var(--bg-surface, #ffffff); color: var(--text-main, #0f2735); font-size: 0.9rem; font-weight: 600;">
              ${sedes.map(s => `<option value="${s.nombre}">${s.nombre} (${s.atencion})</option>`).join('')}
            </select>
          </div>

          <!-- 3. Datos del Paciente: Nombre y Celular -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1vw; margin-bottom: 1.4vh;">
            <div>
              <label for="pedInputNombre" style="display: block; font-size: 0.82rem; font-weight: 600; color: var(--text-muted, #486576); margin-bottom: 0.4vh;">Tu Nombre Completo</label>
              <input 
                type="text" 
                id="pedInputNombre" 
                placeholder="Ej. Ana Morales" 
                value="${user.nombre || user.usuario || ''}"
                required
                style="width: 100%; padding: 1.1vh 1vw; border-radius: 0.8vh; border: 1.5px solid var(--border-card, #dceaf2); background: var(--bg-surface, #ffffff); color: var(--text-main, #0f2735); font-size: 0.9rem; box-sizing: border-box;"
              />
            </div>
            <div>
              <label for="pedInputCelular" style="display: block; font-size: 0.82rem; font-weight: 600; color: var(--text-muted, #486576); margin-bottom: 0.4vh;">Teléfono / WhatsApp</label>
              <input 
                type="tel" 
                id="pedInputCelular" 
                placeholder="9 dígitos" 
                value="${user.celular || ''}"
                required
                style="width: 100%; padding: 1.1vh 1vw; border-radius: 0.8vh; border: 1.5px solid var(--border-card, #dceaf2); background: var(--bg-surface, #ffffff); color: var(--text-main, #0f2735); font-size: 0.9rem; box-sizing: border-box;"
              />
            </div>
          </div>

          <!-- 4. Medio de Pago Preferido -->
          <div style="margin-bottom: 1.8vh;">
            <label style="display: block; font-size: 0.82rem; font-weight: 600; color: var(--text-muted, #486576); margin-bottom: 0.4vh;">
              <i class="fa-solid fa-credit-card" style="color: var(--brand-blue, #1e5e75);"></i> Forma de Pago Preferida
            </label>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5vw;" id="pedMetodosPagoGroup">
              <button type="button" class="btn-ped-pago active" data-pago="Yape" style="padding: 0.8vh 0.2vw; font-size: 0.8rem; border-radius: 0.6vh; border: 1px solid var(--brand-primary, #104356); background: var(--brand-soft, #e5f4fa); color: var(--brand-primary, #104356); font-weight: bold; cursor: pointer; text-align: center;">📱 Yape</button>
              <button type="button" class="btn-ped-pago" data-pago="Plin" style="padding: 0.8vh 0.2vw; font-size: 0.8rem; border-radius: 0.6vh; border: 1px solid var(--border-card, #dceaf2); background: var(--bg-surface, #ffffff); color: var(--text-muted, #486576); font-weight: bold; cursor: pointer; text-align: center;">💳 Plin</button>
              <button type="button" class="btn-ped-pago" data-pago="Transferencia" style="padding: 0.8vh 0.2vw; font-size: 0.8rem; border-radius: 0.6vh; border: 1px solid var(--border-card, #dceaf2); background: var(--bg-surface, #ffffff); color: var(--text-muted, #486576); font-weight: bold; cursor: pointer; text-align: center;">🏦 Transf.</button>
              <button type="button" class="btn-ped-pago" data-pago="Efectivo en Sede" style="padding: 0.8vh 0.2vw; font-size: 0.8rem; border-radius: 0.6vh; border: 1px solid var(--border-card, #dceaf2); background: var(--bg-surface, #ffffff); color: var(--text-muted, #486576); font-weight: bold; cursor: pointer; text-align: center;">💵 Efectivo</button>
            </div>
          </div>

          <!-- Total de Referencia -->
          <div style="background: var(--brand-soft, #e5f4fa); border: 1px solid var(--border-accent, rgba(16,67,86,0.2)); border-radius: 1vh; padding: 1.2vh 1.2vw; margin-bottom: 1.5vh; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span style="font-size: 0.78rem; color: var(--text-muted, #486576); display: block;">Inversión por sesión:</span>
              <strong id="pedTotalDisplay" style="font-size: 1.35rem; color: var(--brand-primary, #104356); font-family: 'Outfit', sans-serif;">S/ ${precioUnitario.toFixed(2)}</strong>
            </div>
            <span style="font-size: 0.78rem; color: #10b981; font-weight: bold; display: flex; align-items: center; gap: 0.3vw;">
              <i class="fa-solid fa-lock"></i> 100% Confidencial
            </span>
          </div>

          <!-- Botón de Envío WhatsApp -->
          <button 
            type="submit" 
            id="pedBtnSubmitWa" 
            class="btn-whatsapp" 
            style="width: 100%; justify-content: center; padding: 1.3vh 1.4vw; font-size: 0.98rem; font-weight: 700; border-radius: 1vh; cursor: pointer;"
          >
            <i class="fa-brands fa-whatsapp" style="font-size: 1.25rem;"></i> 
            <span>Solicitar Horario por WhatsApp</span>
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

  const selProd = document.getElementById('pedSelectProd');
  const totalDisplay = document.getElementById('pedTotalDisplay');

  function actualizarTotal() {
    const selOpt = selProd?.selectedOptions[0];
    const precio = parseFloat(selOpt?.getAttribute('data-precio') || '85');
    if (totalDisplay) totalDisplay.textContent = `S/ ${precio.toFixed(2)}`;
  }

  selProd?.addEventListener('change', actualizarTotal);

  // Selector de Método de Pago
  const pagoBtns = modalEl.querySelectorAll('.btn-ped-pago');
  pagoBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      pagoBtns.forEach(b => {
        b.classList.remove('active');
        b.style.borderColor = 'var(--border-card, #dceaf2)';
        b.style.background = 'var(--bg-surface, #ffffff)';
        b.style.color = 'var(--text-muted, #486576)';
      });
      btn.classList.add('active');
      btn.style.borderColor = 'var(--brand-primary, #104356)';
      btn.style.background = 'var(--brand-soft, #e5f4fa)';
      btn.style.color = 'var(--brand-primary, #104356)';
    });
  });

  // Handler de Envío
  window.__enviarPedidoModal = function() {
    const selOpt = selProd?.selectedOptions[0];
    const nomServicio = selOpt?.getAttribute('data-nombre') || 'Consulta Psicológica';
    const precio = selOpt?.getAttribute('data-precio') || '85.00';
    const sede = document.getElementById('pedSelectSede')?.value || 'Sede Miraflores';
    const nombre = document.getElementById('pedInputNombre')?.value || 'Paciente';
    const celular = document.getElementById('pedInputCelular')?.value || '';
    
    const pagoActivo = modalEl.querySelector('.btn-ped-pago.active');
    const metodoPago = pagoActivo?.getAttribute('data-pago') || 'Yape';

    const mensaje = `Hola Lic. Sofía Reynaga, deseo agendar una sesión terapéutica:\n\n` +
      `• Especialidad: ${nomServicio} (S/ ${precio})\n` +
      `• Modalidad / Sede: ${sede}\n` +
      `• Paciente: ${nombre}\n` +
      (celular ? `• Celular: ${celular}\n` : '') +
      `• Medio de Pago: ${metodoPago}\n\n` +
      `¿Qué horarios tiene disponibles esta semana? Gracias.`;

    const url = `https://wa.me/${datosNegocio.whatsappLimpio}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    cerrarModalPedido();
  };

  return modalEl;
}

export function abrirModalPedido(idProducto = null) {
  const modal = asegurarModalEnDOM();
  if (idProducto) {
    const sel = document.getElementById('pedSelectProd');
    if (sel) {
      for (let i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === idProducto) {
          sel.selectedIndex = i;
          sel.dispatchEvent(new Event('change'));
          break;
        }
      }
    }
  }
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function cerrarModalPedido() {
  if (modalEl) {
    modalEl.classList.remove('active');
  }
  document.body.style.overflow = '';
}

if (typeof window !== 'undefined') {
  window.abrirModalPedido = abrirModalPedido;
  window.cerrarModalPedido = cerrarModalPedido;
}
