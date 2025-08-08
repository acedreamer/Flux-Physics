# FLUX Audio Reactive - Genre-Specific Configurations

## Overview

Different music genres have unique frequency characteristics and rhythmic patterns. This guide provides optimized configurations for various music styles to achieve the best visual results with FLUX Audio Reactive Mode.

## Electronic/EDM Music

### Characteristics
- Strong, consistent bass lines
- Clear beat patterns
- Wide frequency spectrum
- High dynamic range

### Recommended Settings

```javascript
// EDM Configuration
const edmConfig = {
    mode: 'reactive',
    sensitivity: 1.2,
    smoothingFactor: 0.6,
    frequencyWeights: {
        bass: 1.3,      // Emphasize strong bass
        mids: 1.0,      // Standard mid response
        treble: 1.1     // Slight treble boost for synths
    },
    beatDetection: {
        threshold: 1.2,
        minInterval: 200,
        sensitivity: 1.1
    },
    visualEffects: {
        bloomIntensity: 1.4,
        colorShiftSpeed: 0.8,
        sparkleThreshold: 0.3
    }
}

// Apply configuration
fluxApp.setAudioMode('reactive')
fluxApp.setAudioSensitivity(1.2)
fluxApp.audioEffects.updateFrequencyWeights(edmConfig.frequencyWeights)
```

### Visual Characteristics
- **Bass**: Strong radial pulses from center
- **Mids**: Swirling particle motions
- **Treble**: Bright sparkle effects
- **Beats**: Dramatic pulse waves and bloom spikes

### Best Practices
- Use "Reactive" mode for full spectrum response
- Increase sensitivity for subtle electronic elements
- Enable sparkle effects for synthesizer leads
- Monitor performance with complex tracks

## Rock/Metal Music

### Characteristics
- Powerful drum beats
- Guitar-heavy mid frequencies
- Dynamic volume changes
- Complex harmonic content

### Recommended Settings

```javascript
// Rock/Metal Configuration
const rockConfig = {
    mode: 'pulse',
    sensitivity: 1.0,
    smoothingFactor: 0.7,
    frequencyWeights: {
        bass: 1.4,      // Strong emphasis on drums
        mids: 1.2,      // Boost for guitars
        treble: 0.9     // Reduce harsh frequencies
    },
    beatDetection: {
        threshold: 1.4,
        minInterval: 250,
        sensitivity: 1.2
    },
    visualEffects: {
        bloomIntensity: 1.2,
        colorShiftSpeed: 0.6,
        pulseStrength: 1.3
    }
}

// Apply configuration
fluxApp.setAudioMode('pulse')
fluxApp.setAudioSensitivity(1.0)
```

### Visual Characteristics
- **Drums**: Powerful beat-driven pulses
- **Bass Guitar**: Deep radial forces
- **Guitars**: Mid-frequency swirls and color shifts
- **Cymbals**: Controlled treble sparkles

### Best Practices
- Use "Pulse" mode to emphasize drum beats
- Higher smoothing to handle dynamic range
- Boost bass and mid frequencies
- Reduce treble to avoid harsh visuals

## Hip-Hop/Rap Music

### Characteristics
- Deep, prominent bass lines
- Strong rhythmic patterns
- Vocal-heavy mid frequencies
- Percussive elements

### Recommended Settings

```javascript
// Hip-Hop Configuration
const hiphopConfig = {
    mode: 'pulse',
    sensitivity: 1.1,
    smoothingFactor: 0.8,
    frequencyWeights: {
        bass: 1.6,      // Maximum bass emphasis
        mids: 0.8,      // Reduce vocal interference
        treble: 0.7     // Minimal treble response
    },
    beatDetection: {
        threshold: 1.1,
        minInterval: 300,
        sensitivity: 1.3
    },
    visualEffects: {
        bloomIntensity: 1.1,
        colorShiftSpeed: 0.4,
        bassRadius: 150
    }
}

// Apply configuration
fluxApp.setAudioMode('pulse')
fluxApp.setAudioSensitivity(1.1)
```

