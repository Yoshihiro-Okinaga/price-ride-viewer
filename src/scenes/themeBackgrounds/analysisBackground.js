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

  const panelGeometry = new THREE.PlaneGeometry(panelWidth, panelHeight);
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  const position = new THREE.Vector3();

  const buckets = {
    evenStrong: [],
    evenWeak: [],
    oddStrong: [],
    oddWeak: []
  };

  for (let zi = 0; zi < zCount; zi++) {
    const z = refactor.zStart + zi * refactor.zSpacing;

    for (let yi = 0; yi < layerCount; yi++) {
      position.set(0, yi * layerSpacingY, z);
      matrix.compose(position, quaternion, scale);

      const isEvenColor = (yi + zi) % 2 === 0;
      const isStrongOpacity = yi % 3 === 0;

      if (isEvenColor && isStrongOpacity) {
        buckets.evenStrong.push(matrix.clone());
      } else if (isEvenColor && !isStrongOpacity) {
        buckets.evenWeak.push(matrix.clone());
      } else if (!isEvenColor && isStrongOpacity) {
        buckets.oddStrong.push(matrix.clone());
      } else {
        buckets.oddWeak.push(matrix.clone());
      }
    }
  }

  const bucketConfigs = [
    { key: 'evenStrong', color: 0xdde7ff, opacity: refactor.strongOpacity },
    { key: 'evenWeak', color: 0xdde7ff, opacity: refactor.weakOpacity },
    { key: 'oddStrong', color: 0xffffff, opacity: refactor.strongOpacity },
    { key: 'oddWeak', color: 0xffffff, opacity: refactor.weakOpacity }
  ];

  for (const config of bucketConfigs) {
    const matrices = buckets[config.key];
    if (matrices.length === 0) {
      continue;
    }

    const material = new THREE.MeshBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: config.opacity,
      depthWrite: false
    });

    const instances = new THREE.InstancedMesh(
      panelGeometry,
      material,
      matrices.length
    );
    instances.instanceMatrix.setUsage(THREE.StaticDrawUsage);

    for (let i = 0; i < matrices.length; i++) {
      instances.setMatrixAt(i, matrices[i]);
    }

    instances.instanceMatrix.needsUpdate = true;
    group.add(instances);
  }

  return group;
}
