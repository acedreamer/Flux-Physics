import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { FFTOptimizer } from '../../src/audio/core/fft-optimizer.js'

describe('FFTOptimizer', () => {
    let optimizer
    let testFrequencyData
    
    beforeEach(() => {
        optimizer = new FFTOptimizer({
            fftSize: 2048,
            sampleRate: 44100,
            windowFunction: 'hann'
        })
        
        // Create test frequency data
        testFrequencyData = new Uint8Array(1024) // fftSize / 2
        
        // Fill with test pattern
        for (let i = 0; i < testFrequencyData.length; i++) {
            // Simulate typical audio spectrum
            if (i < 50) { // Bass
                testFrequencyData[i] = Math.floor(200 + 55 * Math.random())
            } else if (i < 400) { // Mids
                testFrequencyData[i] = Math.floor(100 + 100 * Math.random())
            } else { // Treble
                testFrequencyData[i] = Math.floor(50 * Math.random())
            }
        }
    })
    
    afterEach(() => {
        if (optimizer) {
            optimizer.dispose()
        }
    })
    
    describe('initialization', () => {
        it('should initialize with default configuration', () => {
            const defaultOptimizer = new FFTOptimizer()
            
            expect(defaultOptimizer.config.fftSize).toBe(2048)
            expect(defaultOptimizer.config.sampleRate).toBe(44100)
            expect(defaultOptimizer.config.windowFunction).toBe('hann')
            expect(defaultOptimizer.binCount).toBe(1024)
            expect(defaultOptimizer.binWidth).toBeCloseTo(21.53, 2)
            
            defaultOptimizer.dispose()
        })
        
        it('should initialize with custom configuration', () => {
            const customOptimizer = new FFTOptimizer({
                fftSize: 4096,
                sampleRate: 48000,
                windowFunction: 'blackman'
            })
            
            expect(customOptimizer.config.fftSize).toBe(4096)
            expect(customOptimizer.config.sampleRate).toBe(48000)
            expect(customOptimizer.config.windowFunction).toBe('blackman')
            expect(customOptimizer.binCount).toBe(2048)
            
            customOptimizer.dispose()
        })
        
        it('should calculate correct frequency parameters', () => {
            expect(optimizer.nyquist).toBe(22050)
            expect(optimizer.binCount).toBe(1024)
            expect(optimizer.binWidth).toBeCloseTo(21.53, 2)
        })
    })
    
    describe('window function generation', () => {
        it('should generate Hann window coefficients', () => {
            const coefficients = optimizer.generateWindowFunction()
            
            expect(coefficients).toBeInstanceOf(Float32Array)
            expect(coefficients.length).toBe(2048)
            
            // Check window properties
            expect(coefficients[0]).toBeCloseTo(0, 3) // Start at 0
            expect(coefficients[1023]).toBeCloseTo(1, 1) // Peak around middle
            expect(coefficients[2047]).toBeCloseTo(0, 3) // End at 0
        })
        
        it('should generate Hamming window coefficients', () => {
            const hammingOptimizer = new FFTOptimizer({
                windowFunction: 'hamming'
            })
            
            const coefficients = hammingOptimizer.generateWindowFunction()
            
            expect(coefficients[0]).toBeCloseTo(0.08, 2) // Hamming starts at 0.08
            expect(coefficients[1023]).toBeCloseTo(1, 1) // Peak around middle
            
            hammingOptimizer.dispose()
        })
        
        it('should generate Blackman window coefficients', () => {
            const blackmanOptimizer = new FFTOptimizer({
                windowFunction: 'blackman'
            })
            
            const coefficients = blackmanOptimizer.generateWindowFunction()
            
            expect(coefficients[0]).toBeCloseTo(0, 2) // Blackman starts near 0
            expect(coefficients[1023]).toBeCloseTo(1, 1) // Peak around middle
            
            blackmanOptimizer.dispose()
        })
        
        it('should generate rectangular window coefficients', () => {
            const rectOptimizer = new FFTOptimizer({
                windowFunction: 'rectangular'
            })
            
            const coefficients = rectOptimizer.generateWindowFunction()
            
            // All coefficients should be 1.0 for rectangular window
            for (let i = 0; i < coefficients.length; i++) {
                expect(coefficients[i]).toBe(1.0)
            }
            
            rectOptimizer.dispose()
        })
    })
    
    describe('frequency bin mapping', () => {
        it('should generate frequency bin mappings', () => {
            expect(optimizer.frequencyBinMap.size).toBeGreaterThan(0)
            
            // Check that common ranges are mapped
            expect(optimizer.frequencyBinMap.has('bass')).toBe(true)
            expect(optimizer.frequencyBinMap.has('mids')).toBe(true)
            expect(optimizer.frequencyBinMap.has('treble')).toBe(true)
            
            // Check bin arrays are not empty
            const bassBins = optimizer.frequencyBinMap.get('bass')
            expect(bassBins.length).toBeGreaterThan(0)
            
            const midsBins = optimizer.frequencyBinMap.get('mids')
            expect(midsBins.length).toBeGreaterThan(0)
            
            const trebleBins = optimizer.frequencyBinMap.get('treble')
            expect(trebleBins.length).toBeGreaterThan(0)
        })
        
        it('should map frequency ranges correctly', () => {
            const bassBins = optimizer.frequencyBinMap.get('bass')
            const trebleBins = optimizer.frequencyBinMap.get('treble')
            
            // Bass bins should be at lower indices
            expect(Math.max(...bassBins)).toBeLessThan(Math.min(...trebleBins))
            
            // All bin indices should be within valid range
            bassBins.forEach(bin => {
                expect(bin).toBeGreaterThanOrEqual(0)
                expect(bin).toBeLessThan(optimizer.binCount)
            })
        })
    })
    
    describe('logarithmic frequency bins', () => {
        it('should generate logarithmic frequency bins', () => {
            expect(optimizer.logarithmicBins).toBeInstanceOf(Array)
            expect(optimizer.logarithmicBins.length).toBeGreaterThan(0)
            
            // Check structure of logarithmic bins
            const firstBin = optimizer.logarithmicBins[0]
            expect(firstBin).toHaveProperty('frequency')
            expect(firstBin).toHaveProperty('binIndex')
            expect(firstBin).toHaveProperty('weight')
            
            // Frequencies should increase logarithmically
            for (let i = 1; i < optimizer.logarithmicBins.length; i++) {
                expect(optimizer.logarithmicBins[i].frequency).toBeGreaterThan(
                    optimizer.logarithmicBins[i - 1].frequency
                )
            }
        })
    })
    
    describe('lookup table generation', () => {
        it('should precompute mel scale lookup table', () => {
            expect(optimizer.melScale).toBeInstanceOf(Float32Array)
            expect(optimizer.melScale.length).toBe(optimizer.binCount)
            
            // Mel scale should be monotonically increasing
            for (let i = 1; i < optimizer.melScale.length; i++) {
                expect(optimizer.melScale[i]).toBeGreaterThanOrEqual(optimizer.melScale[i - 1])
            }
        })
        
        it('should precompute bark scale lookup table', () => {
            expect(optimizer.barkScale).toBeInstanceOf(Float32Array)
            expect(optimizer.barkScale.length).toBe(optimizer.binCount)
            
            // Bark scale should be monotonically increasing
            for (let i = 1; i < optimizer.barkScale.length; i++) {
                expect(optimizer.barkScale[i]).toBeGreaterThanOrEqual(optimizer.barkScale[i - 1])
            }
        })
    })
    
    describe('optimized windowing', () => {
        it('should apply windowing to time domain data', () => {
            const timeData = new Float32Array(2048)
            timeData.fill(1.0) // Fill with constant value
            
            const windowedData = optimizer.applyOptimizedWindowing(timeData)
            
            expect(windowedData).toBeInstanceOf(Float32Array)
            expect(windowedData.length).toBe(timeData.length)
            
            // Windowed data should be different from original
            expect(windowedData[0]).not.toBe(timeData[0])
            expect(windowedData[1023]).not.toBe(timeData[1023])
            
            // Performance stats should be updated
            expect(optimizer.performanceStats.windowingTime).toBeGreaterThan(0)
        })
        
        it('should apply pre-emphasis if enabled', () => {
            const preEmphasisOptimizer = new FFTOptimizer({
                preEmphasis: true,
                preEmphasisCoeff: 0.97
            })
            
            const timeData = new Float32Array(2048)
            for (let i = 0; i < timeData.length; i++) {
                timeData[i] = Math.sin(i * 0.1) // Sine wave
            }
            
            const windowedData = preEmphasisOptimizer.applyOptimizedWindowing(timeData)
            
            // Pre-emphasis should modify the signal
            expect(windowedData[100]).not.toBeCloseTo(timeData[100] * preEmphasisOptimizer.windowCoefficients[100], 5)
            
            preEmphasisOptimizer.dispose()
        })
        
        it('should skip windowing when optimization disabled', () => {
            optimizer.usePrecomputedWindowing = false
            
            const timeData = new Float32Array(2048)
            timeData.fill(1.0)
            
            const result = optimizer.applyOptimizedWindowing(timeData)
            
            // Should return original data when optimization disabled
            expect(result).toBe(timeData)
        })
    })
    
    describe('optimized frequency range calculation', () => {
        it('should calculate frequency ranges using optimized binning', () => {
            const bassLevel = optimizer.calculateOptimizedFrequencyRange(testFrequencyData, 'bass')
            const midsLevel = optimizer.calculateOptimizedFrequencyRange(testFrequencyData, 'mids')
            const trebleLevel = optimizer.calculateOptimizedFrequencyRange(testFrequencyData, 'treble')
            
            expect(bassLevel).toBeGreaterThan(0)
            expect(bassLevel).toBeLessThanOrEqual(1)
            
            expect(midsLevel).toBeGreaterThan(0)
            expect(midsLevel).toBeLessThanOrEqual(1)
            
            expect(trebleLevel).toBeGreaterThan(0)
            expect(trebleLevel).toBeLessThanOrEqual(1)
            
            // Performance stats should be updated
            expect(optimizer.performanceStats.binningTime).toBeGreaterThan(0)
            expect(optimizer.performanceStats.totalOptimizations).toBeGreaterThan(0)
        })
        
        it('should fall back to non-optimized calculation when disabled', () => {
            optimizer.useOptimizedBinning = false
            
            const bassLevel = optimizer.calculateOptimizedFrequencyRange(testFrequencyData, 'bass')
            
            expect(bassLevel).toBeGreaterThan(0)
            expect(bassLevel).toBeLessThanOrEqual(1)
        })
        
        it('should handle invalid range names gracefully', () => {
            const result = optimizer.calculateOptimizedFrequencyRange(testFrequencyData, 'invalid')
            expect(result).toBe(0)
        })
        
        it('should handle empty frequency data', () => {
            const emptyData = new Uint8Array(1024)
            const result = optimizer.calculateOptimizedFrequencyRange(emptyData, 'bass')
            expect(result).toBe(0)
        })
    })
    
    describe('batch processing', () => {
        it('should process multiple frequency ranges efficiently', () => {
            const ranges = ['bass', 'mids', 'treble']
            const results = optimizer.batchProcessFrequencyRanges(testFrequencyData, ranges)
            
            expect(results).toHaveProperty('bass')
            expect(results).toHaveProperty('mids')
            expect(results).toHaveProperty('treble')
            
            expect(results.bass).toBeGreaterThan(0)
            expect(results.mids).toBeGreaterThan(0)
            expect(results.treble).toBeGreaterThan(0)
        })
        
        it('should be more efficient than individual calls', () => {
            const ranges = ['bass', 'mids', 'treble']
            
            // Reset performance stats
            optimizer.performanceStats.binningTime = 0
            
            // Batch processing
            const startTime = performance.now()
            optimizer.batchProcessFrequencyRanges(testFrequencyData, ranges)
            const batchTime = performance.now() - startTime
            
            // Reset stats again
            optimizer.performanceStats.binningTime = 0
            
            // Individual processing
            const startTime2 = performance.now()
            ranges.forEach(range => {
                optimizer.calculateOptimizedFrequencyRange(testFrequencyData, range)
            })
            const individualTime = performance.now() - startTime2
            
            // Batch should be faster or similar (allowing for measurement variance)
            expect(batchTime).toBeLessThanOrEqual(individualTime * 1.2)
        })
    })
    
    describe('logarithmic spectrum calculation', () => {
        it('should calculate logarithmic frequency distribution', () => {
            const logSpectrum = optimizer.calculateLogarithmicSpectrum(testFrequencyData)
            
            expect(logSpectrum).toBeInstanceOf(Float32Array)
            expect(logSpectrum.length).toBe(optimizer.logarithmicBins.length)
            
            // Values should be normalized (0-1)
            for (let i = 0; i < logSpectrum.length; i++) {
                expect(logSpectrum[i]).toBeGreaterThanOrEqual(0)
                expect(logSpectrum[i]).toBeLessThanOrEqual(1)
            }
            
            // Performance stats should be updated
            expect(optimizer.performanceStats.calculationTime).toBeGreaterThan(0)
        })
    })
    
    describe('mel spectrum calculation', () => {
        it('should calculate mel-scale frequency distribution', () => {
            const melSpectrum = optimizer.calculateMelSpectrum(testFrequencyData, 40)
            
            expect(melSpectrum).toBeInstanceOf(Float32Array)
            expect(melSpectrum.length).toBe(40)
            
            // Values should be normalized (0-1)
            for (let i = 0; i < melSpectrum.length; i++) {
                expect(melSpectrum[i]).toBeGreaterThanOrEqual(0)
                expect(melSpectrum[i]).toBeLessThanOrEqual(1)
            }
        })
        
        it('should handle different numbers of mel bins', () => {
            const melSpectrum20 = optimizer.calculateMelSpectrum(testFrequencyData, 20)
            const melSpectrum80 = optimizer.calculateMelSpectrum(testFrequencyData, 80)
            
            expect(melSpectrum20.length).toBe(20)
            expect(melSpectrum80.length).toBe(80)
        })
    })
    
    describe('spectral features calculation', () => {
        it('should calculate comprehensive spectral features', () => {
            const features = optimizer.calculateSpectralFeatures(testFrequencyData)
            
            expect(features).toHaveProperty('spectralCentroid')
            expect(features).toHaveProperty('spectralRolloff')
            expect(features).toHaveProperty('spectralSpread')
            expect(features).toHaveProperty('spectralFlatness')
            expect(features).toHaveProperty('totalEnergy')
            expect(features).toHaveProperty('brightness')
            
            // Values should be normalized
            expect(features.spectralCentroid).toBeGreaterThanOrEqual(0)
            expect(features.spectralCentroid).toBeLessThanOrEqual(1)
            
            expect(features.spectralRolloff).toBeGreaterThanOrEqual(0)
            expect(features.spectralRolloff).toBeLessThanOrEqual(1)
            
            expect(features.spectralFlatness).toBeGreaterThanOrEqual(0)
            expect(features.spectralFlatness).toBeLessThanOrEqual(1)
            
            expect(features.totalEnergy).toBeGreaterThan(0)
        })
        
        it('should handle silent input', () => {
            const silentData = new Uint8Array(1024) // All zeros
            const features = optimizer.calculateSpectralFeatures(silentData)
            
            expect(features.spectralCentroid).toBe(0)
            expect(features.spectralRolloff).toBe(0)
            expect(features.totalEnergy).toBe(0)
        })
    })
    
    describe('configuration updates', () => {
        it('should update configuration and reinitialize', () => {
            const originalFftSize = optimizer.config.fftSize
            
            optimizer.updateConfiguration({
                fftSize: 4096,
                sampleRate: 48000
            })
            
            expect(optimizer.config.fftSize).toBe(4096)
            expect(optimizer.config.sampleRate).toBe(48000)
            expect(optimizer.binCount).toBe(2048) // fftSize / 2
            expect(optimizer.nyquist).toBe(24000) // sampleRate / 2
            
            // Window coefficients should be regenerated
            expect(optimizer.windowCoefficients.length).toBe(4096)
        })
        
        it('should not reinitialize for non-critical parameter changes', () => {
            const originalWindowCoefficients = optimizer.windowCoefficients
            
            optimizer.updateConfiguration({
                windowFunction: 'hamming' // Non-critical change
            })
            
            expect(optimizer.config.windowFunction).toBe('hamming')
            // Should regenerate window coefficients
            expect(optimizer.windowCoefficients).not.toBe(originalWindowCoefficients)
        })
    })
    
    describe('optimization controls', () => {
        it('should enable/disable optimizations', () => {
            optimizer.setOptimizations({
                binning: false,
                windowing: false,
                lookupTables: false
            })
            
            expect(optimizer.useOptimizedBinning).toBe(false)
            expect(optimizer.usePrecomputedWindowing).toBe(false)
            expect(optimizer.useLookupTables).toBe(false)
            
            optimizer.setOptimizations({
                binning: true,
                windowing: true,
                lookupTables: true
            })
            
            expect(optimizer.useOptimizedBinning).toBe(true)
            expect(optimizer.usePrecomputedWindowing).toBe(true)
            expect(optimizer.useLookupTables).toBe(true)
        })
    })
    
    describe('performance statistics', () => {
        it('should track performance statistics', () => {
            // Perform some operations to generate stats
            optimizer.calculateOptimizedFrequencyRange(testFrequencyData, 'bass')
            optimizer.calculateSpectralFeatures(testFrequencyData)
            
            const stats = optimizer.getPerformanceStats()
            
            expect(stats).toHaveProperty('binningTime')
            expect(stats).toHaveProperty('calculationTime')
            expect(stats).toHaveProperty('totalOptimizations')
            expect(stats).toHaveProperty('optimizationsEnabled')
            expect(stats).toHaveProperty('configuration')
            
            expect(stats.binningTime).toBeGreaterThan(0)
            expect(stats.calculationTime).toBeGreaterThan(0)
            expect(stats.totalOptimizations).toBeGreaterThan(0)
        })
        
        it('should reset performance statistics', () => {
            // Generate some stats
            optimizer.calculateOptimizedFrequencyRange(testFrequencyData, 'bass')
            
            expect(optimizer.performanceStats.totalOptimizations).toBeGreaterThan(0)
            
            // Reset
            optimizer.resetPerformanceStats()
            
            expect(optimizer.performanceStats.totalOptimizations).toBe(0)
            expect(optimizer.performanceStats.binningTime).toBe(0)
            expect(optimizer.performanceStats.calculationTime).toBe(0)
        })
    })
    
    describe('frequency bin information', () => {
        it('should provide frequency bin information', () => {
            const binInfo = optimizer.getFrequencyBinInfo()
            
            expect(binInfo).toHaveProperty('ranges')
            expect(binInfo).toHaveProperty('logarithmicBins')
            expect(binInfo).toHaveProperty('totalBins')
            expect(binInfo).toHaveProperty('binWidth')
            expect(binInfo).toHaveProperty('nyquist')
            
            expect(binInfo.totalBins).toBe(optimizer.binCount)
            expect(binInfo.binWidth).toBeCloseTo(optimizer.binWidth, 2)
            expect(binInfo.nyquist).toBe(optimizer.nyquist)
            
            // Check range information
            expect(binInfo.ranges).toHaveProperty('bass')
            expect(binInfo.ranges.bass).toHaveProperty('binCount')
            expect(binInfo.ranges.bass).toHaveProperty('minFrequency')
            expect(binInfo.ranges.bass).toHaveProperty('maxFrequency')
        })
    })
    
    describe('resource cleanup', () => {
        it('should dispose resources properly', () => {
            // Generate some data
            optimizer.calculateOptimizedFrequencyRange(testFrequencyData, 'bass')
            
            expect(optimizer.frequencyBinMap.size).toBeGreaterThan(0)
            expect(optimizer.logarithmicBins).not.toBeNull()
            
            // Dispose
            optimizer.dispose()
            
            expect(optimizer.frequencyBinMap.size).toBe(0)
            expect(optimizer.logarithmicBins).toBeNull()
            expect(optimizer.windowCoefficients).toBeNull()
            expect(optimizer.melScale).toBeNull()
            expect(optimizer.barkScale).toBeNull()
        })
    })
})