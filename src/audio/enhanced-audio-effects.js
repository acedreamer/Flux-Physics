/**
 * Enhanced Audio Effects - Advanced audio-reactive particle effects
 * Provides dynamic, responsive, and visually stunning audio reactions
 */

// Import PIXI for graphics operations
import * as PIXI from 'pixi.js';

export class EnhancedAudioEffects {
    constructor(fluxApp) {
        this.fluxApp = fluxApp;
        this.isEnabled = false;
        this.mode = 'enhanced'; // Default to enhanced mode
        
        // Enhanced effect parameters
        this.effects = {
            // Particle movement effects
            movement: {
                bassImpact: 2.5,        // Stronger bass impact
                midFreqFlow: 1.8,       // Mid-frequency directional flow
                trebleSparkle: 3.0,     // High-frequency sparkle intensity
                subBassRumble: 4.0,     // Sub-bass deep impact
                beatPulse: 2.0          // Beat-driven pulse strength
            },
            
            // Visual effects
            visual: {
                colorShift: {
                    enabled: true,
                    speed: 0.8,
                    intensity: 0.7,
                    bassHue: 240,       // Blue for bass
                    midHue: 180,        // Cyan for mids
                    trebleHue: 60       // Yellow for treble
                },
                bloom: {
                    baseIntensity: 1.0,
                    maxIntensity: 3.5,
                    beatMultiplier: 2.0,
                    responseSpeed: 0.6
                },
                particleSize: {
                    baseSize: 1.0,
                    maxSize: 2.5,
                    trebleMultiplier: 1.8,
                    beatMultiplier: 1.5
                }
            },
            
            // Physics effects
            physics: {
                gravity: {
                    baseStrength: 0.0,
                    bassModulation: 0.3,
                    maxStrength: 0.8
                },
                turbulence: {
                    baseLevel: 0.1,
                    audioModulation: 0.4,
                    maxLevel: 1.2
                },
                attraction: {
                    baseStrength: 0.2,
                    midModulation: 0.6,
                    maxStrength: 1.5
                }
            }
        };
        
        // Frequency-based particle groups (Task 1)
        this.particleGroups = {
            bass: {
                particles: [],
                behavior: 'heavy',
                color: { hue: 240, saturation: 0.9, lightness: 0.6 }, // Blue
                movement: 'gravitational',
                sizeMultiplier: 1.4,
                forceMultiplier: 2.0
            },
            mid: {
                particles: [],
                behavior: 'flowing',
                color: { hue: 180, saturation: 0.8, lightness: 0.5 }, // Cyan
                movement: 'directional',
                sizeMultiplier: 1.0,
                forceMultiplier: 1.0
            },
            treble: {
                particles: [],
                behavior: 'sparkly',
                color: { hue: 60, saturation: 0.9, lightness: 0.7 }, // Yellow
                movement: 'random',
                sizeMultiplier: 0.8,
                forceMultiplier: 0.6
            }
        };
        
        // Enhanced beat detection (Task 2)
        this.beatDetection = {
            history: new Float32Array(30), // 0.5 seconds at 60fps
            historyIndex: 0,
            threshold: 0.15,
            lastBeatTime: 0,
            minBeatInterval: 120, // Minimum ms between beats
            adaptiveThreshold: 0.15,
            variance: 0,
            confidence: 0
        };
        
        // State tracking for smooth transitions
        this.state = {
            currentHue: 180,
            targetHue: 180,
            currentSaturation: 0.8,
            targetSaturation: 0.8,
            currentLightness: 0.5,
            targetLightness: 0.5,
            bloomIntensity: 1.0,
            particleScale: 1.0,
            lastBeatTime: 0,
            beatIntensity: 0,
            energyHistory: new Float32Array(60), // 1 second at 60fps
            energyIndex: 0,
            groupsInitialized: false
        };
        
        // Performance optimization
        this.updateCounter = 0;
        this.skipFrames = 0; // For performance throttling
        
        // Initialize sparkle particles array
        this.sparkleParticles = [];
        
        console.log('🎨 Enhanced Audio Effects initialized');
    }
    
    /**
     * Enable enhanced audio effects
     */
    enable() {
        this.isEnabled = true;
        this.initializeParticleGroups();
        console.log('✅ Enhanced Audio Effects enabled');
    }
    
