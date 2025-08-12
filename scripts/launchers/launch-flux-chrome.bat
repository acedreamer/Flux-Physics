@echo off
echo.
echo ========================================
echo   FLUX Audio Visualizer - Chrome Launcher
echo ========================================
echo.
echo This script will launch FLUX in Google Chrome for optimal audio support.
echo.

REM Get the current directory
set "FLUX_DIR=%~dp0"
set "FLUX_URL=http://localhost:8000/index.html"

echo Current directory: %FLUX_DIR%
echo FLUX URL: %FLUX_URL%
echo.
echo NOTE: This requires a local web server to be running.
echo If you haven't started the server yet, run 'start-server.bat' first.
echo.

REM Try to find Chrome in common locations
set "CHROME_PATH="

REM Check Program Files
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
)

REM Check Program Files (x86)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
)

REM Check Local AppData
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=%LocalAppData%\Google\Chrome\Application\chrome.exe"
)

if defined CHROME_PATH (
    echo Found Chrome at: %CHROME_PATH%
    echo.
    echo Launching FLUX in Chrome...
    echo.
    echo Instructions:
    echo 1. Chrome will open with FLUX loaded
    echo 2. Look for the "Start Audio Visualization" button in the top-left
    echo 3. Follow the two-click setup process
    echo 4. Make sure to check "Share system audio" in the permission dialog
    echo.
    
    REM Launch Chrome with FLUX
    start "" "%CHROME_PATH%" "%FLUX_URL%"
    
    echo Chrome launched successfully!
    echo.
    echo If you don't see the audio button, try refreshing the page.
    echo.
) else (
    echo ERROR: Google Chrome not found!
    echo.
    echo Please install Google Chrome or launch it manually with this URL:
    echo %FLUX_URL%
    echo.
    echo You can also try these steps:
    echo 1. Open Google Chrome
    echo 2. Copy and paste this URL: %FLUX_URL%
    echo 3. Press Enter to load FLUX
    echo.
)

echo Press any key to exit...
pause >nul