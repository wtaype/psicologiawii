// src/negocio.js
// 🎯 Puente Canónico y Reactivo a Firestore 'negocio' y 'servicios' para Consultorio Psicológico América
// Conexión oficial a Firebase 'psicologiawii' con Fallbacks Canónicos de Psicología Clínica

import { obtenerDatosNegocio, calcularAnosTrayectoria, parseFirestoreDoc } from './feature/personal/modulos/negocio/dataNegocio.js';

// Medios de pago aceptados oficiales
export const MEDIOS_PAGO_BASE = [
  { nombre: "Efectivo", icon: "fa-money-bill-wave", desc: "Pago en consultorio" },
  { nombre: "Yape", icon: "fa-mobile-screen-button", desc: "Billetera digital" },
  { nombre: "Plin", icon: "fa-mobile-screen-button", desc: "Billetera digital" },
  { nombre: "Transferencia", icon: "fa-building-columns", desc: "BCP / BBVA / Interbank" }
];

// Sedes de atención oficiales
export const SEDES_BASE = [
  {
    id: "miraflores",
    nombre: "Sede Miraflores",
    distrito: "Miraflores",
    direccion: "Av. Alfredo Benavides 620, Edificio Zafiro, Of. 403",
    referencia: "Frente a Caja Municipal Ica · A 2 cuadras de estación Benavides Metropolitano",
    atencion: "Sábados (Previa Cita)",
    atencionEn: "Saturdays (By Appointment)",
    mapsUrl: "https://maps.app.goo.gl/bN1M7QMXRJZeE3zT8?g_st=com.google.maps.preview.copy",
    coordenadas: { lat: -12.1264, lng: -77.0278 },
    tag: "Sede Miraflores",
    tagEn: "Miraflores Office"
  },
  {
    id: "ves",
    nombre: "Sede Lima Sur",
    distrito: "Villa El Salvador",
    direccion: "Av. 3 de Octubre Ruta B, Villa El Salvador",
    referencia: "Céntrico y accesible en Lima Sur",
    atencion: "Lunes a Viernes",
    atencionEn: "Monday to Friday",
    mapsUrl: "#",
    coordenadas: { lat: -12.2167, lng: -76.9333 },
    tag: "Sede Central Sur",
    tagEn: "South Lima Center"
  },
  {
    id: "virtual",
    nombre: "Modalidad Virtual",
    distrito: "Online",
    direccion: "Atención Psicológica Online (Google Meet / Zoom)",
    referencia: "Desde la privacidad y comodidad de tu hogar",
    atencion: "Horarios Flexibles",
    atencionEn: "Flexible Schedule",
    mapsUrl: "#",
    coordenadas: { lat: 0, lng: 0 },
    tag: "100% Online",
    tagEn: "100% Online"
  }
];

