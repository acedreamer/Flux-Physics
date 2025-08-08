/**
 * AudioWorkerManager - Manages Web Worker for audio processing
 * Handles worker lifecycle, communication, and fallback to main thread
 */
export class AudioWorkerManager {
    constructor(options = {}) {
        this.config = {
            workerEnabled: options.workerEnabled !== false,
            workerPath: options.workerPath || '/src/audio/audio-worker.js',
            fallbackToMainThread: options.fallbackToMainThread !== false,
            workerTimeout: options.workerTimeout || 5000,
            maxRetries: options.maxRetries || 3
        }
        
        this.worker = null
        this.isWorkerReady = false
        this.isProcessing = false
        this.retryCount = 0
        this.pendingMessages = new Map()
        this.messageId = 0
        
        // Fallback processing functions
        this.fallbackProcessor = null
        this.usingFallback = false
        
        // Performance tracking
        this.performanceStats = {
            workerProcessTime: 0,
            mainThreadProcessTime: 0,
            workerMessages: 0,
            fallbackCalls: 0,
            errors: 0
        }
        
        // Callbacks
        this.callbacks = {
            onWorkerReady: null,
            onWorkerError: null,
            onFallbackActivated: null,
            onProcessingComplete: null
        }
    }
    
    /**
     * Initialize the worker manager
     * @param {Object} workerConfig - Configuration for the worker
     * @returns {Promise<{success: boolean, usingWorker: boolean, error?: string}>}
     */
    async initialize(workerConfig = {}) {
        if (!this.config.workerEnabled || !this.isWorkerSupported()) {
            console.log('Web Workers not supported or disabled, using main thread fallback')
            this.activateFallback()
            return { success: true, usingWorker: false }
        }
        
        try {
            await this.createWorker()
            await this.initializeWorker(workerConfig)
            
            console.log('AudioWorkerManager initialized with Web Worker')
            return { success: true, usingWorker: true }
            
        } catch (error) {
            console.warn('Failed to initialize Web Worker, falling back to main thread:', error)
            this.activateFallback()
            return { 
                success: true, 
                usingWorker: false, 
                error: error.message 
            }
        }
    }
    
    /**
     * Check if Web Workers are supported
     * @returns {boolean} Worker support status
     */
    isWorkerSupported() {
        return typeof Worker !== 'undefined'
    }
    
    /**
     * Create the Web Worker
     * @returns {Promise<void>}
     */
    async createWorker() {
        return new Promise((resolve, reject) => {
            try {
                this.worker = new Worker(this.config.workerPath, { type: 'module' })
                
                this.worker.onmessage = (e) => this.handleWorkerMessage(e)
                this.worker.onerror = (error) => this.handleWorkerError(error)
                
                // Test worker responsiveness
                const testTimeout = setTimeout(() => {
                    reject(new Error('Worker creation timeout'))
                }, 2000)
                
                const testMessage = this.sendMessage('test', {})
                testMessage.then(() => {
                    clearTimeout(testTimeout)
                    resolve()
                }).catch(reject)
                
            } catch (error) {
                reject(error)
            }
        })
    }
    
    /**
     * Initialize the worker with configuration
     * @param {Object} config - Worker configuration
     * @returns {Promise<void>}
     */
    async initializeWorker(config) {
        const response = await this.sendMessage('initialize', config)
        
        if (response.success) {
            this.isWorkerReady = true
            
            if (this.callbacks.onWorkerReady) {
                this.callbacks.onWorkerReady()
            }
        } else {
            throw new Error('Worker initialization failed')
        }
    }
    
