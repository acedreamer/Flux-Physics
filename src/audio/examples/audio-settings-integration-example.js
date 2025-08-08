/**
 * Audio Settings Integration Example
 * 
 * Demonstrates how to integrate the AudioSettings and AudioSettingsUI
 * with the existing audio reactive system components.
 */

import { AudioSettings } from '../core/audio-settings.js'
import { AudioSettingsUI } from '../ui/audio-settings-ui.js'
import { AudioUI } from '../ui/audio-ui.js'
import { AudioEffects } from '../core/audio-effects.js'

/**
 * Example integration class that shows how to wire together
 * all audio settings components with the main audio system
 */
export class AudioSettingsIntegration {
    constructor(container, fluxApp, options = {}) {
        this.container = container
        this.fluxApp = fluxApp
        this.options = options
        
        // Initialize settings system
        this.audioSettings = new AudioSettings({
            storageKey: 'flux-audio-settings',
            version: '1.0.0'
        })
        
        // Initialize settings UI
        this.settingsUI = new AudioSettingsUI(container, this.audioSettings)
        
        // Initialize main audio UI (if not already created)
        this.audioUI = options.audioUI || new AudioUI(container)
        
        // Initialize audio effects (if not already created)
        this.audioEffects = options.audioEffects || new AudioEffects(fluxApp)
        
        // Bind settings to components
        this.bindSettingsToComponents()
        
        // Setup real-time preview callbacks
        this.setupPreviewCallbacks()
        
        // Apply initial settings
        this.applyInitialSettings()
        
        console.log('AudioSettingsIntegration initialized')
    }
    
    /**
     * Bind settings changes to audio components
     */
    bindSettingsToComponents() {
        // Listen for settings changes
        this.audioSettings.addListener('setting-changed', (data) => {
            this.handleSettingChange(data.path, data.newValue, data.oldValue)
        })
        
        // Listen for settings reset
        this.audioSettings.addListener('settings-reset', (data) => {
            this.handleSettingsReset(data.section)
        })
        
        // Listen for settings import
        this.audioSettings.addListener('settings-imported', (settings) => {
            this.handleSettingsImport(settings)
        })
    }
    
    /**
     * Setup real-time preview callbacks for immediate visual feedback
     */
    setupPreviewCallbacks() {
        // Sensitivity preview
        this.settingsUI.addPreviewCallback('sensitivity', (value) => {
            if (this.audioEffects) {
                this.audioEffects.setIntensity(value)
            }
        })
        
        // Smoothing factor preview
        this.settingsUI.addPreviewCallback('smoothingFactor', (value) => {
            if (this.audioEffects) {
                this.audioEffects.setSmoothingFactor(value)
            }
        })
        
        // Frequency weight previews
        this.settingsUI.addPreviewCallback('frequencyWeights.bass', (value) => {
            this.previewFrequencyWeight('bass', value)
        })
        
        this.settingsUI.addPreviewCallback('frequencyWeights.mids', (value) => {
            this.previewFrequencyWeight('mids', value)
        })
        
        this.settingsUI.addPreviewCallback('frequencyWeights.treble', (value) => {
            this.previewFrequencyWeight('treble', value)
        })
        
        // Beat detection threshold preview
        this.settingsUI.addPreviewCallback('beatDetection.threshold', (value) => {
            this.previewBeatThreshold(value)
        })
        
        // Mode-specific setting previews
        this.setupModePreviewCallbacks()
    }
    
    /**
     * Setup preview callbacks for mode-specific settings
     */
    setupModePreviewCallbacks() {
        // Pulse mode previews
        this.settingsUI.addPreviewCallback('modeSettings.pulse.beatRadius', (value) => {
            this.previewModeConfig('pulse', 'beatRadius', value)
        })
        
        this.settingsUI.addPreviewCallback('modeSettings.pulse.beatStrength', (value) => {
            this.previewModeConfig('pulse', 'beatStrength', value)
        })
        
        // Reactive mode previews
        this.settingsUI.addPreviewCallback('modeSettings.reactive.gravityMultiplier', (value) => {
            this.previewModeConfig('reactive', 'gravityMultiplier', value)
        })
        
        this.settingsUI.addPreviewCallback('modeSettings.reactive.swirlRadius', (value) => {
            this.previewModeConfig('reactive', 'swirlRadius', value)
        })
        
        // Flow mode previews
        this.settingsUI.addPreviewCallback('modeSettings.flow.flowSpeed', (value) => {
            this.previewModeConfig('flow', 'flowSpeed', value)
        })
        
        // Ambient mode previews
        this.settingsUI.addPreviewCallback('modeSettings.ambient.driftStrength', (value) => {
            this.previewModeConfig('ambient', 'driftStrength', value)
        })
    }
    
