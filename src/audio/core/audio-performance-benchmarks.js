/**
 * AudioPerformanceBenchmarks - Comprehensive benchmarking suite for audio processing
 * Tests various components and configurations to identify optimal settings
 */
import { AudioAnalyzer } from './audio-analyzer.js'
import { AudioEffects } from './audio-effects.js'
import { AudioPerformanceMonitor } from './audio-performance-monitor.js'
import { AudioWorkerManager } from './audio-worker-manager.js'
import { FFTOptimizer } from './fft-optimizer.js'

export class AudioPerformanceBenchmarks {
    constructor(options = {}) {
        this.config = {
            benchmarkDuration: options.benchmarkDuration || 5000, // ms
            warmupDuration: options.warmupDuration || 1000, // ms
            testIterations: options.testIterations || 100,
            sampleRate: options.sampleRate || 44100,
            testDataSize: options.testDataSize || 2048
        }
        
        // Test configurations to benchmark
        this.testConfigurations = [
            { name: 'High Quality', fftSize: 4096, smoothing: 0.8, effects: true },
            { name: 'Standard Quality', fftSize: 2048, smoothing: 0.7, effects: true },
            { name: 'Performance Mode', fftSize: 1024, smoothing: 0.5, effects: true },
            { name: 'Minimal Mode', fftSize: 512, smoothing: 0.3, effects: false }
        ]
        
        // Benchmark results storage
        this.results = {
            audioAnalyzer: {},
            audioEffects: {},
            fftOptimizer: {},
            workerManager: {},
            integrated: {},
            summary: null
        }
        
        // Test data generators
        this.testDataGenerators = {
            silence: () => new Uint8Array(this.config.testDataSize).fill(0),
            whiteNoise: () => this.generateWhiteNoise(),
            sineWave: (freq) => this.generateSineWave(freq),
            musicSimulation: () => this.generateMusicSimulation(),
            beatPattern: () => this.generateBeatPattern()
        }
        
        // Performance monitor for benchmarking
        this.performanceMonitor = new AudioPerformanceMonitor({
            targetAnalysisTime: 2,
            maxAnalysisTime: 5,
            benchmarkDuration: this.config.benchmarkDuration
        })
        
        this.isRunning = false
        this.currentTest = null
    }
    
    /**
     * Run complete benchmark suite
     * @returns {Promise<Object>} Complete benchmark results
     */
    async runCompleteBenchmark() {
        if (this.isRunning) {
            throw new Error('Benchmark already running')
        }
        
        this.isRunning = true
        console.log('Starting comprehensive audio performance benchmark...')
        
        try {
            // Run individual component benchmarks
            await this.benchmarkAudioAnalyzer()
            await this.benchmarkAudioEffects()
            await this.benchmarkFFTOptimizer()
            await this.benchmarkWorkerManager()
            await this.benchmarkIntegratedSystem()
            
            // Generate summary
            this.generateBenchmarkSummary()
            
            console.log('Benchmark completed successfully')
            return this.results
            
        } catch (error) {
            console.error('Benchmark failed:', error)
            throw error
        } finally {
            this.isRunning = false
        }
    }
    
    /**
     * Benchmark AudioAnalyzer performance
     * @returns {Promise<Object>} AudioAnalyzer benchmark results
     */
    async benchmarkAudioAnalyzer() {
        console.log('Benchmarking AudioAnalyzer...')
        this.currentTest = 'AudioAnalyzer'
        
        const results = {}
        
        for (const config of this.testConfigurations) {
            console.log(`Testing AudioAnalyzer with ${config.name} configuration`)
            
            const analyzer = new AudioAnalyzer({
                fftSize: config.fftSize,
                smoothingTimeConstant: config.smoothing
            })
            
            // Initialize with mock audio context
            await this.initializeMockAnalyzer(analyzer)
            
            // Test different data types
            const testResults = {}
            
            for (const [dataType, generator] of Object.entries(this.testDataGenerators)) {
                const testData = generator()
                const times = []
                
                // Warmup
                for (let i = 0; i < 10; i++) {
                    analyzer.getFrequencyData()
                }
                
                // Benchmark
                for (let i = 0; i < this.config.testIterations; i++) {
                    // Simulate new frequency data
                    analyzer.frequencyData = testData
                    
                    const startTime = performance.now()
                    analyzer.getFrequencyData()
                    const endTime = performance.now()
                    
                    times.push(endTime - startTime)
                }
                
                testResults[dataType] = this.calculateStatistics(times)
            }
            
            results[config.name] = testResults
            analyzer.dispose()
        }
        
        this.results.audioAnalyzer = results
        return results
    }
    
