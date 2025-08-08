# FLUX System Audio Capture Implementation

This document describes the implementation of system audio capture support with fallbacks for the FLUX Audio Reactive Mode.

## Overview

The system audio capture functionality allows FLUX to analyze audio playing on the user's computer (system audio) in addition to microphone input. This enables visualization of music, videos, games, and other audio content without requiring external microphone input.

## Features Implemented

### ✅ Task 8 Components

1. **System Audio Capture using getDisplayMedia API**
   - Implemented in `AudioSourceManager.requestSystemAudioAccess()`
   - Uses `navigator.mediaDevices.getDisplayMedia()` with audio constraints
   - Handles browser-specific limitations and requirements

2. **Audio Source Switching**
   - Seamless switching between microphone and system audio
   - Implemented in `AudioSourceManager.switchSource()`
   - Maintains connection state during transitions

3. **Fallback Handling**
   - Automatic fallback from system to microphone when system audio fails
   - Automatic fallback from microphone to system when microphone fails
   - Configurable fallback behavior with `allowFallback` option

4. **Automatic Reconnection**
   - Monitors stream health and detects disconnections
   - Implements exponential backoff for reconnection attempts
   - Configurable maximum attempts and delays

5. **Clear User Instructions**
   - Browser-specific error messages and instructions
   - Step-by-step guidance for system audio setup
   - Help dialog with detailed explanations

6. **Cross-Browser Compatibility Tests**
   - Comprehensive test suite for different browsers
   - Capability detection and graceful degradation
   - Error handling validation

## Architecture

### Core Components

```
AudioAnalyzer
├── AudioSourceManager (NEW)
│   ├── Capability Detection
│   ├── Source Connection Management
│   ├── Fallback Handling
│   ├── Reconnection Logic
│   └── Error Handling
├── FrequencyAnalyzer
└── Existing audio processing
```

### AudioSourceManager

The `AudioSourceManager` class is the core component that handles:

- **Browser Capability Detection**: Detects support for getUserMedia, getDisplayMedia, and system audio
- **Source Management**: Manages connections to microphone and system audio sources
- **Fallback Logic**: Automatically switches between sources when one fails
- **Reconnection**: Monitors stream health and reconnects on failures
- **Error Handling**: Provides detailed error messages and user instructions

### Key Methods

```javascript
// Initialize with audio context
await sourceManager.initialize(audioContext)

// Connect to a specific source with fallback
const result = await sourceManager.connectSource('system', { allowFallback: true })

// Switch between sources
const switchResult = await sourceManager.switchSource('microphone')

// Get supported sources
const sources = sourceManager.getSupportedSources()

// Get connection status
const status = sourceManager.getConnectionStatus()
```

## Browser Support

### System Audio Support

| Browser | System Audio | Notes |
|---------|-------------|-------|
| Chrome 74+ | ✅ Full Support | Requires "Share system audio" checkbox |
| Edge 79+ | ✅ Full Support | Chromium-based, same as Chrome |
| Firefox | ❌ Not Supported | getDisplayMedia available but no system audio |
| Safari | ❌ Not Supported | Limited getDisplayMedia support |

### Microphone Support

| Browser | Microphone | Notes |
|---------|------------|-------|
| Chrome | ✅ Full Support | Standard getUserMedia |
| Edge | ✅ Full Support | Standard getUserMedia |
| Firefox | ✅ Full Support | Standard getUserMedia |
| Safari | ✅ Full Support | Standard getUserMedia |

## Usage Examples

### Basic System Audio Setup

```javascript
import { AudioAnalyzer } from './audio-analyzer.js'

const audioAnalyzer = new AudioAnalyzer()

// Initialize with system audio (fallback to microphone)
const result = await audioAnalyzer.initialize('system')

if (result.success) {
    console.log(`Connected to: ${result.source}`)
    if (result.fallbackUsed) {
        console.log(`Fallback used: ${result.originalSource} → ${result.source}`)
    }
} else {
    console.error(`Failed: ${result.message}`)
}
```

### Source Switching

```javascript
// Switch to system audio
const switchResult = await audioAnalyzer.switchSource('system')

if (switchResult.success) {
    console.log(`Switched to: ${switchResult.source}`)
} else {
    console.error(`Switch failed: ${switchResult.message}`)
    // Previous source is automatically restored if restoreOnFailure: true
}
```

### UI Integration

```javascript
import { AudioUI } from './audio-ui.js'

const audioUI = new AudioUI(container)

// Set up callbacks
audioUI.setCallbacks({
    onSourceChange: async (source) => {
        return await audioAnalyzer.switchSource(source)
    },
    onToggleAudio: async (enabled) => {
        if (enabled) {
            return await audioAnalyzer.initialize(audioUI.currentAudioSource)
        } else {
            audioAnalyzer.dispose()
            return { success: true }
        }
    }
})

// Update supported sources
const supportedSources = audioAnalyzer.getSupportedSources()
audioUI.updateSupportedSources(supportedSources)
```

## Error Handling

### Error Types

The system provides detailed error information for different failure scenarios:

#### Microphone Errors
- `MICROPHONE_PERMISSION_DENIED`: User denied microphone access
- `NO_MICROPHONE_DEVICE`: No microphone found
- `MICROPHONE_HARDWARE_ERROR`: Microphone in use or hardware issue
- `MICROPHONE_CONSTRAINTS_ERROR`: Microphone doesn't support requested settings

