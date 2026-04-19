function createHeavenTempleIsland(seed, z, side, baseX, heightFactor, heavenConfig, deps) {
  const { THREE, pseudoRandom } = deps;
  const group = new THREE.Group();
  const islandConfig = heavenConfig.island;
  const templeConfig = heavenConfig.temple;

  const radiusTop = islandConfig.radiusTopBase + pseudoRandom(seed + 0.1) * islandConfig.radiusTopRandom;
  const radiusBottom = islandConfig.radiusBottomBase + pseudoRandom(seed + 0.2) * islandConfig.radiusBottomRandom;
  const thickness = islandConfig.thicknessBase + pseudoRandom(seed + 0.3) * islandConfig.thicknessRandom;
  const y = islandConfig.yBase + heightFactor * islandConfig.yHeightFactorMultiplier + pseudoRandom(seed + 0.4) * 12;
  const x = side * (baseX + pseudoRandom(seed + 0.5) * 100);

  const rock = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, thickness, 10),
    new THREE.MeshStandardMaterial({
      color: islandConfig.rockColor,
      emissive: islandConfig.rockEmissive,
      emissiveIntensity: islandConfig.rockEmissiveIntensity,
      roughness: 0.85,
      metalness: 0.1
    })
  );
  rock.position.set(0, y, 0);
  group.add(rock);

  const topPlate = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop * 0.98, radiusTop * 0.98, 4, 20),
    new THREE.MeshStandardMaterial({
      color: islandConfig.topColor,
      emissive: islandConfig.topEmissive,
      emissiveIntensity: islandConfig.topEmissiveIntensity,
      roughness: 0.45,
      metalness: 0.2
    })
  );
  topPlate.position.set(0, y + thickness * 0.5, 0);
  group.add(topPlate);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(radiusTop * 0.95, 0.7, 10, 28),
    new THREE.MeshBasicMaterial({
      color: islandConfig.rimColor,
      transparent: true,
      opacity: islandConfig.rimOpacity,
      depthWrite: false
    })
  );
  rim.rotation.x = Math.PI * 0.5;
  rim.position.set(0, y + thickness * 0.5 + 2.2, 0);
  rim.userData.kind = 'heavenRim';
  rim.userData.pulseSeed = seed * 0.37;
  rim.userData.baseOpacity = islandConfig.rimOpacity;
  group.add(rim);

  const templeBase = new THREE.Mesh(
    new THREE.BoxGeometry(templeConfig.baseWidth, templeConfig.baseHeight, templeConfig.baseDepth),
    new THREE.MeshStandardMaterial({
      color: templeConfig.baseColor,
      roughness: 0.35,
      metalness: 0.1
    })
  );
  templeBase.position.set(0, y + thickness * 0.5 + templeConfig.baseHeight * 0.5 + 2.5, 0);
  group.add(templeBase);

  const columnSpan = templeConfig.baseWidth * 0.72;
  const columnFrontZ = templeConfig.baseDepth * 0.32;

  for (let i = 0; i < templeConfig.columnCount; i++) {
    const t = templeConfig.columnCount <= 1 ? 0.5 : i / (templeConfig.columnCount - 1);
    const cx = -columnSpan * 0.5 + t * columnSpan;
    const colHeight = templeConfig.columnHeightBase + pseudoRandom(seed + i * 0.9) * templeConfig.columnHeightRandom;

    const frontCol = new THREE.Mesh(
      new THREE.CylinderGeometry(templeConfig.columnRadius, templeConfig.columnRadius, colHeight, 12),
      new THREE.MeshStandardMaterial({
        color: templeConfig.columnColor,
        roughness: 0.32,
        metalness: 0.12
      })
    );
    frontCol.position.set(cx, templeBase.position.y + colHeight * 0.5, columnFrontZ);
    group.add(frontCol);

    const backCol = frontCol.clone();
    backCol.position.z = -columnFrontZ;
    group.add(backCol);
  }

  const roofY = templeBase.position.y + templeConfig.columnHeightBase + templeConfig.roofHeight * 0.6;
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(templeConfig.roofWidth, templeConfig.roofHeight, templeConfig.roofDepth),
    new THREE.MeshStandardMaterial({
      color: templeConfig.roofColor,
      emissive: templeConfig.roofEmissive,
      emissiveIntensity: templeConfig.roofEmissiveIntensity,
      roughness: 0.4,
      metalness: 0.18
    })
  );
  roof.position.set(0, roofY, 0);
  group.add(roof);

  const stairs = new THREE.Mesh(
    new THREE.BoxGeometry(templeConfig.stairWidth, templeConfig.stairHeight, templeConfig.stairDepth),
    new THREE.MeshStandardMaterial({ color: templeConfig.stairColor, roughness: 0.5 })
  );
  stairs.position.set(0, templeBase.position.y - templeConfig.baseHeight * 0.45, templeConfig.baseDepth * 0.57);
  group.add(stairs);

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(templeConfig.haloRadius, templeConfig.haloTube, 10, 40),
    new THREE.MeshBasicMaterial({
      color: templeConfig.haloColor,
      transparent: true,
      opacity: templeConfig.haloOpacity,
      depthWrite: false
    })
  );
  halo.rotation.x = Math.PI * 0.5;
  halo.position.set(0, roofY + 12, 0);
  halo.userData.kind = 'heavenHalo';
  halo.userData.spinSeed = seed * 0.21;
  halo.userData.baseOpacity = templeConfig.haloOpacity;
  group.add(halo);

  const rearHalo = new THREE.Mesh(
    new THREE.TorusGeometry(templeConfig.rearHaloRadius, templeConfig.rearHaloTube, 12, 48),
    new THREE.MeshBasicMaterial({
      color: templeConfig.rearHaloColor,
      transparent: true,
      opacity: templeConfig.rearHaloOpacity,
      depthWrite: false
    })
  );
  rearHalo.position.set(0, roofY + 13.5, -3);
  rearHalo.userData.kind = 'heavenRearHalo';
  rearHalo.userData.spinSeed = seed * 0.17;
  rearHalo.userData.baseOpacity = templeConfig.rearHaloOpacity;
  group.add(rearHalo);

  const veil = new THREE.Mesh(
    new THREE.PlaneGeometry(templeConfig.veilWidth, templeConfig.veilHeight),
    new THREE.MeshBasicMaterial({
      color: templeConfig.veilColor,
      transparent: true,
      opacity: templeConfig.veilOpacity,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  veil.position.set(0, roofY + 8, -6);
  veil.userData.kind = 'heavenVeil';
  veil.userData.floatSeed = seed * 0.25;
  veil.userData.baseY = roofY + 8;
  veil.userData.baseOpacity = templeConfig.veilOpacity;
  group.add(veil);

  const lightfallA = new THREE.Mesh(
    new THREE.PlaneGeometry(templeConfig.lightfallWidth, templeConfig.lightfallHeight),
    new THREE.MeshBasicMaterial({
      color: templeConfig.lightfallColor,
      transparent: true,
      opacity: templeConfig.lightfallOpacity,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  lightfallA.position.set(0, y - thickness * 0.15, 0);
  lightfallA.userData.kind = 'heavenLightfall';
  lightfallA.userData.floatSeed = seed * 0.29;
  lightfallA.userData.baseOpacity = templeConfig.lightfallOpacity;
  group.add(lightfallA);

  const lightfallB = lightfallA.clone();
  lightfallB.rotation.y = Math.PI * 0.5;
  lightfallB.userData.floatSeed = seed * 0.29 + 0.7;
  group.add(lightfallB);

  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(templeConfig.orbRadius, 14, 14),
    new THREE.MeshStandardMaterial({
      color: templeConfig.orbColor,
      emissive: templeConfig.orbEmissive,
      emissiveIntensity: templeConfig.orbEmissiveIntensity,
      transparent: true,
      opacity: 0.9
    })
  );
  orb.position.set(0, roofY + 10, 0);
  orb.userData.kind = 'heavenOrb';
  orb.userData.floatSeed = seed * 0.47;
  orb.userData.baseY = roofY + 10;
  orb.userData.baseEmissive = templeConfig.orbEmissiveIntensity;
  group.add(orb);

  group.position.set(x, 0, z);
  return group;
}

function createHeavenBridge(seed, z, span, y, heavenConfig, deps) {
  const { THREE } = deps;
  const bridgeConfig = heavenConfig.bridge;
  const bridgeGroup = new THREE.Group();

  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(span * 2, bridgeConfig.deckHeight, bridgeConfig.deckDepth),
    new THREE.MeshBasicMaterial({
      color: bridgeConfig.deckColor,
      transparent: true,
      opacity: bridgeConfig.deckOpacity
    })
  );
  deck.position.set(0, y + bridgeConfig.yOffset, z);
  bridgeGroup.add(deck);

  const railMat = new THREE.MeshBasicMaterial({
    color: bridgeConfig.railColor,
    transparent: true,
    opacity: bridgeConfig.railOpacity
  });

  const rail1 = new THREE.Mesh(new THREE.BoxGeometry(span * 2, 0.55, 0.9), railMat);
  rail1.position.set(0, y + bridgeConfig.yOffset + 1.4, z + bridgeConfig.deckDepth * 0.45);
  rail1.userData.kind = 'heavenBridgeRail';
  rail1.userData.pulseSeed = seed * 0.18;
  rail1.userData.baseOpacity = bridgeConfig.railOpacity;
  bridgeGroup.add(rail1);

  const rail2 = rail1.clone();
  rail2.position.z = z - bridgeConfig.deckDepth * 0.45;
  rail2.userData.pulseSeed = seed * 0.18 + 0.8;
  bridgeGroup.add(rail2);

  return bridgeGroup;
}

function createHeavenRoadsideMonument(seed, z, side, roadX, y, heavenConfig, deps) {
  const { THREE, pseudoRandom } = deps;
  const roadsideConfig = heavenConfig.roadside;
  const group = new THREE.Group();

  const isObelisk = seed % 2 === 0;

  if (isObelisk) {
    const obeliskHeight =
      roadsideConfig.obeliskHeightBase +
      pseudoRandom(seed + 0.17) * roadsideConfig.obeliskHeightRandom;

    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(
        roadsideConfig.obeliskRadiusTop,
        roadsideConfig.obeliskRadiusBottom,
        obeliskHeight,
        8
      ),
      new THREE.MeshStandardMaterial({
        color: roadsideConfig.obeliskColor,
        emissive: roadsideConfig.obeliskEmissive,
        emissiveIntensity: roadsideConfig.obeliskEmissiveIntensity,
        metalness: 0.18,
        roughness: 0.35
      })
    );
    shaft.position.set(0, obeliskHeight * 0.5, 0);
    group.add(shaft);

    const crown = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 12, 12),
      new THREE.MeshStandardMaterial({
        color: roadsideConfig.crownColor,
        emissive: roadsideConfig.crownEmissive,
        emissiveIntensity: roadsideConfig.crownEmissiveIntensity,
        transparent: true,
        opacity: 0.92
      })
    );
    crown.position.set(0, obeliskHeight + 2.8, 0);
    crown.userData.kind = 'heavenRoadCrown';
    crown.userData.pulseSeed = seed * 0.23;
    crown.userData.baseEmissive = roadsideConfig.crownEmissiveIntensity;
    group.add(crown);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(roadsideConfig.haloRadius, roadsideConfig.haloTube, 8, 28),
      new THREE.MeshBasicMaterial({
        color: roadsideConfig.haloColor,
        transparent: true,
        opacity: roadsideConfig.haloOpacity,
        depthWrite: false
      })
    );
    halo.rotation.x = Math.PI * 0.5;
    halo.position.set(0, obeliskHeight + 4.4, 0);
    halo.userData.kind = 'heavenRoadHalo';
    halo.userData.pulseSeed = seed * 0.31;
    halo.userData.baseOpacity = roadsideConfig.haloOpacity;
    group.add(halo);
  } else {
    const wing = new THREE.Mesh(
      new THREE.BoxGeometry(
        roadsideConfig.wingWidth,
        roadsideConfig.wingHeight,
        roadsideConfig.wingDepth
      ),
      new THREE.MeshStandardMaterial({
        color: roadsideConfig.wingColor,
        emissive: roadsideConfig.wingEmissive,
        emissiveIntensity: roadsideConfig.wingEmissiveIntensity,
        transparent: true,
        opacity: 0.9,
        metalness: 0.1,
        roughness: 0.28
      })
    );
    wing.rotation.z = side < 0 ? Math.PI * 0.18 : -Math.PI * 0.18;
    wing.position.set(0, roadsideConfig.wingHeight * 0.55, 0);
    wing.userData.kind = 'heavenRoadWing';
    wing.userData.pulseSeed = seed * 0.19;
    wing.userData.baseEmissive = roadsideConfig.wingEmissiveIntensity;
    group.add(wing);

    const bannerColor = side < 0 ? roadsideConfig.bannerColorA : roadsideConfig.bannerColorB;
    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(roadsideConfig.bannerWidth, roadsideConfig.bannerHeight),
      new THREE.MeshBasicMaterial({
        color: bannerColor,
        transparent: true,
        opacity: roadsideConfig.bannerOpacity,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    banner.position.set(side < 0 ? -4.2 : 4.2, roadsideConfig.wingHeight * 0.65, 0);
    banner.userData.kind = 'heavenRoadBanner';
    banner.userData.pulseSeed = seed * 0.29;
    banner.userData.baseOpacity = roadsideConfig.bannerOpacity;
    group.add(banner);
  }

  group.position.set(side * roadX, y, z);
  return group;
}

function createHeavenCloud(seed, z, metrics, heavenConfig, deps) {
  const { THREE, pseudoRandom } = deps;
  const cloudConfig = heavenConfig.cloud;
  const width = cloudConfig.widthBase + pseudoRandom(seed + 0.1) * cloudConfig.widthRandom;
  const height = cloudConfig.heightBase + pseudoRandom(seed + 0.2) * cloudConfig.heightRandom;
  const xRange = Math.max(260, metrics.width * cloudConfig.xRangeMultiplier);
  const x = (pseudoRandom(seed + 0.3) * 2 - 1) * xRange;
  const y = cloudConfig.yBase + pseudoRandom(seed + 0.4) * cloudConfig.yRandom;
  const opacity = cloudConfig.opacityBase + pseudoRandom(seed + 0.5) * cloudConfig.opacityRandom;

  const cloud = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      color: cloudConfig.color,
      transparent: true,
      opacity,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );

  cloud.position.set(x, y, z);
  cloud.rotation.y = pseudoRandom(seed + 0.6) * Math.PI;
  cloud.userData.kind = 'heavenCloud';
  cloud.userData.baseX = x;
  cloud.userData.baseY = y;
  cloud.userData.floatSeed = seed * 0.39;
  cloud.userData.driftSpeed = cloudConfig.driftSpeedBase + pseudoRandom(seed + 0.7) * cloudConfig.driftSpeedRandom;
  cloud.userData.xLimit = xRange;
  cloud.userData.baseOpacity = opacity;

  return cloud;
}

