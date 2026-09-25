// src/feature/personal/modulos/perfil/perfil.js
// Controlador Frontend Autónomo del Módulo Mi Perfil (Solgas Surquillo)
// 100% JS Nativo · Integrado con @widev

import { Notificacion, wiSpin } from '@widev';
import { obtenerDatosPerfil, guardarDatosPerfil } from './dataPerfil.js';

export function inicializarModuloPerfil() {
  const panel = document.getElementById('panel-perfil');
  if (!panel || panel.dataset.perfilInit === 'true') return;
  panel.dataset.perfilInit = 'true';

  // ── Elementos del Formulario ──
  const inNombre = document.getElementById('pfInpNombre');
  const inApellidos = document.getElementById('pfInpApellidos');
  const inUsuario = document.getElementById('pfInpUsuario');
  const inEmail = document.getElementById('pfInpEmail');
  const inCelular = document.getElementById('pfInpCelular');
  const inAvatar = document.getElementById('pfInpAvatar');
  const formPerfil = document.getElementById('formPfDatos');
  const btnGuardarPerfil = document.getElementById('btnPfGuardar');

  // ── Elementos de Contraseña ──
  const formPassword = document.getElementById('formPfPassword');
  const inPassActual = document.getElementById('pfInpPassActual');
  const inPassNuevo = document.getElementById('pfInpPassNuevo');
  const inPassConf = document.getElementById('pfInpPassConf');
  const btnGuardarPass = document.getElementById('btnPfGuardarPass');

  // ── Elementos de la Tarjeta ID Preview ──
  const idAvatar = document.getElementById('pfIdAvatar');
  const idNombre = document.getElementById('pfIdNombre');
  const idHandle = document.getElementById('pfIdHandle');
  const idEmail = document.getElementById('pfIdEmail');
  const idCelular = document.getElementById('pfIdCelular');
  const idSede = document.getElementById('pfIdSede');

  // ════════════════════════════════════════════════════════════
  // 1. CARGA INICIAL Y ACTUALIZACIÓN EN VIVO DE LA TARJETA ID
  // ════════════════════════════════════════════════════════════
  function cargarDatos() {
    const data = obtenerDatosPerfil();
    if (inNombre) inNombre.value = data.nombre;
    if (inApellidos) inApellidos.value = data.apellidos;
    if (inUsuario) inUsuario.value = data.usuario;
    if (inEmail) inEmail.value = data.email;
    if (inCelular) inCelular.value = data.celular;
    if (inAvatar) inAvatar.value = data.avatar;

    actualizarTarjetaId();
  }

  function actualizarTarjetaId() {
    const nom = `${inNombre?.value || 'Wilder'} ${inApellidos?.value || 'Taype'}`;
    const usr = inUsuario?.value || 'wilder';
    const email = inEmail?.value || 'wtaypeee@gmail.com';
    const cel = inCelular?.value || '961229280';
    const avt = inAvatar?.value || 'https://imgwii.web.app/smile.avif';

    if (idAvatar) idAvatar.src = avt;
    if (idNombre) idNombre.textContent = nom;
    if (idHandle) idHandle.textContent = `@${usr}`;
    if (idEmail) idEmail.textContent = email;
    if (idCelular) idCelular.textContent = cel;
    if (idSede) idSede.textContent = 'Jr. Dante 260, Surquillo';
  }

  [inNombre, inApellidos, inUsuario, inEmail, inCelular, inAvatar].forEach(el => {
    el?.addEventListener('input', actualizarTarjetaId);
  });

  // ════════════════════════════════════════════════════════════
  // 2. GUARDAR DATOS DE PERFIL
  // ════════════════════════════════════════════════════════════
  formPerfil?.addEventListener('submit', (e) => {
    e.preventDefault();
    wiSpin(btnGuardarPerfil, true, 'Guardando...');

    setTimeout(() => {
      guardarDatosPerfil({
        nombre: inNombre?.value?.trim(),
        apellidos: inApellidos?.value?.trim(),
        usuario: inUsuario?.value?.trim(),
        email: inEmail?.value?.trim(),
        celular: inCelular?.value?.trim(),
        avatar: inAvatar?.value?.trim()
      });

      wiSpin(btnGuardarPerfil, false);
      actualizarTarjetaId();

      // Actualizar también la topbar en tiempo real
      const topbarName = document.getElementById('topbarUserName');
      if (topbarName) topbarName.textContent = inNombre?.value?.trim();

      Notificacion('¡Datos del perfil actualizados exitosamente!', 'success');
    }, 400);
  });

  // ════════════════════════════════════════════════════════════
  // 3. CAMBIO DE CONTRASEÑA SEGURO
  // ════════════════════════════════════════════════════════════
  formPassword?.addEventListener('submit', (e) => {
    e.preventDefault();
    const actual = inPassActual?.value;
    const nuevo = inPassNuevo?.value;
    const conf = inPassConf?.value;

    if (!actual || !nuevo) {
      Notificacion('Ingresa la contraseña actual y la nueva.', 'warning');
      return;
    }

    if (nuevo.length < 6) {
      Notificacion('La nueva contraseña debe tener al menos 6 caracteres.', 'warning');
      return;
    }

    if (nuevo !== conf) {
      Notificacion('Las nuevas contraseñas no coinciden.', 'warning');
      return;
    }

    wiSpin(btnGuardarPass, true, 'Actualizando clave...');

    setTimeout(() => {
      wiSpin(btnGuardarPass, false);
      formPassword.reset();
      Notificacion('¡Contraseña de acceso actualizada con éxito!', 'success');
    }, 500);
  });

  // ════════════════════════════════════════════════════════════
  // 4. INICIALIZACIÓN
  // ════════════════════════════════════════════════════════════
  cargarDatos();
}
