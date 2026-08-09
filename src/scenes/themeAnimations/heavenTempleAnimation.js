// ============================================================================
//  Fallen Sky-City アニメーション
//  各 userData.kind ごとに、脈動・明滅・グリッチ・上昇・漂流を適用します。
//  export 名は従来どおり animateHeavenTempleChild（scene.js は無変更で動作）。
// ============================================================================

/**
 * 疑似ランダムなグリッチ判定（時間＋シードで安定的にちらつく）。
 */
function glitchGate(time, seed, threshold) {
  const v = Math.sin(time * 37.13 + seed * 91.7) * 43758.5453;
  return (v - Math.floor(v)) > threshold;
}

export function animateHeavenTempleChild(child, config) {
  const ruinConfig = config.sceneRefactor.heavenTemple;
  const animation = ruinConfig.animation;
  const time = performance.now() * 0.0024 * animation.tempo;

  child.traverse((part) => {
    const kind = part.userData.kind;
    if (!kind) return;

    // ── 浮遊エネルギーコア：上下ゆらぎ＋発光脈動 ──────────────
    if (kind === 'ruinCore') {
      const seed = part.userData.floatSeed || 0;
      const baseY = part.userData.baseY || part.position.y;
      part.position.y = baseY + Math.sin(time * 1.2 + seed) * 2.4;
      part.rotation.y += animation.coreSpin;
      part.rotation.x += animation.coreSpin * 0.5;
      if (part.material && 'emissiveIntensity' in part.material) {
        const baseEmissive = part.userData.baseEmissive || 1.0;
        part.material.emissiveIntensity =
          baseEmissive + Math.sin(time * animation.corePulseSpeed + seed) * animation.corePulseAmplitude;
      }
      return;
    }

    // ── 赤い警告灯：不規則な明滅 ─────────────────────────────
    if (kind === 'ruinBeacon') {
      const seed = part.userData.blinkSeed || 0;
      if (part.material && 'opacity' in part.material) {
        const baseOpacity = part.userData.baseOpacity ?? 0.9;
        const blink = glitchGate(time, seed, animation.beaconOffThreshold) ? 1 : animation.beaconDimFactor;
        part.material.opacity =
          baseOpacity * blink * (0.7 + Math.abs(Math.sin(time * animation.beaconBlinkSpeed + seed)) * 0.6);
      }
      return;
    }

    // ── 発光する亀裂／断面リング：脈動 ───────────────────────
    if (kind === 'ruinFracture') {
      const seed = part.userData.pulseSeed || 0;
      if (part.material && 'opacity' in part.material) {
        const baseOpacity = part.userData.baseOpacity ?? 0.5;
        part.material.opacity =
          baseOpacity + Math.sin(time * animation.fracturePulseSpeed + seed) * animation.fracturePulseAmplitude;
      }
      return;
    }

    // ── エネルギー亀裂（リフト）：激しいちらつき＋微振動 ─────
    if (kind === 'ruinRift') {
      const seed = part.userData.flickerSeed || 0;
      if (part.material && 'opacity' in part.material) {
        const baseOpacity = part.userData.baseOpacity ?? 0.5;
        const flicker = glitchGate(time, seed, animation.riftFlickerThreshold) ? 1 : 0.25;
        part.material.opacity =
          baseOpacity * flicker * (0.6 + Math.abs(Math.sin(time * animation.riftPulseSpeed + seed)) * 0.7);
      }
      part.scale.x = 1 + Math.sin(time * animation.riftPulseSpeed * 1.7 + seed) * 0.06;
      return;
    }

    // ── ホログラム看板：グリッチ（横ジャンプ＋不透明度ちらつき） ─
    if (kind === 'ruinHologram') {
      const seed = part.userData.glitchSeed || 0;
      const baseX = part.userData.baseX || part.position.x;
      const baseOpacity = part.userData.baseOpacity ?? 0.4;
      if (glitchGate(time, seed, animation.hologramGlitchThreshold)) {
        part.position.x = baseX + (glitchGate(time * 1.3, seed, 0.5) ? 1 : -1) * animation.hologramJump;
        if (part.material) part.material.opacity = baseOpacity * 0.35;
      } else {
        part.position.x = baseX;
        if (part.material && 'opacity' in part.material) {
          part.material.opacity =
            baseOpacity + Math.sin(time * animation.hologramPulseSpeed + seed) * animation.hologramPulseAmplitude;
        }
      }
      return;
    }

    // ── 走査線：上方向へスクロールしてループ ────────────────
    if (kind === 'ruinScanline') {
      const span = part.userData.scanSpan || 40;
      const speed = part.userData.scanSpeed || 0.4;
      const bottom = part.userData.scanBottom ?? (part.userData.baseY - span);
      part.position.y += speed;
      if (part.position.y > bottom + span) {
        part.position.y = bottom;
      }
      return;
    }

    // ── 火の粉：上昇＋横ゆらぎ＋点滅、上端でループ ───────────
    if (kind === 'ruinEmber') {
      const seed = part.userData.floatSeed || 0;
      const riseSpeed = part.userData.riseSpeed || 0.1;
      const top = part.userData.yTop || 220;
      const reset = part.userData.yReset || 60;
      const baseX = part.userData.baseX || part.position.x;
      const baseZ = part.userData.baseZ || part.position.z;

      part.position.y += riseSpeed;
      if (part.position.y > top) part.position.y = reset;
      part.position.x = baseX + Math.sin(time * 1.3 + seed) * 3.2;
      part.position.z = baseZ + Math.cos(time * 0.9 + seed) * 3.2;
      if (part.material && 'opacity' in part.material) {
        const baseOpacity = part.userData.baseOpacity ?? 0.5;
        part.material.opacity =
          baseOpacity + Math.sin(time * animation.emberTwinkleSpeed + seed) * animation.emberTwinkleAmplitude;
      }
      return;
    }

    // ── 瓦礫群：ゆっくり自転＋上下漂流 ───────────────────────
    if (kind === 'ruinDebris') {
      const seed = part.userData.spinSeed || 0;
      part.rotation.y += animation.debrisSpin;
      part.rotation.x += animation.debrisSpin * 0.4;
      part.position.y = (part.userData.baseY || 0) + Math.sin(time * animation.debrisBobSpeed + seed) * animation.debrisBobAmplitude;
      return;
    }

    // ── 尖塔のネオンエッジ：脈動 ─────────────────────────────
    if (kind === 'ruinSpireGlow') {
      const seed = part.userData.pulseSeed || 0;
      if (part.material && 'opacity' in part.material) {
        const baseOpacity = part.userData.baseOpacity ?? 0.7;
        part.material.opacity =
          baseOpacity + Math.sin(time * animation.spirePulseSpeed + seed) * animation.spirePulseAmplitude;
      }
      return;
    }

    // ── 崩落橋の断面：脈動 ───────────────────────────────────
    if (kind === 'ruinBridgeEdge') {
      const seed = part.userData.pulseSeed || 0;
      if (part.material && 'opacity' in part.material) {
        const baseOpacity = part.userData.baseOpacity ?? 0.7;
        part.material.opacity =
          baseOpacity + Math.sin(time * animation.fracturePulseSpeed + seed) * animation.fracturePulseAmplitude;
      }
      return;
    }

    // ── エネルギー嵐の帯：横流れ＋上下うねり＋脈動 ───────────
    if (kind === 'ruinStorm') {
      const seed = part.userData.floatSeed || 0;
      const baseY = part.userData.baseY || part.position.y;
      const xLimit = part.userData.xLimit || 400;
      const driftSpeed = part.userData.driftSpeed || 0.02;

      part.position.x += driftSpeed;
      if (part.position.x > xLimit) part.position.x = -xLimit;
      part.position.y = baseY + Math.sin(time * 0.6 + seed) * 6;
      part.rotation.z = Math.sin(time * 0.4 + seed) * 0.1;
      part.scale.x = 0.9 + Math.sin(time * 0.7 + seed) * 0.08;
      if (part.material && 'opacity' in part.material) {
        const baseOpacity = part.userData.baseOpacity ?? 0.14;
        part.material.opacity =
          baseOpacity + Math.sin(time * animation.stormPulseSpeed + seed) * animation.stormPulseAmplitude;
      }
      return;
    }
  });
}
