/**
 * FLUX Audio Reactive Mode - UI Components
 * 
 * Provides user interface components for audio reactive mode including:
 * - Audio mode toggle button with permission handling
 * - Collapsible audio control panel
 * - Real-time frequency spectrum visualizer
 * - Beat indicator with visual feedback
 * - Volume meter with amplitude display
 * - Mode selector dropdown
 * - Sensitivity slider with real-time adjustment
 */

export class AudioUI {
    constructor(container, options = {}) {
        this.container = container
        this.isVisible = false
        this.audioEnabled = false
        this.currentMode = 'reactive'
        this.sensitivity = 1.0
        
        // Configuration
        this.config = {
            panelWidth: 280,
            panelHeight: 'auto',
            spectrumWidth: 240,
            spectrumHeight: 80,
            animationDuration: 300,
            updateInterval: 16, // ~60fps
            ...options
        }
        
        // UI elements
        this.elements = {
            toggleButton: null,
            panel: null,
            spectrum: null,
            beatIndicator: null,
            volumeMeter: null,
            modeSelector: null,
            sensitivitySlider: null,
            sourceSelector: null,
            statusIndicator: null,
            errorMessage: null
        }
        
        // Animation state
        this.animationState = {
            panelTransition: null,
            beatPulse: null,
            spectrumAnimation: null
        }
        
        // Event callbacks
        this.callbacks = {
            onToggleAudio: null,
            onModeChange: null,
            onSensitivityChange: null,
            onSourceChange: null,
            onPermissionRequest: null
        }
        
        // Audio source state
        this.currentAudioSource = 'microphone'
        this.supportedSources = []
        
        // Spectrum visualization state
        this.spectrumState = {
            canvas: null,
            context: null,
            animationFrame: null,
            lastUpdateTime: 0,
            smoothedSpectrum: null
        }
        
        this.createUI()
        this.setupEventListeners()
    }
    
    /**
     * Create the complete UI structure
     */
    createUI() {
        // Create audio toggle button
        this.createToggleButton()
        
        // Create audio control panel
        this.createControlPanel()
        
        // Create spectrum visualizer
        this.createSpectrumVisualizer()
        
        // Create beat indicator
        this.createBeatIndicator()
        
        // Create volume meter
        this.createVolumeMeter()
        
        // Create mode selector
        this.createModeSelector()
        
        // Create sensitivity slider
        this.createSensitivitySlider()
        
        // Create audio source selector
        this.createSourceSelector()
        
        // Create status indicator
        this.createStatusIndicator()
        
        // Create error message display
        this.createErrorMessage()
        
        // Assemble the panel
        this.assemblePanel()
        
        // Add to container
        this.container.appendChild(this.elements.toggleButton)
        this.container.appendChild(this.elements.panel)
    }
    
    /**
     * Create the audio mode toggle button
     */
    createToggleButton() {
        this.elements.toggleButton = this.createElement('button', {
            className: 'audio-toggle',
            innerHTML: `
                <span class="audio-icon">🎵</span>
                <span class="audio-text">Audio Mode</span>
                <span class="audio-status"></span>
            `,
            title: 'Toggle audio reactive mode'
        })
        
        this.elements.toggleButton.addEventListener('click', () => {
            this.toggleAudioMode()
        })
    }
    
    /**
     * Create the collapsible audio control panel
     */
    createControlPanel() {
        this.elements.panel = this.createElement('div', {
            className: 'audio-panel hidden'
        })
        
        // Add panel header
        const header = this.createElement('div', {
            className: 'audio-panel-header',
            innerHTML: `
                <h3>Audio Reactive Controls</h3>
                <button class="panel-close" title="Close panel">×</button>
            `
        })
        
        header.querySelector('.panel-close').addEventListener('click', () => {
            this.hidePanel()
        })
        
        this.elements.panel.appendChild(header)
    }
    
