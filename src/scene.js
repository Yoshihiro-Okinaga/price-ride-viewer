import * as THREE from 'https://unpkg.com/three@0.183.0/build/three.module.js';
import { VRButton } from 'https://unpkg.com/three@0.183.0/examples/jsm/webxr/VRButton.js';
import { SCENE_CONFIG as CONFIG } from './config/sceneConfig.js';
import { app } from './state.js';
import { disposeObject3D, pseudoRandom } from './utils.js';
import {
  animateNebulaChild,
  animateSpaceOrbsChild,
  animateSpacePlanetsChild
} from './scenes/themeAnimations/spaceAnimation.js';
import { animateAmusementChild } from './scenes/themeAnimations/amusementAnimation.js';
import { animateFutureCityChild } from './scenes/themeAnimations/futureCityAnimation.js';
import { animateHeavenTempleChild } from './scenes/themeAnimations/heavenTempleAnimation.js';
import { createAnalysisBackdrop } from './scenes/themeBackgrounds/analysisBackground.js';
import { createFutureCityScenery } from './scenes/themeBackgrounds/futureCityBackground.js';
import { createSpaceBackgroundLayers } from './scenes/themeBackgrounds/spaceBackground.js';
import { createAmusementSkyline } from './scenes/themeBackgrounds/amusementBackground.js';
import { createCityNightScenery } from './scenes/themeBackgrounds/cityNightBackground.js';
import { createHeavenTempleScenery } from './scenes/themeBackgrounds/heavenTempleBackground.js';

/**
 * 現在のビルド設定に対応するテーマ設定を取得します。
 * @returns {*} 現在有効なテーマ設定です。
 */
function getCurrentTheme() {
  // この関数の主要処理をここから実行します。
  return CONFIG.sceneRefactor.themePresets[app.buildSettings.theme]
    || CONFIG.sceneRefactor.themePresets.space;
}

/**
 * 値を指定範囲に収めます。
 * @param {*} value 対象の値です。
 * @param {*} min 最小値です。
 * @param {*} max 最大値です。
 * @returns {*} 範囲内に収めた値です。
 */
function clamp(value, min, max) {
  // この関数の主要処理をここから実行します。
  return Math.min(max, Math.max(min, value));
}

/**
 * 配列から循環参照で色を取得します。
 * @param {*} colors 色配列です。
 * @param {*} index 対象インデックスです。
 * @param {*} fallback 代替色です。
 * @returns {*} 選択された色です。
 */
function getArrayColor(colors, index, fallback) {
  // この関数の主要処理をここから実行します。
  return colors[index % colors.length] ?? fallback;
}

/**
 * Three.js の基本シーン要素を生成して状態に保持します。
 * @returns {*} なし。
 */
