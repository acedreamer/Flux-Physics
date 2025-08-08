/**
 * Professional Audio Toggle Button
 * Clear ON/OFF states with visual feedback
 */

export class AudioToggleButton {
    constructor(fluxApp, container = document.body) {
        this.fluxApp = fluxApp
        this.container = container
        this.audioReactive = null
        this.isActive = false
        this.ui = null
        
        this.createButton()
        this.setupAudioSystem()
    }
    
    createButton() {
        // Remove any existing audio buttons
        const existing = this.container.querySelectorAll('.audio-toggle-btn, .device-audio-ui, .enhanced-audio-ui')
        existing.forEach(el => el.remove())
        
        this.ui = document.createElement('div')
        this.ui.className = 'audio-toggle-container'
        this.ui.innerHTML = `
            <div class="audio-toggle-panel" style="
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                background: rgba(0, 0, 0, 0.95);
                padding: 20px;
                border-radius: 16px;
                border: 2px solid #333;
                color: white;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
                min-width: 200px;
                transition: all 0.3s ease;
            ">
                <!-- Header -->
                <div class="header" style="
                    display: flex;
                    align-items: center;
                    margin-bottom: 16px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                ">
                    <div class="status-indicator" style="
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        background: #666;
                        margin-right: 12px;
                        transition: all 0.3s ease;
                    "></div>
                    <h3 style="
                        margin: 0;
                        font-size: 16px;
                        font-weight: 600;
                        color: #fff;
                    ">🎵 Audio Reactive</h3>
                </div>
                
                <!-- Toggle Button -->
                <div class="toggle-button" style="
                    position: relative;
                    width: 100%;
                    height: 50px;
                    background: #333;
                    border-radius: 25px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 2px solid #555;
                    overflow: hidden;
                    margin-bottom: 16px;
                ">
                    <!-- OFF State -->
                    <div class="off-state" style="
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 600;
                        font-size: 14px;
                        color: #999;
                        transition: all 0.3s ease;
                        opacity: 1;
                    ">
                        ⏸️ AUDIO OFF
                    </div>
                    
                    <!-- ON State -->
                    <div class="on-state" style="
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 600;
                        font-size: 14px;
                        color: white;
                        background: linear-gradient(135deg, #00FF00, #00CC00);
                        transition: all 0.3s ease;
                        opacity: 0;
                        transform: translateX(100%);
                    ">
                        🎵 AUDIO ON
                    </div>
                    
                    <!-- Slider -->
                    <div class="slider" style="
                        position: absolute;
                        top: 4px;
                        left: 4px;
                        width: 42px;
                        height: 42px;
                        background: white;
                        border-radius: 50%;
                        transition: all 0.3s ease;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 18px;
                    ">
                        ⏸️
                    </div>
                </div>
                
                <!-- Status Info -->
                <div class="status-info" style="
                    background: rgba(255, 255, 255, 0.05);
                    padding: 12px;
                    border-radius: 8px;
                    border-left: 3px solid #666;
                    transition: all 0.3s ease;
                ">
                    <div class="status-text" style="
                        font-size: 13px;
                        font-weight: 500;
                        margin-bottom: 6px;
                        color: #ccc;
                    ">
                        Status: <span class="status-value">Disabled</span>
                    </div>
                    <div class="source-text" style="
                        font-size: 12px;
                        color: #999;
                    ">
                        Click to enable audio reactive mode
                    </div>
                </div>
                
                <!-- Audio Level Indicator -->
                <div class="audio-level" style="
                    margin-top: 12px;
                    height: 4px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 2px;
                    overflow: hidden;
                    display: none;
                ">
                    <div class="level-bar" style="
                        height: 100%;
                        width: 0%;
                        background: linear-gradient(90deg, #00FF00, #FFFF00, #FF0000);
                        border-radius: 2px;
                        transition: width 0.1s ease;
                    "></div>
                </div>
            </div>
        `
        
        this.container.appendChild(this.ui)
        
        // Get element references
        this.elements = {
            panel: this.ui.querySelector('.audio-toggle-panel'),
            toggleButton: this.ui.querySelector('.toggle-button'),
            offState: this.ui.querySelector('.off-state'),
            onState: this.ui.querySelector('.on-state'),
            slider: this.ui.querySelector('.slider'),
            statusIndicator: this.ui.querySelector('.status-indicator'),
            statusInfo: this.ui.querySelector('.status-info'),
            statusValue: this.ui.querySelector('.status-value'),
            sourceText: this.ui.querySelector('.source-text'),
            audioLevel: this.ui.querySelector('.audio-level'),
            levelBar: this.ui.querySelector('.level-bar')
        }
        
        // Add click handler
        this.elements.toggleButton.addEventListener('click', () => this.toggle())
        
        // Add hover effects
        this.elements.toggleButton.addEventListener('mouseenter', () => {
            if (!this.isActive) {
                this.elements.toggleButton.style.borderColor = '#00FFFF'
                this.elements.toggleButton.style.transform = 'scale(1.02)'
            }
        })
        
        this.elements.toggleButton.addEventListener('mouseleave', () => {
            if (!this.isActive) {
                this.elements.toggleButton.style.borderColor = '#555'
                this.elements.toggleButton.style.transform = 'scale(1)'
            }
        })
    }
    
    async setupAudioSystem() {
        try {
            // Try to import the simple audio reactive system
            const { SimpleAudioReactive } = await import('./simple-audio-reactive.js')
            this.audioReactive = new SimpleAudioReactive(this.fluxApp)
            console.log('✅ Audio system ready')
        } catch (error) {
            console.error('❌ Failed to setup audio system:', error)
            this.showError('Audio system not available')
        }
    }
    
