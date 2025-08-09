import { FluxApplication } from "./main.js";

// Global state
let app = null;
let audioCapture = null;
let audioIntegration = null;
let multiLayerBloom = null;
let enhancedTrails = null;
let isAudioActive = false;
let isPanelOpen = false;
let isUIVisible = true;
let startTime = Date.now();
let performanceStats = {
  frameRate: 60,
  frameTime: 16.7,
};

// Global visual settings
let visualSettings = {
  animationSpeed: 1.0,
  visualIntensity: 1.0,
  theme: 'cyan',
  preset: 'calm'
};

// Simple canvas animation system
let animationId = null;
let particles = [];
let canvas = null;
let ctx = null;

// Initialize the complete system
async function initializeSystem() {
  try {
    console.log("🚀 Initializing FLUX Stable Audio Visualizer...");

    // Initialize FLUX app with WebGL/PixiJS
    try {
      app = new FluxApplication();
      await app.init();
      console.log("✅ FLUX app initialized with WebGL/PixiJS");
    } catch (webglError) {
      console.warn("⚠️ WebGL initialization failed:", webglError.message);
      console.log("🔄 Falling back to Canvas2D mode");
      app = null; // Clear failed app
    }

    // PIXI verification disabled - using fallback system
    console.log("✅ Fallback system ready");

    // Initialize fallback audio capture - DISABLED for now
    // audioCapture = new FallbackAudioCapture();
    console.log("⚠️ Audio capture disabled for now");

    // Audio integration disabled (requires FluxApplication)
    // audioIntegration = new AudioIntegration(app);
    // await audioIntegration.initialize();
    console.log(
      "⚠️ Audio integration disabled (requires FluxApplication)"
    );

    // Initialize multi-layer bloom - DISABLED to prevent blur
    // multiLayerBloom = new MultiLayerBloom(app);
    // await multiLayerBloom.initialize();
    console.log("✅ Multi-layer bloom disabled (prevents blur)");

    // Initialize enhanced trails - DISABLED to prevent errors
    // enhancedTrails = new EnhancedParticleTrails(app);
    // await enhancedTrails.initialize();

    console.log("✅ Enhanced trails initialized");

    // Initialize Canvas2D only if WebGL completely failed
    if (!app) {
      console.log("🎨 WebGL failed - using Canvas2D fallback");
      initializeVisuals();
    } else {
      console.log("🎨 WebGL/PixiJS is primary - theme changes will affect WebGL particles");
    }

    // Start monitoring
    startMonitoring();

    // Update UI
    updateUI();

    updateStatus("System initialized - Visual mode active");
    console.log("🎉 FLUX Visual Playground ready!");
    console.log("⌨️ Keyboard shortcuts: H=UI, S=Settings, F=Fullscreen, R=Reset, I=Info, C=Clear");
    console.log("🎨 Pure visual mode - no audio dependencies");
    
    // Add WebGL context loss handling
    if (app && app.canvas) {
      app.canvas.addEventListener('webglcontextlost', (event) => {
        console.warn("⚠️ WebGL context lost, preventing default");
        event.preventDefault();
      });
      
      app.canvas.addEventListener('webglcontextrestored', () => {
        console.log("✅ WebGL context restored");
      });
    }
    
  } catch (error) {
    console.error("❌ Failed to initialize system:", error);
    updateStatus("Error: " + error.message);
  }
}

// UI control functions
window.togglePanel = function () {
  isPanelOpen = !isPanelOpen;
  const panel = document.getElementById("side-panel");
  const toggle = document.getElementById("panel-toggle");

  panel.classList.toggle("open", isPanelOpen);
  toggle.textContent = isPanelOpen ? "✕" : "⚙️";
};