    /**
     * Initialize frequency-based particle groups (Task 1)
     */
    initializeParticleGroups() {
        if (!this.fluxApp.config || this.state.groupsInitialized) return;
        
        const totalParticles = this.fluxApp.config.particleCount || 800;
        
        // Clear existing groups
        this.particleGroups.bass.particles = [];
        this.particleGroups.mid.particles = [];
        this.particleGroups.treble.particles = [];
        
        // Assign particles to groups: 30% bass, 50% mid, 20% treble
        const bassCount = Math.floor(totalParticles * 0.3);
        const midCount = Math.floor(totalParticles * 0.5);
        const trebleCount = totalParticles - bassCount - midCount;
        
        // Assign bass particles (0 to bassCount-1)
        for (let i = 0; i < bassCount; i++) {
            this.particleGroups.bass.particles.push(i);
        }
        
        // Assign mid particles (bassCount to bassCount+midCount-1)
        for (let i = bassCount; i < bassCount + midCount; i++) {
            this.particleGroups.mid.particles.push(i);
        }
        
        // Assign treble particles (remaining)
        for (let i = bassCount + midCount; i < totalParticles; i++) {
            this.particleGroups.treble.particles.push(i);
        }
        
        this.state.groupsInitialized = true;
        
        console.log('🎛️ Particle groups initialized:', {
            bass: this.particleGroups.bass.particles.length,
            mid: this.particleGroups.mid.particles.length,
            treble: this.particleGroups.treble.particles.length,
            total: totalParticles
        });
    }
    
    /**
     * Disable enhanced audio effects
     */
    disable() {
        this.isEnabled = false;
        this.resetEffects();
        console.log('❌ Enhanced Audio Effects disabled');
    }
    
    /**
     * Main update method - called every frame with audio data
     */
    update(audioFeatures) {
        if (!this.isEnabled || !audioFeatures) return;
        
        // Initialize particle groups if not done yet
        if (!this.state.groupsInitialized) {
            this.initializeParticleGroups();
        }
        
        // Performance throttling - skip some frames if needed
        this.updateCounter++;
        if (this.skipFrames > 0 && this.updateCounter % (this.skipFrames + 1) !== 0) {
            return;
        }
        
        // Update energy history for trend analysis
        this.updateEnergyHistory(audioFeatures.energy?.total || audioFeatures.overall || 0);
        
        // Enhanced beat detection (Task 2)
        const enhancedBeat = this.detectEnhancedBeat(audioFeatures);
        
        // Apply frequency-specific particle group effects (Task 1)
        this.applyParticleGroupEffects(audioFeatures, enhancedBeat);
        
        // Apply different effect types based on audio features
        this.applyMovementEffects(audioFeatures);
        this.applyVisualEffects(audioFeatures);
        this.applyPhysicsEffects(audioFeatures);
        
        // Handle beat-driven effects with enhanced detection
        if (enhancedBeat.isBeat) {
            this.triggerBeatEffects(enhancedBeat);
        }
        
        // Update particle renderer with new effects
        this.updateParticleRenderer(audioFeatures);
    }
    
    /**
     * Update energy history for trend analysis
     */
    updateEnergyHistory(totalEnergy) {
        this.state.energyHistory[this.state.energyIndex] = totalEnergy;
        this.state.energyIndex = (this.state.energyIndex + 1) % this.state.energyHistory.length;
    }
    
    /**
     * Enhanced beat detection with adaptive thresholds (Task 2)
     */
    detectEnhancedBeat(audioFeatures) {
        const now = performance.now();
        
        // Use bass and sub-bass for beat detection
        const bassLevel = audioFeatures.bass || 0;
        const subBassLevel = audioFeatures.subBass || 0;
        const beatEnergy = bassLevel * 0.7 + subBassLevel * 0.3;
        
        // Update beat history
        this.beatDetection.history[this.beatDetection.historyIndex] = beatEnergy;
        this.beatDetection.historyIndex = (this.beatDetection.historyIndex + 1) % this.beatDetection.history.length;
        
        // Calculate average and variance for adaptive threshold
        let sum = 0;
        let sumSquares = 0;
        for (let i = 0; i < this.beatDetection.history.length; i++) {
            const energy = this.beatDetection.history[i];
            sum += energy;
            sumSquares += energy * energy;
        }
        
        const average = sum / this.beatDetection.history.length;
        const variance = (sumSquares / this.beatDetection.history.length) - (average * average);
        const stdDev = Math.sqrt(Math.max(variance, 0));
        
        // Adaptive threshold calculation
        this.beatDetection.adaptiveThreshold = average + (stdDev * 1.8);
        const minimumThreshold = Math.max(this.beatDetection.threshold, this.beatDetection.adaptiveThreshold);
        
        // Beat detection with minimum interval
        const timeSinceLastBeat = now - this.beatDetection.lastBeatTime;
        const isBeat = beatEnergy > minimumThreshold && 
                      timeSinceLastBeat > this.beatDetection.minBeatInterval;
        
        if (isBeat) {
            this.beatDetection.lastBeatTime = now;
        }
        
        // Calculate beat strength and confidence
        const strength = isBeat ? Math.min(beatEnergy / Math.max(minimumThreshold, 0.1), 2.0) : 0;
        this.beatDetection.confidence = isBeat ? Math.min(strength, 1.0) : Math.max(this.beatDetection.confidence * 0.9, 0);
        this.beatDetection.variance = stdDev;
        
        return {
            isBeat,
            strength,
            confidence: this.beatDetection.confidence,
            energy: beatEnergy,
            threshold: minimumThreshold,
            variance: stdDev,
            timeSinceLastBeat,
            timestamp: now
        };
    }
    
