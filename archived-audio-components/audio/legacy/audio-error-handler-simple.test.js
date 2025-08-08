/**
 * Simple test for AudioErrorHandler to verify basic functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AudioErrorHandler } from './audio-error-handler.js'

describe('AudioErrorHandler Basic Tests', () => {
    let errorHandler
    
    beforeEach(() => {
        errorHandler = new AudioErrorHandler()
    })
    
    it('should create error handler instance', () => {
        expect(errorHandler).toBeDefined()
        expect(errorHandler.config).toBeDefined()
        expect(errorHandler.errorMessages).toBeDefined()
    })
    
    it('should handle basic error', () => {
        const mockCallback = vi.fn()
        errorHandler.callbacks.onError = mockCallback
        
        const error = {
            error: 'TEST_ERROR',
            message: 'Test error message'
        }
        
        const result = errorHandler.handleError(error)
        
        expect(result.handled).toBe(true)
        expect(mockCallback).toHaveBeenCalled()
    })
    
    it('should monitor audio levels', () => {
        errorHandler.monitorAudioLevel(0.5)
        expect(errorHandler.lastAudioLevel).toBe(0.5)
        expect(errorHandler.audioLevelHistory).toHaveLength(1)
    })
})