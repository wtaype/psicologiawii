// src/feature/personal/modulos/whatsapp/tabs/canales.js
// Controlador de la Pestaña 1: Ajustes / Canales Web con Layout 60%/40% y Smartphone Preview
import { Notificacion } from '@widev';
import { 
  obtenerColeccion, 
  guardarColeccion, 
  restaurarColeccion,
  formatearCanal
} from '../lib/dataWhatsapp.js';
import { 
  construirUrlWhatsapp, 
  renderizarWhatsappHtml, 
  obtenerSaludoHora 
} from '../lib/formateador.js';
import { datosNegocio } from '@/negocio.js';
import productosSemilla from '@/semillas/productos.json';

let canalActualId = 'canal_catalogo_producto';

export function initCanalesTab() {
  const container = document.getElementById('waViewCanales');
  if (!container || container.dataset.canalesInit === 'true') return;
  container.dataset.canalesInit = 'true';

  const inpTelOficial = document.getElementById('waInputOficial');
  const btnGuardarTop = document.getElementById('waBtnGuardarTodo');
  const btnResetTop = document.getElementById('waBtnResetCanales');

  // Elementos del Editor de Canal Activo
  const canalTitle = document.getElementById('waCanalTitle');
  const canalBadge = document.getElementById('waCanalBadge');
  const canalDesc = document.getElementById('waCanalDesc');
  const textarea = document.getElementById('waTextareaCanalActivo');
  const counterBadge = document.getElementById('waCntCanalActivo');
  const chipsContainer = document.getElementById('waChipsContainer');

  // Cajas de variables de prueba en vivo
  const testBoxCatalogo = document.getElementById('waTestVars_catalogo');
  const testBoxModal = document.getElementById('waTestVars_modal');
  const testBoxGeneral = document.getElementById('waTestVars_general');
  const testBoxCalculadora = document.getElementById('waTestVars_calculadora');

  // Inputs de simulación
  const simProd = document.getElementById('waSimProd');
  const simPrecio = document.getElementById('waSimPrecio');
  const simCliente = document.getElementById('waSimCliente');
  const simDireccion = document.getElementById('waSimDireccion');
  const simDistrito = document.getElementById('waSimDistrito');
  const simPago = document.getElementById('waSimPago');
  const simKg = document.getElementById('waSimKg');
  const simPersonas = document.getElementById('waSimPersonas');
  const simDias = document.getElementById('waSimDias');

  // Smartphone Preview de Canales
  const chatBubble = document.getElementById('waChatBubbleCanales');
  const chatTime = document.getElementById('waChatTimeCanales');
  const phoneClock = document.getElementById('waPhoneClockCanales');
  const btnOpenWs = document.getElementById('btnWaOpenWsCanales');
  const btnCopy = document.getElementById('btnWaCopyCanales');

  // 1. Obtener valores simulados según el canal activo
  function obtenerValoresSimulacion() {
    return {
      saludo: obtenerSaludoHora(),
      producto: simProd?.value || datosNegocio?.productoPrincipal || productosSemilla?.[0]?.nombre || 'Producto Principal',
      precio: simPrecio?.value || '0.00',
      total: simPrecio?.value || '0.00',
      cantidad: 1,
      cliente: simCliente?.value?.trim() || 'Cliente Frecuente',
      direccion: simDireccion?.value?.trim() || datosNegocio?.ubicacion?.direccion || '',
      distrito: simDistrito?.value?.trim() || datosNegocio?.ubicacion?.distrito || '',
      metodoPago: simPago?.value || 'Efectivo / Digital',
      kg: simKg?.value || '10',
      personas: simPersonas?.value || '3',
      dias: simDias?.value || '30'
    };
  }

  // 2. Actualizar Previsualización en el Smartphone
  function actualizarPreview() {
    const col = obtenerColeccion();
    const canal = col.canalesWeb?.find(c => c.id === canalActualId);
    if (!canal) return;

    const plantilla = textarea ? textarea.value : (canal.formatoMensaje || '');
    const vals = obtenerValoresSimulacion();
    const textoSimulado = formatearCanal(canalActualId, { ...vals, ...canal, formatoMensaje: plantilla });

    if (chatBubble) {
      chatBubble.innerHTML = renderizarWhatsappHtml(textoSimulado);
    }

    if (chatTime) {
      const now = new Date();
      chatTime.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }

    // Actualizar contador
    if (textarea && counterBadge) {
      const len = textarea.value.length;
      counterBadge.textContent = `${len} caracteres`;
      counterBadge.classList.remove('optimal', 'warning', 'danger');
      if (len <= 160) counterBadge.classList.add('optimal');
      else if (len <= 260) counterBadge.classList.add('warning');
      else counterBadge.classList.add('danger');
    }
  }

  // 3. Renderizar Chips de Etiquetas Dinámicas para el canal seleccionado
  function renderizarChips(variables = []) {
    if (!chipsContainer) return;
    chipsContainer.innerHTML = variables.map(v => `
      <button type="button" class="wa-tag-chip" data-tag=" {${v}}">
        <i class="fa-solid fa-plus"></i> ${v}
      </button>
    `).join('');

    chipsContainer.querySelectorAll('.wa-tag-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        const tag = chip.dataset.tag;
        if (!tag || !textarea) return;

        const start = textarea.selectionStart ?? textarea.value.length;
        const end = textarea.selectionEnd ?? textarea.value.length;
        const textoActual = textarea.value;

        textarea.value = textoActual.substring(0, start) + tag + textoActual.substring(end);
        textarea.focus();
        const newPos = start + tag.length;
        textarea.setSelectionRange(newPos, newPos);

        guardarEnMemoriaCanalActual();
        actualizarPreview();
      });
    });
  }

  // 4. Guardar cambios del textarea en el canal activo temporal
  function guardarEnMemoriaCanalActual() {
    if (!textarea) return;
    const col = obtenerColeccion();
    const canal = col.canalesWeb?.find(c => c.id === canalActualId);
    if (canal) {
      canal.formatoMensaje = textarea.value;
      guardarColeccion(col);
    }
  }

  // 5. Cargar Canal Seleccionado en el Editor
  function cargarCanal(canalId) {
    canalActualId = canalId;
    const col = obtenerColeccion();
    const canal = col.canalesWeb?.find(c => c.id === canalId);
    if (!canal) return;

    // Actualizar selector visual
    container.querySelectorAll('.wa-channel-sel-card').forEach(card => {
      card.classList.toggle('active', card.dataset.canalId === canalId);
    });

    if (canalTitle) canalTitle.textContent = canal.nombre;
    if (canalBadge) canalBadge.textContent = canal.id === 'canal_catalogo_producto' ? 'Tarjetas de Balones' :
      canal.id === 'canal_modal_express' ? 'Checkout en Modal' :
      canal.id === 'canal_calculadora' ? 'Calculadora de Gas' : 'Header / Redes';
    if (canalDesc) canalDesc.textContent = canal.descripcion;
    if (textarea) textarea.value = canal.formatoMensaje || '';

    // Mostrar/ocultar cajas de variables de prueba
    if (testBoxCatalogo) testBoxCatalogo.style.display = canalId === 'canal_catalogo_producto' ? 'grid' : 'none';
    if (testBoxModal) testBoxModal.style.display = canalId === 'canal_modal_express' ? 'grid' : 'none';
    if (testBoxGeneral) testBoxGeneral.style.display = canalId === 'canal_general_header' ? 'grid' : 'none';
    if (testBoxCalculadora) testBoxCalculadora.style.display = canalId === 'canal_calculadora' ? 'grid' : 'none';

    renderizarChips(canal.variablesPermitidas || ['saludo', 'producto', 'precio']);
    actualizarPreview();
  }

  // 6. Listeners del Selector Superior de Canales
  container.querySelectorAll('.wa-channel-sel-card').forEach(card => {
    card.addEventListener('click', () => {
      const cid = card.dataset.canalId;
      if (cid && cid !== canalActualId) {
        guardarEnMemoriaCanalActual();
        cargarCanal(cid);
      }
    });
  });

  // Listeners de cambios en textarea y variables de prueba
  textarea?.addEventListener('input', () => {
    guardarEnMemoriaCanalActual();
    actualizarPreview();
  });

  const simInputs = [simProd, simPrecio, simCliente, simDireccion, simDistrito, simPago, simKg, simPersonas, simDias];
  simInputs.forEach(inp => {
    inp?.addEventListener('input', actualizarPreview);
    inp?.addEventListener('change', actualizarPreview);
  });

  // 7. Botones de Disparo Directo en el Smartphone
  btnOpenWs?.addEventListener('click', () => {
    const col = obtenerColeccion();
    const tel = inpTelOficial?.value?.trim() || col.telefonoOficial || '51936369384';
    const vals = obtenerValoresSimulacion();
    const texto = formatearCanal(canalActualId, { ...vals, formatoMensaje: textarea?.value || '' });
    const url = construirUrlWhatsapp(texto, tel);
    window.open(url, '_blank');
  });

  btnCopy?.addEventListener('click', async () => {
    const vals = obtenerValoresSimulacion();
    const texto = formatearCanal(canalActualId, { ...vals, formatoMensaje: textarea?.value || '' });
    if (!texto) return;

    try {
      await navigator.clipboard.writeText(texto);
      Notificacion('Mensaje de prueba copiado al portapapeles.', 'success', 2000);
    } catch (e) {
      Notificacion('No se pudo copiar automáticamente.', 'warning', 2000);
    }
  });

  // 8. Botones de la barra superior (Guardar y Restaurar)
  btnGuardarTop?.addEventListener('click', () => {
    const col = obtenerColeccion();
    if (inpTelOficial) {
      const clean = inpTelOficial.value.trim().replace(/\D/g, '');
      col.telefonoOficial = clean.startsWith('51') ? clean : (clean.length === 9 ? `51${clean}` : '51936369384');
    }
    const canal = col.canalesWeb?.find(c => c.id === canalActualId);
    if (canal && textarea) {
      canal.formatoMensaje = textarea.value.trim();
    }
    guardarColeccion(col);
    Notificacion('Ajustes de Canales Web guardados exitosamente.', 'success', 2200);
  });

  btnResetTop?.addEventListener('click', () => {
    if (confirm('¿Deseas restaurar todos los canales web a los formatos originales de Gaswii?')) {
      restaurarColeccion();
      cargarCanal(canalActualId);
      if (inpTelOficial) {
        const col = obtenerColeccion();
        inpTelOficial.value = String(col.telefonoOficial || '51936369384').replace(/^51/, '');
      }
      Notificacion('Canales web restaurados a valores por defecto.', 'info', 2200);
    }
  });

  // Reloj del Smartphone
  function updateReloj() {
    if (phoneClock) {
      const now = new Date();
      phoneClock.textContent = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    }
  }
  updateReloj();
  setInterval(updateReloj, 30000);

  // Inicialización
  const col = obtenerColeccion();
  if (inpTelOficial) {
    inpTelOficial.value = String(col.telefonoOficial || '51936369384').replace(/^51/, '');
  }
  cargarCanal(canalActualId);
}

export default { initCanalesTab };
