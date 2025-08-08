/**
 * FrequencyAnalyzer - Advanced frequency analysis and binning system
 * Provides configurable frequency range binning, smoothing, normalization, and weighting
 */
export class FrequencyAnalyzer {
    constructor(options = {}) {
        this.config = {
            // Analysis resolution
            fftSize: options.fftSize || 2048,
            smoothingTimeConstant: options.smoothingTimeConstant || 0.8,
            
            // Frequency range configuration
            frequencyRanges: options.frequencyRanges || {
                bass: { min: 20, max: 250, weight: 1.0 },
                mids: { min: 250, max: 4000, weight: 1.0 },
                treble: { min: 4000, max: 20000, weight: 1.0 }
            },
            
            // Smoothing configuration
            smoothingEnabled: options.smoothingEnabled !== false,
            smoothingFactor: options.smoothingFactor || 0.7,
            
            // Normalization settings
            normalizationEnabled: options.normalizationEnabled !== false,
            normalizationMethod: options.normalizationMethod || 'peak', // 'peak', 'rms', 'adaptive'
            
            // Spectrum analysis
            spectrumResolution: options.spectrumResolution || 256,
            logScale: options.logScale !== false,
            
            // Performance settings
            sampleRate: options.sampleRate || 44100
        }
        
        // Frequency bin mappings
        this.frequencyBins = new Map()
        this.spectrumBins = []
        
        // Smoothing state
        this.smoothedValues = new Map()
        this.smoothedSpectrum = []
        
        // Normalization state
        this.peakValues = new Map()
        this.rmsHistory = new Map()
        this.adaptiveGains = new Map()
        
        // Analysis cache
        this.lastAnalysis = null
        this.analysisCache = new Map()
        
        this.isInitialized = false
    }
    
    /**
     * Initialize the frequency analyzer with audio context
     * @param {AudioContext} audioContext - Web Audio API context
     * @param {number} bufferLength - FFT buffer length
     */
    initialize(audioContext, bufferLength) {
        this.audioContext = audioContext
        this.bufferLength = bufferLength
        this.nyquistFrequency = this.config.sampleRate / 2
        this.binWidth = this.nyquistFrequency / bufferLength
        
        // Calculate frequency bin mappings
        this.calculateFrequencyBins()
        
        // Initialize spectrum bins for configurable resolution
        this.calculateSpectrumBins()
        
        // Initialize smoothing arrays
        this.initializeSmoothing()
        
        // Initialize normalization
        this.initializeNormalization()
        
        this.isInitialized = true
    }
    
    /**
     * Calculate frequency bin mappings for each configured range
     */
    calculateFrequencyBins() {
        this.frequencyBins.clear()
        
        for (const [rangeName, range] of Object.entries(this.config.frequencyRanges)) {
            const startBin = Math.max(0, Math.floor(range.min / this.binWidth))
            const endBin = Math.min(Math.floor(range.max / this.binWidth), this.bufferLength - 1)
            
            const bins = []
            for (let i = startBin; i <= endBin; i++) {
                bins.push(i)
            }
            
            this.frequencyBins.set(rangeName, {
                bins,
                weight: range.weight,
                minFreq: range.min,
                maxFreq: range.max,
                binCount: bins.length
            })
        }
    }
    
    /**
     * Calculate spectrum bins for configurable resolution analysis
     */
    calculateSpectrumBins() {
        this.spectrumBins = []
        const resolution = this.config.spectrumResolution
        
        if (this.config.logScale) {
            // Logarithmic frequency distribution
            const minFreq = Math.log10(20) // 20 Hz minimum
            const maxFreq = Math.log10(this.nyquistFrequency)
            const logStep = (maxFreq - minFreq) / resolution
            
            for (let i = 0; i < resolution; i++) {
                const logFreq = minFreq + (i * logStep)
                const freq = Math.pow(10, logFreq)
                const bin = Math.floor(freq / this.binWidth)
                
                this.spectrumBins.push({
                    bin: Math.min(bin, this.bufferLength - 1),
                    frequency: freq,
                    index: i
                })
            }
        } else {
            // Linear frequency distribution
            const freqStep = this.nyquistFrequency / resolution
            
            for (let i = 0; i < resolution; i++) {
                const freq = i * freqStep
                const bin = Math.floor(freq / this.binWidth)
                
                this.spectrumBins.push({
                    bin: Math.min(bin, this.bufferLength - 1),
                    frequency: freq,
                    index: i
                })
            }
        }
    }
    
