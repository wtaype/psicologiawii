// src/feature/personal/modulos/personal/dataPersonal.js
// Gestor de Personal Operativo, Repartidores y Flota de Solgas Surquillo
// Sincronizado con colección Firestore 'smiles' (rol: 'personal') + Local-First
// 100% JS Nativo · Integrado con @widev

import { getls, savels } from '@widev';

const STORAGE_KEY = 'gaswii_equipo_personal';

const PERSONAL_SEMILLA = [
  {
    id: 'per_01',
    uid: 'usr_per_juan_01',
    nombre: 'Juan Quispe',
    apellidos: 'Mamani',
    usuario: 'juanq',
    celular: '936369384',
    email: 'jquispe.reparto@gmail.com',
    documentoTipo: 'DNI',
    documento: '45892147',
    rol: 'personal',
    cargo: 'Conductor Motorizado Líder',
    vehiculoTipo: 'Moto de Carga GLP',
    placa: '6741-4B',
    capacidadBalones: 4,
    cuadrante: 'Surquillo Centro & Dante',
    estadoTurno: 'disponible', // 'disponible' | 'en_ruta' | 'descanso'
    entregasHoy: 12,
    calificacion: 4.9,
    activo: true,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'per_02',
    uid: 'usr_per_carlos_02',
    nombre: 'Carlos Ramos',
    apellidos: 'Torres',
    usuario: 'carlosr',
    celular: '984512340',
    email: 'cramos.gaswii@gmail.com',
    documentoTipo: 'DNI',
    documento: '71204589',
    rol: 'personal',
    cargo: 'Repartidor Express',
    vehiculoTipo: 'Moto de Carga GLP',
    placa: '3819-2C',
    capacidadBalones: 4,
    cuadrante: 'Barrio Médico & San Borja Sur',
    estadoTurno: 'en_ruta',
    entregasHoy: 9,
    calificacion: 4.8,
    activo: true,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'per_03',
    uid: 'usr_per_miguel_03',
    nombre: 'Miguel Ángel',
    apellidos: 'Benítez Silva',
    usuario: 'miguelb',
    celular: '971004512',
    email: 'mbenitez.solgas@gmail.com',
    documentoTipo: 'DNI',
    documento: '09845123',
    rol: 'personal',
    cargo: 'Conductor de Furgón Industrial',
    vehiculoTipo: 'Furgón Hyundai Porter',
    placa: 'B3Z-841',
    capacidadBalones: 24,
    cuadrante: 'Restaurantes Miraflores & Mayorista',
    estadoTurno: 'disponible',
    entregasHoy: 5,
    calificacion: 5.0,
    activo: true,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'per_04',
    uid: 'usr_per_david_04',
    nombre: 'David Flores',
    apellidos: 'Campos',
    usuario: 'davidf',
    celular: '961229280',
    email: 'dflores.surquillo@gmail.com',
    documentoTipo: 'DNI',
    documento: '43901245',
    rol: 'personal',
    cargo: 'Técnico de Válvulas & Instalación',
    vehiculoTipo: 'Unidad de Asistencia Técnica',
    placa: '8910-1F',
    capacidadBalones: 2,
    cuadrante: 'Inspección de Fugas & Redes',
    estadoTurno: 'descanso',
    entregasHoy: 4,
    calificacion: 4.9,
    activo: true,
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80'
  }
];

export function obtenerPersonal() {
  const guardados = getls(STORAGE_KEY);
  if (guardados && Array.isArray(guardados) && guardados.length > 0) {
    return guardados;
  }
  savels(STORAGE_KEY, PERSONAL_SEMILLA);
  return PERSONAL_SEMILLA;
}

export function guardarMiembroPersonal(data) {
  const lista = obtenerPersonal();
  const idx = lista.findIndex(p => p.id === data.id);

  const registro = {
    id: data.id || `per_${Date.now()}`,
    uid: data.uid || `usr_${Date.now()}`,
    nombre: data.nombre || 'Personal',
    apellidos: data.apellidos || '',
    usuario: data.usuario || (data.nombre ? data.nombre.toLowerCase().replace(/\s+/g, '') : 'personal'),
    celular: data.celular || '936369384',
    email: data.email || '',
    documentoTipo: data.documentoTipo || 'DNI',
    documento: data.documento || '',
    rol: 'personal',
    cargo: data.cargo || 'Repartidor Motorizado',
    vehiculoTipo: data.vehiculoTipo || 'Moto de Carga GLP',
    placa: data.placa || '6741-4B',
    capacidadBalones: parseInt(data.capacidadBalones, 10) || 4,
    cuadrante: data.cuadrante || 'Surquillo Centro',
    estadoTurno: data.estadoTurno || 'disponible',
    entregasHoy: parseInt(data.entregasHoy, 10) || 0,
    calificacion: parseFloat(data.calificacion) || 5.0,
    activo: true,
    avatar: data.avatar || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80'
  };

  if (idx >= 0) {
    lista[idx] = { ...lista[idx], ...registro };
  } else {
    lista.unshift(registro);
  }

  savels(STORAGE_KEY, lista);
  return registro;
}

export function cambiarEstadoTurno(id, nuevoEstado) {
  const lista = obtenerPersonal();
  const idx = lista.findIndex(p => p.id === id);
  if (idx >= 0) {
    lista[idx].estadoTurno = nuevoEstado;
    savels(STORAGE_KEY, lista);
    return lista[idx];
  }
  return null;
}

export function eliminarMiembroPersonal(id) {
  let lista = obtenerPersonal();
  lista = lista.filter(p => p.id !== id);
  savels(STORAGE_KEY, lista);
  return lista;
}
