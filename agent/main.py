"""
Remote A2A Agent - IT Service Management Agent

This agent uses:
- a2a-sdk server components (AgentExecutor, DefaultRequestHandler, TaskStore)
- Google Gemini 2.0 Flash for LLM capabilities
- A2A protocol compliance (/.well-known/agent.json, /run endpoint)
"""
import os
import uuid
from typing import AsyncIterator
from a2a.server.agent_execution import AgentExecutor
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import InMemoryTaskStore
from a2a.server.apps import A2AStarletteApplication
from a2a.types import AgentCard, Message, AgentSkill as Skill, Role, TextPart
from a2a.server.agent_execution.context import RequestContext
from a2a.server.events import EventQueue
# Initialize LiteLLM Config
from litellm import completion
import litellm

# Suppress verbose logging
litellm.verbose_logger = False

# Configuration
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini").lower()
AZURE_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT")

# Determine model name for LiteLLM
if LLM_PROVIDER == "azure":
    if not AZURE_DEPLOYMENT:
        print("Warning: AZURE_OPENAI_DEPLOYMENT not set for azure provider.")
    MODEL_NAME = f"azure/{AZURE_DEPLOYMENT}"
else:
    # Default to Gemini
    MODEL_NAME = "gemini/gemini-2.0-flash-exp"


class ITServiceAgentExecutor(AgentExecutor):
    """
    AgentExecutor for IT Service Management.
    
    This agent can help with:
    - VM provisioning requests
    - SAP access requests
    - RBAC access management
    - Azure WebApp deployment
    - General IT service queries
    """
    
    async def execute(self, context: RequestContext, event_queue: EventQueue):
        """
        Execute agent logic for i ncoming requests.
        
        This method is called by the A2A protocol handler when a request arrives.
        """
        # Get user message from context
        user_message = context.get_user_input()
        
        if not user_message:
            await event_queue.enqueue_event(Message(
                message_id=str(uuid.uuid4()),
                role=Role.agent,
                parts=[TextPart(text="I didn't receive any message. How can I help you?")]
            ))
            return
        
        # System prompt for IT service management
        system_prompt = """You are an IT Service Management assistant. You help users with:
- VM provisioning requests
- SAP system access requests
- RBAC (Role-Based Access Control) management
- Azure WebApp deployments
- General IT service queries

When users request services, provide clear, helpful responses and guide them through the process.
For complex requests, you can generate structured data that will be converted to interactive forms."""
        
        try:
            # Unified Call via LiteLLM
            response = completion(
                model=MODEL_NAME,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ]
            )
            
            response_text = response.choices[0].message.content
            
            # Send response as A2A Message
            await event_queue.enqueue_event(Message(
                message_id=str(uuid.uuid4()),
                role=Role.agent,
                parts=[TextPart(text=response_text)],
                metadata={
                    "model": MODEL_NAME,
                    "provider": LLM_PROVIDER,
                    "structured_output": {"text": response_text}
                }
            ))
            
        except Exception as e:
            # Send error message
            await event_queue.enqueue_event(Message(
                message_id=str(uuid.uuid4()),
                role=Role.agent,
                parts=[TextPart(text=f"I encountered an error using {MODEL_NAME}: {str(e)}. Please check your configuration.")]
            ))
    
    async def cancel(self, context: RequestContext, event_queue: EventQueue):
        """Handle task cancellation"""
        await event_queue.enqueue_event(Message(
            message_id=str(uuid.uuid4()),
            role=Role.agent,
            parts=[TextPart(text="Task cancelled.")]
        ))


# Create Agent Card for A2A discovery
agent_card = AgentCard(
    name="IT Service Agent",
    description="AI assistant for IT service management including VM provisioning, SAP access, RBAC, and Azure deployments",
    version="1.0.0",
    url="http://localhost:8001",
    capabilities={
        "streaming": True,  # Supports SSE streaming
        "polling": True,    # Supports standard polling
        "push": False,      # Push notifications not implemented yet
    },
    skills=[
        Skill(
            id="vm_provisioning",
            name="vm_provisioning",
            description="Help users provision virtual machines with specifications",
            tags=["vm", "provisioning", "infrastructure"]
        ),
        Skill(
            id="sap_access",
            name="sap_access",
            description="Assist with SAP system access requests",
            tags=["sap", "access", "permissions"]
        ),
        Skill(
            id="rbac_management",
            name="rbac_management",
            description="Manage role-based access control requests",
            tags=["rbac", "security", "permissions"]
        ),
        Skill(
            id="azure_webapp",
            name="azure_webapp",
            description="Guide Azure Web Application deployment",
            tags=["azure", "webapp", "deployment"]
        ),
        Skill(
            id="general_it_support",
            name="general_it_support",
            description="Answer general IT service questions",
            tags=["support", "help", "general"]
        ),
    ],
    defaultInputModes=["text"],
    defaultOutputModes=["stream"]
)

# Create A2A server components
task_store = InMemoryTaskStore()
executor = ITServiceAgentExecutor()
request_handler = DefaultRequestHandler(
            agent_executor=executor,
            task_store=InMemoryTaskStore)

# Create A2A Starlette application
app = A2AStarletteApplication(
    agent_card=agent_card,
    http_handler=request_handler
).build()

if __name__ == "__main__":
    import uvicorn
    print(f"Starting IT Service Agent on http://localhost:8001")
    print(f"Agent Card: http://localhost:8001/.well-known/agent.json")
    uvicorn.run(app, host="0.0.0.0", port=8001)
