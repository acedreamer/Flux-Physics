# FLUX Audio Reactive Mode - User Guide

## Overview

FLUX Audio Reactive Mode transforms your particle physics playground into a dynamic music visualizer that responds to audio in real-time. The system analyzes frequency data, detects beats, and translates audio characteristics into stunning visual effects.

## Quick Start

### 1. Enable Audio Mode

1. **Look for the Audio Module**: Find the glowing circular button (🎵) in the top-left corner of your screen
2. **Click to Enable**: Click the button to activate audio reactive mode
3. **Grant Permissions**: Allow microphone or system audio access when prompted
4. **Watch the Magic**: Particles will now respond to your music in real-time

### 2. Audio Sources

The system supports multiple audio input sources:

- **Microphone**: Captures audio from your device's microphone
- **System Audio**: Captures audio playing on your computer (Chrome/Edge only)
- **Automatic Fallback**: If system audio fails, automatically switches to microphone

### 3. Visual Indicators

When audio mode is active, you'll see:

- **Status Indicator**: Green dot showing "ACTIVE" status
- **Level Visualizer**: 8 frequency bars showing real-time audio levels
- **Beat Indicator**: Flashes when beats are detected
- **Info Panel**: Expandable panel with detailed audio information

## Audio Visualization Modes

### Reactive Mode (Default)
- **Bass**: Creates outward pressure from center, affects gravity
- **Mids**: Generates swirling particle motions
- **Treble**: Creates sparkle effects and size variations
- **Beats**: Triggers pulse waves and bloom effects

### Pulse Mode
- **Bass**: Continuous outward pressure from center
- **Beats**: Expanding ring effects radiating from center
- **Visual Style**: Rhythmic, beat-driven particle displacement

### Flow Mode
- **Stereo Channels**: Creates directional particle flows
- **Audio Direction**: Particles flow based on stereo separation
- **Visual Style**: Smooth, flowing particle movements

### Ambient Mode
- **Subtle Effects**: Gentle audio-influenced particle drift
- **Color Shifts**: Gradual color changes based on frequency content
- **Visual Style**: Atmospheric, non-intrusive audio response

## Visual Effects Explained

### Frequency Response
- **Bass (20-250Hz)**: Red/orange colors, radial forces, gravity effects
- **Mids (250Hz-4kHz)**: Green/cyan colors, swirling motions, bloom intensity
- **Treble (4kHz-20kHz)**: Blue/white colors, sparkle effects, particle size

### Beat Detection
- **Algorithm**: Energy-based beat detection with adaptive thresholds
- **Visual Response**: Pulse waves, bloom spikes, particle scaling
- **BPM Calculation**: Real-time tempo detection and display

### Color Mapping
- **Dynamic Hues**: Colors shift based on dominant frequency ranges
- **Saturation**: Intensity based on overall audio energy
- **Brightness**: Responds to beat strength and amplitude

## Customization Options

### Sensitivity Settings
- **Range**: 0.1 to 2.0 (default: 1.0)
- **Effect**: Scales overall audio response intensity
- **Usage**: Adjust for different music volumes and styles

### Frequency Weights
- **Bass Weight**: Emphasize low-frequency response
- **Mids Weight**: Adjust mid-frequency sensitivity
- **Treble Weight**: Control high-frequency effects

### Smoothing Factor
- **Range**: 0.1 to 1.0 (default: 0.7)
- **Effect**: Controls how quickly visuals respond to audio changes
- **Lower Values**: More responsive, potentially jittery
- **Higher Values**: Smoother, more stable visuals

## Troubleshooting

### Audio Not Working

**Check Browser Compatibility**
- ✅ Chrome (recommended)
- ✅ Edge
- ⚠️ Firefox (limited system audio support)
- ❌ Safari (limited Web Audio API support)

**Permission Issues**
1. Click the audio button again
2. Look for permission prompts in the address bar
3. Manually enable microphone access in browser settings
4. Refresh the page and try again

**System Audio Not Available**
1. Use Chrome or Edge browser
2. When prompted, check "Share system audio"
3. Select the correct audio source (speakers/headphones)
4. If unavailable, fallback to microphone will be used

### Performance Issues