### Visual Characteristics
- **Bass**: Dominant outward pressure effects
- **Beats**: Strong, rhythmic pulse waves
- **Vocals**: Subtle mid-frequency modulation
- **Hi-hats**: Minimal treble sparkles

### Best Practices
- Maximize bass weight for sub-bass response
- Use "Pulse" mode for beat emphasis
- Higher smoothing for stable bass response
- Reduce mid/treble to focus on rhythm

## Classical Music

### Characteristics
- Wide dynamic range
- Complex harmonic structures
- Gradual tempo changes
- Orchestral frequency distribution

### Recommended Settings

```javascript
// Classical Configuration
const classicalConfig = {
    mode: 'ambient',
    sensitivity: 0.7,
    smoothingFactor: 0.9,
    frequencyWeights: {
        bass: 0.8,      // Gentle bass response
        mids: 1.1,      // Emphasize strings/woodwinds
        treble: 1.0     // Natural treble for brass
    },
    beatDetection: {
        threshold: 1.6,
        minInterval: 500,
        sensitivity: 0.8
    },
    visualEffects: {
        bloomIntensity: 0.9,
        colorShiftSpeed: 0.2,
        ambientDrift: 1.2
    }
}

// Apply configuration
fluxApp.setAudioMode('ambient')
fluxApp.setAudioSensitivity(0.7)
```

### Visual Characteristics
- **Strings**: Gentle swirling motions
- **Brass**: Warm color shifts
- **Percussion**: Subtle pulse effects
- **Overall**: Smooth, flowing movements

### Best Practices
- Use "Ambient" mode for subtle effects
- Lower sensitivity for dynamic range
- High smoothing for gradual changes
- Emphasize mid frequencies for instruments

## Jazz Music

### Characteristics
- Complex rhythmic patterns
- Improvisation elements
- Rich harmonic content
- Dynamic instrument solos

### Recommended Settings

```javascript
// Jazz Configuration
const jazzConfig = {
    mode: 'flow',
    sensitivity: 0.9,
    smoothingFactor: 0.75,
    frequencyWeights: {
        bass: 1.1,      // Walking bass lines
        mids: 1.3,      // Saxophone/piano emphasis
        treble: 1.0     // Cymbals and brass
    },
    beatDetection: {
        threshold: 1.3,
        minInterval: 200,
        sensitivity: 0.9
    },
    visualEffects: {
        bloomIntensity: 1.0,
        colorShiftSpeed: 0.5,
        flowDirection: 'stereo'
    }
}

// Apply configuration
fluxApp.setAudioMode('flow')
fluxApp.setAudioSensitivity(0.9)
```

### Visual Characteristics
- **Bass**: Steady foundational movement
- **Solos**: Dynamic directional flows
- **Drums**: Syncopated pulse patterns
- **Harmony**: Rich color variations

### Best Practices
- Use "Flow" mode for improvisation response
- Moderate sensitivity for dynamic solos
- Emphasize mid frequencies for instruments
- Allow for complex rhythmic patterns

## Ambient/Chillout Music

### Characteristics
- Minimal rhythmic content
- Atmospheric textures
- Gradual changes
- Wide stereo field

### Recommended Settings

```javascript
// Ambient Configuration
const ambientConfig = {
    mode: 'ambient',
    sensitivity: 0.5,
    smoothingFactor: 0.95,
    frequencyWeights: {
        bass: 0.6,      // Minimal bass response
        mids: 0.8,      // Gentle mid response
        treble: 1.2     // Emphasize atmospheric highs
    },
    beatDetection: {
        threshold: 2.0,
        minInterval: 1000,
        sensitivity: 0.5
    },
    visualEffects: {
        bloomIntensity: 0.8,
        colorShiftSpeed: 0.1,
        ambientDrift: 1.5
    }
}

// Apply configuration
fluxApp.setAudioMode('ambient')
fluxApp.setAudioSensitivity(0.5)
```

### Visual Characteristics
- **Textures**: Slow, flowing movements
- **Atmosphere**: Gentle color transitions
- **Minimal Beats**: Rare, subtle pulses
- **Overall**: Meditative, calming visuals

### Best Practices
- Use "Ambient" mode exclusively
- Very low sensitivity for subtle response
- Maximum smoothing for gradual changes
- Emphasize treble for atmospheric elements

