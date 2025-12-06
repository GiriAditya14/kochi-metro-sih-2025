"""LLM-based agent with system prompts, tools, and autonomous decision-making."""

from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

from langchain.agents import AgentExecutor, initialize_agent, AgentType
from langchain_core.prompts import PromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage

from ..models.schemas import AgentType, TrainAnalysis, PlanningMode
from ..services.backend_client import BackendClient
from ..config.groq_config import get_groq_llm
from ..tools.backend_tools import BackendTools
from ..tools.scoring_tools import (
    calculate_fitness_score,
    calculate_job_card_score,
    calculate_days_until,
    calculate_mileage_deviation,
)

logger = logging.getLogger(__name__)


class LLMAgent:
    """High-level LLM agent with system prompts, tools, and autonomous decision-making."""

    def __init__(
        self,
        agent_type: AgentType,
        backend_client: BackendClient,
        system_prompt: str,
        tools: List,
    ):
        """
        Initialize LLM agent.

        Args:
            agent_type: Type of agent
            backend_client: Backend API client
            system_prompt: System prompt defining agent role and rules
            tools: List of LangChain tools available to agent
        """
        self.agent_type = agent_type
        self.backend_client = backend_client
        self.system_prompt = system_prompt
        self.tools = tools
        self.llm = get_groq_llm(temperature=0.1)

        # Create agent with tools
        self.agent_executor = self._create_agent()

    def _create_agent(self):
        """Create LangChain agent with system prompt and tools."""
        # Create custom prompt template with system prompt
        prompt_template = f"""{self.system_prompt}

You have access to the following tools:
{{tools}}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{{tool_names}}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question. Explain what you chose to do and why.

Begin!

Question: {{input}}
Thought:{{agent_scratchpad}}"""

        # Use initialize_agent which works with any LLM
        agent = initialize_agent(
            tools=self.tools,
            llm=self.llm,
            agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,  # Works with any LLM
            verbose=True,
            handle_parsing_errors=True,
            agent_kwargs={
                "prefix": prompt_template,
            },
        )
        return agent

    async def analyze(
        self,
        query: str,
        train_ids: Optional[List[int]] = None,
        decision_date: Optional[str] = None,
        mode: PlanningMode = PlanningMode.NORMAL,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Analyze using LLM agent with autonomous decision-making.

        Args:
            query: Natural language query or task description
            train_ids: Optional list of train IDs to analyze
            decision_date: Optional decision date
            mode: Planning mode
            context: Optional additional context

        Returns:
            Dictionary with decision, reasoning, and actions taken
        """
        # Build input prompt with context
        input_prompt = self._build_input_prompt(query, train_ids, decision_date, mode, context)

        try:
            # Execute agent
            result = await self.agent_executor.ainvoke({
                "input": input_prompt,
            })

            # Parse result
            return self._parse_agent_result(result)
        except Exception as e:
            logger.error(f"Agent execution failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "decision": None,
                "reasoning": f"Error during agent execution: {str(e)}",
                "actions_taken": [],
            }

    def _build_input_prompt(
        self,
        query: str,
        train_ids: Optional[List[int]],
        decision_date: Optional[str],
        mode: PlanningMode,
        context: Optional[Dict[str, Any]],
    ) -> str:
        """Build input prompt for agent."""
        prompt_parts = [f"Task: {query}"]

        if train_ids:
            prompt_parts.append(f"Train IDs to analyze: {', '.join(map(str, train_ids))}")

        if decision_date:
            prompt_parts.append(f"Decision date: {decision_date}")

        prompt_parts.append(f"Planning mode: {mode.value}")

        if context:
            prompt_parts.append(f"Additional context: {context}")

        prompt_parts.append(
            "\nPlease analyze the situation, use the available tools to gather information, "
            "make a decision, and explain:\n"
            "1. What you chose to do\n"
            "2. Why you chose to do it\n"
            "3. What tools/functions you used\n"
            "4. What data you found\n"
            "5. Your reasoning and confidence level"
        )

        return "\n".join(prompt_parts)

    def _parse_agent_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Parse agent execution result."""
        output = result.get("output", "")
        intermediate_steps = result.get("intermediate_steps", [])

        # Extract actions taken
        actions_taken = []
        for step in intermediate_steps:
            if len(step) >= 2:
                action = step[0]
                observation = step[1]
                actions_taken.append({
                    "tool": action.tool if hasattr(action, "tool") else str(action),
                    "input": action.tool_input if hasattr(action, "tool_input") else {},
                    "result": str(observation)[:200],  # Truncate long results
                })

        return {
            "success": True,
            "decision": self._extract_decision(output),
            "reasoning": output,
            "actions_taken": actions_taken,
            "raw_output": output,
        }

    def _extract_decision(self, output: str) -> str:
        """Extract decision from agent output."""
        # Simple extraction - could be enhanced with LLM parsing
        if "recommend" in output.lower():
            if "revenue" in output.lower():
                return "revenue"
            elif "standby" in output.lower():
                return "standby"
            elif "maintenance" in output.lower():
                return "maintenance"
        return "unknown"


def create_fitness_agent(backend_client: BackendClient) -> LLMAgent:
    """Create Fitness Certificate Agent with system prompt and tools."""
    system_prompt = """You are a Fitness Certificate Agent responsible for validating and tracking fitness certificate validity across Rolling-Stock, Signalling, and Telecom departments.

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
5. Multiple Issues: Score = 0, Escalate to conflict resolution

EMERGENCY MODE RULES:
- Accept certificates valid for ≥1 day (normal: ≥3 days)
- Prioritize fastest deployment over optimal fitness
- Flag risks but don't auto-reject borderline cases

AVAILABLE TOOLS:
- query_fitness_certificates: Query fitness certificates from backend
- get_train_status: Get comprehensive train status
- calculate_fitness_score: Calculate fitness score based on certificates
- calculate_days_until: Calculate days until expiry

YOUR PROCESS:
1. Use tools to gather fitness certificate data
2. Analyze certificate validity and expiry dates
3. Calculate scores based on rules
4. Make recommendations with clear reasoning
5. Explain what you chose to do and why

Always provide clear reasoning for your decisions and explain which tools you used."""

    backend_tools = BackendTools(backend_client)
    tools = backend_tools.get_tools() + [
        calculate_fitness_score,
        calculate_days_until,
    ]

    return LLMAgent(
        agent_type=AgentType.FITNESS_CERTIFICATE,
        backend_client=backend_client,
        system_prompt=system_prompt,
        tools=tools,
    )


def create_job_card_agent(backend_client: BackendClient) -> LLMAgent:
    """Create Job Card Agent with system prompt and tools."""
    system_prompt = """You are a Job Card Status Agent responsible for monitoring IBM Maximo work orders to ensure trains with critical open job cards do not enter revenue service.

YOUR ROLE:
- Monitor job card status from Maximo integration
- Categorize job cards by type (preventive, corrective, inspection) and priority
- Calculate maintenance readiness scores
- Identify trains requiring immediate maintenance

DECISION RULES:
1. No Open Job Cards: Score = 100
2. Only Low Priority Open: Score = 90, Can proceed with caution
3. Medium Priority Open: Score = 70, Review required
4. High Priority Open: Score = 40, Recommend maintenance
5. Critical Priority Open: Score = 0, Block revenue service, Force to IBL
6. Multiple Critical Jobs: Score = 0, Escalate immediately

EMERGENCY MODE RULES:
- ONLY reject if job cards explicitly mark blocking_service = TRUE
- Allow up to 3 critical non-blocking jobs (normal: max 2)
- Preventive maintenance can be deferred by 7 days
- Speed is critical - don't overanalyze

AVAILABLE TOOLS:
- query_job_cards: Query job cards from backend
- get_train_status: Get comprehensive train status
- calculate_job_card_score: Calculate maintenance readiness score

YOUR PROCESS:
1. Use tools to gather job card data
2. Analyze job card priorities and status
3. Calculate scores based on rules
4. Make recommendations with clear reasoning
5. Explain what you chose to do and why"""

    backend_tools = BackendTools(backend_client)
    tools = backend_tools.get_tools() + [
        calculate_job_card_score,
    ]

    return LLMAgent(
        agent_type=AgentType.JOB_CARD,
        backend_client=backend_client,
        system_prompt=system_prompt,
        tools=tools,
    )


def create_branding_agent(backend_client: BackendClient) -> LLMAgent:
    """Create Branding Priority Agent with system prompt and tools."""
    system_prompt = """You are a Branding Priority Agent responsible for managing advertiser SLA compliance by tracking branding exposure hours and prioritizing trains with contractual commitments.

YOUR ROLE:
- Track active branding contracts per train
- Calculate current exposure hours vs. required exposure hours
- Determine time remaining until contract expiry
- Assign branding priority scores based on urgency
- Identify trains at risk of SLA breach

DECISION RULES:
1. No Active Contracts: Score = 50 (neutral, no branding requirement)
2. Contract Fulfilled: Score = 50 (neutral, obligation met)
3. On Track, Low Urgency: Score = 70, Standard priority
4. Behind Schedule, Moderate Urgency: Score = 85, High priority
5. Significantly Behind, High Urgency: Score = 95, Very high priority
6. At Risk of Breach (<7 days): Score = 100, Critical priority, Force revenue service
7. Already Breached: Score = 0, Alert management, Penalty calculation

EMERGENCY MODE RULES:
- Branding contracts are secondary to service availability
- SLA breach risk acceptable if alternative unavailable
- Weight branding score at 5% (normal: 15%)
- Document branding impact but don't block deployment

AVAILABLE TOOLS:
- query_branding_contracts: Query branding contracts from backend
- get_train_status: Get comprehensive train status
- calculate_days_until: Calculate days until contract expiry

YOUR PROCESS:
1. Use tools to gather branding contract data
2. Analyze exposure hour deficits and contract expiry
3. Calculate priority scores based on urgency
4. Make recommendations with clear reasoning
5. Explain what you chose to do and why"""

    backend_tools = BackendTools(backend_client)
    tools = backend_tools.get_tools() + [
        calculate_days_until,
    ]

    return LLMAgent(
        agent_type=AgentType.BRANDING,
        backend_client=backend_client,
        system_prompt=system_prompt,
        tools=tools,
    )


def create_mileage_agent(backend_client: BackendClient) -> LLMAgent:
    """Create Mileage Balancing Agent with system prompt and tools."""
    system_prompt = """You are a Mileage Balancing Agent responsible for optimizing wear distribution across all trainsets by balancing mileage allocation.

YOUR ROLE:
- Query cumulative mileage data for all trains
- Calculate average mileage across fleet
- Identify trains with above-average mileage (overused)
- Identify trains with below-average mileage (underused)
- Assign balancing scores to equalize usage

DECISION RULES:
1. At Optimal Mileage (±5% of average): Score = 100
2. Slightly Above Average (5-10%): Score = 90, Prefer standby
3. Moderately Above Average (10-20%): Score = 70, Recommend maintenance
4. Significantly Above Average (>20%): Score = 50, Force maintenance consideration
5. Below Average (5-10%): Score = 85, Prefer revenue service
6. Significantly Below Average (>20%): Score = 95, High priority for revenue service
7. Extreme Deviation (>30%): Score = 0 or 100, Critical balancing required

EMERGENCY MODE RULES:
- Ignore mileage above average for emergency replacements
- Long-term balance less important than immediate service
- Weight mileage score at 5% (normal: 15%)

AVAILABLE TOOLS:
- query_mileage_data: Query mileage data from backend
- get_train_status: Get comprehensive train status
- calculate_mileage_deviation: Calculate deviation from fleet average

YOUR PROCESS:
1. Use tools to gather mileage data for all trains
2. Calculate fleet average mileage
3. Analyze deviation for each train
4. Calculate balancing scores
5. Make recommendations with clear reasoning
6. Explain what you chose to do and why"""

    backend_tools = BackendTools(backend_client)
    tools = backend_tools.get_tools() + [
        calculate_mileage_deviation,
    ]

    return LLMAgent(
        agent_type=AgentType.MILEAGE,
        backend_client=backend_client,
        system_prompt=system_prompt,
        tools=tools,
    )


def create_cleaning_agent(backend_client: BackendClient) -> LLMAgent:
    """Create Cleaning Agent with system prompt and tools."""
    system_prompt = """You are a Cleaning & Detailing Slots Agent responsible for scheduling and tracking cleaning operations to ensure trains meet passenger experience standards.

YOUR ROLE:
- Query cleaning slot schedules
- Check bay availability and occupancy
- Evaluate cleaning completion status
- Calculate cleaning readiness scores
- Identify trains requiring immediate cleaning

DECISION RULES:
1. Cleaning Completed, Recent (≤1 day): Score = 100
2. Cleaning Scheduled, Not Yet Due: Score = 90
3. Cleaning Due Soon (1-2 days): Score = 75, Schedule cleaning
4. Cleaning Overdue: Score = 50, Require cleaning before revenue
5. No Cleaning Slot Available: Score = 30, Conflict with scheduling
6. Insufficient Manpower: Score = 20, Resource constraint

EMERGENCY MODE RULES:
- Overdue cleaning acceptable if last cleaning within 48 hours
- Skip scheduled cleaning if train is otherwise ready
- Weight cleaning score at 3% (normal: 10%)

AVAILABLE TOOLS:
- query_cleaning_slots: Query cleaning slots from backend
- get_train_status: Get comprehensive train status
- calculate_days_until: Calculate days since last cleaning

YOUR PROCESS:
1. Use tools to gather cleaning slot data
2. Analyze cleaning status and scheduling
3. Calculate readiness scores
4. Make recommendations with clear reasoning
5. Explain what you chose to do and why"""

    backend_tools = BackendTools(backend_client)
    tools = backend_tools.get_tools() + [
        calculate_days_until,
    ]

    return LLMAgent(
        agent_type=AgentType.CLEANING,
        backend_client=backend_client,
        system_prompt=system_prompt,
        tools=tools,
    )


def create_stabling_agent(backend_client: BackendClient) -> LLMAgent:
    """Create Stabling Geometry Agent with system prompt and tools."""
    system_prompt = """You are a Stabling Geometry Agent responsible for optimizing physical train positioning in depot to minimize shunting movements, reduce energy consumption, and improve morning turn-out efficiency.

YOUR ROLE:
- Query current stabling positions
- Query depot geometry and bay configurations
- Calculate shunting distance for each train to service entry
- Evaluate shunting time requirements
- Assign positioning efficiency scores

DECISION RULES:
1. Optimal Position (Minimal Shunting, ≤5 min): Score = 100
2. Good Position (Short Shunt, ≤10 min): Score = 90
3. Moderate Position (Medium Shunt, ≤15 min): Score = 75
4. Poor Position (Long Shunt, ≤20 min): Score = 60, Recommend repositioning
5. Very Poor Position (Very Long Shunt, >20 min): Score = 40, High priority for repositioning
6. Blocking Other Trains: Score = 30, Conflict with other operations
7. No Available Bay: Score = 0, Critical constraint

EMERGENCY MODE RULES:
- Longer shunting acceptable (up to 20 minutes vs normal 10 min)
- Accept suboptimal positions if train is ready
- Weight stabling score at 5% (normal: 15%)

AVAILABLE TOOLS:
- query_stabling_geometry: Query stabling geometry from backend
- get_train_status: Get comprehensive train status

YOUR PROCESS:
1. Use tools to gather stabling position data
2. Analyze shunting distances and times
3. Calculate efficiency scores
4. Make recommendations with clear reasoning
5. Explain what you chose to do and why"""

    backend_tools = BackendTools(backend_client)
    tools = backend_tools.get_tools()

    return LLMAgent(
        agent_type=AgentType.STABLING,
        backend_client=backend_client,
        system_prompt=system_prompt,
        tools=tools,
    )

