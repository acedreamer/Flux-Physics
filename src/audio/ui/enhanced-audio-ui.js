/**
 * Enhanced Audio UI - Improved visual feedback for device audio
 * This creates a much clearer UI that shows when audio mode is on/off
 */

export class EnhancedAudioUI {
    constructor(deviceAudio, container) {
        this.deviceAudio = deviceAudio
        this.container = container
        this.ui = null
        this.elements = {}
        this.visualizationInterval = null
        
        this.createUI()
        this.setupEventHandlers()
        this.updateState('disabled')
    }
    
    createUI() {
        // Remove any existing audio UI
        const existing = this.container.querySelector('.enhanced-audio-ui')
        if (existing) {
            existing.remove()
        }
        
        this.ui = document.createElement('div')
        this.ui.className = 'enhanced-audio-ui'
        this.ui.innerHTML = `
            <div class="audio-panel" style="
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                background: rgba(0, 0, 0, 0.95);
                padding: 20px;
                border-radius: 15px;
                border: 2px solid #444;
                color: white;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                min-width: 220px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            ">
                <!-- Header with status indicator -->
                <div class="header" style="
                    display: flex;
                    align-items: center;
                    margin-bottom: 16px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                ">
                    <div class="status-dot" style="
                        width: 14px;
                        height: 14px;
                        border-radius: 50%;
                        background: #666;
                        margin-right: 12px;
                        transition: all 0.3s ease;
                        box-shadow: 0 0 0 0 rgba(102, 102, 102, 0.4);
                        animation: none;
                    "></div>
                    <h3 style="
                        margin: 0;
                        font-size: 16px;
                        font-weight: 600;
                        color: #fff;
                    ">🎵 Audio Reactive</h3>
                </div>
                
                <!-- Main toggle button -->
                <button class="toggle-btn" style="
                    width: 100%;
                    padding: 14px 20px;
                    border: none;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin-bottom: 16px;
                    background: linear-gradient(135deg, #00FFFF 0%, #0099CC 100%);
                    color: white;
                    box-shadow: 0 4px 15px rgba(0, 255, 255, 0.3);
                    position: relative;
                    overflow: hidden;
                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0, 255, 255, 0.4)'"
                   onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0, 255, 255, 0.3)'">
                    <span class="btn-text">▶️ Enable Audio Mode</span>
                </button>
                
                <!-- Status information -->
                <div class="status-info" style="
                    background: rgba(255, 255, 255, 0.05);
                    padding: 14px;
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
                        Status: <span class="status-value" style="color: #666;">●</span> Disabled
                    </div>
                    <div class="source-text" style="
                        font-size: 13px;
                        font-weight: 500;
                        color: #ccc;
                    ">
                        Source: <span class="source-value">None</span>
                    </div>
                    <div class="activity-text" style="
                        font-size: 12px;
                        margin-top: 10px;
                        color: #888;
                        display: none;
                    ">
                        🎵 Listening for audio...
                    </div>
                </div>
                
                <!-- Audio visualizer -->
                <div class="audio-visualizer" style="
                    margin-top: 14px;
                    height: 6px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 3px;
                    overflow: hidden;
                    display: none;
                    position: relative;
                ">
                    <div class="level-bar" style="
                        height: 100%;
                        width: 0%;
                        background: linear-gradient(90deg, #00FF00 0%, #FFFF00 50%, #FF4444 100%);
                        border-radius: 3px;
                        transition: width 0.15s ease-out;
                    "></div>
                </div>
                
                <!-- Beat indicator -->
                <div class="beat-indicator" style="
                    position: absolute;
                    top: -2px;
                    right: -2px;
                    width: 12px;
                    height: 12px;
                    background: #FF4444;
                    border-radius: 50%;
                    opacity: 0;
                    transform: scale(0.5);
                    transition: all 0.2s ease;
                "></div>
            </div>
        `
        
        this.container.appendChild(this.ui)
        
        // Store element references
        this.elements = {
            panel: this.ui.querySelector('.audio-panel'),
            statusDot: this.ui.querySelector('.status-dot'),
            toggleBtn: this.ui.querySelector('.toggle-btn'),
            btnText: this.ui.querySelector('.btn-text'),
            statusInfo: this.ui.querySelector('.status-info'),
            statusValue: this.ui.querySelector('.status-value'),
            sourceValue: this.ui.querySelector('.source-value'),
            activityText: this.ui.querySelector('.activity-text'),
            visualizer: this.ui.querySelector('.audio-visualizer'),
            levelBar: this.ui.querySelector('.level-bar'),
            beatIndicator: this.ui.querySelector('.beat-indicator')
        }
    }
    
    setupEventHandlers() {
        this.elements.toggleBtn.addEventListener('click', async () => {
            if (!this.deviceAudio.isActive) {
                this.updateState('enabling')
                this.elements.toggleBtn.disabled = true
                
                const result = await this.deviceAudio.enableDeviceAudio()
                
                if (result.success) {
                    this.updateState('active', { source: result.source })
                    this.startVisualization()
                } else {
                    this.updateState('error', { error: result.error })
                    setTimeout(() => {
                        alert(`Failed to enable device audio:\n\n${result.error}\n\nTry:\n• Use Chrome or Edge browser\n• Check "Share system audio" in the dialog\n• Allow microphone access as fallback`)
                    }, 100)
                }
                
                this.elements.toggleBtn.disabled = false
            } else {
                this.deviceAudio.disableDeviceAudio()
                this.updateState('disabled')
                this.stopVisualization()
            }
        })
    }
    
