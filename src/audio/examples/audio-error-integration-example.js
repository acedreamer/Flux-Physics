/**
 * FLUX Audio Reactive Mode - Error Handling Integration Example
 * 
 * Demonstrates comprehensive error handling integration with:
 * - AudioAnalyzer for audio processing errors
 * - AudioUserFeedback for user interface feedback
 * - AudioErrorHandler for centralized error management
 * - Graceful fallback and recovery strategies
 */

import { AudioAnalyzer } from '../core/audio-analyzer.js'
import { AudioErrorHandler } from '../ui/audio-error-handler.js'
import { AudioUserFeedback } from '../ui/audio-user-feedback.js'
import { AudioEffects } from '../core/audio-effects.js'

export class AudioErrorIntegrationExample {
    constructor(container, fluxApp) {
        this.container = container
        this.fluxApp = fluxApp
        
        // Audio components
        this.audioAnalyzer = null
        this.audioEffects = null
        
        // Error handling components
        this.errorHandler = null
        this.userFeedback = null
        
        // State
        this.isAudioEnabled = false
        this.currentSource = 'microphone'
        this.currentMode = 'reactive'
        this.audioSettings = {
            sensitivity: 1.0,
            quality: 'high',
            smoothing: 0.8
        }
        
        // Connection monitoring
        this.connectionMonitor = null
        this.lastAudioTime = 0
        this.connectionCheckInterval = 1000 // ms
        
        this.initializeErrorHandling()
        this.setupConnectionMonitoring()
    }
    
    /**
     * Initialize comprehensive error handling system
     */
    initializeErrorHandling() {
        // Create error handler with custom configuration
        this.errorHandler = new AudioErrorHandler({
            lowAudioThreshold: 0.02,
            lowAudioDuration: 3000,
            silenceThreshold: 0.01,
            silenceDuration: 5000,
            errorDisplayDuration: 10000,
            maxConsecutiveErrors: 3
        })
        
        // Create user feedback system
        this.userFeedback = new AudioUserFeedback(this.container, {
            animationDuration: 300,
            errorDisplayDuration: 10000,
            warningDisplayDuration: 6000
        })
        
        // Setup error handler callbacks
        this.errorHandler.setCallbacks({
            onError: (errorInfo) => this.handleError(errorInfo),
            onWarning: (warningInfo) => this.handleWarning(warningInfo),
            onRecovery: (recoveryInfo) => this.handleRecovery(recoveryInfo),
            onFallback: (fallbackInfo) => this.handleFallback(fallbackInfo),
            onStatusChange: (status, message) => this.handleStatusChange(status, message),
            onUserAction: (action, context) => this.handleUserAction(action, context)
        })
        
        // Setup user feedback callbacks
        this.userFeedback.setCallbacks({
            onUserAction: (action, context) => this.handleUserAction(action, context),
            onStatusClick: (status) => this.handleStatusClick(status),
            onHelpRequest: (type) => this.handleHelpRequest(type)
        })
    }
    
    /**
     * Setup connection monitoring for proactive error detection
     */
    setupConnectionMonitoring() {
        this.connectionMonitor = setInterval(() => {
            if (this.isAudioEnabled && this.audioAnalyzer) {
                this.checkConnectionHealth()
            }
        }, this.connectionCheckInterval)
    }
    
