/**
 * Simple Audio Reactive - Self-contained audio reactive system
 * This bypasses import issues by including everything in one file
 */

// Simple Beat Detector
class SimpleBeatDetector {
    constructor() {
        this.energyHistory = []
        this.lastBeatTime = 0
        this.beatThreshold = 1.3
        this.minBeatInterval = 300
        this.historySize = 20
    }
    
    detectBeat(frequencyData) {
        // Calculate energy from bass frequencies
        let energy = 0
        for (let i = 0; i < Math.min(100, frequencyData.length); i++) {
            energy += frequencyData[i] * frequencyData[i]
        }
        energy = Math.sqrt(energy / 100) / 255
        
        // Add to history
        this.energyHistory.push(energy)
        if (this.energyHistory.length > this.historySize) {
            this.energyHistory.shift()
        }
        
        // Need enough history to detect beats
        if (this.energyHistory.length < this.historySize) {
            return { isBeat: false, energy, strength: 0, bpm: 0 }
        }
        
        // Calculate average energy
        const avgEnergy = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length
        
        // Check if current energy is significantly higher than average
        const now = Date.now()
        const timeSinceLastBeat = now - this.lastBeatTime
        
        if (energy > avgEnergy * this.beatThreshold && timeSinceLastBeat > this.minBeatInterval) {
            this.lastBeatTime = now
            const strength = Math.min((energy / avgEnergy), 2.0)
            return { isBeat: true, energy, strength, bpm: 0 }
        }
        
        return { isBeat: false, energy, strength: 0, bpm: 0 }
    }
}

// Simple Audio Analyzer
class SimpleAudioAnalyzer {
    constructor() {
        this.audioContext = null
        this.analyserNode = null
        this.mediaStream = null
        this.sourceNode = null
        this.isInitialized = false
        this.frequencyData = new Uint8Array(1024)
        this.timeData = new Uint8Array(1024)
    }
    
    async initialize(source = 'system') {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
            
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume()
            }
            
            // Create analyser
            this.analyserNode = this.audioContext.createAnalyser()
            this.analyserNode.fftSize = 2048
            this.analyserNode.smoothingTimeConstant = 0.8
            
            // Get media stream
            if (source === 'system') {
                try {
                    this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
                        audio: true,
                        video: false
                    })
                    
                    // Check if we got audio tracks
                    const audioTracks = this.mediaStream.getAudioTracks()
                    if (audioTracks.length === 0) {
                        throw new Error('No system audio available')
                    }
                } catch (error) {
                    console.log('System audio failed, trying microphone...')
                    source = 'microphone'
                }
            }
            
            if (source === 'microphone') {
                this.mediaStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false
                    }
                })
            }
            
            // Connect audio stream
            this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream)
            this.sourceNode.connect(this.analyserNode)
            
            this.isInitialized = true
            
            return {
                success: true,
                source: source,
                message: `Audio initialized with ${source}`
            }
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: `Failed to initialize audio: ${error.message}`
            }
        }
    }
    
    getFrequencyData() {
        if (!this.isInitialized || !this.analyserNode) {
            return {
                bass: 0, mids: 0, treble: 0, overall: 0,
                spectrum: new Array(1024).fill(0),
                timeData: new Array(1024).fill(0)
            }
        }
        
        // Get frequency data
        this.analyserNode.getByteFrequencyData(this.frequencyData)
        this.analyserNode.getByteTimeDomainData(this.timeData)
        
        // Calculate frequency ranges
        const bass = this.calculateRangeAverage(0, 100) / 255
        const mids = this.calculateRangeAverage(100, 700) / 255
        const treble = this.calculateRangeAverage(700, 1024) / 255
        const overall = (bass + mids + treble) / 3
        
        return {
            bass,
            mids,
            treble,
            overall,
            spectrum: Array.from(this.frequencyData),
            timeData: Array.from(this.timeData)
        }
    }
    
    calculateRangeAverage(start, end) {
        let sum = 0
        let count = 0
        for (let i = start; i < Math.min(end, this.frequencyData.length); i++) {
            sum += this.frequencyData[i]
            count++
        }
        return count > 0 ? sum / count : 0
    }
    
    dispose() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop())
        }
        if (this.sourceNode) {
            this.sourceNode.disconnect()
        }
        if (this.analyserNode) {
            this.analyserNode.disconnect()
        }
        if (this.audioContext) {
            this.audioContext.close()
        }
        
        this.isInitialized = false
        this.mediaStream = null
        this.sourceNode = null
        this.analyserNode = null
        this.audioContext = null
    }
}

