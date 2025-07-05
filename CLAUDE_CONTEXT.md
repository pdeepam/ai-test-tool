# Claude Context Prompt for AI Test Framework

## 🤖 **Starting Prompt for New Claude Sessions**

Copy and paste this prompt when starting a new Claude session to quickly establish context:

---

**Hi Claude! I'm working on an AI Test Framework project. Here's the context:**

**Project**: AI-powered web application testing using browser-use and Google Gemini  
**Location**: `/Users/deepam/Documents/windsurf_projects/ai-test-framework/`  
**Language**: Python with browser-use library  

**What it does:**
- Uses AI agents to test web applications with natural language instructions
- Detects UI/UX issues automatically (layout, accessibility, usability)  
- Generates structured bug reports in markdown format
- Captures screenshots as visual evidence

**Current Status:**
- ✅ Working browser-use implementation with Google Gemini 2.0 Flash
- ✅ Basic agent can navigate and analyze web pages
- ✅ Configurable setup for any web application
- 🔄 Need to complete: Test case system, bug logging, test runner

**Key Files:**
- `simple_test.py` - Main working test (connects to Gemini, runs browser-use agent)
- `config.py` - Configuration management  
- `.env` - Contains Google API key
- `docs/` - Technical documentation and implementation progress

**Phase 1 Goal:** Create natural language test cases in MD files → AI agent executes them → Generate structured .md bug reports

**Tech Stack:** Python, browser-use, Google Gemini API, Playwright, markdown

Please help me continue development from where we left off. What would you like to work on?

---

## 📋 **Context Notes for Claude**

### **Project History**
- Started as part of TradeCoach web app testing
- Evolved into standalone universal testing framework
- Moved from Node.js approach to Python browser-use implementation
- Successfully integrated Google Gemini 2.0 Flash LLM

### **What Works Currently**
```python
# This works perfectly:
from browser_use import Agent
from browser_use.llm import ChatGoogle

llm = ChatGoogle(model="gemini-2.0-flash")
agent = Agent(task="Navigate to http://localhost:3000 and analyze for UI issues", llm=llm)
result = await agent.run()
```

### **Architecture Decisions Made**
- **Python over Node.js**: Browser-use is Python-native
- **Direct browser-use**: No complex wrappers or integrations
- **Gemini 2.0 Flash**: Chosen for speed and intelligence
- **Markdown reports**: Human-readable, git-friendly format
- **Configurable URLs**: Works with any web application

### **Phase 1 Remaining Tasks**
1. **Test Case System**: Create MD files with natural language test scenarios
2. **Bug Logging**: Python script to capture AI findings and generate .md reports  
3. **Test Runner**: Execute multiple test cases sequentially
4. **Screenshot Integration**: Link visual evidence to bug reports

### **Key Design Principles**
- **Simple**: Easy setup and usage
- **Universal**: Works with any web app
- **Intelligent**: AI-powered analysis, not just automation
- **Actionable**: Clear bug reports with severity levels
- **Visual**: Screenshots for UI/UX issues

### **Environment Setup**
```bash
./setup.sh  # Creates venv, installs browser-use
# Edit .env with GOOGLE_API_KEY
python simple_test.py  # Test the working implementation
```

Use this context to quickly onboard Claude and continue development efficiently!