    /**
     * Enable audio reactive mode with comprehensive error handling
     * @param {string} source - Audio source ('microphone' or 'system')
     * @returns {Promise<Object>} Activation result
     */
    async enableAudioMode(source = 'microphone') {
        try {
            // Update status to show we're attempting connection
            this.userFeedback.updateStatus('requesting', 'Requesting audio access...', {
                source: source
            })
            this.userFeedback.showProgress('Initializing Audio', 'Requesting permissions...')
            
            // Check browser support first
            if (!this.checkBrowserSupport()) {
                throw new Error('WEB_AUDIO_UNSUPPORTED')
            }
            
            // Initialize audio analyzer
            this.audioAnalyzer = new AudioAnalyzer({
                fftSize: this.audioSettings.quality === 'high' ? 2048 : 1024,
                smoothingTimeConstant: this.audioSettings.smoothing
            })
            
            // Update progress
            this.userFeedback.updateProgress('Connecting to Audio', `Connecting to ${source}...`)
            
            // Initialize with error handling
            await this.initializeAudioWithErrorHandling(source)
            
            // Create audio effects
            this.audioEffects = new AudioEffects(this.fluxApp)
            this.audioEffects.setMode(this.currentMode)
            this.audioEffects.setIntensity(this.audioSettings.sensitivity)
            
            // Start audio processing loop
            this.startAudioProcessing()
            
            // Update state
            this.isAudioEnabled = true
            this.currentSource = source
            
            // Hide progress and update status
            this.userFeedback.hideProgress()
            this.userFeedback.updateStatus('connected', 'Audio reactive mode active', {
                source: source,
                quality: this.audioSettings.quality,
                latency: '~20ms'
            })
            
            return { success: true, source, mode: this.currentMode }
            
        } catch (error) {
            this.userFeedback.hideProgress()
            
            // Handle specific error types
            const errorType = this.mapErrorToType(error)
            const errorInfo = {
                error: errorType,
                message: error.message,
                originalError: error
            }
            
            const context = {
                attemptedSource: source,
                currentSettings: this.audioSettings,
                browserInfo: this.getBrowserInfo()
            }
            
            this.errorHandler.handleError(errorInfo, context)
            
            return { success: false, error: errorType, message: error.message }
        }
    }
    
    /**
     * Initialize audio analyzer with comprehensive error handling
     * @param {string} source - Audio source
     */
    async initializeAudioWithErrorHandling(source) {
        try {
            await this.audioAnalyzer.initialize(source)
            
            // Test audio connection
            await this.testAudioConnection()
            
        } catch (error) {
            // Map browser-specific errors to our error types
            if (error.name === 'NotAllowedError') {
                throw new Error(source === 'microphone' ? 'MICROPHONE_PERMISSION_DENIED' : 'SYSTEM_AUDIO_PERMISSION_DENIED')
            } else if (error.name === 'NotFoundError') {
                throw new Error(source === 'microphone' ? 'NO_MICROPHONE_DEVICE' : 'NO_SYSTEM_AUDIO')
            } else if (error.name === 'NotReadableError') {
                throw new Error('MICROPHONE_HARDWARE_ERROR')
            } else if (error.name === 'NotSupportedError') {
                throw new Error(source === 'system' ? 'SYSTEM_AUDIO_NOT_SUPPORTED' : 'WEB_AUDIO_UNSUPPORTED')
            } else {
                throw new Error('INITIALIZATION_FAILED')
            }
        }
    }
    
    /**
     * Test audio connection to ensure it's working
     */
    async testAudioConnection() {
        return new Promise((resolve, reject) => {
            let testAttempts = 0
            const maxAttempts = 10
            
            const testInterval = setInterval(() => {
                if (!this.audioAnalyzer) {
                    clearInterval(testInterval)
                    reject(new Error('Audio analyzer not available'))
                    return
                }
                
                const audioData = this.audioAnalyzer.getFrequencyData()
                
                if (audioData && audioData.overall !== undefined) {
                    clearInterval(testInterval)
                    resolve()
                    return
                }
                
                testAttempts++
                if (testAttempts >= maxAttempts) {
                    clearInterval(testInterval)
                    reject(new Error('Audio connection test failed'))
                }
            }, 100)
        })
    }
    
