const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs').promises;
const config = require('../../config/test-config');

class AIEnhancedTestRunner {
  constructor() {
    this.testResults = [];
    this.screenshots = [];
    this.metrics = [];
    this.currentTest = null;
  }

  /**
   * Initialize test session with metadata
   */
  async initializeTest(testName, page) {
    this.currentTest = {
      name: testName,
      startTime: Date.now(),
      url: page.url(),
      viewport: await page.viewportSize(),
      screenshots: [],
      metrics: {},
      issues: [],
      status: 'running'
    };

    // Set up performance monitoring
    await this.setupPerformanceMonitoring(page);
    
    // Set up console and error logging
    await this.setupErrorLogging(page);

    return this.currentTest;
  }

  /**
   * Capture screenshot with metadata for Claude analysis
   */
  async captureForAnalysis(page, checkpointName, analysisType = 'general') {
    const timestamp = Date.now();
    const screenshotPath = path.join(
      config.reporting.outputDir,
      'screenshots',
      `${this.currentTest.name}-${checkpointName}-${timestamp}.png`
    );

    // Ensure directory exists
    await fs.mkdir(path.dirname(screenshotPath), { recursive: true });

    // Capture full page screenshot
    await page.screenshot({ 
      path: screenshotPath, 
      fullPage: config.reporting.fullPageScreenshots 
    });

    // Collect page state data
    const pageState = await this.collectPageState(page);

    const screenshot = {
      name: checkpointName,
      path: screenshotPath,
      timestamp,
      analysisType,
      viewport: await page.viewportSize(),
      url: page.url(),
      pageState,
      readyForAnalysis: true
    };

    this.currentTest.screenshots.push(screenshot);
    this.screenshots.push(screenshot);

    return screenshot;
  }

  /**
   * Collect comprehensive page state data
   */
  async collectPageState(page) {
    const state = {};

    try {
      // Performance metrics
      state.performance = await page.evaluate(() => {
        const perf = performance;
        const navigation = perf.getEntriesByType('navigation')[0];
        const paint = perf.getEntriesByType('paint');
        
        return {
          loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
          domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
          firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
          memoryUsage: performance.memory ? {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
          } : null
        };
      });

      // Accessibility tree
      state.accessibilityTree = await page.accessibility.snapshot();

      // Element count and basic stats
      state.elementStats = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const buttons = document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]');
        const links = document.querySelectorAll('a[href]');
        const images = document.querySelectorAll('img');
        const inputs = document.querySelectorAll('input, textarea, select');

        return {
          totalElements: elements.length,
          buttons: buttons.length,
          links: links.length,
          images: images.length,
          inputs: inputs.length,
          hasH1: !!document.querySelector('h1'),
          hasSkipLink: !!document.querySelector('[href="#main"], [href="#content"]'),
          hasLandmarks: document.querySelectorAll('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]').length
        };
      });

      // Check for common issues
      state.quickChecks = await this.runQuickChecks(page);

    } catch (error) {
      state.error = error.message;
    }

    return state;
  }

  /**
   * Run quick automated checks for common issues
   */
  async runQuickChecks(page) {
    const checks = {};

    try {
      // Small touch targets
      checks.smallTouchTargets = await page.evaluate((minSize) => {
        const clickables = document.querySelectorAll('button, a, [role="button"], [onclick], input[type="button"], input[type="submit"]');
        const small = [];
        
        clickables.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && (rect.width < minSize || rect.height < minSize)) {
            small.push({
              tagName: el.tagName,
              text: el.textContent?.trim().substring(0, 50),
              width: rect.width,
              height: rect.height
            });
          }
        });
        
        return small;
      }, config.analysis.usability.minTouchTarget);

      // Missing alt text
      checks.missingAltText = await page.evaluate(() => {
        const images = document.querySelectorAll('img');
        const missing = [];
        
        images.forEach(img => {
          if (!img.alt && !img.getAttribute('aria-label') && !img.getAttribute('aria-labelledby')) {
            missing.push({
              src: img.src,
              width: img.width,
              height: img.height
            });
          }
        });
        
        return missing;
      });

      // Form labels
      checks.unlabeledInputs = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
        const unlabeled = [];
        
        inputs.forEach(input => {
          const hasLabel = input.labels?.length > 0 || 
                          input.getAttribute('aria-label') || 
                          input.getAttribute('aria-labelledby') ||
                          input.getAttribute('placeholder');
          
          if (!hasLabel) {
            unlabeled.push({
              type: input.type || input.tagName,
              id: input.id,
              name: input.name
            });
          }
        });
        
        return unlabeled;
      });

      // Console errors
      checks.consoleErrors = this.currentTest.consoleErrors || [];

    } catch (error) {
      checks.error = error.message;
    }

    return checks;
  }

  /**
   * Set up performance monitoring
   */
  async setupPerformanceMonitoring(page) {
    // Monitor network requests
    page.on('request', request => {
      if (!this.currentTest.networkRequests) this.currentTest.networkRequests = [];
      this.currentTest.networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now()
      });
    });

    // Monitor responses
    page.on('response', response => {
      if (!this.currentTest.networkResponses) this.currentTest.networkResponses = [];
      this.currentTest.networkResponses.push({
        url: response.url(),
        status: response.status(),
        contentType: response.headers()['content-type'],
        timestamp: Date.now()
      });
    });
  }

  /**
   * Set up error and console logging
   */
  async setupErrorLogging(page) {
    this.currentTest.consoleErrors = [];
    this.currentTest.pageErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        this.currentTest.consoleErrors.push({
          text: msg.text(),
          location: msg.location(),
          timestamp: Date.now()
        });
      }
    });

    page.on('pageerror', error => {
      this.currentTest.pageErrors.push({
        message: error.message,
        stack: error.stack,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Finalize test and prepare for analysis
   */
  async finalizeTest() {
    if (!this.currentTest) return null;

    this.currentTest.endTime = Date.now();
    this.currentTest.duration = this.currentTest.endTime - this.currentTest.startTime;
    this.currentTest.status = 'completed';

    this.testResults.push(this.currentTest);
    const result = this.currentTest;
    this.currentTest = null;

    return result;
  }

  /**
   * Get all screenshots ready for Claude analysis
   */
  getScreenshotsForAnalysis() {
    return this.screenshots.filter(screenshot => screenshot.readyForAnalysis);
  }

  /**
   * Generate test summary for reporting
   */
  generateSummary() {
    return {
      totalTests: this.testResults.length,
      totalScreenshots: this.screenshots.length,
      testsWithErrors: this.testResults.filter(t => 
        t.consoleErrors?.length > 0 || t.pageErrors?.length > 0
      ).length,
      averageTestDuration: this.testResults.reduce((sum, t) => sum + t.duration, 0) / this.testResults.length,
      screenshotsReadyForAnalysis: this.getScreenshotsForAnalysis().length
    };
  }
}

// Export for use in tests
module.exports = { AIEnhancedTestRunner };

// Playwright test helper function
function createAITest(testName, testFunction) {
  test(testName, async ({ page }) => {
    const runner = new AIEnhancedTestRunner();
    await runner.initializeTest(testName, page);
    
    // Add helper methods to page object
    page.aiCapture = (checkpointName, analysisType) => 
      runner.captureForAnalysis(page, checkpointName, analysisType);
    
    page.aiFinalize = () => runner.finalizeTest();
    
    try {
      await testFunction(page, runner);
    } finally {
      await runner.finalizeTest();
    }
  });
}

module.exports.createAITest = createAITest;