function createHeavenAurora(seed, z, metrics, heavenConfig, deps) {
  const { THREE, pseudoRandom, getArrayColor } = deps;
  const auroraConfig = heavenConfig.aurora;
  const width = auroraConfig.widthBase + pseudoRandom(seed + 0.11) * auroraConfig.widthRandom;
  const height = auroraConfig.heightBase + pseudoRandom(seed + 0.21) * auroraConfig.heightRandom;
  const xRange = Math.max(240, metrics.width * auroraConfig.xRangeMultiplier);
  const color = getArrayColor(auroraConfig.colors, seed, 0xe3f6ff);
  const opacity = auroraConfig.opacityBase + pseudoRandom(seed + 0.31) * auroraConfig.opacityRandom;

  const aurora = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );

  aurora.position.set(
    (pseudoRandom(seed + 0.41) * 2 - 1) * xRange,
    auroraConfig.yBase + pseudoRandom(seed + 0.51) * auroraConfig.yRandom,
    z
  );
  aurora.rotation.y = (pseudoRandom(seed + 0.61) * 2 - 1) * 0.5;
  aurora.rotation.x = -0.08 + pseudoRandom(seed + 0.71) * 0.16;
  aurora.userData.kind = 'heavenAurora';
  aurora.userData.baseX = aurora.position.x;
  aurora.userData.baseY = aurora.position.y;
  aurora.userData.floatSeed = seed * 0.33;
  aurora.userData.baseOpacity = opacity;
  aurora.userData.driftSpeed = auroraConfig.driftSpeedBase + pseudoRandom(seed + 0.81) * auroraConfig.driftSpeedRandom;
  aurora.userData.swayAmplitude = auroraConfig.swayAmplitude;
  aurora.userData.xLimit = xRange;

  return aurora;
}

