# Audio Reactive Testing Guide

This document provides comprehensive information about testing the audio reactive features in the FLUX Physics Playground.

## Test Structure

The audio reactive test suite is organized into several categories:

### Unit Tests (`tests/unit/`)
- **audio-analyzer.test.js** - Tests core audio analysis functionality
- **beat-detector.test.js** - Tests beat detection algorithms
- **audio-effects.test.js** - Tests audio-driven visual effects
- **audio-settings.test.js** - Tests audio configuration management
- **audio-ui.test.js** - Tests audio user interface components
- **frequency-analyzer.test.js** - Tests frequency analysis and binning
- **audio-performance-monitor.test.js** - Tests performance monitoring
- **fft-optimizer.test.js** - Tests FFT optimization algorithms
- **audio-comprehensive.test.js** - Comprehensive tests for all components

### Integration Tests (`tests/integration/`)
- **audio-reactive-integration.test.js** - Tests complete audio-visual integration
- **audio-visual-sync.test.js** - Tests timing and synchronization
- **audio-settings-integration.test.js** - Tests settings persistence and UI
- **audio-ui-integration.test.js** - Tests UI component interactions
- **system-audio-integration.test.js** - Tests system audio capture
- **audio-permission-handling.test.js** - Tests permission scenarios
- **audio-user-experience.test.js** - Tests with different music types

### Performance Tests (`tests/performance/`)
- **audio-performance-load.test.js** - Tests performance under load
- **audio-performance-optimization.test.js** - Tests optimization strategies

### Cross-Browser Tests (`tests/cross-browser/`)
- **audio-compatibility.test.js** - Tests browser compatibility
- **audio-capture-compatibility.test.js** - Tests audio capture across browsers

### Visual Tests (`tests/visual/`)
- **audio-reactive-visual-validation.test.js** - Tests visual effect accuracy
- **audio-reactive-rendering.test.js** - Tests rendering performance

## Running Tests

### Run All Audio Tests
```bash
npm run test:audio
```

### Run Specific Categories
```bash
# Unit tests only
npx vitest run tests/unit/audio-*.test.js

# Integration tests only
npx vitest run tests/integration/audio-*.test.js

# Performance tests only
npx vitest run tests/performance/audio-*.test.js

# Cross-browser tests only
npx vitest run tests/cross-browser/audio-*.test.js

# Visual tests only
npx vitest run tests/visual/audio-*.test.js
```

### Run Comprehensive Test Suite
```bash
node tests/audio-comprehensive-test-runner.js
```

### Run with Coverage
```bash
npx vitest run --coverage tests/unit/audio-*.test.js tests/integration/audio-*.test.js
```

## Test Categories Explained

### 1. Unit Tests
Test individual audio processing components in isolation:

- **Audio Analysis**: FFT processing, frequency binning, normalization
- **Beat Detection**: Energy-based algorithms, BPM calculation, confidence scoring
- **Audio Effects**: Force generation, color modulation, bloom control
- **Settings Management**: Configuration persistence, validation, defaults
- **Performance Monitoring**: Timing analysis, optimization triggers
- **Error Handling**: Graceful degradation, fallback mechanisms

### 2. Integration Tests
Test how components work together:

- **Audio-Visual Sync**: Timing between audio analysis and visual effects
- **Permission Handling**: Microphone/system audio access scenarios
- **Settings Integration**: UI controls affecting audio processing
- **User Experience**: Different music genres and audio content types
- **System Integration**: Web Audio API, browser differences

### 3. Performance Tests
Test system behavior under various load conditions:

- **High-Frequency Processing**: 60fps audio analysis performance
- **Memory Usage**: Long-running sessions, memory leak detection
- **CPU Load**: Multiple concurrent analyzers, optimization effectiveness
- **Burst Processing**: Handling audio buffer underruns
- **Resource Cleanup**: Proper disposal and reconnection

### 4. Cross-Browser Tests
Test compatibility across different browsers:

- **Web Audio API**: Standard vs. webkit-prefixed implementations
- **MediaDevices API**: getUserMedia and getDisplayMedia support
- **Permission Handling**: Browser-specific permission flows
- **Performance Characteristics**: Browser-specific optimizations
- **Feature Detection**: Graceful fallbacks for unsupported features

### 5. Visual Tests
Test that audio data correctly translates to visual effects:

- **Frequency Response**: Bass, mids, treble affecting different visuals
- **Beat Response**: Pulse effects, bloom intensity, force application
- **Mode Validation**: Different visualization modes (pulse, reactive, flow, ambient)
- **Smoothing**: Gradual transitions, avoiding jarring changes
- **Effect Accuracy**: Correct mapping of audio features to visual elements

## Test Data and Mocking

### Audio Data Simulation
Tests use realistic frequency data patterns:

```javascript
// EDM-style bass-heavy data
const edmData = createFrequencyData({ bass: 0.9, mids: 0.6, treble: 0.7 })

// Classical music with even distribution
const classicalData = createFrequencyData({ bass: 0.4, mids: 0.6, treble: 0.5 })

// Jazz with complex harmonics
const jazzData = createJazzFrequencyData({ complexity: 'high', improvisation: true })
```

### Web Audio API Mocking
Comprehensive mocks for browser APIs:

