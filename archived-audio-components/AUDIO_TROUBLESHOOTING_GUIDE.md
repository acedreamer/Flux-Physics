# FLUX Audio Reactive - Troubleshooting Guide

## Common Issues and Solutions

### Audio Not Working

#### Issue: No audio response when music is playing

**Symptoms:**
- Audio button shows "ACTIVE" but particles don't respond
- Level visualizer shows no activity
- Info panel shows 0% audio level

**Solutions:**

1. **Check Audio Source**
   ```javascript
   // Debug in browser console
   console.log(fluxApp.audioState)
   console.log('Audio enabled:', fluxApp.audioReactiveEnabled)
   ```

2. **Verify Browser Permissions**
   - Look for microphone/audio icons in address bar
   - Click and ensure permissions are granted
   - Try refreshing the page after granting permissions

3. **Test Different Audio Sources**
   - If system audio isn't working, try microphone
   - Play music near microphone as a test
   - Check if other applications can access audio

4. **Browser-Specific Fixes**
   - **Chrome/Edge**: Preferred browsers, best compatibility
   - **Firefox**: Limited system audio support, use microphone
   - **Safari**: Limited Web Audio API support, may not work

#### Issue: System audio capture fails

**Symptoms:**
- "Share system audio" option not available
- Falls back to microphone automatically
- Error messages about audio capture

**Solutions:**

1. **Use Supported Browser**
   - Chrome (recommended)
   - Edge (recommended)
   - Firefox (limited support)

2. **Enable System Audio Sharing**
   - When prompted, check "Share system audio"
   - Select the correct audio output device
   - Ensure audio is actually playing on the system

3. **Check Audio Output**
   ```javascript
   // Test if audio is playing
   navigator.mediaDevices.enumerateDevices().then(devices => {
       console.log('Available devices:', devices.filter(d => d.kind === 'audiooutput'))
   })
   ```

4. **Fallback to Microphone**
   - If system audio fails, microphone will be used automatically
   - Play music through speakers for microphone to pick up
   - Adjust volume to avoid feedback

### Performance Issues

#### Issue: Low frame rate or stuttering

**Symptoms:**
- Particles move jerkily
- Audio response is delayed
- Browser becomes unresponsive

**Solutions:**

1. **Check Performance Stats**
   ```javascript
   // Monitor performance in console
   fluxApp.audioAnalyzer.getPerformanceStats().then(stats => {
       console.log('Performance:', stats)
   })
   ```

2. **Reduce Browser Load**
   - Close unnecessary tabs
   - Disable browser extensions
   - Close other applications using audio

3. **Adjust Quality Settings**
   - The system automatically reduces quality under load
   - Manually reduce particle count if needed
   - Lower audio sensitivity to reduce processing

4. **Hardware Considerations**
   - Ensure adequate CPU/GPU resources
   - Close resource-intensive applications
   - Use wired headphones to reduce audio processing load

#### Issue: High CPU usage

**Symptoms:**
- Fan noise increases
- Other applications slow down
- Browser shows high CPU usage

**Solutions:**

1. **Enable Adaptive Quality**
   ```javascript
   // Check if adaptive quality is working
   console.log('Performance monitor:', fluxApp.audioAnalyzer.performanceMonitor.stats)
   ```

2. **Use Web Workers**
   - Ensure Web Workers are enabled (default)
   - Check worker status in console
   - Fallback to main thread if workers fail

3. **Optimize Settings**
   - Reduce FFT size (automatic under load)
   - Disable advanced analysis features
   - Lower update frequency

### Visual Issues

#### Issue: No visual effects despite audio detection

**Symptoms:**
- Audio levels show activity
- Beat detection works
- Particles don't change color or behavior

**Solutions:**

1. **Check Audio Effects**
   ```javascript
   // Verify effects are processing
   console.log('Audio effects enabled:', fluxApp.audioEffects)
   console.log('Last audio data:', fluxApp.audioState.lastAudioData)
   ```

2. **Verify Particle Renderer**
   ```javascript
   // Check if audio-reactive rendering is enabled
   console.log('Audio reactive enabled:', fluxApp.particleRenderer.audioReactiveEnabled)
   ```

3. **Test Different Modes**
   - Try switching between visualization modes
   - Use "Pulse" mode for most obvious effects
   - Increase sensitivity for subtle audio

