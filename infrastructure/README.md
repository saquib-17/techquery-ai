# Infrastructure Configuration

This directory contains containerization, orchestration, and local service configuration files for TechQuery AI.

## PostgreSQL Setup for Local Development

TechQuery AI is engineered for 100% zero-cost development. You can run PostgreSQL locally using either Docker Compose or a native PostgreSQL service.

### Option A: Docker Compose (Recommended if Docker is installed)

To start the isolated PostgreSQL 16 container:

```bash
docker compose -f infrastructure/docker-compose.yml up -d
```

- **Container Name:** `techquery-postgres`
- **Port:** `5432`
- **Default User:** `techquery`
- **Default Password:** `techquery_secret`
- **Default Database:** `techquery_dev`
- **Volume:** `techquery_postgres_data` (persistent local storage)

To check database health:
```bash
docker compose -f infrastructure/docker-compose.yml ps
```

To stop:
```bash
docker compose -f infrastructure/docker-compose.yml down
```

### Option B: Native PostgreSQL Service (Direct Host Installation)

If Docker is unavailable (or Docker Desktop licensing is not suitable), use the local PostgreSQL service:
1. Ensure PostgreSQL (v16 or higher) is running on port `5432`.
2. Connect with admin privileges and initialize the user and databases:
   ```sql
   CREATE ROLE techquery WITH LOGIN SUPERUSER PASSWORD 'techquery_secret';
   CREATE DATABASE techquery_dev OWNER techquery;
   CREATE DATABASE techquery_test OWNER techquery;
   ```
3. Set your connection string in `.env.local`:
   ```env
   DATABASE_URL="postgresql://techquery:techquery_secret@127.0.0.1:5432/techquery_dev"
   ```

*Strict Rule: Redis, BullMQ, and cloud database services are NOT required for this milestone.*
