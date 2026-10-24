// src/semillas/configurar.js
// 🎛️ Tablero de Control Maestro de la Aplicación (Consultorio Psicológico América)
// Configuración centralizada de capacidades, módulos, canales y parámetros globales.
// 100% JS Nativo · 0ms de latencia · Soporta orden posicional natural y comentarios.

// =============================================================================
// 1. SISTEMA & CONTROL DE ACTUALIZACIONES (Estándar Enterprise 6 Dígitos)
// =============================================================================
export const configurarSistema = {
  id: 'psicologiawii',
  modeloNegocio: 'consultorio_psicologico',
  modeloCatalogo: 'servicios', // 'productos' | 'servicios'

  // 🧭 Menú de Navegación Dinámico y Desacoplado
  navegacion: [
    { id: 'hero',        label: { es: 'Inicio',       en: 'Home' },         href: '#hero',        icono: 'fa-house',            color: 'color-brand-blue' },
    { id: 'servicios',   label: { es: 'Especialidades', en: 'Specialties' }, href: '#servicios',   icono: 'fa-brain',            color: 'color-primary' },
    { id: 'talleres',    label: { es: 'Talleres',     en: 'Workshops' },    href: '#talleres',    icono: 'fa-people-group',     color: 'color-emerald' },
    { id: 'paquetes',    label: { es: 'Cotizador',    en: 'Calculator' },   href: '#paquetes',    icono: 'fa-calculator',       color: 'color-gold' },
    { id: 'consultorio', label: { es: 'Consultorio',  en: 'Clinic' },       href: '#consultorio', icono: 'fa-building',         color: 'color-primary' },
    { id: 'mapa-sede',   label: { es: 'Ubicación',    en: 'Location' },     href: '#mapa-sede',   icono: 'fa-location-dot',     color: 'color-brand-blue' },
    { id: 'nosotros',    label: { es: 'Especialista', en: 'Specialist' },   href: '#nosotros',    icono: 'fa-user-doctor',      color: 'color-emerald' },
    { id: 'faq',         label: { es: 'Preguntas',    en: 'FAQ' },          href: '#faq',         icono: 'fa-circle-question',  color: 'color-gold' },
    { id: 'redes',       label: { es: 'Enlaces',      en: 'Bio-Link' },     href: '/redes',       icono: 'fa-link',             color: 'color-brand-blue' }
  ],

  // 🚀 Control de Versión y Despliegues (MMNNPP: 02.00.00 -> 200000)
  version: '2.0.0',
  versionCode: 200000,
  versionNota: 'Golden Boilerplate v2.0: Hub maestro de semillas, Bio-link oficial, 0ms y 14 módulos.',
  actualizado: '2026-10-22',

  // 🛡️ Banderas de Estado del Sistema
  modoDemo: false,              // true = modo presentación (protege datos reales)
  modoMantenimiento: false,     // true = aviso temporal de mantenimiento
  temaDefecto: 'futuro',        // 'futuro' (oscuro) | 'luz' (claro)

  // 💰 Parámetros Clínicos y Comerciales
  parametros: {
    moneda: 'PEN',
    simboloMoneda: 'S/',
    pais: 'PE',
    igvTasa: 0.18,
    modalidades: [
      'Presencial en Consultorio Sede América',
      'Virtual Vía Google Meet (Enlace Privado)'
    ],
    distritosCobertura: [
      'Villa El Salvador',
      'San Juan de Miraflores',
      'Villa María del Triunfo',
      'Surco',
      'Atención Online a Nivel Nacional e Internacional'
    ],
    duracionSesionDefectoMin: 50,
    toleranciaCitaMin: 10,
    regimenesTributarios: [
      'Régimen Cuarta Categoría (Recibo por Honorarios)',
      'Régimen Especial de Renta (RER)',
      'Régimen MYPE Tributario (RMT)'
    ]
  },

  // 🗄️ Colecciones Canónicas de Firestore
  colecciones: {
    usuarios: 'smiles',
    catalogo: 'servicios',
    negocio: 'negocio',
    comprobantes: 'comprobantes',
    soporte: 'soporte',
    correos: 'correos',
    entradas: 'entradas',
    galeria: 'galeria',
    notepad: 'notepad'
  },

  // 🗺️ Rutas Maestras del Sistema
  rutas: {
    inicio: '/',
    login: '/login',
    cliente: '/cliente',
    personal: '/personal',
    redes: '/redes',
    terminos: '/terminos',
    privacidad: '/privacidad',
    roles: {
      cliente: '/cliente',
      personal: '/personal',
      gestor: '/personal',
      admin: '/personal'
    }
  },

  // 🏷️ Terminología Adaptable al Giro Clínico y Terapéutico
  terminologia: {
    catalogoTitulo: 'Especialidades Clínicas & Talleres Vivenciales',
    catalogoTituloCorto: 'Servicios & Talleres',
    catalogoSubtitulo: 'SELECCIONA TU ESPECIALIDAD O TALLER CLÍNICO',
    itemSingular: 'Consulta Psicológica',
    itemsPlural: 'consultas y talleres',
    aliasDireccionDefault: 'Sede / Modalidad',
    selloConfianza: 'COLEGIATURA OFICIAL C.Ps.P. 49425 · ÉTICA Y CONFIDENCIALIDAD',
    selloIcono: 'fa-solid fa-shield-heart',
    garantiaCorta: 'C.Ps.P. N° 49425 · Colegiada y Habilitada',
    grupo1Titulo: 'Especialidades Clínicas (TCC & ACT)',
    grupo2Titulo: 'Talleres Vivenciales de Desarrollo Emocional',
    campoEspecialCliente: 'Motivo de Consulta',
    comprobanteConceptoDefault: 'Atención Psicoterapéutica Individual',
    rolClienteNombre: 'Paciente / Consultante',
    rolPersonalNombre: 'Lic. Sofía Reynaga / Especialista',
    buscadorPlaceholder: 'Buscar especialidad, taller, terapia de pareja, ansiedad...',
    notaPedidoPlaceholder: 'Indica brevemente el motivo de tu consulta o tu disponibilidad de horario...',
    modalidadDefecto: 'Presencial en Consultorio Sede América',
    modalidadLabel: 'Sesión de 50 minutos con especialista colegiada',
    enfoqueDefecto: 'Terapia Cognitivo-Conductual y ACT basada en evidencia',
    btnWhatsapp: 'WhatsApp Citas',
    directorioTitulo: 'Directorio de Pacientes & Consultantes',
    directorioSub: 'Gestión centralizada de consultantes con historial de sesiones y contacto directo por WhatsApp.'
  }
};

