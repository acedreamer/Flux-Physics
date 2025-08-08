/**
 * Audio Effects - Handles audio-reactive visual effects for particles
 * Creates visual reactions to bass, mids, treble, and beats
 */

export class AudioEffects {
    constructor(fluxApp) {
        this.fluxApp = fluxApp
        this.mode = 'reactive'
        this.intensity = 1.0
        this.smoothingFactor = 0.7
        this.isEnabled = false
        
        // Visual state tracking
        this.currentHue = 180 // Start with cyan
        this.currentBloom = 1.0
        this.beatPulseTime = 0
        this.lastBeatTime = 0
        
        // Audio processing state
        this.smoothedAudio = {
            bass: 0,
            mids: 0,
            treble: 0,
            overall: 0
        }
        
        console.log('🎨 Audio Effects initialized')
    }
    
    /**
     * Enable audio effects
     */
    enable() {
        this.isEnabled = true
        if (this.fluxApp.particleRenderer) {
            this.fluxApp.particleRenderer.enableAudioReactive()
        }
        console.log('✅ Audio effects enabled')
    }
    
    /**
     * Disable audio effects
     */
    disable() {
        this.isEnabled = false
        if (this.fluxApp.particleRenderer) {
            this.fluxApp.particleRenderer.disableAudioReactive()
        }
        console.log('❌ Audio effects disabled')
    }
    
    /**
     * Set audio visualization mode
     */
    setMode(mode) {
        this.mode = mode
        console.log(`🎵 Audio mode set to: ${mode}`)
    }
    
    /**
     * Set effect intensity
     */
    setIntensity(intensity) {
        this.intensity = Math.max(0.1, Math.min(2.0, intensity))
        console.log(`🔊 Audio intensity set to: ${this.intensity}`)
    }
    
    /**
     * Set smoothing factor
     */
    setSmoothingFactor(factor) {
        this.smoothingFactor = Math.max(0.0, Math.min(1.0, factor))
        console.log(`🎛️ Audio smoothing set to: ${this.smoothingFactor}`)
    }
    
    /**
     * Process audio data and apply visual effects
     */
    processAudioData(audioData, beatData) {
        if (!this.isEnabled || !this.fluxApp.particleRenderer) {
            return
        }
        
        // Smooth audio data to prevent jarring changes
        this.smoothAudioData(audioData)
        
        // Apply effects based on current mode
        switch (this.mode) {
            case 'pulse':
                this.applyPulseMode(this.smoothedAudio, beatData)
                break
            case 'reactive':
                this.applyReactiveMode(this.smoothedAudio, beatData)
                break
            case 'flow':
                this.applyFlowMode(this.smoothedAudio, beatData)
                break
            case 'ambient':
                this.applyAmbientMode(this.smoothedAudio, beatData)
                break
        }
        
        // Always apply beat effects regardless of mode
        if (beatData && beatData.isBeat) {
            this.applyBeatEffects(beatData)
        }
    }
    
    /**
     * Smooth audio data to prevent jarring visual changes
     */
    smoothAudioData(audioData) {
        const factor = this.smoothingFactor
        
        this.smoothedAudio.bass = this.lerp(this.smoothedAudio.bass, audioData.bass, 1 - factor)
        this.smoothedAudio.mids = this.lerp(this.smoothedAudio.mids, audioData.mids, 1 - factor)
        this.smoothedAudio.treble = this.lerp(this.smoothedAudio.treble, audioData.treble, 1 - factor)
        this.smoothedAudio.overall = this.lerp(this.smoothedAudio.overall, audioData.overall, 1 - factor)
    }
    
    /**
     * Apply pulse mode effects - emphasizes beats and bass
     */
    applyPulseMode(audioData, beatData) {
        const renderer = this.fluxApp.particleRenderer
        
        // Bass-driven bloom intensity
        const bloomIntensity = 1.0 + (audioData.bass * 2.0 * this.intensity)
        renderer.updateBloomIntensity(bloomIntensity)
        
        // Bass-driven color shifts (red to cyan spectrum)
        const bassHue = 180 + (audioData.bass * 60) // Cyan to blue-green
        renderer.updateAudioColors(bassHue, 1.0, 0.5)
        
        // Apply radial forces based on bass
        if (audioData.bass > 0.3) {
            this.applyRadialForce(audioData.bass)
        }
    }
    
