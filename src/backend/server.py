from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
import asyncio
import logging
import os
from datetime import datetime

from browser_agent import agent_manager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Test Tool Backend",
    description="Backend service for AI-powered web testing using browser-use",
    version="1.0.0"
)

# Enable CORS for Electron app communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the Electron app origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class TestCase(BaseModel):
    id: str
    name: str
    description: str
    target_url: str
    steps: List[str]
    expected_results: List[str]
    priority: str = "medium"

class TestConfig(BaseModel):
    viewport_width: int = 1920
    viewport_height: int = 1080
    browser_type: str = "chromium"
    headless: bool = False
    timeout: int = 30000
    keep_browser_open: bool = False

class TestRequest(BaseModel):
    test_cases: List[TestCase]
    config: TestConfig

class TestResult(BaseModel):
    test_case_id: str
    status: str  # "running", "passed", "failed", "error"
    message: str
    screenshots: List[str] = []
    execution_time: float = 0.0
    timestamp: str

# In-memory storage for active test sessions
active_sessions: Dict[str, Dict[str, Any]] = {}
test_results: Dict[str, List[TestResult]] = {}
session_agents: Dict[str, List[str]] = {}  # Maps session_id to agent_ids

@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "name": "AI Test Tool Backend",
        "version": "1.0.0",
        "status": "running",
        "description": "AI-powered web testing backend using browser-use",
        "endpoints": {
            "health": "/health",
            "service": {
                "initialize": "/service/initialize",
                "reset": "/service/reset", 
                "status": "/service/status"
            },
            "test": {
                "start": "/test/start",
                "stop": "/test/stop/{session_id}",
                "status": "/test/status/{session_id}",
                "results": "/test/results/{session_id}"
            }
        },
        "documentation": "/docs"
    }

@app.get("/health")
async def health_check():
    """Enhanced health check endpoint"""
    try:
        # Import checks
        import browser_use
        import playwright
        
        # LLM provider check
        llm_status = "available" if agent_manager.llm_provider else "not_configured"
        llm_type = type(agent_manager.llm_provider).__name__ if agent_manager.llm_provider else "None"
        
        # System resources check
        import psutil
        memory_usage = psutil.virtual_memory().percent
        cpu_usage = psutil.cpu_percent(interval=1)
        
        # Browser capabilities check
        browser_status = "available"
        try:
            from browser_use import BrowserSession, BrowserProfile
            # Quick browser test
            test_profile = BrowserProfile(headless=True)
            test_session = BrowserSession(browser_profile=test_profile)
            await test_session.start()
            await test_session.close()
        except Exception as browser_error:
            browser_status = f"error: {str(browser_error)}"
        
        health_data = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "browser_use": "available",
                "playwright": "available", 
                "llm_provider": llm_status,
                "browser_capabilities": browser_status
            },
            "system": {
                "memory_usage_percent": memory_usage,
                "cpu_usage_percent": cpu_usage
            },
            "application": {
                "active_sessions": len(active_sessions),
                "active_agents": len(agent_manager.active_agents),
                "llm_provider_type": llm_type
            }
        }
        
        # Determine overall health
        if browser_status.startswith("error") or llm_status == "not_configured":
            health_data["status"] = "degraded"
        
        return health_data
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": str(e),
            "services": {
                "browser_use": "unknown",
                "playwright": "unknown",
                "llm_provider": "unknown"
            }
        }

