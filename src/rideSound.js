let audioCtx = null;
let rumbleOsc = null;
let rumbleGain = null;
let rushOsc = null;
let rushGain = null;
let windSource = null;
let windFilter = null;
let windGain = null;
let masterGain = null;

const soundState = {
  intensity: 0,
  verticalVelocity: 0
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(from, to, t) {
  return from + (to - from) * t;
}

function createNoiseBuffer(context) {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let index = 0; index < data.length; index += 1) {
    data[index] = (Math.random() * 2 - 1) * 0.6;
  }

  return buffer;
}

function ensureAudioGraph() {
  if (audioCtx) {
    return;
  }

  const Context = window.AudioContext || window.webkitAudioContext;

  if (!Context) {
    return;
  }

  audioCtx = new Context();

  rumbleOsc = audioCtx.createOscillator();
  rumbleOsc.type = 'sawtooth';
  rumbleOsc.frequency.value = 95;
  rumbleGain = audioCtx.createGain();
  rumbleGain.gain.value = 0;

  rushOsc = audioCtx.createOscillator();
  rushOsc.type = 'triangle';
  rushOsc.frequency.value = 160;
  rushGain = audioCtx.createGain();
  rushGain.gain.value = 0;

  windSource = audioCtx.createBufferSource();
  windSource.buffer = createNoiseBuffer(audioCtx);
  windSource.loop = true;
  windFilter = audioCtx.createBiquadFilter();
  windFilter.type = 'highpass';
  windFilter.frequency.value = 550;
  windGain = audioCtx.createGain();
  windGain.gain.value = 0;

  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.72;

  rumbleOsc.connect(rumbleGain);
  rumbleGain.connect(masterGain);

  rushOsc.connect(rushGain);
  rushGain.connect(masterGain);

  windSource.connect(windFilter);
  windFilter.connect(windGain);
  windGain.connect(masterGain);

  masterGain.connect(audioCtx.destination);

  rumbleOsc.start();
  rushOsc.start();
  windSource.start();
}

export async function primeRideSound() {
  ensureAudioGraph();

  if (!audioCtx) {
    return;
  }

  if (audioCtx.state === 'suspended') {
    try {
      await audioCtx.resume();
    } catch {
      // ユーザー操作のタイミングで再試行されます。
    }
  }
}

export function updateRideSound({ deltaY = 0, deltaTime = 1 / 60, rideSpeed = 0, isActive = false } = {}) {
  if (!audioCtx || !rumbleOsc || !rushOsc || !windFilter) {
    return;
  }

  const now = audioCtx.currentTime;
  const dt = Math.max(deltaTime, 1 / 240);
  const currentVelocity = deltaY / dt;
  const previousVelocity = soundState.verticalVelocity;
  soundState.verticalVelocity = lerp(previousVelocity, currentVelocity, 0.3);

  const verticalNorm = clamp(Math.abs(soundState.verticalVelocity) / 26, 0, 1);
  const speedNorm = clamp(rideSpeed / 0.08, 0, 1);
  const targetIntensity = isActive
    ? clamp(verticalNorm * 0.78 + speedNorm * 0.34, 0, 1)
    : 0;

  soundState.intensity = lerp(soundState.intensity, targetIntensity, isActive ? 0.26 : 0.14);
  const intensity = soundState.intensity;
  const downhillBoost = clamp(-deltaY * 24, 0, 1);
  const uphillBoost = clamp(deltaY * 24, 0, 1);
  const accel = Math.abs(soundState.verticalVelocity - previousVelocity);

  if (intensity < 0.01) {
    rumbleGain.gain.setTargetAtTime(0, now, 0.06);
    windGain.gain.setTargetAtTime(0, now, 0.06);
    rushGain.gain.setTargetAtTime(0, now, 0.05);
    return;
  }

  const rumbleFreq = 80 + intensity * 118 + downhillBoost * 125 - uphillBoost * 25;
  const rushFreq = 170 + intensity * 260 + downhillBoost * 420;
  const windCutoff = 520 + intensity * 3800 + downhillBoost * 1000;

  rumbleOsc.frequency.setTargetAtTime(rumbleFreq, now, 0.03);
  rushOsc.frequency.setTargetAtTime(rushFreq, now, 0.02);
  windFilter.frequency.setTargetAtTime(windCutoff, now, 0.04);

  const rumbleLevel = 0.018 + intensity * 0.22;
  const windLevel = 0.012 + intensity * 0.23 + downhillBoost * 0.06;
  const rushLevel = 0.01 + intensity * (downhillBoost > 0.05 ? 0.2 : 0.08);
  const shockBoost = clamp((accel - 10) / 28, 0, 1) * 0.14;

  rumbleGain.gain.setTargetAtTime(rumbleLevel, now, 0.04);
  windGain.gain.setTargetAtTime(windLevel, now, 0.05);
  rushGain.gain.setTargetAtTime(rushLevel + shockBoost, now, 0.02);
}
