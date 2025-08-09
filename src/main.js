import * as PIXI from 'pixi.js'
import { AdvancedBloomFilter } from '@pixi/filter-advanced-bloom'
import { OptimizedAudioAnalyzer } from "./audio/optimized-audio-analyzer.js";
import { EnhancedAudioEffects } from "./audio/enhanced-audio-effects.js";
import { setupFluxAudioModule } from "./audio/core/flux-audio-module.js";
import { AudioExample } from "./audio/examples/audio-example.js";
import { AudioOptimizer } from "./audio/optimization/audio-optimizer.js";
import { AudioValidationSuite } from "./audio/validation/audio-validation-suite.js";
import {
  TwoClickAudioCapture,
  connectStreamToAudioVisualizer,
} from "./audio/two-click-audio-capture.js";
// Enhanced features will be embedded directly to avoid CORS issues

// FLUX Physics Playground
// Main entry point for our physics simulation

// Global diagnostic function - available immediately
window.diagnoseSliders = function() {
  console.log('🔍 DIAGNOSING ALL SLIDERS...');
  
  const sliders = [
    'particle-count',
    'gravity', 
    'damping',
    'bloom-intensity',
    'particle-size',
    'audio-sensitivity'
  ];
  
  sliders.forEach(sliderId => {
    const slider = document.getElementById(sliderId);
    const display = document.getElementById(sliderId + '-value');
    
    console.log(`\n📊 ${sliderId}:`);
    console.log(`  - Slider exists: ${!!slider}`);
    console.log(`  - Display exists: ${!!display}`);
    
    if (slider) {
      console.log(`  - Current value: ${slider.value}`);
      console.log(`  - Min: ${slider.min}, Max: ${slider.max}`);
      console.log(`  - Disabled: ${slider.disabled}`);
      
      // Try to manually trigger the slider
      const oldValue = slider.value;
      slider.value = parseFloat(slider.max) * 0.7; // Set to 70% of max
      slider.dispatchEvent(new Event('input'));
      console.log(`  - Test: Changed from ${oldValue} to ${slider.value}`);
    }
    
    if (display) {
      console.log(`  - Display text: "${display.textContent}"`);
    }
  });
  
  console.log('\n🎛️ Control Panel Object:');
  if (typeof window.app !== 'undefined' && window.app && window.app.controlPanel) {
    console.log('  - Control panel exists: ✅');
    console.log('  - Panel visible:', window.app.controlPanel.isVisible);
    console.log('  - Panel element in DOM:', document.body.contains(window.app.controlPanel.panel));
  } else {
    console.log('  - Control panel exists: ❌');
    console.log('  - App exists:', typeof window.app !== 'undefined');
  }
};

// Global test function - available immediately  
window.fixSliders = function() {
  console.log('🔧 ATTEMPTING TO FIX SLIDERS...');
  
  // Find all range inputs
  const sliders = document.querySelectorAll('input[type="range"]');
  console.log(`Found ${sliders.length} sliders`);
  
  sliders.forEach(slider => {
    const sliderId = slider.id;
    const displayId = sliderId + '-value';
    const display = document.getElementById(displayId);
    
    console.log(`🔧 Fixing slider: ${sliderId}`);
    
    // Remove existing event listeners by cloning the element
    const newSlider = slider.cloneNode(true);
    slider.parentNode.replaceChild(newSlider, slider);
    
    // Add new event listener
    newSlider.addEventListener('input', function(e) {
      const value = e.target.value;
      console.log(`🎛️ ${sliderId} changed to: ${value}`);
      
      // Update display
      if (display) {
        display.textContent = value;
      }
      
      // Apply the change based on slider type
      if (sliderId === 'particle-count') {
        console.log('Applying particle count:', value);
        if (window.setParticleCount) {
          window.setParticleCount(parseInt(value));
        }
      } else if (sliderId === 'bloom-intensity') {
        console.log('Applying bloom intensity:', value);
        // Direct bloom application
        if (window.app && window.app.particleRenderer && window.app.particleRenderer.container) {
          const filters = window.app.particleRenderer.container.filters;
          if (filters && filters.length > 0) {
            const bloomFilter = filters.find(f => f.constructor.name.includes('Bloom'));
            if (bloomFilter) {
              bloomFilter.bloomScale = parseFloat(value);
              console.log('✅ Bloom applied directly');
            }
          }
        }
      } else if (sliderId === 'particle-size') {
        console.log('Applying particle size:', value);
        // Direct size application
        if (window.app && window.app.particleRenderer && window.app.particleRenderer.particleGraphics) {
          const size = parseFloat(value);
          window.app.particleRenderer.particleGraphics.forEach(particle => {
            if (particle && particle.visible) {
              particle.scale.set(size);
            }
          });
          console.log('✅ Particle size applied directly');
        }
      } else if (sliderId === 'gravity') {
        console.log('Gravity slider moved to:', value);
        // Store gravity value
        if (window.app) {
          window.app.gravityStrength = parseFloat(value);
        }
      } else if (sliderId === 'damping') {
        console.log('Damping slider moved to:', value);
        // Store damping value
        if (window.app) {
          window.app.dampingFactor = parseFloat(value);
        }
      }
    });
    
    console.log(`✅ Fixed slider: ${sliderId}`);
  });
  
  console.log('🎉 Slider fix attempt completed');
};

