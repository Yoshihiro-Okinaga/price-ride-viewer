import { CONFIG } from './config.js';
import { app } from './state.js';
import {
  ui,
  setStatus,
  setUiVisible,
  toggleUiVisible,
  applyRuntimeSettingsFromUI,
  syncStateFromUI,
  applyUiConfigToDom
} from './ui.js';
import {
  createSceneObjects,
  createGround,
  createBackground,
  animateBackground,
  updateCameraPosition,
  rebuildSceneTheme
} from './scene.js';
import {
  buildCourseFromUI,
  previewAutoBuildParamsFromCurrentInput
} from './course.js';

function getUiText() {
  return CONFIG.ui.displayText;
}

function buildErrorMessage(error) {
  const text = getUiText();
  return text.errorPrefix + (error instanceof Error ? error.message : String(error));
}

function updateRide() {
  if (!app.curve) {
    app.clock.getDelta();
    return;
  }

  if (!app.runtimeSettings) {
    app.clock.getDelta();
    return;
  }

  if (app.runtimeSettings.rideSpeed <= 0) {
    app.clock.getDelta();
    return;
  }

  const dt = app.clock.getDelta();
  app.rideT += dt * app.runtimeSettings.rideSpeed;

  if (app.rideT > 1) {
    app.rideT = 1;
  }

  updateCameraPosition(app.curve, app.rideT, app.runtimeSettings.lookAhead);
}

function render() {
  app.renderer.render(app.scene, app.camera);
}

function tick() {
  animateBackground();
  updateRide();
  render();
}

function refreshThemeOnly() {
  syncStateFromUI();
  rebuildSceneTheme();

  if (app.curve) {
    updateCameraPosition(app.curve, app.rideT, app.runtimeSettings.lookAhead);
  }
}

async function refreshAutoScalePreviewIfNeeded() {
  if (!ui.autoScaleInput.checked) return;

  try {
    await previewAutoBuildParamsFromCurrentInput();
  } catch (error) {
    setStatus(buildErrorMessage(error));
  }
}

function setupEvents() {
  ui.buildButton.addEventListener('click', async () => {
    try {
      await buildCourseFromUI();
    } catch (error) {
      setStatus(buildErrorMessage(error));
    }
  });

  ui.csvSelect.addEventListener('change', async () => {
    await refreshAutoScalePreviewIfNeeded();
  });

  ui.startDateInput.addEventListener('change', async () => {
    await refreshAutoScalePreviewIfNeeded();
  });

  ui.autoScaleInput.addEventListener('change', async () => {
    await refreshAutoScalePreviewIfNeeded();
  });

  ui.heightScaleInput.addEventListener('input', () => {
    if (document.activeElement === ui.heightScaleInput) {
      ui.autoScaleInput.checked = false;
    }
  });

  ui.zStepInput.addEventListener('input', () => {
    if (document.activeElement === ui.zStepInput) {
      ui.autoScaleInput.checked = false;
    }
  });

  ui.rideSpeedInput.addEventListener('input', () => {
    applyRuntimeSettingsFromUI();
  });

  ui.lookAheadInput.addEventListener('input', () => {
    applyRuntimeSettingsFromUI();

    if (app.curve) {
      updateCameraPosition(app.curve, app.rideT, app.runtimeSettings.lookAhead);
    }
  });

  ui.themeSelect.addEventListener('change', () => {
    refreshThemeOnly();
  });

  ui.showHeightGuidesInput.addEventListener('change', () => {
    refreshThemeOnly();
  });

  ui.toggleUiButton.addEventListener('click', () => {
    toggleUiVisible();
  });

  window.addEventListener('keydown', (event) => {
    if (
      event.key === CONFIG.ui.toggleKey ||
      event.key === CONFIG.ui.toggleKey.toUpperCase()
    ) {
      toggleUiVisible();
    }
  });

  window.addEventListener('resize', () => {
    app.camera.aspect = window.innerWidth / window.innerHeight;
    app.camera.updateProjectionMatrix();
    app.renderer.setSize(window.innerWidth, window.innerHeight);
    app.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, CONFIG.scene.maxPixelRatio)
    );
  });
}

function init() {
  applyUiConfigToDom();

  try {
    syncStateFromUI();
  } catch {
    // csv未選択でも初期表示は通す
  }

  createSceneObjects();
  createGround();
  createBackground();
  setUiVisible(true);
  setupEvents();
  app.renderer.setAnimationLoop(tick);
}

init();