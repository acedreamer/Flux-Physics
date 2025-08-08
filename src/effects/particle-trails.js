/**
 * Advanced Particle Trail System
 * Creates smooth motion blur and trail effects for enhanced visual appeal
 */

export class ParticleTrailSystem {
  constructor(pixiApp, particleCount) {
    this.pixiApp = pixiApp;
    this.particleCount = particleCount;
    this.trailContainer = new PIXI.Container();
    this.trailGraphics = [];
    this.trailHistory = [];
    this.trailLength = 12;
    this.enabled = true;
    
    // Trail visual settings
    this.trailSettings = {
      maxAlpha: 0.6,
      minAlpha: 0.05,
      widthMultiplier: 0.8,
      smoothing: 0.7,
      colorBlending: true
    };

    this.pixiApp.stage.addChild(this.trailContainer);
    this.initializeTrails();
  }

  initializeTrails() {
    this.trailHistory = [];
    this.trailGraphics = [];

    for (let i = 0; i < this.particleCount; i++) {
      this.trailHistory[i] = [];
      this.trailGraphics[i] = new PIXI.Graphics();
      this.trailContainer.addChild(this.trailGraphics[i]);
    }

    console.log(`✨ Initialized trail system for ${this.particleCount} particles`);
  }

  updateTrails(positions, activeParticleCount, velocities = null) {
    if (!this.enabled) return;

    for (let i = 0; i < activeParticleCount; i++) {
      const x = positions[i * 2];
      const y = positions[i * 2 + 1];
      
      // Add current position to history
      if (!this.trailHistory[i]) {
        this.trailHistory[i] = [];
      }
      
      this.trailHistory[i].push({ x, y, time: performance.now() });
      
      // Limit trail length
      if (this.trailHistory[i].length > this.trailLength) {
        this.trailHistory[i].shift();
      }

      // Draw trail
      this.drawTrail(i, velocities ? velocities[i] : null);
    }

    // Clear trails for inactive particles
    for (let i = activeParticleCount; i < this.particleCount; i++) {
      if (this.trailHistory[i]) {
        this.trailHistory[i] = [];
      }
      if (this.trailGraphics[i]) {
        this.trailGraphics[i].clear();
      }
    }
  }

  drawTrail(particleIndex, velocity = null) {
    const trail = this.trailHistory[particleIndex];
    const graphics = this.trailGraphics[particleIndex];
    
    if (!trail || trail.length < 2) {
      graphics.clear();
      return;
    }

    graphics.clear();

    // Calculate velocity-based trail properties
    let trailWidth = 2;
    let trailIntensity = 1.0;
    
    if (velocity) {
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
      trailWidth = Math.max(1, Math.min(6, speed * 0.1));
      trailIntensity = Math.max(0.3, Math.min(1.5, speed * 0.05));
    }

    // Draw trail segments
    for (let i = 1; i < trail.length; i++) {
      const current = trail[i];
      const previous = trail[i - 1];
      
      // Calculate alpha based on position in trail
      const progress = i / (trail.length - 1);
      const alpha = this.trailSettings.minAlpha + 
        (this.trailSettings.maxAlpha - this.trailSettings.minAlpha) * progress * trailIntensity;
      
      // Calculate width based on position in trail
      const width = trailWidth * this.trailSettings.widthMultiplier * progress;
      
      // Color based on speed or default cyan
      let color = 0x00ffff;
      if (this.trailSettings.colorBlending && velocity) {
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        const hue = Math.min(240, 180 + speed * 2); // Cyan to blue based on speed
        color = this.hslToHex(hue, 100, 50);
      }

      // Draw trail segment
      graphics.moveTo(previous.x, previous.y);
      graphics.lineTo(current.x, current.y);
      graphics.stroke({ 
        color: color, 
        width: width, 
        alpha: alpha,
        cap: 'round',
        join: 'round'
      });
    }
  }

