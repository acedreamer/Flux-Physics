/**
 * AudioSettings - Audio settings persistence and customization system
 * 
 * Provides:
 * - Settings persistence with localStorage
 * - Sensitivity adjustment with real-time preview
 * - Frequency range weight customization
 * - Beat detection threshold configuration
 * - Smoothing factor adjustment for visual responsiveness
 */

export class AudioSettings {
    constructor(options = {}) {
        this.storageKey = options.storageKey || 'flux-audio-settings'
        this.version = options.version || '1.0.0'
        
        // Default settings configuration
        this.defaultSettings = {
            version: this.version,
            
            // General audio settings
            sensitivity: 1.0,
            smoothingFactor: 0.7,
            mode: 'reactive',
            enabled: false,
            
            // Frequency range weights (0-2 multipliers)
            frequencyWeights: {
                bass: 1.0,      // 20-250Hz
                mids: 1.0,      // 250Hz-4kHz  
                treble: 1.0     // 4kHz-20kHz
            },
            
            // Beat detection configuration
            beatDetection: {
                threshold: 1.3,           // Energy threshold multiplier
                minInterval: 300,         // Minimum ms between beats
                historySize: 43,          // Analysis history size (~1 second)
                varianceMultiplier: 1.5,  // Variance sensitivity
                minimumEnergy: 0.1        // Minimum energy to consider
            },
            
            // Visual effect settings
            effects: {
                bloomIntensity: 1.0,
                colorShiftSpeed: 0.05,
                sparkleThreshold: 0.2,
                pulseStrength: 1.0
            },
            
            // Mode-specific configurations
            modeSettings: {
                pulse: {
                    beatRadius: 150,
                    beatStrength: 2.0,
                    bassRadius: 100,
                    bassStrength: 0.5
                },
                reactive: {
                    gravityMultiplier: 2.0,
                    swirlRadius: 80,
                    swirlStrength: 0.8
                },
                flow: {
                    flowSpeed: 1.0,
                    channelSeparation: 0.3,
                    directionSmoothing: 0.8
                },
                ambient: {
                    driftStrength: 0.2,
                    bloomVariation: 0.3
                }
            },
            
            // UI preferences
            ui: {
                panelAutoHide: false,
                spectrumDisplay: true,
                beatIndicator: true,
                volumeMeter: true,
                showAdvanced: false
            },
            
            // Performance settings
            performance: {
                fftSize: 2048,
                updateRate: 60,
                enableWorker: false,
                adaptiveQuality: true
            }
        }
        
        // Current settings (loaded from storage or defaults)
        this.currentSettings = {}
        
        // Change listeners
        this.changeListeners = new Map()
        
        // Validation rules
        this.validationRules = {
            sensitivity: { min: 0.1, max: 3.0 },
            smoothingFactor: { min: 0.0, max: 1.0 },
            'frequencyWeights.bass': { min: 0.0, max: 2.0 },
            'frequencyWeights.mids': { min: 0.0, max: 2.0 },
            'frequencyWeights.treble': { min: 0.0, max: 2.0 },
            'beatDetection.threshold': { min: 1.0, max: 3.0 },
            'beatDetection.minInterval': { min: 100, max: 1000 },
            'effects.bloomIntensity': { min: 0.5, max: 3.0 },
            'effects.pulseStrength': { min: 0.1, max: 2.0 }
        }
        
        this.initialize()
    }
    
