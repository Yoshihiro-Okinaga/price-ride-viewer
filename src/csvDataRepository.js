import { parseDateLocal } from './utils.js';

/**
 * CSVテキストを価格データ配列へ変換します。
 * @param {string} text CSVテキストです。
 * @returns {{date: Date, close: number}[]} パース済みの行配列です。
 */
export function parseCSV(text) {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length < 2) {
    throw new Error('CSVにデータ行がありません。');
  }

  const header = lines[0].split(',').map(value => value.trim());
  const dateIndex = header.indexOf('日付');
  const closeIndex = header.indexOf('終値');

  if (dateIndex === -1 || closeIndex === -1) {
    throw new Error('CSVに「日付」または「終値」列が見つかりません。');
  }

  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const columns = lines[i].split(',').map(value => value.trim());
    const dateText = columns[dateIndex];
    const closeText = columns[closeIndex];

    if (!dateText || !closeText) {
      continue;
    }

    const close = Number(closeText);
    if (!Number.isFinite(close)) {
      continue;
    }

    const date = parseDateLocal(dateText);
    if (Number.isNaN(date.getTime())) {
      continue;
    }

    rows.push({ date, close });
  }

  rows.sort((left, right) => left.date - right.date);
  return rows;
}

/**
 * 開始日以降の行だけを抽出します。
 * @param {{date: Date, close: number}[]} rows 価格データ行配列です。
 * @param {string} startDateText 開始日文字列です。
 * @returns {{date: Date, close: number}[]} フィルタ後の行配列です。
 */
export function filterRowsByStartDate(rows, startDateText) {
  const startDate = parseDateLocal(startDateText);

  if (Number.isNaN(startDate.getTime())) {
    throw new Error('開始日が不正です。');
  }

  return rows.filter(row => row.date >= startDate);
}

/**
 * URLからCSVテキストを取得します。
 * @param {string} url CSV取得先URLです。
 * @returns {Promise<string>} 取得したCSVテキストです。
 */
export async function readCsvTextFromUrl(url) {
  if (!url) {
    throw new Error('CSVファイルのURLが指定されていません。');
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `CSVの取得に失敗しました: ${response.status} ${response.statusText}`
    );
  }

  return await response.text();
}