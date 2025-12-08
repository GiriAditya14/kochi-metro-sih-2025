"""
File Processing Service - Cloudinary Storage + Groq LLM Parsing
Handles CSV and PDF uploads, stores in Cloudinary, extracts data using AI.
"""

import os
import io
import json
import csv
import tempfile
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime

# Cloudinary
try:
    import cloudinary
    import cloudinary.uploader
    import cloudinary.api
    CLOUDINARY_AVAILABLE = True
except ImportError:
    CLOUDINARY_AVAILABLE = False

# Groq
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

# PDF parsing
try:
    import PyPDF2
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False

from sqlalchemy.orm import Session

from ..config import settings, is_cloudinary_enabled, is_groq_enabled, get_groq_api_key
from ..models import (
    Train, TrainStatus,
    FitnessCertificate, Department, CertificateStatus, Criticality,
    JobCard, JobType, JobStatus, JobPriority,
    BrandingContract, BrandingPriority, TimeBand,
    MileageMeter, CleaningRecord, CleaningStatus
)


class FileProcessor:
    """
    Handles file uploads, storage, and intelligent data extraction.
    - Stores files in Cloudinary
    - Parses CSV directly
    - Uses Groq LLM to extract data from PDFs and unstructured text
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.cloudinary_enabled = False
        self.groq_client = None
        
        # Initialize Cloudinary
        if CLOUDINARY_AVAILABLE and is_cloudinary_enabled():
            try:
                if settings.cloudinary_url:
                    cloudinary.config(cloudinary_url=settings.cloudinary_url)
                else:
                    cloudinary.config(
                        cloud_name=settings.cloudinary_cloud_name,
                        api_key=settings.cloudinary_api_key,
                        api_secret=settings.cloudinary_api_secret
                    )
                self.cloudinary_enabled = True
                print("✓ Cloudinary initialized")
            except Exception as e:
                print(f"✗ Cloudinary init failed: {e}")
        
        # Initialize Groq
        if GROQ_AVAILABLE and is_groq_enabled():
            try:
                self.groq_client = Groq(api_key=get_groq_api_key())
                print("✓ Groq LLM initialized")
            except Exception as e:
                print(f"✗ Groq init failed: {e}")
    
    async def upload_to_cloudinary(self, file_content: bytes, filename: str, 
                                    resource_type: str = "auto") -> Optional[Dict]:
        """Upload file to Cloudinary and return URL"""
        if not self.cloudinary_enabled:
            return None
        
        try:
            # Create temp file
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as tmp:
                tmp.write(file_content)
                tmp_path = tmp.name
            
            # Upload to Cloudinary
            result = cloudinary.uploader.upload(
                tmp_path,
                folder="kmrl_uploads",
                resource_type=resource_type,
                public_id=f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{filename}",
                tags=["kmrl", "data_import"]
            )
            
            # Cleanup temp file
            os.unlink(tmp_path)
            
            return {
                "url": result.get("secure_url"),
                "public_id": result.get("public_id"),
                "format": result.get("format"),
                "size": result.get("bytes")
            }
        except Exception as e:
            print(f"Cloudinary upload error: {e}")
            return None
    
    async def process_csv(self, content: bytes, data_type: str) -> Dict[str, Any]:
        """Process CSV file and extract structured data"""
        try:
            text = content.decode('utf-8')
            reader = csv.DictReader(io.StringIO(text))
            rows = list(reader)
            
            if not rows:
                return {"success": False, "error": "Empty CSV file"}
            
            # Get schema fields for this data type
            schema = self._get_schema(data_type)
            
            # If Groq is available, use it to map columns intelligently
            if self.groq_client:
                mapped_data = await self._groq_map_csv_columns(rows, schema, data_type)
                return {
                    "success": True,
                    "records": mapped_data,
                    "count": len(mapped_data),
                    "method": "groq_intelligent_mapping"
                }
            else:
                # Direct mapping
                return {
                    "success": True,
                    "records": rows,
                    "count": len(rows),
                    "method": "direct_mapping"
                }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def process_pdf(self, content: bytes, data_type: str) -> Dict[str, Any]:
        """Process PDF file using Groq LLM to extract structured data"""
        if not PDF_AVAILABLE:
            return {"success": False, "error": "PyPDF2 not installed"}
        
        try:
            # Extract text from PDF
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            
            if not text.strip():
                return {"success": False, "error": "Could not extract text from PDF"}
            
            # Use Groq to extract structured data
            if self.groq_client:
                extracted = await self._groq_extract_from_text(text, data_type)
                return {
                    "success": True,
                    "records": extracted,
                    "count": len(extracted),
                    "method": "groq_pdf_extraction",
                    "raw_text_length": len(text)
                }
            else:
                return {
                    "success": False,
                    "error": "Groq LLM required for PDF parsing",
                    "raw_text": text[:1000]  # Return first 1000 chars
                }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _groq_map_csv_columns(self, rows: List[Dict], schema: Dict, 
                                     data_type: str) -> List[Dict]:
        """Use Groq to intelligently map CSV columns to schema fields"""
        if not rows:
            return []
        
        # Get sample row
        sample = rows[0]
        csv_columns = list(sample.keys())
        
        prompt = f"""You are a data mapping assistant for a metro rail train management system.

