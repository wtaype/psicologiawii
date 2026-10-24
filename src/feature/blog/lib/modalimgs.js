// src/feature/blog/lib/modalimgs.js
// Galería de Imágenes estilo Picasa v2.2 para el Feature Blog
// Autocontenido, responsivo, soporte táctil (swipe), zoom con rueda y tira de miniaturas

let _imgClickRef = null;
let _keyRef = null;
let _wheelRef = null;
let _galeria = [];
let _idx = 0;
let _modal = null;
let _imgEl = null;
let _captionEl = null;
let _counterEl = null;
let _stripEl = null;
let _built = false;
let _touchStartX = 0;
let _zoomLevel = 1;
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 3.5;
const ZOOM_STEP = 0.25;

// Variables para arrastre de imagen con zoom (Pan)
let _isDragging = false;
let _dragStartX = 0;
let _dragStartY = 0;
let _panX = 0;
let _panY = 0;

// ── CSS autocontenido ────────────────────────────────────────────────
const WIM_CSS_ID = 'wim-styles';
function injectStyles() {
  if (document.getElementById(WIM_CSS_ID)) return;
  const s = document.createElement('style');
  s.id = WIM_CSS_ID;
  s.textContent = `
/* ── CONTENEDOR RAÍZ DEL MODAL (PANTALLA COMPLETA FIJA) ── */
#wi_img_modal {
  display: none !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  background: rgba(0, 0, 0, 0.78) !important;
  backdrop-filter: blur(14px) !important;
  -webkit-backdrop-filter: blur(14px) !important;
  z-index: 999999 !important;
  align-items: center !important;
  justify-content: center !important;
  box-sizing: border-box !important;
  margin: 0 !important;
  padding: 0 !important;
}

#wi_img_modal.active,
#wi_img_modal.open {
  display: flex !important;
  animation: wim_fade_in 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

@keyframes wim_fade_in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes wim_cute_pop {
  from {
    transform: scale(0.92) translateY(-2.5vh);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

#wi_img_modal.active .modalBody.wim_body,
#wi_img_modal.open .modalBody.wim_body {
  animation: wim_cute_pop 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}

.modalBody.wim_body {
  max-width: 100vw;
  width: 93%;
  height: 100vh;
}
#wi_img_modal .modalBody.wim_body {
  position: relative !important;
  display: block !important;
  background: rgba(15, 23, 42, 0.88) !important;
  backdrop-filter: blur(28px) !important;
  -webkit-backdrop-filter: blur(28px) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  padding: 0 !important;
  border-radius: 2vh !important;
  overflow: hidden !important;
  width: 92% !important;
  height: 94vh !important;
  max-height: 94vh !important;
  box-sizing: border-box !important;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.75) !important;
}

#wi_img_modal .wim_close {
  position: absolute !important;
  top: 2.2vh !important;
  right: 2.2vh !important;
  z-index: 12 !important;
  background: rgba(255,255,255,0.1) !important;
  border: 1px solid rgba(255,255,255,0.2) !important;
  color: rgba(255,255,255,0.9) !important;
  font-size: 1rem !important;
  cursor: pointer !important;
  line-height: 1 !important;
  border-radius: 50% !important;
  width: 3.8vh !important; height: 3.8vh !important;
  min-width: 32px; min-height: 32px;
  display: flex !important; align-items: center !important; justify-content: center !important;
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
  transition: all 0.2s ease !important;
}
#wi_img_modal .wim_close:hover {
  background: rgba(239, 68, 68, 0.6) !important;
  border-color: rgba(239, 68, 68, 0.8) !important;
  color: #fff !important;
  transform: scale(1.08) !important;
}

/* Stage */
.wim_stage {
  position: absolute !important;
  top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
  width: 100% !important; height: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: transparent !important;
  z-index: 1 !important;
  overflow: hidden !important;
}
.wim_img_wrap {
  width: 100% !important;
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 2vh 8vh 13vh 8vh !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
}
.wim_img {
  max-width: 100% !important;
  max-height: 100% !important;
  object-fit: contain !important;
  display: block !important;
  transition: opacity 0.22s ease, transform 0.1s linear !important;
  border-radius: 1vh !important;
  box-shadow: 0 12px 48px rgba(0,0,0,0.5) !important;
  transform-origin: center center !important;
  cursor: zoom-in !important;
  will-change: transform, opacity !important;
  user-select: none !important;
}
.wim_img.wim_zoomed { cursor: grab !important; }
.wim_img.wim_dragging { cursor: grabbing !important; transition: opacity 0.22s ease, transform 0s !important; }

/* Caption row */
.wim_caption_row {
  position: absolute !important;
  bottom: 7.2vh !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  z-index: 8 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 1.2vh !important;
  padding: 0.6vh 1.8vh !important;
  background: rgba(0, 0, 0, 0.5) !important;
  border: 1px solid rgba(255, 255, 255, 0.14) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  border-radius: 20px !important;
  max-width: 75% !important;
  white-space: nowrap !important;
  pointer-events: none !important;
}
.wim_caption {
  color: rgba(255,255,255,0.92) !important;
  font-size: 0.85rem !important;
  font-style: italic !important;
  font-family: inherit !important;
  margin: 0 !important;
  text-align: center !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}
.wim_counter {
  color: rgba(255,255,255,0.7) !important;
  font-size: 0.75rem !important;
  font-weight: 700 !important;
  white-space: nowrap !important;
  background: rgba(255,255,255,0.15) !important;
  padding: 0.1vh 0.7vh !important;
  border-radius: 10px !important;
  border: 1px solid rgba(255,255,255,0.1) !important;
  line-height: 1.4 !important;
}

/* Flechas flotantes */
.wim_prev, .wim_next {
  position: absolute !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  background: rgba(255,255,255,0.1) !important;
  color: rgba(255,255,255,0.9) !important;
  border: 1px solid rgba(255,255,255,0.2) !important;
  border-radius: 50% !important;
  width: 4.8vh !important; height: 4.8vh !important;
  min-width: 38px !important; min-height: 38px !important;
  cursor: pointer !important;
  display: flex !important; align-items: center !important; justify-content: center !important;
  font-size: 1rem !important;
  transition: all 0.22s cubic-bezier(.25,.46,.45,.94) !important;
  z-index: 10 !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3) !important;
}
.wim_prev { left: 2.2vh !important; }
.wim_next { right: 2.2vh !important; }
.wim_prev:hover, .wim_next:hover {
  background: rgba(56, 189, 248, 0.7) !important;
  border-color: rgba(56, 189, 248, 1) !important;
  color: #fff !important;
  transform: translateY(-50%) scale(1.08) !important;
}

/* Strip */
.wim_strip {
  position: absolute !important;
  bottom: 1.8vh !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  z-index: 8 !important;
  display: flex !important;
  gap: 0.6vh !important;
  padding: 0.5vh 0.8vh !important;
  background: rgba(0, 0, 0, 0.4) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
  border-radius: 1.2vh !important;
  max-width: 85% !important;
  overflow-x: auto !important;
  justify-content: center !important;
  flex-wrap: nowrap !important;
  scrollbar-width: none !important;
}
.wim_strip::-webkit-scrollbar { display: none !important; }
.wim_thumb {
  width: 36px !important; height: 36px !important;
  object-fit: cover !important;
  border-radius: 0.5vh !important;
  cursor: pointer !important;
  flex-shrink: 0 !important;
  opacity: 0.45 !important;
  border: 1.5px solid transparent !important;
  transition: all 0.2s ease !important;
}
.wim_thumb:hover {
  opacity: 0.85 !important;
  transform: scale(1.08) !important;
}
.wim_thumb.active {
  opacity: 1 !important;
  border-color: var(--brand-primary, #104356) !important;
  transform: scale(1.12) !important;
  box-shadow: 0 4px 14px rgba(56, 189, 248, 0.5) !important;
}

.wim_solo .wim_prev,
.wim_solo .wim_next,
.wim_solo .wim_counter,
.wim_solo .wim_strip { display: none !important; }

/* Cursor en artículo */
.wi_img_clickable { cursor: zoom-in !important; }

/* Responsive */
@media (max-width: 768px) {
  #wi_img_modal .modalBody.wim_body { max-width: 98vw !important; border-radius: 1.5vh !important; }
  .wim_img_wrap { padding: 1.5vh 5vh !important; }
  .wim_caption_row { bottom: 6.5vh !important; max-width: 90% !important; }
  .wim_strip { bottom: 1.5vh !important; max-width: 95% !important; }
  .wim_thumb { width: 30px !important; height: 30px !important; }
  .wim_prev, .wim_next { width: 4vh !important; height: 4vh !important; min-width: 34px !important; min-height: 34px !important; }
  .wim_prev { left: 1.2vh !important; }
  .wim_next { right: 1.2vh !important; }
}
  `;
  document.head.appendChild(s);
}

