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

let canalActualId = 'canal_servicio_consulta';

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
  const testBoxServicio = document.getElementById('waTestVars_servicio');
  const testBoxTaller = document.getElementById('waTestVars_taller');
  const testBoxCotizador = document.getElementById('waTestVars_cotizador');
  const testBoxGeneral = document.getElementById('waTestVars_general');

  // Inputs de simulación
  const simProd = document.getElementById('waSimProd');
  const simPrecio = document.getElementById('waSimPrecio');
  const simModalidad = document.getElementById('waSimModalidad');
  const simTaller = document.getElementById('waSimTaller');
  const simDuracion = document.getElementById('waSimDuracion');
  const simPublico = document.getElementById('waSimPublico');
  const simCotServicio = document.getElementById('waSimCotServicio');
  const simCantidad = document.getElementById('waSimCantidad');
  const simTotal = document.getElementById('waSimTotal');
  const simCotModalidad = document.getElementById('waSimCotModalidad');

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
      servicio: simProd?.value || 'Psicoterapia Individual (TCC)',
      producto: simProd?.value || 'Psicoterapia Individual (TCC)',
      precio: simPrecio?.value || '85.00',
      modalidad: simModalidad?.value || 'Presencial / Online (Google Meet)',
      taller: simTaller?.value || 'Taller de Inteligencia Emocional & Manejo del Estrés',
      duracion: simDuracion?.value || '4 sesiones (Sábados 4:00 pm)',
      publico: simPublico?.value || 'Jóvenes y Adultos',
      cantidad: simCantidad?.value || '4 sesiones',
      total: simTotal?.value || '320.00',
      cliente: 'Consultante',
      nombreNegocio: datosNegocio?.nombreCorto || datosNegocio?.nombre || 'Consultorio Psicológico América'
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
    let canal = col.canalesWeb?.find(c => c.id === canalId);
    if (!canal) {
      canal = col.canalesWeb?.[0];
      if (canal) canalActualId = canal.id;
      else return;
    }

    // Actualizar selector visual
    container.querySelectorAll('.wa-channel-sel-card').forEach(card => {
      card.classList.toggle('active', card.dataset.canalId === canalActualId);
    });

    if (canalTitle) canalTitle.textContent = canal.nombre;
    if (canalBadge) {
      canalBadge.textContent = canal.id === 'canal_servicio_consulta' ? 'Especialidades Clínicas' :
        canal.id === 'canal_taller_vivencial' ? 'Talleres Vivenciales' :
        canal.id === 'canal_calculadora_cotizador' ? 'Cotizador Terapéutico' : 'Header / Redes';
    }
    if (canalDesc) canalDesc.textContent = canal.descripcion;
    if (textarea) textarea.value = canal.formatoMensaje || '';

    // Mostrar/ocultar cajas de variables de prueba
    if (testBoxServicio) testBoxServicio.style.display = canalActualId === 'canal_servicio_consulta' ? 'grid' : 'none';
    if (testBoxTaller) testBoxTaller.style.display = canalActualId === 'canal_taller_vivencial' ? 'grid' : 'none';
    if (testBoxCotizador) testBoxCotizador.style.display = canalActualId === 'canal_calculadora_cotizador' ? 'grid' : 'none';
    if (testBoxGeneral) testBoxGeneral.style.display = canalActualId === 'canal_general_header' ? 'grid' : 'none';

    renderizarChips(canal.variablesPermitidas || ['servicio', 'precio', 'modalidad']);
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

  // Sincronizar precio automáticamente al cambiar de servicio
  simProd?.addEventListener('change', () => {
    const opt = simProd.options[simProd.selectedIndex];
    const precio = opt?.getAttribute('data-precio');
    if (precio && simPrecio) {
      simPrecio.value = precio;
    }
    actualizarPreview();
  });

  const simInputs = [
    simProd, simPrecio, simModalidad, simTaller, simDuracion, 
    simPublico, simCotServicio, simCantidad, simTotal, simCotModalidad
  ];
  simInputs.forEach(inp => {
    inp?.addEventListener('input', actualizarPreview);
    inp?.addEventListener('change', actualizarPreview);
  });

  // 7. Botones de Disparo Directo en el Smartphone
  btnOpenWs?.addEventListener('click', () => {
    const col = obtenerColeccion();
    const tel = inpTelOficial?.value?.trim() || col.telefonoOficial || '51960332958';
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
      col.telefonoOficial = clean.startsWith('51') ? clean : (clean.length === 9 ? `51${clean}` : '51960332958');
    }
    const canal = col.canalesWeb?.find(c => c.id === canalActualId);
    if (canal && textarea) {
      canal.formatoMensaje = textarea.value.trim();
    }
    guardarColeccion(col);
    Notificacion('Ajustes de Canales Web guardados exitosamente.', 'success', 2200);
  });

  btnResetTop?.addEventListener('click', () => {
    if (confirm('¿Deseas restaurar todos los canales web a los formatos originales del consultorio?')) {
      restaurarColeccion();
      cargarCanal(canalActualId);
      if (inpTelOficial) {
        const col = obtenerColeccion();
        inpTelOficial.value = String(col.telefonoOficial || '51960332958').replace(/^51/, '');
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
    inpTelOficial.value = String(col.telefonoOficial || '51960332958').replace(/^51/, '');
  }
  cargarCanal(canalActualId);
}

export default { initCanalesTab };