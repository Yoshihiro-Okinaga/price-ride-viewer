import { UI_CONFIG } from './config/uiConfig.js';
import { readNumber } from './utils.js';

export const ui = {
  panel: document.getElementById('ui'),
  toggleUiButton: document.getElementById('toggleUiButton'),

  appTitle: document.getElementById('appTitle'),
  csvLabel: document.getElementById('csvLabel'),
  csvSelect: document.getElementById('csvSelect'),

  startDateLabel: document.getElementById('startDateLabel'),
  startDateInput: document.getElementById('startDate'),

  heightScaleLabel: document.getElementById('heightScaleLabel'),
  heightScaleInput: document.getElementById('heightScale'),

  zStepLabel: document.getElementById('zStepLabel'),
  zStepInput: document.getElementById('zStep'),

  interpolationModeLabel: document.getElementById('interpolationModeLabel'),
  interpolationModeSelect: document.getElementById('interpolationMode'),

  curveTypeLabel: document.getElementById('curveTypeLabel'),
  curveTypeSelect: document.getElementById('curveType'),

  curveTensionLabel: document.getElementById('curveTensionLabel'),
  curveTensionInput: document.getElementById('curveTension'),

  autoScaleLabel: document.getElementById('autoScaleLabel'),
  autoScaleLabelText: document.querySelector('#autoScaleLabel span'),
  autoScaleInput: document.getElementById('autoScale'),

  rideSpeedLabel: document.getElementById('rideSpeedLabel'),
  rideSpeedInput: document.getElementById('rideSpeed'),

  lookAheadLabel: document.getElementById('lookAheadLabel'),
  lookAheadInput: document.getElementById('lookAhead'),

  invertPriceLabel: document.getElementById('invertPriceLabel'),
  invertPriceLabelText: document.querySelector('#invertPriceLabel span'),
  invertPriceInput: document.getElementById('invertPrice'),

  themeLabel: document.getElementById('themeLabel'),
  themeSelect: document.getElementById('themeSelect'),

  showHeightGuidesLabel: document.getElementById('showHeightGuidesLabel'),
  showHeightGuidesLabelText: document.querySelector(
    '#showHeightGuidesLabel span'
  ),
  showHeightGuidesInput: document.getElementById('showHeightGuides'),

  buildButton: document.getElementById('buildButton'),
  status: document.getElementById('status')
};

let isUiVisible = true;

function getUiText() {
  return UI_CONFIG.displayText;
}

function getValidationMessage() {
  return UI_CONFIG.validationMessage;
}

function getStatusFormat() {
  return UI_CONFIG.statusFormat;
}

function createOption(value, label) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = label;
  return option;
}

