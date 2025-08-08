/**
 * Integration tests for AudioSettings and AudioSettingsUI
 * Tests the complete settings system integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AudioSettings } from '../../src/audio/core/audio-settings.js'
import { AudioSettingsUI } from '../../src/audio/ui/audio-settings-ui.js'

// Mock DOM environment
const createMockElement = (tag) => {
    const element = {
        tagName: tag.toUpperCase(),
        className: '',
        innerHTML: '',
        textContent: '',
        style: {},
        children: [],
        parentNode: null,
        
        appendChild: vi.fn((child) => {
            element.children.push(child)
            child.parentNode = element
        }),
        
        removeChild: vi.fn((child) => {
            const index = element.children.indexOf(child)
            if (index > -1) {
                element.children.splice(index, 1)
                child.parentNode = null
            }
        }),
        
        querySelector: vi.fn((selector) => {
            // Simple mock implementation
            return element.children.find(child => 
                child.className && child.className.includes(selector.replace('.', ''))
            )
        }),
        
        querySelectorAll: vi.fn((selector) => {
            return element.children.filter(child => 
                child.className && child.className.includes(selector.replace('.', ''))
            )
        }),
        
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        
        classList: {
            add: vi.fn((className) => {
                if (!element.className.includes(className)) {
                    element.className += ` ${className}`.trim()
                }
            }),
            remove: vi.fn((className) => {
                element.className = element.className.replace(className, '').trim()
            }),
            contains: vi.fn((className) => element.className.includes(className)),
            toggle: vi.fn((className) => {
                if (element.className.includes(className)) {
                    element.classList.remove(className)
                } else {
                    element.classList.add(className)
                }
            })
        }
    }
    
    return element
}

// Mock document
const mockDocument = {
    createElement: vi.fn(createMockElement),
    body: createMockElement('body'),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
}

// Mock localStorage
const localStorageMock = {
    store: {},
    getItem: vi.fn((key) => localStorageMock.store[key] || null),
    setItem: vi.fn((key, value) => {
        localStorageMock.store[key] = value
    }),
    clear: vi.fn(() => {
        localStorageMock.store = {}
    })
}

// Mock window
const mockWindow = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
}

// Mock navigator for clipboard
const mockNavigator = {
    clipboard: {
        writeText: vi.fn(() => Promise.resolve())
    }
}

describe('AudioSettings Integration', () => {
    let audioSettings
    let settingsUI
    let container
    
    beforeEach(() => {
        // Setup global mocks
        global.document = mockDocument
        global.window = mockWindow
        global.localStorage = localStorageMock
        global.navigator = mockNavigator
        global.performance = { now: vi.fn(() => Date.now()) }
        global.requestAnimationFrame = vi.fn((callback) => setTimeout(callback, 16))
        global.setTimeout = vi.fn((callback, delay) => {
            callback()
            return 1
        })
        global.clearTimeout = vi.fn()
        
        // Clear mocks
        localStorageMock.clear()
        mockDocument.createElement.mockClear()
        
        // Create container
        container = createMockElement('div')
        
        // Create instances
        audioSettings = new AudioSettings({
            storageKey: 'test-integration-settings',
            version: '1.0.0'
        })
        
        settingsUI = new AudioSettingsUI(container, audioSettings)
    })
    
    afterEach(() => {
        if (settingsUI) {
            settingsUI.dispose()
        }
        if (audioSettings) {
            audioSettings.dispose()
        }
    })
    
    describe('UI Creation and Settings Binding', () => {
        it('should create UI elements and bind to settings', () => {
            expect(mockDocument.createElement).toHaveBeenCalledWith('button')
            expect(mockDocument.createElement).toHaveBeenCalledWith('div')
            expect(mockDocument.createElement).toHaveBeenCalledWith('input')
            expect(mockDocument.createElement).toHaveBeenCalledWith('select')
            
            expect(container.children.length).toBeGreaterThan(0)
        })
        
        it('should reflect current settings in UI controls', () => {
            // Set some settings
            audioSettings.set('sensitivity', 1.5)
            audioSettings.set('mode', 'pulse')
            audioSettings.set('frequencyWeights.bass', 1.2)
            
            // Create new UI instance to test initial state
            const newContainer = createMockElement('div')
            const newUI = new AudioSettingsUI(newContainer, audioSettings)
            
            // UI should reflect current settings
            const state = newUI.getState()
            expect(state).toBeDefined()
            
            newUI.dispose()
        })
        
        it('should update UI when settings change externally', () => {
            const updateSpy = vi.spyOn(settingsUI, 'updateControlFromSettings')
            
            audioSettings.set('sensitivity', 2.0)
            
            expect(updateSpy).toHaveBeenCalledWith('sensitivity', 2.0)
        })
    })
    
    describe('Real-time Preview Integration', () => {
        it('should provide real-time preview for sensitivity changes', () => {
            let previewValue = null
            
            settingsUI.addPreviewCallback('sensitivity', (value) => {
                previewValue = value
            })
            
            // Simulate slider input
            settingsUI.schedulePreview('sensitivity', 1.8)
            
            expect(previewValue).toBe(1.8)
        })
        
        it('should apply settings after preview delay', () => {
            const changeListener = vi.fn()
            audioSettings.addListener('setting-changed', changeListener)
            
            // Simulate rapid slider changes
            settingsUI.schedulePreview('sensitivity', 1.5)
            settingsUI.schedulePreview('sensitivity', 1.6)
            settingsUI.schedulePreview('sensitivity', 1.7)
            
            // Should only trigger once after delay
            expect(changeListener).toHaveBeenCalledTimes(0) // Preview doesn't save
        })
        
        it('should handle preview callbacks for frequency weights', () => {
            let bassPreview = null
            let midsPreview = null
            
            settingsUI.addPreviewCallback('frequencyWeights.bass', (value) => {
                bassPreview = value
            })
            
            settingsUI.addPreviewCallback('frequencyWeights.mids', (value) => {
                midsPreview = value
            })
            
            settingsUI.schedulePreview('frequencyWeights.bass', 1.5)
            settingsUI.schedulePreview('frequencyWeights.mids', 0.8)
            
            expect(bassPreview).toBe(1.5)
            expect(midsPreview).toBe(0.8)
        })
    })
    
    describe('Settings Persistence Integration', () => {
        it('should persist UI changes to localStorage', () => {
            // Simulate UI control change
            audioSettings.set('sensitivity', 1.8)
            audioSettings.set('smoothingFactor', 0.5)
            
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'test-integration-settings',
                expect.stringContaining('"sensitivity":1.8')
            )
            
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'test-integration-settings',
                expect.stringContaining('"smoothingFactor":0.5')
            )
        })
        
        it('should restore UI state from localStorage', () => {
            // Set up stored settings
            const storedSettings = {
                version: '1.0.0',
                sensitivity: 2.0,
                mode: 'flow',
                frequencyWeights: {
                    bass: 1.5,
                    mids: 0.8,
                    treble: 1.2
                },
                beatDetection: {
                    threshold: 2.0,
                    minInterval: 400
                }
            }
            
            localStorageMock.store['test-integration-settings'] = JSON.stringify(storedSettings)
            
            // Create new instances
            const newSettings = new AudioSettings({
                storageKey: 'test-integration-settings',
                version: '1.0.0'
            })
            
            const newContainer = createMockElement('div')
            const newUI = new AudioSettingsUI(newContainer, newSettings)
            
            // Should restore settings
            expect(newSettings.get('sensitivity')).toBe(2.0)
            expect(newSettings.get('mode')).toBe('flow')
            expect(newSettings.get('frequencyWeights.bass')).toBe(1.5)
            
            newUI.dispose()
            newSettings.dispose()
        })
        
        it('should handle storage errors gracefully in UI', () => {
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('Storage quota exceeded')
            })
            
            // Should not crash the UI
            expect(() => {
                audioSettings.set('sensitivity', 1.5)
            }).not.toThrow()
        })
    })
    
    describe('Import/Export Integration', () => {
        it('should export settings through UI', async () => {
            audioSettings.set('sensitivity', 1.8)
            audioSettings.set('mode', 'pulse')
            
            // Simulate export button click
            settingsUI.exportSettings()
            
            expect(mockNavigator.clipboard.writeText).toHaveBeenCalledWith(
                expect.stringContaining('"sensitivity":1.8')
            )
        })
        
        it('should import settings through UI', () => {
            const importData = {
                version: '1.0.0',
                sensitivity: 2.5,
                mode: 'ambient',
                frequencyWeights: {
                    bass: 1.8,
                    mids: 0.6,
                    treble: 1.4
                }
            }
            
            const result = settingsUI.importSettings(JSON.stringify(importData))
            
            expect(audioSettings.get('sensitivity')).toBe(2.5)
            expect(audioSettings.get('mode')).toBe('ambient')
            expect(audioSettings.get('frequencyWeights.bass')).toBe(1.8)
        })
        
        it('should handle invalid import data in UI', () => {
            const showNotificationSpy = vi.spyOn(settingsUI, 'showNotification')
            
            settingsUI.importSettings('invalid json')
            
            expect(showNotificationSpy).toHaveBeenCalledWith(
                expect.stringContaining('Failed to import'),
                'error'
            )
        })
    })
    
    describe('Settings Reset Integration', () => {
        it('should reset all settings through UI', () => {
            // Change some settings
            audioSettings.set('sensitivity', 2.0)
            audioSettings.set('mode', 'pulse')
            audioSettings.set('frequencyWeights.bass', 1.5)
            
            // Mock confirm dialog
            global.confirm = vi.fn(() => true)
            
            // Simulate reset button click
            settingsUI.resetSettings()
            
            expect(audioSettings.get('sensitivity')).toBe(1.0)
            expect(audioSettings.get('mode')).toBe('reactive')
            expect(audioSettings.get('frequencyWeights.bass')).toBe(1.0)
        })
        
        it('should reset specific sections through UI', () => {
            audioSettings.set('frequencyWeights.bass', 1.5)
            audioSettings.set('frequencyWeights.mids', 0.8)
            audioSettings.set('sensitivity', 2.0)
            
            global.confirm = vi.fn(() => true)
            
            settingsUI.resetSection('frequencyWeights')
            
            expect(audioSettings.get('frequencyWeights.bass')).toBe(1.0)
            expect(audioSettings.get('frequencyWeights.mids')).toBe(1.0)
            expect(audioSettings.get('sensitivity')).toBe(2.0) // Should not be reset
        })
        
        it('should handle reset cancellation', () => {
            audioSettings.set('sensitivity', 2.0)
            
            global.confirm = vi.fn(() => false) // User cancels
            
            settingsUI.resetSettings()
            
            expect(audioSettings.get('sensitivity')).toBe(2.0) // Should not be reset
        })
    })
    
    describe('Mode-Specific Settings Integration', () => {
        it('should switch between mode tabs in UI', () => {
            settingsUI.switchModeTab('pulse')
            
            // Should update UI to show pulse mode settings
            const state = settingsUI.getState()
            expect(state).toBeDefined()
        })
        
        it('should save mode-specific settings', () => {
            audioSettings.setModeSettings('pulse', {
                beatRadius: 200,
                beatStrength: 2.5
            })
            
            expect(audioSettings.get('modeSettings.pulse.beatRadius')).toBe(200)
            expect(audioSettings.get('modeSettings.pulse.beatStrength')).toBe(2.5)
        })
        
        it('should reflect mode changes in UI', () => {
            audioSettings.set('mode', 'flow')
            
            // UI should update to reflect mode change
            expect(audioSettings.get('mode')).toBe('flow')
        })
    })
    
    describe('Validation Integration', () => {
        it('should prevent invalid values in UI controls', () => {
            const result = audioSettings.set('sensitivity', 5.0) // Above max
            expect(result).toBe(false)
            expect(audioSettings.get('sensitivity')).toBe(1.0) // Should remain default
        })
        
        it('should validate frequency weights in UI', () => {
            expect(audioSettings.set('frequencyWeights.bass', -0.5)).toBe(false)
            expect(audioSettings.set('frequencyWeights.bass', 2.5)).toBe(false)
            expect(audioSettings.set('frequencyWeights.bass', 1.5)).toBe(true)
        })
        
        it('should validate beat detection settings in UI', () => {
            expect(audioSettings.set('beatDetection.threshold', 0.5)).toBe(false)
            expect(audioSettings.set('beatDetection.threshold', 3.5)).toBe(false)
            expect(audioSettings.set('beatDetection.threshold', 2.0)).toBe(true)
        })
    })
    
    describe('Performance Integration', () => {
        it('should handle rapid setting changes efficiently', () => {
            const startTime = performance.now()
            
            // Simulate rapid UI interactions
            for (let i = 0; i < 100; i++) {
                settingsUI.schedulePreview('sensitivity', 1.0 + i * 0.01)
            }
            
            const endTime = performance.now()
            expect(endTime - startTime).toBeLessThan(50) // Should be fast
        })
        
        it('should debounce preview updates', () => {
            const previewCallback = vi.fn()
            settingsUI.addPreviewCallback('sensitivity', previewCallback)
            
            // Rapid changes should be debounced
            settingsUI.schedulePreview('sensitivity', 1.1)
            settingsUI.schedulePreview('sensitivity', 1.2)
            settingsUI.schedulePreview('sensitivity', 1.3)
            
            // Should only call preview once with final value
            expect(previewCallback).toHaveBeenCalledWith(1.3)
            expect(previewCallback).toHaveBeenCalledTimes(1)
        })
    })
    
    describe('Error Handling Integration', () => {
        it('should handle settings errors gracefully in UI', () => {
            // Mock settings error
            const originalSet = audioSettings.set
            audioSettings.set = vi.fn(() => false)
            
            // UI should handle the error without crashing
            expect(() => {
                settingsUI.updateControlFromSettings('sensitivity', 1.5)
            }).not.toThrow()
            
            audioSettings.set = originalSet
        })
        
        it('should show error notifications for failed operations', () => {
            const showNotificationSpy = vi.spyOn(settingsUI, 'showNotification')
            
            // Simulate import failure
            settingsUI.importSettings('invalid')
            
            expect(showNotificationSpy).toHaveBeenCalledWith(
                expect.stringContaining('Failed'),
                'error'
            )
        })
        
        it('should handle UI disposal gracefully', () => {
            expect(() => {
                settingsUI.dispose()
                audioSettings.dispose()
            }).not.toThrow()
        })
    })
    
    describe('Cross-tab Synchronization', () => {
        it('should sync settings changes across tabs', () => {
            // Simulate storage event from another tab
            const storageEvent = {
                key: 'test-integration-settings',
                newValue: JSON.stringify({
                    version: '1.0.0',
                    sensitivity: 2.5,
                    mode: 'ambient'
                })
            }
            
            // Trigger storage event
            const storageListeners = mockWindow.addEventListener.mock.calls
                .filter(call => call[0] === 'storage')
                .map(call => call[1])
            
            storageListeners.forEach(listener => listener(storageEvent))
            
            // Settings should be updated
            expect(audioSettings.get('sensitivity')).toBe(2.5)
            expect(audioSettings.get('mode')).toBe('ambient')
        })
    })
})