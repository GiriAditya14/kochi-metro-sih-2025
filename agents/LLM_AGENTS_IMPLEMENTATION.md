# LLM-Based Agents Implementation

## Overview

The AI agents have been refactored to be **high-level LLM-based agents** that use system prompts, tools, and autonomous decision-making. This makes them more intelligent, explainable, and automation-ready.

## Key Features

### 1. **LLM-Powered Decision Making**
- Agents use any LLM (currently Groq/Llama 3, easily configurable)
- Natural language understanding and reasoning
- Autonomous tool selection and usage

### 2. **System Prompts with Rules**
- Each agent has a detailed system prompt defining:
  - Role and responsibilities
  - Decision rules and scoring criteria
  - Emergency mode behavior
  - Available tools and processes

### 3. **Tool-Based Functionality**
- Agents have access to tools for:
  - Backend API queries (fitness certificates, job cards, etc.)
  - Calculations (scores, deviations, dates)
  - Data retrieval and analysis

### 4. **Autonomous Operation**
- Agents decide which tools to use
- Agents reason about data and make decisions
- Agents explain what they did and why

### 5. **Explainable Reasoning**
- Every decision includes:
  - What the agent chose to do
  - Why it made that choice
  - What tools/functions it used
  - What data it found
  - Confidence level

## Architecture

```
┌─────────────────────────────────────────┐
│         LLM Agent (Any Provider)        │
│  - System Prompt (Rules & Role)         │
│  - Natural Language Understanding       │
│  - Autonomous Decision Making           │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼──────┐  ┌──────▼──────┐
│   Tools     │  │  Backend    │
│  (Functions)│  │   Client     │
└─────────────┘  └─────────────┘
```

## Implementation Details

### Agent Structure

Each agent is created using the `LLMAgent` class:

```python
class LLMAgent:
    - system_prompt: Defines role, rules, and process
    - tools: Available functions/tools
    - llm: Language model (any provider)
    - agent_executor: LangChain agent executor
```

### System Prompts

System prompts include:
1. **Role Definition**: What the agent does
2. **Decision Rules**: Clear scoring and decision criteria
3. **Emergency Rules**: How behavior changes in emergencies
4. **Available Tools**: What tools the agent can use
5. **Process**: Step-by-step decision-making process

### Tools

Tools are LangChain tools that agents can call:
- **Backend Tools**: Query APIs, get train status, submit decisions
- **Calculation Tools**: Calculate scores, deviations, dates

### Agent Factory

The `agent_factory.py` provides factory functions to create each agent type:
- `create_fitness_agent()`
- `create_job_card_agent()`
- `create_branding_agent()`
- `create_mileage_agent()`
- `create_cleaning_agent()`
- `create_stabling_agent()`

## API Endpoints

### Query Agent
```
POST /api/v1/agents/query
```

Request:
```json
{
  "agent_type": "fitness_certificate",
  "query": "Check if train T001 can enter revenue service",
  "train_ids": [1],
  "decision_date": "2024-12-06",
  "mode": "normal"
}
```

Response:
```json
{
  "success": true,
  "agent_type": "fitness_certificate",
  "decision": "maintenance",
  "reasoning": "I analyzed the fitness certificates...",
  "actions_taken": [
    {
      "tool": "query_fitness_certificates",
      "input": {...},
      "result": "..."
    }
  ],
  "score": 60.0,
  "recommendations": [...]
}
```

## Benefits

1. **Explainable AI**: Agents explain their decisions in natural language
2. **Autonomous**: Agents decide which tools to use autonomously
3. **Flexible**: Can handle natural language queries
4. **Rule-Based**: Follows clear decision rules from system prompts
5. **Automation-Ready**: Perfect for automated workflows
6. **LLM-Agnostic**: Works with any LLM provider (Groq, OpenAI, Anthropic, etc.)

## Usage Examples

### Python
```python
from src.agents.agent_factory import create_agent
from src.models.schemas import AgentType, PlanningMode

agent = create_agent(AgentType.FITNESS_CERTIFICATE, backend_client)
result = await agent.analyze(
    query="Analyze fitness certificates for train T001",
    train_ids=[1],
    decision_date="2024-12-06",
    mode=PlanningMode.NORMAL
)
```

### API
```bash
curl -X POST "http://localhost:8000/api/v1/agents/query" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_type": "fitness_certificate",
    "query": "Check train T001 fitness certificates",
    "train_ids": [1]
  }'
```

## Files Created/Modified

### New Files
- `src/agents/llm_agent.py`: LLM-based agent implementation
- `src/agents/agent_factory.py`: Factory for creating agents
- `src/tools/backend_tools.py`: Backend interaction tools
- `src/tools/scoring_tools.py`: Calculation tools
- `src/api/routes/agent_query.py`: API endpoint for agent queries
- `AGENT_USAGE.md`: Usage documentation
- `LLM_AGENTS_IMPLEMENTATION.md`: This file

### Modified Files
- `src/main.py`: Added agent query router
- `src/api/routes/__init__.py`: Added agent query router
- `requirements.txt`: Added langchain-openai for flexibility

## Next Steps

1. **Test Agents**: Test each agent with various queries
2. **Customize Prompts**: Adjust system prompts based on requirements
3. **Add Tools**: Add more tools as needed
4. **Configure LLM**: Switch to different LLM providers if needed
5. **Integrate**: Integrate with existing workflows

## Configuration

### Change LLM Provider

Edit `src/config/groq_config.py`:

```python
from langchain_openai import ChatOpenAI

def get_groq_llm():
    return ChatOpenAI(model="gpt-4", temperature=0.1)
```

### Modify System Prompts

Edit system prompts in `src/agents/llm_agent.py` factory functions.

### Add New Tools

Add tools in `src/tools/backend_tools.py` or `src/tools/scoring_tools.py` and include in agent tool lists.