    /**
     * Process audio data using worker or fallback
     * @param {Uint8Array} frequencyData - Frequency data
     * @param {Uint8Array} timeData - Time domain data
     * @returns {Promise<Object>} Processing results
     */
    async processAudioData(frequencyData, timeData) {
        const startTime = performance.now()
        
        try {
            let result
            
            if (this.isWorkerReady && !this.usingFallback) {
                // Use Web Worker
                result = await this.processWithWorker(frequencyData, timeData)
                this.performanceStats.workerProcessTime = performance.now() - startTime
                this.performanceStats.workerMessages++
            } else {
                // Use main thread fallback
                result = await this.processWithFallback(frequencyData, timeData)
                this.performanceStats.mainThreadProcessTime = performance.now() - startTime
                this.performanceStats.fallbackCalls++
            }
            
            if (this.callbacks.onProcessingComplete) {
                this.callbacks.onProcessingComplete(result, this.usingFallback)
            }
            
            return result
            
        } catch (error) {
            this.performanceStats.errors++
            console.error('Audio processing error:', error)
            
            // Try fallback if worker failed
            if (!this.usingFallback) {
                console.log('Worker failed, attempting fallback processing')
                this.activateFallback()
                return this.processWithFallback(frequencyData, timeData)
            }
            
            throw error
        }
    }
    
    /**
     * Process audio data using Web Worker
     * @param {Uint8Array} frequencyData - Frequency data
     * @param {Uint8Array} timeData - Time domain data
     * @returns {Promise<Object>} Processing results
     */
    async processWithWorker(frequencyData, timeData) {
        if (this.isProcessing) {
            throw new Error('Worker is already processing')
        }
        
        this.isProcessing = true
        
        try {
            const response = await this.sendMessage('process', {
                frequencyData: frequencyData,
                timeData: timeData
            })
            
            return response.data
            
        } finally {
            this.isProcessing = false
        }
    }
    
    /**
     * Process audio data using main thread fallback
     * @param {Uint8Array} frequencyData - Frequency data
     * @param {Uint8Array} timeData - Time domain data
     * @returns {Promise<Object>} Processing results
     */
    async processWithFallback(frequencyData, timeData) {
        if (!this.fallbackProcessor) {
            // Create fallback processor (simplified version)
            this.fallbackProcessor = this.createFallbackProcessor()
        }
        
        return this.fallbackProcessor.process(frequencyData, timeData)
    }
    
    /**
     * Create a simplified fallback processor for main thread
     * @returns {Object} Fallback processor
     */
    createFallbackProcessor() {
        let smoothedValues = { bass: 0, mids: 0, treble: 0, overall: 0 }
        let energyHistory = []
        let lastBeatTime = 0
        
        const frequencyRanges = {
            bass: { min: 20, max: 250 },
            mids: { min: 250, max: 4000 },
            treble: { min: 4000, max: 20000 }
        }
        
        // Calculate frequency bins (simplified)
        const sampleRate = 44100
        const fftSize = 2048
        const nyquist = sampleRate / 2
        const binCount = fftSize / 2
        const binWidth = nyquist / binCount
        
        const frequencyBins = {
            bass: [],
            mids: [],
            treble: []
        }
        
        for (let i = 0; i < binCount; i++) {
            const frequency = i * binWidth
            
            if (frequency >= frequencyRanges.bass.min && frequency <= frequencyRanges.bass.max) {
                frequencyBins.bass.push(i)
            }
            if (frequency >= frequencyRanges.mids.min && frequency <= frequencyRanges.mids.max) {
                frequencyBins.mids.push(i)
            }
            if (frequency >= frequencyRanges.treble.min && frequency <= frequencyRanges.treble.max) {
                frequencyBins.treble.push(i)
            }
        }
        
        return {
            process: (frequencyData, timeData) => {
                const startTime = performance.now()
                
                // Calculate frequency ranges
                const bass = this.calculateRangeAverage(frequencyData, frequencyBins.bass)
                const mids = this.calculateRangeAverage(frequencyData, frequencyBins.mids)
                const treble = this.calculateRangeAverage(frequencyData, frequencyBins.treble)
                const overall = this.calculateOverallAmplitude(frequencyData)
                
                // Apply smoothing
                const smoothingFactor = 0.7
                smoothedValues.bass = this.lerp(smoothedValues.bass, bass, 1 - smoothingFactor)
                smoothedValues.mids = this.lerp(smoothedValues.mids, mids, 1 - smoothingFactor)
                smoothedValues.treble = this.lerp(smoothedValues.treble, treble, 1 - smoothingFactor)
                smoothedValues.overall = this.lerp(smoothedValues.overall, overall, 1 - smoothingFactor)
                
                // Simple beat detection
                const energy = this.calculateInstantEnergy(frequencyData)
                energyHistory.push(energy)
                if (energyHistory.length > 43) energyHistory.shift()
                
                const avgEnergy = energyHistory.reduce((a, b) => a + b, 0) / energyHistory.length
                const currentTime = performance.now()
                const isBeat = energy > (avgEnergy * 1.3) && 
                              energy > 0.1 && 
                              (currentTime - lastBeatTime) > 300
                
                let beatStrength = 0
                if (isBeat) {
                    lastBeatTime = currentTime
                    beatStrength = Math.min(energy / avgEnergy, 2.0)
                }
                
                return Promise.resolve({
                    frequency: {
                        bass: smoothedValues.bass,
                        mids: smoothedValues.mids,
                        treble: smoothedValues.treble,
                        overall: smoothedValues.overall,
                        raw: { bass, mids, treble, overall }
                    },
                    beat: {
                        isBeat,
                        energy,
                        avgEnergy,
                        strength: beatStrength,
                        bpm: 0, // Simplified - no BPM calculation
                        confidence: isBeat ? 0.8 : 0
                    },
                    spectrum: {
                        spectralCentroid: 0,
                        spectralRolloff: 0,
                        spectralFlux: 0,
                        dominantFrequency: 0,
                        brightness: 0,
                        harmonicity: 0
                    },
                    performance: {
                        processTime: performance.now() - startTime,
                        averageProcessTime: performance.now() - startTime
                    },
                    timestamp: performance.now()
                })
            }
        }
    }
    
