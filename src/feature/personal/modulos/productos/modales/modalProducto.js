// src/feature/personal/modulos/productos/modales/modalProducto.js
// Controlador Frontend del Modal de Producto (87vw × 70vh mín.)
// Integrado con wiModal de @widev/modales.js y Firestore

import { wiModal, Notificacion, wiSpin } from '@widev';
import {
  guardarProductoFirestore,
  generarSlug,
  obtenerProductosLocal
} from '../dataProductos.js';
import { solicitarActualizacionWeb } from '../../../../../actualizar.js';

export const MODAL_ID = 'prModalBackdrop';

export function inicializarModalProducto() {
  const modalEl = document.getElementById(MODAL_ID);
  if (!modalEl || modalEl.dataset.modalInit === 'true') return;
  modalEl.dataset.modalInit = 'true';

  const form = document.getElementById('prFormProducto');
  const inputImagen = document.getElementById('prFormImagen');
  const previewImg = document.getElementById('prModalPreviewImg');
  const previewEmpty = document.getElementById('prModalPreviewEmpty');
  const btnGuardar = document.getElementById('prBtnGuardarModal');
  const btnCerrar = document.getElementById('prBtnCerrarModal');
  const btnCancelar = document.getElementById('prBtnCancelarModal');

  // Botones de Cierre (X, Cancelar y clic en fondo)
  if (btnCerrar) {
    btnCerrar.addEventListener('click', (e) => {
      e.preventDefault();
      cerrarModalProducto();
    });
  }

  if (btnCancelar) {
    btnCancelar.addEventListener('click', (e) => {
      e.preventDefault();
      cerrarModalProducto();
    });
  }

  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) {
      cerrarModalProducto();
    }
  });

  // 1. Actualización en tiempo real de la imagen preview
  function actualizarPreview() {
    const url = (inputImagen?.value || '').trim();
    if (url && previewImg) {
      previewImg.src = url;
      previewImg.style.display = 'block';
      if (previewEmpty) previewEmpty.style.display = 'none';
      previewImg.onerror = () => {
        previewImg.style.display = 'none';
        if (previewEmpty) previewEmpty.style.display = 'flex';
      };
    } else {
      if (previewImg) previewImg.style.display = 'none';
      if (previewEmpty) previewEmpty.style.display = 'flex';
    }
  }

  if (inputImagen) {
    inputImagen.addEventListener('input', actualizarPreview);
    inputImagen.addEventListener('change', actualizarPreview);
  }

  // 2. Conmutador de Pestañas Bilingües (ES / EN)
  document.querySelectorAll('.pr-modal-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pr-modal-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.pr-lang-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-target');
      const pane = document.getElementById(targetId);
      if (pane) pane.classList.add('active');
    });
  });

  // 3. Envío del Formulario
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const prFormId = document.getElementById('prFormId');
      const prFormCategoria = document.getElementById('prFormCategoria');
      const prFormPrecio = document.getElementById('prFormPrecio');
      const prFormPrecioEnvase = document.getElementById('prFormPrecioEnvase');
      const prFormStock = document.getElementById('prFormStock');
      const prFormStockMin = document.getElementById('prFormStockMin');
      const prFormOrden = document.getElementById('prFormOrden');
      const prFormEstado = document.getElementById('prFormEstado');

      // ES
      const prFormNombreEs = document.getElementById('prFormNombreEs');
      const prFormDescEs = document.getElementById('prFormDescEs');
      const prFormPesoEs = document.getElementById('prFormPesoEs');
      const prFormPesoFullEs = document.getElementById('prFormPesoFullEs');
      const prFormValvulaEs = document.getElementById('prFormValvulaEs');
      const prFormDeliveryEs = document.getElementById('prFormDeliveryEs');
      const prFormSeguridadEs = document.getElementById('prFormSeguridadEs');
      const prFormGarantiasEs = document.getElementById('prFormGarantiasEs');

      // EN
      const prFormNombreEn = document.getElementById('prFormNombreEn');
      const prFormDescEn = document.getElementById('prFormDescEn');
      const prFormPesoEn = document.getElementById('prFormPesoEn');
      const prFormPesoFullEn = document.getElementById('prFormPesoFullEn');
      const prFormValvulaEn = document.getElementById('prFormValvulaEn');
      const prFormDeliveryEn = document.getElementById('prFormDeliveryEn');
      const prFormSeguridadEn = document.getElementById('prFormSeguridadEn');
      const prFormGarantiasEn = document.getElementById('prFormGarantiasEn');

      const nombreEs = prFormNombreEs?.value.trim() || '';
      if (!nombreEs) {
        Notificacion('El nombre en español es requerido.', 'warning', 3000);
        return;
      }

      const idExistente = prFormId?.value.trim() || '';
      const idFinal = idExistente || generarSlug(nombreEs);

      const garantiasEs = (prFormGarantiasEs?.value || '')
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);
      const garantiasEn = (prFormGarantiasEn?.value || '')
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

      const payload = {
        id: idFinal,
        slug: idFinal,
        tipoCategoria: prFormCategoria?.value || 'gas',
        precio: Number(prFormPrecio?.value || 0),
        precioEnvase: Number(prFormPrecioEnvase?.value || 0),
        stock: Number(prFormStock?.value || 0),
        stockMin: Number(prFormStockMin?.value || 5),
        orden: Number(prFormOrden?.value || 1),
        imagen: (inputImagen?.value || '').trim() || '/imgwii/productos/BALON-10KG.webp',
        estado: prFormEstado?.value || 'activo',
        badgeIcon: prFormCategoria?.value === 'gas' ? 'fa-solid fa-fire' : 'fa-solid fa-wrench',
        tagClase: prFormCategoria?.value === 'gas' ? 'badge-fire' : 'badge-accesorio',

        nombre: {
          es: nombreEs,
          en: prFormNombreEn?.value.trim() || ''
        },
        descripcion: {
          es: prFormDescEs?.value.trim() || '',
          en: prFormDescEn?.value.trim() || ''
        },
        peso: {
          es: prFormPesoEs?.value.trim() || '',
          en: prFormPesoEn?.value.trim() || ''
        },
        pesoFull: {
          es: prFormPesoFullEs?.value.trim() || '',
          en: prFormPesoFullEn?.value.trim() || ''
        },
        valvula: {
          es: prFormValvulaEs?.value.trim() || '',
          en: prFormValvulaEn?.value.trim() || ''
        },
        delivery: {
          es: prFormDeliveryEs?.value.trim() || '',
          en: prFormDeliveryEn?.value.trim() || ''
        },
        seguridad: {
          es: prFormSeguridadEs?.value.trim() || '',
          en: prFormSeguridadEn?.value.trim() || ''
        },
        garantias: {
          es: garantiasEs,
          en: garantiasEn
        }
      };

      if (btnGuardar) {
        btnGuardar.disabled = true;
        wiSpin(btnGuardar, true);
      }

      try {
        await guardarProductoFirestore(payload);
        cerrarModalProducto();
        const msgExito = idExistente
          ? `Producto "${nombreEs}" actualizado con éxito.`
          : `Producto "${nombreEs}" registrado con éxito.`;
        Notificacion(msgExito, 'success', 3500);

        // Disparar re-deploy en Cloudflare con debounce de 4s
        solicitarActualizacionWeb({ motivo: idExistente ? 'producto-actualizado' : 'producto-creado' });
      } catch (err) {
        Notificacion('Error al guardar el producto en Firestore.', 'error', 4000);
      } finally {
        if (btnGuardar) {
          wiSpin(btnGuardar, false);
          btnGuardar.disabled = false;
        }
      }
    });
  }
}

