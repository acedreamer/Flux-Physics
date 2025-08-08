/**
 * FLUX Audio Reactive Mode - Error Handler Tests
 * 
 * Comprehensive tests for error handling and user feedback:
 * - Permission denied scenarios
 * - Device not found errors
 * - Connection failures
 * - Low audio level detection
 * - Automatic recovery strategies
 * - User feedback display
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AudioErrorHandler } from './audio-error-handler.js'

describe('AudioErrorHandler', () => {
    let errorHandler
    let mockCallbacks
    
    beforeEach(() => {
        // Mock callbacks
        mockCallbacks = {
            onError: vi.fn(),
            onWarning: vi.fn(),
            onRecovery: vi.fn(),
            onFallback: vi.fn(),
            onStatusChange: vi.fn(),
            onUserAction: vi.fn().mockResolvedValue({ success: true })
        }
        
        // Create error handler instance
        errorHandler = new AudioErrorHandler({
            lowAudioThreshold: 0.01,
            lowAudioDuration: 1000, // Reduced for testing
            silenceThreshold: 0.005,
            silenceDuration: 2000, // Reduced for testing
            maxConsecutiveErrors: 3
        })
        
        errorHandler.callbacks = mockCallbacks
        
        // Mock performance.now for consistent timing
        vi.spyOn(performance, 'now').mockReturnValue(1000)
        vi.spyOn(Date, 'now').mockReturnValue(1000)
    })
    
    afterEach(() => {
        if (errorHandler && errorHandler.dispose) {
            errorHandler.dispose()
        }
        vi.restoreAllMocks()
    })
    
    describe('Error Handling', () => {
        it('should handle microphone permission denied error', async () => {
            const error = {
                error: 'MICROPHONE_PERMISSION_DENIED',
                message: 'Microphone access denied'
            }
            
            const result = errorHandler.handleError(error)
            
            expect(result.handled).toBe(true)
            expect(result.displayed).toBe(true)
            expect(mockCallbacks.onError).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'MICROPHONE_PERMISSION_DENIED',
                    title: 'Microphone Access Denied',
                    message: 'Please allow microphone access to use audio reactive mode.',
                    severity: 'error',
                    recoverable: true
                })
            )
            expect(mockCallbacks.onStatusChange).toHaveBeenCalledWith('error', 'Microphone Access Denied')
        })
        
        it('should handle system audio permission denied error', async () => {
            const error = {
                error: 'SYSTEM_AUDIO_PERMISSION_DENIED',
                message: 'System audio sharing denied'
            }
            
            const result = errorHandler.handleError(error)
            
            expect(result.handled).toBe(true)
            expect(result.displayed).toBe(true)
            expect(mockCallbacks.onError).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'SYSTEM_AUDIO_PERMISSION_DENIED',
                    title: 'System Audio Sharing Denied',
                    severity: 'error',
                    recoverable: true
                })
            )
        })
        
        it('should handle no microphone device error', async () => {
            const error = {
                error: 'NO_MICROPHONE_DEVICE',
                message: 'No microphone found'
            }
            
            const result = errorHandler.handleError(error)
            
            expect(result.handled).toBe(true)
            expect(result.displayed).toBe(true)
            expect(mockCallbacks.onError).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'NO_MICROPHONE_DEVICE',
                    title: 'No Microphone Found',
                    severity: 'error',
                    recoverable: true
                })
            )
        })
        
        it('should handle browser unsupported error', async () => {
            const error = {
                error: 'WEB_AUDIO_UNSUPPORTED',
                message: 'Web Audio API not supported'
            }
            
            const result = errorHandler.handleError(error)
            
            expect(result.handled).toBe(true)
            expect(result.displayed).toBe(true)
            expect(mockCallbacks.onError).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'WEB_AUDIO_UNSUPPORTED',
                    title: 'Browser Not Supported',
                    severity: 'error',
                    recoverable: false
                })
            )
        })
        
        it('should handle connection lost error with auto recovery', async () => {
            const error = {
                error: 'CONNECTION_LOST',
                message: 'Audio connection lost'
            }
            
            const result = await errorHandler.handleError(error)
            
            expect(result.handled).toBe(true)
            expect(result.recovered).toBe(true)
            expect(mockCallbacks.onUserAction).toHaveBeenCalledWith('reconnect', expect.any(Object))
        })
        
        it('should track consecutive errors', () => {
            const error = {
                error: 'CONNECTION_LOST',
                message: 'Connection lost'
            }
            
            // First error
            errorHandler.handleError(error)
            expect(errorHandler.consecutiveErrors).toBe(1)
            
            // Second error within time window
            vi.spyOn(Date, 'now').mockReturnValue(2000) // 1 second later
            errorHandler.handleError(error)
            expect(errorHandler.consecutiveErrors).toBe(2)
            
            // Third error after time window
            vi.spyOn(Date, 'now').mockReturnValue(8000) // 6 seconds later
            errorHandler.handleError(error)
            expect(errorHandler.consecutiveErrors).toBe(1) // Reset
        })
        
        it('should not auto-recover after max consecutive errors', async () => {
            const error = {
                error: 'CONNECTION_LOST',
                message: 'Connection lost'
            }
            
            // Simulate max consecutive errors
            errorHandler.consecutiveErrors = 3
            
            const result = await errorHandler.handleError(error)
            
            expect(result.recovered).toBe(false)
            expect(result.displayed).toBe(true)
            expect(mockCallbacks.onError).toHaveBeenCalled()
        })
    })
    
    describe('Audio Level Monitoring', () => {
        it('should detect low audio levels', async () => {
            // Simulate low audio for duration
            errorHandler.monitorAudioLevel(0.005) // Below threshold
            
            // Advance time to trigger low audio detection
            vi.spyOn(Date, 'now').mockReturnValue(2500) // 1.5 seconds later
            errorHandler.monitorAudioLevel(0.005)
            
            expect(mockCallbacks.onError).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'LOW_AUDIO_LEVEL',
                    title: 'Low Audio Level Detected'
                })
            )
        })
        
        it('should detect silence and trigger fallback', async () => {
            // Simulate silence for duration
            errorHandler.monitorAudioLevel(0.001) // Below silence threshold
            
            // Advance time to trigger silence detection
            vi.spyOn(Date, 'now').mockReturnValue(3500) // 2.5 seconds later
            errorHandler.monitorAudioLevel(0.001)
            
            expect(mockCallbacks.onError).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'AUDIO_SILENCE_DETECTED',
                    title: 'No Audio Detected'
                })
            )
        })
        
        it('should reset low audio detection when levels improve', () => {
            // Start with low audio
            errorHandler.monitorAudioLevel(0.005)
            expect(errorHandler.lowAudioStartTime).toBeTruthy()
            
            // Audio level improves
            errorHandler.monitorAudioLevel(0.5)
            expect(errorHandler.lowAudioStartTime).toBeNull()
        })
        
        it('should reset silence detection when audio returns', () => {
            // Start with silence
            errorHandler.monitorAudioLevel(0.001)
            expect(errorHandler.silenceStartTime).toBeTruthy()
            
            // Audio returns
            errorHandler.monitorAudioLevel(0.3)
            expect(errorHandler.silenceStartTime).toBeNull()
        })
    })
    
    describe('Recovery Strategies', () => {
        it('should attempt reconnection for connection lost', async () => {
            const errorInfo = {
                error: 'CONNECTION_LOST',
                context: { currentSource: 'microphone' }
            }
            
            const result = await errorHandler.attemptReconnection(errorInfo)
            
            expect(mockCallbacks.onUserAction).toHaveBeenCalledWith('reconnect', errorInfo.context)
            expect(result.success).toBe(true)
        })
        
        it('should switch to alternative source', async () => {
            const errorInfo = {
                error: 'CONNECTION_LOST',
                context: { currentSource: 'microphone' }
            }
            
            const result = await errorHandler.switchToAlternativeSource(errorInfo)
            
            expect(mockCallbacks.onUserAction).toHaveBeenCalledWith('switchSource', {
                newSource: 'system',
                reason: 'auto_recovery'
            })
            expect(result.success).toBe(true)
        })
        
        it('should adjust sensitivity for low audio', async () => {
            const errorInfo = {
                error: 'LOW_AUDIO_LEVEL',
                context: { currentSensitivity: 1.0 }
            }
            
            const result = await errorHandler.adjustSensitivity(errorInfo)
            
            expect(mockCallbacks.onUserAction).toHaveBeenCalledWith('adjustSensitivity', {
                sensitivity: 1.5,
                reason: 'auto_recovery'
            })
            expect(result.success).toBe(true)
        })
        
        it('should reduce quality for performance issues', async () => {
            const errorInfo = {
                error: 'PERFORMANCE_DEGRADED',
                context: {}
            }
            
            const result = await errorHandler.reduceAudioQuality(errorInfo)
            
            expect(mockCallbacks.onUserAction).toHaveBeenCalledWith('reduceQuality', {
                reason: 'performance_recovery'
            })
            expect(result.success).toBe(true)
        })
        
        it('should fallback to normal mode', async () => {
            const errorInfo = {
                error: 'CONNECTION_LOST',
                context: { currentMode: 'reactive' }
            }
            
            const result = await errorHandler.fallbackToNormalMode(errorInfo)
            
            expect(result.success).toBe(true)
            expect(errorHandler.fallbackMode).toBe(true)
            expect(errorHandler.originalMode).toBe('reactive')
            expect(mockCallbacks.onFallback).toHaveBeenCalledWith({
                reason: 'CONNECTION_LOST',
                originalMode: 'reactive',
                fallbackMode: 'normal'
            })
        })
    })
    
    describe('Connection Status Handling', () => {
        it('should handle connection lost', () => {
            errorHandler.handleConnectionChange(false, 'microphone')
            
            expect(mockCallbacks.onError).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'CONNECTION_LOST',
                    message: 'Connection to microphone was lost'
                })
            )
        })
        
        it('should handle connection restored', () => {
            // First lose connection
            errorHandler.currentError = { error: 'CONNECTION_LOST' }
            
            // Then restore
            errorHandler.handleConnectionChange(true, 'microphone')
            
            expect(errorHandler.currentError).toBeNull()
            expect(mockCallbacks.onRecovery).toHaveBeenCalledWith({
                type: 'auto_recovery',
                message: 'Connection to microphone restored',
                timestamp: expect.any(Number)
            })
        })
        
        it('should update status on connection change', () => {
            errorHandler.handleConnectionChange(true, 'system')
            
            expect(mockCallbacks.onStatusChange).toHaveBeenCalledWith(
                'connected',
                'Connected to system'
            )
        })
    })
    
    describe('Error Recovery Execution', () => {
        it('should execute recovery strategies in priority order', async () => {
            const errorInfo = {
                error: 'CONNECTION_LOST',
                recoveryStrategies: [
                    { strategy: 'attemptReconnection', priority: 1 },
                    { strategy: 'switchToAlternativeSource', priority: 2 }
                ]
            }
            
            // Mock first strategy to fail
            mockCallbacks.onUserAction.mockResolvedValueOnce({ success: false })
            // Mock second strategy to succeed
            mockCallbacks.onUserAction.mockResolvedValueOnce({ success: true })
            
            const result = await errorHandler.attemptAutoRecovery(errorInfo)
            
            expect(result.recovered).toBe(true)
            expect(mockCallbacks.onUserAction).toHaveBeenCalledTimes(2)
        })
        
        it('should show error if all recovery strategies fail', async () => {
            const errorInfo = {
                error: 'CONNECTION_LOST',
                recoveryStrategies: [
                    { strategy: 'attemptReconnection', priority: 1 }
                ]
            }
            
            // Mock strategy to fail
            mockCallbacks.onUserAction.mockResolvedValueOnce({ success: false })
            
            const result = await errorHandler.attemptAutoRecovery(errorInfo)
            
            expect(result.recovered).toBe(false)
            expect(result.displayed).toBe(true)
            expect(mockCallbacks.onError).toHaveBeenCalled()
        })
    })
    
    describe('Error Message Templates', () => {
        it('should provide correct error template for known errors', () => {
            const template = errorHandler.errorMessages['MICROPHONE_PERMISSION_DENIED']
            
            expect(template).toEqual({
                title: 'Microphone Access Denied',
                message: 'Please allow microphone access to use audio reactive mode.',
                severity: 'error',
                recoverable: true,
                instructions: expect.arrayContaining([
                    expect.stringContaining('microphone icon'),
                    expect.stringContaining('Allow'),
                    expect.stringContaining('refresh')
                ]),
                actions: expect.arrayContaining([
                    { text: 'Try Again', action: 'retry' },
                    { text: 'Use System Audio', action: 'switchToSystem' },
                    { text: 'Disable Audio Mode', action: 'disable' }
                ])
            })
        })
        
        it('should provide generic template for unknown errors', () => {
            const error = {
                error: 'UNKNOWN_ERROR',
                message: 'Something went wrong'
            }
            
            const template = errorHandler.getGenericErrorTemplate(error)
            
            expect(template).toEqual({
                title: 'Audio Error',
                message: 'Something went wrong',
                severity: 'error',
                recoverable: true,
                instructions: expect.arrayContaining([
                    expect.stringContaining('refresh'),
                    expect.stringContaining('audio device'),
                    expect.stringContaining('different browser')
                ]),
                actions: expect.arrayContaining([
                    { text: 'Try Again', action: 'retry' },
                    { text: 'Disable Audio Mode', action: 'disable' }
                ])
            })
        })
    })
    
    describe('Error History and State', () => {
        it('should maintain error history', () => {
            const error1 = { error: 'CONNECTION_LOST', message: 'Lost connection' }
            const error2 = { error: 'LOW_AUDIO_LEVEL', message: 'Low audio' }
            
            errorHandler.handleError(error1)
            errorHandler.handleError(error2)
            
            expect(errorHandler.errorHistory).toHaveLength(2)
            expect(errorHandler.errorHistory[0]).toMatchObject(error1)
            expect(errorHandler.errorHistory[1]).toMatchObject(error2)
        })
        
        it('should limit error history size', () => {
            // Add more than 50 errors
            for (let i = 0; i < 55; i++) {
                errorHandler.handleError({
                    error: 'TEST_ERROR',
                    message: `Error ${i}`
                })
            }
            
            expect(errorHandler.errorHistory).toHaveLength(50)
        })
        
        it('should clear current error', () => {
            errorHandler.currentError = { error: 'TEST_ERROR' }
            
            errorHandler.clearError()
            
            expect(errorHandler.currentError).toBeNull()
        })
        
        it('should get current state', () => {
            errorHandler.currentError = { error: 'TEST_ERROR' }
            errorHandler.fallbackMode = true
            
            const state = errorHandler.getState()
            
            expect(state).toEqual({
                hasError: true,
                currentError: { error: 'TEST_ERROR' },
                fallbackMode: true,
                consecutiveErrors: expect.any(Number),
                errorHistory: expect.any(Array)
            })
        })
    })
    
    describe('Disposal and Cleanup', () => {
        it('should dispose resources properly', () => {
            errorHandler.errorTimer = setTimeout(() => {}, 1000)
            errorHandler.warningTimer = setTimeout(() => {}, 1000)
            
            errorHandler.dispose()
            
            expect(errorHandler.callbacks).toEqual({})
            expect(errorHandler.errorTimer).toBeNull()
            expect(errorHandler.warningTimer).toBeNull()
        })
    })
})