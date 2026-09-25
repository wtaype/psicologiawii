// src/feature/auth/data/campos.js
// Modelo centralizado de campos del formulario de registro
// Para agregar un campo nuevo: agregar un objeto a este array
// Las claves key_ph mapean a src/feature/auth/idioma/{lang}.json

export const camposRegistro = [
  {
    id:     'regEmail',
    ico:    'envelope',
    tipo:   'email',
    key_ph: 'correo_ph',
    san:    'sanEmail',
    regla:  'regEmail',
    col:    'half'
  },
  {
    id:     'regUsuario',
    ico:    'at',
    tipo:   'text',
    key_ph: 'usuario_ph',
    san:    'sanUser',
    regla:  'regUsuario',
    col:    'half'
  },
  {
    id:     'regNombre',
    ico:    'user',
    tipo:   'text',
    key_ph: 'nombre_ph',
    san:    'sanName',
    regla:  'regNombre',
    col:    'half'
  },
  {
    id:     'regApellidos',
    ico:    'user-tag',
    tipo:   'text',
    key_ph: 'apellidos_ph',
    san:    'sanName',
    regla:  'regApellidos',
    col:    'half'
  },
  {
    id:     'regPassword',
    ico:    'lock',
    tipo:   'password',
    key_ph: 'pass_ph',
    san:    null,
    regla:  'regPassword',
    col:    'half',
    ojo:    true
  },
  {
    id:     'regPassword1',
    ico:    'shield-halved',
    tipo:   'password',
    key_ph: 'pass_confirm_ph',
    san:    null,
    regla:  'regPassword1',
    col:    'half',
    ojo:    true
  }
];

