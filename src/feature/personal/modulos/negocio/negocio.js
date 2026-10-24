// src/feature/personal/modulos/negocio/negocio.js
// Controlador Frontend Autónomo del Módulo Ficha de Negocio & Especialista
// 100% JS Nativo · Cero TypeScript · Local-First · Integración con @widev y Firestore

import { Notificacion, wiSpin, wiAtajo, wiConfirmar, wiSelect, adrm, savels, getls, removels, Saludar } from '@widev';
import {
  obtenerDatosNegocio,
  guardarDatosNegocio,
  calcularAnosTrayectoria,
  sincronizarDesdeFirestore,
  obtenerSemillaLocal,
  getUsuarioActivo
} from './dataNegocio.js';
import { getCanalesRedes, configSemilla } from '@/negocio.js';

export function inicializarNegocio() {
  const panelNegocio = document.getElementById('panel-negocio');
  if (!panelNegocio || panelNegocio.dataset.negocioInit === 'true') return;
  panelNegocio.dataset.negocioInit = 'true';

  let isSaving = false;

  // Botón Principal Guardar
  const btnGuardarNegocio = document.getElementById('btnGuardarNegocio');
  const ngBadgeTrayectoria = document.getElementById('ngBadgeTrayectoria');
  const ngYearsText = document.getElementById('ngYearsText');

  // ── HELPERS DE URLS INTELIGENTES COMPLETAS DINÁMICAS ──
  function obtenerOrigenActual() {
    if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null') {
      return window.location.origin;
    }
    return 'https://psicologiawii.web.app';
  }

  function formatearUrlCompleta(url = '') {
    if (!url) return '';
    if (typeof url === 'object' && url.url) {
      url = url.url;
    }
    if (typeof url !== 'string') return '';
    const origin = obtenerOrigenActual();

    // Si viene con el dominio viejo inexistente "psicologiawii.com", reemplazarlo por el origen actual
    if (url.includes('psicologiawii.com')) {
      return url.replace(/https?:\/\/[^\/]+/, origin);
    }

    // Si ya empieza con http/https pero apunta a localhost o al hosting con ruta interna (/imgwii/)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const u = new URL(url);
        if (u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname.includes('psicologiawii') || u.pathname.startsWith('/imgwii/')) {
          return `${origin}${u.pathname}${u.search}`;
        }
      } catch (e) {}
      return url;
    }

    const clean = url.startsWith('/') ? url : `/${url}`;
    return `${origin}${clean}`;
  }

  function normalizarUrlParaGuardar(url = '') {
    if (!url || typeof url !== 'string') return '';
    const origin = obtenerOrigenActual();
    let res = url.trim();
    if (origin && res.startsWith(origin)) {
      res = res.replace(origin, '');
    }
    if (res.includes('psicologiawii.com')) {
      res = res.replace(/https?:\/\/psicologiawii\.com/, '');
    }
    return res;
  }

  // ── 0. SELECTOR DE PESTAÑAS HORIZONTALES PRO (PERSISTENTE) ──
  const TAB_STORAGE_KEY = 'wi_negocio_tab';
  const mainTabBtns = document.querySelectorAll('.ng-tab-btn');
  const mainTabPanes = document.querySelectorAll('.ng-tab-pane');

  function switchMainTab(targetId) {
    if (!targetId) return;
    const pane = document.getElementById(targetId);
    if (!pane) targetId = 'ng-tab-identidad';

    mainTabBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-tab-target') === targetId));
    mainTabPanes.forEach(p => p.classList.toggle('active', p.id === targetId));
    savels(TAB_STORAGE_KEY, targetId);
  }

  mainTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab-target');
      switchMainTab(target);
    });
  });

  const tabGuardada = getls(TAB_STORAGE_KEY);
  if (tabGuardada && document.getElementById(tabGuardada) && tabGuardada !== 'ng-tab-bilingue') {
    switchMainTab(tabGuardada);
  } else {
    switchMainTab('ng-tab-identidad');
  }

  // ── 1. SELECTOR DE PESTAÑAS DE IDIOMA EN SECCIÓN LIBRE INFERIOR (ES / EN) ──
  document.querySelectorAll('.ng-lang-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ng-lang-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.ng-lang-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const targetPaneId = btn.getAttribute('data-target');
      const pane = document.getElementById(targetPaneId);
      if (pane) pane.classList.add('active');
    });
  });

  // ── 2. INPUTS DE IDENTIDAD Y MULTIMEDIA ──
  const inputEspecialista = document.getElementById('ngInputEspecialista');
  const inputColegiatura = document.getElementById('ngInputColegiatura');
  const inputTitulo = document.getElementById('ngInputTitulo');
  const inputGrado = document.getElementById('ngInputGrado');
  const inputLanzamiento = document.getElementById('ngInputLanzamiento');
  const inputLogo = document.getElementById('ngInputLogo');
  const inputLogoFull = document.getElementById('ngInputLogoFull');
  const inputImagenSede = document.getElementById('ngInputImagenSede');
  const imgLogoPreview = document.getElementById('ngImgLogoPreview');
  const imgLogoFullPreview = document.getElementById('ngImgLogoFullPreview');
  const imgHeroPreview = document.getElementById('ngImgHeroPreview');
  const btnLinkHero = document.getElementById('btnLinkHero');
  const btnLinkLogo = document.getElementById('btnLinkLogo');
  const btnLinkLogoFull = document.getElementById('btnLinkLogoFull');

  // Inputs Bilingües: Identidad (ES / EN)
  const inputNombre = document.getElementById('ngInputNombre');
  const inputNombreCorto = document.getElementById('ngInputNombreCorto');
  const inputEnfoques = document.getElementById('ngInputEnfoques');
  const inputNombreEn = document.getElementById('ngInputNombreEn');
  const inputNombreCortoEn = document.getElementById('ngInputNombreCortoEn');
  const inputEnfoquesEn = document.getElementById('ngInputEnfoquesEn');

  // ── 3. INPUTS DE CONTACTO Y HORARIOS ──
  const selectPais = document.getElementById('ngSelectPais');
  const hintPaisCodigo = document.getElementById('hintPaisCodigo');
  const inputTelefono = document.getElementById('ngInputTelefono');
  const inputTelefonoFijo = document.getElementById('ngInputTelefonoFijo');
  const inputTelefonoSecundario = document.getElementById('ngInputTelefonoSecundario');
  const inputCelularPersonal = document.getElementById('ngInputCelularPersonal');
  const inputWhatsapp = document.getElementById('ngInputWhatsapp');
  const inputEmail = document.getElementById('ngInputEmail');
  const inputCorreoPacientes = document.getElementById('ngInputCorreoPacientes');
  const ngHorarioSemanaAbre = document.getElementById('ngHorarioSemanaAbre');
  const ngHorarioSemanaCierra = document.getElementById('ngHorarioSemanaCierra');
  const ngHorarioSabadoAbre = document.getElementById('ngHorarioSabadoAbre');
  const ngHorarioSabadoCierra = document.getElementById('ngHorarioSabadoCierra');
  const hintTelefonoFormato = document.getElementById('hintTelefonoFormato');
  const hintWhatsappFormato = document.getElementById('hintWhatsappFormato');

  // ── 4. INPUTS DE UBICACIÓN Y MAPS ──
  const inputDireccion = document.getElementById('ngInputDireccion');
  const inputReferencia = document.getElementById('ngInputReferencia');
  const inputDistrito = document.getElementById('ngInputDistrito');
  const inputCiudad = document.getElementById('ngInputCiudad');
  const inputMapsUrl = document.getElementById('ngInputMapsUrl');
  const inputLat = document.getElementById('ngInputLat');
  const inputLng = document.getElementById('ngInputLng');
  const btnBuscarGoogleMaps = document.getElementById('btnBuscarGoogleMaps');
  const btnProbarMapsUrl = document.getElementById('btnProbarMapsUrl');

  // ── 5. TITULAR PRINCIPAL H1 & HERO WEB (ES / EN) ──
  const inputHeroTituloEs = document.getElementById('ngInputHeroTituloEs');
  const inputHeroDescEs = document.getElementById('ngInputHeroDescEs');
  const inputHeroImg = document.getElementById('ngInputHeroImg');
  const btnProbarHeroImg = document.getElementById('btnProbarHeroImg');
  const inputMetricaClientes = document.getElementById('ngInputMetricaClientes');
  const inputMetricaBalanza = document.getElementById('ngInputMetricaBalanza');
  const inputHeroTituloEn = document.getElementById('ngInputHeroTituloEn');
  const inputHeroDescEn = document.getElementById('ngInputHeroDescEn');

  // Previews Hero Mockup (ES / EN)
  const ngHeroPreviewTituloEs = document.getElementById('ngHeroPreviewTituloEs');
  const ngHeroPreviewDescEs = document.getElementById('ngHeroPreviewDescEs');
  const ngHeroPreviewClientesEs = document.getElementById('ngHeroPreviewClientesEs');
  const ngHeroPreviewBalanzaEs = document.getElementById('ngHeroPreviewBalanzaEs');
  const ngHeroPreviewYearsEs = document.getElementById('ngHeroPreviewYearsEs');
  const ngHeroPreviewTituloEn = document.getElementById('ngHeroPreviewTituloEn');
  const ngHeroPreviewDescEn = document.getElementById('ngHeroPreviewDescEn');

  // ── 6. INFORMACIÓN ADICIONAL & HORARIOS (ES / EN) ──
  const ngSedeVesTagEs = document.getElementById('ngSedeVesTagEs');
  const ngSedeVesAtencionEs = document.getElementById('ngSedeVesAtencionEs');
  const ngSedeVirtualTagEs = document.getElementById('ngSedeVirtualTagEs');
  const ngSedeVirtualAtencionEs = document.getElementById('ngSedeVirtualAtencionEs');

  const ngSedeVesTagEn = document.getElementById('ngSedeVesTagEn');
  const ngSedeVesAtencionEn = document.getElementById('ngSedeVesAtencionEn');
  const ngSedeVirtualTagEn = document.getElementById('ngSedeVirtualTagEn');
  const ngSedeVirtualAtencionEn = document.getElementById('ngSedeVirtualAtencionEn');

  // ── 6.1 MÁS TRADUCCIONES SOBRE MI NEGOCIO (ES / EN) ──
  const inputBioEs = document.getElementById('ngInputBioEs');
  const inputBioEn = document.getElementById('ngInputBioEn');
  const inputWsMensajeEs = document.getElementById('ngInputWsMensajeEs');
  const inputWsMensajeEn = document.getElementById('ngInputWsMensajeEn');
  const inputHeroBadgeEs = document.getElementById('ngInputHeroBadgeEs');
  const inputHeroBadgeEn = document.getElementById('ngInputHeroBadgeEn');
  const inputHeroDriverTituloEs = document.getElementById('ngInputHeroDriverTituloEs');
  const inputHeroDriverTituloEn = document.getElementById('ngInputHeroDriverTituloEn');
  const inputHeroDriverDescEs = document.getElementById('ngInputHeroDriverDescEs');
  const inputHeroDriverDescEn = document.getElementById('ngInputHeroDriverDescEn');

  // Previews Información Adicional (ES / EN)
  const ngSedesPreviewDirEs = document.getElementById('ngSedesPreviewDirEs');
  const ngSedesPreviewTagPresencialEs = document.getElementById('ngSedesPreviewTagPresencialEs');
  const ngSedesPreviewHorPresencialEs = document.getElementById('ngSedesPreviewHorPresencialEs');
  const ngSedesPreviewTagVirtualEs = document.getElementById('ngSedesPreviewTagVirtualEs');
  const ngSedesPreviewHorVirtualEs = document.getElementById('ngSedesPreviewHorVirtualEs');
  const ngInfoPreviewChipsEs = document.getElementById('ngInfoPreviewChipsEs');

  const ngSedesPreviewDirEn = document.getElementById('ngSedesPreviewDirEn');
  const ngSedesPreviewTagPresencialEn = document.getElementById('ngSedesPreviewTagPresencialEn');
  const ngSedesPreviewHorPresencialEn = document.getElementById('ngSedesPreviewHorPresencialEn');
  const ngSedesPreviewTagVirtualEn = document.getElementById('ngSedesPreviewTagVirtualEn');
  const ngSedesPreviewHorVirtualEn = document.getElementById('ngSedesPreviewHorVirtualEn');
  const ngInfoPreviewChipsEn = document.getElementById('ngInfoPreviewChipsEn');

  // ── 7. REDES SOCIALES ──
  const inputRedYoutube = document.getElementById('ngInputRedYoutube');
  const inputRedFacebook = document.getElementById('ngInputRedFacebook');
  const inputRedInstagram = document.getElementById('ngInputRedInstagram');
  const inputRedTiktok = document.getElementById('ngInputRedTiktok');
  const inputRedCanalWhatsapp = document.getElementById('ngInputRedCanalWhatsapp');
  const inputRedWeb = document.getElementById('ngInputRedWeb');
  const inputRedLinkedin = document.getElementById('ngInputRedLinkedin');
  const inputRedTwitter = document.getElementById('ngInputRedTwitter');

  // Toolbar de Agregar Red
  const selectAgregarRed = document.getElementById('ngSelectAgregarRed');
  const btnAgregarRed = document.getElementById('btnAgregarRed');

  // ── 8. SEO DINÁMICO BILINGÜE Y PREVIEWS EN VIVO ──
  const inputSeoTituloEs = document.getElementById('ngInputSeoTituloEs');
  const inputSeoDescEs = document.getElementById('ngInputSeoDescEs');
  const inputSeoKeywordsEs = document.getElementById('ngInputSeoKeywordsEs');
  const inputSeoImgEs = document.getElementById('ngInputSeoImgEs');
  const btnProbarFotoSeoEs = document.getElementById('btnProbarFotoSeoEs');
  const btnCambiarFotoSeoEs = document.getElementById('btnCambiarFotoSeoEs');
  const ngSerpThumbBoxEs = document.getElementById('ngSerpThumbBoxEs');
  const ngSerpImgEs = document.getElementById('ngSerpImgEs');
  const ngSeoTituloCountEs = document.getElementById('ngSeoTituloCountEs');
  const ngSeoDescCountEs = document.getElementById('ngSeoDescCountEs');
  const ngSerpTitleEs = document.getElementById('ngSerpTitleEs');
  const ngSerpDescEs = document.getElementById('ngSerpDescEs');

  const inputSeoTituloEn = document.getElementById('ngInputSeoTituloEn');
  const inputSeoDescEn = document.getElementById('ngInputSeoDescEn');
  const inputSeoKeywordsEn = document.getElementById('ngInputSeoKeywordsEn');
  const inputSeoImgEn = document.getElementById('ngInputSeoImgEn');
  const btnProbarFotoSeoEn = document.getElementById('btnProbarFotoSeoEn');
  const btnCambiarFotoSeoEn = document.getElementById('btnCambiarFotoSeoEn');
  const ngSerpThumbBoxEn = document.getElementById('ngSerpThumbBoxEn');
  const ngSerpImgEn = document.getElementById('ngSerpImgEn');
  const ngSeoTituloCountEn = document.getElementById('ngSeoTituloCountEn');
  const ngSeoDescCountEn = document.getElementById('ngSeoDescCountEn');
  const ngSerpTitleEn = document.getElementById('ngSerpTitleEn');
  const ngSerpDescEn = document.getElementById('ngSerpDescEn');
  const ngSerpUrlTextEs = document.getElementById('ngSerpUrlTextEs');
  const ngSerpUrlTextEn = document.getElementById('ngSerpUrlTextEn');

  // ── CATÁLOGO OFICIAL DE REDES SOCIALES ──
  const CATALOGO_REDES = [
    { id: 'linkedin', nombre: 'LinkedIn', icon: 'fa-brands fa-linkedin', color: '#0a66c2', formato: 'https://linkedin.com/in/usuario', portal: 'https://www.linkedin.com/in/' },
    { id: 'web', nombre: 'Web Oficial', icon: 'fa-solid fa-globe', color: '#00a2ed', formato: 'https://tuweb.com', portal: 'https://google.com' },
    { id: 'whatsapp', nombre: 'WhatsApp', icon: 'fa-brands fa-whatsapp', color: '#25d366', formato: 'https://wa.me/51... o canal', portal: 'https://web.whatsapp.com' },
    { id: 'instagram', nombre: 'Instagram', icon: 'fa-brands fa-instagram', color: '#e1306c', formato: 'https://instagram.com/usuario', portal: 'https://www.instagram.com/' },
    { id: 'facebook', nombre: 'Facebook', icon: 'fa-brands fa-facebook-f', color: '#1877f2', formato: 'https://facebook.com/pagina', portal: 'https://www.facebook.com/' },
    { id: 'tiktok', nombre: 'TikTok', icon: 'fa-brands fa-tiktok', color: '#ffffff', formato: 'https://tiktok.com/@usuario', portal: 'https://www.tiktok.com/' },
    { id: 'youtube', nombre: 'YouTube', icon: 'fa-brands fa-youtube', color: '#ff0000', formato: 'https://youtube.com/@canal', portal: 'https://www.youtube.com/' },
    { id: 'twitter', nombre: 'X (Twitter)', icon: 'fa-brands fa-x-twitter', color: '#e2e8f0', formato: 'https://x.com/usuario', portal: 'https://x.com/' }
  ];

  const MAPA_INPUTS_REDES = {
    linkedin: inputRedLinkedin,
    web: inputRedWeb,
    whatsapp: inputRedCanalWhatsapp,
    instagram: inputRedInstagram,
    facebook: inputRedFacebook,
    tiktok: inputRedTiktok,
    youtube: inputRedYoutube,
    twitter: inputRedTwitter
  };

  // ── GESTIÓN DE AÑOS DE TRAYECTORIA ──
  function actualizarAnosTrayectoriaUI() {
    const fecha = inputLanzamiento?.value;
    const years = fecha ? calcularAnosTrayectoria(fecha) : '';
    const text = years ? `${years}+ años` : '';
    if (ngYearsText) ngYearsText.textContent = text;
    if (ngHeroPreviewYearsEs) ngHeroPreviewYearsEs.textContent = years ? `${years}+` : '';
  }
  inputLanzamiento?.addEventListener('change', actualizarAnosTrayectoriaUI);
  inputLanzamiento?.addEventListener('input', actualizarAnosTrayectoriaUI);

  // ── ACTUALIZACIÓN DE PREVIEWS EN TIEMPO REAL CON URL COMPLETA ──
  inputImagenSede?.addEventListener('input', () => {
    const val = inputImagenSede.value.trim();
    if (imgHeroPreview) imgHeroPreview.src = val || '';
    if (btnLinkHero) btnLinkHero.href = val || '#';
  });

  inputLogo?.addEventListener('input', () => {
    const val = inputLogo.value.trim();
    if (imgLogoPreview) imgLogoPreview.src = val || '';
    if (btnLinkLogo) btnLinkLogo.href = val || '#';
  });

  inputLogoFull?.addEventListener('input', () => {
    const val = inputLogoFull.value.trim();
    if (imgLogoFullPreview) imgLogoFullPreview.src = val || '';
    if (btnLinkLogoFull) btnLinkLogoFull.href = val || '#';
  });

  // ── 8.1 CONTROLADORES Y PREVIEWS EN TIEMPO REAL (BILINGÜE) ──
  function actualizarContadorChar(elBadge, len, min, max) {
    if (!elBadge) return;
    elBadge.textContent = `${len} / ${max}`;
    elBadge.classList.remove('warning', 'danger');
    if (len > max) {
      elBadge.classList.add('danger');
    } else if (len < min && len > 0) {
      elBadge.classList.add('warning');
    }
  }

  // 1. Previews SEO Google SERP
  function sincronizarSeoEs() {
    const origin = obtenerOrigenActual();
    if (ngSerpUrlTextEs) ngSerpUrlTextEs.textContent = origin;
    const tit = inputSeoTituloEs?.value?.trim() || inputSeoTituloEs?.placeholder || '';
    const desc = inputSeoDescEs?.value?.trim() || inputSeoDescEs?.placeholder || '';
    if (ngSerpTitleEs) ngSerpTitleEs.textContent = tit;
    if (ngSerpDescEs) ngSerpDescEs.textContent = desc;
    actualizarContadorChar(ngSeoTituloCountEs, (inputSeoTituloEs?.value || '').length, 45, 65);
    actualizarContadorChar(ngSeoDescCountEs, (inputSeoDescEs?.value || '').length, 120, 160);
  }

  function sincronizarSeoEn() {
    const origin = obtenerOrigenActual();
    if (ngSerpUrlTextEn) ngSerpUrlTextEn.textContent = `${origin}/en`;
    const tit = inputSeoTituloEn?.value?.trim() || inputSeoTituloEn?.placeholder || '';
    const desc = inputSeoDescEn?.value?.trim() || inputSeoDescEn?.placeholder || '';
    if (ngSerpTitleEn) ngSerpTitleEn.textContent = tit;
    if (ngSerpDescEn) ngSerpDescEn.textContent = desc;
    actualizarContadorChar(ngSeoTituloCountEn, (inputSeoTituloEn?.value || '').length, 45, 65);
    actualizarContadorChar(ngSeoDescCountEn, (inputSeoDescEn?.value || '').length, 120, 160);
  }

  function actualizarFotoMiniatura(url) {
    if (!url) return;
    const cleanUrl = url.trim();
    const fullUrl = formatearUrlCompleta(cleanUrl);
    if (inputSeoImgEs) inputSeoImgEs.value = fullUrl;
    if (inputSeoImgEn) inputSeoImgEn.value = fullUrl;
    if (ngSerpImgEs) ngSerpImgEs.src = cleanUrl;
    if (ngSerpImgEn) ngSerpImgEn.src = cleanUrl;
  }

  function promptCambiarFotoSeo() {
    const actual = inputSeoImgEs?.value || ngSerpImgEs?.getAttribute('src') || '/imgwii/Sofia.jpg';
    const sugeridas = [
      '/imgwii/Sofia.jpg',
      '/imgwii/hero/psicologa-sofia-reynaga.webp',
      '/imgwii/logo.webp',
      '/imgwii/Psychologist_listening_in_therapy.jpeg'
    ];
    const nueva = window.prompt(`Ingresa la URL o ruta de la imagen miniatura para Google SERP:\n\nSugerencias frecuentes:\n- ${sugeridas.join('\n- ')}`, actual);
    if (nueva && nueva.trim() && nueva.trim() !== actual) {
      actualizarFotoMiniatura(nueva.trim());
      Notificacion.exito('Miniatura de Google SERP actualizada en vivo');
    }
  }

  btnCambiarFotoSeoEs?.addEventListener('click', (e) => { e.stopPropagation(); promptCambiarFotoSeo(); });
  btnCambiarFotoSeoEn?.addEventListener('click', (e) => { e.stopPropagation(); promptCambiarFotoSeo(); });
  ngSerpThumbBoxEs?.addEventListener('dblclick', () => promptCambiarFotoSeo());
  ngSerpThumbBoxEn?.addEventListener('dblclick', () => promptCambiarFotoSeo());

  inputSeoImgEs?.addEventListener('input', () => {
    const val = inputSeoImgEs.value.trim();
    if (ngSerpImgEs) ngSerpImgEs.src = val || '/imgwii/Sofia.jpg';
    if (inputSeoImgEn) inputSeoImgEn.value = val;
    if (ngSerpImgEn) ngSerpImgEn.src = val || '/imgwii/Sofia.jpg';
  });

  inputSeoImgEn?.addEventListener('input', () => {
    const val = inputSeoImgEn.value.trim();
    if (ngSerpImgEn) ngSerpImgEn.src = val || '/imgwii/Sofia.jpg';
    if (inputSeoImgEs) inputSeoImgEs.value = val;
    if (ngSerpImgEs) ngSerpImgEs.src = val || '/imgwii/Sofia.jpg';
  });

  btnProbarFotoSeoEs?.addEventListener('click', () => {
    const raw = inputSeoImgEs?.value?.trim() || ngSerpImgEs?.getAttribute('src');
    const url = formatearUrlCompleta(raw);
    if (url) window.open(url, '_blank');
  });

  btnProbarFotoSeoEn?.addEventListener('click', () => {
    const raw = inputSeoImgEn?.value?.trim() || ngSerpImgEn?.getAttribute('src');
    const url = formatearUrlCompleta(raw);
    if (url) window.open(url, '_blank');
  });

  inputSeoTituloEs?.addEventListener('input', sincronizarSeoEs);
  inputSeoDescEs?.addEventListener('input', sincronizarSeoEs);
  inputSeoTituloEn?.addEventListener('input', sincronizarSeoEn);
  inputSeoDescEn?.addEventListener('input', sincronizarSeoEn);

  // 2. Previews Titular Principal H1 & Hero Web
  function sincronizarHeroEs() {
    const sem = (typeof obtenerSemillaLocal === 'function' ? obtenerSemillaLocal()?.hero : null) || configSemilla?.hero || {};
    const semTit = typeof sem.titulo === 'object' ? (sem.titulo?.es || '') : (sem.titulo || '');
    const semDesc = typeof sem.subtitulo === 'object' ? (sem.subtitulo?.es || '') : (sem.subtitulo || '');
    const tit = inputHeroTituloEs?.value?.trim() || inputHeroTituloEs?.placeholder || semTit || '';
    const desc = inputHeroDescEs?.value?.trim() || inputHeroDescEs?.placeholder || semDesc || '';
    const clientes = inputMetricaClientes?.value?.trim() || inputMetricaClientes?.placeholder || '';
    const balanza = inputMetricaBalanza?.value?.trim() || inputMetricaBalanza?.placeholder || '';

    if (ngHeroPreviewTituloEs) ngHeroPreviewTituloEs.textContent = tit;
    if (ngHeroPreviewDescEs) ngHeroPreviewDescEs.textContent = desc;
    if (ngHeroPreviewClientesEs) ngHeroPreviewClientesEs.textContent = clientes;
    if (ngHeroPreviewBalanzaEs) ngHeroPreviewBalanzaEs.textContent = balanza;
  }

  function sincronizarHeroEn() {
    const sem = (typeof obtenerSemillaLocal === 'function' ? obtenerSemillaLocal()?.hero : null) || configSemilla?.hero || {};
    const semTit = typeof sem.titulo === 'object' ? (sem.titulo?.en || sem.titulo?.es || '') : (sem.tituloEn || sem.titulo || '');
    const semDesc = typeof sem.subtitulo === 'object' ? (sem.subtitulo?.en || sem.subtitulo?.es || '') : (sem.subtituloEn || sem.subtitulo || '');
    const tit = inputHeroTituloEn?.value?.trim() || inputHeroTituloEn?.placeholder || semTit || '';
    const desc = inputHeroDescEn?.value?.trim() || inputHeroDescEn?.placeholder || semDesc || '';

    if (ngHeroPreviewTituloEn) ngHeroPreviewTituloEn.textContent = tit;
    if (ngHeroPreviewDescEn) ngHeroPreviewDescEn.textContent = desc;
  }

  inputHeroTituloEs?.addEventListener('input', sincronizarHeroEs);
  inputHeroDescEs?.addEventListener('input', sincronizarHeroEs);
  inputMetricaClientes?.addEventListener('input', sincronizarHeroEs);
  inputMetricaBalanza?.addEventListener('input', sincronizarHeroEs);

  inputHeroTituloEn?.addEventListener('input', sincronizarHeroEn);
  inputHeroDescEn?.addEventListener('input', sincronizarHeroEn);

  btnProbarHeroImg?.addEventListener('click', () => {
    const raw = inputHeroImg?.value?.trim() || inputHeroImg?.placeholder || '';
    const url = formatearUrlCompleta(raw);
    if (url) window.open(url, '_blank');
  });

  // 3. Previews Información Adicional & Horarios
  function sincronizarInfoEs() {
    if (ngSedesPreviewDirEs && inputDireccion) {
      ngSedesPreviewDirEs.textContent = inputDireccion.value?.trim() || inputDireccion.placeholder || '';
    }
    if (ngSedesPreviewTagPresencialEs) {
      ngSedesPreviewTagPresencialEs.textContent = ngSedeVesTagEs?.value?.trim() || ngSedeVesTagEs?.placeholder || 'Sede Presencial Lima';
    }
    if (ngSedesPreviewHorPresencialEs) {
      ngSedesPreviewHorPresencialEs.textContent = ngSedeVesAtencionEs?.value?.trim() || ngSedeVesAtencionEs?.placeholder || '';
    }
    if (ngSedesPreviewTagVirtualEs) {
      ngSedesPreviewTagVirtualEs.textContent = ngSedeVirtualTagEs?.value?.trim() || ngSedeVirtualTagEs?.placeholder || 'Google Meet & Teams';
    }
    if (ngSedesPreviewHorVirtualEs) {
      ngSedesPreviewHorVirtualEs.textContent = ngSedeVirtualAtencionEs?.value?.trim() || ngSedeVirtualAtencionEs?.placeholder || '';
    }
    if (ngInfoPreviewChipsEs) {
      const rawChips = inputEnfoques?.value?.trim() || inputEnfoques?.placeholder || '';
      const items = rawChips.split(/[·,•]/).map(s => s.trim()).filter(Boolean);
      ngInfoPreviewChipsEs.innerHTML = items.map(t => `<span class="mockup-info-chip"><i class="fa-solid fa-check"></i> ${t}</span>`).join('');
    }
  }

  function sincronizarInfoEn() {
    if (ngSedesPreviewDirEn && inputDireccion) {
      ngSedesPreviewDirEn.textContent = inputDireccion.value?.trim() || inputDireccion.placeholder || '';
    }
    if (ngSedesPreviewTagPresencialEn) {
      ngSedesPreviewTagPresencialEn.textContent = ngSedeVesTagEn?.value?.trim() || ngSedeVesTagEn?.placeholder || 'In-Person Lima Clinic';
    }
    if (ngSedesPreviewHorPresencialEn) {
      ngSedesPreviewHorPresencialEn.textContent = ngSedeVesAtencionEn?.value?.trim() || ngSedeVesAtencionEn?.placeholder || '';
    }
    if (ngSedesPreviewTagVirtualEn) {
      ngSedesPreviewTagVirtualEn.textContent = ngSedeVirtualTagEn?.value?.trim() || ngSedeVirtualTagEn?.placeholder || 'Google Meet & Teams';
    }
    if (ngSedesPreviewHorVirtualEn) {
      ngSedesPreviewHorVirtualEn.textContent = ngSedeVirtualAtencionEn?.value?.trim() || ngSedeVirtualAtencionEn?.placeholder || '';
    }
    if (ngInfoPreviewChipsEn) {
      const rawChips = inputEnfoquesEn?.value?.trim() || inputEnfoquesEn?.placeholder || '';
      const items = rawChips.split(/[·,•]/).map(s => s.trim()).filter(Boolean);
      ngInfoPreviewChipsEn.innerHTML = items.map(t => `<span class="mockup-info-chip"><i class="fa-solid fa-check"></i> ${t}</span>`).join('');
    }
  }

  ngSedeVesTagEs?.addEventListener('input', sincronizarInfoEs);
  ngSedeVesAtencionEs?.addEventListener('input', sincronizarInfoEs);
  ngSedeVirtualTagEs?.addEventListener('input', sincronizarInfoEs);
  ngSedeVirtualAtencionEs?.addEventListener('input', sincronizarInfoEs);
  inputEnfoques?.addEventListener('input', sincronizarInfoEs);
  inputDireccion?.addEventListener('input', () => {
    sincronizarInfoEs();
    sincronizarInfoEn();
  });

  ngSedeVesTagEn?.addEventListener('input', sincronizarInfoEn);
  ngSedeVesAtencionEn?.addEventListener('input', sincronizarInfoEn);
  ngSedeVirtualTagEn?.addEventListener('input', sincronizarInfoEn);
  ngSedeVirtualAtencionEn?.addEventListener('input', sincronizarInfoEn);
  inputEnfoquesEn?.addEventListener('input', sincronizarInfoEn);

  // ── GESTIÓN DE ZONAS & COBERTURA DE REPARTO (LIVE PREVIEW 0MS) ──
  const btnAgregarZona = document.getElementById('btnAgregarZona');
  const contenedorZonas = document.getElementById('ngListaZonas');
  const mockChipsGrid = document.getElementById('ngMockZonasChips');
  const mockEtaInfo = document.getElementById('ngMockEtaInfo');

  function renderizarMockZonasChips() {
    if (!mockChipsGrid) return;
    const zonas = recolectarZonasDOM();
    if (zonas.length === 0) {
      mockChipsGrid.innerHTML = '<p class="ng-mock-empty" style="grid-column: span 2; font-size: 12px; color: var(--muted); padding: 8px 0;">No hay distritos configurados.</p>';
      if (mockEtaInfo) mockEtaInfo.innerHTML = 'Despachando desde sede: <strong>--</strong>';
      return;
    }

    mockChipsGrid.innerHTML = zonas.map((z, idx) => `
      <div class="ng-mock-chip ${idx === 0 ? 'active' : ''} ${z.activo ? '' : 'inactive'}" data-dist="${z.distrito}" data-eta="${z.tiempoMin || 8} - ${z.tiempoMax || 18} ${z.unidad || 'min'}">
        <span class="ng-mock-chip-name">${z.distrito || 'Distrito'}</span>
        <span class="ng-mock-chip-time"><i class="fa-solid fa-bolt"></i> ${z.tiempoMin || 8} - ${z.tiempoMax || 18} ${z.unidad || 'min'}</span>
      </div>
    `).join('');

    const primeraActiva = zonas.find(z => z.activo);
    if (mockEtaInfo) {
      if (primeraActiva) {
        mockEtaInfo.innerHTML = `Despachando hacia <strong>${primeraActiva.distrito}</strong>: <strong>${primeraActiva.tiempoMin} - ${primeraActiva.tiempoMax} ${primeraActiva.unidad}</strong>`;
      } else {
        mockEtaInfo.innerHTML = 'Todos los distritos están pausados';
      }
    }

    mockChipsGrid.querySelectorAll('.ng-mock-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        mockChipsGrid.querySelectorAll('.ng-mock-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const dist = chip.getAttribute('data-dist');
        const eta = chip.getAttribute('data-eta');
        if (mockEtaInfo) {
          mockEtaInfo.innerHTML = `Despachando hacia <strong>${dist}</strong>: <strong>${eta}</strong>`;
        }
      });
    });
  }

  function enlazarEventosZonaCard(card) {
    if (!card) return;
    const inpDist = card.querySelector('.ng-zona-distrito');
    const inpMin = card.querySelector('.ng-zona-min');
    const inpMax = card.querySelector('.ng-zona-max');
    const selUni = card.querySelector('.ng-zona-unidad');
    const chkActivo = card.querySelector('.ng-zona-activo');
    const btnDel = card.querySelector('.ng-btn-eliminar-zona');
    const namePreview = card.querySelector('.ng-zona-name-preview');

    const actualizarCardHeader = () => {
      if (namePreview) namePreview.textContent = inpDist?.value?.trim() || 'Nuevo Distrito';
      renderizarMockZonasChips();
    };

    inpDist?.addEventListener('input', actualizarCardHeader);
    inpMin?.addEventListener('input', renderizarMockZonasChips);
    inpMax?.addEventListener('input', renderizarMockZonasChips);
    chkActivo?.addEventListener('change', renderizarMockZonasChips);

    // Inicializar wiSelect en el selector de unidad de tiempo
    if (selUni) {
      selUni.addEventListener('change', renderizarMockZonasChips);
      if (typeof wiSelect === 'function') {
        wiSelect(selUni, {
          placeholder: 'Unidad...',
          onChange: () => {
            renderizarMockZonasChips();
          }
        });
      }
    }

    btnDel?.addEventListener('click', () => {
      const nom = inpDist?.value || 'este distrito';
      wiConfirmar('¿Eliminar distrito?', `Se eliminará "${nom}" de la cobertura.`, () => {
        card.remove();
        renderizarMockZonasChips();
        Notificacion('Distrito removido', 'info', 1800);
      });
    });
  }

  function crearZonaCardHTML(z, idx) {
    const id = z.id || (z.distrito ? z.distrito.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `zona-${Date.now()}`);
    const uni = z.unidad || 'min';
    return `
      <div class="ng-zona-card" data-zona-idx="${idx}" data-zona-id="${id}">
        <div class="ng-zona-card-header">
          <div class="ng-zona-title-wrap">
            <span class="ng-zona-bullet"><i class="fa-solid fa-location-dot"></i></span>
            <strong class="ng-zona-name-preview">${z.distrito || 'Nuevo Distrito'}</strong>
          </div>
          <div class="ng-zona-header-actions">
            <label class="ng-switch-wrap" title="Activar/Desactivar cobertura en este distrito">
              <input type="checkbox" class="ng-zona-activo" ${z.activo !== false ? 'checked' : ''} />
              <span class="ng-switch-slider"></span>
            </label>
            <button type="button" class="ng-btn-eliminar-zona" title="Eliminar este distrito">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>

        <div class="ng-grid-zona-inputs">
          <div class="ng-field">
            <label class="ng-label">Nombre del Distrito</label>
            <input type="text" class="ng-input ng-zona-distrito" value="${z.distrito || ''}" placeholder="Ej: Distrito" />
          </div>

          <div class="ng-field">
            <label class="ng-label">Unidad de Tiempo</label>
            <select class="ng-input ng-select ng-zona-unidad">
              <option value="min" ${uni === 'min' ? 'selected' : ''}>min (Minutos)</option>
              <option value="hrs" ${uni === 'hrs' || uni === 'horas' ? 'selected' : ''}>hrs (Horas)</option>
              <option value="dias" ${uni === 'dias' || uni === 'días' ? 'selected' : ''}>días (Días)</option>
            </select>
          </div>

          <div class="ng-field">
            <label class="ng-label">Tiempo Mínimo</label>
            <input type="number" min="1" max="180" class="ng-input ng-zona-min" value="${z.tiempoMin ?? 8}" placeholder="8" />
          </div>

          <div class="ng-field">
            <label class="ng-label">Tiempo Máximo</label>
            <input type="number" min="1" max="180" class="ng-input ng-zona-max" value="${z.tiempoMax ?? 18}" placeholder="18" />
          </div>
        </div>
      </div>
    `;
  }

  function cargarZonas(zonasArray) {
    if (!contenedorZonas) return;
    if (Array.isArray(zonasArray) && zonasArray.length > 0) {
      contenedorZonas.innerHTML = zonasArray.map((z, idx) => crearZonaCardHTML(z, idx)).join('');
    }
    contenedorZonas.querySelectorAll('.ng-zona-card').forEach(card => {
      enlazarEventosZonaCard(card);
    });
    renderizarMockZonasChips();
  }

  function recolectarZonasDOM() {
    if (!contenedorZonas) return [];
    return Array.from(contenedorZonas.querySelectorAll('.ng-zona-card')).map((card, idx) => {
      const distrito = card.querySelector('.ng-zona-distrito')?.value?.trim() || '';
      const id = card.dataset.zonaId || (distrito ? distrito.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `zona-${idx}`);
      const unidad = card.querySelector('.ng-zona-unidad')?.value?.trim() || 'min';
      return {
        id,
        distrito,
        tiempoMin: parseInt(card.querySelector('.ng-zona-min')?.value || '8', 10),
        tiempoMax: parseInt(card.querySelector('.ng-zona-max')?.value || '18', 10),
        unidad,
        tag: '',
        activo: Boolean(card.querySelector('.ng-zona-activo')?.checked)
      };
    }).filter(z => z.distrito);
  }

  btnAgregarZona?.addEventListener('click', () => {
    if (!contenedorZonas) return;
    const idx = contenedorZonas.querySelectorAll('.ng-zona-card').length;
    const nuevaZona = {
      id: `zona-${Date.now()}`,
      distrito: '',
      tiempoMin: 8,
      tiempoMax: 18,
      unidad: 'min',
      tag: '',
      activo: true
    };
    const div = document.createElement('div');
    div.innerHTML = crearZonaCardHTML(nuevaZona, idx);
    const card = div.firstElementChild;
    contenedorZonas.appendChild(card);
    enlazarEventosZonaCard(card);
    card.querySelector('.ng-zona-distrito')?.focus();
    renderizarMockZonasChips();
    Notificacion('Distrito añadido al borrador', 'info', 1800);
  });

  // Inicializar listeners en los cards que ya vinieron renderizados por SSR
  if (contenedorZonas) {
    contenedorZonas.querySelectorAll('.ng-zona-card').forEach(card => {
      enlazarEventosZonaCard(card);
    });
    renderizarMockZonasChips();
  }

  function refrescarTodosLosPreviews() {
    sincronizarSeoEs();
    sincronizarSeoEn();
    sincronizarHeroEs();
    sincronizarHeroEn();
    sincronizarInfoEs();
    sincronizarInfoEn();
    actualizarAnosTrayectoriaUI();
    renderizarMockZonasChips();
  }

  // ── ASISTENTE DE GOOGLE MAPS ──
  btnBuscarGoogleMaps?.addEventListener('click', () => {
    const dir = inputDireccion?.value?.trim() || '';
    if (dir) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dir)}`, '_blank');
    } else {
      window.open('https://maps.google.com', '_blank');
    }
  });

  btnProbarMapsUrl?.addEventListener('click', () => {
    const url = inputMapsUrl?.value?.trim() || 'https://maps.google.com';
    window.open(url, '_blank');
  });

  // ── GESTIÓN INTELIGENTE DE PAÍS, TELÉFONO Y WHATSAPP ──
  let instSelectPais = null;

  function soloDigitos(str = '') {
    return String(str || '').replace(/\D/g, '');
  }

  function getPaisCodeActual() {
    const opt = selectPais?.options[selectPais.selectedIndex];
    return opt?.dataset?.code || '51';
  }

  function formatearTelefonoVisible(numeroRaw, code = getPaisCodeActual()) {
    const raw = String(numeroRaw || '').trim();
    if (!raw) return '';
    let digitos = soloDigitos(raw);
    if (!digitos) return '';

    if (code && digitos.startsWith(code) && digitos.length > code.length) {
      digitos = digitos.slice(code.length);
    }

    if (code === '51' && digitos.length === 9) {
      return `+51 ${digitos.slice(0, 3)} ${digitos.slice(3, 6)} ${digitos.slice(6)}`;
    }

    if (digitos.length >= 6) {
      const partes = digitos.match(/.{1,3}/g) || [digitos];
      return `+${code} ${partes.join(' ')}`;
    }

    return `+${code} ${digitos}`;
  }

  function generarWhatsappApi(numeroRaw, code = getPaisCodeActual()) {
    const raw = String(numeroRaw || '').trim();
    if (!raw) return '';
    let digitos = soloDigitos(raw);
    if (!digitos) return '';

    if (code && !digitos.startsWith(code)) {
      digitos = `${code}${digitos}`;
    }
    return digitos;
  }

  function sincronizarTelefonosDesdePais(code) {
    if (inputTelefono?.value) {
      inputTelefono.value = formatearTelefonoVisible(inputTelefono.value, code);
    }
    if (inputWhatsapp?.value) {
      inputWhatsapp.value = generarWhatsappApi(inputWhatsapp.value, code);
      if (hintWhatsappFormato) hintWhatsappFormato.textContent = inputWhatsapp.value;
    }
  }

  // Inicializar wiSelect para el País
  if (selectPais) {
    instSelectPais = wiSelect(selectPais, {
      placeholder: 'Selecciona país...',
      onChange: (val) => {
        const opt = selectPais.querySelector(`option[value="${val}"]`);
        const code = opt?.dataset.code || '51';
        if (hintPaisCodigo) hintPaisCodigo.textContent = `${opt?.text.slice(0, 2) || '🇵🇪'} +${code}`;
        sincronizarTelefonosDesdePais(code);
      }
    });
  }

  // Listener para Teléfono Visible: actualiza WhatsApp en vivo y formatea en blur
  inputTelefono?.addEventListener('input', () => {
    const code = getPaisCodeActual();
    const wsApi = generarWhatsappApi(inputTelefono.value, code);
    if (inputWhatsapp) {
      inputWhatsapp.value = wsApi;
    }
    if (hintWhatsappFormato) {
      hintWhatsappFormato.textContent = wsApi || '';
    }
  });

  inputTelefono?.addEventListener('blur', () => {
    const code = getPaisCodeActual();
    if (inputTelefono.value.trim()) {
      inputTelefono.value = formatearTelefonoVisible(inputTelefono.value, code);
    }
  });

  // Listener para WhatsApp API: limpia espacios de inmediato y sincroniza Teléfono
  inputWhatsapp?.addEventListener('input', () => {
    const limpio = soloDigitos(inputWhatsapp.value);
    inputWhatsapp.value = limpio;
    if (hintWhatsappFormato) {
      hintWhatsappFormato.textContent = limpio || '';
    }
    if (limpio && inputTelefono && !inputTelefono.value) {
      inputTelefono.value = formatearTelefonoVisible(limpio, getPaisCodeActual());
    }
  });

  // ── GESTIÓN DE ENLACES COMPLETOS Y HANDLES DE REDES SOCIALES ──
  function limpiarHandleRed(valor, tipo) {
    if (!valor) return '';
    let limpio = String(valor).trim();
    if (!limpio) return '';

    if (tipo === 'web') {
      return limpio
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .replace(/\/+$/, '');
    }

    if (tipo === 'whatsapp') {
      limpio = limpio
        .replace(/^https?:\/\/(www\.)?wa\.me\//i, '')
        .replace(/^https?:\/\/(www\.)?whatsapp\.com\/channel\//i, 'channel/')
        .replace(/^https?:\/\/(www\.)?chat\.whatsapp\.com\//i, 'chat/');
      return limpio;
    }

    limpio = limpio
      .replace(/^https?:\/\/(www\.)?youtube\.com\/(@|c\/|user\/)?/i, '')
      .replace(/^https?:\/\/(www\.)?youtu\.be\//i, '')
      .replace(/^https?:\/\/(www\.)?facebook\.com\//i, '')
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
      .replace(/^https?:\/\/(www\.)?tiktok\.com\/(@)?/i, '')
      .replace(/^https?:\/\/(www\.)?linkedin\.com\/(in\/|company\/)?/i, '')
      .replace(/^https?:\/\/(www\.)?(twitter\.com|x\.com)\//i, '');

    limpio = limpio.replace(/^@+/, '');
    limpio = limpio.replace(/^\/+|\/+$/g, '');

    return limpio;
  }

  function armarUrlRed(valor, tipo) {
    if (!valor) return '';
    const raw = String(valor).trim();
    if (!raw) return '';

    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return raw;
    }

    const user = limpiarHandleRed(raw, tipo);
    if (!user) return '';

    switch (tipo) {
      case 'youtube':
        return `https://youtube.com/@${user}`;
      case 'facebook':
        return `https://facebook.com/${user}`;
      case 'instagram':
        return `https://instagram.com/${user}`;
      case 'tiktok':
        return `https://tiktok.com/@${user}`;
      case 'linkedin':
        return `https://linkedin.com/in/${user}`;
      case 'twitter':
        return `https://x.com/${user}`;
      case 'web':
        return `https://${user}`;
      case 'whatsapp':
        if (user.startsWith('channel/') || user.startsWith('chat/')) {
          return `https://whatsapp.com/${user}`;
        }
        return `https://wa.me/${user.replace(/\D/g, '')}`;
      default:
        return raw;
    }
  }

  // ── GESTIÓN DINÁMICA DE REDES SOCIALES (AGREGAR / QUITAR / REORDENAR / PROBAR) ──
  let instSelectAgregarRed = null;

  function refrescarSelectAgregarRed() {
    if (!selectAgregarRed) return;

    const disponibles = CATALOGO_REDES.filter(red => {
      const row = document.querySelector(`.ng-red-row[data-red-id="${red.id}"]`);
      return row && row.classList.contains('ng-red-hidden');
    });

    selectAgregarRed.innerHTML = '';
    const optDefecto = document.createElement('option');
    optDefecto.value = '';
    optDefecto.disabled = true;
    optDefecto.selected = true;
    optDefecto.textContent = disponibles.length > 0 ? '+ Agregar red social...' : '✓ Todas las redes agregadas';
    selectAgregarRed.appendChild(optDefecto);

    disponibles.forEach(red => {
      const opt = document.createElement('option');
      opt.value = red.id;
      opt.textContent = `+ ${red.nombre}`;
      selectAgregarRed.appendChild(opt);
    });

    if (btnAgregarRed) {
      btnAgregarRed.disabled = disponibles.length === 0;
    }
  }

  function agregarRedPorId(redId) {
    if (!redId) return;
    const row = document.querySelector(`.ng-red-row[data-red-id="${redId}"]`);
    const input = MAPA_INPUTS_REDES[redId];
    const contenedor = document.getElementById('ngListaRedesOrdenables');

    if (row) {
      row.classList.remove('ng-red-hidden');
      if (contenedor) contenedor.appendChild(row);
      if (input) {
        input.focus();
        const cfg = CATALOGO_REDES.find(r => r.id === redId);
        if (cfg && !input.value) {
          input.placeholder = cfg.formato;
        }
      }
      actualizarBadgesRedes();
      refrescarSelectAgregarRed();
      Notificacion(`Red agregada a la lista`, 'success', 2000);
    }
  }

  function quitarRedPorId(redId) {
    if (!redId) return;
    const row = document.querySelector(`.ng-red-row[data-red-id="${redId}"]`);
    const input = MAPA_INPUTS_REDES[redId];

    if (row) {
      if (input) input.value = '';
      row.classList.add('ng-red-hidden');
      actualizarBadgesRedes();
      refrescarSelectAgregarRed();
      Notificacion(`Red quitada de la lista`, 'info', 1800);
    }
  }

  // Inicializar wiSelect para el selector de agregar red
  if (selectAgregarRed) {
    if (wiSelect) {
      instSelectAgregarRed = wiSelect(selectAgregarRed, {
        placeholder: '+ Agregar red social...',
        onChange: (val) => {
          if (val) {
            agregarRedPorId(val);
            selectAgregarRed.value = '';
          }
        }
      });
    }

    selectAgregarRed.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val) {
        agregarRedPorId(val);
        e.target.value = '';
      }
    });

    btnAgregarRed?.addEventListener('click', () => {
      const val = selectAgregarRed.value;
      if (val) {
        agregarRedPorId(val);
        selectAgregarRed.value = '';
      } else {
        Notificacion('Selecciona una red para agregar', 'info', 1800);
      }
    });
  }

  function reordenarFilasRedes(ordenIds = []) {
    const contenedor = document.getElementById('ngListaRedesOrdenables');
    if (!contenedor || !Array.isArray(ordenIds) || ordenIds.length === 0) return;

    const filas = Array.from(contenedor.querySelectorAll('.ng-red-row'));
    const mapaFilas = new Map();
    filas.forEach(f => mapaFilas.set(f.dataset.redId, f));

    ordenIds.forEach(id => {
      const f = mapaFilas.get(id);
      if (f) {
        contenedor.appendChild(f);
        mapaFilas.delete(id);
      }
    });

    mapaFilas.forEach(f => contenedor.appendChild(f));
  }

  function actualizarBadgesRedes() {
    const mapaInputs = [
      { id: 'youtube', input: inputRedYoutube },
      { id: 'facebook', input: inputRedFacebook },
      { id: 'instagram', input: inputRedInstagram },
      { id: 'tiktok', input: inputRedTiktok },
      { id: 'whatsapp', input: inputRedCanalWhatsapp },
      { id: 'web', input: inputRedWeb },
      { id: 'linkedin', input: inputRedLinkedin },
      { id: 'twitter', input: inputRedTwitter }
    ];

    mapaInputs.forEach(({ id, input }) => {
      const badge = document.querySelector(`[data-badge-red="${id}"]`);
      if (!badge) return;
      const tieneValor = Boolean(input?.value?.trim());
      if (tieneValor) {
        badge.textContent = 'Visible';
        badge.className = 'ng-red-badge active';
      } else {
        badge.textContent = 'Sin enlace';
        badge.className = 'ng-red-badge inactive';
      }
    });
  }

  function inicializarEventosRedes() {
    const contenedor = document.getElementById('ngListaRedesOrdenables');
    if (!contenedor) return;

    // 1. Botón Probar Enlace
    contenedor.querySelectorAll('.ng-btn-probar-red').forEach(btn => {
      btn.addEventListener('click', () => {
        const redId = btn.dataset.redId;
        const el = MAPA_INPUTS_REDES[redId];
        const val = el?.value?.trim() || '';
        if (!val) {
          Notificacion('Ingresa un enlace o usuario para probar esta red', 'info', 2000);
          return;
        }
        const targetUrl = armarUrlRed(val, redId);
        if (targetUrl) {
          window.open(targetUrl, '_blank');
        }
      });
    });

    // 2. Botón Portal Oficial (Buscar o conseguir usuario)
    contenedor.querySelectorAll('.ng-btn-portal-red').forEach(btn => {
      btn.addEventListener('click', () => {
        const redId = btn.dataset.redId;
        const config = CATALOGO_REDES.find(r => r.id === redId);
        if (config?.portal) {
          window.open(config.portal, '_blank');
        }
      });
    });

    // 3. Botón Quitar Red de la Lista
    contenedor.querySelectorAll('.ng-btn-quitar-red').forEach(btn => {
      btn.addEventListener('click', () => {
        const redId = btn.dataset.redId;
        quitarRedPorId(redId);
      });
    });

    // 4. Botones de Subir y Bajar (▲ / ▼)
    contenedor.addEventListener('click', (e) => {
      const btn = e.target.closest('.ng-btn-move');
      if (!btn) return;
      const row = btn.closest('.ng-red-row');
      if (!row) return;

      const dir = btn.dataset.dir;
      if (dir === 'up') {
        const prev = row.previousElementSibling;
        if (prev && prev.classList.contains('ng-red-row')) {
          contenedor.insertBefore(row, prev);
        }
      } else if (dir === 'down') {
        const next = row.nextElementSibling;
        if (next && next.classList.contains('ng-red-row')) {
          contenedor.insertBefore(next, row);
        }
      }
    });

    // 5. Drag & Drop HTML5 para Desktop
    let draggedRow = null;

    contenedor.querySelectorAll('.ng-red-row').forEach(row => {
      row.addEventListener('dragstart', (e) => {
        draggedRow = row;
        row.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', row.dataset.redId || '');
      });

      row.addEventListener('dragend', () => {
        if (draggedRow) draggedRow.classList.remove('is-dragging');
        draggedRow = null;
        contenedor.querySelectorAll('.ng-red-row').forEach(r => r.classList.remove('is-drag-over'));
      });

      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (!draggedRow || draggedRow === row) return;
        row.classList.add('is-drag-over');
      });

      row.addEventListener('dragleave', () => {
        row.classList.remove('is-drag-over');
      });

      row.addEventListener('drop', (e) => {
        e.preventDefault();
        row.classList.remove('is-drag-over');
        if (!draggedRow || draggedRow === row) return;

        const rect = row.getBoundingClientRect();
        const middleY = rect.top + rect.height / 2;
        if (e.clientY < middleY) {
          contenedor.insertBefore(draggedRow, row);
        } else {
          contenedor.insertBefore(draggedRow, row.nextSibling);
        }
      });
    });

    // 6. Touch Drag nativo en el handle para Celulares
    let touchRow = null;

    contenedor.querySelectorAll('.ng-red-drag-handle').forEach(handle => {
      handle.addEventListener('touchstart', (e) => {
        const row = handle.closest('.ng-red-row');
        if (!row) return;
        touchRow = row;
        row.classList.add('is-dragging');
      }, { passive: true });

      handle.addEventListener('touchmove', (e) => {
        if (!touchRow) return;
        const touch = e.touches[0];
        const targetElem = document.elementFromPoint(touch.clientX, touch.clientY);
        const targetRow = targetElem?.closest('.ng-red-row');
        if (targetRow && targetRow !== touchRow && targetRow.parentElement === contenedor) {
          const rect = targetRow.getBoundingClientRect();
          const middleY = rect.top + rect.height / 2;
          if (touch.clientY < middleY) {
            contenedor.insertBefore(touchRow, targetRow);
          } else {
            contenedor.insertBefore(touchRow, targetRow.nextSibling);
          }
        }
      }, { passive: true });

      handle.addEventListener('touchend', () => {
        if (touchRow) {
          touchRow.classList.remove('is-dragging');
          touchRow = null;
        }
      });
    });

    // Escuchar cambios en los inputs para actualizar badges
    Object.values(MAPA_INPUTS_REDES).forEach(inp => {
      inp?.addEventListener('input', actualizarBadgesRedes);
    });
  }

  inicializarEventosRedes();

  // ── CARGAR DATOS EN FORMULARIO ──
  function cargarFormulario(cfg) {
    if (!cfg) return;
    const actual = obtenerDatosNegocio();

    const getTxt = (v, lang = 'es') => {
      if (v == null) return '';
      if (typeof v === 'object') {
        return v[lang] || (lang === 'en' ? (v.es || '') : (v.en || '')) || '';
      }
      return String(v);
    };

    // Identidad Global
    if (inputEspecialista) inputEspecialista.value = cfg.identidad?.especialista || '';
    if (inputColegiatura) inputColegiatura.value = String(cfg.identidad?.colegiatura || '').replace(/[^0-9]/g, '') || '49425';
    if (inputTitulo) inputTitulo.value = getTxt(cfg.identidad?.titulo, 'es');
    if (inputGrado) inputGrado.value = getTxt(cfg.identidad?.grado, 'es');

    const fechaLanz = cfg.identidad?.lanzamientoFecha || '';
    if (inputLanzamiento) inputLanzamiento.value = fechaLanz;
    actualizarAnosTrayectoriaUI();

    const foto = cfg.identidad?.imagenSede || '';
    const logo = cfg.identidad?.logo || '';
    const logoFull = cfg.identidad?.logoFull || '';
    if (inputImagenSede) inputImagenSede.value = foto ? formatearUrlCompleta(foto) : '';
    if (inputLogo) inputLogo.value = logo ? formatearUrlCompleta(logo) : '';
    if (inputLogoFull) inputLogoFull.value = logoFull ? formatearUrlCompleta(logoFull) : '';
    if (imgHeroPreview) imgHeroPreview.src = foto || '';
    if (imgLogoPreview) imgLogoPreview.src = logo || '';
    if (imgLogoFullPreview) imgLogoFullPreview.src = logoFull || '';
    if (btnLinkHero) btnLinkHero.href = foto ? formatearUrlCompleta(foto) : '#';
    if (btnLinkLogo) btnLinkLogo.href = logo ? formatearUrlCompleta(logo) : '#';
    if (btnLinkLogoFull) btnLinkLogoFull.href = logoFull ? formatearUrlCompleta(logoFull) : '#';

    // Identidad (ES / EN)
    if (inputNombre) inputNombre.value = getTxt(cfg.identidad?.nombre, 'es');
    if (inputNombreCorto) inputNombreCorto.value = getTxt(cfg.identidad?.nombreCorto, 'es');
    if (inputEnfoques) inputEnfoques.value = getTxt(cfg.identidad?.enfoques, 'es');

    if (inputNombreEn) inputNombreEn.value = getTxt(cfg.identidad?.nombre, 'en') || cfg.identidad?.nombreEn || '';
    if (inputNombreCortoEn) inputNombreCortoEn.value = getTxt(cfg.identidad?.nombreCorto, 'en') || cfg.identidad?.nombreCortoEn || '';
    if (inputEnfoquesEn) inputEnfoquesEn.value = getTxt(cfg.identidad?.enfoques, 'en') || cfg.identidad?.enfoquesEn || '';

    // Titular Principal H1 & Hero Web (ES / EN)
    if (inputHeroTituloEs) inputHeroTituloEs.value = getTxt(cfg.hero?.titulo, 'es');
    if (inputHeroDescEs) inputHeroDescEs.value = getTxt(cfg.hero?.subtitulo, 'es');
    if (inputHeroTituloEn) inputHeroTituloEn.value = getTxt(cfg.hero?.titulo, 'en') || cfg.hero?.tituloEn || '';
    if (inputHeroDescEn) inputHeroDescEn.value = getTxt(cfg.hero?.subtitulo, 'en') || cfg.hero?.subtituloEn || '';
    const heroFoto = cfg.hero?.imgHero || actual.hero?.imgHero || '/imgwii/Psychologist_listening_in_therapy.jpeg';
    if (inputHeroImg) inputHeroImg.value = formatearUrlCompleta(heroFoto);

    // Más Traducciones y Textos Destacados (Card 3)
    if (inputBioEs) inputBioEs.value = getTxt(cfg.identidad?.bio, 'es');
    if (inputBioEn) inputBioEn.value = getTxt(cfg.identidad?.bio, 'en');

    if (inputWsMensajeEs) inputWsMensajeEs.value = getTxt(cfg.contacto?.whatsappMensaje, 'es');
    if (inputWsMensajeEn) inputWsMensajeEn.value = getTxt(cfg.contacto?.whatsappMensaje, 'en');

    if (inputHeroBadgeEs) inputHeroBadgeEs.value = getTxt(cfg.hero?.badge, 'es');
    if (inputHeroBadgeEn) inputHeroBadgeEn.value = getTxt(cfg.hero?.badge, 'en');

    if (inputHeroDriverTituloEs) inputHeroDriverTituloEs.value = getTxt(cfg.hero?.driverTitulo, 'es');
    if (inputHeroDriverTituloEn) inputHeroDriverTituloEn.value = getTxt(cfg.hero?.driverTitulo, 'en');

    if (inputHeroDriverDescEs) inputHeroDriverDescEs.value = getTxt(cfg.hero?.driverDesc, 'es');
    if (inputHeroDriverDescEn) inputHeroDriverDescEn.value = getTxt(cfg.hero?.driverDesc, 'en');

    // Métricas
    if (inputMetricaClientes) inputMetricaClientes.value = cfg.metricas?.clientes || '';
    if (inputMetricaBalanza) inputMetricaBalanza.value = cfg.metricas?.balanza || '';

    // Canales de Atención Directa
    const paisVal = cfg.contacto?.pais || cfg.ubicacion?.pais || 'PE';
    if (selectPais) {
      selectPais.value = paisVal;
      if (instSelectPais && typeof instSelectPais.setValue === 'function') {
        instSelectPais.setValue(paisVal);
      }
      const opt = selectPais.querySelector(`option[value="${paisVal}"]`);
      if (hintPaisCodigo) {
        hintPaisCodigo.textContent = `${opt?.text.slice(0, 2) || '🇵🇪'} +${opt?.dataset.code || '51'}`;
      }
    }

    if (inputTelefono) inputTelefono.value = cfg.contacto?.celular || cfg.contacto?.telefono || '';
    if (inputTelefonoFijo) inputTelefonoFijo.value = cfg.contacto?.telefonoFijo || '';
    if (inputTelefonoSecundario) inputTelefonoSecundario.value = cfg.contacto?.celularSecundario || cfg.contacto?.telefonoSecundario || '';
    if (inputCelularPersonal) inputCelularPersonal.value = cfg.contacto?.celularPersonal || '';
    if (inputWhatsapp) {
      inputWhatsapp.value = soloDigitos(cfg.contacto?.whatsapp || '');
      if (hintWhatsappFormato) hintWhatsappFormato.textContent = inputWhatsapp.value || '';
    }
    if (inputEmail) inputEmail.value = cfg.contacto?.email || cfg.contacto?.correo || '';
    if (inputCorreoPacientes) inputCorreoPacientes.value = cfg.contacto?.correoPacientes || cfg.contacto?.emailPacientes || '';

    if (ngHorarioSemanaAbre) ngHorarioSemanaAbre.value = cfg.horarios?.semana?.abre || '';
    if (ngHorarioSemanaCierra) ngHorarioSemanaCierra.value = cfg.horarios?.semana?.cierra || '';
    if (ngHorarioSabadoAbre) ngHorarioSabadoAbre.value = cfg.horarios?.sabado?.abre || '';
    if (ngHorarioSabadoCierra) ngHorarioSabadoCierra.value = cfg.horarios?.sabado?.cierra || '';

    // Ubicación
    if (inputDireccion) inputDireccion.value = cfg.ubicacion?.direccion || '';
    if (inputReferencia) inputReferencia.value = cfg.ubicacion?.referencia || '';
    if (inputDistrito) inputDistrito.value = cfg.ubicacion?.distrito || '';
    if (inputCiudad) inputCiudad.value = cfg.ubicacion?.ciudad || '';
    if (inputMapsUrl) inputMapsUrl.value = cfg.ubicacion?.mapsUrl || '';
    if (inputLat) inputLat.value = cfg.ubicacion?.coordenadas?.lat ?? '';
    if (inputLng) inputLng.value = cfg.ubicacion?.coordenadas?.lng ?? '';

    // Sedes
    const sedes = (Array.isArray(cfg.sedes) && cfg.sedes.length > 0) ? cfg.sedes : (actual.sedes || []);
    const sedePresencial = sedes[0] || {};
    const sedeVirtual = sedes[1] || {};

    if (ngSedeVesTagEs) ngSedeVesTagEs.value = getTxt(sedePresencial.tag, 'es');
    if (ngSedeVesAtencionEs) ngSedeVesAtencionEs.value = getTxt(sedePresencial.atencion, 'es');
    if (ngSedeVesTagEn) ngSedeVesTagEn.value = getTxt(sedePresencial.tag, 'en') || sedePresencial.tagEn || '';
    if (ngSedeVesAtencionEn) ngSedeVesAtencionEn.value = getTxt(sedePresencial.atencion, 'en') || sedePresencial.atencionEn || '';

    if (ngSedeVirtualTagEs) ngSedeVirtualTagEs.value = getTxt(sedeVirtual.tag, 'es');
    if (ngSedeVirtualAtencionEs) ngSedeVirtualAtencionEs.value = getTxt(sedeVirtual.atencion, 'es');
    if (ngSedeVirtualTagEn) ngSedeVirtualTagEn.value = getTxt(sedeVirtual.tag, 'en') || sedeVirtual.tagEn || '';
    if (ngSedeVirtualAtencionEn) ngSedeVirtualAtencionEn.value = getTxt(sedeVirtual.atencion, 'en') || sedeVirtual.atencionEn || '';

    // Redes & Canales
    const r = cfg.redes || {};
    if (inputRedYoutube) {
      inputRedYoutube.value = r.youtube || (r.youtubeUser ? armarUrlRed(r.youtubeUser, 'youtube') : '');
    }
    if (inputRedFacebook) {
      inputRedFacebook.value = r.facebook || (r.facebookUser ? armarUrlRed(r.facebookUser, 'facebook') : '');
    }
    if (inputRedInstagram) {
      inputRedInstagram.value = r.instagram || (r.instagramUser ? armarUrlRed(r.instagramUser, 'instagram') : '');
    }
    if (inputRedTiktok) {
      inputRedTiktok.value = r.tiktok || (r.tiktokUser ? armarUrlRed(r.tiktokUser, 'tiktok') : '');
    }
    if (inputRedCanalWhatsapp) {
      inputRedCanalWhatsapp.value = r.canalWhatsapp || (r.canalWhatsappUser ? armarUrlRed(r.canalWhatsappUser, 'whatsapp') : (r.whatsapp || ''));
    }
    if (inputRedWeb) {
      inputRedWeb.value = r.web || (r.webUser ? armarUrlRed(r.webUser, 'web') : (r.webOficial || ''));
    }
    if (inputRedLinkedin) {
      inputRedLinkedin.value = r.linkedin || (r.linkedinUser ? armarUrlRed(r.linkedinUser, 'linkedin') : '');
    }
    if (inputRedTwitter) {
      inputRedTwitter.value = r.twitter || (r.twitterUser ? armarUrlRed(r.twitterUser, 'twitter') : '');
    }

    // Ocultar redes vacías para que se listen en el selector de agregar
    CATALOGO_REDES.forEach(red => {
      const row = document.querySelector(`.ng-red-row[data-red-id="${red.id}"]`);
      const inp = MAPA_INPUTS_REDES[red.id];
      if (row) {
        if (inp && inp.value.trim()) {
          row.classList.remove('ng-red-hidden');
        } else {
          row.classList.add('ng-red-hidden');
        }
      }
    });

    // Reordenar filas visuales según redesOrden
    const ordenGuardado = Array.isArray(cfg.redesOrden) && cfg.redesOrden.length > 0
      ? cfg.redesOrden
      : getCanalesRedes().map(c => c.id);
    reordenarFilasRedes(ordenGuardado);

    // Actualizar badges y selector de agregar red
    actualizarBadgesRedes();
    refrescarSelectAgregarRed();

    // SEO
    if (inputSeoTituloEs) inputSeoTituloEs.value = getTxt(cfg.seo?.titulo, 'es');
    if (inputSeoDescEs) inputSeoDescEs.value = getTxt(cfg.seo?.descripcion, 'es');
    if (inputSeoKeywordsEs) {
      const kw = cfg.seo?.keywords?.es || (Array.isArray(cfg.seo?.keywords) ? cfg.seo.keywords : []);
      inputSeoKeywordsEs.value = Array.isArray(kw) ? kw.join(', ') : (kw || '');
    }
    if (inputSeoImgEs) {
      const seoImgVal = (typeof cfg.seo?.imagen === 'object' ? cfg.seo.imagen?.url : cfg.seo?.imagen) || (typeof actual.seo?.imagen === 'object' ? actual.seo.imagen?.url : actual.seo?.imagen) || '/imgwii/Sofia.jpg';
      inputSeoImgEs.value = formatearUrlCompleta(seoImgVal);
      if (ngSerpImgEs && seoImgVal) ngSerpImgEs.src = seoImgVal;
    }

    if (inputSeoTituloEn) inputSeoTituloEn.value = getTxt(cfg.seo?.titulo, 'en');
    if (inputSeoDescEn) inputSeoDescEn.value = getTxt(cfg.seo?.descripcion, 'en');
    if (inputSeoKeywordsEn) {
      const kw = cfg.seo?.keywords?.en || [];
      inputSeoKeywordsEn.value = Array.isArray(kw) ? kw.join(', ') : (kw || '');
    }
    if (inputSeoImgEn) {
      const seoImgVal = (typeof cfg.seo?.imagen === 'object' ? cfg.seo.imagen?.url : cfg.seo?.imagen) || (typeof actual.seo?.imagen === 'object' ? actual.seo.imagen?.url : actual.seo?.imagen) || '/imgwii/Sofia.jpg';
      inputSeoImgEn.value = formatearUrlCompleta(seoImgVal);
      if (ngSerpImgEn && seoImgVal) ngSerpImgEn.src = seoImgVal;
    }

    // Zonas & Cobertura
    if (cfg.zonas && Array.isArray(cfg.zonas)) {
      cargarZonas(cfg.zonas);
    } else if (actual.zonas && Array.isArray(actual.zonas)) {
      cargarZonas(actual.zonas);
    }

    // Inicializar todos los previews interactivos
    refrescarTodosLosPreviews();
  }

  // Helper seguro para obtener el UID del usuario activo de wiSmile / Firebase Auth
  function obtenerUserIdActual() {
    try {
      if (typeof getUsuarioActivo === 'function') {
        const u = getUsuarioActivo();
        if (u?.userId) return u.userId;
      }
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('wiSmile') : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        const smile = parsed?.value || parsed;
        return smile?.uid || smile?.id || smile?.userId || '';
      }
    } catch (e) {}
    return '';
  }

  // ── RECOLECTAR DATOS DE LA UI ──
  function recolectarDatos() {
    const kwEs = (inputSeoKeywordsEs?.value || '').split(',').map(s => s.trim()).filter(Boolean);
    const kwEn = (inputSeoKeywordsEn?.value || '').split(',').map(s => s.trim()).filter(Boolean);
    const actual = obtenerDatosNegocio();
    const paisSel = selectPais?.value || 'PE';
    const optPais = selectPais?.options[selectPais.selectedIndex];
    const paisCodeSel = optPais?.dataset?.code || '51';
    const rawTel = (inputTelefono?.value || '').trim();
    const rawWs = soloDigitos(inputWhatsapp?.value || '');
    const idnt = actual.identidad || {};
    const cont = actual.contacto || {};
    const ubic = actual.ubicacion || {};

    const userActivoId = obtenerUserIdActual();
    const ahoraSec = Math.floor(Date.now() / 1000);
    const timestampActual = { seconds: ahoraSec, nanoseconds: 0 };
    const creadoPrevio = actual.creado || timestampActual;

    return {
      id: actual.id || 'principal',
      principal: true,
      userId: userActivoId || actual.userId || '',
      creado: creadoPrevio,
      actualizado: timestampActual,
      moneda: actual.moneda || 'PEN',
      langPrincipal: actual.langPrincipal || 'es',
      langs: actual.langs || ['es', 'en'],
      idiomaPrincipal: actual.langPrincipal || 'es',
      idiomas: actual.langs || ['es', 'en'],
      titulo: actual.titulo || (typeof idnt.nombre === 'object' ? idnt.nombre?.es : idnt.nombre) || '',
      subtitulo: actual.subtitulo || (typeof idnt.cargo === 'object' ? idnt.cargo?.es : idnt.cargo) || '',
      hero: {
        ...(actual.hero || {}),
        titulo: {
          es: inputHeroTituloEs?.value?.trim() || (typeof actual.hero?.titulo === 'object' ? actual.hero?.titulo?.es : actual.hero?.titulo) || '¿Sientes que el estrés o la ansiedad te sobrepasan?',
          en: inputHeroTituloEn?.value?.trim() || (typeof actual.hero?.titulo === 'object' ? actual.hero?.titulo?.en : actual.hero?.tituloEn) || 'Do you feel overwhelmed by stress or anxiety?'
        },
        subtitulo: {
          es: inputHeroDescEs?.value?.trim() || (typeof actual.hero?.subtitulo === 'object' ? actual.hero?.subtitulo?.es : actual.hero?.subtitulo) || 'Un espacio clínico seguro, confidencial y sin juicios...',
          en: inputHeroDescEn?.value?.trim() || (typeof actual.hero?.subtitulo === 'object' ? actual.hero?.subtitulo?.en : actual.hero?.subtituloEn) || 'A safe, confidential and non-judgmental clinical space...'
        },
        badge: {
          es: inputHeroBadgeEs?.value?.trim() || (typeof actual.hero?.badge === 'object' ? actual.hero?.badge?.es : actual.hero?.badge) || 'ESPACIO SEGURO Y CONFIDENCIAL',
          en: inputHeroBadgeEn?.value?.trim() || (typeof actual.hero?.badge === 'object' ? actual.hero?.badge?.en : actual.hero?.badgeEn) || 'SAFE & CONFIDENTIAL SPACE'
        },
        imgHero: normalizarUrlParaGuardar(inputHeroImg?.value?.trim()) || actual.hero?.imgHero || '/imgwii/Psychologist_listening_in_therapy.jpeg',
        driverTitulo: {
          es: inputHeroDriverTituloEs?.value?.trim() || (typeof actual.hero?.driverTitulo === 'object' ? actual.hero?.driverTitulo?.es : actual.hero?.driverTitulo) || 'Primera Consulta y Evaluación',
          en: inputHeroDriverTituloEn?.value?.trim() || (typeof actual.hero?.driverTitulo === 'object' ? actual.hero?.driverTitulo?.en : actual.hero?.driverTituloEn) || 'First Consultation & Clinical Assessment'
        },
        driverDesc: {
          es: inputHeroDriverDescEs?.value?.trim() || (typeof actual.hero?.driverDesc === 'object' ? actual.hero?.driverDesc?.es : actual.hero?.driverDesc) || 'Sesión individual de 50 min presencial u online',
          en: inputHeroDriverDescEn?.value?.trim() || (typeof actual.hero?.driverDesc === 'object' ? actual.hero?.driverDesc?.en : actual.hero?.driverDescEn) || '50 min individual session in-person or online'
        },
        driverPrecio: Number(actual.hero?.driverPrecio ?? 85.00)
      },

      identidad: {
        ...idnt,
        nombre: {
          es: inputNombre?.value?.trim() || (typeof idnt.nombre === 'object' ? idnt.nombre?.es : idnt.nombre) || 'Consultorio Psicológico América',
          en: inputNombreEn?.value?.trim() || (typeof idnt.nombre === 'object' ? idnt.nombre?.en : idnt.nombreEn) || 'America Psychological Clinic'
        },
        nombreCorto: {
          es: inputNombreCorto?.value?.trim() || (typeof idnt.nombreCorto === 'object' ? idnt.nombreCorto?.es : idnt.nombreCorto) || 'Psicología América',
          en: inputNombreCortoEn?.value?.trim() || (typeof idnt.nombreCorto === 'object' ? idnt.nombreCorto?.en : idnt.nombreCortoEn) || 'America Psychology'
        },
        especialista: inputEspecialista?.value?.trim() || idnt.especialista || idnt.nombre || 'Lic. Sofia Reynaga Pachas',
        colegiatura: String(inputColegiatura?.value?.trim() || idnt.colegiatura || '49425').replace(/[^0-9]/g, '') || '49425',
        cargo: inputTitulo?.value?.trim() || (typeof idnt.titulo === 'object' ? idnt.titulo?.es : idnt.titulo) || 'Licenciada en Psicología',
        titulo: {
          es: inputTitulo?.value?.trim() || (typeof idnt.titulo === 'object' ? idnt.titulo?.es : idnt.titulo) || 'Licenciada en Psicología',
          en: (typeof idnt.titulo === 'object' ? idnt.titulo?.en : idnt.tituloEn) || 'Licensed Psychologist'
        },
        grado: {
          es: inputGrado?.value?.trim() || (typeof idnt.grado === 'object' ? idnt.grado?.es : idnt.grado) || 'Maestrista en Psicología Clínica',
          en: (typeof idnt.grado === 'object' ? idnt.grado?.en : idnt.gradoEn) || "Master's in Clinical Psychology"
        },
        enfoques: {
          es: inputEnfoques?.value?.trim() || (typeof idnt.enfoques === 'object' ? idnt.enfoques?.es : idnt.enfoques) || '',
          en: inputEnfoquesEn?.value?.trim() || (typeof idnt.enfoques === 'object' ? idnt.enfoques?.en : idnt.enfoquesEn) || ''
        },
        bio: {
          es: inputBioEs?.value?.trim() ?? (typeof idnt.bio === 'object' ? idnt.bio?.es : idnt.bio) ?? '',
          en: inputBioEn?.value?.trim() ?? (typeof idnt.bio === 'object' ? idnt.bio?.en : idnt.bioEn) ?? ''
        },
        lanzamientoFecha: inputLanzamiento?.value || idnt.lanzamientoFecha || '2020-03-15',
        logo: normalizarUrlParaGuardar(inputLogo?.value?.trim()) || idnt.logo || '/imgwii/logo.webp',
        logoFull: normalizarUrlParaGuardar(inputLogoFull?.value?.trim()) || idnt.logoFull || '/imgwii/logo_full.webp',
        imagenSede: normalizarUrlParaGuardar(inputImagenSede?.value?.trim()) || idnt.imagenSede || '/imgwii/hero/psicologa-sofia-reynaga.webp'
      },

      contacto: {
        pais: paisSel,
        paisCode: paisCodeSel,
        celular: rawTel || cont.celular || cont.telefono || '+51 960 332 958',
        celularSecundario: inputTelefonoSecundario?.value?.trim() || cont.celularSecundario || cont.telefonoSecundario || '+51 960 332 958',
        celularPersonal: (inputCelularPersonal?.value !== undefined ? inputCelularPersonal.value.trim() : (cont.celularPersonal || '')),
        telefono: rawTel || cont.celular || cont.telefono || '+51 960 332 958',
        telefonoFijo: inputTelefonoFijo?.value?.trim() || cont.telefonoFijo || '',
        whatsapp: rawWs || (rawTel ? `${paisCodeSel}${soloDigitos(rawTel)}` : (cont.whatsapp || '51960332958')),
        email: (inputEmail?.value || '').trim() || cont.email || 'reynaga.psychologist@gmail.com',
        correo: (inputEmail?.value || '').trim() || cont.email || 'reynaga.psychologist@gmail.com',
        correoPacientes: (inputCorreoPacientes?.value !== undefined ? inputCorreoPacientes.value.trim() : (cont.correoPacientes || '')),
        emailPacientes: (inputCorreoPacientes?.value !== undefined ? inputCorreoPacientes.value.trim() : (cont.correoPacientes || '')),
        horario: {
          es: (typeof cont.horario === 'object' ? cont.horario?.es : cont.horario) || 'Lunes a Sábado: 8:00 a.m. a 8:00 p.m. (Previa Cita)',
          en: (typeof cont.horario === 'object' ? cont.horario?.en : cont.horarioEn) || 'Monday to Saturday: 8:00 a.m. to 8:00 p.m. (By Appointment)'
        }
      },

      horarios: {
        semana: {
          abre: ngHorarioSemanaAbre?.value || actual.horarios?.semana?.abre || '08:00',
          cierra: ngHorarioSemanaCierra?.value || actual.horarios?.semana?.cierra || '20:00'
        },
        sabado: {
          abre: ngHorarioSabadoAbre?.value || actual.horarios?.sabado?.abre || '08:00',
          cierra: ngHorarioSabadoCierra?.value || actual.horarios?.sabado?.cierra || '20:00'
        }
      },

      ubicacion: {
        direccion: inputDireccion?.value?.trim() || ubic.direccion || 'Av. 3 de Octubre con Micaela Bastidas - RUTA B / Sector 3, Grupo 26, Lote comercial 7',
        referencia: inputReferencia?.value?.trim() || ubic.referencia || 'Frente a Paradero 3 de Octubre',
        distrito: inputDistrito?.value?.trim() || ubic.distrito || 'Villa El Salvador',
        ciudad: inputCiudad?.value?.trim() || ubic.ciudad || 'Lima',
        pais: paisSel,
        codigoPostal: ubic.codigoPostal || '15834',
        mapsUrl: inputMapsUrl?.value?.trim() || ubic.mapsUrl || 'https://maps.app.goo.gl/g7MFEUi8B6xpSjpn8',
        coordenadas: {
          lat: parseFloat(inputLat?.value) || ubic.coordenadas?.lat || -12.2084,
          lng: parseFloat(inputLng?.value) || ubic.coordenadas?.lng || -76.9387
        }
      },

      sedes: [
        {
          id: 'lima',
          modalidad: 'Presencial',
          nombre: {
            es: 'Consultorio Presencial en Lima',
            en: 'In-Person Clinic in Lima'
          },
          direccion: inputDireccion?.value?.trim() || actual.sedes?.[0]?.direccion || ubic.direccion || 'Av. 3 de Octubre con Micaela Bastidas - RUTA B (Sede Principal Lima)',
          referencia: inputReferencia?.value?.trim() || actual.sedes?.[0]?.referencia || ubic.referencia || 'Frente a Paradero 3 de Octubre',
          distrito: inputDistrito?.value?.trim() || actual.sedes?.[0]?.distrito || 'Lima',
          ciudad: inputCiudad?.value?.trim() || actual.sedes?.[0]?.ciudad || 'Lima',
          pais: paisSel,
          mapsUrl: inputMapsUrl?.value?.trim() || actual.sedes?.[0]?.mapsUrl || ubic.mapsUrl || 'https://maps.app.goo.gl/g7MFEUi8B6xpSjpn8',
          atencion: {
            es: ngSedeVesAtencionEs?.value?.trim() || (typeof actual.sedes?.[0]?.atencion === 'object' ? actual.sedes?.[0]?.atencion?.es : actual.sedes?.[0]?.atencion) || 'Lunes a Sábado: 8:00 a.m. a 8:00 p.m. (Previa Cita)',
            en: ngSedeVesAtencionEn?.value?.trim() || (typeof actual.sedes?.[0]?.atencion === 'object' ? actual.sedes?.[0]?.atencion?.en : '') || 'Monday to Saturday: 8:00 a.m. to 8:00 p.m. (By Appointment)'
          },
          tag: {
            es: ngSedeVesTagEs?.value?.trim() || (typeof actual.sedes?.[0]?.tag === 'object' ? actual.sedes?.[0]?.tag?.es : actual.sedes?.[0]?.tag) || 'Sede Presencial Lima',
            en: ngSedeVesTagEn?.value?.trim() || (typeof actual.sedes?.[0]?.tag === 'object' ? actual.sedes?.[0]?.tag?.en : '') || 'In-Person Lima Clinic'
          },
          coordenadas: {
            lat: parseFloat(inputLat?.value) || actual.sedes?.[0]?.coordenadas?.lat || ubic.coordenadas?.lat || -12.2084,
            lng: parseFloat(inputLng?.value) || actual.sedes?.[0]?.coordenadas?.lng || ubic.coordenadas?.lng || -76.9387
          },
          activo: true
        },
        {
          id: 'online',
          modalidad: 'Virtual',
          nombre: {
            es: 'Atención Psicológica Online (Google Meet & Teams)',
            en: 'Online Psychological Consultation (Google Meet & Teams)'
          },
          distrito: 'Online',
          direccion: 'Sesión Virtual HD vía Google Meet o Microsoft Teams',
          referencia: 'Enlace privado y confidencial enviado tras confirmación de cita',
          atencion: {
            es: ngSedeVirtualAtencionEs?.value?.trim() || (typeof actual.sedes?.[1]?.atencion === 'object' ? actual.sedes?.[1]?.atencion?.es : actual.sedes?.[1]?.atencion) || 'Horarios Flexibles (Lunes a Sábado de 8:00 a.m. a 9:00 p.m.)',
            en: ngSedeVirtualAtencionEn?.value?.trim() || (typeof actual.sedes?.[1]?.atencion === 'object' ? actual.sedes?.[1]?.atencion?.en : '') || 'Flexible Hours (Monday to Saturday 8:00 a.m. to 9:00 p.m.)'
          },
          tag: {
            es: ngSedeVirtualTagEs?.value?.trim() || (typeof actual.sedes?.[1]?.tag === 'object' ? actual.sedes?.[1]?.tag?.es : actual.sedes?.[1]?.tag) || 'Google Meet & Teams',
            en: ngSedeVirtualTagEn?.value?.trim() || (typeof actual.sedes?.[1]?.tag === 'object' ? actual.sedes?.[1]?.tag?.en : '') || 'Google Meet & Teams'
          },
          coordenadas: { lat: 0, lng: 0 },
          activo: true
        }
      ],

      zonas: recolectarZonasDOM(),

      metricas: {
        clientes: inputMetricaClientes?.value?.trim() || actual.metricas?.clientes || '+450',
        pacientes: inputMetricaClientes?.value?.trim() || actual.metricas?.pacientes || '+450',
        balanza: inputMetricaBalanza?.value?.trim() || actual.metricas?.balanza || '100%',
        confidencialidad: inputMetricaBalanza?.value?.trim() || actual.metricas?.confidencialidad || '100%',
        years: inputLanzamiento?.value ? `${calcularAnosTrayectoria(inputLanzamiento.value)}+` : (actual.metricas?.years || '+6 Años'),
        colegiatura: actual.metricas?.colegiatura || actual.identidad?.colegiatura || 'C.Ps.P. 49425',
        dias: actual.metricas?.dias || '365'
      },

      redes: (() => {
        const getVal = (redId, input) => {
          const row = document.querySelector(`.ng-red-row[data-red-id="${redId}"]`);
          if (row && row.classList.contains('ng-red-hidden')) return '';
          return input?.value?.trim() || '';
        };

        const ytVal = getVal('youtube', inputRedYoutube);
        const fbVal = getVal('facebook', inputRedFacebook);
        const igVal = getVal('instagram', inputRedInstagram);
        const tkVal = getVal('tiktok', inputRedTiktok);
        const wsVal = getVal('whatsapp', inputRedCanalWhatsapp);
        const wbVal = getVal('web', inputRedWeb);
        const inVal = getVal('linkedin', inputRedLinkedin);
        const twVal = getVal('twitter', inputRedTwitter);

        return {
          youtube: ytVal ? armarUrlRed(ytVal, 'youtube') : '',
          youtubeUser: ytVal ? limpiarHandleRed(ytVal, 'youtube') : '',
          facebook: fbVal ? armarUrlRed(fbVal, 'facebook') : '',
          facebookUser: fbVal ? limpiarHandleRed(fbVal, 'facebook') : '',
          instagram: igVal ? armarUrlRed(igVal, 'instagram') : '',
          instagramUser: igVal ? limpiarHandleRed(igVal, 'instagram') : '',
          tiktok: tkVal ? armarUrlRed(tkVal, 'tiktok') : '',
          tiktokUser: tkVal ? limpiarHandleRed(tkVal, 'tiktok') : '',
          canalWhatsapp: wsVal ? armarUrlRed(wsVal, 'whatsapp') : '',
          canalWhatsappUser: wsVal ? limpiarHandleRed(wsVal, 'whatsapp') : '',
          web: wbVal ? armarUrlRed(wbVal, 'web') : '',
          webUser: wbVal ? limpiarHandleRed(wbVal, 'web') : '',
          linkedin: inVal ? armarUrlRed(inVal, 'linkedin') : '',
          linkedinUser: inVal ? limpiarHandleRed(inVal, 'linkedin') : '',
          twitter: twVal ? armarUrlRed(twVal, 'twitter') : '',
          twitterUser: twVal ? limpiarHandleRed(twVal, 'twitter') : ''
        };
      })(),

      redesOrden: (() => {
        const contenedorRedes = document.getElementById('ngListaRedesOrdenables');
        return contenedorRedes
          ? Array.from(contenedorRedes.querySelectorAll('.ng-red-row:not(.ng-red-hidden)')).map(r => r.dataset.redId).filter(Boolean)
          : ['whatsapp', 'linkedin', 'web', 'instagram', 'facebook', 'tiktok', 'youtube', 'twitter'];
      })(),

      seo: {
        titulo: {
          es: inputSeoTituloEs?.value?.trim() || actual.seo?.titulo?.es || '',
          en: inputSeoTituloEn?.value?.trim() || actual.seo?.titulo?.en || ''
        },
        descripcion: {
          es: inputSeoDescEs?.value?.trim() || actual.seo?.descripcion?.es || '',
          en: inputSeoDescEn?.value?.trim() || actual.seo?.descripcion?.en || ''
        },
        keywords: {
          es: kwEs.length > 0 ? kwEs : (actual.seo?.keywords?.es || []),
          en: kwEn.length > 0 ? kwEn : (actual.seo?.keywords?.en || [])
        },
        imagen: normalizarUrlParaGuardar(inputSeoImgEs?.value?.trim() || inputSeoImgEn?.value?.trim()) || actual.seo?.imagen || '/imgwii/Sofia.jpg',
        imagenAlt: actual.seo?.imagenAlt || { es: idnt.nombre, en: idnt.nombreEn || idnt.nombre },
        imagenCaption: actual.seo?.imagenCaption || { es: idnt.razonSocial, en: idnt.razonSocial },
        descripcionNegocio: actual.seo?.descripcionNegocio || { es: idnt.bio, en: idnt.bioEn || idnt.bio },
        rangoPrecios: actual.seo?.rangoPrecios || 'S/ 55 - S/ 230',
        currenciesAccepted: actual.seo?.currenciesAccepted || actual.moneda || 'PEN',
        paymentAccepted: actual.seo?.paymentAccepted || ["Cash", "Credit Card", "Debit Card", "Yape", "Plin"],
        faqs: Array.isArray(actual.seo?.faqs) && actual.seo.faqs.length > 0 ? actual.seo.faqs : [],
        schema: actual.seo?.schema || {
          tipo: ["LocalBusiness", "MedicalBusiness", "HealthAndBeautyBusiness"],
          especialidades: [],
          descripcionCorta: {
            es: inputHeroDescEs?.value?.trim() || "",
            en: inputHeroDescEn?.value?.trim() || ""
          }
        },
        audiencia: actual.seo?.audiencia || { es: [], en: [] },
        intencion: actual.seo?.intencion || { es: "", en: "" }
      }
    };
  }

  // ── 8. EVENTO GUARDAR EN BASE DE DATOS Y LOCALSTORAGE ──
  btnGuardarNegocio?.addEventListener('click', async () => {
    if (isSaving) return;
    isSaving = true;

    const spin = wiSpin ? wiSpin(btnGuardarNegocio) : null;
    btnGuardarNegocio.disabled = true;

    try {
      const payload = recolectarDatos();
      guardarDatosNegocio(payload);
    } catch (err) {
      console.error(err);
      Notificacion('Error al guardar datos: ' + (err?.message || err), 'danger', 4000);
    } finally {
      btnGuardarNegocio.disabled = false;
      wiSpin(btnGuardarNegocio, false);
      if (spin && typeof spin.stop === 'function') spin.stop();
      isSaving = false;
    }
  });

  // Atajo Ctrl+S gestionado centralizadamente por el router universal de personal.js

  // ── INICIALIZACIÓN CON DATOS OFICIALES ──
  const datosIniciales = obtenerDatosNegocio();
  cargarFormulario(datosIniciales);

  // Sincronización en segundo plano con Firestore
  sincronizarDesdeFirestore().then(fresco => {
    if (fresco) cargarFormulario(fresco);
  });
}

// Inicialización automática
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarNegocio);
} else {
  inicializarNegocio();
}

document.addEventListener('astro:page-load', inicializarNegocio);
