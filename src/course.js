import * as THREE from 'https://unpkg.com/three@0.183.0/build/three.module.js';
import { COURSE_CONFIG as CONFIG } from './config/courseConfig.js';
import { UI_CONFIG } from './config/uiConfig.js';
import { app } from './state.js';
import {
  disposeObject3D,
  getPosYByPrice,
  toDateTextLocal
} from './utils.js';
import {
  parseCSV,
  filterRowsByStartDate,
  readCsvTextFromUrl
} from './csvDataRepository.js';
import { buildCoursePoints } from './coursePointBuilder.js';
import { getDynamicGroundSize } from './scene.js';
import { createTextSprite } from './labelSpriteFactory.js';
import { addRailsToGroup } from './railMeshBuilder.js';

/**
 * テーマ値に対応する表示名を返します。
 * @param {string} theme テーマ識別子です。
 * @returns {string} テーマ表示名です。
 */
function getThemeLabel(theme) {
  const option = UI_CONFIG.themeOptions.find(item => item.value === theme);
  return option ? option.label : theme;
}

function getInterpolationModeLabel(mode) {
  const option = UI_CONFIG.interpolationModeOptions.find(item => item.value === mode);
  return option ? option.label : mode;
}

/**
 * ポイント配列内の最大Y値を取得します。
 * @param {THREE.Vector3[]} points コース点配列です。
 * @returns {number} 最大Y値です。
 */
function getPointMaxY(points) {
  let maxY = 0;

  for (const point of points) {
    if (point.y > maxY) {
      maxY = point.y;
    }
  }

  return maxY;
}

/**
 * 指定位置に価格ラベルを追加します。
 * @param {number} price 価格です。
 * @param {THREE.Vector3} point 対象ポイントです。
 * @param {object} buildSettings ビルド設定です。
 * @param {number} labelYOffset ラベルYオフセットです。
 * @param {number} minClose 最小終値です。
 * @param {number} maxClose 最大終値です。
 * @param {THREE.Group} courseGroup 追加先グループです。
 */
function addPriceLabel(price, point, buildSettings, labelYOffset, minClose, maxClose, courseGroup) {
  const priceY = getPosYByPrice(
    price,
    maxClose,
    minClose,
    buildSettings.heightScale,
    buildSettings.invertPrice
  );

  const label = createTextSprite(
    price.toFixed(CONFIG.course.monthlyLabel.priceDecimals)
  );

  label.position.set(
    CONFIG.label.position.x,
    priceY + labelYOffset,
    point.z
  );

  courseGroup.add(label);
}

/**
 * 既存コース表示を破棄して初期化します。
 */
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

/**
 * ポイント列から滑らかな曲線を生成します。
 * @param {THREE.Vector3[]} points コース点配列です。
 * @param {object} buildSettings ビルド設定です。
 * @returns {THREE.Curve} 生成した曲線です。
 */
export function buildSmoothCurve(points, buildSettings) {
  if (points.length < 2) {
    throw new Error('曲線を作るための点が不足しています。');
  }

  if (buildSettings.interpolationMode === 'none') {
    const curvePath = new THREE.CurvePath();

    for (let i = 0; i < points.length - 1; i += 1) {
      curvePath.add(new THREE.LineCurve3(points[i], points[i + 1]));
    }

    return curvePath;
  }

  return new THREE.CatmullRomCurve3(
    points,
    false,
    buildSettings.curveType,
    buildSettings.curveTension
  );
}

/**
 * 月次の節目ラベルをコース上に追加します。
 * @param {THREE.Vector3[]} points コース点配列です。
 * @param {number[]} prices 価格配列です。
 * @param {{date: Date, close: number}[]} rows 価格データ行配列です。
 * @param {object} buildSettings ビルド設定です。
 * @param {number} minClose 最小終値です。
 * @param {number} maxClose 最大終値です。
 * @param {THREE.Group} courseGroup 追加先グループです。
 */