4. **Check Audio Levels**
   - Ensure audio is loud enough (50-80% volume)
   - Look for "low audio" warnings
   - Test with music that has clear bass and treble

#### Issue: Overwhelming or chaotic visuals

**Symptoms:**
- Effects are too intense
- Particles move erratically
- Colors change too rapidly

**Solutions:**

1. **Reduce Sensitivity**
   ```javascript
   // Lower sensitivity
   fluxApp.setAudioSensitivity(0.5) // Default is 1.0
   ```

2. **Switch to Calmer Mode**
   ```javascript
   // Use ambient mode for subtle effects
   fluxApp.setAudioMode('ambient')
   ```

3. **Adjust Smoothing**
   - Increase smoothing factor for more stable visuals
   - Reduce frequency weights for specific ranges

4. **Music Selection**
   - Use music with less extreme frequency content
   - Avoid heavily compressed or distorted audio
   - Classical or ambient music works well with subtle settings

### Browser Compatibility Issues

#### Issue: Features not working in specific browsers

**Browser-Specific Problems:**

**Firefox:**
- System audio capture not supported
- Limited Web Audio API features
- Microphone works, but with reduced functionality

**Safari:**
- Web Audio API has limitations
- getUserMedia requires user interaction
- Some filters may not work properly

**Mobile Browsers:**
- Limited audio processing capabilities
- Battery usage concerns
- Touch interaction required for audio context

**Solutions:**

1. **Use Recommended Browsers**
   - Chrome (best compatibility)
   - Edge (full feature support)
   - Avoid Safari and mobile browsers for full experience

2. **Feature Detection**
   ```javascript
   // Check browser capabilities
   const capabilities = {
       webAudio: !!(window.AudioContext || window.webkitAudioContext),
       getUserMedia: !!(navigator.mediaDevices?.getUserMedia),
       getDisplayMedia: !!(navigator.mediaDevices?.getDisplayMedia)
   }
   console.log('Browser capabilities:', capabilities)
   ```

3. **Graceful Degradation**
   - System automatically disables unsupported features
   - Fallback to basic functionality when needed
   - Clear error messages for unsupported browsers

### Audio Permission Issues

#### Issue: Microphone access denied

**Symptoms:**
- Permission dialog doesn't appear
- "Permission denied" error messages
- Audio button shows error state

**Solutions:**

1. **Manual Permission Grant**
   - Click lock icon in address bar
   - Set microphone to "Allow"
   - Refresh page and try again

2. **Clear Browser Data**
   - Clear site data and permissions
   - Restart browser
   - Try again with fresh permissions

3. **Check System Settings**
   - Ensure microphone is not disabled system-wide
   - Check privacy settings (Windows/Mac)
   - Verify microphone is working in other applications

4. **Alternative Approaches**
   ```javascript
   // Test microphone access directly
   navigator.mediaDevices.getUserMedia({ audio: true })
       .then(stream => console.log('Microphone access granted'))
       .catch(error => console.error('Microphone access denied:', error))
   ```

### Advanced Debugging

#### Debug Console Commands

```javascript
// Audio system status
window.getAudioState()

// Performance monitoring
window.audioDebug = {
    performance: () => fluxApp.audioAnalyzer.getPerformanceStats(),
    benchmark: () => fluxApp.audioAnalyzer.runPerformanceBenchmark(),
    reset: () => fluxApp.resetAudioSettings(),
    test: (mode) => fluxApp.setAudioMode(mode)
}

// Force enable debug mode
fluxApp.audioAnalyzer.performanceMonitor.enableDebugMode()
```

#### Performance Profiling

```javascript
// Monitor frame times
let frameCount = 0
let totalTime = 0

function profilePerformance() {
    const start = performance.now()
    
    // Your render loop here
    fluxApp.render()
    
    const end = performance.now()
    const frameTime = end - start
    
    frameCount++
    totalTime += frameTime
    
    if (frameCount % 60 === 0) {
        console.log(`Average frame time: ${(totalTime / frameCount).toFixed(2)}ms`)
        console.log(`FPS: ${(1000 / (totalTime / frameCount)).toFixed(1)}`)
    }
}
```

#### Memory Usage Monitoring

```javascript
// Monitor memory usage
function monitorMemory() {
    if (performance.memory) {
        const memory = performance.memory
        console.log({
            used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
            total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
            limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
        })
    }
}

// Run every 5 seconds
setInterval(monitorMemory, 5000)
```

