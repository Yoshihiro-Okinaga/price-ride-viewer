export const UI_CONFIG = {
  toggleKey: 'h',

  displayText: {
    showUi: 'UIを表示',
    hideUi: 'UIを隠す',
    initialStatus: 'CSVを選んで「コースを作る」を押してください。',
    errorPrefix: 'エラー: ',
    autoScaleOn: 'ON',
    autoScaleOff: 'OFF',
    invertOn: '反転',
    invertOff: '通常',
    guideVisible: '表示',
    guideHidden: '非表示',
    uiToggleHelp: 'ボタン または H キー',
    baseCloseHigh: '高値',
    baseCloseLow: '安値',
    appTitle: 'Ride Viewer',
    buildButtonLabel: 'コースを作る',
    csvLabel: 'CSVファイル（stock-data）',
    startDateLabel: '開始日',
    heightScaleLabel: '高さの拡大率（終値差分 × この値）',
    zStepLabel: 'Z方向の間隔',
    interpolationModeLabel: '補間方式',
    curveTypeLabel: 'Catmull-Romタイプ',
    curveTensionLabel: 'Catmull-Romテンション',
    autoScaleLabel: '高さ・Z間隔を自動調整',
    rideSpeedLabel: '移動速度',
    lookAheadLabel: '視線の先読み量',
    invertPriceLabel: '価格の反転',
    themeLabel: '背景テーマ',
    showHeightGuidesLabel: '高さガイドを表示',
    csvPlaceholder: '選択してください'
  },

  validationMessage: {
    invalidHeightScale: '高さの拡大率が不正です。',
    invalidZStep: 'Z方向の間隔が不正です。',
    invalidCurveTension: 'Catmull-Romテンションが不正です。',
    missingCsv: 'CSVファイルを選択してください。',
    nonPositiveZStep: 'Z方向の間隔は 0 より大きい必要があります。',
    nonPositiveHeightScale: '高さの拡大率は 0 より大きい必要があります。'
  },

  statusFormat: {
    priceDecimals: 5,
    maxYDecimals: 1
  },

  initialValues: {
    startDate: '2026-01-01',
    heightScale: 1000,
    heightScaleStep: 100,
    zStep: 80,
    zStepStep: 1,
    interpolationMode: 'catmullrom',
    curveType: 'catmullrom',
    curveTension: 0.35,
    curveTensionStep: 0.01,
    autoScale: true,
    rideSpeed: 0.02,
    rideSpeedStep: 0.01,
    lookAhead: 0.005,
    lookAheadStep: 0.001,
    invertPrice: false,
    theme: 'space',
    showHeightGuides: true,
  },

  themeOptions: [
    { value: 'space', label: '宇宙' },
    { value: 'amusement', label: '明るい遊園地' },
    { value: 'analysis', label: '解析モード' },
    { value: 'cityNight', label: '都会の夜景' },
    { value: 'futureCity', label: '未来都市' },
    { value: 'heavenTemple', label: '天界神殿' }
  ],

  interpolationModeOptions: [
    { value: 'catmullrom', label: 'Catmull-Rom（補間あり）' },
    { value: 'none', label: '補間なし（折れ線）' }
  ],

  curveTypeOptions: [
    { value: 'catmullrom', label: 'catmullrom' },
    { value: 'centripetal', label: 'centripetal' },
    { value: 'chordal', label: 'chordal' }
  ],

  csvOptions: [
    {
      groupLabel: 'FXCFD',
      options: [
        { value: './stock-data/FXCFD/USD_JPY.csv', label: 'FXCFD / USD_JPY' },
        { value: './stock-data/FXCFD/EUR_USD.csv', label: 'FXCFD / EUR_USD' },
        { value: './stock-data/FXCFD/GBP_USD.csv', label: 'FXCFD / GBP_USD' },
        { value: './stock-data/FXCFD/GOLD_USD.csv', label: 'FXCFD / GOLD_USD' },
        { value: './stock-data/FXCFD/JAPAN255_Futures.csv', label: 'FXCFD / JAPAN255_Futures' },
        { value: './stock-data/FXCFD/OIL_USD.csv', label: 'FXCFD / OIL_USD' },
        { value: './stock-data/FXCFD/US30_Futures.csv', label: 'FXCFD / US30_Futures' },
        { value: './stock-data/FXCFD/EUR_GBP.csv', label: 'FXCFD / EUR_GBP' }
      ]
    },
    {
      groupLabel: 'FXCFD / Sub',
      options: [
        { value: './stock-data/FXCFD/Sub/AUD_JPY.csv', label: 'FXCFD / Sub / AUD_JPY' },
        { value: './stock-data/FXCFD/Sub/AUD_USD.csv', label: 'FXCFD / Sub / AUD_USD' },
        { value: './stock-data/FXCFD/Sub/CAD_JPY.csv', label: 'FXCFD / Sub / CAD_JPY' },
        { value: './stock-data/FXCFD/Sub/CHF_JPY.csv', label: 'FXCFD / Sub / CHF_JPY' },
        { value: './stock-data/FXCFD/Sub/EUR_AUD.csv', label: 'FXCFD / Sub / EUR_AUD' },
        { value: './stock-data/FXCFD/Sub/EUR_CHF.csv', label: 'FXCFD / Sub / EUR_CHF' },
        { value: './stock-data/FXCFD/Sub/EUR_JPY.csv', label: 'FXCFD / Sub / EUR_JPY' },
        { value: './stock-data/FXCFD/Sub/EUR_NZD.csv', label: 'FXCFD / Sub / EUR_NZD' },
        { value: './stock-data/FXCFD/Sub/GBP_AUD.csv', label: 'FXCFD / Sub / GBP_AUD' },
        { value: './stock-data/FXCFD/Sub/GBP_CHF.csv', label: 'FXCFD / Sub / GBP_CHF' },
        { value: './stock-data/FXCFD/Sub/GBP_JPY.csv', label: 'FXCFD / Sub / GBP_JPY' },
        { value: './stock-data/FXCFD/Sub/NZD_JPY.csv', label: 'FXCFD / Sub / NZD_JPY' },
        { value: './stock-data/FXCFD/Sub/NZD_USD.csv', label: 'FXCFD / Sub / NZD_USD' },
        { value: './stock-data/FXCFD/Sub/PLATINUM_USD.csv', label: 'FXCFD / Sub / PLATINUM_USD' },
        { value: './stock-data/FXCFD/Sub/SILVER_USD.csv', label: 'FXCFD / Sub / SILVER_USD' },
        { value: './stock-data/FXCFD/Sub/TRY_JPY.csv', label: 'FXCFD / Sub / TRY_JPY' },
        { value: './stock-data/FXCFD/Sub/USD_CAD.csv', label: 'FXCFD / Sub / USD_CAD' },
        { value: './stock-data/FXCFD/Sub/USD_CHF.csv', label: 'FXCFD / Sub / USD_CHF' },
        { value: './stock-data/FXCFD/Sub/ZAR_JPY.csv', label: 'FXCFD / Sub / ZAR_JPY' }
      ]
    },
    {
      groupLabel: 'Stock',
      options: [
        { value: './stock-data/Stock/1963_日揮ホールディングス.csv', label: 'Stock / 1963_日揮ホールディングス' },
        { value: './stock-data/Stock/3407_旭化成.csv', label: 'Stock / 3407_旭化成' },
        { value: './stock-data/Stock/5401_日本製鉄.csv', label: 'Stock / 5401_日本製鉄' },
        { value: './stock-data/Stock/6752_パナソニック.csv', label: 'Stock / 6752_パナソニック' },
        { value: './stock-data/Stock/6770_アルプスアルパイン.csv', label: 'Stock / 6770_アルプスアルパイン' },
        { value: './stock-data/Stock/8802_三菱地所.csv', label: 'Stock / 8802_三菱地所' },
        { value: './stock-data/Stock/日経平均.csv', label: 'Stock / 日経平均' }
      ]
    },
    {
      groupLabel: 'Stock / Sub',
      options: [
        { value: './stock-data/Stock/Sub/1808_長谷工コーポレーション.csv', label: 'Stock / Sub / 1808_長谷工コーポレーション' },
        { value: './stock-data/Stock/Sub/7201_日産自動車.csv', label: 'Stock / Sub / 7201_日産自動車' },
        { value: './stock-data/Stock/Sub/7261_マツダ.csv', label: 'Stock / Sub / 7261_マツダ' },
        { value: './stock-data/Stock/Sub/8001_伊藤忠商事.csv', label: 'Stock / Sub / 8001_伊藤忠商事' },
        { value: './stock-data/Stock/Sub/8628_松井証券.csv', label: 'Stock / Sub / 8628_松井証券' },
        { value: './stock-data/Stock/Sub/9449_ＧＭＯインターネット.csv', label: 'Stock / Sub / 9449_ＧＭＯインターネット' },
        { value: './stock-data/Stock/Sub/9697_カプコン.csv', label: 'Stock / Sub / 9697_カプコン' }
      ]
    },
    {
      groupLabel: 'Stock / Verification',
      options: [
        { value: './stock-data/Stock/Verification/9501_東京電力ホールディングス.csv', label: 'Stock / Verification / 9501_東京電力ホールディングス' },
        { value: './stock-data/Stock/Verification/9502_中部電力.csv', label: 'Stock / Verification / 9502_中部電力' },
        { value: './stock-data/Stock/Verification/9503_関西電力.csv', label: 'Stock / Verification / 9503_関西電力' },
        { value: './stock-data/Stock/Verification/9504_中国電力.csv', label: 'Stock / Verification / 9504_中国電力' },
        { value: './stock-data/Stock/Verification/9505_北陸電力.csv', label: 'Stock / Verification / 9505_北陸電力' },
        { value: './stock-data/Stock/Verification/9506_東北電力.csv', label: 'Stock / Verification / 9506_東北電力' },
        { value: './stock-data/Stock/Verification/9507_四国電力.csv', label: 'Stock / Verification / 9507_四国電力' },
        { value: './stock-data/Stock/Verification/9508_九州電力.csv', label: 'Stock / Verification / 9508_九州電力' },
        { value: './stock-data/Stock/Verification/9509_北海道電力.csv', label: 'Stock / Verification / 9509_北海道電力' },
        { value: './stock-data/Stock/Verification/9511_沖縄電力.csv', label: 'Stock / Verification / 9511_沖縄電力' }
      ]
    }
  ]
};
