import { CONFIG } from './config.js';
import { app } from './state.js';
import { readNumber } from './utils.js';

export const ui = {
  panel: document.getElementById('ui'),
  titleEl: document.getElementById('appTitle'),
  csvLabelEl: document.getElementById('csvLabel'),
  csvSelect: document.getElementById('csvSelect'),
  startDateLabelEl: document.getElementById('startDateLabel'),
  startDateInput: document.getElementById('startDate'),
  heightScaleLabelEl: document.getElementById('heightScaleLabel'),
  heightScaleInput: document.getElementById('heightScale'),
  zStepLabelEl: document.getElementById('zStepLabel'),
  zStepInput: document.getElementById('zStep'),

  autoScaleLabelEl: document.getElementById('autoScaleLabel'),
  autoScaleLabelTextEl: document.querySelector('#autoScaleLabel span'),
  autoScaleInput: document.getElementById('autoScale'),

  rideSpeedLabelEl: document.getElementById('rideSpeedLabel'),
  rideSpeedInput: document.getElementById('rideSpeed'),
  lookAheadLabelEl: document.getElementById('lookAheadLabel'),
  lookAheadInput: document.getElementById('lookAhead'),

  invertPriceLabelEl: document.getElementById('invertPriceLabel'),
  invertPriceLabelTextEl: document.querySelector('#invertPriceLabel span'),
  invertPriceInput: document.getElementById('invertPrice'),

  themeLabelEl: document.getElementById('themeLabel'),
  themeSelect: document.getElementById('themeSelect'),

  showHeightGuidesLabelEl: document.getElementById('showHeightGuidesLabel'),
  showHeightGuidesLabelTextEl: document.querySelector('#showHeightGuidesLabel span'),
  showHeightGuidesInput: document.getElementById('showHeightGuides'),

  buildButton: document.getElementById('buildButton'),
  toggleUiButton: document.getElementById('toggleUiButton'),
  statusEl: document.getElementById('status')
};

export let isUiVisible = true;

/**
 * UI表示用テキスト設定を取得します。
 * @returns {*} UI表示テキスト設定です。
 */
function getUiText() {
  // この関数の主要処理をここから実行します。
  return CONFIG.ui.displayText;
}

/**
 * getValidationMessage の処理を行います。
 * @returns {*} 戻り値です。
 */
function getValidationMessage() {
  // この関数の主要処理をここから実行します。
  return CONFIG.ui.validationMessage;
}

/**
 * getStatusFormat の処理を行います。
 * @returns {*} 戻り値です。
 */
function getStatusFormat() {
  // この関数の主要処理をここから実行します。
  return CONFIG.ui.statusFormat;
}

/**
 * select要素用のoption要素を生成します。
 * @param {*} value 対象の値です。
 * @param {*} label 引数です。
 * @returns {*} 生成したオブジェクトです。
 */
function createOption(value, label) {
  // この関数の主要処理をここから実行します。
  const option = document.createElement('option');
  option.value = value;
  option.textContent = label;
  return option;
}

/**
 * CSV選択肢をDOMへ反映します。
 * @returns {*} なし。
 */
function populateCsvOptions() {
  // この関数の主要処理をここから実行します。
  const text = getUiText();
  ui.csvSelect.innerHTML = '';

  ui.csvSelect.appendChild(createOption('', text.csvPlaceholder));

  for (const group of CONFIG.ui.csvOptions) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = group.groupLabel;

    for (const item of group.options) {
      optgroup.appendChild(createOption(item.value, item.label));
    }

    ui.csvSelect.appendChild(optgroup);
  }
}

/**
 * テーマ選択肢をDOMへ反映します。
 * @returns {*} なし。
 */
function populateThemeOptions() {
  // この関数の主要処理をここから実行します。
  ui.themeSelect.innerHTML = '';

  for (const item of CONFIG.ui.themeOptions) {
    ui.themeSelect.appendChild(createOption(item.value, item.label));
  }
}

/**
 * 設定値をもとにUI文言と初期状態をDOMへ反映します。
 * @returns {*} なし。
 */
export function applyUiConfigToDom() {
  // この関数の主要処理をここから実行します。
  const text = getUiText();
  const initial = CONFIG.ui.initialValues;

  document.title = text.appTitle;
  ui.titleEl.textContent = text.appVersionLabel;

  ui.csvLabelEl.textContent = text.csvLabel;
  ui.startDateLabelEl.textContent = text.startDateLabel;
  ui.heightScaleLabelEl.textContent = text.heightScaleLabel;
  ui.zStepLabelEl.textContent = text.zStepLabel;

  if (ui.autoScaleLabelTextEl) {
    ui.autoScaleLabelTextEl.textContent = text.autoScaleLabel;
  }

  ui.rideSpeedLabelEl.textContent = text.rideSpeedLabel;
  ui.lookAheadLabelEl.textContent = text.lookAheadLabel;

  if (ui.invertPriceLabelTextEl) {
    ui.invertPriceLabelTextEl.textContent = text.invertPriceLabel;
  }

  ui.themeLabelEl.textContent = text.themeLabel;

  if (ui.showHeightGuidesLabelTextEl) {
    ui.showHeightGuidesLabelTextEl.textContent = text.showHeightGuidesLabel;
  }

  ui.buildButton.textContent = text.buildButtonLabel;
  ui.statusEl.textContent = text.initialStatus;

  populateCsvOptions();
  populateThemeOptions();

  ui.startDateInput.value = initial.startDate;
  ui.heightScaleInput.value = String(initial.heightScale);
  ui.heightScaleInput.step = String(initial.heightScaleStep);
  ui.zStepInput.value = String(initial.zStep);
  ui.zStepInput.step = String(initial.zStepStep);
  ui.autoScaleInput.checked = initial.autoScale;
  ui.rideSpeedInput.value = String(initial.rideSpeed);
  ui.rideSpeedInput.step = String(initial.rideSpeedStep);
  ui.lookAheadInput.value = String(initial.lookAhead);
  ui.lookAheadInput.step = String(initial.lookAheadStep);
  ui.invertPriceInput.checked = initial.invertPrice;
  ui.themeSelect.value = initial.theme;
  ui.showHeightGuidesInput.checked = initial.showHeightGuides;
}

