# LLM Agent Usage Guide

## Overview

The AI agents are now high-level LLM-based agents that use system prompts, tools, and autonomous decision-making. Each agent:

1. **Uses any LLM** (currently Groq/Llama 3, but can be configured for any provider)
2. **Has system prompts** defining their role, rules, and decision-making criteria
3. **Has access to tools/functions** for backend interactions and calculations
4. **Makes autonomous decisions** based on data and rules
5. **Explains what it chose to do and why** in natural language

## Agent Architecture

Each agent consists of:

- **System Prompt**: Defines the agent's role, rules, and decision-making process
- **Tools**: Functions the agent can call (backend queries, calculations, etc.)
- **LLM**: Language model for reasoning and decision-making
- **Agent Executor**: Orchestrates tool usage and reasoning

## Example Usage

### Query an Agent Directly

```python
from src.agents.agent_factory import create_agent
from src.models.schemas import AgentType
from src.services.backend_client import BackendClient

# Create backend client
backend_client = BackendClient()

# Create a fitness certificate agent
agent = create_agent(AgentType.FITNESS_CERTIFICATE, backend_client)

# Query the agent
result = await agent.analyze(
    query="Check if train T001 can enter revenue service based on fitness certificates",
    train_ids=[1],
    decision_date="2024-12-06",
    mode=PlanningMode.NORMAL
)

print(result["reasoning"])  # Agent explains what it did and why
print(result["actions_taken"])  # Tools/functions the agent used
print(result["decision"])  # Agent's decision
```

### Using the API

```bash
# Query fitness certificate agent
curl -X POST "http://localhost:8000/api/v1/agents/query" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_type": "fitness_certificate",
    "query": "Analyze fitness certificates for train T001 and determine if it can enter revenue service",
    "train_ids": [1],
    "decision_date": "2024-12-06",
    "mode": "normal"
  }'
```

Response:
```json
{
  "success": true,
  "agent_type": "fitness_certificate",
  "decision": "maintenance",
  "reasoning": "I analyzed the fitness certificates for train T001. I used the query_fitness_certificates tool to retrieve certificate data. I found that the Rolling-Stock certificate expires in 2 days, which is below the 3-day minimum requirement for normal mode. I calculated a fitness score of 60.0 based on the expiring certificate. I recommend scheduling certificate renewal before allowing revenue service. My confidence level is high (85%) based on clear certificate data.",
  "actions_taken": [
    {
      "tool": "query_fitness_certificates",
      "input": {"days_ahead": 30, "train_id": 1},
      "result": "[certificate data...]"
    },
    {
      "tool": "calculate_fitness_score",
      "input": {"certificates": [...], "decision_date": "2024-12-06", "mode": "normal"},
      "result": "score: 60.0, reasoning: Valid: 2, Expiring: 1, Expired: 0"
    }
  ],
  "score": 60.0,
  "recommendations": [
    "Schedule certificate renewal before allowing revenue service",
    "Monitor expiring certificate closely"
  ]
}
```

## Agent System Prompts

Each agent has a detailed system prompt that includes:

1. **Role Definition**: What the agent is responsible for
2. **Decision Rules**: Clear rules for scoring and decision-making
3. **Emergency Mode Rules**: How behavior changes in emergency situations
4. **Available Tools**: What tools the agent can use
5. **Process**: Step-by-step process the agent should follow

### Example: Fitness Certificate Agent System Prompt

```
You are a Fitness Certificate Agent responsible for validating and tracking 
fitness certificate validity across Rolling-Stock, Signalling, and Telecom departments.

YOUR ROLE:
- Ensure no train enters revenue service without valid certificates
- Validate certificate expiry dates against decision dates
- Calculate fitness scores (0-100) based on certificate status
- Flag critical issues (expired certificates = 0 score, blocking revenue service)

DECISION RULES:
1. Valid All Departments (≥3 days validity in normal mode, ≥1 day in emergency): Score = 100
2. One Expiring Soon (7-14 days): Score = 80, Warning flag
3. One Expiring Soon (1-7 days): Score = 60, High priority flag
4. One Expired: Score = 0, Critical conflict, Block revenue service
...

AVAILABLE TOOLS:
- query_fitness_certificates: Query fitness certificates from backend
- get_train_status: Get comprehensive train status
- calculate_fitness_score: Calculate fitness score based on certificates
...

YOUR PROCESS:
1. Use tools to gather fitness certificate data
2. Analyze certificate validity and expiry dates
3. Calculate scores based on rules
4. Make recommendations with clear reasoning
5. Explain what you chose to do and why
```

## Available Tools

Each agent has access to relevant tools:

### Backend Tools
- `query_fitness_certificates`: Query fitness certificates
- `query_job_cards`: Query job cards
- `query_branding_contracts`: Query branding contracts
- `query_mileage_data`: Query mileage data
- `query_cleaning_slots`: Query cleaning slots
- `query_stabling_geometry`: Query stabling geometry
- `get_train_status`: Get comprehensive train status
- `submit_decision`: Submit decision to backend

### Calculation Tools
- `calculate_fitness_score`: Calculate fitness score
- `calculate_job_card_score`: Calculate job card score
- `calculate_days_until`: Calculate days until date
- `calculate_mileage_deviation`: Calculate mileage deviation

## Autonomous Decision-Making

The agents make autonomous decisions by:

1. **Understanding the Query**: The LLM interprets the natural language query
2. **Planning Actions**: Decides which tools to use and in what order
3. **Gathering Data**: Uses tools to query backend and perform calculations
4. **Reasoning**: Analyzes data using the rules in the system prompt
5. **Decision Making**: Makes a decision based on rules and data
6. **Explanation**: Explains what it did, why, and what tools it used

## Customization

### Changing LLM Provider

Edit `src/config/groq_config.py` to use a different LLM:

```python
from langchain_openai import ChatOpenAI

def get_llm():
    return ChatOpenAI(model="gpt-4", temperature=0.1)
```

### Modifying System Prompts

Edit the system prompts in `src/agents/llm_agent.py` to change agent behavior:

```python
system_prompt = """Your custom system prompt here..."""
```

### Adding New Tools

Add tools in `src/tools/backend_tools.py` or `src/tools/scoring_tools.py`:

```python
@tool
async def my_new_tool(param: str) -> Dict[str, Any]:
    """Tool description."""
    # Implementation
    return result
```

Then add to agent tools list in the agent factory function.

## Benefits

1. **Explainable**: Agents explain their decisions in natural language
2. **Autonomous**: Agents decide which tools to use and when
3. **Flexible**: Can handle natural language queries
4. **Rule-Based**: Follows clear decision rules from system prompts
5. **Automation-Ready**: Can be integrated into automated workflows
6. **LLM-Agnostic**: Works with any LLM provider

