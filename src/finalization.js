// FLUX Physics Playground Finalization
// Final optimization and validation system

import OptimizationManager from './optimizations/optimization-integration.js'

/**
 * Application finalizer that handles final optimizations and validation
 */
class FluxFinalizer {
    constructor(fluxApp) {
        this.fluxApp = fluxApp
        this.optimizationManager = new OptimizationManager()
        this.finalizationComplete = false
        this.validationResults = null
        
        console.log('🏁 FLUX Finalizer initialized')
    }
    
    /**
     * Run complete finalization process
     */
    async finalize() {
        console.log('\n🏁 Starting FLUX finalization process...')
        
        try {
            // Step 1: Initialize optimization systems
            await this.initializeOptimizations()
            
            // Step 2: Profile application performance
            await this.profilePerformance()
            
            // Step 3: Optimize memory usage
            await this.optimizeMemoryUsage()
            
            // Step 4: Fine-tune visual effects
            await this.finetuneVisualEffects()
            
            // Step 5: Test cross-browser compatibility
            await this.testCrossBrowserCompatibility()
            
            // Step 6: Validate all aesthetic requirements
            await this.validateAesthetics()
            
            // Step 7: Generate final report
            this.generateFinalReport()
            
            this.finalizationComplete = true
            console.log('✅ FLUX finalization completed successfully!')
            
        } catch (error) {
            console.error('❌ Finalization failed:', error)
            throw error
        }
    }
    
    /**
     * Initialize optimization systems with application context
     */
    async initializeOptimizations() {
        console.log('🚀 Initializing optimization systems...')
        
        // Wait for application to be fully initialized
        if (!this.fluxApp.pixiApp || !this.fluxApp.particleRenderer || !this.fluxApp.solver) {
            throw new Error('Application not fully initialized')
        }
        
        // Initialize optimization manager
        this.optimizationManager.initialize(
            this.fluxApp.pixiApp,
            this.fluxApp.particleRenderer,
            this.fluxApp.solver
        )
        
        // Integrate optimization manager with render loop
        this.integrateWithRenderLoop()
        
        console.log('✅ Optimization systems initialized')
    }
    
    /**
     * Integrate optimization manager with the main render loop
     */
    integrateWithRenderLoop() {
        // Store original performance monitor update
        const originalMonitorUpdate = this.fluxApp.monitorRenderLoopPerformance
        
        // Enhance performance monitoring with optimization manager
        this.fluxApp.monitorRenderLoopPerformance = (frameStartTime, deltaTime, smoothedDeltaTime) => {
            // Call original monitoring
            if (originalMonitorUpdate) {
                originalMonitorUpdate.call(this.fluxApp, frameStartTime, deltaTime, smoothedDeltaTime)
            }
            
            // Update optimization manager
            const frameTime = performance.now() - frameStartTime
            const particleCount = this.fluxApp.solver ? this.fluxApp.solver.get_active_particle_count() : 0
            
            this.optimizationManager.update(frameTime, particleCount)
        }
        
        console.log('🔗 Optimization manager integrated with render loop')
    }
    
    /**
     * Profile application performance with various particle counts
     */
    async profilePerformance() {
        console.log('📊 Profiling application performance...')
        
        const testCounts = [100, 300, 500, 800, 1000, 1200]
        const profileResults = []
        
        for (const count of testCounts) {
            console.log(`Testing with ${count} particles...`)
            
            // Set particle count
            if (this.fluxApp.solver) {
                this.fluxApp.solver.set_particle_count(count)
                this.fluxApp.particleRenderer.updateParticleCount(count)
            }
            
            // Wait for stabilization
            await this.wait(2000)
            
            // Measure performance
            const performance = await this.measurePerformance(1000) // 1 second measurement
            profileResults.push({
                particleCount: count,
                avgFrameTime: performance.avgFrameTime,
                minFrameTime: performance.minFrameTime,
                maxFrameTime: performance.maxFrameTime,
                fps: performance.fps,
                memoryUsage: performance.memoryUsage
            })
            
            console.log(`${count} particles: ${performance.fps.toFixed(1)} FPS, ${performance.avgFrameTime.toFixed(2)}ms avg`)
        }
        
        // Find optimal particle count
        const optimalCount = this.findOptimalParticleCount(profileResults)
        console.log(`🎯 Optimal particle count determined: ${optimalCount}`)
        
        // Set optimal count
        if (this.fluxApp.solver) {
            this.fluxApp.solver.set_particle_count(optimalCount)
            this.fluxApp.particleRenderer.updateParticleCount(optimalCount)
            this.fluxApp.config.particleCount = optimalCount
        }
        
        this.profileResults = profileResults
        console.log('✅ Performance profiling completed')
    }
    
