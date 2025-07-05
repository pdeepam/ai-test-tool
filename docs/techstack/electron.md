# Electron - Cross-Platform Desktop Application Framework

## Overview

Electron is a framework for building cross-platform desktop applications using web technologies (JavaScript, HTML, and CSS). It combines the Chromium rendering engine with the Node.js runtime, allowing developers to create native desktop applications with web technologies.

## Architecture

### Process Model

Electron uses a multi-process architecture similar to the Chromium browser:

- **Main Process**: Controls application lifecycle and creates renderer processes
- **Renderer Process**: Displays the UI using Chromium and runs your React/HTML application
- **Preload Scripts**: Secure bridge between main and renderer processes

### Inter-Process Communication (IPC)

Electron provides secure IPC mechanisms for communication between processes:

#### Main Process APIs

##### `ipcMain`

###### Methods

**`ipcMain.on(channel, listener)`**
- **Parameters**: 
  - `channel` (string): The event channel name
  - `listener` (function): Callback function `(event, ...args) => void`
- **Returns**: `ipcMain` instance for chaining
- **Description**: Listens for synchronous and asynchronous messages from renderer processes

```javascript
const { ipcMain } = require('electron')

ipcMain.on('set-title', (event, title) => {
  const webContents = event.sender
  const win = BrowserWindow.fromWebContents(webContents)
  win.setTitle(title)
})
```

**`ipcMain.handle(channel, listener)`**
- **Parameters**: 
  - `channel` (string): The event channel name
  - `listener` (function): Async callback function `(event, ...args) => Promise<any>`
- **Returns**: `ipcMain` instance for chaining
- **Description**: Handles invokable IPC messages from renderer processes

```javascript
ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({})
  if (!canceled) {
    return filePaths[0]
  }
})
```

##### `BrowserWindow`

###### Constructor

**`new BrowserWindow([options])`**
- **Parameters**:
  - `options` (Object, optional):
    - `width` (number): Window width in pixels (default: 800)
    - `height` (number): Window height in pixels (default: 600)
    - `webPreferences` (Object):
      - `nodeIntegration` (boolean): Enable Node.js integration (default: false)
      - `contextIsolation` (boolean): Enable context isolation (default: true)
      - `preload` (string): Path to preload script
      - `sandbox` (boolean): Enable sandbox mode (default: false)

```javascript
const win = new BrowserWindow({
  width: 1200,
  height: 800,
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    preload: path.join(__dirname, 'preload.js')
  }
})
```

###### Methods

**`win.loadFile(filePath[, options])`**
- **Parameters**:
  - `filePath` (string): Path to HTML file
  - `options` (Object, optional): Load options
- **Returns**: `Promise<void>`
- **Description**: Loads a local HTML file

**`win.loadURL(url[, options])`**
- **Parameters**:
  - `url` (string): URL to load
  - `options` (Object, optional): Load options
- **Returns**: `Promise<void>`
- **Description**: Loads a remote URL

**`win.webContents.send(channel, ...args)`**
- **Parameters**:
  - `channel` (string): Event channel name
  - `...args` (any[]): Arguments to send
- **Description**: Sends asynchronous message to renderer process

```javascript
mainWindow.webContents.send('update-counter', 1)
```

#### Renderer Process APIs

##### `ipcRenderer`

###### Methods

**`ipcRenderer.send(channel, ...args)`**
- **Parameters**:
  - `channel` (string): Event channel name
  - `...args` (any[]): Arguments to send
- **Description**: Sends asynchronous message to main process

```javascript
const { ipcRenderer } = require('electron')
ipcRenderer.send('set-title', 'New Title')
```

**`ipcRenderer.invoke(channel, ...args)`**
- **Parameters**:
  - `channel` (string): Event channel name
  - `...args` (any[]): Arguments to send
- **Returns**: `Promise<any>`
- **Description**: Invokes a handler in the main process and returns a promise

```javascript
const result = await ipcRenderer.invoke('dialog:openFile')
```

**`ipcRenderer.on(channel, listener)`**
- **Parameters**:
  - `channel` (string): Event channel name
  - `listener` (function): Callback function `(event, ...args) => void`
