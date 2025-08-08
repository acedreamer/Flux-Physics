/**
 * Comprehensive test runner for all audio reactive tests
 * Runs all test suites and provides detailed reporting
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

class AudioTestRunner {
    constructor() {
        this.testSuites = [
            // Unit Tests
            { name: 'Audio Analyzer', path: 'tests/unit/audio-analyzer.test.js', category: 'unit' },
            { name: 'Beat Detector', path: 'tests/unit/beat-detector.test.js', category: 'unit' },
            { name: 'Audio Effects', path: 'tests/unit/audio-effects.test.js', category: 'unit' },
            { name: 'Audio Settings', path: 'tests/unit/audio-settings.test.js', category: 'unit' },
            { name: 'Audio UI', path: 'tests/unit/audio-ui.test.js', category: 'unit' },
            { name: 'Frequency Analyzer', path: 'tests/unit/frequency-analyzer.test.js', category: 'unit' },
            { name: 'Audio Performance Monitor', path: 'tests/unit/audio-performance-monitor.test.js', category: 'unit' },
            { name: 'FFT Optimizer', path: 'tests/unit/fft-optimizer.test.js', category: 'unit' },
            { name: 'Audio Comprehensive', path: 'tests/unit/audio-comprehensive.test.js', category: 'unit' },
            
            // Integration Tests
            { name: 'Audio Reactive Integration', path: 'tests/integration/audio-reactive-integration.test.js', category: 'integration' },
            { name: 'Audio Visual Sync', path: 'tests/integration/audio-visual-sync.test.js', category: 'integration' },
            { name: 'Audio Settings Integration', path: 'tests/integration/audio-settings-integration.test.js', category: 'integration' },
            { name: 'Audio UI Integration', path: 'tests/integration/audio-ui-integration.test.js', category: 'integration' },
            { name: 'System Audio Integration', path: 'tests/integration/system-audio-integration.test.js', category: 'integration' },
            { name: 'Audio Permission Handling', path: 'tests/integration/audio-permission-handling.test.js', category: 'integration' },
            { name: 'Audio User Experience', path: 'tests/integration/audio-user-experience.test.js', category: 'integration' },
            
            // Performance Tests
            { name: 'Audio Performance Load', path: 'tests/performance/audio-performance-load.test.js', category: 'performance' },
            { name: 'Audio Performance Optimization', path: 'tests/integration/audio-performance-optimization.test.js', category: 'performance' },
            
            // Cross-browser Tests
            { name: 'Audio Compatibility', path: 'tests/cross-browser/audio-compatibility.test.js', category: 'cross-browser' },
            { name: 'Audio Capture Compatibility', path: 'tests/cross-browser/audio-capture-compatibility.test.js', category: 'cross-browser' },
            
            // Visual Tests
            { name: 'Audio Reactive Visual Validation', path: 'tests/visual/audio-reactive-visual-validation.test.js', category: 'visual' },
            { name: 'Audio Reactive Rendering', path: 'tests/visual/audio-reactive-rendering.test.js', category: 'visual' }
        ]
        
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            suites: [],
            coverage: null,
            duration: 0
        }
    }
    
    async runAllTests(options = {}) {
        const { 
            categories = ['unit', 'integration', 'performance', 'cross-browser', 'visual'],
            coverage = true,
            parallel = true,
            verbose = true
        } = options
        
        console.log('🧪 Starting Comprehensive Audio Reactive Test Suite')
        console.log('=' .repeat(60))
        
        const startTime = Date.now()
        
        // Filter test suites by category
        const suitesToRun = this.testSuites.filter(suite => categories.includes(suite.category))
        
        console.log(`📋 Running ${suitesToRun.length} test suites across ${categories.length} categories`)
        console.log(`🔧 Options: Coverage=${coverage}, Parallel=${parallel}, Verbose=${verbose}`)
        console.log('')
        
        // Run tests by category
        for (const category of categories) {
            await this.runCategory(category, suitesToRun, { coverage, parallel, verbose })
        }
        
        this.results.duration = Date.now() - startTime
        
        // Generate final report
        this.generateReport()
        
        return this.results
    }
    
    async runCategory(category, allSuites, options) {
        const categorySuites = allSuites.filter(suite => suite.category === category)
        
        if (categorySuites.length === 0) return
        
        console.log(`\n📂 ${category.toUpperCase()} TESTS`)
        console.log('-'.repeat(40))
        
        for (const suite of categorySuites) {
            await this.runTestSuite(suite, options)
        }
    }
    
    async runTestSuite(suite, options) {
        const { verbose } = options
        
        try {
            if (verbose) {
                console.log(`🔄 Running: ${suite.name}`)
            }
            
            const startTime = Date.now()
            
            // Build vitest command
            const command = this.buildTestCommand(suite, options)
            
            // Execute test
            const output = execSync(command, { 
                encoding: 'utf8',
                stdio: verbose ? 'inherit' : 'pipe'
            })
            
            const duration = Date.now() - startTime
            
            // Parse results (simplified - in real implementation would parse vitest output)
            const suiteResult = {
                name: suite.name,
                category: suite.category,
                path: suite.path,
                status: 'passed',
                duration,
                tests: this.parseTestOutput(output),
                coverage: null
            }
            
            this.results.suites.push(suiteResult)
            this.results.passed += suiteResult.tests.passed
            this.results.failed += suiteResult.tests.failed
            this.results.skipped += suiteResult.tests.skipped
            this.results.total += suiteResult.tests.total
            
            if (verbose) {
                console.log(`✅ ${suite.name}: ${suiteResult.tests.passed}/${suiteResult.tests.total} passed (${duration}ms)`)
            }
            
        } catch (error) {
            const suiteResult = {
                name: suite.name,
                category: suite.category,
                path: suite.path,
                status: 'failed',
                duration: 0,
                tests: { total: 0, passed: 0, failed: 1, skipped: 0 },
                error: error.message,
                coverage: null
            }
            
            this.results.suites.push(suiteResult)
            this.results.failed += 1
            this.results.total += 1
            
            console.log(`❌ ${suite.name}: FAILED - ${error.message}`)
        }
    }
    
    buildTestCommand(suite, options) {
        const { coverage } = options
        
        let command = 'npx vitest run'
        
        if (coverage) {
            command += ' --coverage'
        }
        
        command += ` "${suite.path}"`
        
        return command
    }
    
    parseTestOutput(output) {
        // Simplified parser - in real implementation would parse vitest JSON output
        const lines = output.split('\n')
        
        // Look for test summary line
        const summaryLine = lines.find(line => line.includes('Test Files') || line.includes('Tests'))
        
        if (summaryLine) {
            // Extract numbers from summary (simplified)
            const numbers = summaryLine.match(/\d+/g) || []
            return {
                total: parseInt(numbers[0]) || 1,
                passed: parseInt(numbers[1]) || 1,
                failed: parseInt(numbers[2]) || 0,
                skipped: parseInt(numbers[3]) || 0
            }
        }
        
        // Default if parsing fails
        return { total: 1, passed: 1, failed: 0, skipped: 0 }
    }
    
    generateReport() {
        console.log('\n' + '='.repeat(60))
        console.log('📊 COMPREHENSIVE TEST RESULTS')
        console.log('='.repeat(60))
        
        // Overall summary
        console.log(`\n📈 OVERALL SUMMARY:`)
        console.log(`   Total Tests: ${this.results.total}`)
        console.log(`   Passed: ${this.results.passed} (${((this.results.passed / this.results.total) * 100).toFixed(1)}%)`)
        console.log(`   Failed: ${this.results.failed}`)
        console.log(`   Skipped: ${this.results.skipped}`)
        console.log(`   Duration: ${(this.results.duration / 1000).toFixed(2)}s`)
        
        // Category breakdown
        console.log(`\n📂 BY CATEGORY:`)
        const categories = [...new Set(this.results.suites.map(s => s.category))]
        
        categories.forEach(category => {
            const categorySuites = this.results.suites.filter(s => s.category === category)
            const categoryPassed = categorySuites.reduce((sum, s) => sum + s.tests.passed, 0)
            const categoryTotal = categorySuites.reduce((sum, s) => sum + s.tests.total, 0)
            const categoryFailed = categorySuites.reduce((sum, s) => sum + s.tests.failed, 0)
            
            const status = categoryFailed === 0 ? '✅' : '❌'
            console.log(`   ${status} ${category}: ${categoryPassed}/${categoryTotal} passed`)
        })
        
        // Failed tests
        const failedSuites = this.results.suites.filter(s => s.status === 'failed' || s.tests.failed > 0)
        if (failedSuites.length > 0) {
            console.log(`\n❌ FAILED TESTS:`)
            failedSuites.forEach(suite => {
                console.log(`   - ${suite.name}: ${suite.error || 'Test failures'}`)
            })
        }
        
        // Performance insights
        console.log(`\n⚡ PERFORMANCE INSIGHTS:`)
        const slowSuites = this.results.suites
            .filter(s => s.duration > 5000)
            .sort((a, b) => b.duration - a.duration)
        
        if (slowSuites.length > 0) {
            console.log(`   Slowest test suites:`)
            slowSuites.slice(0, 5).forEach(suite => {
                console.log(`   - ${suite.name}: ${(suite.duration / 1000).toFixed(2)}s`)
            })
        } else {
            console.log(`   All test suites completed in reasonable time`)
        }
        
        // Coverage summary (if available)
        if (this.results.coverage) {
            console.log(`\n📋 COVERAGE SUMMARY:`)
            console.log(`   Lines: ${this.results.coverage.lines}%`)
            console.log(`   Functions: ${this.results.coverage.functions}%`)
            console.log(`   Branches: ${this.results.coverage.branches}%`)
        }
        
        // Recommendations
        console.log(`\n💡 RECOMMENDATIONS:`)
        if (this.results.failed > 0) {
            console.log(`   - Fix ${this.results.failed} failing tests before deployment`)
        }
        if (slowSuites.length > 0) {
            console.log(`   - Optimize ${slowSuites.length} slow test suites`)
        }
        if (this.results.skipped > 0) {
            console.log(`   - Review ${this.results.skipped} skipped tests`)
        }
        if (this.results.failed === 0) {
            console.log(`   - All tests passing! Ready for deployment ✨`)
        }
        
        console.log('\n' + '='.repeat(60))
        
        // Save detailed report
        this.saveDetailedReport()
    }
    
    saveDetailedReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.results.total,
                passed: this.results.passed,
                failed: this.results.failed,
                skipped: this.results.skipped,
                duration: this.results.duration,
                passRate: (this.results.passed / this.results.total) * 100
            },
            suites: this.results.suites,
            coverage: this.results.coverage
        }
        
        const reportPath = join(process.cwd(), 'test-results', 'audio-comprehensive-report.json')
        
        try {
            writeFileSync(reportPath, JSON.stringify(report, null, 2))
            console.log(`📄 Detailed report saved to: ${reportPath}`)
        } catch (error) {
            console.log(`⚠️  Could not save detailed report: ${error.message}`)
        }
    }
    
    // Quick test methods for specific categories
    async runUnitTests() {
        return this.runAllTests({ categories: ['unit'] })
    }
    
    async runIntegrationTests() {
        return this.runAllTests({ categories: ['integration'] })
    }
    
    async runPerformanceTests() {
        return this.runAllTests({ categories: ['performance'] })
    }
    
    async runCrossBrowserTests() {
        return this.runAllTests({ categories: ['cross-browser'] })
    }
    
    async runVisualTests() {
        return this.runAllTests({ categories: ['visual'] })
    }
    
    // Continuous Integration helper
    async runCITests() {
        return this.runAllTests({
            categories: ['unit', 'integration'],
            coverage: true,
            parallel: true,
            verbose: false
        })
    }
    
    // Development helper
    async runDevTests() {
        return this.runAllTests({
            categories: ['unit'],
            coverage: false,
            parallel: false,
            verbose: true
        })
    }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const runner = new AudioTestRunner()
    const command = process.argv[2] || 'all'
    
    switch (command) {
        case 'unit':
            await runner.runUnitTests()
            break
        case 'integration':
            await runner.runIntegrationTests()
            break
        case 'performance':
            await runner.runPerformanceTests()
            break
        case 'cross-browser':
            await runner.runCrossBrowserTests()
            break
        case 'visual':
            await runner.runVisualTests()
            break
        case 'ci':
            await runner.runCITests()
            break
        case 'dev':
            await runner.runDevTests()
            break
        case 'all':
        default:
            await runner.runAllTests()
            break
    }
}

export { AudioTestRunner }