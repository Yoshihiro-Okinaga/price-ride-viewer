function createCityBuilding(index, z, side, xOffset, heightFactor, deps) {
  const { THREE, CONFIG, pseudoRandom } = deps;
  const refactor = CONFIG.sceneRefactor.cityNight.building;
  const group = new THREE.Group();

  const width = refactor.widthBase + pseudoRandom(index + 1000) * refactor.widthRandomMultiplier;
  const depth = refactor.depthBase + pseudoRandom(index + 1001) * refactor.depthRandomMultiplier;
  const height =
    refactor.heightBase +
    pseudoRandom(index + 1002) *
      (refactor.heightRandomBase + heightFactor * refactor.heightRandomHeightFactorMultiplier);

  const bodyGeo = new THREE.BoxGeometry(width, height, depth);
  const bodyMat = new THREE.MeshLambertMaterial({
    color: index % 3 === 0 ? 0x1a1f2e : (index % 3 === 1 ? 0x101827 : 0x202636),
    emissive: 0x06080d,
    emissiveIntensity: refactor.emissiveIntensity
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = height / 2;
  group.add(body);

  const cols = Math.max(refactor.colsMin, Math.floor(width / refactor.colsWidthDivisor));
  const rows = Math.max(refactor.rowsMin, Math.floor(height / refactor.rowsHeightDivisor));
  const windowByColor = [[], [], []];

  const getWindowColorIndex = (warm) => {
    if (warm < 0.5) {
      return 0;
    }

    if (warm < 0.8) {
      return 1;
    }

    return 2;
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (pseudoRandom(index * 200 + r * 31 + c * 17) < refactor.windowSkipThreshold) {
        continue;
      }

      const warm = pseudoRandom(index * 300 + r * 11 + c * 7);
      const colorIndex = getWindowColorIndex(warm);

      const xPos =
        -width / 2 +
        refactor.windowInsetX +
        c * ((width - refactor.windowInsetX * 2) / Math.max(1, cols - 1));
      const yPos =
        refactor.windowInsetY +
        r * ((height - refactor.windowInsetY * 2) / Math.max(1, rows - 1));

      windowByColor[colorIndex].push({
        x: xPos,
        y: yPos,
        zFront: depth / 2 + refactor.windowInsetZ,
        zBack: -depth / 2 - refactor.windowInsetZ
      });
    }
  }

  const windowGeometry = new THREE.PlaneGeometry(
    refactor.windowWidth,
    refactor.windowHeight
  );
  const windowMaterials = [
    new THREE.MeshBasicMaterial({
      color: 0xffd77a,
      transparent: true,
      opacity: refactor.windowOpacity
    }),
    new THREE.MeshBasicMaterial({
      color: 0x9fd3ff,
      transparent: true,
      opacity: refactor.windowOpacity
    }),
    new THREE.MeshBasicMaterial({
      color: 0xff9ecf,
      transparent: true,
      opacity: refactor.windowOpacity
    })
  ];

  const position = new THREE.Vector3();
  const scale = new THREE.Vector3(1, 1, 1);
  const frontQuaternion = new THREE.Quaternion();
  const backQuaternion = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 1, 0),
    Math.PI
  );
  const matrix = new THREE.Matrix4();

  for (let colorIndex = 0; colorIndex < windowByColor.length; colorIndex++) {
    const windows = windowByColor[colorIndex];

    if (windows.length === 0) {
      continue;
    }

    const frontInstances = new THREE.InstancedMesh(
      windowGeometry,
      windowMaterials[colorIndex],
      windows.length
    );
    frontInstances.instanceMatrix.setUsage(THREE.StaticDrawUsage);

    const backInstances = new THREE.InstancedMesh(
      windowGeometry,
      windowMaterials[colorIndex],
      windows.length
    );
    backInstances.instanceMatrix.setUsage(THREE.StaticDrawUsage);

    for (let i = 0; i < windows.length; i++) {
      const windowPos = windows[i];

      position.set(windowPos.x, windowPos.y, windowPos.zFront);
      matrix.compose(position, frontQuaternion, scale);
      frontInstances.setMatrixAt(i, matrix);

      position.set(windowPos.x, windowPos.y, windowPos.zBack);
      matrix.compose(position, backQuaternion, scale);
      backInstances.setMatrixAt(i, matrix);
    }

    frontInstances.instanceMatrix.needsUpdate = true;
    backInstances.instanceMatrix.needsUpdate = true;
    group.add(frontInstances);
    group.add(backInstances);
  }

  if (pseudoRandom(index + 1003) > refactor.antennaThreshold) {
    const antennaHeight =
      refactor.antennaHeightBase +
      pseudoRandom(index + 1004) * refactor.antennaHeightRandomMultiplier;

    const antennaGeo = new THREE.CylinderGeometry(
      refactor.antennaRadiusTop,
      refactor.antennaRadiusBottom,
      antennaHeight,
      refactor.antennaRadialSegments
    );
    const antennaMat = new THREE.MeshLambertMaterial({ color: 0xaab4c8 });
    const antenna = new THREE.Mesh(antennaGeo, antennaMat);
    antenna.position.set(0, height + antennaHeight / 2, 0);
    group.add(antenna);

    const beaconGeo = new THREE.SphereGeometry(
      refactor.beaconRadius,
      refactor.beaconWidthSegments,
      refactor.beaconHeightSegments
    );
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff4d6d });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, height + antennaHeight + refactor.beaconYOffset, 0);
    group.add(beacon);
  }

  group.position.set(side * xOffset, 0, z);
  return group;
}

