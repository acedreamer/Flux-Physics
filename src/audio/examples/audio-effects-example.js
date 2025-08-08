/**
 * AudioEffects Integration Example
 * Demonstrates how to integrate the AudioEffects system with FLUX Physics Playground
 */

import { AudioAnalyzer, AudioEffects } from '../index.js'
import BeatDetector from '../core/beat-detector.js'

/**
 * Example integration of AudioEffects with FLUX application
 * This shows how to set up and use the audio-driven particle effects system
 */
export class AudioEffectsIntegration {
    constructor(fluxApp) {
        this.fluxApp = fluxApp
        this.audioAnalyzer = null
        this.beatDetector = null
        this.audioEffects = null
        this.isRunning = false
        this.animationFrameId = null
        
        // Configuration
        this.config = {
            audioSource: 'microphone', // or 'system'
            effectMode: 'reactive',    // 'pulse', 'reactive', 'flow', 'ambient'
            intensity: 1.0,
            smoothingFactor: 0.7,
            beatSensitivity: 1.0
        }
    }
    
    /**
     * Initialize the audio effects system
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async initialize() {
        try {
            console.log('Initializing AudioEffects integration...')
            
            // Initialize audio analyzer
            this.audioAnalyzer = new AudioAnalyzer({
                fftSize: 2048,
                smoothingTimeConstant: 0.8,
                smoothingFactor: this.config.smoothingFactor
            })
            
            const audioResult = await this.audioAnalyzer.initialize(this.config.audioSource)
            if (!audioResult.success) {
                return audioResult
            }
            
            // Initialize beat detector
            this.beatDetector = new BeatDetector(this.audioAnalyzer, {
                sensitivity: this.config.beatSensitivity,
                beatThreshold: 1.3,
                minBeatInterval: 300
            })
            
            // Initialize audio effects
            this.audioEffects = new AudioEffects(this.fluxApp, {
                mode: this.config.effectMode,
                intensity: this.config.intensity,
                smoothingFactor: this.config.smoothingFactor
            })
            
            console.log('AudioEffects integration initialized successfully')
            return { success: true }
            
        } catch (error) {
            console.error('AudioEffects integration failed:', error)
            return {
                success: false,
                error: 'INTEGRATION_FAILED',
                message: `Integration failed: ${error.message}`
            }
        }
    }
    
    /**
     * Start the audio effects processing loop
     */
    start() {
        if (!this.audioAnalyzer || !this.beatDetector || !this.audioEffects) {
            console.error('AudioEffects system not initialized')
            return
        }
        
        if (this.isRunning) {
            console.warn('AudioEffects already running')
            return
        }
        
        this.isRunning = true
        this.audioEffects.enable()
        this.startProcessingLoop()
        
        console.log(`AudioEffects started in ${this.config.effectMode} mode`)
    }
    
