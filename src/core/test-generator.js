const config = require('../../config/test-config');
const { createAITest } = require('./test-runner');

class SmartTestGenerator {
  constructor() {
    this.generatedTests = [];
  }

  /**
   * Generate comprehensive test suite for a page
   */
  generatePageTests(pageConfig) {
    const tests = [];
    
    // Happy path test
    tests.push(this.generateHappyPathTest(pageConfig));
    
    // Responsive design tests
    Object.keys(config.viewports).forEach(viewport => {
      tests.push(this.generateResponsiveTest(pageConfig, viewport));
    });
    
    // Accessibility tests
    tests.push(this.generateAccessibilityTest(pageConfig));
    
    // Performance tests
    tests.push(this.generatePerformanceTest(pageConfig));
    
    // Edge case tests
    tests.push(...this.generateEdgeCaseTests(pageConfig));
    
    // Error state tests
    tests.push(...this.generateErrorStateTests(pageConfig));
    
    return tests;
  }

  /**
   * Generate happy path test for normal user flow
   */
  generateHappyPathTest(pageConfig) {
    return {
      name: `${pageConfig.name} - Happy Path`,
      type: 'happy-path',
      viewport: 'desktop',
      testFunction: async (page, runner) => {
        // Navigate to page
        await page.goto(pageConfig.path);
        await page.waitForLoadState('domcontentloaded');
        
        // Initial screenshot
        await page.aiCapture('page-loaded', 'general');
        
        // Wait for any animations/loading
        await page.waitForTimeout(2000);
        
        // Final state screenshot
        await page.aiCapture('final-state', 'general');
        
        // Basic assertions
        await page.locator('body').isVisible();
        
        // Check for console errors
        const errors = await page.evaluate(() => 
          window.console.errors?.length || 0
        );
        
        if (errors > 0) {
          console.warn(`${pageConfig.name} has ${errors} console errors`);
        }
      }
    };
  }

  /**
   * Generate responsive design tests for different viewports
   */
  generateResponsiveTest(pageConfig, viewport) {
    return {
      name: `${pageConfig.name} - ${viewport.charAt(0).toUpperCase() + viewport.slice(1)} View`,
      type: 'responsive',
      viewport: viewport,
      testFunction: async (page, runner) => {
        // Set viewport
        const viewportConfig = config.viewports[viewport];
        await page.setViewportSize(viewportConfig);
        
        // Navigate to page
        await page.goto(pageConfig.path);
        await page.waitForLoadState('domcontentloaded');
        
        // Screenshot for responsive analysis
        await page.aiCapture(`${viewport}-view`, 'mobile');
        
        // Test mobile-specific interactions if mobile
        if (viewport === 'mobile') {
          await this.testMobileInteractions(page);
        }
        
        // Check for horizontal scrollbars (bad responsive design)
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        
        if (hasHorizontalScroll) {
          console.warn(`${pageConfig.name} has horizontal scroll on ${viewport}`);
        }
      }
    };
  }

  /**
   * Generate accessibility-focused tests
   */
  generateAccessibilityTest(pageConfig) {
    return {
      name: `${pageConfig.name} - Accessibility`,
      type: 'accessibility',
      viewport: 'desktop',
      testFunction: async (page, runner) => {
        await page.goto(pageConfig.path);
        await page.waitForLoadState('domcontentloaded');
        
        // Screenshot for accessibility analysis
        await page.aiCapture('accessibility-check', 'accessibility');
        
        // Keyboard navigation test
        await this.testKeyboardNavigation(page);
        
        // Focus indicators test
        await this.testFocusIndicators(page);
        
        // Screen reader content test
        await this.testScreenReaderContent(page);
      }
    };
  }

  /**
   * Generate performance tests
   */
  generatePerformanceTest(pageConfig) {
    return {
      name: `${pageConfig.name} - Performance`,
      type: 'performance',
      viewport: 'desktop',
      testFunction: async (page, runner) => {
        // Start performance monitoring
        await page.goto(pageConfig.path);
        
        // Wait for page to fully load
        await page.waitForLoadState('networkidle');
        
        // Capture performance metrics
        const metrics = await page.evaluate(() => {
          const perf = performance;
          const navigation = perf.getEntriesByType('navigation')[0];
          const paint = perf.getEntriesByType('paint');
          
          return {
            loadTime: navigation?.loadEventEnd - navigation?.loadEventStart,
            domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
            firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
            firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
            resourceCount: perf.getEntriesByType('resource').length
          };
        });
        
        // Take screenshot with performance overlay
        await page.aiCapture('performance-loaded', 'general');
        
        // Check against performance budgets
        const budgets = config.analysis.performance.budgets;
        
        if (metrics.firstContentfulPaint > budgets.fcp) {
          console.warn(`${pageConfig.name} FCP: ${metrics.firstContentfulPaint}ms exceeds budget: ${budgets.fcp}ms`);
        }
        
        if (metrics.loadTime > budgets.lcp) {
          console.warn(`${pageConfig.name} Load Time: ${metrics.loadTime}ms exceeds budget: ${budgets.lcp}ms`);
        }
      }
    };
  }

