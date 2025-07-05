# browser-use API Reference

browser-use is a Python library that enables AI agents to control web browsers through natural language instructions. It provides a simple interface for browser automation powered by Large Language Models (LLMs).

## Installation

```bash
pip install browser-use
playwright install chromium --with-deps --no-shell
```

**Requirements:**
- Python 3.11+
- Playwright
- Compatible LLM provider (OpenAI, Anthropic, etc.)

## Core Classes

### Agent

The main class for creating and running browser automation agents.

```python
from browser_use import Agent

class Agent:
    def __init__(
        self,
        task: str,
        llm: Any,
        browser_session: Optional[BrowserSession] = None,
        use_vision: bool = True,
        max_steps: int = 100,
        generate_gif: bool = False,
        save_conversation_path: Optional[str] = None,
        system_prompt_class: Optional[Any] = None
    )
```

#### Parameters

- **`task`** (str): Natural language description of the task to perform
- **`llm`** (Any): Language model instance (OpenAI, Anthropic, etc.)
- **`browser_session`** (Optional[BrowserSession]): Browser session to use
- **`use_vision`** (bool): Enable screenshot analysis. Default: True
- **`max_steps`** (int): Maximum number of steps to execute. Default: 100
- **`generate_gif`** (bool): Generate GIF of the execution. Default: False
- **`save_conversation_path`** (Optional[str]): Path to save conversation logs
- **`system_prompt_class`** (Optional[Any]): Custom system prompt class

#### Methods

##### `async run() -> AgentResult`

Executes the agent's task and returns the result.

```python
async def main():
    agent = Agent(
        task="Navigate to google.com and search for 'browser automation'",
        llm=llm
    )
    result = await agent.run()
    return result
```

**Returns:** `AgentResult` object containing execution details

##### `async run_step() -> bool`

Executes a single step of the agent's task.

```python
# Run agent step by step
while not agent.is_done():
    success = await agent.run_step()
    if not success:
        break
```

**Returns:** Boolean indicating if the step was successful

### BrowserSession

Manages browser instances and provides low-level browser control.

```python
from browser_use import BrowserSession, BrowserProfile

class BrowserSession:
    def __init__(
        self,
        browser_profile: Optional[BrowserProfile] = None,
        keep_alive: bool = False
    )
```

#### Parameters

- **`browser_profile`** (Optional[BrowserProfile]): Browser configuration
- **`keep_alive`** (bool): Keep browser alive between agent runs

#### Methods

##### `async start()`

Starts the browser session.

```python
session = BrowserSession()
await session.start()
```

##### `async close()`

Closes the browser session.

```python
await session.close()
```

##### `async get_current_url() -> str`

Gets the current page URL.

```python
url = await session.get_current_url()
```

##### `async get_page_html() -> str`

Gets the current page HTML.

```python
html = await session.get_page_html()
```

##### `async get_page_title() -> str`

Gets the current page title.

```python
title = await session.get_page_title()
```

##### `async screenshot() -> bytes`

Takes a screenshot of the current page.

```python
screenshot_data = await session.screenshot()
```

### BrowserProfile

Configuration class for browser behavior.

```python
from browser_use import BrowserProfile

class BrowserProfile:
    def __init__(
        self,
        browser_type: str = "chromium",
        headless: bool = True,
        viewport: Optional[dict] = None,
        user_agent: Optional[str] = None,
        wait_for_network_idle_page_load_time: float = 3.0,
        user_data_dir: Optional[str] = None,
        extra_chromium_args: Optional[List[str]] = None
    )
```

#### Parameters

- **`browser_type`** (str): Browser type ("chromium", "firefox", "webkit")
- **`headless`** (bool): Run browser in headless mode
- **`viewport`** (Optional[dict]): Browser viewport size
- **`user_agent`** (Optional[str]): Custom user agent string
- **`wait_for_network_idle_page_load_time`** (float): Network idle timeout
- **`user_data_dir`** (Optional[str]): Directory for browser profile data
- **`extra_chromium_args`** (Optional[List[str]]): Additional Chromium arguments

