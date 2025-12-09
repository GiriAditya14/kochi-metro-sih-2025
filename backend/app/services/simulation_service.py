"""
KMRL Train Simulation Service
Simulates passenger handling and energy optimization with Groq-powered reasoning.
"""

import json
import math
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

from sqlalchemy.orm import Session

# Groq
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

from ..config import get_groq_api_key, is_groq_enabled
from ..models import (
    Train, TrainStatus, NightPlan, PlanAssignment,
    BrandingContract, BrandingPriority, TimeBand,
    DepotTrack, TrainPosition
)


@dataclass
class StationData:
    """Station information for simulation"""
    name: str
    distance_km: float  # From Aluva
    avg_boarding: int   # Average passengers boarding
    avg_alighting: int  # Average passengers alighting
    peak_multiplier: float  # Peak hour multiplier


# KMRL Station data (realistic approximations)
KMRL_STATIONS = [
    StationData("Aluva", 0.0, 800, 100, 1.8),
    StationData("Pulinchodu", 1.2, 300, 150, 1.5),
    StationData("Companypadi", 2.5, 400, 200, 1.6),
    StationData("Ambattukavu", 3.8, 350, 180, 1.5),
    StationData("Muttom", 5.0, 200, 150, 1.3),
    StationData("Kalamassery", 6.5, 600, 400, 1.7),
    StationData("CUSAT", 7.8, 500, 350, 1.6),
    StationData("Pathadipalam", 9.0, 300, 250, 1.4),
    StationData("Edapally", 10.5, 700, 500, 1.8),
    StationData("Changampuzha Park", 11.8, 400, 350, 1.5),
    StationData("Palarivattom", 13.0, 550, 450, 1.6),
    StationData("JLN Stadium", 14.2, 300, 280, 1.4),
    StationData("Kaloor", 15.5, 600, 500, 1.7),
    StationData("Town Hall", 16.8, 450, 400, 1.5),
    StationData("MG Road", 18.0, 800, 700, 1.9),
    StationData("Maharaja's College", 19.2, 500, 450, 1.6),
    StationData("Ernakulam South", 20.5, 400, 380, 1.5),
    StationData("Kadavanthra", 21.8, 350, 320, 1.4),
    StationData("Elamkulam", 23.0, 400, 350, 1.5),
    StationData("Vyttila", 24.5, 600, 500, 1.7),
    StationData("Thaikoodam", 25.8, 450, 400, 1.5),
    StationData("Pettah", 27.0, 500, 450, 1.6),
    StationData("Vadakkekotta", 28.2, 300, 280, 1.4),
    StationData("SN Junction", 29.5, 350, 320, 1.5),
    StationData("Thripunithura", 31.0, 200, 600, 1.6),
]


