# AI Test Framework - Project Structure

## 📁 Root Directory
```
ai-test-framework/
├── .env                      # Environment variables (API keys)
├── .env.example              # Environment template
├── README.md                 # Main documentation
├── requirements.txt          # Python dependencies
├── setup.sh                  # One-command setup script
├── config.py                 # Configuration management
├── simple_test.py            # Main test runner
├── run-tests.js              # Legacy Node.js runner (reference)
└── STRUCTURE.md              # This file
```

## 📚 Documentation (`docs/`)
```
docs/
├── browser-use-integration.md  # Technical architecture
└── phase1-implementation.md    # Implementation progress
```

## 🎯 Configuration (`config/`)
```
config/
└── test-config.js             # Legacy config (reference patterns)
```

## 🏗️ Source Code (`src/`)
```
src/
├── comprehensive-framework.js  # Legacy framework reference
├── core/                      # Core framework modules
├── discovery/                 # Pattern discovery modules
├── generators/                # Test generation modules
└── utils/                     # Utility functions
```

## 📋 Tasks (`tasks/`)
```
tasks/
├── setup-tasks.md            # Environment setup tracking
├── integration-tasks.md      # Integration planning
├── testing-tasks.md          # Test case development
└── documentation-tasks.md    # Documentation planning
```

## 🚀 Getting Started

1. **Setup**: `./setup.sh`
2. **Configure**: Edit `.env` with your API key
3. **Test**: `python simple_test.py`

## 📦 Generated Directories (after first run)
```
test_cases/                   # Natural language test files
reports/                      # Generated bug reports
├── bugs/                     # Bug report markdown files
└── screenshots/              # Visual evidence
venv/                        # Python virtual environment
```

## 🔧 Key Files

- **`simple_test.py`**: Main entry point for testing
- **`config.py`**: Centralized configuration management
- **`setup.sh`**: Automated environment setup
- **`.env`**: API keys and settings (not in git)
- **`requirements.txt`**: Python package dependencies