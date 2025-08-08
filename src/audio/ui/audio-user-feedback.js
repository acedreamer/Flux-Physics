/**
 * FLUX Audio Reactive Mode - User Feedback System
 * 
 * Provides comprehensive user feedback including:
 * - Connection status indicators with visual feedback
 * - Error message display with recovery actions
 * - Warning notifications for audio issues
 * - Progress indicators for connection attempts
 * - User-friendly help and instructions
 */

export class AudioUserFeedback {
    constructor(container, options = {}) {
        this.container = container
        this.config = {
            animationDuration: 300,
            errorDisplayDuration: 8000,
            warningDisplayDuration: 5000,
            statusUpdateInterval: 100,
            ...options
        }
        
        // UI elements
        this.elements = {
            statusIndicator: null,
            errorDialog: null,
            warningBanner: null,
            progressIndicator: null,
            helpPanel: null,
            connectionStatus: null
        }
        
        // State
        this.currentStatus = 'disabled'
        this.currentError = null
        this.currentWarning = null
        this.isShowingHelp = false
        
        // Timers
        this.errorTimer = null
        this.warningTimer = null
        this.statusUpdateTimer = null
        
        // Event callbacks
        this.callbacks = {
            onUserAction: null,
            onStatusClick: null,
            onHelpRequest: null
        }
        
        this.createFeedbackUI()
        this.setupEventListeners()
    }
    
    /**
     * Create the complete feedback UI structure
     */
    createFeedbackUI() {
        // Create status indicator
        this.createStatusIndicator()
        
        // Create error dialog
        this.createErrorDialog()
        
        // Create warning banner
        this.createWarningBanner()
        
        // Create progress indicator
        this.createProgressIndicator()
        
        // Create help panel
        this.createHelpPanel()
        
        // Create connection status display
        this.createConnectionStatus()
        
        // Add all elements to container
        this.container.appendChild(this.elements.statusIndicator)
        this.container.appendChild(this.elements.errorDialog)
        this.container.appendChild(this.elements.warningBanner)
        this.container.appendChild(this.elements.progressIndicator)
        this.container.appendChild(this.elements.helpPanel)
        this.container.appendChild(this.elements.connectionStatus)
    }
    
    /**
     * Create status indicator with visual feedback
     */
    createStatusIndicator() {
        this.elements.statusIndicator = this.createElement('div', {
            className: 'audio-status-indicator',
            innerHTML: `
                <div class="status-dot status-disabled"></div>
                <span class="status-text">Audio Disabled</span>
                <div class="status-details">
                    <span class="status-source">No Source</span>
                    <span class="status-quality">--</span>
                </div>
            `
        })
        
        // Make status clickable for details
        this.elements.statusIndicator.addEventListener('click', () => {
            if (this.callbacks.onStatusClick) {
                this.callbacks.onStatusClick(this.currentStatus)
            }
        })
    }
    
    /**
     * Create error dialog with actions
     */
    createErrorDialog() {
        this.elements.errorDialog = this.createElement('div', {
            className: 'audio-error-dialog hidden',
            innerHTML: `
                <div class="error-dialog-overlay"></div>
                <div class="error-dialog-content">
                    <div class="error-header">
                        <div class="error-icon">⚠️</div>
                        <h3 class="error-title">Audio Error</h3>
                        <button class="error-close" title="Close">×</button>
                    </div>
                    <div class="error-body">
                        <p class="error-message">An audio error occurred.</p>
                        <div class="error-instructions">
                            <h4>How to fix this:</h4>
                            <ol class="instruction-list"></ol>
                        </div>
                    </div>
                    <div class="error-actions">
                        <div class="primary-actions"></div>
                        <div class="secondary-actions"></div>
                    </div>
                </div>
            `
        })
        
        // Setup close button
        this.elements.errorDialog.querySelector('.error-close').addEventListener('click', () => {
            this.hideError()
        })
        
        // Close on overlay click
        this.elements.errorDialog.querySelector('.error-dialog-overlay').addEventListener('click', () => {
            this.hideError()
        })
    }
    