#### Example

```python
profile = BrowserProfile(
    browser_type="chromium",
    headless=False,
    viewport={"width": 1920, "height": 1080},
    user_agent="Mozilla/5.0 (compatible; browser-use/1.0)",
    wait_for_network_idle_page_load_time=5.0
)
```

### AgentResult

Contains the results of an agent execution.

```python
class AgentResult:
    def is_done(self) -> bool
    def action_results(self) -> List[ActionResult]
    def get_screenshots(self) -> List[bytes]
    def get_execution_time(self) -> float
    def get_final_message(self) -> str
```

#### Methods

##### `is_done() -> bool`

Returns whether the agent completed its task successfully.

##### `action_results() -> List[ActionResult]`

Returns a list of all actions performed during execution.

##### `get_screenshots() -> List[bytes]`

Returns all screenshots taken during execution.

##### `get_execution_time() -> float`

Returns the total execution time in seconds.

##### `get_final_message() -> str`

Returns the final message from the agent.

## LLM Integration

### OpenAI

```python
from browser_use import Agent
from browser_use.llm import ChatOpenAI

llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0.0,
    api_key="your-api-key"
)

agent = Agent(
    task="Navigate to example.com and click the contact link",
    llm=llm
)
```

### Anthropic

```python
from browser_use import Agent
from browser_use.llm import ChatAnthropic

llm = ChatAnthropic(
    model="claude-3-sonnet-20240229",
    temperature=0.0,
    api_key="your-api-key"
)

agent = Agent(
    task="Fill out a contact form with sample data",
    llm=llm
)
```

### Azure OpenAI

```python
from browser_use import Agent
from browser_use.llm import AzureChatOpenAI

llm = AzureChatOpenAI(
    azure_endpoint="your-endpoint",
    api_key="your-api-key",
    api_version="2024-02-01",
    model="gpt-4o"
)
```

### Google Gemini

```python
from browser_use import Agent
from browser_use.llm import ChatGoogleGenerativeAI

llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-pro",
    google_api_key="your-api-key"
)
```

## Action Types

browser-use supports various action types that agents can perform:

### Navigation Actions

- **`go_to_url`** - Navigate to a specific URL
- **`go_back`** - Go back in browser history
- **`go_forward`** - Go forward in browser history
- **`reload`** - Reload the current page

### Element Interaction

- **`click`** - Click on an element
- **`type`** - Type text into an input field
- **`select`** - Select option from dropdown
- **`hover`** - Hover over an element
- **`scroll`** - Scroll the page
- **`drag_and_drop`** - Drag and drop elements

### Information Extraction

- **`extract_text`** - Extract text from elements
- **`extract_attributes`** - Extract element attributes
- **`extract_links`** - Extract all links from page
- **`take_screenshot`** - Take a screenshot

### Form Handling

- **`fill_form`** - Fill out entire forms
- **`submit_form`** - Submit form data
- **`clear_input`** - Clear input fields
- **`upload_file`** - Upload files to input fields

## Configuration

### Environment Variables

```bash
# OpenAI
OPENAI_API_KEY=your-openai-key

# Anthropic
ANTHROPIC_API_KEY=your-anthropic-key

# Azure OpenAI
AZURE_OPENAI_API_KEY=your-azure-key
AZURE_OPENAI_ENDPOINT=your-azure-endpoint

# Google
GOOGLE_API_KEY=your-google-key
```

### Settings File

Create a `browser_use_config.json` file:

```json
{
  "default_browser": "chromium",
  "default_headless": true,
  "default_viewport": {
    "width": 1280,
    "height": 1024
  },
  "max_steps": 50,
  "page_load_timeout": 30000,
  "action_timeout": 5000,
  "screenshot_quality": 90
}
```

## Usage Examples

### Basic Usage

