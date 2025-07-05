/**
 * Unified Test Generator
 * Generates comprehensive test cases covering UI, Business Logic, and Integration
 */

const { UnifiedDiscovery } = require('../discovery/unified-discovery');
const fs = require('fs').promises;
const path = require('path');

class UnifiedTestGenerator {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.discovery = new UnifiedDiscovery(projectRoot);
    this.testCasesDir = path.join(projectRoot, 'ai-test-framework', 'test-cases');
  }

  /**
   * Generate comprehensive test cases for a page
   */
  async generateComprehensiveTests(pageName, pageUrl, claudeAnalysisFunction) {
    console.log(`🧠 Generating comprehensive tests for ${pageName}...`);

    // Step 1: Comprehensive discovery
    const discovery = await this.discovery.discoverPage(pageName, pageUrl);

    // Step 2: Load existing test cases
    const existing = await this.loadExistingTests(pageName);

    // Step 3: Generate test cases using Claude with full context
    const testCases = await this.generateTestCasesWithClaude(
      pageName, 
      discovery, 
      existing, 
      claudeAnalysisFunction
    );

    // Step 4: Save comprehensive test suite
    await this.saveTestSuite(pageName, discovery, testCases);

    console.log(`✅ Generated comprehensive test suite for ${pageName}`);
    console.log(`   🎨 UI Tests: ${testCases.ui.length}`);
    console.log(`   🧮 Business Logic Tests: ${testCases.businessLogic.length}`);
    console.log(`   🔗 Integration Tests: ${testCases.integration.length}`);
    console.log(`   🛤️  E2E Journey Tests: ${testCases.e2e.length}`);

    return {
      discovery,
      testCases,
      summary: this.generateSummary(pageName, discovery, testCases)
    };
  }

  /**
   * Generate test cases using Claude with comprehensive context
   */
  async generateTestCasesWithClaude(pageName, discovery, existing, claudeAnalysisFunction) {
    const prompt = this.buildComprehensivePrompt(pageName, discovery, existing);
    const claudeResponse = await claudeAnalysisFunction(prompt);
    
    try {
      // Parse Claude's response
      let cleaned = claudeResponse.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleaned);
      return this.validateAndEnhanceTestCases(parsed, existing);
      
    } catch (error) {
      console.error('❌ Failed to parse Claude response:', error.message);
      return this.generateFallbackTestCases(pageName, discovery);
    }
  }

  /**
   * Build comprehensive prompt for Claude
   */
  buildComprehensivePrompt(pageName, discovery, existing) {
    return `You are an expert test engineer for a trading application. Generate comprehensive test cases that cover UI, business logic, and integration testing.

PAGE: ${pageName}

DISCOVERY RESULTS:
${JSON.stringify(discovery, null, 2)}

EXISTING TESTS:
${JSON.stringify(existing, null, 2)}

GENERATE TEST CASES FOR:

1. **UI/UX TESTING:**
   - Component rendering and interactions
   - Mobile responsiveness across devices
   - Accessibility compliance
   - Performance and loading states
   - Error handling and edge cases

2. **BUSINESS LOGIC TESTING:**
   - Trading calculations (P&L, fees, percentages)
   - Data validation rules
   - Business rule enforcement
   - Financial logic accuracy
   - Risk management calculations

3. **INTEGRATION TESTING:**
   - API endpoint functionality
   - Data flow between frontend and backend
   - Error handling and retry logic
   - Authentication and authorization
   - Database operations

4. **END-TO-END TESTING:**
   - Complete user journeys
   - Cross-page workflows
   - Data persistence across sessions
   - Multi-step trading workflows

FOCUS ON TRADING APPLICATION SPECIFICS:
- Accurate profit/loss calculations
- Price and quantity validations  
- Stop-loss and take-profit logic
- Trade execution workflows
- Portfolio management features
- Risk assessment functionality

RESPONSE FORMAT (JSON):
{
  "ui": [
    {
      "id": "UI-001",
      "title": "Dashboard displays recent trades correctly",
      "category": "ui",
      "priority": "high",
      "type": "visual",
      "description": "Verify the dashboard shows recent trading activity with correct data",
      "steps": [
        "Navigate to dashboard page",
        "Verify trades list is visible and populated",
        "Check trade data accuracy (symbol, price, quantity)",
        "Verify profit/loss colors (green/red)"
      ],
      "expectedResult": "Dashboard displays recent trades with accurate data and proper styling",
      "testData": {
        "viewport": "1280x720",
        "mockTrades": [{"symbol": "AAPL", "price": 150, "quantity": 100}]
      },
      "playwrightTest": true
    }
  ],
  "businessLogic": [
    {
      "id": "BL-001", 
      "title": "Calculate profit correctly for long position",
      "category": "business-logic",
      "priority": "critical",
      "type": "calculation",
      "description": "Verify P&L calculation for buy-low-sell-high scenario",
      "steps": [
        "Create long position: Buy 100 AAPL at $150",
        "Close position: Sell 100 AAPL at $155", 
        "Calculate expected profit: (155-150) * 100 = $500",
        "Verify system calculation matches expected"
      ],
      "expectedResult": "System calculates profit as $500 (excluding fees)",
      "testData": {
        "trade": {
          "symbol": "AAPL",
          "side": "BUY", 
          "quantity": 100,
          "entryPrice": 150,
          "exitPrice": 155
        },
        "expectedProfit": 500
      },
      "apiTest": true,
      "endpoint": "/api/trades/calculate-pnl"
    }
  ],
  "integration": [
    {
      "id": "INT-001",
      "title": "Create trade via API successfully",
      "category": "integration", 
      "priority": "high",
      "type": "api",
      "description": "Verify trade creation through API endpoint",
      "steps": [
        "Send POST request to /api/trades/create",
        "Include valid trade data in request body",
        "Verify 201 status code response",
        "Verify trade appears in database",
        "Verify trade appears in UI"
      ],
      "expectedResult": "Trade created successfully and visible in both database and UI",
      "testData": {
        "requestBody": {
          "symbol": "AAPL",
          "side": "BUY",
          "quantity": 100, 
          "price": 150
        }
      },
      "apiTest": true,
      "endpoint": "/api/trades/create",
      "method": "POST"
    }
  ],
  "e2e": [
    {
      "id": "E2E-001",
      "title": "Complete trade creation and review workflow",
      "category": "e2e",
      "priority": "high", 
      "type": "user-journey",
      "description": "Test complete user journey from creating trade to reviewing results",
      "steps": [
        "Login to application",
        "Navigate to trades page",
        "Click 'Add New Trade' button",
        "Fill in trade details (symbol, quantity, price)",
        "Submit trade form",
        "Verify trade appears in trades list",
        "Navigate to dashboard",
        "Verify trade appears in recent activity",
        "Check P&L calculation is correct"
      ],
      "expectedResult": "User can successfully create trade and see it reflected across the application",
      "testData": {
        "userCredentials": {"username": "testuser", "password": "testpass"},
        "tradeData": {"symbol": "AAPL", "quantity": 100, "price": 150}
      },
      "playwrightTest": true,
      "crossPage": true
    }
  ]
}

REQUIREMENTS:
- Include specific test data for each test case
- Mark tests as playwrightTest: true for UI tests
- Mark tests as apiTest: true for backend tests  
- Include API endpoints and HTTP methods
- Cover edge cases and error scenarios
- Ensure tests are executable and specific
- Focus on trading domain expertise
- Include performance and accessibility tests

Return ONLY the JSON object with the four test categories.`;
  }

  /**
   * Validate and enhance test cases
   */
  validateAndEnhanceTestCases(parsed, existing) {
    const enhanced = {
      ui: [],
      businessLogic: [],
      integration: [],
      e2e: []
    };

    // Validate each category
    for (const category of ['ui', 'businessLogic', 'integration', 'e2e']) {
      if (parsed[category] && Array.isArray(parsed[category])) {
        enhanced[category] = parsed[category].map((testCase, index) => 
          this.validateTestCase(testCase, category, index, existing)
        );
      }
    }

    return enhanced;
  }

  /**
   * Validate individual test case
   */
  validateTestCase(testCase, category, index, existing) {
    const prefix = category.toUpperCase().substring(0, 3);
    const existingIds = existing.testCases ? existing.testCases.map(tc => tc.id) : [];
    
    return {
      id: testCase.id || `${prefix}-${String(index + 1).padStart(3, '0')}`,
      title: testCase.title || 'Untitled Test Case',
      category: testCase.category || category,
      priority: testCase.priority || 'medium',
      type: testCase.type || 'functional',
      description: testCase.description || '',
      steps: Array.isArray(testCase.steps) ? testCase.steps : ['Add test steps'],
      expectedResult: testCase.expectedResult || 'Define expected result',
      testData: testCase.testData || {},
      tags: testCase.tags || [category],
      status: existingIds.includes(testCase.id) ? 'updated' : 'new',
      addedIn: testCase.addedIn || '1.0.0',
      lastModified: new Date().toISOString(),
      // Test execution flags
      playwrightTest: testCase.playwrightTest || false,
      apiTest: testCase.apiTest || false,
      endpoint: testCase.endpoint || null,
      method: testCase.method || 'GET',
      crossPage: testCase.crossPage || false
    };
  }

  /**
   * Generate fallback test cases if Claude fails
   */
  generateFallbackTestCases(pageName, discovery) {
    return {
      ui: [
        {
          id: 'UI-001',
          title: `${pageName} page loads successfully`,
          category: 'ui',
          priority: 'high',
          type: 'visual',
          description: `Verify ${pageName} page renders without errors`,
          steps: [
            `Navigate to ${pageName} page`,
            'Verify page loads without errors',
            'Check main content is visible'
          ],
          expectedResult: `${pageName} page displays correctly`,
          testData: { viewport: '1280x720' },
          playwrightTest: true,
          status: 'new',
          addedIn: '1.0.0',
          lastModified: new Date().toISOString()
        }
      ],
      businessLogic: discovery.businessLogic.calculations.map((calc, index) => ({
        id: `BL-${String(index + 1).padStart(3, '0')}`,
        title: `Verify ${calc.type.toLowerCase()}`,
        category: 'business-logic',
        priority: 'critical',
        type: 'calculation',
        description: `Test ${calc.type} functionality`,
        steps: [
          'Prepare test data',
          'Execute calculation',
          'Verify result accuracy'
        ],
        expectedResult: 'Calculation produces correct result',
        testData: {},
        apiTest: true,
        status: 'new',
        addedIn: '1.0.0',
        lastModified: new Date().toISOString()
      })),
      integration: discovery.integration.apiEndpoints.map((endpoint, index) => ({
        id: `INT-${String(index + 1).padStart(3, '0')}`,
        title: `Test ${endpoint.endpoint} API`,
        category: 'integration',
        priority: 'high',
        type: 'api',
        description: `Verify ${endpoint.endpoint} endpoint functionality`,
        steps: [
          `Send ${endpoint.method} request to ${endpoint.endpoint}`,
          'Verify response status',
          'Validate response data'
        ],
        expectedResult: 'API responds correctly with valid data',
        testData: {},
        apiTest: true,
        endpoint: endpoint.endpoint,
        method: endpoint.method,
        status: 'new',
        addedIn: '1.0.0',
        lastModified: new Date().toISOString()
      })),
      e2e: discovery.userJourneys.map((journey, index) => ({
        id: `E2E-${String(index + 1).padStart(3, '0')}`,
        title: journey.journey,
        category: 'e2e',
        priority: 'medium',
        type: 'user-journey',
        description: `Test complete user workflow: ${journey.journey}`,
        steps: [
          'Start user session',
          'Execute user workflow',
          'Verify end state'
        ],
        expectedResult: 'User can successfully complete the workflow',
        testData: {},
        playwrightTest: true,
        crossPage: true,
        status: 'new',
        addedIn: '1.0.0',
        lastModified: new Date().toISOString()
      }))
    };
  }

  /**
   * Load existing test cases
   */
  async loadExistingTests(pageName) {
    try {
      const filePath = path.join(this.testCasesDir, `${pageName}-comprehensive-tests.json`);
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return {
        version: '0.0.0',
        testCases: [],
        discovery: {}
      };
    }
  }

  /**
   * Save comprehensive test suite
   */
  async saveTestSuite(pageName, discovery, testCases) {
    await fs.mkdir(this.testCasesDir, { recursive: true });

    const testSuite = {
      version: '1.0.0',
      lastGenerated: new Date().toISOString(),
      pageName,
      discovery,
      testCases,
      metadata: {
        totalTests: Object.values(testCases).reduce((sum, arr) => sum + arr.length, 0),
        testsByCategory: {
          ui: testCases.ui.length,
          businessLogic: testCases.businessLogic.length,
          integration: testCases.integration.length,
          e2e: testCases.e2e.length
        },
        testsByPriority: this.groupByPriority(testCases),
        executionTypes: {
          playwright: this.countByFlag(testCases, 'playwrightTest'),
          api: this.countByFlag(testCases, 'apiTest'),
          crossPage: this.countByFlag(testCases, 'crossPage')
        }
      }
    };

    const filePath = path.join(this.testCasesDir, `${pageName}-comprehensive-tests.json`);
    await fs.writeFile(filePath, JSON.stringify(testSuite, null, 2));

    // Also save execution-ready formats
    await this.generateExecutableTests(pageName, testCases);
  }

  /**
   * Generate executable test files
   */
  async generateExecutableTests(pageName, testCases) {
    // Generate Playwright tests for UI and E2E
    const playwrightTests = [...testCases.ui, ...testCases.e2e].filter(tc => tc.playwrightTest);
    if (playwrightTests.length > 0) {
      await this.generatePlaywrightFile(pageName, playwrightTests);
    }

    // Generate API tests for business logic and integration
    const apiTests = [...testCases.businessLogic, ...testCases.integration].filter(tc => tc.apiTest);
    if (apiTests.length > 0) {
      await this.generateAPITestFile(pageName, apiTests);
    }
  }

  /**
   * Generate Playwright test file
   */
  async generatePlaywrightFile(pageName, tests) {
    const testContent = `// Generated Playwright Tests for ${pageName}
// Auto-generated on ${new Date().toISOString()}

const { test, expect } = require('@playwright/test');

test.describe('${pageName} - Comprehensive UI Tests', () => {

${tests.map(testCase => `
  test('${testCase.title}', async ({ page }) => {
    // Test: ${testCase.description}
    
    ${testCase.steps.map((step, index) => `
    // Step ${index + 1}: ${step}
    // TODO: Implement step`).join('\n')}
    
    // Expected Result: ${testCase.expectedResult}
    // TODO: Add assertions
    
    await expect(page.locator('body')).toBeVisible();
  });
`).join('\n')}

});`; 

    const testsDir = path.join(this.projectRoot, 'ai-test-framework', 'generated-tests');
    await fs.mkdir(testsDir, { recursive: true });
    
    const filePath = path.join(testsDir, `${pageName}-ui-tests.spec.js`);
    await fs.writeFile(filePath, testContent);
  }

  /**
   * Generate API test file
   */
  async generateAPITestFile(pageName, tests) {
    const testContent = `// Generated API Tests for ${pageName}
// Auto-generated on ${new Date().toISOString()}

const request = require('supertest');
const app = require('../../../app'); // Adjust path as needed

describe('${pageName} - API Tests', () => {

${tests.map(testCase => `
  test('${testCase.title}', async () => {
    // Test: ${testCase.description}
    
    ${testCase.endpoint ? `
    const response = await request(app)
      .${testCase.method.toLowerCase()}('${testCase.endpoint}')
      ${testCase.testData ? `.send(${JSON.stringify(testCase.testData)})` : ''}
      .expect(200); // Adjust expected status code
    
    // Expected Result: ${testCase.expectedResult}
    // TODO: Add specific assertions
    expect(response.body).toBeDefined();
    ` : `
    // TODO: Implement test logic
    // Steps: ${testCase.steps.join(', ')}
    `}
  });
`).join('\n')}

});`;

    const testsDir = path.join(this.projectRoot, 'ai-test-framework', 'generated-tests');
    await fs.mkdir(testsDir, { recursive: true });
    
    const filePath = path.join(testsDir, `${pageName}-api-tests.spec.js`);
    await fs.writeFile(filePath, testContent);
  }

  /**
   * Helper methods
   */
  groupByPriority(testCases) {
    const priorities = { critical: 0, high: 0, medium: 0, low: 0 };
    
    Object.values(testCases).flat().forEach(testCase => {
      priorities[testCase.priority] = (priorities[testCase.priority] || 0) + 1;
    });
    
    return priorities;
  }

  countByFlag(testCases, flag) {
    return Object.values(testCases).flat().filter(tc => tc[flag]).length;
  }

  /**
   * Generate summary report
   */
  generateSummary(pageName, discovery, testCases) {
    const totalTests = Object.values(testCases).reduce((sum, arr) => sum + arr.length, 0);
    
    return `
🎯 Comprehensive Test Generation Complete for ${pageName}
${'='.repeat(60)}

📊 DISCOVERY SUMMARY:
   🎨 UI Components: ${discovery.ui.components.length}
   🧮 Business Logic: ${discovery.businessLogic.calculations.length + discovery.businessLogic.validations.length}
   🔗 API Endpoints: ${discovery.integration.apiEndpoints.length}
   👤 User Journeys: ${discovery.userJourneys.length}

🧪 TEST CASES GENERATED: ${totalTests}
   🎨 UI Tests: ${testCases.ui.length}
   🧮 Business Logic Tests: ${testCases.businessLogic.length}
   🔗 Integration Tests: ${testCases.integration.length}
   🛤️  E2E Tests: ${testCases.e2e.length}

⚡ EXECUTION READY:
   🎭 Playwright Tests: ${this.countByFlag(testCases, 'playwrightTest')}
   🔌 API Tests: ${this.countByFlag(testCases, 'apiTest')}
   🌐 Cross-Page Tests: ${this.countByFlag(testCases, 'crossPage')}

📁 Generated Files:
   • ${pageName}-comprehensive-tests.json
   • ${pageName}-ui-tests.spec.js
   • ${pageName}-api-tests.spec.js
`;
  }
}

module.exports = { UnifiedTestGenerator };