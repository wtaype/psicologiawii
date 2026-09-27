// src/feature/inicio/lib/modales/test/preguntas.js
// 🎯 Modelo y Estado de las 2 Etapas del Test de Orientación Empático

export function crearEstadoTest() {
  return {
    etapa: 1, // 1: Vivencia Emocional, 2: Datos y Coordinación
    emocionId: '',
    emocionTexto: '',
    desahogo: '',
    tiempo: '',
    nombre: '',
    correo: '',
    celular: '',
    modalidad: '',
    fecha: '',
    hora: '04:30 PM',
    devolucionEmpatica: ''
  };
}

export default {
  crearEstadoTest
};
