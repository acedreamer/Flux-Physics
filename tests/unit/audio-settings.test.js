/**
 * Unit tests for AudioSettings class
 * Tests settings persistence, validation, and customization functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AudioSettings } from '../../src/audio/core/audio-settings.js'

// Mock localStorage
const localStorageMock = {
    store: {},
    getItem: vi.fn((key) => localStorageMock.store[key] || null),
    setItem: vi.fn((key, value) => {
        localStorageMock.store[key] = value
    }),
    removeItem: vi.fn((key) => {
        delete localStorageMock.store[key]
    }),
    clear: vi.fn(() => {
        localStorageMock.store = {}
    })
}

// Mock window.addEventListener for storage events
const windowEventListeners = {}
const windowAddEventListener = vi.fn((event, callback) => {
    if (!windowEventListeners[event]) {
        windowEventListeners[event] = []
    }
    windowEventListeners[event].push(callback)
})

describe('AudioSettings', () => {
    let audioSettings
    
    beforeEach(() => {
        // Reset localStorage mock
        localStorageMock.clear()
        localStorageMock.getItem.mockClear()
        localStorageMock.setItem.mockClear()
        
        // Mock global objects
        global.localStorage = localStorageMock
        global.window = {
            addEventListener: windowAddEventListener
        }
        
        // Create fresh instance
        audioSettings = new AudioSettings({
            storageKey: 'test-audio-settings',
            version: '1.0.0'
        })
    })
    
    afterEach(() => {
        if (audioSettings) {
            audioSettings.dispose()
        }
    })
    
    describe('Initialization', () => {
        it('should initialize with default settings', () => {
            expect(audioSettings.get('sensitivity')).toBe(1.0)
            expect(audioSettings.get('smoothingFactor')).toBe(0.7)
            expect(audioSettings.get('mode')).toBe('reactive')
            expect(audioSettings.get('enabled')).toBe(false)
        })
        
        it('should initialize frequency weights', () => {
            expect(audioSettings.get('frequencyWeights.bass')).toBe(1.0)
            expect(audioSettings.get('frequencyWeights.mids')).toBe(1.0)
            expect(audioSettings.get('frequencyWeights.treble')).toBe(1.0)
        })
        
        it('should initialize beat detection settings', () => {
            expect(audioSettings.get('beatDetection.threshold')).toBe(1.3)
            expect(audioSettings.get('beatDetection.minInterval')).toBe(300)
            expect(audioSettings.get('beatDetection.minimumEnergy')).toBe(0.1)
        })
        
        it('should setup storage event listener', () => {
            expect(windowAddEventListener).toHaveBeenCalledWith('storage', expect.any(Function))
        })
    })
    
    describe('Settings Persistence', () => {
        it('should save settings to localStorage', () => {
            audioSettings.set('sensitivity', 1.5)
            
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'test-audio-settings',
                expect.stringContaining('"sensitivity":1.5')
            )
        })
        
        it('should load settings from localStorage', () => {
            const testSettings = {
                version: '1.0.0',
                sensitivity: 2.0,
                mode: 'pulse',
                frequencyWeights: {
                    bass: 1.5,
                    mids: 0.8,
                    treble: 1.2
                }
            }
            
            localStorageMock.store['test-audio-settings'] = JSON.stringify(testSettings)
            
            const newSettings = new AudioSettings({
                storageKey: 'test-audio-settings',
                version: '1.0.0'
            })
            
            expect(newSettings.get('sensitivity')).toBe(2.0)
            expect(newSettings.get('mode')).toBe('pulse')
            expect(newSettings.get('frequencyWeights.bass')).toBe(1.5)
            
            newSettings.dispose()
        })
        
        it('should handle corrupted localStorage data', () => {
            localStorageMock.store['test-audio-settings'] = 'invalid json'
            
            const newSettings = new AudioSettings({
                storageKey: 'test-audio-settings',
                version: '1.0.0'
            })
            
            // Should fall back to defaults
            expect(newSettings.get('sensitivity')).toBe(1.0)
            expect(newSettings.get('mode')).toBe('reactive')
            
            newSettings.dispose()
        })
        
        it('should handle localStorage errors gracefully', () => {
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('Storage quota exceeded')
            })
            
            const result = audioSettings.set('sensitivity', 1.5)
            expect(result).toBe(false)
        })
    })
    
    describe('Settings Validation', () => {
        it('should validate sensitivity range', () => {
            expect(audioSettings.set('sensitivity', 0.5)).toBe(true)
            expect(audioSettings.set('sensitivity', 3.0)).toBe(true)
            expect(audioSettings.set('sensitivity', 0.05)).toBe(false) // Below min
            expect(audioSettings.set('sensitivity', 3.5)).toBe(false)  // Above max
        })
        
        it('should validate smoothing factor range', () => {
            expect(audioSettings.set('smoothingFactor', 0.0)).toBe(true)
            expect(audioSettings.set('smoothingFactor', 1.0)).toBe(true)
            expect(audioSettings.set('smoothingFactor', -0.1)).toBe(false)
            expect(audioSettings.set('smoothingFactor', 1.1)).toBe(false)
        })
        
        it('should validate frequency weights', () => {
            expect(audioSettings.set('frequencyWeights.bass', 0.0)).toBe(true)
            expect(audioSettings.set('frequencyWeights.bass', 2.0)).toBe(true)
            expect(audioSettings.set('frequencyWeights.bass', -0.1)).toBe(false)
            expect(audioSettings.set('frequencyWeights.bass', 2.1)).toBe(false)
        })
        
        it('should validate beat detection threshold', () => {
            expect(audioSettings.set('beatDetection.threshold', 1.0)).toBe(true)
            expect(audioSettings.set('beatDetection.threshold', 3.0)).toBe(true)
            expect(audioSettings.set('beatDetection.threshold', 0.9)).toBe(false)
            expect(audioSettings.set('beatDetection.threshold', 3.1)).toBe(false)
        })
        
        it('should allow settings without validation rules', () => {
            expect(audioSettings.set('mode', 'pulse')).toBe(true)
            expect(audioSettings.set('enabled', true)).toBe(true)
        })
    })
    
    describe('Real-time Preview', () => {
        it('should support sensitivity adjustment with preview', () => {
            let previewValue = null
            const unsubscribe = audioSettings.addListener('setting-changed', (data) => {
                if (data.path === 'sensitivity') {
                    previewValue = data.newValue
                }
            })
            
            audioSettings.set('sensitivity', 1.8)
            
            expect(previewValue).toBe(1.8)
            expect(audioSettings.get('sensitivity')).toBe(1.8)
            
            unsubscribe()
        })
        
        it('should notify listeners of setting changes', () => {
            const changeListener = vi.fn()
            const unsubscribe = audioSettings.addListener('setting-changed', changeListener)
            
            audioSettings.set('smoothingFactor', 0.5)
            
            expect(changeListener).toHaveBeenCalledWith({
                path: 'smoothingFactor',
                oldValue: 0.7,
                newValue: 0.5,
                settings: expect.any(Object)
            })
            
            unsubscribe()
        })
        
        it('should support batch updates', () => {
            const changeListener = vi.fn()
            const unsubscribe = audioSettings.addListener('setting-changed', changeListener)
            
            const updates = {
                'sensitivity': 1.5,
                'smoothingFactor': 0.8,
                'frequencyWeights.bass': 1.2
            }
            
            audioSettings.update(updates)
            
            expect(changeListener).toHaveBeenCalledTimes(3)
            expect(audioSettings.get('sensitivity')).toBe(1.5)
            expect(audioSettings.get('smoothingFactor')).toBe(0.8)
            expect(audioSettings.get('frequencyWeights.bass')).toBe(1.2)
            
            unsubscribe()
        })
    })
    
    describe('Frequency Range Customization', () => {
        it('should allow frequency weight customization', () => {
            audioSettings.set('frequencyWeights.bass', 1.5)
            audioSettings.set('frequencyWeights.mids', 0.8)
            audioSettings.set('frequencyWeights.treble', 1.2)
            
            expect(audioSettings.get('frequencyWeights.bass')).toBe(1.5)
            expect(audioSettings.get('frequencyWeights.mids')).toBe(0.8)
            expect(audioSettings.get('frequencyWeights.treble')).toBe(1.2)
        })
        
        it('should reset frequency weights section', () => {
            audioSettings.set('frequencyWeights.bass', 1.5)
            audioSettings.set('frequencyWeights.mids', 0.8)
            
            audioSettings.reset('frequencyWeights')
            
            expect(audioSettings.get('frequencyWeights.bass')).toBe(1.0)
            expect(audioSettings.get('frequencyWeights.mids')).toBe(1.0)
            expect(audioSettings.get('frequencyWeights.treble')).toBe(1.0)
        })
    })
    
    describe('Beat Detection Configuration', () => {
        it('should allow beat threshold configuration', () => {
            audioSettings.set('beatDetection.threshold', 2.0)
            expect(audioSettings.get('beatDetection.threshold')).toBe(2.0)
        })
        
        it('should allow minimum interval configuration', () => {
            audioSettings.set('beatDetection.minInterval', 500)
            expect(audioSettings.get('beatDetection.minInterval')).toBe(500)
        })
        
        it('should allow minimum energy configuration', () => {
            audioSettings.set('beatDetection.minimumEnergy', 0.2)
            expect(audioSettings.get('beatDetection.minimumEnergy')).toBe(0.2)
        })
        
        it('should reset beat detection section', () => {
            audioSettings.set('beatDetection.threshold', 2.0)
            audioSettings.set('beatDetection.minInterval', 500)
            
            audioSettings.reset('beatDetection')
            
            expect(audioSettings.get('beatDetection.threshold')).toBe(1.3)
            expect(audioSettings.get('beatDetection.minInterval')).toBe(300)
        })
    })
    
    describe('Smoothing Factor Adjustment', () => {
        it('should allow smoothing factor adjustment', () => {
            audioSettings.set('smoothingFactor', 0.5)
            expect(audioSettings.get('smoothingFactor')).toBe(0.5)
        })
        
        it('should validate smoothing factor range', () => {
            expect(audioSettings.set('smoothingFactor', 0.0)).toBe(true)
            expect(audioSettings.set('smoothingFactor', 1.0)).toBe(true)
            expect(audioSettings.set('smoothingFactor', -0.1)).toBe(false)
            expect(audioSettings.set('smoothingFactor', 1.1)).toBe(false)
        })
        
        it('should affect visual responsiveness through listeners', () => {
            let responsiveness = null
            const unsubscribe = audioSettings.addListener('setting-changed', (data) => {
                if (data.path === 'smoothingFactor') {
                    responsiveness = 1 - data.newValue // Higher smoothing = lower responsiveness
                }
            })
            
            audioSettings.set('smoothingFactor', 0.9) // High smoothing
            expect(responsiveness).toBe(0.1) // Low responsiveness
            
            audioSettings.set('smoothingFactor', 0.2) // Low smoothing
            expect(responsiveness).toBe(0.8) // High responsiveness
            
            unsubscribe()
        })
    })
    
    describe('Mode-Specific Settings', () => {
        it('should get mode-specific settings', () => {
            const pulseSettings = audioSettings.getModeSettings('pulse')
            expect(pulseSettings.beatRadius).toBe(150)
            expect(pulseSettings.beatStrength).toBe(2.0)
        })
        
        it('should set mode-specific settings', () => {
            const newPulseSettings = {
                beatRadius: 200,
                beatStrength: 2.5,
                bassRadius: 120
            }
            
            audioSettings.setModeSettings('pulse', newPulseSettings)
            
            expect(audioSettings.get('modeSettings.pulse.beatRadius')).toBe(200)
            expect(audioSettings.get('modeSettings.pulse.beatStrength')).toBe(2.5)
            expect(audioSettings.get('modeSettings.pulse.bassRadius')).toBe(120)
        })
        
        it('should handle invalid mode settings', () => {
            const invalidSettings = audioSettings.getModeSettings('invalid-mode')
            expect(invalidSettings).toEqual({})
        })
    })
    
    describe('Import/Export Functionality', () => {
        it('should export settings to JSON', () => {
            audioSettings.set('sensitivity', 1.5)
            audioSettings.set('mode', 'pulse')
            
            const exported = audioSettings.export()
            const parsed = JSON.parse(exported)
            
            expect(parsed.sensitivity).toBe(1.5)
            expect(parsed.mode).toBe('pulse')
            expect(parsed.version).toBe('1.0.0')
        })
        
        it('should import settings from JSON', () => {
            const importData = {
                version: '1.0.0',
                sensitivity: 2.0,
                mode: 'flow',
                frequencyWeights: {
                    bass: 1.5,
                    mids: 0.8,
                    treble: 1.2
                }
            }
            
            const result = audioSettings.import(JSON.stringify(importData))
            
            expect(result).toBe(true)
            expect(audioSettings.get('sensitivity')).toBe(2.0)
            expect(audioSettings.get('mode')).toBe('flow')
            expect(audioSettings.get('frequencyWeights.bass')).toBe(1.5)
        })
        
        it('should handle invalid import data', () => {
            const result = audioSettings.import('invalid json')
            expect(result).toBe(false)
        })
        
        it('should notify listeners on import', () => {
            const importListener = vi.fn()
            const unsubscribe = audioSettings.addListener('settings-imported', importListener)
            
            const importData = { version: '1.0.0', sensitivity: 1.8 }
            audioSettings.import(JSON.stringify(importData))
            
            expect(importListener).toHaveBeenCalledWith(expect.objectContaining({
                sensitivity: 1.8
            }))
            
            unsubscribe()
        })
    })
    
    describe('Settings Reset', () => {
        it('should reset all settings to defaults', () => {
            audioSettings.set('sensitivity', 2.0)
            audioSettings.set('mode', 'pulse')
            audioSettings.set('frequencyWeights.bass', 1.5)
            
            audioSettings.reset()
            
            expect(audioSettings.get('sensitivity')).toBe(1.0)
            expect(audioSettings.get('mode')).toBe('reactive')
            expect(audioSettings.get('frequencyWeights.bass')).toBe(1.0)
        })
        
        it('should reset specific sections', () => {
            audioSettings.set('frequencyWeights.bass', 1.5)
            audioSettings.set('beatDetection.threshold', 2.0)
            audioSettings.set('sensitivity', 1.8)
            
            audioSettings.reset('frequencyWeights')
            
            expect(audioSettings.get('frequencyWeights.bass')).toBe(1.0) // Reset
            expect(audioSettings.get('beatDetection.threshold')).toBe(2.0) // Not reset
            expect(audioSettings.get('sensitivity')).toBe(1.8) // Not reset
        })
        
        it('should notify listeners on reset', () => {
            const resetListener = vi.fn()
            const unsubscribe = audioSettings.addListener('settings-reset', resetListener)
            
            audioSettings.reset('frequencyWeights')
            
            expect(resetListener).toHaveBeenCalledWith({
                section: 'frequencyWeights',
                settings: expect.any(Object)
            })
            
            unsubscribe()
        })
    })
    
    describe('Event Listeners', () => {
        it('should add and remove event listeners', () => {
            const listener = vi.fn()
            const unsubscribe = audioSettings.addListener('setting-changed', listener)
            
            audioSettings.set('sensitivity', 1.5)
            expect(listener).toHaveBeenCalled()
            
            listener.mockClear()
            unsubscribe()
            
            audioSettings.set('sensitivity', 2.0)
            expect(listener).not.toHaveBeenCalled()
        })
        
        it('should handle multiple listeners for same event', () => {
            const listener1 = vi.fn()
            const listener2 = vi.fn()
            
            const unsubscribe1 = audioSettings.addListener('setting-changed', listener1)
            const unsubscribe2 = audioSettings.addListener('setting-changed', listener2)
            
            audioSettings.set('sensitivity', 1.5)
            
            expect(listener1).toHaveBeenCalled()
            expect(listener2).toHaveBeenCalled()
            
            unsubscribe1()
            unsubscribe2()
        })
        
        it('should handle listener errors gracefully', () => {
            const errorListener = vi.fn(() => {
                throw new Error('Listener error')
            })
            const normalListener = vi.fn()
            
            audioSettings.addListener('setting-changed', errorListener)
            audioSettings.addListener('setting-changed', normalListener)
            
            // Should not throw and should still call normal listener
            expect(() => {
                audioSettings.set('sensitivity', 1.5)
            }).not.toThrow()
            
            expect(normalListener).toHaveBeenCalled()
        })
    })
    
    describe('Utility Methods', () => {
        it('should provide settings summary', () => {
            const summary = audioSettings.getSummary()
            
            expect(summary).toHaveProperty('version', '1.0.0')
            expect(summary).toHaveProperty('storageKey', 'test-audio-settings')
            expect(summary).toHaveProperty('settingsCount')
            expect(summary).toHaveProperty('listenerCount')
            expect(summary).toHaveProperty('storageSize')
        })
        
        it('should get all current settings', () => {
            audioSettings.set('sensitivity', 1.5)
            audioSettings.set('mode', 'pulse')
            
            const allSettings = audioSettings.getAll()
            
            expect(allSettings.sensitivity).toBe(1.5)
            expect(allSettings.mode).toBe('pulse')
            expect(allSettings.version).toBe('1.0.0')
        })
        
        it('should handle nested value operations', () => {
            // Test deep nesting
            audioSettings.set('modeSettings.pulse.beatRadius', 200)
            expect(audioSettings.get('modeSettings.pulse.beatRadius')).toBe(200)
            
            // Test non-existent path
            expect(audioSettings.get('nonexistent.path', 'default')).toBe('default')
        })
    })
    
    describe('Performance and Memory', () => {
        it('should handle large number of setting changes efficiently', () => {
            const startTime = performance.now()
            
            for (let i = 0; i < 1000; i++) {
                audioSettings.set('sensitivity', 1.0 + (i % 20) * 0.1, false) // Don't save each time
            }
            
            const endTime = performance.now()
            expect(endTime - startTime).toBeLessThan(100) // Should complete in under 100ms
        })
        
        it('should clean up resources on dispose', () => {
            const listener = vi.fn()
            audioSettings.addListener('setting-changed', listener)
            
            audioSettings.dispose()
            
            // Should not crash and listener should be cleared
            expect(() => {
                audioSettings.set('sensitivity', 1.5)
            }).not.toThrow()
            
            expect(listener).not.toHaveBeenCalled()
        })
    })
})