// =============================================================================
// 2. MÓDULOS DE PERSONAL (Backoffice - 14 Módulos Oficiales)
// El orden en pantalla es exactamente la posición en el array (Alt + ↑ / ↓)
// Iconos: nombre directo ('store') o 'fab:marca' para redes ('fab:whatsapp')
// =============================================================================
export const configurarPersonal = {
  moduloDefecto: 'dashboard',
  modulos: [
    { id: 'dashboard', nombre: 'Dashboard',   icono: 'chart-pie',           activo: true },
    { id: 'negocio',   nombre: 'Consultorio', icono: 'hospital-user',       activo: true },
    { id: 'productos', nombre: 'Servicios',   icono: 'brain',               activo: true },
    { id: 'clientes',  nombre: 'Pacientes',   icono: 'address-book',        activo: true, badge: '48' },
    { id: 'whatsapp',  nombre: 'WhatsApp',    icono: 'fab:whatsapp',        activo: true },
    { id: 'notepad',   nombre: 'Notepad',     icono: 'note-sticky',         activo: true },
    { id: 'sunat',     nombre: 'Honorarios',  icono: 'file-invoice-dollar', activo: true },
    { id: 'correo',    nombre: 'Correo',      icono: 'envelope',            activo: true },
    { id: 'galeria',   nombre: 'Galería',     icono: 'images',              activo: true },
    { id: 'entradas',  nombre: 'Artículos',   icono: 'newspaper',           activo: true },
    { id: 'paginas',   nombre: 'Páginas',     icono: 'file-lines',          activo: true },
    { id: 'personal',  nombre: 'Equipo',      icono: 'users',               activo: true },
    { id: 'perfil',    nombre: 'Mi perfil',   icono: 'user-gear',           activo: true },
    { id: 'ajustes',   nombre: 'Ajustes',     icono: 'gear',                activo: true },

    { id: 'ayuda',     nombre: 'Ayuda',       icono: 'headset',             activo: true },
    { id: 'aprender',  nombre: 'Aprender',    icono: 'graduation-cap',      activo: true }
  ]
};

