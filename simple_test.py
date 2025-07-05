#!/usr/bin/env python3
"""Simple browser-use test with configurable settings."""

import asyncio
from browser_use import Agent
from browser_use.llm import ChatGoogle
from config import Config, ensure_directories

async def test_simple():
    """Simple test using configuration settings."""
    
    print("🔄 Testing AI Test Framework...")
    
    try:
        # Validate configuration
        Config.validate()
        ensure_directories()
        
        print(f"🎯 Target URL: {Config.TARGET_URL}")
        print(f"🤖 Model: {Config.MODEL_NAME}")
        
        # Create LLM and agent with configuration
        llm = ChatGoogle(model=Config.MODEL_NAME)
        task = f"Navigate to {Config.TARGET_URL} and analyze the page for any UI/UX issues. Describe what you see and report any problems with layout, accessibility, or usability."
        
        agent = Agent(task=task, llm=llm)
        
        result = await agent.run()
        
        print("✅ Test completed successfully!")
        print("\n📋 AI Analysis:")
        print("=" * 50)
        if hasattr(result, 'extracted_content'):
            print(result.extracted_content)
        else:
            print(result)
        print("=" * 50)
        
    except ValueError as e:
        print(f"❌ Configuration Error: {str(e)}")
        print("💡 Please check your .env file and ensure all required values are set.")
    except Exception as e:
        print(f"❌ Test Failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_simple())