// src/negocio.js
// 🎯 Fachada Canónica, Reactiva y Universal de Negocio y Servicios (Consultorio Psicológico América)
// Fuente Primaria: Firestore ('negocio/principal' y 'servicios')
// Respaldo Local-First: LocalStorage ('wi_negocio', 'wi_servicios')
// Respaldo Semilla Offline: src/semillas/negocio.json, servicios.json, configurar.js
// 100% Cero Dependencias Circulares: Cascada de 3 Niveles (Firestore -> Semilla -> "")

import negocioSemilla from './semillas/negocio.json';
import serviciosSemilla from './semillas/servicios.json';
import {
  configurarSistema,
  configurarPersonal,
  configurarCliente,
  configurarRedes,
  resolverIcono,
  tieneCapacidad,
  getModulosPersonal,
  getModulosCliente,
  getCanalesRedes
} from './semillas/configurar.js';

export const configSemilla = configurarSistema;
export {
  configurarSistema,
  configurarPersonal,
  configurarCliente,
  configurarRedes,
  resolverIcono,
  tieneCapacidad,
  getModulosPersonal,
  getModulosCliente,
  getCanalesRedes
};

export const STORAGE_KEY_NEGOCIO = 'wi_negocio';
export const OLD_STORAGE_KEY_NEGOCIO = 'psicologia_negocio';
export const LEGACY_STORAGE_KEY_NEGOCIO = 'minegocio';
export const STORAGE_KEY_PRODUCTOS = 'wi_servicios';
export const OLD_STORAGE_KEY_PRODUCTOS = 'psicologia_servicios';
export const COLECCION_NEGOCIO = 'negocio';
export const COLECCION_SERVICIOS = 'servicios';
export const DOC_NEGOCIO_ID = 'principal';

// Medios de pago aceptados oficiales
export const MEDIOS_PAGO_BASE = [
  { nombre: "Efectivo en Consultorio", icon: "fa-money-bill-wave" },
  { nombre: "Yape", icon: "fa-mobile-screen-button" },
  { nombre: "Plin", icon: "fa-mobile-screen-button" },
  { nombre: "Transferencia Bancaria", icon: "fa-building-columns" }
];

// =============================================================================
// 1. PARSER CANÓNICO Y ULTRALIGERO DE CAMPOS FIRESTORE REST API (0 dependencias)
// =============================================================================
export function parseFirestoreDoc(fields = {}) {
  const res = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v.stringValue !== undefined) res[k] = v.stringValue;
    else if (v.integerValue !== undefined) res[k] = parseInt(v.integerValue, 10);
    else if (v.doubleValue !== undefined) res[k] = parseFloat(v.doubleValue);
    else if (v.booleanValue !== undefined) res[k] = v.booleanValue;
    else if (v.timestampValue !== undefined) res[k] = v.timestampValue;
    else if (v.mapValue) res[k] = parseFirestoreDoc(v.mapValue.fields || {});
    else if (v.arrayValue) {
      res[k] = (v.arrayValue.values || []).map(item =>
        item.mapValue ? parseFirestoreDoc(item.mapValue.fields || {}) : Object.values(item)[0]
      );
    }
  }
  return res;
}