    /**
     * Start audio processing loop with error monitoring
     */
    startAudioProcessing() {
        const processAudio = () => {
            if (!this.isAudioEnabled || !this.audioAnalyzer) {
                return
            }
            
            try {
                // Get audio data
                const audioData = this.audioAnalyzer.getFrequencyData()
                const beatData = this.audioAnalyzer.getBeatData ? this.audioAnalyzer.getBeatData() : null
                
                // Monitor audio levels for error detection
                this.errorHandler.monitorAudioLevel(audioData.overall)
                this.lastAudioTime = performance.now()
                
                // Apply audio effects
                if (this.audioEffects && audioData) {
                    this.audioEffects.processAudioData(audioData, beatData)
                }
                
                // Update UI feedback
                this.updateAudioFeedback(audioData, beatData)
                
            } catch (error) {
                console.error('Audio processing error:', error)
                
                this.errorHandler.handleError({
                    error: 'PROCESSING_ERROR',
                    message: 'Audio processing failed'
                }, {
                    processingError: error,
                    audioData: 'unavailable'
                })
            }
            
            // Continue processing
            if (this.isAudioEnabled) {
                requestAnimationFrame(processAudio)
            }
        }
        
        processAudio()
    }
    
    /**
     * Update audio feedback UI
     * @param {Object} audioData - Audio frequency data
     * @param {Object} beatData - Beat detection data
     */
    updateAudioFeedback(audioData, beatData) {
        // Update connection status with real-time info
        this.userFeedback.updateConnectionStatus('connected', {
            source: this.currentSource,
            quality: this.audioSettings.quality,
            latency: this.calculateLatency()
        })
        
        // Update spectrum display if available
        if (audioData.spectrum && this.userFeedback.elements.spectrum) {
            this.userFeedback.updateSpectrum(audioData.spectrum)
        }
        
        // Update beat indicator if available
        if (beatData && this.userFeedback.elements.beatIndicator) {
            this.userFeedback.updateBeatIndicator(beatData)
        }
    }
    
    /**
     * Check connection health proactively
     */
    checkConnectionHealth() {
        const now = performance.now()
        const timeSinceLastAudio = now - this.lastAudioTime
        
        // Check if audio processing has stopped
        if (timeSinceLastAudio > 5000) { // 5 seconds without audio processing
            this.errorHandler.handleConnectionChange(false, this.currentSource)
        }
        
        // Check if audio analyzer is still available
        if (!this.audioAnalyzer || !this.audioAnalyzer.audioContext) {
            this.errorHandler.handleConnectionChange(false, this.currentSource)
        }
        
        // Check audio context state
        if (this.audioAnalyzer && this.audioAnalyzer.audioContext) {
            const contextState = this.audioAnalyzer.audioContext.state
            if (contextState === 'suspended' || contextState === 'closed') {
                this.errorHandler.handleError({
                    error: 'CONNECTION_LOST',
                    message: `Audio context ${contextState}`
                }, {
                    contextState,
                    source: this.currentSource
                })
            }
        }
    }
    
    /**
     * Handle error display and user interaction
     * @param {Object} errorInfo - Error information
     */
    handleError(errorInfo) {
        console.error('Audio error:', errorInfo)
        
        // Show error in UI
        this.userFeedback.showError(errorInfo)
        
        // Update status
        this.userFeedback.updateStatus('error', errorInfo.title, {
            source: this.currentSource,
            quality: '--'
        })
        
        // Log error for debugging
        this.logError(errorInfo)
    }
    
    /**
     * Handle warning display
     * @param {Object} warningInfo - Warning information
     */
    handleWarning(warningInfo) {
        console.warn('Audio warning:', warningInfo)
        
        // Show warning in UI
        this.userFeedback.showWarning(warningInfo)
        
        // Update status
        this.userFeedback.updateStatus('warning', warningInfo.title, {
            source: this.currentSource,
            quality: this.audioSettings.quality
        })
    }
    
