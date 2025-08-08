/**
 * Audio-Reactive Particle Rendering Integration Example
 * Demonstrates how to use the enhanced ParticleRenderer with AudioEffects
 */

import { AudioEffects } from '../core/audio-effects.js'
import { AudioAnalyzer } from '../core/audio-analyzer.js'
import BeatDetector from '../core/beat-detector.js'

/**
 * Example integration of audio-reactive particle rendering
 * This shows how to connect audio analysis to visual effects
 */
export class AudioReactiveIntegrationExample {
    constructor(fluxApp) {
        this.fluxApp = fluxApp
        this.audioAnalyzer = null
        this.beatDetector = null
        this.audioEffects = null
        this.isRunning = false
        this.animationFrameId = null
        
        // Performance monitoring
        this.frameCount = 0
        this.lastPerformanceLog = 0
        this.performanceLogInterval = 5000 // Log every 5 seconds
    }
    
    /**
     * Initialize audio-reactive rendering system
     */
    async initialize() {
        try {
            console.log('🎵 Initializing audio-reactive particle rendering...')
            
            // Initialize audio analyzer
            this.audioAnalyzer = new AudioAnalyzer({
                fftSize: 2048,
                smoothingTimeConstant: 0.8,
                minDecibels: -90,
                maxDecibels: -10
            })
            
            await this.audioAnalyzer.initialize('microphone')
            console.log('✅ Audio analyzer initialized')
            
            // Initialize beat detector
            this.beatDetector = new BeatDetector(this.audioAnalyzer)
            console.log('✅ Beat detector initialized')
            
            // Initialize audio effects
            this.audioEffects = new AudioEffects(this.fluxApp, {
                mode: 'reactive',
                intensity: 1.0,
                smoothingFactor: 0.7
            })
            
            this.audioEffects.enable()
            console.log('✅ Audio effects enabled')
            
            // Enable audio-reactive rendering in particle renderer
            if (this.fluxApp.particleRenderer) {
                this.fluxApp.particleRenderer.enableAudioReactive()
                console.log('✅ Audio-reactive particle rendering enabled')
            }
            
            console.log('🎉 Audio-reactive system fully initialized!')
            return true
            
        } catch (error) {
            console.error('❌ Failed to initialize audio-reactive system:', error)
            return false
        }
    }
    
    /**
     * Start audio-reactive rendering loop
     */
    start() {
        if (this.isRunning) {
            console.warn('Audio-reactive rendering is already running')
            return
        }
        
        if (!this.audioAnalyzer || !this.audioEffects) {
            console.error('Audio-reactive system not initialized. Call initialize() first.')
            return
        }
        
        this.isRunning = true
        this.frameCount = 0
        this.lastPerformanceLog = performance.now()
        
        console.log('🚀 Starting audio-reactive rendering loop')
        this.renderLoop()
    }
    
