#!/usr/bin/env python3
"""
Simple integration test to verify frontend-backend connection
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_simple_navigation():
    """Test a simple navigation test case"""
    
    # Test case: Navigate to Google and check title
    test_data = {
        "test_cases": [
            {
                "id": "test_google_nav",
                "name": "Google Navigation Test",
                "description": "Navigate to Google and verify title",
                "target_url": "https://www.google.com",
                "steps": [
                    "Navigate to https://www.google.com",
                    "Wait for page to load completely",
                    "Verify page title contains 'Google'",
                    "Take a screenshot for verification"
                ],
                "expected_results": [
                    "Page loads successfully",
                    "Title is visible and contains 'Google'",
                    "No JavaScript errors in console"
                ],
                "priority": "high"
            }
        ],
        "config": {
            "viewport_width": 1920,
            "viewport_height": 1080,
            "browser_type": "chromium",
            "headless": False,  # Set to True if you want headless
            "timeout": 30000,
            "max_steps": 25,
            "enable_screenshots": True,
            "wait_for_network_idle": True
        }
    }
    
    print("🧪 Testing integration: Frontend ↔ Backend ↔ Browser")
    print(f"Target URL: {test_data['test_cases'][0]['target_url']}")
    print(f"Browser mode: {'Headless' if test_data['config']['headless'] else 'Visible'}")
    print()
    
    try:
        # Start test session
        print("📤 Starting test session...")
        response = requests.post(f"{BASE_URL}/test/start", json=test_data, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ Failed to start test session: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
        result = response.json()
        session_id = result["session_id"]
        print(f"✅ Test session started: {session_id}")
        print()
        
        # Poll for progress
        print("⏳ Monitoring test execution...")
        max_polls = 30  # 1 minute max
        poll_count = 0
        
        while poll_count < max_polls:
            time.sleep(2)
            poll_count += 1
            
            try:
                status_response = requests.get(f"{BASE_URL}/test/status/{session_id}", timeout=5)
                if status_response.status_code == 200:
                    status_data = status_response.json()
                    
                    print(f"   Progress: {status_data['completed_tests']}/{status_data['total_tests']} "
                          f"({status_data['progress_percentage']:.1f}%) - Status: {status_data['status']}")
                    
                    if status_data['status'] in ['completed', 'error', 'stopped']:
                        break
                        
            except Exception as e:
                print(f"   Status check error: {e}")
        
        print()
        
        # Get final results
        print("📊 Getting final results...")
        results_response = requests.get(f"{BASE_URL}/test/results/{session_id}", timeout=5)
        
        if results_response.status_code == 200:
            results_data = results_response.json()
            summary = results_data['summary']
            
            print(f"✅ Test execution completed!")
            print(f"   Total tests: {summary['total']}")
            print(f"   Passed: {summary['passed']}")
            print(f"   Failed: {summary['failed']}")
            print(f"   Errors: {summary['errors']}")
            
            if summary['passed'] > 0:
                print("🎉 SUCCESS: At least one test passed - integration is working!")
                return True
            else:
                print("⚠️  No tests passed, but execution completed")
                return False
        else:
            print(f"❌ Failed to get results: {results_response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Integration test failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 AI Test Tool - Integration Test")
    print("=" * 50)
    
    # Test health first
    try:
        health_response = requests.get(f"{BASE_URL}/health", timeout=5)
        if health_response.status_code == 200:
            print("✅ Backend is healthy and ready")
        else:
            print("❌ Backend health check failed")
            exit(1)
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        print("   Make sure the backend is running with: python src/backend/server.py")
        exit(1)
    
    print()
    success = test_simple_navigation()
    
    if success:
        print("\n🎉 Integration test PASSED! The system is working end-to-end.")
    else:
        print("\n❌ Integration test had issues. Check the logs above.")