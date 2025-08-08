use wasm_bindgen::prelude::*;
use std::ops::{Add, Sub, Mul};

// Import the `console.log` function from the `console` module
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// Define a macro to provide `println!(..)`-style syntax for `console.log` logging.
macro_rules! console_log {
    ( $( $t:tt )* ) => {
        log(&format!( $( $t )* ))
    }
}

/// 2D Vector struct with mathematical operations
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Vec2 {
    pub x: f32,
    pub y: f32,
}

impl Vec2 {
    /// Create a new Vec2
    pub fn new(x: f32, y: f32) -> Self {
        Vec2 { x, y }
    }

    /// Create a zero vector
    pub fn zero() -> Self {
        Vec2 { x: 0.0, y: 0.0 }
    }

    /// Calculate the length (magnitude) of the vector
    pub fn length(&self) -> f32 {
        (self.x * self.x + self.y * self.y).sqrt()
    }

    /// Normalize the vector (return unit vector in same direction)
    pub fn normalize(&self) -> Self {
        let len = self.length();
        if len > 0.0 {
            Vec2 {
                x: self.x / len,
                y: self.y / len,
            }
        } else {
            Vec2::zero()
        }
    }
}

// Implement Add trait for Vec2 + Vec2
impl Add for Vec2 {
    type Output = Vec2;

    fn add(self, other: Vec2) -> Vec2 {
        Vec2 {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }
}

// Implement Sub trait for Vec2 - Vec2
impl Sub for Vec2 {
    type Output = Vec2;

    fn sub(self, other: Vec2) -> Vec2 {
        Vec2 {
            x: self.x - other.x,
            y: self.y - other.y,
        }
    }
}

// Implement Mul trait for Vec2 * f32
impl Mul<f32> for Vec2 {
    type Output = Vec2;

    fn mul(self, scalar: f32) -> Vec2 {
        Vec2 {
            x: self.x * scalar,
            y: self.y * scalar,
        }
    }
}

/// Particle struct for physics simulation
#[derive(Clone, Debug)]
pub struct Particle {
    pub position: Vec2,
    pub position_old: Vec2,
    pub radius: f32,
    pub active: bool,
}

impl Particle {
    /// Create a new particle
    pub fn new(position: Vec2, radius: f32) -> Self {
        Particle {
            position,
            position_old: position,
            radius,
            active: true,
        }
    }

    /// Create an inactive particle
    pub fn inactive() -> Self {
        Particle {
            position: Vec2::zero(),
            position_old: Vec2::zero(),
            radius: 0.0,
            active: false,
        }
    }
}

/// Physics solver with Verlet integration
#[wasm_bindgen]
pub struct Solver {
    particles: Vec<Particle>,
    container_width: f32,
    container_height: f32,
    gravity: Vec2,
    // Contiguous position buffer for zero-copy access: [x1, y1, x2, y2, ...]
    position_buffer: Vec<f32>,
}

#[wasm_bindgen]
impl Solver {
    /// Create a new physics solver
    #[wasm_bindgen(constructor)]
    pub fn new(count: u32, width: f32, height: f32) -> Solver {
        let mut particles = Vec::with_capacity(count as usize);
        
        // Initialize particles in a grid pattern within the container
        let cols = (count as f32).sqrt().ceil() as u32;
        let spacing = width.min(height) / (cols as f32 + 1.0);
        
        for i in 0..count {
            let row = i / cols;
            let col = i % cols;
            let x = spacing * (col as f32 + 1.0);
            let y = spacing * (row as f32 + 1.0);
            
            // Ensure particles are within bounds
            let x = x.min(width - 10.0).max(10.0);
            let y = y.min(height - 10.0).max(10.0);
            
            particles.push(Particle::new(Vec2::new(x, y), 4.0));
        }
        
        let mut position_buffer = Vec::with_capacity(count as usize * 2);
        position_buffer.resize(count as usize * 2, 0.0);
        
        let mut solver = Solver {
            particles,
            container_width: width,
            container_height: height,
            gravity: Vec2::new(0.0, 150.0), // Normal gravity for regular ball physics
            position_buffer,
        };
        
        // Initialize position buffer
        solver.update_position_buffer();
        solver
    }
    
