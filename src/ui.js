import { app } from './state.js';
import { readNumber } from './utils.js';

export const ui = {
  panel: document.getElementById('ui'),
  csvSelect: document.getElementById('csvSelect'),
  startDateInput: document.getElementById('startDate'),
  heightScaleInput: document.getElementById('heightScale'),
  zStepInput: document.getElementById('zStep'),
  autoScaleInput: document.getElementById('autoScale'),
  rideSpeedInput: document.getElementById('rideSpeed'),
  lookAheadInput: document.getElementById('lookAhead'),
  invertPriceInput: document.getElementById('invertPrice'),
  themeSelect: document.getElementById('themeSelect'),
  showHeightGuidesInput: document.getElementById('showHeightGuides'),
  buildButton: document.getElementById('buildButton'),
  toggleUiButton: document.getElementById('toggleUiButton'),
  statusEl: document.getElementById('status')
};

export let isUiVisible = true;

export function setStatus(text) {
  ui.statusEl.textContent = text;
}

export function setUiVisible(visible) {
  ui.panel.style.display = visible ? 'block' : 'none';
  ui.toggleUiButton.textContent = visible ? 'UIを隠す' : 'UIを表示';
  isUiVisible = visible;
}

export function toggleUiVisible() {
  setUiVisible(!isUiVisible);
}

export function getBuildSettingsFromUI() {
  const settings = {
    startDateText: ui.startDateInput.value.trim(),
    heightScale: readNumber(ui.heightScaleInput, '高さの拡大率が不正です。'),
    zStep: readNumber(ui.zStepInput, 'Z方向の間隔が不正です。'),
    autoScale: ui.autoScaleInput.checked,
    invertPrice: ui.invertPriceInput.checked,
    theme: ui.themeSelect.value,
    showHeightGuides: ui.showHeightGuidesInput.checked,
    csvUrl: ui.csvSelect.value
  };

  if (!settings.csvUrl) {
    throw new Error('CSVファイルを選択してください。');
  }

  if (settings.zStep <= 0) {
    throw new Error('Z方向の間隔は 0 より大きい必要があります。');
  }

  if (settings.heightScale <= 0) {
    throw new Error('高さの拡大率は 0 より大きい必要があります。');
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

  if (!info) {
    setStatus('CSVを選んで「コースを作る」を押してください。');
    return;
  }

  setStatus(
    [
      `件数: ${info.rowCount}`,
      `期間: ${info.firstDate} ～ ${info.lastDate}`,
      `基準終値（${info.invertPrice ? '高値' : '安値'}）: ${info.baseClose.toFixed(5)}`,
      `高さ倍率: ${info.heightScale}`,
      `Z間隔: ${info.zStep}`,
      `コース最大高さ(Y): ${info.maxY.toFixed(1)}`,
      `地面サイズ: ${info.groundWidth} x ${info.groundDepth}`,
      `自動調整: ${info.autoScale ? 'ON' : 'OFF'}`,
      `期間最安値: ${info.minClose.toFixed(5)}`,
      `期間最高値: ${info.maxClose.toFixed(5)}`,
      `視線先読み量: ${runtime.lookAhead}`,
      `移動速度: ${runtime.rideSpeed}`,
      `価格の反転: ${info.invertPrice ? '反転' : '通常'}`,
      `背景テーマ: ${info.themeLabel}`,
      `高さガイド: ${info.showHeightGuides ? '表示' : '非表示'}`,
      `UI切替: ボタン または H キー`
    ].join('\n')
  );
}