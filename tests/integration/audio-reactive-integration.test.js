/**
 * Integration tests for audio-reactive particle rendering system
 * Tests the complete integration between audio analysis, effects, and particle rendering
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import * as PIXI from 'pixi.js'

describe('Audio-Reactive Integration', () => {
  let AudioReactiveIntegrationExample
  let mockFluxApp
  let pixiApp
  let wasmModule

  beforeAll(async () => {
    // Initialize PIXI application
    pixiApp = new PIXI.Application({
      width: 800,
      height: 600,
      backgroundColor: 0x000000
    })

    // Mock WASM module
    wasmModule = {
      Solver: class MockSolver {
        constructor(particleCount, width, height) {
          this.particleCount = particleCount
          this.positions = new Float32Array(particleCount * 2)
          for (let i = 0; i < particleCount * 2; i += 2) {
            this.positions[i] = Math.random() * width
            this.positions[i + 1] = Math.random() * height
          }
        }
        get_positions() { return this.positions }
        get_active_particle_count() { return this.particleCount }
        apply_force() { /* Mock */ }
      }
    }

    // Import the integration example
    const integrationModule = await import('../../src/audio/audio-reactive-integration-example.js')
    AudioReactiveIntegrationExample = integrationModule.AudioReactiveIntegrationExample

    console.log('✅ Audio-reactive integration test environment initialized')
  })

  beforeEach(() => {
    // Create mock FluxApp with ParticleRenderer
    mockFluxApp = {
      pixiApp,
      solver: new wasmModule.Solver(50, 800, 600),
      config: {
        containerWidth: 800,
        containerHeight: 600,
        particleCount: 50
      },
      particleRenderer: {
        audioReactiveEnabled: false,
        currentHue: 180,
        baseBloomScale: 1.0,
        sparkleParticles: [],
        beatPulseScale: 1.0,
        trebleSizeMultipliers: new Array(50).fill(1.0),
        container: new PIXI.Container(),
        
        enableAudioReactive() { 
          this.audioReactiveEnabled = true 
          console.log('Mock: Audio-reactive rendering enabled')
        },
        disableAudioReactive() { 
          this.audioReactiveEnabled = false 
          console.log('Mock: Audio-reactive rendering disabled')
        },
        updateAudioColors(hue, saturation, lightness) {
          this.currentHue = hue
          console.log(`Mock: Updated colors - H:${hue.toFixed(1)} S:${saturation.toFixed(2)} L:${lightness.toFixed(2)}`)
        },
        updateBloomIntensity(intensity) {
          this.baseBloomScale = intensity
          console.log(`Mock: Updated bloom intensity to ${intensity.toFixed(2)}`)
        },
        updateTrebleSizes(trebleLevel, spectrum) {
          console.log(`Mock: Updated treble sizes with level ${trebleLevel.toFixed(2)}`)
        },
        createSparkleEffects(intensity, count) {
          this.sparkleParticles.push({ intensity, count, time: Date.now() })
          console.log(`Mock: Created ${count} sparkles with intensity ${intensity.toFixed(2)}`)
        },
        applyBeatPulse(strength) {
          this.beatPulseScale = 1.0 + (strength * 0.3)
          console.log(`Mock: Applied beat pulse with strength ${strength.toFixed(2)}`)
        }
      }
    }
  })

  afterEach(() => {
    // Cleanup
    if (mockFluxApp.particleRenderer.container) {
      mockFluxApp.particleRenderer.container.removeFromParent()
      mockFluxApp.particleRenderer.container.destroy()
    }
  })

  afterAll(() => {
    if (pixiApp && pixiApp.destroy) {
      try {
        pixiApp.destroy()
      } catch (error) {
        console.warn('Error destroying PIXI app:', error)
      }
    }
  })

  describe('System Initialization', () => {
    it('should create AudioReactiveIntegrationExample instance', () => {
      const integration = new AudioReactiveIntegrationExample(mockFluxApp)
      
      expect(integration).toBeDefined()
      expect(integration.fluxApp).toBe(mockFluxApp)
      expect(integration.isRunning).toBe(false)
    })

    it('should handle initialization without audio permissions gracefully', async () => {
      const integration = new AudioReactiveIntegrationExample(mockFluxApp)
      
      // Mock getUserMedia to reject (simulating denied permissions)
      const originalGetUserMedia = navigator.mediaDevices?.getUserMedia
      if (navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia = () => 
          Promise.reject(new Error('Permission denied'))
      }
      
      const result = await integration.initialize()
      
      // Should handle gracefully and return false
      expect(result).toBe(false)
      
      // Restore original method
      if (navigator.mediaDevices && originalGetUserMedia) {
        navigator.mediaDevices.getUserMedia = originalGetUserMedia
      }
    })

    it('should enable audio-reactive rendering when initialized successfully', async () => {
      const integration = new AudioReactiveIntegrationExample(mockFluxApp)
      
      // Mock successful audio initialization
      integration.audioAnalyzer = {
        initialize: () => Promise.resolve(),
        getFrequencyData: () => ({
          bass: 0.5,
          mids: 0.5,
          treble: 0.5,
          overall: 0.5,
          spectrum: new Array(1024).fill(128)
        })
      }
      
      integration.beatDetector = {
        detectBeat: () => ({
          isBeat: false,
          energy: 0.3,
          strength: 0,
          bpm: 120
        })
      }
      
      integration.audioEffects = {
        enable: () => {},
        disable: () => {},
        processAudioData: () => {},
        setMode: () => {},
        setIntensity: () => {},
        setSmoothingFactor: () => {},
        getPerformanceStats: () => ({
          processTime: 1.5,
          effectsApplied: 3,
          frameCount: 60
        }),
        getEffectState: () => ({
          isEnabled: true,
          currentMode: 'reactive',
          effectIntensity: 1.0
        })
      }
      
      expect(mockFluxApp.particleRenderer.audioReactiveEnabled).toBe(false)
      
      const result = await integration.initialize()
      
      expect(result).toBe(true)
      expect(mockFluxApp.particleRenderer.audioReactiveEnabled).toBe(true)
    })
  })

  describe('Audio-Reactive Features', () => {
    let integration

    beforeEach(async () => {
      integration = new AudioReactiveIntegrationExample(mockFluxApp)
      
      // Mock successful initialization
      integration.audioAnalyzer = {
        getFrequencyData: () => ({
          bass: 0.6,
          mids: 0.4,
          treble: 0.7,
          overall: 0.6,
          spectrum: new Array(1024).fill(0).map((_, i) => 
            i > 700 ? Math.random() * 255 : Math.random() * 100
          )
        })
      }
      
      integration.beatDetector = {
        detectBeat: (spectrum) => ({
          isBeat: Math.random() > 0.8, // Random beats for testing
          energy: Math.random() * 0.8,
          strength: Math.random() * 2,
          bpm: 120 + Math.random() * 40
        })
      }
      
      integration.audioEffects = {
        enable: () => {},
        disable: () => {},
        processAudioData: (audioData, beatData) => {
          // Mock processing that calls renderer methods
          const renderer = mockFluxApp.particleRenderer
          if (renderer.audioReactiveEnabled) {
            renderer.updateAudioColors(200, 0.8, 0.5)
            renderer.updateBloomIntensity(1.5)
            if (audioData.treble > 0.5) {
              renderer.createSparkleEffects(audioData.treble, 3)
            }
            if (beatData.isBeat) {
              renderer.applyBeatPulse(beatData.strength)
            }
          }
        },
        setMode: (mode) => { console.log(`Mock: Set mode to ${mode}`) },
        setIntensity: (intensity) => { console.log(`Mock: Set intensity to ${intensity}`) },
        setSmoothingFactor: (factor) => { console.log(`Mock: Set smoothing to ${factor}`) },
        getPerformanceStats: () => ({
          processTime: 1.2,
          effectsApplied: 5,
          frameCount: 120
        }),
        getEffectState: () => ({
          isEnabled: true,
          currentMode: 'reactive',
          effectIntensity: 1.0,
          smoothingFactor: 0.7
        })
      }
      
      await integration.initialize()
    })

    afterEach(() => {
      if (integration) {
        integration.destroy()
      }
    })

    it('should demonstrate audio-reactive features correctly', () => {
      const audioData = {
        bass: 0.8,
        mids: 0.6,
        treble: 0.9,
        overall: 0.7,
        spectrum: new Array(1024).fill(200)
      }
      
      const beatData = {
        isBeat: true,
        energy: 0.8,
        strength: 1.5,
        bpm: 140
      }
      
      const initialSparkleCount = mockFluxApp.particleRenderer.sparkleParticles.length
      const initialBeatPulse = mockFluxApp.particleRenderer.beatPulseScale
      
      integration.demonstrateAudioReactiveFeatures(audioData, beatData)
      
      // Should have updated colors
      expect(mockFluxApp.particleRenderer.currentHue).toBeGreaterThan(0)
      
      // Should have updated bloom
      expect(mockFluxApp.particleRenderer.baseBloomScale).toBeGreaterThan(1.0)
      
      // Should have created sparkles (treble > 0.4)
      expect(mockFluxApp.particleRenderer.sparkleParticles.length).toBeGreaterThan(initialSparkleCount)
      
      // Should have applied beat pulse
      expect(mockFluxApp.particleRenderer.beatPulseScale).toBeGreaterThan(initialBeatPulse)
    })

    it('should handle mode switching', () => {
      const modes = ['pulse', 'reactive', 'flow', 'ambient']
      
      modes.forEach(mode => {
        expect(() => {
          integration.setMode(mode)
        }).not.toThrow()
      })
    })

    it('should handle intensity adjustment', () => {
      const intensities = [0.5, 1.0, 1.5, 2.0]
      
      intensities.forEach(intensity => {
        expect(() => {
          integration.setIntensity(intensity)
        }).not.toThrow()
      })
    })

    it('should handle smoothing factor adjustment', () => {
      const factors = [0.1, 0.5, 0.8, 1.0]
      
      factors.forEach(factor => {
        expect(() => {
          integration.setSmoothingFactor(factor)
        }).not.toThrow()
      })
    })

    it('should provide current audio data for debugging', () => {
      const audioData = integration.getCurrentAudioData()
      
      expect(audioData).toBeDefined()
      expect(audioData.audio).toBeDefined()
      expect(audioData.beat).toBeDefined()
      expect(audioData.effects).toBeDefined()
      
      expect(audioData.audio.bass).toBeTypeOf('number')
      expect(audioData.audio.mids).toBeTypeOf('number')
      expect(audioData.audio.treble).toBeTypeOf('number')
      expect(audioData.audio.overall).toBeTypeOf('number')
      expect(audioData.audio.spectrum).toBeInstanceOf(Array)
      
      expect(audioData.beat.isBeat).toBeTypeOf('boolean')
      expect(audioData.beat.energy).toBeTypeOf('number')
      expect(audioData.beat.strength).toBeTypeOf('number')
      expect(audioData.beat.bpm).toBeTypeOf('number')
    })
  })

  describe('Performance and Lifecycle', () => {
    let integration

    beforeEach(async () => {
      integration = new AudioReactiveIntegrationExample(mockFluxApp)
      
      // Mock minimal setup for lifecycle tests
      integration.audioAnalyzer = { getFrequencyData: () => ({ bass: 0, mids: 0, treble: 0, overall: 0, spectrum: [] }) }
      integration.beatDetector = { detectBeat: () => ({ isBeat: false, energy: 0, strength: 0, bpm: 0 }) }
      integration.audioEffects = {
        enable: () => {},
        disable: () => {},
        processAudioData: () => {},
        getPerformanceStats: () => ({ processTime: 1, effectsApplied: 0, frameCount: 0 })
      }
      
      await integration.initialize()
    })

    afterEach(() => {
      if (integration) {
        integration.destroy()
      }
    })

    it('should start and stop rendering loop correctly', () => {
      expect(integration.isRunning).toBe(false)
      
      integration.start()
      expect(integration.isRunning).toBe(true)
      
      integration.stop()
      expect(integration.isRunning).toBe(false)
    })

    it('should handle multiple start/stop calls gracefully', () => {
      integration.start()
      integration.start() // Should not cause issues
      expect(integration.isRunning).toBe(true)
      
      integration.stop()
      integration.stop() // Should not cause issues
      expect(integration.isRunning).toBe(false)
    })

    it('should update performance stats', () => {
      integration.frameCount = 300
      integration.lastPerformanceLog = performance.now() - 6000 // 6 seconds ago
      
      // Should log performance stats
      expect(() => {
        integration.updatePerformanceStats()
      }).not.toThrow()
      
      // Frame count should reset after logging
      expect(integration.frameCount).toBe(0)
    })

    it('should cleanup resources properly', () => {
      integration.start()
      expect(integration.isRunning).toBe(true)
      
      integration.destroy()
      
      expect(integration.isRunning).toBe(false)
      expect(integration.audioAnalyzer).toBeNull()
      expect(integration.beatDetector).toBeNull()
      expect(integration.audioEffects).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing particle renderer gracefully', async () => {
      const fluxAppWithoutRenderer = {
        ...mockFluxApp,
        particleRenderer: null
      }
      
      const integration = new AudioReactiveIntegrationExample(fluxAppWithoutRenderer)
      
      // Mock minimal setup
      integration.audioAnalyzer = { getFrequencyData: () => ({ bass: 0, mids: 0, treble: 0, overall: 0, spectrum: [] }) }
      integration.beatDetector = { detectBeat: () => ({ isBeat: false, energy: 0, strength: 0, bpm: 0 }) }
      integration.audioEffects = {
        enable: () => {},
        disable: () => {},
        processAudioData: () => {},
        getPerformanceStats: () => ({ processTime: 1, effectsApplied: 0, frameCount: 0 })
      }
      
      expect(() => {
        integration.demonstrateAudioReactiveFeatures(
          { bass: 0.5, mids: 0.5, treble: 0.5, overall: 0.5, spectrum: [] },
          { isBeat: true, energy: 0.8, strength: 1.2, bpm: 120 }
        )
      }).not.toThrow()
    })

    it('should handle render loop errors gracefully', () => {
      const integration = new AudioReactiveIntegrationExample(mockFluxApp)
      
      // Mock setup with error-throwing analyzer
      integration.audioAnalyzer = {
        getFrequencyData: () => {
          throw new Error('Mock audio error')
        }
      }
      integration.beatDetector = { detectBeat: () => ({ isBeat: false, energy: 0, strength: 0, bpm: 0 }) }
      integration.audioEffects = { processAudioData: () => {} }
      integration.isRunning = true
      
      // Should not throw despite internal error
      expect(() => {
        integration.renderLoop()
      }).not.toThrow()
    })

    it('should handle operations when not initialized', () => {
      const integration = new AudioReactiveIntegrationExample(mockFluxApp)
      
      // Should handle gracefully when not initialized
      integration.start() // Should warn but not crash
      expect(integration.isRunning).toBe(false)
      
      const audioData = integration.getCurrentAudioData()
      expect(audioData).toBeNull()
    })
  })
})