## Error Messages and Solutions

### "Web Audio API not supported"
- **Cause**: Browser doesn't support Web Audio API
- **Solution**: Use Chrome, Edge, or Firefox
- **Fallback**: None available, audio features disabled

### "Microphone access denied"
- **Cause**: User denied microphone permission
- **Solution**: Grant permission in browser settings
- **Fallback**: Audio features unavailable

### "System audio capture failed"
- **Cause**: Browser doesn't support getDisplayMedia with audio
- **Solution**: Use Chrome or Edge, check "Share system audio"
- **Fallback**: Automatically switches to microphone

### "Audio analysis taking too long"
- **Cause**: Performance issues, CPU overload
- **Solution**: Close other applications, reduce browser load
- **Fallback**: Automatic quality reduction

### "No audio detected"
- **Cause**: Audio level too low or no audio playing
- **Solution**: Increase volume, check audio source
- **Fallback**: Visual effects remain minimal

### "Beat detection confidence low"
- **Cause**: Audio doesn't have clear rhythmic content
- **Solution**: Use music with clear beats, adjust sensitivity
- **Fallback**: Reduced beat-based effects

## Recovery Procedures

### Complete Audio System Reset

```javascript
// Full reset procedure
async function resetAudioSystem() {
    // 1. Disable current audio mode
    await fluxApp.toggleAudioMode(false)
    
    // 2. Clear audio state
    fluxApp.audioState = {
        isEnabled: false,
        isInitializing: false,
        currentMode: 'reactive',
        sensitivity: 1.0,
        lastAudioData: null,
        lastBeatData: null
    }
    
    // 3. Dispose audio components
    if (fluxApp.audioAnalyzer) {
        fluxApp.audioAnalyzer.dispose()
        fluxApp.audioAnalyzer = null
    }
    
    // 4. Reinitialize
    fluxApp.setupAudioReactiveMode()
    
    console.log('Audio system reset complete')
}
```

### Emergency Fallback Mode

```javascript
// Minimal audio mode for compatibility
function enableFallbackMode() {
    // Disable advanced features
    const fallbackConfig = {
        fftSize: 512,
        smoothingTimeConstant: 0.9,
        useWebWorker: false,
        adaptiveQualityEnabled: false,
        advancedAnalysisEnabled: false
    }
    
    // Reinitialize with minimal settings
    fluxApp.audioAnalyzer = new AudioAnalyzer(fallbackConfig)
    
    console.log('Fallback mode enabled')
}
```

## Prevention Tips

### Best Practices for Stable Operation

1. **Browser Selection**
   - Use Chrome or Edge for best results
   - Keep browser updated
   - Avoid beta or experimental versions

2. **System Configuration**
   - Ensure adequate system resources
   - Close unnecessary applications
   - Use wired audio devices when possible

3. **Audio Setup**
   - Test audio sources before use
   - Use moderate volume levels (50-80%)
   - Avoid audio feedback loops

4. **Performance Monitoring**
   - Monitor frame rates regularly
   - Watch for memory leaks
   - Check CPU usage during operation

5. **Graceful Degradation**
   - Always provide fallback options
   - Handle errors gracefully
   - Inform users of limitations

## Getting Help

### Information to Provide When Reporting Issues

1. **Browser Information**
   ```javascript
   console.log('User Agent:', navigator.userAgent)
   console.log('Audio Context:', window.AudioContext ? 'Supported' : 'Not supported')
   ```

2. **System Information**
   ```javascript
   console.log('Platform:', navigator.platform)
   console.log('Hardware Concurrency:', navigator.hardwareConcurrency)
   console.log('Memory:', performance.memory)
   ```

3. **Audio State**
   ```javascript
   console.log('Audio State:', fluxApp.audioState)
   console.log('Performance Stats:', await fluxApp.audioAnalyzer.getPerformanceStats())
   ```

4. **Error Messages**
   - Copy exact error messages from console
   - Include stack traces if available
   - Note when the error occurs

### Support Resources

- **Console Debugging**: Use F12 developer tools
- **Performance Profiling**: Chrome DevTools Performance tab
- **Audio Analysis**: Use built-in debug commands
- **Community Support**: Check documentation and examples

---

*FLUX Audio Reactive Troubleshooting Guide - Resolve issues and optimize performance*