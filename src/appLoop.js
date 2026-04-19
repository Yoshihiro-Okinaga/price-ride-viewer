import { app } from './state.js';
import { animateBackground, updateCameraPosition } from './scene.js';

/**
 * 現在のコース進行状況に応じてカメラ位置を更新します。
 */
function updateRide() {
  if (!app.curve) {
    app.clock.getDelta();
    return;
  }

  if (!app.runtimeSettings || app.runtimeSettings.rideSpeed <= 0) {
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
 * 毎フレームの更新処理を実行します。
 */
export function tickFrame() {
  animateBackground();
  updateRide();
  app.renderer.render(app.scene, app.camera);
}
