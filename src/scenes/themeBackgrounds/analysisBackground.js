export function createAnalysisBackdrop({ THREE, CONFIG, getBackgroundMetrics }) {
  const group = new THREE.Group();
  const metrics = getBackgroundMetrics();
  const refactor = CONFIG.sceneRefactor.analysis;

  const panelWidth = Math.max(refactor.panelWidthMin, metrics.width * refactor.panelWidthMultiplier);
  const panelHeight = Math.max(
    refactor.panelHeightMin,
    Math.min(
      refactor.panelHeightMax,
      refactor.panelHeightBase +
        metrics.heightFactor * refactor.panelHeightHeightFactorMultiplier
    )
  );

  const layerSpacingY = Math.max(
    refactor.layerSpacingYMin,
    Math.min(
      refactor.layerSpacingYMax,
      metrics.maxY / refactor.layerSpacingYMaxYDivisor +
        metrics.heightFactor * refactor.layerSpacingYHeightFactorMultiplier
    )
  );

  const layerCount = Math.max(
    refactor.layerCountMin,
    Math.ceil((metrics.maxY + refactor.layerCountYPadding) / layerSpacingY)
  );

  const zCount = Math.max(
    refactor.zCountMin,
    Math.ceil((metrics.depth + refactor.zCountDepthPadding) / refactor.zSpacing)
  );

  for (let zi = 0; zi < zCount; zi++) {
    const z = refactor.zStart + zi * refactor.zSpacing;

    for (let yi = 0; yi < layerCount; yi++) {
      const geo = new THREE.PlaneGeometry(panelWidth, panelHeight);
      const mat = new THREE.MeshBasicMaterial({
        color: (yi + zi) % 2 === 0 ? 0xdde7ff : 0xffffff,
        transparent: true,
        opacity: yi % 3 === 0 ? refactor.strongOpacity : refactor.weakOpacity,
        depthWrite: false
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, yi * layerSpacingY, z);
      group.add(mesh);
    }
  }

  return group;
}
