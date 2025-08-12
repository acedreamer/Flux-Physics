# 📊 FLUX Performance Guide

## 🎯 Performance Overview

FLUX Physics Playground is designed to maintain **60 FPS** across a wide range of devices while providing rich visual experiences. This guide covers optimization techniques, performance monitoring, and troubleshooting performance issues.

### Performance Targets
| Device Category | Target FPS | Particle Count | Effects Level |
|-----------------|------------|----------------|---------------|
| **High-end Desktop** | 60 FPS | 100-200 | Full |
| **Mid-range Laptop** | 45-60 FPS | 50-100 | Medium |
| **Mobile Device** | 30-45 FPS | 20-50 | Minimal |
| **Older Hardware** | 15-30 FPS | 10-30 | Disabled |

## ⚡ Optimization Techniques

### 1. Adaptive Quality System

FLUX automatically adjusts quality based on performance:

```javascript
// Automatic quality adjustment
const performanceOptimizer = {
  targetFPS: 60,
  minFPS: 30,
  
  adjustQuality() {
    if (this.currentFPS < this.minFPS) {
      // Reduce particle count
      this.reduceParticleCount();
      // Disable expensive effects
      this.disableBloomEffects();
      // Switch to Canvas2D if needed
      this.fallbackToCanvas2D();
    }
  }
};
```

### 2. Rendering Pipeline Optimization

**WebGL Path** (High Performance):
- Hardware-accelerated particle rendering
- Batch processing for multiple particles
- Efficient shader programs
- Texture atlasing for particle sprites

**Canvas2D Path** (Compatibility):
- Software rendering fallback
- Optimized drawing operations
- Reduced particle complexity
- Frame rate limiting

### 3. Memory Management

```javascript
// Object pooling for particles
class ParticlePool {
  constructor(size) {
    this.pool = [];
    this.active = [];
    
    // Pre-allocate particle objects
    for (let i = 0; i < size; i++) {
      this.pool.push(new Particle());
    }
  }
  
  getParticle() {
    return this.pool.pop() || new Particle();
  }
  
  releaseParticle(particle) {
    particle.reset();
    this.pool.push(particle);
  }
}
```

## 📈 Performance Monitoring

### Built-in Performance Tools

```javascript
// Access performance statistics
const stats = window.getPerformanceStats();
console.log({
  fps: stats.frameRate,
  frameTime: stats.frameTime,
  particleCount: stats.particleCount,
  memoryUsage: stats.memoryUsage
});

// Real-time monitoring
setInterval(() => {
  const fps = window.performanceStats.frameRate;
  if (fps < 30) {
    console.warn('Low FPS detected:', fps);
  }
}, 1000);
```

### Browser Performance Tools

**Chrome DevTools**:
1. **Performance Tab** - Record and analyze frame performance
2. **Memory Tab** - Monitor memory usage and leaks
3. **Rendering Tab** - Enable FPS meter and paint flashing

**Firefox Developer Tools**:
1. **Performance Panel** - Analyze JavaScript and rendering performance
2. **Memory Panel** - Track memory allocation and garbage collection

### Performance Metrics

```javascript
// Key performance indicators
const performanceMetrics = {
  // Frame rate (target: 60 FPS)
  fps: performance.now() / frameCount,
  
  // Frame time (target: <16.67ms)
  frameTime: performance.now() - lastFrameTime,
  
  // Memory usage (Chrome only)
  memoryUsage: performance.memory?.usedJSHeapSize,
  
  // Particle update time
  particleUpdateTime: particleEndTime - particleStartTime,
  
  // Render time
  renderTime: renderEndTime - renderStartTime
};
```

## 🔧 Manual Optimization

### Particle Count Optimization