// =============================================================================
// 2. NORMALIZADOR COMPACTO DE NEGOCIO (Cascada: Entrada -> Semilla -> Vacío "")
// =============================================================================
export function normalizarConfig(c = {}) {
  const cfg = c && typeof c === 'object' ? c : {};
  const base = negocioSemilla || {};

  const toMap = (v, defaultEs = '', defaultEn = '') => {
    if (typeof v === 'object' && v !== null) {
      return {
        es: v.es || defaultEs,
        en: v.en || defaultEn || v.es || defaultEs
      };
    }
    return {
      es: v || defaultEs,
      en: defaultEn || v || defaultEs
    };
  };

  const cel = cfg.contacto?.celular || cfg.contacto?.telefono || base.contacto?.celular || base.contacto?.telefono || '+51 960 332 958';
  const celSec = cfg.contacto?.celularSecundario || base.contacto?.celularSecundario || '+51 960 332 958';
  const celPersonal = cfg.contacto?.celularPersonal ?? base.contacto?.celularPersonal ?? '';
  const telFijo = cfg.contacto?.telefonoFijo ?? base.contacto?.telefonoFijo ?? '';
  const celLimpio = String(cel).replace(/\D/g, '');

  return {
    id: cfg.id || base.id || DOC_NEGOCIO_ID,
    principal: Boolean(cfg.principal ?? base.principal ?? true),
    userId: cfg.userId || base.userId || '',
    creado: cfg.creado || base.creado || null,
    actualizado: cfg.actualizado || base.actualizado || null,
    moneda: cfg.moneda || base.moneda || configurarSistema.parametros.moneda || 'PEN',
    langPrincipal: cfg.langPrincipal || cfg.idiomaPrincipal || base.langPrincipal || 'es',
    langs: Array.isArray(cfg.langs) && cfg.langs.length > 0 ? cfg.langs : (Array.isArray(cfg.idiomas) && cfg.idiomas.length > 0 ? cfg.idiomas : (base.langs || ['es', 'en'])),
    idiomaPrincipal: cfg.langPrincipal || cfg.idiomaPrincipal || base.langPrincipal || 'es',
    idiomas: Array.isArray(cfg.langs) && cfg.langs.length > 0 ? cfg.langs : (Array.isArray(cfg.idiomas) && cfg.idiomas.length > 0 ? cfg.idiomas : (base.langs || ['es', 'en'])),
    linkweb: cfg.linkweb || (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : (import.meta.env?.PUBLIC_SITE_URL || 'https://psicologiawii.web.app')),
    titulo: cfg.titulo || base.titulo || 'Consultorio Psicológico América · Atención Ética y Basada en Evidencia',
    subtitulo: cfg.subtitulo ?? base.subtitulo ?? 'Psicoterapia individual, terapia de pareja y talleres vivenciales con la Lic. Sofia Reynaga.',
    identidad: {
      nombre: toMap(cfg.identidad?.nombre || base.identidad?.nombre, 'Consultorio Psicológico América', 'America Psychological Clinic'),
      nombreCorto: toMap(cfg.identidad?.nombreCorto || base.identidad?.nombreCorto, 'Psicología América', 'America Psychology'),
      razonSocial: typeof (cfg.identidad?.nombre || base.identidad?.nombre) === 'object' ? ((cfg.identidad?.nombre || base.identidad?.nombre).es || 'Consultorio Psicológico América') : (cfg.identidad?.nombre || base.identidad?.nombre || 'Consultorio Psicológico América'),
      especialista: cfg.identidad?.especialista || base.identidad?.especialista || 'Lic. Sofia Reynaga Pachas',
      colegiatura: String(cfg.identidad?.colegiatura || base.identidad?.colegiatura || '49425').replace(/[^0-9]/g, '') || '49425',
      titulo: toMap(cfg.identidad?.titulo || base.identidad?.titulo, 'Licenciada en Psicología', 'Licensed Psychologist'),
      grado: toMap(cfg.identidad?.grado || base.identidad?.grado, 'Maestrista en Psicología Clínica', "Master's in Clinical Psychology"),
      enfoques: toMap(cfg.identidad?.enfoques || base.identidad?.enfoques, 'Terapia Cognitivo-Conductual (TCC) • Terapia Contextual (ACT) • Sistémica • Humanista', 'Cognitive Behavioral Therapy (CBT) • Acceptance and Commitment Therapy (ACT) • Systemic'),
      lanzamientoFecha: cfg.identidad?.lanzamientoFecha || base.identidad?.lanzamientoFecha || '2020-03-15',
      logo: cfg.identidad?.logo || base.identidad?.logo || '/imgwii/logo.webp',
      logoFull: cfg.identidad?.logoFull || base.identidad?.logoFull || '/imgwii/logo_full.webp',
      imagenSede: cfg.identidad?.imagenSede || base.identidad?.imagenSede || '/imgwii/hero/psicologa-sofia-reynaga.webp',
      bio: toMap(cfg.identidad?.bio || base.identidad?.bio, 'Psicóloga clínica y colegiada por el Colegio de Psicólogos del Perú (C.Ps.P. 49425)...', 'Clinical psychologist licensed by the College of Psychologists of Peru (C.Ps.P. 49425)...')
    },
    contacto: {
      celular: cel,
      celularSecundario: celSec,
      celularPersonal: celPersonal,
      telefonoFijo: telFijo,
      telefono: cel,
      telefonoLimpio: celLimpio,
      whatsapp: cfg.contacto?.whatsapp || base.contacto?.whatsapp || '51960332958',
      whatsappLimpio: (cfg.contacto?.whatsapp || base.contacto?.whatsapp || '51960332958').replace(/\D/g, ''),
      email: cfg.contacto?.email || cfg.contacto?.correo || base.contacto?.email || 'reynaga.psychologist@gmail.com',
      correo: cfg.contacto?.correo || cfg.contacto?.email || base.contacto?.email || 'reynaga.psychologist@gmail.com',
      correoPacientes: cfg.contacto?.correoPacientes ?? cfg.contacto?.emailPacientes ?? base.contacto?.correoPacientes ?? '',
      emailPacientes: cfg.contacto?.correoPacientes ?? cfg.contacto?.emailPacientes ?? base.contacto?.correoPacientes ?? '',
      horario: toMap(cfg.contacto?.horario || base.contacto?.horario, 'Lunes a Sábado: 8:00 a.m. a 8:00 p.m. (Previa Cita)', 'Monday to Saturday: 8:00 a.m. to 8:00 p.m. (By Appointment)')
    },
    ubicacion: {
      direccion: cfg.ubicacion?.direccion || base.ubicacion?.direccion || 'Av. 3 de Octubre con Micaela Bastidas - RUTA B / Sector 3, Grupo 26, Lote comercial 7',
      referencia: cfg.ubicacion?.referencia || base.ubicacion?.referencia || 'Frente a Paradero 3 de Octubre',
      distrito: cfg.ubicacion?.distrito || base.ubicacion?.distrito || 'Villa El Salvador',
      ciudad: cfg.ubicacion?.ciudad || base.ubicacion?.ciudad || 'Lima',
      pais: cfg.ubicacion?.pais || base.ubicacion?.pais || 'PE',
      mapsUrl: cfg.ubicacion?.mapsUrl || base.ubicacion?.mapsUrl || 'https://maps.app.goo.gl/g7MFEUi8B6xpSjpn8',
      coordenadas: cfg.ubicacion?.coordenadas || base.ubicacion?.coordenadas || { lat: -12.2084, lng: -76.9387 }
    },
    metricas: {
      pacientes: cfg.metricas?.pacientes || base.metricas?.pacientes || '+450',
      colegiatura: String(cfg.metricas?.colegiatura || cfg.identidad?.colegiatura || base.metricas?.colegiatura || '49425').replace(/[^0-9]/g, '') || '49425',
      years: cfg.metricas?.years || base.metricas?.years || '+6 Años',
      confidencialidad: cfg.metricas?.confidencialidad || base.metricas?.confidencialidad || '100%',
      satisfaccion: cfg.metricas?.satisfaccion || base.metricas?.satisfaccion || '98%'
    },
    hero: {
      titulo: toMap(cfg.hero?.titulo || base.hero?.titulo, '¿Sientes que el estrés o la ansiedad te sobrepasan?', 'Do you feel overwhelmed by stress or anxiety?'),
      subtitulo: toMap(cfg.hero?.subtitulo || base.hero?.subtitulo, 'Un espacio clínico seguro, confidencial y sin juicios...', 'A safe, confidential and non-judgmental clinical space...'),
      badge: toMap(cfg.hero?.badge || base.hero?.badge, 'ESPACIO SEGURO Y CONFIDENCIAL', 'SAFE & CONFIDENTIAL SPACE'),
      imgHero: (() => {
        const rawImg = cfg.hero?.imgHero || base.hero?.imgHero || '/imgwii/hero.webp';
        if (typeof rawImg === 'string' && (rawImg.includes('Psychologist_listening_in_therapy') || rawImg.includes('psicologa-terapia') || rawImg.includes('psicologa-sofia-reynaga'))) {
          return '/imgwii/hero.webp';
        }
        return rawImg;
      })(),
      driverTitulo: toMap(cfg.hero?.driverTitulo || base.hero?.driverTitulo, 'Primera Consulta y Evaluación', 'First Consultation & Clinical Assessment'),
      driverDesc: toMap(cfg.hero?.driverDesc || base.hero?.driverDesc, 'Sesión individual de 50 min presencial u online', '50 min individual session in-person or online'),
      driverPrecio: Number(cfg.hero?.driverPrecio ?? base.hero?.driverPrecio ?? 85.00)
    },
    redes: cfg.redes || base.redes || {
      whatsapp: 'https://wa.me/51960332958',
      instagram: 'https://instagram.com/psicologiaamerica',
      facebook: 'https://facebook.com/psicologiaamerica',
      tiktok: 'https://tiktok.com/@psicologiaamerica',
      linkedin: 'https://linkedin.com/in/sofia-reynaga'
    },
    sedes: Array.isArray(cfg.sedes) && cfg.sedes.length > 0 ? cfg.sedes : (base.sedes || []),
    zonas: Array.isArray(cfg.zonas) && cfg.zonas.length > 0 ? cfg.zonas : (base.zonas || []),
    horarios: cfg.horarios || base.horarios || {
      semana: { abre: '08:00', cierra: '20:00' },
      sabado: { abre: '08:00', cierra: '20:00' }
    },
    seo: (() => {
      const rawSeo = cfg.seo || base.seo || {};
      let seoImagen = rawSeo.imagen;
      if (typeof seoImagen === 'string' && seoImagen.trim()) {
        const urlStr = seoImagen.trim();
        seoImagen = {
          url: urlStr,
          width: 1200,
          height: 630,
          type: urlStr.endsWith('.webp') ? 'image/webp' : (urlStr.endsWith('.png') ? 'image/png' : 'image/jpeg'),
          alt: typeof rawSeo.imagenAlt === 'string' ? rawSeo.imagenAlt : (rawSeo.imagenAlt?.es || cfg.identidad?.nombreComercial || 'Consultorio Psicológico América'),
          caption: typeof rawSeo.imagenCaption === 'string' ? rawSeo.imagenCaption : (rawSeo.imagenCaption?.es || cfg.identidad?.slogan || 'Atención psicológica profesional y confidencial')
        };
      } else if (!seoImagen || typeof seoImagen !== 'object' || !seoImagen.url) {
        const fallbackImg = cfg.identidad?.imagenSede || base.identidad?.imagenSede || '/imgwii/psicologa-sofia-reynaga.webp';
        seoImagen = {
          url: fallbackImg,
          width: 1200,
          height: 630,
          type: fallbackImg.endsWith('.webp') ? 'image/webp' : 'image/jpeg',
          alt: cfg.identidad?.nombreComercial || 'Consultorio Psicológico América',
          caption: cfg.identidad?.slogan || 'Atención psicológica profesional y confidencial'
        };
      }
      return {
        ...rawSeo,
        imagen: seoImagen
      };
    })()
  };
}

