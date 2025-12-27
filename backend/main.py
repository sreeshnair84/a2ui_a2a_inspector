"""
A2A Host Server - Main FastAPI application

This server acts as a bridge between the frontend (A2UI) and remote A2A agents.
It uses the a2a-sdk client to call remote agents and converts responses to A2UI JSON.

Supports ALL A2A capabilities:
- Streaming (SSE)
- Polling
- Push notifications (webhooks)
"""
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
from a2a_host import A2AHost
from auth.token_manager import get_current_user

app = FastAPI(title="A2A Host Server", version="1.0.0")

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize A2A Host
a2a_host = A2AHost()

# Store for push notification callbacks
push_callbacks: Dict[str, Any] = {}


class ChatRequest(BaseModel):
    """Request from frontend"""
    message: str
    agent_url: str  # User provides the remote agent URL
    session_id: str = "default"
    use_push: bool = False  # Whether to use push notifications


class ChatResponse(BaseModel):
    """A2UI JSON response to frontend"""
    cards: list
    session_id: str
    metadata: Optional[Dict[str, Any]] = None


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "service": "A2A Host Server"}


class LoginRequest(BaseModel):
    """Login request"""
    email: str
    password: str


class LoginResponse(BaseModel):
    """Login response"""
    access_token: str
    user: Dict[str, str]


@app.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Demo login endpoint - accepts any credentials for testing.
    
    In production, this should validate against a real user database.
    """
    from auth.token_manager import create_access_token
    from datetime import timedelta
    
    # For demo: accept any credentials
    access_token = create_access_token(
        data={"sub": request.email},
        expires_delta=timedelta(hours=24)
    )
    
    return LoginResponse(
        access_token=access_token,
        user={
            "email": request.email,
            "name": request.email.split("@")[0]
        }
    )


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, req: Request):
    """
    Main chat endpoint - receives user message and agent URL from frontend.
    
    Automatically selects best A2A mode based on agent card:
    1. Push (if agent supports and use_push=True)
    2. Streaming (if agent supports)
    3. Polling (fallback)
    
    Flow:
    1. Receive message + agent URL from UI
    2. Use A2AClient to discover agent capabilities
    3. Call agent using appropriate mode
    4. Convert agent response to A2UI JSON
    5. Return A2UI JSON to frontend
    """
    try:
        # Prepare webhook URL for push notifications
        webhook_url = None
        if request.use_push:
            # Generate webhook URL for this request
            base_url = str(req.base_url).rstrip('/')
            webhook_url = f"{base_url}/api/webhook/{request.session_id}"
        
        # Call remote agent via A2A protocol
        # The A2AHost automatically selects the best mode
        agent_response = await a2a_host.call_agent(
            agent_url=request.agent_url,
            message=request.message,
            session_id=request.session_id,
            webhook_url=webhook_url,
        )
        
        # Convert to A2UI JSON
        a2ui_response = a2a_host.convert_to_a2ui(agent_response)
        
        return ChatResponse(
            cards=a2ui_response["cards"],
            session_id=request.session_id,
            metadata=a2ui_response.get("metadata", {}),
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calling agent: {str(e)}"
        )


@app.post("/api/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    Streaming chat endpoint - supports A2A streaming with AG-UI.
    
    This endpoint uses Server-Sent Events (SSE) to stream A2UI cards
    progressively as the agent generates them. This enables:
    - Real-time UI updates
    - Progressive rendering
    - Better user experience for long-running tasks
    
    Compatible with AG-UI protocol for bi-directional streaming.
    """
    from fastapi.responses import StreamingResponse
    import json
    
    async def generate_stream():
        """Generate SSE stream of A2UI cards"""
        try:
            # Stream from remote agent via A2A protocol
            async for chunk in a2a_host.stream_agent(
                agent_url=request.agent_url,
                message=request.message,
                session_id=request.session_id,
            ):
                # Convert chunk to A2UI format
                a2ui_chunk = a2a_host.convert_to_a2ui(chunk)
                
                # Send as SSE event
                yield f"data: {json.dumps(a2ui_chunk)}\n\n"
            
            # Send completion event
            yield f"data: {json.dumps({'type': 'complete'})}\n\n"
            
        except Exception as e:
            # Send error event
            error_data = {
                "type": "error",
                "message": str(e)
            }
            yield f"data: {json.dumps(error_data)}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )


@app.post("/api/webhook/{session_id}")
async def webhook_callback(session_id: str, payload: Dict[str, Any]):
    """
    Webhook endpoint for push notifications from A2A agents.
    
    When an agent supports push mode, it will send results here
    when the task is complete.
    """
    # Store the callback result
    push_callbacks[session_id] = payload
    
    # In a real implementation, you would:
    # 1. Notify the frontend via WebSocket
    # 2. Store in database
    # 3. Trigger any necessary workflows
    
    return {"status": "received", "session_id": session_id}


@app.get("/api/webhook/{session_id}")
async def get_webhook_result(session_id: str):
    """
    Get push notification result for a session.
    
    Frontend can poll this endpoint to check if push notification arrived.
    """
    if session_id in push_callbacks:
        result = push_callbacks[session_id]
        # Convert to A2UI
        a2ui_response = a2a_host.convert_to_a2ui(result)
        return a2ui_response
    
    return {"status": "pending"}


@app.get("/health")
async def health():
    """Health check"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
