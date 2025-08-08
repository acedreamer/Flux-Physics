/**
 * Enhanced Particle Trail System
 * Creates color-gradient trails with audio-reactive properties
 */

import * as PIXI from 'pixi.js';

export class EnhancedParticleTrails {
    constructor(fluxApp) {
        this.fluxApp = fluxApp;
        this.isEnabled = false;
        
        // Trail configuration
        this.config = {
            maxTrailLength: 20,
            minTrailLength: 5,
            fadeRate: 0.95,
            colorGradient: true,
            audioReactive: true,
            energyLengthMultiplier: 1.5,
            trebleFadeMultiplier: 1.3,
            bassThicknessMultiplier: 1.2
        };
        
        // Trail storage
        this.particleTrails = [];
        this.trailGraphics = [];
        this.trailContainer = null;
        
        // Audio-reactive settings
        this.audioSettings = {
            enabled: true,
            lengthSensitivity: 1.0,
            colorSensitivity: 1.0,
            fadeSensitivity: 0.8,
            thicknessSensitivity: 0.5
        };
        
        // Color system
        this.colorSystem = {
            baseHue: 180,
            currentHue: 180,
            saturation: 0.8,
            lightness: 0.5,
            hueShiftSpeed: 0.02,
            gradientSteps: 10
        };
        
        // Performance settings
        this.performance = {
            updateInterval: 1, // Update every frame
            frameCounter: 0,
            maxTrailsPerFrame: 50,
            cullingDistance: 1000
        };
        
        console.log('✨ Enhanced Particle Trails initialized');
    }
    
