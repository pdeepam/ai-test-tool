#!/usr/bin/env python3
"""
Simple test script for the AI Test Tool Backend API
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"✅ Health check: {response.status_code}")
        print(f"   Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_root():
    """Test root endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        print(f"✅ Root endpoint: {response.status_code}")
        print(f"   Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Root endpoint failed: {e}")
        return False

def test_start_session():
    """Test starting a test session"""
    try:
        test_data = {
            "test_cases": [
                {
                    "id": "test_1",
                    "name": "Sample Test",
                    "description": "A sample test case",
                    "target_url": "https://example.com",
                    "steps": ["Navigate to page", "Check title"],
                    "expected_results": ["Page loads", "Title is correct"]
                }
            ],
            "config": {
                "viewport_width": 1920,
                "viewport_height": 1080,
                "browser_type": "chromium",
                "headless": False,
                "timeout": 30000
            }
        }
        
        response = requests.post(f"{BASE_URL}/test/start", json=test_data, timeout=10)
        print(f"✅ Start test session: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"   Session ID: {result.get('session_id')}")
            return result.get('session_id')
        else:
            print(f"   Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Start test session failed: {e}")
        return None

def test_service_initialize():
    """Test service initialization"""
    try:
        response = requests.post(f"{BASE_URL}/service/initialize", timeout=30)
        print(f"✅ Service initialize: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   Status: {result.get('status')}")
            print(f"   Components: {list(result.get('components', {}).keys())}")
            return True
        else:
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Service initialize failed: {e}")
        return False

def test_service_status():
    """Test service status"""
    try:
        response = requests.get(f"{BASE_URL}/service/status", timeout=10)
        print(f"✅ Service status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   Active sessions: {result.get('sessions', {}).get('active', 0)}")
            print(f"   LLM provider: {result.get('llm_provider', {}).get('type', 'Unknown')}")
            return True
        else:
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Service status failed: {e}")
        return False

def main():
    """Run all API tests"""
    print("🧪 Testing AI Test Tool Backend API...\n")
    
    # Test basic endpoints
    if not test_health():
        print("❌ Server is not responding")
        return
    
    print()
    test_root()
    
    print()
    test_service_initialize()
    
    print()
    test_service_status()
    
    print()
    session_id = test_start_session()
    
    if session_id:
        print(f"\n✅ All API tests passed! Session ID: {session_id}")
    else:
        print("\n❌ Some tests failed")

if __name__ == "__main__":
    main()