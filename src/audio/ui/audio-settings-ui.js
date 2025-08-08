/**
 * AudioSettingsUI - User interface for audio settings customization
 * 
 * Provides:
 * - Settings panel with real-time preview
 * - Sensitivity adjustment slider
 * - Frequency range weight controls
 * - Beat detection threshold configuration
 * - Smoothing factor adjustment
 * - Mode-specific settings
 * - Import/export functionality
 */

export class AudioSettingsUI {
    constructor(container, audioSettings, options = {}) {
        this.container = container
        this.audioSettings = audioSettings
        this.isVisible = false
        
        // Configuration
        this.config = {
            panelWidth: 320,
            animationDuration: 300,
            previewDelay: 100, // ms delay for real-time preview
            ...options
        }
        
        // UI elements
        this.elements = {
            toggleButton: null,
            panel: null,
            sections: {},
            controls: {}
        }
        
        // Preview state
        this.previewTimeout = null
        this.previewCallbacks = new Map()
        
        // Settings change listener
        this.settingsUnsubscribe = null
        
        this.createUI()
        this.setupEventListeners()
        this.bindSettings()
    }
    
    /**
     * Create the complete settings UI
     */
    createUI() {
        this.createToggleButton()
        this.createSettingsPanel()
        this.createGeneralSettings()
        this.createFrequencySettings()
        this.createBeatDetectionSettings()
        this.createEffectSettings()
        this.createModeSettings()
        this.createAdvancedSettings()
        this.createImportExportSection()
        
        // Add to container
        this.container.appendChild(this.elements.toggleButton)
        this.container.appendChild(this.elements.panel)
    }
    
    /**
     * Create settings toggle button
     */
    createToggleButton() {
        this.elements.toggleButton = this.createElement('button', {
            className: 'audio-settings-toggle',
            innerHTML: `
                <span class="settings-icon">⚙️</span>
                <span class="settings-text">Audio Settings</span>
            `,
            title: 'Open audio settings panel'
        })
        
        this.elements.toggleButton.addEventListener('click', () => {
            this.toggle()
        })
    }
    
    /**
     * Create main settings panel
     */
    createSettingsPanel() {
        this.elements.panel = this.createElement('div', {
            className: 'audio-settings-panel hidden'
        })
        
        // Panel header
        const header = this.createElement('div', {
            className: 'settings-panel-header',
            innerHTML: `
                <h3>Audio Settings</h3>
                <div class="header-controls">
                    <button class="reset-button" title="Reset to defaults">Reset</button>
                    <button class="close-button" title="Close settings">×</button>
                </div>
            `
        })
        
        // Event listeners for header controls
        header.querySelector('.reset-button').addEventListener('click', () => {
            this.resetSettings()
        })
        
        header.querySelector('.close-button').addEventListener('click', () => {
            this.hide()
        })
        
        this.elements.panel.appendChild(header)
        
        // Panel content container
        const content = this.createElement('div', {
            className: 'settings-panel-content'
        })
        
        this.elements.panel.appendChild(content)
        this.contentContainer = content
    }
    
    /**
     * Create general settings section
     */
    createGeneralSettings() {
        const section = this.createSection('general', 'General Settings')
        
        // Sensitivity slider
        const sensitivityControl = this.createSliderControl(
            'sensitivity',
            'Sensitivity',
            'sensitivity',
            0.1, 3.0, 0.1,
            (value) => `${value.toFixed(1)}x`
        )
        section.appendChild(sensitivityControl)
        
        // Smoothing factor slider
        const smoothingControl = this.createSliderControl(
            'smoothingFactor',
            'Smoothing Factor',
            'smoothingFactor',
            0.0, 1.0, 0.05,
            (value) => `${Math.round(value * 100)}%`
        )
        section.appendChild(smoothingControl)
        
        // Mode selector
        const modeControl = this.createSelectControl(
            'mode',
            'Visualization Mode',
            'mode',
            [
                { value: 'reactive', text: 'Reactive - Full spectrum response' },
                { value: 'pulse', text: 'Pulse - Beat-driven effects' },
                { value: 'flow', text: 'Flow - Directional movement' },
                { value: 'ambient', text: 'Ambient - Subtle influence' }
            ]
        )
        section.appendChild(modeControl)
        
        this.elements.sections.general = section
    }
    
