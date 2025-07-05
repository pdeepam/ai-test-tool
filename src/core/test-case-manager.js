/**
 * Intelligent Test Case Manager
 * Manages incremental test case evolution without rewriting from scratch
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class TestCaseManager {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.testCasesDir = path.join(projectRoot, 'ai-test-framework', 'test-cases');
    this.versionsDir = path.join(this.testCasesDir, 'versions');
  }

  /**
   * Initialize test case storage directories
   */
  async initialize() {
    await fs.mkdir(this.testCasesDir, { recursive: true });
    await fs.mkdir(this.versionsDir, { recursive: true });
  }

  /**
   * Update test cases incrementally based on new requirements
   */
  async updateTestCases(pageName, newRequirements, claudeAnalysisFunction) {
    await this.initialize();
    
    console.log(`🔄 Updating test cases for ${pageName}...`);
    
    const existing = await this.loadExistingTestCases(pageName);
    const currentVersion = this.getNextVersion(existing.version);
    
    // Create backup before updating
    if (existing.testCases.length > 0) {
      await this.createBackup(pageName, existing);
    }

    const prompt = this.buildUpdatePrompt(existing, newRequirements);
    const updatedTestCases = await claudeAnalysisFunction(prompt);
    
    const result = {
      version: currentVersion,
      lastUpdated: new Date().toISOString(),
      pageName: pageName,
      requirements: {
        sources: newRequirements.sources || [],
        lastAnalyzed: new Date().toISOString(),
        functional: newRequirements.functional || [],
        businessRules: newRequirements.businessRules || [],
        userWorkflows: newRequirements.userWorkflows || [],
        performance: newRequirements.performance || [],
        accessibility: newRequirements.accessibility || []
      },
      testCases: this.parseAndValidateTestCases(updatedTestCases, existing),
      metadata: {
        totalTestCases: 0,
        newTestCases: 0,
        updatedTestCases: 0,
        deprecatedTestCases: 0,
        changesSummary: []
      }
    };

    // Calculate metadata
    result.metadata = this.calculateMetadata(existing, result);
    
    await this.saveTestCases(pageName, result);
    
    console.log(`✅ Test cases updated for ${pageName}`);
    console.log(`   📊 Total: ${result.metadata.totalTestCases}`);
    console.log(`   🆕 New: ${result.metadata.newTestCases}`);
    console.log(`   📝 Updated: ${result.metadata.updatedTestCases}`);
    console.log(`   ❌ Deprecated: ${result.metadata.deprecatedTestCases}`);
    
    return result;
  }

  /**
   * Build prompt for Claude to update test cases intelligently
   */
  buildUpdatePrompt(existing, newRequirements) {
    return `You are an expert test case manager. Your job is to UPDATE existing test cases intelligently, not rewrite them from scratch.

EXISTING TEST CASES (v${existing.version}):
${JSON.stringify(existing.testCases, null, 2)}

NEW/UPDATED REQUIREMENTS:
${JSON.stringify(newRequirements, null, 2)}

INSTRUCTIONS:
1. PRESERVE all existing test cases that are still valid
2. UPDATE test cases that need modification based on new requirements  
3. ADD new test cases for new requirements only
4. MARK test cases as [DEPRECATED] if no longer relevant (don't delete)
5. MAINTAIN test case IDs for tracking (format: ${existing.pageName?.toUpperCase() || 'PAGE'}-XXX)
6. ADD "status" field: "active", "updated", "new", "deprecated"
7. ADD "changes" field for updated test cases explaining what changed
8. PRESERVE "addedIn" version and update "lastModified" version

RESPONSE FORMAT (JSON only, no markdown):
[
  {
    "id": "DASH-001",
    "title": "User can view recent trades",
    "description": "Verify user can see list of recent trading activity",
    "priority": "high",
    "category": "functional",
    "status": "active",
    "addedIn": "1.0.0",
    "lastModified": "1.0.0",
    "steps": [
      "Navigate to dashboard",
      "Verify trades list is visible",
      "Check trade data accuracy"
    ],
    "expectedResult": "Recent trades displayed correctly",
    "tags": ["dashboard", "trades", "ui"]
  }
]

Focus on:
- Trading application business logic
- Mobile responsiveness 
- Performance requirements
- User workflows and interactions
- Accessibility compliance
- Error handling and edge cases

Return ONLY the JSON array of test cases.`;
  }

  /**
   * Parse and validate test cases from Claude response
   */
  parseAndValidateTestCases(claudeResponse, existing) {
    try {
      // Clean up Claude response (remove markdown formatting if present)
      let cleaned = claudeResponse.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      }
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleaned);
      
      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }

      // Validate and enhance test cases
      return parsed.map((testCase, index) => {
        const validated = {
          id: testCase.id || `${existing.pageName?.toUpperCase() || 'PAGE'}-${String(index + 1).padStart(3, '0')}`,
          title: testCase.title || 'Untitled Test Case',
          description: testCase.description || '',
          priority: testCase.priority || 'medium',
          category: testCase.category || 'functional',
          status: testCase.status || 'new',
          addedIn: testCase.addedIn || this.getNextVersion(existing.version),
          lastModified: testCase.lastModified || this.getNextVersion(existing.version),
          steps: Array.isArray(testCase.steps) ? testCase.steps : ['Add test steps'],
          expectedResult: testCase.expectedResult || 'Define expected result',
          tags: Array.isArray(testCase.tags) ? testCase.tags : [],
          changes: testCase.changes || null
        };

        return validated;
      });

    } catch (error) {
      console.error('❌ Failed to parse test cases from Claude:', error.message);
      console.log('Raw response:', claudeResponse);
      
      // Return existing test cases with minimal changes if parsing fails
      return existing.testCases.map(tc => ({
        ...tc,
        lastModified: this.getNextVersion(existing.version)
      }));
    }
  }

  /**
   * Load existing test cases
   */
  async loadExistingTestCases(pageName) {
    try {
      const filePath = path.join(this.testCasesDir, `${pageName}-test-cases.json`);
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      // Return empty structure for new pages
      return {
        version: '0.0.0',
        lastUpdated: new Date().toISOString(),
        pageName: pageName,
        requirements: {},
        testCases: [],
        metadata: {
          totalTestCases: 0,
          newTestCases: 0,
          updatedTestCases: 0,
          deprecatedTestCases: 0,
          changesSummary: []
        }
      };
    }
  }

  /**
   * Save test cases with versioning
   */
  async saveTestCases(pageName, testCaseData) {
    const filePath = path.join(this.testCasesDir, `${pageName}-test-cases.json`);
    await fs.writeFile(filePath, JSON.stringify(testCaseData, null, 2));
    
    // Save version snapshot
    const versionPath = path.join(this.versionsDir, `${pageName}-v${testCaseData.version}.json`);
    await fs.writeFile(versionPath, JSON.stringify(testCaseData, null, 2));
    
    // Save requirements separately for easier access
    const requirementsPath = path.join(this.testCasesDir, `${pageName}-requirements.json`);
    await fs.writeFile(requirementsPath, JSON.stringify({
      version: testCaseData.version,
      lastUpdated: testCaseData.lastUpdated,
      requirements: testCaseData.requirements
    }, null, 2));
  }

  /**
   * Create backup before updating
   */
  async createBackup(pageName, existing) {
    const backupDir = path.join(this.testCasesDir, 'backups');
    await fs.mkdir(backupDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `${pageName}-backup-${timestamp}.json`);
    
    await fs.writeFile(backupPath, JSON.stringify(existing, null, 2));
  }

  /**
   * Calculate metadata about changes
   */
  calculateMetadata(existing, updated) {
    const existingIds = new Set(existing.testCases.map(tc => tc.id));
    const updatedIds = new Set(updated.testCases.map(tc => tc.id));
    
    const newTestCases = updated.testCases.filter(tc => 
      tc.status === 'new' || !existingIds.has(tc.id)
    ).length;
    
    const updatedTestCases = updated.testCases.filter(tc => 
      tc.status === 'updated' && existingIds.has(tc.id)
    ).length;
    
    const deprecatedTestCases = updated.testCases.filter(tc => 
      tc.status === 'deprecated'
    ).length;
    
    const changesSummary = updated.testCases
      .filter(tc => tc.changes)
      .map(tc => `${tc.id}: ${tc.changes}`);

    return {
      totalTestCases: updated.testCases.length,
      newTestCases,
      updatedTestCases,
      deprecatedTestCases,
      changesSummary
    };
  }

  /**
   * Get next semantic version
   */
  getNextVersion(currentVersion) {
    if (!currentVersion || currentVersion === '0.0.0') {
      return '1.0.0';
    }
    
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }

  /**
   * Get test case history for a page
   */
  async getTestCaseHistory(pageName) {
    try {
      const versionFiles = await fs.readdir(this.versionsDir);
      const pageVersions = versionFiles
        .filter(f => f.startsWith(`${pageName}-v`) && f.endsWith('.json'))
        .sort((a, b) => {
          const aVersion = a.match(/v(\d+\.\d+\.\d+)/)?.[1];
          const bVersion = b.match(/v(\d+\.\d+\.\d+)/)?.[1];
          return this.compareVersions(aVersion, bVersion);
        });

      const history = [];
      for (const versionFile of pageVersions) {
        const content = await fs.readFile(path.join(this.versionsDir, versionFile), 'utf8');
        const data = JSON.parse(content);
        history.push({
          version: data.version,
          lastUpdated: data.lastUpdated,
          totalTestCases: data.metadata?.totalTestCases || data.testCases?.length || 0,
          changes: data.metadata?.changesSummary || []
        });
      }

      return history;
    } catch (error) {
      return [];
    }
  }

  /**
   * Compare semantic versions
   */
  compareVersions(a, b) {
    if (!a) return -1;
    if (!b) return 1;
    
    const [aMajor, aMinor, aPatch] = a.split('.').map(Number);
    const [bMajor, bMinor, bPatch] = b.split('.').map(Number);
    
    if (aMajor !== bMajor) return aMajor - bMajor;
    if (aMinor !== bMinor) return aMinor - bMinor;
    return aPatch - bPatch;
  }

  /**
   * Export test cases to different formats
   */
  async exportTestCases(pageName, format = 'json') {
    const testCases = await this.loadExistingTestCases(pageName);
    
    switch (format) {
      case 'csv':
        return this.exportToCSV(testCases);
      case 'markdown':
        return this.exportToMarkdown(testCases);
      default:
        return JSON.stringify(testCases, null, 2);
    }
  }

  /**
   * Export to CSV format
   */
  exportToCSV(testCases) {
    const headers = ['ID', 'Title', 'Priority', 'Category', 'Status', 'Added In', 'Last Modified'];
    const rows = testCases.testCases.map(tc => [
      tc.id,
      `"${tc.title}"`,
      tc.priority,
      tc.category,
      tc.status,
      tc.addedIn,
      tc.lastModified
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Export to Markdown format
   */
  exportToMarkdown(testCases) {
    let md = `# Test Cases for ${testCases.pageName}\n\n`;
    md += `**Version:** ${testCases.version}\n`;
    md += `**Last Updated:** ${testCases.lastUpdated}\n`;
    md += `**Total Test Cases:** ${testCases.testCases.length}\n\n`;
    
    for (const tc of testCases.testCases) {
      md += `## ${tc.id}: ${tc.title}\n\n`;
      md += `- **Priority:** ${tc.priority}\n`;
      md += `- **Category:** ${tc.category}\n`;
      md += `- **Status:** ${tc.status}\n`;
      md += `- **Description:** ${tc.description}\n\n`;
      
      if (tc.steps && tc.steps.length > 0) {
        md += `**Steps:**\n`;
        tc.steps.forEach((step, index) => {
          md += `${index + 1}. ${step}\n`;
        });
        md += '\n';
      }
      
      md += `**Expected Result:** ${tc.expectedResult}\n\n`;
      
      if (tc.changes) {
        md += `**Recent Changes:** ${tc.changes}\n\n`;
      }
      
      md += '---\n\n';
    }
    
    return md;
  }
}

module.exports = { TestCaseManager };