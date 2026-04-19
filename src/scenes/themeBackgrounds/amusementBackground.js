function createAmusementLightPole(index, side, z, xOffset, heightFactor, deps) {
  const { THREE, CONFIG, pseudoRandom, getArrayColor } = deps;
  const refactor = CONFIG.sceneRefactor.amusement.lightPole;
  const poleGroup = new THREE.Group();

  const randA = pseudoRandom(
    index * refactor.randAMultiplier +
      (side < 0 ? refactor.leftSeedOffsetA : refactor.rightSeedOffsetA)
  );
  const randB = pseudoRandom(
    index * refactor.randBMultiplier +
      (side < 0 ? refactor.leftSeedOffsetB : refactor.rightSeedOffsetB)
  );

  const baseHeight = refactor.baseHeight + heightFactor * refactor.heightFactorMultiplier;
  const randomScale = refactor.randomScaleBase + randA * refactor.randomScaleMultiplier;
  const sideBias = side < 0 ? refactor.leftSideBias : refactor.rightSideBias;

  let poleHeight = baseHeight * randomScale * sideBias;
  poleHeight = Math.max(
    refactor.minPoleHeight,
    Math.min(
      poleHeight,
      refactor.maxPoleHeightBase + heightFactor * refactor.maxPoleHeightHeightFactor
    )
  );

  const bulbRadius = Math.max(
    refactor.minBulbRadius,
    Math.min(
      refactor.maxBulbRadius,
      refactor.bulbRadiusBase +
        heightFactor * refactor.bulbRadiusHeightFactor +
        randB * refactor.bulbRadiusRandomMultiplier
    )
  );

  const poleGeo = new THREE.CylinderGeometry(
    refactor.poleRadiusTop,
    refactor.poleRadiusBottom,
    poleHeight,
    refactor.poleRadialSegments
  );
  const poleMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = poleHeight / 2;
  poleGroup.add(pole);

  const bulbGeo = new THREE.SphereGeometry(
    bulbRadius,
    refactor.bulbWidthSegments,
    refactor.bulbHeightSegments
  );
  const bulbMat = new THREE.MeshBasicMaterial({
    color: getArrayColor(refactor.bulbColors, index, 0xffffff)
  });
  const bulb = new THREE.Mesh(bulbGeo, bulbMat);
  bulb.position.y = poleHeight + bulbRadius * refactor.bulbYOffsetMultiplier;
  poleGroup.add(bulb);

  poleGroup.position.set(side * xOffset, 0, z);
  return poleGroup;
}

function createTent(index, side, z, xOffset, heightFactor, deps) {
  const { THREE, CONFIG, getArrayColor } = deps;
  const refactor = CONFIG.sceneRefactor.amusement.tent;
  const tentGroup = new THREE.Group();
  const scale = refactor.scaleBase + heightFactor * refactor.scaleHeightFactorMultiplier;

  const baseGeo = new THREE.BoxGeometry(
    refactor.baseWidth * scale,
    refactor.baseHeight * scale,
    refactor.baseDepth * scale
  );
  const baseMat = new THREE.MeshLambertMaterial({
    color: getArrayColor(refactor.baseColors, index, 0xffffff)
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = refactor.baseYOffset * scale;
  tentGroup.add(base);

  const roofGeo = new THREE.ConeGeometry(
    refactor.roofRadius * scale,
    refactor.roofHeight * scale,
    refactor.roofRadialSegments
  );
  const roofMat = new THREE.MeshLambertMaterial({
    color: getArrayColor(refactor.roofColors, index, 0xff00ff)
  });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = refactor.roofYOffset * scale;
  roof.rotation.y = refactor.roofRotationY;
  tentGroup.add(roof);

  tentGroup.position.set(side * xOffset, 0, z);
  return tentGroup;
}

function createFerrisWheel(z, x, heightFactor, deps) {
  const { THREE, CONFIG } = deps;
  const refactor = CONFIG.sceneRefactor.amusement.ferrisWheel;
  const wheelGroup = new THREE.Group();

  const radius = refactor.baseRadius + heightFactor * refactor.radiusHeightFactorMultiplier;
  const tube = refactor.baseTube + heightFactor * refactor.tubeHeightFactorMultiplier;
  const standHeight =
    refactor.baseStandHeight + heightFactor * refactor.standHeightFactorMultiplier;

  const ringGeo = new THREE.TorusGeometry(
    radius,
    tube,
    refactor.ringRadialSegments,
    refactor.ringTubularSegments
  );
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.y = Math.PI / 2;
  wheelGroup.add(ring);

  for (let i = 0; i < refactor.spokeCount; i++) {
    const angle = (i / refactor.spokeCount) * Math.PI * 2;
    const spokeGeo = new THREE.CylinderGeometry(
      refactor.spokeRadiusTop,
      refactor.spokeRadiusBottom,
      radius * refactor.spokeLengthMultiplier,
      refactor.spokeRadialSegments
    );
    const spokeMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const spoke = new THREE.Mesh(spokeGeo, spokeMat);
    spoke.rotation.z = Math.PI / 2;
    spoke.rotation.y = angle;
    wheelGroup.add(spoke);
  }

  const standGeo = new THREE.BoxGeometry(
    refactor.standWidth,
    refactor.standHeight,
    refactor.standDepth
  );
  const standMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
  const stand = new THREE.Mesh(standGeo, standMat);
  stand.position.y = -(radius + standHeight * refactor.standOffsetMultiplier);
  wheelGroup.add(stand);

  wheelGroup.position.set(x, radius + refactor.wheelYBaseOffset, z);
  wheelGroup.userData.spin = true;

  return wheelGroup;
}

export function createAmusementSkyline(deps) {
  const { THREE, CONFIG, getBackgroundMetrics } = deps;
  const group = new THREE.Group();
  const metrics = getBackgroundMetrics();
  const refactor = CONFIG.sceneRefactor.amusement.skyline;

  const sideX = Math.max(refactor.sideXMin, metrics.width * refactor.sideXWidthMultiplier);
  const laneCount = Math.max(
    refactor.laneCountMin,
    Math.ceil((metrics.depth + refactor.laneCountDepthPadding) / refactor.laneSpacing)
  );

  for (let lane = 0; lane < laneCount; lane++) {
    const z = refactor.laneStartZ + lane * refactor.laneSpacing;

    group.add(createAmusementLightPole(lane * 2, -1, z, sideX, metrics.heightFactor, deps));
    group.add(createAmusementLightPole(lane * 2 + 1, 1, z, sideX, metrics.heightFactor, deps));

    if (lane % refactor.leftTentEvery === 0) {
      group.add(
        createTent(
          lane,
          -1,
          z + refactor.leftTentZOffset,
          sideX + refactor.leftTentXOffset,
          metrics.heightFactor,
          deps
        )
      );
    }

    if (lane % refactor.rightTentModulo === refactor.rightTentModuloMatch) {
      group.add(
        createTent(
          lane + 100,
          1,
          z + refactor.rightTentZOffset,
          sideX + refactor.rightTentXOffset,
          metrics.heightFactor,
          deps
        )
      );
    }
  }

  const wheelCount = Math.max(
    refactor.wheelCountMin,
    Math.ceil((metrics.depth + refactor.wheelCountDepthPadding) / refactor.wheelSpacing)
  );

  for (let i = 0; i < wheelCount; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const x = side * Math.max(refactor.wheelXMin, metrics.width * refactor.wheelXWidthMultiplier);
    const z = refactor.wheelStartZ + i * refactor.wheelSpacing;
    group.add(createFerrisWheel(z, x, metrics.heightFactor, deps));
  }

  return group;
}
