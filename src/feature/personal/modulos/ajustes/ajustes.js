// src/feature/personal/modulos/ajustes/ajustes.js
// Controlador Frontend Autónomo del Módulo Ajustes (Solgas Surquillo)
// 100% JS Nativo · Integrado con @widev

import { Notificacion, wiSpin } from '@widev';
import { obtenerAjustes, guardarAjustes, generarBackupCompletoJson } from './dataAjustes.js';

export function inicializarModuloAjustes() {
  const panel = document.getElementById('panel-ajustes');
  if (!panel || panel.dataset.ajustesInit === 'true') return;
  panel.dataset.ajustesInit = 'true';

  // ── Elementos del DOM ──
  const switchTienda = document.getElementById('ajSwitchTienda');
  const labelTienda = document.getElementById('ajLabelTienda');
  const inEta = document.getElementById('ajInpEta');
  const inCostoDelivery = document.getElementById('ajInpCostoDelivery');
  const inTelefono = document.getElementById('ajInpTelefono');
  const inDireccion = document.getElementById('ajInpDireccion');
  const switchSonido = document.getElementById('ajSwitchSonido');
  const switchPush = document.getElementById('ajSwitchPush');
  const btnGuardar = document.getElementById('btnAjGuardar');
  const btnBackupJson = document.getElementById('btnAjBackupJson');

  // ════════════════════════════════════════════════════════════
  // 1. CARGA INICIAL DE AJUSTES
  // ════════════════════════════════════════════════════════════
  function cargarAjustes() {
    const data = obtenerAjustes();

    if (switchTienda) {
      switchTienda.checked = data.tiendaAbierta;
      actualizarLabelTienda(data.tiendaAbierta);
    }

    if (inEta) inEta.value = data.etaMinutos || '12–15';
    if (inCostoDelivery) inCostoDelivery.value = (parseFloat(data.costoDelivery) || 0).toFixed(2);
    if (inTelefono) inTelefono.value = data.telefonoContacto || '936 369 384';
    if (inDireccion) inDireccion.value = data.direccionSede || 'Jr. Dante 260, Surquillo';
    if (switchSonido) switchSonido.checked = data.sonidoPedidos;
    if (switchPush) switchPush.checked = data.notificacionesWebPush;
  }

  function actualizarLabelTienda(abierta) {
    if (!labelTienda) return;
    labelTienda.textContent = abierta 
      ? '🟢 Sede Abierta (Recibiendo pedidos web y delivery)' 
      : '🔴 Sede Cerrada (Aviso de fuera de horario visible)';
  }

  switchTienda?.addEventListener('change', () => {
    actualizarLabelTienda(switchTienda.checked);
    guardarAjustes({ tiendaAbierta: switchTienda.checked });
    Notificacion(
      switchTienda.checked ? 'Sede marcada como ABIERTA.' : 'Sede marcada como CERRADA.',
      switchTienda.checked ? 'success' : 'warning',
      2000
    );
  });

  // ════════════════════════════════════════════════════════════
  // 2. GUARDAR PARÁMETROS OPERATIVOS
  // ════════════════════════════════════════════════════════════
  btnGuardar?.addEventListener('click', () => {
    wiSpin(btnGuardar, true, 'Guardando...');

    setTimeout(() => {
      guardarAjustes({
        etaMinutos: inEta?.value?.trim() || '12–15',
        costoDelivery: parseFloat(inCostoDelivery?.value) || 0.00,
        telefonoContacto: inTelefono?.value?.trim() || '936 369 384',
        direccionSede: inDireccion?.value?.trim() || 'Jr. Dante 260, Surquillo',
        sonidoPedidos: switchSonido?.checked ?? true,
        notificacionesWebPush: switchPush?.checked ?? true
      });

      wiSpin(btnGuardar, false);
      Notificacion('¡Configuración guardada exitosamente!', 'success');
    }, 400);
  });

  // ════════════════════════════════════════════════════════════
  // 3. DESCARGA DE BACKUP COMPLETO JSON
  // ════════════════════════════════════════════════════════════
  btnBackupJson?.addEventListener('click', () => {
    const jsonStr = generarBackupCompletoJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_gaswii_solgas_surquillo_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    Notificacion('¡Copia de seguridad JSON descargada con éxito!', 'success', 2500);
  });

  // ════════════════════════════════════════════════════════════
  // 4. INICIALIZACIÓN
  // ════════════════════════════════════════════════════════════
  cargarAjustes();
}
