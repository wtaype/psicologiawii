// src/feature/personal/modulos/whatsapp/tabs/plantillas.js
// Controlador de la Pestaña 2: Plantillas Oficiales de Despacho & Simulador Smartphone
import { Notificacion } from '@widev';
import { 
  obtenerPlantillasDespacho, 
  formatearPlantillaDespacho 
} from '../lib/dataWhatsapp.js';
import { construirUrlWhatsapp, renderizarWhatsappHtml } from '../lib/formateador.js';
import { datosNegocio } from '@/negocio.js';
import productosSemilla from '@/semillas/productos.json';

let plantillaActualId = 'tpl_pedido_confirmado';

export function initPlantillasTab() {
  const container = document.getElementById('waViewPlantillas');
  if (!container || container.dataset.plantillasInit === 'true') return;
  container.dataset.plantillasInit = 'true';

  const tplsGrid = document.getElementById('waTemplatesGrid');
  const inpCliente = document.getElementById('waInpCliente');
  const inpCelular = document.getElementById('waInpCelular');
  const inpPedidoId = document.getElementById('waInpPedidoId');
  const selProducto = document.getElementById('waInpProducto');
  const inpMonto = document.getElementById('waInpMonto');
  const inpDireccion = document.getElementById('waInpDireccion');
  const inpDistrito = document.getElementById('waInpDistrito');
  const inpEta = document.getElementById('waInpEta');
  const textareaFinal = document.getElementById('waTextareaMensajeFinal');

  // Elementos del Simulador Smartphone
  const chatBubble = document.getElementById('waChatBubbleText');
  const chatTime = document.getElementById('waChatTime');
  const phoneClock = document.getElementById('waPhoneClock');
  const btnOpenWs = document.getElementById('btnWaOpenWs');
  const btnCopy = document.getElementById('btnWaCopy');

  // 1. Recoger valores actuales de variables operativas
  function obtenerValoresOperativos() {
    return {
      cliente: inpCliente?.value?.trim() || 'Estimado/a cliente',
      celular: inpCelular?.value?.trim() || '',
      pedidoId: inpPedidoId?.value?.trim() || '001',
      producto: selProducto?.value?.trim() || datosNegocio?.productoPrincipal || productosSemilla?.[0]?.nombre || 'Producto Principal',
      monto: inpMonto?.value?.trim() || '0.00',
      precioMayorista: '0.00',
      direccion: inpDireccion?.value?.trim() || datosNegocio?.ubicacion?.direccion || '',
      distrito: inpDistrito?.value?.trim() || datosNegocio?.ubicacion?.distrito || '',
      tiempoEstimado: inpEta?.value?.trim() || 'Atención Inmediata'
    };
  }

  // 2. Actualizar Previsualización en Vivo
  function actualizarPreview(sobrescribir = false) {
    let texto = '';
    if (sobrescribir || !textareaFinal?.dataset.manualEdit) {
      const vals = obtenerValoresOperativos();
      texto = formatearPlantillaDespacho(plantillaActualId, vals);
      if (textareaFinal) {
        textareaFinal.value = texto;
        delete textareaFinal.dataset.manualEdit;
      }
    } else {
      texto = textareaFinal?.value || '';
    }

    if (chatBubble) {
      chatBubble.innerHTML = renderizarWhatsappHtml(texto);
    }

    if (chatTime) {
      const now = new Date();
      chatTime.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }
  }

  // 3. Renderizar las Tarjetas de Selección de Plantillas
  function renderizarPlantillas() {
    if (!tplsGrid) return;
    const lista = obtenerPlantillasDespacho();

    tplsGrid.innerHTML = lista.map(tpl => {
      const isActive = tpl.id === plantillaActualId;
      return `
        <div class="wa-tpl-card ${isActive ? 'active' : ''}" data-id="${tpl.id}">
          <div class="wa-tpl-head">
            <i class="${tpl.icono || 'fa-solid fa-message'}"></i>
            <span>${tpl.nombre}</span>
          </div>
          <div class="wa-tpl-desc">${tpl.descripcion || ''}</div>
        </div>
      `;
    }).join('');

    tplsGrid.querySelectorAll('.wa-tpl-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        if (id) {
          plantillaActualId = id;
          tplsGrid.querySelectorAll('.wa-tpl-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          actualizarPreview(true);
        }
      });
    });
  }

  // 4. Listeners en Vivo para el formulario
  const inputs = [inpCliente, inpCelular, inpPedidoId, selProducto, inpMonto, inpDireccion, inpDistrito, inpEta];
  inputs.forEach(input => {
    input?.addEventListener('input', () => actualizarPreview(false));
    input?.addEventListener('change', () => actualizarPreview(false));
  });

  textareaFinal?.addEventListener('input', () => {
    textareaFinal.dataset.manualEdit = 'true';
    if (chatBubble) {
      chatBubble.innerHTML = renderizarWhatsappHtml(textareaFinal.value);
    }
  });

  // 5. Botones de Disparo Directo
  btnOpenWs?.addEventListener('click', () => {
    const texto = textareaFinal?.value || '';
    const celDestino = inpCelular?.value?.trim() || '';
    const url = construirUrlWhatsapp(texto, celDestino);
    window.open(url, '_blank');
  });

  btnCopy?.addEventListener('click', async () => {
    const texto = textareaFinal?.value || '';
    if (!texto) return;

    try {
      await navigator.clipboard.writeText(texto);
      Notificacion('Mensaje de WhatsApp copiado al portapapeles.', 'success', 2000);
    } catch (e) {
      Notificacion('No se pudo copiar automáticamente.', 'warning', 2000);
    }
  });

  // 6. Reloj del Smartphone
  function updateReloj() {
    if (phoneClock) {
      const now = new Date();
      phoneClock.textContent = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    }
  }
  updateReloj();
  setInterval(updateReloj, 30000);

  // Inicialización
  renderizarPlantillas();
  actualizarPreview(true);
}

export default { initPlantillasTab };
