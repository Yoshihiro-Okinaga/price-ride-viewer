import * as THREE from 'https://unpkg.com/three@0.183.0/build/three.module.js';
import { VRButton } from 'https://unpkg.com/three@0.183.0/examples/jsm/webxr/VRButton.js';
import { CONFIG } from './config.js';
import { app } from './state.js';
import { disposeObject3D, pseudoRandom } from './utils.js';

const THEMES = {
  space: {
    sceneBackground: 0x020612,
    fogColor: 0x061020,
    fogDensity: 0.00026,
    ground: {
      opacity: 0.96,
      backgroundColor: '#040815',
      gradTop: 'rgba(80,150,255,0.18)',
      gradMid: 'rgba(0,0,0,0.00)',
      gradBottom: 'rgba(255,80,210,0.16)',
      gridColor: 'rgba(255,255,255,0.95)',
      glowDotColor: 'rgba(220,240,255,0.30)',
      cells: 16
    },
    lighting: {
      directional: { color: 0xf2f6ff, intensity: 1.12 },
      ambient: { color: 0xb9c7ff, intensity: 1.04 },
      point: { color: 0x8ae0ff, intensity: 1.45 }
    },
    backgroundKind: 'space',
    guideColor: 0xb7deff,
    guideOpacity: 0.36
  },

  amusement: {
    sceneBackground: 0x00ff00,
    fogColor: 0x88ff88,
    fogDensity: 0.00001,
    ground: {
      opacity: 1.0,
      backgroundColor: '#ccff66',
      gradTop: 'rgba(255,255,255,0.00)',
      gradMid: 'rgba(255,255,255,0.00)',
      gradBottom: 'rgba(255,255,255,0.00)',
      gridColor: 'rgba(255,0,0,0.55)',
      glowDotColor: 'rgba(255,255,0,0.20)',
      cells: 8
    },
    lighting: {
      directional: { color: 0xffffff, intensity: 1.5 },
      ambient: { color: 0xffffff, intensity: 1.2 },
      point: { color: 0xffaa00, intensity: 1.2 }
    },
    backgroundKind: 'amusement',
    guideColor: 0xff0000,
    guideOpacity: 0.35
  },

  analysis: {
    sceneBackground: 0xffffff,
    fogColor: 0xffffff,
    fogDensity: 0.00001,
    ground: {
      opacity: 1.0,
      backgroundColor: '#eeeeee',
      gradTop: 'rgba(0,0,0,0.00)',
      gradMid: 'rgba(0,0,0,0.00)',
      gradBottom: 'rgba(0,0,0,0.00)',
      gridColor: 'rgba(0,0,255,0.35)',
      glowDotColor: 'rgba(0,0,0,0.00)',
      cells: 18
    },
    lighting: {
      directional: { color: 0xffffff, intensity: 1.0 },
      ambient: { color: 0xffffff, intensity: 1.2 },
      point: { color: 0xffffff, intensity: 0.0 }
    },
    backgroundKind: 'analysis',
    guideColor: 0x0000ff,
    guideOpacity: 0.25
  }
};

