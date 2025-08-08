// Aesthetic validation system for FLUX physics playground
// Ensures all visual requirements from the specification are met

/**
 * Comprehensive aesthetic validator that checks all visual requirements
 */
class AestheticValidator {
  constructor() {
    this.requirements = {
      // Requirement 1: Visual Environment
      fullscreenCanvas: {
        description: "Canvas covers entire viewport with no scrollbars",
        check: () => this.validateFullscreenCanvas(),
      },
      fluxTitle: {
        description: "FLUX title positioned at bottom left with 20% opacity",
        check: () => this.validateFluxTitle(),
      },
      glowingParticles: {
        description:
          "Multiple glowing particles with neon colors (cyan #00FFFF)",
        check: () => this.validateGlowingParticles(),
      },
      bloomEffect: {
        description: "Soft bloom effect creates holographic glow",
        check: () => this.validateBloomEffect(),
      },
      monospaceFont: {
        description: "Monospaced font for title (IBM Plex Mono)",
        check: () => this.validateMonospaceFont(),
      },

      // Requirement 6: Visual Aesthetic
      darkBackground: {
        description: "Dark background color (#0D0D0D)",
        check: () => this.validateDarkBackground(),
      },
      neonColors: {
        description: "Vibrant neon colors with bloom effects",
        check: () => this.validateNeonColors(),
      },
      minimalUI: {
        description: "Minimal UI with only essential elements",
        check: () => this.validateMinimalUI(),
      },
      holographicAtmosphere: {
        description: "Holographic, sci-fi laboratory atmosphere",
        check: () => this.validateHolographicAtmosphere(),
      },
    };

    this.validationResults = {};
    this.pixiApp = null;
    this.particleRenderer = null;
  }

  /**
   * Initialize validator with Pixi.js application and renderer
   */
  initialize(pixiApp, particleRenderer) {
    this.pixiApp = pixiApp;
    this.particleRenderer = particleRenderer;
    console.log("🎨 Aesthetic validator initialized");
  }

  /**
   * Run all aesthetic validations
   */
  async validateAll() {
    console.log("\n🎨 Running comprehensive aesthetic validation...");

    this.validationResults = {};
    let passedCount = 0;
    let totalCount = 0;

    for (const [key, requirement] of Object.entries(this.requirements)) {
      totalCount++;

      try {
        const result = await requirement.check();
        this.validationResults[key] = {
          passed: result.passed,
          message: result.message,
          details: result.details || {},
          description: requirement.description,
        };

        if (result.passed) {
          passedCount++;
          console.log(`✅ ${requirement.description}`);
          if (result.message) console.log(`   ${result.message}`);
        } else {
          console.log(`❌ ${requirement.description}`);
          console.log(`   ${result.message}`);
        }
      } catch (error) {
        this.validationResults[key] = {
          passed: false,
          message: `Validation error: ${error.message}`,
          details: { error: error.toString() },
          description: requirement.description,
        };
        console.log(`❌ ${requirement.description}`);
        console.log(`   Error: ${error.message}`);
      }
    }

    const successRate = ((passedCount / totalCount) * 100).toFixed(1);
    console.log(
      `\n🎨 Aesthetic validation complete: ${passedCount}/${totalCount} checks passed (${successRate}%)`
    );

    return {
      passed: passedCount === totalCount,
      passedCount,
      totalCount,
      successRate: parseFloat(successRate),
      results: this.validationResults,
    };
  }

  /**
   * Validate fullscreen canvas setup
   */
  validateFullscreenCanvas() {
    const canvas = document.querySelector("canvas");
    if (!canvas) {
      return { passed: false, message: "Canvas element not found" };
    }

    const body = document.body;
    const html = document.documentElement;

    // Check if canvas covers viewport
    const canvasRect = canvas.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const coversViewport =
      Math.abs(canvasRect.width - viewportWidth) < 5 &&
      Math.abs(canvasRect.height - viewportHeight) < 5;

    // Check for scrollbars
    const hasScrollbars =
      body.scrollHeight > body.clientHeight ||
      body.scrollWidth > body.clientWidth ||
      html.scrollHeight > html.clientHeight ||
      html.scrollWidth > html.clientWidth;

    if (!coversViewport) {
      return {
        passed: false,
        message: `Canvas size (${canvasRect.width}x${canvasRect.height}) doesn't match viewport (${viewportWidth}x${viewportHeight})`,
        details: { canvasRect, viewportWidth, viewportHeight },
      };
    }

    if (hasScrollbars) {
      return {
        passed: false,
        message: "Scrollbars detected - canvas should prevent overflow",
        details: {
          bodyScrollHeight: body.scrollHeight,
          bodyClientHeight: body.clientHeight,
        },
      };
    }

    return {
      passed: true,
      message: `Canvas properly covers ${viewportWidth}x${viewportHeight} viewport`,
      details: { canvasRect, viewportWidth, viewportHeight },
    };
  }

