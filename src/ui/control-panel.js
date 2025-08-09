/**
 * Interactive Control Panel for FLUX Physics Playground
 * Provides real-time controls for physics, visuals, and audio
 */

export class ControlPanel {
  constructor(fluxApp) {
    this.fluxApp = fluxApp;
    this.isVisible = true; // Make visible by default
    this.panel = null;
    this.createControlPanel();
    this.setupEventListeners();
    console.log('🎛️ Control panel created and should be visible');
  }

  createControlPanel() {
    // Create main panel container
    this.panel = document.createElement('div');
    this.panel.id = 'flux-control-panel';
    this.panel.innerHTML = `
      <div class="control-header">
        <h3>🎛️ FLUX Controls</h3>
        <button id="toggle-panel" class="toggle-btn">−</button>
      </div>
      
      <div class="control-sections">
        <!-- Physics Controls -->
        <div class="control-section">
          <h4>⚡ Physics</h4>
          <div class="control-group">
            <label>Particle Count: <span id="particle-count-value">800</span></label>
            <input type="range" id="particle-count" min="100" max="2000" value="800" step="50">
          </div>
          <div class="control-group">
            <label>Gravity: <span id="gravity-value">0.5</span></label>
            <input type="range" id="gravity" min="0" max="2" value="0.5" step="0.1">
          </div>
          <div class="control-group">
            <label>Damping: <span id="damping-value">0.99</span></label>
            <input type="range" id="damping" min="0.9" max="1.0" value="0.99" step="0.01">
          </div>
        </div>

        <!-- Visual Controls -->
        <div class="control-section">
          <h4>✨ Visuals</h4>
          <div class="control-group">
            <label>Bloom Intensity: <span id="bloom-value">1.0</span></label>
            <input type="range" id="bloom-intensity" min="0" max="3" value="1.0" step="0.1">
          </div>
          <div class="control-group">
            <label>Particle Size: <span id="size-value">1.0</span></label>
            <input type="range" id="particle-size" min="0.5" max="2.0" value="1.0" step="0.1">
          </div>
          <div class="control-group">
            <label>Color Theme:</label>
            <select id="color-theme">
              <option value="cyan">Cyan Neon</option>
              <option value="flux">⚡ Flux Field</option>
              <option value="fire">Fire</option>
              <option value="ocean">Ocean</option>
              <option value="galaxy">Galaxy</option>
            </select>
          </div>
        </div>

        <!-- Audio Controls -->
        <div class="control-section">
          <h4>🎵 Audio</h4>
          <div class="control-group">
            <button id="toggle-audio" class="audio-btn">Enable Audio</button>
          </div>
          <div class="control-group">
            <label>Audio Sensitivity: <span id="audio-sens-value">1.0</span></label>
            <input type="range" id="audio-sensitivity" min="0.1" max="3.0" value="1.0" step="0.1">
          </div>
        </div>

        <!-- Presets -->
        <div class="control-section">
          <h4>🎯 Presets</h4>
          <div class="preset-buttons">
            <button class="preset-btn" data-preset="calm">Calm</button>
            <button class="preset-btn" data-preset="energetic">Energetic</button>
            <button class="preset-btn" data-preset="cosmic">Cosmic</button>
            <button class="preset-btn" data-preset="minimal">Minimal</button>
          </div>
        </div>
      </div>
    `;

    // Add CSS styles
    this.addStyles();
    
    // Add to document
    document.body.appendChild(this.panel);
    
    // Make sure it's visible
    this.panel.style.display = 'block';
    this.panel.style.visibility = 'visible';
    this.panel.style.opacity = '1';
    
    // Debug: Log panel creation
    console.log('🎛️ Control panel DOM element created:', this.panel);
    console.log('🎛️ Panel added to body, children count:', document.body.children.length);
    console.log('🎛️ Panel in DOM:', document.body.contains(this.panel));
    
    // Wait a moment then check computed styles
    setTimeout(() => {
      const computed = window.getComputedStyle(this.panel);
      console.log('🎛️ Panel computed styles:', {
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
        position: computed.position,
        top: computed.top,
        right: computed.right,
        zIndex: computed.zIndex,
        width: computed.width,
        height: computed.height
      });
      console.log('🎛️ Panel bounding rect:', this.panel.getBoundingClientRect());
    }, 100);
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #flux-control-panel {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 280px;
        background: rgba(13, 13, 13, 0.98);
        /* Temporary bright border for visibility testing */
        border: 3px solid #00ffff !important;
        border: 1px solid #00ffff;
        border-radius: 12px;
        color: #00ffff;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        z-index: 9999;
        backdrop-filter: blur(10px);
        box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
        transition: transform 0.3s ease;
      }

