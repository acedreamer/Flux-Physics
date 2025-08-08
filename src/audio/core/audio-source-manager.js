/**
 * FLUX Audio Reactive Mode - Audio Source Manager
 * 
 * Manages audio input sources with support for:
 * - Microphone input with permission handling
 * - System audio capture using getDisplayMedia API
 * - Audio source switching between microphone and system
 * - Fallback handling for unsupported audio capture methods
 * - Automatic reconnection for failed audio sources
 * - Cross-browser compatibility detection
 */

export class AudioSourceManager {
    constructor(options = {}) {
        this.currentSource = null
        this.currentStream = null
        this.audioContext = null
        this.sourceNode = null
        this.isConnected = false
        this.reconnectAttempts = 0
        this.maxReconnectAttempts = 3
        
        // Configuration
        this.config = {
            reconnectDelay: 2000, // ms
            reconnectBackoffMultiplier: 1.5,
            maxReconnectDelay: 10000, // ms
            streamConstraints: {
                microphone: {
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false,
                        sampleRate: 44100
                    }
                },
                system: {
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false,
                        sampleRate: 44100
                    },
                    video: false
                }
            },
            ...options
        }
        
        // Event callbacks
        this.callbacks = {
            onSourceChange: null,
            onConnectionChange: null,
            onError: null,
            onReconnectAttempt: null
        }
        
        // Browser capability detection
        this.capabilities = this.detectCapabilities()
        
        // Reconnection state
        this.reconnectTimer = null
        this.reconnectInProgress = false
        
        // Stream monitoring
        this.streamMonitor = null
        this.lastAudioLevel = 0
        this.silenceDetectionThreshold = 0.001
        this.silenceDetectionDuration = 5000 // ms
        this.lastAudioTime = 0
    }
    
    /**
     * Detect browser capabilities for audio capture
     * @returns {Object} Capability detection results
     */
    detectCapabilities() {
        const capabilities = {
            getUserMedia: false,
            getDisplayMedia: false,
            systemAudio: false,
            webAudio: false,
            mediaRecorder: false
        }
        
        // Check getUserMedia support
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            capabilities.getUserMedia = true
        }
        
        // Check getDisplayMedia support
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
            capabilities.getDisplayMedia = true
            
            // System audio support varies by browser
            const userAgent = navigator.userAgent.toLowerCase()
            if (userAgent.includes('chrome') || userAgent.includes('edge')) {
                capabilities.systemAudio = true
            }
        }
        
        // Check Web Audio API support
        if (window.AudioContext || window.webkitAudioContext) {
            capabilities.webAudio = true
        }
        
        // Check MediaRecorder support
        if (window.MediaRecorder) {
            capabilities.mediaRecorder = true
        }
        
        return capabilities
    }
    
    /**
     * Get supported audio sources based on browser capabilities
     * @returns {Array} Array of supported source types
     */
    getSupportedSources() {
        const sources = []
        
        if (this.capabilities.getUserMedia) {
            sources.push({
                type: 'microphone',
                name: 'Microphone',
                description: 'Capture audio from device microphone',
                supported: true,
                recommended: true
            })
        }
        
        if (this.capabilities.getDisplayMedia) {
            sources.push({
                type: 'system',
                name: 'System Audio',
                description: 'Capture audio from system/desktop',
                supported: this.capabilities.systemAudio,
                recommended: false,
                note: this.capabilities.systemAudio ? 
                    'Requires screen sharing permission' : 
                    'Limited browser support'
            })
        }
        
        return sources
    }
    
    /**
     * Initialize audio source manager with audio context
     * @param {AudioContext} audioContext - Web Audio API context
     * @returns {Promise<{success: boolean, error?: string, message?: string}>}
     */
    async initialize(audioContext) {
        try {
            if (!audioContext) {
                return {
                    success: false,
                    error: 'INVALID_AUDIO_CONTEXT',
                    message: 'Valid AudioContext required for initialization'
                }
            }
            
            this.audioContext = audioContext
            return { success: true }
            
        } catch (error) {
            return {
                success: false,
                error: 'INITIALIZATION_FAILED',
                message: `Audio source manager initialization failed: ${error.message}`
            }
        }
    }
    
    /**
     * Connect to specified audio source with fallback handling
     * @param {string} sourceType - 'microphone' or 'system'
     * @param {Object} options - Connection options
     * @returns {Promise<{success: boolean, source?: string, error?: string, message?: string}>}
     */
    async connectSource(sourceType, options = {}) {
        try {
            // Disconnect current source if connected
            if (this.isConnected) {
                await this.disconnect()
            }
            
            // Reset reconnection state
            this.reconnectAttempts = 0
            this.clearReconnectTimer()
            
            // Attempt to connect to requested source
            let result = await this.attemptConnection(sourceType, options)
            
            // If primary source fails, try fallback
            if (!result.success && options.allowFallback !== false) {
                const fallbackSource = sourceType === 'microphone' ? 'system' : 'microphone'
                
                if (this.isSourceSupported(fallbackSource)) {
                    console.warn(`Primary source '${sourceType}' failed, trying fallback '${fallbackSource}'`)
                    
                    if (this.callbacks.onError) {
                        this.callbacks.onError({
                            type: 'FALLBACK_ATTEMPT',
                            message: `Switching to ${fallbackSource} due to ${sourceType} failure`,
                            originalError: result.error
                        })
                    }
                    
                    result = await this.attemptConnection(fallbackSource, options)
                    
                    if (result.success) {
                        result.fallbackUsed = true
                        result.originalSource = sourceType
                    }
                }
            }
            
            if (result.success) {
                this.startStreamMonitoring()
                
                if (this.callbacks.onConnectionChange) {
                    this.callbacks.onConnectionChange(true, this.currentSource)
                }
            }
            
            return result
            
        } catch (error) {
            return {
                success: false,
                error: 'CONNECTION_FAILED',
                message: `Failed to connect audio source: ${error.message}`
            }
        }
    }
    
    /**
     * Attempt connection to specific audio source
     * @param {string} sourceType - Source type to connect to
     * @param {Object} options - Connection options
     * @returns {Promise<{success: boolean, source?: string, error?: string, message?: string}>}
     */
    async attemptConnection(sourceType, options = {}) {
        if (!this.isSourceSupported(sourceType)) {
            return {
                success: false,
                error: 'SOURCE_UNSUPPORTED',
                message: `Audio source '${sourceType}' is not supported in this browser`
            }
        }
        
        try {
            let stream
            
            if (sourceType === 'microphone') {
                stream = await this.requestMicrophoneAccess(options)
            } else if (sourceType === 'system') {
                stream = await this.requestSystemAudioAccess(options)
            } else {
                return {
                    success: false,
                    error: 'INVALID_SOURCE',
                    message: `Invalid audio source type: ${sourceType}`
                }
            }
            
            if (!stream.success) {
                return stream
            }
            
            // Create audio source node
            this.sourceNode = this.audioContext.createMediaStreamSource(stream.stream)
            this.currentStream = stream.stream
            this.currentSource = sourceType
            this.isConnected = true
            
            // Setup stream event listeners
            this.setupStreamEventListeners()
            
            if (this.callbacks.onSourceChange) {
                this.callbacks.onSourceChange(sourceType, stream.stream)
            }
            
            return {
                success: true,
                source: sourceType,
                stream: stream.stream,
                sourceNode: this.sourceNode
            }
            
        } catch (error) {
            return {
                success: false,
                error: 'CONNECTION_ERROR',
                message: `Failed to connect to ${sourceType}: ${error.message}`
            }
        }
    }
    
    /**
     * Request microphone access with detailed error handling
     * @param {Object} options - Microphone options
     * @returns {Promise<{success: boolean, stream?: MediaStream, error?: string, message?: string}>}
     */
    async requestMicrophoneAccess(options = {}) {
        try {
            if (!this.capabilities.getUserMedia) {
                return {
                    success: false,
                    error: 'MICROPHONE_UNSUPPORTED',
                    message: 'Microphone access is not supported in this browser'
                }
            }
            
            const constraints = {
                ...this.config.streamConstraints.microphone,
                ...options.constraints
            }
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints)
            
            // Verify audio tracks are available
            const audioTracks = stream.getAudioTracks()
            if (audioTracks.length === 0) {
                stream.getTracks().forEach(track => track.stop())
                return {
                    success: false,
                    error: 'NO_AUDIO_TRACKS',
                    message: 'No audio tracks available from microphone'
                }
            }
            
            return { success: true, stream }
            
        } catch (error) {
            return this.handleMicrophoneError(error)
        }
    }
    
    /**
     * Request system audio access using getDisplayMedia API
     * @param {Object} options - System audio options
     * @returns {Promise<{success: boolean, stream?: MediaStream, error?: string, message?: string}>}
     */
    async requestSystemAudioAccess(options = {}) {
        try {
            if (!this.capabilities.getDisplayMedia) {
                return {
                    success: false,
                    error: 'SYSTEM_AUDIO_UNSUPPORTED',
                    message: 'System audio capture is not supported in this browser'
                }
            }
            
            if (!this.capabilities.systemAudio) {
                return {
                    success: false,
                    error: 'SYSTEM_AUDIO_LIMITED',
                    message: 'System audio capture has limited support in this browser. Try Chrome or Edge.'
                }
            }
            
            const constraints = {
                ...this.config.streamConstraints.system,
                ...options.constraints
            }
            
            // Request display media with audio
            const stream = await navigator.mediaDevices.getDisplayMedia(constraints)
            
            // Verify audio tracks are available
            const audioTracks = stream.getAudioTracks()
            if (audioTracks.length === 0) {
                stream.getTracks().forEach(track => track.stop())
                return {
                    success: false,
                    error: 'NO_SYSTEM_AUDIO',
                    message: 'No system audio available. Please ensure "Share system audio" is enabled in the permission dialog.'
                }
            }
            
            // Stop video tracks if present (we only want audio)
            const videoTracks = stream.getVideoTracks()
            videoTracks.forEach(track => track.stop())
            
            return { success: true, stream }
            
        } catch (error) {
            return this.handleSystemAudioError(error)
        }
    }
    
    /**
     * Handle microphone access errors
     * @param {Error} error - Error object
     * @returns {Object} Formatted error response
     */
    handleMicrophoneError(error) {
        switch (error.name) {
            case 'NotAllowedError':
                return {
                    success: false,
                    error: 'MICROPHONE_PERMISSION_DENIED',
                    message: 'Microphone access denied. Please enable microphone permissions in your browser settings.',
                    instructions: [
                        'Click the microphone icon in your browser\'s address bar',
                        'Select "Allow" for microphone access',
                        'Refresh the page and try again'
                    ]
                }
                
            case 'NotFoundError':
                return {
                    success: false,
                    error: 'NO_MICROPHONE_DEVICE',
                    message: 'No microphone found. Please connect an audio input device.',
                    instructions: [
                        'Connect a microphone or headset',
                        'Check your system audio settings',
                        'Ensure the microphone is not muted'
                    ]
                }
                
            case 'NotReadableError':
                return {
                    success: false,
                    error: 'MICROPHONE_HARDWARE_ERROR',
                    message: 'Microphone is already in use or has a hardware error.',
                    instructions: [
                        'Close other applications using the microphone',
                        'Check microphone connections',
                        'Try a different microphone if available'
                    ]
                }
                
            case 'OverconstrainedError':
                return {
                    success: false,
                    error: 'MICROPHONE_CONSTRAINTS_ERROR',
                    message: 'Microphone does not support the requested audio settings.',
                    instructions: [
                        'Try with different audio quality settings',
                        'Check microphone specifications',
                        'Use a different microphone if available'
                    ]
                }
                
            case 'SecurityError':
                return {
                    success: false,
                    error: 'MICROPHONE_SECURITY_ERROR',
                    message: 'Microphone access blocked due to security restrictions.',
                    instructions: [
                        'Ensure you\'re using HTTPS',
                        'Check browser security settings',
                        'Try in a different browser'
                    ]
                }
                
            default:
                return {
                    success: false,
                    error: 'MICROPHONE_UNKNOWN_ERROR',
                    message: `Microphone access failed: ${error.message}`,
                    instructions: [
                        'Try refreshing the page',
                        'Check browser permissions',
                        'Try in a different browser'
                    ]
                }
        }
    }
    
    /**
     * Handle system audio access errors
     * @param {Error} error - Error object
     * @returns {Object} Formatted error response
     */
    handleSystemAudioError(error) {
        switch (error.name) {
            case 'NotAllowedError':
                return {
                    success: false,
                    error: 'SYSTEM_AUDIO_PERMISSION_DENIED',
                    message: 'System audio sharing was denied or cancelled.',
                    instructions: [
                        'Click "Share" when prompted for screen sharing',
                        'Ensure "Share system audio" checkbox is checked',
                        'Select the correct screen/window to share'
                    ]
                }
                
            case 'NotFoundError':
                return {
                    success: false,
                    error: 'NO_SYSTEM_AUDIO_SOURCE',
                    message: 'No system audio source available for sharing.',
                    instructions: [
                        'Ensure audio is playing on your system',
                        'Check system audio settings',
                        'Try playing audio from a different application'
                    ]
                }
                
            case 'NotSupportedError':
                return {
                    success: false,
                    error: 'SYSTEM_AUDIO_NOT_SUPPORTED',
                    message: 'System audio capture is not supported in this browser.',
                    instructions: [
                        'Try using Chrome or Microsoft Edge',
                        'Update your browser to the latest version',
                        'Use microphone input as an alternative'
                    ]
                }
                
            case 'AbortError':
                return {
                    success: false,
                    error: 'SYSTEM_AUDIO_ABORTED',
                    message: 'System audio sharing was cancelled by the user.',
                    instructions: [
                        'Try again and click "Share" when prompted',
                        'Select the correct screen/application',
                        'Ensure "Share system audio" is enabled'
                    ]
                }
                
            default:
                return {
                    success: false,
                    error: 'SYSTEM_AUDIO_UNKNOWN_ERROR',
                    message: `System audio capture failed: ${error.message}`,
                    instructions: [
                        'Try using a supported browser (Chrome/Edge)',
                        'Check system audio permissions',
                        'Use microphone input as fallback'
                    ]
                }
        }
    }
    
    /**
     * Switch between audio sources
     * @param {string} newSource - New source type to switch to
     * @param {Object} options - Switch options
     * @returns {Promise<{success: boolean, source?: string, error?: string, message?: string}>}
     */
    async switchSource(newSource, options = {}) {
        if (newSource === this.currentSource) {
            return {
                success: true,
                source: this.currentSource,
                message: `Already connected to ${newSource}`
            }
        }
        
        const previousSource = this.currentSource
        
        try {
            // Attempt to connect to new source
            const result = await this.connectSource(newSource, {
                ...options,
                allowFallback: false // Don't fallback during explicit switch
            })
            
            if (result.success) {
                console.log(`Successfully switched from ${previousSource} to ${newSource}`)
                return result
            } else {
                // If switch fails, try to reconnect to previous source
                if (previousSource && options.restoreOnFailure !== false) {
                    console.warn(`Failed to switch to ${newSource}, attempting to restore ${previousSource}`)
                    
                    const restoreResult = await this.connectSource(previousSource, {
                        allowFallback: false
                    })
                    
                    if (restoreResult.success) {
                        return {
                            success: false,
                            error: result.error,
                            message: `Failed to switch to ${newSource}, restored ${previousSource}`,
                            restored: true,
                            currentSource: previousSource
                        }
                    }
                }
                
                return result
            }
            
        } catch (error) {
            return {
                success: false,
                error: 'SWITCH_FAILED',
                message: `Failed to switch audio source: ${error.message}`
            }
        }
    }
    
    /**
     * Setup stream event listeners for monitoring
     */
    setupStreamEventListeners() {
        if (!this.currentStream) return
        
        const audioTracks = this.currentStream.getAudioTracks()
        
        audioTracks.forEach(track => {
            track.addEventListener('ended', () => {
                console.warn('Audio track ended, attempting reconnection')
                this.handleStreamEnded()
            })
            
            track.addEventListener('mute', () => {
                console.warn('Audio track muted')
                if (this.callbacks.onError) {
                    this.callbacks.onError({
                        type: 'STREAM_MUTED',
                        message: 'Audio stream was muted'
                    })
                }
            })
            
            track.addEventListener('unmute', () => {
                console.log('Audio track unmuted')
            })
        })
    }
    
    /**
     * Start monitoring stream for silence and disconnection
     */
    startStreamMonitoring() {
        if (this.streamMonitor) {
            clearInterval(this.streamMonitor)
        }
        
        this.streamMonitor = setInterval(() => {
            this.checkStreamHealth()
        }, 1000) // Check every second
    }
    
    /**
     * Check stream health and detect issues
     */
    checkStreamHealth() {
        if (!this.currentStream || !this.isConnected) {
            return
        }
        
        const audioTracks = this.currentStream.getAudioTracks()
        
        // Check if tracks are still active
        const activeTrackCount = audioTracks.filter(track => 
            track.readyState === 'live' && track.enabled
        ).length
        
        if (activeTrackCount === 0) {
            console.warn('No active audio tracks detected')
            this.handleStreamEnded()
            return
        }
        
        // Check for prolonged silence (optional)
        // This would require additional audio analysis
        // Implementation depends on specific requirements
    }
    
    /**
     * Handle stream ended event
     */
    handleStreamEnded() {
        if (this.reconnectInProgress) {
            return // Already handling reconnection
        }
        
        this.isConnected = false
        
        if (this.callbacks.onConnectionChange) {
            this.callbacks.onConnectionChange(false, this.currentSource)
        }
        
        // Attempt automatic reconnection
        this.attemptReconnection()
    }
    
    /**
     * Attempt automatic reconnection to current source
     */
    async attemptReconnection() {
        if (this.reconnectInProgress || this.reconnectAttempts >= this.maxReconnectAttempts) {
            return
        }
        
        this.reconnectInProgress = true
        this.reconnectAttempts++
        
        const delay = Math.min(
            this.config.reconnectDelay * Math.pow(this.config.reconnectBackoffMultiplier, this.reconnectAttempts - 1),
            this.config.maxReconnectDelay
        )
        
        console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`)
        
        if (this.callbacks.onReconnectAttempt) {
            this.callbacks.onReconnectAttempt(this.reconnectAttempts, this.maxReconnectAttempts, delay)
        }
        
        this.reconnectTimer = setTimeout(async () => {
            try {
                const result = await this.attemptConnection(this.currentSource, {
                    allowFallback: true
                })
                
                if (result.success) {
                    console.log(`Reconnection successful after ${this.reconnectAttempts} attempts`)
                    this.reconnectAttempts = 0
                    this.reconnectInProgress = false
                    
                    if (this.callbacks.onConnectionChange) {
                        this.callbacks.onConnectionChange(true, this.currentSource)
                    }
                } else {
                    console.warn(`Reconnection attempt ${this.reconnectAttempts} failed:`, result.message)
                    this.reconnectInProgress = false
                    
                    // Try again if attempts remaining
                    if (this.reconnectAttempts < this.maxReconnectAttempts) {
                        setTimeout(() => this.attemptReconnection(), 1000)
                    } else {
                        console.error('Max reconnection attempts reached, giving up')
                        
                        if (this.callbacks.onError) {
                            this.callbacks.onError({
                                type: 'RECONNECTION_FAILED',
                                message: `Failed to reconnect after ${this.maxReconnectAttempts} attempts`,
                                finalError: result.error
                            })
                        }
                    }
                }
                
            } catch (error) {
                console.error('Reconnection error:', error)
                this.reconnectInProgress = false
                
                if (this.callbacks.onError) {
                    this.callbacks.onError({
                        type: 'RECONNECTION_ERROR',
                        message: `Reconnection error: ${error.message}`
                    })
                }
            }
        }, delay)
    }
    
    /**
     * Clear reconnection timer
     */
    clearReconnectTimer() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }
        this.reconnectInProgress = false
    }
    
    /**
     * Check if audio source is supported
     * @param {string} sourceType - Source type to check
     * @returns {boolean} Whether source is supported
     */
    isSourceSupported(sourceType) {
        switch (sourceType) {
            case 'microphone':
                return this.capabilities.getUserMedia
            case 'system':
                return this.capabilities.getDisplayMedia && this.capabilities.systemAudio
            default:
                return false
        }
    }
    
    /**
     * Get current connection status
     * @returns {Object} Connection status information
     */
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            currentSource: this.currentSource,
            reconnectAttempts: this.reconnectAttempts,
            reconnectInProgress: this.reconnectInProgress,
            capabilities: this.capabilities,
            supportedSources: this.getSupportedSources()
        }
    }
    
    /**
     * Get current audio source node for Web Audio API
     * @returns {MediaStreamAudioSourceNode|null} Current source node
     */
    getSourceNode() {
        return this.sourceNode
    }
    
    /**
     * Get current media stream
     * @returns {MediaStream|null} Current media stream
     */
    getStream() {
        return this.currentStream
    }
    
    /**
     * Set event callbacks
     * @param {Object} callbacks - Callback functions
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks }
    }
    
    /**
     * Disconnect current audio source
     * @returns {Promise<void>}
     */
    async disconnect() {
        this.clearReconnectTimer()
        
        if (this.streamMonitor) {
            clearInterval(this.streamMonitor)
            this.streamMonitor = null
        }
        
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop())
            this.currentStream = null
        }
        
        if (this.sourceNode) {
            this.sourceNode.disconnect()
            this.sourceNode = null
        }
        
        this.currentSource = null
        this.isConnected = false
        this.reconnectAttempts = 0
        
        if (this.callbacks.onConnectionChange) {
            this.callbacks.onConnectionChange(false, null)
        }
    }
    
    /**
     * Dispose of audio source manager and clean up resources
     */
    dispose() {
        this.disconnect()
        this.callbacks = {}
        this.audioContext = null
    }
}