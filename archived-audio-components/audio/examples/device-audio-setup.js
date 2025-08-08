/**
 * Device Audio Setup - Simple implementation for capturing device/system audio
 * This enables the FLUX particles to react to any audio playing on your device
 */

import { AudioAnalyzer } from '../core/audio-analyzer.js'
import { AudioEffects } from '../core/audio-effects.js'
import BeatDetector from '../core/beat-detector.js'
import { EnhancedAudioUI } from '../ui/enhanced-audio-ui.js'

export class DeviceAudioSetup {
    constructor(fluxApp) {
        this.fluxApp = fluxApp
        this.audioAnalyzer = null
        this.audioEffects = null
        this.beatDetector = null
        this.isActive = false
        this.animationFrame = null
        
        // Audio processing state
        this.audioData = null
        this.beatData = null
        
        console.log('🎵 Device Audio Setup initialized')
    }
    
    /**
     * Enable device audio reactive mode
     * This will capture system/device audio and make particles react to it
     */
    async enableDeviceAudio() {
        try {
            console.log('🔊 Enabling device audio capture...')
            
            // Initialize audio analyzer
            this.audioAnalyzer = new AudioAnalyzer({
                fftSize: 2048,
                smoothingTimeConstant: 0.8,
                sampleRate: 44100
            })
            
            // Try system audio first (device audio), fallback to microphone
            let result = await this.audioAnalyzer.initialize('system')
            
            if (!result.success) {
                console.log('⚠️ System audio not available, trying microphone...')
                result = await this.audioAnalyzer.initialize('microphone')
            }
            
            if (!result.success) {
                throw new Error(`Failed to initialize audio: ${result.message}`)
            }
            
            console.log(`✅ Audio initialized with: ${result.source}`)
            
            // Initialize beat detector
            this.beatDetector = new BeatDetector(this.audioAnalyzer, {
                beatThreshold: 1.3,
                minBeatInterval: 300,
                sensitivity: 1.0
            })
            
            // Initialize audio effects
            this.audioEffects = new AudioEffects(this.fluxApp)
            this.audioEffects.setMode('reactive') // Best mode for device audio
            this.audioEffects.enable() // Enable the effects
            
            // Enable audio reactive rendering
            if (this.fluxApp.particleRenderer) {
                this.fluxApp.particleRenderer.enableAudioReactive()
            }
            
            // Start the audio processing loop
            this.startAudioLoop()
            
            this.isActive = true
            console.log('🎉 Device audio reactive mode enabled!')
            
            return {
                success: true,
                source: result.source,
                message: `Device audio reactive mode enabled using ${result.source}`
            }
            
        } catch (error) {
            console.error('❌ Failed to enable device audio:', error)
            return {
                success: false,
                error: error.message,
                instructions: this.getSetupInstructions()
            }
        }
    }
    
