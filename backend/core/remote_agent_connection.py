import logging
from collections.abc import Callable
import httpx
from a2a.client import A2AClient
from a2a.types import (
    AgentCard,
    SendMessageRequest,
    SendMessageResponse,
    SendStreamingMessageRequest,
    Task,
    TaskArtifactUpdateEvent,
    TaskStatusUpdateEvent,
)
from dotenv import load_dotenv

load_dotenv()

TaskCallbackArg = Task | TaskStatusUpdateEvent | TaskArtifactUpdateEvent
TaskUpdateCallback = Callable[[TaskCallbackArg, AgentCard], Task]

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

class RemoteAgentConnections:
    """A class to hold the connections to the remote agents."""

    def __init__(self, agent_card: AgentCard, agent_url: str):
        logger.debug(f'agent_card: {agent_card}')
        logger.debug(f'agent_url: {agent_url}')
        self._httpx_client = httpx.AsyncClient(timeout=30)
        self.agent_client = A2AClient(
            self._httpx_client, agent_card, url=agent_url
        )
        self.card = agent_card

    def get_agent(self) -> AgentCard:
        return self.card

    async def send_message(
        self, message_request: SendMessageRequest
    ) -> SendMessageResponse:
        return await self.agent_client.send_message(message_request)

    async def stream_message(
        self, message_request: SendMessageRequest | SendStreamingMessageRequest
    ):
        """Stream messages from the agent."""
        # Note: A2AClient.send_message_streaming takes SendStreamingMessageRequest
        # We need to ensure we pass the right type or handle it here.
        # Check if A2AClient has send_message_streaming
        if hasattr(self.agent_client, "send_message_streaming"):
             # Assuming message_request is compatible or we need to convert
             # For now, let's assume the caller passes the right request type or we inspect
             # Default A2AClient split: send_message vs send_message_streaming
             async for chunk in self.agent_client.send_message_streaming(message_request):
                 yield chunk
        else:
             # Fallback if not supported?
             yield await self.agent_client.send_message(message_request)
