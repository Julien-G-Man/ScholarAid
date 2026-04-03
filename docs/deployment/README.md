# Deployment & Configuration

---

## Backend

### Local development

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The API is available at `http://localhost:8000/api/v1/`.

### Environment variables

Create `backend/.env` (see `backend/.env.example` for reference).

| Variable | Required | Default | Notes |
|---|---|---|---|
| `SECRET_KEY` | Yes (prod) | Insecure dev key | Django secret key |
| `DEBUG` | No | `True` | Set to `False` in production |
| `ALLOWED_HOSTS` | No | `localhost,127.0.0.1` | Comma-separated list |
| `FRONTEND_URL` | No | `http://localhost:3000` | Added to `CORS_ALLOWED_ORIGINS` |
| `DATABASE_URL` | No | Uses SQLite | PostgreSQL connection string for production |
| `DB_CONN_MAX_AGE` | No | `600` | DB connection keep-alive in seconds |
| `DB_SSL_REQUIRE` | No | `True` when `DEBUG=False` | Require SSL for database connection |
| `CSRF_TRUSTED_ORIGINS` | No | _(empty)_ | Comma-separated trusted origins for CSRF |
| `SECURE_SSL_REDIRECT` | No | `True` when `DEBUG=False` | Redirect HTTP to HTTPS |
| `SESSION_COOKIE_SECURE` | No | `True` when `DEBUG=False` | HTTPS-only session cookies |
| `CSRF_COOKIE_SECURE` | No | `True` when `DEBUG=False` | HTTPS-only CSRF cookies |
| `SECURE_HSTS_SECONDS` | No | `31536000` | HSTS duration (only applied when `DEBUG=False`) |

### Database

- **Development**: SQLite (`backend/db.sqlite3`) — zero config, used automatically when `DATABASE_URL` is not set.
- **Production**: Any PostgreSQL-compatible URL set via `DATABASE_URL`. Requires `dj-database-url` (already in `requirements.txt`). SSL is required by default in production.

### Static files

Static files are served by `whitenoise` in both development and production. Run `python manage.py collectstatic` before deploying.

### CORS

`CORS_ALLOWED_ORIGINS` is set to `[FRONTEND_URL]`. Only the configured frontend origin is allowed cross-origin access. Credentials (cookies) are permitted via `CORS_ALLOW_CREDENTIALS = True`.

### Production security checklist

When `DEBUG=False`, the following are automatically enabled:
- `SECURE_SSL_REDIRECT`
- `SESSION_COOKIE_SECURE`
- `CSRF_COOKIE_SECURE`
- `SECURE_HSTS_SECONDS = 31536000` with `INCLUDE_SUBDOMAINS` and `PRELOAD`
- `X_FRAME_OPTIONS = 'DENY'`
- `SECURE_PROXY_SSL_HEADER` is set for deployments behind a reverse proxy.

---

## Frontend

### Local development

```bash
cd frontend
npm install
npm run dev
```

The frontend is available at `http://localhost:3000`.

### Environment variables

Create `frontend/.env.local`:

| Variable | Required | Default | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:8000/api/v1` | Backend API base URL — used by both `axiosInstance` and `serverApi` |

### Changing the API base URL

`NEXT_PUBLIC_API_URL` is read by both:
- `frontend/src/services/axiosInstance.ts` — client-side requests
- `frontend/src/lib/serverApi.ts` — server-side fetch calls

Update this single variable and both layers will pick up the change.

### API versioning

The API version is encoded in the Django root URL config (`config/urls.py` includes `api/` under the `/api/v1/` prefix). If the version is bumped, update both the Django include and `NEXT_PUBLIC_API_URL` together.

---

## Health check

`GET /api/v1/health/` returns `{ "status": "healthy", "service": "ScholarAid API v1" }` with no authentication required. Use this endpoint for uptime monitoring and deployment readiness checks.
