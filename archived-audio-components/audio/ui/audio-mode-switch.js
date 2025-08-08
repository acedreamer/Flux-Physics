/**
 * Audio Mode Switch - Clean toggle UI for audio reactive mode
 */

export class AudioModeSwitch {
    constructor(fluxApp, container = document.body) {
        this.fluxApp = fluxApp
        this.container = container
        this.audioReactive = null
        this.isEnabled = false
        this.switchElement = null
        this.statusElement = null
        
        this.createUI()
    }
    
    createUI() {
        // Remove any existing audio switch
        const existing = this.container.querySelector('.audio-mode-switch')
        if (existing) {
            existing.remove()
        }
        
        // Create main switch container
        const switchContainer = document.createElement('div')
        switchContainer.className = 'audio-mode-switch'
        switchContainer.innerHTML = `
            <div class="audio-switch-panel" style="
                position: fixed;
                top: 20px;
                left: 20px;
                z-index: 10000;
                background: rgba(0, 0, 0, 0.9);
                padding: 20px;
                border-radius: 12px;
                border: 2px solid #333;
                color: white;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                min-width: 280px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
                transition: all 0.3s ease;
            ">
                <!-- Header -->
                <div class="switch-header" style="
                    display: flex;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                ">
                    <div class="status-indicator" style="
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        background: #666;
                        margin-right: 12px;
                        transition: all 0.3s ease;
                        box-shadow: 0 0 0 0 rgba(102, 102, 102, 0.4);
                    "></div>
                    <h3 style="
                        margin: 0;
                        font-size: 16px;
                        font-weight: 600;
                        color: #fff;
                    ">🎵 Audio Reactive Mode</h3>
                </div>
                
                <!-- Toggle Switch -->
                <div class="toggle-container" style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 20px;
                ">
                    <span style="
                        font-size: 14px;
                        font-weight: 500;
                        color: #ccc;
                    ">Enable Audio Mode</span>
                    
                    <div class="toggle-switch" style="
                        position: relative;
                        width: 50px;
                        height: 26px;
                        background: #333;
                        border-radius: 13px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        border: 2px solid #555;
                    ">
                        <div class="toggle-slider" style="
                            position: absolute;
                            top: 2px;
                            left: 2px;
                            width: 18px;
                            height: 18px;
                            background: #666;
                            border-radius: 50%;
                            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
                        "></div>
                    </div>
                </div>
                
                <!-- Status Display -->
                <div class="status-display" style="
                    background: rgba(255, 255, 255, 0.05);
                    padding: 15px;
                    border-radius: 8px;
                    border-left: 4px solid #666;
                    transition: all 0.3s ease;
                ">
                    <div class="status-text" style="
                        font-size: 13px;
                        font-weight: 500;
                        margin-bottom: 8px;
                        color: #ccc;
                    ">
                        Status: <span class="status-value" style="color: #666;">●</span> <span class="status-label">Disabled</span>
                    </div>
                    <div class="source-text" style="
                        font-size: 12px;
                        color: #aaa;
                        margin-bottom: 8px;
                    ">
                        Source: <span class="source-value">None</span>
                    </div>
                    <div class="activity-indicator" style="
                        font-size: 11px;
                        color: #888;
                        display: none;
                    ">
                        🎵 Listening for audio...
                    </div>
                </div>
                
                <!-- Audio Level Bar -->
                <div class="audio-level-container" style="
                    margin-top: 15px;
                    display: none;
                ">
                    <div style="
                        font-size: 11px;
                        color: #aaa;
                        margin-bottom: 5px;
                    ">Audio Level</div>
                    <div class="level-bar-bg" style="
                        height: 6px;
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 3px;
                        overflow: hidden;
                        position: relative;
                    ">
                        <div class="level-bar" style="
                            height: 100%;
                            width: 0%;
                            background: linear-gradient(90deg, #00FF00 0%, #FFFF00 50%, #FF4444 100%);
                            border-radius: 3px;
                            transition: width 0.1s ease-out;
                        "></div>
                    </div>
                </div>
                
                <!-- Instructions -->
                <div class="instructions" style="
                    margin-top: 15px;
                    padding: 10px;
                    background: rgba(0, 150, 255, 0.1);
                    border-radius: 6px;
                    border: 1px solid rgba(0, 150, 255, 0.2);
                    font-size: 11px;
                    color: #aaa;
                    line-height: 1.4;
                ">
                    💡 <strong>Tip:</strong> Use Chrome/Edge for system audio capture, or allow microphone access for ambient audio.
                </div>
            </div>
        `
        
        this.container.appendChild(switchContainer)
        
        // Get UI elements
        this.switchElement = switchContainer.querySelector('.toggle-switch')
        this.statusElement = switchContainer.querySelector('.status-display')
        this.statusIndicator = switchContainer.querySelector('.status-indicator')
        this.toggleSlider = switchContainer.querySelector('.toggle-slider')
        this.statusValue = switchContainer.querySelector('.status-value')
        this.statusLabel = switchContainer.querySelector('.status-label')
        this.sourceValue = switchContainer.querySelector('.source-value')
        this.activityIndicator = switchContainer.querySelector('.activity-indicator')
        this.levelContainer = switchContainer.querySelector('.audio-level-container')
        this.levelBar = switchContainer.querySelector('.level-bar')
        
        // Add click handler
        this.switchElement.addEventListener('click', () => this.toggleAudioMode())
        
        // Add hover effects
        this.switchElement.addEventListener('mouseenter', () => {
            if (!this.isEnabled) {
                this.switchElement.style.borderColor = '#0099FF'
            }
        })
        
        this.switchElement.addEventListener('mouseleave', () => {
            if (!this.isEnabled) {
                this.switchElement.style.borderColor = '#555'
            }
        })
        
        console.log('🎛️ Audio Mode Switch UI created')
    }
    