// Lectura en tiempo de compilación (Astro SSG / Cloudflare Build)
let _datosBuildFirestore = null;
if (typeof window === 'undefined') {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const projectId = import.meta.env.PUBLIC_FIREBASE_PROJECT_ID || 'psicologiawii';
    if (projectId) {
      const res = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/negocio/principal`, {
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.ok) {
        const json = await res.json();
        _datosBuildFirestore = parseFirestoreDoc(json.fields || {});
      }
    }
  } catch (err) {}
}

export function obtenerDatosNegocio() {
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem(STORAGE_KEY_NEGOCIO) || localStorage.getItem(OLD_STORAGE_KEY_NEGOCIO) || localStorage.getItem(LEGACY_STORAGE_KEY_NEGOCIO);
      if (local) {
        const parsed = JSON.parse(local);
        const data = parsed?.value || parsed;
        if (data && typeof data === 'object') return normalizarConfig(data);
      }
    } catch (e) {}
  }
  if (_datosBuildFirestore) {
    return normalizarConfig(_datosBuildFirestore);
  }
  return normalizarConfig(negocioSemilla);
}

export const obtenerNegocioLocal = obtenerDatosNegocio;

/**
 * Normaliza cualquier documento de Firestore para servicios/talleres
 */
export function normalizarProductoFirestore(docRaw = {}) {
  const item = docRaw.fields ? parseFirestoreDoc(docRaw.fields || {}) : docRaw;
  const id = item.id || (docRaw.name ? docRaw.name.split('/').pop() : '');
  const precio = Number(item.precioPEN ?? item.precio ?? item.price ?? 85);

  const getTxt = (v) => typeof v === 'object' && v !== null ? (v.es || '') : (v || '');
  const getTxtEn = (v, vEn) => typeof v === 'object' && v !== null ? (v.en || '') : (vEn || '');

  return {
    id,
    tipo: item.tipo || 'psicologia',
    nombre: getTxt(item.nombre),
    nombreEn: getTxtEn(item.nombre, item.nombreEn),
    descripcion: getTxt(item.descripcion),
    descripcionEn: getTxtEn(item.descripcion, item.descripcionEn),
    precioPEN: precio,
    precio,
    duracion: getTxt(item.duracion) || '50 min',
    duracionEn: getTxtEn(item.duracion, item.duracionEn) || '50 mins',
    enfoque: item.enfoque || '',
    publico: getTxt(item.publico) || 'Adultos y Adolescentes',
    publicoEn: getTxtEn(item.publico, item.publicoEn) || 'Adults and Teens',
    modalidad: getTxt(item.modalidad) || 'Presencial y Online',
    modalidadEn: getTxtEn(item.modalidad, item.modalidadEn) || 'In-Person & Online',
    garantias: Array.isArray(item.garantias?.es) ? item.garantias.es : (Array.isArray(item.garantias) ? item.garantias : []),
    garantiasEn: Array.isArray(item.garantias?.en) ? item.garantias.en : (Array.isArray(item.garantiasEn) ? item.garantiasEn : []),
    imagen: item.imagen || '/imgwii/servicios/psicoterapia-individual.webp',
    badge: getTxt(item.badge) || '',
    badgeEn: getTxtEn(item.badge, item.badgeEn) || '',
    tagClase: item.tagClase || 'badge-serenidad',
    orden: Number(item.orden ?? 1),
    activo: Boolean(item.activo ?? true)
  };
}

let _serviciosBuildFirestore = Array.isArray(serviciosSemilla) ? serviciosSemilla.map(s => normalizarProductoFirestore(s)) : [];

/**
 * Consulta y reconcilia servicios y talleres clínicos desde Firestore vía REST
 * Protegido con throttle de 3 minutos para cuidar la cuota gratuita de Firebase Spark
 */
export async function consultarProductosFirestoreFresco(forzar = false) {
  const SYNC_THROTTLE_MS = 180000;
  if (typeof window !== 'undefined' && !forzar) {
    try {
      const lastSync = sessionStorage.getItem('wi_sync_servicios_ts');
      if (lastSync && (Date.now() - Number(lastSync)) < SYNC_THROTTLE_MS) {
        const local = localStorage.getItem(STORAGE_KEY_PRODUCTOS) || localStorage.getItem(OLD_STORAGE_KEY_PRODUCTOS);
        if (local) {
          const parsed = JSON.parse(local);
          const lista = Array.isArray(parsed) ? parsed : (parsed?.value || null);
          if (Array.isArray(lista) && lista.length > 0) {
            return lista.filter(p => p.activo !== false);
          }
        }
      }
    } catch (e) {}
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const projectId = import.meta.env.PUBLIC_FIREBASE_PROJECT_ID || 'psicologiawii';
    if (projectId) {
      const res = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/servicios`, {
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.documents) && json.documents.length > 0) {
          const prods = json.documents
            .map(d => normalizarProductoFirestore(d))
            .filter(p => p.activo !== false)
            .sort((a, b) => (a.orden || 999) - (b.orden || 999));
          _serviciosBuildFirestore = prods;
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(STORAGE_KEY_PRODUCTOS, JSON.stringify(prods));
              sessionStorage.setItem('wi_sync_servicios_ts', String(Date.now()));
              window.dispatchEvent(new CustomEvent('wi:servicios-actualizado', { detail: prods }));
            } catch (e) {}
          }
          return prods;
        }
      }
    }
  } catch (err) {}

  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem(STORAGE_KEY_PRODUCTOS) || localStorage.getItem(OLD_STORAGE_KEY_PRODUCTOS);
      if (local) {
        const parsed = JSON.parse(local);
        const lista = Array.isArray(parsed) ? parsed : (parsed?.value || null);
        if (Array.isArray(lista) && lista.length > 0) {
          return lista.filter(p => p.activo !== false);
        }
      }
    } catch (e) {}
  }

  return _serviciosBuildFirestore;
}