    /**
     * Apply initial settings to all components
     */
    applyInitialSettings() {
        const settings = this.audioSettings.getAll()
        
        // Apply to audio effects
        if (this.audioEffects) {
            this.audioEffects.setIntensity(settings.sensitivity)
            this.audioEffects.setSmoothingFactor(settings.smoothingFactor)
            this.audioEffects.setMode(settings.mode)
            
            // Apply mode-specific settings
            Object.keys(settings.modeSettings).forEach(mode => {
                this.audioEffects.updateModeConfig(mode, settings.modeSettings[mode])
            })
        }
        
        // Apply to audio UI
        if (this.audioUI) {
            // Update UI state based on settings
            const uiSettings = settings.ui || {}
            this.applyUISettings(uiSettings)
        }
        
        console.log('Initial audio settings applied:', {
            sensitivity: settings.sensitivity,
            smoothingFactor: settings.smoothingFactor,
            mode: settings.mode
        })
    }
    
    /**
     * Handle individual setting changes
     * @param {string} path - Setting path
     * @param {*} newValue - New value
     * @param {*} oldValue - Previous value
     */
    handleSettingChange(path, newValue, oldValue) {
        console.log(`Audio setting changed: ${path} = ${newValue} (was ${oldValue})`)
        
        switch (path) {
            case 'sensitivity':
                if (this.audioEffects) {
                    this.audioEffects.setIntensity(newValue)
                }
                break
                
            case 'smoothingFactor':
                if (this.audioEffects) {
                    this.audioEffects.setSmoothingFactor(newValue)
                }
                break
                
            case 'mode':
                if (this.audioEffects) {
                    this.audioEffects.setMode(newValue)
                }
                if (this.audioUI) {
                    this.audioUI.onModeChange(newValue)
                }
                break
                
            case 'enabled':
                this.handleAudioToggle(newValue)
                break
                
            default:
                // Handle nested settings
                if (path.startsWith('frequencyWeights.')) {
                    this.handleFrequencyWeightChange(path, newValue)
                } else if (path.startsWith('beatDetection.')) {
                    this.handleBeatDetectionChange(path, newValue)
                } else if (path.startsWith('modeSettings.')) {
                    this.handleModeSettingChange(path, newValue)
                } else if (path.startsWith('effects.')) {
                    this.handleEffectSettingChange(path, newValue)
                } else if (path.startsWith('ui.')) {
                    this.handleUISettingChange(path, newValue)
                }
                break
        }
    }
    
    /**
     * Handle frequency weight changes
     * @param {string} path - Setting path
     * @param {number} value - New weight value
     */
    handleFrequencyWeightChange(path, value) {
        const frequencyType = path.split('.')[1] // bass, mids, or treble
        
        // Apply to audio analyzer if available
        if (this.audioAnalyzer && this.audioAnalyzer.setFrequencyWeight) {
            this.audioAnalyzer.setFrequencyWeight(frequencyType, value)
        }
        
        console.log(`Frequency weight updated: ${frequencyType} = ${value}`)
    }
    
    /**
     * Handle beat detection setting changes
     * @param {string} path - Setting path
     * @param {*} value - New value
     */
    handleBeatDetectionChange(path, value) {
        const setting = path.split('.')[1]
        
        // Apply to beat detector if available
        if (this.beatDetector) {
            switch (setting) {
                case 'threshold':
                    this.beatDetector.beatThreshold = value
                    break
                case 'minInterval':
                    this.beatDetector.minBeatInterval = value
                    break
                case 'minimumEnergy':
                    this.beatDetector.config.minimumEnergy = value
                    break
            }
        }
        
        console.log(`Beat detection setting updated: ${setting} = ${value}`)
    }
    
