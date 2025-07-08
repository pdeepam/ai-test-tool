import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [appVersion, setAppVersion] = useState('Loading...');
  const [isReady, setIsReady] = useState(false);
  const [activeTab, setActiveTab] = useState('quicktest');
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
      case 'testcases':
        return <TestCasesTab />;
      case 'runtests':
        return <RunTestsTab />;
      case 'quicktest':
        return <QuickTestTab />;
      case 'reports':
        return <ReportsTab />;
      default:
        return <QuickTestTab />;
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
            className={activeTab === 'quicktest' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('quicktest')}
          >
            Quick Test
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
      lastRun: null,
      filePath: 'test-cases/login-flow.md'
    },
    {
      id: 'tc-2', 
      name: 'Product Search Test',
      description: 'Test product search and filtering',
      status: 'passed',
      priority: 'medium',
      lastRun: '2024-01-15 10:30',
      filePath: 'test-cases/product-search.md'
    },
    {
      id: 'tc-3',
      name: 'Checkout Process Test', 
      description: 'Test complete checkout workflow',
      status: 'failed',
      priority: 'high',
      lastRun: '2024-01-15 09:15',
      filePath: 'test-cases/checkout-process.md'
    }
  ]);

  const [fileTree, setFileTree] = useState([
    {
      id: 'root',
      name: 'test-cases',
      type: 'folder',
      expanded: true,
      children: [
        { id: 'tc-1', name: 'login-flow.md', type: 'file', filePath: 'test-cases/login-flow.md' },
        { id: 'tc-2', name: 'product-search.md', type: 'file', filePath: 'test-cases/product-search.md' },
        { id: 'tc-3', name: 'checkout-process.md', type: 'file', filePath: 'test-cases/checkout-process.md' }
      ]
    }
  ]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [editorContent, setEditorContent] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'editor'
  const [isEditing, setIsEditing] = useState(false);
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');

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

  const handleFileSelect = async (file) => {
    setSelectedFile(file);
    setViewMode('editor');
    
    // Load markdown content (placeholder for now)
    const sampleContent = `# ${file.name}

## Description
Test case for ${file.name.replace('.md', '').replace('-', ' ')}

## Prerequisites
- Browser should be available
- Test environment should be set up

## Test Steps
1. Navigate to the target page
2. Perform the required actions
3. Verify the expected results

## Expected Results
- All steps should complete successfully
- No errors should occur

## Test Data
\`\`\`json
{
  "target_url": "https://example.com",
  "timeout": 30000
}
\`\`\`

## Priority
medium

## Status
pending`;
    
    setEditorContent(sampleContent);
    setIsEditing(false);
  };

  const handleSaveFile = () => {
    // Save the markdown content (placeholder implementation)
    console.log('Saving file:', selectedFile?.name, editorContent);
    setIsEditing(false);
    // TODO: Implement actual file saving via IPC
  };

  const handleNewTestCase = () => {
    setShowNewFileDialog(true);
    setNewFileName('');
  };

  const createNewFile = () => {
    if (!newFileName.trim()) return;
    
    const fileName = newFileName.endsWith('.md') ? newFileName : `${newFileName}.md`;
    const newFile = {
      id: `new-${Date.now()}`,
      name: fileName,
      type: 'file',
      filePath: `test-cases/${fileName}`
    };
    
    // Add to file tree
    const updatedTree = [...fileTree];
    updatedTree[0].children.push(newFile);
    setFileTree(updatedTree);
    
    // Select the new file
    handleFileSelect(newFile);
    
    setShowNewFileDialog(false);
    setIsEditing(true);
  };

  const toggleFolder = (folderId) => {
    const updateTree = (nodes) => {
      return nodes.map(node => {
        if (node.id === folderId && node.type === 'folder') {
          return { ...node, expanded: !node.expanded };
        }
        if (node.children) {
          return { ...node, children: updateTree(node.children) };
        }
        return node;
      });
    };
    setFileTree(updateTree(fileTree));
  };

  const renderFileTree = (nodes, depth = 0) => {
    return nodes.map(node => (
      <div key={node.id} className="file-tree-item" style={{ paddingLeft: `${depth * 20}px` }}>
        {node.type === 'folder' ? (
          <div className="folder-item" onClick={() => toggleFolder(node.id)}>
            <span className="folder-icon">{node.expanded ? '📁' : '📂'}</span>
            <span className="folder-name">{node.name}</span>
          </div>
        ) : (
          <div 
            className={`file-item ${selectedFile?.id === node.id ? 'selected' : ''}`}
            onClick={() => handleFileSelect(node)}
          >
            <span className="file-icon">📄</span>
            <span className="file-name">{node.name}</span>
          </div>
        )}
        {node.expanded && node.children && (
          <div className="folder-children">
            {renderFileTree(node.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  if (viewMode === 'editor') {
    return (
      <div className="tab-content">
        <div className="tab-header">
          <h2>Test Case Editor</h2>
          <div className="tab-actions">
            <button className="secondary-btn" onClick={() => setViewMode('grid')}>
              ← Back to Grid
            </button>
            <button 
              className="primary-btn" 
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? '👁️ Preview' : '✏️ Edit'}
            </button>
            {isEditing && (
              <button className="primary-btn" onClick={handleSaveFile}>
                💾 Save
              </button>
            )}
          </div>
        </div>

        <div className="editor-layout">
          <div className="file-explorer">
            <div className="file-explorer-header">
              <h3>Test Cases</h3>
              <button className="new-file-btn" onClick={handleNewTestCase}>
                + New
              </button>
            </div>
            <div className="file-tree">
              {renderFileTree(fileTree)}
            </div>
          </div>

          <div className="markdown-editor">
            <div className="editor-header">
              <h3>{selectedFile?.name || 'No file selected'}</h3>
              <div className="editor-mode">
                {isEditing ? 'Editing' : 'Preview'}
              </div>
            </div>
            
            {isEditing ? (
              <textarea
                className="markdown-textarea"
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                placeholder="Write your test case in Markdown..."
              />
            ) : (
              <div className="markdown-preview">
                <pre>{editorContent}</pre>
              </div>
            )}
          </div>
        </div>

        {showNewFileDialog && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Create New Test Case</h3>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="test-case-name"
                onKeyPress={(e) => e.key === 'Enter' && createNewFile()}
                autoFocus
              />
              <div className="modal-actions">
                <button className="secondary-btn" onClick={() => setShowNewFileDialog(false)}>
                  Cancel
                </button>
                <button className="primary-btn" onClick={createNewFile}>
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Test Cases</h2>
        <div className="tab-actions">
          <button className="primary-btn" onClick={handleNewTestCase}>+ New Test Case</button>
          <button className="secondary-btn" onClick={() => setViewMode('editor')}>
            📝 File Manager
          </button>
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
                <button 
                  className="action-btn"
                  onClick={() => {
                    const file = fileTree[0].children.find(f => f.id === testCase.id);
                    if (file) handleFileSelect(file);
                  }}
                >
                  Edit
                </button>
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
  const [executionView, setExecutionView] = useState(false);
  const [configTab, setConfigTab] = useState('basic'); // 'basic', 'advanced', 'environment'
  const [executionData, setExecutionData] = useState({
    sessionId: null,
    currentTest: 0,
    totalTests: 0,
    progress: 0,
    startTime: null,
    estimatedTimeRemaining: 0,
    logs: [],
    testResults: []
  });
  const [testConfig, setTestConfig] = useState({
    // Basic Configuration
    targetUrl: 'https://example.com',
    viewportWidth: 1920,
    viewportHeight: 1080,
    browserType: 'chromium',
    headless: false,
    
    // Advanced Configuration
    timeout: 30000,
    maxSteps: 25,
    enableScreenshots: true,
    enableRecording: false,
    slowMotion: 0,
    waitForNetworkIdle: true,
    
    // Environment Configuration
    userAgent: '',
    locale: 'en-US',
    timezone: 'America/New_York',
    geolocation: { latitude: 40.7128, longitude: -74.0060 },
    enableJavascript: true,
    enableImages: true,
    enableStylesheets: true
  });

  const availableTests = [
    { id: 'tc-1', name: 'Login Flow Test', estimated: '2 min', status: 'ready', priority: 'high' },
    { id: 'tc-2', name: 'Product Search Test', estimated: '3 min', status: 'ready', priority: 'medium' },
    { id: 'tc-3', name: 'Checkout Process Test', estimated: '5 min', status: 'ready', priority: 'high' },
    { id: 'tc-4', name: 'Navigation Test', estimated: '1 min', status: 'ready', priority: 'low' },
    { id: 'tc-5', name: 'Form Validation Test', estimated: '3 min', status: 'ready', priority: 'medium' }
  ];

  const viewportPresets = [
    { name: 'Desktop Large', width: 1920, height: 1080 },
    { name: 'Desktop Medium', width: 1366, height: 768 },
    { name: 'Desktop Small', width: 1024, height: 768 },
    { name: 'Tablet Portrait', width: 768, height: 1024 },
    { name: 'Tablet Landscape', width: 1024, height: 768 },
    { name: 'Mobile Large', width: 414, height: 896 },
    { name: 'Mobile Medium', width: 375, height: 667 },
    { name: 'Mobile Small', width: 320, height: 568 }
  ];

  const handleTestSelection = (testId) => {
    setSelectedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const handleSelectAll = () => {
    setSelectedTests(availableTests.map(t => t.id));
  };

  const handleSelectByPriority = (priority) => {
    const filtered = availableTests.filter(t => t.priority === priority).map(t => t.id);
    setSelectedTests(filtered);
  };

  const handleViewportPreset = (preset) => {
    setTestConfig(prev => ({
      ...prev,
      viewportWidth: preset.width,
      viewportHeight: preset.height
    }));
  };

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setExecutionData(prev => ({
      ...prev,
      logs: [...prev.logs, { timestamp, message, type, id: Date.now() }]
    }));
  };

  const updateProgress = (current, total) => {
    const progress = total > 0 ? (current / total) * 100 : 0;
    const elapsed = executionData.startTime ? Date.now() - executionData.startTime : 0;
    const avgTimePerTest = current > 0 ? elapsed / current : 0;
    const remainingTests = total - current;
    const estimatedTimeRemaining = remainingTests * avgTimePerTest;

    setExecutionData(prev => ({
      ...prev,
      currentTest: current,
      totalTests: total,
      progress,
      estimatedTimeRemaining
    }));
  };

  const executeTestsWithBackend = async () => {
    const testList = selectedTests.map(id => availableTests.find(t => t.id === id));
    const totalTests = testList.length;
    
    addLog(`Starting test execution with ${totalTests} test(s)`, 'info');
    addLog(`Target URL: ${testConfig.targetUrl}`, 'info');
    addLog(`Viewport: ${testConfig.viewportWidth}x${testConfig.viewportHeight}`, 'info');
    addLog(`Browser: ${testConfig.browserType}${testConfig.headless ? ' (headless)' : ''}`, 'info');
    
    try {
      // Prepare test cases for backend API
      const testCases = testList.map(test => ({
        id: test.id,
        name: test.name,
        description: test.name,
        target_url: testConfig.targetUrl,
        steps: [
          'Navigate to the target page',
          'Wait for page to load completely',
          'Verify page title contains expected text',
          'Take a screenshot for verification'
        ],
        expected_results: [
          'Page loads successfully',
          'Title is visible and correct',
          'No JavaScript errors in console'
        ],
        priority: test.priority
      }));

      const requestBody = {
        test_cases: testCases,
        config: {
          viewport_width: testConfig.viewportWidth,
          viewport_height: testConfig.viewportHeight,
          browser_type: testConfig.browserType,
          headless: testConfig.headless,
          timeout: testConfig.timeout,
          max_steps: testConfig.maxSteps,
          enable_screenshots: testConfig.enableScreenshots,
          wait_for_network_idle: testConfig.waitForNetworkIdle
        }
      };

      addLog('Sending test request to backend...', 'info');
      
      // Start test session
      const response = await fetch('http://localhost:8000/test/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }

      const startResult = await response.json();
      const sessionId = startResult.session_id;
      
      addLog(`Test session started: ${sessionId}`, 'success');
      
      // Update execution data with session info
      setExecutionData(prev => ({
        ...prev,
        sessionId: sessionId
      }));

      // Poll for progress updates
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`http://localhost:8000/test/status/${sessionId}`);
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            
            // Update progress
            updateProgress(statusData.completed_tests, statusData.total_tests);
            
            // Add any new results to logs
            if (statusData.latest_results) {
              statusData.latest_results.forEach(result => {
                if (!executionData.testResults.find(r => r.test_case_id === result.test_case_id)) {
                  const success = result.status === 'passed';
                  addLog(`${success ? '✅' : '❌'} Test "${result.test_case_id}" ${result.status}`, success ? 'success' : 'error');
                  if (result.message) {
                    addLog(`  ${result.message}`, success ? 'step' : 'error');
                  }
                  
                  setExecutionData(prev => ({
                    ...prev,
                    testResults: [...prev.testResults, {
                      ...testList.find(t => t.id === result.test_case_id),
                      status: result.status,
                      duration: `${result.execution_time}s`,
                      error: result.status === 'failed' ? result.message : undefined
                    }]
                  }));
                }
              });
            }
            
            // Check if completed
            if (statusData.status === 'completed' || statusData.status === 'error' || statusData.status === 'stopped') {
              clearInterval(pollInterval);
              addLog(`Test execution ${statusData.status}`, statusData.status === 'completed' ? 'success' : 'error');
              
              // Get final results
              const resultsResponse = await fetch(`http://localhost:8000/test/results/${sessionId}`);
              if (resultsResponse.ok) {
                const resultsData = await resultsResponse.json();
                addLog(`Final results: ${resultsData.summary.passed}/${resultsData.summary.total} tests passed`, 'info');
              }
            }
          }
        } catch (error) {
          console.error('Error polling status:', error);
          addLog(`Status polling error: ${error.message}`, 'error');
        }
      }, 2000); // Poll every 2 seconds

      // Clean up polling after 5 minutes max
      setTimeout(() => {
        clearInterval(pollInterval);
      }, 300000);

    } catch (error) {
      addLog(`Backend connection failed: ${error.message}`, 'error');
      addLog('Falling back to simulation mode...', 'warning');
      
      // Fallback to simulation if backend is not available
      await simulateTestExecution();
    }
  };

  const simulateTestExecution = async () => {
    const testList = selectedTests.map(id => availableTests.find(t => t.id === id));
    const totalTests = testList.length;
    
    addLog('Running in simulation mode (backend not available)', 'warning');
    
    for (let i = 0; i < totalTests; i++) {
      const test = testList[i];
      updateProgress(i, totalTests);
      
      addLog(`Starting test: ${test.name}`, 'info');
      
      // Simulate test steps
      const steps = [
        'Initializing browser session',
        'Navigating to target URL',
        'Waiting for page load',
        'Executing test steps',
        'Taking screenshots',
        'Validating results'
      ];
      
      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
        addLog(`  ${step}...`, 'step');
      }
      
      // Simulate test result
      const success = Math.random() > 0.3; // 70% success rate
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (success) {
        addLog(`✅ Test "${test.name}" completed successfully`, 'success');
        setExecutionData(prev => ({
          ...prev,
          testResults: [...prev.testResults, { ...test, status: 'passed', duration: '2.3s' }]
        }));
      } else {
        addLog(`❌ Test "${test.name}" failed`, 'error');
        addLog(`  Error: Element not found after 30s timeout`, 'error');
        setExecutionData(prev => ({
          ...prev,
          testResults: [...prev.testResults, { ...test, status: 'failed', duration: '30.1s', error: 'Element not found after 30s timeout' }]
        }));
      }
    }
    
    updateProgress(totalTests, totalTests);
    addLog(`Test execution completed. ${executionData.testResults.filter(r => r.status === 'passed').length}/${totalTests} tests passed`, 'info');
  };

  const handleRunTests = async () => {
    if (selectedTests.length === 0) {
      alert('Please select at least one test to run');
      return;
    }
    
    setIsRunning(true);
    setExecutionView(true);
    
    // Initialize execution data
    setExecutionData({
      sessionId: `session_${Date.now()}`,
      currentTest: 0,
      totalTests: selectedTests.length,
      progress: 0,
      startTime: Date.now(),
      estimatedTimeRemaining: 0,
      logs: [],
      testResults: []
    });
    
    try {
      // Execute tests with backend API (falls back to simulation if backend unavailable)
      await executeTestsWithBackend();
    } catch (error) {
      console.error('Test execution failed:', error);
      addLog(`Execution failed: ${error.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleStopTests = () => {
    setIsRunning(false);
    addLog('Test execution stopped by user', 'warning');
  };

  const handleBackToConfig = () => {
    setExecutionView(false);
    setExecutionData({
      sessionId: null,
      currentTest: 0,
      totalTests: 0,
      progress: 0,
      startTime: null,
      estimatedTimeRemaining: 0,
      logs: [],
      testResults: []
    });
  };

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Render execution dashboard when tests are running
  if (executionView) {
    return (
      <div className="tab-content">
        <div className="tab-header">
          <h2>Test Execution Dashboard</h2>
          <div className="tab-actions">
            {isRunning ? (
              <button className="danger-btn" onClick={handleStopTests}>
                ⏹️ Stop Tests
              </button>
            ) : (
              <button className="secondary-btn" onClick={handleBackToConfig}>
                ← Back to Configuration
              </button>
            )}
          </div>
        </div>

        <div className="execution-dashboard">
          {/* Progress Overview */}
          <div className="progress-overview">
            <div className="progress-stats">
              <div className="stat-item">
                <span className="stat-label">Session ID</span>
                <span className="stat-value">{executionData.sessionId}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Progress</span>
                <span className="stat-value">
                  {executionData.currentTest} / {executionData.totalTests}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Status</span>
                <span className={`stat-value ${isRunning ? 'running' : 'completed'}`}>
                  {isRunning ? 'Running' : 'Completed'}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">ETA</span>
                <span className="stat-value">
                  {isRunning ? formatTime(executionData.estimatedTimeRemaining) : 'Complete'}
                </span>
              </div>
            </div>
            
            <div className="progress-bar-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${executionData.progress}%` }}
                ></div>
              </div>
              <span className="progress-text">{Math.round(executionData.progress)}%</span>
            </div>
          </div>

          {/* Test Results Grid */}
          <div className="test-results-grid">
            <div className="results-panel">
              <h3>Test Results</h3>
              <div className="test-results-list">
                {executionData.testResults.map((result, index) => (
                  <div key={index} className={`test-result-item ${result.status}`}>
                    <div className="result-icon">
                      {result.status === 'passed' ? '✅' : '❌'}
                    </div>
                    <div className="result-info">
                      <span className="result-name">{result.name}</span>
                      <span className="result-meta">
                        Duration: {result.duration}
                        {result.error && ` • Error: ${result.error}`}
                      </span>
                    </div>
                    <span className={`result-status ${result.status}`}>
                      {result.status}
                    </span>
                  </div>
                ))}
                
                {/* Show pending tests */}
                {selectedTests.slice(executionData.testResults.length).map((testId, index) => {
                  const test = availableTests.find(t => t.id === testId);
                  const isPending = index + executionData.testResults.length === executionData.currentTest && isRunning;
                  return (
                    <div key={testId} className={`test-result-item pending ${isPending ? 'current' : ''}`}>
                      <div className="result-icon">
                        {isPending ? '⏳' : '⚪'}
                      </div>
                      <div className="result-info">
                        <span className="result-name">{test?.name}</span>
                        <span className="result-meta">
                          {isPending ? 'Running...' : 'Pending'}
                        </span>
                      </div>
                      <span className="result-status pending">
                        {isPending ? 'running' : 'pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Log */}
            <div className="log-panel">
              <h3>Live Log</h3>
              <div className="log-container">
                {executionData.logs.map((log, index) => (
                  <div key={log.id} className={`log-entry ${log.type}`}>
                    <span className="log-timestamp">{log.timestamp}</span>
                    <span className="log-message">{log.message}</span>
                  </div>
                ))}
                {executionData.logs.length === 0 && (
                  <div className="log-entry info">
                    <span className="log-message">Waiting for test execution to start...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          {!isRunning && executionData.testResults.length > 0 && (
            <div className="execution-summary">
              <h3>Execution Summary</h3>
              <div className="summary-stats">
                <div className="summary-item success">
                  <span className="summary-number">
                    {executionData.testResults.filter(r => r.status === 'passed').length}
                  </span>
                  <span className="summary-label">Passed</span>
                </div>
                <div className="summary-item failed">
                  <span className="summary-number">
                    {executionData.testResults.filter(r => r.status === 'failed').length}
                  </span>
                  <span className="summary-label">Failed</span>
                </div>
                <div className="summary-item total">
                  <span className="summary-number">{executionData.testResults.length}</span>
                  <span className="summary-label">Total</span>
                </div>
                <div className="summary-item time">
                  <span className="summary-number">
                    {formatTime(Date.now() - executionData.startTime)}
                  </span>
                  <span className="summary-label">Duration</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

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
          
          <div className="selection-filters">
            <button 
              className="filter-btn"
              onClick={handleSelectAll}
            >
              All ({availableTests.length})
            </button>
            <button 
              className="filter-btn priority-high"
              onClick={() => handleSelectByPriority('high')}
            >
              High ({availableTests.filter(t => t.priority === 'high').length})
            </button>
            <button 
              className="filter-btn priority-medium"
              onClick={() => handleSelectByPriority('medium')}
            >
              Medium ({availableTests.filter(t => t.priority === 'medium').length})
            </button>
            <button 
              className="filter-btn priority-low"
              onClick={() => handleSelectByPriority('low')}
            >
              Low ({availableTests.filter(t => t.priority === 'low').length})
            </button>
          </div>

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
                    <div className="test-meta">
                      <span className="test-estimated">Est. {test.estimated}</span>
                      <span className={`test-priority priority-${test.priority}`}>
                        {test.priority}
                      </span>
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>
          
          <div className="selection-actions">
            <button 
              className="secondary-btn"
              onClick={() => setSelectedTests([])}
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="test-configuration-panel">
          <div className="config-tabs">
            <button 
              className={configTab === 'basic' ? 'config-tab active' : 'config-tab'}
              onClick={() => setConfigTab('basic')}
            >
              Basic
            </button>
            <button 
              className={configTab === 'advanced' ? 'config-tab active' : 'config-tab'}
              onClick={() => setConfigTab('advanced')}
            >
              Advanced
            </button>
            <button 
              className={configTab === 'environment' ? 'config-tab active' : 'config-tab'}
              onClick={() => setConfigTab('environment')}
            >
              Environment
            </button>
          </div>

          {configTab === 'basic' && (
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

              <div className="form-group">
                <label>Viewport Preset</label>
                <div className="viewport-presets">
                  {viewportPresets.map(preset => (
                    <button
                      key={preset.name}
                      className={`preset-btn ${
                        testConfig.viewportWidth === preset.width && 
                        testConfig.viewportHeight === preset.height ? 'active' : ''
                      }`}
                      onClick={() => handleViewportPreset(preset)}
                    >
                      {preset.name}<br/>
                      <span className="preset-size">{preset.width}×{preset.height}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Viewport Width</label>
                  <input
                    type="number"
                    value={testConfig.viewportWidth}
                    onChange={(e) => setTestConfig(prev => ({...prev, viewportWidth: parseInt(e.target.value)}))}
                    min="320"
                    max="3840"
                  />
                </div>
                
                <div className="form-group">
                  <label>Viewport Height</label>
                  <input
                    type="number"
                    value={testConfig.viewportHeight}
                    onChange={(e) => setTestConfig(prev => ({...prev, viewportHeight: parseInt(e.target.value)}))}
                    min="240"
                    max="2160"
                  />
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
                  <option value="webkit">WebKit (Safari)</option>
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
          )}

          {configTab === 'advanced' && (
            <div className="config-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Timeout (ms)</label>
                  <input
                    type="number"
                    value={testConfig.timeout}
                    onChange={(e) => setTestConfig(prev => ({...prev, timeout: parseInt(e.target.value)}))}
                    min="5000"
                    max="300000"
                    step="5000"
                  />
                </div>
                
                <div className="form-group">
                  <label>Max Steps</label>
                  <input
                    type="number"
                    value={testConfig.maxSteps}
                    onChange={(e) => setTestConfig(prev => ({...prev, maxSteps: parseInt(e.target.value)}))}
                    min="5"
                    max="100"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Slow Motion (ms)</label>
                <input
                  type="range"
                  min="0"
                  max="3000"
                  step="100"
                  value={testConfig.slowMotion}
                  onChange={(e) => setTestConfig(prev => ({...prev, slowMotion: parseInt(e.target.value)}))}
                />
                <span className="range-value">{testConfig.slowMotion}ms</span>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={testConfig.enableScreenshots}
                    onChange={(e) => setTestConfig(prev => ({...prev, enableScreenshots: e.target.checked}))}
                  />
                  Enable Screenshots
                </label>
                
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={testConfig.enableRecording}
                    onChange={(e) => setTestConfig(prev => ({...prev, enableRecording: e.target.checked}))}
                  />
                  Enable Video Recording
                </label>
                
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={testConfig.waitForNetworkIdle}
                    onChange={(e) => setTestConfig(prev => ({...prev, waitForNetworkIdle: e.target.checked}))}
                  />
                  Wait for Network Idle
                </label>
              </div>
            </div>
          )}

          {configTab === 'environment' && (
            <div className="config-form">
              <div className="form-group">
                <label>User Agent</label>
                <input
                  type="text"
                  value={testConfig.userAgent}
                  onChange={(e) => setTestConfig(prev => ({...prev, userAgent: e.target.value}))}
                  placeholder="Leave empty for default"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Locale</label>
                  <select
                    value={testConfig.locale}
                    onChange={(e) => setTestConfig(prev => ({...prev, locale: e.target.value}))}
                  >
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="es-ES">Spanish</option>
                    <option value="fr-FR">French</option>
                    <option value="de-DE">German</option>
                    <option value="ja-JP">Japanese</option>
                    <option value="zh-CN">Chinese (Simplified)</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Timezone</label>
                  <select
                    value={testConfig.timezone}
                    onChange={(e) => setTestConfig(prev => ({...prev, timezone: e.target.value}))}
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Latitude</label>
                  <input
                    type="number"
                    value={testConfig.geolocation.latitude}
                    onChange={(e) => setTestConfig(prev => ({
                      ...prev, 
                      geolocation: {...prev.geolocation, latitude: parseFloat(e.target.value)}
                    }))}
                    step="0.0001"
                  />
                </div>
                
                <div className="form-group">
                  <label>Longitude</label>
                  <input
                    type="number"
                    value={testConfig.geolocation.longitude}
                    onChange={(e) => setTestConfig(prev => ({
                      ...prev, 
                      geolocation: {...prev.geolocation, longitude: parseFloat(e.target.value)}
                    }))}
                    step="0.0001"
                  />
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={testConfig.enableJavascript}
                    onChange={(e) => setTestConfig(prev => ({...prev, enableJavascript: e.target.checked}))}
                  />
                  Enable JavaScript
                </label>
                
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={testConfig.enableImages}
                    onChange={(e) => setTestConfig(prev => ({...prev, enableImages: e.target.checked}))}
                  />
                  Enable Images
                </label>
                
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={testConfig.enableStylesheets}
                    onChange={(e) => setTestConfig(prev => ({...prev, enableStylesheets: e.target.checked}))}
                  />
                  Enable Stylesheets
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedTests.length > 0 && (
        <div className="test-summary">
          <h4>Test Run Summary</h4>
          <p><strong>{selectedTests.length}</strong> test(s) selected • Target: <strong>{testConfig.targetUrl}</strong></p>
          <p>Viewport: <strong>{testConfig.viewportWidth}×{testConfig.viewportHeight}</strong> • Browser: <strong>{testConfig.browserType}</strong></p>
          {!testConfig.headless && <p>Mode: <strong>Visible browser</strong> • Screenshots: <strong>{testConfig.enableScreenshots ? 'Enabled' : 'Disabled'}</strong></p>}
          {testConfig.headless && <p>Mode: <strong>Headless</strong> • Timeout: <strong>{testConfig.timeout}ms</strong></p>}
        </div>
      )}
    </div>
  );
}

function QuickTestTab() {
  const [testInput, setTestInput] = useState('');
  const [targetUrl, setTargetUrl] = useState('https://google.com');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [useExistingChrome, setUseExistingChrome] = useState(true);

  const exampleTests = `Navigate to the homepage and verify the title contains "Google"
Click on the "About" link and check that the page loads
Search for "test automation" and verify results appear
Check that the footer contains copyright information`;

  const parseTestInput = (input) => {
    // Split by lines and filter out empty lines
    const lines = input.split('\n').filter(line => line.trim());
    return lines.map((line, index) => ({
      id: `quick_test_${index + 1}`,
      name: `Quick Test ${index + 1}`,
      description: line.trim(),
      target_url: targetUrl,
      steps: [
        'Navigate to the target page',
        'Execute the requested action',
        'Verify the expected result'
      ],
      expected_results: [
        'Page loads successfully',
        'Action completes without errors',
        'Expected content is found'
      ],
      priority: 'medium'
    }));
  };

  const addResult = (description, status, message) => {
    const timestamp = new Date().toLocaleTimeString();
    setResults(prev => [...prev, {
      id: Date.now(),
      description,
      status,
      message,
      timestamp
    }]);
  };

  const runQuickTests = async () => {
    if (!testInput.trim()) {
      alert('Please enter some test cases to run');
      return;
    }

    setIsRunning(true);
    setResults([]);

    const testCases = parseTestInput(testInput);
    
    addResult('Starting test execution...', 'info', `Running ${testCases.length} test(s) on ${targetUrl}`);

    try {
      const requestBody = {
        test_cases: testCases,
        config: {
          browser_type: 'chromium',
          headless: false,
          timeout: 30000,
          max_steps: 15,
          enable_screenshots: true,
          wait_for_network_idle: true,
          keep_alive: true,
          use_existing_chrome: useExistingChrome
        }
      };

      // Start test session
      const response = await window.electronAPI.httpRequest('http://127.0.0.1:8000/test/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }

      const startResult = response.data;
      const sessionId = startResult.session_id;
      
      addResult('Test session started', 'info', `Session ID: ${sessionId}`);

      // Poll for progress updates
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await window.electronAPI.httpRequest(`http://127.0.0.1:8000/test/status/${sessionId}`);
          if (statusResponse.ok) {
            const statusData = statusResponse.data;
            
            // Check if completed
            if (statusData.status === 'completed' || statusData.status === 'error' || statusData.status === 'stopped') {
              clearInterval(pollInterval);
              
              // Get final results
              const resultsResponse = await window.electronAPI.httpRequest(`http://127.0.0.1:8000/test/results/${sessionId}`);
              if (resultsResponse.ok) {
                const resultsData = resultsResponse.data;
                
                // Process each test result
                resultsData.results.forEach((result, index) => {
                  const testDescription = testCases[index]?.description || `Test ${index + 1}`;
                  const status = result.status === 'passed' ? 'passed' : 'failed';
                  const message = result.message || (status === 'passed' ? 'Test completed successfully' : 'Test failed');
                  
                  addResult(testDescription, status, message);
                });

                // Add summary
                const { passed, failed, total } = resultsData.summary;
                addResult('Test execution completed', 'summary', `${passed}/${total} tests passed (${failed} failed)`);
              }
              
              setIsRunning(false);
            }
          }
        } catch (error) {
          console.error('Error polling status:', error);
          clearInterval(pollInterval);
          addResult('Status polling error', 'failed', error.message);
          setIsRunning(false);
        }
      }, 3000); // Poll every 3 seconds

      // Clean up polling after 5 minutes max
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isRunning) {
          addResult('Test execution timeout', 'failed', 'Tests took too long to complete');
          setIsRunning(false);
        }
      }, 300000);

    } catch (error) {
      addResult('Connection failed', 'failed', `Could not connect to backend: ${error.message}`);
      addResult('Tip', 'info', 'Make sure the backend is running with: python src/backend/server.py');
      setIsRunning(false);
    }
  };

  const getResultIcon = (status) => {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'info': return 'ℹ️';
      case 'summary': return '📊';
      default: return '•';
    }
  };

  const getResultColor = (status) => {
    switch (status) {
      case 'passed': return '#28a745';
      case 'failed': return '#dc3545';
      case 'info': return '#17a2b8';
      case 'summary': return '#6f42c1';
      default: return '#6c757d';
    }
  };

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Quick Test</h2>
        <div className="tab-actions">
          <button 
            className="primary-btn" 
            onClick={runQuickTests}
            disabled={isRunning || !testInput.trim()}
          >
            {isRunning ? '⏳ Running...' : '🚀 Run Tests'}
          </button>
        </div>
      </div>

      <div className="quick-test-layout">
        <div className="quick-test-input">
          <h3>Test Cases</h3>
          <p className="instruction-text">
            Write your test cases in natural language, one per line.
          </p>
          
          <div className="browser-selection">
            <h4>Browser Option</h4>
            <div className="browser-choice">
              <label className="browser-option">
                <input
                  type="radio"
                  name="browser"
                  checked={useExistingChrome}
                  onChange={() => setUseExistingChrome(true)}
                  disabled={isRunning}
                />
                <div className="option-content">
                  <span className="option-title">🌐 Use Existing Chrome</span>
                  <span className="option-desc">Connect to your current Chrome browser</span>
                </div>
              </label>
              
              <label className="browser-option">
                <input
                  type="radio"
                  name="browser"
                  checked={!useExistingChrome}
                  onChange={() => setUseExistingChrome(false)}
                  disabled={isRunning}
                />
                <div className="option-content">
                  <span className="option-title">🚀 New Chromium</span>
                  <span className="option-desc">Launch fresh browser instance</span>
                </div>
              </label>
            </div>
            
            {useExistingChrome && (
              <div className="chrome-setup-info">
                <p className="setup-hint">
                  💡 First, start Chrome with debugging: 
                  <code className="inline-command">open -a "Google Chrome" --args --remote-debugging-port=9222</code>
                </p>
              </div>
            )}
          </div>
          
          <div className="url-input-group">
            <label>Target URL:</label>
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://example.com"
              className="url-input"
            />
          </div>

          <textarea
            className="test-input-area"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder={exampleTests}
            rows={8}
            disabled={isRunning}
          />
          
          <div className="input-actions">
            <button 
              className="secondary-btn"
              onClick={() => setTestInput(exampleTests)}
              disabled={isRunning}
            >
              📝 Load Examples
            </button>
            <button 
              className="secondary-btn"
              onClick={() => setTestInput('')}
              disabled={isRunning}
            >
              🗑️ Clear
            </button>
          </div>
        </div>

        <div className="quick-test-output">
          <h3>Results</h3>
          <div className="results-container">
            {results.length === 0 ? (
              <div className="no-results">
                <p>📋 <strong>Test results will appear here</strong></p>
                <p>Enter test cases in the left panel and click "Run Tests" to see results.</p>
                <p>Results include pass/fail status, execution details, and error messages.</p>
              </div>
            ) : (
              <div className="results-list">
                {results.map((result) => (
                  <div 
                    key={result.id} 
                    className={`result-item ${result.status}`}
                    style={{ borderLeftColor: getResultColor(result.status) }}
                  >
                    <div className="result-header">
                      <span className="result-icon">{getResultIcon(result.status)}</span>
                      <span className="result-description">{result.description}</span>
                      <span className="result-timestamp">{result.timestamp}</span>
                    </div>
                    <div className="result-message">{result.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
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