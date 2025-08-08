# FLUX Physics Playground

## Overview
FLUX is an interactive physics playground featuring real-time particle simulation with audio reactive capabilities. The system combines WebAssembly-powered physics with advanced audio analysis to create stunning visual experiences that respond to music.

## Features
- **Real-time Physics Simulation**: WebAssembly-powered particle physics
- **Audio Reactive Mode**: Particles respond to music in real-time
- **Multiple Visualization Modes**: Reactive, Pulse, Flow, and Ambient
- **Cross-browser Compatibility**: Works on Chrome, Edge, Firefox
- **Performance Optimized**: 60 FPS with automatic quality adjustment

## Quick Start

### ⚠️ Important: Local Server Required
FLUX requires a local web server to work properly due to ES6 module CORS restrictions.

### Easy Setup (Recommended)
1. **Start Server**: Double-click `start-server.bat` (Windows) or run `python server.py`
2. **Wait for**: "Server started successfully!" message
3. **Open Chrome**: Go to `http://localhost:8000`
4. **Click**: The 🎵 button and follow the two-click setup

### Alternative Server Methods
```bash
# Python (most common)
python server.py
# or
python -m http.server 8000

# Node.js
node server.js
# or
npx http-server -p 8000

# PHP
php -S localhost:8000
```

### For Best Audio Experience
1. **Use Google Chrome or Microsoft Edge** for optimal system audio support
2. **Start playing music** in another tab (YouTube, Spotify, etc.)
3. **Follow the two-click setup**: Clear instructions before any permission dialogs

### Browser Compatibility
- **Chrome**: ✅ Full system audio support (recommended)
- **Edge**: ✅ Full system audio support
- **Firefox/Waterfox**: ⚠️ Limited audio support
- **Safari**: ❌ No system audio support

## Project Structure
```
projects/flux/
├── src/                    # Source code
│   ├── core/              # Core physics and rendering
│   ├── audio/             # Audio reactive system
│   ├── ui/                # User interface components
│   └── utils/             # Utility functions
├── demos/                 # Interactive demonstrations
├── tests/                 # Test suites
├── docs/                  # Documentation
├── engine/                # WebAssembly physics engine
└── public/                # Static assets
```

## Documentation
- [Audio Reactive User Guide](./docs/AUDIO_REACTIVE_USER_GUIDE.md)
- [Developer Guide](./docs/AUDIO_REACTIVE_DEVELOPER_GUIDE.md)
- [Troubleshooting Guide](./docs/AUDIO_TROUBLESHOOTING_GUIDE.md)
- [Genre Configurations](./docs/AUDIO_GENRE_CONFIGURATIONS.md)

## Technologies
- **Frontend**: Vanilla JavaScript, PIXI.js, Web Audio API
- **Physics**: Rust + WebAssembly
- **Build**: Vite
- **Testing**: Vitest