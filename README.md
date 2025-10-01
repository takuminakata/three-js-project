# Three.js Project

This project is featuring GLTF models of a robot and a map.

## 🎨 Features

- Interactive 3D scene with GLTF model rendering
- Floating robot animation with vertical movement
- Ancient Roman map model (Luni sul Mignone)
- Camera controls with mouse and scroll
- Dynamic lighting system
- Real-time camera position tracking

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

## 🎮 Controls

- **Mouse Drag**: Rotate view
- **Scroll**: Zoom in/out
- **Right Click + Drag**: Pan camera

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

## 🤖 Robot Animation

- **Position**: X: -0.3, Z: 7.5
- **Float Height**: 3.0m above floor
- **Vertical Movement**: ±0.3m amplitude
- **Animation Speed**: Slow sine wave motion

## 📊 Map Model

- **Source**: Luni sul Mignone 1300AC Raw Scan
- **Rotation**: 270° (X-axis)
- **Scale**: Automatically adjusted to 30 units
- **Position**: Centered at origin, floor-aligned

## 💡 Features Detail

### Lighting System
- Ambient Light: Soft overall illumination
- Directional Light: Sun-like parallel light with shadows
- Point Lights: Two colored point lights for dynamic effects

### Model Loading
- Automatic size calculation and scaling
- Center alignment
- Shadow casting and receiving
- Progress tracking in console

### Camera Constraints
- Y-axis minimum: 3.0 (prevents underground view)
- Console logging: Camera position every 1 second

## 🔧 Customization

### Adjust Robot Float Height

Edit `src/main.js`:
```javascript
const floatHeight = 3.0; // Change this value
```

### Adjust Robot Float Speed

Edit `src/main.js`:
```javascript
const floatSpeed = 0.001; // Change this value
const floatAmplitude = 0.3; // Change vertical range
```

### Change Camera Initial Position

Edit `src/main.js`:
```javascript
camera.position.set(
    -0.31, // X
    6.99,  // Y
    19.71  // Z
);
```

## 📝 License

MIT License - Feel free to use and modify.

## 🙏 Acknowledgments

- Robot model: Cute Robot GLTF
- Map model: Luni sul Mignone 1300AC Raw Scan
