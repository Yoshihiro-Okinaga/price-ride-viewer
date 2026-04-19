export function animateNebulaChild(child, config) {
  const animCfg = config.sceneRefactor.animation;
  for (let i = 0; i < child.children.length; i++) {
    child.children[i].rotation.z +=
      config.background.nebula.spinSpeed *
      animCfg.nebulaSpinMultiplier *
      (i % 2 === 0 ? 1 : -1);
  }
}

export function animateSpaceOrbsChild(child, config) {
  const animCfg = config.sceneRefactor.animation;
  for (let i = 0; i < child.children.length; i++) {
    const orb = child.children[i];
    const seed = orb.userData.floatSeed || i;
    orb.position.y +=
      Math.sin(performance.now() * animCfg.orbFloatTimeMultiplier + seed) *
      animCfg.orbFloatAmplitude;
  }
}

export function animateSpacePlanetsChild(child, config) {
  const fallbackSpin = config.sceneRefactor.animation.planetFallbackSpin;
  for (const part of child.children) {
    if (part.userData.kind === 'spacePlanet') {
      part.rotation.y += part.userData.spinSpeed || fallbackSpin;
    }
  }
}
