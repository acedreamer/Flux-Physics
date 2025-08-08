# 📦 FLUX Module Loading Guide

## The Issue: Bare Specifier Imports

**Error Message:**
```
TypeError: The specifier "pixi.js" was a bare specifier, but was not remapped to anything. 
Relative module specifiers must start with "./", "../" or "/".
```

**What This Means:**
- FLUX tries to import npm packages like `pixi.js` directly in the browser
- Browsers don't understand bare specifiers like `"pixi.js"` without a bundler
- We need to load these dependencies from CDN instead

## The Solution: CDN Loading

I've updated FLUX to load PIXI.js from CDN instead of using npm imports:

### Before (Problematic):
```javascript
import * as PIXI from "pixi.js";
import { AdvancedBloomFilter } from "@pixi/filter-advanced-bloom";
```

### After (Working):
```html
<!-- In index.html -->
<script src="https://cdn.jsdelivr.net/npm/pixi.js@7.3.2/dist/pixi.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@pixi/filter-advanced-bloom@5.1.1/dist/filter-advanced-bloom.min.js"></script>
```

```javascript
// In main.js - PIXI is now available globally
// No imports needed, PIXI is loaded from CDN
```

## Testing the Fix

### 1. Test PIXI.js CDN Loading
Open: `http://localhost:8000/test-pixi-cdn.html`

This will test:
- ✅ PIXI.js loads correctly from CDN
- ✅ AdvancedBloomFilter is available
- ✅ PIXI Application can be created
- ✅ Basic rendering works

### 2. Test Full FLUX Application
Open: `http://localhost:8000/`

If PIXI.js loads correctly, you should see:
- ✅ No more "bare specifier" errors
- ✅ FLUX initializes successfully
- ✅ Canvas appears with particle system
- ✅ Audio button is available

## Troubleshooting

### PIXI.js Not Loading
**Symptoms:**
- `PIXI is not defined` error
- Test page shows "PIXI.js not found"

**Solutions:**
1. **Check internet connection** - CDN requires internet access
2. **Check browser console** for network errors
3. **Try different CDN** - edit index.html to use different CDN URLs
4. **Disable ad blockers** - they might block CDN requests

### AdvancedBloomFilter Not Found
**Symptoms:**
- PIXI.js loads but bloom filter is missing
- Particles appear without glow effects

**Solutions:**
1. **Check CDN URL** - ensure the bloom filter CDN is correct
2. **Use fallback** - FLUX will automatically fall back to basic blur
3. **Check browser compatibility** - some filters need WebGL support

### CSS Not Loading
**Symptoms:**
- FLUX loads but styling is broken
- Fonts don't load correctly

**Solutions:**
1. **Check style.css path** - ensure `./src/style.css` exists
2. **Check font imports** - Google Fonts might be blocked
3. **Check server MIME types** - CSS should be served as `text/css`

## Alternative Solutions

### Option 1: Use Import Maps (Modern Browsers)
```html
<script type="importmap">
{
  "imports": {
    "pixi.js": "https://cdn.skypack.dev/pixi.js@7.3.2",
    "@pixi/filter-advanced-bloom": "https://cdn.skypack.dev/@pixi/filter-advanced-bloom@5.1.1"
  }
}
</script>
```

**Pros:** Keeps ES6 import syntax
**Cons:** Not supported in older browsers

### Option 2: Use a Bundler (Advanced)
```bash
# Install dependencies
npm install pixi.js @pixi/filter-advanced-bloom

# Use Vite, Webpack, or Rollup to bundle
npm run build
```

**Pros:** Proper dependency management
**Cons:** Requires build step and tooling

### Option 3: Download Libraries Locally
1. Download PIXI.js files to `./lib/` folder
2. Update script tags to use local files
3. Serve everything from local server

**Pros:** Works offline
**Cons:** Manual dependency management

## Current Implementation Details

### Files Modified:
- **`index.html`**: Added CDN script tags, removed import map
- **`src/main.js`**: Removed bare imports, added global PIXI usage
- **`src/style.css`**: Moved from JS import to HTML link tag

### CDN URLs Used:
- **PIXI.js**: `https://cdn.jsdelivr.net/npm/pixi.js@7.3.2/dist/pixi.min.js`
- **Bloom Filter**: `https://cdn.jsdelivr.net/npm/@pixi/filter-advanced-bloom@5.1.1/dist/filter-advanced-bloom.min.js`

### Fallback Strategy:
```javascript
// Check multiple possible locations for AdvancedBloomFilter
const AdvancedBloomFilter = PIXI.filters?.AdvancedBloomFilter || 
                            PIXI.AdvancedBloomFilter || 
                            window.AdvancedBloomFilter;

if (!AdvancedBloomFilter) {
  // Fall back to basic PIXI.BlurFilter
  console.warn('AdvancedBloomFilter not available, using basic blur');
}
```

## Performance Considerations

### CDN Benefits:
- **Caching**: Libraries cached across sites
- **Performance**: CDN servers are optimized
- **Reliability**: Multiple fallback servers

### CDN Drawbacks:
- **Internet Required**: Won't work offline
- **External Dependency**: Relies on third-party service
- **Version Lock**: Specific versions from CDN

### Optimization Tips:
1. **Use minified versions** (`.min.js`) for production
2. **Enable compression** on your server
3. **Preload critical resources** with `<link rel="preload">`
4. **Use HTTP/2** for better multiplexing

## Next Steps

1. **Test the PIXI CDN loading**: `http://localhost:8000/test-pixi-cdn.html`
2. **Verify FLUX works**: `http://localhost:8000/`
3. **Test audio features**: Follow the two-click audio setup
4. **Report any issues**: Check browser console for errors

The module loading should now work correctly with the CDN approach!