    /**
     * Initialize smoothing arrays and state
     */
    initializeSmoothing() {
        this.smoothedValues.clear()
        
        // Initialize smoothed values for each frequency range
        for (const rangeName of Object.keys(this.config.frequencyRanges)) {
            this.smoothedValues.set(rangeName, 0)
        }
        
        // Initialize smoothed spectrum
        this.smoothedSpectrum = new Array(this.config.spectrumResolution).fill(0)
    }
    
    /**
     * Initialize normalization state
     */
    initializeNormalization() {
        this.peakValues.clear()
        this.rmsHistory.clear()
        this.adaptiveGains.clear()
        
        for (const rangeName of Object.keys(this.config.frequencyRanges)) {
            this.peakValues.set(rangeName, 0)
            this.rmsHistory.set(rangeName, [])
            this.adaptiveGains.set(rangeName, 1.0)
        }
    }
    
    /**
     * Analyze frequency data with full processing pipeline
     * @param {Uint8Array} frequencyData - Raw FFT frequency data
     * @returns {Object} Processed frequency analysis
     */
    analyzeFrequencies(frequencyData) {
        if (!this.isInitialized) {
            throw new Error('FrequencyAnalyzer not initialized')
        }
        
        const startTime = performance.now()
        
        // Calculate raw frequency range values
        const rawValues = this.calculateRawFrequencyValues(frequencyData)
        
        // Apply smoothing if enabled
        const smoothedValues = this.config.smoothingEnabled 
            ? this.applySmoothingToValues(rawValues)
            : rawValues
        
        // Apply normalization if enabled
        const normalizedValues = this.config.normalizationEnabled
            ? this.applyNormalization(smoothedValues)
            : smoothedValues
        
        // Apply frequency range weighting
        const weightedValues = this.applyFrequencyWeighting(normalizedValues)
        
        // Generate spectrum analysis
        const spectrum = this.generateSpectrum(frequencyData)
        
        // Calculate additional metrics
        const metrics = this.calculateFrequencyMetrics(frequencyData, weightedValues)
        
        const analysisTime = performance.now() - startTime
        
        const analysis = {
            // Frequency range values
            ...weightedValues,
            
            // Spectrum data
            spectrum: spectrum.values,
            spectrumFrequencies: spectrum.frequencies,
            
            // Raw values for debugging
            raw: rawValues,
            smoothed: smoothedValues,
            normalized: normalizedValues,
            
            // Metrics
            metrics,
            
            // Metadata
            timestamp: performance.now(),
            analysisTime,
            config: {
                resolution: this.config.spectrumResolution,
                smoothing: this.config.smoothingEnabled,
                normalization: this.config.normalizationEnabled,
                logScale: this.config.logScale
            }
        }
        
        this.lastAnalysis = analysis
        return analysis
    }
    
    /**
     * Calculate raw frequency range values
     * @param {Uint8Array} frequencyData - Raw FFT data
     * @returns {Object} Raw frequency range values
     */
    calculateRawFrequencyValues(frequencyData) {
        const values = {}
        
        for (const [rangeName, rangeData] of this.frequencyBins) {
            let sum = 0
            let count = 0
            
            for (const bin of rangeData.bins) {
                if (bin < frequencyData.length) {
                    sum += frequencyData[bin]
                    count++
                }
            }
            
            // Calculate average and normalize to 0-1
            values[rangeName] = count > 0 ? (sum / count) / 255 : 0
        }
        
        return values
    }
    
    /**
     * Apply smoothing to frequency values
     * @param {Object} rawValues - Raw frequency values
     * @returns {Object} Smoothed frequency values
     */
    applySmoothingToValues(rawValues) {
        const smoothedValues = {}
        const factor = this.config.smoothingFactor
        
        for (const [rangeName, rawValue] of Object.entries(rawValues)) {
            const currentSmoothed = this.smoothedValues.get(rangeName) || 0
            const newSmoothed = (factor * currentSmoothed) + ((1 - factor) * rawValue)
            
            this.smoothedValues.set(rangeName, newSmoothed)
            smoothedValues[rangeName] = newSmoothed
        }
        
        return smoothedValues
    }
    
