function createFutureTower(seed, z, side, baseX, heightFactor, futureConfig, deps) {
  const { THREE, CONFIG, pseudoRandom, getArrayColor } = deps;
  const group = new THREE.Group();
  const towerConfig = futureConfig.tower;
  const beaconConfig = futureConfig.beacon;

  const width = towerConfig.widthBase + ((seed * 17) % towerConfig.widthRandom);
  const depth = towerConfig.depthBase + ((seed * 13) % towerConfig.depthRandom);
  const height =
    towerConfig.heightBase +
    ((seed * 29) % towerConfig.heightRandom) +
    heightFactor * towerConfig.heightFactorMultiplier;

  const x = side * (baseX + ((seed * 19) % towerConfig.xJitter));

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({
      color: towerConfig.bodyColor,
      emissive: towerConfig.bodyEmissive,
      emissiveIntensity: towerConfig.bodyEmissiveIntensity,
      metalness: 0.85,
      roughness: 0.35
    })
  );
  body.position.set(x, height * 0.5, z);
  group.add(body);

  const windowMat = new THREE.MeshBasicMaterial({
    color: getArrayColor(towerConfig.windowColors, seed, 0x55dfff),
    transparent: true,
    opacity: towerConfig.windowOpacity
  });

  const cols = Math.max(2, Math.floor(width / 12));
  const rows = Math.max(6, Math.floor(height / 18));
  const windowPositions = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const randomGate = pseudoRandom(seed * 0.13 + row * 0.31 + col * 0.73);
      if (randomGate > towerConfig.windowSkipThreshold) continue;

      windowPositions.push(new THREE.Vector3(
        x - width * 0.5 + 8 + col * ((width - 16) / Math.max(1, cols - 1)),
        10 + row * ((height - 20) / Math.max(1, rows - 1)),
        z + depth * 0.5 + 0.2
      ));
    }
  }

  if (windowPositions.length > 0) {
    const windowGeometry = new THREE.PlaneGeometry(4.5, 6.5);
    const windows = new THREE.InstancedMesh(
      windowGeometry,
      windowMat,
      windowPositions.length
    );
    windows.instanceMatrix.setUsage(THREE.StaticDrawUsage);

    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);
    for (let i = 0; i < windowPositions.length; i++) {
      matrix.compose(windowPositions[i], quaternion, scale);
      windows.setMatrixAt(i, matrix);
    }

    windows.instanceMatrix.needsUpdate = true;
    group.add(windows);
  }

  const rooftopRing = new THREE.Mesh(
    new THREE.TorusGeometry(Math.max(width, depth) * 0.18, 0.45, 8, 18),
    new THREE.MeshStandardMaterial({
      color: towerConfig.rooftopRingColor,
      emissive: towerConfig.rooftopRingEmissive,
      emissiveIntensity: towerConfig.rooftopRingEmissiveIntensity,
      transparent: true,
      opacity: 0.92
    })
  );
  rooftopRing.rotation.x = Math.PI * 0.5;
  rooftopRing.position.set(x, height + 6, z);
  rooftopRing.userData.kind = 'futureRooftopRing';
  rooftopRing.userData.pulseSeed = seed * 0.41;
  group.add(rooftopRing);

  const crown = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 0.9, 18 + (seed % 20), 6),
    new THREE.MeshStandardMaterial({
      color: towerConfig.crownColor,
      emissive: towerConfig.crownEmissive,
      emissiveIntensity: towerConfig.crownEmissiveIntensity
    })
  );
  crown.position.set(x, height + 10, z);
  group.add(crown);

  const beaconColor = getArrayColor(beaconConfig.colors, seed, 0x44d8ff);
  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(2.6, 10, 10),
    new THREE.MeshBasicMaterial({
      color: beaconColor,
      transparent: true,
      opacity: beaconConfig.baseOpacity
    })
  );
  beacon.position.set(x, height + 20, z);
  beacon.userData.kind = 'futureBeacon';
  beacon.userData.blinkSeed = seed * 0.37;
  beacon.userData.baseOpacity = beaconConfig.baseOpacity;
  group.add(beacon);

  const beaconHalo = new THREE.Mesh(
    new THREE.SphereGeometry(5.8, 8, 8),
    new THREE.MeshBasicMaterial({
      color: beaconColor,
      transparent: true,
      opacity: 0.24,
      depthWrite: false
    })
  );
  beaconHalo.position.copy(beacon.position);
  beaconHalo.userData.kind = 'futureBeaconHalo';
  beaconHalo.userData.blinkSeed = seed * 0.37 + 0.6;
  beaconHalo.userData.baseOpacity = 0.24;
  group.add(beaconHalo);

  return group;
}