    /// Update physics simulation using Verlet integration
    pub fn update(&mut self, dt: f32) {
        // Apply Verlet integration to all active particles
        for particle in &mut self.particles {
            if !particle.active {
                continue;
            }
            
            // Store current position
            let current_pos = particle.position;
            
            // Calculate velocity from position difference
            let velocity = current_pos - particle.position_old;
            
            // Apply gravity acceleration
            let acceleration = self.gravity * dt * dt;
            
            // Verlet integration: new_pos = current_pos + velocity + acceleration
            let new_pos = current_pos + velocity + acceleration;
            
            // Update positions
            particle.position_old = current_pos;
            particle.position = new_pos;
            
            // Handle boundary collisions
            Self::handle_boundary_collision(particle, self.container_width, self.container_height);
        }
        
        // Handle particle-particle collisions
        self.handle_particle_collisions();
        
        // Update position buffer for zero-copy access
        self.update_position_buffer();
    }
    
    /// Handle particle collision with container boundaries with proper velocity reflection
    fn handle_boundary_collision(particle: &mut Particle, container_width: f32, container_height: f32) {
        let radius = particle.radius;
        let damping = 0.85; // Energy loss on collision for regular ball behavior
        
        // Calculate current velocity
        let velocity_x = particle.position.x - particle.position_old.x;
        let velocity_y = particle.position.y - particle.position_old.y;
        
        // Left boundary
        if particle.position.x - radius <= 0.0 {
            particle.position.x = radius + 0.1; // Small buffer to prevent sticking
            // Reflect horizontal velocity
            if velocity_x < 0.0 {
                particle.position_old.x = particle.position.x - velocity_x * damping;
            }
        }
        
        // Right boundary
        if particle.position.x + radius >= container_width {
            particle.position.x = container_width - radius - 0.1; // Small buffer
            // Reflect horizontal velocity
            if velocity_x > 0.0 {
                particle.position_old.x = particle.position.x - velocity_x * damping;
            }
        }
        
        // Top boundary
        if particle.position.y - radius <= 0.0 {
            particle.position.y = radius + 0.1; // Small buffer
            // Reflect vertical velocity
            if velocity_y < 0.0 {
                particle.position_old.y = particle.position.y - velocity_y * damping;
            }
        }
        
        // Bottom boundary
        if particle.position.y + radius >= container_height {
            particle.position.y = container_height - radius - 0.1; // Small buffer
            // Reflect vertical velocity
            if velocity_y > 0.0 {
                particle.position_old.y = particle.position.y - velocity_y * damping;
            }
        }
    }
    
    /// Handle particle-particle collisions with regular ball behavior
    fn handle_particle_collisions(&mut self) {
        // Single collision resolution pass for regular ball behavior
        let mut collision_pairs = Vec::new();
        
        // Find all colliding particle pairs
        for i in 0..self.particles.len() {
            if !self.particles[i].active {
                continue;
            }
            
            for j in (i + 1)..self.particles.len() {
                if !self.particles[j].active {
                    continue;
                }
                
                let distance = (self.particles[i].position - self.particles[j].position).length();
                let min_distance = self.particles[i].radius + self.particles[j].radius;
                
                if distance < min_distance && distance > 0.001 {
                    collision_pairs.push((i, j, distance, min_distance));
                }
            }
        }
        
        // Resolve collisions with regular ball physics
        for (i, j, distance, min_distance) in collision_pairs {
            let overlap = min_distance - distance;
            let displacement = overlap * 0.5; // Split displacement equally
            
            // Calculate collision normal (direction from particle j to particle i)
            let collision_normal = (self.particles[i].position - self.particles[j].position).normalize();
            
            // Displace particles to resolve overlap
            let displacement_vector = collision_normal * displacement;
            self.particles[i].position = self.particles[i].position + displacement_vector;
            self.particles[j].position = self.particles[j].position - displacement_vector;
            
            // Regular ball velocity exchange
            let relative_velocity = (self.particles[i].position - self.particles[i].position_old) - 
                                  (self.particles[j].position - self.particles[j].position_old);
            let velocity_along_normal = relative_velocity.x * collision_normal.x + relative_velocity.y * collision_normal.y;
            
            if velocity_along_normal > 0.0 {
                continue; // Particles separating
            }
            
            let restitution = 0.3; // Normal bounce factor for regular balls
            let impulse = -(1.0 + restitution) * velocity_along_normal * 0.3; // Normal impulse strength
            let impulse_vector = collision_normal * impulse;
            
            // Apply impulse to old positions
            self.particles[i].position_old = self.particles[i].position_old - impulse_vector;
            self.particles[j].position_old = self.particles[j].position_old + impulse_vector;
        }
    }
    