  /**
   * Validate FLUX title positioning and styling
   */
  validateFluxTitle() {
    const titleElement = document.querySelector("h1");
    if (!titleElement) {
      return { passed: false, message: "FLUX title element not found" };
    }

    const computedStyle = window.getComputedStyle(titleElement);
    const rect = titleElement.getBoundingClientRect();

    // Check text content
    if (!titleElement.textContent.includes("FLUX")) {
      return { passed: false, message: 'Title does not contain "FLUX"' };
    }

    // Check positioning (bottom left)
    const isBottomLeft =
      computedStyle.position === "absolute" &&
      parseFloat(computedStyle.left) < 100 && // Near left edge
      parseFloat(computedStyle.bottom) < 100; // Near bottom edge

    if (!isBottomLeft) {
      return {
        passed: false,
        message: "Title not positioned at bottom left",
        details: {
          position: computedStyle.position,
          left: computedStyle.left,
          bottom: computedStyle.bottom,
          rect,
        },
      };
    }

    // Check opacity (should be around 20% = 0.2)
    const opacity = parseFloat(computedStyle.opacity);
    if (Math.abs(opacity - 0.2) > 0.05) {
      return {
        passed: false,
        message: `Title opacity is ${opacity}, expected ~0.2`,
        details: { opacity },
      };
    }

    // Check for text-shadow (holographic effect)
    const hasTextShadow =
      computedStyle.textShadow && computedStyle.textShadow !== "none";
    if (!hasTextShadow) {
      return {
        passed: false,
        message: "Title missing holographic text-shadow effect",
        details: { textShadow: computedStyle.textShadow },
      };
    }

    return {
      passed: true,
      message: `FLUX title properly positioned with ${opacity} opacity and holographic effect`,
      details: { opacity, textShadow: computedStyle.textShadow, rect },
    };
  }

  /**
   * Validate glowing particles with neon colors
   */
  validateGlowingParticles() {
    if (!this.pixiApp || !this.particleRenderer) {
      return {
        passed: false,
        message: "Pixi.js application or particle renderer not available",
      };
    }

    const particles = this.particleRenderer.particles;
    if (!particles || particles.length === 0) {
      return { passed: false, message: "No particles found in renderer" };
    }

    // Check particle count
    const activeParticles = particles.filter((p) => p.visible);
    if (activeParticles.length < 10) {
      return {
        passed: false,
        message: `Only ${activeParticles.length} active particles, expected multiple glowing particles`,
        details: {
          activeCount: activeParticles.length,
          totalCount: particles.length,
        },
      };
    }

    // Check particle colors (should be cyan #00FFFF or similar neon)
    const sampleParticle = activeParticles[0];
    const particleColor = sampleParticle.tint || 0x00ffff;

    // Convert to hex string for validation
    const colorHex = particleColor.toString(16).padStart(6, "0");
    const isCyanish = colorHex.includes("ff"); // Should have high blue/green components

    if (!isCyanish) {
      return {
        passed: false,
        message: `Particle color #${colorHex} is not neon cyan-like`,
        details: { particleColor, colorHex },
      };
    }

    // Check particle alpha (should be visible but not fully opaque)
    const alpha = sampleParticle.alpha;
    if (alpha < 0.5 || alpha > 1.0) {
      return {
        passed: false,
        message: `Particle alpha ${alpha} should be between 0.5-1.0 for proper glow`,
        details: { alpha },
      };
    }

    return {
      passed: true,
      message: `${activeParticles.length} glowing particles with neon cyan color (#${colorHex})`,
      details: { activeCount: activeParticles.length, colorHex, alpha },
    };
  }

