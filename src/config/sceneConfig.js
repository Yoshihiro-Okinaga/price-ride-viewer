import * as THREE from 'https://unpkg.com/three@0.183.0/build/three.module.js';

export const SCENE_CONFIG = {
  scene: {
    backgroundColor: 0x050816,
    fogColor: 0x0b1020,
    fogDensity: 0.00045,
    cameraFov: 75,
    cameraNear: 0.1,
    cameraFar: 20000,
    maxPixelRatio: 1
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

  camera: {
    rideHeight: 3,
    lookAtYOffset: 2,
    lookAtZOffset: 14
  },

  sceneRefactor: {
    themePresets: {
      space: {
        sceneBackground: 0x020612,
        fogColor: 0x061020,
        fogDensity: 0.00026,
        ground: {
          opacity: 0.96,
          backgroundColor: '#040815',
          gradTop: 'rgba(80,150,255,0.18)',
          gradMid: 'rgba(0,0,0,0.00)',
          gradBottom: 'rgba(255,80,210,0.16)',
          gridColor: 'rgba(255,255,255,0.95)',
          glowDotColor: 'rgba(220,240,255,0.30)',
          cells: 16
        },
        lighting: {
          directional: { color: 0xf2f6ff, intensity: 1.12 },
          ambient: { color: 0xb9c7ff, intensity: 1.04 },
          point: { color: 0x8ae0ff, intensity: 1.45 }
        },
        backgroundKind: 'space',
        guideColor: 0xb7deff,
        guideOpacity: 0.36
      },

      amusement: {
        sceneBackground: 0x00ff00,
        fogColor: 0x88ff88,
        fogDensity: 0.00001,
        ground: {
          opacity: 1.0,
          backgroundColor: '#ccff66',
          gradTop: 'rgba(255,255,255,0.00)',
          gradMid: 'rgba(255,255,255,0.00)',
          gradBottom: 'rgba(255,255,255,0.00)',
          gridColor: 'rgba(255,0,0,0.55)',
          glowDotColor: 'rgba(255,255,0,0.20)',
          cells: 8
        },
        lighting: {
          directional: { color: 0xffffff, intensity: 1.5 },
          ambient: { color: 0xffffff, intensity: 1.2 },
          point: { color: 0xffaa00, intensity: 1.2 }
        },
        backgroundKind: 'amusement',
        guideColor: 0xff0000,
        guideOpacity: 0.35
      },

      analysis: {
        sceneBackground: 0x060d1a,
        fogColor: 0x081220,
        fogDensity: 0.00012,
        ground: {
          opacity: 1.0,
          backgroundColor: '#060e1c',
          gradTop: 'rgba(30,100,200,0.10)',
          gradMid: 'rgba(0,0,0,0.00)',
          gradBottom: 'rgba(0,60,140,0.12)',
          gridColor: 'rgba(26,80,128,0.70)',
          glowDotColor: 'rgba(0,0,0,0.00)',
          cells: 16
        },
        lighting: {
          directional: { color: 0xaaccff, intensity: 0.6 },
          ambient: { color: 0x8aaedd, intensity: 0.8 },
          point: { color: 0x44aaff, intensity: 0.0 }
        },
        backgroundKind: 'analysis',
        guideColor: 0x0000ff,
        guideOpacity: 0.25
      },

      cityNight: {
        sceneBackground: 0x05070d,
        fogColor: 0x0b1020,
        fogDensity: 0.00018,
        ground: {
          opacity: 0.98,
          backgroundColor: '#0b0f18',
          gradTop: 'rgba(120,160,255,0.10)',
          gradMid: 'rgba(0,0,0,0.00)',
          gradBottom: 'rgba(255,120,180,0.06)',
          gridColor: 'rgba(180,210,255,0.18)',
          glowDotColor: 'rgba(255,220,120,0.05)',
          cells: 14
        },
        lighting: {
          directional: { color: 0xeaf0ff, intensity: 0.95 },
          ambient: { color: 0x98a8d8, intensity: 0.78 },
          point: { color: 0xffd080, intensity: 0.65 }
        },
        backgroundKind: 'cityNight',
        guideColor: 0x8fc4ff,
        guideOpacity: 0.28
      },

      futureCity: {
        sceneBackground: 0x030712,
        fogColor: 0x081020,
        fogDensity: 0.00014,
        ground: {
          opacity: 0.98,
          backgroundColor: '#090f1f',
          gradTop: 'rgba(80,170,255,0.14)',
          gradMid: 'rgba(0,0,0,0.00)',
          gradBottom: 'rgba(255,0,200,0.10)',
          gridColor: 'rgba(120,220,255,0.22)',
          glowDotColor: 'rgba(255,80,220,0.08)',
          cells: 16
        },
        lighting: {
          directional: { color: 0xeaf6ff, intensity: 1.00 },
          ambient: { color: 0x8db4ff, intensity: 0.92 },
          point: { color: 0x44d8ff, intensity: 0.95 }
        },
        backgroundKind: 'futureCity',
        guideColor: 0x66d9ff,
        guideOpacity: 0.30
      },

      heavenTemple: {
        sceneBackground: 0xdff2ff,
        fogColor: 0xf4fbff,
        fogDensity: 0.00011,
        ground: {
          opacity: 0.95,
          backgroundColor: '#f2f8ff',
          gradTop: 'rgba(255,255,255,0.28)',
          gradMid: 'rgba(255,255,255,0.06)',
          gradBottom: 'rgba(200,220,255,0.16)',
          gridColor: 'rgba(150,180,230,0.12)',
          glowDotColor: 'rgba(255,255,255,0.16)',
          cells: 12
        },
        lighting: {
          directional: { color: 0xfffcf1, intensity: 1.20 },
          ambient: { color: 0xf8fbff, intensity: 1.12 },
          point: { color: 0xffe6a8, intensity: 1.05 }
        },
        backgroundKind: 'heavenTemple',
        guideColor: 0x7aa7ff,
        guideOpacity: 0.22
      },
    },

    metrics: {
      noCourseMaxY: 120,
      noCourseLastZ: 3000,
      heightFactorMin: 1,
      heightFactorMax: 4,
      heightFactorDivisor: 140,
      sceneCenterZOffset: 100,
      frontPad: 300,
      backPad: 800
    },

    groundSizing: {
      baseWidth: 320,
      widthByHeightMultiplier: 1.8,
      widthRoundUnit: 20,
      baseDepth: 3000,
      depthPadding: 1000,
      depthRoundUnit: 100
    },

    groundTextureRepeat: {
      minRepeatX: 8,
      minRepeatZ: 20,
      repeatDivisor: 40
    },

    stars: {
      depthDivisor: 2.6,
      widthMultiplier: 2.8,
      rangeXWidthMultiplier: 9,
      rangeYHeightMultiplier: 3.2,
      rangeYBasePadding: 1200,
      color: 0xf6fbff,
      sizeMultiplier: 1.25,
      opacity: 1.0
    },

    nebulaBands: {
      startZ: -150,
      endZPadding: 500,
      spacing: 360,
      minCount: 18,
      baseWidth: 900,
      widthStep: 180,
      widthVariants: 3,
      baseHeight: 220,
      heightStep: 80,
      heightVariants: 2,
      scaleBase: 1,
      scaleRandomMultiplier: 0.5,
      scaleHeightFactorMultiplier: 0.22,
      colors: [0x42e8ff, 0xff4fd8, 0x7a6bff, 0xffffff, 0x7cf7ff],
      baseOpacity: 0.16,
      opacityStep: 0.01,
      opacityVariants: 4,
      rangeXMin: 1500,
      rangeXWidthMultiplier: 1.7,
      baseY: 180,
      yHeightMultiplier: 0.9,
      yBasePadding: 700,
      rotationXBase: -0.15,
      rotationXRandomMultiplier: 0.35,
      rotationYRange: 0.8,
      rotationZRange: 0.6
    },

    spaceOrbs: {
      minCount: 18,
      countDepthDivisor: 700,
      baseRadius: 20,
      radiusRandomMultiplier: 55,
      radiusHeightFactorMultiplier: 10,
      colors: [0x70e9ff, 0xff8ce8, 0xd9c2ff, 0xffffff],
      baseOpacity: 0.12,
      opacityRandomMultiplier: 0.08,
      rangeXMin: 420,
      rangeXWidthMultiplier: 0.95,
      baseY: 80,
      yHeightMultiplier: 0.9,
      yBasePadding: 260,
      startZ: 150
    },

    spacePlanets: {
      minCount: 3,
      countDepthDivisor: 3200,
      xMin: 260,
      xWidthMultiplierBase: 0.33,
      xWidthMultiplierAlternating: 0.08,
      baseY: 180,
      yHeightMultiplier: 0.9,
      yBasePadding: 260,
      startZ: 900,
      zSpacing: 3000,
      scaleBase: 0.9,
      scaleRandomMultiplier: 1.1,
      scaleHeightFactorMultiplier: 0.08,
      planetRadius: 55,
      planetWidthSegments: 28,
      planetHeightSegments: 28,
      ringRadiusMultiplier: 1.65,
      ringTubeMultiplier: 0.15,
      ringTubeSegments: 12,
      ringRadialSegments: 48,
      ringOpacity: 0.45,
      emissiveIntensity: 0.35,
      ringRotationX: Math.PI * 0.35,
      ringRotationY: Math.PI * 0.15,
      spinBase: 0.001,
      spinStep: 0.00008
    },

    crystals: {
      laneSpacing: 520,
      minCount: 10,
      baseHeight: 50,
      heightRandomMultiplier: 180,
      heightFactorMultiplier: 30,
      baseRadius: 10,
      radiusRandomMultiplier: 16,
      radialSegments: 6,
      emissiveIntensity: 0.55,
      opacity: 0.82,
      xMin: 110,
      xWidthMultiplierBase: 0.20,
      xWidthMultiplierRandom: 0.10,
      baseYAdjustment: 8,
      startZ: 120
    },

    amusement: {
      lightPole: {
        leftSeedOffsetA: 3,
        rightSeedOffsetA: 7,
        leftSeedOffsetB: 11,
        rightSeedOffsetB: 19,
        randAMultiplier: 17,
        randBMultiplier: 29,
        baseHeight: 44,
        heightFactorMultiplier: 22,
        randomScaleBase: 0.78,
        randomScaleMultiplier: 0.70,
        leftSideBias: 0.96,
        rightSideBias: 1.04,
        minPoleHeight: 34,
        maxPoleHeightBase: 120,
        maxPoleHeightHeightFactor: 18,
        minBulbRadius: 4.5,
        maxBulbRadius: 9.5,
        bulbRadiusBase: 4.8,
        bulbRadiusHeightFactor: 1.2,
        bulbRadiusRandomMultiplier: 1.6,
        poleRadiusTop: 1.8,
        poleRadiusBottom: 1.8,
        poleRadialSegments: 8,
        bulbWidthSegments: 12,
        bulbHeightSegments: 12,
        bulbYOffsetMultiplier: 0.9,
        bulbColors: [0xff0000, 0x0000ff, 0xffff00]
      },

      tent: {
        scaleBase: 1,
        scaleHeightFactorMultiplier: 0.22,
        baseWidth: 28,
        baseHeight: 16,
        baseDepth: 28,
        baseYOffset: 8,
        roofRadius: 22,
        roofHeight: 16,
        roofRadialSegments: 4,
        roofYOffset: 24,
        roofRotationY: Math.PI * 0.25,
        baseColors: [0xfff1e6, 0xe8f7ff],
        roofColors: [0xff5d8f, 0x4d96ff]
      },

      ferrisWheel: {
        baseRadius: 120,
        radiusHeightFactorMultiplier: 36,
        baseTube: 8,
        tubeHeightFactorMultiplier: 2.4,
        baseStandHeight: 180,
        standHeightFactorMultiplier: 60,
        ringRadialSegments: 16,
        ringTubularSegments: 48,
        spokeCount: 8,
        spokeRadiusTop: 2,
        spokeRadiusBottom: 2,
        spokeRadialSegments: 8,
        spokeLengthMultiplier: 1.85,
        standWidth: 16,
        standDepth: 16,
        standOffsetMultiplier: 0.4,
        wheelYBaseOffset: 100
      },

      skyline: {
        sideXMin: 85,
        sideXWidthMultiplier: 0.32,
        laneSpacing: 180,
        laneCountMin: 10,
        laneCountDepthPadding: 300,
        laneStartZ: 100,
        leftTentEvery: 3,
        leftTentZOffset: 40,
        leftTentXOffset: 45,
        rightTentModulo: 4,
        rightTentModuloMatch: 2,
        rightTentZOffset: -30,
        rightTentXOffset: 55,
        wheelSpacing: 2200,
        wheelCountMin: 1,
        wheelCountDepthPadding: 1000,
        wheelXMin: 240,
        wheelXWidthMultiplier: 0.34,
        wheelStartZ: 1200,
        wheelSidesStartPositive: true
      },

      animation: {
        spinStep: 0.01
      }
    },

    cityNight: {
      building: {
        widthBase: 34,
        widthRandomMultiplier: 90,
        depthBase: 28,
        depthRandomMultiplier: 70,
        heightBase: 90,
        heightRandomBase: 180,
        heightRandomHeightFactorMultiplier: 140,
        emissiveIntensity: 0.35,
        colsMin: 2,
        colsWidthDivisor: 14,
        rowsMin: 4,
        rowsHeightDivisor: 16,
        windowSkipThreshold: 0.85,
        windowWidth: 5,
        windowHeight: 7,
        windowOpacity: 0.9,
        windowInsetX: 10,
        windowInsetY: 10,
        windowInsetZ: 0.2,
        antennaThreshold: 0.55,
        antennaHeightBase: 16,
        antennaHeightRandomMultiplier: 34,
        antennaRadiusTop: 0.8,
        antennaRadiusBottom: 0.8,
        antennaRadialSegments: 6,
        beaconRadius: 2.4,
        beaconWidthSegments: 8,
        beaconHeightSegments: 8,
        beaconYOffset: 2
      },

      streetLamp: {
        poleHeightBase: 20,
        poleHeightRandomMultiplier: 18,
        poleHeightFactorMultiplier: 4,
        poleRadiusTop: 1.2,
        poleRadiusBottom: 1.5,
        poleRadialSegments: 8,
        headRadius: 3.8,
        headWidthSegments: 10,
        headHeightSegments: 10,
        headYOffset: 2.5
      },

      scenery: {
        laneSpacing: 300,
        laneCountMin: 18,
        laneCountDepthPadding: 400,
        laneStartZ: 80,
        baseXMin: 120,
        baseXWidthMultiplier: 0.36,
        leftXRandomMultiplier: 120,
        rightXRandomMultiplier: 120,
        rightBuildingZOffset: 30,
        lampEvery: 2,
        leftLampZOffset: 20,
        rightLampZOffset: -10,
        lampXMin: 80,
        lampXWidthMultiplier: 0.22
      }
    },

    futureCity: {
      scenery: {
        sideXMin: 150,
        sideXWidthMultiplier: 0.36,
        laneSpacing: 170,
        laneCountMin: 16,
        laneDepthPadding: 1200,
        laneStartZ: 80,
        rightTowerZOffset: 40,
        bridgeEvery: 2,
        bridgeZOffset: 30,
        hoverEvery: 1,
        hoverZOffset: 10,
        hologramEvery: 2,
        trafficEvery: 1
      },
      tower: {
        widthBase: 30,
        widthRandom: 72,
        depthBase: 24,
        depthRandom: 52,
        heightBase: 130,
        heightRandom: 240,
        heightFactorMultiplier: 48,
        xJitter: 120,
        bodyColor: 0x0f1830,
        bodyEmissive: 0x142850,
        bodyEmissiveIntensity: 0.7,
        crownColor: 0xa9e6ff,
        crownEmissive: 0x4be0ff,
        crownEmissiveIntensity: 1.5,
        windowColors: [0x55dfff, 0xff4fd8, 0x8f78ff],
        windowOpacity: 0.95,
        windowSkipThreshold: 0.84,
        rooftopRingColor: 0x7de8ff,
        rooftopRingEmissive: 0x44d8ff,
        rooftopRingEmissiveIntensity: 1.4
      },
      beacon: {
        colors: [0x44d8ff, 0xff4fd8, 0x8f78ff],
        baseOpacity: 0.9,
        pulseOpacity: 0.22,
        pulseScaleBase: 0.8,
        pulseScaleAmplitude: 0.45,
        pulseSpeed: 3.0
      },
      bridge: {
        y: 128,
        beamColor: 0x1a2a4d,
        beamEmissive: 0x2b66cc,
        beamEmissiveIntensity: 0.7,
        railColor: 0x66f0ff,
        stripColorA: 0x66f0ff,
        stripColorB: 0xff4fd8,
        stripOpacity: 0.52
      },
      hoverLane: {
        y: 48,
        color: 0x66d9ff,
        baseOpacity: 0.34,
        pulseOpacity: 0.22,
        floatAmplitude: 1.2,
        ringColor: 0x90f0ff,
        ringOpacity: 0.34
      },
      hologram: {
        width: 28,
        height: 22,
        y: 84,
        xInset: 30,
        baseOpacity: 0.35,
        pulseOpacity: 0.2,
        colors: [0x44d8ff, 0xff4fd8, 0x8f78ff]
      },
      traffic: {
        y: 130,
        speed: 0.028,
        lightSize: 1.2,
        trailLength: 10,
        opacity: 0.9,
        colors: [0x66f0ff, 0xff66cc, 0xb08cff]
      },
      animation: {
        tempo: 1.0
      }
    },

    heavenTemple: {
      scenery: {
        sideXMin: 160,
        sideXWidthMultiplier: 0.35,
        laneSpacing: 260,
        laneCountMin: 10,
        laneDepthPadding: 900,
        laneStartZ: 150,
        rightIslandZOffset: 110,
        bridgeEvery: 2,
        bridgeZOffset: 70,
        cloudEvery: 1,
        cloudZOffset: 40,
        auroraEvery: 1,
        moteEvery: 1,
        roadsideEvery: 1,
        roadsideZOffset: 30
      },
      island: {
        radiusTopBase: 34,
        radiusTopRandom: 18,
        radiusBottomBase: 58,
        radiusBottomRandom: 28,
        thicknessBase: 46,
        thicknessRandom: 36,
        yBase: 58,
        yHeightFactorMultiplier: 18,
        topColor: 0xf4f8ff,
        topEmissive: 0x5f7fb8,
        topEmissiveIntensity: 0.32,
        rockColor: 0xc7d4ef,
        rockEmissive: 0x2a3557,
        rockEmissiveIntensity: 0.18,
        rimColor: 0xfff0b8,
        rimOpacity: 0.52
      },
      temple: {
        baseWidth: 56,
        baseDepth: 42,
        baseHeight: 8,
        baseColor: 0xf4f0e5,
        columnCount: 6,
        columnRadius: 2.2,
        columnHeightBase: 24,
        columnHeightRandom: 10,
        columnColor: 0xfff8eb,
        roofWidth: 62,
        roofDepth: 46,
        roofHeight: 7,
        roofColor: 0xf9eac0,
        roofEmissive: 0xffe4a3,
        roofEmissiveIntensity: 0.45,
        stairWidth: 38,
        stairDepth: 18,
        stairHeight: 3,
        stairColor: 0xe8edf8,
        haloRadius: 14,
        haloTube: 0.75,
        haloColor: 0xfff0b0,
        haloOpacity: 0.60,
        rearHaloRadius: 22,
        rearHaloTube: 1.1,
        rearHaloColor: 0xe8e0ff,
        rearHaloOpacity: 0.28,
        orbRadius: 3.2,
        orbColor: 0xfff6cc,
        orbEmissive: 0xffdd88,
        orbEmissiveIntensity: 1.1,
        veilWidth: 52,
        veilHeight: 56,
        veilColor: 0xfaf3ff,
        veilOpacity: 0.20,
        lightfallWidth: 22,
        lightfallHeight: 120,
        lightfallColor: 0xfff2bf,
        lightfallOpacity: 0.18
      },
      bridge: {
        widthScale: 0.72,
        yOffset: 18,
        deckHeight: 1.4,
        deckDepth: 12,
        deckColor: 0xfaf1cf,
        deckOpacity: 0.84,
        railColor: 0xffe3a0,
        railOpacity: 0.68
      },
      roadside: {
        xMultiplier: 0.26,
        xMin: 64,
        obeliskHeightBase: 26,
        obeliskHeightRandom: 26,
        obeliskRadiusTop: 2.0,
        obeliskRadiusBottom: 3.8,
        obeliskColor: 0xf7f1de,
        obeliskEmissive: 0xffe4a6,
        obeliskEmissiveIntensity: 0.45,
        wingWidth: 16,
        wingHeight: 18,
        wingDepth: 2,
        wingColor: 0xe6edff,
        wingEmissive: 0xd6c6ff,
        wingEmissiveIntensity: 0.38,
        crownColor: 0xffe7b4,
        crownEmissive: 0xffd788,
        crownEmissiveIntensity: 1.0,
        haloRadius: 5.2,
        haloTube: 0.28,
        haloColor: 0xfff0be,
        haloOpacity: 0.62,
        bannerWidth: 7,
        bannerHeight: 18,
        bannerColorA: 0xfff0c2,
        bannerColorB: 0xe9dbff,
        bannerOpacity: 0.38
      },
      cloud: {
        widthBase: 130,
        widthRandom: 120,
        heightBase: 36,
        heightRandom: 40,
        yBase: 90,
        yRandom: 80,
        xRangeMultiplier: 0.9,
        color: 0xffffff,
        opacityBase: 0.24,
        opacityRandom: 0.18,
        driftSpeedBase: 0.11,
        driftSpeedRandom: 0.16
      },
      aurora: {
        widthBase: 180,
        widthRandom: 140,
        heightBase: 180,
        heightRandom: 120,
        yBase: 150,
        yRandom: 120,
        xRangeMultiplier: 0.82,
        colors: [0xfdf1ff, 0xe3f6ff, 0xfff3c6, 0xded5ff],
        opacityBase: 0.12,
        opacityRandom: 0.12,
        swayAmplitude: 18,
        driftSpeedBase: 0.002,
        driftSpeedRandom: 0.003
      },
      motes: {
        count: 18,
        spreadX: 120,
        spreadY: 120,
        spreadZ: 90,
        sizeBase: 0.7,
        sizeRandom: 1.2,
        colors: [0xffffff, 0xfff1c2, 0xe8f5ff, 0xf0deff],
        opacityBase: 0.45,
        opacityRandom: 0.28,
        riseSpeedBase: 0.10,
        riseSpeedRandom: 0.16
      },
      animation: {
        tempo: 1.0,
        haloSpin: 0.010,
        orbPulseSpeed: 2.1,
        orbPulseAmplitude: 0.24,
        cloudFloatAmplitude: 1.6,
        cloudFloatSpeed: 0.75,
        bannerPulseSpeed: 1.9,
        bannerPulseAmplitude: 0.20,
        auroraPulseSpeed: 0.9,
        auroraPulseAmplitude: 0.10,
        veilPulseSpeed: 1.5,
        veilPulseAmplitude: 0.10,
        moteTwinkleSpeed: 1.8,
        moteTwinkleAmplitude: 0.22,
        roadsidePulseSpeed: 2.2,
        roadsidePulseAmplitude: 0.22
      }
    },

    analysis: {
      panelWidthMin: 1400,
      panelWidthMultiplier: 1.4,
      panelHeightMin: 120,
      panelHeightMax: 320,
      panelHeightBase: 120,
      panelHeightHeightFactorMultiplier: 45,
      layerSpacingYMin: 90,
      layerSpacingYMax: 220,
      layerSpacingYMaxYDivisor: 6,
      layerSpacingYHeightFactorMultiplier: 10,
      layerCountMin: 8,
      layerCountYPadding: 500,
      zSpacing: 420,
      zCountMin: 10,
      zCountDepthPadding: 1000,
      zStart: 400,
      strongOpacity: 0.28,
      weakOpacity: 0.18
    },

    guides: {
      stepMin: 20,
      stepDivisor: 6,
      stepRoundUnit: 10,
      widthMin: 180,
      widthMultiplier: 0.45,
      builtDepthPadding: 200,
      fallbackDepth: 3000,
      lineStartZ: -100,
      dashSize: 16,
      gapSize: 10,
      sampleCountTarget: 70,
      verticalOpacityBoost: 0.10
    },

    animation: {
      nebulaSpinMultiplier: 1.15,
      orbFloatTimeMultiplier: 0.0007,
      orbFloatAmplitude: 0.03,
      planetFallbackSpin: 0.001
    }
  }
};
