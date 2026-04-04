import * as THREE from 'https://unpkg.com/three@0.183.0/build/three.module.js';
import { CONFIG } from './config.js';

export const app = {
  scene: null,
  camera: null,
  renderer: null,
  clock: new THREE.Clock(),

  ground: null,
  backgroundGroup: null,
  guideGroup: null,
  courseGroup: null,

  lights: {
    directional: null,
    ambient: null,
    point: null
  },

  coursePoints: [],
  prices: [],
  curve: null,
  minClose: 0,
  maxClose: 0,
  rideT: 0,

  buildSettings: {
    startDateText: '2025-06-01',
    heightScale: 1000,
    zStep: 80,
    autoScale: true,
    invertPrice: false,
    theme: 'space',
    showHeightGuides: true
  },

  runtimeSettings: {
    rideSpeed: CONFIG.defaults.rideSpeed,
    lookAhead: CONFIG.defaults.lookAhead
  },

  lastBuildInfo: null
};