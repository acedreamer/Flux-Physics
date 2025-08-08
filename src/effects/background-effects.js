/**
 * Dynamic Background Effects System
 * Creates atmospheric background elements and effects
 */

export class BackgroundEffects {
  constructor(pixiApp) {
    this.pixiApp = pixiApp;
    this.backgroundContainer = new PIXI.Container();
    this.effects = [];
    this.enabled = true;
    
    // Add background container behind everything
    this.pixiApp.stage.addChildAt(this.backgroundContainer, 0);
    
    this.initializeEffects();
  }

  initializeEffects() {
    this.createGridEffect();
    this.createFloatingParticles();
    this.createPulsingOrbs();
    this.createScanLines();
  }

  createGridEffect() {
    const grid = new PIXI.Graphics();
    const gridSize = 50;
    const width = this.pixiApp.canvas.width;
    const height = this.pixiApp.canvas.height;

    // Draw grid lines
    for (let x = 0; x <= width; x += gridSize) {
      grid.moveTo(x, 0);
      grid.lineTo(x, height);
      grid.stroke({ color: 0x00ffff, width: 0.5, alpha: 0.1 });
    }

    for (let y = 0; y <= height; y += gridSize) {
      grid.moveTo(0, y);
      grid.lineTo(width, y);
      grid.stroke({ color: 0x00ffff, width: 0.5, alpha: 0.1 });
    }

    this.backgroundContainer.addChild(grid);
    this.effects.push({ type: 'grid', graphics: grid });
  }

  createFloatingParticles() {
    const floatingParticles = [];
    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
      const particle = new PIXI.Graphics();
      const size = Math.random() * 2 + 1;
      
      particle.circle(0, 0, size);
      particle.fill({ color: 0x00ffff, alpha: 0.3 });
      
      particle.x = Math.random() * this.pixiApp.canvas.width;
      particle.y = Math.random() * this.pixiApp.canvas.height;
      
      // Add movement properties
      particle.vx = (Math.random() - 0.5) * 0.5;
      particle.vy = (Math.random() - 0.5) * 0.5;
      particle.life = Math.random();
      particle.maxLife = Math.random() * 5 + 3;
      
      this.backgroundContainer.addChild(particle);
      floatingParticles.push(particle);
    }

