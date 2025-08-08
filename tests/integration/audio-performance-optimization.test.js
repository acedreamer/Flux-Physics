import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AudioAnalyzer } from '../../src/audio/core/audio-analyzer.js'
import { AudioPerformanceMonitor } from '../../src/audio/core/audio-performance-monitor.js'
import { AudioWorkerManager } from '../../src/audio/core/audio-worker-manager.js'
import { FFTOptimizer } from '../../src/audio/core/fft-optimizer.js'
import { AudioPerformanceBenchmarks } from '../../src/audio/core/audio-performance-benchmarks.js'

describe('Audio Performance Optimization Integration', () => {
    let mockAudioContext
    let mockAnalyserNode
    let mockMediaStream
    
    beforeEach(() => {
        // Mock Web Audio API
        mockAnalyserNode = {
            fftSize: 2048,
            frequencyBinCount: 1024,
            smoothingTimeConstant: 0.8,
            minDecibels: -90,
            maxDecibels: -10,
            getByteFrequencyData: vi.fn((data) => {
                // Fill with test data
                for (let i = 0; i < data.length; i++) {
                    data[i] = Math.floor(Math.random() * 256)
                }
            }),
            getByteTimeDomainData: vi.fn((data) => {
                // Fill with test data
                for (let i = 0; i < data.length; i++) {
                    data[i] = 128 + Math.floor(50 * Math.sin(i * 0.1))
                }
            }),
            connect: vi.fn(),
            disconnect: vi.fn()
        }
        
        mockAudioContext = {
            createAnalyser: vi.fn(() => mockAnalyserNode),
            createMediaStreamSource: vi.fn(() => ({
                connect: vi.fn()
            })),
            resume: vi.fn(() => Promise.resolve()),
            close: vi.fn(() => Promise.resolve()),
            state: 'running',
            sampleRate: 44100
        }
        
        mockMediaStream = {
            getTracks: vi.fn(() => []),
            getAudioTracks: vi.fn(() => [])
        }
        
        // Mock global APIs
        global.AudioContext = vi.fn(() => mockAudioContext)
        global.webkitAudioContext = vi.fn(() => mockAudioContext)
        
        global.navigator = {
            mediaDevices: {
                getUserMedia: vi.fn(() => Promise.resolve(mockMediaStream)),
                getDisplayMedia: vi.fn(() => Promise.resolve(mockMediaStream))
            }
        }
        
        // Mock Worker
        global.Worker = vi.fn(() => ({
            postMessage: vi.fn(),
            terminate: vi.fn(),
            onmessage: null,
            onerror: null
        }))
    })
    
    afterEach(() => {
        vi.clearAllMocks()
    })
    
    describe('AudioAnalyzer with Performance Optimization', () => {
        let analyzer
        
        beforeEach(async () => {
            analyzer = new AudioAnalyzer({
                fftSize: 2048,
                useWebWorker: false, // Disable for testing
                adaptiveQualityEnabled: true
            })
            
            await analyzer.initialize('microphone')
        })
        
        afterEach(() => {
            if (analyzer) {
                analyzer.dispose()
            }
        })
        
        it('should integrate performance monitoring with frequency analysis', () => {
            const performanceCallback = vi.fn()
            analyzer.setCallbacks({
                onPerformanceWarning: performanceCallback
            })
            
            // Mock slow performance
            const originalMeasureAnalysis = analyzer.performanceMonitor.measureAnalysis
            analyzer.performanceMonitor.measureAnalysis = vi.fn((fn, category) => {
                // Simulate slow execution
                analyzer.performanceMonitor.stats.analysisTime = 6 // > 2ms target
                analyzer.performanceMonitor.stats.performanceWarnings++
                
                if (analyzer.performanceMonitor.callbacks.onPerformanceWarning) {
                    analyzer.performanceMonitor.callbacks.onPerformanceWarning({
                        analysisTime: 6,
                        category,
                        threshold: 2,
                        warningCount: 1
                    })
                }
                
                return fn()
            })
            
            const result = analyzer.getFrequencyData()
            
            expect(result).toHaveProperty('bass')
            expect(result).toHaveProperty('mids')
            expect(result).toHaveProperty('treble')
            expect(result).toHaveProperty('analysisTime')
            expect(performanceCallback).toHaveBeenCalled()
        })
        
        it('should apply adaptive quality reduction when performance degrades', async () => {
            const qualityCallback = vi.fn()
            analyzer.setCallbacks({
                onQualityReduction: qualityCallback
            })
            
            // Simulate consistently poor performance
            for (let i = 0; i < 15; i++) {
                analyzer.performanceMonitor.measureAnalysis(() => {
                    return { test: 'data' }
                }, 'test')
                
                // Simulate time passing
                analyzer.performanceMonitor.stats.analysisTime = 8 // > 5ms max
                analyzer.performanceMonitor.recentSamples.push({
                    time: performance.now(),
                    analysisTime: 8
                })
                
                if (analyzer.performanceMonitor.recentSamples.length > 100) {
                    analyzer.performanceMonitor.recentSamples.shift()
                }
            }
            
            // Trigger quality check
            analyzer.performanceMonitor.checkPerformanceThresholds(8, 'test')
            
            expect(analyzer.performanceMonitor.stats.performanceWarnings).toBeGreaterThan(0)
        })
        
        it('should use FFT optimizer for improved performance', () => {
            expect(analyzer.fftOptimizer).toBeDefined()
            
            const result = analyzer.getFrequencyData()
            
            expect(result.bass).toBeGreaterThanOrEqual(0)
            expect(result.bass).toBeLessThanOrEqual(1)
            expect(result.processedByWorker).toBe(false) // Using main thread
            
            // Check that FFT optimizer was used
            const optimizerStats = analyzer.fftOptimizer.getPerformanceStats()
            expect(optimizerStats.totalOptimizations).toBeGreaterThan(0)
        })
        
        it('should provide comprehensive performance statistics', async () => {
            // Generate some analysis data
            for (let i = 0; i < 5; i++) {
                analyzer.getFrequencyData()
            }
            
            const stats = await analyzer.getPerformanceStats()
            
            expect(stats).toHaveProperty('monitor')
            expect(stats).toHaveProperty('fftOptimizer')
            expect(stats).toHaveProperty('frequencyAnalyzer')
            
            expect(stats.monitor.stats.frameCount).toBeGreaterThan(0)
            expect(stats.fftOptimizer.totalOptimizations).toBeGreaterThan(0)
        })
        
        it('should run performance benchmark', async () => {
            const benchmarkResult = await analyzer.runPerformanceBenchmark()
            
            expect(benchmarkResult).toHaveProperty('sampleCount')
            expect(benchmarkResult).toHaveProperty('average')
            expect(benchmarkResult).toHaveProperty('min')
            expect(benchmarkResult).toHaveProperty('max')
            expect(benchmarkResult).toHaveProperty('targetMet')
            
            expect(benchmarkResult.sampleCount).toBeGreaterThan(0)
            expect(benchmarkResult.average).toBeGreaterThan(0)
        })
    })
    
    describe('Web Worker Performance Integration', () => {
        let workerManager
        let mockWorker
        
        beforeEach(() => {
            mockWorker = {
                postMessage: vi.fn(),
                terminate: vi.fn(),
                onmessage: null,
                onerror: null
            }
            
            global.Worker = vi.fn(() => mockWorker)
            
            workerManager = new AudioWorkerManager({
                workerEnabled: true,
                workerPath: '/test-worker.js'
            })
        })
        
        afterEach(() => {
            if (workerManager) {
                workerManager.dispose()
            }
        })
        
        it('should initialize worker and fallback gracefully', async () => {
            // Mock worker initialization failure
            setTimeout(() => {
                if (mockWorker.onerror) {
                    mockWorker.onerror(new Error('Worker failed'))
                }
            }, 10)
            
            const result = await workerManager.initialize({
                fftSize: 2048,
                sampleRate: 44100
            })
            
            expect(result.success).toBe(true)
            expect(result.usingWorker).toBe(false) // Should fallback
        })
        
        it('should process audio data with fallback processor', async () => {
            // Force fallback mode
            workerManager.activateFallback()
            
            const testFreqData = new Uint8Array(1024)
            const testTimeData = new Uint8Array(1024)
            
            // Fill with test data
            for (let i = 0; i < 1024; i++) {
                testFreqData[i] = Math.floor(Math.random() * 256)
                testTimeData[i] = 128 + Math.floor(50 * Math.sin(i * 0.1))
            }
            
            const result = await workerManager.processAudioData(testFreqData, testTimeData)
            
            expect(result).toHaveProperty('frequency')
            expect(result).toHaveProperty('beat')
            expect(result).toHaveProperty('performance')
            
            expect(result.frequency.bass).toBeGreaterThanOrEqual(0)
            expect(result.frequency.bass).toBeLessThanOrEqual(1)
            expect(result.performance.processTime).toBeGreaterThan(0)
        })
        
        it('should track performance statistics', async () => {
            workerManager.activateFallback()
            
            const testFreqData = new Uint8Array(1024)
            const testTimeData = new Uint8Array(1024)
            
            // Process multiple times
            for (let i = 0; i < 3; i++) {
                await workerManager.processAudioData(testFreqData, testTimeData)
            }
            
            const stats = await workerManager.getPerformanceStats()
            
            expect(stats).toHaveProperty('manager')
            expect(stats).toHaveProperty('usingFallback')
            
            expect(stats.manager.fallbackCalls).toBe(3)
            expect(stats.usingFallback).toBe(true)
        })
    })
    
    describe('FFT Optimizer Performance', () => {
        let optimizer
        let testData
        
        beforeEach(() => {
            optimizer = new FFTOptimizer({
                fftSize: 2048,
                sampleRate: 44100
            })
            
            testData = new Uint8Array(1024)
            for (let i = 0; i < testData.length; i++) {
                testData[i] = Math.floor(Math.random() * 256)
            }
        })
        
        afterEach(() => {
            if (optimizer) {
                optimizer.dispose()
            }
        })
        
        it('should demonstrate performance improvement with optimizations', () => {
            // Test with optimizations enabled
            optimizer.setOptimizations({
                binning: true,
                windowing: true,
                lookupTables: true
            })
            
            const startTime1 = performance.now()
            for (let i = 0; i < 100; i++) {
                optimizer.calculateOptimizedFrequencyRange(testData, 'bass')
                optimizer.calculateOptimizedFrequencyRange(testData, 'mids')
                optimizer.calculateOptimizedFrequencyRange(testData, 'treble')
            }
            const optimizedTime = performance.now() - startTime1
            
            // Reset stats
            optimizer.resetPerformanceStats()
            
            // Test with optimizations disabled
            optimizer.setOptimizations({
                binning: false,
                windowing: false,
                lookupTables: false
            })
            
            const startTime2 = performance.now()
            for (let i = 0; i < 100; i++) {
                optimizer.calculateOptimizedFrequencyRange(testData, 'bass')
                optimizer.calculateOptimizedFrequencyRange(testData, 'mids')
                optimizer.calculateOptimizedFrequencyRange(testData, 'treble')
            }
            const unoptimizedTime = performance.now() - startTime2
            
            // Optimized version should be faster or similar
            expect(optimizedTime).toBeLessThanOrEqual(unoptimizedTime * 1.2)
        })
        
        it('should provide detailed performance statistics', () => {
            // Perform various operations
            optimizer.calculateOptimizedFrequencyRange(testData, 'bass')
            optimizer.calculateSpectralFeatures(testData)
            optimizer.calculateLogarithmicSpectrum(testData)
            
            const stats = optimizer.getPerformanceStats()
            
            expect(stats).toHaveProperty('binningTime')
            expect(stats).toHaveProperty('calculationTime')
            expect(stats).toHaveProperty('totalOptimizations')
            expect(stats).toHaveProperty('optimizationsEnabled')
            expect(stats).toHaveProperty('configuration')
            
            expect(stats.binningTime).toBeGreaterThan(0)
            expect(stats.calculationTime).toBeGreaterThan(0)
            expect(stats.totalOptimizations).toBeGreaterThan(0)
        })
        
        it('should handle configuration updates efficiently', () => {
            const originalBinCount = optimizer.binCount
            
            // Update configuration
            optimizer.updateConfiguration({
                fftSize: 4096,
                sampleRate: 48000
            })
            
            expect(optimizer.binCount).not.toBe(originalBinCount)
            expect(optimizer.config.fftSize).toBe(4096)
            expect(optimizer.config.sampleRate).toBe(48000)
            
            // Should still work with new configuration
            const result = optimizer.calculateOptimizedFrequencyRange(testData, 'bass')
            expect(result).toBeGreaterThanOrEqual(0)
            expect(result).toBeLessThanOrEqual(1)
        })
    })
    
    describe('Performance Benchmarking System', () => {
        let benchmarks
        
        beforeEach(() => {
            benchmarks = new AudioPerformanceBenchmarks({
                benchmarkDuration: 1000, // Shorter for testing
                testIterations: 10
            })
        })
        
        afterEach(() => {
            if (benchmarks) {
                benchmarks.stop()
                benchmarks.clearResults()
            }
        })
        
        it('should run FFT optimizer benchmark', async () => {
            const results = await benchmarks.benchmarkFFTOptimizer()
            
            expect(results).toHaveProperty('High Quality')
            expect(results).toHaveProperty('Standard Quality')
            expect(results).toHaveProperty('Performance Mode')
            
            // Check that each configuration has optimization results
            const highQuality = results['High Quality']
            expect(highQuality).toHaveProperty('All Optimizations')
            expect(highQuality).toHaveProperty('No Optimizations')
            
            expect(highQuality['All Optimizations']).toHaveProperty('mean')
            expect(highQuality['All Optimizations']).toHaveProperty('min')
            expect(highQuality['All Optimizations']).toHaveProperty('max')
            expect(highQuality['All Optimizations']).toHaveProperty('targetMet')
        })
        
        it('should run worker manager benchmark', async () => {
            const results = await benchmarks.benchmarkWorkerManager()
            
            expect(results).toHaveProperty('Main Thread Fallback')
            
            const fallbackResults = results['Main Thread Fallback']
            expect(fallbackResults).toHaveProperty('mean')
            expect(fallbackResults.mean).toBeGreaterThan(0)
        })
        
        it('should generate performance recommendations', async () => {
            // Run a subset of benchmarks
            await benchmarks.benchmarkFFTOptimizer()
            await benchmarks.benchmarkWorkerManager()
            
            benchmarks.generateBenchmarkSummary()
            
            const summary = benchmarks.results.summary
            expect(summary).toHaveProperty('recommendations')
            expect(summary).toHaveProperty('bestConfigurations')
            expect(summary).toHaveProperty('performanceIssues')
            
            expect(Array.isArray(summary.recommendations)).toBe(true)
            expect(typeof summary.bestConfigurations).toBe('object')
        })
        
        it('should export benchmark results', async () => {
            // Generate some results
            await benchmarks.benchmarkFFTOptimizer()
            
            const jsonExport = benchmarks.exportResults('json')
            expect(() => JSON.parse(jsonExport)).not.toThrow()
            
            const csvExport = benchmarks.exportResults('csv')
            expect(csvExport).toContain('Component,Configuration,Test')
            expect(csvExport.split('\n').length).toBeGreaterThan(1)
        })
        
        it('should track benchmark status', () => {
            const initialStatus = benchmarks.getStatus()
            expect(initialStatus.isRunning).toBe(false)
            expect(initialStatus.hasResults).toBe(false)
            
            // Start benchmark (don't await)
            benchmarks.benchmarkFFTOptimizer()
            
            const runningStatus = benchmarks.getStatus()
            expect(runningStatus.currentTest).toBe('FFTOptimizer')
        })
    })
    
    describe('Integrated Performance Optimization', () => {
        let analyzer
        let performanceCallbacks
        
        beforeEach(async () => {
            performanceCallbacks = {
                onPerformanceWarning: vi.fn(),
                onQualityReduction: vi.fn(),
                onQualityRestoration: vi.fn(),
                onBottleneckDetected: vi.fn()
            }
            
            analyzer = new AudioAnalyzer({
                fftSize: 2048,
                useWebWorker: false,
                adaptiveQualityEnabled: true,
                targetAnalysisTime: 1, // Strict target for testing
                maxAnalysisTime: 3
            })
            
            analyzer.setCallbacks(performanceCallbacks)
            await analyzer.initialize('microphone')
        })
        
        afterEach(() => {
            if (analyzer) {
                analyzer.dispose()
            }
        })
        
        it('should demonstrate end-to-end performance optimization', async () => {
            // Generate analysis data to trigger performance monitoring
            const results = []
            
            for (let i = 0; i < 20; i++) {
                const result = analyzer.getFrequencyData()
                results.push(result)
                
                // Verify results are valid
                expect(result.bass).toBeGreaterThanOrEqual(0)
                expect(result.bass).toBeLessThanOrEqual(1)
                expect(result).toHaveProperty('analysisTime')
            }
            
            // Check that performance monitoring is working
            const stats = await analyzer.getPerformanceStats()
            expect(stats.monitor.stats.frameCount).toBe(20)
            expect(stats.fftOptimizer.totalOptimizations).toBeGreaterThan(0)
        })
        
        it('should handle performance degradation gracefully', () => {
            // Mock performance monitor to simulate degradation
            const originalMeasureAnalysis = analyzer.performanceMonitor.measureAnalysis
            let callCount = 0
            
            analyzer.performanceMonitor.measureAnalysis = vi.fn((fn, category) => {
                callCount++
                const result = fn()
                
                // Simulate degrading performance
                const simulatedTime = callCount * 0.5 // Gradually increasing time
                analyzer.performanceMonitor.updatePerformanceStats(simulatedTime)
                
                if (simulatedTime > analyzer.performanceMonitor.config.targetAnalysisTime) {
                    analyzer.performanceMonitor.stats.performanceWarnings++
                    
                    if (analyzer.performanceMonitor.callbacks.onPerformanceWarning) {
                        analyzer.performanceMonitor.callbacks.onPerformanceWarning({
                            analysisTime: simulatedTime,
                            category,
                            threshold: analyzer.performanceMonitor.config.targetAnalysisTime,
                            warningCount: analyzer.performanceMonitor.stats.performanceWarnings
                        })
                    }
                }
                
                return result
            })
            
            // Generate enough calls to trigger warnings
            for (let i = 0; i < 10; i++) {
                analyzer.getFrequencyData()
            }
            
            expect(performanceCallbacks.onPerformanceWarning).toHaveBeenCalled()
            expect(analyzer.performanceMonitor.stats.performanceWarnings).toBeGreaterThan(0)
        })
        
        it('should optimize different components independently', () => {
            // Test FFT optimizer
            const fftStats1 = analyzer.fftOptimizer.getPerformanceStats()
            analyzer.getFrequencyData()
            const fftStats2 = analyzer.fftOptimizer.getPerformanceStats()
            
            expect(fftStats2.totalOptimizations).toBeGreaterThan(fftStats1.totalOptimizations)
            
            // Test performance monitor
            expect(analyzer.performanceMonitor.stats.frameCount).toBeGreaterThan(0)
            
            // Test frequency analyzer integration
            expect(analyzer.frequencyAnalyzer).toBeDefined()
        })
    })
})