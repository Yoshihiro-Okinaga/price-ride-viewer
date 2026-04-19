function createStars(deps) {
  const { THREE, CONFIG, getBackgroundMetrics } = deps;
  const starConfig = CONFIG.background.stars;
  const refactor = CONFIG.sceneRefactor.stars;
  const metrics = getBackgroundMetrics();

  const count = Math.max(
    starConfig.count,
    Math.ceil(metrics.depth / refactor.depthDivisor) +
      Math.ceil(metrics.width * refactor.widthMultiplier)
  );

  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3 + 0] =
      (Math.random() - 0.5) *
      Math.max(starConfig.rangeX, metrics.width * refactor.rangeXWidthMultiplier);

    positions[i * 3 + 1] =
      starConfig.minY +
      Math.random() *
        Math.max(
          starConfig.rangeY,
          metrics.maxY * refactor.rangeYHeightMultiplier + refactor.rangeYBasePadding
        );

    positions[i * 3 + 2] =
      -metrics.frontPad + Math.random() * (metrics.depth + metrics.backPad);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: refactor.color,
    size: starConfig.size * refactor.sizeMultiplier,
    sizeAttenuation: true,
    transparent: true,
    opacity: refactor.opacity,
    depthTest: true,
    depthWrite: false
  });

  return new THREE.Points(geo, mat);
}

function createNebulaBands(deps) {
  const { THREE, CONFIG, pseudoRandom, getArrayColor, getBackgroundMetrics } = deps;
  const metrics = getBackgroundMetrics();
  const refactor = CONFIG.sceneRefactor.nebulaBands;
  const group = new THREE.Group();

  const startZ = refactor.startZ;
  const endZ = metrics.depth + refactor.endZPadding;
  const spacing = refactor.spacing;
  const count = Math.max(refactor.minCount, Math.ceil((endZ - startZ) / spacing));

  for (let i = 0; i < count; i++) {
    const scale =
      refactor.scaleBase +
      pseudoRandom(i + 200) * refactor.scaleRandomMultiplier +
      metrics.heightFactor * refactor.scaleHeightFactorMultiplier;

    const geo = new THREE.PlaneGeometry(
      (refactor.baseWidth + (i % refactor.widthVariants) * refactor.widthStep) * scale,
      (refactor.baseHeight + (i % refactor.heightVariants) * refactor.heightStep) * scale
    );

    const color = getArrayColor(refactor.colors, i, 0xffffff);

    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity:
        refactor.baseOpacity + (i % refactor.opacityVariants) * refactor.opacityStep,
      depthTest: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      (pseudoRandom(i + 101) - 0.5) *
        Math.max(refactor.rangeXMin, metrics.width * refactor.rangeXWidthMultiplier),
      refactor.baseY +
        pseudoRandom(i + 102) *
          (metrics.maxY * refactor.yHeightMultiplier + refactor.yBasePadding),
      startZ + i * spacing
    );
    mesh.rotation.x =
      refactor.rotationXBase - pseudoRandom(i + 103) * refactor.rotationXRandomMultiplier;
    mesh.rotation.y = (pseudoRandom(i + 104) - 0.5) * refactor.rotationYRange;
    mesh.rotation.z = (pseudoRandom(i + 105) - 0.5) * refactor.rotationZRange;

    group.add(mesh);
  }

  return group;
}

function createSpaceOrbs(deps) {
  const { THREE, CONFIG, pseudoRandom, getArrayColor, getBackgroundMetrics } = deps;
  const metrics = getBackgroundMetrics();
  const refactor = CONFIG.sceneRefactor.spaceOrbs;
  const group = new THREE.Group();
  const count = Math.max(refactor.minCount, Math.ceil(metrics.depth / refactor.countDepthDivisor));

  for (let i = 0; i < count; i++) {
    const radius =
      refactor.baseRadius +
      pseudoRandom(i + 500) * refactor.radiusRandomMultiplier +
      metrics.heightFactor * refactor.radiusHeightFactorMultiplier;

    const geo = new THREE.SphereGeometry(radius, 20, 20);
    const mat = new THREE.MeshBasicMaterial({
      color: getArrayColor(refactor.colors, i, 0xffffff),
      transparent: true,
      opacity: refactor.baseOpacity + pseudoRandom(i + 501) * refactor.opacityRandomMultiplier
    });

    const orb = new THREE.Mesh(geo, mat);
    orb.position.set(
      (pseudoRandom(i + 502) - 0.5) *
        Math.max(refactor.rangeXMin, metrics.width * refactor.rangeXWidthMultiplier),
      refactor.baseY +
        pseudoRandom(i + 503) *
          (metrics.maxY * refactor.yHeightMultiplier + refactor.yBasePadding),
      refactor.startZ + i * (metrics.depth / Math.max(1, count - 1))
    );
    orb.userData.floatSeed = i;
    orb.userData.kind = 'spaceOrb';
    group.add(orb);
  }

  return group;
}

