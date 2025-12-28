# Remote A2A Agent Setup

## Quick Start with Virtual Environment

```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Set Gemini API key (already configured in code)
# Or override: $env:GEMINI_API_KEY="your-key-here"

# Run agent
python main.py
```

## Features

### A2A Protocol Compliance
- ✅ **Agent Card** - Exposed at `/.well-known/agent-card.json`
- ✅ **Run Endpoint** - Standard `/run` endpoint for A2A protocol
- ✅ **Streaming Support** - SSE streaming for progressive responses
- ✅ **Task Management** - InMemoryTaskStore for task lifecycle

### Capabilities
- **VM Provisioning** - Help users request virtual machines
- **SAP Access** - Assist with SAP system access requests
- **RBAC Management** - Role-based access control
- **Azure WebApp** - Azure deployment guidance
- **General IT Support** - Answer IT service questions

### Powered By
- **Gemini 2.0 Flash** - Google's latest LLM
- **a2a-sdk** - Official A2A protocol implementation
- **AgentExecutor** - Standard A2A agent pattern

## Testing

```powershell
# Test agent card (discovery)
curl http://localhost:8001/.well-known/agent-card.json

# Test /run endpoint (A2A protocol)
curl -X POST http://localhost:8001/run \
  -H "Content-Type: application/json" \
  -d '{"input": {"text": "I need a new VM"}, "session_id": "test"}'
```

## Integration

This agent works with any A2A-compatible host:
- Our A2A Host server (port 8000)
- Google ADK clients
- Any A2A protocol client

Simply provide the agent URL: `http://localhost:8001`