    /**
     * Apply frequency-specific effects to particle groups (Task 1)
     */
    applyParticleGroupEffects(audioFeatures, beatData) {
        if (!this.fluxApp.solver || !this.state.groupsInitialized) return;
        
        const centerX = this.fluxApp.config?.containerWidth / 2 || 400;
        const centerY = this.fluxApp.config?.containerHeight / 2 || 300;
        
        // Bass particles: Heavy, gravitational movement
        this.applyBassGroupEffects(audioFeatures.bass || 0, centerX, centerY, beatData);
        
        // Mid particles: Flowing, directional movement
        this.applyMidGroupEffects(audioFeatures.mids || 0, audioFeatures.spectral?.centroid || 1000);
        
        // Treble particles: Light, sparkly movement
        this.applyTrebleGroupEffects(audioFeatures.treble || 0);
        
        // Update particle colors and sizes for groups (Task 3 & 4)
        this.updateParticleGroupVisuals(audioFeatures, beatData);
    }
    
    /**
     * Apply bass effects to bass particle group
     */
    applyBassGroupEffects(bassLevel, centerX, centerY, beatData) {
        if (bassLevel < 0.05) return;
        
        const group = this.particleGroups.bass;
        const forceMultiplier = group.forceMultiplier * (1 + beatData.strength * 0.5);
        
        group.particles.forEach(particleIndex => {
            const positions = this.fluxApp.solver.get_positions();
            const x = positions[particleIndex * 2];
            const y = positions[particleIndex * 2 + 1];
            
            // Strong gravitational pull toward center
            const dx = centerX - x;
            const dy = centerY - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const force = bassLevel * 100 * forceMultiplier;
                const forceX = (dx / distance) * force;
                const forceY = (dy / distance) * force;
                
                this.fluxApp.solver.apply_force(particleIndex, forceX, forceY);
            }
        });
    }
    
    /**
     * Apply mid-frequency effects to mid particle group
     */
    applyMidGroupEffects(midLevel, spectralCentroid) {
        if (midLevel < 0.03) return;
        
        const group = this.particleGroups.mid;
        
        // Flow direction based on spectral centroid
        const flowAngle = (spectralCentroid / 22050) * Math.PI * 2;
        const flowStrength = midLevel * 70 * group.forceMultiplier;
        
        const flowX = Math.cos(flowAngle) * flowStrength;
        const flowY = Math.sin(flowAngle) * flowStrength;
        
        group.particles.forEach(particleIndex => {
            this.fluxApp.solver.apply_force(particleIndex, flowX, flowY);
        });
    }
    
    /**
     * Apply treble effects to treble particle group
     */
    applyTrebleGroupEffects(trebleLevel) {
        if (trebleLevel < 0.02) return;
        
        const group = this.particleGroups.treble;
        
        group.particles.forEach(particleIndex => {
            // Random sparkly movement
            const randomAngle = Math.random() * Math.PI * 2;
            const sparkleStrength = trebleLevel * 50 * group.forceMultiplier;
            
            const forceX = Math.cos(randomAngle) * sparkleStrength;
            const forceY = Math.sin(randomAngle) * sparkleStrength;
            
            this.fluxApp.solver.apply_force(particleIndex, forceX, forceY);
        });
    }
    
    /**
     * Update visual properties for particle groups (Task 3 & 4)
     */
    updateParticleGroupVisuals(audioFeatures, beatData) {
        if (!this.fluxApp.particleRenderer?.particleGraphics) return;
        
        const particles = this.fluxApp.particleRenderer.particleGraphics;
        
        // Update bass particles
        this.particleGroups.bass.particles.forEach(index => {
            if (particles[index]) {
                const bassLevel = audioFeatures.bass || 0;
                const group = this.particleGroups.bass;
                
                // Size: Larger for bass, enhanced by beats
                const baseSize = group.sizeMultiplier * (1.2 + bassLevel * 0.8);
                const beatSize = beatData.isBeat ? 1 + beatData.strength * 0.4 : 1;
                particles[index].scale.set(baseSize * beatSize);
                
                // Color: Blue tones, darker for stronger bass
                const hue = group.color.hue + bassLevel * 20; // Blue to purple
                const lightness = group.color.lightness + bassLevel * 0.2;
                this.updateParticleColor(particles[index], hue, group.color.saturation, lightness);
            }
        });
        
        // Update mid particles
        this.particleGroups.mid.particles.forEach(index => {
            if (particles[index]) {
                const midLevel = audioFeatures.mids || 0;
                const group = this.particleGroups.mid;
                
                // Size: Moderate scaling
                const baseSize = group.sizeMultiplier * (1.0 + midLevel * 0.5);
                const beatSize = beatData.isBeat ? 1 + beatData.strength * 0.2 : 1;
                particles[index].scale.set(baseSize * beatSize);
                
                // Color: Cyan tones, shifting with spectral centroid
                const spectralShift = (audioFeatures.spectral?.centroid || 1000) / 22050 * 40;
                const hue = group.color.hue + spectralShift;
                this.updateParticleColor(particles[index], hue, group.color.saturation, group.color.lightness);
            }
        });
        
        // Update treble particles
        this.particleGroups.treble.particles.forEach(index => {
            if (particles[index]) {
                const trebleLevel = audioFeatures.treble || 0;
                const group = this.particleGroups.treble;
                
                // Size: Smaller but more responsive
                const baseSize = group.sizeMultiplier * (0.8 + trebleLevel * 1.2);
                const beatSize = beatData.isBeat ? 1 + beatData.strength * 0.5 : 1;
                particles[index].scale.set(baseSize * beatSize);
                
                // Color: Yellow to white, brighter for higher treble
                const hue = group.color.hue - trebleLevel * 30; // Yellow to white
                const lightness = Math.min(group.color.lightness + trebleLevel * 0.3, 0.9);
                this.updateParticleColor(particles[index], hue, group.color.saturation, lightness);
            }
        });
    }
    
    /**
     * Update individual particle color with HSL values
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
     * Apply movement effects based on audio features
     */
    applyMovementEffects(audioFeatures) {
        if (!this.fluxApp.solver) return;
        
        const { subBass, bass, mids, treble, highTreble } = audioFeatures;
        const { movement } = this.effects;
        
        // Sub-bass creates deep, slow waves
        if (subBass > 0.1) {
            const waveStrength = subBass * movement.subBassRumble;
            this.createRadialWave(waveStrength, 0.02); // Slow wave
        }
        
        // Bass creates rhythmic pulses
        if (bass > 0.15) {
            const pulseStrength = bass * movement.bassImpact;
            this.createRhythmicPulse(pulseStrength);
        }
        
        // Mids create directional flow
        if (mids > 0.1) {
            const flowStrength = mids * movement.midFreqFlow;
            this.createDirectionalFlow(flowStrength, audioFeatures.spectral.centroid);
        }
        
        // Treble creates sparkle effects
        if (treble > 0.08) {
            const sparkleIntensity = treble * movement.trebleSparkle;
            this.createSparkleEffect(sparkleIntensity);
        }
        
        // High treble creates shimmer
        if (highTreble > 0.05) {
            this.createShimmerEffect(highTreble);
        }
    }
    
    /**
     * Apply visual effects based on audio features
     */
    applyVisualEffects(audioFeatures) {
        const { visual } = this.effects;
        const { energy, spectral } = audioFeatures;
        
        // Dynamic color shifting based on dominant frequencies
        if (visual.colorShift.enabled) {
            this.updateDynamicColors(audioFeatures);
        }
        
        // Bloom intensity based on overall energy and beats
        const targetBloom = visual.bloom.baseIntensity + 
                           (energy.total * visual.bloom.maxIntensity) +
                           (this.state.beatIntensity * visual.bloom.beatMultiplier);
        
        this.state.bloomIntensity = this.lerp(
            this.state.bloomIntensity, 
            Math.min(targetBloom, visual.bloom.maxIntensity),
            visual.bloom.responseSpeed
        );
        
        // Particle size modulation
        const trebleSize = 1.0 + (audioFeatures.treble * visual.particleSize.trebleMultiplier);
        const beatSize = 1.0 + (this.state.beatIntensity * visual.particleSize.beatMultiplier);
        this.state.particleScale = Math.min(trebleSize * beatSize, visual.particleSize.maxSize);
        
        // Apply spectral brightness to particle intensity
        const brightness = spectral.brightness;
        this.updateParticleBrightness(brightness);
    }
    
    /**
     * Update particle brightness based on spectral analysis
     * @param {number} brightness - Brightness level (0-1)
     */
    updateParticleBrightness(brightness) {
        if (!this.fluxApp.particleRenderer) return;
        
        try {
            // Clamp brightness to reasonable range
            const clampedBrightness = Math.max(0.3, Math.min(1.5, brightness));
            
            // Update particle alpha/brightness if the renderer supports it
            if (this.fluxApp.particleRenderer.updateBrightness) {
                this.fluxApp.particleRenderer.updateBrightness(clampedBrightness);
            } else {
                // Fallback: update bloom intensity as a proxy for brightness
                if (this.fluxApp.particleRenderer.updateBloomIntensity) {
                    this.fluxApp.particleRenderer.updateBloomIntensity(clampedBrightness);
                }
            }
        } catch (error) {
            console.warn('Failed to update particle brightness:', error.message);
        }
    }
    
    /**
     * Apply physics effects based on audio features
     */
    applyPhysicsEffects(audioFeatures) {
        if (!this.fluxApp.solver) return;
        
        const { physics } = this.effects;
        const { bass, mids, energy } = audioFeatures;
        
        // Gravity modulation based on bass
        const gravityStrength = physics.gravity.baseStrength + 
                               (bass * physics.gravity.bassModulation);
        this.setGravityEffect(Math.min(gravityStrength, physics.gravity.maxStrength));
        
        // Turbulence based on overall energy
        const turbulenceLevel = physics.turbulence.baseLevel + 
                               (energy.total * physics.turbulence.audioModulation);
        this.setTurbulenceEffect(Math.min(turbulenceLevel, physics.turbulence.maxLevel));
        
        // Attraction forces based on mids
        const attractionStrength = physics.attraction.baseStrength + 
                                  (mids * physics.attraction.midModulation);
        this.setAttractionEffect(Math.min(attractionStrength, physics.attraction.maxStrength));
    }
    
    /**
     * Update dynamic colors based on audio features (Enhanced - Task 4)
     */
    updateDynamicColors(audioFeatures) {
        const { visual } = this.effects;
        const { energy } = audioFeatures;
        
        // Enhanced color calculation with better frequency mapping
        let targetHue = visual.colorShift.bassHue; // Default to bass color
        let saturation = 0.8;
        let lightness = 0.5;
        
        // Determine dominant frequency with improved logic
        const bassLevel = audioFeatures.bass || 0;
        const midLevel = audioFeatures.mids || 0;
        const trebleLevel = audioFeatures.treble || 0;
        const totalLevel = bassLevel + midLevel + trebleLevel;
        
        if (totalLevel > 0) {
            const bassRatio = bassLevel / totalLevel;
            const midRatio = midLevel / totalLevel;
            const trebleRatio = trebleLevel / totalLevel;
            
            // Blend colors based on frequency distribution
            if (bassRatio > 0.5) {
                targetHue = visual.colorShift.bassHue + bassLevel * 30; // Blue to purple
                saturation = 0.9 + bassLevel * 0.1;
                lightness = 0.4 + bassLevel * 0.3;
            } else if (trebleRatio > 0.4) {
                targetHue = visual.colorShift.trebleHue - trebleLevel * 40; // Yellow to white
                saturation = 0.8 + trebleLevel * 0.2;
                lightness = 0.6 + trebleLevel * 0.3;
            } else if (midRatio > 0.3) {
                targetHue = visual.colorShift.midHue + midLevel * 50; // Cyan to green
                saturation = 0.8;
                lightness = 0.5 + midLevel * 0.2;
            }
        }
        
        // Enhanced spectral centroid influence
        if (audioFeatures.spectral?.centroid) {
            const spectralInfluence = (audioFeatures.spectral.centroid / 22050) * 180; // Increased range
            targetHue = (targetHue + spectralInfluence) % 360;
            
            // Brightness affects lightness
            const brightness = audioFeatures.spectral.brightness || 0;
            lightness = Math.min(lightness + brightness * 0.4, 0.9);
        }
        
        // Energy affects saturation
        const energyLevel = audioFeatures.overall || audioFeatures.energy?.total || 0;
        saturation = Math.min(saturation + energyLevel * 0.2, 1.0);
        
        this.state.targetHue = targetHue;
        this.state.targetSaturation = saturation;
        this.state.targetLightness = lightness;
        
        // Smooth color transitions with adaptive speed
        const baseSpeed = visual.colorShift.speed * 0.02;
        const energySpeed = baseSpeed * (1 + energyLevel * 2); // Faster changes with more energy
        
        this.state.currentHue = this.lerpAngle(
            this.state.currentHue, 
            this.state.targetHue, 
            energySpeed
        );
        
        // Smooth saturation and lightness transitions
        this.state.currentSaturation = this.lerp(
            this.state.currentSaturation || saturation,
            this.state.targetSaturation,
            energySpeed
        );
        
        this.state.currentLightness = this.lerp(
            this.state.currentLightness || lightness,
            this.state.targetLightness,
            energySpeed
        );
    }
    
    /**
     * Trigger beat-driven effects
     */
    triggerBeatEffects(beatData) {
        const now = performance.now();
        this.state.lastBeatTime = now;
        this.state.beatIntensity = beatData.strength;
        
        // Create beat pulse effect
        this.createBeatPulse(beatData.strength, beatData.confidence);
        
        // Trigger particle burst
        this.createParticleBurst(beatData.strength);
        
        // Flash effect for strong beats
        if (beatData.strength > 0.7) {
            this.createFlashEffect(beatData.strength);
        }
        
        // Beat intensity decay
        setTimeout(() => {
            this.state.beatIntensity *= 0.5;
        }, 100);
    }
    
    /**
     * Create radial wave effect
     */
    createRadialWave(strength, speed) {
        if (!this.fluxApp.solver) return;
        
        const centerX = this.fluxApp.config.containerWidth / 2;
        const centerY = this.fluxApp.config.containerHeight / 2;
        const waveRadius = 200 * strength;
        
        // Apply radial force to particles
        for (let i = 0; i < this.fluxApp.config.particleCount; i++) {
            const positions = this.fluxApp.solver.get_positions();
            const x = positions[i * 2];
            const y = positions[i * 2 + 1];
            
            const dx = x - centerX;
            const dy = y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < waveRadius && distance > 0) {
                const force = (strength * 50) / (distance * 0.01 + 1);
                const forceX = (dx / distance) * force * speed;
                const forceY = (dy / distance) * force * speed;
                
                this.fluxApp.solver.apply_force(i, forceX, forceY);
            }
        }
    }
    
    /**
     * Create rhythmic pulse effect
     */
    createRhythmicPulse(strength) {
        if (!this.fluxApp.solver) return;
        
        const pulseForce = strength * 30;
        const centerX = this.fluxApp.config.containerWidth / 2;
        const centerY = this.fluxApp.config.containerHeight / 2;
        
        // Apply inward then outward pulse
        for (let i = 0; i < this.fluxApp.config.particleCount; i++) {
            const positions = this.fluxApp.solver.get_positions();
            const x = positions[i * 2];
            const y = positions[i * 2 + 1];
            
            const dx = centerX - x;
            const dy = centerY - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const normalizedX = dx / distance;
                const normalizedY = dy / distance;
                
                // Pulse inward first, then outward
                const forceX = normalizedX * pulseForce * Math.sin(Date.now() * 0.01);
                const forceY = normalizedY * pulseForce * Math.sin(Date.now() * 0.01);
                
                this.fluxApp.solver.apply_force(i, forceX, forceY);
            }
        }
    }
    
    /**
     * Create directional flow effect
     */
    createDirectionalFlow(strength, spectralCentroid) {
        if (!this.fluxApp.solver) return;
        
        // Flow direction based on spectral centroid
        const angle = (spectralCentroid / 22050) * Math.PI * 2;
        const flowX = Math.cos(angle) * strength * 20;
        const flowY = Math.sin(angle) * strength * 20;
        
        // Apply flow to all particles
        for (let i = 0; i < this.fluxApp.config.particleCount; i++) {
            this.fluxApp.solver.apply_force(i, flowX, flowY);
        }
    }
    
    /**
     * Create sparkle effect for high frequencies
     */
    createSparkleEffect(intensity) {
        if (!this.fluxApp.particleRenderer) return;
        
        const sparkleCount = Math.floor(intensity * 10);
        
        for (let i = 0; i < sparkleCount; i++) {
            const x = Math.random() * this.fluxApp.config.containerWidth;
            const y = Math.random() * this.fluxApp.config.containerHeight;
            
            // Create temporary sparkle particles
            this.createSparkleParticle(x, y, intensity);
        }
    }
    
    /**
     * Create individual sparkle particle
     */
    createSparkleParticle(x, y, intensity) {
        if (!this.fluxApp.particleRenderer?.container) return;
        
        try {
            // Create a temporary sparkle particle
            const sparkle = new PIXI.Graphics();
            
            // Sparkle size based on intensity
            const size = 2 + intensity * 3;
            
            // Bright sparkle with high-frequency color (white/yellow)
            sparkle.circle(0, 0, size * 2);
            sparkle.fill({ color: 0xffffff, alpha: 0.3 * intensity });
            
            sparkle.circle(0, 0, size);
            sparkle.fill({ color: 0xffff00, alpha: 0.8 * intensity }); // Yellow for high frequencies
            
            sparkle.circle(0, 0, size * 0.4);
            sparkle.fill({ color: 0xffffff, alpha: 1.0 });
            
            sparkle.x = x;
            sparkle.y = y;
            
            // Add sparkle animation properties
            sparkle.sparkleLife = 1.0;
            sparkle.sparkleDecay = 0.02 + intensity * 0.03;
            sparkle.sparkleScale = 1.0;
            
            // Add to container
            this.fluxApp.particleRenderer.container.addChild(sparkle);
            
            // Store reference for cleanup
            if (!this.sparkleParticles) {
                this.sparkleParticles = [];
            }
            this.sparkleParticles.push(sparkle);
            
            // Auto-remove after animation
            setTimeout(() => {
                if (sparkle.parent) {
                    sparkle.parent.removeChild(sparkle);
                    sparkle.destroy();
                }
                
                // Remove from array
                const index = this.sparkleParticles.indexOf(sparkle);
                if (index > -1) {
                    this.sparkleParticles.splice(index, 1);
                }
            }, 1000);
            
        } catch (error) {
            console.warn('Failed to create sparkle particle:', error);
        }
    }
    
    /**
     * Create shimmer effect
     */
    createShimmerEffect(intensity) {
        if (!this.fluxApp.particleRenderer) return;
        
        // Add shimmer to existing particles
        const shimmerIntensity = intensity * 0.3;
        
        // If the renderer has addShimmer method, use it
        if (this.fluxApp.particleRenderer.addShimmer) {
            this.fluxApp.particleRenderer.addShimmer(shimmerIntensity);
        } else {
            // Fallback: apply shimmer effect directly to particles
            this.applyShimmerToParticles(shimmerIntensity);
        }
    }
    
    /**
     * Apply shimmer effect directly to particles (fallback)
     */
    applyShimmerToParticles(intensity) {
        if (!this.fluxApp.particleRenderer?.particleGraphics) return;
        
        const particles = this.fluxApp.particleRenderer.particleGraphics;
        
        particles.forEach((particle, index) => {
            if (particle && particle.visible) {
                // Add subtle shimmer by varying alpha and scale
                const shimmerOffset = Math.sin(Date.now() * 0.01 + index * 0.1) * intensity;
                const baseAlpha = particle.alpha || 1.0;
                const baseScale = particle.scale?.x || 1.0;
                
                particle.alpha = Math.max(0.3, Math.min(1.0, baseAlpha + shimmerOffset * 0.3));
                
                if (particle.scale) {
                    const scaleVariation = 1.0 + shimmerOffset * 0.1;
                    particle.scale.set(baseScale * scaleVariation);
                }
            }
        });
    }
    
    /**
     * Update particle renderer with current effects
     */
    updateParticleRenderer(audioFeatures) {
        if (!this.fluxApp.particleRenderer) return;
        
        const renderer = this.fluxApp.particleRenderer;
        
        // Update colors with enhanced system
        if (renderer.updateAudioColors) {
            renderer.updateAudioColors(
                this.state.currentHue, 
                this.state.currentSaturation, 
                this.state.currentLightness
            );
        }
        
        // Update bloom intensity
        if (renderer.updateBloomIntensity) {
            renderer.updateBloomIntensity(this.state.bloomIntensity);
        }
        
        // Update particle sizes
        if (renderer.updateTrebleSizes) {
            renderer.updateTrebleSizes(audioFeatures.treble, audioFeatures.spectrum);
        }
        
        // Apply beat pulse
        if (this.state.beatIntensity > 0.1 && renderer.applyBeatPulse) {
            renderer.applyBeatPulse(this.state.beatIntensity);
        }
    }
    
    /**
     * Set gravity effect
     */
    setGravityEffect(strength) {
        // Implementation depends on physics solver capabilities
        // This is a placeholder for gravity modulation
    }
    
    /**
     * Set turbulence effect
     */
    setTurbulenceEffect(level) {
        // Implementation depends on physics solver capabilities
        // This is a placeholder for turbulence effects
    }
    
    /**
     * Set attraction effect
     */
    setAttractionEffect(strength) {
        // Implementation depends on physics solver capabilities
        // This is a placeholder for attraction forces
    }
    
    /**
     * Create beat pulse effect
     */
    createBeatPulse(strength, confidence) {
        if (!this.fluxApp.solver) return;
        
        const pulseStrength = strength * confidence * 40;
        const centerX = this.fluxApp.config.containerWidth / 2;
        const centerY = this.fluxApp.config.containerHeight / 2;
        
        // Radial pulse from center
        for (let i = 0; i < this.fluxApp.config.particleCount; i++) {
            const positions = this.fluxApp.solver.get_positions();
            const x = positions[i * 2];
            const y = positions[i * 2 + 1];
            
            const dx = x - centerX;
            const dy = y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const forceX = (dx / distance) * pulseStrength;
                const forceY = (dy / distance) * pulseStrength;
                
                this.fluxApp.solver.apply_force(i, forceX, forceY);
            }
        }
    }
    
    /**
     * Create particle burst effect
     */
    createParticleBurst(strength) {
        // Create temporary burst particles
        const burstCount = Math.floor(strength * 20);
        
        for (let i = 0; i < burstCount; i++) {
            const angle = (i / burstCount) * Math.PI * 2;
            const speed = strength * 100;
            const x = this.fluxApp.config.containerWidth / 2;
            const y = this.fluxApp.config.containerHeight / 2;
            
            // Create burst particle (implementation depends on particle system)
            this.createBurstParticle(x, y, angle, speed);
        }
    }
    
    /**
     * Create individual burst particle
     */
    createBurstParticle(x, y, angle, speed) {
        if (!this.fluxApp.particleRenderer?.container) return;
        
        try {
            // Create a temporary burst particle
            const burst = new PIXI.Graphics();
            
            // Burst particle appearance
            const size = 1.5 + Math.random() * 2;
            
            // Bright burst particle
            burst.circle(0, 0, size * 2);
            burst.fill({ color: 0xffffff, alpha: 0.4 });
            
            burst.circle(0, 0, size);
            burst.fill({ color: 0x00ffff, alpha: 0.8 }); // Cyan burst
            
            burst.x = x;
            burst.y = y;
            
            // Animation properties
            const velocityX = Math.cos(angle) * speed * 0.01;
            const velocityY = Math.sin(angle) * speed * 0.01;
            let life = 1.0;
            const decay = 0.02;
            
            // Animate the burst particle
            const animate = () => {
                if (life <= 0 || !burst.parent) {
                    if (burst.parent) {
                        burst.parent.removeChild(burst);
                        burst.destroy();
                    }
                    return;
                }
                
                // Update position
                burst.x += velocityX;
                burst.y += velocityY;
                
                // Update life and alpha
                life -= decay;
                burst.alpha = life;
                burst.scale.set(life);
                
                // Continue animation
                requestAnimationFrame(animate);
            };
            
            // Add to container and start animation
            this.fluxApp.particleRenderer.container.addChild(burst);
            animate();
            
        } catch (error) {
            console.warn('Failed to create burst particle:', error);
        }
    }
    
    /**
     * Create flash effect
     */
    createFlashEffect(strength) {
        if (!this.fluxApp.particleRenderer) return;
        
        // Temporary brightness boost
        const flashIntensity = strength * 2;
        
        // If the renderer has addFlash method, use it
        if (this.fluxApp.particleRenderer.addFlash) {
            this.fluxApp.particleRenderer.addFlash(flashIntensity);
        } else {
            // Fallback: apply flash effect directly
            this.applyFlashEffect(flashIntensity);
        }
    }
    
    /**
     * Apply flash effect directly (fallback)
     */
    applyFlashEffect(intensity) {
        if (!this.fluxApp.particleRenderer?.container) return;
        
        try {
            // Create a temporary flash overlay
            const flash = new PIXI.Graphics();
            flash.rect(0, 0, this.fluxApp.config.containerWidth, this.fluxApp.config.containerHeight);
            flash.fill({ color: 0xffffff, alpha: intensity * 0.3 });
            
            // Add flash to container
            this.fluxApp.particleRenderer.container.addChild(flash);
            
            // Fade out the flash
            let alpha = intensity * 0.3;
            const fadeOut = () => {
                alpha *= 0.8;
                flash.alpha = alpha;
                
                if (alpha < 0.01) {
                    if (flash.parent) {
                        flash.parent.removeChild(flash);
                        flash.destroy();
                    }
                } else {
                    requestAnimationFrame(fadeOut);
                }
            };
            
            fadeOut();
            
        } catch (error) {
            console.warn('Failed to create flash effect:', error);
        }
    }
    
    /**
     * Helper methods
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    lerpAngle(a, b, t) {
        const diff = ((b - a + 540) % 360) - 180;
        return (a + diff * t + 360) % 360;
    }
    
    /**
     * Reset all effects to default state
     */
    resetEffects() {
        this.state.currentHue = 180;
        this.state.targetHue = 180;
        this.state.bloomIntensity = 1.0;
        this.state.particleScale = 1.0;
        this.state.beatIntensity = 0;
        
        if (this.fluxApp.particleRenderer) {
            this.fluxApp.particleRenderer.resetAudioEffects();
        }
    }
    
    /**
     * Adjust performance based on system capabilities
     */
    adjustPerformance(targetFPS) {
        const currentFPS = this.fluxApp.performanceMonitor?.frameRate || 60;
        
        if (currentFPS < targetFPS * 0.8) {
            // Reduce update frequency
            this.skipFrames = Math.min(this.skipFrames + 1, 3);
            console.log('🔧 Reducing audio effect update frequency for performance');
        } else if (currentFPS > targetFPS * 0.95 && this.skipFrames > 0) {
            // Increase update frequency
            this.skipFrames = Math.max(this.skipFrames - 1, 0);
            console.log('🔧 Increasing audio effect update frequency');
        }
    }
    
    /**
     * Linear interpolation helper
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
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
     * Get current effect status
     */
    getStatus() {
        return {
            enabled: this.isEnabled,
            mode: this.mode,
            currentHue: this.state.currentHue,
            bloomIntensity: this.state.bloomIntensity,
            particleScale: this.state.particleScale,
            beatIntensity: this.state.beatIntensity,
            skipFrames: this.skipFrames,
            updateCounter: this.updateCounter,
            particleGroups: {
                bass: this.particleGroups.bass.particles.length,
                mid: this.particleGroups.mid.particles.length,
                treble: this.particleGroups.treble.particles.length,
                initialized: this.state.groupsInitialized
            },
            beatDetection: {
                threshold: this.beatDetection.adaptiveThreshold,
                confidence: this.beatDetection.confidence,
                variance: this.beatDetection.variance
            }
        };
    }
}