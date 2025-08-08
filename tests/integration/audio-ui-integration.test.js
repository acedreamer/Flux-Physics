/**
 * Integration tests for AudioUI with audio processing components
 * Tests the complete audio reactive UI workflow
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AudioUIIntegrationExample } from '../../src/audio/examples/audio-ui-integration-example.js'

// Mock FLUX application
const createMockFluxApp = () => ({
    config: {
        containerWidth: 800,
        containerHeight: 600
    },
    solver: {
        apply_force: vi.fn()
    }
})

// Mock Web Audio API
const mockWebAudioAPI = () => {
    global.AudioContext = vi.fn(() => ({
        createAnalyser: vi.fn(() => ({
            fftSize: 2048,
            smoothingTimeConstant: 0.8,
            minDecibels: -90,
            maxDecibels: -10,
            frequencyBinCount: 1024,
            getByteFrequencyData: vi.fn(),
            getByteTimeDomainData: vi.fn(),
            connect: vi.fn(),
            disconnect: vi.fn()
        })),
        createMediaStreamSource: vi.fn(() => ({
            connect: vi.fn(),
            disconnect: vi.fn()
        })),
        resume: vi.fn().mockResolvedValue(),
        close: vi.fn().mockResolvedValue(),
        state: 'running'
    }))
    
    global.navigator = {
        mediaDevices: {
            getUserMedia: vi.fn().mockResolvedValue({
                getTracks: vi.fn(() => [{
                    stop: vi.fn()
                }])
            }),
            getDisplayMedia: vi.fn().mockResolvedValue({
                getTracks: vi.fn(() => [{
                    stop: vi.fn()
                }]),
                getAudioTracks: vi.fn(() => [{
                    stop: vi.fn()
                }])
            })
        }
    }
}

// Mock DOM for integration tests
const mockIntegrationDOM = () => {
    const createMockElement = (tag) => ({
        tagName: tag.toUpperCase(),
        className: '',
        innerHTML: '',
        textContent: '',
        style: {},
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        querySelector: vi.fn(() => createMockElement('div')),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        classList: {
            add: vi.fn(),
            remove: vi.fn(),
            contains: vi.fn()
        },
        getContext: vi.fn(() => ({
            clearRect: vi.fn(),
            fillRect: vi.fn(),
            createLinearGradient: vi.fn(() => ({
                addColorStop: vi.fn()
            })),
            fillText: vi.fn(),
            stroke: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            setLineDash: vi.fn()
        }))
    })
    
    global.document = {
        createElement: vi.fn(createMockElement),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        body: createMockElement('body')
    }
    
    global.window = {
        requestAnimationFrame: vi.fn((cb) => setTimeout(cb, 16)),
        cancelAnimationFrame: vi.fn(),
        performance: {
            now: vi.fn(() => Date.now())
        }
    }
    
    global.requestAnimationFrame = global.window.requestAnimationFrame
    global.cancelAnimationFrame = global.window.cancelAnimationFrame
    global.performance = global.window.performance
}

describe('AudioUI Integration', () => {
    let integration
    let mockFluxApp
    
    beforeEach(() => {
        mockIntegrationDOM()
        mockWebAudioAPI()
        
        mockFluxApp = createMockFluxApp()
        integration = new AudioUIIntegrationExample(mockFluxApp)
    })
    
    afterEach(() => {
        if (integration) {
            integration.dispose()
        }
        vi.clearAllMocks()
        vi.clearAllTimers()
    })
    
    describe('Initialization', () => {
        it('should initialize integration with UI and callbacks', () => {
            expect(integration).toBeDefined()
            expect(integration.audioUI).toBeDefined()
            expect(integration.fluxApp).toBe(mockFluxApp)
        })
        
        it('should set up UI callbacks correctly', () => {
            const callbacks = integration.audioUI.callbacks
            
            expect(callbacks.onToggleAudio).toBeDefined()
            expect(callbacks.onModeChange).toBeDefined()
            expect(callbacks.onSensitivityChange).toBeDefined()
            expect(callbacks.onPermissionRequest).toBeDefined()
        })
    })
    
    describe('Audio Permission Handling', () => {
        it('should handle successful permission request', async () => {
            const result = await integration.handlePermissionRequest()
            
            expect(result.success).toBe(true)
            expect(integration.audioAnalyzer).toBeDefined()
            expect(integration.beatDetector).toBeDefined()
        })
        
        it('should handle permission denied', async () => {
            // Mock permission denied
            global.navigator.mediaDevices.getUserMedia.mockRejectedValue(
                new Error('Permission denied')
            )
            
            const result = await integration.handlePermissionRequest()
            
            expect(result.success).toBe(false)
            expect(result.message).toContain('Failed to initialize audio')
        })
    })
    
    describe('Audio Processing', () => {
        beforeEach(async () => {
            // Set up audio system
            await integration.handlePermissionRequest()
        })
        
        it('should start audio processing when enabled', async () => {
            await integration.handleAudioToggle(true)
            
            expect(integration.isRunning).toBe(true)
            expect(integration.audioAnalyzer.startAnalysis).toHaveBeenCalled()
        })
        
        it('should stop audio processing when disabled', async () => {
            await integration.handleAudioToggle(true)
            integration.handleAudioToggle(false)
            
            expect(integration.isRunning).toBe(false)
            expect(integration.audioAnalyzer.stopAnalysis).toHaveBeenCalled()
        })
        
        it('should process audio data and update UI', async () => {
            // Mock audio data
            const mockFrequencyData = {
                bass: 0.5,
                mids: 0.3,
                treble: 0.7,
                overall: 0.4,
                spectrum: new Array(256).fill(100)
            }
            
            const mockBeatData = {
                isBeat: true,
                strength: 1.2,
                energy: 0.8,
                bpm: 120
            }
            
            integration.audioAnalyzer.getFrequencyData = vi.fn(() => mockFrequencyData)
            integration.beatDetector.detectBeat = vi.fn(() => mockBeatData)
            
            const updateAllSpy = vi.spyOn(integration.audioUI, 'updateAll')
            const updateBeatSpy = vi.spyOn(integration.audioUI, 'updateBeat')
            
            await integration.handleAudioToggle(true)
            
            // Wait for processing loop
            await new Promise(resolve => setTimeout(resolve, 50))
            
            expect(updateAllSpy).toHaveBeenCalledWith(mockFrequencyData)
            expect(updateBeatSpy).toHaveBeenCalledWith(mockBeatData)
        })
    })
    
    describe('Mode Changes', () => {
        beforeEach(async () => {
            await integration.handlePermissionRequest()
        })
        
        it('should handle pulse mode change', () => {
            integration.handleModeChange('pulse')
            
            expect(integration.audioUI.currentMode).toBe('pulse')
        })
        
        it('should handle reactive mode change', () => {
            integration.handleModeChange('reactive')
            
            expect(integration.audioUI.currentMode).toBe('reactive')
        })
        
        it('should handle flow mode change', () => {
            integration.handleModeChange('flow')
            
            expect(integration.audioUI.currentMode).toBe('flow')
        })
        
        it('should handle ambient mode change', () => {
            integration.handleModeChange('ambient')
            
            expect(integration.audioUI.currentMode).toBe('ambient')
        })
    })
    
    describe('Sensitivity Adjustment', () => {
        beforeEach(async () => {
            await integration.handlePermissionRequest()
        })
        
        it('should update beat detector sensitivity', () => {
            const updateConfigSpy = vi.spyOn(integration.beatDetector, 'updateConfig')
            
            integration.handleSensitivityChange(2.0)
            
            expect(updateConfigSpy).toHaveBeenCalledWith({
                sensitivity: 2.0,
                varianceMultiplier: 2.0,
                minimumEnergy: 0.025
            })
        })
        
        it('should handle extreme sensitivity values', () => {
            const updateConfigSpy = vi.spyOn(integration.beatDetector, 'updateConfig')
            
            // Very high sensitivity
            integration.handleSensitivityChange(3.0)
            expect(updateConfigSpy).toHaveBeenCalledWith({
                sensitivity: 3.0,
                varianceMultiplier: 3.0,
                minimumEnergy: expect.any(Number)
            })
            
            // Very low sensitivity
            integration.handleSensitivityChange(0.1)
            expect(updateConfigSpy).toHaveBeenCalledWith({
                sensitivity: 0.1,
                varianceMultiplier: 0.1,
                minimumEnergy: 0.5
            })
        })
    })
    
    describe('Audio Effects Application', () => {
        beforeEach(async () => {
            await integration.handlePermissionRequest()
        })
        
        it('should apply pulse effects when beat detected', () => {
            const mockFrequencyData = { bass: 0.3, mids: 0.2, treble: 0.1, overall: 0.2 }
            const mockBeatData = { isBeat: true, strength: 1.5, energy: 0.8 }
            
            integration.audioUI.currentMode = 'pulse'
            integration.audioUI.sensitivity = 1.0
            
            integration.applyAudioEffects(mockFrequencyData, mockBeatData)
            
            expect(mockFluxApp.solver.apply_force).toHaveBeenCalledWith(
                400, // centerX
                300, // centerY
                175, // radius (100 + 1.5 * 50)
                1.2  // strength (1.5 * 1.0 * 0.8)
            )
        })
        
        it('should apply reactive effects with bass and beat', () => {
            const mockFrequencyData = { bass: 0.6, mids: 0.3, treble: 0.2, overall: 0.4 }
            const mockBeatData = { isBeat: true, strength: 1.2, energy: 0.7 }
            
            integration.audioUI.currentMode = 'reactive'
            integration.audioUI.sensitivity = 1.5
            
            integration.applyAudioEffects(mockFrequencyData, mockBeatData)
            
            // Should apply both bass and beat effects
            expect(mockFluxApp.solver.apply_force).toHaveBeenCalledTimes(2)
        })
        
        it('should apply flow effects with time-based movement', () => {
            const mockFrequencyData = { bass: 0.2, mids: 0.4, treble: 0.3, overall: 0.3 }
            const mockBeatData = { isBeat: false, strength: 0, energy: 0.3 }
            
            integration.audioUI.currentMode = 'flow'
            integration.audioUI.sensitivity = 1.0
            
            integration.applyAudioEffects(mockFrequencyData, mockBeatData)
            
            expect(mockFluxApp.solver.apply_force).toHaveBeenCalledWith(
                expect.any(Number), // flowX (time-based)
                expect.any(Number), // flowY (time-based)
                expect.any(Number), // radius
                expect.any(Number)  // strength
            )
        })
        
        it('should apply subtle ambient effects', () => {
            const mockFrequencyData = { bass: 0.1, mids: 0.2, treble: 0.1, overall: 0.15 }
            const mockBeatData = { isBeat: false, strength: 0, energy: 0.1 }
            
            integration.audioUI.currentMode = 'ambient'
            integration.audioUI.sensitivity = 1.0
            
            integration.applyAudioEffects(mockFrequencyData, mockBeatData)
            
            expect(mockFluxApp.solver.apply_force).toHaveBeenCalledWith(
                expect.any(Number), // ambientX (time-based)
                expect.any(Number), // ambientY (time-based)
                expect.any(Number), // radius
                0.03 // strength (0.15 * 1.0 * 0.2)
            )
        })
        
        it('should not apply effects when audio level too low', () => {
            const mockFrequencyData = { bass: 0.01, mids: 0.02, treble: 0.01, overall: 0.02 }
            const mockBeatData = { isBeat: false, strength: 0, energy: 0.01 }
            
            integration.audioUI.currentMode = 'ambient'
            integration.audioUI.sensitivity = 1.0
            
            integration.applyAudioEffects(mockFrequencyData, mockBeatData)
            
            // Should not apply force when overall level is below 0.05
            expect(mockFluxApp.solver.apply_force).not.toHaveBeenCalled()
        })
    })
    
    describe('State Management', () => {
        it('should return current audio data', async () => {
            await integration.handlePermissionRequest()
            
            const audioData = integration.getAudioData()
            
            expect(audioData).toHaveProperty('frequency')
            expect(audioData).toHaveProperty('beat')
            expect(audioData).toHaveProperty('timestamp')
        })
        
        it('should return UI state', () => {
            const uiState = integration.getUIState()
            
            expect(uiState).toHaveProperty('audioEnabled')
            expect(uiState).toHaveProperty('isVisible')
            expect(uiState).toHaveProperty('currentMode')
            expect(uiState).toHaveProperty('sensitivity')
        })
    })
    
    describe('Cleanup', () => {
        it('should dispose of all resources', async () => {
            await integration.handlePermissionRequest()
            await integration.handleAudioToggle(true)
            
            const disposeSpy = vi.spyOn(integration.audioAnalyzer, 'dispose')
            const uiDisposeSpy = vi.spyOn(integration.audioUI, 'dispose')
            
            integration.dispose()
            
            expect(integration.isRunning).toBe(false)
            expect(disposeSpy).toHaveBeenCalled()
            expect(uiDisposeSpy).toHaveBeenCalled()
            expect(integration.audioAnalyzer).toBeNull()
            expect(integration.beatDetector).toBeNull()
            expect(integration.audioUI).toBeNull()
        })
    })
})