/**
 * Optimized Audio Analyzer - High-performance audio processing for FLUX
 * Focuses on performance and better audio reactions
 */
export class OptimizedAudioAnalyzer {
    constructor(options = {}) {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        this.isInitialized = false;
        this.isRunning = false;
        
        // Optimized configuration for better performance
        this.config = {
            fftSize: options.fftSize || 1024, // Reduced from 2048 for better performance
            smoothingTimeConstant: options.smoothingTimeConstant || 0.6, // Faster response
            minDecibels: options.minDecibels || -80, // Better sensitivity
            maxDecibels: options.maxDecibels || -10
        };
        
        // Enhanced frequency ranges for better music analysis
        this.frequencyRanges = {
            subBass: { min: 20, max: 60 },     // Sub-bass for deep impact
            bass: { min: 60, max: 250 },       // Bass for rhythm
            lowMids: { min: 250, max: 500 },   // Low mids for warmth
            mids: { min: 500, max: 2000 },     // Mids for vocals
            highMids: { min: 2000, max: 4000 }, // High mids for clarity
            treble: { min: 4000, max: 8000 },  // Treble for brightness
            highTreble: { min: 8000, max: 20000 } // High treble for sparkle
        };
        
        // Performance-optimized smoothing
        this.smoothedLevels = new Float32Array(7); // Pre-allocated for speed
        this.rawLevels = new Float32Array(7);
        this.smoothingFactor = 0.75; // Balanced smoothing
        
        // Beat detection state
        this.beatDetection = {
            history: new Float32Array(20), // Rolling history for beat detection
            historyIndex: 0,
            threshold: 0.15,
            lastBeatTime: 0,
            minBeatInterval: 100, // Minimum ms between beats
            energy: 0,
            variance: 0
        };
        
        // Performance tracking
        this.performanceStats = {
            analysisTime: 0,
            frameCount: 0,
            lastOptimization: 0
        };
        
        // Cached calculations for performance
        this.binMappings = null;
        this.spectrumCache = null;
    }
    
