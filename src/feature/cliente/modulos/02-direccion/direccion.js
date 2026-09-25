// src/feature/cliente/modulos/02-direccion/direccion.js
// Controlador Frontend del Módulo 02-Dirección · Solgas Surquillo
// Split Layout con selección directa de lugar (Casa, Trabajo, Empresa, Oficina, Otros)
// Apple cards para Principal y Tiempo Aprox reactivo · Sincronización en segundo plano

import { Mensaje, wiConfirmar, wiSpin, getls } from '@widev';
import {
  obtenerDireccionesLocal,
  guardarDireccion,
  eliminarDireccion,
  establecerPrincipal,
  sincronizarDireccionesDesdeFirestore
} from './dataDireccion.js';

let inicializado = false;

const ETA_POR_DISTRITO = {
  'Surquillo': '12–15 min',
  'Miraflores': '15–20 min',
  'San Borja': '18–22 min',
  'San Isidro': '20–25 min',
  'Barranco': '20–25 min',
  'Santiago de Surco': '22–28 min'
};

function getIconoPorAlias(alias = '') {
  const al = (alias || '').toLowerCase();
  if (al.includes('casa')) return 'fa-house';
  if (al.includes('trabajo')) return 'fa-briefcase';
  if (al.includes('empresa')) return 'fa-building';
  if (al.includes('oficina')) return 'fa-desktop';
  return 'fa-location-dot';
}

function actualizarBadgeEta(distritoNombre) {
  const badge = document.getElementById('cdTiempoAproxBadge');
  if (!badge) return;
  const eta = ETA_POR_DISTRITO[distritoNombre] || '15–20 min';
  badge.textContent = eta;
}

function resetearFormulario() {
  const form = document.getElementById('cdFormDireccion');
  if (!form) return;
  form.reset();

  const hiddenId = document.getElementById('cdFormId');
  if (hiddenId) hiddenId.value = '';

  const titleText = document.getElementById('cdEditorTitleText');
  if (titleText) titleText.textContent = 'Registrar Dirección';

  const icon = document.getElementById('cdEditorIcon');
  if (icon) icon.className = 'fa-solid fa-circle-plus';

  const btnText = document.getElementById('cdBtnGuardarText');
  if (btnText) btnText.textContent = 'Guardar Dirección';

  const btnCancel = document.getElementById('cdBtnCancelarEdicion');
  if (btnCancel) btnCancel.style.display = 'none';

  // Seleccionar 'Casa' por defecto
  document.querySelectorAll('#cdChipsRow .cd-chip-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.alias === 'Casa');
  });

  // Switch principal por defecto
  const chkPrincipal = document.getElementById('cdFormPrincipal');
  if (chkPrincipal) chkPrincipal.checked = true;

  // Celular por defecto del perfil si existe
  const user = getls('wiSmile') || (typeof window !== 'undefined' ? window.__GASWII_USER__ : null);
  const inputCelular = document.getElementById('cdFormCelular');
  if (inputCelular && user?.celular) {
    inputCelular.value = user.celular;
  }

  // Restaurar tiempo estimado a Surquillo
  actualizarBadgeEta('Surquillo');
}

