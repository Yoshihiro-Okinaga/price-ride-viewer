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

/**
 * UI表示用テキスト設定を取得します。
 * @returns {*} UI表示テキスト設定です。
 */
function getUiText() {
  // この関数の主要処理をここから実行します。
  return CONFIG.ui.displayText;
}

/**
 * エラー内容をUI表示用メッセージに変換します。
 * @param {*} error 発生したエラーオブジェクトです。
 * @returns {*} 整形済みエラーメッセージです。
 */
function buildErrorMessage(error) {
  // この関数の主要処理をここから実行します。
  const text = getUiText();
  return text.errorPrefix + (error instanceof Error ? error.message : String(error));
}

/**
 * 現在のコース進行状況に応じてカメラ位置を更新します。
 * @returns {*} なし。
 */
function updateRide() {
  // この関数の主要処理をここから実行します。
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

/**
 * 現在のシーンをレンダリングします。
 * @returns {*} なし。
 */
function render() {
  // この関数の主要処理をここから実行します。
  app.renderer.render(app.scene, app.camera);
}

/**
 * 毎フレームの更新処理を実行します。
 * @returns {*} なし。
 */
function tick() {
  // この関数の主要処理をここから実行します。
  animateBackground();
  updateRide();
  render();
}

/**
 * UIのテーマ設定だけを再反映します。
 * @returns {*} なし。
 */
function refreshThemeOnly() {
  // この関数の主要処理をここから実行します。
  syncStateFromUI();
  rebuildSceneTheme();

  if (app.curve) {
    updateCameraPosition(app.curve, app.rideT, app.runtimeSettings.lookAhead);
  }
}

/**
 * 自動調整が有効な場合にプレビュー値を更新します。
 * @returns {*} Promise<void> です。
 */
async function refreshAutoScalePreviewIfNeeded() {
  // この関数の主要処理をここから実行します。
  if (!ui.autoScaleInput.checked) return;

  try {
    await previewAutoBuildParamsFromCurrentInput();
  } catch (error) {
    setStatus(buildErrorMessage(error));
  }
}

/**
 * UIやウィンドウのイベントを登録します。
 * @returns {*} なし。
 */
function setupEvents() {
  // この関数の主要処理をここから実行します。
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

/**
 * アプリケーション全体を初期化します。
 * @returns {*} Promise<void> です。
 */
function init() {
  // この関数の主要処理をここから実行します。
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