@app.post("/service/initialize")
async def initialize_service():
    """Initialize and validate all service components"""
    try:
        initialization_results = {
            "timestamp": datetime.now().isoformat(),
            "components": {},
            "status": "success"
        }
        
        # Initialize browser-use
        try:
            import browser_use
            from browser_use import BrowserSession, BrowserProfile
            
            # Test browser session creation
            test_profile = BrowserProfile(headless=True)
            test_session = BrowserSession(browser_profile=test_profile)
            await test_session.start()
            await test_session.close()
            
            initialization_results["components"]["browser_use"] = {
                "status": "initialized",
                "version": getattr(browser_use, "__version__", "unknown")
            }
        except Exception as e:
            initialization_results["components"]["browser_use"] = {
                "status": "failed",
                "error": str(e)
            }
            initialization_results["status"] = "partial"
        
        # Initialize LLM provider
        try:
            agent_manager._setup_llm_provider()
            llm_type = type(agent_manager.llm_provider).__name__
            
            initialization_results["components"]["llm_provider"] = {
                "status": "initialized" if agent_manager.llm_provider else "not_configured",
                "type": llm_type,
                "available": agent_manager.llm_provider is not None
            }
        except Exception as e:
            initialization_results["components"]["llm_provider"] = {
                "status": "failed",
                "error": str(e)
            }
            initialization_results["status"] = "partial"
        
        # Initialize Playwright browsers
        try:
            import playwright
            from playwright.async_api import async_playwright
            
            # Test playwright installation
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                await browser.close()
            
            initialization_results["components"]["playwright"] = {
                "status": "initialized",
                "browsers": ["chromium", "firefox", "webkit"]
            }
        except Exception as e:
            initialization_results["components"]["playwright"] = {
                "status": "failed",
                "error": str(e)
            }
            initialization_results["status"] = "partial"
        
        # Check environment variables
        env_status = {}
        required_env_vars = ["GOOGLE_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY"]
        for var in required_env_vars:
            env_status[var] = "set" if os.getenv(var) else "not_set"
        
        initialization_results["components"]["environment"] = {
            "status": "checked",
            "variables": env_status,
            "api_keys_available": any(os.getenv(var) for var in required_env_vars)
        }
        
        return initialization_results
        
    except Exception as e:
        logger.error(f"Service initialization failed: {e}")
        raise HTTPException(status_code=500, detail=f"Service initialization failed: {str(e)}")

@app.post("/service/reset")
async def reset_service():
    """Reset service state and clean up resources"""
    try:
        reset_results = {
            "timestamp": datetime.now().isoformat(),
            "actions": [],
            "status": "success"
        }
        
        # Stop all active sessions
        if active_sessions:
            for session_id in list(active_sessions.keys()):
                try:
                    active_sessions[session_id]["status"] = "stopped"
                    reset_results["actions"].append(f"Stopped session: {session_id}")
                except Exception as e:
                    reset_results["actions"].append(f"Error stopping session {session_id}: {str(e)}")
        
        # Clean up all agents
        try:
            await agent_manager.stop_all_agents()
            reset_results["actions"].append("Stopped all active agents")
        except Exception as e:
            reset_results["actions"].append(f"Error stopping agents: {str(e)}")
        
        # Clear session data
        active_sessions.clear()
        test_results.clear()
        session_agents.clear()
        reset_results["actions"].append("Cleared session data")
        
        # Reinitialize LLM provider
        try:
            agent_manager._setup_llm_provider()
            reset_results["actions"].append("Reinitialized LLM provider")
        except Exception as e:
            reset_results["actions"].append(f"Error reinitializing LLM provider: {str(e)}")
        
        return reset_results
        
    except Exception as e:
        logger.error(f"Service reset failed: {e}")
        raise HTTPException(status_code=500, detail=f"Service reset failed: {str(e)}")

@app.get("/service/status")
async def service_status():
    """Get detailed service status and statistics"""
    try:
        return {
            "timestamp": datetime.now().isoformat(),
            "uptime_seconds": (datetime.now() - datetime.now()).total_seconds(),  # Placeholder
            "sessions": {
                "active": len(active_sessions),
                "total_created": len(active_sessions) + len([s for s in active_sessions.values() if s.get("status") == "completed"]),
                "session_list": list(active_sessions.keys())
            },
            "agents": {
                "active": len(agent_manager.active_agents),
                "agent_list": list(agent_manager.active_agents.keys())
            },
            "test_results": {
                "total_sessions_with_results": len(test_results),
                "total_test_results": sum(len(results) for results in test_results.values())
            },
            "llm_provider": {
                "type": type(agent_manager.llm_provider).__name__ if agent_manager.llm_provider else "None",
                "available": agent_manager.llm_provider is not None
            }
        }
    except Exception as e:
        logger.error(f"Service status check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Service status check failed: {str(e)}")

@app.post("/test/start")
async def start_test(request: TestRequest):
    """Start a new test session"""
    try:
        session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}"
        
        # Store session data
        active_sessions[session_id] = {
            "status": "initialized",
            "test_cases": [tc.dict() for tc in request.test_cases],
            "config": request.config.dict(),
            "created_at": datetime.now().isoformat(),
            "total_tests": len(request.test_cases),
            "completed_tests": 0
        }
        
        test_results[session_id] = []
        
        # Start test execution in background
        asyncio.create_task(execute_tests(session_id, request))
        
        return {
            "session_id": session_id,
            "status": "started",
            "total_tests": len(request.test_cases),
            "message": "Test session started successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to start test session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/test/status/{session_id}")
