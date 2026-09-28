// src/feature/personal/modulos/negocio/negocio.js
// Controlador Frontend Autónomo del Módulo Ficha de Negocio & Especialista
// 100% JS Nativo · Cero TypeScript · Local-First · Integración con @widev y Firestore

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

  // Botón Principal Guardar
  const btnGuardarNegocio = document.getElementById('btnGuardarNegocio');
  const ngBadgeTrayectoria = document.getElementById('ngBadgeTrayectoria');
  const ngYearsText = document.getElementById('ngYearsText');
  const ngLangTabs = document.getElementById('ngLangTabs');

  // ── 1. SELECTOR DE PESTAÑAS DE IDIOMA (ES / EN) ──
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

  // Inputs Bilingües: Identidad (ES)
  const inputNombre = document.getElementById('ngInputNombre');
  const inputNombreCorto = document.getElementById('ngInputNombreCorto');
  const inputEnfoques = document.getElementById('ngInputEnfoques');
  const inputBioEs = document.getElementById('ngInputBioEs');

  // Inputs Bilingües: Identidad (EN)
  const inputNombreEn = document.getElementById('ngInputNombreEn');
  const inputNombreCortoEn = document.getElementById('ngInputNombreCortoEn');
  const inputEnfoquesEn = document.getElementById('ngInputEnfoquesEn');
  const inputBioEn = document.getElementById('ngInputBioEn');

  // ── 3. INPUTS DE CONTACTO Y HORARIOS ──
  const inputTelefono = document.getElementById('ngInputTelefono');
  const inputWhatsapp = document.getElementById('ngInputWhatsapp');
  const inputEmail = document.getElementById('ngInputEmail');
  const ngHorarioSemanaAbre = document.getElementById('ngHorarioSemanaAbre');
  const ngHorarioSemanaCierra = document.getElementById('ngHorarioSemanaCierra');
  const ngHorarioSabadoAbre = document.getElementById('ngHorarioSabadoAbre');
  const ngHorarioSabadoCierra = document.getElementById('ngHorarioSabadoCierra');

  const inputHorario = document.getElementById('ngInputHorario');
  const inputHorarioEn = document.getElementById('ngInputHorarioEn');
  const inputWhatsappMensaje = document.getElementById('ngInputWhatsappMensaje');
  const inputWhatsappMensajeEn = document.getElementById('ngInputWhatsappMensajeEn');
  const hintTelefonoFormato = document.getElementById('hintTelefonoFormato');
  const hintWhatsappFormato = document.getElementById('hintWhatsappFormato');
  const btnRestaurarMensajeWs = document.getElementById('btnRestaurarMensajeWs');

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

  // ── 5. SEDES Y MODALIDADES BILINGÜES ──
  const ngSedeVesTagEs = document.getElementById('ngSedeVesTagEs');
  const ngSedeVesAtencionEs = document.getElementById('ngSedeVesAtencionEs');
  const ngSedeVesTagEn = document.getElementById('ngSedeVesTagEn');
  const ngSedeVesAtencionEn = document.getElementById('ngSedeVesAtencionEn');

  const ngSedeVirtualTagEs = document.getElementById('ngSedeVirtualTagEs');
  const ngSedeVirtualAtencionEs = document.getElementById('ngSedeVirtualAtencionEs');
  const ngSedeVirtualTagEn = document.getElementById('ngSedeVirtualTagEn');
  const ngSedeVirtualAtencionEn = document.getElementById('ngSedeVirtualAtencionEn');

  // ── 6. MÉTRICAS Y REDES SOCIALES ──
  const inputMetricaPacientes = document.getElementById('ngInputMetricaPacientes');
  const inputMetricaSatisfaccion = document.getElementById('ngInputMetricaSatisfaccion');
  const inputMetricaConfidencialidad = document.getElementById('ngInputMetricaConfidencialidad');
  const inputRedInstagram = document.getElementById('ngInputRedInstagram');
  const inputRedFacebook = document.getElementById('ngInputRedFacebook');
  const inputRedTiktok = document.getElementById('ngInputRedTiktok');
  const inputRedLinkedin = document.getElementById('ngInputRedLinkedin');

  // ── 7. SEO DINÁMICO BILINGÜE ──
  const inputSeoTituloEs = document.getElementById('ngInputSeoTituloEs');
  const inputSeoDescEs = document.getElementById('ngInputSeoDescEs');
  const inputSeoKeywordsEs = document.getElementById('ngInputSeoKeywordsEs');
  const inputSeoTituloEn = document.getElementById('ngInputSeoTituloEn');
  const inputSeoDescEn = document.getElementById('ngInputSeoDescEn');
  const inputSeoKeywordsEn = document.getElementById('ngInputSeoKeywordsEn');

  // ── GESTIÓN DE AÑOS DE TRAYECTORIA ──
  inputLanzamiento?.addEventListener('change', () => {
    const years = calcularAnosTrayectoria(inputLanzamiento.value);
    if (ngYearsText) ngYearsText.textContent = `${years} años`;
  });

  // ── ACTUALIZACIÓN DE PREVIEWS EN TIEMPO REAL ──
  inputImagenSede?.addEventListener('input', () => {
    const val = inputImagenSede.value.trim();
    if (imgHeroPreview) imgHeroPreview.src = val || '/imgwii/hero/psicologa-sofia-reynaga.webp';
  });

  inputLogo?.addEventListener('input', () => {
    const val = inputLogo.value.trim();
    if (imgLogoPreview) imgLogoPreview.src = val || '/imgwii/logo.webp';
  });

  inputLogoFull?.addEventListener('input', () => {
    const val = inputLogoFull.value.trim();
    if (imgLogoFullPreview) imgLogoFullPreview.src = val || '/imgwii/logo_full.webp';
  });

  // ── ASISTENTE DE GOOGLE MAPS ──
  btnBuscarGoogleMaps?.addEventListener('click', () => {
    const dir = inputDireccion?.value?.trim() || 'Av. 3 de Octubre Villa El Salvador Lima';
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dir)}`, '_blank');
  });

  btnProbarMapsUrl?.addEventListener('click', () => {
    const url = inputMapsUrl?.value?.trim() || 'https://maps.app.goo.gl/g7MFEUi8B6xpSjpn8';
    window.open(url, '_blank');
  });

  // ── SALUDO DINÁMICO WHATSAPP ──
  btnRestaurarMensajeWs?.addEventListener('click', () => {
    const saludo = Saludar ? Saludar() : 'Hola';
    const esp = inputEspecialista?.value?.trim() || 'Lic. Sofia Reynaga';
    if (inputWhatsappMensaje) {
      inputWhatsappMensaje.value = `¡${saludo} ${esp}! Deseo agendar una consulta psicológica.`;
      Notificacion('Mensaje restaurado', 'info', 1800);
    }
  });

  // ── CARGAR DATOS EN FORMULARIO ──
  function cargarFormulario(cfg) {
    if (!cfg) return;

    // Identidad Global
    if (inputEspecialista) inputEspecialista.value = cfg.identidad?.especialista || '';
    if (inputColegiatura) inputColegiatura.value = cfg.identidad?.colegiatura || '';
    if (inputTitulo) inputTitulo.value = cfg.identidad?.titulo || '';
    if (inputGrado) inputGrado.value = cfg.identidad?.grado || '';

    const fechaLanz = cfg.identidad?.lanzamientoFecha || '2020-03-15';
    if (inputLanzamiento) inputLanzamiento.value = fechaLanz;
    const years = calcularAnosTrayectoria(fechaLanz);
    if (ngYearsText) ngYearsText.textContent = `${years} años`;

    const foto = cfg.identidad?.imagenSede || '/imgwii/hero/psicologa-sofia-reynaga.webp';
    const logo = cfg.identidad?.logo || '/imgwii/logo.webp';
    const logoFull = cfg.identidad?.logoFull || '/imgwii/logo_full.webp';
    if (inputImagenSede) inputImagenSede.value = foto;
    if (inputLogo) inputLogo.value = logo;
    if (inputLogoFull) inputLogoFull.value = logoFull;
    if (imgHeroPreview) imgHeroPreview.src = foto;
    if (imgLogoPreview) imgLogoPreview.src = logo;
    if (imgLogoFullPreview) imgLogoFullPreview.src = logoFull;

    // Identidad (ES)
    if (inputNombre) inputNombre.value = cfg.identidad?.nombre || '';
    if (inputNombreCorto) inputNombreCorto.value = cfg.identidad?.nombreCorto || '';
    if (inputEnfoques) inputEnfoques.value = cfg.identidad?.enfoques || '';
    if (inputBioEs) {
      inputBioEs.value = typeof cfg.identidad?.bio === 'object' && cfg.identidad?.bio !== null
        ? (cfg.identidad.bio.es || '')
        : (cfg.identidad?.bio || '');
    }

    // Identidad (EN)
    if (inputNombreEn) inputNombreEn.value = cfg.identidad?.nombreEn || cfg.identidad?.nombre || '';
    if (inputNombreCortoEn) inputNombreCortoEn.value = cfg.identidad?.nombreCortoEn || cfg.identidad?.nombreCorto || '';
    if (inputEnfoquesEn) inputEnfoquesEn.value = cfg.identidad?.enfoquesEn || cfg.identidad?.enfoques || '';
    if (inputBioEn) {
      inputBioEn.value = typeof cfg.identidad?.bio === 'object' && cfg.identidad?.bio !== null
        ? (cfg.identidad.bio.en || '')
        : (cfg.identidad?.bioEn || '');
    }

    // Canales
    if (inputTelefono) inputTelefono.value = cfg.contacto?.telefono || '';
    if (inputWhatsapp) inputWhatsapp.value = cfg.contacto?.whatsapp || '';
    if (inputEmail) inputEmail.value = cfg.contacto?.email || '';

    if (ngHorarioSemanaAbre) ngHorarioSemanaAbre.value = cfg.horarios?.semana?.abre || '08:00';
    if (ngHorarioSemanaCierra) ngHorarioSemanaCierra.value = cfg.horarios?.semana?.cierra || '20:00';
    if (ngHorarioSabadoAbre) ngHorarioSabadoAbre.value = cfg.horarios?.sabado?.abre || '08:00';
    if (ngHorarioSabadoCierra) ngHorarioSabadoCierra.value = cfg.horarios?.sabado?.cierra || '20:00';

    // Horario Texto
    if (inputHorario) {
      inputHorario.value = typeof cfg.contacto?.horario === 'object' && cfg.contacto?.horario !== null
        ? (cfg.contacto.horario.es || '')
        : (cfg.contacto?.horario || '');
    }
    if (inputHorarioEn) {
      inputHorarioEn.value = typeof cfg.contacto?.horario === 'object' && cfg.contacto?.horario !== null
        ? (cfg.contacto.horario.en || '')
        : (cfg.contacto?.horarioEn || '');
    }

    // WhatsApp Mensaje (Sanitizado para evitar [object Object])
    const ws = cfg.contacto?.whatsappMensaje;
    if (inputWhatsappMensaje) {
      inputWhatsappMensaje.value = typeof ws === 'object' && ws !== null
        ? (ws.es || '')
        : (typeof ws === 'string' ? ws : '');
    }
    if (inputWhatsappMensajeEn) {
      inputWhatsappMensajeEn.value = typeof ws === 'object' && ws !== null
        ? (ws.en || '')
        : (cfg.contacto?.whatsappMensajeEn || '');
    }

    // Ubicación
    if (inputDireccion) inputDireccion.value = cfg.ubicacion?.direccion || '';
    if (inputReferencia) inputReferencia.value = cfg.ubicacion?.referencia || '';
    if (inputDistrito) inputDistrito.value = cfg.ubicacion?.distrito || 'Villa El Salvador';
    if (inputCiudad) inputCiudad.value = cfg.ubicacion?.ciudad || 'Lima, PE';
    if (inputMapsUrl) inputMapsUrl.value = cfg.ubicacion?.mapsUrl || '';
    if (inputLat) inputLat.value = cfg.ubicacion?.coordenadas?.lat ?? -12.2084;
    if (inputLng) inputLng.value = cfg.ubicacion?.coordenadas?.lng ?? -76.9387;

    // Sedes
    const sedes = Array.isArray(cfg.sedes) ? cfg.sedes : [];
    const sedeVes = sedes.find(s => s.id === 'ves') || sedes[0] || {};
    const sedeVirtual = sedes.find(s => s.id === 'virtual' || s.modalidad === 'Virtual') || sedes[1] || {};

    if (ngSedeVesTagEs) ngSedeVesTagEs.value = typeof sedeVes.tag === 'object' ? (sedeVes.tag?.es || '') : (sedeVes.tag || 'Sede Villa El Salvador');
    if (ngSedeVesAtencionEs) ngSedeVesAtencionEs.value = typeof sedeVes.atencion === 'object' ? (sedeVes.atencion?.es || '') : (sedeVes.atencion || 'Lunes a Sábado (Previa Cita)');
    if (ngSedeVesTagEn) ngSedeVesTagEn.value = typeof sedeVes.tag === 'object' ? (sedeVes.tag?.en || '') : (sedeVes.tagEn || 'Villa El Salvador Clinic');
    if (ngSedeVesAtencionEn) ngSedeVesAtencionEn.value = typeof sedeVes.atencion === 'object' ? (sedeVes.atencion?.en || '') : (sedeVes.atencionEn || 'Monday to Saturday (By Appointment)');

    if (ngSedeVirtualTagEs) ngSedeVirtualTagEs.value = typeof sedeVirtual.tag === 'object' ? (sedeVirtual.tag?.es || '') : (sedeVirtual.tag || '100% Online');
    if (ngSedeVirtualAtencionEs) ngSedeVirtualAtencionEs.value = typeof sedeVirtual.atencion === 'object' ? (sedeVirtual.atencion?.es || '') : (sedeVirtual.atencion || 'Horarios Flexibles');
    if (ngSedeVirtualTagEn) ngSedeVirtualTagEn.value = typeof sedeVirtual.tag === 'object' ? (sedeVirtual.tag?.en || '') : (sedeVirtual.tagEn || '100% Online');
    if (ngSedeVirtualAtencionEn) ngSedeVirtualAtencionEn.value = typeof sedeVirtual.atencion === 'object' ? (sedeVirtual.atencion?.en || '') : (sedeVirtual.atencionEn || 'Flexible Schedule');

    // Métricas
    if (inputMetricaPacientes) inputMetricaPacientes.value = cfg.metricas?.pacientes || '450+';
    if (inputMetricaSatisfaccion) inputMetricaSatisfaccion.value = cfg.metricas?.satisfaccion || '98%';
    if (inputMetricaConfidencialidad) inputMetricaConfidencialidad.value = cfg.metricas?.confidencialidad || '100%';

    // Redes
    if (inputRedInstagram) inputRedInstagram.value = cfg.redes?.instagram || '';
    if (inputRedFacebook) inputRedFacebook.value = cfg.redes?.facebook || '';
    if (inputRedTiktok) inputRedTiktok.value = cfg.redes?.tiktok || '';
    if (inputRedLinkedin) inputRedLinkedin.value = cfg.redes?.linkedin || '';

    // SEO
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

  // ── RECOLECTAR DATOS DE LA UI ──
  function recolectarDatos() {
    const kwEs = (inputSeoKeywordsEs?.value || '').split(',').map(s => s.trim()).filter(Boolean);
    const kwEn = (inputSeoKeywordsEn?.value || '').split(',').map(s => s.trim()).filter(Boolean);
    const rawTel = (inputTelefono?.value || '').trim();
    const telLimpio = rawTel.replace(/\D/g, '');

    return {
      id: 'principal',
      principal: true,
      moneda: 'PEN',
      idiomaDefecto: 'es',
      idiomasSoportados: ['es', 'en'],

      identidad: {
        nombre: inputNombre?.value?.trim() || "Consultorio Psicológico América",
        nombreCorto: inputNombreCorto?.value?.trim() || "Psicología América",
        especialista: inputEspecialista?.value?.trim() || "Lic. Sofia Reynaga Pachas",
        colegiatura: inputColegiatura?.value?.trim() || "C.Ps.P. N° 49425",
        titulo: inputTitulo?.value?.trim() || "Licenciada en Psicología",
        grado: inputGrado?.value?.trim() || "Maestrista en Psicología Clínica",
        enfoques: inputEnfoques?.value?.trim() || "Terapia Cognitivo-Conductual (TCC) • Terapia de Aceptación y Compromiso (ACT)",
        nombreEn: inputNombreEn?.value?.trim() || "America Psychological Clinic",
        nombreCortoEn: inputNombreCortoEn?.value?.trim() || "America Psychology",
        enfoquesEn: inputEnfoquesEn?.value?.trim() || "Cognitive Behavioral Therapy (CBT) • Acceptance and Commitment Therapy (ACT) • Psychopedagogy",
        bio: {
          es: inputBioEs?.value?.trim() || "",
          en: inputBioEn?.value?.trim() || ""
        },
        lanzamientoFecha: inputLanzamiento?.value || "2020-03-15",
        logo: inputLogo?.value?.trim() || "/imgwii/logo.webp",
        logoFull: inputLogoFull?.value?.trim() || "/imgwii/logo_full.webp",
        imagenSede: inputImagenSede?.value?.trim() || "/imgwii/hero/psicologa-sofia-reynaga.webp"
      },

      contacto: {
        telefono: rawTel,
        whatsapp: (inputWhatsapp?.value || '').trim().replace(/\D/g, '') || telLimpio,
        email: (inputEmail?.value || '').trim(),
        whatsappMensaje: {
          es: inputWhatsappMensaje?.value?.trim() || "¡Hola Lic. Sofia Reynaga! Deseo agendar una consulta psicológica.",
          en: inputWhatsappMensajeEn?.value?.trim() || "Hello Lic. Sofia Reynaga! I would like to book a psychological consultation."
        },
        horario: {
          es: (inputHorario?.value || '').trim() || "Lunes a Sábado: 8:00 a.m. a 8:00 p.m.",
          en: (inputHorarioEn?.value || '').trim() || "Monday to Saturday: 8:00 a.m. to 8:00 p.m."
        }
      },

      horarios: {
        semana: {
          abre: ngHorarioSemanaAbre?.value || "08:00",
          cierra: ngHorarioSemanaCierra?.value || "20:00"
        },
        sabado: {
          abre: ngHorarioSabadoAbre?.value || "08:00",
          cierra: ngHorarioSabadoCierra?.value || "20:00"
        }
      },

      ubicacion: {
        direccion: inputDireccion?.value?.trim() || "Av. 3 de Octubre con Micaela Bastidas - RUTA B / Sector 3, Grupo 26, Lote comercial 7",
        referencia: inputReferencia?.value?.trim() || "Frente a Paradero 3 de Octubre",
        distrito: inputDistrito?.value?.trim() || "Villa El Salvador",
        ciudad: inputCiudad?.value?.trim() || "Lima",
        pais: "PE",
        codigoPostal: "15834",
        mapsUrl: inputMapsUrl?.value?.trim() || "https://maps.app.goo.gl/g7MFEUi8B6xpSjpn8",
        coordenadas: {
          lat: parseFloat(inputLat?.value) || -12.2084,
          lng: parseFloat(inputLng?.value) || -76.9387
        }
      },

      sedes: [
        {
          id: "ves",
          nombre: "Sede Villa El Salvador",
          distrito: "Villa El Salvador",
          modalidad: "Presencial",
          direccion: inputDireccion?.value?.trim() || "Av. 3 de Octubre con Micaela Bastidas - RUTA B / Sector 3, Grupo 26, Lote comercial 7",
          referencia: inputReferencia?.value?.trim() || "Frente a Paradero 3 de Octubre",
          atencion: {
            es: ngSedeVesAtencionEs?.value?.trim() || "Lunes a Sábado (Previa Cita)",
            en: ngSedeVesAtencionEn?.value?.trim() || "Monday to Saturday (By Appointment)"
          },
          tag: {
            es: ngSedeVesTagEs?.value?.trim() || "Sede Villa El Salvador",
            en: ngSedeVesTagEn?.value?.trim() || "Villa El Salvador Clinic"
          },
          mapsUrl: inputMapsUrl?.value?.trim() || "https://maps.app.goo.gl/g7MFEUi8B6xpSjpn8",
          coordenadas: {
            lat: parseFloat(inputLat?.value) || -12.2084,
            lng: parseFloat(inputLng?.value) || -76.9387
          },
          activo: true
        },
        {
          id: "virtual",
          nombre: "Modalidad Online / Virtual",
          distrito: "Online",
          modalidad: "Virtual",
          direccion: "Google Meet / Zoom (Nacional e Internacional)",
          referencia: "Sesiones en vivo 100% privadas y seguras",
          atencion: {
            es: ngSedeVirtualAtencionEs?.value?.trim() || "Horarios Flexibles",
            en: ngSedeVirtualAtencionEn?.value?.trim() || "Flexible Schedule"
          },
          tag: {
            es: ngSedeVirtualTagEs?.value?.trim() || "100% Online",
            en: ngSedeVirtualTagEn?.value?.trim() || "100% Online"
          },
          mapsUrl: "",
          coordenadas: { lat: 0, lng: 0 },
          activo: true
        }
      ],

      metricas: {
        pacientes: inputMetricaPacientes?.value?.trim() || "450+",
        satisfaccion: inputMetricaSatisfaccion?.value?.trim() || "98%",
        confidencialidad: inputMetricaConfidencialidad?.value?.trim() || "100%",
        years: calcularAnosTrayectoria(inputLanzamiento?.value)
      },

      redes: {
        instagram: inputRedInstagram?.value?.trim() || "",
        facebook: inputRedFacebook?.value?.trim() || "",
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
          es: kwEs,
          en: kwEn
        },
        imagen: {
          url: "/imgwii/Sofia.jpg",
          width: 1200,
          height: 630,
          type: "image/jpeg",
          alt: "Consultorio Psicológico América - Lic. Sofía Reynaga en Villa El Salvador y Modalidad Online",
          caption: "Atención psicológica profesional, evaluación diagnóstica TDAH/TEA y psicoterapia"
        },
        schema: {
          tipo: ["MedicalBusiness", "MedicalClinic"],
          especialidades: ["Psychology", "Psychotherapy", "PediatricPsychology"],
          descripcionCorta: {
            es: "Consultorio de atención psicológica y psicoterapia en Villa El Salvador y Modalidad Online. Especializado en terapia individual, pareja, familia y descarte TDAH/TEA.",
            en: "Certified psychology and psychotherapy clinic in Villa El Salvador and Online. Specialized in individual therapy, couples, and ADHD/ASD diagnosis."
          }
        },
        audiencia: {
          es: ["familias", "parejas", "padres de familia", "adolescentes", "adultos"],
          en: ["expats", "families", "couples", "individuals"]
        },
        intencion: {
          es: "agendar consulta psicologica, evaluacion diagnostica tdah tea y psicoterapia en villa el salvador y online",
          en: "book psychological consultation and psychotherapy in lima and online"
        }
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

      Notificacion('Ficha de consultorio guardada con éxito en Firestore', 'success', 3000);

      // Ofrecer compilación/despliegue en la nube
      if (typeof solicitarActualizacionWeb === 'function') {
        setTimeout(() => {
          solicitarActualizacionWeb({
            modulo: 'negocio',
            titulo: 'Actualizar Web Pública',
            mensaje: '¿Deseas desplegar los cambios en el sitio web público ahora?'
          });
        }, 600);
      }
    } catch (err) {
      console.error(err);
      Notificacion('Error al guardar datos: ' + (err?.message || err), 'danger', 4000);
    } finally {
      btnGuardarNegocio.disabled = false;
      if (spin) spin.stop();
      isSaving = false;
    }
  });

  // Atajo de teclado universal Ctrl+S / Cmd+S
  wiAtajo?.('ctrl+s, cmd+s', (e) => {
    e.preventDefault();
    btnGuardarNegocio?.click();
  });

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

