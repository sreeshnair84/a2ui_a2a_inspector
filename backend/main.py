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
from datetime import datetime
from core.a2a_host import A2AHost
from auth.token_manager import get_current_user
import uuid
from sqlmodel import Session, select, desc
from core.database import create_db_and_tables, get_session, engine
from models.session import Session as ChatSession, Message

app = FastAPI(title="A2A Host Server", version="1.0.0")

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

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
    surfaceUpdate: Optional[Dict[str, Any]] = None
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
            surfaceUpdate=a2ui_response.get("surfaceUpdate"),
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
    Persists messages to database.
    """
    from fastapi.responses import StreamingResponse
    import json
    
    # Generate session ID if not provided (should ideally be provided)
    session_id = request.session_id or str(uuid.uuid4())
    
    # Persist User Message
    with Session(engine) as db_session:
        # Check if session exists (create if not - auto-creation logic)
        chat_session = db_session.get(ChatSession, session_id)
        if not chat_session:
            chat_session = ChatSession(id=session_id, title=request.message[:30] + "...")
            db_session.add(chat_session)
            db_session.commit()
        
        # Save user message
        user_msg = Message(
            session_id=session_id,
            role="user",
            content=request.message
        )
        db_session.add(user_msg)
        chat_session.updated_at = datetime.utcnow() # Update timestamp
        db_session.add(chat_session)
        db_session.commit()

    async def generate_stream():
        """Generate SSE stream of A2UI cards"""
        accumulated_envelopes = []
        
        try:
            # Stream from remote agent via A2A protocol
            async for chunk in a2a_host.stream_agent(
                agent_url=request.agent_url,
                message=request.message,
                session_id=session_id,
            ):
                # Convert chunk to A2UI format
                a2ui_chunk = a2a_host.convert_to_a2ui(chunk)
                
                # Accumulate envelopes for persistence
                accumulated_envelopes.append(a2ui_chunk)

                # Send as SSE event
                yield f"data: {json.dumps(a2ui_chunk)}\n\n"
            
            # Send completion event
            yield f"data: {json.dumps({'type': 'complete'})}\n\n"
            
            # Persist Agent Response (All envelopes as JSON)
            if accumulated_envelopes:
                with Session(engine) as db_session:
                    agent_msg = Message(
                        session_id=session_id,
                        role="agent",
                        content=json.dumps(accumulated_envelopes)
                    )
                    db_session.add(agent_msg)
                    db_session.commit()
            
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

# --- Session Management Endpoints ---

@app.get("/api/sessions")
async def list_sessions(user: dict = Depends(get_current_user)):
    """List all chat sessions"""
    with Session(engine) as session:
        statement = select(ChatSession).order_by(desc(ChatSession.updated_at))
        results = session.exec(statement).all()
        return results

@app.post("/api/sessions")
async def create_session(title: str = "New Chat", user: dict = Depends(get_current_user)):
    """Create a new chat session"""
    with Session(engine) as session:
        new_session = ChatSession(title=title)
        session.add(new_session)
        session.commit()
        session.refresh(new_session)
        return new_session

@app.get("/api/sessions/{session_id}")
async def get_session_history(session_id: str, user: dict = Depends(get_current_user)):
    """Get message history for a session"""
    with Session(engine) as session:
        statement = select(Message).where(Message.session_id == session_id).order_by(Message.timestamp)
        results = session.exec(statement).all()
        return results

@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str, user: dict = Depends(get_current_user)):
    """Delete a session"""
    with Session(engine) as session:
        chat_session = session.get(ChatSession, session_id)
        if not chat_session:
            raise HTTPException(status_code=404, detail="Session not found")
        session.delete(chat_session)
        session.commit()
        return {"status": "success"}

class SessionUpdate(BaseModel):
    title: str

@app.patch("/api/sessions/{session_id}")
async def update_session(session_id: str, update_data: SessionUpdate, user: dict = Depends(get_current_user)):
    """Update a session (e.g. title)"""
    with Session(engine) as session:
        chat_session = session.get(ChatSession, session_id)
        if not chat_session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        chat_session.title = update_data.title
        chat_session.updated_at = datetime.utcnow()
        session.add(chat_session)
        session.commit()
        session.refresh(chat_session)
        return chat_session

from fastapi import UploadFile, File
import shutil
import os
from config import settings

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Handle file uploads.
    Saves file to upload_dir and returns metadata.
    """
    try:
        # Ensure upload directory exists
        os.makedirs(settings.upload_dir, exist_ok=True)
        
        # Safe filename
        filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(settings.upload_dir, filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return {
            "status": "success",
            "filename": file.filename,
            "saved_name": filename,
            "path": file_path,
            "size": os.path.getsize(file_path),
            "content_type": file.content_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

from fastapi import UploadFile, File
import shutil
import os
from config import settings

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Handle file uploads.
    Saves file to upload_dir and returns metadata.
    """
    try:
        # Ensure upload directory exists
        os.makedirs(settings.upload_dir, exist_ok=True)
        
        # Safe filename
        filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(settings.upload_dir, filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return {
            "status": "success",
            "filename": file.filename,
            "saved_name": filename,
            "path": file_path,
            "size": os.path.getsize(file_path),
            "content_type": file.content_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