function closeModal() {
  if (_modal) {
    _modal.classList.remove('open', 'active');
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
  }
}

// ── DOM del modal ────────────────────────────────────────────────────
function buildModal() {
  if (_built && _modal) return;
  _built = true;

  injectStyles();

  if (!document.getElementById('wi_img_modal')) {
    _modal = document.createElement('div');
    _modal.id = 'wi_img_modal';
    _modal.className = 'wiModal';
    _modal.innerHTML = `
      <div class="modalBody wim_body">
        <button class="wim_close modalX" aria-label="Cerrar galería"><i class="fa-solid fa-xmark"></i></button>
        <div class="wim_stage">
          <button class="wim_prev" aria-label="Imagen anterior"><i class="fa-solid fa-chevron-left"></i></button>
          <div class="wim_img_wrap">
            <img class="wim_img" src="" alt="" draggable="false" />
          </div>
          <button class="wim_next" aria-label="Imagen siguiente"><i class="fa-solid fa-chevron-right"></i></button>
        </div>
        <div class="wim_caption_row">
          <p class="wim_caption"></p>
          <span class="wim_counter"></span>
        </div>
        <div class="wim_strip"></div>
      </div>
    `;
    document.body.appendChild(_modal);
  } else {
    _modal = document.getElementById('wi_img_modal');
  }

  _imgEl     = _modal.querySelector('.wim_img');
  _captionEl = _modal.querySelector('.wim_caption');
  _counterEl = _modal.querySelector('.wim_counter');
  _stripEl   = _modal.querySelector('.wim_strip');

  _modal.querySelector('.wim_close').addEventListener('click', (e) => {
    e.stopPropagation();
    closeModal();
  });

  _modal.addEventListener('click', (e) => {
    if (e.target === _modal || e.target.classList.contains('wim_stage') || e.target.classList.contains('wim_img_wrap')) {
      closeModal();
    }
  });

  _modal.querySelector('.wim_prev').addEventListener('click', (e) => { e.stopPropagation(); goto(_idx - 1); });
  _modal.querySelector('.wim_next').addEventListener('click', (e) => { e.stopPropagation(); goto(_idx + 1); });

  let dragThresholdPassed = false;

  _imgEl.addEventListener('mousedown', (e) => {
    if (Math.abs(_zoomLevel - 1) <= 0.02) return;
    e.preventDefault();
    _isDragging = true;
    dragThresholdPassed = false;
    _dragStartX = e.clientX - _panX;
    _dragStartY = e.clientY - _panY;
    _imgEl.classList.add('wim_dragging');
  });

  _modal.addEventListener('mousemove', (e) => {
    if (!_isDragging) return;
    e.preventDefault();
    const nx = e.clientX - _dragStartX;
    const ny = e.clientY - _dragStartY;
    if (Math.abs(nx - _panX) > 4 || Math.abs(ny - _panY) > 4) {
      dragThresholdPassed = true;
    }
    _panX = nx;
    _panY = ny;
    updateTransform();
  });

  const stopDrag = () => {
    if (!_isDragging) return;
    _isDragging = false;
    _imgEl.classList.remove('wim_dragging');
  };
  _modal.addEventListener('mouseup', stopDrag);
  _modal.addEventListener('mouseleave', stopDrag);

  // Soporte móvil táctil
  _imgEl.addEventListener('touchstart', (e) => {
    if (Math.abs(_zoomLevel - 1) <= 0.02) return;
    _isDragging = true;
    dragThresholdPassed = false;
    _dragStartX = e.touches[0].clientX - _panX;
    _dragStartY = e.touches[0].clientY - _panY;
    _imgEl.classList.add('wim_dragging');
  }, { passive: true });

  _imgEl.addEventListener('touchmove', (e) => {
    if (!_isDragging) return;
    const nx = e.touches[0].clientX - _dragStartX;
    const ny = e.touches[0].clientY - _dragStartY;
    if (Math.abs(nx - _panX) > 4 || Math.abs(ny - _panY) > 4) {
      dragThresholdPassed = true;
    }
    _panX = nx;
    _panY = ny;
    updateTransform();
  }, { passive: true });

  _imgEl.addEventListener('touchend', stopDrag, { passive: true });

  _imgEl.addEventListener('click', (e) => {
    e.stopPropagation();
    if (dragThresholdPassed) return;
    if (Math.abs(_zoomLevel - 1) > 0.02) resetZoom();
    else applyZoom(1.8);
  });

  // Scroll = zoom
  _wheelRef = (e) => {
    if (!_modal || !_modal.classList.contains('active')) return;
    const stage = _modal.querySelector('.wim_stage');
    if (!stage || !stage.contains(e.target)) return;
    e.preventDefault();
    applyZoom(_zoomLevel + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
  };
  window.addEventListener('wheel', _wheelRef, { passive: false });

  // Swipe táctil en móvil
  const stage = _modal.querySelector('.wim_stage');
  stage.addEventListener('touchstart', (e) => {
    if (Math.abs(_zoomLevel - 1) > 0.02) return;
    _touchStartX = e.touches[0].clientX;
  }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (Math.abs(_zoomLevel - 1) > 0.02) return;
    const dx = e.changedTouches[0].clientX - _touchStartX;
    if (Math.abs(dx) > 55) goto(dx < 0 ? _idx + 1 : _idx - 1);
  });
}

