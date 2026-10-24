// src/feature/personal/modulos/correo/plantillas/talleres.js
// Plantilla Oficial: Confirmación de Inscripción a Taller Vivencial
// 100% Modular, Reutilizable y Adaptada a Talleres Psicoeducativos

import { envoltorioBase } from './base.js';
import { mdToEmailHtml } from './parser.js';
import { datosNegocio } from '@/negocio.js';

export function generarPlantillaTaller({
  cliente = 'Estimado/a participante',
  tallerNombre = 'Taller Vivencial de Inteligencia Emocional',
  fechaTaller = 'Sábado 31 de Octubre, 4:00 pm',
  modalidad = 'Grupal Presencial en Sede América',
  cupos = '1 cupo reservado',
  inversion = '60.00',
  mensajeMarkdown = '',
  negocio = {}
} = {}) {
  const neg = { ...datosNegocio, ...negocio };
  const nombreEmpresa = neg?.nombreCorto || neg?.nombre || 'Consultorio Psicológico América';
  const colorMarca = neg?.colorPrimario || '#267a57';
  const contenidoExtraHtml = mensajeMarkdown ? mdToEmailHtml(mensajeMarkdown) : '';

  const contenidoHtml = `
    <h2 style="color: ${colorMarca}; margin-top: 0; font-size: 22px; font-weight: 800;">🌱 ¡Inscripción confirmada al Taller Vivencial!</h2>
    <p style="font-size: 15px;">Hola <strong>${cliente}</strong>,</p>
    <p style="color: #475569; font-size: 14px; margin-bottom: 20px;">
      ¡Tu lugar está reservado! Nos entusiasma acompañarte en este espacio de crecimiento personal y aprendizaje vivencial.
    </p>

    <!-- Ficha de Datos del Taller -->
    <div style="background: #fdfbf7; border: 1px solid #ebd8be; border-radius: 10px; padding: 18px; margin: 18px 0;">
      <table style="width: 100%; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; width: 40%;"><strong>Taller:</strong></td>
          <td style="padding: 6px 0; font-weight: 700; color: ${colorMarca};">${tallerNombre}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Fecha & Horario:</strong></td>
          <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${fechaTaller}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Modalidad:</strong></td>
          <td style="padding: 6px 0; color: #334155;">${modalidad}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Reserva:</strong></td>
          <td style="padding: 6px 0; color: #334155;">${cupos}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Inversión Total:</strong></td>
          <td style="padding: 6px 0; font-size: 16px; font-weight: 800; color: ${colorMarca};">S/ ${inversion}</td>
        </tr>
      </table>
    </div>

    <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #475569;">
      📝 <strong>Recomendaciones para el Taller:</strong> Asistir con ropa cómoda y cuaderno de notas personal. Los materiales didácticos están incluidos.
    </div>

    ${contenidoExtraHtml}

    <p style="margin-top: 25px; text-align: center;">
      <a href="https://wa.me/${neg.whatsappLimpio || '51987654321'}?text=${encodeURIComponent('Hola Lic. Sofía, confirmo mi participación en el taller ' + tallerNombre)}" class="btn-ws" style="display:inline-block; background:#25d366; color:#fff; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:700;">
        📲 Coordinar vía WhatsApp
      </a>
    </p>
  `;

  return envoltorioBase({
    contenidoHtml,
    asunto: `🌱 Confirmación de Inscripción · ${tallerNombre}`,
    vistaPreviaTexto: `Detalles e indicaciones para el taller vivencial en Consultorio Psicológico América`,
    negocio: neg
  });
}
