// src/feature/personal/modulos/clientes/dataClientes.js
// Gestor de Datos Local-First para Directorio CRM de Clientes (Solgas Surquillo)
// Sincronizado con colección Firestore 'smiles' (rol: 'cliente') + LocalStorage
// 100% JS Nativo · Integrado con @widev y Firebase

import { getls, savels } from '@widev';

const STORAGE_KEY = 'gaswii_crm_clientes';

// Semilla inicial representativa de clientes de Surquillo y distritos aledaños
const CLIENTES_SEMILLA = [
  {
    id: 'cli_wilder_01',
    uid: '8sDpFzfnjFdpTCTkU2hq9PB35o22',
    nombre: 'Wilder Taype',
    apellidos: 'Espinoza',
    usuario: 'wilder',
    email: 'wtaypeee@gmail.com',
    celular: '961229280',
    documentoTipo: 'DNI',
    documento: '71779978',
    rol: 'cliente',
    plan: 'vip',
    puntos: 120,
    estado: 'activo',
    activo: true,
    balonHabitual: 'Balón SOLGAS Premium 10 kg',
    metodoPagoHabitual: 'Yape / Plin',
    totalPedidos: 14,
    montoTotalConsumido: 910.00,
    ultimoPedidoFecha: '24 Sep 2026',
    direcciones: [
      {
        id: 'dir_01',
        alias: 'Casa Principal',
        calle: 'Jr. Dante 260',
        dpto: 'Piso 2, Int. B',
        distrito: 'Surquillo',
        referencia: 'A 1 cuadra del Mercado Surquillo N° 1',
        celular: '961229280',
        predeterminada: true,
        eta: '10–12 min'
      }
    ],
    avatar: 'https://imgwii.web.app/smile.avif'
  },
  {
    id: 'cli_maria_02',
    uid: 'cli_usr_maria_99',
    nombre: 'María Elena',
    apellidos: 'Rojas Paredes',
    usuario: 'mariarojas',
    email: 'mrojas.surquillo@gmail.com',
    celular: '984512340',
    documentoTipo: 'DNI',
    documento: '09823412',
    rol: 'cliente',
    plan: 'frecuente',
    puntos: 45,
    estado: 'activo',
    activo: true,
    balonHabitual: 'Balón SOLGAS Premium 10 kg',
    metodoPagoHabitual: 'Efectivo contra entrega',
    totalPedidos: 6,
    montoTotalConsumido: 390.00,
    ultimoPedidoFecha: '22 Sep 2026',
    direcciones: [
      {
        id: 'dir_02',
        alias: 'Hogar',
        calle: 'Av. Angamos Este 1420',
        dpto: 'Torre 3, Dpto 802',
        distrito: 'Surquillo',
        referencia: 'Frente a Real Plaza Primavera',
        celular: '984512340',
        predeterminada: true,
        eta: '12–15 min'
      }
    ],
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'cli_polleria_03',
    uid: 'cli_usr_chick_03',
    nombre: 'Pollería Brasa & Carbón SAC',
    apellidos: '',
    usuario: 'polleriabrasa',
    email: 'contacto@brasasurquillo.pe',
    celular: '992110452',
    documentoTipo: 'RUC',
    documento: '20608765431',
    rol: 'cliente',
    plan: 'vip',
    puntos: 350,
    estado: 'activo',
    activo: true,
    balonHabitual: 'Balón SOLGAS Industrial 45 kg',
    metodoPagoHabitual: 'Transferencia BCP',
    totalPedidos: 28,
    montoTotalConsumido: 6160.00,
    ultimoPedidoFecha: '25 Sep 2026',
    direcciones: [
      {
        id: 'dir_03',
        alias: 'Local Principal',
        calle: 'Calle Narciso de la Colina 412',
        dpto: 'Local Comercial 1',
        distrito: 'Surquillo',
        referencia: 'Cruce con Vía Expresa Paseo de la República',
        celular: '992110452',
        predeterminada: true,
        eta: '8–10 min'
      }
    ],
    avatar: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'cli_carlos_04',
    uid: 'cli_usr_carlos_04',
    nombre: 'Carlos Manuel',
    apellidos: 'Vargas Zúñiga',
    usuario: 'carlosv',
    email: 'cvargas.mira@hotmail.com',
    celular: '971004512',
    documentoTipo: 'DNI',
    documento: '41289056',
    rol: 'cliente',
    plan: 'frecuente',
    puntos: 30,
    estado: 'activo',
    activo: true,
    balonHabitual: 'Balón SOLGAS Premium 10 kg',
    metodoPagoHabitual: 'Yape / Plin',
    totalPedidos: 4,
    montoTotalConsumido: 260.00,
    ultimoPedidoFecha: '18 Sep 2026',
    direcciones: [
      {
        id: 'dir_04',
        alias: 'Departamento',
        calle: 'Av. República de Panamá 5120',
        dpto: 'Piso 5',
        distrito: 'Miraflores (Límite Surquillo)',
        referencia: 'A 2 cuadras del Parque Reducto',
        celular: '971004512',
        predeterminada: true,
        eta: '15–18 min'
      }
    ],
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'cli_lucia_05',
    uid: 'cli_usr_lucia_05',
    nombre: 'Lucía Fernández',
    apellidos: 'Alarcón',
    usuario: 'luciaf',
    email: 'lucia.fernandez@outlook.com',
    celular: '945672109',
    documentoTipo: 'DNI',
    documento: '73419082',
    rol: 'cliente',
    plan: 'nuevo',
    puntos: 10,
    estado: 'activo',
    activo: true,
    balonHabitual: 'Balón SOLGAS Premium 10 kg',
    metodoPagoHabitual: 'Efectivo contra entrega',
    totalPedidos: 1,
    montoTotalConsumido: 65.00,
    ultimoPedidoFecha: '25 Sep 2026',
    direcciones: [
      {
        id: 'dir_05',
        alias: 'Casa',
        calle: 'Calle San Pedro 340',
        dpto: 'Casa de 2 pisos',
        distrito: 'Surquillo',
        referencia: 'Espalda del Parque Tradiciones',
        celular: '945672109',
        predeterminada: true,
        eta: '10–12 min'
      }
    ],
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
  }
];

