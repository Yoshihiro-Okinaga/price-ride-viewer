import * as THREE from 'https://unpkg.com/three@0.183.0/build/three.module.js';

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
    const orbObject = child.children[i];

    if (orbObject.isInstancedMesh) {
      const orbMeta = orbObject.userData.orbMeta || [];
      const matrix = new THREE.Matrix4();
      for (let instIdx = 0; instIdx < orbObject.count; instIdx++) {
        orbObject.getMatrixAt(instIdx, matrix);
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        matrix.decompose(position, quaternion, scale);

        const seed = orbMeta[instIdx]?.seed || instIdx;
        position.y +=
          Math.sin(performance.now() * animCfg.orbFloatTimeMultiplier + seed) *
          animCfg.orbFloatAmplitude;

        matrix.compose(position, quaternion, scale);
        orbObject.setMatrixAt(instIdx, matrix);
      }
      orbObject.instanceMatrix.needsUpdate = true;
    } else {
      const orb = orbObject;
      const seed = orb.userData.floatSeed || i;
      orb.position.y +=
        Math.sin(performance.now() * animCfg.orbFloatTimeMultiplier + seed) *
        animCfg.orbFloatAmplitude;
    }
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
