import { app } from './state.js';
import { animateBackground, sampleCurvePoint, updateCameraPosition } from './scene.js';
import { updateRideSound } from './rideSound.js';
import { updateRideHaptics } from './rideHaptics.js';

/**
 * 現在のコース進行状況に応じてカメラ位置を更新します。
 */
function updateRide() {
  const deltaTime = app.clock.getDelta();

  if (!app.curve) {
    return {
      deltaTime,
      deltaY: 0,
      rideSpeed: app.runtimeSettings?.rideSpeed ?? 0,
      isActive: false
    };
  }

  if (!app.runtimeSettings || app.runtimeSettings.rideSpeed <= 0) {
    return {
      deltaTime,
      deltaY: 0,
      rideSpeed: app.runtimeSettings?.rideSpeed ?? 0,
      isActive: false
    };
  }

  const previousT = app.rideT;
  const previousPos = sampleCurvePoint(app.curve, previousT);

  app.rideT += deltaTime * app.runtimeSettings.rideSpeed;

  if (app.rideT > 1) {
    app.rideT = 1;
  }

  const currentPos = sampleCurvePoint(app.curve, app.rideT);
  const deltaY = currentPos.y - previousPos.y;

  updateCameraPosition(app.curve, app.rideT, app.runtimeSettings.lookAhead);

  return {
    deltaTime,
    deltaY,
    rideSpeed: app.runtimeSettings.rideSpeed,
    isActive: app.rideT > previousT
  };
}

/**
 * 毎フレームの更新処理を実行します。
 */
export function tickFrame() {
  animateBackground();
  const rideMotion = updateRide();
  updateRideSound(rideMotion);
  updateRideHaptics(rideMotion);
  app.renderer.render(app.scene, app.camera);
}