    /**
     * Disable device audio reactive mode
     */
    disableDeviceAudio() {
        console.log('🔇 Disabling device audio...')
        
        this.isActive = false
        
        // Stop audio processing loop
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame)
            this.animationFrame = null
        }
        
        // Stop audio visualization
        this.stopAudioVisualization()
        
        // Disable audio reactive rendering
        if (this.fluxApp.particleRenderer) {
            this.fluxApp.particleRenderer.disableAudioReactive()
        }
        
        // Cleanup audio components
        if (this.audioAnalyzer) {
            this.audioAnalyzer.dispose()
            this.audioAnalyzer = null
        }
        
        if (this.audioEffects) {
            this.audioEffects.disable()
            this.audioEffects = null
        }
        
        this.beatDetector = null
        this.audioData = null
        this.beatData = null
        
        console.log('✅ Device audio disabled')
    }
    
    /**
     * Start the audio processing loop
     */
    startAudioLoop() {
        const processAudio = () => {
            if (!this.isActive || !this.audioAnalyzer) {
                return
            }
            
            try {
                // Get audio data
                this.audioData = this.audioAnalyzer.getFrequencyData()
                
                // Detect beats
                this.beatData = this.beatDetector.detectBeat(this.audioData.spectrum)
                
                // Apply audio effects to particles
                this.audioEffects.processAudioData(this.audioData, this.beatData)
                
                // Update UI with current audio data
                this.updateUI()
                
                // Log audio activity and debug info
                if (this.audioData.overall > 0.05) {
                    console.log(`🎵 Audio: Bass=${this.audioData.bass.toFixed(2)} Mids=${this.audioData.mids.toFixed(2)} Treble=${this.audioData.treble.toFixed(2)} Beat=${this.beatData.isBeat} Overall=${this.audioData.overall.toFixed(2)}`)
                    
                    // Debug: Check if particle renderer is available
                    if (!this.fluxApp.particleRenderer) {
                        console.warn('⚠️ Particle renderer not available!')
                    } else if (!this.fluxApp.particleRenderer.audioReactiveEnabled) {
                        console.warn('⚠️ Audio reactive not enabled on particle renderer!')
                    }
                }
                
            } catch (error) {
                console.error('Audio processing error:', error)
            }
            
            // Continue the loop
            this.animationFrame = requestAnimationFrame(processAudio)
        }
        
        // Start the loop
        processAudio()
    }
    
    /**
     * Get current audio status
     */
    getStatus() {
        return {
            isActive: this.isActive,
            audioSource: this.audioAnalyzer?.currentSource || 'none',
            audioData: this.audioData,
            beatData: this.beatData,
            isConnected: this.audioAnalyzer?.isInitialized || false
        }
    }
    
    /**
     * Switch audio source (system/microphone)
     */
    async switchAudioSource(source) {
        if (!this.audioAnalyzer) {
            throw new Error('Audio not initialized')
        }
        
        console.log(`🔄 Switching to ${source} audio...`)
        
        const result = await this.audioAnalyzer.initialize(source)
        
        if (result.success) {
            console.log(`✅ Switched to ${result.source}`)
        } else {
            console.error(`❌ Failed to switch: ${result.message}`)
        }
        
        return result
    }
    
    /**
     * Get setup instructions for users
     */
    getSetupInstructions() {
        return {
            systemAudio: [
                '1. Use Chrome or Edge browser (Firefox/Safari don\'t support system audio)',
                '2. Click "Enable Device Audio" button',
                '3. In the screen sharing dialog, check "Share system audio"',
                '4. Select your entire screen or the application playing audio',
                '5. Click "Share" to start capturing device audio',
                '6. Play music, videos, or any audio on your device'
            ],
            microphone: [
                '1. Click "Enable Device Audio" button',
                '2. Allow microphone access when prompted',
                '3. Play music near your microphone or speak',
                '4. The particles will react to the audio input'
            ],
            troubleshooting: [
                '• Make sure audio is actually playing on your device',
                '• Check browser permissions for microphone/screen sharing',
                '• Try refreshing the page if audio stops working',
                '• For system audio, ensure "Share system audio" is checked'
            ]
        }
    }
    
    /**
     * Create a simple UI button to enable/disable device audio
     */
    createSimpleUI(container) {
        const ui = document.createElement('div')
        ui.className = 'device-audio-ui'
        ui.innerHTML = `
            <div id="audio-ui-panel" style="
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                background: rgba(0, 0, 0, 0.9);
                padding: 20px;
                border-radius: 12px;
                border: 2px solid #666;
                color: white;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                min-width: 200px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                transition: all 0.3s ease;
            ">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                    <div id="status-indicator" style="
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        background: #666;
                        margin-right: 10px;
                        transition: all 0.3s ease;
                    "></div>
                    <h3 style="margin: 0; color: #FFF; font-size: 16px; font-weight: 600;">
                        🎵 Audio Reactive
                    </h3>
                </div>
                
                <button id="toggle-device-audio" style="
                    background: linear-gradient(135deg, #00FFFF, #0088CC);
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 14px;
                    margin-bottom: 15px;
                    width: 100%;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 8px rgba(0, 255, 255, 0.3);
                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0, 255, 255, 0.4)'"
                   onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0, 255, 255, 0.3)'">
                    ▶️ Enable Audio Mode
                </button>
                
                <div style="
                    background: rgba(255, 255, 255, 0.05);
                    padding: 12px;
                    border-radius: 6px;
                    border-left: 3px solid #666;
                    transition: all 0.3s ease;
                " id="status-panel">
                    <div id="audio-status" style="
                        font-size: 13px; 
                        color: #AAA; 
                        margin-bottom: 6px;
                        font-weight: 500;
                    ">
                        Status: <span style="color: #666;">●</span> Disabled
                    </div>
                    <div id="audio-source" style="
                        font-size: 13px; 
                        color: #AAA;
                        font-weight: 500;
                    ">
                        Source: None
                    </div>
                    <div id="audio-activity" style="
                        font-size: 12px; 
                        color: #666; 
                        margin-top: 8px;
                        display: none;
                    ">
                        🎵 Listening for audio...
                    </div>
                </div>
                
                <div id="audio-visualizer" style="
                    margin-top: 12px;
                    height: 4px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 2px;
                    overflow: hidden;
                    display: none;
                ">
                    <div id="audio-level-bar" style="
                        height: 100%;
                        width: 0%;
                        background: linear-gradient(90deg, #00FF00, #FFFF00, #FF0000);
                        border-radius: 2px;
                        transition: width 0.1s ease;
                    "></div>
                </div>
            </div>
        `
        
        container.appendChild(ui)
        
        // Get UI elements
        const button = ui.querySelector('#toggle-device-audio')
        const statusDiv = ui.querySelector('#audio-status')
        const sourceDiv = ui.querySelector('#audio-source')
        const activityDiv = ui.querySelector('#audio-activity')
        const statusIndicator = ui.querySelector('#status-indicator')
        const statusPanel = ui.querySelector('#status-panel')
        const audioPanel = ui.querySelector('#audio-ui-panel')
        const visualizer = ui.querySelector('#audio-visualizer')
        const levelBar = ui.querySelector('#audio-level-bar')
        
        // Update UI state function
        const updateUIState = (state, data = {}) => {
            switch (state) {
                case 'disabled':
                    button.innerHTML = '▶️ Enable Audio Mode'
                    button.style.background = 'linear-gradient(135deg, #00FFFF, #0088CC)'
                    button.style.boxShadow = '0 2px 8px rgba(0, 255, 255, 0.3)'
                    statusDiv.innerHTML = 'Status: <span style="color: #666;">●</span> Disabled'
                    sourceDiv.textContent = 'Source: None'
                    activityDiv.style.display = 'none'
                    statusIndicator.style.background = '#666'
                    statusPanel.style.borderLeftColor = '#666'
                    audioPanel.style.borderColor = '#666'
                    visualizer.style.display = 'none'
                    break
                    
                case 'enabling':
                    button.innerHTML = '⏳ Enabling...'
                    button.style.background = 'linear-gradient(135deg, #FFA500, #FF8C00)'
                    button.style.boxShadow = '0 2px 8px rgba(255, 165, 0, 0.3)'
                    statusDiv.innerHTML = 'Status: <span style="color: #FFA500;">●</span> Connecting...'
                    statusIndicator.style.background = '#FFA500'
                    statusPanel.style.borderLeftColor = '#FFA500'
                    audioPanel.style.borderColor = '#FFA500'
                    break
                    
                case 'active':
                    button.innerHTML = '⏹️ Disable Audio Mode'
                    button.style.background = 'linear-gradient(135deg, #FF4444, #CC0000)'
                    button.style.boxShadow = '0 2px 8px rgba(255, 68, 68, 0.3)'
                    statusDiv.innerHTML = 'Status: <span style="color: #00FF00;">●</span> Active'
                    sourceDiv.innerHTML = `Source: <span style="color: #00FFFF;">${data.source || 'Unknown'}</span>`
                    activityDiv.style.display = 'block'
                    activityDiv.innerHTML = '🎵 Listening for audio...'
                    statusIndicator.style.background = '#00FF00'
                    statusPanel.style.borderLeftColor = '#00FF00'
                    audioPanel.style.borderColor = '#00FF00'
                    visualizer.style.display = 'block'
                    break
                    
                case 'error':
                    button.innerHTML = '❌ Enable Audio Mode'
                    button.style.background = 'linear-gradient(135deg, #FF6B6B, #FF5252)'
                    button.style.boxShadow = '0 2px 8px rgba(255, 107, 107, 0.3)'
                    statusDiv.innerHTML = `Status: <span style="color: #FF4444;">●</span> Error`
                    sourceDiv.innerHTML = `Error: <span style="color: #FF4444;">${data.error || 'Unknown error'}</span>`
                    statusIndicator.style.background = '#FF4444'
                    statusPanel.style.borderLeftColor = '#FF4444'
                    audioPanel.style.borderColor = '#FF4444'
                    break
            }
        }
        
        // Start with disabled state
        updateUIState('disabled')
        
        // Setup button handler
        button.addEventListener('click', async () => {
            if (!this.isActive) {
                updateUIState('enabling')
                button.disabled = true
                
                const result = await this.enableDeviceAudio()
                
                if (result.success) {
                    updateUIState('active', { source: result.source })
                    
                    // Start audio level visualization
                    this.startAudioVisualization(levelBar, activityDiv)
                } else {
                    updateUIState('error', { error: result.error })
                    
                    // Show detailed error message
                    setTimeout(() => {
                        alert(`Failed to enable device audio:\n\n${result.error}\n\nInstructions:\n${result.instructions.systemAudio.join('\n')}`)
                    }, 100)
                }
                
                button.disabled = false
            } else {
                this.disableDeviceAudio()
                updateUIState('disabled')
                
                // Stop audio visualization
                this.stopAudioVisualization()
            }
        })
        
        // Store UI elements for later use
        this.uiElements = {
            button, statusDiv, sourceDiv, activityDiv, 
            statusIndicator, statusPanel, audioPanel, 
            visualizer, levelBar, updateUIState
        }
        
        return ui
    }
    
    /**
     * Start audio level visualization
     */
    startAudioVisualization(levelBar, activityDiv) {
        if (this.visualizationInterval) {
            clearInterval(this.visualizationInterval)
        }
        
        this.visualizationInterval = setInterval(() => {
            if (!this.isActive || !this.audioData) {
                return
            }
            
            // Update level bar based on overall audio level
            const level = Math.min(this.audioData.overall * 100, 100)
            levelBar.style.width = `${level}%`
            
            // Update activity text based on audio content
            if (this.audioData.overall > 0.1) {
                const bassLevel = Math.round(this.audioData.bass * 100)
                const midsLevel = Math.round(this.audioData.mids * 100)
                const trebleLevel = Math.round(this.audioData.treble * 100)
                
                let activityText = '🎵 '
                if (this.beatData && this.beatData.isBeat) {
                    activityText += '💥 BEAT! '
                }
                
                if (bassLevel > 50) activityText += '🔊 '
                if (midsLevel > 50) activityText += '🎶 '
                if (trebleLevel > 50) activityText += '✨ '
                
                activityText += `Bass:${bassLevel}% Mid:${midsLevel}% Treble:${trebleLevel}%`
                activityDiv.innerHTML = activityText
                activityDiv.style.color = '#00FF00'
            } else {
                activityDiv.innerHTML = '🎵 Listening for audio...'
                activityDiv.style.color = '#666'
            }
        }, 100) // Update 10 times per second
    }
    
    /**
     * Stop audio level visualization
     */
    stopAudioVisualization() {
        if (this.visualizationInterval) {
            clearInterval(this.visualizationInterval)
            this.visualizationInterval = null
        }
    }
    
    /**
     * Update UI with current audio status (can be called externally)
     */
    updateUI() {
        if (!this.uiElements) return
        
        const status = this.getStatus()
        
        if (status.isActive && status.audioData) {
            // Update the activity display
            const { bass, mids, treble, overall } = status.audioData
            const level = Math.min(overall * 100, 100)
            
            this.uiElements.levelBar.style.width = `${level}%`
            
            if (overall > 0.05) {
                let activityText = '🎵 '
                if (status.beatData && status.beatData.isBeat) {
                    activityText += '💥 BEAT! '
                }
                activityText += `Audio detected (${Math.round(overall * 100)}%)`
                this.uiElements.activityDiv.innerHTML = activityText
                this.uiElements.activityDiv.style.color = '#00FF00'
            }
        }
    }
}

// Quick setup function for easy integration
export async function enableDeviceAudioReactive(fluxApp, container = document.body) {
    const deviceAudio = new DeviceAudioSetup(fluxApp)
    
    // Create enhanced UI with better visual feedback
    const enhancedUI = new EnhancedAudioUI(deviceAudio, container)
    deviceAudio.enhancedUI = enhancedUI
    
    return deviceAudio
}