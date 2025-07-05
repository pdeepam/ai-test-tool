#!/usr/bin/env python3
"""Configuration for AI Test Framework."""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Configuration settings for the test framework."""
    
    # API Configuration
    GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
    MODEL_NAME = os.getenv('MODEL_NAME', 'gemini-2.0-flash')
    
    # Target Application
    TARGET_URL = os.getenv('TARGET_URL', 'http://localhost:3000')
    
    # Browser Settings
    CHROME_CDP_PORT = int(os.getenv('CHROME_CDP_PORT', '9222'))
    HEADLESS = os.getenv('BROWSER_USE_HEADLESS', 'false').lower() == 'true'
    
    # Test Settings
    TEST_CASES_DIR = os.getenv('TEST_CASES_DIR', 'test_cases')
    REPORTS_DIR = os.getenv('REPORTS_DIR', 'reports')
    SCREENSHOTS_DIR = os.getenv('SCREENSHOTS_DIR', 'reports/screenshots')
    
    # Validation
    @classmethod
    def validate(cls):
        """Validate required configuration."""
        if not cls.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY is required in .env file")
        
        if not cls.TARGET_URL:
            raise ValueError("TARGET_URL is required in .env file")
        
        return True

# Create directories if they don't exist
def ensure_directories():
    """Ensure required directories exist."""
    os.makedirs(Config.TEST_CASES_DIR, exist_ok=True)
    os.makedirs(Config.REPORTS_DIR, exist_ok=True)
    os.makedirs(Config.SCREENSHOTS_DIR, exist_ok=True)