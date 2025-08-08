/**
 * FLUX Audio Module - Modular audio reactive control with FLUX aesthetic
 */

export class FluxAudioModule {
    constructor(fluxApp, options = {}) {
        this.fluxApp = fluxApp
        this.options = {
            position: options.position || 'top-left',
            compact: options.compact || false,
            theme: options.theme || 'flux',
            ...options
        }
        
        this.isEnabled = false
        this.isInitializing = false
        this.audioReactive = null
        
        // Module elements
        this.moduleContainer = null
        this.toggleButton = null
        this.statusIndicator = null
        this.levelVisualizer = null
        this.infoPanel = null
        
        // Animation state
        this.animationFrame = null
        this.glowIntensity = 0
        this.pulsePhase = 0
        
        this.createModule()
    }
    
    createModule() {
        // Remove existing module
        const existing = document.querySelector('.flux-audio-module')
        if (existing) existing.remove()
        
        // Create main module container
        this.moduleContainer = document.createElement('div')
        this.moduleContainer.className = 'flux-audio-module'
        this.moduleContainer.innerHTML = this.getModuleHTML()
        
        // Apply positioning
        this.applyPositioning()
        
        document.body.appendChild(this.moduleContainer)
        
        // Get element references
        this.toggleButton = this.moduleContainer.querySelector('.flux-toggle-button')
        this.statusIndicator = this.moduleContainer.querySelector('.flux-status-indicator')
        this.levelVisualizer = this.moduleContainer.querySelector('.flux-level-visualizer')
        this.infoPanel = this.moduleContainer.querySelector('.flux-info-panel')
        
        // Setup interactions
        this.setupInteractions()
        
        // Start animation loop
        this.startAnimations()
        
        console.log('🎛️ FLUX Audio Module created')
    }
    