function getCurrentTheme() {
  return THEMES[app.buildSettings.theme] || THEMES.space;
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
  if (points.length === 0) {
    return {
      maxY: 120,
      lastZ: 3000
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

  const baseWidth = 320;
  const widthByHeight = maxY * 1.8;
  const width = Math.max(baseWidth, Math.ceil((baseWidth + widthByHeight) / 20) * 20);

  const baseDepth = 3000;
  const depth = Math.max(baseDepth, Math.ceil((lastZ + 1000) / 100) * 100);

  return { width, depth };
}

function getBackgroundMetrics() {
  const { maxY, lastZ } = getGroundMetrics();
  const groundSize = getDynamicGroundSize();

  const heightFactor = Math.max(1, Math.min(4, maxY / 140));

  return {
    maxY,
    lastZ,
    width: groundSize.width,
    depth: groundSize.depth,
    sceneCenterZ: groundSize.depth / 2 - 100,
    frontPad: 300,
    backPad: 800,
    heightFactor
  };
}

function createGroundTexture() {
  const textureConfig = getGroundTextureConfig();
  const size = textureConfig.size;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

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
    Math.max(8, Math.round(groundSize.width / 40)),
    Math.max(20, Math.round(groundSize.depth / 40))
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
  const metrics = getBackgroundMetrics();
  const count = Math.max(
    starConfig.count,
    Math.ceil(metrics.depth / 2.6) + Math.ceil(metrics.width * 2.8)
  );

  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * Math.max(starConfig.rangeX, metrics.width * 9);
    positions[i * 3 + 1] = starConfig.minY + Math.random() * Math.max(starConfig.rangeY, metrics.maxY * 3.2 + 1200);
    positions[i * 3 + 2] = -metrics.frontPad + Math.random() * (metrics.depth + metrics.backPad);
    sizes[i] = 1.0 + Math.random() * 2.5;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    color: 0xf6fbff,
    size: starConfig.size * 1.25,
    sizeAttenuation: true,
    transparent: true,
    opacity: 1.0,
    depthTest: true,
    depthWrite: false
  });

  return new THREE.Points(geo, mat);
}

function createNebulaBands() {
  const metrics = getBackgroundMetrics();
  const group = new THREE.Group();

  const startZ = -150;
  const endZ = metrics.depth + 500;
  const spacing = 360;
  const count = Math.max(18, Math.ceil((endZ - startZ) / spacing));
  const nebulaColors = [0x42e8ff, 0xff4fd8, 0x7a6bff, 0xffffff, 0x7cf7ff];

  for (let i = 0; i < count; i++) {
    const scale = 1 + pseudoRandom(i + 200) * 0.5 + metrics.heightFactor * 0.22;
    const geo = new THREE.PlaneGeometry(
      (900 + (i % 3) * 180) * scale,
      (220 + (i % 2) * 80) * scale
    );

    const color = nebulaColors[i % nebulaColors.length];
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.16 + (i % 4) * 0.01,
      depthTest: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      (pseudoRandom(i + 101) - 0.5) * Math.max(1500, metrics.width * 1.7),
      180 + pseudoRandom(i + 102) * (metrics.maxY * 0.9 + 700),
      startZ + i * spacing
    );
    mesh.rotation.x = -0.15 - pseudoRandom(i + 103) * 0.35;
    mesh.rotation.y = (pseudoRandom(i + 104) - 0.5) * 0.8;
    mesh.rotation.z = (pseudoRandom(i + 105) - 0.5) * 0.6;

    group.add(mesh);
  }

  return group;
}

function createSpaceOrbs() {
  const metrics = getBackgroundMetrics();
  const group = new THREE.Group();
  const count = Math.max(18, Math.ceil(metrics.depth / 700));

  const colors = [0x70e9ff, 0xff8ce8, 0xd9c2ff, 0xffffff];

  for (let i = 0; i < count; i++) {
    const radius = 20 + pseudoRandom(i + 500) * 55 + metrics.heightFactor * 10;
    const geo = new THREE.SphereGeometry(radius, 20, 20);
    const mat = new THREE.MeshBasicMaterial({
      color: colors[i % colors.length],
      transparent: true,
      opacity: 0.12 + pseudoRandom(i + 501) * 0.08
    });

    const orb = new THREE.Mesh(geo, mat);
    orb.position.set(
      (pseudoRandom(i + 502) - 0.5) * Math.max(420, metrics.width * 0.95),
      80 + pseudoRandom(i + 503) * (metrics.maxY * 0.9 + 260),
      150 + i * (metrics.depth / Math.max(1, count - 1))
    );
    orb.userData.floatSeed = i;
    orb.userData.kind = 'spaceOrb';
    group.add(orb);
  }

  return group;
}

