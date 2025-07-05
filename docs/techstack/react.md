# React - User Interface Library

## Overview

React is a JavaScript library for building user interfaces, particularly well-suited for creating interactive and dynamic web applications. In the AI Test Tool, React powers the renderer process within Electron, providing a modern, component-based architecture for the desktop application's user interface.

## Role in AI Test Tool

### Primary Functions
- **Component-Based UI**: Modular, reusable interface components
- **State Management**: Managing application state for test execution and results
- **Real-Time Updates**: Live progress monitoring during test execution
- **Form Handling**: Test configuration and test case management interfaces

### UI Architecture
```
React Application (Renderer Process)
├── App.js (Root Component)
├── Pages/
│   ├── Dashboard.jsx          # Main overview
│   ├── TestCaseEditor.jsx     # Test case creation/editing
│   ├── Configuration.jsx      # Test configuration
│   ├── Execution.jsx          # Test running interface
│   └── Results.jsx            # Results and reports
├── Components/
│   ├── TestCaseList.jsx       # Test case management
│   ├── ProgressMonitor.jsx    # Real-time progress
│   ├── ResultViewer.jsx       # Test results display
│   └── ConfigForm.jsx         # Configuration forms
└── Hooks/
    ├── useTestExecution.js    # Test execution logic
    ├── useFileManager.js      # File operations
    └── useWebSocket.js        # Real-time communication
```

## Core Concepts for AI Test Tool

### 1. Component Architecture

#### Test Case Management Component
```jsx
import { useState, useEffect } from 'react';

export default function TestCaseManager() {
  const [testCases, setTestCases] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);

  useEffect(() => {
    // Load test cases from Electron main process
    window.electronAPI.loadTestCases().then(setTestCases);
  }, []);

  const handleTestSelection = (testId) => {
    setSelectedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  return (
    <div className="test-case-manager">
      <h2>Test Cases</h2>
      {testCases.map(test => (
        <TestCaseItem
          key={test.id}
          test={test}
          selected={selectedTests.includes(test.id)}
          onSelect={handleTestSelection}
        />
      ))}
    </div>
  );
}
```

#### Real-Time Progress Component
```jsx
import { useState, useEffect } from 'react';

export default function TestProgress() {
  const [progress, setProgress] = useState({
    currentTest: '',
    completed: 0,
    total: 0,
    status: 'idle'
  });

  useEffect(() => {
    // Listen for progress updates from main process
    const unsubscribe = window.electronAPI.onTestProgress((data) => {
      setProgress(data);
    });

    return unsubscribe;
  }, []);

  const progressPercentage = progress.total > 0 
    ? (progress.completed / progress.total) * 100 
    : 0;

  return (
    <div className="test-progress">
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <p>
        {progress.currentTest && `Running: ${progress.currentTest}`}
      </p>
      <p>
        {progress.completed} of {progress.total} tests completed
      </p>
    </div>
  );
}
```

### 2. State Management Patterns

#### Custom Hook for Test Execution
```jsx
import { useState, useCallback } from 'react';

export function useTestExecution() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const runTests = useCallback(async (testConfig) => {
    setIsRunning(true);
    setError(null);
    
    try {
      const result = await window.electronAPI.runTests(testConfig);
      setResults(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRunning(false);
    }
  }, []);

  const stopTests = useCallback(async () => {
    await window.electronAPI.stopTests();
    setIsRunning(false);
  }, []);

  return {
    isRunning,
    results,
    error,
    runTests,
    stopTests
  };
}
```

#### Context for Global State
```jsx
import { createContext, useContext, useReducer } from 'react';

const AppStateContext = createContext();
const AppDispatchContext = createContext();

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_TEST_CASES':
      return { ...state, testCases: action.payload };
    case 'UPDATE_PROGRESS':
      return { ...state, progress: action.payload };
    case 'SET_RESULTS':
      return { ...state, results: action.payload };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, {
    testCases: [],
    progress: null,
    results: []
  });

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export const useAppState = () => useContext(AppStateContext);
export const useAppDispatch = () => useContext(AppDispatchContext);
```

### 3. Integration with Electron

