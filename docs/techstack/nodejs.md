# Node.js API Reference

Node.js® is a JavaScript runtime built on Chrome's V8 JavaScript engine. Node.js uses an event-driven, non-blocking I/O model that makes it lightweight and efficient.

## Core Modules

### File System (fs)

The `fs` module provides an API for interacting with the file system in a manner closely modeled around standard POSIX functions.

#### Asynchronous Methods

```javascript
const fs = require('fs');
const fsPromises = require('fs').promises;

// Promise-based API (recommended)
async function readFile(filePath) {
  try {
    const data = await fsPromises.readFile(filePath, 'utf8');
    return data;
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
}

// Callback-based API
fs.readFile('example.txt', 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(data);
});
```

#### Key Methods

- **`fs.readFile(path, options, callback)`** - Asynchronously reads the entire contents of a file
- **`fs.writeFile(file, data, options, callback)`** - Asynchronously writes data to a file
- **`fs.access(path, mode, callback)`** - Tests a user's permissions for the file or directory
- **`fs.mkdir(path, options, callback)`** - Creates a directory
- **`fs.readdir(path, options, callback)`** - Reads the contents of a directory
- **`fs.stat(path, callback)`** - Gets file statistics
- **`fs.unlink(path, callback)`** - Deletes a file
- **`fs.rmdir(path, callback)`** - Removes a directory

#### File Streams

```javascript
const fs = require('fs');

// Read stream
const readStream = fs.createReadStream('large-file.txt', { encoding: 'utf8' });
readStream.on('data', (chunk) => {
  console.log('Received chunk:', chunk);
});

// Write stream
const writeStream = fs.createWriteStream('output.txt');
writeStream.write('Hello, ');
writeStream.write('World!');
writeStream.end();
```

### HTTP Module

The `http` module provides functionality to create HTTP servers and clients.

#### HTTP Server

```javascript
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello, World!');
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

#### HTTP Client

```javascript
const http = require('http');