// Simple Audio Reactive System
export class SimpleAudioReactive {
    constructor(fluxApp) {
        this.fluxApp = fluxApp
        this.audioAnalyzer = new SimpleAudioAnalyzer()
        this.beatDetector = new SimpleBeatDetector()
        this.isActive = false
        this.animationFrame = null
        
        // Visual state
        this.currentHue = 180
        this.smoothedAudio = { bass: 0, mids: 0, treble: 0, overall: 0 }
        
        console.log('🎵 Simple Audio Reactive initialized')
    }
    
    async enable() {
        try {
            console.log('🔊 Enabling simple audio reactive...')
            
            // Initialize audio
            const result = await this.audioAnalyzer.initialize('system')
            
            if (!result.success) {
                throw new Error(result.message)
            }
            
            // Enable particle renderer audio reactive mode
            if (this.fluxApp.particleRenderer) {
                this.fluxApp.particleRenderer.enableAudioReactive()
            }
            
            // Start processing loop
            this.startProcessing()
            
            this.isActive = true
            console.log(`✅ Simple audio reactive enabled with ${result.source}`)
            
            return {
                success: true,
                source: result.source,
                message: `Audio reactive enabled with ${result.source}`
            }
            
        } catch (error) {
            console.error('❌ Failed to enable audio reactive:', error)
            return {
                success: false,
                error: error.message
            }
        }
    }
    
    disable() {
        console.log('🔇 Disabling simple audio reactive...')
        
        this.isActive = false
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame)
            this.animationFrame = null
        }
        
        if (this.fluxApp.particleRenderer) {
            this.fluxApp.particleRenderer.disableAudioReactive()
        }
        
        this.audioAnalyzer.dispose()
        
        console.log('✅ Simple audio reactive disabled')
    }
    
    startProcessing() {
        const process = () => {
            if (!this.isActive) return
            
            try {
                // Get audio data
                const audioData = this.audioAnalyzer.getFrequencyData()
                const beatData = this.beatDetector.detectBeat(audioData.spectrum)
                
                // Smooth audio data
                const smoothing = 0.7
                this.smoothedAudio.bass = this.lerp(this.smoothedAudio.bass, audioData.bass, 1 - smoothing)
                this.smoothedAudio.mids = this.lerp(this.smoothedAudio.mids, audioData.mids, 1 - smoothing)
                this.smoothedAudio.treble = this.lerp(this.smoothedAudio.treble, audioData.treble, 1 - smoothing)
                this.smoothedAudio.overall = this.lerp(this.smoothedAudio.overall, audioData.overall, 1 - smoothing)
                
                // Apply visual effects
                this.applyVisualEffects(this.smoothedAudio, beatData)
                
                // Log activity (always log to see what's happening)
                console.log(`🎵 Audio: Bass=${audioData.bass.toFixed(2)} Mids=${audioData.mids.toFixed(2)} Treble=${audioData.treble.toFixed(2)} Beat=${beatData.isBeat} Overall=${audioData.overall.toFixed(2)}`)
                console.log(`🎵 Smoothed: Bass=${this.smoothedAudio.bass.toFixed(2)} Mids=${this.smoothedAudio.mids.toFixed(2)} Treble=${this.smoothedAudio.treble.toFixed(2)} Overall=${this.smoothedAudio.overall.toFixed(2)}`)
                
            } catch (error) {
                console.error('Audio processing error:', error)
            }
            
            this.animationFrame = requestAnimationFrame(process)
        }
        
        process()
    }
    
    applyVisualEffects(audioData, beatData) {
        const renderer = this.fluxApp.particleRenderer
        
        // Debug: Log what we're processing
        console.log(`🎨 applyVisualEffects called with: Bass=${audioData.bass.toFixed(3)} Mids=${audioData.mids.toFixed(3)} Treble=${audioData.treble.toFixed(3)} Overall=${audioData.overall.toFixed(3)}`)
        
        // Debug: Check if renderer exists and is enabled
        if (!renderer) {
            console.warn('⚠️ Particle renderer not found!')
            return
        }
        
        if (!renderer.audioReactiveEnabled) {
            console.warn('⚠️ Audio reactive not enabled on particle renderer!')
            console.log('🔧 Enabling audio reactive on particle renderer...')
            renderer.enableAudioReactive()
        }
        
        // Color effects based on frequency content
        const bassHue = 0    // Red for bass
        const midsHue = 120  // Green for mids
        const trebleHue = 240 // Blue for treble
        
        const totalEnergy = audioData.bass + audioData.mids + audioData.treble
        if (totalEnergy > 0.01) { // Lowered threshold for more responsiveness
            const blendedHue = (bassHue * audioData.bass + 
                               midsHue * audioData.mids + 
                               trebleHue * audioData.treble) / totalEnergy
            
            console.log(`🎨 Setting color to hue: ${blendedHue.toFixed(1)} (totalEnergy: ${totalEnergy.toFixed(3)})`)
            
            if (typeof renderer.updateAudioColors === 'function') {
                renderer.updateAudioColors(blendedHue, 0.8, 0.5)
                console.log('✅ Color updated successfully')
            } else {
                console.warn('⚠️ updateAudioColors method not found')
            }
        }
        
        // Bloom effects
        const bloomIntensity = 1.0 + (audioData.overall * 2.0) // Increased intensity
        console.log(`💫 Setting bloom intensity: ${bloomIntensity.toFixed(2)}`)
        
        if (typeof renderer.updateBloomIntensity === 'function') {
            renderer.updateBloomIntensity(bloomIntensity)
            console.log('✅ Bloom updated successfully')
        } else {
            console.warn('⚠️ updateBloomIntensity method not found')
        }
        
        // Beat effects
        if (beatData.isBeat) {
            renderer.applyBeatPulse(beatData.strength)
            
            // Apply radial force
            if (this.fluxApp.solver) {
                const centerX = this.fluxApp.config.containerWidth / 2
                const centerY = this.fluxApp.config.containerHeight / 2
                const radius = 100 + (beatData.strength * 100)
                const strength = beatData.strength * 2.0
                
                this.fluxApp.solver.apply_force(centerX, centerY, radius, strength)
            }
            
            console.log(`💥 Beat! Strength: ${beatData.strength.toFixed(2)}`)
        }
        
        // Bass-driven forces
        if (audioData.bass > 0.3 && this.fluxApp.solver) {
            const centerX = this.fluxApp.config.containerWidth / 2
            const centerY = this.fluxApp.config.containerHeight / 2
            const radius = 150
            const strength = audioData.bass * 1.5
            
            this.fluxApp.solver.apply_force(centerX, centerY, radius, strength)
        }
        
        // Treble sparkles
        if (audioData.treble > 0.4 && renderer.createSparkleEffects) {
            renderer.createSparkleEffects(audioData.treble, Math.floor(audioData.treble * 3))
        }
    }
    
    lerp(a, b, t) {
        return a + (b - a) * t
    }
    
    getStatus() {
        return {
            isActive: this.isActive,
            audioData: this.smoothedAudio,
            isConnected: this.audioAnalyzer.isInitialized
        }
    }
}

