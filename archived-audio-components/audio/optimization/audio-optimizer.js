/**
 * FLUX Audio Reactive Optimizer
 * Automatically optimizes audio settings for best performance and visual quality
 */

export class AudioOptimizer {
    constructor(fluxApp) {
        this.fluxApp = fluxApp
        this.optimizationHistory = []
        this.performanceMetrics = {
            frameRate: 60,
            audioLatency: 0,
            cpuUsage: 0,
            memoryUsage: 0
        }
        
        // Optimization presets
        this.presets = {
            performance: {
                name: 'High Performance',
                description: 'Optimized for 60fps with minimal CPU usage',
                settings: {
                    fftSize: 1024,
                    smoothingTimeConstant: 0.9,
                    sensitivity: 0.8,
                    useWebWorker: true,
                    adaptiveQuality: true,
                    bloomIntensity: 0.9,
                    particleCount: 600
                }
            },
            
            quality: {
                name: 'High Quality',
                description: 'Maximum visual quality with detailed analysis',
                settings: {
                    fftSize: 2048,
                    smoothingTimeConstant: 0.7,
                    sensitivity: 1.2,
                    useWebWorker: true,
                    adaptiveQuality: false,
                    bloomIntensity: 1.3,
                    particleCount: 1000
                }
            },
            
            balanced: {
                name: 'Balanced',
                description: 'Good balance of performance and quality',
                settings: {
                    fftSize: 1536,
                    smoothingTimeConstant: 0.8,
                    sensitivity: 1.0,
                    useWebWorker: true,
                    adaptiveQuality: true,
                    bloomIntensity: 1.1,
                    particleCount: 800
                }
            },
            
            mobile: {
                name: 'Mobile Optimized',
                description: 'Optimized for mobile devices and low-power systems',
                settings: {
                    fftSize: 512,
                    smoothingTimeConstant: 0.95,
                    sensitivity: 0.6,
                    useWebWorker: false,
                    adaptiveQuality: true,
                    bloomIntensity: 0.8,
                    particleCount: 400
                }
            }
        }
        
        this.currentPreset = 'balanced'
        this.autoOptimizationEnabled = true
    }
    
    /**
     * Automatically detect optimal settings based on system capabilities
     */
    async autoOptimize() {
        console.log('🔧 Starting automatic audio optimization...')
        
        // Detect system capabilities
        const capabilities = await this.detectSystemCapabilities()
        console.log('📊 System capabilities:', capabilities)
        
        // Choose optimal preset
        const optimalPreset = this.selectOptimalPreset(capabilities)
        console.log(`🎯 Selected preset: ${optimalPreset}`)
        
        // Apply optimization
        await this.applyPreset(optimalPreset)
        
        // Start performance monitoring
        this.startPerformanceMonitoring()
        
        console.log('✅ Auto-optimization complete')
        return optimalPreset
    }
    
    /**
     * Detect system capabilities for optimization
     */
    async detectSystemCapabilities() {
        const capabilities = {
            cpuCores: navigator.hardwareConcurrency || 4,
            memory: this.getMemoryInfo(),
            webWorkerSupport: !!window.Worker,
            webAudioSupport: !!(window.AudioContext || window.webkitAudioContext),
            isMobile: this.isMobileDevice(),
            browserEngine: this.detectBrowserEngine(),
            performanceScore: 0
        }
        
        // Run performance benchmark
        capabilities.performanceScore = await this.runPerformanceBenchmark()
        
        return capabilities
    }
    
    /**
     * Get memory information if available
     */
    getMemoryInfo() {
        if (performance.memory) {
            return {
                total: performance.memory.totalJSHeapSize,
                used: performance.memory.usedJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            }
        }
        return null
    }
    