```python
import asyncio
from browser_use import Agent
from browser_use.llm import ChatOpenAI

async def main():
    # Initialize LLM
    llm = ChatOpenAI(
        model="gpt-4o",
        temperature=0.0
    )
    
    # Create agent
    agent = Agent(
        task="Go to google.com and search for 'Python programming'",
        llm=llm
    )
    
    # Run the agent
    result = await agent.run()
    
    # Check results
    if result.is_done():
        print("Task completed successfully!")
        print(f"Execution time: {result.get_execution_time():.2f} seconds")
        print(f"Steps taken: {len(result.action_results())}")
    else:
        print("Task failed or incomplete")

# Run the example
asyncio.run(main())
```

### Advanced Configuration

```python
from browser_use import Agent, BrowserSession, BrowserProfile

async def advanced_example():
    # Configure browser
    profile = BrowserProfile(
        browser_type="chromium",
        headless=False,
        viewport={"width": 1920, "height": 1080},
        user_agent="Mozilla/5.0 (compatible; MyApp/1.0)",
        wait_for_network_idle_page_load_time=5.0,
        user_data_dir="./browser_data"  # Persist browser data
    )
    
    # Create session
    session = BrowserSession(
        browser_profile=profile,
        keep_alive=True
    )
    
    # Start session
    await session.start()
    
    # Create agent
    agent = Agent(
        task="""
        1. Navigate to an e-commerce website
        2. Search for 'laptop'
        3. Filter by price range $500-$1000
        4. Add the first item to cart
        5. Take a screenshot of the cart
        """,
        llm=llm,
        browser_session=session,
        max_steps=25,
        generate_gif=True,
        save_conversation_path="./logs/"
    )
    
    # Execute
    result = await agent.run()
    
    # Process results
    screenshots = result.get_screenshots()
    actions = result.action_results()
    
    print(f"Captured {len(screenshots)} screenshots")
    print(f"Performed {len(actions)} actions")
    
    # Close session
    await session.close()
```

### Multi-Step Execution

```python
async def step_by_step_execution():
    agent = Agent(
        task="Complete a complex multi-step process",
        llm=llm,
        max_steps=1  # Process one step at a time
    )
    
    step = 0
    while not agent.is_done() and step < 10:
        print(f"Executing step {step + 1}")
        
        success = await agent.run_step()
        if not success:
            print(f"Step {step + 1} failed")
            break
            
        step += 1
        
        # Get current state
        current_url = await agent.browser_session.get_current_url()
        print(f"Currently at: {current_url}")
    
    if agent.is_done():
        print("All steps completed successfully!")
```

### Error Handling

```python
async def robust_execution():
    agent = Agent(
        task="Navigate to a website and extract information",
        llm=llm,
        max_steps=20
    )
    
    try:
        result = await agent.run()
        
        if result.is_done():
            print("Success!")
            return result
        else:
            print("Task incomplete")
            print(f"Final message: {result.get_final_message()}")
            
    except Exception as e:
        print(f"Error during execution: {e}")
        
        # Get partial results
        if hasattr(agent, 'partial_result'):
            partial_result = agent.partial_result
            print(f"Completed {len(partial_result.action_results())} actions")
            
    finally:
        # Clean up browser
        if agent.browser_session:
            await agent.browser_session.close()
```

### Batch Processing

```python
async def batch_processing():
    tasks = [
        "Search for 'AI tools' on Google",
        "Navigate to Wikipedia and search for 'Machine Learning'",
        "Go to GitHub and search for 'python projects'"
    ]
    
    # Create shared browser session
    session = BrowserSession(keep_alive=True)
    await session.start()
    
    results = []
    
    for i, task in enumerate(tasks):
        print(f"Processing task {i+1}/{len(tasks)}: {task}")
        
        agent = Agent(
            task=task,
            llm=llm,
            browser_session=session,
            max_steps=15
        )
        
        result = await agent.run()
        results.append({
            'task': task,
            'success': result.is_done(),
            'execution_time': result.get_execution_time(),
            'screenshots': len(result.get_screenshots())
        })
    
    await session.close()
    
    # Print summary
    successful = sum(1 for r in results if r['success'])
    print(f"Completed {successful}/{len(tasks)} tasks successfully")
    
    return results
```

