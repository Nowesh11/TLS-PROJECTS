/**
 * Browser Testing Utility
 * Comprehensive testing suite for cross-browser compatibility
 */

class BrowserTesting {
    constructor() {
        this.testResults = [];
        this.browserInfo = window.browserCompatibility ? window.browserCompatibility.browserInfo : null;
    }

    /**
     * Run comprehensive browser compatibility tests
     */
    async runAllTests() {
        console.log('Starting comprehensive browser compatibility tests...');
        
        const tests = [
            this.testDOMManipulation(),
            this.testEventHandling(),
            this.testAjaxRequests(),
            this.testLocalStorage(),
            this.testCSSFeatures(),
            this.testJavaScriptFeatures(),
            this.testFormHandling(),
            this.testMediaQueries(),
            this.testAnimations(),
            this.testWebAPIs()
        ];

        try {
            const results = await Promise.all(tests);
            this.testResults = results.flat();
            return this.generateReport();
        } catch (error) {
            console.error('Error running browser tests:', error);
            return { error: error.message, results: this.testResults };
        }
    }

    /**
     * Test DOM manipulation capabilities
     */
    testDOMManipulation() {
        return new Promise((resolve) => {
            const results = [];
            
            try {
                // Test element creation
                const testDiv = document.createElement('div');
                testDiv.id = 'browser-test-element';
                testDiv.style.display = 'none';
                document.body.appendChild(testDiv);
                
                results.push({
                    test: 'DOM Element Creation',
                    passed: testDiv.id === 'browser-test-element',
                    category: 'DOM'
                });

                // Test querySelector
                const foundElement = document.querySelector('#browser-test-element');
                results.push({
                    test: 'querySelector Support',
                    passed: foundElement !== null,
                    category: 'DOM'
                });

                // Test classList
                testDiv.classList.add('test-class');
                results.push({
                    test: 'classList Support',
                    passed: testDiv.classList.contains('test-class'),
                    category: 'DOM'
                });

                // Test dataset
                testDiv.dataset.testValue = 'test';
                results.push({
                    test: 'dataset Support',
                    passed: testDiv.dataset.testValue === 'test',
                    category: 'DOM'
                });

                // Cleanup
                document.body.removeChild(testDiv);
                
            } catch (error) {
                results.push({
                    test: 'DOM Manipulation',
                    passed: false,
                    error: error.message,
                    category: 'DOM'
                });
            }
            
            resolve(results);
        });
    }

    /**
     * Test event handling capabilities
     */
    testEventHandling() {
        return new Promise((resolve) => {
            const results = [];
            
            try {
                const testButton = document.createElement('button');
                testButton.style.display = 'none';
                document.body.appendChild(testButton);
                
                let eventFired = false;
                
                // Test addEventListener
                const testHandler = () => { eventFired = true; };
                testButton.addEventListener('click', testHandler);
                
                // Simulate click
                const clickEvent = new Event('click');
                testButton.dispatchEvent(clickEvent);
                
                results.push({
                    test: 'addEventListener Support',
                    passed: eventFired,
                    category: 'Events'
                });

                // Test removeEventListener
                testButton.removeEventListener('click', testHandler);
                eventFired = false;
                testButton.dispatchEvent(clickEvent);
                
                results.push({
                    test: 'removeEventListener Support',
                    passed: !eventFired,
                    category: 'Events'
                });

                // Test CustomEvent
                let customEventFired = false;
                const customHandler = () => { customEventFired = true; };
                testButton.addEventListener('customTest', customHandler);
                
                const customEvent = new CustomEvent('customTest', { detail: { test: true } });
                testButton.dispatchEvent(customEvent);
                
                results.push({
                    test: 'CustomEvent Support',
                    passed: customEventFired,
                    category: 'Events'
                });

                document.body.removeChild(testButton);
                
            } catch (error) {
                results.push({
                    test: 'Event Handling',
                    passed: false,
                    error: error.message,
                    category: 'Events'
                });
            }
            
            resolve(results);
        });
    }

    /**
     * Test AJAX and fetch capabilities
     */
    testAjaxRequests() {
        return new Promise((resolve) => {
            const results = [];
            
            // Test XMLHttpRequest
            try {
                const xhr = new XMLHttpRequest();
                results.push({
                    test: 'XMLHttpRequest Support',
                    passed: typeof xhr === 'object',
                    category: 'AJAX'
                });
            } catch (error) {
                results.push({
                    test: 'XMLHttpRequest Support',
                    passed: false,
                    error: error.message,
                    category: 'AJAX'
                });
            }

            // Test fetch API
            results.push({
                test: 'Fetch API Support',
                passed: typeof window.fetch === 'function',
                category: 'AJAX'
            });

            // Test Promise support
            results.push({
                test: 'Promise Support',
                passed: typeof Promise === 'function',
                category: 'AJAX'
            });
            
            resolve(results);
        });
    }

