"""
A2UI Component Generator using LLM

This module uses LiteLLM (Gemini/Cohere) to intelligently generate A2UI v0.8 components
based on agent response content and metadata, replacing manual JSON construction.
"""
import json
import uuid
import logging
from typing import Dict, Any, List, Optional
from litellm import acompletion
import asyncio

logger = logging.getLogger(__name__)


class A2UIGenerator:
    """
    LLM-based A2UI component generator.
    
    Uses Gemini or Cohere to intelligently create A2UI v0.8 components
    based on agent response content and context.
    """
    
    SYSTEM_PROMPT = """You are an A2UI component generator. Your goal is to convert agent text responses into rich, interactive A2UI v0.8 components.
    
    A2UI v0.8 Component Format:
    {
      "id": "unique_id",
      "component": {
        "ComponentType": {
          "property": "value"
        }
      }
    }
    
    Available Components:
    
    1. Text: Simple text messages.
       Properties: {"text": {"literalString": "content"}, "usageHint": "subtle"|"code"|"error"|null}
       - "subtle": Thinking/planning
       - "code": Tool calls/results
       - "error": Error messages
    
    2. FormCard: For collecting user input (e.g., VM specs, missing info).
       Properties:
       {
         "id": "form_id",
         "content": {
           "title": "Title",
           "description": "Description",
           "fields": [
             {
               "id": "field_id", "type": "text|select|radio|number", "label": "Label", 
               "required": true, "options": [{"value": "v", "label": "l"}] 
             }
           ],
           "actions": [{"id": "submit", "label": "Submit", "type": "primary", "action": "submit_form"}]
         }
       }
       Usage: USE THIS when the agent asks the user for specific details (e.g. "What specs do you need?") to create a structured input form.
       Examples:
         - VM Form: Fields for CPU, RAM, OS.
         - Web App Form: Fields for App Name, Runtime (Node.js/Python), Region.
         - RBAC Form: Fields for Email, Role (Select), Scope.
    
    3. TicketCard: For displaying IT tickets.
       Properties: {"id": "t_id", "content": {"ticket_id": "#123", "title": "...", "status": "open", "priority": "high", ...}}
    
    4. TableCard: For displaying lists of resources (VMs, Users).
       Properties: {"id": "tbl_id", "content": {"title": "...", "table": {"headers": [...], "rows": [...]}}}
    
    4. TableCard: For displaying lists of resources (VMs, Users).
       Properties: {"id": "tbl_id", "content": {"title": "...", "table": {"headers": [...], "rows": [...]}}}
    
    Output Format:
    Return ONLY a JSON object with this structure:
    {
      "components": [
        {component objects}
      ]
    }
    
    Rules:
    - Generate VALID JSON.
    - If the agent asks for information (e.g. "I need CPU and RAM"), GENERATE A FormCard.
    - If the agent lists items, GENERATE A TableCard.
    - Do NOT generate Column or Row components. Return a flat list of components (Text, Form, Table, etc.). The system will handle layout automatically.
    """

    USER_PROMPT_TEMPLATE = """Generate A2UI v0.8 components for this agent response:

Content: {text_content}

Metadata:
- Type: {msg_type}
- Tool: {tool_name}
- Role: {role}
- Target ID: {message_id}

Instructions:
1. If you generate a Text component for the main content, YOU MUST USE ID: "{message_id}".
2. For any other components (Forms, Tables), use unique random IDs.
3. Return JSON only.
"""

    def __init__(self, model: str = "cohere/command-a-03-2025"):
        """
        Initialize A2UI Generator.
        
        Args:
            model: LiteLLM model identifier (e.g., "gemini/gemini-2.0-flash-exp" or "cohere/command-a-03-2025")
        """
        import litellm
        litellm.drop_params = True # Fix for Cohere not supporting response_format
        
        self.model = model
        logger.info(f"A2UIGenerator initialized with model: {model}")
    
    async def generate_components(
        self,
        text_content: str,
        metadata: Dict[str, Any],
        message_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate A2UI components using LLM.
        
        Args:
            text_content: The text content from agent response
            metadata: Metadata dict with type, tool_name, etc.
            message_id: Optional message ID to use for the main text component
            
        Returns:
            List of A2UI component dicts
            
        Raises:
            Exception: If LLM generation fails
        """
        msg_type = metadata.get("type", "message")
        tool_name = metadata.get("tool_name", "N/A")
        role = metadata.get("role", "agent")
        target_id = message_id or f"msg_{uuid.uuid4()}"
        
        # Build prompt
        user_prompt = self.USER_PROMPT_TEMPLATE.format(
            text_content=text_content[:1500],  # Increased limit
            msg_type=msg_type,
            tool_name=tool_name,
            role=role,
            message_id=target_id
        )
        
        logger.info(f"Generating A2UI components for type={msg_type}, tool={tool_name}")
        
        try:
            # Call LLM with JSON mode
            response = await acompletion(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3,  # Lower for more consistent output
                max_tokens=2000
            )
            
            # Parse response
            content = response.choices[0].message.content
            logger.debug(f"LLM response: {content[:200]}...")
            
            # Sanitize markdown code blocks if present (common when response_format is dropped)
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            
            content = content.strip()
            
            result = json.loads(content)
            components = result.get("components", [])
            
            # Validate and ensure IDs
            component_types = []
            for comp in components:
                if "id" not in comp:
                    comp["id"] = f"gen_{uuid.uuid4()}"
                
                # Extract type for logging (v0.8 format {"Type": ...} or legacy)
                c_type = "Unknown"
                if "component" in comp:
                     if isinstance(comp["component"], dict):
                         c_type = list(comp["component"].keys())[0]
                     else:
                         c_type = str(comp["component"])
                component_types.append(c_type)
                    
            logger.info(f"Generated {len(components)} components: {component_types}")
            return components
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM JSON response: {e}")
            raise
        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            raise
    
    def create_root_component(self, child_ids: List[str]) -> Dict[str, Any]:
        """
        Create a root Column component with given children.
        
        Args:
            child_ids: List of child component IDs
            
        Returns:
            Root component dict
        """
        return {
            "id": "root",
            "component": {
                "Column": {
                    "children": {
                        "explicitList": child_ids
                    }
                }
            }
        }
    
    async def generate_envelope(
        self,
        text_content: str,
        metadata: Dict[str, Any],
        message_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate complete A2UI envelope with surfaceUpdate.
        
        Args:
            text_content: The text content from agent response
            metadata: Metadata dict with type, tool_name, etc.
            message_id: Optional message ID to use
            
        Returns:
            Complete A2UI envelope dict with surfaceUpdate
        """
        # Generate components
        components = await self.generate_components(text_content, metadata, message_id)
        
        # Extract component IDs
        component_ids = [comp["id"] for comp in components]
        
        # Create root component
        root = self.create_root_component(component_ids)
        
        # Add root to components
        components.append(root)
        
        # Create envelope
        envelope = {
            "surfaceUpdate": {
                "components": components
            }
        }
        
        return envelope


# Singleton instance (will be initialized with config)
_generator_instance: Optional[A2UIGenerator] = None


def get_generator(model: Optional[str] = None) -> A2UIGenerator:
    """
    Get or create A2UIGenerator singleton.
    
    Args:
        model: Optional model override
        
    Returns:
        A2UIGenerator instance
    """
    global _generator_instance
    
    if _generator_instance is None or model is not None:
        from config import settings
        # Default to Gemini for speed if available, otherwise Cohere
        if settings.gemini_api_key:
             model_to_use = model or "gemini/gemini-2.0-flash-exp"
             logger.info(f"Using Gemini Flash for A2UI generation (Speed Priority): {model_to_use}")
        else:
             model_to_use = model or "cohere/command-a-03-2025"
             logger.info(f"Using Cohere for A2UI generation: {model_to_use}")
             
        _generator_instance = A2UIGenerator(model=model_to_use)
    
    return _generator_instance
