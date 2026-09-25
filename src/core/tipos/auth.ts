// src/core/tipos/auth.ts
// 🔐 Definición centralizada de tipos TypeScript para la autenticación y perfil Smile de GasWii

export interface SmileDireccion {
  id?: string;
  alias?: string;
  etiqueta?: string;
  calle?: string;
  direccion?: string;
  dpto?: string;
  distrito?: string;
  celular?: string;
  referencia?: string;
  eta?: string;
  esPrincipal?: boolean;
  predeterminada?: boolean;
  creado?: any;
  actualizado?: any;
  [key: string]: any;
}

export interface SmileData {
  uid?: string;
  usuario?: string;
  email?: string;
  nombre?: string;
  apellido?: string;
  nombreCompleto?: string;
  foto?: string;
  avatar?: string;
  celular?: string;
  telefono?: string;
  dni?: string;
  rol?: 'cliente' | 'personal' | string;
  plan?: 'estandar' | 'vip' | string;
  activo?: boolean;
  estado?: 'activo' | 'suspendido' | string;
  pin?: string;
  puntos?: number;
  direcciones?: SmileDireccion[] | Record<string, any>;
  creado?: any;
  actualizado?: any;
  [key: string]: any;
}
