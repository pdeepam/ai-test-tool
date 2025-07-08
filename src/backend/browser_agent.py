"""
Browser-use agent creation and management module
"""

import asyncio
import logging
import os
from typing import Dict, List, Optional, Any
from datetime import datetime

from browser_use import Agent, BrowserSession, BrowserProfile
from browser_use.llm import ChatOpenAI, ChatAnthropic, ChatGoogle

logger = logging.getLogger(__name__)


class TestAgent:
    """Individual test agent for executing a single test case"""
    
    def __init__(self, test_case: Dict[str, Any], config: Dict[str, Any]):
        self.test_case = test_case
        self.config = config
        self.agent: Optional[Agent] = None
        self.browser_session: Optional[BrowserSession] = None
        self.status = "initialized"
        self.results = {}
        self.start_time = None
        self.end_time = None
        
    async def create_agent(self, llm_provider):
        """Create browser-use agent with specified configuration"""
        try:
            # Check user's browser preference
            use_existing_chrome = self.config.get("use_existing_chrome", True)
            
            if use_existing_chrome:
                # Try to connect to existing Chrome first (using standard port 9222)
                try:
                    self.browser_session = BrowserSession(cdp_url="http://localhost:9222")
                    await self.browser_session.start()
                    logger.info("Connected to existing Chrome browser")
                except Exception as e:
                    # Fall back to new browser if no existing one
                    logger.warning(f"Could not connect to existing Chrome: {e}")
                    logger.info("Falling back to new browser instance")
                    use_existing_chrome = False
            
            if not use_existing_chrome:
                # Create new browser instance
                logger.info("Creating new Chromium browser instance")

                
                browser_profile = BrowserProfile(
                    browser_type=self.config.get("browser_type", "chromium"),
                    headless=self.config.get("headless", False),
                    viewport=None,
                    # Do NOT set viewport or window_size - let Chrome handle window sizing
                    wait_for_network_idle_page_load_time=3.0,
                    extra_chromium_args=[
                        "--no-first-run",           # Skip first-run experience
                        "--no-default-browser-check", # Don't check if default browser
                        "--disable-default-apps",   # Don't load default apps
                        "--disable-extensions",     # Disable extensions
                        "--start-maximized",        # Start maximized
                        "--disable-popup-blocking", # Disable popup blocking
                        "--disable-background-timer-throttling",  # Better for automation
                        "--disable-renderer-backgrounding",       # Better for automation
                        "--disable-backgrounding-occluded-windows", # Better for automation
                        "--disable-web-security",  # Disable web security for testing
                        "--disable-features=VizDisplayCompositor", # Fix display issues
                        "--disable-dev-shm-usage", # Overcome limited resource problems
                        "--no-sandbox",             # Disable sandboxing
                        "--disable-gpu-sandbox"     # Disable GPU sandboxing
                    ]
                )
                
                self.browser_session = BrowserSession(browser_profile=browser_profile)
                await self.browser_session.start()
                logger.info("Started new Chromium browser instance")
            
            # Build natural language task from test case
            task_description = self._build_task_description()
            
            # Create agent
            self.agent = Agent(
                task=task_description,
                llm=llm_provider,
                browser_session=self.browser_session,
                use_vision=True,
                max_steps=self.config.get("max_steps", 25),
                generate_gif=False
            )
            
            self.status = "ready"
            logger.info(f"Agent created for test case: {self.test_case['name']}")
            
        except Exception as e:
            self.status = "error"
            logger.error(f"Failed to create agent for {self.test_case['name']}: {e}")
            raise
    
    def _build_task_description(self) -> str:
        """Build natural language task description from test case"""
        task_parts = [
            f"Test Case: {self.test_case['name']}",
            f"Description: {self.test_case['description']}",
            f"Target URL: {self.test_case['target_url']}",
            "",
            "Test Steps:"
        ]
        
        for i, step in enumerate(self.test_case['steps'], 1):
            task_parts.append(f"{i}. {step}")
        
        task_parts.extend([
            "",
            "Expected Results:"
        ])
        
        for i, result in enumerate(self.test_case['expected_results'], 1):
            task_parts.append(f"{i}. {result}")
        
        task_parts.extend([
            "",
            "Please execute this test carefully and report any issues you find.",
            "Take screenshots of important steps and any problems discovered.",
            "Provide a clear summary of the test results."
        ])
        
        return "\n".join(task_parts)
    
    async def execute(self) -> Dict[str, Any]:
        """Execute the test case using browser-use agent"""
        if not self.agent:
            raise ValueError("Agent not created. Call create_agent() first.")
        
        try:
            self.status = "running"
            self.start_time = datetime.now()
            
            logger.info(f"Starting test execution: {self.test_case['name']}")
            
            # Execute the test using browser-use
            result = await self.agent.run()
            
            self.end_time = datetime.now()
            execution_time = (self.end_time - self.start_time).total_seconds()
            
            # Process results
            self.results = {
                "test_case_id": self.test_case["id"],
                "test_case_name": self.test_case["name"],
                "status": "completed",
                "execution_time": execution_time,
                "agent_result": result,
                "screenshots": [],  # Will be populated from browser history
                "summary": self._extract_summary(result),
                "timestamp": self.end_time.isoformat()
            }
            
            self.status = "completed"
            logger.info(f"Test completed: {self.test_case['name']} in {execution_time:.2f}s")
            
            return self.results
            
        except Exception as e:
            self.end_time = datetime.now()
            execution_time = (self.end_time - self.start_time).total_seconds() if self.start_time else 0
            
            self.results = {
                "test_case_id": self.test_case["id"],
                "test_case_name": self.test_case["name"],
                "status": "error",
                "execution_time": execution_time,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
            
            self.status = "error"
            logger.error(f"Test execution failed: {self.test_case['name']}: {e}")
            
            return self.results
        
        finally:
            await self.cleanup()
    
    def _extract_summary(self, agent_result) -> str:
        """Extract summary from agent result"""
        try:
            if hasattr(agent_result, 'get_final_message'):
                return agent_result.get_final_message()
            elif hasattr(agent_result, 'message'):
                return agent_result.message
            elif isinstance(agent_result, dict) and 'message' in agent_result:
                return agent_result['message']
            elif isinstance(agent_result, str):
                return agent_result
            else:
                return f"Test executed successfully. Task completed: {agent_result.is_done() if hasattr(agent_result, 'is_done') else 'Unknown'}"
        except Exception as e:
            return f"Test completed with result processing error: {str(e)}"
    
    async def cleanup(self):
        """Clean up browser resources"""
        try:
            if self.browser_session:
                if not self.config.get('keep_browser_open', False):
                    await self.browser_session.close()
                    logger.info(f"Browser session closed for test: {self.test_case['name']}")
                else:
                    logger.info(f"Browser session kept open for test: {self.test_case['name']}")
        except Exception as e:
            logger.error(f"Error closing browser session for {self.test_case['name']}: {e}")

class BrowserAgentManager:
    """Manager for creating and coordinating multiple browser-use agents"""
    
    def __init__(self):
        self.active_agents: Dict[str, TestAgent] = {}
        self.llm_provider = None
        self._setup_llm_provider()
    
    def _setup_llm_provider(self):
        """Setup LLM provider based on available API keys"""
        try:
            # Check for Google Gemini API key first (recommended by browser-use)
            if os.getenv("GOOGLE_API_KEY"):
                self.llm_provider = ChatGoogle(
                    model="gemini-1.5-pro",
                    api_key=os.getenv("GOOGLE_API_KEY"),
                    temperature=0.0
                )
                logger.info("Using Google Gemini LLM provider")
                return
            
            # Fallback to other providers if available
            if os.getenv("OPENAI_API_KEY"):
                self.llm_provider = ChatOpenAI(
                    model="gpt-4o",
                    temperature=0.0,
                    api_key=os.getenv("OPENAI_API_KEY")
                )
                logger.info("Using OpenAI LLM provider")
                return
            
            if os.getenv("ANTHROPIC_API_KEY"):
                self.llm_provider = ChatAnthropic(
                    model="claude-3-sonnet-20240229",
                    temperature=0.0,
                    api_key=os.getenv("ANTHROPIC_API_KEY")
                )
                logger.info("Using Anthropic Claude LLM provider")
                return
            
            # If no API keys available, use a mock provider for testing
            logger.warning("No LLM API keys found. Using mock provider for testing.")
            self.llm_provider = MockLLMProvider()
            
        except Exception as e:
            logger.error(f"Failed to setup LLM provider: {e}")
            self.llm_provider = MockLLMProvider()
    
    async def create_agents(self, test_cases: List[Dict[str, Any]], config: Dict[str, Any]) -> List[str]:
        """Create agents for multiple test cases"""
        agent_ids = []
        
        for test_case in test_cases:
            try:
                agent = TestAgent(test_case, config)
                await agent.create_agent(self.llm_provider)
                
                agent_id = f"agent_{test_case['id']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                self.active_agents[agent_id] = agent
                agent_ids.append(agent_id)
                
                logger.info(f"Created agent {agent_id} for test case: {test_case['name']}")
                
            except Exception as e:
                logger.error(f"Failed to create agent for test case {test_case['id']}: {e}")
                # Continue with other test cases
        
        return agent_ids
    
    async def execute_agent(self, agent_id: str) -> Dict[str, Any]:
        """Execute a specific agent"""
        if agent_id not in self.active_agents:
            raise ValueError(f"Agent {agent_id} not found")
        
        agent = self.active_agents[agent_id]
        result = await agent.execute()
        
        # Remove agent from active list after execution
        del self.active_agents[agent_id]
        
        return result
    
    async def execute_all_agents(self, agent_ids: List[str], max_concurrent: int = 2) -> List[Dict[str, Any]]:
        """Execute multiple agents with concurrency control"""
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def execute_with_semaphore(agent_id: str):
            async with semaphore:
                return await self.execute_agent(agent_id)
        
        # Execute all agents concurrently but limited by semaphore
        tasks = [execute_with_semaphore(agent_id) for agent_id in agent_ids]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results and handle exceptions
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed_results.append({
                    "agent_id": agent_ids[i],
                    "status": "error",
                    "error": str(result),
                    "timestamp": datetime.now().isoformat()
                })
            else:
                processed_results.append(result)
        
        return processed_results
    
    async def stop_agent(self, agent_id: str):
        """Stop a specific agent"""
        if agent_id in self.active_agents:
            agent = self.active_agents[agent_id]
            await agent.cleanup()
            del self.active_agents[agent_id]
            logger.info(f"Stopped agent: {agent_id}")
    
    async def stop_all_agents(self):
        """Stop all active agents"""
        agent_ids = list(self.active_agents.keys())
        for agent_id in agent_ids:
            await self.stop_agent(agent_id)
        logger.info("All agents stopped")

class MockLLMProvider:
    """Mock LLM provider for testing when no API keys are available"""
    
    def invoke(self, prompt: str) -> str:
        """Generate mock response using LangChain interface"""
        return f"Mock LLM response: Test completed successfully. Simulated execution for task: {prompt[:100]}..."
    
    async def ainvoke(self, prompt: str) -> str:
        """Async generate mock response"""
        return self.invoke(prompt)

# Global agent manager instance
agent_manager = BrowserAgentManager()