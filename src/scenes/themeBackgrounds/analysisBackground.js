// ── ヘルパー：高さ帯の定義 ─────────────────────────────────

function makeBandColors(THREE) {
  return [
    new THREE.Color(0x0b2a52), // 低い高さ帯：暗い青
    new THREE.Color(0x118b8b), // 中央付近：青緑
    new THREE.Color(0x7fdfff), // 高い高さ帯：明るい水色
    new THREE.Color(0xf2fbff)  // 最高付近：白っぽい光
  ];
}

function makeBandRanges(maxY, bandColors) {
  return [
    { y0: 0,           y1: maxY * 0.25,                      color: bandColors[0], opacity: 0.050 },
    { y0: maxY * 0.25, y1: maxY * 0.58,                      color: bandColors[1], opacity: 0.045 },
    { y0: maxY * 0.58, y1: maxY * 0.86,                      color: bandColors[2], opacity: 0.040 },
    { y0: maxY * 0.86, y1: Math.max(maxY, maxY * 1.02),      color: bandColors[3], opacity: 0.065 }
  ];
}

function getBandIndex(y, maxY) {
  const n = Math.max(0, Math.min(1, y / Math.max(1, maxY)));
  if (n < 0.25) return 0;
  if (n < 0.58) return 1;
  if (n < 0.86) return 2;
  return 3;
}

// ── メトリクス計算 ───────────────────────────────────────────

/**
 * 解析空間の共通寸法メトリクスを計算します。
 */
function getAnalysisSpaceMetrics(CONFIG, rawMetrics) {
  const { maxY, depth, width } = rawMetrics;
  const groundY    = CONFIG.ground.y;
  const courseEndZ = depth;

  const SPACE_HALF_W = width * 0.72;
  const SPACE_FULL_W = SPACE_HALF_W * 2;
  const SPACE_Z_NEAR = -150;
  const SPACE_Z_FAR  = courseEndZ + 150;
  const SPACE_Y_BOT  = groundY;
  const SPACE_Y_TOP  = maxY + 30;
  const SPACE_DEPTH  = SPACE_Z_FAR - SPACE_Z_NEAR;
  const SPACE_HEIGHT = SPACE_Y_TOP - SPACE_Y_BOT;

  return {
    maxY, depth, width,
    groundY, courseEndZ,
    SPACE_HALF_W, SPACE_FULL_W,
    SPACE_Z_NEAR, SPACE_Z_FAR,
    SPACE_Y_BOT,  SPACE_Y_TOP,
    SPACE_DEPTH,  SPACE_HEIGHT
  };
}

// ── 1. 上空（Sky backdrop + 天井板）────────────────────────

function createSkyBackdrop(THREE, metrics) {
  const { groundY, courseEndZ, width, SPACE_Y_TOP } = metrics;
  const skyTopY = SPACE_Y_TOP + 170;
  const skyW    = width * 4.2;
  const skyH    = (skyTopY - groundY) * 2.5;

  const group = new THREE.Group();

  const skyCanvas = document.createElement('canvas');
  skyCanvas.width  = 2;
  skyCanvas.height = 256;
  const cx = skyCanvas.getContext('2d');
  if (cx) {
    const grad = cx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0.0, '#040c18');
    grad.addColorStop(0.5, '#081522');
    grad.addColorStop(1.0, '#0c1e30');
    cx.fillStyle = grad;
    cx.fillRect(0, 0, 2, 256);
  }
  const skyTex  = new THREE.CanvasTexture(skyCanvas);
  const skyMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(skyW, skyH),
    new THREE.MeshBasicMaterial({ map: skyTex, depthWrite: false })
  );
  skyMesh.position.set(0, groundY + skyH * 0.4, -300);
  group.add(skyMesh);

  return group;
}

// ── 2. 天井板 ────────────────────────────────────────────────

function createCeilingPanel(THREE, metrics) {
  const { groundY, courseEndZ, width, SPACE_Y_TOP } = metrics;
  const skyTopY = SPACE_Y_TOP + 170;
  const skyW    = width * 4.2;

  const ceilMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(skyW, width * 3.4),
    new THREE.MeshBasicMaterial({ color: 0x040c18, depthWrite: false })
  );
  ceilMesh.rotation.x = Math.PI / 2;
  ceilMesh.position.set(0, skyTopY + 50, courseEndZ * 0.4);
  return ceilMesh;
}