**Low Frame Rate**
- Audio processing is optimized to maintain 60fps
- If performance drops, the system automatically reduces quality
- Close other browser tabs for better performance

**Audio Lag**
- Normal latency: 20-50ms
- High latency may indicate performance issues
- Try reducing browser load or switching audio sources

### Visual Issues

**No Visual Response**
1. Check if audio is actually playing
2. Increase volume or sensitivity
3. Verify the correct audio source is selected
4. Look for "low audio" warnings in the info panel

**Overwhelming Effects**
1. Reduce sensitivity setting
2. Switch to "Ambient" mode for subtler effects
3. Adjust frequency weights to emphasize preferred ranges

## Best Practices

### Music Recommendations
- **Electronic/EDM**: Works excellently with clear bass and treble
- **Rock/Pop**: Good overall response across all frequencies
- **Classical**: Beautiful with "Ambient" mode
- **Hip-Hop**: Excellent bass response in "Pulse" mode

### Performance Tips
1. **Close Unnecessary Tabs**: Reduces CPU load
2. **Use Wired Headphones**: Better audio quality and less feedback
3. **Adjust Volume**: Moderate levels work best (50-80%)
4. **Choose Right Mode**: Match visualization mode to music style

### Creative Usage
- **Live Performances**: Use with DJ software or live instruments
- **Meditation**: Ambient mode with calm music
- **Parties**: Pulse or Reactive mode with energetic music
- **Background**: Low sensitivity for subtle ambient effects

## Technical Details

### Audio Analysis
- **FFT Size**: 2048 samples for detailed frequency analysis
- **Sample Rate**: 44.1kHz standard audio quality
- **Frequency Bins**: 1024 frequency bands analyzed
- **Update Rate**: 60Hz for smooth visual response

### Performance Optimization
- **Web Workers**: Heavy processing moved off main thread
- **Adaptive Quality**: Automatic quality reduction under load
- **Memory Management**: Efficient buffer reuse and cleanup
- **GPU Acceleration**: Hardware-accelerated particle rendering

### Browser Requirements
- **Web Audio API**: Required for audio processing
- **WebGL**: Required for particle rendering
- **getUserMedia**: Required for microphone access
- **getDisplayMedia**: Required for system audio (optional)

## Keyboard Shortcuts

- **Space**: Toggle audio mode on/off
- **M**: Cycle through visualization modes
- **+/-**: Increase/decrease sensitivity
- **R**: Reset to default settings
- **I**: Toggle info panel
- **F**: Toggle fullscreen mode

## API Reference

For developers integrating the audio reactive system:

```javascript
// Enable audio mode
await fluxApp.toggleAudioMode(true)

// Set visualization mode
fluxApp.setAudioMode('reactive') // 'pulse', 'flow', 'ambient'

// Adjust sensitivity
fluxApp.setAudioSensitivity(1.5) // 0.1 - 2.0

// Get current audio data
const audioData = fluxApp.audioState.lastAudioData
console.log('Bass:', audioData.bass)
console.log('Mids:', audioData.mids)
console.log('Treble:', audioData.treble)

// Get beat information
const beatData = fluxApp.audioState.lastBeatData
console.log('Beat detected:', beatData.isBeat)
console.log('BPM:', beatData.bpm)
```

## Support

### Common Questions

**Q: Why doesn't system audio work in my browser?**
A: System audio capture requires Chrome or Edge browser and explicit user permission. Firefox and Safari have limited support.

**Q: Can I use external audio interfaces?**
A: Yes, any audio device recognized by your browser will work. Select the appropriate input device in your browser's audio settings.

**Q: Does this work with streaming music?**
A: Yes, when using system audio capture, it works with Spotify, YouTube, and other streaming services.

**Q: Can I record the visualizations?**
A: Use browser screen recording or external recording software. The visualizations run at 60fps for smooth recording.

### Getting Help

- **Console Commands**: Press F12 and use `getAudioState()` for debugging
- **Performance Stats**: Use `fluxApp.getPerformanceStats()` to check performance
- **Reset Settings**: Use `fluxApp.resetAudioSettings()` to restore defaults

---

*FLUX Audio Reactive Mode - Transform sound into stunning visual experiences*