    async toggle() {
        if (!this.audioReactive) {
            this.showError('Audio system not ready')
            return
        }
        
        if (!this.isActive) {
            await this.turnOn()
        } else {
            this.turnOff()
        }
    }
    
    async turnOn() {
        try {
            this.updateUI('enabling')
            
            const result = await this.audioReactive.enable()
            
            if (result.success) {
                this.isActive = true
                this.updateUI('active', { source: result.source })
                this.startAudioVisualization()
                console.log('🎵 Audio reactive enabled!')
            } else {
                this.updateUI('error', { error: result.error })
                setTimeout(() => {
                    alert(`Failed to enable audio:\n\n${result.error}\n\nTry:\n• Use Chrome or Edge browser\n• Allow microphone/screen sharing\n• Check "Share system audio" option`)
                }, 100)
            }
        } catch (error) {
            this.updateUI('error', { error: error.message })
            console.error('❌ Failed to enable audio:', error)
        }
    }
    
    turnOff() {
        this.isActive = false
        this.audioReactive.disable()
        this.updateUI('disabled')
        this.stopAudioVisualization()
        console.log('🔇 Audio reactive disabled')
    }
    
    updateUI(state, data = {}) {
        const { panel, toggleButton, offState, onState, slider, statusIndicator, statusInfo, statusValue, sourceText, audioLevel } = this.elements
        
        switch (state) {
            case 'disabled':
                // OFF state
                panel.style.borderColor = '#333'
                toggleButton.style.background = '#333'
                toggleButton.style.borderColor = '#555'
                offState.style.opacity = '1'
                onState.style.opacity = '0'
                onState.style.transform = 'translateX(100%)'
                slider.style.transform = 'translateX(0)'
                slider.style.background = 'white'
                slider.textContent = '⏸️'
                statusIndicator.style.background = '#666'
                statusInfo.style.borderLeftColor = '#666'
                statusValue.textContent = 'Disabled'
                statusValue.style.color = '#999'
                sourceText.textContent = 'Click to enable audio reactive mode'
                audioLevel.style.display = 'none'
                break
                
            case 'enabling':
                // Enabling state
                panel.style.borderColor = '#FFA500'
                toggleButton.style.borderColor = '#FFA500'
                statusIndicator.style.background = '#FFA500'
                statusInfo.style.borderLeftColor = '#FFA500'
                statusValue.textContent = 'Enabling...'
                statusValue.style.color = '#FFA500'
                sourceText.textContent = 'Connecting to audio source...'
                slider.textContent = '⏳'
                break
                
            case 'active':
                // ON state
                panel.style.borderColor = '#00FF00'
                toggleButton.style.background = 'linear-gradient(135deg, #00FF00, #00CC00)'
                toggleButton.style.borderColor = '#00FF00'
                offState.style.opacity = '0'
                onState.style.opacity = '1'
                onState.style.transform = 'translateX(0)'
                slider.style.transform = 'translateX(calc(100% - 46px))'
                slider.style.background = '#00FF00'
                slider.textContent = '🎵'
                statusIndicator.style.background = '#00FF00'
                statusInfo.style.borderLeftColor = '#00FF00'
                statusValue.textContent = 'Active'
                statusValue.style.color = '#00FF00'
                sourceText.textContent = `Source: ${data.source || 'Audio'} • Click to disable`
                audioLevel.style.display = 'block'
                break
                
            case 'error':
                // Error state
                panel.style.borderColor = '#FF4444'
                toggleButton.style.borderColor = '#FF4444'
                statusIndicator.style.background = '#FF4444'
                statusInfo.style.borderLeftColor = '#FF4444'
                statusValue.textContent = 'Error'
                statusValue.style.color = '#FF4444'
                sourceText.textContent = `Error: ${data.error || 'Unknown error'}`
                slider.textContent = '❌'
                break
        }
    }
    
    startAudioVisualization() {
        if (this.visualizationInterval) {
            clearInterval(this.visualizationInterval)
        }
        
        this.visualizationInterval = setInterval(() => {
            if (!this.isActive || !this.audioReactive) return
            
            const status = this.audioReactive.getStatus()
            if (status.audioData) {
                const level = Math.min(status.audioData.overall * 100, 100)
                this.elements.levelBar.style.width = `${level}%`
                
                // Update source text with activity
                if (status.audioData.overall > 0.05) {
                    this.elements.sourceText.textContent = `🎵 Audio detected (${Math.round(level)}%) • Click to disable`
                } else {
                    this.elements.sourceText.textContent = 'Listening for audio • Click to disable'
                }
            }
        }, 100)
    }
    
    stopAudioVisualization() {
        if (this.visualizationInterval) {
            clearInterval(this.visualizationInterval)
            this.visualizationInterval = null
        }
    }
    
    showError(message) {
        this.updateUI('error', { error: message })
        setTimeout(() => {
            if (!this.isActive) {
                this.updateUI('disabled')
            }
        }, 3000)
    }
    
    destroy() {
        this.stopAudioVisualization()
        if (this.audioReactive && this.isActive) {
            this.audioReactive.disable()
        }
        if (this.ui) {
            this.ui.remove()
        }
    }
}

// Quick setup function
export function createAudioToggleButton(fluxApp, container = document.body) {
    return new AudioToggleButton(fluxApp, container)
}