#!/usr/bin/env python3
"""
Startup script for AI Test Tool Backend Server
"""

import os
import sys
import logging
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def setup_environment():
    """Setup environment variables and logging"""
    # Load environment variables from .env file if it exists
    env_file = backend_dir.parent.parent / ".env"
    if env_file.exists():
        from dotenv import load_dotenv
        load_dotenv(env_file)
        print(f"✅ Loaded environment from {env_file}")
    
    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Set default environment variables
    os.environ.setdefault("HOST", "localhost")
    os.environ.setdefault("PORT", "8000")
    os.environ.setdefault("BROWSER_HEADLESS", "false")
    
def check_dependencies():
    """Check if required dependencies are available"""
    try:
        import browser_use
        import fastapi
        import uvicorn
        print("✅ All required dependencies are available")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Please install dependencies with: pip install browser-use fastapi uvicorn")
        return False

def main():
    """Main startup function"""
    print("🚀 Starting AI Test Tool Backend Server...")
    
    # Setup environment
    setup_environment()
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Import and start server
    try:
        from server import app
        import uvicorn
        
        host = os.getenv("HOST", "localhost")
        port = int(os.getenv("PORT", 8000))
        
        print(f"📡 Server starting on http://{host}:{port}")
        print(f"📋 API documentation available at http://{host}:{port}/docs")
        print("🛑 Press Ctrl+C to stop the server")
        
        uvicorn.run(
            app,
            host=host,
            port=port,
            reload=True,
            log_level="info"
        )
        
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Server startup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()