- **Returns**: `ipcRenderer` instance
- **Description**: Listens for messages from main process

```javascript
ipcRenderer.on('update-counter', (event, value) => {
  console.log('Counter updated:', value)
})
```

**`ipcRenderer.sendSync(channel, ...args)`**
- **Parameters**:
  - `channel` (string): Event channel name
  - `...args` (any[]): Arguments to send
- **Returns**: `any`
- **Description**: Sends synchronous message to main process (blocks until reply)

```javascript
const result = ipcRenderer.sendSync('synchronous-message', 'ping')
```

#### Preload Scripts

Preload scripts run in the renderer process before the web page loads and provide secure access to Node.js APIs through the `contextBridge`.

##### `contextBridge`

###### Methods

**`contextBridge.exposeInMainWorld(apiKey, api)`**
- **Parameters**:
  - `apiKey` (string): Name of the API on `window` object
  - `api` (Object): API object to expose
- **Description**: Safely exposes APIs to the main world

```javascript
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  setTitle: (title) => ipcRenderer.send('set-title', title),
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  onUpdateCounter: (callback) => ipcRenderer.on('update-counter', callback)
})
```

## Core Modules

### `app`

Controls the application's lifecycle and behavior.

#### Events

**`app.whenReady()`**
- **Returns**: `Promise<void>`
- **Description**: Emitted when Electron has finished initialization

```javascript
app.whenReady().then(() => {
  createWindow()
})
```

#### Methods

**`app.quit()`**
- **Description**: Terminates the application

**`app.enableSandbox()`**
- **Description**: Enables sandboxing for all renderers (must be called before `ready`)

### `dialog`

Displays native system dialogs for file selection, message boxes, etc.

#### Methods

**`dialog.showOpenDialog([browserWindow, ]options)`**
- **Parameters**:
  - `browserWindow` (BrowserWindow, optional): Parent window
  - `options` (Object): Dialog options
    - `title` (string): Dialog title
    - `defaultPath` (string): Default path
    - `buttonLabel` (string): Custom confirm button label
    - `filters` (FileFilter[]): File type filters
    - `properties` (string[]): Dialog properties ('openFile', 'openDirectory', 'multiSelections')
- **Returns**: `Promise<Object>`
  - `canceled` (boolean): Whether dialog was canceled
  - `filePaths` (string[]): Selected file paths

```javascript
const { canceled, filePaths } = await dialog.showOpenDialog({
  properties: ['openFile'],
  filters: [
    { name: 'Images', extensions: ['jpg', 'png', 'gif'] }
  ]
})
```

**`dialog.showSaveDialog([browserWindow, ]options)`**
- **Parameters**:
  - `browserWindow` (BrowserWindow, optional): Parent window
  - `options` (Object): Dialog options
- **Returns**: `Promise<Object>`
  - `canceled` (boolean): Whether dialog was canceled
  - `filePath` (string): Selected file path

### `Menu`

Creates native application menus.

#### Methods

**`Menu.buildFromTemplate(template)`**
- **Parameters**:
  - `template` (MenuItemConstructorOptions[]): Menu template
- **Returns**: `Menu`
- **Description**: Creates a menu from template

```javascript
const menu = Menu.buildFromTemplate([
  {
    label: 'File',
    submenu: [
      { label: 'New File', accelerator: 'CmdOrCtrl+N' },
      { type: 'separator' },
      { label: 'Exit', role: 'quit' }
    ]
  }
])
```

**`Menu.setApplicationMenu(menu)`**
- **Parameters**:
  - `menu` (Menu | null): Menu to set as application menu
- **Description**: Sets the application menu

### `nativeTheme`

Controls the application's native theme.

#### Properties

**`nativeTheme.shouldUseDarkColors`**
- **Type**: `boolean` (read-only)
- **Description**: Whether the OS/Chromium currently has dark theme enabled

**`nativeTheme.themeSource`**
- **Type**: `string`
- **Values**: `'system'`, `'light'`, `'dark'`
- **Description**: The theme source setting

### `session`

Manages browser sessions, cookies, cache, proxy settings, etc.

#### Properties