    /// Get the number of particles
    pub fn get_particle_count(&self) -> u32 {
        self.particles.len() as u32
    }
    
    /// Get the number of active particles
    pub fn get_active_particle_count(&self) -> u32 {
        self.particles.iter().filter(|p| p.active).count() as u32
    }
    
    /// Apply radial repulsion force to particles within radius
    pub fn apply_force(&mut self, x: f32, y: f32, radius: f32) {
        let force_center = Vec2::new(x, y);
        let force_strength = 1200.0; // Normal force strength for regular ball interaction
        
        for particle in &mut self.particles {
            if !particle.active {
                continue;
            }
            
            let force = Self::calculate_radial_force(
                particle.position,
                force_center,
                radius,
                force_strength
            );
            
            // Apply force by modifying the particle's old position
            // This effectively adds velocity in Verlet integration
            particle.position_old = particle.position_old - force * (1.0 / 60.0);
        }
    }
    
    /// Get pointer to particle positions for zero-copy data access
    /// Memory layout: [x1, y1, x2, y2, ..., xN, yN] as contiguous f32 array
    pub fn get_positions_ptr(&self) -> *const f32 {
        self.position_buffer.as_ptr()
    }
    
    /// Get particle positions as JavaScript-accessible array
    /// Returns positions as [x1, y1, x2, y2, ..., xN, yN]
    pub fn get_positions(&self) -> Vec<f32> {
        self.position_buffer.clone()
    }
    
    /// Set the number of active particles for dynamic scaling
    pub fn set_particle_count(&mut self, count: u32) {
        let count = count as usize;
        
        if count > self.particles.len() {
            // Add more particles if needed
            let current_len = self.particles.len();
            for i in current_len..count {
                // Create new particles in a reasonable position
                let x = (i % 10) as f32 * 50.0 + 50.0;
                let y = (i / 10) as f32 * 50.0 + 50.0;
                let x = x.min(self.container_width - 10.0);
                let y = y.min(self.container_height - 10.0);
                
                self.particles.push(Particle::new(Vec2::new(x, y), 4.0));
            }
            
            // Resize position buffer to accommodate new particles
            self.position_buffer.resize(self.particles.len() * 2, 0.0);
        } else {
            // Deactivate excess particles
            for i in count..self.particles.len() {
                self.particles[i].active = false;
            }
            // Activate particles up to the count
            for i in 0..count {
                if i < self.particles.len() {
                    self.particles[i].active = true;
                }
            }
        }
        
        // Update position buffer after particle count change
        self.update_position_buffer();
    }
}

impl Solver {
    /// Calculate radial repulsion force with distance-based falloff
    fn calculate_radial_force(particle_pos: Vec2, force_center: Vec2, radius: f32, strength: f32) -> Vec2 {
        let diff = particle_pos - force_center;
        let distance = diff.length();
        
        if distance < radius && distance > 0.0 {
            // Quadratic falloff for smooth force application
            let falloff = 1.0 - (distance / radius);
            let force_magnitude = strength * falloff * falloff;
            
            // Return force vector pointing away from center
            return diff.normalize() * force_magnitude;
        }
        
        Vec2::zero()
    }
    
