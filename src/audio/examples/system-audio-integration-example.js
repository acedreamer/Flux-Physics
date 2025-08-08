/**
 * FLUX Audio Reactive Mode - System Audio Integration Example
 * 
 * Demonstrates system audio capture support with fallbacks:
 * - System audio capture using getDisplayMedia API
 * - Audio source switching between microphone and system
 * - Fallback handling for unsupported audio capture methods
 * - Automatic reconnection for failed audio sources
 * - Clear user instructions for system audio setup
 */

import { AudioAnalyzer } from '../core/audio-analyzer.js'
import { AudioUI } from '../ui/audio-ui.js'
import { AudioEffects } from '../core/audio-effects.js'
import BeatDetector from '../core/beat-detector.js'

/**
 * System Audio Integration Example
 * Shows how to implement system audio capture with proper fallbacks
 */
export class SystemAudioIntegrationExample {
    constructor(container) {
        this.container = container
        this.audioAnalyzer = null
        this.audioUI = null
        this.audioEffects = null
        this.beatDetector = null
        this.isRunning = false
        this.animationFrame = null
        
        // Audio processing state
        this.audioData = null
        this.beatData = null
        
        // Connection monitoring
        this.connectionStatus = {
            isConnected: false,
            currentSource: null,
            reconnectAttempts: 0,
            lastError: null
        }
        
        this.init()
    }
    
    /**
     * Initialize the system audio integration example
     */
    async init() {
        try {
            // Create UI container
            this.createUI()
            
            // Initialize audio components
            await this.initializeAudioComponents()
            
            // Setup event handlers
            this.setupEventHandlers()
            
            // Display supported sources
            this.displaySupportedSources()
            
            console.log('System Audio Integration Example initialized')
            
        } catch (error) {
            console.error('Failed to initialize system audio integration:', error)
            this.showError(`Initialization failed: ${error.message}`)
        }
    }
    
    /**
     * Create the user interface
     */
    createUI() {
        this.container.innerHTML = `
            <div class="system-audio-example">
                <div class="example-header">
                    <h2>System Audio Capture Example</h2>
                    <p>Demonstrates system audio capture with microphone fallback</p>
                </div>
                
                <div class="example-content">
                    <div class="audio-controls-container"></div>
                    
                    <div class="connection-status">
                        <h3>Connection Status</h3>
                        <div class="status-display">
                            <div class="status-item">
                                <label>Status:</label>
                                <span class="status-value" id="connection-status">Disconnected</span>
                            </div>
                            <div class="status-item">
                                <label>Source:</label>
                                <span class="status-value" id="current-source">None</span>
                            </div>
                            <div class="status-item">
                                <label>Reconnect Attempts:</label>
                                <span class="status-value" id="reconnect-attempts">0</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="supported-sources">
                        <h3>Supported Audio Sources</h3>
                        <div class="sources-list" id="sources-list">
                            Loading...
                        </div>
                    </div>
                    
                    <div class="instructions">
                        <h3>Instructions</h3>
                        <div class="instruction-content">
                            <h4>For System Audio:</h4>
                            <ol>
                                <li>Select "System Audio" from the source dropdown</li>
                                <li>Click "Audio Mode" to enable</li>
                                <li>When prompted, click "Share" in the screen sharing dialog</li>
                                <li>Make sure "Share system audio" checkbox is checked</li>
                                <li>Select the screen or application you want to capture audio from</li>
                            </ol>
                            
                            <h4>For Microphone:</h4>
                            <ol>
                                <li>Select "Microphone" from the source dropdown</li>
                                <li>Click "Audio Mode" to enable</li>
                                <li>Allow microphone access when prompted</li>
                                <li>Play music or make sounds near your microphone</li>
                            </ol>
                            
                            <div class="note">
                                <strong>Note:</strong> System audio capture is supported in Chrome and Edge browsers. 
                                If unavailable, the system will automatically fall back to microphone input.
                            </div>
                        </div>
                    </div>
                    
                    <div class="error-log">
                        <h3>Error Log</h3>
                        <div class="log-content" id="error-log">
                            No errors
                        </div>
                    </div>
                </div>
            </div>
        `
        
        // Add CSS styles
        this.addStyles()
    }
    