    /**
     * Handle mode-specific setting changes
     * @param {string} path - Setting path
     * @param {*} value - New value
     */
    handleModeSettingChange(path, value) {
        const pathParts = path.split('.')
        const mode = pathParts[1]
        const setting = pathParts[2]
        
        if (this.audioEffects) {
            const currentConfig = this.audioEffects.getCurrentModeConfig()
            this.audioEffects.updateModeConfig(mode, {
                ...currentConfig,
                [setting]: value
            })
        }
        
        console.log(`Mode setting updated: ${mode}.${setting} = ${value}`)
    }
    
    /**
     * Handle effect setting changes
     * @param {string} path - Setting path
     * @param {*} value - New value
     */
    handleEffectSettingChange(path, value) {
        const setting = path.split('.')[1]
        
        // Apply effect settings to renderer or effects system
        if (this.fluxApp && this.fluxApp.particleRenderer) {
            switch (setting) {
                case 'bloomIntensity':
                    this.fluxApp.particleRenderer.updateBloomIntensity(value)
                    break
                case 'colorShiftSpeed':
                    // Apply color shift speed
                    break
                case 'pulseStrength':
                    // Apply pulse strength
                    break
            }
        }
        
        console.log(`Effect setting updated: ${setting} = ${value}`)
    }
    
    /**
     * Handle UI setting changes
     * @param {string} path - Setting path
     * @param {*} value - New value
     */
    handleUISettingChange(path, value) {
        const setting = path.split('.')[1]
        
        if (this.audioUI) {
            switch (setting) {
                case 'panelAutoHide':
                    // Configure auto-hide behavior
                    break
                case 'spectrumDisplay':
                    // Show/hide spectrum display
                    break
                case 'beatIndicator':
                    // Show/hide beat indicator
                    break
            }
        }
        
        console.log(`UI setting updated: ${setting} = ${value}`)
    }
    
    /**
     * Handle audio toggle
     * @param {boolean} enabled - Whether audio is enabled
     */
    handleAudioToggle(enabled) {
        if (enabled) {
            if (this.audioEffects) {
                this.audioEffects.enable()
            }
        } else {
            if (this.audioEffects) {
                this.audioEffects.disable()
            }
        }
        
        console.log(`Audio reactive mode ${enabled ? 'enabled' : 'disabled'}`)
    }
    
    /**
     * Handle complete settings reset
     * @param {string|null} section - Section that was reset, or null for all
     */
    handleSettingsReset(section) {
        if (section) {
            console.log(`Settings section reset: ${section}`)
        } else {
            console.log('All settings reset to defaults')
            this.applyInitialSettings()
        }
    }
    
    /**
     * Handle settings import
     * @param {Object} settings - Imported settings
     */
    handleSettingsImport(settings) {
        console.log('Settings imported, applying to components')
        this.applyInitialSettings()
    }
    
    /**
     * Preview frequency weight change
     * @param {string} type - Frequency type (bass, mids, treble)
     * @param {number} value - Preview value
     */
    previewFrequencyWeight(type, value) {
        // Apply temporary frequency weight for preview
        if (this.audioAnalyzer && this.audioAnalyzer.previewFrequencyWeight) {
            this.audioAnalyzer.previewFrequencyWeight(type, value)
        }
    }
    
    /**
     * Preview beat detection threshold
     * @param {number} value - Preview threshold value
     */
    previewBeatThreshold(value) {
        // Apply temporary beat threshold for preview
        if (this.beatDetector) {
            this.beatDetector.previewThreshold = value
        }
    }
    
    /**
     * Preview mode configuration change
     * @param {string} mode - Mode name
     * @param {string} setting - Setting name
     * @param {*} value - Preview value
     */
    previewModeConfig(mode, setting, value) {
        if (this.audioEffects && this.audioEffects.currentMode === mode) {
            // Apply temporary config for preview
            const currentConfig = this.audioEffects.getCurrentModeConfig()
            this.audioEffects.updateModeConfig(mode, {
                ...currentConfig,
                [setting]: value
            })
        }
    }
    
