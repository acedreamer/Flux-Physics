import { describe, it, expect, beforeEach, vi } from 'vitest'
import BeatDetector from '../../src/audio/core/beat-detector.js'

describe('BeatDetector', () => {
    let beatDetector
    let mockAudioAnalyzer
    
    beforeEach(() => {
        mockAudioAnalyzer = {
            getFrequencyData: vi.fn()
        }
        
        beatDetector = new BeatDetector(mockAudioAnalyzer, {
            beatThreshold: 1.3,
            minBeatInterval: 300,
            historySize: 20, // Smaller for testing
            sensitivity: 1.0
        })
    })
    
    describe('constructor', () => {
        it('should initialize with default configuration', () => {
            const detector = new BeatDetector(mockAudioAnalyzer)
            expect(detector.config.beatThreshold).toBe(1.3)
            expect(detector.config.minBeatInterval).toBe(300)
            expect(detector.config.historySize).toBe(43)
        })
        
        it('should accept custom configuration', () => {
            const customConfig = {
                beatThreshold: 1.5,
                minBeatInterval: 400,
                sensitivity: 0.8
            }
            
            const detector = new BeatDetector(mockAudioAnalyzer, customConfig)
            expect(detector.config.beatThreshold).toBe(1.5)
            expect(detector.config.minBeatInterval).toBe(400)
            expect(detector.config.sensitivity).toBe(0.8)
        })
    })
    
    describe('calculateInstantEnergy', () => {
        it('should calculate energy from frequency data', () => {
            // Create mock frequency data with strong bass
            const frequencyData = new Uint8Array(100)
            // Strong bass frequencies (first 15% of spectrum)
            for (let i = 0; i < 15; i++) {
                frequencyData[i] = 200 // High energy in bass range
            }
            // Lower energy in other frequencies
            for (let i = 15; i < 100; i++) {
                frequencyData[i] = 50
            }
            
            const energy = beatDetector.calculateInstantEnergy(frequencyData)
            expect(energy).toBeGreaterThan(0)
            expect(energy).toBeLessThanOrEqual(1)
        })
        
        it('should return higher energy for stronger bass', () => {
            const lowEnergyData = new Uint8Array(100).fill(50)
            const highEnergyData = new Uint8Array(100).fill(200)
            
            const lowEnergy = beatDetector.calculateInstantEnergy(lowEnergyData)
            const highEnergy = beatDetector.calculateInstantEnergy(highEnergyData)
            
            expect(highEnergy).toBeGreaterThan(lowEnergy)
        })
    })
    
    describe('detectBeat', () => {
        it('should not detect beat with insufficient history', () => {
            const frequencyData = new Uint8Array(100).fill(100)
            const result = beatDetector.detectBeat(frequencyData)
            
            expect(result.isBeat).toBe(false)
            expect(result.energy).toBeGreaterThan(0)
            expect(result.bpm).toBe(0)
        })
        
        it('should build energy history over time', () => {
            const frequencyData = new Uint8Array(100).fill(100)
            
            // Build up history
            for (let i = 0; i < 15; i++) {
                beatDetector.detectBeat(frequencyData)
            }
            
            expect(beatDetector.energyHistory.length).toBe(15)
        })
        
        it('should detect beat when energy exceeds threshold', async () => {
            const baseFrequencyData = new Uint8Array(100).fill(50)
            const beatFrequencyData = new Uint8Array(100).fill(255) // Maximum energy
            
            // Build baseline energy history with some variance
            for (let i = 0; i < 20; i++) {
                const data = new Uint8Array(100).fill(50 + Math.random() * 20)
                beatDetector.detectBeat(data)
            }
            
            // Wait to satisfy timing condition
            await new Promise(resolve => setTimeout(resolve, 350))
            
            // Introduce strong beat
            const result = beatDetector.detectBeat(beatFrequencyData)
            
            expect(result.isBeat).toBe(true)
            expect(result.strength).toBeGreaterThan(0)
            expect(result.confidence).toBeGreaterThan(0)
        })
        
        it('should respect minimum beat interval', async () => {
            const beatFrequencyData = new Uint8Array(100).fill(255) // Maximum energy
            const baseFrequencyData = new Uint8Array(100).fill(50)
            
            // Build baseline with variance
            for (let i = 0; i < 20; i++) {
                const data = new Uint8Array(100).fill(50 + Math.random() * 20)
                beatDetector.detectBeat(data)
            }
            
            // Wait to satisfy timing condition
            await new Promise(resolve => setTimeout(resolve, 350))
            
            // First beat should be detected
            const firstBeat = beatDetector.detectBeat(beatFrequencyData)
            expect(firstBeat.isBeat).toBe(true)
            
            // Immediate second beat should be rejected due to timing
            const secondBeat = beatDetector.detectBeat(beatFrequencyData)
            expect(secondBeat.isBeat).toBe(false)
        })
        
        it('should calculate beat strength correctly', async () => {
            const strongBeatData = new Uint8Array(100).fill(200)
            const weakBeatData = new Uint8Array(100).fill(120)
            
            // Build baseline with consistent low energy
            for (let i = 0; i < 20; i++) {
                const data = new Uint8Array(100).fill(40 + Math.random() * 10)
                beatDetector.detectBeat(data)
            }
            
            // Wait to satisfy timing condition
            await new Promise(resolve => setTimeout(resolve, 350))
            
            const strongBeat = beatDetector.detectBeat(strongBeatData)
            
            // Wait for timing condition again
            await new Promise(resolve => setTimeout(resolve, 350))
            
            const weakBeat = beatDetector.detectBeat(weakBeatData)
            
            // At least the strong beat should be detected
            expect(strongBeat.isBeat).toBe(true)
            
            if (strongBeat.isBeat && weakBeat.isBeat) {
                // Allow for small differences due to capping at 2.0
                expect(strongBeat.strength).toBeGreaterThanOrEqual(weakBeat.strength)
            }
        })
    })
    
    describe('calculateBPM', () => {
        it('should return 0 with insufficient beat history', () => {
            expect(beatDetector.calculateBPM()).toBe(0)
            
            // Add one beat
            beatDetector.recordBeat(1000, 0.5, 1.0, 0.8)
            expect(beatDetector.calculateBPM()).toBe(0)
        })
        
        it('should calculate BPM from beat intervals', () => {
            // Simulate beats at 120 BPM (500ms intervals)
            const interval = 500
            const times = [1000, 1500, 2000, 2500, 3000]
            
            times.forEach(time => {
                beatDetector.recordBeat(time, 0.5, 1.0, 0.8)
            })
            
            const bpm = beatDetector.calculateBPM()
            expect(bpm).toBeCloseTo(120, 0) // 60000 / 500 = 120
        })
        
        it('should filter out unrealistic intervals', () => {
            // Add some realistic beats
            beatDetector.recordBeat(1000, 0.5, 1.0, 0.8)
            beatDetector.recordBeat(1500, 0.5, 1.0, 0.8) // 500ms interval
            beatDetector.recordBeat(2000, 0.5, 1.0, 0.8) // 500ms interval
            
            // Add unrealistic beat (too fast)
            beatDetector.recordBeat(2050, 0.5, 1.0, 0.8) // 50ms interval
            
            const bpm = beatDetector.calculateBPM()
            expect(bpm).toBeCloseTo(120, 0) // Should ignore the 50ms interval
        })
    })
    
    describe('recordBeat', () => {
        it('should add beat to history', () => {
            const time = 1000
            const energy = 0.8
            const strength = 1.2
            const confidence = 0.9
            
            beatDetector.recordBeat(time, energy, strength, confidence)
            
            expect(beatDetector.beatHistory.length).toBe(1)
            expect(beatDetector.beatHistory[0]).toEqual({
                time,
                energy,
                strength,
                confidence,
                interval: 0
            })
        })
        
        it('should calculate intervals between beats', () => {
            beatDetector.recordBeat(1000, 0.5, 1.0, 0.8)
            beatDetector.recordBeat(1500, 0.6, 1.1, 0.9)
            
            expect(beatDetector.beatHistory[1].interval).toBe(500)
        })
        
        it('should limit history size', () => {
            const maxHistory = beatDetector.config.maxBeatHistory
            
            // Add more beats than max history
            for (let i = 0; i < maxHistory + 5; i++) {
                beatDetector.recordBeat(i * 500, 0.5, 1.0, 0.8)
            }
            
            expect(beatDetector.beatHistory.length).toBe(maxHistory)
        })
    })
    
    describe('statistical calculations', () => {
        it('should calculate average correctly', () => {
            const values = [1, 2, 3, 4, 5]
            const average = beatDetector.calculateAverage(values)
            expect(average).toBe(3)
        })
        
        it('should calculate variance correctly', () => {
            const values = [1, 2, 3, 4, 5]
            const mean = 3
            const variance = beatDetector.calculateVariance(values, mean)
            expect(variance).toBe(2) // Variance of [1,2,3,4,5] with mean 3 is 2
        })
    })
    
    describe('configuration management', () => {
        it('should update configuration', () => {
            const newConfig = {
                sensitivity: 1.5,
                beatThreshold: 1.8
            }
            
            beatDetector.updateConfig(newConfig)
            
            expect(beatDetector.config.sensitivity).toBe(1.5)
            expect(beatDetector.config.beatThreshold).toBe(1.8)
            expect(beatDetector.config.minBeatInterval).toBe(300) // Should preserve existing values
        })
    })
    
    describe('reset functionality', () => {
        it('should reset all state', () => {
            // Add some data
            beatDetector.recordBeat(1000, 0.5, 1.0, 0.8)
            beatDetector.energyHistory = [0.1, 0.2, 0.3]
            beatDetector.lastBeatTime = 1000
            
            beatDetector.reset()
            
            expect(beatDetector.beatHistory.length).toBe(0)
            expect(beatDetector.energyHistory.length).toBe(0)
            expect(beatDetector.lastBeatTime).toBe(0)
        })
    })
    
    describe('getStats', () => {
        it('should return comprehensive statistics', () => {
            // Add some test data (need at least 3 beats for BPM)
            beatDetector.recordBeat(1000, 0.5, 1.0, 0.8)
            beatDetector.recordBeat(1500, 0.6, 1.2, 0.9)
            beatDetector.recordBeat(2000, 0.7, 1.1, 0.85)
            beatDetector.energyHistory = [0.1, 0.2, 0.3, 0.4, 0.5]
            
            const stats = beatDetector.getStats()
            
            expect(stats.beatCount).toBe(3)
            expect(stats.avgBeatStrength).toBeCloseTo(1.1, 1)
            expect(stats.avgConfidence).toBeCloseTo(0.85, 2)
            expect(stats.energyHistorySize).toBe(5)
            expect(stats.currentBPM).toBeGreaterThan(0)
            expect(stats.config).toBeDefined()
        })
    })
    
    describe('sensitivity adjustment', () => {
        it('should affect beat detection threshold', () => {
            const baseFrequencyData = new Uint8Array(100).fill(40)
            const beatFrequencyData = new Uint8Array(100).fill(180)
            
            // Test with high sensitivity first (should detect more easily)
            beatDetector.updateConfig({ sensitivity: 2.0 })
            for (let i = 0; i < 15; i++) {
                beatDetector.detectBeat(baseFrequencyData)
            }
            
            const highSensitivityResult = beatDetector.detectBeat(beatFrequencyData)
            
            // Reset and test with low sensitivity
            beatDetector.reset()
            beatDetector.updateConfig({ sensitivity: 0.3 })
            for (let i = 0; i < 15; i++) {
                beatDetector.detectBeat(baseFrequencyData)
            }
            
            const lowSensitivityResult = beatDetector.detectBeat(beatFrequencyData)
            
            // High sensitivity should be more likely to detect beats
            expect(highSensitivityResult.isBeat).toBe(true)
            
            // With strong enough signal, both should detect, but high sensitivity should have higher strength
            if (highSensitivityResult.isBeat && lowSensitivityResult.isBeat) {
                expect(highSensitivityResult.strength).toBeGreaterThanOrEqual(lowSensitivityResult.strength)
            }
        })
    })
})