    /**
     * Initialize settings system
     */
    initialize() {
        this.loadSettings()
        this.validateSettings()
        
        // Listen for storage changes from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey) {
                this.loadSettings()
                this.notifyListeners('storage-update', this.currentSettings)
            }
        })
        
        console.log('AudioSettings initialized with version', this.version)
    }
    
    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const stored = localStorage.getItem(this.storageKey)
            if (stored) {
                const parsed = JSON.parse(stored)
                
                // Check version compatibility
                if (parsed.version !== this.version) {
                    console.log(`Settings version mismatch. Migrating from ${parsed.version} to ${this.version}`)
                    this.currentSettings = this.migrateSettings(parsed)
                } else {
                    this.currentSettings = this.mergeWithDefaults(parsed)
                }
            } else {
                this.currentSettings = this.deepClone(this.defaultSettings)
            }
        } catch (error) {
            console.warn('Failed to load audio settings from localStorage:', error)
            this.currentSettings = this.deepClone(this.defaultSettings)
        }
    }
    
    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            const toSave = {
                ...this.currentSettings,
                version: this.version,
                lastModified: Date.now()
            }
            
            localStorage.setItem(this.storageKey, JSON.stringify(toSave))
            this.notifyListeners('settings-saved', this.currentSettings)
            
            return true
        } catch (error) {
            console.error('Failed to save audio settings to localStorage:', error)
            this.notifyListeners('save-error', error)
            return false
        }
    }
    
    /**
     * Get a setting value by path
     * @param {string} path - Dot-notation path (e.g., 'frequencyWeights.bass')
     * @param {*} defaultValue - Default value if not found
     * @returns {*} Setting value
     */
    get(path, defaultValue = undefined) {
        return this.getNestedValue(this.currentSettings, path, defaultValue)
    }
    
    /**
     * Set a setting value by path
     * @param {string} path - Dot-notation path
     * @param {*} value - New value
     * @param {boolean} save - Whether to save immediately
     * @returns {boolean} Success status
     */
    set(path, value, save = true) {
        // Validate the value
        if (!this.validateValue(path, value)) {
            console.warn(`Invalid value for setting ${path}:`, value)
            return false
        }
        
        // Store old value for change notification
        const oldValue = this.get(path)
        
        // Set the new value
        this.setNestedValue(this.currentSettings, path, value)
        
        // Save if requested
        if (save) {
            this.saveSettings()
        }
        
        // Notify listeners of the change
        this.notifyListeners('setting-changed', {
            path,
            oldValue,
            newValue: value,
            settings: this.currentSettings
        })
        
        return true
    }
    
    /**
     * Update multiple settings at once
     * @param {Object} updates - Object with path-value pairs
     * @param {boolean} save - Whether to save immediately
     * @returns {boolean} Success status
     */
    update(updates, save = true) {
        const changes = []
        let success = true
        
        // Apply all updates
        for (const [path, value] of Object.entries(updates)) {
            if (this.validateValue(path, value)) {
                const oldValue = this.get(path)
                this.setNestedValue(this.currentSettings, path, value)
                changes.push({ path, oldValue, newValue: value })
            } else {
                console.warn(`Invalid value for setting ${path}:`, value)
                success = false
            }
        }
        
        // Save if requested and successful
        if (save && success) {
            this.saveSettings()
        }
        
        // Notify listeners of all changes
        changes.forEach(change => {
            this.notifyListeners('setting-changed', {
                ...change,
                settings: this.currentSettings
            })
        })
        
        return success
    }
    
    /**
     * Reset settings to defaults
     * @param {string|null} section - Specific section to reset, or null for all
     */
    reset(section = null) {
        if (section) {
            // Reset specific section
            const defaultSection = this.getNestedValue(this.defaultSettings, section)
            if (defaultSection !== undefined) {
                this.setNestedValue(this.currentSettings, section, this.deepClone(defaultSection))
            }
        } else {
            // Reset all settings
            this.currentSettings = this.deepClone(this.defaultSettings)
        }
        
        this.saveSettings()
        this.notifyListeners('settings-reset', { section, settings: this.currentSettings })
    }
    
    /**
     * Get all current settings
     * @returns {Object} Current settings object
     */
    getAll() {
        return this.deepClone(this.currentSettings)
    }
    
    /**
     * Get settings for a specific mode
     * @param {string} mode - Mode name
     * @returns {Object} Mode-specific settings
     */
    getModeSettings(mode) {
        return this.get(`modeSettings.${mode}`, {})
    }
    
    /**
     * Update settings for a specific mode
     * @param {string} mode - Mode name
     * @param {Object} settings - New mode settings
     */
    setModeSettings(mode, settings) {
        this.set(`modeSettings.${mode}`, settings)
    }
    
    /**
     * Add a change listener
     * @param {string} event - Event type ('setting-changed', 'settings-saved', etc.)
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    addListener(event, callback) {
        if (!this.changeListeners.has(event)) {
            this.changeListeners.set(event, new Set())
        }
        
        this.changeListeners.get(event).add(callback)
        
        // Return unsubscribe function
        return () => {
            const listeners = this.changeListeners.get(event)
            if (listeners) {
                listeners.delete(callback)
            }
        }
    }
    
    /**
     * Remove a change listener
     * @param {string} event - Event type
     * @param {Function} callback - Callback function
     */
    removeListener(event, callback) {
        const listeners = this.changeListeners.get(event)
        if (listeners) {
            listeners.delete(callback)
        }
    }
    
    /**
     * Export settings to JSON string
     * @returns {string} JSON string of current settings
     */
    export() {
        return JSON.stringify(this.currentSettings, null, 2)
    }
    
    /**
     * Import settings from JSON string
     * @param {string} jsonString - JSON string of settings
     * @returns {boolean} Success status
     */
    import(jsonString) {
        try {
            const imported = JSON.parse(jsonString)
            
            // Validate imported settings
            if (this.validateImportedSettings(imported)) {
                this.currentSettings = this.mergeWithDefaults(imported)
                this.saveSettings()
                this.notifyListeners('settings-imported', this.currentSettings)
                return true
            } else {
                console.warn('Invalid settings format in import')
                return false
            }
        } catch (error) {
            console.error('Failed to import settings:', error)
            return false
        }
    }
    
    /**
     * Validate a setting value
     * @param {string} path - Setting path
     * @param {*} value - Value to validate
     * @returns {boolean} Is valid
     */
    validateValue(path, value) {
        const rule = this.validationRules[path]
        if (!rule) return true // No validation rule = always valid
        
        if (typeof value === 'number') {
            return value >= rule.min && value <= rule.max
        }
        
        return true
    }
    
    /**
     * Validate all current settings
     */
    validateSettings() {
        let hasErrors = false
        
        for (const [path, rule] of Object.entries(this.validationRules)) {
            const value = this.get(path)
            if (value !== undefined && !this.validateValue(path, value)) {
                console.warn(`Invalid setting value at ${path}:`, value)
                // Reset to default
                const defaultValue = this.getNestedValue(this.defaultSettings, path)
                this.setNestedValue(this.currentSettings, path, defaultValue)
                hasErrors = true
            }
        }
        
        if (hasErrors) {
            this.saveSettings()
        }
    }
    
    /**
     * Migrate settings from older version
     * @param {Object} oldSettings - Old settings object
     * @returns {Object} Migrated settings
     */
    migrateSettings(oldSettings) {
        // For now, just merge with defaults
        // In future versions, add specific migration logic
        return this.mergeWithDefaults(oldSettings)
    }
    
    /**
     * Merge settings with defaults
     * @param {Object} settings - Settings to merge
     * @returns {Object} Merged settings
     */
    mergeWithDefaults(settings) {
        return this.deepMerge(this.deepClone(this.defaultSettings), settings)
    }
    
    /**
     * Validate imported settings structure
     * @param {Object} settings - Settings to validate
     * @returns {boolean} Is valid
     */
    validateImportedSettings(settings) {
        // Basic structure validation
        return typeof settings === 'object' && settings !== null
    }
    
    /**
     * Notify all listeners of an event
     * @param {string} event - Event type
     * @param {*} data - Event data
     */
    notifyListeners(event, data) {
        const listeners = this.changeListeners.get(event)
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data)
                } catch (error) {
                    console.error(`Error in settings listener for ${event}:`, error)
                }
            })
        }
    }
    
    /**
     * Get nested object value by dot notation path
     * @param {Object} obj - Object to search
     * @param {string} path - Dot notation path
     * @param {*} defaultValue - Default if not found
     * @returns {*} Found value or default
     */
    getNestedValue(obj, path, defaultValue = undefined) {
        const keys = path.split('.')
        let current = obj
        
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key]
            } else {
                return defaultValue
            }
        }
        
        return current
    }
    
    /**
     * Set nested object value by dot notation path
     * @param {Object} obj - Object to modify
     * @param {string} path - Dot notation path
     * @param {*} value - Value to set
     */
    setNestedValue(obj, path, value) {
        const keys = path.split('.')
        const lastKey = keys.pop()
        let current = obj
        
        // Navigate to parent object
        for (const key of keys) {
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {}
            }
            current = current[key]
        }
        
        // Set the value
        current[lastKey] = value
    }
    
    /**
     * Deep clone an object
     * @param {*} obj - Object to clone
     * @returns {*} Cloned object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj
        if (obj instanceof Date) return new Date(obj)
        if (obj instanceof Array) return obj.map(item => this.deepClone(item))
        
        const cloned = {}
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key])
            }
        }
        return cloned
    }
    
    /**
     * Deep merge two objects
     * @param {Object} target - Target object
     * @param {Object} source - Source object
     * @returns {Object} Merged object
     */
    deepMerge(target, source) {
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key] || typeof target[key] !== 'object') {
                        target[key] = {}
                    }
                    this.deepMerge(target[key], source[key])
                } else {
                    target[key] = source[key]
                }
            }
        }
        return target
    }
    
    /**
     * Get settings summary for debugging
     * @returns {Object} Settings summary
     */
    getSummary() {
        return {
            version: this.version,
            storageKey: this.storageKey,
            settingsCount: Object.keys(this.currentSettings).length,
            listenerCount: Array.from(this.changeListeners.values())
                .reduce((total, set) => total + set.size, 0),
            lastModified: this.currentSettings.lastModified || 'Never',
            storageSize: JSON.stringify(this.currentSettings).length
        }
    }
    
    /**
     * Dispose of the settings system
     */
    dispose() {
        // Remove storage listener
        window.removeEventListener('storage', this.storageEventHandler)
        
        // Clear all listeners
        this.changeListeners.clear()
        
        // Clear settings
        this.currentSettings = {}
    }
}