// Quick setup function
export function setupSimpleAudioReactive(fluxApp, container = document.body) {
    const audioReactive = new SimpleAudioReactive(fluxApp)
    
    // Create simple UI
    const ui = document.createElement('div')
    ui.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background: rgba(0, 0, 0, 0.9);
            padding: 20px;
            border-radius: 12px;
            border: 2px solid #00FFFF;
            color: white;
            font-family: monospace;
        ">
            <h3 style="margin: 0 0 15px 0; color: #00FFFF;">🎵 Simple Audio</h3>
            <button id="simple-audio-btn" style="
                background: #00FFFF;
                color: black;
                border: none;
                padding: 12px 20px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: bold;
                width: 100%;
                margin-bottom: 10px;
            ">Enable Audio Reactive</button>
            <div id="simple-status" style="font-size: 12px; color: #888;">
                Status: Disabled
            </div>
        </div>
    `
    
    container.appendChild(ui)
    
    const button = ui.querySelector('#simple-audio-btn')
    const status = ui.querySelector('#simple-status')
    
    button.addEventListener('click', async () => {
        if (!audioReactive.isActive) {
            button.textContent = 'Enabling...'
            button.disabled = true
            
            const result = await audioReactive.enable()
            
            if (result.success) {
                button.textContent = 'Disable Audio Reactive'
                button.style.background = '#FF4444'
                status.textContent = `Status: Active (${result.source})`
                status.style.color = '#00FF00'
            } else {
                button.textContent = 'Enable Audio Reactive'
                status.textContent = `Status: Failed - ${result.error}`
                status.style.color = '#FF4444'
                alert(`Failed: ${result.error}`)
            }
            
            button.disabled = false
        } else {
            audioReactive.disable()
            button.textContent = 'Enable Audio Reactive'
            button.style.background = '#00FFFF'
            status.textContent = 'Status: Disabled'
            status.style.color = '#888'
        }
    })
    
    // Make it available globally
    window.simpleAudioReactive = audioReactive
    
    return audioReactive
}