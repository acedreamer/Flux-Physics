/**
 * FLUX Audio Reactive Examples
 * Practical examples and demonstrations of audio reactive features
 */

export class AudioExample {
    constructor(fluxApp) {
        this.fluxApp = fluxApp
        this.examples = new Map()
        this.currentExample = null
        this.setupExamples()
    }
    
    setupExamples() {
        // Basic audio reactive setup
        this.examples.set('basic', {
            name: 'Basic Audio Reactive',
            description: 'Simple audio reactive setup with default settings',
            setup: () => this.setupBasicExample(),
            cleanup: () => this.cleanupBasicExample()
        })
        
        // Beat-driven pulse effects
        this.examples.set('pulse', {
            name: 'Beat Pulse Effects',
            description: 'Dramatic pulse effects synchronized to beat detection',
            setup: () => this.setupPulseExample(),
            cleanup: () => this.cleanupPulseExample()
        })
        
        // Frequency spectrum visualization
        this.examples.set('spectrum', {
            name: 'Frequency Spectrum',
            description: 'Real-time frequency spectrum visualization',
            setup: () => this.setupSpectrumExample(),
            cleanup: () => this.cleanupSpectrumExample()
        })
        
        // Custom audio effects
        this.examples.set('custom', {
            name: 'Custom Audio Effects',
            description: 'Custom audio-driven particle effects',
            setup: () => this.setupCustomExample(),
            cleanup: () => this.cleanupCustomExample()
        })
        
        // Performance optimization
        this.examples.set('performance', {
            name: 'Performance Optimization',
            description: 'Optimized settings for smooth 60fps performance',
            setup: () => this.setupPerformanceExample(),
            cleanup: () => this.cleanupPerformanceExample()
        })
        
        // Multi-mode demonstration
        this.examples.set('multimode', {
            name: 'Multi-Mode Demo',
            description: 'Cycles through different visualization modes',
            setup: () => this.setupMultiModeExample(),
            cleanup: () => this.cleanupMultiModeExample()
        })
    }
    
    /**
     * Run a specific example
     * @param {string} exampleName - Name of the example to run
     */
    async runExample(exampleName) {
        if (this.currentExample) {
            await this.stopCurrentExample()
        }
        
        const example = this.examples.get(exampleName)
        if (!example) {
            console.error(`Example '${exampleName}' not found`)
            console.log('Available examples:', Array.from(this.examples.keys()))
            return false
        }
        
        console.log(`🎵 Running example: ${example.name}`)
        console.log(`📝 Description: ${example.description}`)
        
        try {
            await example.setup()
            this.currentExample = exampleName
            return true
        } catch (error) {
            console.error(`Failed to run example '${exampleName}':`, error)
            return false
        }
    }
    
    /**
     * Stop the current example
     */
    async stopCurrentExample() {
        if (!this.currentExample) return
        
        const example = this.examples.get(this.currentExample)
        if (example && example.cleanup) {
            await example.cleanup()
        }
        
        console.log(`🛑 Stopped example: ${this.currentExample}`)
        this.currentExample = null
    }
    
    /**
     * List all available examples
     */
    listExamples() {
        console.log('📚 Available Audio Reactive Examples:')
        this.examples.forEach((example, name) => {
            const status = this.currentExample === name ? '▶️ ' : '   '
            console.log(`${status}${name}: ${example.description}`)
        })
    }
    
    // Example Implementations
    
    async setupBasicExample() {
        // Enable audio reactive mode with default settings
        const result = await this.fluxApp.toggleAudioMode(true)
        
        if (result) {
            // Set basic configuration
            this.fluxApp.setAudioMode('reactive')
            this.fluxApp.setAudioSensitivity(1.0)
            
            console.log('✅ Basic audio reactive mode enabled')
            console.log('🎛️ Mode: Reactive, Sensitivity: 1.0')
            console.log('🎵 Play some music to see particles respond!')
        } else {
            throw new Error('Failed to enable audio reactive mode')
        }
    }
    
    async cleanupBasicExample() {
        await this.fluxApp.toggleAudioMode(false)
        console.log('🔇 Basic example stopped')
    }
    
