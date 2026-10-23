// src/feature/personal/modulos/whatsapp/dataWhatsapp.js
// Centro de Plantillas y Generador de Mensajes Oficiales de WhatsApp
// 100% JS Nativo · Integrado con @widev y Local-First
import { obtenerDatosNegocio } from '../negocio/dataNegocio.js';
import whatsappSemilla from '@/semillas/whatsapp.json';
import productosSemilla from '@/semillas/productos.json';

export const PLANTILLAS_WHATSAPP = Array.isArray(whatsappSemilla?.plantillas) ? whatsappSemilla.plantillas : [];

export function formatearPlantilla(textoBase, valores = {}) {
  let resultado = textoBase;
  const neg = obtenerDatosNegocio() || {};
  const nombreEstudio = neg.identidad?.nombreCorto || neg.identidad?.nombre || neg.nombre || '';
  const especialista = neg.identidad?.especialista || neg.especialista || 'Atención al Cliente';
  const direccionSede = neg.ubicacion?.direccion ? neg.ubicacion.direccion : 'Sede Principal';

  const primerProd = Array.isArray(productosSemilla) && productosSemilla[0] ? productosSemilla[0] : null;
  const prodNombre = typeof primerProd?.nombre === 'object' ? (primerProd?.nombre?.es || '') : (primerProd?.nombre || 'Servicio Oficial');
  const prodPrecio = String(primerProd?.precioPEN ?? primerProd?.precio ?? '0.00');

  const defaults = {
    cliente: 'Estimado/a cliente',
    estudio: nombreEstudio,
    especialista: especialista,
    pedidoId: '1001',
    producto: prodNombre,
    cantidad: '1',
    monto: prodPrecio,
    precioMayorista: prodPrecio,
    direccion: neg.ubicacion?.direccion || '',
    distrito: neg.ubicacion?.distrito || '',
    ruc: neg.identidad?.ruc || '',
    digito: neg.identidad?.ruc ? neg.identidad.ruc.slice(-1) : '',
    periodo: 'Periodo Vigente',
    fechaVencimiento: 'Fin de mes',
    regimen: 'Régimen Oficial',
    nps: '',
    modalidad: neg.sedes?.[0]?.modalidad || 'Atención Inmediata',
    fechaHora: 'Hoy · Salida Inmediata',
    honorario: prodPrecio,
    lugarEnlace: `${direccionSede}`,
    comprobanteTipo: 'Boleta Electrónica',
    comprobanteNumero: 'B001-000101',
    fecha: 'Hoy',
    servicio: prodNombre
  };

  const merge = { ...defaults, ...valores };

  for (const [clave, val] of Object.entries(merge)) {
    const regex = new RegExp(`\\{${clave}\\}`, 'g');
    resultado = resultado.replace(regex, val || '');
  }

  return resultado;
}