#### System Audio Errors
- `SYSTEM_AUDIO_PERMISSION_DENIED`: User denied screen sharing
- `NO_SYSTEM_AUDIO`: No system audio available in shared content
- `SYSTEM_AUDIO_UNSUPPORTED`: Browser doesn't support getDisplayMedia
- `SYSTEM_AUDIO_LIMITED`: Browser has limited system audio support

#### Connection Errors
- `CONNECTION_FAILED`: General connection failure
- `RECONNECTION_FAILED`: Automatic reconnection failed
- `SWITCH_FAILED`: Source switching failed

### Error Response Format

```javascript
{
    success: false,
    error: 'ERROR_CODE',
    message: 'Human-readable error message',
    instructions: [
        'Step 1: Do this',
        'Step 2: Do that',
        'Step 3: Try this'
    ]
}
```

## Configuration Options

### AudioSourceManager Options

```javascript
const sourceManager = new AudioSourceManager({
    reconnectDelay: 2000,              // Initial reconnection delay (ms)
    reconnectBackoffMultiplier: 1.5,   // Backoff multiplier for delays
    maxReconnectDelay: 10000,          // Maximum reconnection delay (ms)
    maxReconnectAttempts: 3,           // Maximum reconnection attempts
    
    streamConstraints: {
        microphone: {
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
                sampleRate: 44100
            }
        },
        system: {
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
                sampleRate: 44100
            },
            video: false
        }
    }
})
```

### AudioAnalyzer Integration

```javascript
const audioAnalyzer = new AudioAnalyzer({
    // Existing options...
    reconnectDelay: 2000,
    maxReconnectAttempts: 3,
    streamConstraints: { /* custom constraints */ }
})
```

## Testing

### Running Tests

```bash
# Run cross-browser compatibility tests
npm test tests/cross-browser/audio-capture-compatibility.test.js

# Run integration tests
npm test tests/integration/system-audio-integration.test.js

# Run all audio tests
npm test -- --grep "audio"
```

### Test Coverage

- ✅ Browser capability detection
- ✅ Microphone access with error handling
- ✅ System audio capture with error handling
- ✅ Fallback mechanisms
- ✅ Source switching
- ✅ Automatic reconnection
- ✅ Error message validation
- ✅ UI integration
- ✅ Performance testing

## Demo

A complete demonstration is available in `system-audio-demo.html`:

```bash
# Serve the demo (requires HTTPS for system audio)
python -m http.server 8000 --bind localhost
# or
npx serve .

# Open https://localhost:8000/system-audio-demo.html
```

The demo shows:
- Real-time browser capability detection
- Audio source selection and switching
- Connection status monitoring
- Error handling and user feedback
- Activity logging

## Security Considerations

### HTTPS Requirement

System audio capture requires HTTPS in most browsers:

```javascript
// Check if running on HTTPS
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    console.warn('System audio capture requires HTTPS')
}
```

### Permission Handling

The implementation properly handles permission states:

```javascript
// Check permission status
const permissionStatus = await navigator.permissions.query({name: 'microphone'})
console.log('Microphone permission:', permissionStatus.state)
```

### Privacy Considerations

- System audio capture requires explicit user consent
- Clear indication when system audio is being captured
- Automatic disconnection when user stops sharing
- No persistent storage of audio data

## Performance Optimization

### Stream Monitoring

```javascript
// Efficient stream health checking
setInterval(() => {
    const audioTracks = stream.getAudioTracks()
    const activeCount = audioTracks.filter(track => 
        track.readyState === 'live' && track.enabled
    ).length
    
    if (activeCount === 0) {
        handleStreamEnded()
    }
}, 1000)
```

### Memory Management

```javascript
// Proper cleanup
dispose() {
    // Stop all tracks
    if (this.currentStream) {
        this.currentStream.getTracks().forEach(track => track.stop())
    }
    
    // Disconnect audio nodes
    if (this.sourceNode) {
        this.sourceNode.disconnect()
    }
    
    // Close audio context
    if (this.audioContext) {
        this.audioContext.close()
    }
}
```

## Future Enhancements

### Potential Improvements

1. **Audio Source Selection**: Allow users to select specific audio devices
2. **Audio Routing**: Support for multiple simultaneous audio sources
3. **Advanced Filtering**: Real-time audio processing and filtering
4. **Recording Support**: Optional audio recording capabilities
5. **WebRTC Integration**: Peer-to-peer audio sharing

### Browser API Evolution

Monitor these emerging APIs:
- **Audio Output Devices API**: For output device selection
- **Web Audio API Extensions**: For advanced audio processing
- **MediaStream Recording API**: For audio recording features

## Troubleshooting

### Common Issues

1. **System Audio Not Available**
   - Ensure using Chrome or Edge browser
   - Check "Share system audio" checkbox in permission dialog
   - Verify audio is playing on the system

2. **Permission Denied**
   - Check browser permission settings
   - Ensure HTTPS is used (except localhost)
   - Try refreshing the page and granting permission again

3. **Reconnection Failures**
   - Check network connectivity
   - Verify audio device is still connected
   - Try switching to different audio source

### Debug Information

Enable debug logging:

```javascript
// Enable detailed logging
const audioAnalyzer = new AudioAnalyzer({ debug: true })

// Monitor connection events
audioAnalyzer.setCallbacks({
    onConnectionChange: (connected, source) => {
        console.log(`Connection ${connected ? 'established' : 'lost'}: ${source}`)
    },
    onError: (error) => {
        console.error('Audio error:', error)
    }
})
```

## Conclusion

The system audio capture implementation provides a robust, cross-browser solution for capturing both system audio and microphone input with intelligent fallback handling. The implementation prioritizes user experience with clear error messages, automatic reconnection, and seamless source switching while maintaining high performance and security standards.