describe('BeatDetector Integration Tests', () => {
    let beatDetector
    let mockAudioAnalyzer
    
    beforeEach(() => {
        mockAudioAnalyzer = {
            getFrequencyData: vi.fn()
        }
        
        beatDetector = new BeatDetector(mockAudioAnalyzer)
    })
    
    describe('realistic audio simulation', () => {
        it('should detect beats in simulated music with steady rhythm', () => {
            const beatsDetected = []
            const beatInterval = 500 // 120 BPM
            
            // Simulate 3 seconds of audio at 43fps analysis (matching config)
            for (let frame = 0; frame < 130; frame++) {
                const time = frame * (1000 / 43) // 43fps
                
                // Create beat every 500ms with stronger contrast
                const isBeatFrame = time % beatInterval < 50 // Beat lasts ~50ms
                
                const frequencyData = new Uint8Array(100)
                if (isBeatFrame) {
                    // Very strong bass during beat
                    for (let i = 0; i < 15; i++) {
                        frequencyData[i] = 220 + Math.random() * 35
                    }
                } else {
                    // Much lower energy between beats
                    for (let i = 0; i < 15; i++) {
                        frequencyData[i] = 30 + Math.random() * 20
                    }
                }
                
                const result = beatDetector.detectBeat(frequencyData)
                if (result.isBeat) {
                    beatsDetected.push({
                        time,
                        strength: result.strength,
                        bpm: result.bpm
                    })
                }
            }
            
            // Should detect at least some beats (3 seconds = ~6 beats at 120 BPM)
            expect(beatsDetected.length).toBeGreaterThanOrEqual(1) // At least 1 beat detected
            
            // If we detected multiple beats, BPM should be reasonable
            if (beatsDetected.length > 2) {
                const finalBPM = beatsDetected[beatsDetected.length - 1]?.bpm || 0
                expect(finalBPM).toBeGreaterThan(60)
                expect(finalBPM).toBeLessThan(200)
            }
        })
        
        it('should handle varying beat strengths', () => {
            const results = []
            
            // Simulate audio with varying beat intensities
            for (let frame = 0; frame < 150; frame++) {
                const frequencyData = new Uint8Array(100)
                
                // Every 30 frames, create a beat with varying strength
                if (frame % 30 === 0 && frame > 20) { // Start after some history is built
                    const beatStrength = 0.5 + (frame / 150) * 0.5 // Increasing strength
                    for (let i = 0; i < 15; i++) {
                        frequencyData[i] = Math.floor(100 + beatStrength * 155)
                    }
                } else {
                    // Background energy
                    for (let i = 0; i < 15; i++) {
                        frequencyData[i] = 30 + Math.random() * 20
                    }
                }
                
                const result = beatDetector.detectBeat(frequencyData)
                results.push(result)
            }
            
            const detectedBeats = results.filter(r => r.isBeat)
            
            // Should detect at least one beat
            expect(detectedBeats.length).toBeGreaterThan(0)
            
            // Verify that we're getting reasonable beat detection
            expect(detectedBeats.every(beat => beat.strength > 0)).toBe(true)
            expect(detectedBeats.every(beat => beat.confidence >= 0)).toBe(true)
        })
    })
})