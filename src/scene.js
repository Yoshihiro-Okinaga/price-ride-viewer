import * as THREE from 'https://unpkg.com/three@0.183.0/build/three.module.js';
import { CONFIG } from './config.js';
import { app } from './state.js';
import { disposeObject3D, pseudoRandom } from './utils.js';

const THEMES = {
  space: {
    sceneBackground: 0x000022,
    fogColor: 0x000022,
    fogDensity: 0.00045,
    ground: {
      opacity: 0.95,
      backgroundColor: '#070b18',
      gradTop: 'rgba(80,120,255,0.10)',
      gradMid: 'rgba(0,0,0,0.00)',
      gradBottom: 'rgba(180,80,255,0.10)',
      gridColor: 'rgba(255,255,255,0.95)',
      glowDotColor: 'rgba(180,220,255,0.18)',
      cells: 16
    },
    lighting: {
      directional: { color: 0xcfd8ff, intensity: 1.05 },
      ambient: { color: 0x8899ff, intensity: 0.95 },
      point: { color: 0x66ccff, intensity: 1.3 }
    },
    backgroundKind: 'space',
    guideColor: 0x88bbff,
    guideOpacity: 0.28
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

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.scene.maxPixelRatio));
  document.body.appendChild(renderer.domElement);

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
  app.renderer = renderer;
  app.lights.directional = dirLight;
  app.lights.ambient = ambLight;
  app.lights.point = pointLight;
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

  const frontMargin = 220;
  const backMargin = Math.max(600, Math.ceil(lastZ * 0.08));
  const depthRaw = frontMargin + lastZ + backMargin;
  const depth = Math.max(3000, Math.ceil(depthRaw / 100) * 100);

  return { width, depth };
}

export function createGroundTexture() {
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
  texture.repeat.set(textureConfig.repeatX, textureConfig.repeatZ);
  texture.anisotropy = app.renderer.capabilities.getMaxAnisotropy();

  return texture;
}

export function createGround() {
  const texture = createGroundTexture();
  const theme = getCurrentTheme();
  const { width, depth } = getDynamicGroundSize();

  const geo = new THREE.PlaneGeometry(
    width,
    depth,
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
  ground.position.y = CONFIG.ground.y;
  ground.position.z = depth / 2 - 220;

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

export function createStars() {
  const starConfig = CONFIG.background.stars;
  const positions = new Float32Array(starConfig.count * 3);

  for (let i = 0; i < starConfig.count; i++) {
    const x = (Math.random() - 0.5) * starConfig.rangeX;
    const y = starConfig.minY + Math.random() * starConfig.rangeY;
    const z = Math.random() * starConfig.rangeZ + starConfig.offsetZ;

    positions[i * 3 + 0] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: starConfig.color,
    size: starConfig.size,
    sizeAttenuation: true,
    transparent: true,
    opacity: starConfig.opacity,
    depthTest: true,
    depthWrite: false
  });

  return new THREE.Points(geo, mat);
}

export function createNebulaBands() {
  const nebulaConfig = CONFIG.background.nebula;
  const group = new THREE.Group();

  for (let i = 0; i < nebulaConfig.count; i++) {
    const geo = new THREE.PlaneGeometry(nebulaConfig.width, nebulaConfig.height);

    const color = nebulaConfig.colors[i % nebulaConfig.colors.length];
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: nebulaConfig.opacity,
      depthTest: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      (pseudoRandom(i + 101) - 0.5) * nebulaConfig.areaX,
      nebulaConfig.baseY + pseudoRandom(i + 102) * nebulaConfig.rangeY,
      i * nebulaConfig.spacingZ
    );
    mesh.rotation.x =
      nebulaConfig.rotationXBase - pseudoRandom(i + 201) * nebulaConfig.rotationXRange;
    mesh.rotation.y = (pseudoRandom(i + 301) - 0.5) * nebulaConfig.rotationYRange;
    mesh.rotation.z = (pseudoRandom(i + 401) - 0.5) * nebulaConfig.rotationZRange;

    group.add(mesh);
  }

  return group;
}