// Create a simple working control panel if the main one fails
window.createSimpleControls = function() {
  console.log('🎛️ Creating simple backup controls...');
  
  // Remove existing simple controls if any
  const existing = document.getElementById('simple-controls');
  if (existing) {
    document.body.removeChild(existing);
  }
  
  const controls = document.createElement('div');
  controls.id = 'simple-controls';
  controls.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 250px;
    background: rgba(0, 0, 0, 0.9);
    border: 2px solid #00ff00;
    border-radius: 10px;
    padding: 15px;
    color: #00ff00;
    font-family: monospace;
    font-size: 12px;
    z-index: 10000;
  `;
  
  controls.innerHTML = `
    <h3 style="margin: 0 0 15px 0; text-align: center;">🎛️ Simple Controls</h3>
    
    <div style="margin-bottom: 10px;">
      <label>Particles: <span id="simple-particles-val">800</span></label><br>
      <input type="range" id="simple-particles" min="100" max="1500" value="800" style="width: 100%;">
    </div>
    
    <div style="margin-bottom: 10px;">
      <label>Bloom: <span id="simple-bloom-val">1.0</span></label><br>
      <input type="range" id="simple-bloom" min="0" max="3" value="1.0" step="0.1" style="width: 100%;">
    </div>
    
    <div style="margin-bottom: 10px;">
      <label>Size: <span id="simple-size-val">1.0</span></label><br>
      <input type="range" id="simple-size" min="0.5" max="2" value="1.0" step="0.1" style="width: 100%;">
    </div>
    
    <div style="margin-bottom: 10px;">
      <label>Gravity: <span id="simple-gravity-val">0.5</span></label><br>
      <input type="range" id="simple-gravity" min="0" max="2" value="0.5" step="0.1" style="width: 100%;">
    </div>
    
    <button onclick="document.body.removeChild(document.getElementById('simple-controls'))" 
            style="width: 100%; padding: 5px; background: #ff0000; color: white; border: none; border-radius: 3px; cursor: pointer; margin-top: 10px;">
      Close
    </button>
  `;
  
  document.body.appendChild(controls);
  
  // Add event listeners
  ['particles', 'bloom', 'size', 'gravity'].forEach(type => {
    const slider = document.getElementById(`simple-${type}`);
    const display = document.getElementById(`simple-${type}-val`);
    
    if (slider && display) {
      slider.addEventListener('input', function(e) {
        const value = e.target.value;
        display.textContent = value;
        console.log(`🎛️ Simple ${type} changed to: ${value}`);
        
        // Apply changes
        if (type === 'particles' && window.setParticleCount) {
          window.setParticleCount(parseInt(value));
        } else if (type === 'bloom' && window.app && window.app.particleRenderer) {
          // Apply bloom directly
          const filters = window.app.particleRenderer.container?.filters;
          if (filters) {
            const bloomFilter = filters.find(f => f.constructor.name.includes('Bloom'));
            if (bloomFilter) {
              bloomFilter.bloomScale = parseFloat(value);
            }
          }
        } else if (type === 'size' && window.app && window.app.particleRenderer) {
          // Apply size directly
          const size = parseFloat(value);
          window.app.particleRenderer.particleGraphics?.forEach(particle => {
            if (particle && particle.visible) {
              particle.scale.set(size);
            }
          });
        } else if (type === 'gravity' && window.app) {
          window.app.gravityStrength = parseFloat(value);
        }
      });
    }
  });
  
  console.log('✅ Simple controls created');
};

// Test if sliders can be moved and check for CSS issues
window.testSliderMovement = function() {
  console.log('🧪 Testing slider movement...');
  
  const sliders = ['particle-count', 'gravity', 'damping', 'bloom-intensity', 'particle-size'];
  
  sliders.forEach(sliderId => {
    const slider = document.getElementById(sliderId);
    if (slider) {
      console.log(`\n🎛️ Testing ${sliderId}:`);
      
      // Check CSS properties
      const computed = window.getComputedStyle(slider);
      console.log(`  - Pointer events: ${computed.pointerEvents}`);
      console.log(`  - Z-index: ${computed.zIndex}`);
      console.log(`  - Position: ${computed.position}`);
      console.log(`  - Display: ${computed.display}`);
      console.log(`  - Visibility: ${computed.visibility}`);
      console.log(`  - Opacity: ${computed.opacity}`);
      
      // Check if slider is disabled
      console.log(`  - Disabled: ${slider.disabled}`);
      console.log(`  - ReadOnly: ${slider.readOnly}`);
      
      // Try to move slider programmatically
      const originalValue = slider.value;
      const testValue = parseFloat(slider.max) * 0.6;
      
      console.log(`  - Original value: ${originalValue}`);
      console.log(`  - Attempting to set to: ${testValue}`);
      
      slider.value = testValue;
      console.log(`  - New value after setting: ${slider.value}`);
      
      // Trigger events
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      slider.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Check if value actually changed
      if (slider.value == testValue) {
        console.log(`  - ✅ Slider value changed successfully`);
      } else {
        console.log(`  - ❌ Slider value did not change`);
      }
      
      // Reset to original value
      slider.value = originalValue;
    } else {
      console.log(`❌ Slider ${sliderId} not found`);
    }
  });
};

// Force enable all sliders by removing any blocking CSS
window.forceEnableSliders = function() {
  console.log('🔧 Force enabling all sliders...');
  
  const sliders = document.querySelectorAll('input[type="range"]');
  console.log(`Found ${sliders.length} sliders to fix`);
  
  sliders.forEach((slider, index) => {
    console.log(`Fixing slider ${index + 1}: ${slider.id}`);
    
    // Remove any blocking properties
    slider.disabled = false;
    slider.readOnly = false;
    
    // Force CSS properties
    slider.style.pointerEvents = 'auto';
    slider.style.zIndex = '1000';
    slider.style.position = 'relative';
    slider.style.cursor = 'pointer';
    slider.style.opacity = '1';
    slider.style.visibility = 'visible';
    slider.style.display = 'block';
    
    // Add a bright border to make it visible
    slider.style.border = '2px solid #ff0000';
    slider.style.height = '25px';
    
    console.log(`✅ Fixed slider: ${slider.id}`);
  });
  
  console.log('🎉 All sliders force-enabled with red borders');
};

// Specifically fix physics sliders
window.fixPhysicsSliders = function() {
  console.log('🔧 Specifically fixing physics sliders...');
  
  const physicsSliders = ['gravity', 'damping'];
  
  physicsSliders.forEach(sliderId => {
    const slider = document.getElementById(sliderId);
    if (slider) {
      console.log(`🔧 Fixing ${sliderId} slider...`);
      
      // Get the parent elements
      const controlGroup = slider.closest('.control-group');
      const controlSection = slider.closest('.control-section');
      
      if (controlGroup) {
        console.log(`  - Found control group for ${sliderId}`);
        controlGroup.style.pointerEvents = 'auto';
        controlGroup.style.zIndex = '100';
        controlGroup.style.position = 'relative';
      }
      
      if (controlSection) {
        console.log(`  - Found control section for ${sliderId}`);
        controlSection.style.pointerEvents = 'auto';
        controlSection.style.zIndex = '50';
        controlSection.style.position = 'relative';
      }
      
      // Force the slider itself
      slider.style.pointerEvents = 'auto !important';
      slider.style.zIndex = '1000';
      slider.style.position = 'relative';
      slider.style.cursor = 'pointer';
      slider.style.background = '#ff0000'; // Red background to see it
      slider.style.height = '30px';
      slider.style.border = '3px solid #ffff00'; // Yellow border
      slider.style.borderRadius = '5px';
      
      // Remove and re-add to DOM to reset any issues
      const parent = slider.parentNode;
      const nextSibling = slider.nextSibling;
      parent.removeChild(slider);
      parent.insertBefore(slider, nextSibling);
      
      console.log(`✅ ${sliderId} slider fixed with red background and yellow border`);
    } else {
      console.log(`❌ ${sliderId} slider not found`);
    }
  });
  
  console.log('🎉 Physics sliders specifically fixed');
};

// Test the control panel toggle button
window.testToggleButton = function() {
  console.log('🧪 Testing control panel toggle button...');
  
  const toggleBtn = document.getElementById('toggle-panel');
  const panel = document.getElementById('flux-control-panel');
  
  console.log('Toggle button found:', !!toggleBtn);
  console.log('Panel found:', !!panel);
  
  if (toggleBtn) {
    console.log('Button text:', toggleBtn.textContent);
    console.log('Button click handler exists:', typeof toggleBtn.onclick);
    
    // Try to click it programmatically
    console.log('Attempting to click button...');
    toggleBtn.click();
  }
  
  if (panel) {
    console.log('Panel classes:', panel.className);
    console.log('Panel has minimized class:', panel.classList.contains('minimized'));
  }
};

// Force fix the toggle button with obvious styling
window.fixToggleButton = function() {
  console.log('🔧 Fixing toggle button with obvious styling...');
  
  const toggleBtn = document.getElementById('toggle-panel');
  const panel = document.getElementById('flux-control-panel');
  
  if (!toggleBtn || !panel) {
    console.log('❌ Button or panel not found');
    return;
  }
  
  // Make the button VERY obvious
  toggleBtn.style.cssText = `
    background: #ff0000 !important;
    color: #ffffff !important;
    border: 3px solid #ffff00 !important;
    width: 40px !important;
    height: 40px !important;
    font-size: 20px !important;
    font-weight: bold !important;
    cursor: pointer !important;
    border-radius: 50% !important;
    z-index: 10000 !important;
    position: relative !important;
    pointer-events: auto !important;
  `;
  
  // Remove existing event listeners by cloning
  const newToggleBtn = toggleBtn.cloneNode(true);
  toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
  
  // Apply the same obvious styling to the new button
  newToggleBtn.style.cssText = toggleBtn.style.cssText;
  
  // Set initial state
  let isMinimized = panel.classList.contains('minimized');
  newToggleBtn.textContent = isMinimized ? '+' : '−';
  
  // Add new event listener
  newToggleBtn.addEventListener('click', function() {
    console.log('🖱️ BIG RED TOGGLE BUTTON CLICKED!');
    
    isMinimized = !isMinimized;
    
    if (isMinimized) {
      panel.classList.add('minimized');
      newToggleBtn.textContent = '+';
      console.log('🔽 Panel minimized');
    } else {
      panel.classList.remove('minimized');
      newToggleBtn.textContent = '−';
      console.log('🔼 Panel expanded');
    }
  });
  
  console.log('✅ Toggle button fixed with BIG RED STYLING - impossible to miss!');
};

// Create a completely new, working toggle button if the original is broken
window.createNewToggleButton = function() {
  console.log('🔧 Creating brand new toggle button...');
  
  const panel = document.getElementById('flux-control-panel');
  if (!panel) {
    console.log('❌ Panel not found');
    return;
  }
  
  // Remove any existing toggle button
  const existingBtn = document.getElementById('toggle-panel');
  if (existingBtn) {
    existingBtn.remove();
  }
  
  // Create new button
  const newBtn = document.createElement('button');
  newBtn.id = 'toggle-panel-new';
  newBtn.textContent = '+';
  newBtn.style.cssText = `
    position: fixed !important;
    top: 30px !important;
    right: 30px !important;
    background: #ff0000 !important;
    color: #ffffff !important;
    border: 4px solid #ffff00 !important;
    width: 50px !important;
    height: 50px !important;
    font-size: 24px !important;
    font-weight: bold !important;
    cursor: pointer !important;
    border-radius: 50% !important;
    z-index: 10001 !important;
    pointer-events: auto !important;
    box-shadow: 0 0 20px rgba(255, 0, 0, 0.8) !important;
  `;
  
  // Add to document
  document.body.appendChild(newBtn);
  
  // Set initial state
  let isMinimized = panel.classList.contains('minimized');
  
  // Add event listener
  newBtn.addEventListener('click', function() {
    console.log('🖱️ NEW RED BUTTON CLICKED!');
    
    isMinimized = !isMinimized;
    
    if (isMinimized) {
      panel.classList.add('minimized');
      newBtn.textContent = '+';
      console.log('🔽 Panel minimized');
    } else {
      panel.classList.remove('minimized');
      newBtn.textContent = '−';
      console.log('🔼 Panel expanded');
    }
  });
  
  console.log('✅ Created NEW RED TOGGLE BUTTON - floating on screen, impossible to miss!');
};

// Create completely new physics sliders if the originals are broken
window.createNewPhysicsSliders = function() {
  console.log('🔧 Creating brand new physics sliders...');
  
  // Remove any existing new sliders
  const existing = document.getElementById('new-physics-sliders');
  if (existing) {
    document.body.removeChild(existing);
  }
  
  const newSliders = document.createElement('div');
  newSliders.id = 'new-physics-sliders';
  newSliders.style.cssText = `
    position: fixed;
    top: 100px;
    left: 20px;
    width: 200px;
    background: rgba(255, 0, 0, 0.9);
    border: 3px solid #ffff00;
    border-radius: 10px;
    padding: 15px;
    color: #ffffff;
    font-family: monospace;
    font-size: 12px;
    z-index: 10000;
  `;
  
  newSliders.innerHTML = `
    <h3 style="margin: 0 0 15px 0; text-align: center;">⚡ New Physics</h3>
    
    <div style="margin-bottom: 15px;">
      <label>Gravity: <span id="new-gravity-val">0.5</span></label><br>
      <input type="range" id="new-gravity" min="0" max="2" value="0.5" step="0.1" 
             style="width: 100%; height: 25px; cursor: pointer; background: #333;">
    </div>
    
    <div style="margin-bottom: 15px;">
      <label>Damping: <span id="new-damping-val">0.99</span></label><br>
      <input type="range" id="new-damping" min="0.9" max="1.0" value="0.99" step="0.01"
             style="width: 100%; height: 25px; cursor: pointer; background: #333;">
    </div>
    
    <button onclick="document.body.removeChild(document.getElementById('new-physics-sliders'))" 
            style="width: 100%; padding: 5px; background: #000; color: #fff; border: 1px solid #fff; border-radius: 3px; cursor: pointer;">
      Close
    </button>
  `;
  
  document.body.appendChild(newSliders);
  
  // Add event listeners to new sliders
  const gravitySlider = document.getElementById('new-gravity');
  const gravityDisplay = document.getElementById('new-gravity-val');
  const dampingSlider = document.getElementById('new-damping');
  const dampingDisplay = document.getElementById('new-damping-val');
  
  if (gravitySlider && gravityDisplay) {
    gravitySlider.addEventListener('input', function(e) {
      const value = e.target.value;
      gravityDisplay.textContent = value;
      console.log(`🌍 New gravity slider: ${value}`);
      
      // Apply gravity effect
      if (window.app && window.app.controlPanel && window.app.controlPanel.applyGravityEffect) {
        window.app.controlPanel.applyGravityEffect(parseFloat(value));
      } else {
        console.log('Gravity effect method not available');
      }
    });
  }
  
  if (dampingSlider && dampingDisplay) {
    dampingSlider.addEventListener('input', function(e) {
      const value = e.target.value;
      dampingDisplay.textContent = value;
      console.log(`🌊 New damping slider: ${value}`);
      
      // Apply damping effect
      if (window.app && window.app.controlPanel && window.app.controlPanel.applyDampingEffect) {
        window.app.controlPanel.applyDampingEffect(parseFloat(value));
      } else {
        console.log('Damping effect method not available');
      }
    });
  }
  
  console.log('✅ New physics sliders created with red background');
};

// Fix specific sliders that won't move
window.fixStuckSliders = function() {
  console.log('🔧 Fixing stuck sliders (gravity and particle-count)...');
  
  const stuckSliders = ['gravity', 'particle-count'];
  
  stuckSliders.forEach(sliderId => {
    const slider = document.getElementById(sliderId);
    if (slider) {
      console.log(`🔧 Attempting to fix stuck slider: ${sliderId}`);
      
      // Check if slider is actually stuck
      const originalValue = slider.value;
      const testValue = parseFloat(slider.max) * 0.7;
      
      console.log(`  - Original value: ${originalValue}`);
      console.log(`  - Test value: ${testValue}`);
      
      // Try to set value
      slider.value = testValue;
      console.log(`  - Value after setting: ${slider.value}`);
      
      if (slider.value == testValue) {
        console.log(`  - ✅ ${sliderId} can be set programmatically`);
        // Reset to original
        slider.value = originalValue;
      } else {
        console.log(`  - ❌ ${sliderId} is completely stuck`);
      }
      
      // Nuclear option: completely recreate the slider
      console.log(`  - Recreating ${sliderId} slider...`);
      
      const parent = slider.parentNode;
      const label = parent.querySelector('label');
      const display = document.getElementById(sliderId + '-value');
      
      // Create new slider element
      const newSlider = document.createElement('input');
      newSlider.type = 'range';
      newSlider.id = sliderId;
      newSlider.min = slider.min;
      newSlider.max = slider.max;
      newSlider.step = slider.step;
      newSlider.value = slider.value;
      
      // Apply aggressive CSS to ensure it works
      newSlider.style.cssText = `
        width: 100% !important;
        height: 30px !important;
        background: #ff0000 !important;
        border: 3px solid #00ff00 !important;
        border-radius: 5px !important;
        cursor: pointer !important;
        pointer-events: auto !important;
        z-index: 9999 !important;
        position: relative !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      `;
      
      // Remove old slider and add new one
      parent.removeChild(slider);
      parent.appendChild(newSlider);
      
      // Add event listener to new slider
      newSlider.addEventListener('input', function(e) {
        const value = e.target.value;
        console.log(`🎛️ New ${sliderId} changed to: ${value}`);
        
        // Update display
        if (display) {
          display.textContent = value;
        }
        
        // Apply the change
        if (sliderId === 'gravity') {
          console.log('Applying gravity:', value);
          if (window.app && window.app.controlPanel && window.app.controlPanel.applyGravityEffect) {
            window.app.controlPanel.applyGravityEffect(parseFloat(value));
          }
        } else if (sliderId === 'particle-count') {
          console.log('Applying particle count:', value);
          if (window.setParticleCount) {
            window.setParticleCount(parseInt(value));
          }
        }
      });
      
      console.log(`✅ Recreated ${sliderId} with red background and green border`);
    } else {
      console.log(`❌ ${sliderId} slider not found`);
    }
  });
  
  console.log('🎉 Stuck sliders fix completed');
};

// Create a minimal test to see which sliders work
window.testAllSliders = function() {
  console.log('🧪 Testing all sliders for movement...');
  
  const allSliders = document.querySelectorAll('input[type="range"]');
  console.log(`Found ${allSliders.length} sliders to test`);
  
  allSliders.forEach((slider, index) => {
    const sliderId = slider.id || `slider-${index}`;
    console.log(`\n🎛️ Testing ${sliderId}:`);
    
    // Check if slider can be moved programmatically
    const originalValue = parseFloat(slider.value);
    const minVal = parseFloat(slider.min);
    const maxVal = parseFloat(slider.max);
    const testValue = minVal + (maxVal - minVal) * 0.6; // 60% of range
    
    console.log(`  - Original: ${originalValue}`);
    console.log(`  - Range: ${minVal} to ${maxVal}`);
    console.log(`  - Test value: ${testValue}`);
    
    // Try to set value
    slider.value = testValue;
    const newValue = parseFloat(slider.value);
    
    if (Math.abs(newValue - testValue) < 0.001) {
      console.log(`  - ✅ WORKING - Value changed to ${newValue}`);
    } else {
      console.log(`  - ❌ STUCK - Value remained ${newValue}`);
      
      // Try to identify what's blocking it
      const computed = window.getComputedStyle(slider);
      console.log(`  - CSS pointer-events: ${computed.pointerEvents}`);
      console.log(`  - CSS z-index: ${computed.zIndex}`);
      console.log(`  - Disabled: ${slider.disabled}`);
      console.log(`  - ReadOnly: ${slider.readOnly}`);
    }
    
    // Reset to original value
    slider.value = originalValue;
  });
  
  console.log('\n🎉 Slider testing completed');
};

/**
 * Embedded Control Panel for FLUX Physics Playground
 * Provides real-time controls for physics, visuals, and audio
 */
class EmbeddedControlPanel {
  constructor(fluxApp) {
    this.fluxApp = fluxApp;
    this.isVisible = true;
    this.isMinimized = true; // Start minimized by default
    this.panel = null;
    
    console.log('🎛️ Starting control panel creation...');
    this.createControlPanel();
    
    // Setup event listeners after a short delay to ensure DOM is ready
    setTimeout(() => {
      console.log('🔧 Setting up event listeners...');
      this.setupEventListeners();
      console.log('🎛️ Embedded control panel created and ready (minimized)');
    }, 300);
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
        <!-- Visual Controls -->
        <div class="control-section">
          <h4>🎨 Visual Themes</h4>
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
    
    // Make sure it's visible but start minimized
    this.panel.style.display = 'block';
    this.panel.style.visibility = 'visible';
    this.panel.style.opacity = '1';
    
    // Start in minimized state
    this.panel.classList.add('minimized');
    
    // Force a reflow to ensure proper rendering
    this.panel.offsetHeight;
    
    console.log('🎛️ Control panel DOM element created and added to body (minimized)');
    console.log('🎛️ Panel position:', this.panel.getBoundingClientRect());
    
    // Wait a moment for DOM to settle before setting up event listeners
    setTimeout(() => {
      this.verifyControlElements();
    }, 100);
  }

  addStyles() {
    // Check if styles already exist
    if (document.getElementById('flux-control-panel-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'flux-control-panel-styles';
    style.textContent = `
      #flux-control-panel {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 280px;
        background: rgba(13, 13, 13, 0.98);
        border: 3px solid #00ffff !important;
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
        pointer-events: auto; /* Ensure sections allow interaction */
        position: relative;
        z-index: 10;
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
        height: 20px; /* Increased height for better interaction */
        background: #333;
        border-radius: 2px;
        outline: none;
        -webkit-appearance: none;
        cursor: pointer;
        position: relative;
        z-index: 100; /* Ensure sliders are above other elements */
        pointer-events: auto; /* Explicitly enable pointer events */
      }

      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 20px; /* Larger thumb for easier interaction */
        height: 20px;
        background: #00ffff;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.7);
        position: relative;
        z-index: 101;
        pointer-events: auto;
      }

      input[type="range"]::-moz-range-thumb {
        width: 20px;
        height: 20px;
        background: #00ffff;
        border-radius: 50%;
        cursor: pointer;
        border: none;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.7);
      }

      input[type="range"]:hover {
        background: #444;
      }

      input[type="range"]:active {
        background: #555;
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

      /* Minimized state - hide the panel completely */
      #flux-control-panel.minimized {
        display: none;
      }



      /* Audio module spacing adjustments */
      .flux-audio-module {
        top: 20px !important;
        left: 20px !important;
      }

      .flux-status-indicator {
        margin-bottom: 15px !important;
      }

      .flux-toggle-button {
        margin-top: 5px !important;
      }

      /* Move the Start Audio button to left side */
      .audio-toggle {
        top: 80px !important;
        left: 20px !important;
        right: auto !important;
      }
    `;
    document.head.appendChild(style);
  }

  setupEventListeners() {
    try {
      console.log('🔧 Setting up control panel event listeners...');
      
      // Setup the header toggle button (when panel is expanded)
      const originalToggleBtn = document.getElementById('toggle-panel');
      if (originalToggleBtn) {
        originalToggleBtn.addEventListener('click', () => {
          console.log('🖱️ Panel header toggle clicked!');
          this.togglePanel();
        });
      }

    // Only setup reliable controls - no problematic sliders

    // Color theme selector with real-time updates
    const colorTheme = document.getElementById('color-theme');
    if (colorTheme) {
      colorTheme.addEventListener('change', (e) => {
        console.log('🎨 Real-time color theme change:', e.target.value);
        this.applyColorTheme(e.target.value);
      });
    }



      // Preset buttons
      const presetButtons = document.querySelectorAll('.preset-btn');
      if (presetButtons.length > 0) {
        presetButtons.forEach(btn => {
          btn.addEventListener('click', () => {
            this.applyPreset(btn.dataset.preset);
          });
        });
        console.log(`✅ ${presetButtons.length} preset button listeners added`);
      } else {
        console.warn('⚠️ No preset buttons found');
      }
      
      console.log('🎉 All control panel event listeners setup complete');
      
    } catch (error) {
      console.error('❌ Error setting up control panel event listeners:', error);
    }
  }

  setupRangeControl(sliderId, valueId, callback) {
    try {
      const slider = document.getElementById(sliderId);
      const valueDisplay = document.getElementById(valueId);
      
      console.log(`🔧 Setting up range control: ${sliderId}`);
      console.log(`  - Slider found: ${!!slider}`);
      console.log(`  - Display found: ${!!valueDisplay}`);
      
      if (slider && valueDisplay) {
        // Test the slider immediately
        console.log(`  - Current value: ${slider.value}`);
        console.log(`  - Min: ${slider.min}, Max: ${slider.max}, Step: ${slider.step}`);
        
        slider.addEventListener('input', (e) => {
          try {
            const value = e.target.value;
            console.log(`🎛️ ${sliderId} changed to: ${value}`);
            valueDisplay.textContent = value;
            callback(value);
          } catch (error) {
            console.error(`❌ Error in ${sliderId} callback:`, error);
          }
        });
        
        // Also add change event for when user releases slider
        slider.addEventListener('change', (e) => {
          try {
            const value = e.target.value;
            console.log(`🎛️ ${sliderId} final value: ${value}`);
            callback(value);
          } catch (error) {
            console.error(`❌ Error in ${sliderId} change callback:`, error);
          }
        });
        
        console.log(`✅ Range control setup complete: ${sliderId}`);
      } else {
        console.warn(`⚠️ Range control elements not found: ${sliderId}`);
        console.warn(`  - Slider element: ${slider}`);
        console.warn(`  - Display element: ${valueDisplay}`);
      }
    } catch (error) {
      console.error(`❌ Error setting up range control ${sliderId}:`, error);
    }
  }

  applyColorTheme(theme) {
    console.log('🎨 Applying color theme:', theme);
    
    const themes = {
      cyan: { hue: 180, sat: 1.0, light: 0.5, color: 0x00ffff },
      rainbow: { hue: 'rainbow', sat: 1.0, light: 0.5, color: null },
      fire: { hue: 15, sat: 1.0, light: 0.6, color: 0xff4500 },
      ocean: { hue: 200, sat: 0.8, light: 0.4, color: 0x0066cc },
      galaxy: { hue: 280, sat: 0.9, light: 0.5, color: 0x9966ff }
    };

    const themeData = themes[theme];
    if (!themeData) return;

    // Store current theme for consistency across modes
    this.currentTheme = theme;
    this.currentThemeData = themeData;

    if (themeData.hue === 'rainbow') {
      this.startRainbowMode();
    } else {
      // Stop rainbow mode if it's running
      if (this.rainbowInterval) {
        clearInterval(this.rainbowInterval);
        this.rainbowInterval = null;
      }
      
      // Apply color to particles in both normal and audio modes
      this.updateParticleColorsForAllModes(themeData);
    }
    
    console.log('✅ Color theme applied:', theme);
  }

  updateParticleColorsForAllModes(themeData) {
    if (!this.fluxApp.particleRenderer) return;

    // Method 1: Try audio color method (works in audio mode)
    if (this.fluxApp.particleRenderer.updateAudioColors) {
      this.fluxApp.particleRenderer.updateAudioColors(themeData.hue, themeData.sat, themeData.light);
    }
    
    // Method 2: Direct particle color update (works in normal mode)
    if (this.fluxApp.particleRenderer.particleGraphics) {
      this.updateParticleColors(themeData.color);
    }

    // Method 3: Enable audio reactive mode temporarily to apply colors
    if (this.fluxApp.particleRenderer.enableAudioReactive && !this.fluxApp.audioReactiveEnabled) {
      const wasAudioEnabled = this.fluxApp.audioReactiveEnabled;
      this.fluxApp.particleRenderer.enableAudioReactive();
      this.fluxApp.particleRenderer.updateAudioColors(themeData.hue, themeData.sat, themeData.light);
      
      // Reset audio state if it wasn't originally enabled
      if (!wasAudioEnabled) {
        this.fluxApp.audioReactiveEnabled = false;
      }
    }

    console.log('🎨 Colors updated for all modes with theme:', themeData);
  }

  updateParticleColors(color) {
    if (!this.fluxApp.particleRenderer || !this.fluxApp.particleRenderer.particleGraphics) return;
    
    console.log('🎨 Updating particle colors to:', color.toString(16));
    
    this.fluxApp.particleRenderer.particleGraphics.forEach(particle => {
      if (particle && particle.visible) {
        // Clear and redraw particle with new color
        particle.clear();
        
        const radius = 4; // Default particle radius
        
        // Outer glow
        particle.circle(0, 0, radius * 2);
        particle.fill({ color: color, alpha: 0.1 });

        // Middle layer
        particle.circle(0, 0, radius * 1.5);
        particle.fill({ color: color, alpha: 0.3 });

        // Core particle
        particle.circle(0, 0, radius);
        particle.fill({ color: color, alpha: 0.8 });

        // Bright center (always white for contrast)
        particle.circle(0, 0, radius * 0.4);
        particle.fill({ color: 0xffffff, alpha: 1.0 });
      }
    });
  }

  startRainbowMode() {
    let hue = 0;
    if (this.rainbowInterval) {
      clearInterval(this.rainbowInterval);
    }
    
    this.rainbowInterval = setInterval(() => {
      if (this.fluxApp.particleRenderer && this.fluxApp.particleRenderer.updateAudioColors) {
        this.fluxApp.particleRenderer.updateAudioColors(hue, 1.0, 0.5);
        hue = (hue + 2) % 360;
      }
    }, 50);
    console.log('🌈 Rainbow mode started');
  }

  toggleAudio() {
    const btn = document.getElementById('toggle-audio');
    console.log('🎵 Audio toggle clicked, current state:', this.fluxApp.audioReactiveEnabled);
    
    if (this.fluxApp.audioReactiveEnabled) {
      // Disable audio
      console.log('🔇 Disabling audio...');
      
      // Try multiple methods to disable audio
      if (typeof window.toggleAudioMode === 'function') {
        window.toggleAudioMode(false);
      } else if (this.fluxApp.disableAudioReactive) {
        this.fluxApp.disableAudioReactive();
      }
      
      // Update audio state
      this.fluxApp.audioReactiveEnabled = false;
      if (this.fluxApp.audioState) {
        this.fluxApp.audioState.isEnabled = false;
      }
      
      // Update button
      btn.textContent = 'Enable Audio';
      btn.style.background = 'rgba(0, 255, 255, 0.1)';
      
    } else {
      // Enable audio
      console.log('🔊 Enabling audio...');
      
      // Try to trigger the two-click audio capture
      if (this.fluxApp.twoClickCapture) {
        console.log('📱 Using two-click audio capture...');
        // The two-click system should handle the rest
      } else if (typeof window.toggleAudioMode === 'function') {
        window.toggleAudioMode(true);
      } else if (this.fluxApp.enableAudioReactive) {
        this.fluxApp.enableAudioReactive();
      }
      
      // Update button (will be updated again when audio actually connects)
      btn.textContent = 'Connecting...';
      btn.style.background = 'rgba(255, 255, 0, 0.3)';
      
      // Show instructions
      this.showAudioInstructions();
    }
  }

  showAudioInstructions() {
    // Create a temporary instruction overlay
    const instructions = document.createElement('div');
    instructions.id = 'audio-instructions';
    instructions.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      border: 2px solid #00ffff;
      border-radius: 15px;
      padding: 30px;
      color: #00ffff;
      font-family: 'Courier New', monospace;
      text-align: center;
      z-index: 10000;
      max-width: 400px;
    `;
    
    instructions.innerHTML = `
      <h3 style="margin: 0 0 20px 0; color: #ffffff;">🎵 Enable Audio Visualization</h3>
      <p style="margin: 10px 0;">Click the microphone button in the browser to allow audio access.</p>
      <p style="margin: 10px 0; font-size: 11px; opacity: 0.8;">This will make particles react to your music or microphone.</p>
      <button onclick="document.body.removeChild(document.getElementById('audio-instructions'))" 
              style="margin-top: 20px; padding: 10px 20px; background: #00ffff; color: #000; border: none; border-radius: 5px; cursor: pointer;">
        Got it!
      </button>
    `;
    
    document.body.appendChild(instructions);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (document.getElementById('audio-instructions')) {
        document.body.removeChild(instructions);
      }
    }, 10000);
  }

  applyPreset(preset) {
    console.log(`🎯 Applying ${preset} preset...`);
    
    const presets = {
      calm: {
        theme: 'ocean'
      },
      energetic: {
        theme: 'fire'
      },
      cosmic: {
        theme: 'galaxy'
      },
      minimal: {
        theme: 'cyan'
      }
    };

    const presetData = presets[preset];
    if (!presetData) return;

    // Apply only the color theme (the only reliable control)
    const colorTheme = document.getElementById('color-theme');
    if (colorTheme) {
      colorTheme.value = presetData.theme;
      colorTheme.dispatchEvent(new Event('change'));
    }

    // Add visual feedback
    this.showPresetFeedback(preset);
    
    console.log(`✅ ${preset} preset applied successfully`);
  }

  applyCurrentSettings() {
    console.log('⚙️ Applying current control panel settings...');
    
    // Get current values from all controls
    const settings = this.getCurrentSettings();
    
    // Apply only the reliable settings
    this.applyColorTheme(settings.colorTheme);
    
    // Store settings for future use
    this.lastAppliedSettings = settings;
    
    // Show feedback
    this.showApplyFeedback();
    
    console.log('✅ Settings applied:', settings);
  }

  getCurrentSettings() {
    return {
      colorTheme: document.getElementById('color-theme')?.value || 'cyan'
    };
  }

  applyParticleCount(count) {
    console.log('🔢 Applying particle count:', count);
    
    try {
      // Method 1: Try global setParticleCount function
      if (typeof window.setParticleCount === 'function') {
        console.log('Using global setParticleCount function');
        window.setParticleCount(count);
        return;
      }
      
      // Method 2: Try flux app method
      if (this.fluxApp && this.fluxApp.setParticleCount) {
        console.log('Using fluxApp.setParticleCount method');
        this.fluxApp.setParticleCount(count);
        return;
      }
      
      // Method 3: Direct access to performance monitor
      if (this.fluxApp && this.fluxApp.performanceMonitor && this.fluxApp.solver && this.fluxApp.particleRenderer) {
        console.log('Using direct performance monitor access');
        const clampedCount = Math.max(100, Math.min(2000, count));
        this.fluxApp.performanceMonitor.currentParticleCount = clampedCount;
        this.fluxApp.config.particleCount = clampedCount;
        this.fluxApp.solver.set_particle_count(clampedCount);
        this.fluxApp.particleRenderer.updateParticleCount(clampedCount);
        console.log(`✅ Particle count set to ${clampedCount} via direct access`);
        return;
      }
      
      console.warn('⚠️ No method available to set particle count');
      
    } catch (error) {
      console.error('❌ Error applying particle count:', error);
    }
  }

  applyBloomIntensity(intensity) {
    console.log('✨ Applying bloom intensity:', intensity);
    
    try {
      if (!this.fluxApp || !this.fluxApp.particleRenderer) {
        console.warn('⚠️ Particle renderer not available for bloom intensity');
        return;
      }
      
      let bloomApplied = false;
      
      // Method 1: Try updateBloomIntensity method
      if (this.fluxApp.particleRenderer.updateBloomIntensity) {
        console.log('Using updateBloomIntensity method');
        this.fluxApp.particleRenderer.updateBloomIntensity(intensity);
        bloomApplied = true;
      }
      
      // Method 2: Direct bloom filter access
      if (this.fluxApp.particleRenderer.bloomFilter) {
        console.log('Using direct bloomFilter access');
        this.fluxApp.particleRenderer.bloomFilter.bloomScale = intensity;
        bloomApplied = true;
      }
      
      // Method 3: Container filters access
      if (this.fluxApp.particleRenderer.container && this.fluxApp.particleRenderer.container.filters) {
        const bloomFilter = this.fluxApp.particleRenderer.container.filters.find(f => 
          f.constructor.name.includes('Bloom') || f.constructor.name.includes('AdvancedBloom')
        );
        if (bloomFilter && bloomFilter.bloomScale !== undefined) {
          console.log('Using container filters access');
          bloomFilter.bloomScale = intensity;
          bloomApplied = true;
        }
      }
      
      if (bloomApplied) {
        console.log(`✅ Bloom intensity set to ${intensity}`);
      } else {
        console.warn('⚠️ No bloom filter found to apply intensity');
      }
      
    } catch (error) {
      console.error('❌ Error applying bloom intensity:', error);
    }
  }

  applyParticleSize(size) {
    console.log('🔵 Applying particle size:', size);
    
    try {
      if (!this.fluxApp || !this.fluxApp.particleRenderer) {
        console.warn('⚠️ Particle renderer not available for size change');
        return;
      }
      
      // Store size multiplier
      this.fluxApp.particleRenderer.sizeMultiplier = size;
      
      // Apply size to all particles immediately
      if (this.fluxApp.particleRenderer.particleGraphics) {
        let particlesUpdated = 0;
        this.fluxApp.particleRenderer.particleGraphics.forEach(particle => {
          if (particle && particle.visible) {
            particle.scale.set(size);
            particlesUpdated++;
          }
        });
        console.log(`✅ Updated size for ${particlesUpdated} particles to ${size}`);
      } else {
        console.warn('⚠️ No particle graphics found to resize');
      }
      
    } catch (error) {
      console.error('❌ Error applying particle size:', error);
    }
  }

  applyAudioSensitivity(sensitivity) {
    console.log('🎵 Applying audio sensitivity:', sensitivity);
    if (this.fluxApp.audioState) {
      this.fluxApp.audioState.sensitivity = sensitivity;
    }
  }

  applyGravityEffect(gravity) {
    try {
      console.log('⬇️ Applying gravity effect:', gravity);
      
      if (!this.fluxApp || !this.fluxApp.solver) {
        console.warn('⚠️ Physics solver not available for gravity');
        return;
      }

      // Clear any existing gravity interval
      if (this.gravityInterval) {
        clearInterval(this.gravityInterval);
      }

      if (gravity > 0) {
        // Apply continuous downward force to simulate gravity
        this.gravityInterval = setInterval(() => {
          if (this.fluxApp.solver) {
            // Apply downward force across the entire canvas
            const centerX = this.fluxApp.config.containerWidth / 2;
            const bottomY = this.fluxApp.config.containerHeight * 0.8; // 80% down
            const radius = Math.max(this.fluxApp.config.containerWidth, this.fluxApp.config.containerHeight);
            
            // Apply force with intensity based on gravity setting
            this.fluxApp.solver.apply_force(centerX, bottomY, radius * gravity);
          }
        }, 50); // Apply gravity every 50ms
        
        console.log(`✅ Gravity effect started with strength ${gravity}`);
      } else {
        console.log('✅ Gravity effect disabled');
      }
      
    } catch (error) {
      console.error('❌ Error applying gravity effect:', error);
    }
  }

  applyDampingEffect(damping) {
    try {
      console.log('🌊 Applying damping effect:', damping);
      
      if (!this.fluxApp || !this.fluxApp.solver) {
        console.warn('⚠️ Physics solver not available for damping');
        return;
      }

      // Store damping for use in physics update loop
      this.fluxApp.currentDamping = damping;

      // Clear any existing damping interval
      if (this.dampingInterval) {
        clearInterval(this.dampingInterval);
      }

      if (damping < 0.99) {
        // Apply opposing forces to simulate damping
        this.dampingInterval = setInterval(() => {
          if (this.fluxApp.solver) {
            // Apply small opposing forces across the canvas to slow particles
            const dampingStrength = (1.0 - damping) * 0.5; // Convert to force strength
            
            // Apply multiple small forces to create damping effect
            for (let i = 0; i < 4; i++) {
              const x = (this.fluxApp.config.containerWidth / 4) * (i + 0.5);
              const y = this.fluxApp.config.containerHeight / 2;
              const radius = this.fluxApp.config.containerWidth / 3;
              
              // Apply gentle opposing force
              this.fluxApp.solver.apply_force(x, y, radius * dampingStrength);
            }
          }
        }, 100); // Apply damping every 100ms
        
        console.log(`✅ Damping effect started with factor ${damping}`);
      } else {
        console.log('✅ Damping effect disabled (high damping value)');
      }
      
    } catch (error) {
      console.error('❌ Error applying damping effect:', error);
    }
  }

  showApplyFeedback() {
    const feedback = document.createElement('div');
    feedback.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: rgba(0, 255, 0, 0.9);
      color: #000;
      padding: 10px 15px;
      border-radius: 20px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      font-weight: bold;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    
    feedback.textContent = '⚙️ Settings Applied!';
    
    document.body.appendChild(feedback);
    
    // Remove after 2 seconds
    setTimeout(() => {
      if (document.body.contains(feedback)) {
        feedback.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
          if (document.body.contains(feedback)) {
            document.body.removeChild(feedback);
          }
        }, 300);
      }
    }, 2000);
  }

  showPresetFeedback(preset) {
    // Create temporary feedback
    const feedback = document.createElement('div');
    feedback.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: rgba(0, 255, 255, 0.9);
      color: #000;
      padding: 10px 15px;
      border-radius: 20px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      font-weight: bold;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    
    feedback.textContent = `🎯 ${preset.toUpperCase()} preset applied!`;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(feedback);
    
    // Remove after 2 seconds
    setTimeout(() => {
      if (document.body.contains(feedback)) {
        feedback.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
          if (document.body.contains(feedback)) {
            document.body.removeChild(feedback);
          }
        }, 300);
      }
    }, 2000);
  }

  // Method to update audio button state from external sources
  updateAudioButtonState(isEnabled) {
    const btn = document.getElementById('toggle-audio');
    if (btn) {
      if (isEnabled) {
        btn.textContent = 'Disable Audio';
        btn.style.background = 'rgba(0, 255, 255, 0.3)';
        
        // Reapply current theme when audio is enabled
        if (this.currentTheme) {
          setTimeout(() => {
            this.applyColorTheme(this.currentTheme);
          }, 500); // Small delay to ensure audio mode is fully initialized
        }
      } else {
        btn.textContent = 'Enable Audio';
        btn.style.background = 'rgba(0, 255, 255, 0.1)';
        
        // Reapply current theme when audio is disabled
        if (this.currentTheme) {
          setTimeout(() => {
            this.applyColorTheme(this.currentTheme);
          }, 100);
        }
      }
    }
  }

  // Method to update particle count display
  updateParticleCountDisplay(count) {
    const display = document.getElementById('particle-count-value');
    const slider = document.getElementById('particle-count');
    if (display) display.textContent = count;
    if (slider) slider.value = count;
  }

  // Method to sync all controls with current application state
  syncControlsWithAppState() {
    console.log('🔄 Syncing control panel with application state...');
    
    // Update particle count
    if (this.fluxApp.config && this.fluxApp.config.particleCount) {
      this.updateParticleCountDisplay(this.fluxApp.config.particleCount);
    }
    
    // Update audio button state
    this.updateAudioButtonState(this.fluxApp.audioReactiveEnabled || false);
    
    // Apply current theme if set
    if (this.currentTheme) {
      this.applyColorTheme(this.currentTheme);
    }
    
    console.log('✅ Control panel synced with application state');
  }

  // Method to get a summary of current control states
  getControlSummary() {
    const settings = this.getCurrentSettings();
    console.log('📊 Current Control Panel Settings:', settings);
    return settings;
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

  // Toggle between minimized and expanded
  toggleMinimized() {
    this.isMinimized = !this.isMinimized;
    const toggleBtn = document.getElementById('toggle-panel');
    
    if (this.isMinimized) {
      this.panel.classList.add('minimized');
      if (toggleBtn) toggleBtn.textContent = '+';
      console.log('🔽 Control panel minimized');
    } else {
      this.panel.classList.remove('minimized');
      if (toggleBtn) toggleBtn.textContent = '−';
      console.log('🔼 Control panel expanded');
    }
  }

  // Expand the panel
  expand() {
    if (this.isMinimized) {
      this.toggleMinimized();
    }
  }

  // Minimize the panel
  minimize() {
    if (!this.isMinimized) {
      this.togglePanel();
    }
  }



  // Simple toggle method
  togglePanel() {
    this.isMinimized = !this.isMinimized;
    
    if (this.isMinimized) {
      this.panel.classList.add('minimized');
      console.log('🔽 Control panel minimized');
    } else {
      this.panel.classList.remove('minimized');
      console.log('🔼 Control panel expanded');
    }
  }

  // Verify that all control elements exist
  verifyControlElements() {
    console.log('🔍 Verifying control elements...');
    
    const expectedElements = [
      'color-theme'
    ];
    
    let missingElements = [];
    expectedElements.forEach(id => {
      const element = document.getElementById(id);
      if (!element) {
        missingElements.push(id);
      } else {
        console.log(`✅ Found element: ${id}`);
      }
    });
    
    if (missingElements.length > 0) {
      console.error('❌ Missing elements:', missingElements);
      console.error('🔧 Attempting to recreate control panel...');
      this.recreateControlPanel();
    } else {
      console.log('✅ All control elements verified');
    }
  }

  // Recreate control panel if elements are missing
  recreateControlPanel() {
    console.log('🔄 Recreating control panel...');
    
    // Remove existing panel
    if (this.panel && document.body.contains(this.panel)) {
      document.body.removeChild(this.panel);
    }
    
    // Recreate panel
    this.createControlPanel();
    
    // Setup event listeners again
    setTimeout(() => {
      this.setupEventListeners();
    }, 200);
  }

  // Cleanup method for intervals and elements
  cleanup() {
    if (this.gravityInterval) {
      clearInterval(this.gravityInterval);
      this.gravityInterval = null;
    }
    if (this.dampingInterval) {
      clearInterval(this.dampingInterval);
      this.dampingInterval = null;
    }
    if (this.rainbowInterval) {
      clearInterval(this.rainbowInterval);
      this.rainbowInterval = null;
    }
    
    // Remove toggle button
    if (this.toggleBtn && document.body.contains(this.toggleBtn)) {
      document.body.removeChild(this.toggleBtn);
      this.toggleBtn = null;
    }
    
    console.log('🧹 Control panel cleanup completed');
  }
}

