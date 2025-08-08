/**
 * Frequency Analysis Example
 * Demonstrates the advanced frequency analysis and binning system
 */

import { AudioAnalyzer } from '../core/audio-analyzer.js'

/**
 * Example demonstrating frequency analysis features
 */
export class FrequencyAnalysisExample {
    constructor() {
        this.audioAnalyzer = null
        this.isRunning = false
        this.analysisInterval = null
        
        // Create UI elements
        this.createUI()
    }
    
    /**
     * Create example UI
     */
    createUI() {
        // Create container
        this.container = document.createElement('div')
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 400px;
            background: rgba(0, 0, 0, 0.8);
            color: #00FFFF;
            padding: 20px;
            border-radius: 10px;
            font-family: monospace;
            font-size: 12px;
            z-index: 1000;
        `
        
        // Title
        const title = document.createElement('h3')
        title.textContent = 'Frequency Analysis System'
        title.style.margin = '0 0 15px 0'
        this.container.appendChild(title)
        
        // Start/Stop button
        this.toggleButton = document.createElement('button')
        this.toggleButton.textContent = 'Start Analysis'
        this.toggleButton.style.cssText = `
            background: #00FFFF;
            color: black;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-bottom: 15px;
        `
        this.toggleButton.onclick = () => this.toggleAnalysis()
        this.container.appendChild(this.toggleButton)
        
        // Configuration controls
        this.createConfigControls()
        
        // Analysis display
        this.createAnalysisDisplay()
        
        // Spectrum canvas
        this.createSpectrumCanvas()
        
        document.body.appendChild(this.container)
    }
    
    /**
     * Create configuration controls
     */
    createConfigControls() {
        const configSection = document.createElement('div')
        configSection.style.marginBottom = '15px'
        
        const configTitle = document.createElement('div')
        configTitle.textContent = 'Configuration:'
        configTitle.style.fontWeight = 'bold'
        configSection.appendChild(configTitle)
        
        // Smoothing control
        const smoothingControl = this.createSliderControl(
            'Smoothing', 0.1, 0.9, 0.7, 0.1,
            (value) => this.updateConfig({ smoothingFactor: value })
        )
        configSection.appendChild(smoothingControl)
        
        // Normalization method
        const normalizationControl = this.createSelectControl(
            'Normalization',
            ['peak', 'rms', 'adaptive'],
            'peak',
            (value) => this.updateConfig({ normalizationMethod: value })
        )
        configSection.appendChild(normalizationControl)
        
        // Spectrum resolution
        const resolutionControl = this.createSliderControl(
            'Spectrum Resolution', 64, 512, 256, 64,
            (value) => this.updateConfig({ spectrumResolution: value })
        )
        configSection.appendChild(resolutionControl)
        
        // Bass weight
        const bassWeightControl = this.createSliderControl(
            'Bass Weight', 0.1, 3.0, 1.0, 0.1,
            (value) => this.updateFrequencyRanges({ bass: { min: 20, max: 250, weight: value } })
        )
        configSection.appendChild(bassWeightControl)
        
        this.container.appendChild(configSection)
    }
    
    /**
     * Create analysis display
     */
    createAnalysisDisplay() {
        this.analysisDisplay = document.createElement('div')
        this.analysisDisplay.style.cssText = `
            background: rgba(0, 255, 255, 0.1);
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
            font-size: 11px;
            line-height: 1.4;
        `
        this.container.appendChild(this.analysisDisplay)
    }
    
    /**
     * Create spectrum visualization canvas
     */
    createSpectrumCanvas() {
        this.spectrumCanvas = document.createElement('canvas')
        this.spectrumCanvas.width = 360
        this.spectrumCanvas.height = 100
        this.spectrumCanvas.style.cssText = `
            width: 100%;
            height: 100px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 5px;
        `
        this.container.appendChild(this.spectrumCanvas)
        this.spectrumCtx = this.spectrumCanvas.getContext('2d')
    }
    
    /**
     * Create slider control
     */
    createSliderControl(label, min, max, value, step, onChange) {
        const control = document.createElement('div')
        control.style.margin = '5px 0'
        
        const labelEl = document.createElement('label')
        labelEl.textContent = `${label}: `
        labelEl.style.display = 'inline-block'
        labelEl.style.width = '120px'
        
        const slider = document.createElement('input')
        slider.type = 'range'
        slider.min = min
        slider.max = max
        slider.value = value
        slider.step = step
        slider.style.width = '100px'
        
        const valueDisplay = document.createElement('span')
        valueDisplay.textContent = value
        valueDisplay.style.marginLeft = '10px'
        valueDisplay.style.minWidth = '40px'
        valueDisplay.style.display = 'inline-block'
        
        slider.oninput = (e) => {
            const newValue = parseFloat(e.target.value)
            valueDisplay.textContent = newValue.toFixed(1)
            onChange(newValue)
        }
        
        control.appendChild(labelEl)
        control.appendChild(slider)
        control.appendChild(valueDisplay)
        
        return control
    }
    
    /**
     * Create select control
     */
    createSelectControl(label, options, value, onChange) {
        const control = document.createElement('div')
        control.style.margin = '5px 0'
        
        const labelEl = document.createElement('label')
        labelEl.textContent = `${label}: `
        labelEl.style.display = 'inline-block'
        labelEl.style.width = '120px'
        
        const select = document.createElement('select')
        select.style.background = '#333'
        select.style.color = '#00FFFF'
        select.style.border = '1px solid #00FFFF'
        
        options.forEach(option => {
            const optionEl = document.createElement('option')
            optionEl.value = option
            optionEl.textContent = option
            optionEl.selected = option === value
            select.appendChild(optionEl)
        })
        
        select.onchange = (e) => onChange(e.target.value)
        
        control.appendChild(labelEl)
        control.appendChild(select)
        
        return control
    }
    
    /**
     * Toggle frequency analysis
     */
    async toggleAnalysis() {
        if (!this.isRunning) {
            await this.startAnalysis()
        } else {
            this.stopAnalysis()
        }
    }
    
    /**
     * Start frequency analysis
     */
    async startAnalysis() {
        try {
            // Create audio analyzer with advanced configuration
            this.audioAnalyzer = new AudioAnalyzer({
                fftSize: 2048,
                smoothingTimeConstant: 0.8,
                frequencyRanges: {
                    bass: { min: 20, max: 250, weight: 1.0 },
                    mids: { min: 250, max: 4000, weight: 1.0 },
                    treble: { min: 4000, max: 20000, weight: 1.0 }
                },
                smoothingEnabled: true,
                smoothingFactor: 0.7,
                normalizationEnabled: true,
                normalizationMethod: 'peak',
                spectrumResolution: 256,
                logScale: true
            })
            
            // Initialize with microphone
            const result = await this.audioAnalyzer.initialize('microphone')
            
            if (!result.success) {
                throw new Error(result.message)
            }
            
            // Start analysis loop
            this.isRunning = true
            this.toggleButton.textContent = 'Stop Analysis'
            this.analysisInterval = setInterval(() => this.updateAnalysis(), 50) // 20 FPS
            
        } catch (error) {
            alert(`Failed to start analysis: ${error.message}`)
        }
    }
    
    /**
     * Stop frequency analysis
     */
    stopAnalysis() {
        this.isRunning = false
        this.toggleButton.textContent = 'Start Analysis'
        
        if (this.analysisInterval) {
            clearInterval(this.analysisInterval)
            this.analysisInterval = null
        }
        
        if (this.audioAnalyzer) {
            this.audioAnalyzer.dispose()
            this.audioAnalyzer = null
        }
    }
    
    /**
     * Update analysis display
     */
    updateAnalysis() {
        if (!this.audioAnalyzer || !this.isRunning) return
        
        const data = this.audioAnalyzer.getFrequencyData()
        const advanced = data.advanced
        
        if (!advanced) return
        
        // Update text display
        this.updateTextDisplay(data, advanced)
        
        // Update spectrum visualization
        this.updateSpectrumVisualization(advanced)
    }
    
    /**
     * Update text display
     */
    updateTextDisplay(data, advanced) {
        const html = `
            <div><strong>Basic Values:</strong></div>
            <div>Bass: ${data.bass.toFixed(3)} | Mids: ${data.mids.toFixed(3)} | Treble: ${data.treble.toFixed(3)}</div>
            <div>Overall: ${data.overall.toFixed(3)}</div>
            
            <div style="margin-top: 10px;"><strong>Advanced Analysis:</strong></div>
            <div>Dominant Range: ${advanced.metrics.dominantRange}</div>
            <div>Spectral Centroid: ${advanced.metrics.spectralCentroid.toFixed(0)} Hz</div>
            <div>Dynamic Range: ${advanced.metrics.dynamicRange.toFixed(3)}</div>
            
            <div style="margin-top: 10px;"><strong>Distribution:</strong></div>
            <div>Bass: ${(advanced.metrics.distribution.bass * 100).toFixed(1)}%</div>
            <div>Mids: ${(advanced.metrics.distribution.mids * 100).toFixed(1)}%</div>
            <div>Treble: ${(advanced.metrics.distribution.treble * 100).toFixed(1)}%</div>
            
            <div style="margin-top: 10px;"><strong>Performance:</strong></div>
            <div>Analysis Time: ${advanced.analysisTime.toFixed(2)}ms</div>
            <div>Config: ${advanced.config.resolution} bins, ${advanced.config.normalization ? 'normalized' : 'raw'}</div>
        `
        
        this.analysisDisplay.innerHTML = html
    }
    
    /**
     * Update spectrum visualization
     */
    updateSpectrumVisualization(advanced) {
        const ctx = this.spectrumCtx
        const canvas = this.spectrumCanvas
        const width = canvas.width
        const height = canvas.height
        
        // Clear canvas
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
        ctx.fillRect(0, 0, width, height)
        
        // Draw spectrum
        const spectrum = advanced.spectrum
        const barWidth = width / spectrum.length
        
        ctx.fillStyle = '#00FFFF'
        
        for (let i = 0; i < spectrum.length; i++) {
            const barHeight = spectrum[i] * height
            const x = i * barWidth
            const y = height - barHeight
            
            ctx.fillRect(x, y, barWidth - 1, barHeight)
        }
        
        // Draw frequency range indicators
        this.drawFrequencyRangeIndicators(ctx, width, height, advanced.spectrumFrequencies)
    }
    
    /**
     * Draw frequency range indicators
     */
    drawFrequencyRangeIndicators(ctx, width, height, frequencies) {
        const bassMax = 250
        const midsMax = 4000
        
        // Find indices for frequency boundaries
        let bassEndIndex = frequencies.findIndex(f => f > bassMax)
        let midsEndIndex = frequencies.findIndex(f => f > midsMax)
        
        if (bassEndIndex === -1) bassEndIndex = frequencies.length
        if (midsEndIndex === -1) midsEndIndex = frequencies.length
        
        const bassEndX = (bassEndIndex / frequencies.length) * width
        const midsEndX = (midsEndIndex / frequencies.length) * width
        
        // Draw range separators
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.lineWidth = 1
        
        ctx.beginPath()
        ctx.moveTo(bassEndX, 0)
        ctx.lineTo(bassEndX, height)
        ctx.stroke()
        
        ctx.beginPath()
        ctx.moveTo(midsEndX, 0)
        ctx.lineTo(midsEndX, height)
        ctx.stroke()
        
        // Draw labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.font = '10px monospace'
        ctx.fillText('Bass', 5, 15)
        ctx.fillText('Mids', bassEndX + 5, 15)
        ctx.fillText('Treble', midsEndX + 5, 15)
    }
    
    /**
     * Update configuration
     */
    updateConfig(config) {
        if (this.audioAnalyzer) {
            this.audioAnalyzer.updateFrequencyConfig(config)
        }
    }
    
    /**
     * Update frequency ranges
     */
    updateFrequencyRanges(ranges) {
        if (this.audioAnalyzer) {
            this.audioAnalyzer.updateFrequencyRanges(ranges)
        }
    }
    
    /**
     * Cleanup
     */
    dispose() {
        this.stopAnalysis()
        
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container)
        }
    }
}

// Auto-start example when loaded
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        // Only create example if not in test environment
        if (!window.location.search.includes('test')) {
            window.frequencyAnalysisExample = new FrequencyAnalysisExample()
        }
    })
}