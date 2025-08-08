/**
 * FLUX Audio Reactive Mode - Comprehensive Error Handler
 * 
 * Provides centralized error handling and user feedback for audio reactive mode:
 * - Graceful fallback when audio permissions denied
 * - Clear error messages for missing microphone or audio issues
 * - Automatic mode switching when audio input fails
 * - Low audio level detection and user warnings
 * - Connection status indicators for audio input
 * - User-friendly error recovery suggestions
 */

export class AudioErrorHandler {
    constructor(options = {}) {
        this.config = {
            lowAudioThreshold: 0.01, // Threshold for low audio detection
            lowAudioDuration: 3000, // ms to wait before showing low audio warning
            silenceThreshold: 0.005, // Threshold for silence detection
            silenceDuration: 5000, // ms to wait before fallback to normal mode
            errorDisplayDuration: 8000, // ms to show error messages
            maxConsecutiveErrors: 3, // Max errors before disabling audio mode
            ...options
        }
        
        // Error tracking
        this.errorHistory = []
        this.consecutiveErrors = 0
        this.lastErrorTime = 0
        this.currentError = null
        
        // Audio level monitoring
        this.audioLevelHistory = []
        this.lowAudioStartTime = null
        this.silenceStartTime = null
        this.lastAudioLevel = 0
        
        // Fallback state
        this.fallbackMode = false
        this.originalMode = null
        this.fallbackReason = null
        
        // UI callbacks
        this.callbacks = {
            onError: null,
            onWarning: null,
            onRecovery: null,
            onFallback: null,
            onStatusChange: null,
            onUserAction: null
        }
        
        // Error message templates
        this.errorMessages = this.initializeErrorMessages()
        
        // Recovery strategies
        this.recoveryStrategies = this.initializeRecoveryStrategies()
    }
    
