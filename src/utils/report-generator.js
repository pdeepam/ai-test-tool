const fs = require('fs').promises;
const path = require('path');

class ReportGenerator {
  constructor() {
    this.timestamp = new Date();
    this.reportId = `report-${this.timestamp.toISOString().slice(0, 19).replace(/[:.]/g, '-')}`;
  }

  /**
   * Generate comprehensive HTML report
   */
  async generateHTMLReport(testResults, screenshots, analysisResults = []) {
    const reportDir = `./ai-test-framework/reports/${this.reportId}`;
    await fs.mkdir(reportDir, { recursive: true });

    const htmlContent = this.createHTMLContent(testResults, screenshots, analysisResults);
    const reportPath = path.join(reportDir, 'index.html');
    
    await fs.writeFile(reportPath, htmlContent);
    
    // Copy screenshots to report directory
    await this.copyScreenshots(screenshots, reportDir);
    
    return {
      reportPath,
      reportDir,
      reportId: this.reportId,
      timestamp: this.timestamp
    };
  }

  /**
   * Create HTML report content
   */
  createHTMLContent(testResults, screenshots, analysisResults) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Test Framework Report - ${this.timestamp.toLocaleDateString()}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
        .header { background: #2563eb; color: white; padding: 2rem; text-align: center; }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .stat-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-number { font-size: 2rem; font-weight: bold; color: #2563eb; }
        .stat-label { color: #6b7280; margin-top: 0.5rem; }
        .section { background: white; margin-bottom: 2rem; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .section-header { background: #f8fafc; padding: 1rem 1.5rem; border-bottom: 1px solid #e5e7eb; font-weight: 600; }
        .section-content { padding: 1.5rem; }
        .screenshot-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; }
        .screenshot-card { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
        .screenshot-card img { width: 100%; height: auto; display: block; }
        .screenshot-info { padding: 1rem; background: #f8fafc; }
        .screenshot-title { font-weight: 600; margin-bottom: 0.5rem; }
        .screenshot-meta { font-size: 0.875rem; color: #6b7280; }
        .test-result { margin-bottom: 1rem; padding: 1rem; border-left: 4px solid #10b981; background: #f0fdf4; border-radius: 0 4px 4px 0; }
        .test-result.error { border-left-color: #ef4444; background: #fef2f2; }
        .test-name { font-weight: 600; margin-bottom: 0.5rem; }
        .test-meta { font-size: 0.875rem; color: #6b7280; }
        .analysis-section { margin-top: 1rem; padding: 1rem; background: #fef3c7; border-radius: 4px; }
        .analysis-title { font-weight: 600; color: #92400e; margin-bottom: 0.5rem; }
        .analysis-content { color: #78350f; line-height: 1.6; }
        .timestamp { text-align: center; color: #6b7280; margin-top: 2rem; font-size: 0.875rem; }
        .nav-tabs { display: flex; background: #f8fafc; border-bottom: 1px solid #e5e7eb; }
        .nav-tab { padding: 1rem 1.5rem; cursor: pointer; border-bottom: 2px solid transparent; }
        .nav-tab.active { border-bottom-color: #2563eb; background: white; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .severity-critical { border-left-color: #dc2626; background: #fef2f2; }
        .severity-high { border-left-color: #ea580c; background: #fff7ed; }
        .severity-medium { border-left-color: #d97706; background: #fffbeb; }
        .severity-low { border-left-color: #65a30d; background: #f7fee7; }
    </style>
</head>
<body>
    <div class="header">
        <h1>AI Test Framework Report</h1>
        <p>Trade Coach Web App • Generated on ${this.timestamp.toLocaleString()}</p>
    </div>

    <div class="container">
        <!-- Summary Statistics -->
        <div class="summary">
            <div class="stat-card">
                <div class="stat-number">${testResults.length}</div>
                <div class="stat-label">Tests Executed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${screenshots.length}</div>
                <div class="stat-label">Screenshots Captured</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${testResults.filter(t => t.status === 'completed').length}</div>
                <div class="stat-label">Successful Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${testResults.filter(t => t.consoleErrors?.length > 0 || t.pageErrors?.length > 0).length}</div>
                <div class="stat-label">Tests with Issues</div>
            </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="section">
            <div class="nav-tabs">
                <div class="nav-tab active" onclick="showTab('overview')">Overview</div>
                <div class="nav-tab" onclick="showTab('screenshots')">Screenshots</div>
                <div class="nav-tab" onclick="showTab('analysis')">AI Analysis</div>
                <div class="nav-tab" onclick="showTab('details')">Test Details</div>
            </div>

            <!-- Overview Tab -->
            <div id="overview" class="tab-content active">
                <div class="section-content">
                    <h3>Test Execution Summary</h3>
                    <div style="margin-top: 1rem;">
                        ${testResults.map(test => this.createTestSummaryHTML(test)).join('')}
                    </div>
                </div>
            </div>

            <!-- Screenshots Tab -->
            <div id="screenshots" class="tab-content">
                <div class="section-content">
                    <h3>Captured Screenshots</h3>
                    <div class="screenshot-grid" style="margin-top: 1rem;">
                        ${screenshots.map(screenshot => this.createScreenshotHTML(screenshot)).join('')}
                    </div>
                </div>
            </div>

            <!-- AI Analysis Tab -->
            <div id="analysis" class="tab-content">
                <div class="section-content">
                    <h3>AI Analysis Results</h3>
                    <div style="margin-top: 1rem;">
                        ${analysisResults.length > 0 ? 
                          analysisResults.map(analysis => this.createAnalysisHTML(analysis)).join('') :
                          '<p style="color: #6b7280; text-align: center; padding: 2rem;">No AI analysis results available. Screenshots are ready for manual review by Claude.</p>'
                        }
                    </div>
                </div>
            </div>

            <!-- Test Details Tab -->
            <div id="details" class="tab-content">
                <div class="section-content">
                    <h3>Detailed Test Results</h3>
                    <div style="margin-top: 1rem;">
                        ${testResults.map(test => this.createDetailedTestHTML(test)).join('')}
                    </div>
                </div>
            </div>
        </div>

        <div class="timestamp">
            Report ID: ${this.reportId} | Generated: ${this.timestamp.toISOString()}
        </div>
    </div>

    <script>
        function showTab(tabName) {
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Remove active class from all tabs
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected tab content
            document.getElementById(tabName).classList.add('active');
            
            // Add active class to selected tab
            event.target.classList.add('active');
        }
    </script>
</body>
</html>`;
  }

  createTestSummaryHTML(test) {
    const hasErrors = test.consoleErrors?.length > 0 || test.pageErrors?.length > 0;
    const statusClass = hasErrors ? 'error' : '';
    
    return `
        <div class="test-result ${statusClass}">
            <div class="test-name">${test.name}</div>
            <div class="test-meta">
                Duration: ${test.duration}ms | 
                URL: ${test.url} | 
                Viewport: ${test.viewport?.width}x${test.viewport?.height} |
                Screenshots: ${test.screenshots?.length || 0}
                ${hasErrors ? ` | Errors: ${(test.consoleErrors?.length || 0) + (test.pageErrors?.length || 0)}` : ''}
            </div>
        </div>
    `;
  }

  createScreenshotHTML(screenshot) {
    const relativeImagePath = `screenshots/${path.basename(screenshot.path)}`;
    
    return `
        <div class="screenshot-card">
            <img src="${relativeImagePath}" alt="${screenshot.name}" loading="lazy">
            <div class="screenshot-info">
                <div class="screenshot-title">${screenshot.name}</div>
                <div class="screenshot-meta">
                    ${screenshot.viewport?.width}x${screenshot.viewport?.height} | 
                    ${new Date(screenshot.timestamp).toLocaleTimeString()} |
                    Analysis Type: ${screenshot.analysisType}
                </div>
            </div>
        </div>
    `;
  }

  createAnalysisHTML(analysis) {
    const severityClass = `severity-${analysis.severity?.toLowerCase() || 'medium'}`;
    
    return `
        <div class="analysis-section ${severityClass}">
            <div class="analysis-title">${analysis.title || 'AI Analysis'}</div>
            <div class="analysis-content">${analysis.content || analysis.feedback}</div>
        </div>
    `;
  }

  createDetailedTestHTML(test) {
    return `
        <div class="test-result">
            <div class="test-name">${test.name}</div>
            <div class="test-meta">
                <strong>Status:</strong> ${test.status} | 
                <strong>Duration:</strong> ${test.duration}ms |
                <strong>Start:</strong> ${new Date(test.startTime).toLocaleTimeString()}
            </div>
            
            ${test.consoleErrors?.length > 0 ? `
                <div style="margin-top: 1rem;">
                    <strong>Console Errors:</strong>
                    <ul style="margin-left: 1rem; margin-top: 0.5rem;">
                        ${test.consoleErrors.map(error => `<li style="color: #dc2626;">${error.text}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${test.pageErrors?.length > 0 ? `
                <div style="margin-top: 1rem;">
                    <strong>Page Errors:</strong>
                    <ul style="margin-left: 1rem; margin-top: 0.5rem;">
                        ${test.pageErrors.map(error => `<li style="color: #dc2626;">${error.message}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${test.pageState?.quickChecks ? `
                <div style="margin-top: 1rem;">
                    <strong>Quick Checks:</strong>
                    ${test.pageState.quickChecks.smallTouchTargets?.length > 0 ? 
                      `<div style="color: #ea580c;">⚠️ ${test.pageState.quickChecks.smallTouchTargets.length} small touch targets found</div>` : ''}
                    ${test.pageState.quickChecks.missingAltText?.length > 0 ? 
                      `<div style="color: #ea580c;">⚠️ ${test.pageState.quickChecks.missingAltText.length} images missing alt text</div>` : ''}
                    ${test.pageState.quickChecks.unlabeledInputs?.length > 0 ? 
                      `<div style="color: #ea580c;">⚠️ ${test.pageState.quickChecks.unlabeledInputs.length} unlabeled form inputs</div>` : ''}
                </div>
            ` : ''}
        </div>
    `;
  }

  /**
   * Copy screenshots to report directory
   */
  async copyScreenshots(screenshots, reportDir) {
    const screenshotDir = path.join(reportDir, 'screenshots');
    await fs.mkdir(screenshotDir, { recursive: true });

    for (const screenshot of screenshots) {
      if (await this.fileExists(screenshot.path)) {
        const fileName = path.basename(screenshot.path);
        const destinationPath = path.join(screenshotDir, fileName);
        await fs.copyFile(screenshot.path, destinationPath);
      }
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate JSON report for programmatic access
   */
  async generateJSONReport(testResults, screenshots, analysisResults = []) {
    const reportData = {
      metadata: {
        reportId: this.reportId,
        timestamp: this.timestamp.toISOString(),
        generatedBy: 'AI Test Framework',
        project: 'Trade Coach Web App'
      },
      summary: {
        totalTests: testResults.length,
        successfulTests: testResults.filter(t => t.status === 'completed').length,
        testsWithErrors: testResults.filter(t => t.consoleErrors?.length > 0 || t.pageErrors?.length > 0).length,
        totalScreenshots: screenshots.length,
        averageDuration: testResults.reduce((sum, t) => sum + (t.duration || 0), 0) / testResults.length
      },
      testResults,
      screenshots: screenshots.map(s => ({
        ...s,
        relativePath: `screenshots/${path.basename(s.path)}`
      })),
      analysisResults
    };

    const reportDir = `./ai-test-framework/reports/${this.reportId}`;
    await fs.mkdir(reportDir, { recursive: true });
    
    const jsonPath = path.join(reportDir, 'report.json');
    await fs.writeFile(jsonPath, JSON.stringify(reportData, null, 2));
    
    return jsonPath;
  }
}

module.exports = { ReportGenerator };