    /**
     * Detect if running on mobile device
     */
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    }
    
    /**
     * Detect browser engine for optimization
     */
    detectBrowserEngine() {
        const userAgent = navigator.userAgent
        
        if (userAgent.includes('Chrome')) return 'chrome'
        if (userAgent.includes('Firefox')) return 'firefox'
        if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'safari'
        if (userAgent.includes('Edge')) return 'edge'
        
        return 'unknown'
    }
    
    /**
     * Run performance benchmark to assess system capabilities
     */
    async runPerformanceBenchmark() {
        console.log('🏃 Running performance benchmark...')
        
        const startTime = performance.now()
        let score = 100 // Base score
        
        // Test 1: FFT processing speed
        const fftScore = await this.benchmarkFFTProcessing()
        score += fftScore
        
        // Test 2: Particle rendering performance
        const renderScore = await this.benchmarkParticleRendering()
        score += renderScore
        
        // Test 3: Memory allocation speed
        const memoryScore = this.benchmarkMemoryOperations()
        score += memoryScore
        
        const totalTime = performance.now() - startTime
        console.log(`📊 Benchmark completed in ${totalTime.toFixed(2)}ms, score: ${score}`)
        
        return Math.max(0, Math.min(300, score)) // Clamp between 0-300
    }
    
    /**
     * Benchmark FFT processing performance
     */
    async benchmarkFFTProcessing() {
        const testData = new Uint8Array(2048).fill(0).map(() => Math.random() * 255)
        const iterations = 100
        
        const startTime = performance.now()
        
        for (let i = 0; i < iterations; i++) {
            // Simulate FFT processing
            let sum = 0
            for (let j = 0; j < testData.length; j++) {
                sum += testData[j] * Math.sin(j * 0.01)
            }
        }
        
        const endTime = performance.now()
        const avgTime = (endTime - startTime) / iterations
        
        // Score based on processing speed (lower time = higher score)
        return Math.max(0, 50 - avgTime * 10)
    }
    
    /**
     * Benchmark particle rendering performance
     */
    async benchmarkParticleRendering() {
        if (!this.fluxApp.particleRenderer) {
            return 0
        }
        
        const startTime = performance.now()
        const testPositions = new Float32Array(2000) // 1000 particles
        
        // Fill with test data
        for (let i = 0; i < testPositions.length; i += 2) {
            testPositions[i] = Math.random() * 800
            testPositions[i + 1] = Math.random() * 600
        }
        
        // Test rendering updates
        const iterations = 50
        for (let i = 0; i < iterations; i++) {
            this.fluxApp.particleRenderer.updatePositions(testPositions, 1000)
        }
        
        const endTime = performance.now()
        const avgTime = (endTime - startTime) / iterations
        
        // Score based on rendering speed
        return Math.max(0, 30 - avgTime * 2)
    }
    
    /**
     * Benchmark memory operations
     */
    benchmarkMemoryOperations() {
        const startTime = performance.now()
        
        // Test array allocations and operations
        const arrays = []
        for (let i = 0; i < 100; i++) {
            const arr = new Float32Array(1024)
            arr.fill(Math.random())
            arrays.push(arr)
        }
        
        // Clean up
        arrays.length = 0
        
        const endTime = performance.now()
        const totalTime = endTime - startTime
        
        // Score based on memory operation speed
        return Math.max(0, 20 - totalTime * 0.5)
    }
    
    /**
     * Select optimal preset based on system capabilities
     */
    selectOptimalPreset(capabilities) {
        const { performanceScore, cpuCores, isMobile, browserEngine } = capabilities
        
        // Mobile devices get mobile preset
        if (isMobile) {
            return 'mobile'
        }
        
        // Low performance systems
        if (performanceScore < 100 || cpuCores < 4) {
            return 'performance'
        }
        
        // High performance systems
        if (performanceScore > 200 && cpuCores >= 8) {
            return 'quality'
        }
        
        // Safari gets performance preset due to Web Audio limitations
        if (browserEngine === 'safari') {
            return 'performance'
        }
        
        // Default to balanced
        return 'balanced'
    }
    
    /**
     * Apply optimization preset
     */
    async applyPreset(presetName) {
        const preset = this.presets[presetName]
        if (!preset) {
            console.error(`Unknown preset: ${presetName}`)
            return false
        }
        
        console.log(`🎛️ Applying preset: ${preset.name}`)
        console.log(`📝 ${preset.description}`)
        
        const settings = preset.settings
        
        try {
            // Apply audio analyzer settings
            if (this.fluxApp.audioAnalyzer) {
                this.fluxApp.audioAnalyzer.updateFrequencyConfig({
                    fftSize: settings.fftSize,
                    smoothingTimeConstant: settings.smoothingTimeConstant,
                    useWebWorker: settings.useWebWorker,
                    adaptiveQualityEnabled: settings.adaptiveQuality
                })
            }
            
            // Apply sensitivity
            this.fluxApp.setAudioSensitivity(settings.sensitivity)
            
            // Apply visual settings
            if (this.fluxApp.particleRenderer) {
                this.fluxApp.particleRenderer.updateParticleCount(settings.particleCount)
                
                // Update bloom intensity
                if (this.fluxApp.particleRenderer.container.filters) {
                    const bloomFilter = this.fluxApp.particleRenderer.container.filters.find(f => 
                        f.constructor.name.includes('Bloom')
                    )
                    if (bloomFilter) {
                        bloomFilter.bloomScale = settings.bloomIntensity
                    }
                }
            }
            
            this.currentPreset = presetName
            
            // Save optimization to history
            this.optimizationHistory.push({
                timestamp: Date.now(),
                preset: presetName,
                settings: { ...settings }
            })
            
            console.log('✅ Preset applied successfully')
            return true
            
        } catch (error) {
            console.error('❌ Failed to apply preset:', error)
            return false
        }
    }
    
    /**
     * Start continuous performance monitoring
     */
    startPerformanceMonitoring() {
        if (this.performanceMonitor) {
            clearInterval(this.performanceMonitor)
        }
        
        let frameCount = 0
        let totalFrameTime = 0
        let lastTime = performance.now()
        
        this.performanceMonitor = setInterval(() => {
            const currentTime = performance.now()
            const frameTime = currentTime - lastTime
            
            frameCount++
            totalFrameTime += frameTime
            
            if (frameCount >= 60) { // Check every 60 frames (~1 second)
                const avgFrameTime = totalFrameTime / frameCount
                const fps = 1000 / avgFrameTime
                
                this.performanceMetrics.frameRate = fps
                
                // Auto-adjust if performance is poor
                if (this.autoOptimizationEnabled && fps < 45) {
                    this.handlePoorPerformance(fps)
                }
                
                frameCount = 0
                totalFrameTime = 0
            }
            
            lastTime = currentTime
        }, 1000)
        
        console.log('📊 Performance monitoring started')
    }
    
    /**
     * Handle poor performance by reducing quality
     */
    handlePoorPerformance(currentFPS) {
        console.warn(`⚠️ Poor performance detected: ${currentFPS.toFixed(1)} FPS`)
        
        // Don't adjust too frequently
        const lastOptimization = this.optimizationHistory[this.optimizationHistory.length - 1]
        if (lastOptimization && Date.now() - lastOptimization.timestamp < 10000) {
            return
        }
        
        // Step down to more performance-oriented preset
        const presetOrder = ['quality', 'balanced', 'performance', 'mobile']
        const currentIndex = presetOrder.indexOf(this.currentPreset)
        
        if (currentIndex < presetOrder.length - 1) {
            const newPreset = presetOrder[currentIndex + 1]
            console.log(`🔧 Auto-adjusting to ${newPreset} preset for better performance`)
            this.applyPreset(newPreset)
        }
    }
    
    /**
     * Get current performance metrics
     */
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            currentPreset: this.currentPreset,
            autoOptimizationEnabled: this.autoOptimizationEnabled
        }
    }
    
    /**
     * Fine-tune audio sensitivity based on music genre
     */
    optimizeForGenre(genre) {
        const genreOptimizations = {
            'edm': {
                sensitivity: 1.3,
                bassWeight: 1.4,
                trebleWeight: 1.2,
                smoothing: 0.6
            },
            'rock': {
                sensitivity: 1.1,
                bassWeight: 1.3,
                midsWeight: 1.2,
                smoothing: 0.7
            },
            'classical': {
                sensitivity: 0.8,
                bassWeight: 0.9,
                midsWeight: 1.1,
                smoothing: 0.9
            },
            'ambient': {
                sensitivity: 0.6,
                bassWeight: 0.7,
                trebleWeight: 1.2,
                smoothing: 0.95
            }
        }
        
        const optimization = genreOptimizations[genre.toLowerCase()]
        if (!optimization) {
            console.warn(`No optimization available for genre: ${genre}`)
            return false
        }
        
        console.log(`🎵 Optimizing for ${genre} music`)
        
        // Apply genre-specific settings
        this.fluxApp.setAudioSensitivity(optimization.sensitivity)
        
        if (this.fluxApp.audioEffects) {
            this.fluxApp.audioEffects.updateFrequencyWeights({
                bass: optimization.bassWeight || 1.0,
                mids: optimization.midsWeight || 1.0,
                treble: optimization.trebleWeight || 1.0
            })
            
            this.fluxApp.audioEffects.setSmoothingFactor(optimization.smoothing)
        }
        
        return true
    }
    
    /**
     * Create custom optimization profile
     */
    createCustomProfile(name, settings) {
        this.presets[name] = {
            name: name,
            description: 'Custom user-defined preset',
            settings: { ...settings }
        }
        
        console.log(`✅ Created custom profile: ${name}`)
        return true
    }
    
    /**
     * Export current settings as a profile
     */
    exportCurrentSettings(name) {
        const currentSettings = {
            fftSize: this.fluxApp.audioAnalyzer?.config.fftSize || 2048,
            smoothingTimeConstant: this.fluxApp.audioAnalyzer?.config.smoothingTimeConstant || 0.8,
            sensitivity: this.fluxApp.audioState?.sensitivity || 1.0,
            useWebWorker: true,
            adaptiveQuality: true,
            bloomIntensity: 1.0,
            particleCount: this.fluxApp.particleRenderer?.particleCount || 800
        }
        
        this.createCustomProfile(name, currentSettings)
        return currentSettings
    }
    
    /**
     * Stop performance monitoring
     */
    stopPerformanceMonitoring() {
        if (this.performanceMonitor) {
            clearInterval(this.performanceMonitor)
            this.performanceMonitor = null
            console.log('📊 Performance monitoring stopped')
        }
    }
    
    /**
     * Get optimization recommendations
     */
    getRecommendations() {
        const metrics = this.getPerformanceMetrics()
        const recommendations = []
        
        if (metrics.frameRate < 50) {
            recommendations.push({
                type: 'performance',
                message: 'Frame rate is low. Consider switching to Performance preset.',
                action: () => this.applyPreset('performance')
            })
        }
        
        if (metrics.frameRate > 58 && this.currentPreset === 'performance') {
            recommendations.push({
                type: 'quality',
                message: 'Performance is good. You can try Balanced or Quality preset.',
                action: () => this.applyPreset('balanced')
            })
        }
        
        return recommendations
    }
    
    /**
     * Cleanup resources
     */
    dispose() {
        this.stopPerformanceMonitoring()
        this.optimizationHistory = []
        console.log('🗑️ Audio optimizer disposed')
    }
}

// Global helper functions
window.audioOptimizer = {
    autoOptimize: () => {
        if (window.fluxApp?.audioOptimizer) {
            return window.fluxApp.audioOptimizer.autoOptimize()
        }
    },
    
    applyPreset: (preset) => {
        if (window.fluxApp?.audioOptimizer) {
            return window.fluxApp.audioOptimizer.applyPreset(preset)
        }
    },
    
    optimizeForGenre: (genre) => {
        if (window.fluxApp?.audioOptimizer) {
            return window.fluxApp.audioOptimizer.optimizeForGenre(genre)
        }
    },
    
    getMetrics: () => {
        if (window.fluxApp?.audioOptimizer) {
            return window.fluxApp.audioOptimizer.getPerformanceMetrics()
        }
    },
    
    getRecommendations: () => {
        if (window.fluxApp?.audioOptimizer) {
            return window.fluxApp.audioOptimizer.getRecommendations()
        }
    }
}

console.log('🔧 Audio Optimizer loaded! Use audioOptimizer.autoOptimize() to start')