## Pop Music

### Characteristics
- Clear vocal melodies
- Consistent beat patterns
- Balanced frequency spectrum
- Commercial production

### Recommended Settings

```javascript
// Pop Configuration
const popConfig = {
    mode: 'reactive',
    sensitivity: 1.0,
    smoothingFactor: 0.7,
    frequencyWeights: {
        bass: 1.1,      // Moderate bass emphasis
        mids: 1.0,      // Balanced vocal response
        treble: 1.0     // Standard treble response
    },
    beatDetection: {
        threshold: 1.2,
        minInterval: 250,
        sensitivity: 1.0
    },
    visualEffects: {
        bloomIntensity: 1.1,
        colorShiftSpeed: 0.6,
        balancedResponse: true
    }
}

// Apply configuration
fluxApp.setAudioMode('reactive')
fluxApp.setAudioSensitivity(1.0)
```

### Visual Characteristics
- **Vocals**: Balanced mid-frequency response
- **Drums**: Clear beat visualization
- **Bass**: Moderate pulse effects
- **Overall**: Accessible, appealing visuals

### Best Practices
- Use "Reactive" mode for full spectrum
- Standard sensitivity works well
- Balanced frequency weights
- Suitable for general audiences

## Dubstep/Bass Music

### Characteristics
- Extreme bass drops
- High dynamic range
- Complex rhythmic patterns
- Heavy use of sub-bass

### Recommended Settings

```javascript
// Dubstep Configuration
const dubstepConfig = {
    mode: 'pulse',
    sensitivity: 1.4,
    smoothingFactor: 0.5,
    frequencyWeights: {
        bass: 1.8,      // Maximum bass emphasis
        mids: 0.9,      // Reduced mid response
        treble: 1.2     // Boost for high-frequency elements
    },
    beatDetection: {
        threshold: 1.0,
        minInterval: 150,
        sensitivity: 1.4
    },
    visualEffects: {
        bloomIntensity: 1.6,
        colorShiftSpeed: 1.0,
        extremeEffects: true
    }
}

// Apply configuration
fluxApp.setAudioMode('pulse')
fluxApp.setAudioSensitivity(1.4)
```

### Visual Characteristics
- **Bass Drops**: Explosive radial effects
- **Sub-bass**: Deep, powerful pulses
- **Wobbles**: Rapid color/size changes
- **Builds**: Gradual intensity increases

### Best Practices
- Use "Pulse" mode for maximum impact
- High sensitivity for extreme dynamics
- Lower smoothing for rapid changes
- Monitor performance during drops

## Custom Configuration Template

```javascript
// Custom Genre Configuration Template
const customConfig = {
    // Basic settings
    mode: 'reactive',           // 'pulse', 'reactive', 'flow', 'ambient'
    sensitivity: 1.0,           // 0.1 - 2.0
    smoothingFactor: 0.7,       // 0.1 - 1.0
    
    // Frequency response
    frequencyWeights: {
        bass: 1.0,              // 0.1 - 2.0
        mids: 1.0,              // 0.1 - 2.0
        treble: 1.0             // 0.1 - 2.0
    },
    
    // Beat detection
    beatDetection: {
        threshold: 1.2,         // 0.5 - 2.0
        minInterval: 250,       // 100 - 1000ms
        sensitivity: 1.0        // 0.1 - 2.0
    },
    
    // Visual effects
    visualEffects: {
        bloomIntensity: 1.0,    // 0.5 - 2.0
        colorShiftSpeed: 0.6,   // 0.1 - 1.0
        sparkleThreshold: 0.2   // 0.1 - 1.0
    }
}

// Function to apply custom configuration
function applyCustomConfig(config) {
    fluxApp.setAudioMode(config.mode)
    fluxApp.setAudioSensitivity(config.sensitivity)
    
    if (fluxApp.audioEffects) {
        fluxApp.audioEffects.setSmoothingFactor(config.smoothingFactor)
        fluxApp.audioEffects.updateFrequencyWeights(config.frequencyWeights)
        fluxApp.audioEffects.updateBeatDetection(config.beatDetection)
        fluxApp.audioEffects.updateVisualEffects(config.visualEffects)
    }
}
```

