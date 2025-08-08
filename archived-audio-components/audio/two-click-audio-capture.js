/**
 * Two-Click Audio Capture System
 * Provides a user-friendly two-click flow with clear instructions before requesting audio permissions
 */

export class TwoClickAudioCapture {
    constructor() {
        this.isReadyToCapture = false;
        this.captureButton = null;
        this.instructionsPanel = null;
        this.onAudioCaptured = null;
        this.onError = null;
        this.isIntegratedMode = false;
        this.originalButtonHandler = null;
        
        // Browser compatibility detection
        this.browserInfo = this.detectBrowser();
        this.isAudioSupported = this.checkAudioSupport();
        
        // UI elements
        this.setupUI();
    }
    
    /**
     * Detect browser type and version
     */
    detectBrowser() {
        const userAgent = navigator.userAgent;
        const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
        const isEdge = /Edg/.test(userAgent);
        const isFirefox = /Firefox/.test(userAgent);
        const isWaterfox = /Waterfox/.test(userAgent);
        const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
        
        return {
            isChrome,
            isEdge,
            isFirefox,
            isWaterfox,
            isSafari,
            name: isChrome ? 'Chrome' : isEdge ? 'Edge' : isFirefox ? 'Firefox' : isWaterfox ? 'Waterfox' : isSafari ? 'Safari' : 'Unknown',
            supportsSystemAudio: isChrome || isEdge
        };
    }
    
