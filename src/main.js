import { CONFIG } from './config.js';
import { app } from './state.js';
import {
  createSceneObjects,
  createGround,
  createBackground,
  animateBackground,
  updateCameraPosition,
  rebuildSceneTheme,
  rebuildGround,
  refreshGuidesAfterCourseBuild
} from './scene.js';
import {
  ui,
  setStatus,
  setUiVisible,
  toggleUiVisible,
  applyRuntimeSettingsFromUI,
  syncStateFromUI,
  applyUiConfigToDom,
  getBuildSettingsFromUI,
  updateStatus,
  applyAutoBuildParamsToUI
} from './ui.js';
import {
  buildCourse,
  calculateAutoBuildParamsFromSettings
} from './course.js';

/**
 * UI表示用テキスト設定を取得します。
 * @returns {object} UI表示テキスト設定です。
 */
function getUiText() {
  return CONFIG.ui.displayText;
}

/**
 * エラー内容をUI表示用メッセージに変換します。
 * @param {unknown} error 発生したエラーです。
 * @returns {string} 整形済みエラーメッセージです。
 */
function buildErrorMessage(error) {
  const text = getUiText();
  return text.errorPrefix + (
    error instanceof Error ? error.message : String(error)
  );
}

/**
 * 現在のコース進行状況に応じてカメラ位置を更新します。
 */
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

  const deltaTime = app.clock.getDelta();
  app.rideT += deltaTime * app.runtimeSettings.rideSpeed;

  if (app.rideT > 1) {
    app.rideT = 1;
  }

  updateCameraPosition(app.curve, app.rideT, app.runtimeSettings.lookAhead);
}

/**
 * 現在のシーンを描画します。
 */
function render() {
  app.renderer.render(app.scene, app.camera);
}

/**
 * 毎フレームの更新処理を実行します。
 */
function tick() {
  animateBackground();
  updateRide();
  render();
}

/**
 * テーマ関連の見た目だけを再反映します。
 */
function refreshThemeOnly() {
  syncStateFromUI();
  rebuildSceneTheme();

  if (app.curve) {
    updateCameraPosition(app.curve, app.rideT, app.runtimeSettings.lookAhead);
  }

  updateStatus();
}

/**
 * コース再構築後に scene 側の再同期を行います。
 */
function rebuildSceneAfterCourseBuild() {
  updateCameraPosition(app.curve, 0, app.runtimeSettings.lookAhead);
  rebuildGround();
  createBackground();
  refreshGuidesAfterCourseBuild();
}

/**
 * 自動調整のプレビュー値をUIへ反映します。
 */
async function previewAutoBuildParamsFromUI() {
  if (!ui.csvSelect.value) {
    return;
  }

  const buildSettings = getBuildSettingsFromUI();

  if (!buildSettings.autoScale) {
    return;
  }

  const autoParams = await calculateAutoBuildParamsFromSettings(
    buildSettings
  );

  if (!autoParams) {
    return;
  }

  applyAutoBuildParamsToUI(autoParams);
}

/**
 * 自動調整が有効な場合にプレビュー値を更新します。
 */
async function refreshAutoScalePreviewIfNeeded() {
  if (!ui.autoScaleInput.checked) {
    return;
  }

  try {
    await previewAutoBuildParamsFromUI();
  } catch (error) {
    setStatus(buildErrorMessage(error));
  }
}

/**
 * Buildボタン押下時の処理です。
 */
async function handleBuildButtonClick() {
  try {
    const buildSettings = getBuildSettingsFromUI();
    const result = await buildCourse(buildSettings);

    if (result.autoParams) {
      applyAutoBuildParamsToUI(result.autoParams);
    }

    rebuildSceneAfterCourseBuild();
    updateStatus();
  } catch (error) {
    setStatus(buildErrorMessage(error));
  }
}

/**
 * UIと状態の初期化を行います。
 */
function initializeUiAndState() {
  applyUiConfigToDom();

  try {
    syncStateFromUI();
  } catch {
    // CSV未選択でも初期表示は通す
  }

  applyRuntimeSettingsFromUI();
  setUiVisible(app.isUiVisible);
  updateStatus();
}

/**
 * シーン関連の初期化を行います。
 */
function initializeScene() {
  createSceneObjects();
  createGround();
  createBackground();
}

/**
 * UIやウィンドウのイベントを登録します。
 */
function setupEvents() {
  ui.buildButton.addEventListener('click', handleBuildButtonClick);

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

  window.addEventListener('keydown', event => {
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
 */
function initApp() {
  initializeUiAndState();
  initializeScene();
  setupEvents();
  app.renderer.setAnimationLoop(tick);
}

initApp();
