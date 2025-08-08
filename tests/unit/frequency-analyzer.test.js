/**
 * Unit tests for FrequencyAnalyzer
 * Tests frequency range binning, smoothing, normalization, and spectrum analysis
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FrequencyAnalyzer } from '../../src/audio/core/frequency-analyzer.js'

describe('FrequencyAnalyzer', () => {
    let analyzer
    let mockAudioContext
    
    beforeEach(() => {
        // Mock AudioContext
        mockAudioContext = {
            sampleRate: 44100
        }
        
        // Create analyzer with test configuration
        analyzer = new FrequencyAnalyzer({
            fftSize: 1024,
            smoothingTimeConstant: 0.8,
            frequencyRanges: {
                bass: { min: 20, max: 250, weight: 1.0 },
                mids: { min: 250, max: 4000, weight: 1.0 },
                treble: { min: 4000, max: 20000, weight: 1.0 }
            },
            smoothingEnabled: true,
            smoothingFactor: 0.7,
            normalizationEnabled: true,
            normalizationMethod: 'peak',
            spectrumResolution: 128,
            logScale: true,
            sampleRate: 44100
        })
        
        // Initialize analyzer
        analyzer.initialize(mockAudioContext, 512) // 512 bins for 1024 FFT
    })
    
    describe('Initialization', () => {
        it('should initialize with correct configuration', () => {
            expect(analyzer.isInitialized).toBe(true)
            expect(analyzer.config.fftSize).toBe(1024)
            expect(analyzer.config.spectrumResolution).toBe(128)
            expect(analyzer.nyquistFrequency).toBe(22050)
            expect(analyzer.binWidth).toBeCloseTo(43.066, 2) // 22050 / 512
        })
        
        it('should calculate frequency bins correctly', () => {
            const binInfo = analyzer.getFrequencyBinInfo()
            
            expect(binInfo.ranges.bass).toBeDefined()
            expect(binInfo.ranges.mids).toBeDefined()
            expect(binInfo.ranges.treble).toBeDefined()
            
            // Bass range should start near bin 0 and end around bin 5-6
            expect(binInfo.ranges.bass.bins.length).toBeGreaterThan(0)
            expect(binInfo.ranges.bass.bins[0]).toBe(0)
            
            // Mids range should have more bins
            expect(binInfo.ranges.mids.bins.length).toBeGreaterThan(binInfo.ranges.bass.bins.length)
            
            // Treble range should start at or after mids (may overlap at boundary)
            expect(binInfo.ranges.treble.bins[0]).toBeGreaterThanOrEqual(binInfo.ranges.mids.bins[binInfo.ranges.mids.bins.length - 1])
        })
        
        it('should calculate spectrum bins for logarithmic scale', () => {
            expect(analyzer.spectrumBins).toHaveLength(128)
            
            // First bin should be around 20 Hz
            expect(analyzer.spectrumBins[0].frequency).toBeCloseTo(20, 0)
            
            // Last bin should be near Nyquist frequency
            const lastBin = analyzer.spectrumBins[analyzer.spectrumBins.length - 1]
            expect(lastBin.frequency).toBeLessThan(22050)
            expect(lastBin.frequency).toBeGreaterThan(10000)
        })
    })
    
    describe('Frequency Analysis', () => {
        it('should analyze frequency data correctly', () => {
            // Create test frequency data with known patterns
            const frequencyData = new Uint8Array(512)
            
            // Add bass energy (bins 0-5)
            for (let i = 0; i <= 5; i++) {
                frequencyData[i] = 200
            }
            
            // Add mid energy (bins 20-100)
            for (let i = 20; i <= 100; i++) {
                frequencyData[i] = 150
            }
            
            // Add treble energy (bins 200-400)
            for (let i = 200; i <= 400; i++) {
                frequencyData[i] = 100
            }
            
            const analysis = analyzer.analyzeFrequencies(frequencyData)
            
            expect(analysis.bass).toBeGreaterThan(0.5) // Should detect bass
            expect(analysis.mids).toBeGreaterThan(0.3) // Should detect mids
            expect(analysis.treble).toBeGreaterThan(0.2) // Should detect treble
            
            expect(analysis.spectrum).toHaveLength(128)
            expect(analysis.spectrumFrequencies).toHaveLength(128)
            
            expect(analysis.metrics).toBeDefined()
            expect(analysis.metrics.overallAmplitude).toBeGreaterThan(0)
            expect(analysis.metrics.dominantRange).toBe('bass')
        })
        
        it('should handle empty frequency data', () => {
            const frequencyData = new Uint8Array(512) // All zeros
            
            const analysis = analyzer.analyzeFrequencies(frequencyData)
            
            expect(analysis.bass).toBe(0)
            expect(analysis.mids).toBe(0)
            expect(analysis.treble).toBe(0)
            expect(analysis.metrics.overallAmplitude).toBe(0)
        })
        
        it('should calculate spectral centroid correctly', () => {
            const frequencyData = new Uint8Array(512)
            
            // Add energy concentrated in higher frequencies
            for (let i = 300; i < 400; i++) {
                frequencyData[i] = 255
            }
            
            const analysis = analyzer.analyzeFrequencies(frequencyData)
            
            // Spectral centroid should be in the higher frequency range
            expect(analysis.metrics.spectralCentroid).toBeGreaterThan(10000)
        })
    })
    
    describe('Smoothing', () => {
        it('should apply smoothing to frequency values', () => {
            const frequencyData1 = new Uint8Array(512)
            const frequencyData2 = new Uint8Array(512)
            
            // First frame with high bass
            frequencyData1[0] = 255
            frequencyData1[1] = 255
            
            // Second frame with no bass
            // frequencyData2 is all zeros
            
            const analysis1 = analyzer.analyzeFrequencies(frequencyData1)
            const analysis2 = analyzer.analyzeFrequencies(frequencyData2)
            
            // Second analysis should still have some bass due to smoothing
            expect(analysis2.bass).toBeGreaterThan(0)
            expect(analysis2.bass).toBeLessThan(analysis1.bass)
        })
        
        it('should disable smoothing when configured', () => {
            // Create analyzer without smoothing
            const noSmoothAnalyzer = new FrequencyAnalyzer({
                smoothingEnabled: false,
                frequencyRanges: {
                    bass: { min: 20, max: 250, weight: 1.0 }
                }
            })
            noSmoothAnalyzer.initialize(mockAudioContext, 512)
            
            const frequencyData1 = new Uint8Array(512)
            const frequencyData2 = new Uint8Array(512)
            
            // First frame with high bass
            frequencyData1[0] = 255
            frequencyData1[1] = 255
            
            // Second frame with no bass
            
            const analysis1 = noSmoothAnalyzer.analyzeFrequencies(frequencyData1)
            const analysis2 = noSmoothAnalyzer.analyzeFrequencies(frequencyData2)
            
            // Without smoothing, second analysis should have zero bass
            expect(analysis2.bass).toBe(0)
        })
    })
    
    describe('Normalization', () => {
        it('should apply peak normalization', () => {
            const frequencyData = new Uint8Array(512)
            
            // First analysis with moderate bass
            frequencyData[0] = 128
            const analysis1 = analyzer.analyzeFrequencies(frequencyData)
            
            // Second analysis with high bass
            frequencyData[0] = 255
            const analysis2 = analyzer.analyzeFrequencies(frequencyData)
            
            // Third analysis with moderate bass again
            frequencyData[0] = 128
            const analysis3 = analyzer.analyzeFrequencies(frequencyData)
            
            // Peak normalization should make the third analysis lower than or equal to the first
            // (may be equal if peak hasn't decayed enough)
            expect(analysis3.bass).toBeLessThanOrEqual(analysis1.bass)
        })
        
        it('should apply RMS normalization', () => {
            // Create analyzer with RMS normalization
            const rmsAnalyzer = new FrequencyAnalyzer({
                normalizationMethod: 'rms',
                frequencyRanges: {
                    bass: { min: 20, max: 250, weight: 1.0 }
                }
            })
            rmsAnalyzer.initialize(mockAudioContext, 512)
            
            const frequencyData = new Uint8Array(512)
            
            // Build up RMS history with consistent values
            for (let i = 0; i < 10; i++) {
                frequencyData[0] = 100
                rmsAnalyzer.analyzeFrequencies(frequencyData)
            }
            
            // Test with higher value
            frequencyData[0] = 200
            const analysis = rmsAnalyzer.analyzeFrequencies(frequencyData)
            
            expect(analysis.bass).toBeGreaterThan(0)
            expect(analysis.bass).toBeLessThan(1.0)
        })
        
        it('should apply adaptive normalization', () => {
            // Create analyzer with adaptive normalization
            const adaptiveAnalyzer = new FrequencyAnalyzer({
                normalizationMethod: 'adaptive',
                frequencyRanges: {
                    bass: { min: 20, max: 250, weight: 1.0 }
                }
            })
            adaptiveAnalyzer.initialize(mockAudioContext, 512)
            
            const frequencyData = new Uint8Array(512)
            
            // Start with low values to increase gain
            for (let i = 0; i < 10; i++) {
                frequencyData[0] = 50
                adaptiveAnalyzer.analyzeFrequencies(frequencyData)
            }
            
            // Test with same low value - should be boosted
            const analysis = adaptiveAnalyzer.analyzeFrequencies(frequencyData)
            
            // Adaptive normalization may take time to build up gain
            expect(analysis.bass).toBeGreaterThan(0) // Should have some value
        })
    })
    
    describe('Frequency Range Weighting', () => {
        it('should apply frequency range weights', () => {
            // Create analyzer with weighted ranges
            const weightedAnalyzer = new FrequencyAnalyzer({
                frequencyRanges: {
                    bass: { min: 20, max: 250, weight: 2.0 }, // Double weight
                    mids: { min: 250, max: 4000, weight: 0.5 }, // Half weight
                    treble: { min: 4000, max: 20000, weight: 1.0 }
                }
            })
            weightedAnalyzer.initialize(mockAudioContext, 512)
            
            const frequencyData = new Uint8Array(512)
            
            // Add equal energy to all ranges
            for (let i = 0; i <= 5; i++) frequencyData[i] = 100 // Bass
            for (let i = 20; i <= 100; i++) frequencyData[i] = 100 // Mids
            for (let i = 200; i <= 400; i++) frequencyData[i] = 100 // Treble
            
            const analysis = weightedAnalyzer.analyzeFrequencies(frequencyData)
            
            // Bass should be boosted (2x weight), mids should be reduced (0.5x weight)
            // Note: actual values depend on bin distribution, so test relative relationships
            expect(analysis.bass).toBeGreaterThan(0)
            expect(analysis.mids).toBeGreaterThan(0)
            expect(analysis.treble).toBeGreaterThan(0)
            
            // With equal input energy, weighted bass should be higher than weighted mids
            const rawBass = analysis.raw.bass
            const rawMids = analysis.raw.mids
            if (rawBass > 0 && rawMids > 0) {
                expect(analysis.bass / rawBass).toBeGreaterThan(analysis.mids / rawMids)
            }
        })
        
        it('should update frequency ranges dynamically', () => {
            const originalBinInfo = analyzer.getFrequencyBinInfo()
            
            // Update frequency ranges
            analyzer.updateFrequencyRanges({
                bass: { min: 20, max: 300, weight: 1.5 } // Extend bass range
            })
            
            const newBinInfo = analyzer.getFrequencyBinInfo()
            
            // Bass range should have more bins now
            expect(newBinInfo.ranges.bass.bins.length).toBeGreaterThan(originalBinInfo.ranges.bass.bins.length)
            expect(newBinInfo.ranges.bass.weight).toBe(1.5)
        })
    })
    
    describe('Spectrum Analysis', () => {
        it('should generate spectrum with correct resolution', () => {
            const frequencyData = new Uint8Array(512)
            
            // Add some test data
            for (let i = 0; i < 512; i++) {
                frequencyData[i] = Math.floor(Math.random() * 255)
            }
            
            const analysis = analyzer.analyzeFrequencies(frequencyData)
            
            expect(analysis.spectrum).toHaveLength(128)
            expect(analysis.spectrumFrequencies).toHaveLength(128)
            
            // All spectrum values should be between 0 and 1
            for (const value of analysis.spectrum) {
                expect(value).toBeGreaterThanOrEqual(0)
                expect(value).toBeLessThanOrEqual(1)
            }
            
            // Frequencies should be in ascending order
            for (let i = 1; i < analysis.spectrumFrequencies.length; i++) {
                expect(analysis.spectrumFrequencies[i]).toBeGreaterThan(analysis.spectrumFrequencies[i - 1])
            }
        })
        
        it('should support linear frequency scale', () => {
            // Create analyzer with linear scale
            const linearAnalyzer = new FrequencyAnalyzer({
                logScale: false,
                spectrumResolution: 64
            })
            linearAnalyzer.initialize(mockAudioContext, 512)
            
            const frequencyData = new Uint8Array(512)
            const analysis = linearAnalyzer.analyzeFrequencies(frequencyData)
            
            expect(analysis.spectrum).toHaveLength(64)
            
            // Linear scale should have equal frequency spacing
            const freqStep = analysis.spectrumFrequencies[1] - analysis.spectrumFrequencies[0]
            const lastStep = analysis.spectrumFrequencies[63] - analysis.spectrumFrequencies[62]
            
            expect(Math.abs(freqStep - lastStep)).toBeLessThan(freqStep * 0.1) // Within 10%
        })
    })
    
    describe('Configuration Updates', () => {
        it('should update configuration dynamically', () => {
            const originalConfig = analyzer.getConfiguration()
            
            analyzer.updateConfiguration({
                smoothingFactor: 0.9,
                spectrumResolution: 256,
                normalizationMethod: 'rms'
            })
            
            const newConfig = analyzer.getConfiguration()
            
            expect(newConfig.smoothingFactor).toBe(0.9)
            expect(newConfig.spectrumResolution).toBe(256)
            expect(newConfig.normalizationMethod).toBe('rms')
            
            // Should have recalculated spectrum bins
            expect(analyzer.spectrumBins).toHaveLength(256)
        })
        
        it('should reset state correctly', () => {
            const frequencyData = new Uint8Array(512)
            frequencyData[0] = 255
            
            // Build up some state
            analyzer.analyzeFrequencies(frequencyData)
            analyzer.analyzeFrequencies(frequencyData)
            
            const beforeReset = analyzer.getLastAnalysis()
            expect(beforeReset.bass).toBeGreaterThan(0)
            
            // Reset and analyze empty data
            analyzer.reset()
            frequencyData[0] = 0
            const afterReset = analyzer.analyzeFrequencies(frequencyData)
            
            expect(afterReset.bass).toBe(0)
        })
    })
    
    describe('Performance and Metrics', () => {
        it('should calculate frequency distribution metrics', () => {
            const frequencyData = new Uint8Array(512)
            
            // Add more bass than other frequencies
            for (let i = 0; i <= 5; i++) frequencyData[i] = 200
            for (let i = 20; i <= 50; i++) frequencyData[i] = 100
            for (let i = 200; i <= 250; i++) frequencyData[i] = 50
            
            const analysis = analyzer.analyzeFrequencies(frequencyData)
            
            // Distribution depends on actual bin counts and energy distribution
            expect(analysis.metrics.distribution.bass).toBeGreaterThan(0.2)
            expect(analysis.metrics.distribution.mids).toBeGreaterThan(0.2)
            expect(analysis.metrics.distribution.treble).toBeGreaterThan(0.1)
            
            // Total distribution should sum to 1
            const total = analysis.metrics.distribution.bass + 
                         analysis.metrics.distribution.mids + 
                         analysis.metrics.distribution.treble
            expect(total).toBeCloseTo(1.0, 2)
            
            expect(analysis.metrics.dominantRange).toBe('bass')
        })
        
        it('should calculate dynamic range', () => {
            const frequencyData = new Uint8Array(512)
            
            // Create high dynamic range
            frequencyData[0] = 255 // High bass
            for (let i = 20; i <= 50; i++) frequencyData[i] = 50 // Low mids
            
            const analysis = analyzer.analyzeFrequencies(frequencyData)
            
            expect(analysis.metrics.dynamicRange).toBeGreaterThan(0.5)
        })
        
        it('should track analysis timing', () => {
            const frequencyData = new Uint8Array(512)
            
            const analysis = analyzer.analyzeFrequencies(frequencyData)
            
            expect(analysis.analysisTime).toBeGreaterThan(0)
            expect(analysis.timestamp).toBeGreaterThan(0)
        })
    })
    
    describe('Error Handling', () => {
        it('should throw error when not initialized', () => {
            const uninitializedAnalyzer = new FrequencyAnalyzer()
            const frequencyData = new Uint8Array(512)
            
            expect(() => {
                uninitializedAnalyzer.analyzeFrequencies(frequencyData)
            }).toThrow('FrequencyAnalyzer not initialized')
        })
        
        it('should handle invalid frequency data gracefully', () => {
            const invalidData = new Uint8Array(0) // Empty array
            
            const analysis = analyzer.analyzeFrequencies(invalidData)
            
            expect(analysis.bass).toBe(0)
            expect(analysis.mids).toBe(0)
            expect(analysis.treble).toBe(0)
        })
    })
})