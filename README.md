# price-ride-viewer
Visualize CSV price data as a 3D ride-style course in the browser.
# price-ride-viewer

A browser-based 3D viewer that turns CSV price data into a ride-style course.

Load a CSV file, generate a 3D track from price movement, and explore it with different visual themes such as space, amusement park, and analysis mode.

## Features

- Load price data from a CSV file
- Generate a 3D course from closing prices
- Ride through the course with a moving camera
- Switch between multiple background themes
- Show height guides to make elevation differences easier to read

## Requirements

- A modern web browser
- A local web server is recommended

## Project Structure

```text
Work/
├── src
│   ├── config/
│   │   ├── uiConfig.js
│   │   ├── courseConfig.js
│   │   └── sceneConfig.js
│   ├── course.js
│   ├── coursePointBuilder.js
│   ├── csvDataRepository.js
│   ├── appActions.js
│   ├── appEvents.js
│   ├── appLoop.js
│   ├── main.js
│   ├── scene.js
│   ├── scenes/
│   │   ├── themeAnimations/
│   │   │   ├── spaceAnimation.js
│   │   │   ├── amusementAnimation.js
│   │   │   ├── futureCityAnimation.js
│   │   │   └── heavenTempleAnimation.js
│   │   └── themeBackgrounds/
│   │       ├── spaceBackground.js
│   │       ├── amusementBackground.js
│   │       ├── analysisBackground.js
│   │       ├── cityNightBackground.js
│   │       ├── futureCityBackground.js
│   │       └── heavenTempleBackground.js
│   ├── state.js
│   ├── railMeshBuilder.js
│   ├── labelSpriteFactory.js
│   ├── style.css
│   ├── ui.js
│   └── utils.js
└── index.html