### Custom System Prompts

```python
class CustomSystemPrompt:
    def get_system_prompt(self) -> str:
        return """
        You are an expert web automation agent. Your goal is to:
        1. Complete tasks efficiently with minimal steps
        2. Always verify actions were successful
        3. Take screenshots for important steps
        4. Handle errors gracefully
        5. Provide clear descriptions of what you're doing
        
        Focus on accuracy and reliability over speed.
        """

async def custom_prompt_example():
    agent = Agent(
        task="Navigate to a news website and summarize the top headlines",
        llm=llm,
        system_prompt_class=CustomSystemPrompt(),
        max_steps=15
    )
    
    result = await agent.run()
    return result
```

## Advanced Patterns

### Task Composition

```python
async def complex_workflow():
    """Compose multiple tasks into a single workflow"""
    
    # Create persistent session
    session = BrowserSession(keep_alive=True)
    await session.start()
    
    try:
        # Task 1: Login
        login_agent = Agent(
            task="Navigate to login page and authenticate with credentials",
            llm=llm,
            browser_session=session,
            max_steps=10
        )
        
        login_result = await login_agent.run()
        if not login_result.is_done():
            raise Exception("Login failed")
        
        # Task 2: Navigate to dashboard
        dashboard_agent = Agent(
            task="Navigate to user dashboard and verify all widgets load",
            llm=llm,
            browser_session=session,
            max_steps=8
        )
        
        dashboard_result = await dashboard_agent.run()
        if not dashboard_result.is_done():
            raise Exception("Dashboard navigation failed")
        
        # Task 3: Perform actions
        action_agent = Agent(
            task="Complete the primary user workflow",
            llm=llm,
            browser_session=session,
            max_steps=15
        )
        
        action_result = await action_agent.run()
        
        return {
            'login': login_result,
            'dashboard': dashboard_result,
            'actions': action_result
        }
        
    finally:
        await session.close()
```

### State Management

```python
class WorkflowState:
    def __init__(self):
        self.current_step = 0
        self.completed_tasks = []
        self.context = {}
        self.screenshots = []
    
    def update_context(self, key: str, value: any):
        self.context[key] = value
    
    def get_context(self, key: str, default=None):
        return self.context.get(key, default)
    
    def add_screenshot(self, screenshot_data: bytes):
        self.screenshots.append(screenshot_data)

async def stateful_workflow():
    """Maintain state across multiple agent interactions"""
    
    state = WorkflowState()
    session = BrowserSession(keep_alive=True)
    await session.start()
    
    tasks = [
        "Navigate to the home page",
        "Search for specific content",
        "Filter and sort results",
        "Select and interact with items"
    ]
    
    for i, task in enumerate(tasks):
        state.current_step = i
        
        # Add context to task
        contextual_task = f"{task}\n\nContext: {state.context}"
        
        agent = Agent(
            task=contextual_task,
            llm=llm,
            browser_session=session,
            max_steps=12
        )
        
        result = await agent.run()
        
        # Update state
        state.completed_tasks.append(task)
        state.add_screenshot(result.get_screenshots()[-1] if result.get_screenshots() else None)
        
        # Extract relevant context from result
        if result.is_done():
            current_url = await session.get_current_url()
            state.update_context(f"step_{i}_url", current_url)
        
        print(f"Completed step {i+1}: {task}")
    
    await session.close()
    return state
```

### Conditional Execution

