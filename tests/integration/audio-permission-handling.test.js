/**
 * Integration tests for audio permission handling
 * Tests various permission scenarios and user interactions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('Audio Permission Handling Integration', () => {
    let mockAudioContext, mockAnalyserNode
    
    beforeEach(() => {
        // Mock Web Audio API
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
        
        global.performance = {
            now: vi.fn(() => Date.now())
        }
    })
    
    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('Microphone Permission Scenarios', () => {
        it('should handle initial permission grant', async () => {
            const mockStream = {
                getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
                getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }])
            }
            
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn().mockResolvedValue(mockStream)
                }
            }
            
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const analyzer = new AudioAnalyzer()
            
            const result = await analyzer.initialize('microphone')
            
            expect(result.success).toBe(true)
            expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            })
            expect(analyzer.isInitialized).toBe(true)
            
            analyzer.dispose()
        })
        
        it('should handle permission denial gracefully', async () => {
            const permissionError = new Error('Permission denied by user')
            permissionError.name = 'NotAllowedError'
            
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn().mockRejectedValue(permissionError)
                }
            }
            
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const analyzer = new AudioAnalyzer()
            
            const result = await analyzer.initialize('microphone')
            
            expect(result.success).toBe(false)
            expect(result.error).toBe('PERMISSION_DENIED')
            expect(result.message).toContain('Microphone access denied')
            expect(result.userAction).toContain('enable microphone permissions')
            expect(analyzer.isInitialized).toBe(false)
        })
        
        it('should handle no microphone device found', async () => {
            const deviceError = new Error('No audio input devices found')
            deviceError.name = 'NotFoundError'
            
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn().mockRejectedValue(deviceError)
                }
            }
            
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const analyzer = new AudioAnalyzer()
            
            const result = await analyzer.initialize('microphone')
            
            expect(result.success).toBe(false)
            expect(result.error).toBe('NO_MICROPHONE')
            expect(result.message).toContain('No microphone found')
            expect(result.userAction).toContain('connect an audio input device')
        })
        
        it('should handle microphone already in use', async () => {
            const busyError = new Error('Microphone is already in use')
            busyError.name = 'NotReadableError'
            
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn().mockRejectedValue(busyError)
                }
            }
            
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const analyzer = new AudioAnalyzer()
            
            const result = await analyzer.initialize('microphone')
            
            expect(result.success).toBe(false)
            expect(result.error).toBe('MICROPHONE_BUSY')
            expect(result.message).toContain('Microphone is already in use')
            expect(result.userAction).toContain('close other applications')
        })
        
        it('should handle overconstrained audio settings', async () => {
            const constraintError = new Error('Constraints cannot be satisfied')
            constraintError.name = 'OverconstrainedError'
            constraintError.constraint = 'echoCancellation'
            
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn().mockRejectedValue(constraintError)
                }
            }
            
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const analyzer = new AudioAnalyzer()
            
            const result = await analyzer.initialize('microphone')
            
            expect(result.success).toBe(false)
            expect(result.error).toBe('CONSTRAINT_ERROR')
            expect(result.message).toContain('Audio constraints cannot be satisfied')
            expect(result.constraint).toBe('echoCancellation')
        })
    })

    describe('System Audio Permission Scenarios', () => {
        it('should handle system audio permission grant', async () => {
            const mockStream = {
                getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
                getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }])
            }
            
            global.navigator = {
                mediaDevices: {
                    getDisplayMedia: vi.fn().mockResolvedValue(mockStream)
                }
            }
            
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const analyzer = new AudioAnalyzer()
            
            const result = await analyzer.initialize('system')
            
            expect(result.success).toBe(true)
            expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledWith({
                audio: true,
                video: false
            })
            expect(analyzer.isInitialized).toBe(true)
            
            analyzer.dispose()
        })
        
        it('should handle system audio permission denial', async () => {
            const permissionError = new Error('Screen sharing permission denied')
            permissionError.name = 'NotAllowedError'
            
            global.navigator = {
                mediaDevices: {
                    getDisplayMedia: vi.fn().mockRejectedValue(permissionError)
                }
            }
            
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const analyzer = new AudioAnalyzer()
            
            const result = await analyzer.initialize('system')
            
            expect(result.success).toBe(false)
            expect(result.error).toBe('PERMISSION_DENIED')
            expect(result.message).toContain('System audio access denied')
            expect(result.userAction).toContain('allow screen sharing')
        })
        
        it('should handle system audio not available', async () => {
            const mockStream = {
                getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
                getAudioTracks: vi.fn().mockReturnValue([]) // No audio tracks
            }
            
            global.navigator = {
                mediaDevices: {
                    getDisplayMedia: vi.fn().mockResolvedValue(mockStream)
                }
            }
            
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const analyzer = new AudioAnalyzer()
            
            const result = await analyzer.initialize('system')
            
            expect(result.success).toBe(false)
            expect(result.error).toBe('NO_SYSTEM_AUDIO')
            expect(result.message).toContain('No system audio available')
            expect(result.userAction).toContain('ensure audio is playing')
        })
        
        it('should handle unsupported system audio capture', async () => {
            global.navigator = {
                mediaDevices: {
                    getDisplayMedia: undefined // Not supported
                }
            }
            
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const analyzer = new AudioAnalyzer()
            
            const result = await analyzer.initialize('system')
            
            expect(result.success).toBe(false)
            expect(result.error).toBe('SYSTEM_AUDIO_UNSUPPORTED')
            expect(result.message).toContain('System audio capture is not supported')
            expect(result.fallbackSuggestion).toContain('microphone input')
        })
    })

    describe('Permission State Management', () => {
        it('should track permission state changes', async () => {
            const mockStream = {
                getTracks: vi.fn().mockReturnValue([{ 
                    stop: vi.fn(),
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn()
                }]),
                getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }])
            }
            
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn().mockResolvedValue(mockStream)
                }
            }
            
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const analyzer = new AudioAnalyzer()
            
            // Initial state
            expect(analyzer.getPermissionState()).toBe('unknown')
            
            // After successful initialization
            await analyzer.initialize('microphone')
            expect(analyzer.getPermissionState()).toBe('granted')
            
            // Simulate permission revocation
            analyzer.handlePermissionRevoked()
            expect(analyzer.getPermissionState()).toBe('denied')
            
            analyzer.dispose()
        })
        
        it('should handle permission state queries', async () => {
            // Mock Permissions API
            global.navigator.permissions = {
                query: vi.fn().mockResolvedValue({
                    state: 'granted',
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn()
                })
            }
            
            global.navigator.mediaDevices = {
                getUserMedia: vi.fn().mockResolvedValue({
                    getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
                    getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }])
                })
            }
            
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const analyzer = new AudioAnalyzer()
            
            const permissionState = await analyzer.queryPermissionState('microphone')
            
            expect(permissionState.state).toBe('granted')
            expect(navigator.permissions.query).toHaveBeenCalledWith({ name: 'microphone' })
        })
        
        it('should handle permission state changes during runtime', async () => {
            const mockStream = {
                getTracks: vi.fn().mockReturnValue([{ 
                    stop: vi.fn(),
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn()
                }]),
                getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }])
            }
            
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn().mockResolvedValue(mockStream)
                }
            }
            
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const analyzer = new AudioAnalyzer()
            
            await analyzer.initialize('microphone')
            
            const permissionChangeHandler = vi.fn()
            analyzer.onPermissionChange(permissionChangeHandler)
            
            // Simulate track ending (permission revoked)
            const track = mockStream.getTracks()[0]
            const endHandler = track.addEventListener.mock.calls
                .find(call => call[0] === 'ended')?.[1]
            
            if (endHandler) {
                endHandler()
            }
            
            expect(permissionChangeHandler).toHaveBeenCalledWith({
                state: 'denied',
                reason: 'track_ended'
            })
            
            analyzer.dispose()
        })
    })

    describe('User Feedback and Guidance', () => {
        it('should provide clear error messages for permission issues', async () => {
            const testCases = [
                {
                    error: { name: 'NotAllowedError', message: 'Permission denied' },
                    expectedError: 'PERMISSION_DENIED',
                    expectedGuidance: 'Click the microphone icon in your browser'
                },
                {
                    error: { name: 'NotFoundError', message: 'No devices found' },
                    expectedError: 'NO_MICROPHONE',
                    expectedGuidance: 'Please connect a microphone'
                },
                {
                    error: { name: 'NotReadableError', message: 'Device in use' },
                    expectedError: 'MICROPHONE_BUSY',
                    expectedGuidance: 'Close other applications using the microphone'
                }
            ]
            
            for (const testCase of testCases) {
                global.navigator = {
                    mediaDevices: {
                        getUserMedia: vi.fn().mockRejectedValue(testCase.error)
                    }
                }
                
                const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
                const analyzer = new AudioAnalyzer()
                
                const result = await analyzer.initialize('microphone')
                
                expect(result.success).toBe(false)
                expect(result.error).toBe(testCase.expectedError)
                expect(result.userAction).toContain(testCase.expectedGuidance)
                expect(result.troubleshooting).toBeDefined()
                expect(result.troubleshooting.length).toBeGreaterThan(0)
            }
        })
        
        it('should provide browser-specific guidance', async () => {
            const browsers = [
                {
                    userAgent: 'Chrome',
                    expectedGuidance: 'chrome://settings/content/microphone'
                },
                {
                    userAgent: 'Firefox',
                    expectedGuidance: 'about:preferences#privacy'
                },
                {
                    userAgent: 'Safari',
                    expectedGuidance: 'Safari > Preferences > Websites'
                }
            ]
            
            for (const browser of browsers) {
                const permissionError = new Error('Permission denied')
                permissionError.name = 'NotAllowedError'
                
                global.navigator = {
                    mediaDevices: {
                        getUserMedia: vi.fn().mockRejectedValue(permissionError)
                    },
                    userAgent: browser.userAgent
                }
                
                const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
                const analyzer = new AudioAnalyzer()
                
                const result = await analyzer.initialize('microphone')
                
                expect(result.success).toBe(false)
                expect(result.browserSpecificGuidance).toContain(browser.expectedGuidance)
            }
        })
        
        it('should provide step-by-step troubleshooting', async () => {
            const permissionError = new Error('Permission denied')
            permissionError.name = 'NotAllowedError'
            
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn().mockRejectedValue(permissionError)
                }
            }
            
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const analyzer = new AudioAnalyzer()
            
            const result = await analyzer.initialize('microphone')
            
            expect(result.troubleshooting).toEqual([
                'Check if microphone is connected and working',
                'Look for microphone permission prompt in browser',
                'Click "Allow" when prompted for microphone access',
                'Check browser settings for microphone permissions',
                'Refresh the page and try again',
                'Try using a different browser if issues persist'
            ])
        })
    })

    describe('Permission Recovery and Retry', () => {
        it('should support permission retry after denial', async () => {
            let attemptCount = 0
            const mockGetUserMedia = vi.fn().mockImplementation(() => {
                attemptCount++
                if (attemptCount === 1) {
                    const error = new Error('Permission denied')
                    error.name = 'NotAllowedError'
                    return Promise.reject(error)
                }
                return Promise.resolve({
                    getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
                    getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }])
                })
            })
            
            global.navigator = {
                mediaDevices: {
                    getUserMedia: mockGetUserMedia
                }
            }
            
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const analyzer = new AudioAnalyzer()
            
            // First attempt should fail
            const firstResult = await analyzer.initialize('microphone')
            expect(firstResult.success).toBe(false)
            expect(firstResult.error).toBe('PERMISSION_DENIED')
            
            // Retry should succeed
            const retryResult = await analyzer.retryInitialization()
            expect(retryResult.success).toBe(true)
            expect(analyzer.isInitialized).toBe(true)
            
            analyzer.dispose()
        })
        
        it('should handle automatic reconnection after permission loss', async () => {
            const mockStream = {
                getTracks: vi.fn().mockReturnValue([{ 
                    stop: vi.fn(),
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn()
                }]),
                getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }])
            }
            
            let reconnectAttempt = false
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn().mockImplementation(() => {
                        if (reconnectAttempt) {
                            return Promise.resolve(mockStream)
                        }
                        return Promise.resolve(mockStream)
                    })
                }
            }
            
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const analyzer = new AudioAnalyzer()
            
            await analyzer.initialize('microphone')
            
            const reconnectionHandler = vi.fn()
            analyzer.onReconnectionAttempt(reconnectionHandler)
            
            // Simulate permission loss
            analyzer.handlePermissionRevoked()
            
            // Should attempt automatic reconnection
            reconnectAttempt = true
            const reconnectResult = await analyzer.attemptReconnection()
            
            expect(reconnectResult.success).toBe(true)
            expect(reconnectionHandler).toHaveBeenCalled()
            
            analyzer.dispose()
        })
        
        it('should limit retry attempts to prevent spam', async () => {
            const permissionError = new Error('Permission denied')
            permissionError.name = 'NotAllowedError'
            
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn().mockRejectedValue(permissionError)
                }
            }
            
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const analyzer = new AudioAnalyzer()
            
            // Attempt multiple retries
            const results = []
            for (let i = 0; i < 5; i++) {
                const result = await analyzer.retryInitialization()
                results.push(result)
            }
            
            // Should limit retry attempts
            const lastResult = results[results.length - 1]
            expect(lastResult.success).toBe(false)
            expect(lastResult.error).toBe('MAX_RETRIES_EXCEEDED')
            expect(lastResult.message).toContain('Maximum retry attempts exceeded')
        })
    })

    describe('Integration with Audio Effects', () => {
        it('should gracefully disable audio effects when permissions denied', async () => {
            const permissionError = new Error('Permission denied')
            permissionError.name = 'NotAllowedError'
            
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn().mockRejectedValue(permissionError)
                }
            }
            
            // Mock FluxApp
            const mockFluxApp = {
                particleRenderer: {
                    audioReactiveEnabled: false,
                    enableAudioReactive: vi.fn(),
                    disableAudioReactive: vi.fn()
                }
            }
            
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const { AudioEffects } = await import('../../src/audio/audio-effects.js')
            
            const analyzer = new AudioAnalyzer()
            const effects = new AudioEffects(mockFluxApp)
            
            const result = await analyzer.initialize('microphone')
            
            expect(result.success).toBe(false)
            
            // Effects should remain disabled
            effects.handleAudioInitializationFailure(result)
            expect(mockFluxApp.particleRenderer.disableAudioReactive).toHaveBeenCalled()
            expect(effects.isEnabled).toBe(false)
        })
        
        it('should enable audio effects after successful permission grant', async () => {
            const mockStream = {
                getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
                getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }])
            }
            
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn().mockResolvedValue(mockStream)
                }
            }
            
            // Mock FluxApp
            const mockFluxApp = {
                particleRenderer: {
                    audioReactiveEnabled: false,
                    enableAudioReactive: vi.fn(),
                    disableAudioReactive: vi.fn()
                }
            }
            
            const { AudioAnalyzer } = await import('../../src/audio/audio-analyzer.js')
            const { AudioEffects } = await import('../../src/audio/audio-effects.js')
            
            const analyzer = new AudioAnalyzer()
            const effects = new AudioEffects(mockFluxApp)
            
            const result = await analyzer.initialize('microphone')
            
            expect(result.success).toBe(true)
            
            // Effects should be enabled
            effects.handleAudioInitializationSuccess(result)
            expect(mockFluxApp.particleRenderer.enableAudioReactive).toHaveBeenCalled()
            expect(effects.isEnabled).toBe(true)
            
            analyzer.dispose()
        })
    })
})