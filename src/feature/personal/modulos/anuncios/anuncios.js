// src/feature/personal/modulos/anuncios/anuncios.js
// Lógica interactiva para la consola de gestión de anuncios y campañas con Gemini AI
// Modal Amplio (1140px / 92vw) · Sin clutter (ES) · Dominio Dinámico · Fechas Inicio/Fin, Estado, Pin
// 100% Reactivo · Local-First (0ms) · Integrado con Cloudflare Smart Dock
import {
  obtenerAnuncios,
  sincronizarAnunciosFirestore,
  crearAnuncio,
  actualizarAnuncio,
  eliminarAnuncio
} from './dataAnuncios.js';
import { consultarJsonGemini } from '../../../../core/servicios/gemini.js';
import { wiTip } from '@widev';

export function initAnunciosAdmin() {
  // Inicializar tooltips interactivos de widev.js
  if (typeof wiTip === 'function') wiTip();
  const btnCreate = document.getElementById('btnOpenCreateAd');
  const modal = document.getElementById('modalAnuncio');
  const btnClose = document.getElementById('btnCloseAdModal');
  const btnCancel = document.getElementById('btnCancelAdModal');
  const form = document.getElementById('formAnuncio');

  // Elementos de la columna izquierda (Media & Parámetros)
  const modalTitleTxt = document.getElementById('adModalTitleTxt');
  const previewImg = document.getElementById('adPreviewImg');
  const previewBadge = document.getElementById('adPreviewBadge');
  const previewStatusPill = document.getElementById('adPreviewStatusPill');
  const previewStatusTxt = document.getElementById('adPreviewStatusTxt');
  const inputFlyer = document.getElementById('inputAdFlyer');
  const btnCopyUrl = document.getElementById('btnCopyAdUrl');
  const inputEstado = document.getElementById('inputAdEstado');
  const inputPin = document.getElementById('inputAdPin');
  const inputFechaInicio = document.getElementById('inputAdFechaInicio');
  const inputFechaFin = document.getElementById('inputAdFechaFin');
  const galleryBtns = document.querySelectorAll('.ad-gallery-thumb-btn');

  // Auditoría
  const auditId = document.getElementById('adAuditId');
  const auditUser = document.getElementById('adAuditUser');
  const auditUpdated = document.getElementById('adAuditUpdated');

  // Elementos contextuales de idioma
  const tabEs = document.getElementById('adTabEs');
  const tabEn = document.getElementById('adTabEn');
  const paneEs = document.getElementById('ad-pane-es');
  const paneEn = document.getElementById('ad-pane-en');
  const langHelperText = document.getElementById('adLangHelperText');
  const btnGemini = document.getElementById('btnTraducirGemini');

  // Inputs Español
  const inputTituloEs = document.getElementById('inputAdTituloEs');
  const inputBadgeEs = document.getElementById('inputAdBadgeEs');
  const inputDescEs = document.getElementById('inputAdDescEs');
  const inputWsEs = document.getElementById('inputAdWsEs');

  // Inputs English
  const inputTituloEn = document.getElementById('inputAdTituloEn');
  const inputBadgeEn = document.getElementById('inputAdBadgeEn');
  const inputDescEn = document.getElementById('inputAdDescEn');
  const inputWsEn = document.getElementById('inputAdWsEn');

  // Selector rápido de duración (7d, 30d, sin límite, específico)
  const durationPills = document.querySelectorAll('#adDurationPills .ad-pill-btn');

  if (!btnCreate || !modal) return;

  function seleccionarDuracion(tipo) {
    durationPills.forEach((p) => {
      if (p.getAttribute('data-duration') === tipo) {
        p.classList.add('is-active');
      } else {
        p.classList.remove('is-active');
      }
    });

    const now = new Date();
    const hoyStr = now.toISOString().split('T')[0];

    if (tipo === '7') {
      if (inputFechaInicio) inputFechaInicio.value = hoyStr;
      if (inputFechaFin) inputFechaFin.value = new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0];
    } else if (tipo === '30') {
      if (inputFechaInicio) inputFechaInicio.value = hoyStr;
      if (inputFechaFin) inputFechaFin.value = new Date(now.getTime() + 30 * 86400000).toISOString().split('T')[0];
    } else if (tipo === 'unlimited') {
      if (inputFechaInicio) inputFechaInicio.value = hoyStr;
      if (inputFechaFin) inputFechaFin.value = '';
    }
  }

  durationPills.forEach((btn) => {
    btn.addEventListener('click', () => {
      const d = btn.getAttribute('data-duration');
      seleccionarDuracion(d);
    });
  });

  inputFechaInicio?.addEventListener('input', () => {
    durationPills.forEach((p) => {
      p.classList.toggle('is-active', p.getAttribute('data-duration') === 'custom');
    });
  });

  inputFechaFin?.addEventListener('input', () => {
    durationPills.forEach((p) => {
      p.classList.toggle('is-active', p.getAttribute('data-duration') === 'custom');
    });
  });

  // 1. Selector Contextual de Pestañas de Idioma
  function activarTab(paneId) {
    if (paneId === 'ad-pane-es') {
      tabEs?.classList.add('is-active');
      tabEn?.classList.remove('is-active');
      paneEs?.classList.add('is-active');
      paneEn?.classList.remove('is-active');
      if (langHelperText) {
        langHelperText.innerHTML = 'Editando campaña en <strong>Español (ES)</strong>';
      }
    } else {
      tabEn?.classList.add('is-active');
      tabEs?.classList.remove('is-active');
      paneEn?.classList.add('is-active');
      paneEs?.classList.remove('is-active');
      if (langHelperText) {
        langHelperText.innerHTML = 'English campaign for international clients <strong>(EN)</strong>';
      }
    }
  }

  tabEs?.addEventListener('click', () => activarTab('ad-pane-es'));
  tabEn?.addEventListener('click', () => activarTab('ad-pane-en'));

  // 2. Resolver URL Completa con Dominio Dinámico
  function buildFullUrl(pathOrUrl) {
    if (!pathOrUrl) return '';
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
      return pathOrUrl;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
    return `${origin}${cleanPath}`;
  }

  function extractRelativePath(fullUrl) {
    if (!fullUrl) return '/imgwii/psicologa-sofia-consulta.webp';
    try {
      if (fullUrl.startsWith('http')) {
        const u = new URL(fullUrl);
        return u.pathname;
      }
    } catch (e) {}
    return fullUrl;
  }

  // 3. Selector Visual de Miniaturas de Fotos
  function seleccionarFoto(src) {
    if (!src) return;
    const full = buildFullUrl(src);
    if (inputFlyer) inputFlyer.value = full;
    if (previewImg) previewImg.src = full;

    const rel = extractRelativePath(src);
    galleryBtns.forEach((btn) => {
      const btnSrc = btn.getAttribute('data-src');
      if (btnSrc === rel || btnSrc === src) {
        btn.classList.add('is-selected');
      } else {
        btn.classList.remove('is-selected');
      }
    });
  }

  galleryBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const src = btn.getAttribute('data-src');
      seleccionarFoto(src);
    });
  });

  inputFlyer?.addEventListener('input', () => {
    const val = inputFlyer.value.trim();
    if (previewImg && val) {
      previewImg.src = val;
    }
  });

  // Copiar URL al portapapeles
  btnCopyUrl?.addEventListener('click', async () => {
    if (!inputFlyer) return;
    try {
      await navigator.clipboard.writeText(inputFlyer.value);
      btnCopyUrl.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i>';
      setTimeout(() => {
        btnCopyUrl.innerHTML = '<i class="fa-regular fa-copy" aria-hidden="true"></i>';
      }, 1500);
    } catch (e) {}
  });

  // Actualización en vivo del badge flotante
  inputBadgeEs?.addEventListener('input', () => {
    if (previewBadge) previewBadge.textContent = inputBadgeEs.value || 'Evaluación Clínica';
  });

  // Actualización en vivo del estado en preview
  inputEstado?.addEventListener('change', () => {
    actualizarPreviewEstado(inputEstado.value);
  });

  function actualizarPreviewEstado(val) {
    if (!previewStatusTxt) return;
    if (val === 'activo') {
      previewStatusTxt.textContent = 'Activo';
      previewStatusPill?.classList.remove('ad-preview-status-pill--suspended', 'ad-preview-status-pill--done');
    } else if (val === 'suspendido') {
      previewStatusTxt.textContent = 'Suspendido';
      previewStatusPill?.classList.add('ad-preview-status-pill--suspended');
    } else {
      previewStatusTxt.textContent = 'Finalizado';
      previewStatusPill?.classList.add('ad-preview-status-pill--done');
    }
  }

  // 4. Apertura y Cierre de Modal
  function abrirModal(ad = null) {
    modal.classList.add('is-open');
    activarTab('ad-pane-es');

    const now = new Date();
    const hoyStr = now.toISOString().split('T')[0];
    const finDefault = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    if (ad) {
      if (modalTitleTxt) modalTitleTxt.textContent = 'Editar Campaña de Anuncio';
      document.getElementById('inputAdId').value = ad.id;
      
      // Español
      if (inputTituloEs) inputTituloEs.value = ad.titulo?.es || ad.titulo || '';
      if (inputBadgeEs) inputBadgeEs.value = ad.badge?.es || ad.badge || '';
      if (inputDescEs) inputDescEs.value = ad.descripcion?.es || ad.descripcion || '';
      if (inputWsEs) inputWsEs.value = ad.wsMsg?.es || ad.wsMsg || '';

      // English
      if (inputTituloEn) inputTituloEn.value = ad.titulo?.en || '';
      if (inputBadgeEn) inputBadgeEn.value = ad.badge?.en || '';
      if (inputDescEn) inputDescEn.value = ad.descripcion?.en || '';
      if (inputWsEn) inputWsEn.value = ad.wsMsg?.en || '';

      // Parámetros
      const tipo = ad.estadoTipo || (ad.activo ? 'activo' : 'finalizado');
      if (inputEstado) inputEstado.value = tipo;
      actualizarPreviewEstado(tipo);

      if (inputPin) inputPin.checked = Boolean(ad.pin);
      if (inputFechaInicio) inputFechaInicio.value = ad.fechaInicio || hoyStr;
      if (inputFechaFin) inputFechaFin.value = ad.fechaFin || (ad.fechaFin === '' ? '' : finDefault);

      // Sincronizar pill de duración
      if (!ad.fechaFin) {
        durationPills.forEach(p => p.classList.toggle('is-active', p.getAttribute('data-duration') === 'unlimited'));
      } else if (ad.fechaInicio && ad.fechaFin) {
        const diffDays = Math.round((new Date(ad.fechaFin).getTime() - new Date(ad.fechaInicio).getTime()) / 86400000);
        if (diffDays >= 6 && diffDays <= 8) {
          durationPills.forEach(p => p.classList.toggle('is-active', p.getAttribute('data-duration') === '7'));
        } else if (diffDays >= 28 && diffDays <= 32) {
          durationPills.forEach(p => p.classList.toggle('is-active', p.getAttribute('data-duration') === '30'));
        } else {
          durationPills.forEach(p => p.classList.toggle('is-active', p.getAttribute('data-duration') === 'custom'));
        }
      } else {
        durationPills.forEach(p => p.classList.toggle('is-active', p.getAttribute('data-duration') === '30'));
      }

      // Auditoría
      if (auditId) auditId.textContent = `ID: ${ad.id}`;
      if (auditUser) auditUser.textContent = `Admin: ${ad.userId || 'Lic. Sofía'}`;
      if (auditUpdated) {
        const f = ad.actualizado ? new Date(ad.actualizado).toLocaleDateString() : 'hoy';
        auditUpdated.textContent = `Actualizado: ${f}`;
      }

      // Imagen
      const imgPath = ad.flyerImg || ad.thumbImg || '/imgwii/psicologa-sofia-consulta.webp';
      seleccionarFoto(imgPath);
      if (previewBadge) previewBadge.textContent = ad.badge?.es || 'Evaluación Clínica';
    } else {
      if (modalTitleTxt) modalTitleTxt.textContent = 'Crear Nueva Campaña de Anuncio';
      form.reset();
      document.getElementById('inputAdId').value = '';
      
      if (inputEstado) inputEstado.value = 'activo';
      actualizarPreviewEstado('activo');

      if (inputPin) inputPin.checked = false;
      if (inputFechaInicio) inputFechaInicio.value = hoyStr;
      if (inputFechaFin) inputFechaFin.value = finDefault;
      seleccionarDuracion('30');

      if (auditId) auditId.textContent = 'ID: nuevo';
      if (auditUser) auditUser.textContent = 'Admin: Lic. Sofía';
      if (auditUpdated) auditUpdated.textContent = 'Fecha: hoy';

      seleccionarFoto('/imgwii/psicologa-sofia-consulta.webp');
      if (previewBadge) previewBadge.textContent = 'Evaluación Clínica';
    }
  }

  function cerrarModal() {
    modal.classList.remove('is-open');
  }

  btnCreate.addEventListener('click', () => abrirModal());
  if (btnClose) btnClose.addEventListener('click', cerrarModal);
  if (btnCancel) btnCancel.addEventListener('click', cerrarModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) cerrarModal();
  });

  // 5. Traducción Asistida por Gemini AI
  if (btnGemini) {
    btnGemini.addEventListener('click', async () => {
      const titulo = inputTituloEs?.value.trim() || '';
      const badge = inputBadgeEs?.value.trim() || '';
      const desc = inputDescEs?.value.trim() || '';
      const ws = inputWsEs?.value.trim() || '';

      if (!titulo && !desc) {
        alert('Por favor redacta primero el contenido en español para que Gemini pueda traducirlo.');
        return;
      }

      btnGemini.disabled = true;
      btnGemini.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> <span>Traduciendo...</span>';

      try {
        const prompt = `Traduce con máxima precisión clínica y empatía terapéutica los siguientes campos de una campaña oficial (Lic. Sofía Reynaga, C.Ps.P. 49425, Lima Perú).
Devuelve estrictamente un JSON con esta estructura:
{
  "tituloEn": "Traducción profesional del título",
  "badgeEn": "Traducción del badge/especialidad",
  "descripcionEn": "Traducción empática y clara de la descripción",
  "wsMsgEn": "Traducción del mensaje para WhatsApp"
}

Campos en español:
- Título: ${titulo}
- Especialidad / Categoría: ${badge}
- Descripción: ${desc}
- Mensaje de WhatsApp: ${ws}`;

        const res = await consultarJsonGemini({
          prompt,
          systemInstruction: 'Eres un especialista bilingüe en traducción clínica para consultorios psicológicos. Responde ÚNICAMENTE con el objeto JSON solicitado.'
        });

        if (res) {
          if (res.tituloEn && inputTituloEn) inputTituloEn.value = res.tituloEn;
          if (res.badgeEn && inputBadgeEn) inputBadgeEn.value = res.badgeEn;
          if (res.descripcionEn && inputDescEn) inputDescEn.value = res.descripcionEn;
          if (res.wsMsgEn && inputWsEn) inputWsEn.value = res.wsMsgEn;

          // Conmutar a la pestaña en inglés para validación inmediata
          activarTab('ad-pane-en');
        }
      } catch (err) {
        console.error('Error al traducir con Gemini AI:', err);
        alert('Ocurrió un error al conectar con Gemini AI: ' + (err.message || 'Error desconocido'));
      } finally {
        btnGemini.disabled = false;
        btnGemini.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> <span>Traducir con IA</span>';
      }
    });
  }

  // 6. Renderizado Reactivo de la Lista en Backoffice (0ms)
  function renderizarListaAdmin(lista) {
    const ul = document.querySelector('.anuncios-admin-list');
    if (!ul) return;

    ul.innerHTML = (lista || []).map((ad) => {
      const isActivo = ad.activo;
      const tituloTxt = ad.titulo?.es || ad.titulo || '';
      const fechaTxt = ad.fecha?.es || ad.fecha || 'Reciente';
      const badgeTxt = ad.badge?.es || ad.badge || 'Evaluación Clínica';
      const estadoTxt = ad.estado?.es || ad.estado || (isActivo ? 'Activo' : 'Finalizado');
      const estadoTipo = ad.estadoTipo || (isActivo ? 'activo' : 'finalizado');
      const isPinned = Boolean(ad.pin);
      const datesRange = ad.fechaInicio ? `${ad.fechaInicio} al ${ad.fechaFin || 'indefinido'}` : fechaTxt;

      return `
        <li class="anuncios-admin-item">
          <div class="anuncios-admin-thumb-wrap">
            <img
              src="${ad.thumbImg || ad.flyerImg || '/imgwii/psicologa-sofia-consulta.webp'}"
              alt="${tituloTxt}"
              class="anuncios-admin-thumb"
              loading="lazy"
            />
            ${isPinned ? '<span class="anuncios-admin-pin-badge" title="Fijado en portada"><i class="fa-solid fa-thumbtack" aria-hidden="true"></i></span>' : ''}
          </div>

          <div class="anuncios-admin-info">
            <div class="anuncios-admin-title-row">
              <h4 class="anuncios-admin-title">${tituloTxt}</h4>
              <span class="anuncios-admin-category-pill">${badgeTxt}</span>
            </div>
            <div class="anuncios-admin-meta">
              <span><i class="fa-regular fa-clock" aria-hidden="true"></i> ${datesRange}</span>
              <span>·</span>
              <span class="status-tag status-tag--${estadoTipo}">
                ${estadoTxt}
              </span>
            </div>
          </div>

          <!-- ⚡ Acciones Rápidas Externas (Pin, Estado, Renovar, Editar, Borrar con wiTip) -->
          <div class="anuncios-admin-actions">
            <button
              type="button"
              class="anuncios-admin-btn-action ${isPinned ? 'is-pinned' : ''}"
              data-quick-pin="${ad.id}"
              data-witip="${isPinned ? 'Desfijar de portada' : 'Fijar en primer lugar (Pin)'}"
              data-wtipo="top"
            >
              <i class="fa-solid fa-thumbtack" aria-hidden="true"></i>
            </button>

            <button
              type="button"
              class="anuncios-admin-btn-action ${isActivo ? 'is-active-btn' : 'is-paused-btn'}"
              data-quick-status="${ad.id}"
              data-witip="${isActivo ? 'Pausar publicación de campaña' : 'Activar publicación de campaña'}"
              data-wtipo="top"
            >
              <i class="fa-solid ${isActivo ? 'fa-circle-check' : 'fa-circle-pause'}" aria-hidden="true"></i>
            </button>

            <button
              type="button"
              class="anuncios-admin-btn-action"
              data-quick-renew="${ad.id}"
              data-witip="Renovar vigencia (+30 días)"
              data-wtipo="top"
            >
              <i class="fa-solid fa-calendar-plus" aria-hidden="true"></i>
            </button>

            <button
              type="button"
              class="anuncios-admin-btn-action"
              data-edit-ad="${ad.id}"
              data-witip="Editar ficha completa"
              data-wtipo="top"
            >
              <i class="fa-solid fa-pen" aria-hidden="true"></i>
            </button>

            <button
              type="button"
              class="anuncios-admin-btn-action anuncios-admin-btn-action--del"
              data-del-ad="${ad.id}"
              data-witip="Eliminar campaña"
              data-wtipo="top"
            >
              <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
            </button>
          </div>
        </li>
      `;
    }).join('');

    // Actualizar KPIs limpios
    const activos = (lista || []).filter(a => a.activo).length;
    const fijados = (lista || []).filter(a => a.pin).length;
    
    const kpiActivos = document.getElementById('kpiActivosCount');
    const kpiPinned = document.getElementById('kpiPinnedCount');
    const kpiTotal = document.getElementById('kpiTotalCount');

    if (kpiActivos) kpiActivos.textContent = `${activos} / ${(lista || []).length}`;
    if (kpiPinned) kpiPinned.textContent = `${fijados} destacados`;
    if (kpiTotal) kpiTotal.textContent = `${(lista || []).length} registradas`;

    const statsPill = document.querySelector('.anuncios-table-header .anuncios-admin-stats-pill');
    if (statsPill) {
      statsPill.innerHTML = `<i class="fa-solid fa-list" aria-hidden="true"></i> ${(lista || []).length} campañas`;
    }
  }

  // Escuchar evento reactivo canónico
  window.addEventListener('wi:anuncios-actualizado', (e) => {
    if (Array.isArray(e.detail)) {
      renderizarListaAdmin(e.detail);
      refrescarGaleriaPicker(e.detail);
    }
  });

  // Selector Dinámico de Galería de Fotos (CERO datos fijos)
  function refrescarGaleriaPicker(lista = []) {
    const picker = document.getElementById('adGalleryPicker');
    if (!picker) return;

    const imgMap = new Map();
    (lista || []).forEach((ad) => {
      const src = ad.flyerImg || ad.thumbImg;
      if (src && !imgMap.has(src)) {
        imgMap.set(src, ad.titulo?.es || ad.titulo || 'Campaña');
      }
    });

    const currentBtns = picker.querySelectorAll('.ad-gallery-thumb-btn');
    currentBtns.forEach((btn) => {
      const src = btn.getAttribute('data-src');
      const title = btn.getAttribute('title') || 'Imagen';
      if (src && !imgMap.has(src)) {
        imgMap.set(src, title);
      }
    });

    picker.innerHTML = Array.from(imgMap.entries()).map(([src, label]) => `
      <button
        type="button"
        class="ad-gallery-thumb-btn"
        data-src="${src}"
        data-witip="${label}" data-wtipo="top"
      >
        <img src="${src}" alt="${label}" class="ad-gallery-thumb-img" loading="lazy" />
      </button>
    `).join('');

    picker.querySelectorAll('.ad-gallery-thumb-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const src = btn.getAttribute('data-src');
        seleccionarFoto(src);
      });
    });
  }

  // Reconciliar lista inicial desde memoria/storage/semillas (0ms)
  try {
    const listaInicial = obtenerAnuncios();
    if (Array.isArray(listaInicial) && listaInicial.length > 0) {
      renderizarListaAdmin(listaInicial);
      refrescarGaleriaPicker(listaInicial);
    }
    // Sincronización en background con Firestore
    sincronizarAnunciosFirestore().then((actualizados) => {
      if (Array.isArray(actualizados) && actualizados.length > 0) {
        renderizarListaAdmin(actualizados);
        refrescarGaleriaPicker(actualizados);
      }
    }).catch(() => {});
  } catch (e) {}

  // 7. Envío y Persistencia del Formulario (0ms + Cloudflare Smart Dock)
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('inputAdId').value;
      const tituloEs = inputTituloEs?.value.trim() || 'Nueva Campaña';
      const tituloEn = inputTituloEn?.value.trim() || tituloEs;
      const badgeEs = inputBadgeEs?.value.trim() || 'Evaluación Clínica';
      const badgeEn = inputBadgeEn?.value.trim() || badgeEs;
      const descEs = inputDescEs?.value.trim() || '';
      const descEn = inputDescEn?.value.trim() || descEs;
      const wsEs = inputWsEs?.value.trim() || 'Hola Lic. Sofía, vi el anuncio en el portal web y deseo agendar una consulta.';
      const wsEn = inputWsEn?.value.trim() || wsEs;

      const estadoTipo = inputEstado?.value || 'activo';
      const isActivo = estadoTipo === 'activo';
      const isPinned = Boolean(inputPin?.checked);
      const fInicio = inputFechaInicio?.value || '';
      const fFin = inputFechaFin?.value || '';
      const flyerFull = inputFlyer?.value.trim() || '/imgwii/psicologa-sofia-consulta.webp';
      const flyerRel = extractRelativePath(flyerFull);

      const estadoLabelMap = {
        activo: { es: 'Activo · En curso', en: 'Active · Ongoing' },
        suspendido: { es: 'Suspendido · Pausado', en: 'Suspended · Paused' },
        finalizado: { es: 'Finalizado · Concluido', en: 'Finished · Completed' }
      };

      const adData = {
        titulo: { es: tituloEs, en: tituloEn },
        badge: { es: badgeEs, en: badgeEn },
        descripcion: { es: descEs, en: descEn },
        wsMsg: { es: wsEs, en: wsEn },
        estadoTipo,
        activo: isActivo,
        pin: isPinned,
        fechaInicio: fInicio,
        fechaFin: fFin,
        estado: estadoLabelMap[estadoTipo] || estadoLabelMap.activo,
        fecha: {
          es: fInicio ? `${fInicio} al ${fFin || 'indefinido'}` : 'Vigente',
          en: fInicio ? `${fInicio} to ${fFin || 'open'}` : 'Active'
        },
        flyerImg: flyerRel,
        thumbImg: flyerRel,
        actualizado: Date.now(),
        userId: 'admin_sofia'
      };

      cerrarModal();

      if (id) {
        await actualizarAnuncio(id, adData);
      } else {
        await crearAnuncio({
          ...adData,
          creado: Date.now()
        });
      }
    });
  }

  // 8. Delegación de eventos para acciones rápidas, editar y eliminar en la lista
  document.addEventListener('click', async (e) => {
    // 📌 1. Conmutar Fijado (Pin) con un solo clic
    const btnPin = e.target.closest('[data-quick-pin]');
    if (btnPin) {
      const id = btnPin.getAttribute('data-quick-pin');
      const list = obtenerAnuncios();
      const targetAd = list.find((a) => a.id === id);
      if (targetAd) {
        await actualizarAnuncio(id, { pin: !targetAd.pin });
      }
      return;
    }

    // ⚡ 2. Conmutar Estado Rápido (Activo / Suspendido)
    const btnStatus = e.target.closest('[data-quick-status]');
    if (btnStatus) {
      const id = btnStatus.getAttribute('data-quick-status');
      const list = obtenerAnuncios();
      const targetAd = list.find((a) => a.id === id);
      if (targetAd) {
        const nuevoActivo = !targetAd.activo;
        const nuevoEstadoTipo = nuevoActivo ? 'activo' : 'suspendido';
        const estadoLabelMap = {
          activo: { es: 'Activo · En curso', en: 'Active · Ongoing' },
          suspendido: { es: 'Suspendido · Pausado', en: 'Suspended · Paused' }
        };
        await actualizarAnuncio(id, {
          activo: nuevoActivo,
          estadoTipo: nuevoEstadoTipo,
          estado: estadoLabelMap[nuevoEstadoTipo]
        });
      }
      return;
    }

    // 📅 3. Renovar Vigencia (+30 días desde hoy)
    const btnRenew = e.target.closest('[data-quick-renew]');
    if (btnRenew) {
      const id = btnRenew.getAttribute('data-quick-renew');
      const list = obtenerAnuncios();
      const targetAd = list.find((a) => a.id === id);
      if (targetAd) {
        const now = new Date();
        const hoyStr = now.toISOString().split('T')[0];
        const finStr = new Date(now.getTime() + 30 * 86400000).toISOString().split('T')[0];
        await actualizarAnuncio(id, {
          activo: true,
          estadoTipo: 'activo',
          fechaInicio: hoyStr,
          fechaFin: finStr,
          fecha: {
            es: `${hoyStr} al ${finStr}`,
            en: `${hoyStr} to ${finStr}`
          },
          estado: { es: 'Activo · En curso', en: 'Active · Ongoing' }
        });
      }
      return;
    }

    // 🗑️ 4. Eliminar Anuncio
    const btnDel = e.target.closest('[data-del-ad]');
    if (btnDel) {
      const id = btnDel.getAttribute('data-del-ad');
      if (confirm('¿Deseas eliminar este anuncio?')) {
        await eliminarAnuncio(id);
      }
      return;
    }

    // ✏️ 5. Abrir Modal de Edición Completa
    const btnEdit = e.target.closest('[data-edit-ad]');
    if (btnEdit) {
      const id = btnEdit.getAttribute('data-edit-ad');
      const list = obtenerAnuncios();
      const targetAd = list.find((a) => a.id === id);
      if (targetAd) abrirModal(targetAd);
    }
  });
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnunciosAdmin);
  } else {
    initAnunciosAdmin();
  }
}
