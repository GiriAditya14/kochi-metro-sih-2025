# NeuralInduction AI - Agent Phase Service

AI Agent Phase microservice for KMRL Train Induction Optimization System. This service implements a multi-agent system using LangChain and LangGraph to generate optimal train induction decisions.

## Overview

The Agent Phase is the core differentiator of the NeuralInduction AI system. It implements six specialized AI agents that collaboratively analyze interdependent variables to generate optimal train induction decisions with explainable reasoning.

## Technology Stack

- **Python 3.11+**: Core runtime
- **LangChain**: Agent orchestration and tooling
- **LangGraph**: Multi-agent workflow management
- **FastAPI**: REST API service layer
- **Groq SDK**: LLM integration (Llama 3 70B)
- **Pydantic**: Data validation and models
- **httpx**: Async HTTP client for backend communication

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.template .env
   # Edit .env with your configuration
   ```

3. **Start the service:**
   ```bash
   uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
   ```

## Environment Variables

- `GROQ_API_KEY` - Groq API key for LLM
- `BACKEND_API_URL` - Node.js backend base URL (default: http://localhost:3000)
- `AGENT_SERVICE_PORT` - Agent service port (default: 8000)
- `LOG_LEVEL` - Logging level (default: info)
- `AGENT_TIMEOUT_SECONDS` - Agent execution timeout (default: 60)
- `EMERGENCY_TIMEOUT_SECONDS` - Emergency mode timeout (default: 300)

## API Endpoints

### Planning
- `POST /api/v1/agents/plan` - Normal planning workflow
- `POST /api/v1/agents/what-if` - What-if simulation

### Emergency
- `POST /api/v1/agents/emergency/replan` - Emergency replanning
- `POST /api/v1/agents/emergency/quick-check` - Quick eligibility check
- `POST /api/v1/agents/emergency/crisis-optimize` - Crisis mode optimization

### Health
- `GET /health` - Health check
- `GET /ready` - Readiness check

## Architecture

The service consists of:

1. **Six Specialized Agents**: Each agent analyzes a specific domain (fitness certificates, job cards, branding, mileage, cleaning, stabling)
2. **LangGraph Orchestrator**: Manages multi-agent workflow and coordination
3. **Conflict Resolution Engine**: Detects and resolves conflicts between agent recommendations
4. **Multi-Objective Optimization**: Combines agent scores into composite priority scores
5. **Explainable Reasoning**: Generates human-readable decision justifications using Groq LLM

## Documentation

See `docs/AGENT_PHASE.md` for detailed documentation on agent behavior and architecture.