export function obtenerClientes() {
  const guardados = getls(STORAGE_KEY);
  if (guardados && Array.isArray(guardados) && guardados.length > 0) {
    return guardados;
  }
  savels(STORAGE_KEY, CLIENTES_SEMILLA);
  return CLIENTES_SEMILLA;
}

export function guardarCliente(clienteData) {
  const clientes = obtenerClientes();
  const index = clientes.findIndex(c => c.id === clienteData.id || c.documento === clienteData.documento);
  
  const nuevoRegistro = {
    id: clienteData.id || `cli_${Date.now()}`,
    uid: clienteData.uid || `usr_${Date.now()}`,
    nombre: clienteData.nombre || 'Cliente',
    apellidos: clienteData.apellidos || '',
    usuario: clienteData.usuario || (clienteData.nombre ? clienteData.nombre.toLowerCase().replace(/\s+/g, '') : 'cliente'),
    email: clienteData.email || '',
    celular: clienteData.celular || '',
    documentoTipo: clienteData.documentoTipo || 'DNI',
    documento: clienteData.documento || '',
    rol: 'cliente',
    plan: clienteData.plan || 'frecuente',
    puntos: clienteData.puntos || 10,
    estado: clienteData.estado || 'activo',
    activo: true,
    balonHabitual: clienteData.balonHabitual || 'Balón SOLGAS Premium 10 kg',
    metodoPagoHabitual: clienteData.metodoPagoHabitual || 'Efectivo contra entrega',
    totalPedidos: clienteData.totalPedidos || 1,
    montoTotalConsumido: parseFloat(clienteData.montoTotalConsumido) || 65.00,
    ultimoPedidoFecha: clienteData.ultimoPedidoFecha || 'Hoy',
    direcciones: clienteData.direcciones || [
      {
        id: `dir_${Date.now()}`,
        alias: 'Principal',
        calle: clienteData.direccion || 'Surquillo',
        dpto: '',
        distrito: 'Surquillo',
        referencia: '',
        celular: clienteData.celular || '',
        predeterminada: true,
        eta: '12–15 min'
      }
    ],
    avatar: clienteData.avatar || 'https://imgwii.web.app/smile.avif'
  };

  if (index >= 0) {
    clientes[index] = { ...clientes[index], ...nuevoRegistro };
  } else {
    clientes.unshift(nuevoRegistro);
  }

  savels(STORAGE_KEY, clientes);
  return nuevoRegistro;
}

export function eliminarCliente(id) {
  let clientes = obtenerClientes();
  clientes = clientes.filter(c => c.id !== id);
  savels(STORAGE_KEY, clientes);
  return clientes;
}

export function calcularMetricasClientes(clientes = []) {
  const total = clientes.length;
  const vip = clientes.filter(c => c.plan === 'vip' || c.totalPedidos >= 5).length;
  const nuevos = clientes.filter(c => c.plan === 'nuevo' || c.totalPedidos <= 1).length;
  const consumoTotal = clientes.reduce((acc, c) => acc + (parseFloat(c.montoTotalConsumido) || 0), 0);
  
  return {
    total,
    vip,
    nuevos,
    consumoTotal: consumoTotal.toFixed(2)
  };
}
