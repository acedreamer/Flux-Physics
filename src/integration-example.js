// Example integration of optimization and finalization systems
// This shows how to integrate the optimization manager and finalizer with the main FLUX application

import FluxFinalizer from './finalization.js'

/**
 * Example of how to integrate optimization and finalization with the main FLUX application
 * Add this code to your main.js file after the FluxApplication class is initialized
 */

// Example integration function
export async function integrateOptimizations(fluxApp) {
    console.log('🔧 Integrating optimization systems...')
    
    try {
        // Wait for application to be fully initialized
        await waitForInitialization(fluxApp)
        
        // Create and run finalizer
        const finalizer = new FluxFinalizer(fluxApp)
        await finalizer.finalize()
        
        // Store finalizer reference for later use
        fluxApp.finalizer = finalizer
        fluxApp.optimizationManager = finalizer.optimizationManager
        
        // Add optimization controls to window for debugging
        if (typeof window !== 'undefined') {
            window.fluxOptimization = {
                manager: finalizer.optimizationManager,
                finalizer: finalizer,
                
                // Utility functions for debugging
                validateAesthetics: () => finalizer.optimizationManager.validateAesthetics(),
                generateReport: () => finalizer.optimizationManager.generateOptimizationReport(),
                togglePerformanceMode: () => finalizer.optimizationManager.toggleOptimization('performanceMode', !finalizer.optimizationManager.optimizationState.performanceModeEnabled),
                getStatus: () => finalizer.getStatus()
            }
            
            console.log('🛠️  Optimization controls available at window.fluxOptimization')
        }
        
        console.log('✅ Optimization integration completed successfully')
        
    } catch (error) {
        console.error('❌ Optimization integration failed:', error)
        // Continue without optimizations
    }
}

/**
 * Wait for FLUX application to be fully initialized
 */
function waitForInitialization(fluxApp, maxWaitTime = 10000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now()
        
        const checkInitialization = () => {
            if (fluxApp.pixiApp && fluxApp.particleRenderer && fluxApp.solver) {
                resolve()
            } else if (Date.now() - startTime > maxWaitTime) {
                reject(new Error('Application initialization timeout'))
            } else {
                setTimeout(checkInitialization, 100)
            }
        }
        
        checkInitialization()
    })
}

/**
 * Example usage in main.js:
 * 
 * import { integrateOptimizations } from './integration-example.js'
 * 
 * // After creating FluxApplication instance
 * const app = new FluxApplication()
 * await app.init()
 * 
 * // Integrate optimizations
 * await integrateOptimizations(app)
 * 
 * // Now the application has full optimization support
 */

// Console commands for manual testing
export const optimizationCommands = {
    // Run aesthetic validation
    validate: () => {
        if (window.fluxOptimization) {
            return window.fluxOptimization.validateAesthetics()
        } else {
            console.warn('Optimization system not initialized')
        }
    },
    
    // Generate optimization report
    report: () => {
        if (window.fluxOptimization) {
            console.log(window.fluxOptimization.generateReport())
        } else {
            console.warn('Optimization system not initialized')
        }
    },
    
    // Toggle performance mode
    performance: () => {
        if (window.fluxOptimization) {
            window.fluxOptimization.togglePerformanceMode()
        } else {
            console.warn('Optimization system not initialized')
        }
    },
    
    // Get full status
    status: () => {
        if (window.fluxOptimization) {
            return window.fluxOptimization.getStatus()
        } else {
            console.warn('Optimization system not initialized')
        }
    }
}

// Make commands available globally for debugging
if (typeof window !== 'undefined') {
    window.fluxCommands = optimizationCommands
    console.log('🛠️  Debug commands available at window.fluxCommands')
    console.log('   - fluxCommands.validate() - Run aesthetic validation')
    console.log('   - fluxCommands.report() - Generate optimization report')
    console.log('   - fluxCommands.performance() - Toggle performance mode')
    console.log('   - fluxCommands.status() - Get full optimization status')
}