// Catálogo Canónico Inicial de Servicios y Terapias Clínicas
export const SERVICIOS_DEFAULT = [
  {
    id: "psicoterapia-individual",
    slug: "psicoterapia-individual",
    nombre: "Psicoterapia Individual (TCC & Contextual)",
    nombreEn: "Individual Psychotherapy (CBT & Contextual)",
    descripcion: "Abordaje empático y científico para el manejo de ansiedad, estrés, depresión, autoestima y duelo.",
    descripcionEn: "Evidence-based therapy for anxiety, stress management, depression, self-esteem, and grief.",
    precioPEN: 85.00,
    duracion: "45 - 60 min",
    duracionEn: "45 - 60 mins",
    categoria: "clinica",
    enfoque: "Cognitivo Conductual / ACT",
    publico: "Adolescentes y Adultos",
    modalidad: "Presencial y Online",
    garantias: [
      "Espacio seguro y 100% confidencial",
      "Herramientas prácticas para tu vida diaria",
      "Seguimiento estructurado de metas"
    ],
    imagen: "/imgwii/Psychologist_listening_in_therapy.jpeg",
    badge: "Más Solicitado",
    badgeEn: "Most Requested",
    tagClase: "badge-serenidad",
    orden: 1,
    pin: true
  },
  {
    id: "terapia-pareja-familiar",
    slug: "terapia-pareja-familiar",
    nombre: "Psicoterapia de Pareja y Familiar",
    nombreEn: "Couples & Family Psychotherapy",
    descripcion: "Espacio de mediación y reconexión emocional con enfoque sistémico y humanista para superar crisis y sanar vínculos.",
    descripcionEn: "Mediation and emotional reconnection with a systemic and humanistic approach to overcome relationship crises.",
    precioPEN: 100.00,
    duracion: "60 min",
    duracionEn: "60 mins",
    categoria: "clinica",
    enfoque: "Sistémico y Humanista",
    publico: "Parejas y Familias",
    modalidad: "Presencial y Online",
    garantias: [
      "Comunicación asertiva y sin juicios",
      "Resolución constructiva de conflictos",
      "Pautas claras de convivencia"
    ],
    imagen: "/imgwii/Couple_having_honest_conversation.jpeg",
    badge: "Recomendado",
    badgeEn: "Recommended",
    tagClase: "badge-serenidad",
    orden: 2,
    pin: true
  },
  {
    id: "terapia-infantil-aprendizaje",
    slug: "terapia-infantil-aprendizaje",
    nombre: "Terapia Infantil y del Aprendizaje",
    nombreEn: "Child Therapy & Learning Support",
    descripcion: "Modificación de conducta, autorregulación emocional, estimulación temprana y Teoría de la Mente para niños con TEA.",
    descripcionEn: "Behavior modification, emotional self-regulation, early intervention, and Theory of Mind for ASD children.",
    precioPEN: 85.00,
    duracion: "45 min",
    duracionEn: "45 mins",
    categoria: "infantil",
    enfoque: "Conductual & Neurodesarrollo",
    publico: "Niños de 3 a 12 años",
    modalidad: "Presencial",
    garantias: [
      "Metodología lúdica y adaptada a cada niño",
      "Acompañamiento e involucramiento familiar",
      "Informes de progreso y pautas para colegio"
    ],
    imagen: "/imgwii/Cartel.jpeg",
    badge: "Especializado",
    badgeEn: "Specialized",
    tagClase: "badge-serenidad",
    orden: 3,
    pin: true
  },
  {
    id: "descarte-tdah-tea",
    slug: "descarte-tdah-tea",
    nombre: "Descarte Diagnóstico TDAH & TEA",
    nombreEn: "ADHD & ASD Diagnostic Screening",
    descripcion: "Evaluación integral neuropsicológica para presunción diagnóstica de Trastorno por Déficit de Atención e Hiperactividad y Espectro Autista.",
    descripcionEn: "Comprehensive neuropsychological screening for Attention Deficit Hyperactivity Disorder and Autism Spectrum.",
    precioPEN: 600.00,
    duracion: "Batería Integral",
    duracionEn: "Complete Battery",
    categoria: "diagnostico",
    enfoque: "Evaluación Estandarizada",
    publico: "Niños, Púberes y Jóvenes",
    modalidad: "Presencial",
    garantias: [
      "Aplicación de baterías clínicas validadas",
      "Entrevista clínica profunda a padres",
      "Informe formal firmado por Psicóloga Colegiada"
    ],
    imagen: "/imgwii/Sofia2.jpg",
    badge: "Diagnóstico Integral",
    badgeEn: "Full Diagnosis",
    tagClase: "badge-oro",
    orden: 4,
    pin: true
  },
  {
    id: "paquete-10-sesiones",
    slug: "paquete-10-sesiones",
    nombre: "Paquete Terapéutico Ahorro (10 Sesiones)",
    nombreEn: "Therapeutic Family Package (10 Sessions)",
    descripcion: "Programa completo de intervención continua. 1ra consulta de 1 hora diagnóstica y 9 sesiones regulares con recomendaciones continuas.",
    descripcionEn: "Complete ongoing intervention program. 1st 1-hour diagnostic session and 9 regular sessions with continuous recommendations.",
    precioPEN: 600.00,
    duracion: "10 Sesiones",
    duracionEn: "10 Sessions",
    categoria: "paquete",
    enfoque: "Acompañamiento Continuo",
    publico: "Todos los casos",
    modalidad: "Presencial y Online",
    garantias: [
      "Ahorro de más del 30% por sesión",
      "1ra sesión de 60 min sin costo adicional",
      "Prioridad de horarios en agenda"
    ],
    imagen: "/imgwii/Couple_holding_hands_in_therapy.jpeg",
    badge: "Mayor Ahorro Familiar",
    badgeEn: "Best Family Value",
    tagClase: "badge-oro",
    orden: 5,
    pin: true
  },
  {
    id: "talleres-steam-adolescentes",
    slug: "talleres-steam-adolescentes",
    nombre: "Talleres Púberes, STEAM y Habilidades Sociales",
    nombreEn: "Teens, STEAM & Social Skills Workshops",
    descripcion: "Talleres grupales de autoestima, comunicación asertiva, amor propio, sexualidad, robótica, oratoria y expresión artística.",
    descripcionEn: "Group workshops on self-esteem, assertive communication, sexuality, robotics, public speaking, and artistic expression.",
    precioPEN: 120.00,
    duracion: "Ciclo Mensual",
    duracionEn: "Monthly Cycle",
    categoria: "talleres",
    enfoque: "Desarrollo de Habilidades Blandas",
    publico: "Púberes y Adolescentes",
    modalidad: "Grupal Presencial",
    garantias: [
      "Socialización guiada y ambiente seguro",
      "Expresión emocional y creatividad",
      "Desarrollo de liderazgo juvenil"
    ],
    imagen: "/imgwii/Woman_speaking_at_wellness_workshop.jpeg",
    badge: "Talleres Grupales",
    badgeEn: "Group Workshops",
    tagClase: "badge-serenidad",
    orden: 6,
    pin: false
  }
];

