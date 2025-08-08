/**
 * Debug script to verify the Audio UI is working
 * Run this in the browser console to check the UI state
 */

console.log('🔍 Debugging Audio UI...')

// Check if the device audio UI exists
const audioUI = document.querySelector('.device-audio-ui')
if (audioUI) {
    console.log('✅ Audio UI element found:', audioUI)
    
    // Check for the panel
    const panel = audioUI.querySelector('#audio-ui-panel')
    if (panel) {
        console.log('✅ Audio panel found with styles:', panel.style.cssText)
        
        // Check for the button
        const button = audioUI.querySelector('#toggle-device-audio')
        if (button) {
            console.log('✅ Audio button found:', button.innerHTML)
            console.log('Button styles:', button.style.cssText)
        } else {
            console.log('❌ Audio button NOT found')
        }
        
        // Check for status indicator
        const indicator = audioUI.querySelector('#status-indicator')
        if (indicator) {
            console.log('✅ Status indicator found with color:', indicator.style.background)
        } else {
            console.log('❌ Status indicator NOT found')
        }
        
        // Check for status text
        const status = audioUI.querySelector('#audio-status')
        if (status) {
            console.log('✅ Status text found:', status.innerHTML)
        } else {
            console.log('❌ Status text NOT found')
        }
        
    } else {
        console.log('❌ Audio panel NOT found')
    }
} else {
    console.log('❌ Audio UI element NOT found')
    console.log('Available elements:', document.querySelectorAll('*'))
}

// Check if deviceAudio is available globally
if (window.deviceAudio) {
    console.log('✅ deviceAudio object found:', window.deviceAudio)
    console.log('Status:', window.deviceAudio.getStatus())
} else {
    console.log('❌ deviceAudio object NOT found')
}

// Check if fluxApp is available
if (window.fluxApp) {
    console.log('✅ fluxApp found:', window.fluxApp)
} else {
    console.log('❌ fluxApp NOT found')
}

console.log('🔍 Debug complete. Check the messages above for issues.')