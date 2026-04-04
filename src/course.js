import * as THREE from 'https://unpkg.com/three@0.183.0/build/three.module.js';
import { CONFIG } from './config.js';
import { app } from './state.js';
import { ui, getBuildSettingsFromUI, updateStatus } from './ui.js';
import { disposeObject3D, getPosYByPrice, toDateTextLocal } from './utils.js';
import { parseCSV, filterRowsByStartDate, buildCoursePoints, readSelectedFileText } from './data.js';
import {
  createBackground,
  updateCameraPosition,
  refreshGuidesAfterCourseBuild,
  rebuildGround,
  getDynamicGroundSize
} from './scene.js';

export function resetCourseGroup() {
  if (app.courseGroup) {
    disposeObject3D(app.courseGroup);
    app.scene.remove(app.courseGroup);
  }

  app.courseGroup = new THREE.Group();
  app.scene.add(app.courseGroup);
  app.coursePoints = [];
  app.prices = [];
  app.curve = null;
  app.rideT = 0;
  app.lastBuildInfo = null;
}

export function buildSmoothCurve(points) {
  if (points.length < 2) {
    throw new Error('曲線を作るための点が不足しています。');
  }

  return new THREE.CatmullRomCurve3(
    points,
    false,
    CONFIG.course.curveType,
    CONFIG.course.curveTension
  );
}

export function createRoundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function createTextSprite(text) {
  const spriteConfig = CONFIG.label.sprite;

  const canvas = document.createElement('canvas');
  canvas.width = spriteConfig.canvasWidth;
  canvas.height = spriteConfig.canvasHeight;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = spriteConfig.backgroundColor;
  createRoundedRect(
    ctx,
    4,
    4,
    canvas.width - 8,
    canvas.height - 8,
    spriteConfig.borderRadius
  );
  ctx.fill();

  ctx.strokeStyle = spriteConfig.borderColor;
  ctx.lineWidth = spriteConfig.borderWidth;
  createRoundedRect(
    ctx,
    4,
    4,
    canvas.width - 8,
    canvas.height - 8,
    spriteConfig.borderRadius
  );
  ctx.stroke();

  ctx.fillStyle = spriteConfig.textColor;
  ctx.font = spriteConfig.font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: true
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(spriteConfig.scaleX, spriteConfig.scaleY, 1);

  return sprite;
}

export function addMonthlyLabels(points, prices, rows, buildSettings) {
  if (!points.length || !rows.length) return;

  let lastMonthKey = '';

  for (let i = 0; i < rows.length; i++) {
    const d = rows[i].date;
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    if (monthKey === lastMonthKey) continue;
    lastMonthKey = monthKey;

    const p = points[i];
    if (!p) continue;

    const label = createTextSprite(monthKey);
    label.position.set(
      CONFIG.label.position.x,
      p.y + CONFIG.label.position.yOffset,
      p.z
    );
    app.courseGroup.add(label);

    const price2 = prices[i] * 1.02;
    const price2Y = getPosYByPrice(
      price2,
      app.maxClose,
      app.minClose,
      buildSettings.heightScale,
      buildSettings.invertPrice
    );
    const label2 = createTextSprite(price2.toFixed(4));
    label2.position.set(
      CONFIG.label.position.x,
      price2Y + CONFIG.label.position.yOffset,
      p.z
    );
    app.courseGroup.add(label2);

    const price3 = prices[i] * 0.98;
    const price3Y = getPosYByPrice(
      price3,
      app.maxClose,
      app.minClose,
      buildSettings.heightScale,
      buildSettings.invertPrice
    );
    const label3 = createTextSprite(price3.toFixed(4));
    label3.position.set(
      CONFIG.label.position.x,
      price3Y + CONFIG.label.position.yOffset,
      p.z
    );
    app.courseGroup.add(label3);
  }
}