// Particle rendering configuration
const PARTICLE_CONFIG = {
  radius: 4, // Original size for balanced appearance
  color: 0x00ffff, // Cyan neon color
  alpha: 0.9, // Slightly reduced for better balance
  // Bloom settings now handled directly in AdvancedBloomFilter configuration
};

/**
 * ParticleRenderer manages the visual representation of particles using Pixi.js
 * Implements zero-copy position updates by directly accessing WASM memory
 */
class ParticleRenderer {
  constructor(pixiApp, particleCount, wasmModule) {
    this.pixiApp = pixiApp;
    this.particleCount = particleCount;
    this.particleGraphics = [];
    this.container = new PIXI.Container();
    this.wasmModule = wasmModule;

    // Audio-reactive properties
    this.audioReactiveEnabled = false;
    this.currentHue = 180; // Default cyan hue
    this.baseBloomScale = 1.0;
    this.sparkleParticles = [];
    this.beatPulseScale = 1.0;
    this.trebleSizeMultipliers = [];
    


    // Add container to the stage
    this.pixiApp.stage.addChild(this.container);

    // Create particle graphics
    this.createParticleGraphics();

    // Apply bloom effect for holographic glow
    this.applyBloomEffect();
  }

  /**
   * Create Pixi.Graphics circles for each particle with enhanced visual effects
   */
  createParticleGraphics() {
    this.particleGraphics = [];
    this.particleTrails = []; // Store trail history for each particle

    for (let i = 0; i < this.particleCount; i++) {
      const particle = new PIXI.Graphics();

      // Create layered particle with glow effect
      // Outer glow
      particle.circle(0, 0, PARTICLE_CONFIG.radius * 2);
      particle.fill({ color: 0x00ffff, alpha: 0.1 });

      // Middle layer
      particle.circle(0, 0, PARTICLE_CONFIG.radius * 1.5);
      particle.fill({ color: 0x00ffff, alpha: 0.3 });

      // Core particle
      particle.circle(0, 0, PARTICLE_CONFIG.radius);
      particle.fill({ color: 0x00ffff, alpha: 0.8 });

      // Bright center
      particle.circle(0, 0, PARTICLE_CONFIG.radius * 0.4);
      particle.fill({ color: 0xffffff, alpha: 1.0 });

      // Add to container
      this.container.addChild(particle);
      this.particleGraphics.push(particle);

      // Initialize trail history
      this.particleTrails.push([]);
    }

    console.log(
      `Created ${this.particleCount} enhanced particle graphics with layered glow effects`
    );
  }

