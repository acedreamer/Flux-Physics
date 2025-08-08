/**
 * Quick Audio Improvements for FLUX
 * Simple enhancements you can implement immediately
 */

export class QuickAudioImprovements {
    constructor(fluxApp) {
        this.fluxApp = fluxApp;
        this.isEnabled = false;
        
        // Enhanced beat detection
        this.beatHistory = new Float32Array(30); // 0.5 seconds at 60fps
        this.beatIndex = 0;
        this.lastBeatTime = 0;
        this.beatThreshold = 0.2;
        
        // Particle groups for different frequencies
        this.particleGroups = {
            bass: [],    // Heavy particles (30%)
            mid: [],     // Flow particles (50%) 
            treble: []   // Sparkle particles (20%)
        };
        
        // Visual state
        this.currentHue = 180;
        this.bloomIntensity = 1.0;
        this.energySmoothing = 0.8;
        this.smoothedEnergy = 0;
        
        console.log('🚀 Quick Audio Improvements initialized');
    }
    
    /**
     * Initialize the improvements
     */
    initialize() {
        this.setupParticleGroups();
        this.isEnabled = true;
        console.log('✅ Quick Audio Improvements enabled');
    }
    
    /**
     * Setup particle groups for different frequency responses
     */
    setupParticleGroups() {
        const totalParticles = this.fluxApp.config?.particleCount || 800;
        
        // Clear existing groups
        this.particleGroups.bass = [];
        this.particleGroups.mid = [];
        this.particleGroups.treble = [];
        
        // Assign particles to groups
        for (let i = 0; i < totalParticles; i++) {
            if (i < totalParticles * 0.3) {
                this.particleGroups.bass.push(i);
            } else if (i < totalParticles * 0.8) {
                this.particleGroups.mid.push(i);
            } else {
                this.particleGroups.treble.push(i);
            }
        }
        
        console.log('🎛️ Particle groups:', {
            bass: this.particleGroups.bass.length,
            mid: this.particleGroups.mid.length,
            treble: this.particleGroups.treble.length
        });
    }
    
    /**
     * Main update method - call this from your audio loop
     */
    update(audioData) {
        if (!this.isEnabled || !audioData) return;
        
        // Enhanced beat detection
        const beatData = this.detectEnhancedBeat(audioData);
        
        // Apply frequency-specific particle effects
        this.applyFrequencyEffects(audioData, beatData);
        
        // Enhanced visual effects
        this.applyEnhancedVisuals(audioData, beatData);
        
        // Improved color system
        this.updateImprovedColors(audioData);
    }
    
    /**
     * Enhanced beat detection with better accuracy
     */
    detectEnhancedBeat(audioData) {
        const now = performance.now();
        
        // Use bass and sub-bass for beat detection
        const beatEnergy = audioData.bass * 0.7 + (audioData.subBass || 0) * 0.3;
        
        // Update beat history
        this.beatHistory[this.beatIndex] = beatEnergy;
        this.beatIndex = (this.beatIndex + 1) % this.beatHistory.length;
        
        // Calculate average and variance
        let sum = 0;
        let sumSquares = 0;
        for (let i = 0; i < this.beatHistory.length; i++) {
            sum += this.beatHistory[i];
            sumSquares += this.beatHistory[i] * this.beatHistory[i];
        }
        
        const average = sum / this.beatHistory.length;
        const variance = (sumSquares / this.beatHistory.length) - (average * average);
        const stdDev = Math.sqrt(variance);
        
        // Adaptive threshold
        const adaptiveThreshold = average + (stdDev * 1.8);
        const minimumThreshold = Math.max(this.beatThreshold, adaptiveThreshold);
        
        // Beat detection
        const isBeat = beatEnergy > minimumThreshold && 
                      (now - this.lastBeatTime) > 120; // Minimum 120ms between beats
        
        if (isBeat) {
            this.lastBeatTime = now;
        }
        
        // Calculate beat strength and confidence
        const strength = isBeat ? Math.min(beatEnergy / minimumThreshold, 2.0) : 0;
        const confidence = isBeat ? Math.min(strength, 1.0) : 0;
        
        return {
            isBeat,
            strength,
            confidence,
            energy: beatEnergy,
            threshold: minimumThreshold
        };
    }
    
    /**
     * Apply frequency-specific effects to particle groups
     */
    applyFrequencyEffects(audioData, beatData) {
        if (!this.fluxApp.solver) return;
        
        const centerX = this.fluxApp.config?.containerWidth / 2 || 400;
        const centerY = this.fluxApp.config?.containerHeight / 2 || 300;
        
        // Bass particles: Heavy, gravitational movement
        this.applyBassEffects(audioData.bass, centerX, centerY);
        
        // Mid particles: Flowing, directional movement  
        this.applyMidEffects(audioData.mids, audioData.spectral?.centroid || 1000);
        
        // Treble particles: Light, sparkly movement
        this.applyTrebleEffects(audioData.treble);
        
        // Beat-driven effects for all particles
        if (beatData.isBeat) {
            this.applyBeatEffects(beatData.strength, centerX, centerY);
        }
    }
    