/**
 * ステータス表示を更新します。
 * @param {*} text 表示テキストです。
 * @returns {*} なし。
 */
export function setStatus(text) {
  // この関数の主要処理をここから実行します。
  ui.statusEl.textContent = text;
}

/**
 * UIの表示状態を切り替えます。
 * @param {*} visible 表示する場合は true です。
 * @returns {*} なし。
 */
export function setUiVisible(visible) {
  // この関数の主要処理をここから実行します。
  const text = getUiText();

  ui.panel.style.display = visible ? 'block' : 'none';
  ui.toggleUiButton.textContent = visible ? text.hideUi : text.showUi;
  isUiVisible = visible;
}

/**
 * UIの表示状態をトグルします。
 * @returns {*} なし。
 */
export function toggleUiVisible() {
  // この関数の主要処理をここから実行します。
  setUiVisible(!isUiVisible);
}

/**
 * UI入力値からビルド設定を読み取ります。
 * @returns {*} UIから読み取ったビルド設定です。
 */
export function getBuildSettingsFromUI() {
  // この関数の主要処理をここから実行します。
  const validation = getValidationMessage();

  const settings = {
    startDateText: ui.startDateInput.value.trim(),
    heightScale: readNumber(ui.heightScaleInput, validation.invalidHeightScale),
    zStep: readNumber(ui.zStepInput, validation.invalidZStep),
    autoScale: ui.autoScaleInput.checked,
    invertPrice: ui.invertPriceInput.checked,
    theme: ui.themeSelect.value,
    showHeightGuides: ui.showHeightGuidesInput.checked,
    csvUrl: ui.csvSelect.value
  };

  if (!settings.csvUrl) {
    throw new Error(validation.missingCsv);
  }

  if (settings.zStep <= 0) {
    throw new Error(validation.nonPositiveZStep);
  }

  if (settings.heightScale <= 0) {
    throw new Error(validation.nonPositiveHeightScale);
  }

  return settings;
}

/**
 * UI入力値から実行時設定を反映します。
 * @returns {*} 反映後の実行時設定です。
 */
export function applyRuntimeSettingsFromUI() {
  // この関数の主要処理をここから実行します。
  const rideSpeed = Number(ui.rideSpeedInput.value);
  const lookAhead = Number(ui.lookAheadInput.value);

  if (Number.isFinite(rideSpeed) && rideSpeed >= 0) {
    app.runtimeSettings.rideSpeed = rideSpeed;
  }

  if (Number.isFinite(lookAhead) && lookAhead >= 0) {
    app.runtimeSettings.lookAhead = lookAhead;
  }
}

/**
 * UIの値をアプリ状態へ同期します。
 * @returns {*} なし。
 */
export function syncStateFromUI() {
  // この関数の主要処理をここから実行します。
  app.buildSettings = getBuildSettingsFromUI();
  applyRuntimeSettingsFromUI();
}

/**
 * 現在の状態に基づいてステータス表示を組み立てます。
 * @returns {*} なし。
 */
export function updateStatus() {
  // この関数の主要処理をここから実行します。
  const info = app.lastBuildInfo;
  const runtime = app.runtimeSettings;
  const text = getUiText();
  const format = getStatusFormat();

  if (!info) {
    setStatus(text.initialStatus);
    return;
  }

  setStatus(
    [
      `件数: ${info.rowCount}`,
      `期間: ${info.firstDate} ～ ${info.lastDate}`,
      `基準終値（${info.invertPrice ? text.baseCloseHigh : text.baseCloseLow}）: ${info.baseClose.toFixed(format.priceDecimals)}`,
      `高さ倍率: ${info.heightScale}`,
      `Z間隔: ${info.zStep}`,
      `コース最大高さ(Y): ${info.maxY.toFixed(format.maxYDecimals)}`,
      `地面サイズ: ${info.groundWidth} x ${info.groundDepth}`,
      `自動調整: ${info.autoScale ? text.autoScaleOn : text.autoScaleOff}`,
      `期間最安値: ${info.minClose.toFixed(format.priceDecimals)}`,
      `期間最高値: ${info.maxClose.toFixed(format.priceDecimals)}`,
      `視線先読み量: ${runtime.lookAhead}`,
      `移動速度: ${runtime.rideSpeed}`,
      `価格の反転: ${info.invertPrice ? text.invertOn : text.invertOff}`,
      `背景テーマ: ${info.themeLabel}`,
      `高さガイド: ${info.showHeightGuides ? text.guideVisible : text.guideHidden}`,
      `UI切替: ${text.uiToggleHelp}`
    ].join('\n')
  );
}