function updateTransform() {
  if (Math.abs(_zoomLevel - 1) > 0.02) {
    _imgEl.style.transform = `scale(${_zoomLevel.toFixed(2)}) translate(${(_panX / _zoomLevel).toFixed(1)}px, ${(_panY / _zoomLevel).toFixed(1)}px)`;
  } else {
    _imgEl.style.transform = '';
  }
}

function applyZoom(level) {
  _zoomLevel = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, level));
  _imgEl.classList.toggle('wim_zoomed', Math.abs(_zoomLevel - 1) > 0.02);
  if (Math.abs(_zoomLevel - 1) <= 0.02) {
    _panX = 0;
    _panY = 0;
  }
  updateTransform();
}

function resetZoom() {
  _zoomLevel = 1;
  _panX = 0;
  _panY = 0;
  if (_imgEl) {
    _imgEl.classList.remove('wim_zoomed');
    _imgEl.style.transform = '';
  }
}

function buildStrip() {
  if (!_stripEl) return;
  _stripEl.innerHTML = '';
  _galeria.forEach((item, i) => {
    const thumb = document.createElement('img');
    thumb.className = 'wim_thumb';
    thumb.src = item.src;
    thumb.alt = item.alt;
    thumb.dataset.idx = String(i);
    thumb.addEventListener('click', (e) => { e.stopPropagation(); goto(i); });
    _stripEl.appendChild(thumb);
  });
}

