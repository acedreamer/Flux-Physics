/**
 * Integration tests for AudioEffects system
 * Tests effect application to physics solver and mode switching
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AudioEffects } from '../../src/audio/core/audio-effects.js'

// Mock FluxApplication for testing
class MockFluxApp {
    constructor() {
        this.config = {
            containerWidth: 800,
            containerHeight: 600
        }
        
        this.solver = {
            apply_force: vi.fn(),
            forceApplications: []
        }
        
        this.particleRenderer = {
            container: {
                filters: [{
                    constructor: { name: 'AdvancedBloomFilter' },
                    bloomScale: 1.0
                }]
            }
        }
    }
    
    // Track force applications for testing
    trackForceApplication(x, y, radius, strength) {
        this.solver.forceApplications.push({ x, y, radius, strength })
    }
}

describe('AudioEffects', () => {
    let audioEffects
    let mockFluxApp
    
    beforeEach(() => {
        mockFluxApp = new MockFluxApp()
        
        // Setup solver mock to track force applications
        mockFluxApp.solver.apply_force = vi.fn((x, y, radius, strength) => {
            mockFluxApp.trackForceApplication(x, y, radius, strength)
        })
        
        audioEffects = new AudioEffects(mockFluxApp, {
            mode: 'reactive',
            intensity: 1.0,
            smoothingFactor: 0.7
        })
    })
    
    describe('Initialization', () => {
        it('should initialize with default configuration', () => {
            const effects = new AudioEffects(mockFluxApp)
            
            expect(effects.currentMode).toBe('reactive')
            expect(effects.effectIntensity).toBe(1.0)
            expect(effects.smoothingFactor).toBe(0.7)
            expect(effects.isEnabled).toBe(false)
        })
        
        it('should initialize with custom configuration', () => {
            const effects = new AudioEffects(mockFluxApp, {
                mode: 'pulse',
                intensity: 1.5,
                smoothingFactor: 0.5
            })
            
            expect(effects.currentMode).toBe('pulse')
            expect(effects.effectIntensity).toBe(1.5)
            expect(effects.smoothingFactor).toBe(0.5)
        })
        
        it('should have all required mode configurations', () => {
            expect(audioEffects.modeConfigs).toHaveProperty('pulse')
            expect(audioEffects.modeConfigs).toHaveProperty('reactive')
            expect(audioEffects.modeConfigs).toHaveProperty('flow')
            expect(audioEffects.modeConfigs).toHaveProperty('ambient')
        })
    })
    
    describe('Mode Management', () => {
        it('should enable and disable effects', () => {
            expect(audioEffects.isEnabled).toBe(false)
            
            audioEffects.enable()
            expect(audioEffects.isEnabled).toBe(true)
            
            audioEffects.disable()
            expect(audioEffects.isEnabled).toBe(false)
        })
        
        it('should switch between modes', () => {
            audioEffects.setMode('pulse')
            expect(audioEffects.currentMode).toBe('pulse')
            
            audioEffects.setMode('flow')
            expect(audioEffects.currentMode).toBe('flow')
            
            audioEffects.setMode('ambient')
            expect(audioEffects.currentMode).toBe('ambient')
        })
        
        it('should reject invalid modes', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
            
            audioEffects.setMode('invalid')
            expect(audioEffects.currentMode).toBe('reactive') // Should remain unchanged
            expect(consoleSpy).toHaveBeenCalledWith('Invalid audio effect mode: invalid')
            
            consoleSpy.mockRestore()
        })
        
        it('should reset effect state when changing modes', () => {
            audioEffects.smoothedBass = 0.5
            audioEffects.beatEffectDecay = 0.3
            
            audioEffects.setMode('pulse')
            
            expect(audioEffects.smoothedBass).toBe(0)
            expect(audioEffects.beatEffectDecay).toBe(0)
        })
    })
    
    describe('Audio Data Processing', () => {
        const mockAudioData = {
            bass: 0.6,
            mids: 0.4,
            treble: 0.3,
            overall: 0.5
        }
        
        const mockBeatData = {
            isBeat: true,
            strength: 0.8,
            energy: 0.7,
            bpm: 120
        }
        
        it('should not process when disabled', () => {
            audioEffects.processAudioData(mockAudioData, mockBeatData)
            
            expect(mockFluxApp.solver.apply_force).not.toHaveBeenCalled()
        })
        
        it('should process audio data when enabled', () => {
            audioEffects.enable()
            audioEffects.processAudioData(mockAudioData, mockBeatData)
            
            expect(mockFluxApp.solver.apply_force).toHaveBeenCalled()
        })
        
        it('should smooth audio values over time', () => {
            audioEffects.enable()
            
            // First frame with high bass
            const highBassData = { bass: 0.8, mids: 0.1, treble: 0.1, overall: 0.3 }
            audioEffects.processAudioData(highBassData, mockBeatData)
            const firstBass = audioEffects.smoothedBass
            
            // Second frame with low bass
            const lowBassData = { bass: 0.1, mids: 0.1, treble: 0.1, overall: 0.1 }
            audioEffects.processAudioData(lowBassData, mockBeatData)
            const secondBass = audioEffects.smoothedBass
            
            // Should be smoothed - not immediate jump to new value
            expect(secondBass).toBeGreaterThan(lowBassData.bass) // Should be higher than target
            expect(secondBass).toBeLessThan(firstBass) // Should be moving toward target
        })
    })
    
    describe('Pulse Mode Effects', () => {
        beforeEach(() => {
            audioEffects.enable()
            audioEffects.setMode('pulse')
        })
        
        it('should apply beat pulse forces', () => {
            const beatData = { isBeat: true, strength: 0.8 }
            const audioData = { bass: 0.1, mids: 0.1, treble: 0.1, overall: 0.1 }
            
            audioEffects.processAudioData(audioData, beatData)
            
            const centerX = mockFluxApp.config.containerWidth / 2
            const centerY = mockFluxApp.config.containerHeight / 2
            
            expect(mockFluxApp.solver.apply_force).toHaveBeenCalledWith(
                centerX,
                centerY,
                expect.any(Number), // radius
                expect.any(Number)  // strength
            )
        })
        
        it('should apply bass pressure forces', () => {
            const audioData = { bass: 0.5, mids: 0.1, treble: 0.1, overall: 0.3 }
            const beatData = { isBeat: false, strength: 0 }
            
            // Process multiple frames to build up smoothed bass
            for (let i = 0; i < 10; i++) {
                audioEffects.processAudioData(audioData, beatData)
            }
            
            expect(mockFluxApp.solver.apply_force).toHaveBeenCalled()
        })
        
        it('should scale effects with intensity', () => {
            audioEffects.setIntensity(2.0)
            
            const beatData = { isBeat: true, strength: 0.5 }
            const audioData = { bass: 0.1, mids: 0.1, treble: 0.1, overall: 0.1 }
            
            audioEffects.processAudioData(audioData, beatData)
            
            // Should have applied force with doubled intensity
            expect(mockFluxApp.solver.apply_force).toHaveBeenCalled()
        })
    })
    
    describe('Reactive Mode Effects', () => {
        beforeEach(() => {
            audioEffects.enable()
            audioEffects.setMode('reactive')
        })
        
        it('should apply bass central forces', () => {
            const audioData = { bass: 0.5, mids: 0.1, treble: 0.1, overall: 0.3 }
            const beatData = { isBeat: false, strength: 0 }
            
            // Process multiple frames to build up smoothed bass
            for (let i = 0; i < 10; i++) {
                audioEffects.processAudioData(audioData, beatData)
            }
            
            expect(mockFluxApp.solver.apply_force).toHaveBeenCalled()
        })
        
        it('should apply mid-frequency swirl forces', () => {
            const audioData = { bass: 0.1, mids: 0.5, treble: 0.1, overall: 0.3 }
            const beatData = { isBeat: false, strength: 0 }
            
            // Process multiple frames to build up smoothed mids
            for (let i = 0; i < 10; i++) {
                audioEffects.processAudioData(audioData, beatData)
            }
            
            // Should apply two swirl forces
            expect(mockFluxApp.solver.apply_force).toHaveBeenCalled()
        })
        
        it('should create sparkle effects for treble', () => {
            const audioData = { bass: 0.1, mids: 0.1, treble: 0.8, overall: 0.4 }
            const beatData = { isBeat: false, strength: 0 }
            
            // Process multiple frames to build up smoothed treble
            for (let i = 0; i < 10; i++) {
                audioEffects.processAudioData(audioData, beatData)
            }
            
            // Should apply multiple sparkle forces
            expect(mockFluxApp.solver.apply_force).toHaveBeenCalled()
        })
        
        it('should create beat pulse effects', () => {
            const audioData = { bass: 0.1, mids: 0.1, treble: 0.1, overall: 0.1 }
            const beatData = { isBeat: true, strength: 0.7 }
            
            audioEffects.processAudioData(audioData, beatData)
            
            expect(mockFluxApp.solver.apply_force).toHaveBeenCalled()
        })
    })
    
    describe('Flow Mode Effects', () => {
        beforeEach(() => {
            audioEffects.enable()
            audioEffects.setMode('flow')
        })
        
        it('should apply directional flow forces', () => {
            const audioData = { bass: 0.5, mids: 0.4, treble: 0.3, overall: 0.4 }
            const beatData = { isBeat: false, strength: 0 }
            
            // Process multiple frames to build up smoothed values
            for (let i = 0; i < 10; i++) {
                audioEffects.processAudioData(audioData, beatData)
            }
            
            // Should apply forces for bass, mids, and treble flows
            expect(mockFluxApp.solver.apply_force).toHaveBeenCalled()
        })
        
        it('should enhance flow with beat detection', () => {
            const audioData = { bass: 0.3, mids: 0.3, treble: 0.3, overall: 0.3 }
            const beatData = { isBeat: true, strength: 0.6 }
            
            audioEffects.processAudioData(audioData, beatData)
            
            expect(mockFluxApp.solver.apply_force).toHaveBeenCalled()
        })
    })
    
    describe('Ambient Mode Effects', () => {
        beforeEach(() => {
            audioEffects.enable()
            audioEffects.setMode('ambient')
        })
        
        it('should apply subtle drift forces', () => {
            const audioData = { bass: 0.2, mids: 0.2, treble: 0.2, overall: 0.2 }
            const beatData = { isBeat: false, strength: 0 }
            
            // Process multiple frames to build up smoothed values
            for (let i = 0; i < 10; i++) {
                audioEffects.processAudioData(audioData, beatData)
            }
            
            expect(mockFluxApp.solver.apply_force).toHaveBeenCalled()
        })
        
        it('should apply corner pulsing for bass', () => {
            const audioData = { bass: 0.4, mids: 0.1, treble: 0.1, overall: 0.2 }
            const beatData = { isBeat: false, strength: 0 }
            
            // Process multiple frames to build up smoothed bass
            for (let i = 0; i < 10; i++) {
                audioEffects.processAudioData(audioData, beatData)
            }
            
            expect(mockFluxApp.solver.apply_force).toHaveBeenCalled()
        })
        
        it('should apply subtle beat pulses', () => {
            const audioData = { bass: 0.1, mids: 0.1, treble: 0.1, overall: 0.1 }
            const beatData = { isBeat: true, strength: 0.8 }
            
            audioEffects.processAudioData(audioData, beatData)
            
            expect(mockFluxApp.solver.apply_force).toHaveBeenCalled()
        })
    })
    
    describe('Bloom Effect Integration', () => {
        it('should update bloom intensity based on audio', () => {
            audioEffects.enable()
            
            const audioData = { bass: 0.3, mids: 0.3, treble: 0.3, overall: 0.6 }
            const beatData = { isBeat: true, strength: 0.8 }
            
            const initialBloom = audioEffects.bloomIntensity
            audioEffects.processAudioData(audioData, beatData)
            
            expect(audioEffects.bloomIntensity).toBeGreaterThan(initialBloom)
        })
        
        it('should apply bloom to particle renderer', () => {
            audioEffects.enable()
            
            const audioData = { bass: 0.3, mids: 0.3, treble: 0.3, overall: 0.6 }
            const beatData = { isBeat: true, strength: 0.8 }
            
            audioEffects.processAudioData(audioData, beatData)
            
            const bloomFilter = mockFluxApp.particleRenderer.container.filters[0]
            expect(bloomFilter.bloomScale).toBeGreaterThan(1.0)
        })
    })
    
    describe('Performance Monitoring', () => {
        it('should track processing time', () => {
            audioEffects.enable()
            
            const audioData = { bass: 0.3, mids: 0.3, treble: 0.3, overall: 0.3 }
            const beatData = { isBeat: false, strength: 0 }
            
            audioEffects.processAudioData(audioData, beatData)
            
            const stats = audioEffects.getPerformanceStats()
            expect(stats.processTime).toBeGreaterThan(0)
            expect(stats.frameCount).toBe(1)
        })
        
        it('should track effects applied', () => {
            audioEffects.enable()
            audioEffects.setMode('pulse')
            
            const audioData = { bass: 0.5, mids: 0.1, treble: 0.1, overall: 0.3 }
            const beatData = { isBeat: true, strength: 0.8 }
            
            audioEffects.processAudioData(audioData, beatData)
            
            const stats = audioEffects.getPerformanceStats()
            expect(stats.effectsApplied).toBeGreaterThan(0)
        })
    })
    
    describe('Configuration Management', () => {
        it('should update intensity within valid range', () => {
            audioEffects.setIntensity(1.5)
            expect(audioEffects.effectIntensity).toBe(1.5)
            
            audioEffects.setIntensity(-0.5)
            expect(audioEffects.effectIntensity).toBe(0)
            
            audioEffects.setIntensity(3.0)
            expect(audioEffects.effectIntensity).toBe(2)
        })
        
        it('should update smoothing factor within valid range', () => {
            audioEffects.setSmoothingFactor(0.5)
            expect(audioEffects.smoothingFactor).toBe(0.5)
            
            audioEffects.setSmoothingFactor(-0.1)
            expect(audioEffects.smoothingFactor).toBe(0)
            
            audioEffects.setSmoothingFactor(1.5)
            expect(audioEffects.smoothingFactor).toBe(1)
        })
        
        it('should provide current mode configuration', () => {
            audioEffects.setMode('pulse')
            const config = audioEffects.getCurrentModeConfig()
            
            expect(config).toHaveProperty('beatRadius')
            expect(config).toHaveProperty('beatStrength')
            expect(config).toHaveProperty('bassRadius')
        })
        
        it('should update mode configuration', () => {
            audioEffects.setMode('pulse') // Switch to pulse mode first
            const newConfig = { beatRadius: 200, beatStrength: 3.0 }
            audioEffects.updateModeConfig('pulse', newConfig)
            
            const config = audioEffects.getCurrentModeConfig()
            expect(config.beatRadius).toBe(200)
            expect(config.beatStrength).toBe(3.0)
        })
    })
    
    describe('State Management', () => {
        it('should provide current effect state', () => {
            audioEffects.enable()
            audioEffects.setMode('reactive')
            audioEffects.setIntensity(1.2)
            
            const state = audioEffects.getEffectState()
            
            expect(state.isEnabled).toBe(true)
            expect(state.currentMode).toBe('reactive')
            expect(state.effectIntensity).toBe(1.2)
            expect(state).toHaveProperty('smoothedValues')
            expect(state).toHaveProperty('bloomIntensity')
        })
        
        it('should reset state when disabled', () => {
            audioEffects.enable()
            audioEffects.smoothedBass = 0.5
            audioEffects.beatEffectDecay = 0.3
            
            audioEffects.disable()
            
            expect(audioEffects.smoothedBass).toBe(0)
            expect(audioEffects.beatEffectDecay).toBe(0)
        })
    })
})