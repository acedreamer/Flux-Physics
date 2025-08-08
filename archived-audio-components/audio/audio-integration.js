/**
 * Audio Integration Layer
 * Integrates enhanced audio improvements with existing FLUX system
 */

import { QuickAudioImprovements } from './quick-audio-improvements.js';
import { EnhancedAudioEffects } from './enhanced-audio-effects.js';

export class AudioIntegration {
    constructor(fluxApp) {
        this.fluxApp = fluxApp;
        this.isEnabled = false;
        
        // Initialize both improvement systems
        this.quickImprovements = new QuickAudioImprovements(fluxApp);
        this.enhancedEffects = new EnhancedAudioEffects(fluxApp);
        
        // Integration settings
        this.settings = {
            useEnhancedEffects: true,
            useQuickImprovements: true,
            fallbackMode: 'enhanced', // 'enhanced' or 'quick'
            performanceMode: 'auto' // 'auto', 'performance', 'quality'
        };
        
        // Performance monitoring
        this.performance = {
            frameRate: 60,
            targetFrameRate: 60,
            lastFrameTime: 0,
            frameCount: 0,
            averageFrameTime: 16.67 // 60 FPS target
        };
        
        console.log('🔗 Audio Integration Layer initialized');
    }
    
    /**
     * Initialize the integrated audio system
     */
    async initialize() {
        try {
            console.log('🚀 Initializing integrated audio system...');
            
            // Initialize both systems
            if (this.settings.useEnhancedEffects) {
                this.enhancedEffects.enable();
                console.log('✅ Enhanced effects enabled');
            }
            
            if (this.settings.useQuickImprovements) {
                this.quickImprovements.initialize();
                console.log('✅ Quick improvements enabled');
            }
            
            // Start performance monitoring
            this.startPerformanceMonitoring();
            
            this.isEnabled = true;
            console.log('🎉 Audio integration initialized successfully');
            
            return { success: true, message: 'Audio integration ready' };
            
        } catch (error) {
            console.error('❌ Failed to initialize audio integration:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Main update method - integrates both systems
     */
    update(audioData) {
        if (!this.isEnabled || !audioData) return;
        
        const frameStart = performance.now();
        
        try {
            // Convert audio data to enhanced format if needed
            const enhancedAudioData = this.convertAudioData(audioData);
            
            // Update based on performance mode
            if (this.settings.performanceMode === 'auto') {
                this.updateAuto(enhancedAudioData);
            } else if (this.settings.performanceMode === 'performance') {
                this.updatePerformanceMode(enhancedAudioData);
            } else {
                this.updateQualityMode(enhancedAudioData);
            }
            
        } catch (error) {
            console.warn('Audio integration update error:', error);
            // Fallback to basic mode
            this.updateFallback(audioData);
        }
        
        // Update performance metrics
        this.updatePerformanceMetrics(frameStart);
    }
    
    /**
     * Auto mode - adapts based on performance
     */
    updateAuto(audioData) {
        if (this.performance.frameRate > 50) {
            // Good performance - use both systems
            this.updateQualityMode(audioData);
        } else if (this.performance.frameRate > 30) {
            // Medium performance - use enhanced effects only
            if (this.settings.useEnhancedEffects) {
                this.enhancedEffects.update(audioData);
            }
        } else {
            // Poor performance - use quick improvements only
            this.updatePerformanceMode(audioData);
        }
    }
    
    /**
     * Performance mode - lightweight updates
     */
    updatePerformanceMode(audioData) {
        if (this.settings.useQuickImprovements) {
            this.quickImprovements.update(audioData);
        }
    }
    
    /**
     * Quality mode - full feature updates
     */
    updateQualityMode(audioData) {
        // Update both systems for maximum visual impact
        if (this.settings.useEnhancedEffects) {
            this.enhancedEffects.update(audioData);
        }
        
        if (this.settings.useQuickImprovements) {
            this.quickImprovements.update(audioData);
        }
    }
    
    /**
     * Fallback mode - basic audio effects
     */
    updateFallback(audioData) {
        // Use the system specified in fallbackMode setting
        if (this.settings.fallbackMode === 'enhanced' && this.settings.useEnhancedEffects) {
            this.enhancedEffects.update(audioData);
        } else if (this.settings.useQuickImprovements) {
            this.quickImprovements.update(audioData);
        }
    }
    
    /**
     * Convert audio data to enhanced format
     */
    convertAudioData(audioData) {
        // Ensure audio data has all required properties
        const enhanced = {
            // Basic frequency data
            bass: audioData.bass || 0,
            mids: audioData.mids || 0,
            treble: audioData.treble || 0,
            overall: audioData.overall || 0,
            
            // Extended frequency data
            subBass: audioData.subBass || audioData.bass * 0.5 || 0,
            lowMids: audioData.lowMids || audioData.mids * 0.6 || 0,
            highMids: audioData.highMids || audioData.mids * 0.4 || 0,
            highTreble: audioData.highTreble || audioData.treble * 0.3 || 0,
            
            // Spectral data
            spectral: audioData.spectral || {
                centroid: 1000,
                rolloff: 5000,
                flux: 0,
                brightness: audioData.treble || 0
            },
            
            // Energy data
            energy: audioData.energy || {
                total: audioData.overall || 0,
                distribution: {
                    bass: (audioData.bass || 0) / Math.max(audioData.overall || 1, 0.001),
                    mids: (audioData.mids || 0) / Math.max(audioData.overall || 1, 0.001),
                    treble: (audioData.treble || 0) / Math.max(audioData.overall || 1, 0.001)
                }
            },
            
            // Beat data
            beat: audioData.beat || {
                isBeat: false,
                strength: 0,
                confidence: 0
            },
            
            // Raw spectrum data
            spectrum: audioData.spectrum || new Array(1024).fill(0),
            
            // Timestamp
            timestamp: audioData.timestamp || performance.now()
        };
        
        return enhanced;
    }
    
    /**
     * Start performance monitoring
     */
    startPerformanceMonitoring() {
        let lastTime = performance.now();
        let frameCount = 0;
        let totalFrameTime = 0;
        
        const monitor = () => {
            const now = performance.now();
            const deltaTime = now - lastTime;
            
            if (deltaTime > 0) {
                frameCount++;
                totalFrameTime += deltaTime;
                
                // Update frame rate every 30 frames
                if (frameCount >= 30) {
                    this.performance.frameRate = 1000 / (totalFrameTime / frameCount);
                    this.performance.averageFrameTime = totalFrameTime / frameCount;
                    
                    // Reset counters
                    frameCount = 0;
                    totalFrameTime = 0;
                    
                    // Adjust performance mode if needed
                    this.adjustPerformanceMode();
                }
            }
            
            lastTime = now;
            requestAnimationFrame(monitor);
        };
        
        requestAnimationFrame(monitor);
    }
    
    /**
     * Adjust performance mode based on frame rate
     */
    adjustPerformanceMode() {
        if (this.settings.performanceMode !== 'auto') return;
        
        const frameRate = this.performance.frameRate;
        
        if (frameRate < 25) {
            // Very poor performance - disable some features
            console.warn('🐌 Poor performance detected, reducing audio effects');
            this.settings.useEnhancedEffects = false;
            this.settings.useQuickImprovements = true;
        } else if (frameRate < 40) {
            // Medium performance - use enhanced effects only
            this.settings.useEnhancedEffects = true;
            this.settings.useQuickImprovements = false;
        } else if (frameRate > 55) {
            // Good performance - enable all features
            this.settings.useEnhancedEffects = true;
            this.settings.useQuickImprovements = true;
        }
    }
    
    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(frameStart) {
        const frameEnd = performance.now();
        const frameTime = frameEnd - frameStart;
        
        this.performance.lastFrameTime = frameTime;
        this.performance.frameCount++;
        
        // Warn if frame time is too high
        if (frameTime > 33) { // More than 30 FPS
            console.warn(`🐌 Slow audio frame: ${frameTime.toFixed(2)}ms`);
        }
    }
    
    /**
     * Enable audio integration
     */
    enable() {
        this.isEnabled = true;
        
        if (this.settings.useEnhancedEffects) {
            this.enhancedEffects.enable();
        }
        
        if (this.settings.useQuickImprovements) {
            this.quickImprovements.enable();
        }
        
        console.log('✅ Audio integration enabled');
    }
    
    /**
     * Disable audio integration
     */
    disable() {
        this.isEnabled = false;
        
        if (this.enhancedEffects) {
            this.enhancedEffects.disable();
        }
        
        if (this.quickImprovements) {
            this.quickImprovements.disable();
        }
        
        console.log('❌ Audio integration disabled');
    }
    
    /**
     * Update settings
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        // Apply settings changes
        if (!this.settings.useEnhancedEffects && this.enhancedEffects) {
            this.enhancedEffects.disable();
        } else if (this.settings.useEnhancedEffects && this.enhancedEffects) {
            this.enhancedEffects.enable();
        }
        
        if (!this.settings.useQuickImprovements && this.quickImprovements) {
            this.quickImprovements.disable();
        } else if (this.settings.useQuickImprovements && this.quickImprovements) {
            this.quickImprovements.enable();
        }
        
        console.log('⚙️ Audio integration settings updated:', this.settings);
    }
    
    /**
     * Get current status
     */
    getStatus() {
        return {
            enabled: this.isEnabled,
            settings: this.settings,
            performance: this.performance,
            enhancedEffects: this.enhancedEffects ? this.enhancedEffects.getStatus() : null,
            quickImprovements: this.quickImprovements ? this.quickImprovements.getStatus() : null
        };
    }
    
    /**
     * Get performance statistics
     */
    getPerformanceStats() {
        return {
            frameRate: this.performance.frameRate,
            averageFrameTime: this.performance.averageFrameTime,
            lastFrameTime: this.performance.lastFrameTime,
            frameCount: this.performance.frameCount,
            targetFrameRate: this.performance.targetFrameRate
        };
    }
}