    /**
     * Initialize error message templates
     * @returns {Object} Error message templates
     */
    initializeErrorMessages() {
        return {
            // Permission errors
            MICROPHONE_PERMISSION_DENIED: {
                title: 'Microphone Access Denied',
                message: 'Please allow microphone access to use audio reactive mode.',
                severity: 'error',
                recoverable: true,
                instructions: [
                    'Click the microphone icon in your browser\'s address bar',
                    'Select "Allow" for microphone access',
                    'Refresh the page and try again'
                ],
                actions: [
                    { text: 'Try Again', action: 'retry' },
                    { text: 'Use System Audio', action: 'switchToSystem' },
                    { text: 'Disable Audio Mode', action: 'disable' }
                ]
            },
            
            SYSTEM_AUDIO_PERMISSION_DENIED: {
                title: 'System Audio Sharing Denied',
                message: 'System audio sharing was cancelled. Please try again and enable audio sharing.',
                severity: 'error',
                recoverable: true,
                instructions: [
                    'Click "Share" when prompted for screen sharing',
                    'Check the "Share system audio" checkbox',
                    'Select the correct screen or application'
                ],
                actions: [
                    { text: 'Try Again', action: 'retry' },
                    { text: 'Use Microphone', action: 'switchToMicrophone' },
                    { text: 'Disable Audio Mode', action: 'disable' }
                ]
            },
            
            // Device errors
            NO_MICROPHONE_DEVICE: {
                title: 'No Microphone Found',
                message: 'No microphone device was detected. Please connect an audio input device.',
                severity: 'error',
                recoverable: true,
                instructions: [
                    'Connect a microphone or headset to your device',
                    'Check your system audio settings',
                    'Ensure the microphone is not muted or disabled'
                ],
                actions: [
                    { text: 'Try Again', action: 'retry' },
                    { text: 'Check System Settings', action: 'openSystemSettings' },
                    { text: 'Disable Audio Mode', action: 'disable' }
                ]
            },
            
            NO_SYSTEM_AUDIO: {
                title: 'No System Audio Available',
                message: 'System audio could not be captured. Make sure audio is playing and sharing is enabled.',
                severity: 'error',
                recoverable: true,
                instructions: [
                    'Ensure audio is playing on your system',
                    'Enable "Share system audio" in the sharing dialog',
                    'Try sharing a specific application window'
                ],
                actions: [
                    { text: 'Try Again', action: 'retry' },
                    { text: 'Use Microphone', action: 'switchToMicrophone' },
                    { text: 'Disable Audio Mode', action: 'disable' }
                ]
            },
            
            // Hardware errors
            MICROPHONE_HARDWARE_ERROR: {
                title: 'Microphone Hardware Error',
                message: 'The microphone is already in use by another application or has a hardware issue.',
                severity: 'error',
                recoverable: true,
                instructions: [
                    'Close other applications that might be using the microphone',
                    'Check microphone connections and cables',
                    'Try unplugging and reconnecting the microphone'
                ],
                actions: [
                    { text: 'Try Again', action: 'retry' },
                    { text: 'Use System Audio', action: 'switchToSystem' },
                    { text: 'Disable Audio Mode', action: 'disable' }
                ]
            },
            
            // Browser support errors
            WEB_AUDIO_UNSUPPORTED: {
                title: 'Browser Not Supported',
                message: 'Your browser does not support the Web Audio API required for audio reactive mode.',
                severity: 'error',
                recoverable: false,
                instructions: [
                    'Update your browser to the latest version',
                    'Try using Chrome, Firefox, Safari, or Edge',
                    'Enable JavaScript if it\'s disabled'
                ],
                actions: [
                    { text: 'Update Browser', action: 'updateBrowser' },
                    { text: 'Try Different Browser', action: 'tryDifferentBrowser' }
                ]
            },
            
            SYSTEM_AUDIO_NOT_SUPPORTED: {
                title: 'System Audio Not Supported',
                message: 'System audio capture is not supported in this browser. Try Chrome or Edge.',
                severity: 'warning',
                recoverable: true,
                instructions: [
                    'Use Google Chrome or Microsoft Edge for system audio',
                    'Update your browser to the latest version',
                    'Use microphone input as an alternative'
                ],
                actions: [
                    { text: 'Use Microphone', action: 'switchToMicrophone' },
                    { text: 'Try Chrome/Edge', action: 'tryDifferentBrowser' },
                    { text: 'Disable Audio Mode', action: 'disable' }
                ]
            },
            
            // Connection errors
            CONNECTION_LOST: {
                title: 'Audio Connection Lost',
                message: 'The audio connection was lost. Attempting to reconnect automatically.',
                severity: 'warning',
                recoverable: true,
                instructions: [
                    'Check your microphone or audio device connection',
                    'Ensure the audio source is still available',
                    'Wait for automatic reconnection or try manually'
                ],
                actions: [
                    { text: 'Reconnect Now', action: 'reconnect' },
                    { text: 'Switch Source', action: 'switchSource' },
                    { text: 'Disable Audio Mode', action: 'disable' }
                ]
            },
            
            RECONNECTION_FAILED: {
                title: 'Reconnection Failed',
                message: 'Unable to reconnect to the audio source after multiple attempts.',
                severity: 'error',
                recoverable: true,
                instructions: [
                    'Check your audio device connections',
                    'Try switching to a different audio source',
                    'Restart the audio mode manually'
                ],
                actions: [
                    { text: 'Try Different Source', action: 'switchSource' },
                    { text: 'Restart Audio Mode', action: 'restart' },
                    { text: 'Disable Audio Mode', action: 'disable' }
                ]
            },
            
            // Audio level warnings
            LOW_AUDIO_LEVEL: {
                title: 'Low Audio Level Detected',
                message: 'Audio levels are very low. Increase volume or check your audio source.',
                severity: 'warning',
                recoverable: true,
                instructions: [
                    'Increase the volume of your audio source',
                    'Check microphone sensitivity settings',
                    'Move closer to the microphone if using one'
                ],
                actions: [
                    { text: 'Adjust Sensitivity', action: 'adjustSensitivity' },
                    { text: 'Check Audio Settings', action: 'openAudioSettings' },
                    { text: 'Dismiss', action: 'dismiss' }
                ]
            },
            
            AUDIO_SILENCE_DETECTED: {
                title: 'No Audio Detected',
                message: 'No audio has been detected for several seconds. Switching to normal mode.',
                severity: 'info',
                recoverable: true,
                instructions: [
                    'Start playing audio to re-enable reactive mode',
                    'Check that your audio source is working',
                    'Verify audio is not muted'
                ],
                actions: [
                    { text: 'Check Audio Source', action: 'checkAudioSource' },
                    { text: 'Stay in Audio Mode', action: 'stayInAudioMode' },
                    { text: 'Switch to Normal Mode', action: 'switchToNormal' }
                ]
            },
            
            // Performance errors
            PERFORMANCE_DEGRADED: {
                title: 'Performance Issues Detected',
                message: 'Audio processing is impacting performance. Quality has been reduced automatically.',
                severity: 'warning',
                recoverable: true,
                instructions: [
                    'Close other resource-intensive applications',
                    'Reduce audio quality settings if needed',
                    'Consider using a more powerful device'
                ],
                actions: [
                    { text: 'Optimize Settings', action: 'optimizeSettings' },
                    { text: 'Reduce Quality', action: 'reduceQuality' },
                    { text: 'Disable Audio Mode', action: 'disable' }
                ]
            }
        }
    }
    
