"""LangChain tools for backend API interactions."""

from typing import List, Dict, Any, Optional
from langchain_core.tools import tool
from ..services.backend_client import BackendClient


class BackendTools:
    """Collection of tools for backend interactions."""

    def __init__(self, backend_client: BackendClient):
        """
        Initialize backend tools.

        Args:
            backend_client: Backend API client
        """
        self.backend_client = backend_client

    def get_tools(self) -> List:
        """Get all backend tools as LangChain tools."""
        return [
            self.query_fitness_certificates,
            self.query_job_cards,
            self.query_branding_contracts,
            self.query_mileage_data,
            self.query_cleaning_slots,
            self.query_stabling_geometry,
            self.get_train_status,
            self.submit_decision,
        ]

    @tool
    async def query_fitness_certificates(
        self, days_ahead: int = 30, train_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Query fitness certificates from backend.

        Args:
            days_ahead: Number of days ahead to check for expiring certificates
            train_id: Optional specific train ID to query

        Returns:
            List of fitness certificate records
        """
        try:
            data = await self.backend_client.query_backend(
                "fitness_certificate",
                "get_all_expiring_certificates",
                {"daysAhead": days_ahead},
            )
            if train_id:
                return [c for c in data if c.get("trainId") == train_id]
            return data
        except Exception as e:
            return [{"error": str(e)}]

    @tool
    async def query_job_cards(
        self, priority: Optional[str] = None, train_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Query job cards from backend.

        Args:
            priority: Optional priority filter (critical, high, medium, low)
            train_id: Optional specific train ID to query

        Returns:
            List of job card records
        """
        try:
            data = await self.backend_client.query_backend(
                "job_card",
                "get_open_job_cards",
                {"priority": priority} if priority else {},
            )
            if train_id:
                return [j for j in data if j.get("trainId") == train_id]
            return data
        except Exception as e:
            return [{"error": str(e)}]

    @tool
    async def query_branding_contracts(
        self, train_id: Optional[int] = None, status: str = "active"
    ) -> List[Dict[str, Any]]:
        """
        Query branding contracts from backend.

        Args:
            train_id: Optional specific train ID to query
            status: Contract status filter (default: active)

        Returns:
            List of branding contract records
        """
        try:
            data = await self.backend_client.query_backend(
                "branding",
                "get_active_contracts",
                {},
            )
            if train_id:
                return [c for c in data if c.get("trainId") == train_id]
            return data
        except Exception as e:
            return [{"error": str(e)}]

    @tool
    async def query_mileage_data(self, train_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Query mileage data from backend.

        Args:
            train_id: Optional specific train ID to query

        Returns:
            List of mileage records
        """
        try:
            if train_id:
                train_data = await self.backend_client.get_train_status(train_id)
                return train_data.get("mileageData", [])
            return []
        except Exception as e:
            return [{"error": str(e)}]

    @tool
    async def query_cleaning_slots(self, train_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Query cleaning slots from backend.

        Args:
            train_id: Optional specific train ID to query

        Returns:
            List of cleaning slot records
        """
        try:
            if train_id:
                train_data = await self.backend_client.get_train_status(train_id)
                return train_data.get("cleaningSlots", [])
            return []
        except Exception as e:
            return [{"error": str(e)}]

    @tool
    async def query_stabling_geometry(self, train_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Query stabling geometry from backend.

        Args:
            train_id: Optional specific train ID to query

        Returns:
            Stabling geometry data
        """
        try:
            if train_id:
                train_data = await self.backend_client.get_train_status(train_id)
                return train_data.get("stablingGeometry", {})
            return {}
        except Exception as e:
            return {"error": str(e)}

    @tool
    async def get_train_status(self, train_id: int) -> Dict[str, Any]:
        """
        Get comprehensive train status from backend.

        Args:
            train_id: Train ID

        Returns:
            Complete train status data
        """
        try:
            return await self.backend_client.get_train_status(train_id)
        except Exception as e:
            return {"error": str(e)}

    @tool
    async def submit_decision(
        self, decision_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Submit decision recommendation to backend.

        Args:
            decision_data: Decision data including recommendations

        Returns:
            Submission response
        """
        try:
            return await self.backend_client.submit_decision(decision_data)
        except Exception as e:
            return {"error": str(e)}

