import { CONFIG } from './config.js';
import { app } from './state.js';
import {
  ui,
  setStatus,
  setUiVisible,
  toggleUiVisible,
  applyRuntimeSettingsFromUI,
  syncStateFromUI
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

function updateRide() {
  if (!app.curve) {
    app.clock.getDelta();
    return;
  }

  const runtime = app.runtimeSettings;
  if (!runtime) {
    app.clock.getDelta();
    return;
  }

  if (runtime.rideSpeed <= 0) {
    app.clock.getDelta();
    return;
  }

  const dt = app.clock.getDelta();
  app.rideT += dt * runtime.rideSpeed;

  if (app.rideT > 1) {
    app.rideT = 1;
  }

  updateCameraPosition(app.curve, app.rideT, runtime.lookAhead);
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
  } catch (err) {
    setStatus('エラー: ' + (err instanceof Error ? err.message : String(err)));
  }
}

function setupEvents() {
  ui.buildButton.addEventListener('click', async () => {
    try {
      await buildCourseFromUI();
    } catch (err) {
      setStatus('エラー: ' + (err instanceof Error ? err.message : String(err)));
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

  window.addEventListener('keydown', (e) => {
    if (e.key === CONFIG.ui.toggleKey || e.key === CONFIG.ui.toggleKey.toUpperCase()) {
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