class SimulationService:
    """
    Advanced simulation service for KMRL operations.
    Handles passenger flow, energy optimization, and AI-powered reasoning.
    """
    
    # KMRL Train Specifications (Alstom Metropolis)
    TRAIN_CAPACITY = 975  # passengers per 3-car train
    CRUSH_CAPACITY = 1200  # maximum with crowding
    SEATED_CAPACITY = 136  # seated passengers
    
    # Energy parameters (kWh)
    BASE_ENERGY_PER_KM = 3.5  # Base energy consumption
    ACCELERATION_ENERGY = 0.8  # Extra energy for acceleration
    REGEN_EFFICIENCY = 0.35  # Regenerative braking efficiency
    HVAC_ENERGY_PER_HOUR = 25  # HVAC energy per hour
    
    # Operational parameters
    MAX_SPEED_KMH = 80
    AVG_SPEED_KMH = 33
    DWELL_TIME_SECONDS = 25
    
    def __init__(self, db: Session):
        self.db = db
        self.groq_client = None
        self.stations = KMRL_STATIONS
        
        # Initialize Groq
        if GROQ_AVAILABLE and is_groq_enabled():
            api_key = get_groq_api_key()
            if api_key:
                try:
                    self.groq_client = Groq(api_key=api_key)
                    print("✓ Groq initialized for simulation reasoning")
                except Exception as e:
                    print(f"✗ Groq init failed: {e}")
    
    async def run_passenger_simulation(self, params: Dict) -> Dict:
        """
        Run passenger handling simulation with AI reasoning.
        
        Args:
            params: {
                "time_of_day": "peak_morning" | "peak_evening" | "off_peak" | "late_night",
                "special_event": Optional[str],  # e.g., "football_match", "festival"
                "event_station": Optional[str],  # Station affected by event
                "expected_crowd_multiplier": float,  # 1.0 = normal, 2.0 = double
                "trains_available": int,
                "simulation_duration_minutes": int
            }
        
        Returns:
            Simulation results with AI reasoning
        """
        # Extract parameters
        time_of_day = params.get("time_of_day", "off_peak")
        special_event = params.get("special_event")
        event_station = params.get("event_station")
        crowd_multiplier = params.get("expected_crowd_multiplier", 1.0)
        trains_available = params.get("trains_available", 18)
        duration_minutes = params.get("simulation_duration_minutes", 60)
        
        # Get time-based multiplier
        time_multiplier = self._get_time_multiplier(time_of_day)
        
        # Simulate passenger flow
        simulation_result = self._simulate_passenger_flow(
            time_multiplier=time_multiplier,
            crowd_multiplier=crowd_multiplier,
            special_event=special_event,
            event_station=event_station,
            trains_available=trains_available,
            duration_minutes=duration_minutes
        )
        
        # Get AI reasoning
        reasoning = await self._get_passenger_reasoning(params, simulation_result)
        
        return {
            "simulation_type": "passenger_handling",
            "parameters": params,
            "results": simulation_result,
            "ai_reasoning": reasoning,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def run_energy_simulation(self, params: Dict) -> Dict:
        """
        Run energy optimization simulation with AI reasoning.
        
        Args:
            params: {
                "trains_in_service": int,
                "operating_hours": float,
                "passenger_load_percent": float,  # 0-100
                "hvac_mode": "full" | "eco" | "off",
                "regen_braking": bool,
                "coasting_optimization": bool,
                "speed_profile": "normal" | "eco" | "express"
            }
        
        Returns:
            Energy simulation results with optimization recommendations
        """
        # Extract parameters
        trains = params.get("trains_in_service", 18)
        hours = params.get("operating_hours", 16)  # KMRL operates ~16 hours
        load_percent = params.get("passenger_load_percent", 60)
        hvac_mode = params.get("hvac_mode", "full")
        regen_braking = params.get("regen_braking", True)
        coasting = params.get("coasting_optimization", False)
        speed_profile = params.get("speed_profile", "normal")
        
        # Calculate energy consumption
        energy_result = self._calculate_energy_consumption(
            trains=trains,
            hours=hours,
            load_percent=load_percent,
            hvac_mode=hvac_mode,
            regen_braking=regen_braking,
            coasting=coasting,
            speed_profile=speed_profile
        )
        
        # Get AI reasoning for optimization
        reasoning = await self._get_energy_reasoning(params, energy_result)
        
        return {
            "simulation_type": "energy_optimization",
            "parameters": params,
            "results": energy_result,
            "ai_reasoning": reasoning,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def run_combined_simulation(self, params: Dict) -> Dict:
        """
        Run combined passenger + energy simulation for holistic optimization.
        """
        # Run both simulations
        passenger_params = {
            "time_of_day": params.get("time_of_day", "off_peak"),
            "special_event": params.get("special_event"),
            "event_station": params.get("event_station"),
            "expected_crowd_multiplier": params.get("expected_crowd_multiplier", 1.0),
            "trains_available": params.get("trains_in_service", 18),
            "simulation_duration_minutes": int(params.get("operating_hours", 1) * 60)
        }
        
        energy_params = {
            "trains_in_service": params.get("trains_in_service", 18),
            "operating_hours": params.get("operating_hours", 1),
            "passenger_load_percent": params.get("passenger_load_percent", 60),
            "hvac_mode": params.get("hvac_mode", "full"),
            "regen_braking": params.get("regen_braking", True),
            "coasting_optimization": params.get("coasting_optimization", False),
            "speed_profile": params.get("speed_profile", "normal")
        }
        
        # Simulate
        passenger_sim = self._simulate_passenger_flow(
            time_multiplier=self._get_time_multiplier(passenger_params["time_of_day"]),
            crowd_multiplier=passenger_params["expected_crowd_multiplier"],
            special_event=passenger_params["special_event"],
            event_station=passenger_params["event_station"],
            trains_available=passenger_params["trains_available"],
            duration_minutes=passenger_params["simulation_duration_minutes"]
        )
        
        energy_sim = self._calculate_energy_consumption(**{
            "trains": energy_params["trains_in_service"],
            "hours": energy_params["operating_hours"],
            "load_percent": energy_params["passenger_load_percent"],
            "hvac_mode": energy_params["hvac_mode"],
            "regen_braking": energy_params["regen_braking"],
            "coasting": energy_params["coasting_optimization"],
            "speed_profile": energy_params["speed_profile"]
        })
        
        # Get combined AI reasoning
        reasoning = await self._get_combined_reasoning(params, passenger_sim, energy_sim)
        
        return {
            "simulation_type": "combined_optimization",
            "parameters": params,
            "passenger_results": passenger_sim,
            "energy_results": energy_sim,
            "ai_reasoning": reasoning,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def _get_time_multiplier(self, time_of_day: str) -> float:
        """Get passenger multiplier based on time of day"""
        multipliers = {
            "peak_morning": 1.8,   # 7:30 AM - 10:00 AM
            "peak_evening": 2.0,   # 5:00 PM - 8:00 PM
            "off_peak": 1.0,       # Normal hours
            "late_night": 0.4,     # After 9 PM
            "early_morning": 0.6,  # 6 AM - 7:30 AM
        }
        return multipliers.get(time_of_day, 1.0)
    
    def _simulate_passenger_flow(self, time_multiplier: float, crowd_multiplier: float,
                                  special_event: Optional[str], event_station: Optional[str],
                                  trains_available: int, duration_minutes: int) -> Dict:
        """Simulate passenger flow through the system"""
        
        # Calculate headway
        total_journey_time_minutes = 60  # Aluva to Thripunithura
        headway_minutes = max(4, (total_journey_time_minutes * 2) / trains_available)
        trains_per_hour = 60 / headway_minutes
        
        # Simulate each station
        station_stats = []
        total_passengers = 0
        overcrowded_instances = 0
        max_load_percent = 0
        critical_stations = []
        
        for station in self.stations:
            # Calculate station demand
            base_demand = station.avg_boarding * time_multiplier * crowd_multiplier
            
            # Apply peak multiplier
            demand = base_demand * station.peak_multiplier
            
            # Special event handling
            if special_event and event_station and station.name == event_station:
                if special_event in ["football_match", "concert"]:
                    demand *= 3.0  # Triple demand
                elif special_event in ["festival", "strike"]:
                    demand *= 2.5
                else:
                    demand *= 2.0
            
            # Calculate per-train load
            passengers_per_train = demand / trains_per_hour
            load_percent = (passengers_per_train / self.TRAIN_CAPACITY) * 100
            
            # Track statistics
            total_passengers += demand * (duration_minutes / 60)
            max_load_percent = max(max_load_percent, load_percent)
            
            if load_percent > 100:
                overcrowded_instances += 1
                critical_stations.append({
                    "station": station.name,
                    "load_percent": round(load_percent, 1),
                    "excess_passengers": int(passengers_per_train - self.TRAIN_CAPACITY)
                })
            
            station_stats.append({
                "station": station.name,
                "distance_km": station.distance_km,
                "boarding_demand": int(demand),
                "passengers_per_train": int(passengers_per_train),
                "load_percent": round(load_percent, 1),
                "is_overcrowded": load_percent > 100,
                "waiting_time_minutes": round(headway_minutes / 2, 1)
            })
        
        # Calculate recommendations
        recommended_trains = self._calculate_recommended_trains(max_load_percent, trains_available)
        
        return {
            "summary": {
                "total_passengers_served": int(total_passengers),
                "trains_deployed": trains_available,
                "headway_minutes": round(headway_minutes, 1),
                "trains_per_hour_per_direction": round(trains_per_hour, 1),
                "max_load_percent": round(max_load_percent, 1),
                "overcrowded_instances": overcrowded_instances,
                "service_quality": self._get_service_quality(max_load_percent)
            },
            "station_analysis": station_stats,
            "critical_stations": critical_stations,
            "recommendations": {
                "recommended_trains": recommended_trains,
                "additional_trains_needed": max(0, recommended_trains - trains_available),
                "suggested_headway": round(60 / (recommended_trains / 2), 1) if recommended_trains > 0 else 0
            }
        }
    
    def _calculate_recommended_trains(self, max_load: float, current_trains: int) -> int:
        """Calculate recommended number of trains based on load"""
        if max_load <= 80:
            return current_trains
        elif max_load <= 100:
            return current_trains + 2
        elif max_load <= 120:
            return current_trains + 4
        else:
            return min(25, int(current_trains * (max_load / 80)))
    
    def _get_service_quality(self, load_percent: float) -> str:
        """Get service quality rating based on load"""
        if load_percent <= 60:
            return "Excellent"
        elif load_percent <= 80:
            return "Good"
        elif load_percent <= 100:
            return "Acceptable"
        elif load_percent <= 120:
            return "Crowded"
        else:
            return "Critical"
    
    def _calculate_energy_consumption(self, trains: int, hours: float, load_percent: float,
                                       hvac_mode: str, regen_braking: bool, coasting: bool,
                                       speed_profile: str) -> Dict:
        """Calculate detailed energy consumption"""
        
        # Route parameters
        route_length_km = 31.0  # Aluva to Thripunithura
        trips_per_train = (hours * 60) / 60  # One round trip = ~60 min
        total_km = trains * trips_per_train * route_length_km * 2  # Both directions
        
        # Base traction energy
        base_traction = total_km * self.BASE_ENERGY_PER_KM
        
        # Acceleration energy (25 stops per direction)
        stops = 25 * trips_per_train * trains * 2
        acceleration_energy = stops * self.ACCELERATION_ENERGY
        
        # Load factor adjustment (heavier = more energy)
        load_factor = 1 + (load_percent / 100) * 0.3
        
        # Speed profile adjustment
        speed_factors = {
            "normal": 1.0,
            "eco": 0.85,
            "express": 1.15
        }
        speed_factor = speed_factors.get(speed_profile, 1.0)
        
        # Coasting optimization
        coasting_savings = 0.12 if coasting else 0
        
        # Calculate traction energy
        traction_energy = (base_traction + acceleration_energy) * load_factor * speed_factor * (1 - coasting_savings)
        
        # Regenerative braking savings
        regen_savings = 0
        if regen_braking:
            braking_energy = acceleration_energy * 0.8  # 80% of accel energy recoverable
            regen_savings = braking_energy * self.REGEN_EFFICIENCY
        
        # HVAC energy
        hvac_factors = {"full": 1.0, "eco": 0.7, "off": 0}
        hvac_energy = trains * hours * self.HVAC_ENERGY_PER_HOUR * hvac_factors.get(hvac_mode, 1.0)
        
        # Auxiliary systems (lighting, doors, PIS, etc.)
        auxiliary_energy = trains * hours * 8  # ~8 kWh per train per hour
        
        # Total energy
        total_energy = traction_energy - regen_savings + hvac_energy + auxiliary_energy
        
        # Calculate costs (Kerala electricity rates)
        energy_rate = 7.5  # INR per kWh (approximate industrial rate)
        total_cost = total_energy * energy_rate
        
        # Calculate potential savings
        optimized_energy = self._calculate_optimized_energy(
            trains, hours, load_percent, traction_energy, hvac_energy, auxiliary_energy
        )
        potential_savings = total_energy - optimized_energy["total"]
        
        return {
            "summary": {
                "total_energy_kwh": round(total_energy, 1),
                "total_cost_inr": round(total_cost, 2),
                "energy_per_km": round(total_energy / total_km, 2),
                "energy_per_passenger_km": round(total_energy / (total_km * load_percent * self.TRAIN_CAPACITY / 100), 4),
                "carbon_footprint_kg": round(total_energy * 0.82, 1),  # Kerala grid emission factor
            },
            "breakdown": {
                "traction_energy_kwh": round(traction_energy, 1),
                "regen_savings_kwh": round(regen_savings, 1),
                "hvac_energy_kwh": round(hvac_energy, 1),
                "auxiliary_energy_kwh": round(auxiliary_energy, 1),
            },
            "efficiency_metrics": {
                "regen_efficiency_percent": round((regen_savings / (traction_energy + hvac_energy + auxiliary_energy)) * 100, 1),
                "hvac_share_percent": round((hvac_energy / total_energy) * 100, 1),
                "traction_share_percent": round((traction_energy / total_energy) * 100, 1),
            },
            "optimization_potential": {
                "optimized_total_kwh": round(optimized_energy["total"], 1),
                "potential_savings_kwh": round(potential_savings, 1),
                "potential_savings_inr": round(potential_savings * energy_rate, 2),
                "potential_savings_percent": round((potential_savings / total_energy) * 100, 1),
                "recommendations": optimized_energy["recommendations"]
            }
        }
    
    def _calculate_optimized_energy(self, trains: int, hours: float, load_percent: float,
                                     current_traction: float, current_hvac: float, 
                                     current_auxiliary: float) -> Dict:
        """Calculate optimized energy consumption with all optimizations"""
        
        # Apply all optimizations
        optimized_traction = current_traction * 0.85 * (1 - 0.12)  # Eco mode + coasting
        optimized_traction -= current_traction * 0.35 * 0.8  # Max regen
        optimized_hvac = current_hvac * 0.7  # Eco HVAC
        optimized_auxiliary = current_auxiliary * 0.9  # LED lighting, efficient systems
        
        recommendations = []
        
        if current_traction > optimized_traction * 1.1:
            recommendations.append({
                "category": "Traction",
                "action": "Enable coasting optimization and eco speed profile",
                "savings_kwh": round(current_traction - optimized_traction * 1.1, 1)
            })
        
        if current_hvac > optimized_hvac * 1.2:
            recommendations.append({
                "category": "HVAC",
                "action": "Switch to ECO mode during off-peak hours",
                "savings_kwh": round(current_hvac - optimized_hvac, 1)
            })
        
        recommendations.append({
            "category": "Regenerative Braking",
            "action": "Ensure regen braking is enabled on all trains",
            "savings_kwh": round(current_traction * 0.35 * 0.8, 1)
        })
        
        return {
            "total": optimized_traction + optimized_hvac + optimized_auxiliary,
            "recommendations": recommendations
        }
    
    async def _get_passenger_reasoning(self, params: Dict, results: Dict) -> Dict:
        """Get AI reasoning for passenger simulation"""
        if not self.groq_client:
            return self._get_fallback_passenger_reasoning(params, results)
        
        prompt = f"""You are an expert transit operations analyst for Kochi Metro Rail Limited (KMRL).
Analyze this passenger simulation and provide detailed reasoning.

SIMULATION PARAMETERS:
- Time of Day: {params.get('time_of_day', 'off_peak')}
- Special Event: {params.get('special_event', 'None')}
- Event Station: {params.get('event_station', 'N/A')}
- Crowd Multiplier: {params.get('expected_crowd_multiplier', 1.0)}x
- Trains Available: {params.get('trains_available', 18)}
- Duration: {params.get('simulation_duration_minutes', 60)} minutes

SIMULATION RESULTS:
- Total Passengers: {results['summary']['total_passengers_served']:,}
- Max Load: {results['summary']['max_load_percent']}%
- Service Quality: {results['summary']['service_quality']}
- Overcrowded Instances: {results['summary']['overcrowded_instances']}
- Critical Stations: {json.dumps(results['critical_stations'][:3], indent=2) if results['critical_stations'] else 'None'}

RECOMMENDATIONS:
- Recommended Trains: {results['recommendations']['recommended_trains']}
- Additional Trains Needed: {results['recommendations']['additional_trains_needed']}

Provide a structured analysis with:
1. SITUATION ASSESSMENT (2-3 sentences analyzing current state)
2. RISK ANALYSIS (identify passenger safety and service risks)
3. IMMEDIATE ACTIONS (what to do right now)
4. CONTINGENCY MEASURES (backup plans if situation worsens)
5. LONG-TERM RECOMMENDATIONS (for future planning)

Be specific to KMRL operations and Kerala context. Use bullet points."""

        try:
            response = self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are an expert metro rail operations analyst specializing in crowd management and passenger safety."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1500
            )
            
            reasoning_text = response.choices[0].message.content
            
            return {
                "status": "success",
                "model": "llama-3.3-70b-versatile",
                "reasoning": reasoning_text,
                "generated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Groq reasoning failed: {e}")
            return self._get_fallback_passenger_reasoning(params, results)
    
    async def _get_energy_reasoning(self, params: Dict, results: Dict) -> Dict:
        """Get AI reasoning for energy simulation"""
        if not self.groq_client:
            return self._get_fallback_energy_reasoning(params, results)
        
        prompt = f"""You are an expert in metro rail energy optimization and sustainability for KMRL.
Analyze this energy simulation and provide optimization recommendations.

SIMULATION PARAMETERS:
- Trains in Service: {params.get('trains_in_service', 18)}
- Operating Hours: {params.get('operating_hours', 16)}
- Passenger Load: {params.get('passenger_load_percent', 60)}%
- HVAC Mode: {params.get('hvac_mode', 'full')}
- Regenerative Braking: {'Enabled' if params.get('regen_braking', True) else 'Disabled'}
- Coasting Optimization: {'Enabled' if params.get('coasting_optimization', False) else 'Disabled'}
- Speed Profile: {params.get('speed_profile', 'normal')}

ENERGY RESULTS:
- Total Energy: {results['summary']['total_energy_kwh']:,} kWh
- Total Cost: ₹{results['summary']['total_cost_inr']:,}
- Energy per km: {results['summary']['energy_per_km']} kWh/km
- Carbon Footprint: {results['summary']['carbon_footprint_kg']} kg CO2

BREAKDOWN:
- Traction: {results['breakdown']['traction_energy_kwh']} kWh
- Regen Savings: {results['breakdown']['regen_savings_kwh']} kWh
- HVAC: {results['breakdown']['hvac_energy_kwh']} kWh

OPTIMIZATION POTENTIAL:
- Potential Savings: {results['optimization_potential']['potential_savings_kwh']} kWh ({results['optimization_potential']['potential_savings_percent']}%)
- Cost Savings: ₹{results['optimization_potential']['potential_savings_inr']}

Provide a structured analysis with:
1. CURRENT EFFICIENCY ASSESSMENT (grade the current operations A-F)
2. QUICK WINS (immediate actions with highest impact)
3. TECHNICAL OPTIMIZATIONS (detailed technical recommendations)
4. COST-BENEFIT ANALYSIS (ROI for suggested changes)
5. SUSTAINABILITY IMPACT (environmental benefits)
6. IMPLEMENTATION PRIORITY (ranked list of actions)

Focus on practical, implementable recommendations for KMRL. Include specific numbers."""

        try:
            response = self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are an expert in metro rail energy efficiency and sustainable transportation systems."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1500
            )
            
            reasoning_text = response.choices[0].message.content
            
            return {
                "status": "success",
                "model": "llama-3.3-70b-versatile",
                "reasoning": reasoning_text,
                "generated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Groq reasoning failed: {e}")
            return self._get_fallback_energy_reasoning(params, results)
    
    async def _get_combined_reasoning(self, params: Dict, passenger_results: Dict, energy_results: Dict) -> Dict:
        """Get AI reasoning for combined simulation"""
        if not self.groq_client:
            return self._get_fallback_combined_reasoning(params, passenger_results, energy_results)
        
        prompt = f"""You are a senior operations strategist for KMRL analyzing combined passenger and energy data.
Provide holistic optimization recommendations balancing service quality and energy efficiency.

SCENARIO:
- Time: {params.get('time_of_day', 'off_peak')}
- Event: {params.get('special_event', 'None')}
- Trains: {params.get('trains_in_service', 18)}

PASSENGER METRICS:
- Total Passengers: {passenger_results['summary']['total_passengers_served']:,}
- Max Load: {passenger_results['summary']['max_load_percent']}%
- Service Quality: {passenger_results['summary']['service_quality']}
- Critical Stations: {len(passenger_results['critical_stations'])}

ENERGY METRICS:
- Total Energy: {energy_results['summary']['total_energy_kwh']:,} kWh
- Cost: ₹{energy_results['summary']['total_cost_inr']:,}
- Potential Savings: {energy_results['optimization_potential']['potential_savings_percent']}%

Provide a BALANCED STRATEGY with:
1. EXECUTIVE SUMMARY (3 sentences - key findings)
2. SERVICE vs EFFICIENCY TRADE-OFFS (where to prioritize what)
3. OPTIMAL CONFIGURATION (recommended settings for this scenario)
4. DYNAMIC ADJUSTMENTS (how to adapt during operations)
5. KPIs TO MONITOR (what metrics to track)
6. COST-SERVICE OPTIMIZATION (how to reduce costs without impacting service)

Be specific with numbers and actionable recommendations."""

        try:
            response = self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are a senior metro rail operations strategist focusing on balancing passenger service with operational efficiency."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1800
            )
            
            reasoning_text = response.choices[0].message.content
            
            return {
                "status": "success",
                "model": "llama-3.3-70b-versatile",
                "reasoning": reasoning_text,
                "generated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Groq reasoning failed: {e}")
            return self._get_fallback_combined_reasoning(params, passenger_results, energy_results)
    
    def _get_fallback_passenger_reasoning(self, params: Dict, results: Dict) -> Dict:
        """Fallback reasoning when Groq is unavailable"""
        quality = results['summary']['service_quality']
        max_load = results['summary']['max_load_percent']
        
        reasoning = f"""## Passenger Handling Analysis

### Situation Assessment
The current simulation shows a **{quality}** service quality with maximum load of {max_load}%. 
{'The system is operating within comfortable parameters.' if max_load <= 80 else 'The system is experiencing high passenger loads requiring attention.'}

### Risk Analysis
- {'✅ Passenger comfort is maintained' if max_load <= 80 else '⚠️ Passenger comfort may be compromised'}
- {'✅ Safety margins adequate' if max_load <= 100 else '🚨 Safety concerns due to overcrowding'}
- {'✅ Dwell times manageable' if max_load <= 90 else '⚠️ Extended dwell times expected'}

### Immediate Actions
{('- No immediate action required - continue monitoring' if max_load <= 80 else 
  '- Deploy ' + str(results['recommendations']['additional_trains_needed']) + ' additional trains' if results['recommendations']['additional_trains_needed'] > 0 else 
  '- Monitor critical stations closely')}
- Ensure crowd management staff at critical stations
- Activate platform announcements for crowd distribution

### Recommendations
- Recommended trains: {results['recommendations']['recommended_trains']}
- Target headway: {results['recommendations']['suggested_headway']} minutes
- Focus stations: {', '.join([s['station'] for s in results['critical_stations'][:3]]) if results['critical_stations'] else 'None critical'}
"""
        
        return {
            "status": "fallback",
            "model": "rule-based",
            "reasoning": reasoning,
            "generated_at": datetime.utcnow().isoformat()
        }
    
    def _get_fallback_energy_reasoning(self, params: Dict, results: Dict) -> Dict:
        """Fallback reasoning when Groq is unavailable"""
        savings_percent = results['optimization_potential']['potential_savings_percent']
        
        reasoning = f"""## Energy Optimization Analysis

### Current Efficiency Assessment
Grade: **{'A' if savings_percent < 5 else 'B' if savings_percent < 15 else 'C' if savings_percent < 25 else 'D'}**

Current operations consume {results['summary']['total_energy_kwh']:,} kWh with potential for {savings_percent}% improvement.

### Quick Wins
1. {'✅ Regenerative braking active' if params.get('regen_braking', True) else '🔧 Enable regenerative braking - Save ' + str(int(results['breakdown']['traction_energy_kwh'] * 0.28)) + ' kWh'}
2. {'✅ Coasting optimization active' if params.get('coasting_optimization', False) else '🔧 Enable coasting optimization - Save 12% traction energy'}
3. {'✅ HVAC in eco mode' if params.get('hvac_mode') == 'eco' else '🔧 Switch HVAC to ECO mode during off-peak - Save 30% HVAC energy'}

### Cost-Benefit Summary
- Current daily cost: ₹{results['summary']['total_cost_inr']:,}
- Potential savings: ₹{results['optimization_potential']['potential_savings_inr']:,}/day
- Annual savings potential: ₹{results['optimization_potential']['potential_savings_inr'] * 365:,.0f}

### Environmental Impact
- Current carbon footprint: {results['summary']['carbon_footprint_kg']} kg CO2
- Reduction potential: {results['summary']['carbon_footprint_kg'] * savings_percent / 100:.0f} kg CO2

### Implementation Priority
1. Enable all regenerative braking systems
2. Implement coasting optimization
3. HVAC scheduling based on occupancy
4. Driver training for eco-driving
"""
        
        return {
            "status": "fallback",
            "model": "rule-based",
            "reasoning": reasoning,
            "generated_at": datetime.utcnow().isoformat()
        }
    
    def _get_fallback_combined_reasoning(self, params: Dict, passenger: Dict, energy: Dict) -> Dict:
        """Fallback combined reasoning"""
        reasoning = f"""## Combined Operations Analysis

### Executive Summary
Operating with {params.get('trains_in_service', 18)} trains, serving {passenger['summary']['total_passengers_served']:,} passengers 
while consuming {energy['summary']['total_energy_kwh']:,} kWh. Service quality is **{passenger['summary']['service_quality']}** 
with {energy['optimization_potential']['potential_savings_percent']}% energy optimization potential.

### Trade-off Analysis
| Factor | Current | Optimal |
|--------|---------|---------|
| Service Quality | {passenger['summary']['service_quality']} | Good or better |
| Max Load | {passenger['summary']['max_load_percent']}% | <80% |
| Energy/passenger | {energy['summary']['energy_per_passenger_km']:.4f} kWh/p-km | <0.05 kWh/p-km |

### Optimal Configuration
- Trains: {passenger['recommendations']['recommended_trains']}
- HVAC: ECO mode during off-peak
- Speed: Normal during peak, ECO during off-peak
- Regen: Always enabled

### KPIs to Monitor
1. Passenger load factor (target: 60-80%)
2. Energy per passenger-km (target: <0.05 kWh)
3. On-time performance (target: >95%)
4. Carbon intensity (target: <50g CO2/p-km)
"""
        
        return {
            "status": "fallback",
            "model": "rule-based",
            "reasoning": reasoning,
            "generated_at": datetime.utcnow().isoformat()
        }
    
    def get_station_list(self) -> List[Dict]:
        """Get list of all stations"""
        return [
            {
                "name": s.name,
                "distance_km": s.distance_km,
                "avg_daily_boarding": s.avg_boarding * 16,  # 16 operating hours
                "peak_multiplier": s.peak_multiplier
            }
            for s in self.stations
        ]

    # =====================================================
    # ADVERTISING PENALTY SIMULATION
    # =====================================================
    
    async def run_advertising_simulation(self, params: Dict) -> Dict:
        """
        Simulate advertising/branding penalty scenarios.
        
        Args:
            params: {
                "simulation_days": int,  # Days to simulate
                "trains_in_service": int,  # Trains deployed daily
                "service_hours_per_day": float,  # Operating hours
                "peak_hour_percentage": float,  # % of hours in peak (0-100)
                "include_specific_contracts": Optional[List[int]],  # Contract IDs
                "scenario": "normal" | "reduced_service" | "festival_boost"
            }
        
        Returns:
            Penalty/bonus simulation with AI reasoning
        """
        # Extract parameters
        sim_days = params.get("simulation_days", 7)
        trains_deployed = params.get("trains_in_service", 18)
        service_hours = params.get("service_hours_per_day", 16)
        peak_pct = params.get("peak_hour_percentage", 35)
        contract_ids = params.get("include_specific_contracts")
        scenario = params.get("scenario", "normal")
        
        # Get contracts from DB
        query = self.db.query(BrandingContract).filter(
            BrandingContract.campaign_end > datetime.utcnow()
        )
        if contract_ids:
            query = query.filter(BrandingContract.id.in_(contract_ids))
        
        contracts = query.all()
        
        if not contracts:
            return {
                "simulation_type": "advertising_penalty",
                "error": "No active branding contracts found",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        # Run simulation
        result = self._simulate_advertising_exposure(
            contracts=contracts,
            sim_days=sim_days,
            trains_deployed=trains_deployed,
            service_hours=service_hours,
            peak_pct=peak_pct,
            scenario=scenario
        )
        
        # Get AI reasoning
        reasoning = await self._get_advertising_reasoning(params, result)
        
        return {
            "simulation_type": "advertising_penalty",
            "parameters": params,
            "results": result,
            "ai_reasoning": reasoning,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def _simulate_advertising_exposure(self, contracts: List, sim_days: int,
                                        trains_deployed: int, service_hours: float,
                                        peak_pct: float, scenario: str) -> Dict:
        """Simulate advertising exposure and calculate penalties"""
        
        # Scenario modifiers
        scenario_modifiers = {
            "normal": {"exposure": 1.0, "peak_multiplier": 1.0},
            "reduced_service": {"exposure": 0.7, "peak_multiplier": 0.8},
            "festival_boost": {"exposure": 1.3, "peak_multiplier": 1.5},
            "maintenance_disruption": {"exposure": 0.5, "peak_multiplier": 0.6}
        }
        modifier = scenario_modifiers.get(scenario, scenario_modifiers["normal"])
        
        # Calculate daily exposure per train
        peak_hours = service_hours * (peak_pct / 100)
        off_peak_hours = service_hours - peak_hours
        
        contract_results = []
        total_penalties = 0
        total_bonuses = 0
        high_risk_contracts = []
        
        for contract in contracts:
            # Calculate expected exposure based on train deployment
            # Trains rotate through service - exposure based on how often this train runs
            total_trains = 25  # Total fleet
            daily_exposure = (trains_deployed / total_trains) * service_hours * modifier["exposure"]
            
            # Peak time matching
            if contract.required_time_band == TimeBand.PEAK_ONLY:
                effective_exposure = daily_exposure * (peak_hours / service_hours) * modifier["peak_multiplier"]
            elif contract.required_time_band == TimeBand.OFF_PEAK:
                effective_exposure = daily_exposure * (off_peak_hours / service_hours)
            else:
                effective_exposure = daily_exposure
            
            # Priority bonuses
            priority_bonus = {
                BrandingPriority.PLATINUM: 1.2,
                BrandingPriority.GOLD: 1.1,
                BrandingPriority.SILVER: 1.0,
                BrandingPriority.BRONZE: 0.9
            }
            effective_exposure *= priority_bonus.get(contract.priority, 1.0)
            
            # Calculate weekly exposure
            weekly_exposure = effective_exposure * min(sim_days, 7)
            monthly_exposure = effective_exposure * sim_days
            
            # Calculate deficit/surplus
            weekly_deficit = max(0, contract.target_exposure_hours_weekly - weekly_exposure)
            weekly_surplus = max(0, weekly_exposure - contract.target_exposure_hours_weekly)
            
            # Calculate penalty/bonus
            penalty = weekly_deficit * contract.penalty_per_hour_shortfall
            bonus = weekly_surplus * contract.bonus_per_hour_excess
            
            total_penalties += penalty
            total_bonuses += bonus
            
            compliance_pct = min(100, (weekly_exposure / max(1, contract.target_exposure_hours_weekly)) * 100)
            
            # Risk assessment
            risk_level = "low"
            if compliance_pct < 70:
                risk_level = "critical"
                high_risk_contracts.append(contract.brand_name)
            elif compliance_pct < 85:
                risk_level = "high"
            elif compliance_pct < 95:
                risk_level = "medium"
            
            contract_results.append({
                "contract_id": contract.id,
                "brand_name": contract.brand_name,
                "priority": contract.priority.value,
                "time_band": contract.required_time_band.value,
                "target_weekly_hours": contract.target_exposure_hours_weekly,
                "projected_weekly_hours": round(weekly_exposure, 2),
                "weekly_deficit": round(weekly_deficit, 2),
                "weekly_surplus": round(weekly_surplus, 2),
                "compliance_percentage": round(compliance_pct, 1),
                "penalty_rate": contract.penalty_per_hour_shortfall,
                "bonus_rate": contract.bonus_per_hour_excess,
                "projected_penalty": round(penalty, 2),
                "projected_bonus": round(bonus, 2),
                "net_financial_impact": round(bonus - penalty, 2),
                "risk_level": risk_level
            })
        
        # Sort by risk
        contract_results.sort(key=lambda x: x["compliance_percentage"])
        
        # Summary
        avg_compliance = sum(c["compliance_percentage"] for c in contract_results) / len(contract_results)
        
        return {
            "summary": {
                "total_contracts": len(contracts),
                "simulation_period_days": sim_days,
                "average_compliance": round(avg_compliance, 1),
                "total_projected_penalties": round(total_penalties, 2),
                "total_projected_bonuses": round(total_bonuses, 2),
                "net_financial_impact": round(total_bonuses - total_penalties, 2),
                "high_risk_contracts": len(high_risk_contracts),
                "contracts_at_risk": high_risk_contracts
            },
            "contract_analysis": contract_results,
            "recommendations": self._generate_advertising_recommendations(contract_results, trains_deployed)
        }
    
    def _generate_advertising_recommendations(self, contracts: List[Dict], trains_deployed: int) -> Dict:
        """Generate recommendations for advertising compliance"""
        
        at_risk = [c for c in contracts if c["risk_level"] in ["critical", "high"]]
        
        recommendations = {
            "immediate_actions": [],
            "train_adjustments": [],
            "schedule_optimizations": []
        }
        
        if at_risk:
            # Trains needed to improve compliance
            avg_deficit = sum(c["weekly_deficit"] for c in at_risk) / len(at_risk)
            additional_trains = min(5, int(avg_deficit / 20) + 1)
            
            recommendations["immediate_actions"].append({
                "action": f"Deploy {additional_trains} additional trains to service",
                "impact": f"Could improve compliance by {min(25, additional_trains * 5)}%",
                "priority": "high"
            })
            
            # Check peak-only contracts
            peak_risk = [c for c in at_risk if c["time_band"] == "peak_only"]
            if peak_risk:
                recommendations["schedule_optimizations"].append({
                    "action": "Prioritize branded trains during peak hours",
                    "affected_brands": [c["brand_name"] for c in peak_risk],
                    "impact": "Maximize exposure during contracted time bands"
                })
        
        # General optimizations
        if trains_deployed < 18:
            recommendations["train_adjustments"].append({
                "action": "Increase service frequency",
                "current_trains": trains_deployed,
                "recommended_trains": 18,
                "expected_improvement": f"{((18 - trains_deployed) / trains_deployed) * 100:.0f}% exposure increase"
            })
        
        return recommendations
    
    async def _get_advertising_reasoning(self, params: Dict, results: Dict) -> Dict:
        """Get AI reasoning for advertising simulation"""
        if not self.groq_client:
            return self._get_fallback_advertising_reasoning(params, results)
        
        prompt = f"""You are a commercial operations expert for KMRL analyzing advertising contract compliance.

SIMULATION PARAMETERS:
- Simulation Period: {params.get('simulation_days', 7)} days
- Trains in Service: {params.get('trains_in_service', 18)}
- Service Hours/Day: {params.get('service_hours_per_day', 16)}
- Peak Hour %: {params.get('peak_hour_percentage', 35)}%
- Scenario: {params.get('scenario', 'normal')}

RESULTS SUMMARY:
- Total Contracts: {results['summary']['total_contracts']}
- Average Compliance: {results['summary']['average_compliance']}%
- Total Projected Penalties: ₹{results['summary']['total_projected_penalties']:,.2f}
- Total Projected Bonuses: ₹{results['summary']['total_projected_bonuses']:,.2f}
- Net Financial Impact: ₹{results['summary']['net_financial_impact']:,.2f}
- High Risk Contracts: {results['summary']['high_risk_contracts']}

AT-RISK CONTRACTS:
{json.dumps([c for c in results['contract_analysis'] if c['risk_level'] in ['critical', 'high']][:5], indent=2)}

Provide a comprehensive analysis with:
1. EXECUTIVE SUMMARY (financial impact and risk assessment in 2-3 sentences)
2. CONTRACT RISK ANALYSIS (which contracts need immediate attention)
3. REVENUE OPTIMIZATION (how to maximize bonuses and minimize penalties)
4. OPERATIONAL RECOMMENDATIONS (specific train deployment strategies)
5. COMPLIANCE ROADMAP (weekly targets to achieve full compliance)
6. FINANCIAL PROJECTIONS (best/worst case scenarios)

Be specific with INR amounts and train numbers."""

        try:
            response = self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are a commercial and operations expert specializing in metro advertising contracts and SLA compliance."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1500
            )
            
            return {
                "status": "success",
                "model": "llama-3.3-70b-versatile",
                "reasoning": response.choices[0].message.content,
                "generated_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            print(f"Groq advertising reasoning failed: {e}")
            return self._get_fallback_advertising_reasoning(params, results)
    
    def _get_fallback_advertising_reasoning(self, params: Dict, results: Dict) -> Dict:
        """Fallback reasoning for advertising simulation"""
        summary = results['summary']
        at_risk = [c for c in results['contract_analysis'] if c['risk_level'] in ['critical', 'high']]
        
        reasoning = f"""## Advertising Contract Compliance Analysis

### Executive Summary
Simulating {summary['total_contracts']} active branding contracts over {params.get('simulation_days', 7)} days. 
Average compliance projected at **{summary['average_compliance']:.1f}%** with net financial impact of 
**₹{summary['net_financial_impact']:,.2f}** ({'penalty' if summary['net_financial_impact'] < 0 else 'bonus'}).

### Financial Impact
| Metric | Amount |
|--------|--------|
| Total Penalties | ₹{summary['total_projected_penalties']:,.2f} |
| Total Bonuses | ₹{summary['total_projected_bonuses']:,.2f} |
| Net Impact | ₹{summary['net_financial_impact']:,.2f} |

### Contract Risk Analysis
- **High Risk Contracts**: {summary['high_risk_contracts']}
- **At-Risk Brands**: {', '.join(summary['contracts_at_risk']) if summary['contracts_at_risk'] else 'None'}

{'### Critical Actions Required' if at_risk else '### Status: All Contracts Healthy'}

{chr(10).join([f"- **{c['brand_name']}** ({c['priority']}): {c['compliance_percentage']:.1f}% compliance, ₹{c['projected_penalty']:,.2f} penalty risk" for c in at_risk[:5]]) if at_risk else '✅ All contracts meeting SLA targets'}

### Recommendations
1. {'Deploy additional trains during peak hours to boost exposure' if at_risk else 'Maintain current deployment levels'}
2. {'Prioritize branded trains in morning rotations' if any(c['time_band'] == 'peak_only' for c in at_risk) else 'Current scheduling is optimal'}
3. {'Consider route optimization for maximum brand visibility' if summary['average_compliance'] < 90 else 'Continue current operations'}

### Weekly Compliance Targets
- Week 1: Achieve {min(95, summary['average_compliance'] + 5):.0f}% compliance
- Week 2: Achieve {min(98, summary['average_compliance'] + 8):.0f}% compliance  
- Week 3+: Maintain 98%+ compliance
"""
        
        return {
            "status": "fallback",
            "model": "rule-based",
            "reasoning": reasoning,
            "generated_at": datetime.utcnow().isoformat()
        }

    # =====================================================
    # SHUNTING REARRANGEMENT SIMULATION
    # =====================================================
    
    async def run_shunting_simulation(self, params: Dict) -> Dict:
        """
        Simulate depot shunting rearrangement scenarios.
        
        Args:
            params: {
                "target_sequence": List[str],  # Desired train order for morning service
                "optimize_for": "time" | "energy" | "balanced",
                "available_shunters": int,  # Shunting locomotives available
                "time_window_minutes": int,  # Available time for rearrangement
                "prioritize_trains": Optional[List[str]],  # Train IDs to prioritize
            }
        
        Returns:
            Shunting plan with AI reasoning
        """
        # Get current depot state
        tracks = self.db.query(DepotTrack).filter(
            DepotTrack.depot_id == "MUTTOM",
            DepotTrack.is_operational == True
        ).all()
        
        positions = self.db.query(TrainPosition).all()
        trains = self.db.query(Train).filter(
            Train.status == TrainStatus.ACTIVE
        ).all()
        
        # Build depot state
        depot_state = self._build_depot_state(tracks, positions, trains)
        
        # Extract parameters
        target_sequence = params.get("target_sequence", [])
        optimize_for = params.get("optimize_for", "balanced")
        shunters = params.get("available_shunters", 2)
        time_window = params.get("time_window_minutes", 120)
        priority_trains = params.get("prioritize_trains", [])
        
        # If no target sequence, create optimal one based on service requirements
        if not target_sequence:
            target_sequence = self._generate_optimal_sequence(trains, priority_trains)
        
        # Run shunting simulation
        result = self._simulate_shunting(
            depot_state=depot_state,
            target_sequence=target_sequence,
            optimize_for=optimize_for,
            shunters=shunters,
            time_window=time_window,
            priority_trains=priority_trains
        )
        
        # Get AI reasoning
        reasoning = await self._get_shunting_reasoning(params, result)
        
        return {
            "simulation_type": "shunting_rearrangement",
            "parameters": params,
            "results": result,
            "ai_reasoning": reasoning,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def _build_depot_state(self, tracks: List, positions: List, trains: List) -> Dict:
        """Build current depot state representation"""
        
        train_map = {t.id: t for t in trains}
        
        depot_state = {
            "tracks": {},
            "train_positions": {},
            "exit_tracks": []
        }
        
        for track in tracks:
            depot_state["tracks"][track.track_id] = {
                "id": track.id,
                "name": track.track_name,
                "type": track.track_type,
                "capacity": track.capacity,
                "occupancy": track.current_occupancy,
                "is_direct_exit": track.is_direct_exit,
                "exit_distance": track.exit_distance,
                "trains": []
            }
            if track.is_direct_exit:
                depot_state["exit_tracks"].append(track.track_id)
        
        for pos in positions:
            train = train_map.get(pos.train_id)
            if train:
                track_id = None
                for t in tracks:
                    if t.id == pos.track_id:
                        track_id = t.track_id
                        break
                
                if track_id and track_id in depot_state["tracks"]:
                    depot_state["tracks"][track_id]["trains"].append({
                        "train_id": train.train_id,
                        "position": pos.position_in_track,
                        "is_locked": pos.is_locked
                    })
                    depot_state["train_positions"][train.train_id] = {
                        "track": track_id,
                        "position": pos.position_in_track,
                        "is_locked": pos.is_locked,
                        "shunting_cost": pos.calculate_shunting_cost()
                    }
        
        # Sort trains by position on each track
        for track in depot_state["tracks"].values():
            track["trains"].sort(key=lambda x: x["position"])
        
        return depot_state
    
    def _generate_optimal_sequence(self, trains: List, priority_trains: List[str]) -> List[str]:
        """Generate optimal departure sequence"""
        # Priority: 1) Explicitly prioritized, 2) Good health score, 3) Easy to extract
        
        train_scores = []
        for train in trains:
            score = 0
            
            # Priority boost
            if train.train_id in priority_trains:
                score += 1000
            
            # Health score
            score += train.overall_health_score * 5
            
            # Service readiness
            if train.is_service_ready:
                score += 200
            
            # Position penalty (higher position = harder to extract)
            score -= train.current_position * 10
            
            train_scores.append((train.train_id, score))
        
        # Sort by score (highest first) and take top 18 for service
        train_scores.sort(key=lambda x: x[1], reverse=True)
        return [t[0] for t in train_scores[:18]]
    
    def _simulate_shunting(self, depot_state: Dict, target_sequence: List[str],
                          optimize_for: str, shunters: int, time_window: int,
                          priority_trains: List[str]) -> Dict:
        """Simulate shunting operations"""
        
        # Time and energy per move (minutes and kWh)
        TIME_PER_MOVE = 5
        ENERGY_PER_MOVE = 15  # kWh for diesel shunter
        
        # Build move sequence
        moves = []
        total_moves = 0
        total_time = 0
        total_energy = 0
        
        trains_to_extract = target_sequence.copy()
        blocking_situations = []
        
        # Analyze each train in target sequence
        for idx, train_id in enumerate(trains_to_extract):
            if train_id not in depot_state["train_positions"]:
                continue
            
            pos = depot_state["train_positions"][train_id]
            track_id = pos["track"]
            train_position = pos["position"]
            
            # Check trains blocking this one
            blocking_trains = []
            if track_id in depot_state["tracks"]:
                track = depot_state["tracks"][track_id]
                for t in track["trains"]:
                    if t["position"] < train_position and t["train_id"] != train_id:
                        blocking_trains.append(t["train_id"])
            
            # Calculate moves needed
            moves_needed = len(blocking_trains) + 1  # +1 for actual extraction
            
            if blocking_trains:
                blocking_situations.append({
                    "target_train": train_id,
                    "blocked_by": blocking_trains,
                    "moves_required": moves_needed,
                    "track": track_id
                })
                
                # Generate moves for blocking trains
                for blocker in blocking_trains:
                    moves.append({
                        "step": len(moves) + 1,
                        "action": "move_to_temp",
                        "train": blocker,
                        "from_track": track_id,
                        "to_track": "TEMP_HOLD",
                        "reason": f"Clear path for {train_id}",
                        "time_minutes": TIME_PER_MOVE,
                        "energy_kwh": ENERGY_PER_MOVE
                    })
            
            # Extract target train
            moves.append({
                "step": len(moves) + 1,
                "action": "extract_to_mainline",
                "train": train_id,
                "from_track": track_id,
                "to_track": "MAINLINE",
                "reason": f"Service deployment (rank {idx + 1})",
                "time_minutes": TIME_PER_MOVE,
                "energy_kwh": ENERGY_PER_MOVE
            })
            
            # Return blocking trains
            for blocker in reversed(blocking_trains):
                moves.append({
                    "step": len(moves) + 1,
                    "action": "return_from_temp",
                    "train": blocker,
                    "from_track": "TEMP_HOLD",
                    "to_track": track_id,
                    "reason": "Return to original position",
                    "time_minutes": TIME_PER_MOVE,
                    "energy_kwh": ENERGY_PER_MOVE
                })
            
            total_moves += moves_needed + len(blocking_trains)
        
        # Calculate totals
        total_time = len(moves) * TIME_PER_MOVE
        total_energy = len(moves) * ENERGY_PER_MOVE
        
        # Parallelization with multiple shunters
        parallel_time = math.ceil(total_time / shunters)
        
        # Optimization adjustments
        if optimize_for == "time":
            efficiency_factor = 0.85  # More aggressive moves
        elif optimize_for == "energy":
            efficiency_factor = 1.15  # Slower, more efficient
        else:
            efficiency_factor = 1.0
        
        adjusted_time = parallel_time * efficiency_factor
        
        # Check feasibility
        is_feasible = adjusted_time <= time_window
        
        return {
            "summary": {
                "total_moves": len(moves),
                "total_time_minutes": round(total_time, 1),
                "parallel_time_minutes": round(parallel_time, 1),
                "adjusted_time_minutes": round(adjusted_time, 1),
                "total_energy_kwh": round(total_energy, 1),
                "energy_cost_inr": round(total_energy * 7.5, 2),
                "shunters_used": shunters,
                "is_feasible": is_feasible,
                "time_buffer_minutes": round(time_window - adjusted_time, 1) if is_feasible else 0
            },
            "blocking_analysis": {
                "total_blocking_situations": len(blocking_situations),
                "most_blocked_trains": sorted(blocking_situations, key=lambda x: x["moves_required"], reverse=True)[:5],
                "avg_blocking_factor": round(sum(b["moves_required"] for b in blocking_situations) / max(1, len(blocking_situations)), 1)
            },
            "move_sequence": moves[:30],  # Limit to first 30 moves for display
            "optimization_opportunities": self._identify_shunting_optimizations(blocking_situations, depot_state)
        }
    
    def _identify_shunting_optimizations(self, blocking: List[Dict], depot_state: Dict) -> List[Dict]:
        """Identify opportunities to optimize shunting"""
        
        optimizations = []
        
        # Find tracks with multiple blocking situations
        track_blocks = {}
        for b in blocking:
            track = b["track"]
            if track not in track_blocks:
                track_blocks[track] = 0
            track_blocks[track] += b["moves_required"]
        
        # Sort by blocking frequency
        sorted_tracks = sorted(track_blocks.items(), key=lambda x: x[1], reverse=True)
        
        for track, blocks in sorted_tracks[:3]:
            if blocks > 5:
                optimizations.append({
                    "type": "track_reorganization",
                    "track": track,
                    "current_blocking_moves": blocks,
                    "suggestion": f"Pre-position frequently used trains closer to exit on {track}",
                    "potential_savings": f"{int(blocks * 0.4)} moves"
                })
        
        # Direct exit track utilization
        exit_tracks = depot_state.get("exit_tracks", [])
        if exit_tracks:
            optimizations.append({
                "type": "exit_track_priority",
                "tracks": exit_tracks,
                "suggestion": "Stage tomorrow's first-out trains on direct exit tracks overnight",
                "potential_savings": "15-25 minutes daily"
            })
        
        return optimizations
    
    async def _get_shunting_reasoning(self, params: Dict, results: Dict) -> Dict:
        """Get AI reasoning for shunting simulation"""
        if not self.groq_client:
            return self._get_fallback_shunting_reasoning(params, results)
        
        prompt = f"""You are a depot operations expert for KMRL analyzing shunting and train rearrangement.

SIMULATION PARAMETERS:
- Target Trains to Deploy: {len(params.get('target_sequence', []))}
- Optimization Goal: {params.get('optimize_for', 'balanced')}
- Available Shunters: {params.get('available_shunters', 2)}
- Time Window: {params.get('time_window_minutes', 120)} minutes

SIMULATION RESULTS:
- Total Moves Required: {results['summary']['total_moves']}
- Serial Time: {results['summary']['total_time_minutes']} minutes
- Parallel Time (with {results['summary']['shunters_used']} shunters): {results['summary']['parallel_time_minutes']} minutes
- Energy Consumption: {results['summary']['total_energy_kwh']} kWh (₹{results['summary']['energy_cost_inr']})
- Feasible: {'Yes' if results['summary']['is_feasible'] else 'No'}
- Time Buffer: {results['summary']['time_buffer_minutes']} minutes

BLOCKING ANALYSIS:
- Blocking Situations: {results['blocking_analysis']['total_blocking_situations']}
- Average Blocking Factor: {results['blocking_analysis']['avg_blocking_factor']}
- Most Blocked: {json.dumps(results['blocking_analysis']['most_blocked_trains'][:3], indent=2)}

OPTIMIZATION OPPORTUNITIES:
{json.dumps(results['optimization_opportunities'], indent=2)}

Provide detailed operational guidance with:
1. FEASIBILITY ASSESSMENT (can we achieve the target in time?)
2. CRITICAL PATH ANALYSIS (which moves are bottlenecks?)
3. RESOURCE OPTIMIZATION (shunter allocation recommendations)
4. OVERNIGHT STAGING RECOMMENDATIONS (how to position trains for next day)
5. ENERGY REDUCTION STRATEGIES (minimize diesel shunter usage)
6. SAFETY CONSIDERATIONS (important precautions)

Focus on practical depot operations for KMRL Muttom depot."""

        try:
            response = self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are a metro depot operations expert specializing in train shunting, positioning, and overnight planning."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1500
            )
            
            return {
                "status": "success",
                "model": "llama-3.3-70b-versatile",
                "reasoning": response.choices[0].message.content,
                "generated_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            print(f"Groq shunting reasoning failed: {e}")
            return self._get_fallback_shunting_reasoning(params, results)
    
    def _get_fallback_shunting_reasoning(self, params: Dict, results: Dict) -> Dict:
        """Fallback reasoning for shunting simulation"""
        summary = results['summary']
        blocking = results['blocking_analysis']
        
        feasibility_status = "✅ FEASIBLE" if summary['is_feasible'] else "❌ NOT FEASIBLE - REQUIRES INTERVENTION"
        
        reasoning = f"""## Shunting Rearrangement Analysis

### Feasibility Assessment
**Status: {feasibility_status}**

- Required Time: {summary['adjusted_time_minutes']} minutes
- Available Window: {params.get('time_window_minutes', 120)} minutes
- Time Buffer: {summary['time_buffer_minutes']} minutes

### Operations Summary
| Metric | Value |
|--------|-------|
| Total Moves | {summary['total_moves']} |
| Shunters Used | {summary['shunters_used']} |
| Energy Cost | ₹{summary['energy_cost_inr']:,.2f} |
| Efficiency | {'Optimal' if summary['time_buffer_minutes'] > 30 else 'Tight' if summary['time_buffer_minutes'] > 0 else 'Needs Optimization'} |

### Blocking Analysis
- **{blocking['total_blocking_situations']}** blocking situations identified
- Average blocking factor: **{blocking['avg_blocking_factor']}** moves per extraction

### Critical Bottlenecks
{chr(10).join([f"- **{b['target_train']}**: Blocked by {len(b['blocked_by'])} trains on {b['track']}" for b in blocking['most_blocked_trains'][:3]]) if blocking['most_blocked_trains'] else '- No critical bottlenecks'}

### Recommendations

#### Immediate Actions
1. {'Proceed with current plan - adequate time buffer' if summary['is_feasible'] and summary['time_buffer_minutes'] > 20 else 'Add additional shunter to reduce parallel time' if not summary['is_feasible'] else 'Monitor timeline closely - minimal buffer'}

#### Overnight Staging Strategy
2. Position tomorrow's first-out trains on direct exit tracks
3. Group trains by service requirement (peak/off-peak)
4. Keep maintenance-bound trains in inner positions

#### Energy Optimization
5. Minimize diesel shunter idle time
6. Batch movements when possible to reduce total moves
7. Consider electric traction for short moves where overhead available

### Safety Checklist
- ✓ Verify all points/switches before movements
- ✓ Confirm track occupancy status
- ✓ Radio communication with all drivers
- ✓ No personnel on tracks during shunting
"""
        
        return {
            "status": "fallback",
            "model": "rule-based",
            "reasoning": reasoning,
            "generated_at": datetime.utcnow().isoformat()
        }
    
    def get_depot_layout(self) -> Dict:
        """Get current depot layout for visualization"""
        tracks = self.db.query(DepotTrack).filter(
            DepotTrack.depot_id == "MUTTOM"
        ).all()
        
        positions = self.db.query(TrainPosition).all()
        trains = self.db.query(Train).filter(
            Train.status != TrainStatus.DECOMMISSIONED
        ).all()
        
        return self._build_depot_state(tracks, positions, trains)

