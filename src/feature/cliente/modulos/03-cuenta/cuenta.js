// src/feature/cliente/modulos/03-cuenta/cuenta.js
// Controlador de Mi Cuenta · Solgas Surquillo
// Formato Split 2 Columnas idéntico a 02-direccion
// Integración de wiSelect de @widev, Local-First con wiSmile y feedback con wiSpin/Notificacion

import { avatar, wiSpin, Notificacion, wiSelect } from '@widev';
import {
  obtenerCuentaLocal,
  guardarPerfil,
  guardarPreferencias,
  actualizarPassword,
  enviarResetPassword
} from './dataCuenta.js';

let inicializado = false;
let instSelectDocTipo = null;
let instSelectValvula = null;
let instSelectHorario = null;
let instSelectPago = null;

/**
 * Inicializa los selectores con el componente wiSelect de @widev
 */
function inicializarWiSelects() {
  const rucBox = document.getElementById('ctRucCampos');

  // 1. Selector de Tipo de Documento SUNAT
  const elDocTipo = document.getElementById('ctSelectDocTipo');
  if (elDocTipo && !elDocTipo.dataset.wiselect) {
    instSelectDocTipo = wiSelect(elDocTipo, {
      placeholder: 'Selecciona tipo de documento...',
      searchPlaceholder: 'Buscar documento...',
      onChange: (val) => {
        if (rucBox) rucBox.style.display = val === 'RUC' ? 'grid' : 'none';
      }
    });
  }

  // 2. Selector de Tipo de Válvula
  const elValvula = document.getElementById('ctSelectValvula');
  if (elValvula && !elValvula.dataset.wiselect) {
    instSelectValvula = wiSelect(elValvula, {
      placeholder: 'Selecciona tipo de válvula...',
      searchPlaceholder: 'Buscar válvula...'
    });
  }

  // 3. Selector de Horario Habitual
  const elHorario = document.getElementById('ctSelectHorario');
  if (elHorario && !elHorario.dataset.wiselect) {
    instSelectHorario = wiSelect(elHorario, {
      placeholder: 'Selecciona horario de entrega...',
      searchPlaceholder: 'Buscar horario...'
    });
  }

  // 4. Selector de Método de Pago
  const elPago = document.getElementById('ctSelectMetodoPago');
  if (elPago && !elPago.dataset.wiselect) {
    instSelectPago = wiSelect(elPago, {
      placeholder: 'Selecciona método de pago...',
      searchPlaceholder: 'Buscar pago...'
    });
  }
}

/**
 * Rellena los campos de la interfaz con los datos del perfil
 */
export function poblarDatosUI(datos) {
  if (!datos) return;

  // 1. Chip de identidad en la cabecera
  const elAvatar = document.getElementById('ctAvatarLetter');
  const elHeroNombre = document.getElementById('ctHeroNombre');
  const elHeroUsuario = document.getElementById('ctHeroUsuario');
  const elPuntos = document.getElementById('ctPuntosNum');

  const nombreCompleto = [datos.nombre, datos.apellidos].filter(Boolean).join(' ') || datos.usuario || 'Vecino Gaswii';
  if (elAvatar) {
    if (datos.avatar && datos.avatar.startsWith('http')) {
      elAvatar.innerHTML = `<img src="${datos.avatar}" alt="${nombreCompleto}" onerror="this.remove();" />`;
    } else {
      elAvatar.textContent = datos.iniciales || avatar(nombreCompleto);
    }
  }
  if (elHeroNombre) elHeroNombre.textContent = nombreCompleto;
  if (elHeroUsuario) elHeroUsuario.textContent = `@${datos.usuario || 'usuario'}`;
  if (elPuntos) elPuntos.textContent = String(datos.puntos || 0);

  // 2. Columna Izquierda: Perfil & Facturación
  const inpUser = document.getElementById('ctInputUsuario');
  const inpEmail = document.getElementById('ctInputEmail');
  const inpNom = document.getElementById('ctInputNombre');
  const inpApe = document.getElementById('ctInputApellidos');
  const inpAvatar = document.getElementById('ctInputAvatar');
  const inpIniciales = document.getElementById('ctInputIniciales');
  const inpCel = document.getElementById('ctInputCelular');
  const selDocTipo = document.getElementById('ctSelectDocTipo');
  const inpDoc = document.getElementById('ctInputDocumento');
  const rucBox = document.getElementById('ctRucCampos');
  const inpRazon = document.getElementById('ctInputRazonSocial');
  const inpDirFisc = document.getElementById('ctInputDireccionFiscal');

  if (inpUser) inpUser.value = `@${datos.usuario || ''}`;
  if (inpEmail) inpEmail.value = datos.email || '';
  if (inpNom) inpNom.value = datos.nombre || '';
  if (inpApe) inpApe.value = datos.apellidos || '';
  if (inpAvatar) inpAvatar.value = datos.avatar || 'https://imgwii.web.app/smile.avif';
  if (inpIniciales) inpIniciales.value = datos.iniciales || avatar(nombreCompleto);
  if (inpCel) inpCel.value = datos.celular || '';

  const tipoDocVal = datos.documentoTipo || 'DNI';
  if (instSelectDocTipo) {
    instSelectDocTipo.setValue(tipoDocVal);
  } else if (selDocTipo) {
    selDocTipo.value = tipoDocVal;
  }

  if (inpDoc) inpDoc.value = datos.documento || '';
  if (inpRazon) inpRazon.value = datos.razonSocial || '';
  if (inpDirFisc) inpDirFisc.value = datos.direccionFiscal || '';

  // Visibilidad condicional para RUC
  if (rucBox) {
    rucBox.style.display = tipoDocVal === 'RUC' ? 'grid' : 'none';
  }

  // 3. Columna Derecha: Preferencias de Entrega
  const prefs = datos.preferencias || {};

  const valValvula = prefs.tipoValvula || 'premium';
  if (instSelectValvula) {
    instSelectValvula.setValue(valValvula);
  } else {
    const elValv = document.getElementById('ctSelectValvula');
    if (elValv) elValv.value = valValvula;
  }

  const valHorario = prefs.horarioHabitual || 'mañana';
  if (instSelectHorario) {
    instSelectHorario.setValue(valHorario);
  } else {
    const elHor = document.getElementById('ctSelectHorario');
    if (elHor) elHor.value = valHorario;
  }

  const valPago = prefs.metodoPago || 'yape';
  if (instSelectPago) {
    instSelectPago.setValue(valPago);
  } else {
    const elPag = document.getElementById('ctSelectMetodoPago');
    if (elPag) elPag.value = valPago;
  }

  const inpPiso = document.getElementById('ctInputPisoAscensor');
  const swTimbre = document.getElementById('ctSwitchTimbre');
  const swLlamar = document.getElementById('ctSwitchLlamar');
  const swComprobante = document.getElementById('ctSwitchComprobante');

  if (inpPiso) inpPiso.value = prefs.pisoAscensor || '';
  if (swTimbre) swTimbre.checked = Boolean(prefs.timbreMalogrado);
  if (swLlamar) swLlamar.checked = Boolean(prefs.llamarAlLlegar ?? true);
  if (swComprobante) swComprobante.checked = Boolean(prefs.comprobanteEmail ?? true);
}

