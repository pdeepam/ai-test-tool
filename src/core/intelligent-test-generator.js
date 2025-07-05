/**
 * Intelligent Test Case Generator
 * Orchestrates requirements discovery and test case generation
 */

const { RequirementsDiscovery } = require('./requirements-discovery');
const { TestCaseManager } = require('./test-case-manager');

class IntelligentTestGenerator {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.requirementsDiscovery = new RequirementsDiscovery(projectRoot);
    this.testCaseManager = new TestCaseManager(projectRoot);
  }

  /**
   * Generate or update test cases for a page intelligently
   */
  async generateTestCases(pageName, pageUrl, claudeAnalysisFunction) {
    console.log(`🧠 Starting intelligent test case generation for ${pageName}...`);
    
    try {
      // Step 1: Discover requirements from all sources
      const requirements = await this.requirementsDiscovery.gatherRequirements(pageName, pageUrl);
      
      // Step 2: Update test cases incrementally
      const testCases = await this.testCaseManager.updateTestCases(
        pageName, 
        requirements, 
        claudeAnalysisFunction
      );
      
      // Step 3: Generate summary report
      const summary = this.generateSummary(pageName, requirements, testCases);
      console.log(summary);
      
      return {
        requirements,
        testCases,
        summary
      };
      
    } catch (error) {
      console.error(`❌ Failed to generate test cases for ${pageName}:`, error.message);
      throw error;
    }
  }

  /**
   * Generate test cases for all configured pages
   */
  async generateAllTestCases(config, claudeAnalysisFunction) {
    const results = {};
    
    for (const page of config.pages) {
      try {
        console.log(`\n🔄 Processing ${page.name}...`);
        results[page.name] = await this.generateTestCases(
          page.name, 
          page.url, 
          claudeAnalysisFunction
        );
      } catch (error) {
        console.error(`❌ Failed to process ${page.name}:`, error.message);
        results[page.name] = { error: error.message };
      }
    }
    
    return results;
  }

  /**
   * Get test case history for a page
   */
  async getTestCaseHistory(pageName) {
    return await this.testCaseManager.getTestCaseHistory(pageName);
  }

  /**
   * Export test cases in various formats
   */
  async exportTestCases(pageName, format = 'json') {
    return await this.testCaseManager.exportTestCases(pageName, format);
  }

  /**
   * Analyze test coverage gaps
   */
  async analyzeTestCoverageGaps(pageName, claudeAnalysisFunction) {
    const requirements = await this.requirementsDiscovery.gatherRequirements(pageName);
    const testCases = await this.testCaseManager.loadExistingTestCases(pageName);
    
    const prompt = `Analyze test coverage gaps for ${pageName}:

REQUIREMENTS:
${JSON.stringify(requirements, null, 2)}

EXISTING TEST CASES:
${JSON.stringify(testCases.testCases, null, 2)}

Identify:
1. Requirements that have no corresponding test cases
2. Important edge cases that are missing
3. Performance scenarios not covered
4. Accessibility requirements without tests
5. Mobile-specific scenarios missing

Provide specific recommendations for new test cases needed.`;

    const analysis = await claudeAnalysisFunction(prompt);
    return {
      requirements,
      testCases: testCases.testCases,
      gapAnalysis: analysis
    };
  }

  /**
   * Suggest test case improvements
   */
  async suggestTestCaseImprovements(pageName, claudeAnalysisFunction) {
    const testCases = await this.testCaseManager.loadExistingTestCases(pageName);
    
    const prompt = `Review and suggest improvements for existing test cases:

CURRENT TEST CASES:
${JSON.stringify(testCases.testCases, null, 2)}

Analyze and suggest improvements for:
1. Test case clarity and specificity
2. Missing assertion details
3. Better step descriptions
4. More comprehensive edge cases
5. Improved test data scenarios
6. Better error condition coverage

Focus on practical improvements that will make tests more effective and reliable.`;

    const suggestions = await claudeAnalysisFunction(prompt);
    return {
      currentTestCases: testCases.testCases,
      suggestions
    };
  }

  /**
   * Generate summary report
   */
  generateSummary(pageName, requirements, testCases) {
    const reqCount = Object.values(requirements)
      .filter(val => Array.isArray(val))
      .reduce((sum, arr) => sum + arr.length, 0);
    
    return `
📊 Test Case Generation Summary for ${pageName}
${'='.repeat(50)}
📋 Requirements Discovered: ${reqCount}
   • Functional: ${requirements.functional?.length || 0}
   • Business Rules: ${requirements.businessRules?.length || 0}
   • User Workflows: ${requirements.userWorkflows?.length || 0}
   • Performance: ${requirements.performance?.length || 0}
   • Accessibility: ${requirements.accessibility?.length || 0}

🧪 Test Cases (v${testCases.version}):
   • Total: ${testCases.metadata.totalTestCases}
   • New: ${testCases.metadata.newTestCases}
   • Updated: ${testCases.metadata.updatedTestCases}
   • Deprecated: ${testCases.metadata.deprecatedTestCases}

📁 Sources: ${requirements.sources?.join(', ') || 'None'}
⏱️  Last Updated: ${testCases.lastUpdated}
`;
  }

  /**
   * Validate test case quality
   */
  validateTestCaseQuality(testCases) {
    const issues = [];
    
    for (const testCase of testCases) {
      // Check for missing required fields
      if (!testCase.title || testCase.title.trim().length === 0) {
        issues.push(`${testCase.id}: Missing or empty title`);
      }
      
      if (!testCase.steps || testCase.steps.length === 0) {
        issues.push(`${testCase.id}: Missing test steps`);
      }
      
      if (!testCase.expectedResult || testCase.expectedResult.trim().length === 0) {
        issues.push(`${testCase.id}: Missing expected result`);
      }
      
      // Check for vague descriptions
      if (testCase.title && testCase.title.toLowerCase().includes('test')) {
        issues.push(`${testCase.id}: Title too generic (contains 'test')`);
      }
      
      // Check step quality
      if (testCase.steps) {
        const vagueSteps = testCase.steps.filter(step => 
          step.toLowerCase().includes('add') && 
          step.toLowerCase().includes('step')
        );
        if (vagueSteps.length > 0) {
          issues.push(`${testCase.id}: Contains placeholder steps`);
        }
      }
    }
    
    return issues;
  }

  /**
   * Get test case statistics
   */
  getTestCaseStatistics(testCases) {
    const stats = {
      total: testCases.length,
      byPriority: {},
      byCategory: {},
      byStatus: {},
      averageSteps: 0,
      withTags: 0
    };
    
    for (const testCase of testCases) {
      // Count by priority
      stats.byPriority[testCase.priority] = (stats.byPriority[testCase.priority] || 0) + 1;
      
      // Count by category
      stats.byCategory[testCase.category] = (stats.byCategory[testCase.category] || 0) + 1;
      
      // Count by status
      stats.byStatus[testCase.status] = (stats.byStatus[testCase.status] || 0) + 1;
      
      // Calculate average steps
      if (testCase.steps && Array.isArray(testCase.steps)) {
        stats.averageSteps += testCase.steps.length;
      }
      
      // Count test cases with tags
      if (testCase.tags && testCase.tags.length > 0) {
        stats.withTags++;
      }
    }
    
    stats.averageSteps = testCases.length > 0 ? stats.averageSteps / testCases.length : 0;
    
    return stats;
  }
}

module.exports = { IntelligentTestGenerator };