window.toggleUI = function () {
  isUIVisible = !isUIVisible;
  const topBar = document.getElementById("top-bar");
  const bottomBar = document.getElementById("bottom-bar");
  const panelToggle = document.getElementById("panel-toggle");
  const uiToggle = document.querySelector(".ui-toggle");

  topBar.classList.toggle("hidden", !isUIVisible);
  bottomBar.classList.toggle("hidden", !isUIVisible);
  panelToggle.style.display = isUIVisible ? "flex" : "none";

  uiToggle.textContent = isUIVisible ? "Hide UI" : "Show UI";

  // Close panel if hiding UI
  if (!isUIVisible && isPanelOpen) {
    togglePanel();
  }
};

window.changeTheme = function (theme) {
  console.log("🎨 Changing theme from", visualSettings.theme, "to", theme);
  visualSettings.theme = theme;
  
  // Add visual feedback during theme change
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) {
    themeSelect.classList.add('theme-changing');
    setTimeout(() => themeSelect.classList.remove('theme-changing'), 1000);
  }
  
  // Debug what's available
  console.log("🔍 Debug - app exists:", !!app);
  console.log("🔍 Debug - app.particleRenderer exists:", !!app?.particleRenderer);
  console.log("🔍 Debug - particleGraphics exists:", !!app?.particleRenderer?.particleGraphics);
  
  // If WebGL/PixiJS is running, update its particle colors directly
  if (app && app.particleRenderer) {
    console.log("🎨 Applying theme to WebGL/PixiJS particles");
    updateWebGLParticleColors(theme);
  } 
  // Fallback to Canvas2D if WebGL isn't available
  else if (particles && particles.length > 0) {
    console.log("🔄 Fallback: Recreating Canvas2D particles for theme:", theme);
    createParticles();
  } else {
    console.warn("⚠️ No theme system available - WebGL:", !!app?.particleRenderer, "Canvas2D:", particles?.length);
  }
  
  // Update UI to reflect theme change
  const themeDescriptions = {
    cyan: 'Cyan Theme',
    rainbow: 'Rainbow Theme',
    fire: 'Fire Theme',
    ocean: 'Ocean Theme',
    galaxy: 'Galaxy Theme'
  };
  
  // Update theme status in top bar
  const currentThemeElement = document.getElementById('current-theme');
  if (currentThemeElement) {
    currentThemeElement.textContent = themeDescriptions[theme] || 'Unknown Theme';
  }
  
  console.log("✅ Theme changed to:", theme, "-", themeDescriptions[theme]);
  updateStatus(`Theme: ${theme} active`);
};

window.applyPreset = function (preset) {
  visualSettings.preset = preset;
  console.log("🎯 Applying preset:", preset);

  // Update button states
  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  event.target.classList.add("active");

  // Apply preset settings
  const presets = {
    calm: { animationSpeed: 0.3, visualIntensity: 0.5 },
    energetic: { animationSpeed: 2.0, visualIntensity: 1.5 },
    cosmic: { animationSpeed: 1.2, visualIntensity: 1.8 },
    minimal: { animationSpeed: 0.5, visualIntensity: 0.3 }
  };

  const presetSettings = presets[preset];
  if (presetSettings) {
    // Apply settings
    visualSettings.animationSpeed = presetSettings.animationSpeed;
    visualSettings.visualIntensity = presetSettings.visualIntensity;
    
    // Apply settings to the appropriate system
    if (app && app.controlPanel && app.controlPanel.applyPreset) {
      console.log("🎨 Applying preset to FluxApplication (WebGL)");
      app.controlPanel.applyPreset(preset);
    } else {
      // Recreate particles with new settings for Canvas2D fallback
      createParticles();
    }
  }

  updateStatus(`Preset: ${preset} applied`);
};

window.showSystemInfo = function () {
  const info = {
    version: "FLUX Visual v1.0",
    mode: app ? "WebGL (PixiJS)" : "Canvas2D Fallback",
    particles: particles?.length || 0,
    theme: visualSettings.theme,
    preset: visualSettings.preset,
    performance: "Optimized"
  };
  
  console.log("🔍 System Information:", info);
  alert(`🚀 FLUX System Info\n\n📊 Version: ${info.version}\n🎮 Mode: ${info.mode}\n✨ Particles: ${info.particles}\n🎨 Theme: ${info.theme}\n🎯 Preset: ${info.preset}\n⚡ Performance: ${info.performance}`);
};