Given CSV columns: {csv_columns}
Target schema for {data_type}: {json.dumps(schema, indent=2)}

Map each CSV column to the appropriate schema field. Some columns might not have matches.
Return a JSON object mapping CSV column names to schema field names.

Example response format:
{{"csv_column_name": "schema_field_name", ...}}

Only include mappings where there's a clear match. Use null for CSV columns that don't match any schema field.
"""

        try:
            response = self.groq_client.chat.completions.create(
                model=settings.groq_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=1000
            )
            
            mapping_text = response.choices[0].message.content
            
            # Extract JSON from response
            if "```json" in mapping_text:
                mapping_text = mapping_text.split("```json")[1].split("```")[0]
            elif "```" in mapping_text:
                mapping_text = mapping_text.split("```")[1].split("```")[0]
            
            column_mapping = json.loads(mapping_text)
            
            # Apply mapping to all rows
            mapped_rows = []
            for row in rows:
                mapped_row = {}
                for csv_col, schema_field in column_mapping.items():
                    if schema_field and csv_col in row:
                        mapped_row[schema_field] = row[csv_col]
                mapped_rows.append(mapped_row)
            
            return mapped_rows
        except Exception as e:
            print(f"Groq mapping error: {e}")
            # Fallback to direct mapping
            return rows
    
    async def _groq_extract_from_text(self, text: str, data_type: str) -> List[Dict]:
        """Use Groq to extract structured data from unstructured text"""
        schema = self._get_schema(data_type)
        
        prompt = f"""You are a data extraction assistant for a metro rail train management system.

Extract structured data from the following document text. The data should be formatted as {data_type} records.

Target schema:
{json.dumps(schema, indent=2)}

Document text:
---
{text[:4000]}  # Limit to prevent token overflow
---

Extract all {data_type} records found in the document.
Return a JSON array of objects matching the schema.

Important:
- Only include fields that are clearly present in the document
- Use appropriate data types (dates as ISO format, numbers as numbers)
- If multiple records are found, return all of them
- Be conservative - only extract data you're confident about

