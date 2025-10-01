# Robot Ball Chase Game

A 3D interactive game built with Three.js featuring a robot that chases glowing balls in an ancient Roman map environment.

## 🎨 Features

- **Interactive 3D Game**: Robot ball chasing game with 10-second countdown
- **Glass Morphism UI**: Modern glass-like transparent interface design
- **Robot Movement**: Smooth keyboard controls for 3D movement (X, Y, Z axes)
- **Dynamic Ball Generation**: Random ball spawning with sparkling effects
- **Ancient Roman Map**: Detailed 3D map model (Luni sul Mignone)
- **Collision Detection**: Real-time robot-ball collision system
- **Smooth Animations**: Fluid robot floating and ball sparkling effects
- **Google Fonts Integration**: Zen Dots font for modern typography

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

Open your browser and navigate to `http://localhost:5173`

### Build

```bash
# Build for production
npm run build
```

Built files will be in the `dist` folder.

## 🎮 Game Controls

### Camera Controls
- **Mouse Drag**: Rotate view around the map
- **Scroll**: Zoom in/out

### Robot Movement
- **Arrow Keys**: Move robot horizontally (X, Z axes)
- **W / Space**: Rise up (Y axis positive)
- **S**: Move down (Y axis negative)

### Game Controls
- **Start Game Button**: Begin the ball chasing game
- **Automatic Reset**: Game resets automatically after 3 seconds of result display

## 📁 Project Structure

```
three/
├── index.html          # Main HTML file
├── style/
│   └── style.css      # Stylesheet
├── src/
│   └── main.js        # Main Three.js code
├── models/
│   ├── cute_robot_gltf/              # Robot GLTF model
│   └── luni_sul_mignone_1300ac_rawscan_gltf/  # Map GLTF model
├── package.json       # Project configuration
└── README.md          # This file
```

## 🛠️ Technologies

- **Three.js** ^0.168.0 - 3D graphics library
- **Vite** ^5.4.0 - Fast build tool
- **OrbitControls** - Camera control system
- **GLTFLoader** - GLTF model loader

## 🎯 Camera Settings

- **Initial Position**: X: -0.31, Y: 6.99, Z: 19.71
- **Minimum Height**: Y = 3.0 (restricted from going lower)
- **Target**: Map center (0, 0, 0)

## 🎯 Game Mechanics

### Game Objective
- **Goal**: Guide the robot to touch the glowing ball within 10 seconds
- **Success**: "CLEAR!" message displayed
- **Failure**: "FAILED..." message displayed if time runs out

### Ball Generation
- **Random Spawning**: Ball appears at random locations within map bounds
- **Distance Control**: Minimum 5m distance from robot starting position
- **Map Constraints**: Ball spawns only within the map area
- **Visual Effects**: Golden ball with rainbow sparkling particles

### Robot Movement
- **Position**: X: -0.3, Z: 7.5 (starting position)
- **Float Height**: 3.0m above floor with natural floating animation
- **Movement Speed**: Smooth interpolation for natural movement
- **Collision Radius**: 1.5m for ball contact detection

## 📊 Map Model

- **Source**: Luni sul Mignone 1300AC Raw Scan
- **Rotation**: 270° (X-axis)
- **Scale**: Automatically adjusted to 30 units
- **Position**: Centered at origin, floor-aligned

## 💡 Technical Features

### Glass Morphism UI
- **Backdrop Blur**: Modern glass-like transparency effects
- **Dynamic Gradients**: Animated background gradients
- **Smooth Animations**: Hover effects and transitions
- **Zen Dots Font**: Google Fonts integration for modern typography

### Advanced Countdown System
- **Smooth Progress Bar**: 50ms update intervals for fluid animation
- **Color Changes**: Green → Orange → Red as time decreases
- **Integer Display**: 1-second intervals for time labels
- **Auto Hide**: Timer disappears with game results

### Collision Detection
- **Real-time Checking**: Continuous distance calculation
- **Optimized Performance**: Efficient collision radius system
- **Visual Feedback**: Immediate game state changes

### Lighting System
- **Ambient Light**: Soft overall illumination
- **Directional Light**: Sun-like parallel light with shadows
- **Point Lights**: Two colored point lights for dynamic effects

## 🔧 Customization

### Game Settings

Edit `src/main.js`:
```javascript
// Game duration
let gameTimeLeft = 10; // Change countdown time (seconds)

// Ball properties
let ballRadius = 1.0; // Change ball size
let robotRadius = 1.5; // Change robot collision radius

// Robot movement speed
const robotSpeed = 0.15; // Change movement speed
```

### UI Customization

Edit `style/style.css`:
```css
/* Glass morphism effects */
.info {
    background: rgba(255, 255, 255, 0.1); /* Change transparency */
    backdrop-filter: blur(20px); /* Change blur intensity */
}

/* Countdown colors */
.countdown-progress {
    background: linear-gradient(90deg, #4ade80, #22c55e); /* Change colors */
}
```

### Robot Animation

Edit `src/main.js`:
```javascript
// Float height and animation
const floatHeight = 3.0; // Change floating height
const floatAmplitude = 0.3; // Change vertical movement range
const floatSpeed = 0.001; // Change animation speed
```

## 📝 License

MIT License - Feel free to use and modify.

## 🙏 Acknowledgments

- Robot model: Cute Robot GLTF
- Map model: Luni sul Mignone 1300AC Raw Scan
