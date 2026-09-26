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
    id: "talleres-adolescentes",
    slug: "talleres-adolescentes",
    nombre: "Talleres para Púberes y Adolescentes",
    nombreEn: "Workshops for Teens & Adolescents",
    descripcion: "Talleres vivenciales de habilidades sociales, enamoramiento y sexualidad, amor propio y comunicación asertiva en un entorno de confianza.",
    descripcionEn: "Experiential workshops on social skills, relationships, self-esteem, and assertive communication in a safe environment.",
    precioPEN: 120.00,
    duracion: "Ciclo Mensual / Sesiones Grupales",
    duracionEn: "Monthly Cycle / Group Sessions",
    categoria: "taller",
    enfoque: "Habilidades Blandas & Inteligencia Emocional",
    publico: "Púberes y Adolescentes (11 a 17 años)",
    modalidad: "Grupal Presencial",
    garantias: [
      "Espacio de integración seguro y guiado",
      "Dinámicas de autoestima y asertividad",
      "Pautas de orientación para los padres"
    ],
    imagen: "/imgwii/Woman_speaking_at_wellness_workshop.jpeg",
    badge: "Taller Vivencial",
    badgeEn: "Live Workshop",
    tagClase: "badge-serenidad",
    orden: 6,
    pin: true
  },
  {
    id: "charla-inclusion-neurodivergencia",
    slug: "charla-inclusion-neurodivergencia",
    nombre: "Charlas de Inclusión Educativa & Neurodivergencia",
    nombreEn: "Inclusive Education & Neurodivergence Talks",
    descripcion: "Capacitaciones para colegios, docentes y organizaciones sobre acompañamiento a estudiantes con TDAH, TEA y adaptaciones curriculares.",
    descripcionEn: "Training for schools, teachers, and organizations on supporting students with ADHD, ASD, and curricular accommodations.",
    precioPEN: 250.00,
    duracion: "Jornada de 90 a 120 min",
    duracionEn: "90 - 120 min Workshop",
    categoria: "taller",
    enfoque: "Inclusión Escolar & Neurodiversidad",
    publico: "Colegios, Docentes y Empresas",
    modalidad: "Presencial o Virtual",
    garantias: [
      "Material clínico y pedagógico aplicable",
      "Estrategias reales para el aula y hogar",
      "Constancia de participación institucional"
    ],
    imagen: "/imgwii/Psychologist_walking_through_park.jpeg",
    badge: "Para Colegios y Equipos",
    badgeEn: "For Schools & Teams",
    tagClase: "badge-oro",
    orden: 7,
    pin: false
  },
  {
    id: "estimulacion-temprana-infantil",
    slug: "estimulacion-temprana-infantil",
    nombre: "Estimulación Temprana y Psicomotricidad",
    nombreEn: "Early Childhood Stimulation",
    descripcion: "Servicio por horas enfocado en el desarrollo sensorial, cognitivo y afectivo para bebés y niños en su primera infancia.",
    descripcionEn: "Hourly service focused on sensory, cognitive, and emotional development for babies and early childhood.",
    precioPEN: 70.00,
    duracion: "Por Hora / 50 min",
    duracionEn: "Hourly / 50 min",
    categoria: "taller",
    enfoque: "Neurodesarrollo & Estimulación Lúdica",
    publico: "Bebés y Niños (0 a 3 años)",
    modalidad: "Presencial Sede Sur",
    garantias: [
      "Actividades personalizadas a su etapa",
      "Material sensorial adaptado",
      "Guía práctica para mamá y papá en casa"
    ],
    imagen: "/imgwii/Therapist_holding_notebook.jpeg",
    badge: "Por Horas",
    badgeEn: "Hourly Service",
    tagClase: "badge-serenidad",
    orden: 8,
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
  get razonSocial() { return obtenerDatosNegocio().identidad?.nombre || 'Consultorio Psicológico América'; },
  get especialista() { return obtenerDatosNegocio().identidad?.especialista || 'Lic. Sofia Reynaga Pachas'; },
  get colegiatura() { return obtenerDatosNegocio().identidad?.colegiatura || 'C.Ps.P. N° 49425'; },
  get registroColegio() { return `${obtenerDatosNegocio().identidad?.colegiatura || 'C.Ps.P. N° 49425'} · Colegiada y Habilitada`; },
  get titulo() { return obtenerDatosNegocio().identidad?.titulo || 'Licenciada en Psicología'; },
  get grado() { return obtenerDatosNegocio().identidad?.grado || 'Maestrista en Psicología Clínica'; },
  get enfoques() { return obtenerDatosNegocio().identidad?.enfoques || 'TCC • ACT • Psicopedagogía'; },
  get logo() { return obtenerDatosNegocio().identidad?.logo || '/imgwii/logo.webp'; },
  get logoCircle() { return '/imgwii/logo.webp'; },
  get fotoEspecialista() { return obtenerDatosNegocio().identidad?.imagenSede || '/imgwii/hero/psicologa-sofia-reynaga.webp'; },
  get imagenSede() { return obtenerDatosNegocio().identidad?.imagenSede || '/imgwii/hero/psicologa-sofia-reynaga.webp'; },
  get experienciaAnos() { return obtenerDatosNegocio().metricas?.years || '4+'; },
  get telefono() { return obtenerDatosNegocio().contacto?.telefono || '+51 960 332 958'; },
  get telefonoMostrado() { return obtenerDatosNegocio().contacto?.telefono || '+51 960 332 958'; },
  get telefonoLimpio() { return obtenerDatosNegocio().contacto?.telefonoLimpio || '960332958'; },
  get whatsapp() { return obtenerDatosNegocio().contacto?.whatsapp || '51960332958'; },
  get whatsappLimpio() { return obtenerDatosNegocio().contacto?.whatsapp || '51960332958'; },
  get whatsappMensaje() { return obtenerDatosNegocio().contacto?.whatsappMensaje || '¡Hola Lic. Sofia Reynaga! Deseo agendar una consulta psicológica.'; },
  get email() { return obtenerDatosNegocio().contacto?.email || 'reynaga.psychologist@gmail.com'; },
  get direccionSede() { return obtenerDatosNegocio().ubicacion?.direccion || 'Av. Alfredo Benavides 620, Miraflores, Lima'; },
  get distritoSede() { return obtenerDatosNegocio().ubicacion?.distrito || 'Miraflores'; },
  get ciudad() { return obtenerDatosNegocio().ubicacion?.ciudad || 'Lima'; },
  get pais() { return 'PE'; },
  get mapsUrl() { return obtenerDatosNegocio().ubicacion?.mapsUrl || 'https://maps.google.com/?q=Av.+Alfredo+Benavides+620+Miraflores+Lima'; },
  get coordenadas() { return obtenerDatosNegocio().ubicacion?.coordenadas || { lat: -12.1245, lng: -77.0289 }; },
  get horario() { return obtenerDatosNegocio().contacto?.horario || 'Lunes a Sábado: 8:00 a.m. a 8:00 p.m.'; },
  get horarioEn() { return obtenerDatosNegocio().contacto?.horarioEn || 'Monday to Saturday: 8:00 a.m. to 8:00 p.m.'; },
  get sedes() { 
    const customSedes = obtenerDatosNegocio().sedes;
    return Array.isArray(customSedes) && customSedes.length > 0 ? customSedes : SEDES_BASE; 
  },
  get distritos() {
    return this.sedes.map(s => ({
      id: s.id || s.nombre?.toLowerCase().replace(/\s+/g, '-'),
      nombre: s.nombre,
      tiempo: s.modalidad || s.atencion || 'Atención Previa Cita',
      tag: s.modalidad || s.tag || 'Sede',
      tagEn: s.modalidad === 'Virtual' ? 'Online' : 'In-Person'
    }));
  },
  get metricas() {
    return obtenerDatosNegocio().metricas || {
      pacientes: '450+',
      colegiaturaNumero: '49425',
      confidencialidad: '100%',
      satisfaccion: '98%'
    };
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