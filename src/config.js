import * as THREE from 'https://unpkg.com/three@0.183.0/build/three.module.js';

export const CONFIG = {
  ui: {
    toggleKey: 'h'
  },

  scene: {
    backgroundColor: 0x050816,
    fogColor: 0x0b1020,
    fogDensity: 0.00045,
    cameraFov: 75,
    cameraNear: 0.1,
    cameraFar: 20000,
    maxPixelRatio: 2
  },

  lighting: {
    directional: {
      color: 0xcfd8ff,
      intensity: 1.05,
      position: new THREE.Vector3(30, 60, 20)
    },
    ambient: {
      color: 0x8899ff,
      intensity: 0.95
    },
    point: {
      color: 0x66ccff,
      intensity: 1.3,
      distance: 1200,
      position: new THREE.Vector3(0, 180, 120)
    }
  },

  ground: {
    width: 1400,
    depth: 28000,
    segmentsX: 1,
    segmentsZ: 1,
    y: -30,
    opacity: 0.95,
    texture: {
      size: 512,
      cells: 16,
      glowDotCount: 90,
      repeatX: 50,
      repeatZ: 900,
      backgroundColor: '#070b18',
      gradTop: 'rgba(80,120,255,0.10)',
      gradMid: 'rgba(0,0,0,0.00)',
      gradBottom: 'rgba(180,80,255,0.10)',
      gridColor: 'rgba(255,255,255,1.0)',
      glowDotColor: 'rgba(180,220,255,0.18)'
    }
  },

  background: {
    stars: {
      count: 3500,
      rangeX: 5000,
      minY: 80,
      rangeY: 1800,
      rangeZ: 12000,
      offsetZ: -500,
      color: 0xbfd6ff,
      size: 3,
      opacity: 0.9
    },
    nebula: {
      count: 18,
      width: 900,
      height: 220,
      areaX: 1200,
      baseY: 180,
      rangeY: 500,
      spacingZ: 520,
      rotationXBase: -0.2,
      rotationXRange: 0.4,
      rotationYRange: 0.8,
      rotationZRange: 0.4,
      opacity: 0.08,
      colors: [0x4466ff, 0xaa66ff, 0x44ccff],
      spinSpeed: 0.0006
    }
  },

  course: {
    curveType: 'catmullrom',
    curveTension: 0.35
  },

  rail: {
    offsetY: -1.8,
    halfWidth: 1.2,
    radius: 0.12,
    radialSegments: 10,
    glowRadius: 0.18,
    glowOpacity: 0.12,
    glowRadialSegments: 8,
    divisionsMin: 300,
    divisionsPerPoint: 12,
    color: 0xbfd8ff,
    emissive: 0x3355aa,
    emissiveIntensity: 0.35,
    metalness: 0.85,
    roughness: 0.28,
    glowColor: 0x6688ff
  },

  sleeper: {
    width: 3.2,
    height: 0.18,
    depth: 0.7,
    offsetY: -0.08,
    spacing: 2.4,
    color: 0x334455,
    emissive: 0x223344,
    emissiveIntensity: 0.45
  },

  label: {
    sprite: {
      canvasWidth: 256,
      canvasHeight: 64,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      borderColor: 'rgba(160, 210, 255, 0.8)',
      borderWidth: 2,
      textColor: 'white',
      font: '28px sans-serif',
      borderRadius: 12,
      scaleX: 18,
      scaleY: 4.5
    },
    position: {
      x: 10,
      yOffset: 10
    },
    pole: {
      x: 6,
      bottomOffsetY: 0.5,
      topOffsetY: 8,
      color: 0x88bbff,
      opacity: 0.8
    }
  },

  camera: {
    rideHeight: 6,
    lookAtYOffset: 2,
    lookAtZOffset: 14
  },

  defaults: {
    rideSpeed: 0.01,
    lookAhead: 0.01
  }
};