    /**
     * Apply bass effects to bass particle group
     */
    applyBassEffects(bassLevel, centerX, centerY) {
        if (bassLevel < 0.05) return;
        
        this.particleGroups.bass.forEach(particleIndex => {
            const positions = this.fluxApp.solver.get_positions();
            const x = positions[particleIndex * 2];
            const y = positions[particleIndex * 2 + 1];
            
            // Strong gravitational pull toward center
            const dx = centerX - x;
            const dy = centerY - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const force = bassLevel * 80; // Stronger than before
                const forceX = (dx / distance) * force;
                const forceY = (dy / distance) * force;
                
                this.fluxApp.solver.apply_force(particleIndex, forceX, forceY);
            }
        });
    }
    
    /**
     * Apply mid-frequency effects to mid particle group
     */
    applyMidEffects(midLevel, spectralCentroid) {
        if (midLevel < 0.03) return;
        
        // Flow direction based on spectral centroid
        const flowAngle = (spectralCentroid / 22050) * Math.PI * 2;
        const flowStrength = midLevel * 60;
        
        const flowX = Math.cos(flowAngle) * flowStrength;
        const flowY = Math.sin(flowAngle) * flowStrength;
        
        this.particleGroups.mid.forEach(particleIndex => {
            this.fluxApp.solver.apply_force(particleIndex, flowX, flowY);
        });
    }
    
    /**
     * Apply treble effects to treble particle group
     */
    applyTrebleEffects(trebleLevel) {
        if (trebleLevel < 0.02) return;
        
        this.particleGroups.treble.forEach(particleIndex => {
            // Random sparkly movement
            const randomAngle = Math.random() * Math.PI * 2;
            const sparkleStrength = trebleLevel * 40;
            
            const forceX = Math.cos(randomAngle) * sparkleStrength;
            const forceY = Math.sin(randomAngle) * sparkleStrength;
            
            this.fluxApp.solver.apply_force(particleIndex, forceX, forceY);
        });
    }
    
    /**
     * Apply beat-driven effects to all particles
     */
    applyBeatEffects(beatStrength, centerX, centerY) {
        // Create radial pulse from center
        for (let i = 0; i < (this.fluxApp.config?.particleCount || 800); i++) {
            const positions = this.fluxApp.solver.get_positions();
            const x = positions[i * 2];
            const y = positions[i * 2 + 1];
            
            const dx = x - centerX;
            const dy = y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const pulseForce = beatStrength * 60;
                const forceX = (dx / distance) * pulseForce;
                const forceY = (dy / distance) * pulseForce;
                
                this.fluxApp.solver.apply_force(i, forceX, forceY);
            }
        }
    }
    
    /**
     * Apply enhanced visual effects
     */
    applyEnhancedVisuals(audioData, beatData) {
        if (!this.fluxApp.particleRenderer) return;
        
        // Smooth energy for visual effects
        this.smoothedEnergy = this.smoothedEnergy * this.energySmoothing + 
                             audioData.overall * (1 - this.energySmoothing);
        
        // Enhanced bloom intensity
        const baseBloom = 1.0;
        const energyBloom = this.smoothedEnergy * 1.5;
        const beatBloom = beatData.isBeat ? beatData.strength * 0.8 : 0;
        
        this.bloomIntensity = baseBloom + energyBloom + beatBloom;
        this.updateBloomIntensity(Math.min(this.bloomIntensity, 3.0));
        
        // Enhanced particle sizes based on frequency groups
        this.updateParticleSizes(audioData, beatData);
    }
    
    /**
     * Update particle sizes for different frequency groups
     */
    updateParticleSizes(audioData, beatData) {
        if (!this.fluxApp.particleRenderer?.particleGraphics) return;
        
        const particles = this.fluxApp.particleRenderer.particleGraphics;
        
        // Bass particles: Larger, slower scaling
        this.particleGroups.bass.forEach(index => {
            if (particles[index]) {
                const bassScale = 1.2 + audioData.bass * 0.8;
                const beatScale = beatData.isBeat ? 1 + beatData.strength * 0.3 : 1;
                particles[index].scale.set(bassScale * beatScale);
            }
        });
        
        // Mid particles: Moderate scaling
        this.particleGroups.mid.forEach(index => {
            if (particles[index]) {
                const midScale = 1.0 + audioData.mids * 0.5;
                const beatScale = beatData.isBeat ? 1 + beatData.strength * 0.2 : 1;
                particles[index].scale.set(midScale * beatScale);
            }
        });
        
        // Treble particles: Smaller but more responsive
        this.particleGroups.treble.forEach(index => {
            if (particles[index]) {
                const trebleScale = 0.8 + audioData.treble * 1.2;
                const beatScale = beatData.isBeat ? 1 + beatData.strength * 0.4 : 1;
                particles[index].scale.set(trebleScale * beatScale);
            }
        });
    }
    
    /**
     * Improved color system with better frequency mapping
     */
    updateImprovedColors(audioData) {
        if (!this.fluxApp.particleRenderer) return;
        
        // Calculate dominant frequency for color
        let dominantHue = 180; // Default cyan
        
        if (audioData.bass > 0.3) {
            dominantHue = 240; // Blue for bass
        } else if (audioData.treble > 0.2) {
            dominantHue = 60;  // Yellow for treble
        } else if (audioData.mids > 0.25) {
            dominantHue = 180; // Cyan for mids
        }
        
        // Add spectral centroid influence for more dynamic colors
        if (audioData.spectral?.centroid) {
            const spectralInfluence = (audioData.spectral.centroid / 22050) * 120;
            dominantHue = (dominantHue + spectralInfluence) % 360;
        }
        
        // Smooth color transitions
        const colorSpeed = 0.05 + audioData.overall * 0.05;
        this.currentHue = this.lerpAngle(this.currentHue, dominantHue, colorSpeed);
        
        // Enhanced saturation and lightness
        const saturation = 0.9 + audioData.overall * 0.1;
        const lightness = 0.5 + (audioData.spectral?.brightness || 0) * 0.3;
        
        // Apply colors to different particle groups
        this.applyGroupColors(audioData);
        
        // Update main color if renderer supports it
        if (this.fluxApp.particleRenderer.updateAudioColors) {
            this.fluxApp.particleRenderer.updateAudioColors(
                this.currentHue, 
                saturation, 
                lightness
            );
        }
    }
    
    /**
     * Apply different colors to different particle groups
     */
    applyGroupColors(audioData) {
        if (!this.fluxApp.particleRenderer?.particleGraphics) return;
        
        const particles = this.fluxApp.particleRenderer.particleGraphics;
        
        // Bass particles: Blue tones
        this.particleGroups.bass.forEach(index => {
            if (particles[index]) {
                const bassIntensity = audioData.bass;
                const hue = 240 + bassIntensity * 30; // Blue to purple
                this.updateParticleColor(particles[index], hue, 0.9, 0.6);
            }
        });
        
        // Mid particles: Cyan tones  
        this.particleGroups.mid.forEach(index => {
            if (particles[index]) {
                const midIntensity = audioData.mids;
                const hue = 180 + midIntensity * 40; // Cyan to green
                this.updateParticleColor(particles[index], hue, 0.8, 0.5);
            }
        });
        
        // Treble particles: Yellow/white tones
        this.particleGroups.treble.forEach(index => {
            if (particles[index]) {
                const trebleIntensity = audioData.treble;
                const hue = 60 - trebleIntensity * 20; // Yellow to white
                const lightness = 0.7 + trebleIntensity * 0.3;
                this.updateParticleColor(particles[index], hue, 0.9, lightness);
            }
        });
    }
    
    /**
     * Update individual particle color
     */
    updateParticleColor(particle, hue, saturation, lightness) {
        const rgb = this.hslToRgb(hue / 360, saturation, lightness);
        const color = (rgb.r << 16) | (rgb.g << 8) | rgb.b;
        
        // Redraw particle with new color
        particle.clear();
        
        // Outer glow
        particle.circle(0, 0, 4);
        particle.fill({ color: color, alpha: 0.2 });
        
        // Main particle
        particle.circle(0, 0, 2.5);
        particle.fill({ color: color, alpha: 0.8 });
        
        // Bright center
        particle.circle(0, 0, 1);
        particle.fill({ color: 0xffffff, alpha: 1.0 });
    }
    
    /**
     * Update bloom intensity if renderer supports it
     */
    updateBloomIntensity(intensity) {
        if (!this.fluxApp.particleRenderer?.container?.filters) return;
        
        const filters = this.fluxApp.particleRenderer.container.filters;
        const bloomFilter = filters.find(f => 
            f.constructor.name.includes('Bloom') || 
            f.constructor.name.includes('AdvancedBloom')
        );
        
        if (bloomFilter && bloomFilter.bloomScale !== undefined) {
            bloomFilter.bloomScale = intensity;
        }
    }
    
    /**
     * Lerp between angles (handles 360-degree wraparound)
     */
    lerpAngle(a, b, t) {
        const diff = ((b - a + 540) % 360) - 180;
        return (a + diff * t + 360) % 360;
    }
    
    /**
     * Convert HSL to RGB
     */
    hslToRgb(h, s, l) {
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }
    
    /**
     * Enable the improvements
     */
    enable() {
        this.isEnabled = true;
        console.log('✅ Quick Audio Improvements enabled');
    }
    
    /**
     * Disable the improvements
     */
    disable() {
        this.isEnabled = false;
        console.log('❌ Quick Audio Improvements disabled');
    }
    
    /**
     * Get current status
     */
    getStatus() {
        return {
            enabled: this.isEnabled,
            particleGroups: {
                bass: this.particleGroups.bass.length,
                mid: this.particleGroups.mid.length,
                treble: this.particleGroups.treble.length
            },
            currentHue: this.currentHue,
            bloomIntensity: this.bloomIntensity,
            smoothedEnergy: this.smoothedEnergy
        };
    }
}