    /**
     * Measure performance over a specified duration
     */
    async measurePerformance(duration) {
        return new Promise((resolve) => {
            const frameTimes = []
            const startTime = performance.now()
            let lastFrameTime = startTime
            
            const measureFrame = () => {
                const currentTime = performance.now()
                const frameTime = currentTime - lastFrameTime
                frameTimes.push(frameTime)
                lastFrameTime = currentTime
                
                if (currentTime - startTime < duration) {
                    requestAnimationFrame(measureFrame)
                } else {
                    // Calculate statistics
                    const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
                    const minFrameTime = Math.min(...frameTimes)
                    const maxFrameTime = Math.max(...frameTimes)
                    const fps = 1000 / avgFrameTime
                    const memoryUsage = performance.memory ? performance.memory.usedJSHeapSize : 0
                    
                    resolve({
                        avgFrameTime,
                        minFrameTime,
                        maxFrameTime,
                        fps,
                        memoryUsage,
                        frameCount: frameTimes.length
                    })
                }
            }
            
            requestAnimationFrame(measureFrame)
        })
    }
    
    /**
     * Find optimal particle count based on performance profile
     */
    findOptimalParticleCount(profileResults) {
        const targetFPS = 60
        const minAcceptableFPS = 45
        
        // Find highest particle count that maintains target FPS
        let optimalCount = 100 // Minimum fallback
        
        for (const result of profileResults) {
            if (result.fps >= targetFPS) {
                optimalCount = result.particleCount
            } else if (result.fps >= minAcceptableFPS && result.particleCount > optimalCount) {
                // Accept slightly lower FPS for more particles if still acceptable
                optimalCount = result.particleCount
            }
        }
        
        return optimalCount
    }
    
    /**
     * Optimize memory usage and garbage collection
     */
    async optimizeMemoryUsage() {
        console.log('💾 Optimizing memory usage...')
        
        // Force garbage collection if available
        if (window.gc && typeof window.gc === 'function') {
            window.gc()
            console.log('🗑️  Manual garbage collection triggered')
        }
        
        // Wait for GC to complete
        await this.wait(1000)
        
        // Measure baseline memory
        const baselineMemory = performance.memory ? performance.memory.usedJSHeapSize : 0
        console.log(`📊 Baseline memory usage: ${(baselineMemory / 1024 / 1024).toFixed(1)}MB`)
        
        // Run memory optimization
        this.optimizationManager.performMemoryCleanup()
        
        // Measure optimized memory
        await this.wait(1000)
        const optimizedMemory = performance.memory ? performance.memory.usedJSHeapSize : 0
        const memorySaved = baselineMemory - optimizedMemory
        
        console.log(`📊 Optimized memory usage: ${(optimizedMemory / 1024 / 1024).toFixed(1)}MB`)
        if (memorySaved > 0) {
            console.log(`💾 Memory saved: ${(memorySaved / 1024 / 1024).toFixed(1)}MB`)
        }
        
        console.log('✅ Memory optimization completed')
    }
    
