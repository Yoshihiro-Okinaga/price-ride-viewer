import * as THREE from 'https://unpkg.com/three@0.183.0/build/three.module.js';
import { CONFIG } from './config.js';

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
  const sleeperCount = Math.floor(curveLength / sleeperConfig.spacing);

  for (let i = 0; i <= sleeperCount; i++) {
    const u = sleeperCount === 0 ? 0 : i / sleeperCount;
    const point = curve.getPointAt(u);
    const tangent = curve.getTangentAt(u).normalize();

    const sleeper = new THREE.Mesh(sleeperGeometry, sleeperMaterial);
    sleeper.position.set(
      point.x,
      point.y + railConfig.offsetY + sleeperConfig.offsetY,
      point.z
    );

    const up = new THREE.Vector3(0, 1, 0);
    let right = new THREE.Vector3().crossVectors(up, tangent);

    if (right.lengthSq() < 1e-8) {
      right = new THREE.Vector3(1, 0, 0);
    } else {
      right.normalize();
    }

    const sleeperUp = new THREE.Vector3()
      .crossVectors(tangent, right)
      .normalize();

    const basis = new THREE.Matrix4().makeBasis(right, sleeperUp, tangent);
    sleeper.quaternion.setFromRotationMatrix(basis);

    group.add(sleeper);
  }
}

/**
 * コースに沿ったレール一式を追加します。
 * @param {THREE.Group} group 追加先グループです。
 * @param {THREE.Curve} curve 中央曲線です。
 * @param {number} pointCount 元のポイント数です。
 */
export function addRailsToGroup(group, curve, pointCount) {
  const railConfig = CONFIG.rail;
  const divisions = Math.max(
    railConfig.divisionsMin,
    pointCount * railConfig.divisionsPerPoint
  );

  const { leftPoints, rightPoints } = buildRailSidePoints(curve, divisions);

  const leftCurve = new THREE.CatmullRomCurve3(
    leftPoints,
    false,
    CONFIG.course.curveType,
    CONFIG.course.curveTension
  );

  const rightCurve = new THREE.CatmullRomCurve3(
    rightPoints,
    false,
    CONFIG.course.curveType,
    CONFIG.course.curveTension
  );

  addRailMeshes(group, leftCurve, rightCurve, divisions);
  addSleepers(group, curve);
}
