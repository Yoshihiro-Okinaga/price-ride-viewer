export function animateFutureCityChild(child, config) {
  const futureConfig = config.sceneRefactor.futureCity;
  const beaconConfig = futureConfig.beacon;
  const hoverConfig = futureConfig.hoverLane;
  const hologramConfig = futureConfig.hologram;
  const tempo = futureConfig.animation.tempo;
  const time = performance.now() * 0.003 * tempo;

  child.traverse((part) => {
    if (part.userData.kind === 'futureBeacon') {
      const seed = part.userData.blinkSeed || 0;
      const s =
        beaconConfig.pulseScaleBase +
        Math.sin(time * beaconConfig.pulseSpeed + seed) * beaconConfig.pulseScaleAmplitude;
      part.scale.setScalar(Math.max(0.6, s));
      if (part.material && 'opacity' in part.material) {
        const baseOpacity = part.userData.baseOpacity ?? beaconConfig.baseOpacity;
        part.material.opacity =
          baseOpacity +
          Math.sin(time * beaconConfig.pulseSpeed + seed) * beaconConfig.pulseOpacity;
      }
    }

    if (part.userData.kind === 'futureBeaconHalo') {
      const seed = part.userData.blinkSeed || 0;
      if (part.material && 'opacity' in part.material) {
        const baseOpacity = part.userData.baseOpacity ?? 0.24;
        part.material.opacity = baseOpacity + Math.sin(time * beaconConfig.pulseSpeed + seed) * 0.12;
      }
    }

    if (part.userData.kind === 'futureRooftopRing') {
      const seed = part.userData.pulseSeed || 0;
      part.rotation.z += 0.015;
      if (part.material && 'emissiveIntensity' in part.material) {
        part.material.emissiveIntensity =
          config.sceneRefactor.futureCity.tower.rooftopRingEmissiveIntensity +
          Math.sin(time * 2.1 + seed) * 0.35;
      }
    }

    if (part.userData.kind === 'futureBridgeStrip') {
      const seed = part.userData.pulseSeed || 0;
      if (part.material && 'opacity' in part.material) {
        const baseOpacity = part.userData.baseOpacity ?? 0.52;
        part.material.opacity = baseOpacity + Math.sin(time * 2.8 + seed) * 0.18;
      }
    }

    if (part.userData.kind === 'futureHoverLane') {
      const seed = part.userData.floatSeed || 0;
      const baseY = part.userData.baseY ?? hoverConfig.y;
      part.position.y = baseY + Math.sin(time + seed) * hoverConfig.floatAmplitude;
      if (part.material && 'opacity' in part.material) {
        const baseOpacity = part.userData.baseOpacity ?? hoverConfig.baseOpacity;
        part.material.opacity = baseOpacity + Math.sin(time * 1.8 + seed) * hoverConfig.pulseOpacity;
      }
    }

    if (part.userData.kind === 'futureHoverLaneRing') {
      const seed = part.userData.floatSeed || 0;
      const baseY = part.userData.baseY ?? (hoverConfig.y - 1.4);
      part.position.y = baseY + Math.sin(time * 1.15 + seed) * (hoverConfig.floatAmplitude * 0.8);
      part.rotation.z += 0.03;
      if (part.material && 'opacity' in part.material) {
        const baseOpacity = part.userData.baseOpacity ?? hoverConfig.ringOpacity;
        part.material.opacity = baseOpacity + Math.sin(time * 2.0 + seed) * 0.14;
      }
    }

    if (part.userData.kind === 'futureHologram') {
      const seed = part.userData.pulseSeed || 0;
      if (part.material && 'opacity' in part.material) {
        const baseOpacity = part.userData.baseOpacity ?? hologramConfig.baseOpacity;
        part.material.opacity = baseOpacity + Math.sin(time * 1.9 + seed) * hologramConfig.pulseOpacity;
      }
      part.position.y += Math.sin(time * 0.8 + seed) * 0.03;
    }

    if (part.userData.kind === 'futureTraffic') {
      const speed = part.userData.speed || 0.02;
      const halfSpan = part.userData.halfSpan || 120;
      const trailLength = part.userData.trailLength || 10;
      part.position.x += speed * 60;
      if (part.position.x > halfSpan + trailLength) {
        part.position.x = -halfSpan - trailLength;
      }
    }
  });
}
