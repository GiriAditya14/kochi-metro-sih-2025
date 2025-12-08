# 🚀 KMRL Induction Planner - Setup Guide

## Environment Variables

Create a `.env` file in the `backend` folder with the following variables:

```env
# ===========================================
# DATABASE - Neon PostgreSQL (Required for Production)
# ===========================================
DATABASE_URL=postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# For local development, you can use SQLite:
# DATABASE_URL=sqlite:///./kmrl_induction.db

# ===========================================
# AI SERVICES
# ===========================================
# Google Gemini - for explanations and copilot
GEMINI_API_KEY=your_gemini_api_key

# Groq LLM - for fast data parsing from files
GROQ_API_KEY=your_groq_api_key

# ===========================================
# FILE STORAGE - Cloudinary
# ===========================================
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Or use the full URL:
# CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

---

## Getting API Keys

### 1. Neon PostgreSQL Database
1. Go to https://neon.tech
2. Create a free account
3. Create a new project
4. Copy the connection string from the dashboard

### 2. Google Gemini API
1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key

### 3. Groq API (for intelligent file parsing)
1. Go to https://console.groq.com
2. Create an account
3. Generate an API key
4. Copy the key

### 4. Cloudinary (for file storage)
1. Go to https://cloudinary.com
2. Create a free account
3. Go to Dashboard → Settings
4. Copy Cloud Name, API Key, and API Secret

---

## Installation

### Backend

```powershell
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables (Windows PowerShell)
$env:DATABASE_URL="your_neon_connection_string"
$env:GEMINI_API_KEY="your_gemini_key"
$env:GROQ_API_KEY="your_groq_key"
$env:CLOUDINARY_CLOUD_NAME="your_cloud_name"
$env:CLOUDINARY_API_KEY="your_api_key"
$env:CLOUDINARY_API_SECRET="your_api_secret"

# Start server
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

---

## Verify Services

After starting the backend, visit:

```
http://localhost:8000/api/system/services
```

You should see status of all services:

```json
{
  "services": {
    "database": {"type": "PostgreSQL (Neon)", "connected": true},
    "gemini_ai": {"enabled": true, "purpose": "Explanations, Copilot"},
    "groq_llm": {"enabled": true, "purpose": "Data Parsing, File Extraction"},
    "cloudinary": {"enabled": true, "purpose": "File Storage"}
  },
  "features": {
    "gemini_ai": true,
    "groq_llm": true,
    "cloudinary": true,
    "postgresql": true
  }
}
```

---

## Features by Service

| Service | Feature |
|---------|---------|
| **PostgreSQL (Neon)** | Production database, data persistence |
| **Gemini AI** | Plan explanations, Copilot chat, Daily briefings |
| **Groq LLM** | PDF parsing, intelligent CSV mapping, data extraction |
| **Cloudinary** | File storage for uploaded CSV/PDF files |

---

## Testing File Upload

### Upload a CSV file:
```bash
curl -X POST "http://localhost:8000/api/upload/intelligent" \
  -F "file=@trains.csv" \
  -F "data_type=trains" \
  -F "store_in_cloudinary=true"
```

### Upload a PDF file:
```bash
curl -X POST "http://localhost:8000/api/upload/intelligent" \
  -F "file=@maintenance_report.pdf" \
  -F "data_type=job-cards" \
  -F "store_in_cloudinary=true"
```

### Preview parsing without saving:
```bash
curl -X POST "http://localhost:8000/api/upload/parse-preview" \
  -F "file=@data.csv" \
  -F "data_type=certificates"
```

---

## Quick Demo

1. Open http://localhost:3000
2. Go to **Data Playground**
3. Upload a CSV or PDF file
4. System will:
   - Store file in Cloudinary
   - Parse using Groq LLM (for PDF) or direct parsing (for CSV)
   - Save structured data to PostgreSQL database
5. Generate a plan with AI explanations

---

## Troubleshooting

### "Database connection failed"
- Check DATABASE_URL is correct
- Ensure Neon project is active
- Verify SSL mode is set to `require`

### "Groq parsing failed"
- Check GROQ_API_KEY is valid
- Ensure file content is readable

### "Cloudinary upload failed"
- Verify all three credentials are set
- Check cloud name is correct

### "AI features disabled"
- Set GEMINI_API_KEY environment variable
- Restart backend after setting