## Configuration Presets

### Quick Setup Function

```javascript
// Genre preset loader
function loadGenrePreset(genre) {
    const presets = {
        'edm': edmConfig,
        'rock': rockConfig,
        'hiphop': hiphopConfig,
        'classical': classicalConfig,
        'jazz': jazzConfig,
        'ambient': ambientConfig,
        'pop': popConfig,
        'dubstep': dubstepConfig
    }
    
    const config = presets[genre.toLowerCase()]
    if (config) {
        applyCustomConfig(config)
        console.log(`Applied ${genre} preset`)
    } else {
        console.warn(`Unknown genre: ${genre}`)
        console.log('Available presets:', Object.keys(presets))
    }
}

// Usage examples
loadGenrePreset('edm')      // Electronic music
loadGenrePreset('rock')     // Rock/Metal
loadGenrePreset('ambient')  // Ambient/Chillout
```

### Automatic Genre Detection

```javascript
// Experimental: Automatic genre detection based on audio characteristics
class GenreDetector {
    static analyzeAudioCharacteristics(audioData, beatData) {
        const bassLevel = audioData.bass
        const midsLevel = audioData.mids
        const trebleLevel = audioData.treble
        const beatStrength = beatData.strength
        const bpm = beatData.bpm
        
        // Simple heuristics for genre detection
        if (bassLevel > 0.7 && beatStrength > 1.2 && bpm > 120) {
            return 'edm'
        } else if (bassLevel > 0.6 && midsLevel > 0.7 && bpm > 100) {
            return 'rock'
        } else if (bassLevel > 0.8 && beatStrength > 1.0) {
            return 'hiphop'
        } else if (beatStrength < 0.5 && midsLevel > 0.6) {
            return 'classical'
        } else if (trebleLevel > 0.6 && bassLevel < 0.4) {
            return 'ambient'
        } else {
            return 'pop'
        }
    }
    
    static autoConfigureGenre(audioData, beatData) {
        const detectedGenre = this.analyzeAudioCharacteristics(audioData, beatData)
        loadGenrePreset(detectedGenre)
        return detectedGenre
    }
}

// Auto-configure based on current audio
const currentGenre = GenreDetector.autoConfigureGenre(
    fluxApp.audioState.lastAudioData,
    fluxApp.audioState.lastBeatData
)
console.log(`Auto-detected genre: ${currentGenre}`)
```

## Performance Considerations by Genre

### High-Performance Genres
- **Ambient**: Minimal processing, stable performance
- **Classical**: Moderate processing, gradual changes
- **Pop**: Balanced processing, predictable patterns

### Medium-Performance Genres
- **Jazz**: Variable processing, complex patterns
- **Rock**: Moderate processing, dynamic range
- **Hip-Hop**: Bass-heavy processing, rhythmic patterns

### High-Performance Impact Genres
- **EDM**: High processing, complex effects
- **Dubstep**: Extreme processing, performance spikes
- **Metal**: High processing, dynamic range

### Optimization Tips

```javascript
// Performance monitoring for different genres
function monitorGenrePerformance(genre) {
    const startTime = performance.now()
    let frameCount = 0
    let totalProcessingTime = 0
    
    const monitor = setInterval(() => {
        const audioData = fluxApp.audioState.lastAudioData
        if (audioData) {
            totalProcessingTime += audioData.analysisTime
            frameCount++
            
            if (frameCount >= 60) {
                const avgProcessingTime = totalProcessingTime / frameCount
                console.log(`${genre} - Avg processing time: ${avgProcessingTime.toFixed(2)}ms`)
                
                if (avgProcessingTime > 5) {
                    console.warn(`Performance warning for ${genre} - consider reducing settings`)
                }
                
                // Reset counters
                frameCount = 0
                totalProcessingTime = 0
            }
        }
    }, 1000)
    
    // Stop monitoring after 5 minutes
    setTimeout(() => clearInterval(monitor), 300000)
}
```

---

*FLUX Audio Reactive Genre Configurations - Optimize visuals for every music style*