**`session.defaultSession`**
- **Type**: `Session`
- **Description**: The default session object

#### Methods

**`session.defaultSession.webRequest.onHeadersReceived(listener)`**
- **Parameters**:
  - `listener` (function): Callback function for modifying headers
- **Description**: Intercepts and modifies HTTP response headers

```javascript
session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': ['default-src \'self\'']
    }
  })
})
```

### `shell`

Manages files and URLs using their default applications.

#### Methods

**`shell.openExternal(url[, options])`**
- **Parameters**:
  - `url` (string): URL to open
  - `options` (Object, optional): Options
- **Returns**: `Promise<void>`
- **Description**: Opens the given URL in the desktop's default browser

```javascript
shell.openExternal('https://github.com')
```

### `webContents`

Manages and controls web pages.

#### Methods

**`webContents.send(channel, ...args)`**
- **Parameters**:
  - `channel` (string): Event channel name
  - `...args` (any[]): Arguments to send
- **Description**: Sends message to renderer process

**`webContents.postMessage(channel, message, [transfer])`**
- **Parameters**:
  - `channel` (string): Event channel name
  - `message` (any): Message to send
  - `transfer` (MessagePortMain[], optional): MessagePorts to transfer
- **Description**: Sends message with transferable objects

## Security Best Practices

### Context Isolation

Always enable context isolation to prevent renderer processes from accessing Node.js APIs directly:

```javascript
new BrowserWindow({
  webPreferences: {
    contextIsolation: true,
    nodeIntegration: false
  }
})
```

### Secure API Exposure

Use `contextBridge` to safely expose APIs instead of disabling context isolation:

```javascript
// Good - Secure API exposure
contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile')
})

// Bad - Insecure exposure
contextBridge.exposeInMainWorld('electronAPI', {
  send: ipcRenderer.send // Exposes entire IPC channel
})
```

### Input Validation

Always validate IPC messages in the main process:

```javascript
ipcMain.handle('get-user-data', (event) => {
  // Validate sender
  if (!validateSender(event.senderFrame)) {
    throw new Error('Unauthorized')
  }
  return getUserData()
})

function validateSender(frame) {
  return new URL(frame.url).origin === 'https://myapp.com'
}
```

### Content Security Policy

Implement strict CSP headers:

```javascript
session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self' 'unsafe-inline' data: gap:; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval';"
      ]
    }
  })
})
```

### Sandboxing

Enable sandboxing for enhanced security:

```javascript
// Global sandboxing
app.enableSandbox()

// Per-window sandboxing
new BrowserWindow({
  webPreferences: {
    sandbox: true,
    preload: path.join(__dirname, 'preload.js')
  }
})
```

## Advanced Features

### Message Ports

Use MessagePorts for advanced IPC scenarios:

```javascript
// Main process
const { port1, port2 } = new MessageChannelMain()
win.webContents.postMessage('port', { message: 'hello' }, [port1])

// Renderer process
ipcRenderer.on('port', (event, msg) => {
  const [port] = event.ports
  port.onmessage = (event) => {
    console.log('Received:', event.data)
  }
})
```

### Native File Drag & Drop

Implement native file drag operations:

```javascript
// Main process
ipcMain.on('ondragstart', (event, filePath) => {
  event.sender.startDrag({
    file: filePath,
    icon: path.join(__dirname, 'icon.png')
  })
})

// Preload script
contextBridge.exposeInMainWorld('electron', {
  startDrag: (fileName) => ipcRenderer.send('ondragstart', fileName)
})
```

### Protocol Handlers

Register custom protocol handlers:

```javascript
app.whenReady().then(() => {
  protocol.registerFileProtocol('myapp', (request, callback) => {
    const url = request.url.substr(8)
    callback({ path: path.normalize(`${__dirname}/${url}`) })
  })
})
```

## Performance Optimization

### Memory Management

- Close unused BrowserWindow instances
- Limit concurrent operations
- Use efficient IPC patterns
- Implement proper cleanup in preload scripts

### Startup Optimization

```javascript
app.whenReady().then(() => {
  createWindow()
  // Defer non-critical initialization
  setTimeout(() => {
    initializeSecondaryFeatures()
  }, 1000)
})
```

