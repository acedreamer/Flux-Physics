// Visual optimization utilities for FLUX physics playground
// Focuses on fine-tuning visual effects and particle behavior for optimal aesthetics and performance

/**
 * Advanced bloom effect optimizer with adaptive quality
 */
class BloomOptimizer {
    constructor() {
        this.qualityLevels = {
            ultra: {
                threshold: 0.05,
                bloomScale: 1.2,
                brightness: 1.1,
                blur: 12,
                quality: 8,
                kernels: null
            },
            high: {
                threshold: 0.1,
                bloomScale: 1.0,
                brightness: 1.0,
                blur: 8,
                quality: 6,
                kernels: null
            },
            medium: {
                threshold: 0.15,
                bloomScale: 0.8,
                brightness: 0.9,
                blur: 6,
                quality: 4,
                kernels: null
            },
            low: {
                threshold: 0.2,
                bloomScale: 0.6,
                brightness: 0.8,
                blur: 4,
                quality: 3,
                kernels: null
            }
        }
        
        this.currentQuality = 'high'
        this.performanceHistory = []
        this.adaptiveEnabled = true
    }
    
    getOptimalSettings(avgFrameTime, particleCount) {
        // Determine optimal bloom quality based on performance
        if (avgFrameTime < 12.0 && particleCount < 800) {
            return this.qualityLevels.ultra
        } else if (avgFrameTime < 16.0 && particleCount < 1200) {
            return this.qualityLevels.high
        } else if (avgFrameTime < 20.0) {
            return this.qualityLevels.medium
        } else {
            return this.qualityLevels.low
        }
    }
    
    updateQuality(performanceData) {
        if (!this.adaptiveEnabled) return this.qualityLevels[this.currentQuality]
        
        this.performanceHistory.push(performanceData)
        if (this.performanceHistory.length > 60) {
            this.performanceHistory.shift()
        }
        
        if (this.performanceHistory.length < 10) {
            return this.qualityLevels[this.currentQuality]
        }
        
        const avgFrameTime = this.performanceHistory.reduce((sum, data) => sum + data.frameTime, 0) / this.performanceHistory.length
        const settings = this.getOptimalSettings(avgFrameTime, performanceData.particleCount)
        
        // Update current quality level
        const newQuality = Object.keys(this.qualityLevels).find(key => 
            this.qualityLevels[key] === settings
        )
        
        if (newQuality !== this.currentQuality) {
            console.log(`🎨 Bloom quality adjusted: ${this.currentQuality} → ${newQuality} (${avgFrameTime.toFixed(1)}ms avg)`)
            this.currentQuality = newQuality
        }
        
        return settings
    }
    
    createCustomBloomFilter(settings) {
        // Enhanced bloom settings for holographic effect
        return {
            threshold: settings.threshold,
            bloomScale: settings.bloomScale,
            brightness: settings.brightness,
            blur: settings.blur,
            quality: settings.quality,
            kernels: settings.kernels
        }
    }
    
    setQuality(quality) {
        if (this.qualityLevels[quality]) {
            this.currentQuality = quality
            this.adaptiveEnabled = false
            console.log(`🎨 Bloom quality manually set to: ${quality}`)
        }
    }
    
    enableAdaptive() {
        this.adaptiveEnabled = true
        console.log('🎨 Adaptive bloom quality enabled')
    }
}

/**
 * Particle visual behavior optimizer
 */
class ParticleVisualOptimizer {
    constructor() {
        this.baseConfig = {
            radius: 4,
            color: 0x00FFFF,
            alpha: 0.9,
            glowLayers: 4,
            velocityScaling: 0.005,
            maxSizeMultiplier: 1.5,
            minSizeMultiplier: 0.8
        }
        
        this.adaptiveConfig = { ...this.baseConfig }
        this.performanceMode = false
    }
    
