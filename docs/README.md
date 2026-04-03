# ScholarAid Docs

Developer documentation for the ScholarAid platform — an AI-powered scholarship management and application tool.

## Structure

| Folder | What it covers |
|---|---|
| [auth/](auth/) | JWT authentication — register, login, logout, profile, password change |
| [scholarships/](scholarships/) | Scholarship listing, filtering, and detail pages |
| [ai-review/](ai-review/) | AI essay review submission endpoint and UI |
| [core/](core/) | Newsletter subscriptions and contact form |
| [frontend/](frontend/) | Next.js app architecture, services layer, and routing |
| [deployment/](deployment/) | Environment variables, database setup, and production config |
| [project/](project/) | Project notes, implementation TODOs, and planning docs |

## Quick orientation

- **Backend**: Django 5 REST API, mounted at `/api/v1/`. Source in `backend/`.
- **Frontend**: Next.js 16 App Router. Source in `frontend/src/`.
- **Auth**: JWT via `djangorestframework-simplejwt`. Tokens stored in `localStorage`.
- **Database**: SQLite in development, PostgreSQL-ready in production (via `DATABASE_URL`).