    /**
     * Apply reactive mode effects - responds to all frequency ranges
     */
    applyReactiveMode(audioData, beatData) {
        const renderer = this.fluxApp.particleRenderer
        
        // Multi-frequency color mixing
        const bassHue = 0    // Red for bass
        const midsHue = 120  // Green for mids  
        const trebleHue = 240 // Blue for treble
        
        // Blend colors based on frequency content
        const totalEnergy = audioData.bass + audioData.mids + audioData.treble
        if (totalEnergy > 0.1) {
            const blendedHue = (bassHue * audioData.bass + 
                               midsHue * audioData.mids + 
                               trebleHue * audioData.treble) / totalEnergy
            
            renderer.updateAudioColors(blendedHue, 0.8, 0.5)
        }
        
        // Dynamic bloom based on overall energy
        const bloomIntensity = 1.0 + (audioData.overall * 1.5 * this.intensity)
        renderer.updateBloomIntensity(bloomIntensity)
        
        // Treble-driven sparkle effects
        if (audioData.treble > 0.4) {
            renderer.createSparkleEffects(audioData.treble, Math.floor(audioData.treble * 5))
        }
        
        // Bass-driven forces
        if (audioData.bass > 0.2) {
            this.applyRadialForce(audioData.bass * 0.8)
        }
        
        // Mids-driven swirling motion
        if (audioData.mids > 0.3) {
            this.applySwirlForce(audioData.mids)
        }
    }
    
    /**
     * Apply flow mode effects - creates flowing, organic movements
     */
    applyFlowMode(audioData, beatData) {
        const renderer = this.fluxApp.particleRenderer
        
        // Smooth color transitions
        const time = Date.now() * 0.001
        const flowHue = (180 + Math.sin(time * 0.5) * 60 + audioData.overall * 30) % 360
        renderer.updateAudioColors(flowHue, 0.7, 0.6)
        
        // Gentle bloom pulsing
        const bloomIntensity = 1.0 + Math.sin(time * 2) * 0.3 + (audioData.overall * 0.5 * this.intensity)
        renderer.updateBloomIntensity(bloomIntensity)
        
        // Flowing directional forces
        this.applyFlowForces(audioData)
    }
    
    /**
     * Apply ambient mode effects - subtle, atmospheric effects
     */
    applyAmbientMode(audioData, beatData) {
        const renderer = this.fluxApp.particleRenderer
        
        // Very subtle color shifts
        const ambientHue = 180 + (audioData.overall * 20) // Stay close to cyan
        renderer.updateAudioColors(ambientHue, 0.6, 0.4)
        
        // Gentle bloom variations
        const bloomIntensity = 1.0 + (audioData.overall * 0.3 * this.intensity)
        renderer.updateBloomIntensity(bloomIntensity)
        
        // Minimal particle movement
        if (audioData.overall > 0.2) {
            this.applyGentleForce(audioData.overall * 0.3)
        }
    }
    
    /**
     * Apply beat-specific effects
     */
    applyBeatEffects(beatData) {
        const renderer = this.fluxApp.particleRenderer
        const now = Date.now()
        
        // Prevent too frequent beat effects
        if (now - this.lastBeatTime < 100) return
        this.lastBeatTime = now
        
        // Beat pulse effect
        renderer.applyBeatPulse(beatData.strength * this.intensity)
        
        // Beat-driven radial explosion
        this.applyBeatExplosion(beatData.strength)
        
        // Temporary color flash
        this.applyBeatColorFlash(beatData.strength)
        
        console.log(`💥 Beat detected! Strength: ${beatData.strength.toFixed(2)}`)
    }
    
    /**
     * Apply radial force from center
     */
    applyRadialForce(strength) {
        if (!this.fluxApp.solver) return
        
        const centerX = this.fluxApp.config.containerWidth / 2
        const centerY = this.fluxApp.config.containerHeight / 2
        const radius = 150 + (strength * 100)
        const forceStrength = strength * 2.0 * this.intensity
        
        this.fluxApp.solver.apply_force(centerX, centerY, radius, forceStrength)
    }
    