async def get_test_status(session_id: str):
    """Get status of a test session"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = active_sessions[session_id]
    results = test_results.get(session_id, [])
    
    return {
        "session_id": session_id,
        "status": session["status"],
        "total_tests": session["total_tests"],
        "completed_tests": session["completed_tests"],
        "progress_percentage": (session["completed_tests"] / session["total_tests"]) * 100 if session["total_tests"] > 0 else 0,
        "created_at": session["created_at"],
        "latest_results": results[-5:] if results else []  # Last 5 results
    }

@app.get("/test/results/{session_id}")
async def get_test_results(session_id: str):
    """Get all results for a test session"""
    if session_id not in test_results:
        raise HTTPException(status_code=404, detail="Session results not found")
    
    return {
        "session_id": session_id,
        "results": test_results[session_id],
        "summary": {
            "total": len(test_results[session_id]),
            "passed": len([r for r in test_results[session_id] if r.status == "passed"]),
            "failed": len([r for r in test_results[session_id] if r.status == "failed"]),
            "errors": len([r for r in test_results[session_id] if r.status == "error"])
        }
    }

@app.post("/test/stop/{session_id}")
async def stop_test(session_id: str):
    """Stop a running test session"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    active_sessions[session_id]["status"] = "stopped"
    
    return {
        "session_id": session_id,
        "status": "stopped",
        "message": "Test session stopped successfully"
    }

async def execute_tests(session_id: str, request: TestRequest):
    """Execute tests using browser-use agents"""
    try:
        active_sessions[session_id]["status"] = "running"
        
        # Create agents for all test cases
        test_case_dicts = [tc.dict() for tc in request.test_cases]
        config_dict = request.config.dict()
        
        agent_ids = await agent_manager.create_agents(test_case_dicts, config_dict)
        session_agents[session_id] = agent_ids
        
        logger.info(f"Created {len(agent_ids)} agents for session {session_id}")
        
        # Execute tests sequentially for now (can be made concurrent later)
        for i, agent_id in enumerate(agent_ids):
            if active_sessions[session_id]["status"] == "stopped":
                break
            
            try:
                logger.info(f"Session {session_id}: Starting test {i+1}/{len(agent_ids)}")
                
                # Execute the agent
                agent_result = await agent_manager.execute_agent(agent_id)
                
                # Convert to TestResult format
                result = TestResult(
                    test_case_id=agent_result.get("test_case_id", f"test_{i}"),
                    status="passed" if agent_result.get("status") == "completed" else "failed",
                    message=agent_result.get("summary", "Test completed"),
                    execution_time=agent_result.get("execution_time", 0.0),
                    timestamp=agent_result.get("timestamp", datetime.now().isoformat())
                )
                
                test_results[session_id].append(result)
                active_sessions[session_id]["completed_tests"] = i + 1
                
                logger.info(f"Session {session_id}: Completed test {i+1}/{len(agent_ids)}")
                
            except Exception as e:
                logger.error(f"Test execution failed for agent {agent_id}: {e}")
                
                # Create error result
                error_result = TestResult(
                    test_case_id=test_case_dicts[i].get("id", f"test_{i}"),
                    status="error",
                    message=f"Test execution failed: {str(e)}",
                    execution_time=0.0,
                    timestamp=datetime.now().isoformat()
                )
                
                test_results[session_id].append(error_result)
                active_sessions[session_id]["completed_tests"] = i + 1
        
        # Mark session as completed
        if active_sessions[session_id]["status"] != "stopped":
            active_sessions[session_id]["status"] = "completed"
            
        logger.info(f"Session {session_id} completed with {len(test_results[session_id])} results")
            
    except Exception as e:
        logger.error(f"Test execution failed for session {session_id}: {e}")
        active_sessions[session_id]["status"] = "error"
    
    finally:
        # Clean up agents
        if session_id in session_agents:
            for agent_id in session_agents[session_id]:
                try:
                    await agent_manager.stop_agent(agent_id)
                except Exception as e:
                    logger.error(f"Error stopping agent {agent_id}: {e}")
            del session_agents[session_id]

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "localhost")
    
    logger.info(f"Starting AI Test Tool Backend on {host}:{port}")
    
    uvicorn.run(
        "server:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )