/**
 * Performance Optimization Demo
 * Demonstrates the audio performance optimization system in action
 */

import { AudioPerformanceMonitor } from '../core/audio-performance-monitor.js'
import { FFTOptimizer } from '../core/fft-optimizer.js'
import { AudioPerformanceBenchmarks } from '../core/audio-performance-benchmarks.js'

/**
 * Demo: Performance Monitoring
 */
async function demoPerformanceMonitoring() {
    console.log('=== Performance Monitoring Demo ===')
    
    const monitor = new AudioPerformanceMonitor({
        targetAnalysisTime: 2,
        maxAnalysisTime: 5,
        adaptiveQualityEnabled: true
    })
    
    // Set up callbacks
    monitor.setCallbacks({
        onPerformanceWarning: (warning) => {
            console.log(`⚠️  Performance warning: ${warning.category} took ${warning.analysisTime.toFixed(2)}ms`)
        },
        onQualityReduction: (reduction) => {
            console.log(`📉 Quality reduced to ${(reduction.newLevel * 100).toFixed(1)}%`)
        },
        onQualityRestoration: (restoration) => {
            console.log(`📈 Quality restored to ${(restoration.newLevel * 100).toFixed(1)}%`)
        }
    })
    
    monitor.start()
    
    // Simulate audio processing with varying performance
    console.log('Simulating audio processing...')
    
    for (let i = 0; i < 20; i++) {
        const simulatedProcessingTime = Math.random() * 8 // 0-8ms
        
        monitor.measureAnalysis(() => {
            // Simulate processing work
            const start = performance.now()
            while (performance.now() - start < simulatedProcessingTime) {
                // Busy wait to simulate processing
            }
            return { processed: true }
        }, 'audioAnalysis')
        
        // Small delay between measurements
        await new Promise(resolve => setTimeout(resolve, 16)) // ~60fps
    }
    
    const stats = monitor.getPerformanceStats()
    console.log('Final performance stats:', {
        averageTime: stats.stats.averageAnalysisTime.toFixed(2) + 'ms',
        maxTime: stats.stats.maxAnalysisTime.toFixed(2) + 'ms',
        warnings: stats.stats.performanceWarnings,
        qualityLevel: (stats.qualityLevel * 100).toFixed(1) + '%'
    })
    
    monitor.dispose()
}

/**
 * Demo: FFT Optimization
 */
function demoFFTOptimization() {
    console.log('\n=== FFT Optimization Demo ===')
    
    const optimizer = new FFTOptimizer({
        fftSize: 2048,
        sampleRate: 44100
    })
    
    // Generate test frequency data
    const testData = new Uint8Array(1024)
    for (let i = 0; i < testData.length; i++) {
        // Simulate typical music spectrum
        if (i < 50) { // Bass
            testData[i] = Math.floor(200 + 55 * Math.random())
        } else if (i < 400) { // Mids
            testData[i] = Math.floor(100 + 100 * Math.random())
        } else { // Treble
            testData[i] = Math.floor(50 * Math.random())
        }
    }
    
    console.log('Testing optimized frequency analysis...')
    
    // Test with optimizations enabled
    const startTime1 = performance.now()
    for (let i = 0; i < 1000; i++) {
        optimizer.calculateOptimizedFrequencyRange(testData, 'bass')
        optimizer.calculateOptimizedFrequencyRange(testData, 'mids')
        optimizer.calculateOptimizedFrequencyRange(testData, 'treble')
    }
    const optimizedTime = performance.now() - startTime1
    
    // Test batch processing
    const startTime2 = performance.now()
    for (let i = 0; i < 1000; i++) {
        optimizer.batchProcessFrequencyRanges(testData, ['bass', 'mids', 'treble'])
    }
    const batchTime = performance.now() - startTime2
    
    console.log('Performance comparison:')
    console.log(`Individual calls: ${optimizedTime.toFixed(2)}ms`)
    console.log(`Batch processing: ${batchTime.toFixed(2)}ms`)
    console.log(`Batch improvement: ${((optimizedTime - batchTime) / optimizedTime * 100).toFixed(1)}%`)
    
    // Test spectral features
    const spectralFeatures = optimizer.calculateSpectralFeatures(testData)
    console.log('Spectral features calculated:', {
        centroid: spectralFeatures.spectralCentroid.toFixed(3),
        rolloff: spectralFeatures.spectralRolloff.toFixed(3),
        flatness: spectralFeatures.spectralFlatness.toFixed(3),
        brightness: spectralFeatures.brightness.toFixed(3)
    })
    
    const optimizerStats = optimizer.getPerformanceStats()
    console.log('FFT Optimizer stats:', {
        totalOptimizations: optimizerStats.totalOptimizations,
        binningTime: optimizerStats.binningTime.toFixed(2) + 'ms',
        calculationTime: optimizerStats.calculationTime.toFixed(2) + 'ms'
    })
    
    optimizer.dispose()
}