    async toggleAudioMode() {
        console.log('🔄 Audio mode toggle clicked, current state:', this.isEnabled)
        
        if (!this.isEnabled) {
            // Enable audio mode
            this.updateUI('enabling')
            
            try {
                // Use the FluxApp's built-in audio reactive system
                if (typeof this.fluxApp.toggleAudioMode === 'function') {
                    const result = await this.fluxApp.toggleAudioMode(true)
                    
                    if (result !== false) {
                        this.isEnabled = true
                        this.updateUI('enabled', { source: 'System Audio' })
                        this.startLevelMonitoring()
                        console.log('✅ Audio reactive mode enabled via FluxApp!')
                    } else {
                        throw new Error('Failed to enable audio reactive mode')
                    }
                } else {
                    // Fallback to SimpleAudioReactive if FluxApp doesn't have audio support
                    if (!this.audioReactive) {
                        const { SimpleAudioReactive } = await import('./simple-audio-reactive.js')
                        this.audioReactive = new SimpleAudioReactive(this.fluxApp)
                    }
                    
                    const result = await this.audioReactive.enable()
                    
                    if (result.success) {
                        this.isEnabled = true
                        this.updateUI('enabled', { source: result.source })
                        this.startLevelMonitoring()
                        console.log('✅ Audio reactive mode enabled via SimpleAudioReactive!')
                    } else {
                        throw new Error(result.error)
                    }
                }
                
            } catch (error) {
                this.updateUI('error', { error: error.message })
                console.error('❌ Audio reactive initialization failed:', error)
                
                // Show user-friendly error
                setTimeout(() => {
                    alert(`Audio setup failed: ${error.message}\\n\\nTips:\\n• Use Chrome or Edge browser\\n• Check "Share system audio" in the dialog\\n• Allow microphone access as fallback`)
                }, 100)
                
                // Reset to disabled after showing error
                setTimeout(() => this.updateUI('disabled'), 3000)
            }
            
        } else {
            // Disable audio mode
            if (typeof this.fluxApp.toggleAudioMode === 'function') {
                this.fluxApp.toggleAudioMode(false)
                console.log('❌ Audio reactive mode disabled via FluxApp')
            } else if (this.audioReactive) {
                this.audioReactive.disable()
                console.log('❌ Audio reactive mode disabled via SimpleAudioReactive')
            }
            
            this.isEnabled = false
            this.stopLevelMonitoring()
            this.updateUI('disabled')
        }
    }
    