/**
 * Normaliza cualquier documento de Firestore para servicios/productos
 */
export function normalizarProductoFirestore(docRaw = {}) {
  const item = parseFirestoreDoc(docRaw.fields || {});
  const id = item.id || (docRaw.name ? docRaw.name.split('/').pop() : '');
  const precio = Number(item.precio ?? item.price ?? item.precioPEN ?? 85);
  
  return {
    id,
    slug: item.slug || id,
    nombre: typeof item.nombre === 'object' && item.nombre !== null ? (item.nombre.es || '') : (item.nombre || ''),
    nombreEn: typeof item.nombre === 'object' && item.nombre !== null ? (item.nombre.en || '') : (item.nombreEn || ''),
    descripcion: typeof item.descripcion === 'object' && item.descripcion !== null ? (item.descripcion.es || '') : (item.descripcion || ''),
    descripcionEn: typeof item.descripcion === 'object' && item.descripcion !== null ? (item.descripcion.en || '') : (item.descripcionEn || ''),
    precioPEN: precio,
    duracion: item.duracion || '45 - 60 min',
    duracionEn: item.duracionEn || '45 - 60 mins',
    categoria: item.categoria || 'clinica',
    enfoque: item.enfoque || 'TCC',
    publico: item.publico || 'General',
    modalidad: item.modalidad || 'Presencial y Online',
    garantias: Array.isArray(item.garantias?.es) ? item.garantias.es : (Array.isArray(item.garantias) ? item.garantias : []),
    imagen: item.imagen || '/imgwii/Psychologist_listening_in_therapy.jpeg',
    badge: typeof item.badge === 'object' && item.badge !== null ? (item.badge.es || '') : (item.badge || ''),
    badgeEn: typeof item.badge === 'object' && item.badge !== null ? (item.badge.en || '') : (item.badgeEn || ''),
    tagClase: item.tagClase || 'badge-serenidad',
    orden: Number(item.orden ?? 1),
    pin: Boolean(item.pin)
  };
}