    /**
     * Test localStorage capabilities
     */
    testLocalStorage() {
        return new Promise((resolve) => {
            const results = [];
            
            try {
                // Test localStorage availability
                results.push({
                    test: 'localStorage Availability',
                    passed: typeof Storage !== 'undefined' && window.localStorage,
                    category: 'Storage'
                });

                if (window.localStorage) {
                    // Test setItem/getItem
                    localStorage.setItem('browserTest', 'testValue');
                    const retrieved = localStorage.getItem('browserTest');
                    
                    results.push({
                        test: 'localStorage Set/Get',
                        passed: retrieved === 'testValue',
                        category: 'Storage'
                    });

                    // Test removeItem
                    localStorage.removeItem('browserTest');
                    const removed = localStorage.getItem('browserTest');
                    
                    results.push({
                        test: 'localStorage Remove',
                        passed: removed === null,
                        category: 'Storage'
                    });
                }
                
            } catch (error) {
                results.push({
                    test: 'localStorage Support',
                    passed: false,
                    error: error.message,
                    category: 'Storage'
                });
            }
            
            resolve(results);
        });
    }

    /**
     * Test CSS features
     */
    testCSSFeatures() {
        return new Promise((resolve) => {
            const results = [];
            
            try {
                const testElement = document.createElement('div');
                testElement.style.display = 'none';
                document.body.appendChild(testElement);

                // Test Flexbox
                testElement.style.display = 'flex';
                results.push({
                    test: 'Flexbox Support',
                    passed: testElement.style.display === 'flex',
                    category: 'CSS'
                });

                // Test Grid
                testElement.style.display = 'grid';
                results.push({
                    test: 'CSS Grid Support',
                    passed: testElement.style.display === 'grid',
                    category: 'CSS'
                });

                // Test CSS Custom Properties
                testElement.style.setProperty('--test-var', 'test');
                const customPropSupport = window.CSS && CSS.supports && CSS.supports('color', 'var(--test)');
                results.push({
                    test: 'CSS Custom Properties',
                    passed: customPropSupport,
                    category: 'CSS'
                });

                // Test Transform
                testElement.style.transform = 'translateX(10px)';
                results.push({
                    test: 'CSS Transform Support',
                    passed: testElement.style.transform.includes('translateX'),
                    category: 'CSS'
                });

                document.body.removeChild(testElement);
                
            } catch (error) {
                results.push({
                    test: 'CSS Features',
                    passed: false,
                    error: error.message,
                    category: 'CSS'
                });
            }
            
            resolve(results);
        });
    }

    /**
     * Test JavaScript features
     */
    testJavaScriptFeatures() {
        return new Promise((resolve) => {
            const results = [];
            
            // Test ES6 features
            results.push({
                test: 'Arrow Functions',
                passed: (() => true)(),
                category: 'JavaScript'
            });

            // Test const/let
            try {
                const testConst = 'test';
                let testLet = 'test';
                results.push({
                    test: 'const/let Support',
                    passed: testConst === 'test' && testLet === 'test',
                    category: 'JavaScript'
                });
            } catch (error) {
                results.push({
                    test: 'const/let Support',
                    passed: false,
                    category: 'JavaScript'
                });
            }

            // Test Array methods
            const testArray = [1, 2, 3];
            results.push({
                test: 'Array.includes',
                passed: typeof testArray.includes === 'function' && testArray.includes(2),
                category: 'JavaScript'
            });

            results.push({
                test: 'Array.from',
                passed: typeof Array.from === 'function',
                category: 'JavaScript'
            });

            // Test Object.assign
            results.push({
                test: 'Object.assign',
                passed: typeof Object.assign === 'function',
                category: 'JavaScript'
            });
            
            resolve(results);
        });
    }

    /**
     * Test form handling
     */
    testFormHandling() {
        return new Promise((resolve) => {
            const results = [];
            
            try {
                const form = document.createElement('form');
                const input = document.createElement('input');
                input.type = 'text';
                input.name = 'test';
                form.appendChild(input);
                form.style.display = 'none';
                document.body.appendChild(form);

                // Test FormData
                input.value = 'testValue';
                const formData = new FormData(form);
                
                results.push({
                    test: 'FormData Support',
                    passed: formData.get('test') === 'testValue',
                    category: 'Forms'
                });

                // Test form validation
                input.required = true;
                input.value = '';
                
                results.push({
                    test: 'HTML5 Validation',
                    passed: !form.checkValidity(),
                    category: 'Forms'
                });

                document.body.removeChild(form);
                
            } catch (error) {
                results.push({
                    test: 'Form Handling',
                    passed: false,
                    error: error.message,
                    category: 'Forms'
                });
            }
            
            resolve(results);
        });
    }

    /**
     * Test media queries
     */
    testMediaQueries() {
        return new Promise((resolve) => {
            const results = [];
            
            try {
                // Test matchMedia
                results.push({
                    test: 'matchMedia Support',
                    passed: typeof window.matchMedia === 'function',
                    category: 'Media'
                });

                if (window.matchMedia) {
                    const mediaQuery = window.matchMedia('(min-width: 768px)');
                    results.push({
                        test: 'Media Query Execution',
                        passed: typeof mediaQuery.matches === 'boolean',
                        category: 'Media'
                    });
                }
                
            } catch (error) {
                results.push({
                    test: 'Media Queries',
                    passed: false,
                    error: error.message,
                    category: 'Media'
                });
            }
            
            resolve(results);
        });
    }

