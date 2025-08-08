// Optimization integration system for FLUX physics playground
// Integrates all optimization components with the main application

import AestheticValidator from './aesthetic-validator.js'
import { 
    BloomOptimizer, 
    ParticleVisualOptimizer, 
    ScreenOptimizer, 
    ColorOptimizer 
} from './visual-optimizer.js'
import { 
    ObjectPool, 
    OptimizedTrailSystem, 
    BufferPool, 
    GCOptimizer, 
    OptimizedEventSystem 
} from './memory-optimizer.js'

/**
 * Comprehensive optimization manager that coordinates all optimization systems
 */
class OptimizationManager {
    constructor() {
        // Visual optimizers
        this.bloomOptimizer = new BloomOptimizer()
        this.particleVisualOptimizer = new ParticleVisualOptimizer()
        this.screenOptimizer = new ScreenOptimizer()
        this.colorOptimizer = new ColorOptimizer()
        
        // Memory optimizers
        this.bufferPool = new BufferPool()
        this.gcOptimizer = new GCOptimizer()
        this.eventSystem = new OptimizedEventSystem()
        
        // Aesthetic validator
        this.aestheticValidator = new AestheticValidator()
        
        // Performance tracking
        this.performanceData = {
            frameTime: 0,
            particleCount: 0,
            memoryUsage: 0,
            gcEvents: 0,
            bloomQuality: 'high',
            screenProfile: 'desktop'
        }
        
        // Optimization state
        this.optimizationState = {
            performanceModeEnabled: false,
            adaptiveQualityEnabled: true,
            memoryOptimizationEnabled: true,
            visualOptimizationEnabled: true,
            lastOptimizationTime: 0,
            optimizationInterval: 1000 // Check every second
        }
        
        console.log('🚀 Optimization manager initialized with all systems')
    }
    
    /**
     * Initialize optimization systems with application context
     */
    initialize(pixiApp, particleRenderer, solver) {
        this.pixiApp = pixiApp
        this.particleRenderer = particleRenderer
        this.solver = solver
        
        // Initialize aesthetic validator
        this.aestheticValidator.initialize(pixiApp, particleRenderer)
        
        // Setup screen optimization
        this.setupScreenOptimization()
        
        // Setup memory optimization
        this.setupMemoryOptimization()
        
        // Setup event listeners
        this.setupOptimizationEvents()
        
        console.log('🎯 Optimization systems initialized with application context')
    }
    
    /**
     * Setup screen-based optimizations
     */
    setupScreenOptimization() {
        // Initial screen optimization
        const screenSettings = this.screenOptimizer.getOptimizedSettings()
        this.performanceData.screenProfile = screenSettings.profile
        
        // Apply performance mode if needed
        if (screenSettings.performanceMode) {
            this.enablePerformanceMode()
        }
        
        // Setup resize handler
        window.addEventListener('resize', () => {
            if (this.screenOptimizer.onResize()) {
                this.applyScreenOptimizations()
            }
        })
        
        console.log(`📱 Screen optimization setup for ${screenSettings.profile} profile`)
    }
    
    /**
     * Setup memory optimization systems
     */
    setupMemoryOptimization() {
        if (!this.optimizationState.memoryOptimizationEnabled) return
        
        // Create optimized trail system if particle count is known
        if (this.solver) {
            const particleCount = this.solver.get_particle_count()
            this.trailSystem = new OptimizedTrailSystem(particleCount, 8)
            console.log(`💾 Optimized trail system created for ${particleCount} particles`)
        }
        
        // Setup periodic memory cleanup
        setInterval(() => {
            this.performMemoryCleanup()
        }, 5000) // Every 5 seconds
        
        console.log('💾 Memory optimization systems initialized')
    }
    
    /**
     * Setup optimization event listeners
     */
    setupOptimizationEvents() {
        // Performance monitoring events
        this.eventSystem.on('performance-update', (event) => {
            this.updatePerformanceData(event.data)
        })
        
        // Quality adjustment events
        this.eventSystem.on('quality-adjust', (event) => {
            this.adjustQualitySettings(event.data)
        })
        
        // Memory pressure events
        this.eventSystem.on('memory-pressure', (event) => {
            this.handleMemoryPressure(event.data)
        })
        
        console.log('📡 Optimization event system setup complete')
    }
    
    /**
     * Main optimization update loop - called from render loop
     */
    update(frameTime, particleCount) {
        const now = performance.now()
        
        // Update performance data
        this.performanceData.frameTime = frameTime
        this.performanceData.particleCount = particleCount
        this.performanceData.memoryUsage = performance.memory ? performance.memory.usedJSHeapSize : 0
        
        // Run optimizations at intervals
        if (now - this.optimizationState.lastOptimizationTime > this.optimizationState.optimizationInterval) {
            this.runOptimizationCycle()
            this.optimizationState.lastOptimizationTime = now
        }
        
        // Update visual optimizations
        if (this.optimizationState.visualOptimizationEnabled) {
            this.updateVisualOptimizations()
        }
        
        // Emit performance update event
        this.eventSystem.emit('performance-update', {
            frameTime,
            particleCount,
            memoryUsage: this.performanceData.memoryUsage
        })
    }
    
