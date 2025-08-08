/**
 * Audio Processing Web Worker
 * Handles heavy audio analysis computations off the main thread
 */

// Worker state
let isInitialized = false
let config = {
    fftSize: 2048,
    sampleRate: 44100,
    smoothingFactor: 0.7,
    frequencyRanges: {
        bass: { min: 20, max: 250, weight: 1.0 },
        mids: { min: 250, max: 4000, weight: 1.0 },
        treble: { min: 4000, max: 20000, weight: 1.0 }
    }
}

let frequencyBins = {
    bass: [],
    mids: [],
    treble: []
}

let smoothedValues = {
    bass: 0,
    mids: 0,
    treble: 0,
    overall: 0
}

let beatDetectionState = {
    energyHistory: [],
    beatHistory: [],
    lastBeatTime: 0,
    historySize: 43
}

// Performance tracking
let performanceStats = {
    processTime: 0,
    frameCount: 0,
    averageProcessTime: 0
}

/**
 * Initialize worker with configuration
 * @param {Object} workerConfig - Configuration object
 */
function initialize(workerConfig) {
    config = { ...config, ...workerConfig }
    calculateFrequencyBins()
    resetBeatDetection()
    isInitialized = true
    
    postMessage({
        type: 'initialized',
        success: true,
        config: config
    })
}

/**
 * Calculate frequency bin mappings for analysis ranges
 */
function calculateFrequencyBins() {
    const nyquist = config.sampleRate / 2
    const binCount = config.fftSize / 2
    const binWidth = nyquist / binCount
    
    // Clear existing bins
    frequencyBins.bass = []
    frequencyBins.mids = []
    frequencyBins.treble = []
    
    // Calculate bin indices for each frequency range
    for (let i = 0; i < binCount; i++) {
        const frequency = i * binWidth
        
        if (frequency >= config.frequencyRanges.bass.min && frequency <= config.frequencyRanges.bass.max) {
            frequencyBins.bass.push(i)
        }
        if (frequency >= config.frequencyRanges.mids.min && frequency <= config.frequencyRanges.mids.max) {
            frequencyBins.mids.push(i)
        }
        if (frequency >= config.frequencyRanges.treble.min && frequency <= config.frequencyRanges.treble.max) {
            frequencyBins.treble.push(i)
        }
    }
}

/**
 * Process frequency data and perform analysis
 * @param {Uint8Array} frequencyData - Raw frequency data from analyser
 * @param {Uint8Array} timeData - Time domain data
 * @returns {Object} Processed audio analysis
 */
function processAudioData(frequencyData, timeData) {
    const startTime = performance.now()
    
    // Calculate frequency range averages
    const bass = calculateFrequencyRangeAverage(frequencyData, 'bass')
    const mids = calculateFrequencyRangeAverage(frequencyData, 'mids')
    const treble = calculateFrequencyRangeAverage(frequencyData, 'treble')
    const overall = calculateOverallAmplitude(frequencyData)
    
    // Apply smoothing
    smoothedValues.bass = lerp(smoothedValues.bass, bass, 1 - config.smoothingFactor)
    smoothedValues.mids = lerp(smoothedValues.mids, mids, 1 - config.smoothingFactor)
    smoothedValues.treble = lerp(smoothedValues.treble, treble, 1 - config.smoothingFactor)
    smoothedValues.overall = lerp(smoothedValues.overall, overall, 1 - config.smoothingFactor)
    
    // Perform beat detection
    const beatData = detectBeat(frequencyData)
    
    // Calculate advanced spectrum analysis
    const spectrumAnalysis = analyzeSpectrum(frequencyData)
    
    // Update performance stats
    const processTime = performance.now() - startTime
    updatePerformanceStats(processTime)
    
    return {
        frequency: {
            bass: smoothedValues.bass,
            mids: smoothedValues.mids,
            treble: smoothedValues.treble,
            overall: smoothedValues.overall,
            raw: {
                bass: bass,
                mids: mids,
                treble: treble,
                overall: overall
            }
        },
        beat: beatData,
        spectrum: spectrumAnalysis,
        performance: {
            processTime: processTime,
            averageProcessTime: performanceStats.averageProcessTime
        },
        timestamp: performance.now()
    }
}

/**
 * Calculate average amplitude for a frequency range
 * @param {Uint8Array} frequencyData - Frequency data
 * @param {string} range - Range name ('bass', 'mids', 'treble')
 * @returns {number} Normalized average (0-1)
 */
function calculateFrequencyRangeAverage(frequencyData, range) {
    const bins = frequencyBins[range]
    if (!bins || bins.length === 0) return 0
    
    let sum = 0
    let weightedSum = 0
    const weight = config.frequencyRanges[range].weight
    
    for (const bin of bins) {
        if (bin < frequencyData.length) {
            sum += frequencyData[bin] * weight
            weightedSum += weight
        }
    }
    
    return weightedSum > 0 ? (sum / weightedSum) / 255 : 0
}