```python
async def conditional_workflow():
    """Execute different paths based on page content"""
    
    agent = Agent(
        task="Navigate to the main page and check user authentication status",
        llm=llm,
        max_steps=5
    )
    
    result = await agent.run()
    
    if not result.is_done():
        return {"error": "Failed to check authentication"}
    
    # Get page content to determine next steps
    page_html = await agent.browser_session.get_page_html()
    
    if "login" in page_html.lower():
        # User not authenticated - redirect to login
        login_agent = Agent(
            task="Complete the login process with valid credentials",
            llm=llm,
            browser_session=agent.browser_session,
            max_steps=10
        )
        
        login_result = await login_agent.run()
        return {"path": "login", "result": login_result}
    
    elif "dashboard" in page_html.lower():
        # User authenticated - proceed with main workflow
        dashboard_agent = Agent(
            task="Complete the main user workflow from dashboard",
            llm=llm,
            browser_session=agent.browser_session,
            max_steps=20
        )
        
        dashboard_result = await dashboard_agent.run()
        return {"path": "dashboard", "result": dashboard_result}
    
    else:
        # Unknown state
        return {"error": "Unknown authentication state"}
```

### Data Extraction

```python
async def extract_structured_data():
    """Extract structured data from web pages"""
    
    agent = Agent(
        task="""
        Navigate to a product listing page and extract:
        1. Product names
        2. Prices
        3. Ratings
        4. Availability status
        
        Take screenshots of each product for reference.
        """,
        llm=llm,
        max_steps=25
    )
    
    result = await agent.run()
    
    # Process extracted data
    extracted_data = []
    for i, action in enumerate(result.action_results()):
        if hasattr(action, 'extracted_content'):
            content = action.extracted_content
            
            # Parse structured data from content
            if "product:" in content.lower():
                extracted_data.append({
                    'step': i,
                    'content': content,
                    'screenshot': action.screenshot if hasattr(action, 'screenshot') else None
                })
    
    return {
        'success': result.is_done(),
        'extracted_data': extracted_data,
        'total_steps': len(result.action_results())
    }
```

### Retry Mechanisms

```python
async def retry_with_backoff(agent_factory, max_retries=3, base_delay=1):
    """Retry agent execution with exponential backoff"""
    
    for attempt in range(max_retries):
        try:
            agent = agent_factory()
            result = await agent.run()
            
            if result.is_done():
                return result
            else:
                raise Exception("Task not completed successfully")
                
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            
            delay = base_delay * (2 ** attempt)
            print(f"Attempt {attempt + 1} failed: {e}")
            print(f"Retrying in {delay} seconds...")
            await asyncio.sleep(delay)
    
    raise Exception("Max retries exceeded")

# Usage
async def retry_example():
    def create_agent():
        return Agent(
            task="Complete a potentially unstable task",
            llm=llm,
            max_steps=15
        )
    
    result = await retry_with_backoff(create_agent, max_retries=3)
    return result
```

## Testing and Validation

### Result Validation

```python
class ResultValidator:
    def __init__(self, expected_outcomes):
        self.expected_outcomes = expected_outcomes
    
    def validate_result(self, result: AgentResult, test_name: str):
        """Validate agent result against expected outcomes"""
        
        validation_report = {
            'test_name': test_name,
            'success': result.is_done(),
            'execution_time': result.get_execution_time(),
            'steps_taken': len(result.action_results()),
            'screenshots_captured': len(result.get_screenshots()),
            'issues': [],
            'passed_validations': [],
            'failed_validations': []
        }
        
        if test_name in self.expected_outcomes:
            expected = self.expected_outcomes[test_name]
            
            # Validate execution time
            if 'max_execution_time' in expected:
                if result.get_execution_time() > expected['max_execution_time']:
                    validation_report['failed_validations'].append(
                        f"Execution time exceeded: {result.get_execution_time():.2f}s > {expected['max_execution_time']}s"
                    )
                else:
                    validation_report['passed_validations'].append("Execution time within limits")
            
            # Validate step count
            if 'max_steps' in expected:
                steps_taken = len(result.action_results())
                if steps_taken > expected['max_steps']:
                    validation_report['failed_validations'].append(
                        f"Too many steps: {steps_taken} > {expected['max_steps']}"
                    )
                else:
                    validation_report['passed_validations'].append("Step count within limits")
            
            # Validate required content
            if 'required_content' in expected:
                final_message = result.get_final_message()
                for content in expected['required_content']:
                    if content.lower() in final_message.lower():
                        validation_report['passed_validations'].append(f"Found required content: {content}")
                    else:
                        validation_report['failed_validations'].append(f"Missing required content: {content}")
        
        return validation_report

# Usage
async def validated_execution():
    expected_outcomes = {
        'login_test': {
            'max_execution_time': 30.0,
            'max_steps': 15,
            'required_content': ['dashboard', 'welcome']
        }
    }
    
    validator = ResultValidator(expected_outcomes)
    
    agent = Agent(
        task="Complete login process and verify dashboard access",
        llm=llm,
        max_steps=20
    )
    
    result = await agent.run()
    validation_report = validator.validate_result(result, 'login_test')
    
    return validation_report
```

