// src/feature/personal/data/personalData.js
// Datos comerciales y de Firebase para el feature Personal (Solgas Surquillo)


export const estadisticasDemo = [
  { id: 'stat1', titulo: 'S/ 65.00', subtitulo: 'Balón 10kg (Precio Web)', icono: 'fa-solid fa-fire-burner', color: 'orange' },
  { id: 'stat2', titulo: 'S/ 2,840.00', subtitulo: 'Facturado SUNAT', icono: 'fa-solid fa-file-invoice-dollar', color: 'green' },
  { id: 'stat3', titulo: '124 Clientes', subtitulo: 'Registrados en Gaswii', icono: 'fa-solid fa-address-book', color: 'blue' },
  { id: 'stat4', titulo: '3 Notas', subtitulo: 'En tu Notepad', icono: 'fa-solid fa-note-sticky', color: 'purple' }
];

export const clientesRecientesDemo = [
  { id: 'c1', nombre: 'Valeria Mendoza (view40)', telefono: '987 654 321', direccion: 'Jr. Dante 260, Dpto 301, Surquillo', habitual: 'Solgas 10kg', comprobante: 'Boleta (DNI 74829103)' },
  { id: 'c2', nombre: 'Restaurante El Rincón Criollo', telefono: '981 123 456', direccion: 'Av. Angamos Este 1240, Surquillo', habitual: '2x Solgas 45kg', comprobante: 'Factura (RUC 20554897123)' },
  { id: 'c3', nombre: 'Familia Alarcón Salazar', telefono: '992 234 567', direccion: 'Calle Esperanza 342, Miraflores', habitual: 'Solgas 10kg', comprobante: 'Boleta (DNI 45892147)' },
  { id: 'c4', nombre: 'Pollería Brasa & Leña', telefono: '973 345 678', direccion: 'Av. Aviación 2890, San Borja', habitual: '3x Solgas 45kg', comprobante: 'Factura (RUC 20608945123)' }
];

export const notasInicialesDemo = [
  { 
    id: 'n1', 
    tag: 'Urgente', 
    titulo: 'Coordinación fin de semana con planta', 
    texto: 'Coordinar con planta Solgas el ingreso de 50 balones de 10kg para el fin de semana por alta demanda proyectada en Surquillo y Miraflores.', 
    fecha: '20 Sep, 10:30 am', 
    done: false 
  },
  { 
    id: 'n2', 
    tag: 'Planta', 
    titulo: 'Calibración balanza Inacal', 
    texto: 'Calibración semanal de la balanza digital Inacal programada para el jueves a primera hora con técnico certificado.', 
    fecha: '19 Sep, 04:15 pm', 
    done: false 
  },
  { 
    id: 'n3', 
    tag: 'Pedidos', 
    titulo: 'Cliente frecuente pollería Angamos', 
    texto: 'Cliente frecuente Sr. Méndez solicita 2 balones de 45kg para pollería en Angamos con factura a nombre de su empresa.', 
    fecha: '18 Sep, 02:00 pm', 
    done: true 
  }
];
