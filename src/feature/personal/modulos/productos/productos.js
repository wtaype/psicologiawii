// src/feature/personal/modulos/productos/productos.js
// Controlador Frontend Autónomo del Módulo de Productos (Solgas Surquillo)
// 100% JS Nativo · Local-First · Integración con Firestore, @widev y modales.js

import { Notificacion, wiSpin, wiConfirmar } from '@widev';
import {
  obtenerProductosLocal,
  sincronizarProductosFirestore,
  cambiarEstadoProducto,
  actualizarPrecioYStock,
  eliminarProductoFirestore
} from './dataProductos.js';
import {
  inicializarModalProducto,
  abrirModalProducto
} from './modales.js';
import { solicitarActualizacionWeb } from '../../../../actualizar.js';

export function inicializarProductos() {
  const panel = document.getElementById('panel-productos');
  if (!panel || panel.dataset.productosInit === 'true') return;
  panel.dataset.productosInit = 'true';

  // Inicializar controlador hijo del modal (preview en vivo, tabs ES/EN, wiModal)
  inicializarModalProducto();

  // Elementos de la UI
  const prGrid = document.getElementById('prGridProductos');
  const prEmpty = document.getElementById('prEmptyState');
  const prStatTotal = document.getElementById('prStatTotal');
  const prStatActivos = document.getElementById('prStatActivos');
  const prStatStockBajo = document.getElementById('prStatStockBajo');
  const prFiltrosGroup = document.getElementById('prFiltrosGroup');
  const prInputBuscar = document.getElementById('prInputBuscar');
  const prBtnNuevo = document.getElementById('prBtnNuevo');
  const prBtnCrearPrimero = document.getElementById('prBtnCrearPrimero');
  const prBtnSincronizar = document.getElementById('prBtnSincronizar');

  let categoriaFiltro = 'todos';
  let busquedaTexto = '';

  // 1. RENDERIZADOR DE PRODUCTOS
  function renderizar(productos = obtenerProductosLocal()) {
    const total = productos.length;
    const activos = productos.filter(p => p.estado === 'activo').length;
    const stockBajo = productos.filter(p => Number(p.stock) <= Number(p.stockMin || 5)).length;

    if (prStatTotal) prStatTotal.textContent = total;
    if (prStatActivos) prStatActivos.textContent = activos;
    if (prStatStockBajo) prStatStockBajo.textContent = stockBajo;

    if (total === 0) {
      if (prGrid) prGrid.innerHTML = '';
      if (prEmpty) prEmpty.style.display = 'flex';
      return;
    }

    if (prEmpty) prEmpty.style.display = 'none';

    // Filtrar por categoría y texto
    const filtrados = productos.filter(p => {
      const matchCat = categoriaFiltro === 'todos' || p.tipoCategoria === categoriaFiltro;
      const texto = busquedaTexto.toLowerCase().trim();
      const matchText = !texto ||
        (p.nombre?.es || '').toLowerCase().includes(texto) ||
        (p.nombre?.en || '').toLowerCase().includes(texto) ||
        (p.id || '').toLowerCase().includes(texto);
      return matchCat && matchText;
    });

    if (filtrados.length === 0) {
      if (prGrid) {
        prGrid.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; color: var(--muted, #64748b);">
            <i class="fa-solid fa-magnifying-glass" style="font-size: 28px; opacity: 0.5; margin-bottom: 10px; display: block;"></i>
            No se encontraron productos coincidentes con los filtros actuales.
          </div>
        `;
      }
      return;
    }

    if (!prGrid) return;
    prGrid.innerHTML = filtrados.map(p => {
      const esActivo = p.estado === 'activo';
      const esGas = p.tipoCategoria === 'gas';
      const esAlertaStock = Number(p.stock) <= Number(p.stockMin || 5);

      return `
        <article class="pr-card ${esActivo ? '' : 'pausado'}" data-id="${p.id}">
          <header class="pr-card-header">
            <span class="pr-badge-tag ${esGas ? 'badge-fire' : 'badge-accesorio'}">
              <i class="${p.badgeIcon || (esGas ? 'fa-solid fa-fire' : 'fa-solid fa-wrench')}"></i>
              ${esGas ? 'Balón' : 'Accesorio'}
            </span>

            <label class="pr-switch-wrap" title="Activar o pausar producto">
              <span class="pr-switch-label ${esActivo ? 'activo' : ''}">${esActivo ? 'Activo' : 'Pausado'}</span>
              <span class="pr-switch">
                <input type="checkbox" class="pr-input-switch" data-id="${p.id}" ${esActivo ? 'checked' : ''} />
                <span class="pr-slider"></span>
              </span>
            </label>
          </header>

          <div class="pr-card-media">
            <img src="${p.imagen || '/imgwii/productos/BALON-10KG.webp'}" alt="${p.nombre?.es || 'Producto'}" class="pr-card-img" loading="lazy" />
          </div>

          <div class="pr-card-body">
            <h3 class="pr-card-title">${p.nombre?.es || 'Sin nombre'}</h3>
            ${p.nombre?.en ? `<div class="pr-card-sub-en">${p.nombre.en}</div>` : ''}

            <div class="pr-card-specs">
              ${p.peso?.es ? `<span class="pr-spec-chip"><i class="fa-solid fa-weight-scale"></i> ${p.peso.es}</span>` : ''}
              ${p.valvula?.es ? `<span class="pr-spec-chip"><i class="fa-solid fa-gauge"></i> ${p.valvula.es}</span>` : ''}
              ${p.delivery?.es ? `<span class="pr-spec-chip"><i class="fa-solid fa-truck-fast"></i> Delivery</span>` : ''}
            </div>

            <!-- Edición rápida de Precio y Stock -->
            <div class="pr-quick-edit-row">
              <div class="pr-quick-field">
                <span class="pr-quick-label">Precio (S/)</span>
                <div class="pr-quick-input-wrap">
                  <span class="pr-quick-prefix">S/</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    class="pr-quick-input pr-quick-precio"
                    data-id="${p.id}"
                    value="${p.precio ?? 0}"
                    title="Modificar precio directamente"
                  />
                </div>
              </div>

              <div class="pr-quick-field">
                <span class="pr-quick-label">Stock Actual</span>
                <div class="pr-quick-input-wrap">
                  <input
                    type="number"
                    min="0"
                    class="pr-quick-input pr-quick-stock"
                    data-id="${p.id}"
                    value="${p.stock ?? 0}"
                    title="Modificar stock directamente"
                  />
                  ${esAlertaStock ? '<span class="pr-stock-alert" title="Stock bajo el mínimo"><i class="fa-solid fa-triangle-exclamation"></i></span>' : ''}
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

  // Sincronizar con Firestore
  if (prBtnSincronizar) {
    prBtnSincronizar.addEventListener('click', async () => {
      const originalText = prBtnSincronizar.innerHTML;
      prBtnSincronizar.disabled = true;
      wiSpin(prBtnSincronizar, true);
      try {
        const prods = await sincronizarProductosFirestore();
        renderizar(prods);
        Notificacion(`Catálogo sincronizado: ${prods.length} productos.`, 'success', 3000);
      } catch (err) {
        Notificacion('Error al conectar con Firestore.', 'error', 3500);
      } finally {
        wiSpin(prBtnSincronizar, false);
        prBtnSincronizar.disabled = false;
        prBtnSincronizar.innerHTML = originalText;
      }
    });
  }

  // Delegación de eventos en el Grid (Switch, Quick Edit, Edit Modal, Delete)
  if (prGrid) {
    // Switch Activo / Pausado
    prGrid.addEventListener('change', async (e) => {
      const switchEl = e.target.closest('.pr-input-switch');
      if (switchEl) {
        const id = switchEl.getAttribute('data-id');
        const nuevoEstado = switchEl.checked ? 'activo' : 'pausado';
        await cambiarEstadoProducto(id, nuevoEstado);
        renderizar();
        Notificacion(`Producto ${nuevoEstado === 'activo' ? 'activado' : 'pausado'}.`, 'success', 2500);
        solicitarActualizacionWeb({ motivo: 'producto-estado' });
        return;
      }

      // Quick Edit Precio
      const precioEl = e.target.closest('.pr-quick-precio');
      if (precioEl) {
        const id = precioEl.getAttribute('data-id');
        const nuevoPrecio = Number(precioEl.value || 0);
        await actualizarPrecioYStock(id, { precio: nuevoPrecio });
        Notificacion(`Precio actualizado a S/ ${nuevoPrecio.toFixed(2)}`, 'success', 2500);
        solicitarActualizacionWeb({ motivo: 'producto-precio' });
        return;
      }

      // Quick Edit Stock
      const stockEl = e.target.closest('.pr-quick-stock');
      if (stockEl) {
        const id = stockEl.getAttribute('data-id');
        const nuevoStock = Number(stockEl.value || 0);
        await actualizarPrecioYStock(id, { stock: nuevoStock });
        renderizar();
        Notificacion(`Stock actualizado: ${nuevoStock} unidades.`, 'success', 2500);
        solicitarActualizacionWeb({ motivo: 'producto-stock' });
        return;
      }
    });

    // Clicks en Botones Editar y Eliminar
    prGrid.addEventListener('click', (e) => {
      const btnEdit = e.target.closest('.pr-btn-edit');
      if (btnEdit) {
        const id = btnEdit.getAttribute('data-id');
        const lista = obtenerProductosLocal();
        const prod = lista.find(p => p.id === id);
        if (prod) abrirModalProducto(prod);
        return;
      }

      const btnDel = e.target.closest('.pr-btn-del');
      if (btnDel) {
        const id = btnDel.getAttribute('data-id');
        wiConfirmar('¿Estás seguro de que deseas eliminar este producto del catálogo oficial?', async () => {
          try {
            await eliminarProductoFirestore(id);
            renderizar();
            Notificacion('Producto eliminado del catálogo.', 'success', 3000);
            solicitarActualizacionWeb({ motivo: 'producto-eliminado' });
          } catch (err) {
            Notificacion('No se pudo eliminar el producto.', 'error', 3500);
          }
        });
        return;
      }
    });
  }

  // 3. INICIALIZACIÓN REACTIVA
  window.addEventListener('gaswii:productos-actualizados', (e) => {
    if (Array.isArray(e.detail)) renderizar(e.detail);
  });

  // Render inicial desde caché Local-First
  renderizar();

  // Sincronización en segundo plano con Firestore
  sincronizarProductosFirestore().then(prods => {
    renderizar(prods);
  });
}

// Auto-arranque al cargar el script o en navegaciones Astro
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarProductos);
} else {
  inicializarProductos();
}

document.addEventListener('astro:page-load', inicializarProductos);