    /**
     * Calculate range average for fallback processor
     * @param {Uint8Array} frequencyData - Frequency data
     * @param {Array} bins - Frequency bins
     * @returns {number} Average value
     */
    calculateRangeAverage(frequencyData, bins) {
        if (!bins || bins.length === 0) return 0
        
        let sum = 0
        for (const bin of bins) {
            if (bin < frequencyData.length) {
                sum += frequencyData[bin]
            }
        }
        
        return (sum / bins.length) / 255
    }
    
    /**
     * Calculate overall amplitude for fallback processor
     * @param {Uint8Array} frequencyData - Frequency data
     * @returns {number} Overall amplitude
     */
    calculateOverallAmplitude(frequencyData) {
        let sum = 0
        for (let i = 0; i < frequencyData.length; i++) {
            sum += frequencyData[i]
        }
        return (sum / frequencyData.length) / 255
    }
    
    /**
     * Calculate instant energy for fallback processor
     * @param {Uint8Array} frequencyData - Frequency data
     * @returns {number} Instant energy
     */
    calculateInstantEnergy(frequencyData) {
        let energy = 0
        const bassRange = Math.floor(frequencyData.length * 0.1)
        
        for (let i = 0; i < bassRange; i++) {
            energy += frequencyData[i] * frequencyData[i]
        }
        
        return Math.sqrt(energy / bassRange) / 255
    }
    
    /**
     * Linear interpolation utility
     * @param {number} a - Start value
     * @param {number} b - End value
     * @param {number} t - Interpolation factor
     * @returns {number} Interpolated value
     */
    lerp(a, b, t) {
        return a + (b - a) * t
    }
    
