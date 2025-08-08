import { FrequencyAnalyzer } from './frequency-analyzer.js'
import { AudioSourceManager } from './audio-source-manager.js'
import { AudioPerformanceMonitor } from './audio-performance-monitor.js'
import { AudioWorkerManager } from './audio-worker-manager.js'
import { FFTOptimizer } from './fft-optimizer.js'

/**
 * AudioAnalyzer - Core audio processing class for FLUX Audio Reactive Mode
 * Handles Web Audio API integration, microphone access, and frequency analysis
 */
export class AudioAnalyzer {
    constructor(options = {}) {
        this.audioContext = null
        this.analyserNode = null
        this.sourceManager = null
        this.frequencyData = null
        this.timeData = null
        this.isInitialized = false
        this.isAnalyzing = false
        this.currentSource = null
        
        // Analysis configuration
        this.config = {
            fftSize: options.fftSize || 2048,
            smoothingTimeConstant: options.smoothingTimeConstant || 0.8,
            minDecibels: options.minDecibels || -90,
            maxDecibels: options.maxDecibels || -10,
            sampleRate: options.sampleRate || 44100
        }
        
        // Initialize frequency analyzer
        this.frequencyAnalyzer = new FrequencyAnalyzer({
            fftSize: this.config.fftSize,
            smoothingTimeConstant: this.config.smoothingTimeConstant,
            sampleRate: this.config.sampleRate,
            frequencyRanges: options.frequencyRanges || {
                bass: { min: 20, max: 250, weight: 1.0 },
                mids: { min: 250, max: 4000, weight: 1.0 },
                treble: { min: 4000, max: 20000, weight: 1.0 }
            },
            smoothingEnabled: options.smoothingEnabled !== false,
            smoothingFactor: options.smoothingFactor || 0.7,
            normalizationEnabled: options.normalizationEnabled !== false,
            normalizationMethod: options.normalizationMethod || 'peak',
            spectrumResolution: options.spectrumResolution || 256,
            logScale: options.logScale !== false
        })
        
        // Initialize audio source manager
        this.sourceManager = new AudioSourceManager({
            reconnectDelay: options.reconnectDelay || 2000,
            maxReconnectAttempts: options.maxReconnectAttempts || 3,
            streamConstraints: options.streamConstraints
        })
        
        // Setup source manager callbacks
        this.sourceManager.setCallbacks({
            onSourceChange: (source, stream) => this.handleSourceChange(source, stream),
            onConnectionChange: (connected, source) => this.handleConnectionChange(connected, source),
            onError: (error) => this.handleSourceError(error),
            onReconnectAttempt: (attempt, max, delay) => this.handleReconnectAttempt(attempt, max, delay)
        })
        
        // Initialize performance monitoring
        this.performanceMonitor = new AudioPerformanceMonitor({
            targetAnalysisTime: options.targetAnalysisTime || 2,
            maxAnalysisTime: options.maxAnalysisTime || 5,
            adaptiveQualityEnabled: options.adaptiveQualityEnabled !== false
        })
        
        // Initialize Web Worker manager if enabled
        this.workerManager = null
        if (options.useWebWorker !== false) {
            this.workerManager = new AudioWorkerManager({
                workerEnabled: true,
                workerPath: options.workerPath || '/src/audio/audio-worker.js'
            })
        }
        
        // Initialize FFT optimizer
        this.fftOptimizer = new FFTOptimizer({
            fftSize: this.config.fftSize,
            sampleRate: this.config.sampleRate,
            windowFunction: options.windowFunction || 'hann'
        })
        
        // Performance monitoring callbacks
        this.performanceMonitor.setCallbacks({
            onPerformanceWarning: (warning) => this.handlePerformanceWarning(warning),
            onQualityReduction: (reduction) => this.handleQualityReduction(reduction),
            onQualityRestoration: (restoration) => this.handleQualityRestoration(restoration),
            onBottleneckDetected: (bottleneck) => this.handleBottleneckDetected(bottleneck)
        })
        
        // Event callbacks for external components
        this.callbacks = {
            onSourceChange: null,
            onConnectionChange: null,
            onError: null,
            onReconnectAttempt: null
        }
    }
    