export function addMonthlyLabels(points, prices, rows, buildSettings, minClose, maxClose, courseGroup) {
  if (!points.length || !rows.length) {
    return;
  }

  const monthlyLabelConfig = CONFIG.course.monthlyLabel;
  let lastMonthKey = '';

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const point = points[i];

    if (!point) {
      continue;
    }

    const date = row.date;
    const monthKey =
      `${date.getFullYear()}-` +
      `${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (monthKey === lastMonthKey) {
      continue;
    }

    lastMonthKey = monthKey;

    const monthLabel = createTextSprite(monthKey);
    monthLabel.position.set(
      CONFIG.label.position.x,
      point.y + CONFIG.label.position.yOffset,
      point.z
    );
    courseGroup.add(monthLabel);

    addPriceLabel(
      prices[i] * monthlyLabelConfig.upperPriceRatio,
      point,
      buildSettings,
      CONFIG.label.position.yOffset,
      minClose,
      maxClose,
      courseGroup
    );

    addPriceLabel(
      prices[i] * monthlyLabelConfig.lowerPriceRatio,
      point,
      buildSettings,
      CONFIG.label.position.yOffset,
      minClose,
      maxClose,
      courseGroup
    );
  }
}

/**
 * 曲線からコース表示用メッシュ一式を構築します。
 * @param {THREE.Curve} curve 対象の曲線です。
 * @param {THREE.Group} courseGroup 追加先グループです。
 * @param {number} pointCount コース点数です。
 * @param {object} buildSettings ビルド設定です。
 */
export function buildCourseMeshes(curve, courseGroup, pointCount, buildSettings) {
  addRailsToGroup(courseGroup, curve, pointCount, buildSettings);
}

/**
 * 値を指定範囲に収めます。
 * @param {number} value 対象の値です。
 * @param {number} min 最小値です。
 * @param {number} max 最大値です。
 * @returns {number} 範囲内に収めた値です。
 */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * 見やすい値に丸め込みます。
 * @param {number} value 対象の値です。
 * @returns {number} 丸めた値です。
 */
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

/**
 * 入力データから自動調整パラメータを計算します。
 * @param {{date: Date, close: number}[]} rows 価格データ行配列です。
 * @returns {{
 *   heightScale: number,
 *   zStep: number,
 *   minClose: number,
 *   maxClose: number,
 *   range: number,
 *   count: number
 * }} 自動調整パラメータです。
 */
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

export async function calculateAutoBuildParamsFromSettings(buildSettings) {
  const csvText = await readCsvTextFromUrl(buildSettings.csvUrl);
  const allRows = parseCSV(csvText);
  const filteredRows = filterRowsByStartDate(
    allRows,
    buildSettings.startDateText
  );

  if (filteredRows.length < 2) {
    return null;
  }

  return calcAutoBuildParams(filteredRows);
}

/**
 * ビルドに必要なデータを準備します。
 * ここでは app 状態を書き換えず、材料だけを返します。
 * @param {object} buildSettings ビルド設定です。
 * @returns {Promise<object>} ビルド準備結果です。
 */
async function prepareCourseBuildData(buildSettings) {
  const csvText = await readCsvTextFromUrl(buildSettings.csvUrl);
  const allRows = parseCSV(csvText);
  const filteredRows = filterRowsByStartDate(
    allRows,
    buildSettings.startDateText
  );

  let resolvedBuildSettings = { ...buildSettings };
  let autoParams = null;

  if (resolvedBuildSettings.autoScale) {
    autoParams = calcAutoBuildParams(filteredRows);
    resolvedBuildSettings = {
      ...resolvedBuildSettings,
      heightScale: autoParams.heightScale,
      zStep: autoParams.zStep
    };
  }

  const { points, prices, baseClose, minClose, maxClose } =
    buildCoursePoints(filteredRows, resolvedBuildSettings);

  const curve = buildSmoothCurve(points, resolvedBuildSettings);

  return {
    buildSettings: resolvedBuildSettings,
    filteredRows,
    points,
    prices,
    curve,
    baseClose,
    minClose,
    maxClose,
    autoParams
  };
}

/**
 * ビルド結果を app 状態へ反映します。
 * @param {object} prepared ビルド準備結果です。
 */
function applyCourseBuildResult(prepared) {
  app.buildSettings = { ...prepared.buildSettings };
  app.coursePoints = prepared.points;
  app.prices = prepared.prices;
  app.curve = prepared.curve;
  app.minClose = prepared.minClose;
  app.maxClose = prepared.maxClose;
}

/**
 * ステータス表示用の build 情報を作ります。
 * @param {object} prepared ビルド準備結果です。
 * @returns {object} 表示用 build 情報です。
 */
function createLastBuildInfo(prepared) {
  const groundSize = getDynamicGroundSize();
  const firstDate = toDateTextLocal(prepared.filteredRows[0].date);
  const lastDate = toDateTextLocal(
    prepared.filteredRows[prepared.filteredRows.length - 1].date
  );
  const maxY = getPointMaxY(prepared.points);

  return {
    rowCount: prepared.filteredRows.length,
    firstDate,
    lastDate,
    baseClose: prepared.baseClose,
    minClose: prepared.minClose,
    maxClose: prepared.maxClose,
    heightScale: prepared.buildSettings.heightScale,
    zStep: prepared.buildSettings.zStep,
    interpolationModeLabel: getInterpolationModeLabel(prepared.buildSettings.interpolationMode),
    curveType: prepared.buildSettings.curveType,
    curveTension: prepared.buildSettings.curveTension,
    maxY,
    groundWidth: groundSize.width,
    groundDepth: groundSize.depth,
    autoScale: prepared.buildSettings.autoScale,
    invertPrice: prepared.buildSettings.invertPrice,
    themeLabel: getThemeLabel(prepared.buildSettings.theme),
    showHeightGuides: prepared.buildSettings.showHeightGuides
  };
}

/**
 * UI から受け取った設定をもとにコースを構築します。
 * @param {object} buildSettings ビルド設定です。
 * @returns {Promise<{
 *   buildSettings: object,
 *   autoAdjusted: boolean,
 *   autoParams: object | null
 * }>} ビルド結果です。
 */
export async function buildCourse(buildSettings) {
  resetCourseGroup();

  const prepared = await prepareCourseBuildData(buildSettings);
  applyCourseBuildResult(prepared);

  buildCourseMeshes(
    app.curve,
    app.courseGroup,
    app.coursePoints.length,
    prepared.buildSettings
  );
  addMonthlyLabels(
    prepared.points,
    prepared.prices,
    prepared.filteredRows,
    prepared.buildSettings,
    prepared.minClose,
    prepared.maxClose,
    app.courseGroup
  );

  const lastBuildInfo = createLastBuildInfo(prepared);

  return {
    buildSettings: prepared.buildSettings,
    autoAdjusted: prepared.autoParams !== null,
    autoParams: prepared.autoParams,
    lastBuildInfo
  };
}