    optimizeForPerformance(enabled) {
        this.performanceMode = enabled
        
        if (enabled) {
            // Reduce visual complexity for better performance
            this.adaptiveConfig = {
                ...this.baseConfig,
                glowLayers: 2,
                velocityScaling: 0.003,
                maxSizeMultiplier: 1.2,
                alpha: 0.8
            }
            console.log('⚡ Particle visuals optimized for performance')
        } else {
            // Restore full visual quality
            this.adaptiveConfig = { ...this.baseConfig }
            console.log('✨ Particle visuals restored to full quality')
        }
    }
    
    createLayeredParticle(graphics, config = this.adaptiveConfig) {
        graphics.clear()
        
        const layers = [
            { radius: config.radius * 2.5, alpha: 0.05, color: config.color },
            { radius: config.radius * 2.0, alpha: 0.1, color: config.color },
            { radius: config.radius * 1.5, alpha: 0.3, color: config.color },
            { radius: config.radius, alpha: config.alpha, color: config.color }
        ]
        
        // Add bright center for enhanced glow
        if (!this.performanceMode) {
            layers.push({ radius: config.radius * 0.4, alpha: 1.0, color: 0xFFFFFF })
        }
        
        // Only render the number of layers based on performance mode
        const layersToRender = this.performanceMode ? 
            layers.slice(-config.glowLayers) : 
            layers
        
        layersToRender.forEach(layer => {
            graphics.circle(0, 0, layer.radius)
            graphics.fill({
                color: layer.color,
                alpha: layer.alpha
            })
        })
        
        return graphics
    }
    
    calculateVelocityScale(trail, config = this.adaptiveConfig) {
        if (!trail || trail.length < 2) return 1.0
        
        const current = trail[trail.length - 1]
        const previous = trail[trail.length - 2]
        
        if (!current || !previous) return 1.0
        
        const velocity = Math.sqrt(
            Math.pow(current.x - previous.x, 2) + 
            Math.pow(current.y - previous.y, 2)
        )
        
        const sizeMultiplier = 1 + Math.min(velocity * config.velocityScaling, config.maxSizeMultiplier - 1)
        
        // Clamp to prevent extreme scaling
        return Math.max(config.minSizeMultiplier, Math.min(sizeMultiplier, config.maxSizeMultiplier))
    }
    
    getColorVariation(baseColor, particleIndex, time) {
        if (this.performanceMode) return baseColor
        
        // Subtle color variation for visual interest
        const hueShift = Math.sin(particleIndex * 0.1 + time * 0.001) * 0.1
        const saturationShift = Math.cos(particleIndex * 0.15 + time * 0.0008) * 0.05
        
        // Convert to HSL, apply shifts, convert back
        // For simplicity, return base color with slight alpha variation
        return baseColor
    }
    
    getConfig() {
        return { ...this.adaptiveConfig }
    }
}

/**
 * Screen size and resolution optimizer
 */
class ScreenOptimizer {
    constructor() {
        this.screenProfiles = {
            mobile: { maxWidth: 768, particleScale: 0.7, bloomScale: 0.8 },
            tablet: { maxWidth: 1024, particleScale: 0.85, bloomScale: 0.9 },
            desktop: { maxWidth: 1920, particleScale: 1.0, bloomScale: 1.0 },
            ultrawide: { maxWidth: Infinity, particleScale: 1.1, bloomScale: 1.1 }
        }
        
        this.currentProfile = this.detectScreenProfile()
        this.pixelRatio = window.devicePixelRatio || 1
    }
    
    detectScreenProfile() {
        const width = window.innerWidth
        
        for (const [profile, config] of Object.entries(this.screenProfiles)) {
            if (width <= config.maxWidth) {
                return profile
            }
        }
        
        return 'desktop'
    }
    
    getOptimizedSettings() {
        const profile = this.screenProfiles[this.currentProfile]
        const width = window.innerWidth
        const height = window.innerHeight
        
        // Calculate optimal particle count based on screen size
        const screenArea = width * height
        const baseParticleCount = Math.min(1000, Math.max(100, Math.floor(screenArea / 2000)))
        
        return {
            profile: this.currentProfile,
            width,
            height,
            pixelRatio: this.pixelRatio,
            particleScale: profile.particleScale,
            bloomScale: profile.bloomScale,
            recommendedParticleCount: Math.floor(baseParticleCount * profile.particleScale),
            performanceMode: this.currentProfile === 'mobile' || this.pixelRatio > 2
        }
    }
    