### Performance Monitoring

```python
class PerformanceMonitor:
    def __init__(self):
        self.metrics = []
    
    def record_execution(self, test_name: str, result: AgentResult):
        """Record performance metrics for an execution"""
        
        self.metrics.append({
            'test_name': test_name,
            'execution_time': result.get_execution_time(),
            'steps_taken': len(result.action_results()),
            'success': result.is_done(),
            'screenshots': len(result.get_screenshots()),
            'timestamp': asyncio.get_event_loop().time()
        })
    
    def get_performance_summary(self):
        """Generate performance summary report"""
        
        if not self.metrics:
            return {'error': 'No metrics recorded'}
        
        total_executions = len(self.metrics)
        successful_executions = sum(1 for m in self.metrics if m['success'])
        
        execution_times = [m['execution_time'] for m in self.metrics]
        step_counts = [m['steps_taken'] for m in self.metrics]
        
        return {
            'total_executions': total_executions,
            'success_rate': successful_executions / total_executions * 100,
            'avg_execution_time': sum(execution_times) / len(execution_times),
            'max_execution_time': max(execution_times),
            'min_execution_time': min(execution_times),
            'avg_steps': sum(step_counts) / len(step_counts),
            'max_steps': max(step_counts),
            'min_steps': min(step_counts)
        }

# Usage
async def monitored_execution():
    monitor = PerformanceMonitor()
    
    test_cases = [
        "Navigate to homepage",
        "Search for products",
        "Add item to cart",
        "Complete checkout"
    ]
    
    for test_case in test_cases:
        agent = Agent(
            task=test_case,
            llm=llm,
            max_steps=15
        )
        
        result = await agent.run()
        monitor.record_execution(test_case, result)
    
    summary = monitor.get_performance_summary()
    return summary
```

## Security Considerations

### Credential Management

```python
import os
from dataclasses import dataclass

@dataclass
class SecureCredentials:
    username: str
    password: str
    api_key: str
    
    @classmethod
    def from_env(cls):
        return cls(
            username=os.getenv('TEST_USERNAME'),
            password=os.getenv('TEST_PASSWORD'),
            api_key=os.getenv('LLM_API_KEY')
        )

async def secure_login_example():
    """Example of secure credential handling"""
    
    creds = SecureCredentials.from_env()
    
    if not all([creds.username, creds.password]):
        raise ValueError("Missing required environment variables")
    
    agent = Agent(
        task=f"""
        Navigate to the login page and authenticate using the provided credentials.
        Username: {creds.username}
        Password: [REDACTED - use environment variable]
        
        Do not log or display the actual password in any output.
        """,
        llm=llm,
        max_steps=10
    )
    
    result = await agent.run()
    return result
```

### Sandboxing and Isolation

```python
async def sandboxed_execution():
    """Run agent in isolated browser environment"""
    
    # Create isolated browser profile
    profile = BrowserProfile(
        user_data_dir=None,  # Use temporary directory
        headless=True,
        extra_chromium_args=[
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-images',  # Faster execution
            '--disable-javascript-harmony-shipping'
        ]
    )
    
    session = BrowserSession(browser_profile=profile)
    
    try:
        await session.start()
        
        agent = Agent(
            task="Perform safe web automation task",
            llm=llm,
            browser_session=session,
            max_steps=15
        )
        
        result = await agent.run()
        return result
        
    finally:
        await session.close()
```

