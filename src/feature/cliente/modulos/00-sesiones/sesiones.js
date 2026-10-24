// src/feature/cliente/modulos/00-sesiones/sesiones.js
// Controlador reactivo de Mis Sesiones · Consultorio Psicológico América

import { Saludar, getls } from '@widev';

export function inicializarSesiones(cambiarModuloFn) {
  const modulo = document.getElementById('moduloSesiones');
  if (!modulo) return;

  // 1. Saludo personalizado con el nombre del paciente
  const saluteElem = document.getElementById('seUserSalute');
  if (saluteElem) {
    const user = getls('wiSmile') || (typeof window !== 'undefined' ? window.__WI_USER__ : null);
    const nombre = user?.nombre || user?.usuario || 'Paciente';
    const primerNombre = nombre.trim().split(/\s+/)[0];
    saluteElem.textContent = `¡${Saludar(primerNombre, 'es')}!`;
  }

  // 2. Navegación directa entre módulos
  const btnAgendar = document.getElementById('btnIrAgendarSesion');
  btnAgendar?.addEventListener('click', () => {
    if (typeof cambiarModuloFn === 'function') {
      cambiarModuloFn('pedidos');
    }
  });

  const btnRecursos = document.getElementById('btnIrRecursosSesion');
  btnRecursos?.addEventListener('click', () => {
    if (typeof cambiarModuloFn === 'function') {
      cambiarModuloFn('recursos');
    }
  });

  const btnSoporte = document.getElementById('btnIrSoporteSesion');
  btnSoporte?.addEventListener('click', () => {
    if (typeof cambiarModuloFn === 'function') {
      cambiarModuloFn('soporte');
    }
  });
}
