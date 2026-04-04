import * as THREE from 'https://unpkg.com/three@0.183.0/build/three.module.js';
import { parseDateLocal, getPosYByPrice } from './utils.js';

export function parseCSV(text) {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length < 2) {
    throw new Error('CSVにデータ行がありません。');
  }

  const header = lines[0].split(',').map(v => v.trim());
  const dateIndex = header.indexOf('日付');
  const closeIndex = header.indexOf('終値');

  if (dateIndex === -1 || closeIndex === -1) {
    throw new Error('CSVに「日付」または「終値」列が見つかりません。');
  }

  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(v => v.trim());

    const dateStr = cols[dateIndex];
    const closeStr = cols[closeIndex];

    if (!dateStr || !closeStr) continue;

    const close = Number(closeStr);
    if (!Number.isFinite(close)) continue;

    const date = parseDateLocal(dateStr);
    if (Number.isNaN(date.getTime())) continue;

    rows.push({ date, close });
  }

  rows.sort((a, b) => a.date - b.date);
  return rows;
}

export function filterRowsByStartDate(rows, startDateText) {
  const startDate = parseDateLocal(startDateText);

  if (Number.isNaN(startDate.getTime())) {
    throw new Error('開始日が不正です。');
  }

  return rows.filter(row => row.date >= startDate);
}

export function buildCoursePoints(rows, buildSettings) {
  if (rows.length < 2) {
    throw new Error('開始日以降の有効データが少なすぎます。');
  }

  const minClose = Math.min(...rows.map(row => row.close));
  const maxClose = Math.max(...rows.map(row => row.close));
  const points = [];
  const prices = [];

  for (let i = 0; i < rows.length; i++) {
    prices[i] = rows[i].close;

    const y = getPosYByPrice(
      rows[i].close,
      maxClose,
      minClose,
      buildSettings.heightScale,
      buildSettings.invertPrice
    );

    const z = i * buildSettings.zStep;
    points.push(new THREE.Vector3(0, y, z));
  }

  const baseClose = buildSettings.invertPrice ? maxClose : minClose;
  return { points, prices, baseClose, minClose, maxClose };
}

export async function readCsvTextFromUrl(url) {
  if (!url) {
    throw new Error('CSVファイルのURLが指定されていません。');
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`CSVの取得に失敗しました: ${response.status} ${response.statusText}`);
  }

  return await response.text();
}