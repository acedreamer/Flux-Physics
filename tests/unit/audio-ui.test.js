/**
 * Unit tests for AudioUI components
 * Tests UI interactions, state management, and visual feedback
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AudioUI } from '../../src/audio/ui/audio-ui.js'

// Mock DOM environment
const mockDOM = () => {
    const createMockElement = (tag) => {
        const element = {
            tagName: tag.toUpperCase(),
            className: '',
            innerHTML: '',
            textContent: '',
            style: {},
            type: '',
            min: '',
            max: '',
            step: '',
            value: '',
            width: 240,
            height: 80,
            title: '',
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            appendChild: vi.fn(),
            removeChild: vi.fn(),
            querySelector: vi.fn((selector) => {
                // Return mock elements for common selectors
                if (selector === '.panel-close') {
                    return createMockElement('button')
                }
                if (selector === '.audio-icon' || selector === '.audio-text' || selector === '.audio-status') {
                    return createMockElement('span')
                }
                if (selector === '.status-dot' || selector === '.status-text') {
                    return createMockElement('div')
                }
                if (selector === '.error-text' || selector === '.error-dismiss') {
                    return createMockElement('div')
                }
                if (selector === '.beat-pulse' || selector === '.beat-ring' || 
                    selector === '.beat-status' || selector === '.beat-bpm') {
                    return createMockElement('div')
                }
                if (selector === '.volume-fill' || selector === '.volume-peak' || 
                    selector === '.volume-value') {
                    return createMockElement('div')
                }
                if (selector === '.sensitivity-value') {
                    return createMockElement('span')
                }
                return createMockElement('div')
            }),
            querySelectorAll: vi.fn(() => []),
            classList: {
                add: vi.fn(),
                remove: vi.fn(),
                contains: vi.fn(),
                toggle: vi.fn()
            },
            parentNode: null,
            getContext: vi.fn(() => ({
                clearRect: vi.fn(),
                fillRect: vi.fn(),
                createLinearGradient: vi.fn(() => ({
                    addColorStop: vi.fn()
                })),
                fillText: vi.fn(),
                strokeStyle: '',
                fillStyle: '',
                lineWidth: 0,
                font: '',
                textAlign: '',
                setLineDash: vi.fn(),
                beginPath: vi.fn(),
                moveTo: vi.fn(),
                lineTo: vi.fn(),
                stroke: vi.fn()
            }))
        }
        return element
    }
    
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

describe('AudioUI', () => {
    let audioUI
    let mockContainer
    
    beforeEach(() => {
        mockDOM()
        
        mockContainer = {
            appendChild: vi.fn(),
            removeChild: vi.fn()
        }
        
        audioUI = new AudioUI(mockContainer)
    })
    
    afterEach(() => {
        if (audioUI) {
            audioUI.dispose()
        }
        vi.clearAllMocks()
    })
    
    describe('Initialization', () => {
        it('should create AudioUI instance with default configuration', () => {
            expect(audioUI).toBeDefined()
            expect(audioUI.audioEnabled).toBe(false)
            expect(audioUI.isVisible).toBe(false)
            expect(audioUI.currentMode).toBe('reactive')
            expect(audioUI.sensitivity).toBe(1.0)
        })
        
        it('should create all required UI elements', () => {
            expect(audioUI.elements.toggleButton).toBeDefined()
            expect(audioUI.elements.panel).toBeDefined()
            expect(audioUI.elements.spectrum).toBeDefined()
            expect(audioUI.elements.beatIndicator).toBeDefined()
            expect(audioUI.elements.volumeMeter).toBeDefined()
            expect(audioUI.elements.modeSelector).toBeDefined()
            expect(audioUI.elements.sensitivitySlider).toBeDefined()
            expect(audioUI.elements.statusIndicator).toBeDefined()
            expect(audioUI.elements.errorMessage).toBeDefined()
        })
        
        it('should initialize spectrum state correctly', () => {
            expect(audioUI.spectrumState.canvas).toBeDefined()
            expect(audioUI.spectrumState.context).toBeDefined()
            expect(audioUI.spectrumState.smoothedSpectrum).toHaveLength(256)
            expect(audioUI.spectrumState.animationFrame).toBeNull()
        })
        
        it('should accept custom configuration options', () => {
            const customOptions = {
                panelWidth: 320,
                spectrumHeight: 100,
                animationDuration: 500
            }
            
            const customAudioUI = new AudioUI(mockContainer, customOptions)
            
            expect(customAudioUI.config.panelWidth).toBe(320)
            expect(customAudioUI.config.spectrumHeight).toBe(100)
            expect(customAudioUI.config.animationDuration).toBe(500)
            
            customAudioUI.dispose()
        })
    })
    
    describe('Toggle Button', () => {
        it('should create toggle button with correct initial state', () => {
            const button = audioUI.elements.toggleButton
            expect(button).toBeDefined()
            expect(button.className).toBe('audio-toggle')
        })
        
        it('should update button state when audio is enabled', () => {
            audioUI.updateToggleButton(true)
            
            const button = audioUI.elements.toggleButton
            expect(button.classList.add).toHaveBeenCalledWith('active')
        })
        
        it('should update button state when audio is disabled', () => {
            audioUI.updateToggleButton(false)
            
            const button = audioUI.elements.toggleButton
            expect(button.classList.remove).toHaveBeenCalledWith('active')
        })
        
        it('should handle toggle button click', async () => {
            const mockCallback = vi.fn().mockResolvedValue({ success: true })
            audioUI.setCallbacks({ onPermissionRequest: mockCallback })
            
            await audioUI.toggleAudioMode()
            
            expect(mockCallback).toHaveBeenCalled()
        })
    })
    
    describe('Control Panel', () => {
        it('should create control panel with correct structure', () => {
            const panel = audioUI.elements.panel
            expect(panel).toBeDefined()
            expect(panel.className).toBe('audio-panel hidden')
        })
        
        it('should show panel with animation', () => {
            audioUI.showPanel()
            
            expect(audioUI.isVisible).toBe(true)
            expect(audioUI.elements.panel.classList.remove).toHaveBeenCalledWith('hidden')
        })
        
        it('should hide panel with animation', () => {
            audioUI.isVisible = true
            audioUI.hidePanel()
            
            expect(audioUI.isVisible).toBe(false)
            expect(audioUI.elements.panel.classList.remove).toHaveBeenCalledWith('visible')
        })
        
        it('should not show panel if already visible', () => {
            audioUI.isVisible = true
            const removeCallCount = audioUI.elements.panel.classList.remove.mock.calls.length
            
            audioUI.showPanel()
            
            expect(audioUI.elements.panel.classList.remove).toHaveBeenCalledTimes(removeCallCount)
        })
        
        it('should not hide panel if already hidden', () => {
            audioUI.isVisible = false
            const removeCallCount = audioUI.elements.panel.classList.remove.mock.calls.length
            
            audioUI.hidePanel()
            
            expect(audioUI.elements.panel.classList.remove).toHaveBeenCalledTimes(removeCallCount)
        })
    })
    
    describe('Spectrum Visualizer', () => {
        it('should create spectrum canvas with correct dimensions', () => {
            const canvas = audioUI.elements.spectrum
            expect(canvas).toBeDefined()
            expect(canvas.width).toBe(audioUI.config.spectrumWidth)
            expect(canvas.height).toBe(audioUI.config.spectrumHeight)
        })
        
        it('should update spectrum with frequency data', () => {
            const mockContext = {
                clearRect: vi.fn(),
                fillRect: vi.fn(),
                createLinearGradient: vi.fn(() => ({
                    addColorStop: vi.fn()
                })),
                fillText: vi.fn(),
                strokeStyle: '',
                fillStyle: '',
                lineWidth: 0,
                font: '',
                textAlign: '',
                setLineDash: vi.fn(),
                beginPath: vi.fn(),
                moveTo: vi.fn(),
                lineTo: vi.fn(),
                stroke: vi.fn()
            }
            
            audioUI.spectrumState.context = mockContext
            
            const frequencyData = new Array(256).fill(0).map((_, i) => i)
            audioUI.updateSpectrum(frequencyData)
            
            expect(mockContext.clearRect).toHaveBeenCalled()
            expect(mockContext.fillRect).toHaveBeenCalled()
        })
        
        it('should handle empty frequency data gracefully', () => {
            const mockContext = {
                clearRect: vi.fn(),
                fillRect: vi.fn()
            }
            
            audioUI.spectrumState.context = mockContext
            audioUI.updateSpectrum(null)
            
            expect(mockContext.clearRect).not.toHaveBeenCalled()
        })
        
        it('should start spectrum animation when audio enabled', () => {
            audioUI.audioEnabled = true
            audioUI.isVisible = true
            
            audioUI.startSpectrumAnimation()
            
            expect(audioUI.spectrumState.animationFrame).toBeDefined()
        })
        
        it('should stop spectrum animation', () => {
            audioUI.spectrumState.animationFrame = 123
            audioUI.stopSpectrumAnimation()
            
            expect(global.cancelAnimationFrame).toHaveBeenCalledWith(123)
            expect(audioUI.spectrumState.animationFrame).toBeNull()
        })
    })
    
    describe('Beat Indicator', () => {
        it('should create beat indicator with visual elements', () => {
            const indicator = audioUI.elements.beatIndicator
            expect(indicator).toBeDefined()
            expect(indicator.className).toBe('beat-indicator')
        })
        
        it('should update beat indicator when beat detected', () => {
            const mockPulse = { style: {} }
            const mockRing = { style: {} }
            const mockStatus = { style: {} }
            const mockBpm = { style: {} }
            
            const mockIndicator = {
                querySelector: vi.fn((selector) => {
                    switch (selector) {
                        case '.beat-pulse': return mockPulse
                        case '.beat-ring': return mockRing
                        case '.beat-status': return mockStatus
                        case '.beat-bpm': return mockBpm
                        default: return null
                    }
                })
            }
            
            audioUI.elements.beatIndicator = mockIndicator
            
            const beatData = {
                isBeat: true,
                strength: 1.5,
                energy: 0.8,
                bpm: 120
            }
            
            audioUI.updateBeatIndicator(beatData)
            
            expect(mockIndicator.querySelector).toHaveBeenCalledWith('.beat-pulse')
            expect(mockIndicator.querySelector).toHaveBeenCalledWith('.beat-ring')
            expect(mockIndicator.querySelector).toHaveBeenCalledWith('.beat-status')
            expect(mockIndicator.querySelector).toHaveBeenCalledWith('.beat-bpm')
        })
        
        it('should handle non-beat state correctly', () => {
            const mockStatus = { style: {} }
            const mockBpm = { style: {} }
            
            const mockIndicator = {
                querySelector: vi.fn((selector) => {
                    switch (selector) {
                        case '.beat-status': return mockStatus
                        case '.beat-bpm': return mockBpm
                        default: return { style: {} }
                    }
                })
            }
            
            audioUI.elements.beatIndicator = mockIndicator
            
            const beatData = {
                isBeat: false,
                energy: 0.3,
                bpm: 0
            }
            
            audioUI.updateBeatIndicator(beatData)
            
            expect(mockStatus.textContent).toContain('Energy:')
            expect(mockBpm.textContent).toBe('-- BPM')
        })
    })
    
    describe('Volume Meter', () => {
        it('should create volume meter with bar and value display', () => {
            const meter = audioUI.elements.volumeMeter
            expect(meter).toBeDefined()
            expect(meter.className).toBe('volume-meter')
        })
        
        it('should update volume meter with amplitude data', () => {
            const mockFill = { style: {} }
            const mockPeak = { style: {} }
            const mockValue = {}
            
            const mockMeter = {
                querySelector: vi.fn((selector) => {
                    switch (selector) {
                        case '.volume-fill': return mockFill
                        case '.volume-peak': return mockPeak
                        case '.volume-value': return mockValue
                        default: return null
                    }
                })
            }
            
            audioUI.elements.volumeMeter = mockMeter
            
            audioUI.updateVolumeMeter(0.75)
            
            expect(mockFill.style.width).toBe('75%')
            expect(mockValue.textContent).toBe('75%')
        })
        
        it('should handle peak hold functionality', () => {
            const mockFill = { style: {} }
            const mockPeak = { style: {} }
            const mockValue = {}
            
            const mockMeter = {
                querySelector: vi.fn((selector) => {
                    switch (selector) {
                        case '.volume-fill': return mockFill
                        case '.volume-peak': return mockPeak
                        case '.volume-value': return mockValue
                        default: return null
                    }
                })
            }
            
            audioUI.elements.volumeMeter = mockMeter
            
            // First update sets peak
            audioUI.updateVolumeMeter(0.8)
            expect(audioUI.peakHold.value).toBe(0.8)
            
            // Lower value shouldn't change peak immediately
            audioUI.updateVolumeMeter(0.5)
            expect(audioUI.peakHold.value).toBe(0.8)
        })
        
        it('should apply color coding based on volume level', () => {
            const mockFill = { style: {} }
            const mockMeter = {
                querySelector: vi.fn(() => mockFill)
            }
            
            audioUI.elements.volumeMeter = mockMeter
            
            // Low volume - cyan
            audioUI.updateVolumeMeter(0.1)
            expect(mockFill.style.backgroundColor).toBe('#4ECDC4')
            
            // Medium volume - blue
            audioUI.updateVolumeMeter(0.5)
            expect(mockFill.style.backgroundColor).toBe('#45B7D1')
            
            // High volume - red
            audioUI.updateVolumeMeter(0.9)
            expect(mockFill.style.backgroundColor).toBe('#FF6B6B')
        })
    })
    
    describe('Mode Selector', () => {
        it('should create mode selector with all visualization modes', () => {
            const selector = audioUI.elements.modeSelector
            expect(selector).toBeDefined()
            expect(selector.className).toBe('mode-selector')
        })
        
        it('should handle mode change', () => {
            const mockCallback = vi.fn()
            audioUI.setCallbacks({ onModeChange: mockCallback })
            
            audioUI.onModeChange('pulse')
            
            expect(audioUI.currentMode).toBe('pulse')
            expect(mockCallback).toHaveBeenCalledWith('pulse')
        })
        
        it('should provide visual feedback on mode change', () => {
            const mockSelector = { style: {} }
            audioUI.elements.modeSelector = mockSelector
            
            audioUI.onModeChange('flow')
            
            expect(mockSelector.style.transform).toBe('scale(0.95)')
        })
    })
    
    describe('Sensitivity Slider', () => {
        it('should create sensitivity slider with correct range', () => {
            const slider = audioUI.elements.sensitivitySlider
            expect(slider).toBeDefined()
            expect(slider.type).toBe('range')
            expect(slider.min).toBe('0.1')
            expect(slider.max).toBe('3.0')
            expect(slider.step).toBe('0.1')
            expect(slider.value).toBe('1.0')
        })
        
        it('should handle sensitivity change', () => {
            const mockCallback = vi.fn()
            audioUI.setCallbacks({ onSensitivityChange: mockCallback })
            
            audioUI.onSensitivityChange(2.5)
            
            expect(audioUI.sensitivity).toBe(2.5)
            expect(mockCallback).toHaveBeenCalledWith(2.5)
        })
        
        it('should update sensitivity display value', () => {
            const mockLabel = {}
            const mockContainer = {
                querySelector: vi.fn(() => mockLabel)
            }
            
            audioUI.sensitivityContainer = mockContainer
            
            audioUI.onSensitivityChange(1.8)
            
            expect(mockLabel.textContent).toBe('1.8x')
        })
    })
    
    describe('Status Management', () => {
        it('should update status indicator correctly', () => {
            const mockDot = { className: 'status-dot', classList: { add: vi.fn() } }
            const mockText = {}
            const mockIndicator = {
                querySelector: vi.fn((selector) => {
                    return selector === '.status-dot' ? mockDot : mockText
                })
            }
            
            audioUI.elements.statusIndicator = mockIndicator
            
            audioUI.updateStatus('connected', 'Audio active')
            
            expect(mockDot.classList.add).toHaveBeenCalledWith('status-connected')
            expect(mockText.textContent).toBe('Audio active')
        })
        
        it('should show error messages', () => {
            const mockErrorText = {}
            const mockErrorElement = {
                querySelector: vi.fn(() => mockErrorText),
                classList: { remove: vi.fn() }
            }
            
            audioUI.elements.errorMessage = mockErrorElement
            
            audioUI.showError('Test error message')
            
            expect(mockErrorText.textContent).toBe('Test error message')
            expect(mockErrorElement.classList.remove).toHaveBeenCalledWith('hidden')
        })
        
        it('should hide error messages', () => {
            const mockErrorElement = {
                classList: { add: vi.fn() }
            }
            
            audioUI.elements.errorMessage = mockErrorElement
            
            audioUI.hideError()
            
            expect(mockErrorElement.classList.add).toHaveBeenCalledWith('hidden')
        })
    })
    
    describe('Event Callbacks', () => {
        it('should set and trigger callbacks correctly', () => {
            const mockCallbacks = {
                onToggleAudio: vi.fn(),
                onModeChange: vi.fn(),
                onSensitivityChange: vi.fn(),
                onPermissionRequest: vi.fn()
            }
            
            audioUI.setCallbacks(mockCallbacks)
            
            expect(audioUI.callbacks.onToggleAudio).toBe(mockCallbacks.onToggleAudio)
            expect(audioUI.callbacks.onModeChange).toBe(mockCallbacks.onModeChange)
            expect(audioUI.callbacks.onSensitivityChange).toBe(mockCallbacks.onSensitivityChange)
            expect(audioUI.callbacks.onPermissionRequest).toBe(mockCallbacks.onPermissionRequest)
        })
    })
    
    describe('State Management', () => {
        it('should return current UI state', () => {
            audioUI.audioEnabled = true
            audioUI.isVisible = true
            audioUI.currentMode = 'pulse'
            audioUI.sensitivity = 2.0
            
            const state = audioUI.getState()
            
            expect(state).toEqual({
                audioEnabled: true,
                isVisible: true,
                currentMode: 'pulse',
                sensitivity: 2.0
            })
        })
        
        it('should update all UI components with audio data', () => {
            audioUI.audioEnabled = true
            audioUI.isVisible = true
            
            const updateSpectrumSpy = vi.spyOn(audioUI, 'updateSpectrum')
            const updateVolumeMeterSpy = vi.spyOn(audioUI, 'updateVolumeMeter')
            
            const audioData = {
                spectrum: new Array(256).fill(100),
                overall: 0.6
            }
            
            audioUI.updateAll(audioData)
            
            expect(updateSpectrumSpy).toHaveBeenCalledWith(audioData.spectrum)
            expect(updateVolumeMeterSpy).toHaveBeenCalledWith(audioData.overall)
        })
        
        it('should not update UI when audio disabled', () => {
            audioUI.audioEnabled = false
            
            const updateSpectrumSpy = vi.spyOn(audioUI, 'updateSpectrum')
            
            const audioData = {
                spectrum: new Array(256).fill(100),
                overall: 0.6
            }
            
            audioUI.updateAll(audioData)
            
            expect(updateSpectrumSpy).not.toHaveBeenCalled()
        })
    })
    
    describe('Cleanup', () => {
        it('should dispose of resources correctly', () => {
            audioUI.spectrumState.animationFrame = 123
            
            const stopAnimationSpy = vi.spyOn(audioUI, 'stopSpectrumAnimation')
            
            audioUI.dispose()
            
            expect(stopAnimationSpy).toHaveBeenCalled()
            expect(audioUI.elements).toEqual({})
            expect(audioUI.callbacks).toEqual({})
            expect(audioUI.spectrumState).toEqual({})
        })
    })
})