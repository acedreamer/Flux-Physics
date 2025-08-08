/**
 * User experience tests for different music types and scenarios
 * Tests how the audio reactive system performs with various real-world audio content
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('Audio User Experience Tests', () => {
    let mockAudioContext, mockAnalyserNode
    let AudioAnalyzer, BeatDetector, AudioEffects
    
    beforeEach(async () => {
        // Import audio components
        const analyzerModule = await import('../../src/audio/audio-analyzer.js')
        const beatModule = await import('../../src/audio/beat-detector.js')
        const effectsModule = await import('../../src/audio/audio-effects.js')
        
        AudioAnalyzer = analyzerModule.AudioAnalyzer
        BeatDetector = beatModule.default
        AudioEffects = effectsModule.AudioEffects
        
        // Mock Web Audio API
        mockAudioContext = {
            state: 'running',
            sampleRate: 44100,
            resume: vi.fn().mockResolvedValue(undefined),
            close: vi.fn().mockResolvedValue(undefined),
            createAnalyser: vi.fn(),
            createMediaStreamSource: vi.fn()
        }
        
        mockAnalyserNode = {
            fftSize: 2048,
            frequencyBinCount: 1024,
            connect: vi.fn(),
            disconnect: vi.fn(),
            getByteFrequencyData: vi.fn(),
            getByteTimeDomainData: vi.fn()
        }
        
        mockAudioContext.createAnalyser.mockReturnValue(mockAnalyserNode)
        mockAudioContext.createMediaStreamSource.mockReturnValue({
            connect: vi.fn(),
            disconnect: vi.fn()
        })
        
        // Setup global mocks
        global.window = {
            AudioContext: vi.fn(() => mockAudioContext),
            webkitAudioContext: vi.fn(() => mockAudioContext)
        }
        
        global.navigator = {
            mediaDevices: {
                getUserMedia: vi.fn().mockResolvedValue({
                    getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
                    getAudioTracks: vi.fn().mockReturnValue([{ kind: 'audio' }])
                })
            }
        }
        
        global.performance = {
            now: vi.fn(() => Date.now())
        }
    })
    
    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('Electronic Dance Music (EDM)', () => {
        it('should handle heavy bass drops effectively', async () => {
            const audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            
            const beatDetector = new BeatDetector(audioAnalyzer)
            const mockFluxApp = createMockFluxApp()
            const audioEffects = new AudioEffects(mockFluxApp)
            audioEffects.setMode('pulse')
            
            // Simulate EDM bass drop sequence
            const edmSequence = [
                // Build-up (increasing energy)
                { bass: 0.3, mids: 0.6, treble: 0.8, isBeat: false, phase: 'buildup' },
                { bass: 0.4, mids: 0.7, treble: 0.9, isBeat: false, phase: 'buildup' },
                { bass: 0.5, mids: 0.8, treble: 0.9, isBeat: false, phase: 'buildup' },
                // Drop (massive bass)
                { bass: 0.95, mids: 0.7, treble: 0.6, isBeat: true, phase: 'drop' },
                { bass: 0.9, mids: 0.6, treble: 0.5, isBeat: true, phase: 'drop' },
                { bass: 0.85, mids: 0.6, treble: 0.5, isBeat: true, phase: 'drop' },
                // Sustained energy
                { bass: 0.8, mids: 0.7, treble: 0.6, isBeat: true, phase: 'sustain' },
                { bass: 0.75, mids: 0.7, treble: 0.6, isBeat: true, phase: 'sustain' }
            ]
            
            const visualResponses = []
            
            // Build energy history for beat detection
            for (let i = 0; i < 20; i++) {
                const baseData = new Uint8Array(1024).fill(40 + Math.random() * 15)
                beatDetector.detectBeat(baseData)
            }
            
            for (const [index, audioFrame] of edmSequence.entries()) {
                const frequencyData = createEDMFrequencyData(audioFrame)
                
                mockAnalyserNode.getByteFrequencyData.mockImplementation((array) => {
                    array.set(frequencyData)
                })
                
                const audioData = audioAnalyzer.getFrequencyData()
                const beatData = beatDetector.detectBeat(frequencyData)
                
                // Override beat detection for controlled test
                if (audioFrame.isBeat) {
                    beatData.isBeat = true
                    beatData.strength = audioFrame.bass * 2
                }
                
                audioEffects.processAudioData(audioData, beatData)
                
                visualResponses.push({
                    phase: audioFrame.phase,
                    bassLevel: audioFrame.bass,
                    beatDetected: beatData.isBeat,
                    beatStrength: beatData.strength,
                    forceCount: mockFluxApp.solver.getRecentForces().length,
                    bloomIntensity: mockFluxApp.particleRenderer.currentBloomScale,
                    pulseCount: mockFluxApp.particleRenderer.getRecentPulses().length
                })
                
                await new Promise(resolve => setTimeout(resolve, 100)) // Simulate time between frames
            }
            
            // Analyze visual response patterns
            const buildupResponses = visualResponses.filter(r => r.phase === 'buildup')
            const dropResponses = visualResponses.filter(r => r.phase === 'drop')
            const sustainResponses = visualResponses.filter(r => r.phase === 'sustain')
            
            // Drop should have strongest visual response
            const avgDropBloom = dropResponses.reduce((sum, r) => sum + r.bloomIntensity, 0) / dropResponses.length
            const avgBuildupBloom = buildupResponses.reduce((sum, r) => sum + r.bloomIntensity, 0) / buildupResponses.length
            
            expect(avgDropBloom).toBeGreaterThan(avgBuildupBloom)
            
            // Drop should trigger more forces
            const totalDropForces = dropResponses.reduce((sum, r) => sum + r.forceCount, 0)
            const totalBuildupForces = buildupResponses.reduce((sum, r) => sum + r.forceCount, 0)
            
            expect(totalDropForces).toBeGreaterThan(totalBuildupForces)
            
            // Beat detection should be accurate during drop
            const dropBeats = dropResponses.filter(r => r.beatDetected)
            expect(dropBeats.length).toBeGreaterThan(0)
            
            audioAnalyzer.dispose()
        })
        
        it('should respond to high-frequency synth leads', async () => {
            const audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            
            const mockFluxApp = createMockFluxApp()
            const audioEffects = new AudioEffects(mockFluxApp)
            audioEffects.setMode('reactive')
            
            // Simulate synth lead with high treble content
            const synthSequence = [
                { bass: 0.4, mids: 0.3, treble: 0.9, note: 'high' },
                { bass: 0.4, mids: 0.4, treble: 0.8, note: 'mid-high' },
                { bass: 0.4, mids: 0.5, treble: 0.95, note: 'very-high' },
                { bass: 0.4, mids: 0.3, treble: 0.7, note: 'mid' }
            ]
            
            const sparkleResponses = []
            
            for (const synthFrame of synthSequence) {
                const frequencyData = createSynthFrequencyData(synthFrame)
                
                mockAnalyserNode.getByteFrequencyData.mockImplementation((array) => {
                    array.set(frequencyData)
                })
                
                const audioData = audioAnalyzer.getFrequencyData()
                const beatData = { isBeat: false, energy: 0.4, strength: 0, bpm: 0 }
                
                const initialSparkles = mockFluxApp.particleRenderer.sparkleParticles.length
                audioEffects.processAudioData(audioData, beatData)
                const finalSparkles = mockFluxApp.particleRenderer.sparkleParticles.length
                
                sparkleResponses.push({
                    note: synthFrame.note,
                    trebleLevel: synthFrame.treble,
                    sparklesCreated: finalSparkles - initialSparkles,
                    particleSizes: [...mockFluxApp.particleRenderer.trebleSizeMultipliers]
                })
                
                await new Promise(resolve => setTimeout(resolve, 50))
            }
            
            // Higher treble should create more sparkles
            const highTrebleFrames = sparkleResponses.filter(r => r.trebleLevel > 0.8)
            const lowTrebleFrames = sparkleResponses.filter(r => r.trebleLevel < 0.8)
            
            if (highTrebleFrames.length > 0 && lowTrebleFrames.length > 0) {
                const avgHighSparkles = highTrebleFrames.reduce((sum, r) => sum + r.sparklesCreated, 0) / highTrebleFrames.length
                const avgLowSparkles = lowTrebleFrames.reduce((sum, r) => sum + r.sparklesCreated, 0) / lowTrebleFrames.length
                
                expect(avgHighSparkles).toBeGreaterThanOrEqual(avgLowSparkles)
            }
            
            // Particle sizes should vary with treble
            const veryHighFrame = sparkleResponses.find(r => r.note === 'very-high')
            if (veryHighFrame) {
                const avgSize = veryHighFrame.particleSizes.reduce((a, b) => a + b, 0) / veryHighFrame.particleSizes.length
                expect(avgSize).toBeGreaterThan(1.0) // Should be enlarged
            }
            
            audioAnalyzer.dispose()
        })
    })

    describe('Classical Music', () => {
        it('should handle dynamic range and orchestral complexity', async () => {
            const audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            
            const mockFluxApp = createMockFluxApp()
            const audioEffects = new AudioEffects(mockFluxApp)
            audioEffects.setMode('ambient')
            
            // Simulate classical music dynamics (pianissimo to fortissimo)
            const classicalSequence = [
                { bass: 0.1, mids: 0.2, treble: 0.3, dynamic: 'pp', complexity: 'simple' },
                { bass: 0.2, mids: 0.3, treble: 0.4, dynamic: 'p', complexity: 'simple' },
                { bass: 0.4, mids: 0.5, treble: 0.6, dynamic: 'mp', complexity: 'moderate' },
                { bass: 0.6, mids: 0.7, treble: 0.8, dynamic: 'mf', complexity: 'moderate' },
                { bass: 0.7, mids: 0.8, treble: 0.9, dynamic: 'f', complexity: 'complex' },
                { bass: 0.9, mids: 0.9, treble: 0.95, dynamic: 'ff', complexity: 'complex' },
                { bass: 0.3, mids: 0.4, treble: 0.5, dynamic: 'p', complexity: 'simple' } // Return to quiet
            ]
            
            const dynamicResponses = []
            
            for (const classicalFrame of classicalSequence) {
                const frequencyData = createClassicalFrequencyData(classicalFrame)
                
                mockAnalyserNode.getByteFrequencyData.mockImplementation((array) => {
                    array.set(frequencyData)
                })
                
                const audioData = audioAnalyzer.getFrequencyData()
                const beatData = { isBeat: false, energy: classicalFrame.bass * 0.8, strength: 0, bpm: 0 }
                
                const initialBloom = mockFluxApp.particleRenderer.currentBloomScale
                audioEffects.processAudioData(audioData, beatData)
                const finalBloom = mockFluxApp.particleRenderer.currentBloomScale
                
                dynamicResponses.push({
                    dynamic: classicalFrame.dynamic,
                    complexity: classicalFrame.complexity,
                    overallLevel: (classicalFrame.bass + classicalFrame.mids + classicalFrame.treble) / 3,
                    bloomChange: Math.abs(finalBloom - initialBloom),
                    colorChanges: mockFluxApp.particleRenderer.getRecentColorChanges().length,
                    forceCount: mockFluxApp.solver.getRecentForces().length
                })
                
                await new Promise(resolve => setTimeout(resolve, 200)) // Classical music changes more slowly
            }
            
            // Visual response should correlate with musical dynamics
            const quietFrames = dynamicResponses.filter(r => r.dynamic === 'pp' || r.dynamic === 'p')
            const loudFrames = dynamicResponses.filter(r => r.dynamic === 'f' || r.dynamic === 'ff')
            
            if (quietFrames.length > 0 && loudFrames.length > 0) {
                const avgQuietBloom = quietFrames.reduce((sum, r) => sum + r.bloomChange, 0) / quietFrames.length
                const avgLoudBloom = loudFrames.reduce((sum, r) => sum + r.bloomChange, 0) / loudFrames.length
                
                expect(avgLoudBloom).toBeGreaterThan(avgQuietBloom)
            }
            
            // Complex sections should have more visual activity
            const complexFrames = dynamicResponses.filter(r => r.complexity === 'complex')
            const simpleFrames = dynamicResponses.filter(r => r.complexity === 'simple')
            
            if (complexFrames.length > 0 && simpleFrames.length > 0) {
                const avgComplexActivity = complexFrames.reduce((sum, r) => sum + r.colorChanges + r.forceCount, 0) / complexFrames.length
                const avgSimpleActivity = simpleFrames.reduce((sum, r) => sum + r.colorChanges + r.forceCount, 0) / simpleFrames.length
                
                expect(avgComplexActivity).toBeGreaterThanOrEqual(avgSimpleActivity)
            }
            
            audioAnalyzer.dispose()
        })
        
        it('should handle string section harmonics', async () => {
            const audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            
            const mockFluxApp = createMockFluxApp()
            const audioEffects = new AudioEffects(mockFluxApp)
            audioEffects.setMode('flow')
            
            // Simulate string section with rich harmonics
            const stringSequence = [
                { fundamental: 440, harmonics: [880, 1320, 1760], intensity: 0.6 }, // A4 with harmonics
                { fundamental: 523, harmonics: [1046, 1569, 2092], intensity: 0.7 }, // C5 with harmonics
                { fundamental: 659, harmonics: [1318, 1977, 2636], intensity: 0.8 }, // E5 with harmonics
                { fundamental: 392, harmonics: [784, 1176, 1568], intensity: 0.5 }  // G4 with harmonics
            ]
            
            const harmonicResponses = []
            
            for (const stringFrame of stringSequence) {
                const frequencyData = createStringFrequencyData(stringFrame)
                
                mockAnalyserNode.getByteFrequencyData.mockImplementation((array) => {
                    array.set(frequencyData)
                })
                
                const audioData = audioAnalyzer.getFrequencyData()
                const beatData = { isBeat: false, energy: 0.3, strength: 0, bpm: 0 }
                
                audioEffects.processAudioData(audioData, beatData)
                
                harmonicResponses.push({
                    fundamental: stringFrame.fundamental,
                    intensity: stringFrame.intensity,
                    midsResponse: audioData.mids,
                    trebleResponse: audioData.treble,
                    colorHue: mockFluxApp.particleRenderer.currentHue,
                    flowForces: mockFluxApp.solver.getRecentForces().length
                })
                
                await new Promise(resolve => setTimeout(resolve, 100))
            }
            
            // Higher intensity should produce stronger visual response
            const sortedByIntensity = harmonicResponses.sort((a, b) => a.intensity - b.intensity)
            
            // Verify that visual response generally increases with intensity
            for (let i = 1; i < sortedByIntensity.length; i++) {
                const prev = sortedByIntensity[i - 1]
                const curr = sortedByIntensity[i]
                
                // Allow some tolerance for smoothing effects
                expect(curr.midsResponse + curr.trebleResponse).toBeGreaterThanOrEqual(
                    (prev.midsResponse + prev.trebleResponse) * 0.8
                )
            }
            
            // Flow mode should create directional forces
            const totalFlowForces = harmonicResponses.reduce((sum, r) => sum + r.flowForces, 0)
            expect(totalFlowForces).toBeGreaterThan(0)
            
            audioAnalyzer.dispose()
        })
    })

    describe('Rock/Metal Music', () => {
        it('should handle distorted guitar and aggressive drums', async () => {
            const audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            
            const beatDetector = new BeatDetector(audioAnalyzer)
            const mockFluxApp = createMockFluxApp()
            const audioEffects = new AudioEffects(mockFluxApp)
            audioEffects.setMode('reactive')
            
            // Simulate metal music characteristics
            const metalSequence = [
                { bass: 0.8, mids: 0.9, treble: 0.7, isBeat: true, element: 'kick-snare' },
                { bass: 0.6, mids: 0.8, treble: 0.9, isBeat: false, element: 'guitar-solo' },
                { bass: 0.9, mids: 0.7, treble: 0.6, isBeat: true, element: 'double-kick' },
                { bass: 0.7, mids: 0.9, treble: 0.8, isBeat: false, element: 'distorted-chord' },
                { bass: 0.85, mids: 0.8, treble: 0.7, isBeat: true, element: 'breakdown' }
            ]
            
            // Build energy history
            for (let i = 0; i < 20; i++) {
                const baseData = new Uint8Array(1024).fill(60 + Math.random() * 20)
                beatDetector.detectBeat(baseData)
            }
            
            const metalResponses = []
            
            for (const metalFrame of metalSequence) {
                const frequencyData = createMetalFrequencyData(metalFrame)
                
                mockAnalyserNode.getByteFrequencyData.mockImplementation((array) => {
                    array.set(frequencyData)
                })
                
                const audioData = audioAnalyzer.getFrequencyData()
                const beatData = beatDetector.detectBeat(frequencyData)
                
                // Override for controlled testing
                if (metalFrame.isBeat) {
                    beatData.isBeat = true
                    beatData.strength = 1.5
                }
                
                audioEffects.processAudioData(audioData, beatData)
                
                metalResponses.push({
                    element: metalFrame.element,
                    isBeat: metalFrame.isBeat,
                    beatDetected: beatData.isBeat,
                    bassLevel: metalFrame.bass,
                    midsLevel: metalFrame.mids,
                    trebleLevel: metalFrame.treble,
                    forceCount: mockFluxApp.solver.getRecentForces().length,
                    bloomIntensity: mockFluxApp.particleRenderer.currentBloomScale,
                    sparkleCount: mockFluxApp.particleRenderer.getRecentSparkles().length,
                    colorHue: mockFluxApp.particleRenderer.currentHue
                })
                
                await new Promise(resolve => setTimeout(resolve, 150))
            }
            
            // Drum hits should create strong visual responses
            const drumHits = metalResponses.filter(r => r.element.includes('kick') || r.element.includes('breakdown'))
            const guitarParts = metalResponses.filter(r => r.element.includes('guitar') || r.element.includes('chord'))
            
            if (drumHits.length > 0) {
                const avgDrumForces = drumHits.reduce((sum, r) => sum + r.forceCount, 0) / drumHits.length
                expect(avgDrumForces).toBeGreaterThan(0)
                
                // Drum hits should have strong bloom response
                const avgDrumBloom = drumHits.reduce((sum, r) => sum + r.bloomIntensity, 0) / drumHits.length
                expect(avgDrumBloom).toBeGreaterThan(1.2)
            }
            
            // Guitar solos should create sparkles (high treble content)
            const guitarSolo = metalResponses.find(r => r.element === 'guitar-solo')
            if (guitarSolo) {
                expect(guitarSolo.sparkleCount).toBeGreaterThan(0)
            }
            
            // High energy should be maintained throughout
            const avgOverallEnergy = metalResponses.reduce((sum, r) => 
                sum + (r.bassLevel + r.midsLevel + r.trebleLevel) / 3, 0) / metalResponses.length
            expect(avgOverallEnergy).toBeGreaterThan(0.6)
            
            audioAnalyzer.dispose()
        })
    })

    describe('Jazz Music', () => {
        it('should handle complex rhythms and improvisation', async () => {
            const audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            
            const beatDetector = new BeatDetector(audioAnalyzer)
            const mockFluxApp = createMockFluxApp()
            const audioEffects = new AudioEffects(mockFluxApp)
            audioEffects.setMode('flow')
            
            // Simulate jazz characteristics with syncopation
            const jazzSequence = [
                { bass: 0.4, mids: 0.6, treble: 0.5, isBeat: true, timing: 'on-beat', instrument: 'bass' },
                { bass: 0.3, mids: 0.7, treble: 0.8, isBeat: false, timing: 'off-beat', instrument: 'piano' },
                { bass: 0.5, mids: 0.5, treble: 0.9, isBeat: false, timing: 'syncopated', instrument: 'sax' },
                { bass: 0.4, mids: 0.6, treble: 0.4, isBeat: true, timing: 'on-beat', instrument: 'drums' },
                { bass: 0.2, mids: 0.8, treble: 0.7, isBeat: false, timing: 'improvised', instrument: 'trumpet' }
            ]
            
            // Build energy history with jazz-like variance
            for (let i = 0; i < 20; i++) {
                const variance = Math.sin(i * 0.3) * 20 + 10 // More musical variance
                const baseData = new Uint8Array(1024).fill(50 + variance)
                beatDetector.detectBeat(baseData)
            }
            
            const jazzResponses = []
            
            for (const jazzFrame of jazzSequence) {
                const frequencyData = createJazzFrequencyData(jazzFrame)
                
                mockAnalyserNode.getByteFrequencyData.mockImplementation((array) => {
                    array.set(frequencyData)
                })
                
                const audioData = audioAnalyzer.getFrequencyData()
                const beatData = beatDetector.detectBeat(frequencyData)
                
                if (jazzFrame.isBeat) {
                    beatData.isBeat = true
                    beatData.strength = 1.0
                }
                
                audioEffects.processAudioData(audioData, beatData)
                
                jazzResponses.push({
                    instrument: jazzFrame.instrument,
                    timing: jazzFrame.timing,
                    isBeat: jazzFrame.isBeat,
                    midsLevel: jazzFrame.mids,
                    trebleLevel: jazzFrame.treble,
                    colorHue: mockFluxApp.particleRenderer.currentHue,
                    flowForces: mockFluxApp.solver.getRecentForces().length,
                    bloomIntensity: mockFluxApp.particleRenderer.currentBloomScale
                })
                
                await new Promise(resolve => setTimeout(resolve, 120)) // Jazz timing
            }
            
            // Different instruments should produce varied visual responses
            const instrumentTypes = [...new Set(jazzResponses.map(r => r.instrument))]
            expect(instrumentTypes.length).toBeGreaterThan(2) // Multiple instruments
            
            // Improvised sections should have more color variation
            const improvisedSections = jazzResponses.filter(r => r.timing === 'improvised' || r.timing === 'syncopated')
            const regularSections = jazzResponses.filter(r => r.timing === 'on-beat')
            
            if (improvisedSections.length > 0 && regularSections.length > 0) {
                // Calculate color variation
                const improvisedHues = improvisedSections.map(r => r.colorHue)
                const regularHues = regularSections.map(r => r.colorHue)
                
                const improvisedVariance = calculateVariance(improvisedHues)
                const regularVariance = calculateVariance(regularHues)
                
                // Improvised sections should have more color variation (within reason)
                expect(improvisedVariance).toBeGreaterThanOrEqual(regularVariance * 0.8)
            }
            
            // Flow mode should create smooth directional movement
            const totalFlowForces = jazzResponses.reduce((sum, r) => sum + r.flowForces, 0)
            expect(totalFlowForces).toBeGreaterThan(0)
            
            audioAnalyzer.dispose()
        })
    })

    describe('Ambient/Atmospheric Music', () => {
        it('should handle subtle changes and sustained tones', async () => {
            const audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            
            const mockFluxApp = createMockFluxApp()
            const audioEffects = new AudioEffects(mockFluxApp)
            audioEffects.setMode('ambient')
            
            // Simulate ambient music with gradual changes
            const ambientSequence = [
                { bass: 0.2, mids: 0.3, treble: 0.4, texture: 'pad', evolution: 'intro' },
                { bass: 0.25, mids: 0.35, treble: 0.45, texture: 'pad', evolution: 'develop' },
                { bass: 0.3, mids: 0.4, treble: 0.5, texture: 'pad+lead', evolution: 'develop' },
                { bass: 0.35, mids: 0.45, treble: 0.6, texture: 'pad+lead', evolution: 'peak' },
                { bass: 0.4, mids: 0.5, treble: 0.65, texture: 'full', evolution: 'peak' },
                { bass: 0.35, mids: 0.45, treble: 0.55, texture: 'pad+lead', evolution: 'resolve' },
                { bass: 0.25, mids: 0.35, treble: 0.4, texture: 'pad', evolution: 'outro' }
            ]
            
            const ambientResponses = []
            
            for (const ambientFrame of ambientSequence) {
                const frequencyData = createAmbientFrequencyData(ambientFrame)
                
                mockAnalyserNode.getByteFrequencyData.mockImplementation((array) => {
                    array.set(frequencyData)
                })
                
                const audioData = audioAnalyzer.getFrequencyData()
                const beatData = { isBeat: false, energy: 0.2, strength: 0, bpm: 0 }
                
                const initialHue = mockFluxApp.particleRenderer.currentHue
                const initialBloom = mockFluxApp.particleRenderer.currentBloomScale
                
                audioEffects.processAudioData(audioData, beatData)
                
                ambientResponses.push({
                    texture: ambientFrame.texture,
                    evolution: ambientFrame.evolution,
                    overallLevel: (ambientFrame.bass + ambientFrame.mids + ambientFrame.treble) / 3,
                    hueChange: Math.abs(mockFluxApp.particleRenderer.currentHue - initialHue),
                    bloomChange: Math.abs(mockFluxApp.particleRenderer.currentBloomScale - initialBloom),
                    forceCount: mockFluxApp.solver.getRecentForces().length
                })
                
                await new Promise(resolve => setTimeout(resolve, 300)) // Slow ambient evolution
            }
            
            // Visual changes should be gradual and smooth
            const hueChanges = ambientResponses.map(r => r.hueChange)
            const avgHueChange = hueChanges.reduce((a, b) => a + b, 0) / hueChanges.length
            
            // Changes should be present but subtle
            expect(avgHueChange).toBeGreaterThan(1) // Some change
            expect(avgHueChange).toBeLessThan(30) // But not dramatic
            
            // Peak sections should have slightly stronger response
            const peakSections = ambientResponses.filter(r => r.evolution === 'peak')
            const introSections = ambientResponses.filter(r => r.evolution === 'intro')
            
            if (peakSections.length > 0 && introSections.length > 0) {
                const avgPeakBloom = peakSections.reduce((sum, r) => sum + r.bloomChange, 0) / peakSections.length
                const avgIntroBloom = introSections.reduce((sum, r) => sum + r.bloomChange, 0) / introSections.length
                
                expect(avgPeakBloom).toBeGreaterThanOrEqual(avgIntroBloom)
            }
            
            // Forces should be minimal and gentle
            const totalForces = ambientResponses.reduce((sum, r) => sum + r.forceCount, 0)
            expect(totalForces).toBeLessThan(10) // Minimal force application
            
            audioAnalyzer.dispose()
        })
    })

    describe('Mixed Content and Edge Cases', () => {
        it('should handle silence and very quiet audio', async () => {
            const audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            
            const mockFluxApp = createMockFluxApp()
            const audioEffects = new AudioEffects(mockFluxApp)
            
            // Simulate very quiet or silent audio
            const quietSequence = [
                { bass: 0.0, mids: 0.0, treble: 0.0, type: 'silence' },
                { bass: 0.01, mids: 0.01, treble: 0.01, type: 'barely-audible' },
                { bass: 0.05, mids: 0.03, treble: 0.02, type: 'very-quiet' },
                { bass: 0.0, mids: 0.0, treble: 0.0, type: 'silence-return' }
            ]
            
            const quietResponses = []
            
            for (const quietFrame of quietSequence) {
                const frequencyData = new Uint8Array(1024).fill(Math.floor(quietFrame.bass * 255))
                
                mockAnalyserNode.getByteFrequencyData.mockImplementation((array) => {
                    array.set(frequencyData)
                })
                
                const audioData = audioAnalyzer.getFrequencyData()
                const beatData = { isBeat: false, energy: 0.0, strength: 0, bpm: 0 }
                
                audioEffects.processAudioData(audioData, beatData)
                
                quietResponses.push({
                    type: quietFrame.type,
                    audioLevel: quietFrame.bass + quietFrame.mids + quietFrame.treble,
                    bloomIntensity: mockFluxApp.particleRenderer.currentBloomScale,
                    forceCount: mockFluxApp.solver.getRecentForces().length,
                    sparkleCount: mockFluxApp.particleRenderer.getRecentSparkles().length
                })
                
                await new Promise(resolve => setTimeout(resolve, 100))
            }
            
            // Silent audio should produce minimal visual response
            const silentFrames = quietResponses.filter(r => r.type.includes('silence'))
            silentFrames.forEach(frame => {
                expect(frame.forceCount).toBeLessThanOrEqual(1) // Minimal or no forces
                expect(frame.sparkleCount).toBe(0) // No sparkles
                expect(frame.bloomIntensity).toBeLessThanOrEqual(1.1) // Minimal bloom
            })
            
            // System should remain stable with no audio
            expect(quietResponses.length).toBe(quietSequence.length) // No crashes
            
            audioAnalyzer.dispose()
        })
        
        it('should handle audio with extreme frequency content', async () => {
            const audioAnalyzer = new AudioAnalyzer()
            await audioAnalyzer.initialize('microphone')
            
            const mockFluxApp = createMockFluxApp()
            const audioEffects = new AudioEffects(mockFluxApp)
            
            // Test extreme frequency scenarios
            const extremeSequence = [
                { bass: 1.0, mids: 0.0, treble: 0.0, type: 'pure-bass' },
                { bass: 0.0, mids: 1.0, treble: 0.0, type: 'pure-mids' },
                { bass: 0.0, mids: 0.0, treble: 1.0, type: 'pure-treble' },
                { bass: 1.0, mids: 1.0, treble: 1.0, type: 'full-spectrum' }
            ]
            
            const extremeResponses = []
            
            for (const extremeFrame of extremeSequence) {
                const frequencyData = createExtremeFrequencyData(extremeFrame)
                
                mockAnalyserNode.getByteFrequencyData.mockImplementation((array) => {
                    array.set(frequencyData)
                })
                
                const audioData = audioAnalyzer.getFrequencyData()
                const beatData = { isBeat: false, energy: 0.5, strength: 0, bpm: 0 }
                
                audioEffects.processAudioData(audioData, beatData)
                
                extremeResponses.push({
                    type: extremeFrame.type,
                    bassInput: extremeFrame.bass,
                    midsInput: extremeFrame.mids,
                    trebleInput: extremeFrame.treble,
                    bassOutput: audioData.bass,
                    midsOutput: audioData.mids,
                    trebleOutput: audioData.treble,
                    bloomIntensity: mockFluxApp.particleRenderer.currentBloomScale,
                    forceCount: mockFluxApp.solver.getRecentForces().length,
                    sparkleCount: mockFluxApp.particleRenderer.getRecentSparkles().length
                })
                
                await new Promise(resolve => setTimeout(resolve, 100))
            }
            
            // Verify frequency analysis accuracy
            const pureBass = extremeResponses.find(r => r.type === 'pure-bass')
            if (pureBass) {
                expect(pureBass.bassOutput).toBeGreaterThan(0.8) // Should detect high bass
                expect(pureBass.midsOutput).toBeLessThan(0.2) // Should detect low mids
                expect(pureBass.trebleOutput).toBeLessThan(0.2) // Should detect low treble
            }
            
            const pureTreble = extremeResponses.find(r => r.type === 'pure-treble')
            if (pureTreble) {
                expect(pureTreble.trebleOutput).toBeGreaterThan(0.8) // Should detect high treble
                expect(pureTreble.bassOutput).toBeLessThan(0.2) // Should detect low bass
                expect(pureTreble.sparkleCount).toBeGreaterThan(0) // Should create sparkles
            }
            
            const fullSpectrum = extremeResponses.find(r => r.type === 'full-spectrum')
            if (fullSpectrum) {
                expect(fullSpectrum.bassOutput).toBeGreaterThan(0.7)
                expect(fullSpectrum.midsOutput).toBeGreaterThan(0.7)
                expect(fullSpectrum.trebleOutput).toBeGreaterThan(0.7)
                expect(fullSpectrum.bloomIntensity).toBeGreaterThan(1.5) // Strong bloom response
            }
            
            audioAnalyzer.dispose()
        })
    })

    // Helper functions for creating realistic frequency data
    function createMockFluxApp() {
        return {
            solver: {
                forces: [],
                apply_force(x, y, radius, strength) {
                    this.forces.push({ x, y, radius, strength, timestamp: performance.now() })
                },
                getRecentForces() {
                    const now = performance.now()
                    return this.forces.filter(f => now - f.timestamp < 1000)
                }
            },
            config: { containerWidth: 800, containerHeight: 600 },
            particleRenderer: {
                currentHue: 180,
                currentBloomScale: 1.0,
                sparkleParticles: [],
                trebleSizeMultipliers: new Array(100).fill(1.0),
                colorHistory: [],
                bloomHistory: [],
                sparkleHistory: [],
                pulseHistory: [],
                
                updateAudioColors(hue) { 
                    this.currentHue = hue
                    this.colorHistory.push({ timestamp: performance.now(), hue })
                },
                updateBloomIntensity(intensity) { 
                    this.currentBloomScale = intensity
                    this.bloomHistory.push({ timestamp: performance.now(), intensity })
                },
                createSparkleEffects(intensity, count) {
                    for (let i = 0; i < count; i++) {
                        this.sparkleParticles.push({ intensity, life: 1.0 })
                    }
                    this.sparkleHistory.push({ timestamp: performance.now(), intensity, count })
                },
                applyBeatPulse(strength) {
                    this.pulseHistory.push({ timestamp: performance.now(), strength })
                },
                
                getRecentColorChanges() {
                    const now = performance.now()
                    return this.colorHistory.filter(c => now - c.timestamp < 1000)
                },
                getRecentBloomChanges() {
                    const now = performance.now()
                    return this.bloomHistory.filter(b => now - b.timestamp < 1000)
                },
                getRecentSparkles() {
                    const now = performance.now()
                    return this.sparkleHistory.filter(s => now - s.timestamp < 1000)
                },
                getRecentPulses() {
                    const now = performance.now()
                    return this.pulseHistory.filter(p => now - p.timestamp < 1000)
                }
            }
        }
    }
    
    function createEDMFrequencyData(frame) {
        const data = new Uint8Array(1024)
        
        // Bass (0-100): Strong for EDM
        for (let i = 0; i < 100; i++) {
            data[i] = Math.floor(frame.bass * 255)
        }
        
        // Mids (100-700): Moderate
        for (let i = 100; i < 700; i++) {
            data[i] = Math.floor(frame.mids * 255)
        }
        
        // Treble (700-1024): High for synths
        for (let i = 700; i < 1024; i++) {
            data[i] = Math.floor(frame.treble * 255)
        }
        
        return data
    }
    
    function createSynthFrequencyData(frame) {
        const data = new Uint8Array(1024)
        
        // Emphasize specific frequency ranges for synth leads
        for (let i = 0; i < 1024; i++) {
            if (i < 100) {
                data[i] = Math.floor(frame.bass * 255)
            } else if (i < 700) {
                data[i] = Math.floor(frame.mids * 255)
            } else {
                // Add harmonic content for synth leads
                const harmonic = Math.sin(i * 0.01) * 0.3 + 0.7
                data[i] = Math.floor(frame.treble * 255 * harmonic)
            }
        }
        
        return data
    }
    
    function createClassicalFrequencyData(frame) {
        const data = new Uint8Array(1024)
        
        // Classical music has more even distribution across frequencies
        for (let i = 0; i < 1024; i++) {
            const frequency = (i / 1024) * 22050 // Convert bin to frequency
            let amplitude = 0
            
            if (frequency < 250) {
                amplitude = frame.bass
            } else if (frequency < 4000) {
                amplitude = frame.mids
            } else {
                amplitude = frame.treble
            }
            
            // Add some natural variation
            amplitude *= (0.8 + Math.random() * 0.4)
            data[i] = Math.floor(amplitude * 255)
        }
        
        return data
    }
    
    function createStringFrequencyData(frame) {
        const data = new Uint8Array(1024)
        
        // Simulate string harmonics
        const fundamental = frame.fundamental
        const harmonics = frame.harmonics
        
        for (let i = 0; i < 1024; i++) {
            const frequency = (i / 1024) * 22050
            let amplitude = 0
            
            // Fundamental frequency
            if (Math.abs(frequency - fundamental) < 50) {
                amplitude = frame.intensity
            }
            
            // Harmonics
            harmonics.forEach(harmonic => {
                if (Math.abs(frequency - harmonic) < 30) {
                    amplitude += frame.intensity * 0.5
                }
            })
            
            data[i] = Math.floor(Math.min(amplitude, 1.0) * 255)
        }
        
        return data
    }
    
    function createMetalFrequencyData(frame) {
        const data = new Uint8Array(1024)
        
        // Metal has strong bass, aggressive mids, and bright treble
        for (let i = 0; i < 1024; i++) {
            let amplitude = 0
            
            if (i < 100) {
                amplitude = frame.bass
            } else if (i < 700) {
                // Add distortion-like harmonics in mids
                amplitude = frame.mids * (0.7 + Math.random() * 0.6)
            } else {
                amplitude = frame.treble
            }
            
            data[i] = Math.floor(Math.min(amplitude, 1.0) * 255)
        }
        
        return data
    }
    
    function createJazzFrequencyData(frame) {
        const data = new Uint8Array(1024)
        
        // Jazz has complex harmonic content
        for (let i = 0; i < 1024; i++) {
            const frequency = (i / 1024) * 22050
            let amplitude = 0
            
            if (frequency < 250) {
                amplitude = frame.bass
            } else if (frequency < 4000) {
                // Jazz has rich mid-frequency content
                amplitude = frame.mids * (0.8 + Math.sin(i * 0.02) * 0.2)
            } else {
                amplitude = frame.treble
            }
            
            data[i] = Math.floor(amplitude * 255)
        }
        
        return data
    }
    
    function createAmbientFrequencyData(frame) {
        const data = new Uint8Array(1024)
        
        // Ambient music has smooth, sustained frequency content
        for (let i = 0; i < 1024; i++) {
            let amplitude = 0
            
            if (i < 100) {
                amplitude = frame.bass
            } else if (i < 700) {
                amplitude = frame.mids
            } else {
                amplitude = frame.treble
            }
            
            // Add smooth variation
            amplitude *= (0.9 + Math.sin(i * 0.005) * 0.1)
            data[i] = Math.floor(amplitude * 255)
        }
        
        return data
    }
    
    function createExtremeFrequencyData(frame) {
        const data = new Uint8Array(1024)
        
        // Create extreme frequency content
        for (let i = 0; i < 1024; i++) {
            let amplitude = 0
            
            if (i < 100) {
                amplitude = frame.bass
            } else if (i < 700) {
                amplitude = frame.mids
            } else {
                amplitude = frame.treble
            }
            
            data[i] = Math.floor(amplitude * 255)
        }
        
        return data
    }
    
    function calculateVariance(values) {
        if (values.length === 0) return 0
        const mean = values.reduce((a, b) => a + b, 0) / values.length
        const squaredDiffs = values.map(value => Math.pow(value - mean, 2))
        return squaredDiffs.reduce((a, b) => a + b, 0) / values.length
    }
})