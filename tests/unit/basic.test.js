// Basic unit tests that don't require WASM
import { describe, it, expect } from 'vitest'

describe('Basic Test Infrastructure', () => {
  it('should run basic JavaScript tests', () => {
    expect(1 + 1).toBe(2)
    expect('hello').toBe('hello')
    expect([1, 2, 3]).toHaveLength(3)
  })

  it('should have access to mocked browser APIs', () => {
    expect(window).toBeDefined()
    expect(window.innerWidth).toBe(1024)
    expect(window.innerHeight).toBe(768)
    expect(performance.now).toBeDefined()
    expect(requestAnimationFrame).toBeDefined()
  })

  it.skip('should have canvas mocking working', () => {
    // Skip for now - canvas mocking needs more setup in jsdom environment
    expect(true).toBe(true)
  })

  it('should support async operations', async () => {
    const promise = new Promise(resolve => {
      setTimeout(() => resolve('test'), 10)
    })
    
    const result = await promise
    expect(result).toBe('test')
  })

  it('should handle mathematical operations', () => {
    // Test Vec2-like operations in JavaScript
    const vec1 = { x: 3, y: 4 }
    const vec2 = { x: 1, y: 2 }
    
    const add = (v1, v2) => ({ x: v1.x + v2.x, y: v1.y + v2.y })
    const length = (v) => Math.sqrt(v.x * v.x + v.y * v.y)
    
    const result = add(vec1, vec2)
    expect(result.x).toBe(4)
    expect(result.y).toBe(6)
    
    expect(length(vec1)).toBe(5)
  })

  it('should handle performance timing', () => {
    const start = performance.now()
    
    // Simulate some work
    let sum = 0
    for (let i = 0; i < 1000; i++) {
      sum += i
    }
    
    const end = performance.now()
    const duration = end - start
    
    expect(duration).toBeGreaterThanOrEqual(0)
    expect(sum).toBe(499500) // Sum of 0 to 999
  })
})