module.exports = {
  // Test execution settings
  baseURL: 'http://localhost:3000',
  
  // Viewport configurations for responsive testing
  viewports: {
    mobile: { width: 375, height: 812, deviceScaleFactor: 2 },
    tablet: { width: 768, height: 1024, deviceScaleFactor: 2 },
    desktop: { width: 1920, height: 1080, deviceScaleFactor: 1 }
  },

  // Analysis configuration
  analysis: {
    accessibility: { 
      enabled: true, 
      wcagLevel: 'AA',
      checks: ['color-contrast', 'keyboard-navigation', 'aria-labels', 'heading-hierarchy']
    },
    performance: { 
      enabled: true, 
      budgets: { 
        lcp: 2500,      // Largest Contentful Paint (ms)
        fid: 100,       // First Input Delay (ms)
        cls: 0.1,       // Cumulative Layout Shift
        fcp: 1800       // First Contentful Paint (ms)
      }
    },
    usability: { 
      enabled: true, 
      minTouchTarget: 44,  // Minimum touch target size (px)
      maxTextLength: 60,   // Max line length for readability
      contrastRatio: 4.5   // WCAG AA contrast ratio
    },
    visual: {
      enabled: true,
      checkOverlaps: true,
      checkTruncation: true,
      checkResponsive: true
    }
  },

  // Screenshot and reporting settings
  reporting: {
    format: ['html', 'json'],
    screenshots: true,
    screenshotOnFailure: true,
    fullPageScreenshots: true,
    verbosity: 'detailed',
    outputDir: './ai-test-framework/reports'
  },

  // Claude analysis prompts and settings
  claude: {
    analysisPrompts: {
      general: `Analyze this screenshot of a web application for usability, accessibility, and visual design issues. 
                Provide specific, actionable feedback on:
                1. Layout and visual hierarchy
                2. Accessibility concerns (contrast, touch targets, labels)
                3. User experience issues
                4. Mobile responsiveness problems
                5. Content clarity and readability
                
                Format your response as structured feedback with severity levels (Critical, High, Medium, Low).`,
      
      mobile: `Analyze this mobile view screenshot specifically for:
               1. Touch target sizes (minimum 44px)
               2. Text readability on small screens
               3. Navigation accessibility with thumbs
               4. Content truncation or overflow
               5. Responsive design effectiveness`,
      
      accessibility: `Focus on accessibility issues in this screenshot:
                      1. Color contrast problems
                      2. Missing or unclear labels
                      3. Keyboard navigation indicators
                      4. Focus states visibility
                      5. Information hierarchy for screen readers`
    }
  },

  // Test patterns and pages to analyze
  testPages: [
    { path: '/', name: 'Homepage', critical: true },
    { path: '/login', name: 'Login', critical: true },
    { path: '/register', name: 'Register', critical: true },
    { path: '/dashboard', name: 'Dashboard', critical: true },
    { path: '/trades', name: 'Trades List', critical: true },
    { path: '/trades/charts', name: 'Charts', critical: false },
    { path: '/settings', name: 'Settings', critical: false }
  ],

  // Playwright specific settings
  playwright: {
    timeout: 30000,
    actionTimeout: 10000,
    navigationTimeout: 30000,
    expectTimeout: 5000
  }
};