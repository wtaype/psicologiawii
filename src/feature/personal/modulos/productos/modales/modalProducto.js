// src/feature/personal/modulos/productos/modales/modalProducto.js
// Controlador Frontend del Modal de Producto & Accesorio
// Integrado con wiModal de @widev/modales.js, Selects nativos, Firestore y solicitarActualizacionWeb

import { wiModal, Notificacion, wiSpin } from '@widev';
import {
  guardarProductoFirestore,
  generarSlug,
  obtenerProductosLocal
} from '../dataProductos.js';
import { solicitarActualizacionWeb } from '@core/servicios/actualizar.js';

export const MODAL_ID = 'prModalBackdrop';

/**
 * Resuelve una URL relativa a la URL absoluta con el origen actual de la web
 * para que el usuario pueda copiarla o reemplazarla fácilmente en el input.
 */
export function resolverUrlCompleta(urlRaw = '') {
  const u = (urlRaw || '').trim();
  if (!u) return '';
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  if (typeof window !== 'undefined' && window.location.origin) {
    const ruta = u.startsWith('/') ? u : `/${u}`;
    return `${window.location.origin}${ruta}`;
  }
  return u;
}

/**
 * Normaliza la URL antes de persistir en Firestore o LocalStorage.
 * Si coincide con el origen local/dominio actual, se guarda como ruta relativa (/imgwii/...)
 * para asegurar portabilidad entre localhost y producción.
 */
export function normalizarUrlParaGuardar(urlRaw = '') {
  const u = (urlRaw || '').trim();
  if (!u) return '';
  if (typeof window !== 'undefined' && window.location.origin) {
    if (u.startsWith(window.location.origin)) {
      return u.replace(window.location.origin, '');
    }
  }
  return u;
}

/**
 * Inicializa los eventos del modal, previsualización de imagen e iconos
 */
