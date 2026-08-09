// ============================================================================
//  Fallen Sky-City  ―  崩壊した天空都市
//  かつて神殿だった浮遊島が砕け、露出した構造フレーム・瓦礫・エネルギー亀裂・
//  グリッチするホログラム・立ち昇る火の粉が、ネオンと残光に照らされる背景。
//
//  ※ テーマ識別子 'heavenTemple' / export 名はそのまま維持しているため
//     scene.js / uiConfig.js は無変更で差し替え可能です。
// ============================================================================

/**
 * 露出した構造フレーム（島の裏側からぶら下がる支柱と格子）を作ります。
 */
function createExposedFrame(seed, radiusTop, thickness, y, ruinConfig, deps) {
  const { THREE, pseudoRandom } = deps;
  const frameConfig = ruinConfig.frame;
  const group = new THREE.Group();

  const strutMat = new THREE.MeshStandardMaterial({
    color: frameConfig.color,
    emissive: frameConfig.emissive,
    emissiveIntensity: frameConfig.emissiveIntensity,
    metalness: 0.9,
    roughness: 0.4
  });

  // 島の底からぶら下がる縦支柱（折れた残骸のように長さバラバラ）
  for (let i = 0; i < frameConfig.strutCount; i++) {
    const angle = (i / frameConfig.strutCount) * Math.PI * 2;
    const r = radiusTop * frameConfig.strutRadiusRatio;
    const len =
      frameConfig.strutLengthBase +
      pseudoRandom(seed + i * 0.37) * frameConfig.strutLengthRandom;

    const strut = new THREE.Mesh(
      new THREE.CylinderGeometry(
        frameConfig.strutRadius,
        frameConfig.strutRadius * 0.4,
        len,
        5
      ),
      strutMat
    );
    strut.position.set(
      Math.cos(angle) * r,
      y - thickness * 0.5 - len * 0.5,
      Math.sin(angle) * r
    );
    strut.rotation.z = (pseudoRandom(seed + i * 0.7) - 0.5) * frameConfig.strutTilt;
    strut.rotation.x = (pseudoRandom(seed + i * 0.9) - 0.5) * frameConfig.strutTilt;
    group.add(strut);
  }

  // 露出した発光リング（構造が引きちぎれた断面の光）
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radiusTop * frameConfig.ringRadiusRatio, 0.9, 8, 22),
    new THREE.MeshBasicMaterial({
      color: frameConfig.ringColor,
      transparent: true,
      opacity: frameConfig.ringOpacity,
      depthWrite: false
    })
  );
  ring.rotation.x = Math.PI * 0.5;
  ring.position.set(0, y - thickness * 0.5, 0);
  ring.userData.kind = 'ruinFracture';
  ring.userData.pulseSeed = seed * 0.31;
  ring.userData.baseOpacity = frameConfig.ringOpacity;
  group.add(ring);

  return group;
}

/**
 * 崩れかけたネオンの尖塔を作ります（傾き＋破断した頂部＋赤い警告灯）。
 */
