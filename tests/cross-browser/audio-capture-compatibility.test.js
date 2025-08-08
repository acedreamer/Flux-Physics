/**
 * Cross-browser compatibility tests for audio capture functionality
 * Tests system audio capture, microphone access, and fallback handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AudioSourceManager } from '../../src/audio/core/audio-source-manager.js'

describe('Audio Capture Cross-Browser Compatibility', () => {
    let sourceManager
    let mockAudioContext
    let originalNavigator
    let originalWindow
    
    beforeEach(() => {
        // Store original objects
        originalNavigator = global.navigator
        originalWindow = global.window
        
        // Mock AudioContext
        mockAudioContext = {
            createMediaStreamSource: vi.fn().mockReturnValue({
                connect: vi.fn(),
                disconnect: vi.fn()
            }),
            state: 'running',
            resume: vi.fn().mockResolvedValue(),
            close: vi.fn().mockResolvedValue()
        }
        
        // Setup basic window mock
        global.window = {
            AudioContext: vi.fn(() => mockAudioContext),
            webkitAudioContext: vi.fn(() => mockAudioContext),
            MediaRecorder: vi.fn(),
            performance: {
                now: vi.fn(() => Date.now())
            }
        }
        
        sourceManager = new AudioSourceManager()
    })
    
    afterEach(() => {
        if (sourceManager) {
            sourceManager.dispose()
        }
        
        // Restore original objects
        global.navigator = originalNavigator
        global.window = originalWindow
    })
    
    describe('Browser Capability Detection', () => {
        it('should detect getUserMedia support in modern browsers', () => {
            // Mock modern browser with getUserMedia
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn(),
                    getDisplayMedia: vi.fn()
                },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            const manager = new AudioSourceManager()
            const capabilities = manager.detectCapabilities()
            
            expect(capabilities.getUserMedia).toBe(true)
            expect(capabilities.getDisplayMedia).toBe(true)
            expect(capabilities.webAudio).toBe(true)
        })
        
        it('should detect limited support in older browsers', () => {
            // Mock older browser without getDisplayMedia
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn()
                    // No getDisplayMedia
                },
                userAgent: 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)'
            }
            
            const manager = new AudioSourceManager()
            const capabilities = manager.detectCapabilities()
            
            expect(capabilities.getUserMedia).toBe(true)
            expect(capabilities.getDisplayMedia).toBe(false)
            expect(capabilities.systemAudio).toBe(false)
        })
        
        it('should detect Chrome system audio support', () => {
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn(),
                    getDisplayMedia: vi.fn()
                },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            const manager = new AudioSourceManager()
            const capabilities = manager.detectCapabilities()
            
            expect(capabilities.systemAudio).toBe(true)
        })
        
        it('should detect Edge system audio support', () => {
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn(),
                    getDisplayMedia: vi.fn()
                },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59'
            }
            
            const manager = new AudioSourceManager()
            const capabilities = manager.detectCapabilities()
            
            expect(capabilities.systemAudio).toBe(true)
        })
        
        it('should not detect system audio support in Firefox', () => {
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn(),
                    getDisplayMedia: vi.fn()
                },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
            }
            
            const manager = new AudioSourceManager()
            const capabilities = manager.detectCapabilities()
            
            expect(capabilities.getDisplayMedia).toBe(true)
            expect(capabilities.systemAudio).toBe(false) // Firefox doesn't support system audio
        })
        
        it('should handle missing mediaDevices API', () => {
            global.navigator = {
                // No mediaDevices
                userAgent: 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)'
            }
            
            const manager = new AudioSourceManager()
            const capabilities = manager.detectCapabilities()
            
            expect(capabilities.getUserMedia).toBe(false)
            expect(capabilities.getDisplayMedia).toBe(false)
            expect(capabilities.systemAudio).toBe(false)
        })
    })
    
    describe('Microphone Access Compatibility', () => {
        beforeEach(() => {
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn(),
                    getDisplayMedia: vi.fn()
                },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        })
        
        it('should handle successful microphone access', async () => {
            const mockStream = {
                getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }]),
                getTracks: vi.fn().mockReturnValue([])
            }
            
            global.navigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream)
            
            await sourceManager.initialize(mockAudioContext)
            const result = await sourceManager.connectSource('microphone')
            
            expect(result.success).toBe(true)
            expect(result.source).toBe('microphone')
        })
        
        it('should handle permission denied error', async () => {
            const permissionError = new Error('Permission denied')
            permissionError.name = 'NotAllowedError'
            
            global.navigator.mediaDevices.getUserMedia.mockRejectedValue(permissionError)
            
            await sourceManager.initialize(mockAudioContext)
            const result = await sourceManager.connectSource('microphone')
            
            expect(result.success).toBe(false)
            expect(result.error).toBe('MICROPHONE_PERMISSION_DENIED')
            expect(result.instructions).toBeDefined()
        })
        
        it('should handle no microphone found error', async () => {
            const notFoundError = new Error('No microphone found')
            notFoundError.name = 'NotFoundError'
            
            global.navigator.mediaDevices.getUserMedia.mockRejectedValue(notFoundError)
            
            await sourceManager.initialize(mockAudioContext)
            const result = await sourceManager.connectSource('microphone')
            
            expect(result.success).toBe(false)
            expect(result.error).toBe('NO_MICROPHONE_DEVICE')
            expect(result.instructions).toBeDefined()
        })
        
        it('should handle microphone busy error', async () => {
            const busyError = new Error('Microphone busy')
            busyError.name = 'NotReadableError'
            
            global.navigator.mediaDevices.getUserMedia.mockRejectedValue(busyError)
            
            await sourceManager.initialize(mockAudioContext)
            const result = await sourceManager.connectSource('microphone')
            
            expect(result.success).toBe(false)
            expect(result.error).toBe('MICROPHONE_HARDWARE_ERROR')
        })
    })
    
    describe('System Audio Capture Compatibility', () => {
        beforeEach(() => {
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn(),
                    getDisplayMedia: vi.fn()
                },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        })
        
        it('should handle successful system audio capture in Chrome', async () => {
            const mockStream = {
                getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }]),
                getVideoTracks: vi.fn().mockReturnValue([]),
                getTracks: vi.fn().mockReturnValue([])
            }
            
            global.navigator.mediaDevices.getDisplayMedia.mockResolvedValue(mockStream)
            
            await sourceManager.initialize(mockAudioContext)
            const result = await sourceManager.connectSource('system')
            
            expect(result.success).toBe(true)
            expect(result.source).toBe('system')
        })
        
        it('should handle system audio not available', async () => {
            const mockStream = {
                getAudioTracks: vi.fn().mockReturnValue([]), // No audio tracks
                getVideoTracks: vi.fn().mockReturnValue([]),
                getTracks: vi.fn().mockReturnValue([])
            }
            
            global.navigator.mediaDevices.getDisplayMedia.mockResolvedValue(mockStream)
            
            await sourceManager.initialize(mockAudioContext)
            const result = await sourceManager.connectSource('system')
            
            expect(result.success).toBe(false)
            expect(result.error).toBe('NO_SYSTEM_AUDIO')
            expect(result.instructions).toBeDefined()
        })
        
        it('should handle permission denied for system audio', async () => {
            const permissionError = new Error('Permission denied')
            permissionError.name = 'NotAllowedError'
            
            global.navigator.mediaDevices.getDisplayMedia.mockRejectedValue(permissionError)
            
            await sourceManager.initialize(mockAudioContext)
            const result = await sourceManager.connectSource('system')
            
            expect(result.success).toBe(false)
            expect(result.error).toBe('SYSTEM_AUDIO_PERMISSION_DENIED')
            expect(result.instructions).toBeDefined()
        })
        
        it('should handle unsupported browser for system audio', async () => {
            // Mock Firefox (no system audio support)
            global.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
            
            const manager = new AudioSourceManager()
            await manager.initialize(mockAudioContext)
            const result = await manager.connectSource('system')
            
            expect(result.success).toBe(false)
            expect(result.error).toBe('SYSTEM_AUDIO_LIMITED')
        })
        
        it('should handle missing getDisplayMedia API', async () => {
            // Remove getDisplayMedia
            delete global.navigator.mediaDevices.getDisplayMedia
            
            const manager = new AudioSourceManager()
            await manager.initialize(mockAudioContext)
            const result = await manager.connectSource('system')
            
            expect(result.success).toBe(false)
            expect(result.error).toBe('SYSTEM_AUDIO_UNSUPPORTED')
        })
    })
    
    describe('Fallback Handling', () => {
        beforeEach(() => {
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn(),
                    getDisplayMedia: vi.fn()
                },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        })
        
        it('should fallback from system to microphone when system audio fails', async () => {
            // System audio fails
            const systemError = new Error('System audio not available')
            systemError.name = 'NotAllowedError'
            global.navigator.mediaDevices.getDisplayMedia.mockRejectedValue(systemError)
            
            // Microphone succeeds
            const mockMicStream = {
                getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }]),
                getTracks: vi.fn().mockReturnValue([])
            }
            global.navigator.mediaDevices.getUserMedia.mockResolvedValue(mockMicStream)
            
            await sourceManager.initialize(mockAudioContext)
            const result = await sourceManager.connectSource('system', { allowFallback: true })
            
            expect(result.success).toBe(true)
            expect(result.source).toBe('microphone')
            expect(result.fallbackUsed).toBe(true)
            expect(result.originalSource).toBe('system')
        })
        
        it('should fallback from microphone to system when microphone fails', async () => {
            // Microphone fails
            const micError = new Error('Microphone not available')
            micError.name = 'NotFoundError'
            global.navigator.mediaDevices.getUserMedia.mockRejectedValue(micError)
            
            // System audio succeeds
            const mockSystemStream = {
                getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }]),
                getVideoTracks: vi.fn().mockReturnValue([]),
                getTracks: vi.fn().mockReturnValue([])
            }
            global.navigator.mediaDevices.getDisplayMedia.mockResolvedValue(mockSystemStream)
            
            await sourceManager.initialize(mockAudioContext)
            const result = await sourceManager.connectSource('microphone', { allowFallback: true })
            
            expect(result.success).toBe(true)
            expect(result.source).toBe('system')
            expect(result.fallbackUsed).toBe(true)
            expect(result.originalSource).toBe('microphone')
        })
        
        it('should not fallback when explicitly disabled', async () => {
            const systemError = new Error('System audio not available')
            systemError.name = 'NotAllowedError'
            global.navigator.mediaDevices.getDisplayMedia.mockRejectedValue(systemError)
            
            await sourceManager.initialize(mockAudioContext)
            const result = await sourceManager.connectSource('system', { allowFallback: false })
            
            expect(result.success).toBe(false)
            expect(result.fallbackUsed).toBeUndefined()
        })
    })
    
    describe('Source Switching', () => {
        beforeEach(() => {
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn(),
                    getDisplayMedia: vi.fn()
                },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        })
        
        it('should successfully switch between sources', async () => {
            const mockMicStream = {
                getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }]),
                getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }])
            }
            
            const mockSystemStream = {
                getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }]),
                getVideoTracks: vi.fn().mockReturnValue([]),
                getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }])
            }
            
            global.navigator.mediaDevices.getUserMedia.mockResolvedValue(mockMicStream)
            global.navigator.mediaDevices.getDisplayMedia.mockResolvedValue(mockSystemStream)
            
            await sourceManager.initialize(mockAudioContext)
            
            // Connect to microphone first
            const micResult = await sourceManager.connectSource('microphone')
            expect(micResult.success).toBe(true)
            expect(micResult.source).toBe('microphone')
            
            // Switch to system audio
            const systemResult = await sourceManager.switchSource('system')
            expect(systemResult.success).toBe(true)
            expect(systemResult.source).toBe('system')
        })
        
        it('should restore previous source on switch failure', async () => {
            const mockMicStream = {
                getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }]),
                getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }])
            }
            
            global.navigator.mediaDevices.getUserMedia.mockResolvedValue(mockMicStream)
            
            // System audio fails
            const systemError = new Error('System audio failed')
            global.navigator.mediaDevices.getDisplayMedia.mockRejectedValue(systemError)
            
            await sourceManager.initialize(mockAudioContext)
            
            // Connect to microphone first
            await sourceManager.connectSource('microphone')
            
            // Try to switch to system (should fail and restore microphone)
            const switchResult = await sourceManager.switchSource('system', { restoreOnFailure: true })
            
            expect(switchResult.success).toBe(false)
            expect(switchResult.restored).toBe(true)
            expect(switchResult.currentSource).toBe('microphone')
        })
    })
    
    describe('Automatic Reconnection', () => {
        beforeEach(() => {
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn(),
                    getDisplayMedia: vi.fn()
                },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            // Mock timers
            vi.useFakeTimers()
        })
        
        afterEach(() => {
            vi.useRealTimers()
        })
        
        it('should attempt reconnection when stream ends', async () => {
            const mockTrack = {
                kind: 'audio',
                readyState: 'live',
                enabled: true,
                addEventListener: vi.fn(),
                stop: vi.fn()
            }
            
            const mockStream = {
                getAudioTracks: vi.fn().mockReturnValue([mockTrack]),
                getTracks: vi.fn().mockReturnValue([mockTrack])
            }
            
            global.navigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream)
            
            await sourceManager.initialize(mockAudioContext)
            await sourceManager.connectSource('microphone')
            
            // Simulate stream ended event
            const endedCallback = mockTrack.addEventListener.mock.calls.find(
                call => call[0] === 'ended'
            )[1]
            
            const reconnectSpy = vi.spyOn(sourceManager, 'attemptReconnection')
            
            endedCallback()
            
            expect(reconnectSpy).toHaveBeenCalled()
        })
        
        it('should respect maximum reconnection attempts', async () => {
            const manager = new AudioSourceManager({ maxReconnectAttempts: 2 })
            await manager.initialize(mockAudioContext)
            
            // Mock failed reconnection attempts
            global.navigator.mediaDevices.getUserMedia.mockRejectedValue(new Error('Connection failed'))
            
            const errorCallback = vi.fn()
            manager.setCallbacks({ onError: errorCallback })
            
            // Trigger reconnection
            manager.reconnectAttempts = 0
            await manager.attemptReconnection()
            
            // Fast-forward through reconnection attempts
            vi.advanceTimersByTime(10000)
            
            expect(manager.reconnectAttempts).toBe(1)
        })
    })
    
    describe('Error Handling and User Instructions', () => {
        beforeEach(() => {
            global.navigator = {
                mediaDevices: {
                    getUserMedia: vi.fn(),
                    getDisplayMedia: vi.fn()
                },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        })
        
        it('should provide clear instructions for permission errors', async () => {
            const permissionError = new Error('Permission denied')
            permissionError.name = 'NotAllowedError'
            
            global.navigator.mediaDevices.getUserMedia.mockRejectedValue(permissionError)
            
            await sourceManager.initialize(mockAudioContext)
            const result = await sourceManager.connectSource('microphone')
            
            expect(result.success).toBe(false)
            expect(result.instructions).toContain('Click the microphone icon')
            expect(result.instructions).toContain('Select "Allow"')
            expect(result.instructions).toContain('Refresh the page')
        })
        
        it('should provide clear instructions for system audio setup', async () => {
            const permissionError = new Error('Permission denied')
            permissionError.name = 'NotAllowedError'
            
            global.navigator.mediaDevices.getDisplayMedia.mockRejectedValue(permissionError)
            
            await sourceManager.initialize(mockAudioContext)
            const result = await sourceManager.connectSource('system')
            
            expect(result.success).toBe(false)
            expect(result.instructions).toContain('Click "Share"')
            expect(result.instructions).toContain('Share system audio')
            expect(result.instructions).toContain('correct screen/window')
        })
        
        it('should provide browser-specific instructions', async () => {
            // Mock Firefox
            global.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
            
            const manager = new AudioSourceManager()
            await manager.initialize(mockAudioContext)
            const result = await manager.connectSource('system')
            
            expect(result.success).toBe(false)
            expect(result.instructions).toContain('Chrome or Microsoft Edge')
            expect(result.instructions).toContain('microphone input as an alternative')
        })
    })
})