    /**
     * Send message to worker with timeout and retry logic
     * @param {string} type - Message type
     * @param {*} data - Message data
     * @returns {Promise<*>} Worker response
     */
    async sendMessage(type, data) {
        if (!this.worker) {
            throw new Error('Worker not available')
        }
        
        const messageId = ++this.messageId
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingMessages.delete(messageId)
                reject(new Error(`Worker message timeout: ${type}`))
            }, this.config.workerTimeout)
            
            this.pendingMessages.set(messageId, {
                resolve,
                reject,
                timeout,
                type
            })
            
            this.worker.postMessage({
                id: messageId,
                type,
                data
            })
        })
    }
    
    /**
     * Handle messages from worker
     * @param {MessageEvent} e - Message event
     */
    handleWorkerMessage(e) {
        const { id, type, data, error } = e.data
        
        if (id && this.pendingMessages.has(id)) {
            const pending = this.pendingMessages.get(id)
            clearTimeout(pending.timeout)
            this.pendingMessages.delete(id)
            
            if (error) {
                pending.reject(new Error(error))
            } else {
                pending.resolve(data || e.data)
            }
        } else {
            // Handle non-request messages
            switch (type) {
                case 'error':
                    console.error('Worker error:', error)
                    this.handleWorkerError(new Error(error))
                    break
                    
                default:
                    console.log('Unhandled worker message:', type, data)
            }
        }
    }
    
    /**
     * Handle worker errors
     * @param {Error} error - Error object
     */
    handleWorkerError(error) {
        console.error('Worker error:', error)
        this.performanceStats.errors++
        
        if (this.callbacks.onWorkerError) {
            this.callbacks.onWorkerError(error)
        }
        
        // Activate fallback if too many errors
        if (this.performanceStats.errors > 3 && !this.usingFallback) {
            console.warn('Too many worker errors, activating fallback')
            this.activateFallback()
        }
    }
    
    /**
     * Activate main thread fallback processing
     */
    activateFallback() {
        this.usingFallback = true
        this.isWorkerReady = false
        
        if (this.worker) {
            this.worker.terminate()
            this.worker = null
        }
        
        // Clear pending messages
        this.pendingMessages.forEach(pending => {
            clearTimeout(pending.timeout)
            pending.reject(new Error('Worker terminated, using fallback'))
        })
        this.pendingMessages.clear()
        
        if (this.callbacks.onFallbackActivated) {
            this.callbacks.onFallbackActivated()
        }
        
        console.log('Audio processing fallback activated')
    }
    
    /**
     * Update worker configuration
     * @param {Object} config - New configuration
     * @returns {Promise<void>}
     */
    async updateConfig(config) {
        if (this.isWorkerReady) {
            await this.sendMessage('updateConfig', config)
        }
    }
    
    /**
     * Get performance statistics
     * @returns {Promise<Object>} Performance stats
     */
    async getPerformanceStats() {
        let workerStats = {}
        
        if (this.isWorkerReady) {
            try {
                const response = await this.sendMessage('getStats', {})
                workerStats = response.data || {}
            } catch (error) {
                console.warn('Failed to get worker stats:', error)
            }
        }
        
        return {
            manager: { ...this.performanceStats },
            worker: workerStats,
            usingFallback: this.usingFallback,
            isWorkerReady: this.isWorkerReady,
            pendingMessages: this.pendingMessages.size
        }
    }
    
    /**
     * Reset worker state
     * @returns {Promise<void>}
     */
    async reset() {
        if (this.isWorkerReady) {
            await this.sendMessage('reset', {})
        }
        
        // Reset manager stats
        this.performanceStats = {
            workerProcessTime: 0,
            mainThreadProcessTime: 0,
            workerMessages: 0,
            fallbackCalls: 0,
            errors: 0
        }
    }
    
    /**
     * Set callbacks
     * @param {Object} callbacks - Callback functions
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks }
    }
    
    /**
     * Check if using Web Worker
     * @returns {boolean} Worker usage status
     */
    isUsingWorker() {
        return this.isWorkerReady && !this.usingFallback
    }
    
    /**
     * Dispose of resources
     */
    dispose() {
        if (this.worker) {
            this.worker.terminate()
            this.worker = null
        }
        
        // Clear pending messages
        this.pendingMessages.forEach(pending => {
            clearTimeout(pending.timeout)
            pending.reject(new Error('Worker manager disposed'))
        })
        this.pendingMessages.clear()
        
        this.isWorkerReady = false
        this.usingFallback = false
        this.callbacks = {}
        
        console.log('AudioWorkerManager disposed')
    }
}