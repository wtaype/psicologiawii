// src/feature/personal/modulos/whatsapp/dataWhatsapp.js
// Centro de Plantillas y Generador de Mensajes Oficiales de WhatsApp (Solgas Surquillo)
// 100% JS Nativo · Integrado con @widev y Local-First

export const PLANTILLAS_WHATSAPP = [
  {
    id: 'tpl_pedido_confirmado',
    nombre: 'Confirmación de Pedido Express',
    icono: 'fa-solid fa-circle-check',
    categoria: 'ventas',
    descripcion: 'Mensaje inmediato tras recibir un pedido web o telefónico.',
    mensaje: `¡Hola *{cliente}*! 👋 

Tu pedido en *SOLGAS SURQUILLO* ha sido confirmado con éxito. 🚀

📋 *Detalle del Pedido:*
• Producto: *{producto}*
• Total a pagar: *S/ {monto}*
• Método de pago: *{metodoPago}*
• Dirección: *{direccion}*

⏱️ *Tiempo estimado de entrega:* {eta} minutos.
Nuestro repartidor motorizado ya está preparando tu balón con *precinto de seguridad intacto de planta*.

¡Gracias por confiar en el distribuidor oficial de Surquillo!`
  },
  {
    id: 'tpl_chofer_camino',
    nombre: 'Chofer en Camino con Balanza Digital',
    icono: 'fa-solid fa-motorcycle',
    categoria: 'delivery',
    descripcion: 'Notificación cuando el repartidor sale de la sede Dante 260 hacia el domicilio.',
    mensaje: `Estimado/a *{cliente}*, tu balón de gas va en camino. 🛵💨

👤 *Conductor asignado:* {chofer}
🛵 *Vehículo:* Moto de reparto Solgas
📍 *Destino:* {direccion}
⏱️ *Llegada estimada:* En {eta} minutos aprox.

⚖️ *Garantía de Peso Exacto:*
Nuestro conductor lleva consigo la *Balanza Digital calibrada por Inacal*. Puedes solicitar el pesado en tu puerta antes de instalarlo sin costo adicional.

¡Estamos muy cerca!`
  },
  {
    id: 'tpl_llegada_puerta',
    nombre: 'Repartidor en Puerta / Timbre',
    icono: 'fa-solid fa-bell',
    categoria: 'delivery',
    descripcion: 'Aviso directo cuando el repartidor está en la puerta del cliente.',
    mensaje: `¡Hola *{cliente}*! 🔔

El repartidor de *Solgas Surquillo* ya se encuentra en tu puerta ({direccion}).

Favor de confirmar para la entrega e instalación gratuita con prueba de jabonadura de seguridad.

¡Muchas gracias!`
  },
  {
    id: 'tpl_comprobante_sunat',
    nombre: 'Envío de Comprobante SUNAT (B001 / F001)',
    icono: 'fa-solid fa-file-invoice-dollar',
    categoria: 'facturacion',
    descripcion: 'Resumen formal con serie, número y desglose fiscal del comprobante emitido.',
    mensaje: `Estimado/a *{cliente}*, te adjuntamos el comprobante electrónico de tu compra en *SOLGAS SURQUILLO*:

🧾 *Comprobante:* {comprobanteTipo} *{comprobanteNumero}*
📅 *Fecha:* {fecha}
👤 *Cliente:* {cliente} ({documentoTipo}: {documento})
💵 *Importe Total:* *S/ {monto}* (Inc. 18% IGV)
💳 *Medio de Pago:* {metodoPago}

Puede verificar la validez de este comprobante en el portal de la SUNAT con el RUC 20601234567.

¡Garantía y seguridad comprobada de planta Solgas!`
  },
  {
    id: 'tpl_recordatorio_recarga',
    nombre: 'Recordatorio Preventivo de Recarga (30 días)',
    icono: 'fa-solid fa-clock-rotate-left',
    categoria: 'fidelizacion',
    descripcion: 'Fidelización proactiva para clientes frecuentes cuyo balón está por agotarse.',
    mensaje: `¡Hola *{cliente}*! Esperamos que tengas un excelente día. ✨

Te escribimos de *Solgas Surquillo*. Vemos en nuestro sistema que han pasado aprox. 30 días desde tu última recarga de *{producto}*.

¿Se está acabando tu balón? Solicítalo ahora y te lo enviamos en *15 minutos* con instalación y prueba de fugas gratis:
👉 Responde a este chat con tu dirección o confírmanos: *"Sí, envíame uno"*.

¡Que tengas un gran día!`
  },
  {
    id: 'tpl_cotizacion_comercial',
    nombre: 'Cotización Comercial (Restaurantes y Negocios)',
    icono: 'fa-solid fa-building',
    categoria: 'empresas',
    descripcion: 'Propuesta de precios por volumen para balones industriales de 45 kg o pedidos mayoristas.',
    mensaje: `Estimados amigos de *{cliente}*, un cordial saludo desde *SOLGAS SURQUILLO*. 🤝

Atendiendo a su consulta comercial para abastecimiento de GLP:

🔥 *Propuesta Comercial para su Negocio:*
• Balón Industrial 45 kg: *S/ 220.00* (Factura F001 con crédito fiscal IGV)
• Balón Premium 10 kg: *S/ 65.00*
• Entrega programada prioritaria < 20 min en Surquillo, Miraflores y San Borja.
• Mantenimiento e inspección de reguladores y tuberías sin costo.

¿Desean que coordinemos una primera entrega de prueba para hoy?`
  }
];

export function formatearPlantilla(textoBase, valores = {}) {
  let resultado = textoBase;
  const defaults = {
    cliente: 'Wilder Taype',
    producto: 'Balón SOLGAS Premium 10 kg',
    monto: '65.00',
    metodoPago: 'Yape / Plin',
    direccion: 'Jr. Dante 260, Surquillo',
    chofer: 'Juan Quispe (Móvil 02)',
    eta: '12–15',
    comprobanteTipo: 'Boleta de Venta',
    comprobanteNumero: 'B001-000483',
    fecha: '25 Sep 2026',
    documentoTipo: 'DNI',
    documento: '71779978'
  };

  const merge = { ...defaults, ...valores };

  for (const [clave, val] of Object.entries(merge)) {
    const regex = new RegExp(`\\{${clave}\\}`, 'g');
    resultado = resultado.replace(regex, val || '');
  }

  return resultado;
}
