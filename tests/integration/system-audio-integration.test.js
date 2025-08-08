/**
 * Integration tests for system audio capture functionality
 * Tests the complete system audio integration with fallbacks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AudioAnalyzer } from '../../src/audio/core/audio-analyzer.js'
import { AudioUI } from '../../src/audio/ui/audio-ui.js'

describe('System Audio Integration', () => {
    let audioAnalyzer
    let audioUI
    let container
    let mockAudioContext
    
    beforeEach(() => {
        // Create container for UI
        container = document.createElement('div')
        document.body.appendChild(container)
        
        // Mock AudioContext
        mockAudioContext = {
            createMediaStreamSource: vi.fn().mockReturnValue({
                connect: vi.fn(),
                disconnect: vi.fn()
            }),
            createAnalyser: vi.fn().mockReturnValue({
                fftSize: 2048,
                smoothingTimeConstant: 0.8,
                minDecibels: -90,
                maxDecibels: -10,
                frequencyBinCount: 1024,
                getByteFrequencyData: vi.fn(),
                getByteTimeDomainData: vi.fn(),
                connect: vi.fn(),
                disconnect: vi.fn()
            }),
            state: 'running',
            resume: vi.fn().mockResolvedValue(),
            close: vi.fn().mockResolvedValue()
        }
        
        // Mock Web Audio API
        global.window.AudioContext = vi.fn(() => mockAudioContext)
        global.window.webkitAudioContext = vi.fn(() => mockAudioContext)
        
        // Mock navigator with media devices
        global.navigator = {
            mediaDevices: {
                getUserMedia: vi.fn(),
                getDisplayMedia: vi.fn()
            },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    })
    
    afterEach(() => {
        if (audioAnalyzer) {
            audioAnalyzer.dispose()
        }
        
        if (audioUI) {
            audioUI.dispose()
        }
        
        if (container && container.parentNode) {
            container.parentNode.removeChild(container)
        }
    })
    
    describe('Audio Source Manager Integration', () => {
        it('should initialize with supported sources', async () => {
            audioAnalyzer = new AudioAnalyzer()
            
            const supportedSources = audioAnalyzer.getSupportedSources()
            
            expect(supportedSources).toBeInstanceOf(Array)
            expect(supportedSources.length).toBeGreaterThan(0)
            
            // Should have microphone support
            const microphoneSource = supportedSources.find(s => s.type === 'microphone')
            expect(microphoneSource).toBeDefined()
            expect(microphoneSource.supported).toBe(true)
            
            // Should have system audio source (may or may not be supported)
            const systemSource = supportedSources.find(s => s.type === 'system')
            expect(systemSource).toBeDefined()
        })
        
        it('should handle microphone initialization', async () => {
            const mockStream = {
                getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }]),
                getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }])
            }
            
            global.navigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream)
            
            audioAnalyzer = new AudioAnalyzer()
            const result = await audioAnalyzer.initialize('microphone')
            
            expect(result.success).toBe(true)
            expect(result.source).toBe('microphone')
        })
        
        it('should handle system audio initialization with fallback', async () => {
            // System audio fails
            const systemError = new Error('System audio not available')
            systemError.name = 'NotAllowedError'
            global.navigator.mediaDevices.getDisplayMedia.mockRejectedValue(systemError)
            
            // Microphone succeeds
            const mockMicStream = {
                getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }]),
                getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }])
            }
            global.navigator.mediaDevices.getUserMedia.mockResolvedValue(mockMicStream)
            
            audioAnalyzer = new AudioAnalyzer()
            const result = await audioAnalyzer.initialize('system')
            
            expect(result.success).toBe(true)
            expect(result.source).toBe('microphone') // Fallback used
            expect(result.fallbackUsed).toBe(true)
            expect(result.originalSource).toBe('system')
        })
        
        it('should provide connection status', async () => {
            audioAnalyzer = new AudioAnalyzer()
            
            const initialStatus = audioAnalyzer.getConnectionStatus()
            expect(initialStatus.isConnected).toBe(false)
            expect(initialStatus.currentSource).toBeNull()
            expect(initialStatus.capabilities).toBeDefined()
            expect(initialStatus.supportedSources).toBeInstanceOf(Array)
        })
    })
    
    describe('Audio UI Integration', () => {
        it('should create UI with source selector', () => {
            audioUI = new AudioUI(container)
            
            // Should have source selector element
            const sourceSelector = container.querySelector('.source-selector')
            expect(sourceSelector).toBeDefined()
            
            // Should have microphone and system options
            const options = sourceSelector.querySelectorAll('option')
            expect(options.length).toBeGreaterThanOrEqual(2)
            
            const micOption = Array.from(options).find(opt => opt.value === 'microphone')
            const systemOption = Array.from(options).find(opt => opt.value === 'system')
            
            expect(micOption).toBeDefined()
            expect(systemOption).toBeDefined()
        })
        
        it('should handle source change events', async () => {
            audioUI = new AudioUI(container)
            
            let sourceChangeCallback = null
            audioUI.setCallbacks({
                onSourceChange: vi.fn().mockImplementation((source) => {
                    sourceChangeCallback = source
                    return Promise.resolve({ success: true, source })
                })
            })
            
            // Simulate source change
            const sourceSelector = container.querySelector('.source-selector')
            sourceSelector.value = 'system'
            sourceSelector.dispatchEvent(new Event('change'))
            
            // Wait for async handling
            await new Promise(resolve => setTimeout(resolve, 0))
            
            expect(sourceChangeCallback).toBe('system')
        })
        
        it('should update supported sources display', () => {
            audioUI = new AudioUI(container)
            
            const mockSources = [
                {
                    type: 'microphone',
                    name: 'Microphone',
                    description: 'Device microphone',
                    supported: true,
                    recommended: true
                },
                {
                    type: 'system',
                    name: 'System Audio',
                    description: 'System audio capture',
                    supported: false,
                    note: 'Limited browser support'
                }
            ]
            
            audioUI.updateSupportedSources(mockSources)
            
            const sourceSelector = container.querySelector('.source-selector')
            const options = sourceSelector.querySelectorAll('option')
            
            expect(options.length).toBe(2)
            expect(options[0].value).toBe('microphone')
            expect(options[0].disabled).toBe(false)
            expect(options[1].value).toBe('system')
            expect(options[1].disabled).toBe(true)
        })
        
        it('should show source help dialog', () => {
            audioUI = new AudioUI(container)
            
            const helpButton = container.querySelector('.source-help-btn')
            expect(helpButton).toBeDefined()
            
            // Click help button
            helpButton.click()
            
            // Should show help dialog
            const helpDialog = document.querySelector('.source-help-dialog')
            expect(helpDialog).toBeDefined()
            
            // Should have help content
            const helpContent = helpDialog.querySelector('.source-help-content')
            expect(helpContent).toBeDefined()
            expect(helpContent.textContent).toContain('Microphone')
            expect(helpContent.textContent).toContain('System Audio')
        })
    })
    
    describe('Error Handling and User Instructions', () => {
        it('should provide clear error messages for permission denied', async () => {
            const permissionError = new Error('Permission denied')
            permissionError.name = 'NotAllowedError'
            
            global.navigator.mediaDevices.getUserMedia.mockRejectedValue(permissionError)
            
            audioAnalyzer = new AudioAnalyzer()
            const result = await audioAnalyzer.initialize('microphone')
            
            expect(result.success).toBe(false)
            expect(result.message).toContain('permission')
            expect(result.message.toLowerCase()).toContain('microphone')
        })
        
        it('should provide clear error messages for system audio issues', async () => {
            const systemError = new Error('System audio failed')
            systemError.name = 'NotAllowedError'
            
            global.navigator.mediaDevices.getDisplayMedia.mockRejectedValue(systemError)
            global.navigator.mediaDevices.getUserMedia.mockRejectedValue(systemError)
            
            audioAnalyzer = new AudioAnalyzer()
            const result = await audioAnalyzer.initialize('system')
            
            expect(result.success).toBe(false)
            expect(result.message).toBeDefined()
        })
        
        it('should handle reconnection attempts', async () => {
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
            
            audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            
            // Verify event listeners were set up
            expect(mockTrack.addEventListener).toHaveBeenCalled()
            
            const eventCalls = mockTrack.addEventListener.mock.calls
            const endedCall = eventCalls.find(call => call[0] === 'ended')
            expect(endedCall).toBeDefined()
        })
    })
    
    describe('Performance and Compatibility', () => {
        it('should detect browser capabilities correctly', () => {
            audioAnalyzer = new AudioAnalyzer()
            const status = audioAnalyzer.getConnectionStatus()
            
            expect(status.capabilities).toBeDefined()
            expect(status.capabilities.getUserMedia).toBe(true) // Mocked as available
            expect(status.capabilities.webAudio).toBe(true) // Mocked as available
        })
        
        it('should handle missing APIs gracefully', () => {
            // Remove getDisplayMedia
            delete global.navigator.mediaDevices.getDisplayMedia
            
            audioAnalyzer = new AudioAnalyzer()
            const supportedSources = audioAnalyzer.getSupportedSources()
            
            // Should still have microphone support
            const microphoneSource = supportedSources.find(s => s.type === 'microphone')
            expect(microphoneSource.supported).toBe(true)
            
            // System audio should be unsupported
            const systemSource = supportedSources.find(s => s.type === 'system')
            expect(systemSource.supported).toBe(false)
        })
        
        it('should maintain performance during audio processing', async () => {
            const mockStream = {
                getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }]),
                getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }])
            }
            
            global.navigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream)
            
            audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            
            // Mock frequency data
            const mockFrequencyData = new Uint8Array(1024).fill(128)
            mockAudioContext.createAnalyser().getByteFrequencyData.mockImplementation((data) => {
                data.set(mockFrequencyData)
            })
            
            audioAnalyzer.startAnalysis()
            
            // Get audio data multiple times to test performance
            const startTime = performance.now()
            for (let i = 0; i < 100; i++) {
                audioAnalyzer.getFrequencyData()
            }
            const endTime = performance.now()
            
            const avgTime = (endTime - startTime) / 100
            expect(avgTime).toBeLessThan(5) // Should be under 5ms per analysis
            
            audioAnalyzer.stopAnalysis()
        })
    })
})