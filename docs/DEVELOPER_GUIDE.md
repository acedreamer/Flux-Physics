# 🔧 FLUX Physics Playground - Developer Guide

## 🏗️ Architecture Overview

### Core Technologies
```
Frontend:     Vanilla JavaScript ES6+ modules
Rendering:    WebGL 2.0 / Canvas2D fallback
Physics:      Custom particle system + WebAssembly (planned)
Audio:        Web Audio API + MediaDevices API
Build:        Vite + GitHub Actions CI/CD
Deployment:   GitHub Pages + CDN
```

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Input    │    │  Audio Capture  │    │  Visual Themes  │
│  (Mouse/Touch)  │    │   (Optional)    │    │   (CSS/WebGL)   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FluxApplication Core                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Physics   │  │  Rendering  │  │      UI Controls        │ │
│  │   Engine    │  │   Pipeline  │  │   (Settings Panel)      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  WebGL Context  │    │ Canvas2D Fallback│    │  Performance    │
│   (Primary)     │    │   (Backup)      │    │   Monitoring    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Project Structure

### Source Code Organization
```
src/
├── 🎯 app.js                    # Main application entry point
├── 🔧 main.js                   # Core FluxApplication class
├── 🎨 simple-style.css          # UI styling and themes
├── 🎵 audio/                    # Audio processing modules
│   ├── two-click-audio-capture.js      # Audio capture system
│   ├── optimized-audio-analyzer.js     # FFT analysis
│   ├── enhanced-audio-effects.js       # Audio-reactive effects
│   └── fallback-audio-capture.js       # Microphone fallback
├── 🎨 graphics/                 # Rendering systems
│   └── pixi-fallback.js         # Canvas2D fallback renderer
├── ⚡ effects/                  # Visual effects
│   ├── particle-trails.js       # Particle trail effects
│   └── background-effects.js    # Background visual effects
├── 🖱️ ui/                       # User interface
│   └── control-panel.js         # Settings panel management
├── 🔬 physics/                  # Physics simulation
│   └── fallback-physics.js      # Basic physics implementation
├── 🛠️ optimization/             # Performance optimization
│   └── performance-optimizer.js # FPS and quality management
└── 🔧 utils/                    # Utility functions
    └── [various utility modules]
```

## 🚀 Getting Started

### Development Setup
```bash
# Clone the repository
git clone https://github.com/acedreamer/Flux-Physics.git
cd Flux-Physics

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### Local Development Server
```bash
# Option 1: Vite dev server (recommended)
npm run dev

# Option 2: Python server
python scripts/servers/server.py

# Option 3: Node.js server
node scripts/servers/server.js

# Option 4: Windows batch launcher
scripts/launchers/start-server.bat
```

## 🔧 Core Components

### 1. FluxApplication Class
**Location**: `src/main.js`

```javascript
class FluxApplication {
  constructor() {
    this.canvas = document.getElementById('canvas');
    this.particles = [];
    this.isWebGL = false;
  }
  
  async init() {
    // Initialize WebGL or Canvas2D
    // Setup particle system
    // Configure event listeners
  }
  
  render() {
    // Main render loop
    // Update particle positions
    // Apply visual effects
  }
}
```

**Key Methods**:
- `init()` - Initialize rendering context and particle system
- `render()` - Main animation loop
- `setupCanvas()` - Configure canvas dimensions and context
- `getThemeColor()` - Apply visual themes to particles

### 2. Audio Integration
**Location**: `src/audio/`

```javascript
// Audio capture with fallback
const audioCapture = new TwoClickAudioCapture();
await audioCapture.initialize();

// Connect to particle system
if (audioCapture.isActive) {
  // Apply audio-reactive effects
  particles.forEach(particle => {
    particle.size *= audioCapture.getFrequencyData();
  });
}
```

**Audio Pipeline**:
1. **Capture** - System audio or microphone input
2. **Analysis** - FFT processing for frequency data
3. **Mapping** - Convert audio data to visual parameters
4. **Application** - Update particle properties in real-time

### 3. Rendering Pipeline
**WebGL Path** (Primary):
```javascript
// WebGL initialization
const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
if (gl) {
  // Setup shaders
  // Create particle buffers
  // Render with hardware acceleration
}
```

**Canvas2D Path** (Fallback):
```javascript
// Canvas2D fallback
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
ctx.fillRect(0, 0, canvas.width, canvas.height);

