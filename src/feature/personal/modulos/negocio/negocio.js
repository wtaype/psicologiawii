// src/feature/personal/modulos/negocio/negocio.js
// Controlador Frontend Autónomo del Módulo Ficha de Negocio & Especialista
// 100% JS Nativo · Cero TypeScript · Local-First · Integración con @widev y Firestore

import { Notificacion, wiSpin, wiAtajo, wiConfirmar, adrm, savels, getls, removels, Saludar } from '@widev';
import {
  obtenerDatosNegocio,
  guardarDatosNegocio,
  calcularAnosTrayectoria,
  sincronizarDesdeFirestore,
  obtenerSemillaLocal
} from './dataNegocio.js';
import { solicitarActualizacionWeb } from '../../../../actualizar.js';

export function inicializarNegocio() {
  const panelNegocio = document.getElementById('panel-negocio');
  if (!panelNegocio || panelNegocio.dataset.negocioInit === 'true') return;
  panelNegocio.dataset.negocioInit = 'true';

  const DRAFT_KEY = 'negocio_borrador_timestamp';
  let isSaving = false;
  let draftTimer = null;

  // Elementos principales de la cabecera
  const btnGuardarNegocio = document.getElementById('btnGuardarNegocio');
  const btnCargarSemilla = document.getElementById('btnCargarSemilla');
  const ngTabsBar = document.getElementById('ngTabsBar');
  const ngBadgeTrayectoria = document.getElementById('ngBadgeTrayectoria');
  const ngYearsText = document.getElementById('ngYearsText');

  // Inputs de Identidad
  const inputNombre = document.getElementById('ngInputNombre');
  const inputNombreCorto = document.getElementById('ngInputNombreCorto');
  const inputEspecialista = document.getElementById('ngInputEspecialista');
  const inputColegiatura = document.getElementById('ngInputColegiatura');
  const inputTitulo = document.getElementById('ngInputTitulo');
  const inputGrado = document.getElementById('ngInputGrado');
  const inputEnfoques = document.getElementById('ngInputEnfoques');
  const inputBio = document.getElementById('ngInputBio');
  const inputLanzamiento = document.getElementById('ngInputLanzamiento');
  const inputLogo = document.getElementById('ngInputLogo');
  const inputImagenSede = document.getElementById('ngInputImagenSede');
  const imgLogoPreview = document.getElementById('ngImgLogoPreview');
  const imgHeroPreview = document.getElementById('ngImgHeroPreview');

  // Inputs de Contacto
  const inputTelefono = document.getElementById('ngInputTelefono');
  const inputWhatsapp = document.getElementById('ngInputWhatsapp');
  const inputEmail = document.getElementById('ngInputEmail');
  const inputWhatsappMensaje = document.getElementById('ngInputWhatsappMensaje');
  const inputHorario = document.getElementById('ngInputHorario');
  const inputHorarioEn = document.getElementById('ngInputHorarioEn');
  const hintTelefonoFormato = document.getElementById('hintTelefonoFormato');
  const hintWhatsappFormato = document.getElementById('hintWhatsappFormato');
  const btnRestaurarMensajeWs = document.getElementById('btnRestaurarMensajeWs');

  // Inputs de Ubicación y Sedes
  const inputDireccion = document.getElementById('ngInputDireccion');
  const inputDistrito = document.getElementById('ngInputDistrito');
  const inputCiudad = document.getElementById('ngInputCiudad');
  const inputMapsUrl = document.getElementById('ngInputMapsUrl');
  const inputLat = document.getElementById('ngInputLat');
  const inputLng = document.getElementById('ngInputLng');
  const btnBuscarGoogleMaps = document.getElementById('btnBuscarGoogleMaps');
  const btnProbarMapsUrl = document.getElementById('btnProbarMapsUrl');
  const btnAutogenerarMapsUrl = document.getElementById('btnAutogenerarMapsUrl');
  const ngSedesContainer = document.getElementById('ngSedesContainer');
  const btnAgregarSede = document.getElementById('btnAgregarSede');

  // Inputs de Métricas y Redes
  const inputMetricaPacientes = document.getElementById('ngInputMetricaPacientes');
  const inputMetricaColegiatura = document.getElementById('ngInputMetricaColegiatura');
  const inputMetricaConfidencialidad = document.getElementById('ngInputMetricaConfidencialidad');
  const inputMetricaSatisfaccion = document.getElementById('ngInputMetricaSatisfaccion');
  const inputRedFacebook = document.getElementById('ngInputRedFacebook');
  const inputRedInstagram = document.getElementById('ngInputRedInstagram');
  const inputRedTiktok = document.getElementById('ngInputRedTiktok');
  const inputRedLinkedin = document.getElementById('ngInputRedLinkedin');

  // Inputs de SEO Dinámico
  const inputSeoTituloEs = document.getElementById('ngInputSeoTituloEs');
  const inputSeoDescEs = document.getElementById('ngInputSeoDescEs');
  const inputSeoKeywordsEs = document.getElementById('ngInputSeoKeywordsEs');
  const inputSeoTituloEn = document.getElementById('ngInputSeoTituloEn');
  const inputSeoDescEn = document.getElementById('ngInputSeoDescEn');
  const inputSeoKeywordsEn = document.getElementById('ngInputSeoKeywordsEn');

  let currentSedes = [];

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

  // 3. Previsualizaciones en vivo de Logo y Portada
  inputLogo?.addEventListener('input', () => {
    if (imgLogoPreview) imgLogoPreview.src = inputLogo.value || '/imgwii/logo.webp';
    autoGuardarBorrador();
  });

  inputImagenSede?.addEventListener('input', () => {
    if (imgHeroPreview) imgHeroPreview.src = inputImagenSede.value || '/imgwii/hero/psicologa-sofia-reynaga.webp';
    autoGuardarBorrador();
  });

  // 4. Normalizador de Celular y WhatsApp Perú (9 dígitos)
  function normalizarTelefonoPeru(val) {
    const digitos = String(val || '').replace(/\D/g, '');
    
    if (digitos.length === 9 && digitos.startsWith('9')) {
      return {
        esCelular9: true,
        celular9: digitos,
        whatsappLimpio: `51${digitos}`,
        visible: `+51 ${digitos.slice(0, 3)} ${digitos.slice(3, 6)} ${digitos.slice(6)}`
      };
    }

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
      whatsappLimpio: digitos,
      visible: val
    };
  }

  function actualizarHintTelefono() {
    if (!hintTelefonoFormato || !inputTelefono) return;
    const val = inputTelefono.value.trim();
    if (!val) {
      hintTelefonoFormato.textContent = 'Ingresa el número celular de atención directa';
      hintTelefonoFormato.style.color = 'var(--muted)';
      return;
    }
    const info = normalizarTelefonoPeru(val);
    if (info.esCelular9) {
      hintTelefonoFormato.textContent = `✓ Formato oficial: ${info.visible}`;
      hintTelefonoFormato.style.color = '#10b981';
    } else {
      hintTelefonoFormato.textContent = 'Recomendado: 9 dígitos peruanos que comiencen con 9';
      hintTelefonoFormato.style.color = '#f59e0b';
    }
  }

  function actualizarHintWhatsapp() {
    if (!hintWhatsappFormato || !inputWhatsapp) return;
    const val = inputWhatsapp.value.trim();
    if (!val) {
      hintWhatsappFormato.textContent = 'Número que abrirá la conversación de WhatsApp';
      hintWhatsappFormato.style.color = 'var(--muted)';
      return;
    }
    const info = normalizarTelefonoPeru(val);
    hintWhatsappFormato.textContent = `✓ Enlace directo: wa.me/${info.whatsappLimpio}`;
    hintWhatsappFormato.style.color = '#10b981';
  }

  inputTelefono?.addEventListener('input', () => {
    actualizarHintTelefono();
    autoGuardarBorrador();
  });

  inputWhatsapp?.addEventListener('input', () => {
    actualizarHintWhatsapp();
    autoGuardarBorrador();
  });

  // 5. Saludo Dinámico para WhatsApp
  btnRestaurarMensajeWs?.addEventListener('click', () => {
    const saludoHora = Saludar ? Saludar() : 'Hola';
    const nombreEsp = inputEspecialista?.value?.trim() || 'Lic. Sofia Reynaga';
    const msg = `¡${saludoHora} ${nombreEsp}! Deseo agendar una consulta psicológica.`;
    if (inputWhatsappMensaje) {
      inputWhatsappMensaje.value = msg;
      autoGuardarBorrador();
      Notificacion('Mensaje inicial actualizado con saludo dinámico', 'info', 2000);
    }
  });

  // 6. Asistentes de Google Maps
  btnBuscarGoogleMaps?.addEventListener('click', () => {
    const dir = inputDireccion?.value?.trim() || inputDistrito?.value?.trim() || 'Miraflores Lima';
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dir)}`, '_blank');
  });

  btnProbarMapsUrl?.addEventListener('click', () => {
    const url = inputMapsUrl?.value?.trim();
    if (!url) {
      Notificacion('Ingresa primero un enlace de Google Maps', 'warning', 2500);
      return;
    }
    window.open(url, '_blank');
  });

  btnAutogenerarMapsUrl?.addEventListener('click', () => {
    const lat = inputLat?.value?.trim();
    const lng = inputLng?.value?.trim();
    let autoUrl = '';

    if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
      autoUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    } else {
      const dir = inputDireccion?.value?.trim() || inputDistrito?.value?.trim() || 'Miraflores Lima';
      autoUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dir)}`;
    }

    if (inputMapsUrl) {
      inputMapsUrl.value = autoUrl;
      autoGuardarBorrador();
      Notificacion('Enlace de Google Maps generado', 'success', 2500);
    }
  });

  // 7. Renderizado de Sedes y Modalidades
  function renderSedes() {
    if (!ngSedesContainer) return;
    if (currentSedes.length === 0) {
      ngSedesContainer.innerHTML = `
        <div style="text-align:center; padding: 24px; color: var(--muted); font-size: var(--fz_s4);">
          No hay sedes registradas. Pulsa <strong>Agregar Sede</strong> para añadir una sede presencial o modalidad virtual.
        </div>
      `;
      return;
    }

    ngSedesContainer.innerHTML = currentSedes.map((s, idx) => `
      <div class="ng-sede-card ${s.activo ? '' : 'inactive'}" data-index="${idx}">
        <div class="ng-sede-row-header">
          <input type="text" class="ng-input input-sede-nombre" placeholder="Nombre (ej: Sede Miraflores)" value="${s.nombre || ''}" />
          <select class="ng-input input-sede-modalidad">
            <option value="Presencial" ${s.modalidad === 'Presencial' ? 'selected' : ''}>Presencial</option>
            <option value="Virtual" ${s.modalidad === 'Virtual' ? 'selected' : ''}>Virtual / Online</option>
            <option value="Domicilio" ${s.modalidad === 'Domicilio' ? 'selected' : ''}>A Domicilio</option>
          </select>
          <label class="ng-switch" title="${s.activo ? 'Desactivar sede' : 'Activar sede'}">
            <input type="checkbox" class="input-sede-activo" ${s.activo ? 'checked' : ''} />
            <span class="ng-slider"></span>
          </label>
          <button type="button" class="ng-btn-icon-del btn-del-sede" title="Eliminar sede">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
        <div class="ng-sede-row-body">
          <input type="text" class="ng-input input-sede-direccion" placeholder="Dirección física o plataforma (ej: Av. Benavides 620)" value="${s.direccion || ''}" />
          <input type="text" class="ng-input input-sede-referencia" placeholder="Referencia / Detalle (ej: A pocas cuadras de Parque Kennedy)" value="${s.referencia || ''}" />
          <input type="url" class="ng-input input-sede-maps" placeholder="Enlace Maps (opcional)" value="${s.mapsUrl || ''}" />
        </div>
      </div>
    `).join('');
  }

  // Delegación de eventos en Sedes
  ngSedesContainer?.addEventListener('input', (e) => {
    const card = e.target.closest('.ng-sede-card');
    if (!card) return;
    const idx = parseInt(card.getAttribute('data-index') || '0', 10);
    const s = currentSedes[idx];
    if (!s) return;

    if (e.target.classList.contains('input-sede-nombre')) s.nombre = e.target.value.trim();
    if (e.target.classList.contains('input-sede-direccion')) s.direccion = e.target.value.trim();
    if (e.target.classList.contains('input-sede-referencia')) s.referencia = e.target.value.trim();
    if (e.target.classList.contains('input-sede-maps')) s.mapsUrl = e.target.value.trim();

    autoGuardarBorrador();
  });

  ngSedesContainer?.addEventListener('change', (e) => {
    const card = e.target.closest('.ng-sede-card');
    if (!card) return;
    const idx = parseInt(card.getAttribute('data-index') || '0', 10);
    const s = currentSedes[idx];
    if (!s) return;

    if (e.target.classList.contains('input-sede-modalidad')) s.modalidad = e.target.value;
    if (e.target.classList.contains('input-sede-activo')) {
      s.activo = e.target.checked;
      card.classList.toggle('inactive', !s.activo);
    }

    autoGuardarBorrador();
  });

  ngSedesContainer?.addEventListener('click', async (e) => {
    const btnDel = e.target.closest('.btn-del-sede');
    if (!btnDel) return;
    const card = btnDel.closest('.ng-sede-card');
    const idx = parseInt(card?.getAttribute('data-index') || '0', 10);
    const s = currentSedes[idx];

    const conf = await wiConfirmar(`¿Deseas eliminar la sede "${s?.nombre || 'Seleccionada'}"?`, {
      titulo: 'Eliminar Sede',
      tipo: 'danger',
      siTexto: 'Sí, Eliminar'
    });

    if (conf) {
      currentSedes.splice(idx, 1);
      renderSedes();
      autoGuardarBorrador();
      Notificacion('Sede eliminada', 'info', 2000);
    }
  });

  btnAgregarSede?.addEventListener('click', () => {
    const nuevaSede = {
      id: `sede_${Date.now()}`,
      nombre: "Nueva Sede / Modalidad",
      modalidad: "Presencial",
      direccion: "",
      referencia: "",
      mapsUrl: "",
      activo: true
    };
    currentSedes.push(nuevaSede);
    renderSedes();
    autoGuardarBorrador();
  });

  // 8. Carga de Datos en los Inputs
  function cargarFormulario(cfg) {
    if (!cfg) return;

    // Identidad
    if (inputNombre) inputNombre.value = cfg.identidad?.nombre || '';
    if (inputNombreCorto) inputNombreCorto.value = cfg.identidad?.nombreCorto || '';
    if (inputEspecialista) inputEspecialista.value = cfg.identidad?.especialista || '';
    if (inputColegiatura) inputColegiatura.value = cfg.identidad?.colegiatura || '';
    if (inputTitulo) inputTitulo.value = cfg.identidad?.titulo || '';
    if (inputGrado) inputGrado.value = cfg.identidad?.grado || '';
    if (inputEnfoques) inputEnfoques.value = cfg.identidad?.enfoques || '';
    if (inputBio) inputBio.value = cfg.identidad?.bio || '';

    const fechaLanz = cfg.identidad?.lanzamientoFecha || '';
    if (inputLanzamiento) inputLanzamiento.value = fechaLanz;
    const years = calcularAnosTrayectoria(fechaLanz);
    if (ngYearsText) ngYearsText.textContent = years ? `${years} años` : '—';

    if (inputLogo) inputLogo.value = cfg.identidad?.logo || '';
    if (inputImagenSede) inputImagenSede.value = cfg.identidad?.imagenSede || '';
    if (imgLogoPreview) imgLogoPreview.src = cfg.identidad?.logo || '/imgwii/logo.webp';
    if (imgHeroPreview) imgHeroPreview.src = cfg.identidad?.imagenSede || '/imgwii/hero/psicologa-sofia-reynaga.webp';

    // Contacto
    if (inputTelefono) inputTelefono.value = cfg.contacto?.telefono || '';
    if (inputWhatsapp) inputWhatsapp.value = cfg.contacto?.whatsapp || '';
    if (inputEmail) inputEmail.value = cfg.contacto?.email || '';
    if (inputWhatsappMensaje) inputWhatsappMensaje.value = cfg.contacto?.whatsappMensaje || '';
    if (inputHorario) inputHorario.value = cfg.contacto?.horario || '';
    if (inputHorarioEn) inputHorarioEn.value = cfg.contacto?.horarioEn || '';

    actualizarHintTelefono();
    actualizarHintWhatsapp();

    // Ubicación Principal
    if (inputDireccion) inputDireccion.value = cfg.ubicacion?.direccion || '';
    if (inputDistrito) inputDistrito.value = cfg.ubicacion?.distrito || '';
    if (inputCiudad) inputCiudad.value = cfg.ubicacion?.ciudad || '';
    if (inputMapsUrl) inputMapsUrl.value = cfg.ubicacion?.mapsUrl || '';
    if (inputLat) inputLat.value = cfg.ubicacion?.coordenadas?.lat ?? '';
    if (inputLng) inputLng.value = cfg.ubicacion?.coordenadas?.lng ?? '';

    // Sedes
    currentSedes = Array.isArray(cfg.sedes) ? JSON.parse(JSON.stringify(cfg.sedes)) : [];
    renderSedes();

    // Métricas y Redes
    if (inputMetricaPacientes) inputMetricaPacientes.value = cfg.metricas?.pacientes || '';
    if (inputMetricaColegiatura) inputMetricaColegiatura.value = cfg.metricas?.colegiaturaNumero || '';
    if (inputMetricaConfidencialidad) inputMetricaConfidencialidad.value = cfg.metricas?.confidencialidad || '';
    if (inputMetricaSatisfaccion) inputMetricaSatisfaccion.value = cfg.metricas?.satisfaccion || '';

    if (inputRedFacebook) inputRedFacebook.value = cfg.redes?.facebook || '';
    if (inputRedInstagram) inputRedInstagram.value = cfg.redes?.instagram || '';
    if (inputRedTiktok) inputRedTiktok.value = cfg.redes?.tiktok || '';
    if (inputRedLinkedin) inputRedLinkedin.value = cfg.redes?.linkedin || '';

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
  }

  // 9. Extraer Datos del Formulario
  function recolectarDatosFormulario() {
    return {
      identidad: {
        nombre: inputNombre?.value?.trim() || "",
        nombreCorto: inputNombreCorto?.value?.trim() || "",
        especialista: inputEspecialista?.value?.trim() || "",
        colegiatura: inputColegiatura?.value?.trim() || "",
        titulo: inputTitulo?.value?.trim() || "",
        grado: inputGrado?.value?.trim() || "",
        enfoques: inputEnfoques?.value?.trim() || "",
        bio: inputBio?.value?.trim() || "",
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
        pais: "PE",
        mapsUrl: inputMapsUrl?.value?.trim() || "",
        coordenadas: {
          lat: parseFloat(inputLat?.value) || -12.1245,
          lng: parseFloat(inputLng?.value) || -77.0289
        }
      },
      sedes: currentSedes,
      metricas: {
        pacientes: inputMetricaPacientes?.value?.trim() || "450+",
        colegiaturaNumero: inputMetricaColegiatura?.value?.trim() || "49425",
        confidencialidad: inputMetricaConfidencialidad?.value?.trim() || "100%",
        satisfaccion: inputMetricaSatisfaccion?.value?.trim() || "98%",
        years: calcularAnosTrayectoria(inputLanzamiento?.value)
      },
      redes: {
        facebook: inputRedFacebook?.value?.trim() || "",
        instagram: inputRedInstagram?.value?.trim() || "",
        tiktok: inputRedTiktok?.value?.trim() || "",
        linkedin: inputRedLinkedin?.value?.trim() || ""
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

  // 10. Auto-Guardado de Borrador Reactivo (Debounce 500ms)
  function autoGuardarBorrador() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
      const data = recolectarDatosFormulario();
      savels(DRAFT_KEY, { ...data, timestamp: Date.now() });
    }, 500);
  }

  panelNegocio?.querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('input', autoGuardarBorrador);
  });

  // 11. Botón "Cargar Semilla": Puente portable frontend -> base de datos
  btnCargarSemilla?.addEventListener('click', async () => {
    const semilla = obtenerSemillaLocal();
    if (!semilla) {
      Notificacion('No se encontró archivo semilla.json en este proyecto', 'warning', 3000);
      return;
    }

    const conf = await wiConfirmar('¿Deseas poblar el formulario con la semilla local (semilla.json)? Luego podrás revisar los campos y hacer clic en "Guardar Cambios" para registrarlos en Firestore.', {
      titulo: 'Cargar Semilla Inicial',
      tipo: 'primary',
      siTexto: 'Cargar Semilla'
    });

    if (conf) {
      cargarFormulario(semilla);
      autoGuardarBorrador();
      Notificacion('✓ Semilla cargada con éxito. Revisa y pulsa "Guardar Cambios" para sincronizar a Firestore.', 'success', 4500);
    }
  });

  // 12. Guardar Cambios Centralizado con wiSpin y Notificacion
  function guardarCambiosNegocio() {
    if (isSaving) return;
    isSaving = true;

    if (btnGuardarNegocio) wiSpin(btnGuardarNegocio, true, 'Guardando...');

    const payload = recolectarDatosFormulario();
    guardarDatosNegocio(payload);
    removels(DRAFT_KEY);

    setTimeout(() => {
      if (btnGuardarNegocio) wiSpin(btnGuardarNegocio, false);
      Notificacion('Ficha guardada y sincronizada con Firestore', 'success', 2500);
      isSaving = false;

      // Disparar re-cocinado en Cloudflare si aplica
      solicitarActualizacionWeb({ motivo: 'negocio' });
    }, 400);
  }

  btnGuardarNegocio?.addEventListener('click', guardarCambiosNegocio);

  // 13. Atajo de teclado Ctrl + S en todo el módulo
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

  // 14. Inicialización
  const datosIniciales = obtenerDatosNegocio();
  const borrador = getls(DRAFT_KEY);

  if (borrador && borrador.identidad && (Date.now() - (borrador.timestamp || 0) < 86400000)) {
    cargarFormulario(borrador);
    Notificacion('Se restauraron cambios del borrador no guardado', 'info', 2500);
  } else {
    cargarFormulario(datosIniciales);
  }

  // Sincronización fresca en background desde Firestore si existe conexión
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