export function createSceneObjects() {
  // この関数の主要処理をここから実行します。
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

/**
 * 現在テーマに応じた地面テクスチャ設定を取得します。
 * @returns {*} 地面テクスチャ設定です。
 */
function getGroundTextureConfig() {
  // この関数の主要処理をここから実行します。
  const theme = getCurrentTheme();
  return {
    ...CONFIG.ground.texture,
    ...theme.ground
  };
}

/**
 * 現在のコース状況に応じた地面サイズ指標を計算します。
 * @returns {*} 地面計算用の指標です。
 */
function getGroundMetrics() {
  // この関数の主要処理をここから実行します。
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

/**
 * 現在の表示内容に応じた地面サイズを返します。
 * @returns {*} 動的に計算した地面サイズです。
 */
export function getDynamicGroundSize() {
  // この関数の主要処理をここから実行します。
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

/**
 * 背景生成に使う寸法指標を計算します。
 * @returns {*} 背景生成用の指標です。
 */
function getBackgroundMetrics() {
  // この関数の主要処理をここから実行します。
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

/**
 * 地面用のキャンバステクスチャを生成します。
 * @returns {*} 生成した CanvasTexture です。
 */
function createGroundTexture() {
  // この関数の主要処理をここから実行します。
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

/**
 * 地面メッシュを生成してシーンに配置します。
 * @returns {*} なし。
 */
export function createGround() {
  // この関数の主要処理をここから実行します。
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

/**
 * 現在設定に合わせて地面を再生成します。
 * @returns {*} なし。
 */
export function rebuildGround() {
  // この関数の主要処理をここから実行します。
  if (app.ground) {
    disposeObject3D(app.ground);
    app.scene.remove(app.ground);
    app.ground = null;
  }
  createGround();
}

/**
 * 既存の背景オブジェクトを破棄してクリアします。
 * @returns {*} なし。
 */
function clearBackground() {
  if (app.backgroundGroup) {
    disposeObject3D(app.backgroundGroup);
    app.scene.remove(app.backgroundGroup);
    app.backgroundGroup = null;
  }
}

/**
 * 現在テーマに応じた背景オブジェクトを生成します。
 * @returns {*} なし。
 */
export function createBackground() {
  // この関数の主要処理をここから実行します。
  clearBackground();

  const backgroundGroup = new THREE.Group();
  const theme = getCurrentTheme();
  const deps = {
    THREE,
    CONFIG,
    pseudoRandom,
    getArrayColor,
    getBackgroundMetrics
  };

  if (theme.backgroundKind === 'space') {
    const layers = createSpaceBackgroundLayers(deps);
    const stars = layers.stars;
    stars.userData.kind = 'stars';
    backgroundGroup.add(stars);

    const nebula = layers.nebula;
    nebula.userData.kind = 'nebula';
    backgroundGroup.add(nebula);

    const orbs = layers.orbs;
    orbs.userData.kind = 'spaceOrbs';
    backgroundGroup.add(orbs);

    const planets = layers.planets;
    planets.userData.kind = 'spacePlanets';
    backgroundGroup.add(planets);

    const crystals = layers.crystals;
    crystals.userData.kind = 'spaceCrystals';
    backgroundGroup.add(crystals);
  } else if (theme.backgroundKind === 'amusement') {
    const skyline = createAmusementSkyline(deps);
    skyline.userData.kind = 'amusement';
    backgroundGroup.add(skyline);
  } else if (theme.backgroundKind === 'analysis') {
    const backdrop = createAnalysisBackdrop({
      THREE,
      CONFIG,
      getBackgroundMetrics
    });
    backdrop.userData.kind = 'analysis';
    backgroundGroup.add(backdrop);
  } else if (theme.backgroundKind === 'cityNight') {
    const city = createCityNightScenery(deps);
    city.userData.kind = 'cityNight';
    backgroundGroup.add(city);
  } else if (theme.backgroundKind === 'futureCity') {
    const city = createFutureCityScenery({
      THREE,
      CONFIG,
      pseudoRandom,
      getArrayColor,
      getBackgroundMetrics
    });
    city.userData.kind = 'futureCity';
    backgroundGroup.add(city);
  } else if (theme.backgroundKind === 'heavenTemple') {
    const temple = createHeavenTempleScenery(deps);
    temple.userData.kind = 'heavenTemple';
    backgroundGroup.add(temple);
  }

  app.scene.add(backgroundGroup);
  app.backgroundGroup = backgroundGroup;
}

/**
 * 高さガイドをクリアします。
 * @returns {*} なし。
 */
function clearGuides() {
  // この関数の主要処理をここから実行します。
  if (app.guideGroup) {
    disposeObject3D(app.guideGroup);
    app.scene.remove(app.guideGroup);
    app.guideGroup = null;
  }
}

/**
 * 高さガイドを生成してシーンに配置します。
 * @returns {*} なし。
 */
function createHeightGuides() {
  // この関数の主要処理をここから実行します。
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

/**
 * 曲線上の指定位置を安全に取得します。
 * @param {*} curve 対象の曲線です。
 * @param {*} t 曲線上の進行率です。
 * @returns {*} 取得した曲線上の座標です。
 */
export function sampleCurvePoint(curve, t) {
  // この関数の主要処理をここから実行します。
  if (!curve) return new THREE.Vector3();
  return curve.getPoint(Math.min(Math.max(t, 0), 1));
}

/**
 * コース上の進行位置に応じてカメラを更新します。
 * @param {*} curve 対象の曲線です。
 * @param {*} t 曲線上の進行率です。
 * @param {*} lookAhead 視線の先読み量です。
 * @returns {*} なし。
 */
export function updateCameraPosition(curve, t, lookAhead) {
  // この関数の主要処理をここから実行します。
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

/**
 * テーマ変更に合わせてシーン全体を再構築します。
 * @returns {*} なし。
 */
export function rebuildSceneTheme() {
  // この関数の主要処理をここから実行します。
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

/**
 * 背景オブジェクトのアニメーションを更新します。
 * @returns {*} なし。
 */
export function animateBackground() {
  if (!app.backgroundGroup) return;

  for (const child of app.backgroundGroup.children) {
    if (child.userData.kind === 'nebula') animateNebulaChild(child, CONFIG);
    if (child.userData.kind === 'amusement') animateAmusementChild(child, CONFIG);
    if (child.userData.kind === 'spaceOrbs') animateSpaceOrbsChild(child, CONFIG);
    if (child.userData.kind === 'spacePlanets') animateSpacePlanetsChild(child, CONFIG);
    if (child.userData.kind === 'futureCity') animateFutureCityChild(child, CONFIG);
    if (child.userData.kind === 'heavenTemple') animateHeavenTempleChild(child, CONFIG);
  }
}


/**
 * コース再構築後にガイド表示を更新します。
 * @returns {*} なし。
 */
export function refreshGuidesAfterCourseBuild() {
  // この関数の主要処理をここから実行します。
  createHeightGuides();
}