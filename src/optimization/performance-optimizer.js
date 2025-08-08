/**
 * Advanced Performance Optimizer
 * Monitors and optimizes rendering performance in real-time
 */

export class PerformanceOptimizer {
  constructor(fluxApp) {
    this.fluxApp = fluxApp;
    this.enabled = true;
    
    // Performance metrics
    this.metrics = {
      fps: 60,
      frameTime: 16.67,
      frameTimeHistory: [],
      maxHistoryLength: 120, // 2 seconds at 60fps
      
      // Targets
      targetFPS: 60,
      minAcceptableFPS: 45,
      maxAcceptableFrameTime: 22, // ~45fps
      
      // Optimization state
      lastOptimization: 0,
      optimizationCooldown: 3000, // 3 seconds
      adaptiveQuality: 1.0,
      
      // Feature toggles for performance
      trailsEnabled: true,
      backgroundEffectsEnabled: true,
      bloomEnabled: true,
      particleCount: 800,
      
      // Quality levels
      qualityLevels: {
        ultra: { particles: 1500, trails: true, background: true, bloom: 2.0 },
        high: { particles: 1000, trails: true, background: true, bloom: 1.5 },
        medium: { particles: 600, trails: true, background: false, bloom: 1.0 },
        low: { particles: 300, trails: false, background: false, bloom: 0.5 },
        potato: { particles: 150, trails: false, background: false, bloom: 0.0 }
      }
    };
    
    this.currentQuality = 'high';
    this.autoOptimize = true;
    
    this.initializeMonitoring();
  }

  initializeMonitoring() {
    // Create performance display
    this.createPerformanceDisplay();
    
    // Start monitoring loop
    this.startMonitoring();
    
    console.log('🚀 Performance optimizer initialized');
  }

