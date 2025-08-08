// Performance benchmarks for particle counts
import { describe, it, expect, beforeAll } from 'vitest'

describe('Particle Count Performance Benchmarks', () => {
  let wasmModule
  let Solver

  beforeAll(async () => {
    try {
      wasmModule = await import('../../engine/pkg/engine.js')
      await wasmModule.default()
      Solver = wasmModule.Solver
      console.log('✅ WASM module loaded for performance benchmarks')
    } catch (error) {
      console.error('❌ Failed to load WASM module for benchmarks:', error)
      throw error
    }
  })

  const BENCHMARK_CONFIGS = [
    { particles: 100, name: 'Small Scale', targetFPS: 60 },
    { particles: 500, name: 'Medium Scale', targetFPS: 60 },
    { particles: 1000, name: 'Large Scale', targetFPS: 45 },
    { particles: 2000, name: 'Stress Test', targetFPS: 30 },
  ]

  const SCREEN_SIZES = [
    { width: 1024, height: 768, name: 'Standard HD' },
    { width: 1920, height: 1080, name: 'Full HD' },
    { width: 2560, height: 1440, name: '2K' },
  ]

  describe('Physics Update Performance', () => {
    BENCHMARK_CONFIGS.forEach(config => {
      it(`should maintain ${config.targetFPS} FPS with ${config.particles} particles (${config.name})`, () => {
        const solver = new Solver(config.particles, 1920, 1080)
        const targetFrameTime = 1000 / config.targetFPS // ms
        const frameTimes = []
        const iterations = 120 // 2 seconds at 60 FPS
        
        console.log(`\n🔬 Benchmarking ${config.particles} particles (${config.name})`)
        console.log(`📊 Target: ${config.targetFPS} FPS (${targetFrameTime.toFixed(2)}ms per frame)`)
        
        // Warm up
        for (let i = 0; i < 10; i++) {
          solver.update(1.0 / 60.0)
        }
        
        // Benchmark
        for (let i = 0; i < iterations; i++) {
          const startTime = performance.now()
          solver.update(1.0 / 60.0)
          const endTime = performance.now()
          
          frameTimes.push(endTime - startTime)
        }
        
        // Calculate statistics
        const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
        const maxFrameTime = Math.max(...frameTimes)
        const minFrameTime = Math.min(...frameTimes)
        const p95FrameTime = frameTimes.sort((a, b) => a - b)[Math.floor(frameTimes.length * 0.95)]
        
        const avgFPS = 1000 / avgFrameTime
        const minFPS = 1000 / maxFrameTime
        
        console.log(`📈 Results:`)
        console.log(`   Average: ${avgFrameTime.toFixed(2)}ms (${avgFPS.toFixed(1)} FPS)`)
        console.log(`   P95: ${p95FrameTime.toFixed(2)}ms (${(1000/p95FrameTime).toFixed(1)} FPS)`)
        console.log(`   Min FPS: ${minFPS.toFixed(1)} (${maxFrameTime.toFixed(2)}ms)`)
        console.log(`   Range: ${minFrameTime.toFixed(2)}ms - ${maxFrameTime.toFixed(2)}ms`)
        
        // Performance assertions
        expect(avgFrameTime).toBeLessThan(targetFrameTime * 1.2) // Allow 20% tolerance
        expect(p95FrameTime).toBeLessThan(targetFrameTime * 1.5) // 95% of frames should be within 50% of target
        expect(maxFrameTime).toBeLessThan(targetFrameTime * 3) // No frame should take more than 3x target time
        
        // Consistency check - standard deviation should be reasonable
        const variance = frameTimes.reduce((acc, time) => acc + Math.pow(time - avgFrameTime, 2), 0) / frameTimes.length
        const stdDev = Math.sqrt(variance)
        const coefficientOfVariation = stdDev / avgFrameTime
        
        console.log(`   Std Dev: ${stdDev.toFixed(2)}ms (CV: ${(coefficientOfVariation * 100).toFixed(1)}%)`)
        
        expect(coefficientOfVariation).toBeLessThan(0.5) // Standard deviation should be less than 50% of mean
      })
    })
  })

  describe('Memory Performance', () => {
    it('should have efficient memory access patterns', () => {
      const particleCounts = [100, 500, 1000, 2000]
      const memoryResults = []
      
      console.log('\n💾 Memory Access Performance:')
      
      particleCounts.forEach(count => {
        const solver = new Solver(count, 1920, 1080)
        const iterations = 1000
        
        // Benchmark position access
        const startTime = performance.now()
        
        for (let i = 0; i < iterations; i++) {
          const positions = solver.get_positions()
          // Simulate reading all positions
          let sum = 0
          for (let j = 0; j < positions.length; j++) {
            sum += positions[j]
          }
        }
        
        const endTime = performance.now()
        const avgAccessTime = (endTime - startTime) / iterations
        const timePerParticle = avgAccessTime / count
        
        memoryResults.push({ count, avgAccessTime, timePerParticle })
        
        console.log(`   ${count} particles: ${avgAccessTime.toFixed(3)}ms per access (${timePerParticle.toFixed(6)}ms per particle)`)
        
        // Memory access should be fast
        expect(avgAccessTime).toBeLessThan(1.0) // Should take less than 1ms
        expect(timePerParticle).toBeLessThan(0.001) // Should take less than 1μs per particle
      })
      
      // Memory access should scale linearly
      for (let i = 1; i < memoryResults.length; i++) {
        const prev = memoryResults[i - 1]
        const curr = memoryResults[i]
        
        const countRatio = curr.count / prev.count
        const timeRatio = curr.avgAccessTime / prev.avgAccessTime
        
        // Time should scale roughly linearly with particle count
        expect(timeRatio).toBeLessThan(countRatio * 1.5)
        expect(timeRatio).toBeGreaterThan(countRatio * 0.5)
      }
    })

    it('should handle zero-copy access efficiently', () => {
      const solver = new Solver(1000, 1920, 1080)
      const iterations = 10000
      
      console.log('\n🔗 Zero-Copy Access Performance:')
      
      // Benchmark pointer access
      const startTime = performance.now()
      
      for (let i = 0; i < iterations; i++) {
        const ptr = solver.get_positions_ptr()
        expect(ptr).not.toBe(0)
      }
      
      const endTime = performance.now()
      const avgPointerTime = (endTime - startTime) / iterations
      
      console.log(`   Pointer access: ${avgPointerTime.toFixed(6)}ms per call`)
      
      // Pointer access should be extremely fast
      expect(avgPointerTime).toBeLessThan(0.01) // Should take less than 10μs
    })
  })

  describe('Collision Detection Performance', () => {
    it('should handle collision detection efficiently', () => {
      const densityConfigs = [
        { particles: 100, size: 400, name: 'Low Density' },
        { particles: 200, size: 400, name: 'Medium Density' },
        { particles: 400, size: 400, name: 'High Density' },
        { particles: 800, size: 400, name: 'Very High Density' },
      ]
      
      console.log('\n💥 Collision Detection Performance:')
      
      densityConfigs.forEach(config => {
        const solver = new Solver(config.particles, config.size, config.size)
        const frameTimes = []
        const iterations = 60
        
        // Create high collision scenario by clustering particles
        for (let i = 0; i < 10; i++) {
          solver.apply_force(config.size / 2, config.size / 2, config.size / 4)
          solver.update(1.0 / 60.0)
        }
        
        // Benchmark collision-heavy updates
        for (let i = 0; i < iterations; i++) {
          const startTime = performance.now()
          solver.update(1.0 / 60.0)
          const endTime = performance.now()
          
          frameTimes.push(endTime - startTime)
        }
        
        const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
        const maxFrameTime = Math.max(...frameTimes)
        
        console.log(`   ${config.name} (${config.particles} particles): ${avgFrameTime.toFixed(2)}ms avg, ${maxFrameTime.toFixed(2)}ms max`)
        
        // Even with high collision density, should maintain reasonable performance
        const targetFrameTime = config.particles > 400 ? 33.33 : 16.67 // 30 FPS for high density, 60 FPS otherwise
        expect(avgFrameTime).toBeLessThan(targetFrameTime)
      })
    })
  })

  describe('Force Application Performance', () => {
    it('should handle rapid force applications efficiently', () => {
      const solver = new Solver(500, 1920, 1080)
      const forceApplicationTimes = []
      const iterations = 1000
      
      console.log('\n⚡ Force Application Performance:')
      
      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now()
        
        solver.apply_force(
          Math.random() * 1920,
          Math.random() * 1080,
          50 + Math.random() * 100
        )
        
        const endTime = performance.now()
        forceApplicationTimes.push(endTime - startTime)
      }
      
      const avgForceTime = forceApplicationTimes.reduce((a, b) => a + b, 0) / forceApplicationTimes.length
      const maxForceTime = Math.max(...forceApplicationTimes)
      
      console.log(`   Average force application: ${avgForceTime.toFixed(4)}ms`)
      console.log(`   Maximum force application: ${maxForceTime.toFixed(4)}ms`)
      
      // Force application should be very fast
      expect(avgForceTime).toBeLessThan(0.1) // Should take less than 0.1ms
      expect(maxForceTime).toBeLessThan(1.0) // No single force should take more than 1ms
    })
  })

  describe('Dynamic Scaling Performance', () => {
    it('should handle particle count changes efficiently', () => {
      const solver = new Solver(100, 1920, 1080)
      const scalingTimes = []
      
      console.log('\n📈 Dynamic Scaling Performance:')
      
      // Test scaling up and down
      const scalingPattern = [200, 500, 1000, 800, 600, 400, 200, 100]
      
      scalingPattern.forEach(targetCount => {
        const startTime = performance.now()
        solver.set_particle_count(targetCount)
        const endTime = performance.now()
        
        const scalingTime = endTime - startTime
        scalingTimes.push(scalingTime)
        
        console.log(`   Scale to ${targetCount}: ${scalingTime.toFixed(3)}ms`)
        
        // Scaling should be fast
        expect(scalingTime).toBeLessThan(5.0) // Should take less than 5ms
        
        // Verify scaling worked
        expect(solver.get_active_particle_count()).toBe(targetCount)
      })
      
      const avgScalingTime = scalingTimes.reduce((a, b) => a + b, 0) / scalingTimes.length
      console.log(`   Average scaling time: ${avgScalingTime.toFixed(3)}ms`)
      
      expect(avgScalingTime).toBeLessThan(2.0) // Average should be under 2ms
    })
  })

  describe('Screen Size Impact', () => {
    SCREEN_SIZES.forEach(screen => {
      it(`should maintain performance on ${screen.name} (${screen.width}x${screen.height})`, () => {
        const solver = new Solver(500, screen.width, screen.height)
        const frameTimes = []
        const iterations = 60
        
        console.log(`\n🖥️  Testing ${screen.name} (${screen.width}x${screen.height}):`)
        
        // Run benchmark
        for (let i = 0; i < iterations; i++) {
          const startTime = performance.now()
          solver.update(1.0 / 60.0)
          const endTime = performance.now()
          
          frameTimes.push(endTime - startTime)
        }
        
        const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
        const avgFPS = 1000 / avgFrameTime
        
        console.log(`   Average: ${avgFrameTime.toFixed(2)}ms (${avgFPS.toFixed(1)} FPS)`)
        
        // Performance should not be significantly affected by screen size
        expect(avgFrameTime).toBeLessThan(20.0) // Should maintain at least 50 FPS
        expect(avgFPS).toBeGreaterThan(50)
      })
    })
  })

  describe('Stress Testing', () => {
    it('should handle extreme particle counts without crashing', () => {
      const extremeCounts = [5000, 10000]
      
      console.log('\n🔥 Stress Testing:')
      
      extremeCounts.forEach(count => {
        console.log(`   Testing ${count} particles...`)
        
        const solver = new Solver(count, 1920, 1080)
        
        // Should not crash during creation
        expect(solver.get_particle_count()).toBe(count)
        
        // Should handle a few updates without crashing
        const startTime = performance.now()
        
        for (let i = 0; i < 10; i++) {
          solver.update(1.0 / 60.0)
          
          // Verify positions remain valid
          const positions = solver.get_positions()
          for (let j = 0; j < Math.min(positions.length, 100); j++) { // Check first 50 particles
            expect(positions[j]).toBeFinite()
          }
        }
        
        const endTime = performance.now()
        const avgFrameTime = (endTime - startTime) / 10
        
        console.log(`     Average frame time: ${avgFrameTime.toFixed(2)}ms`)
        
        // Should complete within reasonable time (may be slow but shouldn't hang)
        expect(avgFrameTime).toBeLessThan(1000) // Should take less than 1 second per frame
      })
    })
  })
})