function createHeavenMoteCluster(seed, z, metrics, heavenConfig, deps) {
  const { THREE, pseudoRandom, getArrayColor } = deps;
  const moteConfig = heavenConfig.motes;
  const group = new THREE.Group();
  const baseX = (pseudoRandom(seed + 0.11) * 2 - 1) * Math.max(160, metrics.width * 0.45);
  const baseY = 70 + pseudoRandom(seed + 0.21) * 110;

  for (let i = 0; i < moteConfig.count; i++) {
    const color = getArrayColor(moteConfig.colors, i + seed, 0xffffff);
    const opacity = moteConfig.opacityBase + pseudoRandom(seed + i * 0.13) * moteConfig.opacityRandom;
    const size = moteConfig.sizeBase + pseudoRandom(seed + i * 0.27) * moteConfig.sizeRandom;
    const mote = new THREE.Mesh(
      new THREE.SphereGeometry(size, 8, 8),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false
      })
    );

    mote.position.set(
      baseX + (pseudoRandom(seed + i * 0.31) * 2 - 1) * moteConfig.spreadX,
      baseY + (pseudoRandom(seed + i * 0.41) * 2 - 1) * moteConfig.spreadY,
      z + (pseudoRandom(seed + i * 0.51) * 2 - 1) * moteConfig.spreadZ
    );
    mote.userData.kind = 'heavenMote';
    mote.userData.baseX = mote.position.x;
    mote.userData.baseY = mote.position.y;
    mote.userData.baseZ = mote.position.z;
    mote.userData.floatSeed = seed * 0.37 + i * 0.17;
    mote.userData.baseOpacity = opacity;
    mote.userData.riseSpeed = moteConfig.riseSpeedBase + pseudoRandom(seed + i * 0.67) * moteConfig.riseSpeedRandom;
    mote.userData.yReset = baseY - moteConfig.spreadY;
    mote.userData.yTop = baseY + moteConfig.spreadY;
    group.add(mote);
  }

  return group;
}

