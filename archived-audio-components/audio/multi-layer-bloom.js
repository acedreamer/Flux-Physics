/**
 * Multi-Layer Bloom System for Enhanced Audio Reactivity
 * Creates multiple bloom layers with different thresholds and intensities
 */

import * as PIXI from 'pixi.js';

export class MultiLayerBloom {
    constructor(fluxApp) {
        this.fluxApp = fluxApp;
        this.isEnabled = false;
        
        // Bloom layer configurations
        this.bloomLayers = [
            {
                name: 'subtle',
                threshold: 0.1,
                intensity: 1.0,
                blur: 4,
                quality: 4,
                filter: null,
                audioReactive: true,
                bassMultiplier: 0.5,
                midMultiplier: 0.3,
                trebleMultiplier: 0.2
            },
            {
                name: 'medium',
                threshold: 0.3,
                intensity: 0.8,
                blur: 8,
                quality: 6,
                filter: null,
                audioReactive: true,
                bassMultiplier: 0.3,
                midMultiplier: 0.5,
                trebleMultiplier: 0.4
            },
            {
                name: 'bright',
                threshold: 0.6,
                intensity: 0.6,
                blur: 16,
                quality: 8,
                filter: null,
                audioReactive: true,
                bassMultiplier: 0.2,
                midMultiplier: 0.2,
                trebleMultiplier: 0.8
            }
        ];
        
        // Audio-reactive settings
        this.audioSettings = {
            enabled: true,
            sensitivity: 1.0,
            beatMultiplier: 1.5,
            energyMultiplier: 1.2,
            smoothing: 0.8
        };
        
        // State tracking
        this.state = {
            baseIntensities: [1.0, 0.8, 0.6],
            currentIntensities: [1.0, 0.8, 0.6],
            targetIntensities: [1.0, 0.8, 0.6],
            lastBeatTime: 0,
            beatDecay: 1.0
        };
        
        console.log('🌟 Multi-Layer Bloom system initialized');
    }
    
    /**
     * Initialize the multi-layer bloom system
     */
    async initialize() {
        try {
            console.log('🚀 Initializing multi-layer bloom...');
            
            // Check if AdvancedBloomFilter is available
            if (!window.PIXI || !window.PIXI.filters || !window.PIXI.filters.AdvancedBloomFilter) {
                console.warn('⚠️ AdvancedBloomFilter not available, using fallback');
                return this.initializeFallback();
            }
            
            // Create bloom filters for each layer
            this.createBloomLayers();
            
            // Apply filters to the particle container
            this.applyFilters();
            
            this.isEnabled = true;
            console.log('✅ Multi-layer bloom initialized successfully');
            
            return { success: true, message: 'Multi-layer bloom ready' };
            
        } catch (error) {
            console.error('❌ Failed to initialize multi-layer bloom:', error);
            return this.initializeFallback();
        }
    }
    
    /**
     * Create bloom filter layers
     */
    createBloomLayers() {
        this.bloomLayers.forEach((layer, index) => {
            try {
                // Create AdvancedBloomFilter for this layer
                const filter = new PIXI.filters.AdvancedBloomFilter({
                    threshold: layer.threshold,
                    bloomScale: layer.intensity,
                    brightness: 1.0,
                    blur: layer.blur,
                    quality: layer.quality
                });
                
                layer.filter = filter;
                this.state.baseIntensities[index] = layer.intensity;
                this.state.currentIntensities[index] = layer.intensity;
                this.state.targetIntensities[index] = layer.intensity;
                
                console.log(`✅ Created ${layer.name} bloom layer:`, {
                    threshold: layer.threshold,
                    intensity: layer.intensity,
                    blur: layer.blur
                });
                
            } catch (error) {
                console.warn(`Failed to create ${layer.name} bloom layer:`, error);
                layer.filter = null;
            }
        });
    }
    