let _productosBuildFirestore = SERVICIOS_DEFAULT;

export async function consultarProductosFirestoreFresco() {
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem('psicologia_servicios');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const projectId = import.meta.env.PUBLIC_FIREBASE_PROJECT_ID || 'psicologiawii';
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/servicios`, {
      signal: controller.signal
    });
    clearTimeout(timer);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.documents) && json.documents.length > 0) {
        const prods = json.documents
          .map(d => normalizarProductoFirestore(d))
          .sort((a, b) => (a.orden || 999) - (b.orden || 999));
        _productosBuildFirestore = prods;
        return prods;
      }
    }
  } catch (err) {
    // Si la colección aún no existe en Firestore, usamos los servicios canónicos
  }

  return _productosBuildFirestore;
}

if (typeof window === 'undefined') {
  await consultarProductosFirestoreFresco();
}

export const datosNegocio = {
  get nombre() { return obtenerDatosNegocio().identidad?.nombre || 'Consultorio Psicológico América'; },
  get nombreCorto() { return obtenerDatosNegocio().identidad?.nombreCorto || 'Psicología América'; },
  get razonSocial() { return obtenerDatosNegocio().identidad?.razonSocial || 'Consultorio Psicológico América'; },
  get registroColegio() { return 'C.Ps.P. N° 34892 · Colegiada y Habilitada'; },
  get especialista() { return 'Lic. Sofía Reynaga'; },
  get logo() { return obtenerDatosNegocio().identidad?.logo || '/imgwii/logo.png'; },
  get logoCircle() { return '/imgwii/logo-circle.png'; },
  get fotoEspecialista() { return '/imgwii/hero.webp'; },
  get imagenSede() { return obtenerDatosNegocio().identidad?.imagenSede || '/imgwii/Psychotherapy_office_interior.jpeg'; },
  get experienciaAnos() { return 6; },
  get telefono() { return obtenerDatosNegocio().contacto?.telefono || '+51 960 332 958'; },
  get telefonoMostrado() { return '+51 960 332 958'; },
  get telefonoLimpio() { return '51960332958'; },
  get whatsapp() { return obtenerDatosNegocio().contacto?.whatsapp || '+51 985 496 463'; },
  get whatsappLimpio() { return '51985496463'; },
  get whatsappMensaje() { return 'Hola Lic. Sofía, deseo agendar una consulta psicológica en Consultorio América.'; },
  get email() { return obtenerDatosNegocio().contacto?.email || 'contacto@psicologiawii.com'; },
  get direccionSede() { return 'Av. Alfredo Benavides 620, Edificio Zafiro, Of. 403, Miraflores'; },
  get distritoSede() { return 'Miraflores'; },
  get ciudad() { return 'Lima'; },
  get pais() { return 'PE'; },
  get mapsUrl() { return 'https://maps.app.goo.gl/bN1M7QMXRJZeE3zT8?g_st=com.google.maps.preview.copy'; },
  get coordenadas() { return { lat: -12.1264, lng: -77.0278 }; },
  get horario() { return 'Lunes a Viernes: 9:00 am - 8:00 pm · Sábados: 9:00 am - 6:00 pm'; },
  get horarioEn() { return 'Mon to Fri: 9:00 am - 8:00 pm · Sat: 9:00 am - 6:00 pm'; },
  get sedes() { return SEDES_BASE; },
  get distritos() {
    return SEDES_BASE.map(s => ({
      id: s.id,
      nombre: s.nombre,
      tiempo: s.atencion,
      tag: s.tag,
      tagEn: s.tagEn
    }));
  },
  get productos() {
    return _productosBuildFirestore && _productosBuildFirestore.length > 0 ? _productosBuildFirestore : SERVICIOS_DEFAULT;
  },
  get servicios() {
    return this.productos;
  },
  get seo() {
    return obtenerDatosNegocio().seo || null;
  },
  get mediosPago() {
    return MEDIOS_PAGO_BASE;
  }
};

export default datosNegocio;