export function animateAmusementChild(child, config) {
  const spinStep = config.sceneRefactor.amusement.animation.spinStep;
  for (const part of child.children) {
    if (part.userData.spin) {
      part.rotation.z += spinStep;
    }
  }
}
