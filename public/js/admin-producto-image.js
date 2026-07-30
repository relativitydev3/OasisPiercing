(function () {
  const zone = document.querySelector('[data-file-editor="producto"]');
  if (!zone) return;

  const OUTPUT_W = 1200;
  const OUTPUT_H = 800;
  const BG_PRESETS = {
    white: '#ffffff',
    cream: '#f5f3ee',
    gray: '#ececef',
    gold: '#f3ead8',
    rose: '#f8ecec',
    sage: '#e6efe6',
    slate: '#dfe0e8',
    dark: '#08080a',
  };
  const ASPECT = OUTPUT_W / OUTPUT_H;
  const WEBP_QUALITY = 0.85;
  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 3;

  const els = {
    form: zone.closest('form'),
    input: zone.querySelector('.admin-file-input'),
    previewImg: zone.querySelector('.admin-file-preview'),
    nameEl: zone.querySelector('.admin-file-name'),
    editorPanel: document.getElementById('producto-image-modal'),
    modalOverlay: document.getElementById('producto-image-modal-overlay'),
    modalCloseBtn: document.getElementById('producto-image-modal-close'),
    stage: document.getElementById('producto-image-stage'),
    canvas: document.getElementById('producto-image-canvas'),
    metaEl: document.getElementById('producto-image-meta'),
    actionsEl: document.getElementById('producto-image-actions'),
    editBtn: document.getElementById('producto-image-edit-btn'),
    resetBtn: document.getElementById('producto-image-reset'),
    applyBtn: document.getElementById('producto-image-apply'),
    cancelBtn: document.getElementById('producto-image-cancel'),
    removeBgBtn: document.getElementById('producto-image-remove-bg'),
    aiBtn: document.getElementById('producto-image-ai-btn'),
    zoomInput: document.getElementById('producto-image-zoom'),
    zoomValue: document.getElementById('producto-image-zoom-value'),
    rotationInput: document.getElementById('producto-image-rotation'),
    rotationValue: document.getElementById('producto-image-rotation-value'),
    brightnessInput: document.getElementById('producto-image-brightness'),
    brightnessValue: document.getElementById('producto-image-brightness-value'),
    contrastInput: document.getElementById('producto-image-contrast'),
    contrastValue: document.getElementById('producto-image-contrast-value'),
    saturationInput: document.getElementById('producto-image-saturation'),
    saturationValue: document.getElementById('producto-image-saturation-value'),
    rotateLeftBtn: document.getElementById('producto-image-rotate-left'),
    rotateRightBtn: document.getElementById('producto-image-rotate-right'),
    flipHBtn: document.getElementById('producto-image-flip-h'),
    flipVBtn: document.getElementById('producto-image-flip-v'),
    fitBtns: document.querySelectorAll('[data-fit]'),
    posBtns: document.querySelectorAll('[data-pos]'),
    bgBtns: document.querySelectorAll('[data-bg]'),
    bgCustomRow: document.getElementById('producto-image-bg-custom'),
    bgColorInput: document.getElementById('producto-image-bg-color'),
  };

  if (!els.form || !els.input || !els.previewImg || !els.canvas || !els.stage) return;

  const outputCanvas = document.createElement('canvas');
  const outputCtx = outputCanvas.getContext('2d', { alpha: true });

  let sourceImage = null;
  let outputFilename = 'producto.webp';
  let processedBlob = null;
  let imageDirty = false;
  let editorSnapshot = null;
  let dragging = false;
  let dragStart = { x: 0, y: 0, ox: 0, oy: 0 };
  let stageRaf = 0;
  let cachedStageW = 0;
  let cachedStageH = 0;

  const state = {
    rotation: 0,
    flipH: false,
    flipV: false,
    brightness: 0,
    contrast: 0,
    saturation: 0,
    fitMode: 'cover',
    baseScale: 1,
    zoomFactor: 1,
    offsetX: 0,
    offsetY: 0,
    background: 'white',
    customBackground: '#ffffff',
  };

  function isImageFile(file) {
    if (file.type && file.type.startsWith('image/')) return true;
    return /\.(jpe?g|png|webp)$/i.test(file.name || '');
  }

  function cloneState() {
    return { ...state };
  }

  function filterCss() {
    const b = 100 + state.brightness;
    const c = 100 + state.contrast;
    const s = 100 + state.saturation;
    return `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
  }

  function effectiveDimensions() {
    if (!sourceImage) return { w: 1, h: 1 };
    const rad = (state.rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));
    return {
      w: sourceImage.width * cos + sourceImage.height * sin,
      h: sourceImage.width * sin + sourceImage.height * cos,
    };
  }

  function computeBaseScale(w, h) {
    if (state.fitMode === 'contain') {
      return Math.min(OUTPUT_W / w, OUTPUT_H / h);
    }
    return Math.max(OUTPUT_W / w, OUTPUT_H / h);
  }

  function totalScale() {
    return state.baseScale * state.zoomFactor;
  }

  function boundingSize() {
    const { w, h } = effectiveDimensions();
    const scale = totalScale();
    return { drawW: w * scale, drawH: h * scale };
  }

  function updateBaseScalePreservingView() {
    const previousTotal = totalScale();
    const { w, h } = effectiveDimensions();
    state.baseScale = computeBaseScale(w, h);
    state.zoomFactor = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, previousTotal / state.baseScale));
    clampOffsets();
    syncZoomControl();
  }

  function resolveBackgroundColor() {
    if (state.background === 'none') return null;
    if (state.background === 'custom') return state.customBackground || '#ffffff';
    return BG_PRESETS[state.background] || BG_PRESETS.white;
  }

  function exportUsesTransparency() {
    return state.background === 'none';
  }

  function exportMimeType() {
    return exportUsesTransparency() ? 'image/png' : 'image/webp';
  }

  function syncOutputFilenameExtension() {
    const base = (outputFilename || 'producto').replace(/\.(webp|png)$/i, '');
    outputFilename = `${base}.${exportUsesTransparency() ? 'png' : 'webp'}`;
  }

  function drawFrame(ctx, outW, outH) {
    const bg = resolveBackgroundColor();
    if (bg) {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, outW, outH);
    } else {
      ctx.clearRect(0, 0, outW, outH);
    }
    if (!sourceImage) return;

    const rad = (state.rotation * Math.PI) / 180;
    const scale = totalScale();

    ctx.save();
    ctx.translate(outW / 2 + state.offsetX, outH / 2 + state.offsetY);
    ctx.rotate(rad);
    ctx.scale(state.flipH ? -scale : scale, state.flipV ? -scale : scale);
    ctx.filter = filterCss();
    ctx.drawImage(sourceImage, -sourceImage.width / 2, -sourceImage.height / 2);
    ctx.restore();
  }

  function resetCrop(resetTransform = true) {
    if (!sourceImage) return;

    if (resetTransform) {
      state.rotation = 0;
      state.flipH = false;
      state.flipV = false;
      state.brightness = 0;
      state.contrast = 0;
      state.saturation = 0;
      state.fitMode = 'cover';
      state.background = 'white';
      state.customBackground = '#ffffff';
      syncControls();
    }

    const { w, h } = effectiveDimensions();
    state.baseScale = computeBaseScale(w, h);
    state.zoomFactor = 1;
    state.offsetX = 0;
    state.offsetY = 0;
    setActivePos('center');
    setActiveFit(state.fitMode);
    syncZoomControl();
  }

  function clampOffsets() {
    const { drawW, drawH } = boundingSize();
    const maxX = Math.max(0, (drawW - OUTPUT_W) / 2);
    const maxY = Math.max(0, (drawH - OUTPUT_H) / 2);
    state.offsetX = Math.min(maxX, Math.max(-maxX, state.offsetX));
    state.offsetY = Math.min(maxY, Math.max(-maxY, state.offsetY));
  }

  function renderOutput() {
    outputCanvas.width = OUTPUT_W;
    outputCanvas.height = OUTPUT_H;
    drawFrame(outputCtx, OUTPUT_W, OUTPUT_H);
    return outputCanvas;
  }

  function syncStageSize() {
    const rect = els.stage.getBoundingClientRect();
    const stageW = Math.max(1, Math.floor(rect.width));
    const stageH = Math.max(1, Math.floor(rect.height));
    if (stageW === cachedStageW && stageH === cachedStageH) return false;

    cachedStageW = stageW;
    cachedStageH = stageH;
    const dpr = window.devicePixelRatio || 1;
    els.canvas.width = Math.floor(stageW * dpr);
    els.canvas.height = Math.floor(stageH * dpr);
    return true;
  }

  function renderStageNow() {
    if (!sourceImage) return;
    syncStageSize();

    const stageW = cachedStageW;
    const stageH = cachedStageH;
    const dpr = window.devicePixelRatio || 1;

    const ctx = els.canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, stageW, stageH);
    ctx.save();
    ctx.scale(stageW / OUTPUT_W, stageH / OUTPUT_H);
    drawFrame(ctx, OUTPUT_W, OUTPUT_H);
    ctx.restore();

    ctx.strokeStyle = 'rgba(212, 168, 83, 0.55)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, stageW - 1, stageH - 1);
  }

  function scheduleStageRender() {
    if (stageRaf) return;
    stageRaf = requestAnimationFrame(() => {
      stageRaf = 0;
      renderStageNow();
    });
  }

  function updatePreviewFromOutput() {
    const mime = exportMimeType();
    const url = mime === 'image/webp'
      ? outputCanvas.toDataURL('image/webp', WEBP_QUALITY)
      : outputCanvas.toDataURL('image/png');
    els.previewImg.src = url;
    zone.classList.add('has-preview', 'has-file');
    zone.style.setProperty('--preview-aspect', `${OUTPUT_W} / ${OUTPUT_H}`);
  }

  function updateMeta(blob) {
    if (!els.metaEl) return;
    const kb = blob ? Math.max(1, Math.round(blob.size / 1024)) : 0;
    const fmt = exportUsesTransparency() ? 'PNG' : 'WebP';
    els.metaEl.textContent = `${OUTPUT_W}×${OUTPUT_H} px · ${fmt} · ~${kb} KB`;
  }

  function exportBlob() {
    return new Promise((resolve) => {
      renderOutput();
      const mime = exportMimeType();
      if (mime === 'image/webp') {
        outputCanvas.toBlob((blob) => resolve(blob), 'image/webp', WEBP_QUALITY);
      } else {
        outputCanvas.toBlob((blob) => resolve(blob), 'image/png');
      }
    });
  }

  function exportApiBlob(mimeType = 'image/png') {
    return new Promise((resolve) => {
      renderOutput();
      const quality = mimeType === 'image/jpeg' ? 0.92 : undefined;
      outputCanvas.toBlob((blob) => resolve(blob), mimeType, quality);
    });
  }

  async function applyOptimization(markDirty = true) {
    syncOutputFilenameExtension();
    renderOutput();
    processedBlob = await exportBlob();
    if (!processedBlob) return;
    updatePreviewFromOutput();
    updateMeta(processedBlob);
    els.nameEl.textContent = `Optimizada: ${outputFilename}`;
    els.actionsEl.hidden = false;
    if (markDirty) imageDirty = true;
  }

  function filenameFromUrl(url) {
    const base = (url.split('/').pop() || 'producto').replace(/\.[^.]+$/, '');
    return `${base}.webp`;
  }

  function filenameFromCodigo() {
    const codigo = document.getElementById('codigo')?.value?.trim();
    if (codigo) return `${codigo.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.webp`;
    return 'producto.webp';
  }

  function loadImageFromUrl(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        sourceImage = img;
        resolve(img);
      };
      img.onerror = () => reject(new Error('No se pudo cargar la imagen del producto.'));
      img.src = url;
    });
  }

  async function showExistingImagePreview(url) {
    outputFilename = filenameFromCodigo() || filenameFromUrl(url);
    await loadImageFromUrl(url);
    resetCrop(true);
    renderOutput();
    els.previewImg.src = outputCanvas.toDataURL('image/webp', WEBP_QUALITY);
    zone.classList.add('has-preview', 'has-file');
    zone.style.setProperty('--preview-aspect', `${OUTPUT_W} / ${OUTPUT_H}`);
    els.nameEl.textContent = 'Imagen actual del producto';
    els.actionsEl.hidden = false;
    if (els.metaEl) els.metaEl.textContent = `${OUTPUT_W}×${OUTPUT_H} px · sin cambios aún`;
  }

  async function initExistingImage() {
    const url = zone.dataset.existingImage;
    if (!url) return;
    try {
      await showExistingImagePreview(url);
    } catch {
      els.nameEl.textContent = 'No se pudo cargar la imagen actual.';
    }
  }

  function syncZoomControl() {
    const pct = Math.round(state.zoomFactor * 100);
    if (els.zoomInput) els.zoomInput.value = String(pct);
    if (els.zoomValue) els.zoomValue.textContent = `${pct}%`;
  }

  function syncControls() {
    syncZoomControl();
    if (els.rotationInput) els.rotationInput.value = String(state.rotation);
    if (els.rotationValue) els.rotationValue.textContent = `${state.rotation}°`;
    if (els.brightnessInput) els.brightnessInput.value = String(state.brightness);
    if (els.brightnessValue) els.brightnessValue.textContent = String(state.brightness);
    if (els.contrastInput) els.contrastInput.value = String(state.contrast);
    if (els.contrastValue) els.contrastValue.textContent = String(state.contrast);
    if (els.saturationInput) els.saturationInput.value = String(state.saturation);
    if (els.saturationValue) els.saturationValue.textContent = String(state.saturation);
    if (els.flipHBtn) {
      els.flipHBtn.classList.toggle('is-active', state.flipH);
      els.flipHBtn.setAttribute('aria-pressed', String(state.flipH));
    }
    if (els.flipVBtn) {
      els.flipVBtn.classList.toggle('is-active', state.flipV);
      els.flipVBtn.setAttribute('aria-pressed', String(state.flipV));
    }
    setActiveFit(state.fitMode);
    setActiveBackground(state.background);
    syncBackgroundControls();
  }

  function setActiveBackground(mode) {
    els.bgBtns.forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.bg === mode);
    });
  }

  function syncBackgroundControls() {
    const isCustom = state.background === 'custom';
    if (els.bgCustomRow) els.bgCustomRow.hidden = !isCustom;
    if (els.bgColorInput) els.bgColorInput.value = state.customBackground || '#ffffff';
    els.stage?.classList.toggle('is-transparent-bg', state.background === 'none');
  }

  function setActiveFit(mode) {
    els.fitBtns.forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.fit === mode);
    });
  }

  function setActivePos(pos) {
    els.posBtns.forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.pos === pos);
    });
  }

  function applyPosition(pos) {
    const { drawW, drawH } = boundingSize();
    const maxX = Math.max(0, (drawW - OUTPUT_W) / 2);
    const maxY = Math.max(0, (drawH - OUTPUT_H) / 2);

    const mapX = { left: -maxX, center: 0, right: maxX };
    const mapY = { top: -maxY, center: 0, bottom: maxY };

    const xKey = pos.includes('left') ? 'left' : pos.includes('right') ? 'right' : 'center';
    const yKey = pos.includes('top') ? 'top' : pos.includes('bottom') ? 'bottom' : 'center';

    state.offsetX = mapX[xKey];
    state.offsetY = mapY[yKey];
    setActivePos(pos);
    scheduleStageRender();
  }

  function loadFile(file) {
    outputFilename = `${(file.name || 'producto').replace(/\.[^.]+$/, '')}.webp`;
    imageDirty = true;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        sourceImage = img;
        resetCrop(true);
        await applyOptimization();
      };
      img.onerror = () => resetAll();
      img.src = reader.result;
    };
    reader.onerror = () => resetAll();
    reader.readAsDataURL(file);
  }

  function resetAll() {
    sourceImage = null;
    processedBlob = null;
    imageDirty = false;
    editorSnapshot = null;
    els.previewImg.removeAttribute('src');
    zone.classList.remove('has-preview', 'has-file');
    zone.style.removeProperty('--preview-aspect');
    els.nameEl.textContent = '';
    if (els.metaEl) els.metaEl.textContent = '';
    els.actionsEl.hidden = true;
    closeModal(false);
  }

  function setFileOnInput(blob) {
    syncOutputFilenameExtension();
    const file = new File([blob], outputFilename, { type: exportMimeType() });
    const dt = new DataTransfer();
    dt.items.add(file);
    els.input.files = dt.files;
  }

  function restoreSnapshot() {
    if (!editorSnapshot) return;
    Object.assign(state, editorSnapshot);
    syncControls();
    clampOffsets();
    scheduleStageRender();
  }

  function isModalOpen() {
    return els.editorPanel?.classList.contains('is-open');
  }

  function openModal() {
    if (!els.editorPanel) return;
    editorSnapshot = cloneState();
    cachedStageW = 0;
    cachedStageH = 0;
    els.editorPanel.hidden = false;
    els.editorPanel.setAttribute('aria-hidden', 'false');
    els.editorPanel.classList.add('is-open');
    document.body.classList.add('admin-image-modal-open');
    requestAnimationFrame(() => {
      syncStageSize();
      syncBackgroundControls();
      renderStageNow();
    });
  }

  function closeModal(revert = true) {
    if (!els.editorPanel) return;
    if (revert) restoreSnapshot();
    els.editorPanel.classList.remove('is-open');
    els.editorPanel.hidden = true;
    els.editorPanel.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('admin-image-modal-open');
    dragging = false;
  }

  function getCsrfToken() {
    return els.form.querySelector('[name="_csrf"]')?.value || '';
  }

  function loadImageFromDataUrl(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        sourceImage = img;
        resolve(img);
      };
      img.onerror = () => reject(new Error('No se pudo cargar la imagen procesada.'));
      img.src = dataUrl;
    });
  }

  async function postImageToApi(url, filename, mimeType = 'image/png', blobFactory = exportApiBlob) {
    const blob = await blobFactory(mimeType);
    if (!blob) {
      throw new Error('No se pudo preparar la imagen para enviar.');
    }

    const formData = new FormData();
    formData.append('imagen', blob, filename);
    formData.append('_csrf', getCsrfToken());

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: { 'X-CSRF-Token': getCsrfToken() },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Error al procesar la imagen.');
    }
    return data;
  }

  let aiCooldownUntil = 0;
  let aiCooldownTimer = 0;

  function isRateLimitMessage(message) {
    return /429|rate limit|demasiadas|limitó las solicitudes/i.test(message || '');
  }

  function startAiCooldown(btn, label, seconds) {
    aiCooldownUntil = Date.now() + seconds * 1000;
    btn.disabled = true;

    const tick = () => {
      const left = Math.ceil((aiCooldownUntil - Date.now()) / 1000);
      if (left <= 0) {
        aiCooldownTimer = 0;
        btn.disabled = false;
        btn.textContent = label;
        return;
      }
      btn.textContent = `Espera ${left}s…`;
      aiCooldownTimer = window.setTimeout(tick, 1000);
    };

    if (aiCooldownTimer) window.clearTimeout(aiCooldownTimer);
    tick();
  }
  function assertModelPayload(data) {
    if (!data || typeof data.image !== 'string' || !data.image.startsWith('data:image/')) {
      throw new Error('El servidor no devolvió una imagen válida del modelo.');
    }
  }

  async function applyModelResult(data, { metaLabel, metaExtra } = {}) {
    assertModelPayload(data);

    const img = await loadImageFromDataUrl(data.image);

    if (data.width && data.height && (img.width !== data.width || img.height !== data.height)) {
      throw new Error('La imagen del modelo no se cargó correctamente. Intenta de nuevo.');
    }

    sourceImage = img;
    cachedStageW = 0;
    cachedStageH = 0;
    resetCrop(true);

    if (img.width === OUTPUT_W && img.height === OUTPUT_H) {
      state.fitMode = 'contain';
      state.baseScale = 1;
      state.zoomFactor = 1;
      state.offsetX = 0;
      state.offsetY = 0;
      syncControls();
    }

    renderOutput();
    processedBlob = await exportBlob();
    if (!processedBlob) {
      throw new Error('No se pudo preparar la imagen procesada.');
    }

    imageDirty = true;
    els.previewImg.src = data.image;
    zone.classList.add('has-preview', 'has-file');
    zone.style.setProperty('--preview-aspect', `${OUTPUT_W} / ${OUTPUT_H}`);
    els.actionsEl.hidden = false;
    els.nameEl.textContent = metaLabel || 'Imagen procesada';

    if (els.metaEl) {
      const extra = metaExtra ? ` · ${metaExtra}` : '';
      els.metaEl.textContent = `${metaLabel || 'Imagen procesada'}${extra} · ${img.width}×${img.height} px`;
    }

    editorSnapshot = cloneState();
    els.stage?.classList.add('is-ai-flash');
    window.setTimeout(() => els.stage?.classList.remove('is-ai-flash'), 900);
    scheduleStageRender();
  }

  async function removeBackgroundWithApi() {
    if (!sourceImage || !els.removeBgBtn) return;

    const btn = els.removeBgBtn;
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Quitando fondo…';

    try {
      const data = await postImageToApi(
        '/admin/productos/borrar-fondo',
        outputFilename.replace(/\.webp$/i, '.png'),
        'image/png',
      );
      await applyModelResult(data, { metaLabel: 'Fondo eliminado' });
    } catch (err) {
      window.alert(err.message || 'Error al quitar el fondo.');
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
  }

  async function enhanceWithAi() {
    if (!sourceImage || !els.aiBtn) return;

    const btn = els.aiBtn;
    const label = btn.textContent;

    if (Date.now() < aiCooldownUntil) {
      const left = Math.ceil((aiCooldownUntil - Date.now()) / 1000);
      window.alert(`Espera ${left} segundos antes de usar la IA de nuevo.`);
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Mejorando imagen…';

    try {
      const data = await postImageToApi(
        '/admin/productos/mejorar-ia',
        outputFilename.replace(/\.webp$/i, '.png'),
        'image/png',
      );
      const upscaleInfo = data.upscaledWidth && data.upscaledHeight
        ? `ampliada a ${data.upscaledWidth}×${data.upscaledHeight}`
        : 'nitidez mejorada';
      await applyModelResult(data, {
        metaLabel: 'Imagen mejorada con IA',
        metaExtra: upscaleInfo,
      });
      startAiCooldown(btn, label, 15);
    } catch (err) {
      const message = err.message || 'Error al mejorar la imagen con IA.';
      if (isRateLimitMessage(message)) {
        startAiCooldown(btn, label, 45);
      } else {
        btn.disabled = false;
        btn.textContent = label;
      }
      window.alert(message);
    }
  }

  els.input.addEventListener('change', () => {
    const file = els.input.files?.[0];
    if (!file || !isImageFile(file)) {
      resetAll();
      return;
    }
    loadFile(file);
  });

  els.editBtn?.addEventListener('click', () => {
    if (!sourceImage) return;
    openModal();
  });

  els.cancelBtn?.addEventListener('click', () => closeModal(true));
  els.modalCloseBtn?.addEventListener('click', () => closeModal(true));
  els.modalOverlay?.addEventListener('click', () => closeModal(true));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isModalOpen()) closeModal(true);
  });

  els.resetBtn?.addEventListener('click', async () => {
    resetCrop(true);
    scheduleStageRender();
    await applyOptimization();
  });

  els.removeBgBtn?.addEventListener('click', () => {
    removeBackgroundWithApi();
  });

  els.aiBtn?.addEventListener('click', () => {
    enhanceWithAi();
  });

  els.applyBtn?.addEventListener('click', async () => {
    await applyOptimization();
    editorSnapshot = cloneState();
    closeModal(false);
  });

  els.zoomInput?.addEventListener('input', () => {
    state.zoomFactor = Number(els.zoomInput.value) / 100;
    syncZoomControl();
    clampOffsets();
    scheduleStageRender();
  });

  els.rotationInput?.addEventListener('input', () => {
    state.rotation = Number(els.rotationInput.value);
    if (els.rotationValue) els.rotationValue.textContent = `${state.rotation}°`;
    updateBaseScalePreservingView();
    scheduleStageRender();
  });

  els.brightnessInput?.addEventListener('input', () => {
    state.brightness = Number(els.brightnessInput.value);
    if (els.brightnessValue) els.brightnessValue.textContent = String(state.brightness);
    scheduleStageRender();
  });

  els.contrastInput?.addEventListener('input', () => {
    state.contrast = Number(els.contrastInput.value);
    if (els.contrastValue) els.contrastValue.textContent = String(state.contrast);
    scheduleStageRender();
  });

  els.saturationInput?.addEventListener('input', () => {
    state.saturation = Number(els.saturationInput.value);
    if (els.saturationValue) els.saturationValue.textContent = String(state.saturation);
    scheduleStageRender();
  });

  els.rotateLeftBtn?.addEventListener('click', () => {
    state.rotation = ((state.rotation - 90 + 180) % 360) - 180;
    if (els.rotationInput) els.rotationInput.value = String(state.rotation);
    if (els.rotationValue) els.rotationValue.textContent = `${state.rotation}°`;
    updateBaseScalePreservingView();
    scheduleStageRender();
  });

  els.rotateRightBtn?.addEventListener('click', () => {
    state.rotation = ((state.rotation + 90 + 180) % 360) - 180;
    if (els.rotationInput) els.rotationInput.value = String(state.rotation);
    if (els.rotationValue) els.rotationValue.textContent = `${state.rotation}°`;
    updateBaseScalePreservingView();
    scheduleStageRender();
  });

  els.flipHBtn?.addEventListener('click', () => {
    state.flipH = !state.flipH;
    syncControls();
    scheduleStageRender();
  });

  els.flipVBtn?.addEventListener('click', () => {
    state.flipV = !state.flipV;
    syncControls();
    scheduleStageRender();
  });

  els.fitBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (state.fitMode === btn.dataset.fit) return;
      state.fitMode = btn.dataset.fit;
      setActiveFit(state.fitMode);
      updateBaseScalePreservingView();
      scheduleStageRender();
    });
  });

  els.bgBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.bg;
      if (state.background === mode) return;
      state.background = mode;
      setActiveBackground(mode);
      syncBackgroundControls();
      scheduleStageRender();
    });
  });

  els.bgColorInput?.addEventListener('input', () => {
    state.customBackground = els.bgColorInput.value;
    if (state.background !== 'custom') {
      state.background = 'custom';
      setActiveBackground('custom');
      syncBackgroundControls();
    }
    scheduleStageRender();
  });

  els.posBtns.forEach((btn) => {
    btn.addEventListener('click', () => applyPosition(btn.dataset.pos));
  });

  els.stage.addEventListener('pointerdown', (e) => {
    if (!isModalOpen()) return;
    e.preventDefault();
    els.stage.setPointerCapture(e.pointerId);
    dragging = true;
    dragStart = { x: e.clientX, y: e.clientY, ox: state.offsetX, oy: state.offsetY };
  });

  els.stage.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rect = els.stage.getBoundingClientRect();
    const scaleX = OUTPUT_W / rect.width;
    const scaleY = OUTPUT_H / rect.height;
    state.offsetX = dragStart.ox + (e.clientX - dragStart.x) * scaleX;
    state.offsetY = dragStart.oy + (e.clientY - dragStart.y) * scaleY;
    clampOffsets();
    scheduleStageRender();
  });

  els.stage.addEventListener('pointerup', () => { dragging = false; });
  els.stage.addEventListener('pointercancel', () => { dragging = false; });

  window.addEventListener('resize', () => {
    if (!isModalOpen()) return;
    cachedStageW = 0;
    cachedStageH = 0;
    scheduleStageRender();
  });

  if (typeof ResizeObserver !== 'undefined') {
    const stageObserver = new ResizeObserver(() => {
      if (!isModalOpen()) return;
      if (syncStageSize()) scheduleStageRender();
    });
    stageObserver.observe(els.stage);
  }

  els.form.addEventListener('submit', () => {
    if (!processedBlob || !imageDirty) return;
    setFileOnInput(processedBlob);
  });

  initExistingImage();
})();
