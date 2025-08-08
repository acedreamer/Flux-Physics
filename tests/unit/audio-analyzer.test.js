import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AudioAnalyzer } from '../../src/audio/core/audio-analyzer.js'

// Mock Web Audio API
const mockAudioContext = {
    state: 'running',
    sampleRate: 44100,
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    createAnalyser: vi.fn(),
    createMediaStreamSource: vi.fn()
}

const mockAnalyserNode = {
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

const mockMediaStreamSource = {
    connect: vi.fn(),
    disconnect: vi.fn()
}

const mockMediaStream = {
    getTracks: vi.fn().mockReturnValue([
        { stop: vi.fn() }
    ]),
    getAudioTracks: vi.fn().mockReturnValue([
        { kind: 'audio' }
    ])
}

// Mock navigator.mediaDevices
const mockMediaDevices = {
    getUserMedia: vi.fn(),
    getDisplayMedia: vi.fn()
}

describe('AudioAnalyzer', () => {
    let audioAnalyzer
    
    beforeEach(() => {
        // Reset all mocks
        vi.clearAllMocks()
        
        // Setup mock returns
        mockAudioContext.createAnalyser.mockReturnValue(mockAnalyserNode)
        mockAudioContext.createMediaStreamSource.mockReturnValue(mockMediaStreamSource)
        mockMediaDevices.getUserMedia = vi.fn().mockResolvedValue(mockMediaStream)
        mockMediaDevices.getDisplayMedia = vi.fn().mockResolvedValue(mockMediaStream)
        
        // Setup global mocks
        global.window = {
            AudioContext: vi.fn(() => mockAudioContext),
            webkitAudioContext: vi.fn(() => mockAudioContext)
        }
        
        global.navigator = {
            mediaDevices: mockMediaDevices
        }
        
        global.performance = {
            now: vi.fn(() => 1000)
        }
        
        // Create fresh instance
        audioAnalyzer = new AudioAnalyzer()
    })
    
    afterEach(() => {
        if (audioAnalyzer) {
            audioAnalyzer.dispose()
        }
        vi.clearAllMocks()
    })
    
    describe('Constructor', () => {
        it('should initialize with default configuration', () => {
            expect(audioAnalyzer.config.fftSize).toBe(2048)
            expect(audioAnalyzer.config.smoothingTimeConstant).toBe(0.8)
            expect(audioAnalyzer.config.minDecibels).toBe(-90)
            expect(audioAnalyzer.config.maxDecibels).toBe(-10)
            expect(audioAnalyzer.config.sampleRate).toBe(44100)
        })
        
        it('should accept custom configuration options', () => {
            const customAnalyzer = new AudioAnalyzer({
                fftSize: 1024,
                smoothingTimeConstant: 0.5,
                sampleRate: 48000
            })
            
            expect(customAnalyzer.config.fftSize).toBe(1024)
            expect(customAnalyzer.config.smoothingTimeConstant).toBe(0.5)
            expect(customAnalyzer.config.sampleRate).toBe(48000)
        })
        
        it('should initialize frequency analyzer', () => {
            expect(audioAnalyzer.frequencyAnalyzer).toBeDefined()
            expect(audioAnalyzer.frequencyAnalyzer.config.frequencyRanges.bass).toEqual({
                min: 20, max: 250, weight: 1.0
            })
            expect(audioAnalyzer.frequencyAnalyzer.config.frequencyRanges.mids).toEqual({
                min: 250, max: 4000, weight: 1.0
            })
            expect(audioAnalyzer.frequencyAnalyzer.config.frequencyRanges.treble).toEqual({
                min: 4000, max: 20000, weight: 1.0
            })
        })
        
        it('should initialize performance stats', () => {
            expect(audioAnalyzer.performanceStats.maxAnalysisTime).toBe(2)
            expect(audioAnalyzer.performanceStats.frameCount).toBe(0)
            expect(audioAnalyzer.performanceStats.averageAnalysisTime).toBe(0)
        })
    })
    
    describe('Audio Context Initialization', () => {
        it('should initialize audio context successfully', async () => {
            const result = await audioAnalyzer.initializeAudioContext()
            
            expect(result.success).toBe(true)
            expect(window.AudioContext).toHaveBeenCalled()
            expect(audioAnalyzer.audioContext).toBe(mockAudioContext)
        })
        
        it('should handle suspended audio context', async () => {
            mockAudioContext.state = 'suspended'
            
            const result = await audioAnalyzer.initializeAudioContext()
            
            expect(result.success).toBe(true)
            expect(mockAudioContext.resume).toHaveBeenCalled()
        })
        
        it('should handle unsupported Web Audio API', async () => {
            global.window.AudioContext = undefined
            global.window.webkitAudioContext = undefined
            
            const result = await audioAnalyzer.initializeAudioContext()
            
            expect(result.success).toBe(false)
            expect(result.error).toBe('WEB_AUDIO_UNSUPPORTED')
            expect(result.message).toContain('Web Audio API is not supported')
        })
        
        it('should handle audio context creation failure', async () => {
            global.window.AudioContext = vi.fn(() => {
                throw new Error('Context creation failed')
            })
            
            const result = await audioAnalyzer.initializeAudioContext()
            
            expect(result.success).toBe(false)
            expect(result.error).toBe('AUDIO_CONTEXT_FAILED')
            expect(result.message).toContain('Failed to create audio context')
        })
    })
    
    describe('Microphone Access', () => {
        it('should request microphone access successfully', async () => {
            const result = await audioAnalyzer.requestMicrophoneAccess()
            
            expect(result.success).toBe(true)
            expect(result.stream).toBe(mockMediaStream)
            expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            })
        })
        
        it('should handle permission denied error', async () => {
            const permissionError = new Error('Permission denied')
            permissionError.name = 'NotAllowedError'
            mockMediaDevices.getUserMedia.mockRejectedValue(permissionError)
            
            const result = await audioAnalyzer.requestMicrophoneAccess()
            
            expect(result.success).toBe(false)
            expect(result.error).toBe('PERMISSION_DENIED')
            expect(result.message).toContain('Microphone access denied')
        })
        
        it('should handle no microphone found error', async () => {
            const notFoundError = new Error('No microphone')
            notFoundError.name = 'NotFoundError'
            mockMediaDevices.getUserMedia.mockRejectedValue(notFoundError)
            
            const result = await audioAnalyzer.requestMicrophoneAccess()
            
            expect(result.success).toBe(false)
            expect(result.error).toBe('NO_MICROPHONE')
            expect(result.message).toContain('No microphone found')
        })
        
        it('should handle microphone busy error', async () => {
            const busyError = new Error('Microphone busy')
            busyError.name = 'NotReadableError'
            mockMediaDevices.getUserMedia.mockRejectedValue(busyError)
            
            const result = await audioAnalyzer.requestMicrophoneAccess()
            
            expect(result.success).toBe(false)
            expect(result.error).toBe('MICROPHONE_BUSY')
            expect(result.message).toContain('Microphone is already in use')
        })
    })
    
    describe('System Audio Access', () => {
        it('should request system audio access successfully', async () => {
            const result = await audioAnalyzer.requestSystemAudioAccess()
            
            expect(result.success).toBe(true)
            expect(result.stream).toBe(mockMediaStream)
            expect(mockMediaDevices.getDisplayMedia).toHaveBeenCalledWith({
                audio: true,
                video: false
            })
        })
        
        it('should handle unsupported system audio capture', async () => {
            global.navigator.mediaDevices.getDisplayMedia = undefined
            
            const result = await audioAnalyzer.requestSystemAudioAccess()
            
            expect(result.success).toBe(false)
            expect(result.error).toBe('SYSTEM_AUDIO_UNSUPPORTED')
            expect(result.message).toContain('System audio capture is not supported')
        })
        
        it('should handle no system audio tracks', async () => {
            mockMediaStream.getAudioTracks.mockReturnValue([])
            
            const result = await audioAnalyzer.requestSystemAudioAccess()
            
            expect(result.success).toBe(false)
            expect(result.error).toBe('NO_SYSTEM_AUDIO')
            expect(result.message).toContain('No system audio available')
        })
    })
    
    describe('Full Initialization', () => {
        it('should initialize successfully with microphone', async () => {
            const result = await audioAnalyzer.initialize('microphone')
            
            expect(result.success).toBe(true)
            expect(audioAnalyzer.isInitialized).toBe(true)
            expect(mockAudioContext.createAnalyser).toHaveBeenCalled()
            expect(mockAudioContext.createMediaStreamSource).toHaveBeenCalledWith(mockMediaStream)
            expect(mockMediaStreamSource.connect).toHaveBeenCalledWith(mockAnalyserNode)
        })
        
        it('should initialize successfully with system audio', async () => {
            // Ensure getDisplayMedia is available for this test and mock stream has audio tracks
            const mockSystemStream = {
                ...mockMediaStream,
                getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }])
            }
            global.navigator.mediaDevices.getDisplayMedia = vi.fn().mockResolvedValue(mockSystemStream)
            
            const result = await audioAnalyzer.initialize('system')
            
            expect(result.success).toBe(true)
            expect(audioAnalyzer.isInitialized).toBe(true)
        })
        
        it('should handle invalid audio source', async () => {
            const result = await audioAnalyzer.initialize('invalid')
            
            expect(result.success).toBe(false)
            expect(result.error).toBe('INVALID_SOURCE')
        })
        
        it('should handle initialization failure', async () => {
            mockMediaDevices.getUserMedia.mockRejectedValue(new Error('Access denied'))
            
            const result = await audioAnalyzer.initialize('microphone')
            
            expect(result.success).toBe(false)
            expect(audioAnalyzer.isInitialized).toBe(false)
        })
    })
    
    describe('Frequency Analysis', () => {
        beforeEach(async () => {
            await audioAnalyzer.initialize('microphone')
        })
        
        it('should setup frequency analysis correctly', () => {
            expect(mockAnalyserNode.fftSize).toBe(2048)
            expect(mockAnalyserNode.smoothingTimeConstant).toBe(0.8)
            expect(mockAnalyserNode.minDecibels).toBe(-90)
            expect(mockAnalyserNode.maxDecibels).toBe(-10)
            expect(audioAnalyzer.frequencyData).toBeInstanceOf(Uint8Array)
            expect(audioAnalyzer.timeData).toBeInstanceOf(Uint8Array)
        })
        
        it('should calculate frequency bins correctly', () => {
            const binInfo = audioAnalyzer.getFrequencyBinInfo()
            
            expect(binInfo.ranges.bass.bins.length).toBeGreaterThan(0)
            expect(binInfo.ranges.mids.bins.length).toBeGreaterThan(0)
            expect(binInfo.ranges.treble.bins.length).toBeGreaterThan(0)
            
            // Bass bins should start near 0
            expect(binInfo.ranges.bass.bins[0]).toBeLessThan(5)
            
            // Treble bins should end before the maximum
            const maxBin = binInfo.ranges.treble.bins[binInfo.ranges.treble.bins.length - 1]
            expect(maxBin).toBeLessThan(1024)
            
            // Verify bin width calculation
            expect(binInfo.binWidth).toBeCloseTo(21.5, 1) // ~21.5 Hz per bin
        })
        
        it('should get frequency data successfully', () => {
            // Mock frequency data
            const mockFreqData = new Uint8Array(1024).fill(128)
            const mockTimeData = new Uint8Array(1024).fill(128)
            
            mockAnalyserNode.getByteFrequencyData.mockImplementation((array) => {
                array.set(mockFreqData)
            })
            mockAnalyserNode.getByteTimeDomainData.mockImplementation((array) => {
                array.set(mockTimeData)
            })
            
            const result = audioAnalyzer.getFrequencyData()
            
            expect(result.bass).toBeGreaterThanOrEqual(0)
            expect(result.bass).toBeLessThanOrEqual(1)
            expect(result.mids).toBeGreaterThanOrEqual(0)
            expect(result.mids).toBeLessThanOrEqual(1)
            expect(result.treble).toBeGreaterThanOrEqual(0)
            expect(result.treble).toBeLessThanOrEqual(1)
            expect(result.overall).toBeGreaterThanOrEqual(0)
            expect(result.overall).toBeLessThanOrEqual(1)
            expect(result.spectrum).toHaveLength(1024)
            expect(result.timeData).toHaveLength(1024)
            expect(result.timestamp).toBeDefined()
            expect(result.analysisTime).toBeDefined()
            
            // Check advanced analysis data
            expect(result.advanced).toBeDefined()
            expect(result.advanced.spectrum).toBeDefined()
            expect(result.advanced.metrics).toBeDefined()
            expect(result.advanced.metrics.overallAmplitude).toBeGreaterThanOrEqual(0)
            expect(result.advanced.metrics.dominantRange).toBeDefined()
        })
        
        it('should return empty data when not initialized', () => {
            const uninitializedAnalyzer = new AudioAnalyzer()
            const result = uninitializedAnalyzer.getFrequencyData()
            
            expect(result.bass).toBe(0)
            expect(result.mids).toBe(0)
            expect(result.treble).toBe(0)
            expect(result.overall).toBe(0)
            expect(result.spectrum).toHaveLength(1024)
            expect(result.timeData).toHaveLength(1024)
        })
    })
    
    describe('Performance Monitoring', () => {
        beforeEach(async () => {
            await audioAnalyzer.initialize('microphone')
        })
        
        it('should track analysis performance', () => {
            // Mock performance.now to simulate time passage
            let timeCounter = 1000
            global.performance.now = vi.fn(() => timeCounter += 1)
            
            audioAnalyzer.getFrequencyData()
            
            const stats = audioAnalyzer.getPerformanceStats()
            expect(stats.frameCount).toBe(1)
            expect(stats.analysisTime).toBeGreaterThan(0)
            expect(stats.averageAnalysisTime).toBeGreaterThan(0)
        })
        
        it('should warn about slow analysis', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
            
            // Mock slow analysis
            let timeCounter = 1000
            global.performance.now = vi.fn(() => timeCounter += 5) // 5ms analysis time
            
            audioAnalyzer.getFrequencyData()
            
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Audio analysis took')
            )
            
            consoleSpy.mockRestore()
        })
    })
    
    describe('Frequency Configuration', () => {
        beforeEach(async () => {
            await audioAnalyzer.initialize('microphone')
        })
        
        it('should update frequency configuration', () => {
            const newConfig = {
                smoothingFactor: 0.9,
                normalizationMethod: 'rms',
                spectrumResolution: 512
            }
            
            audioAnalyzer.updateFrequencyConfig(newConfig)
            
            const config = audioAnalyzer.getFrequencyConfig()
            expect(config.smoothingFactor).toBe(0.9)
            expect(config.normalizationMethod).toBe('rms')
            expect(config.spectrumResolution).toBe(512)
        })
        
        it('should update frequency ranges', () => {
            const newRanges = {
                bass: { min: 20, max: 300, weight: 1.5 },
                mids: { min: 300, max: 5000, weight: 0.8 }
            }
            
            audioAnalyzer.updateFrequencyRanges(newRanges)
            
            const binInfo = audioAnalyzer.getFrequencyBinInfo()
            expect(binInfo.ranges.bass.weight).toBe(1.5)
            expect(binInfo.ranges.mids.weight).toBe(0.8)
            expect(binInfo.ranges.bass.maxFrequency).toBe(300)
        })
        
        it('should reset frequency analysis state', () => {
            // Generate some analysis to build state
            const mockFreqData = new Uint8Array(1024).fill(200)
            mockAnalyserNode.getByteFrequencyData.mockImplementation((array) => {
                array.set(mockFreqData)
            })
            
            audioAnalyzer.getFrequencyData()
            audioAnalyzer.resetFrequencyAnalysis()
            
            // After reset, should start fresh
            expect(() => audioAnalyzer.resetFrequencyAnalysis()).not.toThrow()
        })
        
        it('should get frequency configuration', () => {
            const config = audioAnalyzer.getFrequencyConfig()
            
            expect(config).toBeDefined()
            expect(config.frequencyRanges).toBeDefined()
            expect(config.smoothingEnabled).toBeDefined()
            expect(config.normalizationEnabled).toBeDefined()
            expect(config.spectrumResolution).toBeDefined()
        })
        
        it('should get frequency bin information', () => {
            const binInfo = audioAnalyzer.getFrequencyBinInfo()
            
            expect(binInfo).toBeDefined()
            expect(binInfo.ranges).toBeDefined()
            expect(binInfo.binWidth).toBeGreaterThan(0)
            expect(binInfo.nyquistFrequency).toBe(22050)
            expect(binInfo.totalBins).toBe(1024)
        })
    })

    describe('Resource Management', () => {
        it('should dispose resources properly', async () => {
            await audioAnalyzer.initialize('microphone')
            
            audioAnalyzer.dispose()
            
            expect(mockMediaStream.getTracks()[0].stop).toHaveBeenCalled()
            expect(mockMediaStreamSource.disconnect).toHaveBeenCalled()
            expect(mockAnalyserNode.disconnect).toHaveBeenCalled()
            expect(mockAudioContext.close).toHaveBeenCalled()
            expect(audioAnalyzer.isInitialized).toBe(false)
            expect(audioAnalyzer.mediaStream).toBeNull()
            expect(audioAnalyzer.microphone).toBeNull()
            expect(audioAnalyzer.analyserNode).toBeNull()
            expect(audioAnalyzer.audioContext).toBeNull()
        })
        
        it('should handle disposal when not initialized', () => {
            expect(() => audioAnalyzer.dispose()).not.toThrow()
        })
        
        it('should start and stop analysis', async () => {
            await audioAnalyzer.initialize('microphone')
            
            audioAnalyzer.startAnalysis()
            expect(audioAnalyzer.isAnalyzing).toBe(true)
            
            audioAnalyzer.stopAnalysis()
            expect(audioAnalyzer.isAnalyzing).toBe(false)
        })
    })
})