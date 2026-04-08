import * as THREE from 'https://unpkg.com/three@0.183.0/build/three.module.js';
import { VRButton } from 'https://unpkg.com/three@0.183.0/examples/jsm/webxr/VRButton.js';
import { CONFIG } from './config.js';
import { app } from './state.js';
import { disposeObject3D, pseudoRandom } from './utils.js';

function getCurrentTheme() {
  return CONFIG.sceneRefactor.themePresets[app.buildSettings.theme]
    || CONFIG.sceneRefactor.themePresets.space;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getArrayColor(colors, index, fallback) {
  return colors[index % colors.length] ?? fallback;
}

export function createSceneObjects() {
  const theme = getCurrentTheme();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(theme.sceneBackground);
  scene.fog = new THREE.FogExp2(theme.fogColor, theme.fogDensity);

  const camera = new THREE.PerspectiveCamera(
    CONFIG.scene.cameraFov,
    window.innerWidth / window.innerHeight,
    CONFIG.scene.cameraNear,
    CONFIG.scene.cameraFar
  );

  const cameraRig = new THREE.Group();
  cameraRig.add(camera);
  scene.add(cameraRig);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.scene.maxPixelRatio));
  renderer.xr.enabled = true;

  document.body.appendChild(renderer.domElement);
  document.body.appendChild(VRButton.createButton(renderer));

  const dirLight = new THREE.DirectionalLight(
    theme.lighting.directional.color,
    theme.lighting.directional.intensity
  );
  dirLight.position.copy(CONFIG.lighting.directional.position);
  scene.add(dirLight);

  const ambLight = new THREE.AmbientLight(
    theme.lighting.ambient.color,
    theme.lighting.ambient.intensity
  );
  scene.add(ambLight);

  const pointLight = new THREE.PointLight(
    theme.lighting.point.color,
    theme.lighting.point.intensity,
    CONFIG.lighting.point.distance
  );
  pointLight.position.copy(CONFIG.lighting.point.position);
  scene.add(pointLight);

  app.scene = scene;
  app.camera = camera;
  app.cameraRig = cameraRig;
  app.renderer = renderer;
  app.lights.directional = dirLight;
  app.lights.ambient = ambLight;
  app.lights.point = pointLight;

  if (navigator.xr?.isSessionSupported) {
    navigator.xr.isSessionSupported('immersive-vr')
      .then((supported) => {
        app.xr.isSupported = supported;
      })
      .catch(() => {
        app.xr.isSupported = false;
      });
  }

  renderer.xr.addEventListener('sessionstart', () => {
    app.xr.isPresenting = true;
  });

  renderer.xr.addEventListener('sessionend', () => {
    app.xr.isPresenting = false;
  });
}

function getGroundTextureConfig() {
  const theme = getCurrentTheme();
  return {
    ...CONFIG.ground.texture,
    ...theme.ground
  };
}

function getGroundMetrics() {
  const points = app.coursePoints || [];
  const metricsConfig = CONFIG.sceneRefactor.metrics;

  if (points.length === 0) {
    return {
      maxY: metricsConfig.noCourseMaxY,
      lastZ: metricsConfig.noCourseLastZ
    };
  }

  let maxY = 0;
  let lastZ = 0;

  for (const p of points) {
    if (p.y > maxY) maxY = p.y;
    if (p.z > lastZ) lastZ = p.z;
  }

  return { maxY, lastZ };
}

export function getDynamicGroundSize() {
  const { maxY, lastZ } = getGroundMetrics();
  const groundSizingConfig = CONFIG.sceneRefactor.groundSizing;

  const widthByHeight = maxY * groundSizingConfig.widthByHeightMultiplier;
  const width = Math.max(
    groundSizingConfig.baseWidth,
    Math.ceil((groundSizingConfig.baseWidth + widthByHeight) / groundSizingConfig.widthRoundUnit) *
      groundSizingConfig.widthRoundUnit
  );

  const depth = Math.max(
    groundSizingConfig.baseDepth,
    Math.ceil((lastZ + groundSizingConfig.depthPadding) / groundSizingConfig.depthRoundUnit) *
      groundSizingConfig.depthRoundUnit
  );

  return { width, depth };
}

function getBackgroundMetrics() {
  const { maxY, lastZ } = getGroundMetrics();
  const groundSize = getDynamicGroundSize();
  const metricsConfig = CONFIG.sceneRefactor.metrics;

  const heightFactor = clamp(
    maxY / metricsConfig.heightFactorDivisor,
    metricsConfig.heightFactorMin,
    metricsConfig.heightFactorMax
  );

  return {
    maxY,
    lastZ,
    width: groundSize.width,
    depth: groundSize.depth,
    sceneCenterZ: groundSize.depth / 2 - metricsConfig.sceneCenterZOffset,
    frontPad: metricsConfig.frontPad,
    backPad: metricsConfig.backPad,
    heightFactor
  };
}