function createRuinSpire(seed, baseY, ruinConfig, deps) {
  const { THREE, pseudoRandom, getArrayColor } = deps;
  const spireConfig = ruinConfig.spire;
  const group = new THREE.Group();

  const height =
    spireConfig.heightBase + pseudoRandom(seed + 0.13) * spireConfig.heightRandom;
  const width = spireConfig.widthBase + pseudoRandom(seed + 0.17) * spireConfig.widthRandom;

  // 本体（暗いスレート＋わずかな発光）
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, width),
    new THREE.MeshStandardMaterial({
      color: spireConfig.bodyColor,
      emissive: spireConfig.bodyEmissive,
      emissiveIntensity: spireConfig.bodyEmissiveIntensity,
      metalness: 0.8,
      roughness: 0.5
    })
  );
  body.position.set(0, baseY + height * 0.5, 0);
  group.add(body);

  // 破断した頂部（斜めに傾いた小ブロック）
  const brokenTop = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.9, height * 0.22, width * 0.9),
    body.material
  );
  brokenTop.position.set(
    width * spireConfig.topShift,
    baseY + height + height * 0.09,
    width * spireConfig.topShift * 0.6
  );
  brokenTop.rotation.z = spireConfig.topTilt;
  brokenTop.rotation.x = spireConfig.topTilt * 0.5;
  group.add(brokenTop);

  // ネオンの縦エッジ（シアン／マゼンタを交互）
  const edgeColor = getArrayColor(spireConfig.edgeColors, seed, 0x22e6ff);
  const edgeMat = new THREE.MeshBasicMaterial({
    color: edgeColor,
    transparent: true,
    opacity: spireConfig.edgeOpacity
  });
  const edgeGeo = new THREE.BoxGeometry(spireConfig.edgeThickness, height, spireConfig.edgeThickness);
  for (let i = 0; i < 4; i++) {
    const sx = i < 2 ? -1 : 1;
    const sz = i % 2 === 0 ? -1 : 1;
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.position.set(sx * width * 0.5, baseY + height * 0.5, sz * width * 0.5);
    edge.userData.kind = 'ruinSpireGlow';
    edge.userData.pulseSeed = seed * 0.29 + i * 0.4;
    edge.userData.baseOpacity = spireConfig.edgeOpacity;
    group.add(edge);
  }

  // 赤い警告灯（頂部で明滅）
  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(spireConfig.beaconRadius, 10, 10),
    new THREE.MeshBasicMaterial({
      color: spireConfig.beaconColor,
      transparent: true,
      opacity: spireConfig.beaconOpacity
    })
  );
  beacon.position.set(0, baseY + height + spireConfig.beaconYOffset, 0);
  beacon.userData.kind = 'ruinBeacon';
  beacon.userData.blinkSeed = seed * 0.53;
  beacon.userData.baseOpacity = spireConfig.beaconOpacity;
  group.add(beacon);

  const beaconHalo = new THREE.Mesh(
    new THREE.SphereGeometry(spireConfig.beaconRadius * 2.4, 8, 8),
    new THREE.MeshBasicMaterial({
      color: spireConfig.beaconColor,
      transparent: true,
      opacity: spireConfig.beaconOpacity * 0.35,
      depthWrite: false
    })
  );
  beaconHalo.position.copy(beacon.position);
  beaconHalo.userData.kind = 'ruinBeacon';
  beaconHalo.userData.blinkSeed = seed * 0.53 + 0.5;
  beaconHalo.userData.baseOpacity = spireConfig.beaconOpacity * 0.35;
  group.add(beaconHalo);

  return group;
}

/**
 * 砕けて傾いた浮遊島（＋露出フレーム＋尖塔＋浮遊コア）を作ります。
 */
