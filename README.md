# A2UI Chat Application

Complete implementation of Google's A2UI (Agent-to-UI) protocol with A2A (Agent-to-Agent) communication.

## Quick Start

### 1. Start Remote Agent
```powershell
cd agent
.\setup.ps1
.\run.ps1
```
Agent runs on http://localhost:8001

### 2. Start A2A Host
```powershell
cd backend
.\setup.ps1
.\run.ps1
```
Server runs on http://localhost:8000

### 3. Start Frontend
```powershell
cd frontend
npm install
npm run dev
```
UI available at http://localhost:5173

## Architecture

```
Frontend (A2UI) → A2A Host (Translator) → Remote Agent (Gemini)
```

- **Frontend**: Pure A2UI JSON rendering, agent-agnostic
- **A2A Host**: Supports all A2A modes (streaming, polling, push)
- **Remote Agent**: AgentExecutor with Gemini 2.0 Flash

## Features

✅ Google A2UI v0.8 specification  
✅ Full A2A protocol support  
✅ Streaming, polling, and push modes  
✅ Agent discovery via agent card  
✅ Gemini 2.0 Flash integration  

## Documentation

- [Backend README](backend/README.md)
- [Agent README](agent/README.md)
- [Implementation Plan](https://github.com/google/A2UI)

Built with a2a-sdk v0.3.22
