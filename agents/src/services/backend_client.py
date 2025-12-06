"""Backend API client for communicating with Node.js backend."""

import httpx
import logging
from typing import Dict, List, Any, Optional
from ..config.settings import settings

logger = logging.getLogger(__name__)


class BackendClient:
    """Async HTTP client for backend API communication."""

    def __init__(self, base_url: Optional[str] = None):
        """
        Initialize backend client.

        Args:
            base_url: Backend API base URL (defaults to settings.backend_api_url)
        """
        self.base_url = base_url or settings.backend_api_url
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=30.0,
            follow_redirects=True,
        )

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()

    async def query_backend(
        self, agent_type: str, query: str, parameters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Query backend API for agent-specific data.

        Args:
            agent_type: Type of agent (fitness_certificate, job_card, etc.)
            query: Query type (get_all_expiring_certificates, etc.)
            parameters: Optional query parameters

        Returns:
            Response data from backend
        """
        try:
            response = await self.client.post(
                "/api/v1/agents/query",
                json={
                    "agentType": agent_type,
                    "query": query,
                    "parameters": parameters or {},
                },
            )
            response.raise_for_status()
            data = response.json()
            return data.get("data", [])
        except httpx.HTTPStatusError as e:
            logger.error(f"Backend query failed: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Error querying backend: {str(e)}")
            raise

    async def get_train_status(self, train_id: int) -> Dict[str, Any]:
        """
        Get comprehensive train status from backend.

        Args:
            train_id: Train ID

        Returns:
            Complete train status data
        """
        try:
            response = await self.client.get(f"/api/v1/agents/train-status/{train_id}")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Failed to get train status: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Error getting train status: {str(e)}")
            raise

    async def submit_decision(self, decision_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Submit agent-generated decision recommendations to backend.

        Args:
            decision_data: Decision data including recommendations and conflicts

        Returns:
            Submission response with decision ID
        """
        try:
            response = await self.client.post(
                "/api/v1/agents/decision-submit",
                json=decision_data,
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Failed to submit decision: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Error submitting decision: {str(e)}")
            raise

    async def get_all_trains(self) -> List[Dict[str, Any]]:
        """
        Get list of all trains from backend.

        Returns:
            List of train data
        """
        try:
            # This endpoint may need to be implemented in backend
            # For now, we'll use a placeholder approach
            response = await self.client.get("/api/v1/dashboard/induction-list")
            response.raise_for_status()
            data = response.json()
            # Extract train list from response
            return data.get("trains", [])
        except Exception as e:
            logger.error(f"Error getting all trains: {str(e)}")
            # Return empty list as fallback
            return []

