/**
 * Real-time beat detection system using energy-based algorithm
 * Analyzes audio frequency data to detect beats and calculate BPM
 */
class BeatDetector {
    constructor(audioAnalyzer, options = {}) {
        this.audioAnalyzer = audioAnalyzer
        this.beatHistory = []
        this.energyHistory = []
        this.lastBeatTime = 0
        
        // Configurable thresholds and sensitivity
        this.config = {
            beatThreshold: options.beatThreshold || 1.3,
            minBeatInterval: options.minBeatInterval || 300, // ms
            historySize: options.historySize || 43, // ~1 second at 43fps analysis
            varianceMultiplier: options.varianceMultiplier || 1.0, // Reduced for easier detection
            minimumEnergy: options.minimumEnergy || 0.03, // Reduced threshold
            sensitivity: options.sensitivity || 1.0,
            maxBeatHistory: options.maxBeatHistory || 10
        }
        
        // Performance tracking
        this.lastAnalysisTime = 0
        this.analysisCount = 0
    }
    
    /**
     * Main beat detection method
     * @param {Uint8Array} frequencyData - Raw frequency data from audio analyzer
     * @returns {Object} Beat detection results
     */
    detectBeat(frequencyData) {
        const currentTime = performance.now()
        const energy = this.calculateInstantEnergy(frequencyData)
        
        // Add to energy history for variance calculation
        this.energyHistory.push(energy)
        if (this.energyHistory.length > this.config.historySize) {
            this.energyHistory.shift()
        }
        
        // Need sufficient history for reliable detection
        if (this.energyHistory.length < 10) {
            return {
                isBeat: false,
                energy,
                avgEnergy: energy,
                strength: 0,
                confidence: 0,
                bpm: 0,
                variance: 0
            }
        }
        
        // Calculate statistical measures
        const avgEnergy = this.calculateAverage(this.energyHistory)
        const variance = this.calculateVariance(this.energyHistory, avgEnergy)
        
        // Dynamic threshold based on variance and sensitivity
        const varianceThreshold = this.config.varianceMultiplier * variance * this.config.sensitivity
        const energyThreshold = avgEnergy * (1 + this.config.sensitivity * 0.5)
        const threshold = Math.max(avgEnergy + varianceThreshold, energyThreshold)
        
        // Beat detection conditions
        const energyCondition = energy > threshold
        const minimumEnergyCondition = energy > this.config.minimumEnergy
        const timingCondition = (currentTime - this.lastBeatTime) > this.config.minBeatInterval
        
        const isBeat = energyCondition && minimumEnergyCondition && timingCondition
        
        let beatStrength = 0
        let confidence = 0
        
        if (isBeat) {
            // Calculate beat strength (0-2 range)
            const energyDiff = energy - avgEnergy
            const varianceOrMin = Math.max(variance, 0.01) // Prevent division by zero
            beatStrength = Math.min((energyDiff / varianceOrMin) * this.config.sensitivity, 2.0)
            
            // Calculate confidence based on how much energy exceeds threshold
            const thresholdDiff = energy - threshold
            confidence = Math.min(thresholdDiff / Math.max(avgEnergy, 0.01), 1.0)
            
            // Record beat in history
            this.recordBeat(currentTime, energy, beatStrength, confidence)
            this.lastBeatTime = currentTime
        }
        
        return {
            isBeat,
            energy,
            avgEnergy,
            strength: beatStrength,
            confidence,
            bpm: this.calculateBPM(),
            variance,
            threshold
        }
    }
    
    /**
     * Calculate instant energy focusing on bass frequencies for beat detection
     * @param {Uint8Array} frequencyData - Raw frequency data
     * @returns {number} Normalized energy value (0-1)
     */
    calculateInstantEnergy(frequencyData) {
        // Focus on bass and low-mid frequencies (first 20% of spectrum)
        const bassRange = Math.floor(frequencyData.length * 0.2)
        let energy = 0
        let weightedSum = 0
        let totalWeight = 0
        
        for (let i = 0; i < bassRange; i++) {
            // Weight lower frequencies more heavily for beat detection
            const weight = Math.max(1, bassRange - i)
            const value = frequencyData[i] / 255
            
            weightedSum += value * value * weight
            totalWeight += weight
        }
        
        return Math.sqrt(weightedSum / totalWeight)
    }
    
    /**
     * Record a detected beat in history
     * @param {number} time - Timestamp of beat
     * @param {number} energy - Energy level at beat
     * @param {number} strength - Beat strength
     * @param {number} confidence - Detection confidence
     */
    recordBeat(time, energy, strength, confidence) {
        this.beatHistory.push({
            time,
            energy,
            strength,
            confidence,
            interval: this.beatHistory.length > 0 ? 
                time - this.beatHistory[this.beatHistory.length - 1].time : 0
        })
        
        // Limit history size
        if (this.beatHistory.length > this.config.maxBeatHistory) {
            this.beatHistory.shift()
        }
    }
    
    /**
     * Calculate BPM from recent beat history
     * @returns {number} Estimated BPM
     */
    calculateBPM() {
        if (this.beatHistory.length < 3) return 0
        
        // Use recent beats for more accurate BPM
        const recentBeats = this.beatHistory.slice(-5)
        const intervals = []
        
        // Calculate intervals between beats
        for (let i = 1; i < recentBeats.length; i++) {
            const interval = recentBeats[i].time - recentBeats[i-1].time
            // Filter out unrealistic intervals (too fast or too slow)
            if (interval > 200 && interval < 2000) {
                intervals.push(interval)
            }
        }
        
        if (intervals.length === 0) return 0
        
        // Calculate weighted average (more recent intervals have higher weight)
        let weightedSum = 0
        let totalWeight = 0
        
        for (let i = 0; i < intervals.length; i++) {
            const weight = i + 1 // More recent = higher weight
            weightedSum += intervals[i] * weight
            totalWeight += weight
        }
        
        const avgInterval = weightedSum / totalWeight
        return Math.round(60000 / avgInterval) // Convert to BPM
    }
    
    /**
     * Calculate average of array values
     * @param {Array} values - Array of numbers
     * @returns {number} Average value
     */
    calculateAverage(values) {
        return values.reduce((sum, val) => sum + val, 0) / values.length
    }
    
    /**
     * Calculate variance of array values
     * @param {Array} values - Array of numbers
     * @param {number} mean - Pre-calculated mean
     * @returns {number} Variance
     */
    calculateVariance(values, mean) {
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
        return this.calculateAverage(squaredDiffs)
    }
    
    /**
     * Update configuration parameters
     * @param {Object} newConfig - New configuration values
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig }
    }
    
    /**
     * Reset beat detection state
     */
    reset() {
        this.beatHistory = []
        this.energyHistory = []
        this.lastBeatTime = 0
    }
    
    /**
     * Get current beat detection statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        return {
            beatCount: this.beatHistory.length,
            avgBeatStrength: this.beatHistory.length > 0 ? 
                this.calculateAverage(this.beatHistory.map(b => b.strength)) : 0,
            avgConfidence: this.beatHistory.length > 0 ?
                this.calculateAverage(this.beatHistory.map(b => b.confidence)) : 0,
            energyHistorySize: this.energyHistory.length,
            currentBPM: this.calculateBPM(),
            lastBeatTime: this.lastBeatTime,
            config: { ...this.config }
        }
    }
}

export default BeatDetector