export function addRails(curve) {
  const railConfig = CONFIG.rail;
  const sleeperConfig = CONFIG.sleeper;

  const divisions = Math.max(
    railConfig.divisionsMin,
    app.coursePoints.length * railConfig.divisionsPerPoint
  );

  const centerPoints = curve.getSpacedPoints(divisions);

  const leftPoints = [];
  const rightPoints = [];

  for (const p of centerPoints) {
    leftPoints.push(new THREE.Vector3(
      p.x - railConfig.halfWidth,
      p.y + railConfig.offsetY,
      p.z
    ));
    rightPoints.push(new THREE.Vector3(
      p.x + railConfig.halfWidth,
      p.y + railConfig.offsetY,
      p.z
    ));
  }

  const leftCurve = new THREE.CatmullRomCurve3(
    leftPoints,
    false,
    CONFIG.course.curveType,
    CONFIG.course.curveTension
  );

  const rightCurve = new THREE.CatmullRomCurve3(
    rightPoints,
    false,
    CONFIG.course.curveType,
    CONFIG.course.curveTension
  );

  const leftRailGeo = new THREE.TubeGeometry(
    leftCurve,
    divisions,
    railConfig.radius,
    railConfig.radialSegments,
    false
  );

  const rightRailGeo = new THREE.TubeGeometry(
    rightCurve,
    divisions,
    railConfig.radius,
    railConfig.radialSegments,
    false
  );

  const railMat = new THREE.MeshStandardMaterial({
    color: railConfig.color,
    emissive: railConfig.emissive,
    emissiveIntensity: railConfig.emissiveIntensity,
    metalness: railConfig.metalness,
    roughness: railConfig.roughness
  });

  const leftRailMesh = new THREE.Mesh(leftRailGeo, railMat);
  const rightRailMesh = new THREE.Mesh(rightRailGeo, railMat);

  app.courseGroup.add(leftRailMesh);
  app.courseGroup.add(rightRailMesh);

  const glowMat = new THREE.MeshBasicMaterial({
    color: railConfig.glowColor,
    transparent: true,
    opacity: railConfig.glowOpacity
  });

  const leftGlowGeo = new THREE.TubeGeometry(
    leftCurve,
    divisions,
    railConfig.glowRadius,
    railConfig.glowRadialSegments,
    false
  );

  const rightGlowGeo = new THREE.TubeGeometry(
    rightCurve,
    divisions,
    railConfig.glowRadius,
    railConfig.glowRadialSegments,
    false
  );

  const leftGlowMesh = new THREE.Mesh(leftGlowGeo, glowMat);
  const rightGlowMesh = new THREE.Mesh(rightGlowGeo, glowMat);

  app.courseGroup.add(leftGlowMesh);
  app.courseGroup.add(rightGlowMesh);

  const sleeperGeo = new THREE.BoxGeometry(
    sleeperConfig.width,
    sleeperConfig.height,
    sleeperConfig.depth
  );

  const sleeperMat = new THREE.MeshLambertMaterial({
    color: sleeperConfig.color,
    emissive: sleeperConfig.emissive,
    emissiveIntensity: sleeperConfig.emissiveIntensity
  });

  const curveLength = curve.getLength();
  const sleeperCount = Math.floor(curveLength / sleeperConfig.spacing);

  for (let i = 0; i <= sleeperCount; i++) {
    const u = sleeperCount === 0 ? 0 : i / sleeperCount;

    const p = curve.getPointAt(u);
    const tangent = curve.getTangentAt(u).normalize();

    const sleeper = new THREE.Mesh(sleeperGeo, sleeperMat);
    sleeper.position.set(
      p.x,
      p.y + railConfig.offsetY + sleeperConfig.offsetY,
      p.z
    );

    const up = new THREE.Vector3(0, 1, 0);

    let right = new THREE.Vector3().crossVectors(up, tangent);
    if (right.lengthSq() < 1e-8) {
      right = new THREE.Vector3(1, 0, 0);
    } else {
      right.normalize();
    }

    const sleeperUp = new THREE.Vector3().crossVectors(tangent, right).normalize();

    const basis = new THREE.Matrix4().makeBasis(right, sleeperUp, tangent);
    sleeper.quaternion.setFromRotationMatrix(basis);

    app.courseGroup.add(sleeper);
  }
}