    /**
     * Handle recovery notifications
     * @param {Object} recoveryInfo - Recovery information
     */
    handleRecovery(recoveryInfo) {
        console.log('Audio recovery:', recoveryInfo)
        
        // Show recovery message
        if (recoveryInfo.type === 'auto_recovery') {
            this.userFeedback.showWarning({
                title: 'Audio Recovered',
                message: recoveryInfo.message,
                severity: 'info',
                primaryAction: { text: 'OK', action: 'dismiss' }
            })
        }
        
        // Update status
        this.userFeedback.updateStatus('connected', 'Audio recovered', {
            source: this.currentSource,
            quality: this.audioSettings.quality
        })
    }
    
    /**
     * Handle fallback mode activation
     * @param {Object} fallbackInfo - Fallback information
     */
    handleFallback(fallbackInfo) {
        console.log('Audio fallback:', fallbackInfo)
        
        // Disable audio mode
        this.disableAudioMode()
        
        // Show fallback notification
        this.userFeedback.showWarning({
            title: 'Switched to Normal Mode',
            message: `Audio reactive mode disabled due to ${fallbackInfo.reason}`,
            severity: 'info',
            primaryAction: { text: 'Try Again', action: 'retry' }
        })
        
        // Update status
        this.userFeedback.updateStatus('disabled', 'Audio disabled (fallback)', {
            source: 'None',
            quality: '--'
        })
    }
    
    /**
     * Handle status changes
     * @param {string} status - New status
     * @param {string} message - Status message
     */
    handleStatusChange(status, message) {
        console.log('Audio status change:', status, message)
        
        // Update UI status
        this.userFeedback.updateStatus(status, message, {
            source: this.currentSource,
            quality: this.audioSettings.quality
        })
    }
    
    /**
     * Handle user actions from error dialogs and UI
     * @param {string} action - Action to perform
     * @param {Object} context - Action context
     * @returns {Promise<Object>} Action result
     */
    async handleUserAction(action, context) {
        console.log('User action:', action, context)
        
        try {
            switch (action) {
                case 'retry':
                    return await this.retryAudioConnection(context)
                    
                case 'switchToSystem':
                    return await this.switchAudioSource('system')
                    
                case 'switchToMicrophone':
                    return await this.switchAudioSource('microphone')
                    
                case 'switchSource':
                    return await this.switchAudioSource(context.newSource)
                    
                case 'reconnect':
                    return await this.reconnectAudio()
                    
                case 'adjustSensitivity':
                    return this.adjustSensitivity(context.sensitivity)
                    
                case 'reduceQuality':
                    return this.reduceAudioQuality()
                    
                case 'optimizeSettings':
                    return this.optimizeAudioSettings()
                    
                case 'disable':
                    return this.disableAudioMode()
                    
                case 'openSystemSettings':
                    return this.openSystemAudioSettings()
                    
                case 'dismiss':
                    return { success: true, message: 'Dismissed' }
                    
                default:
                    return { success: false, message: `Unknown action: ${action}` }
            }
        } catch (error) {
            return { success: false, message: error.message }
        }
    }
    
    /**
     * Retry audio connection
     * @param {Object} context - Retry context
     * @returns {Promise<Object>} Retry result
     */
    async retryAudioConnection(context) {
        const source = context?.attemptedSource || this.currentSource
        
        // Clear previous error state
        this.errorHandler.clearError()
        
        // Attempt to re-enable audio
        const result = await this.enableAudioMode(source)
        
        return {
            success: result.success,
            message: result.success ? 'Audio connection restored' : result.message
        }
    }
    
    /**
     * Switch audio source
     * @param {string} newSource - New audio source
     * @returns {Promise<Object>} Switch result
     */
    async switchAudioSource(newSource) {
        // Disable current audio
        this.disableAudioMode()
        
        // Wait a moment for cleanup
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Enable with new source
        const result = await this.enableAudioMode(newSource)
        
        return {
            success: result.success,
            message: result.success ? `Switched to ${newSource}` : result.message
        }
    }
    