    /**
     * Create real-time frequency spectrum visualizer
     */
    createSpectrumVisualizer() {
        const container = this.createElement('div', {
            className: 'spectrum-container'
        })
        
        const label = this.createElement('label', {
            className: 'control-label',
            textContent: 'Frequency Spectrum'
        })
        
        this.elements.spectrum = this.createElement('canvas', {
            className: 'spectrum-display',
            width: this.config.spectrumWidth,
            height: this.config.spectrumHeight
        })
        
        // Initialize spectrum state
        this.spectrumState.canvas = this.elements.spectrum
        this.spectrumState.context = this.elements.spectrum.getContext('2d')
        this.spectrumState.smoothedSpectrum = new Array(256).fill(0)
        
        container.appendChild(label)
        container.appendChild(this.elements.spectrum)
        
        this.spectrumContainer = container
    }
    
    /**
     * Create beat indicator with visual feedback
     */
    createBeatIndicator() {
        const container = this.createElement('div', {
            className: 'beat-container'
        })
        
        const label = this.createElement('label', {
            className: 'control-label',
            textContent: 'Beat Detection'
        })
        
        this.elements.beatIndicator = this.createElement('div', {
            className: 'beat-indicator',
            innerHTML: `
                <div class="beat-visual">
                    <div class="beat-pulse"></div>
                    <div class="beat-ring"></div>
                </div>
                <div class="beat-info">
                    <span class="beat-status">Listening...</span>
                    <span class="beat-bpm">-- BPM</span>
                </div>
            `
        })
        
        container.appendChild(label)
        container.appendChild(this.elements.beatIndicator)
        
        this.beatContainer = container
    }
    
    /**
     * Create volume meter with amplitude display
     */
    createVolumeMeter() {
        const container = this.createElement('div', {
            className: 'volume-container'
        })
        
        const label = this.createElement('label', {
            className: 'control-label',
            textContent: 'Audio Level'
        })
        
        this.elements.volumeMeter = this.createElement('div', {
            className: 'volume-meter',
            innerHTML: `
                <div class="volume-bar">
                    <div class="volume-fill"></div>
                    <div class="volume-peak"></div>
                </div>
                <div class="volume-value">0%</div>
            `
        })
        
        container.appendChild(label)
        container.appendChild(this.elements.volumeMeter)
        
        this.volumeContainer = container
    }
    
    /**
     * Create mode selector dropdown with smooth transitions
     */
    createModeSelector() {
        const container = this.createElement('div', {
            className: 'mode-container'
        })
        
        const label = this.createElement('label', {
            className: 'control-label',
            textContent: 'Visualization Mode'
        })
        
        this.elements.modeSelector = this.createElement('select', {
            className: 'mode-selector',
            innerHTML: `
                <option value="reactive">Reactive - Full spectrum response</option>
                <option value="pulse">Pulse - Beat-driven radial effects</option>
                <option value="flow">Flow - Directional particle movement</option>
                <option value="ambient">Ambient - Subtle audio influence</option>
            `
        })
        
        this.elements.modeSelector.addEventListener('change', (e) => {
            this.onModeChange(e.target.value)
        })
        
        container.appendChild(label)
        container.appendChild(this.elements.modeSelector)
        
        this.modeContainer = container
    }
    
    /**
     * Create sensitivity slider with real-time adjustment
     */
    createSensitivitySlider() {
        const container = this.createElement('div', {
            className: 'sensitivity-container'
        })
        
        const label = this.createElement('label', {
            className: 'control-label',
            innerHTML: `Sensitivity <span class="sensitivity-value">1.0x</span>`
        })
        
        this.elements.sensitivitySlider = this.createElement('input', {
            type: 'range',
            className: 'sensitivity-slider',
            min: '0.1',
            max: '3.0',
            step: '0.1',
            value: '1.0'
        })
        
        this.elements.sensitivitySlider.addEventListener('input', (e) => {
            this.onSensitivityChange(parseFloat(e.target.value))
        })
        
        container.appendChild(label)
        container.appendChild(this.elements.sensitivitySlider)
        
        this.sensitivityContainer = container
    }
    