  /**
   * Update particle positions with trail effects
   * @param {Float32Array} positions - Array containing positions [x1, y1, x2, y2, ...]
   * @param {number} activeParticleCount - Number of active particles to render
   */
  updatePositions(positions, activeParticleCount) {
    const maxTrailLength = 8; // Number of trail points to keep

    // Ensure particleTrails array is properly initialized
    if (
      !this.particleTrails ||
      this.particleTrails.length !== this.particleCount
    ) {
      this.particleTrails = [];
      for (let i = 0; i < this.particleCount; i++) {
        this.particleTrails[i] = [];
      }
    }

    // Update positions for active particles only
    for (let i = 0; i < this.particleCount; i++) {
      const particle = this.particleGraphics[i];

      if (i < activeParticleCount && particle) {
        // Particle is active - update position and make visible
        const x = positions[i * 2];
        const y = positions[i * 2 + 1];

        // Ensure trail exists for this particle
        if (!this.particleTrails[i]) {
          this.particleTrails[i] = [];
        }

        // Update trail history
        const trail = this.particleTrails[i];
        trail.push({ x, y });
        if (trail.length > maxTrailLength) {
          trail.shift();
        }

        // Update particle position
        particle.x = x;
        particle.y = y;
        particle.visible = true;

        // Add subtle size variation based on velocity (with safety checks)
        let sizeMultiplier = 1.0;
        if (trail.length > 1) {
          const current = trail[trail.length - 1];
          const previous = trail[trail.length - 2];
          if (current && previous) {
            const velocity = Math.sqrt(
              Math.pow(current.x - previous.x, 2) +
                Math.pow(current.y - previous.y, 2)
            );
            // Clamp size multiplier to prevent particles from becoming too large
            sizeMultiplier = 1 + Math.min(velocity * 0.005, 0.2); // Reduced scaling
          }
        }

        // Safety check: prevent extreme scaling
        if (
          isNaN(sizeMultiplier) ||
          sizeMultiplier < 0.5 ||
          sizeMultiplier > 2.0
        ) {
          sizeMultiplier = 1.0;
        }

        // Apply audio-reactive size modifications if enabled
        if (this.audioReactiveEnabled && this.trebleSizeMultipliers[i]) {
          sizeMultiplier *= this.trebleSizeMultipliers[i];
        }
        if (this.audioReactiveEnabled && this.beatPulseScale !== 1.0) {
          sizeMultiplier *= this.beatPulseScale;
          // Decay beat pulse over time
          this.beatPulseScale = Math.max(1.0, this.beatPulseScale * 0.95);
        }

        particle.scale.set(sizeMultiplier);
      } else if (particle) {
        // Particle is inactive - hide it
        particle.visible = false;
        if (this.particleTrails[i]) {
          this.particleTrails[i] = []; // Clear trail
        }
      }
    }



    // Update sparkle animations if audio-reactive mode is enabled
    if (this.audioReactiveEnabled) {
      this.updateSparkleAnimations();
    }
  }



  /**
   * Apply soft, atmospheric bloom effect using AdvancedBloomFilter
   * Creates a holographic glow without harsh blown-out appearance
   */
  applyBloomEffect() {
    try {
      // Create AdvancedBloomFilter with original settings
      const bloomFilter = new AdvancedBloomFilter({
        threshold: 0.1, // Lower threshold for subtle glow
        bloomScale: 1.0, // Default bloom scale - always active
        brightness: 1.1, // Subtle brightness boost
        blur: 8, // Moderate blur for soft glow
        quality: 6, // Good quality without performance impact
        kernels: null, // Default kernels
      });
      
      // Store reference to bloom filter for collision updates
      this.bloomFilter = bloomFilter;

      // Apply bloom filter to main container
      this.container.filters = [bloomFilter];

      console.log(
        "✨ Soft atmospheric bloom effect applied with AdvancedBloomFilter"
      );
      console.log(
        "📊 Optimized settings: threshold=0.1, bloomScale=1.0, blur=8, quality=6"
      );
      console.log(
        "💡 This creates a soft, atmospheric glow instead of harsh blown-out lines"
      );
    } catch (error) {
      console.warn("Failed to apply AdvancedBloomFilter:", error);
      console.warn("Falling back to basic blur filter");

      // Fallback to basic blur if AdvancedBloomFilter fails
      const basicBlur = new PIXI.BlurFilter({
        strength: 3,
        quality: 4,
      });
      this.container.filters = [basicBlur];
    }
  }

  /**
   * Verify that the AdvancedBloomFilter is properly configured and applied
   */
  verifyBloomEffect() {
    console.log("AdvancedBloomFilter verification:");

    // Check if main container has filters
    if (this.container.filters && this.container.filters.length > 0) {
      console.log(
        `✓ Main container has ${this.container.filters.length} filter(s) applied`
      );
      console.log(
        `✓ Filter type: ${this.container.filters[0].constructor.name}`
      );

      const bloomFilter = this.container.filters[0];
      if (bloomFilter instanceof AdvancedBloomFilter) {
        console.log(`✓ AdvancedBloomFilter settings:`);
        console.log(`  - threshold: ${bloomFilter.threshold}`);
        console.log(`  - bloomScale: ${bloomFilter.bloomScale}`);
        console.log(`  - brightness: ${bloomFilter.brightness}`);
        console.log(`  - blur: ${bloomFilter.blur}`);
        console.log(`  - quality: ${bloomFilter.quality}`);
      }
    } else {
      console.warn("⚠️  No filters applied to main container");
    }

    return true;
  }

  /**
   * Toggle bloom effect on/off for debugging
   */
  toggleBloomEffect() {
    if (this.container.filters && this.container.filters.length > 0) {
      // Disable bloom
      this.container.filters = [];
      console.log("🔴 Bloom effect DISABLED - particles should appear normal");
    } else {
      // Re-enable bloom
      this.applyBloomEffect();
      console.log(
        "🟢 Bloom effect ENABLED - particles should have soft atmospheric glow"
      );
    }
  }

  /**
   * Create a bright test particle to verify bloom effect is visible
   */
  createBloomTestParticle() {
    // Create a large bright particle in center to test bloom
    const centerParticle = new PIXI.Graphics();
    centerParticle.circle(0, 0, 25);
    centerParticle.fill({ color: 0x00ffff, alpha: 1.0 }); // Bright cyan
    centerParticle.circle(0, 0, 15);
    centerParticle.fill({ color: 0xffffff, alpha: 1.0 }); // White center
    centerParticle.x = this.pixiApp.canvas.width / 2;
    centerParticle.y = this.pixiApp.canvas.height / 2;
    this.container.addChild(centerParticle);

    console.log("Created test particle with AdvancedBloomFilter");
    console.log(
      "You should see a bright cyan particle with a soft, atmospheric glow"
    );
    console.log("The bloom should be subtle and not blown out");

    // Verify bloom effect after creation
    setTimeout(() => {
      this.verifyBloomEffect();
    }, 100);

    // Remove test particle after 15 seconds
    setTimeout(() => {
      this.container.removeChild(centerParticle);
      centerParticle.destroy();
      console.log("Removed bloom test particle");
    }, 15000);
  }

  /**
   * Enable audio-reactive rendering features
   */
  enableAudioReactive() {
    this.audioReactiveEnabled = true;
    // Initialize treble size multipliers array
    this.trebleSizeMultipliers = new Array(this.particleCount).fill(1.0);
    console.log("Audio-reactive particle rendering enabled");
  }

  /**
   * Disable audio-reactive rendering features
   */
  disableAudioReactive() {
    this.audioReactiveEnabled = false;
    this.resetAudioEffects();
    console.log("Audio-reactive particle rendering disabled");
  }

  /**
   * Update particle colors based on audio frequency data
   * @param {number} hue - HSL hue value (0-360)
   * @param {number} saturation - HSL saturation (0-1)
   * @param {number} lightness - HSL lightness (0-1)
   */
  updateAudioColors(hue, saturation = 1.0, lightness = 0.5) {
    if (!this.audioReactiveEnabled) return;

    this.currentHue = hue;

    // Convert HSL to RGB
    const rgb = this.hslToRgb(hue / 360, saturation, lightness);
    const color = (rgb.r << 16) | (rgb.g << 8) | rgb.b;

    // Update all particle colors
    this.particleGraphics.forEach((particle) => {
      if (particle && particle.visible) {
        // Clear and redraw particle with new color
        particle.clear();

        // Outer glow
        particle.circle(0, 0, PARTICLE_CONFIG.radius * 2);
        particle.fill({ color: color, alpha: 0.1 });

        // Middle layer
        particle.circle(0, 0, PARTICLE_CONFIG.radius * 1.5);
        particle.fill({ color: color, alpha: 0.3 });

        // Core particle
        particle.circle(0, 0, PARTICLE_CONFIG.radius);
        particle.fill({ color: color, alpha: 0.8 });

        // Bright center (always white for contrast)
        particle.circle(0, 0, PARTICLE_CONFIG.radius * 0.4);
        particle.fill({ color: 0xffffff, alpha: 1.0 });
      }
    });
  }

  /**
   * Update bloom intensity based on audio data
   * @param {number} intensity - Bloom intensity multiplier (0.5-3.0)
   */
  updateBloomIntensity(intensity) {
    if (!this.audioReactiveEnabled || !this.container.filters) return;

    const bloomFilter = this.container.filters.find(
      (f) =>
        f.constructor.name.includes("Bloom") ||
        f.constructor.name.includes("AdvancedBloom")
    );

    if (bloomFilter && bloomFilter.bloomScale !== undefined) {
      // Clamp intensity to prevent visual overload
      const clampedIntensity = Math.max(0.5, Math.min(3.0, intensity));
      bloomFilter.bloomScale = this.baseBloomScale * clampedIntensity;
    }
  }

  /**
   * Update particle sizes based on treble frequency response
   * @param {number} trebleLevel - Treble frequency level (0-1)
   * @param {Array} frequencySpectrum - Full frequency spectrum for per-particle variation
   */
  updateTrebleSizes(trebleLevel, frequencySpectrum = null) {
    if (!this.audioReactiveEnabled) return;

    // Base size multiplier from overall treble level
    const baseTrebleMultiplier = 1.0 + trebleLevel * 0.5;

    this.particleGraphics.forEach((particle, index) => {
      if (
        particle &&
        particle.visible &&
        index < this.trebleSizeMultipliers.length
      ) {
        let sizeMultiplier = baseTrebleMultiplier;

        // Add per-particle variation if spectrum data available
        if (frequencySpectrum && frequencySpectrum.length > 0) {
          // Map particle index to high-frequency bins
          const spectrumIndex =
            Math.floor(
              (index / this.particleCount) * frequencySpectrum.length * 0.3
            ) + Math.floor(frequencySpectrum.length * 0.7);
          const clampedIndex = Math.min(
            spectrumIndex,
            frequencySpectrum.length - 1
          );
          const particleFreq = frequencySpectrum[clampedIndex] / 255;

          // Add individual particle frequency response
          sizeMultiplier += particleFreq * 0.3;
        }

        // Store and apply size multiplier
        this.trebleSizeMultipliers[index] = sizeMultiplier;

        // Combine with existing velocity-based scaling
        const currentScale = particle.scale.x || 1.0;
        const velocityScale =
          currentScale / (this.trebleSizeMultipliers[index] || 1.0);
        particle.scale.set(velocityScale * sizeMultiplier);
      }
    });
  }

  /**
   * Create sparkle effects for high-frequency content
   * @param {number} sparkleIntensity - Intensity of sparkle effect (0-1)
   * @param {number} sparkleCount - Number of sparkle particles to create
   */
  createSparkleEffects(sparkleIntensity, sparkleCount = 5) {
    if (!this.audioReactiveEnabled || sparkleIntensity < 0.1) return;

    // Clean up old sparkle particles
    this.cleanupSparkleParticles();

    // Create new sparkle particles
    for (let i = 0; i < sparkleCount; i++) {
      const sparkle = new PIXI.Graphics();

      // Random position
      const x = Math.random() * this.pixiApp.canvas.width;
      const y = Math.random() * this.pixiApp.canvas.height;

      // Sparkle size based on intensity
      const size = PARTICLE_CONFIG.radius * (0.3 + sparkleIntensity * 0.7);

      // Bright sparkle with high-frequency color (white/yellow)
      sparkle.circle(0, 0, size * 2);
      sparkle.fill({ color: 0xffffff, alpha: 0.3 * sparkleIntensity });

      sparkle.circle(0, 0, size);
      sparkle.fill({ color: 0xffff00, alpha: 0.8 * sparkleIntensity }); // Yellow for high frequencies

      sparkle.circle(0, 0, size * 0.4);
      sparkle.fill({ color: 0xffffff, alpha: 1.0 });

      sparkle.x = x;
      sparkle.y = y;

      // Add sparkle animation
      sparkle.sparkleLife = 1.0;
      sparkle.sparkleDecay = 0.02 + sparkleIntensity * 0.03;

      this.container.addChild(sparkle);
      this.sparkleParticles.push(sparkle);
    }
  }

  /**
   * Apply beat-driven visual pulse to all particles
   * @param {number} beatStrength - Strength of the beat (0-2)
   */
  applyBeatPulse(beatStrength) {
    if (!this.audioReactiveEnabled || beatStrength < 0.1) return;

    // Scale all particles temporarily
    this.beatPulseScale = 1.0 + beatStrength * 0.3;

    this.particleGraphics.forEach((particle, index) => {
      if (particle && particle.visible) {
        const currentScale = particle.scale.x || 1.0;
        const trebleScale = this.trebleSizeMultipliers[index] || 1.0;
        particle.scale.set(
          ((currentScale * this.beatPulseScale) / trebleScale) * trebleScale
        );
      }
    });

    // Also boost bloom temporarily
    this.updateBloomIntensity(this.baseBloomScale * (1.0 + beatStrength * 0.5));
  }

  /**
   * Update sparkle particle animations
   */
  updateSparkleAnimations() {
    if (!this.audioReactiveEnabled) return;

    this.sparkleParticles = this.sparkleParticles.filter((sparkle) => {
      if (sparkle.sparkleLife <= 0) {
        this.container.removeChild(sparkle);
        sparkle.destroy();
        return false;
      }

      // Animate sparkle
      sparkle.sparkleLife -= sparkle.sparkleDecay;
      sparkle.alpha = sparkle.sparkleLife;
      sparkle.scale.set(sparkle.sparkleLife * 2);

      return true;
    });
  }

  /**
   * Clean up old sparkle particles
   */
  cleanupSparkleParticles() {
    this.sparkleParticles.forEach((sparkle) => {
      this.container.removeChild(sparkle);
      sparkle.destroy();
    });
    this.sparkleParticles = [];
  }



  /**
   * Reset all audio effects to default state
   */
  resetAudioEffects() {
    // Reset colors to default cyan
    this.updateAudioColors(180, 1.0, 0.5);

    // Reset bloom intensity to default
    this.updateBloomIntensity(1.0);

    // Reset particle sizes
    this.trebleSizeMultipliers.fill(1.0);
    this.particleGraphics.forEach((particle) => {
      if (particle) {
        particle.scale.set(1.0);
      }
    });

    // Clean up sparkles
    this.cleanupSparkleParticles();

    // Reset beat pulse
    this.beatPulseScale = 1.0;
  }

  /**
   * Convert HSL to RGB
   * @param {number} h - Hue (0-1)
   * @param {number} s - Saturation (0-1)
   * @param {number} l - Lightness (0-1)
   * @returns {Object} RGB values {r, g, b}
   */
  hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  }

  /**
   * Get the particle container for applying effects
   */
  getContainer() {
    return this.container;
  }

  /**
   * Update particle count for dynamic scaling
   */
  updateParticleCount(newCount) {
    if (newCount > this.particleCount) {
      // Add more particle graphics
      for (let i = this.particleCount; i < newCount; i++) {
        const particle = new PIXI.Graphics();

        // Create layered particle with glow effect (same as createParticleGraphics)
        // Outer glow
        particle.circle(0, 0, PARTICLE_CONFIG.radius * 2);
        particle.fill({ color: 0x00ffff, alpha: 0.1 });

        // Middle layer
        particle.circle(0, 0, PARTICLE_CONFIG.radius * 1.5);
        particle.fill({ color: 0x00ffff, alpha: 0.3 });

        // Core particle
        particle.circle(0, 0, PARTICLE_CONFIG.radius);
        particle.fill({ color: 0x00ffff, alpha: 0.8 });

        // Bright center
        particle.circle(0, 0, PARTICLE_CONFIG.radius * 0.4);
        particle.fill({ color: 0xffffff, alpha: 1.0 });

        this.container.addChild(particle);
        this.particleGraphics.push(particle);

        // Initialize trail for new particle
        if (!this.particleTrails) {
          this.particleTrails = [];
        }
        this.particleTrails.push([]);
      }
    } else if (newCount < this.particleCount) {
      // Remove excess particle graphics
      for (let i = newCount; i < this.particleCount; i++) {
        const particle = this.particleGraphics[i];
        if (particle) {
          this.container.removeChild(particle);
          particle.destroy();
        }
      }
      this.particleGraphics.splice(newCount);

      // Remove excess trails
      if (this.particleTrails) {
        this.particleTrails.splice(newCount);
      }
    }

    // Ensure trails array matches particle count
    if (!this.particleTrails) {
      this.particleTrails = [];
    }
    while (this.particleTrails.length < newCount) {
      this.particleTrails.push([]);
    }

    // Ensure treble size multipliers array matches particle count
    if (this.audioReactiveEnabled) {
      if (!this.trebleSizeMultipliers) {
        this.trebleSizeMultipliers = [];
      }
      while (this.trebleSizeMultipliers.length < newCount) {
        this.trebleSizeMultipliers.push(1.0);
      }
      if (this.trebleSizeMultipliers.length > newCount) {
        this.trebleSizeMultipliers.splice(newCount);
      }
    }

    this.particleCount = newCount;
    console.log(`Updated particle count to ${newCount}`);
  }
}

