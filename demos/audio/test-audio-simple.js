/**
 * Simple audio test script - run this in the browser console
 * This will test if the audio components are working
 */

console.log('🧪 Testing audio components...')

// Test if the audio UI exists
const audioUI = document.querySelector('.enhanced-audio-ui') || document.querySelector('.device-audio-ui')
if (audioUI) {
    console.log('✅ Audio UI found:', audioUI)
    
    const button = audioUI.querySelector('button')
    if (button) {
        console.log('✅ Audio button found:', button.textContent)
        console.log('Button styles:', button.style.background)
    } else {
        console.log('❌ Audio button not found')
    }
} else {
    console.log('❌ Audio UI not found')
}

// Test if deviceAudio is available
if (window.deviceAudio) {
    console.log('✅ deviceAudio object found')
    console.log('Status:', window.deviceAudio.getStatus())
    
    // Try to get audio data
    const status = window.deviceAudio.getStatus()
    if (status.audioData) {
        console.log('🎵 Audio data available:', status.audioData)
    } else {
        console.log('⚠️ No audio data yet')
    }
} else {
    console.log('❌ deviceAudio object not found')
    console.log('Available window objects:', Object.keys(window).filter(k => k.includes('audio') || k.includes('Audio')))
}

// Test if fluxApp is available
if (window.fluxApp) {
    console.log('✅ fluxApp found')
    
    if (window.fluxApp.particleRenderer) {
        console.log('✅ Particle renderer found')
        console.log('Audio reactive enabled:', window.fluxApp.particleRenderer.audioReactiveEnabled)
        
        // Test if audio reactive methods exist
        const methods = ['enableAudioReactive', 'disableAudioReactive', 'updateAudioColors', 'applyBeatPulse']
        methods.forEach(method => {
            if (typeof window.fluxApp.particleRenderer[method] === 'function') {
                console.log(`✅ ${method} method available`)
            } else {
                console.log(`❌ ${method} method missing`)
            }
        })
    } else {
        console.log('❌ Particle renderer not found')
    }
} else {
    console.log('❌ fluxApp not found')
}

console.log('🔍 Test complete. Check the messages above for issues.')

// If deviceAudio exists, try to enable it
if (window.deviceAudio && !window.deviceAudio.isActive) {
    console.log('🔄 Attempting to enable device audio...')
    window.deviceAudio.enableDeviceAudio().then(result => {
        console.log('Result:', result)
    }).catch(error => {
        console.error('Error:', error)
    })
}