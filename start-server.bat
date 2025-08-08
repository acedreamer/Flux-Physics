@echo off
echo.
echo ========================================
echo   FLUX Audio Visualizer - Local Server
echo ========================================
echo.
echo Starting local web server for FLUX...
echo This will resolve CORS issues with ES6 modules.
echo.

REM Get the current directory
set "FLUX_DIR=%~dp0"

echo Server directory: %FLUX_DIR%
echo.

REM Check if Python is available (most common)
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Found Python - starting HTTP server on port 8000...
    echo.
    echo FLUX will be available at: http://localhost:8000
    echo.
    echo Instructions:
    echo 1. Keep this window open while using FLUX
    echo 2. Open Chrome and go to: http://localhost:8000
    echo 3. Click the audio button and follow the two-click setup
    echo 4. Press Ctrl+C here to stop the server when done
    echo.
    echo Starting server...
    python -m http.server 8000
    goto :end
)

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo Found Node.js - checking for http-server...
    npx http-server --version >nul 2>&1
    if %errorlevel% == 0 (
        echo Starting http-server on port 8000...
        echo.
        echo FLUX will be available at: http://localhost:8000
        echo.
        echo Instructions:
        echo 1. Keep this window open while using FLUX
        echo 2. Open Chrome and go to: http://localhost:8000
        echo 3. Click the audio button and follow the two-click setup
        echo 4. Press Ctrl+C here to stop the server when done
        echo.
        echo Starting server...
        npx http-server -p 8000 -c-1
        goto :end
    ) else (
        echo Installing http-server...
        npm install -g http-server
        if %errorlevel% == 0 (
            echo Starting http-server on port 8000...
            echo.
            echo FLUX will be available at: http://localhost:8000
            echo.
            echo Starting server...
            npx http-server -p 8000 -c-1
            goto :end
        )
    )
)

REM Check if PHP is available
php --version >nul 2>&1
if %errorlevel% == 0 (
    echo Found PHP - starting built-in server on port 8000...
    echo.
    echo FLUX will be available at: http://localhost:8000
    echo.
    echo Instructions:
    echo 1. Keep this window open while using FLUX
    echo 2. Open Chrome and go to: http://localhost:8000
    echo 3. Click the audio button and follow the two-click setup
    echo 4. Press Ctrl+C here to stop the server when done
    echo.
    echo Starting server...
    php -S localhost:8000
    goto :end
)

REM No suitable server found
echo.
echo ❌ No suitable web server found!
echo.
echo To run FLUX, you need one of the following:
echo.
echo Option 1 - Python (Recommended):
echo   1. Install Python from https://python.org
echo   2. Run this script again
echo.
echo Option 2 - Node.js:
echo   1. Install Node.js from https://nodejs.org
echo   2. Run this script again
echo.
echo Option 3 - Manual Chrome Launch:
echo   1. Install Python or Node.js
echo   2. Or use a different web server
echo.
echo Alternative: Use VS Code Live Server extension
echo   1. Open this folder in VS Code
echo   2. Install "Live Server" extension
echo   3. Right-click index.html and select "Open with Live Server"
echo.

:end
echo.
echo Press any key to exit...
pause >nul