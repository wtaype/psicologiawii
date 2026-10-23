// src/feature/personal/modulos/perfil/dataPerfil.js
// Gestor de Perfil del Administrador (Sincronizado con wiSmile y Firestore)
// 100% JS Nativo · Integrado con @widev

import { getls, savels } from '@widev';
import { datosNegocio } from '@/negocio.js';

export function obtenerDatosPerfil() {
  const user = getls('wiSmile');
  const sedeNegocio = datosNegocio.direccionSede || '';
  if (user) {
    return {
      uid: user.uid || '',
      nombre: user.nombre || 'Administrador',
      apellidos: user.apellidos || '',
      usuario: user.usuario || 'admin',
      email: user.email || '',
      celular: user.celular || '',
      rol: user.rol || 'gestor',
      sede: user.sede || sedeNegocio,
      avatar: (!user.avatar && !user.foto) || (user.avatar && user.avatar.includes('smile.webp')) ? '/smile.avif' : (user.avatar || user.foto)
    };
  }

  return {
    uid: '',
    nombre: 'Administrador',
    apellidos: '',
    usuario: 'admin',
    email: '',
    celular: '',
    rol: 'gestor',
    sede: sedeNegocio,
    avatar: '/smile.avif'
  };
}

export function guardarDatosPerfil(nuevosDatos) {
  const actual = obtenerDatosPerfil();
  const actualizado = { ...actual, ...nuevosDatos };
  savels('wiSmile', actualizado);
  return actualizado;
}