    /**
     * Stop the audio effects processing
     */
    stop() {
        this.isRunning = false
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId)
            this.animationFrameId = null
        }
        
        if (this.audioEffects) {
            this.audioEffects.disable()
        }
        
        console.log('AudioEffects stopped')
    }
    
    /**
     * Main processing loop - runs at ~60fps
     */
    startProcessingLoop() {
        const processFrame = () => {
            if (!this.isRunning) return
            
            try {
                // Get audio frequency data
                const audioData = this.audioAnalyzer.getFrequencyData()
                
                // Detect beats
                const beatData = this.beatDetector.detectBeat(audioData.spectrum)
                
                // Apply audio effects to particles
                this.audioEffects.processAudioData(audioData, beatData)
                
                // Schedule next frame
                this.animationFrameId = requestAnimationFrame(processFrame)
                
            } catch (error) {
                console.error('AudioEffects processing error:', error)
                // Continue processing despite errors
                this.animationFrameId = requestAnimationFrame(processFrame)
            }
        }
        
        // Start the processing loop
        processFrame()
    }
    
    /**
     * Switch visualization mode
     * @param {string} mode - New mode ('pulse', 'reactive', 'flow', 'ambient')
     */
    setMode(mode) {
        if (this.audioEffects) {
            this.audioEffects.setMode(mode)
            this.config.effectMode = mode
            console.log(`AudioEffects mode changed to ${mode}`)
        }
    }
    
    /**
     * Update effect intensity
     * @param {number} intensity - New intensity (0-2)
     */
    setIntensity(intensity) {
        if (this.audioEffects) {
            this.audioEffects.setIntensity(intensity)
            this.config.intensity = intensity
            console.log(`AudioEffects intensity set to ${intensity}`)
        }
    }
    
    /**
     * Update smoothing factor
     * @param {number} factor - New smoothing factor (0-1)
     */
    setSmoothingFactor(factor) {
        if (this.audioEffects) {
            this.audioEffects.setSmoothingFactor(factor)
            this.config.smoothingFactor = factor
            console.log(`AudioEffects smoothing factor set to ${factor}`)
        }
    }
    
    /**
     * Update beat detection sensitivity
     * @param {number} sensitivity - New sensitivity (0.1-2.0)
     */
    setBeatSensitivity(sensitivity) {
        if (this.beatDetector) {
            this.beatDetector.updateConfig({ sensitivity })
            this.config.beatSensitivity = sensitivity
            console.log(`Beat detection sensitivity set to ${sensitivity}`)
        }
    }
    
    /**
     * Get current system status
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            isInitialized: !!(this.audioAnalyzer && this.beatDetector && this.audioEffects),
            config: { ...this.config },
            audioAnalyzer: this.audioAnalyzer ? {
                isInitialized: this.audioAnalyzer.isInitialized,
                performanceStats: this.audioAnalyzer.getPerformanceStats()
            } : null,
            beatDetector: this.beatDetector ? {
                stats: this.beatDetector.getStats()
            } : null,
            audioEffects: this.audioEffects ? {
                state: this.audioEffects.getEffectState(),
                performanceStats: this.audioEffects.getPerformanceStats()
            } : null
        }
    }
    
    /**
     * Get current audio data for debugging
     * @returns {Object} Current audio analysis data
     */
    getCurrentAudioData() {
        if (!this.audioAnalyzer || !this.beatDetector) {
            return null
        }
        
        const audioData = this.audioAnalyzer.getFrequencyData()
        const beatData = this.beatDetector.detectBeat(audioData.spectrum)
        
        return {
            audio: audioData,
            beat: beatData,
            timestamp: performance.now()
        }
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        this.stop()
        
        if (this.audioAnalyzer) {
            this.audioAnalyzer.dispose()
            this.audioAnalyzer = null
        }
        
        if (this.beatDetector) {
            this.beatDetector.reset()
            this.beatDetector = null
        }
        
        this.audioEffects = null
        
        console.log('AudioEffects integration disposed')
    }
}

/**
 * Utility function to create and initialize AudioEffects integration
 * @param {FluxApplication} fluxApp - FLUX application instance
 * @param {Object} options - Configuration options
 * @returns {Promise<AudioEffectsIntegration>}
 */
export async function createAudioEffectsIntegration(fluxApp, options = {}) {
    const integration = new AudioEffectsIntegration(fluxApp)
    
    // Apply configuration options
    if (options.audioSource) integration.config.audioSource = options.audioSource
    if (options.effectMode) integration.config.effectMode = options.effectMode
    if (options.intensity !== undefined) integration.config.intensity = options.intensity
    if (options.smoothingFactor !== undefined) integration.config.smoothingFactor = options.smoothingFactor
    if (options.beatSensitivity !== undefined) integration.config.beatSensitivity = options.beatSensitivity
    
    const result = await integration.initialize()
    if (!result.success) {
        throw new Error(result.message || 'Failed to initialize AudioEffects integration')
    }
    
    return integration
}

/**
 * Example usage function
 */
export function exampleUsage() {
    console.log(`
AudioEffects Integration Example Usage:

// Basic setup
const integration = new AudioEffectsIntegration(fluxApp)
await integration.initialize()
integration.start()

// Or use the utility function
const integration = await createAudioEffectsIntegration(fluxApp, {
    effectMode: 'reactive',
    intensity: 1.2,
    audioSource: 'microphone'
})
integration.start()

// Switch modes
integration.setMode('pulse')     // Beat-driven pulses
integration.setMode('reactive')  // Multi-frequency control
integration.setMode('flow')      // Directional flows
integration.setMode('ambient')   // Subtle drift

// Adjust settings
integration.setIntensity(1.5)           // Increase effect strength
integration.setSmoothingFactor(0.5)     // Faster response
integration.setBeatSensitivity(1.2)     // More sensitive beat detection

// Monitor status
const status = integration.getStatus()
console.log('Audio effects status:', status)

// Get real-time data
const audioData = integration.getCurrentAudioData()
console.log('Current audio:', audioData)

// Clean up
integration.stop()
integration.dispose()
    `)
}