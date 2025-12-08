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
from ..models import Train, TrainStatus, NightPlan, PlanAssignment


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
                model="llama-3.1-70b-versatile",
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
                "model": "llama-3.1-70b-versatile",
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
                model="llama-3.1-70b-versatile",
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
                "model": "llama-3.1-70b-versatile",
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
                model="llama-3.1-70b-versatile",
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
                "model": "llama-3.1-70b-versatile",
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