// ── 3. 床（ソリッド板 + グリッド線）────────────────────────

function createFloorGrid(THREE, metrics) {
  const { width, courseEndZ, groundY, SPACE_HALF_W } = metrics;
  const cellSize = Math.max(50, Math.round(width / 8 / 50) * 50);
  const gridXMin = -SPACE_HALF_W;
  const gridXMax =  SPACE_HALF_W;
  const gridZMin = -250;
  const gridZMax =  courseEndZ + 450;

  const xSteps = Math.ceil((gridXMax - gridXMin) / cellSize) + 1;
  const zSteps = Math.ceil((gridZMax - gridZMin) / cellSize) + 1;

  const group = new THREE.Group();

  // グリッド線
  const pts = [];
  for (let iz = 0; iz < zSteps; iz++) {
    const z = gridZMin + iz * cellSize;
    pts.push(new THREE.Vector3(gridXMin, groundY, z));
    pts.push(new THREE.Vector3(gridXMax, groundY, z));
  }
  for (let ix = 0; ix < xSteps; ix++) {
    const x = gridXMin + ix * cellSize;
    pts.push(new THREE.Vector3(x, groundY, gridZMin));
    pts.push(new THREE.Vector3(x, groundY, gridZMax));
  }
  group.add(new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0x1a5080, transparent: true, opacity: 0.55 })
  ));

  // ソリッド板
  const floorMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(gridXMax - gridXMin, gridZMax - gridZMin),
    new THREE.MeshBasicMaterial({ color: 0x060e1c, transparent: true, opacity: 0.75, depthWrite: false })
  );
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.set(0, groundY - 0.5, (gridZMin + gridZMax) / 2);
  group.add(floorMesh);

  return group;
}

// ── 4. 高さ帯の水平面（基準面 + 帯色面 + 枠線）──────────────

function createHeightBandPlanes(THREE, metrics) {
  const { maxY, SPACE_FULL_W, SPACE_DEPTH, SPACE_Z_NEAR, SPACE_Z_FAR, SPACE_HALF_W } = metrics;
  const bandColors = makeBandColors(THREE);
  const bandRanges = makeBandRanges(maxY, bandColors);
  const zMid = (SPACE_Z_NEAR + SPACE_Z_FAR) / 2;

  const group = new THREE.Group();

  // Y=0 基準面（シアン半透明）
  const refMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(SPACE_FULL_W, SPACE_DEPTH),
    new THREE.MeshBasicMaterial({ color: 0x00bbff, transparent: true, opacity: 0.055, depthWrite: false, side: THREE.DoubleSide })
  );
  refMesh.rotation.x = -Math.PI / 2;
  refMesh.position.set(0, 0, zMid);
  group.add(refMesh);

  // 高さ帯の水平色面
  for (const range of bandRanges) {
    const yMid = (range.y0 + range.y1) * 0.5;
    const bandMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(SPACE_FULL_W * 0.98, SPACE_DEPTH * 0.96),
      new THREE.MeshBasicMaterial({ color: range.color, transparent: true, opacity: range.opacity, depthWrite: false, side: THREE.DoubleSide })
    );
    bandMesh.rotation.x = -Math.PI / 2;
    bandMesh.position.set(0, yMid, zMid);
    group.add(bandMesh);
  }

  // 基準面（Y=0）の枠線
  const edgePts = [
    new THREE.Vector3(-SPACE_HALF_W, 0, SPACE_Z_NEAR),
    new THREE.Vector3( SPACE_HALF_W, 0, SPACE_Z_NEAR),
    new THREE.Vector3( SPACE_HALF_W, 0, SPACE_Z_FAR),
    new THREE.Vector3(-SPACE_HALF_W, 0, SPACE_Z_FAR),
    new THREE.Vector3(-SPACE_HALF_W, 0, SPACE_Z_NEAR)
  ];
  group.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(edgePts),
    new THREE.LineBasicMaterial({ color: 0x00bbff, transparent: true, opacity: 0.45 })
  ));

  return group;
}

// ── 5. Y軸（軸本体 + 目盛り + 高さ帯別水平ガイド）────────────

