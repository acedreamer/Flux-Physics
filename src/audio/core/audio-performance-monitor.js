/**
 * AudioPerformanceMonitor - Performance monitoring and optimization for audio processing
 * Tracks analysis timing, identifies bottlenecks, and implements adaptive quality reduction
 */
export class AudioPerformanceMonitor {
    constructor(options = {}) {
        this.config = {
            targetAnalysisTime: options.targetAnalysisTime || 2, // ms
            maxAnalysisTime: options.maxAnalysisTime || 5, // ms
            performanceWarningThreshold: options.performanceWarningThreshold || 10,
            adaptiveQualityEnabled: options.adaptiveQualityEnabled !== false,
            benchmarkDuration: options.benchmarkDuration || 5000, // ms
            sampleSize: options.sampleSize || 100
        }
        
        // Performance tracking
        this.stats = {
            analysisTime: 0,
            maxAnalysisTime: 0,
            minAnalysisTime: Infinity,
            averageAnalysisTime: 0,
            frameCount: 0,
            performanceWarnings: 0,
            adaptiveReductions: 0,
            lastReductionTime: 0
        }
        
        // Performance history for trend analysis
        this.performanceHistory = []
        this.recentSamples = []
        
        // Bottleneck tracking
        this.bottlenecks = {
            fftProcessing: 0,
            frequencyBinning: 0,
            beatDetection: 0,
            effectProcessing: 0,
            rendering: 0
        }
        
        // Adaptive quality settings
        this.qualitySettings = {
            fftSize: 2048,
            smoothingTimeConstant: 0.8,
            spectrumResolution: 256,
            beatDetectionEnabled: true,
            advancedAnalysisEnabled: true,
            effectComplexity: 1.0
        }
        
        // Original quality settings for restoration
        this.originalQualitySettings = { ...this.qualitySettings }
        
        // Performance callbacks
        this.callbacks = {
            onPerformanceWarning: null,
            onQualityReduction: null,
            onQualityRestoration: null,
            onBottleneckDetected: null
        }
        
        // Benchmark state
        this.benchmarkState = {
            isRunning: false,
            startTime: 0,
            samples: [],
            results: null
        }
    }
    
    /**
     * Start performance monitoring
     */
    start() {
        this.resetStats()
        console.log('AudioPerformanceMonitor started')
    }
    
    /**
     * Stop performance monitoring
     */
    stop() {
        console.log('AudioPerformanceMonitor stopped')
        this.logPerformanceSummary()
    }
    
    /**
     * Measure and record analysis performance
     * @param {Function} analysisFunction - Function to measure
     * @param {string} category - Performance category for bottleneck tracking
     * @returns {*} Result of the analysis function
     */
    measureAnalysis(analysisFunction, category = 'general') {
        const startTime = performance.now()
        
        let result
        try {
            result = analysisFunction()
        } catch (error) {
            console.error(`Analysis error in ${category}:`, error)
            throw error
        }
        
        const endTime = performance.now()
        const analysisTime = endTime - startTime
        
        // Update category-specific bottleneck tracking
        if (this.bottlenecks.hasOwnProperty(category)) {
            this.bottlenecks[category] = this.lerp(this.bottlenecks[category], analysisTime, 0.1)
        }
        
        // Update overall performance stats
        this.updatePerformanceStats(analysisTime)
        
        // Check for performance issues
        this.checkPerformanceThresholds(analysisTime, category)
        
        return result
    }
    
    /**
     * Update performance statistics
     * @param {number} analysisTime - Time taken for analysis in ms
     */
    updatePerformanceStats(analysisTime) {
        this.stats.analysisTime = analysisTime
        this.stats.frameCount++
        
        // Update min/max
        this.stats.maxAnalysisTime = Math.max(this.stats.maxAnalysisTime, analysisTime)
        this.stats.minAnalysisTime = Math.min(this.stats.minAnalysisTime, analysisTime)
        
        // Update running average
        const alpha = 0.1 // Smoothing factor
        this.stats.averageAnalysisTime = 
            (1 - alpha) * this.stats.averageAnalysisTime + 
            alpha * analysisTime
        
        // Add to recent samples for trend analysis
        this.recentSamples.push({
            time: performance.now(),
            analysisTime: analysisTime
        })
        
        // Keep only recent samples
        if (this.recentSamples.length > this.config.sampleSize) {
            this.recentSamples.shift()
        }
        
        // Add to performance history periodically
        if (this.stats.frameCount % 60 === 0) { // Every ~1 second at 60fps
            this.performanceHistory.push({
                timestamp: performance.now(),
                averageTime: this.stats.averageAnalysisTime,
                maxTime: this.stats.maxAnalysisTime,
                frameCount: this.stats.frameCount,
                qualityLevel: this.getCurrentQualityLevel()
            })
            
            // Limit history size
            if (this.performanceHistory.length > 300) { // ~5 minutes of history
                this.performanceHistory.shift()
            }
        }
    }
    