    /**
     * Create warning banner for non-critical issues
     */
    createWarningBanner() {
        this.elements.warningBanner = this.createElement('div', {
            className: 'audio-warning-banner hidden',
            innerHTML: `
                <div class="warning-icon">⚠️</div>
                <div class="warning-content">
                    <span class="warning-title">Audio Warning</span>
                    <span class="warning-message">Audio issue detected.</span>
                </div>
                <div class="warning-actions">
                    <button class="warning-action-btn primary">Fix</button>
                    <button class="warning-dismiss">×</button>
                </div>
            `
        })
        
        // Setup dismiss button
        this.elements.warningBanner.querySelector('.warning-dismiss').addEventListener('click', () => {
            this.hideWarning()
        })
    }
    
    /**
     * Create progress indicator for connection attempts
     */
    createProgressIndicator() {
        this.elements.progressIndicator = this.createElement('div', {
            className: 'audio-progress-indicator hidden',
            innerHTML: `
                <div class="progress-content">
                    <div class="progress-spinner"></div>
                    <div class="progress-text">
                        <span class="progress-title">Connecting...</span>
                        <span class="progress-details">Initializing audio</span>
                    </div>
                </div>
                <button class="progress-cancel" title="Cancel">×</button>
            `
        })
        
        // Setup cancel button
        this.elements.progressIndicator.querySelector('.progress-cancel').addEventListener('click', () => {
            this.hideProgress()
            if (this.callbacks.onUserAction) {
                this.callbacks.onUserAction('cancel', { operation: 'connection' })
            }
        })
    }
    
    /**
     * Create help panel with troubleshooting information
     */
    createHelpPanel() {
        this.elements.helpPanel = this.createElement('div', {
            className: 'audio-help-panel hidden',
            innerHTML: `
                <div class="help-header">
                    <h3>Audio Reactive Mode Help</h3>
                    <button class="help-close">×</button>
                </div>
                <div class="help-content">
                    <div class="help-section">
                        <h4>Getting Started</h4>
                        <ul>
                            <li>Click the "Audio Mode" button to enable audio reactive mode</li>
                            <li>Allow microphone access when prompted</li>
                            <li>Play music to see particles react to audio</li>
                        </ul>
                    </div>
                    <div class="help-section">
                        <h4>Audio Sources</h4>
                        <ul>
                            <li><strong>Microphone:</strong> Captures audio from your microphone</li>
                            <li><strong>System Audio:</strong> Captures audio playing on your computer (Chrome/Edge only)</li>
                        </ul>
                    </div>
                    <div class="help-section">
                        <h4>Troubleshooting</h4>
                        <div class="troubleshooting-item">
                            <strong>No audio detected:</strong>
                            <ul>
                                <li>Check microphone permissions in browser settings</li>
                                <li>Ensure microphone is not muted</li>
                                <li>Try increasing audio sensitivity</li>
                            </ul>
                        </div>
                        <div class="troubleshooting-item">
                            <strong>System audio not working:</strong>
                            <ul>
                                <li>Use Chrome or Microsoft Edge browser</li>
                                <li>Enable "Share system audio" in sharing dialog</li>
                                <li>Ensure audio is playing on your system</li>
                            </ul>
                        </div>
                        <div class="troubleshooting-item">
                            <strong>Performance issues:</strong>
                            <ul>
                                <li>Close other resource-intensive applications</li>
                                <li>Reduce audio quality in settings</li>
                                <li>Try a different visualization mode</li>
                            </ul>
                        </div>
                    </div>
                    <div class="help-section">
                        <h4>Browser Compatibility</h4>
                        <ul>
                            <li><strong>Chrome:</strong> Full support for microphone and system audio</li>
                            <li><strong>Edge:</strong> Full support for microphone and system audio</li>
                            <li><strong>Firefox:</strong> Microphone only, no system audio</li>
                            <li><strong>Safari:</strong> Microphone only, limited system audio</li>
                        </ul>
                    </div>
                </div>
            `
        })
        
        // Setup close button
        this.elements.helpPanel.querySelector('.help-close').addEventListener('click', () => {
            this.hideHelp()
        })
    }
    
