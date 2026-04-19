import * as THREE from 'https://unpkg.com/three@0.183.0/build/three.module.js';
import { COURSE_CONFIG as CONFIG } from './config/courseConfig.js';

/**
 * キャンバス上に角丸矩形を描画します。
 * @param {CanvasRenderingContext2D} ctx 描画先コンテキストです。
 * @param {number} x X座標です。
 * @param {number} y Y座標です。
 * @param {number} width 幅です。
 * @param {number} height 高さです。
 * @param {number} radius 角丸半径です。
 */
function createRoundedRect(ctx, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - safeRadius,
    y + height
  );
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
}

/**
 * テキスト表示用スプライトを生成します。
 * @param {string} text 表示テキストです。
 * @returns {THREE.Sprite} テキストスプライトです。
 */
export function createTextSprite(text) {
  const spriteConfig = CONFIG.label.sprite;
  const inset = CONFIG.course.spriteFrameInset;

  const canvas = document.createElement('canvas');
  canvas.width = spriteConfig.canvasWidth;
  canvas.height = spriteConfig.canvasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2Dコンテキストの取得に失敗しました。');
  }

  const frameWidth = canvas.width - inset * 2;
  const frameHeight = canvas.height - inset * 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = spriteConfig.backgroundColor;
  createRoundedRect(
    ctx,
    inset,
    inset,
    frameWidth,
    frameHeight,
    spriteConfig.borderRadius
  );
  ctx.fill();

  ctx.strokeStyle = spriteConfig.borderColor;
  ctx.lineWidth = spriteConfig.borderWidth;
  createRoundedRect(
    ctx,
    inset,
    inset,
    frameWidth,
    frameHeight,
    spriteConfig.borderRadius
  );
  ctx.stroke();

  ctx.fillStyle = spriteConfig.textColor;
  ctx.font = spriteConfig.font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: true
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(spriteConfig.scaleX, spriteConfig.scaleY, 1);

  return sprite;
}
