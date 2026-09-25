// src/feature/personal/modulos/perfil/dataPerfil.js
// Gestor de Perfil del Administrador (Sincronizado con wiSmile y Firestore)
// 100% JS Nativo · Integrado con @widev

import { getls, savels } from '@widev';

export function obtenerDatosPerfil() {
  const user = getls('wiSmile');
  if (user) {
    return {
      uid: user.uid || '8sDpFzfnjFdpTCTkU2hq9PB35o22',
      nombre: user.nombre || 'Wilder',
      apellidos: user.apellidos || 'Taype Espinoza',
      usuario: user.usuario || 'wilder',
      email: user.email || 'wtaypeee@gmail.com',
      celular: user.celular || '961229280',
      rol: user.rol || 'gestor',
      sede: 'Sede Principal Jr. Dante 260, Surquillo',
      avatar: user.avatar || user.foto || 'https://imgwii.web.app/smile.avif'
    };
  }

  return {
    uid: '8sDpFzfnjFdpTCTkU2hq9PB35o22',
    nombre: 'Wilder',
    apellidos: 'Taype Espinoza',
    usuario: 'wilder',
    email: 'wtaypeee@gmail.com',
    celular: '961229280',
    rol: 'gestor',
    sede: 'Sede Principal Jr. Dante 260, Surquillo',
    avatar: 'https://imgwii.web.app/smile.avif'
  };
}

export function guardarDatosPerfil(nuevosDatos) {
  const actual = obtenerDatosPerfil();
  const actualizado = { ...actual, ...nuevosDatos };
  savels('wiSmile', actualizado);
  return actualizado;
}