    /**
     * Create connection status display
     */
    createConnectionStatus() {
        this.elements.connectionStatus = this.createElement('div', {
            className: 'audio-connection-status',
            innerHTML: `
                <div class="connection-info">
                    <div class="connection-indicator">
                        <div class="connection-dot"></div>
                        <span class="connection-text">Disconnected</span>
                    </div>
                    <div class="connection-details">
                        <span class="connection-source">No Source</span>
                        <span class="connection-quality">Quality: --</span>
                        <span class="connection-latency">Latency: --ms</span>
                    </div>
                </div>
                <button class="connection-help" title="Help">?</button>
            `
        })
        
        // Setup help button
        this.elements.connectionStatus.querySelector('.connection-help').addEventListener('click', () => {
            this.showHelp()
        })
    }
    
    /**
     * Update status indicator
     * @param {string} status - Status type (disabled, requesting, connecting, connected, error, warning)
     * @param {string} message - Status message
     * @param {Object} details - Additional status details
     */
    updateStatus(status, message, details = {}) {
        this.currentStatus = status
        
        const indicator = this.elements.statusIndicator
        const dot = indicator.querySelector('.status-dot')
        const text = indicator.querySelector('.status-text')
        const source = indicator.querySelector('.status-source')
        const quality = indicator.querySelector('.status-quality')
        
        // Update dot appearance
        dot.className = `status-dot status-${status}`
        
        // Update text
        text.textContent = message
        
        // Update details
        source.textContent = details.source || 'No Source'
        quality.textContent = details.quality || '--'
        
        // Add animation for status changes
        indicator.style.transform = 'scale(0.95)'
        setTimeout(() => {
            indicator.style.transform = 'scale(1)'
        }, 100)
        
        // Update connection status
        this.updateConnectionStatus(status, details)
    }
    
    /**
     * Update connection status display
     * @param {string} status - Connection status
     * @param {Object} details - Connection details
     */
    updateConnectionStatus(status, details = {}) {
        const connectionStatus = this.elements.connectionStatus
        const dot = connectionStatus.querySelector('.connection-dot')
        const text = connectionStatus.querySelector('.connection-text')
        const source = connectionStatus.querySelector('.connection-source')
        const quality = connectionStatus.querySelector('.connection-quality')
        const latency = connectionStatus.querySelector('.connection-latency')
        
        // Update connection indicator
        dot.className = `connection-dot connection-${status}`
        
        // Update connection text
        const statusTexts = {
            disabled: 'Disabled',
            requesting: 'Requesting Permission...',
            connecting: 'Connecting...',
            connected: 'Connected',
            error: 'Connection Error',
            warning: 'Connection Warning'
        }
        
        text.textContent = statusTexts[status] || 'Unknown'
        
        // Update details
        source.textContent = details.source ? `Source: ${details.source}` : 'No Source'
        quality.textContent = details.quality ? `Quality: ${details.quality}` : 'Quality: --'
        latency.textContent = details.latency ? `Latency: ${details.latency}ms` : 'Latency: --ms'
    }
    
    /**
     * Show error dialog with comprehensive error information
     * @param {Object} errorInfo - Error information object
     */
    showError(errorInfo) {
        this.currentError = errorInfo
        
        const dialog = this.elements.errorDialog
        const title = dialog.querySelector('.error-title')
        const message = dialog.querySelector('.error-message')
        const instructionsList = dialog.querySelector('.instruction-list')
        const primaryActions = dialog.querySelector('.primary-actions')
        const secondaryActions = dialog.querySelector('.secondary-actions')
        
        // Update error content
        title.textContent = errorInfo.title || 'Audio Error'
        message.textContent = errorInfo.message || 'An audio error occurred.'
        
        // Update instructions
        instructionsList.innerHTML = ''
        if (errorInfo.instructions) {
            errorInfo.instructions.forEach(instruction => {
                const li = this.createElement('li', {
                    textContent: instruction
                })
                instructionsList.appendChild(li)
            })
        }
        
        // Update actions
        primaryActions.innerHTML = ''
        secondaryActions.innerHTML = ''
        
        if (errorInfo.actions) {
            errorInfo.actions.forEach((action, index) => {
                const button = this.createElement('button', {
                    className: `error-action-btn ${index === 0 ? 'primary' : 'secondary'}`,
                    textContent: action.text
                })
                
                button.addEventListener('click', () => {
                    this.handleErrorAction(action.action, errorInfo)
                })
                
                if (index === 0) {
                    primaryActions.appendChild(button)
                } else {
                    secondaryActions.appendChild(button)
                }
            })
        }
        
        // Show dialog with animation
        dialog.classList.remove('hidden')
        requestAnimationFrame(() => {
            dialog.classList.add('visible')
        })
        
        // Auto-hide after duration (for non-critical errors)
        if (errorInfo.severity !== 'error') {
            this.clearErrorTimer()
            this.errorTimer = setTimeout(() => {
                this.hideError()
            }, this.config.errorDisplayDuration)
        }
        
        // Update status
        this.updateStatus('error', errorInfo.title)
    }
    
