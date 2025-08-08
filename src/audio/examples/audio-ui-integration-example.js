/**
 * FLUX Audio UI Integration Example
 * 
 * Demonstrates how to integrate AudioUI components with the existing
 * audio analysis system and FLUX application
 */

import { AudioUI } from '../ui/audio-ui.js'
import { AudioAnalyzer } from '../core/audio-analyzer.js'
import BeatDetector from '../core/beat-detector.js'

/**
 * Example integration class showing how to connect AudioUI with audio processing
 */
export class AudioUIIntegrationExample {
    constructor(fluxApp) {
        this.fluxApp = fluxApp
        this.audioAnalyzer = null
        this.beatDetector = null
        this.audioUI = null
        this.isRunning = false
        this.animationFrame = null
        
        // Audio processing state
        this.audioData = {
            frequency: null,
            beat: null,
            timestamp: 0
        }
        
        this.initialize()
    }
    
    /**
     * Initialize the audio UI integration
     */
    initialize() {
        // Create UI container (could be document.body or specific container)
        const uiContainer = document.body
        
        // Create AudioUI instance
        this.audioUI = new AudioUI(uiContainer, {
            panelWidth: 300,
            spectrumHeight: 90,
            animationDuration: 250
        })
        
        // Set up UI callbacks
        this.audioUI.setCallbacks({
            onToggleAudio: this.handleAudioToggle.bind(this),
            onModeChange: this.handleModeChange.bind(this),
            onSensitivityChange: this.handleSensitivityChange.bind(this),
            onPermissionRequest: this.handlePermissionRequest.bind(this)
        })
        
        console.log('Audio UI integration initialized')
    }
    
    /**
     * Handle audio mode toggle
     * @param {boolean} enabled - Whether audio mode is enabled
     */
    async handleAudioToggle(enabled) {
        if (enabled) {
            await this.startAudioProcessing()
        } else {
            this.stopAudioProcessing()
        }
    }
    
    /**
     * Handle visualization mode change
     * @param {string} mode - New visualization mode
     */
    handleModeChange(mode) {
        console.log(`Visualization mode changed to: ${mode}`)
        
        // Here you would update your audio effects system
        // For example, if you have an AudioEffects instance:
        // this.audioEffects.setMode(mode)
        
        // Show visual feedback
        this.audioUI.updateStatus('connected', `Mode: ${mode.toUpperCase()}`)
    }
    
    /**
     * Handle sensitivity adjustment
     * @param {number} sensitivity - New sensitivity value
     */
    handleSensitivityChange(sensitivity) {
        console.log(`Audio sensitivity changed to: ${sensitivity}`)
        
        // Update beat detector sensitivity if available
        if (this.beatDetector) {
            this.beatDetector.updateConfig({
                sensitivity: sensitivity,
                varianceMultiplier: sensitivity * 1.0,
                minimumEnergy: Math.max(0.01, 0.05 / sensitivity)
            })
        }
        
        // Update audio analyzer if needed
        if (this.audioAnalyzer) {
            // You could adjust frequency analyzer sensitivity here
            // this.audioAnalyzer.updateFrequencyConfig({ sensitivity })
        }
    }
    
    /**
     * Handle microphone permission request
     * @returns {Promise<{success: boolean, message?: string}>}
     */
    async handlePermissionRequest() {
        try {
            // Initialize audio analyzer
            this.audioAnalyzer = new AudioAnalyzer({
                fftSize: 2048,
                smoothingTimeConstant: 0.8,
                smoothingEnabled: true,
                smoothingFactor: 0.7
            })
            
            // Initialize with microphone input
            const result = await this.audioAnalyzer.initialize('microphone')
            
            if (result.success) {
                // Create beat detector
                this.beatDetector = new BeatDetector(this.audioAnalyzer, {
                    sensitivity: this.audioUI.sensitivity,
                    beatThreshold: 1.2,
                    minBeatInterval: 300
                })
                
                console.log('Audio system initialized successfully')
                return { success: true }
            } else {
                console.error('Audio initialization failed:', result.message)
                return {
                    success: false,
                    message: result.message
                }
            }
        } catch (error) {
            console.error('Permission request failed:', error)
            return {
                success: false,
                message: `Failed to initialize audio: ${error.message}`
            }
        }
    }
    
    /**
     * Start audio processing and UI updates
     */
    async startAudioProcessing() {
        if (this.isRunning) return
        
        this.isRunning = true
        this.audioAnalyzer.startAnalysis()
        
        // Start the audio processing loop
        this.processAudioLoop()
        
        console.log('Audio processing started')
    }
    