window.clearConsole = function () {
  console.clear();
  console.log("🧹 Console cleared - FLUX Visual Playground");
  updateStatus("Console cleared");
};

window.resetSystem = function () {
  console.log("🔄 Resetting visual system...");
  
  // Reset visual settings to defaults
  visualSettings = {
    animationSpeed: 1.0,
    visualIntensity: 1.0,
    theme: 'cyan',
    preset: 'calm'
  };
  
  // Reset UI controls
  document.getElementById('theme-select').value = 'cyan';
  
  // Reset preset buttons
  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.classList.remove("active");
    if (btn.textContent.includes('Calm')) {
      btn.classList.add("active");
    }
  });
  
  // Apply theme change
  changeTheme('cyan');
  
  updateStatus("System reset complete");
  console.log("✅ Visual system reset completed");
};

window.toggleFullscreen = function() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    updateStatus("Fullscreen mode activated");
  } else {
    document.exitFullscreen();
    updateStatus("Fullscreen mode deactivated");
  }
};

// Other essential functions
function updateStatus(message) {
  const statusElement = document.getElementById("audio-status");
  if (statusElement) {
    statusElement.textContent = message;
  } else {
    console.log("📊 Status:", message);
  }
}

function startMonitoring() {
  // Simplified monitoring
  console.log("📊 Monitoring started");
}

function updateUI() {
  console.log("🎨 UI updated");
}

function initializeVisuals() {
  console.log("🎨 Initializing Canvas2D fallback visual system...");
  
  // Get the canvas element
  const existingCanvas = document.getElementById('canvas');
  if (existingCanvas) {
    // Try to get 2D context from existing canvas
    ctx = existingCanvas.getContext('2d');
    if (ctx) {
      canvas = existingCanvas;
      console.log("✅ Using existing canvas for 2D fallback");
    } else {
      console.warn("⚠️ Existing canvas in use by WebGL, creating fallback");
      // Create fallback canvas
      canvas = document.createElement('canvas');
      canvas.id = 'fallback-canvas';
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.zIndex = '1';
      canvas.style.pointerEvents = 'none';
      document.body.appendChild(canvas);
      ctx = canvas.getContext('2d');
    }
  } else {
    console.error("❌ Canvas element not found!");
    return;
  }
  
  if (!ctx) {
    console.error("❌ Could not get 2D context!");
    return;
  }
  
  console.log("✅ Canvas and context ready");
  
  // Set canvas size
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Create initial particles
  createParticles();
  console.log("✅ Created", particles.length, "particles");
  
  // Start animation loop
  animate();
  console.log("🎬 Animation loop started");
}

function createParticles() {
  if (!canvas) {
    console.warn("⚠️ Canvas not ready, skipping particle creation");
    return;
  }
  
  particles = [];
  const particleCount = Math.min(100, Math.floor((canvas.width * canvas.height) / 15000)); // Adaptive count
  
  console.log("🎨 Creating", particleCount, "particles for theme:", visualSettings.theme);
  
  // Enhanced theme-specific particle properties
  const themeConfigs = {
    cyan: { 
      colors: [180, 200, 160, 220], 
      speed: 1.0, 
      glow: 15,
      trail: true,
      sparkle: false
    },
    rainbow: { 
      colors: [0, 60, 120, 180, 240, 300], 
      speed: 1.2, 
      glow: 20,
      trail: true,
      sparkle: true
    },
    fire: { 
      colors: [15, 35, 0, 45], 
      speed: 0.8, 
      glow: 25,
      trail: true,
      sparkle: false
    },
    ocean: { 
      colors: [220, 200, 240, 260], 
      speed: 0.6, 
      glow: 18,
      trail: false,
      sparkle: true
    },
    galaxy: { 
      colors: [280, 320, 260, 300], 
      speed: 1.1, 
      glow: 22,
      trail: true,
      sparkle: true
    }
  };
  
  const config = themeConfigs[visualSettings.theme] || themeConfigs.cyan;
  
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (Math.random() * 0.5 + 0.5) * config.speed * visualSettings.animationSpeed;
    
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 2 + 1,
      baseSize: Math.random() * 2 + 1,
      hue: config.colors[i % config.colors.length],
      opacity: Math.random() * 0.4 + 0.6,
      baseOpacity: Math.random() * 0.4 + 0.6,
      glow: config.glow,
      trail: config.trail,
      sparkle: config.sparkle,
      sparklePhase: Math.random() * Math.PI * 2,
      pulsePhase: Math.random() * Math.PI * 2,
      trailHistory: [],
      energy: Math.random() * visualSettings.visualIntensity
    });
  }
  
  console.log("✅ Enhanced particles created successfully");
}