function createVerticalAxis(THREE, metrics) {
  const { maxY, groundY, SPACE_HALF_W, SPACE_Y_TOP, SPACE_Z_NEAR, SPACE_Z_FAR } = metrics;
  const bandColors = makeBandColors(THREE);
  const axisX  = -(SPACE_HALF_W + 22);
  const axisZ  = SPACE_Z_NEAR;

  const group = new THREE.Group();

  // Y軸本体
  group.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(axisX, groundY,   axisZ),
      new THREE.Vector3(axisX, SPACE_Y_TOP, axisZ)
    ]),
    new THREE.LineBasicMaterial({ color: 0x55ccff, transparent: true, opacity: 0.85 })
  ));

  // 目盛り間隔を自動決定
  const tickInterval = maxY > 500 ? 100 : maxY > 200 ? 50 : maxY > 80 ? 20 : 10;

  const tickPts = [];
  const hGuidePtsByBand = [[], [], [], []];

  for (let y = 0; y <= maxY + tickInterval * 0.5; y += tickInterval) {
    if (y > SPACE_Y_TOP) break;

    tickPts.push(new THREE.Vector3(axisX - 14, y, axisZ));
    tickPts.push(new THREE.Vector3(axisX + 14, y, axisZ));

    const bi = getBandIndex(y, maxY);
    const t  = hGuidePtsByBand[bi];
    t.push(new THREE.Vector3(-SPACE_HALF_W, y, SPACE_Z_NEAR));
    t.push(new THREE.Vector3( SPACE_HALF_W, y, SPACE_Z_NEAR));
    t.push(new THREE.Vector3(-SPACE_HALF_W, y, SPACE_Z_NEAR));
    t.push(new THREE.Vector3(-SPACE_HALF_W, y, SPACE_Z_FAR));
    t.push(new THREE.Vector3( SPACE_HALF_W, y, SPACE_Z_NEAR));
    t.push(new THREE.Vector3( SPACE_HALF_W, y, SPACE_Z_FAR));
  }

  if (tickPts.length > 0) {
    group.add(new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(tickPts),
      new THREE.LineBasicMaterial({ color: 0x55ccff, transparent: true, opacity: 0.75 })
    ));
  }

  for (let band = 0; band < hGuidePtsByBand.length; band++) {
    const pts = hGuidePtsByBand[band];
    if (pts.length === 0) continue;
    group.add(new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: bandColors[band], transparent: true, opacity: band === 3 ? 0.36 : 0.28 })
    ));
  }

  return group;
}

// ── 6. 奥の分析パネル（壁面 + グリッド線 + 帯色面 + 枠 + 左右エッジ）──

