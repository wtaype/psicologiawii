// src/core/widev/tema.js
// 🎨 Gestor Universal de Temas (wiTema) - Detección Smart OS & Cero FOUC
const STORAGE_KEY = 'wiTema';

export const witemas = {
  futuro: '#05080c',
  luz: '#f4f7fb'
};

export const wiTema = {
  // Detección Smart: blanco (luz) si el dispositivo prefiere light, sino noche (futuro)
  detectarSistema: () => (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) ? 'luz' : 'futuro',

  get: () => {
    try {
      return localStorage.getItem(STORAGE_KEY) || wiTema.detectarSistema();
    } catch {
      return wiTema.detectarSistema();
    }
  },

  set: (nombre, persistir = true) => {
    const tema = (nombre === 'luz' || nombre === 'futuro') ? nombre : 'futuro';
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.dataset.theme = tema;

      // Actualizar icono de tema en cabeceras o barras de herramientas
      const icons = document.querySelectorAll('#themeIcon, #icon_theme');
      icons.forEach(icon => {
        icon.className = tema === 'futuro' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
      });

      // Actualizar meta theme-color para la barra del navegador móvil
      let meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'theme-color';
        document.head.appendChild(meta);
      }
      meta.content = witemas[tema] || (tema === 'futuro' ? '#05080c' : '#ffffff');

      // Botones activos con clase .tema
      document.querySelectorAll('.tema').forEach(x => {
        x.classList.toggle('mtha', x.dataset?.ths === tema);
      });
    }

    if (persistir) {
      try {
        localStorage.setItem(STORAGE_KEY, tema);
      } catch {}
    }
  },

  toggle: () => {
    const actual = (typeof document !== 'undefined' && document.documentElement.dataset.theme) || wiTema.get();
    wiTema.set(actual === 'futuro' ? 'luz' : 'futuro', true);
  },

  // Escucha reactiva si el usuario cambia el tema en su dispositivo en tiempo real
  listen: () => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
      try {
        if (!localStorage.getItem(STORAGE_KEY)) {
          wiTema.set(e.matches ? 'luz' : 'futuro', false);
        }
      } catch {}
    });
  },

  init: () => {
    wiTema.set(wiTema.get(), false);
    wiTema.listen();
  }
};

// Aliases para compatibilidad total con código existente
export const setTema = (name) => wiTema.set(name, true);
export const getTemaActual = wiTema.get;
export const witema = wiTema.init;

export default wiTema;
