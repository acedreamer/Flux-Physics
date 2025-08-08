/**
 * FLUX Audio Reactive Mode - Error Handling Demonstration
 * 
 * This demo showcases comprehensive error handling and user feedback:
 * - Permission denied scenarios
 * - Device not found errors
 * - Connection failures and recovery
 * - Low audio level detection
 * - Automatic fallback modes
 * - User-friendly error messages and recovery actions
 */

import { AudioErrorHandler } from '../ui/audio-error-handler.js'
import { AudioUserFeedback } from '../ui/audio-user-feedback.js'

export class AudioErrorDemo {
    constructor(container) {
        this.container = container
        this.errorHandler = null
        this.userFeedback = null
        this.demoState = {
            currentDemo: null,
            isRunning: false,
            simulatedAudioLevel: 0.5
        }
        
        this.initializeDemo()
        this.createDemoUI()
    }
    
    /**
     * Initialize error handling demo
     */
    initializeDemo() {
        // Create error handler
        this.errorHandler = new AudioErrorHandler({
            lowAudioThreshold: 0.02,
            lowAudioDuration: 2000, // Faster for demo
            silenceThreshold: 0.01,
            silenceDuration: 3000, // Faster for demo
            maxConsecutiveErrors: 3
        })
        
        // Create user feedback system
        this.userFeedback = new AudioUserFeedback(this.container)
        
        // Setup callbacks
        this.setupCallbacks()
    }
    
    /**
     * Setup error handler and user feedback callbacks
     */
    setupCallbacks() {
        // Error handler callbacks
        this.errorHandler.callbacks = {
            onError: (errorInfo) => {
                console.log('Demo: Error occurred', errorInfo)
                this.userFeedback.showError(errorInfo)
                this.logDemoEvent('error', errorInfo)
            },
            
            onWarning: (warningInfo) => {
                console.log('Demo: Warning occurred', warningInfo)
                this.userFeedback.showWarning(warningInfo)
                this.logDemoEvent('warning', warningInfo)
            },
            
            onRecovery: (recoveryInfo) => {
                console.log('Demo: Recovery successful', recoveryInfo)
                this.logDemoEvent('recovery', recoveryInfo)
            },
            
            onFallback: (fallbackInfo) => {
                console.log('Demo: Fallback activated', fallbackInfo)
                this.userFeedback.showWarning({
                    title: 'Fallback Mode Active',
                    message: `Switched to normal mode: ${fallbackInfo.reason}`,
                    severity: 'info'
                })
                this.logDemoEvent('fallback', fallbackInfo)
            },
            
            onStatusChange: (status, message) => {
                console.log('Demo: Status change', status, message)
                this.userFeedback.updateStatus(status, message, {
                    source: 'demo',
                    quality: 'simulated'
                })
                this.logDemoEvent('status_change', { status, message })
            },
            
            onUserAction: async (action, context) => {
                console.log('Demo: User action', action, context)
                return await this.handleDemoUserAction(action, context)
            }
        }
        
        // User feedback callbacks
        this.userFeedback.setCallbacks({
            onUserAction: async (action, context) => {
                return await this.handleDemoUserAction(action, context)
            },
            
            onStatusClick: (status) => {
                console.log('Demo: Status clicked', status)
                this.showStatusDetails(status)
            },
            
            onHelpRequest: (type) => {
                console.log('Demo: Help requested', type)
                this.logDemoEvent('help_request', { type })
            }
        })
    }
    
