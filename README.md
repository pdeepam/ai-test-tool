# AI Test Framework

Intelligent web application testing using browser-use and Google Gemini AI.

## Overview

This framework uses AI agents to perform intelligent browser testing with natural language test cases. The AI can navigate websites, analyze content, detect UI/UX issues, and generate structured bug reports.

## Features

- 🤖 **AI-Powered Testing**: Natural language test instructions
- 🔍 **Intelligent Analysis**: AI detects layout, accessibility, and usability issues
- 📸 **Visual Evidence**: Automatic screenshot capture for issues
- 📝 **Structured Reports**: Markdown bug reports with severity levels
- 🌐 **Universal**: Works with any web application
- ⚡ **Easy Setup**: One command setup with Python virtual environment

## Quick Start

### 1. Setup
```bash
./setup.sh
```

### 2. Configure
```bash
# Copy and edit environment file
cp .env.example .env
# Add your Google API key to .env
```

### 3. Test
```bash
source venv/bin/activate
python simple_test.py
```

## Requirements

- Python 3.11+
- Google Gemini API key
- Web application running (default: localhost:3000)

## Configuration

Edit `.env` file:
```bash
GOOGLE_API_KEY=your_api_key_here
TARGET_URL=http://localhost:3000  # Change to your app URL
```

## Test Cases

Create natural language test cases in markdown files:

```markdown
# Login Flow Test
Navigate to the login page and verify:
1. Form is visible and properly labeled
2. Validation works for empty fields
3. Error messages are clear and helpful
4. Successful login redirects correctly
```

## Generated Reports

The AI generates structured bug reports:

```markdown
### 🔴 CRITICAL: Navigation Overlap on Mobile
**Screenshot**: screenshots/homepage-issue-001.png
**Description**: Navigation menu overlaps content on mobile
**Impact**: Users cannot access main content
**Location**: Homepage
```

## Architecture

- **browser-use**: AI agent for browser automation
- **Google Gemini**: LLM for intelligent analysis
- **Playwright**: Browser control and screenshots
- **Python**: Main framework language

## Documentation

- `docs/browser-use-integration.md` - Technical architecture
- `docs/phase1-implementation.md` - Implementation progress
- `tasks/` - Development tracking

## Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Submit pull request

## License

MIT License - see LICENSE file for details.