if (typeof window === 'undefined') {
  await consultarProductosFirestoreFresco();
}

export const datosNegocio = {
  get raw() { return obtenerDatosNegocio(); },
  get identidad() { return this.raw.identidad || {}; },
  get nombre() {
    const n = this.raw.identidad?.nombre;
    return typeof n === 'object' && n !== null ? (n.es || '') : (n || 'Consultorio Psicológico América');
  },
  get nombreCorto() {
    const nc = this.raw.identidad?.nombreCorto;
    return typeof nc === 'object' && nc !== null ? (nc.es || '') : (nc || 'Psicología América');
  },
  get razonSocial() { return this.nombre; },
  get especialista() { return this.raw.identidad?.especialista || 'Lic. Sofia Reynaga Pachas'; },
  get colegiaturaCodigo() {
    const col = this.raw.identidad?.colegiatura || '49425';
    return String(col).replace(/[^0-9]/g, '') || '49425';
  },
  get colegiaturaNumero() { return this.colegiaturaCodigo; },
  get colegiatura() { return this.colegiaturaCodigo; },
  get registroColegio() { return `C.Ps.P. N° ${this.colegiaturaCodigo} · Colegiada y Habilitada`; },
  get titulo() {
    const t = this.raw.identidad?.titulo;
    return typeof t === 'object' && t !== null ? (t.es || '') : (t || 'Licenciada en Psicología');
  },
  get grado() {
    const g = this.raw.identidad?.grado;
    return typeof g === 'object' && g !== null ? (g.es || '') : (g || 'Maestrista en Psicología Clínica');
  },
  get enfoques() {
    const e = this.raw.identidad?.enfoques;
    return typeof e === 'object' && e !== null ? (e.es || '') : (e || '');
  },
  getTitulo(idioma = 'es') {
    const t = this.raw.identidad?.titulo;
    return typeof t === 'object' && t !== null ? (t[idioma] || t.es || '') : (t || 'Licenciada en Psicología');
  },
  getGrado(idioma = 'es') {
    const g = this.raw.identidad?.grado;
    return typeof g === 'object' && g !== null ? (g[idioma] || g.es || '') : (g || 'Maestrista en Psicología Clínica');
  },
  getEnfoques(idioma = 'es') {
    const e = this.raw.identidad?.enfoques;
    return typeof e === 'object' && e !== null ? (e[idioma] || e.es || '') : (e || '');
  },
  get bio() { return typeof this.raw.identidad?.bio === 'object' ? (this.raw.identidad?.bio?.es || '') : (this.raw.identidad?.bio || ''); },
  get logo() { return this.raw.identidad?.logo || '/imgwii/logo.webp'; },
  get logoCircle() { return this.logo; },
  get logoFull() { return this.raw.identidad?.logoFull || '/imgwii/logo_full.webp'; },
  get fotoEspecialista() { return this.raw.identidad?.imagenSede || '/imgwii/hero/psicologa-sofia-reynaga.webp'; },
  get imagenSede() { return this.fotoEspecialista; },
  get experienciaAnos() { return this.raw.metricas?.years || '6+'; },
  get moneda() { return this.raw.moneda || 'PEN'; },
  get celular() { return this.raw.contacto?.celular || this.raw.contacto?.telefono || '+51 960 332 958'; },
  get celularSecundario() { return this.raw.contacto?.celularSecundario || '+51 960 332 958'; },
  get telefono() { return this.celular; },
  get telefonoMostrado() { return this.celular; },
  get telefonoFijo() { return this.raw.contacto?.telefonoFijo || ''; },
  get telefonoLimpio() { return this.raw.contacto?.telefonoLimpio || '960332958'; },
  get telefonoRaw() { return this.telefonoLimpio; },
  get whatsapp() { return this.raw.contacto?.whatsapp || '51960332958'; },
  get whatsappLimpio() { return this.raw.contacto?.whatsappLimpio || '51960332958'; },
  get whatsappNumero() { return this.whatsappLimpio; },
  get whatsappMensaje() { return typeof this.raw.contacto?.whatsappMensaje === 'object' ? (this.raw.contacto?.whatsappMensaje?.es || '') : (this.raw.contacto?.whatsappMensaje || ''); },
  get whatsappMensajeEn() {
    const m = this.raw.contacto?.whatsappMensaje;
    return typeof m === 'object' && m !== null ? (m.en || '') : (this.raw.contacto?.whatsappMensajeEn || this.whatsappMensaje);
  },
  getWhatsappMensaje(idioma = 'es') {
    return idioma === 'en' ? this.whatsappMensajeEn : this.whatsappMensaje;
  },
  get email() { return this.raw.contacto?.email || this.raw.contacto?.correo || 'reynaga.psychologist@gmail.com'; },
  get correo() { return this.email; },
  get correoPacientes() { return this.raw.contacto?.correoPacientes || this.raw.contacto?.emailPacientes || ''; },
  get emailPacientes() { return this.correoPacientes; },
  get emailAtencion() { return this.correoPacientes || this.email; },
  get celularPersonal() { return this.raw.contacto?.celularPersonal || ''; },
  get celularPersonalLimpio() { return String(this.celularPersonal).replace(/\D/g, ''); },
  get direccionSede() { return this.raw.ubicacion?.direccion || ''; },
  get distritoSede() { return this.raw.ubicacion?.distrito || 'Villa El Salvador'; },
  get ciudad() { return this.raw.ubicacion?.ciudad || 'Lima'; },
  get pais() { return this.raw.ubicacion?.pais || 'PE'; },
  get mapsUrl() { return this.raw.ubicacion?.mapsUrl || ''; },
  get coordenadas() { return this.raw.ubicacion?.coordenadas || { lat: -12.2084, lng: -76.9387 }; },
  get horario() { return typeof this.raw.contacto?.horario === 'object' ? (this.raw.contacto?.horario?.es || '') : (this.raw.contacto?.horario || ''); },
  get horarioEn() { return typeof this.raw.contacto?.horario === 'object' ? (this.raw.contacto?.horario?.en || '') : ''; },
  getHorario(idioma = 'es') {
    return idioma === 'en' ? this.horarioEn : this.horario;
  },
  get metricas() { return this.raw.metricas || { years: '6+', pacientes: '+450', confidencialidad: '100%', satisfaccion: '98%' }; },
  get hero() { return this.raw.hero || {}; },
  get imgHero() {
    const rawImg = this.raw.hero?.imgHero || '/imgwii/hero.webp';
    if (typeof rawImg === 'string' && (rawImg.includes('Psychologist_listening_in_therapy') || rawImg.includes('psicologa-terapia') || rawImg.includes('psicologa-sofia-reynaga'))) {
      return '/imgwii/hero.webp';
    }
    return rawImg;
  },
  get redes() { return this.raw.redes || {}; },
  get sedes() { return this.raw.sedes || []; },
  get distritos() { return this.sedes; },
  get productos() { return _serviciosBuildFirestore; },
  get servicios() { return _serviciosBuildFirestore.filter(s => s.tipo === 'psicologia'); },
  get talleres() { return _serviciosBuildFirestore.filter(s => s.tipo === 'taller'); },
  get seo() { return this.raw.seo || null; },
  get linkweb() {
    return this.raw.linkweb || (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://psicologiawii.web.app');
  },
  get creado() { return this.raw.creado || null; },
  get actualizado() { return this.raw.actualizado || null; },
  get mediosPago() { return MEDIOS_PAGO_BASE; }
};

export default datosNegocio;