export function inicializarModalProducto() {
  const modalEl = document.getElementById(MODAL_ID);
  if (!modalEl || modalEl.dataset.modalInit === 'true') return;
  modalEl.dataset.modalInit = 'true';

  const form = document.getElementById('prFormProducto');
  const inputImagen = document.getElementById('prFormImagen');
  const previewImg = document.getElementById('prModalPreviewImg');
  const previewEmpty = document.getElementById('prModalPreviewEmpty');
  const inputBadgeIcon = document.getElementById('prFormBadgeIcon');
  const previewBadgeIcon = document.getElementById('prBadgeIconPreview');

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

  // Previsualización dinámica de imagen
  function actualizarPreview() {
    const rawVal = (inputImagen?.value || '').trim();
    const fullUrl = resolverUrlCompleta(rawVal);

    if (fullUrl && previewImg) {
      previewImg.src = fullUrl;
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

  // Previsualización dinámica de icono de FontAwesome
  if (inputBadgeIcon && previewBadgeIcon) {
    inputBadgeIcon.addEventListener('input', () => {
      const iconClass = inputBadgeIcon.value.trim() || 'fa-solid fa-star';
      previewBadgeIcon.innerHTML = `<i class="${iconClass}"></i>`;
    });
  }

  // Conmutador de Pestañas Bilingües (Español / English)
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

  // Envío del Formulario
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const prFormId = document.getElementById('prFormId');
      const prFormPrecio = document.getElementById('prFormPrecio');
      const prFormStock = document.getElementById('prFormStock');
      const prFormOrden = document.getElementById('prFormOrden');
      const prFormPeso = document.getElementById('prFormPeso');
      const prFormCategoria = document.getElementById('prFormCategoria');
      const prFormBadgeIcon = document.getElementById('prFormBadgeIcon');
      const prFormBadgeTexto = document.getElementById('prFormBadgeTexto');
      const prFormEstado = document.getElementById('prFormEstado');
      const prFormTagClase = document.getElementById('prFormTagClase');

      // ES
      const prFormNombreEs = document.getElementById('prFormNombreEs');
      const prFormDescEs = document.getElementById('prFormDescEs');
      const prFormValvulaEs = document.getElementById('prFormValvulaEs');
      const prFormPublicoEs = document.getElementById('prFormPublicoEs');
      const prFormGarantiasEs = document.getElementById('prFormGarantiasEs');

      // EN
      const prFormNombreEn = document.getElementById('prFormNombreEn');
      const prFormDescEn = document.getElementById('prFormDescEn');
      const prFormValvulaEn = document.getElementById('prFormValvulaEn');
      const prFormPublicoEn = document.getElementById('prFormPublicoEn');
      const prFormBadgeTextoEn = document.getElementById('prFormBadgeTextoEn');
      const prFormGarantiasEn = document.getElementById('prFormGarantiasEn');

      const nombreEs = prFormNombreEs?.value.trim() || '';
      if (!nombreEs) {
        Notificacion('El nombre del producto es requerido.', 'warning', 3000);
        return;
      }

      const idExistente = prFormId?.value.trim() || '';
      const idFinal = idExistente || generarSlug(nombreEs);
      const tipo = prFormCategoria?.value || 'servicio';

      // Sanitizar valores numéricos desde inputs tipo texto sin demoras
      const precioNum = parseFloat(String(prFormPrecio?.value || '').replace(/[^0-9.]/g, '')) || (tipo === 'servicio' ? 65 : 70);
      const stockNum = parseInt(String(prFormStock?.value || '').replace(/[^0-9]/g, ''), 10) || 50;
      const ordenNum = parseInt(String(prFormOrden?.value || '').replace(/[^0-9]/g, ''), 10) || 1;

      const modalidadEs = (prFormValvulaEs?.value || '').trim() || 'Presencial y Online';
      const modalidadEn = (prFormValvulaEn?.value || '').trim() || (modalidadEs === 'Presencial y Online' ? 'In-Person & Online' : modalidadEs);

      const duracionEs = (prFormPeso?.value || '').trim() || '45 - 60 min';
      const duracionEn = duracionEs.includes('min') ? duracionEs.replace('min', 'mins') : duracionEs;

      const badgeTextoEs = (prFormBadgeTexto?.value || '').trim() || 'Más Solicitado';
      const badgeTextoEn = (prFormBadgeTextoEn?.value || '').trim() || (badgeTextoEs === 'Más Solicitado' ? 'Most Requested' : badgeTextoEs);

      const publicoEs = (prFormPublicoEs?.value || '').trim() || 'Adolescentes y Adultos';
      const publicoEn = (prFormPublicoEn?.value || '').trim() || 'Teens and Adults';

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
        tipo,
        tipoCategoria: tipo === 'asesoria' ? 'taller' : 'psicologia',
        precio: precioNum,
        precioPEN: precioNum,
        stock: stockNum,
        orden: ordenNum,
        estado: prFormEstado?.value || 'activo',
        activo: prFormEstado?.value !== 'pausado',
        imagen: normalizarUrlParaGuardar(inputImagen?.value || '/imgwii/servicios/psicoterapia-individual.webp'),
        badgeIcon: (prFormBadgeIcon?.value || '').trim() || 'fa-solid fa-star',
        tagClase: prFormTagClase?.value || 'badge-serenidad',
        duracion: {
          es: duracionEs,
          en: duracionEn
        },
        modalidad: {
          es: modalidadEs,
          en: modalidadEn
        },
        enfoque: 'Cognitivo Conductual / ACT',
        peso: duracionEs,
        valvula: modalidadEs,
        valvulaEn: modalidadEn,
        userId: '',
        email: 'demo@consultorioamerica.com',

        nombre: {
          es: nombreEs,
          en: prFormNombreEn?.value.trim() || ''
        },
        descripcion: {
          es: prFormDescEs?.value.trim() || '',
          en: prFormDescEn?.value.trim() || ''
        },
        badge: {
          es: badgeTextoEs,
          en: badgeTextoEn
        },
        publico: {
          es: publicoEs,
          en: publicoEn
        },
        garantias: {
          es: garantiasEs.length > 0 ? garantiasEs : [
            'Espacio seguro y 100% confidencial',
            'Herramientas prácticas para tu vida diaria',
            'Acompañamiento cálido basado en evidencia científica'
          ],
          en: garantiasEn.length > 0 ? garantiasEn : [
            'Safe and 100% confidential space',
            'Practical tools for daily life',
            'Compassionate evidence-based care'
          ]
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

        // Disparar re-deploy con debounce
        solicitarActualizacionWeb({ motivo: idExistente ? 'producto-actualizado' : 'producto-creado' });

        // Notificar al componente padre para re-renderizar la grilla
        window.dispatchEvent(new CustomEvent('producto-guardado', { detail: payload }));
      } catch (err) {
        Notificacion('Error al guardar en Firestore.', 'error', 4000);
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
 * Abre el modal de producto (nuevo o editar)
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
  const prFormPrecio = document.getElementById('prFormPrecio');
  const prFormStock = document.getElementById('prFormStock');
  const prFormOrden = document.getElementById('prFormOrden');
  const prFormPeso = document.getElementById('prFormPeso');
  const prFormCategoria = document.getElementById('prFormCategoria');
  const prFormBadgeIcon = document.getElementById('prFormBadgeIcon');
  const previewBadgeIcon = document.getElementById('prBadgeIconPreview');
  const prFormBadgeTexto = document.getElementById('prFormBadgeTexto');
  const prFormEstado = document.getElementById('prFormEstado');
  const prFormTagClase = document.getElementById('prFormTagClase');

  // ES
  const prFormNombreEs = document.getElementById('prFormNombreEs');
  const prFormDescEs = document.getElementById('prFormDescEs');
  const prFormValvulaEs = document.getElementById('prFormValvulaEs');
  const prFormPublicoEs = document.getElementById('prFormPublicoEs');
  const prFormGarantiasEs = document.getElementById('prFormGarantiasEs');

  // EN
  const prFormNombreEn = document.getElementById('prFormNombreEn');
  const prFormDescEn = document.getElementById('prFormDescEn');
  const prFormValvulaEn = document.getElementById('prFormValvulaEn');
  const prFormPublicoEn = document.getElementById('prFormPublicoEn');
  const prFormBadgeTextoEn = document.getElementById('prFormBadgeTextoEn');
  const prFormGarantiasEn = document.getElementById('prFormGarantiasEn');

  if (producto) {
    // ── MODO EDICIÓN ──
    const nombre = typeof producto.nombre === 'object' ? (producto.nombre?.es || '') : (producto.nombre || '');
    if (tituloEl) tituloEl.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Editar: ${nombre || producto.id}`;
    if (prFormId) prFormId.value = producto.id;

    // Fila 1: Precio - Stock - Orden (Inputs tipo texto sin lag)
    if (prFormPrecio) prFormPrecio.value = String(producto.precio ?? producto.precioPEN ?? 65);
    if (prFormStock) prFormStock.value = String(producto.stock ?? 50);
    if (prFormOrden) prFormOrden.value = String(producto.orden ?? 1);

    // Fila 2: Duración - Categoría (Select nativo)
    const durVal = typeof producto.duracion === 'object' ? (producto.duracion?.es || '') : (producto.duracion || producto.peso || '45 - 60 min');
    if (prFormPeso) prFormPeso.value = durVal;
    const catVal = (producto.tipo === 'asesoria' || producto.tipo === 'taller' || producto.tipoCategoria === 'taller') ? 'asesoria' : 'servicio';
    if (prFormCategoria) prFormCategoria.value = catVal;

    // Fila 3: Icono - Badge Texto
    if (prFormBadgeIcon) {
      prFormBadgeIcon.value = producto.badgeIcon || 'fa-solid fa-star';
      if (previewBadgeIcon) previewBadgeIcon.innerHTML = `<i class="${prFormBadgeIcon.value}"></i>`;
    }
    const badgeVal = typeof producto.badge === 'object' ? (producto.badge?.es || '') : (producto.badge || '');
    if (prFormBadgeTexto) prFormBadgeTexto.value = badgeVal || 'Más Solicitado';

    // Fila 4: Estado - Estilo del Badge (Selects nativos)
    const estVal = (producto.estado === 'pausado' || producto.activo === false) ? 'pausado' : 'activo';
    if (prFormEstado) prFormEstado.value = estVal;

    const tagVal = producto.tagClase || 'badge-serenidad';
    if (prFormTagClase) prFormTagClase.value = tagVal;

    // URL completa de la imagen para fácil edición/copia
    if (inputImagen) {
      inputImagen.value = resolverUrlCompleta(producto.imagen || '/imgwii/servicios/psicoterapia-individual.webp');
    }

    // Español
    if (prFormNombreEs) prFormNombreEs.value = nombre;
    if (prFormDescEs) prFormDescEs.value = typeof producto.descripcion === 'object' ? (producto.descripcion?.es || '') : (producto.descripcion || '');
    const modEsVal = typeof producto.modalidad === 'object' ? (producto.modalidad?.es || '') : (producto.modalidad || producto.valvula || 'Presencial y Online');
    if (prFormValvulaEs) prFormValvulaEs.value = modEsVal;
    if (prFormPublicoEs) prFormPublicoEs.value = typeof producto.publico === 'object' ? (producto.publico?.es || '') : (producto.publico || producto.tipoUso || 'Adolescentes y Adultos');

    const garEs = Array.isArray(producto.garantias?.es) ? producto.garantias.es : (Array.isArray(producto.garantias) ? producto.garantias : []);
    if (prFormGarantiasEs) prFormGarantiasEs.value = garEs.join('\n');

    // Inglés
    if (prFormNombreEn) prFormNombreEn.value = typeof producto.nombre === 'object' ? (producto.nombre?.en || '') : (producto.nombreEn || '');
    if (prFormDescEn) prFormDescEn.value = typeof producto.descripcion === 'object' ? (producto.descripcion?.en || '') : (producto.descripcionEn || '');
    const modEnVal = typeof producto.modalidad === 'object' ? (producto.modalidad?.en || '') : (producto.modalidadEn || (modEsVal === 'Presencial y Online' ? 'In-Person & Online' : modEsVal));
    if (prFormValvulaEn) prFormValvulaEn.value = modEnVal;
    if (prFormPublicoEn) prFormPublicoEn.value = typeof producto.publico === 'object' ? (producto.publico?.en || '') : (producto.publicoEn || producto.tipoUsoEn || 'Teens and Adults');
    const badgeEnVal = typeof producto.badge === 'object' ? (producto.badge?.en || '') : (producto.badgeEn || '');
    if (prFormBadgeTextoEn) prFormBadgeTextoEn.value = badgeEnVal || 'Most Requested';

    const garEn = Array.isArray(producto.garantias?.en) ? producto.garantias.en : (Array.isArray(producto.garantiasEn) ? producto.garantiasEn : []);
    if (prFormGarantiasEn) prFormGarantiasEn.value = garEn.join('\n');
  } else {
    // ── MODO NUEVO ──
    if (tituloEl) tituloEl.innerHTML = `<i class="fa-solid fa-plus"></i> Registrar Nuevo Servicio en Catálogo`;
    if (form) form.reset();
    if (prFormId) prFormId.value = '';

    // Fila 1: Precio - Stock - Orden (Inputs tipo texto)
    if (prFormPrecio) prFormPrecio.value = '85';
    if (prFormStock) prFormStock.value = '50';
    if (prFormOrden) prFormOrden.value = String(obtenerProductosLocal().length + 1);

    // Fila 2: Duración - Categoría (Select nativo)
    if (prFormPeso) prFormPeso.value = '45 - 60 min';
    if (prFormCategoria) prFormCategoria.value = 'servicio';

    // Fila 3: Icono - Badge Texto
    if (prFormBadgeIcon) {
      prFormBadgeIcon.value = 'fa-solid fa-star';
      if (previewBadgeIcon) previewBadgeIcon.innerHTML = `<i class="fa-solid fa-star"></i>`;
    }
    if (prFormBadgeTexto) prFormBadgeTexto.value = 'Más Solicitado';

    // Fila 4: Estado - Estilo del Badge (Selects nativos)
    if (prFormEstado) prFormEstado.value = 'activo';
    if (prFormTagClase) prFormTagClase.value = 'badge-serenidad';

    // URL completa de la imagen por defecto
    if (inputImagen) {
      inputImagen.value = resolverUrlCompleta('/imgwii/servicios/psicoterapia-individual.webp');
    }

    // Valores por defecto en Español
    if (prFormValvulaEs) prFormValvulaEs.value = 'Presencial y Online';
    if (prFormPublicoEs) prFormPublicoEs.value = 'Adolescentes y Adultos';
    if (prFormGarantiasEs) {
      prFormGarantiasEs.value = [
        'Espacio seguro y 100% confidencial',
        'Herramientas prácticas para tu vida diaria',
        'Acompañamiento cálido basado en evidencia científica'
      ].join('\n');
    }

    // Valores por defecto en Inglés
    if (prFormValvulaEn) prFormValvulaEn.value = 'In-Person & Online';
    if (prFormPublicoEn) prFormPublicoEn.value = 'Teens and Adults';
    if (prFormBadgeTextoEn) prFormBadgeTextoEn.value = 'Most Requested';
    if (prFormGarantiasEn) {
      prFormGarantiasEn.value = [
        'Safe and 100% confidential space',
        'Practical tools for daily life',
        'Compassionate evidence-based care'
      ].join('\n');
    }
  }

  // Actualizar imagen preview en vivo
  const rawUrl = (inputImagen?.value || '').trim();
  const fullUrl = resolverUrlCompleta(rawUrl);

  if (fullUrl && previewImg) {
    previewImg.src = fullUrl;
    previewImg.style.display = 'block';
    if (previewEmpty) previewEmpty.style.display = 'none';
  } else {
    if (previewImg) previewImg.style.display = 'none';
    if (previewEmpty) previewEmpty.style.display = 'flex';
  }

  wiModal.open(MODAL_ID);
}

/**
 * Cierra el modal de producto
 */
export function cerrarModalProducto() {
  const modalEl = document.getElementById(MODAL_ID);
  if (modalEl) {
    modalEl.classList.remove('open', 'active');
  }
  wiModal.close(MODAL_ID);
}

export default {
  inicializarModalProducto,
  abrirModalProducto,
  cerrarModalProducto
};