    /**
     * Initialize the trail system
     */
    async initialize() {
        try {
            console.log('🚀 Initializing enhanced particle trails...');
            
            // Create trail container (may be deferred if PIXI not ready)
            const containerCreated = this.createTrailContainer();
            if (!containerCreated) {
                console.log('⏳ Trail container creation deferred - will retry later');
            }
            
            // Initialize trail arrays
            this.initializeTrailArrays();
            
            this.isEnabled = true;
            console.log('✅ Enhanced particle trails initialized');
            
            return { success: true, message: 'Enhanced trails ready' };
            
        } catch (error) {
            console.error('❌ Failed to initialize enhanced trails:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Create trail container
     */
    createTrailContainer() {
        // Check multiple possible paths for PIXI app
        const pixiApp = this.fluxApp.pixiApp || 
                       this.fluxApp.particleRenderer?.pixiApp ||
                       this.fluxApp.renderer?.pixiApp;
                       
        if (!pixiApp) {
            console.warn('⚠️ PIXI app not available, deferring trail container creation');
            // Return early but don't throw - we'll try again later
            return false;
        }
        
        this.trailContainer = new PIXI.Container();
        this.trailContainer.name = 'enhanced-trails';
        
        // Add container to the stage (behind particles)
        const stage = this.fluxApp.particleRenderer.pixiApp.stage;
        const particleContainer = this.fluxApp.particleRenderer.container;
        
        if (particleContainer) {
            // Insert trail container before particle container
            const particleIndex = stage.getChildIndex(particleContainer);
            stage.addChildAt(this.trailContainer, particleIndex);
        } else {
            stage.addChild(this.trailContainer);
        }
        
        console.log('📦 Trail container created and added to stage');
        return true;
    }
    
    /**
     * Retry creating trail container if it failed initially
     */
    retryContainerCreation() {
        if (!this.trailContainer) {
            console.log('🔄 Retrying trail container creation...');
            return this.createTrailContainer();
        }
        return true;
    }
    
    /**
     * Initialize trail arrays
     */
    initializeTrailArrays() {
        const particleCount = this.fluxApp.config?.particleCount || 800;
        
        // Initialize trail data for each particle
        this.particleTrails = new Array(particleCount);
        this.trailGraphics = new Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            this.particleTrails[i] = {
                points: [],
                colors: [],
                alphas: [],
                thickness: 1.0,
                maxLength: this.config.maxTrailLength,
                fadeRate: this.config.fadeRate,
                lastUpdate: 0
            };
            
            // Create graphics object for this trail
            this.trailGraphics[i] = new PIXI.Graphics();
            this.trailContainer.addChild(this.trailGraphics[i]);
        }
        
        console.log(`🎨 Initialized ${particleCount} particle trails`);
    }
    
    /**
     * Update trails based on particle positions and audio data
     */
    update(particlePositions, audioData) {
        if (!this.isEnabled || !particlePositions) return;
        
        this.performance.frameCounter++;
        
        // Skip frames for performance if needed
        if (this.performance.frameCounter % this.performance.updateInterval !== 0) {
            return;
        }
        
        try {
            // Safety check - ensure PIXI and container are available
            if (!this.trailContainer || typeof PIXI === 'undefined') {
                console.warn('⚠️ Enhanced trails: PIXI or container not available, skipping update');
                return;
            }
            
            // Update color system based on audio
            this.updateColorSystem(audioData);
            
            // Update trail configuration based on audio
            this.updateAudioReactiveSettings(audioData);
            
            // Update individual particle trails
            this.updateParticleTrails(particlePositions, audioData);
            
            // Render trails
            this.renderTrails();
            
        } catch (error) {
            console.warn('Enhanced trails update error:', error);
        }
    }
    
    /**
     * Update color system based on audio data
     */
    updateColorSystem(audioData) {
        if (!audioData || !this.audioSettings.enabled) return;
        
        // Calculate target hue based on dominant frequency
        let targetHue = this.colorSystem.baseHue;
        
        const bassLevel = audioData.bass || 0;
        const midLevel = audioData.mids || 0;
        const trebleLevel = audioData.treble || 0;
        
        if (bassLevel > 0.3) {
            targetHue = 240; // Blue for bass
        } else if (trebleLevel > 0.2) {
            targetHue = 60;  // Yellow for treble
        } else if (midLevel > 0.25) {
            targetHue = 180; // Cyan for mids
        }
        
        // Add spectral centroid influence
        if (audioData.spectral?.centroid) {
            const spectralInfluence = (audioData.spectral.centroid / 22050) * 120;
            targetHue = (targetHue + spectralInfluence) % 360;
        }
        
        // Smooth hue transition
        const hueSpeed = this.colorSystem.hueShiftSpeed * (1 + (audioData.overall || 0));
        this.colorSystem.currentHue = this.lerpAngle(
            this.colorSystem.currentHue,
            targetHue,
            hueSpeed * this.audioSettings.colorSensitivity
        );
        
        // Update saturation and lightness based on energy
        const energyLevel = audioData.overall || 0;
        this.colorSystem.saturation = Math.min(0.8 + energyLevel * 0.2, 1.0);
        this.colorSystem.lightness = Math.min(0.5 + energyLevel * 0.3, 0.8);
    }
    
    /**
     * Update audio-reactive settings
     */
    updateAudioReactiveSettings(audioData) {
        if (!audioData || !this.audioSettings.enabled) return;
        
        const energyLevel = audioData.overall || 0;
        const trebleLevel = audioData.treble || 0;
        const bassLevel = audioData.bass || 0;
        
        // Adjust trail length based on energy
        const energyLengthMultiplier = 1 + energyLevel * this.config.energyLengthMultiplier;
        this.currentMaxLength = Math.floor(
            this.config.maxTrailLength * energyLengthMultiplier * this.audioSettings.lengthSensitivity
        );
        this.currentMaxLength = Math.max(this.config.minTrailLength, Math.min(this.currentMaxLength, 40));
        
        // Adjust fade rate based on treble
        this.currentFadeRate = this.config.fadeRate * (1 + trebleLevel * this.config.trebleFadeMultiplier * this.audioSettings.fadeSensitivity);
        this.currentFadeRate = Math.max(0.8, Math.min(this.currentFadeRate, 0.99));
        
        // Adjust thickness based on bass
        this.currentThickness = 1.0 + bassLevel * this.config.bassThicknessMultiplier * this.audioSettings.thicknessSensitivity;
        this.currentThickness = Math.max(0.5, Math.min(this.currentThickness, 3.0));
    }
    
    /**
     * Update individual particle trails
     */
    updateParticleTrails(positions, audioData) {
        const now = performance.now();
        const particleCount = Math.min(positions.length / 2, this.particleTrails.length);
        
        for (let i = 0; i < particleCount; i++) {
            const trail = this.particleTrails[i];
            if (!trail) continue;
            
            // Get current particle position
            const x = positions[i * 2];
            const y = positions[i * 2 + 1];
            
            // Skip if position is invalid
            if (isNaN(x) || isNaN(y)) continue;
            
            // Add new point to trail
            trail.points.push({ x, y, time: now });
            
            // Calculate color for this point
            const pointColor = this.calculatePointColor(i, trail.points.length - 1, audioData);
            trail.colors.push(pointColor);
            
            // Calculate alpha for this point
            trail.alphas.push(1.0);
            
            // Update trail properties
            trail.maxLength = this.currentMaxLength || this.config.maxTrailLength;
            trail.fadeRate = this.currentFadeRate || this.config.fadeRate;
            trail.thickness = this.currentThickness || 1.0;
            
            // Remove old points
            while (trail.points.length > trail.maxLength) {
                trail.points.shift();
                trail.colors.shift();
                trail.alphas.shift();
            }
            
            // Update alphas with fade
            for (let j = 0; j < trail.alphas.length; j++) {
                trail.alphas[j] *= trail.fadeRate;
            }
            
            // Remove points with very low alpha
            while (trail.alphas.length > 0 && trail.alphas[0] < 0.01) {
                trail.points.shift();
                trail.colors.shift();
                trail.alphas.shift();
            }
            
            trail.lastUpdate = now;
        }
    }
    
    /**
     * Calculate color for a trail point
     */
    calculatePointColor(particleIndex, pointIndex, audioData) {
        if (!this.config.colorGradient) {
            // Use current system color
            return this.hslToRgb(
                this.colorSystem.currentHue / 360,
                this.colorSystem.saturation,
                this.colorSystem.lightness
            );
        }
        
        // Create gradient based on point position in trail
        const trail = this.particleTrails[particleIndex];
        const progress = pointIndex / Math.max(trail.points.length - 1, 1);
        
        // Vary hue along the trail
        const hueVariation = progress * 60; // 60 degree variation
        const pointHue = (this.colorSystem.currentHue + hueVariation) % 360;
        
        // Vary lightness for depth effect
        const lightnessVariation = progress * 0.3;
        const pointLightness = Math.max(0.2, this.colorSystem.lightness - lightnessVariation);
        
        return this.hslToRgb(
            pointHue / 360,
            this.colorSystem.saturation,
            pointLightness
        );
    }
    
    /**
     * Render all trails
     */
    renderTrails() {
        const maxTrailsThisFrame = this.performance.maxTrailsPerFrame;
        let trailsRendered = 0;
        
        for (let i = 0; i < this.trailGraphics.length && trailsRendered < maxTrailsThisFrame; i++) {
            const graphics = this.trailGraphics[i];
            const trail = this.particleTrails[i];
            
            if (!graphics || !trail || trail.points.length < 2) {
                if (graphics) graphics.clear();
                continue;
            }
            
            // Check if trail is on screen (culling)
            if (this.shouldCullTrail(trail)) {
                graphics.clear();
                continue;
            }
            
            this.renderTrail(graphics, trail);
            trailsRendered++;
        }
    }
    
    /**
     * Check if trail should be culled (off-screen)
     */
    shouldCullTrail(trail) {
        if (trail.points.length === 0) return true;
        
        const lastPoint = trail.points[trail.points.length - 1];
        const canvasWidth = this.fluxApp.config?.containerWidth || 800;
        const canvasHeight = this.fluxApp.config?.containerHeight || 600;
        const cullingMargin = 100;
        
        return lastPoint.x < -cullingMargin || 
               lastPoint.x > canvasWidth + cullingMargin ||
               lastPoint.y < -cullingMargin || 
               lastPoint.y > canvasHeight + cullingMargin;
    }
    
    /**
     * Render individual trail
     */
    renderTrail(graphics, trail) {
        graphics.clear();
        
        if (trail.points.length < 2) return;
        
        // Draw trail as connected line segments with varying properties
        for (let i = 1; i < trail.points.length; i++) {
            const prevPoint = trail.points[i - 1];
            const currentPoint = trail.points[i];
            const alpha = trail.alphas[i];
            
            if (alpha < 0.01) continue;
            
            // Calculate line thickness based on position in trail
            const progress = i / (trail.points.length - 1);
            const thickness = trail.thickness * (0.3 + progress * 0.7);
            
            // Get color for this segment
            const color = trail.colors[i];
            const pixiColor = (color.r << 16) | (color.g << 8) | color.b;
            
            // Draw line segment
            graphics.lineStyle({
                width: thickness,
                color: pixiColor,
                alpha: alpha,
                cap: 'round',
                join: 'round'
            });
            
            if (i === 1) {
                graphics.moveTo(prevPoint.x, prevPoint.y);
            }
            graphics.lineTo(currentPoint.x, currentPoint.y);
        }
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
    
    /**
     * Lerp between angles (handles 360-degree wraparound)
     */
    lerpAngle(a, b, t) {
        const diff = ((b - a + 540) % 360) - 180;
        return (a + diff * t + 360) % 360;
    }
    
    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('⚙️ Enhanced trails config updated:', this.config);
    }
    
    /**
     * Update audio settings
     */
    updateAudioSettings(newSettings) {
        this.audioSettings = { ...this.audioSettings, ...newSettings };
        console.log('🎵 Enhanced trails audio settings updated:', this.audioSettings);
    }
    
    /**
     * Clear all trails
     */
    clearTrails() {
        this.particleTrails.forEach(trail => {
            if (trail) {
                trail.points = [];
                trail.colors = [];
                trail.alphas = [];
            }
        });
        
        this.trailGraphics.forEach(graphics => {
            if (graphics) graphics.clear();
        });
        
        console.log('🧹 All trails cleared');
    }
    
    /**
     * Enable enhanced trails
     */
    enable() {
        this.isEnabled = true;
        if (this.trailContainer) {
            this.trailContainer.visible = true;
        }
        console.log('✅ Enhanced particle trails enabled');
    }
    
    /**
     * Disable enhanced trails
     */
    disable() {
        this.isEnabled = false;
        if (this.trailContainer) {
            this.trailContainer.visible = false;
        }
        this.clearTrails();
        console.log('❌ Enhanced particle trails disabled');
    }
    
    /**
     * Get current status
     */
    getStatus() {
        return {
            enabled: this.isEnabled,
            config: this.config,
            audioSettings: this.audioSettings,
            colorSystem: this.colorSystem,
            performance: {
                frameCounter: this.performance.frameCounter,
                activeTrails: this.particleTrails.filter(trail => trail && trail.points.length > 0).length
            },
            trailCount: this.particleTrails.length
        };
    }
    
    /**
     * Cleanup resources
     */
    destroy() {
        this.disable();
        
        // Remove trail graphics
        this.trailGraphics.forEach(graphics => {
            if (graphics && graphics.parent) {
                graphics.parent.removeChild(graphics);
                graphics.destroy();
            }
        });
        
        // Remove trail container
        if (this.trailContainer && this.trailContainer.parent) {
            this.trailContainer.parent.removeChild(this.trailContainer);
            this.trailContainer.destroy();
        }
        
        this.trailGraphics = [];
        this.particleTrails = [];
        this.trailContainer = null;
        
        console.log('🗑️ Enhanced particle trails destroyed');
    }
}