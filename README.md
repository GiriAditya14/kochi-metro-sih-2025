SIH Grand Finale 2025
Problem Statement ID: SIH25081
Team Name: HASTE
Team ID: 85842
Nodal Centre: NIT Durgapur
College Name: Oriental Institute of Science and Technology, Bhopal
Team Leader: Chaitanya Sharma
Member 1: Sanju Kumari
Member 2: Aditya Giri
Member 3: Ansh Mishra
Member 4: Shrey Shrivastava
Member 5: Harshawardhan Shrivastava# 🚇 KMRL Train Induction Planning System

<div align="center">

![KMRL](https://img.shields.io/badge/KMRL-Kochi%20Metro-1a365d?style=for-the-badge)
![SIH 2025](https://img.shields.io/badge/SIH-Grand%20Finale-ed8936?style=for-the-badge)
![AI Powered](https://img.shields.io/badge/AI-Gemini%20+%20Groq-8b5cf6?style=for-the-badge)

**AI-powered multi-objective constraint optimization for train induction planning**

*Smart India Hackathon 2025 - Problem Statement: KMRL Train Fleet Optimization*

</div>

---

## 📋 Problem Statement

Every night between **21:00–23:00**, KMRL supervisors must decide for **25 trainsets** (expanding to 40):

| Decision | Description |
|----------|-------------|
| **SERVICE** | Trains assigned for revenue service tomorrow |
| **STANDBY** | Backup trains ready at depot |
| **IBL** | Inspection Bay Line - maintenance, cleaning, detailing |

---

## ✨ Key Features

### 🤖 Dual AI Integration
| Service | Purpose |
|---------|---------|
| **Google Gemini** | Explanations, Copilot chat, Daily briefings |
| **Groq LLM** | Fast data parsing from CSV/PDF files |

### 📊 Production-Ready Infrastructure
| Component | Technology |
|-----------|------------|
| **Database** | PostgreSQL (Neon) with connection pooling |
| **File Storage** | Cloudinary for CSV/PDF documents |
| **Backend** | FastAPI with async support |
| **Frontend** | React + Tailwind CSS |
| **Optimizer** | OR-Tools CP-SAT constraint solver |

### 📁 Intelligent Data Ingestion
- **CSV Upload** - Direct parsing with AI column mapping
- **PDF Upload** - AI-powered document extraction
- **Cloud Storage** - Files stored in Cloudinary for audit
- **Schema Validation** - Automatic data validation

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- API Keys (see below)

### Environment Variables

Create `backend/.env`:

```env
# DATABASE - Neon PostgreSQL
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# AI - Google Gemini (explanations, copilot)
GEMINI_API_KEY=your_gemini_api_key

# AI - Groq LLM (data parsing)
GROQ_API_KEY=your_groq_api_key

# FILE STORAGE - Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Getting API Keys

| Service | Get Key At |
|---------|------------|
| **Neon DB** | https://neon.tech |
| **Gemini** | https://makersuite.google.com/app/apikey |
| **Groq** | https://console.groq.com |
| **Cloudinary** | https://cloudinary.com/console |

### Backend Setup

```powershell
cd backend

# Create & activate virtual environment
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Start server
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```powershell
cd frontend
npm install
npm run dev
```

### Access Application

| Service | URL |
|---------|-----|
| 🖥️ **Frontend** | http://localhost:3000 |
| 🔌 **API** | http://localhost:8000 |
| 📚 **API Docs** | http://localhost:8000/docs |
| 🔍 **Services Status** | http://localhost:8000/api/system/services |

---

## 📁 File Upload Guide

### Supported Formats
- **CSV** - Comma-separated values with headers
- **PDF** - Documents parsed by Groq LLM
- **TXT** - Plain text parsed by AI

### Upload Flow
```
File → Cloudinary (storage) → Groq LLM (parsing) → PostgreSQL (database)
```

### CSV Example

```csv
train_id,train_number,name,configuration,status,depot_id
TS-201,1,Trainset 1,3-car,active,MUTTOM
TS-202,2,Trainset 2,3-car,active,MUTTOM
```

### API Endpoints

```bash
# Upload with AI parsing
POST /api/upload/intelligent
  - file: (CSV/PDF file)
  - data_type: trains|certificates|job-cards|branding|mileage|cleaning
  - store_in_cloudinary: true|false

# Preview parsing
POST /api/upload/parse-preview

# Get schema
GET /api/upload/schema/{data_type}
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 KMRL Induction Planning System               │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Frontend (React + Tailwind)               │ │
│  │  Dashboard │ Planner │ Simulator │ Data Playground    │ │
│  └───────────────────────┬────────────────────────────────┘ │
│                          │ REST API                         │
│  ┌───────────────────────┴────────────────────────────────┐ │
│  │                   Backend (FastAPI)                    │ │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────────────┐ │ │
│  │  │  Optimizer │ │ AI Copilot │ │  File Processor    │ │ │
│  │  │ (OR-Tools) │ │ (Gemini)   │ │ (Groq+Cloudinary)  │ │ │
│  │  └────────────┘ └────────────┘ └────────────────────┘ │ │
│  │                        │                               │ │
│  │  ┌─────────────────────┴──────────────────────────┐   │ │
│  │  │            PostgreSQL (Neon DB)                 │   │ │
│  │  │  Trains │ Certs │ Jobs │ Branding │ Plans      │   │ │
│  │  └─────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
KMRL-Induction-Planner/
├── backend/
│   ├── app/
│   │   ├── models/           # SQLAlchemy models
│   │   │   ├── database.py   # PostgreSQL connection
│   │   │   ├── trains.py
│   │   │   ├── fitness_certificates.py
│   │   │   ├── job_cards.py
│   │   │   ├── branding.py
│   │   │   ├── mileage.py
│   │   │   ├── cleaning.py
│   │   │   ├── depot.py
│   │   │   └── plans.py
│   │   ├── services/
│   │   │   ├── optimizer.py       # OR-Tools solver
│   │   │   ├── ai_copilot.py      # Gemini integration
│   │   │   ├── file_processor.py  # Cloudinary + Groq
│   │   │   └── mock_data_generator.py
│   │   ├── config.py         # Environment config
│   │   └── main.py           # FastAPI app
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── InductionPlanner.jsx
│   │   │   ├── WhatIfSimulator.jsx
│   │   │   ├── DataPlayground.jsx    # File upload UI
│   │   │   └── ...
│   │   └── services/
│   │       └── api.js
│   └── package.json
├── SETUP.md              # Detailed setup guide
└── README.md
```

---

## 🔌 API Reference

### System Status
```
GET /api/system/services     # All services status
GET /api/system/database     # Database connection info
GET /api/system/ai-status    # AI features status
```

### Intelligent Upload
```
POST /api/upload/intelligent      # Upload + AI parse + save
POST /api/upload/parse-preview    # Preview without saving
GET  /api/upload/schema/{type}    # Get expected schema
```

### Core Operations
```
POST /api/plans/generate          # Generate induction plan
GET  /api/plans/{id}              # Get plan details
GET  /api/plans/{id}/explanation  # Get AI explanation
POST /api/scenarios/run           # Run what-if scenario
```

### AI Copilot
```
POST /api/copilot/chat            # Chat with AI
GET  /api/copilot/daily-briefing  # Daily ops briefing
POST /api/copilot/parse-scenario  # Parse NL scenario
```

---

## 🎯 Feature Matrix

| Feature | Gemini | Groq | Cloudinary | PostgreSQL |
|---------|--------|------|------------|------------|
| Plan Explanations | ✅ | | | |
| Copilot Chat | ✅ | | | |
| Daily Briefings | ✅ | | | |
| CSV Parsing | | ✅ | | |
| PDF Extraction | | ✅ | | |
| File Storage | | | ✅ | |
| Data Persistence | | | | ✅ |
| Connection Pooling | | | | ✅ |

---

## 🛠️ Troubleshooting

### "Database connection failed"
- Verify DATABASE_URL in .env
- Check Neon project is active
- Ensure `?sslmode=require` in URL

### "AI features disabled"
- Check GEMINI_API_KEY is set
- Verify key is valid at Google AI Studio

### "PDF parsing failed"
- Ensure GROQ_API_KEY is set
- Check file is readable PDF

### "File upload failed"
- Verify Cloudinary credentials
- Check file size < 10MB

---

## 👥 Team

**Smart India Hackathon 2025** - Grand Finale

---

<div align="center">

**Built with ❤️ for Kochi Metro Rail Limited**

*Automating train induction decisions for safer, more efficient metro operations*

</div>