    /**
     * Apply normalization to frequency values
     * @param {Object} values - Input frequency values
     * @returns {Object} Normalized frequency values
     */
    applyNormalization(values) {
        const normalizedValues = {}
        
        for (const [rangeName, value] of Object.entries(values)) {
            switch (this.config.normalizationMethod) {
                case 'peak':
                    normalizedValues[rangeName] = this.applyPeakNormalization(rangeName, value)
                    break
                case 'rms':
                    normalizedValues[rangeName] = this.applyRMSNormalization(rangeName, value)
                    break
                case 'adaptive':
                    normalizedValues[rangeName] = this.applyAdaptiveNormalization(rangeName, value)
                    break
                default:
                    normalizedValues[rangeName] = value
            }
        }
        
        return normalizedValues
    }
    
    /**
     * Apply peak normalization
     * @param {string} rangeName - Frequency range name
     * @param {number} value - Input value
     * @returns {number} Peak normalized value
     */
    applyPeakNormalization(rangeName, value) {
        const currentPeak = this.peakValues.get(rangeName) || 0
        const newPeak = Math.max(currentPeak * 0.999, value) // Slow decay
        
        this.peakValues.set(rangeName, newPeak)
        
        return newPeak > 0 ? Math.min(value / newPeak, 1.0) : 0
    }
    
    /**
     * Apply RMS normalization
     * @param {string} rangeName - Frequency range name
     * @param {number} value - Input value
     * @returns {number} RMS normalized value
     */
    applyRMSNormalization(rangeName, value) {
        const history = this.rmsHistory.get(rangeName) || []
        const maxHistorySize = 100 // ~2 seconds at 50fps
        
        // Add current value to history
        history.push(value * value) // Square for RMS
        if (history.length > maxHistorySize) {
            history.shift()
        }
        this.rmsHistory.set(rangeName, history)
        
        // Calculate RMS
        const meanSquare = history.reduce((sum, val) => sum + val, 0) / history.length
        const rms = Math.sqrt(meanSquare)
        
        return rms > 0 ? Math.min(value / (rms * 2), 1.0) : 0
    }
    
    /**
     * Apply adaptive normalization
     * @param {string} rangeName - Frequency range name
     * @param {number} value - Input value
     * @returns {number} Adaptively normalized value
     */
    applyAdaptiveNormalization(rangeName, value) {
        const currentGain = this.adaptiveGains.get(rangeName) || 1.0
        const targetLevel = 0.7 // Target normalized level
        const adaptationRate = 0.01
        
        // Calculate desired gain adjustment
        const normalizedValue = value * currentGain
        let gainAdjustment = 1.0
        
        if (normalizedValue > targetLevel) {
            gainAdjustment = 1.0 - adaptationRate
        } else if (normalizedValue < targetLevel * 0.5) {
            gainAdjustment = 1.0 + adaptationRate
        }
        
        // Update gain with limits
        const newGain = Math.max(0.1, Math.min(10.0, currentGain * gainAdjustment))
        this.adaptiveGains.set(rangeName, newGain)
        
        return Math.min(value * newGain, 1.0)
    }
    
    /**
     * Apply frequency range weighting
     * @param {Object} values - Input frequency values
     * @returns {Object} Weighted frequency values
     */
    applyFrequencyWeighting(values) {
        const weightedValues = {}
        
        for (const [rangeName, value] of Object.entries(values)) {
            const rangeData = this.frequencyBins.get(rangeName)
            const weight = rangeData ? rangeData.weight : 1.0
            weightedValues[rangeName] = Math.min(value * weight, 1.0)
        }
        
        return weightedValues
    }
    
    /**
     * Generate spectrum analysis with configurable resolution
     * @param {Uint8Array} frequencyData - Raw FFT data
     * @returns {Object} Spectrum analysis data
     */
    generateSpectrum(frequencyData) {
        const values = new Array(this.config.spectrumResolution)
        const frequencies = new Array(this.config.spectrumResolution)
        
        for (let i = 0; i < this.spectrumBins.length; i++) {
            const spectrumBin = this.spectrumBins[i]
            const rawValue = frequencyData[spectrumBin.bin] / 255
            
            // Apply smoothing to spectrum if enabled
            if (this.config.smoothingEnabled) {
                const currentSmoothed = this.smoothedSpectrum[i] || 0
                const factor = this.config.smoothingFactor
                this.smoothedSpectrum[i] = (factor * currentSmoothed) + ((1 - factor) * rawValue)
                values[i] = this.smoothedSpectrum[i]
            } else {
                values[i] = rawValue
            }
            
            frequencies[i] = spectrumBin.frequency
        }
        
        return { values, frequencies }
    }
    
