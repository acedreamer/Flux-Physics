/**
 * Enhanced Audio Improvements for FLUX
 * Advanced audio-reactive features to make particles more responsive and visually stunning
 */

export class EnhancedAudioImprovements {
    constructor(fluxApp) {
        this.fluxApp = fluxApp;
        this.isEnabled = false;
        
        // Advanced audio analysis
        this.audioFeatures = {
            spectralCentroid: 0,
            spectralRolloff: 0,
            spectralFlux: 0,
            zeroCrossingRate: 0,
            mfcc: new Float32Array(13), // Mel-frequency cepstral coefficients
            chroma: new Float32Array(12), // Chromagram for harmonic content
            tempo: 120, // BPM detection
            key: 'C', // Musical key detection
            loudness: 0 // Perceptual loudness
        };
        
        // Particle behavior improvements
        this.particleBehaviors = {
            // Frequency-based particle groups
            frequencyGroups: {
                bass: { particles: [], color: 0x0066ff, behavior: 'heavy' },
                mid: { particles: [], color: 0x00ffff, behavior: 'flowing' },
                treble: { particles: [], color: 0xffff00, behavior: 'sparkly' }
            },
            
            // Advanced movement patterns
            movementPatterns: {
                spiral: { enabled: false, intensity: 0 },
                wave: { enabled: false, frequency: 1, amplitude: 50 },
                orbit: { enabled: false, centers: [], radius: 100 },
                flock: { enabled: false, cohesion: 0.5, separation: 0.3, alignment: 0.2 }
            },
            
            // Particle trails and history
            trailSystem: {
                enabled: true,
                maxLength: 20,
                fadeRate: 0.95,
                colorTrails: true
            }
        };
        
        // Visual enhancements
        this.visualEnhancements = {
            // Advanced bloom effects
            multiLayerBloom: {
                enabled: false,
                layers: [
                    { threshold: 0.1, intensity: 1.0, blur: 4 },
                    { threshold: 0.3, intensity: 0.8, blur: 8 },
                    { threshold: 0.6, intensity: 0.6, blur: 16 }
                ]
            },
            
            // Particle morphing
            morphing: {
                enabled: false,
                shapes: ['circle', 'star', 'diamond', 'triangle'],
                morphSpeed: 0.1
            },
            
            // Dynamic backgrounds
            backgroundReactivity: {
                enabled: false,
                gridPulse: true,
                colorShift: true,
                scanlineIntensity: 0.5
            }
        };
        
        // Performance optimization
        this.performance = {
            adaptiveQuality: true,
            targetFPS: 60,
            particleCount: 800,
            maxParticleCount: 1500,
            minParticleCount: 200,
            qualityLevel: 'high' // high, medium, low
        };
    }
    
    /**
     * Initialize enhanced audio improvements
     */
    async initialize() {
        console.log('🎵 Initializing Enhanced Audio Improvements...');
        
        // Setup frequency-based particle groups
        this.setupFrequencyGroups();
        
        // Initialize advanced audio analysis
        this.setupAdvancedAudioAnalysis();
        
        // Setup visual enhancements
        this.setupVisualEnhancements();
        
        // Enable adaptive performance
        this.setupAdaptivePerformance();
        
        this.isEnabled = true;
        console.log('✅ Enhanced Audio Improvements initialized');
    }
    
    /**
     * Setup frequency-based particle groups
     * Different particles react to different frequency ranges
     */
    setupFrequencyGroups() {
        const totalParticles = this.fluxApp.config.particleCount;
        const bassCount = Math.floor(totalParticles * 0.3); // 30% for bass
        const midCount = Math.floor(totalParticles * 0.5);  // 50% for mids
        const trebleCount = totalParticles - bassCount - midCount; // Rest for treble
        
        // Assign particles to frequency groups
        for (let i = 0; i < totalParticles; i++) {
            if (i < bassCount) {
                this.particleBehaviors.frequencyGroups.bass.particles.push(i);
            } else if (i < bassCount + midCount) {
                this.particleBehaviors.frequencyGroups.mid.particles.push(i);
            } else {
                this.particleBehaviors.frequencyGroups.treble.particles.push(i);
            }
        }
        
        console.log('🎛️ Particle groups assigned:', {
            bass: bassCount,
            mid: midCount,
            treble: trebleCount
        });
    }
    
