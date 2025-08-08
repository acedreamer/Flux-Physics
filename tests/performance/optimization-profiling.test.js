// Comprehensive performance profiling for optimization task
import { describe, it, expect, beforeAll } from 'vitest'

describe('Application Performance Profiling', () => {
  let wasmModule
  let Solver

  beforeAll(async () => {
    try {
      wasmModule = await import('../../engine/pkg/engine.js')
      await wasmModule.default()
      Solver = wasmModule.Solver
      console.log('✅ WASM module loaded for optimization profiling')
    } catch (error) {
      console.error('❌ Failed to load WASM module for profiling:', error)
      throw error
    }
  })

  describe('Particle Count Performance Profiling', () => {
    const PROFILING_CONFIGS = [
      { particles: 50, name: 'Minimal Load', expectedFPS: 60 },
      { particles: 100, name: 'Light Load', expectedFPS: 60 },
      { particles: 250, name: 'Medium Load', expectedFPS: 60 },
      { particles: 500, name: 'Standard Load', expectedFPS: 60 },
      { particles: 750, name: 'Heavy Load', expectedFPS: 50 },
      { particles: 1000, name: 'Maximum Load', expectedFPS: 45 },
      { particles: 1500, name: 'Stress Load', expectedFPS: 30 },
      { particles: 2000, name: 'Extreme Load', expectedFPS: 25 },
    ]

    PROFILING_CONFIGS.forEach(config => {
      it(`should profile ${config.particles} particles (${config.name})`, () => {
        console.log(`\n🔬 Profiling ${config.particles} particles - ${config.name}`)
        
        const solver = new Solver(config.particles, 1920, 1080)
        const iterations = 300 // 5 seconds at 60 FPS
        const frameTimes = []
        const memoryUsage = []
        
        // Warm up phase
        for (let i = 0; i < 30; i++) {
          solver.update(1.0 / 60.0)
        }
        
        // Profiling phase with memory tracking
        for (let i = 0; i < iterations; i++) {
          const memBefore = performance.memory ? performance.memory.usedJSHeapSize : 0
          const startTime = performance.now()
          
          // Simulate realistic interaction
          if (i % 10 === 0) {
            solver.apply_force(
              960 + Math.sin(i * 0.1) * 200,
              540 + Math.cos(i * 0.1) * 200,
              80
            )
          }
          
          solver.update(1.0 / 60.0)
          
          const endTime = performance.now()
          const memAfter = performance.memory ? performance.memory.usedJSHeapSize : 0
          
          frameTimes.push(endTime - startTime)
          memoryUsage.push(memAfter - memBefore)
        }
        
        // Calculate comprehensive statistics
        const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
        const minFrameTime = Math.min(...frameTimes)
        const maxFrameTime = Math.max(...frameTimes)
        const p95FrameTime = frameTimes.sort((a, b) => a - b)[Math.floor(frameTimes.length * 0.95)]
        const p99FrameTime = frameTimes.sort((a, b) => a - b)[Math.floor(frameTimes.length * 0.99)]
        
        const avgFPS = 1000 / avgFrameTime
        const minFPS = 1000 / maxFrameTime
        const p95FPS = 1000 / p95FrameTime
        
        // Frame time consistency
        const variance = frameTimes.reduce((acc, time) => acc + Math.pow(time - avgFrameTime, 2), 0) / frameTimes.length
        const stdDev = Math.sqrt(variance)
        const coefficientOfVariation = stdDev / avgFrameTime
        
        // Memory statistics
        const avgMemoryDelta = memoryUsage.reduce((a, b) => a + b, 0) / memoryUsage.length
        const maxMemoryDelta = Math.max(...memoryUsage)
        
        // Performance report
        console.log(`📊 Performance Results:`)
        console.log(`   Average: ${avgFrameTime.toFixed(2)}ms (${avgFPS.toFixed(1)} FPS)`)
        console.log(`   P95: ${p95FrameTime.toFixed(2)}ms (${p95FPS.toFixed(1)} FPS)`)
        console.log(`   P99: ${p99FrameTime.toFixed(2)}ms (${(1000/p99FrameTime).toFixed(1)} FPS)`)
        console.log(`   Min FPS: ${minFPS.toFixed(1)} (${maxFrameTime.toFixed(2)}ms)`)
        console.log(`   Range: ${minFrameTime.toFixed(2)}ms - ${maxFrameTime.toFixed(2)}ms`)
        console.log(`   Consistency: σ=${stdDev.toFixed(2)}ms, CV=${(coefficientOfVariation * 100).toFixed(1)}%`)
        console.log(`   Memory: avg=${avgMemoryDelta.toFixed(0)}B, max=${maxMemoryDelta.toFixed(0)}B`)
        
        // Performance assertions
        const targetFrameTime = 1000 / config.expectedFPS
        expect(avgFrameTime).toBeLessThan(targetFrameTime * 1.2) // 20% tolerance
        expect(p95FrameTime).toBeLessThan(targetFrameTime * 1.5) // 50% tolerance for 95th percentile
        expect(coefficientOfVariation).toBeLessThan(0.4) // Frame time should be consistent
        
        // Memory leak detection
        expect(avgMemoryDelta).toBeLessThan(1000) // Should not leak more than 1KB per frame on average
        
        // Store results for comparison
        global.performanceResults = global.performanceResults || []
        global.performanceResults.push({
          particles: config.particles,
          avgFrameTime,
          avgFPS,
          p95FPS,
          minFPS,
          consistency: coefficientOfVariation,
          memoryDelta: avgMemoryDelta
        })
      })
    })

    it('should show performance scaling analysis', () => {
      if (!global.performanceResults || global.performanceResults.length < 3) {
        console.log('⚠️  Insufficient data for scaling analysis')
        return
      }

      console.log('\n📈 Performance Scaling Analysis:')
      console.log('Particles | Avg FPS | P95 FPS | Min FPS | Consistency | Memory')
      console.log('----------|---------|---------|---------|-------------|--------')
      
      global.performanceResults.forEach(result => {
        console.log(
          `${result.particles.toString().padStart(9)} | ` +
          `${result.avgFPS.toFixed(1).padStart(7)} | ` +
          `${result.p95FPS.toFixed(1).padStart(7)} | ` +
          `${result.minFPS.toFixed(1).padStart(7)} | ` +
          `${(result.consistency * 100).toFixed(1).padStart(10)}% | ` +
          `${result.memoryDelta.toFixed(0).padStart(6)}B`
        )
      })

      // Analyze scaling efficiency
      const results = global.performanceResults.sort((a, b) => a.particles - b.particles)
      for (let i = 1; i < results.length; i++) {
        const prev = results[i - 1]
        const curr = results[i]
        
        const particleRatio = curr.particles / prev.particles
        const performanceRatio = prev.avgFPS / curr.avgFPS
        const efficiency = performanceRatio / particleRatio
        
        console.log(`\n📊 ${prev.particles} → ${curr.particles} particles:`)
        console.log(`   Performance ratio: ${performanceRatio.toFixed(2)}x slower`)
        console.log(`   Particle ratio: ${particleRatio.toFixed(2)}x more`)
        console.log(`   Scaling efficiency: ${efficiency.toFixed(2)} (1.0 = linear scaling)`)
        
        // Efficiency should be reasonable (not exponential degradation)
        expect(efficiency).toBeLessThan(3.0) // Should not be more than 3x worse than linear
      }
    })
  })

  describe('Memory Usage Profiling', () => {
    it('should profile memory allocation patterns', () => {
      console.log('\n💾 Memory Allocation Profiling:')
      
      const particleCounts = [100, 500, 1000, 2000]
      const memoryResults = []
      
      particleCounts.forEach(count => {
        const solver = new Solver(count, 1920, 1080)
        
        // Measure memory access patterns
        const accessTimes = []
        const iterations = 1000
        
        for (let i = 0; i < iterations; i++) {
          const startTime = performance.now()
          const positions = solver.get_positions()
          const endTime = performance.now()
          
          accessTimes.push(endTime - startTime)
          
          // Prevent optimization
          if (positions.length === 0) throw new Error('Invalid positions')
        }
        
        const avgAccessTime = accessTimes.reduce((a, b) => a + b, 0) / accessTimes.length
        const maxAccessTime = Math.max(...accessTimes)
        const memoryPerParticle = avgAccessTime / count
        
        memoryResults.push({ count, avgAccessTime, maxAccessTime, memoryPerParticle })
        
        console.log(`   ${count} particles: ${avgAccessTime.toFixed(4)}ms avg, ${maxAccessTime.toFixed(4)}ms max`)
        console.log(`     Per particle: ${(memoryPerParticle * 1000).toFixed(3)}μs`)
        
        // Memory access should be efficient
        expect(avgAccessTime).toBeLessThan(1.0) // Should be under 1ms
        expect(memoryPerParticle).toBeLessThan(0.001) // Should be under 1μs per particle
      })
      
      // Check memory scaling
      for (let i = 1; i < memoryResults.length; i++) {
        const prev = memoryResults[i - 1]
        const curr = memoryResults[i]
        
        const countRatio = curr.count / prev.count
        const timeRatio = curr.avgAccessTime / prev.avgAccessTime
        
        console.log(`\n📊 Memory scaling ${prev.count} → ${curr.count}:`)
        console.log(`   Count ratio: ${countRatio.toFixed(2)}x`)
        console.log(`   Time ratio: ${timeRatio.toFixed(2)}x`)
        console.log(`   Scaling efficiency: ${(timeRatio / countRatio).toFixed(2)}`)
        
        // Memory access should scale roughly linearly
        expect(timeRatio).toBeLessThan(countRatio * 1.5)
        expect(timeRatio).toBeGreaterThan(countRatio * 0.5)
      }
    })

    it('should profile garbage collection impact', () => {
      console.log('\n🗑️  Garbage Collection Impact Profiling:')
      
      const solver = new Solver(1000, 1920, 1080)
      const gcTimes = []
      const iterations = 100
      
      for (let i = 0; i < iterations; i++) {
        // Force some allocations
        const positions = solver.get_positions()
        const copy = new Float32Array(positions)
        
        // Measure frame time
        const startTime = performance.now()
        solver.update(1.0 / 60.0)
        const endTime = performance.now()
        
        gcTimes.push(endTime - startTime)
        
        // Create garbage to trigger GC
        if (i % 10 === 0) {
          const garbage = new Array(1000).fill(0).map(() => ({ x: Math.random(), y: Math.random() }))
          garbage.length = 0 // Clear reference
        }
      }
      
      const avgGCTime = gcTimes.reduce((a, b) => a + b, 0) / gcTimes.length
      const maxGCTime = Math.max(...gcTimes)
      const gcSpikes = gcTimes.filter(time => time > avgGCTime * 2).length
      
      console.log(`   Average frame time: ${avgGCTime.toFixed(2)}ms`)
      console.log(`   Maximum frame time: ${maxGCTime.toFixed(2)}ms`)
      console.log(`   GC spikes (>2x avg): ${gcSpikes}/${iterations} (${(gcSpikes/iterations*100).toFixed(1)}%)`)
      
      // GC impact should be minimal
      expect(avgGCTime).toBeLessThan(20.0) // Should average under 20ms
      expect(gcSpikes / iterations).toBeLessThan(0.1) // Less than 10% of frames should have GC spikes
    })
  })

  describe('Collision Detection Performance', () => {
    it('should profile collision detection scaling', () => {
      console.log('\n💥 Collision Detection Performance Profiling:')
      
      const densityConfigs = [
        { particles: 50, size: 200, name: 'Very High Density' },
        { particles: 100, size: 300, name: 'High Density' },
        { particles: 200, size: 500, name: 'Medium Density' },
        { particles: 400, size: 800, name: 'Low Density' },
      ]
      
      densityConfigs.forEach(config => {
        const solver = new Solver(config.particles, config.size, config.size)
        const density = config.particles / (config.size * config.size) * 10000 // particles per 10k pixels
        
        // Create collision scenario
        for (let i = 0; i < 5; i++) {
          solver.apply_force(config.size / 2, config.size / 2, config.size / 3)
          solver.update(1.0 / 60.0)
        }
        
        // Measure collision performance
        const collisionTimes = []
        for (let i = 0; i < 60; i++) {
          const startTime = performance.now()
          solver.update(1.0 / 60.0)
          const endTime = performance.now()
          
          collisionTimes.push(endTime - startTime)
        }
        
        const avgCollisionTime = collisionTimes.reduce((a, b) => a + b, 0) / collisionTimes.length
        const maxCollisionTime = Math.max(...collisionTimes)
        
        console.log(`   ${config.name}: ${config.particles} particles, density ${density.toFixed(1)}/10k`)
        console.log(`     Average: ${avgCollisionTime.toFixed(2)}ms, Max: ${maxCollisionTime.toFixed(2)}ms`)
        
        // Collision detection should remain efficient even at high density
        const targetTime = config.particles > 200 ? 25.0 : 16.67 // Allow more time for high particle counts
        expect(avgCollisionTime).toBeLessThan(targetTime)
      })
    })
  })
})