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

function getUiText() {
  return CONFIG.ui.displayText;
}

function getValidationMessage() {
  return CONFIG.ui.validationMessage;
}

function getStatusFormat() {
  return CONFIG.ui.statusFormat;
}

function createOption(value, label) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = label;
  return option;
}

function populateCsvOptions() {
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

function populateThemeOptions() {
  ui.themeSelect.innerHTML = '';

  for (const item of CONFIG.ui.themeOptions) {
    ui.themeSelect.appendChild(createOption(item.value, item.label));
  }
}

export function applyUiConfigToDom() {
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

export function setStatus(text) {
  ui.statusEl.textContent = text;
}

export function setUiVisible(visible) {
  const text = getUiText();

  ui.panel.style.display = visible ? 'block' : 'none';
  ui.toggleUiButton.textContent = visible ? text.hideUi : text.showUi;
  isUiVisible = visible;
}

export function toggleUiVisible() {
  setUiVisible(!isUiVisible);
}

export function getBuildSettingsFromUI() {
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

export function applyRuntimeSettingsFromUI() {
  const rideSpeed = Number(ui.rideSpeedInput.value);
  const lookAhead = Number(ui.lookAheadInput.value);

  if (Number.isFinite(rideSpeed) && rideSpeed >= 0) {
    app.runtimeSettings.rideSpeed = rideSpeed;
  }

  if (Number.isFinite(lookAhead) && lookAhead >= 0) {
    app.runtimeSettings.lookAhead = lookAhead;
  }
}

export function syncStateFromUI() {
  app.buildSettings = getBuildSettingsFromUI();
  applyRuntimeSettingsFromUI();
}

export function updateStatus() {
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