    /**
     * Fine-tune visual effects and particle behavior
     */
    async finetuneVisualEffects() {
        console.log('🎨 Fine-tuning visual effects...')
        
        // Test different bloom settings
        const bloomQualities = ['low', 'medium', 'high', 'ultra']
        let bestQuality = 'medium'
        let bestPerformance = 0
        
        for (const quality of bloomQualities) {
            console.log(`Testing bloom quality: ${quality}`)
            
            // Set bloom quality
            this.optimizationManager.bloomOptimizer.setQuality(quality)
            
            // Wait for stabilization
            await this.wait(1000)
            
            // Measure performance
            const performance = await this.measurePerformance(500)
            
            if (performance.fps > bestPerformance && performance.fps >= 45) {
                bestQuality = quality
                bestPerformance = performance.fps
            }
            
            console.log(`${quality}: ${performance.fps.toFixed(1)} FPS`)
        }
        
        // Set optimal bloom quality
        this.optimizationManager.bloomOptimizer.setQuality(bestQuality)
        console.log(`🎯 Optimal bloom quality: ${bestQuality}`)
        
        // Fine-tune particle visual settings
        const particleConfig = this.optimizationManager.particleVisualOptimizer.getConfig()
        console.log('🔧 Particle visual configuration optimized:', particleConfig)
        
        console.log('✅ Visual effects fine-tuning completed')
    }
    
    /**
     * Test cross-browser compatibility
     */
    async testCrossBrowserCompatibility() {
        console.log('🌐 Testing cross-browser compatibility...')
        
        const browserTests = {
            webgl: this.testWebGLSupport(),
            wasm: this.testWASMSupport(),
            performance: this.testPerformanceAPI(),
            canvas: this.testCanvasSupport(),
            eventListeners: this.testEventListeners(),
            memory: this.testMemoryAPI()
        }
        
        const results = {}
        for (const [test, result] of Object.entries(browserTests)) {
            results[test] = result
            console.log(`${result ? '✅' : '❌'} ${test}: ${result ? 'SUPPORTED' : 'NOT SUPPORTED'}`)
        }
        
        // Check for critical failures
        const criticalTests = ['webgl', 'wasm', 'canvas']
        const criticalFailures = criticalTests.filter(test => !results[test])
        
        if (criticalFailures.length > 0) {
            console.warn(`⚠️  Critical browser compatibility issues: ${criticalFailures.join(', ')}`)
        } else {
            console.log('✅ All critical browser features supported')
        }
        
        this.browserCompatibility = results
        console.log('✅ Cross-browser compatibility testing completed')
    }
    
    /**
     * Browser compatibility test methods
     */
    testWebGLSupport() {
        try {
            const canvas = document.createElement('canvas')
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
            return !!gl
        } catch (e) {
            return false
        }
    }
    
    testWASMSupport() {
        return typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function'
    }
    
    testPerformanceAPI() {
        return typeof performance === 'object' && typeof performance.now === 'function'
    }
    
    testCanvasSupport() {
        try {
            const canvas = document.createElement('canvas')
            return !!(canvas.getContext && canvas.getContext('2d'))
        } catch (e) {
            return false
        }
    }
    
    testEventListeners() {
        return typeof addEventListener === 'function' && typeof removeEventListener === 'function'
    }
    
    testMemoryAPI() {
        return !!(performance.memory)
    }
    
    /**
     * Validate all aesthetic requirements
     */
    async validateAesthetics() {
        console.log('🎨 Validating aesthetic requirements...')
        
        // Run comprehensive aesthetic validation
        this.validationResults = await this.optimizationManager.validateAesthetics()
        
        if (this.validationResults.passed) {
            console.log(`✅ All aesthetic requirements validated (${this.validationResults.successRate}% success)`)
        } else {
            console.warn(`❌ Aesthetic validation issues found (${this.validationResults.passedCount}/${this.validationResults.totalCount} passed)`)
            
            // Log specific failures
            Object.entries(this.validationResults.results).forEach(([key, result]) => {
                if (!result.passed) {
                    console.warn(`  ❌ ${result.description}: ${result.message}`)
                }
            })
        }
        
        console.log('✅ Aesthetic validation completed')
    }
    