    /**
     * Create frequency range settings section
     */
    createFrequencySettings() {
        const section = this.createSection('frequency', 'Frequency Range Weights')
        
        // Bass weight
        const bassControl = this.createSliderControl(
            'bassWeight',
            'Bass (20-250Hz)',
            'frequencyWeights.bass',
            0.0, 2.0, 0.1,
            (value) => `${value.toFixed(1)}x`
        )
        section.appendChild(bassControl)
        
        // Mids weight
        const midsControl = this.createSliderControl(
            'midsWeight',
            'Mids (250Hz-4kHz)',
            'frequencyWeights.mids',
            0.0, 2.0, 0.1,
            (value) => `${value.toFixed(1)}x`
        )
        section.appendChild(midsControl)
        
        // Treble weight
        const trebleControl = this.createSliderControl(
            'trebleWeight',
            'Treble (4kHz-20kHz)',
            'frequencyWeights.treble',
            0.0, 2.0, 0.1,
            (value) => `${value.toFixed(1)}x`
        )
        section.appendChild(trebleControl)
        
        // Reset frequency weights button
        const resetButton = this.createElement('button', {
            className: 'reset-section-button',
            textContent: 'Reset Frequency Weights',
            onclick: () => this.resetSection('frequencyWeights')
        })
        section.appendChild(resetButton)
        
        this.elements.sections.frequency = section
    }
    
    /**
     * Create beat detection settings section
     */
    createBeatDetectionSettings() {
        const section = this.createSection('beatDetection', 'Beat Detection')
        
        // Beat threshold
        const thresholdControl = this.createSliderControl(
            'beatThreshold',
            'Beat Threshold',
            'beatDetection.threshold',
            1.0, 3.0, 0.1,
            (value) => `${value.toFixed(1)}x`
        )
        section.appendChild(thresholdControl)
        
        // Minimum beat interval
        const intervalControl = this.createSliderControl(
            'beatInterval',
            'Min Beat Interval',
            'beatDetection.minInterval',
            100, 1000, 50,
            (value) => `${value}ms`
        )
        section.appendChild(intervalControl)
        
        // Minimum energy
        const energyControl = this.createSliderControl(
            'beatEnergy',
            'Minimum Energy',
            'beatDetection.minimumEnergy',
            0.05, 0.5, 0.05,
            (value) => `${Math.round(value * 100)}%`
        )
        section.appendChild(energyControl)
        
        this.elements.sections.beatDetection = section
    }
    
    /**
     * Create visual effects settings section
     */
    createEffectSettings() {
        const section = this.createSection('effects', 'Visual Effects')
        
        // Bloom intensity
        const bloomControl = this.createSliderControl(
            'bloomIntensity',
            'Bloom Intensity',
            'effects.bloomIntensity',
            0.5, 3.0, 0.1,
            (value) => `${value.toFixed(1)}x`
        )
        section.appendChild(bloomControl)
        
        // Color shift speed
        const colorControl = this.createSliderControl(
            'colorShiftSpeed',
            'Color Shift Speed',
            'effects.colorShiftSpeed',
            0.01, 0.2, 0.01,
            (value) => `${Math.round(value * 1000)}‰`
        )
        section.appendChild(colorControl)
        
        // Pulse strength
        const pulseControl = this.createSliderControl(
            'pulseStrength',
            'Pulse Strength',
            'effects.pulseStrength',
            0.1, 2.0, 0.1,
            (value) => `${value.toFixed(1)}x`
        )
        section.appendChild(pulseControl)
        
        // Sparkle threshold
        const sparkleControl = this.createSliderControl(
            'sparkleThreshold',
            'Sparkle Threshold',
            'effects.sparkleThreshold',
            0.1, 0.8, 0.05,
            (value) => `${Math.round(value * 100)}%`
        )
        section.appendChild(sparkleControl)
        
        this.elements.sections.effects = section
    }
    
