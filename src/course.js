import * as THREE from 'https://unpkg.com/three@0.183.0/build/three.module.js';
import { CONFIG } from './config.js';
import { app } from './state.js';
import { ui, getBuildSettingsFromUI, updateStatus } from './ui.js';
import { disposeObject3D, getPosYByPrice, toDateTextLocal } from './utils.js';
import {
  parseCSV,
  filterRowsByStartDate,
  buildCoursePoints,
  readCsvTextFromUrl
} from './data.js';
import {
  createBackground,
  updateCameraPosition,
  refreshGuidesAfterCourseBuild,
  rebuildGround,
  getDynamicGroundSize
} from './scene.js';

function getThemeLabel(theme) {
  switch (theme) {
    case 'amusement':
      return '明るい遊園地';
    case 'analysis':
      return '解析モード';
    case 'cityNight':
      return '都会の夜景';
    default:
      return '宇宙';
  }
}

function getPointMaxY(points) {
  let maxY = 0;

  for (const point of points) {
    if (point.y > maxY) {
      maxY = point.y;
    }
  }

  return maxY;
}

function addPriceLabel(price, point, buildSettings, labelY) {
  const priceY = getPosYByPrice(
    price,
    app.maxClose,
    app.minClose,
    buildSettings.heightScale,
    buildSettings.invertPrice
  );

  const label = createTextSprite(
    price.toFixed(CONFIG.course.monthlyLabel.priceDecimals)
  );

  label.position.set(
    CONFIG.label.position.x,
    priceY + labelY,
    point.z
  );

  app.courseGroup.add(label);
}

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
  const inset = CONFIG.course.spriteFrameInset;

  const canvas = document.createElement('canvas');
  canvas.width = spriteConfig.canvasWidth;
  canvas.height = spriteConfig.canvasHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('2Dコンテキストの取得に失敗しました。');
  }

  const frameWidth = canvas.width - inset * 2;
  const frameHeight = canvas.height - inset * 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = spriteConfig.backgroundColor;
  createRoundedRect(
    ctx,
    inset,
    inset,
    frameWidth,
    frameHeight,
    spriteConfig.borderRadius
  );
  ctx.fill();

  ctx.strokeStyle = spriteConfig.borderColor;
  ctx.lineWidth = spriteConfig.borderWidth;
  createRoundedRect(
    ctx,
    inset,
    inset,
    frameWidth,
    frameHeight,
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

  const monthlyLabelConfig = CONFIG.course.monthlyLabel;
  let lastMonthKey = '';

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const point = points[i];

    if (!point) continue;

    const date = row.date;
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (monthKey === lastMonthKey) continue;
    lastMonthKey = monthKey;

    const monthLabel = createTextSprite(monthKey);
    monthLabel.position.set(
      CONFIG.label.position.x,
      point.y + CONFIG.label.position.yOffset,
      point.z
    );
    app.courseGroup.add(monthLabel);

    addPriceLabel(
      prices[i] * monthlyLabelConfig.upperPriceRatio,
      point,
      buildSettings,
      CONFIG.label.position.yOffset
    );

    addPriceLabel(
      prices[i] * monthlyLabelConfig.lowerPriceRatio,
      point,
      buildSettings,
      CONFIG.label.position.yOffset
    );
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

  for (const point of centerPoints) {
    leftPoints.push(new THREE.Vector3(
      point.x - railConfig.halfWidth,
      point.y + railConfig.offsetY,
      point.z
    ));
    rightPoints.push(new THREE.Vector3(
      point.x + railConfig.halfWidth,
      point.y + railConfig.offsetY,
      point.z
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

    const point = curve.getPointAt(u);
    const tangent = curve.getTangentAt(u).normalize();

    const sleeper = new THREE.Mesh(sleeperGeo, sleeperMat);
    sleeper.position.set(
      point.x,
      point.y + railConfig.offsetY + sleeperConfig.offsetY,
      point.z
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
  const candidates = CONFIG.course.autoBuild.roundNiceCandidates;

  if (!Number.isFinite(value) || value <= 0) {
    return candidates[0];
  }

  const exp = Math.floor(Math.log10(value));
  const scale = 10 ** exp;
  const normalized = value / scale;

  let best = candidates[0];
  let minDiff = Math.abs(normalized - best);

  for (const candidate of candidates) {
    const diff = Math.abs(normalized - candidate);
    if (diff < minDiff) {
      minDiff = diff;
      best = candidate;
    }
  }

  return best * scale;
}

export function calcAutoBuildParams(rows) {
  if (!rows || rows.length < 2) {
    throw new Error('自動調整するための有効データが不足しています。');
  }

  const autoBuildConfig = CONFIG.course.autoBuild;

  const closes = rows.map(row => row.close);
  const minClose = Math.min(...closes);
  const maxClose = Math.max(...closes);
  const range = Math.max(
    maxClose - minClose,
    autoBuildConfig.rangeEpsilon
  );
  const count = rows.length;

  let heightScale = autoBuildConfig.targetHeightRange / range;
  heightScale = roundNice(heightScale);
  heightScale = clamp(
    heightScale,
    autoBuildConfig.minHeightScale,
    autoBuildConfig.maxHeightScale
  );

  let zStep = autoBuildConfig.targetDepth / Math.max(count - 1, 1);
  zStep = clamp(
    zStep,
    autoBuildConfig.minZStep,
    autoBuildConfig.maxZStep
  );
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
  const startDateText = ui.startDateInput.value.trim();
  if (!startDateText) return;
  if (!ui.csvSelect.value) return;

  const csvText = await readCsvTextFromUrl(ui.csvSelect.value);
  const allRows = parseCSV(csvText);
  const filteredRows = filterRowsByStartDate(allRows, startDateText);

  if (filteredRows.length < 2) return;

  const autoParams = calcAutoBuildParams(filteredRows);
  applyAutoBuildParamsToUI(autoParams);
}

export async function buildCourseFromUI() {
  resetCourseGroup();

  const buildSettings = getBuildSettingsFromUI();

  const csvText = await readCsvTextFromUrl(buildSettings.csvUrl);
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

  rebuildGround();
  createBackground();
  refreshGuidesAfterCourseBuild();

  const groundSize = getDynamicGroundSize();
  const firstDate = toDateTextLocal(filteredRows[0].date);
  const lastDate = toDateTextLocal(filteredRows[filteredRows.length - 1].date);
  const maxY = getPointMaxY(points);

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
    themeLabel: getThemeLabel(buildSettings.theme),
    showHeightGuides: buildSettings.showHeightGuides
  };

  updateStatus();
}