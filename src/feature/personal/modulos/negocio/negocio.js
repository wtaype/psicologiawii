// src/feature/personal/modulos/negocio/negocio.js
// Controlador Frontend Autónomo del Módulo Mi Negocio (Solgas Surquillo)
// 100% JS Nativo · Cero TypeScript · Local-First · Integración con @widev

import { Notificacion, wiSpin, wiAtajo, wiConfirmar, adrm, savels, getls, removels, Saludar } from '@widev';
import {
  obtenerDatosNegocio,
  guardarDatosNegocio,
  calcularAnosTrayectoria,
  sincronizarDesdeFirestore
} from './dataNegocio.js';
import { solicitarActualizacionWeb } from '../../../../actualizar.js';

export function inicializarNegocio() {
  const panelNegocio = document.getElementById('panel-negocio');
  if (!panelNegocio || panelNegocio.dataset.negocioInit === 'true') return;
  panelNegocio.dataset.negocioInit = 'true';

  const DRAFT_KEY = 'negocio_borrador_timestamp';
  let isSaving = false;
  let draftTimer = null;

  // Elementos de la UI
  const btnGuardarNegocio = document.getElementById('btnGuardarNegocio');
  const ngTabsBar = document.getElementById('ngTabsBar');
  const ngZonasContainer = document.getElementById('ngZonasContainer');
  const btnAgregarZona = document.getElementById('btnAgregarZona');
  const ngBadgeTrayectoria = document.getElementById('ngBadgeTrayectoria');
  const ngYearsText = document.getElementById('ngYearsText');

  // Inputs de Identidad
  const inputNombre = document.getElementById('ngInputNombre');
  const inputNombreCorto = document.getElementById('ngInputNombreCorto');
  const inputRazonSocial = document.getElementById('ngInputRazonSocial');
  const inputRuc = document.getElementById('ngInputRuc');
  const inputOsinergmin = document.getElementById('ngInputOsinergmin');
  const inputMarcaRespaldo = document.getElementById('ngInputMarcaRespaldo');
  const inputLanzamiento = document.getElementById('ngInputLanzamiento');
  const inputLogo = document.getElementById('ngInputLogo');
  const inputImagenSede = document.getElementById('ngInputImagenSede');
  const imgLogoPreview = document.getElementById('ngImgLogoPreview');
  const imgHeroPreview = document.getElementById('ngImgHeroPreview');

  // Inputs de Contacto
  const inputTelefono = document.getElementById('ngInputTelefono');
  const inputTelefonoFijo = document.getElementById('ngInputTelefonoFijo');
  const inputWhatsapp = document.getElementById('ngInputWhatsapp');
  const inputEmail = document.getElementById('ngInputEmail');
  const inputWhatsappMensaje = document.getElementById('ngInputWhatsappMensaje');
  const inputHorario = document.getElementById('ngInputHorario');
  const inputHorarioEn = document.getElementById('ngInputHorarioEn');
  const hintTelefonoFormato = document.getElementById('hintTelefonoFormato');
  const hintWhatsappFormato = document.getElementById('hintWhatsappFormato');
  const btnRestaurarMensajeWs = document.getElementById('btnRestaurarMensajeWs');

  // Inputs de Ubicación
  const inputDireccion = document.getElementById('ngInputDireccion');
  const inputDistrito = document.getElementById('ngInputDistrito');
  const inputCiudad = document.getElementById('ngInputCiudad');
  const inputMapsUrl = document.getElementById('ngInputMapsUrl');
  const inputLat = document.getElementById('ngInputLat');
  const inputLng = document.getElementById('ngInputLng');
  const btnBuscarGoogleMaps = document.getElementById('btnBuscarGoogleMaps');
  const btnProbarMapsUrl = document.getElementById('btnProbarMapsUrl');
  const btnAutogenerarMapsUrl = document.getElementById('btnAutogenerarMapsUrl');

  // Inputs de Métricas y Redes
  const inputMetricaClientes = document.getElementById('ngInputMetricaClientes');
  const inputMetricaBalanza = document.getElementById('ngInputMetricaBalanza');
  const inputMetricaDias = document.getElementById('ngInputMetricaDias');
  const inputRedFacebook = document.getElementById('ngInputRedFacebook');
  const inputRedInstagram = document.getElementById('ngInputRedInstagram');
  const inputRedTiktok = document.getElementById('ngInputRedTiktok');

  // Inputs de SEO Dinámico
  const inputSeoTituloEs = document.getElementById('ngInputSeoTituloEs');
  const inputSeoDescEs = document.getElementById('ngInputSeoDescEs');
  const inputSeoKeywordsEs = document.getElementById('ngInputSeoKeywordsEs');
  const inputSeoTituloEn = document.getElementById('ngInputSeoTituloEn');
  const inputSeoDescEn = document.getElementById('ngInputSeoDescEn');
  const inputSeoKeywordsEn = document.getElementById('ngInputSeoKeywordsEn');

  let currentZonas = [];

  // 1. Conmutación de Pestañas con adrm() de widev
  ngTabsBar?.addEventListener('click', (e) => {
    const btn = e.target.closest('.ng-tab-btn');
    if (!btn) return;
    const tabName = btn.getAttribute('data-tab');
    if (!tabName) return;

    adrm(btn, 'active');
    document.querySelectorAll('.ng-tab-content').forEach(p => {
      p.classList.toggle('active', p.id === `ngTab-${tabName}`);
    });
  });

  // 2. Cálculo en tiempo real de años de trayectoria con datepicker
  inputLanzamiento?.addEventListener('input', () => {
    const val = inputLanzamiento.value;
    const years = calcularAnosTrayectoria(val);
    if (ngYearsText) ngYearsText.textContent = `${years} años`;
    autoGuardarBorrador();
  });

  // 3. Previsualizaciones en vivo de Logo y Sede
  inputLogo?.addEventListener('input', () => {
    if (imgLogoPreview) imgLogoPreview.src = inputLogo.value || '/imgwii/logo.webp';
    autoGuardarBorrador();
  });

  inputImagenSede?.addEventListener('input', () => {
    if (imgHeroPreview) imgHeroPreview.src = inputImagenSede.value || '/imgwii/hero.webp';
    autoGuardarBorrador();
  });

  // 3.0. Normalizador Inteligente de Celular y WhatsApp Perú (9 dígitos)
  function normalizarTelefonoPeru(val) {
    const digitos = String(val || '').replace(/\D/g, '');
    
    // Si tiene 9 dígitos y empieza con 9 (ej. 936369384)
    if (digitos.length === 9 && digitos.startsWith('9')) {
      return {
        esCelular9: true,
        celular9: digitos,
        whatsappLimpio: `51${digitos}`,
        visible: `+51 ${digitos.slice(0, 3)} ${digitos.slice(3, 6)} ${digitos.slice(6)}`
      };
    }

    // Si tiene 11 dígitos y empieza con 519 (ej. 51936369384)
    if (digitos.length === 11 && digitos.startsWith('519')) {
      const cel9 = digitos.slice(2);
      return {
        esCelular9: true,
        celular9: cel9,
        whatsappLimpio: digitos,
        visible: `+51 ${cel9.slice(0, 3)} ${cel9.slice(3, 6)} ${cel9.slice(6)}`
      };
    }

    return {
      esCelular9: false,
      celular9: digitos,
      whatsappLimpio: digitos ? (digitos.startsWith('51') ? digitos : `51${digitos}`) : '',
      visible: String(val || '').trim()
    };
  }

  function actualizarHintTelefono() {
    const val = inputTelefono?.value?.trim() || '';
    if (!hintTelefonoFormato) return;
    if (!val) {
      hintTelefonoFormato.textContent = 'Ingresa 9 dígitos de celular o con prefijo +51';
      hintTelefonoFormato.style.color = 'var(--muted)';
      return;
    }
    const info = normalizarTelefonoPeru(val);
    if (info.esCelular9) {
      hintTelefonoFormato.textContent = `✓ Formato oficial: ${info.visible} (Celular Perú)`;
      hintTelefonoFormato.style.color = '#10b981';
    } else {
      hintTelefonoFormato.textContent = `✓ Número registrado: ${info.visible}`;
      hintTelefonoFormato.style.color = 'var(--muted)';
    }
  }

  function actualizarHintWhatsapp() {
    const val = inputWhatsapp?.value?.trim() || '';
    if (!hintWhatsappFormato) return;
    if (!val) {
      hintWhatsappFormato.textContent = 'Ingresa 9 dígitos de WhatsApp';
      hintWhatsappFormato.style.color = 'var(--muted)';
      return;
    }
    const info = normalizarTelefonoPeru(val);
    if (info.esCelular9) {
      hintWhatsappFormato.textContent = `✓ Enlace directo: wa.me/${info.whatsappLimpio}`;
      hintWhatsappFormato.style.color = '#10b981';
    } else {
      hintWhatsappFormato.textContent = `✓ Enlace directo: wa.me/${info.whatsappLimpio || val}`;
      hintWhatsappFormato.style.color = '#10b981';
    }
  }

  inputTelefono?.addEventListener('input', () => {
    actualizarHintTelefono();
    autoGuardarBorrador();
  });

  inputTelefono?.addEventListener('blur', () => {
    const val = inputTelefono.value.trim();
    const info = normalizarTelefonoPeru(val);
    if (info.esCelular9) {
      inputTelefono.value = info.visible;
      actualizarHintTelefono();
      autoGuardarBorrador();
    }
  });

  inputWhatsapp?.addEventListener('input', () => {
    actualizarHintWhatsapp();
    autoGuardarBorrador();
  });

  inputWhatsapp?.addEventListener('blur', () => {
    const val = inputWhatsapp.value.trim();
    const info = normalizarTelefonoPeru(val);
    if (info.esCelular9) {
      inputWhatsapp.value = info.whatsappLimpio;
      actualizarHintWhatsapp();
      autoGuardarBorrador();
    }
  });

  // Generador de Saludo Dinámico para WhatsApp
  btnRestaurarMensajeWs?.addEventListener('click', () => {
    const saludo = Saludar().replace(/,/g, '').trim();
    const nombreNegocio = inputNombre?.value?.trim() || '';
    const msg = `¡${saludo}${nombreNegocio ? ' ' + nombreNegocio : ''}! He visto en su página que tienen el *producto* y deseo consultar precio y pedir un balón de gas para entrega a domicilio.`;
    if (inputWhatsappMensaje) {
      inputWhatsappMensaje.value = msg;
      autoGuardarBorrador();
      Notificacion(`Mensaje generado con "${saludo}"`, 'success', 2500);
    }
  });

  // 3.1. Acciones y Utilidades de Google Maps
  btnBuscarGoogleMaps?.addEventListener('click', () => {
    const dir = inputDireccion?.value?.trim() || '';
    const dist = inputDistrito?.value?.trim() || '';
    const nom = inputNombre?.value?.trim() || '';
    const partes = [nom, dir, dist].filter(Boolean);
    const query = partes.length > 0 ? partes.join(', ') : 'Lima, Peru';
    const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    window.open(mapsSearchUrl, '_blank', 'noopener,noreferrer');
    Notificacion('Google Maps abierto en nueva pestaña. Copia el vínculo de compartir y pégalo aquí.', 'info', 4000);
  });

  btnProbarMapsUrl?.addEventListener('click', () => {
    let url = inputMapsUrl?.value?.trim();
    if (!url) {
      Notificacion('Ingresa o genera un enlace de Google Maps primero', 'warning', 3000);
      inputMapsUrl?.focus();
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
      inputMapsUrl.value = url;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  });

  btnAutogenerarMapsUrl?.addEventListener('click', () => {
    const lat = parseFloat(inputLat?.value);
    const lng = parseFloat(inputLng?.value);
    let autoUrl = '';

    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      autoUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    } else {
      const dir = inputDireccion?.value?.trim() || inputDistrito?.value?.trim() || 'Lima';
      autoUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dir)}`;
    }

    if (inputMapsUrl) {
      inputMapsUrl.value = autoUrl;
      autoGuardarBorrador();
      Notificacion('Enlace de Google Maps generado automáticamente', 'success', 2500);
    }
  });

  // 4. Renderizado de la lista de Zonas de Cobertura
  function renderZonas() {
    if (!ngZonasContainer) return;
    if (currentZonas.length === 0) {
      ngZonasContainer.innerHTML = `
        <div style="text-align:center; padding: 24px; color: var(--muted); font-size: var(--fz_s4);">
          No hay zonas registradas. Presiona <strong>Agregar Zona</strong> para añadir cobertura.
        </div>
      `;
      return;
    }

    ngZonasContainer.innerHTML = currentZonas.map((z, idx) => `
      <div class="ng-zona-row ${z.activo ? '' : 'inactive'}" data-index="${idx}">
        <input type="text" class="ng-input input-zona-distrito" placeholder="Distrito (ej: Surquillo)" value="${z.distrito || ''}" />
        <input type="number" class="ng-input input-zona-min" placeholder="Min (12)" value="${z.tiempoMin || 10}" title="Tiempo mínimo" />
        <input type="number" class="ng-input input-zona-max" placeholder="Max (18)" value="${z.tiempoMax || 20}" title="Tiempo máximo" />
        <select class="ng-input input-zona-unidad">
          <option value="min" ${z.unidad === 'min' ? 'selected' : ''}>min</option>
          <option value="h" ${z.unidad === 'h' ? 'selected' : ''}>h</option>
        </select>
        <input type="text" class="ng-input input-zona-tag" placeholder="Tag (Sede Express / Ruta Directa)" value="${z.tag || ''}" />
        <label class="ng-switch" title="${z.activo ? 'Desactivar zona' : 'Activar zona'}">
          <input type="checkbox" class="input-zona-activo" ${z.activo ? 'checked' : ''} />
          <span class="ng-slider"></span>
        </label>
        <button type="button" class="ng-btn-icon-del btn-del-zona" title="Eliminar zona">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `).join('');
  }

  // 5. Delegación de eventos en la lista de Zonas (0 memory leaks)
  ngZonasContainer?.addEventListener('input', (e) => {
    const row = e.target.closest('.ng-zona-row');
    if (!row) return;
    const idx = parseInt(row.getAttribute('data-index') || '0', 10);
    const z = currentZonas[idx];
    if (!z) return;

    if (e.target.classList.contains('input-zona-distrito')) z.distrito = e.target.value.trim();
    if (e.target.classList.contains('input-zona-min')) z.tiempoMin = parseInt(e.target.value, 10) || 0;
    if (e.target.classList.contains('input-zona-max')) z.tiempoMax = parseInt(e.target.value, 10) || 0;
    if (e.target.classList.contains('input-zona-tag')) z.tag = e.target.value.trim();

    autoGuardarBorrador();
  });

  ngZonasContainer?.addEventListener('change', (e) => {
    const row = e.target.closest('.ng-zona-row');
    if (!row) return;
    const idx = parseInt(row.getAttribute('data-index') || '0', 10);
    const z = currentZonas[idx];
    if (!z) return;

    if (e.target.classList.contains('input-zona-unidad')) z.unidad = e.target.value;
    if (e.target.classList.contains('input-zona-activo')) {
      z.activo = e.target.checked;
      row.classList.toggle('inactive', !z.activo);
    }

    autoGuardarBorrador();
  });

  ngZonasContainer?.addEventListener('click', async (e) => {
    const btnDel = e.target.closest('.btn-del-zona');
    if (!btnDel) return;
    const row = btnDel.closest('.ng-zona-row');
    const idx = parseInt(row?.getAttribute('data-index') || '0', 10);
    const z = currentZonas[idx];

    const conf = await wiConfirmar(`¿Deseas remover la zona de cobertura "${z?.distrito || 'Seleccionada'}"?`, {
      titulo: 'Eliminar Zona',
      tipo: 'danger',
      siTexto: 'Sí, Eliminar'
    });

    if (conf) {
      currentZonas.splice(idx, 1);
      renderZonas();
      autoGuardarBorrador();
      Notificacion('Zona de cobertura eliminada', 'info', 2000);
    }
  });

  // Botón para agregar una nueva zona
  btnAgregarZona?.addEventListener('click', () => {
    const nuevaZona = {
      id: `zona_${Date.now()}`,
      distrito: "Nuevo Distrito",
      tiempoMin: 15,
      tiempoMax: 25,
      unidad: "min",
      tag: "Ruta Directa",
      activo: true
    };
    currentZonas.push(nuevaZona);
    renderZonas();
    autoGuardarBorrador();

    // Enfocar el input de la nueva zona
    setTimeout(() => {
      const inputs = ngZonasContainer?.querySelectorAll('.input-zona-distrito');
      if (inputs && inputs.length > 0) {
        inputs[inputs.length - 1].focus();
        inputs[inputs.length - 1].select();
      }
    }, 50);
  });

  // 6. Carga de Datos en el Formulario
  function cargarFormulario(cfg) {
    if (!cfg) return;

    if (inputNombre) inputNombre.value = cfg.identidad?.nombre || '';
    if (inputNombreCorto) inputNombreCorto.value = cfg.identidad?.nombreCorto || '';
    if (inputRazonSocial) inputRazonSocial.value = cfg.identidad?.razonSocial || '';
    if (inputRuc) inputRuc.value = cfg.identidad?.ruc || '';
    if (inputOsinergmin) inputOsinergmin.value = cfg.identidad?.registroOsinergmin || '';
    if (inputMarcaRespaldo) inputMarcaRespaldo.value = cfg.identidad?.marcaRespaldo || '';

    const fechaLanz = cfg.identidad?.lanzamientoFecha || '';
    if (inputLanzamiento) inputLanzamiento.value = fechaLanz;
    const years = calcularAnosTrayectoria(fechaLanz);
    if (ngYearsText) ngYearsText.textContent = years ? `${years} años` : '—';

    if (inputLogo) inputLogo.value = cfg.identidad?.logo || '';
    if (inputImagenSede) inputImagenSede.value = cfg.identidad?.imagenSede || '';
    if (imgLogoPreview) imgLogoPreview.src = cfg.identidad?.logo || '';
    if (imgHeroPreview) imgHeroPreview.src = cfg.identidad?.imagenSede || '';

    // Contacto
    if (inputTelefono) inputTelefono.value = cfg.contacto?.telefono || '';
    if (inputTelefonoFijo) inputTelefonoFijo.value = cfg.contacto?.telefonoFijo || '';
    if (inputWhatsapp) inputWhatsapp.value = cfg.contacto?.whatsapp || '';
    if (inputEmail) inputEmail.value = cfg.contacto?.email || '';

    // Mensaje de WhatsApp
    if (inputWhatsappMensaje) {
      inputWhatsappMensaje.value = cfg.contacto?.whatsappMensaje || '';
    }

    if (inputHorario) inputHorario.value = cfg.contacto?.horario || '';
    if (inputHorarioEn) inputHorarioEn.value = cfg.contacto?.horarioEn || '';

    actualizarHintTelefono();
    actualizarHintWhatsapp();

    // Ubicación
    if (inputDireccion) inputDireccion.value = cfg.ubicacion?.direccion || '';
    if (inputDistrito) inputDistrito.value = cfg.ubicacion?.distrito || '';
    if (inputCiudad) inputCiudad.value = cfg.ubicacion?.ciudad || '';
    if (inputMapsUrl) inputMapsUrl.value = cfg.ubicacion?.mapsUrl || '';
    if (inputLat) inputLat.value = cfg.ubicacion?.coordenadas?.lat || '';
    if (inputLng) inputLng.value = cfg.ubicacion?.coordenadas?.lng || '';

    // Métricas y Redes
    if (inputMetricaClientes) inputMetricaClientes.value = cfg.metricas?.clientes || '';
    if (inputMetricaBalanza) inputMetricaBalanza.value = cfg.metricas?.balanza || '';
    if (inputMetricaDias) inputMetricaDias.value = cfg.metricas?.dias || '';
    if (inputRedFacebook) inputRedFacebook.value = cfg.redes?.facebook || '';
    if (inputRedInstagram) inputRedInstagram.value = cfg.redes?.instagram || '';
    if (inputRedTiktok) inputRedTiktok.value = cfg.redes?.tiktok || '';

    // SEO Dinámico
    if (inputSeoTituloEs) inputSeoTituloEs.value = cfg.seo?.titulo?.es || '';
    if (inputSeoDescEs) inputSeoDescEs.value = cfg.seo?.descripcion?.es || '';
    if (inputSeoKeywordsEs) {
      const kw = cfg.seo?.keywords?.es;
      inputSeoKeywordsEs.value = Array.isArray(kw) ? kw.join(', ') : (kw || '');
    }
    if (inputSeoTituloEn) inputSeoTituloEn.value = cfg.seo?.titulo?.en || '';
    if (inputSeoDescEn) inputSeoDescEn.value = cfg.seo?.descripcion?.en || '';
    if (inputSeoKeywordsEn) {
      const kw = cfg.seo?.keywords?.en;
      inputSeoKeywordsEn.value = Array.isArray(kw) ? kw.join(', ') : (kw || '');
    }

    currentZonas = Array.isArray(cfg.zonas) ? JSON.parse(JSON.stringify(cfg.zonas)) : [];
    renderZonas();
  }

  // 7. Extraer Datos del Formulario
  function recolectarDatosFormulario() {
    return {
      identidad: {
        nombre: inputNombre?.value?.trim() || "",
        nombreCorto: inputNombreCorto?.value?.trim() || "",
        razonSocial: inputRazonSocial?.value?.trim() || "",
        ruc: inputRuc?.value?.trim() || "",
        registroOsinergmin: inputOsinergmin?.value?.trim() || "",
        marcaRespaldo: inputMarcaRespaldo?.value?.trim() || "",
        lanzamientoFecha: inputLanzamiento?.value || "",
        logo: inputLogo?.value?.trim() || "",
        imagenSede: inputImagenSede?.value?.trim() || ""
      },
      contacto: {
        telefono: (() => {
          const raw = inputTelefono?.value?.trim() || "";
          if (!raw) return "";
          const info = normalizarTelefonoPeru(raw);
          return info.esCelular9 ? info.visible : raw;
        })(),
        telefonoFijo: inputTelefonoFijo?.value?.trim() || "",
        telefonoLimpio: (() => {
          const raw = inputTelefono?.value?.trim() || "";
          if (!raw) return "";
          const info = normalizarTelefonoPeru(raw);
          return info.whatsappLimpio || raw.replace(/\D/g, '');
        })(),
        whatsapp: (() => {
          const raw = inputWhatsapp?.value?.trim() || "";
          if (!raw) return "";
          const info = normalizarTelefonoPeru(raw);
          return info.whatsappLimpio || raw.replace(/\D/g, '');
        })(),
        email: inputEmail?.value?.trim() || "",
        whatsappMensaje: inputWhatsappMensaje?.value?.trim() || "",
        horario: inputHorario?.value?.trim() || "",
        horarioEn: inputHorarioEn?.value?.trim() || ""
      },
      ubicacion: {
        direccion: inputDireccion?.value?.trim() || "",
        distrito: inputDistrito?.value?.trim() || "",
        ciudad: inputCiudad?.value?.trim() || "",
        mapsUrl: inputMapsUrl?.value?.trim() || "",
        coordenadas: {
          lat: parseFloat(inputLat?.value) || 0,
          lng: parseFloat(inputLng?.value) || 0
        }
      },
      zonas: currentZonas,
      metricas: {
        clientes: inputMetricaClientes?.value?.trim() || "",
        balanza: inputMetricaBalanza?.value?.trim() || "",
        years: calcularAnosTrayectoria(inputLanzamiento?.value),
        dias: inputMetricaDias?.value?.trim() || ""
      },
      redes: {
        facebook: inputRedFacebook?.value?.trim() || "",
        instagram: inputRedInstagram?.value?.trim() || "",
        tiktok: inputRedTiktok?.value?.trim() || ""
      },
      seo: {
        titulo: {
          es: inputSeoTituloEs?.value?.trim() || "",
          en: inputSeoTituloEn?.value?.trim() || ""
        },
        descripcion: {
          es: inputSeoDescEs?.value?.trim() || "",
          en: inputSeoDescEn?.value?.trim() || ""
        },
        keywords: {
          es: (inputSeoKeywordsEs?.value || "").split(',').map(s => s.trim()).filter(Boolean),
          en: (inputSeoKeywordsEn?.value || "").split(',').map(s => s.trim()).filter(Boolean)
        }
      }
    };
  }

  // 8. Auto-Guardado de Borrador Reactivo (Debounce 500ms)
  function autoGuardarBorrador() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
      const data = recolectarDatosFormulario();
      savels(DRAFT_KEY, { ...data, timestamp: Date.now() });
    }, 500);
  }

  // Escuchar cambios en todos los inputs del panel para auto-borrador
  panelNegocio?.querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('input', autoGuardarBorrador);
  });

  // 9. Guardar Cambios Centralizado con wiSpin y Notificacion
  function guardarCambiosNegocio() {
    if (isSaving) return;
    isSaving = true;

    if (btnGuardarNegocio) wiSpin(btnGuardarNegocio, true, 'Guardando...');

    const payload = recolectarDatosFormulario();
    guardarDatosNegocio(payload);
    removels(DRAFT_KEY);

    setTimeout(() => {
      if (btnGuardarNegocio) wiSpin(btnGuardarNegocio, false);
      Notificacion('Ficha guardada con éxito', 'success', 2500);
      isSaving = false;

      // Disparar re-cocinado en Cloudflare con debounce inteligente
      solicitarActualizacionWeb({ motivo: 'negocio' });
    }, 400);
  }

  btnGuardarNegocio?.addEventListener('click', guardarCambiosNegocio);

  // 10. Atajo de teclado Ctrl + S en todo el módulo
  panelNegocio?.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      e.stopPropagation();
      guardarCambiosNegocio();
    }
  });

  wiAtajo('ctrl+s', () => {
    if (panelNegocio?.classList.contains('active')) guardarCambiosNegocio();
  });

  // 11. Inicialización y Recuperación de Borrador
  const datosIniciales = obtenerDatosNegocio();
  const borrador = getls(DRAFT_KEY);

  if (borrador && borrador.identidad && (Date.now() - (borrador.timestamp || 0) < 86400000)) {
    cargarFormulario(borrador);
    Notificacion('Se restauraron cambios del borrador no guardado', 'info', 2500);
  } else {
    cargarFormulario(datosIniciales);
  }

  // Intentar sincronizar datos frescos en background desde Firestore si existe conexión
  sincronizarDesdeFirestore().then(remoto => {
    if (remoto && !borrador) {
      cargarFormulario(remoto);
    }
  });
}

// Auto-inicialización segura
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarNegocio);
} else {
  inicializarNegocio();
}