    /**
     * Check if system audio capture is supported
     */
    checkAudioSupport() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
            return false;
        }
        
        // Chrome and Edge have the best support for system audio
        return this.browserInfo.supportsSystemAudio;
    }
    
    /**
     * Setup the UI elements for the two-click flow
     * This integrates with existing FLUX audio module if available
     */
    setupUI() {
        // Check if FLUX audio module already exists
        const existingModule = document.querySelector('.flux-audio-module');
        if (existingModule) {
            // Integrate with existing module instead of creating new button
            this.integrateWithExistingModule(existingModule);
            return;
        }
        
        // Create capture button only if no existing module
        this.captureButton = document.createElement('button');
        this.captureButton.id = 'captureButton';
        this.captureButton.textContent = 'Start Audio Visualization';
        this.captureButton.className = 'flux-audio-button';
        
        // Create instructions panel (initially hidden)
        this.instructionsPanel = document.createElement('div');
        this.instructionsPanel.id = 'instructions';
        this.instructionsPanel.className = 'flux-instructions-panel';
        this.instructionsPanel.style.display = 'none';
        
        this.instructionsPanel.innerHTML = this.getInstructionsHTML();
        
        // Add styles
        this.addStyles();
        
        // Add click event listener
        this.captureButton.addEventListener('click', () => this.handleClick());
        
        // Add to DOM
        this.addToDOM();
    }
    
    /**
     * Integrate with existing FLUX audio module
     */
    integrateWithExistingModule(moduleElement) {
        console.log('🔗 Integrating two-click capture with existing FLUX audio module');
        
        // Find the existing toggle button
        const existingButton = moduleElement.querySelector('.flux-toggle-button');
        if (existingButton) {
            // Store original click handler
            this.originalButtonHandler = existingButton.onclick;
            
            // Replace with two-click handler
            existingButton.onclick = () => this.handleClick();
            
            // Use existing button as our capture button
            this.captureButton = existingButton;
            
            // Update button text to indicate two-click flow
            if (existingButton.textContent.includes('🎵')) {
                existingButton.textContent = '🎵 Start Audio';
            }
        }
        
        // Create instructions panel
        this.instructionsPanel = document.createElement('div');
        this.instructionsPanel.id = 'instructions';
        this.instructionsPanel.className = 'flux-instructions-panel';
        this.instructionsPanel.style.display = 'none';
        
        this.instructionsPanel.innerHTML = this.getInstructionsHTML();
        
        // Add styles and instructions panel to DOM
        this.addStyles();
        document.body.appendChild(this.instructionsPanel);
        
        this.isIntegratedMode = true;
        console.log('✅ Two-click capture integrated with existing FLUX audio module');
    }
    
    /**
     * Generate browser-specific instructions HTML
     */
    getInstructionsHTML() {
        const browserWarning = !this.browserInfo.supportsSystemAudio ? `
            <div class="browser-warning">
                <h4>⚠️ Browser Compatibility Notice</h4>
                <p><strong>Current Browser:</strong> ${this.browserInfo.name}</p>
                <p><strong>System Audio Support:</strong> ${this.browserInfo.supportsSystemAudio ? '✅ Supported' : '❌ Limited/Not Supported'}</p>
                ${!this.browserInfo.supportsSystemAudio ? `
                    <p><strong>Recommended:</strong> For the best audio visualization experience, please use:</p>
                    <ul>
                        <li><strong>Google Chrome</strong> (recommended)</li>
                        <li><strong>Microsoft Edge</strong></li>
                    </ul>
                    <p>You can copy this URL and open it in Chrome: <code>${window.location.href}</code></p>
                ` : ''}
            </div>
        ` : '';

        return `
            <div class="instructions-content">
                <h3>🎵 Audio Setup Instructions</h3>
                ${browserWarning}
                <div class="step-by-step">
                    <div class="step">
                        <span class="step-number">1</span>
                        <div class="step-content">
                            <strong>Start playing music</strong> in another tab or application
                            <small>(YouTube, Spotify, Apple Music, etc.)</small>
                        </div>
                    </div>
                    <div class="step">
                        <span class="step-number">2</span>
                        <div class="step-content">
                            <strong>Click "I'm Ready" below</strong> to open the permission dialog
                        </div>
                    </div>
                    <div class="step">
                        <span class="step-number">3</span>
                        <div class="step-content">
                            <strong>In the permission dialog:</strong>
                            <ul>
                                <li>Select "Entire Screen" or the tab with music</li>
                                <li><strong>✅ Check "Share system audio"</strong></li>
                                <li>Click "Share"</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="important-note">
                    <strong>Important:</strong> Make sure "Share system audio" is checked, 
                    otherwise the visualizer won't respond to your music!
                    ${!this.browserInfo.supportsSystemAudio ? '<br><br><strong>Note:</strong> Your current browser may have limited system audio support. Consider using Chrome for the best experience.' : ''}
                </div>
            </div>
        `;
    }

    /**
     * Add CSS styles for the two-click UI
     */
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .flux-audio-button {
                position: fixed;
                top: 20px;
                left: 20px;
                background: linear-gradient(135deg, #00FFFF, #0080FF);
                color: #000;
                border: none;
                padding: 12px 24px;
                border-radius: 25px;
                font-family: 'Courier New', monospace;
                font-weight: bold;
                font-size: 14px;
                cursor: pointer;
                z-index: 1000;
                box-shadow: 0 4px 15px rgba(0, 255, 255, 0.3);
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
            }
            
            .flux-audio-button:hover {
                background: linear-gradient(135deg, #00CCCC, #0066CC);
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0, 255, 255, 0.4);
            }
            
            .flux-audio-button:active {
                transform: translateY(0);
            }
            
            .flux-instructions-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(13, 13, 13, 0.95);
                border: 2px solid #00FFFF;
                border-radius: 15px;
                padding: 30px;
                max-width: 500px;
                width: 90%;
                z-index: 2000;
                font-family: 'Courier New', monospace;
                color: #00FFFF;
                backdrop-filter: blur(20px);
                box-shadow: 0 10px 40px rgba(0, 255, 255, 0.2);
                animation: slideIn 0.3s ease-out;
            }
            
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translate(-50%, -60%);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%);
                }
            }
            
            .instructions-content h3 {
                margin: 0 0 20px 0;
                text-align: center;
                color: #00FFFF;
                font-size: 18px;
            }
            
            .step-by-step {
                margin: 20px 0;
            }
            
            .step {
                display: flex;
                align-items: flex-start;
                margin: 15px 0;
                padding: 15px;
                background: rgba(0, 255, 255, 0.05);
                border-radius: 8px;
                border-left: 3px solid #00FFFF;
            }
            
            .step-number {
                background: #00FFFF;
                color: #000;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 12px;
                margin-right: 15px;
                flex-shrink: 0;
            }
            
            .step-content {
                flex: 1;
            }
            
            .step-content strong {
                color: #FFFFFF;
                display: block;
                margin-bottom: 5px;
            }
            
            .step-content small {
                color: #AAAAAA;
                font-size: 11px;
            }
            
            .step-content ul {
                margin: 8px 0 0 0;
                padding-left: 20px;
            }
            
            .step-content li {
                margin: 4px 0;
                color: #CCCCCC;
            }
            
            .important-note {
                background: rgba(255, 170, 0, 0.1);
                border: 1px solid #FFAA00;
                border-radius: 8px;
                padding: 15px;
                margin-top: 20px;
                color: #FFAA00;
                font-size: 13px;
                line-height: 1.4;
            }
            
            .important-note strong {
                color: #FFFFFF;
            }
            
            .browser-warning {
                background: rgba(255, 170, 0, 0.15);
                border: 2px solid #FFAA00;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 20px;
                color: #FFAA00;
            }
            
            .browser-warning h4 {
                margin: 0 0 10px 0;
                color: #FFFFFF;
                font-size: 14px;
            }
            
            .browser-warning p {
                margin: 8px 0;
                font-size: 12px;
                line-height: 1.4;
            }
            
            .browser-warning ul {
                margin: 8px 0;
                padding-left: 20px;
            }
            
            .browser-warning li {
                margin: 4px 0;
                font-size: 12px;
            }
            
            .browser-warning code {
                background: rgba(0, 0, 0, 0.3);
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 11px;
                color: #00FFFF;
                word-break: break-all;
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Add UI elements to the DOM
     */
    addToDOM() {
        document.body.appendChild(this.captureButton);
        document.body.appendChild(this.instructionsPanel);
    }
    
    /**
     * Handle button click events
     */
    handleClick() {
        if (!this.isReadyToCapture) {
            // First click: Show instructions
            this.showInstructions();
        } else {
            // Second click: Start capture
            this.startAudioCapture();
        }
    }
    
    /**
     * Show instructions panel and update button
     */
    showInstructions() {
        this.instructionsPanel.style.display = 'block';
        
        if (this.isIntegratedMode) {
            this.captureButton.textContent = "🎵 I'm Ready!";
            // Don't change background for integrated mode to maintain FLUX styling
        } else {
            this.captureButton.textContent = "I'm Ready! Start Capture";
            this.captureButton.style.background = 'linear-gradient(135deg, #00FF00, #00CC00)';
        }
        
        this.isReadyToCapture = true;
        
        // Add click outside to close
        setTimeout(() => {
            document.addEventListener('click', this.handleOutsideClick.bind(this), { once: true });
        }, 100);
    }
    
    /**
     * Handle clicks outside the instructions panel
     */
    handleOutsideClick(event) {
        if (!this.instructionsPanel.contains(event.target) && 
            !this.captureButton.contains(event.target)) {
            this.hideInstructions();
        }
    }
    
    /**
     * Hide instructions panel and reset button
     */
    hideInstructions() {
        this.instructionsPanel.style.display = 'none';
        
        if (this.isIntegratedMode) {
            this.captureButton.textContent = '🎵 Start Audio';
            // Don't change background for integrated mode
        } else {
            this.captureButton.textContent = 'Start Audio Visualization';
            this.captureButton.style.background = 'linear-gradient(135deg, #00FFFF, #0080FF)';
        }
        
        this.isReadyToCapture = false;
    }
    
    /**
     * Start the audio capture process
     */
    async startAudioCapture() {
        try {
            // Check browser compatibility first
            if (!this.isAudioSupported) {
                throw new Error(`System audio capture is not supported in ${this.browserInfo.name}. Please use Chrome or Edge for the best experience.`);
            }
            
            // Hide instructions
            this.instructionsPanel.style.display = 'none';
            
            // Update button to show loading state
            this.captureButton.textContent = this.isIntegratedMode ? '🎵 Requesting...' : 'Requesting Permission...';
            if (!this.isIntegratedMode) {
                this.captureButton.style.background = 'linear-gradient(135deg, #FFAA00, #FF8800)';
            }
            this.captureButton.disabled = true;
            
            // Request system audio via getDisplayMedia
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: false, // We only want audio for visualization
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    sampleRate: 44100
                }
            });
            
            // Check if audio tracks are available
            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length === 0) {
                throw new Error('No audio tracks found. Make sure "Share system audio" was checked.');
            }
            
            // Success! Update button
            this.captureButton.textContent = '🎵 Audio Active';
            if (!this.isIntegratedMode) {
                this.captureButton.style.background = 'linear-gradient(135deg, #00FF00, #00CC00)';
            }
            this.captureButton.disabled = false;
            
            // Call success callback
            if (this.onAudioCaptured) {
                this.onAudioCaptured(stream);
            }
            
            // Add stop functionality
            this.addStopFunctionality(stream);
            
        } catch (error) {
            console.error('Audio capture failed:', error);
            
            // Reset button state
            this.captureButton.textContent = this.isIntegratedMode ? '🎵 Start Audio' : 'Start Audio Visualization';
            if (!this.isIntegratedMode) {
                this.captureButton.style.background = 'linear-gradient(135deg, #00FFFF, #0080FF)';
            }
            this.captureButton.disabled = false;
            this.isReadyToCapture = false;
            
            // Show error message
            this.showErrorMessage(error);
            
            // Call error callback
            if (this.onError) {
                this.onError(error);
            }
        }
    }
    
    /**
     * Add stop functionality to the button
     */
    addStopFunctionality(stream) {
        const originalClickHandler = this.captureButton.onclick;
        
        this.captureButton.onclick = () => {
            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
            
            // Reset button
            this.captureButton.textContent = this.isIntegratedMode ? '🎵 Start Audio' : 'Start Audio Visualization';
            if (!this.isIntegratedMode) {
                this.captureButton.style.background = 'linear-gradient(135deg, #00FFFF, #0080FF)';
            }
            this.isReadyToCapture = false;
            
            // Restore original click handler
            this.captureButton.onclick = originalClickHandler;
            
            console.log('Audio capture stopped');
        };
    }
    
    /**
     * Show error message to user
     */
    showErrorMessage(error) {
        const errorPanel = document.createElement('div');
        errorPanel.className = 'flux-error-panel';
        
        const browserSpecificHelp = !this.browserInfo.supportsSystemAudio ? `
            <div class="browser-specific-help">
                <h4>🌐 Browser Compatibility Issue</h4>
                <p><strong>Current Browser:</strong> ${this.browserInfo.name}</p>
                <p><strong>Issue:</strong> Your browser has limited system audio capture support.</p>
                <p><strong>Solution:</strong> For the best experience, please:</p>
                <ol>
                    <li>Copy this URL: <code>${window.location.href}</code></li>
                    <li>Open <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong></li>
                    <li>Paste the URL and try again</li>
                </ol>
            </div>
        ` : '';
        
        errorPanel.innerHTML = `
            <div class="error-content">
                <h3>❌ Audio Setup Failed</h3>
                <p><strong>Error:</strong> ${error.message}</p>
                ${browserSpecificHelp}
                <div class="error-help">
                    <h4>Common Solutions:</h4>
                    <ul>
                        <li>Make sure music is playing in another tab</li>
                        <li>Check "Share system audio" in the permission dialog</li>
                        ${this.browserInfo.supportsSystemAudio ? '' : '<li><strong>Use Chrome or Edge browser for system audio support</strong></li>'}
                        <li>Make sure you're not using an incognito/private window</li>
                        <li>Refresh the page and try again</li>
                    </ul>
                </div>
                <button onclick="this.parentElement.parentElement.remove()">Try Again</button>
            </div>
        `;
        
        // Add error panel styles
        const errorStyle = document.createElement('style');
        errorStyle.textContent = `
            .flux-error-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 0, 0, 0.95);
                border: 2px solid #FF6666;
                border-radius: 15px;
                padding: 30px;
                max-width: 500px;
                width: 90%;
                z-index: 3000;
                font-family: 'Courier New', monospace;
                color: #FFFFFF;
                backdrop-filter: blur(20px);
                box-shadow: 0 10px 40px rgba(255, 0, 0, 0.3);
            }
            
            .error-content h3 {
                margin: 0 0 15px 0;
                text-align: center;
            }
            
            .error-help {
                margin: 20px 0;
                padding: 15px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 8px;
            }
            
            .error-help h4 {
                margin: 0 0 10px 0;
                color: #FFCCCC;
            }
            
            .error-help ul {
                margin: 0;
                padding-left: 20px;
            }
            
            .error-help li {
                margin: 5px 0;
            }
            
            .flux-error-panel button {
                background: #FFFFFF;
                color: #FF0000;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-family: inherit;
                font-weight: bold;
                display: block;
                margin: 20px auto 0;
            }
            
            .browser-specific-help {
                background: rgba(255, 170, 0, 0.2);
                border: 1px solid #FFAA00;
                border-radius: 8px;
                padding: 15px;
                margin: 15px 0;
                color: #FFAA00;
            }
            
            .browser-specific-help h4 {
                margin: 0 0 10px 0;
                color: #FFFFFF;
            }
            
            .browser-specific-help p {
                margin: 8px 0;
                font-size: 13px;
            }
            
            .browser-specific-help ol {
                margin: 8px 0;
                padding-left: 20px;
            }
            
            .browser-specific-help li {
                margin: 4px 0;
                font-size: 13px;
            }
            
            .browser-specific-help code {
                background: rgba(0, 0, 0, 0.4);
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 11px;
                color: #00FFFF;
                word-break: break-all;
            }
        `;
        
        document.head.appendChild(errorStyle);
        document.body.appendChild(errorPanel);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorPanel.parentElement) {
                errorPanel.remove();
            }
        }, 10000);
    }
    
    /**
     * Set callback for successful audio capture
     */
    onSuccess(callback) {
        this.onAudioCaptured = callback;
        return this;
    }
    
    /**
     * Set callback for audio capture errors
     */
    onFailure(callback) {
        this.onError = callback;
        return this;
    }
    
    /**
     * Clean up UI elements
     */
    destroy() {
        if (this.captureButton && this.captureButton.parentElement) {
            this.captureButton.remove();
        }
        if (this.instructionsPanel && this.instructionsPanel.parentElement) {
            this.instructionsPanel.remove();
        }
    }
}

/**
 * Connect captured audio stream to audio visualizer
 * This function integrates with the existing FLUX audio system
 */
export function connectStreamToAudioVisualizer(stream, fluxApp) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        
        // Configure analyser for optimal visualization
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;
        analyser.minDecibels = -90;
        analyser.maxDecibels = -10;
        
        source.connect(analyser);
        
        // If FLUX app has audio analyzer, connect it
        if (fluxApp && fluxApp.audioAnalyzer) {
            fluxApp.audioAnalyzer.connectAnalyser(analyser);
            console.log('✅ Audio stream connected to FLUX visualizer');
        }
        
        // Enable audio reactive mode in particle renderer
        if (fluxApp && fluxApp.particleRenderer) {
            fluxApp.particleRenderer.enableAudioReactive();
            console.log('✅ Audio reactive particle rendering enabled');
        }
        
        return { audioContext, source, analyser };
        
    } catch (error) {
        console.error('Failed to connect audio stream to visualizer:', error);
        throw error;
    }
}