export function createHeavenTempleScenery(deps) {
  const { THREE, CONFIG, pseudoRandom, getArrayColor, getBackgroundMetrics } = deps;
  const group = new THREE.Group();
  const metrics = getBackgroundMetrics();
  const heavenConfig = CONFIG.sceneRefactor.heavenTemple;
  const sceneryConfig = heavenConfig.scenery;

  const sideX = Math.max(sceneryConfig.sideXMin, metrics.width * sceneryConfig.sideXWidthMultiplier);
  const laneCount = Math.max(
    sceneryConfig.laneCountMin,
    Math.ceil((metrics.depth + sceneryConfig.laneDepthPadding) / sceneryConfig.laneSpacing)
  );

  for (let i = 0; i < laneCount; i++) {
    const z = sceneryConfig.laneStartZ + i * sceneryConfig.laneSpacing;
    const bridgeY =
      CONFIG.sceneRefactor.heavenTemple.island.yBase +
      metrics.heightFactor * CONFIG.sceneRefactor.heavenTemple.island.yHeightFactorMultiplier;
    const roadX = Math.max(
      heavenConfig.roadside.xMin,
      sideX * heavenConfig.roadside.xMultiplier
    );

    const leftIsland = createHeavenTempleIsland(i * 2, z, -1, sideX, metrics.heightFactor, heavenConfig, deps);
    const rightIsland = createHeavenTempleIsland(
      i * 2 + 1,
      z + sceneryConfig.rightIslandZOffset,
      1,
      sideX,
      metrics.heightFactor,
      heavenConfig,
      deps
    );

    group.add(leftIsland);
    group.add(rightIsland);

    if (i % sceneryConfig.bridgeEvery === 0) {
      group.add(createHeavenBridge(i, z + sceneryConfig.bridgeZOffset, sideX * heavenConfig.bridge.widthScale, bridgeY, heavenConfig, deps));
    }

    if (i % sceneryConfig.roadsideEvery === 0) {
      group.add(
        createHeavenRoadsideMonument(
          i * 2,
          z + sceneryConfig.roadsideZOffset,
          -1,
          roadX,
          bridgeY + 2,
          heavenConfig,
          deps
        )
      );
      group.add(
        createHeavenRoadsideMonument(
          i * 2 + 1,
          z + sceneryConfig.roadsideZOffset + 56,
          1,
          roadX,
          bridgeY + 2,
          heavenConfig,
          deps
        )
      );
    }

    if (i % sceneryConfig.cloudEvery === 0) {
      group.add(createHeavenCloud(i * 3 + 1, z + sceneryConfig.cloudZOffset, metrics, heavenConfig, deps));
      group.add(createHeavenCloud(i * 3 + 2, z + sceneryConfig.cloudZOffset + 60, metrics, heavenConfig, deps));
    }

    if (i % sceneryConfig.auroraEvery === 0) {
      group.add(createHeavenAurora(i * 5 + 1, z - 20, metrics, heavenConfig, deps));
    }

    if (i % sceneryConfig.moteEvery === 0) {
      group.add(createHeavenMoteCluster(i * 7 + 1, z + 30, metrics, heavenConfig, deps));
    }
  }

  return group;
}
