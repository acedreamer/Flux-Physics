/**
 * FLUX Audio Debug Script
 * Simple script to test if audio reactive system is working
 */

import { AudioAnalyzer } from './src/audio/core/audio-analyzer.js';

class AudioDebugger {
    constructor() {
        this.audioAnalyzer = null;
        this.isRunning = false;
        this.debugInterval = null;
    }

    async init() {
        console.log('🔧 Starting FLUX Audio Debug...');
        
        try {
            // Initialize audio analyzer
            this.audioAnalyzer = new AudioAnalyzer({
                fftSize: 2048,
                smoothingTimeConstant: 0.8,
                frequencyRanges: {
                    bass: { min: 20, max: 250, weight: 1.0 },
                    mids: { min: 250, max: 4000, weight: 1.0 },
                    treble: { min: 4000, max: 20000, weight: 1.0 }
                }
            });

            console.log('📱 Requesting microphone access...');
            const result = await this.audioAnalyzer.initialize('microphone');
            
            if (result.success) {
                console.log('✅ Audio analyzer initialized successfully');
                console.log('🎤 Source:', result.source);
                console.log('🔄 Using Web Worker:', result.usingWebWorker);
                
                this.startDebugging();
            } else {
                console.error('❌ Failed to initialize audio analyzer:', result.message);
                console.log('💡 Error details:', result);
            }
            
        } catch (error) {
            console.error('❌ Audio debug initialization failed:', error);
        }
    }

    startDebugging() {
        console.log('🎵 Starting audio level monitoring...');
        console.log('🔊 Play some music and watch the console for audio levels');
        
        this.isRunning = true;
        this.debugInterval = setInterval(() => {
            this.checkAudioLevels();
        }, 100); // Check every 100ms
    }

    checkAudioLevels() {
        if (!this.audioAnalyzer || !this.isRunning) return;

        try {
            const audioData = this.audioAnalyzer.getFrequencyData();
            
            // Log audio levels every second (10 intervals of 100ms)
            if (Date.now() % 1000 < 100) {
                console.log('🎵 Audio Levels:', {
                    bass: audioData.bass.toFixed(3),
                    mids: audioData.mids.toFixed(3),
                    treble: audioData.treble.toFixed(3),
                    overall: audioData.overall.toFixed(3),
                    timestamp: new Date().toLocaleTimeString()
                });

                // Check if we're getting any audio
                if (audioData.overall > 0.01) {
                    console.log('✅ Audio detected! System is working.');
                } else {
                    console.log('⚠️  No audio detected. Check:');
                    console.log('   - Is music playing?');
                    console.log('   - Is microphone unmuted?');
                    console.log('   - Are microphone permissions granted?');
                }

                // Show spectrum data sample
                const spectrumSample = audioData.spectrum.slice(0, 10);
                console.log('📊 Spectrum sample (first 10 bins):', spectrumSample);
            }

        } catch (error) {
            console.error('❌ Error checking audio levels:', error);
        }
    }

    stop() {
        console.log('🛑 Stopping audio debug...');
        this.isRunning = false;
        
        if (this.debugInterval) {
            clearInterval(this.debugInterval);
            this.debugInterval = null;
        }

        if (this.audioAnalyzer) {
            this.audioAnalyzer.dispose();
            this.audioAnalyzer = null;
        }
    }
}

// Auto-start debugging when script loads
const debugger = new AudioDebugger();

// Make it available globally for manual control
window.audioDebugger = debugger;

// Auto-start
debugger.init();

// Stop after 30 seconds to prevent spam
setTimeout(() => {
    console.log('⏰ Auto-stopping debug after 30 seconds');
    debugger.stop();
}, 30000);

console.log('💡 Manual controls:');
console.log('   - window.audioDebugger.stop() - Stop debugging');
console.log('   - window.audioDebugger.init() - Restart debugging');