function createRuinIsland(seed, z, side, baseX, heightFactor, ruinConfig, deps) {
  const { THREE, pseudoRandom } = deps;
  const group = new THREE.Group();
  const islandConfig = ruinConfig.island;
  const coreConfig = ruinConfig.core;

  const radiusTop = islandConfig.radiusTopBase + pseudoRandom(seed + 0.1) * islandConfig.radiusTopRandom;
  const radiusBottom = radiusTop * islandConfig.bottomRatio;
  const thickness = islandConfig.thicknessBase + pseudoRandom(seed + 0.3) * islandConfig.thicknessRandom;
  const y = islandConfig.yBase + heightFactor * islandConfig.yHeightFactorMultiplier + pseudoRandom(seed + 0.4) * 24;
  const x = side * (baseX + pseudoRandom(seed + 0.5) * 110);

  // 島本体（低ポリの岩塊＝破壊感）。傾けて「崩れかけ」を表現。
  const rock = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, thickness, 6, 1),
    new THREE.MeshStandardMaterial({
      color: islandConfig.rockColor,
      emissive: islandConfig.rockEmissive,
      emissiveIntensity: islandConfig.rockEmissiveIntensity,
      roughness: 0.9,
      metalness: 0.12,
      flatShading: true
    })
  );
  rock.position.set(0, y, 0);
  rock.rotation.z = (pseudoRandom(seed + 0.61) - 0.5) * islandConfig.tilt;
  rock.rotation.x = (pseudoRandom(seed + 0.62) - 0.5) * islandConfig.tilt;
  group.add(rock);

  // 上面の割れ目（発光する亀裂）
  const crackMat = new THREE.MeshBasicMaterial({
    color: islandConfig.crackColor,
    transparent: true,
    opacity: islandConfig.crackOpacity,
    depthWrite: false
  });
  for (let i = 0; i < islandConfig.crackCount; i++) {
    const crack = new THREE.Mesh(
      new THREE.BoxGeometry(
        islandConfig.crackWidth,
        0.6,
        radiusTop * (0.7 + pseudoRandom(seed + i * 0.23) * 0.6)
      ),
      crackMat
    );
    crack.position.set(
      (pseudoRandom(seed + i * 0.5) - 0.5) * radiusTop * 0.8,
      y + thickness * 0.5 + 0.4,
      (pseudoRandom(seed + i * 0.7) - 0.5) * radiusTop * 0.4
    );
    crack.rotation.y = pseudoRandom(seed + i * 0.9) * Math.PI;
    crack.userData.kind = 'ruinFracture';
    crack.userData.pulseSeed = seed * 0.4 + i * 0.6;
    crack.userData.baseOpacity = islandConfig.crackOpacity;
    group.add(crack);
  }

  // 露出した構造フレーム（裏側）
  group.add(createExposedFrame(seed, radiusTop, thickness, y, ruinConfig, deps));

  // 崩れた尖塔
  group.add(createRuinSpire(seed, y + thickness * 0.5, ruinConfig, deps));

  // 浮遊するエネルギーコア（島の上空でゆらぎ＋発光脈動）
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(coreConfig.radius, 0),
    new THREE.MeshStandardMaterial({
      color: coreConfig.color,
      emissive: coreConfig.emissive,
      emissiveIntensity: coreConfig.emissiveIntensity,
      transparent: true,
      opacity: 0.92,
      flatShading: true
    })
  );
  const coreY = y + thickness * 0.5 + coreConfig.yOffset;
  core.position.set(0, coreY, 0);
  core.userData.kind = 'ruinCore';
  core.userData.floatSeed = seed * 0.47;
  core.userData.baseY = coreY;
  core.userData.baseEmissive = coreConfig.emissiveIntensity;
  group.add(core);

  const coreHalo = new THREE.Mesh(
    new THREE.SphereGeometry(coreConfig.radius * 2.2, 12, 12),
    new THREE.MeshBasicMaterial({
      color: coreConfig.haloColor,
      transparent: true,
      opacity: coreConfig.haloOpacity,
      depthWrite: false
    })
  );
  coreHalo.position.copy(core.position);
  coreHalo.userData.kind = 'ruinCore';
  coreHalo.userData.floatSeed = seed * 0.47;
  coreHalo.userData.baseY = coreY;
  group.add(coreHalo);

  group.position.set(x, 0, z);
  group.userData.islandY = y;
  return group;
}

/**
 * 浮遊する瓦礫群（インスタンス化した八面体シャード）を作ります。
 */
