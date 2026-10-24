// src/core/servicios/hidratarNegocio.js
// 🌐 Motor de Sincronización e Hidratación Dinámica de Datos de Negocio (Gaswii Web)
// Conecta Firebase Firestore + Local-First con la Web Pública e Inicio en Tiempo Real.
// Cero datos fijos o sueltos: cualquier cambio en Personal se refleja inmediatamente en Inicio.

import { obtenerDatosNegocio } from '../../negocio.js';

/**
 * Aplica cache-busting dinámico para forzar la actualización inmediata de imágenes
 * @param {string} url - URL de la imagen
 * @param {number|string} ts - Marca de tiempo de versión
 * @returns {string} URL con parámetro de versión única
 */
export function aplicarCacheBusting(url, ts) {
  if (!url || typeof url !== 'string') return url;
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  const separador = url.includes('?') ? '&' : '?';
  const version = ts ? encodeURIComponent(ts) : Date.now();
  if (url.includes('v=')) {
    return url.replace(/([?&])v=[^&]+/, `$1v=${version}`);
  }
  return `${url}${separador}v=${version}`;
}

/**
 * Hidrata todos los elementos interactivos del DOM con la ficha oficial de negocio
 * @param {Object} datos - Objeto de configuración normalizado de negocio
 */
export function hidratarNegocioEnDOM(datos) {
  if (!datos || typeof datos !== 'object' || typeof document === 'undefined') return;

  if (typeof window !== 'undefined') {
    window.__negocioActual = datos;
  }

  const contacto = datos.contacto || {};
  const ubicacion = datos.ubicacion || {};
  const identidad = datos.identidad || {};

  const rawWs = contacto.whatsapp || contacto.telefonoLimpio || '';
  const wsLimpio = String(rawWs).replace(/\D/g, '');

  const telFormateado = contacto.telefono || '';
  const telLimpio = String(contacto.telefonoLimpio || telFormateado).replace(/\D/g, '');

  const isEn = typeof window !== 'undefined' && window.location.pathname.startsWith('/en');
  const hRaw = contacto.horario;
  const horario = typeof hRaw === 'object' && hRaw !== null
    ? (isEn ? (hRaw.en || hRaw.es || '') : (hRaw.es || hRaw.en || ''))
    : (hRaw || (isEn ? contacto.horarioEn : '') || '');

  const nombre = identidad.nombre || '';

  // 1. HIDRATAR TODOS LOS ENLACES DE WHATSAPP
  if (wsLimpio) {
    document.querySelectorAll('a[href*="wa.me/"]').forEach(a => {
      try {
        const urlActual = a.getAttribute('href') || '';
        const regexWa = /wa\.me\/(?:\d+|undefined)/;
        if (regexWa.test(urlActual)) {
          a.setAttribute('href', urlActual.replace(regexWa, `wa.me/${wsLimpio}`));
        }
      } catch (e) {}
    });

    document.querySelectorAll('[data-ws-num]').forEach(el => {
      el.setAttribute('data-ws-num', wsLimpio);
    });

    document.querySelectorAll('[data-negocio-ws-text]').forEach(el => {
      el.textContent = `+${wsLimpio}`;
    });
  }

  // 2. HIDRATAR TELÉFONOS
  if (telLimpio) {
    document.querySelectorAll('a[href^="tel:"], [data-negocio-tel-link]').forEach(a => {
      a.setAttribute('href', `tel:${telLimpio}`);
    });
  }

  if (telFormateado) {
    document.querySelectorAll('[data-negocio-tel-text], .sos-sub-phone').forEach(el => {
      el.textContent = telFormateado;
    });
  }

  // 3. HIDRATAR DIRECCIÓN Y MAPAS
  if (direccion) {
    document.querySelectorAll('[data-negocio-direccion], [data-negocio-direccion-sede]').forEach(el => {
      el.textContent = direccion;
    });
  }

  if (mapsUrl) {
    document.querySelectorAll('[data-negocio-maps], .mapa-btn-action').forEach(a => {
      a.setAttribute('href', mapsUrl);
    });
  }

  // 4. HIDRATAR HORARIOS
  if (horario) {
    document.querySelectorAll('[data-negocio-horario]').forEach(el => {
      el.textContent = horario;
    });
  }

  // 5. HIDRATAR IDENTIDAD Y MARCA
  if (nombre) {
    document.querySelectorAll('[data-negocio-nombre]').forEach(el => {
      el.textContent = nombre;
    });
  }

  const titulo = datos.titulo || '';
  if (titulo) {
    document.querySelectorAll('[data-negocio-titulo]').forEach(el => {
      el.textContent = titulo;
    });
  }

  const subtitulo = datos.subtitulo || identidad.subtitulo || '';
  if (subtitulo) {
    document.querySelectorAll('[data-negocio-subtitulo], [data-negocio-slogan]').forEach(el => {
      el.textContent = subtitulo;
    });
  }

  const razonSocial = identidad.razonSocial || '';
  if (razonSocial) {
    document.querySelectorAll('[data-negocio-razon-social], [data-negocio-autorizacion]').forEach(el => {
      el.textContent = razonSocial;
    });
  }

  const ruc = identidad.ruc || '';
  if (ruc) {
    document.querySelectorAll('[data-negocio-ruc]').forEach(el => {
      el.textContent = ruc;
    });
  }

  const metricas = datos.metricas || {};
  if (metricas.dias) {
    document.querySelectorAll('[data-negocio-metrica-dias]').forEach(el => {
      el.textContent = metricas.dias;
    });
  }
  if (metricas.years) {
    document.querySelectorAll('[data-negocio-metrica-years]').forEach(el => {
      el.textContent = metricas.years;
    });
  }
  if (metricas.clientes || metricas.pacientes) {
    const valPacientes = metricas.pacientes || metricas.clientes;
    document.querySelectorAll('[data-negocio-metrica-clientes], [data-negocio-metrica-pacientes]').forEach(el => {
      el.textContent = valPacientes;
    });
  }
  if (metricas.confidencialidad || metricas.balanza) {
    const valConf = metricas.confidencialidad || metricas.balanza;
    document.querySelectorAll('[data-negocio-metrica-confidencial]').forEach(el => {
      el.textContent = valConf;
    });
  }
  if (metricas.colegiatura || identidad.colegiatura) {
    const colVal = metricas.colegiatura || identidad.colegiatura || '';
    document.querySelectorAll('[data-negocio-colegiatura]').forEach(el => {
      el.textContent = colVal;
    });
  }

  // 5.1 HIDRATAR CAMPOS CLAVE DEL HERO DE INICIO (0ms Live)
  const hero = datos.hero || {};
  const heroH1 = (isEn ? (hero.titulo?.en || hero.tituloEn) : (hero.titulo?.es || hero.titulo)) || '';
  if (heroH1) {
    document.querySelectorAll('[data-negocio-hero-h1]').forEach(el => {
      el.textContent = heroH1;
    });

    // Dividir en base y resaltado para mantener el gradiente CRO
    const elBase = document.querySelector('[data-negocio-hero-base]');
    const elHigh = document.querySelector('[data-negocio-hero-highlight]');
    if (elBase && elHigh) {
      if (heroH1.includes('ansiedad te sobrepasan?')) {
        const partes = heroH1.split('ansiedad te sobrepasan?');
        elBase.textContent = partes[0];
        elHigh.textContent = 'ansiedad te sobrepasan?';
      } else {
        const palabras = heroH1.trim().split(/\s+/);
        if (palabras.length > 3) {
          const corte = Math.max(1, palabras.length - 3);
          elBase.textContent = palabras.slice(0, corte).join(' ') + ' ';
          elHigh.textContent = palabras.slice(corte).join(' ');
        } else {
          elBase.textContent = heroH1;
          elHigh.textContent = '';
        }
      }
    }
  }

  const heroSub = (isEn ? (hero.subtitulo?.en || hero.subtituloEn) : (hero.subtitulo?.es || hero.subtitulo)) || '';
  if (heroSub) {
    document.querySelectorAll('[data-negocio-hero-sub]').forEach(el => {
      el.textContent = heroSub;
    });
  }

  const heroBadge = (isEn ? (hero.badge?.en || hero.badgeEn) : (hero.badge?.es || hero.badge)) || '';
  if (heroBadge) {
    document.querySelectorAll('[data-negocio-badge]').forEach(el => {
      el.textContent = heroBadge;
    });
  }

  const driverTit = (isEn ? (hero.driverTitulo?.en || hero.driverTituloEn) : (hero.driverTitulo?.es || hero.driverTitulo)) || '';
  if (driverTit) {
    document.querySelectorAll('[data-negocio-driver-titulo]').forEach(el => {
      el.textContent = driverTit;
    });
  }

  const driverDesc = (isEn ? (hero.driverDesc?.en || hero.driverDescEn) : (hero.driverDesc?.es || hero.driverDesc)) || '';
  if (driverDesc) {
    document.querySelectorAll('[data-negocio-driver-desc]').forEach(el => {
      el.textContent = driverDesc;
    });
  }

  if (hero.driverPrecio) {
    document.querySelectorAll('[data-negocio-driver-precio]').forEach(el => {
      el.textContent = `S/ ${Number(hero.driverPrecio).toFixed(2)}`;
    });
  }

  const espNombre = identidad.especialista || datos.especialista || '';
  if (espNombre) {
    document.querySelectorAll('[data-negocio-especialista-nombre]').forEach(el => {
      el.textContent = espNombre;
    });
  }

  const espGrado = (isEn ? (identidad.grado?.en || identidad.gradoEn) : (identidad.grado?.es || identidad.grado)) || datos.grado || '';
  if (espGrado) {
    document.querySelectorAll('[data-negocio-especialista-enfoque]').forEach(el => {
      el.textContent = espGrado;
    });
  }

  // 6. HIDRATAR REDES SOCIALES
  const redes = datos.redes || {};
  if (redes && typeof redes === 'object') {
    const normalizarUrl = (val, tipo) => {
      if (!val || typeof val !== 'string') return '';
      const v = val.trim();
      if (!v) return '';
      if (v.startsWith('http://') || v.startsWith('https://')) return v;
      const h = v.replace(/^[@/]+/, '');
      switch (tipo) {
        case 'youtube': return `https://youtube.com/@${h}`;
        case 'facebook': return `https://facebook.com/${h}`;
        case 'instagram': return `https://instagram.com/${h}`;
        case 'tiktok': return `https://tiktok.com/@${h}`;
        case 'linkedin': return `https://linkedin.com/in/${h}`;
        case 'twitter': return `https://x.com/${h}`;
        case 'web': return `https://${h}`;
        default: return v;
      }
    };

    const mapeoRedes = [
      { id: 'facebook', val: normalizarUrl(redes.facebook, 'facebook') },
      { id: 'instagram', val: normalizarUrl(redes.instagram, 'instagram') },
      { id: 'tiktok', val: normalizarUrl(redes.tiktok, 'tiktok') },
      { id: 'web', val: normalizarUrl(redes.web, 'web') },
      { id: 'maps', val: redes.maps || mapsUrl },
      { id: 'telefono', val: telLimpio ? `tel:${telLimpio}` : '' },
      { id: 'whatsapp', val: wsLimpio ? `https://wa.me/${wsLimpio}` : '' }
    ];

    mapeoRedes.forEach(({ id, val }) => {
      document.querySelectorAll(`a[data-red-id="${id}"]`).forEach(a => {
        if (val) {
          a.setAttribute('href', val);
          a.style.display = '';
        } else {
          a.style.display = 'none';
        }
      });
    });

    const handle = redes.instagramUser 
      ? `@${redes.instagramUser.replace(/^@/, '')}`
      : (redes.tiktokUser 
          ? `@${redes.tiktokUser.replace(/^@/, '')}`
          : (identidad.nombreCorto ? `@${identidad.nombreCorto.toLowerCase().replace(/\s+/g, '')}` : ''));

    document.querySelectorAll('[data-negocio-handle]').forEach(el => {
      if (handle) {
        el.textContent = handle;
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    });

    const bio = datos.subtitulo || identidad.subtitulo || (typeof identidad.bio === 'object' ? identidad.bio?.es : identidad.bio) || datos.bio || '';
    document.querySelectorAll('[data-negocio-bio]').forEach(el => {
      if (bio) {
        el.textContent = bio;
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    });

    // 7. HIDRATAR IMÁGENES CON CACHE-BUSTING EN VIVO (Evita imágenes pegadas en caché)
    const logo = identidad.logo || '';
    const avatar = identidad.imagenSede || datos.hero?.imagen || identidad.logo || '';
    const heroImg = datos.hero?.imgHero || identidad.imagenSede || '';
    const tsVersion = datos.actualizado?.seconds || (typeof datos.actualizado === 'string' ? Date.parse(datos.actualizado) : null) || Date.now();

    if (avatar) {
      const avatarFresco = aplicarCacheBusting(avatar, tsVersion);
      document.querySelectorAll('[data-negocio-avatar]').forEach(img => {
        img.setAttribute('src', avatarFresco);
      });
    }

    if (heroImg) {
      const heroFresco = aplicarCacheBusting(heroImg, tsVersion);
      document.querySelectorAll('[data-negocio-foto-especialista]').forEach(img => {
        img.setAttribute('src', heroFresco);
      });
    }

    if (logo) {
      const logoFresco = aplicarCacheBusting(logo, tsVersion);
      document.querySelectorAll('[data-negocio-logo], .header-logo-img').forEach(img => {
        img.setAttribute('src', logoFresco);
      });
    }
  }
}

let _sincronizacionIniciada = false;

export function iniciarSincronizacionNegocio() {
  if (typeof window === 'undefined') return;

  try {
    const rawLocal = localStorage.getItem('wi_negocio');
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      const data = parsed?.value || parsed;
      if (data && (data.contacto || data.identidad || data.redes || data.ubicacion)) {
        hidratarNegocioEnDOM(data);
      }
    } else {
      const enMemoria = obtenerDatosNegocio();
      if (enMemoria) {
        hidratarNegocioEnDOM(enMemoria);
      }
    }
  } catch (e) {}

  if (_sincronizacionIniciada) return;
  _sincronizacionIniciada = true;

  const manejadorActualizacion = (e) => {
    if (e.detail) {
      hidratarNegocioEnDOM(e.detail);
    }
  };

  window.addEventListener('wi:negocio-actualizado', manejadorActualizacion);
  window.addEventListener('gaswii:negocio-actualizado', manejadorActualizacion);

  window.addEventListener('storage', (e) => {
    if ((e.key === 'wi_negocio' || e.key === 'gaswii_negocio' || e.key === 'minegocio') && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        const data = parsed?.value || parsed;
        hidratarNegocioEnDOM(data);
      } catch (err) {}
    }
  });
}

export default {
  hidratarNegocioEnDOM,
  iniciarSincronizacionNegocio
};