    getModuleHTML() {
        return `
            <!-- Main Toggle Button -->
            <div class="flux-toggle-button" data-state="disabled">
                <div class="flux-button-core">
                    <div class="flux-button-ring"></div>
                    <div class="flux-button-center">
                        <div class="flux-audio-icon">🎵</div>
                    </div>
                </div>
                <div class="flux-button-glow"></div>
            </div>
            
            <!-- Status Indicator -->
            <div class="flux-status-indicator">
                <div class="flux-status-dot"></div>
                <div class="flux-status-text">AUDIO</div>
            </div>
            
            <!-- Level Visualizer -->
            <div class="flux-level-visualizer">
                <div class="flux-level-bars">
                    ${Array.from({length: 8}, (_, i) => 
                        `<div class="flux-level-bar" data-index="${i}"></div>`
                    ).join('')}
                </div>
                <div class="flux-level-label">REACTIVE</div>
            </div>
            
            <!-- Info Panel (expandable) -->
            <div class="flux-info-panel" data-expanded="false">
                <div class="flux-info-header">
                    <span class="flux-info-title">AUDIO REACTIVE</span>
                    <div class="flux-expand-icon">▼</div>
                </div>
                <div class="flux-info-content">
                    <div class="flux-info-row">
                        <span class="flux-info-label">STATUS</span>
                        <span class="flux-info-value" id="flux-status-value">DISABLED</span>
                    </div>
                    <div class="flux-info-row">
                        <span class="flux-info-label">SOURCE</span>
                        <span class="flux-info-value" id="flux-source-value">NONE</span>
                    </div>
                    <div class="flux-info-row">
                        <span class="flux-info-label">LEVEL</span>
                        <span class="flux-info-value" id="flux-level-value">0%</span>
                    </div>
                </div>
            </div>
            
            <style>
                .flux-audio-module {
                    position: fixed;
                    z-index: 10000;
                    font-family: 'Courier New', monospace;
                    user-select: none;
                    pointer-events: none;
                }
                
                .flux-audio-module * {
                    pointer-events: auto;
                }
                
                /* Main Toggle Button */
                .flux-toggle-button {
                    position: relative;
                    width: 60px;
                    height: 60px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    margin-bottom: 15px;
                }
                
                .flux-button-core {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: radial-gradient(circle at 30% 30%, rgba(0, 255, 255, 0.1), rgba(0, 0, 0, 0.9));
                    border: 2px solid rgba(0, 255, 255, 0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                    backdrop-filter: blur(10px);
                }
                
                .flux-button-ring {
                    position: absolute;
                    top: -4px;
                    left: -4px;
                    right: -4px;
                    bottom: -4px;
                    border-radius: 50%;
                    border: 1px solid rgba(0, 255, 255, 0.2);
                    opacity: 0;
                    transition: all 0.3s ease;
                }
                
                .flux-button-center {
                    position: relative;
                    z-index: 2;
                }
                
                .flux-audio-icon {
                    font-size: 24px;
                    color: rgba(0, 255, 255, 0.7);
                    transition: all 0.3s ease;
                    text-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
                }
                
                .flux-button-glow {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 80px;
                    height: 80px;
                    transform: translate(-50%, -50%);
                    background: radial-gradient(circle, rgba(0, 255, 255, 0.1) 0%, transparent 70%);
                    border-radius: 50%;
                    opacity: 0;
                    transition: all 0.3s ease;
                    pointer-events: none;
                }
                
                /* Button States */
                .flux-toggle-button[data-state="disabled"]:hover .flux-button-core {
                    border-color: rgba(0, 255, 255, 0.5);
                    box-shadow: 0 0 20px rgba(0, 255, 255, 0.1);
                }
                
                .flux-toggle-button[data-state="disabled"]:hover .flux-button-ring {
                    opacity: 1;
                    transform: scale(1.1);
                }
                
                .flux-toggle-button[data-state="enabling"] .flux-button-core {
                    border-color: rgba(255, 165, 0, 0.8);
                    box-shadow: 0 0 30px rgba(255, 165, 0, 0.3);
                    animation: flux-pulse 1s ease-in-out infinite;
                }
                
                .flux-toggle-button[data-state="enabling"] .flux-audio-icon {
                    color: rgba(255, 165, 0, 0.9);
                    text-shadow: 0 0 15px rgba(255, 165, 0, 0.5);
                }
                
                .flux-toggle-button[data-state="enabled"] .flux-button-core {
                    border-color: rgba(0, 255, 0, 0.8);
                    background: radial-gradient(circle at 30% 30%, rgba(0, 255, 0, 0.15), rgba(0, 0, 0, 0.9));
                    box-shadow: 0 0 40px rgba(0, 255, 0, 0.2);
                }
                
                .flux-toggle-button[data-state="enabled"] .flux-audio-icon {
                    color: rgba(0, 255, 0, 1);
                    text-shadow: 0 0 20px rgba(0, 255, 0, 0.6);
                }
                
                .flux-toggle-button[data-state="enabled"] .flux-button-glow {
                    opacity: 1;
                    background: radial-gradient(circle, rgba(0, 255, 0, 0.15) 0%, transparent 70%);
                }
                
                .flux-toggle-button[data-state="error"] .flux-button-core {
                    border-color: rgba(255, 68, 68, 0.8);
                    box-shadow: 0 0 30px rgba(255, 68, 68, 0.3);
                    animation: flux-error-pulse 0.5s ease-in-out 3;
                }
                
                .flux-toggle-button[data-state="error"] .flux-audio-icon {
                    color: rgba(255, 68, 68, 0.9);
                    text-shadow: 0 0 15px rgba(255, 68, 68, 0.5);
                }
                
                /* Status Indicator */
                .flux-status-indicator {
                    display: flex;
                    align-items: center;
                    margin-bottom: 10px;
                    opacity: 0.7;
                    transition: all 0.3s ease;
                }
                
                .flux-status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: rgba(100, 100, 100, 0.6);
                    margin-right: 8px;
                    transition: all 0.3s ease;
                    box-shadow: 0 0 0 0 rgba(100, 100, 100, 0.4);
                }
                
                .flux-status-text {
                    font-size: 10px;
                    color: rgba(0, 255, 255, 0.6);
                    font-weight: bold;
                    letter-spacing: 1px;
                    transition: all 0.3s ease;
                }
                
                /* Level Visualizer */
                .flux-level-visualizer {
                    margin-bottom: 15px;
                    opacity: 0;
                    transition: all 0.3s ease;
                    transform: translateY(10px);
                }
                
                .flux-level-visualizer.active {
                    opacity: 1;
                    transform: translateY(0);
                }
                
                .flux-level-bars {
                    display: flex;
                    align-items: end;
                    height: 30px;
                    gap: 2px;
                    margin-bottom: 5px;
                }
                
                .flux-level-bar {
                    width: 3px;
                    height: 2px;
                    background: rgba(0, 255, 255, 0.3);
                    border-radius: 1px;
                    transition: all 0.1s ease-out;
                    transform-origin: bottom;
                }
                
                .flux-level-label {
                    font-size: 8px;
                    color: rgba(0, 255, 255, 0.4);
                    text-align: center;
                    letter-spacing: 1px;
                    font-weight: bold;
                }
                
                /* Info Panel */
                .flux-info-panel {
                    background: rgba(0, 0, 0, 0.8);
                    border: 1px solid rgba(0, 255, 255, 0.2);
                    border-radius: 8px;
                    backdrop-filter: blur(15px);
                    overflow: hidden;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    max-width: 200px;
                }
                
                .flux-info-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 12px;
                    cursor: pointer;
                    border-bottom: 1px solid rgba(0, 255, 255, 0.1);
                    transition: all 0.3s ease;
                }
                
                .flux-info-header:hover {
                    background: rgba(0, 255, 255, 0.05);
                }
                
                .flux-info-title {
                    font-size: 10px;
                    color: rgba(0, 255, 255, 0.8);
                    font-weight: bold;
                    letter-spacing: 1px;
                }
                
                .flux-expand-icon {
                    font-size: 8px;
                    color: rgba(0, 255, 255, 0.6);
                    transition: all 0.3s ease;
                }
                
                .flux-info-panel[data-expanded="true"] .flux-expand-icon {
                    transform: rotate(180deg);
                }
                
                .flux-info-content {
                    max-height: 0;
                    overflow: hidden;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .flux-info-panel[data-expanded="true"] .flux-info-content {
                    max-height: 200px;
                }
                
                .flux-info-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 6px 12px;
                    border-bottom: 1px solid rgba(0, 255, 255, 0.05);
                }
                
                .flux-info-row:last-child {
                    border-bottom: none;
                }
                
                .flux-info-label {
                    font-size: 9px;
                    color: rgba(0, 255, 255, 0.6);
                    font-weight: bold;
                    letter-spacing: 0.5px;
                }
                
                .flux-info-value {
                    font-size: 9px;
                    color: rgba(255, 255, 255, 0.8);
                    font-weight: bold;
                }
                
                /* Animations */
                @keyframes flux-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                
                @keyframes flux-error-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                
                /* Responsive positioning */
                .flux-audio-module.position-top-left {
                    top: 20px;
                    left: 20px;
                }
                
                .flux-audio-module.position-top-right {
                    top: 20px;
                    right: 20px;
                }
                
                .flux-audio-module.position-bottom-left {
                    bottom: 20px;
                    left: 20px;
                }
                
                .flux-audio-module.position-bottom-right {
                    bottom: 20px;
                    right: 20px;
                }
                
                /* Enhanced visual feedback */
                .flux-audio-module.audio-active .flux-level-visualizer {
                    animation: flux-glow-pulse 2s ease-in-out infinite;
                }
                
                @keyframes flux-glow-pulse {
                    0%, 100% { 
                        filter: drop-shadow(0 0 5px rgba(0, 255, 255, 0.3));
                    }
                    50% { 
                        filter: drop-shadow(0 0 15px rgba(0, 255, 255, 0.6));
                    }
                }
                
                /* Improved accessibility */
                .flux-audio-module button:focus {
                    outline: 2px solid rgba(0, 255, 255, 0.8);
                    outline-offset: 2px;
                }
                
                .flux-audio-module [role="button"]:focus {
                    outline: 2px solid rgba(0, 255, 255, 0.8);
                    outline-offset: 2px;
                }
                
                /* Compact mode */
                .flux-audio-module.compact .flux-info-panel {
                    display: none;
                }
                
                .flux-audio-module.compact .flux-toggle-button {
                    width: 45px;
                    height: 45px;
                }
                
                .flux-audio-module.compact .flux-audio-icon {
                    font-size: 18px;
                }
            </style>
        `
    }
    