## Best Practices

### Task Design

1. **Be Specific and Clear**
   ```python
   # Good
   task = "Navigate to the login form, enter username 'test@example.com' in the email field, enter password in the password field, click the 'Sign In' button, and verify redirection to dashboard"
   
   # Poor
   task = "Login to the site"
   ```

2. **Break Down Complex Tasks**
   ```python
   # Instead of one complex task
   complex_task = "Login, search for products, add items to cart, checkout, and verify order"
   
   # Use multiple agents
   tasks = [
       "Login with provided credentials",
       "Search for 'laptop' products and filter by price",
       "Add the first available item to cart",
       "Navigate to checkout and complete purchase",
       "Verify order confirmation page displays"
   ]
   ```

3. **Include Verification Steps**
   ```python
   task = """
   1. Navigate to the contact form
   2. Fill out all required fields with test data
   3. Submit the form
   4. Verify success message appears
   5. Take a screenshot of the confirmation
   """
   ```

### Performance Optimization

1. **Reuse Browser Sessions**
   ```python
   # Create once, use multiple times
   session = BrowserSession(keep_alive=True)
   await session.start()
   
   for task in tasks:
       agent = Agent(task=task, llm=llm, browser_session=session)
       await agent.run()
   
   await session.close()
   ```

2. **Optimize Browser Settings**
   ```python
   # Fast execution profile
   fast_profile = BrowserProfile(
       headless=True,
       extra_chromium_args=[
           '--disable-images',
           '--disable-javascript',
           '--disable-plugins',
           '--disable-web-security'
       ]
   )
   ```

3. **Limit Unnecessary Features**
   ```python
   agent = Agent(
       task="Simple navigation task",
       llm=llm,
       use_vision=False,  # Disable if not needed
       generate_gif=False,  # Disable for performance
       max_steps=10  # Set reasonable limits
   )
   ```

### Error Handling

1. **Graceful Degradation**
   ```python
   async def resilient_workflow():
       try:
           result = await agent.run()
           return result
       except Exception as e:
           # Log error and attempt recovery
           logger.error(f"Primary workflow failed: {e}")
           
           # Try simplified version
           fallback_agent = Agent(
               task="Navigate to homepage and take screenshot",
               llm=llm,
               max_steps=5
           )
           
           return await fallback_agent.run()
   ```

2. **Resource Cleanup**
   ```python
   class ManagedBrowserSession:
       def __init__(self, profile):
           self.profile = profile
           self.session = None
       
       async def __aenter__(self):
           self.session = BrowserSession(browser_profile=self.profile)
           await self.session.start()
           return self.session
       
       async def __aexit__(self, exc_type, exc_val, exc_tb):
           if self.session:
               await self.session.close()
   
   # Usage
   async with ManagedBrowserSession(profile) as session:
       agent = Agent(task="My task", llm=llm, browser_session=session)
       result = await agent.run()
   ```

### Testing Strategies

1. **Progressive Complexity**
   ```python
   # Start simple, add complexity
   test_progression = [
       "Navigate to homepage",
       "Navigate to homepage and click main menu",
       "Navigate to homepage, click menu, and verify page load",
       "Complete full user workflow"
   ]
   ```

2. **Parallel Test Execution**
   ```python
   async def parallel_test_suite():
       tasks = [
           "Test user registration flow",
           "Test product search functionality",
           "Test shopping cart operations"
       ]
       
       semaphore = asyncio.Semaphore(3)  # Limit concurrency
       
       async def run_test(task):
           async with semaphore:
               agent = Agent(task=task, llm=llm)
               return await agent.run()
       
       results = await asyncio.gather(*[run_test(task) for task in tasks])
       return results
   ```

## Troubleshooting

### Common Issues

#### Agent Gets Stuck or Loops
```python
# Solution: Add explicit termination conditions
task = """
Navigate to the search page and find 'python tutorials'.
If no results found after searching, report 'No results found' and stop.
Maximum 3 search attempts allowed.
"""
```