export function buildCourseMeshes(curve) {
  addRails(curve);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundNice(value) {
  if (!Number.isFinite(value) || value <= 0) return 1;

  const exp = Math.floor(Math.log10(value));
  const scale = 10 ** exp;
  const normalized = value / scale;
  const candidates = [1, 2, 5, 10];

  let best = candidates[0];
  let minDiff = Math.abs(normalized - best);

  for (const c of candidates) {
    const diff = Math.abs(normalized - c);
    if (diff < minDiff) {
      minDiff = diff;
      best = c;
    }
  }

  return best * scale;
}

export function calcAutoBuildParams(rows) {
  if (!rows || rows.length < 2) {
    throw new Error('自動調整するための有効データが不足しています。');
  }

  const closes = rows.map(row => row.close);
  const minClose = Math.min(...closes);
  const maxClose = Math.max(...closes);
  const range = Math.max(maxClose - minClose, 1e-9);
  const count = rows.length;

  let heightScale = 260 / range;
  heightScale = roundNice(heightScale);
  heightScale = clamp(heightScale, 0.0001, 1000000000);

  let zStep = 5000 / Math.max(count - 1, 1);
  zStep = clamp(zStep, 8, 160);
  zStep = Math.round(zStep);

  return {
    heightScale,
    zStep,
    minClose,
    maxClose,
    range,
    count
  };
}

export function applyAutoBuildParamsToUI(autoParams) {
  ui.heightScaleInput.value = String(autoParams.heightScale);
  ui.zStepInput.value = String(autoParams.zStep);
}

export async function previewAutoBuildParamsFromCurrentInput() {
  const file = ui.fileInput.files[0];
  if (!file) return;

  const startDateText = ui.startDateInput.value.trim();
  if (!startDateText) return;

  const csvText = await file.text();
  const allRows = parseCSV(csvText);
  const filteredRows = filterRowsByStartDate(allRows, startDateText);

  if (filteredRows.length < 2) return;

  const autoParams = calcAutoBuildParams(filteredRows);
  applyAutoBuildParamsToUI(autoParams);
}

export async function buildCourseFromUI() {
  resetCourseGroup();

  const buildSettings = getBuildSettingsFromUI();

  const csvText = await readSelectedFileText();
  const allRows = parseCSV(csvText);
  const filteredRows = filterRowsByStartDate(allRows, buildSettings.startDateText);

  if (buildSettings.autoScale) {
    const autoParams = calcAutoBuildParams(filteredRows);
    applyAutoBuildParamsToUI(autoParams);
    buildSettings.heightScale = autoParams.heightScale;
    buildSettings.zStep = autoParams.zStep;
  }

  app.buildSettings = { ...buildSettings };

  const { points, prices, baseClose, minClose, maxClose } =
    buildCoursePoints(filteredRows, buildSettings);

  app.coursePoints = points;
  app.prices = prices;
  app.curve = buildSmoothCurve(points);
  app.minClose = minClose;
  app.maxClose = maxClose;

  buildCourseMeshes(app.curve);
  addMonthlyLabels(points, prices, filteredRows, buildSettings);
  updateCameraPosition(app.curve, 0, app.runtimeSettings.lookAhead);

  let maxY = 0;
  for (const p of points) {
    if (p.y > maxY) maxY = p.y;
  }

  rebuildGround();
  createBackground();
  refreshGuidesAfterCourseBuild();

  const groundSize = getDynamicGroundSize();
  const firstDate = toDateTextLocal(filteredRows[0].date);
  const lastDate = toDateTextLocal(filteredRows[filteredRows.length - 1].date);

  app.lastBuildInfo = {
    rowCount: filteredRows.length,
    firstDate,
    lastDate,
    baseClose,
    minClose: app.minClose,
    maxClose: app.maxClose,
    heightScale: buildSettings.heightScale,
    zStep: buildSettings.zStep,
    maxY,
    groundWidth: groundSize.width,
    groundDepth: groundSize.depth,
    autoScale: buildSettings.autoScale,
    invertPrice: buildSettings.invertPrice,
    themeLabel:
      buildSettings.theme === 'amusement'
        ? '明るい遊園地'
        : buildSettings.theme === 'analysis'
          ? '解析モード'
          : '宇宙',
    showHeightGuides: buildSettings.showHeightGuides
  };

  updateStatus();
}