# A2A Host Backend Setup

## Quick Start with Virtual Environment

```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run server
python main.py
```

## Manual Setup

1. **Create Virtual Environment**
   ```powershell
   python -m venv venv
   ```

2. **Activate Virtual Environment**
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```

3. **Install Dependencies**
   ```powershell
   pip install -r requirements.txt
   ```

4. **Run Server**
   ```powershell
   uvicorn main:app --reload --port 8000
   ```

## Features

### A2A Protocol Support
- ✅ **Streaming** - Real-time SSE streaming for progressive UI updates
- ✅ **Polling** - Standard request/response for simple queries
- ✅ **Push Notifications** - Webhook support for async agent responses

### Endpoints

- `POST /api/chat` - Main chat endpoint (auto-selects best A2A mode)
- `POST /api/chat/stream` - Streaming endpoint for progressive rendering
- `POST /api/webhook/{session_id}` - Webhook for push notifications
- `GET /api/webhook/{session_id}` - Check push notification status

### A2UI Support
- Converts any agent response to A2UI JSON format
- Supports all A2UI card types (text, form, table, status, etc.)
- Compatible with Google A2UI v0.8 specification

## Environment Variables

Create a `.env` file:
```
SECRET_KEY=your-secret-key-here
```

## Testing

```powershell
# Test health endpoint
curl http://localhost:8000/health

# Test with mock agent
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message": "Hello", "agent_url": "http://localhost:8001", "session_id": "test"}'
```
