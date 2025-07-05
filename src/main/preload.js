const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  appReady: () => ipcRenderer.invoke('app-ready'),
  
  // Window management
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  getWindowState: () => ipcRenderer.invoke('get-window-state'),
  
  // Event listeners for window state and menu actions
  onWindowStateChanged: (callback) => {
    ipcRenderer.on('window-state-changed', callback);
    return () => ipcRenderer.removeListener('window-state-changed', callback);
  },
  
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', callback);
    return () => ipcRenderer.removeListener('menu-action', callback);
  },
  
  // Test case management
  loadTestCases: () => ipcRenderer.invoke('load-test-cases'),
  saveTestCase: (testCase) => ipcRenderer.invoke('save-test-case', testCase),
  deleteTestCase: (testCaseId) => ipcRenderer.invoke('delete-test-case', testCaseId),
  
  // Test execution
  runTests: (testCases, config) => ipcRenderer.invoke('run-tests', testCases, config),
  stopTests: () => ipcRenderer.invoke('stop-tests'),
  
  // Event listeners
  onTestProgress: (callback) => {
    ipcRenderer.on('test-progress', callback);
    return () => ipcRenderer.removeListener('test-progress', callback);
  },
  
  onTestComplete: (callback) => {
    ipcRenderer.on('test-complete', callback);
    return () => ipcRenderer.removeListener('test-complete', callback);
  },
  
  // File operations
  openFile: () => ipcRenderer.invoke('open-file'),
  saveFile: (content, filePath) => ipcRenderer.invoke('save-file', content, filePath),
  
  // Report generation
  generateReport: (testResults) => ipcRenderer.invoke('generate-report', testResults),
  exportReport: (report, format) => ipcRenderer.invoke('export-report', report, format),
  
  // HTTP requests for backend communication
  httpRequest: (url, options) => ipcRenderer.invoke('http-request', url, options)
});