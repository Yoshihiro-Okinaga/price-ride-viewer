/**
 * 価格をコース上のY座標へ変換します。
 * @param {*} price 価格です。
 * @param {*} maxPrice 価格の最大値です。
 * @param {*} minPrice 価格の最小値です。
 * @param {*} heightScale 高さ倍率です。
 * @param {*} invertPrice 価格反転フラグです。
 * @returns {*} 変換後のY座標です。
 */
export function getPosYByPrice(price, maxPrice, minPrice, heightScale, invertPrice) {
  // この関数の主要処理をここから実行します。
  return invertPrice
    ? -(price - maxPrice) * heightScale
    : (price - minPrice) * heightScale;
}

/**
 * Object3D 配下のリソースを再帰的に破棄します。
 * @param {*} root 破棄対象のルートObject3Dです。
 * @returns {*} なし。
 */
export function disposeObject3D(root) {
  // この関数の主要処理をここから実行します。
  if (!root) return;

  root.traverse(obj => {
    if (obj.geometry) {
      obj.geometry.dispose();
    }

    if (obj.material) {
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const mat of materials) {
        if (mat.map) mat.map.dispose();
        mat.dispose();
      }
    }
  });
}

/**
 * 日付文字列をローカル日時として解釈します。
 * @param {*} dateText 日付文字列です。
 * @returns {*} 生成した Date オブジェクトです。
 */
export function parseDateLocal(dateText) {
  // この関数の主要処理をここから実行します。
  const m = /^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/.exec(dateText.trim());
  if (!m) return new Date(NaN);

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);

  return new Date(year, month - 1, day);
}

/**
 * Date をローカル日付文字列へ変換します。
 * @param {*} date Dateオブジェクトです。
 * @returns {*} 日付文字列です。
 */
export function toDateTextLocal(date) {
  // この関数の主要処理をここから実行します。
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 入力値から疑似乱数的な値を返します。
 * @param {*} i 疑似乱数生成用の整数入力です。
 * @returns {*} 0 以上 1 未満の疑似乱数値です。
 */
export function pseudoRandom(i) {
  // この関数の主要処理をここから実行します。
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * input要素から数値を読み取り検証します。
 * @param {*} inputEl input要素です。
 * @param {*} errorMessage 数値不正時に使うエラーメッセージです。
 * @returns {*} 読み取った数値です。
 */
export function readNumber(inputEl, errorMessage) {
  // この関数の主要処理をここから実行します。
  const value = Number(inputEl.value);
  if (!Number.isFinite(value)) {
    throw new Error(errorMessage);
  }
  return value;
}