function populateCsvOptions() {
  const text = getUiText();
  const groups = UI_CONFIG.csvOptions;

  ui.csvSelect.innerHTML = '';
  ui.csvSelect.appendChild(createOption('', text.csvPlaceholder));

  for (const group of groups) {
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

  for (const item of UI_CONFIG.themeOptions) {
    ui.themeSelect.appendChild(createOption(item.value, item.label));
  }
}

function populateInterpolationModeOptions() {
  ui.interpolationModeSelect.innerHTML = '';

  for (const item of UI_CONFIG.interpolationModeOptions) {
    ui.interpolationModeSelect.appendChild(createOption(item.value, item.label));
  }
}

function populateCurveTypeOptions() {
  ui.curveTypeSelect.innerHTML = '';

  for (const item of UI_CONFIG.curveTypeOptions) {
    ui.curveTypeSelect.appendChild(createOption(item.value, item.label));
  }
}

export function setStatus(text) {
  ui.status.textContent = text;
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
    interpolationMode: ui.interpolationModeSelect.value,
    curveType: ui.curveTypeSelect.value,
    curveTension: readNumber(ui.curveTensionInput, validation.invalidCurveTension),
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

  if (settings.curveTension < 0) {
    throw new Error(validation.invalidCurveTension);
  }

  return settings;
}

export function getRuntimeSettingsFromUI(currentRuntimeSettings) {
  const nextRuntimeSettings = { ...currentRuntimeSettings };
  const rideSpeed = Number(ui.rideSpeedInput.value);
  const lookAhead = Number(ui.lookAheadInput.value);

  if (Number.isFinite(rideSpeed) && rideSpeed >= 0) {
    nextRuntimeSettings.rideSpeed = rideSpeed;
  }

  if (Number.isFinite(lookAhead) && lookAhead >= 0) {
    nextRuntimeSettings.lookAhead = lookAhead;
  }

  return nextRuntimeSettings;
}

export function getSceneDisplaySettingsFromUI() {
  return {
    theme: ui.themeSelect.value,
    showHeightGuides: ui.showHeightGuidesInput.checked
  };
}

export function applyUiConfigToDom() {
  const text = getUiText();
  const initial = UI_CONFIG.initialValues;

  document.title = text.appTitle;
  ui.appTitle.textContent = text.appTitle;

  ui.csvLabel.textContent = text.csvLabel;
  ui.startDateLabel.textContent = text.startDateLabel;
  ui.heightScaleLabel.textContent = text.heightScaleLabel;
  ui.zStepLabel.textContent = text.zStepLabel;
  ui.interpolationModeLabel.textContent = text.interpolationModeLabel;
  ui.curveTypeLabel.textContent = text.curveTypeLabel;
  ui.curveTensionLabel.textContent = text.curveTensionLabel;
  ui.rideSpeedLabel.textContent = text.rideSpeedLabel;
  ui.lookAheadLabel.textContent = text.lookAheadLabel;
  ui.themeLabel.textContent = text.themeLabel;
  ui.buildButton.textContent = text.buildButtonLabel;
  ui.status.textContent = text.initialStatus;

  if (ui.autoScaleLabelText) {
    ui.autoScaleLabelText.textContent = text.autoScaleLabel;
  }

  if (ui.invertPriceLabelText) {
    ui.invertPriceLabelText.textContent = text.invertPriceLabel;
  }

  if (ui.showHeightGuidesLabelText) {
    ui.showHeightGuidesLabelText.textContent = text.showHeightGuidesLabel;
  }

  populateCsvOptions();
  populateThemeOptions();
  populateInterpolationModeOptions();
  populateCurveTypeOptions();

  ui.startDateInput.value = initial.startDate;
  ui.heightScaleInput.value = String(initial.heightScale);
  ui.heightScaleInput.step = String(initial.heightScaleStep);
  ui.zStepInput.value = String(initial.zStep);
  ui.zStepInput.step = String(initial.zStepStep);
  ui.interpolationModeSelect.value = initial.interpolationMode;
  ui.curveTypeSelect.value = initial.curveType;
  ui.curveTensionInput.value = String(initial.curveTension);
  ui.curveTensionInput.step = String(initial.curveTensionStep);
  ui.autoScaleInput.checked = initial.autoScale;
  ui.rideSpeedInput.value = String(initial.rideSpeed);
  ui.rideSpeedInput.step = String(initial.rideSpeedStep);
  ui.lookAheadInput.value = String(initial.lookAhead);
  ui.lookAheadInput.step = String(initial.lookAheadStep);
  ui.invertPriceInput.checked = initial.invertPrice;
  ui.themeSelect.value = initial.theme;
  ui.showHeightGuidesInput.checked = initial.showHeightGuides;

  if (initial.csvUrl) {
    ui.csvSelect.value = initial.csvUrl;
  }
}

export function applyAutoBuildParamsToUI(autoParams) {
  ui.heightScaleInput.value = String(autoParams.heightScale);
  ui.zStepInput.value = String(autoParams.zStep);
}

export function updateStatus(lastBuildInfo, runtimeSettings) {
  const info = lastBuildInfo;
  const runtime = runtimeSettings;
  const text = getUiText();
  const format = getStatusFormat();

  if (!info) {
    setStatus(text.initialStatus);
    return;
  }

  const lines = [
    `件数: ${info.rowCount}`,
    `期間: ${info.firstDate} ～ ${info.lastDate}`,
    `${text.baseCloseLow}: ${info.minClose.toFixed(format.priceDecimals)}`,
    `${text.baseCloseHigh}: ${info.maxClose.toFixed(format.priceDecimals)}`,
    `高さ倍率: ${info.heightScale}`,
    `Z間隔: ${info.zStep}`,
    `補間方式: ${info.interpolationModeLabel}`,
    `カーブタイプ: ${info.curveType}`,
    `テンション: ${info.curveTension}`,
    `最大Y: ${info.maxY.toFixed(format.maxYDecimals)}`,
    `地面: ${info.groundWidth} × ${info.groundDepth}`,
    `自動調整: ${info.autoScale ? text.autoScaleOn : text.autoScaleOff}`,
    `価格表示: ${info.invertPrice ? text.invertOn : text.invertOff}`,
    `背景: ${info.themeLabel}`,
    `高さガイド: ${
      info.showHeightGuides ? text.guideVisible : text.guideHidden
    }`,
    `移動速度: ${runtime.rideSpeed}`,
    `先読み量: ${runtime.lookAhead}`,
    `UI切替: ${text.uiToggleHelp}`
  ];

  setStatus(lines.join(' / '));
}