class FluxApplication {
  constructor() {
    this.pixiApp = null;
    this.solver = null;
    this.canvas = null;
    this.wasmModule = null;
    this.particleRenderer = null;
    this.usingFallbackPhysics = false;

    // Enhanced UI and effects
    this.controlPanel = null;

    // Audio reactive mode components
    this.audioAnalyzer = null;
    this.audioEffects = null;
    this.fluxAudioModule = null;
    this.audioReactiveEnabled = false;
    this.audioInitialized = false;

    // Audio mode state management
    this.audioState = {
      isEnabled: false,
      isInitializing: false,
      currentMode: "reactive",
      sensitivity: 1.0,
      lastAudioData: null,
      lastBeatData: null,
      transitionProgress: 0,
      transitionDuration: 1000, // ms
    };

    // Performance monitoring and dynamic scaling
    this.performanceMonitor = {
      frameCount: 0,
      lastTime: performance.now(),
      frameTimeHistory: [],
      maxHistoryLength: 60, // Track last 60 frames for stable measurements
      targetFPS: 60,
      targetFrameTime: 16.67, // 1000ms / 60fps
      bloomEnabled: false,

      // Dynamic scaling properties
      minParticleCount: 100,
      maxParticleCount: 1000,
      currentParticleCount: 800,
      lastAdjustmentTime: 0,
      adjustmentCooldown: 2000, // 2 seconds between adjustments
      performanceCheckInterval: 60, // Check every 60 frames (~1 second)

      // Performance thresholds
      goodPerformanceThreshold: 14.0, // < 14ms frame time = good performance
      poorPerformanceThreshold: 20.0, // > 20ms frame time = poor performance
      adjustmentFactor: 0.1, // Adjust particle count by 10% each time
    };

    // Configuration
    this.config = {
      particleCount: 800, // Starting particle count
      containerWidth: window.innerWidth,
      containerHeight: window.innerHeight,
      backgroundColor: 0x0d0d0d,
    };

    // Initialize performance monitor with current particle count
    this.performanceMonitor.currentParticleCount = this.config.particleCount;
  }

  async init() {
    try {
      console.log("Initializing FLUX Physics Playground...");

      // Clear any existing fallback messages
      this.clearFallbackMessage();

      // Setup canvas and Pixi.js application
      await this.setupRenderer();

      // Load WASM module and initialize physics
      await this.setupPhysics();

      // Setup particle renderer
      this.setupParticleRenderer();

      // Setup interaction handlers
      this.setupInteraction();

      // Setup audio reactive mode - DISABLED (using new clean UI instead)
      // this.setupAudioReactiveMode();

      // Setup two-click audio capture - DISABLED (using new clean UI instead)
      // this.setupTwoClickAudioCapture();

      // Setup embedded control panel - DISABLED (using new clean UI instead)
      // this.setupEmbeddedControlPanel();

      // Start the render loop
      this.startRenderLoop();

      console.log("FLUX initialized successfully");

      // Add device audio reactive capability - DISABLED (using new clean UI instead)
      // this.setupDeviceAudio();
    } catch (error) {
      console.error("Failed to initialize FLUX:", error);
      this.showFallbackMessage();
    }
  }

  async setupRenderer() {
    // Get canvas element
    this.canvas = document.getElementById("canvas");
    if (!this.canvas) {
      throw new Error("Canvas element not found");
    }

    // Create Pixi.js application with fullscreen configuration
    this.pixiApp = new PIXI.Application();
    await this.pixiApp.init({
      canvas: this.canvas,
      width: this.config.containerWidth,
      height: this.config.containerHeight,
      backgroundColor: this.config.backgroundColor,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // Make canvas fullscreen
    this.canvas.style.position = "fixed";
    this.canvas.style.top = "0";
    this.canvas.style.left = "0";
    this.canvas.style.width = "100vw";
    this.canvas.style.height = "100vh";
    this.canvas.style.zIndex = "1";

    // Handle window resize
    window.addEventListener("resize", () => {
      this.config.containerWidth = window.innerWidth;
      this.config.containerHeight = window.innerHeight;
      this.pixiApp.renderer.resize(
        this.config.containerWidth,
        this.config.containerHeight
      );

      // Update physics solver dimensions if it exists
      if (this.solver) {
        // Note: This would require a method in the solver to update dimensions
        // For now, we'll handle this in future tasks
        console.log(
          "Window resized, physics solver dimensions should be updated"
        );
      }
    });

    console.log("Pixi.js renderer initialized");
  }

  async setupPhysics() {
    try {
      // Try to load WASM module first
      console.log("Loading WASM physics engine...");

      try {
        // Use dynamic import with Vite-compatible path
        const wasmModule = await import("engine");
        console.log("WASM module imported, initializing...");
        await wasmModule.default(); // Initialize the WASM module
        console.log("WASM module initialized");
        this.wasmModule = wasmModule;

        // Initialize physics solver with configurable particle count
        console.log("Creating WASM Solver instance...");
        this.solver = new wasmModule.Solver(
          this.config.particleCount,
          this.config.containerWidth,
          this.config.containerHeight
        );

        console.log(
          `✅ WASM physics engine initialized with ${this.config.particleCount} particles`
        );
        this.usingFallbackPhysics = false;
        
      } catch (wasmError) {
        console.warn("WASM physics engine failed to load:", wasmError.message);
        console.log("🔄 Falling back to JavaScript physics engine...");
        
        // Import and use fallback physics
        const { createFallbackPhysics } = await import("./physics/fallback-physics.js");
        this.wasmModule = createFallbackPhysics(
          this.config.particleCount,
          this.config.containerWidth,
          this.config.containerHeight
        );
        
        // Initialize fallback solver
        this.solver = new this.wasmModule.Solver(
          this.config.particleCount,
          this.config.containerWidth,
          this.config.containerHeight
        );
        
        console.log(
          `✅ Fallback JavaScript physics engine initialized with ${this.config.particleCount} particles`
        );
        this.usingFallbackPhysics = true;
        
        // Show user notification
        setTimeout(() => {
          if (this.fluxAudioModule) {
            this.fluxAudioModule.showToast(
              "⚠️ Using fallback physics engine (WASM failed to load)", 
              "warning"
            );
          }
        }, 2000);
      }

    } catch (error) {
      console.error("Both WASM and fallback physics failed:", error);
      console.error("Error details:", error.stack);
      throw new Error(`Failed to load any physics engine: ${error.message}`);
    }
  }

  setupParticleRenderer() {
    if (!this.pixiApp || !this.solver) {
      throw new Error(
        "Pixi.js application and physics solver must be initialized first"
      );
    }

    // Create particle renderer with current particle count
    this.particleRenderer = new ParticleRenderer(
      this.pixiApp,
      this.config.particleCount
    );

    console.log("Particle renderer initialized");

    // Test bloom effect performance after a short delay
    setTimeout(() => {
      this.testBloomPerformance();
    }, 2000);
  }

  /**
   * Test bloom effect performance and adjust settings if needed
   */
  testBloomPerformance() {
    if (!this.particleRenderer || !this.performanceMonitor.bloomEnabled) {
      return;
    }

    const recentFrameTimes =
      this.performanceMonitor.frameTimeHistory.slice(-30); // Last 30 frames
    if (recentFrameTimes.length < 10) {
      console.log("Not enough performance data yet, will test bloom later");
      return;
    }

    const avgFrameTime =
      recentFrameTimes.reduce((a, b) => a + b, 0) / recentFrameTimes.length;
    const avgFPS = 1000 / avgFrameTime;

    console.log(`Bloom effect performance test results:`);
    console.log(`- Current FPS: ${avgFPS.toFixed(1)}`);
    console.log(`- Current frame time: ${avgFrameTime.toFixed(2)}ms`);

    if (avgFrameTime > this.performanceMonitor.targetFrameTime * 1.5) {
      console.warn("Bloom effect causing significant performance impact");
      console.warn(
        "Consider adjusting bloom settings or disabling for better performance"
      );

      // Optionally adjust bloom settings automatically
      this.adjustBloomSettings();
    } else {
      console.log("✓ Bloom effect performance is acceptable");
    }
  }

  /**
   * Adjust bloom settings for better performance if needed
   */
  adjustBloomSettings() {
    if (!this.particleRenderer || !this.particleRenderer.container.filters) {
      return;
    }

    const blurFilter = this.particleRenderer.container.filters.find(
      (filter) => filter instanceof PIXI.BlurFilter
    );

    if (blurFilter) {
      // Reduce blur strength for better performance
      const originalStrength = blurFilter.strength;
      blurFilter.strength = Math.max(2, originalStrength - 2);

      console.log(
        `Adjusted blur strength from ${originalStrength} to ${blurFilter.strength} for better performance`
      );
    }
  }

  setupInteraction() {
    // Mouse interaction configuration
    const INTERACTION_CONFIG = {
      radius: 80.0, // Interaction radius in pixels
      strength: 1.0, // Force strength multiplier
      smoothing: 0.8, // Smoothing factor for responsive feel
    };

    // Track mouse state for smooth interaction
    let mouseState = {
      x: 0,
      y: 0,
      isActive: false,
      lastUpdateTime: 0,
    };

    // Add mousemove event listener to canvas element
    this.canvas.addEventListener("mousemove", (event) => {
      // Convert mouse coordinates to physics world coordinates
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.config.containerWidth / rect.width;
      const scaleY = this.config.containerHeight / rect.height;

      // Calculate physics world coordinates
      const physicsX = (event.clientX - rect.left) * scaleX;
      const physicsY = (event.clientY - rect.top) * scaleY;

      // Update mouse state with smoothing for fluid interaction
      const currentTime = performance.now();
      const deltaTime = currentTime - mouseState.lastUpdateTime;

      if (deltaTime > 8) {
        // Throttle to ~120fps for smooth interaction
        // Apply smoothing to mouse position for fluid feel
        if (mouseState.isActive) {
          mouseState.x =
            mouseState.x * INTERACTION_CONFIG.smoothing +
            physicsX * (1 - INTERACTION_CONFIG.smoothing);
          mouseState.y =
            mouseState.y * INTERACTION_CONFIG.smoothing +
            physicsY * (1 - INTERACTION_CONFIG.smoothing);
        } else {
          mouseState.x = physicsX;
          mouseState.y = physicsY;
          mouseState.isActive = true;
        }

        // Call WASM apply_force method with mouse position and interaction radius
        if (this.solver) {
          this.solver.apply_force(
            mouseState.x,
            mouseState.y,
            INTERACTION_CONFIG.radius
          );
        }

        mouseState.lastUpdateTime = currentTime;
      }
    });

    // Add mouseleave event to stop interaction when mouse leaves canvas
    this.canvas.addEventListener("mouseleave", () => {
      mouseState.isActive = false;
      console.log("Mouse left canvas - interaction stopped");
    });

    // Add mouseenter event to resume interaction
    this.canvas.addEventListener("mouseenter", () => {
      console.log("Mouse entered canvas - interaction ready");
    });

    console.log("Mouse interaction system initialized");
    console.log(`- Interaction radius: ${INTERACTION_CONFIG.radius}px`);
    console.log(`- Force strength: ${INTERACTION_CONFIG.strength}x`);
    console.log(`- Smoothing factor: ${INTERACTION_CONFIG.smoothing}`);
    console.log("- Coordinate conversion: screen → physics world coordinates");
    console.log("- Throttled to ~120fps for smooth, responsive interaction");
  }

  /**
   * Setup audio reactive mode components and UI
   */
  setupAudioReactiveMode() {
    try {
      console.log("Setting up audio reactive mode...");

      // Initialize enhanced audio effects system
      this.audioEffects = new EnhancedAudioEffects(this);

      // Configure audio effects with current state
      if (this.audioEffects) {
        this.audioEffects.mode = this.audioState.currentMode;
        this.audioEffects.intensity = this.audioState.sensitivity;
        this.audioEffects.smoothingFactor = 0.7;
      }

      // Initialize FLUX Audio Module (replaces old AudioUI)
      this.fluxAudioModule = setupFluxAudioModule(this, {
        position: "top-left",
        compact: false,
        theme: "flux",
      });

      // Initialize audio examples for demonstration and testing
      this.audioExample = new AudioExample(this);

      // Initialize audio optimizer for performance tuning
      this.audioOptimizer = new AudioOptimizer(this);

      // Initialize audio validation suite for testing
      this.audioValidationSuite = new AudioValidationSuite(this);

      // Load audio settings from localStorage
      this.loadAudioSettings();

      console.log("Audio reactive mode setup complete");
    } catch (error) {
      console.warn("Failed to setup audio reactive mode:", error);
      console.warn("Audio features will be unavailable");
    }
  }

  /**
   * Setup two-click audio capture system
   */
  setupTwoClickAudioCapture() {
    try {
      console.log("Setting up two-click audio capture...");

      // Delay initialization to allow FLUX audio module to be created first
      setTimeout(() => {
        // Initialize the two-click audio capture system
        this.twoClickCapture = new TwoClickAudioCapture();

        // Set up success callback
        this.twoClickCapture.onSuccess((stream) => {
          console.log("✅ Audio stream captured successfully");

          // Connect the stream to the audio visualizer
          try {
            const audioConnection = connectStreamToAudioVisualizer(
              stream,
              this
            );

            // Store audio connection for cleanup
            this.audioConnection = audioConnection;

            // Enable audio reactive mode
            this.audioReactiveEnabled = true;
            this.audioInitialized = true;
            this.audioState.isEnabled = true;

            // Enable audio reactive rendering in particle system
            if (this.particleRenderer) {
              this.particleRenderer.enableAudioReactive();
            }

            // Update control panel audio button
            if (this.controlPanel && this.controlPanel.updateAudioButtonState) {
              this.controlPanel.updateAudioButtonState(true);
            }

            // Show success message
            if (this.fluxAudioModule) {
              this.fluxAudioModule.showToast(
                "🎵 Audio visualization active!",
                "success"
              );
            }

            console.log("🎵 Two-click audio capture setup complete");
          } catch (error) {
            console.error("Failed to connect audio stream:", error);
            if (this.fluxAudioModule) {
              this.fluxAudioModule.showToast(
                "❌ Failed to connect audio",
                "error"
              );
            }
          }
        });

        // Set up error callback
        this.twoClickCapture.onFailure((error) => {
          console.error("❌ Audio capture failed:", error);

          // Show error message
          if (this.fluxAudioModule) {
            this.fluxAudioModule.showToast("❌ Audio capture failed", "error");
          }

          // Reset audio state
          this.audioReactiveEnabled = false;
          this.audioInitialized = false;
          this.audioState.isEnabled = false;

          // Update control panel audio button
          if (this.controlPanel && this.controlPanel.updateAudioButtonState) {
            this.controlPanel.updateAudioButtonState(false);
          }
        });

        console.log("Two-click audio capture system ready");
      }, 100); // Small delay to ensure FLUX audio module is ready
    } catch (error) {
      console.warn("Failed to setup two-click audio capture:", error);
      console.warn("Two-click audio capture will be unavailable");
    }
  }

  /**
   * Setup embedded control panel
   */
  setupEmbeddedControlPanel() {
    try {
      console.log("🎨 Setting up embedded control panel...");

      // Initialize embedded control panel
      this.controlPanel = new EmbeddedControlPanel(this);
      console.log("🎛️ Embedded control panel initialized successfully");

      // Verify control panel is working
      setTimeout(() => {
        this.verifyControlPanel();
      }, 500);

      // Create a simple test element to verify DOM manipulation works
      this.createTestElement();

      console.log("🎉 Embedded control panel setup complete!");
    } catch (error) {
      console.error("❌ Failed to initialize embedded control panel:", error);
      // Create a simple fallback panel
      this.createFallbackPanel();
    }
  }

  /**
   * Verify that the control panel is working correctly
   */
  verifyControlPanel() {
    console.log('🔍 Verifying control panel functionality...');
    
    if (!this.controlPanel) {
      console.error('❌ Control panel object not found');
      return;
    }
    
    // Check if panel element exists in DOM
    const panelElement = document.getElementById('flux-control-panel');
    if (!panelElement) {
      console.error('❌ Control panel DOM element not found');
      return;
    }
    
    // Check if key controls exist
    const controls = [
      'particle-count',
      'bloom-intensity', 
      'particle-size',
      'color-theme',
      'toggle-audio',
      'apply-settings'
    ];
    
    let missingControls = [];
    controls.forEach(controlId => {
      if (!document.getElementById(controlId)) {
        missingControls.push(controlId);
      }
    });
    
    if (missingControls.length > 0) {
      console.warn('⚠️ Missing controls:', missingControls);
    } else {
      console.log('✅ All control elements found');
    }
    
    // Test control panel methods
    if (typeof this.controlPanel.getCurrentSettings === 'function') {
      const settings = this.controlPanel.getCurrentSettings();
      console.log('✅ Control panel methods working, current settings:', settings);
    } else {
      console.error('❌ Control panel methods not available');
    }
    
    // Check visibility
    const computed = window.getComputedStyle(panelElement);
    if (computed.display !== 'none' && computed.visibility !== 'hidden') {
      console.log('✅ Control panel is visible');
    } else {
      console.warn('⚠️ Control panel may not be visible:', {
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity
      });
    }
    
    console.log('🎉 Control panel verification complete');
  }

  /**
   * Create a simple test element to verify DOM manipulation works
   */
  createTestElement() {
    const testElement = document.createElement('div');
    testElement.id = 'flux-test-element';
    testElement.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(255, 0, 0, 0.8);
      color: white;
      padding: 10px;
      border: 2px solid red;
      z-index: 10000;
      font-family: monospace;
      font-size: 12px;
    `;
    testElement.textContent = '🧪 FLUX Test Element - DOM manipulation working';
    document.body.appendChild(testElement);
    
    console.log('🧪 Test element created and added to DOM');
    
    // Remove after 5 seconds
    setTimeout(() => {
      if (document.body.contains(testElement)) {
        document.body.removeChild(testElement);
        console.log('🧪 Test element removed');
      }
    }, 5000);
  }

  /**
   * Create a simple fallback control panel
   */
  createFallbackPanel() {
    const fallbackPanel = document.createElement('div');
    fallbackPanel.id = 'flux-fallback-panel';
    fallbackPanel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 200px;
      background: rgba(0, 0, 0, 0.9);
      border: 2px solid #00ffff;
      border-radius: 10px;
      color: #00ffff;
      padding: 15px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      z-index: 9999;
    `;
    
    fallbackPanel.innerHTML = `
      <h3 style="margin: 0 0 10px 0; text-align: center;">🎛️ FLUX Controls</h3>
      <div style="margin: 10px 0;">
        <label>Particles: <span id="fallback-count">800</span></label><br>
        <input type="range" id="fallback-particles" min="100" max="1500" value="800" style="width: 100%;">
      </div>
      <div style="margin: 10px 0;">
        <button id="fallback-audio" style="width: 100%; padding: 5px; background: #00ffff; color: #000; border: none; border-radius: 3px;">Enable Audio</button>
      </div>
      <div style="margin: 10px 0; font-size: 10px; opacity: 0.7;">
        Fallback panel - main panel failed to load
      </div>
    `;
    
    document.body.appendChild(fallbackPanel);
    console.log('🔧 Fallback control panel created');
    
    // Add basic functionality
    const particleSlider = fallbackPanel.querySelector('#fallback-particles');
    const particleCount = fallbackPanel.querySelector('#fallback-count');
    const audioButton = fallbackPanel.querySelector('#fallback-audio');
    
    if (particleSlider && particleCount) {
      particleSlider.addEventListener('input', (e) => {
        const count = e.target.value;
        particleCount.textContent = count;
        if (this.setParticleCount) {
          this.setParticleCount(parseInt(count));
        }
      });
    }
    
    if (audioButton) {
      audioButton.addEventListener('click', () => {
        if (this.toggleAudioMode) {
          this.toggleAudioMode();
          audioButton.textContent = this.audioReactiveEnabled ? 'Disable Audio' : 'Enable Audio';
        }
      });
    }
  }

  /**
   * Create UI container if it doesn't exist
   */
  createUIContainer() {
    let container = document.getElementById("ui-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "ui-container";
      container.style.position = "fixed";
      container.style.top = "20px";
      container.style.right = "20px";
      container.style.zIndex = "1000";
      container.style.pointerEvents = "auto";
      document.body.appendChild(container);
    }
    return container;
  }

  /**
   * Toggle audio reactive mode on/off
   * @param {boolean} enabled - Whether to enable audio mode
   */
  async toggleAudioMode(enabled) {
    if (this.audioState.isInitializing) {
      console.log("Audio mode is already initializing, please wait...");
      return;
    }

    try {
      this.audioState.isInitializing = true;

      if (enabled && !this.audioReactiveEnabled) {
        console.log("Enabling audio reactive mode...");

        // Initialize optimized audio analyzer if not already done
        if (!this.audioAnalyzer) {
          this.audioAnalyzer = new OptimizedAudioAnalyzer({
            fftSize: 1024, // Optimized for performance
            smoothingTimeConstant: 0.6, // Faster response
          });
        }

        // Initialize audio analyzer
        const result = await this.audioAnalyzer.initialize();
        if (!result.success) {
          throw new Error(result.message);
        }

        // Enable audio-reactive features in particle renderer
        if (this.particleRenderer) {
          this.particleRenderer.enableAudioReactive();
        }

        // Enable audio effects
        if (this.audioEffects) {
          this.audioEffects.enable();
        }

        this.audioReactiveEnabled = true;
        this.audioInitialized = true;
        this.audioState.isEnabled = true;

        // Auto-optimize settings for best performance
        if (this.audioOptimizer && !this.audioOptimizer.hasOptimized) {
          setTimeout(async () => {
            try {
              await this.audioOptimizer.autoOptimize();
              this.audioOptimizer.hasOptimized = true;
            } catch (error) {
              console.warn("Auto-optimization failed:", error);
            }
          }, 1000); // Delay to allow audio system to stabilize
        }

        // Start smooth transition to audio mode
        this.startAudioModeTransition(true);

        console.log("✅ Audio reactive mode enabled");
      } else if (!enabled && this.audioReactiveEnabled) {
        console.log("Disabling audio reactive mode...");

        // Start smooth transition out of audio mode
        this.startAudioModeTransition(false);

        // Disable audio effects
        if (this.audioEffects) {
          this.audioEffects.disable();
        }

        // Disable audio-reactive features in particle renderer
        if (this.particleRenderer) {
          this.particleRenderer.disableAudioReactive();
        }

        // Stop audio analyzer
        if (this.audioAnalyzer) {
          this.audioAnalyzer.stop();
        }

        this.audioReactiveEnabled = false;
        this.audioState.isEnabled = false;

        console.log("✅ Audio reactive mode disabled");
      }

      // Save audio settings
      this.saveAudioSettings();
    } catch (error) {
      console.error("Failed to toggle audio mode:", error);

      // Reset state on error
      this.audioReactiveEnabled = false;
      this.audioState.isEnabled = false;
      this.audioState.isInitializing = false;

      // Show error to user via console (Audio Mode Switch handles its own errors)
      console.error("Failed to initialize audio:", error.message);
    } finally {
      this.audioState.isInitializing = false;
    }
  }

  /**
   * Set audio visualization mode
   * @param {string} mode - Audio mode ('pulse', 'reactive', 'flow', 'ambient')
   */
  setAudioMode(mode) {
    if (!this.audioReactiveEnabled) {
      console.log("Audio mode not enabled");
      return;
    }

    const validModes = ["pulse", "reactive", "flow", "ambient"];
    if (!validModes.includes(mode)) {
      console.warn(`Invalid audio mode: ${mode}`);
      return;
    }

    console.log(`Setting audio mode to: ${mode}`);

    this.audioState.currentMode = mode;

    if (this.audioEffects) {
      this.audioEffects.setMode(mode);
    }

    // Save settings
    this.saveAudioSettings();
  }

  /**
   * Set audio sensitivity
   * @param {number} sensitivity - Sensitivity value (0.1 - 2.0)
   */
  setAudioSensitivity(sensitivity) {
    const clampedSensitivity = Math.max(0.1, Math.min(2.0, sensitivity));

    console.log(`Setting audio sensitivity to: ${clampedSensitivity}`);

    this.audioState.sensitivity = clampedSensitivity;

    if (this.audioEffects) {
      this.audioEffects.setIntensity(clampedSensitivity);
    }

    // Save settings
    this.saveAudioSettings();
  }

  /**
   * Start smooth transition between normal and audio reactive modes
   * @param {boolean} toAudioMode - Whether transitioning to audio mode
   */
  startAudioModeTransition(toAudioMode) {
    this.audioState.transitionProgress = 0;
    const startTime = performance.now();

    const animateTransition = (currentTime) => {
      const elapsed = currentTime - startTime;
      this.audioState.transitionProgress = Math.min(
        elapsed / this.audioState.transitionDuration,
        1.0
      );

      // Apply transition effects
      this.applyAudioModeTransition(
        toAudioMode,
        this.audioState.transitionProgress
      );

      if (this.audioState.transitionProgress < 1.0) {
        requestAnimationFrame(animateTransition);
      } else {
        console.log(
          `Audio mode transition complete (${
            toAudioMode ? "enabled" : "disabled"
          })`
        );
      }
    };

    requestAnimationFrame(animateTransition);
  }

  /**
   * Apply transition effects during mode switching
   * @param {boolean} toAudioMode - Whether transitioning to audio mode
   * @param {number} progress - Transition progress (0-1)
   */
  applyAudioModeTransition(toAudioMode, progress) {
    if (!this.particleRenderer) return;

    // Smooth transition of visual effects
    const transitionFactor = toAudioMode ? progress : 1.0 - progress;

    // Gradually adjust bloom intensity during transition
    const baseBloom = 1.0;
    const audioBloom = 1.3;
    const currentBloom =
      baseBloom + (audioBloom - baseBloom) * transitionFactor;

    if (this.particleRenderer.updateBloomIntensity) {
      this.particleRenderer.updateBloomIntensity(currentBloom);
    }

    // Gradually adjust particle colors during transition
    if (toAudioMode && this.audioState.lastAudioData) {
      const hue =
        180 + this.audioState.lastAudioData.overall * 180 * transitionFactor;
      if (this.particleRenderer.updateAudioColors) {
        this.particleRenderer.updateAudioColors(hue, 1.0, 0.5);
      }
    } else if (!toAudioMode) {
      // Transition back to default cyan
      const hue = 180;
      if (this.particleRenderer.updateAudioColors) {
        this.particleRenderer.updateAudioColors(hue, 1.0, 0.5);
      }
    }
  }

  /**
   * Save audio settings to localStorage
   */
  saveAudioSettings() {
    try {
      const settings = {
        enabled: this.audioState.isEnabled,
        mode: this.audioState.currentMode,
        sensitivity: this.audioState.sensitivity,
      };

      localStorage.setItem("flux-audio-settings", JSON.stringify(settings));
    } catch (error) {
      console.warn("Failed to save audio settings:", error);
    }
  }

  /**
   * Load audio settings from localStorage
   */
  loadAudioSettings() {
    try {
      const savedSettings = localStorage.getItem("flux-audio-settings");
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);

        // Apply loaded settings
        this.audioState.currentMode = settings.mode || "reactive";
        this.audioState.sensitivity = settings.sensitivity || 1.0;

        // Audio Mode Switch handles its own state, no need to update settings

        console.log("Audio settings loaded:", settings);
      }
    } catch (error) {
      console.warn("Failed to load audio settings:", error);
    }
  }

