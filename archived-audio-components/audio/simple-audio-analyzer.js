/**
 * Simple Audio Analyzer - Self-contained audio processing for FLUX
 * No external dependencies, just basic Web Audio API
 */
export class SimpleAudioAnalyzer {
    constructor(options = {}) {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        this.isInitialized = false;
        this.isRunning = false;
        
        // Configuration
        this.config = {
            fftSize: options.fftSize || 2048,
            smoothingTimeConstant: options.smoothingTimeConstant || 0.8,
            minDecibels: options.minDecibels || -90,
            maxDecibels: options.maxDecibels || -10
        };
        
        // Frequency ranges (in Hz)
        this.frequencyRanges = {
            bass: { min: 20, max: 250 },
            mids: { min: 250, max: 4000 },
            treble: { min: 4000, max: 20000 }
        };
        
        // Smoothing for audio levels
        this.smoothedLevels = {
            bass: 0,
            mids: 0,
            treble: 0,
            overall: 0
        };
        
        this.smoothingFactor = 0.7;
    }
    
    /**
     * Initialize the audio analyzer
     * @returns {Promise<{success: boolean, error?: string, message?: string}>}
     */
    async initialize() {
        try {
            console.log('🎤 Initializing Simple Audio Analyzer...');
            
            // Create audio context
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                return {
                    success: false,
                    error: 'WEB_AUDIO_UNSUPPORTED',
                    message: 'Web Audio API is not supported in this browser'
                };
            }
            
            this.audioContext = new AudioContextClass();
            
            // Resume context if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
                console.log('▶️ Audio context resumed');
            }
            
            // Request microphone access
            console.log('📱 Requesting microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    sampleRate: 44100
                }
            });
            
            console.log('✅ Microphone access granted');
            
            // Create analyser node
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = this.config.fftSize;
            this.analyser.smoothingTimeConstant = this.config.smoothingTimeConstant;
            this.analyser.minDecibels = this.config.minDecibels;
            this.analyser.maxDecibels = this.config.maxDecibels;
            
            // Connect microphone to analyser
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);
            
            // Create data array
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            
            this.isInitialized = true;
            this.isRunning = true;
            
            console.log('🎵 Simple Audio Analyzer initialized successfully');
            console.log('📊 FFT Size:', this.config.fftSize);
            console.log('📊 Buffer Length:', bufferLength);
            
            return {
                success: true,
                message: 'Audio analyzer initialized successfully'
            };
            
        } catch (error) {
            console.error('❌ Failed to initialize audio analyzer:', error);
            
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
     * Get current frequency data
     * @returns {Object} Frequency analysis data
     */
    getFrequencyData() {
        if (!this.isInitialized || !this.isRunning || !this.analyser || !this.dataArray) {
            return {
                bass: 0,
                mids: 0,
                treble: 0,
                overall: 0,
                spectrum: new Array(1024).fill(0),
                timestamp: performance.now()
            };
        }
        
        try {
            // Get frequency data
            this.analyser.getByteFrequencyData(this.dataArray);
            
            // Calculate frequency ranges
            const sampleRate = this.audioContext.sampleRate;
            const nyquist = sampleRate / 2;
            const binWidth = nyquist / this.dataArray.length;
            
            // Calculate bass (20-250 Hz)
            const bassStart = Math.floor(this.frequencyRanges.bass.min / binWidth);
            const bassEnd = Math.floor(this.frequencyRanges.bass.max / binWidth);
            let bassSum = 0;
            let bassCount = 0;
            for (let i = bassStart; i <= bassEnd && i < this.dataArray.length; i++) {
                bassSum += this.dataArray[i];
                bassCount++;
            }
            const rawBass = bassCount > 0 ? (bassSum / bassCount) / 255 : 0;
            
            // Calculate mids (250-4000 Hz)
            const midsStart = Math.floor(this.frequencyRanges.mids.min / binWidth);
            const midsEnd = Math.floor(this.frequencyRanges.mids.max / binWidth);
            let midsSum = 0;
            let midsCount = 0;
            for (let i = midsStart; i <= midsEnd && i < this.dataArray.length; i++) {
                midsSum += this.dataArray[i];
                midsCount++;
            }
            const rawMids = midsCount > 0 ? (midsSum / midsCount) / 255 : 0;
            
            // Calculate treble (4000+ Hz)
            const trebleStart = Math.floor(this.frequencyRanges.treble.min / binWidth);
            const trebleEnd = this.dataArray.length - 1;
            let trebleSum = 0;
            let trebleCount = 0;
            for (let i = trebleStart; i <= trebleEnd; i++) {
                trebleSum += this.dataArray[i];
                trebleCount++;
            }
            const rawTreble = trebleCount > 0 ? (trebleSum / trebleCount) / 255 : 0;
            
            // Calculate overall
            let totalSum = 0;
            for (let i = 0; i < this.dataArray.length; i++) {
                totalSum += this.dataArray[i];
            }
            const rawOverall = (totalSum / this.dataArray.length) / 255;
            
            // Apply smoothing
            this.smoothedLevels.bass = this.smoothedLevels.bass * this.smoothingFactor + rawBass * (1 - this.smoothingFactor);
            this.smoothedLevels.mids = this.smoothedLevels.mids * this.smoothingFactor + rawMids * (1 - this.smoothingFactor);
            this.smoothedLevels.treble = this.smoothedLevels.treble * this.smoothingFactor + rawTreble * (1 - this.smoothingFactor);
            this.smoothedLevels.overall = this.smoothedLevels.overall * this.smoothingFactor + rawOverall * (1 - this.smoothingFactor);
            
            return {
                bass: this.smoothedLevels.bass,
                mids: this.smoothedLevels.mids,
                treble: this.smoothedLevels.treble,
                overall: this.smoothedLevels.overall,
                spectrum: Array.from(this.dataArray),
                raw: {
                    bass: rawBass,
                    mids: rawMids,
                    treble: rawTreble,
                    overall: rawOverall
                },
                timestamp: performance.now()
            };
            
        } catch (error) {
            console.error('Error getting frequency data:', error);
            return {
                bass: 0,
                mids: 0,
                treble: 0,
                overall: 0,
                spectrum: new Array(1024).fill(0),
                timestamp: performance.now()
            };
        }
    }
    
    /**
     * Simple beat detection based on bass energy
     * @returns {Object} Beat detection data
     */
    detectBeat() {
        const audioData = this.getFrequencyData();
        const bassLevel = audioData.bass;
        
        // Simple beat detection: bass level above threshold
        const beatThreshold = 0.3;
        const isBeat = bassLevel > beatThreshold;
        
        return {
            isBeat,
            strength: bassLevel,
            confidence: isBeat ? Math.min(bassLevel / beatThreshold, 1.0) : 0,
            timestamp: performance.now()
        };
    }
    
    /**
     * Check if audio analyzer is working
     * @returns {boolean} True if receiving audio data
     */
    isReceivingAudio() {
        const audioData = this.getFrequencyData();
        return audioData.overall > 0.01; // Threshold for detecting audio
    }
    
    /**
     * Get analyzer status
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isRunning: this.isRunning,
            isReceivingAudio: this.isReceivingAudio(),
            audioContext: this.audioContext ? {
                state: this.audioContext.state,
                sampleRate: this.audioContext.sampleRate
            } : null,
            config: this.config
        };
    }
    
    /**
     * Stop the audio analyzer
     */
    stop() {
        console.log('🛑 Stopping Simple Audio Analyzer...');
        
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
        
        console.log('✅ Simple Audio Analyzer stopped');
    }
    
    /**
     * Dispose of all resources
     */
    dispose() {
        this.stop();
    }
}