    updateUI(state, data = {}) {
        const panel = this.container.querySelector('.audio-switch-panel')
        
        switch (state) {
            case 'disabled':
                panel.style.borderColor = '#333'
                this.statusIndicator.style.background = '#666'
                this.statusIndicator.style.boxShadow = '0 0 0 0 rgba(102, 102, 102, 0.4)'
                this.switchElement.style.background = '#333'
                this.switchElement.style.borderColor = '#555'
                this.toggleSlider.style.left = '2px'
                this.toggleSlider.style.background = '#666'
                this.statusElement.style.borderLeftColor = '#666'
                this.statusValue.style.color = '#666'
                this.statusLabel.textContent = 'Disabled'
                this.sourceValue.textContent = 'None'
                this.activityIndicator.style.display = 'none'
                this.levelContainer.style.display = 'none'
                break
                
            case 'enabling':
                panel.style.borderColor = '#FFA500'
                this.statusIndicator.style.background = '#FFA500'
                this.statusIndicator.style.boxShadow = '0 0 0 4px rgba(255, 165, 0, 0.3)'
                this.statusElement.style.borderLeftColor = '#FFA500'
                this.statusValue.style.color = '#FFA500'
                this.statusLabel.textContent = 'Connecting...'
                break
                
            case 'enabled':
                panel.style.borderColor = '#00FF00'
                this.statusIndicator.style.background = '#00FF00'
                this.statusIndicator.style.boxShadow = '0 0 0 4px rgba(0, 255, 0, 0.3)'
                this.switchElement.style.background = '#00AA00'
                this.switchElement.style.borderColor = '#00FF00'
                this.toggleSlider.style.left = '26px'
                this.toggleSlider.style.background = '#00FF00'
                this.statusElement.style.borderLeftColor = '#00FF00'
                this.statusValue.style.color = '#00FF00'
                this.statusLabel.textContent = 'Active'
                this.sourceValue.innerHTML = `<span style="color: #00FFFF;">${data.source || 'Unknown'}</span>`
                this.activityIndicator.style.display = 'block'
                this.levelContainer.style.display = 'block'
                break
                
            case 'error':
                panel.style.borderColor = '#FF4444'
                this.statusIndicator.style.background = '#FF4444'
                this.statusIndicator.style.boxShadow = '0 0 0 4px rgba(255, 68, 68, 0.3)'
                this.statusElement.style.borderLeftColor = '#FF4444'
                this.statusValue.style.color = '#FF4444'
                this.statusLabel.textContent = 'Error'
                this.sourceValue.innerHTML = `<span style="color: #FF4444;">${data.error || 'Unknown error'}</span>`
                break
        }
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
                const { bass, mids, treble, overall } = audioData
                
                // Update level bar
                const level = Math.min(overall * 100, 100)
                this.levelBar.style.width = `${level}%`
                
                // Update activity indicator
                if (overall > 0.02) {
                    let text = '🎵 '
                    if (bass > 0.3) text += '🔊 '
                    if (mids > 0.3) text += '🎶 '
                    if (treble > 0.3) text += '✨ '
                    text += `Audio detected (${Math.round(overall * 100)}%)`
                    
                    this.activityIndicator.textContent = text
                    this.activityIndicator.style.color = '#00FF00'
                } else {
                    this.activityIndicator.textContent = '🎵 Listening for audio...'
                    this.activityIndicator.style.color = '#888'
                }
            } else {
                // No audio data available
                this.levelBar.style.width = '0%'
                this.activityIndicator.textContent = '🎵 Listening for audio...'
                this.activityIndicator.style.color = '#888'
            }
        }, 100)
    }
    
    stopLevelMonitoring() {
        if (this.levelMonitorInterval) {
            clearInterval(this.levelMonitorInterval)
            this.levelMonitorInterval = null
        }
    }
    
    destroy() {
        this.stopLevelMonitoring()
        
        if (this.audioReactive) {
            this.audioReactive.disable()
        }
        
        const switchElement = this.container.querySelector('.audio-mode-switch')
        if (switchElement) {
            switchElement.remove()
        }
        
        console.log('🗑️ Audio Mode Switch destroyed')
    }
}

// Quick setup function
export function setupAudioModeSwitch(fluxApp, container = document.body) {
    const audioSwitch = new AudioModeSwitch(fluxApp, container)
    
    // Make it available globally for debugging
    window.audioModeSwitch = audioSwitch
    
    console.log('🎛️ Audio Mode Switch setup complete!')
    
    return audioSwitch
}