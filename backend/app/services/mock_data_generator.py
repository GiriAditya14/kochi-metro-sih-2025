"""
Mock Data Generator for KMRL Train Induction Planning System.
Generates realistic KMRL-specific data for Kochi Metro Rail operations.
"""

import random
from datetime import datetime, timedelta
from typing import List, Dict
import json

from sqlalchemy.orm import Session

from ..models import (
    Train, TrainStatus,
    FitnessCertificate, Department, CertificateStatus, Criticality,
    JobCard, JobType, JobStatus, JobPriority,
    BrandingContract, BrandingPriority, TimeBand,
    MileageMeter,
    CleaningRecord, CleaningStatus, CleaningType, CleaningBay,
    DepotTrack, TrainPosition,
    NightPlan, PlanAssignment, Alert, OverrideLog
)


class MockDataGenerator:
    """
    Generates realistic KMRL data for Muttom Depot operations.
    Based on actual Kochi Metro specifications and operations.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.now = datetime.utcnow()
        
        # KMRL Configuration - Based on actual fleet
        self.num_trains = 25  # Current fleet (22 delivered + 3 more)
        self.depot_id = "MUTTOM"
        
        # Real KMRL train names (Alstom Metropolis trainsets)
        # Each trainset is 3-car: DM1 + T + DM2
        self.train_names = [
            "Aluva Express", "Maharaja's Express", "Cochin Queen",
            "Periyar Express", "Backwaters Line", "Fort Kochi",
            "Ernakulam Star", "Vytilla Express", "Kaloor Metro",
            "MG Road Shuttle", "Edapally Runner", "Palarivattom",
            "Companypadi", "Ambattukavu", "Muttom Local",
            "Kalamassery Express", "CUSAT Metro", "Pathadippalam",
            "Aluva Terminal", "Thripunithura Line", "SN Junction",
            "Town Hall Express", "Ernakulam South", "High Court",
            "Lissie Metro"
        ]
        
        # Alstom Metropolis component systems
        self.components = [
            "bogie_primary", "bogie_secondary", "wheel_set",
            "brake_pneumatic", "brake_disc", "parking_brake",
            "door_plug", "door_motor", "door_sensor",
            "HVAC_compressor", "HVAC_condenser", "HVAC_control",
            "traction_motor", "traction_inverter", "aux_converter",
            "pantograph", "VCB", "current_collector",
            "coupler_mechanical", "coupler_electrical",
            "PA_system", "CCTV", "PIS_display", "radio_TETRA"
        ]
        
        # Real Kerala/Kochi brands that advertise on metro
        self.brands = [
            ("Muthoot Finance", "MUTHOOT", "Leading gold loan company"),
            ("Federal Bank", "FEDERAL", "Kerala's own bank"),
            ("Kerala Tourism", "KTDC", "God's Own Country"),
            ("Kalyan Jewellers", "KALYAN", "Trust of 5 generations"),
            ("Lulu Mall", "LULU", "India's largest shopping mall"),
            ("Aster Medcity", "ASTER", "Healthcare excellence"),
            ("Sobha Developers", "SOBHA", "Premium real estate"),
            ("Malabar Gold", "MALABAR", "Trusted jewellers"),
            ("SBI", "SBI", "Banker to every Indian"),
            ("Bharti Airtel", "AIRTEL", "Stay connected"),
            ("Jio", "JIO", "Digital life"),
            ("Malayala Manorama", "MANORAMA", "Kerala's newspaper"),
        ]
        
        # Realistic fault codes for Alstom Metropolis
        self.fault_codes = {
            "door": ["DOOR-E001", "DOOR-E002", "DOOR-E003", "DOOR-W001"],
            "HVAC": ["HVAC-E001", "HVAC-E002", "HVAC-W001", "HVAC-W002"],
            "brake": ["BRK-E001", "BRK-E002", "BRK-W001"],
            "traction": ["TRAC-E001", "TRAC-E002", "TRAC-W001"],
            "pantograph": ["PANT-E001", "PANT-W001"],
            "signalling": ["CBTC-E001", "ATP-E001", "ATO-W001"],
            "telecom": ["RADIO-E001", "PA-W001", "CCTV-W001"],
        }
        
        # Inspector names (South Indian)
        self.inspectors = [
            "Rajesh Kumar", "Arun Nair", "Suresh Menon", "Pradeep Sharma",
            "Manoj Krishnan", "Sanjay Pillai", "Vijay Varma", "Anand Bose",
            "Ramesh Chandran", "Gopal Iyer"
        ]
        
        # Cleaning crew names
        self.cleaning_crews = ["Alpha", "Beta", "Gamma", "Delta"]

    def generate_all(self, clear_existing: bool = True) -> Dict[str, int]:
        """Generate all mock data with KMRL-specific information."""
        if clear_existing:
            self._clear_existing_data()
        
        # Generate in order due to dependencies
        trains = self.generate_trains()
        depot_tracks = self.generate_depot_layout()
        self.generate_train_positions(trains, depot_tracks)
        self.generate_fitness_certificates(trains)
        self.generate_job_cards(trains)
        self.generate_branding_contracts(trains)
        self.generate_mileage_meters(trains)
        self.generate_cleaning_records(trains)
        self.generate_cleaning_bays()
        
        self.db.commit()
        
        return {
            "trains": len(trains),
            "fitness_certificates": self.db.query(FitnessCertificate).count(),
            "job_cards": self.db.query(JobCard).count(),
            "branding_contracts": self.db.query(BrandingContract).count(),
            "mileage_meters": self.db.query(MileageMeter).count(),
            "cleaning_records": self.db.query(CleaningRecord).count(),
            "depot_tracks": self.db.query(DepotTrack).count(),
            "cleaning_bays": self.db.query(CleaningBay).count(),
        }
    
    def _clear_existing_data(self):
        """Clear all existing data - order matters for foreign keys"""
        # Clear plan-related tables first (they reference trains)
        self.db.query(Alert).delete()
        self.db.query(OverrideLog).delete()
        self.db.query(PlanAssignment).delete()
        self.db.query(NightPlan).delete()
        
        # Clear train-related tables
        self.db.query(TrainPosition).delete()
        self.db.query(CleaningRecord).delete()
        self.db.query(CleaningBay).delete()
        self.db.query(MileageMeter).delete()
        self.db.query(BrandingContract).delete()
        self.db.query(JobCard).delete()
        self.db.query(FitnessCertificate).delete()
        self.db.query(DepotTrack).delete()
        self.db.query(Train).delete()
        self.db.commit()
    
    def generate_trains(self) -> List[Train]:
        """
        Generate 25 Alstom Metropolis trainsets for KMRL.
        - Commissioning started June 2017
        - 3-car configuration (DM1 + T + DM2)
        - 975 passengers capacity per train
        """
        trains = []
        
        # KMRL trains were commissioned between 2017-2023
        base_commissioning = datetime(2017, 6, 1)
        
        for i in range(1, self.num_trains + 1):
            train_id = f"TS-{200 + i}"
            
            # Staggered commissioning - batches of trains
            if i <= 10:
                batch_days = random.randint(0, 180)  # First batch 2017
            elif i <= 18:
                batch_days = random.randint(365, 730)  # Second batch 2018-2019
            else:
                batch_days = random.randint(1095, 1825)  # Third batch 2020-2022
            
            commissioning_date = base_commissioning + timedelta(days=batch_days)
            
            # Status distribution (realistic for metro operations)
            # 88% active, 8% maintenance, 4% out of service
            # This ensures at least 22 trains are potentially available
            roll = random.random()
            if roll < 0.88:
                status = TrainStatus.ACTIVE
                health_score = random.uniform(78, 98)
            elif roll < 0.96:
                status = TrainStatus.UNDER_MAINTENANCE
                health_score = random.uniform(55, 78)
            else:
                status = TrainStatus.OUT_OF_SERVICE
                health_score = random.uniform(30, 55)
            
            train = Train(
                train_id=train_id,
                train_number=i,
                name=self.train_names[i - 1] if i <= len(self.train_names) else f"KMRL Train {i}",
                configuration="3-car",  # DM1 + T + DM2
                manufacturer="Alstom",
                commissioning_date=commissioning_date,
                status=status,
                depot_id=self.depot_id,
                overall_health_score=round(health_score, 1),
                is_service_ready=status == TrainStatus.ACTIVE,
                current_track=None,  # Will be set when positioning
                current_position=None
            )
            trains.append(train)
            self.db.add(train)
        
        self.db.flush()
        return trains
    
    def generate_depot_layout(self) -> List[DepotTrack]:
        """
        Generate Muttom Depot layout based on actual KMRL depot design.
        - 8 stabling tracks for overnight storage
        - 3 IBL (Inspection Bay Lines) for maintenance
        - 2 cleaning tracks
        - Main line connection to revenue service
        """
        tracks = []
        
        # Stabling tracks (tracks 1-8)
        for i in range(1, 9):
            # Tracks closer to main line have lower exit distance
            exit_dist = abs(4.5 - i)  # Track 4 & 5 are closest to exit
            
            track = DepotTrack(
                track_id=f"STB-{i:02d}",
                depot_id=self.depot_id,
                track_name=f"Stabling Line {i}",
                track_type="stabling",
                capacity=3,  # 3 trains per stabling track
                length_meters=195,  # ~65m per 3-car train
                is_electrified=True,
                exit_distance=int(exit_dist),
                is_direct_exit=(i in [4, 5]),  # Middle tracks have direct exit
                stabling_priority=i,
                has_pit=False,
                connected_tracks=json.dumps([
                    f"STB-{max(1,i-1):02d}",
                    f"STB-{min(8,i+1):02d}",
                    "LEAD-01"
                ])
            )
            tracks.append(track)
            self.db.add(track)
        
        # IBL - Inspection Bay Lines (maintenance tracks)
        for i in range(1, 4):
            track = DepotTrack(
                track_id=f"IBL-{i:02d}",
                depot_id=self.depot_id,
                track_name=f"Inspection Bay Line {i}",
                track_type="maintenance",
                capacity=1,
                length_meters=85,
                is_electrified=True,
                has_pit=True,  # All IBL have inspection pits
                exit_distance=10 + i,
                is_direct_exit=False,
                connected_tracks=json.dumps(["LEAD-01"])
            )
            tracks.append(track)
            self.db.add(track)
        
        # Cleaning tracks
        for i in range(1, 3):
            track = DepotTrack(
                track_id=f"CLN-{i:02d}",
                depot_id=self.depot_id,
                track_name=f"Cleaning Line {i}",
                track_type="cleaning",
                capacity=1,
                length_meters=75,
                is_electrified=True,
                exit_distance=15 + i,
                is_direct_exit=False,
                connected_tracks=json.dumps(["LEAD-01"])
            )
            tracks.append(track)
            self.db.add(track)
        
        # Lead track (connects depot to main line)
        track = DepotTrack(
            track_id="LEAD-01",
            depot_id=self.depot_id,
            track_name="Depot Lead Track",
            track_type="lead",
            capacity=2,
            length_meters=250,
            is_electrified=True,
            exit_distance=0,
            is_direct_exit=True,
            connected_tracks=json.dumps(["MAIN-UP", "MAIN-DN"])
        )
        tracks.append(track)
        self.db.add(track)
        
        # Main line connections
        for direction in ["UP", "DN"]:
            track = DepotTrack(
                track_id=f"MAIN-{direction}",
                depot_id=self.depot_id,
                track_name=f"Main Line {direction}ward",
                track_type="mainline_connection",
                capacity=1,
                length_meters=500,
                is_electrified=True,
                exit_distance=0,
                is_direct_exit=True,
                connected_tracks=json.dumps(["LEAD-01"])
            )
            tracks.append(track)
            self.db.add(track)
        
        self.db.flush()
        return tracks
    
    def generate_train_positions(self, trains: List[Train], tracks: List[DepotTrack]):
        """Position trains in stabling tracks for overnight."""
        stabling_tracks = [t for t in tracks if t.track_type == "stabling"]
        
        # Sort trains by status - active trains in better positions
        active_trains = [t for t in trains if t.status == TrainStatus.ACTIVE]
        other_trains = [t for t in trains if t.status != TrainStatus.ACTIVE]
        
        # Shuffle active trains for realism
        random.shuffle(active_trains)
        sorted_trains = active_trains + other_trains
        
        train_idx = 0
        for track in stabling_tracks:
            for pos in range(track.capacity):
                if train_idx >= len(sorted_trains):
                    break
                
                train = sorted_trains[train_idx]
                
                # Update train's current position
                train.current_track = track.track_id
                train.current_position = pos
                
                # Calculate shunting moves needed to exit
                # Position 0 is closest to exit, position 2 is furthest
                shunting_moves = pos
                
                # Create position record
                position = TrainPosition(
                    train_id=train.id,
                    track_id=track.id,
                    position_in_track=pos,
                    arrived_at=self.now - timedelta(hours=random.randint(1, 6)),
                    estimated_shunting_moves=shunting_moves,
                    estimated_shunting_time_minutes=shunting_moves * 5
                )
                self.db.add(position)
                
                track.current_occupancy += 1
                train_idx += 1
    
    def generate_fitness_certificates(self, trains: List[Train]):
        """
        Generate fitness certificates from all 3 departments:
        - Rolling Stock (RS) - Mechanical & Electrical
        - Signalling (CBTC/ATP/ATO)
        - Telecom (Radio, PA, CCTV)
        
        Realistic edge cases for demonstration.
        """
        for train in trains:
            for dept in Department:
                # Different validity periods per department
                if dept == Department.ROLLING_STOCK:
                    base_validity = 45  # 45 days - mechanical/structural checks
                    criticality = Criticality.HARD
                elif dept == Department.SIGNALLING:
                    base_validity = 30  # 30 days - CBTC/ATP calibration
                    criticality = Criticality.HARD
                else:  # Telecom
                    base_validity = 30  # 30 days - communication systems
                    criticality = Criticality.SOFT
                
                # Issue date: 1-20 days ago (ensure cert is still valid)
                # For VALID certs, issued recently enough to still be valid for 24+ hours
                max_days_ago = min(20, base_validity - 2)
                valid_from = self.now - timedelta(days=random.randint(1, max_days_ago))
                
                # Determine certificate status with weighted probabilities
                roll = random.random()
                
                # First 20 trains should mostly have valid certificates to ensure service
                # Only trains 21-25 get edge cases
                is_edge_case_train = train.train_number > 20
                
                if not is_edge_case_train:
                    # 97% valid for main fleet (need high % since ALL 3 certs must be valid)
                    if roll < 0.97:
                        valid_to = valid_from + timedelta(days=base_validity)
                        status = CertificateStatus.VALID
                        is_conditional = False
                        emergency_override = False
                    elif roll < 0.99:
                        valid_to = self.now + timedelta(hours=random.randint(12, 48))
                        status = CertificateStatus.EXPIRING_SOON
                        is_conditional = False
                        emergency_override = False
                    else:
                        valid_to = valid_from + timedelta(days=base_validity)
                        status = CertificateStatus.CONDITIONAL
                        is_conditional = True
                        emergency_override = False
                else:
                    # Edge case trains (21-25) - more variety for demos
                    if roll < 0.70:
                        valid_to = valid_from + timedelta(days=base_validity)
                        status = CertificateStatus.VALID
                        is_conditional = False
                        emergency_override = False
                    elif roll < 0.85:
                        valid_to = self.now + timedelta(hours=random.randint(6, 24))
                        status = CertificateStatus.EXPIRING_SOON
                        is_conditional = False
                        emergency_override = False
                    elif roll < 0.92:
                        valid_to = valid_from + timedelta(days=base_validity)
                        status = CertificateStatus.CONDITIONAL
                        is_conditional = True
                        emergency_override = False
                    elif roll < 0.97:
                        valid_to = self.now - timedelta(hours=random.randint(1, 24))
                        status = CertificateStatus.EXPIRED
                        is_conditional = False
                        emergency_override = False
                    else:
                        valid_to = self.now - timedelta(hours=random.randint(1, 6))
                        status = CertificateStatus.EXPIRED
                        is_conditional = False
                        emergency_override = True
                
                # Certificate number format: KMRL-RS/SIG/TEL-TRAINID-DATE-SEQ
                dept_code = dept.value[:3].upper()
                cert_num = f"KMRL-{dept_code}-{train.train_id}-{valid_from.strftime('%y%m%d')}-{random.randint(100, 999)}"
                
                # Conditional certificate details
                condition_notes = None
                max_speed = None
                if is_conditional:
                    conditions = [
                        ("Maximum speed restricted to 60 km/h due to bogie vibration", 60),
                        ("Door 3 manual release only - avoid peak hours", None),
                        ("CBTC degraded mode - driver supervision required", 40),
                        ("PA Car 2 inoperative - manual announcements only", None),
                        ("HVAC operating at reduced capacity - monitor temperature", None),
                    ]
                    cond = random.choice(conditions)
                    condition_notes = cond[0]
                    max_speed = cond[1]
                
                # Department-specific remarks
                if dept == Department.ROLLING_STOCK:
                    remarks_options = [
                        "All mechanical systems operational. Brake wear at 45%.",
                        "Traction system nominal. Minor door delay on Car 3.",
                        "Bogie inspection complete. Wheel profile within limits.",
                        "HVAC functioning. Compressor noise noted - monitoring.",
                        "Coupler tested. Electrical connections verified.",
                    ]
                elif dept == Department.SIGNALLING:
                    remarks_options = [
                        "CBTC mode fully operational. ATP response within 50ms.",
                        "ATO calibration verified. Platform stopping accuracy OK.",
                        "Beacon detection nominal. No missed updates.",
                        "Speed supervision active. Emergency brake tested.",
                        "DMI displays functional. Driver interface verified.",
                    ]
                else:  # Telecom
                    remarks_options = [
                        "TETRA radio signal strength optimal across corridor.",
                        "CCTV recording verified. All 12 cameras operational.",
                        "PA system tested. Audio clarity acceptable.",
                        "PIS displays functional. Real-time updates working.",
                        "Intercom tested between all cars and OCC.",
                    ]
                
                inspector = random.choice(self.inspectors)
                
                certificate = FitnessCertificate(
                    train_id=train.id,
                    certificate_number=cert_num,
                    department=dept,
                    status=status,
                    criticality=criticality,
                    valid_from=valid_from,
                    valid_to=valid_to,
                    is_conditional=is_conditional,
                    condition_notes=condition_notes,
                    max_speed_restriction=max_speed,
                    emergency_override=emergency_override,
                    override_approved_by="Dy. GM Operations" if emergency_override else None,
                    override_reason="Critical peak-hour service requirement - single trip authorized" if emergency_override else None,
                    override_expires_at=(self.now + timedelta(hours=6)) if emergency_override else None,
                    last_inspection_date=valid_from,
                    inspector_name=inspector,
                    inspection_type=random.choice(["Scheduled", "Post-incident", "Special"]),
                    remarks=random.choice(remarks_options)
                )
                self.db.add(certificate)
    
    def generate_job_cards(self, trains: List[Train]):
        """
        Generate job cards (IBM Maximo work orders) with realistic KMRL scenarios.
        """
        job_counter = 240001  # KMRL work order format
        
        # Job templates with realistic descriptions
        job_templates = {
            "door": [
                {"title": "Door obstruction sensor calibration", "type": JobType.PREVENTIVE, "hours": 2},
                {"title": "Door motor brushes replacement", "type": JobType.CORRECTIVE, "hours": 4},
                {"title": "Door seal replacement Car 2", "type": JobType.CORRECTIVE, "hours": 3},
                {"title": "Door opening time adjustment", "type": JobType.PREVENTIVE, "hours": 1},
            ],
            "brake": [
                {"title": "Brake pad inspection and measurement", "type": JobType.INSPECTION, "hours": 2},
                {"title": "Brake disc replacement - Bogie 1", "type": JobType.CORRECTIVE, "hours": 6},
                {"title": "Parking brake functional test", "type": JobType.PREVENTIVE, "hours": 1},
                {"title": "Emergency brake valve overhaul", "type": JobType.OVERHAUL, "hours": 8},
            ],
            "HVAC": [
                {"title": "HVAC filter cleaning and replacement", "type": JobType.PREVENTIVE, "hours": 3},
                {"title": "Compressor oil level check", "type": JobType.INSPECTION, "hours": 1},
                {"title": "Refrigerant pressure adjustment", "type": JobType.CORRECTIVE, "hours": 4},
                {"title": "Temperature sensor recalibration", "type": JobType.CORRECTIVE, "hours": 2},
            ],
            "traction": [
                {"title": "Traction motor insulation test", "type": JobType.INSPECTION, "hours": 3},
                {"title": "Inverter cooling fan replacement", "type": JobType.CORRECTIVE, "hours": 5},
                {"title": "Wheel re-profiling required", "type": JobType.CORRECTIVE, "hours": 8},
                {"title": "Axle bearing inspection", "type": JobType.INSPECTION, "hours": 4},
            ],
            "pantograph": [
                {"title": "Carbon strip wear measurement", "type": JobType.INSPECTION, "hours": 1},
                {"title": "Pantograph spring replacement", "type": JobType.CORRECTIVE, "hours": 3},
                {"title": "Contact force adjustment", "type": JobType.PREVENTIVE, "hours": 2},
            ],
            "signalling": [
                {"title": "CBTC antenna inspection", "type": JobType.INSPECTION, "hours": 2},
                {"title": "Odometer calibration", "type": JobType.PREVENTIVE, "hours": 3},
                {"title": "ATP database update", "type": JobType.PREVENTIVE, "hours": 4},
            ],
            "telecom": [
                {"title": "TETRA radio firmware update", "type": JobType.PREVENTIVE, "hours": 2},
                {"title": "CCTV DVR replacement", "type": JobType.CORRECTIVE, "hours": 3},
                {"title": "PA amplifier repair", "type": JobType.CORRECTIVE, "hours": 4},
            ],
        }
        
        for train in trains:
            # Each train has 1-5 job cards
            num_jobs = random.randint(1, 5)
            
            for _ in range(num_jobs):
                job_id = f"WO-{job_counter}"
                job_counter += 1
                
                # Select component and job template
                component = random.choice(list(job_templates.keys()))
                template = random.choice(job_templates[component])
                
                # Determine job characteristics
                roll = random.random()
                
                if roll < 0.45:  # 45% open - pending work
                    status = JobStatus.OPEN
                    # Only 2% safety critical for OPEN jobs (blocking is rare in real ops)
                    safety_critical = random.random() < 0.02
                    priority = JobPriority.CRITICAL if safety_critical else random.choice([
                        JobPriority.HIGH, JobPriority.MEDIUM
                    ])
                    due_date = self.now + timedelta(days=random.randint(1, 7))
                    
                elif roll < 0.65:  # 20% in progress
                    status = JobStatus.IN_PROGRESS
                    # 3% safety critical for IN_PROGRESS (being worked on)
                    safety_critical = random.random() < 0.03
                    priority = JobPriority.HIGH if safety_critical else JobPriority.MEDIUM
                    due_date = self.now + timedelta(days=random.randint(0, 3))
                    
                elif roll < 0.80:  # 15% deferred
                    status = JobStatus.DEFERRED
                    safety_critical = False
                    priority = random.choice([JobPriority.MEDIUM, JobPriority.LOW])
                    due_date = self.now + timedelta(days=random.randint(7, 14))
                    
                elif roll < 0.92:  # 12% pending parts
                    status = JobStatus.PENDING_PARTS
                    safety_critical = False
                    priority = JobPriority.MEDIUM
                    due_date = self.now - timedelta(days=random.randint(1, 3))  # Overdue
                    
                else:  # 8% routine scheduled
                    status = JobStatus.OPEN
                    safety_critical = False
                    priority = JobPriority.ROUTINE
                    due_date = self.now + timedelta(days=random.randint(14, 30))
                
                # Parts availability
                parts_available = status != JobStatus.PENDING_PARTS
                parts_eta = None
                if not parts_available:
                    parts_eta = self.now + timedelta(days=random.randint(2, 7))
                
                # Get fault code if corrective
                fault_code = None
                if template["type"] == JobType.CORRECTIVE:
                    fault_codes_for_comp = self.fault_codes.get(component, [])
                    if fault_codes_for_comp:
                        fault_code = random.choice(fault_codes_for_comp)
                
                job = JobCard(
                    train_id=train.id,
                    job_id=job_id,
                    job_type=template["type"],
                    priority=priority,
                    status=status,
                    title=template["title"],
                    description=f"{template['title']} for {train.train_id} ({train.name}). "
                               f"Component: {component.upper()}. "
                               f"Location: Car {random.randint(1, 3)}.",
                    related_component=component,
                    system_code=f"SYS-{component.upper()[:6]}",
                    location_on_train=f"Car {random.randint(1, 3)}",
                    reported_date=self.now - timedelta(days=random.randint(0, 14)),
                    due_date=due_date,
                    estimated_downtime_hours=template["hours"],
                    safety_critical=safety_critical,
                    requires_ibl=(template["hours"] > 4 or safety_critical),
                    blocks_service=safety_critical,
                    parts_required=json.dumps([
                        f"Part-{component[:3].upper()}-{random.randint(1000, 9999)}"
                        for _ in range(random.randint(1, 3))
                    ]),
                    parts_available=parts_available,
                    parts_eta=parts_eta,
                    can_be_deferred=not safety_critical,
                    max_deferral_days=7 if not safety_critical else 0,
                    fault_code=fault_code,
                    fault_description=f"Fault detected in {component} system" if fault_code else None,
                    fault_detected_by=random.choice(["Driver", "IoT sensor", "Inspection", "OCC"]),
                    assigned_team=f"{component.upper()} Maintenance Team"
                )
                self.db.add(job)
    
    def generate_branding_contracts(self, trains: List[Train]):
        """
        Generate branding/advertising contracts with SLA requirements.
        About 35% of KMRL trains have full-body wraps.
        """
        # Select trains for branding
        num_branded = int(len(trains) * 0.35)
        branded_trains = random.sample(trains, k=num_branded)
        
        for train in branded_trains:
            brand_info = random.choice(self.brands)
            brand_name, brand_id, tagline = brand_info
            
            # Campaign typically 3-6 months
            campaign_duration = random.randint(90, 180)
            campaign_start = self.now - timedelta(days=random.randint(10, 60))
            campaign_end = campaign_start + timedelta(days=campaign_duration)
            
            # Priority based on brand value
            priority = random.choice(list(BrandingPriority))
            
            # Exposure targets based on priority tier
            if priority == BrandingPriority.PLATINUM:
                target_weekly = random.uniform(80, 100)
                penalty_rate = 750
            elif priority == BrandingPriority.GOLD:
                target_weekly = random.uniform(60, 80)
                penalty_rate = 500
            elif priority == BrandingPriority.SILVER:
                target_weekly = random.uniform(40, 60)
                penalty_rate = 300
            else:  # Bronze
                target_weekly = random.uniform(25, 40)
                penalty_rate = 150
            
            target_monthly = target_weekly * 4.33
            
            # Simulate current exposure (some under-delivered)
            if random.random() < 0.25:  # 25% under-delivered
                delivery_ratio = random.uniform(0.6, 0.85)
                is_compliant = False
            else:
                delivery_ratio = random.uniform(0.95, 1.15)
                is_compliant = True
            
            current_weekly = target_weekly * delivery_ratio
            current_monthly = target_monthly * delivery_ratio
            compliance_pct = min(100, delivery_ratio * 100)
            
            # Time band requirements
            time_band = random.choice(list(TimeBand))
            
            contract = BrandingContract(
                train_id=train.id,
                brand_id=f"BR-{brand_id}",
                brand_name=brand_name,
                campaign_name=f"{brand_name} - {tagline}",
                campaign_start=campaign_start,
                campaign_end=campaign_end,
                priority=priority,
                target_exposure_hours_weekly=round(target_weekly, 1),
                target_exposure_hours_monthly=round(target_monthly, 1),
                target_trips_daily=random.randint(8, 14),
                current_exposure_hours_week=round(current_weekly, 1),
                current_exposure_hours_month=round(current_monthly, 1),
                required_time_band=time_band,
                penalty_per_hour_shortfall=penalty_rate,
                is_compliant=is_compliant,
                compliance_percentage=round(compliance_pct, 1),
                contact_person=f"Mr. {random.choice(['Sharma', 'Menon', 'Nair', 'Pillai'])}",
                contact_email=f"marketing@{brand_id.lower()}.com"
            )
            self.db.add(contract)
    
    def generate_mileage_meters(self, trains: List[Train]):
        """
        Generate mileage data based on KMRL service patterns.
        - Daily service: ~120-180 km (Aluva to Pettah corridor)
        - Service interval: Every 20,000 km
        - Major overhaul: Every 100,000 km
        """
        for train in trains:
            # Calculate lifetime based on commissioning date
            if train.commissioning_date:
                days_in_service = (self.now - train.commissioning_date).days
            else:
                days_in_service = random.randint(365, 2000)
            
            # Average daily km (not all days in service)
            avg_daily = random.uniform(120, 180)
            service_ratio = random.uniform(0.70, 0.85)  # Trains not in service every day
            
            # Lifetime km
            lifetime_km = days_in_service * avg_daily * service_ratio
            
            # Thresholds (KMRL standards)
            service_threshold = 20000
            overhaul_threshold = 100000
            
            # km since last service (create edge cases)
            roll = random.random()
            if roll < 0.08:  # 8% very close to threshold
                km_since_service = service_threshold - random.uniform(200, 1000)
            elif roll < 0.15:  # 7% recently serviced
                km_since_service = random.uniform(100, 1500)
            elif roll < 0.25:  # 10% over threshold (needs immediate attention)
                km_since_service = service_threshold + random.uniform(100, 2000)
            else:
                km_since_service = random.uniform(2000, service_threshold - 2000)
            
            km_to_threshold = service_threshold - km_since_service
            is_near = km_to_threshold < 3000 and km_to_threshold > 0
            is_over = km_to_threshold <= 0
            
            meter = MileageMeter(
                train_id=train.id,
                component_type="train",
                lifetime_km=round(lifetime_km, 1),
                km_since_last_overhaul=round(lifetime_km % overhaul_threshold, 1),
                km_since_last_service=round(max(0, km_since_service), 1),
                km_today=round(random.uniform(0, 150), 1),
                km_this_week=round(random.uniform(600, 1100), 1),
                km_this_month=round(random.uniform(2800, 4500), 1),
                overhaul_threshold_km=overhaul_threshold,
                service_threshold_km=service_threshold,
                warning_threshold_km=3000,
                is_near_threshold=is_near,
                is_over_threshold=is_over,
                avg_daily_km=round(avg_daily, 1),
                reading_source="OBC"  # On-Board Computer
            )
            self.db.add(meter)
    
    def generate_cleaning_records(self, trains: List[Train]):
        """
        Generate cleaning records with KMRL cleaning policy:
        - Light cleaning: Daily
        - Standard cleaning: Every 48 hours max
        - Deep cleaning: Weekly
        """
        for train in trains:
            roll = random.random()
            
            if roll < 0.55:  # 55% freshly cleaned
                days_since = random.uniform(0, 0.8)
                status = CleaningStatus.OK
                special_required = False
                vip_tomorrow = False
                
            elif roll < 0.75:  # 20% due for cleaning
                days_since = random.uniform(1, 1.8)
                status = CleaningStatus.DUE
                special_required = False
                vip_tomorrow = False
                
            elif roll < 0.88:  # 13% overdue
                days_since = random.uniform(2, 3.5)
                status = CleaningStatus.OVERDUE
                special_required = False
                vip_tomorrow = False
                
            elif roll < 0.95:  # 7% special cleaning
                days_since = random.uniform(0.5, 1.5)
                status = CleaningStatus.SPECIAL_REQUIRED
                special_required = True
                vip_tomorrow = False
                
            else:  # 5% VIP inspection
                days_since = random.uniform(0, 1)
                status = CleaningStatus.OK
                special_required = False
                vip_tomorrow = True
            
            last_cleaned = self.now - timedelta(days=days_since)
            
            special_reasons = [
                "Graffiti removal - external body",
                "Passenger spillage - Car 2 floor",
                "Vomit cleanup - Car 1",
                "Vandalism - seat damage repair",
                "AC water leakage - ceiling stains",
            ]
            
            vip_reasons = [
                "Chief Minister metro visit",
                "Union Minister inspection",
                "Japanese delegation visit",
                "Republic Day special service",
                "Metro anniversary celebration",
            ]
            
            cleaning_type = random.choice(list(CleaningType))
            crew = random.choice(self.cleaning_crews)
            
            record = CleaningRecord(
                train_id=train.id,
                status=status,
                last_cleaning_type=cleaning_type,
                last_cleaned_at=last_cleaned,
                last_cleaned_by=f"Crew {crew}",
                last_cleaning_bay=f"CLN-0{random.randint(1, 2)}",
                last_cleaning_duration_hours=random.uniform(1.5, 2.5),
                next_light_clean_due=last_cleaned + timedelta(hours=12),
                next_deep_clean_due=last_cleaned + timedelta(days=7),
                next_exterior_wash_due=last_cleaned + timedelta(days=3),
                special_clean_required=special_required,
                special_clean_reason=random.choice(special_reasons) if special_required else None,
                vip_inspection_tomorrow=vip_tomorrow,
                vip_inspection_notes=random.choice(vip_reasons) if vip_tomorrow else None,
                last_inspection_score=random.uniform(75, 98),
                cleanliness_complaints=random.randint(0, 2)
            )
            self.db.add(record)
    
    def generate_cleaning_bays(self):
        """Generate KMRL Muttom depot cleaning bay configuration."""
        bays = [
            {
                "bay_id": "CLN-BAY-01",
                "bay_name": "Automatic Train Wash",
                "has_exterior_wash": True,
                "has_interior_equipment": False,
                "has_detailing_equipment": False,
                "capacity": 1,
                "avg_duration": 0.5,  # 30 min exterior wash
                "staff_required": 1,
            },
            {
                "bay_id": "CLN-BAY-02",
                "bay_name": "Primary Interior Cleaning Bay",
                "has_exterior_wash": False,
                "has_interior_equipment": True,
                "has_detailing_equipment": True,
                "capacity": 1,
                "avg_duration": 2.0,
                "staff_required": 4,
            },
            {
                "bay_id": "CLN-BAY-03",
                "bay_name": "Secondary Cleaning Bay",
                "has_exterior_wash": False,
                "has_interior_equipment": True,
                "has_detailing_equipment": False,
                "capacity": 1,
                "avg_duration": 1.5,
                "staff_required": 3,
            },
        ]
        
        for idx, bay_config in enumerate(bays):
            bay = CleaningBay(
                bay_id=bay_config["bay_id"],
                depot_id=self.depot_id,
                bay_name=bay_config["bay_name"],
                cleaning_types_supported=json.dumps(["light", "standard", "deep"]),
                has_exterior_wash=bay_config["has_exterior_wash"],
                has_interior_equipment=bay_config["has_interior_equipment"],
                has_detailing_equipment=bay_config["has_detailing_equipment"],
                capacity=bay_config["capacity"],
                avg_cleaning_duration_hours=bay_config["avg_duration"],
                is_operational=True,
                shift_start="22:00",
                shift_end="05:00",
                staff_required=bay_config["staff_required"],
                current_staff_available=bay_config["staff_required"],
                track_id=f"CLN-0{idx + 1}" if idx < 2 else None
            )
            self.db.add(bay)
