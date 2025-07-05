/**
 * Unified Discovery System
 * Discovers both UI/UX and Business Logic requirements comprehensively
 */

const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');

class UnifiedDiscovery {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.discoveryResults = {};
  }

  /**
   * Main entry point - discover everything about the page
   */
  async discoverPage(pageName, pageUrl) {
    console.log(`🔍 Comprehensive discovery for ${pageName}...`);
    
    const discovery = await Promise.all([
      this.discoverUIComponents(pageName),
      this.discoverBusinessLogic(pageName),
      this.discoverAPIIntegrations(pageName),
      this.discoverUserJourneys(pageName),
      this.discoverDataFlow(pageName)
    ]);

    const unified = this.unifyDiscovery(pageName, discovery);
    this.discoveryResults[pageName] = unified;
    
    console.log(`✅ Discovery complete for ${pageName}`);
    console.log(`   🎨 UI Components: ${unified.ui.components.length}`);
    console.log(`   🧮 Business Logic: ${unified.businessLogic.calculations.length + unified.businessLogic.validations.length}`);
    console.log(`   🔗 API Endpoints: ${unified.integration.apiEndpoints.length}`);
    console.log(`   👤 User Journeys: ${unified.userJourneys.length}`);
    
    return unified;
  }

  /**
   * Discover UI/UX components and interactions
   */
  async discoverUIComponents(pageName) {
    const pageFiles = await this.findPageFiles(pageName);
    const componentFiles = await this.findRelatedComponents(pageName);
    
    const ui = {
      components: [],
      interactions: [],
      responsiveness: [],
      accessibility: [],
      performance: []
    };

    for (const file of [...pageFiles, ...componentFiles]) {
      try {
        const content = await fs.readFile(file, 'utf8');
        const analysis = this.analyzeUIFile(content, file);
        this.mergeUI(ui, analysis);
      } catch (error) {
        console.warn(`⚠️ Could not analyze ${file}`);
      }
    }

    return ui;
  }

  /**
   * Discover business logic and calculations
   */
  async discoverBusinessLogic(pageName) {
    const businessLogic = {
      calculations: [],
      validations: [],
      rules: [],
      models: [],
      utilities: []
    };

    // Find business logic files
    const patterns = [
      'src/lib/**/*.{ts,js}',
      'src/utils/**/*.{ts,js}',
      'src/types/**/*.{ts,js}',
      'src/models/**/*.{ts,js}',
      'src/services/**/*.{ts,js}',
      'src/hooks/**/*.{ts,js}'
    ];

    for (const pattern of patterns) {
      try {
        const files = await glob(pattern, { cwd: this.projectRoot });
        for (const file of files) {
          const fullPath = path.join(this.projectRoot, file);
          const content = await fs.readFile(fullPath, 'utf8');
          const analysis = this.analyzeBusinessLogicFile(content, file);
          this.mergeBusinessLogic(businessLogic, analysis);
        }
      } catch (error) {
        // Continue with other patterns
      }
    }

    return businessLogic;
  }

  /**
   * Discover API integrations and data flow
   */
  async discoverAPIIntegrations(pageName) {
    const integration = {
      apiEndpoints: [],
      dataFetching: [],
      mutations: [],
      errorHandling: [],
      stateManagement: []
    };

    // Find API-related files
    const patterns = [
      'src/app/api/**/*.{ts,js}',
      'pages/api/**/*.{ts,js}',
      'src/lib/api/**/*.{ts,js}',
      'src/services/**/*.{ts,js}'
    ];

    for (const pattern of patterns) {
      try {
        const files = await glob(pattern, { cwd: this.projectRoot });
        for (const file of files) {
          const fullPath = path.join(this.projectRoot, file);
          const content = await fs.readFile(fullPath, 'utf8');
          const analysis = this.analyzeAPIFile(content, file);
          this.mergeIntegration(integration, analysis);
        }
      } catch (error) {
        // Continue with other patterns
      }
    }

    // Also analyze frontend API calls
    const pageFiles = await this.findPageFiles(pageName);
    for (const file of pageFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        const frontendAPI = this.analyzeFrontendAPIUsage(content, file);
        this.mergeIntegration(integration, frontendAPI);
      } catch (error) {
        // Continue
      }
    }

    return integration;
  }

  /**
   * Discover user journeys and workflows
   */
  async discoverUserJourneys(pageName) {
    const journeys = [];
    
    // Analyze page for user workflows
    const pageFiles = await this.findPageFiles(pageName);
    
    for (const file of pageFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        const pageJourneys = this.extractUserJourneys(content, file, pageName);
        journeys.push(...pageJourneys);
      } catch (error) {
        // Continue
      }
    }

    return journeys;
  }

  /**
   * Discover data flow patterns
   */
  async discoverDataFlow(pageName) {
    const dataFlow = {
      inputs: [],
      outputs: [],
      transformations: [],
      persistence: [],
      validation: []
    };

    const pageFiles = await this.findPageFiles(pageName);
    
    for (const file of pageFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        const flow = this.analyzeDataFlow(content, file);
        this.mergeDataFlow(dataFlow, flow);
      } catch (error) {
        // Continue
      }
    }

    return dataFlow;
  }

  /**
   * Analyze UI file for components and interactions
   */
  analyzeUIFile(content, filePath) {
    const ui = {
      components: [],
      interactions: [],
      responsiveness: [],
      accessibility: [],
      performance: []
    };

    // Extract React components
    const componentMatches = content.match(/(?:export\s+(?:default\s+)?(?:function|const)\s+\w+|function\s+\w+\s*\()/g) || [];
    ui.components.push(...componentMatches.map(match => ({
      name: match.match(/(?:function|const)\s+(\w+)/)?.[1] || 'Unknown',
      file: filePath,
      type: 'React Component'
    })));

    // Extract event handlers
    const eventHandlers = content.match(/on\w+\s*=\s*\{[^}]+\}/g) || [];
    ui.interactions.push(...eventHandlers.map(handler => ({
      type: handler.match(/on(\w+)/)?.[1] || 'Unknown',
      context: `Interactive element in ${path.basename(filePath)}`,
      file: filePath
    })));

    // Check for responsive design
    if (content.includes('md:') || content.includes('lg:') || content.includes('sm:')) {
      ui.responsiveness.push({
        type: 'Tailwind responsive classes',
        file: filePath
      });
    }

    // Check for accessibility
    const a11yPatterns = ['aria-', 'alt=', 'role=', 'tabIndex'];
    for (const pattern of a11yPatterns) {
      if (content.includes(pattern)) {
        ui.accessibility.push({
          type: pattern,
          file: filePath
        });
      }
    }

    // Check for performance patterns
    if (content.includes('useMemo') || content.includes('useCallback') || content.includes('React.memo')) {
      ui.performance.push({
        type: 'React optimization',
        file: filePath
      });
    }

    return ui;
  }

  /**
   * Analyze business logic file
   */
  analyzeBusinessLogicFile(content, filePath) {
    const businessLogic = {
      calculations: [],
      validations: [],
      rules: [],
      models: [],
      utilities: []
    };

    // Trading-specific calculations
    const tradingPatterns = [
      { pattern: /profit|loss|pnl|p&l/gi, type: 'P&L Calculation' },
      { pattern: /price.*\*.*quantity|quantity.*\*.*price/gi, type: 'Trade Value Calculation' },
      { pattern: /stop.*loss|stoploss/gi, type: 'Stop Loss Logic' },
      { pattern: /commission|fee/gi, type: 'Fee Calculation' },
      { pattern: /percentage|percent|\%/gi, type: 'Percentage Calculation' }
    ];

    for (const { pattern, type } of tradingPatterns) {
      const matches = content.match(pattern) || [];
      if (matches.length > 0) {
        businessLogic.calculations.push({
          type,
          file: filePath,
          occurrences: matches.length
        });
      }
    }

    // Validation patterns
    const validationPatterns = [
      { pattern: /validate|validation/gi, type: 'Data Validation' },
      { pattern: /required|mandatory/gi, type: 'Required Field Validation' },
      { pattern: /min|max|range/gi, type: 'Range Validation' },
      { pattern: /email|phone|number/gi, type: 'Format Validation' }
    ];

    for (const { pattern, type } of validationPatterns) {
      const matches = content.match(pattern) || [];
      if (matches.length > 0) {
        businessLogic.validations.push({
          type,
          file: filePath,
          occurrences: matches.length
        });
      }
    }

    // Type definitions (models)
    const typeMatches = content.match(/(?:interface|type)\s+(\w+)/g) || [];
    businessLogic.models.push(...typeMatches.map(match => ({
      name: match.match(/(?:interface|type)\s+(\w+)/)?.[1],
      file: filePath,
      type: 'TypeScript Definition'
    })));

    // Utility functions
    const functionMatches = content.match(/(?:export\s+)?(?:function|const)\s+(\w+)/g) || [];
    businessLogic.utilities.push(...functionMatches.map(match => ({
      name: match.match(/(?:function|const)\s+(\w+)/)?.[1],
      file: filePath,
      type: 'Utility Function'
    })));

    return businessLogic;
  }

  /**
   * Analyze API file
   */
  analyzeAPIFile(content, filePath) {
    const integration = {
      apiEndpoints: [],
      dataFetching: [],
      mutations: [],
      errorHandling: [],
      stateManagement: []
    };

    // Extract API endpoints
    const endpointPatterns = [
      { pattern: /app\.(?:get|post|put|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g, type: 'Express Route' },
      { pattern: /export\s+(?:async\s+)?function\s+\w+.*request/gi, type: 'API Handler' },
      { pattern: /NextRequest|NextResponse/g, type: 'Next.js API Route' }
    ];

    for (const { pattern, type } of endpointPatterns) {
      const matches = [...content.matchAll(pattern)];
      integration.apiEndpoints.push(...matches.map(match => ({
        endpoint: match[1] || `Handler in ${path.basename(filePath)}`,
        method: match[0].includes('post') ? 'POST' : 
                match[0].includes('put') ? 'PUT' : 
                match[0].includes('delete') ? 'DELETE' : 'GET',
        file: filePath,
        type
      })));
    }

    // Error handling
    if (content.includes('try') && content.includes('catch')) {
      integration.errorHandling.push({
        type: 'Try-Catch Error Handling',
        file: filePath
      });
    }

    if (content.includes('throw') || content.includes('Error')) {
      integration.errorHandling.push({
        type: 'Error Throwing',
        file: filePath
      });
    }

    return integration;
  }

  /**
   * Analyze frontend API usage
   */
  analyzeFrontendAPIUsage(content, filePath) {
    const integration = {
      apiEndpoints: [],
      dataFetching: [],
      mutations: [],
      errorHandling: [],
      stateManagement: []
    };

    // API calls
    const apiPatterns = [
      { pattern: /fetch\s*\(\s*['"`]([^'"`]+)['"`]/g, type: 'Fetch API Call' },
      { pattern: /axios\.(?:get|post|put|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g, type: 'Axios API Call' },
      { pattern: /useSWR|useQuery/g, type: 'Data Fetching Hook' }
    ];

    for (const { pattern, type } of apiPatterns) {
      const matches = [...content.matchAll(pattern)];
      integration.dataFetching.push(...matches.map(match => ({
        endpoint: match[1] || 'Dynamic endpoint',
        file: filePath,
        type
      })));
    }

    // State management
    const statePatterns = [
      'useState', 'useEffect', 'useContext', 'useReducer', 'useMemo', 'useCallback'
    ];

    for (const pattern of statePatterns) {
      if (content.includes(pattern)) {
        integration.stateManagement.push({
          type: pattern,
          file: filePath
        });
      }
    }

    return integration;
  }

  /**
   * Extract user journeys from page content
   */
  extractUserJourneys(content, filePath, pageName) {
    const journeys = [];

    // Trading-specific journeys based on page name
    const pageJourneys = {
      dashboard: [
        'User views trading summary',
        'User checks recent trades',
        'User monitors profit/loss',
        'User navigates to other sections'
      ],
      trades: [
        'User views trade list',
        'User filters trades by criteria',
        'User creates new trade',
        'User edits existing trade',
        'User deletes trade'
      ],
      charts: [
        'User views trade charts',
        'User analyzes trade performance',
        'User downloads chart data',
        'User switches between chart views'
      ]
    };

    const defaultJourneys = pageJourneys[pageName] || [
      `User accesses ${pageName} page`,
      `User interacts with ${pageName} features`,
      `User completes ${pageName} workflow`
    ];

    journeys.push(...defaultJourneys.map(journey => ({
      journey,
      page: pageName,
      file: filePath,
      type: 'Inferred User Journey'
    })));

    // Extract form submissions as journeys
    if (content.includes('onSubmit') || content.includes('form')) {
      journeys.push({
        journey: `User submits form on ${pageName}`,
        page: pageName,
        file: filePath,
        type: 'Form Submission Journey'
      });
    }

    return journeys;
  }

  /**
   * Analyze data flow patterns
   */
  analyzeDataFlow(content, filePath) {
    const dataFlow = {
      inputs: [],
      outputs: [],
      transformations: [],
      persistence: [],
      validation: []
    };

    // Input patterns
    if (content.includes('input') || content.includes('form') || content.includes('onChange')) {
      dataFlow.inputs.push({
        type: 'User Input',
        file: filePath
      });
    }

    // Output patterns
    if (content.includes('display') || content.includes('render') || content.includes('show')) {
      dataFlow.outputs.push({
        type: 'UI Display',
        file: filePath
      });
    }

    // Transformations
    if (content.includes('map') || content.includes('filter') || content.includes('reduce')) {
      dataFlow.transformations.push({
        type: 'Data Transformation',
        file: filePath
      });
    }

    return dataFlow;
  }

  // Helper methods to find files
  async findPageFiles(pageName) {
    const patterns = [
      `src/app/${pageName}/page.{tsx,ts,jsx,js}`,
      `src/app/**/*${pageName}*.{tsx,ts,jsx,js}`,
      `src/pages/${pageName}.{tsx,ts,jsx,js}`,
      `pages/${pageName}.{tsx,ts,jsx,js}`
    ];

    const files = [];
    for (const pattern of patterns) {
      try {
        const matches = await glob(pattern, { cwd: this.projectRoot });
        files.push(...matches.map(f => path.join(this.projectRoot, f)));
      } catch (error) {
        // Continue with other patterns
      }
    }

    return files;
  }

  async findRelatedComponents(pageName) {
    const patterns = [
      `src/components/**/*${pageName}*.{tsx,ts,jsx,js}`,
      `src/components/**/trade*.{tsx,ts,jsx,js}`,
      `src/components/**/chart*.{tsx,ts,jsx,js}`,
      `src/components/**/dashboard*.{tsx,ts,jsx,js}`
    ];

    const files = [];
    for (const pattern of patterns) {
      try {
        const matches = await glob(pattern, { cwd: this.projectRoot });
        files.push(...matches.map(f => path.join(this.projectRoot, f)));
      } catch (error) {
        // Continue
      }
    }

    return files.slice(0, 10); // Limit to avoid too many files
  }

  // Merge methods
  mergeUI(target, source) {
    for (const key of ['components', 'interactions', 'responsiveness', 'accessibility', 'performance']) {
      if (source[key]) target[key].push(...source[key]);
    }
  }

  mergeBusinessLogic(target, source) {
    for (const key of ['calculations', 'validations', 'rules', 'models', 'utilities']) {
      if (source[key]) target[key].push(...source[key]);
    }
  }

  mergeIntegration(target, source) {
    for (const key of ['apiEndpoints', 'dataFetching', 'mutations', 'errorHandling', 'stateManagement']) {
      if (source[key]) target[key].push(...source[key]);
    }
  }

  mergeDataFlow(target, source) {
    for (const key of ['inputs', 'outputs', 'transformations', 'persistence', 'validation']) {
      if (source[key]) target[key].push(...source[key]);
    }
  }

  /**
   * Unify all discovery results
   */
  unifyDiscovery(pageName, [ui, businessLogic, integration, userJourneys, dataFlow]) {
    return {
      pageName,
      lastAnalyzed: new Date().toISOString(),
      ui,
      businessLogic,
      integration,
      userJourneys,
      dataFlow,
      summary: {
        totalComponents: ui.components.length,
        totalCalculations: businessLogic.calculations.length,
        totalValidations: businessLogic.validations.length,
        totalAPIEndpoints: integration.apiEndpoints.length,
        totalUserJourneys: userJourneys.length
      }
    };
  }
}

module.exports = { UnifiedDiscovery };