#### Elements Not Found
```python
# Solution: Use descriptive element identification
task = """
Look for the blue 'Submit' button at the bottom of the form.
If not visible, scroll down to find it.
Alternative: look for any button with text containing 'submit' or 'send'.
"""
```

#### Browser Crashes or Hangs
```python
# Solution: Implement health checks and recovery
async def health_checked_execution():
    try:
        # Set reasonable timeout
        result = await asyncio.wait_for(agent.run(), timeout=120)
        return result
    except asyncio.TimeoutError:
        # Force cleanup and restart
        await agent.browser_session.close()
        raise Exception("Agent execution timed out")
```

#### Memory Leaks
```python
# Solution: Proper resource management
class ResourceManager:
    def __init__(self):
        self.active_sessions = []
    
    async def create_session(self):
        session = BrowserSession()
        self.active_sessions.append(session)
        return session
    
    async def cleanup_all(self):
        for session in self.active_sessions:
            try:
                await session.close()
            except Exception as e:
                print(f"Error closing session: {e}")
        self.active_sessions.clear()
```

### Debug Mode

```python
async def debug_execution():
    """Run agent with detailed debugging"""
    
    profile = BrowserProfile(
        headless=False,  # Show browser
        viewport={"width": 1920, "height": 1080}
    )
    
    session = BrowserSession(browser_profile=profile)
    await session.start()
    
    agent = Agent(
        task="Debug task execution",
        llm=llm,
        browser_session=session,
        max_steps=1,  # Step by step
        save_conversation_path="./debug_logs/"
    )
    
    # Manual step execution with inspection
    step = 0
    while not agent.is_done() and step < 20:
        print(f"\n--- Step {step + 1} ---")
        
        # Take screenshot before step
        screenshot = await session.screenshot()
        with open(f"debug_step_{step}_before.png", "wb") as f:
            f.write(screenshot)
        
        # Execute single step
        success = await agent.run_step()
        
        # Get current state
        url = await session.get_current_url()
        title = await session.get_page_title()
        
        print(f"Step {step + 1}: {'Success' if success else 'Failed'}")
        print(f"Current URL: {url}")
        print(f"Page Title: {title}")
        
        # Wait for user input in debug mode
        input("Press Enter to continue...")
        
        step += 1
    
    await session.close()
```

## Resources

### Official Documentation
- [browser-use GitHub Repository](https://github.com/browser-use/browser-use)
- [browser-use Documentation](https://docs.browser-use.com/)
- [Playwright Python Documentation](https://playwright.dev/python/)

### LLM Provider Documentation
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Anthropic Claude API](https://docs.anthropic.com/claude/reference)
- [Google Gemini API](https://ai.google.dev/docs)
- [Azure OpenAI Service](https://learn.microsoft.com/en-us/azure/ai-services/openai/)

### Community Resources
- [browser-use Discord Community](https://discord.gg/browser-use)
- [Examples Repository](https://github.com/browser-use/examples)
- [Best Practices Guide](https://docs.browser-use.com/best-practices)

## Version Compatibility

| browser-use | Python | Playwright | Notes |
|-------------|--------|------------|-------|
| 1.0.x       | 3.11+  | 1.40+      | Latest stable |
| 0.9.x       | 3.10+  | 1.35+      | Legacy support |
| 0.8.x       | 3.9+   | 1.30+      | Deprecated |

## Migration Guide

### From 0.9.x to 1.0.x

```python
# Old (0.9.x)
from browser_use import Agent, BrowserConfig

config = BrowserConfig(headless=True)
agent = Agent(task="My task", browser_config=config)

# New (1.0.x)
from browser_use import Agent, BrowserProfile, BrowserSession

profile = BrowserProfile(headless=True)
session = BrowserSession(browser_profile=profile)
agent = Agent(task="My task", browser_session=session)
```

### API Changes

- `BrowserConfig` → `BrowserProfile`
- `browser_config` parameter → `browser_session` parameter
- `run_async()` → `run()`
- `get_result()` → Result returned directly from `run()`