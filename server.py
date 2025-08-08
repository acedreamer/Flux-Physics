#!/usr/bin/env python3
"""
Simple HTTP server for FLUX Audio Visualizer
Resolves CORS issues with ES6 modules
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

# Configuration
PORT = 8000
HOST = 'localhost'

class FluxHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler with proper MIME types for ES6 modules"""
    
    def end_headers(self):
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()
    
    def guess_type(self, path):
        """Ensure .js files are served with correct MIME type"""
        mimetype, encoding = super().guess_type(path)
        if path.endswith('.js'):
            return 'application/javascript', encoding
        return mimetype, encoding

def main():
    # Change to the script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    print("🎵 FLUX Audio Visualizer - Local Server")
    print("=" * 50)
    print(f"Starting server at http://{HOST}:{PORT}")
    print(f"Serving files from: {script_dir}")
    print()
    
    try:
        with socketserver.TCPServer((HOST, PORT), FluxHTTPRequestHandler) as httpd:
            print("✅ Server started successfully!")
            print()
            print("📋 Instructions:")
            print("1. Keep this terminal window open")
            print("2. Open Chrome and go to: http://localhost:8000")
            print("3. Click the 🎵 audio button and follow the setup")
            print("4. Press Ctrl+C here to stop the server")
            print()
            print("🌐 Available URLs:")
            print(f"  Main FLUX:           http://{HOST}:{PORT}/")
            print(f"  Debug Status:        http://{HOST}:{PORT}/debug-status.html")
            print(f"  WASM Test:           http://{HOST}:{PORT}/test-wasm-loading.html")
            print(f"  Fallback Physics:    http://{HOST}:{PORT}/test-fallback-physics.html")
            print(f"  PIXI Fallback:       http://{HOST}:{PORT}/test-pixi-fallback.html")
            print(f"  Chrome Launcher:     http://{HOST}:{PORT}/launch-in-chrome.html")
            print(f"  Browser Test:        http://{HOST}:{PORT}/test-browser-compatibility.html")
            print(f"  PIXI CDN Test:       http://{HOST}:{PORT}/test-pixi-cdn.html")
            print(f"  Simple Demo:         http://{HOST}:{PORT}/demo-two-click-simple.html")
            print(f"  Two-Click Test:      http://{HOST}:{PORT}/test-two-click-audio.html")
            print()
            
            # Try to open browser automatically
            try:
                webbrowser.open(f'http://{HOST}:{PORT}')
                print("🚀 Opening FLUX in your default browser...")
            except:
                print("💡 Please manually open your browser and navigate to the URL above")
            
            print()
            print("Server is running... Press Ctrl+C to stop")
            httpd.serve_forever()
            
    except OSError as e:
        if e.errno == 48 or e.errno == 10048:  # Address already in use
            print(f"❌ Port {PORT} is already in use!")
            print()
            print("Solutions:")
            print(f"1. Stop any other server running on port {PORT}")
            print("2. Or open your browser and go to: http://localhost:8000")
            print("3. Or edit this script to use a different port")
        else:
            print(f"❌ Server error: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        print("Thanks for using FLUX! 🎵")

if __name__ == "__main__":
    main()