  /**
   * Simple beat detection based on audio energy
   * @param {Object} audioData - Frequency analysis data
   * @returns {Object} Beat detection data
   */
  detectBeat(audioData) {
    if (!this.beatDetectionState) {
      this.beatDetectionState = {
        energyHistory: [],
        lastBeatTime: 0,
        beatThreshold: 1.3,
      };
    }

    // Calculate current energy (focus on bass for beat detection)
    const currentEnergy = audioData.bass * 0.7 + audioData.mids * 0.3;

    // Add to energy history
    this.beatDetectionState.energyHistory.push(currentEnergy);
    if (this.beatDetectionState.energyHistory.length > 20) {
      this.beatDetectionState.energyHistory.shift();
    }

    // Calculate average energy
    const avgEnergy =
      this.beatDetectionState.energyHistory.reduce((a, b) => a + b, 0) /
      this.beatDetectionState.energyHistory.length;

    // Detect beat
    const currentTime = performance.now();
    const timeSinceLastBeat =
      currentTime - this.beatDetectionState.lastBeatTime;
    const isBeat =
      currentEnergy > avgEnergy * this.beatDetectionState.beatThreshold &&
      timeSinceLastBeat > 300 && // Minimum 300ms between beats
      currentEnergy > 0.1; // Minimum energy threshold

    if (isBeat) {
      this.beatDetectionState.lastBeatTime = currentTime;
    }

    return {
      isBeat,
      energy: currentEnergy,
      strength: isBeat ? Math.min(currentEnergy / avgEnergy, 2.0) : 0,
      bpm: 0, // Could be calculated from beat history
      confidence: isBeat ? 0.8 : 0,
    };
  }

  /**
   * Process audio reactive effects in the render loop
   */
  processAudioReactiveEffects() {
    if (!this.audioAnalyzer || !this.audioEffects || !this.particleRenderer) {
      return;
    }

    try {
      // Get enhanced audio features
      const audioFeatures = this.audioAnalyzer.getAudioFeatures();

      // Store for transition effects
      this.audioState.lastAudioData = audioFeatures;
      this.audioState.lastBeatData = audioFeatures.beat;

      // Update enhanced audio effects with rich audio data
      this.audioEffects.update(audioFeatures);

      // Performance adjustment based on frame rate
      if (this.performanceMonitor.frameCount % 60 === 0) {
        // Every second
        this.audioEffects.adjustPerformance(60);
      }

      // Update bloom intensity based on overall audio energy
      const bloomIntensity = 1.0 + audioFeatures.overall * 0.8;
      this.particleRenderer.updateBloomIntensity(bloomIntensity);

      // Update particle sizes based on treble
      if (audioFeatures.treble > 0.1) {
        this.particleRenderer.updateTrebleSizes(
          audioFeatures.treble,
          audioFeatures.spectrum
        );
      }

      // Create sparkle effects for high frequencies
      if (audioFeatures.treble > 0.3) {
        this.particleRenderer.createSparkleEffects(audioFeatures.treble, 3);
      }

      // Apply beat effects
      if (audioFeatures.beat && audioFeatures.beat.isBeat) {
        this.particleRenderer.applyBeatPulse(audioFeatures.beat.strength);
      }

      // Audio Mode Switch handles its own visualization updates
    } catch (error) {
      console.warn("Error processing audio reactive effects:", error);
    }
  }

  /**
   * Cleanup audio reactive mode resources
   */
  cleanupAudioMode() {
    try {
      console.log("Cleaning up audio reactive mode...");

      // Stop audio analyzer
      if (this.audioAnalyzer) {
        if (typeof this.audioAnalyzer.stop === "function") {
          this.audioAnalyzer.stop();
        }
        this.audioAnalyzer = null;
      }

      // Cleanup audio effects
      if (this.audioEffects) {
        if (typeof this.audioEffects.cleanup === "function") {
          this.audioEffects.cleanup();
        }
        this.audioEffects = null;
      }

      // Cleanup FLUX audio module
      if (this.fluxAudioModule) {
        if (typeof this.fluxAudioModule.destroy === "function") {
          this.fluxAudioModule.destroy();
        }
        this.fluxAudioModule = null;
      }

      // Reset audio state
      this.audioReactiveEnabled = false;
      this.audioInitialized = false;
      this.audioState.isEnabled = false;
      this.audioState.isInitializing = false;

      // Reset particle renderer to normal mode
      if (
        this.particleRenderer &&
        typeof this.particleRenderer.disableAudioReactive === "function"
      ) {
        this.particleRenderer.disableAudioReactive();
      }

      console.log("Audio reactive mode cleanup complete");
    } catch (error) {
      console.warn("Error during audio cleanup:", error);
    }
  }

  startRenderLoop() {
    // Enhanced render loop with proper delta time handling and coordination
    let lastFrameTime = performance.now();
    let accumulator = 0;
    const fixedTimeStep = 1.0 / 60.0; // 60 FPS physics timestep
    const maxFrameTime = 1.0 / 30.0; // Cap at 30 FPS to prevent spiral of death

    // Render loop timing configuration
    const renderConfig = {
      targetFPS: 60,
      targetFrameTime: 16.67, // 1000ms / 60fps
      physicsSubsteps: 1, // Number of physics substeps per frame
      adaptiveTimeStep: false, // Start with simple timestep to avoid issues
      smoothingFactor: 0.1, // For delta time smoothing
    };

    // Delta time smoothing for consistent simulation
    let smoothedDeltaTime = fixedTimeStep;

    PIXI.Ticker.shared.add(() => {
      const frameStartTime = performance.now();

      try {
        // Calculate raw delta time
        let deltaTime = (frameStartTime - lastFrameTime) / 1000.0;
        lastFrameTime = frameStartTime;

        // Clamp delta time to prevent large jumps (spiral of death protection)
        deltaTime = Math.min(deltaTime, maxFrameTime);

        // Smooth delta time for consistent simulation
        smoothedDeltaTime =
          smoothedDeltaTime * (1 - renderConfig.smoothingFactor) +
          deltaTime * renderConfig.smoothingFactor;

        if (this.solver && this.particleRenderer) {
          // Validate solver state before update
          const activeParticleCount = this.solver.get_active_particle_count();

          // Safety check: if too few particles are active, reset the simulation
          if (
            activeParticleCount <
            this.performanceMonitor.minParticleCount / 2
          ) {
            console.warn(
              `⚠️  Too few active particles (${activeParticleCount}), resetting simulation`
            );
            this.resetPhysicsSimulation();
            return;
          }

          if (renderConfig.adaptiveTimeStep) {
            // Frame-rate independent physics with adaptive timestep
            accumulator += deltaTime;

            // Fixed timestep physics updates with accumulator (limited iterations)
            let physicsUpdates = 0;
            while (accumulator >= fixedTimeStep && physicsUpdates < 3) {
              // Update physics with fixed timestep for stability
              this.solver.update(fixedTimeStep);
              accumulator -= fixedTimeStep;
              physicsUpdates++;
            }

            // Prevent accumulator from growing too large
            if (accumulator > fixedTimeStep * 2) {
              accumulator = fixedTimeStep;
            }
          } else {
            // Simple fixed timestep (safer fallback)
            this.solver.update(fixedTimeStep);
          }

          // Get updated positions and validate
          const positions = this.solver.get_positions();
          const newActiveParticleCount =
            this.solver.get_active_particle_count();

          // Validate positions for NaN or extreme values
          if (
            this.validateParticlePositions(positions, newActiveParticleCount)
          ) {
            // Update particle rendering only if positions are valid
            this.particleRenderer.updatePositions(
              positions,
              newActiveParticleCount
            );

            // Process audio reactive effects if enabled
            if (this.audioReactiveEnabled) {
              this.processAudioReactiveEffects();
            }
          } else {
            console.warn(
              "⚠️  Invalid particle positions detected, skipping render update"
            );
          }
        }

        // Enhanced performance monitoring with timing coordination
        this.monitorRenderLoopPerformance(
          frameStartTime,
          deltaTime,
          smoothedDeltaTime
        );
      } catch (error) {
        console.error("Render loop error:", error);
        // Fallback to simple update to prevent freezing
        if (this.solver && this.particleRenderer) {
          this.solver.update(fixedTimeStep);
          const positions = this.solver.get_positions();
          const activeParticleCount = this.solver.get_active_particle_count();
          
          // Update particle positions
          this.particleRenderer.updatePositions(positions, activeParticleCount);
        }
      }
    });

    // Configure ticker for optimal performance
    PIXI.Ticker.shared.maxFPS = renderConfig.targetFPS;

    // Mark bloom as enabled for performance monitoring
    this.performanceMonitor.bloomEnabled = true;
    this.performanceMonitor.renderConfig = renderConfig;

    console.log("Enhanced render loop started with:");
    console.log(
      `- Frame-rate independent physics (${
        renderConfig.adaptiveTimeStep ? "adaptive" : "fixed"
      } timestep)`
    );
    console.log(
      `- Fixed physics timestep: ${fixedTimeStep}s (${1 / fixedTimeStep} FPS)`
    );
    console.log(`- Target render FPS: ${renderConfig.targetFPS}`);
    console.log(`- Delta time smoothing: ${renderConfig.smoothingFactor}`);
    console.log(`- Physics substeps: ${renderConfig.physicsSubsteps}`);
    console.log("- Coordinated physics/rendering updates");
    console.log("- Performance monitoring integration");
    console.log("- Error handling for stability");
  }