    this.effects.push({ type: 'floating', particles: floatingParticles });
  }

  createPulsingOrbs() {
    const orbs = [];
    const orbCount = 8;

    for (let i = 0; i < orbCount; i++) {
      const orb = new PIXI.Graphics();
      const baseSize = Math.random() * 20 + 10;
      
      // Create layered orb
      orb.circle(0, 0, baseSize * 2);
      orb.fill({ color: 0x00ffff, alpha: 0.05 });
      
      orb.circle(0, 0, baseSize);
      orb.fill({ color: 0x00ffff, alpha: 0.1 });
      
      orb.circle(0, 0, baseSize * 0.5);
      orb.fill({ color: 0xffffff, alpha: 0.2 });
      
      orb.x = Math.random() * this.pixiApp.canvas.width;
      orb.y = Math.random() * this.pixiApp.canvas.height;
      
      // Pulsing properties
      orb.baseScale = 1.0;
      orb.pulseSpeed = Math.random() * 0.02 + 0.01;
      orb.pulsePhase = Math.random() * Math.PI * 2;
      
      this.backgroundContainer.addChild(orb);
      orbs.push(orb);
    }

    this.effects.push({ type: 'orbs', orbs: orbs });
  }

  createScanLines() {
    const scanLines = new PIXI.Graphics();
    const lineCount = 5;
    const height = this.pixiApp.canvas.height;
    const width = this.pixiApp.canvas.width;

    for (let i = 0; i < lineCount; i++) {
      const y = (height / lineCount) * i;
      scanLines.moveTo(0, y);
      scanLines.lineTo(width, y);
      scanLines.stroke({ color: 0x00ffff, width: 1, alpha: 0.05 });
    }

    // Add animated scan line
    const animatedScan = new PIXI.Graphics();
    animatedScan.moveTo(0, 0);
    animatedScan.lineTo(width, 0);
    animatedScan.stroke({ color: 0x00ffff, width: 2, alpha: 0.3 });
    
    animatedScan.y = 0;
    animatedScan.direction = 1;
    animatedScan.speed = 2;

    this.backgroundContainer.addChild(scanLines);
    this.backgroundContainer.addChild(animatedScan);
    
    this.effects.push({ 
      type: 'scanlines', 
      static: scanLines, 
      animated: animatedScan 
    });
  }

  update() {
    if (!this.enabled) return;

    this.effects.forEach(effect => {
      switch (effect.type) {
        case 'floating':
          this.updateFloatingParticles(effect.particles);
          break;
        case 'orbs':
          this.updatePulsingOrbs(effect.orbs);
          break;
        case 'scanlines':
          this.updateScanLines(effect.animated);
          break;
      }
    });
  }

  updateFloatingParticles(particles) {
    particles.forEach(particle => {
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Wrap around screen
      if (particle.x < 0) particle.x = this.pixiApp.canvas.width;
      if (particle.x > this.pixiApp.canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.pixiApp.canvas.height;
      if (particle.y > this.pixiApp.canvas.height) particle.y = 0;
      
      // Update life and alpha
      particle.life += 0.01;
      if (particle.life > particle.maxLife) {
        particle.life = 0;
      }
      
      const lifeCycle = Math.sin((particle.life / particle.maxLife) * Math.PI);
      particle.alpha = 0.1 + lifeCycle * 0.2;
    });
  }

  updatePulsingOrbs(orbs) {
    orbs.forEach(orb => {
      orb.pulsePhase += orb.pulseSpeed;
      const pulse = Math.sin(orb.pulsePhase) * 0.3 + 1.0;
      orb.scale.set(orb.baseScale * pulse);
      
      // Subtle alpha pulsing
      orb.alpha = 0.3 + Math.sin(orb.pulsePhase * 0.5) * 0.2;
    });
  }

  updateScanLines(animatedScan) {
    animatedScan.y += animatedScan.speed * animatedScan.direction;
    
    if (animatedScan.y >= this.pixiApp.canvas.height) {
      animatedScan.direction = -1;
    } else if (animatedScan.y <= 0) {
      animatedScan.direction = 1;
    }
    
    // Fade effect based on position
    const progress = animatedScan.y / this.pixiApp.canvas.height;
    animatedScan.alpha = 0.1 + Math.sin(progress * Math.PI) * 0.2;
  }

  // Audio-reactive background effects
  updateWithAudio(audioData) {
    if (!this.enabled || !audioData) return;

    const bassLevel = audioData.bass || 0;
    const trebleLevel = audioData.treble || 0;
    
    // Make orbs pulse with bass
    const orbEffect = this.effects.find(e => e.type === 'orbs');
    if (orbEffect) {
      orbEffect.orbs.forEach(orb => {
        orb.baseScale = 1.0 + bassLevel * 0.5;
      });
    }

    // Make grid intensity respond to treble
    const gridEffect = this.effects.find(e => e.type === 'grid');
    if (gridEffect) {
      gridEffect.graphics.alpha = 0.1 + trebleLevel * 0.3;
    }

    // Speed up floating particles with overall energy
    const floatingEffect = this.effects.find(e => e.type === 'floating');
    if (floatingEffect) {
      const energyLevel = (bassLevel + trebleLevel) / 2;
      floatingEffect.particles.forEach(particle => {
        const speedMultiplier = 1.0 + energyLevel * 2.0;
        particle.vx *= speedMultiplier;
        particle.vy *= speedMultiplier;
      });
    }
  }

  setIntensity(intensity) {
    this.backgroundContainer.alpha = Math.max(0, Math.min(1, intensity));
    console.log(`Background effects intensity: ${intensity}`);
  }

  toggle() {
    this.enabled = !this.enabled;
    this.backgroundContainer.visible = this.enabled;
    console.log(`Background effects ${this.enabled ? 'enabled' : 'disabled'}`);
  }

  setTheme(theme) {
    const themes = {
      cyan: 0x00ffff,
      fire: 0xff4500,
      ocean: 0x0066cc,
      galaxy: 0x9966ff,
      matrix: 0x00ff00
    };

    const color = themes[theme] || 0x00ffff;
    
    // Update all effect colors
    this.effects.forEach(effect => {
      switch (effect.type) {
        case 'grid':
          this.updateGridColor(effect.graphics, color);
          break;
        case 'floating':
          effect.particles.forEach(p => this.updateParticleColor(p, color));
          break;
        case 'orbs':
          effect.orbs.forEach(o => this.updateOrbColor(o, color));
          break;
        case 'scanlines':
          this.updateScanLineColor(effect.static, color);
          this.updateScanLineColor(effect.animated, color);
          break;
      }
    });
  }

  updateGridColor(grid, color) {
    // Recreate grid with new color
    grid.clear();
    const gridSize = 50;
    const width = this.pixiApp.canvas.width;
    const height = this.pixiApp.canvas.height;

    for (let x = 0; x <= width; x += gridSize) {
      grid.moveTo(x, 0);
      grid.lineTo(x, height);
      grid.stroke({ color: color, width: 0.5, alpha: 0.1 });
    }

    for (let y = 0; y <= height; y += gridSize) {
      grid.moveTo(0, y);
      grid.lineTo(width, y);
      grid.stroke({ color: color, width: 0.5, alpha: 0.1 });
    }
  }

  updateParticleColor(particle, color) {
    particle.clear();
    const size = 2;
    particle.circle(0, 0, size);
    particle.fill({ color: color, alpha: 0.3 });
  }

  updateOrbColor(orb, color) {
    orb.clear();
    const baseSize = 15;
    
    orb.circle(0, 0, baseSize * 2);
    orb.fill({ color: color, alpha: 0.05 });
    
    orb.circle(0, 0, baseSize);
    orb.fill({ color: color, alpha: 0.1 });
    
    orb.circle(0, 0, baseSize * 0.5);
    orb.fill({ color: 0xffffff, alpha: 0.2 });
  }

  updateScanLineColor(scanLine, color) {
    // This would require recreating the scan lines
    scanLine.tint = color;
  }

  destroy() {
    this.effects.forEach(effect => {
      switch (effect.type) {
        case 'grid':
          effect.graphics.destroy();
          break;
        case 'floating':
          effect.particles.forEach(p => p.destroy());
          break;
        case 'orbs':
          effect.orbs.forEach(o => o.destroy());
          break;
        case 'scanlines':
          effect.static.destroy();
          effect.animated.destroy();
          break;
      }
    });
    
    this.pixiApp.stage.removeChild(this.backgroundContainer);
    this.backgroundContainer.destroy();
  }
}