    /**
     * Create mode-specific settings section
     */
    createModeSettings() {
        const section = this.createSection('modeSettings', 'Mode-Specific Settings')
        
        // Mode tabs
        const tabContainer = this.createElement('div', {
            className: 'mode-tabs'
        })
        
        const modes = ['pulse', 'reactive', 'flow', 'ambient']
        modes.forEach(mode => {
            const tab = this.createElement('button', {
                className: `mode-tab ${mode === 'reactive' ? 'active' : ''}`,
                textContent: mode.charAt(0).toUpperCase() + mode.slice(1),
                onclick: () => this.switchModeTab(mode)
            })
            tabContainer.appendChild(tab)
        })
        
        section.appendChild(tabContainer)
        
        // Mode content containers
        const contentContainer = this.createElement('div', {
            className: 'mode-content'
        })
        
        modes.forEach(mode => {
            const modeContent = this.createModeContent(mode)
            modeContent.style.display = mode === 'reactive' ? 'block' : 'none'
            contentContainer.appendChild(modeContent)
        })
        
        section.appendChild(contentContainer)
        this.elements.sections.modeSettings = section
    }
    
    /**
     * Create content for a specific mode
     * @param {string} mode - Mode name
     * @returns {HTMLElement} Mode content element
     */
    createModeContent(mode) {
        const content = this.createElement('div', {
            className: `mode-content-${mode}`,
            'data-mode': mode
        })
        
        switch (mode) {
            case 'pulse':
                content.appendChild(this.createSliderControl(
                    'pulseBeatRadius',
                    'Beat Radius',
                    `modeSettings.pulse.beatRadius`,
                    50, 300, 10,
                    (value) => `${value}px`
                ))
                content.appendChild(this.createSliderControl(
                    'pulseBeatStrength',
                    'Beat Strength',
                    `modeSettings.pulse.beatStrength`,
                    0.5, 4.0, 0.1,
                    (value) => `${value.toFixed(1)}x`
                ))
                break
                
            case 'reactive':
                content.appendChild(this.createSliderControl(
                    'reactiveGravity',
                    'Gravity Multiplier',
                    `modeSettings.reactive.gravityMultiplier`,
                    0.5, 4.0, 0.1,
                    (value) => `${value.toFixed(1)}x`
                ))
                content.appendChild(this.createSliderControl(
                    'reactiveSwirlRadius',
                    'Swirl Radius',
                    `modeSettings.reactive.swirlRadius`,
                    40, 150, 5,
                    (value) => `${value}px`
                ))
                break
                
            case 'flow':
                content.appendChild(this.createSliderControl(
                    'flowSpeed',
                    'Flow Speed',
                    `modeSettings.flow.flowSpeed`,
                    0.2, 3.0, 0.1,
                    (value) => `${value.toFixed(1)}x`
                ))
                content.appendChild(this.createSliderControl(
                    'flowSmoothing',
                    'Direction Smoothing',
                    `modeSettings.flow.directionSmoothing`,
                    0.1, 1.0, 0.05,
                    (value) => `${Math.round(value * 100)}%`
                ))
                break
                
            case 'ambient':
                content.appendChild(this.createSliderControl(
                    'ambientDrift',
                    'Drift Strength',
                    `modeSettings.ambient.driftStrength`,
                    0.05, 0.8, 0.05,
                    (value) => `${value.toFixed(2)}x`
                ))
                content.appendChild(this.createSliderControl(
                    'ambientBloom',
                    'Bloom Variation',
                    `modeSettings.ambient.bloomVariation`,
                    0.1, 1.0, 0.05,
                    (value) => `${Math.round(value * 100)}%`
                ))
                break
        }
        
        return content
    }
    