    /**
     * Run comprehensive optimization cycle
     */
    runOptimizationCycle() {
        // Update bloom quality based on performance
        if (this.optimizationState.adaptiveQualityEnabled) {
            const bloomSettings = this.bloomOptimizer.updateQuality(this.performanceData)
            this.applyBloomSettings(bloomSettings)
        }
        
        // Check for memory pressure
        const gcStats = this.gcOptimizer.getGCStats()
        if (gcStats.gcFrequency > 0.5) {
            this.eventSystem.emit('memory-pressure', { gcStats })
        }
        
        // Apply screen-based optimizations
        this.applyScreenOptimizations()
        
        // Performance mode toggle based on conditions
        this.evaluatePerformanceMode()
    }
    
    /**
     * Update visual optimizations
     */
    updateVisualOptimizations() {
        // Update particle visual settings based on performance
        if (this.performanceData.frameTime > 20) {
            this.particleVisualOptimizer.optimizeForPerformance(true)
        } else if (this.performanceData.frameTime < 14) {
            this.particleVisualOptimizer.optimizeForPerformance(false)
        }
    }
    
    /**
     * Apply bloom settings to the renderer
     */
    applyBloomSettings(settings) {
        if (!this.particleRenderer || !this.particleRenderer.container) return
        
        try {
            // Find existing bloom filter
            const filters = this.particleRenderer.container.filters || []
            let bloomFilter = filters.find(f => 
                f.constructor.name.includes('Bloom') || 
                f.constructor.name.includes('bloom')
            )
            
            if (bloomFilter) {
                // Update existing bloom filter settings
                Object.assign(bloomFilter, settings)
                this.performanceData.bloomQuality = this.bloomOptimizer.currentQuality
                
                console.log(`🎨 Bloom settings updated to ${this.bloomOptimizer.currentQuality} quality`)
            }
        } catch (error) {
            console.warn('Failed to apply bloom settings:', error)
        }
    }
    
    /**
     * Apply screen-based optimizations
     */
    applyScreenOptimizations() {
        const screenSettings = this.screenOptimizer.getOptimizedSettings()
        
        // Update canvas settings if needed
        if (this.pixiApp && this.pixiApp.renderer) {
            const canvasSettings = this.screenOptimizer.getCanvasSettings()
            
            // Apply resolution scaling
            if (this.pixiApp.renderer.resolution !== canvasSettings.resolution) {
                this.pixiApp.renderer.resolution = canvasSettings.resolution
                console.log(`📱 Canvas resolution updated to ${canvasSettings.resolution}x`)
            }
        }
        
        // Recommend particle count adjustment
        if (this.solver && screenSettings.recommendedParticleCount !== this.performanceData.particleCount) {
            const currentCount = this.solver.get_active_particle_count()
            const recommendedCount = screenSettings.recommendedParticleCount
            
            if (Math.abs(currentCount - recommendedCount) > 50) {
                console.log(`📱 Recommending particle count adjustment: ${currentCount} → ${recommendedCount}`)
                // Note: Actual adjustment would be handled by the main application
            }
        }
    }
    
    /**
     * Evaluate whether to enable/disable performance mode
     */
    evaluatePerformanceMode() {
        const shouldEnablePerformanceMode = 
            this.performanceData.frameTime > 25 || // Poor frame time
            this.performanceData.particleCount > 1200 || // High particle count
            this.screenOptimizer.getOptimizedSettings().performanceMode // Screen-based
        
        if (shouldEnablePerformanceMode && !this.optimizationState.performanceModeEnabled) {
            this.enablePerformanceMode()
        } else if (!shouldEnablePerformanceMode && this.optimizationState.performanceModeEnabled) {
            this.disablePerformanceMode()
        }
    }
    
    /**
     * Enable performance mode across all systems
     */
    enablePerformanceMode() {
        this.optimizationState.performanceModeEnabled = true
        
        // Apply performance optimizations
        this.particleVisualOptimizer.optimizeForPerformance(true)
        this.bloomOptimizer.setQuality('low')
        
        console.log('⚡ Performance mode ENABLED - reduced visual quality for better performance')
    }
    
    /**
     * Disable performance mode and restore quality
     */
    disablePerformanceMode() {
        this.optimizationState.performanceModeEnabled = false
        
        // Restore quality settings
        this.particleVisualOptimizer.optimizeForPerformance(false)
        this.bloomOptimizer.enableAdaptive()
        
        console.log('✨ Performance mode DISABLED - restored full visual quality')
    }
    
    /**
     * Handle memory pressure situations
     */
    handleMemoryPressure(data) {
        console.warn('💾 Memory pressure detected, applying optimizations...')
        
        // Perform immediate cleanup
        this.performMemoryCleanup()
        
        // Reduce visual complexity temporarily
        this.particleVisualOptimizer.optimizeForPerformance(true)
        
        // Suggest garbage collection optimizations
        const suggestions = this.gcOptimizer.suggestOptimizations()
        suggestions.forEach(suggestion => {
            console.log(`💡 GC Optimization suggestion: ${suggestion}`)
        })
    }
    
