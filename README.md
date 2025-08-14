# AI Test Framework

*Revolutionizing web application testing with artificial intelligence*

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![AI](https://img.shields.io/badge/AI-Powered-purple.svg)](https://github.com/deepam/ai-test-tool)

## 🚀 The Problem

Manual web testing is **time-consuming, error-prone, and expensive**. Traditional automation tools require:
- Complex setup and maintenance
- Technical expertise to write test scripts
- Brittle selectors that break with UI changes
- Limited ability to detect UX/accessibility issues
- No intelligent analysis of user experience

## 💡 The Solution

**AI Test Framework** transforms testing with intelligent agents that think like human testers but work at machine speed.

### What Makes This Different

🧠 **Think Like Humans, Test Like Machines**
- Write tests in plain English: *"Navigate to login and check if the form is user-friendly"*
- AI understands context, intent, and user experience
- Automatically detects accessibility and usability issues

🔍 **Intelligent Problem Detection**
- Spots layout overlaps, poor contrast, unclear error messages
- Identifies broken user flows and navigation issues
- Generates actionable bug reports with visual evidence

⚡ **Zero-Maintenance Automation** 
- No brittle selectors or hard-coded elements
- Adapts to UI changes automatically
- Works across any web application without modification

## ✨ Key Features

- 🤖 **Natural Language Testing**: Write tests like user stories
- 🎯 **Smart Bug Detection**: AI identifies UX/accessibility issues humans miss
- 📸 **Visual Evidence**: Automatic screenshots with issue highlighting
- 📊 **Structured Reports**: Professional bug reports with severity classification
- 🌐 **Universal Compatibility**: Test any web application instantly
- 🛠️ **Developer-Friendly**: Simple setup, powerful results

## 🚀 Quick Start

Get up and running in under 5 minutes:

### 1. Clone & Setup
```bash
git clone https://github.com/your-username/ai-test-tool.git
cd ai-test-tool
./setup.sh
```

### 2. Configure API Key
```bash
cp .env.example .env
# Edit .env and add your Google Gemini API key
```

**Get a free API key**: [Google AI Studio](https://aistudio.google.com/app/apikey)

### 3. Run Your First Test
```bash
source venv/bin/activate
python simple_test.py
```

**That's it!** The AI will test your app and generate a detailed report.

## 📋 Prerequisites

- **Python 3.11+** (Download from [python.org](https://python.org))
- **Google Gemini API Key** (Free tier available)
- **Web application** to test (or use the demo at localhost:3000)

## ⚙️ Configuration

Create your `.env` file:
```bash
# Required: Your Google Gemini API key
GOOGLE_API_KEY=your_api_key_here

# Optional: Target application URL
TARGET_URL=http://localhost:3000

# Optional: Browser settings  
BROWSER_USE_HEADLESS=false
CHROME_CDP_PORT=9222
```

## 📝 Writing Tests

Create tests in **plain English** - no programming required:

```markdown
# E-commerce Checkout Test
Test the shopping cart and checkout flow:

1. Add items to cart and verify quantities are correct
2. Navigate to checkout and test form validation
3. Check that payment options are clearly displayed
4. Verify order confirmation shows correct details
5. Ensure the user experience feels smooth and intuitive
```

The AI understands your intent and creates comprehensive test scenarios automatically.

## 📊 Sample Output

Here's what you get - professional bug reports with visual evidence:

```markdown
### 🔴 CRITICAL: Mobile Navigation Unusable
**Location**: Homepage - Mobile View  
**Screenshot**: screenshots/nav-overlap-mobile.png  
**Issue**: Navigation menu overlaps main content on devices < 768px  
**Impact**: Users cannot access primary site content  
**Recommendation**: Implement hamburger menu or adjust breakpoints  

### 🟡 MEDIUM: Form Validation Unclear  
**Location**: Contact Form  
**Screenshot**: screenshots/form-validation.png  
**Issue**: Error messages appear in small, hard-to-read text  
**Impact**: Users may miss validation feedback  
**Recommendation**: Increase font size and use contrasting colors  
```

## 🏗️ Technical Architecture

**Modern Stack, Proven Technologies:**

- 🤖 **[browser-use](https://github.com/browser-use/browser-use)**: AI-powered browser automation
- 🧠 **Google Gemini**: Advanced language model for intelligent analysis  
- 🌐 **Playwright**: Reliable browser control and screenshot capture
- 🐍 **Python**: Clean, maintainable framework code
- ⚡ **FastAPI**: RESTful API for integration capabilities

## 🎯 Use Cases

Perfect for:
- **QA Teams**: Automate regression testing and bug discovery
- **Product Managers**: Validate user experience across features  
- **Developers**: Catch accessibility issues before deployment
- **Startups**: Comprehensive testing without dedicated QA resources
- **Agencies**: Deliver quality assurance as a service

## 📚 Project Structure

```
ai-test-tool/
├── src/
│   ├── backend/           # Core testing engine
│   ├── generators/        # Test case generators  
│   └── main/             # Electron app (optional UI)
├── docs/                 # Technical documentation
├── tasks/                # Example test cases
└── reports/              # Generated test reports
```

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Setup
```bash
git clone https://github.com/your-username/ai-test-tool.git
cd ai-test-tool
./setup.sh
source venv/bin/activate
python -m pytest tests/
```

## 📄 License

MIT License - feel free to use this in your projects! See [LICENSE](LICENSE) for details.

---

**⭐ Found this useful?** Give it a star and share with your team!

**🐛 Found a bug?** [Open an issue](https://github.com/your-username/ai-test-tool/issues) - we respond quickly!

**💬 Questions?** [Start a discussion](https://github.com/your-username/ai-test-tool/discussions) - we love to help!