/**
 * Abre el modal de producto (nuevo o editar) usando wiModal de @widev
 */
export function abrirModalProducto(producto = null) {
  const modalEl = document.getElementById(MODAL_ID);
  if (!modalEl) return;

  // Reset de pestañas a Español
  document.querySelectorAll('.pr-modal-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.pr-lang-pane').forEach(p => p.classList.remove('active'));
  const btnTabEs = document.querySelector('.pr-modal-tab-btn[data-target="pane-es"]');
  const paneEs = document.getElementById('pane-es');
  if (btnTabEs) btnTabEs.classList.add('active');
  if (paneEs) paneEs.classList.add('active');

  const tituloEl = document.getElementById('prModalTitle');
  const form = document.getElementById('prFormProducto');
  const inputImagen = document.getElementById('prFormImagen');
  const previewImg = document.getElementById('prModalPreviewImg');
  const previewEmpty = document.getElementById('prModalPreviewEmpty');

  const prFormId = document.getElementById('prFormId');
  const prFormCategoria = document.getElementById('prFormCategoria');
  const prFormPrecio = document.getElementById('prFormPrecio');
  const prFormPrecioEnvase = document.getElementById('prFormPrecioEnvase');
  const prFormStock = document.getElementById('prFormStock');
  const prFormStockMin = document.getElementById('prFormStockMin');
  const prFormOrden = document.getElementById('prFormOrden');
  const prFormEstado = document.getElementById('prFormEstado');

  // ES
  const prFormNombreEs = document.getElementById('prFormNombreEs');
  const prFormDescEs = document.getElementById('prFormDescEs');
  const prFormPesoEs = document.getElementById('prFormPesoEs');
  const prFormPesoFullEs = document.getElementById('prFormPesoFullEs');
  const prFormValvulaEs = document.getElementById('prFormValvulaEs');
  const prFormDeliveryEs = document.getElementById('prFormDeliveryEs');
  const prFormSeguridadEs = document.getElementById('prFormSeguridadEs');
  const prFormGarantiasEs = document.getElementById('prFormGarantiasEs');

  // EN
  const prFormNombreEn = document.getElementById('prFormNombreEn');
  const prFormDescEn = document.getElementById('prFormDescEn');
  const prFormPesoEn = document.getElementById('prFormPesoEn');
  const prFormPesoFullEn = document.getElementById('prFormPesoFullEn');
  const prFormValvulaEn = document.getElementById('prFormValvulaEn');
  const prFormDeliveryEn = document.getElementById('prFormDeliveryEn');
  const prFormSeguridadEn = document.getElementById('prFormSeguridadEn');
  const prFormGarantiasEn = document.getElementById('prFormGarantiasEn');

  if (producto) {
    // MODO EDICIÓN
    if (tituloEl) tituloEl.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Editar: ${producto.nombre?.es || producto.id}`;
    if (prFormId) prFormId.value = producto.id;
    if (prFormCategoria) prFormCategoria.value = producto.tipoCategoria || 'gas';
    if (prFormPrecio) prFormPrecio.value = producto.precio ?? 0;
    if (prFormPrecioEnvase) prFormPrecioEnvase.value = producto.precioEnvase ?? 0;
    if (prFormStock) prFormStock.value = producto.stock ?? 0;
    if (prFormStockMin) prFormStockMin.value = producto.stockMin ?? 10;
    if (prFormOrden) prFormOrden.value = producto.orden ?? 1;
    if (prFormEstado) prFormEstado.value = producto.estado || 'activo';
    if (inputImagen) inputImagen.value = producto.imagen || '/imgwii/productos/BALON-10KG.webp';

    // Español
    if (prFormNombreEs) prFormNombreEs.value = producto.nombre?.es || '';
    if (prFormDescEs) prFormDescEs.value = producto.descripcion?.es || '';
    if (prFormPesoEs) prFormPesoEs.value = producto.peso?.es || '';
    if (prFormPesoFullEs) prFormPesoFullEs.value = producto.pesoFull?.es || '';
    if (prFormValvulaEs) prFormValvulaEs.value = producto.valvula?.es || '';
    if (prFormDeliveryEs) prFormDeliveryEs.value = producto.delivery?.es || '';
    if (prFormSeguridadEs) prFormSeguridadEs.value = producto.seguridad?.es || '';
    if (prFormGarantiasEs) prFormGarantiasEs.value = Array.isArray(producto.garantias?.es) ? producto.garantias.es.join('\n') : '';

    // Inglés
    if (prFormNombreEn) prFormNombreEn.value = producto.nombre?.en || '';
    if (prFormDescEn) prFormDescEn.value = producto.descripcion?.en || '';
    if (prFormPesoEn) prFormPesoEn.value = producto.peso?.en || '';
    if (prFormPesoFullEn) prFormPesoFullEn.value = producto.pesoFull?.en || '';
    if (prFormValvulaEn) prFormValvulaEn.value = producto.valvula?.en || '';
    if (prFormDeliveryEn) prFormDeliveryEn.value = producto.delivery?.en || '';
    if (prFormSeguridadEn) prFormSeguridadEn.value = producto.seguridad?.en || '';
    if (prFormGarantiasEn) prFormGarantiasEn.value = Array.isArray(producto.garantias?.en) ? producto.garantias.en.join('\n') : '';
  } else {
    // MODO NUEVO
    if (tituloEl) tituloEl.innerHTML = `<i class="fa-solid fa-plus"></i> Registrar Nuevo Producto`;
    if (form) form.reset();
    if (prFormId) prFormId.value = '';
    if (prFormCategoria) prFormCategoria.value = 'gas';
    if (prFormPrecio) prFormPrecio.value = '65';
    if (prFormPrecioEnvase) prFormPrecioEnvase.value = '0';
    if (prFormStock) prFormStock.value = '50';
    if (prFormStockMin) prFormStockMin.value = '10';
    if (prFormOrden) prFormOrden.value = String(obtenerProductosLocal().length + 1);
    if (prFormEstado) prFormEstado.value = 'activo';
    if (inputImagen) inputImagen.value = '/imgwii/productos/BALON-10KG.webp';

    // Valores por defecto en español
    if (prFormDeliveryEs) prFormDeliveryEs.value = 'Todo Incluido, despacho en puerta';
    if (prFormSeguridadEs) prFormSeguridadEs.value = 'Garantía desde planta de Solgas';
    if (prFormValvulaEs) prFormValvulaEs.value = 'Click-On (Acople Rápido)';
    if (prFormGarantiasEs) {
      prFormGarantiasEs.value = [
        'Misma garantía de peso exacto de origen y base',
        'Llama azul constante y duradera',
        'Cilindro inspeccionado libre de corrosión',
        'Entrega inmediata sin costo de flete'
      ].join('\n');
    }
  }

  // Actualizar imagen preview
  const imgUrl = (inputImagen?.value || '').trim();
  if (imgUrl && previewImg) {
    previewImg.src = imgUrl;
    previewImg.style.display = 'block';
    if (previewEmpty) previewEmpty.style.display = 'none';
  } else {
    if (previewImg) previewImg.style.display = 'none';
    if (previewEmpty) previewEmpty.style.display = 'flex';
  }

  // Abrir usando wiModal universal de @widev
  wiModal.open(MODAL_ID);
}

/**
 * Cierra el modal de producto usando wiModal
 */
export function cerrarModalProducto() {
  const modalEl = document.getElementById(MODAL_ID);
  if (modalEl) {
    modalEl.classList.remove('open', 'active');
  }
  wiModal.close(MODAL_ID);
}