    /**
     * Create audio source selector with fallback support
     */
    createSourceSelector() {
        const container = this.createElement('div', {
            className: 'source-container'
        })
        
        const label = this.createElement('label', {
            className: 'control-label',
            textContent: 'Audio Source'
        })
        
        this.elements.sourceSelector = this.createElement('select', {
            className: 'source-selector',
            innerHTML: `
                <option value="microphone">Microphone</option>
                <option value="system">System Audio</option>
            `
        })
        
        this.elements.sourceSelector.addEventListener('change', (e) => {
            this.onSourceChange(e.target.value)
        })
        
        // Add source info display
        const sourceInfo = this.createElement('div', {
            className: 'source-info',
            innerHTML: `
                <div class="source-status">
                    <span class="source-indicator">●</span>
                    <span class="source-text">Microphone</span>
                </div>
                <div class="source-help">
                    <button class="source-help-btn" title="Audio source help">?</button>
                </div>
            `
        })
        
        sourceInfo.querySelector('.source-help-btn').addEventListener('click', () => {
            this.showSourceHelp()
        })
        
        container.appendChild(label)
        container.appendChild(this.elements.sourceSelector)
        container.appendChild(sourceInfo)
        
        this.sourceContainer = container
        this.sourceInfo = sourceInfo
    }
    
    /**
     * Create status indicator for connection state
     */
    createStatusIndicator() {
        this.elements.statusIndicator = this.createElement('div', {
            className: 'status-indicator',
            innerHTML: `
                <div class="status-dot"></div>
                <span class="status-text">Audio Disabled</span>
            `
        })
    }
    
    /**
     * Create error message display
     */
    createErrorMessage() {
        this.elements.errorMessage = this.createElement('div', {
            className: 'error-message hidden',
            innerHTML: `
                <div class="error-icon">⚠️</div>
                <div class="error-text"></div>
                <button class="error-dismiss">×</button>
            `
        })
        
        this.elements.errorMessage.querySelector('.error-dismiss').addEventListener('click', () => {
            this.hideError()
        })
    }
    
    /**
     * Assemble all components into the panel
     */
    assemblePanel() {
        const content = this.createElement('div', {
            className: 'audio-panel-content'
        })
        
        // Add all components to content
        content.appendChild(this.elements.statusIndicator)
        content.appendChild(this.elements.errorMessage)
        content.appendChild(this.sourceContainer)
        content.appendChild(this.spectrumContainer)
        content.appendChild(this.beatContainer)
        content.appendChild(this.volumeContainer)
        content.appendChild(this.modeContainer)
        content.appendChild(this.sensitivityContainer)
        
        this.elements.panel.appendChild(content)
    }
    