    /**
     * Hide error dialog
     */
    hideError() {
        const dialog = this.elements.errorDialog
        dialog.classList.remove('visible')
        
        setTimeout(() => {
            dialog.classList.add('hidden')
        }, this.config.animationDuration)
        
        this.clearErrorTimer()
        this.currentError = null
    }
    
    /**
     * Show warning banner
     * @param {Object} warningInfo - Warning information
     */
    showWarning(warningInfo) {
        this.currentWarning = warningInfo
        
        const banner = this.elements.warningBanner
        const title = banner.querySelector('.warning-title')
        const message = banner.querySelector('.warning-message')
        const actionBtn = banner.querySelector('.warning-action-btn')
        
        // Update warning content
        title.textContent = warningInfo.title || 'Audio Warning'
        message.textContent = warningInfo.message || 'Audio issue detected.'
        
        // Update action button
        if (warningInfo.primaryAction) {
            actionBtn.textContent = warningInfo.primaryAction.text
            actionBtn.onclick = () => {
                this.handleWarningAction(warningInfo.primaryAction.action, warningInfo)
            }
            actionBtn.style.display = 'block'
        } else {
            actionBtn.style.display = 'none'
        }
        
        // Show banner with animation
        banner.classList.remove('hidden')
        requestAnimationFrame(() => {
            banner.classList.add('visible')
        })
        
        // Auto-hide after duration
        this.clearWarningTimer()
        this.warningTimer = setTimeout(() => {
            this.hideWarning()
        }, this.config.warningDisplayDuration)
        
        // Update status
        this.updateStatus('warning', warningInfo.title)
    }
    
    /**
     * Hide warning banner
     */
    hideWarning() {
        const banner = this.elements.warningBanner
        banner.classList.remove('visible')
        
        setTimeout(() => {
            banner.classList.add('hidden')
        }, this.config.animationDuration)
        
        this.clearWarningTimer()
        this.currentWarning = null
    }
    
    /**
     * Show progress indicator
     * @param {string} title - Progress title
     * @param {string} details - Progress details
     */
    showProgress(title, details) {
        const progress = this.elements.progressIndicator
        const titleEl = progress.querySelector('.progress-title')
        const detailsEl = progress.querySelector('.progress-details')
        
        titleEl.textContent = title || 'Processing...'
        detailsEl.textContent = details || 'Please wait...'
        
        progress.classList.remove('hidden')
        requestAnimationFrame(() => {
            progress.classList.add('visible')
        })
    }
    
    /**
     * Update progress indicator
     * @param {string} title - Updated title
     * @param {string} details - Updated details
     */
    updateProgress(title, details) {
        const progress = this.elements.progressIndicator
        const titleEl = progress.querySelector('.progress-title')
        const detailsEl = progress.querySelector('.progress-details')
        
        if (title) titleEl.textContent = title
        if (details) detailsEl.textContent = details
    }
    
    /**
     * Hide progress indicator
     */
    hideProgress() {
        const progress = this.elements.progressIndicator
        progress.classList.remove('visible')
        
        setTimeout(() => {
            progress.classList.add('hidden')
        }, this.config.animationDuration)
    }
    