    /**
     * Apply filters to the particle container
     */
    applyFilters() {
        if (!this.fluxApp.particleRenderer?.container) {
            console.warn('⚠️ Particle container not available for bloom filters');
            return;
        }
        
        // Collect valid filters
        const validFilters = this.bloomLayers
            .map(layer => layer.filter)
            .filter(filter => filter !== null);
        
        if (validFilters.length === 0) {
            console.warn('⚠️ No valid bloom filters created');
            return;
        }
        
        // Apply filters to container
        this.fluxApp.particleRenderer.container.filters = validFilters;
        
        console.log(`🌟 Applied ${validFilters.length} bloom layers to particle container`);
    }
    
    /**
     * Initialize fallback bloom system
     */
    initializeFallback() {
        console.log('🔄 Initializing fallback bloom system...');
        
        try {
            // Create a single basic bloom filter as fallback
            // Try different PIXI filter paths
            let fallbackFilter;
            if (typeof PIXI !== 'undefined') {
                if (PIXI.filters && PIXI.filters.BlurFilter) {
                    fallbackFilter = new PIXI.filters.BlurFilter(8, 4);
                } else if (PIXI.BlurFilter) {
                    fallbackFilter = new PIXI.BlurFilter(8, 4);
                } else {
                    // Create a simple passthrough filter
                    fallbackFilter = new PIXI.Filter();
                    console.log('⚠️ Using passthrough filter as bloom fallback');
                }
            } else {
                throw new Error('PIXI not available');
            }
            
            this.bloomLayers = [{
                name: 'fallback',
                filter: fallbackFilter,
                intensity: 1.0,
                audioReactive: true,
                bassMultiplier: 0.5,
                midMultiplier: 0.3,
                trebleMultiplier: 0.2
            }];
            
            if (this.fluxApp.particleRenderer?.container) {
                this.fluxApp.particleRenderer.container.filters = [fallbackFilter];
            }
            
            this.isEnabled = true;
            console.log('✅ Fallback bloom initialized');
            
            return { success: true, message: 'Fallback bloom ready' };
            
        } catch (error) {
            console.error('❌ Failed to initialize fallback bloom:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Update bloom layers based on audio data
     */
    update(audioData) {
        if (!this.isEnabled || !this.audioSettings.enabled || !audioData) return;
        
        try {
            // Update each bloom layer based on audio
            this.bloomLayers.forEach((layer, index) => {
                if (layer.filter && layer.audioReactive) {
                    this.updateBloomLayer(layer, index, audioData);
                }
            });
            
            // Handle beat-driven effects
            if (audioData.beat?.isBeat) {
                this.handleBeatEffect(audioData.beat);
            }
            
            // Update beat decay
            this.updateBeatDecay();
            
            // Smooth intensity transitions
            this.smoothIntensityTransitions();
            
        } catch (error) {
            console.warn('Multi-layer bloom update error:', error);
        }
    }
    
    /**
     * Update individual bloom layer
     */
    updateBloomLayer(layer, index, audioData) {
        // Calculate audio influence for this layer
        const bassInfluence = (audioData.bass || 0) * layer.bassMultiplier;
        const midInfluence = (audioData.mids || 0) * layer.midMultiplier;
        const trebleInfluence = (audioData.treble || 0) * layer.trebleMultiplier;
        
        // Total audio influence
        const audioInfluence = (bassInfluence + midInfluence + trebleInfluence) * this.audioSettings.sensitivity;
        
        // Calculate target intensity
        const baseIntensity = this.state.baseIntensities[index];
        const energyMultiplier = 1 + (audioData.overall || 0) * this.audioSettings.energyMultiplier;
        const beatMultiplier = this.state.beatDecay;
        
        this.state.targetIntensities[index] = baseIntensity * energyMultiplier * beatMultiplier * (1 + audioInfluence);
        
        // Clamp intensity to reasonable range
        this.state.targetIntensities[index] = Math.max(0.1, Math.min(3.0, this.state.targetIntensities[index]));
    }
    
    /**
     * Handle beat-driven effects
     */
    handleBeatEffect(beatData) {
        const now = performance.now();
        const timeSinceLastBeat = now - this.state.lastBeatTime;
        
        // Only trigger if enough time has passed
        if (timeSinceLastBeat > 100) {
            this.state.lastBeatTime = now;
            
            // Calculate beat intensity
            const beatIntensity = beatData.strength * this.audioSettings.beatMultiplier;
            this.state.beatDecay = 1.0 + beatIntensity;
            
            console.log(`🥁 Beat effect triggered: intensity=${beatIntensity.toFixed(2)}`);
        }
    }
    
    /**
     * Update beat decay over time
     */
    updateBeatDecay() {
        // Decay beat effect over time
        this.state.beatDecay = Math.max(1.0, this.state.beatDecay * 0.95);
    }
    
    /**
     * Smooth intensity transitions
     */
    smoothIntensityTransitions() {
        const smoothing = this.audioSettings.smoothing;
        
        this.bloomLayers.forEach((layer, index) => {
            if (layer.filter) {
                // Smooth transition to target intensity
                this.state.currentIntensities[index] = 
                    this.state.currentIntensities[index] * smoothing + 
                    this.state.targetIntensities[index] * (1 - smoothing);
                
                // Apply intensity to filter
                if (layer.filter.bloomScale !== undefined) {
                    layer.filter.bloomScale = this.state.currentIntensities[index];
                } else if (layer.filter.strength !== undefined) {
                    // Fallback for basic blur filter
                    layer.filter.strength = this.state.currentIntensities[index] * 8;
                }
            }
        });
    }
    
    /**
     * Set bloom layer intensity manually
     */
    setLayerIntensity(layerIndex, intensity) {
        if (layerIndex >= 0 && layerIndex < this.bloomLayers.length) {
            this.state.baseIntensities[layerIndex] = intensity;
            this.state.targetIntensities[layerIndex] = intensity;
            
            console.log(`🌟 Set layer ${layerIndex} intensity to ${intensity}`);
        }
    }
    
    /**
     * Enable/disable audio reactivity
     */
    setAudioReactive(enabled) {
        this.audioSettings.enabled = enabled;
        
        if (!enabled) {
            // Reset to base intensities
            this.bloomLayers.forEach((layer, index) => {
                this.state.targetIntensities[index] = this.state.baseIntensities[index];
            });
        }
        
        console.log(`🎵 Audio reactivity ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Update audio settings
     */
    updateAudioSettings(settings) {
        this.audioSettings = { ...this.audioSettings, ...settings };
        console.log('⚙️ Multi-layer bloom audio settings updated:', this.audioSettings);
    }
    
    /**
     * Enable multi-layer bloom
     */
    enable() {
        this.isEnabled = true;
        this.applyFilters();
        console.log('✅ Multi-layer bloom enabled');
    }
    
    /**
     * Disable multi-layer bloom
     */
    disable() {
        this.isEnabled = false;
        
        // Remove filters from container
        if (this.fluxApp.particleRenderer?.container) {
            this.fluxApp.particleRenderer.container.filters = [];
        }
        
        console.log('❌ Multi-layer bloom disabled');
    }
    
    /**
     * Get current status
     */
    getStatus() {
        return {
            enabled: this.isEnabled,
            layerCount: this.bloomLayers.length,
            audioSettings: this.audioSettings,
            state: {
                currentIntensities: [...this.state.currentIntensities],
                targetIntensities: [...this.state.targetIntensities],
                beatDecay: this.state.beatDecay
            },
            layers: this.bloomLayers.map((layer, index) => ({
                name: layer.name,
                threshold: layer.threshold,
                currentIntensity: this.state.currentIntensities[index],
                targetIntensity: this.state.targetIntensities[index],
                hasFilter: layer.filter !== null
            }))
        };
    }
    
    /**
     * Cleanup resources
     */
    destroy() {
        this.disable();
        
        // Destroy filters
        this.bloomLayers.forEach(layer => {
            if (layer.filter && layer.filter.destroy) {
                layer.filter.destroy();
            }
        });
        
        this.bloomLayers = [];
        console.log('🗑️ Multi-layer bloom destroyed');
    }
}