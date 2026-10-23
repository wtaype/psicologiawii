// src/feature/personal/data/personalData.js
// Datos comerciales y de Firebase para el feature Personal
import { datosNegocio } from '@/negocio.js';

export const estadisticasDemo = [
  { 
    id: 'stat1', 
    titulo: 'S/ 80.00', 
    subtitulo: 'Orientación (Precio Web)', 
    icono: 'fa-solid fa-scale-balanced', 
    color: 'orange' 
  },
  { 
    id: 'stat2', 
    titulo: 'S/ 3,450.00', 
    subtitulo: 'Facturado', 
    icono: 'fa-solid fa-file-invoice-dollar', 
    color: 'green' 
  },
  { 
    id: 'stat3', 
    titulo: '48 Clientes', 
    subtitulo: 'Activos en Cartera', 
    icono: 'fa-solid fa-address-book', 
    color: 'blue' 
  },
  { 
    id: 'stat4', 
    titulo: '3 Notas', 
    subtitulo: 'Agenda y Pendientes', 
    icono: 'fa-solid fa-note-sticky', 
    color: 'purple' 
  }
];

export const clientesRecientesDemo = [
  { 
    id: 'c1', 
    nombre: 'Cliente Ejemplo 1', 
    telefono: '', 
    direccion: '', 
    habitual: 'Servicio Habitual', 
    comprobante: 'Comprobante' 
  },
  { 
    id: 'c2', 
    nombre: 'Empresa Ejemplo S.A.C.', 
    telefono: '', 
    direccion: '', 
    habitual: 'Gestión Mensual', 
    comprobante: 'Factura' 
  },
  { 
    id: 'c3', 
    nombre: 'Cliente Ejemplo 2', 
    telefono: '', 
    direccion: '', 
    habitual: 'Trámite Especial', 
    comprobante: 'Boleta' 
  },
  { 
    id: 'c4', 
    nombre: 'Comercial Ejemplo E.I.R.L.', 
    telefono: '', 
    direccion: '', 
    habitual: 'Régimen General', 
    comprobante: 'Factura' 
  }
];

export const notasInicialesDemo = [
  { 
    id: 'n1', 
    tag: 'Urgente', 
    titulo: 'Vencimientos del Mes', 
    texto: 'Revisar declaraciones y obligaciones antes del cierre de mes.', 
    fecha: '', 
    done: false 
  },
  { 
    id: 'n2', 
    tag: 'Trámite', 
    titulo: 'Gestión de Trámites', 
    texto: 'Atender solicitudes pendientes de clientes en plataforma.', 
    fecha: '', 
    done: false 
  },
  { 
    id: 'n3', 
    tag: 'Revisión', 
    titulo: 'Revisión preventiva de notificaciones', 
    texto: 'Auditar mensajes y resoluciones para prevenir contingencias.', 
    fecha: '', 
    done: true 
  }
];