// Animation loop
function animate() {
  if (!ctx || !canvas) return;
  
  // Clear canvas with fade effect
  ctx.fillStyle = 'rgba(13, 13, 13, 0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw particles
  particles.forEach((particle) => {
    // Update position
    particle.x += particle.vx;
    particle.y += particle.vy;
    
    // Wrap around screen
    if (particle.x < 0) particle.x = canvas.width;
    if (particle.x > canvas.width) particle.x = 0;
    if (particle.y < 0) particle.y = canvas.height;
    if (particle.y > canvas.height) particle.y = 0;
    
    // Draw particle
    ctx.shadowColor = `hsl(${particle.hue}, 100%, 50%)`;
    ctx.shadowBlur = particle.size * 2;
    ctx.fillStyle = `hsla(${particle.hue}, 100%, 50%, ${particle.opacity})`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });
  
  requestAnimationFrame(animate);
}

// Function to update WebGL particle colors directly
function updateWebGLParticleColors(theme) {
  if (!app || !app.particleRenderer) {
    console.warn("⚠️ WebGL particle renderer not available");
    return;
  }

  // Cyberpunk/neon theme colors
  const themeColors = {
    cyan: 0x00ffff,     // Electric cyan (classic neon)
    rainbow: null,      // Special handling for rainbow
    fire: 0xff0080,     // Hot pink/magenta (neon fire)
    ocean: 0x0080ff,    // Electric blue (neon ocean)
    galaxy: 0x8000ff    // Electric purple (neon galaxy)
  };

  // Special handling for rainbow theme
  if (theme === 'rainbow') {
    console.log(`🌈 Setting up rainbow theme with breathing effect`);
    setupRainbowTheme();
    return;
  }

  const color = themeColors[theme] || themeColors.cyan;
  console.log(`🎨 Setting WebGL particles to color: ${color.toString(16)} for theme: ${theme}`);

  // Clear any existing rainbow animation
  if (window.rainbowInterval) {
    clearInterval(window.rainbowInterval);
    window.rainbowInterval = null;
  }

  // Method 1: Direct particle graphics update
  if (app.particleRenderer.particleGraphics) {
    app.particleRenderer.particleGraphics.forEach((particle, index) => {
      if (particle && particle.visible) {
        // Clear and redraw particle with new color
        particle.clear();
        
        const radius = 4; // Base particle radius (2x bigger)
        
        // Cyberpunk/neon color variations for more distinction
        let particleColor = color;
        if (theme === 'fire') {
          // Neon fire: electric pink, hot magenta, and bright red
          const fireColors = [0xff0080, 0xff0040, 0xff4080];
          particleColor = fireColors[index % 3];
        } else if (theme === 'ocean') {
          // Electric ocean: bright blue, cyan-blue, and electric teal
          const oceanColors = [0x0080ff, 0x0099ff, 0x00ccff];
          particleColor = oceanColors[index % 3];
        } else if (theme === 'galaxy') {
          // Electric galaxy: purple, violet, and electric magenta
          const galaxyColors = [0x8000ff, 0x9933ff, 0xcc00ff];
          particleColor = galaxyColors[index % 3];
        } else if (theme === 'cyan') {
          // Electric cyan variations: cyan, bright cyan, and cyan-white
          const cyanColors = [0x00ffff, 0x40ffff, 0x80ffff];
          particleColor = cyanColors[index % 3];
        }
        
        // Outer glow
        particle.circle(0, 0, radius * 2);
        particle.fill({ color: particleColor, alpha: 0.15 });

        // Middle layer
        particle.circle(0, 0, radius * 1.5);
        particle.fill({ color: particleColor, alpha: 0.4 });

        // Core particle
        particle.circle(0, 0, radius);
        particle.fill({ color: particleColor, alpha: 0.9 });

        // Bright center
        particle.circle(0, 0, radius * 0.3);
        particle.fill({ color: 0xffffff, alpha: 0.8 });
      }
    });
    console.log("✅ WebGL particle colors updated via particleGraphics");
  }

  // Method 2: Try updateAudioColors if available
  if (app.particleRenderer.updateAudioColors) {
    // Convert hex color to HSL
    const hue = getHueFromColor(color);
    app.particleRenderer.updateAudioColors(hue, 1.0, 0.5);
    console.log("✅ WebGL particle colors updated via updateAudioColors");
  }
}