  createPerformanceDisplay() {
    const display = document.createElement('div');
    display.id = 'performance-display';
    display.innerHTML = `
      <div class="perf-header">⚡ Performance</div>
      <div class="perf-metric">FPS: <span id="fps-value">60</span></div>
      <div class="perf-metric">Frame: <span id="frame-time">16.7ms</span></div>
      <div class="perf-metric">Quality: <span id="quality-level">High</span></div>
      <div class="perf-metric">Particles: <span id="particle-count">800</span></div>
      <div class="perf-bar">
        <div class="perf-bar-fill" id="perf-bar-fill"></div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #performance-display {
        position: fixed;
        top: 20px;
        left: 20px;
        background: rgba(0, 0, 0, 0.8);
        border: 1px solid #00ffff;
        border-radius: 8px;
        padding: 12px;
        color: #00ffff;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        z-index: 1000;
        min-width: 120px;
        backdrop-filter: blur(5px);
      }

      .perf-header {
        font-weight: bold;
        margin-bottom: 8px;
        text-align: center;
        color: #ffffff;
        text-shadow: 0 0 5px #00ffff;
      }

      .perf-metric {
        margin-bottom: 4px;
        display: flex;
        justify-content: space-between;
      }

      .perf-bar {
        margin-top: 8px;
        height: 4px;
        background: #333;
        border-radius: 2px;
        overflow: hidden;
      }

      .perf-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #ff0000, #ffff00, #00ff00);
        transition: width 0.3s ease;
        width: 100%;
      }

      #performance-display.warning {
        border-color: #ffaa00;
        color: #ffaa00;
      }

      #performance-display.critical {
        border-color: #ff0000;
        color: #ff0000;
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(display);

    this.performanceDisplay = display;
  }

  startMonitoring() {
    let lastTime = performance.now();
    let frameCount = 0;
    
    const monitor = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      
      // Update frame time history
      this.metrics.frameTimeHistory.push(deltaTime);
      if (this.metrics.frameTimeHistory.length > this.metrics.maxHistoryLength) {
        this.metrics.frameTimeHistory.shift();
      }
      
      frameCount++;
      
      // Calculate FPS every second
      if (frameCount >= 60) {
        const avgFrameTime = this.metrics.frameTimeHistory.reduce((a, b) => a + b, 0) / 
                            this.metrics.frameTimeHistory.length;
        
        this.metrics.frameTime = avgFrameTime;
        this.metrics.fps = 1000 / avgFrameTime;
        
        this.updateDisplay();
        
        // Auto-optimize if enabled
        if (this.autoOptimize) {
          this.checkAndOptimize();
        }
        
        frameCount = 0;
      }
      
      lastTime = currentTime;
      requestAnimationFrame(monitor);
    };
    
    monitor();
  }

  updateDisplay() {
    if (!this.performanceDisplay) return;

    const fps = Math.round(this.metrics.fps);
    const frameTime = this.metrics.frameTime.toFixed(1);
    
    document.getElementById('fps-value').textContent = fps;
    document.getElementById('frame-time').textContent = `${frameTime}ms`;
    document.getElementById('quality-level').textContent = this.currentQuality;
    document.getElementById('particle-count').textContent = this.metrics.particleCount;
    
    // Update performance bar
    const perfRatio = Math.min(1, fps / this.metrics.targetFPS);
    const barFill = document.getElementById('perf-bar-fill');
    barFill.style.width = `${perfRatio * 100}%`;
    
    // Update display color based on performance
    this.performanceDisplay.className = '';
    if (fps < 30) {
      this.performanceDisplay.classList.add('critical');
    } else if (fps < 45) {
      this.performanceDisplay.classList.add('warning');
    }
  }

  checkAndOptimize() {
    const now = performance.now();
    if (now - this.metrics.lastOptimization < this.metrics.optimizationCooldown) {
      return; // Still in cooldown
    }

    const avgFPS = this.metrics.fps;
    const currentQualityIndex = Object.keys(this.metrics.qualityLevels).indexOf(this.currentQuality);
    
    // Performance is poor - reduce quality
    if (avgFPS < this.metrics.minAcceptableFPS && currentQualityIndex < 4) {
      const newQuality = Object.keys(this.metrics.qualityLevels)[currentQualityIndex + 1];
      this.setQualityLevel(newQuality);
      this.metrics.lastOptimization = now;
      console.log(`🔽 Performance optimization: Reduced quality to ${newQuality} (FPS: ${avgFPS.toFixed(1)})`);
    }
    // Performance is good - try to increase quality
    else if (avgFPS > this.metrics.targetFPS * 0.9 && currentQualityIndex > 0) {
      const newQuality = Object.keys(this.metrics.qualityLevels)[currentQualityIndex - 1];
      this.setQualityLevel(newQuality);
      this.metrics.lastOptimization = now;
      console.log(`🔼 Performance optimization: Increased quality to ${newQuality} (FPS: ${avgFPS.toFixed(1)})`);
    }
  }

  setQualityLevel(quality) {
    if (!this.metrics.qualityLevels[quality]) {
      console.warn(`Unknown quality level: ${quality}`);
      return;
    }

    const settings = this.metrics.qualityLevels[quality];
    this.currentQuality = quality;
    
    // Apply particle count
    if (this.fluxApp.setParticleCount) {
      this.fluxApp.setParticleCount(settings.particles);
      this.metrics.particleCount = settings.particles;
    }
    
    // Apply bloom settings
    if (this.fluxApp.particleRenderer && this.fluxApp.particleRenderer.updateBloomIntensity) {
      this.fluxApp.particleRenderer.updateBloomIntensity(settings.bloom);
    }
    
    // Apply trail settings
    if (this.fluxApp.trailSystem) {
      if (settings.trails) {
        this.fluxApp.trailSystem.enabled = true;
      } else {
        this.fluxApp.trailSystem.enabled = false;
      }
    }
    
    // Apply background effects
    if (this.fluxApp.backgroundEffects) {
      if (settings.background) {
        this.fluxApp.backgroundEffects.enabled = true;
        this.fluxApp.backgroundEffects.setIntensity(0.5);
      } else {
        this.fluxApp.backgroundEffects.enabled = false;
      }
    }
    
    console.log(`🎯 Quality level set to: ${quality}`, settings);
  }

  // Manual optimization controls
  optimizeForPerformance() {
    this.setQualityLevel('low');
    console.log('🚀 Optimized for maximum performance');
  }

  optimizeForVisuals() {
    this.setQualityLevel('ultra');
    console.log('✨ Optimized for maximum visual quality');
  }

  setAutoOptimize(enabled) {
    this.autoOptimize = enabled;
    console.log(`Auto-optimization ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Adaptive quality based on device capabilities
  detectDeviceCapabilities() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    const capabilities = {
      webgl: !!gl,
      maxTextureSize: gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 0,
      devicePixelRatio: window.devicePixelRatio || 1,
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
      memory: navigator.deviceMemory || 4
    };
    
    // Determine recommended quality based on capabilities
    let recommendedQuality = 'medium';
    
    if (capabilities.memory >= 8 && capabilities.hardwareConcurrency >= 8) {
      recommendedQuality = 'ultra';
    } else if (capabilities.memory >= 4 && capabilities.hardwareConcurrency >= 4) {
      recommendedQuality = 'high';
    } else if (capabilities.memory >= 2) {
      recommendedQuality = 'medium';
    } else {
      recommendedQuality = 'low';
    }
    
    console.log('🔍 Device capabilities detected:', capabilities);
    console.log(`💡 Recommended quality: ${recommendedQuality}`);
    
    return { capabilities, recommendedQuality };
  }