    /**
     * Initialize recovery strategies for different error types
     * @returns {Object} Recovery strategies
     */
    initializeRecoveryStrategies() {
        return {
            PERMISSION_DENIED: [
                { strategy: 'requestPermissionAgain', priority: 1 },
                { strategy: 'switchToAlternativeSource', priority: 2 },
                { strategy: 'showPermissionInstructions', priority: 3 },
                { strategy: 'fallbackToNormalMode', priority: 4 }
            ],
            
            DEVICE_NOT_FOUND: [
                { strategy: 'detectAvailableDevices', priority: 1 },
                { strategy: 'switchToAlternativeSource', priority: 2 },
                { strategy: 'showDeviceInstructions', priority: 3 },
                { strategy: 'fallbackToNormalMode', priority: 4 }
            ],
            
            CONNECTION_LOST: [
                { strategy: 'attemptReconnection', priority: 1 },
                { strategy: 'switchToAlternativeSource', priority: 2 },
                { strategy: 'fallbackToNormalMode', priority: 3 }
            ],
            
            BROWSER_UNSUPPORTED: [
                { strategy: 'showBrowserInstructions', priority: 1 },
                { strategy: 'fallbackToNormalMode', priority: 2 }
            ],
            
            LOW_AUDIO: [
                { strategy: 'adjustSensitivity', priority: 1 },
                { strategy: 'showAudioLevelInstructions', priority: 2 },
                { strategy: 'continueWithLowAudio', priority: 3 }
            ],
            
            PERFORMANCE_ISSUES: [
                { strategy: 'reduceAudioQuality', priority: 1 },
                { strategy: 'optimizeSettings', priority: 2 },
                { strategy: 'fallbackToNormalMode', priority: 3 }
            ]
        }
    }
    
    /**
     * Handle an error with comprehensive error processing
     * @param {Object} error - Error object with type, message, and context
     * @param {Object} context - Additional context information
     * @returns {Object} Error handling result
     */
    handleError(error, context = {}) {
        const timestamp = Date.now()
        
        // Add to error history
        this.errorHistory.push({
            ...error,
            timestamp,
            context
        })
        
        // Limit error history size
        if (this.errorHistory.length > 50) {
            this.errorHistory.shift()
        }
        
        // Check for consecutive errors
        if (timestamp - this.lastErrorTime < 5000) { // Within 5 seconds
            this.consecutiveErrors++
        } else {
            this.consecutiveErrors = 1
        }
        
        this.lastErrorTime = timestamp
        this.currentError = error
        
        // Get error message template
        const errorTemplate = this.errorMessages[error.error] || this.getGenericErrorTemplate(error)
        
        // Create comprehensive error info
        const errorInfo = {
            ...error,
            ...errorTemplate,
            timestamp,
            consecutiveErrors: this.consecutiveErrors,
            context,
            recoveryStrategies: this.getRecoveryStrategies(error.error)
        }
        
        // Determine if we should attempt automatic recovery
        const shouldAutoRecover = this.shouldAttemptAutoRecovery(errorInfo)
        
        if (shouldAutoRecover) {
            return this.attemptAutoRecovery(errorInfo)
        } else {
            return this.showErrorToUser(errorInfo)
        }
    }
    
    /**
     * Get generic error template for unknown errors
     * @param {Object} error - Error object
     * @returns {Object} Generic error template
     */
    getGenericErrorTemplate(error) {
        return {
            title: 'Audio Error',
            message: error.message || 'An unexpected audio error occurred.',
            severity: 'error',
            recoverable: true,
            instructions: [
                'Try refreshing the page',
                'Check your audio device connections',
                'Try using a different browser'
            ],
            actions: [
                { text: 'Try Again', action: 'retry' },
                { text: 'Disable Audio Mode', action: 'disable' }
            ]
        }
    }
    