    async setupPulseExample() {
        // Enable audio with pulse mode for dramatic beat effects
        const result = await this.fluxApp.toggleAudioMode(true)
        
        if (result) {
            // Configure for beat-driven effects
            this.fluxApp.setAudioMode('pulse')
            this.fluxApp.setAudioSensitivity(1.3)
            
            // Enhance beat detection
            if (this.fluxApp.audioEffects) {
                this.fluxApp.audioEffects.updateBeatDetection({
                    threshold: 1.1,
                    minInterval: 200,
                    sensitivity: 1.2
                })
            }
            
            console.log('✅ Pulse mode enabled')
            console.log('🥁 Beat detection enhanced for dramatic effects')
            console.log('🎵 Play music with strong beats (EDM, Rock, Hip-Hop)')
            
            // Monitor beat detection
            this.beatMonitor = setInterval(() => {
                const beatData = this.fluxApp.audioState.lastBeatData
                if (beatData && beatData.isBeat) {
                    console.log(`🎯 Beat detected! Strength: ${beatData.strength.toFixed(2)}, BPM: ${beatData.bpm}`)
                }
            }, 100)
        } else {
            throw new Error('Failed to enable pulse mode')
        }
    }
    
    async cleanupPulseExample() {
        if (this.beatMonitor) {
            clearInterval(this.beatMonitor)
            this.beatMonitor = null
        }
        await this.fluxApp.toggleAudioMode(false)
        console.log('🔇 Pulse example stopped')
    }
    
    async setupSpectrumExample() {
        // Enable audio with spectrum visualization
        const result = await this.fluxApp.toggleAudioMode(true)
        
        if (result) {
            this.fluxApp.setAudioMode('reactive')
            this.fluxApp.setAudioSensitivity(0.8)
            
            // Create spectrum display
            this.createSpectrumDisplay()
            
            console.log('✅ Spectrum visualization enabled')
            console.log('📊 Real-time frequency analysis display created')
            console.log('🎵 Watch the spectrum bars respond to different frequencies')
        } else {
            throw new Error('Failed to enable spectrum visualization')
        }
    }
    
    createSpectrumDisplay() {
        // Create spectrum visualization overlay
        this.spectrumCanvas = document.createElement('canvas')
        this.spectrumCanvas.width = 400
        this.spectrumCanvas.height = 200
        this.spectrumCanvas.style.position = 'fixed'
        this.spectrumCanvas.style.top = '20px'
        this.spectrumCanvas.style.right = '20px'
        this.spectrumCanvas.style.background = 'rgba(0, 0, 0, 0.8)'
        this.spectrumCanvas.style.border = '1px solid #00FFFF'
        this.spectrumCanvas.style.borderRadius = '8px'
        this.spectrumCanvas.style.zIndex = '10000'
        
        document.body.appendChild(this.spectrumCanvas)
        
        const ctx = this.spectrumCanvas.getContext('2d')
        
        // Animate spectrum display
        this.spectrumAnimation = () => {
            const audioData = this.fluxApp.audioState.lastAudioData
            if (audioData && audioData.spectrum) {
                this.drawSpectrum(ctx, audioData.spectrum, audioData)
            }
            requestAnimationFrame(this.spectrumAnimation)
        }
        
        this.spectrumAnimation()
    }
    
    drawSpectrum(ctx, spectrum, audioData) {
        const width = this.spectrumCanvas.width
        const height = this.spectrumCanvas.height
        
        // Clear canvas
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
        ctx.fillRect(0, 0, width, height)
        
        // Draw frequency bars
        const barWidth = width / spectrum.length
        
        for (let i = 0; i < spectrum.length; i++) {
            const barHeight = (spectrum[i] / 255) * height * 0.8
            
            // Color based on frequency range
            let color
            if (i < spectrum.length * 0.2) {
                color = `rgba(255, ${100 + spectrum[i]}, 0, 0.8)` // Bass - Red/Orange
            } else if (i < spectrum.length * 0.7) {
                color = `rgba(0, 255, ${spectrum[i]}, 0.8)` // Mids - Green/Cyan
            } else {
                color = `rgba(${spectrum[i]}, 200, 255, 0.8)` // Treble - Blue/White
            }
            
            ctx.fillStyle = color
            ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight)
        }
        