/**
 * Calculate overall amplitude across all frequencies
 * @param {Uint8Array} frequencyData - Frequency data
 * @returns {number} Normalized overall amplitude (0-1)
 */
function calculateOverallAmplitude(frequencyData) {
    let sum = 0
    for (let i = 0; i < frequencyData.length; i++) {
        sum += frequencyData[i]
    }
    return (sum / frequencyData.length) / 255
}

/**
 * Detect beats in audio data
 * @param {Uint8Array} frequencyData - Frequency data
 * @returns {Object} Beat detection results
 */
function detectBeat(frequencyData) {
    const currentTime = performance.now()
    const energy = calculateInstantEnergy(frequencyData)
    
    // Add to energy history
    beatDetectionState.energyHistory.push(energy)
    if (beatDetectionState.energyHistory.length > beatDetectionState.historySize) {
        beatDetectionState.energyHistory.shift()
    }
    
    // Calculate average energy and variance
    const avgEnergy = beatDetectionState.energyHistory.reduce((a, b) => a + b, 0) / beatDetectionState.energyHistory.length
    const variance = calculateVariance(beatDetectionState.energyHistory, avgEnergy)
    
    // Beat detection algorithm
    const threshold = 1.5 * variance
    const minBeatInterval = 300 // ms
    const minimumEnergy = 0.1
    
    const isBeat = energy > (avgEnergy + threshold) && 
                  energy > minimumEnergy &&
                  (currentTime - beatDetectionState.lastBeatTime) > minBeatInterval
    
    let beatStrength = 0
    if (isBeat) {
        beatDetectionState.lastBeatTime = currentTime
        beatStrength = Math.min((energy - avgEnergy) / threshold, 2.0)
        
        beatDetectionState.beatHistory.push({
            time: currentTime,
            energy: energy,
            strength: beatStrength
        })
        
        // Limit beat history size
        if (beatDetectionState.beatHistory.length > 10) {
            beatDetectionState.beatHistory.shift()
        }
    }
    
    return {
        isBeat,
        energy,
        avgEnergy,
        strength: beatStrength,
        bpm: calculateBPM(),
        confidence: calculateBeatConfidence(energy, avgEnergy, variance)
    }
}

/**
 * Calculate instant energy for beat detection
 * @param {Uint8Array} frequencyData - Frequency data
 * @returns {number} Instant energy value
 */
function calculateInstantEnergy(frequencyData) {
    let energy = 0
    const bassRange = Math.floor(frequencyData.length * 0.1) // First 10% of spectrum
    
    for (let i = 0; i < bassRange; i++) {
        energy += frequencyData[i] * frequencyData[i]
    }
    
    return Math.sqrt(energy / bassRange) / 255
}

/**
 * Calculate variance of energy history
 * @param {Array} history - Energy history array
 * @param {number} mean - Mean energy value
 * @returns {number} Variance
 */
function calculateVariance(history, mean) {
    if (history.length < 2) return 0
    
    const variance = history.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / history.length
    return Math.sqrt(variance)
}

/**
 * Calculate BPM from beat history
 * @returns {number} Estimated BPM
 */
function calculateBPM() {
    if (beatDetectionState.beatHistory.length < 3) return 0
    
    const recentBeats = beatDetectionState.beatHistory.slice(-5)
    const intervals = []
    
    for (let i = 1; i < recentBeats.length; i++) {
        intervals.push(recentBeats[i].time - recentBeats[i-1].time)
    }
    
    if (intervals.length === 0) return 0
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    return Math.round(60000 / avgInterval) // Convert to BPM
}

/**
 * Calculate beat detection confidence
 * @param {number} energy - Current energy
 * @param {number} avgEnergy - Average energy
 * @param {number} variance - Energy variance
 * @returns {number} Confidence score (0-1)
 */
function calculateBeatConfidence(energy, avgEnergy, variance) {
    if (variance === 0) return 0
    
    const energyRatio = energy / (avgEnergy + variance)
    const historyLength = beatDetectionState.energyHistory.length
    const historyConfidence = Math.min(historyLength / beatDetectionState.historySize, 1)
    
    return Math.min(energyRatio * historyConfidence, 1)
}

/**
 * Analyze frequency spectrum for advanced features
 * @param {Uint8Array} frequencyData - Frequency data
 * @returns {Object} Spectrum analysis results
 */