/**
 * Demo: Performance Benchmarking
 */
async function demoBenchmarking() {
    console.log('\n=== Performance Benchmarking Demo ===')
    
    const benchmarks = new AudioPerformanceBenchmarks({
        benchmarkDuration: 2000, // 2 seconds for demo
        testIterations: 50
    })
    
    console.log('Running FFT optimizer benchmark...')
    const fftResults = await benchmarks.benchmarkFFTOptimizer()
    
    console.log('Benchmark results:')
    for (const [config, results] of Object.entries(fftResults)) {
        console.log(`${config}:`)
        for (const [optimization, stats] of Object.entries(results)) {
            if (stats.mean) {
                console.log(`  ${optimization}: ${stats.mean.toFixed(2)}ms (${stats.performanceGrade})`)
            }
        }
    }
    
    // Generate recommendations
    benchmarks.generateBenchmarkSummary()
    const summary = benchmarks.results.summary
    
    if (summary.recommendations.length > 0) {
        console.log('\nRecommendations:')
        summary.recommendations.forEach(rec => console.log(`• ${rec}`))
    }
    
    benchmarks.clearResults()
}

/**
 * Demo: Adaptive Quality System
 */
async function demoAdaptiveQuality() {
    console.log('\n=== Adaptive Quality System Demo ===')
    
    const monitor = new AudioPerformanceMonitor({
        targetAnalysisTime: 2,
        maxAnalysisTime: 4,
        adaptiveQualityEnabled: true
    })
    
    let qualityChanges = 0
    monitor.setCallbacks({
        onQualityReduction: (reduction) => {
            qualityChanges++
            console.log(`Quality reduced to ${(reduction.newLevel * 100).toFixed(1)}% (change #${qualityChanges})`)
        },
        onQualityRestoration: (restoration) => {
            qualityChanges++
            console.log(`Quality restored to ${(restoration.newLevel * 100).toFixed(1)}% (change #${qualityChanges})`)
        }
    })
    
    monitor.start()
    
    console.log('Simulating performance degradation...')
    
    // Phase 1: Good performance
    for (let i = 0; i < 10; i++) {
        monitor.measureAnalysis(() => {
            const start = performance.now()
            while (performance.now() - start < 1) {} // 1ms - good performance
            return { result: 'good' }
        }, 'test')
    }
    
    console.log(`Initial quality level: ${(monitor.getCurrentQualityLevel() * 100).toFixed(1)}%`)
    
    // Phase 2: Poor performance to trigger reduction
    for (let i = 0; i < 15; i++) {
        monitor.measureAnalysis(() => {
            const start = performance.now()
            while (performance.now() - start < 6) {} // 6ms - poor performance
            return { result: 'poor' }
        }, 'test')
        
        // Check if quality should be reduced
        if (monitor.shouldReduceQuality()) {
            monitor.reduceQuality()
        }
    }
    
    console.log(`After degradation: ${(monitor.getCurrentQualityLevel() * 100).toFixed(1)}%`)
    
    // Phase 3: Good performance to trigger restoration
    for (let i = 0; i < 25; i++) {
        monitor.measureAnalysis(() => {
            const start = performance.now()
            while (performance.now() - start < 1) {} // 1ms - good performance again
            return { result: 'restored' }
        }, 'test')
        
        // Try to restore quality
        monitor.restoreQuality()
    }
    
    console.log(`After restoration: ${(monitor.getCurrentQualityLevel() * 100).toFixed(1)}%`)
    console.log(`Total quality changes: ${qualityChanges}`)
    
    monitor.dispose()
}

/**
 * Run all demos
 */
async function runAllDemos() {
    console.log('🎵 FLUX Audio Performance Optimization Demo\n')
    
    try {
        await demoPerformanceMonitoring()
        demoFFTOptimization()
        await demoBenchmarking()
        await demoAdaptiveQuality()
        
        console.log('\n✅ All demos completed successfully!')
        console.log('\nThe performance optimization system provides:')
        console.log('• Real-time performance monitoring')
        console.log('• Adaptive quality scaling')
        console.log('• Optimized FFT processing')
        console.log('• Comprehensive benchmarking')
        console.log('• Automatic bottleneck detection')
        
    } catch (error) {
        console.error('❌ Demo failed:', error)
    }
}

// Export for use in other modules
export {
    demoPerformanceMonitoring,
    demoFFTOptimization,
    demoBenchmarking,
    demoAdaptiveQuality,
    runAllDemos
}

// Run demos if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllDemos()
}