particles.forEach(particle => {
  ctx.fillStyle = particle.color;
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
  ctx.fill();
});
```

## 🎨 Theming System

### Theme Configuration
```javascript
const themes = {
  cyan: '#00ffff',
  rainbow: (index) => `hsl(${(index * 137.5) % 360}, 100%, 50%)`,
  fire: '#ff4500',
  ocean: '#0066cc',
  galaxy: '#9966cc'
};
```

### Adding New Themes
1. **Define colors** in theme configuration
2. **Update UI dropdown** in `index.html`
3. **Implement color logic** in `getThemeColor()` method
4. **Test across rendering modes** (WebGL + Canvas2D)

## ⚡ Performance Optimization

### Adaptive Quality System
```javascript
// Performance monitoring
const performanceStats = {
  frameRate: 60,
  frameTime: 16.7,
  particleCount: 50
};

// Automatic quality adjustment
if (performanceStats.frameRate < 30) {
  // Reduce particle count
  // Disable expensive effects
  // Switch to Canvas2D if needed
}
```

### Optimization Techniques
- **Object Pooling** - Reuse particle objects
- **Batch Rendering** - Group similar operations
- **LOD System** - Reduce quality at distance
- **Frame Rate Monitoring** - Automatic quality adjustment

## 🔌 API Reference

### Core Application API
```javascript
// Initialize FLUX
const app = new FluxApplication();
await app.init();

// Particle management
app.setParticleCount(100);
app.setTheme('rainbow');
app.applyPreset('energetic');

// Audio integration
app.enableAudioMode(true);
app.setAudioSensitivity(1.5);

// Performance control
app.setQualityLevel('high');
app.enableAdaptiveQuality(true);
```

### Event System
```javascript
// Listen for system events
app.on('particleUpdate', (particles) => {
  // Custom particle processing
});

app.on('audioData', (frequencyData) => {
  // Custom audio visualization
});

app.on('performanceChange', (stats) => {
  // React to performance changes
});
```

## 🧪 Testing

### Test Structure
```
tests/
├── unit/                    # Unit tests
│   ├── particle-system.test.js
│   ├── audio-capture.test.js
│   └── rendering.test.js
├── integration/             # Integration tests
│   ├── audio-visual.test.js
│   └── performance.test.js
└── e2e/                     # End-to-end tests
    └── user-interaction.test.js
```

### Running Tests
```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --grep "particle system"

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## 🚀 Deployment

### GitHub Actions Workflow
**Location**: `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Build
        run: |
          npm install
          npm run build
      - name: Deploy
        uses: actions/deploy-pages@v4
```

### Build Process
1. **Install Dependencies** - `npm install`
2. **Run Tests** - `npm test`
3. **Build Production** - `npm run build`
4. **Deploy to Pages** - Automatic GitHub Pages deployment

## 🔧 Configuration

### Vite Configuration
**Location**: `vite.config.js`

```javascript
export default {
  build: {
    target: 'es2015',
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
};
```

### Environment Variables
```bash
# Development
VITE_DEV_MODE=true
VITE_DEBUG_AUDIO=false

# Production
VITE_ANALYTICS_ID=your-analytics-id
VITE_ERROR_REPORTING=true
```

## 🐛 Debugging

### Debug Tools
```javascript
// Enable debug mode
window.DEBUG_MODE = true;

// Available debug functions
window.diagnoseSliders();     // Test UI controls
window.debugBloom();          // Check visual effects
window.getPerformanceStats(); // Performance metrics
window.validatePositions();   // Check particle physics
```

### Common Debug Scenarios
- **WebGL Issues** - Check browser console for shader errors
- **Audio Problems** - Verify permissions and audio context state
- **Performance Issues** - Monitor frame rate and memory usage
- **UI Problems** - Test control panel responsiveness

## 🔮 Future Development

### Planned Features
- **WebAssembly Physics** - Rust-powered physics engine
- **3D Rendering** - Three.js integration
- **Advanced Audio** - Beat detection and spectral analysis
- **Multi-user Mode** - Real-time collaborative interactions

### Contributing Guidelines
1. **Fork** the repository
2. **Create feature branch** from `main`
3. **Follow code style** - ES6+, functional patterns
4. **Add tests** for new functionality
5. **Update documentation** as needed
6. **Submit pull request** with clear description

### Code Style
- **ES6+ Modules** - Use import/export syntax
- **Functional Programming** - Prefer pure functions
- **Error Handling** - Comprehensive try/catch blocks
- **Performance First** - Profile before optimizing
- **Documentation** - JSDoc comments for public APIs

---

**Ready to contribute to FLUX?** 🚀

Check the [Performance Guide](./PERFORMANCE.md) for optimization techniques
See [Troubleshooting](./TROUBLESHOOTING.md) for common development issues