    /**
     * Setup event listeners for UI interactions
     */
    setupEventListeners() {
        // Handle panel visibility toggle
        this.elements.toggleButton.addEventListener('click', (e) => {
            e.stopPropagation()
        })
        
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isVisible && !this.elements.panel.contains(e.target) && 
                !this.elements.toggleButton.contains(e.target)) {
                this.hidePanel()
            }
        })
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hidePanel()
            }
        })
    }    
 
   /**
     * Toggle audio reactive mode
     */
    async toggleAudioMode() {
        if (this.audioEnabled) {
            this.disableAudioMode()
        } else {
            await this.enableAudioMode()
        }
    }
    
    /**
     * Enable audio reactive mode with permission handling
     */
    async enableAudioMode() {
        try {
            this.updateStatus('requesting', 'Requesting microphone access...')
            
            // Request permission through callback
            if (this.callbacks.onPermissionRequest) {
                const result = await this.callbacks.onPermissionRequest()
                
                if (result.success) {
                    this.audioEnabled = true
                    this.updateToggleButton(true)
                    this.updateStatus('connected', 'Audio reactive mode active')
                    this.showPanel()
                    
                    // Start spectrum animation
                    this.startSpectrumAnimation()
                    
                    // Trigger callback
                    if (this.callbacks.onToggleAudio) {
                        this.callbacks.onToggleAudio(true)
                    }
                } else {
                    this.showError(result.message || 'Failed to access microphone')
                    this.updateStatus('error', 'Audio access denied')
                }
            }
        } catch (error) {
            this.showError(`Audio initialization failed: ${error.message}`)
            this.updateStatus('error', 'Audio initialization failed')
        }
    }
    
    /**
     * Disable audio reactive mode
     */
    disableAudioMode() {
        this.audioEnabled = false
        this.updateToggleButton(false)
        this.updateStatus('disabled', 'Audio disabled')
        this.hidePanel()
        
        // Stop spectrum animation
        this.stopSpectrumAnimation()
        
        // Trigger callback
        if (this.callbacks.onToggleAudio) {
            this.callbacks.onToggleAudio(false)
        }
    }
    
    /**
     * Show the audio control panel with animation
     */
    showPanel() {
        if (this.isVisible) return
        
        this.isVisible = true
        if (this.elements.panel) {
            this.elements.panel.classList.remove('hidden')
            
            // Animate panel appearance
            requestAnimationFrame(() => {
                if (this.elements.panel) {
                    this.elements.panel.classList.add('visible')
                }
            })
        }
    }
    
    /**
     * Hide the audio control panel with animation
     */
    hidePanel() {
        if (!this.isVisible) return
        
        this.isVisible = false
        this.elements.panel.classList.remove('visible')
        
        // Hide after animation completes
        setTimeout(() => {
            if (!this.isVisible) {
                this.elements.panel.classList.add('hidden')
            }
        }, this.config.animationDuration)
    }
    
    /**
     * Update the toggle button state
     * @param {boolean} enabled - Whether audio is enabled
     */
    updateToggleButton(enabled) {
        const button = this.elements.toggleButton
        const icon = button.querySelector('.audio-icon')
        const text = button.querySelector('.audio-text')
        const status = button.querySelector('.audio-status')
        
        if (enabled) {
            button.classList.add('active')
            icon.textContent = '🎵'
            text.textContent = 'Audio Active'
            status.textContent = '●'
        } else {
            button.classList.remove('active')
            icon.textContent = '🎵'
            text.textContent = 'Audio Mode'
            status.textContent = ''
        }
    }
    
    /**
     * Update status indicator
     * @param {string} state - Status state (disabled, requesting, connected, error)
     * @param {string} message - Status message
     */
    updateStatus(state, message) {
        const indicator = this.elements.statusIndicator
        const dot = indicator.querySelector('.status-dot')
        const text = indicator.querySelector('.status-text')
        
        // Remove all state classes
        dot.className = 'status-dot'
        
        // Add current state class
        dot.classList.add(`status-${state}`)
        text.textContent = message
    }
    
    /**
     * Update frequency spectrum visualization
     * @param {Array} frequencyData - Frequency spectrum data (0-255 values)
     */
    updateSpectrum(frequencyData) {
        if (!this.spectrumState.context || !frequencyData) return
        
        const canvas = this.spectrumState.canvas
        const ctx = this.spectrumState.context
        const width = canvas.width
        const height = canvas.height
        
        // Smooth the spectrum data
        const smoothingFactor = 0.7
        for (let i = 0; i < frequencyData.length && i < this.spectrumState.smoothedSpectrum.length; i++) {
            this.spectrumState.smoothedSpectrum[i] = 
                this.spectrumState.smoothedSpectrum[i] * smoothingFactor + 
                (frequencyData[i] / 255) * (1 - smoothingFactor)
        }
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height)
        
        // Draw spectrum bars
        const barCount = Math.min(frequencyData.length, 128) // Limit for performance
        const barWidth = width / barCount
        
        for (let i = 0; i < barCount; i++) {
            const barHeight = this.spectrumState.smoothedSpectrum[i] * height
            const hue = (i / barCount) * 240 // Blue to red spectrum
            
            // Create gradient for each bar
            const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight)
            gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, 0.8)`)
            gradient.addColorStop(1, `hsla(${hue}, 100%, 70%, 1.0)`)
            
            ctx.fillStyle = gradient
            ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight)
        }
        
        // Draw frequency range indicators
        this.drawFrequencyRangeIndicators(ctx, width, height, barCount)
    }
    
    /**
     * Draw frequency range indicators on spectrum
     */
    drawFrequencyRangeIndicators(ctx, width, height, barCount) {
        const ranges = [
            { name: 'BASS', start: 0, end: 0.2, color: '#FF6B6B' },
            { name: 'MIDS', start: 0.2, end: 0.7, color: '#4ECDC4' },
            { name: 'TREBLE', start: 0.7, end: 1.0, color: '#45B7D1' }
        ]
        
        ctx.font = '10px monospace'
        ctx.textAlign = 'center'
        
        ranges.forEach(range => {
            const startX = range.start * width
            const endX = range.end * width
            const centerX = (startX + endX) / 2
            
            // Draw range label
            ctx.fillStyle = range.color
            ctx.fillText(range.name, centerX, height - 5)
            
            // Draw range divider
            ctx.strokeStyle = range.color
            ctx.lineWidth = 1
            ctx.setLineDash([2, 2])
            ctx.beginPath()
            ctx.moveTo(endX, 0)
            ctx.lineTo(endX, height - 15)
            ctx.stroke()
            ctx.setLineDash([])
        })
    }
    
    /**
     * Update beat indicator with visual feedback
     * @param {Object} beatData - Beat detection data
     */
    updateBeatIndicator(beatData) {
        const indicator = this.elements.beatIndicator
        const pulse = indicator.querySelector('.beat-pulse')
        const ring = indicator.querySelector('.beat-ring')
        const status = indicator.querySelector('.beat-status')
        const bpm = indicator.querySelector('.beat-bpm')
        
        if (beatData.isBeat) {
            // Trigger beat animation
            pulse.style.transform = `scale(${1 + beatData.strength * 0.5})`
            pulse.style.opacity = '1'
            ring.style.transform = 'scale(1.5)'
            ring.style.opacity = '0.6'
            
            // Update status
            status.textContent = `Beat! (${beatData.strength.toFixed(2)})`
            status.style.color = '#FF6B6B'
            
            // Reset animation after short delay
            setTimeout(() => {
                pulse.style.transform = 'scale(1)'
                pulse.style.opacity = '0.7'
                ring.style.transform = 'scale(1)'
                ring.style.opacity = '0.3'
                status.style.color = '#4ECDC4'
            }, 150)
        } else {
            status.textContent = `Energy: ${beatData.energy.toFixed(2)}`
        }
        
        // Update BPM display
        if (beatData.bpm > 0) {
            bpm.textContent = `${beatData.bpm} BPM`
            bpm.style.color = '#45B7D1'
        } else {
            bpm.textContent = '-- BPM'
            bpm.style.color = '#666'
        }
    }
    
    /**
     * Update volume meter with amplitude display
     * @param {number} amplitude - Audio amplitude (0-1)
     */
    updateVolumeMeter(amplitude) {
        const meter = this.elements.volumeMeter
        const fill = meter.querySelector('.volume-fill')
        const peak = meter.querySelector('.volume-peak')
        const value = meter.querySelector('.volume-value')
        
        // Update volume bar
        const percentage = Math.min(amplitude * 100, 100)
        fill.style.width = `${percentage}%`
        
        // Color coding based on level
        if (percentage < 20) {
            fill.style.backgroundColor = '#4ECDC4' // Low - cyan
        } else if (percentage < 70) {
            fill.style.backgroundColor = '#45B7D1' // Medium - blue
        } else {
            fill.style.backgroundColor = '#FF6B6B' // High - red
        }
        
        // Update peak indicator (simple peak hold)
        if (!this.peakHold || amplitude > this.peakHold.value) {
            this.peakHold = {
                value: amplitude,
                time: performance.now()
            }
        }
        
        // Decay peak hold
        const peakAge = performance.now() - this.peakHold.time
        if (peakAge > 1000) { // 1 second hold
            this.peakHold.value *= 0.95 // Slow decay
        }
        
        peak.style.left = `${Math.min(this.peakHold.value * 100, 100)}%`
        
        // Update value display
        value.textContent = `${Math.round(percentage)}%`
    }
    
    /**
     * Handle mode change
     * @param {string} mode - New visualization mode
     */
    onModeChange(mode) {
        this.currentMode = mode
        
        // Add visual feedback for mode change
        if (this.elements.modeSelector) {
            this.elements.modeSelector.style.transform = 'scale(0.95)'
            setTimeout(() => {
                if (this.elements.modeSelector) {
                    this.elements.modeSelector.style.transform = 'scale(1)'
                }
            }, 100)
        }
        
        // Trigger callback
        if (this.callbacks.onModeChange) {
            this.callbacks.onModeChange(mode)
        }
    }
    
    /**
     * Handle sensitivity change
     * @param {number} sensitivity - New sensitivity value
     */
    onSensitivityChange(sensitivity) {
        this.sensitivity = sensitivity
        
        // Update display
        const label = this.sensitivityContainer.querySelector('.sensitivity-value')
        label.textContent = `${sensitivity.toFixed(1)}x`
        
        // Trigger callback
        if (this.callbacks.onSensitivityChange) {
            this.callbacks.onSensitivityChange(sensitivity)
        }
    }
    
    /**
     * Handle audio source change
     * @param {string} source - New audio source
     */
    async onSourceChange(source) {
        if (source === this.currentAudioSource) {
            return
        }
        
        const previousSource = this.currentAudioSource
        this.currentAudioSource = source
        
        // Update UI to show switching state
        this.updateSourceStatus('switching', `Switching to ${source}...`)
        
        try {
            // Trigger callback to switch source
            if (this.callbacks.onSourceChange) {
                const result = await this.callbacks.onSourceChange(source)
                
                if (result && result.success) {
                    this.updateSourceStatus('connected', source)
                    
                    if (result.fallbackUsed) {
                        this.showError(`Switched to ${source} (${result.originalSource} unavailable)`)
                    }
                } else {
                    // Revert selector on failure
                    this.elements.sourceSelector.value = previousSource
                    this.currentAudioSource = previousSource
                    this.updateSourceStatus('error', `Failed to switch to ${source}`)
                    
                    if (result && result.message) {
                        this.showError(result.message)
                    }
                }
            }
        } catch (error) {
            // Revert selector on error
            this.elements.sourceSelector.value = previousSource
            this.currentAudioSource = previousSource
            this.updateSourceStatus('error', `Error switching to ${source}`)
            this.showError(`Failed to switch audio source: ${error.message}`)
        }
    }
    
    /**
     * Update supported sources list
     * @param {Array} sources - Array of supported source objects
     */
    updateSupportedSources(sources) {
        this.supportedSources = sources
        
        // Update selector options
        const selector = this.elements.sourceSelector
        selector.innerHTML = ''
        
        sources.forEach(source => {
            const option = this.createElement('option', {
                value: source.type,
                textContent: source.name,
                disabled: !source.supported
            })
            
            if (!source.supported) {
                option.textContent += ' (Not supported)'
            }
            
            selector.appendChild(option)
        })
        
        // Update current selection
        if (this.currentAudioSource) {
            selector.value = this.currentAudioSource
        }
    }
    
    /**
     * Update audio source status display
     * @param {string} state - Status state (connected, switching, error)
     * @param {string} source - Source name or message
     */
    updateSourceStatus(state, source) {
        if (!this.sourceInfo) return
        
        const indicator = this.sourceInfo.querySelector('.source-indicator')
        const text = this.sourceInfo.querySelector('.source-text')
        
        // Remove all state classes
        indicator.className = 'source-indicator'
        
        // Add current state class
        indicator.classList.add(`source-${state}`)
        
        // Update text
        if (state === 'connected') {
            text.textContent = source.charAt(0).toUpperCase() + source.slice(1)
        } else {
            text.textContent = source
        }
    }
    
    /**
     * Show audio source help dialog
     */
    showSourceHelp() {
        const helpContent = `
            <div class="source-help-content">
                <h4>Audio Source Options</h4>
                <div class="source-option">
                    <strong>Microphone:</strong> Captures audio from your device's microphone. 
                    Requires microphone permission.
                </div>
                <div class="source-option">
                    <strong>System Audio:</strong> Captures audio playing on your computer. 
                    Requires screen sharing permission and browser support (Chrome/Edge).
                </div>
                <div class="source-note">
                    <strong>Note:</strong> System audio capture may not work in all browsers. 
                    If unavailable, the system will automatically fall back to microphone input.
                </div>
            </div>
        `
        
        // Create temporary help dialog
        const helpDialog = this.createElement('div', {
            className: 'source-help-dialog',
            innerHTML: `
                <div class="help-overlay"></div>
                <div class="help-content">
                    ${helpContent}
                    <button class="help-close">Close</button>
                </div>
            `
        })
        
        helpDialog.querySelector('.help-close').addEventListener('click', () => {
            document.body.removeChild(helpDialog)
        })
        
        helpDialog.querySelector('.help-overlay').addEventListener('click', () => {
            document.body.removeChild(helpDialog)
        })
        
        document.body.appendChild(helpDialog)
    }
    
    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        const errorElement = this.elements.errorMessage
        const errorText = errorElement.querySelector('.error-text')
        
        errorText.textContent = message
        errorElement.classList.remove('hidden')
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideError()
        }, 5000)
    }
    
    /**
     * Hide error message
     */
    hideError() {
        this.elements.errorMessage.classList.add('hidden')
    }
    
    /**
     * Start spectrum animation loop
     */
    startSpectrumAnimation() {
        if (this.spectrumState.animationFrame) return
        
        const animate = () => {
            if (this.audioEnabled && this.isVisible) {
                this.spectrumState.animationFrame = requestAnimationFrame(animate)
            } else {
                this.spectrumState.animationFrame = null
            }
        }
        
        animate()
    }
    
    /**
     * Stop spectrum animation loop
     */
    stopSpectrumAnimation() {
        if (this.spectrumState.animationFrame) {
            cancelAnimationFrame(this.spectrumState.animationFrame)
            this.spectrumState.animationFrame = null
        }
        
        // Clear spectrum display
        if (this.spectrumState.context) {
            const canvas = this.spectrumState.canvas
            this.spectrumState.context.clearRect(0, 0, canvas.width, canvas.height)
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
     * Get current UI state
     * @returns {Object} Current state
     */
    getState() {
        return {
            audioEnabled: this.audioEnabled,
            isVisible: this.isVisible,
            currentMode: this.currentMode,
            sensitivity: this.sensitivity
        }
    }
    
    /**
     * Update all UI components with audio data
     * @param {Object} audioData - Complete audio analysis data
     */
    updateAll(audioData) {
        if (!this.audioEnabled || !this.isVisible) return
        
        // Update spectrum
        if (audioData.spectrum) {
            this.updateSpectrum(audioData.spectrum)
        }
        
        // Update volume meter
        if (typeof audioData.overall === 'number') {
            this.updateVolumeMeter(audioData.overall)
        }
    }
    
    /**
     * Update with beat detection data
     * @param {Object} beatData - Beat detection results
     */
    updateBeat(beatData) {
        if (!this.audioEnabled || !this.isVisible) return
        
        this.updateBeatIndicator(beatData)
    }
    
    /**
     * Helper method to create DOM elements
     * @param {string} tag - HTML tag name
     * @param {Object} props - Element properties
     * @returns {HTMLElement} Created element
     */
    createElement(tag, props) {
        const element = document.createElement(tag)
        Object.assign(element, props)
        return element
    }
    
    /**
     * Dispose of UI components and clean up resources
     */
    dispose() {
        this.stopSpectrumAnimation()
        
        // Remove event listeners
        document.removeEventListener('click', this.documentClickHandler)
        document.removeEventListener('keydown', this.documentKeyHandler)
        
        // Remove elements from DOM
        if (this.elements.toggleButton && this.elements.toggleButton.parentNode) {
            this.elements.toggleButton.parentNode.removeChild(this.elements.toggleButton)
        }
        
        if (this.elements.panel && this.elements.panel.parentNode) {
            this.elements.panel.parentNode.removeChild(this.elements.panel)
        }
        
        // Clear references
        this.elements = {}
        this.callbacks = {}
        this.spectrumState = {}
    }
}