function createDebrisField(seed, z, metrics, ruinConfig, deps) {
  const { THREE, pseudoRandom } = deps;
  const debrisConfig = ruinConfig.debris;
  const group = new THREE.Group();

  const baseGeometry = new THREE.OctahedronGeometry(1, 0);
  const material = new THREE.MeshStandardMaterial({
    color: debrisConfig.color,
    emissive: debrisConfig.emissive,
    emissiveIntensity: debrisConfig.emissiveIntensity,
    metalness: 0.7,
    roughness: 0.6,
    flatShading: true
  });

  const instances = new THREE.InstancedMesh(baseGeometry, material, debrisConfig.count);
  instances.instanceMatrix.setUsage(THREE.StaticDrawUsage);

  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const euler = new THREE.Euler();

  const spread = Math.max(debrisConfig.spreadXMin, metrics.width * debrisConfig.spreadXMultiplier);

  for (let i = 0; i < debrisConfig.count; i++) {
    const s = debrisConfig.sizeBase + pseudoRandom(seed + i * 0.11) * debrisConfig.sizeRandom;
    position.set(
      (pseudoRandom(seed + i * 0.21) - 0.5) * spread,
      debrisConfig.yBase + pseudoRandom(seed + i * 0.31) * debrisConfig.ySpread,
      z + (pseudoRandom(seed + i * 0.41) - 0.5) * debrisConfig.spreadZ
    );
    euler.set(
      pseudoRandom(seed + i * 0.5) * Math.PI,
      pseudoRandom(seed + i * 0.6) * Math.PI,
      pseudoRandom(seed + i * 0.7) * Math.PI
    );
    quaternion.setFromEuler(euler);
    scale.set(s, s * (0.6 + pseudoRandom(seed + i * 0.8) * 0.8), s);
    matrix.compose(position, quaternion, scale);
    instances.setMatrixAt(i, matrix);
  }
  instances.instanceMatrix.needsUpdate = true;

  instances.userData.kind = 'ruinDebris';
  instances.userData.spinSeed = seed * 0.19;
  instances.userData.baseY = 0;
  group.add(instances);

  return group;
}

/**
 * 空間に走るエネルギー亀裂（リフト）を作ります。ギザギザの発光板＋走査線。
 */
function createEnergyRift(seed, z, metrics, ruinConfig, deps) {
  const { THREE, pseudoRandom, getArrayColor } = deps;
  const riftConfig = ruinConfig.rift;
  const group = new THREE.Group();

  const color = getArrayColor(riftConfig.colors, seed, 0x8a5cff);
  const height =
    riftConfig.heightBase + pseudoRandom(seed + 0.12) * riftConfig.heightRandom;
  const x =
    (pseudoRandom(seed + 0.22) - 0.5) *
    Math.max(riftConfig.xRangeMin, metrics.width * riftConfig.xRangeMultiplier);
  const y = riftConfig.yBase + pseudoRandom(seed + 0.32) * riftConfig.yRandom;

  // 亀裂本体（縦長の発光面）
  const rift = new THREE.Mesh(
    new THREE.PlaneGeometry(riftConfig.width, height),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: riftConfig.opacity,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  rift.position.set(x, y, z);
  rift.rotation.z = (pseudoRandom(seed + 0.42) - 0.5) * riftConfig.tilt;
  rift.rotation.y = (pseudoRandom(seed + 0.52) - 0.5) * 0.6;
  rift.userData.kind = 'ruinRift';
  rift.userData.flickerSeed = seed * 0.61;
  rift.userData.baseOpacity = riftConfig.opacity;
  group.add(rift);

  // 亀裂の縁の稲妻ライン
  const boltPts = [];
  const segs = riftConfig.boltSegments;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    boltPts.push(new THREE.Vector3(
      x + (pseudoRandom(seed + i * 0.7) - 0.5) * riftConfig.width * 0.5,
      y - height * 0.5 + t * height,
      z + 0.5
    ));
  }
  const bolt = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(boltPts),
    new THREE.LineBasicMaterial({
      color: riftConfig.boltColor,
      transparent: true,
      opacity: riftConfig.boltOpacity
    })
  );
  bolt.userData.kind = 'ruinRift';
  bolt.userData.flickerSeed = seed * 0.61 + 0.4;
  bolt.userData.baseOpacity = riftConfig.boltOpacity;
  group.add(bolt);

  return group;
}

/**
 * グリッチするホログラム看板（走査線付き）を作ります。
 */