    /**
     * Benchmark AudioEffects performance
     * @returns {Promise<Object>} AudioEffects benchmark results
     */
    async benchmarkAudioEffects() {
        console.log('Benchmarking AudioEffects...')
        this.currentTest = 'AudioEffects'
        
        const results = {}
        const mockFluxApp = this.createMockFluxApp()
        
        const effectModes = ['pulse', 'reactive', 'flow', 'ambient']
        
        for (const mode of effectModes) {
            console.log(`Testing AudioEffects in ${mode} mode`)
            
            const effects = new AudioEffects(mockFluxApp, { mode })
            effects.enable()
            
            const times = []
            const mockAudioData = {
                bass: Math.random(),
                mids: Math.random(),
                treble: Math.random(),
                overall: Math.random()
            }
            
            const mockBeatData = {
                isBeat: Math.random() > 0.8,
                energy: Math.random(),
                strength: Math.random() * 2,
                bpm: 120 + Math.random() * 60
            }
            
            // Warmup
            for (let i = 0; i < 10; i++) {
                effects.processAudioData(mockAudioData, mockBeatData)
            }
            
            // Benchmark
            for (let i = 0; i < this.config.testIterations; i++) {
                // Vary audio data for realistic testing
                mockAudioData.bass = Math.random()
                mockAudioData.mids = Math.random()
                mockAudioData.treble = Math.random()
                mockBeatData.isBeat = Math.random() > 0.8
                
                const startTime = performance.now()
                effects.processAudioData(mockAudioData, mockBeatData)
                const endTime = performance.now()
                
                times.push(endTime - startTime)
            }
            
            results[mode] = this.calculateStatistics(times)
        }
        
        this.results.audioEffects = results
        return results
    }
    
    /**
     * Benchmark FFTOptimizer performance
     * @returns {Promise<Object>} FFTOptimizer benchmark results
     */
    async benchmarkFFTOptimizer() {
        console.log('Benchmarking FFTOptimizer...')
        this.currentTest = 'FFTOptimizer'
        
        const results = {}
        
        for (const config of this.testConfigurations) {
            console.log(`Testing FFTOptimizer with ${config.name} configuration`)
            
            const optimizer = new FFTOptimizer({
                fftSize: config.fftSize,
                sampleRate: this.config.sampleRate
            })
            
            const testResults = {}
            
            // Test different optimization settings
            const optimizationSettings = [
                { name: 'All Optimizations', binning: true, windowing: true, lookupTables: true },
                { name: 'No Binning Optimization', binning: false, windowing: true, lookupTables: true },
                { name: 'No Windowing Optimization', binning: true, windowing: false, lookupTables: true },
                { name: 'No Optimizations', binning: false, windowing: false, lookupTables: false }
            ]
            
            for (const optSetting of optimizationSettings) {
                optimizer.setOptimizations(optSetting)
                
                const times = []
                const testData = this.testDataGenerators.musicSimulation()
                
                // Warmup
                for (let i = 0; i < 10; i++) {
                    optimizer.calculateOptimizedFrequencyRange(testData, 'bass')
                }
                
                // Benchmark frequency range calculations
                for (let i = 0; i < this.config.testIterations; i++) {
                    const startTime = performance.now()
                    
                    optimizer.calculateOptimizedFrequencyRange(testData, 'bass')
                    optimizer.calculateOptimizedFrequencyRange(testData, 'mids')
                    optimizer.calculateOptimizedFrequencyRange(testData, 'treble')
                    
                    const endTime = performance.now()
                    times.push(endTime - startTime)
                }
                
                testResults[optSetting.name] = this.calculateStatistics(times)
            }
            
            results[config.name] = testResults
            optimizer.dispose()
        }
        
        this.results.fftOptimizer = results
        return results
    }
    