function analyzeSpectrum(frequencyData) {
    // Calculate spectral centroid (brightness)
    let weightedSum = 0
    let magnitudeSum = 0
    
    for (let i = 0; i < frequencyData.length; i++) {
        const magnitude = frequencyData[i] / 255
        weightedSum += i * magnitude
        magnitudeSum += magnitude
    }
    
    const spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0
    
    // Calculate spectral rolloff (90% of energy)
    let cumulativeEnergy = 0
    const totalEnergy = frequencyData.reduce((sum, val) => sum + (val * val), 0)
    const rolloffThreshold = totalEnergy * 0.9
    
    let spectralRolloff = 0
    for (let i = 0; i < frequencyData.length; i++) {
        cumulativeEnergy += frequencyData[i] * frequencyData[i]
        if (cumulativeEnergy >= rolloffThreshold) {
            spectralRolloff = i
            break
        }
    }
    
    // Calculate spectral flux (rate of change)
    const spectralFlux = calculateSpectralFlux(frequencyData)
    
    // Find dominant frequency
    let maxMagnitude = 0
    let dominantFrequency = 0
    for (let i = 0; i < frequencyData.length; i++) {
        if (frequencyData[i] > maxMagnitude) {
            maxMagnitude = frequencyData[i]
            dominantFrequency = i
        }
    }
    
    return {
        spectralCentroid: spectralCentroid / frequencyData.length, // Normalize
        spectralRolloff: spectralRolloff / frequencyData.length, // Normalize
        spectralFlux,
        dominantFrequency,
        brightness: spectralCentroid / frequencyData.length,
        harmonicity: calculateHarmonicity(frequencyData)
    }
}

/**
 * Calculate spectral flux (rate of spectral change)
 * @param {Uint8Array} frequencyData - Current frequency data
 * @returns {number} Spectral flux value
 */
function calculateSpectralFlux(frequencyData) {
    // This would require storing previous frame data
    // For now, return a simplified measure based on high-frequency content
    let highFreqEnergy = 0
    const startBin = Math.floor(frequencyData.length * 0.7) // Top 30% of spectrum
    
    for (let i = startBin; i < frequencyData.length; i++) {
        highFreqEnergy += frequencyData[i]
    }
    
    return (highFreqEnergy / (frequencyData.length - startBin)) / 255
}

/**
 * Calculate harmonicity (presence of harmonic structure)
 * @param {Uint8Array} frequencyData - Frequency data
 * @returns {number} Harmonicity measure (0-1)
 */
function calculateHarmonicity(frequencyData) {
    // Simplified harmonicity calculation
    // Look for peaks at harmonic intervals
    let harmonicStrength = 0
    const fundamentalBin = 10 // Approximate fundamental frequency bin
    
    for (let harmonic = 2; harmonic <= 8; harmonic++) {
        const harmonicBin = fundamentalBin * harmonic
        if (harmonicBin < frequencyData.length) {
            harmonicStrength += frequencyData[harmonicBin] / 255
        }
    }
    
    return harmonicStrength / 7 // Average across harmonics
}

/**
 * Reset beat detection state
 */
function resetBeatDetection() {
    beatDetectionState.energyHistory = []
    beatDetectionState.beatHistory = []
    beatDetectionState.lastBeatTime = 0
}

/**
 * Update performance statistics
 * @param {number} processTime - Processing time in ms
 */
function updatePerformanceStats(processTime) {
    performanceStats.processTime = processTime
    performanceStats.frameCount++
    
    // Calculate running average
    const alpha = 0.1
    performanceStats.averageProcessTime = 
        (1 - alpha) * performanceStats.averageProcessTime + 
        alpha * processTime
}

/**
 * Linear interpolation utility
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
function lerp(a, b, t) {
    return a + (b - a) * t
}

/**
 * Update worker configuration
 * @param {Object} newConfig - New configuration values
 */
function updateConfig(newConfig) {
    config = { ...config, ...newConfig }
    calculateFrequencyBins()
    
    postMessage({
        type: 'configUpdated',
        config: config
    })
}

/**
 * Get current performance statistics
 * @returns {Object} Performance stats
 */
function getPerformanceStats() {
    return {
        ...performanceStats,
        isInitialized,
        configuredRanges: Object.keys(frequencyBins).map(range => ({
            range,
            binCount: frequencyBins[range].length
        }))
    }
}

// Message handler
self.onmessage = function(e) {
    const { type, data } = e.data
    
    try {
        switch (type) {
            case 'initialize':
                initialize(data)
                break
                
            case 'process':
                if (!isInitialized) {
                    postMessage({
                        type: 'error',
                        error: 'Worker not initialized'
                    })
                    return
                }
                
                const result = processAudioData(data.frequencyData, data.timeData)
                postMessage({
                    type: 'processed',
                    data: result
                })
                break
                
            case 'updateConfig':
                updateConfig(data)
                break
                
            case 'getStats':
                postMessage({
                    type: 'stats',
                    data: getPerformanceStats()
                })
                break
                
            case 'reset':
                resetBeatDetection()
                performanceStats = {
                    processTime: 0,
                    frameCount: 0,
                    averageProcessTime: 0
                }
                postMessage({
                    type: 'reset',
                    success: true
                })
                break
                
            default:
                postMessage({
                    type: 'error',
                    error: `Unknown message type: ${type}`
                })
        }
    } catch (error) {
        postMessage({
            type: 'error',
            error: error.message,
            stack: error.stack
        })
    }
}