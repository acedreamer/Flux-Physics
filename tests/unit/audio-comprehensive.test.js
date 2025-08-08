/**
 * Comprehensive unit tests for all audio processing components
 * Tests all core audio functionality including edge cases and error conditions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock Web Audio API components
const createMockAudioContext = () => ({
    state: 'running',
    sampleRate: 44100,
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    createAnalyser: vi.fn(),
    createMediaStreamSource: vi.fn(),
    createGain: vi.fn(),
    createBiquadFilter: vi.fn()
})

const createMockAnalyserNode = () => ({
    fftSize: 2048,
    frequencyBinCount: 1024,
    smoothingTimeConstant: 0.8,
    minDecibels: -90,
    maxDecibels: -10,
    connect: vi.fn(),
    disconnect: vi.fn(),
    getByteFrequencyData: vi.fn(),
    getByteTimeDomainData: vi.fn()
})

const createMockMediaStream = () => ({
    getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
    getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }])
})

describe('Audio Processing Components - Comprehensive Tests', () => {
    let mockAudioContext
    let mockAnalyserNode
    let mockMediaStream
    
    beforeEach(() => {
        mockAudioContext = createMockAudioContext()
        mockAnalyserNode = createMockAnalyserNode()
        mockMediaStream = createMockMediaStream()
        
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
                getUserMedia: vi.fn().mockResolvedValue(mockMediaStream),
                getDisplayMedia: vi.fn().mockResolvedValue(mockMediaStream)
            }
        }
        
        global.performance = {
            now: vi.fn(() => Date.now())
        }
    })
    
    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('Audio Settings Component', () => {
        let AudioSettings
        
        beforeEach(async () => {
            const module = await import('../../src/audio/audio-settings.js')
            AudioSettings = module.AudioSettings
        })
        
        it('should initialize with default settings', () => {
            const settings = new AudioSettings()
            
            expect(settings.sensitivity).toBe(1.0)
            expect(settings.smoothingFactor).toBe(0.7)
            expect(settings.beatThreshold).toBe(1.3)
            expect(settings.frequencyRanges.bass.weight).toBe(1.0)
            expect(settings.frequencyRanges.mids.weight).toBe(1.0)
            expect(settings.frequencyRanges.treble.weight).toBe(1.0)
        })
        
        it('should update settings correctly', () => {
            const settings = new AudioSettings()
            
            settings.updateSensitivity(1.5)
            expect(settings.sensitivity).toBe(1.5)
            
            settings.updateSmoothingFactor(0.9)
            expect(settings.smoothingFactor).toBe(0.9)
            
            settings.updateBeatThreshold(1.8)
            expect(settings.beatThreshold).toBe(1.8)
        })
        
        it('should validate setting ranges', () => {
            const settings = new AudioSettings()
            
            // Test sensitivity bounds
            settings.updateSensitivity(-0.5)
            expect(settings.sensitivity).toBe(0.1) // Should clamp to minimum
            
            settings.updateSensitivity(5.0)
            expect(settings.sensitivity).toBe(3.0) // Should clamp to maximum
            
            // Test smoothing factor bounds
            settings.updateSmoothingFactor(-0.1)
            expect(settings.smoothingFactor).toBe(0.0) // Should clamp to minimum
            
            settings.updateSmoothingFactor(1.5)
            expect(settings.smoothingFactor).toBe(1.0) // Should clamp to maximum
        })
        
        it('should save and load settings from localStorage', () => {
            const settings = new AudioSettings()
            
            // Mock localStorage
            const mockStorage = {}
            global.localStorage = {
                getItem: vi.fn((key) => mockStorage[key] || null),
                setItem: vi.fn((key, value) => { mockStorage[key] = value }),
                removeItem: vi.fn((key) => { delete mockStorage[key] })
            }
            
            settings.updateSensitivity(1.8)
            settings.updateSmoothingFactor(0.5)
            settings.saveSettings()
            
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'flux-audio-settings',
                expect.stringContaining('"sensitivity":1.8')
            )
            
            // Test loading
            const newSettings = new AudioSettings()
            newSettings.loadSettings()
            
            expect(newSettings.sensitivity).toBe(1.8)
            expect(newSettings.smoothingFactor).toBe(0.5)
        })
        
        it('should handle corrupted localStorage data', () => {
            const settings = new AudioSettings()
            
            global.localStorage = {
                getItem: vi.fn(() => 'invalid-json'),
                setItem: vi.fn(),
                removeItem: vi.fn()
            }
            
            // Should not throw and should use defaults
            expect(() => settings.loadSettings()).not.toThrow()
            expect(settings.sensitivity).toBe(1.0) // Default value
        })
        
        it('should update frequency range weights', () => {
            const settings = new AudioSettings()
            
            settings.updateFrequencyRangeWeight('bass', 1.5)
            settings.updateFrequencyRangeWeight('mids', 0.8)
            settings.updateFrequencyRangeWeight('treble', 1.2)
            
            expect(settings.frequencyRanges.bass.weight).toBe(1.5)
            expect(settings.frequencyRanges.mids.weight).toBe(0.8)
            expect(settings.frequencyRanges.treble.weight).toBe(1.2)
        })
        
        it('should reset to defaults', () => {
            const settings = new AudioSettings()
            
            // Modify settings
            settings.updateSensitivity(2.0)
            settings.updateSmoothingFactor(0.3)
            settings.updateBeatThreshold(2.0)
            
            // Reset
            settings.resetToDefaults()
            
            expect(settings.sensitivity).toBe(1.0)
            expect(settings.smoothingFactor).toBe(0.7)
            expect(settings.beatThreshold).toBe(1.3)
        })
    })

    describe('Audio Source Manager', () => {
        let AudioSourceManager
        
        beforeEach(async () => {
            const module = await import('../../src/audio/audio-source-manager.js')
            AudioSourceManager = module.AudioSourceManager
        })
        
        it('should initialize with no active source', () => {
            const manager = new AudioSourceManager()
            
            expect(manager.currentSource).toBeNull()
            expect(manager.isActive).toBe(false)
            expect(manager.availableSources).toEqual(['microphone', 'system'])
        })
        
        it('should switch between audio sources', async () => {
            const manager = new AudioSourceManager()
            
            const result = await manager.switchToSource('microphone')
            
            expect(result.success).toBe(true)
            expect(manager.currentSource).toBe('microphone')
            expect(manager.isActive).toBe(true)
        })
        
        it('should handle source switching failures', async () => {
            const manager = new AudioSourceManager()
            
            // Mock getUserMedia to fail
            global.navigator.mediaDevices.getUserMedia = vi.fn()
                .mockRejectedValue(new Error('Permission denied'))
            
            const result = await manager.switchToSource('microphone')
            
            expect(result.success).toBe(false)
            expect(result.error).toBe('PERMISSION_DENIED')
            expect(manager.currentSource).toBeNull()
            expect(manager.isActive).toBe(false)
        })
        
        it('should detect available sources', async () => {
            const manager = new AudioSourceManager()
            
            // Mock enumerateDevices
            global.navigator.mediaDevices.enumerateDevices = vi.fn()
                .mockResolvedValue([
                    { kind: 'audioinput', deviceId: 'mic1', label: 'Microphone 1' },
                    { kind: 'audioinput', deviceId: 'mic2', label: 'Microphone 2' },
                    { kind: 'videoinput', deviceId: 'cam1', label: 'Camera 1' }
                ])
            
            const sources = await manager.detectAvailableSources()
            
            expect(sources.microphones).toHaveLength(2)
            expect(sources.microphones[0].label).toBe('Microphone 1')
            expect(sources.systemAudio).toBe(true) // Assumes getDisplayMedia is available
        })
        
        it('should stop current source before switching', async () => {
            const manager = new AudioSourceManager()
            
            // Start with microphone
            await manager.switchToSource('microphone')
            const firstStream = manager.mediaStream
            
            // Switch to system audio
            await manager.switchToSource('system')
            
            // First stream should be stopped
            expect(firstStream.getTracks()[0].stop).toHaveBeenCalled()
            expect(manager.currentSource).toBe('system')
        })
        
        it('should handle reconnection attempts', async () => {
            const manager = new AudioSourceManager()
            
            await manager.switchToSource('microphone')
            
            // Simulate connection loss
            manager.handleConnectionLoss()
            
            expect(manager.isActive).toBe(false)
            expect(manager.reconnectAttempts).toBe(0)
            
            // Should attempt reconnection
            const reconnectResult = await manager.attemptReconnection()
            expect(reconnectResult.success).toBe(true)
            expect(manager.isActive).toBe(true)
        })
    })

    describe('Audio Worker Manager', () => {
        let AudioWorkerManager
        
        beforeEach(async () => {
            const module = await import('../../src/audio/audio-worker-manager.js')
            AudioWorkerManager = module.AudioWorkerManager
        })
        
        it('should initialize worker for heavy processing', () => {
            // Mock Worker
            global.Worker = vi.fn().mockImplementation(() => ({
                postMessage: vi.fn(),
                terminate: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn()
            }))
            
            const manager = new AudioWorkerManager()
            
            expect(manager.isWorkerSupported).toBe(true)
            expect(manager.worker).toBeNull() // Not created until needed
        })
        
        it('should process audio data in worker', async () => {
            global.Worker = vi.fn().mockImplementation(() => {
                const worker = {
                    postMessage: vi.fn(),
                    terminate: vi.fn(),
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn()
                }
                
                // Simulate worker response
                setTimeout(() => {
                    const messageHandler = worker.addEventListener.mock.calls
                        .find(call => call[0] === 'message')?.[1]
                    
                    if (messageHandler) {
                        messageHandler({
                            data: {
                                type: 'analysis-result',
                                result: {
                                    bass: 0.6,
                                    mids: 0.4,
                                    treble: 0.8,
                                    spectrum: new Array(1024).fill(128)
                                }
                            }
                        })
                    }
                }, 10)
                
                return worker
            })
            
            const manager = new AudioWorkerManager()
            
            const frequencyData = new Uint8Array(1024).fill(128)
            const result = await manager.processAudioData(frequencyData)
            
            expect(result.bass).toBe(0.6)
            expect(result.mids).toBe(0.4)
            expect(result.treble).toBe(0.8)
        })
        
        it('should fallback to main thread when worker fails', async () => {
            // Mock Worker to throw
            global.Worker = vi.fn().mockImplementation(() => {
                throw new Error('Worker not supported')
            })
            
            const manager = new AudioWorkerManager()
            
            expect(manager.isWorkerSupported).toBe(false)
            
            const frequencyData = new Uint8Array(1024).fill(128)
            const result = await manager.processAudioData(frequencyData)
            
            // Should process on main thread
            expect(result).toBeDefined()
            expect(result.bass).toBeGreaterThanOrEqual(0)
        })
        
        it('should terminate worker on cleanup', () => {
            const mockWorker = {
                postMessage: vi.fn(),
                terminate: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn()
            }
            
            global.Worker = vi.fn().mockReturnValue(mockWorker)
            
            const manager = new AudioWorkerManager()
            manager.initializeWorker()
            
            manager.cleanup()
            
            expect(mockWorker.terminate).toHaveBeenCalled()
            expect(manager.worker).toBeNull()
        })
    })

    describe('FFT Optimizer', () => {
        let FFTOptimizer
        
        beforeEach(async () => {
            const module = await import('../../src/audio/fft-optimizer.js')
            FFTOptimizer = module.FFTOptimizer
        })
        
        it('should optimize FFT size based on performance', () => {
            const optimizer = new FFTOptimizer()
            
            // Simulate slow performance
            optimizer.recordPerformance(5.0) // 5ms - too slow
            optimizer.recordPerformance(4.8)
            optimizer.recordPerformance(5.2)
            
            const recommendation = optimizer.getOptimalFFTSize(2048)
            
            expect(recommendation.fftSize).toBeLessThan(2048)
            expect(recommendation.reason).toContain('performance')
        })
        
        it('should maintain quality when performance is good', () => {
            const optimizer = new FFTOptimizer()
            
            // Simulate good performance
            optimizer.recordPerformance(1.0) // 1ms - good
            optimizer.recordPerformance(0.8)
            optimizer.recordPerformance(1.2)
            
            const recommendation = optimizer.getOptimalFFTSize(2048)
            
            expect(recommendation.fftSize).toBe(2048)
            expect(recommendation.reason).toContain('maintaining')
        })
        
        it('should suggest higher quality when performance allows', () => {
            const optimizer = new FFTOptimizer()
            
            // Simulate excellent performance
            optimizer.recordPerformance(0.3) // Very fast
            optimizer.recordPerformance(0.2)
            optimizer.recordPerformance(0.4)
            
            const recommendation = optimizer.getOptimalFFTSize(1024)
            
            expect(recommendation.fftSize).toBeGreaterThan(1024)
            expect(recommendation.reason).toContain('increasing')
        })
        
        it('should provide performance statistics', () => {
            const optimizer = new FFTOptimizer()
            
            optimizer.recordPerformance(1.5)
            optimizer.recordPerformance(2.0)
            optimizer.recordPerformance(1.8)
            
            const stats = optimizer.getPerformanceStats()
            
            expect(stats.averageTime).toBeCloseTo(1.77, 1)
            expect(stats.maxTime).toBe(2.0)
            expect(stats.minTime).toBe(1.5)
            expect(stats.sampleCount).toBe(3)
        })
        
        it('should reset performance history', () => {
            const optimizer = new FFTOptimizer()
            
            optimizer.recordPerformance(1.5)
            optimizer.recordPerformance(2.0)
            
            optimizer.resetPerformanceHistory()
            
            const stats = optimizer.getPerformanceStats()
            expect(stats.sampleCount).toBe(0)
            expect(stats.averageTime).toBe(0)
        })
    })

    describe('Audio Performance Monitor', () => {
        let AudioPerformanceMonitor
        
        beforeEach(async () => {
            const module = await import('../../src/audio/audio-performance-monitor.js')
            AudioPerformanceMonitor = module.AudioPerformanceMonitor
        })
        
        it('should track analysis timing', () => {
            const monitor = new AudioPerformanceMonitor()
            
            const analysisFunction = () => {
                // Simulate some work
                const start = performance.now()
                while (performance.now() - start < 2) {
                    // Busy wait for 2ms
                }
                return { result: 'test' }
            }
            
            const result = monitor.measureAnalysis(analysisFunction)
            
            expect(result.result).toBe('test')
            expect(monitor.analysisTime).toBeGreaterThan(0)
        })
        
        it('should warn about slow analysis', () => {
            const monitor = new AudioPerformanceMonitor()
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
            
            const slowFunction = () => {
                const start = performance.now()
                while (performance.now() - start < 5) {
                    // Busy wait for 5ms (exceeds 2ms threshold)
                }
                return { result: 'slow' }
            }
            
            monitor.measureAnalysis(slowFunction)
            
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Audio analysis taking too long')
            )
            
            consoleSpy.mockRestore()
        })
        
        it('should reduce quality after repeated warnings', () => {
            const monitor = new AudioPerformanceMonitor()
            const qualitySpy = vi.spyOn(monitor, 'reduceAnalysisQuality')
            
            const slowFunction = () => {
                const start = performance.now()
                while (performance.now() - start < 5) {
                    // Busy wait for 5ms
                }
                return { result: 'slow' }
            }
            
            // Trigger multiple warnings
            for (let i = 0; i < 12; i++) {
                monitor.measureAnalysis(slowFunction)
            }
            
            expect(qualitySpy).toHaveBeenCalled()
        })
        
        it('should provide performance statistics', () => {
            const monitor = new AudioPerformanceMonitor()
            
            // Record some measurements
            monitor.measureAnalysis(() => ({ result: 'test1' }))
            monitor.measureAnalysis(() => ({ result: 'test2' }))
            monitor.measureAnalysis(() => ({ result: 'test3' }))
            
            const stats = monitor.getPerformanceStats()
            
            expect(stats.frameCount).toBe(3)
            expect(stats.averageAnalysisTime).toBeGreaterThan(0)
            expect(stats.maxAnalysisTime).toBeGreaterThan(0)
            expect(stats.performanceWarnings).toBeGreaterThanOrEqual(0)
        })
        
        it('should reset statistics', () => {
            const monitor = new AudioPerformanceMonitor()
            
            monitor.measureAnalysis(() => ({ result: 'test' }))
            monitor.resetStats()
            
            const stats = monitor.getPerformanceStats()
            expect(stats.frameCount).toBe(0)
            expect(stats.averageAnalysisTime).toBe(0)
            expect(stats.performanceWarnings).toBe(0)
        })
    })

    describe('Error Handling and Edge Cases', () => {
        it('should handle null/undefined frequency data', async () => {
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const analyzer = new AudioAnalyzer()
            
            // Should not crash with null data
            const result = analyzer.getFrequencyData()
            expect(result.bass).toBe(0)
            expect(result.mids).toBe(0)
            expect(result.treble).toBe(0)
        })
        
        it('should handle audio context state changes', async () => {
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const analyzer = new AudioAnalyzer()
            
            // Mock context state change
            mockAudioContext.state = 'suspended'
            
            const result = await analyzer.initialize('microphone')
            
            expect(mockAudioContext.resume).toHaveBeenCalled()
            expect(result.success).toBe(true)
        })
        
        it('should handle memory pressure gracefully', async () => {
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const analyzer = new AudioAnalyzer()
            
            await analyzer.initialize('microphone')
            
            // Simulate memory pressure by creating large arrays
            const largeArrays = []
            try {
                for (let i = 0; i < 1000; i++) {
                    largeArrays.push(new Float32Array(1024 * 1024))
                }
            } catch (e) {
                // Expected to run out of memory
            }
            
            // Audio analyzer should still work
            expect(() => analyzer.getFrequencyData()).not.toThrow()
        })
        
        it('should handle rapid initialization/disposal cycles', async () => {
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            
            for (let i = 0; i < 10; i++) {
                const analyzer = new AudioAnalyzer()
                await analyzer.initialize('microphone')
                analyzer.dispose()
            }
            
            // Should not leak resources or crash
            expect(true).toBe(true) // Test passes if no exceptions thrown
        })
        
        it('should handle concurrent audio access attempts', async () => {
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            
            const analyzer1 = new AudioAnalyzer()
            const analyzer2 = new AudioAnalyzer()
            
            // Both try to access microphone simultaneously
            const results = await Promise.allSettled([
                analyzer1.initialize('microphone'),
                analyzer2.initialize('microphone')
            ])
            
            // At least one should succeed, or both should fail gracefully
            const successes = results.filter(r => r.status === 'fulfilled' && r.value.success)
            const failures = results.filter(r => r.status === 'fulfilled' && !r.value.success)
            
            expect(successes.length + failures.length).toBe(2)
            
            analyzer1.dispose()
            analyzer2.dispose()
        })
    })
})