    /**
     * Setup advanced audio analysis features
     */
    setupAdvancedAudioAnalysis() {
        // Initialize MFCC analysis for timbre detection
        this.mfccAnalyzer = new MFCCAnalyzer();
        
        // Initialize tempo detection
        this.tempoDetector = new TempoDetector();
        
        // Initialize key detection
        this.keyDetector = new KeyDetector();
        
        console.log('🔬 Advanced audio analysis setup complete');
    }
    
    /**
     * Setup visual enhancements
     */
    setupVisualEnhancements() {
        // Setup multi-layer bloom if supported
        if (this.visualEnhancements.multiLayerBloom.enabled) {
            this.setupMultiLayerBloom();
        }
        
        // Setup particle morphing system
        if (this.visualEnhancements.morphing.enabled) {
            this.setupParticleMorphing();
        }
        
        // Setup background reactivity
        if (this.visualEnhancements.backgroundReactivity.enabled) {
            this.setupBackgroundReactivity();
        }
    }
    
    /**
     * Main update method with enhanced audio processing
     */
    update(audioData) {
        if (!this.isEnabled) return;
        
        // Analyze advanced audio features
        this.analyzeAdvancedFeatures(audioData);
        
        // Update frequency-based particle groups
        this.updateFrequencyGroups(audioData);
        
        // Apply advanced movement patterns
        this.applyAdvancedMovementPatterns(audioData);
        
        // Update visual enhancements
        this.updateVisualEnhancements(audioData);
        
        // Optimize performance if needed
        this.optimizePerformance();
    }
    
    /**
     * Analyze advanced audio features
     */
    analyzeAdvancedFeatures(audioData) {
        // Calculate spectral centroid (brightness)
        this.audioFeatures.spectralCentroid = this.calculateSpectralCentroid(audioData.spectrum);
        
        // Calculate spectral rolloff (frequency distribution)
        this.audioFeatures.spectralRolloff = this.calculateSpectralRolloff(audioData.spectrum);
        
        // Calculate spectral flux (rate of change)
        this.audioFeatures.spectralFlux = this.calculateSpectralFlux(audioData.spectrum);
        
        // Analyze MFCC for timbre
        this.audioFeatures.mfcc = this.mfccAnalyzer.analyze(audioData.spectrum);
        
        // Detect tempo
        this.audioFeatures.tempo = this.tempoDetector.detect(audioData);
        
        // Detect musical key
        this.audioFeatures.key = this.keyDetector.detect(audioData.spectrum);
        
        // Calculate perceptual loudness
        this.audioFeatures.loudness = this.calculateLoudness(audioData);
    }
    
    /**
     * Update frequency-based particle groups with specialized behaviors
     */
    updateFrequencyGroups(audioData) {
        const { bass, mids, treble } = audioData;
        
        // Bass particles: Heavy, slow, gravitational
        this.updateBassParticles(bass);
        
        // Mid particles: Flowing, responsive, harmonic
        this.updateMidParticles(mids);
        
        // Treble particles: Light, sparkly, quick
        this.updateTrebleParticles(treble);
    }
    
