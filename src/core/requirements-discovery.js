/**
 * Multi-Source Requirements Discovery System
 * Intelligently gathers business requirements from code, docs, and existing tests
 */

const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');

class RequirementsDiscovery {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.cache = new Map();
  }

  /**
   * Main entry point - gather requirements from all sources
   */
  async gatherRequirements(pageName, pageUrl) {
    console.log(`🔍 Discovering requirements for ${pageName}...`);
    
    const sources = await Promise.all([
      this.analyzeCodeStructure(pageName, pageUrl),
      this.parseDocumentation(),
      this.loadExistingRequirements(pageName),
      this.analyzeUserInteractions(pageName, pageUrl),
      this.inferFromTestHistory(pageName)
    ]);

    const merged = this.mergeRequirements(sources);
    
    // Cache for performance
    this.cache.set(pageName, merged);
    
    console.log(`✅ Found ${merged.functional.length} functional requirements`);
    console.log(`✅ Found ${merged.businessRules.length} business rules`);
    console.log(`✅ Found ${merged.userWorkflows.length} user workflows`);
    
    return merged;
  }

  /**
   * Analyze React component structure to infer requirements
   */
  async analyzeCodeStructure(pageName, pageUrl) {
    try {
      const pageFiles = await this.findPageFiles(pageName);
      const components = await this.findRelatedComponents(pageName);
      
      const analysis = {
        source: 'code-analysis',
        functional: [],
        businessRules: [],
        userWorkflows: [],
        performance: [],
        accessibility: []
      };

      for (const file of [...pageFiles, ...components]) {
        const content = await fs.readFile(file, 'utf8');
        const fileAnalysis = await this.analyzeFileContent(content, file);
        this.mergeAnalysis(analysis, fileAnalysis);
      }

      return analysis;
    } catch (error) {
      console.warn(`⚠️ Code analysis failed for ${pageName}:`, error.message);
      return this.getEmptyAnalysis('code-analysis');
    }
  }

  /**
   * Find page files for analysis
   */
  async findPageFiles(pageName) {
    const patterns = [
      `src/app/${pageName}/page.tsx`,
      `src/app/${pageName}/page.js`,
      `src/pages/${pageName}.tsx`,
      `src/pages/${pageName}.js`,
      `src/app/**/*${pageName}*.tsx`,
      `src/app/**/*${pageName}*.js`
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

  /**
   * Find related components
   */
  async findRelatedComponents(pageName) {
    try {
      const componentPatterns = [
        `src/components/**/*${pageName}*.tsx`,
        `src/components/**/*${pageName}*.js`,
        `src/components/**/trade*.tsx`, // Trading-specific
        `src/components/**/chart*.tsx`, // Chart-specific
        `src/components/**/dashboard*.tsx` // Dashboard-specific
      ];

      const files = [];
      for (const pattern of componentPatterns) {
        const matches = await glob(pattern, { cwd: this.projectRoot });
        files.push(...matches.map(f => path.join(this.projectRoot, f)));
      }

      return files.slice(0, 10); // Limit to avoid too many files
    } catch (error) {
      return [];
    }
  }

  /**
   * Analyze file content for requirements
   */
  async analyzeFileContent(content, filePath) {
    const analysis = this.getEmptyAnalysis('file-analysis');
    
    // Extract functional requirements from JSX and functions
    const functionMatches = content.match(/function\s+(\w+)|const\s+(\w+)\s*=.*=>/g) || [];
    const eventHandlers = content.match(/on\w+\s*=\s*\{[^}]+\}/g) || [];
    const stateVariables = content.match(/useState\([^)]*\)/g) || [];
    const apiCalls = content.match(/fetch\(|axios\.|api\./g) || [];

    // Infer functional requirements from code patterns
    if (content.includes('export') && content.includes('page')) {
      analysis.functional.push(`User can access ${path.basename(filePath, '.tsx')} page`);
    }

    if (eventHandlers.length > 0) {
      analysis.functional.push(`User can interact with ${eventHandlers.length} interface elements`);
    }

    if (apiCalls.length > 0) {
      analysis.functional.push(`Page loads data from ${apiCalls.length} API endpoints`);
      analysis.performance.push(`API calls should complete within acceptable timeframe`);
    }

    // Trading-specific business rules
    if (content.includes('profit') || content.includes('loss')) {
      analysis.businessRules.push('System must accurately calculate profit/loss');
    }

    if (content.includes('trade') && content.includes('price')) {
      analysis.businessRules.push('Trade prices must be validated for accuracy');
    }

    // Mobile responsiveness
    if (content.includes('mobile') || content.includes('responsive') || content.includes('md:')) {
      analysis.functional.push('Interface must be mobile responsive');
    }

    // Accessibility
    if (content.includes('aria-') || content.includes('alt=')) {
      analysis.accessibility.push('Interface includes accessibility features');
    }

    return analysis;
  }

  /**
   * Parse project documentation
   */
  async parseDocumentation() {
    try {
      const docPatterns = [
        'README.md',
        'CLAUDE.md',
        'docs/**/*.md',
        '*.md'
      ];

      const docFiles = [];
      for (const pattern of docPatterns) {
        try {
          const matches = await glob(pattern, { cwd: this.projectRoot });
          docFiles.push(...matches.map(f => path.join(this.projectRoot, f)));
        } catch (error) {
          // Continue with other patterns
        }
      }

      const analysis = this.getEmptyAnalysis('documentation');

      for (const docFile of docFiles.slice(0, 5)) { // Limit to avoid too many files
        try {
          const content = await fs.readFile(docFile, 'utf8');
          const docAnalysis = await this.analyzeDocContent(content, docFile);
          this.mergeAnalysis(analysis, docAnalysis);
        } catch (error) {
          console.warn(`⚠️ Could not read ${docFile}`);
        }
      }

      return analysis;
    } catch (error) {
      console.warn('⚠️ Documentation parsing failed:', error.message);
      return this.getEmptyAnalysis('documentation');
    }
  }

  /**
   * Analyze documentation content
   */
  async analyzeDocContent(content, filePath) {
    const analysis = this.getEmptyAnalysis('doc-analysis');
    
    // Extract requirements from markdown headers and bullet points
    const headers = content.match(/^#+\s+(.+)$/gm) || [];
    const bulletPoints = content.match(/^[-*+]\s+(.+)$/gm) || [];
    
    // Look for user stories and features
    const userStoryPatterns = [
      /as a .+ i want .+ so that/gi,
      /user can .+/gi,
      /should be able to .+/gi,
      /must .+/gi,
      /feature:? .+/gi
    ];

    for (const pattern of userStoryPatterns) {
      const matches = content.match(pattern) || [];
      analysis.functional.push(...matches.map(m => m.trim()));
    }

    // Extract business rules
    const businessRulePatterns = [
      /rule:? .+/gi,
      /validation:? .+/gi,
      /constraint:? .+/gi,
      /requirement:? .+/gi
    ];

    for (const pattern of businessRulePatterns) {
      const matches = content.match(pattern) || [];
      analysis.businessRules.push(...matches.map(m => m.trim()));
    }

    // Performance requirements
    if (content.includes('performance') || content.includes('speed') || content.includes('load time')) {
      analysis.performance.push('System must meet performance requirements');
    }

    return analysis;
  }

  /**
   * Load existing requirements from previous runs
   */
  async loadExistingRequirements(pageName) {
    try {
      const requirementsPath = path.join(
        this.projectRoot, 
        'ai-test-framework', 
        'test-cases', 
        `${pageName}-requirements.json`
      );
      
      const content = await fs.readFile(requirementsPath, 'utf8');
      const existing = JSON.parse(content);
      
      return {
        source: 'existing-requirements',
        ...existing.requirements || this.getEmptyAnalysis('existing-requirements')
      };
    } catch (error) {
      return this.getEmptyAnalysis('existing-requirements');
    }
  }

  /**
   * Analyze user interactions from event handlers
   */
  async analyzeUserInteractions(pageName, pageUrl) {
    try {
      const pageFiles = await this.findPageFiles(pageName);
      const analysis = this.getEmptyAnalysis('user-interactions');

      for (const file of pageFiles) {
        const content = await fs.readFile(file, 'utf8');
        
        // Extract event handlers and form interactions
        const clickHandlers = content.match(/onClick\s*=\s*\{[^}]+\}/g) || [];
        const formSubmits = content.match(/onSubmit\s*=\s*\{[^}]+\}/g) || [];
        const inputHandlers = content.match(/onChange\s*=\s*\{[^}]+\}/g) || [];
        const keyHandlers = content.match(/onKey\w+\s*=\s*\{[^}]+\}/g) || [];

        // Infer user workflows
        if (clickHandlers.length > 0) {
          analysis.userWorkflows.push(`User can click ${clickHandlers.length} interactive elements`);
        }

        if (formSubmits.length > 0) {
          analysis.userWorkflows.push(`User can submit ${formSubmits.length} forms`);
        }

        if (inputHandlers.length > 0) {
          analysis.userWorkflows.push(`User can input data in ${inputHandlers.length} fields`);
        }

        if (keyHandlers.length > 0) {
          analysis.userWorkflows.push(`User can use keyboard shortcuts`);
        }
      }

      return analysis;
    } catch (error) {
      return this.getEmptyAnalysis('user-interactions');
    }
  }

  /**
   * Infer requirements from test history
   */
  async inferFromTestHistory(pageName) {
    try {
      const testHistoryPath = path.join(
        this.projectRoot,
        'ai-test-framework',
        'reports',
        'test-results.json'
      );

      const content = await fs.readFile(testHistoryPath, 'utf8');
      const testResults = JSON.parse(content);
      
      const analysis = this.getEmptyAnalysis('test-history');
      
      // Analyze test failures to infer missing requirements
      const pageTests = testResults.tests?.filter(t => 
        t.title.toLowerCase().includes(pageName.toLowerCase())
      ) || [];

      const failedTests = pageTests.filter(t => t.status === 'failed');
      
      if (failedTests.length > 0) {
        analysis.functional.push('Fix previously failing test scenarios');
        analysis.businessRules.push('Ensure all critical functionality works reliably');
      }

      return analysis;
    } catch (error) {
      return this.getEmptyAnalysis('test-history');
    }
  }

  /**
   * Merge requirements from multiple sources
   */
  mergeRequirements(sources) {
    const merged = {
      sources: sources.map(s => s.source).filter(Boolean),
      lastUpdated: new Date().toISOString(),
      functional: [],
      businessRules: [],
      userWorkflows: [],
      performance: [],
      accessibility: []
    };

    for (const source of sources) {
      if (source.functional) merged.functional.push(...source.functional);
      if (source.businessRules) merged.businessRules.push(...source.businessRules);
      if (source.userWorkflows) merged.userWorkflows.push(...source.userWorkflows);
      if (source.performance) merged.performance.push(...source.performance);
      if (source.accessibility) merged.accessibility.push(...source.accessibility);
    }

    // Deduplicate requirements
    for (const key of ['functional', 'businessRules', 'userWorkflows', 'performance', 'accessibility']) {
      merged[key] = [...new Set(merged[key])].filter(req => req && req.trim().length > 0);
    }

    return merged;
  }

  /**
   * Merge analysis objects
   */
  mergeAnalysis(target, source) {
    for (const key of ['functional', 'businessRules', 'userWorkflows', 'performance', 'accessibility']) {
      if (source[key]) {
        target[key].push(...source[key]);
      }
    }
  }

  /**
   * Get empty analysis structure
   */
  getEmptyAnalysis(source) {
    return {
      source,
      functional: [],
      businessRules: [],
      userWorkflows: [],
      performance: [],
      accessibility: []
    };
  }
}

module.exports = { RequirementsDiscovery };