    /**
     * Show help panel
     */
    showHelp() {
        this.isShowingHelp = true
        const help = this.elements.helpPanel
        
        help.classList.remove('hidden')
        requestAnimationFrame(() => {
            help.classList.add('visible')
        })
        
        if (this.callbacks.onHelpRequest) {
            this.callbacks.onHelpRequest('show')
        }
    }
    
    /**
     * Hide help panel
     */
    hideHelp() {
        this.isShowingHelp = false
        const help = this.elements.helpPanel
        
        help.classList.remove('visible')
        setTimeout(() => {
            help.classList.add('hidden')
        }, this.config.animationDuration)
        
        if (this.callbacks.onHelpRequest) {
            this.callbacks.onHelpRequest('hide')
        }
    }
    
    /**
     * Handle error action button clicks
     * @param {string} action - Action to perform
     * @param {Object} errorInfo - Error information
     */
    async handleErrorAction(action, errorInfo) {
        if (this.callbacks.onUserAction) {
            const result = await this.callbacks.onUserAction(action, errorInfo)
            
            if (result.success) {
                this.hideError()
            } else if (result.message) {
                // Show follow-up error if action failed
                this.showError({
                    title: 'Action Failed',
                    message: result.message,
                    severity: 'error',
                    actions: [
                        { text: 'Try Again', action: action },
                        { text: 'Cancel', action: 'cancel' }
                    ]
                })
            }
        }
    }
    
    /**
     * Handle warning action button clicks
     * @param {string} action - Action to perform
     * @param {Object} warningInfo - Warning information
     */
    async handleWarningAction(action, warningInfo) {
        if (this.callbacks.onUserAction) {
            const result = await this.callbacks.onUserAction(action, warningInfo)
            
            if (result.success) {
                this.hideWarning()
            }
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Handle escape key to close dialogs
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (!this.elements.errorDialog.classList.contains('hidden')) {
                    this.hideError()
                } else if (!this.elements.helpPanel.classList.contains('hidden')) {
                    this.hideHelp()
                }
            }
        })
        
        // Handle clicks outside dialogs
        document.addEventListener('click', (e) => {
            if (this.isShowingHelp && !this.elements.helpPanel.contains(e.target)) {
                const helpButton = this.elements.connectionStatus.querySelector('.connection-help')
                if (!helpButton.contains(e.target)) {
                    this.hideHelp()
                }
            }
        })
    }
    
    /**
     * Clear error timer
     */
    clearErrorTimer() {
        if (this.errorTimer) {
            clearTimeout(this.errorTimer)
            this.errorTimer = null
        }
    }
    
    /**
     * Clear warning timer
     */
    clearWarningTimer() {
        if (this.warningTimer) {
            clearTimeout(this.warningTimer)
            this.warningTimer = null
        }
    }
    
    /**
     * Create DOM element with properties
     * @param {string} tag - Element tag name
     * @param {Object} props - Element properties
     * @returns {HTMLElement} Created element
     */
    createElement(tag, props) {
        const element = document.createElement(tag)
        Object.assign(element, props)
        return element
    }
    
    /**
     * Set event callbacks
     * @param {Object} callbacks - Callback functions
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks }
    }
    
    /**
     * Get current feedback state
     * @returns {Object} Current state
     */
    getState() {
        return {
            currentStatus: this.currentStatus,
            hasError: !!this.currentError,
            hasWarning: !!this.currentWarning,
            isShowingHelp: this.isShowingHelp,
            currentError: this.currentError,
            currentWarning: this.currentWarning
        }
    }
    
    /**
     * Reset feedback system
     */
    reset() {
        this.hideError()
        this.hideWarning()
        this.hideProgress()
        this.hideHelp()
        this.updateStatus('disabled', 'Audio Disabled')
        this.currentError = null
        this.currentWarning = null
    }
    
    /**
     * Dispose of feedback system resources
     */
    dispose() {
        this.clearErrorTimer()
        this.clearWarningTimer()
        
        if (this.statusUpdateTimer) {
            clearInterval(this.statusUpdateTimer)
            this.statusUpdateTimer = null
        }
        
        this.callbacks = {}
    }
}