  /**
   * Generate edge case tests
   */
  generateEdgeCaseTests(pageConfig) {
    const tests = [];
    
    // Very small viewport test
    tests.push({
      name: `${pageConfig.name} - Tiny Screen (320px)`,
      type: 'edge-case',
      viewport: 'custom',
      testFunction: async (page, runner) => {
        await page.setViewportSize({ width: 320, height: 568 });
        await page.goto(pageConfig.path);
        await page.waitForLoadState('domcontentloaded');
        await page.aiCapture('tiny-screen', 'mobile');
      }
    });
    
    // Large viewport test
    tests.push({
      name: `${pageConfig.name} - Large Screen (2560px)`,
      type: 'edge-case',
      viewport: 'custom',
      testFunction: async (page, runner) => {
        await page.setViewportSize({ width: 2560, height: 1440 });
        await page.goto(pageConfig.path);
        await page.waitForLoadState('domcontentloaded');
        await page.aiCapture('large-screen', 'general');
      }
    });
    
    // Slow connection simulation
    tests.push({
      name: `${pageConfig.name} - Slow Connection`,
      type: 'edge-case',
      viewport: 'mobile',
      testFunction: async (page, runner) => {
        // Simulate slow 3G
        await page.context().setOffline(false);
        await page.route('**/*', async route => {
          await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
          await route.continue();
        });
        
        await page.goto(pageConfig.path);
        await page.aiCapture('slow-connection', 'general');
      }
    });
    
    return tests;
  }

  /**
   * Generate error state tests
   */
  generateErrorStateTests(pageConfig) {
    const tests = [];
    
    // 404 error test (if applicable)
    if (pageConfig.path !== '/') {
      tests.push({
        name: `${pageConfig.name} - 404 Error`,
        type: 'error-state',
        viewport: 'desktop',
        testFunction: async (page, runner) => {
          await page.goto(pageConfig.path + '/nonexistent');
          await page.waitForLoadState('domcontentloaded');
          await page.aiCapture('404-error', 'general');
        }
      });
    }
    
    // JavaScript disabled test
    tests.push({
      name: `${pageConfig.name} - No JavaScript`,
      type: 'error-state',
      viewport: 'desktop',
      testFunction: async (page, runner) => {
        await page.context().addInitScript(() => {
          delete window.JavaScript;
        });
        await page.goto(pageConfig.path);
        await page.waitForLoadState('domcontentloaded');
        await page.aiCapture('no-javascript', 'general');
      }
    });
    
    return tests;
  }

  /**
   * Test mobile-specific interactions
   */
  async testMobileInteractions(page) {
    // Test touch targets
    const clickables = await page.locator('button, a, [role="button"]').all();
    
    for (const element of clickables.slice(0, 5)) { // Test first 5 elements
      const box = await element.boundingBox();
      if (box && (box.width < 44 || box.height < 44)) {
        console.warn('Small touch target detected:', await element.textContent());
      }
    }
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation(page) {
    // Tab through focusable elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    await page.keyboard.press('Tab');
    
    // Test escape key
    await page.keyboard.press('Escape');
  }

  /**
   * Test focus indicators
   */
  async testFocusIndicators(page) {
    // Focus on first button/link
    const firstFocusable = await page.locator('button, a, input, textarea, select').first();
    if (await firstFocusable.count() > 0) {
      await firstFocusable.focus();
      await page.waitForTimeout(500); // Allow focus styles to appear
    }
  }

  /**
   * Test screen reader content
   */
  async testScreenReaderContent(page) {
    // Check for proper heading structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const headingLevels = [];
    
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName);
      headingLevels.push(parseInt(tagName.charAt(1)));
    }
    
    // Check for proper heading hierarchy
    for (let i = 1; i < headingLevels.length; i++) {
      const current = headingLevels[i];
      const previous = headingLevels[i - 1];
      
      if (current > previous + 1) {
        console.warn('Heading hierarchy issue: jumping from h' + previous + ' to h' + current);
      }
    }
  }

  /**
   * Generate all tests for the project
   */
  generateAllTests() {
    const allTests = [];
    
    config.testPages.forEach(pageConfig => {
      const pageTests = this.generatePageTests(pageConfig);
      allTests.push(...pageTests);
    });
    
    return allTests;
  }

  /**
   * Convert generated tests to Playwright test files
   */
  async createTestFiles(outputDir = './ai-test-framework/tests') {
    const allTests = this.generateAllTests();
    const testsByPage = {};
    
    // Group tests by page
    allTests.forEach(test => {
      const pageName = test.name.split(' - ')[0];
      if (!testsByPage[pageName]) {
        testsByPage[pageName] = [];
      }
      testsByPage[pageName].push(test);
    });
    
    // Create test files
    const fs = require('fs').promises;
    await fs.mkdir(outputDir, { recursive: true });
    
    for (const [pageName, tests] of Object.entries(testsByPage)) {
      const fileName = pageName.toLowerCase().replace(/\s+/g, '-') + '.spec.js';
      const filePath = `${outputDir}/${fileName}`;
      
      const testFileContent = this.generateTestFileContent(pageName, tests);
      await fs.writeFile(filePath, testFileContent);
      
      console.log(`Generated test file: ${filePath}`);
    }
    
    return Object.keys(testsByPage).length;
  }

  /**
   * Generate test file content
   */
  generateTestFileContent(pageName, tests) {
    return `// Auto-generated tests for ${pageName}
// Generated on: ${new Date().toISOString()}

const { test, expect } = require('@playwright/test');
const { createAITest } = require('../src/core/test-runner');

${tests.map(testConfig => `
createAITest('${testConfig.name}', async (page, runner) => {
  ${this.stringifyTestFunction(testConfig.testFunction)}
});
`).join('\n')}
`;
  }

  /**
   * Convert test function to string (simplified)
   */
  stringifyTestFunction(testFunction) {
    return testFunction.toString()
      .replace(/async \(page, runner\) => \{/, '')
      .replace(/\}$/, '')
      .trim()
      .split('\n')
      .map(line => '  ' + line)
      .join('\n');
  }
}

module.exports = { SmartTestGenerator };