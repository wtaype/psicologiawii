// src/feature/personal/modulos/anuncios/anuncios.js
// Lógica interactiva para la consola de gestión de anuncios y campañas con Gemini AI
import {
  obtenerAnuncios,
  guardarAnuncios,
  crearAnuncio,
  actualizarAnuncio,
  eliminarAnuncio
} from './dataAnuncios.js';
import { consultarJsonGemini } from '../../../../core/servicios/gemini.js';

export function initAnunciosAdmin() {
  const btnCreate = document.getElementById('btnOpenCreateAd');
  const modal = document.getElementById('modalAnuncio');
  const btnClose = document.getElementById('btnCloseAdModal');
  const btnCancel = document.getElementById('btnCancelAdModal');
  const form = document.getElementById('formAnuncio');

  // Elementos de la columna izquierda
  const previewImg = document.getElementById('adPreviewImg');
  const previewBadge = document.getElementById('adPreviewBadge');
  const inputFlyer = document.getElementById('inputAdFlyer');
  const inputEstado = document.getElementById('inputAdEstado');
  const inputCosto = document.getElementById('inputAdCosto');
  const inputConversaciones = document.getElementById('inputAdConversaciones');
  const galleryBtns = document.querySelectorAll('.ad-gallery-thumb-btn');

  // Elementos bilingües
  const tabEs = document.getElementById('adTabEs');
  const tabEn = document.getElementById('adTabEn');
  const paneEs = document.getElementById('ad-pane-es');
  const paneEn = document.getElementById('ad-pane-en');
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

  if (!btnCreate || !modal) return;

  // 1. Selector de Pestañas de Idioma
  function activarTab(paneId) {
    if (paneId === 'ad-pane-es') {
      tabEs?.classList.add('is-active');
      tabEn?.classList.remove('is-active');
      paneEs?.classList.add('is-active');
      paneEn?.classList.remove('is-active');
    } else {
      tabEn?.classList.add('is-active');
      tabEs?.classList.remove('is-active');
      paneEn?.classList.add('is-active');
      paneEs?.classList.remove('is-active');
    }
  }

  tabEs?.addEventListener('click', () => activarTab('ad-pane-es'));
  tabEn?.addEventListener('click', () => activarTab('ad-pane-en'));

  // 2. Selector Visual de Miniaturas de Fotos
  function seleccionarFoto(src) {
    if (!src) return;
    if (inputFlyer) inputFlyer.value = src;
    if (previewImg) previewImg.src = src;

    galleryBtns.forEach((btn) => {
      if (btn.getAttribute('data-src') === src) {
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
    seleccionarFoto(inputFlyer.value.trim());
  });

  inputBadgeEs?.addEventListener('input', () => {
    if (previewBadge) previewBadge.textContent = inputBadgeEs.value || 'Evaluación Clínica';
  });

  // 3. Apertura y Cierre de Modal
  function abrirModal(ad = null) {
    modal.classList.add('is-open');
    activarTab('ad-pane-es');

    if (ad) {
      document.getElementById('inputAdId').value = ad.id;
      
      // Español
      if (inputTituloEs) inputTituloEs.value = ad.titulo?.es || ad.titulo || '';
      if (inputBadgeEs) inputBadgeEs.value = ad.badge?.es || ad.badge || '';
      if (inputDescEs) inputDescEs.value = ad.descripcion?.es || ad.descripcion || '';
      if (inputWsEs) inputWsEs.value = ad.wsMsg?.es || ad.wsMsg || '';

      // English
      if (inputTituloEn) inputTituloEn.value = ad.titulo?.en || ad.tituloEn || '';
      if (inputBadgeEn) inputBadgeEn.value = ad.badge?.en || ad.badgeEn || '';
      if (inputDescEn) inputDescEn.value = ad.descripcion?.en || ad.descripcionEn || '';
      if (inputWsEn) inputWsEn.value = ad.wsMsg?.en || ad.wsMsgEn || '';

      // Parámetros
      if (inputEstado) inputEstado.value = ad.estadoTipo || (ad.activo ? 'activo' : 'completado');
      if (inputCosto) inputCosto.value = ad.costoPorConv || 'S/ 7,33';
      if (inputConversaciones) inputConversaciones.value = ad.conversaciones ?? 0;

      // Imagen
      const imgPath = ad.flyerImg || '/imgwii/psicologa-sofia-consulta.webp';
      seleccionarFoto(imgPath);
      if (previewBadge) previewBadge.textContent = ad.badge?.es || 'Evaluación Clínica';
    } else {
      form.reset();
      document.getElementById('inputAdId').value = '';
      seleccionarFoto('/imgwii/psicologa-sofia-consulta.webp');
      if (inputCosto) inputCosto.value = 'S/ 7,33';
      if (inputConversaciones) inputConversaciones.value = 11;
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

  // 4. Traducción Asistida por Gemini AI
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
      btnGemini.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Traduciendo...</span>';

      try {
        const prompt = `Traduce con precisión clínica y calidez empática los siguientes campos de una campaña psicológica oficial (Lic. Sofía Reynaga, psicóloga clínica en Perú).
Devuelve un JSON estrictamente con la siguiente estructura:
{
  "tituloEn": "Traducción profesional del título",
  "badgeEn": "Traducción del badge/categoría",
  "descripcionEn": "Traducción fluida y comprensible de la descripción",
  "wsMsgEn": "Traducción del mensaje para WhatsApp"
}

Campos originales en español:
- Título: ${titulo}
- Badge / Categoría: ${badge}
- Descripción: ${desc}
- Mensaje de WhatsApp: ${ws}`;

        const res = await consultarJsonGemini({
          prompt,
          systemInstruction: 'Eres un traductor bilingüe especializado en psicología clínica, psicoterapia y comunicación con pacientes. Devuelve siempre un objeto JSON válido sin texto adicional.'
        });

        if (res) {
          if (res.tituloEn && inputTituloEn) inputTituloEn.value = res.tituloEn;
          if (res.badgeEn && inputBadgeEn) inputBadgeEn.value = res.badgeEn;
          if (res.descripcionEn && inputDescEn) inputDescEn.value = res.descripcionEn;
          if (res.wsMsgEn && inputWsEn) inputWsEn.value = res.wsMsgEn;

          // Cambiar a la pestaña en inglés para que el usuario pueda validar
          activarTab('ad-pane-en');
        }
      } catch (err) {
        console.error('Error al traducir con Gemini AI:', err);
        alert('Ocurrió un error al conectar con Gemini AI: ' + (err.message || 'Error desconocido'));
      } finally {
        btnGemini.disabled = false;
        btnGemini.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> <span>Traducir con IA</span>';
      }
    });
  }

  // 5. Envío y Persistencia del Formulario
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('inputAdId').value;
      const tituloEs = inputTituloEs?.value.trim() || 'Nueva Campaña';
      const tituloEn = inputTituloEn?.value.trim() || tituloEs;
      const badgeEs = inputBadgeEs?.value.trim() || 'Evaluación Clínica';
      const badgeEn = inputBadgeEn?.value.trim() || badgeEs;
      const descEs = inputDescEs?.value.trim() || '';
      const descEn = inputDescEn?.value.trim() || descEs;
      const wsEs = inputWsEs?.value.trim() || 'Hola Lic. Sofía, vi el anuncio y deseo coordinar una consulta.';
      const wsEn = inputWsEn?.value.trim() || wsEs;

      const estadoTipo = inputEstado?.value || 'activo';
      const isActivo = estadoTipo === 'activo' || estadoTipo === 'vigente';
      const flyer = inputFlyer?.value.trim() || '/imgwii/psicologa-sofia-consulta.webp';
      const costo = inputCosto?.value.trim() || 'S/ 7,33';
      const convs = Number(inputConversaciones?.value) || 0;

      const adData = {
        titulo: { es: tituloEs, en: tituloEn },
        badge: { es: badgeEs, en: badgeEn },
        descripcion: { es: descEs, en: descEn },
        wsMsg: { es: wsEs, en: wsEn },
        estadoTipo,
        activo: isActivo,
        estado: {
          es: estadoTipo === 'activo' ? 'Activo · En curso' : (estadoTipo === 'vigente' ? 'Vigente · Con cupos' : 'Completado'),
          en: estadoTipo === 'activo' ? 'Active · Ongoing' : (estadoTipo === 'vigente' ? 'Active · Spots available' : 'Completed')
        },
        fecha: {
          es: 'Modificado hoy',
          en: 'Updated today'
        },
        costoPorConv: costo,
        conversaciones: convs,
        flyerImg: flyer,
        thumbImg: flyer
      };

      if (id) {
        actualizarAnuncio(id, adData);
      } else {
        crearAnuncio(adData);
      }

      cerrarModal();
      window.location.reload();
    });
  }

  // 6. Delegación de eventos para editar / eliminar en la lista
  document.addEventListener('click', (e) => {
    const btnDel = e.target.closest('[data-del-ad]');
    if (btnDel) {
      const id = btnDel.getAttribute('data-del-ad');
      if (confirm('¿Deseas eliminar este anuncio?')) {
        eliminarAnuncio(id);
        window.location.reload();
      }
    }

    const btnEdit = e.target.closest('[data-edit-ad]');
    if (btnEdit) {
      const id = btnEdit.getAttribute('data-edit-ad');
      const list = obtenerAnuncios();
      const targetAd = list.find(a => a.id === id);
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
