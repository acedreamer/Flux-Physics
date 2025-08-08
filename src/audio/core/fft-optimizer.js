/**
 * FFTOptimizer - Optimized FFT processing and frequency calculations
 * Provides performance improvements for audio analysis
 */
export class FFTOptimizer {
    constructor(options = {}) {
        this.config = {
            fftSize: options.fftSize || 2048,
            sampleRate: options.sampleRate || 44100,
            windowFunction: options.windowFunction || 'hann',
            zeroPadding: options.zeroPadding || false,
            preEmphasis: options.preEmphasis || false,
            preEmphasisCoeff: options.preEmphasisCoeff || 0.97
        }
        
        // Pre-calculated values for optimization
        this.nyquist = this.config.sampleRate / 2
        this.binCount = this.config.fftSize / 2
        this.binWidth = this.nyquist / this.binCount
        
        // Pre-computed window function
        this.windowCoefficients = this.generateWindowFunction()
        
        // Frequency bin mappings
        this.frequencyBinMap = new Map()
        this.logarithmicBins = null
        
        // Optimization flags
        this.useOptimizedBinning = true
        this.usePrecomputedWindowing = true
        this.useLookupTables = true
        
        // Performance tracking
        this.performanceStats = {
            windowingTime: 0,
            binningTime: 0,
            calculationTime: 0,
            totalOptimizations: 0
        }
        
        // Initialize optimizations
        this.initializeOptimizations()
    }
    
    /**
     * Initialize performance optimizations
     */
    initializeOptimizations() {
        this.generateFrequencyBinMap()
        this.generateLogarithmicBins()
        this.precomputeLookupTables()
    }
    
    /**
     * Generate window function coefficients
     * @returns {Float32Array} Window coefficients
     */
    generateWindowFunction() {
        const coefficients = new Float32Array(this.config.fftSize)
        const N = this.config.fftSize
        
        switch (this.config.windowFunction) {
            case 'hann':
                for (let i = 0; i < N; i++) {
                    coefficients[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1)))
                }
                break
                