function createSkyBridge(seed, z, halfSpan, futureConfig, deps) {
  const { THREE } = deps;
  const group = new THREE.Group();
  const bridgeConfig = futureConfig.bridge;

  const beam = new THREE.Mesh(
    new THREE.BoxGeometry(halfSpan * 2, 6, 10),
    new THREE.MeshStandardMaterial({
      color: bridgeConfig.beamColor,
      emissive: bridgeConfig.beamEmissive,
      emissiveIntensity: bridgeConfig.beamEmissiveIntensity,
      metalness: 0.8,
      roughness: 0.35
    })
  );
  beam.position.set(0, bridgeConfig.y, z);
  group.add(beam);

  const railMat = new THREE.MeshBasicMaterial({ color: bridgeConfig.railColor });
  const rail1 = new THREE.Mesh(new THREE.BoxGeometry(halfSpan * 2, 1, 1), railMat);
  rail1.position.set(0, bridgeConfig.y + 3.5, z + 4);
  group.add(rail1);

  const rail2 = rail1.clone();
  rail2.position.z = z - 4;
  group.add(rail2);

  const stripColor = seed % 2 === 0 ? bridgeConfig.stripColorA : bridgeConfig.stripColorB;
  const stripMat = new THREE.MeshBasicMaterial({
    color: stripColor,
    transparent: true,
    opacity: bridgeConfig.stripOpacity
  });

  const strip1 = new THREE.Mesh(new THREE.BoxGeometry(halfSpan * 2, 0.45, 0.9), stripMat);
  strip1.position.set(0, bridgeConfig.y - 2.2, z + 4.6);
  strip1.userData.kind = 'futureBridgeStrip';
  strip1.userData.pulseSeed = seed * 0.19;
  strip1.userData.baseOpacity = bridgeConfig.stripOpacity;
  group.add(strip1);

  const strip2 = strip1.clone();
  strip2.position.z = z - 4.6;
  strip2.userData.pulseSeed = seed * 0.19 + 0.8;
  group.add(strip2);

  return group;
}

function createHoverLane(seed, z, halfSpan, futureConfig, deps) {
  const { THREE } = deps;
  const hoverConfig = futureConfig.hoverLane;
  const laneGroup = new THREE.Group();

  const lane = new THREE.Mesh(
    new THREE.BoxGeometry(halfSpan * 2, 0.8, 8),
    new THREE.MeshBasicMaterial({
      color: hoverConfig.color,
      transparent: true,
      opacity: hoverConfig.baseOpacity
    })
  );
  lane.position.set(0, hoverConfig.y, z);
  lane.userData.kind = 'futureHoverLane';
  lane.userData.floatSeed = z * 0.01 + seed * 0.1;
  lane.userData.baseY = hoverConfig.y;
  lane.userData.baseOpacity = hoverConfig.baseOpacity;
  laneGroup.add(lane);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(Math.max(halfSpan * 0.24, 5), 0.22, 8, 26),
    new THREE.MeshBasicMaterial({
      color: hoverConfig.ringColor,
      transparent: true,
      opacity: hoverConfig.ringOpacity,
      depthWrite: false
    })
  );
  ring.rotation.x = Math.PI * 0.5;
  ring.position.set(0, hoverConfig.y - 1.4, z);
  ring.userData.kind = 'futureHoverLaneRing';
  ring.userData.floatSeed = lane.userData.floatSeed + 0.5;
  ring.userData.baseY = hoverConfig.y - 1.4;
  ring.userData.baseOpacity = hoverConfig.ringOpacity;
  laneGroup.add(ring);

  return laneGroup;
}