  /**
   * Reduce particle count for better performance
   */
  reduceParticleCount() {
    const currentCount = this.performanceMonitor.currentParticleCount;
    const newCount = Math.max(
      this.performanceMonitor.minParticleCount,
      Math.floor(currentCount * (1 - this.performanceMonitor.adjustmentFactor))
    );

    if (newCount !== currentCount) {
      this.performanceMonitor.currentParticleCount = newCount;
      this.config.particleCount = newCount;

      // Update solver particle count
      if (this.solver) {
        this.solver.set_particle_count(newCount);
      }

      // Update renderer particle count
      if (this.particleRenderer) {
        this.particleRenderer.updateParticleCount(newCount);
      }

      console.log(
        `🔽 Performance: Reduced particle count from ${currentCount} to ${newCount}`
      );
      this.performanceMonitor.lastAdjustmentTime = performance.now();
    }
  }

  /**
   * Increase particle count for better visual quality
   */
  increaseParticleCount() {
    const currentCount = this.performanceMonitor.currentParticleCount;
    const newCount = Math.min(
      this.performanceMonitor.maxParticleCount,
      Math.floor(currentCount * (1 + this.performanceMonitor.adjustmentFactor))
    );

    if (newCount !== currentCount) {
      this.performanceMonitor.currentParticleCount = newCount;
      this.config.particleCount = newCount;

      // Update solver particle count
      if (this.solver) {
        this.solver.set_particle_count(newCount);
      }

      // Update renderer particle count
      if (this.particleRenderer) {
        this.particleRenderer.updateParticleCount(newCount);
      }

      console.log(
        `🔼 Performance: Increased particle count from ${currentCount} to ${newCount}`
      );
      this.performanceMonitor.lastAdjustmentTime = performance.now();
    }
  }

  /**
   * Automatically adjust particle count based on performance
   */
  adjustParticleCountBasedOnPerformance(avgFrameTime) {
    const currentTime = performance.now();
    const timeSinceLastAdjustment =
      currentTime - this.performanceMonitor.lastAdjustmentTime;

    // Only adjust if enough time has passed since last adjustment
    if (timeSinceLastAdjustment < this.performanceMonitor.adjustmentCooldown) {
      return;
    }

    // Check if performance is poor and we can reduce particles
    if (avgFrameTime > this.performanceMonitor.poorPerformanceThreshold) {
      if (
        this.performanceMonitor.currentParticleCount >
        this.performanceMonitor.minParticleCount
      ) {
        this.reduceParticleCount();
        console.log(
          `⚠️  Poor performance detected (${avgFrameTime.toFixed(
            2
          )}ms frame time)`
        );
      }
    }
    // Check if performance is good and we can increase particles
    else if (avgFrameTime < this.performanceMonitor.goodPerformanceThreshold) {
      if (
        this.performanceMonitor.currentParticleCount <
        this.performanceMonitor.maxParticleCount
      ) {
        this.increaseParticleCount();
        console.log(
          `✅ Good performance detected (${avgFrameTime.toFixed(
            2
          )}ms frame time)`
        );
      }
    }
  }

