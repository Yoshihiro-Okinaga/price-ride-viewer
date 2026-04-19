export function animateHeavenTempleChild(child, config) {
  const heavenConfig = config.sceneRefactor.heavenTemple;
  const animation = heavenConfig.animation;
  const auroraConfig = heavenConfig.aurora;
  const roadsideConfig = heavenConfig.roadside;
  const time = performance.now() * 0.0024 * animation.tempo;

  child.traverse((part) => {
    if (part.userData.kind === 'heavenHalo') {
      const seed = part.userData.spinSeed || 0;
      part.rotation.z += animation.haloSpin;
      if (part.material && 'opacity' in part.material) {
        const baseOpacity = part.userData.baseOpacity ?? 0.6;
        part.material.opacity =
          baseOpacity +
          Math.sin(time * animation.bannerPulseSpeed + seed) * animation.bannerPulseAmplitude;
      }
    }

    if (part.userData.kind === 'heavenRearHalo') {
      const seed = part.userData.spinSeed || 0;
      part.rotation.y += animation.haloSpin * 0.7;
      if (part.material && 'opacity' in part.material) {
        const baseOpacity = part.userData.baseOpacity ?? 0.28;
        part.material.opacity =
          baseOpacity +
          Math.sin(time * animation.bannerPulseSpeed * 0.8 + seed) *
            animation.bannerPulseAmplitude *
            0.7;
      }
    }

    if (part.userData.kind === 'heavenRim') {
      const seed = part.userData.pulseSeed || 0;
      part.rotation.z -= animation.haloSpin * 0.65;
      if (part.material && 'opacity' in part.material) {
        const baseOpacity = part.userData.baseOpacity ?? 0.5;
        part.material.opacity = baseOpacity + Math.sin(time * 1.7 + seed) * 0.16;
      }
    }

    if (part.userData.kind === 'heavenVeil') {
      const seed = part.userData.floatSeed || 0;
      const baseY = part.userData.baseY || part.position.y;
      part.position.y = baseY + Math.sin(time * 0.9 + seed) * 1.4;
      part.rotation.y = Math.sin(time * 0.45 + seed) * 0.12;
      if (part.material && 'opacity' in part.material) {
        const baseOpacity = part.userData.baseOpacity ?? 0.2;
        part.material.opacity =
          baseOpacity +
          Math.sin(time * animation.veilPulseSpeed + seed) * animation.veilPulseAmplitude;
      }
    }

    if (part.userData.kind === 'heavenLightfall') {
      const seed = part.userData.floatSeed || 0;
      if (part.material && 'opacity' in part.material) {
        const baseOpacity = part.userData.baseOpacity ?? 0.18;
        part.material.opacity = baseOpacity + Math.sin(time * 1.1 + seed) * 0.08;
      }
      part.scale.x = 0.92 + Math.sin(time * 0.95 + seed) * 0.08;
    }

    if (part.userData.kind === 'heavenOrb') {
      const seed = part.userData.floatSeed || 0;
      const baseY = part.userData.baseY || part.position.y;
      part.position.y = baseY + Math.sin(time * 1.2 + seed) * 1.8;
      if (part.material && 'emissiveIntensity' in part.material) {
        const baseEmissive = part.userData.baseEmissive || 1.0;
        part.material.emissiveIntensity =
          baseEmissive +
          Math.sin(time * animation.orbPulseSpeed + seed) * animation.orbPulseAmplitude;
      }
    }

    if (part.userData.kind === 'heavenCloud') {
      const seed = part.userData.floatSeed || 0;
      const speed = part.userData.driftSpeed || 0.1;
      const xLimit = part.userData.xLimit || 300;
      const baseY = part.userData.baseY || part.position.y;

      part.position.x += speed;
      if (part.position.x > xLimit) {
        part.position.x = -xLimit;
      }

      part.position.y =
        baseY +
        Math.sin(time * animation.cloudFloatSpeed + seed) * animation.cloudFloatAmplitude;

      if (part.material && 'opacity' in part.material) {
        const baseOpacity = part.userData.baseOpacity || 0.25;
        part.material.opacity = baseOpacity + Math.sin(time * 1.4 + seed) * 0.08;
      }
    }

    if (part.userData.kind === 'heavenAurora') {
      const seed = part.userData.floatSeed || 0;
      const baseY = part.userData.baseY || part.position.y;
      const swayAmplitude = part.userData.swayAmplitude || auroraConfig.swayAmplitude;
      const xLimit = part.userData.xLimit || 280;
      const driftSpeed = part.userData.driftSpeed || 0.002;

      part.position.x += driftSpeed;
      if (part.position.x > xLimit) {
        part.position.x = -xLimit;
      }
      part.position.y = baseY + Math.sin(time * 0.7 + seed) * 4;
      part.rotation.z = Math.sin(time * 0.5 + seed) * 0.08;
      part.scale.x = 0.92 + Math.sin(time * 0.8 + seed) * 0.06;
      part.position.x += Math.sin(time * 0.6 + seed) * swayAmplitude * 0.01;

      if (part.material && 'opacity' in part.material) {
        const baseOpacity = part.userData.baseOpacity ?? auroraConfig.opacityBase;
        part.material.opacity =
          baseOpacity +
          Math.sin(time * animation.auroraPulseSpeed + seed) * animation.auroraPulseAmplitude;
      }
    }

    if (part.userData.kind === 'heavenMote') {
      const seed = part.userData.floatSeed || 0;
      const riseSpeed = part.userData.riseSpeed || 0.1;
      const top = part.userData.yTop || 220;
      const reset = part.userData.yReset || 60;
      const baseX = part.userData.baseX || part.position.x;
      const baseZ = part.userData.baseZ || part.position.z;

      part.position.y += riseSpeed;
      if (part.position.y > top) {
        part.position.y = reset;
      }
      part.position.x = baseX + Math.sin(time * 0.9 + seed) * 2.5;
      part.position.z = baseZ + Math.cos(time * 0.7 + seed) * 2.5;
      if (part.material && 'opacity' in part.material) {
        const baseOpacity = part.userData.baseOpacity ?? 0.5;
        part.material.opacity =
          baseOpacity +
          Math.sin(time * animation.moteTwinkleSpeed + seed) * animation.moteTwinkleAmplitude;
      }
    }

    if (part.userData.kind === 'heavenRoadCrown') {
      const seed = part.userData.pulseSeed || 0;
      if (part.material && 'emissiveIntensity' in part.material) {
        const baseEmissive = part.userData.baseEmissive || roadsideConfig.crownEmissiveIntensity;
        part.material.emissiveIntensity =
          baseEmissive +
          Math.sin(time * animation.roadsidePulseSpeed + seed) *
            animation.roadsidePulseAmplitude;
      }
      part.position.y += Math.sin(time * 1.1 + seed) * 0.04;
    }

    if (part.userData.kind === 'heavenRoadHalo') {
      const seed = part.userData.pulseSeed || 0;
      part.rotation.z += animation.haloSpin * 1.2;
      if (part.material && 'opacity' in part.material) {
        const baseOpacity = part.userData.baseOpacity || roadsideConfig.haloOpacity;
        part.material.opacity =
          baseOpacity +
          Math.sin(time * animation.roadsidePulseSpeed + seed) *
            animation.roadsidePulseAmplitude *
            0.6;
      }
    }

    if (part.userData.kind === 'heavenRoadWing') {
      const seed = part.userData.pulseSeed || 0;
      if (part.material && 'emissiveIntensity' in part.material) {
        const baseEmissive = part.userData.baseEmissive || roadsideConfig.wingEmissiveIntensity;
        part.material.emissiveIntensity =
          baseEmissive + Math.sin(time * 1.7 + seed) * animation.roadsidePulseAmplitude;
      }
      part.rotation.y = Math.sin(time * 0.9 + seed) * 0.12;
    }

    if (part.userData.kind === 'heavenRoadBanner') {
      const seed = part.userData.pulseSeed || 0;
      if (part.material && 'opacity' in part.material) {
        const baseOpacity = part.userData.baseOpacity || roadsideConfig.bannerOpacity;
        part.material.opacity =
          baseOpacity +
          Math.sin(time * animation.roadsidePulseSpeed * 0.9 + seed) *
            animation.roadsidePulseAmplitude *
            0.7;
      }
      part.rotation.z = Math.sin(time * 1.3 + seed) * 0.08;
    }

    if (part.userData.kind === 'heavenBridgeRail') {
      const seed = part.userData.pulseSeed || 0;
      if (part.material && 'opacity' in part.material) {
        const baseOpacity = part.userData.baseOpacity || 0.68;
        part.material.opacity =
          baseOpacity +
          Math.sin(time * animation.bannerPulseSpeed + seed) * animation.bannerPulseAmplitude;
      }
    }
  });
}