#### Electron API Usage
```jsx
// Using exposed Electron APIs safely
export function TestConfigForm() {
  const [config, setConfig] = useState({
    targetUrl: '',
    browser: 'chromium',
    viewport: 'desktop'
  });

  const handleSave = async () => {
    await window.electronAPI.saveTestConfig(config);
  };

  const handleLoadConfig = async () => {
    const savedConfig = await window.electronAPI.loadTestConfig();
    setConfig(savedConfig);
  };

  return (
    <form onSubmit={handleSave}>
      <input
        type="url"
        value={config.targetUrl}
        onChange={(e) => setConfig(prev => ({
          ...prev,
          targetUrl: e.target.value
        }))}
        placeholder="Target URL"
        required
      />
      
      <select
        value={config.browser}
        onChange={(e) => setConfig(prev => ({
          ...prev,
          browser: e.target.value
        }))}
      >
        <option value="chromium">Chromium</option>
        <option value="firefox">Firefox</option>
        <option value="webkit">WebKit</option>
      </select>
      
      <button type="submit">Save Configuration</button>
    </form>
  );
}
```

## Development Patterns

### 1. Component Structure
```jsx
// Functional component with hooks
import { useState, useEffect } from 'react';

function ComponentName({ prop1, prop2 }) {
  // State declarations
  const [state, setState] = useState(initialValue);
  
  // Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  // Event handlers
  const handleEvent = () => {
    // Handle event
  };
  
  // Render
  return (
    <div>
      {/* JSX content */}
    </div>
  );
}

export default ComponentName;
```

### 2. Error Boundaries
```jsx
import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong.</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Performance Optimization

### 1. Memoization
```jsx
import { memo, useMemo, useCallback } from 'react';

const ExpensiveComponent = memo(({ data, onUpdate }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({ ...item, processed: true }));
  }, [data]);

  const handleUpdate = useCallback((id, value) => {
    onUpdate(id, value);
  }, [onUpdate]);

  return (
    <div>
      {processedData.map(item => (
        <ItemComponent 
          key={item.id} 
          item={item} 
          onUpdate={handleUpdate} 
        />
      ))}
    </div>
  );
});
```

### 2. Code Splitting
```jsx
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const ResultsPage = lazy(() => import('./pages/Results'));
const TestEditor = lazy(() => import('./pages/TestEditor'));

function App() {
  return (
    <div className="app">
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/editor" element={<TestEditor />} />
        </Routes>
      </Suspense>
    </div>
  );
}
```

## Testing

### Component Testing
```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import TestCaseItem from './TestCaseItem';

test('should select test case when clicked', () => {
  const mockOnSelect = jest.fn();
  const testCase = { id: '1', name: 'Login Test', status: 'pending' };
  
  render(
    <TestCaseItem 
      test={testCase} 
      selected={false} 
      onSelect={mockOnSelect} 
    />
  );
  
  fireEvent.click(screen.getByText('Login Test'));
  expect(mockOnSelect).toHaveBeenCalledWith('1');
});
```

## CSS and Styling

### Component Styling
```css
/* Modern CSS with CSS Grid and Flexbox */
.test-dashboard {
  display: grid;
  grid-template-columns: 300px 1fr;
  grid-template-rows: auto 1fr;
  gap: 1rem;
  height: 100vh;
}

.test-list {
  grid-row: 1 / -1;
  overflow-y: auto;
  padding: 1rem;
  border-right: 1px solid #e0e0e0;
}

.test-content {
  display: flex;
  flex-direction: column;
  padding: 1rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #4caf50;
  transition: width 0.3s ease;
}
```

## Common Patterns for AI Test Tool

### Form Handling
```jsx
function useForm(initialValues, onSubmit) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit(values);
    } catch (error) {
      setErrors({ submit: error.message });
    }
  };

  return { values, errors, handleChange, handleSubmit };
}
```

### File Operations
```jsx
function useFileManager() {
  const [files, setFiles] = useState([]);
  
  const loadFiles = useCallback(async () => {
    const fileList = await window.electronAPI.loadTestCases();
    setFiles(fileList);
  }, []);

  const saveFile = useCallback(async (name, content) => {
    await window.electronAPI.saveTestCase(name, content);
    await loadFiles(); // Refresh list
  }, [loadFiles]);

  const deleteFile = useCallback(async (name) => {
    await window.electronAPI.deleteTestCase(name);
    await loadFiles(); // Refresh list
  }, [loadFiles]);

  return { files, loadFiles, saveFile, deleteFile };
}
```

## Resources

- [Official React Documentation](https://react.dev/)
- [React Hooks Guide](https://react.dev/reference/react)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)

## Best Practices

1. **Use functional components with hooks**
2. **Implement proper error boundaries**
3. **Optimize with memoization when needed**
4. **Keep components small and focused**
5. **Use custom hooks for complex logic**
6. **Implement proper loading states**
7. **Handle errors gracefully**
8. **Use TypeScript for better development experience**