    /**
     * Get recovery strategies for error type
     * @param {string} errorType - Type of error
     * @returns {Array} Array of recovery strategies
     */
    getRecoveryStrategies(errorType) {
        // Map error types to strategy categories
        const strategyMap = {
            'MICROPHONE_PERMISSION_DENIED': 'PERMISSION_DENIED',
            'SYSTEM_AUDIO_PERMISSION_DENIED': 'PERMISSION_DENIED',
            'NO_MICROPHONE_DEVICE': 'DEVICE_NOT_FOUND',
            'NO_SYSTEM_AUDIO': 'DEVICE_NOT_FOUND',
            'CONNECTION_LOST': 'CONNECTION_LOST',
            'RECONNECTION_FAILED': 'CONNECTION_LOST',
            'WEB_AUDIO_UNSUPPORTED': 'BROWSER_UNSUPPORTED',
            'SYSTEM_AUDIO_NOT_SUPPORTED': 'BROWSER_UNSUPPORTED',
            'LOW_AUDIO_LEVEL': 'LOW_AUDIO',
            'PERFORMANCE_DEGRADED': 'PERFORMANCE_ISSUES'
        }
        
        const strategyCategory = strategyMap[errorType] || 'PERMISSION_DENIED'
        return this.recoveryStrategies[strategyCategory] || []
    }
    
    /**
     * Determine if automatic recovery should be attempted
     * @param {Object} errorInfo - Comprehensive error information
     * @returns {boolean} Whether to attempt auto recovery
     */
    shouldAttemptAutoRecovery(errorInfo) {
        // Don't auto-recover if too many consecutive errors
        if (this.consecutiveErrors >= this.config.maxConsecutiveErrors) {
            return false
        }
        
        // Don't auto-recover for certain error types
        const noAutoRecoveryErrors = [
            'MICROPHONE_PERMISSION_DENIED',
            'SYSTEM_AUDIO_PERMISSION_DENIED',
            'WEB_AUDIO_UNSUPPORTED',
            'NO_MICROPHONE_DEVICE'
        ]
        
        if (noAutoRecoveryErrors.includes(errorInfo.error)) {
            return false
        }
        
        // Auto-recover for connection issues and performance problems
        const autoRecoveryErrors = [
            'CONNECTION_LOST',
            'PERFORMANCE_DEGRADED',
            'LOW_AUDIO_LEVEL'
        ]
        
        return autoRecoveryErrors.includes(errorInfo.error)
    }
    
    /**
     * Attempt automatic error recovery
     * @param {Object} errorInfo - Error information
     * @returns {Object} Recovery result
     */
    async attemptAutoRecovery(errorInfo) {
        const strategies = errorInfo.recoveryStrategies.sort((a, b) => a.priority - b.priority)
        
        for (const strategy of strategies) {
            try {
                const result = await this.executeRecoveryStrategy(strategy.strategy, errorInfo)
                
                if (result.success) {
                    // Recovery successful
                    this.consecutiveErrors = 0
                    this.currentError = null
                    
                    if (this.callbacks.onRecovery) {
                        this.callbacks.onRecovery({
                            originalError: errorInfo,
                            recoveryStrategy: strategy.strategy,
                            result
                        })
                    }
                    
                    return {
                        handled: true,
                        recovered: true,
                        strategy: strategy.strategy,
                        result
                    }
                }
            } catch (recoveryError) {
                console.warn(`Recovery strategy ${strategy.strategy} failed:`, recoveryError)
            }
        }
        
        // All recovery strategies failed, show error to user
        return this.showErrorToUser(errorInfo)
    }
    
    /**
     * Execute a specific recovery strategy
     * @param {string} strategy - Recovery strategy name
     * @param {Object} errorInfo - Error information
     * @returns {Promise<Object>} Recovery result
     */
    async executeRecoveryStrategy(strategy, errorInfo) {
        switch (strategy) {
            case 'attemptReconnection':
                return this.attemptReconnection(errorInfo)
                
            case 'switchToAlternativeSource':
                return this.switchToAlternativeSource(errorInfo)
                
            case 'adjustSensitivity':
                return this.adjustSensitivity(errorInfo)
                
            case 'reduceAudioQuality':
                return this.reduceAudioQuality(errorInfo)
                
            case 'fallbackToNormalMode':
                return this.fallbackToNormalMode(errorInfo)
                
            default:
                return { success: false, message: `Unknown recovery strategy: ${strategy}` }
        }
    }
    