    /**
     * Initialize the audio analyzer with specified input source
     * @param {string} inputSource - 'microphone' or 'system'
     * @returns {Promise<{success: boolean, error?: string, message?: string}>}
     */
    async initialize(inputSource = 'microphone') {
        try {
            // Start performance monitoring
            this.performanceMonitor.start()
            
            // Initialize Web Audio API context
            const contextResult = await this.initializeAudioContext()
            if (!contextResult.success) {
                return contextResult
            }
            
            // Initialize Web Worker if available
            if (this.workerManager) {
                const workerResult = await this.workerManager.initialize({
                    fftSize: this.config.fftSize,
                    sampleRate: this.config.sampleRate,
                    smoothingFactor: this.frequencyAnalyzer.config.smoothingFactor,
                    frequencyRanges: this.frequencyAnalyzer.config.frequencyRanges
                })
                
                if (!workerResult.success) {
                    console.warn('Web Worker initialization failed, continuing with main thread processing')
                }
            }
            
            // Initialize source manager
            const sourceManagerResult = await this.sourceManager.initialize(this.audioContext)
            if (!sourceManagerResult.success) {
                return sourceManagerResult
            }
            
            // Connect audio source
            const sourceResult = await this.sourceManager.connectSource(inputSource)
            if (!sourceResult.success) {
                return sourceResult
            }
            
            this.currentSource = sourceResult.source
            
            // Setup frequency analysis
            this.setupFrequencyAnalysis()
            
            // Initialize frequency analyzer
            this.frequencyAnalyzer.initialize(this.audioContext, this.analyserNode.frequencyBinCount)
            
            this.isInitialized = true
            return { 
                success: true,
                source: sourceResult.source,
                fallbackUsed: sourceResult.fallbackUsed,
                originalSource: sourceResult.originalSource,
                usingWebWorker: this.workerManager ? this.workerManager.isUsingWorker() : false
            }
            
        } catch (error) {
            return {
                success: false,
                error: 'INITIALIZATION_FAILED',
                message: `Audio analyzer initialization failed: ${error.message}`
            }
        }
    }
    