```javascript
const mockAudioContext = {
  state: 'running',
  sampleRate: 44100,
  createAnalyser: vi.fn(),
  createMediaStreamSource: vi.fn(),
  resume: vi.fn().mockResolvedValue(undefined)
}
```

### Permission Scenario Testing
Various permission states and user interactions:

```javascript
// Permission denied
navigator.mediaDevices.getUserMedia = vi.fn()
  .mockRejectedValue(new Error('NotAllowedError'))

// No microphone found
navigator.mediaDevices.getUserMedia = vi.fn()
  .mockRejectedValue(new Error('NotFoundError'))
```

## Performance Benchmarks

### Target Performance Metrics
- **Audio Analysis**: < 2ms per frame (60fps)
- **Beat Detection**: < 1ms per frame
- **Visual Effect Processing**: < 3ms per frame
- **Memory Usage**: Stable over extended periods
- **Initialization Time**: < 500ms for microphone access

### Performance Test Scenarios
1. **Sustained Load**: 5+ minutes of continuous processing
2. **Burst Processing**: Rapid audio buffer recovery
3. **Multiple Analyzers**: Concurrent audio analysis
4. **Memory Pressure**: Large dataset processing
5. **Browser Switching**: Tab visibility changes

## Common Test Patterns

### Audio Component Testing
```javascript
describe('AudioComponent', () => {
  let component
  
  beforeEach(async () => {
    component = new AudioComponent()
    await component.initialize()
  })
  
  afterEach(() => {
    component?.dispose()
  })
  
  it('should process audio data correctly', () => {
    const audioData = createTestAudioData()
    const result = component.process(audioData)
    
    expect(result.bass).toBeGreaterThanOrEqual(0)
    expect(result.bass).toBeLessThanOrEqual(1)
  })
})
```

### Visual Effect Validation
```javascript
it('should create appropriate visual effects', () => {
  const audioData = { bass: 0.8, mids: 0.5, treble: 0.3 }
  const beatData = { isBeat: true, strength: 1.5 }
  
  audioEffects.processAudioData(audioData, beatData)
  
  // Check force application
  expect(mockFluxApp.solver.getRecentForces().length).toBeGreaterThan(0)
  
  // Check bloom intensity
  expect(mockFluxApp.particleRenderer.currentBloomScale).toBeGreaterThan(1.0)
})
```

### Permission Testing
```javascript
it('should handle permission denial gracefully', async () => {
  navigator.mediaDevices.getUserMedia = vi.fn()
    .mockRejectedValue(new Error('NotAllowedError'))
  
  const result = await audioAnalyzer.initialize('microphone')
  
  expect(result.success).toBe(false)
  expect(result.error).toBe('PERMISSION_DENIED')
  expect(result.userAction).toContain('enable microphone permissions')
})
```

## Debugging Tests

### Enable Verbose Logging
```bash
DEBUG=audio:* npx vitest run tests/unit/audio-analyzer.test.js
```

### Run Single Test
```bash
npx vitest run tests/unit/audio-analyzer.test.js -t "should initialize with default configuration"
```

### Watch Mode for Development
```bash
npx vitest watch tests/unit/audio-analyzer.test.js
```

### Coverage Reports
```bash
npx vitest run --coverage --reporter=html tests/unit/audio-*.test.js
```

## Test Maintenance

### Adding New Tests
1. Follow existing naming conventions
2. Use appropriate test category (unit/integration/performance/etc.)
3. Include proper setup/teardown
4. Mock external dependencies
5. Test both success and failure scenarios

### Updating Tests
1. Keep tests in sync with component changes
2. Update mocks when APIs change
3. Maintain performance benchmarks
4. Review cross-browser compatibility

### Test Data Management
1. Use realistic audio data patterns
2. Create reusable test data generators
3. Document test scenarios
4. Maintain browser compatibility mocks

## Continuous Integration

### CI Test Configuration
```yaml
test:
  script:
    - npm run test:audio:ci
  coverage: 80%
  timeout: 10m
```

### Pre-commit Hooks
```bash
# Run audio tests before commit
npm run test:audio:quick
```

### Performance Regression Detection
```bash
# Compare performance against baseline
npm run test:audio:performance -- --baseline
```

## Troubleshooting

### Common Issues
1. **Mock Setup**: Ensure Web Audio API mocks are properly configured
2. **Timing Issues**: Use proper async/await patterns
3. **Memory Leaks**: Always dispose of audio components in afterEach
4. **Browser Differences**: Test across multiple browser environments
5. **Permission Mocking**: Properly simulate permission states

### Debug Helpers
```javascript
// Enable audio debug logging
localStorage.setItem('debug', 'audio:*')

// Mock audio data visualization
const debugAudioData = (data) => {
  console.log('Audio Data:', {
    bass: data.bass.toFixed(2),
    mids: data.mids.toFixed(2),
    treble: data.treble.toFixed(2)
  })
}
```

## Contributing

When adding new audio features:

1. **Write Tests First**: TDD approach for new components
2. **Test All Scenarios**: Success, failure, edge cases
3. **Performance Testing**: Ensure new features don't degrade performance
4. **Cross-Browser Testing**: Verify compatibility
5. **Documentation**: Update this guide with new test patterns

## Resources

- [Web Audio API Testing Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Testing)
- [Vitest Documentation](https://vitest.dev/)
- [Audio Testing Best Practices](https://web.dev/audio-testing/)
- [Performance Testing Guidelines](https://web.dev/performance-testing/)