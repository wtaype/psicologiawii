// src/feature/personal/modulos/correo/plantillas/base.js
// Envoltorio HTML base para todos los correos de la empresa

/**
 * Genera el armazón HTML principal del correo con membrete y pie de página
 */
export function envoltorioBase({ contenidoHtml, asunto, vistaPreviaTexto = '', negocio = {} }) {
  const nombreEmpresa = negocio?.nombre || 'Solgas Surquillo';
  const logoUrl = negocio?.logoUrl || 'https://media.solgassurquillo.com/logo.webp';
  const direccion = negocio?.direccion || 'Jr. Dante 261, Surquillo, Lima';
  const telefono = negocio?.telefono || '+51 936 369 384';
  const ruc = negocio?.ruc || '10088500372';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${asunto}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased; }
    table { border-collapse: collapse; }
    .card-wrap { max-width: 600px; margin: 25px auto; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(15,23,42,0.06); }
    .email-header { background: #ffffff; padding: 20px 28px; border-bottom: 2px solid #ff6a00; }
    .email-body { padding: 28px; line-height: 1.6; }
    .email-footer { background: #f8fafc; padding: 22px 28px; border-top: 1px solid #eef1f5; font-size: 12px; color: #64748b; line-height: 1.5; text-align: center; }
    .btn-action { display: inline-block; background: #ff6a00; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 26px; border-radius: 8px; margin-top: 15px; }
    .btn-ws { display: inline-block; background: #25d366; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 13px; padding: 10px 20px; border-radius: 8px; margin-top: 15px; }
    @media only screen and (max-width: 620px) {
      .card-wrap { margin: 10px auto !important; border-radius: 8px !important; }
      .email-body { padding: 20px 16px !important; }
      .email-header { padding: 16px !important; }
    }
  </style>
</head>
<body>
  <span style="display:none;font-size:1px;color:#fff;max-height:0;">${vistaPreviaTexto}</span>
  <div class="card-wrap">
    <!-- Encabezado con Logo y Marca Oficial -->
    <div class="email-header">
      <table style="width:100%;">
        <tr>
          <td style="vertical-align:middle;">
            <img src="${logoUrl}" alt="${nombreEmpresa}" style="height:38px;max-width:140px;vertical-align:middle;" onerror="this.style.display='none'" />
            <span style="font-size:18px;font-weight:800;color:#0f172a;vertical-align:middle;margin-left:8px;letter-spacing:-0.02em;">${nombreEmpresa.toUpperCase()}</span>
          </td>
          <td style="text-align:right;vertical-align:middle;">
            <span style="font-size:11px;font-weight:700;color:#ff6a00;text-transform:uppercase;background:#fff4ed;padding:5px 10px;border-radius:6px;">OFICIAL</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Contenido Principal -->
    <div class="email-body">
      ${contenidoHtml}
    </div>

    <!-- Pie de Página Dinámico -->
    <div class="email-footer">
      <p style="margin:0 0 6px 0;"><strong>${nombreEmpresa}</strong> · RUC ${ruc}</p>
      <p style="margin:0 0 6px 0;">Sede: ${direccion} · Central: <strong>${telefono}</strong></p>
      <p style="margin:0;font-size:11px;color:#94a3b8;">Notificación generada mediante Gaswii. Si tienes dudas, contáctanos a nuestra línea de atención.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
