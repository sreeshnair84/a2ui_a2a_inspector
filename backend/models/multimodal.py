"""
Multimodal input/output models for handling text, voice, and file inputs.
"""
from pydantic import BaseModel, Field
from typing import Optional, Literal, Any, Dict, List
from datetime import datetime


class TextInput(BaseModel):
    """Text input from user."""
    text: str = Field(..., description="User's text message")


class VoiceInput(BaseModel):
    """Voice input with transcript."""
    transcript: str = Field(..., description="Transcribed text from voice")
    audio_url: Optional[str] = Field(None, description="URL to audio file if stored")
    duration_seconds: Optional[float] = Field(None, description="Duration of audio")


class FileInput(BaseModel):
    """File upload input."""
    file_id: str = Field(..., description="Unique file identifier")
    file_name: str = Field(..., description="Original filename")
    file_type: str = Field(..., description="MIME type")
    file_size: int = Field(..., description="File size in bytes")
    file_url: str = Field(..., description="URL to access the file")


class MultimodalRequest(BaseModel):
    """Unified request model supporting text, voice, and file inputs."""
    modality: Literal["text", "voice", "file"] = Field(..., description="Input modality")
    text_input: Optional[TextInput] = None
    voice_input: Optional[VoiceInput] = None
    file_input: Optional[FileInput] = None
    session_id: str = Field(..., description="Session identifier")
    user_id: str = Field(..., description="User identifier")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class A2UIResponse(BaseModel):
    """Standardized A2UI JSON response."""
    cards: List[Dict[str, Any]] = Field(..., description="List of A2UI card schemas")
    session_id: str = Field(..., description="Session identifier")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