Response format (JSON array only, no explanation):
[{{"field1": "value1", ...}}, ...]
"""

        try:
            response = self.groq_client.chat.completions.create(
                model=settings.groq_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=4000
            )
            
            result_text = response.choices[0].message.content
            
            # Extract JSON array from response
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0]
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0]
            
            # Try to parse as JSON
            extracted = json.loads(result_text)
            
            if isinstance(extracted, list):
                return extracted
            elif isinstance(extracted, dict):
                return [extracted]
            else:
                return []
        except Exception as e:
            print(f"Groq extraction error: {e}")
            return []
    
    def _get_schema(self, data_type: str) -> Dict:
        """Get schema definition for each data type"""
        schemas = {
            "trains": {
                "train_id": "string (e.g., TS-201)",
                "train_number": "integer",
                "name": "string",
                "configuration": "string (3-car or 6-car)",
                "status": "string (active, under_maintenance, out_of_service)",
                "depot_id": "string (default: MUTTOM)",
                "overall_health_score": "float (0-100)"
            },
            "certificates": {
                "train_id": "string (e.g., TS-201)",
                "department": "string (RollingStock, Signalling, Telecom)",
                "status": "string (Valid, ExpiringSoon, Expired, Suspended)",
                "valid_from": "date (ISO format)",
                "valid_to": "date (ISO format)",
                "criticality": "string (hard, soft, monitor)",
                "remarks": "string",
                "is_conditional": "boolean",
                "condition_notes": "string",
                "emergency_override": "boolean",
                "override_approved_by": "string",
                "override_reason": "string"
            },
            "job-cards": {
                "train_id": "string (e.g., TS-201)",
                "job_id": "string (work order number)",
                "title": "string",
                "description": "string",
                "job_type": "string (preventive, corrective, inspection, overhaul, emergency)",
                "priority": "integer (1-5, 1=critical)",
                "status": "string (OPEN, IN_PROGRESS, PENDING_PARTS, DEFERRED, CLOSED)",
                "related_component": "string (bogie, brake, door, HVAC, traction, etc.)",
                "safety_critical": "boolean",
                "requires_ibl": "boolean",
                "due_date": "date (ISO format)",
                "estimated_downtime_hours": "float",
                "parts_available": "boolean"
            },
            "branding": {
                "train_id": "string (e.g., TS-201)",
                "brand_name": "string",
                "campaign_name": "string",
                "priority": "string (platinum, gold, silver, bronze)",
                "campaign_start": "date (ISO format)",
                "campaign_end": "date (ISO format)",
                "target_exposure_hours_weekly": "float",
                "target_exposure_hours_monthly": "float",
                "penalty_per_hour_shortfall": "float",
                "required_time_band": "string (all_day, peak_only, off_peak)"
            },
            "mileage": {
                "train_id": "string (e.g., TS-201)",
                "lifetime_km": "float",
                "km_since_last_service": "float",
                "km_since_last_overhaul": "float",
                "service_threshold_km": "float (default: 20000)",
                "overhaul_threshold_km": "float (default: 100000)",
                "avg_daily_km": "float"
            },
            "cleaning": {
                "train_id": "string (e.g., TS-201)",
                "status": "string (ok, due, overdue, special_required)",
                "last_cleaned_at": "datetime (ISO format)",
                "special_clean_required": "boolean",
                "special_clean_reason": "string",
                "vip_inspection_tomorrow": "boolean",
                "vip_inspection_notes": "string"
            }
        }
        return schemas.get(data_type, {})
    
    async def process_and_save(self, content: bytes, filename: str, 
                                data_type: str, store_in_cloudinary: bool = True) -> Dict:
        """
        Complete pipeline: Upload to Cloudinary, parse file, save to database.
        """
        result = {
            "filename": filename,
            "data_type": data_type,
            "cloudinary": None,
            "parsed": None,
            "saved": None
        }
        
        parsed = {"success": False, "error": "Unknown error", "records": [], "count": 0}
        
        try:
            # 1. Upload to Cloudinary (if enabled)
            if store_in_cloudinary and self.cloudinary_enabled:
                try:
                    cloudinary_result = await self.upload_to_cloudinary(content, filename)
                    result["cloudinary"] = cloudinary_result
                except Exception as e:
                    print(f"Cloudinary upload failed: {e}")
            
            # 2. Parse file based on type
            file_ext = os.path.splitext(filename)[1].lower()
            
            if file_ext == '.csv':
                parsed = await self.process_csv(content, data_type)
            elif file_ext == '.pdf':
                parsed = await self.process_pdf(content, data_type)
            else:
                # Try as text
                try:
                    text = content.decode('utf-8')
                    if self.groq_client:
                        extracted = await self._groq_extract_from_text(text, data_type)
                        parsed = {"success": True, "records": extracted, "count": len(extracted), "method": "groq"}
                    else:
                        parsed = {"success": False, "error": "Unknown file type and no Groq for parsing", "records": [], "count": 0}
                except Exception as e:
                    parsed = {"success": False, "error": f"Could not parse file: {str(e)}", "records": [], "count": 0}
            
            result["parsed"] = parsed
            
            # 3. Save to database
            if parsed and parsed.get("success") and parsed.get("records"):
                saved = await self._save_to_database(parsed["records"], data_type)
                result["saved"] = saved
            else:
                result["saved"] = {"saved_count": 0, "errors": [parsed.get("error", "No records to save")]}
                
        except Exception as e:
            result["parsed"] = {"success": False, "error": str(e), "records": [], "count": 0}
            result["saved"] = {"saved_count": 0, "errors": [str(e)]}
        
        return result
    
    async def _save_to_database(self, records: List[Dict], data_type: str) -> Dict:
        """Save parsed records to database"""
        saved_count = 0
        errors = []
        
        for record in records:
            try:
                if data_type == "trains":
                    await self._save_train(record)
                elif data_type == "certificates":
                    await self._save_certificate(record)
                elif data_type == "job-cards":
                    await self._save_job_card(record)
                elif data_type == "branding":
                    await self._save_branding(record)
                elif data_type == "mileage":
                    await self._save_mileage(record)
                elif data_type == "cleaning":
                    await self._save_cleaning(record)
                saved_count += 1
            except Exception as e:
                errors.append({"record": record, "error": str(e)})
        
        self.db.commit()
        
        return {
            "saved_count": saved_count,
            "error_count": len(errors),
            "errors": errors[:5] if errors else []  # Return first 5 errors
        }
    
    async def _save_train(self, data: Dict):
        """Save train record"""
        train = Train(
            train_id=data.get('train_id', f"TS-{data.get('train_number', 0)}"),
            train_number=int(data.get('train_number', 0)),
            name=data.get('name', ''),
            configuration=data.get('configuration', '3-car'),
            status=TrainStatus(data.get('status', 'active')),
            depot_id=data.get('depot_id', 'MUTTOM'),
            overall_health_score=float(data.get('overall_health_score', 100)),
            is_service_ready=data.get('status', 'active') == 'active'
        )
        self.db.add(train)
    
    async def _save_certificate(self, data: Dict):
        """Save certificate record"""
        # Find train
        train = self.db.query(Train).filter(
            Train.train_id == data.get('train_id')
        ).first()
        
        if not train:
            raise ValueError(f"Train {data.get('train_id')} not found")
        
        cert = FitnessCertificate(
            train_id=train.id,
            certificate_number=data.get('certificate_number', f"CERT-{datetime.now().strftime('%Y%m%d%H%M%S')}"),
            department=Department(data.get('department', 'RollingStock')),
            status=CertificateStatus(data.get('status', 'Valid')),
            criticality=Criticality(data.get('criticality', 'hard')),
            valid_from=self._parse_date(data.get('valid_from')),
            valid_to=self._parse_date(data.get('valid_to')),
            is_conditional=data.get('is_conditional', False),
            condition_notes=data.get('condition_notes'),
            emergency_override=data.get('emergency_override', False),
            override_approved_by=data.get('override_approved_by'),
            override_reason=data.get('override_reason'),
            remarks=data.get('remarks', '')
        )
        self.db.add(cert)
    
    async def _save_job_card(self, data: Dict):
        """Save job card record"""
        train = self.db.query(Train).filter(
            Train.train_id == data.get('train_id')
        ).first()
        
        if not train:
            raise ValueError(f"Train {data.get('train_id')} not found")
        
        job = JobCard(
            train_id=train.id,
            job_id=data.get('job_id', f"WO-{datetime.now().strftime('%Y%m%d%H%M%S')}"),
            job_type=JobType(data.get('job_type', 'preventive')),
            priority=JobPriority(int(data.get('priority', 3))),
            status=JobStatus(data.get('status', 'OPEN')),
            title=data.get('title', 'Maintenance Task'),
            description=data.get('description', ''),
            related_component=data.get('related_component', ''),
            safety_critical=self._parse_bool(data.get('safety_critical', False)),
            requires_ibl=self._parse_bool(data.get('requires_ibl', False)),
            blocks_service=self._parse_bool(data.get('blocks_service', False)),
            due_date=self._parse_date(data.get('due_date')),
            estimated_downtime_hours=float(data.get('estimated_downtime_hours', 0)),
            parts_available=self._parse_bool(data.get('parts_available', True))
        )
        self.db.add(job)
    
    async def _save_branding(self, data: Dict):
        """Save branding contract"""
        train = self.db.query(Train).filter(
            Train.train_id == data.get('train_id')
        ).first()
        
        if not train:
            raise ValueError(f"Train {data.get('train_id')} not found")
        
        contract = BrandingContract(
            train_id=train.id,
            brand_id=data.get('brand_id', f"BRAND-{datetime.now().strftime('%Y%m%d')}"),
            brand_name=data.get('brand_name', 'Unknown Brand'),
            campaign_name=data.get('campaign_name', ''),
            campaign_start=self._parse_date(data.get('campaign_start')),
            campaign_end=self._parse_date(data.get('campaign_end')),
            priority=BrandingPriority(data.get('priority', 'silver')),
            target_exposure_hours_weekly=float(data.get('target_exposure_hours_weekly', 50)),
            target_exposure_hours_monthly=float(data.get('target_exposure_hours_monthly', 200)),
            penalty_per_hour_shortfall=float(data.get('penalty_per_hour_shortfall', 100)),
            required_time_band=TimeBand(data.get('required_time_band', 'all_day'))
        )
        self.db.add(contract)
    
    async def _save_mileage(self, data: Dict):
        """Save mileage record"""
        train = self.db.query(Train).filter(
            Train.train_id == data.get('train_id')
        ).first()
        
        if not train:
            raise ValueError(f"Train {data.get('train_id')} not found")
        
        # Update existing or create new
        meter = self.db.query(MileageMeter).filter(
            MileageMeter.train_id == train.id,
            MileageMeter.component_type == 'train'
        ).first()
        
        if meter:
            meter.lifetime_km = float(data.get('lifetime_km', meter.lifetime_km))
            meter.km_since_last_service = float(data.get('km_since_last_service', meter.km_since_last_service))
            meter.km_since_last_overhaul = float(data.get('km_since_last_overhaul', meter.km_since_last_overhaul))
            meter.updated_at = datetime.utcnow()
        else:
            meter = MileageMeter(
                train_id=train.id,
                component_type='train',
                lifetime_km=float(data.get('lifetime_km', 0)),
                km_since_last_service=float(data.get('km_since_last_service', 0)),
                km_since_last_overhaul=float(data.get('km_since_last_overhaul', 0)),
                service_threshold_km=float(data.get('service_threshold_km', 20000)),
                overhaul_threshold_km=float(data.get('overhaul_threshold_km', 100000)),
                avg_daily_km=float(data.get('avg_daily_km', 200))
            )
            self.db.add(meter)
    
    async def _save_cleaning(self, data: Dict):
        """Save cleaning record"""
        train = self.db.query(Train).filter(
            Train.train_id == data.get('train_id')
        ).first()
        
        if not train:
            raise ValueError(f"Train {data.get('train_id')} not found")
        
        record = self.db.query(CleaningRecord).filter(
            CleaningRecord.train_id == train.id
        ).first()
        
        if record:
            if data.get('last_cleaned_at'):
                record.last_cleaned_at = self._parse_date(data['last_cleaned_at'])
            record.special_clean_required = self._parse_bool(data.get('special_clean_required', record.special_clean_required))
            record.special_clean_reason = data.get('special_clean_reason', record.special_clean_reason)
            record.vip_inspection_tomorrow = self._parse_bool(data.get('vip_inspection_tomorrow', record.vip_inspection_tomorrow))
            record.vip_inspection_notes = data.get('vip_inspection_notes', record.vip_inspection_notes)
            record.update_status()
        else:
            record = CleaningRecord(
                train_id=train.id,
                status=CleaningStatus(data.get('status', 'ok')),
                last_cleaned_at=self._parse_date(data.get('last_cleaned_at')) or datetime.utcnow(),
                special_clean_required=self._parse_bool(data.get('special_clean_required', False)),
                special_clean_reason=data.get('special_clean_reason'),
                vip_inspection_tomorrow=self._parse_bool(data.get('vip_inspection_tomorrow', False)),
                vip_inspection_notes=data.get('vip_inspection_notes')
            )
            self.db.add(record)
    
    def _parse_date(self, value) -> Optional[datetime]:
        """Parse date from various formats"""
        if not value:
            return None
        if isinstance(value, datetime):
            return value
        try:
            return datetime.fromisoformat(str(value).replace('Z', '+00:00'))
        except:
            try:
                return datetime.strptime(str(value), '%Y-%m-%d')
            except:
                return None
    
    def _parse_bool(self, value) -> bool:
        """Parse boolean from various formats"""
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.lower() in ['true', 'yes', '1', 'y']
        return bool(value)