    /**
     * Check performance thresholds and trigger warnings/adaptations
     * @param {number} analysisTime - Current analysis time
     * @param {string} category - Performance category
     */
    checkPerformanceThresholds(analysisTime, category) {
        // Check for performance warnings
        if (analysisTime > this.config.targetAnalysisTime) {
            this.stats.performanceWarnings++
            
            if (this.callbacks.onPerformanceWarning) {
                this.callbacks.onPerformanceWarning({
                    analysisTime,
                    category,
                    threshold: this.config.targetAnalysisTime,
                    warningCount: this.stats.performanceWarnings
                })
            }
            
            // Trigger adaptive quality reduction if enabled
            if (this.config.adaptiveQualityEnabled && 
                analysisTime > this.config.maxAnalysisTime &&
                this.shouldReduceQuality()) {
                this.reduceQuality()
            }
        }
        
        // Check for bottlenecks
        if (analysisTime > this.config.maxAnalysisTime) {
            this.detectBottleneck(category, analysisTime)
        }
    }
    
    /**
     * Determine if quality should be reduced
     * @returns {boolean} Whether to reduce quality
     */
    shouldReduceQuality() {
        const now = performance.now()
        const timeSinceLastReduction = now - this.stats.lastReductionTime
        const minReductionInterval = 2000 // 2 seconds
        
        // Don't reduce too frequently
        if (timeSinceLastReduction < minReductionInterval) {
            return false
        }
        
        // Check if recent performance is consistently poor
        const recentPoorPerformance = this.recentSamples
            .slice(-10) // Last 10 samples
            .filter(sample => sample.analysisTime > this.config.maxAnalysisTime)
            .length
        
        return recentPoorPerformance >= 7 // 70% of recent samples are poor
    }
    
    /**
     * Reduce audio processing quality to improve performance
     */
    reduceQuality() {
        const currentLevel = this.getCurrentQualityLevel()
        
        if (currentLevel <= 0.2) {
            console.warn('Audio quality already at minimum level')
            return
        }
        
        // Reduce quality in stages
        if (currentLevel > 0.8) {
            // Stage 1: Reduce FFT size and spectrum resolution
            this.qualitySettings.fftSize = Math.max(1024, this.qualitySettings.fftSize / 2)
            this.qualitySettings.spectrumResolution = Math.max(128, this.qualitySettings.spectrumResolution / 2)
        } else if (currentLevel > 0.6) {
            // Stage 2: Reduce smoothing and effect complexity
            this.qualitySettings.smoothingTimeConstant = Math.max(0.5, this.qualitySettings.smoothingTimeConstant - 0.2)
            this.qualitySettings.effectComplexity = Math.max(0.5, this.qualitySettings.effectComplexity - 0.2)
        } else if (currentLevel > 0.4) {
            // Stage 3: Disable advanced analysis
            this.qualitySettings.advancedAnalysisEnabled = false
            this.qualitySettings.effectComplexity = Math.max(0.3, this.qualitySettings.effectComplexity - 0.2)
        } else {
            // Stage 4: Disable beat detection
            this.qualitySettings.beatDetectionEnabled = false
            this.qualitySettings.effectComplexity = 0.2
        }
        
        this.stats.adaptiveReductions++
        this.stats.lastReductionTime = performance.now()
        
        console.warn(`Audio quality reduced to level ${this.getCurrentQualityLevel().toFixed(2)}`)
        
        if (this.callbacks.onQualityReduction) {
            this.callbacks.onQualityReduction({
                newLevel: this.getCurrentQualityLevel(),
                settings: { ...this.qualitySettings },
                reductionCount: this.stats.adaptiveReductions
            })
        }
    }
    
