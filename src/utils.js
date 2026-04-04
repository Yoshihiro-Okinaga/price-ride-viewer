export function getPosYByPrice(price, maxPrice, minPrice, heightScale, invertPrice) {
  return invertPrice
    ? -(price - maxPrice) * heightScale
    : (price - minPrice) * heightScale;
}

export function disposeObject3D(root) {
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

export function parseDateLocal(dateText) {
  const m = /^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/.exec(dateText.trim());
  if (!m) return new Date(NaN);

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);

  return new Date(year, month - 1, day);
}

export function toDateTextLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function pseudoRandom(i) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function readNumber(inputEl, errorMessage) {
  const value = Number(inputEl.value);
  if (!Number.isFinite(value)) {
    throw new Error(errorMessage);
  }
  return value;
}