function createGlitchHologram(seed, z, side, sideX, ruinConfig, deps) {
  const { THREE, getArrayColor } = deps;
  const holoConfig = ruinConfig.hologram;
  const group = new THREE.Group();
  const color = getArrayColor(holoConfig.colors, seed, 0x2ff0ff);

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
  const px = side * (sideX - holoConfig.xInset);
  panel.position.set(px, holoConfig.y, z);
  panel.rotation.y = side < 0 ? Math.PI * 0.16 : -Math.PI * 0.16;
  panel.userData.kind = 'ruinHologram';
  panel.userData.glitchSeed = seed * 0.27;
  panel.userData.baseOpacity = holoConfig.baseOpacity;
  panel.userData.baseX = px;
  group.add(panel);

  // 走査線（横に流れる細い帯）
  const scanMat = new THREE.MeshBasicMaterial({
    color: holoConfig.scanColor,
    transparent: true,
    opacity: holoConfig.scanOpacity,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  for (let i = 0; i < holoConfig.scanCount; i++) {
    const scan = new THREE.Mesh(
      new THREE.PlaneGeometry(holoConfig.width * 0.98, holoConfig.scanThickness),
      scanMat
    );
    const localY = -holoConfig.height * 0.5 + (i / holoConfig.scanCount) * holoConfig.height;
    scan.position.set(px, holoConfig.y + localY, z + 0.4);
    scan.rotation.y = panel.rotation.y;
    scan.userData.kind = 'ruinScanline';
    scan.userData.baseY = holoConfig.y + localY;
    scan.userData.scanSpan = holoConfig.height;
    scan.userData.scanSpeed = holoConfig.scanSpeed * (0.7 + (i % 3) * 0.2);
    scan.userData.scanBottom = holoConfig.y - holoConfig.height * 0.5;
    group.add(scan);
  }

  return group;
}

/**
 * 立ち昇る火の粉／火花を作ります。
 */
function createEmberStream(seed, z, metrics, ruinConfig, deps) {
  const { THREE, pseudoRandom, getArrayColor } = deps;
  const emberConfig = ruinConfig.embers;
  const group = new THREE.Group();

  const baseX = (pseudoRandom(seed + 0.11) * 2 - 1) * Math.max(160, metrics.width * 0.42);
  const baseY = emberConfig.yBase + pseudoRandom(seed + 0.21) * emberConfig.yRandom;

  for (let i = 0; i < emberConfig.count; i++) {
    const color = getArrayColor(emberConfig.colors, i + seed, 0xff6a2a);
    const opacity = emberConfig.opacityBase + pseudoRandom(seed + i * 0.13) * emberConfig.opacityRandom;
    const size = emberConfig.sizeBase + pseudoRandom(seed + i * 0.27) * emberConfig.sizeRandom;

    const ember = new THREE.Mesh(
      new THREE.SphereGeometry(size, 6, 6),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false })
    );
    ember.position.set(
      baseX + (pseudoRandom(seed + i * 0.31) * 2 - 1) * emberConfig.spreadX,
      baseY + (pseudoRandom(seed + i * 0.41) * 2 - 1) * emberConfig.spreadY,
      z + (pseudoRandom(seed + i * 0.51) * 2 - 1) * emberConfig.spreadZ
    );
    ember.userData.kind = 'ruinEmber';
    ember.userData.baseX = ember.position.x;
    ember.userData.baseZ = ember.position.z;
    ember.userData.floatSeed = seed * 0.37 + i * 0.17;
    ember.userData.baseOpacity = opacity;
    ember.userData.riseSpeed = emberConfig.riseSpeedBase + pseudoRandom(seed + i * 0.67) * emberConfig.riseSpeedRandom;
    ember.userData.yReset = baseY - emberConfig.spreadY;
    ember.userData.yTop = baseY + emberConfig.spreadY;
    group.add(ember);
  }

  return group;
}

