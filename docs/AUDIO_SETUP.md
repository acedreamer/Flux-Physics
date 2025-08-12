# 🎵 FLUX Audio Setup Guide

## 🎯 Quick Start

### Instant Audio Setup
1. **Start playing music** in another browser tab (YouTube, Spotify, etc.)
2. **Open FLUX** in a new tab
3. **Click the 🎵 button** in FLUX
4. **Follow the 2-click setup** (detailed below)
5. **Watch particles dance** to your music!

## 🌐 Browser Compatibility

### Full System Audio Support
| Browser | System Audio | Quality | Recommended |
|---------|--------------|---------|-------------|
| **Google Chrome** | ✅ Full Support | 🟢 Excellent | ⭐ **Best Choice** |
| **Microsoft Edge** | ✅ Full Support | 🟢 Excellent | ⭐ **Best Choice** |

### Limited Audio Support
| Browser | System Audio | Microphone | Quality |
|---------|--------------|------------|---------|
| **Firefox** | ❌ Not Available | ✅ Available | 🟡 Good |
| **Safari** | ❌ Not Available | ✅ Available | 🟡 Good |

## 🔧 Chrome/Edge Setup (Recommended)

### Step-by-Step Instructions

#### 1. Prepare Your Music
- **Open a new tab** in Chrome/Edge
- **Start playing music** (YouTube, Spotify, Apple Music, etc.)
- **Ensure audio is audible** and playing