    /**
     * Test CSS animations
     */
    testAnimations() {
        return new Promise((resolve) => {
            const results = [];
            
            try {
                const testElement = document.createElement('div');
                testElement.style.display = 'none';
                document.body.appendChild(testElement);

                // Test CSS transitions
                testElement.style.transition = 'opacity 0.3s';
                results.push({
                    test: 'CSS Transitions',
                    passed: testElement.style.transition.includes('opacity'),
                    category: 'Animations'
                });

                // Test CSS animations
                testElement.style.animation = 'fadeIn 1s';
                results.push({
                    test: 'CSS Animations',
                    passed: testElement.style.animation.includes('fadeIn'),
                    category: 'Animations'
                });

                document.body.removeChild(testElement);
                
            } catch (error) {
                results.push({
                    test: 'CSS Animations',
                    passed: false,
                    error: error.message,
                    category: 'Animations'
                });
            }
            
            resolve(results);
        });
    }

    /**
     * Test Web APIs
     */
    testWebAPIs() {
        return new Promise((resolve) => {
            const results = [];
            
            // Test various Web APIs
            const apis = {
                'Geolocation API': 'geolocation' in navigator,
                'Web Workers': typeof Worker !== 'undefined',
                'Service Workers': 'serviceWorker' in navigator,
                'Intersection Observer': 'IntersectionObserver' in window,
                'Mutation Observer': 'MutationObserver' in window,
                'Resize Observer': 'ResizeObserver' in window,
                'Web Audio API': 'AudioContext' in window || 'webkitAudioContext' in window,
                'WebGL': this.testWebGL(),
                'Canvas': this.testCanvas(),
                'History API': 'pushState' in history
            };

            Object.entries(apis).forEach(([name, supported]) => {
                results.push({
                    test: name,
                    passed: supported,
                    category: 'Web APIs'
                });
            });
            
            resolve(results);
        });
    }

    /**
     * Test WebGL support
     */
    testWebGL() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) {
            return false;
        }
    }

    /**
     * Test Canvas support
     */
    testCanvas() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext && canvas.getContext('2d'));
        } catch (e) {
            return false;
        }
    }

    /**
     * Generate comprehensive test report
     */
    generateReport() {
        const categories = {};
        let totalTests = 0;
        let passedTests = 0;

        this.testResults.forEach(result => {
            if (!categories[result.category]) {
                categories[result.category] = { passed: 0, total: 0, tests: [] };
            }
            
            categories[result.category].total++;
            categories[result.category].tests.push(result);
            totalTests++;
            
            if (result.passed) {
                categories[result.category].passed++;
                passedTests++;
            }
        });

        const overallScore = Math.round((passedTests / totalTests) * 100);
        
        return {
            browser: this.browserInfo,
            overallScore,
            totalTests,
            passedTests,
            failedTests: totalTests - passedTests,
            categories,
            recommendations: this.generateRecommendations(categories),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Generate recommendations based on test results
     */
    generateRecommendations(categories) {
        const recommendations = [];
        
        Object.entries(categories).forEach(([category, data]) => {
            const failureRate = ((data.total - data.passed) / data.total) * 100;
            
            if (failureRate > 50) {
                recommendations.push(`${category}: High failure rate (${Math.round(failureRate)}%). Consider using polyfills or alternative approaches.`);
            } else if (failureRate > 25) {
                recommendations.push(`${category}: Moderate failure rate (${Math.round(failureRate)}%). Some features may need fallbacks.`);
            }
        });
        
        return recommendations;
    }

    /**
     * Display test results in console
     */
    displayResults(report) {
        console.group('🔍 Browser Compatibility Test Results');
        console.log(`Browser: ${report.browser?.browser} ${report.browser?.version}`);
        console.log(`Overall Score: ${report.overallScore}% (${report.passedTests}/${report.totalTests} tests passed)`);
        
        Object.entries(report.categories).forEach(([category, data]) => {
            const score = Math.round((data.passed / data.total) * 100);
            console.group(`${category}: ${score}% (${data.passed}/${data.total})`);
            
            data.tests.forEach(test => {
                const icon = test.passed ? '✅' : '❌';
                console.log(`${icon} ${test.test}${test.error ? ` - ${test.error}` : ''}`);
            });
            
            console.groupEnd();
        });
        
        if (report.recommendations.length > 0) {
            console.group('📋 Recommendations');
            report.recommendations.forEach(rec => console.log(`• ${rec}`));
            console.groupEnd();
        }
        
        console.groupEnd();
    }

    /**
     * Run tests and display results
     */
    async runAndDisplay() {
        const report = await this.runAllTests();
        this.displayResults(report);
        return report;
    }
}

// Auto-initialize and expose globally
if (typeof window !== 'undefined') {
    window.BrowserTesting = BrowserTesting;
    
    // Run tests automatically in development mode
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                const tester = new BrowserTesting();
                tester.runAndDisplay();
            }, 1000);
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrowserTesting;
}