function createRingPlanet(index, z, x, y, scale) {
  const group = new THREE.Group();

  const planetRadius = 55 * scale;
  const planetGeo = new THREE.SphereGeometry(planetRadius, 28, 28);
  const planetMat = new THREE.MeshLambertMaterial({
    color: index % 2 === 0 ? 0x7cd8ff : 0xcba8ff,
    emissive: index % 2 === 0 ? 0x16334a : 0x2d1742,
    emissiveIntensity: 0.35
  });
  const planet = new THREE.Mesh(planetGeo, planetMat);
  group.add(planet);

  const ringGeo = new THREE.TorusGeometry(planetRadius * 1.65, planetRadius * 0.15, 12, 48);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xf8ffff,
    transparent: true,
    opacity: 0.45
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI * 0.35;
  ring.rotation.y = Math.PI * 0.15;
  group.add(ring);

  group.position.set(x, y, z);
  group.userData.kind = 'spacePlanet';
  group.userData.spinSpeed = 0.001 + index * 0.00008;

  return group;
}

function createSpacePlanets() {
  const metrics = getBackgroundMetrics();
  const group = new THREE.Group();
  const count = Math.max(3, Math.ceil(metrics.depth / 3200));

  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = side * Math.max(260, metrics.width * (0.33 + (i % 2) * 0.08));
    const y = 180 + pseudoRandom(i + 620) * (metrics.maxY * 0.9 + 260);
    const z = 900 + i * 3000;
    const scale = 0.9 + pseudoRandom(i + 621) * 1.1 + metrics.heightFactor * 0.08;
    group.add(createRingPlanet(i, z, x, y, scale));
  }

  return group;
}

function createCrystalCluster() {
  const metrics = getBackgroundMetrics();
  const group = new THREE.Group();
  const laneSpacing = 520;
  const count = Math.max(10, Math.ceil(metrics.depth / laneSpacing));

  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const height = 50 + pseudoRandom(i + 710) * 180 + metrics.heightFactor * 30;
    const radius = 10 + pseudoRandom(i + 711) * 16;
    const geo = new THREE.ConeGeometry(radius, height, 6);
    const mat = new THREE.MeshLambertMaterial({
      color: i % 2 === 0 ? 0x8ef8ff : 0xf4a4ff,
      emissive: i % 2 === 0 ? 0x144f55 : 0x4a143e,
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.82
    });

    const crystal = new THREE.Mesh(geo, mat);
    crystal.position.set(
      side * Math.max(110, metrics.width * (0.20 + pseudoRandom(i + 712) * 0.10)),
      height / 2 - 8,
      120 + i * laneSpacing
    );
    crystal.rotation.y = pseudoRandom(i + 713) * Math.PI * 2;
    group.add(crystal);
  }

  return group;
}

function createAmusementLightPole(index, side, z, xOffset, heightFactor) {
  const poleGroup = new THREE.Group();

  const randA = pseudoRandom(index * 17 + (side < 0 ? 3 : 7));
  const randB = pseudoRandom(index * 29 + (side < 0 ? 11 : 19));

  const baseHeight = 44 + heightFactor * 22;
  const randomScale = 0.78 + randA * 0.70;
  const sideBias = side < 0 ? 0.96 : 1.04;

  let poleHeight = baseHeight * randomScale * sideBias;
  poleHeight = Math.max(34, Math.min(poleHeight, 120 + heightFactor * 18));

  const bulbRadius = Math.max(4.5, Math.min(9.5, 4.8 + heightFactor * 1.2 + randB * 1.6));

  const poleGeo = new THREE.CylinderGeometry(1.8, 1.8, poleHeight, 8);
  const poleMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = poleHeight / 2;
  poleGroup.add(pole);

  const bulbGeo = new THREE.SphereGeometry(bulbRadius, 12, 12);
  const bulbMat = new THREE.MeshBasicMaterial({
    color: index % 3 === 0 ? 0xff0000 : (index % 3 === 1 ? 0x0000ff : 0xffff00)
  });
  const bulb = new THREE.Mesh(bulbGeo, bulbMat);
  bulb.position.y = poleHeight + bulbRadius * 0.9;
  poleGroup.add(bulb);

  poleGroup.position.set(side * xOffset, 0, z);
  return poleGroup;
}