        // Draw frequency range labels and values
        ctx.fillStyle = '#00FFFF'
        ctx.font = '12px monospace'
        ctx.fillText(`Bass: ${(audioData.bass * 100).toFixed(0)}%`, 10, 20)
        ctx.fillText(`Mids: ${(audioData.mids * 100).toFixed(0)}%`, 10, 35)
        ctx.fillText(`Treble: ${(audioData.treble * 100).toFixed(0)}%`, 10, 50)
        ctx.fillText(`Overall: ${(audioData.overall * 100).toFixed(0)}%`, 10, 65)
        
        // Draw beat indicator
        const beatData = this.fluxApp.audioState.lastBeatData
        if (beatData) {
            ctx.fillStyle = beatData.isBeat ? '#FF00FF' : '#666666'
            ctx.fillText(`Beat: ${beatData.isBeat ? 'YES' : 'NO'} (${beatData.bpm} BPM)`, 10, 85)
        }
    }
    
    async cleanupSpectrumExample() {
        if (this.spectrumCanvas) {
            document.body.removeChild(this.spectrumCanvas)
            this.spectrumCanvas = null
        }
        this.spectrumAnimation = null
        await this.fluxApp.toggleAudioMode(false)
        console.log('🔇 Spectrum example stopped')
    }
    
    async setupCustomExample() {
        // Enable audio with custom effects
        const result = await this.fluxApp.toggleAudioMode(true)
        
        if (result) {
            this.fluxApp.setAudioMode('reactive')
            this.fluxApp.setAudioSensitivity(1.2)
            
            // Create custom audio effects
            this.setupCustomEffects()
            
            console.log('✅ Custom audio effects enabled')
            console.log('🎨 Custom particle behaviors and visual effects active')
            console.log('🎵 Experience unique audio-visual combinations')
        } else {
            throw new Error('Failed to enable custom effects')
        }
    }
    
    setupCustomEffects() {
        // Custom effect: Spiral bass response
        this.customEffects = {
            spiralPhase: 0,
            colorCycle: 0,
            lastBeatTime: 0
        }
        
        // Override audio processing with custom effects
        this.originalProcessAudio = this.fluxApp.audioEffects.processAudioData.bind(this.fluxApp.audioEffects)
        
        this.fluxApp.audioEffects.processAudioData = (audioData, beatData) => {
            // Call original processing
            this.originalProcessAudio(audioData, beatData)
            
            // Add custom effects
            this.applyCustomSpiralEffect(audioData)
            this.applyCustomColorCycling(audioData)
            this.applyCustomBeatResponse(beatData)
        }
    }
    
    applyCustomSpiralEffect(audioData) {
        if (audioData.bass > 0.3) {
            this.customEffects.spiralPhase += audioData.bass * 0.1
            
            const centerX = this.fluxApp.config.containerWidth / 2
            const centerY = this.fluxApp.config.containerHeight / 2
            
            // Create spiral force pattern
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2 + this.customEffects.spiralPhase
                const radius = 100 + audioData.bass * 50
                const x = centerX + Math.cos(angle) * radius
                const y = centerY + Math.sin(angle) * radius
                
                if (this.fluxApp.solver) {
                    this.fluxApp.solver.apply_force(x, y, 40, audioData.bass * 0.8)
                }
            }
        }
    }
    
    applyCustomColorCycling(audioData) {
        // Cycle colors based on overall audio energy
        this.customEffects.colorCycle += audioData.overall * 2
        
        const hue = (this.customEffects.colorCycle % 360)
        const saturation = 0.8 + audioData.treble * 0.2
        const lightness = 0.4 + audioData.mids * 0.3
        
        if (this.fluxApp.particleRenderer.updateAudioColors) {
            this.fluxApp.particleRenderer.updateAudioColors(hue, saturation, lightness)
        }
    }
    
    applyCustomBeatResponse(beatData) {
        if (beatData.isBeat) {
            const currentTime = performance.now()
            
            // Create expanding ring effect
            const centerX = this.fluxApp.config.containerWidth / 2
            const centerY = this.fluxApp.config.containerHeight / 2
            
            // Multiple rings with different timings
            setTimeout(() => {
                if (this.fluxApp.solver) {
                    this.fluxApp.solver.apply_force(centerX, centerY, 80, beatData.strength * 1.5)
                }
            }, 0)
            
            setTimeout(() => {
                if (this.fluxApp.solver) {
                    this.fluxApp.solver.apply_force(centerX, centerY, 120, beatData.strength * 1.0)
                }
            }, 100)
            
            setTimeout(() => {
                if (this.fluxApp.solver) {
                    this.fluxApp.solver.apply_force(centerX, centerY, 160, beatData.strength * 0.5)
                }
            }, 200)
            
            this.customEffects.lastBeatTime = currentTime
        }
    }
    
    async cleanupCustomExample() {
        // Restore original audio processing
        if (this.originalProcessAudio) {
            this.fluxApp.audioEffects.processAudioData = this.originalProcessAudio
            this.originalProcessAudio = null
        }
        
        this.customEffects = null
        await this.fluxApp.toggleAudioMode(false)
        console.log('🔇 Custom effects example stopped')
    }
    
    async setupPerformanceExample() {
        // Enable audio with performance-optimized settings
        const result = await this.fluxApp.toggleAudioMode(true)
        
        if (result) {
            // Optimize for performance
            this.fluxApp.setAudioMode('ambient') // Less intensive mode
            this.fluxApp.setAudioSensitivity(0.8) // Moderate sensitivity
            
            // Configure for optimal performance
            if (this.fluxApp.audioAnalyzer) {
                this.fluxApp.audioAnalyzer.updateFrequencyConfig({
                    fftSize: 1024, // Smaller FFT for better performance
                    smoothingTimeConstant: 0.9, // More smoothing
                    advancedAnalysisEnabled: false // Disable heavy analysis
                })
            }
            
            // Monitor performance
            this.startPerformanceMonitoring()
            
            console.log('✅ Performance-optimized audio mode enabled')
            console.log('⚡ Settings optimized for 60fps performance')
            console.log('📊 Performance monitoring active')
        } else {
            throw new Error('Failed to enable performance mode')
        }
    }
    
    startPerformanceMonitoring() {
        let frameCount = 0
        let totalFrameTime = 0
        let lastTime = performance.now()
        
        this.performanceMonitor = setInterval(() => {
            const currentTime = performance.now()
            const frameTime = currentTime - lastTime
            
            frameCount++
            totalFrameTime += frameTime
            
            if (frameCount >= 60) {
                const avgFrameTime = totalFrameTime / frameCount
                const fps = 1000 / avgFrameTime
                
                console.log(`📊 Performance: ${fps.toFixed(1)} FPS (${avgFrameTime.toFixed(2)}ms avg frame time)`)
                
                if (fps < 55) {
                    console.warn('⚠️ Performance below target, consider reducing settings')
                } else if (fps > 58) {
                    console.log('✅ Performance optimal')
                }
                
                frameCount = 0
                totalFrameTime = 0
            }
            
            lastTime = currentTime
        }, 1000)
    }
    
    async cleanupPerformanceExample() {
        if (this.performanceMonitor) {
            clearInterval(this.performanceMonitor)
            this.performanceMonitor = null
        }
        await this.fluxApp.toggleAudioMode(false)
        console.log('🔇 Performance example stopped')
    }
    
    async setupMultiModeExample() {
        // Enable audio and cycle through different modes
        const result = await this.fluxApp.toggleAudioMode(true)
        
        if (result) {
            const modes = ['reactive', 'pulse', 'flow', 'ambient']
            let currentModeIndex = 0
            
            // Start with first mode
            this.fluxApp.setAudioMode(modes[currentModeIndex])
            this.fluxApp.setAudioSensitivity(1.0)
            
            console.log('✅ Multi-mode demonstration started')
            console.log(`🎛️ Starting with mode: ${modes[currentModeIndex]}`)
            console.log('🔄 Modes will cycle every 15 seconds')
            
            // Cycle through modes
            this.modeTimer = setInterval(() => {
                currentModeIndex = (currentModeIndex + 1) % modes.length
                const newMode = modes[currentModeIndex]
                
                this.fluxApp.setAudioMode(newMode)
                console.log(`🔄 Switched to mode: ${newMode}`)
                
                // Adjust sensitivity based on mode
                const sensitivity = {
                    'reactive': 1.0,
                    'pulse': 1.2,
                    'flow': 0.9,
                    'ambient': 0.6
                }[newMode]
                
                this.fluxApp.setAudioSensitivity(sensitivity)
                console.log(`🎛️ Sensitivity adjusted to: ${sensitivity}`)
                
            }, 15000) // Switch every 15 seconds
        } else {
            throw new Error('Failed to enable multi-mode demo')
        }
    }
    
    async cleanupMultiModeExample() {
        if (this.modeTimer) {
            clearInterval(this.modeTimer)
            this.modeTimer = null
        }
        await this.fluxApp.toggleAudioMode(false)
        console.log('🔇 Multi-mode example stopped')
    }
    
    /**
     * Create a simple test tone for demonstration purposes
     * @param {number} frequency - Frequency in Hz
     * @param {number} duration - Duration in seconds
     */
    async playTestTone(frequency = 440, duration = 2) {
        if (!this.fluxApp.audioAnalyzer || !this.fluxApp.audioAnalyzer.audioContext) {
            console.warn('Audio context not available for test tone')
            return
        }
        
        const audioContext = this.fluxApp.audioAnalyzer.audioContext
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
        oscillator.type = 'sine'
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1)
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration - 0.1)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + duration)
        
        console.log(`🎵 Playing test tone: ${frequency}Hz for ${duration}s`)
    }
    
    /**
     * Generate synthetic audio data for testing without actual audio input
     */
    generateSyntheticAudioData() {
        const time = performance.now() * 0.001
        
        return {
            bass: 0.3 + 0.3 * Math.sin(time * 2),
            mids: 0.4 + 0.2 * Math.sin(time * 3),
            treble: 0.2 + 0.3 * Math.sin(time * 5),
            overall: 0.4 + 0.2 * Math.sin(time * 1.5),
            spectrum: new Array(1024).fill(0).map((_, i) => {
                return Math.sin(time + i * 0.01) * 128 + 128
            }),
            timestamp: performance.now(),
            analysisTime: 1.5
        }
    }
    
    /**
     * Test audio effects with synthetic data
     */
    testWithSyntheticData() {
        if (!this.fluxApp.audioEffects) {
            console.warn('Audio effects not available')
            return
        }
        
        console.log('🧪 Testing with synthetic audio data')
        
        const testInterval = setInterval(() => {
            const syntheticAudio = this.generateSyntheticAudioData()
            const syntheticBeat = {
                isBeat: Math.random() > 0.8,
                strength: Math.random() * 2,
                bpm: 120 + Math.random() * 40,
                confidence: Math.random()
            }
            
            this.fluxApp.audioEffects.processAudioData(syntheticAudio, syntheticBeat)
        }, 50)
        
        // Stop after 30 seconds
        setTimeout(() => {
            clearInterval(testInterval)
            console.log('🧪 Synthetic data test completed')
        }, 30000)
    }
}

// Global helper functions for easy access
window.audioExamples = {
    run: (name) => {
        if (window.fluxApp && window.fluxApp.audioExample) {
            return window.fluxApp.audioExample.runExample(name)
        } else {
            console.error('Audio examples not available. Initialize FLUX first.')
        }
    },
    
    stop: () => {
        if (window.fluxApp && window.fluxApp.audioExample) {
            return window.fluxApp.audioExample.stopCurrentExample()
        }
    },
    
    list: () => {
        if (window.fluxApp && window.fluxApp.audioExample) {
            return window.fluxApp.audioExample.listExamples()
        } else {
            console.log('Available examples: basic, pulse, spectrum, custom, performance, multimode')
        }
    },
    
    testTone: (freq, duration) => {
        if (window.fluxApp && window.fluxApp.audioExample) {
            return window.fluxApp.audioExample.playTestTone(freq, duration)
        }
    },
    
    synthetic: () => {
        if (window.fluxApp && window.fluxApp.audioExample) {
            return window.fluxApp.audioExample.testWithSyntheticData()
        }
    }
}

console.log('🎵 Audio Examples loaded! Use audioExamples.list() to see available examples')