    updateState(state, data = {}) {
        const { panel, statusDot, toggleBtn, btnText, statusInfo, statusValue, sourceValue, activityText, visualizer } = this.elements
        
        // Remove any existing animations
        statusDot.style.animation = 'none'
        
        switch (state) {
            case 'disabled':
                // Gray/disabled state
                panel.style.borderColor = '#444'
                statusDot.style.background = '#666'
                statusDot.style.boxShadow = '0 0 0 0 rgba(102, 102, 102, 0.4)'
                toggleBtn.style.background = 'linear-gradient(135deg, #00FFFF 0%, #0099CC 100%)'
                toggleBtn.style.boxShadow = '0 4px 15px rgba(0, 255, 255, 0.3)'
                btnText.textContent = '▶️ Enable Audio Mode'
                statusInfo.style.borderLeftColor = '#666'
                statusValue.innerHTML = '<span style="color: #666;">●</span> Disabled'
                sourceValue.textContent = 'None'
                activityText.style.display = 'none'
                visualizer.style.display = 'none'
                break
                
            case 'enabling':
                // Orange/connecting state
                panel.style.borderColor = '#FFA500'
                statusDot.style.background = '#FFA500'
                statusDot.style.boxShadow = '0 0 0 4px rgba(255, 165, 0, 0.3)'
                statusDot.style.animation = 'pulse 1.5s infinite'
                toggleBtn.style.background = 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)'
                toggleBtn.style.boxShadow = '0 4px 15px rgba(255, 165, 0, 0.4)'
                btnText.textContent = '⏳ Enabling...'
                statusInfo.style.borderLeftColor = '#FFA500'
                statusValue.innerHTML = '<span style="color: #FFA500;">●</span> Connecting...'
                break
                
            case 'active':
                // Green/active state
                panel.style.borderColor = '#00FF00'
                statusDot.style.background = '#00FF00'
                statusDot.style.boxShadow = '0 0 0 4px rgba(0, 255, 0, 0.3)'
                statusDot.style.animation = 'glow 2s infinite'
                toggleBtn.style.background = 'linear-gradient(135deg, #FF4444 0%, #CC0000 100%)'
                toggleBtn.style.boxShadow = '0 4px 15px rgba(255, 68, 68, 0.4)'
                btnText.textContent = '⏹️ Disable Audio Mode'
                statusInfo.style.borderLeftColor = '#00FF00'
                statusValue.innerHTML = '<span style="color: #00FF00;">●</span> Active'
                sourceValue.innerHTML = `<span style="color: #00FFFF;">${data.source || 'Unknown'}</span>`
                activityText.style.display = 'block'
                activityText.textContent = '🎵 Listening for audio...'
                visualizer.style.display = 'block'
                break
                
            case 'error':
                // Red/error state
                panel.style.borderColor = '#FF4444'
                statusDot.style.background = '#FF4444'
                statusDot.style.boxShadow = '0 0 0 4px rgba(255, 68, 68, 0.3)'
                toggleBtn.style.background = 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)'
                toggleBtn.style.boxShadow = '0 4px 15px rgba(255, 107, 107, 0.4)'
                btnText.textContent = '❌ Try Again'
                statusInfo.style.borderLeftColor = '#FF4444'
                statusValue.innerHTML = '<span style="color: #FF4444;">●</span> Error'
                sourceValue.innerHTML = `<span style="color: #FF4444;">${data.error || 'Unknown error'}</span>`
                break
        }
        
        // Add CSS animations if not already added
        if (!document.querySelector('#audio-ui-animations')) {
            const style = document.createElement('style')
            style.id = 'audio-ui-animations'
            style.textContent = `
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                }
                @keyframes glow {
                    0%, 100% { box-shadow: 0 0 0 4px rgba(0, 255, 0, 0.3); }
                    50% { box-shadow: 0 0 0 8px rgba(0, 255, 0, 0.1); }
                }
                @keyframes beat-flash {
                    0% { opacity: 0; transform: scale(0.5); }
                    50% { opacity: 1; transform: scale(1.2); }
                    100% { opacity: 0; transform: scale(0.5); }
                }
            `
            document.head.appendChild(style)
        }
    }
    
    startVisualization() {
        if (this.visualizationInterval) {
            clearInterval(this.visualizationInterval)
        }
        
        this.visualizationInterval = setInterval(() => {
            const status = this.deviceAudio.getStatus()
            
            if (!status.isActive || !status.audioData) {
                return
            }
            
            const { bass, mids, treble, overall } = status.audioData
            const { isBeat } = status.beatData || {}
            
            // Update level bar
            const level = Math.min(overall * 100, 100)
            this.elements.levelBar.style.width = `${level}%`
            
            // Update activity text
            if (overall > 0.05) {
                let text = '🎵 '
                if (isBeat) {
                    text += '💥 BEAT! '
                    // Flash beat indicator
                    this.elements.beatIndicator.style.animation = 'beat-flash 0.3s ease'
                    setTimeout(() => {
                        this.elements.beatIndicator.style.animation = 'none'
                    }, 300)
                }
                
                if (bass > 0.5) text += '🔊 '
                if (mids > 0.5) text += '🎶 '
                if (treble > 0.5) text += '✨ '
                
                text += `${Math.round(overall * 100)}% active`
                this.elements.activityText.textContent = text
                this.elements.activityText.style.color = '#00FF00'
            } else {
                this.elements.activityText.textContent = '🎵 Listening for audio...'
                this.elements.activityText.style.color = '#888'
            }
        }, 100)
    }
    
    stopVisualization() {
        if (this.visualizationInterval) {
            clearInterval(this.visualizationInterval)
            this.visualizationInterval = null
        }
    }
    
    destroy() {
        this.stopVisualization()
        if (this.ui) {
            this.ui.remove()
        }
    }
}