    /**
     * Attempt to reconnect to audio source
     * @param {Object} errorInfo - Error information
     * @returns {Promise<Object>} Reconnection result
     */
    async attemptReconnection(errorInfo) {
        if (this.callbacks.onUserAction) {
            const result = await this.callbacks.onUserAction('reconnect', errorInfo.context)
            return { success: result.success, message: result.message }
        }
        
        return { success: false, message: 'No reconnection callback available' }
    }
    
    /**
     * Switch to alternative audio source
     * @param {Object} errorInfo - Error information
     * @returns {Promise<Object>} Switch result
     */
    async switchToAlternativeSource(errorInfo) {
        const currentSource = errorInfo.context.currentSource
        const alternativeSource = currentSource === 'microphone' ? 'system' : 'microphone'
        
        if (this.callbacks.onUserAction) {
            const result = await this.callbacks.onUserAction('switchSource', { 
                newSource: alternativeSource,
                reason: 'auto_recovery'
            })
            
            if (result.success) {
                this.showRecoveryMessage(`Switched to ${alternativeSource} due to ${currentSource} issues`)
            }
            
            return { success: result.success, message: result.message }
        }
        
        return { success: false, message: 'No source switching callback available' }
    }
    
    /**
     * Adjust audio sensitivity automatically
     * @param {Object} errorInfo - Error information
     * @returns {Promise<Object>} Adjustment result
     */
    async adjustSensitivity(errorInfo) {
        if (this.callbacks.onUserAction) {
            // Increase sensitivity for low audio
            const newSensitivity = Math.min((errorInfo.context.currentSensitivity || 1.0) * 1.5, 3.0)
            
            const result = await this.callbacks.onUserAction('adjustSensitivity', { 
                sensitivity: newSensitivity,
                reason: 'auto_recovery'
            })
            
            if (result.success) {
                this.showRecoveryMessage(`Increased audio sensitivity to ${newSensitivity.toFixed(1)}x`)
            }
            
            return { success: result.success, message: result.message }
        }
        
        return { success: false, message: 'No sensitivity adjustment callback available' }
    }
    
    /**
     * Reduce audio quality for performance
     * @param {Object} errorInfo - Error information
     * @returns {Promise<Object>} Quality reduction result
     */
    async reduceAudioQuality(errorInfo) {
        if (this.callbacks.onUserAction) {
            const result = await this.callbacks.onUserAction('reduceQuality', {
                reason: 'performance_recovery'
            })
            
            if (result.success) {
                this.showRecoveryMessage('Reduced audio quality to improve performance')
            }
            
            return { success: result.success, message: result.message }
        }
        
        return { success: false, message: 'No quality reduction callback available' }
    }
    
    /**
     * Fallback to normal mode
     * @param {Object} errorInfo - Error information
     * @returns {Promise<Object>} Fallback result
     */
    async fallbackToNormalMode(errorInfo) {
        this.fallbackMode = true
        this.originalMode = errorInfo.context.currentMode || 'reactive'
        this.fallbackReason = errorInfo.error
        
        if (this.callbacks.onFallback) {
            this.callbacks.onFallback({
                reason: errorInfo.error,
                originalMode: this.originalMode,
                fallbackMode: 'normal'
            })
        }
        
        this.showRecoveryMessage('Switched to normal mode due to audio issues')
        
        return { success: true, message: 'Fallback to normal mode successful' }
    }
    
    /**
     * Show error to user with UI feedback
     * @param {Object} errorInfo - Error information
     * @returns {Object} Display result
     */
    showErrorToUser(errorInfo) {
        if (this.callbacks.onError) {
            this.callbacks.onError(errorInfo)
        }
        
        // Update status indicator
        if (this.callbacks.onStatusChange) {
            this.callbacks.onStatusChange('error', errorInfo.title)
        }
        
        return {
            handled: true,
            recovered: false,
            displayed: true,
            errorInfo
        }
    }
    
    /**
     * Show recovery message to user
     * @param {string} message - Recovery message
     */
    showRecoveryMessage(message) {
        if (this.callbacks.onRecovery) {
            this.callbacks.onRecovery({
                type: 'auto_recovery',
                message,
                timestamp: Date.now()
            })
        }
    }
    
