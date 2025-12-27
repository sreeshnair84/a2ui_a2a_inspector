"""
A2A Host - Primary orchestrator for handling multimodal requests.
"""
from typing import Dict, Any
from models.multimodal import MultimodalRequest, A2UIResponse
from agents.router import router
from datetime import datetime


class A2AHost:
    """Primary A2A Host orchestrator for processing requests."""
    
    def __init__(self):
        """Initialize the A2A Host."""
        self.router = router
    
    async def process_request(
        self, 
        request: MultimodalRequest, 
        token: str
    ) -> A2UIResponse:
        """
        Process a multimodal request and return A2UI response.
        
        Args:
            request: Multimodal request object
            token: JWT authentication token
            
        Returns:
            A2UI response with cards
        """
        # Route request to appropriate handler
        result = self.router.route_request(request)
        
        # Create A2UI response
        response = A2UIResponse(
            cards=result.get("cards", []),
            session_id=request.session_id,
            timestamp=datetime.utcnow(),
            metadata={
                "modality": request.modality,
                "user_id": request.user_id
            }
        )
        
        return response
    
    async def process_streaming_request(
        self,
        request: MultimodalRequest,
        token: str
    ):
        """
        Process a streaming request (yields A2UI cards progressively).
        
        Args:
            request: Multimodal request object
            token: JWT authentication token
            
        Yields:
            A2UI cards as they become available
        """
        # For now, just yield the complete response
        # In production, this would stream cards as agent processes
        response = await self.process_request(request, token)
        
        for card in response.cards:
            yield card


# Global A2A Host instance
a2a_host = A2AHost()