function createAmusementSkyline() {
  const group = new THREE.Group();

  const skyGeo = new THREE.PlaneGeometry(3000, 1400);
  const skyMat = new THREE.MeshBasicMaterial({
    color: 0xbfe7ff,
    depthWrite: false
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  sky.position.set(0, 500, 2600);
  group.add(sky);

  for (let i = 0; i < 16; i++) {
    const tentGeo = new THREE.ConeGeometry(45, 70, 4);
    const tentMat = new THREE.MeshLambertMaterial({
      color: i % 2 === 0 ? 0xff6699 : 0xffcc33
    });
    const tent = new THREE.Mesh(tentGeo, tentMat);
    tent.position.set(-700 + i * 95, 35, 700 + (i % 3) * 180);
    tent.rotation.y = Math.PI * 0.25;
    group.add(tent);
  }

  const wheelGroup = new THREE.Group();

  const ringGeo = new THREE.TorusGeometry(120, 10, 16, 48);
  const ringMat = new THREE.MeshLambertMaterial({ color: 0xff66aa });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  wheelGroup.add(ring);

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const spokeGeo = new THREE.CylinderGeometry(2, 2, 220, 8);
    const spokeMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const spoke = new THREE.Mesh(spokeGeo, spokeMat);
    spoke.rotation.z = Math.PI / 2;
    spoke.rotation.y = angle;
    wheelGroup.add(spoke);
  }

  const standGeo = new THREE.BoxGeometry(16, 180, 16);
  const standMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
  const stand = new THREE.Mesh(standGeo, standMat);
  stand.position.y = -130;
  wheelGroup.add(stand);

  wheelGroup.position.set(300, 240, 1200);
  wheelGroup.userData.spin = true;
  group.add(wheelGroup);

  return group;
}

function createAnalysisBackdrop() {
  const group = new THREE.Group();

  for (let i = 0; i < 8; i++) {
    const geo = new THREE.PlaneGeometry(1400, 120);
    const mat = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? 0xdde7ff : 0xffffff,
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, i * 110, 800 + i * 500);
    group.add(mesh);
  }

  return group;
}

export function clearBackground() {
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

  const maxY = Math.max(...app.coursePoints.map(p => p.y), 0);
  const guideStep = Math.max(20, Math.ceil(maxY / 6 / 10) * 10);

  const width = 180;
  const depth = app.coursePoints.length > 0
    ? app.coursePoints[app.coursePoints.length - 1].z + 200
    : 3000;

  for (let y = 0; y <= maxY + guideStep; y += guideStep) {
    const points = [
      new THREE.Vector3(-width, y, -100),
      new THREE.Vector3(width, y, depth)
    ];

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: theme.guideColor,
      transparent: true,
      opacity: theme.guideOpacity
    });

    const line = new THREE.Line(geo, mat);
    guideGroup.add(line);
  }

  app.scene.add(guideGroup);
  app.guideGroup = guideGroup;
}

export function updateCameraPosition(curve, t, lookAhead) {
  const clampedT = Math.min(Math.max(t, 0), 1);
  const lookT = Math.min(clampedT + lookAhead, 1);

  const pos = curve.getPointAt(clampedT);
  const look = curve.getPointAt(lookT);

  app.camera.position.set(
    pos.x,
    pos.y + CONFIG.camera.rideHeight,
    pos.z
  );
  app.camera.lookAt(
    look.x,
    look.y + CONFIG.camera.lookAtYOffset,
    look.z + CONFIG.camera.lookAtZOffset
  );
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
          CONFIG.background.nebula.spinSpeed * (i % 2 === 0 ? 1 : -1);
      }
    }

    if (child.userData.kind === 'amusement') {
      for (const part of child.children) {
        if (part.userData.spin) {
          part.rotation.z += 0.01;
        }
      }
    }
  }
}

export function refreshGuidesAfterCourseBuild() {
  createHeightGuides();
}