  // Smooth frame rate targeting
  enableAdaptiveFrameRate() {
    let targetFrameTime = 1000 / 60; // 60 FPS target
    
    const adaptiveRender = (currentTime) => {
      const actualFrameTime = this.metrics.frameTime;
      
      // Adjust target based on performance
      if (actualFrameTime > targetFrameTime * 1.2) {
        targetFrameTime = Math.min(1000 / 30, targetFrameTime * 1.05); // Reduce target FPS
      } else if (actualFrameTime < targetFrameTime * 0.8) {
        targetFrameTime = Math.max(1000 / 60, targetFrameTime * 0.95); // Increase target FPS
      }
      
      // Apply frame rate limiting if needed
      const timeSinceLastFrame = currentTime - (this.lastFrameTime || 0);
      if (timeSinceLastFrame >= targetFrameTime) {
        this.lastFrameTime = currentTime;
        return true; // Allow render
      }
      
      return false; // Skip render
    };
    
    this.adaptiveRender = adaptiveRender;
    console.log('🎯 Adaptive frame rate enabled');
  }

  // Memory usage monitoring
  monitorMemoryUsage() {
    if (performance.memory) {
      const memory = {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) // MB
      };
      
      // Warn if memory usage is high
      if (memory.used / memory.limit > 0.8) {
        console.warn('⚠️ High memory usage detected:', memory);
        this.optimizeForPerformance();
      }
      
      return memory;
    }
    
    return null;
  }

  getPerformanceReport() {
    const report = {
      fps: this.metrics.fps,
      frameTime: this.metrics.frameTime,
      quality: this.currentQuality,
      particleCount: this.metrics.particleCount,
      autoOptimize: this.autoOptimize,
      memory: this.monitorMemoryUsage()
    };
    
    console.log('📊 Performance Report:', report);
    return report;
  }

  toggle() {
    this.enabled = !this.enabled;
    this.performanceDisplay.style.display = this.enabled ? 'block' : 'none';
    console.log(`Performance optimizer ${this.enabled ? 'enabled' : 'disabled'}`);
  }

  destroy() {
    if (this.performanceDisplay) {
      document.body.removeChild(this.performanceDisplay);
    }
  }
}