import { app } from './state.js';
import { tickFrame } from './appLoop.js';
import {
  initializeUiAndState,
  initializeScene,
  handleBuildButtonClick,
  refreshAutoScalePreviewIfNeeded,
  refreshThemeOnly,
  applyRuntimeSettingsAndUpdateStatus,
  applyLookAheadAndUpdateCamera
} from './appActions.js';
import { setupEvents } from './appEvents.js';

/**
 * アプリケーション全体を初期化します。
 */
function initApp() {
  initializeUiAndState();
  initializeScene();
  setupEvents({
    onBuildButtonClick: handleBuildButtonClick,
    onRefreshAutoScalePreview: refreshAutoScalePreviewIfNeeded,
    onRefreshTheme: refreshThemeOnly,
    onRuntimeInput: applyRuntimeSettingsAndUpdateStatus,
    onLookAheadInput: applyLookAheadAndUpdateCamera
  });
  app.renderer.setAnimationLoop(tickFrame);
}

initApp();