    async initialize() {
        try {
            console.log('🚀 Initializing Optimized Audio Analyzer...');
            
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                return {
                    success: false,
                    error: 'WEB_AUDIO_UNSUPPORTED',
                    message: 'Web Audio API is not supported in this browser'
                };
            }
            
            this.audioContext = new AudioContextClass();
            
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    sampleRate: 44100
                }
            });
            
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = this.config.fftSize;
            this.analyser.smoothingTimeConstant = this.config.smoothingTimeConstant;
            this.analyser.minDecibels = this.config.minDecibels;
            this.analyser.maxDecibels = this.config.maxDecibels;
            
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);
            
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            
            // Pre-calculate bin mappings for performance
            this.calculateBinMappings();
            
            // Initialize spectrum cache
            this.spectrumCache = new Float32Array(bufferLength);
            
            this.isInitialized = true;
            this.isRunning = true;
            
            console.log('✅ Optimized Audio Analyzer initialized');
            console.log('📊 FFT Size:', this.config.fftSize, '(optimized for performance)');
            console.log('📊 Buffer Length:', bufferLength);
            
            return {
                success: true,
                message: 'Optimized audio analyzer initialized successfully'
            };
            
        } catch (error) {
            console.error('❌ Failed to initialize optimized audio analyzer:', error);
            
            let errorMessage = 'Failed to initialize audio analyzer';
            let errorCode = 'INITIALIZATION_FAILED';
            
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Microphone access denied. Please grant microphone permissions.';
                errorCode = 'MICROPHONE_PERMISSION_DENIED';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'No microphone found. Please connect an audio input device.';
                errorCode = 'NO_MICROPHONE_DEVICE';
            }
            
            return {
                success: false,
                error: errorCode,
                message: errorMessage
            };
        }
    }
    
    /**
     * Pre-calculate frequency bin mappings for performance
     */
    calculateBinMappings() {
        const sampleRate = this.audioContext.sampleRate;
        const nyquist = sampleRate / 2;
        const binWidth = nyquist / this.dataArray.length;
        
        this.binMappings = {};
        let rangeIndex = 0;
        
        for (const [rangeName, range] of Object.entries(this.frequencyRanges)) {
            const startBin = Math.floor(range.min / binWidth);
            const endBin = Math.min(Math.floor(range.max / binWidth), this.dataArray.length - 1);
            
            this.binMappings[rangeName] = {
                startBin,
                endBin,
                binCount: endBin - startBin + 1,
                rangeIndex
            };
            rangeIndex++;
        }
    }
    
    /**
     * High-performance frequency data analysis
     */
    getFrequencyData() {
        if (!this.isInitialized || !this.isRunning || !this.analyser || !this.dataArray) {
            return this.getEmptyData();
        }
        
        const startTime = performance.now();
        
        try {
            // Get frequency data
            this.analyser.getByteFrequencyData(this.dataArray);
            
            // Fast frequency range calculation using pre-calculated mappings
            let rangeIndex = 0;
            for (const [rangeName, mapping] of Object.entries(this.binMappings)) {
                let sum = 0;
                for (let i = mapping.startBin; i <= mapping.endBin; i++) {
                    sum += this.dataArray[i];
                }
                this.rawLevels[rangeIndex] = (sum / mapping.binCount) / 255;
                rangeIndex++;
            }
            
            // Apply optimized smoothing
            for (let i = 0; i < this.rawLevels.length; i++) {
                this.smoothedLevels[i] = this.smoothedLevels[i] * this.smoothingFactor + 
                                       this.rawLevels[i] * (1 - this.smoothingFactor);
            }
            
            // Calculate overall level efficiently
            const overall = (this.smoothedLevels[0] + this.smoothedLevels[1] + 
                           this.smoothedLevels[2] + this.smoothedLevels[3] + 
                           this.smoothedLevels[4] + this.smoothedLevels[5] + 
                           this.smoothedLevels[6]) / 7;
            
            // Update performance stats
            this.performanceStats.analysisTime = performance.now() - startTime;
            this.performanceStats.frameCount++;
            
            return {
                // Enhanced frequency data
                subBass: this.smoothedLevels[0],
                bass: this.smoothedLevels[1],
                lowMids: this.smoothedLevels[2],
                mids: this.smoothedLevels[3],
                highMids: this.smoothedLevels[4],
                treble: this.smoothedLevels[5],
                highTreble: this.smoothedLevels[6],
                overall,
                
                // Legacy compatibility
                bass: this.smoothedLevels[1], // Map to bass for compatibility
                mids: this.smoothedLevels[3], // Map to mids for compatibility
                treble: this.smoothedLevels[5], // Map to treble for compatibility
                
                // Raw data for advanced processing
                raw: {
                    subBass: this.rawLevels[0],
                    bass: this.rawLevels[1],
                    lowMids: this.rawLevels[2],
                    mids: this.rawLevels[3],
                    highMids: this.rawLevels[4],
                    treble: this.rawLevels[5],
                    highTreble: this.rawLevels[6]
                },
                
                spectrum: Array.from(this.dataArray),
                timestamp: performance.now(),
                analysisTime: this.performanceStats.analysisTime
            };
            
        } catch (error) {
            console.error('Error in optimized frequency analysis:', error);
            return this.getEmptyData();
        }
    }
    
    /**
     * Enhanced beat detection with better accuracy
     */
    detectBeat() {
        const audioData = this.getFrequencyData();
        const now = performance.now();
        
        // Use bass and sub-bass for beat detection
        const beatEnergy = (audioData.subBass * 0.7) + (audioData.bass * 0.3);
        
        // Update energy history
        this.beatDetection.history[this.beatDetection.historyIndex] = beatEnergy;
        this.beatDetection.historyIndex = (this.beatDetection.historyIndex + 1) % this.beatDetection.history.length;
        
        // Calculate average energy and variance
        let sum = 0;
        let sumSquares = 0;
        for (let i = 0; i < this.beatDetection.history.length; i++) {
            const energy = this.beatDetection.history[i];
            sum += energy;
            sumSquares += energy * energy;
        }
        
        const avgEnergy = sum / this.beatDetection.history.length;
        const variance = (sumSquares / this.beatDetection.history.length) - (avgEnergy * avgEnergy);
        
        // Adaptive threshold based on variance
        const adaptiveThreshold = avgEnergy + (Math.sqrt(variance) * 1.5);
        
        // Beat detection logic
        const isBeat = beatEnergy > adaptiveThreshold && 
                      beatEnergy > this.beatDetection.threshold &&
                      (now - this.beatDetection.lastBeatTime) > this.beatDetection.minBeatInterval;
        
        if (isBeat) {
            this.beatDetection.lastBeatTime = now;
        }
        
        // Calculate beat strength and confidence
        const strength = Math.min(beatEnergy / Math.max(adaptiveThreshold, 0.1), 2.0);
        const confidence = isBeat ? Math.min(strength, 1.0) : 0;
        
        return {
            isBeat,
            strength,
            confidence,
            energy: beatEnergy,
            threshold: adaptiveThreshold,
            variance: Math.sqrt(variance),
            timestamp: now
        };
    }
    
    /**
     * Get enhanced audio features for better reactions
     */
    getAudioFeatures() {
        const audioData = this.getFrequencyData();
        const beatData = this.detectBeat();
        
        // Calculate spectral features
        const spectralCentroid = this.calculateSpectralCentroid();
        const spectralRolloff = this.calculateSpectralRolloff();
        const spectralFlux = this.calculateSpectralFlux();
        
        // Calculate energy distribution
        const totalEnergy = audioData.subBass + audioData.bass + audioData.lowMids + 
                           audioData.mids + audioData.highMids + audioData.treble + audioData.highTreble;
        
        const energyDistribution = totalEnergy > 0 ? {
            subBass: audioData.subBass / totalEnergy,
            bass: audioData.bass / totalEnergy,
            lowMids: audioData.lowMids / totalEnergy,
            mids: audioData.mids / totalEnergy,
            highMids: audioData.highMids / totalEnergy,
            treble: audioData.treble / totalEnergy,
            highTreble: audioData.highTreble / totalEnergy
        } : {
            subBass: 0, bass: 0, lowMids: 0, mids: 0, highMids: 0, treble: 0, highTreble: 0
        };
        
        return {
            ...audioData,
            beat: beatData,
            spectral: {
                centroid: spectralCentroid,
                rolloff: spectralRolloff,
                flux: spectralFlux,
                brightness: spectralCentroid / 22050 // Normalized brightness
            },
            energy: {
                total: totalEnergy,
                distribution: energyDistribution,
                dominant: this.getDominantFrequencyRange(audioData)
            },
            dynamics: {
                range: this.calculateDynamicRange(),
                rms: this.calculateRMS(),
                peak: Math.max(...Object.values(audioData.raw))
            }
        };
    }
    
    /**
     * Calculate spectral centroid (brightness measure)
     */
    calculateSpectralCentroid() {
        if (!this.dataArray) return 0;
        
        let weightedSum = 0;
        let magnitudeSum = 0;
        const sampleRate = this.audioContext.sampleRate;
        const binWidth = (sampleRate / 2) / this.dataArray.length;
        
        for (let i = 1; i < this.dataArray.length; i++) { // Skip DC component
            const frequency = i * binWidth;
            const magnitude = this.dataArray[i] / 255;
            weightedSum += frequency * magnitude;
            magnitudeSum += magnitude;
        }
        
        return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
    }
    
    /**
     * Calculate spectral rolloff (frequency below which 85% of energy is contained)
     */
    calculateSpectralRolloff() {
        if (!this.dataArray) return 0;
        
        let totalEnergy = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            totalEnergy += this.dataArray[i];
        }
        
        const threshold = totalEnergy * 0.85;
        let cumulativeEnergy = 0;
        
        for (let i = 0; i < this.dataArray.length; i++) {
            cumulativeEnergy += this.dataArray[i];
            if (cumulativeEnergy >= threshold) {
                const sampleRate = this.audioContext.sampleRate;
                const binWidth = (sampleRate / 2) / this.dataArray.length;
                return i * binWidth;
            }
        }
        
        return 0;
    }
    
    /**
     * Calculate spectral flux (measure of how quickly the spectrum is changing)
     */
    calculateSpectralFlux() {
        if (!this.spectrumCache) return 0;
        
        let flux = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            const current = this.dataArray[i] / 255;
            const previous = this.spectrumCache[i];
            const diff = current - previous;
            flux += diff > 0 ? diff : 0; // Only positive changes
            this.spectrumCache[i] = current; // Update cache
        }
        
        return flux / this.dataArray.length;
    }
    
    /**
     * Calculate dynamic range
     */
    calculateDynamicRange() {
        const levels = [this.smoothedLevels[0], this.smoothedLevels[1], this.smoothedLevels[2], 
                       this.smoothedLevels[3], this.smoothedLevels[4], this.smoothedLevels[5], 
                       this.smoothedLevels[6]];
        const max = Math.max(...levels);
        const min = Math.min(...levels);
        return max - min;
    }
    
    /**
     * Calculate RMS (Root Mean Square) energy
     */
    calculateRMS() {
        let sumSquares = 0;
        for (let i = 0; i < this.smoothedLevels.length; i++) {
            sumSquares += this.smoothedLevels[i] * this.smoothedLevels[i];
        }
        return Math.sqrt(sumSquares / this.smoothedLevels.length);
    }
    
    /**
     * Get dominant frequency range
     */
    getDominantFrequencyRange(audioData) {
        const ranges = ['subBass', 'bass', 'lowMids', 'mids', 'highMids', 'treble', 'highTreble'];
        let maxValue = 0;
        let dominantRange = 'bass';
        
        ranges.forEach(range => {
            if (audioData[range] > maxValue) {
                maxValue = audioData[range];
                dominantRange = range;
            }
        });
        
        return dominantRange;
    }
    
    /**
     * Get empty data structure
     */
    getEmptyData() {
        return {
            subBass: 0, bass: 0, lowMids: 0, mids: 0, 
            highMids: 0, treble: 0, highTreble: 0, overall: 0,
            raw: { subBass: 0, bass: 0, lowMids: 0, mids: 0, 
                  highMids: 0, treble: 0, highTreble: 0 },
            spectrum: new Array(512).fill(0),
            timestamp: performance.now(),
            analysisTime: 0
        };
    }
    
    /**
     * Get performance statistics
     */
    getPerformanceStats() {
        return {
            ...this.performanceStats,
            averageAnalysisTime: this.performanceStats.analysisTime,
            framesProcessed: this.performanceStats.frameCount
        };
    }
    
    /**
     * Stop the analyzer
     */
    stop() {
        console.log('🛑 Stopping Optimized Audio Analyzer...');
        
        this.isRunning = false;
        
        if (this.microphone) {
            this.microphone.disconnect();
            this.microphone = null;
        }
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.analyser = null;
        this.dataArray = null;
        this.isInitialized = false;
        
        console.log('✅ Optimized Audio Analyzer stopped');
    }
    
    dispose() {
        this.stop();
    }
}