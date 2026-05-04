import * as THREE from 'https://unpkg.com/three@0.183.0/build/three.module.js';
import { UI_CONFIG } from './config/uiConfig.js';

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
    startDateText: UI_CONFIG.initialValues.startDate,
    heightScale: UI_CONFIG.initialValues.heightScale,
    zStep: UI_CONFIG.initialValues.zStep,
    interpolationMode: UI_CONFIG.initialValues.interpolationMode,
    curveType: UI_CONFIG.initialValues.curveType,
    curveTension: UI_CONFIG.initialValues.curveTension,
    autoScale: UI_CONFIG.initialValues.autoScale,
    invertPrice: UI_CONFIG.initialValues.invertPrice,
    theme: UI_CONFIG.initialValues.theme,
    showHeightGuides: UI_CONFIG.initialValues.showHeightGuides,
    csvUrl: ''
  },

  runtimeSettings: {
    rideSpeed: UI_CONFIG.initialValues.rideSpeed,
    lookAhead: UI_CONFIG.initialValues.lookAhead
  },

  lights: {
    directional: null,
    ambient: null,
    point: null
  }
};