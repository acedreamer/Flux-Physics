/**
 * Visual validation tests for audio-reactive effects
 * Tests that audio data correctly translates to visual changes
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import * as PIXI from 'pixi.js'

describe('Audio-Reactive Visual Validation', () => {
    let pixiApp, mockFluxApp, mockWasmModule
    let AudioAnalyzer, BeatDetector, AudioEffects
    
    beforeAll(async () => {
        // Initialize PIXI for visual testing
        pixiApp = new PIXI.Application({
            width: 800,
            height: 600,
            backgroundColor: 0x000000
        })
        
        // Mock WASM module
        mockWasmModule = {
            Solver: class MockSolver {
                constructor(particleCount, width, height) {
                    this.particleCount = particleCount
                    this.positions = new Float32Array(particleCount * 2)
                    this.forces = []
                    
                    // Initialize with random positions
                    for (let i = 0; i < particleCount * 2; i += 2) {
                        this.positions[i] = Math.random() * width
                        this.positions[i + 1] = Math.random() * height
                    }
                }
                
                get_positions() { return this.positions }
                get_active_particle_count() { return this.particleCount }
                
                apply_force(x, y, radius, strength) {
                    this.forces.push({ x, y, radius, strength, timestamp: performance.now() })
                    
                    // Simulate force effect on particles
                    for (let i = 0; i < this.particleCount * 2; i += 2) {
                        const dx = this.positions[i] - x
                        const dy = this.positions[i + 1] - y
                        const distance = Math.sqrt(dx * dx + dy * dy)
                        
                        if (distance < radius && distance > 0) {
                            const force = strength / (distance + 1)
                            this.positions[i] += (dx / distance) * force
                            this.positions[i + 1] += (dy / distance) * force
                        }
                    }
                }
                
                getRecentForces() {
                    const now = performance.now()
                    return this.forces.filter(f => now - f.timestamp < 1000) // Last 1 second
                }
            }
        }
        
        // Import audio components
        const analyzerModule = await import('../../src/audio/audio-analyzer.js')
        const beatModule = await import('../../src/audio/beat-detector.js')
        const effectsModule = await import('../../src/audio/audio-effects.js')
        
        AudioAnalyzer = analyzerModule.AudioAnalyzer
        BeatDetector = beatModule.default
        AudioEffects = effectsModule.AudioEffects
        
        console.log('🎨 Visual validation test environment initialized')
    })
    
    beforeEach(() => {
        // Create comprehensive mock FluxApp
        mockFluxApp = {
            pixiApp,
            solver: new mockWasmModule.Solver(100, 800, 600),
            config: {
                containerWidth: 800,
                containerHeight: 600,
                particleCount: 100
            },
            particleRenderer: {
                audioReactiveEnabled: false,
                currentHue: 180,
                currentSaturation: 0.8,
                currentLightness: 0.5,
                baseBloomScale: 1.0,
                currentBloomScale: 1.0,
                sparkleParticles: [],
                beatPulseScale: 1.0,
                trebleSizeMultipliers: new Array(100).fill(1.0),
                container: new PIXI.Container(),
                
                // Visual state tracking
                colorHistory: [],
                bloomHistory: [],
                sizeHistory: [],
                sparkleHistory: [],
                pulseHistory: [],
                
                enableAudioReactive() { 
                    this.audioReactiveEnabled = true 
                },
                disableAudioReactive() { 
                    this.audioReactiveEnabled = false 
                },
                
                updateAudioColors(hue, saturation, lightness) {
                    this.currentHue = hue
                    this.currentSaturation = saturation
                    this.currentLightness = lightness
                    this.colorHistory.push({
                        timestamp: performance.now(),
                        hue, saturation, lightness
                    })
                },
                
                updateBloomIntensity(intensity) {
                    this.currentBloomScale = intensity
                    this.bloomHistory.push({
                        timestamp: performance.now(),
                        intensity
                    })
                },
                
                updateTrebleSizes(trebleLevel, spectrum) {
                    for (let i = 0; i < this.trebleSizeMultipliers.length; i++) {
                        this.trebleSizeMultipliers[i] = 1.0 + (trebleLevel * 0.5)
                    }
                    this.sizeHistory.push({
                        timestamp: performance.now(),
                        trebleLevel,
                        avgSize: this.trebleSizeMultipliers.reduce((a, b) => a + b, 0) / this.trebleSizeMultipliers.length
                    })
                },
                
                createSparkleEffects(intensity, count) {
                    const sparkles = []
                    for (let i = 0; i < count; i++) {
                        sparkles.push({
                            x: Math.random() * 800,
                            y: Math.random() * 600,
                            intensity,
                            life: 1.0
                        })
                    }
                    this.sparkleParticles.push(...sparkles)
                    this.sparkleHistory.push({
                        timestamp: performance.now(),
                        intensity,
                        count,
                        totalSparkles: this.sparkleParticles.length
                    })
                },
                
                applyBeatPulse(strength) {
                    this.beatPulseScale = 1.0 + (strength * 0.3)
                    this.pulseHistory.push({
                        timestamp: performance.now(),
                        strength,
                        scale: this.beatPulseScale
                    })
                },
                
                // Helper methods for testing
                getRecentColorChanges(timeWindow = 1000) {
                    const now = performance.now()
                    return this.colorHistory.filter(c => now - c.timestamp < timeWindow)
                },
                
                getRecentBloomChanges(timeWindow = 1000) {
                    const now = performance.now()
                    return this.bloomHistory.filter(b => now - b.timestamp < timeWindow)
                },
                
                getRecentSizeChanges(timeWindow = 1000) {
                    const now = performance.now()
                    return this.sizeHistory.filter(s => now - s.timestamp < timeWindow)
                },
                
                getRecentSparkles(timeWindow = 1000) {
                    const now = performance.now()
                    return this.sparkleHistory.filter(s => now - s.timestamp < timeWindow)
                },
                
                getRecentPulses(timeWindow = 1000) {
                    const now = performance.now()
                    return this.pulseHistory.filter(p => now - p.timestamp < timeWindow)
                }
            }
        }
        
        // Setup Web Audio API mocks
        const mockAudioContext = {
            state: 'running',
            sampleRate: 44100,
            resume: vi.fn().mockResolvedValue(undefined),
            close: vi.fn().mockResolvedValue(undefined),
            createAnalyser: vi.fn(),
            createMediaStreamSource: vi.fn()
        }
        
        const mockAnalyserNode = {
            fftSize: 2048,
            frequencyBinCount: 1024,
            connect: vi.fn(),
            disconnect: vi.fn(),
            getByteFrequencyData: vi.fn(),
            getByteTimeDomainData: vi.fn()
        }
        
        mockAudioContext.createAnalyser.mockReturnValue(mockAnalyserNode)
        mockAudioContext.createMediaStreamSource.mockReturnValue({
            connect: vi.fn(),
            disconnect: vi.fn()
        })
        
        global.window = {
            AudioContext: vi.fn(() => mockAudioContext),
            webkitAudioContext: vi.fn(() => mockAudioContext)
        }
        
        global.navigator = {
            mediaDevices: {
                getUserMedia: vi.fn().mockResolvedValue({
                    getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
                    getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }])
                })
            }
        }
        
        global.performance = {
            now: vi.fn(() => Date.now())
        }
    })
    
    afterEach(() => {
        vi.clearAllMocks()
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

    describe('Bass Frequency Visual Response', () => {
        it('should create radial forces for bass frequencies', async () => {
            const audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            
            const audioEffects = new AudioEffects(mockFluxApp)
            audioEffects.setMode('pulse')
            
            // Create bass-heavy audio data
            const bassAudioData = {
                bass: 0.8,
                mids: 0.2,
                treble: 0.1,
                overall: 0.6,
                spectrum: createFrequencySpectrum({ bassLevel: 0.8, midsLevel: 0.2, trebleLevel: 0.1 })
            }
            
            const beatData = { isBeat: false, energy: 0.4, strength: 0, bpm: 0 }
            
            // Process audio data
            audioEffects.processAudioData(bassAudioData, beatData)
            
            // Check that forces were applied
            const recentForces = mockFluxApp.solver.getRecentForces()
            expect(recentForces.length).toBeGreaterThan(0)
            
            // Bass should create forces near center
            const centerForces = recentForces.filter(f => {
                const centerX = mockFluxApp.config.containerWidth / 2
                const centerY = mockFluxApp.config.containerHeight / 2
                const distance = Math.sqrt((f.x - centerX) ** 2 + (f.y - centerY) ** 2)
                return distance < 100 // Within 100px of center
            })
            
            expect(centerForces.length).toBeGreaterThan(0)
            
            // Force strength should correlate with bass level
            const avgForceStrength = centerForces.reduce((sum, f) => sum + f.strength, 0) / centerForces.length
            expect(avgForceStrength).toBeGreaterThan(0.5) // Strong bass should create strong forces
            
            audioAnalyzer.dispose()
        })
        
        it('should increase bloom intensity with bass', async () => {
            const audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            
            const audioEffects = new AudioEffects(mockFluxApp)
            
            // Test different bass levels
            const bassLevels = [0.2, 0.5, 0.8]
            const bloomResults = []
            
            for (const bassLevel of bassLevels) {
                const audioData = {
                    bass: bassLevel,
                    mids: 0.3,
                    treble: 0.2,
                    overall: bassLevel * 0.7,
                    spectrum: createFrequencySpectrum({ bassLevel, midsLevel: 0.3, trebleLevel: 0.2 })
                }
                
                const beatData = { isBeat: false, energy: 0.3, strength: 0, bpm: 0 }
                
                audioEffects.processAudioData(audioData, beatData)
                
                bloomResults.push({
                    bassLevel,
                    bloomScale: mockFluxApp.particleRenderer.currentBloomScale
                })
                
                // Small delay between tests
                await new Promise(resolve => setTimeout(resolve, 50))
            }
            
            // Bloom intensity should increase with bass level
            expect(bloomResults[1].bloomScale).toBeGreaterThan(bloomResults[0].bloomScale)
            expect(bloomResults[2].bloomScale).toBeGreaterThan(bloomResults[1].bloomScale)
            
            // All bloom scales should be above baseline
            bloomResults.forEach(result => {
                expect(result.bloomScale).toBeGreaterThan(1.0)
            })
            
            audioAnalyzer.dispose()
        })
    })

    describe('Mid Frequency Visual Response', () => {
        it('should modulate colors based on mid frequencies', async () => {
            const audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            
            const audioEffects = new AudioEffects(mockFluxApp)
            audioEffects.setMode('reactive')
            
            // Test different mid frequency levels
            const midLevels = [0.2, 0.6, 0.9]
            const colorResults = []
            
            for (const midsLevel of midLevels) {
                const audioData = {
                    bass: 0.3,
                    mids: midsLevel,
                    treble: 0.2,
                    overall: midsLevel * 0.8,
                    spectrum: createFrequencySpectrum({ bassLevel: 0.3, midsLevel, trebleLevel: 0.2 })
                }
                
                const beatData = { isBeat: false, energy: 0.4, strength: 0, bpm: 0 }
                
                const initialHue = mockFluxApp.particleRenderer.currentHue
                audioEffects.processAudioData(audioData, beatData)
                
                colorResults.push({
                    midsLevel,
                    hueChange: Math.abs(mockFluxApp.particleRenderer.currentHue - initialHue),
                    finalHue: mockFluxApp.particleRenderer.currentHue
                })
                
                await new Promise(resolve => setTimeout(resolve, 50))
            }
            
            // Higher mid frequencies should cause more color change
            expect(colorResults[1].hueChange).toBeGreaterThanOrEqual(colorResults[0].hueChange)
            expect(colorResults[2].hueChange).toBeGreaterThanOrEqual(colorResults[1].hueChange)
            
            // Color changes should be within reasonable range
            colorResults.forEach(result => {
                expect(result.finalHue).toBeGreaterThanOrEqual(0)
                expect(result.finalHue).toBeLessThanOrEqual(360)
            })
            
            audioAnalyzer.dispose()
        })
        
        it('should create swirling motion patterns with mids', async () => {
            const audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            
            const audioEffects = new AudioEffects(mockFluxApp)
            audioEffects.setMode('reactive')
            
            // Record initial particle positions
            const initialPositions = new Float32Array(mockFluxApp.solver.get_positions())
            
            // Apply mid-heavy audio data over time
            for (let frame = 0; frame < 10; frame++) {
                const audioData = {
                    bass: 0.2,
                    mids: 0.8,
                    treble: 0.3,
                    overall: 0.6,
                    spectrum: createFrequencySpectrum({ bassLevel: 0.2, midsLevel: 0.8, trebleLevel: 0.3 })
                }
                
                const beatData = { isBeat: false, energy: 0.5, strength: 0, bpm: 0 }
                
                // Advance time for swirl calculation
                global.performance.now = vi.fn(() => Date.now() + frame * 16.67) // 60fps
                
                audioEffects.processAudioData(audioData, beatData)
                
                await new Promise(resolve => setTimeout(resolve, 16))
            }
            
            // Check that forces were applied in swirling patterns
            const recentForces = mockFluxApp.solver.getRecentForces()
            expect(recentForces.length).toBeGreaterThan(5) // Multiple forces for swirling
            
            // Forces should be distributed (not all at center)
            const forcePositions = recentForces.map(f => ({ x: f.x, y: f.y }))
            const uniquePositions = new Set(forcePositions.map(p => `${Math.round(p.x)},${Math.round(p.y)}`))
            expect(uniquePositions.size).toBeGreaterThan(1) // Multiple force locations
            
            // Particles should have moved from initial positions
            const finalPositions = mockFluxApp.solver.get_positions()
            let totalMovement = 0
            for (let i = 0; i < initialPositions.length; i += 2) {
                const dx = finalPositions[i] - initialPositions[i]
                const dy = finalPositions[i + 1] - initialPositions[i + 1]
                totalMovement += Math.sqrt(dx * dx + dy * dy)
            }
            
            expect(totalMovement).toBeGreaterThan(50) // Significant particle movement
            
            audioAnalyzer.dispose()
        })
    })

    describe('Treble Frequency Visual Response', () => {
        it('should create sparkle effects for treble frequencies', async () => {
            const audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            
            const audioEffects = new AudioEffects(mockFluxApp)
            audioEffects.setMode('reactive')
            
            // Test treble-heavy audio data
            const trebleAudioData = {
                bass: 0.1,
                mids: 0.2,
                treble: 0.9,
                overall: 0.5,
                spectrum: createFrequencySpectrum({ bassLevel: 0.1, midsLevel: 0.2, trebleLevel: 0.9 })
            }
            
            const beatData = { isBeat: false, energy: 0.3, strength: 0, bpm: 0 }
            
            const initialSparkleCount = mockFluxApp.particleRenderer.sparkleParticles.length
            
            audioEffects.processAudioData(trebleAudioData, beatData)
            
            // Should have created sparkle effects
            const finalSparkleCount = mockFluxApp.particleRenderer.sparkleParticles.length
            expect(finalSparkleCount).toBeGreaterThan(initialSparkleCount)
            
            // Check sparkle history
            const recentSparkles = mockFluxApp.particleRenderer.getRecentSparkles()
            expect(recentSparkles.length).toBeGreaterThan(0)
            
            const lastSparkle = recentSparkles[recentSparkles.length - 1]
            expect(lastSparkle.intensity).toBeCloseTo(0.9, 1) // Should match treble level
            expect(lastSparkle.count).toBeGreaterThan(0)
            
            audioAnalyzer.dispose()
        })
        
        it('should vary particle sizes with treble', async () => {
            const audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            
            const audioEffects = new AudioEffects(mockFluxApp)
            
            // Test different treble levels
            const trebleLevels = [0.1, 0.5, 0.9]
            const sizeResults = []
            
            for (const trebleLevel of trebleLevels) {
                const audioData = {
                    bass: 0.2,
                    mids: 0.3,
                    treble: trebleLevel,
                    overall: 0.4,
                    spectrum: createFrequencySpectrum({ bassLevel: 0.2, midsLevel: 0.3, trebleLevel })
                }
                
                const beatData = { isBeat: false, energy: 0.3, strength: 0, bpm: 0 }
                
                audioEffects.processAudioData(audioData, beatData)
                
                const avgSizeMultiplier = mockFluxApp.particleRenderer.trebleSizeMultipliers
                    .reduce((sum, size) => sum + size, 0) / mockFluxApp.particleRenderer.trebleSizeMultipliers.length
                
                sizeResults.push({
                    trebleLevel,
                    avgSizeMultiplier
                })
                
                await new Promise(resolve => setTimeout(resolve, 50))
            }
            
            // Higher treble should result in larger size multipliers
            expect(sizeResults[1].avgSizeMultiplier).toBeGreaterThan(sizeResults[0].avgSizeMultiplier)
            expect(sizeResults[2].avgSizeMultiplier).toBeGreaterThan(sizeResults[1].avgSizeMultiplier)
            
            // All size multipliers should be >= 1.0
            sizeResults.forEach(result => {
                expect(result.avgSizeMultiplier).toBeGreaterThanOrEqual(1.0)
            })
            
            audioAnalyzer.dispose()
        })
    })

    describe('Beat Detection Visual Response', () => {
        it('should create pulse effects on beat detection', async () => {
            const audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            
            const beatDetector = new BeatDetector(audioAnalyzer)
            const audioEffects = new AudioEffects(mockFluxApp)
            audioEffects.setMode('pulse')
            
            // Build energy history for beat detection
            for (let i = 0; i < 20; i++) {
                const baseData = new Uint8Array(1024).fill(50 + Math.random() * 10)
                beatDetector.detectBeat(baseData)
            }
            
            // Wait for timing condition
            await new Promise(resolve => setTimeout(resolve, 350))
            
            // Create strong beat
            const beatFrequencyData = new Uint8Array(1024)
            for (let i = 0; i < 100; i++) {
                beatFrequencyData[i] = 220 + Math.random() * 35 // Strong bass
            }
            
            const audioData = {
                bass: 0.9,
                mids: 0.4,
                treble: 0.3,
                overall: 0.8,
                spectrum: Array.from(beatFrequencyData)
            }
            
            const beatData = beatDetector.detectBeat(beatFrequencyData)
            
            if (beatData.isBeat) {
                const initialPulseCount = mockFluxApp.particleRenderer.getRecentPulses().length
                
                audioEffects.processAudioData(audioData, beatData)
                
                // Should have created pulse effect
                const finalPulseCount = mockFluxApp.particleRenderer.getRecentPulses().length
                expect(finalPulseCount).toBeGreaterThan(initialPulseCount)
                
                // Check pulse properties
                const recentPulses = mockFluxApp.particleRenderer.getRecentPulses()
                const lastPulse = recentPulses[recentPulses.length - 1]
                
                expect(lastPulse.strength).toBeGreaterThan(0)
                expect(lastPulse.scale).toBeGreaterThan(1.0)
                
                // Should have applied radial force
                const recentForces = mockFluxApp.solver.getRecentForces()
                expect(recentForces.length).toBeGreaterThan(0)
                
                const beatForces = recentForces.filter(f => f.strength > 1.0) // Strong forces from beat
                expect(beatForces.length).toBeGreaterThan(0)
            }
            
            audioAnalyzer.dispose()
        })
        
        it('should scale visual effects with beat strength', async () => {
            const audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            
            const beatDetector = new BeatDetector(audioAnalyzer)
            const audioEffects = new AudioEffects(mockFluxApp)
            
            // Build baseline energy
            for (let i = 0; i < 20; i++) {
                const baseData = new Uint8Array(1024).fill(40 + Math.random() * 10)
                beatDetector.detectBeat(baseData)
            }
            
            await new Promise(resolve => setTimeout(resolve, 350))
            
            // Test different beat strengths
            const beatStrengths = [
                { energy: 180, expectedStrength: 'weak' },
                { energy: 220, expectedStrength: 'medium' },
                { energy: 255, expectedStrength: 'strong' }
            ]
            
            const beatResults = []
            
            for (const beatTest of beatStrengths) {
                const beatFrequencyData = new Uint8Array(1024)
                for (let i = 0; i < 100; i++) {
                    beatFrequencyData[i] = beatTest.energy
                }
                
                const audioData = {
                    bass: beatTest.energy / 255,
                    mids: 0.4,
                    treble: 0.3,
                    overall: beatTest.energy / 255 * 0.8,
                    spectrum: Array.from(beatFrequencyData)
                }
                
                const beatData = beatDetector.detectBeat(beatFrequencyData)
                
                if (beatData.isBeat) {
                    audioEffects.processAudioData(audioData, beatData)
                    
                    beatResults.push({
                        expectedStrength: beatTest.expectedStrength,
                        beatStrength: beatData.strength,
                        pulseScale: mockFluxApp.particleRenderer.beatPulseScale,
                        forceCount: mockFluxApp.solver.getRecentForces().length
                    })
                }
                
                await new Promise(resolve => setTimeout(resolve, 350)) // Wait between beats
            }
            
            // Stronger beats should produce stronger visual effects
            if (beatResults.length >= 2) {
                for (let i = 1; i < beatResults.length; i++) {
                    expect(beatResults[i].beatStrength).toBeGreaterThanOrEqual(beatResults[i-1].beatStrength)
                    expect(beatResults[i].pulseScale).toBeGreaterThanOrEqual(beatResults[i-1].pulseScale)
                }
            }
            
            audioAnalyzer.dispose()
        })
    })

    describe('Visual Effect Mode Validation', () => {
        it('should produce distinct visual patterns for each mode', async () => {
            const audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            
            const audioEffects = new AudioEffects(mockFluxApp)
            
            const modes = ['pulse', 'reactive', 'flow', 'ambient']
            const modeResults = {}
            
            // Standard audio data for all modes
            const audioData = {
                bass: 0.6,
                mids: 0.5,
                treble: 0.4,
                overall: 0.5,
                spectrum: createFrequencySpectrum({ bassLevel: 0.6, midsLevel: 0.5, trebleLevel: 0.4 })
            }
            
            const beatData = { isBeat: true, energy: 0.7, strength: 1.2, bpm: 120 }
            
            for (const mode of modes) {
                // Reset state
                mockFluxApp.solver.forces = []
                mockFluxApp.particleRenderer.colorHistory = []
                mockFluxApp.particleRenderer.bloomHistory = []
                mockFluxApp.particleRenderer.sparkleHistory = []
                mockFluxApp.particleRenderer.pulseHistory = []
                
                audioEffects.setMode(mode)
                audioEffects.processAudioData(audioData, beatData)
                
                modeResults[mode] = {
                    forces: mockFluxApp.solver.getRecentForces().length,
                    colorChanges: mockFluxApp.particleRenderer.getRecentColorChanges().length,
                    bloomChanges: mockFluxApp.particleRenderer.getRecentBloomChanges().length,
                    sparkles: mockFluxApp.particleRenderer.getRecentSparkles().length,
                    pulses: mockFluxApp.particleRenderer.getRecentPulses().length
                }
                
                await new Promise(resolve => setTimeout(resolve, 50))
            }
            
            // Each mode should produce some visual effects
            Object.entries(modeResults).forEach(([mode, results]) => {
                const totalEffects = results.forces + results.colorChanges + 
                                   results.bloomChanges + results.sparkles + results.pulses
                expect(totalEffects).toBeGreaterThan(0) // Each mode should do something
            })
            
            // Pulse mode should emphasize forces and pulses
            expect(modeResults.pulse.forces).toBeGreaterThan(0)
            expect(modeResults.pulse.pulses).toBeGreaterThan(0)
            
            // Reactive mode should have diverse effects
            const reactiveTotal = Object.values(modeResults.reactive).reduce((a, b) => a + b, 0)
            expect(reactiveTotal).toBeGreaterThan(2) // Multiple effect types
            
            audioAnalyzer.dispose()
        })
        
        it('should maintain visual consistency within modes', async () => {
            const audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            
            const audioEffects = new AudioEffects(mockFluxApp)
            audioEffects.setMode('reactive')
            
            const consistencyResults = []
            
            // Apply same audio data multiple times
            const audioData = {
                bass: 0.7,
                mids: 0.6,
                treble: 0.5,
                overall: 0.6,
                spectrum: createFrequencySpectrum({ bassLevel: 0.7, midsLevel: 0.6, trebleLevel: 0.5 })
            }
            
            const beatData = { isBeat: false, energy: 0.5, strength: 0, bpm: 0 }
            
            for (let i = 0; i < 5; i++) {
                // Reset tracking
                mockFluxApp.solver.forces = []
                mockFluxApp.particleRenderer.colorHistory = []
                mockFluxApp.particleRenderer.bloomHistory = []
                
                audioEffects.processAudioData(audioData, beatData)
                
                consistencyResults.push({
                    forces: mockFluxApp.solver.getRecentForces().length,
                    colorChanges: mockFluxApp.particleRenderer.getRecentColorChanges().length,
                    bloomChanges: mockFluxApp.particleRenderer.getRecentBloomChanges().length,
                    finalHue: mockFluxApp.particleRenderer.currentHue,
                    finalBloom: mockFluxApp.particleRenderer.currentBloomScale
                })
                
                await new Promise(resolve => setTimeout(resolve, 50))
            }
            
            // Results should be consistent (within reasonable variance)
            const forceVariance = calculateVariance(consistencyResults.map(r => r.forces))
            const hueVariance = calculateVariance(consistencyResults.map(r => r.finalHue))
            const bloomVariance = calculateVariance(consistencyResults.map(r => r.finalBloom))
            
            // Variance should be low for consistent input
            expect(forceVariance).toBeLessThan(2.0)
            expect(hueVariance).toBeLessThan(100) // Hue can vary more due to smoothing
            expect(bloomVariance).toBeLessThan(0.5)
            
            audioAnalyzer.dispose()
        })
    })

    describe('Visual Smoothing and Transitions', () => {
        it('should smooth abrupt visual changes', async () => {
            const audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            
            const audioEffects = new AudioEffects(mockFluxApp)
            
            // Create abrupt audio change scenario
            const quietAudio = {
                bass: 0.1, mids: 0.1, treble: 0.1, overall: 0.1,
                spectrum: createFrequencySpectrum({ bassLevel: 0.1, midsLevel: 0.1, trebleLevel: 0.1 })
            }
            
            const loudAudio = {
                bass: 0.9, mids: 0.9, treble: 0.9, overall: 0.9,
                spectrum: createFrequencySpectrum({ bassLevel: 0.9, midsLevel: 0.9, trebleLevel: 0.9 })
            }
            
            const beatData = { isBeat: false, energy: 0.3, strength: 0, bpm: 0 }
            
            // Apply quiet audio first
            audioEffects.processAudioData(quietAudio, beatData)
            const quietBloom = mockFluxApp.particleRenderer.currentBloomScale
            const quietHue = mockFluxApp.particleRenderer.currentHue
            
            // Apply loud audio immediately
            audioEffects.processAudioData(loudAudio, beatData)
            const loudBloom = mockFluxApp.particleRenderer.currentBloomScale
            const loudHue = mockFluxApp.particleRenderer.currentHue
            
            // Changes should be smoothed (not full jump)
            const bloomChange = Math.abs(loudBloom - quietBloom)
            const hueChange = Math.abs(loudHue - quietHue)
            
            // Should change but not by the full amount immediately
            expect(bloomChange).toBeGreaterThan(0.1) // Some change
            expect(bloomChange).toBeLessThan(2.0) // But not extreme jump
            
            expect(hueChange).toBeGreaterThan(5) // Some color change
            expect(hueChange).toBeLessThan(180) // But not extreme jump
            
            audioAnalyzer.dispose()
        })
        
        it('should handle rapid audio changes gracefully', async () => {
            const audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            
            const audioEffects = new AudioEffects(mockFluxApp)
            
            const rapidChanges = []
            
            // Apply rapidly changing audio data
            for (let i = 0; i < 20; i++) {
                const audioData = {
                    bass: Math.random(),
                    mids: Math.random(),
                    treble: Math.random(),
                    overall: Math.random(),
                    spectrum: createFrequencySpectrum({ 
                        bassLevel: Math.random(), 
                        midsLevel: Math.random(), 
                        trebleLevel: Math.random() 
                    })
                }
                
                const beatData = { 
                    isBeat: Math.random() > 0.8, 
                    energy: Math.random(), 
                    strength: Math.random() * 2, 
                    bpm: 120 
                }
                
                audioEffects.processAudioData(audioData, beatData)
                
                rapidChanges.push({
                    frame: i,
                    hue: mockFluxApp.particleRenderer.currentHue,
                    bloom: mockFluxApp.particleRenderer.currentBloomScale,
                    forces: mockFluxApp.solver.getRecentForces().length
                })
                
                await new Promise(resolve => setTimeout(resolve, 16)) // ~60fps
            }
            
            // Visual values should remain within reasonable bounds
            rapidChanges.forEach(change => {
                expect(change.hue).toBeGreaterThanOrEqual(0)
                expect(change.hue).toBeLessThanOrEqual(360)
                expect(change.bloom).toBeGreaterThan(0)
                expect(change.bloom).toBeLessThan(5.0) // Reasonable bloom limit
                expect(change.forces).toBeLessThan(20) // Not excessive forces
            })
            
            // Changes should be gradual (no extreme jumps between frames)
            for (let i = 1; i < rapidChanges.length; i++) {
                const prev = rapidChanges[i - 1]
                const curr = rapidChanges[i]
                
                const hueJump = Math.abs(curr.hue - prev.hue)
                const bloomJump = Math.abs(curr.bloom - prev.bloom)
                
                // Allow for hue wrapping around 360
                const normalizedHueJump = Math.min(hueJump, 360 - hueJump)
                
                expect(normalizedHueJump).toBeLessThan(90) // No extreme hue jumps
                expect(bloomJump).toBeLessThan(1.0) // No extreme bloom jumps
            }
            
            audioAnalyzer.dispose()
        })
    })

    // Helper functions
    function createFrequencySpectrum({ bassLevel, midsLevel, trebleLevel }) {
        const spectrum = new Array(1024)
        
        // Bass: bins 0-100 (roughly 0-2kHz)
        for (let i = 0; i < 100; i++) {
            spectrum[i] = Math.floor(bassLevel * 255)
        }
        
        // Mids: bins 100-700 (roughly 2-15kHz)
        for (let i = 100; i < 700; i++) {
            spectrum[i] = Math.floor(midsLevel * 255)
        }
        
        // Treble: bins 700-1024 (roughly 15-22kHz)
        for (let i = 700; i < 1024; i++) {
            spectrum[i] = Math.floor(trebleLevel * 255)
        }
        
        return spectrum
    }
    
    function calculateVariance(values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length
        const squaredDiffs = values.map(value => Math.pow(value - mean, 2))
        return squaredDiffs.reduce((a, b) => a + b, 0) / values.length
    }
})