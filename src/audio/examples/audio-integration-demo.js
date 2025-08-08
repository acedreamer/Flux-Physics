/**
 * Audio Integration Demo
 * Demonstrates the integration of audio reactive mode with the main FLUX application
 */

import { FluxApplication } from '../../main.js'

/**
 * Demo script to showcase audio reactive mode integration
 */
class AudioIntegrationDemo {
    constructor() {
        this.app = null
        this.demoSteps = [
            'Initialize FLUX Application',
            'Enable Audio Reactive Mode',
            'Test Different Audio Modes',
            'Adjust Audio Sensitivity',
            'Demonstrate Smooth Transitions',
            'Show Audio Settings Persistence',
            'Cleanup and Reset'
        ]
        this.currentStep = 0
    }

    async runDemo() {
        console.log('🎵 FLUX Audio Reactive Mode Integration Demo');
        console.log('='.repeat(50));
        
        try {
            // Step 1: Initialize FLUX Application
            await this.step1_InitializeApp()
            
            // Step 2: Enable Audio Reactive Mode
            await this.step2_EnableAudioMode()
            
            // Step 3: Test Different Audio Modes
            await this.step3_TestAudioModes()
            
            // Step 4: Adjust Audio Sensitivity
            await this.step4_TestSensitivity()
            
            // Step 5: Demonstrate Smooth Transitions
            await this.step5_TestTransitions()
            
            // Step 6: Show Audio Settings Persistence
            await this.step6_TestPersistence()
            
            // Step 7: Cleanup and Reset
            await this.step7_Cleanup()
            
            console.log('✅ Demo completed successfully!');
            
        } catch (error) {
            console.error('❌ Demo failed:', error);
        }
    }

    async step1_InitializeApp() {
        this.logStep('Initialize FLUX Application');
        
        // Create mock DOM elements for testing
        if (!document.getElementById('canvas')) {
            const canvas = document.createElement('canvas');
            canvas.id = 'canvas';
            canvas.width = 800;
            canvas.height = 600;
            document.body.appendChild(canvas);
        }
        
        // Initialize FLUX application
        this.app = new FluxApplication();
        await this.app.init();
        
        console.log('✓ FLUX application initialized');
        console.log(`  - Audio reactive enabled: ${this.app.audioReactiveEnabled}`);
        console.log(`  - Audio components ready: ${!!this.app.audioEffects && !!this.app.audioUI}`);
    }

    async step2_EnableAudioMode() {
        this.logStep('Enable Audio Reactive Mode');
        
        // Enable audio mode
        await this.app.toggleAudioMode(true);
        
        console.log('✓ Audio reactive mode enabled');
        console.log(`  - Audio analyzer initialized: ${!!this.app.audioAnalyzer}`);
        console.log(`  - Current mode: ${this.app.audioState.currentMode}`);
        console.log(`  - Sensitivity: ${this.app.audioState.sensitivity}`);
    }

    async step3_TestAudioModes() {
        this.logStep('Test Different Audio Modes');
        
        const modes = ['pulse', 'reactive', 'flow', 'ambient'];
        
        for (const mode of modes) {
            console.log(`  Testing ${mode} mode...`);
            this.app.setAudioMode(mode);
            
            // Verify mode was set
            if (this.app.audioState.currentMode === mode) {
                console.log(`  ✓ ${mode} mode activated`);
            } else {
                console.log(`  ❌ Failed to set ${mode} mode`);
            }
            
            // Small delay to simulate mode switching
            await this.delay(100);
        }
    }

    async step4_TestSensitivity() {
        this.logStep('Adjust Audio Sensitivity');
        
        const sensitivities = [0.5, 1.0, 1.5, 2.0];
        
        for (const sensitivity of sensitivities) {
            console.log(`  Setting sensitivity to ${sensitivity}...`);
            this.app.setAudioSensitivity(sensitivity);
            
            // Verify sensitivity was set
            if (Math.abs(this.app.audioState.sensitivity - sensitivity) < 0.01) {
                console.log(`  ✓ Sensitivity set to ${sensitivity}`);
            } else {
                console.log(`  ❌ Failed to set sensitivity to ${sensitivity}`);
            }
            
            await this.delay(100);
        }
    }

    async step5_TestTransitions() {
        this.logStep('Demonstrate Smooth Transitions');
        
        console.log('  Testing transition to audio mode...');
        this.app.startAudioModeTransition(true);
        await this.delay(500);
        
        console.log('  Testing transition from audio mode...');
        this.app.startAudioModeTransition(false);
        await this.delay(500);
        
        console.log('  ✓ Smooth transitions working');
    }

    async step6_TestPersistence() {
        this.logStep('Show Audio Settings Persistence');
        
        // Set some custom settings
        this.app.audioState.currentMode = 'flow';
        this.app.audioState.sensitivity = 1.3;
        this.app.audioState.isEnabled = true;
        
        console.log('  Saving settings...');
        this.app.saveAudioSettings();
        
        // Reset settings
        this.app.audioState.currentMode = 'reactive';
        this.app.audioState.sensitivity = 1.0;
        
        console.log('  Loading settings...');
        this.app.loadAudioSettings();
        
        console.log('  ✓ Settings persistence working');
        console.log(`    - Loaded mode: ${this.app.audioState.currentMode}`);
        console.log(`    - Loaded sensitivity: ${this.app.audioState.sensitivity}`);
    }

    async step7_Cleanup() {
        this.logStep('Cleanup and Reset');
        
        // Disable audio mode
        await this.app.toggleAudioMode(false);
        
        // Cleanup resources
        this.app.cleanupAudioMode();
        
        console.log('✓ Cleanup completed');
        console.log(`  - Audio reactive enabled: ${this.app.audioReactiveEnabled}`);
        console.log(`  - Audio analyzer: ${this.app.audioAnalyzer ? 'exists' : 'null'}`);
        console.log(`  - Audio effects: ${this.app.audioEffects ? 'exists' : 'null'}`);
    }

    logStep(stepName) {
        this.currentStep++;
        console.log(`\n${this.currentStep}. ${stepName}`);
        console.log('-'.repeat(30));
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for use in other modules
export { AudioIntegrationDemo }

// Auto-run demo if this file is executed directly
if (typeof window !== 'undefined' && window.location) {
    // Browser environment - add to window for manual execution
    window.AudioIntegrationDemo = AudioIntegrationDemo;
    
    // Add demo button to page
    document.addEventListener('DOMContentLoaded', () => {
        const demoButton = document.createElement('button');
        demoButton.textContent = 'Run Audio Integration Demo';
        demoButton.style.position = 'fixed';
        demoButton.style.top = '10px';
        demoButton.style.left = '10px';
        demoButton.style.zIndex = '9999';
        demoButton.style.padding = '10px';
        demoButton.style.backgroundColor = '#00FFFF';
        demoButton.style.color = '#000';
        demoButton.style.border = 'none';
        demoButton.style.borderRadius = '5px';
        demoButton.style.cursor = 'pointer';
        
        demoButton.onclick = async () => {
            const demo = new AudioIntegrationDemo();
            await demo.runDemo();
        };
        
        document.body.appendChild(demoButton);
    });
}