function cargarDireccionEnFormulario(dir) {
  const hiddenId = document.getElementById('cdFormId');
  const inputCalle = document.getElementById('cdFormCalle');
  const inputDpto = document.getElementById('cdFormDpto');
  const selectDistrito = document.getElementById('cdFormDistrito');
  const inputCelular = document.getElementById('cdFormCelular');
  const textareaRef = document.getElementById('cdFormReferencia');
  const chkPrincipal = document.getElementById('cdFormPrincipal');
  const titleText = document.getElementById('cdEditorTitleText');
  const icon = document.getElementById('cdEditorIcon');
  const btnText = document.getElementById('cdBtnGuardarText');
  const btnCancel = document.getElementById('cdBtnCancelarEdicion');

  if (hiddenId) hiddenId.value = dir.id || '';
  if (inputCalle) inputCalle.value = dir.calle || '';
  if (inputDpto) inputDpto.value = dir.dpto || '';
  if (selectDistrito) selectDistrito.value = dir.distrito || 'Surquillo';
  if (inputCelular) inputCelular.value = dir.celular || '';
  if (textareaRef) textareaRef.value = dir.referencia || '';
  if (chkPrincipal) chkPrincipal.checked = Boolean(dir.esPrincipal);

  if (titleText) titleText.textContent = 'Editar Dirección';
  if (icon) icon.className = 'fa-solid fa-pen-to-square';
  if (btnText) btnText.textContent = 'Actualizar Cambios';
  if (btnCancel) btnCancel.style.display = 'inline-block';

  // Sincronizar chip de tipo de lugar
  const aliasTarget = dir.alias || 'Casa';
  let encontrado = false;
  document.querySelectorAll('#cdChipsRow .cd-chip-btn').forEach(btn => {
    const coincide = btn.dataset.alias === aliasTarget;
    btn.classList.toggle('active', coincide);
    if (coincide) encontrado = true;
  });
  if (!encontrado) {
    document.querySelector('#cdChipsRow .cd-chip-btn[data-alias="Otros"]')?.classList.add('active');
  }

  actualizarBadgeEta(selectDistrito?.value || 'Surquillo');

  inputCalle?.focus();
  inputCalle?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

export function renderizarDirecciones(filtro = '') {
  const container = document.getElementById('listaDireccionesCards');
  const badgeCount = document.getElementById('cdBadgeCount');
  if (!container) return;

  const lista = obtenerDireccionesLocal();
  if (badgeCount) badgeCount.textContent = String(lista.length);

  const filtroClean = (filtro || '').trim().toLowerCase();
  const filtradas = filtroClean
    ? lista.filter(d => {
        const alias = String(d.alias || d.etiqueta || '').toLowerCase();
        const calle = String(d.calle || d.direccion || d.domicilio || '').toLowerCase();
        const distrito = String(d.distrito || '').toLowerCase();
        const referencia = String(d.referencia || '').toLowerCase();
        const celular = String(d.celular || '').toLowerCase();
        return alias.includes(filtroClean) ||
               calle.includes(filtroClean) ||
               distrito.includes(filtroClean) ||
               referencia.includes(filtroClean) ||
               celular.includes(filtroClean);
      })
    : lista;

  if (filtradas.length === 0) {
    container.innerHTML = `
      <div class="cd-empty-state">
        <div class="cd-empty-icon">
          <i class="fa-solid fa-map-location-dot"></i>
        </div>
        <div class="cd-empty-title">${filtroClean ? 'No se encontraron resultados' : 'Sin direcciones registradas'}</div>
        <div class="cd-empty-desc">
          ${filtroClean 
            ? 'No hay domicilios que coincidan con tu búsqueda. Intenta con otra palabra clave.' 
            : 'Utiliza el formulario de la izquierda para registrar tu primer punto de entrega de balones de gas.'}
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = filtradas.map(d => {
    const icon = getIconoPorAlias(d.alias);
    const esPrincipal = Boolean(d.esPrincipal);
    const dptoStr = d.dpto ? ` · ${d.dpto}` : '';

    return `
      <div class="cd-dir-item ${esPrincipal ? 'is-principal' : ''}" data-id="${d.id}">
        <!-- TOP: ALIAS & BADGE PRINCIPAL -->
        <div class="cd-dir-item-top">
          <div class="cd-dir-item-alias">
            <i class="fa-solid ${icon}"></i>
            <span>${d.alias}</span>
          </div>
          ${esPrincipal ? `
            <span class="cd-dir-item-badge-principal">
              <i class="fa-solid fa-circle-check"></i> Principal
            </span>
          ` : ''}
        </div>

        <!-- CALLE Y DPTO -->
        <div class="cd-dir-item-calle">${d.calle}${dptoStr}</div>

        <!-- METADATOS: DISTRITO, ETA Y CELULAR -->
        <div class="cd-dir-item-meta">
          <span class="cd-dir-item-distrito">${d.distrito}</span>
          <span class="cd-dir-item-eta">
            <i class="fa-solid fa-truck-fast"></i> ${d.eta || '12–15 min'}
          </span>
          ${d.celular ? `
            <span class="cd-dir-item-celular" title="Teléfono de contacto">
              <i class="fa-solid fa-phone"></i> ${d.celular}
            </span>
          ` : ''}
        </div>

        <!-- REFERENCIA -->
        ${d.referencia ? `
          <div class="cd-dir-item-ref">
            <i class="fa-solid fa-location-dot"></i>
            <span>${d.referencia}</span>
          </div>
        ` : ''}

        <!-- FOOTER: ACCIONES -->
        <div class="cd-dir-item-foot">
          <div class="cd-dir-item-btns-left">
            <button type="button" class="cd-btn-action btn-edit-dir" data-id="${d.id}" title="Editar dirección">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button type="button" class="cd-btn-action danger btn-del-dir" data-id="${d.id}" title="Eliminar dirección">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>

          ${!esPrincipal ? `
            <button type="button" class="cd-btn-set-principal btn-set-principal" data-id="${d.id}" title="Marcar como dirección predeterminada">
              <i class="fa-regular fa-star"></i> <span>Predeterminar</span>
            </button>
          ` : `
            <span style="font-size:0.72rem; color:var(--cl-emerald); font-weight:700; display:inline-flex; align-items:center; gap:4px;">
              <i class="fa-solid fa-star"></i> Predeterminada
            </span>
          `}
        </div>
      </div>
    `;
  }).join('');

  // Event Listeners: Cargar en editor
  container.querySelectorAll('.btn-edit-dir').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const target = lista.find(d => d.id === id);
      if (target) cargarDireccionEnFormulario(target);
    });
  });

  // Event Listeners: Eliminar con wiConfirmar
  container.querySelectorAll('.btn-del-dir').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const target = lista.find(d => d.id === id);
      const aliasStr = target?.alias || 'esta dirección';

      const confirmado = await wiConfirmar(
        `¿Deseas eliminar <strong>${aliasStr}</strong> de tu lista de entrega?`,
        {
          titulo: 'Eliminar Dirección',
          tipo: 'danger',
          siTexto: 'Sí, eliminar',
          noTexto: 'Cancelar'
        }
      );

      if (confirmado) {
        try {
          const formId = document.getElementById('cdFormId')?.value;
          if (formId === id) resetearFormulario();

          await eliminarDireccion(id);
          Mensaje('Dirección eliminada correctamente.', 'success');
        } catch (e) {
          console.error('[Gaswii Direcciones UI] Error al eliminar:', e);
          Mensaje('Error al eliminar la dirección: ' + (e.message || e), 'danger');
        }
      }
    });
  });

  // Event Listeners: Predeterminar
  container.querySelectorAll('.btn-set-principal').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      try {
        await establecerPrincipal(id);
        Mensaje('Dirección predeterminada actualizada.', 'success');
      } catch (e) {
        console.error('[Gaswii Direcciones UI] Error al predeterminar:', e);
        Mensaje('Error al actualizar dirección principal: ' + (e.message || e), 'danger');
      }
    });
  });
}

export function inicializarDirecciones() {
  const modulo = document.getElementById('moduloDireccion');
  if (!modulo) return;

  if (!inicializado) {
    inicializado = true;

    // 1. Botones directos de Tipo de Lugar (Casa, Trabajo, Empresa, Oficina, Otros)
    document.querySelectorAll('#cdChipsRow .cd-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#cdChipsRow .cd-chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // 2. Cambio reactivo de distrito -> Actualiza badge de tiempo estimado (ETA)
    const selectDistrito = document.getElementById('cdFormDistrito');
    selectDistrito?.addEventListener('change', (e) => {
      actualizarBadgeEta(e.target.value);
    });

    // 3. Buscador en tiempo real
    const searchInput = document.getElementById('cdSearchDir');
    searchInput?.addEventListener('input', (e) => {
      renderizarDirecciones(e.target.value);
    });

    // 4. Botón Cancelar Edición
    const btnCancel = document.getElementById('cdBtnCancelarEdicion');
    btnCancel?.addEventListener('click', () => {
      resetearFormulario();
    });

    // 5. Formulario Submit (Guardar / Actualizar con wiSpin y validación ágil)
    const form = document.getElementById('cdFormDireccion');
    const btnGuardar = document.getElementById('cdBtnGuardarDireccion');

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const id = document.getElementById('cdFormId')?.value;
      const alias = document.querySelector('#cdChipsRow .cd-chip-btn.active')?.dataset.alias || 'Casa';
      const calle = document.getElementById('cdFormCalle')?.value?.trim();
      const dpto = document.getElementById('cdFormDpto')?.value?.trim();
      const distrito = document.getElementById('cdFormDistrito')?.value?.trim() || 'Surquillo';
      const celular = document.getElementById('cdFormCelular')?.value?.trim();
      const referencia = document.getElementById('cdFormReferencia')?.value?.trim();
      const esPrincipal = Boolean(document.getElementById('cdFormPrincipal')?.checked);
      const eta = ETA_POR_DISTRITO[distrito] || '15–20 min';

      if (!calle) {
        Mensaje('Por favor ingresa la calle o dirección.', 'warning');
        return;
      }

      const payload = {
        id: id || undefined,
        alias,
        calle,
        dpto,
        distrito,
        celular,
        referencia,
        eta,
        esPrincipal
      };

      console.log('[Gaswii Direcciones UI] Enviando formulario:', payload);

      wiSpin(btnGuardar, true, id ? 'Actualizando...' : 'Guardando...');

      try {
        await guardarDireccion(payload);
        Mensaje(id ? 'Dirección actualizada con éxito.' : 'Dirección guardada con éxito.', 'success');
        resetearFormulario();
      } catch (err) {
        console.error('[Gaswii Direcciones UI] ❌ Error capturado en submit:', err);
        Mensaje('Error al guardar la dirección: ' + (err.message || err), 'danger');
      } finally {
        wiSpin(btnGuardar, false);
      }
    });

    // 6. Escuchar evento reactivo global de direcciones
    document.addEventListener('direccionesActualizadas', () => {
      const searchVal = document.getElementById('cdSearchDir')?.value || '';
      renderizarDirecciones(searchVal);
    });

    // Precargar celular si el perfil lo tiene
    const user = getls('wiSmile') || (typeof window !== 'undefined' ? window.__GASWII_USER__ : null);
    const inCel = document.getElementById('cdFormCelular');
    if (inCel && user?.celular) {
      inCel.value = user.celular;
    }
  }

  renderizarDirecciones();
  sincronizarDireccionesDesdeFirestore();
}