function goto(idx) {
  const total = _galeria.length;
  if (total === 0) return;
  _idx = ((idx % total) + total) % total;
  resetZoom();

  _imgEl.style.opacity = '0';
  setTimeout(() => {
    const item = _galeria[_idx];
    if (item && _imgEl) {
      _imgEl.src = item.src;
      _imgEl.alt = item.alt;
      _captionEl.textContent = item.alt || '';
      _counterEl.textContent = total > 1 ? `${_idx + 1} / ${total}` : '';
      _imgEl.style.opacity = '1';
    }
  }, 110);

  if (_stripEl) {
    _stripEl.querySelectorAll('.wim_thumb').forEach((t, i) => t.classList.toggle('active', i === _idx));
    const active = _stripEl.querySelector('.wim_thumb.active');
    if (active) active.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
  }
}

function openModal(clickedSrc) {
  _galeria = [];
  document.querySelectorAll('.po_contenido img').forEach((img) => {
    const src = img.getAttribute('src') || img.src || '';
    if (src) _galeria.push({ src, alt: img.alt || '' });
  });

  const startIdx = _galeria.findIndex((item) => item.src === clickedSrc || clickedSrc.endsWith(item.src) || item.src.endsWith(clickedSrc));
  _idx = startIdx >= 0 ? startIdx : 0;
  
  _modal.querySelector('.wim_body').classList.toggle('wim_solo', _galeria.length <= 1);
  buildStrip();
  goto(_idx);

  // Activación directa infalible
  _modal.classList.add('open', 'active');
  document.body.classList.add('modal-open');
  document.body.style.overflow = 'hidden';
}

