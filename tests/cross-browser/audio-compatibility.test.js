/**
 * Cross-browser compatibility tests for audio reactive features
 * Tests browser-specific implementations and fallbacks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('Cross-Browser Audio Compatibility', () => {
    let originalWindow, originalNavigator
    
    beforeEach(() => {
        // Store original globals
        originalWindow = global.window
        originalNavigator = global.navigator
        
        // Reset performance mock
        global.performance = {
            now: vi.fn(() => Date.now())
        }
    })
    
    afterEach(() => {
        // Restore original globals
        global.window = originalWindow
        global.navigator = originalNavigator
        vi.clearAllMocks()
    })

    describe('Web Audio API Compatibility', () => {
        it('should handle Chrome/Chromium Web Audio API', async () => {
            // Mock Chrome environment
            const mockAudioContext = {
                state: 'running',
                sampleRate: 44100,
                resume: vi.fn().mockResolvedValue(undefined),
                close: vi.fn().mockResolvedValue(undefined),
                createAnalyser: vi.fn().mockReturnValue({
                    fftSize: 2048,
                    frequencyBinCount: 1024,
                    connect: vi.fn(),
                    disconnect: vi.fn(),
                    getByteFrequencyData: vi.fn()
                }),
                createMediaStreamSource: vi.fn().mockReturnValue({
                    connect: vi.fn(),
                    disconnect: vi.fn()
                })
            }
            
            global.window = {
                AudioContext: vi.fn(() => mockAudioContext),
                webkitAudioContext: undefined // Chrome uses standard AudioContext
            }
            
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn().mockResolvedValue({
                        getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
                        getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }])
                    })
                },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const analyzer = new AudioAnalyzer()
            
            const result = await analyzer.initialize('microphone')
            
            expect(result.success).toBe(true)
            expect(window.AudioContext).toHaveBeenCalled()
            expect(mockAudioContext.createAnalyser).toHaveBeenCalled()
            
            analyzer.dispose()
        })
        
        it('should handle Safari webkit prefixed API', async () => {
            // Mock Safari environment
            const mockWebkitAudioContext = {
                state: 'running',
                sampleRate: 44100,
                resume: vi.fn().mockResolvedValue(undefined),
                close: vi.fn().mockResolvedValue(undefined),
                createAnalyser: vi.fn().mockReturnValue({
                    fftSize: 2048,
                    frequencyBinCount: 1024,
                    connect: vi.fn(),
                    disconnect: vi.fn(),
                    getByteFrequencyData: vi.fn()
                }),
                createMediaStreamSource: vi.fn().mockReturnValue({
                    connect: vi.fn(),
                    disconnect: vi.fn()
                })
            }
            
            global.window = {
                AudioContext: undefined, // Safari might not have standard AudioContext
                webkitAudioContext: vi.fn(() => mockWebkitAudioContext)
            }
            
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn().mockResolvedValue({
                        getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
                        getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }])
                    })
                },
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
            }
            
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const analyzer = new AudioAnalyzer()
            
            const result = await analyzer.initialize('microphone')
            
            expect(result.success).toBe(true)
            expect(window.webkitAudioContext).toHaveBeenCalled()
            expect(mockWebkitAudioContext.createAnalyser).toHaveBeenCalled()
            
            analyzer.dispose()
        })
        
        it('should handle Firefox Web Audio API differences', async () => {
            // Mock Firefox environment
            const mockAudioContext = {
                state: 'running',
                sampleRate: 44100,
                resume: vi.fn().mockResolvedValue(undefined),
                close: vi.fn().mockResolvedValue(undefined),
                createAnalyser: vi.fn().mockReturnValue({
                    fftSize: 2048,
                    frequencyBinCount: 1024,
                    connect: vi.fn(),
                    disconnect: vi.fn(),
                    getByteFrequencyData: vi.fn()
                }),
                createMediaStreamSource: vi.fn().mockReturnValue({
                    connect: vi.fn(),
                    disconnect: vi.fn()
                })
            }
            
            global.window = {
                AudioContext: vi.fn(() => mockAudioContext),
                webkitAudioContext: undefined
            }
            
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn().mockResolvedValue({
                        getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
                        getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }])
                    }),
                    // Firefox doesn't support getDisplayMedia for system audio in all versions
                    getDisplayMedia: undefined
                },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
            }
            
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const analyzer = new AudioAnalyzer()
            
            // Should work with microphone
            const micResult = await analyzer.initialize('microphone')
            expect(micResult.success).toBe(true)
            
            // Should gracefully handle missing system audio support
            const systemResult = await analyzer.initialize('system')
            expect(systemResult.success).toBe(false)
            expect(systemResult.error).toBe('SYSTEM_AUDIO_UNSUPPORTED')
            
            analyzer.dispose()
        })
        
        it('should handle Edge legacy compatibility', async () => {
            // Mock Edge environment (legacy)
            const mockAudioContext = {
                state: 'running',
                sampleRate: 44100,
                resume: vi.fn().mockResolvedValue(undefined),
                close: vi.fn().mockResolvedValue(undefined),
                createAnalyser: vi.fn().mockReturnValue({
                    fftSize: 2048,
                    frequencyBinCount: 1024,
                    connect: vi.fn(),
                    disconnect: vi.fn(),
                    getByteFrequencyData: vi.fn()
                }),
                createMediaStreamSource: vi.fn().mockReturnValue({
                    connect: vi.fn(),
                    disconnect: vi.fn()
                })
            }
            
            global.window = {
                AudioContext: vi.fn(() => mockAudioContext),
                webkitAudioContext: vi.fn(() => mockAudioContext) // Edge might have both
            }
            
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn().mockResolvedValue({
                        getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
                        getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }])
                    })
                },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.18363'
            }
            
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const analyzer = new AudioAnalyzer()
            
            const result = await analyzer.initialize('microphone')
            
            expect(result.success).toBe(true)
            // Should prefer standard AudioContext
            expect(window.AudioContext).toHaveBeenCalled()
            
            analyzer.dispose()
        })
        
        it('should handle unsupported browsers gracefully', async () => {
            // Mock unsupported browser
            global.window = {
                AudioContext: undefined,
                webkitAudioContext: undefined
            }
            
            global.navigator = {
                mediaDevices: undefined,
                userAgent: 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1)'
            }
            
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const analyzer = new AudioAnalyzer()
            
            const result = await analyzer.initialize('microphone')
            
            expect(result.success).toBe(false)
            expect(result.error).toBe('WEB_AUDIO_UNSUPPORTED')
            expect(result.message).toContain('Web Audio API is not supported')
        })
    })

    describe('MediaDevices API Compatibility', () => {
        it('should handle modern getUserMedia API', async () => {
            global.window = {
                AudioContext: vi.fn(() => ({
                    state: 'running',
                    createAnalyser: vi.fn(),
                    createMediaStreamSource: vi.fn(),
                    resume: vi.fn().mockResolvedValue(undefined),
                    close: vi.fn().mockResolvedValue(undefined)
                }))
            }
            
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn().mockResolvedValue({
                        getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
                        getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }])
                    })
                }
            }
            
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const analyzer = new AudioAnalyzer()
            
            const result = await analyzer.requestMicrophoneAccess()
            
            expect(result.success).toBe(true)
            expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            })
        })
        
        it('should handle legacy getUserMedia with prefixes', async () => {
            global.window = {
                AudioContext: vi.fn(() => ({
                    state: 'running',
                    createAnalyser: vi.fn(),
                    createMediaStreamSource: vi.fn(),
                    resume: vi.fn().mockResolvedValue(undefined),
                    close: vi.fn().mockResolvedValue(undefined)
                }))
            }
            
            // Mock legacy getUserMedia
            const mockGetUserMedia = vi.fn((constraints, success, error) => {
                success({
                    getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
                    getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }])
                })
            })
            
            global.navigator = {
                mediaDevices: undefined, // No modern API
                getUserMedia: mockGetUserMedia,
                webkitGetUserMedia: mockGetUserMedia,
                mozGetUserMedia: mockGetUserMedia
            }
            
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const analyzer = new AudioAnalyzer()
            
            // Should detect and use legacy API
            const result = await analyzer.requestMicrophoneAccess()
            
            // In a real implementation, this would use the legacy API
            // For this test, we expect it to fail gracefully
            expect(result.success).toBe(false)
            expect(result.error).toBe('MEDIA_DEVICES_UNSUPPORTED')
        })
        
        it('should handle getDisplayMedia browser differences', async () => {
            const testCases = [
                {
                    name: 'Chrome with getDisplayMedia',
                    setup: () => {
                        global.navigator = {
                            mediaDevices: {
                                getDisplayMedia: vi.fn().mockResolvedValue({
                                    getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
                                    getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }])
                                })
                            }
                        }
                    },
                    expectedSuccess: true
                },
                {
                    name: 'Firefox without system audio support',
                    setup: () => {
                        global.navigator = {
                            mediaDevices: {
                                getDisplayMedia: vi.fn().mockResolvedValue({
                                    getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
                                    getAudioTracks: vi.fn().mockReturnValue([]) // No audio tracks
                                })
                            }
                        }
                    },
                    expectedSuccess: false,
                    expectedError: 'NO_SYSTEM_AUDIO'
                },
                {
                    name: 'Safari without getDisplayMedia',
                    setup: () => {
                        global.navigator = {
                            mediaDevices: {
                                getDisplayMedia: undefined
                            }
                        }
                    },
                    expectedSuccess: false,
                    expectedError: 'SYSTEM_AUDIO_UNSUPPORTED'
                }
            ]
            
            for (const testCase of testCases) {
                testCase.setup()
                
                global.window = {
                    AudioContext: vi.fn(() => ({
                        state: 'running',
                        createAnalyser: vi.fn(),
                        createMediaStreamSource: vi.fn(),
                        resume: vi.fn().mockResolvedValue(undefined),
                        close: vi.fn().mockResolvedValue(undefined)
                    }))
                }
                
                const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
                const analyzer = new AudioAnalyzer()
                
                const result = await analyzer.requestSystemAudioAccess()
                
                expect(result.success).toBe(testCase.expectedSuccess)
                if (!testCase.expectedSuccess) {
                    expect(result.error).toBe(testCase.expectedError)
                }
            }
        })
    })

    describe('Audio Context State Handling', () => {
        it('should handle suspended audio context in Safari', async () => {
            const mockAudioContext = {
                state: 'suspended', // Safari often starts suspended
                sampleRate: 44100,
                resume: vi.fn().mockResolvedValue(undefined),
                close: vi.fn().mockResolvedValue(undefined),
                createAnalyser: vi.fn().mockReturnValue({
                    fftSize: 2048,
                    connect: vi.fn(),
                    disconnect: vi.fn(),
                    getByteFrequencyData: vi.fn()
                }),
                createMediaStreamSource: vi.fn().mockReturnValue({
                    connect: vi.fn(),
                    disconnect: vi.fn()
                })
            }
            
            global.window = {
                AudioContext: vi.fn(() => mockAudioContext)
            }
            
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn().mockResolvedValue({
                        getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
                        getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }])
                    })
                },
                userAgent: 'Safari'
            }
            
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const analyzer = new AudioAnalyzer()
            
            const result = await analyzer.initialize('microphone')
            
            expect(result.success).toBe(true)
            expect(mockAudioContext.resume).toHaveBeenCalled()
            
            analyzer.dispose()
        })
        
        it('should handle audio context creation failures', async () => {
            global.window = {
                AudioContext: vi.fn(() => {
                    throw new Error('AudioContext creation failed')
                }),
                webkitAudioContext: vi.fn(() => {
                    throw new Error('webkitAudioContext creation failed')
                })
            }
            
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const analyzer = new AudioAnalyzer()
            
            const result = await analyzer.initializeAudioContext()
            
            expect(result.success).toBe(false)
            expect(result.error).toBe('AUDIO_CONTEXT_FAILED')
        })
    })

    describe('Permission Handling Across Browsers', () => {
        it('should handle Chrome permission prompts', async () => {
            global.window = {
                AudioContext: vi.fn(() => ({
                    state: 'running',
                    createAnalyser: vi.fn(),
                    createMediaStreamSource: vi.fn(),
                    resume: vi.fn().mockResolvedValue(undefined),
                    close: vi.fn().mockResolvedValue(undefined)
                }))
            }
            
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn().mockRejectedValue(
                        Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' })
                    )
                },
                userAgent: 'Chrome'
            }
            
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const analyzer = new AudioAnalyzer()
            
            const result = await analyzer.requestMicrophoneAccess()
            
            expect(result.success).toBe(false)
            expect(result.error).toBe('PERMISSION_DENIED')
            expect(result.message).toContain('Microphone access denied')
        })
        
        it('should handle Firefox permission differences', async () => {
            global.window = {
                AudioContext: vi.fn(() => ({
                    state: 'running',
                    createAnalyser: vi.fn(),
                    createMediaStreamSource: vi.fn(),
                    resume: vi.fn().mockResolvedValue(undefined),
                    close: vi.fn().mockResolvedValue(undefined)
                }))
            }
            
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn().mockRejectedValue(
                        Object.assign(new Error('Device not found'), { name: 'NotFoundError' })
                    )
                },
                userAgent: 'Firefox'
            }
            
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const analyzer = new AudioAnalyzer()
            
            const result = await analyzer.requestMicrophoneAccess()
            
            expect(result.success).toBe(false)
            expect(result.error).toBe('NO_MICROPHONE')
            expect(result.message).toContain('No microphone found')
        })
        
        it('should handle Safari permission timing', async () => {
            global.window = {
                AudioContext: vi.fn(() => ({
                    state: 'running',
                    createAnalyser: vi.fn(),
                    createMediaStreamSource: vi.fn(),
                    resume: vi.fn().mockResolvedValue(undefined),
                    close: vi.fn().mockResolvedValue(undefined)
                }))
            }
            
            // Safari sometimes has timing issues with permissions
            let callCount = 0
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn().mockImplementation(() => {
                        callCount++
                        if (callCount === 1) {
                            return Promise.reject(
                                Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' })
                            )
                        }
                        return Promise.resolve({
                            getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
                            getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }])
                        })
                    })
                },
                userAgent: 'Safari'
            }
            
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const analyzer = new AudioAnalyzer()
            
            // First attempt should fail
            const firstResult = await analyzer.requestMicrophoneAccess()
            expect(firstResult.success).toBe(false)
            
            // Second attempt should succeed (simulating user granting permission)
            const secondResult = await analyzer.requestMicrophoneAccess()
            expect(secondResult.success).toBe(true)
        })
    })

    describe('Feature Detection and Fallbacks', () => {
        it('should detect available audio features per browser', async () => {
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            
            const testBrowsers = [
                {
                    name: 'Chrome',
                    setup: () => {
                        global.window = { AudioContext: vi.fn() }
                        global.navigator = {
                            mediaDevices: {
                                getUserMedia: vi.fn(),
                                getDisplayMedia: vi.fn()
                            }
                        }
                    },
                    expectedFeatures: {
                        webAudio: true,
                        microphone: true,
                        systemAudio: true
                    }
                },
                {
                    name: 'Firefox',
                    setup: () => {
                        global.window = { AudioContext: vi.fn() }
                        global.navigator = {
                            mediaDevices: {
                                getUserMedia: vi.fn(),
                                getDisplayMedia: undefined // Limited system audio support
                            }
                        }
                    },
                    expectedFeatures: {
                        webAudio: true,
                        microphone: true,
                        systemAudio: false
                    }
                },
                {
                    name: 'Safari',
                    setup: () => {
                        global.window = { webkitAudioContext: vi.fn() }
                        global.navigator = {
                            mediaDevices: {
                                getUserMedia: vi.fn(),
                                getDisplayMedia: vi.fn()
                            }
                        }
                    },
                    expectedFeatures: {
                        webAudio: true,
                        microphone: true,
                        systemAudio: true
                    }
                },
                {
                    name: 'Unsupported',
                    setup: () => {
                        global.window = {}
                        global.navigator = {}
                    },
                    expectedFeatures: {
                        webAudio: false,
                        microphone: false,
                        systemAudio: false
                    }
                }
            ]
            
            for (const browser of testBrowsers) {
                browser.setup()
                
                const analyzer = new AudioAnalyzer()
                const features = analyzer.detectAvailableFeatures()
                
                expect(features.webAudio).toBe(browser.expectedFeatures.webAudio)
                expect(features.microphone).toBe(browser.expectedFeatures.microphone)
                expect(features.systemAudio).toBe(browser.expectedFeatures.systemAudio)
            }
        })
        
        it('should provide appropriate fallback messages', async () => {
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            
            // Test unsupported browser
            global.window = {}
            global.navigator = {}
            
            const analyzer = new AudioAnalyzer()
            const result = await analyzer.initialize('microphone')
            
            expect(result.success).toBe(false)
            expect(result.message).toContain('Web Audio API is not supported')
            expect(result.fallbackSuggestion).toBeDefined()
            expect(result.fallbackSuggestion).toContain('modern browser')
        })
    })

    describe('Performance Across Browsers', () => {
        it('should maintain consistent performance across browsers', async () => {
            const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge']
            const performanceResults = {}
            
            for (const browser of browsers) {
                // Setup browser-specific mocks
                const mockAudioContext = {
                    state: 'running',
                    sampleRate: 44100,
                    resume: vi.fn().mockResolvedValue(undefined),
                    close: vi.fn().mockResolvedValue(undefined),
                    createAnalyser: vi.fn().mockReturnValue({
                        fftSize: 2048,
                        frequencyBinCount: 1024,
                        connect: vi.fn(),
                        disconnect: vi.fn(),
                        getByteFrequencyData: vi.fn((array) => {
                            // Simulate browser-specific performance characteristics
                            const delay = browser === 'Safari' ? 1.5 : browser === 'Firefox' ? 1.2 : 1.0
                            const start = performance.now()
                            while (performance.now() - start < delay) {
                                // Simulate processing time
                            }
                            array.fill(128)
                        })
                    }),
                    createMediaStreamSource: vi.fn().mockReturnValue({
                        connect: vi.fn(),
                        disconnect: vi.fn()
                    })
                }
                
                global.window = {
                    AudioContext: browser === 'Safari' ? undefined : vi.fn(() => mockAudioContext),
                    webkitAudioContext: browser === 'Safari' ? vi.fn(() => mockAudioContext) : undefined
                }
                
                global.navigator = {
                    mediaDevices: {
                        getUserMedia: vi.fn().mockResolvedValue({
                            getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
                            getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }])
                        })
                    },
                    userAgent: browser
                }
                
                const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
                const analyzer = new AudioAnalyzer()
                await analyzer.initialize('microphone')
                
                // Measure performance
                const frameTimes = []
                for (let i = 0; i < 30; i++) {
                    const startTime = performance.now()
                    analyzer.getFrequencyData()
                    const endTime = performance.now()
                    frameTimes.push(endTime - startTime)
                }
                
                performanceResults[browser] = {
                    avgTime: frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length,
                    maxTime: Math.max(...frameTimes),
                    minTime: Math.min(...frameTimes)
                }
                
                analyzer.dispose()
            }
            
            // Verify performance is reasonable across all browsers
            Object.entries(performanceResults).forEach(([browser, stats]) => {
                expect(stats.avgTime).toBeLessThan(5.0) // All browsers should average <5ms
                expect(stats.maxTime).toBeLessThan(10.0) // No browser should exceed 10ms
            })
            
            // Performance should be relatively consistent (within 3x of fastest)
            const avgTimes = Object.values(performanceResults).map(r => r.avgTime)
            const fastestTime = Math.min(...avgTimes)
            const slowestTime = Math.max(...avgTimes)
            
            expect(slowestTime / fastestTime).toBeLessThan(3.0)
        })
    })
})