    /**
     * Reconnect to current audio source
     * @returns {Promise<Object>} Reconnection result
     */
    async reconnectAudio() {
        return await this.retryAudioConnection({ attemptedSource: this.currentSource })
    }
    
    /**
     * Adjust audio sensitivity
     * @param {number} sensitivity - New sensitivity value
     * @returns {Object} Adjustment result
     */
    adjustSensitivity(sensitivity) {
        this.audioSettings.sensitivity = sensitivity
        
        if (this.audioEffects) {
            this.audioEffects.setIntensity(sensitivity)
        }
        
        return { success: true, message: `Sensitivity adjusted to ${sensitivity.toFixed(1)}x` }
    }
    
    /**
     * Reduce audio quality for performance
     * @returns {Object} Quality reduction result
     */
    reduceAudioQuality() {
        const qualityLevels = ['high', 'medium', 'low']
        const currentIndex = qualityLevels.indexOf(this.audioSettings.quality)
        
        if (currentIndex < qualityLevels.length - 1) {
            this.audioSettings.quality = qualityLevels[currentIndex + 1]
            
            // Apply quality settings if audio is active
            if (this.audioAnalyzer) {
                const fftSize = this.audioSettings.quality === 'high' ? 2048 : 
                              this.audioSettings.quality === 'medium' ? 1024 : 512
                
                if (this.audioAnalyzer.analyserNode) {
                    this.audioAnalyzer.analyserNode.fftSize = fftSize
                }
            }
            
            return { success: true, message: `Quality reduced to ${this.audioSettings.quality}` }
        }
        
        return { success: false, message: 'Already at lowest quality' }
    }
    
    /**
     * Optimize audio settings automatically
     * @returns {Object} Optimization result
     */
    optimizeAudioSettings() {
        // Reduce quality and increase smoothing for better performance
        this.audioSettings.quality = 'medium'
        this.audioSettings.smoothing = 0.9
        
        // Apply settings
        if (this.audioAnalyzer) {
            if (this.audioAnalyzer.analyserNode) {
                this.audioAnalyzer.analyserNode.fftSize = 1024
                this.audioAnalyzer.analyserNode.smoothingTimeConstant = 0.9
            }
        }
        
        return { success: true, message: 'Audio settings optimized for performance' }
    }
    
    /**
     * Disable audio reactive mode
     * @returns {Object} Disable result
     */
    disableAudioMode() {
        this.isAudioEnabled = false
        
        // Cleanup audio analyzer
        if (this.audioAnalyzer) {
            this.audioAnalyzer.dispose()
            this.audioAnalyzer = null
        }
        
        // Cleanup audio effects
        if (this.audioEffects) {
            this.audioEffects.dispose()
            this.audioEffects = null
        }
        
        // Update UI
        this.userFeedback.updateStatus('disabled', 'Audio disabled', {
            source: 'None',
            quality: '--'
        })
        
        return { success: true, message: 'Audio mode disabled' }
    }
    
    /**
     * Open system audio settings (platform-specific)
     * @returns {Object} Open result
     */
    openSystemAudioSettings() {
        // This would open system-specific audio settings
        // Implementation depends on platform and browser capabilities
        
        const userAgent = navigator.userAgent.toLowerCase()
        let message = 'Please check your system audio settings manually.'
        
        if (userAgent.includes('windows')) {
            message = 'Open Windows Sound settings: Settings > System > Sound'
        } else if (userAgent.includes('mac')) {
            message = 'Open macOS Sound preferences: System Preferences > Sound'
        } else if (userAgent.includes('linux')) {
            message = 'Open your Linux audio settings (varies by distribution)'
        }
        
        // Show instructions
        this.userFeedback.showWarning({
            title: 'System Audio Settings',
            message: message,
            severity: 'info',
            primaryAction: { text: 'OK', action: 'dismiss' }
        })
        
        return { success: true, message: 'System settings instructions shown' }
    }
    