    /**
     * Restore audio processing quality when performance improves
     */
    restoreQuality() {
        // Check if performance has been good recently
        const recentGoodPerformance = this.recentSamples
            .slice(-20) // Last 20 samples
            .filter(sample => sample.analysisTime < this.config.targetAnalysisTime)
            .length
        
        if (recentGoodPerformance < 18) { // 90% of recent samples are good
            return false
        }
        
        const currentLevel = this.getCurrentQualityLevel()
        
        if (currentLevel >= 1.0) {
            return false // Already at full quality
        }
        
        // Restore quality gradually
        if (currentLevel < 0.4) {
            // Restore beat detection
            this.qualitySettings.beatDetectionEnabled = true
        } else if (currentLevel < 0.6) {
            // Restore advanced analysis
            this.qualitySettings.advancedAnalysisEnabled = true
            this.qualitySettings.effectComplexity = Math.min(1.0, this.qualitySettings.effectComplexity + 0.2)
        } else if (currentLevel < 0.8) {
            // Restore smoothing and effect complexity
            this.qualitySettings.smoothingTimeConstant = Math.min(
                this.originalQualitySettings.smoothingTimeConstant,
                this.qualitySettings.smoothingTimeConstant + 0.2
            )
            this.qualitySettings.effectComplexity = Math.min(1.0, this.qualitySettings.effectComplexity + 0.2)
        } else {
            // Restore FFT size and spectrum resolution
            this.qualitySettings.fftSize = Math.min(
                this.originalQualitySettings.fftSize,
                this.qualitySettings.fftSize * 2
            )
            this.qualitySettings.spectrumResolution = Math.min(
                this.originalQualitySettings.spectrumResolution,
                this.qualitySettings.spectrumResolution * 2
            )
        }
        
        console.log(`Audio quality restored to level ${this.getCurrentQualityLevel().toFixed(2)}`)
        
        if (this.callbacks.onQualityRestoration) {
            this.callbacks.onQualityRestoration({
                newLevel: this.getCurrentQualityLevel(),
                settings: { ...this.qualitySettings }
            })
        }
        
        return true
    }
    
    /**
     * Detect performance bottlenecks
     * @param {string} category - Performance category
     * @param {number} analysisTime - Analysis time for this category
     */
    detectBottleneck(category, analysisTime) {
        const bottleneckThreshold = this.config.maxAnalysisTime * 0.7
        
        if (analysisTime > bottleneckThreshold) {
            console.warn(`Performance bottleneck detected in ${category}: ${analysisTime.toFixed(2)}ms`)
            
            if (this.callbacks.onBottleneckDetected) {
                this.callbacks.onBottleneckDetected({
                    category,
                    analysisTime,
                    threshold: bottleneckThreshold,
                    bottleneckStats: { ...this.bottlenecks }
                })
            }
        }
    }
    
    /**
     * Get current quality level as a percentage
     * @returns {number} Quality level (0-1)
     */
    getCurrentQualityLevel() {
        let qualityScore = 0
        
        // FFT size contribution (30%)
        qualityScore += 0.3 * (this.qualitySettings.fftSize / this.originalQualitySettings.fftSize)
        
        // Spectrum resolution contribution (20%)
        qualityScore += 0.2 * (this.qualitySettings.spectrumResolution / this.originalQualitySettings.spectrumResolution)
        
        // Smoothing contribution (15%)
        qualityScore += 0.15 * (this.qualitySettings.smoothingTimeConstant / this.originalQualitySettings.smoothingTimeConstant)
        
        // Effect complexity contribution (20%)
        qualityScore += 0.2 * this.qualitySettings.effectComplexity
        
        // Feature flags contribution (15%)
        let featureScore = 0
        if (this.qualitySettings.beatDetectionEnabled) featureScore += 0.5
        if (this.qualitySettings.advancedAnalysisEnabled) featureScore += 0.5
        qualityScore += 0.15 * featureScore
        
        return Math.max(0, Math.min(1, qualityScore))
    }
    
    /**
     * Run performance benchmark
     * @param {Function} testFunction - Function to benchmark
     * @returns {Promise<Object>} Benchmark results
     */
    async runBenchmark(testFunction) {
        if (this.benchmarkState.isRunning) {
            throw new Error('Benchmark already running')
        }
        
        this.benchmarkState.isRunning = true
        this.benchmarkState.startTime = performance.now()
        this.benchmarkState.samples = []
        
        console.log(`Starting audio performance benchmark for ${this.config.benchmarkDuration}ms`)
        
        return new Promise((resolve) => {
            const benchmarkInterval = setInterval(() => {
                const startTime = performance.now()
                testFunction()
                const endTime = performance.now()
                
                this.benchmarkState.samples.push(endTime - startTime)
                
                // Check if benchmark duration reached
                if (endTime - this.benchmarkState.startTime >= this.config.benchmarkDuration) {
                    clearInterval(benchmarkInterval)
                    
                    const results = this.calculateBenchmarkResults()
                    this.benchmarkState.isRunning = false
                    this.benchmarkState.results = results
                    
                    console.log('Audio performance benchmark completed:', results)
                    resolve(results)
                }
            }, 16) // ~60fps
        })
    }
    