/**
 * Configura los formularios del módulo
 */
function configurarFormularios() {
  // Manejador de chips de sugerencia de avatar
  document.querySelectorAll('[data-avatar-sug]').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.dataset.avatarSug;
      const inp = document.getElementById('ctInputAvatar');
      if (inp && url) {
        inp.value = url;
        const elAvatar = document.getElementById('ctAvatarLetter');
        if (elAvatar) elAvatar.innerHTML = `<img src="${url}" alt="Avatar" onerror="this.remove();" />`;
      }
    });
  });

  // Manejador de botón auto-generar iniciales
  const btnAutoIni = document.getElementById('btnAutoIniciales');
  btnAutoIni?.addEventListener('click', () => {
    const nom = document.getElementById('ctInputNombre')?.value || '';
    const ape = document.getElementById('ctInputApellidos')?.value || '';
    const user = document.getElementById('ctInputUsuario')?.value?.replace('@', '') || '';
    const fullName = [nom, ape].filter(Boolean).join(' ') || user || 'Gaswii';
    const inicialesCalc = avatar(fullName);
    const inpIni = document.getElementById('ctInputIniciales');
    if (inpIni) inpIni.value = inicialesCalc;
  });

  // 1. Guardar Datos Personales y Facturación
  const formPerfil = document.getElementById('formCuentaPerfil');
  formPerfil?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnGuardarPerfil');
    wiSpin(btn, true, 'Guardando...');

    try {
      const nombre = document.getElementById('ctInputNombre')?.value || '';
      const apellidos = document.getElementById('ctInputApellidos')?.value || '';
      const avatarVal = document.getElementById('ctInputAvatar')?.value || '';
      const inicialesVal = document.getElementById('ctInputIniciales')?.value || '';
      const celular = document.getElementById('ctInputCelular')?.value || '';
      const documentoTipo = instSelectDocTipo ? instSelectDocTipo.getValue() : (document.getElementById('ctSelectDocTipo')?.value || 'DNI');
      const documento = document.getElementById('ctInputDocumento')?.value || '';
      const razonSocial = document.getElementById('ctInputRazonSocial')?.value || '';
      const direccionFiscal = document.getElementById('ctInputDireccionFiscal')?.value || '';

      const updated = await guardarPerfil({
        nombre,
        apellidos,
        avatar: avatarVal,
        iniciales: inicialesVal,
        celular,
        documentoTipo,
        documento,
        razonSocial,
        direccionFiscal
      });

      poblarDatosUI(updated);
      Notificacion('Tus datos, avatar y comprobante SUNAT se guardaron correctamente.', 'success');
    } catch (err) {
      console.error('[Cuenta] Error al guardar perfil:', err);
      Notificacion(err.message || 'Error al guardar los datos.', 'error');
    } finally {
      wiSpin(btn, false);
    }
  });

  // 2. Guardar Preferencias de Entrega
  const formPrefs = document.getElementById('formCuentaPreferencias');
  formPrefs?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnGuardarPreferencias');
    wiSpin(btn, true, 'Guardando...');

    try {
      const tipoValvula = instSelectValvula ? instSelectValvula.getValue() : (document.getElementById('ctSelectValvula')?.value || 'premium');
      const horarioHabitual = instSelectHorario ? instSelectHorario.getValue() : (document.getElementById('ctSelectHorario')?.value || 'mañana');
      const metodoPago = instSelectPago ? instSelectPago.getValue() : (document.getElementById('ctSelectMetodoPago')?.value || 'yape');
      const timbreMalogrado = document.getElementById('ctSwitchTimbre')?.checked || false;
      const llamarAlLlegar = document.getElementById('ctSwitchLlamar')?.checked || false;
      const comprobanteEmail = document.getElementById('ctSwitchComprobante')?.checked || false;
      const pisoAscensor = document.getElementById('ctInputPisoAscensor')?.value || '';

      await guardarPreferencias({
        tipoValvula,
        horarioHabitual,
        metodoPago,
        timbreMalogrado,
        llamarAlLlegar,
        comprobanteEmail,
        pisoAscensor
      });

      Notificacion('Preferencias de entrega guardadas con éxito.', 'success');
    } catch (err) {
      console.error('[Cuenta] Error al guardar preferencias:', err);
      Notificacion(err.message || 'Error al guardar preferencias.', 'error');
    } finally {
      wiSpin(btn, false);
    }
  });

  // 3. Actualizar Contraseña en Firebase Auth
  const formPass = document.getElementById('formCuentaPassword');
  formPass?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nueva = document.getElementById('ctInputNuevaPass')?.value || '';
    const confirm = document.getElementById('ctInputConfirmarPass')?.value || '';
    const btn = document.getElementById('btnCambiarPass');

    if (nueva.length < 6) {
      Notificacion('La contraseña debe tener un mínimo de 6 caracteres.', 'warning');
      return;
    }

    if (nueva !== confirm) {
      Notificacion('Las contraseñas no coinciden. Por favor verifícalas.', 'warning');
      return;
    }

    wiSpin(btn, true, 'Actualizando...');
    try {
      await actualizarPassword(nueva);
      formPass.reset();
      Notificacion('Contraseña actualizada con éxito.', 'success');
    } catch (err) {
      console.error('[Cuenta] Error al cambiar password:', err);
      Notificacion(err.message || 'Error al cambiar la contraseña.', 'error');
    } finally {
      wiSpin(btn, false);
    }
  });

  // 4. Enviar correo de restablecimiento
  const btnResetMail = document.getElementById('btnEnviarResetMail');
  btnResetMail?.addEventListener('click', async () => {
    wiSpin(btnResetMail, true, 'Enviando enlace...');
    try {
      await enviarResetPassword();
      Notificacion('Enlace de restablecimiento enviado a tu correo.', 'info', 4500);
    } catch (err) {
      console.error('[Cuenta] Error al enviar reset mail:', err);
      Notificacion(err.message || 'Error al enviar el correo.', 'error');
    } finally {
      wiSpin(btnResetMail, false);
    }
  });
}