function createRingPlanet(index, z, x, y, scale, deps) {
  const { THREE, CONFIG } = deps;
  const refactor = CONFIG.sceneRefactor.spacePlanets;
  const group = new THREE.Group();

  const planetRadius = refactor.planetRadius * scale;
  const planetGeo = new THREE.SphereGeometry(
    planetRadius,
    refactor.planetWidthSegments,
    refactor.planetHeightSegments
  );
  const planetMat = new THREE.MeshLambertMaterial({
    color: index % 2 === 0 ? 0x7cd8ff : 0xcba8ff,
    emissive: index % 2 === 0 ? 0x16334a : 0x2d1742,
    emissiveIntensity: refactor.emissiveIntensity
  });
  const planet = new THREE.Mesh(planetGeo, planetMat);
  group.add(planet);

  const ringGeo = new THREE.TorusGeometry(
    planetRadius * refactor.ringRadiusMultiplier,
    planetRadius * refactor.ringTubeMultiplier,
    refactor.ringTubeSegments,
    refactor.ringRadialSegments
  );
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xf8ffff,
    transparent: true,
    opacity: refactor.ringOpacity
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = refactor.ringRotationX;
  ring.rotation.y = refactor.ringRotationY;
  group.add(ring);

  group.position.set(x, y, z);
  group.userData.kind = 'spacePlanet';
  group.userData.spinSpeed = refactor.spinBase + index * refactor.spinStep;

  return group;
}

function createSpacePlanets(deps) {
  const { THREE, CONFIG, pseudoRandom, getBackgroundMetrics } = deps;
  const metrics = getBackgroundMetrics();
  const refactor = CONFIG.sceneRefactor.spacePlanets;
  const group = new THREE.Group();
  const count = Math.max(refactor.minCount, Math.ceil(metrics.depth / refactor.countDepthDivisor));

  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const x =
      side *
      Math.max(
        refactor.xMin,
        metrics.width *
          (refactor.xWidthMultiplierBase +
            (i % 2) * refactor.xWidthMultiplierAlternating)
      );
    const y =
      refactor.baseY +
      pseudoRandom(i + 620) *
        (metrics.maxY * refactor.yHeightMultiplier + refactor.yBasePadding);
    const z = refactor.startZ + i * refactor.zSpacing;
    const scale =
      refactor.scaleBase +
      pseudoRandom(i + 621) * refactor.scaleRandomMultiplier +
      metrics.heightFactor * refactor.scaleHeightFactorMultiplier;

    group.add(createRingPlanet(i, z, x, y, scale, deps));
  }

  return group;
}

function createCrystalCluster(deps) {
  const { THREE, CONFIG, pseudoRandom, getBackgroundMetrics } = deps;
  const metrics = getBackgroundMetrics();
  const refactor = CONFIG.sceneRefactor.crystals;
  const group = new THREE.Group();
  const count = Math.max(refactor.minCount, Math.ceil(metrics.depth / refactor.laneSpacing));

  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const height =
      refactor.baseHeight +
      pseudoRandom(i + 710) * refactor.heightRandomMultiplier +
      metrics.heightFactor * refactor.heightFactorMultiplier;
    const radius =
      refactor.baseRadius + pseudoRandom(i + 711) * refactor.radiusRandomMultiplier;

    const geo = new THREE.ConeGeometry(radius, height, refactor.radialSegments);
    const mat = new THREE.MeshLambertMaterial({
      color: i % 2 === 0 ? 0x8ef8ff : 0xf4a4ff,
      emissive: i % 2 === 0 ? 0x144f55 : 0x4a143e,
      emissiveIntensity: refactor.emissiveIntensity,
      transparent: true,
      opacity: refactor.opacity
    });

    const crystal = new THREE.Mesh(geo, mat);
    crystal.position.set(
      side *
        Math.max(
          refactor.xMin,
          metrics.width *
            (refactor.xWidthMultiplierBase +
              pseudoRandom(i + 712) * refactor.xWidthMultiplierRandom)
        ),
      height / 2 - refactor.baseYAdjustment,
      refactor.startZ + i * refactor.laneSpacing
    );
    crystal.rotation.y = pseudoRandom(i + 713) * Math.PI * 2;
    group.add(crystal);
  }

  return group;
}

export function createSpaceBackgroundLayers(deps) {
  return {
    stars: createStars(deps),
    nebula: createNebulaBands(deps),
    orbs: createSpaceOrbs(deps),
    planets: createSpacePlanets(deps),
    crystals: createCrystalCluster(deps)
  };
}