    /**
     * Create demo UI controls
     */
    createDemoUI() {
        const demoControls = document.createElement('div')
        demoControls.className = 'audio-error-demo-controls'
        demoControls.innerHTML = `
            <div class="demo-header">
                <h3>Audio Error Handling Demo</h3>
                <p>Test various error scenarios and recovery mechanisms</p>
            </div>
            
            <div class="demo-scenarios">
                <h4>Error Scenarios</h4>
                <div class="scenario-buttons">
                    <button class="demo-btn" data-scenario="permission-denied">
                        Permission Denied
                    </button>
                    <button class="demo-btn" data-scenario="no-device">
                        No Device Found
                    </button>
                    <button class="demo-btn" data-scenario="connection-lost">
                        Connection Lost
                    </button>
                    <button class="demo-btn" data-scenario="low-audio">
                        Low Audio Level
                    </button>
                    <button class="demo-btn" data-scenario="silence">
                        Audio Silence
                    </button>
                    <button class="demo-btn" data-scenario="performance">
                        Performance Issues
                    </button>
                    <button class="demo-btn" data-scenario="browser-unsupported">
                        Browser Unsupported
                    </button>
                </div>
            </div>
            
            <div class="demo-controls">
                <h4>Audio Simulation</h4>
                <div class="audio-controls">
                    <label>
                        Audio Level: 
                        <input type="range" class="audio-level-slider" 
                               min="0" max="1" step="0.01" value="0.5">
                        <span class="audio-level-value">0.50</span>
                    </label>
                    <button class="demo-btn start-monitoring">Start Audio Monitoring</button>
                    <button class="demo-btn stop-monitoring">Stop Audio Monitoring</button>
                </div>
            </div>
            
            <div class="demo-recovery">
                <h4>Recovery Actions</h4>
                <div class="recovery-buttons">
                    <button class="demo-btn" data-recovery="retry">
                        Retry Connection
                    </button>
                    <button class="demo-btn" data-recovery="switch-source">
                        Switch Audio Source
                    </button>
                    <button class="demo-btn" data-recovery="adjust-sensitivity">
                        Adjust Sensitivity
                    </button>
                    <button class="demo-btn" data-recovery="reduce-quality">
                        Reduce Quality
                    </button>
                    <button class="demo-btn" data-recovery="clear-errors">
                        Clear All Errors
                    </button>
                </div>
            </div>
            
            <div class="demo-log">
                <h4>Demo Log</h4>
                <div class="log-output"></div>
                <button class="demo-btn clear-log">Clear Log</button>
            </div>
        `
        
        // Add demo controls to container
        this.container.appendChild(demoControls)
        
        // Setup event listeners
        this.setupDemoEventListeners(demoControls)
    }
    
    /**
     * Setup demo event listeners
     * @param {HTMLElement} demoControls - Demo controls container
     */
    setupDemoEventListeners(demoControls) {
        // Scenario buttons
        demoControls.querySelectorAll('[data-scenario]').forEach(button => {
            button.addEventListener('click', (e) => {
                const scenario = e.target.dataset.scenario
                this.runErrorScenario(scenario)
            })
        })
        
        // Recovery buttons
        demoControls.querySelectorAll('[data-recovery]').forEach(button => {
            button.addEventListener('click', (e) => {
                const recovery = e.target.dataset.recovery
                this.runRecoveryAction(recovery)
            })
        })
        
        // Audio level slider
        const slider = demoControls.querySelector('.audio-level-slider')
        const valueDisplay = demoControls.querySelector('.audio-level-value')
        
        slider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value)
            this.demoState.simulatedAudioLevel = value
            valueDisplay.textContent = value.toFixed(2)
            