```javascript
// Adjust particle count based on device capability
function optimizeParticleCount() {
  const deviceScore = getDeviceScore();
  
  if (deviceScore > 80) {
    setParticleCount(100);  // High-end device
  } else if (deviceScore > 50) {
    setParticleCount(50);   // Mid-range device
  } else {
    setParticleCount(25);   // Low-end device
  }
}

// Device scoring based on capabilities
function getDeviceScore() {
  let score = 0;
  
  // WebGL support
  if (hasWebGL2()) score += 30;
  else if (hasWebGL()) score += 20;
  
  // Hardware concurrency (CPU cores)
  score += Math.min(navigator.hardwareConcurrency * 5, 25);
  
  // Memory (if available)
  if (performance.memory) {
    const memoryGB = performance.memory.jsHeapSizeLimit / (1024**3);
    score += Math.min(memoryGB * 10, 25);
  }
  
  // Screen resolution
  const pixels = window.screen.width * window.screen.height;
  if (pixels > 2073600) score += 20; // > 1080p
  else if (pixels > 921600) score += 15; // > 720p
  else score += 10;
  
  return Math.min(score, 100);
}
```

### Effect Optimization

```javascript
// Selective effect enabling based on performance
const effectSettings = {
  bloom: {
    enabled: true,
    quality: 'high',    // high, medium, low
    intensity: 1.0
  },
  
  trails: {
    enabled: true,
    length: 10,         // Reduce for better performance
    opacity: 0.8
  },
  
  particles: {
    glow: true,         // Disable on low-end devices
    shadows: false,     // Expensive effect
    antialiasing: true  // Disable for performance
  }
};

// Apply performance-based settings
function applyPerformanceSettings(deviceScore) {
  if (deviceScore < 40) {
    // Low-end device optimizations
    effectSettings.bloom.enabled = false;
    effectSettings.trails.enabled = false;
    effectSettings.particles.glow = false;
    effectSettings.particles.antialiasing = false;
  } else if (deviceScore < 70) {
    // Mid-range device optimizations
    effectSettings.bloom.quality = 'medium';
    effectSettings.trails.length = 5;
    effectSettings.particles.shadows = false;
  }
}
```

## 🚀 Advanced Optimization

### WebGL Optimization

```javascript
// Efficient WebGL rendering
class OptimizedWebGLRenderer {
  constructor(gl) {
    this.gl = gl;
    this.particleBuffer = null;
    this.batchSize = 1000;
    
    // Pre-compile shaders
    this.shaderProgram = this.createShaderProgram();
    
    // Create vertex buffer
    this.initializeBuffers();
  }
  
  render(particles) {
    const gl = this.gl;
    
    // Batch particle data
    const vertexData = this.batchParticleData(particles);
    
    // Single draw call for all particles
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, particles.length * 6);
  }
  
  batchParticleData(particles) {
    // Efficiently pack particle data into vertex buffer
    const data = new Float32Array(particles.length * 24); // 6 vertices * 4 components
    
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      const offset = i * 24;
      
      // Pack position, color, and size data
      this.packParticleVertex(data, offset, particle);
    }
    
    return data;
  }
}
```

### Audio Processing Optimization

```javascript
// Optimized audio analysis
class OptimizedAudioAnalyzer {
  constructor() {
    this.fftSize = 1024;        // Smaller FFT for better performance
    this.smoothingConstant = 0.8;
    this.frequencyBins = 32;    // Reduced bins for efficiency
    
    // Pre-allocate arrays
    this.frequencyData = new Uint8Array(this.frequencyBins);
    this.previousData = new Uint8Array(this.frequencyBins);
  }
  
  analyze(audioContext, source) {
    // Efficient frequency analysis
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = this.fftSize;
    analyzer.smoothingTimeConstant = this.smoothingConstant;
    
    source.connect(analyzer);
    
    // Get frequency data
    analyzer.getByteFrequencyData(this.frequencyData);
    
    // Apply smoothing for stable visuals
    for (let i = 0; i < this.frequencyBins; i++) {
      this.frequencyData[i] = Math.max(
        this.frequencyData[i],
        this.previousData[i] * 0.9
      );
    }
    
    // Store for next frame
    this.previousData.set(this.frequencyData);
    
    return this.frequencyData;
  }
}
```

## 📱 Mobile Optimization

### Mobile-Specific Settings

```javascript
// Detect mobile devices
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

// Apply mobile optimizations
if (isMobileDevice()) {
  const mobileSettings = {
    particleCount: 20,
    bloomEnabled: false,
    trailsEnabled: false,
    audioFFTSize: 512,
    renderScale: 0.8,        // Render at lower resolution
    targetFPS: 30            // Lower target FPS
  };
  
  applySettings(mobileSettings);
}
```

