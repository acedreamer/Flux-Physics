# 🐛 FLUX Troubleshooting Guide

## 🚨 Common Issues & Quick Fixes

### 🖥️ Display & Rendering Issues

#### Black Screen / Nothing Visible
**Symptoms**: Page loads but shows only black canvas

**Quick Fixes**:
1. **Refresh the page** (Ctrl+F5 or Cmd+Shift+R)
2. **Check browser console** (F12 → Console tab)
3. **Try a different browser** (Chrome recommended)
4. **Disable browser extensions** temporarily

**Advanced Solutions**:
```javascript
// Check WebGL support
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
console.log('WebGL supported:', !!gl);

// Force Canvas2D fallback
localStorage.setItem('flux-force-canvas2d', 'true');
// Then refresh the page
```

#### Particles Not Moving
**Symptoms**: Particles visible but static/frozen

**Quick Fixes**:
1. **Move mouse over canvas** to trigger interaction
2. **Check if paused** - press `R` to reset
3. **Verify JavaScript is enabled** in browser
4. **Clear browser cache** and reload

**Debug Commands**:
```javascript
// Open browser console (F12) and try:
window.app.render();           // Manual render
window.resetSimulation();      // Reset physics
window.validatePositions();    // Check particle data
```

#### Poor Performance / Lag
**Symptoms**: Low frame rate, stuttering animation

**Immediate Fixes**:
1. **Close other browser tabs**
2. **Disable browser extensions**
3. **Lower particle count** in settings
4. **Switch to Canvas2D mode** if using WebGL

**Performance Optimization**:
```javascript
// Reduce particle count
window.setParticleCount(25);

// Disable expensive effects
window.toggleBloom(false);

// Check current performance
window.getPerformanceStats();
```

### 🎵 Audio Issues

#### Audio Not Detected
**Symptoms**: Music playing but particles don't react

**Chrome/Edge Solutions**:
1. **Verify "Share audio" was checked** during setup
2. **Ensure music tab is actually playing** audio
3. **Try different music source** (YouTube, Spotify, etc.)
4. **Re-enable audio** - click 🎵 button again

**Firefox/Safari Solutions**:
1. **Check microphone permissions** in browser settings
2. **Increase music volume** for better detection
3. **Position speakers near microphone**
4. **Try using headphones** instead of speakers

**Debug Audio**:
```javascript
// Check audio capture status
console.log('Audio active:', window.audioCapture?.isActive);

// Test audio data
window.audioCapture?.getFrequencyData();

// Reset audio system
window.toggleAudioMode(false);
window.toggleAudioMode(true);
```

#### Audio Permission Denied
**Symptoms**: Browser blocks audio access

**Solutions**:
1. **Click the 🔒 icon** in address bar → Allow audio
2. **Try incognito/private mode**
3. **Clear site permissions** and try again
4. **Restart browser** and retry setup

**Manual Permission Reset**:
```
Chrome: Settings → Privacy → Site Settings → Microphone
Firefox: Settings → Privacy → Permissions → Microphone
Safari: Preferences → Websites → Microphone
```

#### Laggy Audio Response
**Symptoms**: Particles respond slowly to music changes

**Quick Fixes**:
1. **Use wired audio** instead of Bluetooth
2. **Close audio-heavy applications**
3. **Lower audio sensitivity** in settings
4. **Reduce particle count** for better performance

### 🖱️ Control Issues

#### Settings Panel Won't Open
**Symptoms**: Clicking ⚙️ button does nothing

**Solutions**:
1. **Try keyboard shortcut** - press `S`
2. **Check for JavaScript errors** in console (F12)
3. **Disable ad blockers** temporarily
4. **Refresh page** and try again

**Force Panel Open**:
```javascript
// Open console (F12) and run:
window.togglePanel();
document.getElementById('side-panel').classList.add('open');
```

#### Keyboard Shortcuts Not Working
**Symptoms**: Pressing H, S, R, etc. has no effect

**Solutions**:
1. **Click on canvas first** to focus the page
2. **Check if another element has focus**
3. **Disable browser extensions** that might intercept keys
4. **Try different keyboard** if using external one

**Test Shortcuts**:
```javascript
// Manually trigger shortcuts
window.toggleUI();        // H key
window.togglePanel();     // S key  
window.resetSystem();     // R key
window.showSystemInfo();  // I key
```

#### Mouse Interaction Not Working
**Symptoms**: Moving mouse doesn't affect particles

**Solutions**:
1. **Ensure mouse is over canvas area**
2. **Check if fullscreen mode is active** (press F to exit)
3. **Verify particles are actually moving** (they might be paused)
4. **Try touch interaction** on mobile devices

### 🌐 Browser-Specific Issues

#### Chrome Issues
**WebGL Context Lost**:
```javascript
// Check for context loss
const canvas = document.getElementById('canvas');
canvas.addEventListener('webglcontextlost', (e) => {
  console.log('WebGL context lost');
  e.preventDefault();
});

// Force context restoration
canvas.addEventListener('webglcontextrestored', () => {
  console.log('WebGL context restored');
  window.location.reload();
});
```