    /**
     * Create advanced settings section
     */
    createAdvancedSettings() {
        const section = this.createSection('advanced', 'Advanced Settings', true)
        
        // Performance settings
        const performanceGroup = this.createElement('div', {
            className: 'settings-group',
            innerHTML: '<h4>Performance</h4>'
        })
        
        // FFT Size selector
        const fftControl = this.createSelectControl(
            'fftSize',
            'FFT Size',
            'performance.fftSize',
            [
                { value: 512, text: '512 (Low quality, high performance)' },
                { value: 1024, text: '1024 (Medium quality)' },
                { value: 2048, text: '2048 (High quality)' },
                { value: 4096, text: '4096 (Very high quality, low performance)' }
            ]
        )
        performanceGroup.appendChild(fftControl)
        
        // Update rate
        const updateRateControl = this.createSliderControl(
            'updateRate',
            'Update Rate',
            'performance.updateRate',
            30, 120, 10,
            (value) => `${value} FPS`
        )
        performanceGroup.appendChild(updateRateControl)
        
        // Adaptive quality checkbox
        const adaptiveControl = this.createCheckboxControl(
            'adaptiveQuality',
            'Adaptive Quality',
            'performance.adaptiveQuality',
            'Automatically reduce quality when performance drops'
        )
        performanceGroup.appendChild(adaptiveControl)
        
        section.appendChild(performanceGroup)
        
        // UI preferences
        const uiGroup = this.createElement('div', {
            className: 'settings-group',
            innerHTML: '<h4>UI Preferences</h4>'
        })
        
        uiGroup.appendChild(this.createCheckboxControl(
            'panelAutoHide',
            'Auto-hide Panel',
            'ui.panelAutoHide',
            'Automatically hide audio panel when inactive'
        ))
        
        uiGroup.appendChild(this.createCheckboxControl(
            'spectrumDisplay',
            'Show Spectrum',
            'ui.spectrumDisplay',
            'Display frequency spectrum visualization'
        ))
        
        uiGroup.appendChild(this.createCheckboxControl(
            'beatIndicator',
            'Show Beat Indicator',
            'ui.beatIndicator',
            'Display beat detection indicator'
        ))
        
        section.appendChild(uiGroup)
        
        this.elements.sections.advanced = section
    }
    
    /**
     * Create import/export section
     */
    createImportExportSection() {
        const section = this.createSection('importExport', 'Import/Export Settings')
        
        // Export button
        const exportButton = this.createElement('button', {
            className: 'export-button',
            textContent: 'Export Settings',
            onclick: () => this.exportSettings()
        })
        section.appendChild(exportButton)
        
        // Import section
        const importContainer = this.createElement('div', {
            className: 'import-container'
        })
        
        const importTextarea = this.createElement('textarea', {
            className: 'import-textarea',
            placeholder: 'Paste settings JSON here...',
            rows: 4
        })
        
        const importButton = this.createElement('button', {
            className: 'import-button',
            textContent: 'Import Settings',
            onclick: () => this.importSettings(importTextarea.value)
        })
        
        importContainer.appendChild(importTextarea)
        importContainer.appendChild(importButton)
        section.appendChild(importContainer)
        
        this.elements.sections.importExport = section
    }
    
    /**
     * Create a settings section
     * @param {string} id - Section ID
     * @param {string} title - Section title
     * @param {boolean} collapsible - Whether section is collapsible
     * @returns {HTMLElement} Section element
     */
    createSection(id, title, collapsible = false) {
        const section = this.createElement('div', {
            className: `settings-section ${collapsible ? 'collapsible' : ''}`
        })
        
        const header = this.createElement('div', {
            className: 'section-header',
            innerHTML: `
                <h3>${title}</h3>
                ${collapsible ? '<span class="collapse-icon">▼</span>' : ''}
            `
        })
        
        if (collapsible) {
            header.addEventListener('click', () => {
                section.classList.toggle('collapsed')
            })
        }
        
        section.appendChild(header)
        
        const content = this.createElement('div', {
            className: 'section-content'
        })
        section.appendChild(content)
        
        this.contentContainer.appendChild(section)
        
        return content
    }
    