    /**
     * Apply UI settings
     * @param {Object} uiSettings - UI configuration
     */
    applyUISettings(uiSettings) {
        // Apply UI-specific settings
        Object.keys(uiSettings).forEach(setting => {
            this.handleUISettingChange(`ui.${setting}`, uiSettings[setting])
        })
    }
    
    /**
     * Connect audio analyzer for frequency weight control
     * @param {Object} audioAnalyzer - Audio analyzer instance
     */
    connectAudioAnalyzer(audioAnalyzer) {
        this.audioAnalyzer = audioAnalyzer
        
        // Apply current frequency weights
        const weights = this.audioSettings.get('frequencyWeights')
        Object.keys(weights).forEach(type => {
            if (audioAnalyzer.setFrequencyWeight) {
                audioAnalyzer.setFrequencyWeight(type, weights[type])
            }
        })
    }
    
    /**
     * Connect beat detector for threshold control
     * @param {Object} beatDetector - Beat detector instance
     */
    connectBeatDetector(beatDetector) {
        this.beatDetector = beatDetector
        
        // Apply current beat detection settings
        const beatSettings = this.audioSettings.get('beatDetection')
        beatDetector.beatThreshold = beatSettings.threshold
        beatDetector.minBeatInterval = beatSettings.minInterval
        beatDetector.config.minimumEnergy = beatSettings.minimumEnergy
    }
    
    /**
     * Get current settings state
     * @returns {Object} Current settings and UI state
     */
    getState() {
        return {
            settings: this.audioSettings.getAll(),
            settingsUI: this.settingsUI.getState(),
            audioUI: this.audioUI ? this.audioUI.getState() : null,
            audioEffects: this.audioEffects ? this.audioEffects.getEffectState() : null
        }
    }
    
    /**
     * Export current configuration
     * @returns {string} JSON configuration
     */
    exportConfiguration() {
        return this.audioSettings.export()
    }
    
    /**
     * Import configuration
     * @param {string} configJson - JSON configuration
     * @returns {boolean} Success status
     */
    importConfiguration(configJson) {
        return this.audioSettings.import(configJson)
    }
    
    /**
     * Dispose of all components
     */
    dispose() {
        if (this.settingsUI) {
            this.settingsUI.dispose()
        }
        
        if (this.audioSettings) {
            this.audioSettings.dispose()
        }
        
        // Don't dispose of audioUI and audioEffects as they might be managed elsewhere
        
        console.log('AudioSettingsIntegration disposed')
    }
}

/**
 * Factory function to create and configure the complete audio settings system
 * @param {HTMLElement} container - Container element
 * @param {Object} fluxApp - FLUX application instance
 * @param {Object} options - Configuration options
 * @returns {AudioSettingsIntegration} Configured integration instance
 */
export function createAudioSettingsSystem(container, fluxApp, options = {}) {
    const integration = new AudioSettingsIntegration(container, fluxApp, options)
    
    // Apply any initial configuration
    if (options.initialSettings) {
        integration.audioSettings.update(options.initialSettings, false)
        integration.applyInitialSettings()
    }
    
    return integration
}

/**
 * Example usage:
 * 
 * ```javascript
 * import { createAudioSettingsSystem } from './audio-settings-integration-example.js'
 * 
 * // Create the complete audio settings system
 * const audioSettings = createAudioSettingsSystem(
 *     document.getElementById('audio-controls'),
 *     fluxApp,
 *     {
 *         initialSettings: {
 *             sensitivity: 1.2,
 *             mode: 'pulse',
 *             frequencyWeights: {
 *                 bass: 1.3,
 *                 mids: 0.9,
 *                 treble: 1.1
 *             }
 *         }
 *     }
 * )
 * 
 * // Connect audio components when they're available
 * audioSettings.connectAudioAnalyzer(audioAnalyzer)
 * audioSettings.connectBeatDetector(beatDetector)
 * 
 * // Export settings
 * const config = audioSettings.exportConfiguration()
 * 
 * // Import settings
 * audioSettings.importConfiguration(savedConfig)
 * ```
 */