// Memory optimization utilities for FLUX physics playground
// Focuses on reducing garbage collection and improving memory efficiency

/**
 * Object pool for reusing objects to reduce garbage collection
 */
class ObjectPool {
    constructor(createFn, resetFn, initialSize = 10) {
        this.createFn = createFn
        this.resetFn = resetFn
        this.pool = []
        this.used = new Set()
        
        // Pre-populate pool
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn())
        }
    }
    
    acquire() {
        let obj
        if (this.pool.length > 0) {
            obj = this.pool.pop()
        } else {
            obj = this.createFn()
        }
        
        this.used.add(obj)
        return obj
    }
    
    release(obj) {
        if (this.used.has(obj)) {
            this.used.delete(obj)
            this.resetFn(obj)
            this.pool.push(obj)
        }
    }
    
    releaseAll() {
        this.used.forEach(obj => {
            this.resetFn(obj)
            this.pool.push(obj)
        })
        this.used.clear()
    }
    
    getStats() {
        return {
            poolSize: this.pool.length,
            usedCount: this.used.size,
            totalAllocated: this.pool.length + this.used.size
        }
    }
}

/**
 * Memory-efficient particle trail system using circular buffers
 */
class OptimizedTrailSystem {
    constructor(maxParticles, trailLength = 8) {
        this.maxParticles = maxParticles
        this.trailLength = trailLength
        
        // Pre-allocate circular buffers for all particles
        this.trails = new Array(maxParticles)
        this.trailIndices = new Int32Array(maxParticles)
        this.trailCounts = new Int32Array(maxParticles)
        
        for (let i = 0; i < maxParticles; i++) {
            this.trails[i] = new Float32Array(trailLength * 2) // x, y pairs
            this.trailIndices[i] = 0
            this.trailCounts[i] = 0
        }
    }
    
    addTrailPoint(particleIndex, x, y) {
        if (particleIndex >= this.maxParticles) return
        
        const trail = this.trails[particleIndex]
        const index = this.trailIndices[particleIndex]
        const baseIndex = index * 2
        
        trail[baseIndex] = x
        trail[baseIndex + 1] = y
        
        this.trailIndices[particleIndex] = (index + 1) % this.trailLength
        this.trailCounts[particleIndex] = Math.min(this.trailCounts[particleIndex] + 1, this.trailLength)
    }
    
    getTrailPoints(particleIndex) {
        if (particleIndex >= this.maxParticles) return []
        
        const trail = this.trails[particleIndex]
        const count = this.trailCounts[particleIndex]
        const currentIndex = this.trailIndices[particleIndex]
        const points = []
        
        for (let i = 0; i < count; i++) {
            const index = (currentIndex - 1 - i + this.trailLength) % this.trailLength
            const baseIndex = index * 2
            points.push({
                x: trail[baseIndex],
                y: trail[baseIndex + 1]
            })
        }
        
        return points
    }
    
    clearTrail(particleIndex) {
        if (particleIndex >= this.maxParticles) return
        this.trailCounts[particleIndex] = 0
        this.trailIndices[particleIndex] = 0
    }
    
    getMemoryUsage() {
        const trailMemory = this.maxParticles * this.trailLength * 2 * 4 // Float32Array bytes
        const indexMemory = this.maxParticles * 4 * 2 // Int32Array bytes
        return trailMemory + indexMemory
    }
}

/**
 * Memory pool for Float32Array buffers to reduce allocations
 */
class BufferPool {
    constructor() {
        this.pools = new Map() // size -> array of buffers
    }
    
    acquire(size) {
        if (!this.pools.has(size)) {
            this.pools.set(size, [])
        }
        
        const pool = this.pools.get(size)
        if (pool.length > 0) {
            return pool.pop()
        } else {
            return new Float32Array(size)
        }
    }
    
    release(buffer) {
        const size = buffer.length
        if (!this.pools.has(size)) {
            this.pools.set(size, [])
        }
        
        // Clear buffer before returning to pool
        buffer.fill(0)
        this.pools.get(size).push(buffer)
    }
    
    getStats() {
        const stats = {}
        let totalBuffers = 0
        let totalMemory = 0
        
        this.pools.forEach((buffers, size) => {
            stats[size] = buffers.length
            totalBuffers += buffers.length
            totalMemory += buffers.length * size * 4 // Float32Array bytes
        })
        
        return {
            poolsBySize: stats,
            totalBuffers,
            totalMemoryBytes: totalMemory
        }
    }
    
