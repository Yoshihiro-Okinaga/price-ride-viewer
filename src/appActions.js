import { UI_CONFIG } from './config/uiConfig.js';
import { app } from './state.js';
import {
  createSceneObjects,
  createGround,
  createBackground,
  updateCameraPosition,
  rebuildSceneTheme,
  rebuildGround,
  refreshGuidesAfterCourseBuild
} from './scene.js';
import {
  ui,
  setStatus,
  setUiVisible,
  getRuntimeSettingsFromUI,
  getSceneDisplaySettingsFromUI,
  applyUiConfigToDom,
  getBuildSettingsFromUI,
  updateStatus,
  applyAutoBuildParamsToUI
} from './ui.js';
import {
  buildCourse,
  calculateAutoBuildParamsFromSettings
} from './course.js';

function buildErrorMessage(error) {
  const errorPrefix = UI_CONFIG.displayText.errorPrefix;
  return errorPrefix + (
    error instanceof Error ? error.message : String(error)
  );
}

function rebuildSceneAfterCourseBuild() {
  updateCameraPosition(app.curve, 0, app.runtimeSettings.lookAhead);
  rebuildGround();
  createBackground();
  refreshGuidesAfterCourseBuild();
}

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
export async function refreshAutoScalePreviewIfNeeded() {
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
export async function handleBuildButtonClick() {
  try {
    app.runtimeSettings = getRuntimeSettingsFromUI(app.runtimeSettings);
    const buildSettings = getBuildSettingsFromUI();
    const result = await buildCourse(buildSettings);

    if (result.autoParams) {
      applyAutoBuildParamsToUI(result.autoParams);
    }

    rebuildSceneAfterCourseBuild();
    updateStatus(app.lastBuildInfo, app.runtimeSettings);
  } catch (error) {
    setStatus(buildErrorMessage(error));
  }
}

/**
 * テーマ関連の見た目だけを再反映します。
 */
export function refreshThemeOnly() {
  app.buildSettings = {
    ...app.buildSettings,
    ...getSceneDisplaySettingsFromUI()
  };
  rebuildSceneTheme();

  if (app.curve) {
    updateCameraPosition(app.curve, app.rideT, app.runtimeSettings.lookAhead);
  }

  updateStatus(app.lastBuildInfo, app.runtimeSettings);
}

/**
 * UIと状態の初期化を行います。
 */
export function initializeUiAndState() {
  applyUiConfigToDom();
  app.buildSettings = {
    ...app.buildSettings,
    ...getSceneDisplaySettingsFromUI()
  };
  app.runtimeSettings = getRuntimeSettingsFromUI(app.runtimeSettings);
  setUiVisible(true);
  updateStatus(app.lastBuildInfo, app.runtimeSettings);
}

/**
 * シーン関連の初期化を行います。
 */
export function initializeScene() {
  createSceneObjects();
  createGround();
  createBackground();
}

/**
 * 移動系のUI変更を状態へ反映し、ステータス表示を更新します。
 */
export function applyRuntimeSettingsAndUpdateStatus() {
  app.runtimeSettings = getRuntimeSettingsFromUI(app.runtimeSettings);
  updateStatus(app.lastBuildInfo, app.runtimeSettings);
}

/**
 * 視線先読み量の変更を反映し、必要時はカメラを再配置します。
 */
export function applyLookAheadAndUpdateCamera() {
  applyRuntimeSettingsAndUpdateStatus();

  if (app.curve) {
    updateCameraPosition(app.curve, app.rideT, app.runtimeSettings.lookAhead);
  }
}
