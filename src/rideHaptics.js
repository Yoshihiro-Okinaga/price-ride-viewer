let xboxHid = null;
let hasInitializedHid = false;
let requestDeviceTried = false;
let isPulsing = false;

const hapticState = {
  intensity: 0,
  verticalVelocity: 0,
  lastPulseAt: 0
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(from, to, t) {
  return from + (to - from) * t;
}

function getPrimaryGamepad() {
  if (!navigator.getGamepads) {
    return null;
  }

  const gamepads = navigator.getGamepads();

  if (!gamepads) {
    return null;
  }

  for (const gamepad of gamepads) {
    if (gamepad && gamepad.connected) {
      return gamepad;
    }
  }

  return null;
}

async function tryOpenXboxFromDevices(devices) {
  if (!devices || devices.length === 0) {
    return false;
  }

  const xbox = devices.find(device => device.vendorId === 0x045e);

  if (!xbox) {
    return false;
  }

  try {
    if (!xbox.opened) {
      await xbox.open();
    }
    xboxHid = xbox;
    return true;
  } catch {
    return false;
  }
}

async function initializeXboxHid() {
  if (hasInitializedHid || !navigator.hid) {
    return;
  }

  hasInitializedHid = true;

  try {
    const granted = await navigator.hid.getDevices();
    const opened = await tryOpenXboxFromDevices(granted);

    if (opened || requestDeviceTried) {
      return;
    }

    requestDeviceTried = true;
    const picked = await navigator.hid.requestDevice({
      filters: [{ vendorId: 0x045e }]
    });
    await tryOpenXboxFromDevices(picked);
  } catch {
    // ユーザーが許可しなかった場合や未対応環境では静かにフォールバックします。
  }
}

async function pulseGamepadHaptics(strongMagnitude, weakMagnitude, durationMs) {
  const gamepad = getPrimaryGamepad();

  if (!gamepad) {
    return false;
  }

  if (gamepad.hapticActuators && gamepad.hapticActuators[0]) {
    try {
      const pulseAmount = clamp(strongMagnitude * 0.7 + weakMagnitude * 0.3, 0, 1);
      await gamepad.hapticActuators[0].pulse(pulseAmount, durationMs);
      return true;
    } catch {
      // 次の方式へフォールバックします。
    }
  }

  if (gamepad.vibrationActuator) {
    try {
      await gamepad.vibrationActuator.playEffect('dual-rumble', {
        startDelay: 0,
        duration: durationMs,
        strongMagnitude,
        weakMagnitude
      });
      return true;
    } catch {
      // 次の方式へフォールバックします。
    }
  }

  return false;
}

async function pulseXboxHid(strongMagnitude, weakMagnitude, durationMs) {
  if (!xboxHid) {
    return false;
  }

  try {
    const payload = new Uint8Array([
      0x09,
      0x00,
      Math.floor(clamp(strongMagnitude, 0, 1) * 255),
      Math.floor(clamp(weakMagnitude, 0, 1) * 255),
      durationMs & 0xff,
      (durationMs >> 8) & 0xff
    ]);
    await xboxHid.sendReport(0x03, payload);
    return true;
  } catch {
    return false;
  }
}

export async function primeRideHaptics() {
  await initializeXboxHid();
}

export function updateRideHaptics({ deltaY = 0, deltaTime = 1 / 60, rideSpeed = 0, isActive = false } = {}) {
  const dt = Math.max(deltaTime, 1 / 240);
  const currentVelocity = deltaY / dt;
  const previousVelocity = hapticState.verticalVelocity;
  hapticState.verticalVelocity = lerp(previousVelocity, currentVelocity, 0.34);

  const verticalNorm = clamp(Math.abs(hapticState.verticalVelocity) / 26, 0, 1);
  const speedNorm = clamp(rideSpeed / 0.08, 0, 1);
  const targetIntensity = isActive
    ? clamp(verticalNorm * 0.8 + speedNorm * 0.3, 0, 1)
    : 0;

  hapticState.intensity = lerp(hapticState.intensity, targetIntensity, isActive ? 0.3 : 0.14);
  const intensity = hapticState.intensity;

  if (intensity < 0.03) {
    return;
  }

  const now = performance.now();
  const pulseIntervalMs = 46;

  if (now - hapticState.lastPulseAt < pulseIntervalMs || isPulsing) {
    return;
  }

  const downhillBoost = clamp(-deltaY * 24, 0, 1);
  const uphillBoost = clamp(deltaY * 24, 0, 1);
  const accel = Math.abs(hapticState.verticalVelocity - previousVelocity);
  const shockBoost = clamp((accel - 10) / 28, 0, 1);

  const strongMagnitude = clamp(
    0.06 + intensity * 0.2 + downhillBoost * 0.56 + shockBoost * 0.2,
    0,
    1
  );
  const weakMagnitude = clamp(
    0.08 + intensity * 0.24 + uphillBoost * 0.45 + downhillBoost * 0.2,
    0,
    1
  );

  const durationMs = Math.round(38 + intensity * 38);
  hapticState.lastPulseAt = now;
  isPulsing = true;

  void (async () => {
    try {
      const gamepadOk = await pulseGamepadHaptics(strongMagnitude, weakMagnitude, durationMs);

      if (!gamepadOk) {
        await pulseXboxHid(strongMagnitude, weakMagnitude, durationMs);
      }
    } finally {
      isPulsing = false;
    }
  })();
}