    /**
     * Monitor audio levels for low audio detection
     * @param {number} audioLevel - Current audio level (0-1)
     */
    monitorAudioLevel(audioLevel) {
        this.lastAudioLevel = audioLevel
        this.audioLevelHistory.push({
            level: audioLevel,
            timestamp: Date.now()
        })
        
        // Limit history size
        if (this.audioLevelHistory.length > 100) {
            this.audioLevelHistory.shift()
        }
        
        // Check for low audio
        if (audioLevel < this.config.lowAudioThreshold) {
            if (!this.lowAudioStartTime) {
                this.lowAudioStartTime = Date.now()
            } else if (Date.now() - this.lowAudioStartTime > this.config.lowAudioDuration) {
                this.handleLowAudio()
            }
        } else {
            this.lowAudioStartTime = null
        }
        
        // Check for silence
        if (audioLevel < this.config.silenceThreshold) {
            if (!this.silenceStartTime) {
                this.silenceStartTime = Date.now()
            } else if (Date.now() - this.silenceStartTime > this.config.silenceDuration) {
                this.handleSilenceDetected()
            }
        } else {
            this.silenceStartTime = null
        }
    }
    
    /**
     * Handle low audio level detection
     */
    handleLowAudio() {
        if (this.currentError && this.currentError.error === 'LOW_AUDIO_LEVEL') {
            return // Already handling low audio
        }
        
        this.handleError({
            error: 'LOW_AUDIO_LEVEL',
            message: 'Audio levels are very low'
        }, {
            currentLevel: this.lastAudioLevel,
            threshold: this.config.lowAudioThreshold,
            duration: this.config.lowAudioDuration
        })
        
        this.lowAudioStartTime = null // Reset to avoid repeated warnings
    }
    
    /**
     * Handle silence detection
     */
    handleSilenceDetected() {
        if (this.fallbackMode) {
            return // Already in fallback mode
        }
        
        this.handleError({
            error: 'AUDIO_SILENCE_DETECTED',
            message: 'No audio detected for extended period'
        }, {
            silenceDuration: Date.now() - this.silenceStartTime,
            threshold: this.config.silenceThreshold
        })
        
        this.silenceStartTime = null // Reset
    }
    
    /**
     * Handle connection status changes
     * @param {boolean} connected - Connection status
     * @param {string} source - Audio source
     */
    handleConnectionChange(connected, source) {
        if (!connected && this.currentError?.error !== 'CONNECTION_LOST') {
            this.handleError({
                error: 'CONNECTION_LOST',
                message: `Connection to ${source} was lost`
            }, {
                source,
                previouslyConnected: true
            })
        } else if (connected && this.currentError?.error === 'CONNECTION_LOST') {
            // Connection restored
            this.clearError()
            this.showRecoveryMessage(`Connection to ${source} restored`)
        }
        
        if (this.callbacks.onStatusChange) {
            this.callbacks.onStatusChange(
                connected ? 'connected' : 'disconnected',
                connected ? `Connected to ${source}` : `Disconnected from ${source}`
            )
        }
    }
    
    /**
     * Clear current error
     */
    clearError() {
        this.currentError = null
        this.consecutiveErrors = 0
        
        if (this.callbacks.onStatusChange) {
            this.callbacks.onStatusChange('normal', 'Audio system normal')
        }
    }
    
    /**
     * Get current error handler state
     * @returns {Object} Current state
     */
    getState() {
        return {
            hasError: !!this.currentError,
            currentError: this.currentError,
            fallbackMode: this.fallbackMode,
            consecutiveErrors: this.consecutiveErrors,
            errorHistory: [...this.errorHistory],
            lastErrorTime: this.lastErrorTime,
            originalMode: this.originalMode,
            fallbackReason: this.fallbackReason
        }
    }
    
    /**
     * Set event callbacks
     * @param {Object} callbacks - Callback functions
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks }
    }
    
    /**
     * Reset error handler state
     */
    reset() {
        this.currentError = null
        this.consecutiveErrors = 0
        this.lastErrorTime = 0
        this.errorHistory = []
        this.audioLevelHistory = []
        this.lowAudioStartTime = null
        this.silenceStartTime = null
        this.lastAudioLevel = 0
        this.fallbackMode = false
        this.originalMode = null
        this.fallbackReason = null
    }
    
    /**
     * Dispose of error handler resources
     */
    dispose() {
        this.reset()
        this.callbacks = {}
    }
}