    /**
     * Add CSS styles for the example
     */
    addStyles() {
        const style = document.createElement('style')
        style.textContent = `
            .system-audio-example {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .example-header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #333;
            }
            
            .example-header h2 {
                color: #00FFFF;
                margin: 0 0 10px 0;
            }
            
            .example-header p {
                color: #666;
                margin: 0;
            }
            
            .example-content > div {
                margin-bottom: 30px;
                padding: 20px;
                background: rgba(0, 255, 255, 0.1);
                border-radius: 8px;
                border: 1px solid rgba(0, 255, 255, 0.3);
            }
            
            .example-content h3 {
                color: #00FFFF;
                margin: 0 0 15px 0;
                font-size: 18px;
            }
            
            .status-display {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
            }
            
            .status-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 4px;
            }
            
            .status-item label {
                font-weight: bold;
                color: #FFF;
            }
            
            .status-value {
                color: #00FFFF;
                font-family: monospace;
            }
            
            .sources-list {
                display: grid;
                gap: 10px;
            }
            
            .source-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 4px;
                border-left: 4px solid transparent;
            }
            
            .source-item.supported {
                border-left-color: #4ECDC4;
            }
            
            .source-item.unsupported {
                border-left-color: #FF6B6B;
                opacity: 0.6;
            }
            
            .source-info {
                flex: 1;
            }
            
            .source-name {
                font-weight: bold;
                color: #FFF;
                margin-bottom: 4px;
            }
            
            .source-description {
                color: #AAA;
                font-size: 14px;
            }
            
            .source-status {
                color: #00FFFF;
                font-size: 12px;
                font-weight: bold;
            }
            
            .instruction-content ol {
                color: #FFF;
                line-height: 1.6;
            }
            
            .instruction-content li {
                margin-bottom: 8px;
            }
            
            .instruction-content h4 {
                color: #4ECDC4;
                margin: 20px 0 10px 0;
            }
            
            .note {
                background: rgba(255, 193, 7, 0.1);
                border: 1px solid rgba(255, 193, 7, 0.3);
                border-radius: 4px;
                padding: 15px;
                margin-top: 20px;
                color: #FFC107;
            }
            
            .log-content {
                background: rgba(0, 0, 0, 0.5);
                border-radius: 4px;
                padding: 15px;
                font-family: monospace;
                font-size: 12px;
                color: #FFF;
                max-height: 200px;
                overflow-y: auto;
                white-space: pre-wrap;
            }
            
            .error-entry {
                color: #FF6B6B;
                margin-bottom: 10px;
                padding-bottom: 10px;
                border-bottom: 1px solid rgba(255, 107, 107, 0.2);
            }
            
            .error-time {
                color: #666;
                font-size: 11px;
            }
        `
        
        document.head.appendChild(style)
    }
    
    /**
     * Initialize audio components
     */
    async initializeAudioComponents() {
        // Initialize audio analyzer with system audio support
        this.audioAnalyzer = new AudioAnalyzer({
            fftSize: 2048,
            smoothingTimeConstant: 0.8,
            reconnectDelay: 2000,
            maxReconnectAttempts: 3
        })
        
        // Initialize beat detector
        this.beatDetector = new BeatDetector(this.audioAnalyzer)
        
        // Initialize audio UI
        const audioControlsContainer = this.container.querySelector('.audio-controls-container')
        this.audioUI = new AudioUI(audioControlsContainer, {
            spectrumWidth: 300,
            spectrumHeight: 100
        })
        
        // Initialize audio effects (mock for this example)
        this.audioEffects = new AudioEffects(null) // No FLUX app for this example
    }
    
    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Setup audio analyzer callbacks
        this.audioAnalyzer.setCallbacks({
            onSourceChange: (source, stream) => this.handleSourceChange(source, stream),
            onConnectionChange: (connected, source) => this.handleConnectionChange(connected, source),
            onError: (error) => this.handleAudioError(error),
            onReconnectAttempt: (attempt, max, delay) => this.handleReconnectAttempt(attempt, max, delay)
        })
        