// GET request
const options = {
  hostname: 'example.com',
  port: 80,
  path: '/api/data',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(data);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();
```

#### Key Classes and Methods

- **`http.createServer(requestListener)`** - Creates a new HTTP server
- **`http.request(options, callback)`** - Makes an HTTP request
- **`http.get(options, callback)`** - Convenience method for GET requests
- **`server.listen(port, hostname, callback)`** - Starts the server listening for connections

### Path Module

The `path` module provides utilities for working with file and directory paths.

```javascript
const path = require('path');

// Path manipulation
const filePath = '/home/user/documents/file.txt';

console.log(path.dirname(filePath));  // '/home/user/documents'
console.log(path.basename(filePath)); // 'file.txt'
console.log(path.extname(filePath));  // '.txt'

// Path joining
const fullPath = path.join('/home', 'user', 'documents', 'file.txt');
console.log(fullPath); // '/home/user/documents/file.txt'

// Path resolution
const absolutePath = path.resolve('./relative/path');
console.log(absolutePath); // Absolute path from current directory
```

#### Key Methods

- **`path.join(...paths)`** - Joins path segments using the platform-specific separator
- **`path.resolve(...paths)`** - Resolves a sequence of paths to an absolute path
- **`path.dirname(path)`** - Returns the directory name of a path
- **`path.basename(path, ext)`** - Returns the last portion of a path
- **`path.extname(path)`** - Returns the extension of the path
- **`path.parse(path)`** - Returns an object with path components
- **`path.format(pathObject)`** - Returns a path string from an object

### Events Module

The `events` module provides the EventEmitter class for handling events.

```javascript
const EventEmitter = require('events');

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();

// Listen for events
myEmitter.on('event', (data) => {
  console.log('Event received:', data);
});

// Emit events
myEmitter.emit('event', 'Hello, World!');

// One-time listener
myEmitter.once('oneTime', () => {
  console.log('This will only run once');
});

// Error handling
myEmitter.on('error', (error) => {
  console.error('Error occurred:', error);
});
```

#### Key Methods

- **`emitter.on(eventName, listener)`** - Adds a listener for the specified event
- **`emitter.once(eventName, listener)`** - Adds a one-time listener
- **`emitter.emit(eventName, ...args)`** - Emits an event with optional arguments
- **`emitter.removeListener(eventName, listener)`** - Removes a listener
- **`emitter.removeAllListeners(eventName)`** - Removes all listeners for an event

### Stream Module

The `stream` module provides the base API for implementing streaming data interfaces.

```javascript
const { Readable, Writable, Transform } = require('stream');

// Readable stream
class MyReadable extends Readable {
  constructor(options) {
    super(options);
    this.counter = 0;
  }
  
  _read() {
    if (this.counter < 5) {
      this.push(`data-${this.counter++}`);
    } else {
      this.push(null); // End of stream
    }
  }
}

// Writable stream
class MyWritable extends Writable {
  _write(chunk, encoding, callback) {
    console.log('Writing:', chunk.toString());
    callback();
  }
}

// Transform stream
class MyTransform extends Transform {
  _transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
}

// Usage
const readable = new MyReadable();
const writable = new MyWritable();
const transform = new MyTransform();

readable.pipe(transform).pipe(writable);
```

#### Stream Types

- **Readable** - Streams from which data can be read
- **Writable** - Streams to which data can be written
- **Duplex** - Streams that are both readable and writable
- **Transform** - Duplex streams that can modify or transform data

### Util Module

The `util` module provides utility functions for debugging and formatting.

```javascript
const util = require('util');

// Promisify callback-based functions
const fs = require('fs');
const readFile = util.promisify(fs.readFile);

async function example() {
  try {
    const data = await readFile('file.txt', 'utf8');
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Inspect objects
const obj = { name: 'John', age: 30, hobbies: ['reading', 'coding'] };
console.log(util.inspect(obj, { colors: true, depth: null }));

// Format strings
console.log(util.format('Hello %s, you are %d years old', 'John', 30));
```

#### Key Methods

- **`util.promisify(original)`** - Converts a callback-based function to a promise-based function
- **`util.inspect(object, options)`** - Returns a formatted string representation of an object
- **`util.format(format, ...args)`** - Formats a string with placeholders
- **`util.deprecate(fn, msg)`** - Marks a function as deprecated

## Modern Async/Await Patterns

### Promise-Based APIs

```javascript
const fsPromises = require('fs').promises;

// Sequential operations
async function processFiles() {
  try {
    const files = await fsPromises.readdir('./data');
    for (const file of files) {
      const content = await fsPromises.readFile(`./data/${file}`, 'utf8');
      console.log(`Processing ${file}: ${content.length} characters`);
    }
  } catch (error) {
    console.error('Error processing files:', error);
  }
}

// Parallel operations
async function processFilesParallel() {
  try {
    const files = await fsPromises.readdir('./data');
    const promises = files.map(file => 
      fsPromises.readFile(`./data/${file}`, 'utf8')
    );
    const contents = await Promise.all(promises);
    contents.forEach((content, index) => {
      console.log(`File ${files[index]}: ${content.length} characters`);
    });
  } catch (error) {
    console.error('Error processing files:', error);
  }
}
```

### Error Handling Best Practices

```javascript
// Proper error handling with async/await
async function robustFileOperation(filePath) {
  try {
    // Check if file exists
    await fsPromises.access(filePath);
    
    // Read file
    const data = await fsPromises.readFile(filePath, 'utf8');
    
    // Process data
    const processedData = data.toUpperCase();
    
    // Write processed data
    await fsPromises.writeFile(`${filePath}.processed`, processedData);
    
    return processedData;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    } else if (error.code === 'EACCES') {
      throw new Error(`Permission denied: ${filePath}`);
    }
    throw error;
  }
}
```

## Security Guidelines

### Input Validation

```javascript
const path = require('path');

// Prevent path traversal attacks
function validateFilePath(userInput) {
  const normalized = path.normalize(userInput);
  const resolved = path.resolve(normalized);
  const safe = path.resolve('./safe-directory');
  
  if (!resolved.startsWith(safe)) {
    throw new Error('Path traversal attempt detected');
  }
  
  return resolved;
}

// Sanitize user input
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  
  // Remove potentially dangerous characters
  return input.replace(/[<>:"\/\\|?*\x00-\x1f]/g, '');
}
```

### Environment Variables

```javascript
// Secure environment variable handling
function getRequiredEnvVar(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

// Use environment variables for sensitive data
const config = {
  port: process.env.PORT || 3000,
  dbUrl: getRequiredEnvVar('DATABASE_URL'),
  jwtSecret: getRequiredEnvVar('JWT_SECRET')
};
```

## Performance Optimization

### Memory Management

```javascript
// Avoid memory leaks with proper cleanup
class ResourceManager {
  constructor() {
    this.resources = new Map();
    this.cleanup = this.cleanup.bind(this);
    process.on('exit', this.cleanup);
    process.on('SIGINT', this.cleanup);
  }
  
  allocateResource(id, resource) {
    this.resources.set(id, resource);
  }
  
  cleanup() {
    for (const [id, resource] of this.resources) {
      if (resource.close) {
        resource.close();
      }
    }
    this.resources.clear();
  }
}
```

### Stream Processing for Large Files

```javascript
const fs = require('fs');
const { pipeline } = require('stream');

// Efficient large file processing
async function processLargeFile(inputPath, outputPath) {
  const transform = new Transform({
    transform(chunk, encoding, callback) {
      // Process chunk
      const processed = chunk.toString().toUpperCase();
      callback(null, processed);
    }
  });
  
  await pipeline(
    fs.createReadStream(inputPath),
    transform,
    fs.createWriteStream(outputPath)
  );
}
```

## Testing Patterns

### Unit Testing with Built-in Assert

```javascript
const assert = require('assert');

// Test function
function add(a, b) {
  return a + b;
}

// Test cases
function testAdd() {
  assert.strictEqual(add(2, 3), 5);
  assert.strictEqual(add(-1, 1), 0);
  assert.strictEqual(add(0, 0), 0);
  console.log('All tests passed!');
}

testAdd();
```

### Mocking with Util

```javascript
const util = require('util');

// Mock function for testing
function createMockFunction(returnValue) {
  const mock = function(...args) {
    mock.calls.push(args);
    return returnValue;
  };
  mock.calls = [];
  return mock;
}

// Test with mock
const mockReadFile = createMockFunction('test content');
// Use mock in tests
```

## Common Patterns

### Singleton Pattern

```javascript
class Database {
  constructor() {
    if (Database.instance) {
      return Database.instance;
    }
    this.connection = null;
    Database.instance = this;
  }
  
  connect() {
    if (!this.connection) {
      this.connection = 'database-connection';
    }
    return this.connection;
  }
}

const db1 = new Database();
const db2 = new Database();
console.log(db1 === db2); // true
```

### Factory Pattern

```javascript
class FileProcessor {
  static create(type) {
    switch (type) {
      case 'text':
        return new TextProcessor();
      case 'json':
        return new JSONProcessor();
      default:
        throw new Error(`Unknown processor type: ${type}`);
    }
  }
}

class TextProcessor {
  process(data) {
    return data.toString().toUpperCase();
  }
}

class JSONProcessor {
  process(data) {
    return JSON.parse(data.toString());
  }
}
```

## Best Practices

1. **Always handle errors** - Use try-catch with async/await or proper error callbacks
2. **Use environment variables** - Store configuration and secrets in environment variables
3. **Validate input** - Always validate and sanitize user input
4. **Use streams for large data** - Process large files with streams to avoid memory issues
5. **Implement proper logging** - Use structured logging for debugging and monitoring
6. **Handle process signals** - Gracefully handle SIGINT and SIGTERM for cleanup
7. **Use TypeScript** - Consider TypeScript for better type safety and IDE support
8. **Monitor performance** - Use profiling tools to identify bottlenecks
9. **Keep dependencies updated** - Regularly update dependencies for security patches
10. **Follow security guidelines** - Implement security best practices from the start

## Process Management

```javascript
// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Uncaught exception
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
```