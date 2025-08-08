#!/usr/bin/env node
/**
 * Simple HTTP server for FLUX Audio Visualizer
 * Resolves CORS issues with ES6 modules
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuration
const PORT = 8000;
const HOST = 'localhost';

// MIME types for proper content serving
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return mimeTypes[ext] || 'application/octet-stream';
}

function serveFile(res, filePath) {
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`
                    <h1>404 - File Not Found</h1>
                    <p>The requested file <code>${filePath}</code> was not found.</p>
                    <p><a href="/">← Back to FLUX</a></p>
                `);
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            const contentType = getContentType(filePath);
            res.writeHead(200, {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': '*'
            });
            res.end(content);
        }
    });
}

const server = http.createServer((req, res) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': '*'
        });
        res.end();
        return;
    }

    let filePath = '.' + req.url;
    
    // Default to index.html for root requests
    if (filePath === './') {
        filePath = './index.html';
    }
    
    // Security: prevent directory traversal
    if (filePath.includes('..')) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    serveFile(res, filePath);
});

server.listen(PORT, HOST, () => {
    console.log('🎵 FLUX Audio Visualizer - Local Server');
    console.log('='.repeat(50));
    console.log(`Server running at http://${HOST}:${PORT}/`);
    console.log(`Serving files from: ${__dirname}`);
    console.log();
    console.log('✅ Server started successfully!');
    console.log();
    console.log('📋 Instructions:');
    console.log('1. Keep this terminal window open');
    console.log('2. Open Chrome and go to: http://localhost:8000');
    console.log('3. Click the 🎵 audio button and follow the setup');
    console.log('4. Press Ctrl+C here to stop the server');
    console.log();
    console.log('🌐 Available URLs:');
    console.log(`  Main FLUX:           http://${HOST}:${PORT}/`);
    console.log(`  Debug Status:        http://${HOST}:${PORT}/debug-status.html`);
    console.log(`  WASM Test:           http://${HOST}:${PORT}/test-wasm-loading.html`);
    console.log(`  Fallback Physics:    http://${HOST}:${PORT}/test-fallback-physics.html`);
    console.log(`  PIXI Fallback:       http://${HOST}:${PORT}/test-pixi-fallback.html`);
    console.log(`  Chrome Launcher:     http://${HOST}:${PORT}/launch-in-chrome.html`);
    console.log(`  Browser Test:        http://${HOST}:${PORT}/test-browser-compatibility.html`);
    console.log(`  PIXI CDN Test:       http://${HOST}:${PORT}/test-pixi-cdn.html`);
    console.log(`  Simple Demo:         http://${HOST}:${PORT}/demo-two-click-simple.html`);
    console.log(`  Two-Click Test:      http://${HOST}:${PORT}/test-two-click-audio.html`);
    console.log();
    
    // Try to open browser automatically
    const openCommand = process.platform === 'win32' ? 'start' : 
                       process.platform === 'darwin' ? 'open' : 'xdg-open';
    
    exec(`${openCommand} http://${HOST}:${PORT}`, (error) => {
        if (error) {
            console.log('💡 Please manually open your browser and navigate to the URL above');
        } else {
            console.log('🚀 Opening FLUX in your default browser...');
        }
    });
    
    console.log();
    console.log('Server is running... Press Ctrl+C to stop');
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`❌ Port ${PORT} is already in use!`);
        console.log();
        console.log('Solutions:');
        console.log(`1. Stop any other server running on port ${PORT}`);
        console.log('2. Or open your browser and go to: http://localhost:8000');
        console.log('3. Or edit this script to use a different port');
    } else {
        console.log(`❌ Server error: ${err.message}`);
    }
    process.exit(1);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Server stopped by user');
    console.log('Thanks for using FLUX! 🎵');
    process.exit(0);
});