            case 'hamming':
                for (let i = 0; i < N; i++) {
                    coefficients[i] = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (N - 1))
                }
                break
                
            case 'blackman':
                for (let i = 0; i < N; i++) {
                    const factor = 2 * Math.PI * i / (N - 1)
                    coefficients[i] = 0.42 - 0.5 * Math.cos(factor) + 0.08 * Math.cos(2 * factor)
                }
                break
                
            case 'rectangular':
            default:
                coefficients.fill(1.0)
                break
        }
        
        return coefficients
    }
    
    /**
     * Generate frequency bin mapping for fast lookups
     */
    generateFrequencyBinMap() {
        this.frequencyBinMap.clear()
        
        // Common frequency ranges for audio analysis
        const ranges = {
            subBass: { min: 20, max: 60 },
            bass: { min: 20, max: 250 },
            lowMids: { min: 250, max: 500 },
            mids: { min: 250, max: 4000 },
            highMids: { min: 2000, max: 4000 },
            treble: { min: 4000, max: 20000 },
            presence: { min: 4000, max: 6000 },
            brilliance: { min: 6000, max: 20000 }
        }
        
        for (const [rangeName, range] of Object.entries(ranges)) {
            const bins = []
            
            for (let i = 0; i < this.binCount; i++) {
                const frequency = i * this.binWidth
                if (frequency >= range.min && frequency <= range.max) {
                    bins.push(i)
                }
            }
            
            this.frequencyBinMap.set(rangeName, bins)
        }
    }
    
    /**
     * Generate logarithmic frequency bins for perceptual analysis
     */
    generateLogarithmicBins() {
        const minFreq = 20
        const maxFreq = this.nyquist
        const binsPerOctave = 12 // Musical semitones
        const octaves = Math.log2(maxFreq / minFreq)
        const totalBins = Math.floor(octaves * binsPerOctave)
        
        this.logarithmicBins = new Array(totalBins)
        
        for (let i = 0; i < totalBins; i++) {
            const frequency = minFreq * Math.pow(2, i / binsPerOctave)
            const binIndex = Math.round(frequency / this.binWidth)
            
            this.logarithmicBins[i] = {
                frequency,
                binIndex: Math.min(binIndex, this.binCount - 1),
                weight: 1.0
            }
        }
    }
    
    /**
     * Precompute lookup tables for common calculations
     */
    precomputeLookupTables() {
        // Precompute mel scale conversion
        this.melScale = new Float32Array(this.binCount)
        for (let i = 0; i < this.binCount; i++) {
            const frequency = i * this.binWidth
            this.melScale[i] = 2595 * Math.log10(1 + frequency / 700)
        }
        
        // Precompute bark scale conversion
        this.barkScale = new Float32Array(this.binCount)
        for (let i = 0; i < this.binCount; i++) {
            const frequency = i * this.binWidth
            this.barkScale[i] = 13 * Math.atan(0.00076 * frequency) + 3.5 * Math.atan(Math.pow(frequency / 7500, 2))
        }
    }
    
    /**
     * Apply optimized windowing to time domain data
     * @param {Float32Array} timeData - Time domain data
     * @returns {Float32Array} Windowed data
     */
    applyOptimizedWindowing(timeData) {
        if (!this.usePrecomputedWindowing) {
            return timeData // Skip windowing optimization
        }
        
        const startTime = performance.now()
        const windowedData = new Float32Array(timeData.length)
        
        // Vectorized windowing operation
        for (let i = 0; i < timeData.length; i++) {
            windowedData[i] = timeData[i] * this.windowCoefficients[i]
        }
        
        // Apply pre-emphasis if enabled
        if (this.config.preEmphasis) {
            for (let i = windowedData.length - 1; i > 0; i--) {
                windowedData[i] = windowedData[i] - this.config.preEmphasisCoeff * windowedData[i - 1]
            }
        }
        
        this.performanceStats.windowingTime = performance.now() - startTime
        return windowedData
    }
    
    /**
     * Optimized frequency range calculation using precomputed bins
     * @param {Uint8Array} frequencyData - FFT frequency data
     * @param {string} rangeName - Frequency range name
     * @returns {number} Normalized average amplitude
     */
    calculateOptimizedFrequencyRange(frequencyData, rangeName) {
        if (!this.useOptimizedBinning) {
            return this.calculateFrequencyRangeFallback(frequencyData, rangeName)
        }
        
        const startTime = performance.now()
        const bins = this.frequencyBinMap.get(rangeName)
        
        if (!bins || bins.length === 0) {
            this.performanceStats.binningTime += performance.now() - startTime
            return 0
        }
        
        let sum = 0
        
        // Optimized loop with minimal bounds checking
        for (let i = 0; i < bins.length; i++) {
            const binIndex = bins[i]
            if (binIndex < frequencyData.length) {
                sum += frequencyData[binIndex]
            }
        }
        
        const result = (sum / bins.length) / 255
        this.performanceStats.binningTime += performance.now() - startTime
        this.performanceStats.totalOptimizations++
        
        return result
    }
    
    /**
     * Fallback frequency range calculation
     * @param {Uint8Array} frequencyData - FFT frequency data
     * @param {string} rangeName - Frequency range name
     * @returns {number} Normalized average amplitude
     */
    calculateFrequencyRangeFallback(frequencyData, rangeName) {
        // Define ranges inline for fallback
        const ranges = {
            bass: { min: 60, max: 250 },
            mids: { min: 250, max: 4000 },
            treble: { min: 4000, max: 20000 }
        }
        
        const range = ranges[rangeName]
        if (!range) return 0
        
        let sum = 0
        let count = 0
        
        for (let i = 0; i < frequencyData.length; i++) {
            const frequency = i * this.binWidth
            if (frequency >= range.min && frequency <= range.max) {
                sum += frequencyData[i]
                count++
            }
        }
        
        return count > 0 ? (sum / count) / 255 : 0
    }
    
    /**
     * Calculate logarithmic frequency distribution for perceptual analysis
     * @param {Uint8Array} frequencyData - FFT frequency data
     * @returns {Float32Array} Logarithmic frequency distribution
     */
    calculateLogarithmicSpectrum(frequencyData) {
        const startTime = performance.now()
        const logSpectrum = new Float32Array(this.logarithmicBins.length)
        
        for (let i = 0; i < this.logarithmicBins.length; i++) {
            const bin = this.logarithmicBins[i]
            const binIndex = bin.binIndex
            
            if (binIndex < frequencyData.length) {
                logSpectrum[i] = (frequencyData[binIndex] / 255) * bin.weight
            }
        }
        
        this.performanceStats.calculationTime += performance.now() - startTime
        return logSpectrum
    }
    
    /**
     * Calculate mel-scale frequency distribution
     * @param {Uint8Array} frequencyData - FFT frequency data
     * @param {number} numMelBins - Number of mel bins to generate
     * @returns {Float32Array} Mel-scale distribution
     */
    calculateMelSpectrum(frequencyData, numMelBins = 40) {
        const startTime = performance.now()
        const melSpectrum = new Float32Array(numMelBins)
        
        const minMel = this.melScale[0]
        const maxMel = this.melScale[this.melScale.length - 1]
        const melStep = (maxMel - minMel) / (numMelBins + 1)
        
        for (let i = 0; i < numMelBins; i++) {
            const targetMel = minMel + (i + 1) * melStep
            let sum = 0
            let count = 0
            
            // Find frequency bins that contribute to this mel bin
            for (let j = 0; j < this.melScale.length; j++) {
                const melValue = this.melScale[j]
                const distance = Math.abs(melValue - targetMel)
                
                if (distance < melStep) {
                    const weight = 1 - (distance / melStep) // Triangular weighting
                    sum += (frequencyData[j] / 255) * weight
                    count += weight
                }
            }
            
            melSpectrum[i] = count > 0 ? sum / count : 0
        }
        
        this.performanceStats.calculationTime += performance.now() - startTime
        return melSpectrum
    }
    
    /**
     * Calculate spectral features efficiently
     * @param {Uint8Array} frequencyData - FFT frequency data
     * @returns {Object} Spectral features
     */
    calculateSpectralFeatures(frequencyData) {
        const startTime = performance.now()
        
        // Normalize frequency data once
        const normalizedData = new Float32Array(frequencyData.length)
        let totalEnergy = 0
        
        for (let i = 0; i < frequencyData.length; i++) {
            normalizedData[i] = frequencyData[i] / 255
            totalEnergy += normalizedData[i] * normalizedData[i]
        }
        
        // Calculate spectral centroid (brightness)
        let weightedSum = 0
        let magnitudeSum = 0
        
        for (let i = 0; i < normalizedData.length; i++) {
            const magnitude = normalizedData[i]
            weightedSum += i * magnitude
            magnitudeSum += magnitude
        }
        
        const spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0
        
        // Calculate spectral rolloff (90% of energy)
        let cumulativeEnergy = 0
        const rolloffThreshold = totalEnergy * 0.9
        let spectralRolloff = 0
        
        for (let i = 0; i < normalizedData.length; i++) {
            cumulativeEnergy += normalizedData[i] * normalizedData[i]
            if (cumulativeEnergy >= rolloffThreshold) {
                spectralRolloff = i
                break
            }
        }
        
        // Calculate spectral spread (bandwidth)
        let spreadSum = 0
        for (let i = 0; i < normalizedData.length; i++) {
            const deviation = i - spectralCentroid
            spreadSum += deviation * deviation * normalizedData[i]
        }
        
        const spectralSpread = magnitudeSum > 0 ? Math.sqrt(spreadSum / magnitudeSum) : 0
        
        // Calculate spectral flatness (tonality measure)
        let geometricMean = 1
        let arithmeticMean = 0
        let validBins = 0
        
        for (let i = 1; i < normalizedData.length; i++) { // Skip DC component
            if (normalizedData[i] > 0) {
                geometricMean *= Math.pow(normalizedData[i], 1 / (normalizedData.length - 1))
                arithmeticMean += normalizedData[i]
                validBins++
            }
        }
        
        arithmeticMean /= validBins
        const spectralFlatness = arithmeticMean > 0 ? geometricMean / arithmeticMean : 0
        
        this.performanceStats.calculationTime += performance.now() - startTime
        
        return {
            spectralCentroid: spectralCentroid / normalizedData.length, // Normalize
            spectralRolloff: spectralRolloff / normalizedData.length, // Normalize
            spectralSpread: spectralSpread / normalizedData.length, // Normalize
            spectralFlatness,
            totalEnergy,
            brightness: spectralCentroid / normalizedData.length
        }
    }
    
    /**
     * Batch process multiple frequency ranges efficiently
     * @param {Uint8Array} frequencyData - FFT frequency data
     * @param {Array} rangeNames - Array of range names to process
     * @returns {Object} Results for all ranges
     */
    batchProcessFrequencyRanges(frequencyData, rangeNames) {
        const startTime = performance.now()
        const results = {}
        
        // Process all ranges in a single pass for cache efficiency
        for (const rangeName of rangeNames) {
            results[rangeName] = this.calculateOptimizedFrequencyRange(frequencyData, rangeName)
        }
        
        this.performanceStats.binningTime += performance.now() - startTime
        return results
    }
    
    /**
     * Update configuration and reinitialize optimizations
     * @param {Object} newConfig - New configuration options
     */
    updateConfiguration(newConfig) {
        const oldFftSize = this.config.fftSize
        const oldSampleRate = this.config.sampleRate
        
        this.config = { ...this.config, ...newConfig }
        
        // Reinitialize if critical parameters changed
        if (this.config.fftSize !== oldFftSize || this.config.sampleRate !== oldSampleRate) {
            this.nyquist = this.config.sampleRate / 2
            this.binCount = this.config.fftSize / 2
            this.binWidth = this.nyquist / this.binCount
            
            this.windowCoefficients = this.generateWindowFunction()
            this.initializeOptimizations()
        }
    }
    
    /**
     * Enable or disable specific optimizations
     * @param {Object} optimizations - Optimization flags
     */
    setOptimizations(optimizations) {
        this.useOptimizedBinning = optimizations.binning !== false
        this.usePrecomputedWindowing = optimizations.windowing !== false
        this.useLookupTables = optimizations.lookupTables !== false
        
        console.log('FFT optimizations updated:', {
            binning: this.useOptimizedBinning,
            windowing: this.usePrecomputedWindowing,
            lookupTables: this.useLookupTables
        })
    }
    
    /**
     * Get performance statistics
     * @returns {Object} Performance stats
     */
    getPerformanceStats() {
        return {
            ...this.performanceStats,
            optimizationsEnabled: {
                binning: this.useOptimizedBinning,
                windowing: this.usePrecomputedWindowing,
                lookupTables: this.useLookupTables
            },
            configuration: {
                fftSize: this.config.fftSize,
                sampleRate: this.config.sampleRate,
                windowFunction: this.config.windowFunction,
                binCount: this.binCount,
                binWidth: this.binWidth
            }
        }
    }
    
    /**
     * Reset performance statistics
     */
    resetPerformanceStats() {
        this.performanceStats = {
            windowingTime: 0,
            binningTime: 0,
            calculationTime: 0,
            totalOptimizations: 0
        }
    }
    
    /**
     * Get frequency bin information
     * @returns {Object} Frequency bin mappings and metadata
     */
    getFrequencyBinInfo() {
        const binInfo = {}
        
        for (const [rangeName, bins] of this.frequencyBinMap.entries()) {
            const minFreq = bins.length > 0 ? bins[0] * this.binWidth : 0
            const maxFreq = bins.length > 0 ? bins[bins.length - 1] * this.binWidth : 0
            
            binInfo[rangeName] = {
                binCount: bins.length,
                minFrequency: minFreq,
                maxFrequency: maxFreq,
                bins: bins
            }
        }
        
        return {
            ranges: binInfo,
            logarithmicBins: this.logarithmicBins ? this.logarithmicBins.length : 0,
            totalBins: this.binCount,
            binWidth: this.binWidth,
            nyquist: this.nyquist
        }
    }
    
    /**
     * Dispose of resources
     */
    dispose() {
        this.frequencyBinMap.clear()
        this.logarithmicBins = null
        this.windowCoefficients = null
        this.melScale = null
        this.barkScale = null
        this.resetPerformanceStats()
    }
}