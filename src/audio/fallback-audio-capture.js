/**
 * Fallback Audio Capture System
 * Tries system audio first, falls back to microphone if not supported
 */

export class FallbackAudioCapture {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.stream = null;
        this.isInitialized = false;
        this.captureMethod = null; // 'system' or 'microphone'
        
        // Browser compatibility detection
        this.browserInfo = this.detectBrowser();
        
        console.log('🎤 Fallback Audio Capture initialized');
    }
    
    /**
     * Detect browser capabilities
     */
    detectBrowser() {
        const userAgent = navigator.userAgent;
        const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
        const isEdge = /Edg/.test(userAgent);
        const isFirefox = /Firefox/.test(userAgent);
        const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
        
        return {
            isChrome,
            isEdge,
            isFirefox,
            isSafari,
            name: isChrome ? 'Chrome' : isEdge ? 'Edge' : isFirefox ? 'Firefox' : isSafari ? 'Safari' : 'Unknown',
            supportsSystemAudio: isChrome || isEdge,
            supportsGetDisplayMedia: !!navigator.mediaDevices?.getDisplayMedia
        };
    }
    
    /**
     * Initialize audio capture with fallback strategy
     */
    async initialize() {
        try {
            console.log('🚀 Initializing fallback audio capture...');
            
            // Create audio context
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                throw new Error('Web Audio API is not supported in this browser');
            }
            
            this.audioContext = new AudioContextClass();
            
            // Resume context if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Try system audio first, then fallback to microphone
            const result = await this.trySystemAudioFirst();
            
            if (result.success) {
                this.setupAnalyser(result.stream);
                this.isInitialized = true;
                
                console.log(`✅ Audio capture initialized using ${this.captureMethod}`);
                return {
                    success: true,
                    method: this.captureMethod,
                    message: `Audio capture ready using ${this.captureMethod}`
                };
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error('❌ Failed to initialize audio capture:', error);
            return {
                success: false,
                error: error.message,
                message: 'Failed to initialize audio capture: ' + error.message
            };
        }
    }
    
    /**
     * Try system audio first, fallback to microphone
     */
    async trySystemAudioFirst() {
        // First attempt: System audio via getDisplayMedia
        if (this.browserInfo.supportsGetDisplayMedia && this.browserInfo.supportsSystemAudio) {
            try {
                console.log('🖥️ Attempting system audio capture...');
                
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: false,
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false,
                        sampleRate: 44100
                    }
                });
                
                // Check if audio tracks are available
                const audioTracks = stream.getAudioTracks();
                if (audioTracks.length > 0) {
                    this.stream = stream;
                    this.captureMethod = 'system';
                    console.log('✅ System audio capture successful');
                    return { success: true, stream };
                } else {
                    // No audio tracks, try microphone
                    stream.getTracks().forEach(track => track.stop());
                    throw new Error('No audio tracks in system capture');
                }
                
            } catch (error) {
                console.warn('⚠️ System audio capture failed:', error.message);
                // Continue to microphone fallback
            }
        } else {
            console.log('ℹ️ System audio not supported, trying microphone...');
        }
        
        // Second attempt: Microphone audio
        try {
            console.log('🎤 Attempting microphone capture...');
            
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    sampleRate: 44100
                }
            });
            
            this.stream = stream;
            this.captureMethod = 'microphone';
            console.log('✅ Microphone capture successful');
            return { success: true, stream };
            
        } catch (error) {
            console.error('❌ Microphone capture failed:', error);
            
            let errorMessage = 'Failed to access audio input';
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Microphone access denied. Please grant microphone permissions and try again.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'No microphone found. Please connect an audio input device.';
            } else if (error.name === 'NotSupportedError') {
                errorMessage = 'Audio capture is not supported in this browser or context.';
            }
            
            return { success: false, error: errorMessage };
        }
    }
    
    /**
     * Setup audio analyser
     */
    setupAnalyser(stream) {
        // Create analyser node
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.8;
        this.analyser.minDecibels = -90;
        this.analyser.maxDecibels = -10;
        
        // Create source from stream
        this.source = this.audioContext.createMediaStreamSource(stream);
        this.source.connect(this.analyser);
        
        console.log('🔊 Audio analyser setup complete');
    }
    
    /**
     * Get frequency data
     */
    getFrequencyData() {
        if (!this.isInitialized || !this.analyser) {
            return this.getEmptyData();
        }
        
        try {
            const bufferLength = this.analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            this.analyser.getByteFrequencyData(dataArray);
            
            // Calculate frequency ranges
            const sampleRate = this.audioContext.sampleRate;
            const nyquist = sampleRate / 2;
            const binWidth = nyquist / bufferLength;
            
            // Bass (20-250 Hz)
            const bassStart = Math.floor(20 / binWidth);
            const bassEnd = Math.floor(250 / binWidth);
            let bassSum = 0;
            for (let i = bassStart; i <= bassEnd && i < bufferLength; i++) {
                bassSum += dataArray[i];
            }
            const bass = (bassSum / (bassEnd - bassStart + 1)) / 255;
            
            // Mids (250-4000 Hz)
            const midsStart = Math.floor(250 / binWidth);
            const midsEnd = Math.floor(4000 / binWidth);
            let midsSum = 0;
            for (let i = midsStart; i <= midsEnd && i < bufferLength; i++) {
                midsSum += dataArray[i];
            }
            const mids = (midsSum / (midsEnd - midsStart + 1)) / 255;
            
            // Treble (4000+ Hz)
            const trebleStart = Math.floor(4000 / binWidth);
            const trebleEnd = bufferLength - 1;
            let trebleSum = 0;
            for (let i = trebleStart; i <= trebleEnd; i++) {
                trebleSum += dataArray[i];
            }
            const treble = (trebleSum / (trebleEnd - trebleStart + 1)) / 255;
            
            // Overall
            let totalSum = 0;
            for (let i = 0; i < bufferLength; i++) {
                totalSum += dataArray[i];
            }
            const overall = (totalSum / bufferLength) / 255;
            
            return {
                bass,
                mids,
                treble,
                overall,
                spectrum: Array.from(dataArray),
                captureMethod: this.captureMethod,
                timestamp: performance.now()
            };
            
        } catch (error) {
            console.warn('Error getting frequency data:', error);
            return this.getEmptyData();
        }
    }
    
    /**
     * Get empty data structure
     */
    getEmptyData() {
        return {
            bass: 0,
            mids: 0,
            treble: 0,
            overall: 0,
            spectrum: new Array(1024).fill(0),
            captureMethod: this.captureMethod || 'none',
            timestamp: performance.now()
        };
    }
    
    /**
     * Check if receiving audio
     */
    isReceivingAudio() {
        const data = this.getFrequencyData();
        return data.overall > 0.01;
    }
    
    /**
     * Get capture method
     */
    getCaptureMethod() {
        return this.captureMethod;
    }
    
    /**
     * Get status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            captureMethod: this.captureMethod,
            isReceivingAudio: this.isReceivingAudio(),
            browserInfo: this.browserInfo,
            audioContext: this.audioContext ? {
                state: this.audioContext.state,
                sampleRate: this.audioContext.sampleRate
            } : null
        };
    }
    
    /**
     * Stop audio capture
     */
    stop() {
        console.log('🛑 Stopping fallback audio capture...');
        
        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.analyser = null;
        this.isInitialized = false;
        this.captureMethod = null;
        
        console.log('✅ Fallback audio capture stopped');
    }
    
    /**
     * Dispose of all resources
     */
    dispose() {
        this.stop();
    }
}