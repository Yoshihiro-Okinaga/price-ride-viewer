import * as THREE from 'https://unpkg.com/three@0.183.0/build/three.module.js';
import { CONFIG } from './config.js';

export const app = {
  scene: null,
  camera: null,
  cameraRig: null,
  renderer: null,
  clock: new THREE.Clock(),

  xr: {
    isSupported: false,
    isPresenting: false
  },

  ground: null,
  backgroundGroup: null,
  guideGroup: null,

  courseGroup: null,
  coursePoints: [],
  prices: [],
  curve: null,
  rideT: 0,

  minClose: 0,
  maxClose: 0,
  lastBuildInfo: null,

  buildSettings: {
    startDateText: CONFIG.ui.initialValues.startDate,
    heightScale: CONFIG.ui.initialValues.heightScale,
    zStep: CONFIG.ui.initialValues.zStep,
    autoScale: CONFIG.ui.initialValues.autoScale,
    invertPrice: CONFIG.ui.initialValues.invertPrice,
    theme: CONFIG.ui.initialValues.theme,
    showHeightGuides: CONFIG.ui.initialValues.showHeightGuides,
    csvUrl: ''
  },

  runtimeSettings: {
    rideSpeed: CONFIG.ui.initialValues.rideSpeed,
    lookAhead: CONFIG.ui.initialValues.lookAhead
  },

  lights: {
    directional: null,
    ambient: null,
    point: null
  }
};