    /**
     * Calculate benchmark results
     * @returns {Object} Benchmark statistics
     */
    calculateBenchmarkResults() {
        const samples = this.benchmarkState.samples
        
        if (samples.length === 0) {
            return null
        }
        
        const sorted = [...samples].sort((a, b) => a - b)
        const sum = samples.reduce((a, b) => a + b, 0)
        
        return {
            sampleCount: samples.length,
            duration: performance.now() - this.benchmarkState.startTime,
            average: sum / samples.length,
            median: sorted[Math.floor(sorted.length / 2)],
            min: sorted[0],
            max: sorted[sorted.length - 1],
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)],
            standardDeviation: this.calculateStandardDeviation(samples, sum / samples.length),
            targetMet: (sum / samples.length) < this.config.targetAnalysisTime,
            qualityLevel: this.getCurrentQualityLevel()
        }
    }
    
    /**
     * Calculate standard deviation
     * @param {Array} samples - Sample data
     * @param {number} mean - Mean value
     * @returns {number} Standard deviation
     */
    calculateStandardDeviation(samples, mean) {
        const variance = samples.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / samples.length
        return Math.sqrt(variance)
    }
    
    /**
     * Get performance trend analysis
     * @returns {Object} Trend analysis results
     */
    getPerformanceTrend() {
        if (this.performanceHistory.length < 10) {
            return { 
                trend: 'insufficient_data', 
                confidence: 0,
                changePercent: 0,
                recentAverage: 0,
                olderAverage: 0
            }
        }
        
        const recent = this.performanceHistory.slice(-10)
        const older = this.performanceHistory.slice(-20, -10)
        
        if (older.length === 0) {
            return { 
                trend: 'insufficient_data', 
                confidence: 0,
                changePercent: 0,
                recentAverage: 0,
                olderAverage: 0
            }
        }
        
        const recentAvg = recent.reduce((sum, item) => sum + item.averageTime, 0) / recent.length
        const olderAvg = older.reduce((sum, item) => sum + item.averageTime, 0) / older.length
        
        const change = recentAvg - olderAvg
        const changePercent = olderAvg > 0 ? (change / olderAvg) * 100 : 0
        
        let trend = 'stable'
        if (changePercent > 10) trend = 'degrading'
        else if (changePercent < -10) trend = 'improving'
        
        return {
            trend,
            changePercent,
            recentAverage: recentAvg,
            olderAverage: olderAvg,
            confidence: Math.min(this.performanceHistory.length / 50, 1)
        }
    }
    
    /**
     * Reset performance statistics
     */
    resetStats() {
        this.stats = {
            analysisTime: 0,
            maxAnalysisTime: 0,
            minAnalysisTime: Infinity,
            averageAnalysisTime: 0,
            frameCount: 0,
            performanceWarnings: 0,
            adaptiveReductions: 0,
            lastReductionTime: 0
        }
        
        this.performanceHistory = []
        this.recentSamples = []
        
        // Reset bottleneck tracking
        Object.keys(this.bottlenecks).forEach(key => {
            this.bottlenecks[key] = 0
        })
    }
    
    /**
     * Log performance summary
     */
    logPerformanceSummary() {
        const trend = this.getPerformanceTrend()
        
        console.log('=== Audio Performance Summary ===')
        console.log(`Frames processed: ${this.stats.frameCount}`)
        console.log(`Average analysis time: ${this.stats.averageAnalysisTime.toFixed(2)}ms`)
        console.log(`Max analysis time: ${this.stats.maxAnalysisTime.toFixed(2)}ms`)
        console.log(`Min analysis time: ${this.stats.minAnalysisTime === Infinity ? 'N/A' : this.stats.minAnalysisTime.toFixed(2)}ms`)
        console.log(`Performance warnings: ${this.stats.performanceWarnings}`)
        console.log(`Adaptive reductions: ${this.stats.adaptiveReductions}`)
        console.log(`Current quality level: ${(this.getCurrentQualityLevel() * 100).toFixed(1)}%`)
        console.log(`Performance trend: ${trend.trend} (${trend.changePercent.toFixed(1)}%)`)
        console.log('Bottlenecks:', this.bottlenecks)
    }
    
    /**
     * Get current performance statistics
     * @returns {Object} Complete performance data
     */
    getPerformanceStats() {
        return {
            stats: { ...this.stats },
            bottlenecks: { ...this.bottlenecks },
            qualitySettings: { ...this.qualitySettings },
            qualityLevel: this.getCurrentQualityLevel(),
            trend: this.getPerformanceTrend(),
            benchmarkResults: this.benchmarkState.results
        }
    }
    
    /**
     * Set performance callbacks
     * @param {Object} callbacks - Callback functions
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks }
    }
    
    /**
     * Linear interpolation utility
     * @param {number} a - Start value
     * @param {number} b - End value
     * @param {number} t - Interpolation factor (0-1)
     * @returns {number} Interpolated value
     */
    lerp(a, b, t) {
        return a + (b - a) * t
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        this.stop()
        this.callbacks = {}
        this.performanceHistory = []
        this.recentSamples = []
        this.benchmarkState.isRunning = false
    }
}