**Memory Issues**:
- **Close other tabs** with heavy content
- **Disable Chrome extensions** temporarily
- **Restart Chrome** if memory usage is high

#### Firefox Issues
**Audio Limitations**:
- **System audio not supported** - use microphone only
- **Lower audio quality** compared to Chrome
- **May require manual permission** for each session

**Performance**:
- **WebGL performance** may be lower than Chrome
- **Try Canvas2D mode** for better compatibility
- **Update Firefox** to latest version

#### Safari Issues
**iOS Limitations**:
- **No system audio support** - microphone only
- **Requires user interaction** to start audio
- **Performance limitations** on older devices

**macOS Safari**:
- **Enable WebGL** in Develop menu if disabled
- **Allow autoplay** for better experience
- **Update to latest Safari** version

### 📱 Mobile Issues

#### Touch Controls Not Responsive
**Solutions**:
1. **Use single finger** for interaction
2. **Ensure screen is clean** and responsive
3. **Try different touch gestures**
4. **Restart mobile browser**

#### Poor Mobile Performance
**Optimization**:
```javascript
// Mobile-optimized settings
window.setParticleCount(20);     // Fewer particles
window.setQuality('mobile');     // Lower quality mode
window.toggleBloom(false);       // Disable effects
```

#### Mobile Audio Issues
**iOS**:
- **Tap screen first** to enable audio context
- **Use headphones** to avoid feedback
- **Grant microphone permission** when prompted

**Android**:
- **Check app permissions** in system settings
- **Try Chrome browser** for best compatibility
- **Ensure microphone isn't used** by other apps

## 🔧 Advanced Troubleshooting

### Debug Mode
**Enable Debug Mode**:
```javascript
// Open browser console (F12) and run:
window.DEBUG_MODE = true;

// Available debug commands:
window.diagnoseSliders();      // Test UI controls
window.debugBloom();           // Check visual effects  
window.testSliders();          // Test all sliders
window.getPerformanceStats();  // Performance metrics
window.validatePositions();    // Check particle physics
```

### Performance Profiling
**Monitor Performance**:
```javascript
// Check frame rate
setInterval(() => {
  console.log('FPS:', window.performanceStats?.frameRate);
}, 1000);

// Memory usage (Chrome only)
if (performance.memory) {
  console.log('Memory:', {
    used: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
    total: Math.round(performance.memory.totalJSHeapSize / 1048576) + 'MB'
  });
}
```

### Network Issues
**Slow Loading**:
1. **Check internet connection** speed
2. **Try different CDN** if available
3. **Clear browser cache** completely
4. **Disable VPN** temporarily

**CORS Errors**:
- **Use HTTPS** instead of HTTP when possible
- **Run local server** for development
- **Check browser console** for specific CORS messages

### System Requirements

#### Minimum Requirements
- **Browser**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **RAM**: 2GB available memory
- **CPU**: Dual-core processor
- **GPU**: Basic WebGL support

#### Recommended Requirements
- **Browser**: Latest Chrome or Edge
- **RAM**: 4GB+ available memory
- **CPU**: Quad-core processor
- **GPU**: Dedicated graphics card with WebGL 2.0

#### Performance Expectations
| Device Type | Expected FPS | Particle Count | Effects |
|-------------|--------------|----------------|---------|
| High-end Desktop | 60 FPS | 100+ | Full |
| Mid-range Laptop | 45-60 FPS | 50-75 | Medium |
| Mobile Device | 30-45 FPS | 20-40 | Minimal |
| Older Hardware | 15-30 FPS | 10-25 | Disabled |

## 🆘 Getting Help

### Self-Diagnosis Steps
1. **Check browser console** (F12) for error messages
2. **Try different browser** (Chrome recommended)
3. **Test on different device** if available
4. **Disable all extensions** temporarily
5. **Clear cache and cookies** completely

### Reporting Issues
**Include This Information**:
- **Browser name and version**
- **Operating system**
- **Device specifications** (CPU, RAM, GPU)
- **Console error messages** (F12 → Console)
- **Steps to reproduce** the issue
- **Expected vs actual behavior**

**Where to Report**:
- **GitHub Issues**: [Project Repository](https://github.com/acedreamer/Flux-Physics/issues)
- **Include screenshots** or screen recordings if helpful
- **Provide console logs** for technical issues

### Emergency Fixes

#### Complete Reset
```javascript
// Nuclear option - reset everything
localStorage.clear();
sessionStorage.clear();
window.location.reload(true);
```

#### Safe Mode
```javascript
// Minimal functionality mode
localStorage.setItem('flux-safe-mode', 'true');
window.location.reload();
```

#### Fallback Mode
```javascript
// Force basic Canvas2D rendering
localStorage.setItem('flux-force-canvas2d', 'true');
localStorage.setItem('flux-disable-audio', 'true');
window.location.reload();
```

---

**Still having issues?** 🤔

- Check the [User Guide](./USER_GUIDE.md) for basic usage
- See the [Developer Guide](./DEVELOPER_GUIDE.md) for technical details
- Visit the [Audio Setup Guide](./AUDIO_SETUP.md) for audio-specific help

**Remember**: Most issues can be resolved by refreshing the page or trying a different browser! 🔄