function createStreetLampInstances(lamps, heightFactor, deps) {
  const { THREE, CONFIG, pseudoRandom } = deps;
  const refactor = CONFIG.sceneRefactor.cityNight.streetLamp;
  const lampGroup = new THREE.Group();

  if (lamps.length === 0) {
    return lampGroup;
  }

  const poleGeometry = new THREE.CylinderGeometry(
    refactor.poleRadiusTop,
    refactor.poleRadiusBottom,
    1,
    refactor.poleRadialSegments
  );
  const poleMaterial = new THREE.MeshLambertMaterial({ color: 0xb8c2d6 });
  const poleInstances = new THREE.InstancedMesh(
    poleGeometry,
    poleMaterial,
    lamps.length
  );
  poleInstances.instanceMatrix.setUsage(THREE.StaticDrawUsage);

  const headGeometry = new THREE.SphereGeometry(
    refactor.headRadius,
    refactor.headWidthSegments,
    refactor.headHeightSegments
  );
  const headMaterial = new THREE.MeshBasicMaterial({ color: 0xffd58a });
  const headInstances = new THREE.InstancedMesh(
    headGeometry,
    headMaterial,
    lamps.length
  );
  headInstances.instanceMatrix.setUsage(THREE.StaticDrawUsage);

  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const poleScale = new THREE.Vector3(1, 1, 1);
  const headScale = new THREE.Vector3(1, 1, 1);

  for (let i = 0; i < lamps.length; i++) {
    const lamp = lamps[i];
    const x = lamp.side * lamp.xOffset;

    const poleHeight =
      refactor.poleHeightBase +
      pseudoRandom(lamp.index + 1400) * refactor.poleHeightRandomMultiplier +
      heightFactor * refactor.poleHeightFactorMultiplier;

    position.set(x, poleHeight / 2, lamp.z);
    poleScale.set(1, poleHeight, 1);
    matrix.compose(position, quaternion, poleScale);
    poleInstances.setMatrixAt(i, matrix);

    position.set(x, poleHeight + refactor.headYOffset, lamp.z);
    matrix.compose(position, quaternion, headScale);
    headInstances.setMatrixAt(i, matrix);
  }

  poleInstances.instanceMatrix.needsUpdate = true;
  headInstances.instanceMatrix.needsUpdate = true;
  lampGroup.add(poleInstances);
  lampGroup.add(headInstances);

  return lampGroup;
}

export function createCityNightScenery(deps) {
  const { THREE, CONFIG, pseudoRandom, getBackgroundMetrics } = deps;
  const group = new THREE.Group();
  const metrics = getBackgroundMetrics();
  const refactor = CONFIG.sceneRefactor.cityNight.scenery;
  const lampEntries = [];

  const laneCount = Math.max(
    refactor.laneCountMin,
    Math.ceil((metrics.depth + refactor.laneCountDepthPadding) / refactor.laneSpacing)
  );
  const baseX = Math.max(refactor.baseXMin, metrics.width * refactor.baseXWidthMultiplier);
  const lampX = Math.max(refactor.lampXMin, metrics.width * refactor.lampXWidthMultiplier);

  for (let i = 0; i < laneCount; i++) {
    const z = refactor.laneStartZ + i * refactor.laneSpacing;

    const leftX = baseX + pseudoRandom(i + 1500) * refactor.leftXRandomMultiplier;
    const rightX = baseX + pseudoRandom(i + 1600) * refactor.rightXRandomMultiplier;

    group.add(createCityBuilding(i * 2, z, -1, leftX, metrics.heightFactor, deps));
    group.add(
      createCityBuilding(
        i * 2 + 1,
        z + refactor.rightBuildingZOffset,
        1,
        rightX,
        metrics.heightFactor,
        deps
      )
    );

    if (i % refactor.lampEvery === 0) {
      lampEntries.push({
        index: i * 2,
        z: z + refactor.leftLampZOffset,
        side: -1,
        xOffset: lampX
      });
      lampEntries.push({
        index: i * 2 + 1,
        z: z + refactor.rightLampZOffset,
        side: 1,
        xOffset: lampX
      });
    }
  }

  group.add(createStreetLampInstances(lampEntries, metrics.heightFactor, deps));

  return group;
}