function createTent(index, side, z, xOffset, heightFactor) {
  const tentGroup = new THREE.Group();
  const scale = 1 + heightFactor * 0.22;

  const baseGeo = new THREE.BoxGeometry(28 * scale, 16 * scale, 28 * scale);
  const baseMat = new THREE.MeshLambertMaterial({
    color: index % 2 === 0 ? 0xfff1e6 : 0xe8f7ff
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 8 * scale;
  tentGroup.add(base);

  const roofGeo = new THREE.ConeGeometry(22 * scale, 16 * scale, 4);
  const roofMat = new THREE.MeshLambertMaterial({
    color: index % 2 === 0 ? 0xff5d8f : 0x4d96ff
  });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 24 * scale;
  roof.rotation.y = Math.PI * 0.25;
  tentGroup.add(roof);

  tentGroup.position.set(side * xOffset, 0, z);
  return tentGroup;
}

function createFerrisWheel(z, x, heightFactor) {
  const wheelGroup = new THREE.Group();
  const radius = 120 + heightFactor * 36;
  const tube = 8 + heightFactor * 2.4;
  const standHeight = 180 + heightFactor * 60;

  const ringGeo = new THREE.TorusGeometry(radius, tube, 16, 48);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.y = Math.PI / 2;
  wheelGroup.add(ring);

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const spokeGeo = new THREE.CylinderGeometry(2, 2, radius * 1.85, 8);
    const spokeMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const spoke = new THREE.Mesh(spokeGeo, spokeMat);
    spoke.rotation.z = Math.PI / 2;
    spoke.rotation.y = angle;
    wheelGroup.add(spoke);
  }

  const standGeo = new THREE.BoxGeometry(16, standHeight, 16);
  const standMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
  const stand = new THREE.Mesh(standGeo, standMat);
  stand.position.y = -(radius + standHeight * 0.4);
  wheelGroup.add(stand);

  wheelGroup.position.set(x, radius + 100, z);
  wheelGroup.userData.spin = true;

  return wheelGroup;
}

function createAmusementSkyline() {
  const group = new THREE.Group();
  const metrics = getBackgroundMetrics();

  const sideX = Math.max(85, metrics.width * 0.32);
  const laneSpacing = 180;
  const laneCount = Math.max(10, Math.ceil((metrics.depth + 300) / laneSpacing));

  for (let lane = 0; lane < laneCount; lane++) {
    const z = 100 + lane * laneSpacing;

    group.add(createAmusementLightPole(lane * 2, -1, z, sideX, metrics.heightFactor));
    group.add(createAmusementLightPole(lane * 2 + 1, 1, z, sideX, metrics.heightFactor));

    if (lane % 3 === 0) {
      group.add(createTent(lane, -1, z + 40, sideX + 45, metrics.heightFactor));
    }
    if (lane % 4 === 2) {
      group.add(createTent(lane + 100, 1, z - 30, sideX + 55, metrics.heightFactor));
    }
  }

  const wheelSpacing = 2200;
  const wheelCount = Math.max(1, Math.ceil((metrics.depth + 1000) / wheelSpacing));
  for (let i = 0; i < wheelCount; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const x = side * Math.max(240, metrics.width * 0.34);
    const z = 1200 + i * wheelSpacing;
    group.add(createFerrisWheel(z, x, metrics.heightFactor));
  }

  return group;
}

function createAnalysisBackdrop() {
  const group = new THREE.Group();
  const metrics = getBackgroundMetrics();

  const panelWidth = Math.max(1400, metrics.width * 1.4);
  const panelHeight = Math.max(120, Math.min(320, 120 + metrics.heightFactor * 45));
  const layerSpacingY = Math.max(90, Math.min(220, metrics.maxY / 6 + metrics.heightFactor * 10));
  const layerCount = Math.max(8, Math.ceil((metrics.maxY + 500) / layerSpacingY));
  const zSpacing = 420;
  const zCount = Math.max(10, Math.ceil((metrics.depth + 1000) / zSpacing));

  for (let zi = 0; zi < zCount; zi++) {
    const z = 400 + zi * zSpacing;

    for (let yi = 0; yi < layerCount; yi++) {
      const geo = new THREE.PlaneGeometry(panelWidth, panelHeight);
      const mat = new THREE.MeshBasicMaterial({
        color: (yi + zi) % 2 === 0 ? 0xdde7ff : 0xffffff,
        transparent: true,
        opacity: yi % 3 === 0 ? 0.28 : 0.18,
        depthWrite: false
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, yi * layerSpacingY, z);
      group.add(mesh);
    }
  }

  return group;
}

function clearBackground() {
  if (app.backgroundGroup) {
    disposeObject3D(app.backgroundGroup);
    app.scene.remove(app.backgroundGroup);
    app.backgroundGroup = null;
  }
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

  const guideStep = Math.max(20, Math.ceil(maxY / 6 / 10) * 10);
  const width = Math.max(180, getDynamicGroundSize().width * 0.45);
  const depth = app.coursePoints.length > 0
    ? app.coursePoints[app.coursePoints.length - 1].z + 200
    : 3000;

  for (let y = 0; y <= maxY + guideStep; y += guideStep) {
    const points = [
      new THREE.Vector3(-width, y, -100),
      new THREE.Vector3(width, y, depth)
    ];

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineDashedMaterial({
      color: theme.guideColor,
      transparent: true,
      opacity: theme.guideOpacity,
      dashSize: 16,
      gapSize: 10
    });

    const line = new THREE.Line(geo, mat);
    line.computeLineDistances();
    guideGroup.add(line);
  }

  const sampleStep = Math.max(1, Math.floor(app.coursePoints.length / 70));
  for (let i = 0; i < app.coursePoints.length; i += sampleStep) {
    const p = app.coursePoints[i];

    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(p.x, CONFIG.ground.y, p.z),
      new THREE.Vector3(p.x, p.y, p.z)
    ]);

    const mat = new THREE.LineBasicMaterial({
      color: theme.guideColor,
      transparent: true,
      opacity: theme.guideOpacity + 0.10
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
    const yaw = Math.atan2(dx, dz);
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

  for (const child of app.backgroundGroup.children) {
    if (child.userData.kind === 'nebula') {
      for (let i = 0; i < child.children.length; i++) {
        child.children[i].rotation.z +=
          CONFIG.background.nebula.spinSpeed * 1.15 * (i % 2 === 0 ? 1 : -1);
      }
    }

    if (child.userData.kind === 'amusement') {
      for (const part of child.children) {
        if (part.userData.spin) {
          part.rotation.z += 0.01;
        }
      }
    }

    if (child.userData.kind === 'spaceOrbs') {
      for (let i = 0; i < child.children.length; i++) {
        const orb = child.children[i];
        const seed = orb.userData.floatSeed || i;
        orb.position.y += Math.sin(performance.now() * 0.0007 + seed) * 0.03;
      }
    }

    if (child.userData.kind === 'spacePlanets') {
      for (const part of child.children) {
        if (part.userData.kind === 'spacePlanet') {
          part.rotation.y += part.userData.spinSpeed || 0.001;
        }
      }
    }
  }
}

export function refreshGuidesAfterCourseBuild() {
  createHeightGuides();
}