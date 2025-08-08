// Integration tests for WASM-JavaScript interface
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'

describe('WASM-JavaScript Interface Integration', () => {
  let wasmModule
  let Solver

  beforeAll(async () => {
    try {
      // Import WASM module
      wasmModule = await import('../../engine/pkg/engine.js')
      await wasmModule.default()
      Solver = wasmModule.Solver
      console.log('✅ WASM module loaded successfully for integration tests')
    } catch (error) {
      console.error('❌ Failed to load WASM module:', error)
      throw error
    }
  })

  afterEach(() => {
    // Clean up any created solvers
    vi.clearAllMocks()
  })

  describe('Solver Construction', () => {
    it('should create solver with valid parameters', () => {
      const solver = new Solver(100, 800, 600)
      
      expect(solver).toBeDefined()
      expect(solver.get_particle_count()).toBe(100)
      expect(solver.get_active_particle_count()).toBe(100)
    })

    it('should handle edge case parameters', () => {
      // Minimum viable parameters
      const smallSolver = new Solver(1, 100, 100)
      expect(smallSolver.get_particle_count()).toBe(1)
      
      // Large parameters
      const largeSolver = new Solver(1000, 1920, 1080)
      expect(largeSolver.get_particle_count()).toBe(1000)
    })

    it('should throw on invalid parameters', () => {
      expect(() => new Solver(0, 800, 600)).toThrow()
      expect(() => new Solver(100, 0, 600)).toThrow()
      expect(() => new Solver(100, 800, 0)).toThrow()
    })
  })

  describe('Memory Interface', () => {
    it('should provide zero-copy position access', () => {
      const solver = new Solver(3, 800, 600)
      
      // Get positions via zero-copy interface
      const positionsPtr = solver.get_positions_ptr()
      expect(positionsPtr).not.toBe(0) // Non-null pointer
      
      // Get positions via array copy
      const positionsArray = solver.get_positions()
      expect(positionsArray).toBeInstanceOf(Array)
      expect(positionsArray.length).toBe(6) // 3 particles * 2 coordinates
      
      // Both methods should return same data
      const wasmMemory = wasmModule.memory
      const memoryView = new Float32Array(wasmMemory.buffer, positionsPtr, 6)
      
      for (let i = 0; i < 6; i++) {
        expect(memoryView[i]).toBeCloseTo(positionsArray[i], 5)
      }
    })

    it('should update memory after physics simulation', () => {
      const solver = new Solver(2, 800, 600)
      
      // Get initial positions
      const initialPositions = solver.get_positions()
      
      // Run physics update
      solver.update(1.0 / 60.0)
      
      // Get updated positions
      const updatedPositions = solver.get_positions()
      
      // Y positions should change due to gravity
      expect(updatedPositions[1]).not.toBeCloseTo(initialPositions[1], 5) // y1
      expect(updatedPositions[3]).not.toBeCloseTo(initialPositions[3], 5) // y2
      
      // X positions should remain same (no horizontal forces)
      expect(updatedPositions[0]).toBeCloseTo(initialPositions[0], 5) // x1
      expect(updatedPositions[2]).toBeCloseTo(initialPositions[2], 5) // x2
    })

    it('should handle memory access with different particle counts', () => {
      const solver = new Solver(5, 800, 600)
      
      // Test with full particle count
      let positions = solver.get_positions()
      expect(positions.length).toBe(10) // 5 particles * 2 coordinates
      
      // Reduce particle count
      solver.set_particle_count(3)
      positions = solver.get_positions()
      expect(positions.length).toBe(10) // Buffer size unchanged, but only first 6 values are valid
      
      // Increase particle count
      solver.set_particle_count(7)
      positions = solver.get_positions()
      expect(positions.length).toBe(14) // Buffer should expand
    })
  })

  describe('Physics Simulation Interface', () => {
    it('should update particle positions with Verlet integration', () => {
      const solver = new Solver(1, 800, 600)
      const dt = 1.0 / 60.0
      
      // Get initial position
      const initialPositions = solver.get_positions()
      const initialY = initialPositions[1]
      
      // Update multiple times
      for (let i = 0; i < 10; i++) {
        solver.update(dt)
      }
      
      // Particle should have fallen due to gravity
      const finalPositions = solver.get_positions()
      const finalY = finalPositions[1]
      
      expect(finalY).toBeGreaterThan(initialY)
    })

    it('should handle boundary collisions correctly', () => {
      const solver = new Solver(1, 100, 100)
      
      // Run simulation long enough for particle to hit boundaries
      for (let i = 0; i < 200; i++) {
        solver.update(1.0 / 60.0)
        
        const positions = solver.get_positions()
        const x = positions[0]
        const y = positions[1]
        
        // Particle should stay within bounds (accounting for radius)
        expect(x).toBeGreaterThanOrEqual(4) // radius
        expect(x).toBeLessThanOrEqual(96) // width - radius
        expect(y).toBeGreaterThanOrEqual(4) // radius
        expect(y).toBeLessThanOrEqual(96) // height - radius
      }
    })

    it('should apply forces correctly', () => {
      const solver = new Solver(2, 800, 600)
      
      // Position particles
      const initialPositions = solver.get_positions()
      
      // Apply repulsive force at center
      solver.apply_force(400, 300, 100)
      
      // Update to see effect
      solver.update(1.0 / 60.0)
      
      const finalPositions = solver.get_positions()
      
      // Particles should be displaced from their initial positions
      const displacement1 = Math.sqrt(
        Math.pow(finalPositions[0] - initialPositions[0], 2) +
        Math.pow(finalPositions[1] - initialPositions[1], 2)
      )
      const displacement2 = Math.sqrt(
        Math.pow(finalPositions[2] - initialPositions[2], 2) +
        Math.pow(finalPositions[3] - initialPositions[3], 2)
      )
      
      expect(displacement1).toBeGreaterThan(0)
      expect(displacement2).toBeGreaterThan(0)
    })
  })

  describe('Dynamic Particle Management', () => {
    it('should handle particle count changes', () => {
      const solver = new Solver(5, 800, 600)
      
      expect(solver.get_active_particle_count()).toBe(5)
      
      // Increase count
      solver.set_particle_count(8)
      expect(solver.get_active_particle_count()).toBe(8)
      
      // Decrease count
      solver.set_particle_count(3)
      expect(solver.get_active_particle_count()).toBe(3)
      
      // Positions should still be valid
      const positions = solver.get_positions()
      expect(positions.length).toBeGreaterThanOrEqual(6) // At least 3 particles * 2 coordinates
      
      for (let i = 0; i < 6; i++) {
        expect(positions[i]).toBeFinite()
      }
    })

    it('should maintain performance with dynamic scaling', () => {
      const solver = new Solver(100, 800, 600)
      
      const startTime = performance.now()
      
      // Simulate dynamic scaling scenario
      for (let i = 0; i < 10; i++) {
        solver.set_particle_count(100 + i * 10)
        solver.update(1.0 / 60.0)
        solver.set_particle_count(100 + (9 - i) * 10)
        solver.update(1.0 / 60.0)
      }
      
      const endTime = performance.now()
      const elapsed = endTime - startTime
      
      // Should complete within reasonable time
      expect(elapsed).toBeLessThan(1000) // 1 second
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle NaN and infinite values gracefully', () => {
      const solver = new Solver(2, 800, 600)
      
      // Apply extreme force that might cause numerical issues
      solver.apply_force(0, 0, 1000000)
      
      // Update multiple times
      for (let i = 0; i < 10; i++) {
        solver.update(1.0 / 60.0)
        
        const positions = solver.get_positions()
        
        // All positions should remain finite
        for (let j = 0; j < positions.length; j++) {
          expect(positions[j]).toBeFinite()
        }
      }
    })

    it('should handle rapid force applications', () => {
      const solver = new Solver(10, 800, 600)
      
      // Apply many forces rapidly
      for (let i = 0; i < 100; i++) {
        solver.apply_force(
          Math.random() * 800,
          Math.random() * 600,
          50 + Math.random() * 50
        )
      }
      
      solver.update(1.0 / 60.0)
      
      const positions = solver.get_positions()
      
      // All positions should remain valid
      for (let i = 0; i < positions.length; i++) {
        expect(positions[i]).toBeFinite()
      }
    })

    it('should handle memory access after particle count changes', () => {
      const solver = new Solver(5, 800, 600)
      
      // Get initial memory pointer
      const ptr1 = solver.get_positions_ptr()
      expect(ptr1).not.toBe(0)
      
      // Change particle count
      solver.set_particle_count(10)
      
      // Memory pointer should still be valid
      const ptr2 = solver.get_positions_ptr()
      expect(ptr2).not.toBe(0)
      
      // Should be able to access memory safely
      const positions = solver.get_positions()
      expect(positions.length).toBeGreaterThanOrEqual(20) // 10 particles * 2 coordinates
      
      for (let i = 0; i < 20; i++) {
        expect(positions[i]).toBeFinite()
      }
    })
  })

  describe('Performance Characteristics', () => {
    it('should maintain consistent performance across updates', () => {
      const solver = new Solver(500, 1024, 768)
      const frameTimes = []
      
      // Measure frame times for multiple updates
      for (let i = 0; i < 60; i++) {
        const startTime = performance.now()
        solver.update(1.0 / 60.0)
        const endTime = performance.now()
        
        frameTimes.push(endTime - startTime)
      }
      
      // Calculate statistics
      const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
      const maxFrameTime = Math.max(...frameTimes)
      const minFrameTime = Math.min(...frameTimes)
      
      console.log(`Performance stats - Avg: ${avgFrameTime.toFixed(2)}ms, Max: ${maxFrameTime.toFixed(2)}ms, Min: ${minFrameTime.toFixed(2)}ms`)
      
      // Performance should be reasonable
      expect(avgFrameTime).toBeLessThan(16.67) // Should maintain 60 FPS
      expect(maxFrameTime).toBeLessThan(33.33) // No frame should take longer than 30 FPS
    })

    it('should scale performance with particle count', () => {
      const particleCounts = [100, 200, 500, 1000]
      const performanceResults = []
      
      for (const count of particleCounts) {
        const solver = new Solver(count, 1024, 768)
        
        const startTime = performance.now()
        
        // Run 10 updates
        for (let i = 0; i < 10; i++) {
          solver.update(1.0 / 60.0)
        }
        
        const endTime = performance.now()
        const avgFrameTime = (endTime - startTime) / 10
        
        performanceResults.push({ count, avgFrameTime })
        
        console.log(`${count} particles: ${avgFrameTime.toFixed(2)}ms per frame`)
      }
      
      // Performance should scale reasonably (not exponentially)
      for (let i = 1; i < performanceResults.length; i++) {
        const prev = performanceResults[i - 1]
        const curr = performanceResults[i]
        
        const countRatio = curr.count / prev.count
        const timeRatio = curr.avgFrameTime / prev.avgFrameTime
        
        // Time ratio should not be much higher than count ratio (indicating good O(n) or O(n log n) scaling)
        expect(timeRatio).toBeLessThan(countRatio * 2)
      }
    })
  })
})