    applyPositioning() {
        const position = this.options.position.replace('_', '-')
        this.moduleContainer.classList.add(`position-${position}`)
        
        if (this.options.compact) {
            this.moduleContainer.classList.add('compact')
        }
    }
    
    setupInteractions() {
        // Toggle button click
        this.toggleButton.addEventListener('click', () => this.toggleAudioMode())
        
        // Info panel expand/collapse
        const infoHeader = this.infoPanel.querySelector('.flux-info-header')
        infoHeader.addEventListener('click', () => this.toggleInfoPanel())
        
        // Hover effects
        this.toggleButton.addEventListener('mouseenter', () => this.onButtonHover(true))
        this.toggleButton.addEventListener('mouseleave', () => this.onButtonHover(false))
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts()
        
        // Accessibility attributes
        this.setupAccessibility()
    }
    
    setupKeyboardShortcuts() {
        // Global keyboard shortcuts
        this.keyboardHandler = (event) => {
            // Only handle shortcuts when not typing in input fields
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                return
            }
            
            switch (event.key.toLowerCase()) {
                case ' ': // Space - Toggle audio mode
                    event.preventDefault()
                    this.toggleAudioMode()
                    break
                case 'a': // A - Toggle audio mode (alternative)
                    if (event.ctrlKey || event.metaKey) return // Don't interfere with Ctrl+A
                    event.preventDefault()
                    this.toggleAudioMode()
                    break
                case 'i': // I - Toggle info panel
                    event.preventDefault()
                    this.toggleInfoPanel()
                    break
                case 'escape': // Escape - Close info panel
                    if (this.infoPanel.dataset.expanded === 'true') {
                        event.preventDefault()
                        this.toggleInfoPanel()
                    }
                    break
            }
        }
        