    cleanup() {
        // Remove empty pools and limit pool sizes
        const maxPoolSize = 10
        
        this.pools.forEach((buffers, size) => {
            if (buffers.length === 0) {
                this.pools.delete(size)
            } else if (buffers.length > maxPoolSize) {
                buffers.splice(maxPoolSize)
            }
        })
    }
}

/**
 * Garbage collection monitoring and optimization
 */
class GCOptimizer {
    constructor() {
        this.gcEvents = []
        this.lastHeapSize = 0
        this.gcThreshold = 1024 * 1024 // 1MB
        this.maxGCEvents = 100
        
        this.startMonitoring()
    }
    
    startMonitoring() {
        if (performance.memory) {
            setInterval(() => {
                this.checkGC()
            }, 100) // Check every 100ms
        }
    }
    
    checkGC() {
        if (!performance.memory) return
        
        const currentHeap = performance.memory.usedJSHeapSize
        const heapDelta = this.lastHeapSize - currentHeap
        
        // Detect potential GC event (significant heap reduction)
        if (heapDelta > this.gcThreshold) {
            this.gcEvents.push({
                timestamp: performance.now(),
                heapBefore: this.lastHeapSize,
                heapAfter: currentHeap,
                freedMemory: heapDelta
            })
            
            // Limit stored events
            if (this.gcEvents.length > this.maxGCEvents) {
                this.gcEvents.shift()
            }
        }
        
        this.lastHeapSize = currentHeap
    }
    
    getGCStats() {
        if (this.gcEvents.length === 0) {
            return {
                recentGCEvents: 0,
                avgFreedMemory: 0,
                gcFrequency: 0,
                lastGCTime: null
            }
        }
        
        const now = performance.now()
        const recentEvents = this.gcEvents.filter(event => now - event.timestamp < 10000) // Last 10 seconds
        
        const avgFreedMemory = recentEvents.reduce((sum, event) => sum + event.freedMemory, 0) / recentEvents.length
        const gcFrequency = recentEvents.length / 10 // Events per second
        const lastGCTime = this.gcEvents[this.gcEvents.length - 1].timestamp
        
        return {
            recentGCEvents: recentEvents.length,
            avgFreedMemory: Math.round(avgFreedMemory),
            gcFrequency: gcFrequency.toFixed(2),
            lastGCTime: Math.round(now - lastGCTime)
        }
    }
    
    suggestOptimizations() {
        const stats = this.getGCStats()
        const suggestions = []
        
        if (stats.gcFrequency > 0.5) {
            suggestions.push('High GC frequency detected. Consider object pooling.')
        }
        
        if (stats.avgFreedMemory > 5 * 1024 * 1024) { // 5MB
            suggestions.push('Large memory allocations detected. Consider buffer reuse.')
        }
        
        if (stats.recentGCEvents > 20) {
            suggestions.push('Frequent GC events. Consider reducing temporary object creation.')
        }
        
        return suggestions
    }
}

/**
 * Memory-efficient event system to replace frequent addEventListener/removeEventListener
 */
class OptimizedEventSystem {
    constructor() {
        this.handlers = new Map()
        this.eventPool = new ObjectPool(
            () => ({ type: '', data: null, timestamp: 0 }),
            (event) => { event.type = ''; event.data = null; event.timestamp = 0 }
        )
    }
    
    on(eventType, handler) {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, new Set())
        }
        this.handlers.get(eventType).add(handler)
    }
    
    off(eventType, handler) {
        if (this.handlers.has(eventType)) {
            this.handlers.get(eventType).delete(handler)
        }
    }
    
    emit(eventType, data) {
        if (!this.handlers.has(eventType)) return
        
        const event = this.eventPool.acquire()
        event.type = eventType
        event.data = data
        event.timestamp = performance.now()
        
        this.handlers.get(eventType).forEach(handler => {
            try {
                handler(event)
            } catch (error) {
                console.error(`Error in event handler for ${eventType}:`, error)
            }
        })
        
        this.eventPool.release(event)
    }
    
    getStats() {
        const handlerCounts = {}
        let totalHandlers = 0
        
        this.handlers.forEach((handlers, eventType) => {
            handlerCounts[eventType] = handlers.size
            totalHandlers += handlers.size
        })
        
        return {
            eventTypes: Object.keys(handlerCounts).length,
            handlerCounts,
            totalHandlers,
            eventPoolStats: this.eventPool.getStats()
        }
    }
}

// Export optimizers
export {
    ObjectPool,
    OptimizedTrailSystem,
    BufferPool,
    GCOptimizer,
    OptimizedEventSystem
}