  // Enhanced trail with glow effect
  drawGlowTrail(particleIndex, velocity = null) {
    const trail = this.trailHistory[particleIndex];
    const graphics = this.trailGraphics[particleIndex];
    
    if (!trail || trail.length < 2) {
      graphics.clear();
      return;
    }

    graphics.clear();

    // Draw multiple layers for glow effect
    const layers = [
      { width: 8, alpha: 0.1 },
      { width: 4, alpha: 0.3 },
      { width: 2, alpha: 0.6 },
      { width: 1, alpha: 1.0 }
    ];

    layers.forEach(layer => {
      for (let i = 1; i < trail.length; i++) {
        const current = trail[i];
        const previous = trail[i - 1];
        
        const progress = i / (trail.length - 1);
        const alpha = layer.alpha * progress;
        
        graphics.moveTo(previous.x, previous.y);
        graphics.lineTo(current.x, current.y);
        graphics.stroke({ 
          color: 0x00ffff, 
          width: layer.width, 
          alpha: alpha,
          cap: 'round',
          join: 'round'
        });
      }
    });
  }

  // Smooth interpolated trails
  drawSmoothTrail(particleIndex) {
    const trail = this.trailHistory[particleIndex];
    const graphics = this.trailGraphics[particleIndex];
    
    if (!trail || trail.length < 3) {
      graphics.clear();
      return;
    }

    graphics.clear();

    // Create smooth curve through trail points
    const points = this.smoothTrailPoints(trail);
    
    if (points.length < 2) return;

    // Draw smooth trail
    graphics.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      const progress = i / (points.length - 1);
      const alpha = this.trailSettings.minAlpha + 
        (this.trailSettings.maxAlpha - this.trailSettings.minAlpha) * progress;
      const width = 3 * progress;
      
      if (i === 1) {
        graphics.lineTo(points[i].x, points[i].y);
      } else {
        // Use quadratic curve for smoothness
        const cp = points[i - 1];
        graphics.quadraticCurveTo(cp.x, cp.y, points[i].x, points[i].y);
      }
      
      graphics.stroke({ 
        color: 0x00ffff, 
        width: width, 
        alpha: alpha,
        cap: 'round',
        join: 'round'
      });
    }
  }

  smoothTrailPoints(trail) {
    if (trail.length < 3) return trail;

    const smoothed = [trail[0]];
    
    for (let i = 1; i < trail.length - 1; i++) {
      const prev = trail[i - 1];
      const curr = trail[i];
      const next = trail[i + 1];
      
      // Apply smoothing
      const smoothX = prev.x * 0.25 + curr.x * 0.5 + next.x * 0.25;
      const smoothY = prev.y * 0.25 + curr.y * 0.5 + next.y * 0.25;
      
      smoothed.push({ x: smoothX, y: smoothY, time: curr.time });
    }
    
    smoothed.push(trail[trail.length - 1]);
    return smoothed;
  }

  setTrailLength(length) {
    this.trailLength = Math.max(2, Math.min(20, length));
    console.log(`Trail length set to ${this.trailLength}`);
  }

  setTrailIntensity(intensity) {
    this.trailSettings.maxAlpha = Math.max(0.1, Math.min(1.0, intensity));
    console.log(`Trail intensity set to ${this.trailSettings.maxAlpha}`);
  }

  enableColorBlending(enabled) {
    this.trailSettings.colorBlending = enabled;
    console.log(`Trail color blending ${enabled ? 'enabled' : 'disabled'}`);
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.clearAllTrails();
    }
    console.log(`Particle trails ${this.enabled ? 'enabled' : 'disabled'}`);
  }

  clearAllTrails() {
    this.trailGraphics.forEach(graphics => graphics.clear());
    this.trailHistory.forEach(trail => trail.length = 0);
  }

  updateParticleCount(newCount) {
    if (newCount > this.particleCount) {
      // Add new trail graphics
      for (let i = this.particleCount; i < newCount; i++) {
        this.trailHistory[i] = [];
        this.trailGraphics[i] = new PIXI.Graphics();
        this.trailContainer.addChild(this.trailGraphics[i]);
      }
    } else if (newCount < this.particleCount) {
      // Remove excess trail graphics
      for (let i = newCount; i < this.particleCount; i++) {
        if (this.trailGraphics[i]) {
          this.trailContainer.removeChild(this.trailGraphics[i]);
          this.trailGraphics[i].destroy();
        }
      }
      this.trailGraphics.splice(newCount);
      this.trailHistory.splice(newCount);
    }

    this.particleCount = newCount;
    console.log(`Updated trail system for ${newCount} particles`);
  }

  hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return parseInt(`${f(0)}${f(8)}${f(4)}`, 16);
  }

  destroy() {
    this.clearAllTrails();
    this.trailGraphics.forEach(graphics => graphics.destroy());
    this.pixiApp.stage.removeChild(this.trailContainer);
    this.trailContainer.destroy();
  }
}