export function initModalImgs(selector) {
  buildModal();

  const contenedor = document.querySelector(selector);
  if (contenedor) {
    contenedor.querySelectorAll('img').forEach((img) => {
      img.classList.add('wi_img_clickable');
    });
  }

  if (!_imgClickRef) {
    _imgClickRef = (e) => {
      const img = e.target?.closest?.('.po_contenido img, .wi_img_clickable');
      if (!img) return;
      e.preventDefault();
      openModal(img.getAttribute('src') || img.src || '');
    };
    document.addEventListener('click', _imgClickRef);
  }

  if (!_keyRef) {
    _keyRef = (e) => {
      if (!_modal || !_modal.classList.contains('active')) return;
      if (e.key === 'Escape')             { closeModal(); return; }
      if (e.key === 'ArrowLeft')          { goto(_idx - 1); return; }
      if (e.key === 'ArrowRight')         { goto(_idx + 1); return; }
      if (e.key === '+' || e.key === '=') { e.preventDefault(); applyZoom(_zoomLevel + ZOOM_STEP); return; }
      if (e.key === '-')                  { e.preventDefault(); applyZoom(_zoomLevel - ZOOM_STEP); return; }
      if (e.key === '0')                  { e.preventDefault(); resetZoom(); return; }
    };
    document.addEventListener('keydown', _keyRef);
  }
}

export function cleanupModalImgs() {
  if (_imgClickRef) { document.removeEventListener('click', _imgClickRef); _imgClickRef = null; }
  if (_keyRef)      { document.removeEventListener('keydown', _keyRef); _keyRef = null; }
  if (_wheelRef)    { window.removeEventListener('wheel', _wheelRef); _wheelRef = null; }
  closeModal();
  _galeria = [];
  _built = false;
  if (_modal) { _modal.remove(); _modal = null; }
  const styleEl = document.getElementById(WIM_CSS_ID);
  if (styleEl) styleEl.remove();
  _imgEl = _captionEl = _counterEl = _stripEl = null;
  _zoomLevel = ZOOM_MIN;
}