    /**
     * Update bass particles with heavy, gravitational behavior
     */
    updateBassParticles(bassLevel) {
        const bassParticles = this.particleBehaviors.frequencyGroups.bass.particles;
        
        bassParticles.forEach(particleIndex => {
            if (!this.fluxApp.solver) return;
            
            // Apply strong gravitational pull toward center
            const centerX = this.fluxApp.config.containerWidth / 2;
            const centerY = this.fluxApp.config.containerHeight / 2;
            
            const positions = this.fluxApp.solver.get_positions();
            const x = positions[particleIndex * 2];
            const y = positions[particleIndex * 2 + 1];
            
            const dx = centerX - x;
            const dy = centerY - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const force = bassLevel * 100; // Strong force for bass
                const forceX = (dx / distance) * force;
                const forceY = (dy / distance) * force;
                
                this.fluxApp.solver.apply_force(particleIndex, forceX, forceY);
            }
            
            // Make bass particles larger and more blue
            const particle = this.fluxApp.particleRenderer.particleGraphics[particleIndex];
            if (particle) {
                const scale = 1.0 + bassLevel * 0.8;
                particle.scale.set(scale);
                
                // Shift color toward blue for bass
                const blueIntensity = bassLevel * 0.5;
                this.updateParticleColor(particle, 240, 1.0, 0.5 + blueIntensity);
            }
        });
    }
    
    /**
     * Update mid particles with flowing, harmonic behavior
     */
    updateMidParticles(midLevel) {
        const midParticles = this.particleBehaviors.frequencyGroups.mid.particles;
        
        midParticles.forEach(particleIndex => {
            if (!this.fluxApp.solver) return;
            
            // Create flowing movement based on spectral centroid
            const flowAngle = (this.audioFeatures.spectralCentroid / 22050) * Math.PI * 2;
            const flowStrength = midLevel * 50;
            
            const forceX = Math.cos(flowAngle) * flowStrength;
            const forceY = Math.sin(flowAngle) * flowStrength;
            
            this.fluxApp.solver.apply_force(particleIndex, forceX, forceY);
            
            // Mid particles get cyan color and moderate scaling
            const particle = this.fluxApp.particleRenderer.particleGraphics[particleIndex];
            if (particle) {
                const scale = 1.0 + midLevel * 0.4;
                particle.scale.set(scale);
                
                // Cyan color for mids
                this.updateParticleColor(particle, 180, 1.0, 0.5);
            }
        });
    }
    
    /**
     * Update treble particles with light, sparkly behavior
     */
    updateTrebleParticles(trebleLevel) {
        const trebleParticles = this.particleBehaviors.frequencyGroups.treble.particles;
        
        trebleParticles.forEach(particleIndex => {
            if (!this.fluxApp.solver) return;
            
            // Create random sparkly movement
            const randomAngle = Math.random() * Math.PI * 2;
            const sparkleStrength = trebleLevel * 30;
            
            const forceX = Math.cos(randomAngle) * sparkleStrength;
            const forceY = Math.sin(randomAngle) * sparkleStrength;
            
            this.fluxApp.solver.apply_force(particleIndex, forceX, forceY);
            
            // Treble particles are smaller but brighter
            const particle = this.fluxApp.particleRenderer.particleGraphics[particleIndex];
            if (particle) {
                const scale = 0.8 + trebleLevel * 0.6;
                particle.scale.set(scale);
                
                // Yellow/white color for treble
                const hue = 60 + trebleLevel * 60; // Yellow to white
                this.updateParticleColor(particle, hue, 1.0, 0.7);
            }
        });
    }
    
    /**
     * Apply advanced movement patterns
     */
    applyAdvancedMovementPatterns(audioData) {
        // Spiral pattern for high energy
        if (audioData.overall > 0.7) {
            this.applySpiral(audioData.overall);
        }
        
        // Wave pattern for rhythmic content
        if (audioData.beat && audioData.beat.isBeat) {
            this.applyWavePattern(audioData.beat.strength);
        }
        
        // Orbital pattern for harmonic content
        if (this.audioFeatures.spectralCentroid > 5000) {
            this.applyOrbitalPattern();
        }
    }
    
    /**
     * Apply spiral movement pattern
     */
    applySpiral(intensity) {
        if (!this.fluxApp.solver) return;
        
        const centerX = this.fluxApp.config.containerWidth / 2;
        const centerY = this.fluxApp.config.containerHeight / 2;
        const time = performance.now() * 0.001;
        
        for (let i = 0; i < this.fluxApp.config.particleCount; i++) {
            const positions = this.fluxApp.solver.get_positions();
            const x = positions[i * 2];
            const y = positions[i * 2 + 1];
            
            const dx = x - centerX;
            const dy = y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                // Create spiral force
                const angle = Math.atan2(dy, dx) + intensity * 0.1;
                const spiralForce = intensity * 20;
                
                const forceX = Math.cos(angle) * spiralForce;
                const forceY = Math.sin(angle) * spiralForce;
                
                this.fluxApp.solver.apply_force(i, forceX, forceY);
            }
        }
    }
    
    /**
     * Apply wave movement pattern
     */
    applyWavePattern(beatStrength) {
        if (!this.fluxApp.solver) return;
        
        const time = performance.now() * 0.001;
        const waveFreq = this.audioFeatures.tempo / 60; // Convert BPM to Hz
        
        for (let i = 0; i < this.fluxApp.config.particleCount; i++) {
            const positions = this.fluxApp.solver.get_positions();
            const x = positions[i * 2];
            
            // Create wave force based on x position and time
            const wavePhase = (x / this.fluxApp.config.containerWidth) * Math.PI * 2;
            const waveAmplitude = beatStrength * 50;
            const waveForce = Math.sin(wavePhase + time * waveFreq) * waveAmplitude;
            
            this.fluxApp.solver.apply_force(i, 0, waveForce);
        }
    }
    
    /**
     * Apply orbital movement pattern
     */
    applyOrbitalPattern() {
        // Create orbital centers based on harmonic content
        const centers = [
            { x: this.fluxApp.config.containerWidth * 0.3, y: this.fluxApp.config.containerHeight * 0.3 },
            { x: this.fluxApp.config.containerWidth * 0.7, y: this.fluxApp.config.containerHeight * 0.7 }
        ];
        
        centers.forEach((center, centerIndex) => {
            const startIndex = centerIndex * Math.floor(this.fluxApp.config.particleCount / centers.length);
            const endIndex = (centerIndex + 1) * Math.floor(this.fluxApp.config.particleCount / centers.length);
            
            for (let i = startIndex; i < endIndex && i < this.fluxApp.config.particleCount; i++) {
                const positions = this.fluxApp.solver.get_positions();
                const x = positions[i * 2];
                const y = positions[i * 2 + 1];
                
                const dx = x - center.x;
                const dy = y - center.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    // Create orbital force (perpendicular to radius)
                    const orbitalForce = 30;
                    const forceX = -dy / distance * orbitalForce;
                    const forceY = dx / distance * orbitalForce;
                    
                    this.fluxApp.solver.apply_force(i, forceX, forceY);
                }
            }
        });
    }
    
    /**
     * Update particle color with HSL values
     */
    updateParticleColor(particle, hue, saturation, lightness) {
        const rgb = this.hslToRgb(hue / 360, saturation, lightness);
        const color = (rgb.r << 16) | (rgb.g << 8) | rgb.b;
        
        // Redraw particle with new color
        particle.clear();
        particle.circle(0, 0, 3);
        particle.fill({ color: color, alpha: 0.8 });
        particle.circle(0, 0, 1.5);
        particle.fill({ color: 0xffffff, alpha: 1.0 });
    }
    
    /**
     * HSL to RGB conversion
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
    
    // Placeholder classes for advanced audio analysis
    // These would need full implementations
}

class MFCCAnalyzer {
    analyze(spectrum) {
        // Placeholder for MFCC analysis
        return new Float32Array(13);
    }
}

class TempoDetector {
    detect(audioData) {
        // Placeholder for tempo detection
        return 120;
    }
}

class KeyDetector {
    detect(spectrum) {
        // Placeholder for key detection
        return 'C';
    }
}