  /**
   * Enhanced performance monitoring integrated with render loop coordination
   */
  monitorRenderLoopPerformance(frameStartTime, deltaTime, smoothedDeltaTime) {
    try {
      const frameEndTime = performance.now();
      const frameTime = frameEndTime - frameStartTime;

      // Track both frame time and delta time for comprehensive monitoring
      this.performanceMonitor.frameTimeHistory.push(frameTime);
      if (
        this.performanceMonitor.frameTimeHistory.length >
        this.performanceMonitor.maxHistoryLength
      ) {
        this.performanceMonitor.frameTimeHistory.shift();
      }

      // Track delta time history for timing consistency analysis (less frequently)
      if (!this.performanceMonitor.deltaTimeHistory) {
        this.performanceMonitor.deltaTimeHistory = [];
      }

      // Only track delta time every 5th frame to reduce overhead
      if (this.performanceMonitor.frameCount % 5 === 0) {
        this.performanceMonitor.deltaTimeHistory.push(deltaTime * 1000); // Convert to ms
        if (
          this.performanceMonitor.deltaTimeHistory.length >
          this.performanceMonitor.maxHistoryLength / 5
        ) {
          this.performanceMonitor.deltaTimeHistory.shift();
        }
      }

      this.performanceMonitor.frameCount++;

      // Enhanced performance analysis every interval (less frequent to reduce overhead)
      if (
        this.performanceMonitor.frameCount %
          (this.performanceMonitor.performanceCheckInterval * 2) ===
        0
      ) {
        if (this.performanceMonitor.frameTimeHistory.length >= 30) {
          // Calculate comprehensive performance metrics
          const avgFrameTime =
            this.performanceMonitor.frameTimeHistory.reduce(
              (a, b) => a + b,
              0
            ) / this.performanceMonitor.frameTimeHistory.length;
          const avgFPS = 1000 / avgFrameTime;
          const maxFrameTime = Math.max(
            ...this.performanceMonitor.frameTimeHistory
          );
          const minFrameTime = Math.min(
            ...this.performanceMonitor.frameTimeHistory
          );

          // Calculate timing consistency (lower is better) - only if we have delta data
          let timingConsistency = 0;
          let avgDeltaTime = 0;
          if (this.performanceMonitor.deltaTimeHistory.length > 10) {
            avgDeltaTime =
              this.performanceMonitor.deltaTimeHistory.reduce(
                (a, b) => a + b,
                0
              ) / this.performanceMonitor.deltaTimeHistory.length;
            const deltaTimeVariance = this.calculateVariance(
              this.performanceMonitor.deltaTimeHistory
            );
            timingConsistency = Math.sqrt(deltaTimeVariance);
          }

          // Log comprehensive performance stats
          console.log(`📊 Enhanced Performance Monitor:`);
          console.log(
            `- Render FPS: ${avgFPS.toFixed(1)} (target: ${
              this.performanceMonitor.targetFPS
            })`
          );
          console.log(
            `- Frame time: ${avgFrameTime.toFixed(2)}ms (target: <${
              this.performanceMonitor.targetFrameTime
            }ms)`
          );
          console.log(
            `- Frame time range: ${minFrameTime.toFixed(
              2
            )}ms - ${maxFrameTime.toFixed(2)}ms`
          );

          if (avgDeltaTime > 0) {
            console.log(
              `- Delta time: ${avgDeltaTime.toFixed(2)}ms (smoothed: ${(
                smoothedDeltaTime * 1000
              ).toFixed(2)}ms)`
            );
            console.log(
              `- Timing consistency: ${timingConsistency.toFixed(
                2
              )}ms (lower is better)`
            );
          }

          console.log(
            `- Current particles: ${this.performanceMonitor.currentParticleCount}`
          );
          console.log(
            `- Particle range: ${this.performanceMonitor.minParticleCount} - ${this.performanceMonitor.maxParticleCount}`
          );
          console.log(
            `- Bloom enabled: ${this.performanceMonitor.bloomEnabled}`
          );

          // Enhanced performance analysis
          const renderConfig = this.performanceMonitor.renderConfig;
          if (renderConfig) {
            console.log(
              `- Physics timestep: ${
                renderConfig.adaptiveTimeStep ? "adaptive" : "fixed"
              }`
            );
            console.log(`- Physics substeps: ${renderConfig.physicsSubsteps}`);
            console.log(`- Delta smoothing: ${renderConfig.smoothingFactor}`);
          }

          // Automatically adjust particle count based on performance
          this.adjustParticleCountBasedOnPerformance(avgFrameTime);

          // Enhanced performance status with timing analysis
          if (avgFrameTime > this.performanceMonitor.poorPerformanceThreshold) {
            console.warn(
              `🔴 Poor performance: ${avgFrameTime.toFixed(2)}ms frame time`
            );
            if (timingConsistency > 5.0) {
              console.warn(
                `⚠️  Inconsistent timing detected: ${timingConsistency.toFixed(
                  2
                )}ms variance`
              );
            }
          } else if (avgFrameTime > this.performanceMonitor.targetFrameTime) {
            console.warn(
              `🟡 Below target: ${avgFrameTime.toFixed(2)}ms frame time`
            );
          } else {
            console.log(
              `🟢 Good performance: ${avgFrameTime.toFixed(2)}ms frame time`
            );
            if (timingConsistency > 0 && timingConsistency < 2.0) {
              console.log(
                `✨ Excellent timing consistency: ${timingConsistency.toFixed(
                  2
                )}ms variance`
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("Performance monitoring error:", error);
      // Fallback to basic monitoring
      this.performanceMonitor.frameCount++;
    }
  }

  /**
   * Calculate variance for timing consistency analysis
   */
  calculateVariance(values) {
    if (values.length === 0) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDifferences = values.map((value) => Math.pow(value - mean, 2));
    return squaredDifferences.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Fine-tune render loop timing for optimal performance
   */
  optimizeRenderLoopTiming() {
    if (!this.performanceMonitor.renderConfig) {
      console.warn("Render config not available for optimization");
      return;
    }

    const config = this.performanceMonitor.renderConfig;
    const frameHistory = this.performanceMonitor.frameTimeHistory;

    if (frameHistory.length < 60) {
      console.log("Not enough performance data for optimization");
      return;
    }

    const avgFrameTime =
      frameHistory.reduce((a, b) => a + b, 0) / frameHistory.length;
    const timingConsistency = Math.sqrt(
      this.calculateVariance(this.performanceMonitor.deltaTimeHistory || [])
    );

    console.log("🔧 Optimizing render loop timing...");

    // Adjust smoothing factor based on timing consistency
    if (timingConsistency > 5.0) {
      // High variance - increase smoothing
      config.smoothingFactor = Math.min(0.3, config.smoothingFactor + 0.05);
      console.log(
        `Increased delta time smoothing to ${config.smoothingFactor} for better consistency`
      );
    } else if (timingConsistency < 1.0 && config.smoothingFactor > 0.05) {
      // Very consistent - reduce smoothing for responsiveness
      config.smoothingFactor = Math.max(0.05, config.smoothingFactor - 0.02);
      console.log(
        `Reduced delta time smoothing to ${config.smoothingFactor} for better responsiveness`
      );
    }

    // Adjust physics substeps based on performance
    if (avgFrameTime > this.performanceMonitor.targetFrameTime * 1.2) {
      // Poor performance - reduce substeps
      config.physicsSubsteps = Math.max(1, config.physicsSubsteps - 1);
      console.log(
        `Reduced physics substeps to ${config.physicsSubsteps} for better performance`
      );
    } else if (
      avgFrameTime < this.performanceMonitor.targetFrameTime * 0.8 &&
      config.physicsSubsteps < 3
    ) {
      // Good performance - can afford more substeps for accuracy
      config.physicsSubsteps = Math.min(3, config.physicsSubsteps + 1);
      console.log(
        `Increased physics substeps to ${config.physicsSubsteps} for better accuracy`
      );
    }

    // Toggle adaptive timestep based on performance stability
    const frameTimeVariance = this.calculateVariance(frameHistory);
    if (frameTimeVariance > 25.0 && !config.adaptiveTimeStep) {
      config.adaptiveTimeStep = true;
      console.log("Enabled adaptive timestep due to frame time variance");
    } else if (frameTimeVariance < 5.0 && config.adaptiveTimeStep) {
      config.adaptiveTimeStep = false;
      console.log("Disabled adaptive timestep due to stable performance");
    }

    console.log("✅ Render loop timing optimization complete");
  }

  /**
   * Validate particle positions for NaN or extreme values
   */
  validateParticlePositions(positions, activeParticleCount) {
    if (!positions || positions.length === 0) {
      return false;
    }

    // Check for NaN or extreme values
    for (let i = 0; i < activeParticleCount * 2; i++) {
      const value = positions[i];
      if (isNaN(value) || !isFinite(value) || Math.abs(value) > 10000) {
        console.warn(`Invalid position value at index ${i}: ${value}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Reset physics simulation when particles get into invalid states
   */
  resetPhysicsSimulation() {
    try {
      console.log("🔄 Resetting physics simulation...");

      // Recreate the solver with current settings
      const currentParticleCount = this.performanceMonitor.currentParticleCount;
      this.solver = new this.wasmModule.Solver(
        currentParticleCount,
        this.config.containerWidth,
        this.config.containerHeight
      );

      // Update renderer particle count to match
      if (this.particleRenderer) {
        this.particleRenderer.updateParticleCount(currentParticleCount);
      }

      console.log(
        `✅ Physics simulation reset with ${currentParticleCount} particles`
      );
    } catch (error) {
      console.error("Failed to reset physics simulation:", error);
      // Fallback: reduce particle count and try again
      this.performanceMonitor.currentParticleCount = Math.max(
        this.performanceMonitor.minParticleCount,
        Math.floor(this.performanceMonitor.currentParticleCount * 0.5)
      );
      console.log(
        `Reducing particle count to ${this.performanceMonitor.currentParticleCount} and retrying...`
      );
    }
  }

  /**
   * Get detailed render loop performance metrics
   */
  getRenderLoopMetrics() {
    const frameHistory = this.performanceMonitor.frameTimeHistory;
    const deltaHistory = this.performanceMonitor.deltaTimeHistory || [];

    if (frameHistory.length === 0) {
      return { error: "No performance data available" };
    }

    const avgFrameTime =
      frameHistory.reduce((a, b) => a + b, 0) / frameHistory.length;
    const avgDeltaTime =
      deltaHistory.length > 0
        ? deltaHistory.reduce((a, b) => a + b, 0) / deltaHistory.length
        : 0;

    return {
      renderFPS: 1000 / avgFrameTime,
      actualFPS: avgDeltaTime > 0 ? 1000 / avgDeltaTime : 0,
      avgFrameTime: avgFrameTime,
      avgDeltaTime: avgDeltaTime,
      timingConsistency: Math.sqrt(this.calculateVariance(deltaHistory)),
      frameTimeVariance: this.calculateVariance(frameHistory),
      particleCount: this.performanceMonitor.currentParticleCount,
      renderConfig: this.performanceMonitor.renderConfig,
      isOptimal:
        avgFrameTime < this.performanceMonitor.targetFrameTime &&
        Math.sqrt(this.calculateVariance(deltaHistory)) < 3.0,
    };
  }

  clearFallbackMessage() {
    // Remove any existing fallback messages
    const existingFallback = document.querySelector(".flux-fallback");
    if (existingFallback) {
      existingFallback.remove();
    }

    // Show canvas and title if they exist
    if (this.canvas) {
      this.canvas.style.display = "block";
    }
    const title = document.querySelector(".title");
    if (title) {
      title.style.display = "block";
    }
  }

  showFallbackMessage() {
    // Create fallback UI when WASM fails to load
    const fallbackDiv = document.createElement("div");
    fallbackDiv.className = "flux-fallback";
    fallbackDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #00FFFF;
            font-family: 'IBM Plex Mono', monospace;
            font-size: 18px;
            text-align: center;
            z-index: 1000;
            background: rgba(13, 13, 13, 0.9);
            padding: 20px;
            border: 1px solid #00FFFF;
            border-radius: 4px;
        `;

    fallbackDiv.innerHTML = `
            <h2>FLUX - Physics Engine Unavailable</h2>
            <p>WebAssembly module failed to load.</p>
            <p>Please ensure your browser supports WebAssembly and try refreshing the page.</p>
        `;

    document.body.appendChild(fallbackDiv);

    // Hide the canvas and title if they exist
    if (this.canvas) {
      this.canvas.style.display = "none";
    }
    const title = document.querySelector(".title");
    if (title) {
      title.style.display = "none";
    }
  }

  /**
   * Setup device audio reactive capability
   * Adds a simple UI to enable device audio reactive mode
   */
  setupDeviceAudio() {
    try {
      // Try the enhanced version first, fallback to simple version
      import("./audio/examples/device-audio-setup.js")
        .then(({ enableDeviceAudioReactive }) => {
          enableDeviceAudioReactive(this, this.container);
          console.log(
            "🎵 Enhanced audio reactive mode available - click the button to enable!"
          );
        })
        .catch((error) => {
          console.log(
            "Enhanced audio not available, trying simple version...",
            error.message
          );

          // Fallback to simple version
          import("./audio/core/simple-audio-reactive.js")
            .then(({ setupSimpleAudioReactive }) => {
              setupSimpleAudioReactive(this, this.container);
              console.log(
                "🎵 Simple audio reactive mode available - click the button to enable!"
              );
            })
            .catch((fallbackError) => {
              console.log(
                "Audio reactive not available:",
                fallbackError.message
              );
            });
        });
    } catch (error) {
      console.log("Device audio setup skipped:", error.message);
    }
  }
}

// Export FluxApplication for testing
export { FluxApplication };

// Default export for easy initialization
export default async function initFlux() {
  const app = new FluxApplication();
  await app.init();
  return app;
}

// Initialize the application when the page loads
document.addEventListener("DOMContentLoaded", async () => {
  const app = new FluxApplication();
  await app.init();

  // Expose app and bloom toggle for debugging
  window.fluxApp = app;
  window.toggleBloom = () => {
    if (app.particleRenderer) {
      app.particleRenderer.toggleBloomEffect();
    } else {
      console.log("Particle renderer not ready yet");
    }
  };

  window.debugBloom = () => {
    if (app.particleRenderer) {
      console.log("=== BLOOM DEBUG INFO ===");
      console.log(
        "Main container filters:",
        app.particleRenderer.container.filters
      );
      if (
        app.particleRenderer.container.filters &&
        app.particleRenderer.container.filters.length > 0
      ) {
        const filter = app.particleRenderer.container.filters[0];
        console.log("Filter type:", filter.constructor.name);
        if (filter instanceof AdvancedBloomFilter) {
          console.log("AdvancedBloomFilter settings:");
          console.log("  threshold:", filter.threshold);
          console.log("  bloomScale:", filter.bloomScale);
          console.log("  brightness:", filter.brightness);
          console.log("  blur:", filter.blur);
          console.log("  quality:", filter.quality);
        }
      }
      console.log("Particle count:", app.particleRenderer.particleCount);
      console.log(
        "Main container children:",
        app.particleRenderer.container.children.length
      );
    } else {
      console.log("Particle renderer not ready yet");
    }
  };

  // Expose performance control methods for debugging
  window.reduceParticles = () => {
    if (app.performanceMonitor) {
      app.reduceParticleCount();
    } else {
      console.log("Performance monitor not ready yet");
    }
  };

  window.increaseParticles = () => {
    if (app.performanceMonitor) {
      app.increaseParticleCount();
    } else {
      console.log("Performance monitor not ready yet");
    }
  };

  window.setParticleCount = (count) => {
    if (app.performanceMonitor && app.solver && app.particleRenderer) {
      const clampedCount = Math.max(
        app.performanceMonitor.minParticleCount,
        Math.min(app.performanceMonitor.maxParticleCount, count)
      );
      app.performanceMonitor.currentParticleCount = clampedCount;
      app.config.particleCount = clampedCount;
      app.solver.set_particle_count(clampedCount);
      app.particleRenderer.updateParticleCount(clampedCount);
      
      // Update control panel display
      if (app.controlPanel && app.controlPanel.updateParticleCountDisplay) {
        app.controlPanel.updateParticleCountDisplay(clampedCount);
      }
      
      console.log(`Set particle count to ${clampedCount}`);
    } else {
      console.log("Application not ready yet");
    }
  };

  window.getPerformanceStats = () => {
    if (app.performanceMonitor) {
      const metrics = app.getRenderLoopMetrics();
      if (metrics.error) {
        console.log(metrics.error);
        return metrics;
      }

      console.log("📊 Enhanced Performance Stats:");
      console.log(`- Render FPS: ${metrics.renderFPS.toFixed(1)}`);
      console.log(`- Actual FPS: ${metrics.actualFPS.toFixed(1)}`);
      console.log(`- Frame time: ${metrics.avgFrameTime.toFixed(2)}ms`);
      console.log(`- Delta time: ${metrics.avgDeltaTime.toFixed(2)}ms`);
      console.log(
        `- Timing consistency: ${metrics.timingConsistency.toFixed(2)}ms`
      );
      console.log(`- Frame variance: ${metrics.frameTimeVariance.toFixed(2)}`);
      console.log(`- Current particles: ${metrics.particleCount}`);
      console.log(`- Performance optimal: ${metrics.isOptimal ? "✅" : "❌"}`);

      if (metrics.renderConfig) {
        console.log("🔧 Render Configuration:");
        console.log(
          `- Adaptive timestep: ${metrics.renderConfig.adaptiveTimeStep}`
        );
        console.log(
          `- Physics substeps: ${metrics.renderConfig.physicsSubsteps}`
        );
        console.log(
          `- Delta smoothing: ${metrics.renderConfig.smoothingFactor}`
        );
      }

      return metrics;
    } else {
      console.log("Performance monitor not ready yet");
    }
  };

  window.optimizeRenderLoop = () => {
    if (app.optimizeRenderLoopTiming) {
      app.optimizeRenderLoopTiming();
    } else {
      console.log("Render loop optimization not available yet");
    }
  };

  window.toggleAdaptiveTimestep = () => {
    if (app.performanceMonitor && app.performanceMonitor.renderConfig) {
      const config = app.performanceMonitor.renderConfig;
      config.adaptiveTimeStep = !config.adaptiveTimeStep;
      console.log(
        `Adaptive timestep ${config.adaptiveTimeStep ? "enabled" : "disabled"}`
      );
    } else {
      console.log("Render config not available yet");
    }
  };

  window.setPhysicsSubsteps = (substeps) => {
    if (app.performanceMonitor && app.performanceMonitor.renderConfig) {
      const config = app.performanceMonitor.renderConfig;
      config.physicsSubsteps = Math.max(1, Math.min(5, substeps));
      console.log(`Physics substeps set to ${config.physicsSubsteps}`);
    } else {
      console.log("Render config not available yet");
    }
  };

  window.setSmoothingFactor = (factor) => {
    if (app.performanceMonitor && app.performanceMonitor.renderConfig) {
      const config = app.performanceMonitor.renderConfig;
      config.smoothingFactor = Math.max(0.01, Math.min(0.5, factor));
      console.log(
        `Delta time smoothing factor set to ${config.smoothingFactor}`
      );
    } else {
      console.log("Render config not available yet");
    }
  };

  window.resetSimulation = () => {
    if (app.resetPhysicsSimulation) {
      app.resetPhysicsSimulation();
    } else {
      console.log("Reset function not available yet");
    }
  };

  window.validatePositions = () => {
    if (app.solver) {
      const positions = app.solver.get_positions();
      const activeCount = app.solver.get_active_particle_count();
      const isValid = app.validateParticlePositions(positions, activeCount);
      console.log(
        `Position validation: ${isValid ? "✅ Valid" : "❌ Invalid"}`
      );
      console.log(`Active particles: ${activeCount}`);
      console.log(`Position array length: ${positions.length}`);
      return { isValid, activeCount, positionCount: positions.length };
    } else {
      console.log("Solver not available yet");
      return { isValid: false, activeCount: 0, positionCount: 0 };
    }
  };

  // Audio reactive mode debug commands
  window.toggleAudioMode = (enabled) => {
    if (app.toggleAudioMode) {
      app.toggleAudioMode(enabled);
    } else {
      console.log("Audio mode not available yet");
    }
  };

  window.setAudioMode = (mode) => {
    if (app.setAudioMode) {
      app.setAudioMode(mode);
    } else {
      console.log("Audio mode not available yet");
    }
  };

  window.setAudioSensitivity = (sensitivity) => {
    if (app.setAudioSensitivity) {
      app.setAudioSensitivity(sensitivity);
    } else {
      console.log("Audio mode not available yet");
    }
  };

  window.getAudioState = () => {
    if (app.audioState) {
      console.log("Audio State:", app.audioState);
      console.log("Audio Reactive Enabled:", app.audioReactiveEnabled);
      console.log("Audio Initialized:", app.audioInitialized);
      return {
        state: app.audioState,
        enabled: app.audioReactiveEnabled,
        initialized: app.audioInitialized,
      };
    } else {
      console.log("Audio state not available yet");
    }
  };



  // Enhanced features debug commands
  window.toggleTrails = () => {
    if (app.trailSystem) {
      app.trailSystem.toggle();
    } else {
      console.log("Trail system not available yet");
    }
  };

  window.toggleBackgroundEffects = () => {
    if (app.backgroundEffects) {
      app.backgroundEffects.toggle();
    } else {
      console.log("Background effects not available yet");
    }
  };

  window.toggleControlPanel = () => {
    if (app.controlPanel) {
      app.controlPanel.toggle();
    } else {
      console.log("Control panel not available yet");
    }
  };

  window.showControlPanel = () => {
    if (app.controlPanel) {
      app.controlPanel.show();
      console.log("🎛️ Control panel should now be visible");
    } else {
      console.log("Control panel not available yet");
    }
  };

  window.debugControlPanel = () => {
    if (app.controlPanel) {
      console.log("=== CONTROL PANEL DEBUG ===");
      console.log("Panel object:", app.controlPanel);
      console.log("Panel visible:", app.controlPanel.isVisible);
      console.log("Current theme:", app.controlPanel.currentTheme);
      console.log("Current settings:", app.controlPanel.getCurrentSettings());
      return app.controlPanel.getControlSummary();
    } else {
      console.log("Control panel not available yet");
      return null;
    }
  };

  window.applyControlSettings = () => {
    if (app.controlPanel) {
      app.controlPanel.applyCurrentSettings();
    } else {
      console.log("Control panel not available yet");
    }
  };

  window.syncControls = () => {
    if (app.controlPanel) {
      app.controlPanel.syncControlsWithAppState();
    } else {
      console.log("Control panel not available yet");
    }
  };

  window.testSliders = () => {
    console.log('🧪 Testing sliders manually...');
    
    // Test particle count slider
    const particleSlider = document.getElementById('particle-count');
    if (particleSlider) {
      console.log('Testing particle count slider...');
      particleSlider.value = 600;
      particleSlider.dispatchEvent(new Event('input'));
      console.log('✅ Particle count slider test dispatched');
    } else {
      console.log('❌ Particle count slider not found');
    }
    
    // Test bloom slider
    const bloomSlider = document.getElementById('bloom-intensity');
    if (bloomSlider) {
      console.log('Testing bloom intensity slider...');
      bloomSlider.value = 2.0;
      bloomSlider.dispatchEvent(new Event('input'));
      console.log('✅ Bloom intensity slider test dispatched');
    } else {
      console.log('❌ Bloom intensity slider not found');
    }
    
    // Test size slider
    const sizeSlider = document.getElementById('particle-size');
    if (sizeSlider) {
      console.log('Testing particle size slider...');
      sizeSlider.value = 1.5;
      sizeSlider.dispatchEvent(new Event('input'));
      console.log('✅ Particle size slider test dispatched');
    } else {
      console.log('❌ Particle size slider not found');
    }
    
    console.log('🎉 Slider tests completed');
  };

  window.diagnoseSliders = () => {
    console.log('🔍 DIAGNOSING ALL SLIDERS...');
    
    const sliders = [
      'particle-count',
      'gravity', 
      'damping',
      'bloom-intensity',
      'particle-size',
      'audio-sensitivity'
    ];
    
    sliders.forEach(sliderId => {
      const slider = document.getElementById(sliderId);
      const display = document.getElementById(sliderId + '-value');
      
      console.log(`\n📊 ${sliderId}:`);
      console.log(`  - Slider exists: ${!!slider}`);
      console.log(`  - Display exists: ${!!display}`);
      
      if (slider) {
        console.log(`  - Current value: ${slider.value}`);
        console.log(`  - Min: ${slider.min}, Max: ${slider.max}`);
        console.log(`  - Has event listeners: ${slider.onclick !== null || slider.oninput !== null}`);
        
        // Try to manually trigger the slider
        const oldValue = slider.value;
        slider.value = parseFloat(slider.max) * 0.7; // Set to 70% of max
        slider.dispatchEvent(new Event('input'));
        console.log(`  - Test: Changed from ${oldValue} to ${slider.value}`);
      }
      
      if (display) {
        console.log(`  - Display text: "${display.textContent}"`);
      }
    });
    
    console.log('\n🎛️ Control Panel Object:');
    if (app.controlPanel) {
      console.log('  - Control panel exists: ✅');
      console.log('  - Panel visible:', app.controlPanel.isVisible);
      console.log('  - Panel element in DOM:', document.body.contains(app.controlPanel.panel));
    } else {
      console.log('  - Control panel exists: ❌');
    }
  };

  window.createTestSlider = () => {
    console.log('🧪 Creating test slider...');
    
    // Create a simple test slider
    const testDiv = document.createElement('div');
    testDiv.style.cssText = `
      position: fixed;
      top: 50px;
      left: 50px;
      background: rgba(0, 0, 0, 0.9);
      border: 2px solid #ff0000;
      padding: 20px;
      color: #ff0000;
      font-family: monospace;
      z-index: 10000;
    `;
    
    testDiv.innerHTML = `
      <h3>Test Slider</h3>
      <label>Test Value: <span id="test-value">50</span></label><br>
      <input type="range" id="test-slider" min="0" max="100" value="50" step="1">
      <button onclick="document.body.removeChild(this.parentElement)">Close</button>
    `;
    
    document.body.appendChild(testDiv);
    
    // Add event listener to test slider
    const testSlider = document.getElementById('test-slider');
    const testValue = document.getElementById('test-value');
    
    if (testSlider && testValue) {
      testSlider.addEventListener('input', (e) => {
        const value = e.target.value;
        testValue.textContent = value;
        console.log(`🎛️ Test slider changed to: ${value}`);
        
        // Test if we can call control panel methods
        if (app.controlPanel) {
          console.log('✅ Control panel accessible from test slider');
        } else {
          console.log('❌ Control panel not accessible from test slider');
        }
      });
      
      console.log('✅ Test slider created and event listener added');
    } else {
      console.log('❌ Failed to create test slider elements');
    }
  };

  window.testPhysicsSliders = () => {
    console.log('🧪 Testing physics sliders specifically...');
    
    // Test gravity slider
    const gravitySlider = document.getElementById('gravity');
    if (gravitySlider) {
      console.log('Testing gravity slider...');
      gravitySlider.value = 1.5;
      gravitySlider.dispatchEvent(new Event('input'));
      console.log('✅ Gravity slider test dispatched');
      
      // Test with different value after 2 seconds
      setTimeout(() => {
        gravitySlider.value = 0.2;
        gravitySlider.dispatchEvent(new Event('input'));
        console.log('✅ Gravity slider second test dispatched');
      }, 2000);
    } else {
      console.log('❌ Gravity slider not found');
    }
    
    // Test damping slider
    const dampingSlider = document.getElementById('damping');
    if (dampingSlider) {
      console.log('Testing damping slider...');
      dampingSlider.value = 0.95;
      dampingSlider.dispatchEvent(new Event('input'));
      console.log('✅ Damping slider test dispatched');
      
      // Test with different value after 3 seconds
      setTimeout(() => {
        dampingSlider.value = 0.98;
        dampingSlider.dispatchEvent(new Event('input'));
        console.log('✅ Damping slider second test dispatched');
      }, 3000);
    } else {
      console.log('❌ Damping slider not found');
    }
    
    console.log('🎉 Physics slider tests completed');
  };

  window.setQuality = (quality) => {
    if (app.performanceOptimizer) {
      app.performanceOptimizer.setQualityLevel(quality);
    } else {
      console.log("Performance optimizer not available yet");
    }
  };

  window.getPerformanceReport = () => {
    if (app.performanceOptimizer) {
      return app.performanceOptimizer.getPerformanceReport();
    } else {
      console.log("Performance optimizer not available yet");
      return null;
    }
  };

  console.log("🔧 Debug commands:");
  console.log("  toggleBloom() - Toggle bloom effect on/off");
  console.log("  debugBloom() - Show bloom debug information");
  console.log("  reduceParticles() - Manually reduce particle count");
  console.log("  increaseParticles() - Manually increase particle count");
  console.log("  setParticleCount(n) - Set specific particle count");
  console.log("  getPerformanceStats() - Show enhanced performance statistics");
  console.log("  optimizeRenderLoop() - Auto-optimize render loop timing");
  console.log("  toggleAdaptiveTimestep() - Toggle adaptive timestep on/off");
  console.log("  setPhysicsSubsteps(n) - Set physics substeps (1-5)");
  console.log("  setSmoothingFactor(f) - Set delta time smoothing (0.01-0.5)");
  console.log(
    "  resetSimulation() - Reset physics simulation if particles get stuck"
  );
  console.log("  validatePositions() - Check if particle positions are valid");
  console.log("🎵 Audio reactive mode commands:");
  console.log(
    "  toggleAudioMode(true/false) - Enable/disable audio reactive mode"
  );
  console.log(
    '  setAudioMode("pulse"|"reactive"|"flow"|"ambient") - Set audio visualization mode'
  );
  console.log("  setAudioSensitivity(0.1-2.0) - Set audio sensitivity");
  console.log("  getAudioState() - Show current audio reactive state");
  console.log("🎛️ Control panel commands:");
  console.log("  toggleControlPanel() - Show/hide control panel");
  console.log("  showControlPanel() - Force show control panel");
  console.log("  debugControlPanel() - Debug control panel state");
  console.log("  applyControlSettings() - Apply current control panel settings");
  console.log("  syncControls() - Sync controls with application state");
  console.log("  testSliders() - Manually test all sliders");
  console.log("  testPhysicsSliders() - Test gravity and damping sliders specifically");
  console.log("  diagnoseSliders() - Diagnose all slider issues");
  console.log("  createTestSlider() - Create a test slider to verify functionality");
  console.log("  testSliderMovement() - Test if sliders can be moved and check CSS");
  console.log("  forceEnableSliders() - Force enable all sliders with red borders");
  console.log("  fixPhysicsSliders() - Specifically fix gravity and damping sliders");
  console.log("  createNewPhysicsSliders() - Create brand new physics sliders");
  console.log("  fixStuckSliders() - Recreate gravity and particle-count sliders");
  console.log("  testAllSliders() - Test which sliders can move");
  console.log("  createSimpleControls() - Create backup control panel");
  console.log("  testToggleButton() - Test if the control panel toggle button works");
  console.log("  fixToggleButton() - Fix the control panel toggle button");
  console.log("  createNewToggleButton() - Create a big red toggle button that definitely works");
});