    /**
     * Calculate additional frequency metrics
     * @param {Uint8Array} frequencyData - Raw FFT data
     * @param {Object} processedValues - Processed frequency values
     * @returns {Object} Frequency metrics
     */
    calculateFrequencyMetrics(frequencyData, processedValues) {
        // Calculate overall energy
        let totalEnergy = 0
        for (let i = 0; i < frequencyData.length; i++) {
            totalEnergy += frequencyData[i]
        }
        const overallAmplitude = (totalEnergy / frequencyData.length) / 255
        
        // Calculate spectral centroid (brightness)
        let weightedSum = 0
        let magnitudeSum = 0
        
        for (let i = 0; i < frequencyData.length; i++) {
            const frequency = i * this.binWidth
            const magnitude = frequencyData[i] / 255
            weightedSum += frequency * magnitude
            magnitudeSum += magnitude
        }
        
        const spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0
        
        // Calculate frequency distribution
        const bassEnergy = processedValues.bass || 0
        const midsEnergy = processedValues.mids || 0
        const trebleEnergy = processedValues.treble || 0
        const totalRangeEnergy = bassEnergy + midsEnergy + trebleEnergy
        
        const distribution = totalRangeEnergy > 0 ? {
            bass: bassEnergy / totalRangeEnergy,
            mids: midsEnergy / totalRangeEnergy,
            treble: trebleEnergy / totalRangeEnergy
        } : { bass: 0, mids: 0, treble: 0 }
        
        // Calculate dynamic range
        const maxValue = Math.max(...Object.values(processedValues))
        const minValue = Math.min(...Object.values(processedValues))
        const dynamicRange = maxValue - minValue
        
        return {
            overallAmplitude,
            spectralCentroid,
            distribution,
            dynamicRange,
            dominantRange: this.getDominantFrequencyRange(processedValues),
            energy: {
                total: totalEnergy,
                average: overallAmplitude,
                peak: maxValue
            }
        }
    }
    
    /**
     * Determine the dominant frequency range
     * @param {Object} values - Frequency range values
     * @returns {string} Dominant frequency range name
     */
    getDominantFrequencyRange(values) {
        let maxValue = 0
        let dominantRange = 'bass'
        
        for (const [rangeName, value] of Object.entries(values)) {
            if (value > maxValue) {
                maxValue = value
                dominantRange = rangeName
            }
        }
        
        return dominantRange
    }
    
    /**
     * Update frequency range configuration
     * @param {Object} newRanges - New frequency range configuration
     */
    updateFrequencyRanges(newRanges) {
        this.config.frequencyRanges = { ...this.config.frequencyRanges, ...newRanges }
        
        if (this.isInitialized) {
            this.calculateFrequencyBins()
            this.initializeSmoothing()
            this.initializeNormalization()
        }
    }
    
    /**
     * Update analysis configuration
     * @param {Object} newConfig - New configuration options
     */
    updateConfiguration(newConfig) {
        const oldResolution = this.config.spectrumResolution
        const oldLogScale = this.config.logScale
        
        this.config = { ...this.config, ...newConfig }
        
        // Recalculate if spectrum settings changed
        if (this.isInitialized && 
            (oldResolution !== this.config.spectrumResolution || 
             oldLogScale !== this.config.logScale)) {
            this.calculateSpectrumBins()
            this.smoothedSpectrum = new Array(this.config.spectrumResolution).fill(0)
        }
    }
    
    /**
     * Get current configuration
     * @returns {Object} Current configuration
     */
    getConfiguration() {
        return { ...this.config }
    }
    
    /**
     * Get frequency bin information
     * @returns {Object} Frequency bin mappings and metadata
     */
    getFrequencyBinInfo() {
        const info = {}
        
        for (const [rangeName, rangeData] of this.frequencyBins) {
            info[rangeName] = {
                minFrequency: rangeData.minFreq,
                maxFrequency: rangeData.maxFreq,
                binCount: rangeData.binCount,
                weight: rangeData.weight,
                bins: [...rangeData.bins]
            }
        }
        
        return {
            ranges: info,
            binWidth: this.binWidth,
            nyquistFrequency: this.nyquistFrequency,
            totalBins: this.bufferLength
        }
    }
    
    /**
     * Reset all smoothing and normalization state
     */
    reset() {
        this.initializeSmoothing()
        this.initializeNormalization()
        this.lastAnalysis = null
        this.analysisCache.clear()
    }
    
    /**
     * Get the last analysis result
     * @returns {Object|null} Last frequency analysis
     */
    getLastAnalysis() {
        return this.lastAnalysis
    }
}