      .control-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid #00ffff33;
        background: rgba(0, 255, 255, 0.1);
        border-radius: 12px 12px 0 0;
      }

      .control-header h3 {
        margin: 0;
        font-size: 14px;
        text-shadow: 0 0 10px #00ffff;
      }

      .toggle-btn {
        background: none;
        border: 1px solid #00ffff;
        color: #00ffff;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .toggle-btn:hover {
        background: rgba(0, 255, 255, 0.2);
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
      }

      .control-sections {
        padding: 16px;
        max-height: 500px;
        overflow-y: auto;
      }

      .control-section {
        margin-bottom: 20px;
      }

      .control-section h4 {
        margin: 0 0 12px 0;
        font-size: 13px;
        color: #ffffff;
        text-shadow: 0 0 8px #00ffff;
      }

      .control-group {
        margin-bottom: 12px;
      }

      .control-group label {
        display: block;
        margin-bottom: 4px;
        font-size: 11px;
      }

      input[type="range"] {
        width: 100%;
        height: 4px;
        background: #333;
        border-radius: 2px;
        outline: none;
        -webkit-appearance: none;
      }

      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        background: #00ffff;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.7);
      }

      select {
        width: 100%;
        background: rgba(0, 0, 0, 0.7);
        border: 1px solid #00ffff;
        color: #00ffff;
        padding: 6px;
        border-radius: 4px;
        font-size: 11px;
      }

      .audio-btn, .preset-btn {
        background: rgba(0, 255, 255, 0.1);
        border: 1px solid #00ffff;
        color: #00ffff;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 11px;
        transition: all 0.2s ease;
      }

      .audio-btn:hover, .preset-btn:hover {
        background: rgba(0, 255, 255, 0.3);
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
      }

      .preset-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .control-sections::-webkit-scrollbar {
        width: 6px;
      }

      .control-sections::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 3px;
      }

      .control-sections::-webkit-scrollbar-thumb {
        background: #00ffff;
        border-radius: 3px;
      }

      /* Collapsed state */
      #flux-control-panel.collapsed .control-sections {
        display: none;
      }

      #flux-control-panel.collapsed {
        width: auto;
      }
    `;
    document.head.appendChild(style);
  }

  setupEventListeners() {
    // Toggle panel visibility
    document.getElementById('toggle-panel').addEventListener('click', () => {
      this.panel.classList.toggle('collapsed');
      const btn = document.getElementById('toggle-panel');
      btn.textContent = this.panel.classList.contains('collapsed') ? '+' : '−';
    });

    // Physics controls
    this.setupRangeControl('particle-count', 'particle-count-value', (value) => {
      this.fluxApp.setParticleCount(parseInt(value));
    });

    this.setupRangeControl('gravity', 'gravity-value', (value) => {
      // Implement gravity control
      console.log('Gravity:', value);
    });

    this.setupRangeControl('damping', 'damping-value', (value) => {
      // Implement damping control
      console.log('Damping:', value);
    });

    // Visual controls
    this.setupRangeControl('bloom-intensity', 'bloom-value', (value) => {
      if (this.fluxApp.particleRenderer) {
        this.fluxApp.particleRenderer.updateBloomIntensity(parseFloat(value));
      }
    });

    this.setupRangeControl('particle-size', 'size-value', (value) => {
      // Implement particle size control
      console.log('Particle size:', value);
    });

    // Color theme selector
    document.getElementById('color-theme').addEventListener('change', (e) => {
      this.applyColorTheme(e.target.value);
    });

    // Audio controls
    document.getElementById('toggle-audio').addEventListener('click', () => {
      this.toggleAudio();
    });

    this.setupRangeControl('audio-sensitivity', 'audio-sens-value', (value) => {
      if (this.fluxApp.audioState) {
        this.fluxApp.audioState.sensitivity = parseFloat(value);
      }
    });

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.applyPreset(btn.dataset.preset);
      });
    });
  }

  setupRangeControl(sliderId, valueId, callback) {
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);
    
    slider.addEventListener('input', (e) => {
      const value = e.target.value;
      valueDisplay.textContent = value;
      callback(value);
    });
  }

  applyColorTheme(theme) {
    const themes = {
      cyan: { hue: 180, sat: 1.0, light: 0.5 },
      flux: { hue: 180, sat: 1.0, light: 0.5 },
      fire: { hue: 15, sat: 1.0, light: 0.6 },
      ocean: { hue: 200, sat: 0.8, light: 0.4 },
      galaxy: { hue: 280, sat: 0.9, light: 0.5 }
    };

    const themeData = themes[theme];
    if (this.fluxApp.particleRenderer && themeData) {
      this.fluxApp.particleRenderer.updateAudioColors(themeData.hue, themeData.sat, themeData.light);
    }
  }

  startRainbowMode() {
    let hue = 0;
    const rainbowInterval = setInterval(() => {
      if (this.fluxApp.particleRenderer) {
        this.fluxApp.particleRenderer.updateAudioColors(hue, 1.0, 0.5);
        hue = (hue + 2) % 360;
      }
    }, 50);

    // Store interval to clear later if needed
    this.rainbowInterval = rainbowInterval;
  }

  toggleAudio() {
    const btn = document.getElementById('toggle-audio');
    if (this.fluxApp.audioReactiveEnabled) {
      this.fluxApp.disableAudioReactive();
      btn.textContent = 'Enable Audio';
      btn.style.background = 'rgba(0, 255, 255, 0.1)';
    } else {
      this.fluxApp.enableAudioReactive();
      btn.textContent = 'Disable Audio';
      btn.style.background = 'rgba(0, 255, 255, 0.3)';
    }
  }

  applyPreset(preset) {
    const presets = {
      calm: {
        particleCount: 400,
        gravity: 0.2,
        damping: 0.98,
        bloomIntensity: 0.8,
        theme: 'ocean'
      },
      energetic: {
        particleCount: 1200,
        gravity: 0.8,
        damping: 0.95,
        bloomIntensity: 2.0,
        theme: 'fire'
      },
      cosmic: {
        particleCount: 800,
        gravity: 0.5,
        damping: 0.99,
        bloomIntensity: 1.5,
        theme: 'galaxy'
      },
      minimal: {
        particleCount: 200,
        gravity: 0.3,
        damping: 0.99,
        bloomIntensity: 0.5,
        theme: 'cyan'
      }
    };

    const presetData = presets[preset];
    if (presetData) {
      // Apply preset values to controls
      document.getElementById('particle-count').value = presetData.particleCount;
      document.getElementById('gravity').value = presetData.gravity;
      document.getElementById('damping').value = presetData.damping;
      document.getElementById('bloom-intensity').value = presetData.bloomIntensity;
      document.getElementById('color-theme').value = presetData.theme;

      // Trigger change events
      document.getElementById('particle-count').dispatchEvent(new Event('input'));
      document.getElementById('gravity').dispatchEvent(new Event('input'));
      document.getElementById('damping').dispatchEvent(new Event('input'));
      document.getElementById('bloom-intensity').dispatchEvent(new Event('input'));
      document.getElementById('color-theme').dispatchEvent(new Event('change'));

      console.log(`🎯 Applied ${preset} preset`);
    }
  }

  show() {
    this.panel.style.display = 'block';
    this.isVisible = true;
  }

  hide() {
    this.panel.style.display = 'none';
    this.isVisible = false;
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }
}