    /**
     * Stop audio processing and UI updates
     */
    stopAudioProcessing() {
        if (!this.isRunning) return
        
        this.isRunning = false
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame)
            this.animationFrame = null
        }
        
        if (this.audioAnalyzer) {
            this.audioAnalyzer.stopAnalysis()
        }
        
        console.log('Audio processing stopped')
    }
    
    /**
     * Main audio processing loop
     */
    processAudioLoop() {
        if (!this.isRunning) return
        
        try {
            // Get frequency data from analyzer
            const frequencyData = this.audioAnalyzer.getFrequencyData()
            
            // Perform beat detection
            const beatData = this.beatDetector.detectBeat(frequencyData.spectrum)
            
            // Update UI with audio data
            this.audioUI.updateAll(frequencyData)
            this.audioUI.updateBeat(beatData)
            
            // Store data for other systems
            this.audioData = {
                frequency: frequencyData,
                beat: beatData,
                timestamp: performance.now()
            }
            
            // Apply audio effects to FLUX if available
            this.applyAudioEffects(frequencyData, beatData)
            
        } catch (error) {
            console.error('Audio processing error:', error)
            this.audioUI.showError('Audio processing error occurred')
        }
        
        // Schedule next frame
        this.animationFrame = requestAnimationFrame(() => {
            this.processAudioLoop()
        })
    }
    
    /**
     * Apply audio effects to the FLUX particle system
     * @param {Object} frequencyData - Frequency analysis data
     * @param {Object} beatData - Beat detection data
     */
    applyAudioEffects(frequencyData, beatData) {
        // This is where you would integrate with your AudioEffects system
        // For example:
        
        if (!this.fluxApp || !this.fluxApp.solver) return
        
        const mode = this.audioUI.currentMode
        const sensitivity = this.audioUI.sensitivity
        
        // Simple example effects based on current mode
        switch (mode) {
            case 'pulse':
                this.applyPulseEffects(frequencyData, beatData, sensitivity)
                break
                
            case 'reactive':
                this.applyReactiveEffects(frequencyData, beatData, sensitivity)
                break
                
            case 'flow':
                this.applyFlowEffects(frequencyData, beatData, sensitivity)
                break
                
            case 'ambient':
                this.applyAmbientEffects(frequencyData, beatData, sensitivity)
                break
        }
    }
    
    /**
     * Apply pulse mode effects
     */
    applyPulseEffects(frequencyData, beatData, sensitivity) {
        if (beatData.isBeat && this.fluxApp.solver) {
            const centerX = this.fluxApp.config.containerWidth / 2
            const centerY = this.fluxApp.config.containerHeight / 2
            const radius = 100 + (beatData.strength * 50)
            const strength = beatData.strength * sensitivity * 0.8
            
            this.fluxApp.solver.apply_force(centerX, centerY, radius, strength)
        }
    }
    
    /**
     * Apply reactive mode effects
     */
    applyReactiveEffects(frequencyData, beatData, sensitivity) {
        if (!this.fluxApp.solver) return
        
        // Bass creates central force
        if (frequencyData.bass > 0.1) {
            const centerX = this.fluxApp.config.containerWidth / 2
            const centerY = this.fluxApp.config.containerHeight / 2
            const radius = 80 + (frequencyData.bass * 40)
            const strength = frequencyData.bass * sensitivity * 0.5
            
            this.fluxApp.solver.apply_force(centerX, centerY, radius, strength)
        }
        
        // Beat creates pulse
        if (beatData.isBeat) {
            const centerX = this.fluxApp.config.containerWidth / 2
            const centerY = this.fluxApp.config.containerHeight / 2
            const radius = 120
            const strength = beatData.strength * sensitivity * 0.6
            
            this.fluxApp.solver.apply_force(centerX, centerY, radius, strength)
        }
    }
    
    /**
     * Apply flow mode effects
     */
    applyFlowEffects(frequencyData, beatData, sensitivity) {
        if (!this.fluxApp.solver) return
        
        // Create flowing motion based on audio
        const time = performance.now() * 0.001
        const flowX = this.fluxApp.config.containerWidth * (0.3 + 0.2 * Math.sin(time))
        const flowY = this.fluxApp.config.containerHeight * (0.5 + 0.3 * Math.cos(time * 0.7))
        
        const radius = 60 + (frequencyData.overall * 40)
        const strength = (frequencyData.overall + beatData.energy) * sensitivity * 0.4
        
        this.fluxApp.solver.apply_force(flowX, flowY, radius, strength)
    }
    
    /**
     * Apply ambient mode effects
     */
    applyAmbientEffects(frequencyData, beatData, sensitivity) {
        if (!this.fluxApp.solver) return
        
        // Subtle ambient effects
        if (frequencyData.overall > 0.05) {
            const time = performance.now() * 0.0005
            const ambientX = this.fluxApp.config.containerWidth * (0.5 + 0.1 * Math.sin(time))
            const ambientY = this.fluxApp.config.containerHeight * (0.5 + 0.1 * Math.cos(time * 1.3))
            
            const radius = 40 + (frequencyData.overall * 20)
            const strength = frequencyData.overall * sensitivity * 0.2
            
            this.fluxApp.solver.apply_force(ambientX, ambientY, radius, strength)
        }
    }
    
    /**
     * Get current audio data for external use
     * @returns {Object} Current audio data
     */
    getAudioData() {
        return { ...this.audioData }
    }
    
    /**
     * Get UI state
     * @returns {Object} Current UI state
     */
    getUIState() {
        return this.audioUI ? this.audioUI.getState() : null
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        this.stopAudioProcessing()
        
        if (this.audioAnalyzer) {
            this.audioAnalyzer.dispose()
            this.audioAnalyzer = null
        }
        
        if (this.beatDetector) {
            this.beatDetector = null
        }
        
        if (this.audioUI) {
            this.audioUI.dispose()
            this.audioUI = null
        }
        
        console.log('Audio UI integration disposed')
    }
}

/**
 * Simple usage example
 */
export function createAudioUIExample(fluxApp) {
    const integration = new AudioUIIntegrationExample(fluxApp)
    
    // Optional: Add keyboard shortcut to toggle audio
    document.addEventListener('keydown', (event) => {
        if (event.key === 'a' || event.key === 'A') {
            const state = integration.getUIState()
            if (state) {
                integration.handleAudioToggle(!state.audioEnabled)
            }
        }
    })
    
    return integration
}