    /**
     * Handle status indicator clicks
     * @param {string} status - Current status
     */
    handleStatusClick(status) {
        if (status === 'error') {
            // Show current error details
            if (this.errorHandler.currentError) {
                this.userFeedback.showError(this.errorHandler.currentError)
            }
        } else if (status === 'disabled') {
            // Offer to enable audio mode
            this.userFeedback.showWarning({
                title: 'Enable Audio Mode?',
                message: 'Would you like to enable audio reactive mode?',
                severity: 'info',
                primaryAction: { text: 'Enable', action: 'retry' }
            })
        }
    }
    
    /**
     * Handle help requests
     * @param {string} type - Help request type
     */
    handleHelpRequest(type) {
        console.log('Help requested:', type)
        
        if (type === 'show') {
            // Log help usage for analytics
            this.logEvent('help_shown', { context: this.getAudioState() })
        }
    }
    
    /**
     * Utility methods
     */
    
    checkBrowserSupport() {
        return !!(window.AudioContext || window.webkitAudioContext)
    }
    
    mapErrorToType(error) {
        const message = error.message.toLowerCase()
        
        if (message.includes('web_audio_unsupported')) return 'WEB_AUDIO_UNSUPPORTED'
        if (message.includes('microphone_permission_denied')) return 'MICROPHONE_PERMISSION_DENIED'
        if (message.includes('system_audio_permission_denied')) return 'SYSTEM_AUDIO_PERMISSION_DENIED'
        if (message.includes('no_microphone_device')) return 'NO_MICROPHONE_DEVICE'
        if (message.includes('no_system_audio')) return 'NO_SYSTEM_AUDIO'
        if (message.includes('microphone_hardware_error')) return 'MICROPHONE_HARDWARE_ERROR'
        if (message.includes('system_audio_not_supported')) return 'SYSTEM_AUDIO_NOT_SUPPORTED'
        if (message.includes('initialization_failed')) return 'INITIALIZATION_FAILED'
        
        return 'UNKNOWN_ERROR'
    }
    
    getBrowserInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            webAudioSupported: this.checkBrowserSupport(),
            mediaDevicesSupported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
        }
    }
    
    calculateLatency() {
        // Estimate audio latency based on buffer size and sample rate
        if (this.audioAnalyzer && this.audioAnalyzer.audioContext) {
            const bufferSize = this.audioAnalyzer.analyserNode?.fftSize || 2048
            const sampleRate = this.audioAnalyzer.audioContext.sampleRate
            return Math.round((bufferSize / sampleRate) * 1000) // Convert to ms
        }
        return 0
    }
    
    getAudioState() {
        return {
            isEnabled: this.isAudioEnabled,
            source: this.currentSource,
            mode: this.currentMode,
            settings: { ...this.audioSettings },
            hasError: !!this.errorHandler?.currentError,
            fallbackMode: this.errorHandler?.fallbackMode || false
        }
    }
    
    logError(errorInfo) {
        // Log error for debugging and analytics
        console.group('Audio Error Details')
        console.error('Error:', errorInfo.error)
        console.error('Message:', errorInfo.message)
        console.error('Context:', errorInfo.context)
        console.error('State:', this.getAudioState())
        console.error('Browser:', this.getBrowserInfo())
        console.groupEnd()
    }
    
    logEvent(eventName, data) {
        // Log events for analytics
        console.log(`Audio Event: ${eventName}`, data)
    }
    
    /**
     * Dispose of all resources
     */
    dispose() {
        // Stop connection monitoring
        if (this.connectionMonitor) {
            clearInterval(this.connectionMonitor)
            this.connectionMonitor = null
        }
        
        // Disable audio mode
        this.disableAudioMode()
        
        // Dispose error handling components
        if (this.errorHandler) {
            this.errorHandler.dispose()
            this.errorHandler = null
        }
        
        if (this.userFeedback) {
            this.userFeedback.dispose()
            this.userFeedback = null
        }
    }
}