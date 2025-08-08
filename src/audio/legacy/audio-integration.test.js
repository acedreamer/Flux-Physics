/**
 * Integration tests for audio reactive mode with FLUX application
 * Tests the integration between audio components and the main physics simulation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock PIXI.js and Web Audio API for testing
vi.mock('pixi.js', () => ({
    Application: vi.fn(() => ({
        init: vi.fn(),
        ticker: {
            add: vi.fn(),
            maxFPS: 60
        },
        stage: {
            addChild: vi.fn()
        },
        renderer: {
            resize: vi.fn()
        },
        screen: {
            width: 800,
            height: 600
        }
    })),
    Container: vi.fn(() => ({
        addChild: vi.fn(),
        removeChild: vi.fn(),
        filters: []
    })),
    Graphics: vi.fn(() => ({
        circle: vi.fn(),
        fill: vi.fn(),
        clear: vi.fn(),
        destroy: vi.fn(),
        x: 0,
        y: 0,
        visible: true,
        scale: { set: vi.fn(), x: 1 }
    })),
    BlurFilter: vi.fn()
}))

vi.mock('@pixi/filter-advanced-bloom', () => ({
    AdvancedBloomFilter: vi.fn(() => ({
        threshold: 0.1,
        bloomScale: 1.0,
        brightness: 1.0,
        blur: 8,
        quality: 6
    }))
}))

// Mock Web Audio API
const mockAudioContext = {
    createAnalyser: vi.fn(() => ({
        fftSize: 2048,
        smoothingTimeConstant: 0.8,
        getByteFrequencyData: vi.fn(),
        connect: vi.fn()
    })),
    createMediaStreamSource: vi.fn(() => ({
        connect: vi.fn()
    }))
}

global.AudioContext = vi.fn(() => mockAudioContext)
global.webkitAudioContext = vi.fn(() => mockAudioContext)

// Mock getUserMedia
global.navigator = {
    mediaDevices: {
        getUserMedia: vi.fn(() => Promise.resolve({
            getTracks: () => [{ stop: vi.fn() }]
        }))
    }
}

// Mock localStorage
global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
}

// Mock performance.now
global.performance = {
    now: vi.fn(() => Date.now())
}

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 16))

// Mock WASM module
const mockSolver = {
    update: vi.fn(),
    get_positions: vi.fn(() => new Float32Array([100, 100, 200, 200])),
    get_active_particle_count: vi.fn(() => 2),
    apply_force: vi.fn(),
    set_particle_count: vi.fn()
}

vi.mock('../../engine/pkg/engine.js', () => ({
    default: vi.fn(() => Promise.resolve()),
    Solver: vi.fn(() => mockSolver)
}))

describe('Audio Reactive Mode Integration', () => {
    let FluxApplication
    let app
    
    beforeEach(async () => {
        // Clear all mocks
        vi.clearAllMocks()
        
        // Mock DOM elements
        document.body.innerHTML = '<canvas id="canvas"></canvas>'
        
        // Import FluxApplication after mocks are set up
        const mainModule = await import('../main.js')
        FluxApplication = mainModule.FluxApplication
        
        // Create app instance
        app = new FluxApplication()
        
        // Mock canvas element
        const canvas = document.getElementById('canvas')
        canvas.getBoundingClientRect = vi.fn(() => ({
            left: 0,
            top: 0,
            width: 800,
            height: 600
        }))
        
        // Mock window dimensions
        Object.defineProperty(window, 'innerWidth', { value: 800, writable: true })
        Object.defineProperty(window, 'innerHeight', { value: 600, writable: true })
    })
    
    afterEach(() => {
        if (app && app.cleanupAudioMode) {
            app.cleanupAudioMode()
        }
        document.body.innerHTML = ''
    })
    
    it('should initialize FluxApplication with audio reactive properties', () => {
        expect(app.audioAnalyzer).toBeNull()
        expect(app.audioEffects).toBeNull()
        expect(app.audioUI).toBeNull()
        expect(app.audioReactiveEnabled).toBe(false)
        expect(app.audioInitialized).toBe(false)
        expect(app.audioState).toBeDefined()
        expect(app.audioState.isEnabled).toBe(false)
        expect(app.audioState.currentMode).toBe('reactive')
        expect(app.audioState.sensitivity).toBe(1.0)
    })
    
    it('should setup audio reactive mode during initialization', async () => {
        // Initialize the application
        await app.init()
        
        // Verify audio components are set up
        expect(app.audioEffects).toBeDefined()
        expect(app.audioUI).toBeDefined()
        
        // Verify UI container is created
        const uiContainer = document.getElementById('ui-container')
        expect(uiContainer).toBeTruthy()
    })
    
    it('should toggle audio mode on and off', async () => {
        await app.init()
        
        // Enable audio mode
        await app.toggleAudioMode(true)
        
        expect(app.audioReactiveEnabled).toBe(true)
        expect(app.audioState.isEnabled).toBe(true)
        expect(app.audioAnalyzer).toBeDefined()
        
        // Disable audio mode
        await app.toggleAudioMode(false)
        
        expect(app.audioReactiveEnabled).toBe(false)
        expect(app.audioState.isEnabled).toBe(false)
    })
    
    it('should handle audio mode initialization errors gracefully', async () => {
        await app.init()
        
        // Mock getUserMedia to fail
        navigator.mediaDevices.getUserMedia.mockRejectedValueOnce(
            new Error('Permission denied')
        )
        
        // Attempt to enable audio mode
        await app.toggleAudioMode(true)
        
        // Should remain disabled after error
        expect(app.audioReactiveEnabled).toBe(false)
        expect(app.audioState.isEnabled).toBe(false)
    })
    
    it('should set audio visualization mode', async () => {
        await app.init()
        await app.toggleAudioMode(true)
        
        // Test different modes
        const modes = ['pulse', 'reactive', 'flow', 'ambient']
        
        for (const mode of modes) {
            app.setAudioMode(mode)
            expect(app.audioState.currentMode).toBe(mode)
        }
        
        // Test invalid mode
        app.setAudioMode('invalid')
        expect(app.audioState.currentMode).toBe('ambient') // Should remain unchanged
    })
    
    it('should set audio sensitivity within valid range', async () => {
        await app.init()
        await app.toggleAudioMode(true)
        
        // Test valid sensitivity values
        app.setAudioSensitivity(0.5)
        expect(app.audioState.sensitivity).toBe(0.5)
        
        app.setAudioSensitivity(2.0)
        expect(app.audioState.sensitivity).toBe(2.0)
        
        // Test clamping
        app.setAudioSensitivity(0.05) // Below minimum
        expect(app.audioState.sensitivity).toBe(0.1)
        
        app.setAudioSensitivity(3.0) // Above maximum
        expect(app.audioState.sensitivity).toBe(2.0)
    })
    
    it('should save and load audio settings', async () => {
        await app.init()
        
        // Set some settings
        app.audioState.currentMode = 'pulse'
        app.audioState.sensitivity = 1.5
        app.audioState.isEnabled = true
        
        // Save settings
        app.saveAudioSettings()
        
        // Verify localStorage was called
        expect(localStorage.setItem).toHaveBeenCalledWith(
            'flux-audio-settings',
            expect.stringContaining('"mode":"pulse"')
        )
        
        // Mock loaded settings
        localStorage.getItem.mockReturnValueOnce(JSON.stringify({
            enabled: true,
            mode: 'flow',
            sensitivity: 0.8
        }))
        
        // Load settings
        app.loadAudioSettings()
        
        expect(app.audioState.currentMode).toBe('flow')
        expect(app.audioState.sensitivity).toBe(0.8)
    })
    
    it('should process audio reactive effects in render loop', async () => {
        await app.init()
        await app.toggleAudioMode(true)
        
        // Mock audio analyzer to return data
        const mockAudioData = {
            bass: 0.5,
            mids: 0.3,
            treble: 0.7,
            overall: 0.5,
            spectrum: new Array(256).fill(128)
        }
        
        const mockBeatData = {
            isBeat: true,
            strength: 0.8,
            energy: 0.6,
            bpm: 120
        }
        
        if (app.audioAnalyzer) {
            app.audioAnalyzer.getFrequencyData = vi.fn(() => mockAudioData)
            app.audioAnalyzer.getBeatData = vi.fn(() => mockBeatData)
        }
        
        // Process audio effects
        app.processAudioReactiveEffects()
        
        // Verify audio data was stored
        expect(app.audioState.lastAudioData).toEqual(mockAudioData)
        expect(app.audioState.lastBeatData).toEqual(mockBeatData)
    })
    
    it('should handle smooth transitions between modes', async () => {
        await app.init()
        
        // Test transition to audio mode
        app.startAudioModeTransition(true)
        expect(app.audioState.transitionProgress).toBe(0)
        
        // Test transition effects
        app.applyAudioModeTransition(true, 0.5)
        
        // Should not throw errors
        expect(() => {
            app.applyAudioModeTransition(false, 0.8)
        }).not.toThrow()
    })
    
    it('should cleanup audio resources properly', async () => {
        await app.init()
        await app.toggleAudioMode(true)
        
        // Verify components exist
        expect(app.audioAnalyzer).toBeDefined()
        expect(app.audioEffects).toBeDefined()
        expect(app.audioUI).toBeDefined()
        
        // Cleanup
        app.cleanupAudioMode()
        
        // Verify cleanup
        expect(app.audioAnalyzer).toBeNull()
        expect(app.audioEffects).toBeNull()
        expect(app.audioUI).toBeNull()
        expect(app.audioReactiveEnabled).toBe(false)
        expect(app.audioInitialized).toBe(false)
    })
    
    it('should integrate with existing physics simulation', async () => {
        await app.init()
        await app.toggleAudioMode(true)
        
        // Mock particle renderer methods
        if (app.particleRenderer) {
            app.particleRenderer.enableAudioReactive = vi.fn()
            app.particleRenderer.disableAudioReactive = vi.fn()
            app.particleRenderer.updateAudioColors = vi.fn()
            app.particleRenderer.updateBloomIntensity = vi.fn()
            app.particleRenderer.updateTrebleSizes = vi.fn()
            app.particleRenderer.createSparkleEffects = vi.fn()
            app.particleRenderer.applyBeatPulse = vi.fn()
        }
        
        // Process audio effects
        app.processAudioReactiveEffects()
        
        // Verify integration doesn't break physics
        expect(mockSolver.update).toHaveBeenCalled()
        expect(mockSolver.get_positions).toHaveBeenCalled()
        expect(mockSolver.get_active_particle_count).toHaveBeenCalled()
    })
})