  /**
   * Validate bloom effect implementation
   */
  validateBloomEffect() {
    if (!this.pixiApp) {
      return { passed: false, message: "Pixi.js application not available" };
    }

    // Check if bloom filter is applied to stage or main container
    const stage = this.pixiApp.stage;
    const hasFilters = stage.filters && stage.filters.length > 0;

    if (!hasFilters) {
      return {
        passed: false,
        message: "No filters applied to stage - bloom effect missing",
      };
    }

    // Look for bloom filter (AdvancedBloomFilter)
    const bloomFilter = stage.filters.find(
      (filter) =>
        filter.constructor.name.includes("Bloom") ||
        filter.constructor.name.includes("bloom")
    );

    if (!bloomFilter) {
      return {
        passed: false,
        message: "Bloom filter not found in stage filters",
        details: { filterTypes: stage.filters.map((f) => f.constructor.name) },
      };
    }

    // Check bloom settings if accessible
    const bloomDetails = {};
    if (bloomFilter.strength !== undefined)
      bloomDetails.strength = bloomFilter.strength;
    if (bloomFilter.threshold !== undefined)
      bloomDetails.threshold = bloomFilter.threshold;
    if (bloomFilter.blur !== undefined) bloomDetails.blur = bloomFilter.blur;

    return {
      passed: true,
      message: `Bloom effect active with ${bloomFilter.constructor.name}`,
      details: bloomDetails,
    };
  }

  /**
   * Validate monospace font usage
   */
  validateMonospaceFont() {
    const titleElement = document.querySelector("h1");
    if (!titleElement) {
      return {
        passed: false,
        message: "Title element not found for font validation",
      };
    }

    const computedStyle = window.getComputedStyle(titleElement);
    const fontFamily = computedStyle.fontFamily.toLowerCase();

    // Check for monospace fonts
    const isMonospace =
      fontFamily.includes("mono") ||
      fontFamily.includes("courier") ||
      fontFamily.includes("consolas") ||
      fontFamily.includes("menlo") ||
      fontFamily.includes("monaco");

    if (!isMonospace) {
      return {
        passed: false,
        message: `Font family "${fontFamily}" is not monospace`,
        details: { fontFamily },
      };
    }

    return {
      passed: true,
      message: `Monospace font detected: ${fontFamily}`,
      details: { fontFamily },
    };
  }

  /**
   * Validate dark background color
   */
  validateDarkBackground() {
    const body = document.body;
    const computedStyle = window.getComputedStyle(body);
    const backgroundColor = computedStyle.backgroundColor;

    // Parse RGB values
    const rgbMatch = backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!rgbMatch) {
      return {
        passed: false,
        message: `Cannot parse background color: ${backgroundColor}`,
        details: { backgroundColor },
      };
    }

    const [, r, g, b] = rgbMatch.map(Number);

    // Check if it's dark (all values should be low, around 13 for #0D0D0D)
    const isDark = r < 50 && g < 50 && b < 50;
    const isCorrectColor =
      Math.abs(r - 13) < 5 && Math.abs(g - 13) < 5 && Math.abs(b - 13) < 5;

    if (!isDark) {
      return {
        passed: false,
        message: `Background RGB(${r}, ${g}, ${b}) is not dark enough`,
        details: { r, g, b, backgroundColor },
      };
    }

    if (!isCorrectColor) {
      return {
        passed: false,
        message: `Background RGB(${r}, ${g}, ${b}) should be closer to RGB(13, 13, 13) for #0D0D0D`,
        details: { r, g, b, backgroundColor, expected: "RGB(13, 13, 13)" },
      };
    }

