/**
 * Adaptive Pattern Learner
 * Learns business logic patterns dynamically instead of hardcoding them
 */

const fs = require('fs').promises;
const path = require('path');

class AdaptivePatternLearner {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.patternsFile = path.join(projectRoot, 'ai-test-framework', 'learned-patterns.json');
    this.learnedPatterns = null;
  }

  /**
   * Learn business logic patterns from the actual codebase using Claude
   */
  async learnBusinessLogicPatterns(claudeAnalysisFunction) {
    console.log('🧠 Learning business logic patterns from your codebase...');
    
    // Step 1: Gather all business logic files
    const businessFiles = await this.findBusinessLogicFiles();
    
    // Step 2: Extract code samples for Claude to analyze
    const codeContext = await this.extractCodeContext(businessFiles);
    
    // Step 3: Ask Claude to identify patterns
    const patterns = await this.identifyPatternsWithClaude(codeContext, claudeAnalysisFunction);
    
    // Step 4: Save learned patterns
    await this.saveLearnedPatterns(patterns);
    
    this.learnedPatterns = patterns;
    
    console.log(`✅ Learned ${patterns.calculations.length} calculation patterns`);
    console.log(`✅ Learned ${patterns.validations.length} validation patterns`);
    console.log(`✅ Learned ${patterns.businessRules.length} business rule patterns`);
    
    return patterns;
  }

  /**
   * Find business logic files dynamically
   */
  async findBusinessLogicFiles() {
    const { glob } = require('glob');
    
    const patterns = [
      'src/**/*.{ts,js}',
      'lib/**/*.{ts,js}',
      'utils/**/*.{ts,js}',
      'services/**/*.{ts,js}',
      'hooks/**/*.{ts,js}'
    ];

    const allFiles = [];
    for (const pattern of patterns) {
      try {
        const files = await glob(pattern, { cwd: this.projectRoot });
        allFiles.push(...files.map(f => path.join(this.projectRoot, f)));
      } catch (error) {
        // Continue with other patterns
      }
    }

    // Filter for likely business logic files
    const businessFiles = [];
    for (const file of allFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        
        // Skip if file is too small or too large
        if (content.length < 100 || content.length > 50000) continue;
        
        // Skip test files, config files, etc.
        if (this.shouldSkipFile(file, content)) continue;
        
        // Include if likely contains business logic
        if (this.likelyContainsBusinessLogic(content)) {
          businessFiles.push(file);
        }
      } catch (error) {
        // Skip files we can't read
      }
    }

    return businessFiles.slice(0, 20); // Limit to avoid overwhelming Claude
  }

  /**
   * Check if file should be skipped
   */
  shouldSkipFile(filePath, content) {
    const skipPatterns = [
      /\.test\.|\.spec\./,
      /config|setup|index\.js$/,
      /node_modules/,
      /\.d\.ts$/,
      /tailwind|postcss/
    ];

    return skipPatterns.some(pattern => pattern.test(filePath)) ||
           content.includes('jest') ||
           content.includes('describe(') ||
           content.includes('test(');
  }

  /**
   * Check if content likely contains business logic
   */
  likelyContainsBusinessLogic(content) {
    // Dynamic indicators of business logic
    const indicators = [
      'function',
      'const',
      'class',
      'export',
      'calculate',
      'validate',
      'process',
      'transform',
      'format',
      'parse'
    ];

    const indicatorCount = indicators.filter(indicator => 
      content.toLowerCase().includes(indicator)
    ).length;

    return indicatorCount >= 3;
  }

  /**
   * Extract code context for Claude analysis
   */
  async extractCodeContext(businessFiles) {
    const context = {
      totalFiles: businessFiles.length,
      codeExamples: [],
      functionSignatures: [],
      typeDefinitions: [],
      imports: []
    };

    for (const file of businessFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        const relativePath = path.relative(this.projectRoot, file);
        
        // Extract function signatures
        const functions = this.extractFunctions(content);
        context.functionSignatures.push(...functions.map(f => ({
          ...f,
          file: relativePath
        })));

        // Extract type definitions
        const types = this.extractTypes(content);
        context.typeDefinitions.push(...types.map(t => ({
          ...t,
          file: relativePath
        })));

        // Extract imports to understand dependencies
        const imports = this.extractImports(content);
        context.imports.push(...imports.map(i => ({
          ...i,
          file: relativePath
        })));

        // Include small code samples
        if (content.length < 2000) {
          context.codeExamples.push({
            file: relativePath,
            content: content.substring(0, 1500) // Limit size
          });
        }

      } catch (error) {
        // Skip problematic files
      }
    }

    return context;
  }

  /**
   * Extract function signatures and names
   */
  extractFunctions(content) {
    const functions = [];
    
    // Function declarations
    const functionMatches = content.matchAll(/function\s+(\w+)\s*\([^)]*\)/g);
    for (const match of functionMatches) {
      functions.push({
        name: match[1],
        type: 'function',
        signature: match[0]
      });
    }

    // Arrow functions and const functions
    const arrowMatches = content.matchAll(/(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g);
    for (const match of arrowMatches) {
      functions.push({
        name: match[1],
        type: 'arrow',
        signature: match[0]
      });
    }

    return functions;
  }

  /**
   * Extract type definitions
   */
  extractTypes(content) {
    const types = [];
    
    // Interface definitions
    const interfaceMatches = content.matchAll(/interface\s+(\w+)\s*\{[^}]*\}/gs);
    for (const match of interfaceMatches) {
      types.push({
        name: match[1],
        type: 'interface',
        definition: match[0]
      });
    }

    // Type definitions
    const typeMatches = content.matchAll(/type\s+(\w+)\s*=\s*[^;]+/g);
    for (const match of typeMatches) {
      types.push({
        name: match[1],
        type: 'type',
        definition: match[0]
      });
    }

    return types;
  }

  /**
   * Extract import statements
   */
  extractImports(content) {
    const imports = [];
    
    const importMatches = content.matchAll(/import\s+[^;]+from\s+['"`]([^'"`]+)['"`]/g);
    for (const match of importMatches) {
      imports.push({
        module: match[1],
        statement: match[0]
      });
    }

    return imports;
  }

  /**
   * Use Claude to identify patterns from code context
   */
  async identifyPatternsWithClaude(codeContext, claudeAnalysisFunction) {
    const prompt = `You are analyzing a codebase to learn business logic patterns for automated test generation. Based on the code context below, identify patterns that indicate different types of business logic.

CODE CONTEXT:
${JSON.stringify(codeContext, null, 2)}

ANALYZE AND IDENTIFY:

1. **CALCULATION PATTERNS** - Function names, variable names, and code patterns that indicate mathematical calculations
2. **VALIDATION PATTERNS** - Patterns that indicate data validation, input checking, or rule enforcement  
3. **BUSINESS RULE PATTERNS** - Domain-specific logic patterns unique to this application
4. **API PATTERNS** - Patterns that indicate API endpoints, data fetching, or external integrations
5. **DATA TRANSFORMATION PATTERNS** - Patterns for data processing, formatting, or conversion

For each pattern category, provide:
- Regular expressions that would match the pattern
- Keywords or function names that indicate this pattern
- Context clues (file locations, import statements, etc.)
- Confidence level (high/medium/low)

FOCUS ON:
- Learning from actual function names and variable names in the code
- Understanding the domain from type definitions
- Identifying unique business logic vs generic utility functions
- Creating patterns that will evolve with the codebase

RESPONSE FORMAT (JSON):
{
  "calculations": [
    {
      "name": "Price Calculations",
      "patterns": ["calculatePrice", "computeTotal", "*Price*", "*Cost*"],
      "regex": "(?i)(calculate|compute|get).*(price|cost|total|amount)",
      "confidence": "high",
      "context": "Found in trading/financial functions"
    }
  ],
  "validations": [
    {
      "name": "Input Validation",
      "patterns": ["validate*", "check*", "*Valid", "isValid*"],
      "regex": "(?i)(validate|check|verify|is.*valid)",
      "confidence": "high", 
      "context": "Input checking functions"
    }
  ],
  "businessRules": [
    {
      "name": "Trading Rules",
      "patterns": ["*Trade*", "*Position*", "*Portfolio*"],
      "regex": "(?i)(trade|position|portfolio|order)",
      "confidence": "medium",
      "context": "Domain-specific trading logic"
    }
  ],
  "apiPatterns": [
    {
      "name": "Data Fetching",
      "patterns": ["fetch*", "get*", "*Api", "load*"],
      "regex": "(?i)(fetch|get|load|api|endpoint)",
      "confidence": "high",
      "context": "API and data access functions"
    }
  ],
  "dataTransformations": [
    {
      "name": "Data Formatting",
      "patterns": ["format*", "parse*", "convert*", "transform*"],
      "regex": "(?i)(format|parse|convert|transform|map)",
      "confidence": "high",
      "context": "Data processing functions"
    }
  ]
}

Return ONLY the JSON object with learned patterns.`;

    const response = await claudeAnalysisFunction(prompt);
    
    try {
      let cleaned = response.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      }
      
      return JSON.parse(cleaned);
    } catch (error) {
      console.warn('⚠️ Failed to parse Claude response, using fallback patterns');
      return this.getFallbackPatterns();
    }
  }

  /**
   * Save learned patterns for future use
   */
  async saveLearnedPatterns(patterns) {
    const patternsData = {
      version: '1.0.0',
      lastLearned: new Date().toISOString(),
      projectFingerprint: await this.getProjectFingerprint(),
      patterns,
      metadata: {
        totalPatterns: Object.values(patterns).reduce((sum, arr) => sum + arr.length, 0),
        learningSource: 'codebase-analysis',
        confidence: 'claude-generated'
      }
    };

    await fs.mkdir(path.dirname(this.patternsFile), { recursive: true });
    await fs.writeFile(this.patternsFile, JSON.stringify(patternsData, null, 2));
  }

  /**
   * Load previously learned patterns
   */
  async loadLearnedPatterns() {
    try {
      const content = await fs.readFile(this.patternsFile, 'utf8');
      const data = JSON.parse(content);
      
      // Check if patterns are still relevant (project hasn't changed too much)
      const currentFingerprint = await this.getProjectFingerprint();
      if (data.projectFingerprint !== currentFingerprint) {
        console.log('🔄 Project has changed, patterns may need updating');
      }
      
      this.learnedPatterns = data.patterns;
      return data.patterns;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get project fingerprint to detect changes
   */
  async getProjectFingerprint() {
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageContent = await fs.readFile(packageJsonPath, 'utf8');
      const pkg = JSON.parse(packageContent);
      
      // Simple fingerprint based on dependencies
      const deps = Object.keys(pkg.dependencies || {}).sort().join(',');
      const devDeps = Object.keys(pkg.devDependencies || {}).sort().join(',');
      
      return Buffer.from(deps + '|' + devDeps).toString('base64').substring(0, 20);
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Apply learned patterns to analyze code
   */
  async analyzeCodeWithLearnedPatterns(content, filePath) {
    if (!this.learnedPatterns) {
      this.learnedPatterns = await this.loadLearnedPatterns();
    }

    if (!this.learnedPatterns) {
      return this.getFallbackAnalysis();
    }

    const analysis = {
      calculations: [],
      validations: [],
      businessRules: [],
      apiPatterns: [],
      dataTransformations: []
    };

    // Apply learned patterns
    for (const [category, patterns] of Object.entries(this.learnedPatterns)) {
      if (!analysis[category]) analysis[category] = [];
      
      for (const pattern of patterns) {
        try {
          const regex = new RegExp(pattern.regex, 'gi');
          const matches = content.match(regex) || [];
          
          if (matches.length > 0) {
            analysis[category].push({
              pattern: pattern.name,
              matches: matches.length,
              confidence: pattern.confidence,
              file: filePath,
              examples: matches.slice(0, 3) // Limit examples
            });
          }
        } catch (error) {
          // Skip invalid regex patterns
        }
      }
    }

    return analysis;
  }

  /**
   * Fallback patterns if learning fails
   */
  getFallbackPatterns() {
    return {
      calculations: [
        {
          name: "Generic Calculations",
          patterns: ["calculate", "compute", "total", "sum"],
          regex: "(?i)(calculate|compute|total|sum)",
          confidence: "low",
          context: "Generic calculation patterns"
        }
      ],
      validations: [
        {
          name: "Generic Validation",
          patterns: ["validate", "check", "verify"],
          regex: "(?i)(validate|check|verify)",
          confidence: "low",
          context: "Generic validation patterns"
        }
      ],
      businessRules: [],
      apiPatterns: [
        {
          name: "Generic API",
          patterns: ["api", "fetch", "get", "post"],
          regex: "(?i)(api|fetch|get|post)",
          confidence: "low",
          context: "Generic API patterns"
        }
      ],
      dataTransformations: [
        {
          name: "Generic Transformations",
          patterns: ["format", "parse", "convert"],
          regex: "(?i)(format|parse|convert)",
          confidence: "low",
          context: "Generic transformation patterns"
        }
      ]
    };
  }

  /**
   * Fallback analysis for when patterns aren't loaded
   */
  getFallbackAnalysis() {
    return {
      calculations: [],
      validations: [],
      businessRules: [],
      apiPatterns: [],
      dataTransformations: []
    };
  }

  /**
   * Update patterns based on new code changes
   */
  async updatePatternsForNewCode(newFiles, claudeAnalysisFunction) {
    if (!this.learnedPatterns) {
      return await this.learnBusinessLogicPatterns(claudeAnalysisFunction);
    }

    console.log('🔄 Updating patterns for new code changes...');
    
    // Analyze new files
    const newContext = await this.extractCodeContext(newFiles);
    
    // Ask Claude to update existing patterns
    const updatedPatterns = await this.updatePatternsWithClaude(
      this.learnedPatterns,
      newContext,
      claudeAnalysisFunction
    );

    await this.saveLearnedPatterns(updatedPatterns);
    this.learnedPatterns = updatedPatterns;
    
    return updatedPatterns;
  }

  /**
   * Update patterns with Claude's help
   */
  async updatePatternsWithClaude(existingPatterns, newContext, claudeAnalysisFunction) {
    const prompt = `You are updating learned business logic patterns based on new code. 

EXISTING PATTERNS:
${JSON.stringify(existingPatterns, null, 2)}

NEW CODE CONTEXT:
${JSON.stringify(newContext, null, 2)}

TASK:
1. Keep all existing patterns that are still relevant
2. Add new patterns discovered in the new code
3. Update pattern confidence based on new evidence
4. Remove patterns that seem outdated or incorrect

Return updated patterns in the same JSON format.`;

    const response = await claudeAnalysisFunction(prompt);
    
    try {
      let cleaned = response.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      }
      
      return JSON.parse(cleaned);
    } catch (error) {
      console.warn('⚠️ Failed to update patterns, keeping existing ones');
      return existingPatterns;
    }
  }
}

module.exports = { AdaptivePatternLearner };