    /// Update the position buffer with current particle positions
    /// Memory layout: [x1, y1, x2, y2, ..., xN, yN]
    fn update_position_buffer(&mut self) {
        // Ensure buffer is large enough
        let required_size = self.particles.len() * 2;
        if self.position_buffer.len() < required_size {
            self.position_buffer.resize(required_size, 0.0);
        }
        
        // Copy particle positions to contiguous buffer
        for (i, particle) in self.particles.iter().enumerate() {
            let buffer_index = i * 2;
            self.position_buffer[buffer_index] = particle.position.x;
            self.position_buffer[buffer_index + 1] = particle.position.y;
        }
    }
}

#[wasm_bindgen]
pub fn greet(name: &str) {
    console_log!("Hello, {}!", name);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vec2_creation() {
        let v = Vec2::new(3.0, 4.0);
        assert_eq!(v.x, 3.0);
        assert_eq!(v.y, 4.0);
    }

    #[test]
    fn test_vec2_zero() {
        let v = Vec2::zero();
        assert_eq!(v.x, 0.0);
        assert_eq!(v.y, 0.0);
    }

    #[test]
    fn test_vec2_length() {
        let v = Vec2::new(3.0, 4.0);
        assert_eq!(v.length(), 5.0);
        
        let v_zero = Vec2::zero();
        assert_eq!(v_zero.length(), 0.0);
    }

    #[test]
    fn test_vec2_normalize() {
        let v = Vec2::new(3.0, 4.0);
        let normalized = v.normalize();
        assert!((normalized.length() - 1.0).abs() < f32::EPSILON);
        assert_eq!(normalized.x, 0.6);
        assert_eq!(normalized.y, 0.8);

        // Test zero vector normalization
        let v_zero = Vec2::zero();
        let normalized_zero = v_zero.normalize();
        assert_eq!(normalized_zero, Vec2::zero());
    }

    #[test]
    fn test_vec2_addition() {
        let v1 = Vec2::new(1.0, 2.0);
        let v2 = Vec2::new(3.0, 4.0);
        let result = v1 + v2;
        assert_eq!(result.x, 4.0);
        assert_eq!(result.y, 6.0);
    }

    #[test]
    fn test_vec2_subtraction() {
        let v1 = Vec2::new(5.0, 7.0);
        let v2 = Vec2::new(2.0, 3.0);
        let result = v1 - v2;
        assert_eq!(result.x, 3.0);
        assert_eq!(result.y, 4.0);
    }

    #[test]
    fn test_vec2_scalar_multiplication() {
        let v = Vec2::new(2.0, 3.0);
        let result = v * 2.5;
        assert_eq!(result.x, 5.0);
        assert_eq!(result.y, 7.5);

        // Test multiplication by zero
        let result_zero = v * 0.0;
        assert_eq!(result_zero, Vec2::zero());
    }

    #[test]
    fn test_particle_creation() {
        let pos = Vec2::new(10.0, 20.0);
        let particle = Particle::new(pos, 5.0);
        
        assert_eq!(particle.position, pos);
        assert_eq!(particle.position_old, pos);
        assert_eq!(particle.radius, 5.0);
        assert!(particle.active);
    }

    #[test]
    fn test_particle_inactive() {
        let particle = Particle::inactive();
        
        assert_eq!(particle.position, Vec2::zero());
        assert_eq!(particle.position_old, Vec2::zero());
        assert_eq!(particle.radius, 0.0);
        assert!(!particle.active);
    }

    #[test]
    fn test_solver_creation() {
        let solver = Solver::new(4, 800.0, 600.0);
        
        assert_eq!(solver.get_particle_count(), 4);
        assert_eq!(solver.get_active_particle_count(), 4);
        assert_eq!(solver.container_width, 800.0);
        assert_eq!(solver.container_height, 600.0);
        assert_eq!(solver.gravity.x, 0.0);
        assert_eq!(solver.gravity.y, 150.0);
        
        // Check that particles are initialized within bounds
        for particle in &solver.particles {
            assert!(particle.position.x >= 0.0 && particle.position.x <= 800.0);
            assert!(particle.position.y >= 0.0 && particle.position.y <= 600.0);
            assert!(particle.active);
            assert_eq!(particle.radius, 4.0);
        }
    }

    #[test]
    fn test_verlet_integration_accuracy() {
        let mut solver = Solver::new(1, 800.0, 600.0);
        let dt = 1.0 / 60.0; // 60 FPS
        
        // Set initial conditions for predictable motion
        solver.particles[0].position = Vec2::new(400.0, 100.0);
        solver.particles[0].position_old = Vec2::new(400.0, 100.0); // No initial velocity
        
        // Store initial position
        let initial_pos = solver.particles[0].position;
        
        // Update once
        solver.update(dt);
        
        // After one frame with gravity, particle should move down
        let expected_displacement = solver.gravity.y * dt * dt;
        let actual_displacement = solver.particles[0].position.y - initial_pos.y;
        
        assert!((actual_displacement - expected_displacement).abs() < 0.001, 
                "Expected displacement: {}, Actual: {}", expected_displacement, actual_displacement);
        
        // X position should remain unchanged (no horizontal forces)
        assert_eq!(solver.particles[0].position.x, initial_pos.x);
    }

    #[test]
    fn test_boundary_collision_left() {
        let mut solver = Solver::new(1, 800.0, 600.0);
        
        // Position particle near left boundary with leftward velocity
        solver.particles[0].position = Vec2::new(2.0, 300.0);
        solver.particles[0].position_old = Vec2::new(6.0, 300.0); // Moving left
        solver.particles[0].radius = 4.0;
        
        solver.update(1.0 / 60.0);
        
        // Particle should be clamped to boundary
        assert_eq!(solver.particles[0].position.x, solver.particles[0].radius + 0.1);
        
        // Velocity should be reflected (old position adjusted)
        assert!(solver.particles[0].position_old.x > solver.particles[0].position.x);
    }

    #[test]
    fn test_particle_collision_detection() {
        let mut solver = Solver::new(2, 800.0, 600.0);
        
        // Position two particles so they overlap
        solver.particles[0].position = Vec2::new(100.0, 100.0);
        solver.particles[0].position_old = Vec2::new(100.0, 100.0);
        solver.particles[0].radius = 4.0;
        
        solver.particles[1].position = Vec2::new(106.0, 100.0); // 6 units apart, but radii sum to 8
        solver.particles[1].position_old = Vec2::new(106.0, 100.0);
        solver.particles[1].radius = 4.0;
        
        let initial_distance = (solver.particles[0].position - solver.particles[1].position).length();
        assert!(initial_distance < solver.particles[0].radius + solver.particles[1].radius);
        
        solver.update(1.0 / 60.0);
        
        // After collision resolution, particles should be separated
        let final_distance = (solver.particles[0].position - solver.particles[1].position).length();
        let min_distance = solver.particles[0].radius + solver.particles[1].radius;
        
        assert!(final_distance >= min_distance - 0.001, 
                "Particles should be separated. Distance: {}, Min distance: {}", 
                final_distance, min_distance);
    }

    #[test]
    fn test_force_application() {
        let mut solver = Solver::new(3, 800.0, 600.0);
        
        // Position particles in a line
        solver.particles[0].position = Vec2::new(100.0, 100.0);
        solver.particles[0].position_old = Vec2::new(100.0, 100.0);
        
        solver.particles[1].position = Vec2::new(150.0, 100.0); // 50 units away
        solver.particles[1].position_old = Vec2::new(150.0, 100.0);
        
        solver.particles[2].position = Vec2::new(200.0, 100.0); // 100 units away
        solver.particles[2].position_old = Vec2::new(200.0, 100.0);
        
        // Apply force at center position with radius 80
        solver.apply_force(125.0, 100.0, 80.0);
        
        // Update to see effect of force
        solver.update(1.0 / 60.0);
        
        // Particles within radius should be pushed away
        assert!(solver.particles[0].position.x < 100.0); // Pushed left
        assert!(solver.particles[1].position.x > 150.0); // Pushed right
        
        // Particle outside radius should be unaffected (or minimally affected)
        assert!((solver.particles[2].position.x - 200.0).abs() < 1.0);
    }

    #[test]
    fn test_dynamic_particle_count() {
        let mut solver = Solver::new(5, 800.0, 600.0);
        
        assert_eq!(solver.get_active_particle_count(), 5);
        assert_eq!(solver.get_particle_count(), 5);
        
        // Test increasing particle count
        solver.set_particle_count(8);
        assert_eq!(solver.get_particle_count(), 8); // Total particles should increase
        assert_eq!(solver.get_active_particle_count(), 8); // All should be active
        
        // Test decreasing particle count
        solver.set_particle_count(6);
        assert_eq!(solver.get_particle_count(), 8); // Total unchanged
        assert_eq!(solver.get_active_particle_count(), 6); // Only 6 active
    }

    #[test]
    fn test_position_buffer_memory_layout() {
        let solver = Solver::new(3, 800.0, 600.0);
        let positions = solver.get_positions();
        
        // Buffer should contain [x1, y1, x2, y2, x3, y3]
        assert_eq!(positions.len(), 6);
        
        // Verify positions match particle positions
        for i in 0..3 {
            let buffer_x = positions[i * 2];
            let buffer_y = positions[i * 2 + 1];
            
            assert_eq!(buffer_x, solver.particles[i].position.x);
            assert_eq!(buffer_y, solver.particles[i].position.y);
        }
    }

    #[test]
    fn test_zero_copy_memory_access() {
        let solver = Solver::new(2, 800.0, 600.0);
        
        // Get pointer to position buffer
        let ptr = solver.get_positions_ptr();
        assert!(!ptr.is_null());
        
        // Verify pointer points to valid memory
        unsafe {
            let slice = std::slice::from_raw_parts(ptr, 4); // 2 particles * 2 coordinates
            
            // Values should match particle positions
            assert_eq!(slice[0], solver.particles[0].position.x);
            assert_eq!(slice[1], solver.particles[0].position.y);
            assert_eq!(slice[2], solver.particles[1].position.x);
            assert_eq!(slice[3], solver.particles[1].position.y);
        }
    }
}