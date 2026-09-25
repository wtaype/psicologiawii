// src/feature/personal/modulos/ajustes/dataAjustes.js
// Gestor de Configuración General del Sistema y Backup (Solgas Surquillo)
// 100% JS Nativo · Integrado con @widev

import { getls, savels } from '@widev';

const STORAGE_KEY = 'gaswii_ajustes_sistema';

const AJUSTES_DEFAULT = {
  tiendaAbierta: true,
  mensajeCerrado: 'Estamos fuera de horario. Nuestro horario de entrega es de 6:00 AM a 10:00 PM.',
  etaMinutos: '12–15',
  costoDelivery: 0.00,
  sonidoPedidos: true,
  notificacionesWebPush: true,
  temaPorDefecto: 'futuro',
  sidebarColapsado: false,
  telefonoContacto: '936 369 384',
  direccionSede: 'Jr. Dante 260, Surquillo, Lima 15047'
};

export function obtenerAjustes() {
  const guardados = getls(STORAGE_KEY);
  if (guardados) {
    return { ...AJUSTES_DEFAULT, ...guardados };
  }
  savels(STORAGE_KEY, AJUSTES_DEFAULT);
  return AJUSTES_DEFAULT;
}

export function guardarAjustes(nuevosAjustes) {
  const actual = obtenerAjustes();
  const actualizado = { ...actual, ...nuevosAjustes };
  savels(STORAGE_KEY, actualizado);
  return actualizado;
}

export function generarBackupCompletoJson() {
  const backup = {
    fechaExportacion: new Date().toISOString(),
    version: '1.0.0',
    sede: 'Solgas Surquillo (Jr. Dante 260)',
    ajustes: obtenerAjustes(),
    comprobantes: getls('gaswii_sunat_comprobantes') || [],
    clientes: getls('gaswii_crm_clientes') || [],
    personal: getls('gaswii_equipo_personal') || [],
    entradas: getls('gaswii_entradas_blog') || [],
    galeria: getls('gaswii_galeria_media') || [],
    paginas: getls('gaswii_paginas_institucionales') || []
  };

  return JSON.stringify(backup, null, 2);
}