### Touch Performance

```javascript
// Optimized touch handling
class TouchHandler {
  constructor() {
    this.touchPoints = new Map();
    this.lastUpdate = 0;
    this.updateThrottle = 16; // ~60 FPS
  }
  
  handleTouch(event) {
    const now = performance.now();
    
    // Throttle touch updates
    if (now - this.lastUpdate < this.updateThrottle) {
      return;
    }
    
    // Process touch points efficiently
    for (const touch of event.touches) {
      this.updateParticleInfluence(touch.clientX, touch.clientY);
    }
    
    this.lastUpdate = now;
  }
}
```

## 🔍 Performance Debugging

### Identifying Bottlenecks

```javascript
// Performance profiling
class PerformanceProfiler {
  constructor() {
    this.timings = {};
  }
  
  startTiming(label) {
    this.timings[label] = performance.now();
  }
  
  endTiming(label) {
    const duration = performance.now() - this.timings[label];
    console.log(`${label}: ${duration.toFixed(2)}ms`);
    return duration;
  }
  
  profileFrame() {
    this.startTiming('total');
    
    this.startTiming('physics');
    updatePhysics();
    this.endTiming('physics');
    
    this.startTiming('audio');
    processAudio();
    this.endTiming('audio');
    
    this.startTiming('render');
    renderFrame();
    this.endTiming('render');
    
    this.endTiming('total');
  }
}
```

### Memory Leak Detection

```javascript
// Monitor memory usage
function monitorMemory() {
  if (!performance.memory) return;
  
  const memoryInfo = {
    used: performance.memory.usedJSHeapSize,
    total: performance.memory.totalJSHeapSize,
    limit: performance.memory.jsHeapSizeLimit
  };
  
  // Check for memory leaks
  if (memoryInfo.used > memoryInfo.limit * 0.9) {
    console.warn('High memory usage detected:', memoryInfo);
    
    // Trigger garbage collection (Chrome only)
    if (window.gc) {
      window.gc();
    }
  }
  
  return memoryInfo;
}
```

## ⚙️ Configuration Recommendations

### High-Performance Setup
```javascript
const highPerformanceConfig = {
  particleCount: 100,
  renderMode: 'webgl',
  bloomEnabled: true,
  bloomQuality: 'high',
  trailsEnabled: true,
  trailLength: 10,
  audioFFTSize: 2048,
  audioSmoothingConstant: 0.8,
  targetFPS: 60
};
```

### Balanced Setup
```javascript
const balancedConfig = {
  particleCount: 50,
  renderMode: 'webgl',
  bloomEnabled: true,
  bloomQuality: 'medium',
  trailsEnabled: true,
  trailLength: 5,
  audioFFTSize: 1024,
  audioSmoothingConstant: 0.85,
  targetFPS: 45
};
```

### Performance Setup
```javascript
const performanceConfig = {
  particleCount: 25,
  renderMode: 'canvas2d',
  bloomEnabled: false,
  trailsEnabled: false,
  audioFFTSize: 512,
  audioSmoothingConstant: 0.9,
  targetFPS: 30
};
```

## 🎛️ User Controls

### Performance Settings UI

Users can adjust performance through the settings panel:

- **Particle Count Slider** - Direct control over particle density
- **Quality Preset Buttons** - High/Medium/Low quality presets
- **Effect Toggles** - Enable/disable individual effects
- **Auto-Optimize Button** - Automatic performance optimization

### Console Commands

```javascript
// Performance control commands
window.setQuality('high');           // Set quality preset
window.setParticleCount(50);         // Set particle count
window.toggleBloom(false);           // Disable bloom effect
window.optimizeRenderLoop();         // Auto-optimize rendering
window.getPerformanceReport();       // Get detailed performance report
```

---

**Optimize your FLUX experience!** ⚡

For implementation details, see the [Developer Guide](./DEVELOPER_GUIDE.md)
For troubleshooting performance issues, check the [Troubleshooting Guide](./TROUBLESHOOTING.md)