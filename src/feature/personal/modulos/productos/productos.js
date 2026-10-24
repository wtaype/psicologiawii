// src/feature/personal/modulos/productos/productos.js
// Controlador Frontend Autónomo del Módulo de Servicios & Asesorías
// 100% JS Nativo · Local-First · Integración con Firestore, @widev y modales.js

import { Notificacion, wiSpin, wiConfirmar } from '@widev';
import {
  obtenerProductosLocal,
  sincronizarProductosFirestore,
  cambiarEstadoProducto,
  guardarProductoFirestore,
  eliminarProductoFirestore,
  normalizarProducto
} from './dataProductos.js';
import {
  inicializarModalProducto,
  abrirModalProducto
} from './modales.js';
import { solicitarActualizacionWeb } from '@core/servicios/actualizar.js';

export function inicializarProductos() {
  const panel = document.getElementById('panel-productos');
  if (!panel || panel.dataset.productosInit === 'true') return;
  panel.dataset.productosInit = 'true';

  // Inicializar controlador del modal
  inicializarModalProducto();

  // Elementos de la UI
  const prGrid = document.getElementById('prGridProductos');
  const prEmpty = document.getElementById('prEmptyState');
  const prStatTotal = document.getElementById('prStatTotal');
  const prStatServicios = document.getElementById('prStatServicios');
  const prStatAsesorias = document.getElementById('prStatAsesorias');
  const prFiltrosGroup = document.getElementById('prFiltrosGroup');
  const prInputBuscar = document.getElementById('prInputBuscar');
  const prBtnNuevo = document.getElementById('prBtnNuevo');
  const prBtnCrearPrimero = document.getElementById('prBtnCrearPrimero');
  const prBtnSincronizar = document.getElementById('prBtnSincronizar');

  let categoriaFiltro = 'todos';
  let busquedaTexto = '';
  let _ultimoEditadoId = null;
  let _ultimoCampoEditado = null;

  // 1. RENDERIZADOR DE SERVICIOS Y ASESORÍAS (Orden estricto 1, 2, 3... garantizado)
  function renderizar(productos = obtenerProductosLocal()) {
    const listaBase = Array.isArray(productos) && productos.length > 0 ? productos : obtenerProductosLocal();
    const productosOrdenados = [...listaBase]
      .map(normalizarProducto)
      .sort((a, b) => (Number(a.orden) || 999) - (Number(b.orden) || 999));

    const total = productosOrdenados.length;
    const totalServicios = productosOrdenados.filter(p => p.tipo === 'servicio').length;
    const totalAsesorias = productosOrdenados.filter(p => p.tipo === 'asesoria' || p.tipo === 'taller').length;

    if (prStatTotal) prStatTotal.textContent = total;
    if (prStatServicios) prStatServicios.textContent = totalServicios;
    if (prStatAsesorias) prStatAsesorias.textContent = totalAsesorias;

    if (total === 0) {
      if (prGrid) prGrid.innerHTML = '';
      if (prEmpty) prEmpty.style.display = 'flex';
      return;
    }

    if (prEmpty) prEmpty.style.display = 'none';

    // Filtrar por categoría y texto
    const filtrados = productosOrdenados.filter(p => {
      const tipoReal = (p.tipo === 'asesoria' || p.tipo === 'taller') ? 'asesoria' : 'servicio';
      const matchCat = categoriaFiltro === 'todos' || tipoReal === categoriaFiltro;
      const texto = busquedaTexto.toLowerCase().trim();
      const nombreEs = (typeof p.nombre === 'object' ? p.nombre?.es : p.nombre) || '';
      const nombreEn = (typeof p.nombre === 'object' ? p.nombre?.en : p.nombreEn) || '';
      const enfoque = p.enfoque || '';
      const matchText = !texto ||
        nombreEs.toLowerCase().includes(texto) ||
        nombreEn.toLowerCase().includes(texto) ||
        enfoque.toLowerCase().includes(texto) ||
        (p.id || '').toLowerCase().includes(texto);
      return matchCat && matchText;
    });

    if (filtrados.length === 0) {
      if (prGrid) {
        prGrid.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; color: var(--tx2, #64748b);">
            <i class="fa-solid fa-magnifying-glass" style="font-size: 28px; opacity: 0.5; margin-bottom: 10px; display: block;"></i>
            No se encontraron servicios ni asesorías que coincidan con la búsqueda.
          </div>
        `;
      }
      return;
    }

    if (!prGrid) return;
    prGrid.innerHTML = filtrados.map(p => {
      const esActivo = p.estado === 'activo' && p.activo !== false;
      const esServicio = p.tipo === 'servicio';
      const nombre = typeof p.nombre === 'object' ? (p.nombre?.es || '') : (p.nombre || '');
      const nombreEn = typeof p.nombre === 'object' ? (p.nombre?.en || '') : (p.nombreEn || '');
      const precio = Number(p.precio ?? p.precioPEN ?? 0);
      const stock = Number(p.stock ?? (p.tipoCategoria === 'accesorio' ? 35 : 50));
      let duracion = typeof p.duracion === 'object' ? (p.duracion?.es || '') : (p.duracion || '');
      if (!duracion || /kg|kilo|peso|regulador/i.test(duracion)) {
        duracion = '45 - 60 min';
      }

      let modalidad = typeof p.modalidad === 'object' ? (p.modalidad?.es || '') : (p.modalidad || '');
      if (!modalidad || /click|rosca|valvula|gas/i.test(modalidad)) {
        modalidad = 'Presencial y Online';
      }

      let publico = typeof p.publico === 'object' ? (p.publico?.es || '') : (p.publico || p.tipoUso || '');
      if (!publico || /hogar|negocio/i.test(publico)) {
        publico = 'Adolescentes y Adultos';
      }

      return `
        <article class="pr-card ${esActivo ? '' : 'pausado'}" data-id="${p.id}">
          <header class="pr-card-header">
            <span class="pr-badge-tag ${p.tagClase || 'badge-fire'}">
              <i class="${p.badgeIcon || (esServicio ? 'fa-solid fa-star' : 'fa-solid fa-box')}"></i>
              ${(typeof p.badge === 'object' ? (p.badge?.es || 'Más Pedido') : (p.badge || 'Más Pedido'))}
            </span>

            <label class="pr-switch-wrap" title="Activar o pausar visibilidad">
              <span class="pr-switch-label ${esActivo ? 'activo' : ''}">${esActivo ? 'Activo' : 'Pausado'}</span>
              <span class="pr-switch">
                <input type="checkbox" class="pr-input-switch" data-id="${p.id}" ${esActivo ? 'checked' : ''} />
                <span class="pr-slider"></span>
              </span>
            </label>
          </header>

          <div class="pr-card-media">
            <img src="${p.imagen || '/imgwii/servicios/psicoterapia-individual.webp'}" alt="${nombre}" class="pr-card-img" loading="lazy" />
          </div>

          <div class="pr-card-body">
            <h3 class="pr-card-title">${nombre || 'Sin título'}</h3>
            ${nombreEn ? `<div class="pr-card-sub-en">${nombreEn}</div>` : ''}

            <div class="pr-card-specs">
              <span class="pr-spec-chip"><i class="fa-solid fa-clock"></i> ${duracion}</span>
              <span class="pr-spec-chip"><i class="fa-solid fa-location-dot"></i> ${modalidad}</span>
              <span class="pr-spec-chip"><i class="fa-solid fa-user-tag"></i> ${publico}</span>
            </div>

            <!-- Edición rápida de Precio y Duración con 0 ms Local-First -->
            <div class="pr-quick-edit-row">
              <div class="pr-quick-field">
                <span class="pr-quick-label">Precio Oficial</span>
                <div class="pr-quick-input-wrap">
                  <span class="pr-quick-prefix">S/</span>
                  <input
                    type="text"
                    inputmode="decimal"
                    class="pr-quick-input pr-quick-precio"
                    data-id="${p.id}"
                    value="${precio}"
                    title="Modificar precio oficial"
                  />
                </div>
              </div>
              <div class="pr-quick-field">
                <span class="pr-quick-label">Duración</span>
                <div class="pr-quick-input-wrap">
                  <span class="pr-quick-prefix"><i class="fa-solid fa-clock" style="font-size: 0.75rem; color: var(--muted, #94a3b8);"></i></span>
                  <input
                    type="text"
                    class="pr-quick-input pr-quick-duracion"
                    data-id="${p.id}"
                    value="${duracion}"
                    title="Modificar duración oficial"
                  />
                </div>
              </div>
            </div>

            <footer class="pr-card-footer">
              <button type="button" class="pr-btn-edit" data-id="${p.id}">
                <i class="fa-solid fa-pen-to-square"></i> Editar Ficha
              </button>
              <button type="button" class="pr-btn-del" data-id="${p.id}" title="Eliminar producto">
                <i class="fa-solid fa-trash"></i>
              </button>
            </footer>
          </div>
        </article>
      `;
    }).join('');

    // Restaurar feedback visual verde si se editó un input recientemente
    if (_ultimoEditadoId) {
      const selector = _ultimoCampoEditado === 'stock'
        ? `.pr-quick-stock[data-id="${_ultimoEditadoId}"]`
        : `.pr-quick-precio[data-id="${_ultimoEditadoId}"]`;
      const inputEl = prGrid.querySelector(selector);
      if (inputEl) {
        inputEl.classList.add('pr-input-saved');
        setTimeout(() => inputEl.classList.remove('pr-input-saved'), 1000);
      }
      _ultimoEditadoId = null;
      _ultimoCampoEditado = null;
    }
  }

  // 2. LISTENERS DE BOTONES Y FILTROS
  if (prBtnNuevo) prBtnNuevo.addEventListener('click', () => abrirModalProducto(null));
  if (prBtnCrearPrimero) prBtnCrearPrimero.addEventListener('click', () => abrirModalProducto(null));

  // Filtros de Categoría
  if (prFiltrosGroup) {
    prFiltrosGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.pr-filter-pill');
      if (!btn) return;
      document.querySelectorAll('.pr-filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      categoriaFiltro = btn.getAttribute('data-categoria') || 'todos';
      renderizar();
    });
  }

  // Buscador en Vivo
  if (prInputBuscar) {
    prInputBuscar.addEventListener('input', (e) => {
      busquedaTexto = e.target.value;
      renderizar();
    });
  }

  // Sincronizar con Firestore (Reflejo seguro y ordenado)
  if (prBtnSincronizar) {
    prBtnSincronizar.addEventListener('click', async () => {
      prBtnSincronizar.disabled = true;
      wiSpin(prBtnSincronizar, true);
      try {
        const res = await sincronizarProductosFirestore({ forzarSemilla: false });
        renderizar(res.datos || obtenerProductosLocal());
        Notificacion('Catálogo sincronizado exitosamente con Firestore.', 'success', 3500);
      } catch (err) {
        Notificacion('Error al sincronizar con Firestore.', 'error', 3500);
      } finally {
        wiSpin(prBtnSincronizar, false);
        prBtnSincronizar.disabled = false;
      }
    });
  }

  // 3. LISTENERS DENTRO DE LA GRILLA (DELEGACIÓN DE EVENTOS)
  if (prGrid) {
    // Switch Activo / Pausado
    prGrid.addEventListener('change', async (e) => {
      if (e.target.classList.contains('pr-input-switch')) {
        const id = e.target.getAttribute('data-id');
        const nuevoEstado = e.target.checked ? 'activo' : 'pausado';
        const card = e.target.closest('.pr-card');
        const label = card?.querySelector('.pr-switch-label');

        if (label) {
          label.textContent = e.target.checked ? 'Activo' : 'Pausado';
          label.classList.toggle('activo', e.target.checked);
        }
        if (card) {
          card.classList.toggle('pausado', !e.target.checked);
        }

        await cambiarEstadoProducto(id, nuevoEstado);
        Notificacion(`Estado actualizado a ${nuevoEstado}.`, 'info', 2000);
      }
    });

    // Edición rápida de precio y stock (0 ms Local-First + Feedback visual verde)
    prGrid.addEventListener('change', async (e) => {
      if (e.target.classList.contains('pr-quick-precio')) {
        const id = e.target.getAttribute('data-id');
        const nuevoPrecio = parseFloat(String(e.target.value).replace(/[^0-9.]/g, '')) || 0;
        e.target.value = nuevoPrecio;
        const lista = obtenerProductosLocal();
        const item = lista.find(p => p.id === id);
        if (item) {
          _ultimoEditadoId = id;
          _ultimoCampoEditado = 'precio';
          item.precio = nuevoPrecio;
          const input = e.target;
          input.classList.add('pr-input-saved');
          setTimeout(() => input.classList.remove('pr-input-saved'), 1000);
          await guardarProductoFirestore(item);
        }
      } else if (e.target.classList.contains('pr-quick-duracion')) {
        const id = e.target.getAttribute('data-id');
        const nuevaDuracion = e.target.value.trim() || '45 - 60 min';
        e.target.value = nuevaDuracion;
        const lista = obtenerProductosLocal();
        const item = lista.find(p => p.id === id);
        if (item) {
          _ultimoEditadoId = id;
          _ultimoCampoEditado = 'duracion';
          item.duracion = {
            es: nuevaDuracion,
            en: nuevaDuracion.includes('min') ? nuevaDuracion.replace('min', 'mins') : nuevaDuracion
          };
          item.peso = nuevaDuracion;
          const input = e.target;
          input.classList.add('pr-input-saved');
          setTimeout(() => input.classList.remove('pr-input-saved'), 1000);
          await guardarProductoFirestore(item);
        }
      } else if (e.target.classList.contains('pr-quick-stock')) {
        const id = e.target.getAttribute('data-id');
        const nuevoStock = parseInt(String(e.target.value).replace(/[^0-9]/g, ''), 10) || 0;
        e.target.value = nuevoStock;
        const lista = obtenerProductosLocal();
        const item = lista.find(p => p.id === id);
        if (item) {
          _ultimoEditadoId = id;
          _ultimoCampoEditado = 'stock';
          item.stock = nuevoStock;
          const input = e.target;
          input.classList.add('pr-input-saved');
          setTimeout(() => input.classList.remove('pr-input-saved'), 1000);
          await guardarProductoFirestore(item);
        }
      }
    });

    // Guardar al presionar Enter en inputs de edición rápida
    prGrid.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.target.classList.contains('pr-quick-precio') || e.target.classList.contains('pr-quick-duracion') || e.target.classList.contains('pr-quick-stock'))) {
        e.preventDefault();
        e.target.blur();
      }
    });

    // Botón Editar Ficha Completa
    prGrid.addEventListener('click', (e) => {
      const btnEdit = e.target.closest('.pr-btn-edit');
      if (btnEdit) {
        const id = btnEdit.getAttribute('data-id');
        const item = obtenerProductosLocal().find(p => p.id === id);
        if (item) abrirModalProducto(item);
        return;
      }

      // Botón Eliminar
      const btnDel = e.target.closest('.pr-btn-del');
      if (btnDel) {
        const id = btnDel.getAttribute('data-id');
        const item = obtenerProductosLocal().find(p => p.id === id);
        const nombre = typeof item?.nombre === 'object' ? item.nombre.es : (item?.nombre || id);

        wiConfirmar({
          titulo: '¿Eliminar producto?',
          mensaje: `¿Estás seguro de que deseas eliminar permanentemente "${nombre}" del catálogo?`,
          textoConfirmar: 'Sí, eliminar',
          tipo: 'danger'
        }).then(async (confirmado) => {
          if (confirmado) {
            await eliminarProductoFirestore(id);
            renderizar();
            Notificacion(`Producto "${nombre}" eliminado.`, 'info', 3000);
          }
        });
      }
    });
  }

  // Renderizador con rAF para evitar parpadeos y ejecuciones duplicadas simultáneas
  let _renderTimer = null;
  function renderizarConDebounce(datos) {
    if (_renderTimer) cancelAnimationFrame(_renderTimer);
    _renderTimer = requestAnimationFrame(() => {
      renderizar(datos);
    });
  }

  // Escuchar evento personalizado tras guardar desde el modal
  window.addEventListener('producto-guardado', () => {
    renderizarConDebounce();
  });

  // Escuchar actualizaciones globales de productos en 0 ms
  window.addEventListener('psicologia:servicios-actualizado', (e) => {
    if (Array.isArray(e.detail) && e.detail.length > 0) {
      renderizarConDebounce(e.detail);
    } else {
      renderizarConDebounce();
    }
  });

  window.addEventListener('wi:productos-actualizado', (e) => {
    if (Array.isArray(e.detail) && e.detail.length > 0) {
      renderizarConDebounce(e.detail);
    } else {
      renderizarConDebounce();
    }
  });

  window.addEventListener('gaswii:productos-actualizado', (e) => {
    if (Array.isArray(e.detail) && e.detail.length > 0) {
      renderizarConDebounce(e.detail);
    } else {
      renderizarConDebounce();
    }
  });

  // Render inicial
  renderizar();
}

// Auto-inicialización si el panel ya existe en el DOM
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarProductos);
  } else {
    inicializarProductos();
  }
}

export default { inicializarProductos };
