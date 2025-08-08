# FLUX Audio Reactive Mode - UI Components

This directory contains the audio visualization UI components for FLUX Audio Reactive Mode, providing a complete user interface for audio-reactive particle effects.

## Components Overview

### AudioUI (`audio-ui.js`)
The main UI component that provides:
- **Audio Mode Toggle Button** - Enable/disable audio reactive mode with permission handling
- **Collapsible Control Panel** - Expandable panel with all audio controls
- **Real-time Spectrum Visualizer** - Canvas-based frequency spectrum display
- **Beat Indicator** - Visual feedback for beat detection with BPM display
- **Volume Meter** - Amplitude display with peak hold and color coding
- **Mode Selector** - Dropdown for visualization modes (Reactive, Pulse, Flow, Ambient)
- **Sensitivity Slider** - Real-time adjustment of audio responsiveness
- **Status Indicator** - Connection state and error messaging

### Key Features

#### 1. Audio Mode Toggle Button
```javascript
// Located at top-right of screen
// Handles microphone permission requests
// Shows connection status with visual indicators
```

#### 2. Real-time Spectrum Visualizer
```javascript
// 240x80 canvas with frequency bars
// Color-coded frequency ranges (Bass, Mids, Treble)
// Smoothed animation at 60fps
// Responsive design for mobile devices
```

#### 3. Beat Detection Indicator
```javascript
// Visual pulse animation on beat detection
// BPM calculation and display
// Beat strength visualization
// Confidence scoring
```

#### 4. Volume Meter
```javascript
// Real-time amplitude display
// Peak hold functionality
// Color coding: Cyan (low) → Blue (medium) → Red (high)
// Percentage display
```

#### 5. Visualization Modes
- **Reactive**: Full spectrum response with all frequencies affecting particles
- **Pulse**: Beat-driven radial effects from center
- **Flow**: Directional particle movement based on audio
- **Ambient**: Subtle audio influence without dramatic effects

#### 6. Sensitivity Control
```javascript
// Range: 0.1x to 3.0x
// Real-time adjustment
// Affects beat detection and effect intensity
// Visual feedback on change
```

## Usage Example

```javascript
import { AudioUI } from './audio/audio-ui.js'

// Create UI container
const container = document.body

// Initialize AudioUI
const audioUI = new AudioUI(container, {
    panelWidth: 280,
    spectrumHeight: 80,
    animationDuration: 300
})

// Set up callbacks
audioUI.setCallbacks({
    onToggleAudio: async (enabled) => {
        if (enabled) {
            // Initialize audio system
            const result = await initializeAudio()
            return result
        } else {
            // Disable audio system
            disableAudio()
        }
    },
    
    onModeChange: (mode) => {
        // Update visualization mode
        audioEffects.setMode(mode)
    },
    
    onSensitivityChange: (sensitivity) => {
        // Update audio sensitivity
        beatDetector.updateConfig({ sensitivity })
    },
    
    onPermissionRequest: async () => {
        // Handle microphone permission
        return await requestMicrophoneAccess()
    }
})

// Update UI with audio data
function updateAudioUI(audioData, beatData) {
    audioUI.updateAll(audioData)
    audioUI.updateBeat(beatData)
}
```

## Integration with Audio System

The AudioUI component is designed to work with the existing audio processing components:

```javascript
import { AudioUIIntegrationExample } from './audio-ui-integration-example.js'

// Complete integration example
const integration = new AudioUIIntegrationExample(fluxApp)

// The integration handles:
// - Audio analyzer initialization
// - Beat detection setup
// - UI callback management
// - Audio effects application
// - Error handling and cleanup
```

## Styling

The UI uses a cyberpunk/neon aesthetic matching the FLUX design language:

- **Colors**: Cyan (#00FFFF) primary, with blue and red accents
- **Typography**: IBM Plex Mono monospace font
- **Effects**: Subtle glow effects, smooth animations
- **Layout**: Fixed positioning, responsive design
- **Backdrop**: Blur effects for modern glass-morphism look

## CSS Classes

Key CSS classes for customization:
- `.audio-toggle` - Main toggle button
- `.audio-panel` - Control panel container
- `.spectrum-display` - Frequency spectrum canvas
- `.beat-indicator` - Beat detection display
- `.volume-meter` - Audio level meter
- `.mode-selector` - Visualization mode dropdown
- `.sensitivity-slider` - Sensitivity control slider

## Responsive Design

The UI adapts to different screen sizes:
- **Desktop**: Full panel with all controls
- **Tablet**: Adjusted panel width and spacing
- **Mobile**: Compact layout, hidden text labels

## Browser Compatibility

- **Chrome/Edge**: Full support including system audio capture
- **Firefox**: Full support with microphone input
- **Safari**: Basic support, limited system audio
- **Mobile**: Touch-optimized controls, microphone only

## Performance Considerations

- **Spectrum Animation**: Throttled to 60fps with requestAnimationFrame
- **UI Updates**: Debounced to prevent excessive DOM manipulation
- **Memory Management**: Proper cleanup on disposal
- **Canvas Rendering**: Optimized drawing with minimal redraws

## Error Handling

The UI provides comprehensive error handling:
- **Permission Denied**: Clear instructions for enabling microphone
- **No Microphone**: Fallback messaging and alternatives
- **Audio Processing Errors**: Graceful degradation
- **Browser Compatibility**: Feature detection and fallbacks

## Testing

Comprehensive test coverage includes:
- **Unit Tests**: Individual component functionality
- **Integration Tests**: Complete audio system workflow
- **UI Interaction Tests**: User interface behavior
- **Error Handling Tests**: Failure scenarios
- **Performance Tests**: Animation and rendering performance

## Files Structure

```
src/audio/
├── audio-ui.js                    # Main AudioUI component
├── audio-ui.css                   # Styling for UI components
├── audio-ui-integration-example.js # Complete integration example
└── README.md                      # This documentation

tests/
├── unit/audio-ui.test.js          # Unit tests for AudioUI
└── integration/audio-ui-integration.test.js # Integration tests
```

## Requirements Fulfilled

This implementation fulfills all task requirements:

✅ **Audio mode toggle button with permission handling**
✅ **Collapsible audio control panel**
✅ **Real-time frequency spectrum visualizer canvas**
✅ **Beat indicator with visual feedback**
✅ **Volume meter with amplitude display**
✅ **Mode selector dropdown with smooth transitions**
✅ **Sensitivity slider with real-time adjustment**
✅ **UI interaction tests for all audio controls**

The implementation provides a complete, production-ready audio visualization UI that integrates seamlessly with the existing FLUX audio processing system.