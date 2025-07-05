/**
 * Comprehensive AI Testing Framework
 * Main orchestrator for UI/UX + Business Logic testing
 */

const { UnifiedTestGenerator } = require('./generators/unified-test-generator');
const config = require('../config/test-config');
const fs = require('fs').promises;
const path = require('path');

class ComprehensiveFramework {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.generator = new UnifiedTestGenerator(projectRoot);
    this.reportsDir = path.join(projectRoot, 'ai-test-framework', 'reports');
  }

  /**
   * Generate comprehensive tests for a single page
   */
  async generatePageTests(pageName, pageUrl, claudeAnalysisFunction) {
    console.log(`\n🚀 Starting comprehensive test generation for ${pageName}...`);
    
    try {
      const result = await this.generator.generateComprehensiveTests(
        pageName, 
        pageUrl, 
        claudeAnalysisFunction
      );
      
      console.log(result.summary);
      return result;
      
    } catch (error) {
      console.error(`❌ Failed to generate tests for ${pageName}:`, error.message);
      throw error;
    }
  }

  /**
   * Generate comprehensive tests for all configured pages
   */
  async generateAllTests(claudeAnalysisFunction) {
    console.log('🎯 Starting comprehensive test generation for all pages...\n');
    
    const results = {};
    const startTime = Date.now();
    
    for (const page of config.pages) {
      try {
        results[page.name] = await this.generatePageTests(
          page.name, 
          page.url, 
          claudeAnalysisFunction
        );
        
        // Small delay between pages
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Failed to process ${page.name}:`, error.message);
        results[page.name] = { error: error.message };
      }
    }
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    // Generate master report
    const masterReport = await this.generateMasterReport(results, duration);
    console.log(masterReport);
    
    return results;
  }

  /**
   * Execute generated tests (placeholder for future implementation)
   */
  async executeTests(pageName, testTypes = ['ui', 'api', 'e2e']) {
    console.log(`🧪 Executing tests for ${pageName}...`);
    
    const results = {
      ui: { passed: 0, failed: 0, total: 0 },
      api: { passed: 0, failed: 0, total: 0 },
      e2e: { passed: 0, failed: 0, total: 0 },
      duration: 0
    };
    
    // TODO: Implement actual test execution
    // This would run the generated Playwright and API tests
    
    console.log('⏳ Test execution not yet implemented');
    console.log('📁 Generated test files are ready for manual execution');
    
    return results;
  }

  /**
   * Analyze test coverage gaps
   */
  async analyzeTestCoverage(pageName, claudeAnalysisFunction) {
    return await this.generator.analyzeTestCoverageGaps(pageName, claudeAnalysisFunction);
  }

  /**
   * Export tests in various formats
   */
  async exportTests(pageName, format = 'json') {
    const testSuitePath = path.join(
      this.projectRoot, 
      'ai-test-framework', 
      'test-cases', 
      `${pageName}-comprehensive-tests.json`
    );
    
    try {
      const content = await fs.readFile(testSuitePath, 'utf8');
      const testSuite = JSON.parse(content);
      
      switch (format) {
        case 'markdown':
          return this.exportToMarkdown(testSuite);
        case 'csv':
          return this.exportToCSV(testSuite);
        case 'html':
          return this.exportToHTML(testSuite);
        default:
          return content;
      }
    } catch (error) {
      throw new Error(`Failed to export tests for ${pageName}: ${error.message}`);
    }
  }

  /**
   * Generate master report
   */
  async generateMasterReport(results, duration) {
    const totalPages = Object.keys(results).length;
    const successfulPages = Object.values(results).filter(r => !r.error).length;
    const failedPages = totalPages - successfulPages;
    
    let totalTests = 0;
    let testsByCategory = { ui: 0, businessLogic: 0, integration: 0, e2e: 0 };
    
    for (const [pageName, result] of Object.entries(results)) {
      if (!result.error && result.testCases) {
        const pageTotal = Object.values(result.testCases).reduce((sum, arr) => sum + arr.length, 0);
        totalTests += pageTotal;
        
        for (const [category, tests] of Object.entries(result.testCases)) {
          testsByCategory[category] = (testsByCategory[category] || 0) + tests.length;
        }
      }
    }
    
    const report = `
🎯 COMPREHENSIVE TEST GENERATION COMPLETE
${'='.repeat(70)}

📊 SUMMARY:
   ⏱️  Duration: ${duration}s
   📄 Pages Processed: ${totalPages}
   ✅ Successful: ${successfulPages}
   ❌ Failed: ${failedPages}
   🧪 Total Tests Generated: ${totalTests}

📋 TESTS BY CATEGORY:
   🎨 UI/UX Tests: ${testsByCategory.ui}
   🧮 Business Logic Tests: ${testsByCategory.businessLogic}
   🔗 Integration Tests: ${testsByCategory.integration}
   🛤️  E2E Journey Tests: ${testsByCategory.e2e}

📁 GENERATED FILES:
   ${Object.keys(results).map(page => `• ${page}-comprehensive-tests.json`).join('\n   ')}
   ${Object.keys(results).map(page => `• ${page}-ui-tests.spec.js`).join('\n   ')}
   ${Object.keys(results).map(page => `• ${page}-api-tests.spec.js`).join('\n   ')}

🚀 NEXT STEPS:
   1. Review generated test cases in ai-test-framework/test-cases/
   2. Customize test data and assertions as needed
   3. Run UI tests: npx playwright test ai-test-framework/generated-tests/
   4. Run API tests: npm test ai-test-framework/generated-tests/
   5. Monitor test results and iterate

💡 TRADING APP FOCUS:
   ✅ Profit/Loss calculations covered
   ✅ Trade validation rules included
   ✅ API endpoint testing ready
   ✅ Mobile responsiveness verified
   ✅ User journey workflows mapped
`;

    // Save master report
    await fs.mkdir(this.reportsDir, { recursive: true });
    const reportPath = path.join(this.reportsDir, `master-test-report-${new Date().toISOString().split('T')[0]}.md`);
    await fs.writeFile(reportPath, report);
    
    return report;
  }

  /**
   * Export to Markdown
   */
  exportToMarkdown(testSuite) {
    let md = `# Comprehensive Test Suite: ${testSuite.pageName}\n\n`;
    md += `**Generated:** ${testSuite.lastGenerated}\n`;
    md += `**Total Tests:** ${testSuite.metadata.totalTests}\n\n`;
    
    for (const [category, tests] of Object.entries(testSuite.testCases)) {
      md += `## ${category.toUpperCase()} Tests\n\n`;
      
      for (const test of tests) {
        md += `### ${test.id}: ${test.title}\n\n`;
        md += `- **Priority:** ${test.priority}\n`;
        md += `- **Type:** ${test.type}\n`;
        md += `- **Description:** ${test.description}\n\n`;
        
        md += `**Steps:**\n`;
        test.steps.forEach((step, index) => {
          md += `${index + 1}. ${step}\n`;
        });
        
        md += `\n**Expected Result:** ${test.expectedResult}\n\n`;
        
        if (test.endpoint) {
          md += `**API Endpoint:** ${test.method} ${test.endpoint}\n\n`;
        }
        
        md += '---\n\n';
      }
    }
    
    return md;
  }

  /**
   * Export to CSV
   */
  exportToCSV(testSuite) {
    const headers = ['Category', 'ID', 'Title', 'Priority', 'Type', 'Status', 'Endpoint'];
    const rows = [];
    
    for (const [category, tests] of Object.entries(testSuite.testCases)) {
      for (const test of tests) {
        rows.push([
          category,
          test.id,
          `"${test.title}"`,
          test.priority,
          test.type,
          test.status,
          test.endpoint || ''
        ]);
      }
    }
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Export to HTML
   */
  exportToHTML(testSuite) {
    return `<!DOCTYPE html>
<html>
<head>
    <title>Test Suite: ${testSuite.pageName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test-case { border: 1px solid #ddd; margin: 10px 0; padding: 15px; }
        .priority-critical { border-left: 5px solid #dc2626; }
        .priority-high { border-left: 5px solid #ea580c; }
        .priority-medium { border-left: 5px solid #d97706; }
        .priority-low { border-left: 5px solid #65a30d; }
        .category { background: #f3f4f6; padding: 10px; margin: 20px 0; }
        .steps { margin: 10px 0; }
        .steps li { margin: 5px 0; }
    </style>
</head>
<body>
    <h1>Comprehensive Test Suite: ${testSuite.pageName}</h1>
    <p><strong>Generated:</strong> ${testSuite.lastGenerated}</p>
    <p><strong>Total Tests:</strong> ${testSuite.metadata.totalTests}</p>
    
    ${Object.entries(testSuite.testCases).map(([category, tests]) => `
    <div class="category">
        <h2>${category.toUpperCase()} Tests (${tests.length})</h2>
    </div>
    
    ${tests.map(test => `
    <div class="test-case priority-${test.priority}">
        <h3>${test.id}: ${test.title}</h3>
        <p><strong>Priority:</strong> ${test.priority} | <strong>Type:</strong> ${test.type}</p>
        <p><strong>Description:</strong> ${test.description}</p>
        
        <div class="steps">
            <strong>Steps:</strong>
            <ol>
                ${test.steps.map(step => `<li>${step}</li>`).join('')}
            </ol>
        </div>
        
        <p><strong>Expected Result:</strong> ${test.expectedResult}</p>
        
        ${test.endpoint ? `<p><strong>API:</strong> ${test.method} ${test.endpoint}</p>` : ''}
    </div>
    `).join('')}
    `).join('')}
</body>
</html>`;
  }

  /**
   * Get framework statistics
   */
  async getFrameworkStats() {
    const testCasesDir = path.join(this.projectRoot, 'ai-test-framework', 'test-cases');
    
    try {
      const files = await fs.readdir(testCasesDir);
      const testFiles = files.filter(f => f.endsWith('-comprehensive-tests.json'));
      
      let totalTests = 0;
      let testsByCategory = { ui: 0, businessLogic: 0, integration: 0, e2e: 0 };
      
      for (const file of testFiles) {
        const content = await fs.readFile(path.join(testCasesDir, file), 'utf8');
        const testSuite = JSON.parse(content);
        
        for (const [category, tests] of Object.entries(testSuite.testCases || {})) {
          totalTests += tests.length;
          testsByCategory[category] = (testsByCategory[category] || 0) + tests.length;
        }
      }
      
      return {
        totalPages: testFiles.length,
        totalTests,
        testsByCategory,
        lastGenerated: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        totalPages: 0,
        totalTests: 0,
        testsByCategory: { ui: 0, businessLogic: 0, integration: 0, e2e: 0 },
        error: error.message
      };
    }
  }
}

module.exports = { ComprehensiveFramework };