function createGroundTexture() {
  const textureConfig = getGroundTextureConfig();
  const repeatConfig = CONFIG.sceneRefactor.groundTextureRepeat;
  const size = textureConfig.size;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('地面テクスチャ用の2Dコンテキスト取得に失敗しました。');
  }

  ctx.fillStyle = textureConfig.backgroundColor;
  ctx.fillRect(0, 0, size, size);

  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, textureConfig.gradTop);
  grad.addColorStop(0.5, textureConfig.gradMid);
  grad.addColorStop(1, textureConfig.gradBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const cells = textureConfig.cells;
  const cellSize = size / cells;
  ctx.strokeStyle = textureConfig.gridColor;
  ctx.lineWidth = 1;

  for (let i = 0; i <= cells; i++) {
    const p = i * cellSize;

    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }

  for (let i = 0; i < textureConfig.glowDotCount; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 1 + Math.random() * 2.2;

    ctx.fillStyle = textureConfig.glowDotColor;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  const groundSize = getDynamicGroundSize();
  texture.repeat.set(
    Math.max(
      repeatConfig.minRepeatX,
      Math.round(groundSize.width / repeatConfig.repeatDivisor)
    ),
    Math.max(
      repeatConfig.minRepeatZ,
      Math.round(groundSize.depth / repeatConfig.repeatDivisor)
    )
  );

  texture.anisotropy = app.renderer.capabilities.getMaxAnisotropy();

  return texture;
}

export function createGround() {
  const texture = createGroundTexture();
  const theme = getCurrentTheme();
  const groundSize = getDynamicGroundSize();

  const geo = new THREE.PlaneGeometry(
    groundSize.width,
    groundSize.depth,
    CONFIG.ground.segmentsX,
    CONFIG.ground.segmentsZ
  );

  const mat = new THREE.MeshLambertMaterial({
    map: texture,
    transparent: true,
    opacity: theme.ground.opacity
  });

  const ground = new THREE.Mesh(geo, mat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, CONFIG.ground.y, groundSize.depth / 2 - 100);

  app.scene.add(ground);
  app.ground = ground;
}

export function rebuildGround() {
  if (app.ground) {
    disposeObject3D(app.ground);
    app.scene.remove(app.ground);
    app.ground = null;
  }
  createGround();
}

function createStars() {
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

function createNebulaBands() {
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

function createSpaceOrbs() {
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

function createRingPlanet(index, z, x, y, scale) {
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

function createSpacePlanets() {
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

    group.add(createRingPlanet(i, z, x, y, scale));
  }

  return group;
}

function createCrystalCluster() {
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

function createAmusementLightPole(index, side, z, xOffset, heightFactor) {
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

function createTent(index, side, z, xOffset, heightFactor) {
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

function createFerrisWheel(z, x, heightFactor) {
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

function createAmusementSkyline() {
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

    group.add(createAmusementLightPole(lane * 2, -1, z, sideX, metrics.heightFactor));
    group.add(createAmusementLightPole(lane * 2 + 1, 1, z, sideX, metrics.heightFactor));

    if (lane % refactor.leftTentEvery === 0) {
      group.add(
        createTent(
          lane,
          -1,
          z + refactor.leftTentZOffset,
          sideX + refactor.leftTentXOffset,
          metrics.heightFactor
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
          metrics.heightFactor
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
    group.add(createFerrisWheel(z, x, metrics.heightFactor));
  }

  return group;
}

function createCityBuilding(index, z, side, xOffset, heightFactor) {
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

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (pseudoRandom(index * 200 + r * 31 + c * 17) < refactor.windowSkipThreshold) {
        continue;
      }

      const winGeo = new THREE.PlaneGeometry(refactor.windowWidth, refactor.windowHeight);
      const warm = pseudoRandom(index * 300 + r * 11 + c * 7);
      const color = warm < 0.5 ? 0xffd77a : (warm < 0.8 ? 0x9fd3ff : 0xff9ecf);

      const winMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: refactor.windowOpacity
      });

      const front = new THREE.Mesh(winGeo, winMat);
      front.position.set(
        -width / 2 +
          refactor.windowInsetX +
          c * ((width - refactor.windowInsetX * 2) / Math.max(1, cols - 1)),
        refactor.windowInsetY +
          r * ((height - refactor.windowInsetY * 2) / Math.max(1, rows - 1)),
        depth / 2 + refactor.windowInsetZ
      );
      group.add(front);

      const back = new THREE.Mesh(winGeo, winMat);
      back.position.set(front.position.x, front.position.y, -depth / 2 - refactor.windowInsetZ);
      back.rotation.y = Math.PI;
      group.add(back);
    }
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

function createStreetLamp(index, z, side, xOffset, heightFactor) {
  const refactor = CONFIG.sceneRefactor.cityNight.streetLamp;
  const lampGroup = new THREE.Group();

  const poleHeight =
    refactor.poleHeightBase +
    pseudoRandom(index + 1400) * refactor.poleHeightRandomMultiplier +
    heightFactor * refactor.poleHeightFactorMultiplier;

  const poleGeo = new THREE.CylinderGeometry(
    refactor.poleRadiusTop,
    refactor.poleRadiusBottom,
    poleHeight,
    refactor.poleRadialSegments
  );
  const poleMat = new THREE.MeshLambertMaterial({ color: 0xb8c2d6 });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = poleHeight / 2;
  lampGroup.add(pole);

  const headGeo = new THREE.SphereGeometry(
    refactor.headRadius,
    refactor.headWidthSegments,
    refactor.headHeightSegments
  );
  const headMat = new THREE.MeshBasicMaterial({ color: 0xffd58a });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = poleHeight + refactor.headYOffset;
  lampGroup.add(head);

  lampGroup.position.set(side * xOffset, 0, z);
  return lampGroup;
}

function createCityNightScenery() {
  const group = new THREE.Group();
  const metrics = getBackgroundMetrics();
  const refactor = CONFIG.sceneRefactor.cityNight.scenery;

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

    group.add(createCityBuilding(i * 2, z, -1, leftX, metrics.heightFactor));
    group.add(
      createCityBuilding(
        i * 2 + 1,
        z + refactor.rightBuildingZOffset,
        1,
        rightX,
        metrics.heightFactor
      )
    );

    if (i % refactor.lampEvery === 0) {
      group.add(
        createStreetLamp(
          i * 2,
          z + refactor.leftLampZOffset,
          -1,
          lampX,
          metrics.heightFactor
        )
      );
      group.add(
        createStreetLamp(
          i * 2 + 1,
          z + refactor.rightLampZOffset,
          1,
          lampX,
          metrics.heightFactor
        )
      );
    }
  }

  return group;
}

function createAnalysisBackdrop() {
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

function createFutureTower(seed, z, side, baseX, heightFactor, futureConfig) {
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

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const randomGate = pseudoRandom(seed * 0.13 + row * 0.31 + col * 0.73);
      if (randomGate > towerConfig.windowSkipThreshold) continue;

      const win = new THREE.Mesh(
        new THREE.PlaneGeometry(4.5, 6.5),
        windowMat
      );

      win.position.set(
        x - width * 0.5 + 8 + col * ((width - 16) / Math.max(1, cols - 1)),
        10 + row * ((height - 20) / Math.max(1, rows - 1)),
        z + depth * 0.5 + 0.2
      );
      group.add(win);
    }
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

function createSkyBridge(seed, z, halfSpan, futureConfig) {
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

function createHoverLane(seed, z, halfSpan, futureConfig) {
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

function createHologramBillboard(seed, z, side, sideX, futureConfig) {
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

function createTrafficStream(seed, z, halfSpan, futureConfig) {
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

function clearBackground() {
  if (app.backgroundGroup) {
    disposeObject3D(app.backgroundGroup);
    app.scene.remove(app.backgroundGroup);
    app.backgroundGroup = null;
  }
}

function createFutureCityScenery() {
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

    group.add(createFutureTower(i * 2, z, -1, sideX, metrics.heightFactor, futureConfig));
    group.add(createFutureTower(i * 2 + 1, z + sceneryConfig.rightTowerZOffset, 1, sideX, metrics.heightFactor, futureConfig));

    if (i % sceneryConfig.bridgeEvery === 0) {
      group.add(createSkyBridge(i, z + sceneryConfig.bridgeZOffset, sideX * 0.92, futureConfig));
    }

    if (i % sceneryConfig.hoverEvery === 0) {
      group.add(createHoverLane(i, z + sceneryConfig.hoverZOffset, sideX * 0.55, futureConfig));
    }

    if (i % sceneryConfig.hologramEvery === 0) {
      group.add(createHologramBillboard(i, z + 20, -1, sideX, futureConfig));
      group.add(createHologramBillboard(i + 5, z + 80, 1, sideX, futureConfig));
    }

    if (i % sceneryConfig.trafficEvery === 0) {
      group.add(createTrafficStream(i, z + 26, sideX * 0.9, futureConfig));
      group.add(createTrafficStream(i + 3, z + 34, sideX * 0.9, futureConfig));
    }
  }

  return group;
}

function createHeavenTempleIsland(seed, z, side, baseX, heightFactor, heavenConfig) {
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
  const colY = templeBase.position.y + templeConfig.columnHeightBase * 0.5;

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

function createHeavenBridge(seed, z, span, y, heavenConfig) {
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

function createHeavenCloud(seed, z, metrics, heavenConfig) {
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

function createHeavenAura(seed, z, side, sideX, heavenConfig) {
  const auraConfig = heavenConfig.aura;
  const width = auraConfig.widthBase + pseudoRandom(seed + 0.1) * auraConfig.widthRandom;
  const height = auraConfig.heightBase + pseudoRandom(seed + 0.2) * auraConfig.heightRandom;
  const color = getArrayColor(auraConfig.colors, seed, 0xfff7d1);
  const opacity = auraConfig.opacityBase + pseudoRandom(seed + 0.3) * auraConfig.opacityRandom;

  const aura = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );

  const x = side * (sideX - auraConfig.xInset);
  const y = auraConfig.yBase + pseudoRandom(seed + 0.4) * auraConfig.yRandom;

  aura.position.set(x, y, z);
  aura.rotation.y = side < 0 ? Math.PI * 0.12 : -Math.PI * 0.12;
  aura.userData.kind = 'heavenAura';
  aura.userData.waveSeed = seed * 0.29;
  aura.userData.baseOpacity = opacity;
  aura.userData.baseY = y;

  return aura;
}

function createHeavenSigil(seed, z, side, sideX, islandY, heavenConfig) {
  const sigilConfig = heavenConfig.sigil;
  const radius = sigilConfig.radiusBase + pseudoRandom(seed + 0.1) * sigilConfig.radiusRandom;
  const x = side * (sideX - 18 - pseudoRandom(seed + 0.2) * 30);

  const sigilGroup = new THREE.Group();
  sigilGroup.position.set(x, islandY + sigilConfig.yOffset, z);
  sigilGroup.userData.kind = 'heavenSigilGroup';
  sigilGroup.userData.spinSeed = seed * 0.41;

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, sigilConfig.tube, 10, 40),
    new THREE.MeshBasicMaterial({
      color: sigilConfig.color,
      transparent: true,
      opacity: sigilConfig.opacity,
      depthWrite: false
    })
  );
  ring.rotation.x = Math.PI * 0.5;
  ring.userData.kind = 'heavenSigil';
  ring.userData.baseOpacity = sigilConfig.opacity;
  sigilGroup.add(ring);

  for (let i = 0; i < sigilConfig.glyphCount; i++) {
    const angle = (i / sigilConfig.glyphCount) * Math.PI * 2;
    const glyph = new THREE.Mesh(
      new THREE.PlaneGeometry(sigilConfig.glyphWidth, sigilConfig.glyphHeight),
      new THREE.MeshBasicMaterial({
        color: sigilConfig.color,
        transparent: true,
        opacity: sigilConfig.opacity * 0.74,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );

    glyph.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    glyph.lookAt(0, 1, 0);
    glyph.userData.kind = 'heavenSigilGlyph';
    glyph.userData.baseOpacity = sigilConfig.opacity * 0.74;
    glyph.userData.pulseSeed = seed * 0.53 + i * 0.4;
    sigilGroup.add(glyph);
  }

  return sigilGroup;
}

function createHeavenMote(seed, z, metrics, heavenConfig) {
  const moteConfig = heavenConfig.motes;
  const size = moteConfig.sizeBase + pseudoRandom(seed + 0.1) * moteConfig.sizeRandom;
  const xRange = Math.max(280, metrics.width * moteConfig.xRangeMultiplier);
  const x = (pseudoRandom(seed + 0.2) * 2 - 1) * xRange;
  const y = moteConfig.yBase + pseudoRandom(seed + 0.3) * moteConfig.yRandom;
  const color = getArrayColor(moteConfig.colors, seed, 0xfff6cf);
  const opacity = moteConfig.opacityBase + pseudoRandom(seed + 0.4) * moteConfig.opacityRandom;

  const mote = new THREE.Mesh(
    new THREE.SphereGeometry(size, 8, 8),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false
    })
  );

  mote.position.set(x, y, z);
  mote.userData.kind = 'heavenMote';
  mote.userData.baseOpacity = opacity;
  mote.userData.seed = seed * 0.67;
  mote.userData.riseSpeed = 0.08 + pseudoRandom(seed + 0.5) * 0.14;
  mote.userData.xDrift = (pseudoRandom(seed + 0.6) * 2 - 1) * 0.08;
  mote.userData.zDrift = (pseudoRandom(seed + 0.7) * 2 - 1) * 0.05;
  mote.userData.resetBaseY = moteConfig.yBase - 12;

  return mote;
}

function createHeavenTempleScenery() {
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
    const islandY = heavenConfig.island.yBase + metrics.heightFactor * heavenConfig.island.yHeightFactorMultiplier;

    const leftIsland = createHeavenTempleIsland(i * 2, z, -1, sideX, metrics.heightFactor, heavenConfig);
    const rightIsland = createHeavenTempleIsland(
      i * 2 + 1,
      z + sceneryConfig.rightIslandZOffset,
      1,
      sideX,
      metrics.heightFactor,
      heavenConfig
    );

    group.add(leftIsland);
    group.add(rightIsland);

    if (i % sceneryConfig.bridgeEvery === 0) {
      const bridgeY = CONFIG.sceneRefactor.heavenTemple.island.yBase + metrics.heightFactor * CONFIG.sceneRefactor.heavenTemple.island.yHeightFactorMultiplier;
      group.add(createHeavenBridge(i, z + sceneryConfig.bridgeZOffset, sideX * heavenConfig.bridge.widthScale, bridgeY, heavenConfig));
    }

    if (i % sceneryConfig.cloudEvery === 0) {
      group.add(createHeavenCloud(i * 3 + 1, z + sceneryConfig.cloudZOffset, metrics, heavenConfig));
      group.add(createHeavenCloud(i * 3 + 2, z + sceneryConfig.cloudZOffset + 60, metrics, heavenConfig));
    }

    if (i % sceneryConfig.auraEvery === 0) {
      group.add(createHeavenAura(i * 5 + 1, z + sceneryConfig.auraZOffset, -1, sideX, heavenConfig));
      group.add(createHeavenAura(i * 5 + 2, z + sceneryConfig.auraZOffset + 46, 1, sideX, heavenConfig));
    }

    if (i % sceneryConfig.sigilEvery === 0) {
      group.add(createHeavenSigil(i * 7 + 1, z + sceneryConfig.sigilZOffset, -1, sideX, islandY, heavenConfig));
      group.add(createHeavenSigil(i * 7 + 2, z + sceneryConfig.sigilZOffset + 70, 1, sideX, islandY, heavenConfig));
    }

    for (let m = 0; m < sceneryConfig.motesPerLane; m++) {
      const moteSeed = i * 17 + m * 3 + 1;
      group.add(createHeavenMote(moteSeed, z + (m - 3) * 10, metrics, heavenConfig));
    }
  }

  return group;
}

export function createBackground() {
  clearBackground();

  const backgroundGroup = new THREE.Group();
  const theme = getCurrentTheme();

  if (theme.backgroundKind === 'space') {
    const stars = createStars();
    stars.userData.kind = 'stars';
    backgroundGroup.add(stars);

    const nebula = createNebulaBands();
    nebula.userData.kind = 'nebula';
    backgroundGroup.add(nebula);

    const orbs = createSpaceOrbs();
    orbs.userData.kind = 'spaceOrbs';
    backgroundGroup.add(orbs);

    const planets = createSpacePlanets();
    planets.userData.kind = 'spacePlanets';
    backgroundGroup.add(planets);

    const crystals = createCrystalCluster();
    crystals.userData.kind = 'spaceCrystals';
    backgroundGroup.add(crystals);
  } else if (theme.backgroundKind === 'amusement') {
    const skyline = createAmusementSkyline();
    skyline.userData.kind = 'amusement';
    backgroundGroup.add(skyline);
  } else if (theme.backgroundKind === 'analysis') {
    const backdrop = createAnalysisBackdrop();
    backdrop.userData.kind = 'analysis';
    backgroundGroup.add(backdrop);
  } else if (theme.backgroundKind === 'cityNight') {
    const city = createCityNightScenery();
    city.userData.kind = 'cityNight';
    backgroundGroup.add(city);
  } else if (theme.backgroundKind === 'futureCity') {
    const city = createFutureCityScenery();
    city.userData.kind = 'futureCity';
    backgroundGroup.add(city);
  } else if (theme.backgroundKind === 'heavenTemple') {
    const temple = createHeavenTempleScenery();
    temple.userData.kind = 'heavenTemple';
    backgroundGroup.add(temple);
  }

  app.scene.add(backgroundGroup);
  app.backgroundGroup = backgroundGroup;
}

function clearGuides() {
  if (app.guideGroup) {
    disposeObject3D(app.guideGroup);
    app.scene.remove(app.guideGroup);
    app.guideGroup = null;
  }
}

function createHeightGuides() {
  clearGuides();

  if (!app.buildSettings.showHeightGuides) {
    return;
  }

  const guideGroup = new THREE.Group();
  const theme = getCurrentTheme();
  const { maxY } = getGroundMetrics();
  const guideConfig = CONFIG.sceneRefactor.guides;

  const guideStep = Math.max(
    guideConfig.stepMin,
    Math.ceil(maxY / guideConfig.stepDivisor / guideConfig.stepRoundUnit) *
      guideConfig.stepRoundUnit
  );

  const width = Math.max(
    guideConfig.widthMin,
    getDynamicGroundSize().width * guideConfig.widthMultiplier
  );

  const depth =
    app.coursePoints.length > 0
      ? app.coursePoints[app.coursePoints.length - 1].z + guideConfig.builtDepthPadding
      : guideConfig.fallbackDepth;

  for (let y = 0; y <= maxY + guideStep; y += guideStep) {
    const points = [
      new THREE.Vector3(-width, y, guideConfig.lineStartZ),
      new THREE.Vector3(width, y, depth)
    ];

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineDashedMaterial({
      color: theme.guideColor,
      transparent: true,
      opacity: theme.guideOpacity,
      dashSize: guideConfig.dashSize,
      gapSize: guideConfig.gapSize
    });

    const line = new THREE.Line(geo, mat);
    line.computeLineDistances();
    guideGroup.add(line);
  }

  const sampleStep = Math.max(
    1,
    Math.floor(app.coursePoints.length / guideConfig.sampleCountTarget)
  );

  for (let i = 0; i < app.coursePoints.length; i += sampleStep) {
    const p = app.coursePoints[i];

    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(p.x, CONFIG.ground.y, p.z),
      new THREE.Vector3(p.x, p.y, p.z)
    ]);

    const mat = new THREE.LineBasicMaterial({
      color: theme.guideColor,
      transparent: true,
      opacity: theme.guideOpacity + guideConfig.verticalOpacityBoost
    });

    const line = new THREE.Line(geo, mat);
    guideGroup.add(line);
  }

  app.scene.add(guideGroup);
  app.guideGroup = guideGroup;
}

export function sampleCurvePoint(curve, t) {
  if (!curve) return new THREE.Vector3();
  return curve.getPoint(Math.min(Math.max(t, 0), 1));
}

export function updateCameraPosition(curve, t, lookAhead) {
  const pos = sampleCurvePoint(curve, t);
  const look = sampleCurvePoint(curve, Math.min(t + lookAhead, 1));

  const target = app.cameraRig || app.camera;

  target.position.set(
    pos.x,
    pos.y + CONFIG.camera.rideHeight,
    pos.z
  );

  const dx = look.x - pos.x;
  const dz = look.z - pos.z;

  if (app.xr.isPresenting && app.cameraRig) {
    const yaw = Math.atan2(dx, dz) + Math.PI;
    app.cameraRig.rotation.set(0, yaw, 0);
  } else {
    app.camera.lookAt(
      look.x,
      look.y + CONFIG.camera.lookAtYOffset,
      look.z + CONFIG.camera.lookAtZOffset
    );
  }
}

export function rebuildSceneTheme() {
  const theme = getCurrentTheme();

  app.scene.background = new THREE.Color(theme.sceneBackground);
  app.scene.fog = new THREE.FogExp2(theme.fogColor, theme.fogDensity);

  app.lights.directional.color.setHex(theme.lighting.directional.color);
  app.lights.directional.intensity = theme.lighting.directional.intensity;

  app.lights.ambient.color.setHex(theme.lighting.ambient.color);
  app.lights.ambient.intensity = theme.lighting.ambient.intensity;

  app.lights.point.color.setHex(theme.lighting.point.color);
  app.lights.point.intensity = theme.lighting.point.intensity;

  rebuildGround();
  createBackground();
  createHeightGuides();
}

export function animateBackground() {
  if (!app.backgroundGroup) return;

  const animationConfig = CONFIG.sceneRefactor.animation;
  const amusementAnimationConfig = CONFIG.sceneRefactor.amusement.animation;

  for (const child of app.backgroundGroup.children) {
    if (child.userData.kind === 'nebula') {
      for (let i = 0; i < child.children.length; i++) {
        child.children[i].rotation.z +=
          CONFIG.background.nebula.spinSpeed *
          animationConfig.nebulaSpinMultiplier *
          (i % 2 === 0 ? 1 : -1);
      }
    }

    if (child.userData.kind === 'amusement') {
      for (const part of child.children) {
        if (part.userData.spin) {
          part.rotation.z += amusementAnimationConfig.spinStep;
        }
      }
    }

    if (child.userData.kind === 'spaceOrbs') {
      for (let i = 0; i < child.children.length; i++) {
        const orb = child.children[i];
        const seed = orb.userData.floatSeed || i;
        orb.position.y +=
          Math.sin(performance.now() * animationConfig.orbFloatTimeMultiplier + seed) *
          animationConfig.orbFloatAmplitude;
      }
    }

    if (child.userData.kind === 'spacePlanets') {
      for (const part of child.children) {
        if (part.userData.kind === 'spacePlanet') {
          part.rotation.y += part.userData.spinSpeed || animationConfig.planetFallbackSpin;
        }
      }
    }

    if (child.userData.kind === 'futureCity') {
      const futureConfig = CONFIG.sceneRefactor.futureCity;
      const beaconConfig = futureConfig.beacon;
      const hoverConfig = futureConfig.hoverLane;
      const hologramConfig = futureConfig.hologram;
      const tempo = futureConfig.animation.tempo;
      const time = performance.now() * 0.003 * tempo;

      child.traverse((part) => {
        if (part.userData.kind === 'futureBeacon') {
          const seed = part.userData.blinkSeed || 0;
          const s =
            beaconConfig.pulseScaleBase +
            Math.sin(time * beaconConfig.pulseSpeed + seed) * beaconConfig.pulseScaleAmplitude;
          part.scale.setScalar(Math.max(0.6, s));
          if (part.material && 'opacity' in part.material) {
            const baseOpacity = part.userData.baseOpacity ?? beaconConfig.baseOpacity;
            part.material.opacity =
              baseOpacity +
              Math.sin(time * beaconConfig.pulseSpeed + seed) * beaconConfig.pulseOpacity;
          }
        }

        if (part.userData.kind === 'futureBeaconHalo') {
          const seed = part.userData.blinkSeed || 0;
          if (part.material && 'opacity' in part.material) {
            const baseOpacity = part.userData.baseOpacity ?? 0.24;
            part.material.opacity = baseOpacity + Math.sin(time * beaconConfig.pulseSpeed + seed) * 0.12;
          }
        }

        if (part.userData.kind === 'futureRooftopRing') {
          const seed = part.userData.pulseSeed || 0;
          part.rotation.z += 0.015;
          if (part.material && 'emissiveIntensity' in part.material) {
            part.material.emissiveIntensity =
              CONFIG.sceneRefactor.futureCity.tower.rooftopRingEmissiveIntensity +
              Math.sin(time * 2.1 + seed) * 0.35;
          }
        }

        if (part.userData.kind === 'futureBridgeStrip') {
          const seed = part.userData.pulseSeed || 0;
          if (part.material && 'opacity' in part.material) {
            const baseOpacity = part.userData.baseOpacity ?? 0.52;
            part.material.opacity = baseOpacity + Math.sin(time * 2.8 + seed) * 0.18;
          }
        }

        if (part.userData.kind === 'futureHoverLane') {
          const seed = part.userData.floatSeed || 0;
          const baseY = part.userData.baseY ?? hoverConfig.y;
          part.position.y = baseY + Math.sin(time + seed) * hoverConfig.floatAmplitude;
          if (part.material && 'opacity' in part.material) {
            const baseOpacity = part.userData.baseOpacity ?? hoverConfig.baseOpacity;
            part.material.opacity = baseOpacity + Math.sin(time * 1.8 + seed) * hoverConfig.pulseOpacity;
          }
        }

        if (part.userData.kind === 'futureHoverLaneRing') {
          const seed = part.userData.floatSeed || 0;
          const baseY = part.userData.baseY ?? (hoverConfig.y - 1.4);
          part.position.y = baseY + Math.sin(time * 1.15 + seed) * (hoverConfig.floatAmplitude * 0.8);
          part.rotation.z += 0.03;
          if (part.material && 'opacity' in part.material) {
            const baseOpacity = part.userData.baseOpacity ?? hoverConfig.ringOpacity;
            part.material.opacity = baseOpacity + Math.sin(time * 2.0 + seed) * 0.14;
          }
        }

        if (part.userData.kind === 'futureHologram') {
          const seed = part.userData.pulseSeed || 0;
          if (part.material && 'opacity' in part.material) {
            const baseOpacity = part.userData.baseOpacity ?? hologramConfig.baseOpacity;
            part.material.opacity = baseOpacity + Math.sin(time * 1.9 + seed) * hologramConfig.pulseOpacity;
          }
          part.position.y += Math.sin(time * 0.8 + seed) * 0.03;
        }

        if (part.userData.kind === 'futureTraffic') {
          const speed = part.userData.speed || 0.02;
          const halfSpan = part.userData.halfSpan || 120;
          const trailLength = part.userData.trailLength || 10;
          part.position.x += speed * 60;
          if (part.position.x > halfSpan + trailLength) {
            part.position.x = -halfSpan - trailLength;
          }
        }
      });
    }

    if (child.userData.kind === 'heavenTemple') {
      const heavenConfig = CONFIG.sceneRefactor.heavenTemple;
      const animation = heavenConfig.animation;
      const time = performance.now() * 0.0024 * animation.tempo;

      child.traverse((part) => {
        if (part.userData.kind === 'heavenHalo') {
          const seed = part.userData.spinSeed || 0;
          part.rotation.z += animation.haloSpin;
          if (part.material && 'opacity' in part.material) {
            const baseOpacity = part.userData.baseOpacity ?? 0.6;
            part.material.opacity =
              baseOpacity +
              Math.sin(time * animation.bannerPulseSpeed + seed) * animation.bannerPulseAmplitude;
          }
        }

        if (part.userData.kind === 'heavenRim') {
          const seed = part.userData.pulseSeed || 0;
          part.rotation.z -= animation.haloSpin * 0.65;
          if (part.material && 'opacity' in part.material) {
            const baseOpacity = part.userData.baseOpacity ?? 0.5;
            part.material.opacity = baseOpacity + Math.sin(time * 1.7 + seed) * 0.16;
          }
        }

        if (part.userData.kind === 'heavenOrb') {
          const seed = part.userData.floatSeed || 0;
          const baseY = part.userData.baseY || part.position.y;
          part.position.y = baseY + Math.sin(time * 1.2 + seed) * 1.8;
          if (part.material && 'emissiveIntensity' in part.material) {
            const baseEmissive = part.userData.baseEmissive || 1.0;
            part.material.emissiveIntensity =
              baseEmissive +
              Math.sin(time * animation.orbPulseSpeed + seed) * animation.orbPulseAmplitude;
          }
        }

        if (part.userData.kind === 'heavenCloud') {
          const seed = part.userData.floatSeed || 0;
          const speed = part.userData.driftSpeed || 0.1;
          const xLimit = part.userData.xLimit || 300;
          const baseY = part.userData.baseY || part.position.y;

          part.position.x += speed;
          if (part.position.x > xLimit) {
            part.position.x = -xLimit;
          }

          part.position.y =
            baseY +
            Math.sin(time * animation.cloudFloatSpeed + seed) * animation.cloudFloatAmplitude;

          if (part.material && 'opacity' in part.material) {
            const baseOpacity = part.userData.baseOpacity || 0.25;
            part.material.opacity = baseOpacity + Math.sin(time * 1.4 + seed) * 0.08;
          }
        }

        if (part.userData.kind === 'heavenBridgeRail') {
          const seed = part.userData.pulseSeed || 0;
          if (part.material && 'opacity' in part.material) {
            const baseOpacity = part.userData.baseOpacity || 0.68;
            part.material.opacity =
              baseOpacity +
              Math.sin(time * animation.bannerPulseSpeed + seed) * animation.bannerPulseAmplitude;
          }
        }

        if (part.userData.kind === 'heavenAura') {
          const seed = part.userData.waveSeed || 0;
          const baseY = part.userData.baseY || part.position.y;
          part.position.y = baseY + Math.sin(time * animation.auraWaveSpeed + seed) * 1.2;
          if (part.material && 'opacity' in part.material) {
            const baseOpacity = part.userData.baseOpacity || 0.2;
            part.material.opacity =
              baseOpacity +
              Math.sin(time * (animation.auraWaveSpeed + 0.5) + seed) * animation.auraWaveAmplitude;
          }
        }

        if (part.userData.kind === 'heavenSigilGroup') {
          const seed = part.userData.spinSeed || 0;
          part.rotation.y += animation.sigilSpin;
          part.position.y += Math.sin(time * 0.8 + seed) * 0.05;
        }

        if (part.userData.kind === 'heavenSigil') {
          if (part.material && 'opacity' in part.material) {
            const baseOpacity = part.userData.baseOpacity || 0.66;
            part.material.opacity =
              baseOpacity + Math.sin(time * animation.bannerPulseSpeed) * animation.sigilPulseAmplitude;
          }
        }

        if (part.userData.kind === 'heavenSigilGlyph') {
          const seed = part.userData.pulseSeed || 0;
          if (part.material && 'opacity' in part.material) {
            const baseOpacity = part.userData.baseOpacity || 0.48;
            part.material.opacity =
              baseOpacity + Math.sin(time * 2.3 + seed) * (animation.sigilPulseAmplitude * 0.7);
          }
        }

        if (part.userData.kind === 'heavenMote') {
          const riseSpeed = part.userData.riseSpeed || 0.08;
          const xDrift = part.userData.xDrift || 0;
          const zDrift = part.userData.zDrift || 0;
          const seed = part.userData.seed || 0;
          const resetBaseY = part.userData.resetBaseY || 60;
          const resetY = animation.moteRiseResetY;

          part.position.y += riseSpeed * animation.moteRiseSpeed;
          part.position.x += xDrift;
          part.position.z += zDrift;

          if (part.position.y > resetY) {
            part.position.y = resetBaseY + Math.sin(time + seed) * 8;
          }

          if (part.material && 'opacity' in part.material) {
            const baseOpacity = part.userData.baseOpacity || 0.6;
            part.material.opacity =
              baseOpacity +
              Math.sin(time * animation.moteTwinkleSpeed + seed) * animation.moteTwinkleAmplitude;
          }
        }
      });
    }
  }
}

export function refreshGuidesAfterCourseBuild() {
  createHeightGuides();
}