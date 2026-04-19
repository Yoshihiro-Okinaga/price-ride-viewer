export const COURSE_CONFIG = {
  course: {
    curveType: 'catmullrom',
    curveTension: 0.35,

    spriteFrameInset: 4,

    monthlyLabel: {
      upperPriceRatio: 1.02,
      lowerPriceRatio: 0.98,
      priceDecimals: 4
    },

    autoBuild: {
      targetHeightRange: 260,
      targetDepth: 5000,
      minHeightScale: 0.0001,
      maxHeightScale: 1000000000,
      minZStep: 8,
      maxZStep: 160,
      roundNiceCandidates: [1, 2, 5, 10],
      rangeEpsilon: 1e-9
    }
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
  }
};
