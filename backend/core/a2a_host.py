"""
A2A Host - Uses a2a-sdk client to call remote agents

This module uses the built-in A2AClient and A2ACardResolver from a2a-sdk
to discover and communicate with remote A2A-compatible agents.

Supports ALL A2A capabilities:
- Streaming (SSE)
- Polling
- Push notifications (webhooks)
"""
from a2a.client.card_resolver import A2ACardResolver
from a2a.types import (
    Message,
    MessageSendParams,
    Role,
    SendMessageRequest,
    SendStreamingMessageRequest,
    TextPart,
    Task,
)
from .remote_agent_connection import RemoteAgentConnections
from typing import Dict, Any, Optional
import httpx
import uuid
import json
from core.logger import get_logger
from .a2ui_generator import get_generator
from config import settings

logger = get_logger(__name__)

class HostAgent:
    """
    Host Agent that acts as a direct proxy to remote A2A agents.
    
    It calls the remote A2A agent using the SDK and converts ALL outputs 
    into A2UI v0.8 format for the frontend.
    """
    
    def __init__(self):
        """Initialize A2A Host with connection cache"""
        self.connections: Dict[str, RemoteAgentConnections] = {}
        logger.info("HostAgent initialized.")
    
    async def get_or_create_connection(self, agent_url: str) -> RemoteAgentConnections:
        """
        Get existing RemoteAgentConnections or create new one for agent URL.
        """
        if agent_url not in self.connections:
            logger.info(f"Creating new connection for agent: {agent_url}")
            try:
                # Create ephemeral client for resolution
                async with httpx.AsyncClient() as http_client:
                    resolver = A2ACardResolver(
                        httpx_client=http_client,
                        base_url=agent_url
                    )
                    
                    # Fetch agent card
                    agent_card = await resolver.get_agent_card()
                    logger.info(f"Resolved agent card: {agent_card.name}")
                    
                # Create connection (it manages its own client)
                conn = RemoteAgentConnections(agent_card, agent_url)
                self.connections[agent_url] = conn
            except Exception as e:
                logger.error(f"Failed to resolve/connect to agent at {agent_url}: {e}")
                raise
        
        return self.connections[agent_url]
    
    async def call_agent(
        self,
        agent_url: str,
        message: str,
        session_id: str,
        webhook_url: Optional[str] = None,
        thread_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Call remote A2A agent (Polling mode).
        """
        logger.info(f"Calling agent {agent_url} (polling) for session {session_id}")
        conn = await self.get_or_create_connection(agent_url)
        
        # Ensure metadata exists and add IDs
        metadata = metadata or {}
        metadata["session_id"] = session_id
        if thread_id:
            metadata["thread_id"] = thread_id
        
        # Construct Message
        message_obj = Message(
            role=Role.user,
            parts=[TextPart(text=message)],
            message_id=str(uuid.uuid4()),
            metadata=metadata
        )
        
        params = MessageSendParams(message=message_obj)
        
        request = SendMessageRequest(
            id=str(uuid.uuid4()),
            params=params
        )
        
        try:
            response = await conn.send_message(request)
            # Response is SendMessageResponse (RootModel) -> .root -> .result
            if hasattr(response.root, 'result'):
                return self._process_response(response.root.result)
            else:
                 logger.error(f"Agent response error or empty: {response.root}")
                 raise Exception(f"Agent response error: {response.root}")
            
        except Exception as e:
            logger.error(f"Error calling agent: {e}", exc_info=True)
            raise

    async def stream_agent(
        self,
        agent_url: str,
        message: str,
        session_id: str,
        thread_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Stream responses directly from remote agent.
        """
        logger.info(f"Streaming from agent {agent_url} for session {session_id}")
        try:
            conn = await self.get_or_create_connection(agent_url)
            
            # Ensure metadata exists and add IDs
            metadata = metadata or {}
            metadata["session_id"] = session_id
            if thread_id:
                metadata["thread_id"] = thread_id
            
            # Construct Message
            message_obj = Message(
                role=Role.user,
                parts=[TextPart(text=message)],
                message_id=str(uuid.uuid4()),
                metadata=metadata
            )
            
            params = MessageSendParams(message=message_obj)
            
            request = SendStreamingMessageRequest(
                id=str(uuid.uuid4()),
                params=params
            )
            
            chunk_count = 0
            async for chunk in conn.stream_message(request):
                chunk_count += 1
                
                # Check for error in chunk
                if hasattr(chunk.root, 'error') and chunk.root.error:
                        logger.error(f"Stream error chunk: {chunk.root.error}")
                        yield self._process_error_to_dict(chunk.root.error)
                        continue

                # Check for result
                if hasattr(chunk.root, 'result') and chunk.root.result:
                    # Yield processed dict (not yet A2UI envelope)
                    # The caller (main.py) calls convert_to_a2ui on this
                    yield self._process_response(chunk.root.result)
                else:
                    # Empty or keepalive chunk
                    pass
            
            logger.info(f"Remote stream completed. Chunks received: {chunk_count}")

        except Exception as e:
            logger.error(f"Host Agent Stream Error: {e}", exc_info=True)
            # Yield error so UI sees it
            yield self._process_error_to_dict(e)

    def _process_response(self, result: Any) -> Dict[str, Any]:
        """Convert A2A typed result to internal dict format for conversion."""
        # result can be Task, Message, etc.
        # We need to extract text/content.
        
        # If Message (common in streaming chat)
        if isinstance(result, Message):
            text = ""
            if result.parts:
                for part in result.parts:
                    p = part.root # Part is RootModel
                    if isinstance(p, TextPart):
                        text += p.text
            
            # Extract metadata and message_id
            return {
                "output": {"text": text}, 
                "metadata": result.metadata or {},
                "message_id": result.message_id
            }
            
        # If Task
        if isinstance(result, Task):
            if result.history:
                last_msg = result.history[-1]
                return self._process_response(last_msg)
            return {"output": {"text": f"Task status: {result.status.state}"}}
            
        # Fallback
        return {"output": {"text": str(result)}}

    def _process_error_to_dict(self, error: Any) -> Dict[str, Any]:
        """Convert error to internal dict format."""
        return {
             "output": {"text": f"Error: {str(error)}"},
             "metadata": {"type": "error"}
        }

    def convert_to_a2ui(self, agent_response: Dict[str, Any], use_llm: bool = None) -> Dict[str, Any]:
        """
        Convert agent response to A2UI v0.8 Envelope format.
        
        A2UI v0.8 uses: {"component": {"Text": {"text": {...}}}}
        NOT: {"component": "Text", "text": {...}}
        """
        output = agent_response.get("output", {})
        metadata = agent_response.get("metadata", {})
        text_content = ""
        
        if "text" in output:
            text_content = output["text"]
        else:
            text_content = str(output)

        # Use agent's message_id if available to allow updates to the same component
        raw_msg_id = agent_response.get("message_id")
        if raw_msg_id:
            msg_id = f"msg_{raw_msg_id}"
        else:
            msg_id = f"msg_{uuid.uuid4()}"
        
        # Determine usage hint based on metadata
        msg_type = metadata.get("type", "text")
        usage_hint = None 
        
        if msg_type == "thinking":
            usage_hint = "subtle"
            # logger.debug(f"Converting thinking message: {text_content[:30]}...")
            
        elif msg_type == "tool_call":
            usage_hint = "code"
            tool_name = metadata.get("tool_name", "Unknown Tool")
            # logger.debug(f"Converting tool_call: {tool_name}")

        elif msg_type == "tool_result":
            usage_hint = "code"
            tool_name = metadata.get("tool_name", "Unknown Tool")
            # logger.debug(f"Converting tool_result: {tool_name}")
        
        elif msg_type == "error":
             usage_hint = "error"
             logger.warning(f"Converting error message: {text_content}")

        # Build Text component properties (v0.8 format)
        text_props = {
            "text": {
                "literalString": text_content
            }
        }
        
        # Add usageHint if present
        if usage_hint:
            text_props["usageHint"] = usage_hint

        # Create component in v0.8 format: {"Text": {...properties...}}
        component = {
            "id": msg_id,
            "component": {
                "Text": text_props
            }
        }

        # Create root Column component in v0.8 format
        root_component = {
            "id": "root",
            "component": {
                "Column": {
                    "children": {
                        "explicitList": [msg_id]
                    }
                }
            }
        }

        # Create Adjacency List Envelope
        envelope = {
            "surfaceUpdate": {
                "components": [component, root_component]
            }
        }
            
        return envelope

    async def generate_rich_ui(self, text: str, metadata: Dict[str, Any] = None, message_id: str = None) -> Dict[str, Any]:
        """
        Use LLM to generate rich UI components (Forms, Tables) from text.
        """
        logger.info(f"Generating rich UI for text: {text[:50]}...")
        try:
            generator = get_generator()
            metadata = metadata or {"type": "answer", "role": "agent"}
            
            # Generate A2UI envelope
            envelope = await generator.generate_envelope(text, metadata, message_id=message_id)
            logger.info("Successfully generated rich UI envelope.")
            return envelope
        except Exception as e:
            logger.error(f"Rich UI generation failed: {e}")
            # Fallback to simple text (using same ID)
            meta = metadata or {}
            resp = {"output": {"text": text}, "metadata": meta}
            if message_id: resp["message_id"] = message_id.replace("msg_", "") # strip prefix if present because convert adds it
            
            # Wait, convert_to_a2ui expects raw ID and adds msg_ prefix?
            # let's check convert_to_a2ui logic
            return self.convert_to_a2ui(resp)
