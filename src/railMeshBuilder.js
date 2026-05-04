import * as THREE from 'https://unpkg.com/three@0.183.0/build/three.module.js';
import { COURSE_CONFIG as CONFIG } from './config/courseConfig.js';

function buildCurveFromPoints(points, buildSettings) {
  if (buildSettings.interpolationMode === 'none') {
    const curvePath = new THREE.CurvePath();

    for (let i = 0; i < points.length - 1; i += 1) {
      curvePath.add(new THREE.LineCurve3(points[i], points[i + 1]));
    }

    return curvePath;
  }

  return new THREE.CatmullRomCurve3(
    points,
    false,
    buildSettings.curveType,
    buildSettings.curveTension
  );
}

/**
 * 曲線に沿った左右レール点列を作ります。
 * @param {THREE.Curve} curve 対象曲線です。
 * @param {number} divisions 分割数です。
 * @returns {{leftPoints: THREE.Vector3[], rightPoints: THREE.Vector3[]}}
 *   左右レール点列です。
 */
function buildRailSidePoints(curve, divisions) {
  const railConfig = CONFIG.rail;
  const centerPoints = curve.getSpacedPoints(divisions);

  const leftPoints = [];
  const rightPoints = [];

  for (const point of centerPoints) {
    leftPoints.push(
      new THREE.Vector3(
        point.x - railConfig.halfWidth,
        point.y + railConfig.offsetY,
        point.z
      )
    );

    rightPoints.push(
      new THREE.Vector3(
        point.x + railConfig.halfWidth,
        point.y + railConfig.offsetY,
        point.z
      )
    );
  }

  return { leftPoints, rightPoints };
}

/**
 * 左右のレール本体とグローを group に追加します。
 * @param {THREE.Group} group 追加先グループです。
 * @param {THREE.Curve} leftCurve 左レール曲線です。
 * @param {THREE.Curve} rightCurve 右レール曲線です。
 * @param {number} divisions 分割数です。
 */
function addRailMeshes(group, leftCurve, rightCurve, divisions) {
  const railConfig = CONFIG.rail;

  const railMaterial = new THREE.MeshStandardMaterial({
    color: railConfig.color,
    emissive: railConfig.emissive,
    emissiveIntensity: railConfig.emissiveIntensity,
    metalness: railConfig.metalness,
    roughness: railConfig.roughness
  });

  const leftRailGeometry = new THREE.TubeGeometry(
    leftCurve,
    divisions,
    railConfig.radius,
    railConfig.radialSegments,
    false
  );

  const rightRailGeometry = new THREE.TubeGeometry(
    rightCurve,
    divisions,
    railConfig.radius,
    railConfig.radialSegments,
    false
  );

  group.add(new THREE.Mesh(leftRailGeometry, railMaterial));
  group.add(new THREE.Mesh(rightRailGeometry, railMaterial));

  const glowMaterial = new THREE.MeshBasicMaterial({
    color: railConfig.glowColor,
    transparent: true,
    opacity: railConfig.glowOpacity
  });

  const leftGlowGeometry = new THREE.TubeGeometry(
    leftCurve,
    divisions,
    railConfig.glowRadius,
    railConfig.glowRadialSegments,
    false
  );

  const rightGlowGeometry = new THREE.TubeGeometry(
    rightCurve,
    divisions,
    railConfig.glowRadius,
    railConfig.glowRadialSegments,
    false
  );

  group.add(new THREE.Mesh(leftGlowGeometry, glowMaterial));
  group.add(new THREE.Mesh(rightGlowGeometry, glowMaterial));
}

/**
 * 枕木を曲線に沿って追加します。
 * @param {THREE.Group} group 追加先グループです。
 * @param {THREE.Curve} curve 中央曲線です。
 */
function addSleepers(group, curve) {
  const railConfig = CONFIG.rail;
  const sleeperConfig = CONFIG.sleeper;

  const sleeperGeometry = new THREE.BoxGeometry(
    sleeperConfig.width,
    sleeperConfig.height,
    sleeperConfig.depth
  );

  const sleeperMaterial = new THREE.MeshLambertMaterial({
    color: sleeperConfig.color,
    emissive: sleeperConfig.emissive,
    emissiveIntensity: sleeperConfig.emissiveIntensity
  });

  const curveLength = curve.getLength();
  const sleeperCount = Math.floor(curveLength / sleeperConfig.spacing) + 1;
  const sleeperMesh = new THREE.InstancedMesh(
    sleeperGeometry,
    sleeperMaterial,
    sleeperCount
  );
  sleeperMesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);

  const up = new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3();
  const sleeperUp = new THREE.Vector3();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const basis = new THREE.Matrix4();
  const matrix = new THREE.Matrix4();
  const scale = new THREE.Vector3(1, 1, 1);

  for (let i = 0; i < sleeperCount; i++) {
    const u = sleeperCount === 1 ? 0 : i / (sleeperCount - 1);
    const point = curve.getPointAt(u);
    const tangent = curve.getTangentAt(u).normalize();

    position.set(
      point.x,
      point.y + railConfig.offsetY + sleeperConfig.offsetY,
      point.z
    );

    right.crossVectors(up, tangent);

    if (right.lengthSq() < 1e-8) {
      right.set(1, 0, 0);
    } else {
      right.normalize();
    }

    sleeperUp.crossVectors(tangent, right).normalize();

    basis.makeBasis(right, sleeperUp, tangent);
    quaternion.setFromRotationMatrix(basis);
    matrix.compose(position, quaternion, scale);
    sleeperMesh.setMatrixAt(i, matrix);
  }

  sleeperMesh.instanceMatrix.needsUpdate = true;
  group.add(sleeperMesh);
}

/**
 * コースに沿ったレール一式を追加します。
 * @param {THREE.Group} group 追加先グループです。
 * @param {THREE.Curve} curve 中央曲線です。
 * @param {number} pointCount 元のポイント数です。
 * @param {object} buildSettings ビルド設定です。
 */
export function addRailsToGroup(group, curve, pointCount, buildSettings) {
  const railConfig = CONFIG.rail;
  const divisions = Math.max(
    railConfig.divisionsMin,
    pointCount * railConfig.divisionsPerPoint
  );

  const { leftPoints, rightPoints } = buildRailSidePoints(curve, divisions);

  const leftCurve = buildCurveFromPoints(leftPoints, buildSettings);
  const rightCurve = buildCurveFromPoints(rightPoints, buildSettings);

  addRailMeshes(group, leftCurve, rightCurve, divisions);
  addSleepers(group, curve);
}
