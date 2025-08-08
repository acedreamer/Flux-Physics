# 🚀 FLUX Vite Development Setup

## Why Use Vite Instead of Python Server?

**The Issue with Python Server:**
- ❌ Incorrect MIME types for JavaScript files
- ❌ No module bundling or resolution
- ❌ No WASM support
- ❌ CDN dependency issues

**Vite Benefits:**
- ✅ Proper ES6 module handling
- ✅ Built-in WASM support
- ✅ Local dependency resolution
- ✅ Hot module replacement
- ✅ Optimized development experience

## Quick Start

### 1. Install Dependencies
```bash
cd projects/flux
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Open FLUX
- Vite will automatically open your browser
- Or go to: `http://localhost:5173` (Vite's default port)

## What Vite Handles Automatically

### ✅ **Module Resolution**
```javascript
// These imports work automatically with Vite:
import * as PIXI from 'pixi.js'                    // From node_modules
import { AdvancedBloomFilter } from '@pixi/filter-advanced-bloom'
import { FallbackSolver } from './physics/fallback-physics.js'
import wasmModule from 'engine'                    // Local WASM package
```

### ✅ **WASM Loading**
- Vite automatically handles `.wasm` files
- No need for manual MIME type configuration
- Built-in support for Rust/WASM packages

### ✅ **Hot Module Replacement**
- Changes to code automatically reload
- Faster development cycle
- State preservation during updates

### ✅ **Dependency Management**
- All npm packages available locally
- No CDN reliability issues
- Proper version management

## Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Test Rust/WASM engine
npm run test:rust

# Run all tests
npm run test:all
```

## Expected Behavior

### **With Vite (`npm run dev`):**
```
✅ PIXI.js v8.11.0 loaded from node_modules
✅ AdvancedBloomFilter available
✅ WASM physics engine loaded successfully
✅ All modules resolved correctly
```

### **Development URLs:**
- **Main FLUX**: `http://localhost:5173/`
- **All test pages work** with proper module resolution

## Troubleshooting

### **If `npm run dev` fails:**

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Clear cache:**
   ```bash
   npm run build
   rm -rf node_modules/.vite
   npm run dev
   ```

3. **Check Node.js version:**
   ```bash
   node --version  # Should be 16+ for Vite
   ```

### **If WASM still fails:**
- The fallback physics will automatically activate
- FLUX will still work with JavaScript physics
- You'll see a warning toast about using fallback

## Comparison: Python Server vs Vite

| Feature | Python Server | Vite |
|---------|---------------|------|
| **Module Loading** | ❌ Manual CDN | ✅ Automatic |
| **WASM Support** | ❌ No | ✅ Built-in |
| **MIME Types** | ❌ Basic | ✅ Correct |
| **Hot Reload** | ❌ No | ✅ Yes |
| **Dependencies** | ❌ CDN only | ✅ Local + CDN |
| **Development Speed** | ❌ Slow | ✅ Fast |
| **Production Ready** | ❌ No | ✅ Yes |

## Next Steps

1. **Stop the Python server** (Ctrl+C)
2. **Navigate to flux directory**: `cd projects/flux`
3. **Install dependencies**: `npm install`
4. **Start Vite**: `npm run dev`
5. **Open FLUX**: Browser should auto-open to `http://localhost:5173`

**This should resolve all the CDN and module loading issues!** 🎉