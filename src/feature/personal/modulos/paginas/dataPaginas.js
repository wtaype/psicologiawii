// src/feature/personal/modulos/paginas/dataPaginas.js
// Gestor de Contenido Institucional y Metadata SEO de Páginas (Solgas Surquillo)
// 100% JS Nativo · Integrado con @widev y Local-First

import { getls, savels } from '@widev';

const STORAGE_KEY = 'gaswii_paginas_institucionales';

const PAGINAS_SEMILLA = [
  {
    id: 'pg_home',
    ruta: '/',
    nombre: 'Inicio · Portada Principal',
    icono: 'fa-solid fa-house',
    h1: 'Solgas Surquillo · Balón de Gas a Domicilio en 15 Minutos',
    subtitulo: 'Distribuidor oficial Solgas en Jr. Dante 260. Balanzas digitales calibradas Inacal y peso exacto.',
    metaTitle: 'Balón de Gas a Domicilio en Surquillo · Solgas Oficial en 15 Min',
    metaDesc: 'Pide tu balón de gas Solgas en Surquillo al 936 369 384. Balón de 10kg y 45kg con balanza digital, prueba de fugas y entrega express en 15 min.',
    telefono: '936 369 384',
    horario: 'Lunes a Domingo: 6:00 AM – 10:00 PM',
    ultimaModificacion: '25 Sep 2026'
  },
  {
    id: 'pg_acerca',
    ruta: '/acerca',
    nombre: 'Acerca de Nosotros',
    icono: 'fa-solid fa-users',
    h1: 'Más de 15 años abasteciendo de energía limpia y segura a Surquillo',
    subtitulo: 'Historia, compromiso de seguridad y garantía de planta de nuestra distribuidora en Jr. Dante.',
    metaTitle: 'Nosotros · Distribuidor Oficial Solgas Surquillo Jr. Dante 260',
    metaDesc: 'Conoce a la distribuidora oficial de Solgas en Surquillo. Compromiso con el peso exacto, seguridad certificada y atención rápida a hogares y restaurantes.',
    telefono: '936 369 384',
    horario: 'Lunes a Sábado: 6:00 AM – 10:00 PM',
    ultimaModificacion: '24 Sep 2026'
  },
  {
    id: 'pg_contacto',
    ruta: '/contacto',
    nombre: 'Contacto y Central de Pedidos',
    icono: 'fa-solid fa-phone',
    h1: 'Llámanos o escríbenos al WhatsApp para tu pedido inmediato',
    subtitulo: 'Central telefónica directa, ubicación en Jr. Dante 260 y atención de emergencias de gas GLP.',
    metaTitle: 'Contacto y Delivery de Gas · Solgas Surquillo WhatsApp 936 369 384',
    metaDesc: 'Comunícate con nuestra central de pedidos de gas en Surquillo. Atención telefónica y por WhatsApp para entregas rápidas en Surquillo, Miraflores y San Borja.',
    telefono: '936 369 384',
    horario: 'Atención continua 365 días al año',
    ultimaModificacion: '22 Sep 2026'
  },
  {
    id: 'pg_libro',
    ruta: '/libro-reclamaciones',
    nombre: 'Libro de Reclamaciones',
    icono: 'fa-solid fa-book',
    h1: 'Libro de Reclamaciones Virtual Conforme a Ley N° 29571',
    subtitulo: 'Canal oficial para el registro de quejas o reclamos de nuestros clientes.',
    metaTitle: 'Libro de Reclamaciones Virtual · Solgas Surquillo RUC 20601234567',
    metaDesc: 'Presenta tu reclamo o queja conforme a la normativa de Indecopi. Respuesta formal garantizada en el plazo legal establecido.',
    telefono: '936 369 384',
    horario: 'Atención virtual 24/7',
    ultimaModificacion: '18 Sep 2026'
  },
  {
    id: 'pg_terminos',
    ruta: '/terminos',
    nombre: 'Términos y Condiciones',
    icono: 'fa-solid fa-file-contract',
    h1: 'Condiciones de Comercialización y Entrega de Gas GLP',
    subtitulo: 'Términos de servicio para entregas a domicilio, medios de pago y garantías de cilindros.',
    metaTitle: 'Términos y Condiciones de Servicio · Solgas Surquillo',
    metaDesc: 'Conoce los términos y condiciones de compra, cambio de cilindros, políticas de pago contra entrega y garantía oficial Solgas.',
    telefono: '936 369 384',
    horario: 'Actualizado según normativa Osinergmin',
    ultimaModificacion: '15 Sep 2026'
  },
  {
    id: 'pg_privacidad',
    ruta: '/privacidad',
    nombre: 'Políticas de Privacidad',
    icono: 'fa-solid fa-shield-halved',
    h1: 'Tratamiento y Protección de Datos Personales',
    subtitulo: 'Compromiso de confidencialidad conforme a la Ley N° 29733 de Protección de Datos Personales.',
    metaTitle: 'Política de Privacidad y Protección de Datos · Solgas Surquillo',
    metaDesc: 'Información sobre el uso seguro y confidencial de tus datos de entrega y facturación en Solgas Surquillo.',
    telefono: '936 369 384',
    horario: 'Protección con encriptación',
    ultimaModificacion: '15 Sep 2026'
  }
];

export function obtenerPaginas() {
  const guardadas = getls(STORAGE_KEY);
  if (guardadas && Array.isArray(guardadas) && guardadas.length > 0) {
    return guardadas;
  }
  savels(STORAGE_KEY, PAGINAS_SEMILLA);
  return PAGINAS_SEMILLA;
}

export function guardarPagina(paginaData) {
  const paginas = obtenerPaginas();
  const idx = paginas.findIndex(p => p.id === paginaData.id);

  const actualizado = {
    ...paginaData,
    ultimaModificacion: 'Hoy'
  };

  if (idx >= 0) {
    paginas[idx] = { ...paginas[idx], ...actualizado };
  } else {
    paginas.push(actualizado);
  }

  savels(STORAGE_KEY, paginas);
  return paginas[idx >= 0 ? idx : paginas.length - 1];
}