    /**
     * Create a slider control
     * @param {string} id - Control ID
     * @param {string} label - Control label
     * @param {string} settingPath - Settings path
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @param {number} step - Step size
     * @param {Function} formatter - Value formatter function
     * @returns {HTMLElement} Control element
     */
    createSliderControl(id, label, settingPath, min, max, step, formatter) {
        const container = this.createElement('div', {
            className: 'control-container slider-control'
        })
        
        const labelElement = this.createElement('label', {
            className: 'control-label',
            innerHTML: `${label} <span class="control-value"></span>`
        })
        
        const slider = this.createElement('input', {
            type: 'range',
            className: 'control-slider',
            id: id,
            min: min.toString(),
            max: max.toString(),
            step: step.toString(),
            value: this.audioSettings.get(settingPath, min).toString()
        })
        
        const valueSpan = labelElement.querySelector('.control-value')
        
        // Update display
        const updateDisplay = (value) => {
            valueSpan.textContent = formatter ? formatter(value) : value.toString()
        }
        
        // Initial display
        updateDisplay(parseFloat(slider.value))
        
        // Handle input with preview
        slider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value)
            updateDisplay(value)
            this.schedulePreview(settingPath, value)
        })
        
        // Handle final change
        slider.addEventListener('change', (e) => {
            const value = parseFloat(e.target.value)
            this.audioSettings.set(settingPath, value)
        })
        
        container.appendChild(labelElement)
        container.appendChild(slider)
        
        // Store reference for updates
        this.elements.controls[id] = {
            slider,
            valueSpan,
            formatter,
            settingPath
        }
        
        return container
    }
    
    /**
     * Create a select control
     * @param {string} id - Control ID
     * @param {string} label - Control label
     * @param {string} settingPath - Settings path
     * @param {Array} options - Select options
     * @returns {HTMLElement} Control element
     */
    createSelectControl(id, label, settingPath, options) {
        const container = this.createElement('div', {
            className: 'control-container select-control'
        })
        
        const labelElement = this.createElement('label', {
            className: 'control-label',
            textContent: label
        })
        
        const select = this.createElement('select', {
            className: 'control-select',
            id: id
        })
        
        // Add options
        options.forEach(option => {
            const optionElement = this.createElement('option', {
                value: option.value.toString(),
                textContent: option.text
            })
            select.appendChild(optionElement)
        })
        
        // Set current value
        select.value = this.audioSettings.get(settingPath, options[0].value).toString()
        
        // Handle change
        select.addEventListener('change', (e) => {
            let value = e.target.value
            
            // Convert to appropriate type
            if (!isNaN(value)) {
                value = parseFloat(value)
            }
            
            this.audioSettings.set(settingPath, value)
        })
        
        container.appendChild(labelElement)
        container.appendChild(select)
        
        // Store reference
        this.elements.controls[id] = {
            select,
            settingPath
        }
        
        return container
    }
    
    /**
     * Create a checkbox control
     * @param {string} id - Control ID
     * @param {string} label - Control label
     * @param {string} settingPath - Settings path
     * @param {string} description - Control description
     * @returns {HTMLElement} Control element
     */
    createCheckboxControl(id, label, settingPath, description) {
        const container = this.createElement('div', {
            className: 'control-container checkbox-control'
        })
        
        const checkbox = this.createElement('input', {
            type: 'checkbox',
            className: 'control-checkbox',
            id: id,
            checked: this.audioSettings.get(settingPath, false)
        })
        
        const labelElement = this.createElement('label', {
            className: 'control-label',
            htmlFor: id,
            innerHTML: `${label} ${description ? `<span class="control-description">${description}</span>` : ''}`
        })
        
        // Handle change
        checkbox.addEventListener('change', (e) => {
            this.audioSettings.set(settingPath, e.target.checked)
        })
        
        container.appendChild(checkbox)
        container.appendChild(labelElement)
        
        // Store reference
        this.elements.controls[id] = {
            checkbox,
            settingPath
        }
        
        return container
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isVisible && 
                !this.elements.panel.contains(e.target) && 
                !this.elements.toggleButton.contains(e.target)) {
                this.hide()
            }
        })
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide()
            }
        })
    }
    
    /**
     * Bind to settings changes
     */
    bindSettings() {
        this.settingsUnsubscribe = this.audioSettings.addListener('setting-changed', (data) => {
            this.updateControlFromSettings(data.path, data.newValue)
        })
    }
    
    /**
     * Update a control based on settings change
     * @param {string} path - Settings path
     * @param {*} value - New value
     */
    updateControlFromSettings(path, value) {
        // Find control by settings path
        for (const [id, control] of Object.entries(this.elements.controls)) {
            if (control.settingPath === path) {
                if (control.slider) {
                    control.slider.value = value.toString()
                    if (control.valueSpan && control.formatter) {
                        control.valueSpan.textContent = control.formatter(value)
                    }
                } else if (control.select) {
                    control.select.value = value.toString()
                } else if (control.checkbox) {
                    control.checkbox.checked = value
                }
                break
            }
        }
    }
    
    /**
     * Schedule a preview update
     * @param {string} path - Settings path
     * @param {*} value - Preview value
     */
    schedulePreview(path, value) {
        // Clear existing timeout
        if (this.previewTimeout) {
            clearTimeout(this.previewTimeout)
        }
        
        // Schedule preview
        this.previewTimeout = setTimeout(() => {
            this.triggerPreview(path, value)
        }, this.config.previewDelay)
    }
    
    /**
     * Trigger preview callback
     * @param {string} path - Settings path
     * @param {*} value - Preview value
     */
    triggerPreview(path, value) {
        const callback = this.previewCallbacks.get(path)
        if (callback) {
            callback(value)
        }
    }
    
    /**
     * Add preview callback for a setting
     * @param {string} path - Settings path
     * @param {Function} callback - Preview callback
     */
    addPreviewCallback(path, callback) {
        this.previewCallbacks.set(path, callback)
    }
    
    /**
     * Switch mode tab
     * @param {string} mode - Mode to switch to
     */
    switchModeTab(mode) {
        // Update tab buttons
        const tabs = this.elements.panel.querySelectorAll('.mode-tab')
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.textContent.toLowerCase() === mode)
        })
        
        // Update content visibility
        const contents = this.elements.panel.querySelectorAll('[data-mode]')
        contents.forEach(content => {
            content.style.display = content.dataset.mode === mode ? 'block' : 'none'
        })
    }
    
    /**
     * Show settings panel
     */
    show() {
        if (this.isVisible) return
        
        this.isVisible = true
        this.elements.panel.classList.remove('hidden')
        
        // Animate appearance
        requestAnimationFrame(() => {
            this.elements.panel.classList.add('visible')
        })
        
        // Update button state
        this.elements.toggleButton.classList.add('active')
    }
    
    /**
     * Hide settings panel
     */
    hide() {
        if (!this.isVisible) return
        
        this.isVisible = false
        this.elements.panel.classList.remove('visible')
        
        // Hide after animation
        setTimeout(() => {
            if (!this.isVisible) {
                this.elements.panel.classList.add('hidden')
            }
        }, this.config.animationDuration)
        
        // Update button state
        this.elements.toggleButton.classList.remove('active')
    }
    
    /**
     * Toggle settings panel visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide()
        } else {
            this.show()
        }
    }
    
    /**
     * Reset all settings to defaults
     */
    resetSettings() {
        if (confirm('Reset all audio settings to defaults? This cannot be undone.')) {
            this.audioSettings.reset()
            this.updateAllControls()
        }
    }
    
    /**
     * Reset a specific settings section
     * @param {string} section - Section to reset
     */
    resetSection(section) {
        if (confirm(`Reset ${section} settings to defaults?`)) {
            this.audioSettings.reset(section)
        }
    }
    
    /**
     * Export settings to clipboard
     */
    exportSettings() {
        const settings = this.audioSettings.export()
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(settings).then(() => {
                this.showNotification('Settings exported to clipboard!')
            }).catch(() => {
                this.showExportDialog(settings)
            })
        } else {
            this.showExportDialog(settings)
        }
    }
    
    /**
     * Show export dialog
     * @param {string} settings - Settings JSON
     */
    showExportDialog(settings) {
        const dialog = this.createElement('div', {
            className: 'export-dialog',
            innerHTML: `
                <div class="dialog-content">
                    <h4>Export Settings</h4>
                    <textarea readonly>${settings}</textarea>
                    <div class="dialog-buttons">
                        <button class="copy-button">Copy</button>
                        <button class="close-button">Close</button>
                    </div>
                </div>
            `
        })
        
        const textarea = dialog.querySelector('textarea')
        const copyButton = dialog.querySelector('.copy-button')
        const closeButton = dialog.querySelector('.close-button')
        
        copyButton.addEventListener('click', () => {
            textarea.select()
            document.execCommand('copy')
            this.showNotification('Settings copied!')
        })
        
        closeButton.addEventListener('click', () => {
            document.body.removeChild(dialog)
        })
        
        document.body.appendChild(dialog)
        textarea.select()
    }
    
    /**
     * Import settings from JSON
     * @param {string} jsonString - Settings JSON string
     */
    importSettings(jsonString) {
        if (!jsonString.trim()) {
            this.showNotification('Please paste settings JSON first', 'error')
            return
        }
        
        if (this.audioSettings.import(jsonString)) {
            this.updateAllControls()
            this.showNotification('Settings imported successfully!')
        } else {
            this.showNotification('Failed to import settings. Invalid format.', 'error')
        }
    }
    
    /**
     * Update all controls from current settings
     */
    updateAllControls() {
        for (const [id, control] of Object.entries(this.elements.controls)) {
            const value = this.audioSettings.get(control.settingPath)
            this.updateControlFromSettings(control.settingPath, value)
        }
    }
    
    /**
     * Show notification message
     * @param {string} message - Notification message
     * @param {string} type - Notification type ('success', 'error')
     */
    showNotification(message, type = 'success') {
        const notification = this.createElement('div', {
            className: `settings-notification ${type}`,
            textContent: message
        })
        
        this.elements.panel.appendChild(notification)
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification)
            }
        }, 3000)
    }
    
    /**
     * Helper method to create DOM elements
     * @param {string} tag - HTML tag name
     * @param {Object} props - Element properties
     * @returns {HTMLElement} Created element
     */
    createElement(tag, props) {
        const element = document.createElement(tag)
        Object.assign(element, props)
        return element
    }
    
    /**
     * Get current UI state
     * @returns {Object} Current state
     */
    getState() {
        return {
            isVisible: this.isVisible,
            previewCallbacks: this.previewCallbacks.size
        }
    }
    
    /**
     * Dispose of the settings UI
     */
    dispose() {
        // Clear preview timeout
        if (this.previewTimeout) {
            clearTimeout(this.previewTimeout)
        }
        
        // Unsubscribe from settings changes
        if (this.settingsUnsubscribe) {
            this.settingsUnsubscribe()
        }
        
        // Remove elements from DOM
        if (this.elements.toggleButton && this.elements.toggleButton.parentNode) {
            this.elements.toggleButton.parentNode.removeChild(this.elements.toggleButton)
        }
        
        if (this.elements.panel && this.elements.panel.parentNode) {
            this.elements.panel.parentNode.removeChild(this.elements.panel)
        }
        
        // Clear references
        this.elements = {}
        this.previewCallbacks.clear()
    }
}