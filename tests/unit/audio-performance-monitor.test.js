import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AudioPerformanceMonitor } from '../../src/audio/core/audio-performance-monitor.js'

describe('AudioPerformanceMonitor', () => {
    let monitor
    let mockPerformance
    
    beforeEach(() => {
        // Mock performance.now()
        mockPerformance = vi.spyOn(performance, 'now')
        mockPerformance.mockReturnValue(1000)
        
        monitor = new AudioPerformanceMonitor({
            targetAnalysisTime: 2,
            maxAnalysisTime: 5,
            adaptiveQualityEnabled: true
        })
    })
    
    afterEach(() => {
        if (monitor) {
            monitor.dispose()
        }
        mockPerformance.mockRestore()
    })
    
    describe('initialization', () => {
        it('should initialize with default configuration', () => {
            const defaultMonitor = new AudioPerformanceMonitor()
            
            expect(defaultMonitor.config.targetAnalysisTime).toBe(2)
            expect(defaultMonitor.config.maxAnalysisTime).toBe(5)
            expect(defaultMonitor.config.adaptiveQualityEnabled).toBe(true)
        })
        
        it('should initialize with custom configuration', () => {
            const customMonitor = new AudioPerformanceMonitor({
                targetAnalysisTime: 1,
                maxAnalysisTime: 3,
                adaptiveQualityEnabled: false
            })
            
            expect(customMonitor.config.targetAnalysisTime).toBe(1)
            expect(customMonitor.config.maxAnalysisTime).toBe(3)
            expect(customMonitor.config.adaptiveQualityEnabled).toBe(false)
            
            customMonitor.dispose()
        })
    })
    
    describe('performance measurement', () => {
        it('should measure analysis function execution time', () => {
            let callCount = 0
            const testFunction = () => {
                callCount++
                return 'test result'
            }
            
            // Mock time progression
            mockPerformance
                .mockReturnValueOnce(1000) // Start time
                .mockReturnValueOnce(1002) // End time (2ms)
            
            const result = monitor.measureAnalysis(testFunction, 'test')
            
            expect(result).toBe('test result')
            expect(callCount).toBe(1)
            expect(monitor.stats.analysisTime).toBe(2)
            expect(monitor.stats.frameCount).toBe(1)
        })
        
        it('should track performance statistics', () => {
            const testFunction = () => 'result'
            
            // Simulate multiple measurements
            const times = [1, 2, 3, 4, 5]
            times.forEach((time, index) => {
                mockPerformance
                    .mockReturnValueOnce(1000) // Start
                    .mockReturnValueOnce(1000 + time) // End
                
                monitor.measureAnalysis(testFunction, 'test')
            })
            
            expect(monitor.stats.frameCount).toBe(5)
            expect(monitor.stats.minAnalysisTime).toBe(1)
            expect(monitor.stats.maxAnalysisTime).toBe(5)
            expect(monitor.stats.averageAnalysisTime).toBeCloseTo(3, 1)
        })
        
        it('should handle function errors gracefully', () => {
            const errorFunction = () => {
                throw new Error('Test error')
            }
            
            expect(() => {
                monitor.measureAnalysis(errorFunction, 'test')
            }).toThrow('Test error')
        })
    })
    
    describe('performance warnings', () => {
        it('should trigger warning callback for slow analysis', () => {
            const warningCallback = vi.fn()
            monitor.setCallbacks({ onPerformanceWarning: warningCallback })
            
            const slowFunction = () => 'result'
            
            // Simulate slow execution (6ms > 2ms target)
            mockPerformance
                .mockReturnValueOnce(1000)
                .mockReturnValueOnce(1006)
            
            monitor.measureAnalysis(slowFunction, 'slowTest')
            
            expect(warningCallback).toHaveBeenCalledWith({
                analysisTime: 6,
                category: 'slowTest',
                threshold: 2,
                warningCount: 1
            })
        })
        
        it('should track warning count', () => {
            const slowFunction = () => 'result'
            
            // Trigger multiple warnings
            for (let i = 0; i < 3; i++) {
                mockPerformance
                    .mockReturnValueOnce(1000)
                    .mockReturnValueOnce(1006) // 6ms
                
                monitor.measureAnalysis(slowFunction, 'test')
            }
            
            expect(monitor.stats.performanceWarnings).toBe(3)
        })
    })
    
    describe('adaptive quality reduction', () => {
        it('should reduce quality when performance is consistently poor', () => {
            const qualityCallback = vi.fn()
            monitor.setCallbacks({ onQualityReduction: qualityCallback })
            
            const slowFunction = () => 'result'
            
            // Simulate consistently poor performance
            for (let i = 0; i < 10; i++) {
                mockPerformance
                    .mockReturnValueOnce(1000)
                    .mockReturnValueOnce(1008) // 8ms > 5ms max
                
                monitor.measureAnalysis(slowFunction, 'test')
            }
            
            expect(qualityCallback).toHaveBeenCalled()
            expect(monitor.stats.adaptiveReductions).toBeGreaterThan(0)
        })
        
        it('should not reduce quality too frequently', () => {
            const qualityCallback = vi.fn()
            monitor.setCallbacks({ onQualityReduction: qualityCallback })
            
            const slowFunction = () => 'result'
            
            // First reduction
            for (let i = 0; i < 10; i++) {
                mockPerformance
                    .mockReturnValueOnce(1000)
                    .mockReturnValueOnce(1008)
                
                monitor.measureAnalysis(slowFunction, 'test')
            }
            
            const firstCallCount = qualityCallback.mock.calls.length
            
            // Immediate second attempt (should be blocked by rate limiting)
            for (let i = 0; i < 10; i++) {
                mockPerformance
                    .mockReturnValueOnce(1000)
                    .mockReturnValueOnce(1008)
                
                monitor.measureAnalysis(slowFunction, 'test')
            }
            
            expect(qualityCallback.mock.calls.length).toBe(firstCallCount)
        })
        
        it('should restore quality when performance improves', () => {
            const restorationCallback = vi.fn()
            monitor.setCallbacks({ onQualityRestoration: restorationCallback })
            
            const testFunction = () => 'result'
            
            // First, reduce quality with poor performance
            for (let i = 0; i < 10; i++) {
                mockPerformance
                    .mockReturnValueOnce(1000)
                    .mockReturnValueOnce(1008)
                
                monitor.measureAnalysis(testFunction, 'test')
            }
            
            // Then show good performance
            for (let i = 0; i < 25; i++) {
                mockPerformance
                    .mockReturnValueOnce(1000)
                    .mockReturnValueOnce(1001) // 1ms < 2ms target
                
                monitor.measureAnalysis(testFunction, 'test')
                
                // Try to restore quality
                monitor.restoreQuality()
            }
            
            expect(restorationCallback).toHaveBeenCalled()
        })
    })
    
    describe('quality level calculation', () => {
        it('should calculate quality level correctly', () => {
            const initialLevel = monitor.getCurrentQualityLevel()
            expect(initialLevel).toBe(1.0) // Full quality initially
            
            // Reduce quality
            monitor.reduceQuality()
            const reducedLevel = monitor.getCurrentQualityLevel()
            expect(reducedLevel).toBeLessThan(1.0)
            
            // Further reduction
            monitor.reduceQuality()
            const furtherReducedLevel = monitor.getCurrentQualityLevel()
            expect(furtherReducedLevel).toBeLessThan(reducedLevel)
        })
        
        it('should not reduce quality below minimum level', () => {
            // Reduce quality multiple times
            for (let i = 0; i < 10; i++) {
                monitor.reduceQuality()
            }
            
            const finalLevel = monitor.getCurrentQualityLevel()
            expect(finalLevel).toBeGreaterThan(0.1) // Should not go too low
        })
    })
    
    describe('bottleneck detection', () => {
        it('should detect bottlenecks in specific categories', () => {
            const bottleneckCallback = vi.fn()
            monitor.setCallbacks({ onBottleneckDetected: bottleneckCallback })
            
            const slowFunction = () => 'result'
            
            // Simulate bottleneck in specific category
            mockPerformance
                .mockReturnValueOnce(1000)
                .mockReturnValueOnce(1007) // 7ms > 3.5ms bottleneck threshold
            
            monitor.measureAnalysis(slowFunction, 'fftProcessing')
            
            expect(bottleneckCallback).toHaveBeenCalledWith({
                category: 'fftProcessing',
                analysisTime: 7,
                threshold: 3.5,
                bottleneckStats: expect.any(Object)
            })
        })
        
        it('should track bottlenecks by category', () => {
            const slowFunction = () => 'result'
            
            // Create bottlenecks in different categories
            const categories = ['fftProcessing', 'beatDetection', 'effectProcessing']
            
            categories.forEach(category => {
                mockPerformance
                    .mockReturnValueOnce(1000)
                    .mockReturnValueOnce(1007)
                
                monitor.measureAnalysis(slowFunction, category)
            })
            
            expect(monitor.bottlenecks.fftProcessing).toBeGreaterThan(0)
            expect(monitor.bottlenecks.beatDetection).toBeGreaterThan(0)
            expect(monitor.bottlenecks.effectProcessing).toBeGreaterThan(0)
        })
    })
    
    describe('benchmarking', () => {
        it('should run performance benchmark', async () => {
            const testFunction = vi.fn(() => 'result')
            
            // Mock time progression for benchmark
            let currentTime = 1000
            mockPerformance.mockImplementation(() => {
                currentTime += 16 // Simulate 60fps
                return currentTime
            })
            
            const benchmarkPromise = monitor.runBenchmark(testFunction)
            
            // Wait a bit and resolve
            await new Promise(resolve => setTimeout(resolve, 100))
            
            const results = await benchmarkPromise
            
            expect(results).toHaveProperty('sampleCount')
            expect(results).toHaveProperty('average')
            expect(results).toHaveProperty('min')
            expect(results).toHaveProperty('max')
            expect(results).toHaveProperty('p95')
            expect(results).toHaveProperty('targetMet')
            expect(testFunction).toHaveBeenCalled()
        })
        
        it('should prevent concurrent benchmarks', async () => {
            const testFunction = () => 'result'
            
            // Start first benchmark
            const benchmark1 = monitor.runBenchmark(testFunction)
            
            // Try to start second benchmark
            await expect(monitor.runBenchmark(testFunction)).rejects.toThrow('Benchmark already running')
            
            // Clean up
            await benchmark1
        })
    })
    
    describe('performance trend analysis', () => {
        it('should analyze performance trends', () => {
            const testFunction = () => 'result'
            
            // Create performance history with improving trend
            const times = [5, 4, 3, 2, 1] // Improving performance
            times.forEach((time, index) => {
                // Simulate frame count to trigger history recording
                monitor.stats.frameCount = (index + 1) * 60
                
                mockPerformance
                    .mockReturnValueOnce(1000)
                    .mockReturnValueOnce(1000 + time)
                
                monitor.measureAnalysis(testFunction, 'test')
            })
            
            const trend = monitor.getPerformanceTrend()
            expect(trend.trend).toBe('improving')
            expect(trend.changePercent).toBeLessThan(0)
        })
        
        it('should detect degrading performance', () => {
            const testFunction = () => 'result'
            
            // Create performance history with degrading trend
            const times = [1, 2, 3, 4, 5] // Degrading performance
            times.forEach((time, index) => {
                monitor.stats.frameCount = (index + 1) * 60
                
                mockPerformance
                    .mockReturnValueOnce(1000)
                    .mockReturnValueOnce(1000 + time)
                
                monitor.measureAnalysis(testFunction, 'test')
            })
            
            const trend = monitor.getPerformanceTrend()
            expect(trend.trend).toBe('degrading')
            expect(trend.changePercent).toBeGreaterThan(0)
        })
    })
    
    describe('statistics and reporting', () => {
        it('should provide comprehensive performance statistics', () => {
            const testFunction = () => 'result'
            
            mockPerformance
                .mockReturnValueOnce(1000)
                .mockReturnValueOnce(1003)
            
            monitor.measureAnalysis(testFunction, 'test')
            
            const stats = monitor.getPerformanceStats()
            
            expect(stats).toHaveProperty('stats')
            expect(stats).toHaveProperty('bottlenecks')
            expect(stats).toHaveProperty('qualitySettings')
            expect(stats).toHaveProperty('qualityLevel')
            expect(stats).toHaveProperty('trend')
            
            expect(stats.stats.frameCount).toBe(1)
            expect(stats.stats.analysisTime).toBe(3)
            expect(stats.qualityLevel).toBe(1.0)
        })
        
        it('should reset statistics correctly', () => {
            const testFunction = () => 'result'
            
            // Generate some stats
            mockPerformance
                .mockReturnValueOnce(1000)
                .mockReturnValueOnce(1003)
            
            monitor.measureAnalysis(testFunction, 'test')
            
            expect(monitor.stats.frameCount).toBe(1)
            
            // Reset
            monitor.resetStats()
            
            expect(monitor.stats.frameCount).toBe(0)
            expect(monitor.stats.analysisTime).toBe(0)
            expect(monitor.stats.performanceWarnings).toBe(0)
        })
    })
    
    describe('lifecycle management', () => {
        it('should start and stop monitoring', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            
            monitor.start()
            expect(consoleSpy).toHaveBeenCalledWith('AudioPerformanceMonitor started')
            
            monitor.stop()
            expect(consoleSpy).toHaveBeenCalledWith('AudioPerformanceMonitor stopped')
            
            consoleSpy.mockRestore()
        })
        
        it('should dispose resources properly', () => {
            const testFunction = () => 'result'
            
            // Generate some data
            mockPerformance
                .mockReturnValueOnce(1000)
                .mockReturnValueOnce(1003)
            
            monitor.measureAnalysis(testFunction, 'test')
            
            expect(monitor.performanceHistory.length).toBeGreaterThan(0)
            
            // Dispose
            monitor.dispose()
            
            expect(monitor.callbacks).toEqual({})
            expect(monitor.performanceHistory).toEqual([])
            expect(monitor.recentSamples).toEqual([])
        })
    })
})