    return {
      passed: true,
      message: `Dark background color RGB(${r}, ${g}, ${b}) matches #0D0D0D`,
      details: { r, g, b, backgroundColor },
    };
  }

  /**
   * Validate neon colors with bloom effects
   */
  validateNeonColors() {
    if (!this.pixiApp || !this.particleRenderer) {
      return {
        passed: false,
        message: "Cannot validate neon colors without renderer",
      };
    }

    // This is partially covered by validateGlowingParticles and validateBloomEffect
    // Here we focus on the overall neon aesthetic

    const particles = this.particleRenderer.particles;
    if (!particles || particles.length === 0) {
      return { passed: false, message: "No particles to validate neon colors" };
    }

    const activeParticles = particles.filter((p) => p.visible);
    const sampleSize = Math.min(5, activeParticles.length);

    let neonColorCount = 0;
    for (let i = 0; i < sampleSize; i++) {
      const particle = activeParticles[i];
      const color = particle.tint || 0x00ffff;
      const colorHex = color.toString(16).padStart(6, "0");

      // Check if color has high saturation (neon-like)
      const r = parseInt(colorHex.substr(0, 2), 16);
      const g = parseInt(colorHex.substr(2, 2), 16);
      const b = parseInt(colorHex.substr(4, 2), 16);

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max > 0 ? (max - min) / max : 0;

      if (saturation > 0.7 && max > 200) {
        // High saturation and brightness
        neonColorCount++;
      }
    }

    const neonRatio = neonColorCount / sampleSize;
    if (neonRatio < 0.8) {
      return {
        passed: false,
        message: `Only ${neonColorCount}/${sampleSize} particles have neon colors`,
        details: { neonColorCount, sampleSize, neonRatio },
      };
    }

    return {
      passed: true,
      message: `${neonColorCount}/${sampleSize} particles have vibrant neon colors`,
      details: { neonColorCount, sampleSize, neonRatio },
    };
  }

  /**
   * Validate minimal UI design
   */
  validateMinimalUI() {
    // Count visible UI elements
    const uiElements = document.querySelectorAll(
      "*:not(canvas):not(script):not(style)"
    );
    const visibleElements = Array.from(uiElements).filter((el) => {
      const style = window.getComputedStyle(el);
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        style.opacity !== "0"
      );
    });

    // Should only have essential elements: html, body, title, canvas
    const essentialElements = ["HTML", "BODY", "H1", "CANVAS"];
    const nonEssentialElements = visibleElements.filter(
      (el) =>
        !essentialElements.includes(el.tagName) && el.textContent.trim() !== "" // Ignore empty elements
    );

    if (nonEssentialElements.length > 2) {
      // Allow some flexibility
      return {
        passed: false,
        message: `Too many UI elements (${nonEssentialElements.length} non-essential), should be minimal`,
        details: {
          nonEssentialCount: nonEssentialElements.length,
          nonEssentialTags: nonEssentialElements.map((el) => el.tagName),
        },
      };
    }

    return {
      passed: true,
      message: `Minimal UI with only ${visibleElements.length} visible elements`,
      details: {
        totalVisible: visibleElements.length,
        nonEssentialCount: nonEssentialElements.length,
      },
    };
  }

  /**
   * Validate holographic, sci-fi atmosphere
   */
  validateHolographicAtmosphere() {
    const checks = [];

    // Check 1: Dark background
    const darkBg = this.validateDarkBackground();
    checks.push({ name: "Dark background", passed: darkBg.passed });

    // Check 2: Bloom effect
    const bloom = this.validateBloomEffect();
    checks.push({ name: "Bloom effect", passed: bloom.passed });

    // Check 3: Neon colors
    const neon = this.validateNeonColors();
    checks.push({ name: "Neon colors", passed: neon.passed });

    // Check 4: Title with holographic effect
    const title = this.validateFluxTitle();
    checks.push({ name: "Holographic title", passed: title.passed });

    const passedChecks = checks.filter((c) => c.passed).length;
    const atmosphereScore = passedChecks / checks.length;

    if (atmosphereScore < 0.75) {
      return {
        passed: false,
        message: `Holographic atmosphere incomplete: ${passedChecks}/${checks.length} elements working`,
        details: { checks, atmosphereScore },
      };
    }

    return {
      passed: true,
      message: `Holographic sci-fi atmosphere achieved: ${passedChecks}/${checks.length} elements working`,
      details: { checks, atmosphereScore },
    };
  }

  /**
   * Get validation summary
   */
  getSummary() {
    if (
      !this.validationResults ||
      Object.keys(this.validationResults).length === 0
    ) {
      return {
        message: "No validation results available. Run validateAll() first.",
      };
    }

    const passed = Object.values(this.validationResults).filter(
      (r) => r.passed
    ).length;
    const total = Object.keys(this.validationResults).length;
    const successRate = ((passed / total) * 100).toFixed(1);

    return {
      passed: passed === total,
      passedCount: passed,
      totalCount: total,
      successRate: parseFloat(successRate),
      results: this.validationResults,
    };
  }

  /**
   * Generate detailed report
   */
  generateReport() {
    const summary = this.getSummary();
    if (!summary.results) {
      return summary.message;
    }

    let report = `\n🎨 AESTHETIC VALIDATION REPORT\n`;
    report += `${"=".repeat(50)}\n`;
    report += `Overall Score: ${summary.passedCount}/${summary.totalCount} (${summary.successRate}%)\n\n`;

    for (const [key, result] of Object.entries(summary.results)) {
      const status = result.passed ? "✅" : "❌";
      report += `${status} ${result.description}\n`;
      report += `   ${result.message}\n`;

      if (result.details && Object.keys(result.details).length > 0) {
        report += `   Details: ${JSON.stringify(
          result.details,
          null,
          2
        ).replace(/\n/g, "\n   ")}\n`;
      }
      report += "\n";
    }

    return report;
  }
}

// Export for use in main application
export default AestheticValidator;
