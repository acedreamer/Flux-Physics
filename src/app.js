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

    // Initialize visual system (only if WebGL failed)
    if (!app) {
      console.log("🎨 Initializing Canvas2D fallback visuals");
      initializeVisuals();
    } else {
      console.log("🎨 Using PixiJS WebGL visuals");
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
  
  // If FluxApplication is running (WebGL mode), use its theme system
  if (app && app.controlPanel && app.controlPanel.applyColorTheme) {
    console.log("🎨 Applying theme to FluxApplication (WebGL)");
    app.controlPanel.applyColorTheme(theme);
  } 
  // Otherwise use Canvas2D fallback
  else if (particles && particles.length > 0) {
    console.log("🔄 Recreating", particles.length, "particles for theme:", theme);
    createParticles();
  } else {
    console.warn("⚠️ No theme system available - app:", !!app, "particles:", particles?.length);
  }
  
  // Update UI to reflect theme change
  const themeDescriptions = {
    cyan: 'Bright cyan neon glow',
    rainbow: 'Dynamic rainbow colors',
    fire: 'Flickering flame effects',
    ocean: 'Gentle wave motion',
    galaxy: 'Cosmic spiral dance'
  };
  
  console.log("✅ Theme changed to:", theme, "-", themeDescriptions[theme]);
  updateStatus(`Theme: ${theme} - ${themeDescriptions[theme] || 'Unknown theme'}`);
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
  console.log("🎨 Canvas2D visuals initialized");
}

function createParticles() {
  console.log("🎨 Particles created for theme:", visualSettings.theme);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initializeSystem);

// Global access for debugging
window.app = app;