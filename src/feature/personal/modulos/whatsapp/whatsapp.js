// src/feature/personal/modulos/whatsapp/whatsapp.js
// Orquestador Maestro del Módulo WhatsApp en Personal Backoffice
// Control de pestañas ("Ajustes / Canales" y "Plantillas") e inicialización modular
import { initCanalesTab } from './tabs/canales.js';
import { initPlantillasTab } from './tabs/plantillas.js';

export function inicializarModuloWhatsapp() {
  const panel = document.getElementById('panel-whatsapp');
  if (!panel || panel.dataset.whatsappInit === 'true') return;
  panel.dataset.whatsappInit = 'true';

  const btnTabCanales = document.getElementById('waBtnTabCanales');
  const btnTabPlantillas = document.getElementById('waBtnTabPlantillas');
  const viewCanales = document.getElementById('waViewCanales');
  const viewPlantillas = document.getElementById('waViewPlantillas');

  function activarTab(nombre) {
    if (nombre === 'canales') {
      btnTabCanales?.classList.add('active');
      btnTabPlantillas?.classList.remove('active');
      viewCanales?.classList.remove('hidden');
      viewPlantillas?.classList.add('hidden');
    } else if (nombre === 'plantillas') {
      btnTabPlantillas?.classList.add('active');
      btnTabCanales?.classList.remove('active');
      viewPlantillas?.classList.remove('hidden');
      viewCanales?.classList.add('hidden');
    }
  }

  btnTabCanales?.addEventListener('click', () => activarTab('canales'));
  btnTabPlantillas?.addEventListener('click', () => activarTab('plantillas'));

  // Inicializar cada pestaña con sus propios módulos
  initCanalesTab();
  initPlantillasTab();
}

export default { inicializarModuloWhatsapp };
