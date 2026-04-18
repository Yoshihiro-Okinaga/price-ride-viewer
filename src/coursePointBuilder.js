import * as THREE from 'https://unpkg.com/three@0.183.0/build/three.module.js';
import { getPosYByPrice } from './utils.js';

/**
 * 価格データからコース点列を生成します。
 * @param {{date: Date, close: number}[]} rows 価格データ行配列です。
 * @param {object} buildSettings ビルド設定です。
 * @returns {{
 *   points: THREE.Vector3[],
 *   prices: number[],
 *   baseClose: number,
 *   minClose: number,
 *   maxClose: number
 * }} コース生成に必要な点列情報です。
 */
export function buildCoursePoints(rows, buildSettings) {
  if (rows.length < 2) {
    throw new Error('開始日以降の有効データが少なすぎます。');
  }

  const minClose = Math.min(...rows.map(row => row.close));
  const maxClose = Math.max(...rows.map(row => row.close));
  const points = [];
  const prices = [];

  for (let i = 0; i < rows.length; i++) {
    const close = rows[i].close;
    prices.push(close);

    const y = getPosYByPrice(
      close,
      maxClose,
      minClose,
      buildSettings.heightScale,
      buildSettings.invertPrice
    );

    const z = i * buildSettings.zStep;
    points.push(new THREE.Vector3(0, y, z));
  }

  const baseClose = buildSettings.invertPrice ? maxClose : minClose;

  return {
    points,
    prices,
    baseClose,
    minClose,
    maxClose
  };
}