/**
 * 崩落した橋（途中で途切れ、断面が発光）を作ります。
 */
function createBrokenBridge(seed, z, span, y, ruinConfig, deps) {
  const { THREE } = deps;
  const bridgeConfig = ruinConfig.bridge;
  const group = new THREE.Group();

  const deckMat = new THREE.MeshStandardMaterial({
    color: bridgeConfig.deckColor,
    emissive: bridgeConfig.deckEmissive,
    emissiveIntensity: bridgeConfig.deckEmissiveIntensity,
    metalness: 0.6,
    roughness: 0.6,
    transparent: true,
    opacity: bridgeConfig.deckOpacity,
    flatShading: true
  });

  // 左右の残存デッキ（中央が欠落＝崩落）
  const segLen = span * bridgeConfig.segmentRatio;
  const left = new THREE.Mesh(new THREE.BoxGeometry(segLen, bridgeConfig.deckHeight, bridgeConfig.deckDepth), deckMat);
  left.position.set(-span + segLen * 0.5, y + bridgeConfig.yOffset, z);
  left.rotation.z = bridgeConfig.tilt;
  group.add(left);

  const right = new THREE.Mesh(new THREE.BoxGeometry(segLen, bridgeConfig.deckHeight, bridgeConfig.deckDepth), deckMat);
  right.position.set(span - segLen * 0.5, y + bridgeConfig.yOffset, z);
  right.rotation.z = -bridgeConfig.tilt;
  group.add(right);

  // 断面の発光縁
  const edgeMat = new THREE.MeshBasicMaterial({
    color: bridgeConfig.edgeColor,
    transparent: true,
    opacity: bridgeConfig.edgeOpacity
  });
  const edgeGeo = new THREE.BoxGeometry(1.2, bridgeConfig.deckHeight * 1.4, bridgeConfig.deckDepth * 1.05);
  const leftEdge = new THREE.Mesh(edgeGeo, edgeMat);
  leftEdge.position.set(-span + segLen, y + bridgeConfig.yOffset, z);
  leftEdge.userData.kind = 'ruinBridgeEdge';
  leftEdge.userData.pulseSeed = seed * 0.18;
  leftEdge.userData.baseOpacity = bridgeConfig.edgeOpacity;
  group.add(leftEdge);

  const rightEdge = new THREE.Mesh(edgeGeo, edgeMat);
  rightEdge.position.set(span - segLen, y + bridgeConfig.yOffset, z);
  rightEdge.userData.kind = 'ruinBridgeEdge';
  rightEdge.userData.pulseSeed = seed * 0.18 + 0.7;
  rightEdge.userData.baseOpacity = bridgeConfig.edgeOpacity;
  group.add(rightEdge);

  // 中央に落下しかけの破片
  const chunk = new THREE.Mesh(
    new THREE.OctahedronGeometry(bridgeConfig.chunkSize, 0),
    deckMat
  );
  chunk.position.set(0, y + bridgeConfig.yOffset - bridgeConfig.chunkDrop, z);
  chunk.rotation.set(0.6, 0.4, 0.2);
  group.add(chunk);

  return group;
}

/**
 * 頭上を覆うエネルギー嵐の帯（オーロラ状の発光カーテン）を作ります。
 */
