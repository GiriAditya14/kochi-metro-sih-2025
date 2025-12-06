# NeuralInduction AI - Backend API

Backend API for KMRL Train Induction Optimization System.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# Copy the template file
cp env.template .env
# Or manually create .env file with the following variables
# Edit .env with your configuration
```

3. Set up database:
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

4. (Optional) Seed database with sample data:
```bash
npm run prisma:seed
```

5. Start development server:
```bash
npm run dev
```

## Environment Variables

- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 3000)
- `DATABASE_URL`: PostgreSQL connection string
- `GROQ_API_KEY`: Groq API key for LLM integration
- `JWT_SECRET`: Secret for JWT tokens
- `CORS_ORIGIN`: Allowed CORS origin
- `LOG_LEVEL`: Logging level (info, warn, error)

## API Endpoints

### Data Ingestion
- `POST /api/v1/ingestion/maximo` - Ingest Maximo job cards
- `POST /api/v1/ingestion/fitness-certificate` - Update fitness certificates
- `POST /api/v1/ingestion/mileage` - Record mileage data
- `POST /api/v1/ingestion/whatsapp-log` - Process WhatsApp logs

### Agent Communication
- `POST /api/v1/agents/query` - Agent data queries
- `GET /api/v1/agents/train-status/:trainId` - Get comprehensive train status
- `POST /api/v1/agents/decision-submit` - Submit agent decisions

### Dashboard
- `GET /api/v1/dashboard/induction-list` - Get ranked induction list
- `POST /api/v1/dashboard/what-if` - Run what-if simulation
- `GET /api/v1/dashboard/conflicts` - Get conflict alerts
- `GET /api/v1/dashboard/digital-twin` - Get depot geometry data
- `POST /api/v1/dashboard/natural-language` - Process NL queries

### History
- `GET /api/v1/history/decisions` - Get historical decisions
- `POST /api/v1/history/feedback` - Submit decision feedback

## WebSocket Events

- `subscribe-decisions` - Subscribe to decision updates for a date
- `subscribe-conflicts` - Subscribe to conflict alerts
- `decision-updated` - Emitted when decision is updated
- `conflict-detected` - Emitted when conflict is detected

## Database

Uses Prisma ORM with PostgreSQL. Run migrations to set up schema:

```bash
npm run prisma:migrate
```

View database in Prisma Studio:

```bash
npm run prisma:studio
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── server.ts        # Entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seeding
└── package.json
```



