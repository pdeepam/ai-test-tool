const config = require('../../config/test-config');

class FixedTestGenerator {
  /**
   * Generate working test files with proper imports and variable scope
   */
  async createWorkingTestFiles(outputDir = './ai-test-framework/tests') {
    const fs = require('fs').promises;
    await fs.mkdir(outputDir, { recursive: true });

    for (const pageConfig of config.testPages) {
      const fileName = pageConfig.name.toLowerCase().replace(/\s+/g, '-') + '.spec.js';
      const filePath = `${outputDir}/${fileName}`;
      
      const testContent = this.generateWorkingTestFile(pageConfig);
      await fs.writeFile(filePath, testContent);
      
      console.log(`✅ Generated working test: ${filePath}`);
    }
    
    return config.testPages.length;
  }

  /**
   * Generate a working test file for a specific page
   */
  generateWorkingTestFile(pageConfig) {
    return `// AI-Enhanced Tests for ${pageConfig.name}
// Generated: ${new Date().toISOString()}

const { test, expect } = require('@playwright/test');
const config = require('../config/test-config');

// Test data
const PAGE_PATH = '${pageConfig.path}';
const PAGE_NAME = '${pageConfig.name}';

test.describe('${pageConfig.name} - AI Enhanced Tests', () => {

  test('Happy Path - Basic Functionality', async ({ page }) => {
    await page.goto(PAGE_PATH);
    await page.waitForLoadState('domcontentloaded');
    
    // Take screenshot for analysis
    await page.screenshot({ 
      path: \`./ai-test-framework/reports/screenshots/\${PAGE_NAME.toLowerCase().replace(/\\s+/g, '-')}-happy-path-\${Date.now()}.png\`,
      fullPage: true 
    });
    
    // Basic assertions
    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('Mobile Responsive Design', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize(config.viewports.mobile);
    await page.goto(PAGE_PATH);
    await page.waitForLoadState('domcontentloaded');
    
    // Mobile screenshot
    await page.screenshot({ 
      path: \`./ai-test-framework/reports/screenshots/\${PAGE_NAME.toLowerCase().replace(/\\s+/g, '-')}-mobile-\${Date.now()}.png\`,
      fullPage: true 
    });
    
    // Check for horizontal scroll (bad responsive design)
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    expect(hasHorizontalScroll).toBe(false);
  });

  test('Tablet Responsive Design', async ({ page }) => {
    await page.setViewportSize(config.viewports.tablet);
    await page.goto(PAGE_PATH);
    await page.waitForLoadState('domcontentloaded');
    
    await page.screenshot({ 
      path: \`./ai-test-framework/reports/screenshots/\${PAGE_NAME.toLowerCase().replace(/\\s+/g, '-')}-tablet-\${Date.now()}.png\`,
      fullPage: true 
    });
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('Desktop View', async ({ page }) => {
    await page.setViewportSize(config.viewports.desktop);
    await page.goto(PAGE_PATH);
    await page.waitForLoadState('domcontentloaded');
    
    await page.screenshot({ 
      path: \`./ai-test-framework/reports/screenshots/\${PAGE_NAME.toLowerCase().replace(/\\s+/g, '-')}-desktop-\${Date.now()}.png\`,
      fullPage: true 
    });
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('Accessibility Check', async ({ page }) => {
    await page.goto(PAGE_PATH);
    await page.waitForLoadState('domcontentloaded');
    
    // Screenshot for accessibility analysis
    await page.screenshot({ 
      path: \`./ai-test-framework/reports/screenshots/\${PAGE_NAME.toLowerCase().replace(/\\s+/g, '-')}-accessibility-\${Date.now()}.png\`,
      fullPage: true 
    });
    
    // Check for basic accessibility requirements
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);
    
    // Check for alt text on images
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    if (imagesWithoutAlt > 0) {
      console.warn(\`\${PAGE_NAME}: \${imagesWithoutAlt} images missing alt text\`);
    }
  });

  test('Performance Check', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(PAGE_PATH);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Performance screenshot
    await page.screenshot({ 
      path: \`./ai-test-framework/reports/screenshots/\${PAGE_NAME.toLowerCase().replace(/\\s+/g, '-')}-performance-\${Date.now()}.png\`,
      fullPage: true 
    });
    
    // Check performance metrics
    const metrics = await page.evaluate(() => {
      const perf = performance;
      const navigation = perf.getEntriesByType('navigation')[0];
      const paint = perf.getEntriesByType('paint');
      
      return {
        loadTime: navigation?.loadEventEnd - navigation?.loadEventStart || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        resourceCount: perf.getEntriesByType('resource').length
      };
    });
    
    console.log(\`\${PAGE_NAME} Performance:\`, metrics);
    
    // Performance budget checks
    if (metrics.firstContentfulPaint > config.analysis.performance.budgets.fcp) {
      console.warn(\`\${PAGE_NAME} FCP: \${metrics.firstContentfulPaint}ms exceeds budget\`);
    }
  });

  test('Edge Case - Tiny Screen (320px)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(PAGE_PATH);
    await page.waitForLoadState('domcontentloaded');
    
    await page.screenshot({ 
      path: \`./ai-test-framework/reports/screenshots/\${PAGE_NAME.toLowerCase().replace(/\\s+/g, '-')}-tiny-screen-\${Date.now()}.png\`,
      fullPage: true 
    });
    
    // Check that content is still accessible
    await expect(page.locator('body')).toBeVisible();
  });

  test('Edge Case - Large Screen (2560px)', async ({ page }) => {
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.goto(PAGE_PATH);
    await page.waitForLoadState('domcontentloaded');
    
    await page.screenshot({ 
      path: \`./ai-test-framework/reports/screenshots/\${PAGE_NAME.toLowerCase().replace(/\\s+/g, '-')}-large-screen-\${Date.now()}.png\`,
      fullPage: true 
    });
    
    await expect(page.locator('body')).toBeVisible();
  });

});
`;
  }
}

module.exports = { FixedTestGenerator };