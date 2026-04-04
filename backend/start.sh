#!/usr/bin/env bash
set -e

echo "==> Running migrations..."
python manage.py migrate --noinput

echo "==> Collecting static files..."
python manage.py collectstatic --noinput

echo "==> Starting server..."
daphne -b 0.0.0.0 -p "${PORT:-8000}" config.asgi:application