#### 2. Open FLUX
- **Navigate to** [FLUX Physics Playground](https://acedreamer.github.io/Flux-Physics/)
- **Wait for** the particle system to initialize
- **Verify** particles are moving normally

#### 3. Enable Audio Mode
- **Click the 🎵 button** in FLUX interface
- **Permission dialog** will appear

#### 4. Screen Sharing Setup
**First Dialog - Choose Source:**
- Select **"Chrome Tab"** or **"Entire Screen"**
- **Recommended**: Choose "Chrome Tab" for better performance

**Second Dialog - Select Audio Tab:**
- **Find the tab** with your music playing
- **Click on it** to select
- **Ensure "Share audio"** checkbox is checked ✅
- **Click "Share"**

#### 5. Verify Audio Connection
- **Look for audio indicator** in FLUX interface
- **Check particle reactivity** - they should respond to music
- **Adjust volume** if needed for better visual response

### Troubleshooting Chrome/Edge

**No Audio Detected:**
- Verify music is actually playing in the source tab
- Check that "Share audio" was enabled during setup
- Try refreshing both tabs and repeating setup

**Poor Audio Quality:**
- Use "Chrome Tab" sharing instead of "Entire Screen"
- Ensure source audio volume is adequate
- Close unnecessary browser tabs for better performance

**Permission Denied:**
- Check browser audio permissions in Settings
- Try using an incognito/private window
- Restart browser and try again

## 🎤 Firefox/Safari Setup (Microphone)

### Step-by-Step Instructions

#### 1. Prepare Audio Environment
- **Use external speakers** or headphones
- **Start playing music** from any source (phone, computer, etc.)
- **Position microphone** to capture the audio

#### 2. Enable Microphone Access
- **Click the 🎵 button** in FLUX
- **Permission dialog** will appear
- **Select "Allow"** for microphone access

#### 3. Optimize Microphone Setup
- **Adjust volume levels** for best response
- **Minimize background noise**
- **Position speakers** near microphone for better capture

### Troubleshooting Firefox/Safari

**No Microphone Access:**
- Check browser microphone permissions
- Ensure no other applications are using the microphone
- Try refreshing the page and granting permissions again

**Poor Audio Response:**
- Increase music volume
- Move speakers closer to microphone
- Reduce background noise in the environment

## ⚙️ Audio Configuration

### Sensitivity Settings
```javascript
// Adjust audio sensitivity (0.1 - 2.0)
app.setAudioSensitivity(1.5);  // Higher = more reactive

// Fine-tune frequency response
audioCapture.configure({
  fftSize: 2048,              // Higher = more detail
  smoothingTimeConstant: 0.8,  // Higher = smoother
  frequencyBins: 64           // Number of frequency bands
});
```

### Audio Modes
- **Reactive** - Particles respond to all frequencies
- **Pulse** - Particles pulse with beat detection
- **Flow** - Smooth particle movement based on audio
- **Ambient** - Subtle audio influence on particle behavior

## 🎼 Music Recommendations

### Best Genres for Visualization
1. **Electronic/EDM** - Clear beats and frequency separation
2. **Classical** - Dynamic range and orchestral complexity
3. **Rock/Metal** - Strong rhythmic elements
4. **Jazz** - Complex harmonies and improvisation
5. **Ambient** - Smooth, flowing soundscapes

### Optimal Audio Characteristics
- **Clear Bass** - Low frequencies drive particle movement
- **Distinct Beats** - Rhythmic elements create visual pulses
- **Frequency Variety** - Full spectrum audio for rich visuals
- **Dynamic Range** - Volume changes create visual interest

## 🔊 Audio Quality Optimization

### For Best Results
- **Use high-quality audio sources** (320kbps+ or lossless)
- **Avoid heavily compressed audio** (low bitrate MP3s)
- **Ensure good volume levels** (not too quiet or distorted)
- **Use stereo audio** for richer frequency content

### Performance Tips
- **Close unnecessary browser tabs** during audio visualization
- **Use wired headphones/speakers** to avoid Bluetooth latency
- **Disable browser extensions** that might interfere with audio
- **Keep browser updated** for latest audio API improvements

## 🛠️ Advanced Configuration

### Custom Audio Processing
```javascript
// Access raw audio data
audioCapture.onAudioData = (frequencyData, timeData) => {
  // Custom visualization logic
  const bassLevel = frequencyData.slice(0, 10).reduce((a, b) => a + b) / 10;
  const trebleLevel = frequencyData.slice(-10).reduce((a, b) => a + b) / 10;
  
  // Apply to particles
  particles.forEach(particle => {
    particle.size = bassLevel * 0.1;
    particle.brightness = trebleLevel * 0.1;
  });
};
```

### Audio Analysis Parameters
```javascript
// Fine-tune audio analysis
const audioConfig = {
  fftSize: 2048,                    // 256, 512, 1024, 2048, 4096
  smoothingTimeConstant: 0.8,       // 0.0 - 1.0 (higher = smoother)
  minDecibels: -90,                 // Minimum audio level
  maxDecibels: -10,                 // Maximum audio level
  frequencyBinCount: 1024           // Number of frequency bins
};
```

## 🚨 Common Issues & Solutions

### Audio Not Working
**Symptoms**: Particles don't respond to music
**Solutions**:
1. Verify audio permissions are granted
2. Check that music is actually playing
3. Try refreshing the page and re-enabling audio
4. Switch to a different browser (Chrome recommended)

### Laggy Audio Response
**Symptoms**: Particles respond slowly to audio changes
**Solutions**:
1. Reduce audio buffer size in browser settings
2. Close other applications using audio
3. Use wired audio instead of Bluetooth
4. Lower the particle count for better performance

### Distorted Visuals
**Symptoms**: Particles behave erratically with audio
**Solutions**:
1. Lower audio sensitivity settings
2. Check for audio clipping (reduce volume)
3. Use higher quality audio source
4. Adjust frequency range settings

### No Microphone Access
**Symptoms**: Browser doesn't request microphone permission
**Solutions**:
1. Check browser microphone settings
2. Try using HTTPS instead of HTTP
3. Clear browser cache and cookies
4. Restart browser and try again

## 📱 Mobile Audio Setup

### iOS Safari
- **Microphone only** - System audio not available
- **Tap to enable** - iOS requires user interaction
- **Use headphones** - Avoid feedback loops

### Android Chrome
- **Limited system audio** - Depends on Android version
- **Microphone fallback** - Usually works reliably
- **Performance considerations** - Reduce particle count

## 🎉 Pro Tips

### Maximum Visual Impact
1. **Use full-range music** with strong bass and clear highs
2. **Enable fullscreen mode** for immersive experience
3. **Experiment with themes** - different colors react differently
4. **Adjust sensitivity** based on music genre and volume
5. **Try different presets** - each responds uniquely to audio

### Performance Optimization
- **Monitor frame rate** - audio processing can be intensive
- **Use Chrome/Edge** for best performance and compatibility
- **Close background tabs** to free up system resources
- **Lower quality settings** on older devices

---

**Ready to create amazing audio visualizations?** 🎨🎵

For technical details, see the [Developer Guide](./DEVELOPER_GUIDE.md)
For issues, check the [Troubleshooting Guide](./TROUBLESHOOTING.md)