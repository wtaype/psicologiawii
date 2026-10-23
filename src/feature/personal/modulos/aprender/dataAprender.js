// src/feature/personal/modulos/aprender/dataAprender.js
// Centro de Conocimiento & Documentación de Alto Valor para el Dueño
// 100% Amigable, Explicaciones con Ejemplos Reales, Iconos Font Awesome y Paleta Noble witema.css

export const top7Temas = [
  {
    id: 'wii-links',
    icono: 'fa-solid fa-link',
    titulo: 'General · Wii Links',
    subtitulo: 'Tus 6 portales web oficiales para compartir con clientes y redes',
    tipoSeccion: 'links',
    descripcion: 'Aquí tienes centralizados todos los enlaces oficiales de tu empresa. Puedes abrirlos directamente para ver cómo los ven tus clientes o presionar "Copiar enlace" para enviarlos por WhatsApp o pegarlos en tus redes sociales.',
    consejoRapido: 'Ejemplo práctico: Cuando un cliente te pida cotización por WhatsApp, en lugar de escribir todo un texto largo, copia tu enlace del Portal de Clientes o tu Web Oficial y envíaselo en 1 segundo.',
    enlaces: [
      {
        id: 'cliente',
        ruta: '/cliente',
        nombre: 'Portal Privado de Clientes',
        badge: 'Exclusivo Clientes',
        icono: 'fa-solid fa-address-book',
        descripcion: 'El espacio privado donde tus clientes consultan sus cotizaciones, estados de pedidos, comprobantes y soporte sin tener que llamarte a cada rato.'
      },
      {
        id: 'redes',
        ruta: '/redes',
        nombre: 'Página de Enlaces & Bio-Link',
        badge: 'Link in Bio',
        icono: 'fa-solid fa-share-nodes',
        descripcion: 'Tu tarjeta digital oficial. Pega este enlace en la biografía de tu Instagram, TikTok, LinkedIn o estados de WhatsApp para que nadie se pierda.'
      },
      {
        id: 'libro-reclamaciones',
        ruta: '/libro-reclamaciones',
        nombre: 'Libro de Reclamaciones',
        badge: 'Legal Obligatorio',
        icono: 'fa-solid fa-book',
        descripcion: 'Formulario oficial exigido por ley para que tus usuarios registren quejas de forma formal y transparente. Envía constancia automática por correo.'
      },
      {
        id: 'inicio',
        ruta: '/',
        nombre: 'Portal Web Principal',
        badge: 'Página Web Oficial',
        icono: 'fa-solid fa-globe',
        descripcion: 'La fachada principal de tu negocio en Internet: landing page con tus servicios o productos destacados, cotizadores interactivos y reputación.'
      },
      {
        id: 'contacto',
        ruta: '/contacto',
        nombre: 'Página de Contacto & Sedes',
        badge: 'Atención Directa',
        icono: 'fa-solid fa-envelope-open-text',
        descripcion: 'Dirección física con mapa interactivo de Google Maps, horarios oficiales de atención y botón directo a tu WhatsApp de ventas.'
      },
      {
        id: 'privacidad',
        ruta: '/privacidad',
        nombre: 'Políticas & Privacidad',
        badge: 'Transparencia Legal',
        icono: 'fa-solid fa-shield-halved',
        descripcion: 'Términos de servicio y políticas de protección de datos personales conforme a la ley. Te brinda total respaldo y seriedad comercial.'
      }
    ]
  },

  {
    id: 'preguntas-dueno',
    icono: 'fa-solid fa-circle-question',
    titulo: 'Preguntas del Dueño',
    subtitulo: '10 dudas clave y respuestas prácticas para el día a día',
    tipoSeccion: 'faq',
    descripcion: 'Poniéndonos en tu lugar como dueño del negocio, recopilamos las 10 preguntas más importantes que surgen al administrar tu sistema web, explicadas en sencillo y sin enredos técnicos.',
    preguntas: [
      {
        num: '01',
        pregunta: '¿Cómo actualizo mi número de WhatsApp, teléfono o dirección?',
        respuesta: 'Entra al módulo **Mi negocio** en el menú izquierdo. Modifica el campo de WhatsApp o Dirección y haz clic en **Guardar Cambios** en la parte superior. \n\n*Ejemplo:* Si cambiaste de chip o tienes un nuevo número de ventas, lo cambias una sola vez en Mi Negocio y automáticamente se actualiza en el Hero, en los botones flotantes de WhatsApp, en el Catálogo y en la página de Contacto.',
        icono: 'fa-brands fa-whatsapp'
      },
      {
        num: '02',
        pregunta: '¿Qué pasa si no tengo una red social (ej. YouTube) o la dejo vacía?',
        respuesta: 'Tu sistema es **100% Inteligente (Smart)**: si dejas un campo vacío o con `""`, ese botón **desaparece solo** tanto de tu web pública como de tu página de enlaces (`/redes`). \n\n*Ejemplo:* Si solo tienes WhatsApp, Instagram y LinkedIn, tu página mostrará únicamente esos 3 botones elegantes. Jamás quedarán botones vacíos, enlaces rotos ni textos feos de "en construcción".',
        icono: 'fa-solid fa-wand-magic-sparkles'
      },
      {
        num: '03',
        pregunta: '¿Cómo cambio el orden de los botones en mi Bio-Link (/redes)?',
        respuesta: 'En el módulo **Mi negocio**, cada red social tiene un tirador lateral para **arrastrar y soltar (Drag & Drop)** con el mouse o tu dedo en el celular, además de botones **Subir** y **Bajar**. \n\n*Ejemplo:* Si este mes tu mayor fuente de ventas es WhatsApp o LinkedIn, sube esos canales al puesto #1 y #2 con un toque. Luego presiona "Guardar Cambios" y el orden se actualiza de inmediato.',
        icono: 'fa-solid fa-up-down-left-right'
      },
      {
        num: '04',
        pregunta: '¿Cómo acceden mis clientes a su portal privado en /cliente?',
        respuesta: 'Tus clientes solo necesitan ingresar a `/cliente` e ingresar su número de teléfono celular o correo electrónico registrado. \n\n*Ejemplo:* Un cliente te pregunta: "¿Cuánto fue mi cotización del mes pasado?". Solo le dices: "Ingresa a nuestra web en la sección Clientes con tu número de teléfono y ahí tienes tu historial completo en PDF".',
        icono: 'fa-solid fa-user-lock'
      },
      {
        num: '05',
        pregunta: '¿Cómo se guardan mis cambios y cómo los publico en Internet?',
        respuesta: 'Tu sistema tiene dos capas de seguridad: \n1. **Guardado en la Nube:** Al presionar "Guardar Cambios", los datos se suben a tu base de datos Firebase Firestore protegida. \n2. **Publicación Global:** Cuando el sistema te pregunte si deseas actualizar la web pública, confirmas y se compila una versión ultrarrápida en la red mundial de Cloudflare.',
        icono: 'fa-solid fa-cloud-arrow-up'
      },
      {
        num: '06',
        pregunta: '¿Por qué a veces hago un cambio y en mi celular sigo viendo lo anterior?',
        respuesta: 'Los teléfonos celulares guardan una "memoria temporal" (caché) para ahorrar megas y no volver a descargar la página. \n\n*Cómo resolverlo:* En tu computadora presiona `Ctrl + F5` para obligar al navegador a descargar lo más nuevo. En tu celular, abre una pestaña en modo incógnito o borra el historial reciente para ver los cambios de inmediato.',
        icono: 'fa-solid fa-rotate'
      },
      {
        num: '07',
        pregunta: '¿Puedo usar mi panel si se corta el Internet o tengo mala señal?',
        respuesta: '¡Sí, totalmente! Tu sistema cuenta con tecnología **Local-First**: todo lo que escribes se guarda en la memoria interna de tu dispositivo al instante (0ms). Puedes seguir redactando notas o revisando datos. En cuanto recuperes señal, el sistema sincroniza todo en silencio con la nube.',
        icono: 'fa-solid fa-wifi'
      },
      {
        num: '08',
        pregunta: '¿Cómo descargo una copia de seguridad (backup) de todos mis datos?',
        respuesta: 'Ve al módulo **Ajustes** en el menú izquierdo y haz clic en el botón **Exportar Copia de Respaldo JSON**. En 1 segundo se descargará un archivo liviano con todos los clientes, productos, configuraciones y notas de tu empresa.',
        icono: 'fa-solid fa-download'
      },
      {
        num: '09',
        pregunta: '¿Mis datos y los de mis clientes están protegidos contra hackeos?',
        respuesta: 'Absolutamente. La web pública está construida con arquitectura estática (Jamstack), lo que significa que **no hay base de datos expuesta al público** que los hackers puedan atacar con inyecciones SQL. Además, todo el tráfico cuenta con candado de seguridad SSL cifrado por Cloudflare y Google.',
        icono: 'fa-solid fa-shield-virus'
      },
      {
        num: '10',
        pregunta: '¿Cómo agrego un nuevo servicio o cambio un precio?',
        respuesta: 'Ingresa al módulo **Productos** en el menú lateral. Haz clic en "Nuevo Producto/Servicio", escribe el nombre, precio, descripción e imagen y guarda. Se reflejará automáticamente en tu catálogo y cotizador en línea.',
        icono: 'fa-solid fa-tag'
      }
    ]
  },

  {
    id: 'documentacion-sistema',
    icono: 'fa-solid fa-book-bookmark',
    titulo: 'Documentación del Sistema',
    subtitulo: 'Entiende la tecnología que impulsa tu negocio sin tecnicismos difíciles',
    tipoSeccion: 'doc',
    descripcion: 'Tu plataforma no es una página web tradicional y lenta de las que se caen a cada rato. Está construida sobre una arquitectura moderna de 3 pilares que garantiza que tu negocio nunca se detenga.',
    pilares: [
      {
        paso: '1',
        titulo: 'Velocidad Local-First (0ms)',
        icono: 'fa-solid fa-bolt',
        color: 'var(--brand-primary)',
        subtitulo: 'Trabajas al instante sin esperas',
        explicacion: 'Cada vez que navegas entre módulos, escribes una nota o actualizas un teléfono, la respuesta es inmediata (cero segundos de espera). Tu navegador guarda la información localmente para que nunca veas la molesta ruedita de carga girando.',
        analogia: 'Analogía: Es como tener tu cuaderno de notas en tu propio escritorio en lugar de tener que viajar a una oficina lejana cada vez que quieres escribir una palabra.'
      },
      {
        paso: '2',
        titulo: 'Base de Datos Firebase Firestore (Google)',
        icono: 'fa-solid fa-cloud-arrow-up',
        color: 'var(--brand-primary)',
        subtitulo: 'Respaldo seguro en tiempo real',
        explicacion: 'Cuando presionas "Guardar Cambios", tus datos se sincronizan con los servidores seguros de Google en la nube. Si abres tu panel en tu laptop y luego en tu celular, ambos dispositivos verán exactamente lo mismo.',
        analogia: 'Analogía: Funciona igual que Google Drive o WhatsApp Web: lo que escribes en un lado aparece respaldado en el otro.'
      },
      {
        paso: '3',
        titulo: 'Red Global Cloudflare Edge CDN',
        icono: 'fa-solid fa-rocket',
        color: 'var(--brand-primary)',
        subtitulo: 'Nota 100 en Google Speed en todo el mundo',
        explicacion: 'Tu página pública no se procesa en un servidor viejo y lento. Se compila en archivos estáticos ultralivianos que se distribuyen en más de 300 centros de datos en todo el planeta. Un cliente en Lima, Madrid o Miami la abre en menos de 0.8 segundos.',
        analogia: 'Analogía: En vez de tener una sola tienda en una esquina lejana, es como tener una sucursal en cada esquina del mundo lista para atender a tu cliente.'
      }
    ]
  },

  {
    id: 'comparar-wii',
    icono: 'fa-solid fa-scale-balanced',
    titulo: 'Comparar · Wii vs Otros',
    subtitulo: 'La comparativa real frente a WordPress, Wix y páginas tradicionales',
    tipoSeccion: 'comparar',
    descripcion: 'Muchos dueños de negocio sufren dolores de cabeza con páginas web tradicionales: páginas lentas que espantan clientes, hackeos constantes, plugins desactualizados que rompen el sitio y cobros mensuales elevados de servidores que se caen.',
    tabla: [
      {
        criterio: 'Velocidad de Carga en Celular',
        wii: 'Nota 100/100 en Google Speed (menos de 0.8s)',
        wiiEsBueno: true,
        otros: 'Muy lento (30-50/100, demora de 3 a 7 segundos)',
        impacto: 'El 53% de clientes abandona una página si demora más de 3 segundos en abrir.'
      },
      {
        criterio: 'Seguridad contra Hackeos',
        wii: '100% Blindado: Cero base de datos expuesta al público',
        wiiEsBueno: true,
        otros: 'Frecuentemente hackeado por plugins desactualizados',
        impacto: 'Tranquilidad total para tu negocio y la información de tus clientes.'
      },
      {
        criterio: 'Mantenimiento Técnico',
        wii: 'Cero mantenimiento: No requiere actualizar plugins ni parches',
        wiiEsBueno: true,
        otros: 'Requiere pagar mantenimiento mensual para que no se caiga',
        impacto: 'Ahorras cientos de dólares al año en pagos de soporte técnico innecesarios.'
      },
      {
        criterio: 'Funcionamiento sin Internet',
        wii: 'Funciona 100% offline gracias a Local-First',
        wiiEsBueno: true,
        otros: 'Se congela la pantalla y pierdes lo que escribiste',
        impacto: 'Puedes seguir atendiendo clientes y revisando datos en cualquier lugar.'
      },
      {
        criterio: 'Control de tus Datos',
        wii: 'Descarga tu backup en archivo JSON en 1 segundo',
        wiiEsBueno: true,
        otros: 'Tus datos quedan atrapados en bases de datos difíciles de migrar',
        impacto: 'Tus datos te pertenecen al 100%, sin ataduras con nadie.'
      },
      {
        criterio: 'Posicionamiento en Google (SEO)',
        wii: 'Estructura semántica nativa Schema.org de alta calidad',
        wiiEsBueno: true,
        otros: 'Código sucio y sobrecargado que Google penaliza',
        impacto: 'Apareces más arriba en los resultados de búsqueda de tu ciudad.'
      }
    ]
  },

  {
    id: 'transparencia-datos',
    icono: 'fa-solid fa-shield-halved',
    titulo: 'Transparencia & Soberanía',
    subtitulo: 'Tus datos son 100% tuyos: privacidad, respaldo en 1 clic y cero ataduras',
    tipoSeccion: 'transparencia',
    descripcion: 'En Sistema Wii creemos en la soberanía absoluta del dueño del negocio. A diferencia de otras empresas que te "secuestran" la página web para cobrarte mensualidades obligatorias, aquí tú tienes el control total.',
    puntosClave: [
      {
        titulo: 'Tus Datos Te Pertenecen al 100%',
        icono: 'fa-solid fa-key',
        texto: 'Todos los clientes que registres, los servicios que agregues y las notas que escribas son de tu propiedad. En cualquier momento puedes ir al módulo Ajustes y hacer clic en "Exportar Copia de Respaldo JSON" para tener tu archivo completo en tu computadora.'
      },
      {
        titulo: 'Cero Letras Chiquitas ni Ataduras',
        icono: 'fa-solid fa-handshake',
        texto: 'Tu sistema está empaquetado con código limpio estándar de la industria. Si en el futuro deseas migrar o clonar la plataforma para otra empresa o sucursal, el código y los datos son completamente portables.'
      },
      {
        titulo: 'Cifrado SSL de Grado Bancario',
        icono: 'fa-solid fa-lock',
        texto: 'Toda la comunicación entre tu navegador, tus clientes y el servidor viaja a través de túneles encriptados con certificados SSL TLS 1.3 de Cloudflare. Nadie puede interceptar llamadas, cotizaciones ni formularios.'
      },
      {
        titulo: 'Cumplimiento con la Ley de Datos Personales',
        icono: 'fa-solid fa-scale-balanced',
        texto: 'Tu sistema ya incluye por defecto la página de Políticas de Privacidad conforme a la Ley N° 29733 (Ley de Protección de Datos Personales en el Perú) y normativa internacional, garantizando que puedas hacer publicidad digital sin riesgos de multas.'
      }
    ],
    accionBackup: {
      titulo: 'Descargar Copia de Respaldo Ahora',
      url: '/personal/ajustes',
      textoBtn: 'Ir a Ajustes para Descargar Backup JSON'
    }
  },

  {
    id: 'acerca-nosotros',
    icono: 'fa-solid fa-handshake-angle',
    titulo: 'Acerca de Nosotros',
    subtitulo: 'El equipo de ingeniería que respalda tu tecnología y cómo pedir ayuda',
    tipoSeccion: 'acerca',
    descripcion: 'Detrás de tu plataforma hay un equipo de ingeniería de software enfocado en una sola misión: darle a los profesionales y empresas peruanas herramientas digitales de nivel mundial que realmente generen ventas y ahorren tiempo.',
    valores: [
      {
        titulo: 'Obsesión por la Velocidad (0ms)',
        icono: 'fa-solid fa-gauge-high',
        texto: 'No toleramos plataformas lentas que hacen perder tiempo al dueño ni a sus clientes. Diseñamos cada pantalla para que abra al instante.'
      },
      {
        titulo: 'Simplicidad para el Dueño',
        icono: 'fa-solid fa-heart',
        texto: 'La tecnología debe quitarte preocupaciones, no creártelas. Todo en tu panel está pensado para que se entienda en español sencillo en menos de 2 minutos.'
      },
      {
        titulo: 'Acompañamiento y Soporte Técnico',
        icono: 'fa-solid fa-headset',
        texto: 'Si en algún momento tienes una duda técnica o necesitas ayuda con un módulo, tienes acceso directo al módulo Ayuda y a nuestro correo oficial de ingeniería.'
      }
    ],
    soporteDirecto: {
      correo: 'soporte@widominio.com',
      modulo: '/personal/ayuda',
      mensaje: 'Para cualquier consulta técnica, reporte de mejora o asesoría en tu plataforma, puedes generar un ticket en el módulo Ayuda.'
    }
  },

  {
    id: 'atajos-productividad',
    icono: 'fa-solid fa-keyboard',
    titulo: 'Atajos & Productividad',
    subtitulo: 'Cómo gestionar todo tu negocio en 5 minutos al día con trucos sencillos',
    tipoSeccion: 'atajos',
    descripcion: 'Tu tiempo como dueño es lo más valioso que tienes. Hemos integrado atajos inteligentes para que realices tus tareas diarias volando sin tener que buscar botones con el ratón.',
    atajos: [
      {
        teclas: 'Ctrl + S',
        mac: '⌘ + S',
        icono: 'fa-solid fa-floppy-disk',
        nombre: 'Guardar de Inmediato',
        explicacion: 'Guarda los cambios del módulo en el que te encuentras (datos de negocio, notas, etc.) en menos de 1 segundo sin mover el mouse hacia el botón de guardar.'
      },
      {
        teclas: 'Ctrl + K',
        mac: '⌘ + K',
        icono: 'fa-solid fa-magnifying-glass',
        nombre: 'Buscar en Todo el Panel',
        explicacion: 'Enfoca automáticamente el buscador general superior para encontrar clientes, cotizaciones o páginas rápidamente.'
      },
      {
        teclas: 'Esc',
        mac: 'Escape',
        icono: 'fa-solid fa-xmark',
        nombre: 'Cerrar Ventana o Menú',
        explicacion: 'Cierra cualquier ventana emergente (modal) o el menú lateral en tu celular con un solo toque.'
      },
      {
        teclas: 'Ctrl + F5',
        mac: '⌘ + Shift + R',
        icono: 'fa-solid fa-rotate',
        nombre: 'Recarga Limpia de Web',
        explicacion: 'Fuerza a tu navegador a descargar la versión más fresca de tu sitio web público sin usar la caché vieja.'
      }
    ],
    reglasOro: [
      'Regla 1: Guarda periódicamente con Ctrl + S mientras editas textos largos.',
      'Regla 2: Mantén tu WhatsApp de contacto siempre actualizado en Mi Negocio.',
      'Regla 3: Si no usas una red social, déjala vacía; el sistema la ocultará sola.',
      'Regla 4: Descarga un backup JSON en Ajustes a fin de mes para tu propia tranquilidad.'
    ]
  }
];

export default {
  top7Temas
};
