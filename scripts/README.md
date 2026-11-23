# Utility & Automation Scripts

This directory contains developer automation, database seeding, migration verification, and CI orchestration scripts for TechQuery AI.

## Roadmap & Planned Contents

- **`seed-taxonomy.ts`**: Seeds 150+ canonical software engineering skill tags into PostgreSQL. Scheduled for Phase A3.
- **`verify-env.ts`**: Validates that required environment variables conform to the Zod runtime schema before boot.
- **`clean.sh` / `clean.ps1`**: Utility scripts to wipe temporary build artifacts, Docker volumes, and test caches.

*Note: In accordance with Phase A1 scope rules, no database or operational scripts are executed during this repository organization milestone.*