    /**
     * Benchmark AudioWorkerManager performance
     * @returns {Promise<Object>} WorkerManager benchmark results
     */
    async benchmarkWorkerManager() {
        console.log('Benchmarking AudioWorkerManager...')
        this.currentTest = 'AudioWorkerManager'
        
        const results = {}
        
        // Test both worker and fallback modes
        const testModes = [
            { name: 'Web Worker', workerEnabled: true },
            { name: 'Main Thread Fallback', workerEnabled: false }
        ]
        
        for (const mode of testModes) {
            console.log(`Testing AudioWorkerManager in ${mode.name} mode`)
            
            const workerManager = new AudioWorkerManager({
                workerEnabled: mode.workerEnabled,
                workerPath: '/src/audio/audio-worker.js'
            })
            
            try {
                await workerManager.initialize({
                    fftSize: 2048,
                    sampleRate: this.config.sampleRate
                })
                
                const times = []
                const testFreqData = this.testDataGenerators.musicSimulation()
                const testTimeData = this.testDataGenerators.whiteNoise()
                
                // Warmup
                for (let i = 0; i < 5; i++) {
                    await workerManager.processAudioData(testFreqData, testTimeData)
                }
                
                // Benchmark
                for (let i = 0; i < Math.min(this.config.testIterations, 50); i++) {
                    const startTime = performance.now()
                    await workerManager.processAudioData(testFreqData, testTimeData)
                    const endTime = performance.now()
                    
                    times.push(endTime - startTime)
                }
                
                results[mode.name] = this.calculateStatistics(times)
                
            } catch (error) {
                console.warn(`Failed to test ${mode.name}:`, error)
                results[mode.name] = { error: error.message }
            }
            
            workerManager.dispose()
        }
        
        this.results.workerManager = results
        return results
    }
    
    /**
     * Benchmark integrated system performance
     * @returns {Promise<Object>} Integrated system benchmark results
     */
    async benchmarkIntegratedSystem() {
        console.log('Benchmarking integrated system...')
        this.currentTest = 'Integrated System'
        
        const results = {}
        
        for (const config of this.testConfigurations) {
            console.log(`Testing integrated system with ${config.name} configuration`)
            
            try {
                // Create integrated system components
                const analyzer = new AudioAnalyzer({
                    fftSize: config.fftSize,
                    smoothingTimeConstant: config.smoothing
                })
                
                const mockFluxApp = this.createMockFluxApp()
                const effects = new AudioEffects(mockFluxApp, { 
                    mode: 'reactive',
                    intensity: 1.0,
                    smoothingFactor: config.smoothing
                })
                
                await this.initializeMockAnalyzer(analyzer)
                if (config.effects) {
                    effects.enable()
                }
                
                const times = []
                
                // Warmup
                for (let i = 0; i < 10; i++) {
                    const audioData = analyzer.getFrequencyData()
                    const beatData = { isBeat: false, energy: 0, strength: 0, bpm: 0 }
                    if (config.effects) {
                        effects.processAudioData(audioData, beatData)
                    }
                }
                
                // Benchmark full pipeline
                for (let i = 0; i < this.config.testIterations; i++) {
                    // Simulate new audio data
                    analyzer.frequencyData = this.testDataGenerators.musicSimulation()
                    
                    const startTime = performance.now()
                    
                    // Full processing pipeline
                    const audioData = analyzer.getFrequencyData()
                    const beatData = {
                        isBeat: Math.random() > 0.9,
                        energy: Math.random(),
                        strength: Math.random() * 2,
                        bpm: 120 + Math.random() * 60
                    }
                    
                    if (config.effects) {
                        effects.processAudioData(audioData, beatData)
                    }
                    
                    const endTime = performance.now()
                    times.push(endTime - startTime)
                }
                
                results[config.name] = this.calculateStatistics(times)
                
                analyzer.dispose()
                
            } catch (error) {
                console.warn(`Failed to test ${config.name}:`, error)
                results[config.name] = { error: error.message }
            }
        }
        
        this.results.integrated = results
        return results
    }
    