function createStormBand(seed, z, metrics, ruinConfig, deps) {
  const { THREE, pseudoRandom, getArrayColor } = deps;
  const stormConfig = ruinConfig.storm;
  const color = getArrayColor(stormConfig.colors, seed, 0x6a3cff);

  const band = new THREE.Mesh(
    new THREE.PlaneGeometry(
      stormConfig.widthBase + pseudoRandom(seed + 0.11) * stormConfig.widthRandom,
      stormConfig.heightBase + pseudoRandom(seed + 0.21) * stormConfig.heightRandom
    ),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: stormConfig.opacityBase + pseudoRandom(seed + 0.31) * stormConfig.opacityRandom,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  const y = stormConfig.yBase + pseudoRandom(seed + 0.41) * stormConfig.yRandom;
  const x = (pseudoRandom(seed + 0.51) * 2 - 1) * metrics.width * stormConfig.xRangeMultiplier;
  band.position.set(x, y, z);
  band.rotation.x = stormConfig.tiltX;
  band.rotation.z = (pseudoRandom(seed + 0.61) - 0.5) * 0.3;
  band.userData.kind = 'ruinStorm';
  band.userData.floatSeed = seed * 0.33;
  band.userData.baseY = y;
  band.userData.baseOpacity = band.material.opacity;
  band.userData.xLimit = metrics.width * stormConfig.xRangeMultiplier;
  band.userData.driftSpeed = stormConfig.driftSpeedBase + pseudoRandom(seed + 0.71) * stormConfig.driftSpeedRandom;

  return band;
}

// ── エントリポイント ─────────────────────────────────────────
/**
 * 「崩壊した天空都市」シーンを生成します。
 * 従来の heavenTemple と同じ入口・設定ルート・レーン構造を踏襲しています。
 */
export function createHeavenTempleScenery(deps) {
  const { CONFIG, THREE, pseudoRandom, getBackgroundMetrics } = deps;
  const group = new THREE.Group();
  const metrics = getBackgroundMetrics();
  const ruinConfig = CONFIG.sceneRefactor.heavenTemple;
  const sceneryConfig = ruinConfig.scenery;

  const sideX = Math.max(sceneryConfig.sideXMin, metrics.width * sceneryConfig.sideXWidthMultiplier);
  const laneCount = Math.max(
    sceneryConfig.laneCountMin,
    Math.ceil((metrics.depth + sceneryConfig.laneDepthPadding) / sceneryConfig.laneSpacing)
  );

  for (let i = 0; i < laneCount; i++) {
    const z = sceneryConfig.laneStartZ + i * sceneryConfig.laneSpacing;

    const leftIsland = createRuinIsland(i * 2, z, -1, sideX, metrics.heightFactor, ruinConfig, deps);
    const rightIsland = createRuinIsland(
      i * 2 + 1,
      z + sceneryConfig.rightIslandZOffset,
      1,
      sideX,
      metrics.heightFactor,
      ruinConfig,
      deps
    );
    group.add(leftIsland);
    group.add(rightIsland);

    const bridgeY = ruinConfig.island.yBase + metrics.heightFactor * ruinConfig.island.yHeightFactorMultiplier;

    if (i % sceneryConfig.bridgeEvery === 0) {
      group.add(createBrokenBridge(i, z + sceneryConfig.bridgeZOffset, sideX * ruinConfig.bridge.widthScale, bridgeY, ruinConfig, deps));
    }

    if (i % sceneryConfig.debrisEvery === 0) {
      group.add(createDebrisField(i * 3 + 1, z + sceneryConfig.debrisZOffset, metrics, ruinConfig, deps));
    }

    if (i % sceneryConfig.riftEvery === 0) {
      group.add(createEnergyRift(i * 5 + 1, z + sceneryConfig.riftZOffset, metrics, ruinConfig, deps));
    }

    if (i % sceneryConfig.hologramEvery === 0) {
      group.add(createGlitchHologram(i, z + sceneryConfig.hologramZOffset, -1, sideX, ruinConfig, deps));
      group.add(createGlitchHologram(i + 5, z + sceneryConfig.hologramZOffset + 70, 1, sideX, ruinConfig, deps));
    }

    if (i % sceneryConfig.emberEvery === 0) {
      group.add(createEmberStream(i * 7 + 1, z + sceneryConfig.emberZOffset, metrics, ruinConfig, deps));
    }

    if (i % sceneryConfig.stormEvery === 0) {
      group.add(createStormBand(i * 11 + 1, z + sceneryConfig.stormZOffset, metrics, ruinConfig, deps));
    }
  }

  return group;
}
