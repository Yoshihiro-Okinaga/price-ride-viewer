import { SCENE_CONFIG } from './config/sceneConfig.js';
import { UI_CONFIG } from './config/uiConfig.js';
import { app } from './state.js';
import { ui, toggleUiVisible } from './ui.js';
import { primeRideSound } from './rideSound.js';
import { primeRideHaptics } from './rideHaptics.js';

/**
 * UIやウィンドウのイベントを登録します。
 * @param {{
 *   onBuildButtonClick: () => Promise<void>,
 *   onRefreshAutoScalePreview: () => Promise<void>,
 *   onRefreshTheme: () => void,
 *   onRuntimeInput: () => void,
 *   onLookAheadInput: () => void
 * }} handlers イベント時に実行する処理群です。
 */
export function setupEvents(handlers) {
  const unlockFeedback = () => {
    void primeRideSound();
    void primeRideHaptics();
  };

  window.addEventListener('pointerdown', unlockFeedback, { once: true });
  window.addEventListener('keydown', unlockFeedback, { once: true });

  ui.buildButton.addEventListener('click', handlers.onBuildButtonClick);

  ui.csvSelect.addEventListener('change', async () => {
    await handlers.onRefreshAutoScalePreview();
  });

  ui.startDateInput.addEventListener('change', async () => {
    await handlers.onRefreshAutoScalePreview();
  });

  ui.autoScaleInput.addEventListener('change', async () => {
    await handlers.onRefreshAutoScalePreview();
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

  ui.rideSpeedInput.addEventListener('input', handlers.onRuntimeInput);
  ui.lookAheadInput.addEventListener('input', handlers.onLookAheadInput);

  ui.themeSelect.addEventListener('change', handlers.onRefreshTheme);
  ui.showHeightGuidesInput.addEventListener('change', handlers.onRefreshTheme);

  ui.toggleUiButton.addEventListener('click', () => {
    toggleUiVisible();
  });

  window.addEventListener('keydown', event => {
    if (
      event.key === UI_CONFIG.toggleKey ||
      event.key === UI_CONFIG.toggleKey.toUpperCase()
    ) {
      toggleUiVisible();
    }
  });

  window.addEventListener('resize', () => {
    app.camera.aspect = window.innerWidth / window.innerHeight;
    app.camera.updateProjectionMatrix();

    app.renderer.setSize(window.innerWidth, window.innerHeight);
    app.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, SCENE_CONFIG.scene.maxPixelRatio)
    );
  });
}