function createDepthPanels(THREE, metrics) {
  const { maxY, SPACE_Z_FAR, SPACE_FULL_W, SPACE_HEIGHT, SPACE_HALF_W, SPACE_Y_BOT, SPACE_Y_TOP, SPACE_Z_NEAR } = metrics;
  const bandColors = makeBandColors(THREE);
  const bandRanges = makeBandRanges(maxY, bandColors);
  const backZ    = SPACE_Z_FAR;
  const wallW    = SPACE_FULL_W;
  const wallH    = SPACE_HEIGHT;
  const wallMidY = (SPACE_Y_BOT + SPACE_Y_TOP) / 2;

  const group = new THREE.Group();

  // メインバックドロップ壁（暗い板）
  const wallMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(wallW, wallH),
    new THREE.MeshBasicMaterial({ color: 0x070e1d, transparent: true, opacity: 0.9, depthWrite: false })
  );
  wallMesh.position.set(0, wallMidY, backZ);
  group.add(wallMesh);

  // 縦グリッド線
  const wCols = 10;
  const wRows = 8;
  const vertPts = [];
  const horizPtsByBand = [[], [], [], []];

  for (let col = 0; col <= wCols; col++) {
    const x = -wallW / 2 + (col / wCols) * wallW;
    vertPts.push(new THREE.Vector3(x, SPACE_Y_BOT, backZ + 1));
    vertPts.push(new THREE.Vector3(x, SPACE_Y_TOP, backZ + 1));
  }
  group.add(new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(vertPts),
    new THREE.LineBasicMaterial({ color: 0x21507a, transparent: true, opacity: 0.45 })
  ));

  // 横グリッド線（高さ帯別着色）
  for (let row = 0; row <= wRows; row++) {
    const y  = SPACE_Y_BOT + (row / wRows) * wallH;
    const bi = getBandIndex(y, maxY);
    horizPtsByBand[bi].push(new THREE.Vector3(-wallW / 2, y, backZ + 1));
    horizPtsByBand[bi].push(new THREE.Vector3( wallW / 2, y, backZ + 1));
  }
  for (let band = 0; band < horizPtsByBand.length; band++) {
    const pts = horizPtsByBand[band];
    if (pts.length === 0) continue;
    group.add(new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: bandColors[band], transparent: true, opacity: band === 3 ? 0.72 : 0.62 })
    ));
  }

  // 高さ帯の薄い色面（壁に重ねる）
  for (const range of bandRanges) {
    const panelBandH = Math.max(2, range.y1 - range.y0);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(wallW * 0.995, panelBandH),
      new THREE.MeshBasicMaterial({ color: range.color, transparent: true, opacity: range.opacity * 1.2, depthWrite: false })
    );
    mesh.position.set(0, (range.y0 + range.y1) * 0.5, backZ + 0.5);
    group.add(mesh);
  }

  // 外枠ライン
  group.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-SPACE_HALF_W, SPACE_Y_BOT, backZ + 2),
      new THREE.Vector3( SPACE_HALF_W, SPACE_Y_BOT, backZ + 2),
      new THREE.Vector3( SPACE_HALF_W, SPACE_Y_TOP, backZ + 2),
      new THREE.Vector3(-SPACE_HALF_W, SPACE_Y_TOP, backZ + 2),
      new THREE.Vector3(-SPACE_HALF_W, SPACE_Y_BOT, backZ + 2)
    ]),
    new THREE.LineBasicMaterial({ color: 0x2266aa, transparent: true, opacity: 0.7 })
  ));

  // Y=0 強調ライン
  group.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-SPACE_HALF_W, 0, backZ + 2),
      new THREE.Vector3( SPACE_HALF_W, 0, backZ + 2)
    ]),
    new THREE.LineBasicMaterial({ color: 0x00bbff, transparent: true, opacity: 0.7 })
  ));

  // 左右縦エッジ（横壁の骨格ライン）
  const sideEdgePts = [];
  for (const sx of [-SPACE_HALF_W, SPACE_HALF_W]) {
    sideEdgePts.push(new THREE.Vector3(sx, SPACE_Y_BOT, SPACE_Z_NEAR));
    sideEdgePts.push(new THREE.Vector3(sx, SPACE_Y_TOP, SPACE_Z_NEAR));
    sideEdgePts.push(new THREE.Vector3(sx, SPACE_Y_BOT, SPACE_Z_FAR));
    sideEdgePts.push(new THREE.Vector3(sx, SPACE_Y_TOP, SPACE_Z_FAR));
    sideEdgePts.push(new THREE.Vector3(sx, SPACE_Y_BOT, SPACE_Z_NEAR));
    sideEdgePts.push(new THREE.Vector3(sx, SPACE_Y_BOT, SPACE_Z_FAR));
    sideEdgePts.push(new THREE.Vector3(sx, SPACE_Y_TOP, SPACE_Z_NEAR));
    sideEdgePts.push(new THREE.Vector3(sx, SPACE_Y_TOP, SPACE_Z_FAR));
  }
  group.add(new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(sideEdgePts),
    new THREE.LineBasicMaterial({ color: 0x2266aa, transparent: true, opacity: 0.55 })
  ));

  return group;
}

// ── エントリポイント ─────────────────────────────────────────

/**
 * 解析モード専用の3D分析空間を生成します。
 * 床・上空・水平基準面・Y軸・奥の分析パネルで構成されます。
 */
export function createAnalysisBackdrop({ THREE, CONFIG, getBackgroundMetrics }) {
  const group = new THREE.Group();
  const metrics = getAnalysisSpaceMetrics(CONFIG, getBackgroundMetrics());

  group.add(createSkyBackdrop(THREE, metrics));
  group.add(createCeilingPanel(THREE, metrics));
  group.add(createFloorGrid(THREE, metrics));
  group.add(createHeightBandPlanes(THREE, metrics));
  group.add(createVerticalAxis(THREE, metrics));
  group.add(createDepthPanels(THREE, metrics));

  return group;
}