        document.addEventListener('keydown', this.keyboardHandler)
    }
    
    setupAccessibility() {
        // Add ARIA attributes
        this.toggleButton.setAttribute('role', 'button')
        this.toggleButton.setAttribute('aria-label', 'Toggle audio reactive mode')
        this.toggleButton.setAttribute('aria-pressed', 'false')
        this.toggleButton.setAttribute('tabindex', '0')
        
        // Add keyboard navigation for toggle button
        this.toggleButton.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                this.toggleAudioMode()
            }
        })
        
        // Info panel accessibility
        const infoHeader = this.infoPanel.querySelector('.flux-info-header')
        infoHeader.setAttribute('role', 'button')
        infoHeader.setAttribute('aria-label', 'Toggle audio information panel')
        infoHeader.setAttribute('aria-expanded', 'false')
        infoHeader.setAttribute('tabindex', '0')
        
        infoHeader.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                this.toggleInfoPanel()
            }
        })
        
        // Update ARIA states when toggling
        this.originalToggleInfoPanel = this.toggleInfoPanel.bind(this)
        this.toggleInfoPanel = () => {
            this.originalToggleInfoPanel()
            const isExpanded = this.infoPanel.dataset.expanded === 'true'
            infoHeader.setAttribute('aria-expanded', isExpanded.toString())
        }
    }
    
    onButtonHover(isHovering) {
        if (this.isEnabled || this.isInitializing) return
        
        if (isHovering) {
            this.toggleButton.style.transform = 'scale(1.05)'
        } else {
            this.toggleButton.style.transform = 'scale(1)'
        }
    }
    
    toggleInfoPanel() {
        const isExpanded = this.infoPanel.dataset.expanded === 'true'
        this.infoPanel.dataset.expanded = (!isExpanded).toString()
    }
    
    async toggleAudioMode() {
        if (this.isInitializing) return
        
        console.log('🔄 FLUX Audio Module toggle clicked, current state:', this.isEnabled)
        
        if (!this.isEnabled) {
            await this.enableAudioMode()
        } else {
            this.disableAudioMode()
        }
    }
    
    async enableAudioMode() {
        this.isInitializing = true
        this.updateState('enabling')
        
        try {
            // Use FluxApp's built-in audio system
            if (typeof this.fluxApp.toggleAudioMode === 'function') {
                const result = await this.fluxApp.toggleAudioMode(true)
                
                if (result !== false) {
                    this.isEnabled = true
                    this.updateState('enabled')
                    this.startLevelMonitoring()
                    this.showSuccessMessage()
                    console.log('✅ FLUX Audio Module enabled!')
                } else {
                    throw new Error('Failed to enable audio reactive mode')
                }
            } else {
                // Fallback to SimpleAudioReactive
                if (!this.audioReactive) {
                    const { SimpleAudioReactive } = await import('./simple-audio-reactive.js')
                    this.audioReactive = new SimpleAudioReactive(this.fluxApp)
                }
                
                const result = await this.audioReactive.enable()
                
                if (result.success) {
                    this.isEnabled = true
                    this.updateState('enabled')
                    this.startLevelMonitoring()
                    this.showSuccessMessage()
                    console.log('✅ FLUX Audio Module enabled via SimpleAudioReactive!')
                } else {
                    throw new Error(result.error)
                }
            }
            
        } catch (error) {
            this.updateState('error')
            console.error('❌ FLUX Audio Module failed:', error)
            
            // Show user-friendly error message
            this.showErrorMessage(error.message)
            
            // Show error briefly then reset
            setTimeout(() => {
                this.updateState('disabled')
            }, 3000)
        }
        
        this.isInitializing = false
    }
    
    showSuccessMessage() {
        this.showToast('🎵 Audio Reactive Mode Enabled!', 'success')
    }
    
    showErrorMessage(errorMessage) {
        let userMessage = 'Audio setup failed. '
        
        if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
            userMessage += 'Please allow microphone access and try again.'
        } else if (errorMessage.includes('NotFoundError')) {
            userMessage += 'No microphone found. Please connect an audio device.'
        } else if (errorMessage.includes('system audio')) {
            userMessage += 'System audio not available. Using microphone instead.'
        } else {
            userMessage += 'Please try using Chrome or Edge browser.'
        }
        
        this.showToast(userMessage, 'error')
    }
    
    showToast(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div')
        toast.className = `flux-toast flux-toast-${type}`
        toast.textContent = message
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? 'rgba(255, 68, 68, 0.9)' : 
                        type === 'success' ? 'rgba(0, 255, 0, 0.9)' : 
                        'rgba(0, 255, 255, 0.9)'};
            color: ${type === 'error' ? 'white' : 'black'};
            padding: 12px 20px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            font-weight: bold;
            z-index: 20000;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            animation: flux-toast-in 0.3s ease-out;
        `
        
        // Add animation styles
        const style = document.createElement('style')
        style.textContent = `
            @keyframes flux-toast-in {
                from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
            @keyframes flux-toast-out {
                from { opacity: 1; transform: translateX(-50%) translateY(0); }
                to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            }
        `
        document.head.appendChild(style)
        
        document.body.appendChild(toast)
        
        // Auto-remove after delay
        setTimeout(() => {
            toast.style.animation = 'flux-toast-out 0.3s ease-in'
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast)
                }
                if (style.parentNode) {
                    style.parentNode.removeChild(style)
                }
            }, 300)
        }, type === 'error' ? 5000 : 3000)
    }
    
    disableAudioMode() {
        // Disable audio mode
        if (typeof this.fluxApp.toggleAudioMode === 'function') {
            this.fluxApp.toggleAudioMode(false)
            console.log('❌ FLUX Audio Module disabled via FluxApp')
        } else if (this.audioReactive) {
            this.audioReactive.disable()
            console.log('❌ FLUX Audio Module disabled via SimpleAudioReactive')
        }
        
        this.isEnabled = false
        this.stopLevelMonitoring()
        this.updateState('disabled')
    }
    
    updateState(state) {
        this.toggleButton.dataset.state = state
        
        const statusDot = this.statusIndicator.querySelector('.flux-status-dot')
        const statusText = this.statusIndicator.querySelector('.flux-status-text')
        const statusValue = document.getElementById('flux-status-value')
        const sourceValue = document.getElementById('flux-source-value')
        
        // Update ARIA attributes
        this.toggleButton.setAttribute('aria-pressed', (state === 'enabled').toString())
        
        // Update module class for enhanced styling
        this.moduleContainer.classList.toggle('audio-active', state === 'enabled')
        
        switch (state) {
            case 'disabled':
                statusDot.style.background = 'rgba(100, 100, 100, 0.6)'
                statusDot.style.boxShadow = '0 0 0 0 rgba(100, 100, 100, 0.4)'
                statusText.style.color = 'rgba(0, 255, 255, 0.6)'
                statusValue.textContent = 'DISABLED'
                sourceValue.textContent = 'NONE'
                this.levelVisualizer.classList.remove('active')
                this.toggleButton.setAttribute('aria-label', 'Enable audio reactive mode')
                break
                
            case 'enabling':
                statusDot.style.background = 'rgba(255, 165, 0, 0.8)'
                statusDot.style.boxShadow = '0 0 0 4px rgba(255, 165, 0, 0.3)'
                statusText.style.color = 'rgba(255, 165, 0, 0.9)'
                statusValue.textContent = 'CONNECTING'
                this.toggleButton.setAttribute('aria-label', 'Connecting to audio...')
                break
                
            case 'enabled':
                statusDot.style.background = 'rgba(0, 255, 0, 0.8)'
                statusDot.style.boxShadow = '0 0 0 4px rgba(0, 255, 0, 0.3)'
                statusText.style.color = 'rgba(0, 255, 0, 0.9)'
                statusValue.textContent = 'ACTIVE'
                sourceValue.textContent = this.getAudioSourceName()
                this.levelVisualizer.classList.add('active')
                this.toggleButton.setAttribute('aria-label', 'Disable audio reactive mode')
                break
                
            case 'error':
                statusDot.style.background = 'rgba(255, 68, 68, 0.8)'
                statusDot.style.boxShadow = '0 0 0 4px rgba(255, 68, 68, 0.3)'
                statusText.style.color = 'rgba(255, 68, 68, 0.9)'
                statusValue.textContent = 'ERROR'
                this.toggleButton.setAttribute('aria-label', 'Audio setup failed - click to retry')
                break
        }
    }
    
    getAudioSourceName() {
        // Try to determine the actual audio source being used
        if (this.fluxApp.audioAnalyzer && this.fluxApp.audioAnalyzer.currentSource) {
            return this.fluxApp.audioAnalyzer.currentSource.toUpperCase()
        }
        return 'SYSTEM'
    }
    
    startLevelMonitoring() {
        if (this.levelMonitorInterval) {
            clearInterval(this.levelMonitorInterval)
        }
        
        this.levelMonitorInterval = setInterval(() => {
            if (!this.isEnabled) return
            
            let audioData = null
            
            // Try to get audio data from FluxApp first
            if (this.fluxApp.audioState && this.fluxApp.audioState.lastAudioData) {
                audioData = this.fluxApp.audioState.lastAudioData
            }
            // Fallback to SimpleAudioReactive
            else if (this.audioReactive) {
                const status = this.audioReactive.getStatus()
                if (status.isActive && status.audioData) {
                    audioData = status.audioData
                }
            }
            
            if (audioData) {
                this.updateLevelVisualizer(audioData)
                this.updateInfoPanel(audioData)
            }
        }, 50) // Higher frequency for smoother visualization
    }
    
    stopLevelMonitoring() {
        if (this.levelMonitorInterval) {
            clearInterval(this.levelMonitorInterval)
            this.levelMonitorInterval = null
        }
        
        // Reset visualizer
        const bars = this.levelVisualizer.querySelectorAll('.flux-level-bar')
        bars.forEach(bar => {
            bar.style.height = '2px'
            bar.style.background = 'rgba(0, 255, 255, 0.3)'
        })
    }
    
    updateLevelVisualizer(audioData) {
        const { bass, mids, treble, overall } = audioData
        const bars = this.levelVisualizer.querySelectorAll('.flux-level-bar')
        
        // Create frequency spectrum visualization
        const levels = [
            bass * 0.8,
            bass * 0.9,
            (bass + mids) * 0.5,
            mids * 0.8,
            mids * 1.0,
            (mids + treble) * 0.5,
            treble * 0.9,
            treble * 1.1
        ]
        
        bars.forEach((bar, index) => {
            const level = Math.max(0.1, levels[index] || 0)
            const height = Math.min(level * 30, 30)
            
            bar.style.height = `${height}px`
            
            // Color based on frequency range
            if (index < 3) {
                // Bass - Red to Orange
                bar.style.background = `rgba(255, ${100 + level * 100}, 0, ${0.6 + level * 0.4})`
            } else if (index < 6) {
                // Mids - Green to Cyan
                bar.style.background = `rgba(0, 255, ${level * 255}, ${0.6 + level * 0.4})`
            } else {
                // Treble - Cyan to Blue
                bar.style.background = `rgba(${level * 100}, ${100 + level * 155}, 255, ${0.6 + level * 0.4})`
            }
        })
    }
    
    updateInfoPanel(audioData) {
        const levelValue = document.getElementById('flux-level-value')
        if (levelValue) {
            const percentage = Math.round(audioData.overall * 100)
            levelValue.textContent = `${percentage}%`
            
            // Color based on level
            if (percentage > 50) {
                levelValue.style.color = 'rgba(0, 255, 0, 0.9)'
            } else if (percentage > 20) {
                levelValue.style.color = 'rgba(255, 255, 0, 0.9)'
            } else {
                levelValue.style.color = 'rgba(255, 255, 255, 0.6)'
            }
        }
    }
    
    startAnimations() {
        const animate = () => {
            this.pulsePhase += 0.05
            
            // Subtle glow animation when enabled
            if (this.isEnabled) {
                this.glowIntensity = 0.5 + Math.sin(this.pulsePhase) * 0.2
                const glow = this.toggleButton.querySelector('.flux-button-glow')
                if (glow) {
                    glow.style.opacity = this.glowIntensity
                }
            }
            
            this.animationFrame = requestAnimationFrame(animate)
        }
        
        animate()
    }
    
    destroy() {
        this.stopLevelMonitoring()
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame)
        }
        
        if (this.audioReactive) {
            this.audioReactive.disable()
        }
        
        // Remove keyboard event listener
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler)
            this.keyboardHandler = null
        }
        
        if (this.moduleContainer) {
            this.moduleContainer.remove()
        }
        
        console.log('🗑️ FLUX Audio Module destroyed')
    }
}

// Setup function with options
export function setupFluxAudioModule(fluxApp, options = {}) {
    const audioModule = new FluxAudioModule(fluxApp, options)
    
    // Make it available globally for debugging
    window.fluxAudioModule = audioModule
    
    console.log('🎛️ FLUX Audio Module setup complete!')
    
    return audioModule
}