            // Update monitoring if active
            if (this.demoState.isRunning) {
                this.errorHandler.monitorAudioLevel(value)
            }
        })
        
        // Monitoring controls
        demoControls.querySelector('.start-monitoring').addEventListener('click', () => {
            this.startAudioMonitoring()
        })
        
        demoControls.querySelector('.stop-monitoring').addEventListener('click', () => {
            this.stopAudioMonitoring()
        })
        
        // Clear log
        demoControls.querySelector('.clear-log').addEventListener('click', () => {
            this.clearDemoLog()
        })
    }
    
    /**
     * Run specific error scenario
     * @param {string} scenario - Scenario name
     */
    runErrorScenario(scenario) {
        this.logDemoEvent('scenario_start', { scenario })
        
        switch (scenario) {
            case 'permission-denied':
                this.simulatePermissionDenied()
                break
                
            case 'no-device':
                this.simulateNoDevice()
                break
                
            case 'connection-lost':
                this.simulateConnectionLost()
                break
                
            case 'low-audio':
                this.simulateLowAudio()
                break
                
            case 'silence':
                this.simulateAudioSilence()
                break
                
            case 'performance':
                this.simulatePerformanceIssues()
                break
                
            case 'browser-unsupported':
                this.simulateBrowserUnsupported()
                break
                
            default:
                console.warn('Unknown scenario:', scenario)
        }
    }
    
    /**
     * Simulate permission denied error
     */
    simulatePermissionDenied() {
        const error = {
            error: 'MICROPHONE_PERMISSION_DENIED',
            message: 'User denied microphone access'
        }
        
        const context = {
            attemptedSource: 'microphone',
            userAgent: navigator.userAgent,
            timestamp: Date.now()
        }
        
        this.errorHandler.handleError(error, context)
    }
    
    /**
     * Simulate no device found error
     */
    simulateNoDevice() {
        const error = {
            error: 'NO_MICROPHONE_DEVICE',
            message: 'No microphone device detected'
        }
        
        const context = {
            attemptedSource: 'microphone',
            availableDevices: [],
            timestamp: Date.now()
        }
        
        this.errorHandler.handleError(error, context)
    }
    
    /**
     * Simulate connection lost error
     */
    simulateConnectionLost() {
        const error = {
            error: 'CONNECTION_LOST',
            message: 'Audio connection was lost unexpectedly'
        }
        
        const context = {
            currentSource: 'microphone',
            wasConnected: true,
            timestamp: Date.now()
        }
        
        this.errorHandler.handleError(error, context)
    }
    
    /**
     * Simulate low audio level
     */
    simulateLowAudio() {
        // Set low audio level and trigger monitoring
        this.demoState.simulatedAudioLevel = 0.005
        this.updateAudioLevelSlider(0.005)
        
        // Start monitoring to trigger low audio detection
        this.startAudioMonitoring()
        
        // Simulate low audio for the required duration
        setTimeout(() => {
            this.errorHandler.monitorAudioLevel(0.005)
        }, 100)
    }
    
    /**
     * Simulate audio silence
     */
    simulateAudioSilence() {
        // Set silence level and trigger monitoring
        this.demoState.simulatedAudioLevel = 0.001
        this.updateAudioLevelSlider(0.001)
        
        // Start monitoring to trigger silence detection
        this.startAudioMonitoring()
        
        // Simulate silence for the required duration
        setTimeout(() => {
            this.errorHandler.monitorAudioLevel(0.001)
        }, 100)
    }
    
    /**
     * Simulate performance issues
     */
    simulatePerformanceIssues() {
        const error = {
            error: 'PERFORMANCE_DEGRADED',
            message: 'Audio processing is impacting system performance'
        }
        
        const context = {
            analysisTime: 15, // ms (above threshold)
            memoryUsage: 85, // %
            cpuUsage: 90, // %
            timestamp: Date.now()
        }
        
        this.errorHandler.handleError(error, context)
    }
    
    /**
     * Simulate browser unsupported error
     */
    simulateBrowserUnsupported() {
        const error = {
            error: 'WEB_AUDIO_UNSUPPORTED',
            message: 'Web Audio API is not supported in this browser'
        }
        
        const context = {
            userAgent: navigator.userAgent,
            webAudioSupported: false,
            timestamp: Date.now()
        }
        
        this.errorHandler.handleError(error, context)
    }
    
    /**
     * Run recovery action
     * @param {string} recovery - Recovery action name
     */
    runRecoveryAction(recovery) {
        this.logDemoEvent('recovery_start', { recovery })
        
        switch (recovery) {
            case 'retry':
                this.simulateRetryConnection()
                break
                
            case 'switch-source':
                this.simulateSwitchSource()
                break
                
            case 'adjust-sensitivity':
                this.simulateAdjustSensitivity()
                break
                
            case 'reduce-quality':
                this.simulateReduceQuality()
                break
                
            case 'clear-errors':
                this.clearAllErrors()
                break
                
            default:
                console.warn('Unknown recovery action:', recovery)
        }
    }
    
    /**
     * Simulate retry connection
     */
    simulateRetryConnection() {
        this.userFeedback.showProgress('Retrying Connection', 'Attempting to reconnect to audio source...')
        
        setTimeout(() => {
            this.userFeedback.hideProgress()
            
            // Simulate successful reconnection
            this.errorHandler.clearError()
            this.userFeedback.updateStatus('connected', 'Audio connection restored', {
                source: 'microphone',
                quality: 'high'
            })
            
            this.logDemoEvent('recovery_success', { action: 'retry' })
        }, 2000)
    }
    
    /**
     * Simulate switch audio source
     */
    simulateSwitchSource() {
        this.userFeedback.showProgress('Switching Source', 'Switching to system audio...')
        
        setTimeout(() => {
            this.userFeedback.hideProgress()
            
            // Simulate successful source switch
            this.errorHandler.clearError()
            this.userFeedback.updateStatus('connected', 'Switched to system audio', {
                source: 'system',
                quality: 'medium'
            })
            
            this.logDemoEvent('recovery_success', { action: 'switch_source' })
        }, 1500)
    }
    
    /**
     * Simulate adjust sensitivity
     */
    simulateAdjustSensitivity() {
        const newSensitivity = 2.0
        
        this.userFeedback.showWarning({
            title: 'Sensitivity Adjusted',
            message: `Audio sensitivity increased to ${newSensitivity}x`,
            severity: 'info',
            primaryAction: { text: 'OK', action: 'dismiss' }
        })
        
        this.logDemoEvent('recovery_success', { action: 'adjust_sensitivity', sensitivity: newSensitivity })
    }
    
    /**
     * Simulate reduce quality
     */
    simulateReduceQuality() {
        this.userFeedback.showWarning({
            title: 'Quality Reduced',
            message: 'Audio quality reduced to improve performance',
            severity: 'info',
            primaryAction: { text: 'OK', action: 'dismiss' }
        })
        
        this.userFeedback.updateStatus('connected', 'Audio active (reduced quality)', {
            source: 'microphone',
            quality: 'low'
        })
        
        this.logDemoEvent('recovery_success', { action: 'reduce_quality' })
    }
    
    /**
     * Clear all errors
     */
    clearAllErrors() {
        this.errorHandler.reset()
        this.userFeedback.reset()
        
        this.logDemoEvent('errors_cleared', {})
    }
    
    /**
     * Start audio monitoring simulation
     */
    startAudioMonitoring() {
        if (this.demoState.isRunning) return
        
        this.demoState.isRunning = true
        this.userFeedback.updateStatus('connected', 'Audio monitoring active', {
            source: 'simulated',
            quality: 'demo'
        })
        
        // Start monitoring loop
        this.monitoringInterval = setInterval(() => {
            if (this.demoState.isRunning) {
                this.errorHandler.monitorAudioLevel(this.demoState.simulatedAudioLevel)
            }
        }, 100)
        
        this.logDemoEvent('monitoring_started', {})
    }
    
    /**
     * Stop audio monitoring simulation
     */
    stopAudioMonitoring() {
        this.demoState.isRunning = false
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval)
            this.monitoringInterval = null
        }
        
        this.userFeedback.updateStatus('disabled', 'Audio monitoring stopped', {
            source: 'none',
            quality: '--'
        })
        
        this.logDemoEvent('monitoring_stopped', {})
    }
    
    /**
     * Handle demo user actions
     * @param {string} action - Action to perform
     * @param {Object} context - Action context
     * @returns {Promise<Object>} Action result
     */
    async handleDemoUserAction(action, context) {
        this.logDemoEvent('user_action', { action, context })
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        switch (action) {
            case 'retry':
                return { success: true, message: 'Demo: Retry successful' }
                
            case 'switchToSystem':
                return { success: true, message: 'Demo: Switched to system audio' }
                
            case 'switchToMicrophone':
                return { success: true, message: 'Demo: Switched to microphone' }
                
            case 'adjustSensitivity':
                return { success: true, message: 'Demo: Sensitivity adjusted' }
                
            case 'reduceQuality':
                return { success: true, message: 'Demo: Quality reduced' }
                
            case 'disable':
                this.stopAudioMonitoring()
                return { success: true, message: 'Demo: Audio mode disabled' }
                
            case 'dismiss':
                return { success: true, message: 'Demo: Dismissed' }
                
            default:
                return { success: false, message: `Demo: Unknown action ${action}` }
        }
    }
    
    /**
     * Show status details
     * @param {string} status - Current status
     */
    showStatusDetails(status) {
        const state = this.errorHandler.getState()
        
        this.userFeedback.showWarning({
            title: 'Audio Status Details',
            message: `Status: ${status}\nErrors: ${state.hasError ? 'Yes' : 'No'}\nFallback: ${state.fallbackMode ? 'Yes' : 'No'}`,
            severity: 'info',
            primaryAction: { text: 'OK', action: 'dismiss' }
        })
    }
    
    /**
     * Update audio level slider
     * @param {number} level - Audio level
     */
    updateAudioLevelSlider(level) {
        const slider = this.container.querySelector('.audio-level-slider')
        const valueDisplay = this.container.querySelector('.audio-level-value')
        
        if (slider && valueDisplay) {
            slider.value = level
            valueDisplay.textContent = level.toFixed(2)
        }
    }
    
    /**
     * Log demo event
     * @param {string} eventType - Event type
     * @param {Object} data - Event data
     */
    logDemoEvent(eventType, data) {
        const timestamp = new Date().toLocaleTimeString()
        const logEntry = {
            timestamp,
            eventType,
            data
        }
        
        // Add to log display
        const logOutput = this.container.querySelector('.log-output')
        if (logOutput) {
            const logElement = document.createElement('div')
            logElement.className = `log-entry log-${eventType}`
            logElement.innerHTML = `
                <span class="log-time">${timestamp}</span>
                <span class="log-type">${eventType}</span>
                <span class="log-data">${JSON.stringify(data, null, 2)}</span>
            `
            
            logOutput.appendChild(logElement)
            logOutput.scrollTop = logOutput.scrollHeight
        }
        
        console.log('Demo Event:', logEntry)
    }
    
    /**
     * Clear demo log
     */
    clearDemoLog() {
        const logOutput = this.container.querySelector('.log-output')
        if (logOutput) {
            logOutput.innerHTML = ''
        }
    }
    
    /**
     * Dispose of demo resources
     */
    dispose() {
        this.stopAudioMonitoring()
        
        if (this.errorHandler) {
            this.errorHandler.dispose()
        }
        
        if (this.userFeedback) {
            this.userFeedback.dispose()
        }
    }
}