    /**
     * Generate test data - white noise
     * @returns {Uint8Array} White noise data
     */
    generateWhiteNoise() {
        const data = new Uint8Array(this.config.testDataSize)
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.floor(Math.random() * 256)
        }
        return data
    }
    
    /**
     * Generate test data - sine wave
     * @param {number} frequency - Sine wave frequency
     * @returns {Uint8Array} Sine wave data
     */
    generateSineWave(frequency = 440) {
        const data = new Uint8Array(this.config.testDataSize)
        const binWidth = (this.config.sampleRate / 2) / this.config.testDataSize
        const targetBin = Math.floor(frequency / binWidth)
        
        // Create a peak at the target frequency
        for (let i = 0; i < data.length; i++) {
            if (i === targetBin) {
                data[i] = 255
            } else if (Math.abs(i - targetBin) <= 2) {
                data[i] = Math.floor(128 * Math.exp(-Math.abs(i - targetBin)))
            } else {
                data[i] = Math.floor(Math.random() * 20) // Low noise floor
            }
        }
        
        return data
    }
    
    /**
     * Generate test data - music simulation
     * @returns {Uint8Array} Simulated music spectrum
     */
    generateMusicSimulation() {
        const data = new Uint8Array(this.config.testDataSize)
        
        // Simulate typical music spectrum with bass, mids, and treble content
        for (let i = 0; i < data.length; i++) {
            const frequency = (i / data.length) * (this.config.sampleRate / 2)
            let amplitude = 0
            
            // Bass content (20-250 Hz)
            if (frequency >= 20 && frequency <= 250) {
                amplitude += 180 * Math.exp(-frequency / 100) * (0.8 + 0.4 * Math.random())
            }
            
            // Mid content (250-4000 Hz)
            if (frequency >= 250 && frequency <= 4000) {
                amplitude += 120 * Math.exp(-Math.abs(frequency - 1000) / 800) * (0.6 + 0.4 * Math.random())
            }
            
            // Treble content (4000-20000 Hz)
            if (frequency >= 4000 && frequency <= 20000) {
                amplitude += 80 * Math.exp(-frequency / 8000) * (0.4 + 0.6 * Math.random())
            }
            
            // Add harmonics
            if (frequency % 440 < 20) { // Harmonics of A4
                amplitude += 60 * (0.5 + 0.5 * Math.random())
            }
            
            data[i] = Math.min(255, Math.floor(amplitude))
        }
        
        return data
    }
    
    /**
     * Generate test data - beat pattern
     * @returns {Uint8Array} Beat pattern data
     */
    generateBeatPattern() {
        const data = new Uint8Array(this.config.testDataSize)
        
        // Simulate strong bass content for beat detection
        for (let i = 0; i < Math.floor(data.length * 0.1); i++) {
            data[i] = Math.floor(200 + 55 * Math.random()) // Strong bass
        }
        
        // Add some mid and high frequency content
        for (let i = Math.floor(data.length * 0.1); i < data.length; i++) {
            data[i] = Math.floor(50 * Math.random()) // Lower mid/high content
        }
        
        return data
    }
    
    /**
     * Initialize mock analyzer for testing
     * @param {AudioAnalyzer} analyzer - Analyzer to initialize
     */
    async initializeMockAnalyzer(analyzer) {
        // Mock the necessary properties for testing
        analyzer.isInitialized = true
        analyzer.frequencyData = new Uint8Array(analyzer.config.fftSize / 2)
        analyzer.timeData = new Uint8Array(analyzer.config.fftSize / 2)
        
        // Mock analyser node
        analyzer.analyserNode = {
            frequencyBinCount: analyzer.config.fftSize / 2,
            getByteFrequencyData: (data) => {
                // Copy test data
                for (let i = 0; i < Math.min(data.length, analyzer.frequencyData.length); i++) {
                    data[i] = analyzer.frequencyData[i]
                }
            },
            getByteTimeDomainData: (data) => {
                // Generate mock time data
                for (let i = 0; i < data.length; i++) {
                    data[i] = 128 + Math.floor(50 * Math.sin(i * 0.1))
                }
            }
        }
    }
    
    /**
     * Create mock FLUX application for testing
     * @returns {Object} Mock FLUX app
     */
    createMockFluxApp() {
        return {
            config: {
                containerWidth: 800,
                containerHeight: 600
            },
            solver: {
                apply_force: (x, y, radius, strength) => {
                    // Mock force application - just track calls
                    return true
                }
            },
            particleRenderer: {
                enableAudioReactive: () => {},
                disableAudioReactive: () => {},
                updateBloomIntensity: (intensity) => {},
                updateAudioColors: (hue, saturation, lightness) => {},
                updateTrebleSizes: (treble, spectrum) => {},
                createSparkleEffects: (treble, count) => {},
                applyBeatPulse: (strength) => {}
            }
        }
    }
    
    /**
     * Calculate statistics from timing data
     * @param {Array} times - Array of timing measurements
     * @returns {Object} Statistical analysis
     */
    calculateStatistics(times) {
        if (times.length === 0) {
            return { error: 'No timing data' }
        }
        
        const sorted = [...times].sort((a, b) => a - b)
        const sum = times.reduce((a, b) => a + b, 0)
        const mean = sum / times.length
        
        // Calculate standard deviation
        const variance = times.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / times.length
        const stdDev = Math.sqrt(variance)
        
        return {
            count: times.length,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            mean: mean,
            median: sorted[Math.floor(sorted.length / 2)],
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)],
            standardDeviation: stdDev,
            targetMet: mean < 2.0, // 2ms target
            performanceGrade: this.calculatePerformanceGrade(mean)
        }
    }
    
    /**
     * Calculate performance grade
     * @param {number} meanTime - Mean processing time
     * @returns {string} Performance grade
     */
    calculatePerformanceGrade(meanTime) {
        if (meanTime < 1.0) return 'A+'
        if (meanTime < 1.5) return 'A'
        if (meanTime < 2.0) return 'B+'
        if (meanTime < 3.0) return 'B'
        if (meanTime < 5.0) return 'C'
        return 'D'
    }
    
    /**
     * Generate comprehensive benchmark summary
     */
    generateBenchmarkSummary() {
        const summary = {
            timestamp: new Date().toISOString(),
            testConfiguration: this.config,
            overallPerformance: {},
            recommendations: [],
            bestConfigurations: {},
            performanceIssues: []
        }
        
        // Analyze overall performance
        const allResults = [
            ...Object.values(this.results.audioAnalyzer),
            ...Object.values(this.results.audioEffects),
            ...Object.values(this.results.fftOptimizer),
            ...Object.values(this.results.integrated)
        ].flat()
        
        // Find best performing configurations
        for (const [component, results] of Object.entries(this.results)) {
            if (component === 'summary') continue
            
            let bestConfig = null
            let bestScore = Infinity
            
            for (const [configName, configResults] of Object.entries(results)) {
                const score = this.calculateConfigScore(configResults)
                if (score < bestScore) {
                    bestScore = score
                    bestConfig = configName
                }
            }
            
            summary.bestConfigurations[component] = {
                configuration: bestConfig,
                score: bestScore
            }
        }
        
        // Generate recommendations
        summary.recommendations = this.generateRecommendations()
        
        // Identify performance issues
        summary.performanceIssues = this.identifyPerformanceIssues()
        
        this.results.summary = summary
        
        console.log('=== Audio Performance Benchmark Summary ===')
        console.log(`Best configurations:`, summary.bestConfigurations)
        console.log(`Recommendations:`, summary.recommendations)
        console.log(`Performance issues:`, summary.performanceIssues)
    }
    
    /**
     * Calculate configuration score for ranking
     * @param {Object} configResults - Configuration results
     * @returns {number} Score (lower is better)
     */
    calculateConfigScore(configResults) {
        if (typeof configResults !== 'object' || configResults.error) {
            return Infinity
        }
        
        // Handle different result structures
        if (configResults.mean !== undefined) {
            return configResults.mean
        }
        
        // For nested results, calculate average
        let totalScore = 0
        let count = 0
        
        for (const result of Object.values(configResults)) {
            if (result && result.mean !== undefined) {
                totalScore += result.mean
                count++
            }
        }
        
        return count > 0 ? totalScore / count : Infinity
    }
    
    /**
     * Generate performance recommendations
     * @returns {Array} Array of recommendations
     */
    generateRecommendations() {
        const recommendations = []
        
        // Analyze worker vs main thread performance
        if (this.results.workerManager['Web Worker'] && this.results.workerManager['Main Thread Fallback']) {
            const workerTime = this.results.workerManager['Web Worker'].mean || Infinity
            const fallbackTime = this.results.workerManager['Main Thread Fallback'].mean || Infinity
            
            if (workerTime < fallbackTime * 0.8) {
                recommendations.push('Use Web Workers for audio processing - significant performance improvement detected')
            } else if (fallbackTime < workerTime * 0.8) {
                recommendations.push('Main thread processing performs better than Web Workers in this environment')
            }
        }
        
        // Analyze FFT optimization impact
        const fftResults = this.results.fftOptimizer
        for (const [config, results] of Object.entries(fftResults)) {
            if (results['All Optimizations'] && results['No Optimizations']) {
                const optimizedTime = results['All Optimizations'].mean || Infinity
                const unoptimizedTime = results['No Optimizations'].mean || Infinity
                
                if (optimizedTime < unoptimizedTime * 0.7) {
                    recommendations.push(`FFT optimizations provide significant benefit for ${config} configuration`)
                }
            }
        }
        
        // Analyze configuration trade-offs
        const integratedResults = this.results.integrated
        const performanceMode = integratedResults['Performance Mode']
        const highQuality = integratedResults['High Quality']
        
        if (performanceMode && highQuality) {
            const perfTime = performanceMode.mean || Infinity
            const qualityTime = highQuality.mean || Infinity
            
            if (qualityTime > 3.0 && perfTime < 2.0) {
                recommendations.push('Consider Performance Mode for better frame rate - High Quality may impact 60fps target')
            }
        }
        
        return recommendations
    }
    
    /**
     * Identify performance issues
     * @returns {Array} Array of performance issues
     */
    identifyPerformanceIssues() {
        const issues = []
        
        // Check for configurations exceeding target times
        for (const [component, results] of Object.entries(this.results)) {
            if (component === 'summary') continue
            
            for (const [configName, configResults] of Object.entries(results)) {
                const meanTime = this.calculateConfigScore(configResults)
                
                if (meanTime > 5.0) {
                    issues.push(`${component} ${configName}: Exceeds maximum target (${meanTime.toFixed(2)}ms > 5ms)`)
                } else if (meanTime > 2.0) {
                    issues.push(`${component} ${configName}: Exceeds preferred target (${meanTime.toFixed(2)}ms > 2ms)`)
                }
            }
        }
        
        return issues
    }
    
    /**
     * Export benchmark results
     * @param {string} format - Export format ('json' or 'csv')
     * @returns {string} Exported data
     */
    exportResults(format = 'json') {
        if (format === 'json') {
            return JSON.stringify(this.results, null, 2)
        } else if (format === 'csv') {
            return this.convertToCSV()
        } else {
            throw new Error(`Unsupported export format: ${format}`)
        }
    }
    
    /**
     * Convert results to CSV format
     * @returns {string} CSV data
     */
    convertToCSV() {
        const rows = []
        rows.push(['Component', 'Configuration', 'Test', 'Mean (ms)', 'Min (ms)', 'Max (ms)', 'P95 (ms)', 'Grade'])
        
        for (const [component, results] of Object.entries(this.results)) {
            if (component === 'summary') continue
            
            for (const [configName, configResults] of Object.entries(results)) {
                if (configResults.mean !== undefined) {
                    rows.push([
                        component,
                        configName,
                        'Overall',
                        configResults.mean.toFixed(3),
                        configResults.min.toFixed(3),
                        configResults.max.toFixed(3),
                        configResults.p95.toFixed(3),
                        configResults.performanceGrade
                    ])
                } else {
                    for (const [testName, testResults] of Object.entries(configResults)) {
                        if (testResults.mean !== undefined) {
                            rows.push([
                                component,
                                configName,
                                testName,
                                testResults.mean.toFixed(3),
                                testResults.min.toFixed(3),
                                testResults.max.toFixed(3),
                                testResults.p95.toFixed(3),
                                testResults.performanceGrade
                            ])
                        }
                    }
                }
            }
        }
        
        return rows.map(row => row.join(',')).join('\n')
    }
    
    /**
     * Get current benchmark status
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            currentTest: this.currentTest,
            hasResults: Object.keys(this.results).length > 0,
            completedTests: Object.keys(this.results).filter(key => key !== 'summary').length
        }
    }
    
    /**
     * Stop running benchmark
     */
    stop() {
        this.isRunning = false
        this.currentTest = null
        console.log('Benchmark stopped')
    }
    
    /**
     * Clear benchmark results
     */
    clearResults() {
        this.results = {
            audioAnalyzer: {},
            audioEffects: {},
            fftOptimizer: {},
            workerManager: {},
            integrated: {},
            summary: null
        }
        console.log('Benchmark results cleared')
    }
}