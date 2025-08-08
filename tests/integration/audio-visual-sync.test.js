/**
 * Integration tests for audio-visual synchronization
 * Tests the timing and accuracy of audio-reactive visual effects
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'

describe('Audio-Visual Synchronization Tests', () => {
    let AudioAnalyzer, BeatDetector, AudioEffects
    let mockFluxApp, mockAudioContext, mockAnalyserNode
    
    beforeAll(async () => {
        // Import audio components
        const analyzerModule = await import('../../src/audio/audio-analyzer.js')
        const beatModule = await import('../../src/audio/beat-detector.js')
        const effectsModule = await import('../../src/audio/audio-effects.js')
        
        AudioAnalyzer = analyzerModule.AudioAnalyzer
        BeatDetector = beatModule.default
        AudioEffects = effectsModule.AudioEffects
        
        console.log('✅ Audio-visual sync test environment initialized')
    })
    
    beforeEach(() => {
        // Mock Web Audio API
        mockAudioContext = {
            state: 'running',
            sampleRate: 44100,
            resume: vi.fn().mockResolvedValue(undefined),
            close: vi.fn().mockResolvedValue(undefined),
            createAnalyser: vi.fn(),
            createMediaStreamSource: vi.fn()
        }
        
        mockAnalyserNode = {
            fftSize: 2048,
            frequencyBinCount: 1024,
            smoothingTimeConstant: 0.8,
            minDecibels: -90,
            maxDecibels: -10,
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
        
        // Mock FluxApp with particle renderer
        mockFluxApp = {
            solver: {
                apply_force: vi.fn(),
                get_positions: vi.fn().mockReturnValue(new Float32Array(200)), // 100 particles * 2 coords
                get_active_particle_count: vi.fn().mockReturnValue(100)
            },
            config: {
                containerWidth: 800,
                containerHeight: 600,
                particleCount: 100
            },
            particleRenderer: {
                audioReactiveEnabled: false,
                currentHue: 180,
                baseBloomScale: 1.0,
                sparkleParticles: [],
                beatPulseScale: 1.0,
                trebleSizeMultipliers: new Array(100).fill(1.0),
                
                enableAudioReactive() { this.audioReactiveEnabled = true },
                disableAudioReactive() { this.audioReactiveEnabled = false },
                updateAudioColors: vi.fn(),
                updateBloomIntensity: vi.fn(),
                updateTrebleSizes: vi.fn(),
                createSparkleEffects: vi.fn(),
                applyBeatPulse: vi.fn()
            }
        }
        
        // Setup global mocks
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
    })

    describe('Beat Detection to Visual Response Timing', () => {
        let audioAnalyzer, beatDetector, audioEffects
        
        beforeEach(async () => {
            audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            
            beatDetector = new BeatDetector(audioAnalyzer)
            audioEffects = new AudioEffects(mockFluxApp)
        })
        
        afterEach(() => {
            if (audioAnalyzer) {
                audioAnalyzer.dispose()
            }
        })
        
        it('should respond to beats within acceptable latency', async () => {
            const beatTimestamps = []
            const visualResponseTimestamps = []
            
            // Mock beat detection with timing
            const originalApplyForce = mockFluxApp.solver.apply_force
            mockFluxApp.solver.apply_force = vi.fn((...args) => {
                visualResponseTimestamps.push(performance.now())
                return originalApplyForce.call(mockFluxApp.solver, ...args)
            })
            
            // Simulate audio data with clear beats
            const simulateAudioFrame = (isBeat, timestamp) => {
                global.performance.now = vi.fn(() => timestamp)
                
                const frequencyData = new Uint8Array(1024)
                if (isBeat) {
                    // Strong bass for beat detection
                    for (let i = 0; i < 100; i++) {
                        frequencyData[i] = 200 + Math.random() * 55
                    }
                    beatTimestamps.push(timestamp)
                } else {
                    // Background audio
                    for (let i = 0; i < 100; i++) {
                        frequencyData[i] = 40 + Math.random() * 20
                    }
                }
                
                // Build energy history first
                for (let i = 0; i < 20; i++) {
                    const baseData = new Uint8Array(1024).fill(50 + Math.random() * 10)
                    beatDetector.detectBeat(baseData)
                }
                
                const audioData = {
                    bass: isBeat ? 0.8 : 0.2,
                    mids: 0.4,
                    treble: 0.3,
                    overall: isBeat ? 0.7 : 0.3,
                    spectrum: Array.from(frequencyData)
                }
                
                const beatData = beatDetector.detectBeat(frequencyData)
                audioEffects.processAudioData(audioData, beatData)
                
                return { audioData, beatData }
            }
            
            // Simulate sequence with beats
            let currentTime = 1000
            const beatInterval = 500 // 120 BPM
            
            for (let i = 0; i < 10; i++) {
                const isBeat = i % 2 === 0 && i > 0 // Every other frame after first
                await new Promise(resolve => setTimeout(resolve, 50)) // Small delay between frames
                
                simulateAudioFrame(isBeat, currentTime)
                currentTime += beatInterval / 2
            }
            
            // Check that visual responses occurred close to beat detections
            expect(visualResponseTimestamps.length).toBeGreaterThan(0)
            
            // Calculate average latency (if we have both beats and responses)
            if (beatTimestamps.length > 0 && visualResponseTimestamps.length > 0) {
                const latencies = []
                for (let i = 0; i < Math.min(beatTimestamps.length, visualResponseTimestamps.length); i++) {
                    const latency = visualResponseTimestamps[i] - beatTimestamps[i]
                    if (latency >= 0 && latency < 100) { // Reasonable latency range
                        latencies.push(latency)
                    }
                }
                
                if (latencies.length > 0) {
                    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length
                    expect(avgLatency).toBeLessThan(50) // Should respond within 50ms
                }
            }
        })
        
        it('should maintain consistent timing across different BPMs', async () => {
            const testBPMs = [60, 120, 140, 180] // Different tempos
            const timingResults = {}
            
            for (const bpm of testBPMs) {
                const beatInterval = 60000 / bpm // ms per beat
                const responseTimings = []
                
                // Reset detector for each BPM test
                beatDetector.reset()
                
                // Mock visual response timing
                const originalApplyBeatPulse = mockFluxApp.particleRenderer.applyBeatPulse
                mockFluxApp.particleRenderer.applyBeatPulse = vi.fn((strength) => {
                    responseTimings.push({
                        timestamp: performance.now(),
                        strength
                    })
                    return originalApplyBeatPulse.call(mockFluxApp.particleRenderer, strength)
                })
                
                let currentTime = 1000
                
                // Simulate 8 beats at this BPM
                for (let beat = 0; beat < 8; beat++) {
                    global.performance.now = vi.fn(() => currentTime)
                    
                    // Build baseline energy
                    if (beat === 0) {
                        for (let i = 0; i < 20; i++) {
                            const baseData = new Uint8Array(1024).fill(50 + Math.random() * 10)
                            beatDetector.detectBeat(baseData)
                        }
                    }
                    
                    // Create beat data
                    const frequencyData = new Uint8Array(1024)
                    for (let i = 0; i < 100; i++) {
                        frequencyData[i] = 180 + Math.random() * 75
                    }
                    
                    const audioData = {
                        bass: 0.8,
                        mids: 0.5,
                        treble: 0.4,
                        overall: 0.7,
                        spectrum: Array.from(frequencyData)
                    }
                    
                    const beatData = beatDetector.detectBeat(frequencyData)
                    audioEffects.processAudioData(audioData, beatData)
                    
                    currentTime += beatInterval
                    
                    // Small delay to allow processing
                    await new Promise(resolve => setTimeout(resolve, 10))
                }
                
                timingResults[bpm] = {
                    expectedInterval: beatInterval,
                    responseCount: responseTimings.length,
                    timings: responseTimings
                }
            }
            
            // Verify that each BPM produced reasonable response timing
            for (const [bpm, results] of Object.entries(timingResults)) {
                expect(results.responseCount).toBeGreaterThan(0)
                
                // If we got multiple responses, check interval consistency
                if (results.timings.length > 1) {
                    const intervals = []
                    for (let i = 1; i < results.timings.length; i++) {
                        intervals.push(results.timings[i].timestamp - results.timings[i-1].timestamp)
                    }
                    
                    if (intervals.length > 0) {
                        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
                        const expectedInterval = results.expectedInterval
                        
                        // Allow 20% tolerance for timing variations
                        const tolerance = expectedInterval * 0.2
                        expect(Math.abs(avgInterval - expectedInterval)).toBeLessThan(tolerance)
                    }
                }
            }
        })
    })

    describe('Frequency Response Accuracy', () => {
        let audioAnalyzer, audioEffects
        
        beforeEach(async () => {
            audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            audioEffects = new AudioEffects(mockFluxApp)
        })
        
        afterEach(() => {
            if (audioAnalyzer) {
                audioAnalyzer.dispose()
            }
        })
        
        it('should accurately map frequency ranges to visual effects', () => {
            const testCases = [
                {
                    name: 'Bass dominant',
                    frequencyData: createFrequencyData({ bass: 0.9, mids: 0.2, treble: 0.1 }),
                    expectedEffects: ['force_application', 'bloom_increase']
                },
                {
                    name: 'Mids dominant', 
                    frequencyData: createFrequencyData({ bass: 0.1, mids: 0.9, treble: 0.2 }),
                    expectedEffects: ['color_shift', 'bloom_moderate']
                },
                {
                    name: 'Treble dominant',
                    frequencyData: createFrequencyData({ bass: 0.1, mids: 0.2, treble: 0.9 }),
                    expectedEffects: ['sparkle_creation', 'size_variation']
                },
                {
                    name: 'Full spectrum',
                    frequencyData: createFrequencyData({ bass: 0.7, mids: 0.8, treble: 0.6 }),
                    expectedEffects: ['force_application', 'color_shift', 'sparkle_creation', 'bloom_increase']
                }
            ]
            
            testCases.forEach(testCase => {
                // Reset mocks
                vi.clearAllMocks()
                
                // Mock frequency data
                mockAnalyserNode.getByteFrequencyData.mockImplementation((array) => {
                    array.set(testCase.frequencyData)
                })
                
                const audioData = audioAnalyzer.getFrequencyData()
                const beatData = { isBeat: false, energy: 0.3, strength: 0, bpm: 0 }
                
                audioEffects.processAudioData(audioData, beatData)
                
                // Verify expected effects occurred
                if (testCase.expectedEffects.includes('force_application')) {
                    expect(mockFluxApp.solver.apply_force).toHaveBeenCalled()
                }
                
                if (testCase.expectedEffects.includes('color_shift')) {
                    expect(mockFluxApp.particleRenderer.updateAudioColors).toHaveBeenCalled()
                }
                
                if (testCase.expectedEffects.includes('sparkle_creation')) {
                    expect(mockFluxApp.particleRenderer.createSparkleEffects).toHaveBeenCalled()
                }
                
                if (testCase.expectedEffects.includes('bloom_increase')) {
                    expect(mockFluxApp.particleRenderer.updateBloomIntensity).toHaveBeenCalled()
                }
            })
        })
        
        it('should maintain frequency response consistency over time', () => {
            const consistencyTest = {
                bass: [],
                mids: [],
                treble: []
            }
            
            // Generate consistent frequency data over multiple frames
            for (let frame = 0; frame < 30; frame++) {
                const bassLevel = 0.7 + Math.sin(frame * 0.1) * 0.2 // Oscillating bass
                const midsLevel = 0.5 // Steady mids
                const trebleLevel = 0.3 + Math.random() * 0.2 // Variable treble
                
                const frequencyData = createFrequencyData({
                    bass: bassLevel,
                    mids: midsLevel,
                    treble: trebleLevel
                })
                
                mockAnalyserNode.getByteFrequencyData.mockImplementation((array) => {
                    array.set(frequencyData)
                })
                
                const audioData = audioAnalyzer.getFrequencyData()
                
                consistencyTest.bass.push(audioData.bass)
                consistencyTest.mids.push(audioData.mids)
                consistencyTest.treble.push(audioData.treble)
            }
            
            // Check that frequency analysis is consistent
            const bassVariance = calculateVariance(consistencyTest.bass)
            const midsVariance = calculateVariance(consistencyTest.mids)
            const trebleVariance = calculateVariance(consistencyTest.treble)
            
            // Bass should have higher variance (oscillating)
            expect(bassVariance).toBeGreaterThan(midsVariance)
            
            // All values should be in valid range
            consistencyTest.bass.forEach(value => {
                expect(value).toBeGreaterThanOrEqual(0)
                expect(value).toBeLessThanOrEqual(1)
            })
            
            consistencyTest.mids.forEach(value => {
                expect(value).toBeGreaterThanOrEqual(0)
                expect(value).toBeLessThanOrEqual(1)
            })
            
            consistencyTest.treble.forEach(value => {
                expect(value).toBeGreaterThanOrEqual(0)
                expect(value).toBeLessThanOrEqual(1)
            })
        })
    })

    describe('Visual Effect Smoothing and Transitions', () => {
        let audioEffects
        
        beforeEach(() => {
            audioEffects = new AudioEffects(mockFluxApp)
        })
        
        it('should smooth abrupt audio changes', () => {
            const bloomIntensityHistory = []
            
            // Mock bloom intensity tracking
            const originalUpdateBloom = mockFluxApp.particleRenderer.updateBloomIntensity
            mockFluxApp.particleRenderer.updateBloomIntensity = vi.fn((intensity) => {
                bloomIntensityHistory.push(intensity)
                return originalUpdateBloom.call(mockFluxApp.particleRenderer, intensity)
            })
            
            // Simulate abrupt audio change
            const audioFrames = [
                { bass: 0.1, mids: 0.1, treble: 0.1, overall: 0.1 }, // Quiet
                { bass: 0.1, mids: 0.1, treble: 0.1, overall: 0.1 }, // Quiet
                { bass: 0.9, mids: 0.9, treble: 0.9, overall: 0.9 }, // Sudden loud
                { bass: 0.9, mids: 0.9, treble: 0.9, overall: 0.9 }, // Stay loud
                { bass: 0.1, mids: 0.1, treble: 0.1, overall: 0.1 }, // Sudden quiet
            ]
            
            const beatData = { isBeat: false, energy: 0.3, strength: 0, bpm: 0 }
            
            audioFrames.forEach(audioData => {
                audioEffects.processAudioData(audioData, beatData)
            })
            
            // Check that bloom changes were smoothed
            if (bloomIntensityHistory.length >= 3) {
                // The change from frame 2 to 3 should be smaller than the raw audio change
                const audioChange = 0.9 - 0.1 // 0.8 raw change
                const bloomChange = Math.abs(bloomIntensityHistory[2] - bloomIntensityHistory[1])
                
                expect(bloomChange).toBeLessThan(audioChange) // Should be smoothed
            }
        })
        
        it('should handle mode transitions smoothly', () => {
            const forceApplications = []
            
            // Track force applications
            const originalApplyForce = mockFluxApp.solver.apply_force
            mockFluxApp.solver.apply_force = vi.fn((...args) => {
                forceApplications.push({
                    timestamp: performance.now(),
                    args: args
                })
                return originalApplyForce.call(mockFluxApp.solver, ...args)
            })
            
            const audioData = { bass: 0.6, mids: 0.5, treble: 0.4, overall: 0.5 }
            const beatData = { isBeat: true, energy: 0.7, strength: 1.2, bpm: 120 }
            
            // Test mode transitions
            const modes = ['pulse', 'reactive', 'flow', 'ambient']
            
            modes.forEach(mode => {
                audioEffects.setMode(mode)
                audioEffects.processAudioData(audioData, beatData)
                
                // Small delay between mode changes
                global.performance.now = vi.fn(() => performance.now() + 100)
            })
            
            // Should have applied forces in different patterns for different modes
            expect(forceApplications.length).toBeGreaterThan(0)
            
            // Verify no abrupt changes that could cause visual jarring
            for (let i = 1; i < forceApplications.length; i++) {
                const prevForce = forceApplications[i-1]
                const currentForce = forceApplications[i]
                
                // Force strength shouldn't change too dramatically between frames
                if (prevForce.args[3] && currentForce.args[3]) { // Force strength parameter
                    const strengthChange = Math.abs(currentForce.args[3] - prevForce.args[3])
                    expect(strengthChange).toBeLessThan(5.0) // Reasonable change limit
                }
            }
        })
    })

    describe('Performance Under Load', () => {
        let audioAnalyzer, beatDetector, audioEffects
        
        beforeEach(async () => {
            audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            beatDetector = new BeatDetector(audioAnalyzer)
            audioEffects = new AudioEffects(mockFluxApp)
        })
        
        afterEach(() => {
            if (audioAnalyzer) {
                audioAnalyzer.dispose()
            }
        })
        
        it('should maintain performance with high-frequency updates', () => {
            const performanceTimes = []
            
            // Simulate 60fps audio processing for 1 second
            for (let frame = 0; frame < 60; frame++) {
                const startTime = performance.now()
                
                // Create realistic frequency data
                const frequencyData = new Uint8Array(1024)
                for (let i = 0; i < 1024; i++) {
                    frequencyData[i] = Math.floor(Math.random() * 255)
                }
                
                mockAnalyserNode.getByteFrequencyData.mockImplementation((array) => {
                    array.set(frequencyData)
                })
                
                const audioData = audioAnalyzer.getFrequencyData()
                const beatData = beatDetector.detectBeat(frequencyData)
                audioEffects.processAudioData(audioData, beatData)
                
                const endTime = performance.now()
                performanceTimes.push(endTime - startTime)
            }
            
            // Calculate performance statistics
            const avgTime = performanceTimes.reduce((a, b) => a + b, 0) / performanceTimes.length
            const maxTime = Math.max(...performanceTimes)
            
            // Should maintain target performance (under 2ms per frame for 60fps)
            expect(avgTime).toBeLessThan(2.0)
            expect(maxTime).toBeLessThan(5.0) // Allow some spikes
            
            // No frame should take excessively long
            const slowFrames = performanceTimes.filter(time => time > 10)
            expect(slowFrames.length).toBe(0)
        })
        
        it('should handle memory efficiently over extended periods', () => {
            const initialMemory = process.memoryUsage?.()?.heapUsed || 0
            
            // Simulate extended audio processing (simulate 5 minutes at 43fps)
            const totalFrames = 5 * 60 * 43 // 5 minutes * 60 seconds * 43fps
            const sampleFrames = 100 // Test subset for performance
            
            for (let frame = 0; frame < sampleFrames; frame++) {
                const frequencyData = new Uint8Array(1024)
                for (let i = 0; i < 1024; i++) {
                    frequencyData[i] = Math.floor(Math.random() * 255)
                }
                
                mockAnalyserNode.getByteFrequencyData.mockImplementation((array) => {
                    array.set(frequencyData)
                })
                
                const audioData = audioAnalyzer.getFrequencyData()
                const beatData = beatDetector.detectBeat(frequencyData)
                audioEffects.processAudioData(audioData, beatData)
                
                // Occasionally force garbage collection if available
                if (frame % 20 === 0 && global.gc) {
                    global.gc()
                }
            }
            
            const finalMemory = process.memoryUsage?.()?.heapUsed || 0
            const memoryIncrease = finalMemory - initialMemory
            
            // Memory increase should be reasonable (less than 50MB for this test)
            if (initialMemory > 0) {
                expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // 50MB
            }
        })
    })

    // Helper functions
    function createFrequencyData({ bass, mids, treble }) {
        const data = new Uint8Array(1024)
        
        // Bass range: 0-100 bins (roughly 0-2kHz)
        for (let i = 0; i < 100; i++) {
            data[i] = Math.floor(bass * 255)
        }
        
        // Mids range: 100-700 bins (roughly 2-15kHz)
        for (let i = 100; i < 700; i++) {
            data[i] = Math.floor(mids * 255)
        }
        
        // Treble range: 700-1024 bins (roughly 15-22kHz)
        for (let i = 700; i < 1024; i++) {
            data[i] = Math.floor(treble * 255)
        }
        
        return data
    }
    
    function calculateVariance(values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length
        const squaredDiffs = values.map(value => Math.pow(value - mean, 2))
        return squaredDiffs.reduce((a, b) => a + b, 0) / values.length
    }
})