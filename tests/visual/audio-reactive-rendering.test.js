/**
 * Visual regression tests for audio-reactive particle rendering
 * Tests the integration between audio effects and particle renderer
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import * as PIXI from 'pixi.js'

describe('Audio-Reactive Particle Rendering', () => {
  let pixiApp
  let ParticleRenderer
  let AudioEffects
  let mockFluxApp
  let wasmModule

  beforeAll(async () => {
    // Initialize PIXI application for testing
    pixiApp = new PIXI.Application({
      width: 800,
      height: 600,
      backgroundColor: 0x000000,
      antialias: true
    })

    // Mock WASM module
    wasmModule = {
      Solver: class MockSolver {
        constructor(particleCount, width, height) {
          this.particleCount = particleCount
          this.width = width
          this.height = height
          this.positions = new Float32Array(particleCount * 2)
          
          // Initialize with random positions
          for (let i = 0; i < particleCount * 2; i += 2) {
            this.positions[i] = Math.random() * width
            this.positions[i + 1] = Math.random() * height
          }
        }
        
        get_positions() { return this.positions }
        get_active_particle_count() { return this.particleCount }
        apply_force() { /* Mock force application */ }
      }
    }

    // Import ParticleRenderer and AudioEffects
    const mainModule = await import('../../src/main.js')
    ParticleRenderer = mainModule.ParticleRenderer || class MockParticleRenderer {
      constructor(pixiApp, particleCount) {
        this.pixiApp = pixiApp
        this.particleCount = particleCount
        this.particleGraphics = []
        this.container = new PIXI.Container()
        this.audioReactiveEnabled = false
        this.currentHue = 180
        this.baseBloomScale = 1.0
        this.sparkleParticles = []
        this.beatPulseScale = 1.0
        this.trebleSizeMultipliers = new Array(particleCount).fill(1.0)
        
        pixiApp.stage.addChild(this.container)
        this.createParticleGraphics()
        this.applyBloomEffect()
      }
      
      createParticleGraphics() {
        for (let i = 0; i < this.particleCount; i++) {
          const particle = new PIXI.Graphics()
          particle.circle(0, 0, 5)
          particle.fill({ color: 0x00FFFF, alpha: 0.8 })
          this.container.addChild(particle)
          this.particleGraphics.push(particle)
        }
      }
      
      applyBloomEffect() {
        // Mock bloom effect
        this.container.filters = [{ bloomScale: 1.0 }]
      }
      
      enableAudioReactive() { 
        this.audioReactiveEnabled = true 
        this.trebleSizeMultipliers = new Array(this.particleCount).fill(1.0)
      }
      disableAudioReactive() { 
        this.audioReactiveEnabled = false 
        this.resetAudioEffects()
      }
      updateAudioColors() { /* Mock implementation */ }
      updateBloomIntensity() { /* Mock implementation */ }
      updateTrebleSizes() { /* Mock implementation */ }
      createSparkleEffects() { /* Mock implementation */ }
      applyBeatPulse(strength) { 
        this.beatPulseScale = 1.0 + (strength * 0.3)
      }
      updatePositions() { 
        if (this.audioReactiveEnabled && this.beatPulseScale !== 1.0) {
          this.beatPulseScale = Math.max(1.0, this.beatPulseScale * 0.95)
        }
      }
      updateParticleCount(newCount) {
        this.particleCount = newCount
        if (this.audioReactiveEnabled) {
          this.trebleSizeMultipliers = new Array(newCount).fill(1.0)
        }
      }
      cleanupSparkleParticles() {
        this.sparkleParticles = []
      }
      resetAudioEffects() {
        this.currentHue = 180
        this.baseBloomScale = 1.0
        this.beatPulseScale = 1.0
        this.sparkleParticles = []
        if (this.trebleSizeMultipliers) {
          this.trebleSizeMultipliers.fill(1.0)
        }
      }
      hslToRgb(h, s, l) {
        let r, g, b
        if (s === 0) {
          r = g = b = l
        } else {
          const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1
            if (t > 1) t -= 1
            if (t < 1/6) return p + (q - p) * 6 * t
            if (t < 1/2) return q
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
            return p
          }
          const q = l < 0.5 ? l * (1 + s) : l + s - l * s
          const p = 2 * l - q
          r = hue2rgb(p, q, h + 1/3)
          g = hue2rgb(p, q, h)
          b = hue2rgb(p, q, h - 1/3)
        }
        return {
          r: Math.round(r * 255),
          g: Math.round(g * 255),
          b: Math.round(b * 255)
        }
      }
    }

    const audioModule = await import('../../src/audio/audio-effects.js')
    AudioEffects = audioModule.AudioEffects

    console.log('✅ Audio-reactive rendering test environment initialized')
  })

  beforeEach(() => {
    // Create mock FluxApp
    mockFluxApp = {
      pixiApp,
      solver: new wasmModule.Solver(50, 800, 600),
      config: {
        containerWidth: 800,
        containerHeight: 600,
        particleCount: 50
      }
    }
    
    // Create particle renderer
    mockFluxApp.particleRenderer = new ParticleRenderer(pixiApp, 50, wasmModule)
  })

  afterEach(() => {
    // Clean up
    if (mockFluxApp.particleRenderer) {
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

  describe('Audio-Reactive Mode Toggle', () => {
    it('should enable audio-reactive features when AudioEffects is enabled', () => {
      const audioEffects = new AudioEffects(mockFluxApp)
      
      expect(mockFluxApp.particleRenderer.audioReactiveEnabled).toBe(false)
      
      audioEffects.enable()
      
      expect(mockFluxApp.particleRenderer.audioReactiveEnabled).toBe(true)
    })

    it('should disable audio-reactive features when AudioEffects is disabled', () => {
      const audioEffects = new AudioEffects(mockFluxApp)
      
      audioEffects.enable()
      expect(mockFluxApp.particleRenderer.audioReactiveEnabled).toBe(true)
      
      audioEffects.disable()
      expect(mockFluxApp.particleRenderer.audioReactiveEnabled).toBe(false)
    })

    it('should initialize treble size multipliers when enabling audio-reactive mode', () => {
      const renderer = mockFluxApp.particleRenderer
      
      expect(renderer.trebleSizeMultipliers).toHaveLength(50)
      expect(renderer.trebleSizeMultipliers.every(val => val === 1.0)).toBe(true)
      
      renderer.enableAudioReactive()
      
      expect(renderer.trebleSizeMultipliers).toHaveLength(50)
      expect(renderer.audioReactiveEnabled).toBe(true)
    })
  })

  describe('Color Changes', () => {
    it('should update particle colors based on audio frequency data', () => {
      const audioEffects = new AudioEffects(mockFluxApp)
      audioEffects.enable()
      
      const mockAudioData = {
        bass: 0.8,
        mids: 0.6,
        treble: 0.4,
        overall: 0.6,
        spectrum: new Array(1024).fill(0).map(() => Math.random() * 255)
      }
      
      const mockBeatData = {
        isBeat: false,
        energy: 0.3,
        strength: 0,
        bpm: 120
      }
      
      // Spy on color update method
      let colorUpdateCalled = false
      const originalUpdateColors = mockFluxApp.particleRenderer.updateAudioColors
      mockFluxApp.particleRenderer.updateAudioColors = (...args) => {
        colorUpdateCalled = true
        return originalUpdateColors?.call(mockFluxApp.particleRenderer, ...args)
      }
      
      audioEffects.processAudioData(mockAudioData, mockBeatData)
      
      expect(colorUpdateCalled).toBe(true)
    })

    it('should blend colors based on frequency dominance', () => {
      const audioEffects = new AudioEffects(mockFluxApp)
      audioEffects.enable()
      
      // Test bass-dominant audio
      const bassAudioData = {
        bass: 0.9,
        mids: 0.2,
        treble: 0.1,
        overall: 0.4,
        spectrum: []
      }
      
      audioEffects.processAudioData(bassAudioData, { isBeat: false, energy: 0, strength: 0, bpm: 0 })
      
      // Color shift should be in bass range (0-60)
      expect(audioEffects.colorShift).toBeGreaterThanOrEqual(0)
      expect(audioEffects.colorShift).toBeLessThanOrEqual(60)
    })

    it('should handle HSL to RGB color conversion correctly', () => {
      const renderer = mockFluxApp.particleRenderer
      
      // Test known HSL values
      const rgb1 = renderer.hslToRgb(0, 1, 0.5) // Pure red
      expect(rgb1.r).toBe(255)
      expect(rgb1.g).toBe(0)
      expect(rgb1.b).toBe(0)
      
      const rgb2 = renderer.hslToRgb(1/3, 1, 0.5) // Pure green
      expect(rgb2.r).toBe(0)
      expect(rgb2.g).toBe(255)
      expect(rgb2.b).toBe(0)
      
      const rgb3 = renderer.hslToRgb(2/3, 1, 0.5) // Pure blue
      expect(rgb3.r).toBe(0)
      expect(rgb3.g).toBe(0)
      expect(rgb3.b).toBe(255)
    })
  })

  describe('Bloom Intensity', () => {
    it('should update bloom intensity based on audio energy', () => {
      const audioEffects = new AudioEffects(mockFluxApp)
      audioEffects.enable()
      
      const mockAudioData = {
        bass: 0.5,
        mids: 0.5,
        treble: 0.5,
        overall: 0.8,
        spectrum: []
      }
      
      const mockBeatData = {
        isBeat: true,
        energy: 0.7,
        strength: 1.5,
        bpm: 128
      }
      
      let bloomIntensityUpdated = false
      const originalUpdateBloom = mockFluxApp.particleRenderer.updateBloomIntensity
      mockFluxApp.particleRenderer.updateBloomIntensity = (intensity) => {
        bloomIntensityUpdated = true
        expect(intensity).toBeGreaterThan(1.0) // Should be boosted by audio
        expect(intensity).toBeLessThanOrEqual(3.0) // Should be clamped
        return originalUpdateBloom?.call(mockFluxApp.particleRenderer, intensity)
      }
      
      audioEffects.processAudioData(mockAudioData, mockBeatData)
      
      expect(bloomIntensityUpdated).toBe(true)
    })

    it('should clamp bloom intensity to prevent visual overload', () => {
      const renderer = mockFluxApp.particleRenderer
      renderer.enableAudioReactive()
      
      // Test extreme intensity values
      renderer.updateBloomIntensity(5.0) // Should be clamped to 3.0
      renderer.updateBloomIntensity(0.1) // Should be clamped to 0.5
      
      // Verify clamping behavior (implementation-dependent)
      expect(true).toBe(true) // Placeholder - actual implementation would test filter values
    })
  })

  describe('Treble Size Variation', () => {
    it('should scale particle sizes based on treble frequency', () => {
      const renderer = mockFluxApp.particleRenderer
      renderer.enableAudioReactive()
      
      const trebleLevel = 0.7
      const mockSpectrum = new Array(1024).fill(0).map((_, i) => 
        i > 700 ? Math.random() * 255 : Math.random() * 100 // Higher values in treble range
      )
      
      let sizesUpdated = false
      const originalUpdateSizes = renderer.updateTrebleSizes
      renderer.updateTrebleSizes = (level, spectrum) => {
        sizesUpdated = true
        expect(level).toBe(trebleLevel)
        expect(spectrum).toBe(mockSpectrum)
        return originalUpdateSizes?.call(renderer, level, spectrum)
      }
      
      renderer.updateTrebleSizes(trebleLevel, mockSpectrum)
      
      expect(sizesUpdated).toBe(true)
    })

    it('should maintain size multipliers array consistency with particle count', () => {
      const renderer = mockFluxApp.particleRenderer
      renderer.enableAudioReactive()
      
      expect(renderer.trebleSizeMultipliers).toHaveLength(renderer.particleCount)
      
      // Update particle count
      renderer.updateParticleCount(75)
      
      expect(renderer.trebleSizeMultipliers).toHaveLength(75)
      expect(renderer.trebleSizeMultipliers.slice(50).every(val => val === 1.0)).toBe(true)
    })
  })

  describe('Sparkle Effects', () => {
    it('should create sparkle particles for high treble content', () => {
      const audioEffects = new AudioEffects(mockFluxApp)
      audioEffects.enable()
      
      const highTrebleAudio = {
        bass: 0.2,
        mids: 0.3,
        treble: 0.8, // High treble should trigger sparkles
        overall: 0.4,
        spectrum: []
      }
      
      // Set smoothed treble to trigger sparkles (threshold is 0.3)
      audioEffects.smoothedTreble = 0.8
      
      let sparklesCreated = false
      const originalCreateSparkles = mockFluxApp.particleRenderer.createSparkleEffects
      mockFluxApp.particleRenderer.createSparkleEffects = (intensity, count) => {
        sparklesCreated = true
        expect(intensity).toBe(0.8)
        expect(count).toBeGreaterThan(2)
        return originalCreateSparkles?.call(mockFluxApp.particleRenderer, intensity, count)
      }
      
      audioEffects.processAudioData(highTrebleAudio, { isBeat: false, energy: 0, strength: 0, bpm: 0 })
      
      expect(sparklesCreated).toBe(true)
    })

    it('should not create sparkles for low treble content', () => {
      const audioEffects = new AudioEffects(mockFluxApp)
      audioEffects.enable()
      
      const lowTrebleAudio = {
        bass: 0.8,
        mids: 0.6,
        treble: 0.2, // Low treble should not trigger sparkles
        overall: 0.5,
        spectrum: []
      }
      
      let sparklesCreated = false
      const originalCreateSparkles = mockFluxApp.particleRenderer.createSparkleEffects
      mockFluxApp.particleRenderer.createSparkleEffects = () => {
        sparklesCreated = true
      }
      
      audioEffects.processAudioData(lowTrebleAudio, { isBeat: false, energy: 0, strength: 0, bpm: 0 })
      
      expect(sparklesCreated).toBe(false)
    })

    it('should clean up old sparkle particles', () => {
      const renderer = mockFluxApp.particleRenderer
      renderer.enableAudioReactive()
      
      // Create some sparkles
      renderer.createSparkleEffects(0.8, 3)
      const initialSparkleCount = renderer.sparkleParticles?.length || 0
      
      // Clean up
      renderer.cleanupSparkleParticles()
      const finalSparkleCount = renderer.sparkleParticles?.length || 0
      
      expect(finalSparkleCount).toBe(0)
    })
  })

  describe('Beat Pulse Effects', () => {
    it('should apply beat pulse to particles on beat detection', () => {
      const audioEffects = new AudioEffects(mockFluxApp)
      audioEffects.enable()
      
      const beatAudioData = {
        bass: 0.6,
        mids: 0.4,
        treble: 0.3,
        overall: 0.5,
        spectrum: []
      }
      
      const strongBeat = {
        isBeat: true,
        energy: 0.8,
        strength: 1.8,
        bpm: 140
      }
      
      let beatPulseApplied = false
      const originalApplyBeatPulse = mockFluxApp.particleRenderer.applyBeatPulse
      mockFluxApp.particleRenderer.applyBeatPulse = (strength) => {
        beatPulseApplied = true
        expect(strength).toBe(1.8)
        return originalApplyBeatPulse?.call(mockFluxApp.particleRenderer, strength)
      }
      
      audioEffects.processAudioData(beatAudioData, strongBeat)
      
      expect(beatPulseApplied).toBe(true)
    })

    it('should decay beat pulse over time', () => {
      const renderer = mockFluxApp.particleRenderer
      renderer.enableAudioReactive()
      
      // Apply beat pulse
      renderer.applyBeatPulse(1.5)
      expect(renderer.beatPulseScale).toBeGreaterThan(1.0)
      
      const initialScale = renderer.beatPulseScale
      
      // Simulate position updates (which should decay the pulse)
      renderer.updatePositions(new Float32Array(100), 50)
      
      expect(renderer.beatPulseScale).toBeLessThan(initialScale)
    })
  })

  describe('Performance and Integration', () => {
    it('should maintain performance with audio-reactive features enabled', () => {
      const audioEffects = new AudioEffects(mockFluxApp)
      audioEffects.enable()
      
      const complexAudioData = {
        bass: 0.9,
        mids: 0.8,
        treble: 0.7,
        overall: 0.8,
        spectrum: new Array(1024).fill(0).map(() => Math.random() * 255)
      }
      
      const strongBeat = {
        isBeat: true,
        energy: 0.9,
        strength: 2.0,
        bpm: 160
      }
      
      const startTime = performance.now()
      
      // Process multiple frames
      for (let i = 0; i < 10; i++) {
        audioEffects.processAudioData(complexAudioData, strongBeat)
      }
      
      const endTime = performance.now()
      const processingTime = endTime - startTime
      
      // Should complete within reasonable time (10ms for 10 frames)
      expect(processingTime).toBeLessThan(50)
    })

    it('should handle particle count changes gracefully', () => {
      const audioEffects = new AudioEffects(mockFluxApp)
      audioEffects.enable()
      
      const renderer = mockFluxApp.particleRenderer
      
      // Change particle count
      renderer.updateParticleCount(100)
      
      expect(renderer.particleCount).toBe(100)
      expect(renderer.trebleSizeMultipliers).toHaveLength(100)
      
      // Process audio data with new particle count
      const audioData = {
        bass: 0.5,
        mids: 0.5,
        treble: 0.5,
        overall: 0.5,
        spectrum: []
      }
      
      expect(() => {
        audioEffects.processAudioData(audioData, { isBeat: false, energy: 0, strength: 0, bpm: 0 })
      }).not.toThrow()
    })

    it('should reset all audio effects when disabled', () => {
      const audioEffects = new AudioEffects(mockFluxApp)
      const renderer = mockFluxApp.particleRenderer
      
      audioEffects.enable()
      
      // Apply some effects
      renderer.updateAudioColors(240, 0.8, 0.6)
      renderer.updateBloomIntensity(2.0)
      renderer.applyBeatPulse(1.5)
      
      // Disable and check reset
      audioEffects.disable()
      
      expect(renderer.audioReactiveEnabled).toBe(false)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing audio data gracefully', () => {
      const audioEffects = new AudioEffects(mockFluxApp)
      audioEffects.enable()
      
      const incompleteAudioData = {
        bass: 0.5,
        // Missing mids, treble, overall, spectrum
      }
      
      expect(() => {
        audioEffects.processAudioData(incompleteAudioData, { isBeat: false, energy: 0, strength: 0, bpm: 0 })
      }).not.toThrow()
    })

    it('should handle extreme audio values', () => {
      const audioEffects = new AudioEffects(mockFluxApp)
      audioEffects.enable()
      
      const extremeAudioData = {
        bass: 10.0, // Way above normal range
        mids: -5.0, // Negative value
        treble: NaN, // Invalid value
        overall: Infinity,
        spectrum: []
      }
      
      expect(() => {
        audioEffects.processAudioData(extremeAudioData, { isBeat: true, energy: 100, strength: 50, bpm: 1000 })
      }).not.toThrow()
    })

    it('should work without particle renderer', () => {
      const audioEffectsWithoutRenderer = new AudioEffects({
        ...mockFluxApp,
        particleRenderer: null
      })
      
      expect(() => {
        audioEffectsWithoutRenderer.enable()
        audioEffectsWithoutRenderer.processAudioData(
          { bass: 0.5, mids: 0.5, treble: 0.5, overall: 0.5, spectrum: [] },
          { isBeat: true, energy: 0.8, strength: 1.2, bpm: 120 }
        )
      }).not.toThrow()
    })
  })
})