function createHologramBillboard(seed, z, side, sideX, futureConfig, deps) {
  const { THREE, getArrayColor } = deps;
  const holoConfig = futureConfig.hologram;
  const color = getArrayColor(holoConfig.colors, seed, 0x44d8ff);
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(holoConfig.width, holoConfig.height),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: holoConfig.baseOpacity,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  panel.position.set(side * (sideX - holoConfig.xInset), holoConfig.y, z);
  panel.rotation.y = side < 0 ? Math.PI * 0.16 : -Math.PI * 0.16;
  panel.userData.kind = 'futureHologram';
  panel.userData.pulseSeed = seed * 0.27;
  panel.userData.baseOpacity = holoConfig.baseOpacity;
  return panel;
}

function createTrafficStream(seed, z, halfSpan, futureConfig, deps) {
  const { THREE, pseudoRandom, getArrayColor } = deps;
  const trafficConfig = futureConfig.traffic;
  const color = getArrayColor(trafficConfig.colors, seed, 0x66f0ff);
  const trail = new THREE.Mesh(
    new THREE.BoxGeometry(trafficConfig.trailLength, 0.25, 0.8),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: trafficConfig.opacity,
      depthWrite: false
    })
  );

  trail.position.set(-halfSpan + (seed % 7) * (halfSpan / 3.5), trafficConfig.y, z);
  trail.userData.kind = 'futureTraffic';
  trail.userData.speed = trafficConfig.speed * (0.7 + pseudoRandom(seed * 0.51) * 0.9);
  trail.userData.halfSpan = halfSpan;
  trail.userData.trailLength = trafficConfig.trailLength;
  return trail;
}

export function createFutureCityScenery(deps) {
  const { THREE, CONFIG, getBackgroundMetrics } = deps;
  const group = new THREE.Group();

  const metrics = getBackgroundMetrics();
  const futureConfig = CONFIG.sceneRefactor.futureCity;
  const sceneryConfig = futureConfig.scenery;

  const sideX = Math.max(sceneryConfig.sideXMin, metrics.width * sceneryConfig.sideXWidthMultiplier);

  const laneSpacing = sceneryConfig.laneSpacing;
  const laneCount = Math.max(
    sceneryConfig.laneCountMin,
    Math.ceil((metrics.depth + sceneryConfig.laneDepthPadding) / laneSpacing)
  );

  for (let i = 0; i < laneCount; i++) {
    const z = sceneryConfig.laneStartZ + i * laneSpacing;

    group.add(createFutureTower(i * 2, z, -1, sideX, metrics.heightFactor, futureConfig, deps));
    group.add(
      createFutureTower(
        i * 2 + 1,
        z + sceneryConfig.rightTowerZOffset,
        1,
        sideX,
        metrics.heightFactor,
        futureConfig,
        deps
      )
    );

    if (i % sceneryConfig.bridgeEvery === 0) {
      group.add(createSkyBridge(i, z + sceneryConfig.bridgeZOffset, sideX * 0.92, futureConfig, deps));
    }

    if (i % sceneryConfig.hoverEvery === 0) {
      group.add(createHoverLane(i, z + sceneryConfig.hoverZOffset, sideX * 0.55, futureConfig, deps));
    }

    if (i % sceneryConfig.hologramEvery === 0) {
      group.add(createHologramBillboard(i, z + 20, -1, sideX, futureConfig, deps));
      group.add(createHologramBillboard(i + 5, z + 80, 1, sideX, futureConfig, deps));
    }

    if (i % sceneryConfig.trafficEvery === 0) {
      group.add(createTrafficStream(i, z + 26, sideX * 0.9, futureConfig, deps));
      group.add(createTrafficStream(i + 3, z + 34, sideX * 0.9, futureConfig, deps));
    }
  }

  return group;
}
