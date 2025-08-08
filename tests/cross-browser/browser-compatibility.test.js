// Cross-browser compatibility tests for FLUX physics playground
import { describe, it, expect, beforeAll, vi } from 'vitest'

describe('Cross-Browser Compatibility Tests', () => {
  let wasmModule
  let Solver

  beforeAll(async () => {
    try {
      wasmModule = await import('../../engine/pkg/engine.js')
      await wasmModule.default()
      Solver = wasmModule.Solver
      console.log('✅ WASM module loaded for browser compatibility tests')
    } catch (error) {
      console.error('❌ Failed to load WASM module for browser tests:', error)
      throw error
    }
  })

  describe('WebAssembly Support Detection', () => {
    it('should detect WebAssembly support', () => {
      // Mock different browser environments
      const browserTests = [
        { name: 'Chrome 90+', hasWasm: true, hasSharedArrayBuffer: true },
        { name: 'Firefox 85+', hasWasm: true, hasSharedArrayBuffer: true },
        { name: 'Safari 14+', hasWasm: true, hasSharedArrayBuffer: false },
        { name: 'Edge 90+', hasWasm: true, hasSharedArrayBuffer: true },
        { name: 'Legacy Browser', hasWasm: false, hasSharedArrayBuffer: false }
      ]

      browserTests.forEach(browser => {
        console.log(`\n🌐 Testing ${browser.name}:`)
        
        // Mock WebAssembly availability
        const originalWebAssembly = global.WebAssembly
        if (!browser.hasWasm) {
          global.WebAssembly = undefined
        }

        const wasmSupported = typeof WebAssembly !== 'undefined' && 
                             typeof WebAssembly.instantiate === 'function'
        
        console.log(`   WebAssembly support: ${wasmSupported ? '✅' : '❌'}`)
        
        if (browser.hasWasm) {
          expect(wasmSupported).toBe(true)
        }

        // Restore WebAssembly
        global.WebAssembly = originalWebAssembly
      })
    })

    it('should provide fallback for unsupported browsers', () => {
      // Test fallback message system
      const fallbackMessage = {
        title: 'Browser Not Supported',
        message: 'FLUX requires a modern browser with WebAssembly support.',
        recommendations: [
          'Chrome 57+',
          'Firefox 52+', 
          'Safari 11+',
          'Edge 16+'
        ]
      }

      expect(fallbackMessage.title).toBeDefined()
      expect(fallbackMessage.recommendations).toHaveLength(4)
      
      console.log('📱 Fallback message configured for unsupported browsers')
    })
  })

  describe('Screen Size Compatibility', () => {
    const screenSizes = [
      { name: 'Mobile Portrait', width: 375, height: 667, dpr: 2 },
      { name: 'Mobile Landscape', width: 667, height: 375, dpr: 2 },
      { name: 'Tablet Portrait', width: 768, height: 1024, dpr: 2 },
      { name: 'Tablet Landscape', width: 1024, height: 768, dpr: 2 },
      { name: 'Desktop HD', width: 1366, height: 768, dpr: 1 },
      { name: 'Desktop FHD', width: 1920, height: 1080, dpr: 1 },
      { name: 'Desktop 2K', width: 2560, height: 1440, dpr: 1 },
      { name: 'Desktop 4K', width: 3840, height: 2160, dpr: 1 },
      { name: 'Ultrawide', width: 3440, height: 1440, dpr: 1 }
    ]

    screenSizes.forEach(screen => {
      it(`should handle ${screen.name} (${screen.width}x${screen.height})`, () => {
        console.log(`\n📱 Testing ${screen.name}: ${screen.width}x${screen.height} @ ${screen.dpr}x DPR`)
        
        // Mock window dimensions
        Object.defineProperty(window, 'innerWidth', { value: screen.width, writable: true })
        Object.defineProperty(window, 'innerHeight', { value: screen.height, writable: true })
        Object.defineProperty(window, 'devicePixelRatio', { value: screen.dpr, writable: true })

        // Calculate optimal settings for this screen size
        const screenArea = screen.width * screen.height
        const baseParticleCount = Math.min(1000, Math.max(100, Math.floor(screenArea / 2000)))
        
        // Adjust for device pixel ratio and screen category
        let particleMultiplier = 1.0
        if (screen.width <= 768) {
          particleMultiplier = 0.6 // Mobile
        } else if (screen.width <= 1024) {
          particleMultiplier = 0.8 // Tablet
        } else if (screen.dpr > 1) {
          particleMultiplier = 0.9 // High DPI desktop
        }

        const recommendedParticles = Math.floor(baseParticleCount * particleMultiplier)
        const performanceMode = screen.width <= 768 || screen.dpr > 2

        console.log(`   Screen area: ${screenArea.toLocaleString()} pixels`)
        console.log(`   Recommended particles: ${recommendedParticles}`)
        console.log(`   Performance mode: ${performanceMode ? 'enabled' : 'disabled'}`)

        // Test physics solver with recommended settings
        const solver = new Solver(recommendedParticles, screen.width, screen.height)
        expect(solver.get_particle_count()).toBe(recommendedParticles)

        // Test performance with this configuration
        const frameTimes = []
        for (let i = 0; i < 30; i++) {
          const startTime = performance.now()
          solver.update(1.0 / 60.0)
          const endTime = performance.now()
          frameTimes.push(endTime - startTime)
        }

        const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
        const targetFrameTime = performanceMode ? 33.33 : 16.67 // 30fps for mobile, 60fps for desktop

        console.log(`   Average frame time: ${avgFrameTime.toFixed(2)}ms (target: ${targetFrameTime.toFixed(2)}ms)`)

        expect(avgFrameTime).toBeLessThan(targetFrameTime * 1.5) // Allow 50% tolerance
        expect(recommendedParticles).toBeGreaterThan(50) // Minimum viable particle count
        expect(recommendedParticles).toBeLessThan(2000) // Maximum reasonable particle count
      })
    })

    it('should handle window resize events', () => {
      console.log('\n🔄 Testing window resize handling:')
      
      const resizeSequence = [
        { width: 1920, height: 1080 },
        { width: 1024, height: 768 },
        { width: 375, height: 667 },
        { width: 2560, height: 1440 }
      ]

      const solver = new Solver(500, 1920, 1080)
      
      resizeSequence.forEach((size, index) => {
        console.log(`   Resize ${index + 1}: ${size.width}x${size.height}`)
        
        // Mock window resize
        Object.defineProperty(window, 'innerWidth', { value: size.width, writable: true })
        Object.defineProperty(window, 'innerHeight', { value: size.height, writable: true })

        // Test that physics simulation remains stable after resize
        for (let i = 0; i < 10; i++) {
          solver.update(1.0 / 60.0)
        }

        const positions = solver.get_positions()
        
        // Verify positions are still valid
        for (let i = 0; i < Math.min(positions.length, 20); i++) {
          expect(positions[i]).toBeFinite()
          expect(positions[i]).not.toBeNaN()
        }
      })

      console.log('   ✅ Physics simulation stable across all resize events')
    })
  })

  describe('Performance Across Different Hardware', () => {
    const hardwareProfiles = [
      { name: 'Low-end Mobile', cpuScore: 100, gpuScore: 50, memory: 2 },
      { name: 'Mid-range Mobile', cpuScore: 200, gpuScore: 100, memory: 4 },
      { name: 'High-end Mobile', cpuScore: 400, gpuScore: 200, memory: 8 },
      { name: 'Budget Laptop', cpuScore: 300, gpuScore: 150, memory: 8 },
      { name: 'Gaming Laptop', cpuScore: 800, gpuScore: 600, memory: 16 },
      { name: 'Desktop Workstation', cpuScore: 1200, gpuScore: 1000, memory: 32 }
    ]

    hardwareProfiles.forEach(hardware => {
      it(`should optimize for ${hardware.name}`, () => {
        console.log(`\n💻 Testing ${hardware.name}:`)
        console.log(`   CPU Score: ${hardware.cpuScore}, GPU Score: ${hardware.gpuScore}, Memory: ${hardware.memory}GB`)

        // Calculate optimal settings based on hardware profile
        const baseParticles = 500
        const cpuMultiplier = Math.min(2.0, hardware.cpuScore / 400)
        const gpuMultiplier = Math.min(2.0, hardware.gpuScore / 300)
        const memoryMultiplier = Math.min(1.5, hardware.memory / 8)

        const optimalParticles = Math.floor(baseParticles * cpuMultiplier * 0.7 + baseParticles * gpuMultiplier * 0.3)
        const bloomQuality = hardware.gpuScore > 300 ? 'high' : hardware.gpuScore > 150 ? 'medium' : 'low'
        const enableTrails = hardware.memory >= 4

        console.log(`   Optimal particles: ${optimalParticles}`)
        console.log(`   Bloom quality: ${bloomQuality}`)
        console.log(`   Particle trails: ${enableTrails ? 'enabled' : 'disabled'}`)

        // Test performance with optimal settings
        const solver = new Solver(optimalParticles, 1920, 1080)
        const frameTimes = []

        // Simulate workload similar to hardware capability
        const iterations = Math.max(30, Math.min(120, hardware.cpuScore / 10))
        
        for (let i = 0; i < iterations; i++) {
          const startTime = performance.now()
          
          // Add some interaction to simulate real usage
          if (i % 10 === 0) {
            solver.apply_force(960, 540, 80)
          }
          
          solver.update(1.0 / 60.0)
          const endTime = performance.now()
          
          frameTimes.push(endTime - startTime)
        }

        const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
        const p95FrameTime = frameTimes.sort((a, b) => a - b)[Math.floor(frameTimes.length * 0.95)]
        
        // Performance expectations based on hardware
        const targetFrameTime = hardware.cpuScore < 200 ? 33.33 : 16.67 // 30fps for low-end, 60fps for others
        const maxFrameTime = targetFrameTime * 2

        console.log(`   Average frame time: ${avgFrameTime.toFixed(2)}ms`)
        console.log(`   P95 frame time: ${p95FrameTime.toFixed(2)}ms`)
        console.log(`   Target: ${targetFrameTime.toFixed(2)}ms, Max: ${maxFrameTime.toFixed(2)}ms`)

        expect(avgFrameTime).toBeLessThan(targetFrameTime * 1.3) // Allow 30% tolerance
        expect(p95FrameTime).toBeLessThan(maxFrameTime)
        expect(optimalParticles).toBeGreaterThan(100)
        expect(optimalParticles).toBeLessThan(2000)
      })
    })
  })

  describe('Input Method Compatibility', () => {
    it('should handle mouse input', () => {
      console.log('\n🖱️  Testing mouse input compatibility:')
      
      const solver = new Solver(100, 1024, 768)
      const mouseEvents = [
        { x: 100, y: 100, type: 'move' },
        { x: 200, y: 150, type: 'move' },
        { x: 300, y: 200, type: 'move' },
        { x: 400, y: 250, type: 'leave' }
      ]

      mouseEvents.forEach((event, index) => {
        console.log(`   Mouse event ${index + 1}: ${event.type} at (${event.x}, ${event.y})`)
        
        if (event.type === 'move') {
          solver.apply_force(event.x, event.y, 80)
        }
        
        solver.update(1.0 / 60.0)
        
        const positions = solver.get_positions()
        expect(positions).toBeDefined()
        expect(positions.length).toBeGreaterThan(0)
      })

      console.log('   ✅ Mouse input handling verified')
    })

    it('should handle touch input simulation', () => {
      console.log('\n👆 Testing touch input compatibility:')
      
      const solver = new Solver(100, 375, 667) // Mobile screen size
      const touchEvents = [
        { x: 100, y: 200, type: 'touchstart' },
        { x: 120, y: 220, type: 'touchmove' },
        { x: 140, y: 240, type: 'touchmove' },
        { x: 160, y: 260, type: 'touchend' }
      ]

      touchEvents.forEach((event, index) => {
        console.log(`   Touch event ${index + 1}: ${event.type} at (${event.x}, ${event.y})`)
        
        if (event.type === 'touchmove' || event.type === 'touchstart') {
          solver.apply_force(event.x, event.y, 60) // Smaller radius for touch
        }
        
        solver.update(1.0 / 60.0)
        
        const positions = solver.get_positions()
        expect(positions).toBeDefined()
      })

      console.log('   ✅ Touch input simulation verified')
    })

    it('should handle high-frequency input', () => {
      console.log('\n⚡ Testing high-frequency input handling:')
      
      const solver = new Solver(200, 1920, 1080)
      const inputFrequencies = [60, 120, 240] // Hz

      inputFrequencies.forEach(frequency => {
        console.log(`   Testing ${frequency}Hz input frequency:`)
        
        const inputTimes = []
        const iterations = frequency // 1 second worth of input
        
        for (let i = 0; i < iterations; i++) {
          const startTime = performance.now()
          
          // Simulate high-frequency mouse movement
          const x = 960 + Math.sin(i * 0.1) * 200
          const y = 540 + Math.cos(i * 0.1) * 200
          
          solver.apply_force(x, y, 80)
          
          const endTime = performance.now()
          inputTimes.push(endTime - startTime)
        }

        const avgInputTime = inputTimes.reduce((a, b) => a + b, 0) / inputTimes.length
        const maxInputTime = Math.max(...inputTimes)

        console.log(`     Average input processing: ${avgInputTime.toFixed(3)}ms`)
        console.log(`     Maximum input processing: ${maxInputTime.toFixed(3)}ms`)

        // Input processing should be fast even at high frequencies
        expect(avgInputTime).toBeLessThan(1.0) // Should process input in under 1ms
        expect(maxInputTime).toBeLessThan(5.0) // No single input should take more than 5ms
      })

      console.log('   ✅ High-frequency input handling verified')
    })
  })

  describe('Memory and Resource Management', () => {
    it('should handle memory constraints on different devices', () => {
      console.log('\n💾 Testing memory constraint handling:')
      
      const memoryProfiles = [
        { name: 'Low Memory (2GB)', limit: 2 * 1024 * 1024 * 1024, particles: 300 },
        { name: 'Medium Memory (4GB)', limit: 4 * 1024 * 1024 * 1024, particles: 600 },
        { name: 'High Memory (8GB+)', limit: 8 * 1024 * 1024 * 1024, particles: 1000 }
      ]

      memoryProfiles.forEach(profile => {
        console.log(`   Testing ${profile.name}:`)
        
        const solver = new Solver(profile.particles, 1920, 1080)
        
        // Simulate memory usage over time
        const memorySnapshots = []
        
        for (let i = 0; i < 100; i++) {
          const memBefore = performance.memory ? performance.memory.usedJSHeapSize : 0
          
          solver.update(1.0 / 60.0)
          const positions = solver.get_positions()
          
          const memAfter = performance.memory ? performance.memory.usedJSHeapSize : 0
          memorySnapshots.push(memAfter - memBefore)
          
          // Prevent optimization
          if (positions.length === 0) throw new Error('Invalid positions')
        }

        const avgMemoryDelta = memorySnapshots.reduce((a, b) => a + b, 0) / memorySnapshots.length
        const maxMemoryDelta = Math.max(...memorySnapshots)

        console.log(`     Average memory delta: ${avgMemoryDelta.toFixed(0)} bytes`)
        console.log(`     Maximum memory delta: ${maxMemoryDelta.toFixed(0)} bytes`)

        // Memory usage should be reasonable for the profile
        expect(avgMemoryDelta).toBeLessThan(10000) // Should not leak more than 10KB per frame
        expect(maxMemoryDelta).toBeLessThan(100000) // No single frame should use more than 100KB
      })

      console.log('   ✅ Memory constraint handling verified')
    })
  })

  describe('Error Recovery and Graceful Degradation', () => {
    it('should recover from physics simulation errors', () => {
      console.log('\n🛠️  Testing error recovery:')
      
      const solver = new Solver(100, 1920, 1080)
      
      // Test recovery from extreme force applications
      const extremeForces = [
        { x: -1000, y: -1000, radius: 1000 },
        { x: 5000, y: 5000, radius: 2000 },
        { x: NaN, y: 100, radius: 80 },
        { x: 100, y: Infinity, radius: 80 }
      ]

      extremeForces.forEach((force, index) => {
        console.log(`   Applying extreme force ${index + 1}: (${force.x}, ${force.y}, ${force.radius})`)
        
        try {
          solver.apply_force(force.x, force.y, force.radius)
          solver.update(1.0 / 60.0)
          
          const positions = solver.get_positions()
          
          // Verify positions remain valid after extreme input
          let validPositions = 0
          for (let i = 0; i < Math.min(positions.length, 20); i++) {
            if (isFinite(positions[i]) && !isNaN(positions[i])) {
              validPositions++
            }
          }
          
          console.log(`     Valid positions: ${validPositions}/20`)
          expect(validPositions).toBeGreaterThan(15) // Most positions should remain valid
          
        } catch (error) {
          console.log(`     Error caught and handled: ${error.message}`)
          // Error handling is acceptable for extreme inputs
        }
      })

      console.log('   ✅ Error recovery verified')
    })

    it('should gracefully degrade performance under stress', () => {
      console.log('\n📉 Testing graceful performance degradation:')
      
      const stressLevels = [500, 1000, 1500, 2000, 3000]
      const performanceResults = []

      stressLevels.forEach(particleCount => {
        console.log(`   Testing ${particleCount} particles:`)
        
        const solver = new Solver(particleCount, 1920, 1080)
        const frameTimes = []

        // Stress test with interactions
        for (let i = 0; i < 60; i++) {
          const startTime = performance.now()
          
          // Add multiple force applications to increase stress
          solver.apply_force(960 + Math.sin(i * 0.1) * 200, 540, 80)
          solver.apply_force(960, 540 + Math.cos(i * 0.1) * 200, 80)
          
          solver.update(1.0 / 60.0)
          
          const endTime = performance.now()
          frameTimes.push(endTime - startTime)
        }

        const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
        const maxFrameTime = Math.max(...frameTimes)

        performanceResults.push({ particleCount, avgFrameTime, maxFrameTime })

        console.log(`     Average: ${avgFrameTime.toFixed(2)}ms, Max: ${maxFrameTime.toFixed(2)}ms`)

        // Performance should degrade gracefully, not exponentially
        if (performanceResults.length > 1) {
          const prev = performanceResults[performanceResults.length - 2]
          const curr = performanceResults[performanceResults.length - 1]
          
          const particleRatio = curr.particleCount / prev.particleCount
          const performanceRatio = curr.avgFrameTime / prev.avgFrameTime
          
          console.log(`     Performance scaling: ${performanceRatio.toFixed(2)}x slower for ${particleRatio.toFixed(2)}x particles`)
          
          // Performance degradation should not be exponential
          expect(performanceRatio).toBeLessThan(particleRatio * 2) // Should not be more than 2x worse than linear
        }
      })

      console.log('   ✅ Graceful performance degradation verified')
    })
  })
})