/**
 * Sincronización pasiva en segundo plano con Firestore smiles/{uid}
 */
async function sincronizarCuentaDesdeFirestore() {
  const datosLocales = obtenerCuentaLocal();
  if (!datosLocales?.uid) return;

  try {
    const { db } = await import('@core/servicios/firebase.js');
    const { doc, getDoc } = await import('firebase/firestore');

    const snap = await getDoc(doc(db, 'smiles', datosLocales.uid));
    if (snap.exists()) {
      const dataRemota = snap.data();
      const fusionado = {
        ...datosLocales,
        ...dataRemota,
        uid: datosLocales.uid,
        usuario: dataRemota.usuario || datosLocales.usuario,
        iniciales: dataRemota.iniciales || datosLocales.iniciales,
        avatar: dataRemota.avatar || datosLocales.avatar,
        preferencias: {
          ...(datosLocales.preferencias || {}),
          ...(dataRemota.preferencias || {})
        }
      };
      delete fusionado.userId; // Garantizar limpieza

      const { savels } = await import('@widev');
      savels('wiSmile', fusionado, 144);
      if (typeof window !== 'undefined') window.__GASWII_USER__ = fusionado;
      poblarDatosUI(fusionado);
    }
  } catch (err) {
    console.debug('[Gaswii Cuenta] Sincronización en segundo plano omitida:', err.message);
  }
}

/**
 * Inicializador del Módulo 03: Mi Cuenta
 */
export function inicializarCuenta() {
  const contenedor = document.getElementById('moduloCuenta');
  if (!contenedor) return;

  // 1. Inicializar selects premium con wiSelect
  inicializarWiSelects();

  // 2. Carga instantánea desde wiSmile (0ms)
  const datos = obtenerCuentaLocal();
  if (datos) {
    poblarDatosUI(datos);
  }

  // 3. Listeners únicos
  if (!inicializado) {
    configurarFormularios();
    inicializado = true;
  }

  // 4. Sincronización no bloqueante
  sincronizarCuentaDesdeFirestore();
}
