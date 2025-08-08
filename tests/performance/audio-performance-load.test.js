/**
 * Performance tests for audio processing under various load conditions
 * Tests system behavior under stress and resource constraints
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'

describe('Audio Performance Under Load', () => {
    let AudioAnalyzer, BeatDetector, AudioEffects, AudioPerformanceMonitor
    let mockAudioContext, mockAnalyserNode
    
    beforeAll(async () => {
        // Import audio components
        const analyzerModule = await import('../../src/audio/audio-analyzer.js')
        const beatModule = await import('../../src/audio/beat-detector.js')
        const effectsModule = await import('../../src/audio/audio-effects.js')
        const monitorModule = await import('../../src/audio/audio-performance-monitor.js')
        
        AudioAnalyzer = analyzerModule.AudioAnalyzer
        BeatDetector = beatModule.default
        AudioEffects = effectsModule.AudioEffects
        AudioPerformanceMonitor = monitorModule.AudioPerformanceMonitor
        
        console.log('🚀 Audio performance test environment initialized')
    })
    
    beforeEach(() => {
        // Mock Web Audio API with performance tracking
        mockAudioContext = {
            state: 'running',
            sampleRate: 44100,
            resume: vi.fn().mockResolvedValue(undefined),
            close: vi.fn().mockResolvedValue(undefined),
            createAnalyser: vi.fn(),
            createMediaStreamSource: vi.fn()
        }
        
        mockAnalyserNode = {
            fftSize: 2048,
            frequencyBinCount: 1024,
            smoothingTimeConstant: 0.8,
            minDecibels: -90,
            maxDecibels: -10,
            connect: vi.fn(),
            disconnect: vi.fn(),
            getByteFrequencyData: vi.fn(),
            getByteTimeDomainData: vi.fn()
        }
        
        mockAudioContext.createAnalyser.mockReturnValue(mockAnalyserNode)
        mockAudioContext.createMediaStreamSource.mockReturnValue({
            connect: vi.fn(),
            disconnect: vi.fn()
        })
        
        // Setup global mocks
        global.window = {
            AudioContext: vi.fn(() => mockAudioContext),
            webkitAudioContext: vi.fn(() => mockAudioContext)
        }
        
        global.navigator = {
            mediaDevices: {
                getUserMedia: vi.fn().mockResolvedValue({
                    getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
                    getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }])
                })
            }
        }
        
        // Mock performance with realistic timing
        let performanceCounter = 0
        global.performance = {
            now: vi.fn(() => {
                performanceCounter += 0.1 + Math.random() * 0.5 // Simulate realistic timing variance
                return performanceCounter
            })
        }
    })
    
    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('High-Frequency Processing Load', () => {
        it('should maintain performance at 60fps audio analysis', async () => {
            const audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            
            const performanceMonitor = new AudioPerformanceMonitor()
            const frameTimes = []
            
            // Simulate 60fps for 2 seconds (120 frames)
            for (let frame = 0; frame < 120; frame++) {
                const frequencyData = generateRealisticFrequencyData(frame)
                
                mockAnalyserNode.getByteFrequencyData.mockImplementation((array) => {
                    array.set(frequencyData)
                })
                
                const startTime = performance.now()
                
                const result = performanceMonitor.measureAnalysis(() => {
                    return audioAnalyzer.getFrequencyData()
                })
                
                const endTime = performance.now()
                frameTimes.push(endTime - startTime)
                
                // Verify result is valid
                expect(result.bass).toBeGreaterThanOrEqual(0)
                expect(result.bass).toBeLessThanOrEqual(1)
                expect(result.spectrum).toHaveLength(1024)
            }
            
            // Performance analysis
            const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
            const maxFrameTime = Math.max(...frameTimes)
            const slowFrames = frameTimes.filter(time => time > 2.0).length
            
            // Performance requirements for 60fps (16.67ms budget)
            expect(avgFrameTime).toBeLessThan(2.0) // Audio should use <2ms per frame
            expect(maxFrameTime).toBeLessThan(5.0) // No frame should exceed 5ms
            expect(slowFrames).toBeLessThan(frameTimes.length * 0.05) // <5% slow frames
            
            const stats = performanceMonitor.getPerformanceStats()
            expect(stats.frameCount).toBe(120)
            expect(stats.averageAnalysisTime).toBeLessThan(2.0)
            
            audioAnalyzer.dispose()
        })
        
        it('should handle burst processing loads', async () => {
            const audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            
            const beatDetector = new BeatDetector(audioAnalyzer)
            const burstResults = []
            
            // Simulate burst of rapid processing (simulating audio buffer underrun recovery)
            const burstSize = 50
            const burstStartTime = performance.now()
            
            for (let i = 0; i < burstSize; i++) {
                const frequencyData = generateRealisticFrequencyData(i, { intensity: 0.8 })
                
                mockAnalyserNode.getByteFrequencyData.mockImplementation((array) => {
                    array.set(frequencyData)
                })
                
                const frameStartTime = performance.now()
                
                const audioData = audioAnalyzer.getFrequencyData()
                const beatData = beatDetector.detectBeat(frequencyData)
                
                const frameEndTime = performance.now()
                
                burstResults.push({
                    frameTime: frameEndTime - frameStartTime,
                    audioData,
                    beatData
                })
            }
            
            const burstTotalTime = performance.now() - burstStartTime
            const avgBurstFrameTime = burstResults.reduce((sum, r) => sum + r.frameTime, 0) / burstSize
            
            // Burst processing should complete within reasonable time
            expect(burstTotalTime).toBeLessThan(100) // 100ms for 50 frames
            expect(avgBurstFrameTime).toBeLessThan(3.0) // Slightly higher tolerance for burst
            
            // All results should be valid
            burstResults.forEach(result => {
                expect(result.audioData.bass).toBeGreaterThanOrEqual(0)
                expect(result.audioData.bass).toBeLessThanOrEqual(1)
                expect(result.beatData.energy).toBeGreaterThanOrEqual(0)
            })
            
            audioAnalyzer.dispose()
        })
    })

    describe('Memory Usage Under Load', () => {
        it('should maintain stable memory usage over extended periods', async () => {
            const audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            
            const beatDetector = new BeatDetector(audioAnalyzer)
            const memorySnapshots = []
            
            // Take initial memory snapshot
            if (process.memoryUsage) {
                memorySnapshots.push({
                    frame: 0,
                    memory: process.memoryUsage()
                })
            }
            
            // Simulate extended processing (10 minutes at 43fps = 25,800 frames)
            // Test with smaller sample for performance
            const totalFrames = 1000
            const snapshotInterval = 100
            
            for (let frame = 1; frame <= totalFrames; frame++) {
                const frequencyData = generateRealisticFrequencyData(frame)
                
                mockAnalyserNode.getByteFrequencyData.mockImplementation((array) => {
                    array.set(frequencyData)
                })
                
                const audioData = audioAnalyzer.getFrequencyData()
                const beatData = beatDetector.detectBeat(frequencyData)
                
                // Take memory snapshots periodically
                if (frame % snapshotInterval === 0 && process.memoryUsage) {
                    memorySnapshots.push({
                        frame,
                        memory: process.memoryUsage()
                    })
                }
                
                // Force garbage collection occasionally if available
                if (frame % 200 === 0 && global.gc) {
                    global.gc()
                }
            }
            
            // Analyze memory usage
            if (memorySnapshots.length > 2) {
                const initialMemory = memorySnapshots[0].memory.heapUsed
                const finalMemory = memorySnapshots[memorySnapshots.length - 1].memory.heapUsed
                const memoryIncrease = finalMemory - initialMemory
                
                // Memory increase should be reasonable (less than 100MB for this test)
                expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024) // 100MB
                
                // Check for memory leaks (consistent growth)
                const memoryGrowthRates = []
                for (let i = 1; i < memorySnapshots.length; i++) {
                    const prev = memorySnapshots[i - 1]
                    const curr = memorySnapshots[i]
                    const growth = (curr.memory.heapUsed - prev.memory.heapUsed) / (curr.frame - prev.frame)
                    memoryGrowthRates.push(growth)
                }
                
                // Average growth rate should be minimal (indicating no major leaks)
                const avgGrowthRate = memoryGrowthRates.reduce((a, b) => a + b, 0) / memoryGrowthRates.length
                expect(Math.abs(avgGrowthRate)).toBeLessThan(1000) // Less than 1KB per frame growth
            }
            
            audioAnalyzer.dispose()
        })
        
        it('should handle multiple concurrent analyzers efficiently', async () => {
            const analyzerCount = 5
            const analyzers = []
            const beatDetectors = []
            
            // Create multiple analyzers
            for (let i = 0; i < analyzerCount; i++) {
                const analyzer = new AudioAnalyzer()
                await analyzer.initialize('microphone')
                analyzers.push(analyzer)
                beatDetectors.push(new BeatDetector(analyzer))
            }
            
            const concurrentResults = []
            const testFrames = 100
            
            for (let frame = 0; frame < testFrames; frame++) {
                const frameStartTime = performance.now()
                const frameResults = []
                
                // Process all analyzers concurrently
                const promises = analyzers.map(async (analyzer, index) => {
                    const frequencyData = generateRealisticFrequencyData(frame + index * 10)
                    
                    mockAnalyserNode.getByteFrequencyData.mockImplementation((array) => {
                        array.set(frequencyData)
                    })
                    
                    const audioData = analyzer.getFrequencyData()
                    const beatData = beatDetectors[index].detectBeat(frequencyData)
                    
                    return { audioData, beatData, analyzerId: index }
                })
                
                const results = await Promise.all(promises)
                const frameEndTime = performance.now()
                
                concurrentResults.push({
                    frame,
                    frameTime: frameEndTime - frameStartTime,
                    results
                })
            }
            
            // Analyze concurrent performance
            const avgConcurrentFrameTime = concurrentResults.reduce((sum, r) => sum + r.frameTime, 0) / testFrames
            const maxConcurrentFrameTime = Math.max(...concurrentResults.map(r => r.frameTime))
            
            // Concurrent processing should scale reasonably
            expect(avgConcurrentFrameTime).toBeLessThan(10.0) // 5 analyzers should complete in <10ms
            expect(maxConcurrentFrameTime).toBeLessThan(20.0) // No frame should exceed 20ms
            
            // All results should be valid
            concurrentResults.forEach(frameResult => {
                expect(frameResult.results).toHaveLength(analyzerCount)
                frameResult.results.forEach(result => {
                    expect(result.audioData.bass).toBeGreaterThanOrEqual(0)
                    expect(result.audioData.bass).toBeLessThanOrEqual(1)
                    expect(result.beatData.energy).toBeGreaterThanOrEqual(0)
                })
            })
            
            // Cleanup
            analyzers.forEach(analyzer => analyzer.dispose())
        })
    })

    describe('CPU Load and Optimization', () => {
        it('should adapt quality based on performance', async () => {
            const audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            
            const performanceMonitor = new AudioPerformanceMonitor()
            
            // Simulate slow performance by making analysis artificially slow
            const originalGetFrequencyData = audioAnalyzer.getFrequencyData.bind(audioAnalyzer)
            audioAnalyzer.getFrequencyData = function() {
                // Simulate slow processing
                const start = performance.now()
                while (performance.now() - start < 6) {
                    // Busy wait for 6ms (exceeds 2ms threshold)
                }
                return originalGetFrequencyData()
            }
            
            const qualityReductions = []
            const originalReduceQuality = performanceMonitor.reduceAnalysisQuality.bind(performanceMonitor)
            performanceMonitor.reduceAnalysisQuality = function() {
                qualityReductions.push(performance.now())
                return originalReduceQuality()
            }
            
            // Process frames until quality reduction is triggered
            for (let frame = 0; frame < 15; frame++) {
                const frequencyData = generateRealisticFrequencyData(frame)
                
                mockAnalyserNode.getByteFrequencyData.mockImplementation((array) => {
                    array.set(frequencyData)
                })
                
                performanceMonitor.measureAnalysis(() => {
                    return audioAnalyzer.getFrequencyData()
                })
            }
            
            // Should have triggered quality reduction due to slow performance
            expect(qualityReductions.length).toBeGreaterThan(0)
            
            const stats = performanceMonitor.getPerformanceStats()
            expect(stats.performanceWarnings).toBeGreaterThan(10)
            
            audioAnalyzer.dispose()
        })
        
        it('should maintain performance with complex audio effects', async () => {
            const audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            
            const beatDetector = new BeatDetector(audioAnalyzer)
            
            // Mock complex FluxApp with many particles
            const mockFluxApp = {
                solver: {
                    apply_force: vi.fn(),
                    get_positions: vi.fn().mockReturnValue(new Float32Array(2000)), // 1000 particles
                    get_active_particle_count: vi.fn().mockReturnValue(1000)
                },
                config: {
                    containerWidth: 1920,
                    containerHeight: 1080,
                    particleCount: 1000
                },
                particleRenderer: {
                    audioReactiveEnabled: true,
                    updateAudioColors: vi.fn(),
                    updateBloomIntensity: vi.fn(),
                    updateTrebleSizes: vi.fn(),
                    createSparkleEffects: vi.fn(),
                    applyBeatPulse: vi.fn()
                }
            }
            
            const audioEffects = new AudioEffects(mockFluxApp)
            const effectsPerformance = []
            
            // Test all effect modes under load
            const modes = ['pulse', 'reactive', 'flow', 'ambient']
            
            for (const mode of modes) {
                audioEffects.setMode(mode)
                const modePerformance = []
                
                for (let frame = 0; frame < 60; frame++) { // 1 second at 60fps
                    const frequencyData = generateRealisticFrequencyData(frame, { 
                        intensity: 0.8,
                        hasBeats: frame % 15 === 0 // Beat every 15 frames
                    })
                    
                    mockAnalyserNode.getByteFrequencyData.mockImplementation((array) => {
                        array.set(frequencyData)
                    })
                    
                    const startTime = performance.now()
                    
                    const audioData = audioAnalyzer.getFrequencyData()
                    const beatData = beatDetector.detectBeat(frequencyData)
                    audioEffects.processAudioData(audioData, beatData)
                    
                    const endTime = performance.now()
                    modePerformance.push(endTime - startTime)
                }
                
                effectsPerformance.push({
                    mode,
                    avgTime: modePerformance.reduce((a, b) => a + b, 0) / modePerformance.length,
                    maxTime: Math.max(...modePerformance),
                    times: modePerformance
                })
            }
            
            // Analyze effects performance
            effectsPerformance.forEach(modeStats => {
                expect(modeStats.avgTime).toBeLessThan(3.0) // Each mode should average <3ms
                expect(modeStats.maxTime).toBeLessThan(8.0) // No frame should exceed 8ms
                
                // Check that force applications were made (indicating effects are working)
                expect(mockFluxApp.solver.apply_force).toHaveBeenCalled()
            })
            
            audioAnalyzer.dispose()
        })
    })

    describe('Resource Cleanup and Recovery', () => {
        it('should recover gracefully from audio context failures', async () => {
            const audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            
            // Simulate audio context failure
            mockAudioContext.state = 'closed'
            mockAudioContext.resume = vi.fn().mockRejectedValue(new Error('Context closed'))
            
            // Should handle gracefully
            const result = audioAnalyzer.getFrequencyData()
            expect(result.bass).toBe(0) // Should return empty data
            expect(result.mids).toBe(0)
            expect(result.treble).toBe(0)
            
            // Should be able to reinitialize
            mockAudioContext.state = 'running'
            mockAudioContext.resume = vi.fn().mockResolvedValue(undefined)
            
            const reinitResult = await audioAnalyzer.initialize('microphone')
            expect(reinitResult.success).toBe(true)
            
            audioAnalyzer.dispose()
        })
        
        it('should handle rapid initialization/disposal cycles', async () => {
            const cycles = 20
            const cycleResults = []
            
            for (let cycle = 0; cycle < cycles; cycle++) {
                const startTime = performance.now()
                
                const audioAnalyzer = new AudioAnalyzer()
                const initResult = await audioAnalyzer.initialize('microphone')
                
                expect(initResult.success).toBe(true)
                
                // Do some processing
                const frequencyData = generateRealisticFrequencyData(cycle)
                mockAnalyserNode.getByteFrequencyData.mockImplementation((array) => {
                    array.set(frequencyData)
                })
                
                const audioData = audioAnalyzer.getFrequencyData()
                expect(audioData.bass).toBeGreaterThanOrEqual(0)
                
                audioAnalyzer.dispose()
                
                const endTime = performance.now()
                cycleResults.push(endTime - startTime)
            }
            
            // Cycles should complete reasonably quickly
            const avgCycleTime = cycleResults.reduce((a, b) => a + b, 0) / cycles
            expect(avgCycleTime).toBeLessThan(50) // Each cycle should take <50ms
            
            // No cycle should take excessively long
            const slowCycles = cycleResults.filter(time => time > 200)
            expect(slowCycles.length).toBe(0)
        })
    })

    // Helper function to generate realistic frequency data
    function generateRealisticFrequencyData(frame, options = {}) {
        const { intensity = 0.5, hasBeats = false } = options
        const data = new Uint8Array(1024)
        
        // Generate frequency data that simulates music
        for (let i = 0; i < 1024; i++) {
            let value = 0
            
            // Bass frequencies (0-100 bins)
            if (i < 100) {
                value = intensity * 180 + Math.sin(frame * 0.1) * 50
                if (hasBeats) value += 75
            }
            // Mid frequencies (100-700 bins)
            else if (i < 700) {
                value = intensity * 120 + Math.sin(frame * 0.05 + i * 0.01) * 30
            }
            // Treble frequencies (700-1024 bins)
            else {
                value = intensity * 80 + Math.random() * 40
            }
            
            // Add some noise
            value += (Math.random() - 0.5) * 20
            
            // Clamp to valid range
            data[i] = Math.max(0, Math.min(255, Math.floor(value)))
        }
        
        return data
    }
})