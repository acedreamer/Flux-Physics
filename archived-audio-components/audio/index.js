/**
 * FLUX Audio Reactive Mode - Audio Processing Module
 * 
 * This module provides audio analysis capabilities for the FLUX Physics Playground,
 * enabling real-time music visualization and audio-reactive particle effects.
 */

// Core audio processing components (updated paths)
export { AudioAnalyzer } from './core/audio-analyzer.js'
export { AudioEffects } from './core/audio-effects.js'
export { default as BeatDetector } from './core/beat-detector.js'
export { FrequencyAnalyzer } from './core/frequency-analyzer.js'
export { SimpleAudioReactive } from './core/simple-audio-reactive.js'
export { setupFluxAudioModule, FluxAudioModule } from './core/flux-audio-module.js'

// UI components (legacy - use FluxAudioModule for new projects)
export { AudioUI } from './ui/audio-ui.js'

// Examples and utilities
export { AudioExample } from './examples/audio-example.js'

// Audio processing constants
export const AUDIO_CONSTANTS = {
    // Default configuration values
    DEFAULT_FFT_SIZE: 2048,
    DEFAULT_SMOOTHING: 0.8,
    DEFAULT_MIN_DECIBELS: -90,
    DEFAULT_MAX_DECIBELS: -10,
    DEFAULT_SAMPLE_RATE: 44100,
    
    // Frequency ranges (Hz)
    FREQUENCY_RANGES: {
        BASS: { min: 20, max: 250 },
        MIDS: { min: 250, max: 4000 },
        TREBLE: { min: 4000, max: 20000 }
    },
    
    // Performance targets
    PERFORMANCE: {
        TARGET_ANALYSIS_TIME: 2, // ms
        WARNING_THRESHOLD: 5,    // ms
        MAX_ANALYSIS_TIME: 10    // ms
    },
    
    // Audio source types
    AUDIO_SOURCES: {
        MICROPHONE: 'microphone',
        SYSTEM: 'system'
    },
    
    // Error types
    ERROR_TYPES: {
        WEB_AUDIO_UNSUPPORTED: 'WEB_AUDIO_UNSUPPORTED',
        PERMISSION_DENIED: 'PERMISSION_DENIED',
        NO_MICROPHONE: 'NO_MICROPHONE',
        MICROPHONE_BUSY: 'MICROPHONE_BUSY',
        SYSTEM_AUDIO_UNSUPPORTED: 'SYSTEM_AUDIO_UNSUPPORTED',
        NO_SYSTEM_AUDIO: 'NO_SYSTEM_AUDIO',
        INITIALIZATION_FAILED: 'INITIALIZATION_FAILED'
    }
}