    /**
     * Apply swirling force pattern
     */
    applySwirlForce(strength) {
        if (!this.fluxApp.solver) return
        
        const time = Date.now() * 0.002
        const centerX = this.fluxApp.config.containerWidth / 2
        const centerY = this.fluxApp.config.containerHeight / 2
        
        // Create multiple swirl points
        for (let i = 0; i < 3; i++) {
            const angle = (time + i * Math.PI * 2 / 3) % (Math.PI * 2)
            const distance = 100 + strength * 50
            const x = centerX + Math.cos(angle) * distance
            const y = centerY + Math.sin(angle) * distance
            const radius = 80
            const forceStrength = strength * 1.5 * this.intensity
            
            this.fluxApp.solver.apply_force(x, y, radius, forceStrength)
        }
    }
    
    /**
     * Apply flowing directional forces
     */
    applyFlowForces(audioData) {
        if (!this.fluxApp.solver) return
        
        const time = Date.now() * 0.001
        const width = this.fluxApp.config.containerWidth
        const height = this.fluxApp.config.containerHeight
        
        // Create wave-like forces
        for (let i = 0; i < 4; i++) {
            const x = (width / 4) * i + width / 8
            const y = height / 2 + Math.sin(time + i) * height / 4
            const radius = 60 + audioData.overall * 40
            const strength = audioData.overall * 1.0 * this.intensity
            
            this.fluxApp.solver.apply_force(x, y, radius, strength)
        }
    }
    
    /**
     * Apply gentle ambient force
     */
    applyGentleForce(strength) {
        if (!this.fluxApp.solver) return
        
        const centerX = this.fluxApp.config.containerWidth / 2
        const centerY = this.fluxApp.config.containerHeight / 2
        const radius = 200
        const forceStrength = strength * 0.5 * this.intensity
        
        this.fluxApp.solver.apply_force(centerX, centerY, radius, forceStrength)
    }
    
    /**
     * Apply beat explosion effect
     */
    applyBeatExplosion(strength) {
        if (!this.fluxApp.solver) return
        
        const centerX = this.fluxApp.config.containerWidth / 2
        const centerY = this.fluxApp.config.containerHeight / 2
        const radius = 100 + (strength * 150)
        const forceStrength = strength * 3.0 * this.intensity
        
        this.fluxApp.solver.apply_force(centerX, centerY, radius, forceStrength)
    }
    
    /**
     * Apply beat color flash
     */
    applyBeatColorFlash(strength) {
        const renderer = this.fluxApp.particleRenderer
        
        // Flash to white/bright color on strong beats
        if (strength > 1.0) {
            const flashHue = Math.random() * 360
            renderer.updateAudioColors(flashHue, 1.0, 0.8)
            
            // Return to normal color after a short delay
            setTimeout(() => {
                renderer.updateAudioColors(this.currentHue, 0.8, 0.5)
            }, 100)
        }
    }
    
    /**
     * Linear interpolation helper
     */
    lerp(a, b, t) {
        return a + (b - a) * t
    }
    
    /**
     * Get current effect state
     */
    getEffectState() {
        return {
            isEnabled: this.isEnabled,
            mode: this.mode,
            intensity: this.intensity,
            smoothingFactor: this.smoothingFactor,
            currentHue: this.currentHue,
            currentBloom: this.currentBloom
        }
    }
    
    /**
     * Get performance stats
     */
    getPerformanceStats() {
        return {
            processTime: 0, // Would be measured in real implementation
            effectsApplied: this.isEnabled ? 1 : 0,
            frameCount: 0 // Would be tracked in real implementation
        }
    }
    
    /**
     * Cleanup resources and reset state
     */
    cleanup() {
        this.disable()
        this.smoothedAudio = {
            bass: 0,
            mids: 0,
            treble: 0,
            overall: 0
        }
        this.currentHue = 180
        this.currentBloom = 1.0
        this.beatPulseTime = 0
        this.lastBeatTime = 0
        console.log('🧹 Audio Effects cleaned up')
    }
}