// =============================================================================
// 3. MÓDULOS DE CLIENTE (Portal del Paciente)
// =============================================================================
export const configurarCliente = {
  moduloDefecto: 'sesiones',
  modulos: [
    { id: 'sesiones', nombre: 'Mis Sesiones', icono: 'calendar-days', activo: true },
    { id: 'pedidos',  nombre: 'Agendar Cita', icono: 'calendar-plus', activo: true },
    { id: 'recursos', nombre: 'Mis Recursos', icono: 'book-medical', activo: true, badge: '4' },
    { id: 'cuenta',   nombre: 'Mi Ficha',     icono: 'id-card-clip', activo: true },
    { id: 'soporte',  nombre: 'Soporte',      icono: 'headset',      activo: true }
  ]
};

// =============================================================================
// 4. CANALES DE REDES (Bio-Link Oficial & Enlaces Directos)
// =============================================================================
export const configurarRedes = {
  canales: [
    { id: 'whatsapp',  nombre: 'WhatsApp Citas', icono: 'fab:whatsapp',    badge: 'Atención Inmediata',  activo: true },
    { id: 'telefono',  nombre: 'Llamada Directa',icono: 'phone',           badge: '+51 960 332 958',     activo: true },
    { id: 'web',       nombre: 'Web Oficial',    icono: 'globe',           badge: 'Portal Online',       activo: true },
    { id: 'facebook',  nombre: 'Facebook',      icono: 'fab:facebook-f',  badge: 'Comunidad & Artículos',activo: true },
    { id: 'instagram', nombre: 'Instagram',     icono: 'fab:instagram',   badge: '@psicologia.america', activo: true },
    { id: 'tiktok',    nombre: 'TikTok',        icono: 'fab:tiktok',      badge: 'Salud Mental & Tips', activo: true },
    { id: 'maps',      nombre: 'Sede Consultorio',icono: 'location-dot',   badge: 'Ruta B, V.E.S.',      activo: true }
  ]
};

// =============================================================================
// 5. HELPERS INTELIGENTES DE ALTO RENDIMIENTO (0ms)
// =============================================================================

/**
 * Resuelve la clase FontAwesome normalizando 'chart-pie' a 'fa-solid fa-chart-pie'
 * o 'fab:whatsapp' a 'fa-brands fa-whatsapp'
 * @param {string} ico
 * @returns {string}
 */
export const resolverIcono = (ico = '') => {
  if (!ico) return '';
  if (ico.includes('fa-')) return ico;
  if (ico.startsWith('fab:')) return `fa-brands fa-${ico.slice(4)}`;
  return `fa-solid fa-${ico}`;
};

/**
 * Consulta si un módulo de Personal está activo en el sistema
 * @param {string} id - Identificador del módulo ('sunat', 'correo', etc.)
 * @returns {boolean}
 */
export const tieneCapacidad = (id) =>
  configurarPersonal.modulos.some(m => m.id === id && m.activo);

/**
 * Obtiene los módulos activos de Personal en su orden posicional natural.
 * Inyecta icono e iconoClase resueltos para 100% retrocompatibilidad.
 * @returns {Array}
 */
export const getModulosPersonal = () =>
  configurarPersonal.modulos
    .filter(m => m.activo)
    .map(m => {
      const iconoResuelto = resolverIcono(m.icono);
      return {
        ...m,
        icono: iconoResuelto,
        iconoClase: iconoResuelto
      };
    });

/**
 * Obtiene los módulos activos del Portal de Pacientes
 * @returns {Array}
 */
export const getModulosCliente = () =>
  configurarCliente.modulos
    .filter(m => m.activo)
    .map(m => {
      const iconoResuelto = resolverIcono(m.icono);
      return {
        ...m,
        icono: iconoResuelto,
        iconoClase: iconoResuelto
      };
    });

/**
 * Obtiene los canales de redes activos
 * @returns {Array}
 */
export const getCanalesRedes = () =>
  configurarRedes.canales
    .filter(c => c.activo)
    .map(c => ({
      ...c,
      icono: resolverIcono(c.icono)
    }));
