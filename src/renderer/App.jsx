import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [appVersion, setAppVersion] = useState('Loading...');
  const [isReady, setIsReady] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [windowState, setWindowState] = useState({ isMaximized: false });
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    async function initializeApp() {
      try {
        const version = await window.electronAPI.getAppVersion();
        setAppVersion(version);
        
        const ready = await window.electronAPI.appReady();
        setIsReady(ready);

        // Get initial window state
        const state = await window.electronAPI.getWindowState();
        setWindowState(state || {});
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    }
    
    initializeApp();

    // Set up event listeners
    const removeWindowStateListener = window.electronAPI.onWindowStateChanged((event, state) => {
      console.log('Window state changed:', state);
      addNotification(`Window ${state}`, 'info');
    });

    const removeMenuActionListener = window.electronAPI.onMenuAction((event, action, ...args) => {
      console.log('Menu action received:', action, args);
      handleMenuAction(action, ...args);
    });

    // Cleanup listeners on unmount
    return () => {
      removeWindowStateListener();
      removeMenuActionListener();
    };
  }, []);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Auto-remove notification after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const handleMenuAction = (action, ...args) => {
    switch (action) {
      case 'new-test-case':
        setActiveTab('testcases');
        addNotification('New test case action triggered', 'success');
        break;
      case 'open-file':
        addNotification(`File selected: ${args[0]}`, 'info');
        break;
      default:
        addNotification(`Menu action: ${action}`, 'info');
    }
  };

  const handleWindowControl = async (action) => {
    try {
      switch (action) {
        case 'minimize':
          await window.electronAPI.minimizeWindow();
          break;
        case 'maximize':
          await window.electronAPI.maximizeWindow();
          break;
        case 'close':
          await window.electronAPI.closeWindow();
          break;
      }
    } catch (error) {
      console.error('Window control error:', error);
      addNotification('Window control failed', 'error');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'testcases':
        return <TestCasesTab />;
      case 'runtests':
        return <RunTestsTab />;
      case 'reports':
        return <ReportsTab />;
      default:
        return <DashboardTab />;
    }
  };

  if (!isReady) {
    return (
      <div className="loading-screen">
        <div className="logo">🤖</div>
        <h1>AI Test Tool</h1>
        <div className="version">Version {appVersion}</div>
        <div className="status loading">
          Initializing application...
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <span className="logo">🤖</span>
          <h1>AI Test Tool</h1>
          <span className="version">v{appVersion}</span>
        </div>
        <nav className="tab-navigation">
          <button 
            className={activeTab === 'dashboard' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={activeTab === 'testcases' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('testcases')}
          >
            Test Cases
          </button>
          <button 
            className={activeTab === 'runtests' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('runtests')}
          >
            Run Tests
          </button>
          <button 
            className={activeTab === 'reports' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('reports')}
          >
            Reports
          </button>
        </nav>
        <div className="window-controls">
          <button className="window-control" onClick={() => handleWindowControl('minimize')}>−</button>
          <button className="window-control" onClick={() => handleWindowControl('maximize')}>□</button>
          <button className="window-control close" onClick={() => handleWindowControl('close')}>×</button>
        </div>
      </header>
      
      <main className="app-main">
        {renderTabContent()}
      </main>

      {/* Notification system */}
      <div className="notifications">
        {notifications.map(notification => (
          <div key={notification.id} className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        ))}
      </div>
    </div>
  );
}

// Placeholder components for each tab
function DashboardTab() {
  const [ipcTestResult, setIpcTestResult] = useState('');

  const testIPC = async () => {
    try {
      const version = await window.electronAPI.getAppVersion();
      const ready = await window.electronAPI.appReady();
      const windowState = await window.electronAPI.getWindowState();
      
      setIpcTestResult(`✅ IPC Working!
App Version: ${version}
App Ready: ${ready}
Window State: ${JSON.stringify(windowState, null, 2)}`);
    } catch (error) {
      setIpcTestResult(`❌ IPC Error: ${error.message}`);
    }
  };

  return (
    <div className="tab-content">
      <h2>Dashboard</h2>
      <div className="dashboard-cards">
        <div className="card">
          <h3>Recent Tests</h3>
          <p>No tests run yet</p>
        </div>
        <div className="card">
          <h3>Test Cases</h3>
          <p>0 test cases created</p>
        </div>
        <div className="card">
          <h3>Reports</h3>
          <p>No reports generated</p>
        </div>
        <div className="card">
          <h3>IPC Communication Test</h3>
          <button onClick={testIPC} className="primary-btn">Test IPC</button>
          {ipcTestResult && (
            <pre className="ipc-result">{ipcTestResult}</pre>
          )}
        </div>
      </div>
    </div>
  );
}

function TestCasesTab() {
  const [testCases, setTestCases] = useState([
    {
      id: 'tc-1',
      name: 'Login Flow Test',
      description: 'Test user login functionality',
      status: 'pending',
      priority: 'high',
      lastRun: null
    },
    {
      id: 'tc-2', 
      name: 'Product Search Test',
      description: 'Test product search and filtering',
      status: 'passed',
      priority: 'medium',
      lastRun: '2024-01-15 10:30'
    },
    {
      id: 'tc-3',
      name: 'Checkout Process Test', 
      description: 'Test complete checkout workflow',
      status: 'failed',
      priority: 'high',
      lastRun: '2024-01-15 09:15'
    }
  ]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'running': return '⏳';
      default: return '⚪';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Test Cases</h2>
        <div className="tab-actions">
          <button className="primary-btn">+ New Test Case</button>
          <button className="secondary-btn">Import</button>
          <button className="secondary-btn">Export</button>
        </div>
      </div>
      
      <div className="test-cases-grid">
        {testCases.map(testCase => (
          <div key={testCase.id} className="test-case-card">
            <div className="test-case-header">
              <span className="status-icon">{getStatusIcon(testCase.status)}</span>
              <h3>{testCase.name}</h3>
              <span 
                className="priority-badge" 
                style={{ backgroundColor: getPriorityColor(testCase.priority) }}
              >
                {testCase.priority}
              </span>
            </div>
            <p className="test-case-description">{testCase.description}</p>
            <div className="test-case-footer">
              <span className="last-run">
                {testCase.lastRun ? `Last run: ${testCase.lastRun}` : 'Never run'}
              </span>
              <div className="test-case-actions">
                <button className="action-btn">Edit</button>
                <button className="action-btn">Run</button>
                <button className="action-btn">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RunTestsTab() {
  const [selectedTests, setSelectedTests] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testConfig, setTestConfig] = useState({
    targetUrl: 'https://example.com',
    viewportWidth: 1920,
    viewportHeight: 1080,
    browserType: 'chromium',
    headless: false
  });

  const availableTests = [
    { id: 'tc-1', name: 'Login Flow Test', estimated: '2 min' },
    { id: 'tc-2', name: 'Product Search Test', estimated: '3 min' },
    { id: 'tc-3', name: 'Checkout Process Test', estimated: '5 min' }
  ];

  const handleTestSelection = (testId) => {
    setSelectedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const handleRunTests = () => {
    if (selectedTests.length === 0) {
      alert('Please select at least one test to run');
      return;
    }
    setIsRunning(true);
    // TODO: Implement actual test execution
    setTimeout(() => setIsRunning(false), 5000); // Mock execution
  };

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Run Tests</h2>
        <div className="tab-actions">
          <button 
            className="primary-btn" 
            onClick={handleRunTests}
            disabled={isRunning || selectedTests.length === 0}
          >
            {isRunning ? '⏳ Running...' : '▶️ Run Selected Tests'}
          </button>
        </div>
      </div>

      <div className="run-tests-layout">
        <div className="test-selection-panel">
          <h3>Select Tests to Run</h3>
          <div className="test-selection-list">
            {availableTests.map(test => (
              <div key={test.id} className="test-selection-item">
                <label className="test-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedTests.includes(test.id)}
                    onChange={() => handleTestSelection(test.id)}
                  />
                  <span className="checkmark"></span>
                  <div className="test-info">
                    <span className="test-name">{test.name}</span>
                    <span className="test-estimated">Est. {test.estimated}</span>
                  </div>
                </label>
              </div>
            ))}
          </div>
          
          <div className="selection-actions">
            <button 
              className="secondary-btn"
              onClick={() => setSelectedTests(availableTests.map(t => t.id))}
            >
              Select All
            </button>
            <button 
              className="secondary-btn"
              onClick={() => setSelectedTests([])}
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="test-configuration-panel">
          <h3>Test Configuration</h3>
          <div className="config-form">
            <div className="form-group">
              <label>Target URL</label>
              <input
                type="url"
                value={testConfig.targetUrl}
                onChange={(e) => setTestConfig(prev => ({...prev, targetUrl: e.target.value}))}
                placeholder="https://example.com"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Viewport Width</label>
                <select
                  value={testConfig.viewportWidth}
                  onChange={(e) => setTestConfig(prev => ({...prev, viewportWidth: parseInt(e.target.value)}))}
                >
                  <option value={1920}>1920px (Desktop)</option>
                  <option value={1024}>1024px (Tablet)</option>
                  <option value={375}>375px (Mobile)</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Viewport Height</label>
                <select
                  value={testConfig.viewportHeight}
                  onChange={(e) => setTestConfig(prev => ({...prev, viewportHeight: parseInt(e.target.value)}))}
                >
                  <option value={1080}>1080px</option>
                  <option value={768}>768px</option>
                  <option value={667}>667px</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label>Browser Type</label>
              <select
                value={testConfig.browserType}
                onChange={(e) => setTestConfig(prev => ({...prev, browserType: e.target.value}))}
              >
                <option value="chromium">Chromium</option>
                <option value="firefox">Firefox</option>
                <option value="webkit">WebKit</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={testConfig.headless}
                  onChange={(e) => setTestConfig(prev => ({...prev, headless: e.target.checked}))}
                />
                Run in headless mode
              </label>
            </div>
          </div>
        </div>
      </div>

      {selectedTests.length > 0 && (
        <div className="test-summary">
          <h4>Test Run Summary</h4>
          <p>{selectedTests.length} test(s) selected • Target: {testConfig.targetUrl}</p>
          <p>Viewport: {testConfig.viewportWidth}x{testConfig.viewportHeight} • Browser: {testConfig.browserType}</p>
        </div>
      )}
    </div>
  );
}

function ReportsTab() {
  const [reports, setReports] = useState([
    {
      id: 'report-1',
      name: 'Daily Test Run - Jan 15, 2024',
      date: '2024-01-15 14:30',
      testsRun: 5,
      passed: 3,
      failed: 2,
      duration: '8 minutes',
      status: 'completed'
    },
    {
      id: 'report-2', 
      name: 'Login Flow Regression',
      date: '2024-01-15 10:15',
      testsRun: 3,
      passed: 3,
      failed: 0,
      duration: '4 minutes',
      status: 'completed'
    },
    {
      id: 'report-3',
      name: 'E2E Test Suite',
      date: '2024-01-14 16:45',
      testsRun: 12,
      passed: 10,
      failed: 2,
      duration: '25 minutes',
      status: 'completed'
    }
  ]);

  const getSuccessRate = (passed, total) => {
    return total > 0 ? Math.round((passed / total) * 100) : 0;
  };

  const getStatusColor = (passed, failed) => {
    if (failed === 0) return '#28a745';
    if (failed > passed) return '#dc3545';
    return '#ffc107';
  };

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Reports</h2>
        <div className="tab-actions">
          <button className="primary-btn">Generate New Report</button>
          <button className="secondary-btn">Export All</button>
        </div>
      </div>

      <div className="reports-stats">
        <div className="stat-card">
          <h3>Total Reports</h3>
          <span className="stat-number">{reports.length}</span>
        </div>
        <div className="stat-card">
          <h3>Total Tests Run</h3>
          <span className="stat-number">{reports.reduce((sum, r) => sum + r.testsRun, 0)}</span>
        </div>
        <div className="stat-card">
          <h3>Overall Success Rate</h3>
          <span className="stat-number">
            {getSuccessRate(
              reports.reduce((sum, r) => sum + r.passed, 0),
              reports.reduce((sum, r) => sum + r.testsRun, 0)
            )}%
          </span>
        </div>
        <div className="stat-card">
          <h3>Total Duration</h3>
          <span className="stat-number">
            {reports.reduce((total, r) => {
              const mins = parseInt(r.duration.split(' ')[0]);
              return total + mins;
            }, 0)} min
          </span>
        </div>
      </div>

      <div className="reports-list">
        <h3>Recent Reports</h3>
        {reports.map(report => (
          <div key={report.id} className="report-card">
            <div className="report-header">
              <h4>{report.name}</h4>
              <span className="report-date">{report.date}</span>
            </div>
            
            <div className="report-stats">
              <div className="report-metric">
                <span className="metric-label">Tests</span>
                <span className="metric-value">{report.testsRun}</span>
              </div>
              <div className="report-metric">
                <span className="metric-label">Passed</span>
                <span className="metric-value passed">{report.passed}</span>
              </div>
              <div className="report-metric">
                <span className="metric-label">Failed</span>
                <span className="metric-value failed">{report.failed}</span>
              </div>
              <div className="report-metric">
                <span className="metric-label">Duration</span>
                <span className="metric-value">{report.duration}</span>
              </div>
              <div className="report-metric">
                <span className="metric-label">Success Rate</span>
                <span 
                  className="metric-value" 
                  style={{ color: getStatusColor(report.passed, report.failed) }}
                >
                  {getSuccessRate(report.passed, report.testsRun)}%
                </span>
              </div>
            </div>
            
            <div className="report-actions">
              <button className="action-btn">View Details</button>
              <button className="action-btn">Export</button>
              <button className="action-btn">Share</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;