"""
KMRL Train Induction Planning System - FastAPI Backend
Production-ready API with AI-powered features
"""

from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import json
import csv
import io

from .models import (
    Base, engine, get_db, SessionLocal,
    Train, TrainStatus,
    FitnessCertificate, Department, CertificateStatus, Criticality,
    JobCard, JobType, JobStatus, JobPriority,
    BrandingContract, BrandingPriority, TimeBand, BrandingExposureLog,
    MileageMeter,
    CleaningRecord, CleaningStatus, CleaningType, CleaningBay,
    DepotTrack, TrainPosition,
    NightPlan, PlanAssignment, AssignmentType, PlanStatus, OverrideLog, Alert, AlertSeverity,
    User,
)
from .models.database import init_db, test_connection, get_table_counts
from .services import MockDataGenerator, TrainInductionOptimizer, AICopilot, FileProcessor
from .services.simulation_service import SimulationService
from .config import settings, is_ai_enabled, is_groq_enabled, is_cloudinary_enabled, get_service_status, is_postgresql
# Local auth
from .services.auth_service import hash_password, verify_password, create_token, get_current_user, require_role

# Create FastAPI app
app = FastAPI(
    title="KMRL Train Induction Planning System",
    description="AI-powered train scheduling and optimization for Kochi Metro Rail Limited",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()
    print(f"✓ Database initialized")
    print(f"✓ AI Features: {'Enabled' if is_ai_enabled() else 'Disabled (set GEMINI_API_KEY)'}")

# ==================== Health & System ====================

@app.get("/")
async def root():
    return {
        "status": "healthy",
        "service": "KMRL Train Induction Planning System",
        "version": "1.0.0",
        "ai_enabled": is_ai_enabled(),
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/system/status")
async def system_status(db: Session = Depends(get_db)):
    return {
        "database": "connected",
        "ai_enabled": is_ai_enabled(),
        "trains_count": db.query(Train).count(),
        "active_plans": db.query(NightPlan).filter(NightPlan.status == PlanStatus.PROPOSED).count(),
        "pending_alerts": db.query(Alert).filter(Alert.is_resolved == False).count(),
        "config": {
            "depot": settings.default_depot,
            "fleet_size": settings.fleet_size,
            "service_requirement": settings.trains_needed_for_service
        },
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/system/ai-status")
async def ai_status():
    """Check AI service status"""
    return {
        "ai_enabled": is_ai_enabled(),
        "provider": "Google Gemini",
        "features": [
            "Plan Explanations",
            "Assignment Reasoning",
            "Natural Language Scenarios",
            "Data Validation",
            "Daily Briefings",
            "Q&A Support"
        ] if is_ai_enabled() else [],
        "message": "AI features active" if is_ai_enabled() else "Set GEMINI_API_KEY environment variable to enable AI features"
    }

@app.get("/api/system/services")
async def get_services_status(db: Session = Depends(get_db)):
    """Get comprehensive status of all external services"""
    db_status = test_connection()
    table_counts = get_table_counts()
    
    return {
        "services": get_service_status(),
        "database": {
            **db_status,
            "tables": table_counts
        },
        "features": {
            "gemini_ai": is_ai_enabled(),
            "groq_llm": is_groq_enabled(),
            "cloudinary": is_cloudinary_enabled(),
            "postgresql": is_postgresql()
        },
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/system/database")
async def get_database_status(db: Session = Depends(get_db)):
    """Get database connection status and statistics"""
    db_status = test_connection()
    table_counts = get_table_counts()
    
    return {
        "connection": db_status,
        "type": "PostgreSQL (Neon)" if is_postgresql() else "SQLite",
        "tables": table_counts,
        "timestamp": datetime.utcnow().isoformat()
    }

# ==================== Authentication (Local Email/Password) ====================

ALLOWED_ROLES = {"admin", "supervisor", "worker"}


@app.post("/api/auth/signup")
async def signup_local(payload: Dict[str, Any], db: Session = Depends(get_db)):
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""
    role = (payload.get("role") or "worker").lower()

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    if role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    user = User(email=email, password_hash=hash_password(password), role=role)
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token(user)
    return {"token": token, "user": user.to_dict()}


@app.post("/api/auth/login")
async def login_local(payload: Dict[str, Any], db: Session = Depends(get_db)):
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user)
    return {"token": token, "user": user.to_dict()}


@app.get("/api/auth/me")
async def auth_me(current_user: User = Depends(get_current_user)):
    return {"user": current_user.to_dict()}

# ==================== Intelligent File Upload (Cloudinary + Groq) ====================
# ==================== Intelligent File Upload (Cloudinary + Groq) ====================

@app.post("/api/upload/intelligent")
async def intelligent_file_upload(
    file: UploadFile = File(...),
    data_type: str = Form(...),
    store_in_cloudinary: bool = Form(True),
    db: Session = Depends(get_db)
):
    """
    Intelligent file upload with AI-powered data extraction.
    
    - Supports CSV and PDF files
    - Stores files in Cloudinary (optional)
    - Uses Groq LLM to extract and structure data
    - Automatically saves to database
    
    data_type options: trains, certificates, job-cards, branding, mileage, cleaning
    """
    processor = FileProcessor(db)
    
    content = await file.read()
    
    try:
        result = await processor.process_and_save(
            content=content,
            filename=file.filename,
            data_type=data_type,
            store_in_cloudinary=store_in_cloudinary
        )
    except Exception as e:
        return {
            "status": "error",
            "filename": file.filename,
            "data_type": data_type,
            "error": str(e),
            "file_stored": False,
            "records_parsed": 0,
            "records_saved": 0
        }
    
    # Handle None result
    if result is None:
        return {
            "status": "error",
            "filename": file.filename,
            "data_type": data_type,
            "error": "Processing failed - no result returned",
            "file_stored": False,
            "records_parsed": 0,
            "records_saved": 0
        }
    
    # Safe extraction with defaults
    parsed = result.get("parsed") or {}
    saved = result.get("saved") or {}
    cloudinary_data = result.get("cloudinary")
    
    return {
        "status": "success" if parsed.get("success") else "partial",
        "filename": file.filename,
        "data_type": data_type,
        "file_stored": cloudinary_data is not None,
        "cloudinary_url": cloudinary_data.get("url") if cloudinary_data else None,
        "records_parsed": parsed.get("count", 0),
        "records_saved": saved.get("saved_count", 0),
        "parsing_method": parsed.get("method"),
        "errors": saved.get("errors", []) + (parsed.get("errors", []) if not parsed.get("success") else []),
        "services_used": {
            "cloudinary": cloudinary_data is not None,
            "groq_llm": str(parsed.get("method", "")).startswith("groq")
        }
    }

@app.post("/api/upload/parse-preview")
async def parse_file_preview(
    file: UploadFile = File(...),
    data_type: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Preview parsed data without saving to database.
    Useful for validation before committing.
    """
    processor = FileProcessor(db)
    
    content = await file.read()
    file_ext = file.filename.split('.')[-1].lower()
    
    if file_ext == 'csv':
        result = await processor.process_csv(content, data_type)
    elif file_ext == 'pdf':
        result = await processor.process_pdf(content, data_type)
    else:
        # Try as text
        try:
            text = content.decode('utf-8')
            if processor.groq_client:
                extracted = await processor._groq_extract_from_text(text, data_type)
                result = {"success": True, "records": extracted, "count": len(extracted)}
            else:
                result = {"success": False, "error": "Unsupported file type"}
        except:
            result = {"success": False, "error": "Could not parse file"}
    
    return {
        "filename": file.filename,
        "data_type": data_type,
        "parsing_success": result.get("success", False),
        "records_count": result.get("count", 0),
        "preview": result.get("records", [])[:10],  # First 10 records
        "method": result.get("method"),
        "error": result.get("error")
    }

@app.get("/api/upload/schema/{data_type}")
async def get_schema(data_type: str):
    """Get expected schema for a data type"""
    processor = FileProcessor(None)
    schema = processor._get_schema(data_type)
    
    if not schema:
        raise HTTPException(status_code=404, detail=f"Unknown data type: {data_type}")
    
    return {
        "data_type": data_type,
        "schema": schema,
        "supported_formats": ["csv", "pdf", "txt"],
        "notes": {
            "csv": "First row should be column headers",
            "pdf": "Document will be parsed using AI (requires GROQ_API_KEY)",
            "txt": "Plain text will be parsed using AI (requires GROQ_API_KEY)"
        }
    }

# ==================== Manual Data Upload ====================

@app.post("/api/upload/trains")
async def upload_trains(
    file: UploadFile = File(None),
    data: str = Form(None),
    db: Session = Depends(get_db)
):
    """
    Upload train data via CSV file or JSON.
    CSV columns: train_id, train_number, name, configuration, status, depot_id
    """
    trains_added = []
    
    if file:
        content = await file.read()
        text = content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(text))
        
        for row in reader:
            train = Train(
                train_id=row.get('train_id', f"TS-{row.get('train_number', 0)}"),
                train_number=int(row.get('train_number', 0)),
                name=row.get('name', ''),
                configuration=row.get('configuration', '3-car'),
                status=TrainStatus(row.get('status', 'active')),
                depot_id=row.get('depot_id', settings.default_depot),
                overall_health_score=float(row.get('health_score', 100)),
                is_service_ready=row.get('status', 'active') == 'active'
            )
            db.add(train)
            trains_added.append(train.train_id)
    
    elif data:
        json_data = json.loads(data)
        items = json_data if isinstance(json_data, list) else [json_data]
        
        for item in items:
            train = Train(
                train_id=item.get('train_id', f"TS-{item.get('train_number', 0)}"),
                train_number=int(item.get('train_number', 0)),
                name=item.get('name', ''),
                configuration=item.get('configuration', '3-car'),
                status=TrainStatus(item.get('status', 'active')),
                depot_id=item.get('depot_id', settings.default_depot),
                overall_health_score=float(item.get('health_score', 100)),
                is_service_ready=item.get('status', 'active') == 'active'
            )
            db.add(train)
            trains_added.append(train.train_id)
    
    db.commit()
    return {"status": "success", "trains_added": len(trains_added), "train_ids": trains_added}

@app.post("/api/upload/certificates")
async def upload_certificates(
    file: UploadFile = File(None),
    data: str = Form(None),
    db: Session = Depends(get_db)
):
    """
    Upload fitness certificates via CSV or JSON.
    CSV columns: train_id, department, status, valid_from, valid_to, remarks
    """
    certs_added = []
    
    if file:
        content = await file.read()
        text = content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(text))
        
        for row in reader:
            # Find train by train_id string
            train = db.query(Train).filter(Train.train_id == row.get('train_id')).first()
            if not train:
                continue
            
            cert = FitnessCertificate(
                train_id=train.id,
                certificate_number=row.get('certificate_number', f"CERT-{datetime.now().strftime('%Y%m%d%H%M%S')}"),
                department=Department(row.get('department', 'RollingStock')),
                status=CertificateStatus(row.get('status', 'Valid')),
                criticality=Criticality(row.get('criticality', 'hard')),
                valid_from=datetime.fromisoformat(row.get('valid_from', datetime.utcnow().isoformat())),
                valid_to=datetime.fromisoformat(row.get('valid_to', (datetime.utcnow() + timedelta(days=30)).isoformat())),
                remarks=row.get('remarks', '')
            )
            db.add(cert)
            certs_added.append(cert.certificate_number)
    
    elif data:
        json_data = json.loads(data)
        items = json_data if isinstance(json_data, list) else [json_data]
        
        for item in items:
            train = db.query(Train).filter(Train.train_id == item.get('train_id')).first()
            if not train:
                # Try by ID
                train = db.query(Train).filter(Train.id == item.get('train_id')).first()
            if not train:
                continue
            
            cert = FitnessCertificate(
                train_id=train.id,
                certificate_number=item.get('certificate_number', f"CERT-{datetime.now().strftime('%Y%m%d%H%M%S')}"),
                department=Department(item.get('department', 'RollingStock')),
                status=CertificateStatus(item.get('status', 'Valid')),
                criticality=Criticality(item.get('criticality', 'hard')),
                valid_from=datetime.fromisoformat(item.get('valid_from')) if item.get('valid_from') else datetime.utcnow(),
                valid_to=datetime.fromisoformat(item.get('valid_to')) if item.get('valid_to') else datetime.utcnow() + timedelta(days=30),
                is_conditional=item.get('is_conditional', False),
                condition_notes=item.get('condition_notes'),
                emergency_override=item.get('emergency_override', False),
                override_approved_by=item.get('override_approved_by'),
                override_reason=item.get('override_reason'),
                remarks=item.get('remarks', '')
            )
            db.add(cert)
            certs_added.append(cert.certificate_number)
    
    db.commit()
    return {"status": "success", "certificates_added": len(certs_added), "certificate_numbers": certs_added}

@app.post("/api/upload/job-cards")
async def upload_job_cards(
    file: UploadFile = File(None),
    data: str = Form(None),
    db: Session = Depends(get_db)
):
    """
    Upload job cards (Maximo work orders) via CSV or JSON.
    CSV columns: train_id, job_id, title, job_type, priority, status, safety_critical, due_date
    """
    jobs_added = []
    
    if file:
        content = await file.read()
        text = content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(text))
        
        for row in reader:
            train = db.query(Train).filter(Train.train_id == row.get('train_id')).first()
            if not train:
                continue
            
            job = JobCard(
                train_id=train.id,
                job_id=row.get('job_id', f"WO-{datetime.now().strftime('%Y%m%d%H%M%S')}"),
                job_type=JobType(row.get('job_type', 'preventive')),
                priority=JobPriority(int(row.get('priority', 3))),
                status=JobStatus(row.get('status', 'OPEN')),
                title=row.get('title', 'Maintenance Task'),
                description=row.get('description', ''),
                related_component=row.get('component', ''),
                safety_critical=row.get('safety_critical', '').lower() in ['true', 'yes', '1', 'y'],
                due_date=datetime.fromisoformat(row.get('due_date')) if row.get('due_date') else None,
                estimated_downtime_hours=float(row.get('downtime_hours', 0))
            )
            db.add(job)
            jobs_added.append(job.job_id)
    
    elif data:
        json_data = json.loads(data)
        items = json_data if isinstance(json_data, list) else [json_data]
        
        for item in items:
            train = db.query(Train).filter(Train.train_id == item.get('train_id')).first()
            if not train:
                train = db.query(Train).filter(Train.id == item.get('train_id')).first()
            if not train:
                continue
            
            job = JobCard(
                train_id=train.id,
                job_id=item.get('job_id', f"WO-{datetime.now().strftime('%Y%m%d%H%M%S')}"),
                job_type=JobType(item.get('job_type', 'preventive')),
                priority=JobPriority(int(item.get('priority', 3))),
                status=JobStatus(item.get('status', 'OPEN')),
                title=item.get('title', 'Maintenance Task'),
                description=item.get('description', ''),
                related_component=item.get('related_component', item.get('component', '')),
                safety_critical=item.get('safety_critical', False),
                blocks_service=item.get('blocks_service', False),
                requires_ibl=item.get('requires_ibl', False),
                due_date=datetime.fromisoformat(item.get('due_date')) if item.get('due_date') else None,
                estimated_downtime_hours=float(item.get('estimated_downtime_hours', item.get('downtime_hours', 0))),
                parts_available=item.get('parts_available', True)
            )
            db.add(job)
            jobs_added.append(job.job_id)
    
    db.commit()
    return {"status": "success", "jobs_added": len(jobs_added), "job_ids": jobs_added}

@app.post("/api/upload/branding")
async def upload_branding(
    file: UploadFile = File(None),
    data: str = Form(None),
    db: Session = Depends(get_db)
):
    """Upload branding contracts via CSV or JSON"""
    contracts_added = []
    
    if file:
        content = await file.read()
        text = content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(text))
        
        for row in reader:
            train = db.query(Train).filter(Train.train_id == row.get('train_id')).first()
            if not train:
                continue
            
            contract = BrandingContract(
                train_id=train.id,
                brand_id=row.get('brand_id', f"BRAND-{datetime.now().strftime('%Y%m%d')}"),
                brand_name=row.get('brand_name', 'Unknown Brand'),
                campaign_name=row.get('campaign_name', ''),
                campaign_start=datetime.fromisoformat(row.get('campaign_start')) if row.get('campaign_start') else datetime.utcnow(),
                campaign_end=datetime.fromisoformat(row.get('campaign_end')) if row.get('campaign_end') else datetime.utcnow() + timedelta(days=90),
                priority=BrandingPriority(row.get('priority', 'silver')),
                target_exposure_hours_weekly=float(row.get('target_weekly_hours', 50)),
                target_exposure_hours_monthly=float(row.get('target_monthly_hours', 200)),
                penalty_per_hour_shortfall=float(row.get('penalty_rate', 100))
            )
            db.add(contract)
            contracts_added.append(contract.brand_name)
    
    elif data:
        json_data = json.loads(data)
        items = json_data if isinstance(json_data, list) else [json_data]
        
        for item in items:
            train = db.query(Train).filter(Train.train_id == item.get('train_id')).first()
            if not train:
                train = db.query(Train).filter(Train.id == item.get('train_id')).first()
            if not train:
                continue
            
            contract = BrandingContract(
                train_id=train.id,
                brand_id=item.get('brand_id', f"BRAND-{datetime.now().strftime('%Y%m%d')}"),
                brand_name=item.get('brand_name', 'Unknown Brand'),
                campaign_name=item.get('campaign_name', ''),
                campaign_start=datetime.fromisoformat(item.get('campaign_start')) if item.get('campaign_start') else datetime.utcnow(),
                campaign_end=datetime.fromisoformat(item.get('campaign_end')) if item.get('campaign_end') else datetime.utcnow() + timedelta(days=90),
                priority=BrandingPriority(item.get('priority', 'silver')),
                target_exposure_hours_weekly=float(item.get('target_exposure_hours_weekly', item.get('target_weekly_hours', 50))),
                target_exposure_hours_monthly=float(item.get('target_exposure_hours_monthly', item.get('target_monthly_hours', 200))),
                current_exposure_hours_week=float(item.get('current_exposure_hours_week', 0)),
                current_exposure_hours_month=float(item.get('current_exposure_hours_month', 0)),
                penalty_per_hour_shortfall=float(item.get('penalty_per_hour_shortfall', item.get('penalty_rate', 100))),
                required_time_band=TimeBand(item.get('required_time_band', 'all_day'))
            )
            db.add(contract)
            contracts_added.append(contract.brand_name)
    
    db.commit()
    return {"status": "success", "contracts_added": len(contracts_added), "brands": contracts_added}

@app.post("/api/upload/mileage")
async def upload_mileage(
    data: str = Form(...),
    db: Session = Depends(get_db)
):
    """Upload mileage data for trains"""
    meters_updated = []
    json_data = json.loads(data)
    items = json_data if isinstance(json_data, list) else [json_data]
    
    for item in items:
        train = db.query(Train).filter(Train.train_id == item.get('train_id')).first()
        if not train:
            train = db.query(Train).filter(Train.id == item.get('train_id')).first()
        if not train:
            continue
        
        # Check if meter exists
        meter = db.query(MileageMeter).filter(
            MileageMeter.train_id == train.id,
            MileageMeter.component_type == 'train'
        ).first()
        
        if meter:
            meter.lifetime_km = float(item.get('lifetime_km', meter.lifetime_km))
            meter.km_since_last_service = float(item.get('km_since_last_service', meter.km_since_last_service))
            meter.km_since_last_overhaul = float(item.get('km_since_last_overhaul', meter.km_since_last_overhaul))
            meter.updated_at = datetime.utcnow()
        else:
            meter = MileageMeter(
                train_id=train.id,
                component_type='train',
                lifetime_km=float(item.get('lifetime_km', 0)),
                km_since_last_service=float(item.get('km_since_last_service', 0)),
                km_since_last_overhaul=float(item.get('km_since_last_overhaul', 0)),
                service_threshold_km=float(item.get('service_threshold_km', 20000)),
                overhaul_threshold_km=float(item.get('overhaul_threshold_km', 100000)),
                avg_daily_km=float(item.get('avg_daily_km', 200))
            )
            db.add(meter)
        
        meters_updated.append(train.train_id)
    
    db.commit()
    return {"status": "success", "meters_updated": len(meters_updated), "trains": meters_updated}

@app.post("/api/upload/cleaning")
async def upload_cleaning(
    data: str = Form(...),
    db: Session = Depends(get_db)
):
    """Upload cleaning status for trains"""
    records_updated = []
    json_data = json.loads(data)
    items = json_data if isinstance(json_data, list) else [json_data]
    
    for item in items:
        train = db.query(Train).filter(Train.train_id == item.get('train_id')).first()
        if not train:
            train = db.query(Train).filter(Train.id == item.get('train_id')).first()
        if not train:
            continue
        
        record = db.query(CleaningRecord).filter(CleaningRecord.train_id == train.id).first()
        
        if record:
            if item.get('last_cleaned_at'):
                record.last_cleaned_at = datetime.fromisoformat(item['last_cleaned_at'])
            record.special_clean_required = item.get('special_clean_required', record.special_clean_required)
            record.special_clean_reason = item.get('special_clean_reason', record.special_clean_reason)
            record.vip_inspection_tomorrow = item.get('vip_inspection_tomorrow', record.vip_inspection_tomorrow)
            record.vip_inspection_notes = item.get('vip_inspection_notes', record.vip_inspection_notes)
            record.update_status()
        else:
            record = CleaningRecord(
                train_id=train.id,
                status=CleaningStatus(item.get('status', 'ok')),
                last_cleaned_at=datetime.fromisoformat(item['last_cleaned_at']) if item.get('last_cleaned_at') else datetime.utcnow(),
                special_clean_required=item.get('special_clean_required', False),
                special_clean_reason=item.get('special_clean_reason'),
                vip_inspection_tomorrow=item.get('vip_inspection_tomorrow', False),
                vip_inspection_notes=item.get('vip_inspection_notes')
            )
            db.add(record)
        
        records_updated.append(train.train_id)
    
    db.commit()
    return {"status": "success", "records_updated": len(records_updated), "trains": records_updated}

# ==================== Mock Data ====================

@app.post("/api/mock-data/generate")
async def generate_mock_data(
    clear_existing: bool = True,
    db: Session = Depends(get_db)
):
    """Generate mock fleet data with edge cases for demonstration"""
    generator = MockDataGenerator(db)
    counts = generator.generate_all(clear_existing=clear_existing)
    return {
        "status": "success",
        "message": "Mock data generated successfully",
        "counts": counts,
        "note": "This is demo data. Use /api/upload/* endpoints for real data."
    }

# ==================== Trains ====================

@app.get("/api/trains")
async def get_trains(
    status: Optional[str] = None,
    depot_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Train)
    
    if status:
        query = query.filter(Train.status == TrainStatus(status))
    if depot_id:
        query = query.filter(Train.depot_id == depot_id)
    
    trains = query.all()
    return {"trains": [t.to_dict() for t in trains]}

@app.get("/api/trains/{train_id}")
async def get_train(train_id: int, db: Session = Depends(get_db)):
    train = db.query(Train).filter(Train.id == train_id).first()
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")
    
    certificates = db.query(FitnessCertificate).filter(FitnessCertificate.train_id == train_id).all()
    job_cards = db.query(JobCard).filter(JobCard.train_id == train_id, JobCard.status != JobStatus.CLOSED).all()
    branding = db.query(BrandingContract).filter(BrandingContract.train_id == train_id, BrandingContract.campaign_end > datetime.utcnow()).all()
    mileage = db.query(MileageMeter).filter(MileageMeter.train_id == train_id).first()
    cleaning = db.query(CleaningRecord).filter(CleaningRecord.train_id == train_id).first()
    position = db.query(TrainPosition).filter(TrainPosition.train_id == train_id).first()
    
    return {
        "train": train.to_dict(),
        "fitness_certificates": [c.to_dict() for c in certificates],
        "job_cards": [j.to_dict() for j in job_cards],
        "branding_contracts": [b.to_dict() for b in branding],
        "mileage": mileage.to_dict() if mileage else None,
        "cleaning": cleaning.to_dict() if cleaning else None,
        "position": position.to_dict() if position else None
    }

@app.post("/api/trains")
async def create_train(
    data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Create a new train"""
    train = Train(
        train_id=data.get('train_id', f"TS-{data.get('train_number', 0)}"),
        train_number=int(data.get('train_number', 0)),
        name=data.get('name', ''),
        configuration=data.get('configuration', '3-car'),
        manufacturer=data.get('manufacturer', 'Alstom'),
        status=TrainStatus(data.get('status', 'active')),
        depot_id=data.get('depot_id', settings.default_depot),
        overall_health_score=float(data.get('overall_health_score', 100)),
        is_service_ready=data.get('status', 'active') == 'active'
    )
    
    if data.get('commissioning_date'):
        train.commissioning_date = datetime.fromisoformat(data['commissioning_date'])
    
    db.add(train)
    db.commit()
    
    return {"status": "success", "train": train.to_dict()}

@app.put("/api/trains/{train_id}")
async def update_train(train_id: int, data: Dict[str, Any], db: Session = Depends(get_db)):
    train = db.query(Train).filter(Train.id == train_id).first()
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")
    
    allowed_fields = ["status", "depot_id", "current_track", "current_position", "overall_health_score", "name"]
    for field in allowed_fields:
        if field in data:
            if field == "status":
                setattr(train, field, TrainStatus(data[field]))
            else:
                setattr(train, field, data[field])
    
    train.updated_at = datetime.utcnow()
    db.commit()
    
    return {"status": "success", "train": train.to_dict()}

# ==================== Fitness Certificates ====================

@app.get("/api/fitness-certificates")
async def get_certificates(
    train_id: Optional[int] = None,
    department: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(FitnessCertificate)
    
    if train_id:
        query = query.filter(FitnessCertificate.train_id == train_id)
    if department:
        query = query.filter(FitnessCertificate.department == Department(department))
    if status:
        query = query.filter(FitnessCertificate.status == CertificateStatus(status))
    
    certs = query.all()
    return {"certificates": [c.to_dict() for c in certs]}

@app.post("/api/fitness-certificates")
async def create_certificate(data: Dict[str, Any], db: Session = Depends(get_db)):
    # Support both train_id (database ID) and train_id string
    train_db_id = data.get('train_id')
    if isinstance(train_db_id, str) and train_db_id.startswith('TS-'):
        train = db.query(Train).filter(Train.train_id == train_db_id).first()
        if train:
            train_db_id = train.id
    
    cert = FitnessCertificate(
        train_id=train_db_id,
        certificate_number=data.get('certificate_number', f"CERT-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"),
        department=Department(data['department']),
        status=CertificateStatus(data.get('status', 'Valid')),
        criticality=Criticality(data.get('criticality', 'hard')),
        valid_from=datetime.fromisoformat(data['valid_from']) if data.get('valid_from') else datetime.utcnow(),
        valid_to=datetime.fromisoformat(data['valid_to']) if data.get('valid_to') else datetime.utcnow() + timedelta(days=30),
        is_conditional=data.get('is_conditional', False),
        condition_notes=data.get('condition_notes'),
        max_speed_restriction=data.get('max_speed_restriction'),
        emergency_override=data.get('emergency_override', False),
        override_approved_by=data.get('override_approved_by'),
        override_reason=data.get('override_reason'),
        remarks=data.get('remarks')
    )
    
    db.add(cert)
    db.commit()
    
    return {"status": "success", "certificate": cert.to_dict()}

@app.put("/api/fitness-certificates/{cert_id}")
async def update_certificate(cert_id: int, data: Dict[str, Any], db: Session = Depends(get_db)):
    cert = db.query(FitnessCertificate).filter(FitnessCertificate.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    if "status" in data:
        cert.status = CertificateStatus(data["status"])
    if "valid_to" in data:
        cert.valid_to = datetime.fromisoformat(data["valid_to"])
    if "emergency_override" in data:
        cert.emergency_override = data["emergency_override"]
        if data["emergency_override"]:
            cert.override_approved_by = data.get("override_approved_by")
            cert.override_reason = data.get("override_reason")
            cert.override_expires_at = datetime.fromisoformat(data["override_expires_at"]) if data.get("override_expires_at") else datetime.utcnow() + timedelta(hours=12)
    if "remarks" in data:
        cert.remarks = data["remarks"]
    
    cert.updated_at = datetime.utcnow()
    db.commit()
    
    return {"status": "success", "certificate": cert.to_dict()}

# ==================== Job Cards ====================

@app.get("/api/job-cards")
async def get_job_cards(
    train_id: Optional[int] = None,
    status: Optional[str] = None,
    safety_critical: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(JobCard)
    
    if train_id:
        query = query.filter(JobCard.train_id == train_id)
    if status:
        query = query.filter(JobCard.status == JobStatus(status))
    if safety_critical is not None:
        query = query.filter(JobCard.safety_critical == safety_critical)
    
    jobs = query.all()
    return {"job_cards": [j.to_dict() for j in jobs]}

@app.post("/api/job-cards")
async def create_job_card(data: Dict[str, Any], db: Session = Depends(get_db)):
    train_db_id = data.get('train_id')
    if isinstance(train_db_id, str) and train_db_id.startswith('TS-'):
        train = db.query(Train).filter(Train.train_id == train_db_id).first()
        if train:
            train_db_id = train.id
    
    job = JobCard(
        train_id=train_db_id,
        job_id=data.get('job_id', f"WO-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"),
        job_type=JobType(data['job_type']),
        priority=JobPriority(int(data.get('priority', 3))),
        status=JobStatus(data.get('status', 'OPEN')),
        title=data['title'],
        description=data.get('description'),
        related_component=data.get('related_component'),
        due_date=datetime.fromisoformat(data['due_date']) if data.get('due_date') else None,
        estimated_downtime_hours=float(data.get('estimated_downtime_hours', 0)),
        safety_critical=data.get('safety_critical', False),
        requires_ibl=data.get('requires_ibl', False),
        blocks_service=data.get('blocks_service', False),
        parts_available=data.get('parts_available', True)
    )
    
    db.add(job)
    db.commit()
    
    return {"status": "success", "job_card": job.to_dict()}

@app.put("/api/job-cards/{job_id}")
async def update_job_card(job_id: int, data: Dict[str, Any], db: Session = Depends(get_db)):
    job = db.query(JobCard).filter(JobCard.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job card not found")
    
    if "status" in data:
        job.status = JobStatus(data["status"])
    if "priority" in data:
        job.priority = JobPriority(int(data["priority"]))
    if "due_date" in data:
        job.due_date = datetime.fromisoformat(data["due_date"]) if data["due_date"] else None
    if "parts_available" in data:
        job.parts_available = data["parts_available"]
    if "safety_critical" in data:
        job.safety_critical = data["safety_critical"]
    
    job.updated_at = datetime.utcnow()
    db.commit()
    
    return {"status": "success", "job_card": job.to_dict()}

# ==================== Branding ====================

@app.get("/api/branding-contracts")
async def get_branding_contracts(
    train_id: Optional[int] = None,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    query = db.query(BrandingContract)
    
    if train_id:
        query = query.filter(BrandingContract.train_id == train_id)
    if active_only:
        query = query.filter(BrandingContract.campaign_end > datetime.utcnow())
    
    contracts = query.all()
    return {"contracts": [c.to_dict() for c in contracts]}

@app.post("/api/branding-contracts")
async def create_branding_contract(data: Dict[str, Any], db: Session = Depends(get_db)):
    train_db_id = data.get('train_id')
    if isinstance(train_db_id, str) and train_db_id.startswith('TS-'):
        train = db.query(Train).filter(Train.train_id == train_db_id).first()
        if train:
            train_db_id = train.id
    
    contract = BrandingContract(
        train_id=train_db_id,
        brand_id=data.get('brand_id', f"BRAND-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"),
        brand_name=data['brand_name'],
        campaign_name=data.get('campaign_name'),
        campaign_start=datetime.fromisoformat(data['campaign_start']) if data.get('campaign_start') else datetime.utcnow(),
        campaign_end=datetime.fromisoformat(data['campaign_end']) if data.get('campaign_end') else datetime.utcnow() + timedelta(days=90),
        priority=BrandingPriority(data.get('priority', 'silver')),
        target_exposure_hours_weekly=float(data.get('target_exposure_hours_weekly', 50)),
        target_exposure_hours_monthly=float(data.get('target_exposure_hours_monthly', 200)),
        target_trips_daily=int(data.get('target_trips_daily', 10)),
        required_time_band=TimeBand(data.get('required_time_band', 'all_day')),
        penalty_per_hour_shortfall=float(data.get('penalty_per_hour_shortfall', 100))
    )
    
    db.add(contract)
    db.commit()
    
    return {"status": "success", "contract": contract.to_dict()}

# ==================== Mileage ====================

@app.get("/api/mileage")
async def get_mileage(
    train_id: Optional[int] = None,
    near_threshold: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(MileageMeter)
    
    if train_id:
        query = query.filter(MileageMeter.train_id == train_id)
    if near_threshold:
        query = query.filter(MileageMeter.is_near_threshold == True)
    
    meters = query.all()
    return {"mileage_data": [m.to_dict() for m in meters]}

@app.put("/api/mileage/{meter_id}")
async def update_mileage(meter_id: int, data: Dict[str, Any], db: Session = Depends(get_db)):
    meter = db.query(MileageMeter).filter(MileageMeter.id == meter_id).first()
    if not meter:
        raise HTTPException(status_code=404, detail="Mileage meter not found")
    
    if "km_today" in data:
        old_km = meter.km_today
        meter.km_today = data["km_today"]
        meter.lifetime_km += (data["km_today"] - old_km)
        meter.km_since_last_service += (data["km_today"] - old_km)
    
    if "km_since_last_service" in data:
        meter.km_since_last_service = data["km_since_last_service"]
    
    meter.is_near_threshold = meter.get_km_to_threshold() < meter.warning_threshold_km
    meter.is_over_threshold = meter.get_km_to_threshold() <= 0
    meter.last_reading_at = datetime.utcnow()
    meter.updated_at = datetime.utcnow()
    db.commit()
    
    return {"status": "success", "mileage": meter.to_dict()}

# ==================== Cleaning ====================

@app.get("/api/cleaning")
async def get_cleaning_records(
    train_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(CleaningRecord)
    
    if train_id:
        query = query.filter(CleaningRecord.train_id == train_id)
    if status:
        query = query.filter(CleaningRecord.status == CleaningStatus(status))
    
    records = query.all()
    return {"cleaning_records": [r.to_dict() for r in records]}

@app.put("/api/cleaning/{record_id}")
async def update_cleaning_record(record_id: int, data: Dict[str, Any], db: Session = Depends(get_db)):
    record = db.query(CleaningRecord).filter(CleaningRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Cleaning record not found")
    
    if "last_cleaned_at" in data:
        record.last_cleaned_at = datetime.fromisoformat(data["last_cleaned_at"])
        record.last_cleaning_type = CleaningType(data.get("cleaning_type", "standard"))
        record.last_cleaned_by = data.get("cleaned_by")
    
    if "special_clean_required" in data:
        record.special_clean_required = data["special_clean_required"]
        record.special_clean_reason = data.get("special_clean_reason")
    
    if "vip_inspection_tomorrow" in data:
        record.vip_inspection_tomorrow = data["vip_inspection_tomorrow"]
        record.vip_inspection_notes = data.get("vip_inspection_notes")
    
    record.update_status()
    record.updated_at = datetime.utcnow()
    db.commit()
    
    return {"status": "success", "cleaning_record": record.to_dict()}

@app.get("/api/cleaning-bays")
async def get_cleaning_bays(db: Session = Depends(get_db)):
    bays = db.query(CleaningBay).all()
    return {"cleaning_bays": [b.to_dict() for b in bays]}

# ==================== Depot Layout ====================

@app.get("/api/depot/tracks")
async def get_depot_tracks(
    depot_id: Optional[str] = None,
    track_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(DepotTrack)
    
    if depot_id:
        query = query.filter(DepotTrack.depot_id == depot_id)
    if track_type:
        query = query.filter(DepotTrack.track_type == track_type)
    
    tracks = query.all()
    return {"tracks": [t.to_dict() for t in tracks]}

@app.get("/api/depot/positions")
async def get_train_positions(db: Session = Depends(get_db)):
    positions = db.query(TrainPosition).all()
    
    result = []
    for pos in positions:
        train = db.query(Train).filter(Train.id == pos.train_id).first()
        track = db.query(DepotTrack).filter(DepotTrack.id == pos.track_id).first()
        
        result.append({
            **pos.to_dict(),
            "train": train.to_dict() if train else None,
            "track": track.to_dict() if track else None
        })
    
    return {"positions": result}

# ==================== Optimization & Planning ====================

@app.post("/api/plans/generate")
async def generate_plan(
    plan_date: Optional[str] = None,
    generate_explanation: bool = True,
    db: Session = Depends(get_db)
):
    """Generate a new induction plan with AI-powered explanations"""
    optimizer = TrainInductionOptimizer(db)
    
    date = datetime.fromisoformat(plan_date) if plan_date else datetime.utcnow() + timedelta(days=1)
    
    plan = optimizer.optimize(plan_date=date)
    
    # Generate AI explanation if enabled
    ai_explanation = None
    if generate_explanation and is_ai_enabled():
        try:
            copilot = AICopilot(db)
            assignments = [a.to_dict() for a in plan.assignments]
            for a in assignments:
                train = db.query(Train).filter(Train.id == a['train_id']).first()
                a['train'] = train.to_dict() if train else None
            
            ai_explanation = await copilot.generate_plan_explanation(plan, assignments)
            plan.ai_explanation = ai_explanation
            db.commit()
        except Exception as e:
            print(f"AI explanation generation failed: {e}")
    
    return {
        "status": "success",
        "plan": plan.to_dict(),
        "assignments": [a.to_dict() for a in plan.assignments],
        "alerts": [a.to_dict() for a in plan.alerts],
        "ai_explanation": ai_explanation
    }

@app.get("/api/plans")
async def get_plans(
    status: Optional[str] = None,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    query = db.query(NightPlan)
    
    if status:
        query = query.filter(NightPlan.status == PlanStatus(status))
    
    plans = query.order_by(NightPlan.created_at.desc()).limit(limit).all()
    return {"plans": [p.to_dict() for p in plans]}

@app.get("/api/plans/{plan_id}")
async def get_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(NightPlan).filter(NightPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    assignments = db.query(PlanAssignment).filter(PlanAssignment.plan_id == plan_id).all()
    alerts = db.query(Alert).filter(Alert.plan_id == plan_id).all()
    
    enriched_assignments = []
    for a in assignments:
        train = db.query(Train).filter(Train.id == a.train_id).first()
        enriched_assignments.append({
            **a.to_dict(),
            "train": train.to_dict() if train else None
        })
    
    return {
        "plan": plan.to_dict(),
        "assignments": enriched_assignments,
        "alerts": [a.to_dict() for a in alerts]
    }

@app.get("/api/plans/{plan_id}/explanation")
async def get_plan_explanation(plan_id: int, regenerate: bool = False, db: Session = Depends(get_db)):
    """Get or generate AI explanation for a plan"""
    plan = db.query(NightPlan).filter(NightPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    if plan.ai_explanation and not regenerate:
        return {"explanation": plan.ai_explanation, "source": "cached"}
    
    if not is_ai_enabled():
        return {
            "explanation": "AI explanations require GEMINI_API_KEY to be configured.",
            "source": "disabled"
        }
    
    copilot = AICopilot(db)
    explanation = copilot.explain_plan(plan_id)
    
    plan.ai_explanation = explanation
    db.commit()
    
    return {"explanation": explanation, "source": "generated"}

@app.put("/api/plans/{plan_id}/approve")
async def approve_plan(plan_id: int, approved_by: str, db: Session = Depends(get_db)):
    plan = db.query(NightPlan).filter(NightPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    plan.status = PlanStatus.APPROVED
    plan.approved_by = approved_by
    plan.approved_at = datetime.utcnow()
    plan.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"status": "success", "plan": plan.to_dict()}

@app.post("/api/plans/{plan_id}/override")
async def override_assignment(plan_id: int, data: Dict[str, Any], db: Session = Depends(get_db)):
    plan = db.query(NightPlan).filter(NightPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    assignment = db.query(PlanAssignment).filter(
        PlanAssignment.plan_id == plan_id,
        PlanAssignment.train_id == data["train_id"]
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    override_log = OverrideLog(
        plan_id=plan_id,
        assignment_id=assignment.id,
        train_id=data["train_id"],
        original_assignment=assignment.assignment_type.value,
        new_assignment=data["new_assignment"],
        override_by=data["override_by"],
        override_role=data.get("override_role"),
        reason_category=data.get("reason_category", "Operational"),
        reason_details=data["reason"]
    )
    db.add(override_log)
    
    assignment.is_manual_override = True
    assignment.override_by = data["override_by"]
    assignment.override_reason = data["reason"]
    assignment.original_assignment = assignment.assignment_type.value
    assignment.assignment_type = AssignmentType(data["new_assignment"])
    
    plan.status = PlanStatus.MODIFIED
    plan.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"status": "success", "assignment": assignment.to_dict()}

# ==================== What-If Scenarios ====================

@app.post("/api/scenarios/run")
async def run_scenario(data: Dict[str, Any], db: Session = Depends(get_db)):
    optimizer = TrainInductionOptimizer(db)
    
    scenario = {
        "name": data.get("name", "What-If Scenario"),
        "unavailable_trains": data.get("unavailable_trains", data.get("unavailable_train_ids", [])),
        "force_ibl": data.get("force_ibl", data.get("force_ibl_ids", [])),
        "branding_weight": data.get("branding_weight"),
        "baseline_plan_id": data.get("baseline_plan_id")
    }
    
    plan = optimizer.optimize(scenario_overrides=scenario)
    
    baseline = None
    if data.get("baseline_plan_id"):
        baseline = db.query(NightPlan).filter(NightPlan.id == data["baseline_plan_id"]).first()
    
    return {
        "status": "success",
        "scenario_plan": plan.to_dict(),
        "assignments": [a.to_dict() for a in plan.assignments],
        "baseline_plan": baseline.to_dict() if baseline else None,
        "comparison": {
            "service_change": plan.trains_in_service - (baseline.trains_in_service if baseline else 0),
            "ibl_change": plan.trains_ibl - (baseline.trains_ibl if baseline else 0)
        } if baseline else None
    }

# ==================== Simulation Tool ====================

@app.get("/api/simulation/stations")
async def get_simulation_stations(db: Session = Depends(get_db)):
    """Get list of KMRL stations for simulation"""
    simulator = SimulationService(db)
    return {
        "stations": simulator.get_station_list(),
        "total_stations": len(simulator.stations),
        "route_length_km": 31.0
    }

@app.post("/api/simulation/passenger")
async def run_passenger_simulation(data: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Run passenger handling simulation with AI reasoning.
    
    Parameters:
    - time_of_day: "peak_morning" | "peak_evening" | "off_peak" | "late_night"
    - special_event: Optional event type (e.g., "football_match", "festival")
    - event_station: Station affected by event
    - expected_crowd_multiplier: 1.0 = normal, 2.0 = double
    - trains_available: Number of trains in service
    - simulation_duration_minutes: Duration to simulate
    """
    simulator = SimulationService(db)
    
    params = {
        "time_of_day": data.get("time_of_day", "off_peak"),
        "special_event": data.get("special_event"),
        "event_station": data.get("event_station"),
        "expected_crowd_multiplier": float(data.get("expected_crowd_multiplier", 1.0)),
        "trains_available": int(data.get("trains_available", 18)),
        "simulation_duration_minutes": int(data.get("simulation_duration_minutes", 60))
    }
    
    result = await simulator.run_passenger_simulation(params)
    return result

@app.post("/api/simulation/energy")
async def run_energy_simulation(data: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Run energy optimization simulation with AI reasoning.
    
    Parameters:
    - trains_in_service: Number of trains operating
    - operating_hours: Hours of operation
    - passenger_load_percent: Average load (0-100)
    - hvac_mode: "full" | "eco" | "off"
    - regen_braking: Enable regenerative braking
    - coasting_optimization: Enable coasting
    - speed_profile: "normal" | "eco" | "express"
    """
    simulator = SimulationService(db)
    
    params = {
        "trains_in_service": int(data.get("trains_in_service", 18)),
        "operating_hours": float(data.get("operating_hours", 16)),
        "passenger_load_percent": float(data.get("passenger_load_percent", 60)),
        "hvac_mode": data.get("hvac_mode", "full"),
        "regen_braking": data.get("regen_braking", True),
        "coasting_optimization": data.get("coasting_optimization", False),
        "speed_profile": data.get("speed_profile", "normal")
    }
    
    result = await simulator.run_energy_simulation(params)
    return result

@app.post("/api/simulation/combined")
async def run_combined_simulation(data: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Run combined passenger + energy simulation for holistic optimization.
    """
    simulator = SimulationService(db)
    
    params = {
        "time_of_day": data.get("time_of_day", "off_peak"),
        "special_event": data.get("special_event"),
        "event_station": data.get("event_station"),
        "expected_crowd_multiplier": float(data.get("expected_crowd_multiplier", 1.0)),
        "trains_in_service": int(data.get("trains_in_service", 18)),
        "operating_hours": float(data.get("operating_hours", 1)),
        "passenger_load_percent": float(data.get("passenger_load_percent", 60)),
        "hvac_mode": data.get("hvac_mode", "full"),
        "regen_braking": data.get("regen_braking", True),
        "coasting_optimization": data.get("coasting_optimization", False),
        "speed_profile": data.get("speed_profile", "normal")
    }
    
    result = await simulator.run_combined_simulation(params)
    return result

@app.post("/api/simulation/advertising")
async def run_advertising_simulation(data: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Simulate advertising/branding penalty scenarios.
    Calculates projected penalties and bonuses based on train deployment.
    """
    simulator = SimulationService(db)
    
    params = {
        "simulation_days": int(data.get("simulation_days", 7)),
        "trains_in_service": int(data.get("trains_in_service", 18)),
        "service_hours_per_day": float(data.get("service_hours_per_day", 16)),
        "peak_hour_percentage": float(data.get("peak_hour_percentage", 35)),
        "include_specific_contracts": data.get("include_specific_contracts"),
        "scenario": data.get("scenario", "normal")
    }
    
    result = await simulator.run_advertising_simulation(params)
    return result

@app.post("/api/simulation/shunting")
async def run_shunting_simulation(data: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Simulate depot shunting rearrangement scenarios.
    Plans optimal move sequences for train positioning.
    """
    simulator = SimulationService(db)
    
    params = {
        "target_sequence": data.get("target_sequence", []),
        "optimize_for": data.get("optimize_for", "balanced"),
        "available_shunters": int(data.get("available_shunters", 2)),
        "time_window_minutes": int(data.get("time_window_minutes", 120)),
        "prioritize_trains": data.get("prioritize_trains", [])
    }
    
    result = await simulator.run_shunting_simulation(params)
    return result

@app.get("/api/simulation/depot-layout")
async def get_depot_layout(db: Session = Depends(get_db)):
    """
    Get current depot layout and train positions for visualization.
    """
    simulator = SimulationService(db)
    layout = simulator.get_depot_layout()
    return {"layout": layout, "timestamp": datetime.utcnow().isoformat()}

@app.get("/api/simulation/branding-contracts")
async def get_active_branding_contracts(db: Session = Depends(get_db)):
    """
    Get active branding contracts for simulation selection.
    """
    contracts = db.query(BrandingContract).filter(
        BrandingContract.campaign_end > datetime.utcnow()
    ).all()
    return {
        "contracts": [c.to_dict() for c in contracts],
        "total": len(contracts)
    }

# ==================== AI Copilot ====================

@app.post("/api/copilot/chat")
async def copilot_chat(data: Dict[str, Any], db: Session = Depends(get_db)):
    copilot = AICopilot(db)
    
    message = data.get("message", "")
    context = data.get("context", {})
    
    if "train_id" in context:
        train = db.query(Train).filter(Train.id == context["train_id"]).first()
        if train:
            context["train"] = train.to_dict()
            
            optimizer = TrainInductionOptimizer(db)
            scores = optimizer._calculate_train_scores([train])
            context["scores"] = scores.get(train.id, {})
    
    if "plan_id" in context:
        plan = db.query(NightPlan).filter(NightPlan.id == context["plan_id"]).first()
        if plan:
            context["plan"] = plan.to_dict()
            
            if "train_id" in context:
                assignment = db.query(PlanAssignment).filter(
                    PlanAssignment.plan_id == context["plan_id"],
                    PlanAssignment.train_id == context["train_id"]
                ).first()
                if assignment:
                    context["assignment"] = assignment.to_dict()
    
    # Use async method directly
    response = await copilot.answer_question(message, context)
    
    return {
        "response": response,
        "ai_enabled": copilot.ai_enabled,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/copilot/explain-plan")
async def explain_plan_endpoint(plan_id: int, db: Session = Depends(get_db)):
    copilot = AICopilot(db)
    
    plan = db.query(NightPlan).filter(NightPlan.id == plan_id).first()
    if not plan:
        return {"explanation": "Plan not found.", "plan_id": plan_id, "ai_enabled": copilot.ai_enabled}
    
    assignments = db.query(PlanAssignment).filter(
        PlanAssignment.plan_id == plan_id
    ).all()
    
    assignment_dicts = []
    for a in assignments:
        train = db.query(Train).filter(Train.id == a.train_id).first()
        assignment_dicts.append({
            **a.to_dict(),
            'train': train.to_dict() if train else None
        })
    
    # Use async method directly
    explanation = await copilot.generate_plan_explanation(plan, assignment_dicts)
    
    return {
        "explanation": explanation,
        "plan_id": plan_id,
        "ai_enabled": copilot.ai_enabled
    }

@app.post("/api/copilot/explain-assignment")
async def explain_assignment(data: Dict[str, Any], db: Session = Depends(get_db)):
    """Get AI explanation for a specific train assignment"""
    copilot = AICopilot(db)
    
    train_id = data.get("train_id")
    plan_id = data.get("plan_id")
    
    train_data = await get_train(train_id, db)
    
    assignment = None
    if plan_id:
        assignment = db.query(PlanAssignment).filter(
            PlanAssignment.plan_id == plan_id,
            PlanAssignment.train_id == train_id
        ).first()
    
    if not assignment:
        return {"explanation": "No assignment found for this train in the specified plan."}
    
    explanation = await copilot.generate_assignment_explanation(assignment.to_dict(), train_data)
    
    return {
        "explanation": explanation,
        "train_id": train_id,
        "assignment_type": assignment.assignment_type.value,
        "ai_enabled": copilot.ai_enabled
    }

@app.post("/api/copilot/parse-scenario")
async def parse_scenario(data: Dict[str, Any], db: Session = Depends(get_db)):
    copilot = AICopilot(db)
    
    scenario = await copilot.parse_natural_language_scenario(data.get("text", ""))
    
    return {
        "parsed_scenario": scenario,
        "original_text": data.get("text", ""),
        "ai_enabled": copilot.ai_enabled
    }

@app.get("/api/copilot/daily-briefing")
async def get_daily_briefing(db: Session = Depends(get_db)):
    """Get AI-generated daily operations briefing"""
    copilot = AICopilot(db)
    
    briefing = await copilot.generate_daily_briefing()
    
    return {
        "briefing": briefing,
        "date": datetime.utcnow().strftime("%Y-%m-%d"),
        "ai_enabled": copilot.ai_enabled
    }

@app.post("/api/copilot/validate-data")
async def validate_data_entry(data: Dict[str, Any], db: Session = Depends(get_db)):
    """AI-powered data validation for manual entries"""
    copilot = AICopilot(db)
    
    data_type = data.get("data_type", "unknown")
    entry_data = data.get("data", {})
    
    validation = await copilot.validate_data_entry(data_type, entry_data)
    
    return {
        "validation": validation,
        "ai_enabled": copilot.ai_enabled
    }

# ==================== Alerts ====================

@app.get("/api/alerts")
async def get_alerts(
    plan_id: Optional[int] = None,
    train_id: Optional[int] = None,
    severity: Optional[str] = None,
    resolved: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    
    if plan_id:
        query = query.filter(Alert.plan_id == plan_id)
    if train_id:
        query = query.filter(Alert.train_id == train_id)
    if severity:
        query = query.filter(Alert.severity == AlertSeverity(severity))
    if resolved is not None:
        query = query.filter(Alert.is_resolved == resolved)
    
    alerts = query.order_by(Alert.created_at.desc()).all()
    return {"alerts": [a.to_dict() for a in alerts]}

@app.put("/api/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: int, acknowledged_by: str, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.is_acknowledged = True
    alert.acknowledged_by = acknowledged_by
    alert.acknowledged_at = datetime.utcnow()
    
    db.commit()
    
    return {"status": "success", "alert": alert.to_dict()}

@app.put("/api/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: int, data: Dict[str, Any], db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.is_resolved = True
    alert.resolved_by = data.get("resolved_by")
    alert.resolved_at = datetime.utcnow()
    alert.resolution_notes = data.get("resolution_notes")
    
    db.commit()
    
    return {"status": "success", "alert": alert.to_dict()}

# ==================== Dashboard Stats ====================

@app.get("/api/dashboard/summary")
async def get_dashboard_summary(db: Session = Depends(get_db)):
    total_trains = db.query(Train).count()
    active_trains = db.query(Train).filter(Train.status == TrainStatus.ACTIVE).count()
    
    expired_certs = db.query(FitnessCertificate).filter(
        FitnessCertificate.status == CertificateStatus.EXPIRED
    ).count()
    expiring_certs = db.query(FitnessCertificate).filter(
        FitnessCertificate.status == CertificateStatus.EXPIRING_SOON
    ).count()
    
    open_jobs = db.query(JobCard).filter(
        JobCard.status.in_([JobStatus.OPEN, JobStatus.IN_PROGRESS])
    ).count()
    safety_critical_jobs = db.query(JobCard).filter(
        JobCard.safety_critical == True,
        JobCard.status != JobStatus.CLOSED
    ).count()
    
    active_contracts = db.query(BrandingContract).filter(
        BrandingContract.campaign_end > datetime.utcnow()
    ).count()
    
    at_risk_branding = db.query(BrandingContract).filter(
        BrandingContract.campaign_end > datetime.utcnow(),
        BrandingContract.is_compliant == False
    ).count()
    
    cleaning_overdue = db.query(CleaningRecord).filter(
        CleaningRecord.status == CleaningStatus.OVERDUE
    ).count()
    
    unresolved_alerts = db.query(Alert).filter(Alert.is_resolved == False).count()
    critical_alerts = db.query(Alert).filter(
        Alert.is_resolved == False,
        Alert.severity == AlertSeverity.CRITICAL
    ).count()
    
    latest_plan = db.query(NightPlan).order_by(NightPlan.created_at.desc()).first()
    
    return {
        "fleet": {
            "total": total_trains,
            "active": active_trains,
            "under_maintenance": total_trains - active_trains
        },
        "certificates": {
            "expired": expired_certs,
            "expiring_soon": expiring_certs
        },
        "maintenance": {
            "open_jobs": open_jobs,
            "safety_critical": safety_critical_jobs
        },
        "branding": {
            "active_contracts": active_contracts,
            "at_risk": at_risk_branding
        },
        "cleaning": {
            "overdue": cleaning_overdue
        },
        "alerts": {
            "unresolved": unresolved_alerts,
            "critical": critical_alerts
        },
        "latest_plan": latest_plan.to_dict() if latest_plan else None,
        "ai_enabled": is_ai_enabled(),
        "timestamp": datetime.utcnow().isoformat()
    }

# ==================== Override Logs ====================

@app.get("/api/override-logs")
async def get_override_logs(
    plan_id: Optional[int] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(OverrideLog)
    
    if plan_id:
        query = query.filter(OverrideLog.plan_id == plan_id)
    
    logs = query.order_by(OverrideLog.created_at.desc()).limit(limit).all()
    return {"logs": [l.to_dict() for l in logs]}


# ==================== Authentication ====================

@app.post("/api/auth/verify-token")
async def verify_phone_token(
    data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """
    Verify phone OTP token and return/create user.
    DEV MODE: Accepts any token and creates user if not exists.
    PRODUCTION: Should verify Firebase ID token.
    """
    id_token = data.get("id_token")
    phone_number = data.get("phone_number", "").replace("+91", "").replace(" ", "")
    
    if not id_token or not phone_number:
        raise HTTPException(status_code=400, detail="Missing id_token or phone_number")
    
    # Check if user exists in database
    user = db.query(User).filter(User.phone_number == phone_number).first()
    
    if not user:
        # Create new user - assign role based on phone number for DEV testing
        # Admin: ends with 0, Worker: ends with 1-5, User: ends with 6-9
        last_digit = int(phone_number[-1]) if phone_number else 0
        if last_digit == 0:
            role = "admin"
        elif last_digit <= 5:
            role = "worker"
        else:
            role = "user"
        
        user = User(
            phone_number=phone_number,
            name=f"User {phone_number[-4:]}",
            email=f"user{phone_number[-4:]}@kmrl.dev",
            employee_id=f"EMP{phone_number[-4:]}",
            department="Operations",
            role=role,
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Generate token using auth service
    token = create_token(user)
    
    return {
        "status": "success",
        "user": user.to_dict(),
        "token": token,
        "message": f"Welcome! Role: {user.role}"
    }

@app.post("/api/auth/login")
async def login_email(
    data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Login with email and password"""
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Missing email or password")
    
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")
    
    token = create_token(user)
    
    return {
        "status": "success",
        "user": user.to_dict(),
        "token": token
    }

@app.post("/api/auth/register")
async def register_email(
    data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Register with email and password (admin only in production)"""
    email = data.get("email")
    password = data.get("password")
    name = data.get("name")
    role = data.get("role", "user")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Missing email or password")
    
    # Check if email exists
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=email,
        password_hash=hash_password(password),
        name=name,
        role=role,
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_token(user)
    
    return {
        "status": "success",
        "user": user.to_dict(),
        "token": token
    }

@app.get("/api/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user"""
    return {"user": current_user.to_dict()}

@app.post("/api/auth/logout")
async def logout():
    """Logout user (client should clear token)"""
    return {"status": "success", "message": "Logged out"}

@app.put("/api/auth/profile")
async def update_profile(
    data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    if data.get("name"):
        current_user.name = data["name"]
    if data.get("department"):
        current_user.department = data["department"]
    if data.get("employee_id"):
        current_user.employee_id = data["employee_id"]
    
    db.commit()
    db.refresh(current_user)
    
    return {"status": "success", "user": current_user.to_dict()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.host, port=settings.port)