// Special rainbow theme with breathing effect
function setupRainbowTheme() {
  if (!app || !app.particleRenderer || !app.particleRenderer.particleGraphics) {
    console.warn("⚠️ WebGL particle renderer not available for rainbow theme");
    return;
  }

  // Clear any existing rainbow animation
  if (window.rainbowInterval) {
    clearInterval(window.rainbowInterval);
  }

  let hueOffset = 0;
  let breathePhase = 0;

  window.rainbowInterval = setInterval(() => {
    if (!app || !app.particleRenderer || !app.particleRenderer.particleGraphics) {
      clearInterval(window.rainbowInterval);
      return;
    }

    app.particleRenderer.particleGraphics.forEach((particle, index) => {
      if (particle && particle.visible) {
        particle.clear();
        
        const radius = 4; // Base particle radius
        
        // Calculate neon rainbow color for this particle
        const hue = (hueOffset + (index * 30)) % 360; // 30 degrees apart
        const rainbowColor = hslToHex(hue, 100, 60); // Higher lightness for neon effect
        
        // Breathing effect - particles pulse in size
        const breatheScale = 0.8 + 0.4 * Math.sin(breathePhase + index * 0.5);
        const currentRadius = radius * breatheScale;
        
        // Outer glow
        particle.circle(0, 0, currentRadius * 2);
        particle.fill({ color: rainbowColor, alpha: 0.15 });

        // Middle layer
        particle.circle(0, 0, currentRadius * 1.5);
        particle.fill({ color: rainbowColor, alpha: 0.4 });

        // Core particle
        particle.circle(0, 0, currentRadius);
        particle.fill({ color: rainbowColor, alpha: 0.9 });

        // Bright center
        particle.circle(0, 0, currentRadius * 0.3);
        particle.fill({ color: 0xffffff, alpha: 0.8 });
      }
    });

    // Update animation parameters
    hueOffset = (hueOffset + 2) % 360; // Color cycling
    breathePhase += 0.1; // Breathing speed
  }, 50); // 20 FPS animation

  console.log("✅ Rainbow theme with breathing effect activated");
}

// Helper function to convert HSL to hex color
function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return parseInt(`${f(0)}${f(8)}${f(4)}`, 16);
}

// Helper function to convert hex color to hue
function getHueFromColor(hexColor) {
  const themeHues = {
    0x00ffff: 180, // Electric cyan
    0xff0080: 320, // Hot pink/magenta
    0x0080ff: 220, // Electric blue
    0x8000ff: 280  // Electric purple
  };
  return themeHues[hexColor] || 180;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initializeSystem);

// Global access for debugging
window.app = app;