// Demo CSS styles
const demoStyles = `
.audio-error-demo-controls {
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #fff;
}

.demo-header h3 {
    margin: 0 0 8px;
    color: #4ECDC4;
}

.demo-header p {
    margin: 0 0 20px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
}

.demo-scenarios,
.demo-controls,
.demo-recovery,
.demo-log {
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.demo-scenarios h4,
.demo-controls h4,
.demo-recovery h4,
.demo-log h4 {
    margin: 0 0 12px;
    color: #FFD93D;
    font-size: 16px;
}

.scenario-buttons,
.recovery-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.demo-btn {
    background: linear-gradient(135deg, #4ECDC4 0%, #45B7D1 100%);
    border: none;
    border-radius: 4px;
    color: #fff;
    padding: 8px 12px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.demo-btn:hover {
    background: linear-gradient(135deg, #45B7D1 0%, #4ECDC4 100%);
    transform: translateY(-1px);
}

.audio-controls {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
}

.audio-controls label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
}

.audio-level-slider {
    width: 150px;
}

.audio-level-value {
    font-weight: bold;
    color: #4ECDC4;
    min-width: 40px;
}

.log-output {
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    padding: 12px;
    max-height: 200px;
    overflow-y: auto;
    font-family: monospace;
    font-size: 11px;
}

.log-entry {
    margin-bottom: 8px;
    padding: 4px;
    border-radius: 2px;
    display: flex;
    gap: 8px;
}

.log-entry.log-error {
    background: rgba(255, 107, 107, 0.1);
    border-left: 3px solid #FF6B6B;
}

.log-entry.log-warning {
    background: rgba(255, 217, 61, 0.1);
    border-left: 3px solid #FFD93D;
}

.log-entry.log-recovery {
    background: rgba(78, 205, 196, 0.1);
    border-left: 3px solid #4ECDC4;
}

.log-time {
    color: rgba(255, 255, 255, 0.5);
    min-width: 80px;
}

.log-type {
    color: #4ECDC4;
    font-weight: bold;
    min-width: 120px;
}

.log-data {
    color: rgba(255, 255, 255, 0.8);
    white-space: pre-wrap;
    flex: 1;
}

@media (max-width: 768px) {
    .scenario-buttons,
    .recovery-buttons {
        flex-direction: column;
    }
    
    .audio-controls {
        flex-direction: column;
        align-items: stretch;
    }
    
    .demo-btn {
        width: 100%;
    }
}
`

// Inject demo styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style')
    styleSheet.textContent = demoStyles
    document.head.appendChild(styleSheet)
}