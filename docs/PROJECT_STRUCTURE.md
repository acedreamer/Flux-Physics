# FLUX Project Structure

This document provides a detailed overview of the FLUX project organization and file structure.

## 📁 Directory Structure

### `/src/` - Source Code
The main source code directory containing all application logic.

#### `/src/audio/` - Audio Reactive System
Modular audio reactive system with clean separation of concerns.

##### `/src/audio/core/` - Core Audio Processing
- `flux-audio-module.js` - **Main FLUX Audio Module** (Current, Recommended)
- `simple-audio-reactive.js` - Simplified audio reactive system
- `audio-analyzer.js` - Core audio analysis engine
- `audio-effects.js` - Visual effects controller
- `beat-detector.js` - Beat detection algorithms
- `frequency-analyzer.js` - Frequency spectrum analysis
- `audio-worker.js` - Web Worker for audio processing
- `fft-optimizer.js` - FFT performance optimizations
- `audio-settings.js` - Audio configuration management
- `audio-source-manager.js` - Audio source switching
- `audio-worker-manager.js` - Worker thread management
- `audio-performance-monitor.js` - Performance monitoring
- `audio-performance-benchmarks.js` - Performance benchmarking

##### `/src/audio/ui/` - User Interface Components
- `audio-ui.js` - Legacy audio UI (deprecated)
- `audio-mode-switch.js` - Audio toggle switch (legacy)
- `enhanced-audio-ui.js` - Enhanced UI components
- `audio-toggle-button.js` - Simple toggle button
- `audio-settings-ui.js` - Settings interface
- `audio-error-handler.js` - Error handling UI
- `audio-user-feedback.js` - User feedback system
- `*.css` - Component stylesheets

##### `/src/audio/examples/` - Usage Examples
- `*-example.js` - Code examples and usage patterns
- `*-demo.js` - Interactive demonstrations
- `device-audio-setup.js` - Device audio configuration

##### `/src/audio/legacy/` - Deprecated Components
- `*.test.js` - Old test files
- Deprecated audio components

##### `/src/audio/docs/` - Audio System Documentation
- `README.md` - Audio system overview
- `PERFORMANCE_OPTIMIZATION_SUMMARY.md` - Performance guide
- `SYSTEM_AUDIO_IMPLEMENTATION.md` - System audio guide

### `/demos/` - Interactive Demonstrations
Live demonstrations and testing interfaces.

#### `/demos/audio/` - Audio System Demos
- `audio-mode-switch-demo.html` - Audio switch demonstration
- `debug-audio-capture.html` - Audio capture debugging
- `device-audio-demo.html` - Device audio testing
- `quick-audio-test.html` - Quick audio functionality test
- `test-flux-audio-switch.html` - FLUX integration test

#### `/demos/flux/` - FLUX System Demos
- `flux-audio-module-demo.html` - **Main FLUX Audio Module Demo**

### `/tests/` - Test Suites
Comprehensive testing framework for all components.

#### Test Categories
- `/unit/` - Unit tests for individual components
- `/integration/` - Integration tests for system interactions
- `/performance/` - Performance and load testing
- `/visual/` - Visual regression testing
- `/cross-browser/` - Browser compatibility testing

### `/docs/` - Documentation
Project documentation and guides.

- `PROJECT_STRUCTURE.md` - This file
- `AUDIO_TEST_SUMMARY.md` - Audio testing overview
- `AUDIO_TESTING_GUIDE.md` - Testing procedures
- `DEVICE_AUDIO_SETUP.md` - Device audio configuration
- `OPTIMIZATION_SUMMARY.md` - Performance optimization guide

### `/examples/` - Code Examples
Standalone code examples and tutorials.

### `/archive/` - Archived Files
Deprecated files and old implementations.

## 🎯 Current Recommended Components

### For New Projects
1. **FLUX Audio Module** (`src/audio/core/flux-audio-module.js`)
   - Modern, modular design
   - FLUX aesthetic integration
   - Full feature set
   - Active development

2. **Simple Audio Reactive** (`src/audio/core/simple-audio-reactive.js`)
   - Lightweight alternative
   - Easy integration
   - Good for basic needs

### Legacy Components (Avoid)
- `audio-ui.js` - Replaced by FLUX Audio Module
- `audio-mode-switch.js` - Replaced by FLUX Audio Module
- Old test files in `/legacy/`

## 🔄 Migration Guide

### From Old Audio UI to FLUX Audio Module

**Old:**
```javascript
import { AudioUI } from './src/audio/ui/audio-ui.js'
const audioUI = new AudioUI(container, options)
```

**New:**
```javascript
import { setupFluxAudioModule } from './src/audio/core/flux-audio-module.js'
const audioModule = setupFluxAudioModule(fluxApp, options)
```

### From Audio Mode Switch to FLUX Audio Module

**Old:**
```javascript
import { setupAudioModeSwitch } from './src/audio/ui/audio-mode-switch.js'
const audioSwitch = setupAudioModeSwitch(fluxApp)
```

**New:**
```javascript
import { setupFluxAudioModule } from './src/audio/core/flux-audio-module.js'
const audioModule = setupFluxAudioModule(fluxApp, { position: 'top-left' })
```

## 🧪 Testing Strategy

### Test Organization
- **Unit Tests**: Individual component functionality
- **Integration Tests**: Component interactions
- **Performance Tests**: Load and stress testing
- **Visual Tests**: UI and visual regression
- **Cross-Browser Tests**: Browser compatibility

### Test Files Location
- Core tests: `/tests/unit/`
- Integration tests: `/tests/integration/`
- Legacy tests: `/src/audio/legacy/`

## 📦 Build Process

### Development
```bash
npm run dev          # Start development server
npm run test         # Run all tests
npm run test:audio   # Run audio-specific tests
```

### Production
```bash
npm run build        # Build for production
npm run preview      # Preview production build
```

## 🎨 Demo Usage

### Quick Testing
1. Open `demos/flux/flux-audio-module-demo.html`
2. Click the glowing audio button
3. Test with music

### Development Testing
1. Use `demos/audio/debug-audio-capture.html` for audio debugging
2. Use `demos/audio/quick-audio-test.html` for quick functionality tests

## 🔧 Configuration

### Audio Module Options
```javascript
{
    position: 'top-left',    // UI positioning
    compact: false,          // Compact mode
    theme: 'flux'           // Visual theme
}
```

### FluxApp Integration
The FLUX Audio Module automatically integrates with FluxApplication instances and uses existing audio infrastructure when available.

---

This structure provides clear separation of concerns, easy maintenance, and straightforward development workflows.