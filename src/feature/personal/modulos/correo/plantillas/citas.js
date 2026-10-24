// src/feature/personal/modulos/correo/plantillas/citas.js
// Plantilla Oficial: Confirmación de Cita Psicológica
// 100% Modular, Reutilizable y Adaptada al Consultorio Clínico

import { envoltorioBase } from './base.js';
import { mdToEmailHtml } from './parser.js';
import { datosNegocio } from '@/negocio.js';

export function generarPlantillaCita({
  cliente = 'Estimado/a consultante',
  citaId = 'CITA-101',
  servicio = 'Psicoterapia Individual (TCC)',
  fechaHora = 'Sábado 24 de Octubre, 10:00 am',
  modalidad = 'Presencial en Sede América',
  precio = '85.00',
  mensajeMarkdown = '',
  negocio = {}
} = {}) {
  const neg = { ...datosNegocio, ...negocio };
  const nombreEmpresa = neg?.nombreCorto || neg?.nombre || 'Consultorio Psicológico América';
  const especialista = neg?.especialista || 'Lic. Sofia Reynaga (C.Ps.P. 49425)';
  const colorMarca = neg?.colorPrimario || '#267a57';
  const contenidoExtraHtml = mensajeMarkdown ? mdToEmailHtml(mensajeMarkdown) : '';
  const dirSede = neg?.direccionSede || 'Jr. Solidaridad 450, Villa El Salvador';

  const contenidoHtml = `
    <h2 style="color: ${colorMarca}; margin-top: 0; font-size: 22px; font-weight: 800;">🗓️ ¡Tu cita psicológica está confirmada!</h2>
    <p style="font-size: 15px;">Hola <strong>${cliente}</strong>,</p>
    <p style="color: #475569; font-size: 14px; margin-bottom: 20px;">
      Hemos reservado con éxito tu sesión terapéutica en <strong>${nombreEmpresa}</strong> con la especialista <strong>${especialista}</strong>.
    </p>

    <!-- Ficha de Datos de la Cita -->
    <div style="background: #f4fbf7; border: 1px solid #ccebdc; border-radius: 10px; padding: 18px; margin: 18px 0;">
      <table style="width: 100%; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; width: 40%;"><strong>Código de Cita:</strong></td>
          <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">#${citaId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Especialidad:</strong></td>
          <td style="padding: 6px 0; font-weight: 700; color: ${colorMarca};">${servicio}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Fecha y Hora:</strong></td>
          <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${fechaHora}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Modalidad:</strong></td>
          <td style="padding: 6px 0; font-weight: 600; color: #334155;">${modalidad}</td>
        </tr>
        ${modalidad.toLowerCase().includes('presencial') ? `
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Ubicación de Sede:</strong></td>
          <td style="padding: 6px 0; color: #334155;">${dirSede}</td>
        </tr>
        ` : `
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Enlace de Sesión:</strong></td>
          <td style="padding: 6px 0; color: #2563eb;">Google Meet (se envía 15 min antes)</td>
        </tr>
        `}
        <tr>
          <td style="padding: 6px 0; color: #64748b;"><strong>Inversión por Sesión:</strong></td>
          <td style="padding: 6px 0; font-size: 16px; font-weight: 800; color: ${colorMarca};">S/ ${precio}</td>
        </tr>
      </table>
    </div>

    <!-- Pautas de Puntualidad y Confidencialidad -->
    <div style="background: #ffffff; border-left: 4px solid ${colorMarca}; padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #475569;">
      🛡️ <strong>Ética y Confidencialidad:</strong> Tu espacio terapéutico está protegido bajo estricto secreto profesional. Te recomendamos conectarte o presentarte con 5 minutos de anticipación.
    </div>

    ${contenidoExtraHtml}

    <p style="margin-top: 25px; text-align: center;">
      <a href="https://wa.me/${neg.whatsappLimpio || '51987654321'}?text=${encodeURIComponent('Hola Lic. Sofía, confirmo mi asistencia a la cita #' + citaId)}" class="btn-ws" style="display:inline-block; background:#25d366; color:#fff; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:700;">
        📲 Confirmar por WhatsApp
      </a>
    </p>
  `;

  return envoltorioBase({
    contenidoHtml,
    asunto: `🗓️ Tu cita psicológica está confirmada (#${citaId}) · ${nombreEmpresa}`,
    vistaPreviaTexto: `Confirmación de cita psicológica con Lic. Sofia Reynaga para el ${fechaHora}`,
    negocio: neg
  });
}