    /**
     * Generate comprehensive final report
     */
    generateFinalReport() {
        console.log('📋 Generating final optimization report...')
        
        let report = '\n🏁 FLUX PHYSICS PLAYGROUND - FINAL REPORT\n'
        report += '='.repeat(60) + '\n\n'
        
        // Application status
        report += '🚀 APPLICATION STATUS\n'
        report += `Finalization: ${this.finalizationComplete ? 'COMPLETE' : 'IN PROGRESS'}\n`
        report += `Particle Count: ${this.fluxApp.config.particleCount}\n`
        report += `Canvas Size: ${this.fluxApp.config.containerWidth}x${this.fluxApp.config.containerHeight}\n\n`
        
        // Performance profile
        if (this.profileResults) {
            report += '📊 PERFORMANCE PROFILE\n'
            this.profileResults.forEach(result => {
                report += `${result.particleCount} particles: ${result.fps.toFixed(1)} FPS (${result.avgFrameTime.toFixed(2)}ms)\n`
            })
            report += '\n'
        }
        
        // Browser compatibility
        if (this.browserCompatibility) {
            report += '🌐 BROWSER COMPATIBILITY\n'
            Object.entries(this.browserCompatibility).forEach(([test, supported]) => {
                report += `${supported ? '✅' : '❌'} ${test}: ${supported ? 'SUPPORTED' : 'NOT SUPPORTED'}\n`
            })
            report += '\n'
        }
        
        // Aesthetic validation
        if (this.validationResults) {
            report += '🎨 AESTHETIC VALIDATION\n'
            report += `Overall Score: ${this.validationResults.passedCount}/${this.validationResults.totalCount} (${this.validationResults.successRate}%)\n`
            
            Object.entries(this.validationResults.results).forEach(([key, result]) => {
                report += `${result.passed ? '✅' : '❌'} ${result.description}\n`
            })
            report += '\n'
        }
        
        // Optimization status
        report += this.optimizationManager.generateOptimizationReport()
        
        // Final recommendations
        report += '\n💡 RECOMMENDATIONS\n'
        report += this.generateRecommendations()
        
        console.log(report)
        
        // Store report for external access
        this.finalReport = report
        
        console.log('✅ Final report generated')
    }
    
    /**
     * Generate optimization recommendations
     */
    generateRecommendations() {
        let recommendations = ''
        
        // Performance recommendations
        if (this.profileResults) {
            const bestResult = this.profileResults.reduce((best, current) => 
                current.fps > best.fps ? current : best
            )
            
            if (bestResult.fps < 60) {
                recommendations += '- Consider reducing particle count for better performance\n'
            }
            
            if (bestResult.memoryUsage > 100 * 1024 * 1024) { // 100MB
                recommendations += '- Memory usage is high, consider enabling memory optimizations\n'
            }
        }
        
        // Browser compatibility recommendations
        if (this.browserCompatibility) {
            if (!this.browserCompatibility.memory) {
                recommendations += '- Memory API not available, performance monitoring will be limited\n'
            }
            
            if (!this.browserCompatibility.webgl) {
                recommendations += '- WebGL not supported, visual effects may be limited\n'
            }
        }
        
        // Aesthetic recommendations
        if (this.validationResults && !this.validationResults.passed) {
            recommendations += '- Some aesthetic requirements not met, review validation results\n'
        }
        
        if (recommendations === '') {
            recommendations = '- All systems optimal, no specific recommendations\n'
        }
        
        return recommendations
    }
    
    /**
     * Utility function to wait for specified duration
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
    
    /**
     * Get finalization status
     */
    getStatus() {
        return {
            complete: this.finalizationComplete,
            profileResults: this.profileResults,
            browserCompatibility: this.browserCompatibility,
            validationResults: this.validationResults,
            optimizationStatus: this.optimizationManager.getOptimizationStatus(),
            finalReport: this.finalReport
        }
    }
}

// Export the finalizer
export default FluxFinalizer