        // Setup UI callbacks
        this.audioUI.setCallbacks({
            onToggleAudio: (enabled) => this.handleAudioToggle(enabled),
            onSourceChange: (source) => this.handleSourceSwitch(source),
            onModeChange: (mode) => this.handleModeChange(mode),
            onSensitivityChange: (sensitivity) => this.handleSensitivityChange(sensitivity),
            onPermissionRequest: () => this.requestAudioPermission()
        })
    }
    
    /**
     * Display supported audio sources
     */
    displaySupportedSources() {
        const sourcesList = this.container.querySelector('#sources-list')
        const supportedSources = this.audioAnalyzer.getSupportedSources()
        
        if (supportedSources.length === 0) {
            sourcesList.innerHTML = '<div class="source-item unsupported">No audio sources available</div>'
            return
        }
        
        sourcesList.innerHTML = supportedSources.map(source => `
            <div class="source-item ${source.supported ? 'supported' : 'unsupported'}">
                <div class="source-info">
                    <div class="source-name">${source.name}</div>
                    <div class="source-description">${source.description}</div>
                    ${source.note ? `<div class="source-note">${source.note}</div>` : ''}
                </div>
                <div class="source-status">
                    ${source.supported ? 'Supported' : 'Not Supported'}
                    ${source.recommended ? ' (Recommended)' : ''}
                </div>
            </div>
        `).join('')
        
        // Update UI with supported sources
        this.audioUI.updateSupportedSources(supportedSources)
    }
    
    /**
     * Handle audio toggle
     */
    async handleAudioToggle(enabled) {
        if (enabled) {
            await this.startAudioProcessing()
        } else {
            this.stopAudioProcessing()
        }
    }
    
    /**
     * Handle source switch
     */
    async handleSourceSwitch(newSource) {
        try {
            this.logMessage(`Switching to ${newSource}...`)
            
            if (this.audioAnalyzer.getConnectionStatus().isConnected) {
                const result = await this.audioAnalyzer.switchSource(newSource)
                
                if (result.success) {
                    this.logMessage(`Successfully switched to ${result.source}`)
                    
                    if (result.fallbackUsed) {
                        this.logMessage(`Note: Fallback used (${result.originalSource} → ${result.source})`)
                    }
                    
                    return result
                } else {
                    this.logError(`Failed to switch to ${newSource}: ${result.message}`)
                    return result
                }
            } else {
                // Not connected yet, just update the preference
                this.logMessage(`Source preference set to ${newSource}`)
                return { success: true, source: newSource }
            }
            
        } catch (error) {
            this.logError(`Error switching source: ${error.message}`)
            return { success: false, message: error.message }
        }
    }
    
    /**
     * Request audio permission and initialize
     */
    async requestAudioPermission() {
        try {
            const currentSource = this.audioUI.currentAudioSource || 'microphone'
            this.logMessage(`Requesting ${currentSource} access...`)
            
            const result = await this.audioAnalyzer.initialize(currentSource)
            
            if (result.success) {
                this.logMessage(`Audio initialized with ${result.source}`)
                
                if (result.fallbackUsed) {
                    this.logMessage(`Fallback used: ${result.originalSource} → ${result.source}`)
                }
                
                return result
            } else {
                this.logError(`Audio initialization failed: ${result.message}`)
                return result
            }
            
        } catch (error) {
            this.logError(`Permission request failed: ${error.message}`)
            return {
                success: false,
                message: error.message
            }
        }
    }
    
    /**
     * Start audio processing loop
     */
    async startAudioProcessing() {
        if (this.isRunning) return
        
        this.isRunning = true
        this.audioAnalyzer.startAnalysis()
        
        this.logMessage('Audio processing started')
        
        // Start processing loop
        this.processAudio()
    }
    
    /**
     * Stop audio processing
     */
    stopAudioProcessing() {
        this.isRunning = false
        this.audioAnalyzer.stopAnalysis()
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame)
            this.animationFrame = null
        }
        
        this.logMessage('Audio processing stopped')
    }
    
    /**
     * Audio processing loop
     */
    processAudio() {
        if (!this.isRunning) return
        
        try {
            // Get audio data
            this.audioData = this.audioAnalyzer.getFrequencyData()
            
            // Detect beats
            this.beatData = this.beatDetector.detectBeat(this.audioData.spectrum)
            
            // Update UI
            this.audioUI.updateAll(this.audioData)
            this.audioUI.updateBeat(this.beatData)
            
            // Process audio effects (mock)
            if (this.audioEffects) {
                this.audioEffects.processAudioData(this.audioData, this.beatData)
            }
            
        } catch (error) {
            this.logError(`Audio processing error: ${error.message}`)
        }
        
        // Schedule next frame
        this.animationFrame = requestAnimationFrame(() => this.processAudio())
    }
    
    /**
     * Handle source change event
     */
    handleSourceChange(source, stream) {
        this.connectionStatus.currentSource = source
        this.updateConnectionStatus()
        this.logMessage(`Audio source changed to: ${source}`)
    }
    
    /**
     * Handle connection change event
     */
    handleConnectionChange(connected, source) {
        this.connectionStatus.isConnected = connected
        this.connectionStatus.currentSource = connected ? source : null
        
        if (!connected) {
            this.connectionStatus.reconnectAttempts = 0
        }
        
        this.updateConnectionStatus()
        this.logMessage(`Connection ${connected ? 'established' : 'lost'} for ${source}`)
    }
    
    /**
     * Handle audio error
     */
    handleAudioError(error) {
        this.connectionStatus.lastError = error
        this.logError(`Audio error (${error.type}): ${error.message}`)
    }
    
    /**
     * Handle reconnection attempt
     */
    handleReconnectAttempt(attempt, maxAttempts, delay) {
        this.connectionStatus.reconnectAttempts = attempt
        this.updateConnectionStatus()
        this.logMessage(`Reconnection attempt ${attempt}/${maxAttempts} in ${delay}ms`)
    }
    
    /**
     * Handle mode change
     */
    handleModeChange(mode) {
        this.logMessage(`Visualization mode changed to: ${mode}`)
    }
    
    /**
     * Handle sensitivity change
     */
    handleSensitivityChange(sensitivity) {
        this.logMessage(`Sensitivity changed to: ${sensitivity.toFixed(1)}x`)
    }
    
    /**
     * Update connection status display
     */
    updateConnectionStatus() {
        const statusElement = this.container.querySelector('#connection-status')
        const sourceElement = this.container.querySelector('#current-source')
        const attemptsElement = this.container.querySelector('#reconnect-attempts')
        
        if (statusElement) {
            statusElement.textContent = this.connectionStatus.isConnected ? 'Connected' : 'Disconnected'
            statusElement.style.color = this.connectionStatus.isConnected ? '#4ECDC4' : '#FF6B6B'
        }
        
        if (sourceElement) {
            sourceElement.textContent = this.connectionStatus.currentSource || 'None'
        }
        
        if (attemptsElement) {
            attemptsElement.textContent = this.connectionStatus.reconnectAttempts.toString()
        }
    }
    
    /**
     * Log a message
     */
    logMessage(message) {
        console.log(`[SystemAudio] ${message}`)
        this.addLogEntry(message, 'info')
    }
    
    /**
     * Log an error
     */
    logError(message) {
        console.error(`[SystemAudio] ${message}`)
        this.addLogEntry(message, 'error')
    }
    
    /**
     * Add entry to error log
     */
    addLogEntry(message, type) {
        const logElement = this.container.querySelector('#error-log')
        if (!logElement) return
        
        const timestamp = new Date().toLocaleTimeString()
        const entry = document.createElement('div')
        entry.className = `${type}-entry`
        entry.innerHTML = `
            <div class="error-time">[${timestamp}]</div>
            <div>${message}</div>
        `
        
        logElement.appendChild(entry)
        logElement.scrollTop = logElement.scrollHeight
        
        // Keep only last 50 entries
        while (logElement.children.length > 50) {
            logElement.removeChild(logElement.firstChild)
        }
    }
    
    /**
     * Show error message
     */
    showError(message) {
        this.logError(message)
        
        // Also show in UI if available
        if (this.audioUI) {
            this.audioUI.showError(message)
        }
    }
    
    /**
     * Dispose of the example and clean up resources
     */
    dispose() {
        this.stopAudioProcessing()
        
        if (this.audioAnalyzer) {
            this.audioAnalyzer.dispose()
        }
        
        if (this.audioUI) {
            this.audioUI.dispose()
        }
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame)
        }
        
        this.logMessage('System audio integration example disposed')
    }
}

// Auto-initialize if running in browser
if (typeof window !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const container = document.getElementById('system-audio-example-container')
        if (container) {
            new SystemAudioIntegrationExample(container)
        }
    })
}