### Process Management

- Use `app.allowRendererProcessReuse = true` for better performance
- Implement proper error handling for crashed renderers
- Monitor memory usage with `app.getAppMetrics()`

## Development Tools

### Debugging

Enable DevTools in development:

```javascript
if (process.env.NODE_ENV === 'development') {
  win.webContents.openDevTools()
}
```

### Hot Reload

Implement hot reload for development:

```javascript
if (process.env.NODE_ENV === 'development') {
  require('electron-reload')(__dirname)
}
```

## Building and Distribution

### Basic Build Configuration

```json
{
  "build": {
    "appId": "com.example.app",
    "productName": "My Electron App",
    "directories": {
      "output": "dist"
    },
    "files": [
      "main.js",
      "preload.js",
      "renderer/**/*"
    ],
    "mac": {
      "category": "public.app-category.productivity"
    },
    "win": {
      "target": "nsis"
    },
    "linux": {
      "target": "AppImage"
    }
  }
}
```

### Code Signing

Configure code signing for distribution:

```json
{
  "build": {
    "mac": {
      "hardenedRuntime": true,
      "entitlements": "entitlements.mac.plist"
    },
    "win": {
      "certificateFile": "cert.p12",
      "certificatePassword": "password"
    }
  }
}
```

## Testing

### Unit Testing

Test main process code:

```javascript
// test/main.test.js
const { app, BrowserWindow } = require('electron')
const path = require('path')

describe('Main Process', () => {
  let mainWindow

  beforeEach(async () => {
    await app.whenReady()
    mainWindow = new BrowserWindow({
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    })
  })

  afterEach(() => {
    if (mainWindow) {
      mainWindow.close()
    }
  })

  it('should create main window', () => {
    expect(mainWindow).toBeDefined()
  })
})
```

### Integration Testing

Test IPC communication:

```javascript
// test/ipc.test.js
const { ipcMain, ipcRenderer } = require('electron')

describe('IPC Communication', () => {
  it('should handle file open dialog', async () => {
    const mockFilePath = '/path/to/file.txt'
    
    ipcMain.handle('dialog:openFile', () => mockFilePath)
    
    const result = await ipcRenderer.invoke('dialog:openFile')
    expect(result).toBe(mockFilePath)
  })
})
```

## Common Patterns

### Application Lifecycle Management

```javascript
// main.js
const { app, BrowserWindow } = require('electron')

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('index.html')
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
```

### Settings Management

```javascript
// main.js
const Store = require('electron-store')
const store = new Store()

ipcMain.handle('settings:get', (event, key) => {
  return store.get(key)
})

ipcMain.handle('settings:set', (event, key, value) => {
  store.set(key, value)
})
```

### File System Operations

```javascript
// main.js
const fs = require('fs').promises

ipcMain.handle('fs:readFile', async (event, filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8')
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
})
```

## Troubleshooting

### Common Issues

1. **Context Isolation Issues**
   - Ensure `contextIsolation: true` and use `contextBridge`
   - Don't access Node.js APIs directly from renderer

2. **IPC Communication Failures**
   - Verify channel names match exactly
   - Check if handlers are registered before use
   - Validate message structure

3. **Security Warnings**
   - Enable context isolation
   - Disable node integration
   - Use secure CSP headers

4. **Performance Issues**
   - Minimize IPC message frequency
   - Use efficient data structures
   - Implement proper memory management

### Debug Tips

```javascript
// Enable IPC debugging
if (process.env.NODE_ENV === 'development') {
  ipcMain.on('*', (event, ...args) => {
    console.log('IPC Main:', event.type, args)
  })
}
```

## Resources

- [Official Electron Documentation](https://electronjs.org/docs)
- [Electron Security Guidelines](https://electronjs.org/docs/tutorial/security)
- [Electron Best Practices](https://electronjs.org/docs/tutorial/best-practices)
- [Electron API Demos](https://github.com/electron/electron-api-demos)
- [Electron Builder Documentation](https://www.electron.build/)
- [Electron Forge Documentation](https://www.electronforge.io/)