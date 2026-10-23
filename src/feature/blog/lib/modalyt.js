// src/feature/blog/lib/modalyt.js
// Lightbox Modal para Videos de YouTube (WPO: 0KB inicial)
// Extraído de la arquitectura Workwii para Gaswii

let _ytClickRef = null;

function injectYtStyles() {
  if (document.getElementById('wi-yt-styles')) return;
  const s = document.createElement('style');
  s.id = 'wi-yt-styles';
  s.textContent = `
#wi_yt_modal {
  display: none !important;
  position: fixed !important;
  top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
  width: 100vw !important; height: 100vh !important;
  background: rgba(0, 0, 0, 0.85) !important;
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
  z-index: 999999 !important;
  align-items: center !important;
  justify-content: center !important;
  margin: 0 !important; padding: 0 !important;
}
#wi_yt_modal.active,
#wi_yt_modal.open {
  display: flex !important;
}
  `;
  document.head.appendChild(s);
}

function closeYtModal() {
  const modal = document.getElementById('wi_yt_modal');
  if (modal) {
    modal.classList.remove('open', 'active');
    const p = document.getElementById('wi_yt_player');
    if (p) p.innerHTML = '';
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
  }
}

/**
 * Registra el listener de delegación para abrir videos de YouTube en un lightbox modal.
 * Crea el DOM del modal de forma lazy (solo en el primer clic).
 */
export function initYtModal() {
  injectYtStyles();
  if (_ytClickRef) return;

  _ytClickRef = (e) => {
    const link = e.target?.closest?.('a[href*="youtube.com"], a[href*="youtu.be"], .po_yt_link');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    const ytMatch = href.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/i);
    if (!ytMatch) return;
    e.preventDefault();

    const id = ytMatch[1];

    let modal = document.getElementById('wi_yt_modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'wi_yt_modal';
      modal.className = 'wiModal';
      modal.innerHTML = `
        <div class="modalBody" style="position: relative; max-width: 900px; width: 92vw; aspect-ratio: 16/9; padding: 0; background: #000; overflow: hidden; border-radius: 1.8vh; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 24px 80px rgba(0,0,0,0.85);">
          <button class="wim_yt_close" aria-label="Cerrar video" style="position: absolute; top: 1.5vh; right: 1.5vh; z-index: 10; background: rgba(0,0,0,0.7); color: #fff; border: 1px solid rgba(255,255,255,0.3); border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s;"><i class="fa-solid fa-xmark"></i></button>
          <div id="wi_yt_player" style="width: 100%; height: 100%;"></div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('.wim_yt_close')?.addEventListener('click', (ev) => {
        ev.stopPropagation();
        closeYtModal();
      });

      modal.addEventListener('click', (ev) => {
        if (ev.target === modal) closeYtModal();
      });
    }

    const player = document.getElementById('wi_yt_player');
    if (player) {
      player.innerHTML = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${id}?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width:100%; height:100%; border:none;"></iframe>`;
    }

    modal.classList.add('open', 'active');
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
  };

  document.addEventListener('click', _ytClickRef);
}

/**
 * Elimina el listener del YouTube lightbox.
 */
export function cleanupYtModal() {
  if (_ytClickRef) {
    document.removeEventListener('click', _ytClickRef);
    _ytClickRef = null;
  }
  closeYtModal();
}
