#!/usr/bin/env bash
set -euo pipefail

# Ensure project root is on PYTHONPATH for Alembic and scripts.
export PYTHONPATH="$(pwd)"

# Run migrations and seed data before starting the app.
alembic -c ./app/alembic.ini upgrade head
python app/seed_data.py

# Hand off to the container command (uvicorn by default, or overridden by docker-compose).
exec "$@"
