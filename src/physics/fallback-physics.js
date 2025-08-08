/**
 * Fallback JavaScript Physics Engine
 * Used when WASM physics engine fails to load
 */

export class FallbackSolver {
    constructor(particleCount, width, height) {
        this.particleCount = particleCount;
        this.width = width;
        this.height = height;
        
        // Initialize particles
        this.particles = [];
        this.positions = new Float32Array(particleCount * 2);
        this.velocities = new Float32Array(particleCount * 2);
        
        // Physics parameters
        this.damping = 0.99;
        this.gravity = 0.1;
        this.mouseForce = 50;
        this.mouseRadius = 100;
        
        // Initialize particles with random positions
        this.initializeParticles();
        
        console.log(`✅ Fallback physics initialized with ${particleCount} particles`);
    }
    
    initializeParticles() {
        for (let i = 0; i < this.particleCount; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            
            this.positions[i * 2] = x;
            this.positions[i * 2 + 1] = y;
            
            this.velocities[i * 2] = (Math.random() - 0.5) * 2;
            this.velocities[i * 2 + 1] = (Math.random() - 0.5) * 2;
        }
    }
    
    step(deltaTime) {
        // Simple physics simulation
        for (let i = 0; i < this.particleCount; i++) {
            const idx = i * 2;
            
            // Get current position and velocity
            let x = this.positions[idx];
            let y = this.positions[idx + 1];
            let vx = this.velocities[idx];
            let vy = this.velocities[idx + 1];
            
            // Apply gravity
            vy += this.gravity * deltaTime;
            
            // Apply damping
            vx *= this.damping;
            vy *= this.damping;
            
            // Update position
            x += vx * deltaTime * 60; // Scale for 60fps
            y += vy * deltaTime * 60;
            
            // Boundary collision
            if (x < 0) {
                x = 0;
                vx = Math.abs(vx) * 0.8;
            } else if (x > this.width) {
                x = this.width;
                vx = -Math.abs(vx) * 0.8;
            }
            
            if (y < 0) {
                y = 0;
                vy = Math.abs(vy) * 0.8;
            } else if (y > this.height) {
                y = this.height;
                vy = -Math.abs(vy) * 0.8;
            }
            
            // Store updated values
            this.positions[idx] = x;
            this.positions[idx + 1] = y;
            this.velocities[idx] = vx;
            this.velocities[idx + 1] = vy;
        }
    }
    
    apply_force(mouseX, mouseY, radius) {
        const force = this.mouseForce;
        const radiusSquared = radius * radius;
        
        for (let i = 0; i < this.particleCount; i++) {
            const idx = i * 2;
            const x = this.positions[idx];
            const y = this.positions[idx + 1];
            
            // Calculate distance to mouse
            const dx = x - mouseX;
            const dy = y - mouseY;
            const distanceSquared = dx * dx + dy * dy;
            
            if (distanceSquared < radiusSquared && distanceSquared > 0) {
                const distance = Math.sqrt(distanceSquared);
                const forceMultiplier = (1 - distance / radius) * force;
                
                // Normalize direction and apply force
                const forceX = (dx / distance) * forceMultiplier;
                const forceY = (dy / distance) * forceMultiplier;
                
                this.velocities[idx] += forceX * 0.1;
                this.velocities[idx + 1] += forceY * 0.1;
            }
        }
    }
    
    get_positions() {
        return this.positions;
    }
    
    get_active_particle_count() {
        return this.particleCount;
    }
    
    set_particle_count(count) {
        if (count === this.particleCount) return;
        
        const oldCount = this.particleCount;
        this.particleCount = Math.max(1, Math.min(count, 2000)); // Reasonable limits
        
        // Resize arrays
        const newPositions = new Float32Array(this.particleCount * 2);
        const newVelocities = new Float32Array(this.particleCount * 2);
        
        // Copy existing data
        const copyCount = Math.min(oldCount, this.particleCount);
        for (let i = 0; i < copyCount * 2; i++) {
            newPositions[i] = this.positions[i];
            newVelocities[i] = this.velocities[i];
        }
        
        // Initialize new particles if we're adding more
        if (this.particleCount > oldCount) {
            for (let i = oldCount; i < this.particleCount; i++) {
                const idx = i * 2;
                newPositions[idx] = Math.random() * this.width;
                newPositions[idx + 1] = Math.random() * this.height;
                newVelocities[idx] = (Math.random() - 0.5) * 2;
                newVelocities[idx + 1] = (Math.random() - 0.5) * 2;
            }
        }
        
        this.positions = newPositions;
        this.velocities = newVelocities;
        
        console.log(`Fallback physics particle count updated: ${oldCount} → ${this.particleCount}`);
    }
    
    // Audio reactive methods
    apply_audio_force(intensity, frequency) {
        // Apply audio-reactive forces to particles
        const audioForce = intensity * 20;
        const waveLength = frequency * 100;
        
        for (let i = 0; i < this.particleCount; i++) {
            const idx = i * 2;
            const x = this.positions[idx];
            const y = this.positions[idx + 1];
            
            // Create wave-like motion based on audio
            const wave = Math.sin((x + y) / waveLength + Date.now() * 0.001) * audioForce;
            
            this.velocities[idx] += Math.cos(wave) * 0.5;
            this.velocities[idx + 1] += Math.sin(wave) * 0.5;
        }
    }
    
    // Cleanup method
    destroy() {
        // Nothing to clean up in JavaScript version
        console.log('Fallback physics cleaned up');
    }
}

// Export a factory function that matches the WASM interface
export function createFallbackPhysics(particleCount, width, height) {
    return {
        Solver: FallbackSolver,
        // Add any other exports that the WASM module would have
        default: () => Promise.resolve() // Mock the WASM init function
    };
}