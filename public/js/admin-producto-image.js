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
  /** Degradados lineales para export 1200×800 (angle en grados, stops 0–1). */
  const BG_GRADIENTS = {
    'grad-gold': {
      angle: 135,
      stops: [[0, '#fffbf3'], [0.5, '#f3ead8'], [1, '#d4a853']],
    },
    'grad-violet': {
      angle: 135,
      stops: [[0, '#f5f3ee'], [0.45, '#ebe6f5'], [1, '#c4b5e8']],
    },
    'grad-rose': {
      angle: 120,
      stops: [[0, '#fff5f5'], [0.55, '#f8ecec'], [1, '#e8c4c4']],
    },
    'grad-neutral': {
      angle: 160,
      stops: [[0, '#f4f4f6'], [0.5, '#dfe0e8'], [1, '#c8c9d4']],
    },
    'grad-dark': {
      angle: 145,
      stops: [[0, '#2a2a32'], [0.5, '#141418'], [1, '#08080a']],
    },
  };
  const ASPECT = OUTPUT_W / OUTPUT_H;
  const WEBP_QUALITY = 0.85;
  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 3;
  const MIN_SOURCE_W = 900;
  const MIN_SOURCE_H = 600;

  const STYLE_PRESETS = {
    'minimal-white': {
      background: 'white', brightness: 2, contrast: 4, padding: 24, dropShadow: 0, vignette: 0, fitMode: 'contain',
    },
    'gold-oasis': {
      background: 'grad-gold', brightness: 4, contrast: 6, saturation: 8, padding: 32, dropShadow: 35, vignette: 12, fitMode: 'contain',
    },
    'dark-premium': {
      background: 'grad-dark', brightness: 6, contrast: 10, saturation: -5, padding: 40, dropShadow: 55, vignette: 28, fitMode: 'contain',
    },
    'soft-float': {
      background: 'cream', brightness: 3, padding: 48, dropShadow: 45, bgBlur: 12, fitMode: 'contain',
    },
  };

  function defaultEditorState() {
    return {
      rotation: 0,
      straighten: 0,
      flipH: false,
      flipV: false,
      brightness: 0,
      contrast: 0,
      saturation: 0,
      exposure: 0,
      highlights: 0,
      shadows: 0,
      temperature: 0,
      vibrance: 0,
      sharpen: 0,
      fitMode: 'cover',
      baseScale: 1,
      zoomFactor: 1,
      offsetX: 0,
      offsetY: 0,
      background: 'white',
      customBackground: '#ffffff',
      customGradFrom: '#f5f3ee',
      customGradTo: '#d4a853',
      customGradAngle: 135,
      customBgImage: null,
      cropTop: 0,
      cropBottom: 0,
      cropLeft: 0,
      cropRight: 0,
      showGuides: false,
      guideType: 'thirds',
      guideColor: 'white',
      dropShadow: 0,
      padding: 0,
      borderWidth: 0,
      borderColor: '#ffffff',
      vignette: 0,
      bgBlur: 0,
      maskShape: 'rect',
    };
  }

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
    posBtns: document.querySelectorAll('[data-pos]'),
    bgBtns: document.querySelectorAll('[data-bg]'),
    bgCustomRow: document.getElementById('producto-image-bg-custom'),
    bgCustomGradRow: document.getElementById('producto-image-bg-custom-grad'),
    bgColorInput: document.getElementById('producto-image-bg-color'),
    bgGradFromInput: document.getElementById('producto-image-bg-grad-from'),
    bgGradToInput: document.getElementById('producto-image-bg-grad-to'),
    bgGradAngleInput: document.getElementById('producto-image-bg-grad-angle'),
    bgGradAngleValue: document.getElementById('producto-image-bg-grad-angle-value'),
    bgCustomChip: document.getElementById('producto-image-bg-custom-chip'),
    bgCustomGradChip: document.getElementById('producto-image-bg-custom-grad-chip'),
    panelTabBtns: document.querySelectorAll('[data-image-panel].admin-image-panel-tab'),
    imagePanels: document.querySelectorAll('.admin-image-panel'),
    qualityWarn: document.getElementById('producto-image-quality-warn'),
    autoFitBtn: document.getElementById('producto-image-auto-fit'),
    guidesInput: document.getElementById('producto-image-guides'),
    guideTypeSelect: document.getElementById('producto-image-guide-type'),
    guideColorSelect: document.getElementById('producto-image-guide-color'),
    cropTopInput: document.getElementById('producto-image-crop-top'),
    cropBottomInput: document.getElementById('producto-image-crop-bottom'),
    cropLeftInput: document.getElementById('producto-image-crop-left'),
    cropRightInput: document.getElementById('producto-image-crop-right'),
    straightenInput: document.getElementById('producto-image-straighten'),
    straightenValue: document.getElementById('producto-image-straighten-value'),
    exposureInput: document.getElementById('producto-image-exposure'),
    exposureValue: document.getElementById('producto-image-exposure-value'),
    highlightsInput: document.getElementById('producto-image-highlights'),
    highlightsValue: document.getElementById('producto-image-highlights-value'),
    shadowsInput: document.getElementById('producto-image-shadows'),
    shadowsValue: document.getElementById('producto-image-shadows-value'),
    temperatureInput: document.getElementById('producto-image-temperature'),
    temperatureValue: document.getElementById('producto-image-temperature-value'),
    vibranceInput: document.getElementById('producto-image-vibrance'),
    vibranceValue: document.getElementById('producto-image-vibrance-value'),
    sharpenInput: document.getElementById('producto-image-sharpen'),
    sharpenValue: document.getElementById('producto-image-sharpen-value'),
    dropShadowInput: document.getElementById('producto-image-drop-shadow'),
    dropShadowValue: document.getElementById('producto-image-drop-shadow-value'),
    paddingInput: document.getElementById('producto-image-padding'),
    paddingValue: document.getElementById('producto-image-padding-value'),
    borderWidthInput: document.getElementById('producto-image-border-width'),
    borderWidthValue: document.getElementById('producto-image-border-width-value'),
    borderColorInput: document.getElementById('producto-image-border-color'),
    vignetteInput: document.getElementById('producto-image-vignette'),
    vignetteValue: document.getElementById('producto-image-vignette-value'),
    bgBlurInput: document.getElementById('producto-image-bg-blur'),
    bgBlurValue: document.getElementById('producto-image-bg-blur-value'),
    maskShapeSelect: document.getElementById('producto-image-mask-shape'),
    reduceGlareBtn: document.getElementById('producto-image-reduce-glare'),
    stylePresetBtns: document.querySelectorAll('[data-style-preset]'),
    aiUpscaleBtn: document.getElementById('producto-image-ai-upscale-btn'),
    aiSharpenBtn: document.getElementById('producto-image-ai-sharpen-btn'),
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
  let customBgImageEl = null;

  const state = defaultEditorState();

  function isImageFile(file) {
    if (file.type && file.type.startsWith('image/')) return true;
    return /\.(jpe?g|png|webp)$/i.test(file.name || '');
  }

  function cloneState() {
    return { ...state };
  }

  function updateQualityWarn() {
    if (!els.qualityWarn || !sourceImage) return;
    const { sw, sh } = sourceCropRect();
    const low = sw < MIN_SOURCE_W || sh < MIN_SOURCE_H;
    if (!low) {
      els.qualityWarn.hidden = true;
      els.qualityWarn.textContent = '';
      return;
    }
    els.qualityWarn.hidden = false;
    els.qualityWarn.textContent = `Resolución baja (${Math.round(sw)}×${Math.round(sh)} px). Para 1200×800 conviene una foto más grande o «Ampliar IA».`;
  }

  function autoFitToFrame() {
    state.fitMode = 'cover';
    applyFitModeChange();
    scheduleStageRender();
  }

  function applyStylePreset(key) {
    const preset = STYLE_PRESETS[key];
    if (!preset) return;
    Object.assign(state, preset);
    applyFitModeChange();
    syncControls();
    scheduleStageRender();
  }

  function reduceGlarePreset() {
    state.highlights = Math.min(40, state.highlights - 18);
    state.contrast = Math.max(-40, state.contrast - 8);
    state.exposure = Math.max(-40, state.exposure - 6);
    syncControls();
    scheduleStageRender();
  }

  function bindSliderPair(input, valueEl, key, format) {
    if (!input) return;
    input.addEventListener('input', () => {
      state[key] = Number(input.value);
      if (valueEl) valueEl.textContent = format ? format(state[key]) : String(state[key]);
      if (key.startsWith('crop')) updateQualityWarn();
      if (['cropTop', 'cropBottom', 'cropLeft', 'cropRight', 'straighten'].includes(key)) {
        updateBaseScalePreservingView();
      }
      scheduleStageRender();
    });
  }

  function filterCss() {
    const b = 100 + state.brightness + state.exposure + state.shadows * 0.35;
    const c = 100 + state.contrast + state.highlights * 0.25 - state.shadows * 0.1;
    const s = 100 + state.saturation + state.vibrance * 0.85;
    const temp = state.temperature;
    const hue = temp * 0.35;
    const sepia = Math.min(40, Math.abs(temp) * 0.45);
    const parts = [
      `brightness(${b}%)`,
      `contrast(${c}%)`,
      `saturate(${s}%)`,
    ];
    if (temp !== 0) {
      parts.push(`hue-rotate(${hue}deg)`);
      if (temp > 0) parts.push(`sepia(${sepia}%)`);
    }
    if (state.sharpen > 0) {
      parts.push(`contrast(${100 + state.sharpen * 0.15}%)`);
    }
    return parts.join(' ');
  }

  function sourceCropRect() {
    if (!sourceImage) return { sx: 0, sy: 0, sw: 1, sh: 1 };
    const w = sourceImage.width;
    const h = sourceImage.height;
    const sx = (w * state.cropLeft) / 100;
    const sy = (h * state.cropTop) / 100;
    const sw = Math.max(1, w - (w * (state.cropLeft + state.cropRight)) / 100);
    const sh = Math.max(1, h - (h * (state.cropTop + state.cropBottom)) / 100);
    return { sx, sy, sw, sh };
  }

  function effectiveDimensions() {
    if (!sourceImage) return { w: 1, h: 1 };
    const { sw, sh } = sourceCropRect();
    const rad = ((state.rotation + state.straighten) * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));
    return {
      w: sw * cos + sh * sin,
      h: sw * sin + sh * cos,
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

  function applyFitModeChange() {
    const { w, h } = effectiveDimensions();
    state.baseScale = computeBaseScale(w, h);
    state.zoomFactor = 1;
    state.offsetX = 0;
    state.offsetY = 0;
    setActivePos('center');
    syncZoomControl();
    clampOffsets();
  }

  function updateBaseScalePreservingView() {
    const previousTotal = totalScale();
    const { w, h } = effectiveDimensions();
    state.baseScale = computeBaseScale(w, h);
    state.zoomFactor = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, previousTotal / state.baseScale));
    clampOffsets();
    syncZoomControl();
  }

  function createLinearGradient(ctx, outW, outH, { angle, stops }) {
    const rad = ((angle - 90) * Math.PI) / 180;
    const cx = outW / 2;
    const cy = outH / 2;
    const len = Math.hypot(outW, outH) / 2;
    const x0 = cx + Math.cos(rad) * len;
    const y0 = cy + Math.sin(rad) * len;
    const x1 = cx - Math.cos(rad) * len;
    const y1 = cy - Math.sin(rad) * len;
    const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(([pos, color]) => gradient.addColorStop(pos, color));
    return gradient;
  }

  function customGradCss() {
    const from = state.customGradFrom || '#f5f3ee';
    const to = state.customGradTo || '#d4a853';
    const angle = state.customGradAngle ?? 135;
    return `linear-gradient(${angle}deg, ${from} 0%, ${to} 100%)`;
  }

  function resolveBackgroundFill(ctx, outW, outH) {
    if (state.background === 'none') return null;
    if (state.background === 'custom') return state.customBackground || '#ffffff';
    if (state.background === 'custom-grad') {
      return createLinearGradient(ctx, outW, outH, {
        angle: state.customGradAngle,
        stops: [[0, state.customGradFrom || '#f5f3ee'], [1, state.customGradTo || '#d4a853']],
      });
    }
    const gradPreset = BG_GRADIENTS[state.background];
    if (gradPreset) return createLinearGradient(ctx, outW, outH, gradPreset);
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

  function applyClipShape(ctx, outW, outH, pad) {
    const x = pad;
    const y = pad;
    const w = outW - pad * 2;
    const h = outH - pad * 2;
    ctx.beginPath();
    if (state.maskShape === 'circle') {
      const r = Math.min(w, h) / 2;
      ctx.arc(x + w / 2, y + h / 2, r, 0, Math.PI * 2);
    } else if (state.maskShape === 'oval') {
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    } else {
      ctx.rect(x, y, w, h);
    }
    ctx.clip();
  }

  function drawBackgroundLayer(ctx, outW, outH) {
    if (state.customBgImage && customBgImageEl) {
      ctx.drawImage(customBgImageEl, 0, 0, outW, outH);
      return;
    }
    const fill = resolveBackgroundFill(ctx, outW, outH);
    if (fill === null) {
      ctx.clearRect(0, 0, outW, outH);
    } else {
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, outW, outH);
    }
  }

  function drawProductToContext(ctx, outW, outH, { blurPx = 0, forShadow = false } = {}) {
    if (!sourceImage) return;
    const pad = state.padding;
    const { sx, sy, sw, sh } = sourceCropRect();
    const rad = ((state.rotation + state.straighten) * Math.PI) / 180;
    const scale = totalScale();

    ctx.save();
    ctx.beginPath();
    ctx.rect(pad, pad, outW - pad * 2, outH - pad * 2);
    ctx.clip();

    const cx = outW / 2 + state.offsetX;
    const cy = outH / 2 + state.offsetY;

    if (state.dropShadow > 0 && !forShadow && blurPx === 0) {
      ctx.save();
      ctx.translate(cx, cy + 8 + state.dropShadow * 0.25);
      ctx.scale(state.flipH ? -scale : scale, state.flipV ? -scale : scale);
      ctx.filter = `blur(${Math.max(4, state.dropShadow * 0.2)}px) opacity(${Math.min(0.55, state.dropShadow / 120)})`;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(0, 0, sw * 0.35, sh * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.translate(cx, cy);
    ctx.rotate(rad);
    ctx.scale(state.flipH ? -scale : scale, state.flipV ? -scale : scale);

    const filterParts = [filterCss()];
    if (blurPx > 0) filterParts.unshift(`blur(${blurPx}px)`);
    ctx.filter = filterParts.join(' ');

    ctx.drawImage(sourceImage, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);

    ctx.restore();
  }

  function drawVignette(ctx, outW, outH) {
    if (state.vignette <= 0) return;
    const strength = state.vignette / 100;
    const grad = ctx.createRadialGradient(
      outW / 2, outH / 2, Math.min(outW, outH) * 0.25,
      outW / 2, outH / 2, Math.max(outW, outH) * 0.72,
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(0,0,0,${0.65 * strength})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, outW, outH);
  }

  function drawBorder(ctx, outW, outH) {
    if (state.borderWidth <= 0) return;
    ctx.save();
    ctx.strokeStyle = state.borderColor || '#ffffff';
    ctx.lineWidth = state.borderWidth;
    ctx.strokeRect(state.borderWidth / 2, state.borderWidth / 2, outW - state.borderWidth, outH - state.borderWidth);
    ctx.restore();
  }

  function drawFrame(ctx, outW, outH) {
    ctx.save();
    if (state.maskShape !== 'rect') {
      applyClipShape(ctx, outW, outH, 0);
    }

    drawBackgroundLayer(ctx, outW, outH);

    if (state.bgBlur > 0 && sourceImage) {
      ctx.save();
      applyClipShape(ctx, outW, outH, state.padding);
      drawProductToContext(ctx, outW, outH, { blurPx: state.bgBlur * 0.35 });
      ctx.restore();
    }

    ctx.save();
    if (state.maskShape !== 'rect') {
      applyClipShape(ctx, outW, outH, state.padding);
    } else if (state.padding > 0) {
      ctx.beginPath();
      ctx.rect(state.padding, state.padding, outW - state.padding * 2, outH - state.padding * 2);
      ctx.clip();
    }

    drawProductToContext(ctx, outW, outH);
    ctx.restore();

    drawVignette(ctx, outW, outH);
    drawBorder(ctx, outW, outH);
    ctx.restore();
  }

  function drawGuides(ctx, stageW, stageH) {
    if (!state.showGuides) return;
    ctx.save();
    ctx.strokeStyle = state.guideColor === 'black'
      ? 'rgba(0, 0, 0, 0.45)'
      : 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1;
    if (state.guideType === 'center') {
      ctx.beginPath();
      ctx.moveTo(stageW / 2, 0);
      ctx.lineTo(stageW / 2, stageH);
      ctx.moveTo(0, stageH / 2);
      ctx.lineTo(stageW, stageH / 2);
      ctx.stroke();
    } else {
      for (let i = 1; i <= 2; i += 1) {
        const x = (stageW * i) / 3;
        const y = (stageH * i) / 3;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, stageH);
        ctx.moveTo(0, y);
        ctx.lineTo(stageW, y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function resetCrop(resetTransform = true) {
    if (!sourceImage) return;

    if (resetTransform) {
      Object.assign(state, defaultEditorState());
      customBgImageEl = null;
      syncControls();
    }

    const { w, h } = effectiveDimensions();
    state.baseScale = computeBaseScale(w, h);
    state.zoomFactor = 1;
    state.offsetX = 0;
    state.offsetY = 0;
    setActivePos('center');
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

    drawGuides(ctx, stageW, stageH);

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
    return new Promise((resolve, reject) => {
      renderOutput();
      const quality = mimeType === 'image/jpeg' ? 0.92 : undefined;
      outputCanvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error(
            'No se pudo exportar la imagen desde el editor. Recarga la página o vuelve a seleccionar el archivo.',
          ));
          return;
        }
        resolve(blob);
      }, mimeType, quality);
    });
  }

  function apiExportFilename() {
    const base = (outputFilename || 'producto').replace(/\.(webp|png|jpe?g)$/i, '');
    return `${base}.png`;
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

  function loadImageFromBlob(blob) {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('No se pudo decodificar la imagen del producto.'));
      };
      img.src = objectUrl;
    });
  }

  async function loadImageFromUrl(url) {
    const resolved = new URL(url, window.location.href).href;

    try {
      const res = await fetch(resolved, { credentials: 'same-origin' });
      if (res.ok) {
        const blob = await res.blob();
        if (blob.size > 0 && (blob.type.startsWith('image/') || blob.type === '')) {
          const img = await loadImageFromBlob(blob);
          sourceImage = img;
          return img;
        }
      }
    } catch {
      /* fallback abajo */
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        sourceImage = img;
        resolve(img);
      };
      img.onerror = () => reject(new Error('No se pudo cargar la imagen del producto.'));
      img.src = resolved;
    });
  }

  async function showExistingImagePreview(url) {
    outputFilename = filenameFromCodigo() || filenameFromUrl(url);
    await loadImageFromUrl(url);
    resetCrop(true);
    updateQualityWarn();
    renderOutput();
    els.previewImg.src = outputCanvas.toDataURL('image/webp', WEBP_QUALITY);
    zone.classList.add('has-preview', 'has-file');
    zone.style.setProperty('--preview-aspect', `${OUTPUT_W} / ${OUTPUT_H}`);
    els.nameEl.textContent = 'Imagen actual del producto';
    els.actionsEl.hidden = false;
    if (els.metaEl) els.metaEl.textContent = `${OUTPUT_W}×${OUTPUT_H} px · sin cambios aún`;
  }

  async function initExistingImage() {
    const url = zone.dataset.editorImageUrl || zone.dataset.existingImage;
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
    const set = (input, val) => { if (input) input.value = String(val); };
    const setText = (el, text) => { if (el) el.textContent = text; };

    set(els.rotationInput, state.rotation);
    setText(els.rotationValue, `${state.rotation}°`);
    set(els.straightenInput, state.straighten);
    setText(els.straightenValue, `${state.straighten}°`);
    set(els.brightnessInput, state.brightness);
    setText(els.brightnessValue, String(state.brightness));
    set(els.contrastInput, state.contrast);
    setText(els.contrastValue, String(state.contrast));
    set(els.saturationInput, state.saturation);
    setText(els.saturationValue, String(state.saturation));
    set(els.exposureInput, state.exposure);
    setText(els.exposureValue, String(state.exposure));
    set(els.highlightsInput, state.highlights);
    setText(els.highlightsValue, String(state.highlights));
    set(els.shadowsInput, state.shadows);
    setText(els.shadowsValue, String(state.shadows));
    set(els.temperatureInput, state.temperature);
    setText(els.temperatureValue, String(state.temperature));
    set(els.vibranceInput, state.vibrance);
    setText(els.vibranceValue, String(state.vibrance));
    set(els.sharpenInput, state.sharpen);
    setText(els.sharpenValue, String(state.sharpen));
    set(els.dropShadowInput, state.dropShadow);
    setText(els.dropShadowValue, String(state.dropShadow));
    set(els.paddingInput, state.padding);
    setText(els.paddingValue, String(state.padding));
    set(els.borderWidthInput, state.borderWidth);
    setText(els.borderWidthValue, String(state.borderWidth));
    if (els.borderColorInput) els.borderColorInput.value = state.borderColor;
    set(els.vignetteInput, state.vignette);
    setText(els.vignetteValue, String(state.vignette));
    set(els.bgBlurInput, state.bgBlur);
    setText(els.bgBlurValue, String(state.bgBlur));
    set(els.cropTopInput, state.cropTop);
    setText(document.getElementById('producto-image-crop-top-value'), `${state.cropTop}%`);
    set(els.cropBottomInput, state.cropBottom);
    setText(document.getElementById('producto-image-crop-bottom-value'), `${state.cropBottom}%`);
    set(els.cropLeftInput, state.cropLeft);
    setText(document.getElementById('producto-image-crop-left-value'), `${state.cropLeft}%`);
    set(els.cropRightInput, state.cropRight);
    setText(document.getElementById('producto-image-crop-right-value'), `${state.cropRight}%`);
    if (els.guidesInput) els.guidesInput.checked = state.showGuides;
    if (els.guideTypeSelect) els.guideTypeSelect.value = state.guideType;
    if (els.guideColorSelect) els.guideColorSelect.value = state.guideColor;
    if (els.maskShapeSelect) els.maskShapeSelect.value = state.maskShape;
    if (els.flipHBtn) {
      els.flipHBtn.classList.toggle('is-active', state.flipH);
      els.flipHBtn.setAttribute('aria-pressed', String(state.flipH));
    }
    if (els.flipVBtn) {
      els.flipVBtn.classList.toggle('is-active', state.flipV);
      els.flipVBtn.setAttribute('aria-pressed', String(state.flipV));
    }
    setActiveBackground(state.background);
    syncBackgroundControls();
    updateQualityWarn();
  }

  function setActiveBackground(mode) {
    els.bgBtns.forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.bg === mode);
    });
  }

  function syncBackgroundControls() {
    const isCustomColor = state.background === 'custom';
    const isCustomGrad = state.background === 'custom-grad';
    if (els.bgCustomRow) els.bgCustomRow.hidden = !isCustomColor;
    if (els.bgCustomGradRow) els.bgCustomGradRow.hidden = !isCustomGrad;
    if (els.bgColorInput) els.bgColorInput.value = state.customBackground || '#ffffff';
    if (els.bgGradFromInput) els.bgGradFromInput.value = state.customGradFrom || '#f5f3ee';
    if (els.bgGradToInput) els.bgGradToInput.value = state.customGradTo || '#d4a853';
    if (els.bgGradAngleInput) els.bgGradAngleInput.value = String(state.customGradAngle ?? 135);
    if (els.bgGradAngleValue) els.bgGradAngleValue.textContent = `${state.customGradAngle ?? 135}°`;
    if (els.bgCustomChip) {
      els.bgCustomChip.style.backgroundColor = state.customBackground || '#ffffff';
      els.bgCustomChip.style.backgroundImage = 'none';
    }
    if (els.bgCustomGradChip) {
      els.bgCustomGradChip.style.backgroundColor = '';
      els.bgCustomGradChip.style.backgroundImage = customGradCss();
    }
    els.stage?.classList.toggle('is-transparent-bg', state.background === 'none');
  }

  function applyCustomGradFromControls() {
    if (els.bgGradFromInput) state.customGradFrom = els.bgGradFromInput.value;
    if (els.bgGradToInput) state.customGradTo = els.bgGradToInput.value;
    if (els.bgGradAngleInput) {
      state.customGradAngle = Number(els.bgGradAngleInput.value);
      if (els.bgGradAngleValue) els.bgGradAngleValue.textContent = `${state.customGradAngle}°`;
    }
    if (state.background !== 'custom-grad') {
      state.background = 'custom-grad';
      setActiveBackground('custom-grad');
    }
    syncBackgroundControls();
    scheduleStageRender();
  }

  function setImagePanel(name) {
    els.panelTabBtns.forEach((btn) => {
      const active = btn.dataset.imagePanel === name;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', String(active));
    });
    els.imagePanels.forEach((panel) => {
      const active = panel.dataset.imagePanel === name;
      panel.classList.toggle('is-active', active);
      if (active) panel.removeAttribute('hidden');
      else panel.setAttribute('hidden', '');
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
        updateQualityWarn();
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
    setImagePanel('crop');
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

  async function postImageToApi(url, filename, mimeType = 'image/png', blobFactory = exportApiBlob, query = {}) {
    const qs = new URLSearchParams(query).toString();
    const fullUrl = qs ? `${url}?${qs}` : url;
    const blob = await blobFactory(mimeType);

    const formData = new FormData();
    formData.append('imagen', blob, filename);
    formData.append('_csrf', getCsrfToken());

    const response = await fetch(fullUrl, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin',
      headers: {
        'X-CSRF-Token': getCsrfToken(),
        Accept: 'application/json',
      },
    });

    let data = {};
    const raw = await response.text();
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(
          response.ok
            ? 'Respuesta inválida del servidor.'
            : `Error del servidor (${response.status}). Recarga la página e intenta de nuevo.`,
        );
      }
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Error al procesar la imagen.');
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

  async function applyModelResult(data, { metaLabel, metaExtra, preferContainAfterCutout } = {}) {
    assertModelPayload(data);

    const img = await loadImageFromDataUrl(data.image);

    if (data.width && data.height && (img.width !== data.width || img.height !== data.height)) {
      throw new Error('La imagen del modelo no se cargó correctamente. Intenta de nuevo.');
    }

    sourceImage = img;
    cachedStageW = 0;
    cachedStageH = 0;
    resetCrop(true);

    if (preferContainAfterCutout) {
      state.fitMode = 'contain';
      state.background = 'white';
      const { w, h } = effectiveDimensions();
      state.baseScale = computeBaseScale(w, h);
      state.zoomFactor = 1;
      state.offsetX = 0;
      state.offsetY = 0;
      setActivePos('center');
      applyFitModeChange();
      syncBackgroundControls();
      setImagePanel('marco');
    } else if (img.width === OUTPUT_W && img.height === OUTPUT_H) {
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
    updatePreviewFromOutput();
    updateMeta(processedBlob);
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
        apiExportFilename(),
        'image/png',
      );
      await applyModelResult(data, { metaLabel: 'Fondo eliminado', preferContainAfterCutout: true });
    } catch (err) {
      window.alert(err.message || 'Error al quitar el fondo.');
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
  }

  async function enhanceWithAi(mode = 'full') {
    if (!sourceImage || !els.aiBtn) return;

    const btn = mode === 'upscale' ? els.aiUpscaleBtn : mode === 'sharpen' ? els.aiSharpenBtn : els.aiBtn;
    if (!btn) return;
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
        apiExportFilename(),
        'image/png',
        exportApiBlob,
        { mode },
      );
      const upscaleInfo = data.upscaledWidth && data.upscaledHeight
        ? `ampliada a ${data.upscaledWidth}×${data.upscaledHeight}`
        : 'nitidez mejorada';
      await applyModelResult(data, {
        metaLabel: mode === 'upscale' ? 'Ampliada con IA' : mode === 'sharpen' ? 'Nitidez IA' : 'Imagen mejorada con IA',
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
    enhanceWithAi('full');
  });

  els.aiUpscaleBtn?.addEventListener('click', () => enhanceWithAi('upscale'));
  els.aiSharpenBtn?.addEventListener('click', () => enhanceWithAi('sharpen'));

  els.autoFitBtn?.addEventListener('click', () => autoFitToFrame());
  els.reduceGlareBtn?.addEventListener('click', () => reduceGlarePreset());

  els.stylePresetBtns.forEach((btn) => {
    btn.addEventListener('click', () => applyStylePreset(btn.dataset.stylePreset));
  });

  els.guidesInput?.addEventListener('change', () => {
    state.showGuides = els.guidesInput.checked;
    scheduleStageRender();
  });
  els.guideTypeSelect?.addEventListener('change', () => {
    state.guideType = els.guideTypeSelect.value;
    scheduleStageRender();
  });
  els.guideColorSelect?.addEventListener('change', () => {
    state.guideColor = els.guideColorSelect.value;
    scheduleStageRender();
  });
  els.maskShapeSelect?.addEventListener('change', () => {
    state.maskShape = els.maskShapeSelect.value;
    scheduleStageRender();
  });
  els.borderColorInput?.addEventListener('input', () => {
    state.borderColor = els.borderColorInput.value;
    scheduleStageRender();
  });

  bindSliderPair(els.straightenInput, els.straightenValue, 'straighten', (v) => `${v}°`);
  bindSliderPair(els.exposureInput, els.exposureValue, 'exposure');
  bindSliderPair(els.highlightsInput, els.highlightsValue, 'highlights');
  bindSliderPair(els.shadowsInput, els.shadowsValue, 'shadows');
  bindSliderPair(els.temperatureInput, els.temperatureValue, 'temperature');
  bindSliderPair(els.vibranceInput, els.vibranceValue, 'vibrance');
  bindSliderPair(els.sharpenInput, els.sharpenValue, 'sharpen');
  bindSliderPair(els.dropShadowInput, els.dropShadowValue, 'dropShadow');
  bindSliderPair(els.paddingInput, els.paddingValue, 'padding');
  bindSliderPair(els.borderWidthInput, els.borderWidthValue, 'borderWidth');
  bindSliderPair(els.vignetteInput, els.vignetteValue, 'vignette');
  bindSliderPair(els.bgBlurInput, els.bgBlurValue, 'bgBlur');
  bindSliderPair(els.cropTopInput, document.getElementById('producto-image-crop-top-value'), 'cropTop', (v) => `${v}%`);
  bindSliderPair(els.cropBottomInput, document.getElementById('producto-image-crop-bottom-value'), 'cropBottom', (v) => `${v}%`);
  bindSliderPair(els.cropLeftInput, document.getElementById('producto-image-crop-left-value'), 'cropLeft', (v) => `${v}%`);
  bindSliderPair(els.cropRightInput, document.getElementById('producto-image-crop-right-value'), 'cropRight', (v) => `${v}%`);

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

  els.panelTabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const panel = btn.dataset.imagePanel;
      if (!panel) return;
      setImagePanel(panel);
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
    if (els.bgCustomChip) {
      els.bgCustomChip.style.backgroundColor = state.customBackground;
      els.bgCustomChip.style.backgroundImage = 'none';
    }
    scheduleStageRender();
  });

  els.bgGradFromInput?.addEventListener('input', applyCustomGradFromControls);
  els.bgGradToInput?.addEventListener('input', applyCustomGradFromControls);
  els.bgGradAngleInput?.addEventListener('input', applyCustomGradFromControls);

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
