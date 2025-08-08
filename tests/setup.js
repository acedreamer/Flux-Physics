// Test setup for FLUX Physics Playground
import { vi } from 'vitest'

// Mock Canvas API for headless testing
const mockCanvasContext = {
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Array(4) })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({ data: new Array(4) })),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
}

// Ensure HTMLCanvasElement exists
if (!global.HTMLCanvasElement) {
  global.HTMLCanvasElement = class HTMLCanvasElement {
    constructor() {
      this.width = 300
      this.height = 150
    }
    
    getContext(type) {
      if (type === '2d') {
        return mockCanvasContext
      }
      return null
    }
  }
}

global.HTMLCanvasElement.prototype.getContext = vi.fn((type) => {
  if (type === '2d') {
    return mockCanvasContext
  }
  return null
})

// Mock WebGL context for Pixi.js
global.HTMLCanvasElement.prototype.getContext = vi.fn((type) => {
  if (type === 'webgl' || type === 'webgl2') {
    return {
      getExtension: vi.fn(),
      getParameter: vi.fn(),
      createShader: vi.fn(),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      createProgram: vi.fn(),
      attachShader: vi.fn(),
      linkProgram: vi.fn(),
      useProgram: vi.fn(),
      createBuffer: vi.fn(),
      bindBuffer: vi.fn(),
      bufferData: vi.fn(),
      enableVertexAttribArray: vi.fn(),
      vertexAttribPointer: vi.fn(),
      drawArrays: vi.fn(),
      viewport: vi.fn(),
      clearColor: vi.fn(),
      clear: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn(),
      blendFunc: vi.fn(),
      getUniformLocation: vi.fn(),
      uniform1f: vi.fn(),
      uniform2f: vi.fn(),
      uniform3f: vi.fn(),
      uniform4f: vi.fn(),
      uniformMatrix4fv: vi.fn(),
      createTexture: vi.fn(),
      bindTexture: vi.fn(),
      texImage2D: vi.fn(),
      texParameteri: vi.fn(),
      generateMipmap: vi.fn(),
      activeTexture: vi.fn(),
      deleteTexture: vi.fn(),
      deleteBuffer: vi.fn(),
      deleteProgram: vi.fn(),
      deleteShader: vi.fn(),
    }
  }
  return null
})

// Mock performance API
global.performance = global.performance || {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(() => []),
  getEntriesByType: vi.fn(() => []),
}

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16))
global.cancelAnimationFrame = vi.fn()

// Mock window dimensions
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
})

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768,
})

// Mock devicePixelRatio
Object.defineProperty(window, 'devicePixelRatio', {
  writable: true,
  configurable: true,
  value: 1,
})

// Mock navigator for audio tests
global.navigator = global.navigator || {}
global.navigator.userAgent = global.navigator.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
global.navigator.mediaDevices = global.navigator.mediaDevices || {
  getUserMedia: vi.fn(),
  getDisplayMedia: vi.fn(),
  enumerateDevices: vi.fn()
}

// Mock window.addEventListener for audio settings
global.window.addEventListener = global.window.addEventListener || vi.fn()
global.window.removeEventListener = global.window.removeEventListener || vi.fn()

// Mock localStorage for audio settings
global.localStorage = global.localStorage || {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Console setup for test output
console.log('🧪 Test environment initialized')
console.log('📊 Canvas API mocked for headless testing')
console.log('🎮 WebGL context mocked for Pixi.js compatibility')
console.log('⏱️  Performance API mocked for timing tests')