    /**
     * Initialize Web Audio API context with error handling
     * @returns {Promise<{success: boolean, error?: string, message?: string}>}
     */
    async initializeAudioContext() {
        try {
            // Create audio context with fallback for older browsers
            const AudioContextClass = window.AudioContext || window.webkitAudioContext
            
            if (!AudioContextClass) {
                return {
                    success: false,
                    error: 'WEB_AUDIO_UNSUPPORTED',
                    message: 'Web Audio API is not supported in this browser'
                }
            }
            
            this.audioContext = new AudioContextClass()
            
            // Handle suspended context (required by some browsers)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume()
            }
            
            return { success: true }
            
        } catch (error) {
            return {
                success: false,
                error: 'AUDIO_CONTEXT_FAILED',
                message: `Failed to create audio context: ${error.message}`
            }
        }
    }
    
    /**
     * Switch to a different audio source
     * @param {string} newSource - 'microphone' or 'system'
     * @param {Object} options - Switch options
     * @returns {Promise<{success: boolean, source?: string, error?: string, message?: string}>}
     */
    async switchSource(newSource, options = {}) {
        if (!this.isInitialized) {
            return {
                success: false,
                error: 'NOT_INITIALIZED',
                message: 'Audio analyzer must be initialized before switching sources'
            }
        }
        
        try {
            const result = await this.sourceManager.switchSource(newSource, options)
            
            if (result.success) {
                this.currentSource = result.source
                
                // Reconnect analyser to new source
                this.reconnectAnalyser()
            }
            
            return result
            
        } catch (error) {
            return {
                success: false,
                error: 'SWITCH_FAILED',
                message: `Failed to switch audio source: ${error.message}`
            }
        }
    }
    
    /**
     * Get supported audio sources
     * @returns {Array} Array of supported audio source types
     */
    getSupportedSources() {
        return this.sourceManager ? this.sourceManager.getSupportedSources() : []
    }
    
    /**
     * Get current connection status
     * @returns {Object} Connection status information
     */
    getConnectionStatus() {
        return this.sourceManager ? this.sourceManager.getConnectionStatus() : {
            isConnected: false,
            currentSource: null,
            capabilities: {},
            supportedSources: []
        }
    }
    
    /**
     * Handle source change from source manager
     * @param {string} source - New source type
     * @param {MediaStream} stream - New media stream
     */
    handleSourceChange(source, stream) {
        console.log(`Audio source changed to: ${source}`)
        
        if (this.callbacks.onSourceChange) {
            this.callbacks.onSourceChange(source, stream)
        }
    }
    
    /**
     * Handle connection change from source manager
     * @param {boolean} connected - Connection status
     * @param {string} source - Source type
     */
    handleConnectionChange(connected, source) {
        console.log(`Audio connection ${connected ? 'established' : 'lost'} for source: ${source}`)
        
        if (this.callbacks.onConnectionChange) {
            this.callbacks.onConnectionChange(connected, source)
        }
    }
    
    /**
     * Handle errors from source manager
     * @param {Object} error - Error information
     */
    handleSourceError(error) {
        console.error('Audio source error:', error)
        
        if (this.callbacks.onError) {
            this.callbacks.onError(error)
        }
    }
    
    /**
     * Handle reconnection attempts from source manager
     * @param {number} attempt - Current attempt number
     * @param {number} maxAttempts - Maximum attempts
     * @param {number} delay - Delay before next attempt
     */
    handleReconnectAttempt(attempt, maxAttempts, delay) {
        console.log(`Audio reconnection attempt ${attempt}/${maxAttempts} in ${delay}ms`)
        
        if (this.callbacks.onReconnectAttempt) {
            this.callbacks.onReconnectAttempt(attempt, maxAttempts, delay)
        }
    }
    
    /**
     * Reconnect analyser to current source
     */
    reconnectAnalyser() {
        if (!this.sourceManager || !this.analyserNode) {
            return
        }
        
        const sourceNode = this.sourceManager.getSourceNode()
        if (sourceNode) {
            // Disconnect previous connection
            if (this.analyserNode) {
                this.analyserNode.disconnect()
            }
            
            // Connect new source to analyser
            sourceNode.connect(this.analyserNode)
        }
    }
    
    /**
     * Setup frequency analysis with analyser node configuration
     */
    setupFrequencyAnalysis() {
        // Create analyser node
        this.analyserNode = this.audioContext.createAnalyser()
        this.analyserNode.fftSize = this.config.fftSize
        this.analyserNode.smoothingTimeConstant = this.config.smoothingTimeConstant
        this.analyserNode.minDecibels = this.config.minDecibels
        this.analyserNode.maxDecibels = this.config.maxDecibels
        
        // Connect source to analyser
        this.reconnectAnalyser()
        
        // Initialize data arrays
        const bufferLength = this.analyserNode.frequencyBinCount
        this.frequencyData = new Uint8Array(bufferLength)
        this.timeData = new Uint8Array(bufferLength)
    }
    
    /**
     * Update frequency analyzer configuration
     * @param {Object} config - New configuration options
     */
    updateFrequencyConfig(config) {
        if (this.frequencyAnalyzer) {
            this.frequencyAnalyzer.updateConfiguration(config)
        }
    }
    
    /**
     * Update frequency ranges
     * @param {Object} ranges - New frequency range configuration
     */
    updateFrequencyRanges(ranges) {
        if (this.frequencyAnalyzer) {
            this.frequencyAnalyzer.updateFrequencyRanges(ranges)
        }
    }
    
    /**
     * Get current frequency data with advanced analysis
     * @returns {Object} Comprehensive frequency analysis data
     */
    getFrequencyData() {
        if (!this.isInitialized || !this.analyserNode || !this.frequencyAnalyzer) {
            return this.getEmptyFrequencyData()
        }
        
        return this.performanceMonitor.measureAnalysis(() => {
            // Get frequency and time domain data
            this.analyserNode.getByteFrequencyData(this.frequencyData)
            this.analyserNode.getByteTimeDomainData(this.timeData)
            
            // Use Web Worker if available, otherwise process on main thread
            if (this.workerManager && this.workerManager.isUsingWorker()) {
                return this.getFrequencyDataWithWorker()
            } else {
                return this.getFrequencyDataMainThread()
            }
        }, 'frequencyAnalysis')
    }
    
    /**
     * Process frequency data using Web Worker
     * @returns {Promise<Object>} Frequency analysis results
     */
    async getFrequencyDataWithWorker() {
        try {
            const workerResult = await this.workerManager.processAudioData(
                this.frequencyData, 
                this.timeData
            )
            
            return {
                // Legacy compatibility
                bass: workerResult.frequency.bass,
                mids: workerResult.frequency.mids,
                treble: workerResult.frequency.treble,
                overall: workerResult.frequency.overall,
                spectrum: Array.from(this.frequencyData),
                timeData: Array.from(this.timeData),
                
                // Advanced analysis data
                advanced: {
                    bass: workerResult.frequency.bass,
                    mids: workerResult.frequency.mids,
                    treble: workerResult.frequency.treble,
                    spectrum: workerResult.spectrum,
                    beat: workerResult.beat
                },
                
                // Metadata
                timestamp: workerResult.timestamp,
                analysisTime: workerResult.performance.processTime,
                processedByWorker: true
            }
            
        } catch (error) {
            console.warn('Worker processing failed, falling back to main thread:', error)
            return this.getFrequencyDataMainThread()
        }
    }
    
    /**
     * Process frequency data on main thread
     * @returns {Object} Frequency analysis results
     */
    getFrequencyDataMainThread() {
        // Use FFT optimizer for improved performance
        const optimizedAnalysis = this.performanceMonitor.measureAnalysis(() => {
            return {
                bass: this.fftOptimizer.calculateOptimizedFrequencyRange(this.frequencyData, 'bass'),
                mids: this.fftOptimizer.calculateOptimizedFrequencyRange(this.frequencyData, 'mids'),
                treble: this.fftOptimizer.calculateOptimizedFrequencyRange(this.frequencyData, 'treble'),
                spectralFeatures: this.fftOptimizer.calculateSpectralFeatures(this.frequencyData)
            }
        }, 'fftProcessing')
        
        // Use advanced frequency analyzer for additional features
        const frequencyAnalysis = this.performanceMonitor.measureAnalysis(() => {
            return this.frequencyAnalyzer.analyzeFrequencies(this.frequencyData)
        }, 'advancedAnalysis')
        
        // Calculate overall amplitude
        const overall = optimizedAnalysis.spectralFeatures.totalEnergy || this.getOverallAmplitude()
        
        return {
            // Legacy compatibility
            bass: optimizedAnalysis.bass,
            mids: optimizedAnalysis.mids,
            treble: optimizedAnalysis.treble,
            overall,
            spectrum: Array.from(this.frequencyData),
            timeData: Array.from(this.timeData),
            
            // Advanced analysis data
            advanced: {
                ...frequencyAnalysis,
                spectralFeatures: optimizedAnalysis.spectralFeatures
            },
            
            // Metadata
            timestamp: performance.now(),
            analysisTime: this.performanceMonitor.stats.analysisTime,
            processedByWorker: false
        }
    }
    
    /**
     * Get frequency analyzer configuration
     * @returns {Object} Current frequency analyzer configuration
     */
    getFrequencyConfig() {
        return this.frequencyAnalyzer ? this.frequencyAnalyzer.getConfiguration() : null
    }
    
    /**
     * Get frequency bin information
     * @returns {Object} Frequency bin mappings and metadata
     */
    getFrequencyBinInfo() {
        return this.frequencyAnalyzer ? this.frequencyAnalyzer.getFrequencyBinInfo() : null
    }
    
    /**
     * Reset frequency analyzer state
     */
    resetFrequencyAnalysis() {
        if (this.frequencyAnalyzer) {
            this.frequencyAnalyzer.reset()
        }
    }
    
    /**
     * Calculate overall amplitude across all frequencies
     * @returns {number} Normalized overall amplitude (0-1)
     */
    getOverallAmplitude() {
        let sum = 0
        for (let i = 0; i < this.frequencyData.length; i++) {
            sum += this.frequencyData[i]
        }
        
        return (sum / this.frequencyData.length) / 255 // Normalize to 0-1
    }
    
    /**
     * Get empty frequency data for when audio is not available
     * @returns {Object} Empty frequency data structure
     */
    getEmptyFrequencyData() {
        return {
            bass: 0,
            mids: 0,
            treble: 0,
            overall: 0,
            spectrum: new Array(1024).fill(0),
            timeData: new Array(1024).fill(128),
            timestamp: performance.now(),
            analysisTime: 0
        }
    }
    
    /**
     * Handle performance warning from monitor
     * @param {Object} warning - Performance warning details
     */
    handlePerformanceWarning(warning) {
        console.warn(`Audio performance warning: ${warning.category} took ${warning.analysisTime.toFixed(2)}ms`)
        
        if (this.callbacks.onPerformanceWarning) {
            this.callbacks.onPerformanceWarning(warning)
        }
    }
    
    /**
     * Handle quality reduction from monitor
     * @param {Object} reduction - Quality reduction details
     */
    handleQualityReduction(reduction) {
        console.log(`Audio quality reduced to ${(reduction.newLevel * 100).toFixed(1)}%`)
        
        // Apply quality settings to components
        this.applyQualitySettings(reduction.settings)
        
        if (this.callbacks.onQualityReduction) {
            this.callbacks.onQualityReduction(reduction)
        }
    }
    
    /**
     * Handle quality restoration from monitor
     * @param {Object} restoration - Quality restoration details
     */
    handleQualityRestoration(restoration) {
        console.log(`Audio quality restored to ${(restoration.newLevel * 100).toFixed(1)}%`)
        
        // Apply quality settings to components
        this.applyQualitySettings(restoration.settings)
        
        if (this.callbacks.onQualityRestoration) {
            this.callbacks.onQualityRestoration(restoration)
        }
    }
    
    /**
     * Handle bottleneck detection from monitor
     * @param {Object} bottleneck - Bottleneck details
     */
    handleBottleneckDetected(bottleneck) {
        console.warn(`Performance bottleneck detected in ${bottleneck.category}: ${bottleneck.analysisTime.toFixed(2)}ms`)
        
        if (this.callbacks.onBottleneckDetected) {
            this.callbacks.onBottleneckDetected(bottleneck)
        }
    }
    
    /**
     * Apply quality settings to audio components
     * @param {Object} settings - Quality settings
     */
    applyQualitySettings(settings) {
        // Update analyser node settings
        if (this.analyserNode) {
            if (settings.fftSize !== this.config.fftSize) {
                this.analyserNode.fftSize = settings.fftSize
                this.config.fftSize = settings.fftSize
                
                // Reinitialize data arrays
                const bufferLength = this.analyserNode.frequencyBinCount
                this.frequencyData = new Uint8Array(bufferLength)
                this.timeData = new Uint8Array(bufferLength)
            }
            
            if (settings.smoothingTimeConstant !== this.config.smoothingTimeConstant) {
                this.analyserNode.smoothingTimeConstant = settings.smoothingTimeConstant
                this.config.smoothingTimeConstant = settings.smoothingTimeConstant
            }
        }
        
        // Update frequency analyzer settings
        if (this.frequencyAnalyzer) {
            this.frequencyAnalyzer.updateConfiguration({
                smoothingEnabled: settings.advancedAnalysisEnabled,
                spectrumResolution: settings.spectrumResolution
            })
        }
        
        // Update FFT optimizer settings
        if (this.fftOptimizer) {
            this.fftOptimizer.updateConfiguration({
                fftSize: settings.fftSize
            })
        }
        
        // Update worker manager settings
        if (this.workerManager) {
            this.workerManager.updateConfig({
                fftSize: settings.fftSize,
                smoothingTimeConstant: settings.smoothingTimeConstant
            })
        }
    }
    
    /**
     * Get comprehensive performance statistics
     * @returns {Promise<Object>} Performance stats from all components
     */
    async getPerformanceStats() {
        const stats = {
            monitor: this.performanceMonitor.getPerformanceStats(),
            fftOptimizer: this.fftOptimizer.getPerformanceStats(),
            frequencyAnalyzer: this.frequencyAnalyzer ? this.frequencyAnalyzer.getPerformanceStats() : null
        }
        
        if (this.workerManager) {
            stats.workerManager = await this.workerManager.getPerformanceStats()
        }
        
        return stats
    }
    
    /**
     * Run performance benchmark
     * @returns {Promise<Object>} Benchmark results
     */
    async runPerformanceBenchmark() {
        if (!this.isInitialized) {
            throw new Error('Audio analyzer must be initialized before benchmarking')
        }
        
        return this.performanceMonitor.runBenchmark(() => {
            this.getFrequencyData()
        })
    }
    
    /**
     * Start continuous audio analysis
     */
    startAnalysis() {
        this.isAnalyzing = true
    }
    
    /**
     * Stop continuous audio analysis
     */
    stopAnalysis() {
        this.isAnalyzing = false
    }
    
    /**
     * Set event callbacks
     * @param {Object} callbacks - Callback functions
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks }
    }
    
    /**
     * Clean up resources and stop audio processing
     */
    dispose() {
        this.stopAnalysis()
        
        // Stop performance monitoring
        if (this.performanceMonitor) {
            this.performanceMonitor.stop()
            this.performanceMonitor.dispose()
            this.performanceMonitor = null
        }
        
        // Dispose worker manager
        if (this.workerManager) {
            this.workerManager.dispose()
            this.workerManager = null
        }
        
        // Dispose FFT optimizer
        if (this.fftOptimizer) {
            this.fftOptimizer.dispose()
            this.fftOptimizer = null
        }
        
        if (this.sourceManager) {
            this.sourceManager.dispose()
            this.sourceManager = null
        }
        
        if (this.analyserNode) {
            this.analyserNode.disconnect()
            this.analyserNode = null
        }
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close()
            this.audioContext = null
        }
        
        this.isInitialized = false
        this.currentSource = null
        this.frequencyData = null
        this.timeData = null
        this.callbacks = {}
    }
}