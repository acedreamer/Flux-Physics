# 🌐 FLUX Local Server Setup

## Why Do I Need a Local Server?

FLUX uses ES6 modules (modern JavaScript imports) which are blocked by browsers when loading files directly from the file system (`file://` protocol) due to CORS (Cross-Origin Resource Sharing) security policies. 

**The Error You Saw:**
```
Access to script at 'file:///...' has been blocked by CORS policy
```

**The Solution:** Run FLUX through a local web server using the `http://` protocol.

## Quick Start (Choose One Method)

### 🚀 Method 1: Automatic Server (Easiest)
```bash
# Windows
double-click start-server.bat

# The script will automatically:
# 1. Detect Python, Node.js, or PHP
# 2. Start the appropriate server
# 3. Open your browser to http://localhost:8000
```

### 🐍 Method 2: Python Server
```bash
# If you have Python installed
python server.py

# Or use the built-in Python server
python -m http.server 8000

# Then open: http://localhost:8000
```

### 📦 Method 3: Node.js Server
```bash
# If you have Node.js installed
node server.js

# Or use a global package
npx http-server -p 8000 -c-1

# Then open: http://localhost:8000
```

### 🔧 Method 4: PHP Server
```bash
# If you have PHP installed
php -S localhost:8000

# Then open: http://localhost:8000
```

## Step-by-Step Instructions

### For Windows Users:

1. **Start the Server:**
   ```
   Double-click: start-server.bat
   ```

2. **Wait for Success Message:**
   ```
   ✅ Server started successfully!
   Server running at http://localhost:8000
   ```

3. **Open Chrome:**
   - Go to: `http://localhost:8000`
   - Or click the auto-opened browser tab

4. **Use FLUX:**
   - Click the 🎵 audio button
   - Follow the two-click setup process
   - Enjoy the audio visualization!

5. **Stop the Server:**
   - Press `Ctrl+C` in the terminal window
   - Or close the terminal window

### For Advanced Users:

#### Custom Port:
```bash
# Python
python -m http.server 3000

# Node.js
npx http-server -p 3000

# PHP
php -S localhost:3000
```

#### Background Server:
```bash
# Python (Linux/Mac)
nohup python -m http.server 8000 &

# Node.js with PM2
npm install -g pm2
pm2 start server.js --name flux-server
```

## Available URLs

Once your server is running, you can access:

| URL | Description |
|-----|-------------|
| `http://localhost:8000/` | Main FLUX application |
| `http://localhost:8000/launch-in-chrome.html` | Chrome launcher with compatibility check |
| `http://localhost:8000/test-browser-compatibility.html` | Browser compatibility testing |
| `http://localhost:8000/demo-two-click-simple.html` | Simple audio demo |
| `http://localhost:8000/test-two-click-audio.html` | Full FLUX with two-click audio |

## Troubleshooting

### Port Already in Use
```
❌ Port 8000 is already in use!
```

**Solutions:**
1. **Check if FLUX is already running:** Go to `http://localhost:8000`
2. **Use a different port:** Edit the server files to use port 3000 or 8080
3. **Stop the conflicting service:** Find and stop whatever is using port 8000

### Python Not Found
```
❌ 'python' is not recognized as an internal or external command
```

**Solutions:**
1. **Install Python:** Download from [python.org](https://python.org)
2. **Try python3:** Run `python3 server.py` instead
3. **Use Node.js instead:** Install Node.js and run `node server.js`

### Node.js Not Found
```
❌ 'node' is not recognized as an internal or external command
```

**Solutions:**
1. **Install Node.js:** Download from [nodejs.org](https://nodejs.org)
2. **Use Python instead:** Run `python server.py`
3. **Use PHP instead:** Run `php -S localhost:8000`

### Browser Won't Open Automatically
**Solutions:**
1. **Manually open browser:** Go to `http://localhost:8000`
2. **Check firewall:** Ensure localhost connections are allowed
3. **Try different browser:** Chrome, Edge, or Firefox

### FLUX Still Shows CORS Errors
**Checklist:**
1. ✅ **Server is running:** Check terminal shows "Server started successfully"
2. ✅ **Using http:// URL:** Not file:// protocol
3. ✅ **Correct port:** Usually 8000, check your server output
4. ✅ **No browser cache:** Try Ctrl+F5 to hard refresh

## Server Features

### Custom FLUX Servers (server.py & server.js)

Our custom servers include:
- **Proper MIME types** for ES6 modules
- **CORS headers** for local development
- **Auto browser opening** when server starts
- **Helpful error messages** and troubleshooting
- **Multiple URL listings** for easy access

### Security Notes

- **Local only:** Servers bind to localhost (127.0.0.1)
- **Development use:** Not suitable for production
- **No authentication:** Anyone on your machine can access
- **Firewall safe:** Only accessible from your computer

## Alternative Solutions

### VS Code Live Server
1. **Install VS Code:** Download from [code.visualstudio.com](https://code.visualstudio.com)
2. **Install Live Server extension:** Search for "Live Server" in extensions
3. **Open FLUX folder** in VS Code
4. **Right-click index.html** → "Open with Live Server"

### Other Local Servers
- **XAMPP:** Full Apache/PHP/MySQL stack
- **WAMP:** Windows Apache/MySQL/PHP
- **Nginx:** High-performance web server
- **IIS:** Windows Internet Information Services

## Performance Tips

### For Best Performance:
1. **Use Chrome or Edge** for optimal audio support
2. **Close unnecessary tabs** to free up resources
3. **Keep server terminal open** while using FLUX
4. **Use localhost, not 127.0.0.1** for better compatibility

### Server Optimization:
- **Python:** Fastest startup, good for development
- **Node.js:** Best for JavaScript developers, good performance
- **PHP:** Good if you already have PHP installed
- **Apache/Nginx:** Best for production-like testing

## Next Steps

1. **Choose your server method** from the options above
2. **Start the server** and wait for the success message
3. **Open Chrome** and go to `http://localhost:8000`
4. **Follow the Chrome Setup Guide** for audio configuration
5. **Enjoy FLUX!** 🎵

Remember to keep the server running while using FLUX, and stop it when you're done to free up system resources.