    /**
     * Perform memory cleanup operations
     */
    performMemoryCleanup() {
        // Clean up buffer pools
        this.bufferPool.cleanup()
        
        // Clean up trail system if it exists
        if (this.trailSystem) {
            // Trail system cleanup would go here
        }
        
        // Force garbage collection if available (development only)
        if (window.gc && typeof window.gc === 'function') {
            window.gc()
            console.log('💾 Manual garbage collection triggered')
        }
    }
    
    /**
     * Run comprehensive aesthetic validation
     */
    async validateAesthetics() {
        console.log('🎨 Running comprehensive aesthetic validation...')
        const results = await this.aestheticValidator.validateAll()
        
        if (results.passed) {
            console.log(`✅ All aesthetic requirements met (${results.successRate}% success rate)`)
        } else {
            console.warn(`❌ Aesthetic validation failed (${results.passedCount}/${results.totalCount} passed)`)
            console.log(this.aestheticValidator.generateReport())
        }
        
        return results
    }
    
    /**
     * Get comprehensive optimization status
     */
    getOptimizationStatus() {
        return {
            performance: {
                frameTime: this.performanceData.frameTime,
                particleCount: this.performanceData.particleCount,
                memoryUsage: this.performanceData.memoryUsage,
                performanceModeEnabled: this.optimizationState.performanceModeEnabled
            },
            visual: {
                bloomQuality: this.performanceData.bloomQuality,
                screenProfile: this.performanceData.screenProfile,
                colorPalette: this.colorOptimizer.currentPalette
            },
            memory: {
                bufferPoolStats: this.bufferPool.getStats(),
                gcStats: this.gcOptimizer.getGCStats(),
                eventSystemStats: this.eventSystem.getStats()
            },
            optimization: {
                adaptiveQualityEnabled: this.optimizationState.adaptiveQualityEnabled,
                memoryOptimizationEnabled: this.optimizationState.memoryOptimizationEnabled,
                visualOptimizationEnabled: this.optimizationState.visualOptimizationEnabled
            }
        }
    }
    
    /**
     * Generate optimization report
     */
    generateOptimizationReport() {
        const status = this.getOptimizationStatus()
        
        let report = '\n🚀 FLUX OPTIMIZATION REPORT\n'
        report += '='.repeat(50) + '\n\n'
        
        // Performance section
        report += '📊 PERFORMANCE\n'
        report += `Frame Time: ${status.performance.frameTime.toFixed(2)}ms\n`
        report += `Particle Count: ${status.performance.particleCount}\n`
        report += `Memory Usage: ${(status.performance.memoryUsage / 1024 / 1024).toFixed(1)}MB\n`
        report += `Performance Mode: ${status.performance.performanceModeEnabled ? 'ENABLED' : 'DISABLED'}\n\n`
        
        // Visual section
        report += '🎨 VISUAL QUALITY\n'
        report += `Bloom Quality: ${status.visual.bloomQuality}\n`
        report += `Screen Profile: ${status.visual.screenProfile}\n`
        report += `Color Palette: ${status.visual.colorPalette}\n\n`
        
        // Memory section
        report += '💾 MEMORY OPTIMIZATION\n'
        report += `Buffer Pools: ${status.memory.bufferPoolStats.totalBuffers} buffers\n`
        report += `GC Events: ${status.memory.gcStats.recentGCEvents} recent\n`
        report += `Event Handlers: ${status.memory.eventSystemStats.totalHandlers}\n\n`
        
        // Optimization settings
        report += '⚙️  OPTIMIZATION SETTINGS\n'
        report += `Adaptive Quality: ${status.optimization.adaptiveQualityEnabled ? 'ON' : 'OFF'}\n`
        report += `Memory Optimization: ${status.optimization.memoryOptimizationEnabled ? 'ON' : 'OFF'}\n`
        report += `Visual Optimization: ${status.optimization.visualOptimizationEnabled ? 'ON' : 'OFF'}\n`
        
        return report
    }
    
    /**
     * Enable/disable specific optimization features
     */
    toggleOptimization(feature, enabled) {
        switch (feature) {
            case 'adaptiveQuality':
                this.optimizationState.adaptiveQualityEnabled = enabled
                if (enabled) {
                    this.bloomOptimizer.enableAdaptive()
                }
                break
                
            case 'memoryOptimization':
                this.optimizationState.memoryOptimizationEnabled = enabled
                break
                
            case 'visualOptimization':
                this.optimizationState.visualOptimizationEnabled = enabled
                break
                
            case 'performanceMode':
                if (enabled) {
                    this.enablePerformanceMode()
                } else {
                    this.disablePerformanceMode()
                }
                break
        }
        
        console.log(`⚙️  ${feature} optimization ${enabled ? 'ENABLED' : 'DISABLED'}`)
    }
}

// Export the optimization manager
export default OptimizationManager