    /**
     * Stop audio-reactive rendering loop
     */
    stop() {
        if (!this.isRunning) {
            return
        }
        
        this.isRunning = false
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId)
            this.animationFrameId = null
        }
        
        // Disable audio effects
        if (this.audioEffects) {
            this.audioEffects.disable()
        }
        
        // Disable audio-reactive rendering
        if (this.fluxApp.particleRenderer) {
            this.fluxApp.particleRenderer.disableAudioReactive()
        }
        
        console.log('⏹️ Audio-reactive rendering stopped')
    }
    
    /**
     * Main rendering loop for audio-reactive effects
     */
    renderLoop() {
        if (!this.isRunning) {
            return
        }
        
        try {
            // Get audio data
            const audioData = this.audioAnalyzer.getFrequencyData()
            
            // Detect beats
            const beatData = this.beatDetector.detectBeat(audioData.spectrum)
            
            // Process audio effects
            this.audioEffects.processAudioData(audioData, beatData)
            
            // Demonstrate different audio-reactive features
            this.demonstrateAudioReactiveFeatures(audioData, beatData)
            
            // Performance monitoring
            this.updatePerformanceStats()
            
        } catch (error) {
            console.error('Error in audio-reactive render loop:', error)
        }
        
        // Schedule next frame
        this.animationFrameId = requestAnimationFrame(() => this.renderLoop())
    }
    
    /**
     * Demonstrate various audio-reactive features
     */
    demonstrateAudioReactiveFeatures(audioData, beatData) {
        const renderer = this.fluxApp.particleRenderer
        if (!renderer || !renderer.audioReactiveEnabled) {
            return
        }
        
        // 1. Color changes based on frequency dominance
        if (audioData.overall > 0.1) {
            const bassHue = audioData.bass * 60 // Blue to cyan
            const midsHue = 180 + (audioData.mids * 60) // Cyan to green
            const trebleHue = 300 + (audioData.treble * 60) // Magenta to red
            
            const totalEnergy = audioData.bass + audioData.mids + audioData.treble
            if (totalEnergy > 0.1) {
                const blendedHue = (bassHue * audioData.bass + 
                                  midsHue * audioData.mids + 
                                  trebleHue * audioData.treble) / totalEnergy
                
                const saturation = 0.8 + (audioData.overall * 0.2)
                const lightness = 0.4 + (audioData.overall * 0.3)
                
                renderer.updateAudioColors(blendedHue, saturation, lightness)
            }
        }
        
        // 2. Dynamic bloom intensity
        let bloomIntensity = 1.0 + (audioData.overall * 0.8)
        if (beatData.isBeat) {
            bloomIntensity += beatData.strength * 0.5
        }
        renderer.updateBloomIntensity(Math.min(bloomIntensity, 3.0))
        
        // 3. Treble-driven particle size variation
        if (audioData.treble > 0.05) {
            renderer.updateTrebleSizes(audioData.treble, audioData.spectrum)
        }
        
        // 4. Sparkle effects for high frequencies
        if (audioData.treble > 0.4) {
            const sparkleCount = Math.floor(audioData.treble * 8) + 2
            renderer.createSparkleEffects(audioData.treble, sparkleCount)
        }
        
        // 5. Beat-driven visual pulses
        if (beatData.isBeat && beatData.strength > 0.3) {
            renderer.applyBeatPulse(beatData.strength)
        }
    }
    
    /**
     * Update performance statistics
     */
    updatePerformanceStats() {
        this.frameCount++
        
        const now = performance.now()
        if (now - this.lastPerformanceLog > this.performanceLogInterval) {
            const fps = this.frameCount / (this.performanceLogInterval / 1000)
            const audioStats = this.audioEffects.getPerformanceStats()
            
            console.log(`📊 Audio-Reactive Performance Stats:`)
            console.log(`   FPS: ${fps.toFixed(1)}`)
            console.log(`   Audio Processing Time: ${audioStats.processTime.toFixed(2)}ms`)
            console.log(`   Effects Applied: ${audioStats.effectsApplied}`)
            console.log(`   Frame Count: ${this.frameCount}`)
            
            // Reset counters
            this.frameCount = 0
            this.lastPerformanceLog = now
        }
    }
    
    /**
     * Switch audio-reactive mode
     */
    setMode(mode) {
        if (this.audioEffects) {
            this.audioEffects.setMode(mode)
            console.log(`🎛️ Switched to ${mode} mode`)
        }
    }
    
    /**
     * Adjust effect intensity
     */
    setIntensity(intensity) {
        if (this.audioEffects) {
            this.audioEffects.setIntensity(intensity)
            console.log(`🎚️ Set intensity to ${intensity}`)
        }
    }
    
    /**
     * Adjust smoothing factor
     */
    setSmoothingFactor(factor) {
        if (this.audioEffects) {
            this.audioEffects.setSmoothingFactor(factor)
            console.log(`🎛️ Set smoothing factor to ${factor}`)
        }
    }
    
    /**
     * Get current audio data for debugging
     */
    getCurrentAudioData() {
        if (!this.audioAnalyzer) {
            return null
        }
        
        const audioData = this.audioAnalyzer.getFrequencyData()
        const beatData = this.beatDetector.detectBeat(audioData.spectrum)
        
        return {
            audio: audioData,
            beat: beatData,
            effects: this.audioEffects.getEffectState()
        }
    }
    
    /**
     * Create a test demonstration with different modes
     */
    async runModeDemo() {
        if (!this.isRunning) {
            console.log('Start the audio-reactive system first')
            return
        }
        
        const modes = ['pulse', 'reactive', 'flow', 'ambient']
        const modeDuration = 10000 // 10 seconds per mode
        
        console.log('🎭 Starting mode demonstration...')
        
        for (const mode of modes) {
            console.log(`🎵 Demonstrating ${mode} mode for ${modeDuration/1000} seconds`)
            this.setMode(mode)
            
            await new Promise(resolve => setTimeout(resolve, modeDuration))
        }
        
        console.log('🎉 Mode demonstration complete!')
        this.setMode('reactive') // Return to default
    }
    
    /**
     * Create a test with different intensity levels
     */
    async runIntensityDemo() {
        if (!this.isRunning) {
            console.log('Start the audio-reactive system first')
            return
        }
        
        const intensities = [0.5, 1.0, 1.5, 2.0]
        const intensityDuration = 5000 // 5 seconds per intensity
        
        console.log('🎚️ Starting intensity demonstration...')
        
        for (const intensity of intensities) {
            console.log(`🔊 Testing intensity ${intensity} for ${intensityDuration/1000} seconds`)
            this.setIntensity(intensity)
            
            await new Promise(resolve => setTimeout(resolve, intensityDuration))
        }
        
        console.log('🎉 Intensity demonstration complete!')
        this.setIntensity(1.0) // Return to default
    }
    
    /**
     * Cleanup resources
     */
    destroy() {
        this.stop()
        
        if (this.audioAnalyzer) {
            // Cleanup audio analyzer resources if needed
            this.audioAnalyzer = null
        }
        
        if (this.beatDetector) {
            this.beatDetector = null
        }
        
        if (this.audioEffects) {
            this.audioEffects = null
        }
        
        console.log('🧹 Audio-reactive integration cleaned up')
    }
}

/**
 * Usage example:
 * 
 * const audioReactive = new AudioReactiveIntegrationExample(fluxApp)
 * 
 * // Initialize and start
 * await audioReactive.initialize()
 * audioReactive.start()
 * 
 * // Switch modes
 * audioReactive.setMode('pulse')
 * audioReactive.setIntensity(1.5)
 * 
 * // Run demonstrations
 * await audioReactive.runModeDemo()
 * await audioReactive.runIntensityDemo()
 * 
 * // Stop and cleanup
 * audioReactive.stop()
 * audioReactive.destroy()
 */