    onResize() {
        const newProfile = this.detectScreenProfile()
        if (newProfile !== this.currentProfile) {
            console.log(`📱 Screen profile changed: ${this.currentProfile} → ${newProfile}`)
            this.currentProfile = newProfile
            return true // Indicates settings should be updated
        }
        return false
    }
    
    getCanvasSettings() {
        const settings = this.getOptimizedSettings()
        
        return {
            width: settings.width,
            height: settings.height,
            resolution: Math.min(settings.pixelRatio, 2), // Cap at 2x for performance
            antialias: !settings.performanceMode,
            powerPreference: settings.performanceMode ? 'low-power' : 'high-performance'
        }
    }
}

/**
 * Color palette optimizer for different themes and accessibility
 */
class ColorOptimizer {
    constructor() {
        this.palettes = {
            cyan: {
                primary: 0x00FFFF,
                secondary: 0x0080FF,
                accent: 0xFFFFFF,
                background: 0x0D0D0D,
                name: 'Cyan Holographic'
            },
            magenta: {
                primary: 0xFF00FF,
                secondary: 0xFF0080,
                accent: 0xFFFFFF,
                background: 0x0D0D0D,
                name: 'Magenta Neon'
            },
            green: {
                primary: 0x00FF80,
                secondary: 0x00FF40,
                accent: 0xFFFFFF,
                background: 0x0D0D0D,
                name: 'Matrix Green'
            },
            amber: {
                primary: 0xFFBF00,
                secondary: 0xFF8000,
                accent: 0xFFFFFF,
                background: 0x0D0D0D,
                name: 'Amber Glow'
            },
            blue: {
                primary: 0x0080FF,
                secondary: 0x0040FF,
                accent: 0xFFFFFF,
                background: 0x0D0D0D,
                name: 'Electric Blue'
            }
        }
        
        this.currentPalette = 'cyan'
        this.accessibilityMode = false
    }
    
    setPalette(paletteName) {
        if (this.palettes[paletteName]) {
            this.currentPalette = paletteName
            console.log(`🎨 Color palette changed to: ${this.palettes[paletteName].name}`)
            return this.palettes[paletteName]
        }
        return this.palettes[this.currentPalette]
    }
    
    getCurrentPalette() {
        return this.palettes[this.currentPalette]
    }
    
    enableAccessibilityMode(enabled) {
        this.accessibilityMode = enabled
        
        if (enabled) {
            // Increase contrast and brightness for accessibility
            Object.values(this.palettes).forEach(palette => {
                palette.primaryAlpha = 1.0
                palette.bloomIntensity = 1.5
            })
            console.log('♿ Accessibility mode enabled - increased contrast')
        } else {
            // Restore normal values
            Object.values(this.palettes).forEach(palette => {
                palette.primaryAlpha = 0.9
                palette.bloomIntensity = 1.0
            })
            console.log('♿ Accessibility mode disabled - normal contrast')
        }
    }
    
    getParticleColor(particleIndex, time) {
        const palette = this.getCurrentPalette()
        
        if (this.accessibilityMode) {
            return palette.primary // Solid color for accessibility
        }
        
        // Subtle color variation for visual interest
        const variation = Math.sin(particleIndex * 0.1 + time * 0.001) * 0.1
        return palette.primary // For now, return base color
    }
    
    getAvailablePalettes() {
        return Object.keys(this.palettes).map(key => ({
            key,
            name: this.palettes[key].name,
            primary: this.palettes[key].primary
        }))
    }
}

// Export optimizers
export {
    BloomOptimizer,
    ParticleVisualOptimizer,
    ScreenOptimizer,
    ColorOptimizer
}